"use client";

import type { AdminMetrics } from "@/lib/api";
import { Card } from "@/components/ui/card";

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
      <Metric label="Total Orders" value={metrics.total_orders} />
      <Metric
        label="Total Revenue (QAR)"
        value={metrics.total_revenue.toLocaleString("en-US")}
      />
      <Metric label="Today's Orders" value={metrics.today_orders} />
      <Metric label="Keychains Sold" value={metrics.keychains_sold} />
      <Metric
        label="Avg Order Value (QAR)"
        value={Math.round(metrics.average_order_value).toLocaleString("en-US")}
      />
      <Metric label="Sessions" value={metrics.sessions} />
      <Metric label="Offer Views" value={metrics.offer_views} />
      <Metric label="Checkout Starts" value={metrics.checkout_starts} />
    </div>
  );
}
