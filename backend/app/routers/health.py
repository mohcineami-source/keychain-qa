"""Health check endpoint."""
from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import text

from ..database import get_sessionmaker
from ..logging_config import get_logger

router = APIRouter()
logger = get_logger("keychain.health")


@router.get("/api/health")
def health() -> dict:
    database = "ok"
    try:
        SessionLocal = get_sessionmaker()
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
        finally:
            db.close()
    except Exception:  # noqa: BLE001
        logger.exception("health_db_check_failed")
        database = "error"
    return {"ok": True, "service": "keychain-api", "database": database}
