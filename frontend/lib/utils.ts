import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a number as Qatari Riyal amount (digits only, currency word added by caller). */
export function formatAmount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
