# Phase 1: Foundations - Research

**Researched:** 2026-03-10
**Domain:** React hooks, Web Audio API (AnalyserNode), pure transform utilities, date-stable content rotation, grain texture extraction
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Content rotation logic**
- Midnight local time is the rotation boundary — content advances each calendar day
- Hook returns a date-stable index that does not change within a session
- No re-roll / manual override in the hook API (strictly one selection per day)

**Chart data shapes**
- Pure transform functions that output plain data objects (`{x, y, label, color}`)
- Support two time windows: 7-day and 30-day
- Input is the existing session array from `useSessionLog.js`
- No SVG path generation — chart rendering is Phase 5's responsibility

**Grain texture**
- Extract the existing inline `GRAIN_BG` SVG from `AudioPlayer.jsx` (fractalNoise, baseFrequency 0.78, opacity 0.09)
- File location: `src/utils/grain.js`
- Export both the raw data URI constant and a `grainOverlayStyle` object (`{backgroundImage, backgroundSize, opacity, mixBlendMode}`)
- Fixed sensible defaults; consumers can spread and override individual properties
- Pure utility — no React component export

**AnalyserNode wiring**
- Tap point: after master gain node (reflects volume — visualizations match what users hear)
- One AnalyserNode per engine — `useAudioEngine` and `useAmbientEngine` each create and expose their own
- FFT size: 2048 (1024 frequency bins, ~21 Hz resolution at 44.1kHz)
- Created eagerly as part of the audio graph build — always available when audio is playing
- Return value: `analyserNode` (non-null when active, null when inactive)
- No cross-engine coupling — each analyser is independent

### Claude's Discretion

- Content rotation: deterministic (date hash) vs random-but-pinned approach
- Content rotation: independent rotation per content category vs unified daily seed
- Chart data: which specific transform functions to create (guided by DVIZ-01 and DVIZ-02 requirements)
- Chart data: whether to include state-segmented series alongside combined data

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

## Summary

Phase 1 creates four shared utilities — none of which depend on each other, and none of which render UI. All four can be built and verified independently. The work is primarily code archaeology (extract existing patterns, formalize their shape) plus two targeted augmentations to existing audio hooks.

The highest-risk item is the AnalyserNode insertion: both audio engines are already structured with a `masterGainRef` pattern, and the insertion point is unambiguous (`master.connect(ctx.destination)` becomes `master → analyser → destination`). The `useAmbientEngine` has three start paths (startForest, startOcean, startBinaural) that each build their own `master` GainNode — all three need the same treatment. There is no shared `buildGraph` helper in `useAmbientEngine` (unlike `useAudioEngine`), so the AnalyserNode setup is a one-time initialization pattern, not a repeated helper call.

The content rotation hook and chartData transforms are pure JavaScript with no browser API dependencies, making them the most straightforward deliverables. The grain extraction is a copy-and-formalize operation with zero logic to add.

**Primary recommendation:** Implement in this order: grain.js (5 min, zero risk), useContentRotation (pure JS), chartData.js (pure JS), then AnalyserNode wiring last (requires audio context to verify).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 (existing) | `useState`, `useRef`, `useCallback`, `useMemo` | Already in project |
| Web Audio API | Browser built-in | `AnalyserNode`, `AudioContext` | Already used by both audio engines; no install needed |
| JavaScript `Date` | Browser built-in | Date-stable content index via `toISOString().slice(0,10)` | Same pattern as `useSessionLog` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | — | This phase has zero new dependencies | All utilities use existing browser APIs or pure JS |

**Installation:**
```bash
# No new packages required for Phase 1
```

---

## Architecture Patterns

### Established Project Structure
```
regulation-station/src/
├── hooks/           # useContentRotation.js goes here (matches useSessionLog, useAudioEngine)
├── lib/             # chartData.js goes here (matches tacticalAnalysis.js pattern — pure logic)
├── utils/           # grain.js goes here (matches colors.js — pure constants/helpers)
├── data/            # stateData.js — read by useContentRotation, chartData input comes from sessions
└── components/      # AudioPlayer.jsx — will import from grain.js after extraction
```

