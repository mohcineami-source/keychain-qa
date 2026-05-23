# 08 — API Contracts

Base API URL:

```
https://api.keychain.qa
```

All request/response bodies are JSON. CORS is restricted to the frontend origin. The order endpoint is rate-limited. Pricing is always recalculated server-side.

---

## Health

`GET /api/health`

Response:
```json
{
  "ok": true,
  "service": "keychain-api",
  "database": "ok"
}
```

---

## Create order

`POST /api/orders`

Request:
```json
{
  "customer_name": "محمد",
  "phone": "33423421",
  "address": "الدوحة",
  "payment_method": "cash",
  "items": [
    {
      "plate_style": "new_2026",
      "plate_letter": "Q",
      "plate_number": "123456"
    },
    {
      "plate_style": "custom_choice"
    }
  ],
  "tracking": {
    "event_id": "uuid",
    "session_id": "uuid",
    "landing_page_url": "https://keychain.qa",
    "referrer": "",
    "utm_source": "",
    "utm_campaign": "",
    "snap_click_id": "",
    "snap_cookie_id": ""
  }
}
```

Response:
```json
{
  "success": true,
  "order_number": "KCQ-000001",
  "quantity": 2,
  "total": 260,
  "currency": "QAR",
  "whatsapp_url": "https://wa.me/97433423421?text=..."
}
```

### Validation rules
- `customer_name` required.
- `phone` required (general number/string validation; **not** Qatar-format-locked).
- `address` required.
- `payment_method` required and must be `cash` or `fawran_transfer`.
- At least one item required.
- Non-custom plate style requires `plate_number`.
- `new_2026` allows `plate_letter` ∈ {Q, T, R}, default **Q**.
- `custom_choice` does **not** require a plate number (and no plate number field is sent).
- **Server recalculates pricing; never trust frontend totals.** `total = 160 + (quantity-1)*100`, first item 160, each additional 100.

### Server-side behavior on success
1. Persist `orders` + N `order_items` (one per keychain) in Postgres.
2. Sync each item to Google Sheets (`order_items` tab) — failure logged, does not roll back the order.
3. Fire `SubmitOrder`/`Purchase` events safely (non-blocking), storing `event_id` for dedupe.
4. Build the `wa.me` URL with the short prefilled message.

---

## Tracking event

`POST /api/tracking/event`

Request:
```json
{
  "event_name": "OfferView",
  "event_id": "uuid",
  "session_id": "uuid",
  "step_name": "offer",
  "url": "https://keychain.qa",
  "tracking": {}
}
```

Supported `event_name` values:
- `PageView`
- `OfferView`
- `SelectPlateStyle`
- `AddAnotherPlate`
- `InitiateCheckout`
- `SubmitOrder`
- `Purchase`

Behavior: persist to `tracking_events`; optionally forward to Snapchat CAPI (if enabled) using the same `event_id` for browser↔server dedupe. UTM/ScCid/_scid fields ride in `tracking`. Failures are swallowed and never block the funnel.

---

## Admin login

`POST /api/admin/login`

Request:
```json
{
  "username": "admin",
  "password": "password"
}
```

Uses env credentials (`ADMIN_USERNAME` / `ADMIN_PASSWORD`). Returns a session token / sets a signed cookie on success; rejects wrong credentials.

---

## Admin metrics

`GET /api/admin/metrics`

Returns:
- total orders
- total revenue
- today orders
- keychains sold
- conversion rates
- funnel step counts
- drop-off by step
- orders by plate style
- payment method split
- status counts

(See `docs/12-admin-dashboard.md` for the exact KPI list and conversion-rate definitions.)

---

## Admin orders

`GET /api/admin/orders`

Supports pagination and filtering (by status, plate style; search by order number/phone). Returns orders grouped by order number with customer, phone, total, quantity, payment method, status summary, created date.

---

## Admin production items

`GET /api/admin/order-items`

Returns one row per keychain (matching the Google Sheet structure), including plate style/letter/number, item price, status, and sheet sync status.

---

## Update item status

`PATCH /api/admin/order-items/{id}/status`

Request:
```json
{
  "status": "confirmed"
}
```

Allowed status values:
```
new, contacted, confirmed, in_production, out_for_delivery, delivered, cancelled
```

Behavior: updates Postgres **and** the corresponding Google Sheet row. If the sheet update fails, Postgres stays updated and the sync error is surfaced in admin.

---

## Error conventions

- `400` validation errors (invalid payment method, missing plate number for non-custom, no items, etc.).
- `401` admin auth failures.
- `404` unknown order item id on status update.
- `429` rate limit exceeded on order creation.
- `5xx` server errors (logged; do not leak secrets).

Tracking and Sheets failures do **not** turn order creation into an error response.
