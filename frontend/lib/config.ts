/**
 * Centralized runtime config read from NEXT_PUBLIC_* env vars.
 * All values are safe to expose client-side.
 */

function bool(value: string | undefined): boolean {
  return value === "true" || value === "1";
}

function csv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
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
    // Supports either NEXT_PUBLIC_SNAP_PIXEL_IDS (comma-separated, multi-pixel)
    // or the legacy single NEXT_PUBLIC_SNAP_PIXEL_ID.
    pixelIds: (() => {
      const many = csv(process.env.NEXT_PUBLIC_SNAP_PIXEL_IDS);
      if (many.length) return many;
      const one = (process.env.NEXT_PUBLIC_SNAP_PIXEL_ID || "").trim();
      return one ? [one] : [];
    })(),
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
