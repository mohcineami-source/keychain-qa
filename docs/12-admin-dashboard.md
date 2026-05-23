# 12 — Admin Dashboard

Path: `https://keychain.qa/admin`. **English UI** is acceptable (and expected). Protected by a simple username + password from env (`ADMIN_USERNAME` / `ADMIN_PASSWORD`).

## Authentication

- `POST /api/admin/login` with `{ username, password }` validated against env credentials.
- On success, the backend issues a session (JWT or signed cookie via `SECRET_KEY`).
- Wrong password is rejected. No multi-user system.

## KPIs / metrics (`GET /api/admin/metrics`)

**Volume & revenue:**
- total orders
- total revenue
- today's orders
- total keychains sold
- average order value (AOV)

**Breakdowns:**
- orders by status
- orders by plate style
- payment method split (cash vs fawran_transfer)

**Funnel counts (from `tracking_events`):**
- sessions
- offer views
- style selections
- checkout starts
- submitted orders

**Conversion rates:**
- sessions → orders
- offer views → orders
- style selections → orders
- checkout starts → orders
- checkout starts → completed orders

**Drop-off by funnel step** (where users leave): offer → plate → add → checkout → submit.

## Views

### 1. Orders view (grouped by order number)
Columns: customer name, phone, total, quantity, payment method, status summary, created date. One line per order. Supports filtering and search.

### 2. Production view (one row per keychain)
Matches the Google Sheet structure: order number, item number, customer, phone, plate style, plate letter, plate number, item price, status, **sheet sync status**. Allows **status update per item**.

## Status update

- `PATCH /api/admin/order-items/{id}/status` with `{ "status": "confirmed" }`.
- Allowed: `new, contacted, confirmed, in_production, out_for_delivery, delivered, cancelled`.
- Updates Postgres **and** the corresponding Google Sheet row.
- If the Sheet update fails, Postgres stays updated and the sync error is shown in the production view (`google_sheet_sync_status = error`).

## Filtering & search

- Filter by status.
- Filter by plate style.
- Search by order number or phone.
- Pagination on orders and order-items endpoints.

## UI guidelines

- Clean tables (English headers).
- Status shown via `StatusSelect` component for quick updates in the production view.
- Sheet sync status badge per item (synced / pending / error).
- Responsive enough for desktop and mobile.

## Components (frontend)

```
components/admin/
  AdminLogin.tsx
  AdminDashboard.tsx
  MetricsCards.tsx          # volume/revenue KPIs
  FunnelMetrics.tsx         # funnel counts + conversion rates + drop-off
  OrdersTable.tsx           # grouped orders view
  ProductionItemsTable.tsx  # per-keychain production view
  StatusSelect.tsx          # status dropdown -> PATCH
```

## Data sources

- KPIs and conversion/drop-off come from `services/metrics.py` aggregating `orders`, `order_items`, and `tracking_events`.
- Tracking data used here lives only in Postgres (never the Sheet).
