"""Admin authentication: signed JWT tokens issued from env credentials."""
from __future__ import annotations

import hmac
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from .config import settings

ALGORITHM = "HS256"

# tokenUrl points at the admin login route; auto_error keeps a clean 401.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/admin/login", auto_error=False)


def verify_admin_credentials(username: str, password: str) -> bool:
    """Constant-time comparison of admin credentials against env settings."""
    user_ok = hmac.compare_digest(username or "", settings.ADMIN_USERNAME)
    pass_ok = hmac.compare_digest(password or "", settings.ADMIN_PASSWORD)
    return user_ok and pass_ok


def create_access_token(subject: str, expires_minutes: Optional[int] = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode = {"sub": subject, "exp": expire, "scope": "admin"}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])


def require_admin(token: Optional[str] = Depends(oauth2_scheme)) -> str:
    """FastAPI dependency that validates the admin bearer token."""
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate admin credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exc
    try:
        payload = decode_token(token)
    except JWTError:
        raise credentials_exc
    subject = payload.get("sub")
    if subject is None or payload.get("scope") != "admin":
        raise credentials_exc
    return subject
