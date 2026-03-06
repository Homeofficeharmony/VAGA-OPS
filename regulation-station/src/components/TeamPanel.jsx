import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTeam } from '../hooks/useTeam'

const STATE_ACCENT = { frozen: '#ff3d5a', anxious: '#ffb800', flow: '#00ff88' }

function MemberRow({ member }) {
  const accent = member.latestState ? STATE_ACCENT[member.latestState] : '#475569'
  const initial = member.isSelf
    ? (member.email?.[0] ?? '?').toUpperCase()
    : '?'
  const displayEmail = member.isSelf
    ? (member.email.length > 22 ? member.email.slice(0, 22) + '…' : member.email)
    : 'Team member'

  return (
    <div className="flex items-center gap-3 py-2">
      <div
        className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
        style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.25)' }}
      >
        <span className="font-mono text-[10px] text-[#00ff88] uppercase leading-none">{initial}</span>
      </div>
      <span className="font-sans text-xs text-slate-400 flex-1 min-w-0 truncate">{displayEmail}</span>
      {member.streak > 0 && (
        <span className="font-mono text-[10px] text-charcoal-400 tabular-nums flex-shrink-0">
          🔥 {member.streak}d
        </span>
      )}
      {member.latestState && (
        <span
          className="font-mono text-[9px] tracking-widest uppercase border rounded-full px-2 py-0.5 flex-shrink-0"
          style={{ color: accent, borderColor: accent + '44' }}
        >
          {member.latestState}
        </span>
      )}
    </div>
  )
}

export default function TeamPanel() {
  const { user } = useAuth()
  const { team, members, loading, error: teamError, createTeam, joinTeam, leaveTeam } = useTeam()

  const [joinCode, setJoinCode] = useState('')
  const [teamName, setTeamName] = useState('')
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!user) return null

  const handleJoin = async (e) => {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)
    const { error } = await joinTeam(joinCode)
    setSubmitting(false)
    if (error) setFormError(error)
    else setJoinCode('')
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)
    const { error } = await createTeam(teamName)
    setSubmitting(false)
    if (error) setFormError(error)
    else setTeamName('')
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(team.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('[TeamPanel] clipboard write failed:', err)
    }
  }

  if (loading) {
    return (
      <div className="bg-[#111318] border border-[#22262f] rounded-xl p-5">
        <div className="h-3 w-24 rounded bg-[#1a1d23] animate-pulse mb-3" />
        <div className="h-3 w-40 rounded bg-[#1a1d23] animate-pulse" />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="bg-[#111318] border border-[#22262f] rounded-xl p-5">
        <div className="font-mono text-[10px] tracking-widest uppercase text-charcoal-400 mb-4">
          Team
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Join */}
          <form onSubmit={handleJoin} className="flex flex-col gap-2">
            <label className="font-mono text-[10px] tracking-widest uppercase text-charcoal-500">
              Join with invite code
            </label>
            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="XXXXXX"
                maxLength={8}
                required
                className="flex-1 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none transition-colors"
                style={{ background: '#060d1a', border: '1px solid #22262f' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#00ff88' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#22262f' }}
              />
              <button
                type="submit"
                disabled={submitting}
                className="font-mono text-[10px] tracking-widest uppercase border rounded-lg px-3 py-2 transition-colors"
                style={{ color: '#00ff88', borderColor: '#00ff8840', opacity: submitting ? 0.5 : 1 }}
              >
                Join
              </button>
            </div>
          </form>

          {/* Create */}
          <form onSubmit={handleCreate} className="flex flex-col gap-2">
            <label className="font-mono text-[10px] tracking-widest uppercase text-charcoal-500">
              Create a team
            </label>
            <div className="flex gap-2">
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team name"
                maxLength={40}
                required
                className="flex-1 rounded-lg px-3 py-2 text-xs font-sans text-slate-200 focus:outline-none transition-colors"
                style={{ background: '#060d1a', border: '1px solid #22262f' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#00ff88' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#22262f' }}
              />
              <button
                type="submit"
                disabled={submitting}
                className="font-mono text-[10px] tracking-widest uppercase border rounded-lg px-3 py-2 transition-colors"
                style={{ color: '#00ff88', borderColor: '#00ff8840', opacity: submitting ? 0.5 : 1 }}
              >
                Create
              </button>
            </div>
          </form>
        </div>

        {(formError || teamError) && (
          <p className="mt-3 text-xs text-[#ff3d5a] font-sans">{formError || teamError}</p>
        )}
      </div>
    )
  }

  return (
    <div className="bg-[#111318] border border-[#22262f] rounded-xl p-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="font-mono text-[10px] tracking-widest uppercase text-charcoal-400 mb-0.5">
            Team
          </div>
          <div className="font-mono text-sm font-semibold tracking-widest uppercase text-[#00ff88]">
            {team.name}
          </div>
        </div>

        {/* Invite code badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="font-mono text-[11px] tracking-widest border rounded-lg px-3 py-1.5"
            style={{ color: '#00ff8899', borderColor: '#00ff8830', background: '#00ff8808' }}
          >
            {team.inviteCode}
          </span>
          <button
            onClick={handleCopy}
            className="font-mono text-[10px] tracking-widest uppercase border rounded px-2 py-1 transition-colors"
            style={{
              color: copied ? '#00ff88' : '#475569',
              borderColor: copied ? '#00ff8840' : '#22262f',
            }}
            title="Copy invite code"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Member list */}
      <div className="divide-y divide-[#22262f]">
        {members.map((m) => (
          <MemberRow key={m.userId} member={m} />
        ))}
      </div>

      {/* Leave */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={leaveTeam}
          className="font-mono text-[10px] tracking-widest uppercase text-[#ff3d5a]/50 hover:text-[#ff3d5a] transition-colors"
        >
          Leave team
        </button>
      </div>
    </div>
  )
}