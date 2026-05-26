"""Custom middleware: structured request logging, rate limiting, security
headers, origin (CSRF) checks, and admin-login brute-force protection.

All middleware is designed to be cheap: per-IP state is kept in process
memory and trimmed lazily on each request — no background tasks.
"""
from __future__ import annotations

import time
import uuid
from collections import defaultdict, deque
from threading import Lock
from typing import Deque, Dict, Iterable, Optional, Tuple
from urllib.parse import urlparse

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from .config import settings
from .logging_config import get_logger

logger = get_logger("keychain.request")

# State-changing HTTP methods that should be subject to origin / CSRF checks.
_STATE_CHANGING_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})


def get_client_ip(request: Request) -> str:
    """Resolve client IP, honouring common proxy headers (Easypanel/traefik)."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    if request.client:
        return request.client.host
    return "unknown"


def _origin_host(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    try:
        parsed = urlparse(value)
    except Exception:  # noqa: BLE001
        return None
    if not parsed.scheme or not parsed.netloc:
        return None
    return f"{parsed.scheme}://{parsed.netloc}".lower()


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        start = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.exception(
                "request_failed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                    "client_ip": get_client_ip(request),
                },
            )
            raise
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.info(
            "request",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "client_ip": get_client_ip(request),
            },
        )
        response.headers["X-Request-ID"] = request_id
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Attach hardening headers to every response. Cheap: constant work."""

    def __init__(self, app):
        super().__init__(app)
        self._hsts = "max-age=63072000; includeSubDomains; preload"
        # API responses are JSON; lock CSP down hard so a stored XSS via a
        # response payload can't execute scripts even if a browser misrenders.
        self._csp = (
            "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; "
            "form-action 'none'"
        )

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        headers = response.headers
        headers.setdefault("X-Content-Type-Options", "nosniff")
        headers.setdefault("X-Frame-Options", "DENY")
        headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        headers.setdefault(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
        )
        headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        headers.setdefault("Cross-Origin-Resource-Policy", "same-site")
        headers.setdefault("Content-Security-Policy", self._csp)
        if settings.is_production:
            headers.setdefault("Strict-Transport-Security", self._hsts)
        return response


class OriginCheckMiddleware(BaseHTTPMiddleware):
    """Reject state-changing requests whose Origin/Referer is unrecognised.

    This is a defense-in-depth CSRF mitigation on top of SameSite cookies:
    browsers always send Origin on cross-site POST/PATCH/DELETE, so an
    attacker page on evil.com cannot forge a request that passes both the
    SameSite cookie check AND a matching Origin header.

    Same-origin requests (no Origin header from the user's own pages) are
    allowed. Requests without cookies AND without Origin are also allowed —
    those cannot exploit ambient authority.
    """

    def __init__(self, app, allowed_origins: Iterable[str]):
        super().__init__(app)
        self._allowed = {o.rstrip("/").lower() for o in allowed_origins if o}

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.method.upper() not in _STATE_CHANGING_METHODS:
            return await call_next(request)
        origin = _origin_host(request.headers.get("origin"))
        referer = _origin_host(request.headers.get("referer"))
        sent_origin = origin or referer
        if sent_origin is None:
            # No origin header (e.g. server-to-server, curl). Allow.
            return await call_next(request)
        if sent_origin not in self._allowed:
            logger.warning(
                "origin_rejected",
                extra={
                    "client_ip": get_client_ip(request),
                    "path": request.url.path,
                    "origin": sent_origin,
                },
            )
            return JSONResponse(
                status_code=403,
                content={"success": False, "detail": "Origin not allowed"},
            )
        return await call_next(request)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory fixed-sliding-window per-IP rate limiter.

    Applied only to configured paths (the order endpoint). Limit is
    ``RATE_LIMIT_PER_MINUTE`` requests per IP per 60s window.
    """

    def __init__(self, app, limited_paths: tuple[str, ...] = ("/api/orders",)):
        super().__init__(app)
        self.limited_paths = limited_paths
        self.window_seconds = 60
        self.max_requests = max(1, settings.RATE_LIMIT_PER_MINUTE)
        self._hits: Dict[str, Deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def _is_limited(self, path: str, method: str) -> bool:
        if method.upper() != "POST":
            return False
        return any(path == p or path.startswith(p) for p in self.limited_paths)

    async def dispatch(self, request: Request, call_next) -> Response:
        if not self._is_limited(request.url.path, request.method):
            return await call_next(request)

        ip = get_client_ip(request)
        now = time.time()
        with self._lock:
            bucket = self._hits[ip]
            cutoff = now - self.window_seconds
            while bucket and bucket[0] < cutoff:
                bucket.popleft()
            if len(bucket) >= self.max_requests:
                retry_after = int(self.window_seconds - (now - bucket[0])) + 1
                logger.warning(
                    "rate_limited",
                    extra={"client_ip": ip, "path": request.url.path},
                )
                return JSONResponse(
                    status_code=429,
                    content={"success": False, "detail": "Too many requests. Please slow down."},
                    headers={"Retry-After": str(max(1, retry_after))},
                )
            bucket.append(now)
        return await call_next(request)


class AdminLoginGuard:
    """Process-wide tracker for failed admin login attempts.

    On too many failures within a sliding window, the IP is locked out for
    ``ADMIN_LOGIN_LOCKOUT_MINUTES``. Successful logins clear the counter.
    """

    def __init__(self) -> None:
        self._failures: Dict[str, Deque[float]] = defaultdict(deque)
        self._lockouts: Dict[str, float] = {}
        self._lock = Lock()

    def _trim(self, ip: str, now: float, window: float) -> None:
        bucket = self._failures[ip]
        cutoff = now - window
        while bucket and bucket[0] < cutoff:
            bucket.popleft()
        if not bucket:
            self._failures.pop(ip, None)

    def status(self, ip: str) -> Tuple[bool, int]:
        """Return (is_locked, seconds_until_unlock)."""
        now = time.time()
        with self._lock:
            unlock_at = self._lockouts.get(ip)
            if unlock_at is None:
                return False, 0
            if now >= unlock_at:
                self._lockouts.pop(ip, None)
                self._failures.pop(ip, None)
                return False, 0
            return True, int(unlock_at - now) + 1

    def record_failure(self, ip: str) -> Tuple[bool, int]:
        """Record a failed login. Returns (is_now_locked, retry_after_seconds)."""
        now = time.time()
        window = settings.ADMIN_LOGIN_FAILURE_WINDOW_MINUTES * 60
        lockout = settings.ADMIN_LOGIN_LOCKOUT_MINUTES * 60
        with self._lock:
            self._trim(ip, now, window)
            bucket = self._failures[ip]
            bucket.append(now)
            if len(bucket) >= settings.ADMIN_LOGIN_MAX_FAILURES:
                self._lockouts[ip] = now + lockout
                self._failures.pop(ip, None)
                return True, int(lockout)
        return False, 0

    def record_success(self, ip: str) -> None:
        with self._lock:
            self._failures.pop(ip, None)
            self._lockouts.pop(ip, None)


admin_login_guard = AdminLoginGuard()
