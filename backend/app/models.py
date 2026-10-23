from datetime import date, datetime, timezone
from typing import Any, Optional
from uuid import uuid4

from sqlalchemy import JSON, Boolean, Date, DateTime, ForeignKey, Integer, String, Text, cast
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[Optional[str]] = mapped_column(String(120))
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date)
    gender: Mapped[Optional[str]] = mapped_column(String(16))
    phone_country_code: Mapped[Optional[str]] = mapped_column(String(8))
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    setup_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    family_members: Mapped[list["FamilyMember"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )
    documents: Mapped[list["Document"]] = relationship(
        back_populates="owner",
        cascade="all, delete-orphan",
        primaryjoin="foreign(Document.user_id) == cast(User.id, String)",
    )


class FamilyMember(Base):
    __tablename__ = "family_members"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    date_of_birth: Mapped[date] = mapped_column(Date)
    gender: Mapped[str] = mapped_column(String(16))
    email: Mapped[Optional[str]] = mapped_column(String(255))
    phone_country_code: Mapped[Optional[str]] = mapped_column(String(8))
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    relationship_type: Mapped[str] = mapped_column("relationship", String(16))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    owner: Mapped[User] = relationship(back_populates="family_members")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    title: Mapped[str] = mapped_column(String(255))
    document_type: Mapped[str] = mapped_column(String(50), default="lab_report")  # 'prescription', 'lab_report', 'discharge_summary', 'other'
    file_path: Mapped[str] = mapped_column(String(512))    # Cloudinary public id (e.g. 'vitals/users/{user_id}/{doc_id}/{name}')
    file_name: Mapped[str] = mapped_column(String(255))    # Original file name for downloads
    file_mime_type: Mapped[str] = mapped_column(String(100)) # 'application/pdf', 'image/png', 'image/jpeg', 'image/webp'
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    # Extended fields for full Vitals vault & metrics functionality:
    member_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("family_members.id", ondelete="SET NULL"), index=True, nullable=True
    )  # NULL = belongs to the account holder
    size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(16), default="Parsed")  # Parsed | Extracting | Flagged
    extracted: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

    owner: Mapped[User] = relationship(
        back_populates="documents",
        primaryjoin="foreign(Document.user_id) == cast(User.id, String)",
    )

    @property
    def filename(self) -> str:
        return self.file_name

    @filename.setter
    def filename(self, val: str) -> None:
        self.file_name = val

    @property
    def content_type(self) -> str:
        return self.file_mime_type

    @content_type.setter
    def content_type(self, val: str) -> None:
        self.file_mime_type = val

    @property
    def owner_id(self) -> Optional[int]:
        try:
            return int(self.user_id)
        except (ValueError, TypeError):
            return None

    @owner_id.setter
    def owner_id(self, val: Any) -> None:
        self.user_id = str(val)


class MedicalHistory(Base):
    __tablename__ = "medical_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    member_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("family_members.id", ondelete="CASCADE"), index=True, nullable=True
    )  # NULL = belongs to account holder
    kind: Mapped[str] = mapped_column(String(16))   # "condition" | "treatment" | "allergy"
    title: Mapped[str] = mapped_column(String(160))
    status: Mapped[str] = mapped_column(String(16), default="active")  # "active" | "resolved"
    start_date: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # ISO date string
    end_date: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    owner: Mapped[User] = relationship("User")


class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), index=True)
    otp_hash: Mapped[str] = mapped_column(String(64))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    used: Mapped[bool] = mapped_column(Boolean, default=False)


class ProfileSummary(Base):
    __tablename__ = "profile_summaries"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    member_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("family_members.id", ondelete="CASCADE"), index=True, nullable=True
    )  # NULL = belongs to account holder, int = family member
    summary: Mapped[str] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(32), default="nvidia")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    owner: Mapped[User] = relationship("User")

