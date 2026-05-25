"use client";

import type { AdminMetrics } from "@/lib/api";
import { Card } from "@/components/ui/card";

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className="mt-1 text-2xl font-extrabold text-charcoal">{value}</div>
    </Card>
  );
}

export function MetricsCards({ metrics }: { metrics: AdminMetrics }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Metric label="Total Orders" value={num(metrics?.total_orders)} />
      <Metric
        label="Total Revenue (QAR)"
        value={num(metrics?.total_revenue).toLocaleString("en-US")}
      />
      <Metric label="Today's Orders" value={num(metrics?.today_orders)} />
      <Metric label="Keychains Sold" value={num(metrics?.keychains_sold)} />
      <Metric
        label="Avg Order Value (QAR)"
        value={Math.round(num(metrics?.average_order_value)).toLocaleString(
          "en-US"
        )}
      />
      <Metric label="Sessions" value={num(metrics?.sessions)} />
      <Metric label="Offer Views" value={num(metrics?.offer_views)} />
      <Metric label="Checkout Starts" value={num(metrics?.checkout_starts)} />
    </div>
  );
}
