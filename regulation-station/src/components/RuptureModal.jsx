import { useEffect } from 'react'

const RED = '#ff3d5a'
const AMBER = '#ffb800'
const GREEN = '#00ff88'

const tiers = [
  {
    title: 'Right now',
    tier: 'Tier 1',
    body: 'Close all tabs. DND on. Change your physical environment. No decisions for 2 hours.',
    borderColor: RED,
  },
  {
    title: 'Call someone',
    tier: 'Tier 2',
    body: "Text one person in your support system. Co-regulation is a biological imperative. You don't have to explain.",
    borderColor: AMBER,
  },
  {
    title: 'Next 72 hours',
    tier: 'Tier 3',
    body: 'Max 4hr work/day. No new pitches. 8hr sleep. One walk. Strip down commitments until your system resets.',
    borderColor: GREEN,
  },
]

export default function RuptureModal({ open, onClose, onEmergencyReset }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 overflow-y-auto backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(9, 11, 15, 0.95)' }}
    >
      <div className="max-w-2xl w-full text-center mt-12 mb-12 animate-fade-in-up">
        {/* Warning icon */}
        <div className="text-4xl mb-4" style={{ color: RED, opacity: 0.8 }}>⚠</div>

        {/* Title */}
        <h2
          className="font-mono tracking-widest uppercase mb-2"
          style={{ color: RED, fontSize: '1.4rem', letterSpacing: '0.28em' }}
        >
          Overwhelm Response
        </h2>

        {/* Sub */}
        <p className="font-mono text-[10px] tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
          Level 8–10 Burnout Response
        </p>
        <p className="font-mono text-[10px] tracking-widest mb-8" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
          Use this when you feel overwhelmed beyond a 7/10 — not for regular stress.
        </p>

        {/* Intro */}
        <div className="mb-10 p-6 rounded-xl border border-charcoal-800 bg-charcoal-900/50 text-left shadow-lg">
          <h3 className="font-mono text-[11px] tracking-widest uppercase mb-3 text-slate-300">What is a Rupture?</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            A rupture is a sudden break in your window of tolerance—a spike of acute stress, panic, or shutdown.
            When your nervous system is hijacked, cognitive problem-solving fails. Your only objective right now is biological stabilization.
          </p>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {tiers.map(({ title, tier, body, borderColor }) => (
            <div
              key={tier}
              className="rounded-xl p-6 text-left border border-charcoal-800 bg-[#111318] shadow-md transition-transform duration-300 hover:-translate-y-1"
              style={{
                borderTopColor: borderColor,
                borderTopWidth: '3px',
              }}
            >
              <div
                className="font-mono text-[9px] tracking-widest uppercase mb-1.5"
                style={{ color: borderColor, opacity: 0.8 }}
              >
                {tier}
              </div>
              <div
                className="font-mono text-[11px] font-semibold tracking-wider uppercase mb-3 text-slate-200"
              >
                {title}
              </div>
              <p className="text-[13px] text-slate-400 leading-relaxed">
                {body}
              </p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          {onEmergencyReset && (
            <button
              onClick={onEmergencyReset}
              className="w-full sm:w-auto font-mono text-[11px] font-semibold tracking-widest uppercase px-10 py-3.5 rounded-xl transition-all duration-300 shadow-lg"
              style={{
                backgroundColor: RED,
                color: '#fff',
                boxShadow: `0 4px 20px ${RED}40`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)'
                e.currentTarget.style.boxShadow = `0 6px 24px ${RED}60`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = `0 4px 20px ${RED}40`
              }}
            >
              Emergency 30s Reset
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full sm:w-auto font-mono text-[11px] tracking-widest uppercase px-10 py-3.5 rounded-xl border transition-all duration-200"
            style={{
              borderColor: '#3a404d',
              color: 'var(--text-muted)',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)'
              e.currentTarget.style.borderColor = '#475060'
              e.currentTarget.style.backgroundColor = '#1a1f29'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.borderColor = '#3a404d'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            I'm Okay, Close
          </button>
        </div>
      </div>
    </div>
  )
}
