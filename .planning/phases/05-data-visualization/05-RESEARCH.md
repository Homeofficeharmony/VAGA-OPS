# Phase 5: Data Visualization - Research

**Researched:** 2026-03-11 (re-researched, forced refresh)
**Domain:** Native SVG charting in React, before/after comparison UI, trend line visualization
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DVIZ-01 | User sees a visual before/after activation comparison in the post-reset check-in | `getActivationComparison(session)` in `src/lib/chartData.js` is confirmed to exist and return the correct 2-item array. `PostResetCheckin` needs a new `ActivationBars` inline SVG and a third `'result'` step. `App.jsx` needs a one-line prop addition: `activationBefore={checkinPending.activationBefore}`. |
| DVIZ-02 | User can view a shift trajectory chart showing regulation effectiveness over time | `getShiftTrajectory(sessions, 7)` in `src/lib/chartData.js` is confirmed to exist and return 7 date-keyed points with null gaps. A new `ShiftTrajectoryChart.jsx` component consumes this and renders in the Insights tab between `WeeklyConsistency` and `WeeklyIntelligenceCard`. |
</phase_requirements>

---

## Summary

Phase 5 is a pure rendering problem — the data infrastructure was fully completed in Phase 1. The file `regulation-station/src/lib/chartData.js` exists and exports three verified functions: `getActivationComparison`, `getShiftTrajectory`, and `getDailyStateSeries`. The session schema (`activationBefore`, `activationAfter`, `activationDelta`, `shift`) is wired through `useSessionLog.js`, captured in `StealthReset.jsx` (via pre-session activation question), and stored in `checkinPending` in `App.jsx`. The `PostResetCheckin.jsx` component already handles the 'shift' and 'activation' steps — it needs only a third 'result' step and a new `activationBefore` prop. No new hooks, no new localStorage keys, no new data transforms needed.

The work is two isolated components: (1) an inline `ActivationBars` SVG inside `PostResetCheckin.jsx` that appears only when both `activationBefore` and `activationAfter` are non-null (which means the user answered the pre-session activation question in `StealthReset`); and (2) a new `ShiftTrajectoryChart.jsx` component in the Insights tab. Both use native SVG exclusively — the roadmap decision prohibiting chart libraries is firm, and the bundle headroom is exhausted (44kB remaining per STATE.md). The existing `WeeklyConsistency.jsx` is the established SVG-adjacent pattern in this codebase, though it uses `div` bars rather than SVG polylines. The `WeeklyIntelligenceCard` and `DailySummary` patterns define the panel styling conventions to match.

The key design constraint is graceful degradation. `activationBefore` is captured only in `StealthReset` (pre-session question). `ImmersionContainer` and `PanicReset` pass `activationBefore: null` — most sessions will have no comparison data. The `getActivationComparison` function already returns `[]` for null inputs; the component must use this gate. `getShiftTrajectory` returns null-y entries for days with no shift data; the SVG polyline renderer must build separate `<polyline>` elements for each contiguous non-null segment to avoid `NaN` in the SVG `points` attribute.

**Primary recommendation:** Two deliverables — modify `PostResetCheckin.jsx` (add prop + inline `ActivationBars` + result step), and create `ShiftTrajectoryChart.jsx` (new file) — both driven by existing `chartData.js` exports. Native SVG, CSS-var theming, `accentHex` prop for state-reactive color.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.x | Component rendering | Already in project |
| Native SVG | Browser built-in | Chart rendering | Roadmap decision confirmed: no chart library permitted |
| CSS custom properties | Browser built-in | Theme-reactive colors | Established pattern (`--bg-panel`, `--border`, `--text-primary`, `--text-muted`) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `src/lib/chartData.js` | Phase 1 output (verified) | Data transforms | Import `getActivationComparison`, `getShiftTrajectory` — do NOT re-derive data inline |
| `src/utils/colors.js` | Phase 1 output (verified) | `ACCENT_HEX` map | Import for state-color look-up; already used inside chartData.js |
| `src/utils/grain.js` | Phase 1 output | Grain overlay style | Optional texture on chart panels, consistent with app aesthetic |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native SVG | Recharts / Chart.js / Visx | +20–80kB bundle; roadmap explicitly prohibits |
| Native SVG | CSS div bars (height %) | Easier but limited: no polyline, no proper coordinate system for trend line |
| SVG polyline | SVG path (cubic bezier) | Smoother curves but far more math; polyline is sufficient for 7 data points |

