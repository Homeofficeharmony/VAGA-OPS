/**
 * useSessionMetrics
 *
 * Pure helper functions for computing pattern metrics from the local session log.
 * No Supabase calls — operates entirely on the sessions array from useSessionLog.
 *
 * Usage:
 *   import { computeMetrics, generateWeeklySummary } from './useSessionMetrics'
 *   const metrics = computeMetrics(sessions)
 *   const summary = generateWeeklySummary(sessions)
 */

const PERIOD_DAYS = 7

/** Returns a Set of ISO date strings (YYYY-MM-DD) for the last N days including today. */
function recentDateSet(days = PERIOD_DAYS) {
  const dates = new Set()
  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.add(d.toISOString().slice(0, 10))
  }
  return dates
}

function average(nums) {
  if (!nums.length) return null
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
}

function dominantKey(countMap) {
  let best = null
  let bestCount = -1
  for (const [key, count] of Object.entries(countMap)) {
    if (count > bestCount) { best = key; bestCount = count }
  }
  return bestCount > 0 ? best : null
}

/**
 * computeMetrics(sessions)
 *
 * Returns aggregate metrics across all sessions in the provided array.
 *
 * @param {Array} sessions - Full session log from useSessionLog
 * @returns {{
 *   averageActivation: number|null,
 *   averageDelta: number|null,
 *   averageRecoveryTime: number|null,
 *   stateFrequencyLast7Days: { frozen: number, anxious: number, flow: number }
 * }}
 */
export function computeMetrics(sessions) {
  if (!sessions || sessions.length === 0) {
    return {
      averageActivation: null,
      averageDelta: null,
      averageRecoveryTime: null,
      stateFrequencyLast7Days: { frozen: 0, anxious: 0, flow: 0 },
    }
  }

  const averageActivation = average(
    sessions.filter(s => s.activationBefore != null).map(s => s.activationBefore)
  )

  const averageDelta = average(
    sessions.filter(s => s.activationDelta != null).map(s => s.activationDelta)
  )

  const averageRecoveryTime = average(
    sessions
      .filter(s => s.resetCompleted && s.durationSec != null)
      .map(s => s.durationSec)
  )

  const recentDates = recentDateSet()
  const stateCounts = { frozen: 0, anxious: 0, flow: 0 }
  for (const s of sessions) {
    if (recentDates.has(s.date) && s.state && stateCounts[s.state] !== undefined) {
      stateCounts[s.state]++
    }
  }

  return {
    averageActivation,
    averageDelta,
    averageRecoveryTime,
    stateFrequencyLast7Days: stateCounts,
  }
}

/**
 * generateWeeklySummary(sessions)
 *
 * Computes a structured 7-day summary. Intended as the data foundation
 * for future AI narrative generation — returns plain JSON, no side effects.
 *
 * @param {Array} sessions - Full session log from useSessionLog
 * @returns {{
 *   dominantState: string|null,
 *   dominantStateRatio: number|null,
 *   sessionCount: number,
 *   avgActivationBefore: number|null,
 *   avgActivationDelta: number|null,
 *   avgRecoveryTime: number|null,
 *   mostEffectiveProtocol: string|null,
 *   volatilityScore: number|null,
 *   periodDays: number
 * }}
 */
export function generateWeeklySummary(sessions) {
  const empty = {
    dominantState: null,
    dominantStateRatio: null,
    sessionCount: 0,
    avgActivationBefore: null,
    avgActivationDelta: null,
    avgRecoveryTime: null,
    mostEffectiveProtocol: null,
    volatilityScore: null,
    periodDays: PERIOD_DAYS,
  }

  if (!sessions || sessions.length === 0) return empty

  const recentDates = recentDateSet()
  const recent = sessions.filter(s => recentDates.has(s.date))

  if (recent.length === 0) return empty

  // dominantState — most frequently logged state in the period
  const stateCounts = { frozen: 0, anxious: 0, flow: 0 }
  for (const s of recent) {
    if (s.state && stateCounts[s.state] !== undefined) stateCounts[s.state]++
  }
  const dominantState = dominantKey(stateCounts)
  const dominantCount = dominantState ? stateCounts[dominantState] : 0
  const dominantStateRatio = dominantState && recent.length > 0
    ? Math.round((dominantCount / recent.length) * 100) / 100
    : null

  // avgActivationBefore / avgActivationDelta
  const avgActivationBefore = average(
    recent.filter(s => s.activationBefore != null).map(s => s.activationBefore)
  )
  const avgActivationDelta = average(
    recent.filter(s => s.activationDelta != null).map(s => s.activationDelta)
  )

  // avgRecoveryTime — mean durationSec across completed resets
  const avgRecoveryTime = average(
    recent.filter(s => s.resetCompleted && s.durationSec != null).map(s => s.durationSec)
  )

  // mostEffectiveProtocol — protocol_used with highest average activationDelta
  // (negative delta = activation came down = effective for anxious/frozen)
  // We pick the protocol with the most negative average delta (greatest calming effect).
  const byProtocol = {}
  for (const s of recent) {
    if (!s.protocolUsed || s.activationDelta == null) continue
    if (!byProtocol[s.protocolUsed]) byProtocol[s.protocolUsed] = []
    byProtocol[s.protocolUsed].push(s.activationDelta)
  }

  let mostEffectiveProtocol = null
  let bestAvgDelta = Infinity
  for (const [protocol, deltas] of Object.entries(byProtocol)) {
    const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length
    if (avg < bestAvgDelta) { bestAvgDelta = avg; mostEffectiveProtocol = protocol }
  }

  // volatilityScore — proportion of consecutive session pairs that changed state
  // 0 = perfectly stable, 1 = changed state every session
  const sorted = [...recent].sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1))
  let transitions = 0
  for (let i = 1; i < sorted.length; i++) {
    if (
      sorted[i].state &&
      sorted[i - 1].state &&
      sorted[i].state !== sorted[i - 1].state
    ) {
      transitions++
    }
  }
  const volatilityScore = sorted.length > 1
    ? Math.round((transitions / (sorted.length - 1)) * 100) / 100
    : 0

  return {
    dominantState,
    dominantStateRatio,
    sessionCount: recent.length,
    avgActivationBefore,
    avgActivationDelta,
    avgRecoveryTime,
    mostEffectiveProtocol,
    volatilityScore,
    periodDays: PERIOD_DAYS,
  }
}
