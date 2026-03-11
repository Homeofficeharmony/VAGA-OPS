# Phase 4: Atmospheric Effects - Research

**Researched:** 2026-03-11
**Domain:** Canvas particle systems, CSS color transitions, React animation patterns, ambient UI mode
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VATM-01 | Color field transitions from state accent toward settled hue as immersion progresses | `stabilizePct` (0→1 over session) already computed in ImmersionContainer; interpolate from accentHex to settled neutral using lerp on RGB channels |
| VATM-02 | Organic particles that respond to breath phase (slow on exhale, quicken on inhale) | Canvas + rAF particle loop; breathPhase already exposed from useImmersionBreath; speed scalar driven by phase |
| VATM-03 | Visual celebration (glow or radial burst) at session completion before check-in | Triggers on `phase === 'integrate'` transition; CSS keyframe radial-burst or canvas burst fired once |
| VATM-04 | Distinct visual environment per state (cool mist frozen, warm amber anxious, soft green flow) | Per-state particle config object (color palette, count, speed, opacity) keyed by state ID |
| STUX-02 | Ambient mode: audio + atmospheric visuals without entering a structured session | New `AmbientMode` boolean state in App.jsx; renders particle layer + audio controls without ImmersionContainer |
</phase_requirements>

---

## Summary

Phase 4 adds the living visual layer to the app — particles, color-field transitions, and a completion celebration. All five requirements land in a single new component (`ParticleField`) plus targeted edits to `ImmersionContainer`, `NeuralBackground`, and `App.jsx`.

The existing codebase already has the structural scaffolding. `NeuralBackground` is a placeholder returning only a static `bg-base` div. `ImmersionBackground` provides breath-synced radial pulses but no particles. `stabilizePct` (0→1) is already computed inside `ImmersionContainer` and can be passed as a prop to drive the color-field transition. The ambient engine is fully built — STUX-02 only requires a surface-level "ambient mode" toggle that activates audio + particle layer without the structured session.

**Primary recommendation:** Build one `ParticleField` canvas component with a per-state config object. Thread `stabilizePct` and `breathPhase` in as props. Replace the `NeuralBackground` stub with this component. All other requirements are small wiring changes on top.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Canvas 2D API | Browser built-in | Particle rendering loop | Zero bundle cost; project constraint bars new animation libraries |
| `requestAnimationFrame` | Browser built-in | 60fps draw loop | Same pattern already used in `AudioPlayer.jsx` for FrequencyBars |
| `useRef` / `useEffect` | React 19 built-in | Canvas ref + rAF lifecycle | Matches existing hook patterns throughout codebase |
| CSS custom properties | Browser built-in | Color-field gradient | Theme system is already var(--bg-base) based; inline style overrides slot in |
| Framer Motion 12 | Already installed | Completion burst (one-shot animation) | Already in BreathingOrb; use `animate` + `onAnimationComplete` for burst |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `src/utils/grain.js` | Project util | Grain overlay texture | Apply over particle canvas for cohesive biophilic texture |
| `useBreathTimer` | Project hook | Breath cycle timing | ImmersionBackground already uses it; ParticleField can read same hook |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Canvas 2D particle loop | CSS `@keyframes` on DOM nodes | DOM nodes: simpler but can't handle 40+ particles without layout thrash; Canvas scales cleanly |
| Canvas 2D particle loop | WebGL / Three.js | WebGL: dramatically more powerful but violates the "no new animation libraries" constraint and 44kB bundle limit |
| Framer Motion burst | Pure CSS `@keyframes` radial-burst | Both viable; Framer already imported; using it keeps code consistent with BreathingOrb |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure

The phase introduces one new component file and edits three existing files:

```
src/
├── components/
│   ├── NeuralBackground.jsx     ← REPLACE stub with ParticleField wrapper
│   ├── ParticleField.jsx        ← NEW: canvas particle system (VATM-02, VATM-04)
│   ├── CompletionBurst.jsx      ← NEW: one-shot glow/radial burst (VATM-03)
│   ├── ImmersionContainer.jsx   ← EDIT: pass stabilizePct + breathPhase as props to ParticleField; mount CompletionBurst on integrate phase
│   └── AmbientSoundscape.jsx    ← EDIT: visible in ambient mode (not just isImmersive)
├── App.jsx                      ← EDIT: ambient mode state, AmbientMode button, pass ambientMode to NeuralBackground
```

