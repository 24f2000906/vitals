"""ChromaDB index of document text chunks (for retrieval / Ask-AI), embedded with NVIDIA.

Embeddings come from NVIDIA's hosted OpenAI-compatible endpoint (`POST {base_url}/embeddings`).
Chunks are embedded as "passage" and searches as "query", which NVIDIA's retrieval models require.
Chroma's built-in default model is not used anywhere.

Settings (app/core/config.py / .env):
    NVIDIA_API_KEY=nvapi-...
    NVIDIA_EMBEDDING_MODEL=nvidia/...   (a retrieval embedding model from build.nvidia.com)
    NVIDIA_BASE_URL=...                 (optional; defaults to https://integrate.api.nvidia.com/v1)

Blocking calls; use `run_in_threadpool`. The collection is created lazily so importing the app
never touches the network.
"""
import logging
import time
from functools import lru_cache

import chromadb
import httpx
from chromadb.config import Settings as ChromaSettings

from app.core.config import settings

log = logging.getLogger(__name__)

DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1"

_BATCH_SIZE = 16  # inputs per request, kept small to stay under the API's per-request limit
_RETRY_STATUS = {429, 500, 502, 503, 504}


@lru_cache
def _http() -> httpx.Client:
    return httpx.Client(timeout=httpx.Timeout(60, connect=10))


class NvidiaEmbedding(chromadb.EmbeddingFunction):
    """Chroma embedding function backed by NVIDIA's embeddings API.

    The API key is read when text is embedded, never stored in Chroma, so deleting documents
    works even if the key is missing.
    """

    def __init__(self, model: str, base_url: str = DEFAULT_BASE_URL):
        self.model = model
        self.base_url = base_url.rstrip("/")

    @staticmethod
    def name() -> str:
        return "nvidia-embeddings"

    def get_config(self) -> dict:
        return {"model": self.model, "base_url": self.base_url}

    @staticmethod
    def build_from_config(config: dict) -> "NvidiaEmbedding":
        return NvidiaEmbedding(config["model"], config.get("base_url") or DEFAULT_BASE_URL)

    def __call__(self, input):  # documents being indexed
        return self._embed(list(input), "passage")

    def embed_query(self, input):  # a search query
        return self._embed(list(input), "query")

    def _embed(self, texts: list[str], input_type: str) -> list[list[float]]:
        api_key = settings.embedding_model_api_key
        if not api_key:
            raise RuntimeError(f"NVIDIA embedding api key is not configured")
        vectors: list[list[float]] = []
        for start in range(0, len(texts), _BATCH_SIZE):
            vectors.extend(self._post(texts[start : start + _BATCH_SIZE], input_type, api_key))
        return vectors

    def _post(self, batch: list[str], input_type: str, api_key: str) -> list[list[float]]:
        body = {"model": self.model, "input": batch, "input_type": input_type, "truncate": "END", "encoding_format": "float"}
        headers = {"Authorization": f"Bearer {api_key}", "Accept": "application/json"}
        last_error = "no response"
        for attempt in range(3):
            try:
                resp = _http().post(f"{self.base_url}/embeddings", json=body, headers=headers)
            except httpx.TransportError as exc:
                last_error = type(exc).__name__
            else:
                if resp.status_code == 200:
                    items = sorted(resp.json()["data"], key=lambda item: item["index"])
                    if len(items) != len(batch):
                        raise RuntimeError(f"NVIDIA returned {len(items)} embeddings for {len(batch)} inputs")
                    return [item["embedding"] for item in items]
                last_error = f"HTTP {resp.status_code}"  # the body is not logged: it can echo document text
                if resp.status_code not in _RETRY_STATUS:
                    break
            if attempt < 2:
                time.sleep(2**attempt)
        raise RuntimeError(f"NVIDIA embeddings request failed ({last_error})")


def chunk_text(text: str, size: int | None = None, overlap: int | None = None) -> list[str]:
    """Fixed-size character windows; consecutive chunks share `overlap` characters."""
    size = size or settings.chunk_size
    overlap = settings.chunk_overlap if overlap is None else overlap
    if overlap >= size:
        raise ValueError("chunk overlap must be smaller than chunk size")
    text = text.strip()
    step = size - overlap
    chunks = []
    for start in range(0, len(text), step):
        piece = text[start : start + size].strip()
        if piece:
            chunks.append(piece)
        if start + size >= len(text):
            break
    return chunks


def _different_model_error(model: str) -> RuntimeError:
    return RuntimeError(
        f"The ChromaDB collection '{settings.chroma_collection}' in {settings.chroma_path} was built with a different "
        f"embedding model than '{model}'. Stop the backend, delete that folder (or set CHROMA_COLLECTION to a new "
        "name) and upload your documents again."
    )


@lru_cache
def get_collection():
    model = settings.embedding_model
    if not model:
        raise RuntimeError(f"NVIDIA embedding model is not configured")
    embedder = NvidiaEmbedding(model, DEFAULT_BASE_URL)
    client = chromadb.PersistentClient(
        path=str(settings.chroma_path),
        settings=ChromaSettings(anonymized_telemetry=False),  # medical data: no telemetry
    )
    try:
        collection = client.get_or_create_collection(
            settings.chroma_collection,
            embedding_function=embedder,
            metadata={"hnsw:space": "cosine", "embedding_model": model},
        )
    except ValueError as exc:  # e.g. a collection created earlier with Chroma's default model
        raise _different_model_error(model) from exc
    if (collection.metadata or {}).get("embedding_model") != model:  # vectors from another model must not mix
        raise _different_model_error(model)
    return collection


def index_document(document_id: str, user_id: str, text: str, member_id: int | None = None) -> int:
    chunks = chunk_text(text)
    if not chunks:
        return 0
    m_id = member_id if member_id is not None else 0
    get_collection().add(
        ids=[f"{document_id}:{i}" for i in range(len(chunks))],
        documents=chunks,
        metadatas=[{"document_id": document_id, "user_id": user_id, "member_id": m_id} for _ in chunks],
    )
    return len(chunks)


def delete_document(document_id: str) -> None:
    get_collection().delete(where={"document_id": document_id})
