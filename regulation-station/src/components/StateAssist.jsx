import { useState, useEffect } from 'react'

const DISMISS_KEY = 'vaga-state-assist-dismissed'

const STATE_META = {
  frozen: { label: 'Frozen', color: '#c4604a' },
  anxious: { label: 'Anxious', color: '#c8a040' },
  flow:    { label: 'Flow',    color: '#52b87e' },
}

function getRecommendation(energy, focus) {
  if (!energy || !focus) return null
  const eScore = { low: 0, wired: 1, steady: 2 }[energy]
  const fScore = { foggy: 0, scattered: 1, clear: 2 }[focus]
  const score = eScore + fScore
  if (score <= 1) return 'frozen'
  if (score <= 3) return 'anxious'
  return 'flow'
}

export default function StateAssist({ onSelectState, visible }) {
  const [dismissed, setDismissed] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [energy, setEnergy] = useState(null)
  const [focus, setFocus] = useState(null)

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === 'true') {
      setCollapsed(true)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true')
    setDismissed(true)
  }

  const handleAccept = (state) => {
    onSelectState(state)
  }

  if (!visible || dismissed) return null

  const recommended = getRecommendation(energy, focus)
  const recMeta = recommended ? STATE_META[recommended] : null

  if (collapsed) {
    return (
      <div className="mb-4">
        <button
          onClick={() => setCollapsed(false)}
          className="font-mono text-[10px] tracking-widest uppercase transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          ? Quick Check
        </button>
      </div>
    )
  }

  const PillGroup = ({ options, value, onChange }) => (
    <div className="flex gap-1.5">
      {options.map(({ key, label }) => {
        const active = value === key
        return (
          <button
            key={key}
            onClick={() => onChange(active ? null : key)}
            className="px-3 py-1 rounded-full font-mono text-[10px] tracking-widest uppercase transition-all duration-150 border"
            style={{
              borderColor: active ? 'var(--accent-flow)' : 'var(--border)',
              color: active ? 'var(--accent-flow)' : 'var(--text-muted)',
              backgroundColor: active ? 'color-mix(in srgb, var(--accent-flow) 12%, transparent)' : 'transparent',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )

  return (
    <div
      className="mb-6 rounded-xl px-5 py-4 border"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-panel)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] tracking-widest uppercase text-charcoal-400">
          Quick Check
        </span>
        <button
          onClick={handleDismiss}
          className="font-mono text-[11px] text-charcoal-600 hover:text-charcoal-400 transition-colors"
          aria-label="Dismiss quick check"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] tracking-widest uppercase text-charcoal-500 w-14 flex-shrink-0">
            Energy
          </span>
          <PillGroup
            options={[
              { key: 'low', label: 'Low' },
              { key: 'wired', label: 'Wired' },
              { key: 'steady', label: 'Steady' },
            ]}
            value={energy}
            onChange={setEnergy}
          />
        </div>

        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] tracking-widest uppercase text-charcoal-500 w-14 flex-shrink-0">
            Focus
          </span>
          <PillGroup
            options={[
              { key: 'foggy', label: 'Foggy' },
              { key: 'scattered', label: 'Scattered' },
              { key: 'clear', label: 'Clear' },
            ]}
            value={focus}
            onChange={setFocus}
          />
        </div>
      </div>

      {recMeta && (
        <div className="flex items-center gap-3 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <span className="font-mono text-[10px] tracking-widest uppercase text-charcoal-500">
            Suggested
          </span>
          <span
            className="font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full border"
            style={{
              color: recMeta.color,
              borderColor: recMeta.color + '50',
              backgroundColor: recMeta.color + '12',
            }}
          >
            → {recMeta.label}
          </span>
          <button
            onClick={() => handleAccept(recommended)}
            className="font-mono text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border transition-all duration-150"
            style={{
              color: recMeta.color,
              borderColor: recMeta.color + '60',
              backgroundColor: recMeta.color + '10',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = recMeta.color + '22' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = recMeta.color + '10' }}
          >
            Accept
          </button>
        </div>
      )}
    </div>
  )
}
