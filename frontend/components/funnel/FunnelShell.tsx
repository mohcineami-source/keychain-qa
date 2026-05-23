"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFunnelStore } from "@/store/funnelStore";
import { ProgressStepper } from "./ProgressStepper";
import { LiveOrderSummary } from "./LiveOrderSummary";
import { OfferStep } from "./OfferStep";
import { PlateSelectionStep } from "./PlateSelectionStep";
import { AddAnotherStep } from "./AddAnotherStep";
import { CheckoutStep } from "./CheckoutStep";

/**
 * Single-page step funnel driven entirely by funnelStore.step.
 * Steps 1-4 render inline; on submission (step 5) we route to /thank-you.
 */
export function FunnelShell() {
  const step = useFunnelStore((s) => s.step);
  const submitted = useFunnelStore((s) => s.submitted);
  const router = useRouter();

  useEffect(() => {
    if (step === 5 && submitted) {
      router.push("/thank-you");
    }
  }, [step, submitted, router]);

  return (
    <div className="container-page py-8">
      <div className="mx-auto max-w-2xl space-y-6">
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
  );
}
