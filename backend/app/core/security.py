import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
import bcrypt
import jwt

from app.core.config import settings

class InvalidToken(Exception):
    pass

def hash_password(password: str) -> str:
    # Hash a password using bcrypt directly
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Verify a password against a hash
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def create_token(subject: str, token_type: str, expires: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": token_type,  # access | refresh | setup
        "iat": now,
        "exp": now + expires,
        "jti": secrets.token_hex(8),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str, allowed_types: set[str]) -> str:
    """Returns the subject (user id) or raises InvalidToken."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except jwt.PyJWTError as exc:
        raise InvalidToken from exc
    if payload.get("type") not in allowed_types or not payload.get("sub"):
        raise InvalidToken
    return str(payload["sub"])


def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_otp(email: str, otp: str) -> str:
    return hmac.new(settings.secret_key.encode(), f"{email}:{otp}".encode(), hashlib.sha256).hexdigest()
