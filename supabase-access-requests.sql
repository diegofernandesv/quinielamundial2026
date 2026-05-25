-- Migration: pool_access_requests
-- Run this in the Supabase SQL Editor after the main schema

create table if not exists public.pool_access_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  message     text,
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Only the requesting user can insert their own request
alter table public.pool_access_requests enable row level security;

create policy "Users can insert own requests"
  on public.pool_access_requests for insert
  with check (auth.uid() = user_id);

create policy "Users can read own requests"
  on public.pool_access_requests for select
  using (auth.uid() = user_id);

create policy "Admins can read all requests"
  on public.pool_access_requests for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    )
  );

create policy "Admins can update requests"
  on public.pool_access_requests for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    )
  );

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_access_requests_updated_at
  before update on public.pool_access_requests
  for each row execute function public.set_updated_at();

-- Also restrict pool creation to super_admins at the RLS level
-- (defense in depth — the UI already redirects non-admins)
drop policy if exists "Users can create pools" on public.pools;

create policy "Only admins can create pools"
  on public.pools for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    )
  );
