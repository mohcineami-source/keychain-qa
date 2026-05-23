# 06 — Backend Architecture

## Stack

Python **FastAPI** · **PostgreSQL** · **SQLAlchemy 2.0** · **Alembic** · Pydantic settings · Uvicorn/Gunicorn · Docker. CORS for the frontend origin only. Structured logging. Basic rate limiting. Domain `api.keychain.qa`.

## Folder structure

```
backend/
  app/
    main.py                  # FastAPI app, routers, CORS, middleware, startup
    config.py                # Pydantic Settings (reads .env)
    database.py              # SQLAlchemy 2.0 engine/session
    security.py              # admin auth (env creds), token/JWT/signed cookie
    logging_config.py        # structured logging setup
    middleware.py            # rate limiting, request context (ip, user-agent)
    models/
      order.py
      order_item.py
      tracking_event.py
      admin_session.py
    schemas/
      orders.py              # Pydantic request/response
      tracking.py
      admin.py
    routers/
      orders.py              # POST /api/orders
      tracking.py            # POST /api/tracking/event
      admin.py               # login, metrics, orders, order-items, status
      health.py              # GET /api/health
    services/
      pricing.py             # server-authoritative total
      order_number.py        # collision-safe KCQ-000001
      google_sheets.py       # service-account Sheets sync
      snapchat_capi.py       # server-side Snapchat events
      meta_capi.py           # disabled by default
      tiktok_events.py       # disabled by default
      tracking.py            # persist tracking_events, dedupe via event_id
      whatsapp.py            # build wa.me URL + short message
      metrics.py             # KPIs + conversion rates + drop-off
    migrations/
      env.py
      versions/
  alembic.ini
  requirements.txt
  Dockerfile
  .dockerignore
  .env.example
  start.sh                   # alembic upgrade head && uvicorn ...
```

## Configuration (`config.py`)

Pydantic `Settings` reads all backend env vars (see `docs/14-env-examples.md`): `DATABASE_URL`, `SECRET_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `WHATSAPP_NUMBER`, Google Sheets vars, Snapchat/Meta/TikTok flags + tokens, `RATE_LIMIT_PER_MINUTE`, `CORS_ORIGINS`, `LOG_LEVEL`, `ENVIRONMENT`, `FRONTEND_URL`, `BACKEND_URL`.

## Database (`database.py`)

- SQLAlchemy 2.0 engine from `DATABASE_URL`.
- Note: the example uses the `postgres://` scheme; normalize to `postgresql+psycopg://` (or the chosen driver) when constructing the engine.
- Session dependency for routers.

## Startup & migrations

- `start.sh`:
  ```bash
  #!/usr/bin/env bash
  set -e
  alembic upgrade head
  uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
  ```
- Migrations run automatically on container startup (Easypanel + Docker Compose).
- `main.py` startup: init logging, verify DB connectivity for the health endpoint.

## Routers & endpoints

Full contracts in `docs/08-api-contracts.md`. Summary:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | health + DB check |
| POST | `/api/orders` | create order (validate, price, persist, sheet sync, tracking) |
| POST | `/api/tracking/event` | persist tracking event + optional server-side CAPI |
| POST | `/api/admin/login` | env-credential login |
| GET | `/api/admin/metrics` | KPIs + conversion rates |
| GET | `/api/admin/orders` | grouped orders (pagination/filter) |
| GET | `/api/admin/order-items` | per-keychain production rows |
| PATCH | `/api/admin/order-items/{id}/status` | update status + sync sheet |

## Order creation flow (`routers/orders.py`)

1. Validate payload (mirror frontend rules; reject invalid).
2. **Recalculate pricing server-side** via `services/pricing.py` (`160 + (q-1)*100`). Never trust the client total.
3. Generate `order_number` via `services/order_number.py` (collision-safe sequence/transaction → `KCQ-000001`).
4. Persist `orders` row + one `order_items` row per keychain (with tracking/UTM fields on the order).
5. Sync each item to Google Sheets (`services/google_sheets.py`) — **failure logged, does not roll back the order**; record `google_sheet_row_number` + sync status.
6. Fire `Purchase`/`SubmitOrder` events (`snapchat_capi`, persisted in `tracking_events`) — **non-blocking**.
7. Build WhatsApp URL (`services/whatsapp.py`).
8. Return `{ success, order_number, quantity, total, currency, whatsapp_url }`.

## Pricing service (`services/pricing.py`)

Mirrors the frontend exactly: `total = 160 + (quantity - 1) * 100`, `subtotal = total`, `delivery_fee = 0`. Authoritative.

## Order number service (`services/order_number.py`)

Generates `KCQ-` + zero-padded 6-digit counter using a DB sequence or a safe transaction to avoid duplicate numbers under concurrency.

## Security (`security.py`)

- Admin auth uses `ADMIN_USERNAME` / `ADMIN_PASSWORD` from env.
- Issue a backend session: signed cookie or JWT signed with `SECRET_KEY`. No multi-user DB needed.
- Server tokens (Snapchat/Meta/TikTok, service-account JSON) **never** leave the server.

## Middleware (`middleware.py`)

- Basic rate limiting (`RATE_LIMIT_PER_MINUTE`) especially on `POST /api/orders`.
- Capture `ip_address` (server-side) and `user_agent` for orders/tracking.
- CORS restricted to `CORS_ORIGINS` (the frontend origin).

## Logging (`logging_config.py`)

Structured logging at `LOG_LEVEL`. Log Sheets sync failures and CAPI failures with enough context to retry/surface in admin. Never log secrets.

## Resilience guarantees

- **Postgres is the system of record.** It must be written safely even if Sheets or tracking fail.
- Sheets failures → logged, sync status flagged, visible in admin; order still succeeds.
- Tracking failures → swallowed; never affect the order response.

## Docker

Python slim base, install `requirements.txt`, copy app, run `start.sh`, expose 8000, with `.dockerignore`. See `docs/13-deployment-easypanel-docker.md`.
