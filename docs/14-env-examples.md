# 14 — Environment Variables Reference

There are three env files: the root `.env.example` (aggregated reference), `frontend/.env.example`, and `backend/.env.example`. Copy each to its working file and fill the blanks. **Never commit filled env files or secrets.** `.gitignore` excludes `.env*` and service-account JSON.

---

## frontend/.env.example

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

### Frontend var reference

| Var | Required | Notes |
|-----|----------|-------|
| `NEXT_PUBLIC_SITE_URL` | yes | public site URL |
| `NEXT_PUBLIC_API_URL` | yes | backend base URL |
| `NEXT_PUBLIC_BRAND_NAME_AR` | yes | header brand text |
| `NEXT_PUBLIC_MARKET` | yes | `QA` |
| `NEXT_PUBLIC_CURRENCY` | yes | `QAR` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | yes | `97433423421` (no `+`, for wa.me) |
| `NEXT_PUBLIC_ENABLE_SNAPCHAT` | yes | `true` at launch |
| `NEXT_PUBLIC_SNAP_PIXEL_ID` | for Snapchat | pixel id (browser) |
| `NEXT_PUBLIC_ENABLE_META` | yes | `false` by default |
| `NEXT_PUBLIC_META_PIXEL_ID` | optional | only if Meta enabled |
| `NEXT_PUBLIC_ENABLE_TIKTOK` | yes | `false` by default |
| `NEXT_PUBLIC_TIKTOK_PIXEL_ID` | optional | only if TikTok enabled |

> Any `NEXT_PUBLIC_*` value is exposed to the browser. **Never** put secret tokens here — only the pixel **IDs** (public). Access tokens live on the backend.

---

## backend/.env.example

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

### Backend var reference

| Var | Required | Notes |
|-----|----------|-------|
| `ENVIRONMENT` | yes | `production` / `development` |
| `FRONTEND_URL` | yes | used for links/CORS context |
| `BACKEND_URL` | yes | self URL |
| `DATABASE_URL` | yes | internal Postgres URL (normalize scheme to a SQLAlchemy driver) |
| `SECRET_KEY` | yes | signs admin session/JWT — keep secret |
| `ADMIN_USERNAME` | yes | admin login |
| `ADMIN_PASSWORD` | yes | admin login — set strong |
| `WHATSAPP_NUMBER` | yes | `97433423421` |
| `GOOGLE_SHEETS_ENABLED` | yes | master switch |
| `GOOGLE_SHEET_ID` | for Sheets | spreadsheet id |
| `GOOGLE_SHEET_TAB_NAME` | yes | `order_items` |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | for Sheets | **secret** — never commit |
| `ENABLE_SNAPCHAT_CAPI` | yes | `true` at launch |
| `SNAP_PIXEL_ID` | for Snapchat | |
| `SNAP_ACCESS_TOKEN` | for Snapchat | **secret** |
| `ENABLE_META_CAPI` | yes | `false` default |
| `META_PIXEL_ID` | optional | |
| `META_CAPI_ACCESS_TOKEN` | optional | **secret** |
| `ENABLE_TIKTOK_EVENTS` | yes | `false` default |
| `TIKTOK_PIXEL_ID` | optional | |
| `TIKTOK_ACCESS_TOKEN` | optional | **secret** |
| `RATE_LIMIT_PER_MINUTE` | yes | order endpoint rate limit, e.g. `20` |
| `CORS_ORIGINS` | yes | `https://keychain.qa` |
| `LOG_LEVEL` | yes | `INFO` |

---

## Root .env.example

The root `.env.example` aggregates both blocks above as a single reference (handy for `docker-compose`). Per-service files remain the canonical source for each app.

---

## Secrets policy

- Secrets: `SECRET_KEY`, `ADMIN_PASSWORD`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `SNAP_ACCESS_TOKEN`, `META_CAPI_ACCESS_TOKEN`, `TIKTOK_ACCESS_TOKEN`.
- These must never be committed and never exposed client-side (no `NEXT_PUBLIC_` prefix).
- Provide them via Easypanel env UI in production.
- `.gitignore` must exclude `.env`, `.env.*` (except `*.example`), and any service-account `*.json`.

## Values to fill before launch

- `NEXT_PUBLIC_SNAP_PIXEL_ID` + `SNAP_PIXEL_ID` + `SNAP_ACCESS_TOKEN`
- `GOOGLE_SHEET_ID` + `GOOGLE_SERVICE_ACCOUNT_JSON`
- `ADMIN_PASSWORD` + `SECRET_KEY`
- (optional) Meta / TikTok ids + tokens if enabling later
