from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.deps import get_current_user
from app.models import FamilyMember, User
from app.schemas import FamilyMemberIn, FamilyMemberOut

router = APIRouter(prefix="/family", tags=["family"])


@router.get("/members", response_model=list[FamilyMemberOut])
async def list_members(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = await db.scalars(
        select(FamilyMember).where(FamilyMember.owner_id == user.id).order_by(FamilyMember.id)
    )
    return list(rows)


@router.post("/members", response_model=FamilyMemberOut, status_code=status.HTTP_201_CREATED)
async def add_member(
    payload: FamilyMemberIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = payload.model_dump()
    data["relationship_type"] = data.pop("relationship")
    member = FamilyMember(owner_id=user.id, **data)
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member