### Pattern 1: Date-Stable Daily Index (useContentRotation)

**What:** A React hook that computes a deterministic daily index from today's YYYY-MM-DD string and a pool size. Returns an integer that is stable across re-renders and page refreshes within the same calendar day.

**When to use:** Any content pool (tips, breath cues, protocol variants) where Phase 2 consumers need "today's selection" without user control.

**Recommended approach — deterministic hash over random-but-pinned:**
The `random-but-pinned` approach (generate random, persist to sessionStorage) breaks when sessionStorage is cleared, when the user opens a second tab, or when SSR is involved. A deterministic hash of the date string is simpler, requires no storage, is reproducible, and satisfies the "stable within session" requirement automatically.

```javascript
// Source: pure JS, no library needed
function dailyIndex(dateStr, poolSize) {
  // Simple djb2-style hash over the date string characters
  let hash = 5381
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) + hash) ^ dateStr.charCodeAt(i)
    hash = hash >>> 0 // keep 32-bit unsigned
  }
  return hash % poolSize
}

export function useContentRotation(pool) {
  // pool: array of content items
  const dateStr = new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'
  return useMemo(() => {
    if (!pool || pool.length === 0) return { item: null, index: 0 }
    const index = dailyIndex(dateStr, pool.length)
    return { item: pool[index], index }
  }, [dateStr, pool])
}
```

**Independent rotation per content category (recommended over unified seed):**
Because different content pools (tips, breath cues, protocols) have different lengths (e.g., 8 tips, 3 protocol variants, 5 cues), a unified daily seed would need a secondary modulo step anyway. Independent rotation per category is equivalent in determinism, simpler in implementation, and keeps the hook API to a single `pool` argument — each consumer calls `useContentRotation` with its own pool.

**YYYY-MM-DD stability note:** `new Date().toISOString()` returns UTC time. At midnight local time in UTC-5 through UTC+5 this matches local calendar date, but at extreme UTC offsets (UTC+12 or UTC-12) the UTC date lags or leads local date by a day. The project decision is "midnight local time" as the boundary. Use `new Date().toLocaleDateString('en-CA')` (returns 'YYYY-MM-DD' in local timezone, en-CA locale is the ISO-format locale) to avoid the UTC offset problem.

```javascript
// Correct: local calendar date
const dateStr = new Date().toLocaleDateString('en-CA') // 'YYYY-MM-DD' local time
```

### Pattern 2: Pure Chart Transform Functions (chartData.js)

**What:** Stateless functions that accept a session array and return typed data objects ready for SVG rendering. Lives in `src/lib/` alongside `tacticalAnalysis.js` (same pattern: pure logic, no imports, no React).

**When to use:** Phase 5 chart components import these directly. `PostResetCheckin` will use the before/after comparison function (DVIZ-01). VagusLogSidebar trajectory chart will use the shift-over-time function (DVIZ-02).

**Shapes to export (guided by DVIZ-01 and DVIZ-02, consistent with CONTEXT.md):**

```javascript
// src/lib/chartData.js

// For DVIZ-01: before/after activation comparison (single session or session pair)
// Returns two bar data points
export function getActivationComparison(session) {
  // session: { activationBefore, activationAfter, state, accentHex }
  // Returns: [{ x: 'Before', y: number, color: string }, { x: 'After', y: number, color: string }]
}

// For DVIZ-02: shift trajectory over time (regulation effectiveness trend)
// Returns array of time-series points
export function getShiftTrajectory(sessions, window = 7) {
  // window: 7 or 30 (days)
  // Returns: [{ x: 'YYYY-MM-DD', y: number, label: string, color: string }]
  // y = avgShift for that day (null if no sessions that day)
}

// Supporting: daily session count by state (useful for state segmentation)
export function getDailyStateSeries(sessions, window = 7) {
  // Returns: { frozen: [...points], anxious: [...points], flow: [...points] }
  // Each point: { x: 'YYYY-MM-DD', y: number, color: string }
}
```

