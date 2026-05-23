"""Snapchat Conversions API (CAPI) — server-side event sending.

Hashes email/phone (SHA-256) when present, sends event_id for browser/server
dedupe, supports ScCid (click id) and _scid (cookie). Gated by
ENABLE_SNAPCHAT_CAPI. Never raises to the caller.
"""
from __future__ import annotations

import hashlib
import time
from typing import Optional

import httpx

from ..config import settings
from ..logging_config import get_logger

logger = get_logger("keychain.snap_capi")

CAPI_URL = "https://tr.snapchat.com/v2/conversion"

# Map internal funnel events -> Snapchat standard event types.
EVENT_MAP = {
    "PageView": "PAGE_VIEW",
    "OfferView": "VIEW_CONTENT",
    "ViewContent": "VIEW_CONTENT",
    "SelectPlateStyle": "VIEW_CONTENT",
    "AddAnotherPlate": "ADD_CART",
    "InitiateCheckout": "START_CHECKOUT",
    "SubmitOrder": "START_CHECKOUT",
    "Purchase": "PURCHASE",
}

# Events we send server-side for reliability.
KEY_SERVER_EVENTS = {"Purchase", "InitiateCheckout", "SubmitOrder", "OfferView"}


def _hash(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    normalized = value.strip().lower()
    if not normalized:
        return None
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def _hash_phone(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    # E.164-ish normalization: strip spaces, dashes, parentheses, plus.
    digits = "".join(ch for ch in value if ch.isdigit())
    if not digits:
        return None
    return hashlib.sha256(digits.encode("utf-8")).hexdigest()


def is_enabled() -> bool:
    return bool(
        settings.ENABLE_SNAPCHAT_CAPI
        and settings.SNAP_PIXEL_ID
        and settings.SNAP_ACCESS_TOKEN
    )


def should_send_server(event_name: str) -> bool:
    return event_name in KEY_SERVER_EVENTS


def send_event(
    *,
    event_name: str,
    event_id: Optional[str] = None,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    client_ip: Optional[str] = None,
    user_agent: Optional[str] = None,
    sc_click_id: Optional[str] = None,
    sc_cookie_id: Optional[str] = None,
    url: Optional[str] = None,
    value: Optional[float] = None,
    currency: Optional[str] = None,
    number_items: Optional[int] = None,
) -> bool:
    """Send a single conversion event to Snapchat CAPI. Returns success bool.

    Never raises; on disabled/missing config it is a no-op returning False.
    """
    if not is_enabled():
        logger.info("snap_capi_disabled_skip", extra={"event_name": event_name})
        return False

    snap_event_type = EVENT_MAP.get(event_name)
    if not snap_event_type:
        logger.info("snap_capi_unmapped_event", extra={"event_name": event_name})
        return False

    payload = {
        "pixel_id": settings.SNAP_PIXEL_ID,
        "event_type": snap_event_type,
        "event_conversion_type": "WEB",
        "timestamp": int(time.time() * 1000),
    }
    if event_id:
        # client_dedup_id is used by Snap to dedupe browser+server events.
        payload["client_dedup_id"] = event_id

    hashed_email = _hash(email)
    hashed_phone = _hash_phone(phone)
    if hashed_email:
        payload["hashed_email"] = hashed_email
    if hashed_phone:
        payload["hashed_phone_number"] = hashed_phone
    if client_ip:
        payload["hashed_ip_address"] = _hash(client_ip)
    if user_agent:
        payload["user_agent"] = user_agent
    if sc_click_id:
        payload["click_id"] = sc_click_id  # ScCid
    if sc_cookie_id:
        payload["uuid_c1"] = sc_cookie_id  # _scid cookie
    if url:
        payload["page_url"] = url
    if value is not None:
        payload["price"] = value
    if currency:
        payload["currency"] = currency
    if number_items is not None:
        payload["number_items"] = number_items

    try:
        resp = httpx.post(
            CAPI_URL,
            params={"access_token": settings.SNAP_ACCESS_TOKEN},
            json=payload,
            timeout=8.0,
        )
        if resp.status_code >= 400:
            logger.error(
                "snap_capi_error_response",
                extra={"status_code": resp.status_code, "body": resp.text[:500]},
            )
            return False
        logger.info("snap_capi_sent", extra={"event_name": event_name, "event_id": event_id})
        return True
    except Exception:  # noqa: BLE001
        logger.exception("snap_capi_request_failed", extra={"event_name": event_name})
        return False
