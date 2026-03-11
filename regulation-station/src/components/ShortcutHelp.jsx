import { useEffect } from 'react'

const SHORTCUTS = [
  { key: '1 / 2 / 3',    action: 'Select Frozen / Anxious / Flow' },
  { key: 'A',            action: 'Toggle Ambient Mode (state required)' },
  { key: 'R',            action: 'Overwhelm Response' },
  { key: 'F',            action: 'Start 60-sec protocol (full screen)' },
  { key: 'I',            action: 'Toggle Immersion mode' },
  { key: 'Cmd+F',        action: 'Flow Lock (Flow state only)' },
  { key: 'Cmd+Shift+R',  action: 'Emergency Breathe' },
  { key: 'Esc',          action: 'Close overlays' },
  { key: '?',            action: 'This help screen' },
]

export default function ShortcutHelp({ open, onClose }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(9, 11, 15, 0.92)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 border animate-fade-in-up"
        style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase" style={{ color: 'var(--accent-flow)' }}>
            Keyboard Shortcuts
          </span>
          <button
            onClick={onClose}
            className="font-mono text-[10px] tracking-widest uppercase transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            Esc to close
          </button>
        </div>

        <div className="space-y-0">
          {SHORTCUTS.map(({ key, action }) => (
            <div
              key={key}
              className="flex items-center justify-between py-2.5 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <kbd
                className="font-mono text-[11px] px-2 py-0.5 rounded border min-w-[90px]"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border)',
                  color: 'var(--accent-flow)',
                }}
              >
                {key}
              </kbd>
              <span className="text-sm ml-4 text-right" style={{ color: 'var(--text-secondary)' }}>
                {action}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
