"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminLogout,
  getAdminMetrics,
  getAdminOrders,
  getAdminOrderItems,
  updateOrderItemStatus,
  ORDER_STATUSES,
  type AdminMetrics,
  type AdminOrder,
  type AdminOrderItem,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MetricsCards } from "./MetricsCards";
import { FunnelMetrics } from "./FunnelMetrics";
import { OrdersTable } from "./OrdersTable";
import { ProductionItemsTable } from "./ProductionItemsTable";
import { DateRangeFilter } from "./DateRangeFilter";
import { plateStyles } from "@/data/plateStyles";
import type { DateRange, RangePresetId } from "@/lib/dateRange";

type Tab = "orders" | "production";

export function AdminDashboard({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<Tab>("orders");
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [items, setItems] = useState<AdminOrderItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [styleFilter, setStyleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rangePreset, setRangePreset] = useState<RangePresetId>("all");
  const [dateRange, setDateRange] = useState<DateRange>({});

  const loadMetrics = useCallback(async () => {
    try {
      const m = await getAdminMetrics(dateRange);
      setMetrics(m && typeof m === "object" ? m : null);
    } catch (err) {
      console.error("[admin] loadMetrics failed", err);
      /* metrics are non-blocking */
    }
  }, [dateRange]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "orders") {
        const res = await getAdminOrders({
          status: statusFilter || undefined,
          search: search || undefined,
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
        });
        setOrders(Array.isArray(res?.items) ? res.items : []);
      } else {
        const res = await getAdminOrderItems({
          status: statusFilter || undefined,
          plate_style: styleFilter || undefined,
          search: search || undefined,
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
        });
        setItems(Array.isArray(res?.items) ? res.items : []);
      }
    } catch (err) {
      console.error("[admin] loadData failed", err);
      setOrders([]);
      setItems([]);
      const status = (err as { status?: number } | null)?.status;
      if (status === 401) {
        onLogout();
        return;
      }
      setError("Failed to load data. Check the API connection.");
    } finally {
      setLoading(false);
    }
  }, [tab, statusFilter, styleFilter, search, dateRange, onLogout]);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleStatusChange = async (itemId: string, status: string) => {
    try {
      const updated = await updateOrderItemStatus(itemId, status);
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, ...updated } : it))
      );
      void loadMetrics();
    } catch {
      setError("Failed to update status. Try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await adminLogout();
    } catch {
      /* ignore — clear local state regardless */
    }
    onLogout();
  };

  return (
    <div dir="ltr" className="container-wide space-y-6 py-8 text-left">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-charcoal">
          keychain.qa — Admin
        </h1>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <DateRangeFilter
        preset={rangePreset}
        range={dateRange}
        onChange={(preset, range) => {
          setRangePreset(preset);
          setDateRange(range);
        }}
      />

      {metrics ? (
        <>
          <MetricsCards metrics={metrics} />
          <FunnelMetrics metrics={metrics} />
        </>
      ) : (
        <p className="text-sm text-muted">Loading metrics...</p>
      )}

      <div className="flex flex-wrap items-center gap-2 border-b border-warmgray pb-2">
        <button
          type="button"
          onClick={() => setTab("orders")}
          className={tab === "orders" ? tabActive : tabIdle}
        >
          Orders
        </button>
        <button
          type="button"
          onClick={() => setTab("production")}
          className={tab === "production" ? tabActive : tabIdle}
        >
          Production Items
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-44">
          <Select
            value={statusFilter}
            placeholder="All statuses"
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "", label: "All statuses" },
              ...ORDER_STATUSES.map((s) => ({ value: s, label: s })),
            ]}
          />
        </div>
        {tab === "production" ? (
          <div className="w-48">
            <Select
              value={styleFilter}
              placeholder="All plate styles"
              onChange={(e) => setStyleFilter(e.target.value)}
              options={[
                { value: "", label: "All plate styles" },
                ...plateStyles.map((p) => ({ value: p.id, label: p.id })),
              ]}
            />
          </div>
        ) : null}
        <div className="w-56">
          <Input
            placeholder="Search order # or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button size="sm" variant="outline" onClick={() => loadData()}>
          Refresh
        </Button>
      </div>

      {error ? (
        <p className="text-sm font-medium text-maroon">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : tab === "orders" ? (
        <OrdersTable orders={orders} />
      ) : (
        <ProductionItemsTable
          items={items}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

const tabActive =
  "rounded-md bg-maroon px-4 py-2 text-sm font-bold text-white";
const tabIdle =
  "rounded-md px-4 py-2 text-sm font-bold text-muted hover:text-maroon";
