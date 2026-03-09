import { useMemo, useState } from 'react'
import { analyzeSessions } from '../lib/tacticalAnalysis'

const SEVERITY_STYLE = {
  critical: { color: '#ef4444', label: '▲' },
  warning:  { color: '#f59e0b', label: '◆' },
  info:     { color: '#60a5fa', label: '◉' },
}

/**
 * TacticalAdvisor
 *
 * Analyses the session log on every render via a memoized rule engine.
 * Surfaces the highest-priority unresolved alert as a dismissable HUD card.
 *
 * Props:
 *   sessions      — full session array from useSessionLog
 *   onAction(id)  — called with 'immersion' | 'panic' | 'flow' when CTA is clicked
 */
export default function TacticalAdvisor({ sessions, onAction }) {
  // Track which alert IDs the user has dismissed this session
  const [dismissed, setDismissed] = useState(new Set())

  const alerts = useMemo(() => analyzeSessions(sessions), [sessions])

  // Pick first alert that hasn't been dismissed
  const alert = alerts.find(a => !dismissed.has(a.id))

  if (!alert) return null

  const { color, label } = SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE.info

  const dismiss = () => setDismissed(prev => new Set([...prev, alert.id]))

  const handleCta = () => {
    if (onAction && alert.action) onAction(alert.action)
    dismiss()
  }

  return (
    <div
      className="w-full mb-4"
      style={{ animation: 'fadeInUp 0.45s ease both' }}
      role="alert"
      aria-live="polite"
    >
      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{
          border: `1px solid ${color}35`,
          backgroundColor: `${color}06`,
          boxShadow: `0 0 24px ${color}0a, inset 0 1px 0 ${color}15`,
        }}
      >
        {/* Top scan-line accent */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ backgroundColor: `${color}30` }}
        />

        <div className="px-4 py-3.5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              {/* Severity indicator */}
              <span
                className="font-mono text-[10px] shrink-0"
                style={{ color }}
              >
                {label}
              </span>
              {/* Tag */}
              <span
                className="font-mono text-[9px] tracking-[0.24em] uppercase shrink-0"
                style={{ color: `${color}90` }}
              >
                {alert.tag}
              </span>
            </div>

            {/* Dismiss */}
            <button
              onClick={dismiss}
              className="font-mono text-[9px] tracking-wider uppercase shrink-0 focus:outline-none transition-colors duration-150"
              style={{ color: `${color}40` }}
              onMouseEnter={e => e.currentTarget.style.color = `${color}99`}
              onMouseLeave={e => e.currentTarget.style.color = `${color}40`}
              aria-label="Dismiss alert"
            >
              ✕ dismiss
            </button>
          </div>

          {/* Title */}
          <p
            className="font-mono text-sm font-medium mb-1.5 leading-snug"
            style={{ color, letterSpacing: '-0.01em' }}
          >
            {alert.title}
          </p>

          {/* Body */}
          <p
            className="text-[11px] leading-relaxed mb-3"
            style={{ color: 'var(--text-muted)' }}
          >
            {alert.body}
          </p>

          {/* CTA */}
          {alert.cta && (
            <button
              onClick={handleCta}
              className="font-mono text-[10px] tracking-[0.2em] uppercase px-4 py-2 rounded-xl focus:outline-none transition-all duration-200"
              style={{
                color,
                border: `1px solid ${color}40`,
                backgroundColor: `${color}10`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = `${color}1e`
                e.currentTarget.style.borderColor = `${color}70`
                e.currentTarget.style.boxShadow = `0 0 16px ${color}14`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = `${color}10`
                e.currentTarget.style.borderColor = `${color}40`
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {alert.cta} →
            </button>
          )}
        </div>

        {/* Bottom scan-line accent */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ backgroundColor: `${color}15` }}
        />
      </div>

      {/* Remaining alert count badge — if multiple alerts pending */}
      {alerts.filter(a => !dismissed.has(a.id)).length > 1 && (
        <p
          className="font-mono text-[9px] tracking-wider text-right mt-1 pr-1"
          style={{ color: 'var(--text-muted)' }}
        >
          +{alerts.filter(a => !dismissed.has(a.id)).length - 1} more signal{alerts.filter(a => !dismissed.has(a.id)).length - 1 > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
