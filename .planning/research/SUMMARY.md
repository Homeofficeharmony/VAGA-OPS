# Project Research Summary

**Project:** Nervous System Ops Pack — Visual & Experience Refresh
**Domain:** Calm-tech / Nervous system regulation dashboard (React 19 + Vite 7 + Tailwind 3 PWA)
**Researched:** 2026-03-09
**Confidence:** HIGH

## Executive Summary

This is an enhancement milestone on an existing, shipping calm-tech PWA — not a greenfield build. The product already has a strong foundation: three-state polyvagal model, binaural audio engine, ambient soundscape, breath-synced immersion, and session logging. The research task is to close the gap between the current experience and what competitors like Calm, Balance, and Breathwrk deliver in terms of visual polish, content freshness, and data storytelling. The recommended approach is additive and zero-dependency: every capability area (animations, data viz, audio visualization, atmospheric effects, content rotation) can be delivered by extending what is already installed — framer-motion 12 for UI transitions, native SVG for charts, Web Audio AnalyserNode for audio reactivity, CSS keyframes for atmosphere, and a lightweight custom hook for content rotation.

The single most important constraint shaping all decisions is the 700kB JS bundle ceiling. The current bundle is approximately 656kB, leaving only 44kB of headroom. This rules out every charting library (Recharts 180kB, D3 300kB), every additional animation library (GSAP 90kB), and any 3D/canvas framework (Three.js 600kB). This is not a problem — it is a clarifying constraint. The correct implementation path is already used in parts of the codebase: raw SVG in JSX for charts, the existing RAF loop for audio visualization, CSS custom properties for theming, and date-seeded indices for rotation.

The key risk is not technical difficulty but rather behavioral: atmospheric effects, content rotations, and visual novelty that are appropriate on a browse dashboard become harmful inside an active regulation session. Research shows competitors make this mistake too — but for this product it is especially critical. A janky breath orb or a tip that flips mid-exhale directly undermines the regulation purpose. Every new feature must distinguish between dashboard context (browsing, safe to animate freely) and immersion context (regulating, stillness is the feature). This distinction should drive every phase decision.

## Key Findings

### Recommended Stack

The stack is already decided. Framer Motion 12.34.5 is installed and used in `BreathingOrb.jsx`. The Web Audio API with OscillatorNode, GainNode, and AnalyserNode covers all audio needs. Native SVG in JSX covers all chart types needed (line, area, radial, bar). CSS keyframes and custom properties handle all atmospheric effects. A custom `useContentRotation` hook with date-seeded LCG handles content rotation without any library.

**Core technologies:**
- framer-motion 12 (already installed): UI shell transitions — `AnimatePresence`, `motion.*`, `staggerChildren`. Not for breath-driven animations.
- Web Audio API AnalyserNode (browser built-in): Insert into existing audio graph to feed real frequency data to canvas visualizers. Zero bundle cost.
- Native SVG in JSX: All session history charts. Follows the existing sparkline pattern in `VagusLogSidebar`. ~5kB per chart component.
- CSS keyframes + custom properties: All atmospheric effects and loops. Runs on the compositor thread, no JS overhead.
- `useContentRotation` hook (new, ~20 lines): Date-seeded daily rotation; session-stable indices. localStorage persistence under `vaga-rotation-{date}`.

The critical non-decision: do NOT add Recharts, D3, Victory, Chart.js, GSAP, React Spring, Three.js, p5.js, or PixiJS. Any of these would blow the bundle budget or duplicate an already-installed capability.

### Expected Features

**Must have (table stakes) — gaps vs. competitors:**
- Calendar-style session history (at least 14 days) — Headspace heatmap is the competitor standard; we have only a 5-day sparkline
- Before/after activation comparison in one visual — Headspace, Balance, and Finch all show this delta; `PostResetCheckin` has a slider but no visual before/after
- State-appropriate visual atmosphere during immersion — Calm, Portal, Balance all do this; `ImmersionContainer` currently shows a static gradient
- Daily fresh content — Calm daily session, Balance personalized plans; same 8 tips appear every session currently
- Ambient mode independent of a session — Calm Scenes is the standard; audio + video only exist inside sessions today

**Should have (differentiators — unique to this product):**
- Shift trajectory chart (activation delta over time) — quantified proof the app works; session data already captures all fields
- Binaural beat frequency visualizer showing brainwave band target — no competitor explains the audio mechanism; `LissajousVisualizer` is the starting point
- Color field that transitions across session (state accent color → settled neutral as `stabilizePct` → 1.0) — no competitor does this exactly
- State-keyed atmospheric particle behavior (frozen = slow drift, anxious = jitter, flow = circular) — `NeuralBackground` is a stub ready to be implemented
- Breath-synced ambient audio surfaced in UI — `syncBreath()` is already built in `useAmbientEngine`; needs visible indicator

