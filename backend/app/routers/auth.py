import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import EmailStr
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    InvalidToken,
    create_token,
    decode_token,
    generate_otp,
    hash_otp,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.deps import get_current_user, get_setup_user
from app.models import FamilyMember, PasswordResetOTP, User
from app.schemas import (
    LoginIn,
    Message,
    OTPRequestIn,
    OTPRequestOut,
    RefreshIn,
    ResetIn,
    SetupIn,
    SignupIn,
    SignupOut,
    TokenPair,
    UserOut,
)

router = APIRouter(prefix="/auth", tags=["auth"])
log = logging.getLogger("vitals.auth")

_DUMMY_HASH = hash_password("timing-equaliser-1")


def _pair(user: User) -> TokenPair:
    sub = str(user.id)
    return TokenPair(
        access_token=create_token(sub, "access", timedelta(minutes=settings.access_token_minutes)),
        refresh_token=create_token(sub, "refresh", timedelta(days=settings.refresh_token_days)),
        user=UserOut.model_validate(user),
    )


@router.get("/email-available")
async def email_available(email: EmailStr = Query(...), db: AsyncSession = Depends(get_db)):
    found = await db.scalar(select(User.id).where(User.email == email.lower()))
    return {"available": found is None}


@router.post("/signup", response_model=SignupOut, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupIn, db: AsyncSession = Depends(get_db)):
    if await db.scalar(select(User.id).where(User.email == payload.email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")
    user = User(email=payload.email, hashed_password=hash_password(payload.password))
    db.add(user)
    try:
        await db.commit()
    except IntegrityError:  # lost a race with a parallel signup
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")
    token = create_token(str(user.id), "setup", timedelta(minutes=settings.setup_token_minutes))
    return SignupOut(setup_token=token)


@router.post("/setup", response_model=TokenPair)
async def setup(
    payload: SetupIn,
    user: User = Depends(get_setup_user),
    db: AsyncSession = Depends(get_db),
):
    if user.setup_complete:
        raise HTTPException(status.HTTP_409_CONFLICT, "Setup has already been completed")
    p = payload.user
    user.full_name = p.full_name
    user.date_of_birth = p.date_of_birth
    user.gender = p.gender
    user.phone_country_code = p.phone_country_code
    user.phone = p.phone
    user.setup_complete = True
    for m in payload.family_members:
        data = m.model_dump()
        data["relationship_type"] = data.pop("relationship")
        db.add(FamilyMember(owner_id=user.id, **data))
    await db.commit()
    return _pair(user)


@router.post("/login", response_model=TokenPair)
async def login(payload: LoginIn, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == payload.email))
    # always run a bcrypt verification so response time doesn't reveal which emails exist
    ok = verify_password(payload.password, user.hashed_password if user else _DUMMY_HASH)
    if not user or not ok:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    return _pair(user)


@router.post("/refresh", response_model=TokenPair)
async def refresh(payload: RefreshIn, db: AsyncSession = Depends(get_db)):
    try:
        user_id = int(decode_token(payload.refresh_token, {"refresh"}))
    except (InvalidToken, ValueError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token")
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token")
    return _pair(user)


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_setup_user)):
    return user


@router.post("/forgot-password/request-otp", response_model=OTPRequestOut)
async def request_otp(payload: OTPRequestIn, db: AsyncSession = Depends(get_db)):
    # Same response whether or not the account exists, so emails can't be enumerated.
    message = "If an account exists for this email, a 6-digit code has been sent."
    user = await db.scalar(select(User).where(User.email == payload.email))
    if not user:
        return OTPRequestOut(message=message)

    otp = generate_otp()
    await db.execute(delete(PasswordResetOTP).where(PasswordResetOTP.email == payload.email))
    db.add(
        PasswordResetOTP(
            email=payload.email,
            otp_hash=hash_otp(payload.email, otp),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.otp_ttl_minutes),
        )
    )
    await db.commit()
    # Simulated email delivery: replace this with your email provider.
    log.warning("[simulated email] password reset code for %s: %s", payload.email, otp)
    return OTPRequestOut(message=message, dev_otp=otp if settings.debug else None)


@router.post("/forgot-password/verify-reset", response_model=Message)
async def verify_reset(payload: ResetIn, db: AsyncSession = Depends(get_db)):
    invalid = HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired code")
    record = await db.scalar(
        select(PasswordResetOTP)
        .where(PasswordResetOTP.email == payload.email, PasswordResetOTP.used.is_(False))
        .order_by(PasswordResetOTP.id.desc())
    )
    if record is None:
        raise invalid
    expires = record.expires_at
    if expires.tzinfo is None:  # SQLite returns naive datetimes
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc) or record.attempts >= settings.otp_max_attempts:
        raise invalid

    import hmac

    if not hmac.compare_digest(record.otp_hash, hash_otp(payload.email, payload.otp)):
        record.attempts += 1
        await db.commit()
        raise invalid

    user = await db.scalar(select(User).where(User.email == payload.email))
    if user is None:
        raise invalid
    user.hashed_password = hash_password(payload.new_password)
    record.used = True
    await db.commit()
    return Message(message="Password updated. You can sign in with your new password.")
