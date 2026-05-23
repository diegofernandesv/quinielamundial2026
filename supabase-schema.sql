-- ============================================================
-- QUINIELA MUNDIAL 2026 - Supabase PostgreSQL Schema
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('user', 'pool_admin', 'super_admin');
create type match_phase as enum ('group', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final');
create type match_status as enum ('scheduled', 'live', 'finished');
create type pool_privacy as enum ('public', 'private');
create type prediction_status as enum ('pending', 'locked', 'scored', 'no_prediction');
create type invite_status as enum ('pending', 'accepted', 'declined', 'expired');

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nickname text unique,
  full_name text,
  avatar_url text,
  country_code char(2),
  favorite_team_id uuid, -- FK added after teams table
  role user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_nickname on profiles(nickname);
create index idx_profiles_role on profiles(role);

-- ============================================================
-- TEAMS
-- ============================================================

create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name char(3) not null,
  flag_emoji text,
  flag_url text,
  confederation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_teams_name on teams(name);

-- Add FK from profiles
alter table profiles add constraint fk_profiles_favorite_team
  foreign key (favorite_team_id) references teams(id) on delete set null;

-- ============================================================
-- TOURNAMENT GROUPS
-- ============================================================

create table tournament_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, -- 'A', 'B', ..., 'L'
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- GROUP TEAMS (junction)
-- ============================================================

create table group_teams (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tournament_groups(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(group_id, team_id)
);

create index idx_group_teams_group on group_teams(group_id);
create index idx_group_teams_team on group_teams(team_id);

-- ============================================================
-- MATCHES
-- ============================================================

create table matches (
  id uuid primary key default gen_random_uuid(),
  home_team_id uuid references teams(id) on delete set null,
  away_team_id uuid references teams(id) on delete set null,
  group_id uuid references tournament_groups(id) on delete set null,
  phase match_phase not null default 'group',
  match_number int, -- official match number in tournament
  round_label text, -- 'Match 1', 'QF1', etc.
  stadium text,
  city text,
  scheduled_at timestamptz not null,
  status match_status not null default 'scheduled',
  home_goals int check (home_goals >= 0),
  away_goals int check (away_goals >= 0),
  -- Knockout extra time/penalties
  home_goals_extra int check (home_goals_extra >= 0),
  away_goals_extra int check (away_goals_extra >= 0),
  home_goals_penalties int check (home_goals_penalties >= 0),
  away_goals_penalties int check (away_goals_penalties >= 0),
  winner_team_id uuid references teams(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_matches_phase on matches(phase);
create index idx_matches_status on matches(status);
create index idx_matches_scheduled_at on matches(scheduled_at);
create index idx_matches_home_team on matches(home_team_id);
create index idx_matches_away_team on matches(away_team_id);

-- ============================================================
-- POOLS
-- ============================================================

create table pools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  logo_url text,
  banner_url text,
  invite_code text unique not null default upper(substring(gen_random_uuid()::text, 1, 8)),
  privacy pool_privacy not null default 'private',
  owner_id uuid not null references profiles(id) on delete cascade,
  max_members int check (max_members > 0),
  join_deadline timestamptz,
  bonus_deadline timestamptz,
  is_active bool not null default true,
  -- Visual customization
  primary_color text default '#0f172a',
  secondary_color text default '#3b82f6',
  welcome_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_pools_owner on pools(owner_id);
create index idx_pools_invite_code on pools(invite_code);
create index idx_pools_privacy on pools(privacy);

-- ============================================================
-- SCORING RULES (one per pool)
-- ============================================================

create table scoring_rules (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null unique references pools(id) on delete cascade,
  -- Base points
  exact_score_points int not null default 5,
  correct_result_points int not null default 3,
  correct_draw_points int not null default 3,
  goal_difference_bonus int not null default 1,
  home_goals_bonus int not null default 1,
  away_goals_bonus int not null default 1,
  -- Bonus predictions
  champion_bonus int not null default 10,
  runner_up_bonus int not null default 6,
  semifinalist_bonus int not null default 4,
  -- Phase multipliers (stored as JSONB for flexibility)
  phase_multipliers jsonb not null default '{
    "group": 1,
    "round_of_32": 1.5,
    "round_of_16": 2,
    "quarter_final": 2.5,
    "semi_final": 3,
    "third_place": 2,
    "final": 4
  }',
  -- Feature flags
  enable_goal_difference_bonus bool not null default true,
  enable_team_goals_bonus bool not null default true,
  enable_phase_multipliers bool not null default true,
  enable_bonus_predictions bool not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- POOL MEMBERS
-- ============================================================

create table pool_members (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references pools(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  is_active bool not null default true,
  unique(pool_id, user_id)
);

create index idx_pool_members_pool on pool_members(pool_id);
create index idx_pool_members_user on pool_members(user_id);

-- ============================================================
-- POOL INVITES
-- ============================================================

create table pool_invites (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references pools(id) on delete cascade,
  invited_by uuid not null references profiles(id) on delete cascade,
  invited_email text,
  invite_code text not null,
  status invite_status not null default 'pending',
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);

create index idx_pool_invites_code on pool_invites(invite_code);
create index idx_pool_invites_pool on pool_invites(pool_id);

-- ============================================================
-- PREDICTIONS
-- ============================================================

create table predictions (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references pools(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  match_id uuid not null references matches(id) on delete cascade,
  predicted_home_goals int not null check (predicted_home_goals >= 0),
  predicted_away_goals int not null check (predicted_away_goals >= 0),
  -- Derived/cached
  predicted_result text generated always as (
    case
      when predicted_home_goals > predicted_away_goals then 'home'
      when predicted_away_goals > predicted_home_goals then 'away'
      else 'draw'
    end
  ) stored,
  -- For knockouts: explicit winner when draw in regular time
  predicted_winner_id uuid references teams(id) on delete set null,
  is_locked bool not null default false,
  points_earned numeric(6,2),
  scored_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(pool_id, user_id, match_id)
);

create index idx_predictions_pool_user on predictions(pool_id, user_id);
create index idx_predictions_match on predictions(match_id);
create index idx_predictions_user on predictions(user_id);

-- ============================================================
-- BONUS PREDICTIONS
-- ============================================================

create table bonus_predictions (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references pools(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  champion_team_id uuid references teams(id) on delete set null,
  runner_up_team_id uuid references teams(id) on delete set null,
  semifinalist_1_id uuid references teams(id) on delete set null,
  semifinalist_2_id uuid references teams(id) on delete set null,
  is_locked bool not null default false,
  champion_points numeric(6,2) default 0,
  runner_up_points numeric(6,2) default 0,
  semifinalist_points numeric(6,2) default 0,
  total_bonus_points numeric(6,2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(pool_id, user_id)
);

create index idx_bonus_predictions_pool_user on bonus_predictions(pool_id, user_id);

-- ============================================================
-- LEADERBOARD SNAPSHOTS (cached for performance)
-- ============================================================

create table leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references pools(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  total_points numeric(8,2) not null default 0,
  exact_scores int not null default 0,
  correct_results int not null default 0,
  predictions_made int not null default 0,
  bonus_points numeric(6,2) not null default 0,
  position int,
  previous_position int,
  last_calculated_at timestamptz not null default now(),
  unique(pool_id, user_id)
);

create index idx_leaderboard_pool on leaderboard_snapshots(pool_id, total_points desc);
create index idx_leaderboard_user on leaderboard_snapshots(user_id);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_actor on audit_logs(actor_id);
create index idx_audit_logs_entity on audit_logs(entity_type, entity_id);
create index idx_audit_logs_created on audit_logs(created_at desc);

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on profiles for each row execute function set_updated_at();
create trigger trg_teams_updated_at before update on teams for each row execute function set_updated_at();
create trigger trg_matches_updated_at before update on matches for each row execute function set_updated_at();
create trigger trg_pools_updated_at before update on pools for each row execute function set_updated_at();
create trigger trg_scoring_rules_updated_at before update on scoring_rules for each row execute function set_updated_at();
create trigger trg_predictions_updated_at before update on predictions for each row execute function set_updated_at();
create trigger trg_bonus_predictions_updated_at before update on bonus_predictions for each row execute function set_updated_at();

-- ============================================================
-- TRIGGER: Auto-create profile on new user
-- ============================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles(id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- TRIGGER: Auto-lock predictions at match start
-- ============================================================

create or replace function lock_predictions_for_match()
returns trigger language plpgsql as $$
begin
  if new.status = 'live' and old.status = 'scheduled' then
    update predictions
    set is_locked = true
    where match_id = new.id and not is_locked;
  end if;
  return new;
end;
$$;

create trigger trg_lock_predictions
  after update on matches
  for each row execute function lock_predictions_for_match();

-- ============================================================
-- TRIGGER: Auto-create scoring_rules + leaderboard row when pool is created
-- ============================================================

create or replace function handle_new_pool()
returns trigger language plpgsql as $$
begin
  insert into scoring_rules(pool_id) values (new.id);
  insert into pool_members(pool_id, user_id) values (new.id, new.owner_id);
  return new;
end;
$$;

create trigger trg_on_pool_created
  after insert on pools
  for each row execute function handle_new_pool();

-- ============================================================
-- FUNCTION: Calculate points for a single prediction
-- ============================================================

create or replace function calculate_prediction_points(
  p_match_id uuid,
  p_pool_id uuid,
  p_user_id uuid
) returns numeric language plpgsql as $$
declare
  v_match matches%rowtype;
  v_pred predictions%rowtype;
  v_rules scoring_rules%rowtype;
  v_points numeric := 0;
  v_multiplier numeric := 1;
  v_real_result text;
begin
  select * into v_match from matches where id = p_match_id;
  select * into v_pred from predictions where match_id = p_match_id and pool_id = p_pool_id and user_id = p_user_id;
  select * into v_rules from scoring_rules where pool_id = p_pool_id;

  if not found or v_match.status != 'finished' or v_match.home_goals is null or v_match.away_goals is null then
    return 0;
  end if;

  -- Real result
  v_real_result := case
    when v_match.home_goals > v_match.away_goals then 'home'
    when v_match.away_goals > v_match.home_goals then 'away'
    else 'draw'
  end;

  -- Phase multiplier
  if v_rules.enable_phase_multipliers then
    v_multiplier := coalesce((v_rules.phase_multipliers->>v_match.phase::text)::numeric, 1);
  end if;

  -- Exact score
  if v_pred.predicted_home_goals = v_match.home_goals and v_pred.predicted_away_goals = v_match.away_goals then
    v_points := v_points + v_rules.exact_score_points;
  else
    -- Correct result
    if v_pred.predicted_result = v_real_result then
      if v_real_result = 'draw' then
        v_points := v_points + v_rules.correct_draw_points;
      else
        v_points := v_points + v_rules.correct_result_points;
      end if;
    end if;

    -- Goal difference bonus
    if v_rules.enable_goal_difference_bonus then
      if (v_pred.predicted_home_goals - v_pred.predicted_away_goals) = (v_match.home_goals - v_match.away_goals) then
        v_points := v_points + v_rules.goal_difference_bonus;
      end if;
    end if;

    -- Team goals bonus
    if v_rules.enable_team_goals_bonus then
      if v_pred.predicted_home_goals = v_match.home_goals then
        v_points := v_points + v_rules.home_goals_bonus;
      end if;
      if v_pred.predicted_away_goals = v_match.away_goals then
        v_points := v_points + v_rules.away_goals_bonus;
      end if;
    end if;
  end if;

  return v_points * v_multiplier;
end;
$$;

-- ============================================================
-- FUNCTION: Score all predictions for a finished match
-- ============================================================

create or replace function score_match_predictions(p_match_id uuid)
returns int language plpgsql as $$
declare
  v_pred predictions%rowtype;
  v_points numeric;
  v_count int := 0;
begin
  for v_pred in
    select * from predictions where match_id = p_match_id
  loop
    v_points := calculate_prediction_points(p_match_id, v_pred.pool_id, v_pred.user_id);
    update predictions
    set points_earned = v_points, scored_at = now()
    where id = v_pred.id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- ============================================================
-- FUNCTION: Recalculate full leaderboard for a pool
-- ============================================================

create or replace function recalculate_leaderboard(p_pool_id uuid)
returns void language plpgsql as $$
declare
  v_member record;
  v_total_points numeric;
  v_exact int;
  v_correct int;
  v_made int;
  v_bonus numeric;
begin
  for v_member in select user_id from pool_members where pool_id = p_pool_id and is_active = true loop
    select
      coalesce(sum(p.points_earned), 0),
      count(*) filter (where p.predicted_home_goals = m.home_goals and p.predicted_away_goals = m.away_goals and m.status = 'finished'),
      count(*) filter (where p.predicted_result = case when m.home_goals > m.away_goals then 'home' when m.away_goals > m.home_goals then 'away' else 'draw' end and m.status = 'finished'),
      count(*) filter (where p.is_locked)
    into v_total_points, v_exact, v_correct, v_made
    from predictions p
    join matches m on m.id = p.match_id
    where p.pool_id = p_pool_id and p.user_id = v_member.user_id;

    select coalesce(total_bonus_points, 0) into v_bonus
    from bonus_predictions
    where pool_id = p_pool_id and user_id = v_member.user_id;

    insert into leaderboard_snapshots(pool_id, user_id, total_points, exact_scores, correct_results, predictions_made, bonus_points, last_calculated_at)
    values (p_pool_id, v_member.user_id, coalesce(v_total_points, 0) + coalesce(v_bonus, 0), coalesce(v_exact, 0), coalesce(v_correct, 0), coalesce(v_made, 0), coalesce(v_bonus, 0), now())
    on conflict (pool_id, user_id) do update set
      previous_position = leaderboard_snapshots.position,
      total_points = excluded.total_points,
      exact_scores = excluded.exact_scores,
      correct_results = excluded.correct_results,
      predictions_made = excluded.predictions_made,
      bonus_points = excluded.bonus_points,
      last_calculated_at = excluded.last_calculated_at;
  end loop;

  -- Recalculate positions
  with ranked as (
    select id, row_number() over (order by total_points desc, exact_scores desc, correct_results desc, joined_at asc) as rn
    from leaderboard_snapshots ls
    join pool_members pm on pm.pool_id = ls.pool_id and pm.user_id = ls.user_id
    where ls.pool_id = p_pool_id
  )
  update leaderboard_snapshots ls
  set position = ranked.rn
  from ranked
  where ls.id = ranked.id;
end;
$$;

-- ============================================================
-- TRIGGER: Auto score + leaderboard when match finishes
-- ============================================================

create or replace function handle_match_finished()
returns trigger language plpgsql as $$
declare
  v_distinct_pools uuid[];
  v_pool_id uuid;
begin
  if new.status = 'finished' and (old.status != 'finished' or old.home_goals is distinct from new.home_goals or old.away_goals is distinct from new.away_goals) then
    perform score_match_predictions(new.id);
    -- Get all pools that have predictions for this match
    select array_agg(distinct pool_id) into v_distinct_pools from predictions where match_id = new.id;
    if v_distinct_pools is not null then
      foreach v_pool_id in array v_distinct_pools loop
        perform recalculate_leaderboard(v_pool_id);
      end loop;
    end if;
    -- Audit
    insert into audit_logs(action, entity_type, entity_id, old_data, new_data)
    values ('match_finished', 'match', new.id,
      jsonb_build_object('status', old.status, 'home_goals', old.home_goals, 'away_goals', old.away_goals),
      jsonb_build_object('status', new.status, 'home_goals', new.home_goals, 'away_goals', new.away_goals)
    );
  end if;
  return new;
end;
$$;

create trigger trg_match_finished
  after update on matches
  for each row execute function handle_match_finished();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table teams enable row level security;
alter table tournament_groups enable row level security;
alter table group_teams enable row level security;
alter table matches enable row level security;
alter table pools enable row level security;
alter table scoring_rules enable row level security;
alter table pool_members enable row level security;
alter table pool_invites enable row level security;
alter table predictions enable row level security;
alter table bonus_predictions enable row level security;
alter table leaderboard_snapshots enable row level security;
alter table audit_logs enable row level security;

-- Helper function
create or replace function is_super_admin()
returns bool language sql security definer stable as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'super_admin');
$$;

create or replace function is_pool_member(p_pool_id uuid)
returns bool language sql security definer stable as $$
  select exists(select 1 from pool_members where pool_id = p_pool_id and user_id = auth.uid() and is_active = true);
$$;

create or replace function is_pool_owner(p_pool_id uuid)
returns bool language sql security definer stable as $$
  select exists(select 1 from pools where id = p_pool_id and owner_id = auth.uid());
$$;

-- PROFILES
create policy "profiles_select" on profiles for select using (auth.uid() = id or is_super_admin());
create policy "profiles_update" on profiles for update using (auth.uid() = id);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);

-- TEAMS (public read, super_admin write)
create policy "teams_select" on teams for select using (true);
create policy "teams_insert" on teams for insert with check (is_super_admin());
create policy "teams_update" on teams for update using (is_super_admin());
create policy "teams_delete" on teams for delete using (is_super_admin());

-- TOURNAMENT GROUPS (public read, super_admin write)
create policy "groups_select" on tournament_groups for select using (true);
create policy "groups_write" on tournament_groups for all using (is_super_admin());

create policy "group_teams_select" on group_teams for select using (true);
create policy "group_teams_write" on group_teams for all using (is_super_admin());

-- MATCHES (public read, super_admin write)
create policy "matches_select" on matches for select using (true);
create policy "matches_insert" on matches for insert with check (is_super_admin());
create policy "matches_update" on matches for update using (is_super_admin());
create policy "matches_delete" on matches for delete using (is_super_admin());

-- POOLS
create policy "pools_select_public" on pools for select using (privacy = 'public' or is_pool_member(id) or owner_id = auth.uid() or is_super_admin());
create policy "pools_insert" on pools for insert with check (auth.uid() = owner_id);
create policy "pools_update" on pools for update using (owner_id = auth.uid() or is_super_admin());
create policy "pools_delete" on pools for delete using (owner_id = auth.uid() or is_super_admin());

-- SCORING RULES
create policy "scoring_rules_select" on scoring_rules for select using (is_pool_member(pool_id) or is_pool_owner(pool_id));
create policy "scoring_rules_insert" on scoring_rules for insert with check (is_pool_owner(pool_id) or is_super_admin());
create policy "scoring_rules_update" on scoring_rules for update using (is_pool_owner(pool_id) or is_super_admin());

-- POOL MEMBERS
create policy "pool_members_select" on pool_members for select using (is_pool_member(pool_id) or is_pool_owner(pool_id) or is_super_admin());
create policy "pool_members_insert" on pool_members for insert with check (auth.uid() = user_id);
create policy "pool_members_delete" on pool_members for delete using (user_id = auth.uid() or is_pool_owner(pool_id) or is_super_admin());

-- POOL INVITES
create policy "pool_invites_select" on pool_invites for select using (is_pool_owner(pool_id) or is_super_admin());
create policy "pool_invites_insert" on pool_invites for insert with check (is_pool_owner(pool_id));

-- PREDICTIONS
create policy "predictions_select" on predictions for select using (is_pool_member(pool_id));
create policy "predictions_insert" on predictions for insert with check (
  auth.uid() = user_id
  and is_pool_member(pool_id)
  and exists(select 1 from matches where id = match_id and scheduled_at > now() and status = 'scheduled')
);
create policy "predictions_update" on predictions for update using (
  auth.uid() = user_id
  and not is_locked
  and exists(select 1 from matches where id = match_id and scheduled_at > now() and status = 'scheduled')
);

-- BONUS PREDICTIONS
create policy "bonus_predictions_select" on bonus_predictions for select using (is_pool_member(pool_id));
create policy "bonus_predictions_insert" on bonus_predictions for insert with check (
  auth.uid() = user_id
  and is_pool_member(pool_id)
  and exists(select 1 from pools where id = pool_id and (bonus_deadline is null or bonus_deadline > now()))
);
create policy "bonus_predictions_update" on bonus_predictions for update using (
  auth.uid() = user_id
  and not is_locked
);

-- LEADERBOARD
create policy "leaderboard_select" on leaderboard_snapshots for select using (is_pool_member(pool_id));

-- AUDIT LOGS (super_admin only read)
create policy "audit_logs_select" on audit_logs for select using (is_super_admin());

-- ============================================================
-- SEED: Default groups A-L
-- ============================================================

insert into tournament_groups(name, display_order) values
  ('A',1),('B',2),('C',3),('D',4),('E',5),('F',6),
  ('G',7),('H',8),('I',9),('J',10),('K',11),('L',12);
