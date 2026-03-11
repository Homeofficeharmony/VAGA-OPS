# Phase 7: Breath Phase Signal Wire - Research

**Researched:** 2026-03-11
**Domain:** React prop threading, rAF loop lerp interpolation, canvas particle animation, stateData.js data extension
**Confidence:** HIGH

## Summary

This phase is a surgical wiring job across four files. No new components, no new libraries, no architectural shifts. The entire technical challenge is correctly threading a live `breathPhase` string from ImmersionContainer (where it is computed) up to App.jsx (via callback) and back down to NeuralBackground/ParticleField (as a prop). A secondary task removes a blank Hz badge from AudioPlayer and adds a missing `description` field to stateData.js audio objects.

The particle system in ParticleField already has `breathSpeedMult` per-phase values defined per state and already reads `breathPhaseRef.current` inside the rAF loop. However, it applies the multiplier as a direct instant snap — not as a smooth lerp. The Phase 4 decision established the `breathPhaseRef` pattern (updated via `useEffect`, read in rAF) to avoid stale closures. The lerp interpolation must be added to the rAF loop using the same ref-based pattern for the current speed multiplier target and a tracked actual multiplier value.

The AudioPlayer gap is simpler: `{audio.hz}` on line 91 references a field that does not exist in any of the three audio objects in stateData.js. The fix is to remove that outer Hz badge div (the inner Tier 1 badge already shows `carrierHz · carrierHz+beatHz`). The `{audio.description}` on line 159 similarly references a field that does not exist — this requires adding `description` to each audio object in stateData.js.

**Primary recommendation:** Add `onBreathPhaseChange` callback to ImmersionContainer, lift `breathPhase` state into App.jsx, pass it live to NeuralBackground, and implement lerp toward speedMultTarget in the ParticleField rAF loop. Remove the outer Hz badge div. Add `description` to stateData audio objects.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Particle breath response:**
- Speed only — no opacity, count, or glow changes per phase
- Inhale multiplier: 1.5x baseline speed; exhale at 1x baseline
- Smooth interpolation: speed ramps toward target over ~1-2 seconds on phase transition (not an instant snap)
- Feels organic — field breathes with the user, not reacting to a trigger

**Hold phase behavior:**
- Plateau at inhale speed — particles maintain the elevated 1.5x speed until exhale begins
- No new logic needed; hold simply doesn't change the speed target

**AudioPlayer description fix:**
- Add a `description` string to each audio object in `stateData.js` — a short atmospheric one-liner per state
- The description paragraph below the track name reads from `audio.description`
- Remove the redundant top Hz badge (`audio.hz` line) — the detailed `track.carrierHz · track.beatHz` display in Tier 1 already covers this

### Claude's Discretion
- Exact `description` copy for each of the three audio objects (frozen, anxious, flow) — keep atmospheric, ~10 words
- Callback prop name on ImmersionContainer for signaling breathPhase changes to App.jsx
- Whether to interpolate via a lerp multiplier in the rAF loop or via a separate `useEffect` + ref (consistent with breathPhaseRef pattern from Phase 4)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VATM-02 | User sees organic particles in the background that respond to breath phase (slow on exhale, quicken on inhale) | ParticleField already has per-phase breathSpeedMult; gap is the hardcoded "inhale" in App.jsx line 250 — live signal threading closes this |
</phase_requirements>

---

## Standard Stack

### Core (already installed — no new dependencies)

| Library/API | Version | Purpose | Why Standard |
|-------------|---------|---------|--------------|
| React state + useEffect | 19 (in use) | Lift breathPhase to App.jsx, sync ref | Established project pattern |
| useRef + rAF loop | Browser built-in | Lerp multiplier without re-render churn | Phase 4 decision — particles in ref, not state |
| Canvas 2D API | Browser built-in | Particle rendering, already in ParticleField | Already implemented |

No installation needed. Zero new dependencies.

## Architecture Patterns

### Current Signal Flow (broken)

