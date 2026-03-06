import { useState, useEffect, useRef } from 'react'

/**
 * RAF-based breath timer with configurable phase durations.
 * Designed for ImmersionContainer — does not affect other breath-timer consumers.
 *
 * @param {boolean} running
 * @param {{ inhale: number, hold: number, exhale: number }} timing — milliseconds per phase
 *   hold may be 0 (no hold phase is inserted)
 *
 * Returns:
 *   phase           — 'inhale' | 'hold' | 'exhale'
 *   phaseProgress   — 0→1 within current phase
 *   phaseRemainingSec — ceil seconds left in current phase (for countdown display)
 *   cyclePct        — 0→1 overall cycle progress (for any arc/ring use)
 */
export function useImmersionBreath(running, timing) {
  const [elapsedMs, setElapsedMs] = useState(0)
  const rafRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    if (!running) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      setElapsedMs(0)
      startRef.current = null
      return
    }

    const loop = (t) => {
      if (startRef.current === null) startRef.current = t
      setElapsedMs(t - startRef.current)
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [running])

  const { inhale = 4000, hold = 0, exhale = 8000 } = timing ?? {}
  const cycleMs = inhale + hold + exhale
  const cycleElapsed = cycleMs > 0 ? elapsedMs % cycleMs : 0

  let phase, phaseElapsedMs, phaseDuration

  if (cycleElapsed < inhale) {
    phase = 'inhale'
    phaseElapsedMs = cycleElapsed
    phaseDuration = inhale
  } else if (hold > 0 && cycleElapsed < inhale + hold) {
    phase = 'hold'
    phaseElapsedMs = cycleElapsed - inhale
    phaseDuration = hold
  } else {
    phase = 'exhale'
    phaseElapsedMs = cycleElapsed - inhale - (hold > 0 ? hold : 0)
    phaseDuration = exhale
  }

  const phaseProgress = phaseDuration > 0 ? Math.min(1, phaseElapsedMs / phaseDuration) : 0
  const phaseRemainingSec = Math.max(0, Math.ceil((phaseDuration - phaseElapsedMs) / 1000))
  const cyclePct = cycleMs > 0 ? cycleElapsed / cycleMs : 0

  return { phase, phaseProgress, phaseRemainingSec, cyclePct }
}
