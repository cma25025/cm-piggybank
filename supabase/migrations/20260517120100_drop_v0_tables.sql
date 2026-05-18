-- Drop the v0 prototype tables. They were superseded by 20260517120000_v1_initial.sql
-- which introduces the parent/child transaction model + buckets + subcategories +
-- funders + RLS denormalization.
--
-- Confirmed via row counts before applying v1: piggybanks (0 rows), transactions (0 rows).
-- transaction_categories was an unused exploration table from the v0 prototype era.

drop table if exists public.transaction_categories cascade;
drop table if exists public.transactions cascade;
drop table if exists public.piggybanks cascade;

-- Drop the v0 helper function and trigger if they still exist
drop function if exists public.update_piggybank_balance() cascade;
