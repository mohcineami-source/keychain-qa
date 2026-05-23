# 09 — Google Sheets API Sync

## Method

Use the **Google Sheets API with a service account** (NOT Apps Script). The user has already created the service account and shared the target Sheet with the service-account email.

## Backend env vars

| Var | Purpose |
|-----|---------|
| `GOOGLE_SHEETS_ENABLED` | master on/off switch |
| `GOOGLE_SHEET_ID` | the spreadsheet ID |
| `GOOGLE_SHEET_TAB_NAME` | tab name, default `order_items` |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | service-account credentials (JSON; never committed) |

The service-account JSON and tokens stay server-side only.

## Single tab

Only one tab is used: **`order_items`**. The Sheet contains only order items — **no KPIs, no tracking/UTM data**.

## Columns (English, exact order)

```
order_number
item_number
customer_name
phone
address
plate_style
plate_letter
plate_number
item_price
total_order_value
payment_method
status
created_at
```

## Header auto-creation

On sync, the backend checks the first row. If headers are missing or wrong, it writes/repairs the header row before appending data. This makes a fresh, empty Sheet work without manual setup.

## Row model: one row per keychain

- Each keychain creates **one** row.
- A 3-keychain order creates **3 rows** sharing the same `order_number` with distinct `item_number` (1, 2, 3).
- `total_order_value` is the full order total repeated on each of that order's rows (so each row shows the order's total).
- `item_price` is per item (first 160, additional 100).
- `plate_letter` is populated only for `new_2026` (Q/T/R); blank otherwise.
- `plate_number` is blank for `custom_choice`.
- `payment_method` stores the English value (`cash` / `fawran_transfer`).
- `status` stores the English status (`new`, etc.).
- `created_at` is the order/item creation timestamp.

## Row tracking

After appending, store the resulting Sheet row number in `order_items.google_sheet_row_number`, and set `google_sheet_sync_status` (`synced` / `pending` / `error`) and `google_sheet_last_synced_at`.

## Status updates

When an admin updates an item status (`PATCH /api/admin/order-items/{id}/status`):
1. Update Postgres.
2. Update the matching Sheet row's `status` cell (located via `google_sheet_row_number`).

If the Sheet update fails, Postgres remains updated and the sync error is surfaced in admin (and logged). Order/status integrity never depends on the Sheet.

## Failure handling

- **Order creation must never be rolled back due to a Sheets failure.** Postgres is the system of record.
- On sync failure: log it, mark `google_sheet_sync_status = error`, and surface it in the admin production view. Optionally retry.
- `GOOGLE_SHEETS_ENABLED=false` skips syncing entirely (useful for local dev).

## Example mapping

Order `KCQ-000007`, customer "محمد", phone "33423421", address "الدوحة", payment `cash`, two items:
1. `new_2026`, letter `Q`, number `123456`, price 160
2. `custom_choice` (no number), price 100

Two rows are written:

| order_number | item_number | customer_name | phone | address | plate_style | plate_letter | plate_number | item_price | total_order_value | payment_method | status | created_at |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KCQ-000007 | 1 | محمد | 33423421 | الدوحة | new_2026 | Q | 123456 | 160 | 260 | cash | new | 2026-05-22T... |
| KCQ-000007 | 2 | محمد | 33423421 | الدوحة | custom_choice |  |  | 100 | 260 | cash | new | 2026-05-22T... |

## Setup checklist

1. Enable the Google Sheets API in the Google Cloud project.
2. Create a service account; download its JSON key.
3. Create the Sheet; add a tab named `order_items`.
4. Share the Sheet with the service-account email (Editor).
5. Set `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_TAB_NAME=order_items`, and `GOOGLE_SERVICE_ACCOUNT_JSON` in backend env.
6. Submit a test order and confirm rows appear with auto-created headers.
