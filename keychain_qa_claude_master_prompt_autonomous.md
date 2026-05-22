# Claude Code Master Prompt — keychain.qa Qatar Car Plate Keychain Funnel

You are Claude Code running inside Antigravity IDE. You are acting as a senior full-stack engineer, DTC funnel strategist, CRO specialist, Qatari/Gulf Arabic copywriter, backend architect, tracking/pixels engineer, and deployment lead.

Your job is to generate the complete production-ready project for **keychain.qa**, a single-product custom Qatar car plate keychain funnel.

Do not build a generic e-commerce store. Build a focused, premium, conversion-first, Arabic-only funnel that feels simple like Apple and locally elegant with Qatari heritage.

---

## 0. Absolute rules

1. Do not ask the user for more information before starting unless something is truly impossible.
2. Do not randomly code pages first.
3. First create the project instruction files and documentation.
4. Then implement the full frontend, backend, database, Google Sheets sync, tracking, admin dashboard, Docker, env examples, and launch docs.
5. The project must be GitHub-ready and Easypanel-deployable.
6. All customer-facing copy must be Arabic only, written in clean Gulf Arabic with Qatari flavor.
7. The admin dashboard and Google Sheet columns/statuses must be in English.
8. No fake testimonials, fake reviews, fake certifications, fake scarcity, fake guarantees, or fake official approval.
9. Tracking failure must never block checkout.
10. Google Sheets sync failure must be logged and retried or visible in admin, but order creation in Postgres must still be safe.
11. The site must work even before real product images are provided by using clean premium placeholders.
12. If Higgsfield MCP is available, use it only as an optional asset-generation helper. Do not let MCP failure block the build.
13. If MCP image generation produces weak assets, keep clean designed placeholder cards and save prompts for later manual image generation.
14. The project must be functional end-to-end, not only UI.

---

## 1. Project summary

### Brand / product

- Brand/product Arabic name: **ميدالية رقم السيارة**
- Domain: **keychain.qa**
- Backend domain: **api.keychain.qa**
- Market: **Qatar only**
- Currency: **QAR / ريال قطري**
- Language: **Arabic only**
- Tone: **clean Gulf Arabic with Qatari flavor**
- Design style: **Qatari heritage + Apple-style simplicity**
- Product: **custom acrylic Qatar car plate keychain**
- Material: acrylic
- Packaging: do not mention packaging for now
- Delivery: included in price
- Production + delivery promise: **24–48 hours inside Qatar**
- WhatsApp support number: **+97433423421**
- Contact method: WhatsApp only, no email

### Main hero headline

Use this exact main hero headline:

```arabic
خل رقم موترك دوم معاك
```

### Main product description

Use copy similar to:

```arabic
ميدالية رقم السيارة بتفصيل أكريليك خاص، السعر 160 ريال شامل التوصيل، والتجهيز والتوصيل خلال 24–48 ساعة داخل قطر.
```

### Main first-page CTA

Use this exact CTA:

```arabic
اختار لوحتك
```

---

## 2. Offer and pricing

Pricing logic is fixed:

- First keychain: **160 QAR**
- Each extra keychain: **+100 QAR**
- Delivery included
- Unlimited extra keychains allowed
- Example totals:
  - 1 keychain = 160 QAR
  - 2 keychains = 260 QAR
  - 3 keychains = 360 QAR
  - 4 keychains = 460 QAR

Make this clear on the funnel:

```arabic
السعر النهائي: 160 ريال قطري شامل التوصيل
```

For additional item offer:

```arabic
أضف ميدالية ثانية بـ 100 ريال
```

No extra delivery fee.

---

## 3. Funnel structure

The main customer funnel must be a **single-page step funnel**, not separate pages.

Steps:

1. **العرض**
2. **اختيار اللوحة**
3. **الإضافات**
4. **بيانات الطلب**
5. Thank you state/page after submission

Progress indicator must be visible and minimal:

```arabic
1 العرض → 2 اختيار اللوحة → 3 الإضافات → 4 بيانات الطلب
```

Use both numbers and Arabic labels.

Use very minimal Apple-like animations only:
- soft fade
- subtle slide
- gentle button state changes
- no flashy effects

Live summary should appear during funnel steps and show only:
- عدد الميداليات
- الإجمالي

Do not show unnecessary clutter.

---

## 4. Funnel step details

### Step 1 — Offer page

