/**
 * tacticalAnalysis.js
 *
 * Pure rule engine — no React, no side effects.
 * Analyzes the session log and returns an ordered list of alerts.
 *
 * Alert shape:
 *   id          — unique string, used for dismiss tracking
 *   severity    — 'critical' | 'warning' | 'info'
 *   tag         — short uppercase label (e.g. "PATTERN DETECTED")
 *   title       — 1-line summary shown prominently
 *   body        — 1-2 sentence explanation
 *   cta         — label for the action button
 *   action      — token string dispatched to the host app: 'immersion' | 'panic' | 'flow' | null
 *
 * Only the highest-severity alert is typically shown at once.
 * Results are ordered: critical → warning → info.
 */

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 }

function msAgo(ms) {
  return Date.now() - ms
}

function isoToDate(ts) {
  return ts ? new Date(ts) : null
}

function withinHours(timestamp, hours) {
  if (!timestamp) return false
  return msAgo(isoToDate(timestamp).getTime()) < hours * 60 * 60 * 1000
}

function withinDays(timestamp, days) {
  return withinHours(timestamp, days * 24)
}

/**
 * analyzeSessions(sessions)
 *
 * @param {Array} sessions — full session array from useSessionLog
 * @returns {Array} alerts — sorted critical → warning → info, deduped by id
 */
export function analyzeSessions(sessions) {
  if (!sessions || sessions.length < 2) return []

  const today = new Date().toISOString().slice(0, 10)
  const alerts = []

  // ── Rule 1: Cortisol Loop ──────────────────────────────────────────────
  // 3+ anxious/frozen sessions today
  const stressToday = sessions.filter(s =>
    s.date === today && (s.state === 'anxious' || s.state === 'frozen')
  )
  if (stressToday.length >= 3) {
    const avgBefore = stressToday
      .filter(s => s.activationBefore != null)
      .reduce((sum, s, _, a) => sum + s.activationBefore / a.length, 0)

    alerts.push({
      id: `cortisol-loop-${today}`,
      severity: 'critical',
      tag: 'PATTERN DETECTED',
      title: `${stressToday.length} stress cycles logged today`,
      body: `Your system is cycling without resolution. An extended Immersion session breaks the cortisol feedback loop — 2 minutes of directed breath outperforms ${stressToday.length} short resets.${avgBefore >= 7 ? ` Average activation: ${avgBefore.toFixed(1)}/10.` : ''}`,
      cta: 'Initiate Immersion Mode',
      action: 'immersion',
    })
  }

  // ── Rule 2: Panic Overuse ──────────────────────────────────────────────
  // 2+ emergency resets in the last 24 hours
  const panicRecent = sessions.filter(s =>
    s.type === 'panic' && withinHours(s.timestamp, 24)
  )
  if (panicRecent.length >= 2) {
    alerts.push({
      id: `panic-overuse-${today}`,
      severity: 'warning',
      tag: 'PROTOCOL ADVISORY',
      title: `${panicRecent.length} emergency resets in 24h`,
      body: 'Repeated emergency resets indicate a systemic stress pattern, not isolated spikes. A longer protocol with binaural audio will address the root cause and extend your regulation window.',
      cta: 'Start Immersion Session',
      action: 'immersion',
    })
  }

  // ── Rule 3: Stagnant Recovery ──────────────────────────────────────────
  // Last 3 sessions with recorded deltas all showed no improvement
  const withDeltas = sessions.filter(s => s.activationDelta != null).slice(-3)
  if (
    withDeltas.length === 3 &&
    withDeltas.every(s => s.activationDelta >= 0)
  ) {
    alerts.push({
      id: 'stagnant-recovery',
      severity: 'warning',
      tag: 'SYSTEM STALL',
      title: 'No regulation shift in last 3 sessions',
      body: 'Your current protocol is not producing a measurable shift. Try pairing Immersion Mode with binaural audio — the dual input engages both auditory and somatic pathways simultaneously.',
      cta: 'Try Immersion + Binaural',
      action: 'immersion',
    })
  }

  // ── Rule 4: Protocol Abandonment ──────────────────────────────────────
  // 4+ of the last 10 sessions were abandoned early
  const recent10 = sessions.slice(-10)
  const abandoned = recent10.filter(s => s.resetCompleted === false).length
  if (abandoned >= 4) {
    alerts.push({
      id: 'protocol-abandonment',
      severity: 'info',
      tag: 'ENGAGEMENT SIGNAL',
      title: `${abandoned} of ${recent10.length} recent protocols abandoned`,
      body: 'Abandonment signals that the protocol length exceeds your current tolerance window — not a failure of discipline. The 30-second Panic Reset is engineered specifically for low-bandwidth moments.',
      cta: 'Use Quick Reset',
      action: 'panic',
    })
  }

  // ── Rule 5: Flow State Drought ─────────────────────────────────────────
  // User has been active (3+ sessions in 3 days) but zero flow sessions
  const in3Days = sessions.filter(s => withinDays(s.timestamp, 3))
  const flowIn3Days = in3Days.filter(s => s.type === 'flow')
  if (in3Days.length >= 3 && flowIn3Days.length === 0) {
    alerts.push({
      id: `flow-drought-${today}`,
      severity: 'info',
      tag: 'OPPORTUNITY SIGNAL',
      title: 'No flow sessions in 3 days',
      body: "You've been running the regulation protocol without entering the flow state. A 90-minute Flow Lock session extends your ventral vagal window and compounds regulation over time.",
      cta: 'Enter Flow State',
      action: 'flow',
    })
  }

  // Sort: critical first, then warning, then info
  return alerts.sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  )
}
