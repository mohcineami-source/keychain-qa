# CLAUDE.md — keychain.qa

This file is the operating manual for any AI agent (Claude Code, Antigravity, etc.) or human working on **keychain.qa**. Read it fully before touching code. The authoritative source of truth is `keychain_qa_claude_master_prompt_autonomous.md` in the repo root; this file distills the rules you must follow on every change.

---

## 1. Project purpose

keychain.qa is a **single-product, conversion-first funnel** that sells one thing: a **custom acrylic Qatar car-plate keychain** ("ميدالية رقم السيارة").

- It is **not** a generic e-commerce store. It is a focused, premium, Arabic-only step funnel.
- The customer experience must feel like Apple-grade simplicity with Qatari heritage styling.
- The funnel collects an order, stores it in Postgres, mirrors each keychain as a row in Google Sheets, fires tracking events safely, and hands the customer off to WhatsApp.

Key facts (memorize these — they appear everywhere):

| Fact | Value |
|------|-------|
| Brand name (AR) | ميدالية رقم السيارة |
| Customer domain | keychain.qa |
| API domain | api.keychain.qa |
| Market | Qatar only |
| Currency | QAR / ريال قطري |
| Customer language | Arabic only (RTL) |
| Admin + Sheets language | English |
| Hero headline | خل رقم موترك دوم معاك |
| Primary CTA | اختار لوحتك |
| Price | 160 QAR first keychain, +100 QAR each extra, delivery included |
| Production + delivery | 24–48 hours inside Qatar |
| WhatsApp | +97433423421 (wa.me redirect, no Business API) |
| Order number format | KCQ-000001 |
| Payment methods | `cash`, `fawran_transfer` |
| Default tracking | Snapchat enabled; Meta + TikTok disabled |

---

## 2. Docs-first workflow (NON-NEGOTIABLE)

1. **Documentation comes before code.** The `/docs` folder, `CLAUDE.md`, `AGENTS.md`, and `README.md` must exist and be project-specific before any feature is implemented.
2. Do not "randomly code pages first." Follow the build sequence in `AGENTS.md` (docs → backend foundation → orders/Sheets → tracking → frontend funnel → admin → standard pages → QA).
3. When a requirement is unclear, the spec wins. Do not invent features that contradict the spec.
4. Every phase has acceptance criteria (see `docs/15-qa-launch-checklist.md` and spec §27). **Never skip acceptance criteria.**

---

## 3. Coding rules

- **Frontend stack:** Next.js (latest stable, App Router) + TypeScript + Tailwind CSS + shadcn/ui + React Hook Form + Zod + Zustand. Use `next/image` for images and `next/script` for pixels. Framer Motion only if minimal and useful.
- **Backend stack:** FastAPI + Postgres + SQLAlchemy 2.0 + Alembic + Pydantic settings + Uvicorn/Gunicorn.
- Keep copy and config centralized: plate styles in `frontend/data/plateStyles.ts`, Arabic copy in `frontend/data/copy.ts`, pricing in `frontend/lib/pricing.ts`.
- **Pricing is server-authoritative.** The frontend computes a display total, but the backend recalculates and never trusts the client total. The shared rule is `total = 160 + (quantity - 1) * 100`.
- **Order numbers must be collision-safe** (DB sequence or safe transaction). Format `KCQ-000001`.
- CORS on the backend allows the frontend origin only.
- Backend includes structured logging, basic rate limiting on the order endpoint, and a health endpoint at `GET /api/health`.
- **Migrations run automatically on backend startup** via `start.sh` (`alembic upgrade head` then `uvicorn`).
- Validation is duplicated front and back: name, phone (general, not Qatar-locked), address, payment method, at least one item, plate number required for non-custom styles, `new_2026` letter ∈ {Q, T, R} default Q, `custom_choice` has no plate number.

---

## 4. Design rules

- Light premium Apple-style base with Qatari maroon accents, soft gray backgrounds, white cards, subtle borders, rounded corners, generous spacing, minimal motion, mobile-first.
- Colors: maroon `#8A1538`, deep maroon `#5C0E26`, white `#FFFFFF`, soft bg `#F7F5F3`, warm gray `#E8E2DD`, charcoal text `#171717`, muted text `#6B625F`, success `#16A34A`.
- Typography: one clean Arabic-first font (IBM Plex Sans Arabic / Noto Kufi Arabic / Tajawal). Pick one and apply everywhere.
- `dir="rtl"` globally. All inputs, buttons, cards must feel natural in RTL.
- No heavy logo. Header shows brand text "ميدالية رقم السيارة".
- Floating WhatsApp button present site-wide, label "تحتاج مساعدة؟".
- Animations limited to soft fade, subtle slide, gentle button states. No flashy effects.

See `docs/04-design-system.md` for the full system.

---

## 5. Arabic copy rules