**State color map for chart points:** Use `ACCENT_HEX` from `src/utils/colors.js` — it already defines `{ red: '#c4604a', amber: '#c8a040', green: '#52b87e' }`. Map: `frozen → red → #c4604a`, `anxious → amber → #c8a040`, `flow → green → #52b87e`.

**Window calculation pattern (mirrors existing getDailyStats):**
```javascript
function getDateRange(windowDays) {
  return Array.from({ length: windowDays }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (windowDays - 1 - i))
    return d.toISOString().slice(0, 10)
  })
}
```

### Pattern 3: AnalyserNode Wiring

**What:** Insert a single `AnalyserNode` into each audio engine's signal chain after the master gain node. The hook exposes `analyserNode` (the AnalyserNode instance, or null when audio is inactive).

**useAudioEngine — single buildGraph function:**
The existing chain ends with `master.connect(ctx.destination)`. Replace with:
```javascript
const analyser = ctx.createAnalyser()
analyser.fftSize = 2048
master.connect(analyser)
analyser.connect(ctx.destination)
analyserRef.current = analyser
```
Add `analyserRef = useRef(null)` to the hook state. Set `analyserRef.current = null` in `teardown`. Return `analyserNode: analyserRef.current` in the return object alongside `playing, play, pause, volume, setVolume, supported`.

**useAmbientEngine — three start methods:**
Each of `startForest`, `startOcean`, `startBinaural` creates its own `master` GainNode and ends with `master.connect(ctx.destination)`. All three need the same insertion. Recommend extracting a helper called at the end of each start method:

```javascript
// Helper: insert analyser after master, store ref, connect to destination
function connectWithAnalyser(ctx, master, analyserRef) {
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 2048
  master.connect(analyser)
  analyser.connect(ctx.destination)
  analyserRef.current = analyser
}
```

This avoids copy-pasting 4 lines into 3 methods. Set `analyserRef.current = null` in `teardown`. Return `analyserNode: analyserRef.current` alongside existing return values.

**Critical: teardown clears the ref.** When `teardown()` is called, `analyserRef.current = null` must be set so that the returned `analyserNode` value becomes null — satisfying the "null when inactive" contract without requiring extra state.

**State-based return (null vs instance):** Because `analyserRef.current` is a ref value (not React state), the component won't re-render when it changes unless we add a `useState` flag. For Phase 3 consumers (visualizers), they will read `analyserNode` when the component mounts or when `playing` changes — so `playing` can serve as the re-render trigger. **Recommendation:** Return `analyserNode: playing ? analyserRef.current : null` in `useAudioEngine`. For `useAmbientEngine`, return `analyserNode: activeId !== 'silence' ? analyserRef.current : null`.

### Pattern 4: Grain Texture Extraction

**What:** Move the `GRAIN_BG` constant out of `AudioPlayer.jsx` and add a pre-composed style object.

