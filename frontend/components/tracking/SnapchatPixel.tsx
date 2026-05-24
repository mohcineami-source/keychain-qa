"use client";

import Script from "next/script";
import { config } from "@/lib/config";

/**
 * Snapchat Pixel base loader. Loads ONLY when NEXT_PUBLIC_ENABLE_SNAPCHAT=true and
 * at least one pixel id is configured. Initializes EVERY configured pixel id so a
 * single snaptr('track', ...) fans out to all of them.
 *
 * - `strategy="afterInteractive"` defers injection until after hydration → never
 *   blocks initial render.
 * - The injected `scevent.min.js` is loaded with `r.async = !0` → fully async.
 * - Server-side Conversions API is handled by the backend; tokens are never exposed here.
 */
export function SnapchatPixel() {
  if (!config.snapchat.enabled) return null;
  if (!config.snapchat.pixelIds.length) return null;

  const initCalls = config.snapchat.pixelIds
    .map((id) => `try { snaptr('init', ${JSON.stringify(id)}); } catch(e) {}`)
    .join("\n");

  return (
    <Script id="snapchat-pixel" strategy="afterInteractive">
      {`
        (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){
        a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
        a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;
        r.src=n;var u=t.getElementsByTagName(s)[0];
        u.parentNode.insertBefore(r,u);})(window,document,
        'https://sc-static.net/scevent.min.js');
        ${initCalls}
        try { snaptr('track', 'PAGE_VIEW'); } catch(e) {}
      `}
    </Script>
  );
}
