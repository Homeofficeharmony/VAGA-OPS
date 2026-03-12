---
phase: 01-foundations
verified: 2026-03-10T00:00:00Z
status: gaps_found
score: 3/4 must-haves verified
gaps:
  - truth: "Both useAudioEngine and useAmbientEngine expose an analyserNode value that is non-null when audio is active and null when audio is inactive"
    status: failed
    reason: "Both hooks return analyserRef (a React ref object) not analyserNode (a value). The ref object itself is never null — only ref.current changes. The ROADMAP success criterion requires an analyserNode value that is null when inactive; the implementation cannot satisfy this because the ref object has stable identity across renders regardless of audio state."
    artifacts:
      - path: "regulation-station/src/hooks/useAudioEngine.js"
        issue: "Returns analyserRef (ref object) not analyserNode (value). Line 196: `return { ..., analyserRef }`. A consumer cannot test `if (analyserNode)` to know if audio is active."
      - path: "regulation-station/src/hooks/useAmbientEngine.js"
        issue: "Returns analyserRef (ref object) not analyserNode (value). Line 291: `return { ..., analyserRef }`. Same issue."
    missing:
      - "A stable way for consumers to know if audio is active via the returned value — either expose analyserNode computed from state (e.g., playing ? analyserRef.current : null, kept in a useState updated in play/pause callbacks), or expose a separate isActive boolean alongside analyserRef so consumers can conditionally access .current"
      - "The PLAN's deviation note (02-SUMMARY.md decisions field) correctly identifies the ESLint concern but the fix (expose the whole ref) breaks the success criterion contract. The solution is to either suppress the specific ESLint line or compute analyserNode into component state that tracks play state."
---

# Phase 1: Foundations Verification Report

**Phase Goal:** All shared utilities exist and are independently testable before any consumer component is built
**Verified:** 2026-03-10
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | useContentRotation returns a date-stable index that does not change within a session but advances each calendar day | VERIFIED | `useContentRotation.js` uses djb2 hash on `en-CA` date string. Same-date stability confirmed: `dailyIndex('2026-03-10', 10)` = 3 twice. Different-date rotation confirmed: `dailyIndex('2026-03-11', 10)` = 2. |
| 2 | `src/lib/chartData.js` exports pure transform functions that convert the session array into chart-ready data shapes without any UI dependency | VERIFIED | Three exports confirmed: `getActivationComparison` returns `[{x,y,label,color},{x,y,label,color}]`, returns `[]` on null activations. `getShiftTrajectory` returns 7 date-keyed points with `y: null` for empty days. `getDailyStateSeries` returns `{frozen, anxious, flow}` arrays. No React imports. Only dependency is `../utils/colors.js`. |
| 3 | Both `useAudioEngine` and `useAmbientEngine` expose an `analyserNode` value that is non-null when audio is active and null when audio is inactive | FAILED | Both hooks return `analyserRef` (the React ref object, key name `analyserRef`) — not `analyserNode` (a computed value). A React ref object itself is never null; only `ref.current` changes. The success criterion requires a value that is null when inactive. The PLAN documented this as a deliberate deviation to avoid ESLint `react-hooks/refs` violations, but the deviation breaks the criterion's observable contract. |
| 4 | A shared `src/utils/grain.js` utility exists and exports a grain texture constant usable by any canvas component | VERIFIED | `grain.js` exists. `GRAIN_BG` is a string containing `fractalNoise`, starts with `url(`. `grainOverlayStyle` has all 4 keys: `backgroundImage`, `backgroundSize: '160px 160px'`, `opacity: 0.4`, `mixBlendMode: 'overlay'`. `AudioPlayer.jsx` imports `grainOverlayStyle` from `../utils/grain` (no inline `GRAIN_BG` remains). |

**Score:** 3/4 truths verified

---

### Required Artifacts

#### Plan 01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `regulation-station/src/utils/grain.js` | GRAIN_BG data URI and grainOverlayStyle | VERIFIED | Exists. Exports both named values. GRAIN_BG contains `fractalNoise` SVG data URI. grainOverlayStyle has 4 correct keys. No React dependency. |
| `regulation-station/src/hooks/useContentRotation.js` | Date-stable hook, exports useContentRotation | VERIFIED | Exists. 31 lines. Uses `useMemo`, djb2 hash (`hash = 5381`), `en-CA` date string. Exports `useContentRotation`. Returns `{ item, index }`. JSDoc present. |
| `regulation-station/src/components/AudioPlayer.jsx` | Updated to import grain from shared utility | VERIFIED | Line 4: `import { grainOverlayStyle } from '../utils/grain'`. No inline `GRAIN_BG` constant. Line 107: `style={grainOverlayStyle}`. |

