export interface ComingSoonFeature {
  slug: string;
  label: string;
  emoji: string;
  description: string;
  targetVersion: string;
}

/** Single source of truth for sidebar "coming soon" items. */
export const COMING_SOON: Record<string, ComingSoonFeature> = {
  apr: {
    slug: "apr",
    label: "Save APR",
    emoji: "📈",
    description:
      "Earn interest on Save goals. Caretaker-funded, deterministic, teaches compounding.",
    targetVersion: "v1.1",
  },
  statements: {
    slug: "statements",
    label: "Statements",
    emoji: "📰",
    description:
      "Monthly and annual summaries beyond the weekly Sunday digest — exportable for taxes or just because.",
    targetVersion: "v1.1",
  },
  "auto-allocation": {
    slug: "auto-allocation",
    label: "Auto-allocation rules",
    emoji: "⚙️",
    description:
      "Per-funder or per-source split overrides (e.g. birthday money goes 100% to Save).",
    targetVersion: "v1.1",
  },
};
