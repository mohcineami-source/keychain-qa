"""Pydantic schemas for the order API (request validation + responses)."""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from ..constants import (
    CURRENCY,
    DEFAULT_PLATE_LETTER,
    PAYMENT_METHODS,
    PLATE_LETTERS,
    PLATE_STYLES,
)
from .tracking import TrackingContext


class OrderItemIn(BaseModel):
    model_config = ConfigDict(extra="ignore")

    plate_style: str
    plate_letter: Optional[str] = None
    plate_number: Optional[str] = None

    @field_validator("plate_style")
    @classmethod
    def validate_style(cls, v: str) -> str:
        if v not in PLATE_STYLES:
            raise ValueError(
                f"plate_style must be one of {PLATE_STYLES}"
            )
        return v

    @field_validator("plate_number", "plate_letter", mode="before")
    @classmethod
    def empty_to_none(cls, v):
        if isinstance(v, str) and v.strip() == "":
            return None
        return v

    @model_validator(mode="after")
    def validate_item(self) -> "OrderItemIn":
        style = self.plate_style
        if style == "custom_choice":
            # custom choice: no plate number expected, letter ignored
            self.plate_number = None
            self.plate_letter = None
            return self

        # non-custom requires a plate number
        if not self.plate_number or not str(self.plate_number).strip():
            raise ValueError(
                f"plate_number is required for plate_style '{style}'"
            )

        if style == "new_2026":
            letter = (self.plate_letter or DEFAULT_PLATE_LETTER).upper()
            if letter not in PLATE_LETTERS:
                raise ValueError(
                    f"plate_letter for new_2026 must be one of {PLATE_LETTERS}"
                )
            self.plate_letter = letter
        else:
            # only new_2026 carries a letter
            self.plate_letter = None
        return self


class OrderCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    customer_name: str = Field(..., min_length=1, max_length=120)
    phone: str = Field(..., min_length=1, max_length=32)
    address: str = Field(..., min_length=1, max_length=500)
    payment_method: str
    items: List[OrderItemIn] = Field(..., min_length=1, max_length=20)
    tracking: Optional[TrackingContext] = None

    @field_validator("customer_name", "phone", "address")
    @classmethod
    def strip_required(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("field is required")
        # Reject ASCII control characters except newline/tab in the address
        # (which a customer might legitimately include between street lines).
        bad = [c for c in v if ord(c) < 0x20 and c not in ("\n", "\r", "\t")]
        if bad:
            raise ValueError("field contains invalid control characters")
        return v

    @field_validator("payment_method")
    @classmethod
    def validate_payment(cls, v: str) -> str:
        if v not in PAYMENT_METHODS:
            raise ValueError(f"payment_method must be one of {PAYMENT_METHODS}")
        return v


class OrderCreateResponse(BaseModel):
    success: bool = True
    order_number: str
    quantity: int
    total: int
    currency: str = CURRENCY
    whatsapp_url: str


# --- Admin-facing read schemas ---

class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order_id: str
    order_number: str
    item_number: int
    plate_style: str
    plate_style_label_ar: str
    plate_letter: Optional[str]
    plate_number: Optional[str]
    item_price: int
    status: str
    google_sheet_row_number: Optional[int]
    google_sheet_sync_status: str
    google_sheet_last_synced_at: Optional[str]
    created_at: Optional[str]

    @field_validator("id", "order_id", mode="before")
    @classmethod
    def uuid_to_str(cls, v):
        return str(v) if v is not None else v

    @field_validator("created_at", "google_sheet_last_synced_at", mode="before")
    @classmethod
    def dt_to_str(cls, v):
        return v.isoformat() if hasattr(v, "isoformat") else v


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order_number: str
    customer_name: str
    phone: str
    address: str
    payment_method: str
    quantity: int
    subtotal: int
    delivery_fee: int
    total: int
    currency: str
    status: str
    created_at: Optional[str]
    items: List[OrderItemOut] = []

    @field_validator("id", mode="before")
    @classmethod
    def uuid_to_str(cls, v):
        return str(v) if v is not None else v

    @field_validator("created_at", mode="before")
    @classmethod
    def dt_to_str(cls, v):
        return v.isoformat() if hasattr(v, "isoformat") else v


class PaginatedOrders(BaseModel):
    items: List[OrderOut]
    total: int
    page: int
    page_size: int


class PaginatedOrderItems(BaseModel):
    items: List[OrderItemOut]
    total: int
    page: int
    page_size: int
