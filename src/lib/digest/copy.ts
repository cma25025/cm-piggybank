/**
 * Warm, kid-friendly digest copy. Selected from templates based on the
 * week's net change. Aim: dinner-table tone, not finance-report tone.
 */

const POSITIVE_BIG = [
  "Big week, {name}! You grew the piggybank by {delta}.",
  "{name}, what a week — {delta} added.",
  "Strong week for the piggybank. +{delta}.",
];
const POSITIVE_SMALL = [
  "Steady week — {delta} in.",
  "Quiet growth this week: {delta}.",
  "A little plus this week: {delta}.",
];
const ZERO = [
  "Held steady this week.",
  "No change — and that's okay.",
  "A quiet week.",
];
const NEGATIVE = [
  "{name} spent {delta} this week — what did you get?",
  "Money out this week: {delta}. The piggybank is for using too.",
  "{delta} out. The jar made some choices possible.",
];

export function pickHeadline(deltaCents: number, kidName: string): string {
  let pool: string[];
  if (deltaCents === 0) pool = ZERO;
  else if (deltaCents < 0) pool = NEGATIVE;
  else if (deltaCents >= 2000) pool = POSITIVE_BIG;
  else pool = POSITIVE_SMALL;

  // Deterministic pick keyed off deltaCents so the same week renders the
  // same copy on re-render (no flicker on refresh).
  const idx = Math.abs(deltaCents) % pool.length;
  return pool[idx]
    .replace("{name}", kidName)
    .replace("{delta}", formatDollarSign(deltaCents));
}

function formatDollarSign(cents: number): string {
  const abs = Math.abs(cents);
  const dollars = (abs / 100).toFixed(2);
  return `$${dollars}`;
}
