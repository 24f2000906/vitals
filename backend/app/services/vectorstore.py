"""ChromaDB index of document text chunks (for retrieval / Ask-AI).

Blocking calls; use `run_in_threadpool`. The collection is created lazily so importing the app never
loads the embedding model (Chroma's default model is downloaded on first use).
"""
from functools import lru_cache

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.core.config import settings


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


@lru_cache
def get_collection():
    client = chromadb.PersistentClient(
        path=str(settings.chroma_path),
        settings=ChromaSettings(anonymized_telemetry=False),  # medical data: no telemetry
    )
    return client.get_or_create_collection(settings.chroma_collection)


def index_document(document_id: str, user_id: str, text: str) -> int:
    chunks = chunk_text(text)
    if not chunks:
        return 0
    get_collection().add(
        ids=[f"{document_id}:{i}" for i in range(len(chunks))],
        documents=chunks,
        metadatas=[{"document_id": document_id, "user_id": user_id} for _ in chunks],
    )
    return len(chunks)


def delete_document(document_id: str) -> None:
    get_collection().delete(where={"document_id": document_id})
