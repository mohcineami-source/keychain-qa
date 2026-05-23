"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlateStyle } from "@/data/plateStyles";

interface PlateStyleCardProps {
  style: PlateStyle;
  selected: boolean;
  onSelect: () => void;
}

export function PlateStyleCard({
  style,
  selected,
  onSelect,
}: PlateStyleCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border bg-white text-right shadow-soft transition-all duration-200",
        selected
          ? "border-maroon ring-2 ring-maroon/30"
          : "border-warmgray hover:border-maroon/50"
      )}
    >
      {selected ? (
        <span className="absolute end-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-maroon text-white shadow">
          <Check className="h-4 w-4" />
        </span>
      ) : null}

      <div className="relative aspect-[3/2] w-full overflow-hidden bg-soft">
        <Image
          src={style.image}
          alt={`صورة ${style.titleAr}`}
          fill
          sizes="(max-width: 640px) 50vw, 240px"
          className="object-contain p-2"
        />
      </div>

      <div className="p-3 text-center">
        <span className="text-sm font-bold text-charcoal">
          {style.titleAr}
        </span>
      </div>
    </button>
  );
}
