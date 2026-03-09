import { useCallback, useMemo } from 'react'

/**
 * useHaptics
 *
 * Thin wrapper around the Web Vibration API.
 * Emits distinct haptic patterns matched to breath phases
 * to physically reinforce vagus nerve stimulation.
 *
 * Patterns are intentionally gentle — designed to feel like a
 * soft somatic cue, not a notification.
 */

// Phase-specific vibration patterns (milliseconds)
const PATTERNS = {
  inhale:  [100],             // single soft swell
  exhale:  [40, 50, 40],     // two gentle taps — signals release
  complete:[60, 40, 60, 40, 120], // session complete flourish
}

export function useHaptics() {
  const isSupported = useMemo(
    () => typeof navigator !== 'undefined' && 'vibrate' in navigator,
    []
  )

  const pulse = useCallback((pattern) => {
    if (!isSupported) return
    try { navigator.vibrate(pattern) } catch { /* silently ignore — some browsers restrict */ }
  }, [isSupported])

  const inhale   = useCallback(() => pulse(PATTERNS.inhale),   [pulse])
  const exhale   = useCallback(() => pulse(PATTERNS.exhale),   [pulse])
  const complete = useCallback(() => pulse(PATTERNS.complete), [pulse])

  return { isSupported, pulse, inhale, exhale, complete }
}
