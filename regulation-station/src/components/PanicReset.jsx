import { useState, useEffect, useRef } from 'react'
import { useCompletionTone } from '../hooks/useCompletionTone'
import VideoBackground from './VideoBackground'

const TOTAL = 30

export default function PanicReset({ open, accentHex, onComplete, onClose, stateId = 'anxious' }) {
  const color = accentHex ?? '#52b87e'
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const intervalRef = useRef(null)
  const startedAtRef = useRef(null)
  const playTone = useCompletionTone()

  // Reset when opened
  useEffect(() => {
    if (open) {
      setElapsed(0)
      setRunning(false)
      setDone(false)
      startedAtRef.current = null
    }
  }, [open])

  // Keyboard: Esc to close
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed((e) => {
          if (e >= TOTAL) {
            clearInterval(intervalRef.current)
            setRunning(false)
            setDone(true)
            return TOTAL
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
    if (done) {
      playTone()
      const t = setTimeout(
        () => onComplete({ activationBefore: null, startedAt: startedAtRef.current }),
        600
      )
      return () => clearTimeout(t)
    }
  }, [done, onComplete])

  if (!open) return null

  const remaining = TOTAL - elapsed
  const timeStr = `0:${String(remaining).padStart(2, '0')}`
  const progress = (elapsed / TOTAL) * 100

  return (
    <div className="fixed inset-0 z-[100] bg-[#050510]">
      <VideoBackground stateId={stateId} running={running} elapsedSec={elapsed} totalSec={TOTAL}>
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6">

          {done ? (
            /* Completion */
            <div className="flex flex-col items-center gap-4" style={{ animation: 'fadeIn 0.5s ease both' }}>
              <span className="font-mono text-6xl" style={{ color }}>✓</span>
              <p className="font-mono text-[11px] tracking-[0.25em] uppercase" style={{ color: color + '80' }}>
                reset complete
              </p>
            </div>
          ) : (
            /* Session */
            <div className="flex flex-col items-center gap-6 w-full max-w-xs">
              {/* Big countdown */}
              <span
                className="font-mono font-light tabular-nums text-white"
                style={{ fontSize: '80px', letterSpacing: '-0.04em', lineHeight: 1 }}
              >
                {timeStr}
              </span>

              {/* Instruction — fades in once running */}
              <p
                className="font-mono text-[12px] tracking-[0.2em] text-center transition-opacity duration-500"
                style={{ color: color + 'aa', opacity: running ? 1 : 0 }}
              >
                follow the glow · breathe slowly
              </p>

              {/* Progress bar */}
              <div className="w-full h-px rounded-full" style={{ backgroundColor: color + '20' }}>
                <div
                  className="h-full rounded-full transition-all duration-[900ms] ease-out"
                  style={{ width: `${progress}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}60` }}
                />
              </div>

              {/* Start / Pause button */}
              <button
                onClick={running ? () => setRunning(false) : () => {
                  if (!startedAtRef.current) startedAtRef.current = new Date().toISOString()
                  setRunning(true)
                }}
                className="w-full py-4 rounded-2xl font-mono text-sm tracking-[0.22em] uppercase transition-all duration-300"
                style={{
                  backgroundColor: running ? 'rgba(255,255,255,0.05)' : color + '1e',
                  border: `1px solid ${running ? 'rgba(255,255,255,0.12)' : color + '55'}`,
                  color: running ? '#9ca3af' : color,
                  boxShadow: running ? 'none' : `0 0 20px ${color}18`,
                }}
              >
                {running ? 'PAUSE' : elapsed > 0 ? 'RESUME' : 'START'}
              </button>
            </div>
          )}

          {/* Cancel */}
          {!done && (
            <button
              onClick={onClose}
              className="mt-10 font-mono text-[10px] tracking-widest uppercase transition-colors"
              style={{ color: 'rgba(255,255,255,0.25)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
            >
              cancel
            </button>
          )}
        </div>
      </VideoBackground>
    </div>
  )
}