#### Plan 02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `regulation-station/src/lib/chartData.js` | Pure transform functions, exports 3 named functions | VERIFIED | Exists. 135 lines. Exports `getActivationComparison`, `getShiftTrajectory`, `getDailyStateSeries`. Imports `ACCENT_HEX`. No React. Pattern mirrors `tacticalAnalysis.js`. |
| `regulation-station/src/hooks/useAudioEngine.js` | Binaural engine with analyserNode exposed | PARTIAL | Exists. `analyserRef` created (`useRef(null)`), `fftSize = 2048`, inserted after master gain (`master.connect(analyser)`, `analyser.connect(ctx.destination)`), nulled in teardown. But exposed as `analyserRef` (ref object), not `analyserNode` (computed value). Return key name differs from criterion. |
| `regulation-station/src/hooks/useAmbientEngine.js` | Ambient engine with analyserNode exposed | PARTIAL | Exists. `analyserRef = useRef(null)`. `connectWithAnalyser` helper used in all 3 start methods (forest, ocean, binaural). `fftSize = 2048`. Nulled in teardown. But exposed as `analyserRef`, not `analyserNode`. |

---

### Key Link Verification

#### Plan 01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `AudioPlayer.jsx` | `utils/grain.js` | `import { grainOverlayStyle }` | WIRED | Line 4 confirmed. Used at line 107 (`style={grainOverlayStyle}`). |

#### Plan 02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `chartData.js` | `utils/colors.js` | `import ACCENT_HEX` | WIRED | Line 12: `import { ACCENT_HEX } from '../utils/colors.js'`. Used in `STATE_COLOR` map and `getDailyStateSeries`. |
| `useAudioEngine.js` | Web Audio AnalyserNode | `master.connect(analyser)` in buildGraph | WIRED | Lines 134-138: `createAnalyser()`, `fftSize = 2048`, `master.connect(analyser)`, `analyser.connect(ctx.destination)`, `analyserRef.current = analyser`. Chain is correct. |
| `useAmbientEngine.js` | Web Audio AnalyserNode | `connectWithAnalyser` helper | WIRED | Lines 78-84: helper creates analyser, fftSize 2048, `master.connect(analyser)`, `analyser.connect(ctx.destination)`. Called in startForest (118), startOcean (157), startBinaural (192). All three start methods include `connectWithAnalyser` in dependency arrays. |

---

### Requirements Coverage

No requirement IDs are assigned to Phase 1 (it enables downstream requirements). Both PLAN files declare `requirements: []`. No orphaned requirement IDs mapped to this phase in REQUIREMENTS.md.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/StateSelector.jsx` | 6 | `const GRAIN_BG = ...` (inline duplicate) | Warning | grain.js was created to eliminate duplication; StateSelector still has its own inline copy. Not introduced by this phase (pre-existing), but the deduplication goal is only partially achieved. |
| `src/components/FirstVisitExperience.jsx` | 24 | `const GRAIN_BG = ...` (inline duplicate) | Warning | Same issue — pre-existing inline copy not migrated. Not introduced by this phase. |

Note: Both inline duplicates pre-date this phase. The PLAN's scope was limited to AudioPlayer.jsx. These are informational, not blockers for Phase 1's goal.

---

### Human Verification Required

None. All four success criteria can be verified programmatically. The analyserNode gap is conclusively determinable from code inspection — the returned key name and type are verifiable without running the browser.

---

### Gaps Summary

**One gap blocks the analyserNode success criterion.** The PLAN explicitly documented this as a deviation: ESLint's `react-hooks/refs` rule flags reading `ref.current` during render (in a return statement), so the implementation exposes the ref object (`analyserRef`) instead of a computed value (`analyserNode`).

The deviation preserves correct React patterns for where FFT data will actually be consumed (inside `useEffect` or `requestAnimationFrame` callbacks), and the audio chain wiring itself is correct. However, the success criterion requires a value that is null when inactive — which the ref object cannot provide, since a React ref object is always `{ current: ... }` regardless of audio state.

The fix options are:
1. Track `analyserNode` in a `useState`, updated on play/pause, exposing a real null/non-null value — this satisfies the criterion without the ESLint violation.
2. Rename the returned key to `analyserRef` and update the success criterion wording to match the implementation's deliberately chosen API shape (if the ROADMAP criterion wording is considered outdated post-decision).

The other three success criteria are fully satisfied. grain.js, useContentRotation, and chartData.js are all correctly implemented and ready for downstream phases.

---

_Verified: 2026-03-10_
_Verifier: Claude (gsd-verifier)_
