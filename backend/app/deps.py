from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import InvalidToken, decode_token
from app.db.session import get_db
from app.models import User

bearer = HTTPBearer(auto_error=False)


def _user_dependency(allowed: set[str]):
    async def dependency(
        creds: HTTPAuthorizationCredentials | None = Depends(bearer),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        unauthorized = HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
        if creds is None:
            raise unauthorized
        try:
            user_id = int(decode_token(creds.credentials, allowed))
        except (InvalidToken, ValueError):
            raise unauthorized
        user = await db.get(User, user_id)
        if user is None:
            raise unauthorized
        return user

    return dependency


get_current_user = _user_dependency({"access"})
# the setup step accepts the short-lived setup token from /signup, or a normal access token
get_setup_user = _user_dependency({"setup", "access"})
