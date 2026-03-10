---
phase: 01-foundations
plan: 01
subsystem: ui
tags: [react, vite, hooks, utility, grain, content-rotation]

# Dependency graph
requires: []
provides:
  - "src/utils/grain.js — GRAIN_BG data URI and grainOverlayStyle shared utility"
  - "src/hooks/useContentRotation.js — date-stable djb2 content rotation hook"
  - "AudioPlayer.jsx updated to import grain from shared utility (no duplication)"
affects:
  - "Phase 2 tip/breath-cue/protocol consumers calling useContentRotation"
  - "Phase 3/4 canvas components that need grain texture"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure utility pattern: named exports with no React, no component exports (colors.js → grain.js)"
    - "Date-stable content selection: djb2 hash on en-CA date string, useMemo with [dateStr, pool] deps"
    - "Independent rotation: each pool drives its own hash cycle via pool.length, no unified seed"

key-files:
  created:
    - "regulation-station/src/utils/grain.js"
    - "regulation-station/src/hooks/useContentRotation.js"
  modified:
    - "regulation-station/src/components/AudioPlayer.jsx"

key-decisions:
  - "Midnight local time is the content rotation boundary (en-CA toLocaleDateString)"
  - "No re-roll API — one selection per day, no manual override in useContentRotation"
  - "Independent rotation per pool: each consumer's pool.length produces a different hash cycle"

patterns-established:
  - "Pure utility pattern: src/utils/*.js exports plain constants/objects, no React, no default export"
  - "Hook structure: internal helper function (not exported) + single named hook export"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-03-10
---

# Phase 1 Plan 01: Foundations Summary

**Shared grain texture utility and djb2 date-stable content rotation hook extracted and ready for Phase 2/3/4 consumers**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-10T06:35:44Z
- **Completed:** 2026-03-10T06:38:21Z
- **Tasks:** 2
- **Files modified:** 3 (1 created utility, 1 created hook, 1 updated component)

## Accomplishments
- Created `src/utils/grain.js` with `GRAIN_BG` SVG data URI and `grainOverlayStyle` object — eliminates duplication before Phase 3/4 canvas consumers appear
- Created `src/hooks/useContentRotation(pool)` — djb2 hash on local calendar date string, returns `{ item, index }`, same result all day, rotates at midnight local time
- Updated `AudioPlayer.jsx` to import `grainOverlayStyle` from shared utility — inline constant removed, behavior identical

## Task Commits

Each task was committed atomically:

1. **Task 1: Create grain.js utility and update AudioPlayer import** - `34acec3` (feat) — Note: committed in prior session alongside chartData.js
2. **Task 2: Create useContentRotation hook** - `40533ae` (feat)

## Files Created/Modified
- `regulation-station/src/utils/grain.js` — GRAIN_BG SVG data URI and grainOverlayStyle named exports, pure utility matching colors.js pattern
- `regulation-station/src/hooks/useContentRotation.js` — date-stable content rotation with djb2 hash, useMemo, graceful null handling, JSDoc
- `regulation-station/src/components/AudioPlayer.jsx` — removed inline GRAIN_BG constant, added import from ../utils/grain, style={grainOverlayStyle}

## Decisions Made
- Midnight local time as rotation boundary (en-CA format = YYYY-MM-DD in local timezone)
- No re-roll/manual override in the hook API — one selection per day is the contract
- Independent rotation per pool (each pool's length drives its own hash cycle, no global seed)

## Deviations from Plan

None — plan executed exactly as written.

The Task 1 grain.js work was found already committed in `34acec3` from a prior session (bundled with chartData.js). No rework was needed. Task 2 was executed fresh and committed as `40533ae`.

## Issues Encountered
None. Build succeeds with no new compilation errors. New file `useContentRotation.js` is lint-clean. Pre-existing lint errors in App.jsx, ThemeContext.jsx, AuthContext.jsx, useAmbientEngine.js, and useAudioEngine.js are out of scope (not introduced by this plan).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `useContentRotation` is ready for Phase 2 tip/breath-cue/protocol consumers — import `{ useContentRotation }` from `../hooks/useContentRotation` and pass a stable array reference
- `grainOverlayStyle` is ready for Phase 3/4 canvas components — import `{ grainOverlayStyle }` from `../utils/grain`
- No blockers

---
*Phase: 01-foundations*
*Completed: 2026-03-10*
