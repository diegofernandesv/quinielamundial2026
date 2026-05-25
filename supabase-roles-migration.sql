-- Migration: update role enum — add pending_admin, rename user → player
-- Run this in Supabase SQL Editor BEFORE supabase-access-requests.sql

-- 1. Add new values to the existing enum
alter type user_role add value if not exists 'player';
alter type user_role add value if not exists 'pending_admin';

-- 2. Migrate existing 'user' rows to 'player'
update public.profiles set role = 'player' where role = 'user';

-- 3. Change the default for new signups to 'player'
alter table public.profiles alter column role set default 'player';

-- Note: PostgreSQL does not allow removing enum values directly.
-- The old 'user' and 'pool_admin' values will remain in the type but
-- are no longer used. This is safe — no rows will have those values.

-- 4. Update the is_super_admin helper function (if it exists)
create or replace function public.is_super_admin()
returns boolean language sql security definer as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;
