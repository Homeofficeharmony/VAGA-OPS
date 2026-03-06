-- ============================================================
-- Migration: rename started_at → protocol_started_at and
--            add protocol_completed_at
-- Run in Supabase SQL Editor if you applied create-nervous-system-sessions.sql
-- before this change was made.
-- ============================================================

-- Rename existing column
alter table public.nervous_system_sessions
  rename column started_at to protocol_started_at;

-- Add new column (safe to run even if migration was already partially applied)
alter table public.nervous_system_sessions
  add column if not exists protocol_completed_at timestamptz;
