import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "text-form-input flex h-12 w-full rounded-md border border-warmgray bg-white px-4 py-2 shadow-soft transition-colors placeholder:font-normal placeholder:text-muted/70 focus-visible:outline-none focus-visible:border-maroon focus-visible:ring-2 focus-visible:ring-maroon/20 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
