# Phase 3: Audio Visualization - Research

**Researched:** 2026-03-10
**Domain:** Web Audio API AnalyserNode + Canvas 2D API / CSS animation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Frequency bars fully replace the current Lissajous visualizer — one visualization, driven by real audio data
- Same canvas slot: full-width x h-48 (192px), no layout changes to AudioPlayer panel
- When audio is off, show static low-opacity bars as a decorative fallback (not empty space)
- Keep L/R channel Hz labels and "Live" dot indicator overlaid on the visualization area
- Vertical bars rising from bottom — classic frequency spectrum style
- 32-48 bars, each ~4-6px wide with 2px gaps
- Solid state accent color (sage/gold/terracotta) — bars may have slight opacity gradient (brighter at peak, dimmer at base)
- Smooth movement with exponential decay — bars rise quickly to peaks, fall gradually. Organic, calm feel matching the regulation app vibe

### Claude's Discretion
- Beat-reactive glow implementation on the play button (pulsing opacity, expanding ring, color intensity — whatever looks best at the binaural beat frequency)
- Exact smoothing/decay constants for bar animation
- How many frequency bins to sample vs. average from the 1024 available bins
- Static fallback bar heights and opacity levels
- Whether LissajousVisualizer.jsx gets deleted or kept as dead code for potential future use

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AVIZ-01 | User sees the audio play controls glow/pulse at the actual binaural beat frequency | CSS @keyframes with JS-computed `animation-duration` derived from `1 / beatHz` seconds |
| AVIZ-02 | User sees a real-time frequency visualization driven by the actual audio output via AnalyserNode | `analyserRef` already connected after master gain with `fftSize 2048`; `getByteFrequencyData()` into a `Uint8Array(1024)` in a rAF loop |
</phase_requirements>

---

## Summary

Phase 3 is a pure UI enhancement pass with no new dependencies and no changes to the audio engine. The `useAudioEngine` hook already exposes `analyserRef` (an AnalyserNode connected after master gain, fftSize 2048, 1024 bins) — this is the only data source needed for AVIZ-02. The `LissajousVisualizer` component established the canvas lifecycle pattern (ref, rAF loop, useEffect cleanup) that the new `FrequencyBars` component will follow directly.

For AVIZ-01, CSS animation duration is the mechanism: `animation-duration: ${1 / beatHz}s` applied to the play button glow element gives exact beat-frequency synchronization without any JS timing loop. The three states have beat frequencies of 5 Hz (frozen, 200ms cycle), 10 Hz (anxious, 100ms cycle), and 40 Hz (flow, 25ms cycle) — confirmed from `stateData.js` track defaults.

The main implementation risk is the teardown gap: when paused, `teardown()` sets `analyserRef.current = null`, so `getByteFrequencyData()` must be guarded and the component must render the static decorative fallback whenever `analyserRef.current` is null or `playing` is false. This is architecturally identical to how LissajousVisualizer already handles its non-playing branch.

**Primary recommendation:** Build `FrequencyBars.jsx` as a drop-in canvas component that reads from `analyserRef.current` in its rAF loop, guards against null, and renders pre-seeded static bars when inactive. Wire beat-frequency glow directly to play button via CSS `animation-duration` computed from `track.beatHz`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Web Audio API `AnalyserNode` | Browser built-in | FFT frequency data from live audio | Already wired in `useAudioEngine`; no install needed |
| Canvas 2D API | Browser built-in | Frame-by-frame bar rendering | Project convention — no external viz libraries |
| `requestAnimationFrame` | Browser built-in | 60 fps animation loop with cleanup | Established pattern in `LissajousVisualizer` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React `useRef` + `useEffect` | React 19 (already installed) | Canvas ref lifecycle, rAF cleanup | All canvas components in this project use this pattern |
| CSS `@keyframes` + inline `animation-duration` | Browser built-in | Beat-frequency glow on play button | Exact Hz timing without JS timers |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native Canvas 2D | `<svg>` bars | SVG DOM manipulation per frame is slower; canvas is correct for 60fps frequency data |
| CSS animation-duration | JS `setInterval` pulse | setInterval drifts; CSS animation-duration is exact and GPU-composited |
| Single `useEffect` for rAF | Separate animation class | Hooks pattern is established in this codebase; stay consistent |

**Installation:** None — zero new dependencies.

