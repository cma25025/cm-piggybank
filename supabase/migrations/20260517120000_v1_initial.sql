-- ============================================================================
-- CM Piggybank — v1 initial schema
-- ============================================================================
-- Replaces v0 single-user flat schema. Target-state-ready: schema anticipates
-- the full product vision from the PRD (owner UI, multi-funder auth, APR,
-- spend requests) while v1 UI exposes only the caretaker-only surface.
--
-- Reference: /Users/c/ClaudeDevProjects/Piggybank/docs/v1-implementation-plan.md
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- KID PROFILES (data subject; becomes an auth user in v2 when owner UI ships)
-- ────────────────────────────────────────────────────────────────────────────
-- COPPA trigger: if `age < 13` AND `owner_user_id IS NOT NULL`, parental
-- consent and restricted data collection requirements apply. v1 keeps the
-- kid as a data subject only (no own auth), so COPPA is not triggered yet.
create table public.kid_profile (
  id uuid primary key default gen_random_uuid(),
  caretaker_user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) > 0),
  age int not null check (age >= 0 and age <= 25),
  avatar_emoji text not null default '🐷',
  owner_user_id uuid references auth.users(id),
  owner_pin_hash text,
  owner_auth_mode text not null default 'none'
    check (owner_auth_mode in ('none','pin','magic_link','full')),
  features_json jsonb not null default '{"requests_enabled":false,"weekly_digest":true}'::jsonb,
  created_at timestamptz not null default now(),
  created_by_user_id uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid references auth.users(id)
);
create index kid_profile_caretaker_idx on public.kid_profile(caretaker_user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- PIGGYBANKS (1:1 caretaker:kid in v1)
-- ────────────────────────────────────────────────────────────────────────────
create table public.piggybank (
  id uuid primary key default gen_random_uuid(),
  caretaker_user_id uuid not null references auth.users(id) on delete cascade,
  kid_profile_id uuid not null references public.kid_profile(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) > 0),
  -- bigint guards against aggregate overflow in v2 analytics views
  total_balance_cents bigint not null default 0,
  -- Soft delete (OV8). Hard purge runs via cron after 30 days.
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index piggybank_caretaker_kid_uq on public.piggybank(caretaker_user_id, kid_profile_id);
create index piggybank_caretaker_idx on public.piggybank(caretaker_user_id) where deleted_at is null;

-- ────────────────────────────────────────────────────────────────────────────
-- DISTRIBUTION RULE (one per piggybank)
-- ────────────────────────────────────────────────────────────────────────────
-- Default 60/20/20 per CEO review §1. Editable in onboarding step 2 and Settings.
create table public.distribution_rule (
  piggybank_id uuid primary key references public.piggybank(id) on delete cascade,
  caretaker_user_id uuid not null references auth.users(id) on delete cascade,
  spend_bps int not null default 6000 check (spend_bps >= 0 and spend_bps <= 10000),
  save_bps  int not null default 2000 check (save_bps >= 0 and save_bps <= 10000),
  share_bps int not null default 2000 check (share_bps >= 0 and share_bps <= 10000),
  constraint distribution_sums_to_10000 check (spend_bps + save_bps + share_bps = 10000),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid references auth.users(id)
);
create index distribution_rule_caretaker_idx on public.distribution_rule(caretaker_user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- BUCKETS (exactly 3 per piggybank: spend, save, share)
-- ────────────────────────────────────────────────────────────────────────────
create table public.bucket (
  id uuid primary key default gen_random_uuid(),
  piggybank_id uuid not null references public.piggybank(id) on delete cascade,
  caretaker_user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('spend','save','share')),
  balance_cents bigint not null default 0,
  created_at timestamptz not null default now()
);
create unique index bucket_kind_per_piggybank_uq on public.bucket(piggybank_id, kind);
create index bucket_caretaker_idx on public.bucket(caretaker_user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- SUBCATEGORIES (Spend subs, Save goals, Share destinations — same shape)
-- ────────────────────────────────────────────────────────────────────────────
create table public.subcategory (
  id uuid primary key default gen_random_uuid(),
  bucket_id uuid not null references public.bucket(id) on delete cascade,
  piggybank_id uuid not null references public.piggybank(id) on delete cascade,
  caretaker_user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) > 0),
  emoji text not null default '🪙',
  -- nullable for Spend subs (no target); set for Save goals
  target_amount_cents int check (target_amount_cents is null or target_amount_cents > 0),
  -- v1: schema-only; UI ships in v1.1 when APR feature lands
  apr_bps int not null default 0 check (apr_bps >= 0 and apr_bps <= 10000),
  unsettled_interest_cents bigint not null default 0,
  balance_cents bigint not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  created_by_user_id uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid references auth.users(id)
);
create index subcategory_bucket_idx on public.subcategory(bucket_id) where archived_at is null;
create index subcategory_caretaker_idx on public.subcategory(caretaker_user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- FUNDERS (first-class in v1; v2 attaches user_id for multi-funder auth)
-- ────────────────────────────────────────────────────────────────────────────
create table public.funder (
  id uuid primary key default gen_random_uuid(),
  piggybank_id uuid not null references public.piggybank(id) on delete cascade,
  caretaker_user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) > 0),
  relationship text,
  -- nullable until v2 multi-funder auth
  user_id uuid references auth.users(id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  created_by_user_id uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid references auth.users(id)
);
-- Case-insensitive uniqueness within a piggybank for non-archived funders (OV6).
-- Prevents "Grandma" and "grandma" from creating duplicate funders during
-- concurrent deposits.
create unique index funder_name_per_piggybank_uq
  on public.funder(piggybank_id, lower(display_name))
  where archived_at is null;
