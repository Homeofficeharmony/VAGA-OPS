# Architecture Patterns: Visual & Experience Refresh

**Domain:** React SPA UI overhaul — animation, content variety, data visualization, audio visualization, atmospheric effects
**Researched:** 2026-03-09
**Milestone:** v1.0 Visual & Experience Refresh (subsequent milestone; existing codebase)

---

## Existing Architecture Inventory

Before decisions, what we already have:

| Layer | What Exists | Current State |
|-------|-------------|---------------|
| Animation library | Framer Motion 12.34.5 | Already installed; used in `BreathingOrb` only |
| CSS animations | `@keyframes` in `index.css`, Tailwind keyframes in config | `fadeIn`, `fadeInUp`, `stateBreathe`, `glowBreathe`, `hrv-ripple`, `breathe`, `pulse-slow` |
| Canvas rendering | `LissajousVisualizer.jsx` — raw Canvas 2D + rAF | Working; 320x192 fixed canvas |
| Background layer | `NeuralBackground.jsx` — currently a no-op placeholder | Returns a plain div; no actual neural animation |
| Breath-sync pulse | `ImmersionBackground.jsx` — CSS radial gradient, updates via `useBreathTimer` | Working; pure CSS, no JS animation lib |
| State theming | CSS custom properties via `data-theme` on `<html>` | 3 themes fully working |
| Content data | `stateData.js` — 5 tips per state, 5 tasks, 5 protocol steps, 5 audio tracks | Static; no rotation logic |
| Session data | `useSessionLog` — array of session objects in localStorage | Up to 90 entries; shape well-defined |
| Data viz | `VagusLogSidebar` 5-day sparkline (bar chart in divs), `WeeklyIntelligenceCard` text metrics | Minimal; no charting library |

---

## 1. Animation System: CSS vs JS vs Hybrid

### Decision: Hybrid (CSS for structural, Framer Motion for component transitions)

**Rationale based on codebase evidence:**

Framer Motion 12 is already installed and used in `BreathingOrb.jsx`. The bundle already pays the cost (~50kB min+gz). Adding more Framer Motion usage is zero marginal bundle cost. The question is when to use each layer.

**CSS-only (no Framer Motion):**
- High-frequency frame-by-frame animations (breathing orb scale, ImmersionBackground pulse). These use `useBreathTimer` values computed outside the render cycle and applied via direct style mutation or rAF — CSS transitions would add jank via React re-renders. `ImmersionBackground.jsx` proves this pattern already.
- Simple always-on loops: `animate-pulse`, `state-breathe`, `glow-breathe` — already CSS keyframes in `index.css` and Tailwind config. Add more here.
- Theme-reactive glows and color changes — pure CSS var transitions.

**Framer Motion:**
- Component enter/exit transitions (`AnimatePresence + motion.*`) — state card expansion, tab content swaps, overlay phase transitions. Already used correctly in `BreathingOrb` for phase label swaps.
- Layout animations when element dimensions change — task list expansion, state card active state growing.
- Gesture interactions (drag, tap) if added to state selector cards.
- One-shot transitions (page sections, onboarding steps).

**Inline style + rAF (no library):**
- Any animation that must stay in sync with Web Audio API timing or breath phase values. `LissajousVisualizer` and `ImmersionBackground` prove this pattern works well and avoids reconciliation overhead.
- New atmospheric canvas effects (particle systems, gradient animation) — always canvas + rAF.

**What NOT to do:**
- Do not use Framer Motion's `animate` prop for per-frame orb scaling — it batches poorly with 60fps updates. The existing `BreathingOrb` uses `transition: { duration: 0.1, ease: "linear" }` which is acceptable but slightly imprecise; for perfect breath sync the rAF approach in `ImmersionBackground` is better.
- Do not add GSAP or Motion One — the bundle constraint (700kB) and Framer Motion already present make this redundant.

### Animation Zones Map

```
Zone A — CSS keyframes (index.css + tailwind.config.js)
  → Loops, glows, pulse-slow, state-breathe, hover shimmer, grain overlays
  → Add: shimmer-enter, state-transition, content-fade

Zone B — Framer Motion (AnimatePresence + motion.*)
  → Component mount/unmount, tab changes, overlay phase switches
  → Add: StateCard expansion, tip rotations, task list reorder

Zone C — rAF + inline style (no library)
  → Breath-synced orb, ImmersionBackground pulse, canvas visualizers
  → Add: atmospheric particle canvas, waveform bars reacting to audio analyser
```

