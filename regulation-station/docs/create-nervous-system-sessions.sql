-- ============================================================
-- VAGA OPS — nervous_system_sessions table
-- New primary session log. Replaces public.sessions for all
-- state and protocol logging. Run in Supabase SQL Editor.
-- ============================================================

create table if not exists public.nervous_system_sessions (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        references auth.users not null,
  created_at   timestamptz default now(),
  date         date        not null,

  -- Nervous system state at time of session
  primary_state  text check (primary_state in ('frozen', 'anxious', 'flow')),

  -- Protocol classification
  session_type   text check (session_type in ('stealth', 'panic', 'flow')),
  protocol_used  text,
  reset_completed boolean default false,

  -- Timing
  protocol_started_at       timestamptz,  -- when user clicked START
  protocol_completed_at     timestamptz,  -- when protocol finished
  duration_sec              integer,      -- nominal protocol length (30 / 60)
  recovery_duration_seconds integer,      -- actual elapsed: completed_at - started_at
  flow_minutes              integer,

  -- User-reported outcome
  outcome  text check (outcome in ('better', 'same', 'worse', 'much-better')),
  shift    integer,  -- -1 worse → 2 much-better

  -- Activation measurement (1 = very calm, 10 = highly activated)
  activation_before  integer check (activation_before between 1 and 10),
  activation_after   integer check (activation_after  between 1 and 10),
  activation_delta   integer   -- activation_after - activation_before
);

-- RLS
alter table public.nervous_system_sessions enable row level security;

create policy "Users manage own nervous system sessions"
  on public.nervous_system_sessions
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Indexes
create index if not exists nss_user_date
  on public.nervous_system_sessions (user_id, date desc);

create index if not exists nss_user_session_type
  on public.nervous_system_sessions (user_id, session_type);

create index if not exists nss_user_primary_state
  on public.nervous_system_sessions (user_id, primary_state);
