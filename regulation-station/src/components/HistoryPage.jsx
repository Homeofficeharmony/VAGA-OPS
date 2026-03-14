import DailySummary from './DailySummary'
import SessionLogPanel from './SessionLogPanel'
import JournalEntry from './JournalEntry'
import ShiftTrajectoryChart from './ShiftTrajectoryChart'
import WeeklyConsistency from './WeeklyConsistency'

const STATE_COLOR = { frozen: '#c4604a', anxious: '#c8a040', flow: '#52b87e' }

function getWeekDays() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    days.push({
      dateStr: d.toISOString().slice(0, 10),
      label: ['S','M','T','W','T','F','S'][d.getDay()],
    })
  }
  return days
}

function dominantState(daySessions) {
  if (!daySessions.length) return null
  const counts = {}
  daySessions.forEach(s => { counts[s.state] = (counts[s.state] ?? 0) + 1 })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
}

function StatCard({ value, label, color }) {
  return (
    <div
      className="flex flex-col items-center gap-1 py-3 rounded-2xl"
      style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)', flex: 1 }}
    >
      <span className="text-[24px] font-light leading-none" style={{ color }}>
        {value}
      </span>
      <span className="text-[10px] font-mono tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  )
}

export default function HistoryPage({ sessions, streak }) {
  if (sessions.length === 0) {
    return (
      <div className="page-content flex flex-col items-center justify-center min-h-full px-6 py-16 page-enter text-center gap-5">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
          style={{ backgroundColor: '#52b87e14', border: '1px solid #52b87e30' }}
        >
          🌱
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-[20px] font-light tracking-wide" style={{ color: 'var(--text-primary)' }}>
            No sessions yet
          </h2>
          <p className="text-[13px] leading-relaxed max-w-[260px]" style={{ color: 'var(--text-muted)' }}>
            Complete your first reset on the Breathe page and your progress will appear here.
          </p>
        </div>
        <JournalEntry />
      </div>
    )
  }

  // Compute all-time stats
  const totalResets = sessions.filter(s => s.type === 'stealth' || s.type === 'panic').length
  const shifts = sessions.filter(s => s.shift != null).map(s => s.shift)
  const avgShift = shifts.length ? (shifts.reduce((a, b) => a + b, 0) / shifts.length) : null
  const totalFlowMin = sessions.filter(s => s.type === 'flow').reduce((sum, s) => sum + (s.flowMinutes || 0), 0)
  const flowDisplay = totalFlowMin >= 60
    ? `${Math.floor(totalFlowMin / 60)}h`
    : `${totalFlowMin}m`

  // Week strip
  const weekDays = getWeekDays()
  const sessionsByDate = {}
  sessions.forEach(s => {
    if (!sessionsByDate[s.date]) sessionsByDate[s.date] = []
    sessionsByDate[s.date].push(s)
  })

  return (
    <div className="page-content flex flex-col gap-5 px-6 py-10 max-w-md mx-auto page-enter">

      {/* Header + streak */}
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] font-light tracking-wide" style={{ color: 'var(--text-primary)' }}>
          Your Journey
        </h2>
        {streak > 0 && (
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{ backgroundColor: '#52b87e14', border: '1px solid #52b87e35' }}
          >
            <span className="text-[13px]">🔥</span>
            <span className="font-mono text-[11px]" style={{ color: '#52b87e' }}>
              {streak} day{streak !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* 3-stat row */}
      <div className="flex gap-2">
        <StatCard value={totalResets} label="Resets" color="var(--text-primary)" />
        <StatCard
          value={avgShift != null ? `+${avgShift.toFixed(1)}` : '—'}
          label="Avg Shift"
          color="#52b87e"
        />
        <StatCard value={totalFlowMin > 0 ? flowDisplay : '—'} label="Flow Time" color="#c8a040" />
      </div>

      {/* This Week dot strip */}
      <div
        className="flex flex-col gap-3 px-4 py-4 rounded-2xl"
        style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)' }}
      >
        <span className="font-mono text-[10px] tracking-[0.12em] uppercase" style={{ color: 'var(--text-secondary)' }}>
          This Week
        </span>
        <div className="flex justify-between">
          {weekDays.map(({ dateStr, label }) => {
            const daySessions = sessionsByDate[dateStr] ?? []
            const state = dominantState(daySessions)
            const color = state ? STATE_COLOR[state] : null
            return (
              <div key={dateStr} className="flex flex-col items-center gap-1.5">
                {color ? (
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ) : (
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ border: '1px solid var(--border)' }}
                  />
                )}
                <span className="text-[9px] font-mono" style={{ color: color ? 'var(--text-muted)' : 'var(--border)' }}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <DailySummary sessions={sessions} />
      <WeeklyConsistency sessions={sessions} />
      <ShiftTrajectoryChart sessions={sessions} />
      <SessionLogPanel sessions={sessions} />
      <JournalEntry />
    </div>
  )
}
