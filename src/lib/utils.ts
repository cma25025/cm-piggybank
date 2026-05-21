import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format integer cents as a localized currency string. */
export function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/** First displayable codepoint of a name, uppercase. Handles emoji prefixes. */
export function initial(name: string): string {
  const cp = Array.from(name)[0];
  return (cp ?? "?").toUpperCase();
}
