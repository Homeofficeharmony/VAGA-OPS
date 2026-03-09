import { useState, useEffect, useRef } from 'react'
import { MISSIONS } from '../data/missionData'
import { useImmersionBreath } from '../hooks/useImmersionBreath'
import { useCompletionTone } from '../hooks/useCompletionTone'
import { useHaptics } from '../hooks/useHaptics'

// ── Shared sub-components ──────────────────────────────────────────────

function MissionBreathOrb({ accent, orbScale, bloomScale, bloomOpacity, timing, isExhale, breathPhase }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
      {isExhale && (
        <div
          aria-hidden
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            border: `1px solid ${accent}`,
            transform: `scale(${bloomScale})`,
            opacity: bloomOpacity,
          }}
        />
      )}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          backgroundColor: accent + '0c',
          boxShadow: `0 0 ${Math.round(32 + orbScale * 20)}px ${Math.round(8 + orbScale * 12)}px ${accent}18`,
          transform: `scale(${orbScale})`,
          transition: `transform ${isExhale ? timing.exhale : breathPhase === 'hold' ? 100 : timing.inhale}ms ease-in-out`,
        }}
      />
      <div
        className="absolute inset-6 rounded-full border"
        style={{
          borderColor: accent + (isExhale ? 'bb' : '55'),
          backgroundColor: accent + (isExhale ? '12' : '06'),
          transform: `scale(${orbScale})`,
          transition: `transform ${isExhale ? timing.exhale : breathPhase === 'hold' ? 100 : timing.inhale}ms ease-in-out, border-color 0.6s ease`,
        }}
      />
      <div
        className="absolute inset-[35%] rounded-full"
        style={{
          background: `radial-gradient(circle, ${accent}50 0%, ${accent}1a 60%, transparent 100%)`,
          boxShadow: `0 0 10px ${accent}35`,
        }}
      />
    </div>
  )
}

function DifficultyBar({ level }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: 10,
            height: 3,
            backgroundColor: i < level ? '#52b87e' : '#52b87e20',
            transition: 'background-color 0.2s',
          }}
        />
      ))}
    </div>
  )
}

const BREATH_LABEL = { inhale: 'Breathe in', hold: 'Hold', exhale: 'Breathe out' }

// ── Main component ─────────────────────────────────────────────────────

