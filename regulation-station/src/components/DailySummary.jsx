import { getDailyStats } from '../hooks/useSessionLog'

function shiftArrow(avgShift) {
  if (avgShift == null) return null
  if (avgShift > 0.5) return '↑'
  if (avgShift >= -0.5) return '→'
  return '↓'
}

export default function DailySummary({ sessions }) {
  const { resetCount, avgShift, flowMinutes } = getDailyStats(sessions)

  const arrow = shiftArrow(avgShift)

  if (resetCount === 0) {
    return (
      <div
        className="flex items-center gap-4 rounded-lg px-4 py-2 mb-4 border"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-panel)' }}
      >
        <span className="font-mono text-[10px] tracking-widest uppercase text-charcoal-500">
          Today
        </span>
        <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
          No resets yet today — first one is the hardest.
        </span>
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-4 rounded-lg px-4 py-2 mb-4 border"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-panel)' }}
    >
      <span className="font-mono text-[10px] tracking-widest uppercase text-charcoal-500">
        Today
      </span>
      <div className="flex items-center gap-3 font-mono text-[11px]">
        <span style={{ color: 'var(--text-secondary)' }}>
          {resetCount} reset{resetCount !== 1 ? 's' : ''}
        </span>
        {arrow && (
          <>
            <span className="text-charcoal-700">·</span>
            <span
              style={{ color: 'var(--text-secondary)' }}
              title="avg activation change after resets"
            >
              Shift: <span style={{ color: 'var(--accent-flow)' }}>{arrow}</span>
            </span>
          </>
        )}
        {flowMinutes > 0 && (
          <>
            <span className="text-charcoal-700">·</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent-flow)' }}>{flowMinutes}m</span> flow
            </span>
          </>
        )}
      </div>
    </div>
  )
}
