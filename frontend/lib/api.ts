import { config } from "@/lib/config";
import type { TrackingContext } from "@/lib/tracking";
import type { PlateLetter, PlateStyleId } from "@/data/plateStyles";

export interface OrderItemPayload {
  plate_style: PlateStyleId;
  plate_letter?: PlateLetter;
  plate_number?: string;
}

export interface CreateOrderPayload {
  customer_name: string;
  phone: string;
  address: string;
  payment_method: "cash" | "fawran_transfer";
  items: OrderItemPayload[];
  tracking: {
    event_id: string;
  } & TrackingContext;
}

export interface CreateOrderResponse {
  success: boolean;
  order_number: string;
  quantity: number;
  total: number;
  currency: string;
  whatsapp_url: string;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${config.apiUrl}${path}`, {
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    ...init,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = (data && (data.detail || data.message)) || message;
    } catch {
      /* ignore parse error */
    }
    throw new ApiError(message, res.status);
  }

  return (await res.json()) as T;
}

export function createOrder(
  payload: CreateOrderPayload
): Promise<CreateOrderResponse> {
  return request<CreateOrderResponse>("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ---------- Admin API ---------- */

export interface AdminLoginResponse {
  token: string;
}

export function adminLogin(
  username: string,
  password: string
): Promise<AdminLoginResponse> {
  return request<AdminLoginResponse>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export interface AdminMetrics {
  total_orders: number;
  total_revenue: number;
  today_orders: number;
  keychains_sold: number;
  average_order_value: number;
  orders_by_status: Record<string, number>;
  orders_by_plate_style: Record<string, number>;
  payment_method_split: Record<string, number>;
  sessions: number;
  offer_views: number;
  style_selections: number;
  checkout_starts: number;
  submitted_orders: number;
  conversion_rates: {
    sessions_to_orders: number;
    offer_views_to_orders: number;
    style_selections_to_orders: number;
    checkout_starts_to_orders: number;
    checkout_starts_to_completed: number;
  };
  dropoff_by_step: Record<string, number>;
}

export interface DateRangeParams {
  start_date?: string;
  end_date?: string;
}

function appendDateRange(qs: URLSearchParams, range?: DateRangeParams): void {
  if (!range) return;
  if (range.start_date) qs.set("start_date", range.start_date);
  if (range.end_date) qs.set("end_date", range.end_date);
}

export function getAdminMetrics(
  token: string,
  range?: DateRangeParams
): Promise<AdminMetrics> {
  const qs = new URLSearchParams();
  appendDateRange(qs, range);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return request<AdminMetrics>(`/api/admin/metrics${suffix}`, {
    method: "GET",
    headers: authHeaders(token),
  });
}

export interface AdminOrder {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  address: string;
  payment_method: string;
  quantity: number;
  total: number;
  currency: string;
  status: string;
  created_at: string;
}

export interface AdminOrdersResponse {
  items: AdminOrder[];
  total: number;
  page: number;
  page_size: number;
}

export function getAdminOrders(
  token: string,
  params: {
    status?: string;
    search?: string;
    page?: number;
    start_date?: string;
    end_date?: string;
  } = {}
): Promise<AdminOrdersResponse> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.search) qs.set("search", params.search);
  if (params.page) qs.set("page", String(params.page));
  appendDateRange(qs, params);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return request<AdminOrdersResponse>(`/api/admin/orders${suffix}`, {
    method: "GET",
    headers: authHeaders(token),
  });
}

export interface AdminOrderItem {
  id: string;
  order_number: string;
  item_number: number;
  customer_name: string;
  phone: string;
  plate_style: string;
  plate_style_label_ar: string;
  plate_letter: string | null;
  plate_number: string | null;
  item_price: number;
  status: string;
  google_sheet_sync_status: string | null;
  google_sheet_row_number: number | null;
  created_at: string;
}

export interface AdminOrderItemsResponse {
  items: AdminOrderItem[];
  total: number;
  page: number;
  page_size: number;
}

export function getAdminOrderItems(
  token: string,
  params: {
    status?: string;
    plate_style?: string;
    search?: string;
    page?: number;
    start_date?: string;
    end_date?: string;
  } = {}
): Promise<AdminOrderItemsResponse> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.plate_style) qs.set("plate_style", params.plate_style);
  if (params.search) qs.set("search", params.search);
  if (params.page) qs.set("page", String(params.page));
  appendDateRange(qs, params);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return request<AdminOrderItemsResponse>(`/api/admin/order-items${suffix}`, {
    method: "GET",
    headers: authHeaders(token),
  });
}

export function updateOrderItemStatus(
  token: string,
  itemId: string,
  status: string
): Promise<AdminOrderItem> {
  return request<AdminOrderItem>(`/api/admin/order-items/${itemId}/status`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
}

export const ORDER_STATUSES = [
  "new",
  "contacted",
  "confirmed",
  "in_production",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
