# Regulation Station

## What This Is

A nervous system regulation dashboard for WFH solopreneurs — built on Polyvagal Theory. Three states (frozen, anxious, flow) drive personalized somatic resets, curated task lists, binaural audio, and immersive breath sessions. The app helps you recognize your nervous system state and shift back to capacity.

## Core Value

When you sit down feeling dysregulated, you use this app and walk away feeling calm with your next task feeling attainable.

## Current Milestone: v1.0 — Visual & Experience Refresh

**Goal:** Transform a text-heavy, static dashboard into a living, visual experience that feels different every session and makes regulation tangible — not just readable.

**Target features:**
- Visual-first UI overhaul (motion, depth, hierarchy — less text)
- Content variety system (rotating tips, varied breath cues, evolving tasks, diverse protocol steps)
- Enhanced state selection UX (richer, more intentional moment)
- Audio visualization upgrade (binaural/ambient UI that matches the real audio engine)
- Immersion flow expansion (ImmersionContainer as a full visual experience)
- Session history data visualization (compelling charts, trends, mood arcs)
- Competitor-informed feature gaps (what calm-tech apps do that we don't)

## Requirements

### Validated

<!-- Shipped and confirmed working. -->

- ✓ Three nervous system states with somatic reset protocols
- ✓ 60-second stealth reset timer with SVG ring
- ✓ Binaural beat audio engine (Web Audio API, real frequencies per state)
- ✓ Ambient soundscapes (forest, ocean, binaural)
- ✓ Immersive regulation flow with breath cues and depth meter
- ✓ Task checklists per state with estimated durations
- ✓ Session logging with localStorage persistence
- ✓ Panic reset (30-sec breath animation)
- ✓ Flow lock mode (90-min deep work overlay)
- ✓ Post-reset check-in with shift tracking
- ✓ Tactical advisor (session pattern alerts)
- ✓ Heart-rate calibration via tap-to-BPM
- ✓ Haptic feedback on breath phases
- ✓ Three themes (dark/light/pastel) with CSS custom properties
- ✓ PWA-enabled, fully offline capable
- ✓ Keyboard shortcuts for all major actions

### Active

<!-- Current scope — v1.0 Visual & Experience Refresh -->

- [ ] Visual-first UI across all panels (motion, depth, less text)
- [ ] Content variety engine for tips, cues, tasks, protocols
- [ ] Enhanced state selection experience
- [ ] Audio visualization that reacts to the actual audio
- [ ] Expanded immersion flow with visual richness
- [ ] Session history as compelling data visualization
- [ ] Competitor-informed UX improvements

### Out of Scope

- Mobile native app — web-first, PWA handles mobile
- Social features beyond existing team panel — not core to personal regulation
- AI-generated content — keep content human-curated, just rotate it better
- Backend migration — stays localStorage-first with optional Supabase

## Context

- App already has a robust feature set across 3 waves of development
- The core regulation mechanics work — the gap is in presentation and feel
- User (creator) is the primary user — "does it calm ME down?" is the bar
- Current pain points: text-heavy panels, static experience, repetitive content, flat visual hierarchy
- All 4 expandable features identified: audio viz, immersion, state selection, session history
- Biophilic design language established (sage/gold/terracotta accents, dark nature-inspired theme)

## Constraints

- **Tech stack**: React 19 + Vite 7 + Tailwind CSS 3 — no new frameworks
- **No external UI libs**: Keep it custom — no MUI, Chakra, etc.
- **Performance**: Must stay under ~700kB JS bundle
- **Offline-first**: All visual enhancements must work without network
- **Theme compatibility**: All changes must work across dark/light/pastel themes

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Biophilic design language | Nature-inspired visuals match nervous system regulation theme | ✓ Good |
| localStorage-first | Offline capability is critical for a regulation tool | ✓ Good |
| No router (single page) | Keeps mental model simple — one screen, state-driven | ✓ Good |
| CSS custom properties for theming | Enables 3-theme system without runtime cost | ✓ Good |

---
*Last updated: 2026-03-09 after v1.0 milestone initialization*
