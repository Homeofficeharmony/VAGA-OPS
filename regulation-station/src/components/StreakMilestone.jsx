import { useState, useEffect } from 'react'

const MILESTONES = [3, 7, 14, 30, 60, 100]
const STORAGE_KEY = 'vaga-milestones'

const MILESTONE_COPY = {
  3:   { label: '3-Day Streak', message: 'Three consecutive days. The nervous system is starting to learn the pattern.' },
  7:   { label: '7-Day Streak', message: 'One full week of regulation practice. This is becoming a protocol.' },
  14:  { label: '14-Day Streak', message: 'Two weeks in. Vagal tone measurably builds at this frequency of practice.' },
  30:  { label: '30-Day Streak', message: 'Thirty days. Neuroplasticity has done its work. This is who you are now.' },
  60:  { label: '60-Day Streak', message: 'Two months of daily practice. You\'ve built something rare.' },
  100: { label: '100-Day Streak', message: 'One hundred days. Operator-grade nervous system regulation.' },
}

function loadAcknowledged() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function markAcknowledged(day) {
  const current = loadAcknowledged()
  if (!current.includes(day)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, day]))
  }
}

export default function StreakMilestone({ streak }) {
  const [activeMilestone, setActiveMilestone] = useState(null)

  useEffect(() => {
    if (!MILESTONES.includes(streak)) return
    const acknowledged = loadAcknowledged()
    if (acknowledged.includes(streak)) return
    setActiveMilestone(streak)
  }, [streak])

  const dismiss = () => {
    markAcknowledged(activeMilestone)
    setActiveMilestone(null)
  }

  if (!activeMilestone) return null

  const copy = MILESTONE_COPY[activeMilestone]

  return (
    <div className="fixed bottom-6 left-1/2 z-50 animate-slide-up">
      <div
        className="rounded-xl px-5 py-4 flex items-start gap-4 min-w-[300px] max-w-sm shadow-panel"
        style={{
          background: '#111318',
          border: '1px solid rgba(0,255,136,0.35)',
          boxShadow: '0 0 40px rgba(0,255,136,0.1), 0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <div className="text-xl leading-none mt-0.5 select-none">🔥</div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[10px] tracking-widest uppercase text-[#00ff88] mb-1">
            {copy.label}
          </div>
          <div className="text-xs text-slate-300 leading-relaxed">
            {copy.message}
          </div>
        </div>
        <button
          onClick={dismiss}
          className="font-mono text-[11px] text-charcoal-500 hover:text-slate-300 transition-colors leading-none mt-0.5 flex-shrink-0"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
