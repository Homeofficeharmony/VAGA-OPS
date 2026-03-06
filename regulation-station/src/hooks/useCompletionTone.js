import { useRef } from 'react'

/**
 * useCompletionTone
 *
 * Returns a playTone(accentHex) function that plays a two-oscillator
 * completion chime using the Web Audio API. No external audio files needed.
 *
 * Frequencies:
 *   - 432 Hz sine, gain 0 → 0.3 over 0.05s, then fades to 0 over 1.2s
 *   - 540 Hz sine (octave-ish harmony), same envelope but peak gain 0.15
 *
 * Both oscillators run through a shared master gain node routed to
 * AudioContext.destination. AudioContext is created lazily on first call
 * to comply with browser autoplay policy.
 */
export function useCompletionTone() {
  const ctxRef = useRef(null)

  const playTone = async () => {
    try {
      // Lazily create AudioContext on first user-gesture-triggered call
      if (!ctxRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        if (!AudioCtx) return // Web Audio not supported
        ctxRef.current = new AudioCtx()
      }

      const ctx = ctxRef.current

      // Resume if the context was suspended (autoplay policy)
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      const now = ctx.currentTime

      // Master gain node
      const master = ctx.createGain()
      master.gain.value = 1
      master.connect(ctx.destination)

      // Helper: create one sine oscillator with the given frequency and peak gain
      const makeOsc = (freq, peakGain) => {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = freq

        const gainNode = ctx.createGain()
        gainNode.gain.setValueAtTime(0, now)
        // Ramp up to peak over 0.05s
        gainNode.gain.linearRampToValueAtTime(peakGain, now + 0.05)
        // Fade out over 1.2s
        gainNode.gain.linearRampToValueAtTime(0, now + 0.05 + 1.2)

        osc.connect(gainNode)
        gainNode.connect(master)

        osc.start(now)
        osc.stop(now + 0.05 + 1.2 + 0.05) // small buffer after fade

        return osc
      }

      makeOsc(432, 0.3)  // fundamental
      makeOsc(540, 0.15) // octave-ish harmony
    } catch (err) {
      console.error('[useCompletionTone] playTone failed:', err)
    }
  }

  return playTone
}