Goal: quickly explain the offer, product, price, process, and speed.

Must include:
- product slider with **4 placeholder images**
- hero headline: `خل رقم موترك دوم معاك`
- product description mentioning acrylic
- price: `160 ريال قطري شامل التوصيل`
- production + delivery: `التجهيز والتوصيل خلال 24–48 ساعة داخل قطر`
- simple process with text + icons:
  1. select plate style
  2. place order
  3. we make it
  4. we deliver it to you

Customer-facing Arabic process copy should be natural:

```arabic
1. اختار ستايل اللوحة
2. ارسل الطلب
3. نجهزها لك
4. نوصلها لين عندك
```

CTA:

```arabic
اختار لوحتك
```

Clicking CTA moves to Step 2.

### Step 2 — Plate style selection

Title:

```arabic
حدد ستايل اللوحة
```

The user selects one of these styles:

1. `new_2026`
   - Arabic title: `اللوحة الجديدة 2026`
   - Extra field: elegant dropdown for letter Q / T / R
   - Default letter: Q
2. `private`
   - Arabic title: `اللوحة الخاصة`
3. `classic`
   - Arabic title: `اللوحة الكلاسيكية`
4. `motorcycle`
   - Arabic title: `لوحة الدراجة النارية`
5. `custom_choice`
   - Arabic title: `اختيار مخصص`

Each style should be displayed as:
- selectable card/button
- placeholder image/card
- title under the placeholder
- selected state with clear border/check mark

Do not use fake real plate images. Use elegant placeholders only.

For the **new 2026** style only:
- show a dropdown:
  - Q
  - T
  - R
- default: Q
- label should be Arabic, for example:

```arabic
حرف اللوحة
```

For non-custom choices:
- ask for plate number on the selection step
- plate number input should be general and required
- do not apply strict digit length rules
- label:

```arabic
رقم اللوحة
```

For custom choice:
- do not ask for plate number
- show only this note:

```arabic
في حالة اختيار هذا الخيار، بنتواصل معك على واتساب عشان ناخذ تفاصيل طلبك بالضبط.
```

If the customer chooses custom choice, checkout must not show a plate number field for that item.

No live preview for launch.

Next button moves to Step 3 after validation.

### Step 3 — Add another or checkout

This step shows a clean summary of current selected items and asks what the customer wants to do next.

Two buttons:

1. Continue to checkout:
```arabic
اكمل الطلب
```
Outcome: moves customer to checkout step.

2. Add another:
```arabic
أضف ميدالية ثانية بـ 100 ريال
```
Outcome: sends customer back to Step 2 to select another keychain.

This repeat loop must support unlimited keychains.

No remove/edit system is required for launch.

### Step 4 — Checkout

Fields:

1. Name
   - Arabic label: `الاسم`
2. Phone number
   - Arabic label: `رقم الجوال`
   - General required phone field
   - Do not restrict only to Qatar number format
3. Address
   - Arabic label: `العنوان`
   - one simple required text field only
   - drivers will call/WhatsApp for delivery, so do not split address into area/street/building
4. Payment method
   - no default selected
   - customer must choose one:
     - `كاش`
     - `تحويل فورا`

Plate number fields:
- In checkout, show each selected item clearly.
- For non-custom items, show the entered plate number.
- If possible, allow minor correction before submitting, but do not build a heavy edit/remove system.
- For custom choice, do not show plate number field.

Final checkout submit button:

```arabic
ارسل الطلب
```

No extra payment note is needed in checkout.

### Step 5 — Thank you

After checkout submission:
1. Create order first in backend.
2. Save order and order items in Postgres.
3. Sync every keychain item to Google Sheets.
4. Fire tracking events safely.
5. Show standard thank-you page.
6. Open WhatsApp using a simple redirect link with short reliable prefilled message.

Thank-you page should show:
- simple confirmation message
- order number
- total
- no overly long summary

Suggested copy:

```arabic
تم استلام طلبك بنجاح
رقم طلبك: KCQ-000001
الإجمالي: 160 ريال قطري شامل التوصيل
بنتواصل معك قريب عبر واتساب لتأكيد التفاصيل.
```

WhatsApp prefilled message must be short, not long, to avoid URL issues:

```arabic
السلام عليكم، تم تسجيل طلبي في keychain.qa

رقم الطلب: KCQ-000001
الاسم: {customer_name}
الجوال: {phone}
عدد الميداليات: {quantity}
الإجمالي: {total} ريال شامل التوصيل
طريقة الدفع: {payment_method}

تفاصيل الطلب موجودة عندكم في النظام.
```

