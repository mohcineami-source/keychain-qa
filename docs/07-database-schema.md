# 07 — Database Schema

PostgreSQL via SQLAlchemy 2.0 + Alembic. Postgres is the **system of record**. Migrations run automatically on backend startup (`alembic upgrade head`).

## `orders`

One row per order.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | primary key |
| order_number | string, unique | format `KCQ-000001` |
| customer_name | string | required |
| phone | string | required, general (not Qatar-locked) |
| address | string/text | single free-text field |
| payment_method | string/enum | `cash` or `fawran_transfer` |
| quantity | integer | number of keychains |
| subtotal | numeric | = total at launch |
| delivery_fee | numeric | default `0` (delivery included) |
| total | numeric | server-calculated `160 + (q-1)*100` |
| currency | string | default `QAR` |
| status | string/enum | default `new` |
| whatsapp_redirect_url | string | optional |
| user_agent | string | captured server-side |
| ip_address | string | captured server-side |
| landing_page_url | string | tracking |
| referrer | string | tracking |
| utm_source | string | tracking |
| utm_medium | string | tracking |
| utm_campaign | string | tracking |
| utm_content | string | tracking |
| utm_term | string | tracking |
| snap_click_id | string | ScCid |
| snap_cookie_id | string | `_scid` |
| meta_fbclid | string | tracking |
| tiktok_ttclid | string | tracking |
| event_id | string/UUID | browser↔server dedupe |
| created_at | timestamp | |
| updated_at | timestamp | |

## `order_items`

One row per keychain. This table mirrors the Google Sheet structure.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | primary key |
| order_id | UUID FK → orders.id | |
| order_number | string | denormalized for sheet/admin |
| item_number | integer | 1..N within an order |
| plate_style | string/enum | `new_2026`, `private`, `classic`, `motorcycle`, `custom_choice` |
| plate_style_label_ar | string | Arabic label snapshot |
| plate_letter | string, nullable | only Q/T/R for `new_2026`, default Q |
| plate_number | string, nullable | required for non-custom; null for `custom_choice` |
| item_price | numeric | first item 160, additional 100 |
| status | string/enum | default `new` |
| google_sheet_row_number | integer, nullable | row in the `order_items` tab |
| google_sheet_sync_status | string | e.g. `synced`, `pending`, `error` |
| google_sheet_last_synced_at | timestamp, nullable | |
| created_at | timestamp | |
| updated_at | timestamp | |

**Pricing per item:** the first item in an order is `160`, every subsequent item is `100`. The order `total` equals the sum of `item_price` and also equals `160 + (quantity-1)*100`.

## `tracking_events`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | primary key |
| event_name | string | `PageView`, `OfferView`, `SelectPlateStyle`, `AddAnotherPlate`, `InitiateCheckout`, `SubmitOrder`, `Purchase` |
| event_id | string/UUID | dedupe key |
| session_id | string/UUID | |
| order_id | UUID, nullable | FK when applicable |
| step_name | string, nullable | `offer`, `plate`, `add`, `checkout`, etc. |
| source_platform | string | `web`, `snapchat`, ... |
| url | string | |
| referrer | string | |
| user_agent | string | |
| ip_address | string | server-side |
| utm_source/medium/campaign/content/term | string | UTM fields |
| snap_click_id | string | ScCid |
| snap_cookie_id | string | `_scid` |
| meta_fbclid | string | |
| tiktok_ttclid | string | |
| payload | JSONB | raw event payload |
| created_at | timestamp | |

Tracking data lives **only** here (and on `orders`) — never in Google Sheets.

## Admin auth

Login uses `ADMIN_USERNAME` / `ADMIN_PASSWORD` from env. A backend-issued JWT or signed cookie (signed with `SECRET_KEY`) is sufficient — no multi-user table required. An optional `admin_sessions` table may store issued sessions if convenient.

| Column (optional `admin_sessions`) | Type |
|---|---|
| id | UUID |
| token / session_id | string |
| created_at | timestamp |
| expires_at | timestamp |

## Optional logging tables

May be added if useful for observability (not required):
- `google_sheet_logs` — per-sync attempt result.
- `capi_logs` — per server-side event result.
- `error_logs` — captured backend errors.

## Statuses (English)

```
new → contacted → confirmed → in_production → out_for_delivery → delivered → cancelled
```

New orders and items start as `new`. Status updates write to **both** Postgres and the matching Google Sheet row; if the sheet update fails, Postgres is still updated and the sync error is surfaced in admin.

## Integrity & concurrency notes

- `order_number` is unique; generation is collision-safe (DB sequence or safe transaction).
- `order_items.order_id` cascades logically with its order.
- All money columns use a numeric type; `QAR` has no fractional fils in this funnel (whole-riyal pricing).
