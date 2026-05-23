# 00 — Project Overview

## What this is

**keychain.qa** is a single-product, conversion-first funnel selling a **custom acrylic Qatar car-plate keychain** — Arabic name **ميدالية رقم السيارة**. It is intentionally **not** a multi-product store. The entire experience is one premium, Arabic-only step funnel built to maximize completed orders in the Qatar market.

## One-line value proposition

> خل رقم موترك دوم معاك — a personalized acrylic keychain of your car's plate, delivered across Qatar in 24–48 hours, price includes delivery.

## Key facts

| Item | Value |
|------|-------|
| Brand / product (AR) | ميدالية رقم السيارة |
| Customer domain | keychain.qa |
| API domain | api.keychain.qa |
| Admin path | keychain.qa/admin |
| Market | Qatar only |
| Currency | QAR / ريال قطري |
| Customer language | Arabic only, RTL |
| Admin & Google Sheet language | English |
| Material | Acrylic |
| Delivery | Included in price |
| Production + delivery time | 24–48 hours inside Qatar |
| Support channel | WhatsApp only, +97433423421 (wa.me redirect, no Business API) |
| Email | None |

## Pricing

- First keychain: **160 QAR** (delivery included)
- Each additional keychain: **+100 QAR**
- Unlimited extra keychains
- Examples: 1 = 160, 2 = 260, 3 = 360, 4 = 460 QAR
- Formula (shared frontend + backend): `total = 160 + (quantity - 1) * 100`
- Pricing is **server-authoritative**; the frontend total is display-only.

## Plate styles (5)

| id | Arabic title | Plate number? | Letter? |
|----|--------------|---------------|---------|
| `new_2026` | اللوحة الجديدة 2026 | required | Q / T / R (default Q) |
| `private` | اللوحة الخاصة | required | — |
| `classic` | اللوحة الكلاسيكية | required | — |
| `motorcycle` | لوحة الدراجة النارية | required | — |
| `custom_choice` | اختيار مخصص | none (handled via WhatsApp) | — |

## Order lifecycle

`new → contacted → confirmed → in_production → out_for_delivery → delivered → cancelled`

New orders/items start as `new`. Order number format: **KCQ-000001**.

## Payment methods

`cash` (كاش) and `fawran_transfer` (تحويل فورا). No default is pre-selected; the customer must choose.

## Data destinations

- **Postgres** — orders, order_items, tracking_events (the system of record).
- **Google Sheets** (tab `order_items`) — one row per keychain, English columns, no tracking/UTM data.
- **Snapchat** — Pixel + Conversions API (enabled). Meta + TikTok scaffolded but disabled.
- **WhatsApp** — short prefilled redirect message after order.

## Hard constraints

1. Arabic-only customer UI; English admin/sheets.
2. No fake reviews/scarcity/certifications/guarantees/official approval.
3. Tracking failure never blocks checkout.
4. Google Sheets failure never blocks order creation in Postgres.
5. Site must look complete with placeholder images before real photos exist.
6. Docs-first: documentation precedes code.

## Tech stack (summary)

- **Frontend:** Next.js App Router, TypeScript, Tailwind, shadcn/ui, React Hook Form, Zod, Zustand.
- **Backend:** FastAPI, Postgres, SQLAlchemy 2.0, Alembic, Pydantic settings, Uvicorn/Gunicorn.
- **Deploy:** Docker on Easypanel (frontend, backend, postgres services).

## Scope boundaries

- No live plate preview at launch.
- No remove/edit cart system (add-another loop only).
- No cancellation/refund policy text at launch.
- No packaging messaging.
- Phone validation is general (not Qatar-format-locked).
- Address is a single free-text field (drivers coordinate via call/WhatsApp).
