from datetime import date, datetime
from typing import Annotated, Any, Literal, Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    StringConstraints,
    computed_field,
    field_validator,
)

Gender = Literal["male", "female", "other"]
Relationship = Literal["spouse", "child", "parent", "sibling", "other"]
DocStatus = Literal["Parsed", "Extracting", "Flagged"]

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
# bcrypt only uses the first 72 bytes, so cap the length instead of silently truncating
Password = Annotated[str, Field(min_length=8, max_length=72)]
CountryCode = Annotated[str, StringConstraints(pattern=r"^\+\d{1,4}$")]
PhoneDigits = Annotated[str, StringConstraints(pattern=r"^\d{6,14}$")]


def _check_password(v: str) -> str:
    if not any(c.isalpha() for c in v) or not any(c.isdigit() for c in v):
        raise ValueError("Password must include at least one letter and one number")
    return v


def _check_dob(v: date) -> date:
    if v > date.today() or v.year < 1900:
        raise ValueError("Enter a valid date of birth")
    return v


# ---------- auth ----------
class SignupIn(BaseModel):
    email: EmailStr
    password: Password

    _pw = field_validator("password")(_check_password)

    @field_validator("email")
    @classmethod
    def _lower(cls, v: str) -> str:
        return v.lower()


class SignupOut(BaseModel):
    setup_token: str
    token_type: str = "bearer"


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def _lower(cls, v: str) -> str:
        return v.lower()


class UserProfileIn(BaseModel):
    full_name: Name
    date_of_birth: date
    gender: Gender
    phone_country_code: CountryCode
    phone: PhoneDigits

    _dob = field_validator("date_of_birth")(_check_dob)


class FamilyMemberIn(BaseModel):
    name: Name
    date_of_birth: date
    gender: Gender
    email: Optional[EmailStr] = None
    phone_country_code: Optional[CountryCode] = None
    phone: Optional[PhoneDigits] = None
    relationship: Relationship

    _dob = field_validator("date_of_birth")(_check_dob)


class FamilyMemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    date_of_birth: date
    gender: Gender
    email: Optional[str] = None
    phone_country_code: Optional[str] = None
    phone: Optional[str] = None
    relationship: Relationship = Field(validation_alias="relationship_type")


class SetupIn(BaseModel):
    user: UserProfileIn
    family_members: list[FamilyMemberIn] = Field(default_factory=list, max_length=20)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    phone_country_code: Optional[str] = None
    phone: Optional[str] = None
    setup_complete: bool


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class RefreshIn(BaseModel):
    refresh_token: str


class OTPRequestIn(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def _lower(cls, v: str) -> str:
        return v.lower()


class OTPRequestOut(BaseModel):
    message: str
    dev_otp: Optional[str] = None  # only populated when DEBUG=true


class ResetIn(BaseModel):
    email: EmailStr
    otp: Annotated[str, StringConstraints(pattern=r"^\d{6}$")]
    new_password: Password

    _pw = field_validator("new_password")(_check_password)

    @field_validator("email")
    @classmethod
    def _lower(cls, v: str) -> str:
        return v.lower()


class Message(BaseModel):
    message: str


# ---------- documents ----------
class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str  # UUID
    member_id: Optional[int] = None
    title: str
    document_type: str
    filename: str
    content_type: str
    size_bytes: int
    status: DocStatus
    extracted: dict[str, Any]
    created_at: datetime

    @computed_field  # type: ignore[prop-decorator]
    @property
    def document_id(self) -> str:
        return self.id

    @computed_field  # type: ignore[prop-decorator]
    @property
    def file_url(self) -> str:
        return f"/api/v1/documents/{self.id}/file"


class ViewUrlOut(BaseModel):
    view_url: str
    file_mime_type: str


class DownloadUrlOut(BaseModel):
    download_url: str


class DeleteOut(BaseModel):
    status: Literal["deleted"] = "deleted"
    document_id: str


# ---------- medical history ----------
HistoryKind = Literal["condition", "treatment", "allergy"]
HistoryStatus = Literal["active", "resolved"]

class HistoryIn(BaseModel):
    kind: HistoryKind
    title: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=160)]
    status: HistoryStatus = "active"
    start_date: Optional[str] = None   # ISO date "YYYY-MM-DD" or ""
    end_date: Optional[str] = None
    notes: Optional[Annotated[str, StringConstraints(max_length=500)]] = None
    member_id: Optional[int] = None

    @field_validator("start_date", "end_date", mode="before")
    @classmethod
    def _blank_to_none(cls, v: object) -> Optional[str]:
        if v == "" or v is None:
            return None
        return str(v)

class HistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    member_id: Optional[int] = None
    kind: HistoryKind
    title: str
    status: HistoryStatus
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

# ---------- profile summary ----------
class ProfileSummaryOut(BaseModel):
    summary: Optional[str] = None
    source: str  # "nvidia" | "fallback" | "none"
