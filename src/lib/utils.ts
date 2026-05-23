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

/**
 * Escape a string for safe use in a Postgres LIKE / ILIKE pattern.
 * Names like "100% Grandma" or "Auntie_M" would otherwise false-positive
 * because `%` and `_` are wildcards. Salvaged from divergent branch
 * Phase 6.5 (commit 6fbd20e).
 */
export function escapeLike(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
