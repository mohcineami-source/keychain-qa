"use client";

import { Fragment } from "react";
import { CarFront, ClipboardCheck, Wrench, Truck, ChevronLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Step {
  icon: LucideIcon;
  number: number;
  title: string;
}

const steps: Step[] = [
  { icon: CarFront,       number: 1, title: "اختار ستايل اللوحة" },
  { icon: ClipboardCheck, number: 2, title: "سجّل طلبك"           },
  { icon: Wrench,         number: 3, title: "نجهزها لك"           },
  { icon: Truck,          number: 4, title: "نوصلها لين عندك"     },
];

export function HowItWorks() {
  return (
    <section className="rounded-2xl bg-[#FAF7F5] px-5 py-7 sm:px-7">
      <h2 className="text-section-title mb-7 text-center">
        كيف نشتغل؟
      </h2>

      {/* Mobile: vertical stack | Desktop: horizontal row with connectors */}
      <ol className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-0">
        {steps.map(({ icon: Icon, number, title }, i) => (
          <Fragment key={number}>
            <li className="flex-1">
              <div
                className="
                  group relative flex h-full flex-col items-center gap-3
                  rounded-xl border border-[#E8E2DD] bg-white
                  px-4 py-5 text-center
                  shadow-[0_1px_2px_rgba(138,21,56,0.04),0_3px_12px_rgba(23,23,23,0.04)]
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:border-maroon/20
                  hover:shadow-[0_2px_8px_rgba(138,21,56,0.10),0_6px_20px_rgba(23,23,23,0.06)]
                "
              >
                {/* Number badge — top-right (RTL start corner) */}
                <span
                  className="
                    absolute right-3 top-3
                    flex h-[18px] min-w-[18px] items-center justify-center
                    rounded-full bg-maroon px-1
                    text-[9px] font-black tracking-wide text-white
                  "
                >
                  {number}
                </span>

                {/* Icon */}
                <span
                  className="
                    flex h-16 w-16 items-center justify-center
                    rounded-full
                    bg-[#F6EBF0]
                    ring-1 ring-maroon/20
                    transition-colors duration-200
                    group-hover:bg-[#F0DDE6]
                    group-hover:ring-maroon/35
                  "
                >
                  <Icon
                    className="h-[30px] w-[30px] text-maroon"
                    strokeWidth={1.75}
                  />
                </span>

                {/* Label */}
                <p className="text-card-title leading-snug">
                  {title}
                </p>
              </div>
            </li>

            {/* Connector — desktop only, between cards */}
            {i < steps.length - 1 && (
              <li
                aria-hidden
                className="hidden shrink-0 items-center justify-center sm:flex"
                style={{ width: "28px" }}
              >
                <ChevronLeft
                  className="h-4 w-4 text-maroon/30"
                  strokeWidth={2.5}
                />
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </section>
  );
}
