import { useState, useEffect } from 'react'

function getTodayKey() {
  return `vaga-intention-${new Date().toISOString().slice(0, 10)}`
}

export default function TodayIntention({ onIntentionSet }) {
  const [intention, setIntention] = useState(() => {
    try { return localStorage.getItem(getTodayKey()) || '' } catch { return '' }
  })
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    onIntentionSet?.(intention)
  }, [intention, onIntentionSet])

  const submit = () => {
    const val = draft.trim()
    if (!val) return
    try { localStorage.setItem(getTodayKey(), val) } catch { /* storage unavailable */ }
    setIntention(val)
    setDraft('')
    setEditing(false)
  }

  const clear = () => {
    try { localStorage.removeItem(getTodayKey()) } catch { /* storage unavailable */ }
    setIntention('')
    setDraft('')
    setEditing(false)
  }

  // Collapsed pill when intention is set
  if (intention && !editing) {
    return (
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <span className="font-mono text-[10px] tracking-widest uppercase text-charcoal-500 shrink-0">Today</span>
        <span
          className="font-mono text-[11px] px-3 py-1 rounded-full border truncate max-w-xs"
          style={{
            color: 'var(--accent-flow)',
            borderColor: 'color-mix(in srgb, var(--accent-flow) 30%, transparent)',
            backgroundColor: 'color-mix(in srgb, var(--accent-flow) 8%, transparent)',
          }}
          title={intention}
        >
          {intention}
        </span>
        <button
          onClick={() => { setDraft(intention); setEditing(true) }}
          className="font-mono text-[9px] tracking-widest uppercase transition-colors shrink-0"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
          title="Edit today's intention"
        >
          edit
        </button>
      </div>
    )
  }

  return (
    <div
      className="mb-4 rounded-xl px-4 py-3 border"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-panel)' }}
    >
      <p className="font-mono text-[10px] tracking-widest uppercase text-charcoal-500 mb-2">
        Today's Intention
      </p>
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 100))}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder="What's one thing you want to accomplish today?"
          className="flex-1 bg-transparent border-b text-sm font-mono focus:outline-none transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-flow)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
        />
        <button
          onClick={submit}
          disabled={!draft.trim()}
          className="font-mono text-[10px] tracking-widest uppercase px-3 py-1 rounded-lg border transition-all duration-200 disabled:opacity-30 shrink-0"
          style={{
            color: 'var(--accent-flow)',
            borderColor: 'color-mix(in srgb, var(--accent-flow) 40%, transparent)',
            backgroundColor: 'color-mix(in srgb, var(--accent-flow) 8%, transparent)',
          }}
        >
          Set
        </button>
        {editing && (
          <button
            onClick={clear}
            className="font-mono text-[10px] tracking-widest uppercase px-2 py-1 transition-colors shrink-0"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            Clear
          </button>
        )}
      </div>
      <p className="font-mono text-[9px] mt-1" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
        {draft.length}/100
      </p>
    </div>
  )
}
