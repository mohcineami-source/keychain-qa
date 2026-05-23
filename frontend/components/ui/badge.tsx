import * as React from "react";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  default: "bg-maroon/10 text-maroon",
  success: "bg-success/10 text-success",
  muted: "bg-warmgray text-muted",
  warning: "bg-amber-100 text-amber-700",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof styles;
}

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        styles[tone],
        className
      )}
      {...props}
    />
  );
}
