"""initial schema: orders, order_items, tracking_events, admin_sessions, order_number_counter

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-22
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order_number", sa.String(length=20), nullable=False),
        sa.Column("customer_name", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=64), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("payment_method", sa.String(length=32), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("subtotal", sa.Integer(), nullable=False),
        sa.Column("delivery_fee", sa.Integer(), nullable=False),
        sa.Column("total", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("whatsapp_redirect_url", sa.Text(), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("landing_page_url", sa.Text(), nullable=True),
        sa.Column("referrer", sa.Text(), nullable=True),
        sa.Column("utm_source", sa.String(length=255), nullable=True),
        sa.Column("utm_medium", sa.String(length=255), nullable=True),
        sa.Column("utm_campaign", sa.String(length=255), nullable=True),
        sa.Column("utm_content", sa.String(length=255), nullable=True),
        sa.Column("utm_term", sa.String(length=255), nullable=True),
        sa.Column("snap_click_id", sa.String(length=512), nullable=True),
        sa.Column("snap_cookie_id", sa.String(length=512), nullable=True),
        sa.Column("meta_fbclid", sa.String(length=512), nullable=True),
        sa.Column("tiktok_ttclid", sa.String(length=512), nullable=True),
        sa.Column("event_id", sa.String(length=128), nullable=True),
        sa.Column("session_id", sa.String(length=128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_number"),
    )
    op.create_index("ix_orders_order_number", "orders", ["order_number"])
    op.create_index("ix_orders_phone", "orders", ["phone"])
    op.create_index("ix_orders_status", "orders", ["status"])
    op.create_index("ix_orders_event_id", "orders", ["event_id"])
    op.create_index("ix_orders_session_id", "orders", ["session_id"])

    op.create_table(
        "order_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order_number", sa.String(length=20), nullable=False),
        sa.Column("item_number", sa.Integer(), nullable=False),
        sa.Column("plate_style", sa.String(length=32), nullable=False),
        sa.Column("plate_style_label_ar", sa.String(length=128), nullable=False),
        sa.Column("plate_letter", sa.String(length=4), nullable=True),
        sa.Column("plate_number", sa.String(length=64), nullable=True),
        sa.Column("item_price", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("google_sheet_row_number", sa.Integer(), nullable=True),
        sa.Column("google_sheet_sync_status", sa.String(length=32), nullable=False),
        sa.Column("google_sheet_last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"])
    op.create_index("ix_order_items_order_number", "order_items", ["order_number"])
    op.create_index("ix_order_items_plate_style", "order_items", ["plate_style"])
    op.create_index("ix_order_items_status", "order_items", ["status"])

    op.create_table(
        "tracking_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_name", sa.String(length=64), nullable=False),
        sa.Column("event_id", sa.String(length=128), nullable=True),
        sa.Column("session_id", sa.String(length=128), nullable=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("step_name", sa.String(length=64), nullable=True),
        sa.Column("source_platform", sa.String(length=32), nullable=True),
        sa.Column("url", sa.Text(), nullable=True),
        sa.Column("referrer", sa.Text(), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("utm_source", sa.String(length=255), nullable=True),
        sa.Column("utm_medium", sa.String(length=255), nullable=True),
        sa.Column("utm_campaign", sa.String(length=255), nullable=True),
        sa.Column("utm_content", sa.String(length=255), nullable=True),
        sa.Column("utm_term", sa.String(length=255), nullable=True),
        sa.Column("snap_click_id", sa.String(length=512), nullable=True),
        sa.Column("snap_cookie_id", sa.String(length=512), nullable=True),
        sa.Column("meta_fbclid", sa.String(length=512), nullable=True),
        sa.Column("tiktok_ttclid", sa.String(length=512), nullable=True),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tracking_events_event_name", "tracking_events", ["event_name"])
    op.create_index("ix_tracking_events_event_id", "tracking_events", ["event_id"])
    op.create_index("ix_tracking_events_session_id", "tracking_events", ["session_id"])
    op.create_index("ix_tracking_events_created_at", "tracking_events", ["created_at"])

    op.create_table(
        "admin_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("username", sa.String(length=255), nullable=False),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("user_agent", sa.String(length=512), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "order_number_counter",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("last_value", sa.BigInteger(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    # Seed the counter row at 0.
    op.execute("INSERT INTO order_number_counter (id, last_value) VALUES (1, 0)")


def downgrade() -> None:
    op.drop_table("order_number_counter")
    op.drop_table("admin_sessions")
    op.drop_index("ix_tracking_events_created_at", table_name="tracking_events")
    op.drop_index("ix_tracking_events_session_id", table_name="tracking_events")
    op.drop_index("ix_tracking_events_event_id", table_name="tracking_events")
    op.drop_index("ix_tracking_events_event_name", table_name="tracking_events")
    op.drop_table("tracking_events")
    op.drop_index("ix_order_items_status", table_name="order_items")
    op.drop_index("ix_order_items_plate_style", table_name="order_items")
    op.drop_index("ix_order_items_order_number", table_name="order_items")
    op.drop_index("ix_order_items_order_id", table_name="order_items")
    op.drop_table("order_items")
    op.drop_index("ix_orders_session_id", table_name="orders")
    op.drop_index("ix_orders_event_id", table_name="orders")
    op.drop_index("ix_orders_status", table_name="orders")
    op.drop_index("ix_orders_phone", table_name="orders")
    op.drop_index("ix_orders_order_number", table_name="orders")
    op.drop_table("orders")
