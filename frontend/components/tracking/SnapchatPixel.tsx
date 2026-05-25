"use client";

import { useEffect } from "react";
import { config } from "@/lib/config";

/**
 * Snapchat Pixel base loader.
 *
 * Loads ONLY when NEXT_PUBLIC_ENABLE_SNAPCHAT=true and at least one pixel id is
 * configured. Initializes EVERY configured pixel id so a single
 * snaptr('track', ...) fans out to all of them.
 *
 * Implementation notes:
 * - We bootstrap `window.snaptr` imperatively in a useEffect so that the queue
 *   function is defined synchronously on mount, BEFORE the external
 *   scevent.min.js finishes loading. This guarantees `typeof window.snaptr ===
 *   "function"` immediately after hydration.
 * - The external script is injected only once (guarded by a script-id check).
 * - All Snapchat calls are wrapped in try/catch so a blocked/failed pixel
 *   never breaks the page (Brave Shields, uBlock, etc.).
 * - Server-side Conversions API is handled by the backend; tokens are never
 *   exposed here.
 */

declare global {
  interface Window {
    snaptr?: {
      (...args: unknown[]): void;
      queue?: unknown[][];
      handleRequest?: (...args: unknown[]) => void;
    };
  }
}

const SCRIPT_ID = "snapchat-pixel-script";
const SCRIPT_SRC = "https://sc-static.net/scevent.min.js";

function bootstrapSnaptr(): void {
  if (typeof window === "undefined") return;
  if (typeof window.snaptr === "function") return;

  const queueFn = function (this: unknown, ...args: unknown[]): void {
    const s = window.snaptr;
    if (s && typeof s.handleRequest === "function") {
      s.handleRequest.apply(s, args);
    } else if (s && Array.isArray(s.queue)) {
      s.queue.push(args);
    }
  } as Window["snaptr"];

  if (queueFn) {
    queueFn.queue = [];
    window.snaptr = queueFn;
  }
}

function injectScriptOnce(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = SCRIPT_SRC;
  script.onerror = () => {
    // Blocked by an ad blocker / Brave Shields / network. Site keeps working.
    // eslint-disable-next-line no-console
    console.warn("Snapchat pixel script failed to load (blocked or offline).");
  };
  const first = document.getElementsByTagName("script")[0];
  if (first && first.parentNode) {
    first.parentNode.insertBefore(script, first);
  } else {
    document.head.appendChild(script);
  }
}

export function SnapchatPixel() {
  useEffect(() => {
    if (!config.snapchat.enabled) return;
    if (!config.snapchat.pixelIds.length) return;

    try {
      bootstrapSnaptr();
    } catch {
      /* never break the page */
      return;
    }

    for (const id of config.snapchat.pixelIds) {
      try {
        window.snaptr?.("init", id);
      } catch {
        /* ignore */
      }
    }

    try {
      window.snaptr?.("track", "PAGE_VIEW");
    } catch {
      /* ignore */
    }

    try {
      injectScriptOnce();
    } catch {
      /* ignore */
    }
  }, []);

  return null;
}
