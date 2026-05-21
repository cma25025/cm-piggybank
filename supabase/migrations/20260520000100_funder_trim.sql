-- ============================================================================
-- Phase 6 audit P1: find_or_create_funder must trim display_name
-- ============================================================================
-- App code already trims via Zod, but any future caller (admin script, raw
-- SQL, third-party integration) could pass "Grandma " with trailing space.
-- The partial unique index uses lower() not trim(lower()), so "Grandma" and
-- "Grandma " would coexist. Trim defensively at the RPC boundary.
-- ============================================================================

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
begin
  if v_name is null or length(v_name) = 0 then
    raise exception 'find_or_create_funder: display_name cannot be empty'
      using errcode = '22023';
  end if;

  -- Try to find existing (case-insensitive, non-archived)
  select id into v_funder_id
    from public.funder
    where piggybank_id = p_piggybank_id
      and lower(display_name) = lower(v_name)
      and archived_at is null;
  if v_funder_id is not null then
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
