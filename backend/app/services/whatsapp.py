"""Build the wa.me redirect URL with a short prefilled Arabic message."""
from __future__ import annotations

from urllib.parse import quote

from ..config import settings
from ..constants import CURRENCY

# Customer-facing payment labels (Arabic)
PAYMENT_LABELS_AR = {
    "cash": "كاش",
    "fawran_transfer": "تحويل فوري",
}


def build_whatsapp_message(
    *,
    order_number: str,
    customer_name: str,
    phone: str,
    quantity: int,
    total: int,
    payment_method: str,
) -> str:
    payment_ar = PAYMENT_LABELS_AR.get(payment_method, payment_method)
    return (
        "السلام عليكم، تم تسجيل طلبي في keychain.qa\n\n"
        f"رقم الطلب: {order_number}\n"
        f"الاسم: {customer_name}\n"
        f"الجوال: {phone}\n"
        f"عدد الميداليات: {quantity}\n"
        f"الإجمالي: {total} ريال شامل التوصيل\n"
        f"طريقة الدفع: {payment_ar}\n\n"
        "تفاصيل الطلب موجودة عندكم في النظام."
    )


def build_whatsapp_url(
    *,
    order_number: str,
    customer_name: str,
    phone: str,
    quantity: int,
    total: int,
    payment_method: str,
) -> str:
    number = settings.WHATSAPP_NUMBER.lstrip("+")
    message = build_whatsapp_message(
        order_number=order_number,
        customer_name=customer_name,
        phone=phone,
        quantity=quantity,
        total=total,
        payment_method=payment_method,
    )
    return f"https://wa.me/{number}?text={quote(message)}"
