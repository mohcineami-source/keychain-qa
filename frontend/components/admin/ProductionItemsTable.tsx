"use client";

import type { AdminOrderItem } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { StatusSelect } from "./StatusSelect";

interface ProductionItemsTableProps {
  items: AdminOrderItem[];
  onStatusChange: (itemId: string, status: string) => Promise<void>;
}

function syncTone(status: string | null): "success" | "warning" | "muted" {
  if (status === "synced") return "success";
  if (status === "error" || status === "failed") return "warning";
  return "muted";
}

export function ProductionItemsTable({
  items,
  onStatusChange,
}: ProductionItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-warmgray bg-white p-8 text-center text-sm text-muted">
        No production items found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-warmgray bg-white shadow-soft">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead className="border-b border-warmgray bg-soft/60 text-xs uppercase text-muted">
          <tr>
            <th className="px-4 py-3 font-semibold">Order #</th>
            <th className="px-4 py-3 font-semibold">Item</th>
            <th className="px-4 py-3 font-semibold">Customer</th>
            <th className="px-4 py-3 font-semibold">Phone</th>
            <th className="px-4 py-3 font-semibold">Plate Style</th>
            <th className="px-4 py-3 font-semibold">Letter</th>
            <th className="px-4 py-3 font-semibold">Plate #</th>
            <th className="px-4 py-3 font-semibold">Price</th>
            <th className="px-4 py-3 font-semibold">Sheet Sync</th>
            <th className="px-4 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr
              key={it.id}
              className="border-b border-warmgray/60 last:border-0 hover:bg-soft/40"
            >
              <td className="px-4 py-3 font-mono font-semibold text-charcoal">
                {it.order_number}
              </td>
              <td className="px-4 py-3 text-charcoal">#{it.item_number}</td>
              <td className="px-4 py-3 text-charcoal">{it.customer_name}</td>
              <td className="px-4 py-3 font-mono text-muted">{it.phone}</td>
              <td className="px-4 py-3 text-charcoal">{it.plate_style}</td>
              <td className="px-4 py-3 text-muted">{it.plate_letter || "—"}</td>
              <td className="px-4 py-3 font-mono text-charcoal">
                {it.plate_number || "—"}
              </td>
              <td className="px-4 py-3 text-charcoal">{it.item_price}</td>
              <td className="px-4 py-3">
                <Badge tone={syncTone(it.google_sheet_sync_status)}>
                  {it.google_sheet_sync_status || "pending"}
                  {it.google_sheet_row_number
                    ? ` (row ${it.google_sheet_row_number})`
                    : ""}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <StatusSelect
                  value={it.status}
                  onChange={(status) => onStatusChange(it.id, status)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
