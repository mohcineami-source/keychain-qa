import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button — premium Cairo-driven CTAs.
 *
 * Critical alignment rules baked into the base:
 *  - flex + items-center + justify-center  → no baseline drift in Arabic
 *  - leading-none + .text-button (line-height:1) → no vertical floating
 *  - fixed heights per size → text always optically centered
 */
const buttonVariants = cva(
  "text-button leading-none inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] select-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: [
          "bg-gradient-to-b from-[#9E1A40] to-[#8A1538] text-white",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_3px_12px_rgba(138,21,56,0.22),0_1px_3px_rgba(138,21,56,0.12)]",
          "hover:from-[#8A1538] hover:to-[#6B1030]",
          "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_5px_18px_rgba(138,21,56,0.30),0_2px_5px_rgba(138,21,56,0.15)]",
          "active:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_8px_rgba(138,21,56,0.18)]",
        ],
        outline:
          "border border-warmgray bg-white text-charcoal hover:border-maroon/40 hover:text-maroon hover:shadow-[0_2px_8px_rgba(138,21,56,0.08)]",
        ghost:
          "text-charcoal hover:bg-warmgray/50",
        secondary:
          "bg-warmgray text-charcoal hover:bg-warmgray/80",
        link:
          "text-maroon underline-offset-4 hover:underline shadow-none",
      },
      size: {
        // text-base on these is overridden by .text-button (16px / 700 / lh-1)
        default: "h-11 px-6",
        sm:      "h-10 px-4 text-[0.875rem]",
        lg:      "h-12 px-8 text-[1.0625rem]",
        // Primary CTA: 48px mobile / 56px desktop, generous side padding
        full:    "h-12 w-full px-8 sm:h-14",
        icon:    "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