---

## 2. Content Variety / Rotation Engine

### Decision: Pure utility hook `useContentRotation` + enriched `stateData.js`

**Architecture:**

The content variety feature has two distinct concerns:
1. **What content exists** — lives in `stateData.js`
2. **What to show when** — lives in a new `useContentRotation` hook

**`stateData.js` changes (data layer only, no new files):**

Each state object gains:
```js
tips: [/* 8 existing tips — already done */],
breathCues: {
  inhale: ['cue 1', 'cue 2', 'cue 3', 'cue 4'],
  hold:   ['cue 1', 'cue 2'],
  exhale: ['cue 1', 'cue 2', 'cue 3', 'cue 4'],
},
protocolVariants: [
  { id: 'ear-apex', title: '...', steps: [...] },       // existing
  { id: 'ear-apex-2', title: '...', steps: [...] },     // new variant
],
taskGroups: [
  { id: 'primary', label: '...', items: [...] },        // existing 5 tasks
  { id: 'minimal', label: '...', items: [...] },        // new: 2-task minimal set
],
```

**`src/hooks/useContentRotation.js` (new):**
```js
// Manages daily rotation index, persisted to localStorage key 'vaga-rotation-{date}'
// Returns: { tipIndex, protocolVariantIndex, taskGroupIndex, breathCueIndex, advanceTip }
// Session-stable: indices reset at midnight, not per page load
```

Internal shape:
```js
{
  'vaga-rotation-2026-03-09': { tipIndex: 2, protocolVariant: 1, taskGroup: 0 }
}
```

**Integration points:**

| Consumer | What Changes |
|----------|--------------|
| `StealthReset` | Reads `protocolVariantIndex` from hook → selects `stateData.protocolVariants[i]` instead of `stateData.reset` |
| `TaskFilter` | Reads `taskGroupIndex` from hook → selects which task group to display |
| `ImmersionContainer` | Reads `breathCueIndex` from hook → rotates GROUNDING_PHRASES (already has per-phrase arrays) |
| `BreathingOrb` | Reads from hook instead of its own local `GROUNDING_CUES` constant — eliminates duplication |
| New `TipRotator` component | Reads `tipIndex`, renders current tip with transition, exposes "next tip" button |

**No new state in App.jsx** — `useContentRotation` is consumed directly by each component that needs it. The hook reads/writes its own localStorage key.

---

## 3. Data Visualization Layer

### Decision: Custom SVG + canvas components; no charting library

**Rationale:** The 700kB bundle constraint and offline-first requirement rule out Chart.js (~200kB), Recharts (~180kB), or D3 (~250kB). The existing session data shape is well-understood and fixed. Custom components built on SVG path generation and canvas are fast, theme-compatible, and already proven by `LissajousVisualizer`.

**New components (all new files):**

```
src/components/charts/
  SessionHeatmap.jsx      — 7-day grid showing state dominance per day
  ActivationArc.jsx       — SVG arc/gauge showing activation before vs after
  StateFlowLine.jsx       — Multi-line sparkline: 30 days, 3 state frequencies
  ProtocolEffectBar.jsx   — Horizontal bars: protocol → avg shift delta
```

**Data transformation (new utility, separate from components):**

```
src/lib/chartData.js      — Pure functions: sessionsToHeatmap(), sessionsToFlowLine(), etc.
```

Keep data transformation out of components. Each chart receives pre-computed data as props. This mirrors the existing `generateWeeklySummary` pattern in `useSessionMetrics.js`.

**SVG pattern (for SessionHeatmap and ActivationArc):**
```jsx
// Use viewBox + preserveAspectRatio for responsive scaling
// Use CSS vars for fill colors (theme compatibility)
// No external dependency
<svg viewBox="0 0 280 40" preserveAspectRatio="xMidYMid meet">
  <rect fill={`var(--accent-${state})`} ... />
</svg>
```