---

## Architecture Patterns

### Recommended Project Structure
No new directories. Two files change, one file is created:

```
src/
├── components/
│   ├── FrequencyBars.jsx      # NEW — replaces LissajousVisualizer
│   ├── AudioPlayer.jsx        # MODIFY — swap component, wire analyserRef + beatHz to button
│   └── LissajousVisualizer.jsx  # DELETE or keep as dead code (Claude's discretion)
```

### Pattern 1: Canvas Component with rAF Loop
**What:** A React component that holds a canvas ref, starts an rAF loop in useEffect on mount/play change, reads analyser data each frame, and cancels the loop on cleanup.
**When to use:** Any real-time canvas visualization in this project.

```javascript
// Follows LissajousVisualizer.jsx pattern — Source: existing codebase
import { useRef, useEffect } from 'react'

export default function FrequencyBars({ playing, analyserRef, color }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const barsRef = useRef(new Float32Array(40).fill(0)) // smoothed bar heights

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const draw = () => {
      const W = canvas.width
      const H = canvas.height
      const BAR_COUNT = 40
      const GAP = 2
      const barW = Math.floor((W - GAP * (BAR_COUNT - 1)) / BAR_COUNT)

      ctx.clearRect(0, 0, W, H)

      if (playing && analyserRef.current) {
        // Live data path
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(dataArray)
        // Map 1024 bins → 40 bars (sample from lower 60% of spectrum)
        const usableBins = Math.floor(dataArray.length * 0.6)
        for (let i = 0; i < BAR_COUNT; i++) {
          const binStart = Math.floor((i / BAR_COUNT) * usableBins)
          const binEnd = Math.floor(((i + 1) / BAR_COUNT) * usableBins)
          let sum = 0
          for (let b = binStart; b < binEnd; b++) sum += dataArray[b]
          const avg = sum / (binEnd - binStart)
          const target = (avg / 255) * H
          // Exponential decay: fast rise, slow fall
          barsRef.current[i] = barsRef.current[i] > target
            ? barsRef.current[i] * 0.88  // decay coefficient
            : barsRef.current[i] * 0.4 + target * 0.6  // fast attack
        }
      } else {
        // Static fallback — decorative, not empty
        // Decay toward pre-seeded heights
        const fallback = [0.15, 0.22, 0.18, 0.30, 0.20, 0.12, 0.25, /* ... */]
        for (let i = 0; i < BAR_COUNT; i++) {
          const target = (fallback[i % fallback.length]) * H * 0.4
          barsRef.current[i] = barsRef.current[i] * 0.92 + target * 0.08
        }
      }

      // Render bars
      for (let i = 0; i < BAR_COUNT; i++) {
        const x = i * (barW + GAP)
        const barH = Math.max(2, barsRef.current[i])
        const y = H - barH
        // Opacity gradient: brighter at peak, dimmer at base
        const grad = ctx.createLinearGradient(0, y, 0, H)
        grad.addColorStop(0, color + 'ff')
        grad.addColorStop(1, color + '44')
        ctx.fillStyle = grad
        ctx.fillRect(x, y, barW, barH)
      }

      rafRef.current = requestAnimationFrame(draw)
    }

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
```

### Pattern 2: Beat-Frequency Glow via CSS animation-duration
**What:** The play button's outer ring element gets `animation-duration` set as an inline style from `1 / beatHz` seconds. No JS timing needed.
**When to use:** Whenever visual timing must match an audio frequency exactly.

```javascript
// In AudioPlayer.jsx — play button glow ring (lines 266-275)
// beatHz is available as track.beatHz
{playing && (
  <div
    className="absolute w-16 h-16 rounded-full pointer-events-none"
    style={{
      border: `1px solid ${color}50`,
      boxShadow: `0 0 0 4px ${color}10`,
      // Beat-frequency pulse: animation-duration = 1/beatHz seconds
      animation: `beatPulse ${(1 / track.beatHz).toFixed(3)}s ease-in-out infinite`,
    }}
  />
)}
```

```css
/* In index.css — new keyframe */
@keyframes beatPulse {
  0%, 100% { opacity: 0.3; box-shadow: 0 0 0 2px var(--pulse-color, currentColor); }
  50%       { opacity: 1;   box-shadow: 0 0 0 6px var(--pulse-color, currentColor); }
}
```

