"""Custom middleware: structured request logging and in-memory rate limiting."""
from __future__ import annotations

import time
import uuid
from collections import defaultdict, deque
from threading import Lock
from typing import Deque, Dict

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from .config import settings
from .logging_config import get_logger

logger = get_logger("keychain.request")


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
