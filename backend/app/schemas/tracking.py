"""Pydantic schemas for tracking payloads."""
from __future__ import annotations

from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


class TrackingContext(BaseModel):
    """Shared attribution context attached to orders and tracking events."""

    model_config = ConfigDict(extra="ignore")

    event_id: Optional[str] = Field(default=None, max_length=128)
    session_id: Optional[str] = Field(default=None, max_length=128)
    landing_page_url: Optional[str] = Field(default=None, max_length=2048)
    url: Optional[str] = Field(default=None, max_length=2048)
    referrer: Optional[str] = Field(default=None, max_length=2048)

    utm_source: Optional[str] = Field(default=None, max_length=255)
    utm_medium: Optional[str] = Field(default=None, max_length=255)
    utm_campaign: Optional[str] = Field(default=None, max_length=255)
    utm_content: Optional[str] = Field(default=None, max_length=255)
    utm_term: Optional[str] = Field(default=None, max_length=255)

    snap_click_id: Optional[str] = Field(default=None, max_length=255)
    snap_cookie_id: Optional[str] = Field(default=None, max_length=255)
    meta_fbclid: Optional[str] = Field(default=None, max_length=255)
    tiktok_ttclid: Optional[str] = Field(default=None, max_length=255)


class TrackingEventIn(BaseModel):
    model_config = ConfigDict(extra="ignore")

    event_name: str = Field(..., min_length=1, max_length=64)
    event_id: Optional[str] = Field(default=None, max_length=128)
    session_id: Optional[str] = Field(default=None, max_length=128)
    step_name: Optional[str] = Field(default=None, max_length=64)
    order_id: Optional[str] = Field(default=None, max_length=64)
    source_platform: Optional[str] = Field(default=None, max_length=32)
    url: Optional[str] = Field(default=None, max_length=2048)
    tracking: Optional[TrackingContext] = None
    payload: Optional[Dict[str, Any]] = None


class TrackingEventResponse(BaseModel):
    success: bool = True