Use WhatsApp number:

```text
+97433423421
```

Use simple `wa.me` redirect, no WhatsApp Business API.

---

## 5. Plate style image placeholders and asset specs

The site must include premium placeholder cards/images so the layout looks complete before real images are added.

### Product slider placeholders

Create 4 placeholders.

Specs to document and use:
- size: **1600 × 1200 px**
- ratio: 4:3
- format: PNG/JPG
- path suggestion:
  - `frontend/public/placeholders/hero-keychain-01.png`
  - `frontend/public/placeholders/hero-keychain-02.png`
  - `frontend/public/placeholders/hero-keychain-03.png`
  - `frontend/public/placeholders/hero-keychain-04.png`

### Plate style placeholders

For each style:
- size: **1200 × 800 px**
- ratio: 3:2
- format: PNG/JPG
- keep plate/keychain centered with margin
- consistent background across all styles
- paths:
  - `frontend/public/placeholders/plate-new-2026.png`
  - `frontend/public/placeholders/plate-private.png`
  - `frontend/public/placeholders/plate-classic.png`
  - `frontend/public/placeholders/plate-motorcycle.png`
  - `frontend/public/placeholders/plate-custom.png`

### Higgsfield MCP usage

If Higgsfield MCP is available:
- generate optional placeholder visuals using prompts saved in docs
- do not let image generation block the website
- if generated images look wrong, keep designed placeholder cards
- save all image prompts in `/docs/11-visual-assets-and-higgsfield-prompts.md`

Visual direction:
- Qatari maroon, white, soft gray
- premium acrylic keychain look
- clean product photography
- no fake official government marks
- no exact replica if it creates legal/design risk
- avoid adding text that looks wrong or AI-generated
- placeholders may be abstract/minimal product mockups

---

## 6. Design system

Design direction:
- light premium Apple-style base
- Qatari maroon accents
- soft gray backgrounds
- white cards
- subtle borders
- elegant rounded corners
- premium spacing
- simple typography
- minimal motion
- mobile-first

Suggested colors:
- Qatari maroon: `#8A1538`
- Deep maroon: `#5C0E26`
- White: `#FFFFFF`
- Soft background: `#F7F5F3`
- Warm gray: `#E8E2DD`
- Text charcoal: `#171717`
- Muted text: `#6B625F`
- Success green: `#16A34A`

Typography:
- Arabic-first
- Use a clean Arabic font such as:
  - IBM Plex Sans Arabic
  - Noto Kufi Arabic
  - Tajawal
- Choose one and implement consistently.
- Use `dir="rtl"` globally.
- Ensure all inputs, buttons, cards, and layout feel natural in RTL.

No heavy logo for now.
Header should simply show temporary brand text:

```arabic
ميدالية رقم السيارة
```

Contact/footer:
- WhatsApp only
- number: +97433423421
- no email

Floating WhatsApp support button:
- present on site
- Arabic label:

```arabic
تحتاج مساعدة؟
```

---

## 7. Tech stack

### Frontend

Use:

- Next.js latest stable
- App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- Zustand or lightweight state management
- Next/Image
- next/script for pixels
- Framer Motion only if useful and minimal
- Arabic RTL only
- Docker-ready
- domain: `keychain.qa`

### Backend

Use:

- Python FastAPI
- Postgres
- SQLAlchemy 2.0
- Alembic migrations
- Pydantic settings
- Uvicorn/Gunicorn
- Docker
- CORS for frontend only
- structured logging
- basic rate limiting
- backend domain: `api.keychain.qa`

Database internal URL example:

```env
DATABASE_URL=postgres://keychain:keychain@keychain_database:5432/keychain?sslmode=disable
```

Important:
- The backend must run database migrations automatically on startup.
- Include migration startup command in Docker entrypoint or startup script.
- Include health endpoint.

---

## 8. Required root files

Create these root files:

```text
README.md
CLAUDE.md
AGENTS.md
docker-compose.example.yml
.gitignore
.env.example
```

### CLAUDE.md

Must include:
- project purpose
- coding rules
- design rules
- Arabic copy rules
- tracking rules
- do not fake proof
- docs-first workflow
- testing instructions
- how to run frontend/backend locally
- how to deploy on Easypanel

