import { useRef, useEffect } from 'react'

const PARTICLE_CONFIG = {
  frozen: {
    count: 28,
    color: '#8ab4cc',
    speedBase: 0.18,
    speedVariance: 0.08,
    sizeMin: 1.5,
    sizeMax: 3.5,
    opacityMin: 0.06,
    opacityMax: 0.22,
    directionSpread: 0.4,
    breathSpeedMult: { inhale: 1.15, hold: 1.0, exhale: 0.55 },
    mode: 'drift',
  },
  anxious: {
    count: 42,
    color: '#c8a040',
    speedBase: 0.55,
    speedVariance: 0.35,
    sizeMin: 1.0,
    sizeMax: 2.8,
    opacityMin: 0.08,
    opacityMax: 0.30,
    directionSpread: 1.8,
    breathSpeedMult: { inhale: 1.45, hold: 1.2, exhale: 0.70 },
    mode: 'scatter',
  },
  flow: {
    count: 32,
    color: '#52b87e',
    speedBase: 0.28,
    speedVariance: 0.12,
    sizeMin: 1.8,
    sizeMax: 4.0,
    opacityMin: 0.05,
    opacityMax: 0.18,
    directionSpread: 0.0,
    breathSpeedMult: { inhale: 1.20, hold: 1.0, exhale: 0.80 },
    mode: 'orbital',
  },
}

function rand(min, max) {
  return min + Math.random() * (max - min)
}

function initParticles(config, w, h) {
  const particles = []

  if (config.mode === 'orbital') {
    for (let i = 0; i < config.count; i++) {
      const cx = rand(w * 0.1, w * 0.9)
      const cy = rand(h * 0.1, h * 0.9)
      const radius = rand(20, 80)
      const angle = rand(0, Math.PI * 2)
      const direction = Math.random() < 0.5 ? 1 : -1
      const angularVelocity = direction * rand(0.002, 0.006)
      const size = rand(config.sizeMin, config.sizeMax)
      const opacity = rand(config.opacityMin, config.opacityMax)
      particles.push({ cx, cy, radius, angle, angularVelocity, size, opacity, x: cx, y: cy })
    }
  } else {
    for (let i = 0; i < config.count; i++) {
      const speed = config.speedBase + rand(-config.speedVariance, config.speedVariance)
      const spread = config.directionSpread
      // mostly vertical drift for frozen (low spread), random scatter for anxious (high spread)
      const angle = -Math.PI / 2 + rand(-spread, spread) * Math.PI
      const vx = Math.cos(angle) * speed
      const vy = Math.sin(angle) * speed
      particles.push({
        x: rand(0, w),
        y: rand(0, h),
        vx,
        vy,
        size: rand(config.sizeMin, config.sizeMax),
        opacity: rand(config.opacityMin, config.opacityMax),
      })
    }
  }

  return particles
}

export default function ParticleField({ selectedState, breathPhase = 'inhale' }) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const rafRef = useRef(null)
  const breathPhaseRef = useRef(breathPhase)
  const speedMultRef = useRef(1.0)

  // Keep breathPhaseRef in sync without triggering particle reinit
  useEffect(() => {
    breathPhaseRef.current = breathPhase
  }, [breathPhase])

  // Particle init + rAF loop — reinit when state changes
  useEffect(() => {
    speedMultRef.current = 1.0

    const canvas = canvasRef.current
    if (!canvas || !selectedState) return

    const config = PARTICLE_CONFIG[selectedState]
    if (!config) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    const rect = canvas.getBoundingClientRect()
    const cssW = rect.width
    const cssH = rect.height

    canvas.width = cssW * dpr
    canvas.height = cssH * dpr
    ctx.scale(dpr, dpr)

    // Apply mobile cap
    const isMobile = window.innerWidth < 600
    const effectiveConfig = isMobile
      ? { ...config, count: Math.min(config.count, 30) }
      : config

    particlesRef.current = initParticles(effectiveConfig, cssW, cssH)

    function draw() {
      rafRef.current = requestAnimationFrame(draw)

      ctx.clearRect(0, 0, cssW, cssH)

      const targetMult = effectiveConfig.breathSpeedMult[breathPhaseRef.current] ?? 1.0
      speedMultRef.current += (targetMult - speedMultRef.current) * 0.025
      const speedMult = speedMultRef.current
      const particles = particlesRef.current

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        if (effectiveConfig.mode === 'orbital') {
          p.angle += p.angularVelocity * speedMult
          p.x = p.cx + Math.cos(p.angle) * p.radius
          p.y = p.cy + Math.sin(p.angle) * p.radius
        } else {
          p.x += p.vx * speedMult
          p.y += p.vy * speedMult

          // Jitter for anxious state
          if (effectiveConfig.mode === 'scatter' && Math.random() < 0.04) {
            p.vx += (Math.random() - 0.5) * 0.8
            p.vy += (Math.random() - 0.5) * 0.8
            // Clamp speed
            const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
            if (currentSpeed > 1.2) {
              p.vx = (p.vx / currentSpeed) * 1.2
              p.vy = (p.vy / currentSpeed) * 1.2
            }
          }

          // Wrap edges
          if (p.x < 0) p.x = cssW
          if (p.x > cssW) p.x = 0
          if (p.y < 0) p.y = cssH
          if (p.y > cssH) p.y = 0
        }

        ctx.globalAlpha = p.opacity
        ctx.fillStyle = effectiveConfig.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Reset globalAlpha
      ctx.globalAlpha = 1
    }

    draw()

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [selectedState])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.85, pointerEvents: 'none' }}
    />
  )
}
