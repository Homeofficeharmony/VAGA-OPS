import { motion } from 'framer-motion'

const DEPTH_LABELS = [
    { at: 0, text: 'Begin' },
    { at: 0.2, text: 'Settling\u2026' },
    { at: 0.4, text: 'Deepening\u2026' },
    { at: 0.6, text: 'Nervous system shifting\u2026' },
    { at: 0.8, text: 'Regulated' },
    { at: 1.0, text: 'Session complete' },
]

function getDepthLabel(progress) {
    let label = DEPTH_LABELS[0].text
    for (const item of DEPTH_LABELS) {
        if (progress >= item.at) label = item.text
    }
    return label
}

/**
 * RegulationDepthMeter
 *
 * Shows a thin vertical progress bar that fills as the user completes
 * breath cycles. Each 13-second cycle adds ~8% (12 cycles = 100%).
 * Provides micro-feedback labels at key thresholds.
 */
export default function RegulationDepthMeter({ cycles, accentHex, maxCycles = 12 }) {
    const progress = Math.min(cycles / maxCycles, 1)
    const label = getDepthLabel(progress)
    const pct = Math.round(progress * 100)
    const isComplete = progress >= 1

    return (
        <div className="flex flex-col items-center gap-2 z-20">
            {/* Label */}
            <motion.div
                key={label}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="font-mono text-[10px] tracking-widest uppercase"
                style={{ color: isComplete ? accentHex : `${accentHex}80` }}
            >
                {label}
            </motion.div>

            {/* Thin horizontal progress bar */}
            <div
                className="w-40 h-1 rounded-full overflow-hidden"
                style={{ backgroundColor: `${accentHex}15` }}
            >
                <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: accentHex }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                />
            </div>

            {/* Cycle count */}
            <span
                className="font-mono text-[9px] tracking-widest tabular-nums"
                style={{ color: `${accentHex}50` }}
            >
                {cycles}/{maxCycles} breaths
            </span>
        </div>
    )
}
