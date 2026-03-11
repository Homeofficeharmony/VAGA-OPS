# Phase 7: Breath Phase Signal Wire - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire live breath phase signal from ImmersionContainer to NeuralBackground particles so they visibly respond to inhale/exhale/hold. Fix two blank cosmetic fields in AudioPlayer (Hz badge, description line). No new features, no new components — only signal wiring and data fixes.

</domain>

<decisions>
## Implementation Decisions

### Particle breath response
- Speed only — no opacity, count, or glow changes per phase
- Inhale multiplier: 1.5× baseline speed; exhale at 1× baseline
- Smooth interpolation: speed ramps toward target over ~1–2 seconds on phase transition (not an instant snap)
- Feels organic — field breathes with the user, not reacting to a trigger

### Hold phase behavior
- Plateau at inhale speed — particles maintain the elevated 1.5× speed until exhale begins
- No new logic needed; hold simply doesn't change the speed target

### AudioPlayer description fix
- Add a `description` string to each audio object in `stateData.js` — a short atmospheric one-liner per state
- The description paragraph below the track name reads from `audio.description`
- Remove the redundant top Hz badge (`audio.hz` line) — the detailed `track.carrierHz · track.beatHz` display in Tier 1 already covers this

### Claude's Discretion
- Exact `description` copy for each of the three audio objects (frozen, anxious, flow) — keep atmospheric, ~10 words
- Callback prop name on ImmersionContainer for signaling breathPhase changes to App.jsx
- Whether to interpolate via a lerp multiplier in the rAF loop or via a separate `useEffect` + ref (consistent with breathPhaseRef pattern from Phase 4)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ImmersionContainer.jsx:311` — `breathPhase` already computed internally (`inhale | hold | exhale`) via breath hook; just needs to surface it via callback
- `NeuralBackground.jsx:7` — accepts `breathPhase` prop with default `'inhale'`; passes it into `ParticleField`
- `App.jsx:250` — `breathPhase="inhale"` hardcoded today; becomes `breathPhase={breathPhase}` from state

### Established Patterns
- Phase 4 decision: `breathPhaseRef` updated via separate `useEffect` to avoid stale closure in rAF callback — use same pattern for interpolated speed target
- Particles stored in `useRef` (not `useState`) to prevent re-render churn in rAF loop
- Callbacks passed down for event signaling (see `onComplete`, `onClose` pattern throughout App.jsx)

### Integration Points
- `ImmersionContainer.jsx` — add `onBreathPhaseChange` (or similar) callback prop; fire it on each `breathPhase` transition (not on every rAF tick — only when value changes)
- `App.jsx` — add `breathPhase` state, wire `setBreathPhase` into ImmersionContainer callback, pass live value to NeuralBackground
- `NeuralBackground.jsx` / `ParticleField` — use `breathPhaseRef` to drive a speed multiplier lerp in the rAF loop
- `stateData.js` — add `description` field to each of the three `audio` objects (frozen, anxious, flow)
- `AudioPlayer.jsx:91` — remove the Hz badge div that reads `{audio.hz}`

</code_context>

<specifics>
## Specific Ideas

- "Speed only" — the subtlety is intentional; the particle effect should be felt in peripheral vision, not demand attention
- 1.5× is the ceiling — don't push faster even if hold is long; plateau is the right behavior
- Description copy should feel like AudioPlayer's existing `audio.title` tone — evocative, not clinical

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-breath-signal-wire*
*Context gathered: 2026-03-11*
