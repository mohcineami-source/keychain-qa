import { config } from "@/lib/config";

export interface WhatsAppOrderInfo {
  orderNumber: string;
  customerName: string;
  phone: string;
  quantity: number;
  total: number;
  paymentMethod: "cash" | "fawran_transfer";
}

const paymentLabelAr: Record<WhatsAppOrderInfo["paymentMethod"], string> = {
  cash: "كاش",
  fawran_transfer: "تحويل فورا",
};

/**
 * Build a SHORT prefilled WhatsApp message (per spec section 4, Step 5)
 * to avoid URL length issues. Order details live in the backend system.
 */
export function buildWhatsAppMessage(info: WhatsAppOrderInfo): string {
  return [
    "السلام عليكم، تم تسجيل طلبي في keychain.qa",
    "",
    `رقم الطلب: ${info.orderNumber}`,
    `الاسم: ${info.customerName}`,
    `الجوال: ${info.phone}`,
    `عدد الميداليات: ${info.quantity}`,
    `الإجمالي: ${info.total} ريال شامل التوصيل`,
    `طريقة الدفع: ${paymentLabelAr[info.paymentMethod]}`,
    "",
    "تفاصيل الطلب موجودة عندكم في النظام.",
  ].join("\n");
}

export function buildWhatsAppUrl(message: string): string {
  const number = config.whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** Plain support link (floating button / contact). */
export function whatsappSupportUrl(): string {
  const number = config.whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${number}`;
}
