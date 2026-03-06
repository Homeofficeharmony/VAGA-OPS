import { motion } from 'framer-motion'
import { useBreathTimer } from '../hooks/useBreathTimer'

export default function BreathingOrb({ stateData, isImmersive }) {
    // Connect to the actual unified breath engine unconditionally
    const running = !!(stateData && isImmersive)
    const { phase, cycleTimeMs } = useBreathTimer(running)

    if (!stateData || !isImmersive) return null

    // Determine scale based on phase
    let scale = 1
    if (phase === 'inhale') {
        const progress = cycleTimeMs / 4000
        scale = 1 + (progress * 0.4) // Expands to 1.4x
    } else if (phase === 'hold') {
        scale = 1.4
    } else if (phase === 'exhale') {
        const progress = (cycleTimeMs - 5000) / 8000
        scale = 1.4 - (progress * 0.4) // Contracts to 1x
    }

    // Parse ratio for the label
    // e.g., "4-1-8-0" -> [4, 1, 8, 0]
    const ratioString = stateData?.reset?.ratio || "4-1-8-0"
    const times = ratioString.split(/[-–]/).map(Number)
    const [inhale, holdIn, exhale, holdOut] = times

    let label = `Inhale ${inhale}`
    if (holdIn > 0) label += ` • Hold ${holdIn}`
    label += ` • Exhale ${exhale}`
    if (holdOut > 0) label += ` • Hold ${holdOut}`

    // Tiny cycle countdown (13s total default)
    let cycleSec = Math.ceil((13000 - cycleTimeMs) / 1000)
    if (cycleSec > 13) cycleSec = 13

    return (
        <div className="flex flex-col items-center justify-center py-8 relative z-10">

            {/* Text Label */}
            <h3 className="font-mono text-xs tracking-[0.2em] text-charcoal-400 uppercase mb-8 z-20">
                Sync your breath • {label}
            </h3>

            {/* The Orb */}
            <div className="relative w-40 h-40 flex items-center justify-center">
                {/* Core Glowing Orb */}
                <motion.div
                    animate={{
                        scale: scale,
                        opacity: phase === 'inhale' || phase === 'hold-in' ? 0.8 : 0.4
                    }}
                    transition={{
                        duration: 0.1, // Follow the progress exactly
                        ease: "linear"
                    }}
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

                {/* Tiny live countdown ring in center */}
                <div className="relative z-30 font-mono text-xl text-white font-light tabular-nums" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                    {cycleSec > 0 ? cycleSec : ''}
                </div>
            </div>
        </div>
    )
}
