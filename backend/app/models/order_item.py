"""OrderItem ORM model — one row per keychain."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..constants import DEFAULT_STATUS
from ..database import Base


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    order_number: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    item_number: Mapped[int] = mapped_column(Integer, nullable=False)

    plate_style: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    plate_style_label_ar: Mapped[str] = mapped_column(String(128), nullable=False)
    plate_letter: Mapped[Optional[str]] = mapped_column(String(4), nullable=True)
    plate_number: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    item_price: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default=DEFAULT_STATUS, index=True)

    # Google Sheets sync bookkeeping
    google_sheet_row_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    google_sheet_sync_status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    google_sheet_last_synced_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    order: Mapped["Order"] = relationship("Order", back_populates="items")
