"""Profile endpoint: AI-generated medical summary from ChromaDB vectors + NVIDIA text model."""
import logging
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.deps import get_current_user
from app.models import Document, FamilyMember, ProfileSummary, User, utcnow
from app.schemas import ProfileSummaryOut
from app.services import vectorstore

log = logging.getLogger(__name__)
router = APIRouter(prefix="/profile", tags=["profile"])

NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
_SYSTEM_PROMPT = (
    "You are a clinical documentation assistant for VITALS, an AI-powered medical health locker. "
    "Your task is to write a concise, professional medical summary paragraph for a patient based on "
    "their uploaded medical document excerpts. Focus on key health indicators, diagnoses, treatments, "
    "and any flagged abnormal values. Write in third person (e.g., 'The patient...'). "
    "Keep the summary to 2-4 sentences. Do not invent information not present in the documents. "
    "End with a note that this is an AI-generated summary for informational purposes only."
)


async def invalidate_profile_summary(db: AsyncSession, user_id: int, member_id: Optional[int]) -> None:
    """Invalidate cached summary when documents or profile data change."""
    stmt = delete(ProfileSummary).where(
        ProfileSummary.user_id == user_id,
        ProfileSummary.member_id.is_(None) if member_id is None else ProfileSummary.member_id == member_id,
    )
    await db.execute(stmt)
    await db.commit()


def _fetch_context(user_id: str, doc_ids: list[str], n_results: int = 10) -> str:
    """Retrieve top-k relevant chunks from ChromaDB for these specific documents."""
    if not doc_ids:
        return ""
    try:
        col = vectorstore.get_collection()
        if len(doc_ids) == 1:
            where_filter: dict = {"document_id": doc_ids[0]}
        else:
            where_filter = {"document_id": {"$in": doc_ids}}
        results = col.query(
            query_texts=["medical health summary blood pressure cholesterol HbA1c diagnosis vitals"],
            n_results=min(n_results, max(len(doc_ids) * 4, 4)),
            where=where_filter,
            include=["documents"],
        )
        docs = results.get("documents", [[]])[0]
        return "\n\n".join(docs) if docs else ""
    except Exception as exc:
        log.warning("ChromaDB query failed: %s", exc)
        return ""


def _call_nvidia(context: str, patient_name: str) -> str:
    """Call NVIDIA text model to generate a medical summary."""
    api_key = settings.text_model_api_key
    model = settings.text_model
    if not api_key or not model:
        raise RuntimeError("NVIDIA text model not configured")

    user_msg = (
        f"Patient name: {patient_name}\n\n"
        f"Extracted medical document text:\n{context or 'No document text available.'}\n\n"
        "Please write a concise medical summary paragraph for this patient."
    )

    resp = httpx.post(
        f"{NVIDIA_BASE_URL}/chat/completions",
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_msg},
            ],
            "temperature": 0.2,
            "max_tokens": 300,
            "stream": False,
        },
        headers={"Authorization": f"Bearer {api_key}", "Accept": "application/json"},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"].strip()


def _fallback_summary(context: str, history_count: int, doc_count: int) -> str:
    """Plain-text summary when NVIDIA is unavailable."""
    parts = []
    if doc_count:
        parts.append(f"{doc_count} medical document{'s' if doc_count != 1 else ''} on file")
    if history_count:
        parts.append(f"{history_count} medical history entr{'ies' if history_count != 1 else 'y'} recorded")
    if not parts:
        return "No medical data has been uploaded for this profile yet."
    return f"{', '.join(parts).capitalize()}. AI summary generated from current vault records."


@router.get("/summary", response_model=ProfileSummaryOut)
async def get_profile_summary(
    member_id: Optional[int] = Query(None),
    refresh: bool = Query(False),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # 1. Identify target profile and verify ownership
    if member_id is None:
        patient_name = user.full_name or "Account Holder"
        member_filter = Document.member_id.is_(None)
        cache_filter = ProfileSummary.member_id.is_(None)
    else:
        member = await db.get(FamilyMember, member_id)
        if member is None or member.owner_id != user.id:
            raise HTTPException(404, "Family member not found")
        patient_name = member.name
        member_filter = (Document.member_id == member_id)
        cache_filter = (ProfileSummary.member_id == member_id)

    # 2. Query documents belonging specifically to this member / account holder
    doc_rows = await db.scalars(
        select(Document).where(Document.user_id == str(user.id), member_filter)
    )
    doc_list = list(doc_rows)

    # 3. If there are NO documents related to this member, return no AI summary
    if not doc_list:
        # Clear any stale summary row if it exists
        await db.execute(
            delete(ProfileSummary).where(ProfileSummary.user_id == user.id, cache_filter)
        )
        await db.commit()
        return ProfileSummaryOut(summary=None, source="none")

    # 4. Check for existing cached summary unless forced refresh
    if not refresh:
        stmt = select(ProfileSummary).where(ProfileSummary.user_id == user.id, cache_filter)
        cached = await db.scalar(stmt)
        if cached and cached.summary:
            return ProfileSummaryOut(summary=cached.summary, source=cached.source)

    # 5. Build context from ChromaDB for these specific documents
    doc_ids = [d.id for d in doc_list]
    context = await run_in_threadpool(_fetch_context, str(user.id), doc_ids)

    if not context:
        # If vector chunks are empty, use extracted document metadata as context
        doc_titles = ", ".join([f"{d.title} ({d.document_type})" for d in doc_list])
        context = f"Medical documents on file: {doc_titles}"

    # 6. Call NVIDIA text model (with fallback)
    try:
        summary_text = await run_in_threadpool(_call_nvidia, context, patient_name)
        source = "nvidia"
    except Exception as exc:
        log.warning("NVIDIA text model failed: %s", exc)
        summary_text = _fallback_summary(context, 0, len(doc_list))
        source = "fallback"

    # 7. Persist or update cached summary in database
    stmt = select(ProfileSummary).where(ProfileSummary.user_id == user.id, cache_filter)
    cached = await db.scalar(stmt)
    if cached:
        cached.summary = summary_text
        cached.source = source
        cached.updated_at = utcnow()
    else:
        new_summary = ProfileSummary(
            user_id=user.id,
            member_id=member_id,
            summary=summary_text,
            source=source,
        )
        db.add(new_summary)
    await db.commit()

    return ProfileSummaryOut(summary=summary_text, source=source)