- **Customer-facing copy is Arabic only**, clean Gulf Arabic with Qatari flavor — premium, direct, simple, human. Not cheesy, not overhyped, not fake luxury.
- Admin UI and Google Sheet columns/statuses are **English**.
- Use the exact required strings: hero `خل رقم موترك دوم معاك`, CTA `اختار لوحتك`, checkout submit `ارسل الطلب`, etc. (full list in `docs/03-copywriting-rules-arabic.md`).
- **Do not use** fake-urgency / fake-authority phrases: `الأفضل في العالم`، `عرض لا يتكرر`، `آخر فرصة`، `باقي 3 فقط`، `رسمي ومعتمد`.

---

## 6. Tracking rules

- Snapchat is enabled from day one (Pixel + Conversions API). Meta and TikTok are fully scaffolded but **disabled by default** via env flags.
- Generate `event_id` on the frontend, send the same `event_id` to the backend so browser + server events deduplicate. Store `event_id` in Postgres.
- Capture and store in Postgres (never in Google Sheets): UTM params, `landing_page_url`, `referrer`, `session_id`, `user_agent`, `ip_address` (server-side), `ScCid`, `_scid` cookie.
- **Server tokens are never exposed client-side.**
- **Tracking failure must NEVER block checkout.** Wrap all tracking calls so an error is logged and swallowed.

See `docs/10-tracking-pixels-capi.md`.

---

## 7. Google Sheets rules

- Use the Google Sheets API with a **service account** (not Apps Script). The sheet is already shared with the service account email.
- Single tab: `order_items`. English columns only: `order_number, item_number, customer_name, phone, address, plate_style, plate_letter, plate_number, item_price, total_order_value, payment_method, status, created_at`.
- One row per keychain. A 3-keychain order creates 3 rows sharing the order number with different `item_number`.
- Backend auto-checks/creates the header row if missing. Store the sheet row number in `order_items.google_sheet_row_number`.
- Status updates from admin update both Postgres and the matching sheet row.
- **No tracking/UTM data goes to Sheets.**
- **Sheet sync failure must not break order creation in Postgres.** Log it and surface the sync status in admin.

---

## 8. No-fake-proof rule

Never add fake testimonials, fake reviews, fake certifications, fake scarcity, fake guarantees, or fake official/government approval. Unless real proof exists, do not claim official plate licensing, government affiliation, guaranteed delivery you cannot control, or real customer reviews.

---

## 9. How to run locally

### Frontend

```bash
cd frontend
cp .env.example .env.local   # then fill values
npm install
npm run dev                  # http://localhost:3000
```

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env         # then fill values
alembic upgrade head
uvicorn app.main:app --reload --port 8000   # http://localhost:8000
```

### Full stack with Docker Compose (recommended for local end-to-end)

```bash
cp .env.example .env
docker compose -f docker-compose.example.yml up --build
```

This starts Postgres (db/user/password all `keychain`), the backend (runs `alembic upgrade head` then `uvicorn`), and the frontend. Verify `http://localhost:8000/api/health` returns `{"ok": true, ...}`.

---

## 10. Testing instructions

- **Frontend:** `npm run build` must succeed; `npm run lint` and type checks clean.
- **Backend:** app must import and start; `alembic upgrade head` must apply cleanly; `GET /api/health` returns ok.
- **End-to-end order flow:** submit an order through the funnel, confirm an `orders` row + N `order_items` rows in Postgres, confirm N rows appear in the Google Sheet, confirm the thank-you page shows the order number and total, confirm WhatsApp opens with the short prefilled message.
- **Tracking:** confirm Snapchat Pixel loads only when enabled, Meta/TikTok stay off, `ScCid` is captured, events land in Postgres, and a forced tracking error does not block order submission.
- **Admin:** login with env credentials, wrong password rejected, KPIs and conversion rates render, status update writes to Postgres + Sheet.

The full checklist lives in `docs/15-qa-launch-checklist.md`.

---

## 11. How to deploy on Easypanel

Three services on Easypanel:

1. **Postgres** — database `keychain`, user `keychain`, password `keychain` (change in production). Internal host `keychain_database`.
2. **Backend** — build from `/backend` (its Dockerfile), domain `api.keychain.qa`, env from `backend/.env.example`. `DATABASE_URL=postgres://keychain:keychain@keychain_database:5432/keychain?sslmode=disable`. Startup runs `start.sh` (migrations then uvicorn). Health check: `GET https://api.keychain.qa/api/health`.
3. **Frontend** — build from `/frontend` (its Dockerfile), domain `keychain.qa`, env from `frontend/.env.example`.

Full step-by-step in `docs/13-deployment-easypanel-docker.md`.

---

## 12. Autonomy & safety

Work autonomously inside this project folder: create/edit files, install normal deps, run builds/tests/migrations without asking each time. Only stop to ask before destructive or security-sensitive actions (deleting large folders, editing files outside the project, printing/committing secrets, manual production DB changes). **Never commit `.env`, service account JSON, API tokens, or credentials.**
