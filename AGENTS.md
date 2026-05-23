# AGENTS.md — Agent Workflow for keychain.qa

This file defines how an autonomous agent (Antigravity IDE / Claude Code) must build and maintain **keychain.qa**. It complements `CLAUDE.md` (rules) by defining the **order of operations** and the **acceptance gates** between phases. Do not reorder phases. Do not skip acceptance criteria.

The single source of truth is `keychain_qa_claude_master_prompt_autonomous.md`. When in doubt, that spec wins.

---

## Operating principles

1. **Docs before code.** Never start coding pages before the documentation deliverables exist and are project-specific.
2. **One phase at a time.** Finish a phase and meet its acceptance gate before moving on.
3. **Functional, not just visual.** The funnel must work end-to-end (DB + Sheets + tracking), not only render UI.
4. **Resilience by design.** Tracking failures and Google Sheets failures must never break order creation in Postgres.
5. **No fakes.** No fake reviews, scarcity, certifications, guarantees, or government approval.
6. **Autonomy with guardrails.** Create/edit files, install deps, run builds/migrations freely. Stop only for destructive/security-sensitive actions. Never commit secrets.

---

## Build sequence

### Phase 0 — Read & orient
- Read `keychain_qa_claude_master_prompt_autonomous.md`, `CLAUDE.md`, and this file fully.
- **Gate:** You can restate the offer, pricing, plate styles, statuses, and tracking defaults from memory.

### Phase 1 — Documentation (THIS DELIVERABLE)
Create, with real project-specific content:
- `CLAUDE.md`, `AGENTS.md`, `README.md`
- `docker-compose.example.yml`, `.env.example`
- All `/docs` files: `00`–`15`.
- **Gate:** Every doc is specific to keychain.qa (correct brand, domains, pricing, plate styles, statuses, Sheets columns, endpoints). No generic boilerplate. Do not code before this gate passes.

### Phase 2 — Backend foundation
Scaffold the FastAPI backend: `main.py`, `config.py` (Pydantic settings), `database.py`, `security.py`, `logging_config.py`, `middleware.py`, models (`order`, `order_item`, `tracking_event`, `admin_session`), schemas, Alembic migrations, health route, Dockerfile, `.env.example`, `start.sh` (migrations + uvicorn).
- **Gate:** Backend imports and starts; `alembic upgrade head` applies cleanly; `GET /api/health` returns `{"ok": true, "service": "keychain-api", "database": "ok"}`.

### Phase 3 — Orders & Google Sheets
Implement: order number service (collision-safe `KCQ-000001`), pricing service (`160 + (q-1)*100`, server-authoritative), `POST /api/orders`, Google Sheets service (service account), auto header creation on the `order_items` tab, one row per keychain, status sync.
- **Gate:** An order persists in Postgres (orders + order_items), creates N sheet rows (one per keychain, shared order number, distinct `item_number`), headers auto-created, status updates sync to the sheet; sheet failure logs but does not roll back the order.

### Phase 4 — Tracking
Implement: `POST /api/tracking/event`, Snapchat Pixel (frontend) + Snapchat CAPI (backend), Meta/TikTok disabled skeletons, UTM/session/`ScCid`/`_scid` capture, browser↔server `event_id` dedupe.
- **Gate:** Snapchat loads only when enabled; Meta/TikTok stay off by default; events stored in Postgres; tracking errors never block checkout; server tokens never reach the client.

### Phase 5 — Frontend funnel
Implement the single-page step funnel: RTL layout, Offer step, Plate selection step (5 styles, `new_2026` letter dropdown Q/T/R default Q, plate number for non-custom, WhatsApp note for custom), Add-another loop (unlimited), Checkout step (name/phone/address/payment with no default), Thank-you page, WhatsApp redirect with short message, placeholder images/cards, progress stepper, live order summary.
- **Gate:** Totals correct (1=160, 2=260, 3=360); custom_choice shows no plate number field; payment has no default; submit says `ارسل الطلب`; thank-you shows order number + total; WhatsApp opens with the short prefilled message.

### Phase 6 — Admin dashboard
Implement: admin login (env credentials), `GET /api/admin/metrics`, `GET /api/admin/orders`, `GET /api/admin/order-items`, `PATCH /api/admin/order-items/{id}/status`, orders grouped view, production per-item view, status update with sheet sync, conversion-rate KPIs and funnel drop-off.
- **Gate:** Login works and wrong password is rejected; KPIs + conversion rates render; orders grouped + production views work; status update writes Postgres + Sheet and shows sync status.

### Phase 7 — Standard pages & polish
Implement Arabic pages: About, Contact (WhatsApp only, no email), Privacy, Terms, Delivery (Qatar only, delivery included, 24–48h). Footer, floating WhatsApp button, mobile polish, loading/error states. No cancellation/refund note.
- **Gate:** All pages render in RTL Arabic, footer + floating button present, mobile layout clean.

### Phase 8 — QA
Run frontend type check/build, backend import/start checks, migration checks, API shape checks. Walk the full `docs/15-qa-launch-checklist.md`. Update README with final instructions.
- **Gate:** Every acceptance criterion in spec §27 is satisfied; no secrets committed.

---

## Definition of done

Mirror spec §27. The project is complete only when docs exist and are specific, both apps build/start, Dockerfiles are valid, env examples complete, migrations auto-run, the order flow works end-to-end, Postgres + Sheets behave as specified, admin works with login + KPIs + status sync, Snapchat is live and Meta/TikTok prepared-but-off, tracking lives only in Postgres, the customer UI is Arabic RTL with Qatari/Apple feel, placeholders work, WhatsApp redirect works, there are no fake claims, and the README covers setup/deploy/test/env.

If any gate fails, fix it before proceeding — never paper over a failing gate to move forward.
