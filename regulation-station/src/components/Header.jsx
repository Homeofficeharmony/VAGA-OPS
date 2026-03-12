import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from './AuthModal'
import ThemeToggle from './ThemeToggle'

const NAV_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'intelligence', label: 'Intelligence' },
  { id: 'team', label: 'Team' },
]

export default function Header({ isImmersive, onShortcutHelp, activeNav, onNavChange }) {
  const { user, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  if (isImmersive) return null

  return (
    <header
      className="flex items-center justify-between sticky top-0 z-50"
      style={{
        height: '64px',
        backgroundColor: '#0d110e',
        borderBottom: '1px solid #1e2b1f',
        padding: '0 32px',
      }}
    >
      {/* Left — Logo */}
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#52b87e' }} />
        <span
          className="text-[16px] font-semibold"
          style={{ color: '#e2ebe3', letterSpacing: '-0.3px', fontFamily: 'Inter, sans-serif' }}
        >
          Regulation Station
        </span>
      </div>

      {/* Center — Nav tabs */}
      <nav className="hidden md:flex items-center gap-6">
        {NAV_TABS.map(tab => {
          const isActive = (activeNav ?? 'dashboard') === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onNavChange?.(tab.id)}
              className="flex flex-col items-center gap-1 focus:outline-none transition-colors duration-200"
            >
              <span
                className="text-[13px]"
                style={{
                  color: isActive ? '#52b87e' : '#7a9b7c',
                  fontWeight: isActive ? 500 : 400,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {tab.label}
              </span>
              {isActive && (
                <div
                  className="rounded-sm"
                  style={{
                    width: '100%',
                    height: '2px',
                    backgroundColor: '#52b87e',
                  }}
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* Right — Controls */}
      <div className="flex items-center gap-3">
        {/* Shortcut help */}
        <button
          onClick={onShortcutHelp}
          className="flex items-center justify-center rounded-full transition-colors duration-200"
          style={{
            width: '30px',
            height: '30px',
            backgroundColor: '#161d15',
            border: '1px solid #263024',
          }}
        >
          <span
            className="font-mono text-[12px] font-semibold"
            style={{ color: '#7a9b7c' }}
          >
            ?
          </span>
        </button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Auth */}
        {!user ? (
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center justify-center rounded-md transition-colors duration-200"
            style={{
              width: '80px',
              height: '32px',
              backgroundColor: '#52b87e',
              color: '#0f1410',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Sign In
          </button>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(v => !v)}
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              style={{
                background: '#52b87e18',
                border: '1px solid #52b87e35',
              }}
            >
              <span className="font-mono text-xs uppercase" style={{ color: '#52b87e' }}>
                {user.email?.[0] ?? '?'}
              </span>
            </button>
            {showUserMenu && (
              <div
                className="absolute right-0 top-10 rounded-lg p-1 z-20 min-w-[160px]"
                style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}
              >
                <div className="font-mono text-[10px] text-charcoal-400 px-3 py-2 truncate">
                  {user.email}
                </div>
                <div style={{ borderTop: '1px solid var(--border)' }} />
                <button
                  onClick={() => { signOut(); setShowUserMenu(false) }}
                  className="font-mono text-[10px] tracking-widest uppercase px-3 py-2 w-full text-left transition-colors text-ered hover:bg-ered-glow"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </header>
  )
}
