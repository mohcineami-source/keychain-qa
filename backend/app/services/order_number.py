"""Safe sequential order-number generation: KCQ-000001.

Uses a single-row counter table selected ``WITH FOR UPDATE`` inside the caller's
transaction. This serialises concurrent inserts and prevents duplicate order
numbers without relying on a DB sequence (keeps Alembic/Postgres simple and
portable).
"""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models.order_number_counter import OrderNumberCounter

PREFIX = "KCQ-"
PAD = 6


def format_order_number(value: int) -> str:
    return f"{PREFIX}{value:0{PAD}d}"


def next_order_number(db: Session) -> str:
    """Atomically reserve and return the next order number.

    Must be called within an active transaction; the row lock is released on
    commit/rollback by the caller.
    """
    row = db.execute(
        select(OrderNumberCounter)
        .where(OrderNumberCounter.id == 1)
        .with_for_update()
    ).scalar_one_or_none()

    if row is None:
        # First ever order: create the counter row.
        row = OrderNumberCounter(id=1, last_value=0)
        db.add(row)
        db.flush()
        # Re-lock the freshly inserted row.
        row = db.execute(
            select(OrderNumberCounter)
            .where(OrderNumberCounter.id == 1)
            .with_for_update()
        ).scalar_one()

    row.last_value = row.last_value + 1
    db.flush()
    return format_order_number(row.last_value)
