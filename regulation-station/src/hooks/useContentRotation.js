/**
 * useContentRotation — date-stable content selection hook.
 *
 * Returns the same item from a pool for the entire calendar day (local time).
 * Different pools produce independent rotations (no unified seed).
 * Callers should pass stable array references (e.g., from stateData.js constants)
 * rather than inline array literals to avoid unnecessary recalculation.
 *
 * @param {Array} pool — array of content items
 * @returns {{ item: any, index: number }}
 */
import { useMemo } from 'react'

function dailyIndex(dateStr, poolSize) {
  let hash = 5381
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) + hash) ^ dateStr.charCodeAt(i)
  }
  hash = hash >>> 0
  return hash % poolSize
}

export function useContentRotation(pool) {
  const dateStr = new Date().toLocaleDateString('en-CA')

  return useMemo(() => {
    if (!pool || pool.length === 0) return { item: null, index: 0 }
    const index = dailyIndex(dateStr, pool.length)
    return { item: pool[index], index }
  }, [dateStr, pool])
}
