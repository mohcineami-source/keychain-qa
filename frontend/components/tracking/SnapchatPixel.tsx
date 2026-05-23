"use client";

import Script from "next/script";
import { config } from "@/lib/config";

/**
 * Snapchat Pixel. Loads ONLY when NEXT_PUBLIC_ENABLE_SNAPCHAT=true and a pixel id exists.
 * Server-side Conversions API is handled by the backend; tokens are never exposed here.
 */
export function SnapchatPixel() {
  if (!config.snapchat.enabled || !config.snapchat.pixelId) return null;

  const pixelId = config.snapchat.pixelId;

  return (
    <Script id="snapchat-pixel" strategy="afterInteractive">
      {`
        (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){
        a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
        a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;
        r.src=n;var u=t.getElementsByTagName(s)[0];
        u.parentNode.insertBefore(r,u);})(window,document,
        'https://sc-static.net/scevent.min.js');
        snaptr('init', '${pixelId}');
        snaptr('track', 'PAGE_VIEW');
      `}
    </Script>
  );
}
