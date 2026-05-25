/**
 * Date range helpers for the admin dashboard.
 * All "today" computations are anchored to Asia/Qatar (UTC+3, no DST).
 * Dates are serialized as YYYY-MM-DD strings to send to the backend.
 */

const QATAR_TZ = "Asia/Qatar";

export type RangePresetId =
  | "all"
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "this_month"
  | "custom";

export interface DateRange {
  start_date?: string;
  end_date?: string;
}

export interface PresetOption {
  id: RangePresetId;
  label: string;
}

export const RANGE_PRESETS: PresetOption[] = [
  { id: "all", label: "All Time" },
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last7", label: "Last 7 Days" },
  { id: "last30", label: "Last 30 Days" },
  { id: "this_month", label: "This Month" },
  { id: "custom", label: "Custom Range" },
];

function qatarYmd(d: Date): string {
  // Format a Date as YYYY-MM-DD according to Asia/Qatar.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: QATAR_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${day}`;
}

function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  // Build a UTC date to avoid local-timezone drift, then add days.
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + days);
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(utc.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function firstOfMonthYmd(ymd: string): string {
  const [y, m] = ymd.split("-");
  return `${y}-${m}-01`;
}

export function presetToRange(preset: RangePresetId): DateRange {
  if (preset === "all" || preset === "custom") return {};
  const today = qatarYmd(new Date());
  switch (preset) {
    case "today":
      return { start_date: today, end_date: today };
    case "yesterday": {
      const y = addDaysYmd(today, -1);
      return { start_date: y, end_date: y };
    }
    case "last7":
      return { start_date: addDaysYmd(today, -6), end_date: today };
    case "last30":
      return { start_date: addDaysYmd(today, -29), end_date: today };
    case "this_month":
      return { start_date: firstOfMonthYmd(today), end_date: today };
    default:
      return {};
  }
}

export function describeRange(preset: RangePresetId, range: DateRange): string {
  if (preset === "all") return "All time";
  if (!range.start_date && !range.end_date) return "All time";
  if (range.start_date && range.end_date) {
    if (range.start_date === range.end_date) return range.start_date;
    return `${range.start_date} → ${range.end_date}`;
  }
  if (range.start_date) return `from ${range.start_date}`;
  if (range.end_date) return `until ${range.end_date}`;
  return "All time";
}

export function todayQatarYmd(): string {
  return qatarYmd(new Date());
}
