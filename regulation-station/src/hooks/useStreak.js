import { useMemo } from 'react'

export function useStreak(sessions) {
  return useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return { streak: 0, lastCheckin: null }
    }

    // Collect unique calendar days — filter out any null/undefined/invalid dates first
    const daySet = new Set(
      sessions
        .map((s) => s.date)
        .filter((d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d))
    )
    const days = Array.from(daySet).sort((a, b) => (a > b ? -1 : 1))

    if (days.length === 0) return { streak: 0, lastCheckin: null }

    const lastCheckin = days[0]

    // Build a valid Date from a YYYY-MM-DD string using local time to avoid
    // UTC-offset bugs where toISOString() would return the previous calendar day.
    const localDateFromStr = (str) => {
      const [y, m, d] = str.split('-').map(Number)
      return new Date(y, m - 1, d)
    }

    // Format a local Date back to YYYY-MM-DD without UTC conversion
    const toLocalDateStr = (date) => {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }

    // Count consecutive days going backward from the most recent day
    let streak = 0
    const cursor = localDateFromStr(days[0])

    for (let i = 0; i < days.length; i++) {
      const expected = new Date(cursor)
      expected.setDate(expected.getDate() - i)
      const expectedStr = toLocalDateStr(expected)

      if (days[i] === expectedStr) {
        streak++
      } else {
        break
      }
    }

    return { streak, lastCheckin }
  }, [sessions])
}
