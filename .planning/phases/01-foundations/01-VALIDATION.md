---
phase: 1
slug: foundations
status: draft
nyquist_compliant: true
wave_0_complete: true
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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 01-01-T1 | 01 | 1 | SC-4 (grain.js) | unit (pure fn) | `node -e "import('./src/utils/grain.js').then(m => ...)"` + `npm run build` | pending |
| 01-01-T2 | 01 | 1 | SC-1 (useContentRotation) | unit (pure fn) | `node -e "..."` replicate dailyIndex, assert same-date stability + different-date rotation + file structure | pending |
| 01-02-T1 | 02 | 1 | SC-2 (chartData.js) | unit (pure fn) | `node -e "import('./src/lib/chartData.js').then(m => ...)"` verify 3 exports and data shapes | pending |
| 01-02-T2 | 02 | 1 | SC-3/SC-4 (analyserNode) | build + lint | `npm run build && npm run lint` (browser-dependent — manual DevTools check for runtime) | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [x] No automated test runner exists — pure function verification via `node` CLI or build-time checks
- [x] All pure-function tasks (01-01-T1, 01-01-T2, 01-02-T1) have inline `node -e` verification scripts that exit 1 on failure
- [x] Browser-dependent task (01-02-T2, analyserNode) uses build+lint as automated gate with documented manual supplement

*Existing build/lint infrastructure covers compilation and code quality checks.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| analyserNode non-null when playing | SC-3 | Requires browser Web Audio API context | 1. Open app 2. Select state 3. Play audio 4. In DevTools, inspect analyserNode ref value |
| analyserNode null when inactive | SC-4 | Requires browser Web Audio API context | 1. Open app 2. Before play: verify null 3. After pause: verify null |
| grain texture visual appearance | SC-4 | Visual check that grain renders correctly | 1. Open app 2. Verify AudioPlayer still shows grain overlay |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
