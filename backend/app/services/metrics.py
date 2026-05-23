"""Admin metrics: KPIs, funnel counts, conversion rates, drop-off."""
from __future__ import annotations

from datetime import datetime, time, timezone
from typing import Dict

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..constants import CURRENCY, ORDER_STATUSES, PAYMENT_METHODS, PLATE_STYLES
from ..models.order import Order
from ..models.order_item import OrderItem
from ..models.tracking_event import TrackingEvent


def _distinct_sessions_for_events(db: Session, event_names) -> int:
    """Count distinct sessions that produced any of the given event names."""
    stmt = (
        select(func.count(func.distinct(TrackingEvent.session_id)))
        .where(TrackingEvent.event_name.in_(event_names))
        .where(TrackingEvent.session_id.isnot(None))
    )
    return int(db.execute(stmt).scalar() or 0)


def _rate(numerator: int, denominator: int) -> float:
    if denominator <= 0:
        return 0.0
    return round((numerator / denominator) * 100, 2)


def build_metrics(db: Session) -> dict:
    # --- Order KPIs ---
    total_orders = int(db.execute(select(func.count(Order.id))).scalar() or 0)
    total_revenue = int(db.execute(select(func.coalesce(func.sum(Order.total), 0))).scalar() or 0)
    keychains_sold = int(db.execute(select(func.count(OrderItem.id))).scalar() or 0)

    # Today's orders (UTC day boundary)
    today_start = datetime.combine(datetime.now(timezone.utc).date(), time.min, tzinfo=timezone.utc)
    today_orders = int(
        db.execute(
            select(func.count(Order.id)).where(Order.created_at >= today_start)
        ).scalar()
        or 0
    )

    average_order_value = round(total_revenue / total_orders, 2) if total_orders else 0.0

    # --- Orders by status ---
    orders_by_status: Dict[str, int] = {s: 0 for s in ORDER_STATUSES}
    for status_value, count in db.execute(
        select(Order.status, func.count(Order.id)).group_by(Order.status)
    ).all():
        orders_by_status[status_value] = int(count)

    # --- Orders by plate style (counted per item) ---
    orders_by_plate_style: Dict[str, int] = {s: 0 for s in PLATE_STYLES}
    for style, count in db.execute(
        select(OrderItem.plate_style, func.count(OrderItem.id)).group_by(OrderItem.plate_style)
    ).all():
        orders_by_plate_style[style] = int(count)

    # --- Payment method split ---
    payment_method_split: Dict[str, int] = {p: 0 for p in PAYMENT_METHODS}
    for method, count in db.execute(
        select(Order.payment_method, func.count(Order.id)).group_by(Order.payment_method)
    ).all():
        payment_method_split[method] = int(count)

    # --- Funnel counts (distinct sessions per stage) ---
    sessions = _distinct_sessions_for_events(db, ["PageView", "OfferView"])
    page_views = _distinct_sessions_for_events(db, ["PageView"])
    offer_views = _distinct_sessions_for_events(db, ["OfferView"])
    style_selections = _distinct_sessions_for_events(db, ["SelectPlateStyle"])
    add_another = _distinct_sessions_for_events(db, ["AddAnotherPlate"])
    checkout_starts = _distinct_sessions_for_events(db, ["InitiateCheckout"])
    submitted_orders = _distinct_sessions_for_events(db, ["SubmitOrder"])
    purchases = _distinct_sessions_for_events(db, ["Purchase"])

    # Completed orders = orders that reached delivered status
    completed_orders = orders_by_status.get("delivered", 0)

    funnel_counts = {
        "sessions": sessions,
        "page_views": page_views,
        "offer_views": offer_views,
        "style_selections": style_selections,
        "add_another": add_another,
        "checkout_starts": checkout_starts,
        "submitted_orders": submitted_orders,
        "purchases": purchases,
    }

    conversion_rates = {
        "sessions_to_orders": _rate(total_orders, sessions),
        "offer_views_to_orders": _rate(total_orders, offer_views),
        "style_selections_to_orders": _rate(total_orders, style_selections),
        "checkout_starts_to_orders": _rate(total_orders, checkout_starts),
        "checkout_starts_to_completed_orders": _rate(completed_orders, checkout_starts),
    }

    # --- Drop-off by step (how many sessions left between consecutive stages) ---
    drop_off_by_step = {
        "offer_to_style": max(offer_views - style_selections, 0),
        "style_to_checkout": max(style_selections - checkout_starts, 0),
        "checkout_to_submit": max(checkout_starts - submitted_orders, 0),
        "submit_to_purchase": max(submitted_orders - purchases, 0),
    }

    return {
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "today_orders": today_orders,
        "keychains_sold": keychains_sold,
        "average_order_value": average_order_value,
        "orders_by_status": orders_by_status,
        "orders_by_plate_style": orders_by_plate_style,
        "payment_method_split": payment_method_split,
        "funnel_counts": funnel_counts,
        "conversion_rates": conversion_rates,
        "drop_off_by_step": drop_off_by_step,
        "currency": CURRENCY,
    }
