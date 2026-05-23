import { v4 as uuidv4 } from "uuid";
import { config } from "@/lib/config";

export type TrackingEventName =
  | "PageView"
  | "OfferView"
  | "SelectPlateStyle"
  | "AddAnotherPlate"
  | "InitiateCheckout"
  | "SubmitOrder"
  | "Purchase";

export interface TrackingContext {
  session_id: string;
  landing_page_url: string;
  referrer: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  snap_click_id: string;
  snap_cookie_id: string;
  meta_fbclid: string;
  tiktok_ttclid: string;
}

const SESSION_KEY = "kcq_session_id";
const CONTEXT_KEY = "kcq_tracking_context";

export function newEventId(): string {
  return uuidv4();
}

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : "";
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = uuidv4();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return uuidv4();
  }
}

/**
 * Build the tracking context from URL + cookies + referrer.
 * Persisted to sessionStorage so all events in a session share the same attribution.
 */
export function buildTrackingContext(): TrackingContext {
  if (typeof window === "undefined") {
    return emptyContext();
  }

  try {
    const cached = window.sessionStorage.getItem(CONTEXT_KEY);
    const params = new URLSearchParams(window.location.search);

    const base: TrackingContext = cached
      ? (JSON.parse(cached) as TrackingContext)
      : emptyContext();

    const ctx: TrackingContext = {
      session_id: getOrCreateSessionId(),
      landing_page_url: base.landing_page_url || window.location.href,
      referrer: base.referrer || document.referrer || "",
      utm_source: params.get("utm_source") || base.utm_source || "",
      utm_medium: params.get("utm_medium") || base.utm_medium || "",
      utm_campaign: params.get("utm_campaign") || base.utm_campaign || "",
      utm_content: params.get("utm_content") || base.utm_content || "",
      utm_term: params.get("utm_term") || base.utm_term || "",
      snap_click_id:
        params.get("ScCid") ||
        params.get("sccid") ||
        base.snap_click_id ||
        "",
      snap_cookie_id: readCookie("_scid") || base.snap_cookie_id || "",
      meta_fbclid: params.get("fbclid") || base.meta_fbclid || "",
      tiktok_ttclid: params.get("ttclid") || base.tiktok_ttclid || "",
    };

    window.sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx));
    return ctx;
  } catch {
    return emptyContext();
  }
}

function emptyContext(): TrackingContext {
  return {
    session_id: getOrCreateSessionId(),
    landing_page_url: "",
    referrer: "",
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_content: "",
    utm_term: "",
    snap_click_id: "",
    snap_cookie_id: "",
    meta_fbclid: "",
    tiktok_ttclid: "",
  };
}

interface FireOptions {
  stepName?: string;
  eventId?: string;
  extra?: Record<string, unknown>;
}

/**
 * Fire a tracking event. Fire-and-forget; must NEVER throw or block the funnel.
 * Posts to backend POST /api/tracking/event and also fires the browser pixel (Snapchat) when enabled.
 */
export function trackEvent(
  name: TrackingEventName,
  options: FireOptions = {}
): string {
  const eventId = options.eventId || newEventId();

  try {
    const ctx = buildTrackingContext();

    // Browser-side Snapchat pixel (dedupe via event_id where the SDK supports it).
    fireSnapchatPixel(name);

    const body = {
      event_name: name,
      event_id: eventId,
      session_id: ctx.session_id,
      step_name: options.stepName,
      url: typeof window !== "undefined" ? window.location.href : "",
      tracking: ctx,
      ...(options.extra ? { payload: options.extra } : {}),
    };

    void fetch(`${config.apiUrl}/api/tracking/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {
      /* swallow — tracking must never block */
    });
  } catch {
    /* swallow — tracking must never block */
  }

  return eventId;
}

const snapEventMap: Partial<Record<TrackingEventName, string>> = {
  PageView: "PAGE_VIEW",
  OfferView: "VIEW_CONTENT",
  SelectPlateStyle: "VIEW_CONTENT",
  AddAnotherPlate: "ADD_CART",
  InitiateCheckout: "START_CHECKOUT",
  SubmitOrder: "START_CHECKOUT",
  Purchase: "PURCHASE",
};

function fireSnapchatPixel(name: TrackingEventName) {
  if (!config.snapchat.enabled) return;
  if (typeof window === "undefined") return;
  const snaptr = (window as unknown as { snaptr?: (...args: unknown[]) => void })
    .snaptr;
  if (typeof snaptr !== "function") return;
  const snapEvent = snapEventMap[name];
  if (!snapEvent) return;
  try {
    snaptr("track", snapEvent);
  } catch {
    /* swallow */
  }
}