export default function MissionControl({ open, ambientEngine, onMissionComplete, onClose }) {
  const [screen, setScreen] = useState('select')      // 'select' | 'brief' | 'execute' | 'complete'
  const [selectedMission, setSelectedMission] = useState(null)
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0)
  const [phaseElapsed, setPhaseElapsed] = useState(0)
  const [totalElapsed, setTotalElapsed] = useState(0)
  const [cueIdx, setCueIdx] = useState(0)
  const [completedPhases, setCompletedPhases] = useState(0)
  const [visible, setVisible] = useState(false)

  const playTone = useCompletionTone()
  const playToneRef = useRef(null)
  playToneRef.current = playTone

  const { complete: hapticComplete } = useHaptics()
  const hapticRef = useRef(null)
  hapticRef.current = hapticComplete

  // Derive current phase — safe fallback so hooks are never conditionally called
  const currentPhase = selectedMission?.phases?.[currentPhaseIdx] ?? null
  const breathTiming = currentPhase?.breathTiming ?? { inhale: 4000, hold: 0, exhale: 6000 }

  const isExecuting = open && screen === 'execute'

  const { phase: breathPhase, phaseProgress, phaseRemainingSec } =
    useImmersionBreath(isExecuting, breathTiming)

  // Ambient breath sync — fires on phase transitions only
  useEffect(() => {
    if (!isExecuting || !currentPhase) return
    ambientEngine?.syncBreath(breathPhase, breathTiming[breathPhase] ?? 4000)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breathPhase, isExecuting])

  // Switch binaural frequency on phase advance
  useEffect(() => {
    if (!isExecuting || !currentPhase || !ambientEngine) return
    ambientEngine.select('binaural', {
      audio: { tracks: [{ carrierHz: currentPhase.audio.carrierHz, beatHz: currentPhase.audio.beatHz }] },
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPhaseIdx, isExecuting])

  // Phase countdown + auto-advance
  useEffect(() => {
    if (!isExecuting || !currentPhase || !selectedMission) return
    const phaseDur = currentPhase.durationSec
    const cueCount = currentPhase.groundingCues?.length ?? 1

    const timerId = setInterval(() => {
      setPhaseElapsed(prev => {
        const next = prev + 1
        if (next >= phaseDur) {
          const nextIdx = currentPhaseIdx + 1
          if (nextIdx < selectedMission.phases.length) {
            setCurrentPhaseIdx(nextIdx)
            setCompletedPhases(p => p + 1)
            setCueIdx(0)
            playToneRef.current?.()
          } else {
            setCompletedPhases(selectedMission.phases.length)
            playToneRef.current?.()
            hapticRef.current?.()
            setScreen('complete')
            ambientEngine?.select('silence')
          }
          return 0
        }
        return next
      })
      setTotalElapsed(p => p + 1)
    }, 1000)

    const cueId = setInterval(() => {
      setCueIdx(prev => (prev + 1) % cueCount)
    }, 15000)

    return () => { clearInterval(timerId); clearInterval(cueId) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExecuting, currentPhaseIdx, currentPhase, selectedMission])

  // Fade in on open, reset on close
  useEffect(() => {
    if (!open) {
      setVisible(false)
      ambientEngine?.select('silence')
      return
    }
    setScreen('select')
    setSelectedMission(null)
    setCurrentPhaseIdx(0)
    setPhaseElapsed(0)
    setTotalElapsed(0)
    setCueIdx(0)
    setCompletedPhases(0)
    setTimeout(() => setVisible(true), 40)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  const wrapper = (children) => (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden select-none"
      style={{
        backgroundColor: 'var(--bg-base)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.7s ease',
      }}
    >
      {/* Ambient radial bg */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, #52b87e08 0%, transparent 65%)' }}
      />
      {children}
    </div>
  )

  // ── SCREEN: SELECT ────────────────────────────────────────────────────
  if (screen === 'select') {
    return wrapper(
      <div className="w-full max-w-2xl px-6" style={{ animation: 'fadeIn 0.6s ease both' }}>
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="font-mono text-[9px] tracking-[0.3em] uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
              VAGA · OPERATIONS
            </p>
            <h2
              className="font-mono font-semibold"
              style={{ color: 'var(--text-primary)', fontSize: '18px', letterSpacing: '0.06em' }}
            >
              Mission Control
            </h2>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-[10px] tracking-[0.2em] uppercase focus:outline-none transition-colors duration-150"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ✕ close
          </button>
        </div>

        {/* Mission cards */}
        <div className="flex flex-col gap-3">
          {MISSIONS.map(mission => (
            <button
              key={mission.id}
              onClick={() => { setSelectedMission(mission); setScreen('brief') }}
              className="w-full text-left p-4 rounded-2xl focus:outline-none transition-all duration-200 group"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-panel)' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#52b87e40'
                e.currentTarget.style.backgroundColor = '#52b87e07'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.backgroundColor = 'var(--bg-panel)'
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p
                    className="font-mono text-[9px] tracking-[0.24em] uppercase mb-1"
                    style={{ color: '#52b87e65' }}
                  >
                    {mission.classification}
                  </p>
                  <p
                    className="font-mono font-semibold mb-2"
                    style={{ color: 'var(--text-primary)', fontSize: '13px', letterSpacing: '0.06em' }}
                  >
                    {mission.codename}
                  </p>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {mission.objective}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0 pt-0.5">
                  <span className="font-mono text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {mission.durationMin} min
                  </span>
                  <DifficultyBar level={mission.difficulty} />
                  <span
                    className="font-mono text-[9px] tracking-[0.2em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ color: '#52b87e' }}
                  >
                    deploy →
                  </span>
                </div>
              </div>

              {/* Phase chain */}
              <div className="flex items-center gap-1.5 mt-3">
                {mission.phases.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-1.5">
                    <div
                      className="font-mono text-[8px] tracking-wider uppercase px-2 py-1 rounded-full"
                      style={{
                        border: `1px solid ${p.accentHex}30`,
                        backgroundColor: `${p.accentHex}08`,
                        color: p.accentHex + '90',
                      }}
                    >
                      {i + 1} · {p.technique}
                    </div>
                    {i < mission.phases.length - 1 && (
                      <span className="font-mono text-[8px]" style={{ color: 'var(--border)' }}>→</span>
                    )}
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>

        <p className="font-mono text-[9px] tracking-wider text-center mt-5" style={{ color: 'var(--text-muted)' }}>
          Press M to open · Esc to close
        </p>
      </div>
    )
  }

  // ── SCREEN: BRIEF ─────────────────────────────────────────────────────
  if (screen === 'brief' && selectedMission) {
    return wrapper(
      <div className="w-full max-w-sm px-6" style={{ animation: 'fadeIn 0.5s ease both' }}>
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setScreen('select')}
            className="font-mono text-[10px] tracking-[0.2em] uppercase focus:outline-none transition-colors duration-150"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ← missions
          </button>
          <button
            onClick={onClose}
            className="font-mono text-[10px] tracking-[0.2em] uppercase focus:outline-none transition-colors duration-150"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ✕ close
          </button>
        </div>

        <p className="font-mono text-[9px] tracking-[0.28em] uppercase mb-1.5" style={{ color: '#52b87e70' }}>
          {selectedMission.classification}
        </p>
        <h2
          className="font-mono font-semibold mb-5"
          style={{ color: 'var(--text-primary)', fontSize: '18px', letterSpacing: '0.06em' }}
        >
          {selectedMission.codename}
        </h2>

        {/* Objective */}
        <div
          className="p-4 rounded-2xl mb-5 text-[11px] leading-relaxed"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-panel)', color: 'var(--text-muted)' }}
        >
          <p className="font-mono text-[9px] tracking-[0.24em] uppercase mb-2" style={{ color: '#52b87e70' }}>
            Mission Objective
          </p>
          {selectedMission.objective}
        </div>

        {/* Phase sequence */}
        <p className="font-mono text-[9px] tracking-[0.24em] uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
          Phase Sequence
        </p>
        <div className="flex flex-col gap-2 mb-5">
          {selectedMission.phases.map((phase, i) => (
            <div
              key={phase.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ border: `1px solid ${phase.accentHex}22`, backgroundColor: `${phase.accentHex}06` }}
            >
              <span
                className="font-mono text-xs font-semibold shrink-0"
                style={{ color: phase.accentHex }}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className="font-mono text-[9px] tracking-[0.18em] uppercase"
                  style={{ color: phase.accentHex }}
                >
                  {phase.label}
                </p>
                <p className="font-mono text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {phase.technique} · {phase.durationSec / 60} min
                </p>
              </div>
            </div>
          ))}
        </div>

        <p
          className="font-mono text-[10px] tracking-wider text-center mb-5"
          style={{ color: 'var(--text-muted)' }}
        >
          Total duration: {selectedMission.durationMin} minutes
        </p>

        <button
          onClick={() => {
            setCurrentPhaseIdx(0)
            setPhaseElapsed(0)
            setTotalElapsed(0)
            setCueIdx(0)
            setCompletedPhases(0)
            setScreen('execute')
          }}
          className="w-full py-4 rounded-2xl font-mono text-[11px] tracking-[0.25em] uppercase focus:outline-none transition-all duration-300"
          style={{
            backgroundColor: '#52b87e1c',
            border: '1px solid #52b87e45',
            color: '#52b87e',
            boxShadow: '0 0 24px #52b87e10',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#52b87e2c'; e.currentTarget.style.boxShadow = '0 0 36px #52b87e20' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#52b87e1c'; e.currentTarget.style.boxShadow = '0 0 24px #52b87e10' }}
        >
          Deploy Mission
        </button>
      </div>
    )
  }

  // ── SCREEN: EXECUTE ────────────────────────────────────────────────────
  if (screen === 'execute' && selectedMission && currentPhase) {
    const accent = currentPhase.accentHex
    const phaseDur = currentPhase.durationSec
    const phaseRemaining = Math.max(0, phaseDur - phaseElapsed)
    const remMin = Math.floor(phaseRemaining / 60)
    const remSec = phaseRemaining % 60
    const remStr = `${remMin}:${String(remSec).padStart(2, '0')}`

    const totalDur = selectedMission.phases.reduce((s, p) => s + p.durationSec, 0)
    const missionPct = totalDur > 0 ? Math.min(1, totalElapsed / totalDur) : 0

    let orbScale = 1.0
    if (breathPhase === 'inhale')      orbScale = 1.0 + phaseProgress * 0.45
    else if (breathPhase === 'hold')   orbScale = 1.45
    else                               orbScale = 1.45 - phaseProgress * 0.45
    orbScale = Math.max(1.0, Math.min(1.45, orbScale))

    const isExhale = breathPhase === 'exhale'
    const bloomScale = isExhale ? 1.45 + phaseProgress * 0.7 : 1.45
    const bloomOpacity = isExhale ? 0.18 * Math.sin(Math.PI * phaseProgress) : 0

    return wrapper(
      <div className="relative w-full flex flex-col items-center text-center">

        {/* Top HUD bar */}
        <div className="fixed top-5 left-6 right-6 flex items-start justify-between">
          <div>
            <p className="font-mono text-[9px] tracking-[0.24em] uppercase" style={{ color: accent + '70' }}>
              {selectedMission.codename}
            </p>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase mt-0.5" style={{ color: accent }}>
              {currentPhase.label}
            </p>
          </div>
          <div
            className="font-mono tabular-nums"
            style={{ color: accent + '60', fontSize: '11px', letterSpacing: '0.1em' }}
          >
            {remStr}
          </div>
        </div>

        {/* Phase position dots */}
        <div className="fixed top-[52px] left-1/2 -translate-x-1/2 flex items-center gap-2">
          {selectedMission.phases.map((p, i) => (
            <div
              key={p.id}
              className="rounded-full transition-all duration-600"
              style={{
                width: i === currentPhaseIdx ? 18 : 6,
                height: 6,
                backgroundColor: i < currentPhaseIdx
                  ? p.accentHex + '55'
                  : i === currentPhaseIdx
                  ? accent
                  : 'var(--border)',
              }}
            />
          ))}
        </div>

        {/* Breathing orb */}
        <MissionBreathOrb
          accent={accent}
          orbScale={orbScale}
          bloomScale={bloomScale}
          bloomOpacity={bloomOpacity}
          timing={breathTiming}
          isExhale={isExhale}
          breathPhase={breathPhase}
        />

        {/* Breath label */}
        <p
          className="font-mono text-[11px] tracking-[0.28em] uppercase mt-7 mb-0.5"
          style={{ color: accent, opacity: isExhale ? 1 : 0.55, transition: 'opacity 0.6s ease' }}
        >
          {BREATH_LABEL[breathPhase]}
        </p>

        {/* Technique name */}
        <p
          className="font-mono text-[9px] tracking-[0.2em] uppercase mb-5"
          style={{ color: accent + '65' }}
        >
          {currentPhase.technique}
        </p>

        {/* Phase instruction — changes on phase advance via key */}
        <p
          key={`instruction-${currentPhaseIdx}`}
          className="max-w-[270px] text-[11px] font-light leading-relaxed mb-4"
          style={{ color: 'var(--text-muted)', animation: 'fadeIn 0.8s ease both' }}
        >
          {currentPhase.instruction}
        </p>

        {/* Grounding cue — rotates every 15s */}
        <p
          key={`${currentPhaseIdx}-${cueIdx}`}
          className="max-w-[220px] text-xs italic leading-relaxed"
          style={{ color: 'var(--text-muted)', animation: 'fadeIn 1.2s ease both' }}
        >
          {currentPhase.groundingCues?.[cueIdx]}
        </p>

        {/* Mission progress bar — bottom */}
        <div
          className="fixed bottom-0 left-0 right-0 h-px"
          style={{ backgroundColor: accent + '12' }}
        >
          <div
            className="h-full transition-all duration-1000"
            style={{ width: `${missionPct * 100}%`, backgroundColor: accent + '55' }}
          />
        </div>

        {/* Abort */}
        <button
          onClick={() => {
            ambientEngine?.select('silence')
            setCurrentPhaseIdx(0)
            setPhaseElapsed(0)
            setTotalElapsed(0)
            setCueIdx(0)
            setCompletedPhases(0)
            setScreen('select')
          }}
          className="fixed bottom-6 right-6 font-mono text-[9px] tracking-[0.2em] uppercase focus:outline-none transition-colors duration-150"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#ef444465'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          abort mission
        </button>
      </div>
    )
  }

  // ── SCREEN: COMPLETE ──────────────────────────────────────────────────
  if (screen === 'complete' && selectedMission) {
    const lastAccent = selectedMission.phases.at(-1)?.accentHex ?? '#52b87e'
    const totalMin = Math.floor(totalElapsed / 60)
    const totalSec = totalElapsed % 60
    const firstState = selectedMission.phases[0].stateId
    const lastState = selectedMission.phases.at(-1).stateId

    return wrapper(
      <div
        className="relative w-full max-w-xs px-6 flex flex-col items-center text-center"
        style={{ animation: 'fadeIn 1s ease both' }}
      >
        {/* Completion ring */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
          style={{
            border: `1px solid ${lastAccent}50`,
            backgroundColor: `${lastAccent}10`,
            boxShadow: `0 0 40px ${lastAccent}1a`,
          }}
        >
          <span className="font-mono text-xl" style={{ color: lastAccent }}>✓</span>
        </div>

        <p className="font-mono text-[9px] tracking-[0.3em] uppercase mb-1.5" style={{ color: lastAccent + '80' }}>
          Mission Accomplished
        </p>
        <h2
          className="font-mono font-semibold mb-6"
          style={{ color: 'var(--text-primary)', fontSize: '18px', letterSpacing: '0.06em' }}
        >
          {selectedMission.codename}
        </h2>

        {/* Stats row */}
        <div className="w-full grid grid-cols-3 gap-2.5 mb-5">
          {[
            { label: 'Elapsed', value: `${totalMin}:${String(totalSec).padStart(2, '0')}` },
            { label: 'Phases', value: `${completedPhases}/${selectedMission.phases.length}` },
            { label: 'Rating', value: `${selectedMission.difficulty}/5` },
          ].map(stat => (
            <div
              key={stat.label}
              className="flex flex-col items-center py-3 rounded-xl"
              style={{ border: `1px solid ${lastAccent}20`, backgroundColor: `${lastAccent}07` }}
            >
              <span
                className="font-mono font-semibold"
                style={{ color: lastAccent, fontSize: '15px', letterSpacing: '-0.01em' }}
              >
                {stat.value}
              </span>
              <span className="font-mono text-[8px] tracking-wider uppercase mt-1" style={{ color: 'var(--text-muted)' }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Polyvagal transition label */}
        <div
          className="w-full py-2.5 rounded-xl font-mono text-[10px] tracking-[0.2em] uppercase text-center mb-6"
          style={{ border: `1px solid ${lastAccent}20`, backgroundColor: `${lastAccent}07`, color: lastAccent + '80' }}
        >
          {firstState} → {lastState}
        </div>

        <button
          onClick={() => {
            onMissionComplete?.({ missionId: selectedMission.id, totalElapsed, completedPhases })
            onClose()
          }}
          className="w-full py-4 rounded-2xl font-mono text-[11px] tracking-[0.25em] uppercase focus:outline-none transition-all duration-200"
          style={{ backgroundColor: `${lastAccent}1c`, border: `1px solid ${lastAccent}45`, color: lastAccent }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = `${lastAccent}2c`}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = `${lastAccent}1c`}
        >
          Log & Close
        </button>
      </div>
    )
  }

  return null
}