### Pattern 3: analyserRef Null Guard
**What:** The hook's `teardown()` sets `analyserRef.current = null`. All consumers must guard before reading FFT data.
**When to use:** Every rAF frame that accesses `analyserRef.current`.

```javascript
// CORRECT — guard before use
if (playing && analyserRef.current) {
  analyserRef.current.getByteFrequencyData(dataArray)
}

// WRONG — will throw on pause
analyserRef.current.getByteFrequencyData(dataArray)
```

### Anti-Patterns to Avoid
- **Creating `new Uint8Array()` inside the rAF loop:** Allocates on every frame, causes GC pressure. Pre-allocate once outside the loop or in a ref.
- **Using `analyserRef.current` without null guard:** `teardown()` sets it to null when paused; unguarded access throws and kills the rAF loop.
- **Setting `animation-duration` to `1/40 = 0.025s` (25ms) without testing:** 40 Hz is very fast — verify the pulse is visible and not distracting. Consider visual dampening (lower opacity swing) for flow state.
- **Using `audioCtx.getByteTimeDomainData()` instead of `getByteFrequencyData()`:** Time domain gives waveform, not spectrum. Frequency data is needed for bar visualization.
- **Sampling all 1024 bins for 40 bars:** Binaural beats occupy only the low end of the spectrum (160–260 Hz). Sample from the lower 50-65% of bins to keep the visualization meaningful.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Frequency analysis | Custom FFT implementation | `AnalyserNode.getByteFrequencyData()` | Browser-optimized, hardware-accelerated, already wired |
| Exact-frequency CSS timing | JS `setInterval` or `requestAnimationFrame` counter | CSS `animation-duration: ${1/beatHz}s` | CSS animations are GPU-composited, never drift, no JS overhead |
| Canvas resize handling | Manual width/height polling | `canvas.width = 320` hardcoded + CSS `w-full` scale | LissajousVisualizer uses this pattern; CSS handles visual scaling, canvas intrinsic size stays fixed |
| Smooth bar decay | Custom easing math | Simple lerp with separate attack/decay coefficients | `current = current * decayCoeff + target * (1 - decayCoeff)` is the industry standard |

**Key insight:** The entire visualization stack (FFT, canvas rendering, animation timing) is already provided by browser APIs. The task is wiring, not building.

---

## Common Pitfalls

### Pitfall 1: analyserRef is null when paused
**What goes wrong:** `getByteFrequencyData()` throws `TypeError: Cannot read properties of null` the moment the user pauses, crashing the rAF loop silently.
**Why it happens:** `teardown()` in `useAudioEngine` explicitly sets `analyserRef.current = null` on pause. This is intentional — nodes are garbage collected.
**How to avoid:** Always gate FFT reads with `if (playing && analyserRef.current)`. The static fallback path runs whenever the gate fails.
**Warning signs:** Visualization freezes on pause without decaying, console shows null reference errors.

### Pitfall 2: Uint8Array allocation in rAF loop
**What goes wrong:** GC pauses cause frame drops, visualizer stutters noticeably at 60fps.
**Why it happens:** `new Uint8Array(1024)` inside `draw()` allocates a new typed array every 16ms (60 fps × 1024 bytes = ~3.75 MB/sec of allocations).
**How to avoid:** Allocate once: `const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)` inside the `useEffect` (before the draw function), not inside the loop.
**Warning signs:** Chrome DevTools performance trace shows frequent minor GC events.

### Pitfall 3: Beat glow at 40 Hz is imperceptible or seizure-inducing
**What goes wrong:** Flow state at 40 Hz (25ms cycle) cycles too fast to see as a beat, or looks like strobing.
**Why it happens:** Human flicker fusion threshold is around 25 Hz; 40 Hz is at the edge of perceptibility.
**How to avoid:** For the 40 Hz glow, reduce the opacity swing (e.g., 0.6→1.0 rather than 0.2→1.0) so it reads as a soft shimmer rather than a hard pulse. Alternatively, show the glow at a subharmonic (40 Hz / 4 = 10 Hz) for visibility while indicating "gamma-range."
**Warning signs:** Flow state play button looks like it's flickering rather than pulsing.

