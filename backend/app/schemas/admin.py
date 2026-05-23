"""Pydantic schemas for admin endpoints."""
from __future__ import annotations

from typing import Dict

from pydantic import BaseModel, ConfigDict, field_validator

from ..constants import ORDER_STATUSES


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminLoginResponse(BaseModel):
    success: bool = True
    access_token: str
    token_type: str = "bearer"


class StatusUpdateRequest(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ORDER_STATUSES:
            raise ValueError(f"status must be one of {ORDER_STATUSES}")
        return v


class StatusUpdateResponse(BaseModel):
    success: bool = True
    id: str
    status: str
    google_sheet_sync_status: str
    sheet_error: str | None = None


class ConversionRates(BaseModel):
    sessions_to_orders: float
    offer_views_to_orders: float
    style_selections_to_orders: float
    checkout_starts_to_orders: float
    checkout_starts_to_completed_orders: float


class FunnelCounts(BaseModel):
    sessions: int
    page_views: int
    offer_views: int
    style_selections: int
    add_another: int
    checkout_starts: int
    submitted_orders: int
    purchases: int


class MetricsResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    total_orders: int
    total_revenue: int
    today_orders: int
    keychains_sold: int
    average_order_value: float
    orders_by_status: Dict[str, int]
    orders_by_plate_style: Dict[str, int]
    payment_method_split: Dict[str, int]
    funnel_counts: FunnelCounts
    conversion_rates: ConversionRates
    drop_off_by_step: Dict[str, int]
    currency: str
