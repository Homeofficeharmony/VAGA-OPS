const STATE_COLOR = {
  frozen: '#c4604a',
  anxious: '#c8a040',
  flow: '#52b87e',
}

const STATE_LABEL = {
  frozen: 'Frozen',
  anxious: 'Anxious',
  flow: 'Flow',
}

function relativeDate(dateStr) {
  if (!dateStr) return ''
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  const diff = Math.round((new Date(today) - new Date(dateStr)) / 86400000)
  return `${diff} days ago`
}

function formatType(type) {
  if (type === 'stealth') return 'Stealth Reset'
  if (type === 'panic') return 'Panic Reset'
  if (type === 'flow') return 'FlowLock'
  return type ?? 'Reset'
}

export default function SessionLogPanel({ sessions = [] }) {
  const recentSessions = sessions.slice(-6).reverse()

  return (
    <div className="flex flex-col gap-2">
      <span
        className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase"
        style={{ color: 'var(--text-secondary)' }}
      >
        Recent Sessions
      </span>

      {recentSessions.length === 0 && (
        <div className="text-[12px] py-2" style={{ color: 'var(--text-muted)' }}>
          No sessions logged yet
        </div>
      )}

      {recentSessions.map((s, i) => {
        const color = STATE_COLOR[s.state] ?? '#52b87e'
        const stateLabel = STATE_LABEL[s.state] ?? (s.state ?? 'Unknown')
        const typeLabel = formatType(s.type)
        const dateLabel = relativeDate(s.date)
        const dur = s.durationSec
          ? s.durationSec >= 60
            ? `${Math.round(s.durationSec / 60)} min`
            : `${s.durationSec} sec`
          : ''
        const shift = s.shift

        return (
          <div
            key={s.id ?? i}
            className="flex items-center gap-3 rounded-xl transition-colors"
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--bg-panel)',
              border: `1px solid ${i === 0 ? color + '30' : 'var(--border)'}`,
            }}
          >
            {/* State color dot */}
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />

            {/* Title + meta */}
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="text-[12px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {stateLabel} · {typeLabel}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {dateLabel}{dur ? ` · ${dur}` : ''}
              </span>
            </div>

            {/* Shift badge */}
            {shift != null && (
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-lg flex-shrink-0"
                style={{ backgroundColor: `${color}18` }}
              >
                <span className="text-[10px]" style={{ color }}>↑</span>
                <span className="text-[11px] font-semibold" style={{ color }}>
                  {shift > 0 ? '+' : ''}{shift}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