**Canvas pattern (for StateFlowLine — smooth curves need canvas):**
```js
// Bezier curves via ctx.bezierCurveTo
// Theme-compatible: read computed CSS var value once at mount
// rAF-free: draw once on data change, not continuously
useEffect(() => { drawChart(canvasRef.current, data, accentHex) }, [data, accentHex])
```

**Integration with `WeeklyIntelligenceCard`:**
- Current: text-only metric rows
- After: `WeeklyIntelligenceCard` gains a `variant="visual"` prop; when set, shows `SessionHeatmap` and `ActivationArc` in addition to (or replacing) the text metrics
- No change to `useWeeklySummary` hook — it already returns the right data shape

**Integration with `VagusLogSidebar`:**
- Current: 5 colored div-bars for state sparkline (already works)
- After: Replace the div bars with `StateFlowLine` canvas component for smoother rendering with more days
- No structural change — just swap the JSX inside the existing sidebar

---

## 4. Enhanced Audio Visualization

### Decision: Upgrade `LissajousVisualizer` + add a new `WaveformBars` component

**Current state of `LissajousVisualizer.jsx`:**
- Draws Lissajous figure using parametric equations of `carrierHz` and `carrierHz + beatHz`
- 200-point trail, 60fps rAF loop
- 320x192 canvas, pure math — no actual AnalyserNode connection to Web Audio

**Two complementary upgrades:**

**Upgrade A — Keep LissajousVisualizer, make it audio-aware (MEDIUM effort):**

The existing Lissajous is correct conceptually (binaural beats create a Lissajous pattern in the brain). But it runs at wall-clock time, not actual audio time.

Add optional `analyserNode` prop. If provided, use FFT data to modulate trail opacity and particle size. If not provided, fall back to current math-only mode.

```jsx
// LissajousVisualizer.jsx — new optional prop
export default function LissajousVisualizer({ playing, carrierHz, beatHz, color, analyserNode }) {
  // If analyserNode: use getByteFrequencyData() to scale trail opacity
  // If not analyserNode: current math-only behavior (no regression)
}
```

To expose `analyserNode` from `useAudioEngine`: add `getAnalyserNode()` method to the hook's return value. The analyser is created once, inserted between the oscillator chain and destination.

**Upgrade B — New `WaveformBars.jsx` component (LOW effort, HIGH visual impact):**

A simpler, more immediately readable visualization than Lissajous. Uses `AnalyserNode.getByteTimeDomainData()` to draw a frequency bar display. Shown in `AudioPlayer` when playing, as an alternative to or supplement of the Lissajous.

```
src/components/WaveformBars.jsx
  Props: { analyserNode, color, barCount, height }
  Canvas: reads time-domain data, draws N vertical bars with accent color
  When analyserNode is null: draws a static decorative bar pattern (non-animated)
```

**Integration into `AudioPlayer`:**
- Current: `<LissajousVisualizer playing={playing} ... />`
- After: `<LissajousVisualizer playing={playing} analyserNode={analyserNode} ... />` as the primary viz
- `useAudioEngine` returns `analyserNode` alongside existing API
- No change to AudioPlayer's props interface — `stateData` is still the only prop

**`useAudioEngine` change (additive only):**
```js
// Before: return { playing, play, pause, volume, setVolume, supported }
// After: return { playing, play, pause, volume, setVolume, supported, analyserNode }
// analyserNode is created on ctx init, connected between osc chain and destination
```

**ImmersionContainer audio visualization:**
- Current: `ImmersionContainer` has no audio visualization — it uses the ambient engine but shows nothing
- After: Add a `<WaveformBars>` component in the stabilize phase, positioned behind the breath orb, using `ambientEngine`'s analyser node (if exposed)
- `ambientEngine` (from `useAmbientEngine`) needs an `analyserNode` getter added similarly

---

## 5. Atmospheric Effects

### Decision: Canvas particle system in `NeuralBackground` + CSS grain on state cards

**Current `NeuralBackground.jsx` is a stub** (returns a plain colored div in immersive mode). This is the primary surface for atmospheric upgrade.

**Upgrade `NeuralBackground.jsx` to a canvas particle system:**