### AGENTS.md

Must include Antigravity/agent workflow:
- first create docs
- then scaffold frontend/backend
- then implement APIs/database
- then implement funnel
- then tracking
- then admin
- then QA
- never skip acceptance criteria

---

## 9. Required docs folder

Create `/docs` with these files:

```text
00-project-overview.md
01-brand-positioning.md
02-funnel-flow-and-cro.md
03-copywriting-rules-arabic.md
04-design-system.md
05-frontend-architecture.md
06-backend-architecture.md
07-database-schema.md
08-api-contracts.md
09-google-sheets-api-sync.md
10-tracking-pixels-capi.md
11-visual-assets-and-higgsfield-prompts.md
12-admin-dashboard.md
13-deployment-easypanel-docker.md
14-env-examples.md
15-qa-launch-checklist.md
```

Each file must be specific to this project, not generic.

---

## 10. Frontend folder structure

Create:

```text
frontend/
  app/
    layout.tsx
    page.tsx
    thank-you/
      page.tsx
    admin/
      page.tsx
    about/
      page.tsx
    contact/
      page.tsx
    privacy/
      page.tsx
    terms/
      page.tsx
    delivery/
      page.tsx
  components/
    funnel/
      FunnelShell.tsx
      ProgressStepper.tsx
      LiveOrderSummary.tsx
      OfferStep.tsx
      PlateSelectionStep.tsx
      AddAnotherStep.tsx
      CheckoutStep.tsx
      ThankYouContent.tsx
      PlateStyleCard.tsx
      ProductSlider.tsx
    admin/
      AdminLogin.tsx
      AdminDashboard.tsx
      MetricsCards.tsx
      FunnelMetrics.tsx
      OrdersTable.tsx
      ProductionItemsTable.tsx
      StatusSelect.tsx
    layout/
      Header.tsx
      Footer.tsx
      WhatsAppFloatingButton.tsx
    tracking/
      SnapchatPixel.tsx
      MetaPixel.tsx
      TikTokPixel.tsx
      TrackingProvider.tsx
    ui/
      shadcn components
  lib/
    api.ts
    config.ts
    pricing.ts
    tracking.ts
    whatsapp.ts
    validation.ts
    utils.ts
  store/
    funnelStore.ts
  data/
    plateStyles.ts
    copy.ts
  public/
    placeholders/
  styles/
  Dockerfile
  .dockerignore
  .env.example
  package.json
  tailwind.config.ts
  next.config.ts
  tsconfig.json
```

---

## 11. Backend folder structure

Create:

```text
backend/
  app/
    main.py
    config.py
    database.py
    security.py
    logging_config.py
    middleware.py
    models/
      order.py
      order_item.py
      tracking_event.py
      admin_session.py
    schemas/
      orders.py
      tracking.py
      admin.py
    routers/
      orders.py
      tracking.py
      admin.py
      health.py
    services/
      pricing.py
      order_number.py
      google_sheets.py
      snapchat_capi.py
      meta_capi.py
      tiktok_events.py
      tracking.py
      whatsapp.py
      metrics.py
    migrations/
      env.py
      versions/
  alembic.ini
  requirements.txt
  Dockerfile
  .dockerignore
  .env.example
  start.sh
```

---

## 12. Database schema

Use Postgres with SQLAlchemy/Alembic.

### orders table

Fields:
- id UUID primary key
- order_number unique string, format `KCQ-000001`
- customer_name
- phone
- address
- payment_method enum/string: `cash`, `fawran_transfer`
- quantity
- subtotal
- delivery_fee default 0
- total
- currency default `QAR`
- status default `new`
- whatsapp_redirect_url optional
- user_agent
- ip_address
- landing_page_url
- referrer
- utm_source
- utm_medium
- utm_campaign
- utm_content
- utm_term
- snap_click_id / ScCid
- snap_cookie_id
- meta_fbclid
- tiktok_ttclid
- event_id
- created_at
- updated_at

### order_items table

One row per keychain.

Fields:
- id UUID primary key
- order_id foreign key
- order_number
- item_number integer
- plate_style enum/string:
  - `new_2026`
  - `private`
  - `classic`
  - `motorcycle`
  - `custom_choice`
- plate_style_label_ar
- plate_letter nullable
  - only Q/T/R for `new_2026`
  - default Q
- plate_number nullable
  - required for non-custom
  - null for custom_choice
- item_price
  - first item 160
  - additional items 100
