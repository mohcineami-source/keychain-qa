# keychain.qa — Custom Qatar Car-Plate Acrylic Keychain Funnel

A focused, premium, **Arabic-only** single-product funnel that sells one product: a custom acrylic Qatar car-plate keychain ("ميدالية رقم السيارة"). Customers move through a single-page step funnel, submit an order, and are handed off to WhatsApp. Orders persist in Postgres, mirror to Google Sheets (one row per keychain), and fire Snapchat tracking events safely.

- **Customer site:** https://keychain.qa (Arabic, RTL)
- **API:** https://api.keychain.qa
- **Admin:** https://keychain.qa/admin (English UI)
- **Market:** Qatar only · **Currency:** QAR
- **WhatsApp:** +97433423421 (wa.me redirect — no Business API)

> Full product spec: `keychain_qa_claude_master_prompt_autonomous.md`. Agent rules: `CLAUDE.md`. Build workflow: `AGENTS.md`. Deep docs: `/docs`.

---

## Table of contents

1. [Architecture](#architecture)
2. [Tech stack](#tech-stack)
3. [Repository layout](#repository-layout)
4. [Prerequisites](#prerequisites)
5. [Local setup](#local-setup)
6. [Fonts (self-hosted Cairo)](#fonts-self-hosted-cairo)
7. [Environment variables](#environment-variables)
7. [Google Sheets setup](#google-sheets-setup)
8. [Testing](#testing)
9. [Deployment (Easypanel)](#deployment-easypanel)
10. [Documentation index](#documentation-index)

---

## Architecture

```
Customer (AR, RTL)  →  Next.js frontend (keychain.qa)
                              │  POST /api/orders, POST /api/tracking/event
                              ▼
                       FastAPI backend (api.keychain.qa)
                          ├─ Postgres (orders, order_items, tracking_events)
                          ├─ Google Sheets API (tab: order_items, one row per keychain)
                          ├─ Snapchat CAPI (server-side events)
                          └─ WhatsApp redirect URL (wa.me) returned to client
```

- **Pricing is server-authoritative.** The frontend shows a total; the backend recalculates (`160 + (quantity-1)*100`) and never trusts the client.
- **Tracking never blocks checkout.** Sheets/CAPI failures are logged and surfaced in admin but never roll back the order.
- **Snapchat enabled by default; Meta + TikTok scaffolded but disabled.**

---

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · React Hook Form · Zod · Zustand · next/image · next/script |
| Backend | FastAPI · SQLAlchemy 2.0 · Alembic · Pydantic settings · Uvicorn/Gunicorn |
| Database | PostgreSQL |
| Integrations | Google Sheets API (service account) · Snapchat Pixel + CAPI · WhatsApp (wa.me) |
| Deploy | Docker · Easypanel |

---

## Repository layout

```
.
├── CLAUDE.md                       # Agent operating rules
├── AGENTS.md                       # Phased build workflow + acceptance gates
├── README.md                       # This file
├── docker-compose.example.yml      # Local full-stack (frontend + backend + postgres)
├── .env.example                    # Root env (references frontend + backend)
├── .gitignore
├── docs/                           # Project documentation (00–15)
├── frontend/                       # Next.js app (App Router)
└── backend/                        # FastAPI app (+ Alembic migrations)
```

See `docs/05-frontend-architecture.md` and `docs/06-backend-architecture.md` for the full folder trees.

---

## Prerequisites

- Node.js 20+ and npm
- Python 3.11+
- PostgreSQL 15+ (or Docker)
- Docker + Docker Compose (for the full local stack)
- A Google Cloud service account with the Google Sheets API enabled, and a Sheet shared with the service-account email
- A Snapchat Pixel ID + Conversions API access token (for tracking)

---

## Local setup

### Option A — Docker Compose (recommended, full end-to-end)

```bash
cp .env.example .env        # fill the values you have
docker compose -f docker-compose.example.yml up --build
```

Starts:
- **postgres** — db/user/password all `keychain`, host `keychain_database`
- **backend** — runs `alembic upgrade head` then `uvicorn` on `:8000`
- **frontend** — Next.js on `:3000`

Verify: open `http://localhost:8000/api/health` → `{"ok": true, "service": "keychain-api", "database": "ok"}`, then `http://localhost:3000`.

### Option B — Run services manually

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                 # fill values
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
cp .env.example .env.local                           # fill values
npm install
npm run dev                                          # http://localhost:3000
```

---

## Fonts (self-hosted Cairo)

The frontend uses **Cairo** as its sole typeface. It is **self-hosted** from
`frontend/public/fonts/cairo/` and loaded via plain `@font-face` rules in
`frontend/app/globals.css`. We do **not** use `next/font/google` for it, so
production builds never contact `fonts.googleapis.com` and never need TLS bypass.

Files on disk (variable woff2, all weights `200–1000`):

```
frontend/public/fonts/cairo/cairo-arabic-variable.woff2      (~30 KB)
frontend/public/fonts/cairo/cairo-latin-variable.woff2       (~33 KB)
frontend/public/fonts/cairo/cairo-latin-ext-variable.woff2   (~16 KB)
frontend/public/fonts/cairo/LICENSE.txt                      (OFL 1.1)
```

They are sourced from the open-source [`@fontsource-variable/cairo`](https://www.npmjs.com/package/@fontsource-variable/cairo)
npm package (the same upstream Google Fonts publishes from). To refresh
to a newer Cairo release:

```bash
cd frontend
npm install @fontsource-variable/cairo@latest
cp node_modules/@fontsource-variable/cairo/files/cairo-arabic-wght-normal.woff2     public/fonts/cairo/cairo-arabic-variable.woff2
cp node_modules/@fontsource-variable/cairo/files/cairo-latin-wght-normal.woff2      public/fonts/cairo/cairo-latin-variable.woff2
cp node_modules/@fontsource-variable/cairo/files/cairo-latin-ext-wght-normal.woff2  public/fonts/cairo/cairo-latin-ext-variable.woff2
```

Three `@font-face` blocks (Arabic / Latin / Latin-Ext) split by
`unicode-range` so the browser fetches only what it needs per page. The Arabic
variable file is `<link rel="preload">`ed in `app/layout.tsx`.

### ⚠️ Known issue — Google Fonts behind a TLS-intercepting network

On machines sitting behind a corporate proxy / AV that intercepts HTTPS,
`next/font/google` may fail to download fonts at build/dev time with:

```
FetchError: ... fonts.googleapis.com ... UNABLE_TO_VERIFY_LEAF_SIGNATURE
⨯ Failed to download `Cairo` from Google Fonts. Using fallback font instead.
```

When this happens Next.js silently substitutes a synthetic Arial-based
fallback, which looks **nothing** like the real font.

The **permanent fix is the self-hosted setup above** — no network call, no
TLS issue, identical rendering everywhere.

`NODE_TLS_REJECT_UNAUTHORIZED=0` is **not** an acceptable production
workaround. It disables certificate verification process-wide and is a
real security regression. Use it only as a **one-off local debugging aid**
to confirm the diagnosis, and never:

- in a `Dockerfile`
- in any committed `.env` / `.env.local`
- in CI, Easypanel, or any production environment

---

## Environment variables

Copy each `.env.example` and fill in the blanks. Full reference: `docs/14-env-examples.md`.

### Frontend (`frontend/.env.example`)
```env
NEXT_PUBLIC_SITE_URL=https://keychain.qa
NEXT_PUBLIC_API_URL=https://api.keychain.qa
NEXT_PUBLIC_BRAND_NAME_AR=ميدالية رقم السيارة
NEXT_PUBLIC_MARKET=QA
NEXT_PUBLIC_CURRENCY=QAR
NEXT_PUBLIC_WHATSAPP_NUMBER=97433423421
NEXT_PUBLIC_ENABLE_SNAPCHAT=true
NEXT_PUBLIC_SNAP_PIXEL_ID=
NEXT_PUBLIC_ENABLE_META=false
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_ENABLE_TIKTOK=false
NEXT_PUBLIC_TIKTOK_PIXEL_ID=
```

### Backend (`backend/.env.example`)
```env
ENVIRONMENT=production
FRONTEND_URL=https://keychain.qa
BACKEND_URL=https://api.keychain.qa
DATABASE_URL=postgres://keychain:keychain@keychain_database:5432/keychain?sslmode=disable
SECRET_KEY=change_me
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_me_strong_password
WHATSAPP_NUMBER=97433423421
GOOGLE_SHEETS_ENABLED=true
GOOGLE_SHEET_ID=
GOOGLE_SHEET_TAB_NAME=order_items
GOOGLE_SERVICE_ACCOUNT_JSON=
ENABLE_SNAPCHAT_CAPI=true
SNAP_PIXEL_ID=
SNAP_ACCESS_TOKEN=
ENABLE_META_CAPI=false
META_PIXEL_ID=
META_CAPI_ACCESS_TOKEN=
ENABLE_TIKTOK_EVENTS=false
TIKTOK_PIXEL_ID=
TIKTOK_ACCESS_TOKEN=
RATE_LIMIT_PER_MINUTE=20
CORS_ORIGINS=https://keychain.qa
LOG_LEVEL=INFO
```

> **Never commit** real `GOOGLE_SERVICE_ACCOUNT_JSON`, tokens, or `.env` files. `.gitignore` already excludes them.

### Values you must provide before launch
- Real product images + plate-style images (placeholders ship by default)
- `GOOGLE_SHEET_ID` and the service-account JSON
- `SNAP_PIXEL_ID` + `SNAP_ACCESS_TOKEN`
- A strong `ADMIN_PASSWORD` and `SECRET_KEY`
- Optional: Meta / TikTok credentials

---

## Google Sheets setup

1. Create a Google Cloud project; enable the **Google Sheets API**.
2. Create a **service account**; download its JSON key.
3. Create a Google Sheet; add a tab named **`order_items`**.
4. Share the Sheet with the service-account email (Editor access).
5. Put the Sheet ID in `GOOGLE_SHEET_ID` and the JSON (escaped/base64 as your deploy supports) in `GOOGLE_SERVICE_ACCOUNT_JSON`.
6. On first order, the backend auto-creates the header row:
   `order_number, item_number, customer_name, phone, address, plate_style, plate_letter, plate_number, item_price, total_order_value, payment_method, status, created_at`

Each keychain = one row. A 3-keychain order = 3 rows sharing the order number. No tracking/UTM columns are ever written to the Sheet. Details: `docs/09-google-sheets-api-sync.md`.

---

## Testing

- **Frontend:** `npm run build` (must succeed), `npm run lint`, type check.
- **Backend:** app imports/starts, `alembic upgrade head` applies, `GET /api/health` returns ok.
- **Order flow:** submit via funnel → confirm 1 `orders` row + N `order_items` rows in Postgres → confirm N Sheet rows → thank-you page shows order number + total → WhatsApp opens with short message.
- **Tracking:** Snapchat loads only when enabled, Meta/TikTok off, `ScCid` captured, events in Postgres, forced tracking error does not block submit.
- **Admin:** login with env creds, wrong password rejected, KPIs + conversion rates render, status update writes Postgres + Sheet.

Full checklist: `docs/15-qa-launch-checklist.md`.

---

## Deployment (Easypanel)

Three services. Full guide: `docs/13-deployment-easypanel-docker.md`.

1. **Postgres** — db `keychain`, user `keychain`, password `keychain` (change in prod). Internal host `keychain_database`.
2. **Backend** — build from `/backend`, domain `api.keychain.qa`, env from `backend/.env.example`, `DATABASE_URL=postgres://keychain:keychain@keychain_database:5432/keychain?sslmode=disable`. Startup runs `start.sh` → `alembic upgrade head` then `uvicorn`. Health check `GET /api/health`.
3. **Frontend** — build from `/frontend`, domain `keychain.qa`, env from `frontend/.env.example`.

---

## Documentation index

| File | Contents |
|------|----------|
| `docs/00-project-overview.md` | Goals, scope, key facts |
| `docs/01-brand-positioning.md` | Brand, tone, positioning |
| `docs/02-funnel-flow-and-cro.md` | Step funnel + CRO |
| `docs/03-copywriting-rules-arabic.md` | Arabic copy + exact strings |
| `docs/04-design-system.md` | Colors, type, components, RTL |
| `docs/05-frontend-architecture.md` | Next.js structure |
| `docs/06-backend-architecture.md` | FastAPI structure |
| `docs/07-database-schema.md` | Postgres tables |
| `docs/08-api-contracts.md` | Endpoints + JSON |
| `docs/09-google-sheets-api-sync.md` | Sheets integration |
| `docs/10-tracking-pixels-capi.md` | Snapchat/Meta/TikTok |
| `docs/11-visual-assets-and-higgsfield-prompts.md` | Placeholders + image prompts |
| `docs/12-admin-dashboard.md` | Admin KPIs + views |
| `docs/13-deployment-easypanel-docker.md` | Deploy guide |
| `docs/14-env-examples.md` | Env reference |
| `docs/15-qa-launch-checklist.md` | Launch checklist |
