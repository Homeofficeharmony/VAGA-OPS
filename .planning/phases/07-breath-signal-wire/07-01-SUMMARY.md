---
phase: 07-breath-signal-wire
plan: "01"
subsystem: particles
tags: [breath-sync, particles, signal-wire, animation]
dependency_graph:
  requires: []
  provides: [breath-phase-signal, particle-lerp]
  affects: [ImmersionContainer, App, ParticleField, NeuralBackground]
tech_stack:
  added: []
  patterns: [callback-prop-lift, useRef-lerp, rAF-lerp]
key_files:
  created: []
  modified:
    - regulation-station/src/components/ImmersionContainer.jsx
    - regulation-station/src/App.jsx
    - regulation-station/src/components/ParticleField.jsx
decisions:
  - "onBreathPhaseChange uses optional chaining (?.) — backward-compatible, no other ImmersionContainer call sites need updating"
  - "speedMultRef lerp factor 0.025 at 60fps reaches 95% of target in ~1.9s — within 1-2s spec"
  - "breathPhase reset to 'inhale' on isImmersive=false via useEffect — matches natural exhale-to-rest transition"
  - "speedMultRef.current reset to 1.0 at top of init useEffect — prevents stale speed on state switch"
metrics:
  duration: "1 min"
  completed_date: "2026-03-11"
  tasks_completed: 3
  files_modified: 3
---

# Phase 7 Plan 01: Breath Signal Wire Summary

**One-liner:** Threaded live breathPhase signal from ImmersionContainer up through App.jsx callback and back down to ParticleField with smooth lerp interpolation (factor 0.025, ~1.9s ramp at 60fps).

## What Was Built

Three targeted modifications wire the breath signal end-to-end:

1. **ImmersionContainer** fires `onBreathPhaseChange?.(breathPhase)` inside the existing stabilize-phase useEffect — piggybacks on the ambient/haptic sync effect so the callback fires exactly once per breath transition, not every rAF tick.

2. **App.jsx** holds a new `breathPhase` useState initialized to `'inhale'`, resets it when immersion closes, passes `setBreathPhase` as `onBreathPhaseChange` to ImmersionContainer, and passes the live state to NeuralBackground (replacing the hardcoded `"inhale"` string).

3. **ParticleField** adds `speedMultRef = useRef(1.0)`, resets it to `1.0` at the top of the `[selectedState]` init useEffect, and replaces the instant-snap lookup with a lerp: `speedMultRef.current += (targetMult - speedMultRef.current) * 0.025` each rAF frame.

## Verification

- `npm run lint` — zero new errors introduced
- `npm run build` — clean build, 729kB JS (unchanged from pre-plan baseline)
- Hardcoded `breathPhase="inhale"` string no longer exists in App.jsx
- ImmersionContainer accepts and calls `onBreathPhaseChange` prop
- ParticleField `speedMultRef` lerps toward target each frame (no instant snap)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| ImmersionContainer.jsx | FOUND |
| App.jsx | FOUND |
| ParticleField.jsx | FOUND |
| 07-01-SUMMARY.md | FOUND |
| Commit 9721e2c (ImmersionContainer callback) | FOUND |
| Commit 75cf8a8 (App.jsx breathPhase state) | FOUND |
| Commit 53b11e3 (ParticleField lerp) | FOUND |
