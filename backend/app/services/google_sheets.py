"""Google Sheets API integration (service account).

Single tab ``order_items``, one row per keychain. Headers auto-created/verified.
Safe no-op when disabled or credentials are missing — never raises to the caller.
Tracking/UTM columns are NEVER written to the sheet.
"""
from __future__ import annotations

import base64
import json
import threading
from typing import List, Optional

from ..config import settings
from ..constants import SHEET_COLUMNS
from ..logging_config import get_logger

logger = get_logger("keychain.sheets")

_SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

_service_lock = threading.Lock()
_service = None
_headers_verified = False


def credentials_diagnostic() -> dict:
    """Parse GOOGLE_SERVICE_ACCOUNT_JSON and return a status dict.

    Status field is one of:
      - "ok"               : parsed + has client_email + private_key
      - "missing"          : env var empty / unset
      - "invalid_json"     : not valid JSON and not valid base64-encoded JSON
      - "missing_client_email"
      - "missing_private_key"

    NEVER includes secret values in the result.
    """
    raw = (settings.GOOGLE_SERVICE_ACCOUNT_JSON or "").strip()
    if not raw:
        return {"status": "missing", "info": None, "raw_length": 0}

    # People sometimes wrap the JSON in quotes when pasting into env UIs.
    if len(raw) >= 2 and raw[0] == raw[-1] and raw[0] in ('"', "'"):
        raw = raw[1:-1].strip()

    raw_length = len(raw)
    info: Optional[dict] = None

    # 1) Raw JSON
    try:
        info = json.loads(raw)
    except json.JSONDecodeError as exc:
        json_err = f"{type(exc).__name__}: line {exc.lineno} col {exc.colno}"
        # 2) base64-encoded JSON
        try:
            decoded = base64.b64decode(raw, validate=False).decode("utf-8")
            info = json.loads(decoded)
        except Exception as exc2:  # noqa: BLE001
            logger.error(
                "google_sheets_bad_credentials_format",
                extra={
                    "json_error": json_err,
                    "base64_error": f"{type(exc2).__name__}",
                    "raw_length": raw_length,
                },
            )
            return {
                "status": "invalid_json",
                "info": None,
                "raw_length": raw_length,
                "json_error": json_err,
                "base64_error": type(exc2).__name__,
            }

    if not isinstance(info, dict):
        return {
            "status": "invalid_json",
            "info": None,
            "raw_length": raw_length,
            "json_error": "parsed value is not a JSON object",
        }

    client_email = info.get("client_email")
    if not isinstance(client_email, str) or not client_email.strip():
        return {
            "status": "missing_client_email",
            "info": info,
            "raw_length": raw_length,
        }
    private_key = info.get("private_key")
    if not isinstance(private_key, str) or "PRIVATE KEY" not in private_key:
        return {
            "status": "missing_private_key",
            "info": info,
            "raw_length": raw_length,
        }

    return {"status": "ok", "info": info, "raw_length": raw_length}


def _load_credentials_info() -> Optional[dict]:
    """Backward-compatible loader — returns the parsed dict or None."""
    diag = credentials_diagnostic()
    return diag["info"] if diag["status"] == "ok" else None


def is_enabled() -> bool:
    if not settings.GOOGLE_SHEETS_ENABLED:
        return False
    if not settings.GOOGLE_SHEET_ID:
        return False
    if not (settings.GOOGLE_SERVICE_ACCOUNT_JSON or "").strip():
        return False
    return True


def _get_service():
    """Lazily build the Sheets API client. Returns None on any failure."""
    global _service
    if _service is not None:
        return _service
    with _service_lock:
        if _service is not None:
            return _service
        info = _load_credentials_info()
        if not info:
            return None
        try:
            from google.oauth2 import service_account
            from googleapiclient.discovery import build

            creds = service_account.Credentials.from_service_account_info(
                info, scopes=_SCOPES
            )
            _service = build(
                "sheets", "v4", credentials=creds, cache_discovery=False
            )
            return _service
        except Exception:  # noqa: BLE001
            logger.exception("google_sheets_client_init_failed")
            return None


def _tab() -> str:
    return settings.GOOGLE_SHEET_TAB_NAME or "order_items"


def ensure_headers() -> bool:
    """Verify/create the header row. Returns True on success, False otherwise."""
    global _headers_verified
    if _headers_verified:
        return True
    service = _get_service()
    if service is None:
        return False
    tab = _tab()
    try:
        resp = (
            service.spreadsheets()
            .values()
            .get(spreadsheetId=settings.GOOGLE_SHEET_ID, range=f"{tab}!1:1")
            .execute()
        )
        existing = resp.get("values", [[]])
        first_row = existing[0] if existing else []
        if first_row[: len(SHEET_COLUMNS)] != SHEET_COLUMNS:
            service.spreadsheets().values().update(
                spreadsheetId=settings.GOOGLE_SHEET_ID,
                range=f"{tab}!A1",
                valueInputOption="RAW",
                body={"values": [SHEET_COLUMNS]},
            ).execute()
            logger.info("google_sheets_headers_written")
        _headers_verified = True
        return True
    except Exception:  # noqa: BLE001
        logger.exception("google_sheets_ensure_headers_failed")
        return False


