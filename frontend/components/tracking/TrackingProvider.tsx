"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { SnapchatPixel } from "./SnapchatPixel";
import { MetaPixel } from "./MetaPixel";
import { TikTokPixel } from "./TikTokPixel";
import { buildTrackingContext, trackEvent } from "@/lib/tracking";

/**
 * Mounts pixels (each self-gates on its enable flag) and fires PageView on every
 * route change. Tracking never blocks rendering.
 */
export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    try {
      buildTrackingContext();
      trackEvent("PageView", { stepName: "page_view" });
    } catch {
      /* never block */
    }
  }, [pathname]);

  return (
    <>
      <SnapchatPixel />
      <MetaPixel />
      <TikTokPixel />
      {children}
    </>
  );
}
