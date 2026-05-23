-- ============================================================================
-- Spend UX revamp: log_spend signature rewrite — bucket-first, sub optional
-- ============================================================================
-- Salvaged from divergent branch commit a5bc04e.
--
-- Product clarification: a subcategory is a goal / sub-budget the caretaker
-- SETS, not a partition of the bucket total. Spending should gate on the
-- bucket's balance (the actual cash available), and the subcategory is an
-- optional label on the transaction row for tracking goals.
--
-- The old log_spend(p_subcategory_id, ...) required a subcategory and gated
-- on sub.balance_cents. That blocked spending from a bucket that had no
-- subs yet, and gated the wrong balance.
--
-- The new log_spend(p_bucket_id, p_subcategory_id NULL, ...) locks the
-- bucket FOR UPDATE, checks bucket.balance_cents, and inserts a transaction
-- carrying both ids (sub may be null). The Phase 1 balance trigger already
-- handles the subcategory side correctly: it decrements sub.balance_cents
-- when subcategory_id is set and leaves it untouched when null. Sub balance
-- CAN go negative this way — that's intentional. The bucket is the budget;
-- the sub is the tracker. See docs/DISCOVERY-ROADMAP.md decision context.
-- ============================================================================

drop function if exists public.log_spend(uuid, int, text, timestamptz);

create or replace function public.log_spend(
  p_bucket_id uuid,
  p_subcategory_id uuid default null,
  p_amount_cents int default null,
  p_note text default null,
  p_occurred_at timestamptz default null
) returns uuid
language plpgsql
security invoker
as $$
declare
  v_caretaker uuid := auth.uid();
  v_bucket record;
  v_sub record;
  v_txn_id uuid;
begin
  if v_caretaker is null then
    raise exception 'log_spend: not authenticated' using errcode = '28000';
  end if;
  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'log_spend: amount must be > 0, got %', p_amount_cents
      using errcode = '22023';
  end if;

  -- Lock the bucket row for the duration of the enclosing function call.
  -- Concurrent log_spend calls on the same bucket serialize here so the
  -- second caller sees the post-decrement balance via the trigger.
  select id, kind, piggybank_id, balance_cents
    into v_bucket
    from public.bucket
    where id = p_bucket_id
    for update;

  if not found then
    raise exception 'log_spend: bucket % not found', p_bucket_id
      using errcode = 'P0002';
  end if;
  if v_bucket.balance_cents < p_amount_cents then
    raise exception
      'log_spend: insufficient balance in % bucket — has % cents, tried to spend % cents',
      v_bucket.kind, v_bucket.balance_cents, p_amount_cents
      using errcode = '22023';
  end if;

  -- Optional sub. Must belong to the same bucket and not be archived.
  if p_subcategory_id is not null then
    select id, display_name, bucket_id, archived_at
      into v_sub
      from public.subcategory
      where id = p_subcategory_id;
    if not found then
      raise exception 'log_spend: subcategory % not found', p_subcategory_id
        using errcode = 'P0002';
    end if;
    if v_sub.bucket_id <> p_bucket_id then
      raise exception 'log_spend: subcategory % does not belong to bucket %',
        p_subcategory_id, p_bucket_id
        using errcode = '22023';
    end if;
    if v_sub.archived_at is not null then
      raise exception 'log_spend: subcategory "%" is archived', v_sub.display_name
        using errcode = '22023';
    end if;
  end if;

  insert into public.transaction (
    piggybank_id, kind, amount_cents, bucket_id, subcategory_id, note, occurred_at
  ) values (
    v_bucket.piggybank_id,
    'spend',
    p_amount_cents,
    p_bucket_id,
    p_subcategory_id,
    p_note,
    coalesce(p_occurred_at, now())
  ) returning id into v_txn_id;

  return v_txn_id;
end;
$$;

grant execute on function public.log_spend(uuid, uuid, int, text, timestamptz) to authenticated;