```jsx
// NeuralBackground.jsx — replaces the stub
// Canvas: fixed inset-0, z-0, pointer-events-none
// Particles: 40–80 dots, each with position, velocity, opacity, size
// State-adaptive: particle color = stateData.accentHex, velocity profile = state energy
//   frozen: very slow drift, low opacity (0.04–0.08), larger radius
//   anxious: faster jitter, medium opacity (0.06–0.12), smaller radius
//   flow: slow circular drift, medium opacity (0.05–0.10), medium radius
// Non-immersive: particles render but at 20% opacity and slower movement
// Breath sync: optional — particle speed scales with breath phase via prop
```

Props interface:
```jsx
<NeuralBackground
  isImmersive={isImmersive}
  selectedState={selectedState}     // new prop — already passed in App.jsx render
  breathPhase={breathPhase}         // optional new prop from useBreathTimer
/>
```

`selectedState` is already available in App.jsx at the point `NeuralBackground` is rendered. Adding it as a prop is a one-line change.

**Existing grain overlays (keep and extend):**

`StateSelector` and `AudioPlayer` already use an SVG-based fractal noise grain pattern (`GRAIN_BG`). This pattern is good and should be:
1. Extracted to a shared constant (`src/utils/grain.js` — a single exported string)
2. Applied consistently to any new panels that need depth

**Depth layers in immersive mode:**

```
z-0  NeuralBackground (canvas particles — upgraded from stub)
z-[1] ImmersionBackground (radial pulse — existing, keep as-is)
z-10  Main content wrapper (existing)
z-20  BreathingOrb, RegulationDepthMeter (existing)
z-[55] ImmersionContainer overlay (existing)
z-[60] MissionControl (existing)
```

No z-index changes needed — the existing layer ordering already accommodates new atmospheric content at z-0.

---

## Component Map: New vs Modified

### New Components

| Component | Location | Purpose | Dependencies |
|-----------|----------|---------|--------------|
| `WaveformBars` | `src/components/WaveformBars.jsx` | Canvas frequency visualization | `analyserNode` from useAudioEngine |
| `TipRotator` | `src/components/TipRotator.jsx` | Rotating tip display with transition | `useContentRotation` hook |
| `SessionHeatmap` | `src/components/charts/SessionHeatmap.jsx` | 7/30-day state grid | `chartData.js` transform |
| `ActivationArc` | `src/components/charts/ActivationArc.jsx` | SVG arc showing activation shift | Session data props |
| `StateFlowLine` | `src/components/charts/StateFlowLine.jsx` | Multi-line sparkline canvas | `chartData.js` transform |
| `ProtocolEffectBar` | `src/components/charts/ProtocolEffectBar.jsx` | Protocol effectiveness bars | Session data props |

### Modified Components

| Component | Modification Type | What Changes | Risk |
|-----------|------------------|--------------|------|
| `NeuralBackground` | Major — rewrite stub | Add canvas particle system, accept `selectedState` prop | Low — currently a stub, no consumers depend on its internals |
| `LissajousVisualizer` | Additive — new optional prop | `analyserNode` prop, FFT-modulated rendering | Low — prop is optional, fallback to current behavior |
| `AudioPlayer` | Additive — expose analyser | Pass `analyserNode` from `useAudioEngine` to Lissajous | Low — no interface change to AudioPlayer's own props |
| `WeeklyIntelligenceCard` | Moderate — add visual charts | Embed `SessionHeatmap` + `ActivationArc` | Low — charts are new JSX below existing content |
| `VagusLogSidebar` | Minor — swap sparkline | Replace div bars with `StateFlowLine` | Low — same data, new renderer |
| `ImmersionContainer` | Additive — add WaveformBars in stabilize phase | Add `<WaveformBars>` behind orb | Low — additive JSX inside existing phase render |
| `BreathingOrb` | Minor — consume rotation hook | Read breath cues from `useContentRotation` instead of local constant | Low — same data shape |
| `StealthReset` | Minor — consume rotation hook | Read `protocolVariantIndex` from hook | Low — same step rendering logic |
| `TaskFilter` | Minor — consume rotation hook | Read `taskGroupIndex` from hook | Low — same task rendering logic |

### Modified Hooks

| Hook | Modification Type | What Changes |
|------|------------------|--------------|
| `useAudioEngine` | Additive | Create `AnalyserNode` in init, expose via return value |
| `useAmbientEngine` | Additive | Create `AnalyserNode` in init, expose via return value |

### New Hooks / Utilities

