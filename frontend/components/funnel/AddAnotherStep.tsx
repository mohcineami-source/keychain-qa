"use client";

import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { copy } from "@/data/copy";
import { Button } from "@/components/ui/button";
import { getPlateStyleLabel } from "@/data/plateStyles";
import { useFunnelStore } from "@/store/funnelStore";
import { itemPrice } from "@/lib/pricing";
import { formatAmount } from "@/lib/utils";
import { trackEvent } from "@/lib/tracking";

export function AddAnotherStep() {
  const items = useFunnelStore((s) => s.items);
  const beginAddAnother = useFunnelStore((s) => s.beginAddAnother);
  const goToCheckout = useFunnelStore((s) => s.goToCheckout);
  const removeItem = useFunnelStore((s) => s.removeItem);
  const goToStep = useFunnelStore((s) => s.goToStep);

  const handleAddAnother = () => {
    trackEvent("AddAnotherPlate", { stepName: "add_another" });
    beginAddAnother();
  };

  const handleContinue = () => {
    trackEvent("InitiateCheckout", { stepName: "add_another_continue" });
    goToCheckout();
  };

  const handleRemove = (id: string) => {
    removeItem(id);
    // If no items remain, send the customer back to selection.
    if (items.length <= 1) {
      goToStep(2);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      <h2 className="text-center text-2xl font-extrabold text-charcoal">
        {copy.addAnother.title}
      </h2>

      <ul className="space-y-3">
        {items.map((item, idx) => {
          const isCustom = item.plateStyle === "custom_choice";
          return (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-warmgray bg-white p-4 shadow-soft"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-maroon/10 text-xs font-extrabold text-maroon">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-charcoal">
                    {getPlateStyleLabel(item.plateStyle)}
                  </span>
                </div>
                {isCustom ? (
                  <p className="ps-9 text-xs text-muted">
                    {copy.addAnother.customItemNote}
                  </p>
                ) : (
                  <p className="ps-9 text-sm text-muted">
                    {copy.addAnother.plateNumberLabel}:{" "}
                    <span dir="ltr" className="font-semibold text-charcoal">
                      {item.plateLetter ? `${item.plateLetter} ` : ""}
                      {item.plateNumber}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-extrabold text-maroon">
                  {formatAmount(itemPrice(idx + 1))} {copy.common.currencyShort}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  aria-label="حذف"
                  className="text-muted transition-colors hover:text-maroon"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between rounded-lg border border-maroon/20 bg-maroon/5 px-4 py-3">
        <span className="font-bold text-charcoal">
          {copy.summary.totalLabel}
        </span>
        <span className="text-lg font-extrabold text-maroon">
          {formatAmount(useFunnelStore.getState().total())}{" "}
          {copy.common.currency}
        </span>
      </div>

      <div className="space-y-3">
        <Button size="full" onClick={handleContinue} className="text-lg">
          {copy.addAnother.continue}
        </Button>
        <Button
          size="full"
          variant="outline"
          onClick={handleAddAnother}
          className="text-base"
        >
          <Plus className="h-5 w-5" />
          {copy.addAnother.addAnother}
        </Button>
      </div>
    </motion.div>
  );
}
