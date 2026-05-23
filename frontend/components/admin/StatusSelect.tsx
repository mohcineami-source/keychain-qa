"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";
import { ORDER_STATUSES } from "@/lib/api";

interface StatusSelectProps {
  value: string;
  onChange: (status: string) => Promise<void> | void;
  disabled?: boolean;
}

export function StatusSelect({ value, onChange, disabled }: StatusSelectProps) {
  const [busy, setBusy] = useState(false);

  const handleChange = async (next: string) => {
    if (next === value) return;
    setBusy(true);
    try {
      await onChange(next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Select
      className="h-9 min-w-[150px] text-sm"
      value={value}
      disabled={disabled || busy}
      onChange={(e) => handleChange(e.target.value)}
      options={ORDER_STATUSES.map((s) => ({ value: s, label: s }))}
    />
  );
}