def _row_values(
    *,
    order_number: str,
    item_number: int,
    customer_name: str,
    phone: str,
    address: str,
    plate_style: str,
    plate_letter: Optional[str],
    plate_number: Optional[str],
    item_price: int,
    total_order_value: int,
    payment_method: str,
    status: str,
    created_at: str,
) -> List:
    # Order MUST match SHEET_COLUMNS exactly. No UTM/tracking columns.
    return [
        order_number,
        item_number,
        customer_name,
        phone,
        address,
        plate_style,
        plate_letter or "",
        plate_number or "",
        item_price,
        total_order_value,
        payment_method,
        status,
        created_at,
    ]


def append_item_row(**kwargs) -> Optional[int]:
    """Append one keychain row. Returns the 1-based row number, or None on failure.

    Never raises — failures are logged and the caller marks sync_status=error.
    """
    row_number, _err = append_item_row_with_error(**kwargs)
    return row_number


def append_item_row_with_error(**kwargs) -> tuple[Optional[int], Optional[str]]:
    """Same as ``append_item_row`` but also returns a short error string
    (or None on success). Used by the debug endpoint to surface the real
    failure reason without exposing secrets."""
    if not is_enabled():
        diag = credentials_diagnostic()
        reason = (
            "disabled"
            if not settings.GOOGLE_SHEETS_ENABLED
            else "missing_sheet_id"
            if not (settings.GOOGLE_SHEET_ID or "").strip()
            else f"credentials_{diag['status']}"
        )
        logger.info("google_sheets_disabled_skip_append", extra={"reason": reason})
        return None, reason
    service = _get_service()
    if service is None:
        return None, "service_init_failed"
    if not ensure_headers():
        return None, "ensure_headers_failed"
    tab = _tab()
    values = _row_values(**kwargs)
    try:
        resp = (
            service.spreadsheets()
            .values()
            .append(
                spreadsheetId=settings.GOOGLE_SHEET_ID,
                range=f"{tab}!A1",
                valueInputOption="RAW",
                insertDataOption="INSERT_ROWS",
                includeValuesInResponse=False,
                body={"values": [values]},
            )
            .execute()
        )
        updated_range = resp.get("updates", {}).get("updatedRange", "")
        row_number = _parse_row_from_range(updated_range)
        logger.info(
            "google_sheets_row_appended",
            extra={"row_number": row_number, "order_number": kwargs.get("order_number")},
        )
        return row_number, None
    except Exception as exc:  # noqa: BLE001
        # Extract a short, non-secret error label. googleapiclient.errors.HttpError
        # has a .status_code or .resp.status; other exceptions just give type name.
        status_code = getattr(getattr(exc, "resp", None), "status", None) or getattr(
            exc, "status_code", None
        )
        err = f"{type(exc).__name__}"
        if status_code:
            err = f"{err}:{status_code}"
        logger.exception(
            "google_sheets_append_failed",
            extra={
                "order_number": kwargs.get("order_number"),
                "error_label": err,
            },
        )
        return None, err


def update_item_status(row_number: int, status: str) -> bool:
    """Update the ``status`` column for a given row. Returns success bool."""
    if not is_enabled():
        logger.info("google_sheets_disabled_skip_status")
        return False
    if not row_number:
        return False
    service = _get_service()
    if service is None:
        return False
    tab = _tab()
    status_col = _column_letter(SHEET_COLUMNS.index("status"))
    try:
        service.spreadsheets().values().update(
            spreadsheetId=settings.GOOGLE_SHEET_ID,
            range=f"{tab}!{status_col}{row_number}",
            valueInputOption="RAW",
            body={"values": [[status]]},
        ).execute()
        logger.info(
            "google_sheets_status_updated",
            extra={"row_number": row_number, "status": status},
        )
        return True
    except Exception:  # noqa: BLE001
        logger.exception(
            "google_sheets_status_update_failed",
            extra={"row_number": row_number},
        )
        return False


def _parse_row_from_range(updated_range: str) -> Optional[int]:
    """Extract the row number from a range like ``order_items!A5:M5``."""
    if not updated_range or "!" not in updated_range:
        return None
    cell_part = updated_range.split("!", 1)[1]
    first_cell = cell_part.split(":", 1)[0]
    digits = "".join(ch for ch in first_cell if ch.isdigit())
    return int(digits) if digits else None


def _column_letter(zero_based_index: int) -> str:
    """0 -> A, 1 -> B, ... 26 -> AA."""
    index = zero_based_index
    letters = ""
    while True:
        index, remainder = divmod(index, 26)
        letters = chr(65 + remainder) + letters
        if index == 0:
            break
        index -= 1
    return letters
