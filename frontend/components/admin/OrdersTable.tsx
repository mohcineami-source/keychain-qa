"use client";

import type { AdminOrder } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

export function OrdersTable({ orders }: { orders: AdminOrder[] }) {
  const safeOrders = Array.isArray(orders) ? orders : [];
  if (safeOrders.length === 0) {
    return (
      <div className="rounded-lg border border-warmgray bg-white p-8 text-center text-sm text-muted">
        No orders found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-warmgray bg-white shadow-soft">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-warmgray bg-soft/60 text-xs uppercase text-muted">
          <tr>
            <th className="px-4 py-3 font-semibold">Order #</th>
            <th className="px-4 py-3 font-semibold">Customer</th>
            <th className="px-4 py-3 font-semibold">Phone</th>
            <th className="px-4 py-3 font-semibold">Qty</th>
            <th className="px-4 py-3 font-semibold">Total</th>
            <th className="px-4 py-3 font-semibold">Payment</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Created</th>
          </tr>
        </thead>
        <tbody>
          {safeOrders.map((o) => (
            <tr
              key={o.id}
              className="border-b border-warmgray/60 last:border-0 hover:bg-soft/40"
            >
              <td className="px-4 py-3 font-mono font-semibold text-charcoal">
                {o.order_number}
              </td>
              <td className="px-4 py-3 text-charcoal">{o.customer_name}</td>
              <td className="px-4 py-3 font-mono text-muted">{o.phone}</td>
              <td className="px-4 py-3 text-charcoal">{o.quantity}</td>
              <td className="px-4 py-3 font-semibold text-charcoal">
                {o.total} {o.currency}
              </td>
              <td className="px-4 py-3 text-muted">{o.payment_method}</td>
              <td className="px-4 py-3">
                <Badge tone={o.status === "delivered" ? "success" : "default"}>
                  {o.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-xs text-muted">
                {new Date(o.created_at).toLocaleString("en-GB")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