### Pattern 1: Per-State Particle Config Object

**What:** A static config object keyed by state ID that defines all visual parameters for each state.
**When to use:** Any time a particle property needs to differ per state. Never derive magic numbers inline.

```typescript
// src/components/ParticleField.jsx
const PARTICLE_CONFIG = {
  frozen: {
    count: 28,
    color: '#8ab4cc',   // cool blue-grey mist
    speedBase: 0.18,    // very slow drift
    speedVariance: 0.08,
    sizeMin: 1.5,
    sizeMax: 3.5,
    opacityMin: 0.06,
    opacityMax: 0.22,
    directionSpread: 0.4,  // mostly vertical, slow upward drift
    breathSpeedMult: { inhale: 1.15, hold: 1.0, exhale: 0.55 },
  },
  anxious: {
    count: 42,
    color: '#c8a040',   // warm amber
    speedBase: 0.55,
    speedVariance: 0.35,
    sizeMin: 1.0,
    sizeMax: 2.8,
    opacityMin: 0.08,
    opacityMax: 0.30,
    directionSpread: 1.8,  // jittery, scattered directions
    breathSpeedMult: { inhale: 1.45, hold: 1.2, exhale: 0.70 },
  },
  flow: {
    count: 32,
    color: '#52b87e',   // soft green
    speedBase: 0.28,
    speedVariance: 0.12,
    sizeMin: 1.8,
    sizeMax: 4.0,
    opacityMin: 0.05,
    opacityMax: 0.18,
    directionSpread: 0.0,  // smooth circular orbital motion
    breathSpeedMult: { inhale: 1.20, hold: 1.0, exhale: 0.80 },
  },
}
```

### Pattern 2: Canvas rAF Loop with Breath-Driven Speed Scalar

**What:** Standard canvas particle loop. The breath phase drives a speed multiplier applied each frame.
**When to use:** This is the core render pattern for ParticleField.

```javascript
// Inside ParticleField.jsx useEffect
const rafRef = { current: null }

function draw() {
  const ctx = canvasRef.current?.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const speedMult = config.breathSpeedMult[breathPhase] ?? 1.0

  for (const p of particles) {
    p.x += p.vx * speedMult
    p.y += p.vy * speedMult

    // Wrap edges
    if (p.x < 0) p.x = canvas.width
    if (p.x > canvas.width) p.x = 0
    if (p.y < 0) p.y = canvas.height
    if (p.y > canvas.height) p.y = 0

    ctx.globalAlpha = p.opacity
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
  }

  rafRef.current = requestAnimationFrame(draw)
}

rafRef.current = requestAnimationFrame(draw)
return () => cancelAnimationFrame(rafRef.current)
```

### Pattern 3: Color-Field Transition via RGB Lerp

**What:** Interpolate the immersion background color from the state's accent hex toward a neutral "settled" hue as `stabilizePct` advances from 0 to 1.
**When to use:** VATM-01. Wired inside ImmersionContainer's wrapper div background.

Settled hue target: `#1a1f1a` (near-neutral dark green-grey — reads as calm regardless of entry state).

```javascript
// Pure utility — no library needed
function lerpHex(hexA, hexB, t) {
  const parse = (h) => [
    parseInt(h.slice(1,3), 16),
    parseInt(h.slice(3,5), 16),
    parseInt(h.slice(5,7), 16),
  ]
  const [ar, ag, ab] = parse(hexA)
  const [br, bg, bb] = parse(hexB)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const b = Math.round(ab + (bb - ab) * t)
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}

// In ImmersionContainer stabilize phase:
const bgColor = lerpHex(accent + '1a', '#1a1f1a', stabilizePct)
// Apply as radial-gradient center color — not flat fill
```

### Pattern 4: One-Shot Completion Burst

**What:** When `phase === 'integrate'` is entered, a brief CSS keyframe radial burst plays once then disappears. Lives in a tiny `CompletionBurst` component.
**When to use:** VATM-03. Mounted conditionally — only when integrate phase begins.

