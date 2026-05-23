"""Row-locked counter table used to generate unique sequential order numbers.

A single row (id=1) holds the last issued value. The order-number service
selects it ``WITH FOR UPDATE`` inside the order transaction, increments it, and
formats ``KCQ-000001``. This is safe against concurrent duplicates.
"""
from __future__ import annotations

from sqlalchemy import BigInteger, Integer
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class OrderNumberCounter(Base):
    __tablename__ = "order_number_counter"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    last_value: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
