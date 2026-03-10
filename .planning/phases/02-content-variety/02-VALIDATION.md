---
phase: 2
slug: content-variety
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual browser smoke test (no automated test runner in project) |
| **Config file** | none |
| **Quick run command** | `npm run dev` |
| **Full suite command** | `npm run build && npm run lint` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Open app in browser, select a state, verify the changed component shows no console errors
- **After every plan wave:** Run `npm run build && npm run lint`
- **Before `/gsd:verify-work`:** All four CVAR requirements manually verified with explicit time/date boundary testing
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | CVAR-01 | Unit (data) + Smoke | Count `STATES.frozen.tips.length >= 20` in console | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | CVAR-02 | Unit (data) + Smoke | Enter immersion, observe breath label text | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | CVAR-03 | Smoke (date override) | Stub date in useContentRotation, observe StealthReset title | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | CVAR-04 | Smoke (time manipulation) | Stub `getTimeOfDaySlot` return value, observe TaskFilter items | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Manual verification script for stateData.js pool sizes (count tips, breathCues variants, resetVariants, time-tagged tasks)
- [ ] `TaskFilter.jsx` time-slot filter tested with mocked hour values
- [ ] `ImmersionContainer.jsx` breath label verified to use daily variant (not hardcoded constant)
- [ ] No automated test runner exists — verification remains manual for this phase

*Existing infrastructure covers lint and build. No new framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Daily tip rotation visible in UI | CVAR-01 | Requires visual confirmation of tip display | Select each state, verify tip text matches `STATES[state].tips[rotationIndex]` |
| Breath cue phrasing changes across days | CVAR-02 | Requires date boundary crossing | Enter immersion on two different days (or stub date), verify breath label text differs |
| Protocol variant displayed in StealthReset | CVAR-03 | Requires date boundary crossing | Open StealthReset on different days, verify title/steps differ |
| Time-of-day task filtering | CVAR-04 | Requires time manipulation | Change system hour or stub `getTimeOfDaySlot`, verify task list changes per slot |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