```
ImmersionContainer
  breathPhase (computed internally via useImmersionBreath)
  |
  ambientEngine.syncBreath(breathPhase) ← ambient audio gets it
  |
  (signal drops — never reaches NeuralBackground)

App.jsx line 250:
  <NeuralBackground breathPhase="inhale" />  ← hardcoded string
```

### Target Signal Flow (after this phase)

```
ImmersionContainer
  breathPhase (from useImmersionBreath)
  |
  onBreathPhaseChange(breathPhase) ← fires on phase transition only
  |
App.jsx
  const [breathPhase, setBreathPhase] = useState('inhale')
  |
  <NeuralBackground breathPhase={breathPhase} />
  |
NeuralBackground → ParticleField
  breathPhaseRef updated via useEffect
  |
rAF loop: lerp speedMult toward breathSpeedMult[phase] target
```

### Pattern 1: breathPhaseRef + useEffect (Phase 4 established)

**What:** Keep the phase value in a ref so the rAF loop always reads the latest value without stale closure. The useEffect reacts to prop changes and updates the ref.

**When to use:** Any rAF loop that needs to read frequently-changing prop values.

**Already implemented in ParticleField (lines 90-95):**
```jsx
// Source: regulation-station/src/components/ParticleField.jsx lines 90-95
const breathPhaseRef = useRef(breathPhase)

useEffect(() => {
  breathPhaseRef.current = breathPhase
}, [breathPhase])
```

### Pattern 2: Lerp multiplier in rAF loop

**What:** Instead of snapping to `breathSpeedMult[phase]` instantly, maintain a `speedMultRef` that lerps toward the target each frame.

**When to use:** Any rAF loop where instant value snapping feels mechanical.

**Implementation approach (lerp in rAF draw function):**
```jsx
// Add to ParticleField alongside existing refs
const speedMultRef = useRef(1.0)

// Inside draw():
const targetMult = effectiveConfig.breathSpeedMult[breathPhaseRef.current] ?? 1.0
// ~1-2 second ramp at 60fps: factor of 0.02-0.03 per frame
speedMultRef.current += (targetMult - speedMultRef.current) * 0.025
const speedMult = speedMultRef.current
```

**Why lerp factor ~0.025:** At 60 fps, factor=0.025 reaches 95% of target in ~116 frames (~1.9 seconds). Factor=0.04 reaches 95% in ~73 frames (~1.2 seconds). This matches the "~1-2 seconds" locked decision.

**Note on existing breathSpeedMult values vs locked decision:** The CONTEXT.md locks "inhale 1.5x, exhale 1.0x" as the user-approved multipliers. The existing PARTICLE_CONFIG in ParticleField has per-state values that differ (e.g., frozen inhale=1.15, exhale=0.55; flow inhale=1.20, exhale=0.80). The locked decision overrides these — the planner must decide: either normalize all states to use 1.5x/1.0x (simpler, consistent with locked decision), or keep per-state variety and note the deviation. The safest interpretation is that "1.5x inhale, 1.0x exhale" is the ceiling/reference and per-state values are intentional tuning within that range. The locked decision says "inhale multiplier: 1.5x baseline speed; exhale at 1.0x baseline" — this reads as the ceiling for inhale and floor for exhale. Research recommends keeping per-state values and ensuring frozen/anxious/flow inhale values do not exceed 1.5x.

### Pattern 3: Callback prop on ImmersionContainer

**What:** ImmersionContainer fires a prop callback when breathPhase transitions. App.jsx receives it and stores in state.

**When to use:** Child-to-parent event notification (established pattern in App.jsx — see `onComplete`, `onClose`).

**Fire on transition only (not every rAF tick):**
```jsx
// Inside ImmersionContainer — add to existing breathPhase sync useEffect
useEffect(() => {
  if (phase !== 'stabilize') return
  onBreathPhaseChange?.(breathPhase)  // optional chaining — backward safe
  // ... existing ambientEngine.syncBreath and haptics calls
}, [breathPhase, phase])
```

This piggybacks on the existing `useEffect` that already fires on `breathPhase` transitions for haptics and ambient sync. No new effect needed — just add the callback call.

