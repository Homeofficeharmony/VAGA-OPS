import { useRef, useState, useEffect, useCallback } from 'react'

/**
 * Binaural beat engine using the Web Audio API.
 *
 * How binaural beats work:
 *   Play carrierHz in the LEFT ear, (carrierHz + beatHz) in the RIGHT ear.
 *   The brain perceives a phantom oscillation at beatHz — the entrainment target.
 *   REQUIRES STEREO HEADPHONES. Speakers collapse the stereo field.
 *
 * Pink noise is generated using Paul Kellett's algorithm and mixed under
 * the tones to mask tinnitus and provide a pleasant ambient texture.
 */

function generatePinkNoiseBuffer(ctx) {
  // 3 seconds of pink noise, looped — avoids audible seams
  const sampleRate = ctx.sampleRate
  const bufferSize = sampleRate * 3
  const buffer = ctx.createBuffer(2, bufferSize, sampleRate)

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926
    }
  }
  return buffer
}

export function useAudioEngine({ carrierHz, beatHz }) {
  const ctxRef       = useRef(null)
  const leftOscRef   = useRef(null)
  const rightOscRef  = useRef(null)
  const noiseRef     = useRef(null)
  const masterGainRef = useRef(null)
  const noiseGainRef = useRef(null)
  const toneGainRef  = useRef(null)
  const analyserRef  = useRef(null)

  const [playing, setPlaying]   = useState(false)
  const [volume, setVolume]     = useState(0.7)
  const [supported, setSupported] = useState(true)

  // Tear down all audio nodes
  const teardown = useCallback(() => {
    try {
      leftOscRef.current?.stop()
      rightOscRef.current?.stop()
      noiseRef.current?.stop()
    } catch (_) { /* already stopped */ }
    leftOscRef.current  = null
    rightOscRef.current = null
    noiseRef.current    = null
    analyserRef.current = null
  }, [])

  // Build the audio graph
  const buildGraph = useCallback((ctx) => {
    teardown()

    const master    = ctx.createGain()
    const tonesGain = ctx.createGain()
    const noiseGain = ctx.createGain()

    master.gain.value    = volume
    tonesGain.gain.value = 0.18   // tones are quiet — subliminal, not foreground
    noiseGain.gain.value = 0.55   // pink noise carries most of the perceived volume

    masterGainRef.current = master
    toneGainRef.current   = tonesGain
    noiseGainRef.current  = noiseGain

    // ── Binaural oscillators ────────────────────────────────────────────
    // Must be routed to separate stereo channels for the effect to work.
    const merger = ctx.createChannelMerger(2)

    const leftOsc  = ctx.createOscillator()
    const rightOsc = ctx.createOscillator()
    leftOsc.type  = 'sine'
    rightOsc.type = 'sine'
    leftOsc.frequency.value  = carrierHz
    rightOsc.frequency.value = carrierHz + beatHz

    // Soft ramp-in to avoid click artifacts
    const leftGain  = ctx.createGain()
    const rightGain = ctx.createGain()
    leftGain.gain.setValueAtTime(0, ctx.currentTime)
    leftGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5)
    rightGain.gain.setValueAtTime(0, ctx.currentTime)
    rightGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5)

    leftOsc.connect(leftGain)
    rightOsc.connect(rightGain)

    // channel 0 = left ear, channel 1 = right ear
    leftGain.connect(merger, 0, 0)
    rightGain.connect(merger, 0, 1)

    merger.connect(tonesGain)
    tonesGain.connect(master)

    leftOsc.start()
    rightOsc.start()
    leftOscRef.current  = leftOsc
    rightOscRef.current = rightOsc

    // ── Pink noise ──────────────────────────────────────────────────────
    const noiseBuffer = generatePinkNoiseBuffer(ctx)
    const noiseSource = ctx.createBufferSource()
    noiseSource.buffer = noiseBuffer
    noiseSource.loop   = true

    // Low-pass filter to warm the noise slightly
    const lpf = ctx.createBiquadFilter()
    lpf.type            = 'lowpass'
    lpf.frequency.value = 4000
    lpf.Q.value         = 0.5

    noiseSource.connect(lpf)
    lpf.connect(noiseGain)
    noiseGain.connect(master)
    noiseSource.start()
    noiseRef.current = noiseSource

    const analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    master.connect(analyser)
    analyser.connect(ctx.destination)
    analyserRef.current = analyser
  }, [carrierHz, beatHz, volume, teardown])

  // Play
  const play = useCallback(async () => {
    if (!window.AudioContext && !window.webkitAudioContext) {
      setSupported(false)
      return
    }

    // Create context on first user gesture (browser autoplay policy)
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }

    const ctx = ctxRef.current
    if (ctx.state === 'suspended') await ctx.resume()

    buildGraph(ctx)
    setPlaying(true)
  }, [buildGraph])

  // Pause — suspends context to save CPU
  const pause = useCallback(async () => {
    teardown()
    if (ctxRef.current?.state === 'running') {
      await ctxRef.current.suspend()
    }
    setPlaying(false)
  }, [teardown])

  // Volume control (live, no rebuild needed)
  const applyVolume = useCallback((v) => {
    setVolume(v)
    if (masterGainRef.current) {
      masterGainRef.current.gain.linearRampToValueAtTime(
        v,
        ctxRef.current.currentTime + 0.05
      )
    }
  }, [])

  // Rebuild graph when frequencies change (state switch)
  useEffect(() => {
    if (playing && ctxRef.current) {
      buildGraph(ctxRef.current)
    }
  }, [carrierHz, beatHz]) // eslint-disable-line react-hooks/exhaustive-deps

  // Full cleanup on unmount
  useEffect(() => {
    return () => {
      teardown()
      ctxRef.current?.close()
      ctxRef.current = null
    }
  }, [teardown])

  return { playing, play, pause, volume, setVolume: applyVolume, supported, analyserRef }
}