- status default `new`
- google_sheet_row_number nullable
- google_sheet_sync_status
- google_sheet_last_synced_at
- created_at
- updated_at

### tracking_events table

Fields:
- id UUID primary key
- event_name
- event_id
- session_id
- order_id nullable
- step_name nullable
- source_platform
- url
- referrer
- user_agent
- ip_address
- utm fields
- snap click/cookie fields
- meta fields
- tiktok fields
- payload JSONB
- created_at

### admin_sessions or simple token

Since login is simple:
- use backend-issued session/JWT or signed cookie
- credentials come from `.env`
- no need for multi-user DB unless easier

### Optional logs

- google_sheet_logs
- capi_logs
- error_logs

---

## 13. Order statuses

Use English statuses:

```text
new
contacted
confirmed
in_production
out_for_delivery
delivered
cancelled
```

New submitted orders/items start as:

```text
new
```

Admin can update status.

Status updates must update:
1. Postgres
2. Google Sheet row for each affected item

If Google Sheet update fails, keep Postgres updated and surface sync error in admin.

---

## 14. Google Sheets API integration

Use **Google Sheets API with service account**, not Apps Script.

The user already created service account and shared the sheet with service account email.

Backend must support env vars for:
- service account JSON
- sheet ID
- sheet tab name

Use one tab only:

```text
order_items
```

Google Sheet should contain only order items, no KPIs.

Google Sheet columns must be English and clean:

