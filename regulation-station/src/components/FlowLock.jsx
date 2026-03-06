import { useState, useEffect, useRef } from 'react'
import { useCompletionTone } from '../hooks/useCompletionTone'

const TOTAL_SEC = 5400 // 90 minutes

export default function FlowLock({ open, accentHex, onComplete, onClose, todayIntention }) {
  const color = accentHex ?? '#52b87e'
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [intention, setIntention] = useState('')
  const [intentionLocked, setIntentionLocked] = useState(false)
  const intervalRef = useRef(null)
  const playTone = useCompletionTone()

  // Reset when opened
  useEffect(() => {
    if (open) {
      setElapsed(0)
      setRunning(false)
      setDone(false)
      setIntention(todayIntention || '')
      setIntentionLocked(false)
    }
  }, [open, todayIntention])

  // Keyboard: Esc to close
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && open) handleExit()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, elapsed]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed((e) => {
          if (e >= TOTAL_SEC) {
            clearInterval(intervalRef.current)
            setRunning(false)
            setDone(true)
            return TOTAL_SEC
          }
          return e + 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  useEffect(() => {
    if (done) playTone()
  }, [done]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleExit = () => {
    clearInterval(intervalRef.current)
    const minutes = Math.round(elapsed / 60)
    onComplete(minutes)
  }

  if (!open) return null

  const remaining = TOTAL_SEC - elapsed
  const hours = Math.floor(remaining / 3600)
  const minutes = Math.floor((remaining % 3600) / 60)
  const seconds = remaining % 60
  const timeStr = hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const elapsedMin = Math.round(elapsed / 60)

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* Subtle glow ring around content */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: `inset 0 0 120px ${color}08`,
        }}
      />

      {/* State label */}
      <div className="font-mono text-[11px] tracking-[0.3em] uppercase mb-3" style={{ color }}>
        Flow Lock
      </div>
      <div className="font-mono text-[10px] tracking-widest uppercase mb-6 text-charcoal-500">
        Protect the window · No interruptions
      </div>

      {/* Intention field — only shown before session starts */}
      {!running && !done && elapsed === 0 && (
        <div className="mb-8 w-full max-w-sm">
          {!intentionLocked ? (
            <div className="flex flex-col items-center gap-2">
              <label className="font-mono text-[9px] tracking-widest uppercase text-charcoal-500">
                What are you protecting this time for? (optional)
              </label>
              <div className="flex gap-2 w-full">
                <input
                  type="text"
                  value={intention}
                  onChange={(e) => setIntention(e.target.value.slice(0, 80))}
                  onKeyDown={(e) => { if (e.key === 'Enter' && intention.trim()) setIntentionLocked(true) }}
                  placeholder="e.g. ship the landing page"
                  className="flex-1 bg-transparent border-b text-sm font-mono focus:outline-none text-center transition-colors"
                  style={{ borderColor: color + '50', color: 'var(--text-primary)' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = color }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = color + '50' }}
                />
                {intention.trim() && (
                  <button
                    onClick={() => setIntentionLocked(true)}
                    className="font-mono text-[9px] tracking-widest uppercase px-2 py-1 rounded border transition-colors"
                    style={{ color, borderColor: color + '50' }}
                  >
                    Set
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 justify-center">
              <span className="font-mono text-[10px] tracking-widest uppercase text-charcoal-500">For:</span>
              <span className="font-mono text-sm" style={{ color }}>{intention}</span>
              <button
                onClick={() => setIntentionLocked(false)}
                className="font-mono text-[9px] text-charcoal-600 hover:text-charcoal-400 transition-colors"
              >
                edit
              </button>
            </div>
          )}
        </div>
      )}

      {/* Timer */}
      {done ? (
        <div className="text-center mb-12">
          <div className="font-mono text-6xl font-semibold mb-4" style={{ color }}>✓</div>
          <p className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            {intention
              ? `You protected ${elapsedMin} minute${elapsedMin !== 1 ? 's' : ''} for: ${intention}`
              : `You protected ${elapsedMin} minute${elapsedMin !== 1 ? 's' : ''} of deep work.`}
          </p>
          <p className="font-mono text-[11px] tracking-widest uppercase text-charcoal-500">
            Prefrontal online. Session complete.
          </p>
        </div>
      ) : (
        <div className="text-center mb-12">
          <div
            className="font-mono font-semibold tabular-nums mb-2"
            style={{ fontSize: '4.5rem', color: 'var(--text-primary)', lineHeight: 1 }}
          >
            {timeStr}
          </div>
          <div className="font-mono text-[10px] tracking-widest uppercase text-charcoal-500">
            {running ? `${elapsedMin}m elapsed` : elapsed > 0 ? 'Paused' : '90-minute session'}
          </div>
        </div>
      )}

      {/* Control */}
      {done ? (
        <button
          onClick={handleExit}
          className="font-mono text-sm tracking-widest uppercase px-12 py-3 rounded-xl border transition-all duration-200"
          style={{ borderColor: color + '60', color, backgroundColor: color + '15' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = color + '28' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = color + '15' }}
        >
          DONE
        </button>
      ) : (
        <button
          onClick={running ? () => setRunning(false) : () => setRunning(true)}
          className="font-mono text-sm tracking-widest uppercase px-12 py-3 rounded-xl border transition-all duration-200"
          style={{
            borderColor: color + '60',
            color: running ? 'var(--text-muted)' : color,
            backgroundColor: running ? 'var(--bg-panel-alt)' : color + '15',
          }}
          onMouseEnter={(e) => {
            if (!running) e.currentTarget.style.backgroundColor = color + '28'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = running ? 'var(--bg-panel-alt)' : color + '15'
          }}
        >
          {running ? 'PAUSE' : elapsed > 0 ? 'RESUME' : 'START SESSION'}
        </button>
      )}

      {/* Exit */}
      {!done && (
        <button
          onClick={handleExit}
          className="fixed bottom-8 font-mono text-[10px] tracking-widest uppercase transition-colors px-6 py-2 rounded-lg border"
          style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          EXIT FLOW LOCK
        </button>
      )}
    </div>
  )
}