| File | Purpose |
|------|---------|
| `src/hooks/useContentRotation.js` | Daily-stable rotation indices, localStorage persistence |
| `src/lib/chartData.js` | Pure functions transforming session arrays to chart data shapes |
| `src/utils/grain.js` | Shared SVG grain texture string (extracted from StateSelector, AudioPlayer) |

---

## Data Flow Changes

### Current data flow (simplified):
```
App.jsx
  selectedState → stateData = STATES[selectedState]
  sessions (useSessionLog)
  ambientEngine (useAmbientEngine)

  → StateSelector (selected, onSelect)
  → StealthReset (stateData)
  → TaskFilter (stateData)
  → AudioPlayer (stateData)
  → ImmersionContainer (open, stateData, ambientEngine)
  → WeeklyIntelligenceCard (sessions)
  → VagusLogSidebar (sessions, isImmersive)
```

### After refresh (additions only):
```
App.jsx
  [no new state in App.jsx]

  → NeuralBackground (isImmersive, selectedState) ← selectedState is new prop

Each component that needs rotation:
  useContentRotation() ← consumed independently, no prop drilling

AudioPlayer:
  useAudioEngine returns { ..existing.., analyserNode }
  analyserNode passed down to LissajousVisualizer + WaveformBars

ImmersionContainer:
  ambientEngine.analyserNode (new) passed to WaveformBars

WeeklyIntelligenceCard:
  receives sessions prop (unchanged)
  internally calls chartData transforms
  renders SessionHeatmap, ActivationArc

VagusLogSidebar:
  sessions prop unchanged
  internally computes StateFlowLine data via chartData.js
```

**Key principle: No new state surfaces in App.jsx.** Each feature self-contains its own state via hooks or component-local state. The existing `selectedState` + `sessions` + `ambientEngine` trifecta in App.jsx stays the source of truth.

---

## Build Order (Dependency-Driven)

### Phase 1: Foundations (no consumer dependencies)

These have no dependencies on other new work and unblock everything else.

1. **`src/utils/grain.js`** — Extract grain constant (2 min). Unblocks: any component using grain.
2. **`src/lib/chartData.js`** — Pure data transforms (no React) for all chart components.
3. **`src/hooks/useContentRotation.js`** — Rotation engine. No component changes yet.
4. **`useAudioEngine` + `useAmbientEngine` analyser nodes** — Additive changes to both hooks. Unblocks: all audio visualization.

### Phase 2: Content Variety (depends on Phase 1)

5. **Enrich `stateData.js`** — Add `breathCues`, `protocolVariants`, `taskGroups` to each state. No component changes yet; rotation hook reads these.
6. **Wire `useContentRotation` into `BreathingOrb`** — Replace local `GROUNDING_CUES` constant with hook. (Smallest first.)
7. **Wire `useContentRotation` into `ImmersionContainer`** — Replace `GROUNDING_PHRASES` with hook-provided values.
8. **Wire into `StealthReset`** — Protocol variant selection.
9. **Wire into `TaskFilter`** — Task group selection.
10. **New `TipRotator` component** — Anywhere tips are displayed; integrates with hook.

### Phase 3: Audio Visualization (depends on Phase 1)

11. **`WaveformBars.jsx`** — Build standalone with static fallback mode first.
12. **Upgrade `LissajousVisualizer`** — Add optional `analyserNode` prop with existing-behavior fallback.
13. **Wire analyser into `AudioPlayer`** — Pass `analyserNode` from hook to Lissajous.
14. **Add `WaveformBars` to `ImmersionContainer` stabilize phase** — Uses ambient analyser.

### Phase 4: Atmospheric Effects (depends on Phase 1; partially depends on Phase 2)

15. **Rewrite `NeuralBackground`** — Canvas particle system. No consumer API changes (same props); `selectedState` prop addition is additive.
16. **Tune per-state particle profiles** — Requires stateData enrichment from Phase 2 to be stable.

### Phase 5: Data Visualization (depends on Phase 1)

