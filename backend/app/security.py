"""Admin authentication: signed JWT tokens issued from env credentials.

Auth uses an httpOnly + Secure + SameSite cookie set by the login endpoint.
The Authorization: Bearer header is also accepted as a fallback so that
service-to-service callers can still authenticate.
"""
from __future__ import annotations

import hmac
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from .config import settings

ALGORITHM = "HS256"

# auto_error=False so we can read the cookie when no header is present.
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


def set_admin_cookie(response: Response, token: str) -> None:
    """Attach the admin session cookie. Secure flag enabled in production."""
    max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        key=settings.ADMIN_COOKIE_NAME,
        value=token,
        max_age=max_age,
        httponly=True,
        secure=settings.is_production,
        # 'lax' is sufficient when the admin SPA and API share the registrable
        # domain (keychain.qa / api.keychain.qa). It still blocks cross-site
        # POST/PATCH requests from third-party origins.
        samesite="lax",
        path="/",
    )


def clear_admin_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.ADMIN_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
    )


def _token_from_request(request: Request, header_token: Optional[str]) -> Optional[str]:
    if header_token:
        return header_token
    cookie_token = request.cookies.get(settings.ADMIN_COOKIE_NAME)
    if cookie_token:
        return cookie_token
    return None


def require_admin(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
) -> str:
    """Validate admin auth via cookie (preferred) or Bearer header."""
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate admin credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    raw = _token_from_request(request, token)
    if not raw:
        raise credentials_exc
    try:
        payload = decode_token(raw)
    except JWTError:
        raise credentials_exc
    subject = payload.get("sub")
    if subject is None or payload.get("scope") != "admin":
        raise credentials_exc
    return subject
