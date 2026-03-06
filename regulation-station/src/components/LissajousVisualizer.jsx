import { useRef, useEffect } from 'react'

const TRAIL_LENGTH = 200
const DT = 1 / 60

export default function LissajousVisualizer({ playing, carrierHz, beatHz, color }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const tRef = useRef(0)
  const pointsRef = useRef([])

  // Parse color hex to r,g,b for rgba compositing
  const parseHex = (hex) => {
    const h = hex.replace('#', '')
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ]
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // Compute a single Lissajous point at time t
    const getPoint = (t, W, H) => {
      const x = W / 2 + (W / 2 - 16) * Math.sin(2 * Math.PI * carrierHz * t + tRef.current * 0)
      const y = H / 2 + (H / 2 - 16) * Math.sin(2 * Math.PI * (carrierHz + beatHz) * t)
      return { x, y }
    }

    const drawPoints = (pts, W, H, globalAlpha) => {
      const [r, g, b] = parseHex(color)
      ctx.clearRect(0, 0, W, H)

      const n = pts.length
      pts.forEach((pt, i) => {
        // Newest = index n-1, oldest = index 0
        const ageFraction = n > 1 ? i / (n - 1) : 1
        // opacity: newest 1.0, oldest 0.1
        const opacity = (0.1 + 0.9 * ageFraction) * globalAlpha
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`
        ctx.fill()
      })
    }

    if (!playing) {
      // Static figure at t = 0 with trail for visual richness
      const W = canvas.width
      const H = canvas.height
      const staticPts = []
      for (let i = 0; i < TRAIL_LENGTH; i++) {
        const t = (i / TRAIL_LENGTH) * (1 / (carrierHz || 1))
        const x = W / 2 + (W / 2 - 16) * Math.sin(2 * Math.PI * (carrierHz || 200) * t)
        const y = H / 2 + (H / 2 - 16) * Math.sin(2 * Math.PI * ((carrierHz || 200) + (beatHz || 10)) * t)
        staticPts.push({ x, y })
      }
      drawPoints(staticPts, W, H, 0.3)
      return
    }

    // Animated loop
    const animate = () => {
      const W = canvas.width
      const H = canvas.height

      tRef.current += DT

      const x = W / 2 + (W / 2 - 16) * Math.sin(2 * Math.PI * (carrierHz || 200) * tRef.current)
      const y = H / 2 + (H / 2 - 16) * Math.sin(2 * Math.PI * ((carrierHz || 200) + (beatHz || 10)) * tRef.current)

      pointsRef.current.push({ x, y })
      if (pointsRef.current.length > TRAIL_LENGTH) {
        pointsRef.current.shift()
      }

      drawPoints(pointsRef.current, W, H, 1.0)

      rafRef.current = requestAnimationFrame(animate)
    }

    // Start fresh trail on play
    pointsRef.current = []
    animate()

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [playing, carrierHz, beatHz, color])

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={192}
      className="w-full h-48"
      style={{ display: 'block' }}
    />
  )
}
