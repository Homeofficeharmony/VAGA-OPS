import { STATES } from '../data/stateData'

const STATE_KEYS = ['frozen', 'anxious', 'flow']

// Noise grain texture — adds depth and organic warmth
const GRAIN_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.09'/%3E%3C/svg%3E")`

// Asymmetric organic border-radius per state personality
const RADII = {
  frozen: { rest: '20px 12px 20px 12px', active: '26px 16px 26px 16px' }, // crystalline symmetry
  anxious: { rest: '12px 22px 12px 22px', active: '16px 28px 16px 28px' }, // off-balance tension
  flow: { rest: '20px 20px 10px 20px', active: '26px 26px 14px 26px' }, // leaf-curve softness
}

// Botanical SVG icons — hand-drawn feel, line-weight varies by state energy
function FrozenIcon({ color }) {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
      {[0, 60, 120].map(a => (
        <g key={a} transform={`rotate(${a} 15 15)`}>
          <line x1="15" y1="2" x2="15" y2="28" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
          <line x1="15" y1="8" x2="11.5" y2="4.5" stroke={color} strokeWidth="0.9" strokeLinecap="round" opacity="0.65" />
          <line x1="15" y1="8" x2="18.5" y2="4.5" stroke={color} strokeWidth="0.9" strokeLinecap="round" opacity="0.65" />
          <line x1="15" y1="22" x2="11.5" y2="25.5" stroke={color} strokeWidth="0.9" strokeLinecap="round" opacity="0.65" />
          <line x1="15" y1="22" x2="18.5" y2="25.5" stroke={color} strokeWidth="0.9" strokeLinecap="round" opacity="0.65" />
        </g>
      ))}
      <circle cx="15" cy="15" r="2.2" fill={color} opacity="0.45" />
    </svg>
  )
}

function AnxiousIcon({ color }) {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
      <path
        d="M18 2 L11 13.5 L16.5 13.5 L9 28 L22 15 L16 15 L21.5 2Z"
        stroke={color} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round"
        fill={color} fillOpacity="0.14"
      />
      <line x1="11" y1="13.5" x2="6" y2="11.5" stroke={color} strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
      <line x1="11" y1="13.5" x2="6.5" y2="16.5" stroke={color} strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
      <line x1="9" y1="28" x2="5" y2="25.5" stroke={color} strokeWidth="0.8" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}

function FlowIcon({ color }) {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
      <path
        d="M7 26 C7 26, 5 9, 23 5 C23 5, 13 10, 15 26 Z"
        stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
        fill={color} fillOpacity="0.14"
      />
      {/* Central vein */}
      <path d="M11 25 C14 18, 19 13, 21 7" stroke={color} strokeWidth="0.85" strokeLinecap="round" opacity="0.6" />
      {/* Side veins */}
      <path d="M11 25 C9 21, 7.5 18, 9 13" stroke={color} strokeWidth="0.6" strokeLinecap="round" opacity="0.38" />
      <path d="M13 20 C16 18, 18 16, 20 11" stroke={color} strokeWidth="0.5" strokeLinecap="round" opacity="0.28" />
    </svg>
  )
}

const ICONS = { frozen: FrozenIcon, anxious: AnxiousIcon, flow: FlowIcon }

const HOVER_PREVIEW = {
  frozen: 'Unlocks: Ear-Apex Pull · Low-activation tasks · Theta audio',
  anxious: 'Unlocks: Rib-Cage Expansion · Focused tasks · Alpha audio',
  flow: 'Unlocks: Peripheral Vision Soften · Deep work tasks · Gamma audio',
}

