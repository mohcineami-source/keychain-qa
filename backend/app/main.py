"""FastAPI application entrypoint for keychain.qa backend.

Importing this module must NOT open a database connection (engine is lazy).
"""
from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import settings
from .logging_config import configure_logging, get_logger
from .middleware import (
    OriginCheckMiddleware,
    RateLimitMiddleware,
    RequestLoggingMiddleware,
    SecurityHeadersMiddleware,
)
from .routers import admin, debug, health, orders, tracking

configure_logging()
logger = get_logger("keychain.main")

# Fail fast in production if any insecure default is still configured.
settings.validate_for_runtime()

# Docs are hidden in production unless explicitly enabled.
_docs_enabled = (not settings.is_production) or settings.EXPOSE_API_DOCS

app = FastAPI(
    title="keychain.qa API",
    description="Backend API for the keychain.qa Qatar car plate keychain funnel.",
    version="1.0.0",
    docs_url="/api/docs" if _docs_enabled else None,
    redoc_url="/api/redoc" if _docs_enabled else None,
    openapi_url="/api/openapi.json" if _docs_enabled else None,
)

# CORS — frontend only. Note: ASGI middleware runs in reverse order, so the
# middleware added LAST runs FIRST (outermost). We want this stack on the wire:
#   CORS -> RequestLogging -> SecurityHeaders -> OriginCheck -> RateLimit -> app
# so we add them in the opposite order below.
_cors_origins = settings.cors_origins_list or [settings.FRONTEND_URL]

app.add_middleware(RateLimitMiddleware, limited_paths=("/api/orders",))
app.add_middleware(OriginCheckMiddleware, allowed_origins=_cors_origins)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    # Narrow from "*" to the headers our SPA actually sends. With credentials
    # enabled, the browser refuses "*" anyway, so an explicit list is required.
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
    max_age=600,
)

# Routers
app.include_router(health.router, tags=["health"])
app.include_router(orders.router, tags=["orders"])
app.include_router(tracking.router, tags=["tracking"])
app.include_router(admin.router, tags=["admin"])
# Diagnostic endpoints are admin-gated AND only registered when explicitly
# enabled via ENABLE_DEBUG_ROUTES. Off by default everywhere.
if settings.ENABLE_DEBUG_ROUTES:
    app.include_router(debug.router)
    logger.warning("debug_routes_enabled — disable in production once verified")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"success": False, "detail": exc.errors()},
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "detail": exc.detail},
        headers=getattr(exc, "headers", None),
    )


@app.get("/")
def root() -> dict:
    return {
        "service": "keychain-api",
        "status": "running",
        "docs": "/api/docs" if _docs_enabled else None,
    }
