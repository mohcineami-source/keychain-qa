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
from .middleware import RateLimitMiddleware, RequestLoggingMiddleware
from .routers import admin, debug, health, orders, tracking

configure_logging()
logger = get_logger("keychain.main")

app = FastAPI(
    title="keychain.qa API",
    description="Backend API for the keychain.qa Qatar car plate keychain funnel.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS — frontend only.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list or ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Custom middleware (added after CORS so CORS runs outermost).
app.add_middleware(RateLimitMiddleware, limited_paths=("/api/orders",))
app.add_middleware(RequestLoggingMiddleware)

# Routers
app.include_router(health.router, tags=["health"])
app.include_router(orders.router, tags=["orders"])
app.include_router(tracking.router, tags=["tracking"])
app.include_router(admin.router, tags=["admin"])
# TODO: remove once Google Sheets sync is confirmed working in production.
app.include_router(debug.router)


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
    return {"service": "keychain-api", "status": "running", "docs": "/api/docs"}
