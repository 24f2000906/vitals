import asyncio
import logging
import re
from pathlib import Path
from typing import Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import SessionLocal, get_db
from app.deps import get_current_user
from app.models import Document, FamilyMember, User
from app.schemas import DeleteOut, DocumentOut, DownloadUrlOut, ViewUrlOut
from app.services import storage, vectorstore
from app.services.parser import parse_with_text, sniff

log = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["documents"])

DOCUMENT_TYPES = {"prescription", "lab_report", "discharge_summary", "other"}


def _safe_stem(name: str) -> str:
    """File name (without extension) that is safe inside a Cloudinary public id."""
    return re.sub(r"[^A-Za-z0-9_-]+", "_", Path(name).stem).strip("_")[:100] or "document"


def _unavailable(exc: Exception) -> HTTPException:
    if isinstance(exc, storage.StorageNotConfigured):
        return HTTPException(503, "File storage isn't set up yet: add your Cloudinary keys to backend/.env.")
    return HTTPException(503, "File storage is unavailable right now. Try again in a moment.")


async def _owned_document(db: AsyncSession, doc_id: UUID, user: User) -> Document:
    doc = await db.get(Document, str(doc_id))
    # 404 (not 403) for other people's documents so ids can't be probed
    if doc is None or doc.user_id != str(user.id):
        raise HTTPException(404, "Document not found")
    return doc


async def finalize_document(doc_id: str) -> None:
    """Stand-in for an OCR/LLM extraction queue: files with no text layer finish with metadata only."""
    await asyncio.sleep(2)
    async with SessionLocal() as db:
        doc = await db.get(Document, doc_id)
        if doc is None:  # deleted while "extracting"
            return
        extracted = dict(doc.extracted)
        extracted["notes"] = [*extracted.get("notes", []), "No text layer found and no OCR engine is configured; metadata only."]
        doc.extracted = extracted  # reassign so SQLAlchemy sees the JSON change
        doc.status = "Parsed"
        await db.commit()


