const STATE_COLOR = {
  frozen: '#c4604a',
  anxious: '#c8a040',
  flow: '#52b87e',
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatType(type) {
  if (type === 'stealth') return 'Stealth Reset'
  if (type === 'panic') return 'Panic Reset'
  if (type === 'flow') return 'FlowLock'
  return type ?? 'Reset'
}

export default function SessionLogPanel({ sessions = [] }) {
  const today = new Date().toISOString().slice(0, 10)
  const todaySessions = sessions.filter(s => s.date === today).slice(-6).reverse()

  return (
    <div
      className="rounded-[10px] flex flex-col gap-2.5"
      style={{
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        padding: '16px',
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="font-mono text-[10px] font-semibold tracking-[0.06em] uppercase"
          style={{ color: '#7a9b7c' }}
        >
          Session Log
        </span>
        <span className="text-[10px]" style={{ color: '#4a6b4c' }}>
          Today · {todaySessions.length} {todaySessions.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {todaySessions.length === 0 && (
        <div className="text-[11px] py-2" style={{ color: '#4a6b4c' }}>
          No sessions yet today
        </div>
      )}

      {todaySessions.map((s, i) => {
        const color = STATE_COLOR[s.state] ?? '#52b87e'
        const stateLabel = s.state ? s.state.charAt(0).toUpperCase() + s.state.slice(1) : 'Unknown'
        const typeLabel = formatType(s.type)
        const time = formatTime(s.timestamp)
        const dur = s.durationSec ? (s.durationSec >= 60 ? `${Math.round(s.durationSec / 60)} min` : `${s.durationSec} sec`) : ''
        const shift = s.shift

        return (
          <div
            key={s.id ?? i}
            className="flex items-center gap-2 rounded-md"
            style={{
              padding: '8px 10px',
              backgroundColor: i === 0 ? color + '12' : 'var(--bg-panel)',
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <div className="flex flex-col gap-px flex-1 min-w-0">
              <span className="text-[11px] font-medium truncate" style={{ color: i === 0 ? 'var(--text-primary)' : '#c0d4c2' }}>
                {stateLabel} → {typeLabel}
              </span>
              <span className="text-[10px]" style={{ color: '#7a9b7c' }}>
                {time}{dur ? ` · ${dur}` : ''}
              </span>
            </div>
            {shift != null && (
              <span className="text-xs font-bold flex-shrink-0" style={{ color }}>
                {shift > 0 ? '+' : ''}{shift}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
