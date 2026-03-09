import { useState, useEffect } from 'react'

// Biophilic palette — matches the main app theme
const STATES = {
  frozen: { id: 'frozen', name: 'Foggy / Shut Down', mapTo: 'frozen', color: '#c4604a' },
  anxious: { id: 'anxious', name: 'Wired / Overthinking', mapTo: 'anxious', color: '#c8a040' },
  flow: { id: 'flow', name: 'Clear / Focused', mapTo: 'flow', color: '#52b87e' },
}

const STATE_SUBLABELS = {
  frozen: 'Dissociated · Low energy · Can\'t start',
  anxious: 'Scattered · Overthinking · Chest tight',
  flow: 'Grounded · Present · Ready to build',
}

// Asymmetric organic border-radius per state (matches StateSelector)
const RADII = {
  frozen: '20px 12px 20px 12px',
  anxious: '12px 22px 12px 22px',
  flow: '20px 20px 10px 20px',
}

// SVG grain texture for warmth and depth
const GRAIN_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.09'/%3E%3C/svg%3E")`

// Breathing phase: 4s inhale · 1s hold · 8s exhale = 13s cycle
const getPhase = (elapsed) => {
  const cycle = elapsed % 13
  if (cycle < 4) return { label: 'Breathe in', scale: 1.0, dur: '4s' }
  if (cycle < 5) return { label: 'Hold', scale: 1.0, dur: '0.1s' }
  return { label: 'Breathe out', scale: 0.32, dur: '8s' }
}

// Layered concentric orb — the visual heart of the breathing screen
function BreathingOrb({ color, scale, duration }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
      {/* Outermost ambient halo */}
      <div style={{
        position: 'absolute', width: '100%', height: '100%', borderRadius: '50%',
        border: `1px solid ${color}12`,
        transform: `scale(${0.88 + scale * 0.18})`,
        transition: `transform ${duration} ease-in-out`,
      }} />
      {/* Outer ring */}
      <div style={{
        position: 'absolute', width: '84%', height: '84%', borderRadius: '50%',
        border: `1px solid ${color}20`,
        background: `radial-gradient(circle, ${color}05 0%, transparent 70%)`,
        transform: `scale(${scale})`,
        transition: `transform ${duration} ease-in-out`,
      }} />
      {/* Mid glow body */}
      <div style={{
        position: 'absolute', width: '56%', height: '56%', borderRadius: '50%',
        background: `radial-gradient(circle, ${color}2e 0%, ${color}10 55%, transparent 100%)`,
        transform: `scale(${scale})`,
        transition: `transform ${duration} ease-in-out`,
        boxShadow: `0 0 60px ${color}18, 0 0 120px ${color}0a`,
      }} />
      {/* Inner bright core — always visible */}
      <div style={{
        position: 'absolute', width: '20%', height: '20%', borderRadius: '50%',
        background: `radial-gradient(circle, ${color}65 0%, ${color}28 70%, transparent 100%)`,
        boxShadow: `0 0 14px ${color}45`,
        transition: 'box-shadow 0.5s ease',
      }} />
    </div>
  )
}

