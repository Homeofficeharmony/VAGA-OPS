# Phase 5: Data Visualization - Research

**Researched:** 2026-03-11
**Domain:** Native SVG charting in React, before/after comparison UI, trend line visualization
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DVIZ-01 | User sees a visual before/after activation comparison in the post-reset check-in | `getActivationComparison()` in `src/lib/chartData.js` provides the data shape. `PostResetCheckin` needs a new visual layer that renders when both activation values are present. |
| DVIZ-02 | User can view a shift trajectory chart showing regulation effectiveness over time | `getShiftTrajectory()` in `src/lib/chartData.js` provides 7 or 30 date-keyed points. A new `ShiftTrajectoryChart` component in the Insights tab consumes this. |
</phase_requirements>

---

## Summary

Phase 5 is primarily a UI rendering problem, not a data problem. Phase 1 already delivered all the data infrastructure: `src/lib/chartData.js` exports `getActivationComparison(session)` and `getShiftTrajectory(sessions, window)` as pure transform functions ready for consumption. The session schema (`activationBefore`, `activationAfter`, `activationDelta`, `shift`) is fully wired through `useSessionLog.js`, `PostResetCheckin.jsx`, `StealthReset.jsx`, and `PanicReset.jsx`. No new hooks, no new data transforms, no new localStorage keys.

The work is two isolated UI components: (1) a before/after visual widget inside `PostResetCheckin` that shows up when `activationBefore` and `activationAfter` are both present, and (2) a `ShiftTrajectoryChart` component placed in the Insights tab (already home to `DailySummary`, `WeeklyConsistency`, `WeeklyIntelligenceCard`). Both are native SVG — the roadmap decision banning chart libraries is firm and the 44kB bundle headroom is exhausted. The bar chart and line chart patterns needed here are well within what hand-written SVG handles cleanly.

