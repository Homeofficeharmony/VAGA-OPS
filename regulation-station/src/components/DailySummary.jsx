import { getDailyStats } from '../hooks/useSessionLog'

function shiftDisplay(avgShift) {
  if (avgShift == null) return '—'
  if (avgShift > 0) return `↑ ${avgShift.toFixed(1)}`
  if (avgShift < 0) return `↓ ${Math.abs(avgShift).toFixed(1)}`
  return '→ 0'
}

export default function DailySummary({ sessions }) {
  const { resetCount, avgShift, flowMinutes } = getDailyStats(sessions)

  return (
    <div
      className="flex items-center rounded-[10px]"
      style={{
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        padding: '10px 14px',
        gap: '12px',
      }}
    >
      {/* Resets */}
      <div className="flex-1 flex flex-col items-center gap-1">
        <span className="text-[18px] font-bold" style={{ color: '#52b87e' }}>
          {resetCount}
        </span>
        <span className="text-[10px]" style={{ color: '#7a9b7c' }}>
          Resets today
        </span>
      </div>

      <div style={{ width: '1px', height: '36px', backgroundColor: '#263024' }} />

      {/* Avg shift */}
      <div className="flex-1 flex flex-col items-center gap-1">
        <span className="text-[18px] font-bold" style={{ color: '#52b87e' }}>
          {shiftDisplay(avgShift)}
        </span>
        <span className="text-[10px]" style={{ color: '#7a9b7c' }}>
          Avg shift
        </span>
      </div>

      <div style={{ width: '1px', height: '36px', backgroundColor: '#263024' }} />

      {/* Flow minutes */}
      <div className="flex-1 flex flex-col items-center gap-1">
        <span className="text-[18px] font-bold" style={{ color: '#52b87e' }}>
          {flowMinutes > 0 ? `${flowMinutes}m` : '—'}
        </span>
        <span className="text-[10px]" style={{ color: '#7a9b7c' }}>
          Flow minutes
        </span>
      </div>
    </div>
  )
}
