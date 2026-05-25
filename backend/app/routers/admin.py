"""Admin endpoints: login, metrics, orders, order-items, status update."""
from __future__ import annotations

import uuid
from datetime import date, datetime, time, timedelta, timezone
from typing import Optional, Tuple

try:
    from zoneinfo import ZoneInfo
    _QATAR_TZ = ZoneInfo("Asia/Qatar")
except Exception:  # noqa: BLE001
    _QATAR_TZ = timezone(timedelta(hours=3))  # Qatar is UTC+3, no DST.

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from ..config import settings
from ..constants import ORDER_STATUSES, PLATE_STYLES
from ..database import get_db
from ..logging_config import get_logger
from ..middleware import get_client_ip
from ..models.admin_session import AdminSession
from ..models.order import Order
from ..models.order_item import OrderItem
from ..schemas.admin import (
    AdminLoginRequest,
    AdminLoginResponse,
    MetricsResponse,
    StatusUpdateRequest,
    StatusUpdateResponse,
)
from ..schemas.orders import (
    OrderItemOut,
    OrderOut,
    PaginatedOrderItems,
    PaginatedOrders,
)
from ..security import create_access_token, require_admin, verify_admin_credentials
from ..services import google_sheets
from ..services.metrics import build_metrics

router = APIRouter(prefix="/api/admin")
logger = get_logger("keychain.admin")


def _parse_qatar_date(value: str, field: str) -> date:
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid {field}: expected YYYY-MM-DD",
        )


def _date_range_to_utc(
    start_date: Optional[str],
    end_date: Optional[str],
) -> Tuple[Optional[datetime], Optional[datetime]]:
    """Interpret start/end dates in Asia/Qatar; return [start_utc, end_utc) bounds.

    end_date is treated inclusively: bound becomes midnight of end_date + 1 day, Qatar local.
    """
    start_dt: Optional[datetime] = None
    end_dt: Optional[datetime] = None
    if start_date:
        d = _parse_qatar_date(start_date, "start_date")
        start_dt = datetime.combine(d, time.min, tzinfo=_QATAR_TZ).astimezone(timezone.utc)
    if end_date:
        d = _parse_qatar_date(end_date, "end_date")
        end_local = datetime.combine(d, time.min, tzinfo=_QATAR_TZ) + timedelta(days=1)
        end_dt = end_local.astimezone(timezone.utc)
    if start_dt and end_dt and end_dt <= start_dt:
        raise HTTPException(status_code=422, detail="end_date must be on or after start_date")
    return start_dt, end_dt


