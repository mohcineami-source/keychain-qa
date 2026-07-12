/* =============================================================
   نَدى (Nada) — إعدادات الصفحة
   The 2 things you MUST set before running ads:
   1) WHATSAPP_NUMBER  — the WhatsApp number that receives orders
   2) PRICE_PER_UNIT   — price in QAR (shipping included)
   ============================================================= */

window.NADA_CONFIG = {
  /* WhatsApp number that receives orders — same as the keychain.qa project.
     International format, digits only, no "+" and no spaces. */
  WHATSAPP_NUMBER: "97433423421",

  /* Price per unit in QAR — shipping included. Displayed everywhere + used for the total. */
  PRICE_PER_UNIT: 175,

  /* Max quantity allowed in the stepper. */
  MAX_QTY: 5,

  /* Snapchat Pixel(s) — same pixels as the keychain.qa project. Loads the pixel, fires
     PAGE_VIEW, and fires a START_CHECKOUT event on order submit (fanned out to every id
     below). All wrapped so a blocked/failed pixel can NEVER break the page or WhatsApp.
     Empty the array to disable. */
  SNAP_PIXEL_IDS: [
    "8aebb720-6161-4982-a60e-2d14817db185",
    "76e619d1-4e5c-4d87-ac66-1da62aae216d",
  ],

  /* Google Sheets order log via a Netlify Function (see netlify/functions/submit-order.js).
     Fire-and-forget: a failure here NEVER blocks or delays the WhatsApp handoff.
     Set to "" to disable entirely (e.g. while testing locally with no function deployed). */
  SHEETS_ENDPOINT: "/.netlify/functions/submit-order",

  /* Prefilled WhatsApp order message. Keep the {placeholders}. */
  WHATSAPP_TEMPLATE:
    "السلام عليكم، أبي أطلب نشّافة نَدى.\n" +
    "الاسم: {name}\n" +
    "الهاتف: {phone}\n" +
    "العنوان: {address}\n" +
    "الكمية: {qty}\n" +
    "الإجمالي: {total} ريال (شامل التوصيل — الدفع عند الاستلام)\n" +
    "أبي أثبّت الطلب، والدفع عند الاستلام. متى أقدر أستلمه؟",
};
