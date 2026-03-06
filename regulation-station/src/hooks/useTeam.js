import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function computeStreak(sessions) {
  if (!sessions || sessions.length === 0) return 0
  const daySet = new Set(sessions.map((s) => s.date))
  const days = Array.from(daySet).sort((a, b) => (a > b ? -1 : 1))
  let streak = 0
  let cursor = new Date(days[0])
  cursor.setHours(0, 0, 0, 0)
  for (let i = 0; i < days.length; i++) {
    const expected = new Date(cursor)
    expected.setDate(expected.getDate() - i)
    if (days[i] === expected.toISOString().slice(0, 10)) streak++
    else break
  }
  return streak
}

export function useTeam() {
  const { user } = useAuth()
  const [team, setTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchMembers = useCallback(async (teamId) => {
    if (!supabase) return

    const { data: rows, error: err } = await supabase
      .from('team_members')
      .select('user_id, joined_at')
      .eq('team_id', teamId)

    if (err || !rows) return

    // Fetch own sessions only — other members' sessions are not accessible
    // via RLS. Aggregate will be added server-side in Wave 3.
    const { data: sessions, error: sessionsErr } = await supabase
      .from('nervous_system_sessions')
      .select('date, primary_state, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(90)

    if (sessionsErr) console.error('[useTeam] fetchMembers sessions failed:', sessionsErr.message)

    const selfStreak = computeStreak(sessions ?? [])
    const latestSession = sessions?.[0] ?? null

    // Map members — only self has live data; others show placeholders
    const enriched = rows.map((row) => {
      const isSelf = row.user_id === user.id
      return {
        userId: row.user_id,
        email: isSelf ? user.email : `member-${row.user_id.slice(0, 6)}`,
        isSelf,
        streak: isSelf ? selfStreak : 0,
        latestState: isSelf ? latestSession?.primary_state ?? null : null,
        latestDate: isSelf ? latestSession?.date ?? null : null,
      }
    })

    setMembers(enriched)
  }, [user])

  const fetchTeam = useCallback(async () => {
    if (!user || !supabase) return
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('team_members')
      .select('team_id, teams(id, name, invite_code, owner_id)')
      .eq('user_id', user.id)
      .maybeSingle()

    if (err) { setError(err.message); setLoading(false); return }

    if (data?.teams) {
      const t = data.teams
      setTeam({ id: t.id, name: t.name, inviteCode: t.invite_code, ownerId: t.owner_id })
      try {
        await fetchMembers(t.id)
      } catch (err) {
        console.error('[useTeam] fetchMembers failed in fetchTeam:', err)
      }
    } else {
      setTeam(null)
      setMembers([])
    }

    setLoading(false)
  }, [user, fetchMembers])

  useEffect(() => {
    fetchTeam()
  }, [fetchTeam])

  const createTeam = useCallback(async (name) => {
    if (!supabase) return { error: 'Supabase not configured' }
    if (!user) return { error: 'Not signed in' }

    const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase()

    const { data: teamRow, error: insertErr } = await supabase
      .from('teams')
      .insert({ name: name.trim(), invite_code: inviteCode, owner_id: user.id })
      .select()
      .single()

    if (insertErr) return { error: insertErr.message }

    const { error: memberErr } = await supabase
      .from('team_members')
      .insert({ team_id: teamRow.id, user_id: user.id })

    if (memberErr) return { error: memberErr.message }

    setTeam({ id: teamRow.id, name: teamRow.name, inviteCode, ownerId: user.id })
    try {
      await fetchMembers(teamRow.id)
    } catch (err) {
      console.error('[useTeam] fetchMembers failed in createTeam:', err)
    }
    return {}
  }, [user, fetchMembers])

  const joinTeam = useCallback(async (inviteCode) => {
    if (!supabase) return { error: 'Supabase not configured' }
    if (!user) return { error: 'Not signed in' }

    const { data: teamRow, error: findErr } = await supabase
      .from('teams')
      .select('id, name, invite_code, owner_id')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .maybeSingle()

    if (findErr) return { error: findErr.message }
    if (!teamRow) return { error: 'Team not found — check the invite code.' }

    const { error: memberErr } = await supabase
      .from('team_members')
      .insert({ team_id: teamRow.id, user_id: user.id })

    if (memberErr) return { error: memberErr.message }

    setTeam({ id: teamRow.id, name: teamRow.name, inviteCode: teamRow.invite_code, ownerId: teamRow.owner_id })
    try {
      await fetchMembers(teamRow.id)
    } catch (err) {
      console.error('[useTeam] fetchMembers failed in joinTeam:', err)
    }
    return {}
  }, [user, fetchMembers])

  const leaveTeam = useCallback(async () => {
    if (!supabase || !user || !team) return

    const { error: deleteErr } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', team.id)
      .eq('user_id', user.id)

    if (deleteErr) { setError(deleteErr.message); return }

    setTeam(null)
    setMembers([])
  }, [user, team])

  return { team, members, loading, error, createTeam, joinTeam, leaveTeam }
}