```javascript
// CompletionBurst.jsx — pure CSS, no framer-motion needed here
// Inject keyframe via <style> tag or add to index.css

const style = `
@keyframes completion-burst {
  0%   { transform: scale(0.6); opacity: 0.9; }
  60%  { transform: scale(2.2); opacity: 0.5; }
  100% { transform: scale(3.5); opacity: 0; }
}
`

export default function CompletionBurst({ accentHex }) {
  return (
    <>
      <style>{style}</style>
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none flex items-center justify-center z-[56]"
      >
        <div
          style={{
            width: 160, height: 160,
            borderRadius: '50%',
            border: `2px solid ${accentHex}`,
            boxShadow: `0 0 60px ${accentHex}60, inset 0 0 40px ${accentHex}20`,
            animation: 'completion-burst 1.2s ease-out forwards',
          }}
        />
      </div>
    </>
  )
}
```

### Pattern 5: Ambient Mode Toggle (STUX-02)

**What:** A new boolean `ambientMode` state in App.jsx that activates audio + particles without entering ImmersionContainer. Distinct from `isImmersive`.
**When to use:** The ambient mode button lives on the dashboard. It activates when state is selected.

```javascript
// App.jsx additions
const [ambientMode, setAmbientMode] = useState(false)

// Ambient mode: particles + audio, no session structure
const handleAmbientToggle = () => {
  if (!selectedState) return
  const next = !ambientMode
  setAmbientMode(next)
  if (next) {
    ambientEngine.autoStartForState?.(selectedState, stateData)
  } else {
    ambientEngine.stop?.()
  }
}

// Pass to NeuralBackground:
<NeuralBackground
  isImmersive={isImmersive}
  ambientMode={ambientMode}
  selectedState={selectedState}
  breathPhase="inhale"  // static fallback when no session running
/>
```

`NeuralBackground` replaces its stub body with `<ParticleField>` rendered when `isImmersive || ambientMode`.

### Anti-Patterns to Avoid

- **DOM particle nodes:** Never render 30+ `<div>` particles as DOM elements. Use canvas. DOM particles cause layout thrash and degrade React reconciliation.
- **Particle state in React state:** Never put particle array in `useState`. Use `useRef` for the particles array — updating it each frame must not trigger re-renders.
- **CSS transition on canvas:** Canvas elements cannot be CSS-transitioned. All animation is in the rAF draw loop.
- **Triggering re-renders every frame:** The rAF loop must be entirely outside React's render cycle. Only mount/unmount the canvas component based on props; draw loop runs inside `useEffect`.
- **Resizing without canvas size sync:** Always sync `canvas.width/height` to the element's `offsetWidth/offsetHeight` or a `ResizeObserver`. Mismatched device pixel ratio causes blurry particles on retina.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hex color interpolation | CSS transition on background-color | `lerpHex` pure function (20 lines) | CSS `transition` on background can't be driven by a numeric progress value mid-session; lerp gives exact control |
| Particle spawn position seeding | `Math.random()` fresh every render | Initialize particles once in `useEffect` with `useRef` array | Re-seeding on every render causes visual pop when state changes |
| Flow-state orbital motion | Vector math library | Simple `angle += angularVelocity` per frame | Orbital motion is 2 lines of trig; no library justifies the bundle cost |
| Completion animation timing | `setTimeout` chains | Single CSS `animation: burst 1.2s forwards` with `onAnimationEnd` | CSS handles timing; component unmounts itself via callback |

**Key insight:** Every visual effect in this phase is achievable with browser primitives. The constraint of zero new dependencies is compatible with all requirements.

---

## Common Pitfalls

### Pitfall 1: Canvas DPR Mismatch (Blurry Particles on Retina)

**What goes wrong:** Particles look fuzzy on MacBook / high-DPR screens.
**Why it happens:** `canvas.width` defaults to CSS pixels, not physical pixels. At DPR 2, a 1920px canvas draws at 960px quality.
**How to avoid:**
```javascript
const dpr = window.devicePixelRatio || 1
canvas.width  = canvas.offsetWidth  * dpr
canvas.height = canvas.offsetHeight * dpr
ctx.scale(dpr, dpr)
```
**Warning signs:** Particles look soft/antialiased at all sizes.

### Pitfall 2: rAF Leak on Unmount

**What goes wrong:** Particles continue animating after component unmounts; causes React "setState on unmounted component" warnings.
**Why it happens:** `requestAnimationFrame` continues until explicitly cancelled.
**How to avoid:** Always return cleanup from `useEffect`:
```javascript
return () => {
  cancelAnimationFrame(rafRef.current)
  rafRef.current = null
}
```
**Warning signs:** Memory usage grows after state changes; console warnings about setState on unmounted components.

### Pitfall 3: State-Switch Visual Pop