function StateCard({ stateKey, stateData: s, isActive, onSelect }) {
  const Icon = ICONS[stateKey]
  const radius = RADII[stateKey][isActive ? 'active' : 'rest']

  return (
    <button
      onClick={() => onSelect(stateKey)}
      className={`relative text-left cursor-pointer focus:outline-none w-full group/card ${isActive ? 'state-breathe' : ''}`}
      style={{
        borderRadius: radius,
        transform: isActive ? undefined : 'scale(1)',
        transition: 'transform 0.45s cubic-bezier(0.34, 1.4, 0.64, 1)',
      }}
    >
      {/* Ambient glow halo — active only */}
      {isActive && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: radius,
            boxShadow: `0 0 0 1px ${s.accentHex}50, 0 6px 36px ${s.accentHex}1e, 0 0 80px ${s.accentHex}0d`,
            transition: 'box-shadow 0.5s ease',
            transitionDelay: '0.4s',
          }}
        />
      )}

      {/* Card surface */}
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: radius,
          border: `1px solid ${isActive ? s.accentHex + '50' : s.accentHex + '1c'}`,
          background: isActive
            ? `radial-gradient(ellipse at 22% 28%, ${s.accentHex}1a 0%, transparent 62%), var(--bg-panel)`
            : `radial-gradient(ellipse at 50% 50%, ${s.accentHex}09 0%, transparent 55%), var(--bg-panel)`,
          padding: '18px 16px 16px',
          opacity: isActive ? 1 : 0.6,
          transition: 'opacity 0.35s ease, border-color 0.5s ease, background 0.45s ease, padding 0.35s ease, box-shadow 0.5s ease',
          transitionDelay: isActive ? '0s' : '0.4s',
        }}
      >
        {/* Grain overlay */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: GRAIN_BG,
            backgroundSize: '150px 150px',
            opacity: 0.38,
            mixBlendMode: 'overlay',
          }}
        />

        {/* Hover shimmer for inactive cards */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-0 group-hover/card:opacity-100 pointer-events-none transition-opacity duration-300"
          style={{ background: `radial-gradient(ellipse at 50% 10%, ${s.accentHex}0b 0%, transparent 65%)` }}
        />

        {/* Active pulse dot */}
        {isActive && (
          <span
            aria-hidden
            className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full animate-pulse-slow"
            style={{
              backgroundColor: s.accentHex,
              boxShadow: `0 0 7px ${s.accentHex}`,
              transition: 'background-color 0.5s ease, box-shadow 0.5s ease',
              transitionDelay: '0.4s',
            }}
          />
        )}

        {/* Hover preview — shows what unlocks on hover of inactive card */}
        {!isActive && (
          <div
            className="absolute bottom-0 left-0 right-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 pointer-events-none"
            style={{
              borderTop: `1px solid ${s.accentHex}22`,
              backgroundColor: `${s.accentHex}08`,
              borderRadius: '0 0 inherit inherit',
              padding: '5px 10px 7px',
            }}
          >
            <span className="font-mono text-[8px] leading-tight block" style={{ color: s.accentHex + '99' }}>
              {HOVER_PREVIEW[stateKey]}
            </span>
          </div>
        )}

        {/* Botanical icon */}
        <div className="mb-3" style={{ opacity: isActive ? 1 : 0.72, transition: 'opacity 0.3s ease' }}>
          <Icon color={s.accentHex} />
        </div>

        {/* State label */}
        <div
          className="font-semibold mb-1 leading-tight"
          style={{
            color: isActive ? s.accentHex : 'var(--text-primary)',
            fontSize: '14px',
            letterSpacing: '-0.01em',
            transition: 'color 0.3s ease',
          }}
        >
          {s.label}
        </div>

        {/* Sublabel */}
        <div style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: 1.45 }}>
          {s.sublabel}
        </div>

        {/* Polyvagal note — slides in when active */}
        {isActive && (
          <div
            className="animate-fade-in font-mono"
            style={{
              marginTop: '12px',
              paddingTop: '11px',
              borderTop: `1px solid ${s.accentHex}22`,
              color: s.accentHex + '88',
              fontSize: '10px',
              letterSpacing: '0.025em',
              lineHeight: 1.55,
            }}
          >
            {s.polyvagalNote}
          </div>
        )}
      </div>
    </button>
  )
}

export default function StateSelector({ selected, onSelect }) {
  return (
    <section>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {STATE_KEYS.map(key => (
          <StateCard
            key={key}
            stateKey={key}
            stateData={STATES[key]}
            isActive={selected === key}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  )
}