The key design constraint is graceful degradation. New users will have no activation data for days/weeks. Both components must render a meaningful empty state rather than blank boxes. Null-gap handling in `getShiftTrajectory` (days where `y: null`) requires a deliberate render decision: skip the gap in the polyline or draw a dashed connector — the data layer leaves this to the renderer (Phase 5's job).

**Primary recommendation:** Two new components (`ActivationComparisonChart` inside `PostResetCheckin` and `ShiftTrajectoryChart` in the Insights tab), both driven by existing `chartData.js` exports, both pure native SVG with CSS-var theming and `accentHex` coloring.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.x | Component rendering | Already in project |
| Native SVG | Browser built-in | Chart rendering | Roadmap decision: no chart library permitted |
| CSS custom properties | Browser built-in | Theme-reactive colors | Established pattern (`--bg-panel`, `--border`, `--text-primary`) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `src/lib/chartData.js` | Phase 1 artifact | Data transforms | Import `getActivationComparison`, `getShiftTrajectory` — do NOT re-derive data inline |
| `src/utils/colors.js` | Phase 1 artifact | `ACCENT_HEX` map | Import for state-color look-up in chart fills |
| `src/utils/grain.js` | Phase 1 artifact | Grain overlay style | Optional texture on chart panels, consistent with app aesthetic |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native SVG | Recharts / Chart.js / Visx | +20–80kB bundle; roadmap explicitly prohibits |
| Native SVG | CSS bar charts (div height %) | Easier but limited: no polyline, no proper coordinate system |
| SVG polyline | SVG path (cubic bezier) | Smoother curves but far more math; polyline is sufficient for 7–30 points |

**Installation:** No new packages.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── chartData.js         # Already exists — Phase 1 output, do not modify
├── components/
│   ├── PostResetCheckin.jsx  # Modify: add ActivationComparisonChart inline or import
│   └── ShiftTrajectoryChart.jsx  # New component — shift trend for Insights tab
```

### Pattern 1: Inline SVG Bar Chart (DVIZ-01)
**What:** Two vertical bars side-by-side showing `activationBefore` and `activationAfter` on a 1–10 scale. The "after" bar is colored with `accentHex`; the "before" bar is muted (gray or 40% opacity accent). A delta indicator (arrow + number) sits above or between the bars.

**When to use:** Rendered inside `PostResetCheckin` only when `getActivationComparison(session)` returns a 2-item array (i.e., both values non-null). If the array is empty, render nothing (current text-only layout remains).

**Example:**
```jsx
// Source: native SVG — no external library
function ActivationBars({ points, accentHex }) {
  const MAX = 10
  const BAR_W = 28
  const HEIGHT = 60
  return (
    <svg width="80" height={HEIGHT + 20} aria-label="activation comparison">
      {points.map((pt, i) => {
        const barH = (pt.y / MAX) * HEIGHT
        const x = i * (BAR_W + 8)
        const isBefore = i === 0
        return (
          <g key={pt.x} transform={`translate(${x}, 0)`}>
            <rect
              x={0} y={HEIGHT - barH} width={BAR_W} height={barH}
              rx={4}
              fill={isBefore ? accentHex + '40' : accentHex}
            />
            <text
              x={BAR_W / 2} y={HEIGHT + 14}
              textAnchor="middle"
              fontSize={9}
              fill={accentHex + 'aa'}
              fontFamily="JetBrains Mono, monospace"
            >
              {pt.x}
            </text>
            <text
              x={BAR_W / 2} y={HEIGHT - barH - 4}
              textAnchor="middle"
              fontSize={10}
              fontWeight="bold"
              fill={accentHex}
              fontFamily="JetBrains Mono, monospace"
            >
              {pt.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
```

### Pattern 2: SVG Polyline Trend Chart (DVIZ-02)
**What:** A line chart plotting average daily shift over 7 days (default). X-axis = dates (abbreviated day labels), Y-axis = shift value (-1 to 2 range based on existing shift data). Null gaps are skipped in the polyline — no interpolation. Points with data get a small circle marker.

**When to use:** Rendered in the Insights tab as `<ShiftTrajectoryChart sessions={sessions} />`. Always visible once sessions exist; empty state shown otherwise.

**Coordinate math:**
```js
// Source: native SVG pattern
const W = 280, H = 80
const PAD = { left: 20, right: 8, top: 10, bottom: 20 }
const innerW = W - PAD.left - PAD.right
const innerH = H - PAD.top - PAD.bottom

// Shift range: -1 (worse) to 2 (much better)
const Y_MIN = -1, Y_MAX = 2
const xScale = (i, total) => PAD.left + (i / (total - 1)) * innerW
const yScale = (v) => PAD.top + innerH - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * innerH
```

**Null gap handling:** Build the polyline points string by iterating the data array, skipping `null` y-values. Consecutive non-null segments become separate `<polyline>` elements.

**Example structure:**
```jsx
// Source: native SVG — no external library
function ShiftTrajectoryChart({ sessions }) {
  const points = getShiftTrajectory(sessions, 7)
  const hasData = points.some(p => p.y !== null)

  if (!hasData) {
    return <EmptyChartState />
  }
  // Build segments (skip nulls), render polyline(s) + dots + x-axis labels
}
```

### Pattern 3: Empty State Design
**What:** When no sessions have both activation values (DVIZ-01) or no shift data exists (DVIZ-02), render a legible placeholder rather than a blank space.

**DVIZ-01 empty state:** Simply don't render the chart widget — `PostResetCheckin` continues to show the current text-only layout. The chart only appears when `getActivationComparison` returns data.

**DVIZ-02 empty state:** Show the chart container outline with a centered message: "Complete a reset to begin tracking shifts." Styled with `font-mono text-[9px] tracking-widest uppercase` and `color: var(--text-muted)` — matching `DailySummary` empty state pattern.

### Anti-Patterns to Avoid
- **Deriving chart data inline in component render:** Always import from `chartData.js`. The transforms handle null safety, date window generation, and color assignment.
- **Hardcoding hex values in chart SVG fills:** Use `accentHex` prop (state-reactive) or `var(--text-muted)` (theme-reactive). Do not hardcode `#52b87e` in SVG attributes.
- **Reading `analyserRef.current` during render:** Not relevant here (no audio), but established project pattern: ref access belongs in effects and RAF callbacks only.
- **Controlling SVG dimensions in Tailwind only:** Tailwind `w-` classes do not resize SVG `width`/`height` attributes. Set explicit `width`/`height` SVG attributes, then use `className="w-full"` with `viewBox` for responsive scaling.
- **Showing DVIZ-01 when `activationBefore` is null:** `StealthReset` captures `activationBefore` only if the user answered the pre-reset question (it may be null). `ImmersionContainer` calls `logSession` with `activationBefore: null`. Chart must gracefully handle this — `getActivationComparison` already returns `[]` in this case.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date window generation | Custom array of dates | `getDateRange` inside `chartData.js` (used by all 3 exports) | Already exists, tested, handles DST-safe `.toISOString().slice(0,10)` pattern |
| Activation before/after data | Re-derive from sessions | `getActivationComparison(session)` | Already handles null guard, color mapping, label format |
| Shift trajectory data | Filter sessions inline | `getShiftTrajectory(sessions, 7)` | Already handles daily averaging, null gaps, date window |
| State color mapping | `const COLOR = { frozen: '#c4604a' }` | `ACCENT_HEX` from `src/utils/colors.js` | Single source of truth; prevents drift |
| Smooth bezier curves | Custom cubic bezier path math | Simple `<polyline>` | 7-30 data points don't need smoothing; polyline is readable and far simpler |

**Key insight:** Phase 1 built the entire data layer specifically for Phase 5. The only work left is rendering. Resist the urge to re-derive anything from `sessions` directly inside chart components.

---

## Common Pitfalls

### Pitfall 1: activationBefore Is Frequently Null
**What goes wrong:** Developer renders `ActivationComparisonChart` unconditionally and sees empty/broken UI for most users.
**Why it happens:** `activationBefore` is only captured when `StealthReset` includes a pre-session activation question. `ImmersionContainer` and `PanicReset` currently pass `activationBefore: null` to `logSession`. Most existing sessions will have null values.
**How to avoid:** Gate the entire chart on `getActivationComparison(session).length > 0`. Only the most recent session with both values can be shown — PostResetCheckin receives the just-completed session data via `checkinPending` in App.jsx; show the chart only then.
**Warning signs:** Chart renders as two zero-height bars or throws a render error on null arithmetic.

### Pitfall 2: SVG Coordinate System vs CSS Box Model
**What goes wrong:** Using Tailwind `h-20` on an `<svg>` element while also setting `height="80"` — they conflict on some browsers.
**Why it happens:** SVG `width`/`height` attributes and CSS dimensions are separate systems. In React, inline SVG without `viewBox` ignores CSS sizing.
**How to avoid:** Use `viewBox="0 0 W H"` + `width="100%"` so the SVG scales responsively. Set explicit numeric dimensions as constants in JS, not CSS.

### Pitfall 3: Polyline Points String Breaks on Null Y
**What goes wrong:** `getShiftTrajectory` returns `y: null` for days with no data. Concatenating nulls into the SVG `points` attribute produces `NaN NaN` coordinates.
**Why it happens:** Forgetting to filter nulls before building the points string.
**How to avoid:** Build separate `<polyline>` segments for each contiguous run of non-null points:
```js
const segments = []
let current = []
for (const pt of points) {
  if (pt.y === null) {
    if (current.length > 1) segments.push(current)
    current = []
  } else {
    current.push(pt)
  }
}
if (current.length > 1) segments.push(current)
```

### Pitfall 4: Chart Width on Mobile
**What goes wrong:** Fixed-pixel SVG overflows the 300px `PostResetCheckin` panel on small screens.
**Why it happens:** `PostResetCheckin` has `w-[300px]` — a bar chart at 280px wide risks overflow with padding.
**How to avoid:** Use `viewBox` + `width="100%"` pattern. For `PostResetCheckin`, keep the chart compact (max 200px effective width). For `ShiftTrajectoryChart` in Insights tab, the `max-w-5xl` layout provides more room.

### Pitfall 5: PostResetCheckin Flow Interruption
**What goes wrong:** Adding a chart to `PostResetCheckin` makes it taller, pushing it off-screen on small viewports.
**Why it happens:** The component is `fixed bottom-6 right-6` — additional height pushes content upward toward the top.
**How to avoid:** Keep the chart compact (60–80px tall). Show it after the activation step (step 2), not before or in place of it. The chart is a reward/confirmation after both values are collected, not an interaction blocker.

---

## Code Examples

Verified patterns from existing codebase and SVG standards:

### Consuming chartData.js (DVIZ-01)
```js
// Source: regulation-station/src/lib/chartData.js
import { getActivationComparison } from '../lib/chartData'

// Inside PostResetCheckin — after user submits activationAfter:
const session = { activationBefore, activationAfter, state }
const compPoints = getActivationComparison(session)
// compPoints.length === 0 → no chart; length === 2 → render bars
```

### Consuming chartData.js (DVIZ-02)
```js
// Source: regulation-station/src/lib/chartData.js
import { getShiftTrajectory } from '../lib/chartData'

// Inside ShiftTrajectoryChart:
const points = getShiftTrajectory(sessions, 7)
// points: [{ x: 'YYYY-MM-DD', y: number|null, label: string, color: '' }, ...]
```

### Responsive SVG with viewBox
```jsx
// Source: established SVG pattern
<svg
  viewBox={`0 0 ${W} ${H}`}
  width="100%"
  style={{ overflow: 'visible' }}
  aria-label="shift trajectory"
>
  {/* chart content */}
</svg>
```

### Day label abbreviation (matches WeeklyConsistency pattern)
```js
// Source: regulation-station/src/components/WeeklyConsistency.jsx
const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
function getDayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1]
}
```

### Theme-reactive SVG text
```jsx
// Use CSS vars on SVG text elements (supported in modern browsers)
<text fill="var(--text-muted)" fontFamily="JetBrains Mono, monospace" />
// For accent-colored elements use the accentHex prop (state-reactive)
<rect fill={accentHex + '40'} />  // 25% opacity before bar
<rect fill={accentHex} />          // full opacity after bar
```

### Zero-baseline reference line (DVIZ-02 y=0 line)
```jsx
// Shift of 0 = no change; draw a subtle baseline for context
const y0 = yScale(0)
<line
  x1={PAD.left} y1={y0}
  x2={W - PAD.right} y2={y0}
  stroke="var(--border)"
  strokeWidth={1}
  strokeDasharray="2 3"
/>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Chart libraries (Recharts, Chart.js) | Native SVG | Roadmap decision (Phase 1 planning) | Eliminates 20–80kB bundle cost; requires hand-rolled coordinate math |
| Deriving chart data in component | Pure transform functions in `chartData.js` | Phase 1 execution | Components are pure renderers; logic is testable separately |

**Deprecated/outdated:**
- Any reference to "framer-motion for chart animation": already installed but prohibited for new use per roadmap bundle constraint. Use CSS transitions on SVG properties instead.

---

## Open Questions

1. **Does PostResetCheckin need activationBefore captured before the session starts?**
   - What we know: `StealthReset.jsx` has `activationBefore` state and passes it via `onComplete`. `App.jsx` stores it in `checkinPending.activationBefore`. `PostResetCheckin` receives it via the `checkinPending` prop chain but currently does NOT pass it down — `PostResetCheckin` props are `{ accentHex, source, onRate }`.
   - What's unclear: `PostResetCheckin` needs `activationBefore` to display DVIZ-01 comparison. This requires either (a) adding `activationBefore` as a prop to `PostResetCheckin`, or (b) showing the chart only in the `onRate` callback after both values are collected.
   - Recommendation: Add `activationBefore` as a prop to `PostResetCheckin`. The value is already in `checkinPending` in App.jsx — wiring it through is a single-line change. The chart renders on the final confirmation screen after the user submits their activation-after value.

2. **Where exactly in PostResetCheckin does the chart appear?**
   - What we know: The component has two steps: 'shift' (4 outcome buttons) then 'activation' (1–10 scale). After the user taps an activation level, `onRate` fires and the component unmounts.
   - What's unclear: Should the chart appear (a) as a third "results" step before calling `onRate`, or (b) at the same time as the activation buttons as contextual reference?
   - Recommendation: Add a brief third `step === 'result'` state that shows for ~2s (or has a "done" button) displaying the comparison chart. This gives users a moment to register the before/after shift visually before the overlay dismisses. The 22s auto-dismiss timer from step 1 continues running to prevent stale overlays.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured (no jest.config, no vitest.config, no test directory) |
| Config file | None — see Wave 0 |
| Quick run command | `npm run build && npm run lint` (build as proxy for correctness) |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DVIZ-01 | `getActivationComparison` returns 2-item array for valid session, `[]` for null | unit | `node -e "import('./src/lib/chartData.js').then(m => { const r = m.getActivationComparison({activationBefore:8,activationAfter:4,state:'anxious'}); console.assert(r.length===2,'len'); })"` | Already exists and passes (Phase 1) |
| DVIZ-01 | Before/after chart renders in PostResetCheckin when both values present | smoke | `npm run build` | ❌ Wave 0 |
| DVIZ-02 | `getShiftTrajectory` returns 7-point array with null gaps for missing days | unit | `node -e "import('./src/lib/chartData.js').then(m => { const r = m.getShiftTrajectory([],7); console.assert(r.length===7,'len'); })"` | Already exists and passes (Phase 1) |
| DVIZ-02 | ShiftTrajectoryChart renders without error when sessions is empty array | smoke | `npm run build` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run build && npm run lint`
- **Per wave merge:** `npm run build && npm run lint`
- **Phase gate:** Build clean + lint no new errors before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] No new test files needed — `chartData.js` unit tests run via `node -e` (Phase 1 pattern). Build + lint is the primary validation gate for component work.
- [ ] Confirm `npm run lint` baseline: 42 pre-existing errors per Phase 1 summary. New components must not add new lint errors.

*(No formal test framework exists in this project — build + lint is the established gate.)*

---

## Sources

### Primary (HIGH confidence)
- `regulation-station/src/lib/chartData.js` — confirmed exports, data shapes, null handling
- `regulation-station/src/hooks/useSessionLog.js` — confirmed session schema including `activationBefore`, `activationAfter`, `activationDelta`, `shift`
- `regulation-station/src/components/PostResetCheckin.jsx` — confirmed step flow, props, timer behavior
- `regulation-station/src/components/VagusLogSidebar.jsx` — confirmed 5-day sparkline pattern (DIV bars, not SVG)
- `regulation-station/src/components/WeeklyConsistency.jsx` — confirmed day label pattern, color conventions
- `.planning/phases/01-foundations/01-02-PLAN.md` — confirmed chartData.js design decisions
- `.planning/phases/01-foundations/01-02-SUMMARY.md` — confirmed Phase 1 delivered all three exports
- `.planning/STATE.md` — confirmed: no chart libraries, no framer-motion, 44kB headroom exhausted

### Secondary (MEDIUM confidence)
- SVG `viewBox` + `width="100%"` responsive pattern — standard SVG specification behavior, no external source needed
- CSS custom property fills on SVG text elements — confirmed supported in all modern browsers

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are already in the project; no new dependencies
- Architecture: HIGH — data layer exists, component placement is clear (PostResetCheckin + Insights tab)
- Pitfalls: HIGH — identified from direct inspection of the existing code (null activationBefore, SVG sizing, polyline null gaps)

**Research date:** 2026-03-11
**Valid until:** 2026-06-11 (stable — no moving dependencies)
