export default function BottomNav({ activePage, onNavigate, stateData, hasState, onNeedsState }) {
  const accent = stateData?.accentHex ?? '#52b87e'

  const tabs = [
    {
      key: 'state-select',
      label: 'State',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3" fill={active ? accent : 'none'} stroke={active ? accent : 'currentColor'} />
        </svg>
      ),
    },
    {
      key: 'breathe',
      label: 'Breathe',
      icon: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
          <path d="M12 8v4l2 2" />
        </svg>
      ),
    },
    {
      key: 'listen',
      label: 'Listen',
      icon: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
          <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
      ),
    },
    {
      key: 'tasks',
      label: 'Tasks',
      icon: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
    {
      key: 'history',
      label: 'History',
      icon: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 15 15" />
        </svg>
      ),
    },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch justify-around"
      style={{
        height: '64px',
        backgroundColor: 'var(--bg-panel)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {tabs.map(({ key, label, icon }) => {
        const isActive = activePage === key
        const disabled = !hasState && key !== 'state-select'

        return (
          <button
            key={key}
            onClick={() => {
              if (disabled) {
                onNeedsState?.()
              } else {
                onNavigate(key)
              }
            }}
            className="flex flex-col items-center justify-center gap-1 flex-1 transition-all duration-200"
            style={{
              color: isActive ? accent : 'var(--text-muted)',
              opacity: disabled ? 0.35 : 1,
            }}
          >
            {icon(isActive)}
            <span
              className="text-[10px] font-medium tracking-wide"
              style={{ color: isActive ? accent : 'var(--text-muted)' }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
