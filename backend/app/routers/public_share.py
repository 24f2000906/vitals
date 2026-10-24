"""Public QR share router: allows viewing a user's health profile via their permanent share_code without login."""
from datetime import date
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import Document, FamilyMember, MedicalHistory, ProfileSummary, User
from app.schemas import HistoryOut, PublicProfileOut

router = APIRouter(prefix="/public", tags=["public"])


def _calc_age(dob: Optional[date]) -> Optional[str]:
    if not dob:
        return None
    today = date.today()
    years = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    return f"{years} yrs"


@router.get("/profile/{share_code}", response_model=PublicProfileOut)
async def get_public_profile(share_code: str, db: AsyncSession = Depends(get_db)):
    code = share_code.strip()
    if not code:
        raise HTTPException(404, "Invalid share code")

    # 1. Search primary users
    user = await db.scalar(select(User).where(User.share_code == code))
    if user:
        owner_id = user.id
        name = user.full_name or "Account Holder"
        dob = user.date_of_birth
        gender = user.gender
        relationship = "Self"
        doc_clause = Document.member_id.is_(None)
        hist_clause = MedicalHistory.member_id.is_(None)
        summary_clause = ProfileSummary.member_id.is_(None)
    else:
        # 2. Search family members
        member = await db.scalar(select(FamilyMember).where(FamilyMember.share_code == code))
        if not member:
            raise HTTPException(404, "Health profile not found. This QR code may be invalid or expired.")
        owner_id = member.owner_id
        name = member.name
        dob = member.date_of_birth
        gender = member.gender
        relationship = (member.relationship_type or "Family Member").capitalize()
        doc_clause = (Document.member_id == member.id)
        hist_clause = (MedicalHistory.member_id == member.id)
        summary_clause = (ProfileSummary.member_id == member.id)

    # 3. Documents on file
    docs = await db.scalars(
        select(Document).where(Document.user_id == str(owner_id), doc_clause).order_by(Document.created_at.desc())
    )
    doc_list = list(docs)

    # 4. Medical history entries
    history_entries = await db.scalars(
        select(MedicalHistory)
        .where(MedicalHistory.owner_id == owner_id, hist_clause)
        .order_by(MedicalHistory.created_at.desc())
    )
    history_list = [HistoryOut.model_validate(h) for h in history_entries]

    # 5. AI Medical Summary
    summary_row = await db.scalar(
        select(ProfileSummary).where(ProfileSummary.user_id == owner_id, summary_clause)
    )
    ai_summary = summary_row.summary if summary_row else None
    summary_source = summary_row.source if summary_row else None

    # 6. Aggregate latest readings and findings from documents
    readings: list[dict[str, Any]] = []
    findings: list[dict[str, Any]] = []
    seen_metrics: set[str] = set()

    for d in doc_list:
        ext = d.extracted or {}
        for r in ext.get("readings", []):
            key = str(r.get("metric_key") or r.get("name") or "").lower()
            if key and key not in seen_metrics:
                seen_metrics.add(key)
                readings.append(r)
        for f in ext.get("findings", []):
            findings.append(f)

    return PublicProfileOut(
        share_code=code,
        name=name,
        date_of_birth=dob,
        age=_calc_age(dob),
        gender=gender,
        relationship=relationship,
        document_count=len(doc_list),
        history=history_list,
        readings=readings[:12],
        findings=findings[:8],
        ai_summary=ai_summary,
        summary_source=summary_source,
    )
