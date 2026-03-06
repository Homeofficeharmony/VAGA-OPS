const STATE_COLOR = {
  frozen: '#c4604a',
  anxious: '#c8a040',
  flow: '#52b87e',
}

const LEGEND = [
  { color: '#c4604a', label: 'Frozen' },
  { color: '#c8a040', label: 'Anxious' },
  { color: '#52b87e', label: 'Flow' },
  { color: '#22262f', label: 'None' },
]

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

function getLast7Days() {
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

function getDayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1]
}

function isToday(dateStr) {
  return dateStr === new Date().toISOString().slice(0, 10)
}

export default function WeeklyConsistency({ sessions }) {
  const days = getLast7Days()

  // Index sessions by date → last state of that day
  const sessionMap = {}
  for (const s of sessions) {
    sessionMap[s.date] = s.state
  }

  const activeDays = days.filter((d) => sessionMap[d]).length

  return (
    <div
      className="rounded-xl px-5 py-3 border"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-panel)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] tracking-widest uppercase text-charcoal-500">
          Practice Log — Last 7 Days
        </span>
        <span className="font-mono text-[10px] text-charcoal-500 tabular-nums">
          {activeDays}/7
        </span>
      </div>

      <div className="flex items-end gap-1 sm:gap-2">
        {days.map((dateStr) => {
          const state = sessionMap[dateStr]
          const color = state ? STATE_COLOR[state] : null
          const today = isToday(dateStr)
          const label = getDayLabel(dateStr)

          return (
            <div key={dateStr} className="flex flex-col items-center gap-1.5 flex-1">
              {/* Bar */}
              <div
                className="w-full rounded-sm transition-all duration-500"
                style={{
                  height: '28px',
                  backgroundColor: color ? color + '22' : '#1a1d23',
                  border: `1px solid ${color ? color + '60' : '#22262f'}`,
                  boxShadow: color ? `0 0 8px ${color}20` : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {color && (
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-sm"
                    style={{
                      height: '100%',
                      backgroundColor: color + '30',
                    }}
                  />
                )}
              </div>

              {/* Dot indicator */}
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: color ?? '#22262f',
                  boxShadow: color ? `0 0 6px ${color}80` : 'none',
                }}
              />

              {/* Day label */}
              <span
                className="font-mono text-[8px] tracking-widest uppercase tabular-nums"
                style={{ color: today ? '#6b7280' : '#3a404d' }}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Color legend */}
      <div className="flex items-center gap-4 mt-3">
        {LEGEND.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="font-mono text-[8px] tracking-widest uppercase" style={{ color: '#3a404d' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
