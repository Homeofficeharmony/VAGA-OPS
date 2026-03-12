import { useState, useEffect, useRef, useCallback } from 'react'
import { useImmersionBreath } from '../hooks/useImmersionBreath'
import { useCompletionTone } from '../hooks/useCompletionTone'
import { useHaptics } from '../hooks/useHaptics'
import { useHeartTap } from '../hooks/useHeartTap'
import { useContentRotation } from '../hooks/useContentRotation'
import CompletionBurst from './CompletionBurst'

// ── Color-field transition utility ────────────────────────────────────
function lerpHex(hexA, hexB, t) {
  const parse = (h) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ]
  const [ar, ag, ab] = parse(hexA)
  const [br, bg, bb] = parse(hexB)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const b = Math.round(ab + (bb - ab) * t)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

const SETTLED_HUE = '#1a1f1a'

const BREATH_TIMING = {
  frozen:  { inhale: 4000, hold: 0,    exhale: 8000 },
  anxious: { inhale: 4000, hold: 2000, exhale: 8000 },
  flow:    { inhale: 4000, hold: 0,    exhale: 6000 },
}

const STABILIZE_DURATION = { frozen: 120, anxious: 180, flow: 120 }

// Per-state welcome copy — brief, instructional, not philosophical
const WELCOME = {
  frozen: {
    headline: 'Lifting you out of shutdown',
    body: 'Your system is in low activation. This session uses extended exhales to gently wake your nervous system without spiking arousal.',
    tip: 'Feel your feet on the floor before you begin.',
  },
  anxious: {
    headline: 'Clearing the cortisol loop',
    body: 'Your nervous system is running hot. A longer exhale activates the vagal brake — your body\'s built-in off switch for the stress response.',
    tip: 'Drop your shoulders before you begin.',
  },
  flow: {
    headline: 'Deepening your window',
    body: 'You\'re already regulated. This session sustains and deepens your ventral vagal tone so you can protect the work ahead.',
    tip: 'Soften your gaze and let your jaw unclench.',
  },
}

const GROUNDING_PHRASES = {
  frozen:  ['Feel the weight of your body in the chair.', 'Gravity is holding you. You need not hold yourself.', 'The floor is solid. The room is still.', 'You are doing enough. This breath is enough.', 'Warmth is returning. Let it spread slowly.'],
  anxious: ["Each exhale is your nervous system's reset.", 'Soften the jaw. Drop the shoulders. Release the grip.', 'This moment is safe. The next one will be too.', 'Your exhale is twice as long. Your system is listening.', 'The body needs cues, not arguments. Keep breathing.'],
  flow:    ['You are inside your window of tolerance.', 'Let the gaze soften. Periphery expands.', 'Breath and body are already aligned.', 'You are not preparing to work. You are already working.', 'Sustain this. Protect this window.'],
}

const BREATH_LABEL = { inhale: 'Breathe in', hold: 'Hold', exhale: 'Breathe out' }

// Shared exit button — always accessible
function ExitButton({ onClose, accent }) {
  return (
    <button
      onClick={onClose}
      className="absolute top-5 right-6 font-mono text-[10px] tracking-[0.22em] uppercase transition-colors duration-200 focus:outline-none"
      style={{ color: accent + '50', cursor: 'pointer' }}
      onMouseEnter={e => e.currentTarget.style.color = accent + 'cc'}
      onMouseLeave={e => e.currentTarget.style.color = accent + '50'}
      title="Exit immersion (Esc)"
    >
      ✕ exit
    </button>
  )
}

// Shared ambient background
function AmbientBg({ accent }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{ background: `radial-gradient(ellipse at 50% 50%, ${accent}0a 0%, transparent 62%)` }}
    />
  )
}

