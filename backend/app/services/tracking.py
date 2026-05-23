"""Tracking service: persist tracking events and fire server-side CAPI safely.

Tracking failures must NEVER propagate to the client.
"""
from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy.orm import Session

from ..constants import CURRENCY
from ..logging_config import get_logger
from ..models.tracking_event import TrackingEvent
from ..schemas.tracking import TrackingContext, TrackingEventIn
from . import meta_capi, snapchat_capi, tiktok_events

logger = get_logger("keychain.tracking")


def store_event(
    db: Session,
    payload: TrackingEventIn,
    *,
    user_agent: Optional[str],
    ip_address: Optional[str],
) -> Optional[TrackingEvent]:
    """Persist a tracking event. Returns the row, or None on failure (swallowed)."""
    ctx = payload.tracking or TrackingContext()
    try:
        order_uuid = None
        if payload.order_id:
            try:
                order_uuid = uuid.UUID(str(payload.order_id))
            except (ValueError, TypeError):
                order_uuid = None

        event = TrackingEvent(
            event_name=payload.event_name,
            event_id=payload.event_id or ctx.event_id,
            session_id=payload.session_id or ctx.session_id,
            order_id=order_uuid,
            step_name=payload.step_name,
            source_platform=payload.source_platform,
            url=payload.url or ctx.url or ctx.landing_page_url,
            referrer=ctx.referrer,
            user_agent=user_agent,
            ip_address=ip_address,
            utm_source=ctx.utm_source,
            utm_medium=ctx.utm_medium,
            utm_campaign=ctx.utm_campaign,
            utm_content=ctx.utm_content,
            utm_term=ctx.utm_term,
            snap_click_id=ctx.snap_click_id,
            snap_cookie_id=ctx.snap_cookie_id,
            meta_fbclid=ctx.meta_fbclid,
            tiktok_ttclid=ctx.tiktok_ttclid,
            payload=payload.payload,
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event
    except Exception:  # noqa: BLE001
        logger.exception("tracking_store_failed", extra={"event_name": payload.event_name})
        try:
            db.rollback()
        except Exception:  # noqa: BLE001
            pass
        return None


def dispatch_server_events(
    *,
    event_name: str,
    event_id: Optional[str],
    ctx: TrackingContext,
    user_agent: Optional[str],
    ip_address: Optional[str],
    url: Optional[str] = None,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    value: Optional[float] = None,
    currency: Optional[str] = None,
    number_items: Optional[int] = None,
) -> None:
    """Fire server-side CAPI events for the enabled platforms. Never raises."""
    currency = currency or CURRENCY
    page_url = url or ctx.url or ctx.landing_page_url

    # Snapchat (enabled day one)
    try:
        if snapchat_capi.should_send_server(event_name):
            snapchat_capi.send_event(
                event_name=event_name,
                event_id=event_id,
                email=email,
                phone=phone,
                client_ip=ip_address,
                user_agent=user_agent,
                sc_click_id=ctx.snap_click_id,
                sc_cookie_id=ctx.snap_cookie_id,
                url=page_url,
                value=value,
                currency=currency,
                number_items=number_items,
            )
    except Exception:  # noqa: BLE001
        logger.exception("snap_dispatch_failed", extra={"event_name": event_name})

    # Meta (disabled by default)
    try:
        if meta_capi.should_send_server(event_name):
            meta_capi.send_event(
                event_name=event_name,
                event_id=event_id,
                email=email,
                phone=phone,
                client_ip=ip_address,
                user_agent=user_agent,
                fbclid=ctx.meta_fbclid,
                url=page_url,
                value=value,
                currency=currency,
            )
    except Exception:  # noqa: BLE001
        logger.exception("meta_dispatch_failed", extra={"event_name": event_name})

    # TikTok (disabled by default)
    try:
        if tiktok_events.should_send_server(event_name):
            tiktok_events.send_event(
                event_name=event_name,
                event_id=event_id,
                email=email,
                phone=phone,
                client_ip=ip_address,
                user_agent=user_agent,
                ttclid=ctx.tiktok_ttclid,
                url=page_url,
                value=value,
                currency=currency,
            )
    except Exception:  # noqa: BLE001
        logger.exception("tiktok_dispatch_failed", extra={"event_name": event_name})
