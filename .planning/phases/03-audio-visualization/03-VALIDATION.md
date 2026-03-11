---
phase: 3
slug: audio-visualization
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None configured (canvas/Web Audio — primarily visual verification) |
| **Config file** | None — lint serves as code correctness proxy |
| **Quick run command** | `npm run lint` |
| **Full suite command** | `npm run build && npm run lint` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint`
- **After every plan wave:** Run `npm run build && npm run lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | AVIZ-02 | manual + lint | `npm run lint` | N/A | ⬜ pending |
| 03-01-02 | 01 | 1 | AVIZ-02 | manual + lint | `npm run lint` | N/A | ⬜ pending |
| 03-02-01 | 02 | 1 | AVIZ-01 | manual + lint | `npm run lint` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. No test framework setup required — lint is sufficient proxy for this phase's automated checking.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Play button glow pulses at beat frequency | AVIZ-01 | CSS animation timing is perceptual; no automated visual test | Press play on each state — glow cycles visibly at 5 Hz (frozen), 10 Hz (anxious), shimmer at 40 Hz (flow) |
| Frequency bars respond to live audio | AVIZ-02 | Web Audio + Canvas requires browser runtime | Press play — bars animate; press pause — bars decay to static fallback; switch state while playing — color updates without crash |
| Static fallback when audio inactive | AVIZ-02 | Visual/perceptual | Load page without playing audio — low-opacity static bars visible, not empty space |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
