import { useState, useEffect, useRef } from 'react'
import { getActivationComparison } from '../lib/chartData'

const SHIFT_BUTTONS = [
  { label: 'Worse',       outcome: 'worse',      shift: -1 },
  { label: 'No change',   outcome: 'same',        shift:  0 },
  { label: 'Better',      outcome: 'better',      shift:  1 },
  { label: 'Much better', outcome: 'much-better', shift:  2 },
]

const SOURCE_LABEL = {
  stealth: '60-sec reset complete',
  panic:   '30-sec reset complete',
}

const ACTIVATION_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// Bar chart SVG showing before/after activation levels.
// Points: Array<{ x: 'Before'|'After', y: number }>
// accentHex: state color from App.jsx
function ActivationBars({ points, accentHex }) {
  if (!points || points.length !== 2) return null

  const MAX_BAR_H = 60
  const BAR_W = 32
  const GAP = 8
  const LABEL_Y_TOP = 12      // y for value label above bar
  const BAR_Y_BASE = 76       // y for bottom of bars
  const AXIS_LABEL_Y = 86     // y for Before/After label

  const totalGroupW = BAR_W * 2 + GAP
  const groupX = (140 - totalGroupW) / 2  // center group in 140-wide viewBox

  return (
    <svg
      viewBox="0 0 140 90"
      width="100%"
      aria-label="Activation before and after reset"
    >
      {points.map((pt, i) => {
        const barH = Math.max(2, (pt.y / 10) * MAX_BAR_H)
        const barX = groupX + i * (BAR_W + GAP)
        const barY = BAR_Y_BASE - barH
        const fillOpacity = i === 0 ? 0.4 : 1.0

        return (
          <g key={pt.x}>
            {/* Bar */}
            <rect
              x={barX}
              y={barY}
              width={BAR_W}
              height={barH}
              rx={4}
              fill={accentHex}
              fillOpacity={fillOpacity}
            />
            {/* Value label above bar */}
            <text
              x={barX + BAR_W / 2}
              y={barY - 4}
              textAnchor="middle"
              fontFamily="'JetBrains Mono', monospace"
              fontSize="10"
              fontWeight="bold"
              fill={accentHex}
            >
              {pt.y}
            </text>
            {/* Before/After label below bar */}
            <text
              x={barX + BAR_W / 2}
              y={AXIS_LABEL_Y}
              textAnchor="middle"
              fontFamily="'JetBrains Mono', monospace"
              fontSize="9"
              fill="var(--text-muted)"
            >
              {pt.x}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function PostResetCheckin({ accentHex, source, activationBefore, onRate }) {
  const [step, setStep] = useState('shift')
  const [compPoints, setCompPoints] = useState(null)

  // Use a ref so the auto-dismiss timeout always has access to the
  // latest collected data without stale closure issues.
  const collectedRef = useRef({ outcome: null, shift: null, activationAfter: null })

  const timerRef = useRef(null)

  // No auto-dismiss — user closes manually via rating or skip

  const handleShift = ({ outcome, shift }) => {
    collectedRef.current = { ...collectedRef.current, outcome, shift }
    setStep('activation')
  }

  const handleActivation = (activationAfter) => {
    collectedRef.current = { ...collectedRef.current, activationAfter }

    // Try to build comparison points
    const points = getActivationComparison({
      activationBefore,
      activationAfter,
      state: undefined,
    })

    if (points.length === 2) {
      // Show result step briefly before dismissing
      setCompPoints(points)
      setStep('result')
    } else {
      // No activationBefore — dismiss immediately as before
      clearTimeout(timerRef.current)
      onRate({ ...collectedRef.current, activationAfter })
    }
  }

  const handleSkipActivation = () => {
    clearTimeout(timerRef.current)
    onRate({ ...collectedRef.current, activationAfter: null })
  }

  const handleDone = () => {
    clearTimeout(timerRef.current)
    onRate({ ...collectedRef.current })
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-[300px] rounded-xl p-4 border"
      style={{
        backgroundColor: 'var(--bg-panel)',
        borderColor: 'var(--border)',
        animation: 'slideUp 0.3s ease-out both',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {source && (
        <p className="font-mono text-[9px] tracking-widest uppercase mb-1" style={{ color: accentHex + '80' }}>
          {SOURCE_LABEL[source]}
        </p>
      )}

      {step === 'shift' && (
        <>
          <p className="font-mono text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: accentHex }}>
            How do you feel now?
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {SHIFT_BUTTONS.map(({ label, outcome, shift }) => (
              <button
                key={outcome}
                onClick={() => handleShift({ outcome, shift })}
                className="py-2 rounded-lg text-xs font-mono font-medium transition-all duration-200 border"
                style={{
                  borderColor: accentHex + '50',
                  color: accentHex,
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = accentHex + '18'
                  e.currentTarget.style.boxShadow = `0 0 8px ${accentHex}30`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => { clearTimeout(timerRef.current); onRate({ outcome: null, shift: 0, activationAfter: null }) }}
            className="mt-2 w-full text-[9px] font-mono tracking-widest uppercase transition-colors"
            style={{ color: accentHex + '35' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = accentHex + '65' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = accentHex + '35' }}
          >
            skip
          </button>
        </>
      )}

      {step === 'activation' && (
        <>
          <p className="font-mono text-sm font-semibold tracking-widest uppercase mb-1" style={{ color: accentHex }}>
            Energy level now?
          </p>
          <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: accentHex + '70' }}>
            0 = drained · 10 = wired
          </p>
          <div className="flex gap-1">
            {ACTIVATION_LEVELS.map((n) => (
              <button
                key={n}
                onClick={() => handleActivation(n)}
                className="flex-1 py-1.5 rounded text-[11px] font-mono font-bold transition-all duration-150 border"
                style={{
                  borderColor: accentHex + '40',
                  color: accentHex,
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = accentHex + '25'
                  e.currentTarget.style.borderColor = accentHex + '80'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = accentHex + '40'
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <button
            onClick={handleSkipActivation}
            className="mt-2 w-full text-[9px] font-mono tracking-widest uppercase transition-colors"
            style={{ color: accentHex + '40' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = accentHex + '70' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = accentHex + '40' }}
          >
            skip
          </button>
        </>
      )}

      {step === 'result' && compPoints && (
        <>
          <p className="font-mono text-[9px] tracking-widest uppercase mb-2" style={{ color: accentHex + '80' }}>
            Regulation shift
          </p>
          <ActivationBars points={compPoints} accentHex={accentHex} />
          <p
            className="font-mono text-[10px] tracking-widest text-center mt-1 mb-3"
            style={{ color: accentHex + '90' }}
          >
            Activation: {compPoints[0].y} &rarr; {compPoints[1].y}
          </p>
          <button
            onClick={handleDone}
            className="w-full py-2 rounded-lg text-xs font-mono font-semibold tracking-widest uppercase transition-all duration-200 border"
            style={{
              borderColor: accentHex,
              color: accentHex,
              backgroundColor: accentHex + '14',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = accentHex + '28'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = accentHex + '14'
            }}
          >
            Done
          </button>
        </>
      )}
    </div>
  )
}