17. **`SessionHeatmap.jsx`** — SVG, no other dependencies.
18. **`ActivationArc.jsx`** — SVG, no other dependencies.
19. **`StateFlowLine.jsx`** — Canvas, requires `chartData.js`.
20. **`ProtocolEffectBar.jsx`** — SVG, requires `chartData.js`.
21. **Integrate into `WeeklyIntelligenceCard`** — Embed charts below existing content.
22. **Swap sparkline in `VagusLogSidebar`** — Replace div bars with `StateFlowLine`.

### Phase 6: Animation Layer Polish (depends on Phases 2–5 being stable)

23. **CSS animation additions to `index.css`** — `shimmer-enter`, `content-fade`, `state-pulse-enter` for content variety transitions.
24. **Framer Motion on `StateSelector` cards** — Add `AnimatePresence` for polyvagal note entrance; add `layoutId` for active card expansion.
25. **Tab content transitions** — Wrap each tab's content in `AnimatePresence`.

---

## Integration Risks and Mitigations

### Risk 1: Framer Motion + ImmersionContainer phase transitions

`ImmersionContainer` currently uses conditional renders (`if (phase === 'welcome') return wrapper(...)`) without `AnimatePresence`. Wrapping these in `AnimatePresence` requires restructuring to a single return with conditional children. This is a moderate refactor.

**Mitigation:** Leave `ImmersionContainer` phase transitions as CSS `fadeIn` animations (already working). Only add Framer Motion to non-time-critical surfaces (StateSelector, tab bar).

### Risk 2: Multiple `useContentRotation` calls diverging

If `StealthReset`, `TaskFilter`, and `BreathingOrb` each call `useContentRotation` independently, they could read stale localStorage in the same render cycle.

**Mitigation:** `useContentRotation` reads from localStorage once on mount and uses React state internally. All consumers in the same React tree will re-render together when any index changes. Alternatively, lift the hook to App.jsx and pass indices as props — but the self-contained approach is cleaner and avoids App.jsx prop-drilling.

### Risk 3: Canvas analyser node timing

If `analyserNode` is created after the oscillators start (during `play()`), early frames will show empty data. The `getByteFrequencyData` will return all zeros until the audio context processes a buffer.

**Mitigation:** Create the `AnalyserNode` during `AudioContext` initialization in `useAudioEngine`, not during `play()`. Connect it as a tap (insert between oscillator chain and destination but also connect destination directly). This way it exists before any audio plays.

### Risk 4: Bundle size from chart components

Custom SVG/canvas chart components add ~0–5kB each. Five chart components = ~25kB total. This is well within the 700kB ceiling.

**Mitigation:** No mitigation needed. Monitor with `npm run build` after each phase.

### Risk 5: Theme compatibility in canvas elements

Canvas 2D API does not read CSS custom properties. `getComputedStyle(element).getPropertyValue('--accent-flow')` works but is called each frame, which is expensive.

**Mitigation:** Read theme colors once at component mount or when `selectedState` changes, not per-frame. Pass `accentHex` as a prop to all canvas components (this is already the pattern in `LissajousVisualizer` — it receives `color` as a prop).

---

## Patterns to Follow

### Pattern 1: Additive Props, Fallback Behavior

Every modification to an existing component must have a defined fallback when new props are absent.

```jsx
// LissajousVisualizer: new analyserNode prop is optional
// If absent: existing math-only animation (no regression)
// If present: FFT-modulated overlay

export default function LissajousVisualizer({ playing, carrierHz, beatHz, color, analyserNode = null }) {
  // analyserNode presence gates FFT branch only
}
```

### Pattern 2: Chart Components Are Dumb Presenters

Chart components receive pre-computed data. They do not import hooks or call `localStorage`. This keeps them testable and reusable.

```jsx
// SessionHeatmap receives cells[], not sessions[]
// chartData.js does the transform
function SessionHeatmap({ cells, accentColors }) { /* SVG only */ }
```

### Pattern 3: Daily-Stable Content Rotation

Content rotation must feel intentional, not random. A seed from `new Date().toISOString().slice(0, 10)` ensures users see the same tip all day (not a new one every refresh) but a different tip tomorrow.

```js
// useContentRotation.js
const today = new Date().toISOString().slice(0, 10)
const stored = JSON.parse(localStorage.getItem('vaga-rotation-' + today) || '{}')
// Indices are set once per day and persisted
```

### Pattern 4: Canvas Particles Using Class Instances

