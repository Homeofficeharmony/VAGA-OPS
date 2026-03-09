import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from './AuthModal'
import ThemeToggle from './ThemeToggle'

function getWeeklyCount(sessions) {
  const today = new Date()
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() - 6)
  cutoff.setHours(0, 0, 0, 0)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  const daySet = new Set(sessions.filter((s) => s.date >= cutoffStr).map((s) => s.date))
  return daySet.size
}

export default function Header({ streak = 0, sessions = [], onRuptureClick, isImmersive, onToggleImmersive, selectedState, onShortcutHelp }) {
  const [time, setTime] = useState(new Date())
  const { user, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const weeklyCount = getWeeklyCount(sessions)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const fmt = (d) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

  const dateFmt = (d) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()

  // Gauge calculation (dummy HRV proxy for visual)
  // 78% default, changes slightly based on state
  let gaugePct = 78
  let gaugeColor = '#52b87e'
  if (selectedState === 'anxious') { gaugePct = 42; gaugeColor = '#c8a040' }
  if (selectedState === 'frozen') { gaugePct = 31; gaugeColor = '#c4604a' }

  return (
    <header className="border-b sticky top-0 z-50 transition-colors duration-500" style={{
      borderColor: isImmersive ? 'rgba(34,38,47,0.5)' : 'var(--border)',
      backgroundColor: isImmersive ? 'rgba(10,13,20,0.4)' : 'var(--bg-base)',
      backdropFilter: isImmersive ? 'blur(10px)' : 'none'
    }}>
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">

        {/* Brand lockup */}
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border"
            style={{ borderColor: 'color-mix(in srgb, var(--accent-flow) 25%, transparent)', boxShadow: '0 0 12px color-mix(in srgb, var(--accent-flow) 18%, transparent)' }}>
            <img
              src="/vaga-ops-logo.jpg"
              alt="VAGA OPS logo"
              className="w-full h-full object-cover"
              style={{ objectPosition: '50% 45%', transform: 'scale(1.6)' }}
            />
          </div>

          {/* Wordmark */}
          <div className="hidden sm:block">
            <div className="font-mono text-sm font-semibold tracking-[0.18em] uppercase leading-tight" style={{ color: 'var(--accent-flow)' }}>
              VAGA OPS
            </div>
            <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-charcoal-500 leading-tight">
              Regulation Station
            </div>
          </div>
        </div>



        {/* Right status */}
        <div className="flex items-center gap-3 md:gap-5">

          {/* Auth */}
          {!user ? (
            <button
              onClick={() => setShowAuthModal(true)}
              className="font-mono text-[10px] tracking-widest uppercase transition-all duration-200 px-3 py-1 rounded-full border hide-in-immersion"
              style={{ color: 'var(--accent-flow)', borderColor: 'color-mix(in srgb, var(--accent-flow) 35%, transparent)', backgroundColor: 'color-mix(in srgb, var(--accent-flow) 8%, transparent)', display: isImmersive ? 'none' : 'block' }}
            >
              Sign In
            </button>
          ) : (
            <div className="relative" style={{ display: isImmersive ? 'none' : 'block' }}>
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
                style={{
                  background: 'color-mix(in srgb, var(--accent-flow) 18%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--accent-flow) 35%, transparent)',
                }}
              >
                <span className="font-mono text-xs uppercase leading-none" style={{ color: 'var(--accent-flow)' }}>
                  {user.email?.[0] ?? '?'}
                </span>
              </button>
              {showUserMenu && (
                <div
                  className="absolute right-0 top-9 rounded-lg p-1 z-20 min-w-[160px]"
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



          {/* Rupture Panic */}
          <button
            onClick={onRuptureClick}
            className="font-mono text-[10px] tracking-widest w-7 h-7 flex items-center justify-center rounded border transition-all duration-200"
            style={{
              borderColor: 'color-mix(in srgb, var(--accent-frozen) 40%, transparent)',
              color: 'var(--accent-frozen)',
              backgroundColor: 'transparent',
            }}
            title="Rupture Protocol"
          >
            ⚠
          </button>

          <div className="hidden sm:block text-right">
            <div className="font-mono text-xs text-slate-300 tabular-nums">{fmt(time)}</div>
            <div className="font-mono text-[9px] text-charcoal-500 tracking-widest">{dateFmt(time)}</div>
          </div>
        </div>
      </div>

      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </header>
  )
}