**What goes wrong:** When the user switches states on the dashboard, particles snap to new color/behavior abruptly.
**Why it happens:** Particle config is applied immediately when the component re-renders with new `selectedState`.
**How to avoid:** When `selectedState` changes, don't re-initialize particles. Instead, lerp `config.color` toward the new state's color over 1-2 seconds using a `colorT` ref that advances each frame.
**Warning signs:** Jarring visual flash on state button click.

### Pitfall 4: Ambient Mode Audio Leaks

**What goes wrong:** Ambient mode audio keeps playing after user navigates away or closes the tab, or double-starts when `isImmersive` also triggers `autoStartForState`.
**Why it happens:** Both `ambientMode` and the immersion flow call `autoStartForState`; without a guard they create two audio contexts.
**How to avoid:** The ambient engine's `select()` calls `teardown()` before building — it is idempotent. Still, explicitly `stop()` ambient when `isImmersive` becomes true, so immersion's audio takes over cleanly. Restore ambient on immersion exit if `ambientMode` is still active.
**Warning signs:** Volume doubling, or audio still playing after all UI is closed.

### Pitfall 5: Particle Count and Mobile Performance

**What goes wrong:** Anxious state's 42-particle config hits janky framerates on mid-range mobile.
**Why it happens:** Canvas 2D arc() calls are cheap but not free; 60fps with 42 particles is fine on desktop, marginal on low-end mobile.
**How to avoid:** Cap at 30 particles when `window.innerWidth < 600` or when `navigator.hardwareConcurrency <= 2`.
**Warning signs:** Frame timing > 16ms on the Chrome Performance tab.

---

## Code Examples

### Canvas Setup with DPR (verified browser API pattern)

```javascript
// Source: MDN Canvas API documentation (browser standard)
useEffect(() => {
  const canvas = canvasRef.current
  if (!canvas) return

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width  = rect.width  * dpr
  canvas.height = rect.height * dpr

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  // Initialize particles once
  particlesRef.current = initParticles(config, rect.width, rect.height)

  // Start loop
  let rafId
  function loop() {
    drawParticles(ctx, particlesRef.current, breathPhaseRef.current, config, rect.width, rect.height)
    rafId = requestAnimationFrame(loop)
  }
  rafId = requestAnimationFrame(loop)

  return () => cancelAnimationFrame(rafId)
}, [selectedState]) // re-init only when state changes
```

### Flow-State Orbital Motion

```javascript
// Source: Standard 2D orbital mechanics — no library needed
function updateFlowParticle(p, speedMult) {
  p.angle += p.angularVelocity * speedMult
  p.x = p.cx + Math.cos(p.angle) * p.radius
  p.y = p.cy + Math.sin(p.angle) * p.radius
}

function initFlowParticle(w, h) {
  const cx = w / 2 + (Math.random() - 0.5) * w * 0.6
  const cy = h / 2 + (Math.random() - 0.5) * h * 0.6
  const radius = 20 + Math.random() * 80
  return {
    cx, cy, radius,
    angle: Math.random() * Math.PI * 2,
    angularVelocity: (Math.random() * 0.004 + 0.002) * (Math.random() < 0.5 ? 1 : -1),
  }
}
```

### Anxious-State Jitter Motion

```javascript
// Jittery particles: small random velocity changes each frame
function updateAnxiousParticle(p, speedMult) {
  // Random walk with occasional direction kick
  if (Math.random() < 0.04) {
    p.vx += (Math.random() - 0.5) * 0.4
    p.vy += (Math.random() - 0.5) * 0.4
    // Clamp velocity to prevent runaway
    const spd = Math.sqrt(p.vx**2 + p.vy**2)
    const maxSpd = 1.2
    if (spd > maxSpd) { p.vx = (p.vx/spd)*maxSpd; p.vy = (p.vy/spd)*maxSpd }
  }
  p.x += p.vx * speedMult
  p.y += p.vy * speedMult
}
```

### Completion Burst Keyframe (add to index.css)

