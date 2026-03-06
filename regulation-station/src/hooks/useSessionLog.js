import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const STORAGE_KEY = 'vaga-sessions'
const MAX_SESSIONS = 90

export function getDailyStats(sessions) {
  const today = new Date().toISOString().slice(0, 10)
  const resets = sessions.filter(
    (s) => s.date === today && (s.type === 'stealth' || s.type === 'panic')
  )
  const shifts = resets.filter((s) => s.shift != null).map((s) => s.shift)
  const avgShift = shifts.length
    ? shifts.reduce((a, b) => a + b, 0) / shifts.length
    : null
  const flowMinutes = sessions
    .filter((s) => s.date === today && s.type === 'flow')
    .reduce((sum, s) => sum + (s.flowMinutes || 0), 0)
  return { resetCount: resets.length, avgShift, flowMinutes }
}

function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveSessions(sessions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch {
    // ignore storage errors
  }
}

export function useSessionLog() {
  const [sessions, setSessions] = useState(() => loadSessions())
  const { user } = useAuth()

  useEffect(() => {
    if (!user || !supabase) return

    supabase
      .from('nervous_system_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error || !data) {
          if (error) console.error('[useSessionLog] fetch failed:', error.message)
          return
        }

        // Map Supabase rows to local shape
        const remote = data.map((row) => ({
          id: row.id,
          date: row.date,
          state: row.primary_state ?? null,
          resetCompleted: row.reset_completed,
          outcome: row.outcome ?? null,
          type: row.session_type ?? null,
          durationSec: row.duration_sec ?? null,
          shift: row.shift ?? null,
          flowMinutes: row.flow_minutes ?? 0,
          activationBefore: row.activation_before ?? null,
          activationAfter: row.activation_after ?? null,
          activationDelta: row.activation_delta ?? null,
          protocolUsed: row.protocol_used ?? null,
          protocolStartedAt: row.protocol_started_at ?? null,
          protocolCompletedAt: row.protocol_completed_at ?? null,
          recoveryDurationSeconds: row.recovery_duration_seconds ?? null,
          timestamp: row.created_at,
        }))

        // Merge: Supabase wins for authenticated sessions
        // Keep local-only entries that have no matching id in remote
        const remoteIds = new Set(remote.map((r) => r.id))
        const localOnly = loadSessions().filter((s) => !remoteIds.has(s.id))
        const merged = [...remote, ...localOnly]
        const trimmed = merged.length > MAX_SESSIONS
          ? merged.slice(merged.length - MAX_SESSIONS)
          : merged

        saveSessions(trimmed)
        setSessions(trimmed)
      })
  }, [user])

  const logSession = useCallback(async ({
    state,
    resetCompleted,
    outcome,
    type,
    durationSec,
    shift,
    flowMinutes,
    activationBefore,
    activationAfter,
    startedAt,
    protocolUsed,
  }) => {
    const now = new Date()
    const before = activationBefore ?? null
    const after = activationAfter ?? null
    const resolvedStartedAt = startedAt ?? null
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: now.toISOString().slice(0, 10),
      state: state ?? null,
      type: type ?? 'stealth',
      durationSec: durationSec ?? null,
      resetCompleted: Boolean(resetCompleted),
      outcome: outcome ?? null,
      shift: shift ?? null,
      flowMinutes: flowMinutes ?? 0,
      activationBefore: before,
      activationAfter: after,
      activationDelta: before != null && after != null ? after - before : null,
      protocolUsed: protocolUsed ?? null,
      protocolStartedAt: resolvedStartedAt,
      protocolCompletedAt: now.toISOString(),
      recoveryDurationSeconds: resolvedStartedAt
        ? Math.round((now.getTime() - new Date(resolvedStartedAt).getTime()) / 1000)
        : null,
      timestamp: now.toISOString(),
    }

    // Local update first — UI reflects immediately, no async delay
    setSessions((prev) => {
      const updated = [...prev, entry]
      const trimmed = updated.length > MAX_SESSIONS
        ? updated.slice(updated.length - MAX_SESSIONS)
        : updated
      saveSessions(trimmed)
      return trimmed
    })

    // Remote sync — fresh user_id fetched from auth on every write
    if (!supabase) return

    try {
      const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !authUser) {
        console.error('[useSessionLog] getUser failed:', authErr?.message ?? 'no session')
        return
      }

      const { data, error } = await supabase.from('nervous_system_sessions').insert({
        user_id:                   authUser.id,
        date:                      entry.date,
        primary_state:             entry.state,
        reset_completed:           entry.resetCompleted,
        outcome:                   entry.outcome,
        session_type:              entry.type,
        duration_sec:              entry.durationSec,
        shift:                     entry.shift,
        flow_minutes:              entry.flowMinutes,
        activation_before:         entry.activationBefore,
        activation_after:          entry.activationAfter,
        activation_delta:          entry.activationDelta,
        protocol_used:             entry.protocolUsed,
        protocol_started_at:       entry.protocolStartedAt,
        protocol_completed_at:     entry.protocolCompletedAt,
        recovery_duration_seconds: entry.recoveryDurationSeconds,
      })

      if (error) console.error('[useSessionLog] insert failed:', error.message)
    } catch (err) {
      console.error('[useSessionLog] insert threw:', err)
    }
  }, [])

  const clearSessions = useCallback(() => {
    saveSessions([])
    setSessions([])
    if (user && supabase) {
      supabase.from('nervous_system_sessions').delete().eq('user_id', user.id).then(({ error }) => {
        if (error) console.error('[useSessionLog] delete failed:', error.message)
      })
    }
  }, [user])

  return { sessions, logSession, clearSessions }
}
