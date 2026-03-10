# Phase 3: Audio Visualization - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

The audio UI reflects what is actually playing — users can see the binaural signal and feel the beat frequency through visual feedback. Two deliverables: (1) beat-reactive glow on the play button pulsing at the binaural beat frequency, and (2) real-time frequency bar visualization driven by AnalyserNode data. No new audio features, no ambient engine visualization — just making the existing binaural audio visible.

</domain>

<decisions>
## Implementation Decisions

### Visualization placement
- Frequency bars fully replace the current Lissajous visualizer — one visualization, driven by real audio data
- Same canvas slot: full-width x h-48 (192px), no layout changes to AudioPlayer panel
- When audio is off, show static low-opacity bars as a decorative fallback (not empty space)
- Keep L/R channel Hz labels and "Live" dot indicator overlaid on the visualization area

### Visualization type
- Vertical bars rising from bottom — classic frequency spectrum style
- 32-48 bars, each ~4-6px wide with 2px gaps
- Solid state accent color (sage/gold/terracotta) — bars may have slight opacity gradient (brighter at peak, dimmer at base)
- Smooth movement with exponential decay — bars rise quickly to peaks, fall gradually. Organic, calm feel matching the regulation app vibe

### Claude's Discretion
- Beat-reactive glow implementation on the play button (pulsing opacity, expanding ring, color intensity — whatever looks best at the binaural beat frequency)
- Exact smoothing/decay constants for bar animation
- How many frequency bins to sample vs. average from the 1024 available bins
- Static fallback bar heights and opacity levels
- Whether LissajousVisualizer.jsx gets deleted or kept as dead code for potential future use

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useAudioEngine.js` — already exposes `analyserRef` with AnalyserNode connected after master gain (FFT size 2048, 1024 bins)
- `AudioPlayer.jsx` — existing panel layout with 3 tiers (track identity, visualizer+controls, queue)
- `LissajousVisualizer.jsx` — canvas component being replaced; can reference its canvas setup pattern (ref, rAF loop, cleanup)
- `src/utils/grain.js` — grain overlay style already used in AudioPlayer panel

### Established Patterns
- Canvas visualization via `requestAnimationFrame` loop with cleanup on unmount (see LissajousVisualizer)
- State accent colors accessed via `stateData.accentHex` or the `accentColor` map in AudioPlayer
- Audio hooks return object with named values: `{ playing, play, pause, volume, analyserRef, ... }`
- No external visualization libraries — native canvas only

### Integration Points
- `AudioPlayer.jsx` line 174 — `<LissajousVisualizer>` component swap point for new `<WaveformBars>` (or similar)
- `useAudioEngine.analyserRef` — AnalyserNode for `getByteFrequencyData()` calls in the visualization rAF loop
- Play button (line 266-305) — glow/pulse effect hooks into `beatHz` from active track for beat-synced animation
- `stateData.audio.tracks[activeTrack].beatHz` — 5 Hz (frozen), 10 Hz (anxious), 40 Hz (flow) drives pulse timing

</code_context>

<specifics>
## Specific Ideas

No specific references — user selected recommended options across all decisions. The visualization should feel honest (what you see = what you hear) and calm (smooth decay, not jarring).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-audio-visualization*
*Context gathered: 2026-03-10*
