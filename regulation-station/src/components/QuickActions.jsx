export default function QuickActions({ onFocus, onImmersive, onRupture, stateData }) {
  const accent = stateData?.accentHex ?? '#52b87e'

  return (
    <div className="flex gap-2.5">
      <button
        onClick={onFocus}
        className="flex-1 flex items-center justify-center gap-2 rounded-lg py-3 transition-all duration-1000"
        style={{
          backgroundColor: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--theme-accent) 40%, transparent)'
          e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--theme-accent) 8%, transparent)'
          e.currentTarget.style.color = 'var(--theme-accent)'
          e.currentTarget.querySelector('svg').style.stroke = 'var(--theme-accent)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.backgroundColor = 'var(--bg-panel)'
          e.currentTarget.style.color = 'var(--text-primary)'
          e.currentTarget.querySelector('svg').style.stroke = 'currentColor'
        }}
      >
        <svg style={{ transition: 'stroke 1s ease' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
        </svg>
        <span className="text-[11px] font-semibold">Focus Mode</span>
        <span
          className="text-[8px] font-mono font-semibold rounded px-1 py-0.5 transition-colors duration-1000"
          style={{ backgroundColor: 'var(--bg-panel-alt)', color: 'var(--text-muted)' }}
        >
          F
        </span>
      </button>

      <button
        onClick={onImmersive}
        className="flex-1 flex items-center justify-center gap-2 rounded-lg py-3 transition-all duration-1000"
        style={{
          backgroundColor: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--theme-accent) 40%, transparent)'
          e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--theme-accent) 8%, transparent)'
          e.currentTarget.style.color = 'var(--theme-accent)'
          e.currentTarget.querySelector('svg').style.stroke = 'var(--theme-accent)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.backgroundColor = 'var(--bg-panel)'
          e.currentTarget.style.color = 'var(--text-primary)'
          e.currentTarget.querySelector('svg').style.stroke = 'currentColor'
        }}
      >
        <svg style={{ transition: 'stroke 1s ease' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
        </svg>
        <span className="text-[11px] font-semibold">Immersive</span>
        <span
          className="text-[8px] font-mono font-semibold rounded px-1 py-0.5 transition-colors duration-1000"
          style={{ backgroundColor: 'var(--bg-panel-alt)', color: 'var(--text-muted)' }}
        >
          I
        </span>
      </button>

      <button
        onClick={onRupture}
        className="flex-1 flex items-center justify-center gap-2 rounded-lg py-3 transition-all duration-200"
        style={{
          backgroundColor: '#1a150d',
          border: '1px solid #c8a04030',
          color: '#c8a040',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#c8a04060'
          e.currentTarget.style.backgroundColor = '#c8a04012'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = '#c8a04030'
          e.currentTarget.style.backgroundColor = '#1a150d'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <span className="text-[11px] font-semibold">Rupture</span>
        <span
          className="text-[8px] font-mono font-semibold rounded px-1 py-0.5"
          style={{ backgroundColor: '#c8a04020', color: '#c8a040' }}
        >
          R
        </span>
      </button>
    </div>
  )
}
