---
phase: 6
slug: animation-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (via `npm run lint` for static; manual visual for animation) |
| **Config file** | `regulation-station/vite.config.js` |
| **Quick run command** | `cd regulation-station && npm run lint` |
| **Full suite command** | `cd regulation-station && npm run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd regulation-station && npm run lint`
- **After every plan wave:** Run `cd regulation-station && npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 1 | STUX-01 | lint+build | `cd regulation-station && npm run build` | ✅ | ⬜ pending |
| 6-01-02 | 01 | 1 | STUX-01 | lint+build | `cd regulation-station && npm run build` | ✅ | ⬜ pending |
| 6-01-03 | 01 | 1 | STUX-01 | manual visual | Verify tab animation in browser | N/A | ⬜ pending |
| 6-01-04 | 01 | 1 | STUX-01 | manual visual | Verify state transition stagger in browser | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.* framer-motion is already installed. No new test framework needed — animation verification is manual visual inspection.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| State switch triggers background→card stagger (0–400ms bg, 400–900ms cards) | STUX-01 | CSS/JS animation timing cannot be unit tested; requires visual + timing observation | Open app, select Frozen, then switch to Flow — observe stagger sequence |
| Active card expands smoothly on state select | STUX-01 | Visual spring animation | Click each state — card should expand without snap |
| Tab content fades in with 12px upward rise | STUX-01 | framer-motion animation requires visual inspection | Switch tabs in dashboard — content should fade+lift, not snap or slide |
| No animation on first page load | STUX-01 | Can't automate first-render detection | Hard refresh page — Regulate tab content must appear instantly |
| All accent elements (borders, glows, buttons) transition to new accent color | STUX-01 | Visual CSS transition across multiple elements | Switch states — check status dots, border glows, buttons all transition |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
