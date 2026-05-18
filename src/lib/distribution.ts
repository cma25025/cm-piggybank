/**
 * Money distribution math.
 *
 * Distributes an integer-cent amount across the three buckets according to
 * a basis-points rule. Floor-first-two, share gets the remainder cents.
 *
 * Pro-charity bias is intentional (CEO review §7): any rounding crumbs end
 * up in Share. Documented here so a future contributor doesn't "fix" it.
 */

export interface DistributionRule {
  spend_bps: number;
  save_bps: number;
  share_bps: number;
}

export interface Distribution {
  spend_cents: number;
  save_cents: number;
  share_cents: number;
}

const TOTAL_BPS = 10_000;

export function computeDistribution(amount_cents: number, rule: DistributionRule): Distribution {
  if (!Number.isFinite(amount_cents) || !Number.isInteger(amount_cents)) {
    throw new Error(`amount_cents must be a finite integer, got ${amount_cents}`);
  }
  // Zero is rejected: a $0 "deposit" is nonsense and would slip through balance
  // math silently. Negative deposits are rejected at the data-model boundary.
  if (amount_cents <= 0) {
    throw new Error(`amount_cents must be > 0, got ${amount_cents}`);
  }
  const { spend_bps, save_bps, share_bps } = rule;
  if (
    !Number.isInteger(spend_bps) ||
    !Number.isInteger(save_bps) ||
    !Number.isInteger(share_bps) ||
    spend_bps < 0 ||
    save_bps < 0 ||
    share_bps < 0
  ) {
    throw new Error(
      `rule bps must be non-negative integers, got ${JSON.stringify(rule)}`,
    );
  }
  if (spend_bps + save_bps + share_bps !== TOTAL_BPS) {
    throw new Error(
      `rule bps must sum to ${TOTAL_BPS}, got ${spend_bps + save_bps + share_bps}`,
    );
  }

  const spend_cents = Math.floor((amount_cents * spend_bps) / TOTAL_BPS);
  const save_cents = Math.floor((amount_cents * save_bps) / TOTAL_BPS);
  // Share gets the remainder so the sum invariant always holds (pro-charity).
  const share_cents = amount_cents - spend_cents - save_cents;

  return { spend_cents, save_cents, share_cents };
}
