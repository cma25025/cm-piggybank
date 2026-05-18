-- ============================================================================
-- Phase 5 re-audit P1: void reversal rows are orphan in activity log
-- ============================================================================
-- Phase 4.5 hid deposit-children (parent_id IS NOT NULL) from the default
-- activity view. void_transaction then writes NEW adjustment rows with
-- parent_id NULL, so caretakers see 3 mystery "Voided deposit X: reason"
-- rows after voiding a parent deposit.
--
-- Fix: add reversed_transaction_id pointing to the row being reversed. The
-- activity page filter hides any row that's a reversal. Voided rows remain
-- visible (with strikethrough + "Voided" badge) so the user sees what
-- happened; the reversing entries are book-keeping the trigger needs but
-- not the user.
-- ============================================================================

alter table public.transaction
  add column if not exists reversed_transaction_id uuid
    references public.transaction(id) on delete cascade;

create index if not exists transaction_reversed_idx
  on public.transaction(reversed_transaction_id)
  where reversed_transaction_id is not null;

-- ────────────────────────────────────────────────────────────────────────────
-- Rewrite void_transaction to stamp the lineage. Same idempotency + parent
-- vs single-row semantics from Phase 1.5; just adds reversed_transaction_id.
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

  -- Parent deposit: write one reversing adjustment per child, link via
  -- reversed_transaction_id, and mark all four rows voided.
  if v_orig.kind = 'deposit' and v_orig.parent_id is null then
    for v_child in
      select * from public.transaction where parent_id = p_transaction_id
    loop
      if v_child.voided_at is null then
        insert into public.transaction (
          piggybank_id, kind, amount_cents, bucket_id, subcategory_id, note,
          reversed_transaction_id
        ) values (
          v_child.piggybank_id,
          'adjustment',
          -public.signed_amount(v_child.kind, v_child.amount_cents),
          v_child.bucket_id,
          v_child.subcategory_id,
          format('Voided deposit %s: %s', p_transaction_id, p_reason),
          v_child.id
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

  -- Single-row kinds (spend / interest / opening_balance / child deposit)
  insert into public.transaction (
    piggybank_id, kind, amount_cents, bucket_id, subcategory_id, note,
    reversed_transaction_id
  ) values (
    v_orig.piggybank_id,
    'adjustment',
    -public.signed_amount(v_orig.kind, v_orig.amount_cents),
    v_orig.bucket_id,
    v_orig.subcategory_id,
    format('Voided %s: %s', p_transaction_id, p_reason),
    v_orig.id
  );
  update public.transaction
    set voided_at = now(), voided_by_user_id = auth.uid()
    where id = p_transaction_id;
  return 1;
end;
$$;

grant execute on function public.void_transaction(uuid, text) to authenticated;
