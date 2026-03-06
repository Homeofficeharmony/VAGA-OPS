# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## App: Regulation Station (`regulation-station/`)

React 19 + Vite 7 + Tailwind CSS 3 SPA. No router — single page. PWA-enabled via `vite-plugin-pwa`.

### Commands
Run from inside `regulation-station/`:
```
npm run dev      # dev server at localhost:5173
npm run build    # production build → dist/
npm run lint     # ESLint
npm run preview  # preview production build
```

### Supabase (optional)
Create `regulation-station/.env.local` with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
Without these, `src/lib/supabase.js` exports `null` and the app runs fully offline using localStorage. All Supabase-dependent hooks and components guard with `if (!supabase) return`.

## Architecture

### State Machine
Three nervous system states drive the entire UI. All state definitions live in **`src/data/stateData.js`** — the `STATES` object keyed by `'frozen' | 'anxious' | 'flow'`. Each state exports: `accentHex`, `reset` (60-sec somatic protocol steps), `tasks` (task list items), `audio` (binaural beat config), and `tips`.

`selectedState` string is held in `App.jsx` and passed down as `stateData = STATES[selectedState]`.

### Theme System
Three themes (`dark` / `light` / `pastel`) controlled via `data-theme` attribute on `<html>`. CSS custom properties (`--bg-base`, `--bg-panel`, `--text-primary`, `--accent-*`, etc.) are defined per theme in `src/index.css`. `ThemeProvider` in `src/context/ThemeContext.jsx` persists selection to `localStorage` key `nso-theme`.

Tailwind custom tokens (`charcoal-*`, `egreen`, `eamber`, `ered`, shadow glows) are in `tailwind.config.js`. Do not hardcode hex values in components — use `stateData.accentHex` for state-reactive colors or CSS vars for theme-reactive colors.

### Overlay/Modal Pattern
All overlays (`PanicReset`, `FlowLock`, `FocusMode`, `RuptureModal`, `PostResetCheckin`) are rendered at the bottom of `App.jsx` as fixed-position layers. They receive `open` bool + `onClose`/`onComplete` callbacks. `anyOverlayOpen` flag hides `PanicButton` when a full-screen overlay is active.

Checkin flow is unified: both stealth reset and panic reset set `checkinPending` state `{ source, accentHex, state }`, which mounts `PostResetCheckin` and calls `logSession` on dismissal.

### Session Logging (`src/hooks/useSessionLog.js`)
Persists to `localStorage` key `vaga-sessions` (max 90 entries). If Supabase + auth are present, syncs to `sessions` table on mount and writes on `logSession`. Session shape: `{ id, date, state, type, durationSec, resetCompleted, outcome, shift, flowMinutes, timestamp }`.

### Audio Engine (`src/hooks/useAudioEngine.js`)
Web Audio API binaural beats. Each state has a `carrierHz` and `beatHz` (left ear = carrier, right ear = carrier + beat). Visualizer canvas drawn via `requestAnimationFrame` in `AudioPlayer.jsx`.

### Auth (`src/contexts/AuthContext.jsx`)
Supabase email/password auth. Exposed via `useAuth()` hook returning `{ user, session, loading, signIn, signUp, signOut }`. When `supabase` is null, all auth methods return a "not configured" error — components should check `user` before showing auth-gated UI.

### Keyboard Shortcuts (defined in `App.jsx`)
| Key | Action |
|-----|--------|
| `1` / `2` / `3` | Select frozen / anxious / flow |
| `Cmd+1/2/3` | Same |
| `R` | Open Rupture modal |
| `F` | Toggle Focus mode (requires state selected) |
| `I` | Toggle Immersive mode |
| `Cmd+F` | Toggle Flow Lock (flow state only) |
| `Cmd+Shift+R` | Panic Reset |
| `Escape` | Close all overlays |

### localStorage Keys
| Key | Purpose |
|-----|---------|
| `nso-theme` | Active theme |
| `vaga-sessions` | Session log array |
| `vagaFirstVisitComplete` | Skip onboarding if `'true'` |

## Non-App Files
- `NOTION_ARCHITECTURE.md` — 5-database Notion system design
- `VIDEO_SCRIPTS.md` — 3 × 60-sec production scripts
- `BURNOUT_SOP.md` — 3-tier burnout decision tree
- `TEAM_SQL.md` — Supabase SQL for `teams` + `team_members` tables
