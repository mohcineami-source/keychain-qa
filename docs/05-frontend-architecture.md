# 05 — Frontend Architecture

## Stack

Next.js (latest stable, **App Router**) · React · TypeScript · Tailwind CSS · shadcn/ui · React Hook Form · Zod · Zustand · `next/image` · `next/script` (pixels) · Framer Motion (minimal, optional). **Arabic RTL only.** Docker-ready. Domain `keychain.qa`.

## Folder structure

```
frontend/
  app/
    layout.tsx                 # dir="rtl", Arabic font, global providers, tracking provider
    page.tsx                   # the single-page step funnel (FunnelShell)
    thank-you/page.tsx
    admin/page.tsx
    about/page.tsx
    contact/page.tsx
    privacy/page.tsx
    terms/page.tsx
    delivery/page.tsx
  components/
    funnel/
      FunnelShell.tsx          # orchestrates steps, reads/writes funnelStore
      ProgressStepper.tsx      # 1 العرض → 2 اختيار اللوحة → 3 الإضافات → 4 بيانات الطلب
      LiveOrderSummary.tsx     # عدد الميداليات + الإجمالي only
      OfferStep.tsx            # Step 1
      PlateSelectionStep.tsx   # Step 2
      AddAnotherStep.tsx       # Step 3
      CheckoutStep.tsx         # Step 4 (RHF + Zod)
      ThankYouContent.tsx      # Step 5 content
      PlateStyleCard.tsx       # selectable plate style card
      ProductSlider.tsx        # 4 placeholder images
    admin/
      AdminLogin.tsx
      AdminDashboard.tsx
      MetricsCards.tsx
      FunnelMetrics.tsx
      OrdersTable.tsx
      ProductionItemsTable.tsx
      StatusSelect.tsx
    layout/
      Header.tsx               # brand text "ميدالية رقم السيارة"
      Footer.tsx               # WhatsApp only, page links
      WhatsAppFloatingButton.tsx  # "تحتاج مساعدة؟"
    tracking/
      SnapchatPixel.tsx
      MetaPixel.tsx            # disabled by default
      TikTokPixel.tsx         # disabled by default
      TrackingProvider.tsx    # session_id, UTM/ScCid capture, event_id helper
    ui/                        # shadcn components
  lib/
    api.ts                    # fetch wrapper to api.keychain.qa
    config.ts                 # reads NEXT_PUBLIC_* env
    pricing.ts                # calculateTotal()
    tracking.ts               # safe event firing (never throws)
    whatsapp.ts               # build wa.me URL + short message
    validation.ts             # Zod schemas (mirror backend)
    utils.ts
  store/
    funnelStore.ts            # Zustand: step, items[], customer, totals
  data/
    plateStyles.ts            # centralized plate config
    copy.ts                   # centralized Arabic copy
  public/
    placeholders/             # hero-*.png, plate-*.png
  styles/
  Dockerfile
  .dockerignore
  .env.example
  package.json
  tailwind.config.ts
  next.config.ts
  tsconfig.json
```

## State management (Zustand `funnelStore`)

Holds the funnel state across steps (no routing between funnel steps):

- `step`: current step (1–5).
- `items[]`: array of selected keychains, each `{ plate_style, plate_style_label_ar, plate_letter?, plate_number? }`.
- `customer`: `{ customer_name, phone, address, payment_method }`.
- Derived: `quantity = items.length`, `total = calculateTotal(quantity)`.
- Actions: `goTo(step)`, `addItem(item)`, `updateItem(index, patch)`, `setCustomer(patch)`, `reset()`.
- After successful submit, store the returned `order_number`, `total`, `whatsapp_url` for the thank-you state.

## Pricing (shared logic)

`lib/pricing.ts`:

```ts
export function calculateTotal(quantity: number) {
  if (quantity <= 0) return 0;
  return 160 + (quantity - 1) * 100;
}
```

Frontend total is **display-only**; the backend recalculates and is authoritative.

## Plate styles config

`data/plateStyles.ts` (single source the UI reads):

```ts
export const plateStyles = [
  { id: "new_2026",     titleAr: "اللوحة الجديدة 2026",  image: "/placeholders/plate-new-2026.png",  requiresPlateNumber: true,  supportsLetter: true,  defaultLetter: "Q", letters: ["Q","T","R"] },
  { id: "private",      titleAr: "اللوحة الخاصة",        image: "/placeholders/plate-private.png",    requiresPlateNumber: true,  supportsLetter: false },
  { id: "classic",      titleAr: "اللوحة الكلاسيكية",    image: "/placeholders/plate-classic.png",    requiresPlateNumber: true,  supportsLetter: false },
  { id: "motorcycle",   titleAr: "لوحة الدراجة النارية", image: "/placeholders/plate-motorcycle.png", requiresPlateNumber: true,  supportsLetter: false },
  { id: "custom_choice",titleAr: "اختيار مخصص",          image: "/placeholders/plate-custom.png",     requiresPlateNumber: false, supportsLetter: false },
] as const;
```

## Validation (`lib/validation.ts`, Zod)

Mirror the backend exactly:
- `customer_name` required, `phone` required (general), `address` required.
- `payment_method` ∈ {`cash`, `fawran_transfer`}, required, **no default**.
- `items` length ≥ 1.
- Non-custom item requires `plate_number`.
- `new_2026` `plate_letter` ∈ {Q, T, R} (default Q); `custom_choice` has no plate number.

React Hook Form drives the checkout step with the Zod resolver.

## API client (`lib/api.ts`)

- Base URL from `NEXT_PUBLIC_API_URL`.
- `createOrder(payload)` → `POST /api/orders`.
- `trackEvent(payload)` → `POST /api/tracking/event` (fire-and-forget, errors swallowed).
- Admin calls use the session token from login.

## Tracking integration

- `TrackingProvider` mounts pixels per env flags, captures `session_id`, UTM params, `ScCid`, `_scid` cookie, and exposes a safe `track(eventName, payload)` helper that generates an `event_id` and sends it to both the browser pixel and the backend (for dedupe). See `docs/10-tracking-pixels-capi.md`.
- **All tracking is non-blocking**: a failure never prevents step navigation or order submission.

## WhatsApp (`lib/whatsapp.ts`)

Builds `https://wa.me/97433423421?text=<short encoded message>` using the template in `docs/03`. Used on the thank-you state and the floating button.

## Build & Docker

- Next.js standalone output, expose 3000, production build in `frontend/Dockerfile` with `.dockerignore`.
- `npm run build` must succeed for the QA gate.
