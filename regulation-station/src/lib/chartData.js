/**
 * chartData.js
 *
 * Pure chart data transforms -- no React, no side effects.
 * Input: session array from useSessionLog.
 * Output: chart-ready data shapes ({ x, y, label, color }).
 *
 * Consumed by Phase 5 chart components. No SVG path generation here --
 * that is Phase 5's responsibility.
 */

import { ACCENT_HEX } from '../utils/colors.js'

const STATE_COLOR = {
  frozen: ACCENT_HEX.red,
  anxious: ACCENT_HEX.amber,
  flow: ACCENT_HEX.green,
}

/**
 * Generate an array of ISO date strings (YYYY-MM-DD) for the given window.
 * Starts windowDays-1 days ago and ends today (inclusive).
 *
 * @param {number} windowDays
 * @returns {string[]}
 */
function getDateRange(windowDays) {
  return Array.from({ length: windowDays }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (windowDays - 1 - i))
    return d.toISOString().slice(0, 10)
  })
}

/**
 * getActivationComparison
 *
 * Returns a before/after pair for a single session's activation levels.
 * Used by DVIZ-01 (before/after bar or dot comparison chart).
 *
 * @param {{ activationBefore: number|null, activationAfter: number|null, state: string }} session
 * @returns {Array<{ x: string, y: number, label: string, color: string }>}
 *   Returns [] if either activation value is null (no data to compare).
 */
export function getActivationComparison(session) {
  if (session.activationBefore == null || session.activationAfter == null) {
    return []
  }
  const color = STATE_COLOR[session.state] ?? ACCENT_HEX.green
  return [
    {
      x: 'Before',
      y: session.activationBefore,
      label: `${session.activationBefore}/10`,
      color,
    },
    {
      x: 'After',
      y: session.activationAfter,
      label: `${session.activationAfter}/10`,
      color,
    },
  ]
}

/**
 * getShiftTrajectory
 *
 * Returns one data point per day for the given window.
 * Each point's y is the average shift across sessions that day,
 * or null if no sessions with recorded shift values exist for that day.
 *
 * Used by DVIZ-02 (shift-over-time trend line).
 * Phase 5 decides how to render null gaps (skip, interpolate, etc.).
 *
 * @param {Array} sessions - full session array from useSessionLog
 * @param {number} [window=7] - number of days (7 or 30)
 * @returns {Array<{ x: string, y: number|null, label: string, color: string }>}
 */
export function getShiftTrajectory(sessions, window = 7) {
  const dates = getDateRange(window)
  return dates.map((date) => {
    const dayShifts = sessions
      .filter((s) => s.date === date && s.shift != null)
      .map((s) => s.shift)
    if (dayShifts.length === 0) {
      return { x: date, y: null, label: '', color: '' }
    }
    const avg = dayShifts.reduce((sum, v) => sum + v, 0) / dayShifts.length
    return { x: date, y: avg, label: avg.toFixed(1), color: '' }
  })
}

/**
 * getDailyStateSeries
 *
 * Returns session counts per state per day, segmented into three arrays.
 * Used for state-segmented bar or area charts.
 *
 * @param {Array} sessions - full session array from useSessionLog
 * @param {number} [window=7] - number of days (7 or 30)
 * @returns {{
 *   frozen:  Array<{ x: string, y: number, color: string }>,
 *   anxious: Array<{ x: string, y: number, color: string }>,
 *   flow:    Array<{ x: string, y: number, color: string }>,
 * }}
 */
export function getDailyStateSeries(sessions, window = 7) {
  const dates = getDateRange(window)
  const frozen = []
  const anxious = []
  const flow = []

  for (const date of dates) {
    const daySessions = sessions.filter((s) => s.date === date)
    frozen.push({
      x: date,
      y: daySessions.filter((s) => s.state === 'frozen').length,
      color: ACCENT_HEX.red,
    })
    anxious.push({
      x: date,
      y: daySessions.filter((s) => s.state === 'anxious').length,
      color: ACCENT_HEX.amber,
    })
    flow.push({
      x: date,
      y: daySessions.filter((s) => s.state === 'flow').length,
      color: ACCENT_HEX.green,
    })
  }

  return { frozen, anxious, flow }
}
