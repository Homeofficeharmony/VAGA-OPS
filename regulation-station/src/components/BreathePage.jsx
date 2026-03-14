import { useState, useEffect, useRef } from 'react'

// State-specific breath patterns: [inhale, hold, exhale, hold2] in seconds
const BREATH_PATTERNS = {
  frozen:  { phases: ['inhale', 'hold', 'exhale', 'hold'], durations: [4, 4, 4, 4], label: 'Box Breathing' },
  anxious: { phases: ['inhale', 'hold', 'exhale'],          durations: [4, 7, 8],    label: '4-7-8' },
  flow:    { phases: ['inhale', 'hold', 'exhale'],          durations: [5, 2, 7],    label: 'Relaxed Breath' },
}

const PHASE_LABELS = { inhale: 'INHALE', hold: 'HOLD', exhale: 'EXHALE' }

// Orb scale per phase
const PHASE_SCALE = { inhale: 1.18, hold: 1.18, exhale: 0.88 }

function useBreathCycle(patternKey, isRunning) {
  const pattern = BREATH_PATTERNS[patternKey] ?? BREATH_PATTERNS.flow
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(pattern.durations[0])
  const timerRef = useRef(null)

  // Reset when state changes
  useEffect(() => {
    const p = BREATH_PATTERNS[patternKey] ?? BREATH_PATTERNS.flow
    setPhaseIdx(0)
    setSecondsLeft(p.durations[0])
  }, [patternKey])

  useEffect(() => {
    if (!isRunning) {
      clearInterval(timerRef.current)
      return
    }

    const p = BREATH_PATTERNS[patternKey] ?? BREATH_PATTERNS.flow

    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setPhaseIdx((i) => {
            const next = (i + 1) % p.phases.length
            setSecondsLeft(p.durations[next])
            return next
          })
          return p.durations[0] // placeholder; overwritten above
        }
        return s - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patternKey, isRunning])

  const p = BREATH_PATTERNS[patternKey] ?? BREATH_PATTERNS.flow
  return {
    phase: p.phases[phaseIdx],
    secondsLeft,
    patternLabel: p.label,
  }
}