**Installation:** No new packages.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── chartData.js             # Already exists — Phase 1 output, do not modify
├── components/
│   ├── PostResetCheckin.jsx     # Modify: add activationBefore prop + ActivationBars + result step
│   └── ShiftTrajectoryChart.jsx # New component — shift trend for Insights tab
```

`App.jsx` requires one-line change: add `activationBefore={checkinPending.activationBefore}` to the `<PostResetCheckin>` render site (~line 590) and import `ShiftTrajectoryChart`.

### Pattern 1: Inline SVG Bar Chart (DVIZ-01)
**What:** Two vertical bars side-by-side showing `activationBefore` and `activationAfter` on a 1–10 scale. The "before" bar uses `accentHex + '40'` (40% opacity); the "after" bar uses full `accentHex`. A delta label sits below or between the bars. Rendered only as a third `'result'` step in `PostResetCheckin` after the user taps an activation level.

**When to use:** Only when `getActivationComparison({ activationBefore, activationAfter })` returns length 2. When it returns `[]` (null activationBefore), skip the result step entirely and call `onRate` immediately as today. The chart is a reward/confirmation moment, not an interaction blocker.

**Key prop change in App.jsx:**
```jsx
// Source: regulation-station/src/App.jsx, ~line 590
<PostResetCheckin
  accentHex={checkinPending.accentHex}
  source={checkinPending.source}
  activationBefore={checkinPending.activationBefore}   // ADD THIS LINE
  onRate={({ outcome, shift, activationAfter }) => { ... }}
