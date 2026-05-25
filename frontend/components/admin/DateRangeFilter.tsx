"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  DateRange,
  RANGE_PRESETS,
  RangePresetId,
  describeRange,
  presetToRange,
  todayQatarYmd,
} from "@/lib/dateRange";

interface DateRangeFilterProps {
  preset: RangePresetId;
  range: DateRange;
  onChange: (preset: RangePresetId, range: DateRange) => void;
}

export function DateRangeFilter({ preset, range, onChange }: DateRangeFilterProps) {
  const [customStart, setCustomStart] = useState(range.start_date ?? "");
  const [customEnd, setCustomEnd] = useState(range.end_date ?? "");

  useEffect(() => {
    if (preset === "custom") {
      setCustomStart(range.start_date ?? "");
      setCustomEnd(range.end_date ?? "");
    }
  }, [preset, range.start_date, range.end_date]);

  const handlePreset = (value: string) => {
    const next = value as RangePresetId;
    if (next === "custom") {
      const today = todayQatarYmd();
      const start = range.start_date || customStart || today;
      const end = range.end_date || customEnd || today;
      setCustomStart(start);
      setCustomEnd(end);
      onChange("custom", { start_date: start, end_date: end });
    } else {
      onChange(next, presetToRange(next));
    }
  };

  const applyCustom = () => {
    if (!customStart || !customEnd) return;
    if (customEnd < customStart) return;
    onChange("custom", { start_date: customStart, end_date: customEnd });
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-warmgray bg-white p-3 shadow-soft">
      <div className="w-44">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
          Date range
        </label>
        <Select
          value={preset}
          onChange={(e) => handlePreset(e.target.value)}
          options={RANGE_PRESETS.map((p) => ({ value: p.id, label: p.label }))}
        />
      </div>

      {preset === "custom" ? (
        <>
          <div className="w-40">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
              Start
            </label>
            <Input
              type="date"
              value={customStart}
              max={customEnd || undefined}
              onChange={(e) => setCustomStart(e.target.value)}
            />
          </div>
          <div className="w-40">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
              End
            </label>
            <Input
              type="date"
              value={customEnd}
              min={customStart || undefined}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </div>
          <Button size="sm" variant="outline" onClick={applyCustom}>
            Apply
          </Button>
        </>
      ) : null}

      <div className="ml-auto text-xs text-muted">
        <span className="font-semibold text-charcoal">Showing:</span>{" "}
        {describeRange(preset, range)}{" "}
        <span className="text-muted/70">(Asia/Qatar)</span>
      </div>
    </div>
  );
}