```css
/* Source: Custom — standard CSS keyframe pattern */
@keyframes completion-burst {
  0%   { transform: scale(0.5); opacity: 1; }
  50%  { transform: scale(1.8); opacity: 0.6; }
  100% { transform: scale(3.2); opacity: 0; }
}

@keyframes completion-glow {
  0%   { box-shadow: 0 0 20px var(--burst-color); opacity: 0.9; }
  100% { box-shadow: 0 0 120px var(--burst-color); opacity: 0; }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| DOM-node CSS particle animations | Canvas rAF loop | ~2020 (performance standards) | 10× more particles at same CPU cost |
| WebGL for any particles | Canvas 2D for < 100 particles | 2022 (browser perf improvements) | Canvas 2D sufficient; no library needed under 100 particles |
| Global CSS gradient backgrounds | CSS custom properties + inline style overrides | React era | Clean integration with existing var(--bg-base) theme system |

**Deprecated/outdated:**
- CSS `@keyframes` with `animation-play-state` for interactive speed control: Cannot drive animation speed from a React prop in real time. Use canvas instead.
- `requestIdleCallback` for particle updates: Idle callback is too infrequent for smooth 60fps; use rAF.

---

## Open Questions

1. **Flow-state orbital center points**
   - What we know: Orbital motion requires a center point (`cx`, `cy`); if centered on viewport center it looks uniform/mechanical
   - What's unclear: Whether aesthetics call for distributed orbital centers (organic) vs. single center (focused)
   - Recommendation: Default to distributed centers scattered across viewport; treat as design spike during first plan

2. **Ambient mode button placement**
   - What we know: STUX-02 requires a user-accessible control; dashboard already has Tools tab
   - What's unclear: Whether this is a dedicated button on the dashboard or added to the existing AmbientSoundscape strip
   - Recommendation: Add as a soft toggle row in the Regulate tab (visible when state is selected) — same z-plane as the existing StealthReset. AmbientSoundscape panel stays in immersion only.

3. **Color-field transition perceptibility**
   - What we know: `stabilizePct` runs 0→1 over 120-180 seconds; lerp may be imperceptibly slow in real use
   - What's unclear: Whether a logarithmic ease (faster initial shift) is needed for the effect to be noticeable
   - Recommendation: Use `Math.pow(stabilizePct, 0.5)` (square root easing) so the shift is visible in the first 30 seconds, not just the last

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — project has no test infrastructure |
| Config file | none — Wave 0 would need setup |
| Quick run command | n/a |
| Full suite command | n/a |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VATM-01 | `lerpHex('#c4604a', '#1a1f1a', 0.5)` returns mid-point color | unit | n/a — no test runner | ❌ Wave 0 |
| VATM-02 | Particle speed scalar changes with breathPhase | unit | n/a | ❌ Wave 0 |
| VATM-03 | CompletionBurst mounts on integrate phase | integration | n/a | ❌ Wave 0 |
| VATM-04 | Each state produces distinct particle config | unit | n/a | ❌ Wave 0 |
| STUX-02 | Ambient mode toggle activates engine without session | integration | n/a | ❌ Wave 0 |

**Note:** No test infrastructure exists in this project. All verification is manual visual QA. The planner should include explicit visual verification steps in each plan's success criteria rather than automated test gates.

### Wave 0 Gaps

None to establish — project has no test runner and the roadmap does not call for adding one. Verification relies on visual QA and the browser devtools Performance tab for frame timing.

---

## Sources

### Primary (HIGH confidence)

- MDN Canvas API (browser standard) — `getContext('2d')`, `requestAnimationFrame`, DPR scaling, `arc()`, `clearRect()`
- Project source code (direct read) — `ImmersionContainer.jsx`, `NeuralBackground.jsx`, `ImmersionBackground.jsx`, `BreathingOrb.jsx`, `AmbientSoundscape.jsx`, `useAmbientEngine.js`, `package.json`
- Project planning files (direct read) — REQUIREMENTS.md, ROADMAP.md, STATE.md

### Secondary (MEDIUM confidence)

- Framer Motion 12 docs (installed version) — `animate`, `onAnimationComplete` for CompletionBurst option
- CSS `@keyframes` spec (browser standard) — `animation-fill-mode: forwards` for one-shot burst

### Tertiary (LOW confidence)

- Particle count performance thresholds (40 particles at 60fps on mobile) — derived from general canvas performance knowledge; specific device benchmarks not verified

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all browser APIs and already-installed libraries
- Architecture: HIGH — based on direct reading of existing code structure
- Pitfalls: HIGH — canvas DPR and rAF leak are well-known; ambient audio leak derived from reading useAmbientEngine code directly
- Performance thresholds: LOW — "42 particles is fine on desktop" not benchmarked on actual hardware

**Research date:** 2026-03-11
**Valid until:** 2026-06-11 (stable browser APIs; React 19 stable; no fast-moving dependencies)
