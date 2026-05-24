"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFunnelStore } from "@/store/funnelStore";
import { ProgressStepper } from "./ProgressStepper";
import { LiveOrderSummary } from "./LiveOrderSummary";
import { OfferStep } from "./OfferStep";
import { PlateSelectionStep } from "./PlateSelectionStep";
import { AddAnotherStep } from "./AddAnotherStep";
import { CheckoutStep } from "./CheckoutStep";

// Sticky header is h-16 (64px); 80 leaves a small visual gap above the section.
const FUNNEL_TOP_OFFSET = 80;

/**
 * Single-page step funnel driven entirely by funnelStore.step.
 * Steps 1-4 render inline; on submission (step 5) we route to /thank-you.
 *
 * Scroll behavior: when the active step changes, scroll the viewport to the
 * top of the funnel section so the user sees the new step from the beginning.
 * Uses manual window.scrollTo (NOT scrollIntoView — unreliable on iOS Safari)
 * and skips the initial render so we don't yank the user on page load.
 */
export function FunnelShell() {
  const step = useFunnelStore((s) => s.step);
  const submitted = useFunnelStore((s) => s.submitted);
  const router = useRouter();
  const funnelTopRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (step === 5 && submitted) {
      router.push("/thank-you");
    }
  }, [step, submitted, router]);

  const scrollToFunnelTop = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!funnelTopRef.current) return;
    const y =
      funnelTopRef.current.getBoundingClientRect().top +
      window.scrollY -
      FUNNEL_TOP_OFFSET;
    const top = Math.max(0, y);
    try {
      window.scrollTo({ top, behavior: "smooth" });
    } catch {
      // Older iOS Safari may reject the options object.
      window.scrollTo(0, top);
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (typeof window === "undefined") return;
    const timer = window.setTimeout(scrollToFunnelTop, 100);
    return () => window.clearTimeout(timer);
  }, [step, scrollToFunnelTop]);

  return (
    <div className="container-page py-8">
      <div className="mx-auto max-w-2xl">
        {/* Scroll anchor — MUST sit at the very top of the funnel area, before
            the stepper. Always the scroll target; never a card, button,
            footer, or form field. Zero-height + aria-hidden = no layout/AT impact. */}
        <div ref={funnelTopRef} aria-hidden="true" className="h-0 w-full" />
        <div className="space-y-6">
          <ProgressStepper step={step} />
          {step >= 2 && step <= 4 ? <LiveOrderSummary /> : null}

          <div>
            {step === 1 ? <OfferStep /> : null}
            {step === 2 ? <PlateSelectionStep /> : null}
            {step === 3 ? <AddAnotherStep /> : null}
            {step === 4 ? <CheckoutStep /> : null}
            {step === 5 ? (
              <p className="py-12 text-center text-muted">جاري التحويل...</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
