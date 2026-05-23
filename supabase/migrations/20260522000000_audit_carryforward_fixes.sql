-- ============================================================================
-- Audit carry-forward fixes — salvaged from divergent branch commit 6fbd20e
-- ============================================================================
-- Two real bugs from the parallel Phase 6 audit. Both affect data shown
-- to caretakers — fixing now before more beta users land.
--
-- 1. v_funder_stats counts voided deposits.
--    The view's LEFT JOIN filters parent_id IS NULL and kind='deposit' but
--    not voided_at IS NULL. Voided parents inflate total_contributed_cents
--    and deposit_count, so /funders + /funders/[id] disagree with
--    FunderWidget (which already filtered voided at the query layer).
--    Fix: add voided_at IS NULL to the JOIN.
--
-- 2. find_or_create_funder silently drops relationship on existing-funder hits.
--    The add-funder dialog has a relationship input. A caretaker who adds
--    "Grandma" then re-adds "Grandma" with "mom's mom" sees no update.
--    Fix: backfill relationship only when the existing row's value is NULL.
--    Never overwrite a non-null relationship — funder-edit dialog is the
--    canonical place for that.
-- ============================================================================

-- Fix 1: voided filter on funder stats view
drop view if exists public.v_funder_stats;
create view public.v_funder_stats
with (security_invoker = true) as
select
  f.id                                              as funder_id,
  f.piggybank_id,
  f.caretaker_user_id,
  f.display_name,
  f.relationship,
  f.archived_at,
  coalesce(sum(t.amount_cents)::bigint, 0)          as total_contributed_cents,
  count(t.id)::int                                  as deposit_count,
  max(t.occurred_at)                                as last_contribution_at
from public.funder f
left join public.transaction t
  on t.funder_id = f.id
  and t.kind = 'deposit'
  and t.parent_id is null
  and t.voided_at is null
group by f.id, f.piggybank_id, f.caretaker_user_id, f.display_name, f.relationship, f.archived_at;

-- Fix 2: relationship backfill in find_or_create_funder
-- (Preserves Phase 6/funder_trim's input trim + non-empty guard.)
create or replace function public.find_or_create_funder(
  p_piggybank_id uuid,
  p_display_name text,
  p_relationship text default null
) returns uuid
language plpgsql
security invoker
as $$
declare
  v_name text := trim(p_display_name);
  v_relationship text := nullif(trim(coalesce(p_relationship, '')), '');
  v_funder_id uuid;
  v_existing_relationship text;
begin
  if v_name is null or length(v_name) = 0 then
    raise exception 'find_or_create_funder: display_name cannot be empty'
      using errcode = '22023';
  end if;

  -- Try existing (case-insensitive, non-archived). Read relationship too.
  select id, relationship
    into v_funder_id, v_existing_relationship
    from public.funder
    where piggybank_id = p_piggybank_id
      and lower(display_name) = lower(v_name)
      and archived_at is null;
  if v_funder_id is not null then
    -- Backfill ONLY when existing is NULL. Never overwrite non-null.
    if v_existing_relationship is null and v_relationship is not null then
      update public.funder set relationship = v_relationship where id = v_funder_id;
    end if;
    return v_funder_id;
  end if;

  -- Insert; partial unique index handles concurrent inserts.
  begin
    insert into public.funder (piggybank_id, display_name, relationship)
      values (p_piggybank_id, v_name, v_relationship)
      returning id into v_funder_id;
  exception when unique_violation then
    select id into v_funder_id
      from public.funder
      where piggybank_id = p_piggybank_id
        and lower(display_name) = lower(v_name)
        and archived_at is null;
  end;

  return v_funder_id;
end;
$$;
