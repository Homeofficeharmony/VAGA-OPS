---
phase: 7
slug: breath-signal-wire
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — project has no automated test suite |
| **Config file** | none |
| **Quick run command** | `npm run dev` + visual inspect at localhost:5173 |
| **Full suite command** | Full immersion session walkthrough (welcome → stabilize → breath transitions) |
| **Estimated runtime** | ~2 minutes manual walkthrough |

---

## Sampling Rate

- **After every task commit:** Visual inspection in browser at localhost:5173
- **After every plan wave:** Full immersion session: welcome → stabilize → observe particle speed changes on inhale/exhale transitions
- **Before `/gsd:verify-work`:** Particles visibly respond, Hz badge gone, description renders non-blank
- **Max feedback latency:** ~2 minutes (manual)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 7-01-01 | 01 | 1 | VATM-02 | manual | N/A — visual: `breathPhase` no longer hardcoded in App.jsx source | ✅ src/App.jsx | ⬜ pending |
| 7-01-02 | 01 | 1 | VATM-02 | manual | N/A — visual: ImmersionContainer fires onBreathPhaseChange on transitions | ✅ src/components/ImmersionContainer.jsx | ⬜ pending |
| 7-01-03 | 01 | 1 | VATM-02 | manual | N/A — visual: particles visibly accelerate on inhale, slow on exhale with ~1-2s ramp | ✅ src/components/ParticleField.jsx | ⬜ pending |
| 7-02-01 | 02 | 1 | VATM-02 | manual | N/A — visual: Hz badge div absent from AudioPlayer DOM | ✅ src/components/AudioPlayer.jsx | ⬜ pending |
| 7-02-02 | 02 | 1 | VATM-02 | manual | N/A — visual: description text renders below track name for all 3 states | ✅ src/data/stateData.js | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — no automated test infrastructure exists in this project. All verification is manual visual inspection. No Wave 0 tasks needed.

*Existing infrastructure covers all phase requirements (manual inspection only).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Particles accelerate on inhale, slow on exhale with smooth ramp | VATM-02 | Canvas animation — no automated assertion framework; perceptual visual check | Open app → select any state → open immersion → reach stabilize phase → observe particle field speed change as breath cycles inhale/exhale |
| `breathPhase` is live state not hardcoded | VATM-02 | Runtime behavior check — prop is only live when ImmersionContainer callback fires | Open browser devtools → React DevTools → inspect App.jsx state → confirm `breathPhase` value changes during immersion stabilize phase |
| Hz badge removed, description renders | VATM-02 | DOM rendering check | Open AudioPlayer in any state → confirm no empty badge above panel → confirm description text below track name |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2 minutes
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
