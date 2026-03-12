import { STATES } from '../data/stateData'

const STATE_KEYS = ['frozen', 'anxious', 'flow']

const STATE_TAG = {
  frozen: 'FROZEN / SHUTDOWN',
  anxious: 'ANXIOUS / HIGH-ALERT',
  flow: 'SAFE / FLOW',
}

const STATE_META = {
  frozen: { dotLabel: 'Terracotta · Low activation', keyNum: '1' },
  anxious: { dotLabel: 'Amber · Mid activation', keyNum: '2' },
  flow: { dotLabel: 'Sage · Peak activation', keyNum: '3' },
}

function StateCard({ stateKey, stateData: s, isActive, onSelect }) {
  const color = s.accentHex
  const meta = STATE_META[stateKey]
  const tag = isActive ? `${STATE_TAG[stateKey]} · ACTIVE` : STATE_TAG[stateKey]

  return (
    <button
      onClick={() => onSelect(stateKey)}
      className="text-left cursor-pointer focus:outline-none w-full transition-all duration-1000"
      style={{
        backgroundColor: isActive ? 'color-mix(in srgb, ' + color + ' 15%, transparent)' : 'var(--bg-panel-alt)',
        borderLeft: `4px solid ${isActive ? color : color + '10'}`,
        borderRight: `1px solid ${isActive ? color + '40' : 'var(--border)'}`,
        borderTop: isActive ? `1px solid ${color}40` : '1px solid transparent',
        borderBottom: isActive ? `1px solid ${color}40` : '1px solid transparent',
        padding: '20px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flex: 1,
        minWidth: 0,
        boxShadow: isActive
          ? `inset 0 0 40px -10px ${color}15, 0 4px 20px -5px ${color}30`
          : 'none',
      }}
    >
      {/* Tag badge */}
      <div
        className="inline-flex self-start rounded px-2.5 py-1"
        style={{
          backgroundColor: color + '26',
        }}
      >
        <span
          className="font-mono text-[10px] font-semibold tracking-[0.08em]"
          style={{ color }}
        >
          {tag}
        </span>
      </div>

      {/* Title */}
      <div className="text-[18px] font-semibold" style={{ color: '#e2ebe3' }}>
        {s.reset?.title ?? s.label}
      </div>

      {/* Description */}
      <div className="text-[12px]" style={{ color: '#7a9b7c' }}>
        {s.reset?.protocol ?? s.sublabel} · {s.audio?.title ?? ''}
      </div>

      {/* Dot + meta label */}
      <div className="flex items-center gap-2 mt-auto">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span
          className="text-[11px]"
          style={{ color: isActive && stateKey === 'flow' ? color : '#7a9b7c' }}
        >
          {meta.dotLabel}
        </span>
      </div>

      {/* Keyboard hint */}
      <div className="flex items-center gap-1.5">
        <div
          className="w-5 h-5 rounded flex items-center justify-center"
          style={{
            backgroundColor: isActive && stateKey === 'flow' ? color + '30' : '#263024',
          }}
        >
          <span
            className="font-mono text-[10px] font-semibold"
            style={{ color: isActive && stateKey === 'flow' ? color : '#7a9b7c' }}
          >
            {meta.keyNum}
          </span>
        </div>
        <span
          className="text-[10px]"
          style={{ color: isActive ? color : '#4a6b4c' }}
        >
          {isActive ? 'active' : 'to select'}
        </span>
      </div>
    </button>
  )
}

export default function StateSelector({ selected, onSelect }) {
  return (
    <section
      className="w-full flex"
      style={{
        backgroundColor: '#0d110e',
        borderBottom: '1px solid #1e2b1f',
        height: 'auto', // Let content define height instead of a fixed 148px
        minHeight: '160px', // Provide a minimum height that accommodates the new elements
      }}
    >
      {STATE_KEYS.map((key) => (
        <StateCard
          key={key}
          stateKey={key}
          stateData={STATES[key]}
          isActive={selected === key}
          onSelect={onSelect}
        />
      ))}
    </section>
  )
}
