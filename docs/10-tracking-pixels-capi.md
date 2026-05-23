# 10 — Tracking, Pixels & CAPI

## Platforms

| Platform | Default | Notes |
|----------|---------|-------|
| Snapchat | **Enabled** | Pixel + Conversions API from day one |
| Meta | **Disabled** | Fully scaffolded (pixel + CAPI), off by default |
| TikTok | **Disabled** | Fully scaffolded (pixel + Events API), off by default |

## Env flags

Frontend (`NEXT_PUBLIC_*`):
```env
NEXT_PUBLIC_ENABLE_SNAPCHAT=true
NEXT_PUBLIC_ENABLE_META=false
NEXT_PUBLIC_ENABLE_TIKTOK=false
NEXT_PUBLIC_SNAP_PIXEL_ID=
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_TIKTOK_PIXEL_ID=
```

Backend:
```env
ENABLE_SNAPCHAT_CAPI=true
ENABLE_META_CAPI=false
ENABLE_TIKTOK_EVENTS=false
SNAP_PIXEL_ID=
SNAP_ACCESS_TOKEN=
META_PIXEL_ID=
META_CAPI_ACCESS_TOKEN=
TIKTOK_PIXEL_ID=
TIKTOK_ACCESS_TOKEN=
```

Disabled platforms must **not** load their browser pixels.

## Golden rule

**Tracking must never break checkout.** Every tracking call (browser or server) is wrapped so failures are logged and swallowed. Step navigation and order submission proceed regardless.

## Events

```
PageView
OfferView         (a.k.a. ViewContent)
SelectPlateStyle
AddAnotherPlate
InitiateCheckout
SubmitOrder
Purchase
```

Mapped to funnel steps:
- Offer step view → `OfferView`
- Plate style chosen → `SelectPlateStyle`
- Add-another clicked → `AddAnotherPlate`
- Checkout started → `InitiateCheckout`
- Order submitted → `SubmitOrder`
- Order created (server-confirmed) → `Purchase`

## Browser ↔ server deduplication

1. Frontend generates an `event_id` (UUID) per event.
2. The browser pixel fires with that `event_id`.
3. The same `event_id` is sent to the backend (`POST /api/tracking/event` and, for orders, in the order payload's `tracking.event_id`).
4. The backend fires the server-side event (CAPI) with the same `event_id`.
5. `event_id` is stored in Postgres (`orders.event_id` and `tracking_events.event_id`).

This lets Snapchat dedupe the browser and server copies of `Purchase`/key events.

## Snapchat specifics

Implement:
- **Snapchat Pixel** (frontend, loaded only when `NEXT_PUBLIC_ENABLE_SNAPCHAT=true`, using `NEXT_PUBLIC_SNAP_PIXEL_ID`).
- **Snapchat Conversions API** (backend `services/snapchat_capi.py`, using `SNAP_PIXEL_ID` + `SNAP_ACCESS_TOKEN`).
- **ScCid** captured from the URL (`snap_click_id`).
- **`_scid`** Snapchat cookie captured when possible (`snap_cookie_id`).
- Server-side sending for key events (at least `Purchase`).
- **Server token never exposed client-side.**

## Meta / TikTok (disabled placeholders)

Build the code paths and env vars but keep them off by default and do not load their browser pixels unless enabled.
- **Meta:** pixel id env, CAPI token env, `event_id` dedupe ready, `fbclid` (`meta_fbclid`) capture ready.
- **TikTok:** pixel id env, Events API token env, `ttclid` (`tiktok_ttclid`) capture ready.

## UTM / session capture (stored in Postgres only)

Capture and store on `orders` (and `tracking_events`):
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- `landing_page_url`, `referrer`
- `session_id`
- `user_agent`
- `ip_address` (server-side)
- `snap_click_id` (ScCid)
- `snap_cookie_id` (`_scid`)
- `meta_fbclid`, `tiktok_ttclid`

**None of this goes to Google Sheets.** Tracking data lives only in Postgres and powers admin metrics.

## Frontend implementation notes

- `TrackingProvider` initializes `session_id`, reads UTM params + `ScCid` + `_scid` on first load, and exposes a safe `track(eventName, extra)` helper.
- Pixel components (`SnapchatPixel`, `MetaPixel`, `TikTokPixel`) are gated on their env flags and use `next/script`.
- `lib/tracking.ts` performs fire-and-forget POSTs to the backend; never `await` in a way that can block navigation or order submission.

## Backend implementation notes

- `routers/tracking.py` persists every event to `tracking_events`.
- `services/snapchat_capi.py` (and meta/tiktok counterparts) send server-side events only when their flag is enabled; all calls are try/except-wrapped and logged.
- The order endpoint fires `SubmitOrder`/`Purchase` server-side after the order is safely persisted.
