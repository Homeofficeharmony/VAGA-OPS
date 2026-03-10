---
phase: 01-foundations
plan: "02"
subsystem: data-layer
tags: [chart-data, audio, analyser, web-audio-api, pure-functions]
dependency_graph:
  requires: []
  provides:
    - regulation-station/src/lib/chartData.js
    - regulation-station/src/hooks/useAudioEngine.js (analyserRef)
    - regulation-station/src/hooks/useAmbientEngine.js (analyserRef)
  affects:
    - Phase 3 (audio visualizers consume analyserRef)
    - Phase 5 (chart components consume chartData.js transforms)
tech_stack:
  added: []
  patterns:
    - Pure transform functions (no React, no side effects) for chart data
    - AnalyserNode inserted after master gain node, before ctx.destination
    - connectWithAnalyser helper shared across three ambient start methods
    - Ref exposed from hook (not ref.current in return) to satisfy react-hooks/refs ESLint rule
key_files:
  created:
    - regulation-station/src/lib/chartData.js
  modified:
    - regulation-station/src/hooks/useAudioEngine.js
    - regulation-station/src/hooks/useAmbientEngine.js
decisions:
  - "Expose analyserRef (the ref object) rather than analyserRef.current in hook returns — avoids react-hooks/refs ESLint error (reading ref.current during render). Consumers access .current inside effects or RAF callbacks, which is the correct pattern."
  - "connectWithAnalyser helper in useAmbientEngine is a useCallback with empty dep array — stable across renders, safe to add to startForest/startOcean/startBinaural dependency arrays."
metrics:
  duration_minutes: 3
  completed_date: "2026-03-10"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 2
---

# Phase 1 Plan 02: Chart Data Transforms and AnalyserNode Wiring Summary

**One-liner:** Pure chart data transforms (3 exports) and AnalyserNode tap (fftSize 2048 after master gain) wired into both audio engines for Phase 3 visualizers and Phase 5 charts.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create chartData.js pure transform functions | 34acec3 | regulation-station/src/lib/chartData.js (created) |
| 2 | Wire AnalyserNode into useAudioEngine and useAmbientEngine | de02106 | useAudioEngine.js, useAmbientEngine.js (modified) |

## Outputs Delivered

### regulation-station/src/lib/chartData.js (new)
Pure chart data transform module following the `tacticalAnalysis.js` pattern (no React, no side effects).

Three exports:
- `getActivationComparison(session)` — returns `[{x,y,label,color}, {x,y,label,color}]` for valid sessions; `[]` when either activation value is null
- `getShiftTrajectory(sessions, window=7)` — returns 7 or 30 date-keyed points; `y: null` for days with no data (gap rendering is Phase 5's responsibility)
- `getDailyStateSeries(sessions, window=7)` — returns `{ frozen: [...], anxious: [...], flow: [...] }` with ACCENT_HEX colors per point

All functions import `ACCENT_HEX` from `../utils/colors.js` and use an internal `STATE_COLOR` map (`frozen: red, anxious: amber, flow: green`).

### regulation-station/src/hooks/useAudioEngine.js (modified)
- Added `analyserRef = useRef(null)`
- In `buildGraph`: AnalyserNode (fftSize 2048) inserted `master → analyser → ctx.destination`
- In `teardown`: `analyserRef.current = null`
- Return now includes `analyserRef`

### regulation-station/src/hooks/useAmbientEngine.js (modified)
- Added `analyserRef = useRef(null)`
- Added `connectWithAnalyser(ctx, master)` useCallback helper — creates AnalyserNode (fftSize 2048), wires `master → analyser → ctx.destination`, stores in `analyserRef.current`
- `startForest`, `startOcean`, `startBinaural` all call `connectWithAnalyser` instead of `master.connect(ctx.destination)`
- All three start methods include `connectWithAnalyser` in their dependency arrays
- In `teardown`: `analyserRef.current = null`
- Return now includes `analyserRef`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Avoid reading analyserRef.current during render**
- **Found during:** Task 2 — lint run after implementation
- **Issue:** The plan specified `analyserNode: playing ? analyserRef.current : null` in the return statement. ESLint `react-hooks/refs` rule correctly flags this: reading `ref.current` directly in the return (which runs during render) is a React anti-pattern.
- **Fix:** Expose `analyserRef` (the stable ref object) instead of `analyserRef.current`. Phase 3 visualizers will access `.current` inside `useEffect` or `requestAnimationFrame` callbacks — which is the correct React pattern and exactly where FFT data will be consumed.
- **Files modified:** `useAudioEngine.js`, `useAmbientEngine.js`
- **Commit:** de02106

## Verification Results

- `getActivationComparison` test: PASS (correct shape, correct null handling)
- `getShiftTrajectory` test: PASS (7 points, today has data, prior days null)
- `getDailyStateSeries` test: PASS (frozen/anxious/flow arrays, length 7, ACCENT_HEX colors)
- `npm run build`: PASS (no new compilation errors; chunk size warning pre-existing)
- `npm run lint`: No new errors (42 pre-existing errors remain, 0 new)

## Self-Check: PASSED
