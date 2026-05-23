"use client";

import { copy } from "@/data/copy";
import { cn } from "@/lib/utils";
import type { FunnelStep } from "@/store/funnelStore";

export function ProgressStepper({ step }: { step: FunnelStep }) {
  // Steps 1-4 are visible; step 5 (thank you) is its own page.
  const current = Math.min(step, 4);

  return (
    <nav aria-label="مراحل الطلب" className="w-full">
      <ol className="flex items-center justify-between gap-1">
        {copy.stepper.steps.map((s, idx) => {
          const isDone = s.number < current;
          const isActive = s.number === current;
          return (
            <li
              key={s.number}
              className="flex flex-1 flex-col items-center gap-1.5 text-center"
            >
              <div className="flex w-full items-center">
                <span
                  className={cn(
                    "mx-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
                    isActive && "bg-maroon text-white",
                    isDone && "bg-success text-white",
                    !isActive && !isDone && "bg-warmgray text-muted"
                  )}
                >
                  {s.number}
                </span>
              </div>
              <span
                className={cn(
                  "text-[11px] font-semibold sm:text-xs",
                  isActive ? "text-maroon" : "text-muted"
                )}
              >
                {s.label}
              </span>
              {idx < copy.stepper.steps.length - 1 ? null : null}
            </li>
          );
        })}
      </ol>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-warmgray">
        <div
          className="h-full rounded-full bg-maroon transition-all duration-500"
          style={{ width: `${(current / 4) * 100}%` }}
        />
      </div>
    </nav>
  );
}