**Source constant (exact value from AudioPlayer.jsx line 11):**
```javascript
export const GRAIN_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.09'/%3E%3C/svg%3E")`
```

**Style object (derived from AudioPlayer.jsx usage at lines 109–113):**
```javascript
export const grainOverlayStyle = {
  backgroundImage: GRAIN_BG,
  backgroundSize: '160px 160px',
  opacity: 0.4,
  mixBlendMode: 'overlay',
}
```

**AudioPlayer.jsx update (Phase 1 includes this cleanup):** Replace the inline `GRAIN_BG` constant definition and its usage with an import from `../utils/grain`. The style object spread at lines 109–113 can be replaced with `...grainOverlayStyle` (which matches the existing values exactly).

### Anti-Patterns to Avoid

- **Storing the daily index in localStorage or sessionStorage:** The deterministic hash approach makes storage unnecessary and eliminates cross-tab inconsistency.
- **Creating AnalyserNode outside the audio graph build:** The node must be created after the AudioContext exists (post-user-gesture). Creating it at hook initialization will fail because the AudioContext hasn't been created yet.
- **Connecting AnalyserNode per-oscillator instead of on master:** Frequency bins at the oscillator level would only show one tone, not the full mixed audio. Master-level tap is the correct insertion point, as confirmed by the CONTEXT.md decisions.
- **Exporting a React component from grain.js:** The file is a pure utility. The `aria-hidden` div wrapper is the consumer's responsibility, not the utility's.
- **Using `new Date().toISOString().slice(0,10)` for local midnight boundary:** This returns UTC date. Use `toLocaleDateString('en-CA')` for local calendar date alignment.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Frequency-domain audio data for visualizers | Custom DSP / rolling buffer | `AnalyserNode.getByteFrequencyData()` | Browser-native, no latency, connected to actual output |
| Hash function for date index | MD5/SHA import | Simple djb2 bitwise hash (4 lines) | Overkill; djb2 distributes well over short date strings, no import needed |
| Date-range array generation | moment.js / date-fns | `new Date()` + `setDate()` arithmetic | Pattern already used in `VagusLogSidebar.jsx` getLast5DayStates — just extend it |
| State color lookup | Hardcoded hex in chartData | `ACCENT_HEX` from `src/utils/colors.js` | Already exists, single source of truth |

**Key insight:** Every problem in Phase 1 is already solved by existing browser APIs or existing project patterns. The work is formalization and wiring, not invention.

---

## Common Pitfalls

### Pitfall 1: AnalyserNode Created Before AudioContext
**What goes wrong:** `ctx.createAnalyser()` throws if `ctxRef.current` is null (hook not yet played).
**Why it happens:** Audio context is created lazily on first user gesture (browser autoplay policy).
**How to avoid:** Create AnalyserNode inside `buildGraph(ctx)` (useAudioEngine) or inside each `startX` method (useAmbientEngine), not at hook initialization time.
**Warning signs:** "Cannot read properties of null" on `ctxRef.current.createAnalyser` in the console before first play.

### Pitfall 2: AnalyserNode Not Nulled in Teardown
**What goes wrong:** `analyserNode` remains non-null after audio stops; Phase 3 visualizers attempt `getByteFrequencyData()` on a disconnected node.
**Why it happens:** `teardown()` stops oscillators/sources but does not disconnect the AnalyserNode or clear the ref.
**How to avoid:** Add `analyserRef.current = null` inside the `teardown` callback in both hooks. Also disconnect the old analyser node before creating a new one on `buildGraph` calls (when frequencies change on state switch).
**Warning signs:** Visualizer draws stale/flat data after audio is paused.

### Pitfall 3: useAmbientEngine teardown Clears masterGainRef
**What goes wrong:** The AnalyserNode ref is set to null in `teardown` (correct), but if `teardown` is called mid-start (which it is — every `startX` method calls `teardown()` first), the new analyser hasn't been created yet.
**Why it happens:** `teardown` runs, clears old state, then `connectWithAnalyser` runs and sets the new analyser.
**How to avoid:** This is actually the correct sequence — teardown first, then build. Ensure `analyserRef.current = null` happens in `teardown` and the ref is reassigned in `connectWithAnalyser` after. No special handling needed; just ensure the order is correct.
**Warning signs:** Analyser ref is null immediately after `startForest/startOcean/startBinaural` returns.

### Pitfall 4: chartData Window Edge — Today vs. Yesterday
**What goes wrong:** The 7-day window includes today (a partial day) which skews the trailing average.
**Why it happens:** Generating 7 dates ending on "today" means the last data point may have only 1-2 sessions rather than a full day.
**How to avoid:** This is acceptable behavior — just include today as-is. The VagusLogSidebar's existing `getLast5DayStates` uses the same pattern. Document that the trailing point may be a partial day in the function's JSDoc.
**Warning signs:** Only appears when consumers interpret the data; document the partial-day caveat.

### Pitfall 5: Content Rotation Returns Wrong Type
**What goes wrong:** Hook returns an index when consumers expect an item, or vice versa.
**Why it happens:** Ambiguity in what "rotation" means — an index into a pool, or the item itself.
**How to avoid:** Return both `{ item, index }` from `useContentRotation`. Consumers that need the item use `item`, consumers that need to know which position (e.g., for a "X of Y" indicator) use `index`.
**Warning signs:** Phase 2 consumers calling `pool[useContentRotation(pool)]` instead of `useContentRotation(pool).item`.

---

## Code Examples

Verified patterns from existing project code:

### Existing AnalyserNode tap pattern (Web Audio spec)
```javascript
// Standard Web Audio API insertion — verified against MDN
const analyser = ctx.createAnalyser()
analyser.fftSize = 2048          // 1024 frequency bins
master.connect(analyser)
analyser.connect(ctx.destination) // analyser sits in-line, not branched
```

### Existing date range pattern (from VagusLogSidebar.jsx getLast5DayStates)
```javascript
// Source: regulation-station/src/components/VagusLogSidebar.jsx
const days = Array.from({ length: 5 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (4 - i))
  return d.toISOString().slice(0, 10)
})
```

### Existing transform pattern (from useSessionLog.js getDailyStats)
```javascript
// Source: regulation-station/src/hooks/useSessionLog.js
export function getDailyStats(sessions) {
  const today = new Date().toISOString().slice(0, 10)
  const resets = sessions.filter(s => s.date === today && ...)
  // ...
  return { resetCount, avgShift, flowMinutes }
}
```
`chartData.js` functions follow this exact pattern: pure function, no imports, accepts sessions array, returns plain object.

### Existing hook return pattern
```javascript
// Source: regulation-station/src/hooks/useAudioEngine.js
return { playing, play, pause, volume, setVolume: applyVolume, supported }
// useAudioEngine will add: analyserNode
```

### Grain constant verbatim (to copy into grain.js)
```javascript
// Source: regulation-station/src/components/AudioPlayer.jsx line 11
const GRAIN_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.09'/%3E%3C/svg%3E")`
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Random tip on every render | Date-stable index via daily hash | Phase 1 | Tips persist across page refreshes without storage |
| Inline GRAIN_BG per-component | Shared `src/utils/grain.js` | Phase 1 | Any canvas component can import grain in 1 line |
| Audio engines return no analyser | Both engines expose `analyserNode` | Phase 1 | Phase 3 visualizers can read real FFT data |
| Chart data computed inline in components | Pure transforms in `src/lib/chartData.js` | Phase 1 | Phase 5 chart components have no data-logic burden |

