# Requirements: Regulation Station

**Defined:** 2026-03-09
**Core Value:** When you sit down dysregulated, you use this and walk away calm with your task feeling attainable.

## v1 Requirements

Requirements for v1.0 Visual & Experience Refresh. Each maps to roadmap phases.

### Visual Atmosphere

- [x] **VATM-01**: User sees a color field that transitions from state accent toward a "settled" hue as immersion progresses
- [ ] **VATM-02**: User sees organic particles in the background that respond to breath phase (slow on exhale, quicken on inhale)
- [x] **VATM-03**: User experiences a visual glow/celebration moment at session completion before the check-in appears
- [x] **VATM-04**: User sees a distinct visual environment per state (frozen=cool mist, anxious=warm amber haze, flow=soft green field)

### Content Variety

- [x] **CVAR-01**: User sees different tips each day, drawn from an expanded pool of 20+ per state
- [x] **CVAR-02**: User hears/reads varied breath cue phrasings between sessions (not "Inhale... Exhale" every time)
- [x] **CVAR-03**: User experiences 2-3 different somatic protocol step sequences per state across sessions
- [x] **CVAR-04**: User sees task checklist items that rotate by time-of-day context (morning/afternoon/evening)

### Data Visualization

- [x] **DVIZ-01**: User sees a visual before/after activation comparison in the post-reset check-in
- [x] **DVIZ-02**: User can view a shift trajectory chart showing regulation effectiveness over time

### Audio Visualization

- [x] **AVIZ-01**: User sees the audio play controls glow/pulse at the actual binaural beat frequency
- [x] **AVIZ-02**: User sees a real-time frequency visualization driven by the actual audio output via AnalyserNode

### State & Interaction

- [x] **STUX-01**: User sees the full page environment animate/transition when selecting a different nervous system state
- [x] **STUX-02**: User can enter an ambient mode (atmosphere + audio without a structured session)

## v2 Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Data Visualization

- **DVIZ-03**: User can view a calendar heatmap showing 14-30 days of session history
- **DVIZ-04**: User can view state distribution (frozen/anxious/flow mix) over 7/30 days

### Audio

- **AVIZ-03**: User sees L/R channel separation visualization specific to binaural beats
- **AVIZ-04**: User sees a brainwave target zone overlay showing which band the current frequency targets

### Ambient

- **AMBI-01**: User can layer ambient soundscape types (nature + binaural simultaneously)
- **AMBI-02**: User receives a welcome-back state suggestion when returning after a gap

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI-generated content / personalization | Adds complexity, risks content quality; keep human-curated |
| Guided voice narration | Requires audio production infrastructure beyond current scope |
| Portal-style 4K streaming video | Conflicts with offline-first constraint and bundle size limit |
| Social content sharing | Regulation is personal, not performative |
| Push notifications | Hostile to the app's "when you need it" positioning |
| Gamification beyond streaks | Half-gamification feels cheap; keep streak + milestone only |
| Subscription paywalls | Personal tool, not SaaS at this stage |
| Spatial audio (HRTF) | Significant audio engine work, defer to future |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| VATM-01 | Phase 4 | Complete |
| VATM-02 | Phase 7 | Pending |
| VATM-03 | Phase 4 | Complete |
| VATM-04 | Phase 4 | Complete |
| CVAR-01 | Phase 2 | Complete |
| CVAR-02 | Phase 2 | Complete |
| CVAR-03 | Phase 2 | Complete |
| CVAR-04 | Phase 2 | Complete |
| DVIZ-01 | Phase 8 | Pending |
| DVIZ-02 | Phase 5 | Complete |
| AVIZ-01 | Phase 3 | Complete |
| AVIZ-02 | Phase 3 | Complete |
| STUX-01 | Phase 6 | Complete |
| STUX-02 | Phase 4 | Complete |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0
- Pending (gap closure): VATM-02 (Phase 7), DVIZ-01 (Phase 8)

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-09 after roadmap creation*
