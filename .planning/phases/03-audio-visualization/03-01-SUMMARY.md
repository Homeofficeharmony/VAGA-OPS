---
phase: 03-audio-visualization
plan: "01"
subsystem: ui
tags: [react, web-audio-api, canvas, animation, css-keyframes]

# Dependency graph
requires:
  - phase: 01-foundations
    provides: analyserRef exposed from useAudioEngine hook
provides:
  - FrequencyBars.jsx: real-time FFT bar visualizer component replacing Lissajous
  - beatPulse CSS keyframe for beat-frequency-synced play button glow
affects: [04-ambient-particles, AudioPlayer consumers]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AnalyserNode FFT data via getByteFrequencyData into pre-allocated Uint8Array (no GC pressure)"
    - "Asymmetric smoothing for bars: fast attack (0.4/0.6), slow decay (0.88) for organic feel"
    - "Static decorative fallback via pre-seeded heights with slow drift (0.94/0.06)"
    - "Beat-frequency animation duration derived inline from 1/track.beatHz"

key-files:
  created:
    - regulation-station/src/components/FrequencyBars.jsx
  modified:
    - regulation-station/src/components/AudioPlayer.jsx
    - regulation-station/src/index.css
  deleted:
    - regulation-station/src/components/LissajousVisualizer.jsx

key-decisions:
  - "Sample lower 60% of FFT bins (0..614 of 1024) — binaural tones + pink noise live in this range"
  - "40 bars chosen: visually dense enough for interest, wide enough for individual bar width on 320px canvas"
  - "beatPulse opacity range 0.25..0.75 (not 0..1) prevents strobe effect at 40 Hz flow state (25ms cycle reads as shimmer)"
  - "Uint8Array allocated lazily on first live frame — avoids allocation when analyserRef.current is null at effect start"

patterns-established:
  - "FrequencyBars props: { playing, analyserRef, color } — analyserRef is ref object, access .current inside rAF only"
  - "Static fallback always renders something (min 2px bars) — no blank canvas states"

requirements-completed: [AVIZ-01, AVIZ-02]

# Metrics
duration: 1min
completed: 2026-03-11
---

# Phase 3 Plan 01: Audio Visualization Summary

**Real-time 40-bar FFT frequency visualizer replacing Lissajous, with beat-frequency-synced play button glow (5/10/40 Hz per state)**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-11T03:27:44Z
- **Completed:** 2026-03-11T03:28:55Z
- **Tasks:** 2
- **Files modified:** 3 (+ 1 created, 1 deleted)

## Accomplishments
- FrequencyBars.jsx: 40-bar canvas visualizer reading real FFT data from AnalyserNode when audio plays
- Static fallback bars render at low opacity when audio off — no empty canvas states ever
- Play button glow ring now pulses at exact binaural beat frequency (frozen=200ms, anxious=100ms, flow=25ms shimmer)
- LissajousVisualizer.jsx removed — codebase now 104 lines lighter

## Task Commits

Each task was committed atomically:

1. **Task 1: Create FrequencyBars component and beatPulse keyframe** - `b3f53f4` (feat)
2. **Task 2: Wire FrequencyBars into AudioPlayer and add beat glow** - `8c35dea` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `regulation-station/src/components/FrequencyBars.jsx` - New: 40-bar canvas FFT visualizer with smoothing and static fallback
- `regulation-station/src/components/AudioPlayer.jsx` - Updated: FrequencyBars swap, analyserRef destructured, beat-synced glow
- `regulation-station/src/index.css` - Added: @keyframes beatPulse animation
- `regulation-station/src/components/LissajousVisualizer.jsx` - Deleted

## Decisions Made
- Sampled lower 60% of FFT bins (614 of 1024): binaural tones + pink noise concentrate here; upper bins would show near-zero for this audio graph
- beatPulse opacity range 0.25..0.75 prevents strobe artifacts at 40 Hz flow state (25ms period reads as a soft shimmer at this opacity swing, not a flash)
- Uint8Array allocated lazily on first non-null analyserRef frame rather than at effect start — avoids an allocation that would be wasted when paused
- Pre-seeded fallback array has 16 non-uniform values that tile across 40 bars, giving natural-looking variety without RNG

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. Lint count went from 45 to 44 problems (one fewer because LissajousVisualizer import was removed). All 44 remaining are pre-existing issues unrelated to this plan.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- FrequencyBars component ready to receive color changes on state switch without crash (effect re-runs on color change)
- analyserRef pattern established — Phase 4 ambient particles can use same tap point if needed
- Audio UI now visually honest: what you see reflects what you hear

---
*Phase: 03-audio-visualization*
*Completed: 2026-03-11*

## Self-Check: PASSED

- FrequencyBars.jsx: FOUND
- AudioPlayer.jsx: FOUND
- index.css: FOUND
- LissajousVisualizer.jsx: DELETED (confirmed)
- 03-01-SUMMARY.md: FOUND
- Commit b3f53f4: FOUND
- Commit 8c35dea: FOUND
