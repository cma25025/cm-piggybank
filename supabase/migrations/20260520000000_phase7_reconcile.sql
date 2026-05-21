-- ============================================================================
-- Phase 7: relax amount_sign_rules CHECK so zero-diff reconciliations record
-- ============================================================================
-- Caretaker reconciles "the jar matches the app" — diff is zero. We still
-- want to record the event so the next nudge is suppressed for 7 days. The
-- original CHECK forced `kind='adjustment' AND amount_cents <> 0`; relaxing
-- to `<> NULL` lets us write a zero-amount adjustment. The maintain_balances
-- trigger naturally no-ops when delta = 0.
-- ============================================================================

alter table public.transaction
  drop constraint if exists amount_sign_rules;

alter table public.transaction
  add constraint amount_sign_rules check (
    (kind = 'deposit'         and amount_cents > 0) or
    (kind = 'spend'           and amount_cents > 0) or
    (kind = 'interest'        and amount_cents > 0) or
    (kind = 'opening_balance' and amount_cents >= 0) or
    (kind = 'transfer'        and amount_cents <> 0) or
    (kind = 'adjustment'      and amount_cents is not null)
  );
