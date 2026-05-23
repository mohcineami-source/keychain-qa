"""Server-side pricing. Never trust client totals."""
from __future__ import annotations

from typing import List

from ..constants import (
    ADDITIONAL_ITEM_PRICE,
    DELIVERY_FEE,
    FIRST_ITEM_PRICE,
)


def calculate_total(quantity: int) -> int:
    """total = 160 + (qty-1)*100 ; 0 for non-positive quantity."""
    if quantity <= 0:
        return 0
    return FIRST_ITEM_PRICE + (quantity - 1) * ADDITIONAL_ITEM_PRICE


def item_price_for_index(index: int) -> int:
    """Price for the item at zero-based position ``index``.

    First item is FIRST_ITEM_PRICE, every subsequent item ADDITIONAL_ITEM_PRICE.
    """
    return FIRST_ITEM_PRICE if index == 0 else ADDITIONAL_ITEM_PRICE


def item_prices(quantity: int) -> List[int]:
    return [item_price_for_index(i) for i in range(max(0, quantity))]


def compute_order_pricing(quantity: int) -> dict:
    """Return subtotal, delivery_fee and total for ``quantity`` keychains."""
    subtotal = calculate_total(quantity)
    return {
        "subtotal": subtotal,
        "delivery_fee": DELIVERY_FEE,
        "total": subtotal + DELIVERY_FEE,
    }
