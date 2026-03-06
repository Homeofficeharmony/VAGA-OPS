import { useState, useEffect, useRef } from 'react'

/**
 * useBreathTimer manages the cyclic breathing state for regulation videos.
 * Timing: 4s inhale, 1s hold, 8s exhale (Total: 13s cycle).
 * Returns: { phase: 'inhale' | 'hold' | 'exhale', cycleProgress }
 */
export function useBreathTimer(running) {
    const [elapsedMs, setElapsedMs] = useState(0)
    const reqRef = useRef(null)
    const startTimeRef = useRef(null)

    useEffect(() => {
        if (!running) {
            if (reqRef.current) cancelAnimationFrame(reqRef.current)
            setElapsedMs(0)
            startTimeRef.current = null
            return
        }

        const animate = (time) => {
            if (startTimeRef.current === null) {
                startTimeRef.current = time
            }
            setElapsedMs(time - startTimeRef.current)
            reqRef.current = requestAnimationFrame(animate)
        }

        reqRef.current = requestAnimationFrame(animate)

        return () => {
            if (reqRef.current) cancelAnimationFrame(reqRef.current)
        }
    }, [running])

    const cycleLengthMs = 13000
    const cycleTimeMs = elapsedMs % cycleLengthMs
    const cycleProgress = cycleTimeMs / cycleLengthMs

    let phase = 'inhale'
    if (cycleTimeMs > 4000 && cycleTimeMs <= 5000) {
        phase = 'hold'
    } else if (cycleTimeMs > 5000) {
        phase = 'exhale'
    }

    return { phase, cycleProgress, cycleTimeMs }
}
