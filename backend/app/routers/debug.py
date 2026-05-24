"""Temporary diagnostic endpoints for Google Sheets sync.

REMOVE THIS ROUTER once Sheets sync is confirmed working in production.
The endpoints never expose secrets: no private keys, no full credentials,
no full sheet IDs (only a short prefix).
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter
from sqlalchemy import desc, select

from ..config import settings
from ..database import get_sessionmaker
from ..logging_config import get_logger
from ..models.order_item import OrderItem
from ..services import google_sheets

router = APIRouter(prefix="/api/debug", tags=["debug"])
logger = get_logger("keychain.debug")


def _sheet_id_preview() -> str:
    sid = (settings.GOOGLE_SHEET_ID or "").strip()
    return sid[:6] if sid else ""


@router.get("/google-sheets")
def google_sheets_status() -> dict[str, Any]:
    """Diagnostic snapshot of the Google Sheets config + last 5 sync results.

    Safe to call from any environment — does not expose secrets.
    """
    diag = google_sheets.credentials_diagnostic()
    info = diag.get("info") or {}
    client_email = info.get("client_email", "") if isinstance(info, dict) else ""

    SessionLocal = get_sessionmaker()
    db = SessionLocal()
    try:
        rows = (
            db.execute(
                select(OrderItem)
                .order_by(desc(OrderItem.created_at))
                .limit(5)
            )
            .scalars()
            .all()
        )
        recent = [
            {
                "order_number": r.order_number,
                "item_number": r.item_number,
                "google_sheet_sync_status": r.google_sheet_sync_status,
                "google_sheet_row_number": r.google_sheet_row_number,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]
    except Exception:  # noqa: BLE001
        logger.exception("debug_recent_items_failed")
        recent = []
    finally:
        db.close()

    return {
        "google_sheets_enabled": bool(settings.GOOGLE_SHEETS_ENABLED),
        "has_google_sheet_id": bool((settings.GOOGLE_SHEET_ID or "").strip()),
        "has_service_account_json": bool(
            (settings.GOOGLE_SERVICE_ACCOUNT_JSON or "").strip()
        ),
        "sheet_id_preview": _sheet_id_preview(),
        "tab_name": settings.GOOGLE_SHEET_TAB_NAME or "order_items",
        "service_account_email": client_email,
        "credentials_status": diag.get("status"),
        "credentials_raw_length": diag.get("raw_length"),
        # Only present when JSON+base64 parsing both failed:
        "credentials_json_error": diag.get("json_error"),
        "credentials_base64_error": diag.get("base64_error"),
        "is_enabled_check": google_sheets.is_enabled(),
        "recent_order_items": recent,
    }


@router.post("/google-sheets/test")
def google_sheets_test_append() -> dict[str, Any]:
    """Attempt to append one diagnostic row to the configured sheet.

    Returns success + row number on success, or a short error label on
    failure. Never includes secrets in the response.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        row_number, err = google_sheets.append_item_row_with_error(
            order_number="KCQ-TEST",
            item_number=1,
            customer_name="DEBUG_TEST",
            phone="DEBUG_TEST",
            address="DEBUG_TEST",
            plate_style="custom_choice",
            plate_letter=None,
            plate_number=None,
            item_price=0,
            total_order_value=0,
            payment_method="cash",
            status="debug",
            created_at=now_iso,
        )
    except Exception as exc:  # noqa: BLE001
        # append_item_row_with_error is supposed to swallow internally — this
        # catch is belt-and-braces so the endpoint never 500s.
        logger.exception("debug_test_append_unexpected_error")
        return {
            "success": False,
            "error": "unexpected_exception",
            "exception_type": type(exc).__name__,
        }

    if row_number is None:
        return {
            "success": False,
            "error": err or "append_returned_none",
        }
    return {
        "success": True,
        "row_number": row_number,
        "tab_name": settings.GOOGLE_SHEET_TAB_NAME or "order_items",
    }
