---
phase: 04-atmospheric-effects
plan: 01
subsystem: ui
tags: [react, canvas, web-api, animation, raf, particles]

# Dependency graph
requires:
  - phase: 02-content-variety
    provides: stateData enrichment with per-state accent colors and configs
provides:
  - Canvas-based ParticleField component with per-state behavior and breath-driven speed
  - NeuralBackground wrapper that activates particle layer during immersion
affects:
  - 04-02-PLAN.md (ambient mode wiring — passes ambientMode prop to NeuralBackground)
  - 04-03-PLAN.md (ambient mode integration)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Particle state stored in useRef (never useState) to prevent re-render churn inside rAF loop"
    - "breathPhaseRef pattern — separate useEffect updates ref to avoid stale closure in rAF callback"
    - "DPR scaling: canvas.width = cssW * dpr; ctx.scale(dpr, dpr) for retina sharpness"
    - "Mobile cap: window.innerWidth < 600 reduces particle count to 30 max"

key-files:
  created:
    - regulation-station/src/components/ParticleField.jsx
    - regulation-station/src/components/NeuralBackground.jsx
  modified:
    - regulation-station/src/App.jsx

key-decisions:
  - "useRef for particles (not useState) — rAF loop must not trigger re-renders on every frame"
  - "breathPhaseRef updated in separate useEffect to avoid stale closure in rAF callback"
  - "ambientMode prop accepted but wired to false by default — Plan 03 (STUX-02) completes the wiring"
  - "Static 'inhale' breathPhase passed from App.jsx as fallback outside immersion — ImmersionContainer owns breath tracking during immersion"

patterns-established:
  - "ParticleField: useRef for particles, useEffect for rAF loop, separate useEffect for breathPhaseRef"
  - "NeuralBackground: gates on isImmersive || ambientMode && selectedState — null otherwise"

requirements-completed: [VATM-02, VATM-04]

# Metrics
duration: 1min
completed: 2026-03-11
---

# Phase 4 Plan 01: ParticleField + NeuralBackground Summary

**Canvas particle system with per-state drift/scatter/orbital behavior and breath-driven speed multipliers, wired into NeuralBackground for immersive activation**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-11T04:03:09Z
- **Completed:** 2026-03-11T04:04:21Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created ParticleField.jsx — rAF canvas component with three distinct per-state particle behaviors: frozen (cool-blue slow vertical drift), anxious (warm-amber jittery scatter), flow (soft-green smooth orbital)
- Breath phase drives speed via multiplier lookup on breathPhaseRef to avoid stale closure
- Replaced NeuralBackground stub with a ParticleField wrapper that activates during immersion or ambient mode
- App.jsx now passes selectedState to NeuralBackground so particles are state-aware

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ParticleField canvas component** - `fb82fcd` (feat)
2. **Task 2: Replace NeuralBackground stub with ParticleField wrapper** - `32d82ca` (feat)

## Files Created/Modified
- `regulation-station/src/components/ParticleField.jsx` - Canvas particle engine with PARTICLE_CONFIG, rAF loop, DPR scaling, mobile cap
- `regulation-station/src/components/NeuralBackground.jsx` - Wrapper component; renders ParticleField when isImmersive or ambientMode and a state is selected
- `regulation-station/src/App.jsx` - Added selectedState and breathPhase props to NeuralBackground JSX

## Decisions Made
- Particles stored in useRef not useState — rAF loop updates particle positions every frame; putting them in state would trigger hundreds of re-renders per second
- breathPhase uses a ref updated in a separate useEffect — avoids the stale closure problem where the rAF callback captures the initial breathPhase value and never sees updates
- ambientMode prop accepted with default false — Plan 03 will complete ambient mode wiring without requiring NeuralBackground changes
- Static 'inhale' as default breathPhase from App.jsx is intentional — subtle speed difference is barely perceptible and ImmersionContainer owns breath tracking during actual immersion sessions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- npm run lint reported errors in pre-existing files (App.jsx setState-in-effect, ThemeContext fast-refresh, useTeam setState, etc.). These are documented in MEMORY.md as pre-existing and were not introduced by this plan. Both new files (ParticleField.jsx, NeuralBackground.jsx) are lint-clean.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ParticleField and NeuralBackground are ready for Plan 03 ambient mode wiring (pass ambientMode prop from App.jsx)
- ImmersionContainer can pass its live breathPhase to NeuralBackground for full breath-sync during immersion
- All three visual states (frozen/anxious/flow) are production-ready with distinct particle behaviors

---
*Phase: 04-atmospheric-effects*
*Completed: 2026-03-11*
