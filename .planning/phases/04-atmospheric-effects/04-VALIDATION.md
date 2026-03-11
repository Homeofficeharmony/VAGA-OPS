---
phase: 4
slug: atmospheric-effects
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — project has no test runner |
| **Config file** | none |
| **Quick run command** | `npm run build` (type/import errors) |
| **Full suite command** | `npm run build && npm run lint` |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npm run lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | VATM-04 | visual | `npm run build` | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 1 | VATM-02 | visual | `npm run build` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 1 | VATM-01 | visual | `npm run build` | ❌ W0 | ⬜ pending |
| 4-02-02 | 02 | 1 | VATM-03 | visual | `npm run build` | ❌ W0 | ⬜ pending |
| 4-03-01 | 03 | 2 | STUX-02 | visual | `npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers build/lint. No test runner to install — all phase behaviors are visual and verified manually.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Particles drift slowly (cool tones) in frozen state | VATM-04 | Visual aesthetic — no numeric threshold | Select frozen state, observe particle motion for 5s |
| Particles jitter (warm amber) in anxious state | VATM-04 | Visual aesthetic | Select anxious state, observe jittery motion |
| Particles orbit smoothly (green) in flow state | VATM-04 | Visual aesthetic | Select flow state, observe circular motion |
| Particle speed changes with breath phase | VATM-02 | Requires immersion session | Enter immersion, observe speed on inhale vs exhale |
| Background color shifts from accent to neutral during session | VATM-01 | Gradual visual transition over 120s | Enter immersion, watch background over 30-60s |
| Radial burst appears at session completion | VATM-03 | One-shot animation | Complete a session, observe burst before check-in |
| Ambient mode activates particles + audio without session | STUX-02 | UI interaction flow | Select state, toggle ambient mode, verify visuals + audio |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
