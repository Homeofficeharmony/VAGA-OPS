import { STATES } from '../data/stateData'

const STATE_ROWS = [
  { key: 'frozen', label: 'Frozen / Shutdown', sub: 'Theta · 180+5 Hz · Low VVC', color: '#c4604a' },
  { key: 'anxious', label: 'Anxious / High-Alert', sub: 'Alpha · 200+10 Hz · SNS active', color: '#c8a040' },
  { key: 'flow', label: 'Safe / Flow', sub: 'Gamma · 200+40 Hz · High VVC', color: '#52b87e' },
]

export default function StateIndex({ selectedState }) {
  return (
    <div
      className="rounded-[10px] flex flex-col gap-2.5"
      style={{
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        padding: '16px',
      }}
    >
      <div
        className="font-mono text-[10px] font-semibold tracking-[0.06em] uppercase"
        style={{ color: '#7a9b7c' }}
      >
        State Index
      </div>
      {STATE_ROWS.map(({ key, label, sub, color }) => {
        const isActive = selectedState === key
        return (
          <div
            key={key}
            className="flex items-center gap-2 rounded-md"
            style={{
              padding: isActive ? '6px 8px' : '4px 0',
              backgroundColor: isActive ? color + '12' : 'transparent',
            }}
          >
            <div
              className="rounded-sm flex-shrink-0"
              style={{
                width: 4,
                height: 32,
                backgroundColor: color,
              }}
            />
            <div className="flex flex-col gap-0.5">
              <span
                className="text-[11px] font-semibold"
                style={{ color }}
              >
                {label}{isActive ? ' ← Active' : ''}
              </span>
              <span
                className="text-[10px]"
                style={{ color: '#7a9b7c' }}
              >
                {sub}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
