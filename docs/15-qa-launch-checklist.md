# 15 — QA & Launch Checklist

Walk this end-to-end before launch. Every box must be checked. This expands spec §26 and ties back to the acceptance criteria in spec §27 / `AGENTS.md`.

## Funnel

- [ ] Offer page loads
- [ ] Slider works (4 placeholder images, RTL direction)
- [ ] CTA `اختار لوحتك` moves to the style step
- [ ] Progress stepper works (`1 العرض → 2 اختيار اللوحة → 3 الإضافات → 4 بيانات الطلب`)
- [ ] Live summary shows quantity (عدد الميداليات) and total (الإجمالي)
- [ ] Plate style selection works (5 styles, clear selected state)
- [ ] New 2026 letter dropdown (`حرف اللوحة`) appears only for the new style
- [ ] Q default works
- [ ] Plate number (`رقم اللوحة`) required for non-custom styles
- [ ] Custom choice shows the WhatsApp note and requires no plate number
- [ ] Add-another loop works unlimited (`أضف ميدالية ثانية بـ 100 ريال`)
- [ ] Totals calculate correctly:
  - [ ] 1 = 160
  - [ ] 2 = 260
  - [ ] 3 = 360
- [ ] Checkout validation works (name, phone, address, payment required)
- [ ] Payment method has no default (customer must pick كاش / تحويل فورا)
- [ ] Submit button says `ارسل الطلب`
- [ ] Thank-you page shows order number and total
- [ ] WhatsApp opens with the short prefilled message

## Backend

- [ ] Migrations run on startup (`alembic upgrade head` in `start.sh`)
- [ ] Health endpoint works (`GET /api/health` → `{"ok": true, "service": "keychain-api", "database": "ok"}`)
- [ ] Order endpoint validates (rejects invalid payment method, missing plate number for non-custom, empty items)
- [ ] Order saved in Postgres (`orders` row)
- [ ] Order items saved correctly (one `order_items` row per keychain, correct `item_number`, prices 160/100)
- [ ] Server recalculates total (client total never trusted)
- [ ] Order number is collision-safe (`KCQ-000001` format, no duplicates)
- [ ] Google Sheet rows created one per keychain (shared order number, distinct item_number)
- [ ] Sheet headers auto-created/repaired on the `order_items` tab
- [ ] Status updates sync to the Sheet
- [ ] Failure states logged (Sheet sync failure does not roll back the order)

## Admin

- [ ] Login works with env credentials
- [ ] Wrong password rejected
- [ ] KPIs load (orders, revenue, today, keychains sold, AOV)
- [ ] Conversion rates display (sessions→orders, offer views→orders, style selections→orders, checkout starts→orders, checkout starts→completed)
- [ ] Drop-off by funnel step displays
- [ ] Orders grouped view works (customer, phone, total, quantity, payment, status, date)
- [ ] Production item view works (one row per keychain, matches Sheet structure)
- [ ] Status update works (per item)
- [ ] Status update writes Postgres AND Sheet row
- [ ] Sheet sync status shown (synced / pending / error)
- [ ] Filter by status, filter by plate style, search by order number/phone

## Tracking

- [ ] Snapchat Pixel loads when enabled
- [ ] Meta/TikTok disabled by default (their pixels do not load)
- [ ] ScCid captured from URL; `_scid` cookie captured when possible
- [ ] UTM/session/user_agent/ip captured and stored in Postgres
- [ ] Events stored in backend (`tracking_events`)
- [ ] `event_id` shared browser↔server for dedupe
- [ ] Purchase event sent after order (server-side)
- [ ] Tracking errors do NOT block order submission
- [ ] Server tokens never exposed client-side
- [ ] No tracking/UTM data written to Google Sheets

## Deployment

- [ ] Frontend Docker builds
- [ ] Backend Docker builds
- [ ] Env examples complete (root, frontend, backend)
- [ ] Easypanel docs complete (`docs/13`)
- [ ] CORS works (frontend origin only)
- [ ] No secrets committed (`.env`, service-account JSON, tokens excluded by `.gitignore`)
- [ ] `DATABASE_URL` uses internal `keychain_database` host
- [ ] Health check passes at `https://api.keychain.qa/api/health`

## Content & brand

- [ ] All customer-facing copy is Arabic only, RTL
- [ ] Exact required strings used (hero `خل رقم موترك دوم معاك`, CTA `اختار لوحتك`, submit `ارسل الطلب`)
- [ ] No banned phrases (الأفضل في العالم / عرض لا يتكرر / آخر فرصة / باقي 3 فقط / رسمي ومعتمد)
- [ ] No fake reviews/scarcity/certifications/guarantees/official approval
- [ ] Admin UI and Sheet columns/statuses are English
- [ ] Standard pages present (About, Contact, Privacy, Terms, Delivery) — Arabic, simple
- [ ] Contact is WhatsApp only (+97433423421), no email
- [ ] Delivery page: Qatar only, delivery included, 24–48h
- [ ] Floating WhatsApp button present (`تحتاج مساعدة؟`)
- [ ] Placeholders render and look intentional (slider + 5 plate styles)

## Final acceptance (spec §27)

- [ ] `CLAUDE.md`, `AGENTS.md`, `/docs` (00–15), `README.md` exist and are specific
- [ ] Frontend builds; backend starts
- [ ] Dockerfiles valid; env examples complete
- [ ] Order flow works end-to-end; Postgres stores orders + items
- [ ] Sheet sync: one row per keychain, headers auto-verified
- [ ] Admin works with login, KPIs, conversion rates, status update + sync
- [ ] Snapchat enabled; Meta/TikTok prepared but disabled
- [ ] Tracking saved in Postgres, not Sheets
- [ ] Customer UI Arabic RTL; Qatari heritage + Apple simplicity
- [ ] WhatsApp redirect works with short message
- [ ] README explains setup, deployment, testing, env vars
