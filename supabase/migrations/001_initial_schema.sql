-- Piggybanks table
create table public.piggybanks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text default '',
  goal_amount integer not null default 0,      -- stored in cents
  current_amount integer not null default 0,   -- stored in cents
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Transactions table (deposits/withdrawals)
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  piggybank_id uuid references public.piggybanks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  amount integer not null,                     -- positive = deposit, negative = withdrawal (cents)
  note text default '',
  created_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.piggybanks enable row level security;
alter table public.transactions enable row level security;

-- RLS Policies: users can only access their own data
create policy "Users can view own piggybanks"
  on public.piggybanks for select
  using (auth.uid() = user_id);

create policy "Users can create own piggybanks"
  on public.piggybanks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own piggybanks"
  on public.piggybanks for update
  using (auth.uid() = user_id);

create policy "Users can delete own piggybanks"
  on public.piggybanks for delete
  using (auth.uid() = user_id);

create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can create own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

-- Function to update piggybank balance on new transaction
create or replace function public.update_piggybank_balance()
returns trigger as $$
begin
  update public.piggybanks
  set current_amount = current_amount + NEW.amount,
      updated_at = now()
  where id = NEW.piggybank_id;
  return NEW;
end;
$$ language plpgsql security definer;

-- Trigger: auto-update balance when transaction is inserted
create trigger on_transaction_insert
  after insert on public.transactions
  for each row execute function public.update_piggybank_balance();