The `NeuralBackground` particle system should use an ES6 `Particle` class and a `particles` array managed inside the `useEffect` closure — not React state. React state for 60fps animations causes excessive re-renders.

```js
// Inside useEffect in NeuralBackground:
class Particle { constructor(W, H, config) { ... } update() { ... } draw(ctx) { ... } }
const particles = Array.from({ length: 60 }, () => new Particle(W, H, config))
// No setState — all mutation is internal to the rAF closure
```

### Pattern 5: Atmosphere Scales With State

All atmospheric intensity maps to the nervous system model:

| State | Particles | Opacity | Speed | Orb bloom | Background pulse |
|-------|-----------|---------|-------|-----------|-----------------|
| frozen | 40, large, slow | 0.04–0.06 | 0.2px/frame | Slow, 6s cycle | Inhale emphasis |
| anxious | 60, small, jitter | 0.06–0.10 | 0.5px/frame randomized | Fast, 3s cycle | Exhale emphasis (calming) |
| flow | 50, medium, drift | 0.05–0.08 | 0.3px/frame circular | Gentle, 5s cycle | Minimal |

This is already established by `ImmersionBackground.jsx` — extend the same design principle to `NeuralBackground`.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Lifting Animation State to App.jsx

**What goes wrong:** Adding `breathPhase`, `particleCount`, `tipIndex` etc. to App.jsx state creates unnecessary re-renders of the entire component tree.

**Instead:** Each animated/rotating component manages its own state via local state or dedicated hooks. Only the core business state (`selectedState`, `sessions`, `ambientEngine`) lives in App.jsx.

### Anti-Pattern 2: Imperative DOM Mutation Outside Canvas

**What goes wrong:** Directly mutating DOM element styles with `element.style.transform` in a rAF loop for React-rendered elements breaks React's reconciliation and causes subtle bugs.

**Instead:** For rAF-driven animations, either use canvas (completely outside React's DOM) or use Framer Motion's `useMotionValue` + `useTransform` which are designed for this.

### Anti-Pattern 3: One Large Chart Component

**What goes wrong:** A monolithic `DataVizPanel` that renders all chart types becomes hard to reuse, loads all chart logic even when only one is shown, and is hard to test.

**Instead:** Four single-purpose chart components in `src/components/charts/`. Each renders one type of visualization and receives only the data it needs.

### Anti-Pattern 4: Re-Reading CSS Vars per Frame

**What goes wrong:** Calling `getComputedStyle` in every rAF frame to read CSS custom properties causes layout thrashing at 60fps.

**Instead:** Read CSS vars once on mount or when `selectedState` changes. Pass as a prop or capture in a ref. Already demonstrated correctly in `LissajousVisualizer` (receives `color` as a prop).

### Anti-Pattern 5: Content Rotation via `Math.random()`

**What goes wrong:** A random tip each render means users see a different tip on every page reload, which feels random and inconsistent. It also makes the app feel uncontrolled.

**Instead:** Daily-stable rotation via date-seeded indices in `useContentRotation`. The tip changes at midnight, not at page load.

---

## Sources

- Codebase direct analysis (March 2026):
  - `regulation-station/package.json` — confirmed Framer Motion 12.34.5, React 19, Vite 7
  - `src/components/BreathingOrb.jsx` — Framer Motion usage pattern
  - `src/components/ImmersionBackground.jsx` — rAF + inline style pattern for breath sync
  - `src/components/LissajousVisualizer.jsx` — canvas animation pattern
  - `src/components/NeuralBackground.jsx` — stub confirmed
  - `src/hooks/useAmbientEngine.js` — Web Audio API patterns
  - `src/index.css` — existing CSS animation inventory
  - `src/data/stateData.js` — content data shape
  - `src/hooks/useSessionLog.js` — session data shape

- Confidence levels:
  - Animation architecture: HIGH (code evidence; Framer Motion already installed and used)
  - Content rotation hook: HIGH (straightforward localStorage pattern; no library needed)
  - Data viz approach: HIGH (bundle constraint is clear; canvas/SVG pattern already proven)
  - Audio analyser integration: MEDIUM (Web Audio API AnalyserNode is well-specified; integration into existing hooks adds complexity)
  - Atmospheric particle system: MEDIUM (pattern is well-understood; per-state tuning requires iteration)
