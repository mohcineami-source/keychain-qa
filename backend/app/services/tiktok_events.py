"""TikTok Events API — full skeleton, disabled by default.

Gated by ENABLE_TIKTOK_EVENTS. Returns early (no-op) when disabled. Supports
ttclid capture. Never exposes the access token client-side. Never raises.
"""
from __future__ import annotations

import hashlib
import time
from typing import Optional

import httpx

from ..config import settings
from ..logging_config import get_logger

logger = get_logger("keychain.tiktok_events")

EVENTS_URL = "https://business-api.tiktok.com/open_api/v1.3/event/track/"

EVENT_MAP = {
    "PageView": "Pageview",
    "OfferView": "ViewContent",
    "ViewContent": "ViewContent",
    "SelectPlateStyle": "ViewContent",
    "AddAnotherPlate": "AddToCart",
    "InitiateCheckout": "InitiateCheckout",
    "SubmitOrder": "InitiateCheckout",
    "Purchase": "CompletePayment",
}

KEY_SERVER_EVENTS = {"Purchase", "InitiateCheckout", "SubmitOrder"}


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
    digits = "".join(ch for ch in value if ch.isdigit())
    return hashlib.sha256(digits.encode("utf-8")).hexdigest() if digits else None


def is_enabled() -> bool:
    return bool(
        settings.ENABLE_TIKTOK_EVENTS
        and settings.TIKTOK_PIXEL_ID
        and settings.TIKTOK_ACCESS_TOKEN
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
    ttclid: Optional[str] = None,
    url: Optional[str] = None,
    value: Optional[float] = None,
    currency: Optional[str] = None,
) -> bool:
    if not is_enabled():
        logger.info("tiktok_events_disabled_skip", extra={"event_name": event_name})
        return False

    tt_event = EVENT_MAP.get(event_name)
    if not tt_event:
        logger.info("tiktok_events_unmapped_event", extra={"event_name": event_name})
        return False

    user = {}
    if _hash(email):
        user["email"] = _hash(email)
    if _hash_phone(phone):
        user["phone"] = _hash_phone(phone)
    if client_ip:
        user["ip"] = client_ip
    if user_agent:
        user["user_agent"] = user_agent
    if ttclid:
        user["ttclid"] = ttclid

    properties = {}
    if value is not None:
        properties["value"] = value
    if currency:
        properties["currency"] = currency

    event_obj = {
        "event": tt_event,
        "event_time": int(time.time()),
        "user": user,
        "page": {"url": url} if url else {},
        "properties": properties,
    }
    if event_id:
        event_obj["event_id"] = event_id

    body = {
        "event_source": "web",
        "event_source_id": settings.TIKTOK_PIXEL_ID,
        "data": [event_obj],
    }
    try:
        resp = httpx.post(
            EVENTS_URL,
            headers={
                "Access-Token": settings.TIKTOK_ACCESS_TOKEN,
                "Content-Type": "application/json",
            },
            json=body,
            timeout=8.0,
        )
        if resp.status_code >= 400:
            logger.error(
                "tiktok_events_error_response",
                extra={"status_code": resp.status_code, "body": resp.text[:500]},
            )
            return False
        logger.info("tiktok_events_sent", extra={"event_name": event_name})
        return True
    except Exception:  # noqa: BLE001
        logger.exception("tiktok_events_request_failed", extra={"event_name": event_name})
        return False
