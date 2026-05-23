"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const slides = [
  { src: "/slides/hero-slide-1.png", alt: "صورة ميدالية رقم السيارة 1" },
  { src: "/slides/hero-slide-2.png", alt: "صورة ميدالية رقم السيارة 2" },
  { src: "/slides/hero-slide-3.png", alt: "صورة ميدالية رقم السيارة 3" },
  { src: "/slides/hero-slide-4.png", alt: "صورة ميدالية رقم السيارة 4" },
];

const AUTOPLAY_MS = 4500;
const SWIPE_THRESHOLD = 40; // px

export function ProductSlider() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback((index: number) => {
    const wrapped = ((index % slides.length) + slides.length) % slides.length;
    setActive(wrapped);
  }, []);

  const next = useCallback(() => {
    setActive((a) => (a + 1) % slides.length);
  }, []);
  const prev = useCallback(() => {
    setActive((a) => (a - 1 + slides.length) % slides.length);
  }, []);

  /* ── Autoplay — restarts on every slide change (manual or auto) ── */
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(next, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [active, paused, next]);

  /* ── Keyboard nav (RTL: Left = next, Right = prev) ── */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      prev();
    }
  };

  /* ── Touch swipe (mobile) ── */
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      // RTL: swipe left (delta<0) = next, swipe right (delta>0) = prev
      delta < 0 ? next() : prev();
    }
    touchStartX.current = null;
  };

  const arrowClasses =
    "absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center " +
    "rounded-full border border-[#ECE7E3] bg-white/85 backdrop-blur-md text-maroon " +
    "shadow-[0_2px_8px_rgba(23,23,23,0.08)] " +
    "opacity-90 sm:opacity-0 sm:group-hover:opacity-100 " +
    "transition-all duration-200 ease-out " +
    "hover:scale-105 hover:bg-white hover:shadow-[0_3px_12px_rgba(23,23,23,0.12)] " +
    "active:scale-95";

  return (
    <div className="w-full">
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="معرض صور المنتج"
        tabIndex={0}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onKeyDown={onKeyDown}
        className="
          group relative aspect-[4/3] w-full overflow-hidden
          rounded-2xl border border-[#ECE7E3] bg-[#FBF9F7]
          shadow-[0_1px_2px_rgba(23,23,23,0.04),0_8px_28px_rgba(23,23,23,0.06)]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon/30
        "
      >
        {/* Slides */}
        {slides.map((slide, i) => (
          <Image
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            fill
            priority={i === 0}
            sizes="(max-width: 768px) 100vw, 700px"
            aria-hidden={i !== active}
            className={cn(
              "object-contain transition-opacity duration-[700ms] ease-out",
              i === active ? "opacity-100" : "opacity-0"
            )}
          />
        ))}

        {/* Previous (physically right side in RTL) */}
        <button
          type="button"
          onClick={prev}
          aria-label="الصورة السابقة"
          className={cn(arrowClasses, "right-3")}
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
        </button>

        {/* Next (physically left side in RTL) */}
        <button
          type="button"
          onClick={next}
          aria-label="الصورة التالية"
          className={cn(arrowClasses, "left-3")}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </div>

      {/* Indicator dots */}
      <div
        className="mt-5 flex items-center justify-center gap-2"
        role="tablist"
        aria-label="مؤشرات الصور"
      >
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`الصورة ${i + 1} من ${slides.length}`}
            onClick={() => goTo(i)}
            className={cn(
              "h-2 rounded-full transition-all duration-300 ease-out",
              i === active
                ? "w-7 bg-maroon"
                : "w-2 bg-[#D8D2CC] hover:bg-[#B8B1AA]"
            )}
          />
        ))}
      </div>
    </div>
  );
}