export default function BreathePage({
  stateData,
  stateKey,
  onBeginReset,
  onPanicReset,
  onChangeState,
  onOpenMission,
  onFlowLock,
  todayResets,
}) {
  const [isRunning, setIsRunning] = useState(false)
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * 50))
  const { phase, secondsLeft, patternLabel } = useBreathCycle(stateKey, isRunning)

  // Reset running state when state changes
  useEffect(() => {
    setIsRunning(false)
  }, [stateKey])

  useEffect(() => {
    if (!stateData?.tips?.length) return
    const interval = setInterval(() => {
      setTipIndex((i) => i + 1)
    }, 30000)
    return () => clearInterval(interval)
  }, [stateData])

  if (!stateData) return null

  const tip = stateData.tips?.[tipIndex % (stateData.tips.length || 1)] ?? ''
  const scale = isRunning ? (PHASE_SCALE[phase] ?? 1) : 1
  const transitionDuration = !isRunning
    ? 0.5
    : phase === 'inhale'
      ? (BREATH_PATTERNS[stateKey]?.durations[0] ?? 5)
      : phase === 'exhale'
        ? (BREATH_PATTERNS[stateKey]?.durations[BREATH_PATTERNS[stateKey].phases.indexOf('exhale')] ?? 7)
        : 0.2

  return (
    <div className="page-content flex flex-col items-center justify-between min-h-full px-6 py-10 page-enter">

      {/* State identity */}
      <div className="flex flex-col items-center gap-1 text-center">
        <span
          className="font-mono text-[11px] tracking-[0.2em] uppercase"
          style={{ color: stateData.accentHex }}
        >
          {stateData.label}
        </span>
        <p className="text-[12px] max-w-[260px]" style={{ color: 'var(--text-muted)' }}>
          {stateData.polyvagalNote}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <button
            onClick={onChangeState}
            className="text-[11px] underline underline-offset-2 transition-opacity hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            Change state
          </button>
          {todayResets > 0 && (
            <span
              className="font-mono text-[11px] px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${stateData.accentHex}14`,
                color: stateData.accentHex,
                border: `1px solid ${stateData.accentHex}30`,
              }}
            >
              {todayResets} today
            </span>
          )}
        </div>
      </div>

      {/* Breathing Orb */}
      <div className="flex flex-col items-center gap-5 my-6">
        <button
          onClick={() => setIsRunning((r) => !r)}
          className="relative flex items-center justify-center focus:outline-none"
          style={{ width: '260px', height: '260px' }}
          aria-label={isRunning ? 'Pause breathing guide' : 'Start breathing guide'}
        >
          {/* Outer pulse ring */}
          <div
            className="absolute rounded-full"
            style={{
              width: '240px',
              height: '240px',
              border: `1px solid ${stateData.accentHex}20`,
              transform: `scale(${scale})`,
              transition: `transform ${transitionDuration}s ease-in-out`,
            }}
          />

          {/* Mid ring */}
          <div
            className="absolute rounded-full"
            style={{
              width: '190px',
              height: '190px',
              border: `1px solid ${stateData.accentHex}30`,
              transform: `scale(${scale})`,
              transition: `transform ${transitionDuration}s ease-in-out`,
              transitionDelay: '0.1s',
            }}
          />

          {/* Glow */}
          <div
            className="absolute rounded-full blur-3xl"
            style={{
              width: '150px',
              height: '150px',
              backgroundColor: stateData.accentHex,
              opacity: !isRunning ? 0.1 : phase === 'exhale' ? 0.08 : 0.18,
              transform: `scale(${scale})`,
              transition: `transform ${transitionDuration}s ease-in-out, opacity ${transitionDuration}s ease-in-out`,
            }}
          />

          {/* Core orb */}
          <div
            className="rounded-full flex flex-col items-center justify-center"
            style={{
              width: '130px',
              height: '130px',
              backgroundColor: `${stateData.accentHex}22`,
              border: `1px solid ${stateData.accentHex}55`,
              boxShadow: `0 0 48px ${stateData.accentHex}25`,
              transform: `scale(${scale})`,
              transition: `transform ${transitionDuration}s ease-in-out`,
            }}
          >
            {isRunning ? (
              <>
                <span
                  className="font-mono text-[10px] tracking-[0.2em] uppercase"
                  style={{ color: stateData.accentHex, opacity: 0.9 }}
                >
                  {PHASE_LABELS[phase]}
                </span>
                <span
                  className="font-mono text-[22px] font-light mt-0.5"
                  style={{ color: stateData.accentHex }}
                >
                  {secondsLeft}
                </span>
              </>
            ) : (
              <>
                <span
                  className="font-mono text-[10px] tracking-[0.15em] uppercase"
                  style={{ color: stateData.accentHex, opacity: 0.7 }}
                >
                  Tap to
                </span>
                <span
                  className="font-mono text-[13px] font-medium mt-0.5"
                  style={{ color: stateData.accentHex }}
                >
                  Begin
                </span>
              </>
            )}
          </div>
        </button>

        {/* Pattern label */}
        <p
          className="font-mono text-[11px] tracking-[0.3em] uppercase"
          style={{ color: `${stateData.accentHex}80` }}
        >
          {patternLabel}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={onBeginReset}
          className="py-4 rounded-2xl text-[14px] font-medium tracking-wide transition-all duration-200 hover:opacity-90 active:scale-95"
          style={{
            backgroundColor: stateData.accentHex,
            color: '#0f1410',
          }}
        >
          Begin Reset
        </button>

        <div className="flex gap-2">
          <button
            onClick={onPanicReset}
            className="flex-1 py-3 rounded-2xl text-[13px] font-medium transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: `${stateData.accentHex}12`,
              border: `1px solid ${stateData.accentHex}35`,
              color: stateData.accentHex,
            }}
          >
            ⚡ Emergency
          </button>

          {stateKey === 'flow' && onFlowLock && (
            <button
              onClick={onFlowLock}
              className="flex-1 py-3 rounded-2xl text-[13px] font-medium transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{
                backgroundColor: `${stateData.accentHex}12`,
                border: `1px solid ${stateData.accentHex}35`,
                color: stateData.accentHex,
              }}
            >
              🔒 Flow Session
            </button>
          )}

          {stateKey !== 'flow' && onOpenMission && (
            <button
              onClick={onOpenMission}
              className="flex-1 py-3 rounded-2xl text-[13px] font-medium transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{
                backgroundColor: `${stateData.accentHex}12`,
                border: `1px solid ${stateData.accentHex}35`,
                color: stateData.accentHex,
              }}
            >
              🎯 Mission
            </button>
          )}
        </div>
      </div>

      {/* Rotating tip */}
      {tip && (
        <p
          className="text-center text-[11px] italic leading-relaxed max-w-xs mt-4"
          style={{ color: 'var(--text-muted)', opacity: 0.7 }}
        >
          {tip}
        </p>
      )}
    </div>
  )
}