create index funder_caretaker_idx on public.funder(caretaker_user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- TRANSACTIONS (the activity log + balance source of truth)
-- ────────────────────────────────────────────────────────────────────────────
-- Parent + child model for deposits (OV2 of eng review): one parent row
-- carries funder/source/note with bucket_id NULL; three child rows carry
-- per-bucket amounts. Other kinds (spend/interest/adjustment/opening_balance)
-- are single rows.
--
-- Amount sign convention (positive value, sign applied by kind via trigger):
--   deposit / interest / opening_balance: amount > 0
--   spend: amount > 0 (trigger negates for balance math)
--   adjustment / transfer: amount carries sign (any non-zero)
-- See signed_amount() helper below.
create table public.transaction (
  id uuid primary key default gen_random_uuid(),
  piggybank_id uuid not null references public.piggybank(id) on delete cascade,
  caretaker_user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid,  -- FK declared below as DEFERRABLE INITIALLY DEFERRED
  kind text not null check (kind in
    ('deposit','spend','transfer','interest','adjustment','opening_balance')),
  amount_cents int not null,
  bucket_id uuid references public.bucket(id) on delete restrict,
  subcategory_id uuid references public.subcategory(id) on delete restrict,
  funder_id uuid references public.funder(id) on delete restrict,
  source_type text check (source_type in
    ('allowance','birthday','chores','gift','other') or source_type is null),
  note text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  created_by_user_id uuid references auth.users(id),
  -- Per-kind amount sign rules (CHECK enforcement; Zod also enforces app-side)
  constraint amount_sign_rules check (
    (kind = 'deposit'         and amount_cents > 0) or
    (kind = 'spend'           and amount_cents > 0) or
    (kind = 'interest'        and amount_cents > 0) or
    (kind = 'opening_balance' and amount_cents >= 0) or
    (kind = 'transfer'        and amount_cents <> 0) or
    (kind = 'adjustment'      and amount_cents <> 0)
  ),
  -- parent_id only meaningful for deposits (parent = bucket_id NULL, children = bucket_id set)
  constraint parent_only_on_deposit check (
    parent_id is null or kind = 'deposit'
  ),
  -- Parent deposits have bucket_id NULL; everything else must have bucket_id.
  -- (Children of parent deposits have bucket_id set and parent_id set.)
  constraint bucket_id_required_unless_parent_deposit check (
    bucket_id is not null or (kind = 'deposit' and parent_id is null)
  )
);
-- DEFERRABLE FK (OV1): allows non-obvious insertion order inside a transaction
-- (e.g. CTE inserts where children may evaluate before parent).
alter table public.transaction
  add constraint transaction_parent_id_fkey
  foreign key (parent_id) references public.transaction(id)
  on delete cascade
  deferrable initially deferred;
create index transaction_piggybank_occurred_idx on public.transaction(piggybank_id, occurred_at desc);
create index transaction_funder_occurred_idx on public.transaction(funder_id, occurred_at desc)
  where funder_id is not null;
create index transaction_bucket_occurred_idx on public.transaction(bucket_id, occurred_at desc)
  where bucket_id is not null;
create index transaction_subcategory_occurred_idx on public.transaction(subcategory_id, occurred_at desc)
  where subcategory_id is not null;
create index transaction_parent_idx on public.transaction(parent_id) where parent_id is not null;
create index transaction_caretaker_idx on public.transaction(caretaker_user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- REQUESTS (schema-ready; v1 UI hidden — owner UI ships in v2)
-- ────────────────────────────────────────────────────────────────────────────
create table public.request (
  id uuid primary key default gen_random_uuid(),
  piggybank_id uuid not null references public.piggybank(id) on delete cascade,
  caretaker_user_id uuid not null references auth.users(id) on delete cascade,
  submitted_by_user_id uuid not null references auth.users(id),
  amount_cents int not null check (amount_cents > 0),
  intended_bucket_id uuid references public.bucket(id) on delete restrict,
  intended_subcategory_id uuid references public.subcategory(id) on delete restrict,
  note text,
  status text not null check (status in ('pending','approved','denied','approved_with_edits')),
  resolved_transaction_id uuid references public.transaction(id) on delete set null,
  reviewed_by_user_id uuid references auth.users(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now()
);
create index request_piggybank_status_idx on public.request(piggybank_id, status);
create index request_caretaker_idx on public.request(caretaker_user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- signed_amount: convert stored (mostly-positive) amount to signed delta for
-- balance math. Spends are stored positive but DECREASE balance.
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.signed_amount(p_kind text, p_amount int)
returns int
language sql
immutable
as $$
  select case p_kind
    when 'spend' then -p_amount
    else p_amount  -- deposit / interest / opening_balance / transfer / adjustment carry sign as stored
  end;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- propagate_caretaker_user_id: BEFORE INSERT on sub-tables, copy
-- caretaker_user_id from the parent piggybank if not provided. SECURITY DEFINER
-- per OV2 so RLS doesn't block the cross-table lookup.
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.propagate_caretaker_user_id()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.caretaker_user_id is null then
    if new.piggybank_id is null then
      raise exception 'propagate_caretaker_user_id: piggybank_id is null on %', tg_table_name;
    end if;
    select caretaker_user_id into new.caretaker_user_id
      from public.piggybank where id = new.piggybank_id;
    if new.caretaker_user_id is null then
      raise exception 'propagate_caretaker_user_id: piggybank % not found', new.piggybank_id;
    end if;
  end if;
  return new;
end;
$$;

-- Apply propagation trigger to every sub-table that carries denormalized
-- caretaker_user_id. Named with _a_ prefix so it fires before other BEFORE
-- INSERT triggers (Postgres fires BEFORE triggers in alphabetical order).
create trigger _a_propagate_caretaker_user_id
  before insert on public.distribution_rule
  for each row execute function public.propagate_caretaker_user_id();
create trigger _a_propagate_caretaker_user_id
  before insert on public.bucket
  for each row execute function public.propagate_caretaker_user_id();
create trigger _a_propagate_caretaker_user_id
  before insert on public.subcategory
  for each row execute function public.propagate_caretaker_user_id();
create trigger _a_propagate_caretaker_user_id
  before insert on public.funder
  for each row execute function public.propagate_caretaker_user_id();
create trigger _a_propagate_caretaker_user_id
  before insert on public.transaction
  for each row execute function public.propagate_caretaker_user_id();
create trigger _a_propagate_caretaker_user_id
  before insert on public.request
  for each row execute function public.propagate_caretaker_user_id();

-- ────────────────────────────────────────────────────────────────────────────
-- set_created_by: BEFORE INSERT, default created_by_user_id to auth.uid()
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.set_created_by()
returns trigger
language plpgsql
as $$
begin
  if new.created_by_user_id is null then
    new.created_by_user_id := auth.uid();
  end if;
  return new;
end;
$$;

create trigger _b_set_created_by before insert on public.kid_profile
  for each row execute function public.set_created_by();
create trigger _b_set_created_by before insert on public.subcategory
  for each row execute function public.set_created_by();
create trigger _b_set_created_by before insert on public.funder
  for each row execute function public.set_created_by();
create trigger _b_set_created_by before insert on public.transaction
  for each row execute function public.set_created_by();

-- ────────────────────────────────────────────────────────────────────────────
-- touch_updated: BEFORE UPDATE, set updated_at and updated_by_user_id
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.touch_updated()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  -- Only set updated_by if column exists; rely on Postgres to throw if column
  -- doesn't exist (we don't apply this trigger to tables without the column).
  new.updated_by_user_id := auth.uid();
  return new;
end;
$$;

create trigger touch_updated before update on public.kid_profile
  for each row execute function public.touch_updated();
create trigger touch_updated before update on public.subcategory
  for each row execute function public.touch_updated();
create trigger touch_updated before update on public.funder
  for each row execute function public.touch_updated();
-- piggybank, bucket: updated_at only (no updated_by); separate trigger
create or replace function public.touch_updated_at_only()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger touch_updated_at before update on public.piggybank
  for each row execute function public.touch_updated_at_only();
-- distribution_rule has updated_at + updated_by_user_id
create trigger touch_updated before update on public.distribution_rule
  for each row execute function public.touch_updated();

-- ────────────────────────────────────────────────────────────────────────────
-- maintain_balances_on_transaction: AFTER INSERT/UPDATE/DELETE on transaction,
-- adjust bucket.balance_cents, subcategory.balance_cents, piggybank.total_balance_cents.
-- Operates only on rows with bucket_id IS NOT NULL (parent deposits have
-- bucket_id NULL and contribute zero; children carry the actual amounts).
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.maintain_balances_on_transaction()
returns trigger
language plpgsql
as $$
declare
  v_old_delta int;
  v_new_delta int;
begin
  if tg_op = 'INSERT' then
    v_new_delta := public.signed_amount(new.kind, new.amount_cents);
    if new.bucket_id is not null then
      update public.bucket
        set balance_cents = balance_cents + v_new_delta
        where id = new.bucket_id;
      update public.piggybank
        set total_balance_cents = total_balance_cents + v_new_delta
        where id = new.piggybank_id;
    end if;
    if new.subcategory_id is not null then
      update public.subcategory
        set balance_cents = balance_cents + v_new_delta
        where id = new.subcategory_id;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    v_old_delta := public.signed_amount(old.kind, old.amount_cents);
    if old.bucket_id is not null then
      update public.bucket
        set balance_cents = balance_cents - v_old_delta
        where id = old.bucket_id;
      update public.piggybank
        set total_balance_cents = total_balance_cents - v_old_delta
        where id = old.piggybank_id;
    end if;
    if old.subcategory_id is not null then
      update public.subcategory
        set balance_cents = balance_cents - v_old_delta
        where id = old.subcategory_id;
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' then
    if new.piggybank_id <> old.piggybank_id then
      raise exception 'Cannot move a transaction between piggybanks';
    end if;

    v_old_delta := public.signed_amount(old.kind, old.amount_cents);
    v_new_delta := public.signed_amount(new.kind, new.amount_cents);

    -- Reverse OLD
    if old.bucket_id is not null then
      update public.bucket
        set balance_cents = balance_cents - v_old_delta
        where id = old.bucket_id;
      update public.piggybank
        set total_balance_cents = total_balance_cents - v_old_delta
        where id = old.piggybank_id;
    end if;
    if old.subcategory_id is not null then
      update public.subcategory
        set balance_cents = balance_cents - v_old_delta
        where id = old.subcategory_id;
    end if;

    -- Apply NEW
    if new.bucket_id is not null then
      update public.bucket
        set balance_cents = balance_cents + v_new_delta
        where id = new.bucket_id;
      update public.piggybank
        set total_balance_cents = total_balance_cents + v_new_delta
        where id = new.piggybank_id;
    end if;
    if new.subcategory_id is not null then
      update public.subcategory
        set balance_cents = balance_cents + v_new_delta
        where id = new.subcategory_id;
    end if;

    return new;
  end if;

  return null;
end;
$$;

create trigger maintain_balances after insert or update or delete on public.transaction
  for each row execute function public.maintain_balances_on_transaction();

-- ============================================================================
-- ROW-LEVEL SECURITY
-- ============================================================================
-- Single-column index lookup pattern (E4): every domain table carries a
-- denormalized caretaker_user_id, RLS policies are `caretaker_user_id = auth.uid()`.
-- Propagation trigger (above) auto-populates from parent piggybank.

alter table public.kid_profile        enable row level security;
alter table public.piggybank          enable row level security;
alter table public.distribution_rule  enable row level security;
alter table public.bucket             enable row level security;
alter table public.subcategory        enable row level security;
alter table public.funder             enable row level security;
alter table public.transaction        enable row level security;
alter table public.request            enable row level security;

-- kid_profile
create policy "caretaker select kid_profile" on public.kid_profile
  for select using (caretaker_user_id = auth.uid());
create policy "caretaker insert kid_profile" on public.kid_profile
  for insert with check (caretaker_user_id = auth.uid());
create policy "caretaker update kid_profile" on public.kid_profile
  for update using (caretaker_user_id = auth.uid()) with check (caretaker_user_id = auth.uid());

-- piggybank: SELECT hides soft-deleted; UPDATE allowed (for soft delete itself
-- and for total_balance_cents updates from the balance trigger which runs as
-- the caretaker's session).
create policy "caretaker select piggybank" on public.piggybank
  for select using (caretaker_user_id = auth.uid() and deleted_at is null);
create policy "caretaker insert piggybank" on public.piggybank
  for insert with check (caretaker_user_id = auth.uid());
create policy "caretaker update piggybank" on public.piggybank
  for update using (caretaker_user_id = auth.uid()) with check (caretaker_user_id = auth.uid());

-- distribution_rule
create policy "caretaker select distribution_rule" on public.distribution_rule
  for select using (caretaker_user_id = auth.uid());
create policy "caretaker insert distribution_rule" on public.distribution_rule
  for insert with check (caretaker_user_id = auth.uid());
create policy "caretaker update distribution_rule" on public.distribution_rule
  for update using (caretaker_user_id = auth.uid()) with check (caretaker_user_id = auth.uid());

-- bucket
create policy "caretaker select bucket" on public.bucket
  for select using (caretaker_user_id = auth.uid());
create policy "caretaker insert bucket" on public.bucket
  for insert with check (caretaker_user_id = auth.uid());
create policy "caretaker update bucket" on public.bucket
  for update using (caretaker_user_id = auth.uid()) with check (caretaker_user_id = auth.uid());

-- subcategory
create policy "caretaker select subcategory" on public.subcategory
  for select using (caretaker_user_id = auth.uid());
create policy "caretaker insert subcategory" on public.subcategory
  for insert with check (caretaker_user_id = auth.uid());
create policy "caretaker update subcategory" on public.subcategory
  for update using (caretaker_user_id = auth.uid()) with check (caretaker_user_id = auth.uid());

-- funder
create policy "caretaker select funder" on public.funder
  for select using (caretaker_user_id = auth.uid());
create policy "caretaker insert funder" on public.funder
  for insert with check (caretaker_user_id = auth.uid());
create policy "caretaker update funder" on public.funder
  for update using (caretaker_user_id = auth.uid()) with check (caretaker_user_id = auth.uid());

-- transaction
create policy "caretaker select transaction" on public.transaction
  for select using (caretaker_user_id = auth.uid());
create policy "caretaker insert transaction" on public.transaction
  for insert with check (caretaker_user_id = auth.uid());
-- v1 doesn't expose UPDATE/DELETE to caretakers; void writes a new adjustment
-- row instead. UPDATE policy exists only for the balance trigger to maintain
-- bucket.balance_cents (the trigger runs as caretaker session).

-- request
create policy "caretaker select request" on public.request
  for select using (caretaker_user_id = auth.uid());
create policy "caretaker insert request" on public.request
  for insert with check (caretaker_user_id = auth.uid());
create policy "caretaker update request" on public.request
  for update using (caretaker_user_id = auth.uid()) with check (caretaker_user_id = auth.uid());

-- ============================================================================
-- SQL VIEWS
-- ============================================================================

-- v_funder_stats: aggregations per funder. RLS applies via underlying tables.
-- Counts only parent deposits (parent_id IS NULL) to avoid triple-counting
-- the child rows that carry per-bucket allocations.
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
group by f.id, f.piggybank_id, f.caretaker_user_id, f.display_name, f.relationship, f.archived_at;

-- v_weekly_digest: per piggybank per ISO week, deposits in / spends out / net.
create view public.v_weekly_digest
with (security_invoker = true) as
select
  piggybank_id,
  caretaker_user_id,
  date_trunc('week', occurred_at)                                                                as week_start,
  sum(case when kind = 'deposit'  and parent_id is null then amount_cents else 0 end)::bigint     as deposits_in_cents,
  sum(case when kind = 'spend'                            then amount_cents else 0 end)::bigint   as spends_out_cents,
  sum(public.signed_amount(kind, amount_cents))::bigint                                           as net_change_cents,
  count(*)::int                                                                                   as event_count
from public.transaction
where bucket_id is not null  -- exclude parent deposit rows (they're aggregations)
group by piggybank_id, caretaker_user_id, date_trunc('week', occurred_at);

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- find_or_create_funder: case-insensitive lookup-or-insert. Race-safe via the
-- partial unique index on (piggybank_id, lower(display_name)) WHERE archived_at IS NULL.
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.find_or_create_funder(
  p_piggybank_id uuid,
  p_display_name text,
  p_relationship text default null
) returns uuid
language plpgsql
security invoker
as $$
declare
  v_funder_id uuid;
begin
  -- Try to find existing (case-insensitive, non-archived)
  select id into v_funder_id
    from public.funder
    where piggybank_id = p_piggybank_id
      and lower(display_name) = lower(p_display_name)
      and archived_at is null;
  if v_funder_id is not null then
    return v_funder_id;
  end if;

  -- Insert; partial unique index handles concurrent inserts. If two sessions
  -- race here, the loser gets a unique-violation; we catch and re-lookup.
  begin
    insert into public.funder (piggybank_id, display_name, relationship)
      values (p_piggybank_id, p_display_name, p_relationship)
      returning id into v_funder_id;
  exception when unique_violation then
    select id into v_funder_id
      from public.funder
      where piggybank_id = p_piggybank_id
        and lower(display_name) = lower(p_display_name)
        and archived_at is null;
  end;

  return v_funder_id;
end;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- create_piggybank_with_defaults: atomic onboarding step 1. Creates
-- kid_profile + piggybank + 3 buckets + default subs + distribution_rule +
-- primary funder. Returns the new piggybank.id.
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.create_piggybank_with_defaults(
  p_kid_name text,
  p_age int,
  p_avatar_emoji text default '🐷',
  p_split_bps jsonb default '{"spend":6000,"save":2000,"share":2000}'::jsonb,
  p_primary_funder_name text default 'You'
) returns uuid
language plpgsql
security invoker
as $$
declare
  v_caretaker uuid := auth.uid();
  v_kid_id uuid;
  v_piggybank_id uuid;
  v_spend_bucket uuid;
  v_save_bucket uuid;
  v_share_bucket uuid;
begin
  if v_caretaker is null then
    raise exception 'create_piggybank_with_defaults: not authenticated';
  end if;

  -- kid_profile
  insert into public.kid_profile (caretaker_user_id, display_name, age, avatar_emoji)
    values (v_caretaker, p_kid_name, p_age, p_avatar_emoji)
    returning id into v_kid_id;

  -- piggybank
  insert into public.piggybank (caretaker_user_id, kid_profile_id, display_name)
    values (v_caretaker, v_kid_id, p_kid_name || '''s Piggybank')
    returning id into v_piggybank_id;

  -- distribution_rule
  insert into public.distribution_rule (
    piggybank_id, caretaker_user_id, spend_bps, save_bps, share_bps
  ) values (
    v_piggybank_id,
    v_caretaker,
    coalesce((p_split_bps->>'spend')::int, 6000),
    coalesce((p_split_bps->>'save')::int,  2000),
    coalesce((p_split_bps->>'share')::int, 2000)
  );

  -- 3 buckets
  insert into public.bucket (piggybank_id, kind) values (v_piggybank_id, 'spend')
    returning id into v_spend_bucket;
  insert into public.bucket (piggybank_id, kind) values (v_piggybank_id, 'save')
    returning id into v_save_bucket;
  insert into public.bucket (piggybank_id, kind) values (v_piggybank_id, 'share')
    returning id into v_share_bucket;

  -- Default subs per PRD §5.1
  insert into public.subcategory (bucket_id, piggybank_id, display_name, emoji) values
    (v_spend_bucket, v_piggybank_id, 'Treats & snacks', '🍦'),
    (v_spend_bucket, v_piggybank_id, 'Toys & books',    '🧸'),
    (v_spend_bucket, v_piggybank_id, 'Clothes',         '👕'),
    (v_share_bucket, v_piggybank_id, 'Charity',         '❤️'),
    (v_share_bucket, v_piggybank_id, 'Family gifts',    '🎁');
  -- Save bucket: no default subs (caretaker / kid create named goals)

  -- Primary funder (the caretaker themselves)
  perform public.find_or_create_funder(v_piggybank_id, p_primary_funder_name, 'Self');

  return v_piggybank_id;
end;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- add_deposit: atomic parent + 3 children. Distribution is auto-computed from
-- distribution_rule unless explicitly provided.
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.add_deposit(
  p_piggybank_id uuid,
  p_amount_cents int,
  p_funder_name text,
  p_source_type text default 'other',
  p_note text default null,
  p_funder_relationship text default null,
  p_distribution jsonb default null  -- {"spend":X,"save":Y,"share":Z} if manual
) returns uuid
language plpgsql
security invoker
as $$
declare
  v_caretaker uuid := auth.uid();
  v_funder_id uuid;
  v_rule record;
  v_parent_id uuid;
  v_spend_bucket uuid;
  v_save_bucket uuid;
  v_share_bucket uuid;
  v_spend_amt int;
  v_save_amt int;
  v_share_amt int;
begin
  if v_caretaker is null then
    raise exception 'add_deposit: not authenticated';
  end if;
  if p_amount_cents <= 0 then
    raise exception 'add_deposit: amount must be > 0, got %', p_amount_cents;
  end if;

  v_funder_id := public.find_or_create_funder(p_piggybank_id, p_funder_name, p_funder_relationship);

  -- Resolve bucket ids
  select id into v_spend_bucket from public.bucket where piggybank_id = p_piggybank_id and kind = 'spend';
  select id into v_save_bucket  from public.bucket where piggybank_id = p_piggybank_id and kind = 'save';
  select id into v_share_bucket from public.bucket where piggybank_id = p_piggybank_id and kind = 'share';

  if p_distribution is not null then
    v_spend_amt := (p_distribution->>'spend')::int;
    v_save_amt  := (p_distribution->>'save')::int;
    v_share_amt := (p_distribution->>'share')::int;
    if v_spend_amt + v_save_amt + v_share_amt <> p_amount_cents then
      raise exception 'add_deposit: distribution sums to %, expected %',
        v_spend_amt + v_save_amt + v_share_amt, p_amount_cents;
    end if;
    if v_spend_amt < 0 or v_save_amt < 0 or v_share_amt < 0 then
      raise exception 'add_deposit: distribution amounts must be >= 0';
    end if;
  else
    -- Auto: floor-first-two, share gets remainder (CEO §7)
    select spend_bps, save_bps, share_bps into v_rule
      from public.distribution_rule where piggybank_id = p_piggybank_id;
    if v_rule is null then
      raise exception 'add_deposit: distribution_rule missing for piggybank %', p_piggybank_id;
    end if;
    v_spend_amt := (p_amount_cents * v_rule.spend_bps) / 10000;  -- integer division = floor for positives
    v_save_amt  := (p_amount_cents * v_rule.save_bps)  / 10000;
    v_share_amt := p_amount_cents - v_spend_amt - v_save_amt;
  end if;

  -- Parent row (carries funder/source/note; bucket_id NULL)
  insert into public.transaction (
    piggybank_id, kind, amount_cents, funder_id, source_type, note
  ) values (
    p_piggybank_id, 'deposit', p_amount_cents, v_funder_id, p_source_type, p_note
  ) returning id into v_parent_id;

  -- 3 children (each carries bucket_id; funder denormalized for query speed)
  if v_spend_amt > 0 then
    insert into public.transaction (
      piggybank_id, parent_id, kind, amount_cents, bucket_id, funder_id
    ) values (p_piggybank_id, v_parent_id, 'deposit', v_spend_amt, v_spend_bucket, v_funder_id);
  end if;
  if v_save_amt > 0 then
    insert into public.transaction (
      piggybank_id, parent_id, kind, amount_cents, bucket_id, funder_id
    ) values (p_piggybank_id, v_parent_id, 'deposit', v_save_amt, v_save_bucket, v_funder_id);
  end if;
  if v_share_amt > 0 then
    insert into public.transaction (
      piggybank_id, parent_id, kind, amount_cents, bucket_id, funder_id
    ) values (p_piggybank_id, v_parent_id, 'deposit', v_share_amt, v_share_bucket, v_funder_id);
  end if;

  return v_parent_id;
end;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- void_transaction: writes a reversing adjustment. For parent deposits,
-- writes one adjustment per child (so bucket balances reverse correctly).
-- Original row(s) stay in the audit log.
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
  if v_orig is null then
    raise exception 'void_transaction: transaction % not found', p_transaction_id;
  end if;
  if v_orig.kind = 'adjustment' then
    raise exception 'void_transaction: cannot void an adjustment (id=%)', p_transaction_id;
  end if;

  -- Parent deposit: write one reversing adjustment per child
  if v_orig.kind = 'deposit' and v_orig.parent_id is null then
    for v_child in
      select * from public.transaction where parent_id = p_transaction_id
    loop
      insert into public.transaction (
        piggybank_id, kind, amount_cents, bucket_id, subcategory_id, note
      ) values (
        v_child.piggybank_id,
        'adjustment',
        -public.signed_amount(v_child.kind, v_child.amount_cents),  -- negate to reverse
        v_child.bucket_id,
        v_child.subcategory_id,
        format('Voided deposit %s: %s', p_transaction_id, p_reason)
      );
      v_count := v_count + 1;
    end loop;
    return v_count;
  end if;

  -- Single-row kinds (spend / interest / opening_balance / child deposit)
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
  return 1;
end;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- soft_delete_piggybank: marks deleted_at; RLS hides on SELECT.
-- Hard purge via cron (or manual) after 30 days.
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.soft_delete_piggybank(p_piggybank_id uuid)
returns void
language plpgsql
security invoker
as $$
begin
  update public.piggybank
    set deleted_at = now()
    where id = p_piggybank_id;
  if not found then
    raise exception 'soft_delete_piggybank: piggybank % not found (or not yours)', p_piggybank_id;
  end if;
end;
$$;

-- ============================================================================
-- GRANTS
-- ============================================================================
-- Grant execute on RPCs to authenticated role (Supabase's default for logged-in users).
grant execute on function public.create_piggybank_with_defaults to authenticated;
grant execute on function public.add_deposit                    to authenticated;
grant execute on function public.find_or_create_funder          to authenticated;
grant execute on function public.void_transaction               to authenticated;
grant execute on function public.soft_delete_piggybank          to authenticated;
-- signed_amount is a helper used internally; grant for view access
grant execute on function public.signed_amount(text, int)       to authenticated;
