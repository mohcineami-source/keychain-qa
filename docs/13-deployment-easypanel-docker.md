# 13 — Deployment: Easypanel & Docker

The project is GitHub-ready and Easypanel-deployable. Deployment is **three services**: Postgres, backend, frontend.

## Topology

```
keychain.qa        → frontend service  (Next.js, port 3000)
api.keychain.qa    → backend service   (FastAPI, port 8000)
keychain_database  → postgres service  (internal, port 5432)
```

The backend connects to Postgres over the internal network using the service name `keychain_database`.

## 1. Postgres service

- Database name: **`keychain`**
- User: **`keychain`**
- Password: **`keychain`** (change in production)
- Internal host: **`keychain_database`**
- Internal URL the backend uses:
  ```
  postgres://keychain:keychain@keychain_database:5432/keychain?sslmode=disable
  ```

## 2. Backend service

- Build from **`/backend`** (its `Dockerfile`).
- Domain: **`api.keychain.qa`**.
- Port: 8000.
- Env vars from `backend/.env.example` (see `docs/14-env-examples.md`). Critically:
  ```env
  DATABASE_URL=postgres://keychain:keychain@keychain_database:5432/keychain?sslmode=disable
  CORS_ORIGINS=https://keychain.qa
  ADMIN_USERNAME=admin
  ADMIN_PASSWORD=<strong>
  SECRET_KEY=<random>
  GOOGLE_SHEETS_ENABLED=true
  GOOGLE_SHEET_ID=<id>
  GOOGLE_SHEET_TAB_NAME=order_items
  GOOGLE_SERVICE_ACCOUNT_JSON=<json>
  ENABLE_SNAPCHAT_CAPI=true
  SNAP_PIXEL_ID=<id>
  SNAP_ACCESS_TOKEN=<token>
  ```
- **Startup runs migrations automatically** via `start.sh`:
  ```bash
  #!/usr/bin/env bash
  set -e
  alembic upgrade head
  uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
  ```
- Health check: `GET https://api.keychain.qa/api/health` → `{"ok": true, "service": "keychain-api", "database": "ok"}`.

### Backend Dockerfile (shape)
- Python slim base.
- Install `requirements.txt`.
- Copy `app/`, `alembic.ini`, `migrations/`, `start.sh`.
- `chmod +x start.sh`; entrypoint/CMD = `./start.sh`.
- Expose 8000. Include `.dockerignore`.

## 3. Frontend service

- Build from **`/frontend`** (its `Dockerfile`).
- Domain: **`keychain.qa`**.
- Port: 3000.
- Env vars from `frontend/.env.example`:
  ```env
  NEXT_PUBLIC_SITE_URL=https://keychain.qa
  NEXT_PUBLIC_API_URL=https://api.keychain.qa
  NEXT_PUBLIC_WHATSAPP_NUMBER=97433423421
  NEXT_PUBLIC_ENABLE_SNAPCHAT=true
  NEXT_PUBLIC_SNAP_PIXEL_ID=<id>
  NEXT_PUBLIC_ENABLE_META=false
  NEXT_PUBLIC_ENABLE_TIKTOK=false
  ```

### Frontend Dockerfile (shape)
- Node base; production build.
- Next.js **standalone** output for a slim runtime image.
- Expose 3000. Include `.dockerignore`.

## Easypanel step-by-step

1. **Create the Postgres service** with db/user/password = `keychain` (note the internal host `keychain_database`).
2. **Create the backend app** from the GitHub repo, build context `/backend`. Add all backend env vars (set `DATABASE_URL` to the internal Postgres URL). Attach domain `api.keychain.qa`. Deploy — migrations run on startup.
3. **Verify health:** open `https://api.keychain.qa/api/health`.
4. **Create the frontend app** from the same repo, build context `/frontend`. Add `NEXT_PUBLIC_*` env vars (point `NEXT_PUBLIC_API_URL` at `https://api.keychain.qa`). Attach domain `keychain.qa`. Deploy.
5. **Confirm CORS:** `CORS_ORIGINS=https://keychain.qa` on the backend so the frontend can call the API.
6. **Smoke test** the full order flow (see `docs/15-qa-launch-checklist.md`).

## Secrets

- Never commit `.env`, service-account JSON, or tokens. `.gitignore` excludes them.
- Provide secrets through Easypanel's env var UI, not in the repo.
- `GOOGLE_SERVICE_ACCOUNT_JSON` is passed as an env value (JSON string or base64, per the backend's parser).

## Local parity

`docker-compose.example.yml` mirrors this topology (same service name `keychain_database`, same `DATABASE_URL`, backend runs `alembic upgrade head` then `uvicorn`) so local testing matches production.

## Rollback / redeploy

- Redeploy a service from Easypanel after pushing to GitHub.
- Migrations are forward-only via Alembic; create a new migration to change schema. Backend startup always runs `alembic upgrade head`.