**Deprecated/outdated:**
- Inline `GRAIN_BG` in AudioPlayer.jsx: replaced by import from `src/utils/grain.js` as part of Phase 1 cleanup task

---

## Open Questions

1. **useContentRotation: should the pool be `useMemo`-stable or can it accept an inline array literal?**
   - What we know: If the consumer passes `useContentRotation(stateData.tips)` and `stateData` is a stable reference, the pool is stable. If they pass an inline `[...]`, the `useMemo` dependency triggers every render.
   - What's unclear: Phase 2 consumers may pass inline arrays before the pool is structured.
   - Recommendation: Accept pool as a parameter, document that callers should pass stable references (from stateData.js constants, not inline literals). Add a brief JSDoc note.

2. **chartData.js: should `getShiftTrajectory` return null for days with no data, or omit those points?**
   - What we know: SVG line charts need consistent x-axis points; bar charts work fine with gaps.
   - What's unclear: Phase 5 chart type hasn't been decided yet.
   - Recommendation: Return null for `y` on empty days (`{ x: 'YYYY-MM-DD', y: null, label: '', color: '' }`). This lets Phase 5 choose to either skip nulls (for line continuity) or render empty bars. Null is the safer choice.

---

## Validation Architecture

> `nyquist_validation` key absent from `.planning/config.json` — treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (Vite-native) or manual browser smoke test |
| Config file | None detected — all four deliverables are pure JS or simple React hooks |
| Quick run command | `npm run dev` + manual console verification |
| Full suite command | N/A — no test runner configured in this project |

**Note:** No `vitest.config.*`, `jest.config.*`, `*.test.*`, or `*.spec.*` files exist in the project. The project currently has no automated test runner. Given that three of four deliverables are pure JavaScript functions (zero browser API, zero React), the most practical validation approach is:

