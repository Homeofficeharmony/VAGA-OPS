---
phase: 1
slug: foundations
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual smoke test + `node` script for pure functions |
| **Config file** | None — no test runner configured in project |
| **Quick run command** | `npm run build && npm run lint` |
| **Full suite command** | `npm run build && npm run lint` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build && npm run lint`
- **After every plan wave:** Run `npm run build && npm run lint` + manual browser smoke test
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | SC-5 (grain.js) | unit (pure fn) | `node -e "import('./src/utils/grain.js').then(m => console.log(Object.keys(m)))"` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | SC-1 (useContentRotation) | unit (pure fn) | `node -e "..."` verify same-date stability | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 1 | SC-2 (chartData.js) | unit (pure fn) | `node -e "..."` verify shape output | ❌ W0 | ⬜ pending |
| 01-04-01 | 04 | 1 | SC-3/SC-4 (analyserNode) | smoke (browser) | Manual: DevTools console log analyserNode | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] No automated test runner exists — pure function verification via `node` CLI or build-time checks
- [ ] Consider `scripts/verify-phase1.mjs` for pure-function validation of chartData.js and useContentRotation

*Existing build/lint infrastructure covers compilation and code quality checks.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| analyserNode non-null when playing | SC-3 | Requires browser Web Audio API context | 1. Open app 2. Select state 3. Play audio 4. In DevTools, inspect analyserNode ref value |
| analyserNode null when inactive | SC-4 | Requires browser Web Audio API context | 1. Open app 2. Before play: verify null 3. After pause: verify null |
| grain texture visual appearance | SC-5 | Visual check that grain renders correctly | 1. Open app 2. Verify AudioPlayer still shows grain overlay |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
