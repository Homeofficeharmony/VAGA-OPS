import { useState } from 'react'
import { STATES } from '../data/stateData'
import StateAssist from './StateAssist'

const STATE_KEYS = ['frozen', 'anxious', 'flow']

export default function StateSelectorPage({ selected, onSelect }) {
  const [showAssist, setShowAssist] = useState(false)

  return (
    <div className="page-content flex flex-col items-center justify-center min-h-full px-6 py-16 page-enter">

      {/* Heading */}
      <div className="text-center mb-10">
        <h1
          className="text-[26px] font-light tracking-wide mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Where are you right now?
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
          Choose your current nervous system state
        </p>
      </div>

      {/* State Cards */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        {STATE_KEYS.map((key) => {
          const s = STATES[key]
          const isSelected = selected === key

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className="flex flex-col items-center gap-3 py-8 rounded-2xl transition-all duration-300"
              style={{
                backgroundColor: isSelected ? `${s.accentHex}18` : 'var(--bg-panel)',
                border: `1px solid ${isSelected ? s.accentHex + '70' : 'var(--border)'}`,
                boxShadow: isSelected ? `0 0 32px ${s.accentHex}18` : 'none',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <span className="text-5xl">{s.emoji}</span>
              <div className="flex flex-col items-center gap-1">
                <span
                  className="text-[17px] font-medium"
                  style={{ color: isSelected ? s.accentHex : 'var(--text-primary)' }}
                >
                  {s.label}
                </span>
                <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  {s.sublabel}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Quiz link */}
      <button
        onClick={() => setShowAssist(true)}
        className="text-[12px] mt-8 underline underline-offset-4 transition-opacity hover:opacity-80"
        style={{ color: 'var(--text-muted)' }}
      >
        Not sure? Take the quiz →
      </button>

      {showAssist && (
        <StateAssist onDismiss={() => setShowAssist(false)} />
      )}
    </div>
  )
}
