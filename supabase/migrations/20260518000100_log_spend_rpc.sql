-- ============================================================================
-- Phase 5 hotfix: log_spend RPC with SELECT FOR UPDATE
-- ============================================================================
-- The Phase 5 server-action implementation did SELECT balance → check →
-- INSERT outside a transaction with no row lock. Two concurrent spend
-- submissions from the same sub with balance just covering one could both
-- pass the check and oversubtract. v1 plan §5 Phase 5 mandated this RPC
-- pattern — shipping it as a hotfix before any beta caretaker can hit the
-- race.
-- ============================================================================

create or replace function public.log_spend(
  p_subcategory_id uuid,
  p_amount_cents int,
  p_note text default null,
  p_occurred_at timestamptz default null
) returns uuid
language plpgsql
security invoker
as $$
declare
  v_caretaker uuid := auth.uid();
  v_sub record;
  v_txn_id uuid;
begin
  if v_caretaker is null then
    raise exception 'log_spend: not authenticated' using errcode = '28000';
  end if;
  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'log_spend: amount must be > 0, got %', p_amount_cents
      using errcode = '22023'; -- invalid_parameter_value
  end if;

  -- FOR UPDATE locks this subcategory row for the rest of the enclosing
  -- transaction. Concurrent log_spend calls on the same sub serialize here
  -- and the second caller sees the post-decrement balance via the trigger.
  select id, display_name, bucket_id, piggybank_id, balance_cents, archived_at
    into v_sub
    from public.subcategory
    where id = p_subcategory_id
    for update;

  if not found then
    raise exception 'log_spend: subcategory % not found', p_subcategory_id
      using errcode = 'P0002'; -- no_data_found
  end if;
  if v_sub.archived_at is not null then
    raise exception 'log_spend: subcategory "%" is archived', v_sub.display_name
      using errcode = '22023';
  end if;
  if v_sub.balance_cents < p_amount_cents then
    raise exception
      'log_spend: insufficient balance in "%" — has % cents, tried to spend % cents',
      v_sub.display_name, v_sub.balance_cents, p_amount_cents
      using errcode = '22023';
  end if;

  insert into public.transaction (
    piggybank_id, kind, amount_cents, bucket_id, subcategory_id, note, occurred_at
  ) values (
    v_sub.piggybank_id,
    'spend',
    p_amount_cents,
    v_sub.bucket_id,
    v_sub.id,
    p_note,
    coalesce(p_occurred_at, now())
  ) returning id into v_txn_id;

  return v_txn_id;
end;
$$;

grant execute on function public.log_spend(uuid, int, text, timestamptz) to authenticated;
