# Phase 6: Animation Polish - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Make state selection and tab navigation feel intentional and alive — transitions communicate meaning, not just movement. Three deliverables: (1) full page environment transitions when switching nervous system states, (2) StateSelector active card expands with deliberate layout animation, (3) tab content animates in cleanly on tab switch.

No new features, no new audio, no new layout — only motion that makes existing interactions feel grounded.

</domain>

<decisions>
## Implementation Decisions

### State environment transition
- **Staggered transition**: Background and ImmersionBackground color field transition first (~0–400ms), then cards and accent elements follow (~400–900ms)
- **Timing**: Deliberate — 600–900ms total. Communicates that selecting a state is a meaningful choice, not an accidental tap
- **Scope**: All elements using `stateData.accentHex` (border glows, status indicators, accent dots, buttons) transition to the new accent color, not just the wrapper
- **Card participation in transition**: Claude's discretion — pick the most natural approach given the existing CSS spring on the active card
- **Accent color implementation**: Claude's discretion — pick whatever is most maintainable given the existing CSS custom property + inline style mix

### Tab content animation
- **Style**: Fade + slight upward rise (~12px translate Y) — new content fades in while lifting gently. No directional slide.
- **Speed**: Medium, 250–350ms — noticeable but not slow, consistent with existing framer-motion usage in the app
- **First mount**: No animation on page load — only animate on tab switch. Regulate tab just appears on startup.
- **Container vs content**: Claude's discretion — animate the container immediately rather than waiting for content to render

### Claude's Discretion
- Active card participation logic during state switch (how StateSelector cards deactivate/activate)
- CSS transition vs framer-motion for accent color changes across elements
- Exact easing curves within the deliberate 600–900ms envelope
- How many milliseconds of stagger between background and content layers
- Whether to delete `transition-opacity duration-200` from tab wrapper divs in App.jsx once AnimatePresence handles it

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `framer-motion` — already installed (v12.34.5), already used in `BreathingOrb` (AnimatePresence mode="wait"), `TabBar` (motion.div), `AmbientSoundscape`, `RegulationDepthMeter`
- `StateSelector.jsx:84` — existing `transition: 'transform 0.45s cubic-bezier(0.34, 1.4, 0.64, 1)'` spring on active card expansion already in place
- `App.jsx:229` — outer wrapper already has `transition-colors duration-1000` for background — this is the foundation to build the staggered transition on top of
- `ImmersionBackground.jsx` — comment says "no framer-motion, uses inline styles + RAF" — color field transitions are already CSS/inline

### Established Patterns
- framer-motion used for discrete enter/exit animations (`AnimatePresence`), not continuous motion
- CSS transitions used for color/opacity/transform on persistent elements (StateSelector cards, buttons)
- `stateData.accentHex` is the source of truth for state-reactive colors — passed as prop, used in inline styles
- Tab content currently rendered with `{activeTab === 'x' && ...}` conditional — no AnimatePresence wrapper yet
- `BreathingOrb.jsx:77` — `<AnimatePresence mode="wait">` with `motion.h3` is the reference pattern for enter/exit transitions

### Integration Points
- `App.jsx:229` — outer wrapper `transition-colors duration-1000` — already transitions background color; extend stagger here
- `App.jsx:276,364,402` — three tab content blocks — wrap each in `<motion.div>` inside an `AnimatePresence` keyed to `activeTab`
- `StateSelector.jsx` — active card spring already handles expansion; accent color transition may need CSS `transition` added to border/shadow inline styles
- All elements using `stateData.accentHex` directly in inline styles — adding `transition: 'color 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease'` propagates the stagger effect

</code_context>

<specifics>
## Specific Ideas

- Tab entrance: fade + ~12px upward translate, 250–350ms — "content arrives" feel
- State transition: background/color-field moves first, content layer follows ~400ms later — like the environment sets itself before the UI catches up
- No animation on app startup — regulate tab just appears. Transitions only trigger on user action.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-animation-polish*
*Context gathered: 2026-03-11*
