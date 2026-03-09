import { useState, useCallback } from 'react'

const MAX_TAPS = 15
const MIN_TAPS = 8

/**
 * useHeartTap
 *
 * Captures tap timestamps to measure heart rate, then converts BPM
 * to a resonant-frequency breath timing. This guides the user from
 * their current physiological state toward RSA coherence (~6 bpm).
 *
 * Resonant Frequency Breathing targets ~6 breaths/min. Users with
 * elevated HR start slightly faster and are gently guided down by
 * the session protocol.
 */
export function useHeartTap() {
  const [timestamps, setTimestamps] = useState([])
  const [bpm, setBpm] = useState(null)
  const [rippleKey, setRippleKey] = useState(0)

  const tap = useCallback(() => {
    setRippleKey(k => k + 1)
    const now = Date.now()

    setTimestamps(prev => {
      const next = [...prev, now].slice(-MAX_TAPS)

      if (next.length >= 3) {
        const intervals = next.slice(1).map((t, i) => t - next[i])
        // Filter physiologically plausible intervals (30–200 bpm range)
        const valid = intervals.filter(v => v > 300 && v < 2000)
        if (valid.length >= 2) {
          const avg = valid.reduce((s, v) => s + v, 0) / valid.length
          setBpm(Math.round(60000 / avg))
        }
      }

      return next
    })
  }, [])

  const reset = useCallback(() => {
    setTimestamps([])
    setBpm(null)
    setRippleKey(0)
  }, [])

  const isReady = timestamps.length >= MIN_TAPS && bpm !== null

  /**
   * BPM → resonant breath timing
   *
   * Maps heart rate to a starting breath rate just above resonant
   * frequency (~6 breaths/min), meeting the user where they are.
   * Ratio: 40% inhale / 60% exhale for vagal brake activation.
   *
   * HR 55 → 5.5 bpm → 10.9s cycle → 4.4s / 6.5s
   * HR 75 → 6.0 bpm → 10.0s cycle → 4.0s / 6.0s
   * HR 100 → 8.0 bpm →  7.5s cycle → 3.0s / 4.5s
   */
  const calibratedTiming = (() => {
    if (!isReady || !bpm) return null
    const breathsPerMin = Math.max(5.5, Math.min(8.0, bpm * 0.08))
    const cycleSec = 60 / breathsPerMin
    return {
      inhale: Math.round(cycleSec * 0.4 * 1000),
      hold: 0,
      exhale: Math.round(cycleSec * 0.6 * 1000),
    }
  })()

  return {
    tap,
    reset,
    bpm,
    tapCount: timestamps.length,
    rippleKey,
    isReady,
    calibratedTiming,
  }
}
