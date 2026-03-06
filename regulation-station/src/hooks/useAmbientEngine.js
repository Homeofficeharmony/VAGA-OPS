import { useRef, useState, useCallback, useEffect } from 'react'

function generateBrownNoiseBuffer(ctx) {
  const sampleRate = ctx.sampleRate
  const bufferSize = sampleRate * 3
  const buffer = ctx.createBuffer(2, bufferSize, sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    let lastOut = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      lastOut = (lastOut + 0.02 * white) / 1.02
      data[i] = lastOut * 3.5
    }
  }
  return buffer
}

function generatePinkNoiseBuffer(ctx) {
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

/**
 * useAmbientEngine
 *
 * Web Audio API ambient soundscape engine.
 * Forest: brown noise + slow LFO tremolo (0.3 Hz)
 * Ocean:  pink noise + band-pass 300–1200 Hz + slow LFO sweep (0.08 Hz)
 * Binaural: sine tones left/right (carrier + beat offset)
 * Silence: stops audio
 */
export function useAmbientEngine() {
  const ctxRef = useRef(null)
  const nodesRef = useRef([])
  const masterGainRef = useRef(null)
  const [activeId, setActiveId] = useState('silence')
  const [volume, setVolumeState] = useState(0.7)

  const teardown = useCallback(() => {
    for (const node of nodesRef.current) {
      try { node.stop?.() } catch { /* already stopped */ }
    }
    nodesRef.current = []
    masterGainRef.current = null
  }, [])

  const ensureCtx = useCallback(async () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (ctxRef.current.state === 'suspended') {
      await ctxRef.current.resume()
    }
    return ctxRef.current
  }, [])

  const startForest = useCallback(async (vol) => {
    const ctx = await ensureCtx()
    teardown()
    const master = ctx.createGain()
    master.gain.value = vol
    masterGainRef.current = master

    const buffer = generateBrownNoiseBuffer(ctx)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true

    const lpf = ctx.createBiquadFilter()
    lpf.type = 'lowpass'
    lpf.frequency.value = 800
    lpf.Q.value = 0.5

    // Slow tremolo LFO: 0.3 Hz, depth 0.15
    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 0.3
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 0.15
    const tremoloBase = ctx.createGain()
    tremoloBase.gain.value = 0.85

    lfo.connect(lfoGain)
    lfoGain.connect(tremoloBase.gain)
    source.connect(lpf)
    lpf.connect(tremoloBase)
    tremoloBase.connect(master)
    master.connect(ctx.destination)

    source.start()
    lfo.start()
    nodesRef.current = [source, lfo]
  }, [ensureCtx, teardown])

  const startOcean = useCallback(async (vol) => {
    const ctx = await ensureCtx()
    teardown()
    const master = ctx.createGain()
    master.gain.value = vol
    masterGainRef.current = master

    const buffer = generatePinkNoiseBuffer(ctx)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true

    const bpf = ctx.createBiquadFilter()
    bpf.type = 'bandpass'
    bpf.frequency.value = 750
    bpf.Q.value = 0.5

    // Very slow LFO sweep: 0.08 Hz simulating wave rhythm
    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 0.08
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 0.35
    const sweepBase = ctx.createGain()
    sweepBase.gain.value = 0.65

    lfo.connect(lfoGain)
    lfoGain.connect(sweepBase.gain)
    source.connect(bpf)
    bpf.connect(sweepBase)
    sweepBase.connect(master)
    master.connect(ctx.destination)

    source.start()
    lfo.start()
    nodesRef.current = [source, lfo]
  }, [ensureCtx, teardown])

  const startBinaural = useCallback(async (vol, carrierHz = 200, beatHz = 10) => {
    const ctx = await ensureCtx()
    teardown()
    const master = ctx.createGain()
    master.gain.value = vol * 0.5
    masterGainRef.current = master

    const merger = ctx.createChannelMerger(2)
    const leftOsc = ctx.createOscillator()
    const rightOsc = ctx.createOscillator()
    leftOsc.type = 'sine'
    rightOsc.type = 'sine'
    leftOsc.frequency.value = carrierHz
    rightOsc.frequency.value = carrierHz + beatHz

    const leftGain = ctx.createGain()
    const rightGain = ctx.createGain()
    leftGain.gain.setValueAtTime(0, ctx.currentTime)
    leftGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5)
    rightGain.gain.setValueAtTime(0, ctx.currentTime)
    rightGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5)

    leftOsc.connect(leftGain)
    rightOsc.connect(rightGain)
    leftGain.connect(merger, 0, 0)
    rightGain.connect(merger, 0, 1)
    merger.connect(master)
    master.connect(ctx.destination)

    leftOsc.start()
    rightOsc.start()
    nodesRef.current = [leftOsc, rightOsc]
  }, [ensureCtx, teardown])

  const stop = useCallback(() => {
    teardown()
    if (ctxRef.current?.state === 'running') {
      ctxRef.current.suspend()
    }
  }, [teardown])

  const setVolume = useCallback((v) => {
    setVolumeState(v)
    if (masterGainRef.current && ctxRef.current) {
      masterGainRef.current.gain.linearRampToValueAtTime(v, ctxRef.current.currentTime + 0.05)
    }
  }, [])

  const select = useCallback(async (id, stateData = null) => {
    setActiveId(id)
    const vol = volume
    if (id === 'forest') await startForest(vol)
    else if (id === 'ocean') await startOcean(vol)
    else if (id === 'binaural') {
      const track = stateData?.audio?.tracks?.[0]
      await startBinaural(vol, track?.carrierHz ?? 200, track?.beatHz ?? 10)
    } else stop()
  }, [startForest, startOcean, startBinaural, stop, volume])

  useEffect(() => {
    return () => {
      teardown()
      ctxRef.current?.close()
      ctxRef.current = null
    }
  }, [teardown])

  return { activeId, select, volume, setVolume }
}
