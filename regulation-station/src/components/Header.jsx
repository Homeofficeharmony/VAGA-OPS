import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from './AuthModal'
import ThemeToggle from './ThemeToggle'

export default function Header({ onShortcutHelp, accentHex = '#52b87e' }) {
  const { user, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header
      className="flex items-center justify-between sticky top-0 z-50"
      style={{
        height: '52px',
        backgroundColor: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full transition-colors duration-700"
          style={{ backgroundColor: accentHex }}
        />
        <span
          className="text-[15px] font-semibold"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.2px', fontFamily: 'Inter, sans-serif' }}
        >
          VAGA OPS
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2.5">
        {/* Shortcut help */}
        <button
          onClick={onShortcutHelp}
          className="flex items-center justify-center rounded-full transition-colors duration-200"
          style={{
            width: '28px',
            height: '28px',
            backgroundColor: 'var(--bg-base)',
            border: '1px solid var(--border)',
          }}
        >
          <span className="font-mono text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
            ?
          </span>
        </button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Auth */}
        {!user ? (
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center justify-center rounded-md transition-colors duration-700"
            style={{
              width: '72px',
              height: '28px',
              backgroundColor: accentHex,
              color: '#0f1410',
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Sign In
          </button>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
              style={{
                background: accentHex + '18',
                border: `1px solid ${accentHex}35`,
              }}
            >
              <span className="font-mono text-[10px] uppercase" style={{ color: accentHex }}>
                {user.email?.[0] ?? '?'}
              </span>
            </button>
            {showUserMenu && (
              <div
                className="absolute right-0 top-9 rounded-lg p-1 z-20 min-w-[150px]"
                style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}
              >
                <div className="font-mono text-[10px] px-3 py-2 truncate" style={{ color: 'var(--text-muted)' }}>
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
