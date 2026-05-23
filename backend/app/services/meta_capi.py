"""Meta (Facebook) Conversions API — full skeleton, disabled by default.

Gated by ENABLE_META_CAPI. Returns early (no-op) when disabled. Never exposes
the access token client-side. Never raises to the caller.
"""
from __future__ import annotations

import hashlib
import time
from typing import Optional

import httpx

from ..config import settings
from ..logging_config import get_logger

logger = get_logger("keychain.meta_capi")

GRAPH_VERSION = "v19.0"

EVENT_MAP = {
    "PageView": "PageView",
    "OfferView": "ViewContent",
    "ViewContent": "ViewContent",
    "SelectPlateStyle": "ViewContent",
    "AddAnotherPlate": "AddToCart",
    "InitiateCheckout": "InitiateCheckout",
    "SubmitOrder": "InitiateCheckout",
    "Purchase": "Purchase",
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
        settings.ENABLE_META_CAPI
        and settings.META_PIXEL_ID
        and settings.META_CAPI_ACCESS_TOKEN
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
    fbclid: Optional[str] = None,
    url: Optional[str] = None,
    value: Optional[float] = None,
    currency: Optional[str] = None,
) -> bool:
    if not is_enabled():
        logger.info("meta_capi_disabled_skip", extra={"event_name": event_name})
        return False

    fb_event = EVENT_MAP.get(event_name)
    if not fb_event:
        logger.info("meta_capi_unmapped_event", extra={"event_name": event_name})
        return False

    user_data = {}
    if _hash(email):
        user_data["em"] = [_hash(email)]
    if _hash_phone(phone):
        user_data["ph"] = [_hash_phone(phone)]
    if client_ip:
        user_data["client_ip_address"] = client_ip
    if user_agent:
        user_data["client_user_agent"] = user_agent
    if fbclid:
        # Meta expects fbc in fb.1.<ts>.<fbclid> format.
        user_data["fbc"] = f"fb.1.{int(time.time() * 1000)}.{fbclid}"

    custom_data = {}
    if value is not None:
        custom_data["value"] = value
    if currency:
        custom_data["currency"] = currency

    event = {
        "event_name": fb_event,
        "event_time": int(time.time()),
        "action_source": "website",
        "user_data": user_data,
    }
    if event_id:
        event["event_id"] = event_id
    if url:
        event["event_source_url"] = url
    if custom_data:
        event["custom_data"] = custom_data

    endpoint = (
        f"https://graph.facebook.com/{GRAPH_VERSION}/"
        f"{settings.META_PIXEL_ID}/events"
    )
    try:
        resp = httpx.post(
            endpoint,
            params={"access_token": settings.META_CAPI_ACCESS_TOKEN},
            json={"data": [event]},
            timeout=8.0,
        )
        if resp.status_code >= 400:
            logger.error(
                "meta_capi_error_response",
                extra={"status_code": resp.status_code, "body": resp.text[:500]},
            )
            return False
        logger.info("meta_capi_sent", extra={"event_name": event_name})
        return True
    except Exception:  # noqa: BLE001
        logger.exception("meta_capi_request_failed", extra={"event_name": event_name})
        return False
