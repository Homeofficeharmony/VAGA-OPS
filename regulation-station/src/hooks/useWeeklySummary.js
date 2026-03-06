import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// ─── Pure computation helpers ─────────────────────────────────────────────────

function average(nums) {
  const valid = nums.filter((n) => n != null && !Number.isNaN(n))
  if (!valid.length) return null
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10
}

function dominantValue(values) {
  if (!values.length) return null
  const counts = {}
  for (const v of values) {
    if (v == null) continue
    counts[v] = (counts[v] ?? 0) + 1
  }
  let best = null
  let bestCount = 0
  for (const [key, count] of Object.entries(counts)) {
    if (count > bestCount) { best = key; bestCount = count }
  }
  return best
}

/** Protocol with the highest (most negative) average activation_delta. */
function mostEffectiveProtocol(rows) {
  const byProtocol = {}
  for (const row of rows) {
    if (!row.protocol_used || row.activation_delta == null) continue
    if (!byProtocol[row.protocol_used]) byProtocol[row.protocol_used] = []
    byProtocol[row.protocol_used].push(row.activation_delta)
  }
  let best = null
  let bestAvg = Infinity
  for (const [protocol, deltas] of Object.entries(byProtocol)) {
    const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length
    if (avg < bestAvg) { bestAvg = avg; best = protocol }
  }
  return best
}

/** Number of consecutive state changes / (total logs - 1). Range: 0–1. */
function volatilityScore(rows) {
  if (rows.length < 2) return 0
  const sorted = [...rows].sort((a, b) =>
    (a.created_at ?? '') > (b.created_at ?? '') ? 1 : -1
  )
  let transitions = 0
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].primary_state
    const curr = sorted[i].primary_state
    if (prev && curr && prev !== curr) transitions++
  }
  return Math.round((transitions / (sorted.length - 1)) * 100) / 100
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useWeeklySummary
 *
 * Queries nervous_system_sessions for the last 7 days and computes a structured
 * summary. Returns { summary, loading, error, refresh }.
 *
 * summary shape:
 *   {
 *     dominant_state,              // string | null
 *     average_activation_before,   // number | null  (1–10 scale)
 *     average_activation_delta,    // number | null  (negative = calming)
 *     average_recovery_duration_seconds, // number | null
 *     most_effective_protocol,     // string | null
 *     volatility_score,            // number 0–1 | null
 *   }
 */
export function useWeeklySummary() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!supabase) {
      setError('Supabase not configured — running in offline mode.')
      return
    }
    if (!user) return  // auth still loading — effect re-runs once user is set

    setLoading(true)
    setError(null)

    try {
      // Timestamp 7 days ago (inclusive) — filter on created_at since date
      // column may not exist on all deployed instances of the table.
      const since = new Date()
      since.setDate(since.getDate() - 6)
      since.setHours(0, 0, 0, 0)

      const { data, error: queryErr } = await supabase
        .from('nervous_system_sessions')
        .select(
          'primary_state, activation_before, activation_delta, ' +
          'recovery_duration_seconds, protocol_used, created_at'
        )
        .eq('user_id', user.id)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true })

      if (queryErr) {
        console.error('[useWeeklySummary] query failed:', queryErr.message)
        setError(queryErr.message)
        return
      }

      if (!data || data.length === 0) {
        setSummary({
          dominant_state: null,
          dominant_state_ratio: null,
          session_count: 0,
          average_activation_before: null,
          average_activation_delta: null,
          average_recovery_duration_seconds: null,
          most_effective_protocol: null,
          volatility_score: null,
        })
        return
      }

      const dominant = dominantValue(data.map((r) => r.primary_state))
      const dominantCount = dominant
        ? data.filter((r) => r.primary_state === dominant).length
        : 0

      setSummary({
        dominant_state: dominant,
        dominant_state_ratio: dominant
          ? Math.round((dominantCount / data.length) * 100) / 100
          : null,
        session_count: data.length,
        average_activation_before: average(data.map((r) => r.activation_before)),
        average_activation_delta: average(data.map((r) => r.activation_delta)),
        average_recovery_duration_seconds: average(
          data.map((r) => r.recovery_duration_seconds)
        ),
        most_effective_protocol: mostEffectiveProtocol(data),
        volatility_score: volatilityScore(data),
      })
    } catch (err) {
      console.error('[useWeeklySummary] unexpected error:', err)
      setError(err.message ?? 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [user])

  return { summary, loading, error, refresh }
}
