-- ============================================================
-- VAGA OPS — Supabase Schema
-- Paste this entire file into Supabase SQL Editor and run it
-- ============================================================

-- Sessions (personal usage log)
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  date date not null,
  state text not null check (state in ('frozen', 'anxious', 'flow')),
  reset_completed boolean default false,
  outcome text check (outcome in ('better', 'same', 'worse', 'much-better')),
  hrv_value integer,

  -- Protocol metadata
  type              text    check (type in ('stealth', 'panic', 'flow')),
  duration_sec      integer,
  shift             integer,
  flow_minutes      integer,
  protocol_used     text,
  started_at        timestamptz,

  -- Activation measurement (1 = calm, 10 = highly activated)
  activation_before integer check (activation_before between 1 and 10),
  activation_after  integer check (activation_after  between 1 and 10),
  activation_delta  integer  -- activation_after - activation_before
);
alter table public.sessions enable row level security;
create policy "Users manage own sessions" on public.sessions
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Nervous System Sessions (primary protocol + state log)
-- Replaces public.sessions for all new writes.
create table if not exists public.nervous_system_sessions (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        references auth.users not null,
  created_at   timestamptz default now(),
  date         date        not null,

  primary_state   text check (primary_state in ('frozen', 'anxious', 'flow')),
  session_type    text check (session_type in ('stealth', 'panic', 'flow')),
  protocol_used   text,
  reset_completed boolean default false,

  protocol_started_at       timestamptz,
  protocol_completed_at     timestamptz,
  duration_sec              integer,
  recovery_duration_seconds integer,
  flow_minutes              integer,

  outcome  text check (outcome in ('better', 'same', 'worse', 'much-better')),
  shift    integer,

  activation_before  integer check (activation_before between 1 and 10),
  activation_after   integer check (activation_after  between 1 and 10),
  activation_delta   integer
);
alter table public.nervous_system_sessions enable row level security;
create policy "Users manage own nervous system sessions"
  on public.nervous_system_sessions
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Teams
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null,
  owner_id uuid references auth.users not null,
  created_at timestamptz default now()
);
alter table public.teams enable row level security;
create policy "Anyone can read teams" on public.teams for select using (true);
create policy "Owner manages team" on public.teams
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Team members
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  display_name text not null,
  joined_at timestamptz default now(),
  unique(team_id, user_id)
);
alter table public.team_members enable row level security;
create policy "Members can read team members" on public.team_members
  for select using (
    exists (select 1 from public.team_members tm
            where tm.team_id = team_members.team_id and tm.user_id = auth.uid())
  );
create policy "Users can join teams" on public.team_members
  for insert with check (auth.uid() = user_id);
create policy "Users can leave teams" on public.team_members
  for delete using (auth.uid() = user_id);

-- Team check-ins (real-time state sharing)
create table if not exists public.team_checkins (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  display_name text not null,
  state text not null check (state in ('frozen', 'anxious', 'flow')),
  checked_in_at timestamptz default now()
);
alter table public.team_checkins enable row level security;
create policy "Members can read team checkins" on public.team_checkins
  for select using (
    exists (select 1 from public.team_members tm
            where tm.team_id = team_checkins.team_id and tm.user_id = auth.uid())
  );
create policy "Users create own checkins" on public.team_checkins
  for insert with check (auth.uid() = user_id);
create policy "Users delete own checkins" on public.team_checkins
  for delete using (auth.uid() = user_id);

-- Enable realtime for team check-ins
alter publication supabase_realtime add table public.team_checkins;
