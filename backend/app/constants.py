"""Shared domain constants: statuses, plate styles, payment methods."""
from __future__ import annotations

# Order / item statuses (English, per spec section 13)
ORDER_STATUSES = [
    "new",
    "contacted",
    "confirmed",
    "in_production",
    "out_for_delivery",
    "delivered",
    "cancelled",
]
DEFAULT_STATUS = "new"

# Payment methods (spec section 12 / 15)
PAYMENT_METHODS = ["cash", "fawran_transfer"]

# Plate styles (spec section 4 / 12, plus qatar_side_flag added post-launch)
PLATE_STYLES = [
    "new_2026",
    "private",
    "classic",
    "motorcycle",
    "qatar_side_flag",
    "custom_choice",
]

# Arabic labels for plate styles
PLATE_STYLE_LABELS_AR = {
    "new_2026": "اللوحة الجديدة 2026",
    "private": "اللوحة الخاصة",
    "classic": "اللوحة الكلاسيكية",
    "motorcycle": "لوحة الدراجة النارية",
    "qatar_side_flag": "لوحة قطر الجانبية",
    "custom_choice": "اختيار مخصص",
}

# Styles that require a plate number (everything except custom_choice)
NON_CUSTOM_STYLES = [s for s in PLATE_STYLES if s != "custom_choice"]

# new_2026 letters
PLATE_LETTERS = ["Q", "T", "R"]
DEFAULT_PLATE_LETTER = "Q"

# Pricing (spec section 2)
FIRST_ITEM_PRICE = 160
ADDITIONAL_ITEM_PRICE = 100
DELIVERY_FEE = 0
CURRENCY = "QAR"

# Google Sheet header columns (spec section 14) — exact order
SHEET_COLUMNS = [
    "order_number",
    "item_number",
    "customer_name",
    "phone",
    "address",
    "plate_style",
    "plate_letter",
    "plate_number",
    "item_price",
    "total_order_value",
    "payment_method",
    "status",
    "created_at",
]
