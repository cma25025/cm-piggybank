/**
 * Shared emoji helper for activity rows. Salvaged from the divergent
 * `claude/review-next-session-md-0EPfc` branch (commit ec74028); replaces
 * duplicate inline `pickEmoji()` definitions in `recent-activity.tsx` and
 * `activity/page.tsx`.
 *
 * Precedence: subcategory emoji wins (caretaker-chosen, most specific) → then
 * per-kind defaults, with adjustment-as-reconciliation routed to ⚖️ via
 * note prefix match (case-insensitive).
 */

const SOURCE_EMOJI: Record<string, string> = {
  allowance: "💵",
  birthday: "🎁",
  chores: "🧹",
  gift: "🎀",
  other: "💵",
};

export interface EmojiInput {
  kind: string;
  subEmoji?: string | null;
  sourceType?: string | null;
  note?: string | null;
}

export function pickActivityEmoji(r: EmojiInput): string {
  if (r.subEmoji) return r.subEmoji;
  if (r.kind === "deposit") return SOURCE_EMOJI[r.sourceType ?? "other"] ?? "💵";
  if (r.kind === "spend") return "🛒";
  if (r.kind === "interest") return "📈";
  if (r.kind === "adjustment") {
    if (r.note && /^Reconciled:/i.test(r.note)) return "⚖️";
    return "🔧";
  }
  if (r.kind === "opening_balance") return "🏦";
  return "·";
}
