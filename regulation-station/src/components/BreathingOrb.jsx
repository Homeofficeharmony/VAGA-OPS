import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBreathTimer } from '../hooks/useBreathTimer'

// State-specific grounding micro-cues that cycle each breath
const GROUNDING_CUES = {
    frozen: {
        inhale: ['Feel your feet on the ground', 'Draw warmth inward', 'You are here, now', 'Notice your hands'],
        hold: ['Let it fill you', 'Notice the stillness', 'You are safe', 'Feel yourself arriving'],
        exhale: ['Let the heaviness go', 'Soften your shoulders', 'Release what you\u2019re holding', 'Thaw gently'],
    },
    anxious: {
        inhale: ['Slow and steady', 'Feel your ribs expand', 'You are in control', 'Let the air find you'],
        hold: ['Notice the pause', 'Nothing to fix right now', 'This moment is enough', 'Just be here'],
        exhale: ['Soften your jaw', 'Let the tension drain', 'Longer out than in', 'Your body knows how'],
    },
    flow: {
        inhale: ['Expand into clarity', 'Fill with focus', 'Breathe in presence', 'Anchor here'],
        hold: ['Hold the signal', 'Peak awareness', 'Stay with it', 'Notice everything'],
        exhale: ['Settle deeper', 'Protect the window', 'Let everything else go', 'Stay locked in'],
    },
}

const PHASE_LABELS = {
    inhale: 'Breathe in\u2026',
    hold: 'Hold gently\u2026',
    exhale: 'Let it go\u2026',
}

export default function BreathingOrb({ stateData, isImmersive, onCycleComplete }) {
    const running = !!(stateData && isImmersive)
    const { phase, cycleTimeMs } = useBreathTimer(running)

    // Track completed cycles for the depth meter
    const [prevPhase, setPrevPhase] = useState('inhale')
    const [cueIndex, setCueIndex] = useState(0)

    // Detect cycle completion (exhale → inhale transition)
    useEffect(() => {
        if (prevPhase === 'exhale' && phase === 'inhale') {
            onCycleComplete?.()
            setCueIndex(i => i + 1)
        }
        setPrevPhase(phase)
    }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

    if (!stateData || !isImmersive) return null

    // Determine scale based on phase
    let scale = 1
    if (phase === 'inhale') {
        const progress = cycleTimeMs / 4000
        scale = 1 + (progress * 0.4)
    } else if (phase === 'hold') {
        scale = 1.4
    } else if (phase === 'exhale') {
        const progress = (cycleTimeMs - 5000) / 8000
        scale = 1.4 - (progress * 0.4)
    }

    // State-specific grounding cues
    const stateId = stateData.id || 'flow'
    const cues = GROUNDING_CUES[stateId] || GROUNDING_CUES.flow
    const currentCue = cues[phase]?.[cueIndex % cues[phase].length] || ''

    // Phase progress for micro-cue fade (show after 40% of phase)
    let phaseProgress = 0
    if (phase === 'inhale') phaseProgress = cycleTimeMs / 4000
    else if (phase === 'hold') phaseProgress = (cycleTimeMs - 4000) / 1000
    else phaseProgress = (cycleTimeMs - 5000) / 8000
    const showMicroCue = phaseProgress > 0.35

    return (
        <div className="flex flex-col items-center justify-center py-8 relative z-10">

            {/* Main Phase Label — "Breathe in…" / "Hold gently…" / "Let it go…" */}
            <AnimatePresence mode="wait">
                <motion.h3
                    key={phase}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.4 }}
                    className="font-mono text-sm tracking-[0.2em] uppercase mb-2 z-20"
                    style={{ color: stateData.accentHex }}
                >
                    {PHASE_LABELS[phase]}
                </motion.h3>
            </AnimatePresence>

            {/* Grounding Micro-Cue — fades in mid-phase */}
            <div
                className="font-sans text-xs tracking-wide mb-6 z-20 h-5 transition-all duration-700"
                style={{
                    color: `${stateData.accentHex}90`,
                    opacity: showMicroCue ? 1 : 0,
                    transform: showMicroCue ? 'translateY(0)' : 'translateY(4px)',
                }}
            >
                {currentCue}
            </div>

            {/* The Orb */}
            <div className="relative w-40 h-40 flex items-center justify-center">
                {/* Outer ambient ring */}
                <motion.div
                    animate={{
                        scale: scale * 1.15,
                        opacity: phase === 'inhale' ? 0.15 : 0.05
                    }}
                    transition={{ duration: 0.15, ease: "linear" }}
                    className="absolute w-36 h-36 rounded-full z-[5]"
                    style={{
                        border: `1px solid ${stateData.accentHex}20`,
                    }}
                />

                {/* Core Glowing Orb */}
                <motion.div
                    animate={{
                        scale: scale,
                        opacity: phase === 'inhale' || phase === 'hold' ? 0.8 : 0.4
                    }}
                    transition={{ duration: 0.1, ease: "linear" }}
                    className="absolute w-32 h-32 rounded-full blur-2xl z-10"
                    style={{ backgroundColor: stateData.accentHex }}
                />

                {/* Solid Center */}
                <motion.div
                    animate={{ scale: scale * 0.9 }}
                    transition={{ duration: 0.1, ease: "linear" }}
                    className="absolute w-28 h-28 rounded-full z-20"
                    style={{
                        backgroundColor: `${stateData.accentHex}40`,
                        border: `1px solid ${stateData.accentHex}80`
                    }}
                />

                {/* Phase icon in center */}
                <div className="relative z-30 flex flex-col items-center gap-0.5">
                    <span
                        className="font-mono text-xl font-light tabular-nums"
                        style={{
                            color: 'white',
                            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                            opacity: 0.9,
                        }}
                    >
                        {phase === 'inhale' ? '↑' : phase === 'hold' ? '·' : '↓'}
                    </span>
                </div>
            </div>
        </div>
    )
}
