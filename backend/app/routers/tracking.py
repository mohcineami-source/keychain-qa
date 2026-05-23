"""Tracking event endpoint. Failures never raise to the client."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..logging_config import get_logger
from ..middleware import get_client_ip
from ..schemas.tracking import TrackingContext, TrackingEventIn, TrackingEventResponse
from ..services import tracking as tracking_service

router = APIRouter()
logger = get_logger("keychain.tracking_router")


@router.post("/api/tracking/event", response_model=TrackingEventResponse)
def track_event(
    payload: TrackingEventIn,
    request: Request,
    db: Session = Depends(get_db),
) -> TrackingEventResponse:
    user_agent = request.headers.get("user-agent")
    ip_address = get_client_ip(request)

    # Persist (swallows its own errors and returns None on failure)
    tracking_service.store_event(
        db, payload, user_agent=user_agent, ip_address=ip_address
    )

    # Fire server-side CAPI for key events (Snapchat enabled; Meta/TikTok gated)
    try:
        ctx = payload.tracking or TrackingContext()
        tracking_service.dispatch_server_events(
            event_name=payload.event_name,
            event_id=payload.event_id or ctx.event_id,
            ctx=ctx,
            user_agent=user_agent,
            ip_address=ip_address,
            url=payload.url,
        )
    except Exception:  # noqa: BLE001
        logger.exception("tracking_dispatch_failed", extra={"event_name": payload.event_name})

    # Always succeed from the client's perspective.
    return TrackingEventResponse(success=True)