/>
```

**Example SVG structure:**
```jsx
// Source: native SVG — no external library
// viewBox and width="100%" for responsive behavior within 300px PostResetCheckin panel
function ActivationBars({ points, accentHex }) {
  const MAX = 10
  const BAR_W = 32
  const GAP = 8
  const HEIGHT = 60
  const W = 2 * BAR_W + GAP + 20   // 92px logical, scales via viewBox
  return (
    <svg
      viewBox={`0 0 ${W} ${HEIGHT + 24}`}
      width="100%"
      style={{ overflow: 'visible' }}
      aria-label="activation comparison"
    >
      {points.map((pt, i) => {
        const barH = (pt.y / MAX) * HEIGHT
        const x = i * (BAR_W + GAP) + 10
        const isBefore = i === 0
        return (
          <g key={pt.x}>
            <rect
              x={x} y={HEIGHT - barH}
              width={BAR_W} height={barH}
              rx={4}
              fill={isBefore ? accentHex + '40' : accentHex}
            />
            <text
              x={x + BAR_W / 2} y={HEIGHT - barH - 4}
              textAnchor="middle"
              fontSize={10} fontWeight="bold"
              fill={accentHex}
              fontFamily="JetBrains Mono, monospace"
            >
              {pt.y}
            </text>
            <text
              x={x + BAR_W / 2} y={HEIGHT + 14}
              textAnchor="middle"
              fontSize={9}
              fill="var(--text-muted)"
              fontFamily="JetBrains Mono, monospace"
            >
              {pt.x}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
```

### Pattern 2: SVG Polyline Trend Chart (DVIZ-02)
**What:** A line chart plotting average daily shift over 7 days. X-axis shows 3-letter day abbreviations; Y-axis covers the shift range (-1 to 2). Null gaps are skipped — no interpolation. Each non-null point gets a circle marker. A dashed zero-baseline line provides context.

**Coordinate math (verified against existing session data shape):**
```js
// Source: native SVG math
const W = 280, H = 100
const PAD = { left: 28, right: 8, top: 12, bottom: 24 }
const innerW = W - PAD.left - PAD.right   // 244
const innerH = H - PAD.top - PAD.bottom   // 64
const Y_MIN = -1, Y_MAX = 2               // matches shift range in useSessionLog
const xScale = (i) => PAD.left + (i / 6) * innerW
const yScale = (v) => PAD.top + innerH - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * innerH
```

**Null gap handling — build segment arrays:**
```js
// Source: native SVG pattern
const segments = []
let current = []
for (let i = 0; i < points.length; i++) {
  if (points[i].y === null) {
    if (current.length > 1) segments.push([...current])
    current = []
  } else {
    current.push({ i, ...points[i] })
  }
}
if (current.length > 1) segments.push(current)
// A segment of length 1 gets a dot only — no polyline (polyline needs 2+ points)
```

**Day label derivation (matching WeeklyConsistency pattern):**
```js
// Source: regulation-station/src/components/WeeklyConsistency.jsx
const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
function getDayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1]
}
```

**Component sketch:**
```jsx
// Source: native SVG — no external library
export default function ShiftTrajectoryChart({ sessions }) {
  const points = getShiftTrajectory(sessions, 7)
  const hasData = points.some(p => p.y !== null)

  if (!hasData) {
    return (
      <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-panel)' }}>
        <p className="font-mono text-[9px] tracking-widest uppercase text-center py-4" style={{ color: 'var(--text-muted)' }}>
          Complete a reset to begin tracking shifts.
        </p>
      </div>
    )
  }
  // build segments, render polyline(s), dots, x-axis labels, zero baseline
}
```

### Pattern 3: Empty State Design
**DVIZ-01 empty state:** Do not render `ActivationBars` at all. When `compPoints.length === 0` (activationBefore was null), skip the result step — call `onRate` immediately after the activation step as the current code does.

**DVIZ-02 empty state:** Show the chart container with a centered `"Complete a reset to begin tracking shifts."` message. Style matching `DailySummary` empty state pattern: `font-mono text-[9px] tracking-widest uppercase`, color `var(--text-muted)`, container with `rounded-xl p-4 border`.

### Pattern 4: Panel Styling (match existing Insights tab)
```jsx
// Source: regulation-station/src/components/WeeklyConsistency.jsx (panel style)
<div
  className="rounded-xl px-5 py-3 border"
  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-panel)' }}
>
```
`ShiftTrajectoryChart` should match this structure. Use `px-4 py-3` if the chart needs less horizontal padding than WeeklyConsistency.

### Anti-Patterns to Avoid
- **Deriving chart data inline in component render:** Always import from `chartData.js`. These functions handle null safety, date window generation, and averaging.
- **Hardcoding hex values in SVG fills:** Use `accentHex` prop (state-reactive) or `var(--text-muted)` / `var(--border)` (theme-reactive). Never hardcode `#52b87e`.
- **Controlling SVG dimensions with Tailwind only:** Tailwind `w-` and `h-` do not resize SVG `width`/`height` attributes reliably. Set `viewBox` + `width="100%"` on the SVG element. Height is controlled by the viewBox aspect ratio.
- **Showing DVIZ-01 when activationBefore is null:** Gate the entire result step on `compPoints.length > 0`. `ImmersionContainer` and `PanicReset` both pass `activationBefore: null` — the majority of sessions will not have this data.
- **Concatenating null y-values into the SVG points string:** Build separate `<polyline>` elements per contiguous segment (see Pattern 2). A single polyline with nulls produces `NaN NaN` in SVG.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date window generation | Custom array of dates | `getDateRange` inside `chartData.js` (private, used by all exports) | Already exists, handles DST-safe `.toISOString().slice(0,10)` |
| Activation before/after data | Re-derive from sessions | `getActivationComparison(session)` | Already handles null guard, label format |
| Shift trajectory data | Filter sessions inline | `getShiftTrajectory(sessions, 7)` | Already handles daily averaging, null gaps, date window |
| State color mapping | `const COLOR = { frozen: '#c4604a' }` | `ACCENT_HEX` from `src/utils/colors.js` | Single source of truth; already imported by `chartData.js` |
| Bezier curve smoothing | Custom cubic bezier path | `<polyline>` | 7 data points don't need smoothing; adds complexity without value |

**Key insight:** Phase 1 built the entire data layer for Phase 5. The only work is rendering. Do not touch `chartData.js`.

---

## Common Pitfalls

### Pitfall 1: activationBefore Is Null for Most Sessions
**What goes wrong:** Developer renders `ActivationBars` unconditionally and sees empty/broken UI for most users.
**Why it happens:** `activationBefore` is only captured when the user answers the pre-reset activation question in `StealthReset`. `ImmersionContainer` passes `activationBefore: null`; `PanicReset` passes `activationBefore: null`. Most existing sessions have null values.
**How to avoid:** Gate the result step on `getActivationComparison({ activationBefore, activationAfter }).length > 0`. If the gate fails, call `onRate` immediately as today.
**Warning signs:** Chart renders two zero-height bars or throws on null arithmetic.

### Pitfall 2: SVG Coordinate System vs CSS Box Model
**What goes wrong:** Using Tailwind `h-20` on an `<svg>` while also setting `height="80"` — they conflict on some browsers.
**Why it happens:** SVG `width`/`height` attributes and CSS dimensions are separate systems. React inline SVG without `viewBox` ignores CSS sizing.
**How to avoid:** Use `viewBox="0 0 W H"` + `width="100%"`. Remove explicit pixel `height` attributes. Let the viewBox aspect ratio control height.

### Pitfall 3: Polyline Points String Breaks on Null Y
**What goes wrong:** Concatenating `null` y-values into the SVG `points` attribute produces `"NaN NaN"` coordinates — chart renders as broken lines.
**Why it happens:** Forgetting to filter out null-y entries before building the points string.
**How to avoid:** Build separate `<polyline>` elements for each contiguous non-null segment (see Pattern 2 above). Single-point segments get a circle dot only.

### Pitfall 4: Chart Width Overflow Inside PostResetCheckin
**What goes wrong:** Fixed-pixel SVG overflows the `w-[300px]` panel on small screens.
**Why it happens:** `PostResetCheckin` is `fixed bottom-6 right-6 w-[300px]`. Padding consumes ~32px, leaving ~268px effective width.
**How to avoid:** Use `viewBox` + `width="100%"`. Keep the bar chart logical width at ~100px (scales down gracefully). For `ShiftTrajectoryChart` in the Insights tab, `max-w-5xl` provides ample room.

### Pitfall 5: PostResetCheckin Height Growth
**What goes wrong:** Adding a chart to `PostResetCheckin` makes it taller and pushes content toward the top of `fixed bottom-6` positioning, potentially off-screen on small viewports.
**Why it happens:** Additional DOM height in a bottom-fixed element pushes the top edge upward.
**How to avoid:** Keep the chart compact — max 80px SVG height. Show it only on the 'result' step (step 3), not alongside the activation buttons. The result step is a brief confirmation moment; the 22s auto-dismiss timer continues running.

### Pitfall 6: Forgetting the 22s Auto-Dismiss During Result Step
**What goes wrong:** If the user reaches the result step but the auto-dismiss fires, `onRate` is called without `activationAfter` (stale closure).
**Why it happens:** `collectedRef` may not include `activationAfter` if only `outcome` and `shift` were updated before step transition.
**How to avoid:** When transitioning to the result step, update `collectedRef.current` to also store `activationAfter`. The timeout handler reads from `collectedRef` — if it fires during the result step, it should call `onRate` with the collected `activationAfter`.

---

## Code Examples

Verified patterns from existing codebase and confirmed SVG standards:

### Consuming chartData.js for DVIZ-01
```js
// Source: regulation-station/src/lib/chartData.js (verified file content)
import { getActivationComparison } from '../lib/chartData'

// Inside PostResetCheckin handleActivation callback:
const compPoints = getActivationComparison({ activationBefore, activationAfter })
// compPoints.length === 0 → call onRate immediately (null activationBefore)
// compPoints.length === 2 → transition to step 'result', render ActivationBars
```

### Consuming chartData.js for DVIZ-02
```js
// Source: regulation-station/src/lib/chartData.js (verified file content)
import { getShiftTrajectory } from '../lib/chartData'

// Inside ShiftTrajectoryChart:
const points = getShiftTrajectory(sessions, 7)
// points shape: [{ x: 'YYYY-MM-DD', y: number|null, label: string, color: string }, ...]
// Always 7 items; y is null when no shift data exists for that day
```

### Responsive SVG with viewBox
```jsx
// Source: established SVG specification pattern
<svg
  viewBox={`0 0 ${W} ${H}`}
  width="100%"
  style={{ overflow: 'visible' }}
  aria-label="shift trajectory"
>
  {/* chart content — no fixed height attribute */}
</svg>
```

### Zero-baseline reference line (DVIZ-02)
```jsx
// Source: native SVG — shift of 0 = no change; dashed line provides context
const y0 = yScale(0)
<line
  x1={PAD.left} y1={y0}
  x2={W - PAD.right} y2={y0}
  stroke="var(--border)"
  strokeWidth={1}
  strokeDasharray="2 3"
/>
```

### Theme-reactive SVG text
```jsx
// CSS vars work on SVG text elements in all modern browsers
<text fill="var(--text-muted)" fontFamily="JetBrains Mono, monospace" />
// For accent-colored elements, use the accentHex prop (state-reactive)
<rect fill={accentHex + '40'} />  // before bar — 25% opacity
<rect fill={accentHex} />          // after bar — full opacity
```

### PostResetCheckin step flow after changes
```
'shift' → (user picks outcome) → 'activation' → (user picks level) →
  if compPoints.length === 2 → 'result' (ActivationBars + Done button)
  if compPoints.length === 0 → calls onRate immediately (no result step)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Chart libraries (Recharts, Chart.js) | Native SVG | Roadmap decision (Phase 1 planning) | Eliminates 20–80kB bundle cost; requires hand-rolled coordinate math |
| Deriving chart data in component | Pure transform functions in `chartData.js` | Phase 1 execution | Components are pure renderers; logic is separated |

**Deprecated/outdated:**
- Any use of framer-motion for chart animation: already installed but prohibited for new use per roadmap bundle constraint. Use CSS transitions on SVG properties or none at all.

---

## Open Questions

1. **Is activationBefore captured via ImmersionContainer?**
   - What we know: `ImmersionContainer` calls `logSession` with `activationBefore: null` (App.jsx ~line 522). It does NOT have a pre-activation capture widget.
   - What this means: The result step chart in `PostResetCheckin` will only appear for users who start a Stealth Reset (the 60-sec protocol in the dashboard) AND answer the pre-session activation question — a minority of sessions for most users.
   - Recommendation: This is acceptable. The chart is additive — it enriches the experience when data is present and disappears gracefully when it is not. Do not change ImmersionContainer to add activation capture in this phase.

2. **Where does ShiftTrajectoryChart appear in the Insights tab ordering?**
   - What we know: Current Insights tab order (App.jsx ~lines 362–396): TodayIntention → DailySummary → TacticalAdvisor → WeeklyConsistency (guarded by sessions.length > 0) → WeeklyIntelligenceCard.
   - Recommendation: Insert `ShiftTrajectoryChart` after `WeeklyConsistency` and before `WeeklyIntelligenceCard`. It should always render (it manages its own empty state). Do NOT wrap it in `sessions.length > 0`.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured (no jest.config, no vitest.config, no test directory) |
| Config file | None — build + lint is the established gate |
| Quick run command | `cd regulation-station && npm run build && npm run lint` |
| Full suite command | `cd regulation-station && npm run build && npm run lint` |
| Estimated runtime | ~15 seconds |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DVIZ-01 | `getActivationComparison` returns 2-item array for valid session | unit | `node -e "import('./src/lib/chartData.js').then(m => { const r = m.getActivationComparison({activationBefore:8,activationAfter:4,state:'anxious'}); console.assert(r.length===2,'len'); console.log('ok'); })"` (run from `regulation-station/`) | chartData.js: YES |
| DVIZ-01 | `ActivationBars` renders + `PostResetCheckin` builds with activationBefore prop | smoke | `cd regulation-station && npm run build` | PostResetCheckin.jsx will be modified |
| DVIZ-02 | `getShiftTrajectory` returns 7-point array with null gaps | unit | `node -e "import('./src/lib/chartData.js').then(m => { const r = m.getShiftTrajectory([],7); console.assert(r.length===7,'len'); console.log('ok'); })"` (run from `regulation-station/`) | chartData.js: YES |
| DVIZ-02 | `ShiftTrajectoryChart` builds without error; empty sessions renders empty state | smoke | `cd regulation-station && npm run build` | ShiftTrajectoryChart.jsx will be created |

### Sampling Rate
- **Per task commit:** `cd regulation-station && npm run build && npm run lint`
- **Per wave merge:** `cd regulation-station && npm run build && npm run lint`
- **Phase gate:** Build clean + lint at pre-existing baseline (42 errors) before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Confirm `npm run build` passes cleanly before starting work (baseline check).
- [ ] Confirm `npm run lint` shows exactly 42 problems (baseline). New components must not add new lint errors.

None — `chartData.js` exists and is verified. No new dependencies. No missing fixture files.

*(No formal test framework exists in this project — build + lint is the established gate.)*

---

## Sources

### Primary (HIGH confidence)
- `regulation-station/src/lib/chartData.js` — file read directly; confirmed exports: `getActivationComparison`, `getShiftTrajectory`, `getDailyStateSeries`; confirmed null-guard logic; confirmed data shapes
- `regulation-station/src/hooks/useSessionLog.js` — confirmed session schema including `activationBefore`, `activationAfter`, `activationDelta`, `shift`, `protocolUsed`
- `regulation-station/src/components/PostResetCheckin.jsx` — confirmed step flow ('shift' → 'activation'), props `{accentHex, source, onRate}`, 22s auto-dismiss timer, `collectedRef` pattern
- `regulation-station/src/components/StealthReset.jsx` — confirmed `activationBefore` capture (pre-session question) and `onComplete({ activationBefore, startedAt })` callback
- `regulation-station/src/App.jsx` — confirmed `checkinPending` shape includes `activationBefore`; confirmed Insights tab structure and component ordering; confirmed `activationBefore` not yet passed to `PostResetCheckin`
- `regulation-station/src/components/WeeklyConsistency.jsx` — confirmed day label pattern, panel styling pattern
- `regulation-station/src/components/DailySummary.jsx` — confirmed empty state text pattern
- `regulation-station/src/utils/colors.js` — confirmed `ACCENT_HEX` export with exact hex values
- `regulation-station/package.json` — confirmed no chart libraries installed; framer-motion 12 is installed but roadmap-prohibited for new use
- `.planning/STATE.md` — confirmed: no chart libraries, no framer-motion new use, 44kB bundle headroom exhausted
- `npm run lint` baseline: confirmed 42 problems (39 errors, 3 warnings)

### Secondary (MEDIUM confidence)
- SVG `viewBox` + `width="100%"` responsive pattern — standard SVG specification; no external source needed
- CSS custom property fills on SVG text elements — supported in all modern browsers (confirmed by existing project use in similar contexts)

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project; chartData.js exports verified by file read
- Architecture: HIGH — data layer confirmed to exist with correct shape; component insertion points confirmed
- Pitfalls: HIGH — identified from direct code inspection (null activationBefore in ImmersionContainer/PanicReset, SVG sizing, polyline null gaps, PostResetCheckin collectedRef timer)

**Research date:** 2026-03-11
**Valid until:** 2026-06-11 (stable — no moving dependencies; chartData.js is complete)
