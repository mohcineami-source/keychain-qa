"use client";

import { copy } from "@/data/copy";
import { useFunnelStore } from "@/store/funnelStore";
import { formatAmount } from "@/lib/utils";

export function LiveOrderSummary() {
  const items = useFunnelStore((s) => s.items);
  const quantity = items.length;
  const total = useFunnelStore((s) => s.total());

  if (quantity === 0) return null;

  return (
    <div className="flex items-center justify-between rounded-md border border-warmgray bg-white px-4 py-3 text-sm shadow-soft">
      <span className="text-muted">
        {copy.summary.countLabel}:{" "}
        <span className="font-bold text-charcoal">{quantity}</span>
      </span>
      <span className="text-muted">
        {copy.summary.totalLabel}:{" "}
        <span className="font-extrabold text-maroon">
          {formatAmount(total)} {copy.common.currencyShort}
        </span>
      </span>
    </div>
  );
}
