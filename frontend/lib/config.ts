/**
 * Centralized runtime config read from NEXT_PUBLIC_* env vars.
 * All values are safe to expose client-side.
 */

function bool(value: string | undefined): boolean {
  return value === "true" || value === "1";
}

export const config = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://keychain.qa",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "https://api.keychain.qa",
  brandNameAr: process.env.NEXT_PUBLIC_BRAND_NAME_AR || "ميدالية رقم السيارة",
  market: process.env.NEXT_PUBLIC_MARKET || "QA",
  currency: process.env.NEXT_PUBLIC_CURRENCY || "QAR",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "97433423421",

  snapchat: {
    enabled: bool(process.env.NEXT_PUBLIC_ENABLE_SNAPCHAT),
    pixelId: process.env.NEXT_PUBLIC_SNAP_PIXEL_ID || "",
  },
  meta: {
    enabled: bool(process.env.NEXT_PUBLIC_ENABLE_META),
    pixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
  },
  tiktok: {
    enabled: bool(process.env.NEXT_PUBLIC_ENABLE_TIKTOK),
    pixelId: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || "",
  },
} as const;

export type AppConfig = typeof config;