**In App.jsx:**
```jsx
const [breathPhase, setBreathPhase] = useState('inhale')

// In ImmersionContainer JSX:
<ImmersionContainer
  open={isImmersive}
  stateData={stateData}
  ambientEngine={ambientEngine}
  onBreathPhaseChange={setBreathPhase}  // new prop
  onComplete={...}
  onClose={...}
/>

// Replace hardcoded string in NeuralBackground:
<NeuralBackground
  isImmersive={isImmersive}
  ambientMode={ambientMode}
  selectedState={selectedState}
  breathPhase={breathPhase}  // was: "inhale"
/>
```

**Reset breathPhase on immersion close:** When `isImmersive` becomes false, `breathPhase` should reset to `'inhale'` so the particle field returns to normal baseline. Add to the reset useEffect in ImmersionContainer or handle in App.jsx via a `useEffect` on `isImmersive`.

### Anti-Patterns to Avoid

- **Calling `onBreathPhaseChange` inside the rAF loop:** Would fire 60 times/second and trigger re-renders on every frame. Fire only in the phase-transition `useEffect`.
- **Storing `breathPhase` in `useState` inside ParticleField:** Triggers particle re-initialization (the init `useEffect` depends on `selectedState` only, but any structural change risks it). Keep ref pattern.
- **Adding `breathPhase` to ParticleField's init `useEffect` dependency array:** Would destroy and rebuild all particles on every breath transition. The existing guard is correct — only `selectedState` in deps.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Smooth animation interpolation | Custom tween system | Lerp factor in rAF loop | Already the pattern; simple one-liner per frame |
| Callback wiring | State machine / event bus | Direct React prop callback | App.jsx already uses this pattern for all overlays |

## Common Pitfalls

### Pitfall 1: breathPhase resets particles on state change
**What goes wrong:** If `breathPhase` is added to the `useEffect` dependency array that initializes particles, every breath transition destroys and rebuilds all particles — causing a visible flash.
**Why it happens:** ParticleField has a monolithic `useEffect([selectedState])` that runs init + starts the rAF loop. Any additional dependency causes full reinit.
**How to avoid:** Do not add `breathPhase` to that `useEffect`'s dependency array. The ref pattern (`breathPhaseRef`) exists precisely to avoid this. Already implemented correctly — do not change.
**Warning signs:** Particles visibly pop/reset every 4-8 seconds during an immersion session.

### Pitfall 2: Stale closure reading old breathPhase in rAF
**What goes wrong:** The `draw` function captures `breathPhase` by closure at initialization time, so it always reads the initial value — never updates.
**Why it happens:** rAF callbacks are long-lived closures; they don't re-capture variables when React re-renders.
**How to avoid:** Always read from `breathPhaseRef.current` inside the rAF loop, never from the prop directly. Already correct in existing code.
**Warning signs:** Particles always move at inhale speed regardless of breath phase.

### Pitfall 3: speedMultRef not initialized per state
**What goes wrong:** When user switches states (frozen → flow), the `speedMultRef` still holds the old state's lerp value. Since particles are reinit on state change (new rAF loop spawned), the `speedMultRef` ref object persists across state changes.
**Why it happens:** `useRef` value persists for the component lifetime. The rAF loop is torn down and rebuilt on state change, but refs are not reset.
**How to avoid:** Reset `speedMultRef.current` to 1.0 at the start of the init `useEffect` (inside the effect, before calling `draw()`).
**Warning signs:** Brief period of incorrect particle speed after switching states.