```text
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

Behavior:
- Backend auto-checks/creates column headers in the first row if missing.
- Each keychain creates one row in Google Sheet.
- If customer orders 3 keychains, create 3 rows with same order number but different item_number.
- Store Google Sheet row number in `order_items.google_sheet_row_number`.
- When admin updates item status, update the corresponding Google Sheet row.
- Tracking/UTM data should NOT be sent to Google Sheet.
- Tracking data should only stay in Postgres/admin metrics.

---

## 15. API contracts

Base API URL:

```text
https://api.keychain.qa
```

### Health

`GET /api/health`

Returns:
```json
{
  "ok": true,
  "service": "keychain-api",
  "database": "ok"
}
```

### Create order

`POST /api/orders`

Request:
```json
{
  "customer_name": "محمد",
  "phone": "33423421",
  "address": "الدوحة",
  "payment_method": "cash",
  "items": [
    {
      "plate_style": "new_2026",
      "plate_letter": "Q",
      "plate_number": "123456"
    },
    {
      "plate_style": "custom_choice"
    }
  ],
  "tracking": {
    "event_id": "uuid",
    "session_id": "uuid",
    "landing_page_url": "https://keychain.qa",
    "referrer": "",
    "utm_source": "",
    "utm_campaign": "",
    "snap_click_id": "",
    "snap_cookie_id": ""
  }
}
```

Response:
```json
{
  "success": true,
  "order_number": "KCQ-000001",
  "quantity": 2,
  "total": 260,
  "currency": "QAR",
  "whatsapp_url": "https://wa.me/97433423421?text=..."
}
```

Validation:
- name required
- phone required, general number/string validation
- address required
- payment_method required and must be `cash` or `fawran_transfer`
- at least one item required
- non-custom plate style requires `plate_number`
- `new_2026` allows `plate_letter`, default Q
- custom choice does not require plate number
- server recalculates pricing; never trust frontend totals

### Tracking event

`POST /api/tracking/event`

Request:
```json
{
  "event_name": "OfferView",
  "event_id": "uuid",
  "session_id": "uuid",
  "step_name": "offer",
  "url": "https://keychain.qa",
  "tracking": {}
}
```

Events:
- `PageView`
- `OfferView`
- `SelectPlateStyle`
- `AddAnotherPlate`
- `InitiateCheckout`
- `SubmitOrder`
- `Purchase`

### Admin login

`POST /api/admin/login`

Request:
```json
{
  "username": "admin",
  "password": "password"
}
```

Uses env credentials.

### Admin metrics

`GET /api/admin/metrics`

Returns:
- total orders
- total revenue
- today orders
- keychains sold
- conversion rates
- funnel step counts
- drop-off by step
- orders by plate style
- payment method split
- status counts

### Admin orders

`GET /api/admin/orders`

Supports pagination/filtering.

### Admin production items

`GET /api/admin/order-items`

Shows one row per keychain.

### Update status

`PATCH /api/admin/order-items/{id}/status`

Request:
```json
{
  "status": "confirmed"
}
```

Must update Postgres and Google Sheets row.

---

## 16. Admin dashboard

Admin dashboard path:

```text
https://keychain.qa/admin
```

Protected by simple username + password from `.env`.

Admin must include:

### Metrics/KPIs

- total orders
- total revenue
- today’s orders
- total keychains sold
- average order value
- orders by status
- orders by plate style
- payment method split
- sessions
- offer views
- style selections
- checkout starts
- submitted orders
- conversion rate metrics:
  - sessions → orders
  - offer views → orders
  - style selections → orders
  - checkout starts → orders
  - checkout starts → completed orders
- drop-off by funnel step

### Views

1. Orders view
   - grouped by order number
   - customer, phone, total, quantity, payment method, status summary, created date

2. Production view
   - each keychain as its own row
   - matches Google Sheet structure
   - allows status update per item
   - shows sheet sync status

Dashboard UI:
- English admin interface is acceptable
- clean tables
- filter by status
- filter by plate style
- search by order number/phone
- responsive enough for desktop and mobile

---

## 17. Tracking / pixels / CAPI

Main enabled platform from day one:

```text
Snapchat
```

Prepare Meta and TikTok but disabled by default.

### Env flags

Frontend:
```env
NEXT_PUBLIC_ENABLE_SNAPCHAT=true
NEXT_PUBLIC_ENABLE_META=false
NEXT_PUBLIC_ENABLE_TIKTOK=false
```

Backend:
```env
ENABLE_SNAPCHAT_CAPI=true
ENABLE_META_CAPI=false
ENABLE_TIKTOK_EVENTS=false
```

### Snapchat requirements

Implement:
- Snapchat Pixel
- Snapchat Conversions API service
- ScCid capture from URL
- `_scid` / Snapchat cookie capture when possible
- event deduplication IDs
- server-side event sending for key events
- do not expose server tokens client-side

Events:
- PageView
- OfferView / ViewContent
- SelectPlateStyle
- AddAnotherPlate
- InitiateCheckout
- SubmitOrder
- Purchase

For browser/server dedupe:
- generate `event_id` on frontend
- send same event_id to backend for server event
- store event_id in Postgres

Tracking must never break checkout.

### Meta/TikTok disabled placeholders

Build code paths and env vars, but default disabled.
Do not load their browser pixels unless enabled.

Meta:
- pixel id env
- CAPI token env
- event_id dedupe ready

TikTok:
- pixel id env
- events API token env
- ttclid capture ready

### UTM/session capture

Capture and store in Postgres:
- utm_source
- utm_medium
- utm_campaign
- utm_content
- utm_term
- landing_page_url
- referrer
- session_id
- user_agent
- ip_address server-side
- ScCid
- _scid cookie if possible

Do not send UTM/tracking columns to Google Sheet.

---

## 18. Environment examples

### frontend/.env.example

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

### backend/.env.example

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

Root `.env.example` can reference both.

Important:
- Never commit real `GOOGLE_SERVICE_ACCOUNT_JSON`.
- Never commit real tokens.
- Include `.gitignore` rules for `.env` and service account JSON files.

---

## 19. Easypanel deployment

Docs must explain:

Frontend service:
- build from `/frontend`
- Dockerfile in frontend
- domain: `keychain.qa`
- env vars from `frontend/.env.example`

Backend service:
- build from `/backend`
- Dockerfile in backend
- domain: `api.keychain.qa`
- env vars from `backend/.env.example`
- connect to internal Postgres URL:
  `postgres://keychain:keychain@keychain_database:5432/keychain?sslmode=disable`

Postgres:
- database name: `keychain`
- user: `keychain`
- password: `keychain` unless user changes it

Backend startup:
- run Alembic migrations automatically
- start server

