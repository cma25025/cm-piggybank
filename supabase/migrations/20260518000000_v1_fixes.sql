-- ============================================================================
-- v1 fixes — addresses Phase 1 audit P0 findings
-- ============================================================================
-- 1. void_transaction NULL check used wrong PL/pgSQL pattern (record vs row).
-- 2. void_transaction was not idempotent — re-voiding corrupted balances.
-- 3. No cross-table integrity check: subcategory.bucket_id and
--    transaction.{bucket,subcategory,funder}_id could reference rows from
--    DIFFERENT piggybanks than the parent row claimed.
-- 4. transaction had no UPDATE policy; void_transaction now needs to flip
--    voided_at on the original, so a scoped policy is required.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- Fix #2: void idempotency tracking
-- ────────────────────────────────────────────────────────────────────────────
alter table public.transaction
  add column if not exists voided_at timestamptz,
  add column if not exists voided_by_user_id uuid references auth.users(id);

create index if not exists transaction_voided_at_idx
  on public.transaction(voided_at)
  where voided_at is not null;

-- ────────────────────────────────────────────────────────────────────────────
-- Fix #3: cross-table consistency triggers
-- ────────────────────────────────────────────────────────────────────────────

create or replace function public.validate_subcategory_consistency()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bucket_piggybank uuid;
begin
  select piggybank_id into v_bucket_piggybank
    from public.bucket where id = new.bucket_id;
  if v_bucket_piggybank is null then
    raise exception 'subcategory: bucket % does not exist', new.bucket_id;
  end if;
  if v_bucket_piggybank <> new.piggybank_id then
    raise exception 'subcategory.piggybank_id (%) must match bucket.piggybank_id (%)',
      new.piggybank_id, v_bucket_piggybank;
  end if;
  return new;
end;
$$;

drop trigger if exists _b_validate_consistency on public.subcategory;
create trigger _b_validate_consistency before insert or update on public.subcategory
  for each row execute function public.validate_subcategory_consistency();

create or replace function public.validate_transaction_consistency()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pb uuid;
begin
  if new.bucket_id is not null then
    select piggybank_id into v_pb from public.bucket where id = new.bucket_id;
    if v_pb is null then
      raise exception 'transaction: bucket % does not exist', new.bucket_id;
    end if;
    if v_pb <> new.piggybank_id then
      raise exception 'transaction.piggybank_id (%) must match bucket.piggybank_id (%)',
        new.piggybank_id, v_pb;
    end if;
  end if;
  if new.subcategory_id is not null then
    select piggybank_id into v_pb from public.subcategory where id = new.subcategory_id;
    if v_pb is null then
      raise exception 'transaction: subcategory % does not exist', new.subcategory_id;
    end if;
    if v_pb <> new.piggybank_id then
      raise exception 'transaction.piggybank_id (%) must match subcategory.piggybank_id (%)',
        new.piggybank_id, v_pb;
    end if;
  end if;
  if new.funder_id is not null then
    select piggybank_id into v_pb from public.funder where id = new.funder_id;
    if v_pb is null then
      raise exception 'transaction: funder % does not exist', new.funder_id;
    end if;
    if v_pb <> new.piggybank_id then
      raise exception 'transaction.piggybank_id (%) must match funder.piggybank_id (%)',
        new.piggybank_id, v_pb;
    end if;
  end if;
  if new.parent_id is not null then
    select piggybank_id into v_pb from public.transaction where id = new.parent_id;
    if v_pb is null then
      raise exception 'transaction: parent % does not exist', new.parent_id;
    end if;
    if v_pb <> new.piggybank_id then
      raise exception 'transaction.piggybank_id (%) must match parent.piggybank_id (%)',
        new.piggybank_id, v_pb;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists _b_validate_consistency on public.transaction;
create trigger _b_validate_consistency before insert or update on public.transaction
  for each row execute function public.validate_transaction_consistency();

-- ────────────────────────────────────────────────────────────────────────────
-- Fix #4: UPDATE policy on transaction (scoped to caretaker, for void marker)
-- ────────────────────────────────────────────────────────────────────────────
-- v1 UI doesn't expose general edit; void_transaction is the only writer. The
-- consistency trigger above prevents semantic violations regardless.
drop policy if exists "caretaker update transaction" on public.transaction;
create policy "caretaker update transaction" on public.transaction
  for update using (caretaker_user_id = auth.uid()) with check (caretaker_user_id = auth.uid());

-- ────────────────────────────────────────────────────────────────────────────
-- Fix #1 + #2: rewrite void_transaction with NOT FOUND check and idempotency
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.void_transaction(
  p_transaction_id uuid,
  p_reason text default 'caretaker void'
) returns int  -- count of adjustment rows written
language plpgsql
security invoker
as $$
declare
  v_orig record;
  v_child record;
  v_count int := 0;
begin
  select * into v_orig from public.transaction where id = p_transaction_id;
  if not found then
    raise exception 'void_transaction: transaction % not found', p_transaction_id;
  end if;

  if v_orig.kind = 'adjustment' then
    raise exception 'void_transaction: cannot void an adjustment (id=%)', p_transaction_id;
  end if;

  if v_orig.voided_at is not null then
    raise exception 'void_transaction: transaction % already voided at %',
      p_transaction_id, v_orig.voided_at;
  end if;

  -- Parent deposit: write one reversing adjustment per child + mark children voided
  if v_orig.kind = 'deposit' and v_orig.parent_id is null then
    for v_child in
      select * from public.transaction where parent_id = p_transaction_id
    loop
      if v_child.voided_at is null then
        insert into public.transaction (
          piggybank_id, kind, amount_cents, bucket_id, subcategory_id, note
        ) values (
          v_child.piggybank_id,
          'adjustment',
          -public.signed_amount(v_child.kind, v_child.amount_cents),
          v_child.bucket_id,
          v_child.subcategory_id,
          format('Voided deposit %s: %s', p_transaction_id, p_reason)
        );
        v_count := v_count + 1;
      end if;
    end loop;
    update public.transaction
      set voided_at = now(), voided_by_user_id = auth.uid()
      where parent_id = p_transaction_id and voided_at is null;
    update public.transaction
      set voided_at = now(), voided_by_user_id = auth.uid()
      where id = p_transaction_id;
    return v_count;
  end if;

  -- Single-row kinds
  insert into public.transaction (
    piggybank_id, kind, amount_cents, bucket_id, subcategory_id, note
  ) values (
    v_orig.piggybank_id,
    'adjustment',
    -public.signed_amount(v_orig.kind, v_orig.amount_cents),
    v_orig.bucket_id,
    v_orig.subcategory_id,
    format('Voided %s: %s', p_transaction_id, p_reason)
  );
  update public.transaction
    set voided_at = now(), voided_by_user_id = auth.uid()
    where id = p_transaction_id;
  return 1;
end;
$$;

grant execute on function public.void_transaction(uuid, text) to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- Optional cleanup: COPPA check at data layer (audit P2)
-- ────────────────────────────────────────────────────────────────────────────
-- Reject linking an owner_user_id to a kid_profile with age < 13 until COPPA
-- consent is on file. v1 has no owner UI so this never trips today, but the
-- check exists when v2 turns on owner auth.
alter table public.kid_profile
  drop constraint if exists kid_profile_coppa_check;
alter table public.kid_profile
  add constraint kid_profile_coppa_check check (
    owner_user_id is null
    or age >= 13
    or (features_json ->> 'coppa_consent_at') is not null
  );
