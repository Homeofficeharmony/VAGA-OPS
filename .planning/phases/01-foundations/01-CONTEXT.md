# Phase 1: Foundations - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Shared utilities that every subsequent phase depends on: a content rotation hook, chart data transform functions, AnalyserNode wiring on both audio engines, and a shared grain texture utility. No consumer components are built in this phase — only the utilities they will import.

</domain>

<decisions>
## Implementation Decisions

### Content rotation logic
- Midnight local time is the rotation boundary — content advances each calendar day
- Hook returns a date-stable index that does not change within a session
- No re-roll / manual override in the hook API (strictly one selection per day)

### Chart data shapes
- Pure transform functions that output plain data objects (`{x, y, label, color}`)
- Support two time windows: 7-day and 30-day
- Input is the existing session array from `useSessionLog.js`
- No SVG path generation — chart rendering is Phase 5's responsibility

### Grain texture
- Extract the existing inline `GRAIN_BG` SVG from `AudioPlayer.jsx` (fractalNoise, baseFrequency 0.78, opacity 0.09)
- File location: `src/utils/grain.js`
- Export both the raw data URI constant and a `grainOverlayStyle` object (`{backgroundImage, backgroundSize, opacity, mixBlendMode}`)
- Fixed sensible defaults; consumers can spread and override individual properties
- Pure utility — no React component export

### AnalyserNode wiring
- Tap point: after master gain node (reflects volume — visualizations match what users hear)
- One AnalyserNode per engine — `useAudioEngine` and `useAmbientEngine` each create and expose their own
- FFT size: 2048 (1024 frequency bins, ~21 Hz resolution at 44.1kHz)
- Created eagerly as part of the audio graph build — always available when audio is playing
- Return value: `analyserNode` (non-null when active, null when inactive)
- No cross-engine coupling — each analyser is independent

### Claude's Discretion
- Content rotation: deterministic (date hash) vs random-but-pinned approach
- Content rotation: independent rotation per content category vs unified daily seed
- Chart data: which specific transform functions to create (guided by DVIZ-01 and DVIZ-02 requirements)
- Chart data: whether to include state-segmented series alongside combined data

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AudioPlayer.jsx:11` — inline `GRAIN_BG` constant (SVG data URI) to extract into `grain.js`
- `useSessionLog.js` — session data shape with `date`, `state`, `shift`, `activationBefore`, `activationAfter`, `activationDelta`, `flowMinutes`, `type`, `durationSec`
- `getDailyStats()` in `useSessionLog.js` — existing pattern for session data transforms

### Established Patterns
- Hooks return object with named values: `{ playing, play, pause, volume, ... }`
- Audio graph built in a `buildGraph` callback, torn down in `teardown` callback
- Both audio engines use `masterGainRef` for volume control — AnalyserNode inserts between this and `ctx.destination`
- No external libraries for audio or visualization — all Web Audio API and native canvas/SVG

### Integration Points
- `useAudioEngine.buildGraph()` — insert AnalyserNode after `master.connect(ctx.destination)` becomes `master → analyser → destination`
- `useAmbientEngine` start methods (startForest, startOcean, startBinaural) — same pattern, `master → analyser → destination`
- `AudioPlayer.jsx` — will need to import from `grain.js` instead of inline constant (Phase 1 cleanup, not new feature)
- Phase 2 consumers will import `useContentRotation` for tips, breath cues, protocols
- Phase 3 consumers will read `analyserNode` from audio hooks for visualizations
- Phase 5 consumers will import from `chartData.js` for data visualization

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User selected recommended options for most decisions and deferred implementation details to Claude's discretion.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundations*
*Context gathered: 2026-03-09*
