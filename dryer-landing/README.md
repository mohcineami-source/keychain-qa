# نَدى (Nada) — Portable Clothes Dryer Landing Page (Qatar)

A self-contained, mobile-first, **Arabic RTL** landing page for a portable hanging
clothes-drying bag, targeting Qatari buyers (home + travel). Cash-on-delivery, order
via on-page form → WhatsApp. Static site — no backend required to run it, with an
**optional** Netlify Function if you want orders logged to Google Sheets too.

## Files
| File | What it is |
|------|-----------|
| `index.html` | The whole page (13 sections, inline SVG icons, real product imagery). |
| `styles.css` | Design system — warm terracotta/amber premium, IBM Plex Sans Arabic. |
| `script.js` | Form validation, WhatsApp handoff, Snapchat pixel, Sheets sync, sticky CTA, FAQ, qty/total, scroll reveal. |
| `config.js` | **The file you normally edit** — WhatsApp number, price, pixel ids, Sheets toggle. |
| `images/` | Product photos (already filled in). |
| `netlify/functions/submit-order.js` | Optional: appends each order to a Google Sheet. |
| `netlify.toml` / `package.json` | Netlify Function + dependency config (only needed if you enable Sheets sync). |
| `build-preview.js` | Run `node build-preview.js` to regenerate `preview.html` (standalone file) and `artifact.html` (for hosted previews) from the source files above. |

## ⚙️ Before you run ads — edit `config.js`
1. **`WHATSAPP_NUMBER`** — the WhatsApp number that receives orders (digits only, no `+`).
2. **`PRICE_PER_UNIT`** — currently `175` QAR (shipping included).
3. **`SNAP_PIXEL_IDS`** — Snapchat pixel id(s). Fires `PAGE_VIEW` on load, `START_CHECKOUT` + `PURCHASE` on order submit. Empty the array to disable.
4. **`SHEETS_ENDPOINT`** — see the Google Sheets section below. Empty string disables it.

## ▶️ Run locally
```bash
# from this folder
python -m http.server 4321
# then open http://localhost:4321
```
(Any static server works for the page itself. Sheets sync additionally needs the
Netlify Function — see below — which only runs on Netlify, or via `netlify dev` locally.)

## 🚀 Deploy (static hosting)
Upload this folder to any static host (Netlify, Vercel, Cloudflare Pages, Easypanel
"static" service). No build step for the page itself.

---

## 📊 Optional: log every order to a Google Sheet

Orders are still sent via WhatsApp as the primary channel — this just adds a copy of
each order as a row in a spreadsheet, using a small Netlify Function so your Google
credentials never touch the browser. **A failed sync never blocks or delays the
WhatsApp handoff** — it's fire-and-forget.

### 1. Create the Google service account
1. Go to [Google Cloud Console](https://console.cloud.google.com/) → create (or pick) a project.
2. **APIs & Services → Library** → enable **Google Sheets API**.
3. **APIs & Services → Credentials → Create Credentials → Service Account**. Give it any name (e.g. `nada-sheets`).
4. Open the new service account → **Keys → Add Key → Create new key → JSON**. This downloads a JSON file — keep it private, never commit it (already git-ignored).
5. Note the service account's **email** (looks like `nada-sheets@your-project.iam.gserviceaccount.com`) from that JSON file.

### 2. Create the Sheet and share it
1. Create a new Google Sheet (any name).
2. Click **Share** and add the service account's email from step 1 with **Editor** access.
3. Copy the Sheet's **ID** from its URL: `https://docs.google.com/spreadsheets/d/THIS_PART/edit`.
4. Leave the sheet otherwise empty — the function creates an `Orders` tab and header row automatically on the first order.

### 3. Deploy this folder to Netlify
1. Push this repo (or just the `dryer-landing` folder) to GitHub/GitLab, then **New site from Git** in Netlify.
2. In **Site settings → Build & deploy**, set **Base directory** to `dryer-landing` (since this folder lives inside a larger repo).
3. Publish directory: `.` — Functions directory: `netlify/functions` (already set in `netlify.toml`, relative to the base directory).

### 4. Add the environment variables
In Netlify: **Site settings → Environment variables**, add (see `.env.example`):

| Variable | Value |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | the service account email from step 1 |
| `GOOGLE_PRIVATE_KEY` | the `private_key` field from the downloaded JSON, as one line with literal `\n` |
| `GOOGLE_SHEET_ID` | the spreadsheet ID from step 2 |
| `GOOGLE_SHEET_TAB` | optional, defaults to `Orders` |

Redeploy after adding the variables (Netlify only injects them into new deploys).

### 5. Test it
Submit a test order on the live site, then check the Sheet — a row should appear with
`timestamp, customer_name, phone, address, quantity, total_qar`. If nothing appears,
check **Netlify → Site → Functions → submit-order → Logs** for the error (almost
always a missing/incorrect env var, or the sheet not shared with the service account).

### Notes
- This endpoint is public and unauthenticated by design (like the WhatsApp link) —
  low stakes for a lead-capture sheet, matching how the WhatsApp handoff already works.
- Column values match exactly what the form collects (no city field — it was removed).
- To disable Sheets sync entirely, set `SHEETS_ENDPOINT: ""` in `config.js`.

---

## ✅ Honest-marketing guardrails (kept on purpose)
- No fake reviews, ratings, testimonials, or certifications.
- No fake scarcity / countdowns / "آخر فرصة".
- No fake discounts (no fake strike-through price).
- No warranty claims (removed on request).
- Product described honestly as **gentle warm-air drying** inside a hanging bag (not a tumble dryer).

Brand: **نَدى** · Tagline: *ملابسك جافة ودافئة داخل بيتك*