function BreathingTimer({ color, onComplete, onSkip }) {
  const TOTAL = 30
  const [elapsed, setElapsed] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - start) / 1000)
      if (diff >= TOTAL) {
        clearInterval(interval)
        setElapsed(TOTAL)
        setTimeout(() => onComplete(), 700)
      } else {
        setElapsed(diff)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [onComplete])

  const { label, scale, dur } = getPhase(elapsed)
  const remaining = Math.max(0, TOTAL - elapsed)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        backgroundColor: 'var(--bg-base)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.9s ease',
      }}
    >
      {/* Ambient glow behind orb — breathes with scale */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 50% 52%, ${color}0b 0%, transparent 55%)`,
      }} />
      {/* Grain texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: GRAIN_BG, backgroundSize: '180px 180px',
        opacity: 0.42, mixBlendMode: 'overlay',
      }} />

      {/* Main content */}
      <div className="relative flex flex-col items-center text-center px-8" style={{ zIndex: 1 }}>
        {/* Phase label */}
        <div
          className="font-mono tracking-[0.28em] uppercase mb-12"
          style={{
            color,
            fontSize: '12px',
            minWidth: 140,
            transition: 'opacity 0.4s ease',
          }}
        >
          {label}
        </div>

        {/* Layered breathing orb */}
        <BreathingOrb color={color} scale={scale} duration={dur} />

        {/* Time remaining */}
        <div
          className="mt-12 font-mono tabular-nums"
          style={{ color: 'var(--text-muted)', fontSize: '12px', letterSpacing: '0.12em' }}
        >
          {remaining}s
        </div>

        {/* Gentle guidance */}
        <p
          className="mt-3 max-w-[220px] leading-relaxed"
          style={{ color: 'var(--text-muted)', fontSize: '11px' }}
        >
          Let your exhale be twice as long as your inhale.
        </p>
      </div>

      {/* Skip — subtle, bottom corner */}
      <button
        onClick={onSkip}
        className="absolute bottom-8 right-8 font-mono text-[10px] tracking-widest uppercase transition-colors focus:outline-none"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        Skip
      </button>
    </div>
  )
}

function ShiftCheckin({ color, onComplete }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 60) }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{
        backgroundColor: 'var(--bg-base)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.7s ease',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: GRAIN_BG, backgroundSize: '180px 180px',
        opacity: 0.38, mixBlendMode: 'overlay',
      }} />

      <div className="relative w-full max-w-xs flex flex-col items-center">
        <div
          className="font-mono text-[10px] tracking-[0.28em] uppercase mb-6"
          style={{ color: 'var(--text-muted)' }}
        >
          After breathing
        </div>
        <h2
          className="font-semibold mb-8 text-center"
          style={{ color: 'var(--text-primary)', fontSize: '22px', letterSpacing: '-0.02em' }}
        >
          Any shift?
        </h2>
        <div className="w-full flex flex-col gap-2">
          {['Worse', 'Same', 'Better', 'Much better'].map((opt) => (
            <button
              key={opt}
              onClick={() => onComplete(opt)}
              className="w-full py-4 text-sm font-medium focus:outline-none transition-all duration-200"
              style={{
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-panel)',
                borderRadius: '14px',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = color + '55'
                e.currentTarget.style.backgroundColor = color + '0e'
                e.currentTarget.style.color = color
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.backgroundColor = 'var(--bg-panel)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function FlowPrep({ onStart }) {
  const color = STATES.flow.color
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 60) }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-6"
      style={{
        backgroundColor: 'var(--bg-base)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.7s ease',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 50% 55%, ${color}09 0%, transparent 58%)`,
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: GRAIN_BG, backgroundSize: '180px 180px',
        opacity: 0.38, mixBlendMode: 'overlay',
      }} />
      <div className="relative">
        <h2
          className="font-semibold mb-2"
          style={{ color: 'var(--text-primary)', fontSize: '22px', letterSpacing: '-0.02em' }}
        >
          Protect the window.
        </h2>
        <p className="mb-10" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          High-leverage work only.
        </p>
        <button
          onClick={onStart}
          className="px-8 py-3.5 text-sm font-medium focus:outline-none transition-all duration-200"
          style={{
            color,
            borderRadius: '14px',
            border: `1px solid ${color}42`,
            backgroundColor: `${color}0e`,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = color + '80'
            e.currentTarget.style.backgroundColor = color + '1c'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = color + '42'
            e.currentTarget.style.backgroundColor = color + '0e'
          }}
        >
          Start 90-min Flow
        </button>
      </div>
    </div>
  )
}