### Pitfall 4: Canvas width mismatch between intrinsic size and CSS size
**What goes wrong:** Bars appear blurry or positioned incorrectly at non-standard display densities.
**Why it happens:** CSS `w-full` may render the canvas at e.g. 400px while intrinsic `width=320` causes scaling artifacts on high-DPI.
**How to avoid:** Use the same fixed `width=320 height=192` that LissajousVisualizer uses — the CSS `w-full h-48` handles the visual stretch, and the bars are abstract enough that blurring is imperceptible. If pixel-perfect is needed, read `devicePixelRatio` and scale the canvas intrinsic size once on mount (not in the rAF loop).
**Warning signs:** Bar edges look soft/blurry on retina displays.

### Pitfall 5: Frequency bin range covers silence
**What goes wrong:** Most bars sit near zero because the binaural tones (160–260 Hz) only occupy a small portion of the 0–22050 Hz spectrum that the 1024 bins cover.
**Why it happens:** With `fftSize=2048` at 48kHz sample rate, each bin covers ~23.4 Hz. The tones sit in bins 7-11 out of 1024.
**How to avoid:** Sample only the lower portion of the frequency array. The binaural content + pink noise occupy roughly the lowest 60% of perceptual weight; limiting bar sampling to `bins[0..614]` gives a richer, more responsive visualization. The pink noise (present only when playing) drives most of the visible activity.
**Warning signs:** Bars barely move when playing; visualization looks nearly static.

---

## Code Examples

Verified patterns from the existing codebase:

### Canvas lifecycle (from LissajousVisualizer.jsx)
```javascript
// Established pattern — useEffect with rAF + cleanup
useEffect(() => {
  const canvas = canvasRef.current
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  const animate = () => {
    // ... draw
    rafRef.current = requestAnimationFrame(animate)
  }
  animate()

  return () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }
}, [playing, color]) // re-run when these change
```

### AnalyserNode data read (Web Audio API)
```javascript
// allocate once, outside the draw function
const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount) // 1024 elements

// inside draw, each frame:
analyserRef.current.getByteFrequencyData(dataArray) // fills 0-255 values
// dataArray[0] = lowest frequency bin, dataArray[1023] = ~22kHz
```

### Exponential smoothing (industry standard for spectrum bars)
```javascript
// Attack faster than decay — organic feel
const ATTACK  = 0.6   // higher = faster rise (react to peaks quickly)
const DECAY   = 0.88  // higher = slower fall (calm settling)

barsRef.current[i] = barsRef.current[i] > targetHeight
  ? barsRef.current[i] * DECAY            // falling: exponential decay
  : barsRef.current[i] * (1 - ATTACK) + targetHeight * ATTACK  // rising: fast lerp
```

### Static fallback bars (when analyserRef is null)
```javascript
// Organic, non-uniform fallback heights — not a flat line
const FALLBACK = [0.12, 0.18, 0.25, 0.20, 0.32, 0.15, 0.22, 0.28,
                  0.18, 0.12, 0.24, 0.30, 0.16, 0.20, 0.14, 0.26]
for (let i = 0; i < BAR_COUNT; i++) {
  const target = FALLBACK[i % FALLBACK.length] * H * 0.35
  barsRef.current[i] = barsRef.current[i] * 0.94 + target * 0.06 // slow drift to target
}
```

### Beat-frequency CSS animation wiring
```javascript
// In AudioPlayer JSX — glow ring on play button
<div
  style={{
    // Exact beat period: frozen=200ms, anxious=100ms, flow=25ms
    animationDuration: `${(1 / track.beatHz).toFixed(4)}s`,
    animationName: 'beatPulse',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
  }}
/>
```