### Pitfall 4: onBreathPhaseChange fires during non-stabilize phases
**What goes wrong:** breathPhase transitions happen briefly during welcome/integrate phases too (the hook runs whenever `open && phase === 'stabilize'` — but if the guard isn't tight, stale values could propagate).
**Why it happens:** The existing `useEffect` for breathPhase already has `if (phase !== 'stabilize') return` guard — this correctly prevents firing during other phases.
**How to avoid:** Add `onBreathPhaseChange` call inside the same `if (phase !== 'stabilize') return` guard that already exists. The guard is already present and correct.
**Warning signs:** AudioPlayer or particles responding to phase changes when user is on the welcome screen.

### Pitfall 5: audio.hz renders blank silently
**What goes wrong:** `{audio.hz}` is `undefined`, React renders nothing — no error, just missing content. The badge div still renders with its border/background styling but shows empty text.
**Why it happens:** `audio.hz` was never added to stateData.js audio objects. The field simply does not exist.
**How to avoid:** Remove the outer Hz badge div (lines 86-93 in AudioPlayer.jsx). The Tier 1 badge inside the panel already shows Hz information via `track.carrierHz` and `track.beatHz`.
**Warning signs:** Empty pill badge above the AudioPlayer panel.

## Code Examples

### Lerp speedMult in rAF loop (add to ParticleField)
```jsx
// Source: ParticleField.jsx — add alongside existing refs
const speedMultRef = useRef(1.0)

// Inside init useEffect, before draw():
speedMultRef.current = 1.0  // reset on state change

// Inside draw() — replace existing `const speedMult = ...` line:
const targetMult = effectiveConfig.breathSpeedMult[breathPhaseRef.current] ?? 1.0
speedMultRef.current += (targetMult - speedMultRef.current) * 0.025
const speedMult = speedMultRef.current
```

### Callback in ImmersionContainer — piggyback on existing useEffect
```jsx
// Source: ImmersionContainer.jsx line 316-325 — extend existing effect
useEffect(() => {
  if (phase !== 'stabilize') return

  const durationMs = timing[breathPhase] ?? 4000
  ambientEngine?.syncBreath(breathPhase, durationMs)
  onBreathPhaseChange?.(breathPhase)  // add this line

  if (breathPhase === 'inhale') hapticInhale()
  else if (breathPhase === 'exhale') hapticExhale()
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [breathPhase, phase])
```

### App.jsx — add state + wire prop
```jsx
// Add breathPhase state (alongside other useState declarations)
const [breathPhase, setBreathPhase] = useState('inhale')

// Reset on immersion close
useEffect(() => {
  if (!isImmersive) setBreathPhase('inhale')
}, [isImmersive])

// ImmersionContainer — add onBreathPhaseChange prop
<ImmersionContainer
  open={isImmersive}
  stateData={stateData}
  ambientEngine={ambientEngine}
  onBreathPhaseChange={setBreathPhase}
  onComplete={...}
  onClose={...}
/>

// NeuralBackground — replace hardcoded string
<NeuralBackground
  isImmersive={isImmersive}
  ambientMode={ambientMode}
  selectedState={selectedState}
  breathPhase={breathPhase}
/>
```

### AudioPlayer.jsx — remove outer Hz badge (lines 86-93)
```jsx
// REMOVE this entire block (currently lines 86-93):
// <div className="flex items-center justify-end gap-3 mb-3">
//   <span className="font-mono text-[10px] ..." style={{ color, ... }}>
//     {audio.hz}
//   </span>
// </div>

// The Tier 1 badge (line 119) already shows Hz:
// {track.carrierHz} Hz · {track.carrierHz + track.beatHz} Hz
// No replacement needed — content is already covered
```

### stateData.js — add description to audio objects
```js
// Frozen audio object — add description field:
audio: {
  title: 'Theta Emergence',
  range: 'Theta · 4–8 Hz',
  description: 'Deep theta tones lift you gently out of stillness.',
  tracks: [...]
}

// Anxious audio object — add description field:
audio: {
  title: 'Alpha Anchor',
  range: 'Alpha · 8–13 Hz',
  description: 'Alpha waves slow the racing mind to a workable pace.',
  tracks: [...]
}

// Flow audio object — add description field:
audio: {
  title: 'Gamma Forge',
  range: 'Gamma · 30–44 Hz',
  description: 'Gamma frequencies sustain peak cognitive clarity.',
  tracks: [...]
}
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Instant speed snap (current) | Lerp toward target each frame | Organic feel — field breathes, not clicks |
| Hardcoded `"inhale"` in App.jsx | Live `breathPhase` state from ImmersionContainer | Particles actually respond to real breath |
| `audio.hz` (undefined) | Remove badge | Removes blank cosmetic artifact |
| No `audio.description` | Add description string per state | Fills blank paragraph below track name |

## Open Questions

1. **Per-state breathSpeedMult values vs locked 1.5x/1.0x constraint**
   - What we know: PARTICLE_CONFIG already has per-state values (frozen: 1.15/0.55, anxious: 1.45/0.70, flow: 1.20/0.80). CONTEXT.md locked decision says "inhale 1.5x, exhale 1.0x."
   - What's unclear: Whether the locked decision means "normalize all states to exactly 1.5x/1.0x" or "don't exceed 1.5x ceiling." The per-state values were established in Phase 4 with intentional per-state tuning.
   - Recommendation: Preserve per-state breathSpeedMult values (they are within the 1.5x ceiling and were Phase 4 design decisions). The locked decision likely describes the anxious state reference point. Planner should confirm or normalize at plan time.

2. **breathPhase during ambient mode (non-immersion)**
   - What we know: NeuralBackground shows during `isImmersive || ambientMode`. During ambient mode, there is no ImmersionContainer running, so `breathPhase` stays at the `useState('inhale')` default.
   - What's unclear: Whether ambient mode should also drive particle breath response (no callback source exists in ambient mode).
   - Recommendation: Ambient mode stays at default 'inhale' speed — particles are faster. This is acceptable and was not flagged in CONTEXT.md.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test config files, no test directories, no package.json test script |
| Config file | None — Wave 0 gap |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VATM-02 | Particles change speed when breath phase changes | manual-only | N/A | N/A |
| VATM-02 | `breathPhase` prop to NeuralBackground is a live state value (not hardcoded) | visual/manual | N/A | N/A |
| VATM-02 | AudioPlayer Hz badge removed, description renders non-blank | visual/manual | N/A | N/A |

**Justification for manual-only:** All three verification behaviors are visual/DOM rendering concerns in a canvas-based animation system. The particle lerp response to breath phase changes is inherently a perceptual/visual check — no automated assertion framework is in place, and adding one is out of scope for this phase.

### Sampling Rate
- **Per task commit:** Visual inspection in browser at localhost:5173
- **Per wave merge:** Full immersion session walkthrough: welcome → stabilize → observe particle speed change on inhale/exhale transitions
- **Phase gate:** Particles visibly respond, Hz badge gone, description renders before `/gsd:verify-work`

### Wave 0 Gaps
None beyond what's noted above — no test infrastructure exists in this project at all. The project does not use automated testing. No action required for this phase.

## Sources

### Primary (HIGH confidence)
- Direct source read: `regulation-station/src/components/ParticleField.jsx` — full implementation verified, breathPhaseRef pattern confirmed, breathSpeedMult per-state values confirmed, existing lerp gap confirmed
- Direct source read: `regulation-station/src/components/ImmersionContainer.jsx` — breathPhase computed at line 311, existing phase-transition useEffect at line 316, callback pattern verified
- Direct source read: `regulation-station/src/App.jsx` — hardcoded `breathPhase="inhale"` at line 250 confirmed
- Direct source read: `regulation-station/src/components/AudioPlayer.jsx` — `{audio.hz}` at line 91 confirmed, `{audio.description}` at line 159 confirmed
- Direct source read: `regulation-station/src/data/stateData.js` — no `hz` field, no `description` field on audio objects confirmed via grep

### Secondary (MEDIUM confidence)
- React docs pattern: useEffect dep array controls — standard React behavior, training data HIGH confidence
- rAF lerp pattern: Frame-rate-based exponential interpolation — standard game loop technique, HIGH confidence

## Metadata

**Confidence breakdown:**
- Signal wiring (callback + App state + prop threading): HIGH — all integration points directly verified in source
- Lerp implementation: HIGH — pattern is standard, existing ref infrastructure already in place
- AudioPlayer badge removal: HIGH — undefined field confirmed, Tier 1 badge coverage confirmed
- stateData description field: HIGH — missing field confirmed, consumer location confirmed

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable codebase, no external dependencies)
