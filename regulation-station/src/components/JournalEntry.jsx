import { useState, useEffect } from 'react'

function getTodayJournalKey() {
  return `vaga-journal-${new Date().toISOString().slice(0, 10)}`
}

function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function JournalEntry() {
  const [log, setLog] = useState(() => {
    try { return localStorage.getItem(getTodayJournalKey()) || '' } catch { return '' }
  })

  useEffect(() => {
    try { localStorage.setItem(getTodayJournalKey(), log) } catch { /* */ }
  }, [log])

  return (
    <div
      className="rounded-[10px] flex flex-col gap-2"
      style={{
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        padding: '14px',
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="font-mono text-[10px] font-semibold tracking-[0.06em] uppercase"
          style={{ color: '#7a9b7c' }}
        >
          Journal
        </span>
        <span className="text-[10px]" style={{ color: '#4a6b4c' }}>
          {getTodayLabel()}
        </span>
      </div>
      <div
        className="rounded-md"
        style={{
          backgroundColor: '#0f1410',
          border: '1px solid #1e2b1f',
        }}
      >
        <textarea
          value={log}
          onChange={(e) => setLog(e.target.value)}
          placeholder="How are you showing up today?"
          rows={2}
          className="w-full bg-transparent px-3 py-2.5 text-[11px] font-sans focus:outline-none resize-none"
          style={{
            color: 'var(--text-primary)',
            fontStyle: log ? 'normal' : 'italic',
          }}
        />
      </div>
    </div>
  )
}