// The breathing orb — blended orbital point and expansive core
function BreathOrb({ accent, orbScale, bloomScale, bloomOpacity, timing, isExhale, breathPhase, phaseProgress }) {
  // Calculate angle for the orbiting point.
  // Inhale: 0 to 180 degrees (top to bottom on right side).
  // Exhale: 180 to 360 degrees (bottom to top on left side).
  // Hold: stationary at 180 (bottom).
  let angle = 0;
  if (breathPhase === 'inhale') {
    angle = phaseProgress * Math.PI; // 0 to PI
  } else if (breathPhase === 'hold') {
    angle = Math.PI; // Stay at bottom
  } else {
    angle = Math.PI + (phaseProgress * Math.PI); // PI to 2PI
  }

  // Orbit radius
  const R = 90;
  // Center point
  const C = 100;
  
  // Adjusted so 0 is at the top (subtract PI/2)
  const x = C + R * Math.cos(angle - Math.PI / 2);
  const y = C + R * Math.sin(angle - Math.PI / 2);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
      {/* Outward bloom on exhale */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          border: `1px solid ${accent}`,
          transform: `scale(${bloomScale})`,
          opacity: bloomOpacity,
        }}
      />
      {/* Central glowing core (breathes) */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 80, height: 80,
          backgroundColor: accent + '0c',
          boxShadow: `0 0 ${Math.round(40 + orbScale * 24)}px ${Math.round(10 + orbScale * 14)}px ${accent}16`,
          transform: `scale(${orbScale})`,
          transition: `transform ${isExhale ? timing.exhale : (breathPhase === 'hold' ? 100 : timing.inhale)}ms ease-in-out`,
        }}
      />
      {/* Inner stable track */}
      <div
        className="absolute inset-[35%] rounded-full opacity-60"
        style={{
          border: `1px solid ${accent}40`,
          boxShadow: `inset 0 0 10px ${accent}20`
        }}
      />
      
      {/* Main outer track (orbital path) */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: R * 2, height: R * 2,
          border: `1px solid var(--border)`,
          opacity: 0.3,
          strokeDasharray: '2 6',
        }}
      />
      
      {/* Traveling point (Singularity) */}
      <div
        className="absolute rounded-full"
        style={{
          width: 8, height: 8,
          backgroundColor: accent,
          boxShadow: `0 0 12px 4px ${accent}60`,
          left: x - 4, // center the 8px dot
          top: y - 4,
          transition: 'left 0.1s linear, top 0.1s linear' // smooth micro-ticks
        }}
      />
    </div>
  )
}

