"""Order creation endpoint."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from ..constants import CURRENCY, PLATE_STYLE_LABELS_AR
from ..database import get_db
from ..logging_config import get_logger
from ..middleware import get_client_ip
from ..models.order import Order
from ..models.order_item import OrderItem
from ..schemas.orders import OrderCreate, OrderCreateResponse
from ..schemas.tracking import TrackingContext
from ..services import google_sheets, tracking
from ..services.order_number import next_order_number
from ..services.pricing import compute_order_pricing, item_price_for_index
from ..services.whatsapp import build_whatsapp_url

router = APIRouter()
logger = get_logger("keychain.orders")


@router.post("/api/orders", response_model=OrderCreateResponse)
def create_order(
    payload: OrderCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> OrderCreateResponse:
    ctx = payload.tracking or TrackingContext()
    user_agent = request.headers.get("user-agent")
    ip_address = get_client_ip(request)

    quantity = len(payload.items)
    pricing = compute_order_pricing(quantity)

    # --- 1. Persist order + items in Postgres FIRST (single transaction) ---
    order = Order(
        order_number="PENDING",  # replaced below within the transaction
        customer_name=payload.customer_name,
        phone=payload.phone,
        address=payload.address,
        payment_method=payload.payment_method,
        quantity=quantity,
        subtotal=pricing["subtotal"],
        delivery_fee=pricing["delivery_fee"],
        total=pricing["total"],
        currency=CURRENCY,
        status="new",
        user_agent=user_agent,
        ip_address=ip_address,
        landing_page_url=ctx.landing_page_url,
        referrer=ctx.referrer,
        utm_source=ctx.utm_source,
        utm_medium=ctx.utm_medium,
        utm_campaign=ctx.utm_campaign,
        utm_content=ctx.utm_content,
        utm_term=ctx.utm_term,
        snap_click_id=ctx.snap_click_id,
        snap_cookie_id=ctx.snap_cookie_id,
        meta_fbclid=ctx.meta_fbclid,
        tiktok_ttclid=ctx.tiktok_ttclid,
        event_id=ctx.event_id,
        session_id=ctx.session_id,
    )

    try:
        # Reserve a unique order number with a row lock inside this txn.
        order_number = next_order_number(db)
        order.order_number = order_number
        db.add(order)
        db.flush()  # assign order.id

        for index, item_in in enumerate(payload.items):
            order.items.append(
                OrderItem(
                    order_number=order_number,
                    item_number=index + 1,
                    plate_style=item_in.plate_style,
                    plate_style_label_ar=PLATE_STYLE_LABELS_AR.get(item_in.plate_style, ""),
                    plate_letter=item_in.plate_letter,
                    plate_number=item_in.plate_number,
                    item_price=item_price_for_index(index),
                    status="new",
                    google_sheet_sync_status="pending",
                )
            )
        db.commit()
        db.refresh(order)
    except Exception:
        db.rollback()
        logger.exception("order_create_db_failed")
        raise

    logger.info(
        "order_created",
        extra={"order_number": order.order_number, "quantity": quantity, "total": order.total},
    )

    # --- 2. Sync each item to Google Sheets (failure must NOT fail the order) ---
    _sync_items_to_sheet(db, order)

    # --- 3. Build WhatsApp URL ---
    whatsapp_url = build_whatsapp_url(
        order_number=order.order_number,
        customer_name=order.customer_name,
        phone=order.phone,
        quantity=quantity,
        total=order.total,
        payment_method=order.payment_method,
    )
    try:
        order.whatsapp_redirect_url = whatsapp_url
        db.commit()
    except Exception:  # noqa: BLE001
        db.rollback()
        logger.exception("order_whatsapp_url_persist_failed")

    # --- 4. Fire server-side tracking (Purchase) — never raises ---
    try:
        tracking.dispatch_server_events(
            event_name="Purchase",
            event_id=order.event_id,
            ctx=ctx,
            user_agent=user_agent,
            ip_address=ip_address,
            url=ctx.landing_page_url,
            phone=order.phone,
            value=float(order.total),
            currency=CURRENCY,
            number_items=quantity,
        )
    except Exception:  # noqa: BLE001
        logger.exception("order_purchase_tracking_failed")

    return OrderCreateResponse(
        success=True,
        order_number=order.order_number,
        quantity=quantity,
        total=order.total,
        currency=CURRENCY,
        whatsapp_url=whatsapp_url,
    )


def _sync_items_to_sheet(db: Session, order: Order) -> None:
    """Append one row per keychain to Google Sheets, recording sync status."""
    for item in sorted(order.items, key=lambda i: i.item_number):
        try:
            row_number = google_sheets.append_item_row(
                order_number=order.order_number,
                item_number=item.item_number,
                customer_name=order.customer_name,
                phone=order.phone,
                address=order.address,
                plate_style=item.plate_style,
                plate_letter=item.plate_letter,
                plate_number=item.plate_number,
                item_price=item.item_price,
                total_order_value=order.total,
                payment_method=order.payment_method,
                status=item.status,
                created_at=order.created_at.isoformat() if order.created_at else "",
            )
            if row_number:
                item.google_sheet_row_number = row_number
                item.google_sheet_sync_status = "synced"
                item.google_sheet_last_synced_at = datetime.now(timezone.utc)
            else:
                # Disabled or failed — distinguish via enabled flag.
                item.google_sheet_sync_status = (
                    "disabled" if not google_sheets.is_enabled() else "error"
                )
        except Exception:  # noqa: BLE001
            logger.exception(
                "order_item_sheet_sync_failed",
                extra={"order_number": order.order_number, "item_number": item.item_number},
            )
            item.google_sheet_sync_status = "error"
    try:
        db.commit()
    except Exception:  # noqa: BLE001
        db.rollback()
        logger.exception("order_item_sheet_sync_status_persist_failed")
