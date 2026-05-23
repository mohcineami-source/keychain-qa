"use client";

import type { AdminMetrics } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-warmgray/60 py-2 text-sm last:border-0">
      <span className="text-muted">{label}</span>
      <span className="font-bold text-charcoal">{value}</span>
    </div>
  );
}

export function FunnelMetrics({ metrics }: { metrics: AdminMetrics }) {
  const cr = metrics.conversion_rates;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Conversion Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <Row label="Sessions → Orders" value={pct(cr.sessions_to_orders)} />
          <Row
            label="Offer Views → Orders"
            value={pct(cr.offer_views_to_orders)}
          />
          <Row
            label="Style Selections → Orders"
            value={pct(cr.style_selections_to_orders)}
          />
          <Row
            label="Checkout Starts → Orders"
            value={pct(cr.checkout_starts_to_orders)}
          />
          <Row
            label="Checkout Starts → Completed"
            value={pct(cr.checkout_starts_to_completed)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Funnel Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <Row label="Sessions" value={metrics.sessions} />
          <Row label="Offer Views" value={metrics.offer_views} />
          <Row label="Style Selections" value={metrics.style_selections} />
          <Row label="Checkout Starts" value={metrics.checkout_starts} />
          <Row label="Submitted Orders" value={metrics.submitted_orders} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orders by Plate Style</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(metrics.orders_by_plate_style).map(([k, v]) => (
            <Row key={k} label={k} value={v} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment & Status</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(metrics.payment_method_split).map(([k, v]) => (
            <Row key={k} label={`Payment: ${k}`} value={v} />
          ))}
          {Object.entries(metrics.orders_by_status).map(([k, v]) => (
            <Row key={k} label={`Status: ${k}`} value={v} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
