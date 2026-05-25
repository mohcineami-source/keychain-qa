"use client";

import type { AdminMetrics } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function pct(value: unknown): string {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return `${(n * 100).toFixed(1)}%`;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function safeEntries(value: unknown): [string, number][] {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, unknown>).map(([k, v]) => [
    k,
    num(v),
  ]);
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
  const cr = (metrics?.conversion_rates ?? {}) as Partial<
    AdminMetrics["conversion_rates"]
  >;
  const plateStyleEntries = safeEntries(metrics?.orders_by_plate_style);
  const paymentEntries = safeEntries(metrics?.payment_method_split);
  const statusEntries = safeEntries(metrics?.orders_by_status);

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
          <Row label="Sessions" value={num(metrics?.sessions)} />
          <Row label="Offer Views" value={num(metrics?.offer_views)} />
          <Row label="Style Selections" value={num(metrics?.style_selections)} />
          <Row label="Checkout Starts" value={num(metrics?.checkout_starts)} />
          <Row label="Submitted Orders" value={num(metrics?.submitted_orders)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orders by Plate Style</CardTitle>
        </CardHeader>
        <CardContent>
          {plateStyleEntries.length === 0 ? (
            <p className="py-2 text-sm text-muted">No data yet.</p>
          ) : (
            plateStyleEntries.map(([k, v]) => <Row key={k} label={k} value={v} />)
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment & Status</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentEntries.length === 0 && statusEntries.length === 0 ? (
            <p className="py-2 text-sm text-muted">No data yet.</p>
          ) : (
            <>
              {paymentEntries.map(([k, v]) => (
                <Row key={`p-${k}`} label={`Payment: ${k}`} value={v} />
              ))}
              {statusEntries.map(([k, v]) => (
                <Row key={`s-${k}`} label={`Status: ${k}`} value={v} />
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
