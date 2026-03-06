import { useBreathTimer } from '../hooks/useBreathTimer'

/**
 * ImmersionBackground
 *
 * State-adaptive, breath-synced radial pulse overlay.
 * Sits between NeuralBackground (z-0) and main content (z-10).
 * Uses only inline styles + RAF — no framer-motion.
 *
 * Adaptive behaviour:
 *  anxious → darker base, glow peaks on exhale (visual calming cue)
 *  frozen  → lighter base, glow peaks on inhale (arousal lift)
 *  flow    → near-invisible, minimal interference
 */

const STATE_CONFIG = {
  anxious: {
    // Darker warm tones — reduce stimulation
    baseColor: 'rgba(10, 5, 0, 0.80)',
    pulseHex: '#c8a040',
    // Exhale emphasis: glow is strongest at end of exhale (breathProgress near 0)
    glowOnExhale: true,
    peakOpacity: 0.20,
    peakScale: 1.18,
  },
  frozen: {
    // Slightly lighter base — subtle brightness lift to pull out of shutdown
    baseColor: 'rgba(6, 8, 12, 0.65)',
    pulseHex: '#c4604a',
    // Inhale emphasis: glow peaks as breath expands
    glowOnExhale: false,
    peakOpacity: 0.15,
    peakScale: 1.10,
  },
  flow: {
    // Near-invisible — minimal interference in flow state
    baseColor: 'rgba(6, 9, 7, 0.82)',
    pulseHex: '#52b87e',
    glowOnExhale: false,
    peakOpacity: 0.06,
    peakScale: 1.05,
  },
}

const DEFAULT_CONFIG = STATE_CONFIG.flow

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

export default function ImmersionBackground({ isImmersive, selectedState }) {
  const { cycleTimeMs } = useBreathTimer(isImmersive)

  if (!isImmersive) return null

  const config = STATE_CONFIG[selectedState] ?? DEFAULT_CONFIG
  const rgb = hexToRgb(config.pulseHex)

  // breathProgress: 0 = contracted, 1 = fully expanded
  // Breath cycle: 4s inhale → 1s hold → 8s exhale
  let breathProgress = 0
  if (cycleTimeMs <= 4000) {
    breathProgress = cycleTimeMs / 4000
  } else if (cycleTimeMs <= 5000) {
    breathProgress = 1
  } else {
    breathProgress = 1 - (cycleTimeMs - 5000) / 8000
  }
  breathProgress = Math.max(0, Math.min(1, breathProgress))

  // Anxious: glow on exhale — inverted so it peaks when breath is contracting
  const intensity = config.glowOnExhale
    ? (1 - breathProgress) * config.peakOpacity
    : breathProgress * config.peakOpacity

  const scale = 1 + breathProgress * (config.peakScale - 1)

  return (
    <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
      {/* State-adaptive dark base */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: config.baseColor }}
      />

      {/* Breath-synced radial pulse — centered */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          style={{
            width: '55vmin',
            height: '55vmin',
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${rgb},${intensity.toFixed(3)}) 0%, transparent 70%)`,
            transform: `scale(${scale.toFixed(4)})`,
            // No CSS transition — tracks RAF updates from useBreathTimer directly
          }}
        />
      </div>
    </div>
  )
}
