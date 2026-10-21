"""Cloudinary storage for the original uploaded files (PDFs and images).

Every file is uploaded as an *authenticated* asset: it has no public URL and can only be fetched
with an API-signed link. `view_url` / `download_url` hand out such links with a short expiry, and
`read_file` fetches the bytes server-side so the API can stream them behind its own auth.

All functions are blocking; call them with `run_in_threadpool`.
"""
import logging
import time
from io import BytesIO
from urllib.parse import quote

import cloudinary
import cloudinary.uploader
import cloudinary.utils
import urllib3

from app.core.config import settings

log = logging.getLogger(__name__)

_RESOURCE_TYPE = "image"  # Cloudinary stores PDFs and PNG/JPG/WEBP under the "image" resource type
_DELIVERY_TYPE = "authenticated"
_FORMATS = {"application/pdf": "pdf", "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}
_http = urllib3.PoolManager(timeout=urllib3.Timeout(connect=5, read=30), retries=urllib3.Retry(2, redirect=3))


class StorageNotConfigured(RuntimeError):
    """Cloudinary credentials are missing."""


def is_configured() -> bool:
    return all([settings.cloudinary_cloud_name, settings.cloudinary_api_key, settings.cloudinary_api_secret])


def _configure() -> None:
    if not is_configured():
        raise StorageNotConfigured("Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in backend/.env")
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )


def content_disposition(kind: str, filename: str) -> str:
    """`inline` / `attachment` header value that is safe for any file name (quotes, CR/LF, unicode)."""
    clean = "".join(c for c in filename if c.isprintable()).strip() or "document"
    ascii_name = clean.encode("ascii", "replace").decode().replace("?", "_").replace('"', "'").replace("\\", "_")
    return f"{kind}; filename=\"{ascii_name}\"; filename*=UTF-8''{quote(clean, safe='')}"


def _format(content_type: str) -> str:
    return _FORMATS[content_type]


def save_file(key: str, data: bytes, content_type: str) -> str:
    """Uploads the file and returns its Cloudinary public id (store it; every other call needs it)."""
    _configure()
    _format(content_type)  # reject anything we couldn't deliver again
    public_id = f"{settings.cloudinary_folder.strip('/')}/{key}" if settings.cloudinary_folder else key
    result = cloudinary.uploader.upload(
        BytesIO(data),
        public_id=public_id,
        resource_type=_RESOURCE_TYPE,
        type=_DELIVERY_TYPE,
        overwrite=False,
        unique_filename=False,
        use_filename=False,
    )
    return result["public_id"]


def _signed_url(public_id: str, content_type: str, *, minutes: int, attachment: bool) -> str:
    _configure()
    return cloudinary.utils.private_download_url(
        public_id,
        _format(content_type),
        resource_type=_RESOURCE_TYPE,
        type=_DELIVERY_TYPE,
        attachment=attachment or None,
        expires_at=int(time.time()) + minutes * 60,
    )


def view_url(public_id: str, content_type: str) -> str:
    return _signed_url(public_id, content_type, minutes=settings.view_url_minutes, attachment=False)


def download_url(public_id: str, content_type: str) -> str:
    return _signed_url(public_id, content_type, minutes=settings.download_url_minutes, attachment=True)


def read_file(public_id: str, content_type: str) -> bytes:
    """Fetches the original bytes server-side (the link never leaves the backend)."""
    resp = _http.request("GET", _signed_url(public_id, content_type, minutes=1, attachment=False))
    if resp.status != 200:
        raise FileNotFoundError(f"Cloudinary returned HTTP {resp.status}")
    return resp.data


def delete_file(public_id: str) -> None:
    _configure()
    result = cloudinary.uploader.destroy(public_id, resource_type=_RESOURCE_TYPE, type=_DELIVERY_TYPE, invalidate=True)
    if result.get("result") not in {"ok", "not found"}:  # "not found" = already gone, so delete stays idempotent
        raise RuntimeError(f"Cloudinary delete failed: {result}")
