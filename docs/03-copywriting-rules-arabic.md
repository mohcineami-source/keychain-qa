# 03 — Copywriting Rules (Arabic)

## Golden rules

1. **Customer-facing copy is Arabic only.** No mixed English in the funnel UI.
2. **Admin UI and Google Sheet columns/statuses are English.**
3. Voice: clean **Gulf Arabic with Qatari flavor** — premium, direct, simple, human.
4. Not cheesy, not overhyped, not fake luxury, no exaggerated scarcity.
5. **No fake proof:** no official/government approval, no licensing claims, no fake reviews, no guarantees you can't control.

## Exact required strings (use verbatim)

| Context | Arabic |
|---------|--------|
| Brand / header | ميدالية رقم السيارة |
| Hero headline | خل رقم موترك دوم معاك |
| Product description | ميدالية رقم السيارة بتفصيل أكريليك خاص، السعر 160 ريال شامل التوصيل، والتجهيز والتوصيل خلال 24–48 ساعة داخل قطر. |
| Price line | 160 ريال قطري شامل التوصيل |
| Final price line | السعر النهائي: 160 ريال قطري شامل التوصيل |
| Production + delivery | التجهيز والتوصيل خلال 24–48 ساعة داخل قطر |
| Primary CTA (Step 1) | اختار لوحتك |
| Step labels | العرض / اختيار اللوحة / الإضافات / بيانات الطلب |
| Step 2 title | حدد ستايل اللوحة |
| Letter dropdown label | حرف اللوحة |
| Plate number label | رقم اللوحة |
| Custom choice note | في حالة اختيار هذا الخيار، بنتواصل معك على واتساب عشان ناخذ تفاصيل طلبك بالضبط. |
| Continue to checkout | اكمل الطلب |
| Add another | أضف ميدالية ثانية بـ 100 ريال |
| Name label | الاسم |
| Phone label | رقم الجوال |
| Address label | العنوان |
| Payment: cash | كاش |
| Payment: transfer | تحويل فورا |
| Checkout submit | ارسل الطلب |
| Live summary labels | عدد الميداليات / الإجمالي |
| Floating WhatsApp label | تحتاج مساعدة؟ |

## Process steps (Step 1)

```
1. اختار ستايل اللوحة
2. ارسل الطلب
3. نجهزها لك
4. نوصلها لين عندك
```

## Plate style titles

```
new_2026      → اللوحة الجديدة 2026
private       → اللوحة الخاصة
classic       → اللوحة الكلاسيكية
motorcycle    → لوحة الدراجة النارية
custom_choice → اختيار مخصص
```

## Thank-you copy

```
تم استلام طلبك بنجاح
رقم طلبك: KCQ-000001
الإجمالي: 160 ريال قطري شامل التوصيل
بنتواصل معك قريب عبر واتساب لتأكيد التفاصيل.
```

## WhatsApp prefilled message (short — avoid long URLs)

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

Payment method should be shown in the customer's wording (كاش / تحويل فورا) in this message even though the stored value is `cash` / `fawran_transfer`.

## Approved phrase bank

```
خل رقم موترك دوم معاك
تفصيل خاص لرقم لوحتك
جاهزة وتوصلك خلال 24–48 ساعة
السعر شامل التوصيل داخل قطر
اختار ستايل اللوحة
حدد ستايل اللوحة
اكمل الطلب
ارسل الطلب
```

## Banned phrases (do NOT use)

```
الأفضل في العالم
عرض لا يتكرر
آخر فرصة
باقي 3 فقط
رسمي ومعتمد
```

## Banned claims (unless real proof exists)

- Official plate licensing
- Official approval / government affiliation
- Guaranteed delivery beyond what is controllable
- Real customer reviews / testimonials / certifications

## Implementation note

Centralize all copy in `frontend/data/copy.ts` so strings are edited in one place. Standard pages (About / Contact / Privacy / Terms / Delivery) are also Arabic, simple, and trustworthy — see `docs/05-frontend-architecture.md` and spec §20. Contact = WhatsApp only (+97433423421), no email. Delivery = Qatar only, delivery included, 24–48h. No cancellation/refund note at launch.
