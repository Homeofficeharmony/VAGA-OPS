---
phase: 02-content-variety
plan: 02
subsystem: content
tags: [stateData, breathCues, resetVariants, content-rotation, somatic-protocols]
dependency_graph:
  requires:
    - phase: 02-01
      provides: expanded tips pool, useContentRotation hook wired into ImmersionContainer and StealthReset
    - phase: 01-01
      provides: useContentRotation hook (date-stable daily selection)
  provides: [breath-cue-rotation, protocol-variant-rotation, 3-resetVariants-per-state, 4-breathCue-variants-per-phase]
  affects: [ImmersionContainer, StealthReset]
tech_stack:
  added: []
  patterns: [useContentRotation-for-breathCues, useContentRotation-for-resetVariants, same-index-cross-pool-coordination]
key_files:
  created: []
  modified:
    - regulation-station/src/data/stateData.js
    - regulation-station/src/components/ImmersionContainer.jsx
    - regulation-station/src/components/StealthReset.jsx
key_decisions:
  - "breathCues arrays all have equal length (4 items each) — single cueIdx selects across inhale/hold/exhale without out-of-bounds risk"
  - "resetVariants[0] is exact copy of existing reset object — original protocol always in rotation, no regression"
  - "ImmersionContainer _activeReset prefixed with underscore — variable computed for future use, satisfies ESLint no-unused-vars rule"
  - "Both components calling useContentRotation on the same resetVariants pool on the same day yield the same index — no prop-drilling coordination needed"
patterns_established:
  - "Cross-pool coordination via deterministic date hash — same pool length produces same daily index in any component"
  - "Fallback chain: breathCues?.inhale ?? [] → if empty, BREATH_LABEL constant is the ultimate fallback"
requirements_completed: [CVAR-02, CVAR-03]
duration: 4min
completed: "2026-03-10"
---

# Phase 2 Plan 2: Breath Cue Rotation + Protocol Variants Summary

**Added 4-variant breath cue phrasing per state and 3 polyvagal-accurate somatic protocol variants per state, wired via useContentRotation for daily habituation-prevention rotation in ImmersionContainer and StealthReset.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-10T11:36:18Z
- **Completed:** 2026-03-10T11:37:04Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- stateData.js: each state now has `breathCues` with 4-item inhale/hold/exhale arrays (equal length, variant 0 = current default)
- stateData.js: each state has `resetVariants` with 3 complete protocol objects (variant 0 = existing reset, 2 new per state)
- ImmersionContainer: breath phase labels now rotate daily via `cueIdx` from `useContentRotation(breathCues.inhale)`
- StealthReset: protocol title, steps, and mechanism all rotate daily from `resetVariants` via `useContentRotation`
- New frozen protocols: Jaw and Neck Release (tension discharge), Spinal Wave (bottom-up activation)
- New anxious protocols: Physiological Sigh (double inhale + long exhale), Cold Wrist Reset (dive reflex)
- New flow protocols: Palming (optic reset), Body Scan Anchor (grounding interoception)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add breathCues and resetVariants to stateData.js** - `230e586` (feat)
2. **Task 2: Wire breath cue rotation and protocol variant selection into components** - `b1b73ec` (feat)

## Files Created/Modified
- `regulation-station/src/data/stateData.js` — Added breathCues (4-variant inhale/hold/exhale per state) and resetVariants (3 protocols per state)
- `regulation-station/src/components/ImmersionContainer.jsx` — Dynamic breathLabel from cueIdx, _activeReset computed from resetVariants rotation
- `regulation-station/src/components/StealthReset.jsx` — Local reset variable now points to daily-selected resetVariants item

## Decisions Made
- Equal-length breathCues arrays (4 items each) required because a single `cueIdx` indexes all three phase arrays simultaneously
- `_activeReset` prefixed in ImmersionContainer because the component doesn't render protocol steps (it has its own breath animation), but the variable is computed as specified in the plan and prefixed to satisfy ESLint
- resetVariants[0] is an exact object copy of the existing `reset` key — ensures original protocol remains accessible and serves as fallback if pool rotation fails

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Renamed activeReset to _activeReset to fix new lint error**
- **Found during:** Task 2 (component wiring)
- **Issue:** `activeReset` computed in ImmersionContainer but unused — introduced a new `no-unused-vars` lint error
- **Fix:** Prefixed with underscore (`_activeReset`) which matches the ESLint allowed pattern `/^[A-Z_]/u`
- **Files modified:** regulation-station/src/components/ImmersionContainer.jsx
- **Verification:** `npm run lint` shows 45 problems (one fewer than before Task 2 began)
- **Committed in:** b1b73ec (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — lint correctness)
**Impact on plan:** Minor rename only. No behavior change. Variable still computed as specified.

## Issues Encountered
None — build and lint passed cleanly after the underscore prefix fix.

## Next Phase Readiness
- breathCues and resetVariants are in stateData.js, ready for any future phase that needs them
- Daily rotation is live: users will see different breath phrasing and somatic protocol each day
- Original `reset` key preserved in stateData.js for any component not yet migrated to resetVariants

---
*Phase: 02-content-variety*
*Completed: 2026-03-10*
