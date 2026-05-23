# 02 — Funnel Flow & CRO

The customer experience is a **single-page step funnel** (not separate routed pages). State is held in a Zustand store; steps swap in place with minimal Apple-like motion (soft fade, subtle slide, gentle button states — no flashy effects).

## Progress indicator

Always visible, minimal, with both numbers and Arabic labels:

```
1 العرض → 2 اختيار اللوحة → 3 الإضافات → 4 بيانات الطلب
```

## Live order summary

Shown during the funnel steps. Shows **only**:
- عدد الميداليات (quantity)
- الإجمالي (total)

No clutter, no per-item breakdown in the live summary.

---

## Step 1 — العرض (Offer)

**Goal:** explain offer, product, price, process, and speed fast.

Contains:
- Product slider with **4 placeholder images**.
- Hero headline: `خل رقم موترك دوم معاك`.
- Product description mentioning acrylic, e.g.:
  > ميدالية رقم السيارة بتفصيل أكريليك خاص، السعر 160 ريال شامل التوصيل، والتجهيز والتوصيل خلال 24–48 ساعة داخل قطر.
- Price: `160 ريال قطري شامل التوصيل`.
- Production + delivery: `التجهيز والتوصيل خلال 24–48 ساعة داخل قطر`.
- Process (text + icons):
  1. اختار ستايل اللوحة
  2. ارسل الطلب
  3. نجهزها لك
  4. نوصلها لين عندك
- CTA: **`اختار لوحتك`** → moves to Step 2.

---

## Step 2 — اختيار اللوحة (Plate style selection)

**Title:** `حدد ستايل اللوحة`

Five selectable cards (placeholder image + Arabic title under it + clear selected state with border/check):

| id | Title | Behavior |
|----|-------|----------|
| `new_2026` | اللوحة الجديدة 2026 | shows letter dropdown (Q/T/R, default **Q**, label `حرف اللوحة`) + plate number field |
| `private` | اللوحة الخاصة | plate number field |
| `classic` | اللوحة الكلاسيكية | plate number field |
| `motorcycle` | لوحة الدراجة النارية | plate number field |
| `custom_choice` | اختيار مخصص | **no** plate number; show note below |

- Plate number field for non-custom styles: label `رقم اللوحة`, **required**, general input (no strict digit-length rules).
- Custom choice note:
  > في حالة اختيار هذا الخيار، بنتواصل معك على واتساب عشان ناخذ تفاصيل طلبك بالضبط.
- No live preview at launch.
- "Next" advances to Step 3 after validation. Use elegant placeholders only — never fake real plate images.

---

## Step 3 — الإضافات (Add another or checkout)

Clean summary of currently selected items + two buttons:

1. **`اكمل الطلب`** → go to checkout (Step 4).
2. **`أضف ميدالية ثانية بـ 100 ريال`** → return to Step 2 to add another keychain.

The add-another loop supports **unlimited** keychains. No remove/edit system at launch.

---

## Step 4 — بيانات الطلب (Checkout)

Fields:
- الاسم (Name) — required.
- رقم الجوال (Phone) — required, general validation, **not** Qatar-format-locked.
- العنوان (Address) — single required free-text field (no area/street/building split).
- Payment method — **no default**; customer must choose `كاش` (cash) or `تحويل فورا` (fawran_transfer).

Item display:
- Each selected item shown clearly. Non-custom items show their entered plate number (minor correction allowed; no heavy edit/remove system). Custom choice shows no plate number field.

Submit button: **`ارسل الطلب`**. No extra payment note needed.

---

## Step 5 — Thank you

On submit, in order:
1. Create order in backend.
2. Save order + order items in Postgres.
3. Sync each keychain item to Google Sheets.
4. Fire tracking events **safely** (never blocking).
5. Show thank-you state.
6. Open WhatsApp via simple `wa.me` redirect with a **short** prefilled message.

Thank-you shows: short confirmation, order number, total. No long summary. Example:

```
تم استلام طلبك بنجاح
رقم طلبك: KCQ-000001
الإجمالي: 160 ريال قطري شامل التوصيل
بنتواصل معك قريب عبر واتساب لتأكيد التفاصيل.
```

WhatsApp prefilled message (kept short to avoid URL issues):

```
السلام عليكم، تم تسجيل طلبي في keychain.qa

رقم الطلب: KCQ-000001
الاسم: {customer_name}
الجوال: {phone}
عدد الميداليات: {quantity}
الإجمالي: {total} ريال شامل التوصيل
طريقة الدفع: {payment_method}

تفاصيل الطلب موجودة عندكم في النظام.
```

WhatsApp number: **+97433423421** via `wa.me` (no Business API).

---

## CRO principles applied

- **Single decision per screen** to reduce cognitive load.
- **Offer-first**: price transparency ("شامل التوصيل") and speed ("24–48 ساعة") stated up front.
- **Minimal fields**: only what's needed to fulfill; no account, no email, no split address.
- **Live total visible** so price is never a surprise at checkout.
- **Low-friction add-on** ("أضف ميدالية ثانية بـ 100 ريال") to lift AOV without pressure.
- **Honest, no fake scarcity** — trust over hype.
- **Human handoff** to WhatsApp closes the loop and reassures.
- **Tracking is non-blocking** so analytics never costs a conversion.

## Funnel events (for measurement)

`PageView → OfferView → SelectPlateStyle → AddAnotherPlate → InitiateCheckout → SubmitOrder → Purchase`

These power the admin conversion rates and drop-off-by-step metrics (see `docs/12-admin-dashboard.md`).