1. **Pure functions** (grain.js, chartData.js, useContentRotation core logic): Verify via a quick `node` script in the console or a manually-run test file.
2. **Audio hook changes**: Verify via browser DevTools — confirm `analyserNode` is non-null in playing state and null after pause.

### Phase Requirements to Test Map

Phase 1 has no formal requirement IDs. Validation maps to success criteria:

| Success Criterion | Behavior | Test Type | How to Verify |
|-------------------|----------|-----------|---------------|
| SC-1: useContentRotation date-stable index | Same pool + same date = same index; different date = different index | Unit (pure fn) | Call `dailyIndex('2026-03-10', 8)` twice → same result; call with `'2026-03-11'` → different result |
| SC-2: chartData.js pure transforms | Input session array → typed data objects, no UI deps | Unit (pure fn) | Import and call with mock sessions, assert shape `{x, y, label, color}` |
| SC-3: analyserNode non-null when playing | `analyserNode` is an AnalyserNode instance after play() | Smoke (browser) | Log `analyserNode` to console after AudioPlayer play button click |
| SC-4: analyserNode null when inactive | `analyserNode` is null before play and after pause | Smoke (browser) | Log `analyserNode` before play and after pause |
| SC-5: grain.js exports correct values | `GRAIN_BG` is the exact data URI; `grainOverlayStyle` has correct keys | Unit (pure fn) | Import and assert values match AudioPlayer.jsx source |

### Sampling Rate
- **Per task:** Manual browser smoke test (open app, play audio, log `analyserNode`)
- **Per wave:** Verify build succeeds (`npm run build`) and lint is clean (`npm run lint`)
- **Phase gate:** All success criteria verified before marking phase complete

### Wave 0 Gaps
- [ ] No automated test runner exists — if automated testing is desired, `npm install -D vitest` and a `vitest.config.js` would be needed
- [ ] Consider a `scripts/verify-phase1.mjs` node script for pure-function validation of chartData.js and useContentRotation

*(If automated tests are not added, manual smoke-test steps above are sufficient for this phase.)*

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `regulation-station/src/hooks/useAudioEngine.js` — full audio graph structure, masterGainRef pattern, teardown/buildGraph lifecycle
- Direct code inspection: `regulation-station/src/hooks/useAmbientEngine.js` — three start methods, masterGainRef pattern, teardown callback
- Direct code inspection: `regulation-station/src/components/AudioPlayer.jsx` — GRAIN_BG constant (exact value), grainOverlayStyle usage pattern
- Direct code inspection: `regulation-station/src/hooks/useSessionLog.js` — session data shape (all fields), getDailyStats transform pattern
- Direct code inspection: `regulation-station/src/components/VagusLogSidebar.jsx` — date range generation pattern (`getLast5DayStates`)
- Direct code inspection: `regulation-station/src/utils/colors.js` — ACCENT_HEX map for chart color lookup
- Direct code inspection: `regulation-station/src/lib/tacticalAnalysis.js` — pure lib function file structure pattern
- MDN Web Audio API: AnalyserNode, fftSize, getByteFrequencyData — browser built-in, no version concerns
- `.planning/phases/01-foundations/01-CONTEXT.md` — locked decisions and discretion areas

### Secondary (MEDIUM confidence)
- `toLocaleDateString('en-CA')` for YYYY-MM-DD local date: standard JavaScript behavior, en-CA locale reliably returns ISO-format date in all major browsers

### Tertiary (LOW confidence)
- djb2 hash distribution quality for 10-character date strings: adequate in practice for small pool sizes (3–20 items), but not formally verified

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all APIs already in use in this project
- Architecture: HIGH — all patterns extracted directly from existing code
- AnalyserNode insertion: HIGH — Web Audio spec is stable; insertion point is unambiguous
- Content rotation hash approach: MEDIUM — djb2 is well-established but pool distribution not formally tested for date strings
- Pitfalls: HIGH — derived from direct code reading of the specific hooks being modified

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable domain — Web Audio API, React hooks, pure JS)