function FlowTimer({ onComplete }) {
  const TOTAL_SEC = 5400
  const [elapsed, setElapsed] = useState(0)
  const [done, setDone] = useState(false)
  const color = STATES.flow.color

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - start) / 1000)
      if (diff >= TOTAL_SEC) {
        clearInterval(interval)
        setElapsed(TOTAL_SEC)
        setDone(true)
      } else {
        setElapsed(diff)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const remaining = TOTAL_SEC - elapsed
  const hours = Math.floor(remaining / 3600)
  const minutes = Math.floor((remaining % 3600) / 60)
  const seconds = remaining % 60
  const timeStr = hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const sharedBg = (
    <>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 50% 52%, ${color}09 0%, transparent 55%)`,
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: GRAIN_BG, backgroundSize: '180px 180px',
        opacity: 0.38, mixBlendMode: 'overlay',
      }} />
    </>
  )

  if (done) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-6"
        style={{ backgroundColor: 'var(--bg-base)' }}
      >
        {sharedBg}
        <div className="relative">
          <p
            className="font-semibold mb-8"
            style={{ color: 'var(--text-primary)', fontSize: '20px', letterSpacing: '-0.02em' }}
          >
            You protected 90 minutes of deep work.
          </p>
          <button
            onClick={onComplete}
            className="px-8 py-3.5 text-sm font-medium focus:outline-none transition-all duration-200"
            style={{
              color, borderRadius: '14px',
              border: `1px solid ${color}42`,
              backgroundColor: `${color}0e`,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color + '80'; e.currentTarget.style.backgroundColor = color + '1c' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = color + '42'; e.currentTarget.style.backgroundColor = color + '0e' }}
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-6"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {sharedBg}
      <div className="relative flex flex-col items-center">
        <div
          className="font-mono font-light tabular-nums mb-12"
          style={{ fontSize: '5rem', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
        >
          {timeStr}
        </div>
        <button
          onClick={() => { setDone(true); setElapsed(Math.max(1, elapsed)) }}
          className="font-mono text-[11px] tracking-widest uppercase transition-colors focus:outline-none"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          End flow early
        </button>
      </div>
    </div>
  )
}

// State selection — organic cards matching app's StateSelector aesthetic
function StateSelect({ onSelect }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 80) }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{
        backgroundColor: 'var(--bg-base)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.8s ease',
      }}
    >
      {/* Grain texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: GRAIN_BG, backgroundSize: '180px 180px',
        opacity: 0.38, mixBlendMode: 'overlay',
      }} />

      <div className="relative w-full max-w-sm flex flex-col items-center">
        {/* App label */}
        <div
          className="font-mono text-[10px] tracking-[0.32em] uppercase mb-10"
          style={{ color: 'var(--text-muted)' }}
        >
          Regulation Station
        </div>

        {/* Question */}
        <h1
          className="mb-9 font-semibold text-center leading-tight"
          style={{ color: 'var(--text-primary)', fontSize: '26px', letterSpacing: '-0.02em' }}
        >
          How are you right now?
        </h1>

        {/* Organic state cards */}
        <div className="w-full flex flex-col gap-2.5">
          {Object.values(STATES).map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className="w-full text-left focus:outline-none"
              style={{
                borderRadius: RADII[s.id],
                transition: 'transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1)',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.025)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div
                style={{
                  borderRadius: RADII[s.id],
                  border: `1px solid ${s.color}20`,
                  background: `radial-gradient(ellipse at 18% 50%, ${s.color}0d 0%, transparent 62%), var(--bg-panel)`,
                  padding: '18px 20px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color 0.25s ease, background 0.3s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = s.color + '45'
                  e.currentTarget.style.background = `radial-gradient(ellipse at 18% 50%, ${s.color}1a 0%, transparent 62%), var(--bg-panel)`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = s.color + '20'
                  e.currentTarget.style.background = `radial-gradient(ellipse at 18% 50%, ${s.color}0d 0%, transparent 62%), var(--bg-panel)`
                }}
              >
                {/* Grain on card */}
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  backgroundImage: GRAIN_BG, backgroundSize: '130px 130px',
                  opacity: 0.28, mixBlendMode: 'overlay',
                }} />
                <div className="relative">
                  <div style={{ color: s.color, fontWeight: 600, fontSize: '14px', letterSpacing: '-0.01em', marginBottom: '3px' }}>
                    {s.name}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: 1.4 }}>
                    {STATE_SUBLABELS[s.id]}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <p
          className="mt-5 text-center"
          style={{ color: 'var(--text-muted)', fontSize: '11px' }}
        >
          Select honestly — not aspirationally.
        </p>
      </div>
    </div>
  )
}

// ── "Lead with the breath" intro screen ─────────────────────────────
function BreathFirstScreen({ onDone }) {
  const [phase, setPhase] = useState(0) // 0 = dark, 1 = text, 2 = orb, 3 = reveal
  const color = '#52b87e'

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800)   // show text
    const t2 = setTimeout(() => setPhase(2), 2500)   // show orb
    const t3 = setTimeout(() => setPhase(3), 16000)  // after ~1 breath cycle, reveal continue
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ backgroundColor: '#060810' }}
    >
      {/* "Take a breath with me" */}
      <div
        className="flex flex-col items-center gap-10 transition-all duration-1000"
        style={{ opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? 'translateY(0)' : 'translateY(12px)' }}
      >
        <p
          className="font-sans text-xl font-light tracking-wide"
          style={{ color: '#ffffff', opacity: 0.9 }}
        >
          Take a breath with me.
        </p>

        {/* Breathing orb — simple version */}
        <div
          className="transition-all duration-1000"
          style={{ opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'scale(1)' : 'scale(0.8)' }}
        >
          <BreathingOrb color={color} scale={phase >= 2 ? 0.32 : 1} duration="8s" />
        </div>
      </div>

      {/* Continue button — appears after one breath */}
      <div
        className="absolute bottom-16 flex flex-col items-center gap-3 transition-all duration-700"
        style={{ opacity: phase >= 3 ? 1 : 0, transform: phase >= 3 ? 'translateY(0)' : 'translateY(8px)' }}
      >
        <p
          className="font-sans text-sm max-w-xs text-center leading-relaxed"
          style={{ color: '#94a3b8' }}
        >
          Good. I'm <span style={{ color: '#00ff88' }}>VAGA OPS</span> — I help you regulate your nervous system.
        </p>
        <button
          onClick={onDone}
          className="mt-2 font-mono text-[10px] tracking-widest uppercase px-6 py-2.5 rounded-xl border transition-all duration-200"
          style={{ color: '#00ff88', borderColor: '#00ff8840', backgroundColor: '#00ff8808' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#00ff8880'; e.currentTarget.style.backgroundColor = '#00ff8818' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#00ff8840'; e.currentTarget.style.backgroundColor = '#00ff8808' }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

export default function FirstVisitExperience({ onComplete, onStateSelect }) {
  // New flow: breathFirst → select → reset/flowPrep → shift/flowTimer
  const [step, setStep] = useState('breathFirst')
  const [selectedState, setSelectedState] = useState(null)

  const handleSelect = (stateId) => {
    setSelectedState(stateId)
    onStateSelect(STATES[stateId].mapTo)
    if (stateId === 'flow') {
      setStep('flowPrep')
    } else {
      setStep('reset')
    }
  }

  if (step === 'breathFirst') return <BreathFirstScreen onDone={() => setStep('select')} />
  if (step === 'select') return <StateSelect onSelect={handleSelect} />

  if (step === 'reset') {
    return (
      <BreathingTimer
        color={STATES[selectedState].color}
        onComplete={() => setStep('shift')}
        onSkip={() => setStep('shift')}
      />
    )
  }

  if (step === 'shift') {
    return <ShiftCheckin color={STATES[selectedState].color} onComplete={() => onComplete()} />
  }

  if (step === 'flowPrep') return <FlowPrep onStart={() => setStep('flowTimer')} />
  if (step === 'flowTimer') return <FlowTimer onComplete={() => onComplete()} />

  return null
}
