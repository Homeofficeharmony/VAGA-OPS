---
phase: 5
slug: data-visualization
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None configured (build + lint is established gate) |
| **Config file** | none |
| **Quick run command** | `cd regulation-station && npm run build && npm run lint` |
| **Full suite command** | `cd regulation-station && npm run build && npm run lint` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd regulation-station && npm run build && npm run lint`
- **After every plan wave:** Run `cd regulation-station && npm run build && npm run lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | DVIZ-01 | smoke | `cd regulation-station && npm run build` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | DVIZ-01 | unit | `node -e "import('./src/lib/chartData.js').then(m => { const r = m.getActivationComparison({activationBefore:8,activationAfter:4,state:'anxious'}); console.assert(r.length===2); })"` | ✅ | ⬜ pending |
| 05-02-01 | 02 | 1 | DVIZ-02 | smoke | `cd regulation-station && npm run build` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 1 | DVIZ-02 | unit | `node -e "import('./src/lib/chartData.js').then(m => { const r = m.getShiftTrajectory([],7); console.assert(r.length===7); })"` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Confirm `npm run lint` baseline: 42 pre-existing errors per Phase 1 summary. New components must not add new lint errors.
- [ ] Confirm `npm run build` passes cleanly before starting work.

*No formal test framework exists in this project — build + lint is the established gate.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Before/after bars render correctly with theme colors | DVIZ-01 | Visual rendering in overlay context | Complete a stealth reset with pre-activation captured, verify bars appear in PostResetCheckin with correct heights |
| Shift trajectory polyline handles null gaps | DVIZ-02 | Visual rendering with sparse data | View ShiftTrajectoryChart with sessions that have missing days, verify no NaN in SVG |
| Charts responsive on mobile viewport | DVIZ-01, DVIZ-02 | Viewport-dependent rendering | Resize browser to 320px width, verify no overflow |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
