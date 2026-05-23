-- ============================================================================
-- soft_delete_piggybank: SECURITY DEFINER fix
-- ============================================================================
-- Bug caught by the integration test harness (rls.test.ts "soft-deleted
-- piggybank hidden..."):
--
-- The piggybank SELECT policy is `caretaker_user_id = auth.uid() AND
-- deleted_at IS NULL`. When soft_delete_piggybank UPDATEs a row to set
-- deleted_at = now(), the new row no longer satisfies the SELECT policy.
-- Postgres treats this as a WITH CHECK violation on the UPDATE — even
-- though our explicit UPDATE policy WITH CHECK only requires
-- caretaker_user_id = auth.uid() (which still passes).
--
-- The implicit interaction is: an UPDATE that would produce a row the
-- caller can no longer SELECT is rejected with "new row violates
-- row-level security policy". This is Postgres-by-design but
-- documentation is buried.
--
-- Fix: mark soft_delete_piggybank SECURITY DEFINER + empty search_path
-- (same pattern as propagate_caretaker_user_id from Phase 1). Explicitly
-- gate on caretaker ownership inside the function so we don't lose RLS
-- protection. Add deleted_at IS NULL guard for idempotency.
--
-- Also restore the SELECT policy — diagnostic during debugging
-- temporarily dropped the deleted_at clause to confirm the hypothesis.
-- ============================================================================

-- Restore SELECT policy (no-op if already correct; diagnostic drop is reverted).
drop policy if exists "caretaker select piggybank" on public.piggybank;
create policy "caretaker select piggybank" on public.piggybank
  for select using (caretaker_user_id = auth.uid() and deleted_at is null);

create or replace function public.soft_delete_piggybank(p_piggybank_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caretaker uuid := auth.uid();
begin
  if v_caretaker is null then
    raise exception 'soft_delete_piggybank: not authenticated'
      using errcode = '28000';
  end if;

  -- Explicit ownership gate — bypasses RLS but enforces the same check.
  -- Also gate on already-not-deleted for idempotency.
  update public.piggybank
    set deleted_at = now()
    where id = p_piggybank_id
      and caretaker_user_id = v_caretaker
      and deleted_at is null;

  if not found then
    raise exception 'soft_delete_piggybank: piggybank % not found or already deleted',
      p_piggybank_id
      using errcode = 'P0002';
  end if;
end;
$$;

grant execute on function public.soft_delete_piggybank(uuid) to authenticated;
