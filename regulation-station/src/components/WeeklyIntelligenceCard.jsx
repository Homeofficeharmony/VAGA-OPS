import { useEffect } from 'react'
import { useWeeklySummary } from '../hooks/useWeeklySummary'
import { generateWeeklySummary } from '../hooks/useSessionMetrics'
import { interpretWeeklySummary } from '../lib/interpretWeeklySummary'

const STATE_COLOR = {
  frozen:  '#c4604a',
  anxious: '#c8a040',
  flow:    '#52b87e',
}

const STATE_LABEL = {
  frozen:  'Shutdown / Frozen',
  anxious: 'High Alert',
  flow:    'Flow',
}

/** Normalize snake_case Supabase summary to camelCase for interpretWeeklySummary */
function normalizeSummary(s) {
  return {
    dominantState:       s.dominant_state ?? null,
    dominantStateRatio:  s.dominant_state_ratio ?? null,
    sessionCount:        s.session_count ?? 0,
    avgActivationBefore: s.average_activation_before ?? null,
    avgActivationDelta:  s.average_activation_delta ?? null,
    avgRecoveryTime:     s.average_recovery_duration_seconds ?? null,
    mostEffectiveProtocol: s.most_effective_protocol ?? null,
    volatilityScore:     s.volatility_score ?? null,
  }
}

function MetricRow({ label, value, valueColor }) {
  return (
    <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
      <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
      <span
        className="font-mono text-[12px] font-semibold tabular-nums"
        style={{ color: valueColor ?? 'var(--text-primary)' }}
      >
        {value}
      </span>
    </div>
  )
}

export default function WeeklyIntelligenceCard({ sessions = [] }) {
  const { summary, loading, error, refresh } = useWeeklySummary()

  useEffect(() => {
    refresh()
  }, [refresh])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="rounded-xl px-5 py-4 border"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-panel)' }}
      >
        <span className="font-mono text-[10px] tracking-widest uppercase text-charcoal-500">
          07-Day Intelligence — Loading…
        </span>
      </div>
    )
  }

  // ── Determine data source: online (Supabase) or offline (local sessions) ──
  let metrics = null
  if (!error && summary) {
    metrics = normalizeSummary(summary)
  } else if (sessions.length > 0) {
    metrics = generateWeeklySummary(sessions)
  }

  // ── No data yet ────────────────────────────────────────────────────────────
  if (!metrics || !metrics.sessionCount) {
    return (
      <div
        className="rounded-xl px-5 py-4 border"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-panel)' }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[10px] tracking-widest uppercase text-charcoal-500">
            07-Day Intelligence
          </span>
        </div>
        <p className="font-mono text-[11px] mt-2" style={{ color: 'var(--text-secondary)' }}>
          Not enough data yet — log a few sessions to unlock insights.
        </p>
      </div>
    )
  }

  const { insights } = interpretWeeklySummary(metrics)

  // ── Visual emphasis ────────────────────────────────────────────────────────
  const isWarning  = metrics.volatilityScore != null && metrics.volatilityScore > 0.6
  const isPositive = metrics.avgActivationDelta != null && metrics.avgActivationDelta > 2

  const accentColor = isWarning  ? '#c8a040'
                    : isPositive ? '#52b87e'
                    : '#3a4048'

  // ── Formatted values ──────────────────────────────────────────────────────
  const dominantColor = metrics.dominantState ? (STATE_COLOR[metrics.dominantState] ?? '#6b7280') : null
  const dominantLabel = metrics.dominantState ? (STATE_LABEL[metrics.dominantState] ?? metrics.dominantState) : '—'

  const activationBefore = metrics.avgActivationBefore != null
    ? `${metrics.avgActivationBefore} / 10`
    : '—'

  const activationDelta = metrics.avgActivationDelta != null
    ? (metrics.avgActivationDelta > 0 ? '+' : '') + metrics.avgActivationDelta
    : '—'

  const deltaColor = metrics.avgActivationDelta == null   ? 'var(--text-secondary)'
                   : metrics.avgActivationDelta >  2      ? '#52b87e'
                   : metrics.avgActivationDelta < -2      ? '#c4604a'
                   : 'var(--text-primary)'

  const recoveryMins = metrics.avgRecoveryTime != null
    ? `${Math.round(metrics.avgRecoveryTime / 60)} min`
    : '—'

  const volatilityPct = metrics.volatilityScore != null
    ? `${Math.round(metrics.volatilityScore * 100)}%`
    : '—'

  const volatilityColor = isWarning ? '#c8a040' : 'var(--text-primary)'

  const protocol = metrics.mostEffectiveProtocol ?? '—'

  return (
    <div
      className="rounded-xl px-5 py-4 border transition-all duration-300"
      style={{
        borderColor: accentColor + '50',
        backgroundColor: 'var(--bg-panel)',
        boxShadow: isWarning || isPositive ? `0 0 20px ${accentColor}12` : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] tracking-widest uppercase text-charcoal-500">
          07-Day Intelligence
        </span>
        <span
          className="font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded border"
          style={{ color: accentColor, borderColor: accentColor + '50', backgroundColor: accentColor + '12' }}
        >
          {isWarning ? 'Reactive' : isPositive ? 'Effective' : `${metrics.sessionCount} sessions`}
        </span>
      </div>

      {/* Dominant state chip */}
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-[10px] tracking-widest uppercase text-charcoal-500">
          Dominant State
        </span>
        <span
          className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded"
          style={{
            color: dominantColor ?? 'var(--text-secondary)',
            backgroundColor: dominantColor ? dominantColor + '18' : 'transparent',
            border: `1px solid ${dominantColor ? dominantColor + '40' : 'var(--border)'}`,
          }}
        >
          {dominantLabel}
        </span>
      </div>

      {/* Metrics grid */}
      <div className="mb-4">
        <MetricRow label="Avg Activation Before" value={activationBefore} />
        <MetricRow label="Avg Activation Delta"  value={activationDelta}  valueColor={deltaColor} />
        <MetricRow label="Avg Recovery Time"      value={recoveryMins} />
        <MetricRow label="Volatility Score"        value={volatilityPct}   valueColor={volatilityColor} />
        <MetricRow label="Best Protocol"           value={protocol}         valueColor={isPositive ? '#52b87e' : undefined} />
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div
          className="rounded-lg px-4 py-3 border-l-2"
          style={{ borderColor: accentColor, backgroundColor: accentColor + '0a' }}
        >
          <span className="font-mono text-[9px] tracking-widest uppercase mb-2 block" style={{ color: accentColor }}>
            Insights
          </span>
          <ul className="space-y-1">
            {insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
                <span className="text-[12px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {insight}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
