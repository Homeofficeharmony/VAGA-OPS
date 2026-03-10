# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-09)

**Core value:** When you sit down dysregulated, you use this and walk away calm with your task feeling attainable.
**Current focus:** v1.0 — Visual & Experience Refresh

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-03-09 — Milestone v1.0 started

## Accumulated Context

- App has 3 waves of features shipped (core → retention → upgrade pass)
- Bundle: ~656kB JS + 36kB CSS
- Pre-existing lint warnings: App.jsx setState-in-effect, ThemeContext fast-refresh, useTeam setState
- Binaural frequencies: Frozen 180+5Hz, Anxious 200+10Hz, Flow 200+40Hz
- stateData.js has 8 tips per state, estimatedDurationMin on tasks

## Key Files

- `regulation-station/src/App.jsx` — root component, state holder
- `regulation-station/src/data/stateData.js` — all state content
- `regulation-station/src/hooks/useAudioEngine.js` — binaural engine
- `regulation-station/src/hooks/useAmbientEngine.js` — ambient audio
- `regulation-station/src/components/ImmersionContainer.jsx` — immersive flow
- `regulation-station/src/components/AudioPlayer.jsx` — audio UI + canvas
- `regulation-station/src/components/StateSelector.jsx` — state picker
- `regulation-station/src/hooks/useSessionLog.js` — session persistence
- `regulation-station/src/components/VagusLogSidebar.jsx` — session history UI

## Todos

Count: 0