**Defer (v2+):**
- 4K Portal-style nature video — bundle size and streaming conflict with offline-first constraint
- Balance-style adaptive content plans — requires a content authoring system beyond current scope
- Spatial/HRTF audio — significant audio engine work for marginal gain
- Guided voice narration — requires audio production infrastructure
- Push notifications — hostile to the "come when you need it" positioning

**Anti-features to explicitly avoid:**
- AI-generated personalization (out of scope, content quality risk)
- Social comparison or leaderboards (against the calm-tech brand)
- Subscription paywalls or content gating
- Heavy gamification beyond existing streak system

### Architecture Approach

The refresh is organized around six capability areas, each with a clear component and data-flow boundary. No new state surfaces in `App.jsx` — the existing `selectedState`, `sessions`, and `ambientEngine` trifecta remains the single source of truth. New features self-contain their state via dedicated hooks or component-local state. The build order is dependency-driven: foundation utilities first (grain constant, chart data transforms, rotation hook, analyser nodes), then content variety, then audio visualization, then atmospheric effects, then data visualization charts, then animation polish on top.

**Major components:**
1. `NeuralBackground` (rewrite from stub): Canvas particle system, state-adaptive behavior, breath-phase-reactive speed. Sits at z-0 behind all other layers.
2. `useContentRotation` hook (new): Daily-stable indices for tips, protocol variants, breath cues, and task groups. Consumed independently by each component — no prop drilling through App.jsx.
3. `src/components/charts/` (new directory): `SessionHeatmap`, `ActivationArc`, `StateFlowLine`, `ProtocolEffectBar` — all pure SVG/canvas presenters receiving pre-computed data from `src/lib/chartData.js`.
4. `WaveformBars` (new): Canvas frequency visualization driven by `AnalyserNode` from the upgraded `useAudioEngine`. Static decorative fallback when audio is inactive.
5. `useAudioEngine` + `useAmbientEngine` (additive change): Both gain an `analyserNode` return value. AnalyserNode created at AudioContext init, not at play time.
6. `stateData.js` (data enrichment): Gains `breathCues`, `protocolVariants`, and `taskGroups` per state. No structural changes to existing exports.

### Critical Pitfalls

1. **Framer Motion scope creep into breath-driven animations** — framer-motion is for UI shell transitions (tabs, overlays, card reveals). Do not use it inside `ImmersionContainer` or for breath-orb scaling. Breath-driven animations must stay on the CSS/rAF path. Bundle watch: >40kB growth after adding a visual component signals framer-motion in a new code path.

2. **Multiple concurrent RAF loops** — `LissajousVisualizer`, `ImmersionBackground`, and `useBreathTimer` already run concurrent RAF loops during immersion. Adding more canvas-based charts or atmospheric effects can cause frame drops on mid-range laptops and battery drain. Hard rule: at most one canvas RAF loop active at any time. New charts must use SVG + CSS, not canvas + RAF. Audio visualization extends the existing `animate()` function, not a new loop.

3. **Hardcoded hex values bypassing the theme system** — `VagusLogSidebar` is the anti-pattern (hardcoded `#0A0D14` etc.). All new components must use `var(--bg-base)`, `var(--bg-panel)`, `var(--text-primary)`, and similar CSS custom properties exclusively. Manual verification on light and pastel themes before marking any component done.

4. **Content rotation interrupting active regulation** — Any tip flip, phrase swap, or protocol step change during the breath stabilize phase breaks synchronization. Rule: content only rotates at session START. Inside `ImmersionContainer`, minimum 20-second intervals. `setInterval` values below 12000ms inside immersion are a red flag.

5. **Chart library blowing the 44kB bundle headroom** — Recharts is 180kB gzipped. Chart.js is 65kB. Any library addition fails immediately. The `VagusLogSidebar` sparkline pattern (plain SVG/divs computed from session data) is the correct template for all session history visualization.

## Implications for Roadmap

Based on combined research, the dependency graph and build order are clear. Foundations must precede all feature work. Content and atmosphere are independent after foundations. Animation polish should be last (most likely to change based on how earlier phases look in practice).

### Phase 1: Foundations

**Rationale:** Three pure utility artifacts that every subsequent phase depends on. No consumer changes yet — build and test these in isolation. This phase is the only one where nothing is visible to the user.
**Delivers:** `src/utils/grain.js` (shared grain texture), `src/lib/chartData.js` (pure session-to-chart transforms), `src/hooks/useContentRotation.js` (daily rotation engine), plus AnalyserNode additions to both `useAudioEngine` and `useAmbientEngine`.
**Addresses:** Enables all downstream features cleanly; no prop drilling.
**Avoids:** Pitfall 3 (theme bypass) by establishing the right utility patterns; Pitfall 4 (chart library) by locking in the native SVG commitment.

