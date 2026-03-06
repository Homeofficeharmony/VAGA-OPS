import { useState, useEffect, useRef } from 'react'
import { useCompletionTone } from '../hooks/useCompletionTone'
import VideoBackground from './VideoBackground'

const TOTAL = 30

export default function PanicReset({ open, accentHex, onComplete, onClose, stateId = 'anxious' }) {
  const color = accentHex ?? '#52b87e'
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [activationBefore, setActivationBefore] = useState(null)
  const intervalRef = useRef(null)
  const startedAtRef = useRef(null)
  const activationBeforeRef = useRef(null)
  const playTone = useCompletionTone()

  // Keep ref in sync with state so the done-effect always reads the current value,
  // even though it doesn't re-register when activationBefore changes.
  activationBeforeRef.current = activationBefore

  // Reset when opened
  useEffect(() => {
    if (open) {
      setElapsed(0)
      setRunning(false)
      setDone(false)
      setActivationBefore(null)
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
        () => onComplete({ activationBefore: activationBeforeRef.current, startedAt: startedAtRef.current }),
        600
      )
      return () => clearTimeout(t)
    }
  }, [done, onComplete])

  if (!open) return null

  const remaining = TOTAL - elapsed
  const timeStr = `0:${String(remaining).padStart(2, '0')}`

  return (
    <div className="fixed inset-0 z-[100] bg-[#050510]">
      <VideoBackground stateId={stateId} running={running} elapsedSec={elapsed} totalSec={TOTAL}>
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-black/40 backdrop-blur-sm">

          {/* Structured Card matching Stealth Reset */}
          <div className="relative w-full max-w-2xl bg-[#1D1B1B]/60 border border-[#2A2A2A] rounded-xl overflow-hidden p-8 shadow-2xl backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-8">

              {/* Left Column: Timer block */}
              <div className="flex flex-col items-center justify-center w-full sm:w-32 flex-shrink-0">
                <div className="h-20 flex items-center justify-center mb-4">
                  {done ? (
                    <span style={{ color }} className="text-4xl font-mono">&#10003;</span>
                  ) : (
                    <span className="font-mono text-4xl font-bold tracking-widest text-white leading-none tabular-nums"
                      style={{
                        opacity: running ? 0 : 1,
                        transition: 'opacity 0.5s',
                        textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                      }}>
                      {timeStr}
                    </span>
                  )}
                </div>

                {/* Large Action Button */}
                {!done && (
                  <button
                    onClick={running ? () => setRunning(false) : () => {
                      if (!startedAtRef.current) startedAtRef.current = new Date().toISOString()
                      setRunning(true)
                    }}
                    className="w-full py-2.5 rounded-lg text-xs font-mono font-bold tracking-[0.2em] transition-all duration-300 border uppercase shadow-lg"
                    style={{
                      borderColor: color,
                      color: running ? '#9ca3af' : color,
                      backgroundColor: running ? 'rgba(0,0,0,0.4)' : color + '20',
                      boxShadow: running ? 'none' : `0 4px 15px ${color}30`
                    }}
                    onMouseEnter={(e) => {
                      if (!running) {
                        e.currentTarget.style.backgroundColor = color + '30'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!running) {
                        e.currentTarget.style.backgroundColor = color + '20'
                        e.currentTarget.style.transform = 'none'
                      }
                    }}
                  >
                    {running ? 'PAUSE' : elapsed > 0 ? 'RESUME' : 'START'}
                  </button>
                )}
              </div>

              {/* Right Column: Content block */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-baseline gap-3 mb-4">
                  <h3 className="font-bold text-2xl text-white tracking-wide" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Emergency Reset</h3>
                  <span className="text-sm font-mono text-charcoal-400 tracking-wider">30-Sec Protocol</span>
                </div>

                <div className="rounded-xl p-5 border-l-2 relative overflow-hidden transition-all duration-500 bg-[#1E1E1E]/60 backdrop-blur-sm" style={{ borderColor: color }}>
                  {running || elapsed > 0 ? (
                    <p className="text-[15px] leading-relaxed font-medium h-[48px] flex items-center" style={{ color: '#f1f5f9' }}>
                      Follow the expanding glow to inhale, hold steady if pausing, and follow it back down to exhale.
                    </p>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-mono text-[10px] tracking-widest uppercase flex-shrink-0" style={{ color: color + '80' }}>
                          Activation
                        </span>
                        <div className="flex gap-1">
                          {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                            <button
                              key={n}
                              onClick={() => setActivationBefore(n)}
                              className="w-5 h-5 rounded text-[9px] font-mono font-bold transition-all duration-150"
                              style={{
                                backgroundColor: activationBefore === n ? color : color + '18',
                                color: activationBefore === n ? '#0f1410' : color,
                                border: `1px solid ${color}40`,
                              }}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className="text-[14px] italic" style={{ color: '#94a3b8' }}>
                        Press START. Let the glow guide your breath.
                      </p>
                    </div>
                  )}
                </div>

                {/* Progress bar indicator */}
                <div className="mt-6 flex gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-[rgba(50,50,50,0.5)] overflow-hidden shadow-sm">
                    <div className="h-full rounded-full transition-all duration-[800ms] ease-out"
                      style={{
                        width: `${(elapsed / TOTAL) * 100}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 8px ${color}60`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="mt-8 font-mono text-[10px] tracking-widest uppercase transition-colors px-6 py-2 rounded-lg border text-gray-400 hover:text-white border-[#22262f] hover:border-gray-500 bg-black/50"
          >
            CANCEL
          </button>
        </div>
      </VideoBackground>
    </div>
  )
}
