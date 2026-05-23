"""Pydantic schemas for tracking payloads."""
from __future__ import annotations

from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


class TrackingContext(BaseModel):
    """Shared attribution context attached to orders and tracking events."""

    model_config = ConfigDict(extra="ignore")

    event_id: Optional[str] = None
    session_id: Optional[str] = None
    landing_page_url: Optional[str] = None
    url: Optional[str] = None
    referrer: Optional[str] = None

    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    utm_term: Optional[str] = None

    snap_click_id: Optional[str] = None  # ScCid (from URL)
    snap_cookie_id: Optional[str] = None  # _scid cookie
    meta_fbclid: Optional[str] = None
    tiktok_ttclid: Optional[str] = None


class TrackingEventIn(BaseModel):
    model_config = ConfigDict(extra="ignore")

    event_name: str = Field(..., min_length=1, max_length=64)
    event_id: Optional[str] = None
    session_id: Optional[str] = None
    step_name: Optional[str] = None
    order_id: Optional[str] = None
    source_platform: Optional[str] = None
    url: Optional[str] = None
    tracking: Optional[TrackingContext] = None
    payload: Optional[Dict[str, Any]] = None


class TrackingEventResponse(BaseModel):
    success: bool = True