@router.post("/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload(
    background: BackgroundTasks,
    file: UploadFile = File(...),
    member_id: Optional[int] = Form(None),
    title: Optional[str] = Form(None),
    document_type: str = Form("lab_report"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # the owner always comes from the access token, never from a client-supplied user_id
    if document_type not in DOCUMENT_TYPES:
        raise HTTPException(422, f"document_type must be one of: {', '.join(sorted(DOCUMENT_TYPES))}")

    limit = settings.max_upload_mb * 1024 * 1024
    data = await file.read(limit + 1)
    if len(data) > limit:
        raise HTTPException(413, f"File is larger than {settings.max_upload_mb} MB")
    kind = sniff(data)
    if kind is None:
        raise HTTPException(415, "Only PDF, PNG, JPG and WEBP files are supported")

    if member_id is not None:
        member = await db.get(FamilyMember, member_id)
        if member is None or member.owner_id != user.id:
            raise HTTPException(404, "Family member not found")

    try:
        extracted, text = await run_in_threadpool(parse_with_text, data, kind.content_type)
    except Exception:
        raise HTTPException(422, "This file could not be read. It may be corrupted or password-protected.")

    file_name = Path(file.filename or "document").name[:200]
    doc_id = str(uuid4())
    key = f"users/{user.id}/{doc_id}/{_safe_stem(file_name)}"

    # Step A: Cloudinary
    try:
        object_key = await run_in_threadpool(storage.save_file, key, data, kind.content_type)
    except Exception as exc:
        log.exception("Cloudinary upload failed for %s", key)
        raise _unavailable(exc)

    # Step B: PostgreSQL (or SQLite in dev)
    if extracted["text_extracted"]:
        doc_status = "Flagged" if extracted["flags"] else "Parsed"
    else:
        doc_status = "Extracting"
    doc = Document(
        id=doc_id,
        user_id=str(user.id),
        member_id=member_id,
        title=(title or "").strip()[:255] or Path(file_name).stem[:255] or "Untitled",
        document_type=document_type,
        file_path=object_key,
        file_name=file_name,
        file_mime_type=kind.content_type,
        size_bytes=len(data),
        status=doc_status,
        extracted=extracted,
    )
    db.add(doc)
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        await run_in_threadpool(_discard_object, object_key)  # don't leave an orphan in Cloudinary
        raise
    await db.refresh(doc)

    # Step C: ChromaDB. The document is already safely stored, so an indexing failure is reported
    # on the document instead of failing (and losing) the upload.
    if text.strip():
        try:
            await run_in_threadpool(vectorstore.index_document, doc_id, str(user.id), text)
        except Exception:
            log.exception("Vector indexing failed for document %s", doc_id)
            await run_in_threadpool(_discard_vectors, doc_id)  # no half-indexed documents
            doc.extracted = {**doc.extracted, "notes": [*doc.extracted.get("notes", []), "Saved, but it couldn't be indexed for search yet."]}
            await db.commit()
            await db.refresh(doc)

    if doc_status == "Extracting":
        background.add_task(finalize_document, doc.id)
    return doc


def _discard_object(key: str) -> None:
    try:
        storage.delete_file(key)
    except Exception:
        log.exception("Could not clean up orphaned object %s", key)


def _discard_vectors(doc_id: str) -> None:
    try:
        vectorstore.delete_document(doc_id)
    except Exception:
        log.exception("Could not clean up vectors for %s", doc_id)


@router.get("/all", response_model=list[DocumentOut])
async def list_documents(
    member_id: Optional[int] = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Document).where(Document.user_id == str(user.id))
    if member_id is not None:
        stmt = stmt.where(Document.member_id == member_id)
    rows = await db.scalars(stmt.order_by(Document.created_at.desc(), Document.id.desc()))
    return list(rows)


@router.get("/{doc_id}/file")
async def get_file(doc_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Original bytes streamed through the API (auth header required). Kept for existing clients."""
    doc = await _owned_document(db, doc_id, user)
    try:
        data = await run_in_threadpool(storage.read_file, doc.file_path, doc.file_mime_type)
    except Exception as exc:
        log.exception("Cloudinary read failed for %s", doc.file_path)
        raise _unavailable(exc) if isinstance(exc, storage.StorageNotConfigured) else HTTPException(404, "File is missing from storage")
    return Response(
        data,
        media_type=doc.file_mime_type,
        headers={"Content-Disposition": storage.content_disposition("inline", doc.file_name)},
    )


@router.get("/{doc_id}/view", response_model=ViewUrlOut)
async def view_document(doc_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    doc = await _owned_document(db, doc_id, user)
    try:
        url = await run_in_threadpool(storage.view_url, doc.file_path, doc.file_mime_type)
    except Exception as exc:
        raise _unavailable(exc)
    return ViewUrlOut(view_url=url, file_mime_type=doc.file_mime_type)


@router.get("/{doc_id}/download", response_model=DownloadUrlOut)
async def download_document(doc_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    doc = await _owned_document(db, doc_id, user)
    try:
        url = await run_in_threadpool(storage.download_url, doc.file_path, doc.file_mime_type)
    except Exception as exc:
        raise _unavailable(exc)
    return DownloadUrlOut(download_url=url)


@router.delete("/{doc_id}", response_model=DeleteOut)
async def delete_document(doc_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Permanent delete across all three stores.

    The database row goes last: if the vector store or Cloudinary fails, the row survives so the
    user can simply retry (each earlier step is idempotent) instead of leaving unreachable data behind.
    """
    doc = await _owned_document(db, doc_id, user)
    try:
        await run_in_threadpool(vectorstore.delete_document, doc.id)  # 1. ChromaDB
        await run_in_threadpool(storage.delete_file, doc.file_path)  # 2. Cloudinary
    except Exception:
        log.exception("Hard delete failed for document %s", doc.id)
        raise HTTPException(502, "Couldn't fully delete this document. Nothing was lost; please try again.")
    await db.delete(doc)  # 3. database
    await db.commit()
    return DeleteOut(document_id=str(doc_id))
