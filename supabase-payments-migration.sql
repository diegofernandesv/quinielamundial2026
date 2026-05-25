-- Migration: payments & prize distribution
-- Run in Supabase SQL Editor

-- 1. Add entry_fee and prize_distribution to pools
alter table public.pools
  add column if not exists entry_fee numeric(10,2) default null,
  add column if not exists prize_distribution jsonb default '[]'::jsonb;

-- 2. Add payment tracking to pool_members
alter table public.pool_members
  add column if not exists has_paid boolean not null default false,
  add column if not exists paid_at timestamptz default null;

-- 3. RLS: pool owner can update has_paid on their members
create policy "pool_members_update_payment"
  on public.pool_members for update
  using (is_pool_owner(pool_id) or is_super_admin());
