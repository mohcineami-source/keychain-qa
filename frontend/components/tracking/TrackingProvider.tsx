"use client";

import { useEffect, useRef } from "react";
import { SnapchatPixel } from "./SnapchatPixel";
import { MetaPixel } from "./MetaPixel";
import { TikTokPixel } from "./TikTokPixel";
import { buildTrackingContext, trackEvent } from "@/lib/tracking";

/**
 * Mounts pixels (each self-gates on its enable flag) and fires the initial
 * PageView event to the backend. Tracking never blocks rendering.
 */
export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    try {
      buildTrackingContext(); // capture + persist attribution on first load
      trackEvent("PageView", { stepName: "page_view" });
    } catch {
      /* never block */
    }
  }, []);

  return (
    <>
      <SnapchatPixel />
      <MetaPixel />
      <TikTokPixel />
      {children}
    </>
  );
}
