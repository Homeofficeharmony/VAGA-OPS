---
phase: 02-content-variety
plan: 01
subsystem: content
tags: [stateData, tips, tasks, time-of-day, content-rotation]
dependency_graph:
  requires: [01-01]
  provides: [expanded-tips-pool, time-tagged-tasks, daily-tip-display]
  affects: [ImmersionContainer, StealthReset, TaskFilter]
tech_stack:
  added: []
  patterns: [useContentRotation, getTimeOfDaySlot, date-stable-hash]
key_files:
  created: []
  modified:
    - regulation-station/src/data/stateData.js
    - regulation-station/src/components/ImmersionContainer.jsx
    - regulation-station/src/components/StealthReset.jsx
    - regulation-station/src/components/TaskFilter.jsx
decisions:
  - "Daily tip in ImmersionContainer replaces hardcoded WELCOME.tip string via dailyTip ?? w.tip pattern — fallback preserved"
  - "TaskFilter filters silently by time slot — no UI indicator shown, tasks just appear contextually relevant"
  - "Items missing timeOfDay default to always-visible for backward compatibility"
metrics:
  duration: 6 min
  completed_date: "2026-03-10"
---

# Phase 2 Plan 1: Content Expansion (Tips + Time-Tagged Tasks) Summary

**One-liner:** Expanded stateData.js to 22 tips per state with time-of-day task tagging, wired daily rotation via useContentRotation into ImmersionContainer and StealthReset, and added getTimeOfDaySlot filtering to TaskFilter.

## What Was Built

### stateData.js — Expanded Content Pools
- Frozen: 8 → 22 tips, 5 → 15 task items
- Anxious: 8 → 22 tips, 5 → 16 task items
- Flow: 8 → 22 tips, 5 → 17 task items
- Every task item has a `timeOfDay` field: `'morning' | 'afternoon' | 'evening' | 'any'`
- Distribution: each state has 3+ items per time slot and 2+ `any` items (ensures 5+ visible at any hour)
- New tips are polyvagal-accurate, science-grounded, matching existing tone (direct, second-person, physiological)

### ImmersionContainer.jsx
- Imports `useContentRotation`
- `const { item: dailyTip } = useContentRotation(stateData?.tips ?? [])` called before early return
- Welcome phase renders `dailyTip ?? w.tip` — uses rotating daily tip if available, falls back to static WELCOME.tip

### StealthReset.jsx
- Imports `useContentRotation`
- `dailyTip` called immediately after existing `stateData` destructuring
- Daily tip rendered below `{reset.mechanism}` in muted italic styling (`text-xs text-slate-400 italic`)

### TaskFilter.jsx
- `getTimeOfDaySlot()` pure function added above component: returns `'morning'` (5–11h), `'afternoon'` (12–16h), `'evening'` (17h+)
- `visibleItems` computed from `tasks.items.filter` — items pass if no `timeOfDay`, or `timeOfDay === 'any'`, or matches current slot
- All `tasks.items` references replaced with `visibleItems`: shed mechanic, meter bars, task render loop, footer count

## Commits

| Task | Description | Hash |
|------|-------------|------|
| Task 1 | Expand stateData.js — 22 tips per state and time-tagged task items | 370b7cc |
| Task 2 | Wire useContentRotation and time-of-day filtering into components | 1842f42 |

## Verification Results

- frozen: 22 tips, 15 tasks (5 morning, 3 afternoon, 3 evening, 4 any) — all criteria passed
- anxious: 22 tips, 16 tasks (6 morning, 4 afternoon, 3 evening, 3 any) — all criteria passed
- flow: 22 tips, 17 tasks (6 morning, 6 afternoon, 3 evening, 2 any) — all criteria passed
- Build: `npm run build` passes (chunk size warning pre-existing)
- Lint: no new errors introduced

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `regulation-station/src/data/stateData.js` — verified file updated with 22 tips and time-tagged tasks per state
- `regulation-station/src/components/ImmersionContainer.jsx` — verified contains `useContentRotation` import and `dailyTip ?? w.tip`
- `regulation-station/src/components/StealthReset.jsx` — verified contains `useContentRotation` import and `dailyTip` render
- `regulation-station/src/components/TaskFilter.jsx` — verified contains `getTimeOfDaySlot` and `visibleItems`
- Commits `370b7cc` and `1842f42` exist in git log
