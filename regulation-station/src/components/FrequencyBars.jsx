import { useRef, useEffect } from 'react'

const BAR_COUNT = 40
// Pre-seeded fallback heights for static (non-playing) decorative display
const FALLBACK_HEIGHTS = [
  0.12, 0.18, 0.25, 0.20, 0.32, 0.15, 0.22, 0.28,
  0.18, 0.12, 0.24, 0.30, 0.16, 0.20, 0.14, 0.26,
  0.19, 0.23, 0.17, 0.29, 0.13, 0.21, 0.27, 0.16,
  0.22, 0.31, 0.14, 0.20, 0.18, 0.25, 0.11, 0.24,
  0.28, 0.17, 0.22, 0.15, 0.26, 0.19, 0.23, 0.20,
]

export default function FrequencyBars({ playing, analyserRef, color }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  // Smoothed bar heights (0..canvasHeight), one per bar
  const smoothedRef = useRef(new Float32Array(BAR_COUNT))
  // Hold the pre-allocated FFT data buffer; allocated lazily on first live frame
  const dataArrayRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const draw = () => {
      const W = canvas.width
      const H = canvas.height
      const barWidth = Math.floor((W - (BAR_COUNT - 1) * 2) / BAR_COUNT) // ~4-6px
      const gap = 2
      const step = barWidth + gap

      ctx.clearRect(0, 0, W, H)

      const smoothed = smoothedRef.current
      const analyser = analyserRef.current

      if (playing && analyser) {
        // Lazy-allocate the FFT data array once
        if (!dataArrayRef.current) {
          dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)
        }
        analyser.getByteFrequencyData(dataArrayRef.current)
        const data = dataArrayRef.current
        const binCount = data.length // 1024
        // Sample lower 60% of bins — where binaural tones + pink noise live
        const usableBins = Math.floor(binCount * 0.6) // ~614

        // Map 614 bins → 40 bars by averaging bin ranges
        const binsPerBar = usableBins / BAR_COUNT

        for (let i = 0; i < BAR_COUNT; i++) {
          const startBin = Math.floor(i * binsPerBar)
          const endBin = Math.min(Math.floor((i + 1) * binsPerBar), usableBins)
          let sum = 0
          for (let b = startBin; b < endBin; b++) sum += data[b]
          const avg = endBin > startBin ? sum / (endBin - startBin) : 0
          const targetH = (avg / 255) * H

          // Asymmetric smoothing: fast attack, slow decay
          if (targetH > smoothed[i]) {
            smoothed[i] = smoothed[i] * 0.4 + targetH * 0.6
          } else {
            smoothed[i] = smoothed[i] * 0.88
          }
        }
      } else {
        // Static fallback — decorative bars slowly drift toward seed heights
        for (let i = 0; i < BAR_COUNT; i++) {
          const targetH = FALLBACK_HEIGHTS[i % FALLBACK_HEIGHTS.length] * H * 0.35
          smoothed[i] = smoothed[i] * 0.94 + targetH * 0.06
        }
      }

      // Draw bars with gradient
      for (let i = 0; i < BAR_COUNT; i++) {
        const barH = Math.max(2, smoothed[i])
        const x = i * step
        const y = H - barH

        const gradient = ctx.createLinearGradient(x, y, x, H)
        gradient.addColorStop(0, color + 'ff')   // full opacity at peak
        gradient.addColorStop(1, color + '44')   // dimmer at base

        ctx.fillStyle = gradient
        ctx.fillRect(x, y, barWidth, barH)
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    // Reset smoothed heights when effect re-runs (state/color switch)
    smoothedRef.current.fill(0)
    dataArrayRef.current = null

    draw()

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [playing, analyserRef, color])

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