### Phase 2: Content Variety

**Rationale:** Content enrichment in `stateData.js` blocks every downstream consumption point. Do this before wiring the rotation hook into components so each component integration is a mechanical swap, not an authoring task.
**Delivers:** 20+ tips per state with categories (science, action, metaphor); `breathCues` arrays (4 variants per phase); `protocolVariants` (2 per state); `taskGroups` (primary + minimal). Then wire `useContentRotation` into `BreathingOrb`, `ImmersionContainer`, `StealthReset`, and `TaskFilter`. New `TipRotator` component.
**Addresses:** Daily fresh content (table stakes gap), session-level protocol variety.
**Avoids:** Pitfall 5 (rotation during active regulation) by enforcing session-start-only selection for protocol variants; Pitfall 7 (random repetitions) by using Fisher-Yates shuffle-once-per-session.

### Phase 3: Audio Visualization

**Rationale:** AnalyserNode is built in Phase 1. This phase consumes it. `WaveformBars` should be built with a static fallback first, then wired to the analyser — so it is always usable even before audio starts.
**Delivers:** `WaveformBars.jsx` (canvas frequency bars, static fallback); upgraded `LissajousVisualizer` (optional `analyserNode` prop, FFT-modulated trail opacity); beat-reactive glow on AudioPlayer play button (requestAnimationFrame at `beatHz` rate); `WaveformBars` added to `ImmersionContainer` stabilize phase behind the breath orb.
**Addresses:** Binaural beat frequency visualizer differentiator; audio-reactive background (partial).
**Avoids:** Pitfall 2 (multiple RAF loops) by extending the existing `animate()` function; Pitfall 9 (hardcoded canvas dimensions) by using ResizeObserver.

### Phase 4: Atmospheric Effects

**Rationale:** `NeuralBackground` is currently a stub with no consumers depending on its internals — lowest-risk major rewrite in the codebase. Color field transition across session is a single CSS change in `ImmersionContainer`. State-to-atmosphere visual pairing in `ImmersionBackground` is a new prop.
**Delivers:** Rewritten `NeuralBackground` (canvas particle system, state-adaptive behavior per ARCHITECTURE.md design table); color field transition during immersion (accent color interpolates toward settled neutral as `stabilizePct → 1.0`); state-keyed `ImmersionBackground` radial gradient (frozen = blue-grey, anxious = amber haze, flow = soft green); ambient mode overlay (wraps `AmbientSoundscape`, no session logic required).
**Addresses:** State-appropriate visual atmosphere (table stakes gap); ambient mode (table stakes gap); atmospheric color field (differentiator).
**Avoids:** Pitfall 1 (framer-motion in breath system) by keeping all atmospheric effects on CSS/rAF; Pitfall 6 (vestibular discomfort) via `prefers-reduced-motion` on every new keyframe and sub-perceptual scale caps.

### Phase 5: Data Visualization

**Rationale:** Session data is already rich. `chartData.js` transforms are built in Phase 1. This phase is pure UI — add four chart components and integrate them into existing containers with no structural changes needed.
**Delivers:** `SessionHeatmap` (7/30-day state grid in SVG); `ActivationArc` (SVG arc showing activation shift); `StateFlowLine` (canvas multi-line sparkline replacing VagusLogSidebar div bars); `ProtocolEffectBar` (protocol effectiveness SVG bars); `WeeklyIntelligenceCard` gains visual charts; `PostResetCheckin` gains before/after side-by-side comparison.
**Addresses:** Calendar history (table stakes gap); shift trajectory chart (differentiator); before/after comparison (partial table stakes gap); lifetime stats.
**Avoids:** Pitfall 4 (chart library bundle impact) by using native SVG throughout.

### Phase 6: Animation Layer Polish

**Rationale:** This phase is dependent on Phases 2–5 being stable and visually settled. Animation polish applied to unstable layouts wastes effort. This is also the highest subjectivity phase — iterate based on what feels right after seeing earlier phases in production.
**Delivers:** CSS animation additions (`shimmer-enter`, `content-fade`, `state-pulse-enter`); Framer Motion on `StateSelector` cards (`AnimatePresence` for polyvagal note entrance, `layoutId` for active card expansion); tab content transitions with `AnimatePresence`; streak milestone celebration moments.
**Addresses:** State selection UX polish; transition feel; milestone moments (partial table stakes gap).
**Avoids:** Pitfall 1 (framer-motion scope) by limiting to shell-level transitions only; Pitfall 8 (breaking auto-immersion) by keeping `onSelect` callback synchronous.

