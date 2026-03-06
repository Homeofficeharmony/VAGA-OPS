import { useState, useEffect } from 'react'
import { useBreathTimer } from '../hooks/useBreathTimer'

// State configurations mapped closely to physiological properties
const STATE_PROPS = {
    frozen: {
        bgBase: '#070a12', // Very dark/cool
        bgGlow: '#0f172a',
        pulseColor: '#38bdf8', // Cool blue tint
        warmUp: true, // Gradually warms over time
        motionSpeed: '40s',
    },
    anxious: {
        bgBase: '#120d0a', // Warmer dark
        bgGlow: '#2a1a15',
        pulseColor: '#fbbf24', // Warm amber
        warmUp: false,
        motionSpeed: '30s',
        blurBase: '8px',
    },
    flow: {
        bgBase: '#05110c', // Deep forest/green dark
        bgGlow: '#0a2417',
        pulseColor: '#34d399', // Emerald
        warmUp: false,
        motionSpeed: '60s', // Minimal motion
    }
}

export default function VideoBackground({ stateId, running, elapsedSec, totalSec, children }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        // Fade in gracefully
        setMounted(true)
    }, [])

    const config = STATE_PROPS[stateId] || STATE_PROPS.flow
    const { phase, cycleTimeMs } = useBreathTimer(running)

    // Calculate smooth continuous pulse (0 to 1) based on breath phase
    // 0-4s Inhale: 0 -> 1
    // 4-5s Hold: 1 -> 1
    // 5-13s Exhale: 1 -> 0
    let pulse = 0
    if (cycleTimeMs <= 4000) {
        pulse = cycleTimeMs / 4000
        // Sinusoidal easing
        pulse = Math.sin((pulse * Math.PI) / 2)
    } else if (cycleTimeMs <= 5000) {
        pulse = 1
    } else {
        pulse = 1 - ((cycleTimeMs - 5000) / 8000)
        pulse = Math.sin((pulse * Math.PI) / 2)
    }

    // Opacity of the breath anchor (max 15%)
    const anchorOpacity = running ? 0.05 + (pulse * 0.1) : 0
    // Size multiplier of the breath anchor
    const anchorScale = running ? 0.8 + (pulse * 0.4) : 1

    // Overall session progress (0 to 1)
    const progress = Math.min(elapsedSec / totalSec, 1) || 0

    // Frozen state warmup (gradually brightens and warms)
    const bgOpacity = stateId === 'frozen' ? 0.8 + (progress * 0.2) : 1
    const blurAmount = stateId === 'anxious' ? 12 - (progress * 8) : 0 // Blur reduces over time in anxious

    // Parallax subtle shift tied to breath
    const parallaxY = pulse * -4 // Moves up to 4px up

    return (
        <div
            className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-all duration-[800ms] ease-in-out"
            style={{
                backgroundColor: config.bgBase,
                opacity: mounted ? bgOpacity : 0,
            }}
        >
            <div className="absolute inset-0" style={{ filter: `blur(${blurAmount}px)` }}>
                {/* Slow motion drifting background */}
                <div
                    className="absolute inset-[-50%] w-[200%] h-[200%] opacity-40 mix-blend-screen"
                    style={{
                        background: `radial-gradient(circle at 50% 50%, ${config.bgGlow} 0%, transparent 60%)`,
                        transform: `translateY(${parallaxY * 0.5}px)`, // Very slow parallax
                        animation: `drift ${config.motionSpeed} infinite alternate ease-in-out`,
                    }}
                />

                {/* Breath-Synchronized Visual Anchor */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div
                        className="rounded-full transition-transform duration-[400ms] ease-out will-change-transform"
                        style={{
                            width: '60vmin',
                            height: '60vmin',
                            background: `radial-gradient(circle at center, ${config.pulseColor} 0%, transparent 70%)`,
                            opacity: anchorOpacity,
                            transform: `scale(${anchorScale}) translateY(${parallaxY}px)`,
                            filter: 'blur(30px)',
                        }}
                    />
                </div>

                {/* Non-Numeric Progress Indicator (Faint bottom glow) */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-32 transition-opacity duration-1000"
                    style={{
                        background: `linear-gradient(to top, ${config.pulseColor}${Math.floor(progress * 15).toString(16).padStart(2, '0')} 0%, transparent 100%)`,
                        opacity: running ? 1 : 0
                    }}
                />

            </div>

            {/* Content wrapper */}
            <div className="relative z-10 w-full h-full pointer-events-auto">
                {children}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes drift {
          0% { transform: translateY(0) scale(1.0); }
          50% { transform: translateY(-5%) scale(1.05); }
          100% { transform: translateY(0) scale(1.0); }
        }
      `}} />
        </div>
    )
}
