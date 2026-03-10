# Roadmap: Regulation Station — v1.0 Visual & Experience Refresh

## Overview

This milestone transforms a fully functional but text-heavy regulation dashboard into a living, visual experience. Six phases build on each other strictly by dependency: utility foundations first, then content variety, audio visualization, atmospheric effects, data visualization, and finally animation polish. Every phase is additive — no structural changes to App.jsx or the core state machine. The result is a calm-tech product that feels different every session and makes regulation tangible, not just readable.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundations** - Shared utilities that every subsequent phase depends on (rotation hook, chart data transforms, AnalyserNode wiring, grain texture)
- [ ] **Phase 2: Content Variety** - Expand stateData.js with 20+ tips per state, breath cue variants, protocol alternatives, and time-of-day task groups; wire rotation hook into all consumers
- [ ] **Phase 3: Audio Visualization** - Beat-reactive glow on audio controls and real-time WaveformBars driven by AnalyserNode from the live audio graph
- [ ] **Phase 4: Atmospheric Effects** - NeuralBackground particle system, state-keyed immersion visuals, session color field transition, and standalone ambient mode
- [ ] **Phase 5: Data Visualization** - Before/after activation comparison in post-reset check-in and shift trajectory chart in session history
- [ ] **Phase 6: Animation Polish** - Framer Motion on StateSelector cards, tab content transitions, CSS shimmer/fade enters, and streak milestone moments

## Phase Details

### Phase 1: Foundations
**Goal**: All shared utilities exist and are independently testable before any consumer component is built
**Depends on**: Nothing (first phase)
**Requirements**: None (enables all downstream requirements)
**Success Criteria** (what must be TRUE):
  1. A `useContentRotation` hook returns a date-stable index that does not change within a session but advances each calendar day
  2. `src/lib/chartData.js` exports pure transform functions that convert the existing session array into chart-ready data shapes without any UI dependency
  3. Both `useAudioEngine` and `useAmbientEngine` expose an `analyserNode` value that is non-null when audio is active and null when audio is inactive
  4. A shared `src/utils/grain.js` utility exists and exports a grain texture constant usable by any canvas component
**Plans:** 2 plans
Plans:
- [ ] 01-01-PLAN.md — Grain texture extraction + content rotation hook
- [ ] 01-02-PLAN.md — Chart data transforms + AnalyserNode wiring

### Phase 2: Content Variety
**Goal**: Users experience fresh content on every session — different tips, breath cue phrasings, protocol sequences, and task groups appropriate to their time of day
**Depends on**: Phase 1
**Requirements**: CVAR-01, CVAR-02, CVAR-03, CVAR-04
**Success Criteria** (what must be TRUE):
  1. User sees a different tip after at least 24 hours have passed, drawn from a pool of 20 or more tips per state
  2. User reads a different breath cue phrasing across sessions (at minimum 4 variants per breath phase per state) — the cue does not change mid-session
  3. User experiences a different somatic protocol sequence on a new session day, selected from 2-3 variants per state
  4. User sees task checklist items filtered to morning, afternoon, or evening context based on the time of day they open the app
**Plans**: TBD

### Phase 3: Audio Visualization
**Goal**: The audio UI reflects what is actually playing — users can see the binaural signal and feel the beat frequency through visual feedback
**Depends on**: Phase 1
**Requirements**: AVIZ-01, AVIZ-02
**Success Criteria** (what must be TRUE):
  1. The audio player's play button glows or pulses visibly at the binaural beat frequency of the active state (5 Hz for frozen, 10 Hz for anxious, 40 Hz for flow)
  2. A real-time frequency bar visualization appears in the audio player area that responds to actual audio output when audio is playing, and shows a static decorative fallback when audio is inactive
**Plans**: TBD

### Phase 4: Atmospheric Effects
**Goal**: The app's visual environment shifts with each nervous system state and deepens during immersion — users feel the state, not just read it
**Depends on**: Phase 2
**Requirements**: VATM-01, VATM-02, VATM-03, VATM-04, STUX-02
**Success Criteria** (what must be TRUE):
  1. The background particle system behaves differently per state: slow cool drift for frozen, jittery warm motion for anxious, smooth circular flow for flow state
  2. During an immersion session, the background color field visibly shifts from the state's accent color toward a neutral settled hue as the session progresses toward completion
  3. At session completion, a brief visual celebration (glow or radial burst) appears before the post-reset check-in screen
  4. User can activate an ambient mode from the dashboard — audio and atmospheric visuals run without entering a structured session
  5. The distinct visual environment is recognizable per state: cool mist palette for frozen, warm amber haze for anxious, soft green field for flow
**Plans**: TBD

### Phase 5: Data Visualization
**Goal**: Session data tells a visual story — users can see the before/after of each reset and their regulation trajectory over time
**Depends on**: Phase 1
**Requirements**: DVIZ-01, DVIZ-02
**Success Criteria** (what must be TRUE):
  1. After completing a reset, the post-reset check-in shows a side-by-side visual comparison of activation level before and after the session
  2. The session history panel includes a chart that plots regulation shift (activation delta) across multiple sessions, making improvement visible as a trend rather than a number
**Plans**: TBD

### Phase 6: Animation Polish
**Goal**: Selecting a state and navigating the dashboard feels intentional and alive — transitions communicate meaning, not just movement
**Depends on**: Phase 5
**Requirements**: STUX-01
**Success Criteria** (what must be TRUE):
  1. When the user selects a different nervous system state, the full page environment visibly transitions (cards, background, accents) rather than snapping instantly
  2. The active state card in StateSelector expands with a smooth layout transition that feels deliberate and grounded
  3. Tab content changes in the dashboard animate in cleanly (fade or slide) rather than cutting
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundations | 0/2 | Planning complete | - |
| 2. Content Variety | 0/? | Not started | - |
| 3. Audio Visualization | 0/? | Not started | - |
| 4. Atmospheric Effects | 0/? | Not started | - |
| 5. Data Visualization | 0/? | Not started | - |
| 6. Animation Polish | 0/? | Not started | - |
