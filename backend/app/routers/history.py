"""CRUD for medical history entries (conditions, treatments, allergies)."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.deps import get_current_user
from app.models import FamilyMember, MedicalHistory, User
from app.schemas import HistoryIn, HistoryOut
from app.routers.profile import invalidate_profile_summary

router = APIRouter(prefix="/history", tags=["history"])


async def _check_member(db: AsyncSession, member_id: Optional[int], user: User) -> None:
    if member_id is None:
        return
    member = await db.get(FamilyMember, member_id)
    if member is None or member.owner_id != user.id:
        raise HTTPException(404, "Family member not found")


@router.get("", response_model=list[HistoryOut])
async def list_history(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = await db.scalars(
        select(MedicalHistory)
        .where(MedicalHistory.owner_id == user.id)
        .order_by(MedicalHistory.created_at.desc())
    )
    return list(rows)


@router.post("", response_model=HistoryOut, status_code=status.HTTP_201_CREATED)
async def add_history(
    payload: HistoryIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_member(db, payload.member_id, user)
    entry = MedicalHistory(
        owner_id=user.id,
        member_id=payload.member_id,
        kind=payload.kind,
        title=payload.title,
        status=payload.status,
        start_date=payload.start_date or None,
        end_date=payload.end_date or None,
        notes=payload.notes or None,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    await invalidate_profile_summary(db, user.id, payload.member_id)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_history(
    entry_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    entry = await db.get(MedicalHistory, entry_id)
    if entry is None or entry.owner_id != user.id:
        raise HTTPException(404, "History entry not found")
    target_member_id = entry.member_id
    await db.delete(entry)
    await db.commit()
    await invalidate_profile_summary(db, user.id, target_member_id)
