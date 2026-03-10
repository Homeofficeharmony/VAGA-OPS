# Stack Research: Visual & Experience Refresh

## Key Finding

**framer-motion 12.34.5 is already installed** and used in `BreathingOrb.jsx`. The largest animation library decision is already made. All 5 capability areas require zero new npm dependencies.

## Capability → Solution Map

| Capability | Solution | Bundle Impact |
|------------|----------|--------------|
| UI animations | Expand existing framer-motion 12 usage (`layout`, `useAnimate`, `staggerChildren`) | +0kB |
| Data visualization | Native SVG in JSX (same pattern as existing sparkline + SVG ring timer) | +0kB |
| Content rotation | Custom `useContentRotation` hook, date-seeded LCG (~20 lines) | +0kB |
| Audio visualization | Add `AnalyserNode` to existing Web Audio graph in `useAudioEngine.js` | +0kB |
| Ambient effects | CSS keyframes + SVG filters + CSS custom properties (extend `tailwind.config.js`) | +0kB |

## 1. UI Animations — framer-motion 12 (already installed)

**What exists:** `BreathingOrb.jsx` uses `motion.div` with `animate` prop for scale/opacity cycling.

**What to expand:**
- `layout` prop on panels for smooth reflow when state changes
- `AnimatePresence` for mount/unmount transitions on overlays and cards
- `staggerChildren` in `variants` for sequential card reveals
- `useAnimate` for imperative sequences (state selection ceremony)
- `whileHover` / `whileTap` for micro-interactions on buttons/cards
- `useMotionValue` + `useTransform` for scroll-linked or drag-linked animations

**DO NOT add:** GSAP, React Spring, or any other animation library — framer-motion covers all needs.

## 2. Data Visualization — Native SVG

**What exists:** VagusLogSidebar has a 5-day sparkline built with raw SVG `<polyline>`. StealthReset uses SVG `<circle>` with `stroke-dasharray` for the ring timer.

**Pattern to follow:** Build all charts as React components returning `<svg>` elements:
- Line charts: `<polyline>` with `points` computed from session data
- Area charts: `<path>` with `d` attribute (moveTo + lineTo + closePath)
- Radial charts: `<circle>` with `stroke-dasharray` (same as existing timer ring)
- Bar charts: `<rect>` elements with computed heights
- Animate with framer-motion's `motion.path` and `pathLength`

**DO NOT add:** recharts (180kB), victory (200kB), nivo (250kB), D3 (300kB) — all violate the <700kB bundle constraint and are overkill for the 3-5 chart types needed.

## 3. Content Rotation — Custom Hook

**What exists:** `stateData.js` has 8 tips per state, static task lists, fixed protocol steps.

**Solution:** `useContentRotation(pool, options)` hook:
- Date-seeded linear congruential generator (LCG) for deterministic daily rotation
- Session-seeded variant for per-session variety
- Pool shuffling so all items surface before repeats
- ~20 lines of code, zero dependencies

**Content expansion needed in stateData.js:**
- Expand tips from 8 → 20+ per state (with categories: science, action, metaphor)
- Add 3-4 variant phrasings per breath cue
- Add task rotation pools (morning/afternoon/evening variants)
- Add protocol step variations (beginner/intermediate phrasings)

## 4. Audio Visualization — AnalyserNode

**What exists:** `useAudioEngine.js` creates `OscillatorNode` → `GainNode` → `destination`. `AudioPlayer.jsx` draws a basic waveform on `<canvas>` via `requestAnimationFrame`.

**Solution:** Insert `AnalyserNode` into the existing audio graph:
```
OscillatorNode → GainNode → AnalyserNode → destination
```
- `analyser.getByteFrequencyData()` for frequency bars
- `analyser.getByteTimeDomainData()` for waveform
- Feed data to canvas or SVG visualizer component
- `fftSize: 256` for 128 frequency bins (sufficient for binaural visualization)

**No new libraries needed.** AnalyserNode is a built-in Web Audio API node.

## 5. Ambient Atmosphere — CSS + SVG

**What exists:** Tailwind config has custom shadow glows, CSS custom properties for all theme colors, `@keyframes hrv-ripple` in index.css.

**Solution layers:**
- **Gradient backgrounds:** CSS `radial-gradient` / `conic-gradient` with custom properties for state-reactive colors
- **Particle effects:** CSS `@keyframes` with `box-shadow` for floating dots (no canvas needed for <50 particles)
- **SVG filters:** `<feTurbulence>` + `<feDisplacementMap>` for organic texture overlays
- **Color shifts:** CSS `transition` on custom properties when state changes (already supported by theme system)
- **Depth/glass:** `backdrop-filter: blur()` + semi-transparent backgrounds (already using `bg-opacity` in Tailwind)

**DO NOT add:** Three.js, p5.js, PixiJS — massive overkill for ambient atmosphere, would blow the bundle budget.

## Alternatives Ruled Out

| Library | Size | Why Not |
|---------|------|---------|
| recharts | ~180kB | Overkill for 3-5 chart types; native SVG is lighter |
| D3 | ~300kB | Way too heavy; we need charts, not a data science toolkit |
| Three.js | ~600kB | Would nearly double the bundle for background effects |
| GSAP | ~90kB | Redundant — framer-motion already installed and sufficient |
| React Spring | ~50kB | Redundant — framer-motion already installed |
| Chart.js | ~200kB | Canvas-based, harder to theme; native SVG is better fit |

## Integration Points

- **framer-motion** ← already wired into React build pipeline via Vite
- **AnalyserNode** ← insert into existing `useAudioEngine.js` audio graph
- **SVG charts** ← follow existing sparkline pattern in VagusLogSidebar
- **CSS atmosphere** ← extend existing `tailwind.config.js` and `index.css`
- **Content hook** ← consumes existing `stateData.js` pools, no structural changes

## Summary

Zero new npm installs. Everything builds on what's already there. The constraint is content creation (writing 60+ tip variants, breath cue alternatives, protocol variations) not library selection.
