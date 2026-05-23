"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Truck, Clock } from "lucide-react";
import { copy } from "@/data/copy";
import { Button } from "@/components/ui/button";
import { ProductSlider } from "./ProductSlider";
import { HowItWorks } from "./HowItWorks";
import { useFunnelStore } from "@/store/funnelStore";
import { trackEvent } from "@/lib/tracking";

export function OfferStep() {
  const startSelection = useFunnelStore((s) => s.startSelection);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackEvent("OfferView", { stepName: "offer" });
  }, []);

  const handleCta = () => {
    trackEvent("SelectPlateStyle", { stepName: "offer_cta" });
    startSelection();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0, 0, 1] }}
    >
      <ProductSlider />

      {/* Hero text — close to slider, one thought */}
      <div className="mt-8 text-center">
        <h1 className="text-hero">{copy.offer.hero}</h1>
        <p className="text-hero-subtitle mx-auto mt-4 max-w-[380px]">
          {copy.offer.description}
        </p>
      </div>

      {/* Trust cards — breathe after hero, stack on small phones */}
      <div className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3 sm:items-stretch">
        <TrustCard
          icon={<Truck className="h-[18px] w-[18px] shrink-0 text-maroon opacity-90" />}
          primary="160 ريال قطري"
          secondary="شامل التوصيل"
        />
        <TrustCard
          icon={<Clock className="h-[18px] w-[18px] shrink-0 text-maroon opacity-90" />}
          primary="التجهيز والتوصيل خلال 24–48 ساعة"
          secondary="داخل قطر"
        />
      </div>

      {/* Process section */}
      <div className="mt-9">
        <HowItWorks />
      </div>

      {/* CTA — generous space before the action */}
      <div className="mt-10">
        <Button size="full" onClick={handleCta}>
          {copy.offer.cta}
        </Button>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   Hero trust card — two-line, equal-height,
   icon-on-start (right in RTL), Cairo, premium.
   ────────────────────────────────────────────── */
function TrustCard({
  icon,
  primary,
  secondary,
}: {
  icon: React.ReactNode;
  primary: string;
  secondary: string;
}) {
  return (
    <div
      className="
        flex h-full items-center gap-4
        rounded-xl border border-[#EDEBE8] bg-white
        px-5 py-3.5 shadow-[0_1px_2px_rgba(23,23,23,0.04)]
      "
    >
      {/* RTL: first DOM child renders on the right edge */}
      {icon}
      <div className="flex flex-1 flex-col text-start leading-tight">
        <span className="text-[0.9375rem] font-bold text-charcoal">
          {primary}
        </span>
        <span className="mt-1 text-[0.8125rem] font-medium text-muted">
          {secondary}
        </span>
      </div>
    </div>
  );
}
