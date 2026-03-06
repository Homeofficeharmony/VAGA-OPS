/**
 * interpretWeeklySummary
 *
 * Pure, rule-based interpretation layer. Takes a weekly summary object and an
 * optional previous-week summary for trend comparisons. Returns the original
 * metrics plus an array of plain-language insight strings.
 *
 * Expects camelCase keys matching generateWeeklySummary() output:
 *   dominantState, dominantStateRatio, sessionCount,
 *   avgActivationBefore, avgActivationDelta, avgRecoveryTime,
 *   mostEffectiveProtocol, volatilityScore
 *
 * No external AI, no side effects, no async.
 */
export function interpretWeeklySummary(summary, prevSummary = null) {
  if (!summary) return { metrics: null, insights: [] }

  const insights = []

  const {
    dominantState,
    dominantStateRatio,
    sessionCount,
    avgActivationBefore,
    avgActivationDelta,
    avgRecoveryTime,
    mostEffectiveProtocol,
    volatilityScore,
  } = summary

  // ── No data ────────────────────────────────────────────────────────────────
  if (!sessionCount) {
    return {
      metrics: summary,
      insights: ['No sessions logged this week. Check in to start tracking.'],
    }
  }

  // ── Volatility ─────────────────────────────────────────────────────────────
  if (volatilityScore != null) {
    if (volatilityScore > 0.6) {
      insights.push('Your nervous system is highly reactive this week.')
    } else if (volatilityScore <= 0.2 && sessionCount > 2) {
      insights.push('Your nervous system has been stable this week.')
    }
  }

  // ── Protocol effectiveness ─────────────────────────────────────────────────
  if (avgActivationDelta != null) {
    if (avgActivationDelta > 2) {
      insights.push('Your protocols are working effectively.')
    } else if (avgActivationDelta > 0 && avgActivationDelta <= 2) {
      insights.push('Your protocols are having a mild effect — consistency will build momentum.')
    } else if (avgActivationDelta < -2) {
      insights.push('Your resets are delivering strong calming results.')
    }
  }

  // ── Recovery speed trend (requires previous week) ──────────────────────────
  if (avgRecoveryTime != null && prevSummary?.avgRecoveryTime != null) {
    const delta = avgRecoveryTime - prevSummary.avgRecoveryTime
    if (delta < -15) {
      insights.push('Recovery speed is improving.')
    } else if (delta > 30) {
      insights.push('Recovery is taking longer than last week — consider shorter protocols.')
    }
  }

  // ── Dominant state pattern ─────────────────────────────────────────────────
  if (dominantState && dominantStateRatio != null && dominantStateRatio > 0.5) {
    const label =
      dominantState === 'frozen'  ? 'Shutdown/Frozen' :
      dominantState === 'anxious' ? 'High Alert' :
      dominantState === 'flow'    ? 'Flow' :
      dominantState
    insights.push(`${label} is becoming a pattern — ${Math.round(dominantStateRatio * 100)}% of this week's sessions.`)
  }

  // ── High baseline activation ───────────────────────────────────────────────
  if (avgActivationBefore != null && avgActivationBefore >= 7) {
    insights.push('You\'re consistently starting sessions highly activated.')
  }

  // ── Protocol callout ──────────────────────────────────────────────────────
  if (mostEffectiveProtocol) {
    insights.push(`${mostEffectiveProtocol} is your most effective protocol this week.`)
  }

  // ── Fallback if nothing triggered ─────────────────────────────────────────
  if (insights.length === 0) {
    insights.push('Keep logging — more data will surface clearer patterns.')
  }

  return { metrics: summary, insights }
}