Example `start.sh`:
```bash
#!/usr/bin/env bash
set -e
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

Health check:
```text
GET https://api.keychain.qa/api/health
```

---

## 20. Standard pages

Create Arabic pages:

1. About
2. Contact
3. Privacy Policy
4. Terms & Conditions
5. Delivery Policy

They must be simple, trustworthy, and not overdone.

Contact page:
- WhatsApp only
- +97433423421
- no email

Delivery policy:
- Qatar only
- delivery included
- preparation + delivery within 24–48 hours inside Qatar

Avoid cancellation/refund note for now because user explicitly said no.

---

## 21. Copywriting rules

Customer-facing Arabic should be:
- Arabic only
- clean Gulf Arabic with Qatari flavor
- premium but direct
- simple and human
- not cheesy
- not overhyped
- not fake luxury
- no exaggerated scarcity

Use phrases like:
```arabic
خل رقم موترك دوم معاك
تفصيل خاص لرقم لوحتك
جاهزة وتوصلك خلال 24–48 ساعة
السعر شامل التوصيل داخل قطر
اختار ستايل اللوحة
حدد ستايل اللوحة
اكمل الطلب
ارسل الطلب
```

Avoid:
```arabic
الأفضل في العالم
عرض لا يتكرر
آخر فرصة
باقي 3 فقط
رسمي ومعتمد
```

Unless real proof exists, do not claim:
- official plate licensing
- official approval
- government affiliation
- guaranteed delivery if not controllable
- real customer reviews

---

## 22. Data/config files

Create centralized data/config so copy and plate styles are easy to edit.

Example:

```ts
export const plateStyles = [
  {
    id: "new_2026",
    titleAr: "اللوحة الجديدة 2026",
    image: "/placeholders/plate-new-2026.png",
    requiresPlateNumber: true,
    supportsLetter: true,
    defaultLetter: "Q",
    letters: ["Q", "T", "R"],
  },
  ...
]
```

Pricing utility:
```ts
export function calculateTotal(quantity: number) {
  if (quantity <= 0) return 0;
  return 160 + (quantity - 1) * 100;
}
```

Backend must have the same pricing logic server-side.

---

## 23. Validation rules

Frontend:
- name required
- phone required
- address required
- payment method required
- at least one item required
- each non-custom item requires plate number
- `new_2026` letter must be Q/T/R

Backend:
- repeat all validation
- recalculate total
- reject invalid payloads
- rate limit order endpoint
- store IP and user agent where possible

Phone:
- keep general required phone validation
- do not strictly enforce Qatar-only format for now

---

## 24. Order number format

Use:

```text
KCQ-000001
KCQ-000002
KCQ-000003
```

Implement safely to avoid duplicates.
Use database sequence/counter or safe transaction.

---

## 25. Docker requirements

Create Dockerfiles for frontend and backend.

Frontend Dockerfile:
- production build
- standalone output if using Next.js standalone
- expose 3000

Backend Dockerfile:
- Python slim
- install requirements
- copy app
- run startup script
- expose 8000

Add `.dockerignore` files.

Add `docker-compose.example.yml` for local testing:
- frontend
- backend
- postgres

---

## 26. Testing and QA

Create `/docs/15-qa-launch-checklist.md` with checklist for:

### Funnel
- Offer page loads
- Slider works
- CTA moves to style step
- Progress stepper works
- Live summary shows quantity and total
- Plate style selection works
- New 2026 letter dropdown appears only for new style
- Q default works
- Plate number required for non-custom
- Custom choice shows WhatsApp note and no plate number required
- Add another loop works unlimited
- Totals calculate correctly:
  - 1 = 160
  - 2 = 260
  - 3 = 360
- Checkout validation works
- Payment method has no default
- Submit button says `ارسل الطلب`
- Thank-you page shows order number and total
- WhatsApp opens with short message

### Backend
- migrations run on startup
- health endpoint works
- order endpoint validates
- order saved in Postgres
- order items saved correctly
- Google Sheet rows created one per keychain
- sheet headers auto-created
- status updates sync to sheet
- failure states logged

### Admin
- login works
- wrong password rejected
- KPIs load
- conversion rates display
- orders grouped view works
- production item view works
- status update works
- sheet sync status shown

### Tracking
- Snapchat Pixel loads when enabled
- Meta/TikTok disabled by default
- ScCid captured
- events stored in backend
- Purchase event sent after order
- tracking errors do not block order

### Deployment
- frontend Docker builds
- backend Docker builds
- env examples complete
- Easypanel docs complete
- CORS works
- no secrets committed

---

## 27. Acceptance criteria

The project is complete only when:

1. `CLAUDE.md` exists and is specific.
2. `AGENTS.md` exists and is specific.
3. `/docs` folder exists with all required docs.
4. Frontend app builds successfully.
5. Backend app starts successfully.
6. Dockerfiles are present and valid.
7. Env examples are complete.
8. Database migrations run on backend startup.
9. Order flow works end-to-end.
10. Postgres stores orders and order items.
11. Google Sheet sync creates one row per keychain.
12. Google Sheet headers are auto-created/verified.
13. Admin dashboard works with simple login.
14. Admin dashboard shows conversion rate and KPIs.
15. Admin can update statuses.
16. Status updates sync to Postgres and Google Sheet.
17. Snapchat Pixel/CAPI is implemented and enabled by default.
18. Meta/TikTok are prepared but disabled by default.
19. Tracking data is saved in Postgres, not Google Sheet.
20. Customer-facing UI is Arabic RTL only.
21. Copy is Qatari/Gulf flavored and premium/simple.
22. Design feels Qatari heritage + Apple simplicity.
23. Product image placeholders work.
24. Thank-you page works.
25. WhatsApp redirect works with short message.
26. No fake claims/proof/reviews/certifications.
27. README explains setup, deployment, testing, and env vars.

---

## 28. Build sequence for Claude Code

Follow this exact sequence:

### Phase 1 — Documentation

Create:
- `CLAUDE.md`
- `AGENTS.md`
- `/docs` files
- `README.md`

Do not code before these are complete.

### Phase 2 — Backend foundation

Create backend scaffold:
- FastAPI app
- config
- database
- models
- schemas
- migrations
- health route
- Dockerfile
- env example
- start script with migration

### Phase 3 — Order and Google Sheets

Implement:
- order number service
- pricing service
- order endpoint
- Google Sheets API service
- sheet header creation
- one row per keychain
- status sync

### Phase 4 — Tracking

Implement:
- tracking event API
- Snapchat Pixel frontend
- Snapchat CAPI backend
- Meta/TikTok disabled skeletons
- UTM/session capture

### Phase 5 — Frontend funnel

Implement:
- RTL layout
- Offer step
- Plate selection step
- Add another step
- Checkout step
- Thank-you page
- WhatsApp redirect
- placeholder images/cards

### Phase 6 — Admin dashboard

Implement:
- admin login
- metrics API
- orders view
- production view
- status update
- conversion rates

### Phase 7 — Standard pages and polish

Implement:
- about
- contact
- privacy
- terms
- delivery
- footer
- floating WhatsApp
- mobile polish
- loading/error states

### Phase 8 — QA

Run:
- frontend type check/build
- backend import/start checks
- migration checks
- API shape checks
- update README with final instructions

---


---

## 30. Claude Code permissions / autonomous execution note

The user wants Claude Code to work with minimal repeated permission prompts.

Important: A prompt cannot fully disable Claude Code permission prompts by itself. Claude Code permissions are controlled by the Claude Code CLI / IDE permission settings. However, follow these behavior rules inside the project:

1. Work autonomously inside the current project folder.
2. Do not repeatedly ask the user for confirmation before creating files, editing files, installing normal project dependencies, running builds, running tests, or running migrations.
3. Make safe implementation decisions when details are already provided in this prompt.
4. Only stop and ask the user for permission if the action is destructive or security-sensitive, such as:
   - deleting large folders
   - overwriting unrelated user files outside this project
   - exposing or printing secrets
   - committing real credentials
   - changing production database data manually
   - running commands outside the project folder
5. Never commit `.env`, service account JSON files, API tokens, or credentials.
6. If Claude Code asks for permissions, the recommended user-side setup is:
   - For safer project-level autonomy: use Claude Code `/permissions` and allow common project tools for this repository.
   - For fully autonomous controlled builds: run Claude Code in bypass permissions mode only inside a safe project folder/container.

Suggested command when the user intentionally wants full autonomous mode in a safe environment:

```bash
claude --permission-mode bypassPermissions
```

Equivalent legacy/alternate flag:

```bash
claude --dangerously-skip-permissions
```

Use bypass permissions only in a controlled environment where the user trusts the project context. Prefer project-level allow rules when working near sensitive files.


## 29. Final response after building

When finished, respond with:

1. What you built.
2. Full folder structure.
3. Local setup commands.
4. Env variables the user must fill.
5. Easypanel deployment steps.
6. How to connect Google Sheets.
7. How to test order flow.
8. How to test Snapchat Pixel/CAPI.
9. How to use admin dashboard.
10. Remaining items user must provide:
    - real product images
    - plate style images
    - Google Sheet ID
    - service account JSON
    - Snapchat Pixel ID and access token
    - optional Meta/TikTok credentials
    - admin password