```css
/* In index.css */
@keyframes beatPulse {
  0%, 100% { opacity: 0.25; transform: scale(1);    }
  50%       { opacity: 0.8;  transform: scale(1.06); }
}
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Lissajous pattern (mathematical) | Real FFT spectrum bars (live audio data) | Shift from decorative to data-honest |
| Static glow ring (`animate-pulse-slow`, 3s) | Beat-frequency glow (`1/beatHz` seconds) | From aesthetic to semantically correct |
| Waveform (`getByteTimeDomainData`) | Spectrum (`getByteFrequencyData`) | Spectrum more readable for frequency-based audio |

**Current and correct:**
- `AnalyserNode.getByteFrequencyData()` is the standard for spectrum visualization — unchanged since Web Audio API v1
- CSS `animation-duration` as inline style is valid and GPU-accelerated
- Exponential decay smoothing for spectrum bars is the universal pattern (used by every DAW, audio player, Spotify, etc.)

---

## Open Questions

1. **40 Hz glow visibility at flow state**
   - What we know: 40 Hz = 25ms cycle — above human flicker fusion threshold for some individuals
   - What's unclear: Whether a 25ms opacity animation looks like a smooth pulse or strobe at target frame rates
   - Recommendation: Claude's discretion — implement at full 40 Hz first, evaluate visually; fall back to 40/4=10 Hz subharmonic or reduce opacity swing if it reads as strobe

2. **LissajousVisualizer.jsx fate**
   - What we know: It will not be rendered anywhere after the swap
   - What's unclear: User preference for deletion vs. dead code
   - Recommendation: Delete it — it's a named import in AudioPlayer.jsx that will become unused, which will trigger the ESLint `no-unused-vars` rule and fail `npm run lint`

3. **analyserRef during state switch (frequency rebuild)**
   - What we know: `buildGraph()` is called when `carrierHz` or `beatHz` changes (useEffect line 181–185), which resets `analyserRef.current` to the new node
   - What's unclear: Whether there is a single frame during rebuild where `analyserRef.current` is null mid-animation
   - Recommendation: The null guard on every frame handles this gracefully — at worst one frame renders the static fallback path during the brief rebuild window

---

## Validation Architecture

The config.json does not have `workflow.nyquist_validation` set, so treating as enabled.

### Test Framework

No test framework is currently configured in this project (no `jest.config.*`, `vitest.config.*`, `pytest.ini`, or `__tests__/` directory detected). This phase involves canvas/Web Audio rendering — primarily visual/perceptual verification.

| Property | Value |
|----------|-------|
| Framework | None configured |
| Config file | None — see Wave 0 |
| Quick run command | `npm run lint` (code correctness proxy) |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| AVIZ-01 | Play button glow pulses at beat frequency | manual-only | `npm run lint` | CSS animation timing is perceptual; no automated visual test |
| AVIZ-02 | Frequency bars respond to live audio | manual-only | `npm run lint` | Web Audio + Canvas requires browser runtime; no headless equivalent |

**Manual verification checklist (for `/gsd:verify-work`):**
- [ ] Press play on each state — bars animate and visibly respond to audio
- [ ] Press pause — bars decay to static fallback (not empty, not frozen)
- [ ] Play button glow cycles noticeably on frozen (5 Hz) and anxious (10 Hz)
- [ ] Flow glow (40 Hz) reads as shimmer not strobe
- [ ] Switch state while playing — visualizer updates color and continues without crash
- [ ] `npm run lint` passes with no new errors

### Wave 0 Gaps
- [ ] `src/components/FrequencyBars.jsx` — covers AVIZ-02 (does not exist yet)
- No test framework setup required — lint is sufficient proxy for this phase's automated checking

---

## Sources

### Primary (HIGH confidence)
- Existing codebase — `useAudioEngine.js`, `AudioPlayer.jsx`, `LissajousVisualizer.jsx` — direct inspection of live code
- MDN Web Audio API — AnalyserNode, `getByteFrequencyData()`, fftSize/frequencyBinCount relationship
- Project `stateData.js` — beatHz values confirmed directly: frozen=5, anxious=10, flow=40

### Secondary (MEDIUM confidence)
- CSS animation-duration as inline style — standard CSS spec behavior, confirmed by MDN CSS Animations
- Exponential decay smoothing pattern — universal audio visualizer practice (DAWs, browsers, native apps)

### Tertiary (LOW confidence)
- 40 Hz flicker perception — based on general psychophysics knowledge (individual variation exists; requires visual testing)
- Bin range recommendation (lower 60%) — derived from known audio frequencies and fftSize math, not empirically tested against this specific audio content

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all APIs are browser built-ins already in use in this codebase
- Architecture: HIGH — directly follows the established `LissajousVisualizer` canvas pattern
- Pitfalls: HIGH for null guard and allocation (verified in code); MEDIUM for 40 Hz perception (perceptual, device-dependent)
- Bin range: MEDIUM — math is correct, visual result needs empirical tuning

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (Web Audio API is extremely stable; CSS animations are stable)