// ── Heart Rate Calibration Pane ────────────────────────────────────────
function CalibrationPane({ accent, tap, bpm, tapCount, rippleKey, isReady, calibratedTiming, onLock, onCancel }) {
  const MIN_TAPS = 8

  return (
    <div
      className="relative w-full max-w-sm flex flex-col items-center text-center"
      style={{ animation: 'fadeIn 0.5s ease both' }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-7">
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
        <span
          className="font-mono text-[10px] tracking-[0.28em] uppercase"
          style={{ color: accent }}
        >
          HRV Calibration
        </span>
        <button
          onClick={onCancel}
          className="ml-3 font-mono text-[9px] tracking-wider uppercase focus:outline-none transition-colors duration-150"
          style={{ color: accent + '45' }}
          onMouseEnter={e => e.currentTarget.style.color = accent + 'aa'}
          onMouseLeave={e => e.currentTarget.style.color = accent + '45'}
        >
          cancel
        </button>
      </div>

      <p className="font-mono text-[11px] tracking-[0.2em] uppercase mb-7" style={{ color: 'var(--text-muted)' }}>
        Tap in rhythm with your heartbeat
      </p>

      {/* Tap orb */}
      <div className="relative flex items-center justify-center mb-8" style={{ width: 150, height: 150 }}>
        {/* Ripple — re-mounts on every tap via key */}
        {rippleKey > 0 && (
          <div
            key={rippleKey}
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              border: `1.5px solid ${accent}`,
              animation: 'hrv-ripple 0.75s ease-out forwards',
            }}
          />
        )}
        {/* Tap button */}
        <button
          onClick={tap}
          className="absolute inset-0 rounded-full focus:outline-none select-none"
          style={{
            backgroundColor: accent + (tapCount > 0 ? '14' : '08'),
            border: `1.5px solid ${accent}${tapCount > 0 ? '70' : '28'}`,
            boxShadow: tapCount > 0
              ? `0 0 40px ${accent}20, inset 0 0 20px ${accent}0a`
              : 'none',
            transition: 'background-color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
          }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)' }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          {bpm ? (
            <div className="flex flex-col items-center pointer-events-none">
              <span
                className="font-mono font-light tabular-nums leading-none"
                style={{ color: accent, fontSize: '38px', letterSpacing: '-0.03em' }}
              >
                {bpm}
              </span>
              <span className="font-mono text-[9px] tracking-[0.22em] uppercase mt-1" style={{ color: accent + '70' }}>
                bpm
              </span>
            </div>
          ) : (
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase pointer-events-none" style={{ color: accent + '50' }}>
              tap here
            </span>
          )}
        </button>
      </div>

      {/* Tap progress — 8 dots */}
      <div className="flex items-center gap-2 mb-6">
        {Array.from({ length: MIN_TAPS }).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: 6,
              height: 6,
              backgroundColor: i < tapCount ? accent : accent + '20',
              transform: i < tapCount ? 'scale(1)' : 'scale(0.65)',
            }}
          />
        ))}
        <span className="font-mono text-[9px] ml-1.5" style={{ color: accent + '55' }}>
          {Math.min(tapCount, MIN_TAPS)}/{MIN_TAPS}
        </span>
      </div>

      {/* Computed timing preview — shown when locked */}
      {isReady && calibratedTiming && (
        <div
          className="w-full flex items-center justify-center gap-3 mb-5 px-4 py-3 rounded-xl font-mono text-[10px]"
          style={{ border: `1px solid ${accent}25`, backgroundColor: `${accent}08`, animation: 'fadeIn 0.5s ease both' }}
        >
          <span style={{ color: accent + '80' }}>Signal locked</span>
          <span style={{ color: accent, fontWeight: 600 }}>
            {(calibratedTiming.inhale / 1000).toFixed(1)}s in
          </span>
          <span style={{ color: accent + '40' }}>·</span>
          <span style={{ color: accent, fontWeight: 600 }}>
            {(calibratedTiming.exhale / 1000).toFixed(1)}s out
          </span>
        </div>
      )}

      {/* Lock / waiting */}
      {isReady && calibratedTiming ? (
        <button
          onClick={onLock}
          className="w-full py-4 rounded-2xl font-mono text-[11px] tracking-[0.25em] uppercase focus:outline-none transition-all duration-300"
          style={{
            backgroundColor: accent + '1e',
            border: `1px solid ${accent}50`,
            color: accent,
            boxShadow: `0 0 28px ${accent}18`,
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = accent + '2e'; e.currentTarget.style.boxShadow = `0 0 38px ${accent}28` }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = accent + '1e'; e.currentTarget.style.boxShadow = `0 0 28px ${accent}18` }}
        >
          Lock Signal → Begin
        </button>
      ) : (
        <div
          className="w-full py-4 rounded-2xl font-mono text-[11px] tracking-[0.25em] uppercase text-center select-none"
          style={{ border: `1px solid ${accent}15`, color: accent + '30' }}
        >
          {tapCount === 0 ? 'Waiting for signal…' : `${MIN_TAPS - tapCount} more tap${MIN_TAPS - tapCount !== 1 ? 's' : ''}…`}
        </div>
      )}
    </div>
  )
}

