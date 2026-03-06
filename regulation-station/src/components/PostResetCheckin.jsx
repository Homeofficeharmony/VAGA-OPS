import { useState, useEffect, useRef } from 'react'

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

export default function PostResetCheckin({ accentHex, source, onRate }) {
  const [step, setStep] = useState('shift')

  // Use a ref so the auto-dismiss timeout always has access to the
  // latest collected data without stale closure issues.
  const collectedRef = useRef({ outcome: null, shift: null })

  const timerRef = useRef(null)

  // 22-second auto-dismiss covers both steps.
  // On timeout, fires with whatever was collected (step 1 may be complete).
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onRate({ ...collectedRef.current, activationAfter: null })
    }, 22000)
    return () => clearTimeout(timerRef.current)
  }, [onRate])

  const handleShift = ({ outcome, shift }) => {
    collectedRef.current = { outcome, shift }
    setStep('activation')
  }

  const handleActivation = (activationAfter) => {
    clearTimeout(timerRef.current)
    onRate({ ...collectedRef.current, activationAfter })
  }

  const handleSkipActivation = () => {
    clearTimeout(timerRef.current)
    onRate({ ...collectedRef.current, activationAfter: null })
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

      {step === 'shift' ? (
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
        </>
      ) : (
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
    </div>
  )
}