### Phase Ordering Rationale

- Phases 1 → 2 → 3 → 4 → 5 → 6 is strictly dependency-driven. Phase 1 unblocks all others. Phases 2–5 are parallel-capable after Phase 1 completes, but sequential implementation reduces integration risk on a single-developer project.
- Content variety (Phase 2) before audio/atmosphere (Phases 3–4) because `stateData.js` enrichment is shared infrastructure that atmospheric tuning depends on (per-state particle profiles need stable state configurations).
- Data visualization (Phase 5) before animation polish (Phase 6) because chart layout affects how animations feel and where transitions should occur.
- Animation polish (Phase 6) last is non-negotiable — it is the most change-prone phase and should only be applied once the underlying content and visuals are stable.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Audio Visualization):** AnalyserNode integration into existing hook requires care around timing — analyser must be created at AudioContext init, not at play(). Verify the connect/tap pattern before building WaveformBars. FFT data interpretation for a binaural signal (two oscillators at slightly different frequencies) needs a quick spec check.
- **Phase 4 (Atmospheric Effects):** Per-state particle tuning (speed, opacity, count, radius profiles) requires iterative visual testing. The ARCHITECTURE.md design table gives starting values but expect iteration. Also verify `prefers-reduced-motion` behavior across target browsers before shipping.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundations):** All patterns are trivial utilities. No research needed.
- **Phase 2 (Content Variety):** `useContentRotation` is a straightforward localStorage + date-seed hook. The content writing (60+ tip variants) is effort, not research.
- **Phase 5 (Data Visualization):** SVG path generation for the chart types needed is well-documented. The `chartData.js` transform functions follow the same functional pattern already used in `generateWeeklySummary`.
- **Phase 6 (Animation Polish):** Framer Motion 12 patterns are thoroughly documented. `AnimatePresence` + `layoutId` usage is standard.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Framer Motion version confirmed in package.json; Web Audio API AnalyserNode is a browser standard; bundle constraint verified from build output |
| Features | MEDIUM | Competitor findings from training data (knowledge cutoff August 2025); existing codebase state is HIGH confidence from direct code analysis |
| Architecture | HIGH | All patterns grounded in direct code evidence; existing hooks and components confirmed by file reads; no external APIs involved |
| Pitfalls | HIGH | Every pitfall is derived from a specific existing code pattern — not general best-practice warnings. File-level citations provided in PITFALLS.md |

**Overall confidence:** HIGH

### Gaps to Address

- **AnalyserNode tap pattern for dual-oscillator setup:** `useAudioEngine` creates two oscillators (left and right ear). The AnalyserNode should tap after the GainNode merge — verify the exact graph topology during Phase 3 implementation. This is a 10-minute investigation, not a research milestone.
- **Competitor feature currency:** FEATURES.md is rated MEDIUM confidence because competitor UX was researched from training data (cutoff August 2025). If any specific competitor behavior claim is used to justify a design decision, verify against the live app before committing to that direction.
- **Per-state particle tuning:** ARCHITECTURE.md provides a starting profile table (speed, opacity, count per state) but acknowledges these require visual iteration. Flag this during Phase 4 planning as a "design spike" rather than a deterministic implementation task.
- **VagusLogSidebar theme remediation:** PITFALLS.md identifies this component as hardcoded dark-theme only. It is out of scope for this refresh unless a phase explicitly targets it — but it should be flagged as technical debt to address before any light/pastel theme promotion.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis — `regulation-station/src/` (all relevant components, hooks, utilities, config files read directly)
- `regulation-station/package.json` — confirmed dependency inventory including framer-motion 12.34.5
- `regulation-station/tailwind.config.js` — confirmed custom tokens and animation keyframe inventory
- `regulation-station/src/index.css` — confirmed CSS custom property system and theme overrides
- Web Audio API AnalyserNode (browser standard, well-specified)

### Secondary (MEDIUM confidence)
- Competitor UX analysis (Calm, Headspace, Balance, Breathwrk, Waking Up, Oak, Finch, Portal) — training data, knowledge cutoff August 2025
- App Store descriptions and product review coverage (Engadget, The Verge 2022–2024)
- Official product pages: breathwrk.com, waking-up.com, oak.app, finchcare.com, portal.app

### Tertiary (LOW confidence)
- Specific competitor feature implementation details (e.g., exactly how Balance's adaptive texture responds to audio) — inferred from product descriptions, not code analysis

---
*Research completed: 2026-03-09*
*Ready for roadmap: yes*