export default function ImmersionContainer({ open, stateData, ambientEngine, onComplete, onClose, onBreathPhaseChange }) {
  // phases: 'welcome' | 'stabilize' | 'integrate'
  const [phase, setPhase]             = useState('welcome')
  const [breathElapsed, setBreathElapsed] = useState(0)
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [activation, setActivation]   = useState(5)
  const [integElapsed, setIntegElapsed] = useState(0)
  const [visible, setVisible]         = useState(false)
  const [showCalibration, setShowCalibration] = useState(false)
  const [calibratedTiming, setCalibratedTiming] = useState(null)
  const [showBurst, setShowBurst]     = useState(false)

  const startedAtRef    = useRef(null)
  const playToneRef     = useRef(null)
  const hapticCompleteRef = useRef(null)
  const activationRef   = useRef(5)

  const playTone = useCompletionTone()
  playToneRef.current = playTone

  const { inhale: hapticInhale, exhale: hapticExhale, complete: hapticComplete } = useHaptics()
  hapticCompleteRef.current = hapticComplete

  const {
    tap: tapHeart, reset: resetTap, bpm: tapBpm,
    tapCount, rippleKey, isReady: tapReady,
    calibratedTiming: tapTiming,
  } = useHeartTap()

  // Use calibrated timing when available, fall back to state defaults
  const timing = calibratedTiming ?? (BREATH_TIMING[stateData?.id] ?? BREATH_TIMING.anxious)
  const { phase: breathPhase, phaseProgress, phaseRemainingSec } =
    useImmersionBreath(open && phase === 'stabilize', timing)

  // ── Audio-visual + haptic breath sync ─────────────────────────────────
  // Fires only on phase transitions (breathPhase is a string, changes ~4-8s)
  useEffect(() => {
    if (phase !== 'stabilize') return

    const durationMs = timing[breathPhase] ?? 4000
    ambientEngine?.syncBreath(breathPhase, durationMs)
    onBreathPhaseChange?.(breathPhase)

    if (breathPhase === 'inhale') hapticInhale()
    else if (breathPhase === 'exhale') hapticExhale()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breathPhase, phase])

  // Reset on open
  useEffect(() => {
    if (!open) { setVisible(false); return }
    setPhase('welcome')
    setBreathElapsed(0)
    setPhraseIndex(0)
    setActivation(5)
    setIntegElapsed(0)
    setShowCalibration(false)
    setCalibratedTiming(null)
    setShowBurst(false)
    resetTap()
    activationRef.current = 5
    startedAtRef.current = new Date().toISOString()
    setTimeout(() => setVisible(true), 40)
  }, [open, resetTap])

  // Stabilize: session countdown + phrase rotation
  useEffect(() => {
    if (!open || phase !== 'stabilize') return
    const total = STABILIZE_DURATION[stateData?.id] ?? 180

    const countId = setInterval(() => {
      setBreathElapsed(prev => {
        if (prev + 1 >= total) {
          clearInterval(countId)
          ambientEngine?.stop()
          playToneRef.current?.()
          hapticCompleteRef.current?.()
          setShowBurst(true)
          setTimeout(() => setPhase('integrate'), 800)
          return total
        }
        return prev + 1
      })
    }, 1000)

    const phraseId = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % (GROUNDING_PHRASES[stateData?.id]?.length ?? 1))
    }, 20000)

    return () => { clearInterval(countId); clearInterval(phraseId) }
  }, [open, phase, stateData])

  useEffect(() => { activationRef.current = activation }, [activation])

  const { item: dailyTip } = useContentRotation(stateData?.tips ?? [])

  const { index: cueIdx } = useContentRotation(stateData?.breathCues?.inhale ?? [])
  const breathLabel = stateData?.breathCues ? {
    inhale: stateData.breathCues.inhale?.[cueIdx] ?? 'Breathe in',
    hold:   stateData.breathCues.hold?.[cueIdx]   ?? 'Hold',
    exhale: stateData.breathCues.exhale?.[cueIdx]  ?? 'Breathe out',
  } : BREATH_LABEL

  const resetPool = stateData?.resetVariants ?? (stateData?.reset ? [stateData.reset] : [])
  const { item: selectedReset } = useContentRotation(resetPool)
  const _activeReset = selectedReset ?? stateData?.reset

  const handleComplete = useCallback((autoDismissed) => {
    onComplete({
      activationAfter: activationRef.current,
      notes: null,
      startedAt: startedAtRef.current,
      resetCompleted: !autoDismissed,
    })
  }, [onComplete])

  // Integrate: auto-dismiss after 30s
  useEffect(() => {
    if (!open || phase !== 'integrate') return
    const id = setInterval(() => {
      setIntegElapsed(prev => {
        if (prev + 1 >= 30) { clearInterval(id); handleComplete(true); return 30 }
        return prev + 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [open, phase, handleComplete])

  const handleEarlyClose = useCallback(() => {
    try {
      console.log("Triggering early close...")
      if (ambientEngine?.stop) ambientEngine.stop()
    } catch (e) {
      console.error("Audio engine stop error during exit:", e)
    }
    try {
      if (onClose) onClose()
    } catch (e) {
      console.error("onClose error during exit:", e)
    }
  }, [ambientEngine, onClose])

  if (!open || !stateData) return null

  const accent = stateData.accentHex
  const total  = STABILIZE_DURATION[stateData.id] ?? 180
  const stabilizePct = total > 0 ? breathElapsed / total : 0

  // Orb scale
  let orbScale = 1.0
  if (breathPhase === 'inhale')    orbScale = 1.0 + phaseProgress * 0.45
  else if (breathPhase === 'hold') orbScale = 1.45
  else                             orbScale = 1.45 - phaseProgress * 0.45
  orbScale = Math.max(1.0, Math.min(1.45, orbScale))

  const isExhale     = breathPhase === 'exhale'
  const bloomScale   = isExhale ? 1.45 + phaseProgress * 0.75 : 1.45
  const bloomOpacity = isExhale ? 0.2 * Math.sin(Math.PI * phaseProgress) : 0

  // Session time remaining display
  const remainingSec  = Math.max(0, total - breathElapsed)
  const remMin  = Math.floor(remainingSec / 60)
  const remSec  = remainingSec % 60
  const remStr  = `${remMin}:${String(remSec).padStart(2, '0')}`

  // Breath pattern display (for welcome screen)
  const patternPills = (() => {
    const t = BREATH_TIMING[stateData.id] ?? BREATH_TIMING.anxious
    const pills = [{ label: 'Inhale', sec: t.inhale / 1000 }]
    if (t.hold > 0) pills.push({ label: 'Hold', sec: t.hold / 1000 })
    pills.push({ label: 'Exhale', sec: t.exhale / 1000 })
    return pills
  })()

  const durationMins = (STABILIZE_DURATION[stateData.id] ?? 120) / 60

  // ── SHARED WRAPPER ────────────────────────────────────────────────────
  const wrapper = (children) => (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 select-none"
      style={{
        backgroundColor: 'var(--bg-base)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 300ms ease',
      }}
    >
      <AmbientBg accent={accent} />
      <ExitButton onClose={handleEarlyClose} accent={accent} />
      {children}
    </div>
  )

  // ── PHASE: WELCOME — CALIBRATION SUB-VIEW ─────────────────────────────
  if (phase === 'welcome' && showCalibration) {
    return wrapper(
      <CalibrationPane
        accent={accent}
        tap={tapHeart}
        bpm={tapBpm}
        tapCount={tapCount}
        rippleKey={rippleKey}
        isReady={tapReady}
        calibratedTiming={tapTiming}
        onLock={() => {
          setCalibratedTiming(tapTiming)
          setPhase('stabilize')
        }}
        onCancel={() => {
          resetTap()
          setShowCalibration(false)
        }}
      />
    )
  }

  // ── PHASE: WELCOME ────────────────────────────────────────────────────
  if (phase === 'welcome') {
    const w = WELCOME[stateData.id] ?? WELCOME.flow
    return wrapper(
      <div
        className="relative w-full max-w-sm flex flex-col items-center text-center"
        style={{ animation: 'fadeIn 0.8s ease both' }}
      >
        {/* State badge */}
        <div
          className="font-mono text-[10px] tracking-[0.28em] uppercase mb-4 px-3 py-1 rounded-full"
          style={{ color: accent, border: `1px solid ${accent}30`, backgroundColor: `${accent}0c` }}
        >
          {stateData.label}
        </div>

        {/* Headline */}
        <h2
          className="font-semibold mb-3 leading-tight"
          style={{ color: 'var(--text-primary)', fontSize: '20px', letterSpacing: '-0.02em' }}
        >
          {w.headline}
        </h2>

        {/* Body copy */}
        <p
          className="text-sm leading-relaxed mb-6 max-w-[280px]"
          style={{ color: 'var(--text-muted)' }}
        >
          {w.body}
        </p>

        {/* Breathing pattern — clear visual guide */}
        <div className="flex items-center gap-2 mb-2">
          {patternPills.map((pill, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="flex flex-col items-center px-3 py-2 rounded-xl"
                style={{
                  border: `1px solid ${accent}25`,
                  backgroundColor: `${accent}0a`,
                  minWidth: 56,
                }}
              >
                <span
                  className="font-mono font-semibold leading-none mb-0.5"
                  style={{ color: accent, fontSize: '18px' }}
                >
                  {pill.sec}s
                </span>
                <span className="font-mono text-[9px] tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                  {pill.label}
                </span>
              </div>
              {i < patternPills.length - 1 && (
                <span className="font-mono text-[10px]" style={{ color: accent + '40' }}>·</span>
              )}
            </div>
          ))}
        </div>

        {/* Duration */}
        <p className="font-mono text-[10px] tracking-wider mb-8" style={{ color: 'var(--text-muted)' }}>
          {durationMins} minute session
        </p>

        {/* Arrival tip */}
        <div
          className="w-full text-center text-[11px] italic leading-relaxed mb-8 px-4 py-3 rounded-xl"
          style={{
            color: accent + 'aa',
            border: `1px solid ${accent}18`,
            backgroundColor: `${accent}07`,
          }}
        >
          {dailyTip ?? w.tip}
        </div>

        {/* Begin */}
        <button
          onClick={() => setPhase('stabilize')}
          className="w-full py-4 rounded-2xl font-mono text-[11px] tracking-[0.25em] uppercase focus:outline-none transition-all duration-300"
          style={{
            backgroundColor: accent + '1c',
            border: `1px solid ${accent}45`,
            color: accent,
            boxShadow: `0 0 24px ${accent}12`,
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = accent + '2e'; e.currentTarget.style.boxShadow = `0 0 32px ${accent}22` }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = accent + '1c'; e.currentTarget.style.boxShadow = `0 0 24px ${accent}12` }}
        >
          Begin
        </button>

        {/* HR calibration entry point */}
        <button
          onClick={() => setShowCalibration(true)}
          className="w-full py-2.5 rounded-2xl font-mono text-[10px] tracking-[0.22em] uppercase focus:outline-none transition-colors duration-200"
          style={{ color: accent + '55', border: `1px solid ${accent}18`, backgroundColor: 'transparent' }}
          onMouseEnter={e => { e.currentTarget.style.color = accent + 'aa'; e.currentTarget.style.borderColor = accent + '35' }}
          onMouseLeave={e => { e.currentTarget.style.color = accent + '55'; e.currentTarget.style.borderColor = accent + '18' }}
        >
          ⦿ Calibrate to your heart rate
        </button>
      </div>
    )
  }

  // ── PHASE: STABILIZE ─────────────────────────────────────────────────
  if (phase === 'stabilize') {
    const phrases = GROUNDING_PHRASES[stateData.id] ?? GROUNDING_PHRASES.flow
    const easedPct = Math.pow(stabilizePct, 0.5)
    const bgField = lerpHex(accent, SETTLED_HUE, easedPct)
    return wrapper(
      <div className="relative w-full flex flex-col items-center text-center">
        {/* Color-field: radial gradient that shifts from accent toward settled neutral */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 60%, ${bgField}18 0%, transparent 65%)` }}
        />

        {/* Session timer — top left */}
        <div
          className="fixed top-5 left-6 font-mono tabular-nums"
          style={{ color: accent + '60', fontSize: '11px', letterSpacing: '0.1em' }}
        >
          {remStr}
        </div>

        {/* HR-SYNC badge — shown when user calibrated to their heart rate */}
        {calibratedTiming && (
          <div
            className="fixed top-5 left-20 flex items-center gap-1.5 font-mono"
            style={{ color: accent + '55', fontSize: '9px', letterSpacing: '0.2em' }}
          >
            <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
            HR-SYNC
          </div>
        )}

        {/* Breath orb */}
        <BreathOrb
          accent={accent}
          orbScale={orbScale}
          bloomScale={bloomScale}
          bloomOpacity={bloomOpacity}
          timing={timing}
          isExhale={isExhale}
          breathPhase={breathPhase}
          phaseProgress={phaseProgress}
        />

        {/* Phase label + countdown - Moved to Bottom */}
        <div className="fixed bottom-16 left-0 right-0 flex flex-col items-center gap-1">
          <p
            className="font-mono text-[11px] tracking-[0.28em] uppercase"
            style={{
              color: accent,
              opacity: isExhale ? 1 : 0.55,
              transition: 'opacity 0.6s ease',
            }}
          >
            {breathLabel[breathPhase]}
          </p>
          {/* Phase countdown number */}
          <span
            className="font-mono font-light tabular-nums"
            style={{
              color: accent,
              fontSize: '38px',
              letterSpacing: '-0.02em',
              opacity: isExhale ? 0.95 : 0.5,
              transition: 'opacity 0.5s ease',
              lineHeight: 1,
            }}
          >
            {phaseRemainingSec}
          </span>
        </div>

        {/* Grounding phrase */}
        <p
          key={phraseIndex}
          className="max-w-[240px] text-center text-sm font-light leading-relaxed mt-4"
          style={{ color: 'var(--text-muted)', animation: 'fadeIn 1.4s ease both' }}
        >
          {phrases[phraseIndex]}
        </p>

        {/* Session progress bar */}
        <div
          className="fixed bottom-0 left-0 right-0 h-px"
          style={{ backgroundColor: accent + '12' }}
        >
          <div
            className="h-full transition-all duration-1000"
            style={{ width: `${stabilizePct * 100}%`, backgroundColor: accent + '40' }}
          />
        </div>
      </div>
    )
  }

  // ── PHASE: INTEGRATE ─────────────────────────────────────────────────
  const integrateField = lerpHex(accent, SETTLED_HUE, 1)
  return wrapper(
    <div className="relative w-full flex flex-col items-center text-center">
      {/* Color-field persists at fully settled hue through integrate phase */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 60%, ${integrateField}18 0%, transparent 65%)` }}
      />
      {/* Completion burst — plays for 1.2s then auto-removes */}
      {showBurst && <CompletionBurst accentHex={accent} onComplete={() => setShowBurst(false)} />}
    <div
      className="relative w-full max-w-[260px] flex flex-col items-center text-center space-y-5"
      style={{ animation: 'fadeIn 0.9s ease both' }}
    >
      <div>
        <p className="font-mono text-[9px] tracking-[0.28em] uppercase mb-2" style={{ color: accent + '70' }}>
          Session complete
        </p>
        <p className="text-lg font-light" style={{ color: 'var(--text-primary)' }}>
          How do you feel now?
        </p>
      </div>

      <div className="w-full">
        <div className="flex justify-between font-mono text-[10px] mb-2" style={{ color: 'var(--text-muted)' }}>
          <span>calm</span>
          <span style={{ color: accent, fontWeight: 600 }}>{activation}</span>
          <span>wired</span>
        </div>
        <input
          type="range" min={1} max={10} value={activation}
          onChange={e => setActivation(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: accent }}
        />
      </div>

      <button
        onClick={() => handleComplete(false)}
        className="w-full py-3.5 rounded-2xl font-mono text-[11px] tracking-[0.25em] uppercase focus:outline-none transition-all duration-200"
        style={{ backgroundColor: accent + '1c', border: `1px solid ${accent}40`, color: accent }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = accent + '2c' }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = accent + '1c' }}
      >
        Done
      </button>

      <p className="font-mono text-[9px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
        Closes in {30 - integElapsed}s
      </p>
    </div>
    </div>
  )
}