@router.post("/login", response_model=AdminLoginResponse)
def admin_login(
    payload: AdminLoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> AdminLoginResponse:
    if not verify_admin_credentials(payload.username, payload.password):
        logger.warning("admin_login_failed", extra={"client_ip": get_client_ip(request)})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = create_access_token(subject=payload.username)
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    # Best-effort audit row; never block login if it fails.
    try:
        db.add(
            AdminSession(
                username=payload.username,
                ip_address=get_client_ip(request),
                user_agent=(request.headers.get("user-agent") or "")[:512],
                expires_at=expires_at,
            )
        )
        db.commit()
    except Exception:  # noqa: BLE001
        db.rollback()
        logger.exception("admin_session_audit_failed")

    return AdminLoginResponse(success=True, access_token=token, token_type="bearer")


@router.get("/metrics", response_model=MetricsResponse)
def admin_metrics(
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
) -> MetricsResponse:
    start_dt, end_dt = _date_range_to_utc(start_date, end_date)
    return MetricsResponse(**build_metrics(db, start_dt=start_dt, end_dt=end_dt))


@router.get("/orders", response_model=PaginatedOrders)
def admin_orders(
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    status_filter: Optional[str] = Query(None, alias="status"),
    plate_style: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
) -> PaginatedOrders:
    start_dt, end_dt = _date_range_to_utc(start_date, end_date)
    stmt = select(Order).options(selectinload(Order.items))
    count_stmt = select(func.count(Order.id))

    if start_dt is not None:
        stmt = stmt.where(Order.created_at >= start_dt)
        count_stmt = count_stmt.where(Order.created_at >= start_dt)
    if end_dt is not None:
        stmt = stmt.where(Order.created_at < end_dt)
        count_stmt = count_stmt.where(Order.created_at < end_dt)

    if status_filter:
        if status_filter not in ORDER_STATUSES:
            raise HTTPException(status_code=422, detail="Invalid status filter")
        stmt = stmt.where(Order.status == status_filter)
        count_stmt = count_stmt.where(Order.status == status_filter)

    if plate_style:
        if plate_style not in PLATE_STYLES:
            raise HTTPException(status_code=422, detail="Invalid plate_style filter")
        sub = select(OrderItem.order_id).where(OrderItem.plate_style == plate_style)
        stmt = stmt.where(Order.id.in_(sub))
        count_stmt = count_stmt.where(Order.id.in_(sub))

    if search:
        like = f"%{search.strip()}%"
        cond = Order.order_number.ilike(like) | Order.phone.ilike(like) | Order.customer_name.ilike(like)
        stmt = stmt.where(cond)
        count_stmt = count_stmt.where(cond)

    total = int(db.execute(count_stmt).scalar() or 0)
    stmt = stmt.order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = db.execute(stmt).scalars().all()

    return PaginatedOrders(
        items=[OrderOut.model_validate(o) for o in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/order-items", response_model=PaginatedOrderItems)
def admin_order_items(
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    status_filter: Optional[str] = Query(None, alias="status"),
    plate_style: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
) -> PaginatedOrderItems:
    start_dt, end_dt = _date_range_to_utc(start_date, end_date)
    stmt = select(OrderItem)
    count_stmt = select(func.count(OrderItem.id))

    if start_dt is not None:
        stmt = stmt.where(OrderItem.created_at >= start_dt)
        count_stmt = count_stmt.where(OrderItem.created_at >= start_dt)
    if end_dt is not None:
        stmt = stmt.where(OrderItem.created_at < end_dt)
        count_stmt = count_stmt.where(OrderItem.created_at < end_dt)

    if status_filter:
        if status_filter not in ORDER_STATUSES:
            raise HTTPException(status_code=422, detail="Invalid status filter")
        stmt = stmt.where(OrderItem.status == status_filter)
        count_stmt = count_stmt.where(OrderItem.status == status_filter)

    if plate_style:
        if plate_style not in PLATE_STYLES:
            raise HTTPException(status_code=422, detail="Invalid plate_style filter")
        stmt = stmt.where(OrderItem.plate_style == plate_style)
        count_stmt = count_stmt.where(OrderItem.plate_style == plate_style)

    if search:
        like = f"%{search.strip()}%"
        cond = OrderItem.order_number.ilike(like) | OrderItem.plate_number.ilike(like)
        stmt = stmt.where(cond)
        count_stmt = count_stmt.where(cond)

    total = int(db.execute(count_stmt).scalar() or 0)
    stmt = stmt.order_by(OrderItem.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = db.execute(stmt).scalars().all()

    return PaginatedOrderItems(
        items=[OrderItemOut.model_validate(i) for i in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.patch("/order-items/{item_id}/status", response_model=StatusUpdateResponse)
def update_item_status(
    item_id: str,
    payload: StatusUpdateRequest,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin),
) -> StatusUpdateResponse:
    try:
        item_uuid = uuid.UUID(item_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=422, detail="Invalid item id")

    item = db.execute(
        select(OrderItem).where(OrderItem.id == item_uuid)
    ).scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail="Order item not found")

    # 1. Update Postgres
    item.status = payload.status
    try:
        db.commit()
        db.refresh(item)
    except Exception:
        db.rollback()
        logger.exception("status_update_db_failed", extra={"item_id": item_id})
        raise

    # 2. Update Google Sheet row (if any). Failure keeps Postgres + surfaces error.
    sheet_error: Optional[str] = None
    if item.google_sheet_row_number and google_sheets.is_enabled():
        ok = google_sheets.update_item_status(item.google_sheet_row_number, payload.status)
        if ok:
            item.google_sheet_sync_status = "synced"
            item.google_sheet_last_synced_at = datetime.now(timezone.utc)
        else:
            item.google_sheet_sync_status = "error"
            sheet_error = "Failed to update Google Sheet row; Postgres updated."
        try:
            db.commit()
            db.refresh(item)
        except Exception:  # noqa: BLE001
            db.rollback()
            logger.exception("status_update_sheet_status_persist_failed")
    elif not google_sheets.is_enabled():
        item.google_sheet_sync_status = "disabled"

    return StatusUpdateResponse(
        success=True,
        id=str(item.id),
        status=item.status,
        google_sheet_sync_status=item.google_sheet_sync_status,
        sheet_error=sheet_error,
    )
