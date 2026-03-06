-- ============================================================
-- VAGA OPS — Sessions Table Migration
-- Extends the base schema with activation measurement,
-- recovery speed tracking, and session metadata columns.
--
-- Run AFTER the initial supabase-schema.sql has been applied.
-- Safe to run multiple times (IF NOT EXISTS / DROP IF EXISTS).
-- ============================================================

-- 1. Fix outcome CHECK constraint to include 'much-better'
--    (app emits 'much-better' but original constraint excluded it)
ALTER TABLE public.sessions
  DROP CONSTRAINT IF EXISTS sessions_outcome_check;

ALTER TABLE public.sessions
  ADD CONSTRAINT sessions_outcome_check
    CHECK (outcome IN ('better', 'same', 'worse', 'much-better'));

-- 2. New columns
ALTER TABLE public.sessions
  -- Protocol classification
  ADD COLUMN IF NOT EXISTS type              text
    CHECK (type IN ('stealth', 'panic', 'flow')),

  -- Duration in seconds (30 for panic, 60 for stealth, variable for flow)
  ADD COLUMN IF NOT EXISTS duration_sec      integer,

  -- Numeric shift rating (-1 worse → 2 much better) from PostResetCheckin
  ADD COLUMN IF NOT EXISTS shift             integer,

  -- Flow-lock minutes logged
  ADD COLUMN IF NOT EXISTS flow_minutes      integer,

  -- Activation level before protocol (1 = calm, 10 = highly activated)
  ADD COLUMN IF NOT EXISTS activation_before integer
    CHECK (activation_before BETWEEN 1 AND 10),

  -- Activation level after protocol (1–10)
  ADD COLUMN IF NOT EXISTS activation_after  integer
    CHECK (activation_after BETWEEN 1 AND 10),

  -- Computed: activation_after - activation_before (negative = calming effect)
  ADD COLUMN IF NOT EXISTS activation_delta  integer,

  -- Protocol identifier (e.g. 'ear-apex', 'rib-cage-expansion', 'emergency-reset')
  ADD COLUMN IF NOT EXISTS protocol_used     text,

  -- ISO timestamp when the user clicked START (for true recovery duration)
  ADD COLUMN IF NOT EXISTS started_at        timestamptz;

-- 3. Indexes for pattern queries
--    Covers daily/weekly aggregations and per-protocol effectiveness queries.
CREATE INDEX IF NOT EXISTS sessions_user_date
  ON public.sessions (user_id, date DESC);

CREATE INDEX IF NOT EXISTS sessions_user_type
  ON public.sessions (user_id, type);

CREATE INDEX IF NOT EXISTS sessions_user_state
  ON public.sessions (user_id, state);

-- 4. RLS — no policy changes required.
--    All new columns fall under the existing "Users manage own sessions" policy
--    (auth.uid() = user_id). No cross-user data is exposed.
