import { useState, useEffect } from 'react'
import { ACCENT_HEX } from '../utils/colors'

const STATE_COLOR = {
  frozen:  ACCENT_HEX.red,
  anxious: ACCENT_HEX.amber,
  flow:    ACCENT_HEX.green,
}

function getTodayJournalKey() {
  return `vaga-journal-${new Date().toISOString().slice(0, 10)}`
}

/** For each of the last 5 days, compute the dominant state (most frequent that day). */
function getLast5DayStates(sessions) {
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (4 - i))
    return d.toISOString().slice(0, 10)
  })

  return days.map((date) => {
    const daySessions = sessions.filter((s) => s.date === date && s.state)
    if (daySessions.length === 0) return null
    const counts = {}
    for (const s of daySessions) {
      counts[s.state] = (counts[s.state] ?? 0) + 1
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
  })
}

export default function VagusLogSidebar({ isImmersive, streak, sessions = [] }) {
  const [log, setLog] = useState(() => {
    try { return localStorage.getItem(getTodayJournalKey()) || '' } catch { return '' }
  })
  const [isOpenMobile, setIsOpenMobile] = useState(false)

  useEffect(() => {
    try { localStorage.setItem(getTodayJournalKey(), log) } catch { /* storage unavailable */ }
  }, [log])

  if (!isImmersive) return null

  const sparklineStates = getLast5DayStates(sessions)

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpenMobile(!isOpenMobile)}
        className={`xl:hidden fixed ${isOpenMobile ? 'right-72' : 'right-4'} top-24 z-50 w-10 h-10 rounded-full bg-[#0A0D14]/90 border border-[#22262f] shadow-2xl flex items-center justify-center transition-all duration-300 backdrop-blur-md`}
      >
        <div className="relative w-5 h-5 flex flex-col items-center justify-center gap-1">
          <span className={`w-full h-0.5 bg-charcoal-400 transition-all duration-300 ${isOpenMobile ? 'rotate-45 translate-y-1.5' : ''}`} />
          <span className={`w-full h-0.5 bg-charcoal-400 transition-all duration-300 ${isOpenMobile ? 'opacity-0' : 'opacity-100'}`} />
          <span className={`w-full h-0.5 bg-charcoal-400 transition-all duration-300 ${isOpenMobile ? '-rotate-45 -translate-y-1.5' : ''}`} />
        </div>
      </button>

      <div className={`fixed right-0 xl:right-6 top-0 xl:top-1/2 xl:-translate-y-1/2 h-full xl:h-auto w-72 xl:w-64 bg-[#0A0D14]/95 xl:bg-[#0A0D14]/80 backdrop-blur-md border-l xl:border border-[#22262f] rounded-none xl:rounded-2xl p-5 z-40 flex flex-col gap-6 shadow-2xl transition-transform duration-300 ${isOpenMobile ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'}`}>

        {/* Title */}
        <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase text-charcoal-400 mt-12 xl:mt-0">
          Vagus Log
        </h3>

        {/* Streak Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-charcoal-700 to-[#0A0D14] border border-charcoal-600 flex items-center justify-center shadow-inner">
            <span className="text-lg">🔥</span>
          </div>
          <div>
            <div className="font-mono font-bold text-white tracking-widest">{streak > 0 ? streak : 0} DAY</div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-charcoal-500">Current Streak</div>
          </div>
        </div>

        <hr className="border-charcoal-800" />

        {/* Sparkline — real 5-day state history */}
        <div>
          <div className="font-mono text-[9px] tracking-widest uppercase text-charcoal-500 mb-2">State History (5 days)</div>
          <div className="h-10 w-full flex items-end gap-1">
            {sparklineStates.map((state, i) => {
              const color = state ? STATE_COLOR[state] : '#22262f'
              const heightPct = state === 'flow' ? 100 : state === 'anxious' ? 60 : state === 'frozen' ? 30 : 15
              return (
                <div
                  key={i}
                  className="w-full rounded-sm transition-all duration-500"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: color,
                    opacity: state ? 0.75 : 0.2,
                  }}
                  title={state ?? 'No data'}
                />
              )
            })}
          </div>
        </div>

        <hr className="border-charcoal-800" />

        {/* Mini Journal Input — persisted to localStorage, resets daily */}
        <div>
          <div className="font-mono text-[9px] tracking-widest uppercase text-charcoal-500 mb-2">Quick Log</div>
          <textarea
            value={log}
            onChange={(e) => setLog(e.target.value)}
            placeholder="How's the shift going..."
            rows={3}
            className="w-full bg-[#111318] border border-charcoal-700 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-charcoal-500 transition-colors resize-none"
          />
        </div>
      </div>
    </>
  )
}
