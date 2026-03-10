# Phase 2: Content Variety - Research

**Researched:** 2026-03-10
**Domain:** React hooks, stateData.js content expansion, time-of-day filtering, content rotation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

No CONTEXT.md exists for Phase 2 — no locked decisions from a prior discussion session.
All design choices below are Claude's discretion, guided by project architecture decisions
already established in STATE.md and Phase 1 research.

### Established Architecture Decisions (from STATE.md — treated as constraints)

- All content rotation happens at session START only — no mid-session content changes
- No re-roll / manual override in useContentRotation API (one selection per day)
- Independent rotation per pool — each pool drives its own hash cycle
- 44kB bundle headroom remaining — no new dependencies permitted
- Midnight local time (en-CA toLocaleDateString) is the rotation boundary
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CVAR-01 | User sees different tips each day, drawn from an expanded pool of 20+ per state | stateData.js already has 8 tips per state; expand to 20+ by adding 12+ content items per state. useContentRotation already built in Phase 1 — wire into StatusBar or wherever tips surface. |
| CVAR-02 | User hears/reads varied breath cue phrasings between sessions (not "Inhale... Exhale" every time); cue does not change mid-session | ImmersionContainer has a hardcoded BREATH_LABEL constant. Needs a per-state pool of 4+ phrase variants per phase (inhale/hold/exhale), selected daily via useContentRotation. |
| CVAR-03 | User experiences 2-3 different somatic protocol step sequences per state across sessions | stateData.js has one `reset` object per state. Expand to an array of 2-3 `reset` variants; StealthReset and ImmersionContainer select one per day via useContentRotation. |
| CVAR-04 | User sees task checklist items filtered to morning/afternoon/evening context based on time of day app is opened | TaskFilter uses stateData.tasks.items array directly. Add `timeOfDay` tag to items (or expand item pool), detect current hour, filter displayed items to the matching context. |
</phase_requirements>

---

## Summary

Phase 2 is a content expansion and wiring phase — no new libraries needed, no new React patterns to learn. Every technique required already exists in the codebase. The work divides cleanly into two categories: **data authorship** (writing new tips, breath phrasings, protocol variants) and **wiring** (connecting existing infrastructure to the new data shapes).

`useContentRotation` was built in Phase 1 precisely for this phase. It is already imported-ready. The key architectural question for each requirement is: where does selection happen (App.jsx or component-level?), and what shape does the data take in `stateData.js`?

The largest content risk is quality, not engineering: 20+ polyvagal-accurate tips per state is a meaningful authorship task. The protocol variant authorship (2-3 different 60-second sequences per state with timestamped steps) is the single most effort-intensive item in the phase. Both are pure content work — no code risk.

The time-of-day task filtering (CVAR-04) is the only place where runtime detection is needed. The detection is a simple `new Date().getHours()` call returning a slot (`morning` / `afternoon` / `evening`) — no library needed, no persistence needed.

**Primary recommendation:** Sequence work as: CVAR-01 (tips expansion + wiring, pure content + single hook call), then CVAR-04 (task tagging + filter logic, no upstream dependency), then CVAR-02 (breath phrasings, requires stateData shape change + ImmersionContainer edit), then CVAR-03 last (protocol variants, requires most content authorship and the most component surgery).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 (existing) | `useMemo`, component-local state | Already in project |
| `useContentRotation` | Phase 1 (local) | Date-stable daily selection from any pool | Built in Phase 1 for exactly this use case |
| `new Date().getHours()` | Browser built-in | Time-of-day slot detection | Zero-dependency, no import needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | — | Phase 2 has zero new dependencies | All patterns use existing hooks and browser APIs |

**Installation:**
```bash
# No new packages required for Phase 2
```

---

## Architecture Patterns

### Recommended stateData.js Shape Changes

```
stateData.js
├── tips: string[]                    # CVAR-01: expand from 8 → 20+ items per state
├── breathCues: {                     # CVAR-02: NEW — per-state breath phrase variants
│     inhale: string[],               #   4+ phrasings for the inhale cue
│     hold:   string[],               #   4+ phrasings for the hold cue (anxious only)
│     exhale: string[]                #   4+ phrasings for the exhale cue
│   }
├── reset: ResetProtocol              # CVAR-03: stays as single object (see variant pattern below)
├── resetVariants: ResetProtocol[]    # CVAR-03: NEW — array of 2-3 protocol variants
└── tasks.items[].timeOfDay:          # CVAR-04: NEW — tag on each task item
      'morning' | 'afternoon' | 'evening' | 'any'
```

**Note on reset variants (CVAR-03):** The existing `reset` key is used directly by `StealthReset.jsx` (via `stateData.reset`) and by `ImmersionContainer.jsx` (via `stateData.reset`... actually ImmersionContainer uses its own `WELCOME` constant, not stateData.reset). The safest migration is to add a `resetVariants` array alongside `reset` (keeping `reset` as a fallback). The selected variant replaces `reset` at the call site. This avoids breaking any component that reads `stateData.reset` directly.

### Pattern 1: Tips Expansion and Wiring (CVAR-01)

**What:** Expand each state's `tips` array from 8 to 20+ items. Call `useContentRotation(stateData.tips)` in the component that renders the tip.

**Where tips currently surface:** Search reveals tips are not currently rendered anywhere in the component tree — the `tips` array exists in stateData.js but has no UI consumer. This means CVAR-01 requires: (a) expanding the content pool, AND (b) finding or creating a tip display UI.

**Tip display locations to consider:**
- `StatusBar.jsx` — already mounted in App.jsx, visible when state is selected
- `StealthReset.jsx` — after protocol section as an educational note
- `ImmersionContainer.jsx` welcome phase — as the static tip line (currently `w.tip` from WELCOME constant)

**Recommended wiring point:** Add a tip display to `StealthReset.jsx` below the mechanism section (already has `reset.mechanism` copy). This is the most natural educational moment — user just finished the protocol and sees the polyvagal science note. Alternatively, use it as the `tip` line in the `WELCOME` section of `ImmersionContainer`. Either location satisfies CVAR-01; both can be implemented.

**Selection pattern:**
```javascript
// In the consuming component (e.g. StealthReset.jsx or ImmersionContainer.jsx)
import { useContentRotation } from '../hooks/useContentRotation'

// Inside the component:
const { item: dailyTip } = useContentRotation(stateData.tips)
// dailyTip: string — stable for the calendar day, changes next day
```

**Content authorship guidance for 20+ tips per state:**
- Frozen (dorsal vagal shutdown): physiology of immobility, movement as re-activation, eye movement techniques, vocalization, hydration, sensory anchoring
- Anxious (sympathetic): exhale-dominance physiology, panoramic vision, physical discharge, humming/vocal resonance, cold-water dive reflex, 4-8 breathing rationale
- Flow (ventral vagal): protecting the window, flow duration research, gamma synchrony, co-regulation, sleep consolidation, loop-closing before deep work

### Pattern 2: Breath Cue Phrasings (CVAR-02)

**What:** Replace the hardcoded `BREATH_LABEL` constant in `ImmersionContainer.jsx` with a daily-selected set of phrasings from the state's `breathCues` pool.

**Current hardcoded constant (ImmersionContainer.jsx line 40):**
```javascript
const BREATH_LABEL = { inhale: 'Breathe in', hold: 'Hold', exhale: 'Breathe out' }
```

**Target data shape in stateData.js (new key: `breathCues`):**
```javascript
breathCues: {
  inhale: [
    'Breathe in',              // variant 0 — current default
    'Draw breath in slowly',   // variant 1
    'Open and receive',        // variant 2
    'Inhale through the nose', // variant 3
  ],
  hold: [
    'Hold',                    // variant 0 — current default
    'Suspend here',            // variant 1
    'Pause at the top',        // variant 2
    'Hold and feel',           // variant 3
  ],
  exhale: [
    'Breathe out',             // variant 0 — current default
    'Release slowly',          // variant 1
    'Let it go',               // variant 2
    'Long slow exhale',        // variant 3
  ],
},
```

**Selection pattern — session-start only:**
The selection must happen ONCE per session open, not once per day. The requirement says "cue does not change mid-session." This conflicts slightly with `useContentRotation` which is day-based.

**Recommended approach:** Use `useContentRotation` on the `breathCues.inhale` pool to get the daily index, then use that same index for `hold` and `exhale` pools. This means all three phases share a single "variant index" for a given day, which keeps the phrasing consistent within a session and rotates daily.

```javascript
// In ImmersionContainer.jsx
const { index: cueVariantIndex } = useContentRotation(stateData?.breathCues?.inhale ?? [])
const breathLabel = {
  inhale: stateData?.breathCues?.inhale?.[cueVariantIndex] ?? 'Breathe in',
  hold:   stateData?.breathCues?.hold?.[cueVariantIndex]   ?? 'Hold',
  exhale: stateData?.breathCues?.exhale?.[cueVariantIndex] ?? 'Breathe out',
}
```

This satisfies: daily rotation (same day = same cue set), session stability (date does not change during a session), 4+ variants per phase.

**Fallback safety:** If `breathCues` is absent on a state, fall back to the existing hardcoded labels. This prevents regressions if a state is not yet migrated.

### Pattern 3: Protocol Variants (CVAR-03)

**What:** Each state gets 2-3 alternative somatic protocols. On a new session day, a different variant is selected. Within a session, the variant is stable.

**Data shape in stateData.js:**
```javascript
// Existing key stays for backward compatibility
reset: { ... }, // original protocol — used as fallback

// New key: array of variants including the original
resetVariants: [
  {
    id: 'ear-apex',          // variant 0 — current protocol
    title: 'Ear-Apex Pull',
    protocol: 'Physiological Reset · 60 sec',
    steps: [...],            // same 5 steps as today
    mechanism: '...',
  },
  {
    id: 'jaw-release',       // variant 1 — new protocol for frozen state
    title: 'Jaw & Neck Release',
    protocol: 'Tension Reset · 60 sec',
    steps: [...],            // 5 timestamped steps
    mechanism: '...',
  },
  // optional variant 2
],
```

**Selection pattern (App.jsx or component-local):**
```javascript
// Option A: App.jsx computes selectedReset and passes to StealthReset and ImmersionContainer
const { item: selectedReset } = useContentRotation(stateData?.resetVariants ?? [stateData?.reset])
// Pass selectedReset as prop replacing stateData.reset

// Option B: Each component independently selects
// Inside StealthReset.jsx:
const resetPool = stateData.resetVariants ?? [stateData.reset]
const { item: reset } = useContentRotation(resetPool)
```

**Recommended: Option B (component-local selection).** Both components call `useContentRotation` with the same pool and the same date, so they will select the same variant independently. This avoids prop-drilling a new `selectedReset` through App.jsx. Both components already receive `stateData` as a prop — no interface change needed at the App level.

**Content authorship guidance (2-3 variants per state):**

| State | Existing Protocol | Variant 2 | Variant 3 |
|-------|------------------|-----------|-----------|
| Frozen | Ear-Apex Pull | Jaw & Neck Release (cranial nerve reset) | Spinal Wave (gentle undulation, bottom-up activation) |
| Anxious | Rib-Cage Expansion | Physiological Sigh (double inhale, long exhale) | Cold Wrist Reset (cold water + slow exhale sequence) |
| Flow | Peripheral Vision Soften | Palming (eye compression + optic reset) | Body Scan Anchor (head-to-toe grounding, 5 stops) |

Each variant needs: `id`, `title`, `protocol` (label string), `steps` (array of 5 objects with `time` and `cue`), `mechanism`.

### Pattern 4: Time-of-Day Task Filtering (CVAR-04)

**What:** Add a `timeOfDay` tag to each task item. `TaskFilter.jsx` reads the current hour and shows only items tagged for the current period (plus items tagged `'any'`).

**Time slot detection:**
```javascript
// Pure function — no import needed
function getTimeOfDaySlot() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12)  return 'morning'    // 05:00–11:59
  if (hour >= 12 && hour < 17) return 'afternoon'  // 12:00–16:59
  return 'evening'                                   // 17:00–04:59
}
```

**Updated task item shape (stateData.js):**
```javascript
{ id: 'inbox', label: 'Clear inbox to zero', icon: '📥', intensity: 1,
  estimatedDurationMin: 15, timeOfDay: 'morning',
  why: '...' }
```

**Items that work any time** (e.g., water bottle, walk) use `timeOfDay: 'any'`.

**Filter logic in TaskFilter.jsx:**
```javascript
const slot = getTimeOfDaySlot() // called once at render (stable during session)
const visibleItems = tasks.items.filter(
  item => !item.timeOfDay || item.timeOfDay === 'any' || item.timeOfDay === slot
)
```

**Fallback:** If `timeOfDay` is absent from an item, treat as `'any'` (the `!item.timeOfDay` check). This prevents regressions on any item not yet tagged.

**Content authorship guidance:**
Aim for at least 2 items per time slot per state, plus 1-2 `any` items that are always applicable. Current pool is 5 items per state — expand to 8-10 with explicit time tags.

| State | Morning | Afternoon | Evening | Any |
|-------|---------|-----------|---------|-----|
| Frozen | Write today's single task, gentle walk | Clear inbox, file items | Write tomorrow's top 3, gentle yoga | Water bottle |
| Anxious | Draft one email, record Loom | Respond to 3 messages, outline | Review today's work, brain dump | 5 min slow walk |
| Flow | Strategy/vision writing, deep creative block | Ship a feature, partnership calls | Weekly review, deep learning session | — |

### Anti-Patterns to Avoid

- **Selecting content in `App.jsx` and passing as props:** This pollutes App.jsx with rotation logic. Component-local `useContentRotation` calls on the same pool produce identical results (same date = same index), so prop-drilling is unnecessary.
- **Changing the selected tip/cue mid-session:** The architecture decision is session-start selection only. Never trigger re-selection based on user interaction.
- **Tagging all tasks as 'any':** This defeats the purpose of CVAR-04. Each state needs genuine time-differentiated tasks.
- **Requiring `resetVariants` to be non-empty:** Always fall back to `[stateData.reset]` if `resetVariants` is absent. This is the safe default for any state not yet migrated.
- **Using `Math.random()` for protocol selection:** Non-deterministic — two components selecting independently would pick different variants. Only `useContentRotation`'s date-hash approach guarantees consistency.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Daily content selection | Custom sessionStorage-seeded random | `useContentRotation` from Phase 1 | Already built, date-stable, cross-tab consistent |
| Time-of-day detection | Date library, timezone library | `new Date().getHours()` | 3 lines of pure JS, no edge cases at this scale |
| Cross-component variant sync | Context/prop-drilling selectedReset | Independent `useContentRotation` calls (same pool = same result) | Date hash is deterministic; components don't need to coordinate |
| Content validation | Runtime schema checks | TypeScript-style JSDoc + review | No build-time type safety needed for a pure data file |

**Key insight:** Every Phase 2 problem reduces to either "add content to stateData.js" or "call useContentRotation on that content." The infrastructure is complete.

---

## Common Pitfalls

### Pitfall 1: breathCues index out of bounds
**What goes wrong:** If `breathCues.inhale` has 4 items but `breathCues.exhale` has only 3, using the same `cueVariantIndex` for exhale fails silently (returns `undefined`).
**Why it happens:** Each sub-array may be authored with different lengths.
**How to avoid:** Ensure all three arrays in each state's `breathCues` have the same length. Document this as an authorship constraint. The fallback `?? 'Breathe out'` catches the undefined case gracefully.
**Warning signs:** Breath phase label shows `undefined` in the immersion view.

### Pitfall 2: resetVariants not including the original protocol
**What goes wrong:** User who previously ran a specific protocol can no longer access it — the original is overwritten by a variant-only array.
**Why it happens:** `resetVariants` replaces `reset` rather than including it as element 0.
**How to avoid:** Always make `resetVariants[0]` be the original `reset` protocol. Components that fall back to `stateData.reset` still work for any state not yet migrated.
**Warning signs:** One state's protocol suddenly shows a different title than users remember.

### Pitfall 3: Time-of-day filter shows too few tasks
**What goes wrong:** After filtering, only 1-2 tasks are visible — not enough for the "shed to one" mechanic in TaskFilter.
**Why it happens:** Not enough tasks are tagged for each time slot, or pool is too small.
**How to avoid:** Ensure each state has at least 4 visible tasks per time slot (before shedding). This means the expanded task pool needs at minimum 4 per slot (morning/afternoon/evening) plus `any` items. Total pool per state should be 10-15 items.
**Warning signs:** TaskFilter's "Shed Load" mechanic starts with 2 items, which short-circuits the UX immediately.

### Pitfall 4: Tips not surfaced in any component
**What goes wrong:** Tips pool is expanded to 20+ items but no component actually renders the daily tip — CVAR-01 acceptance criterion fails.
**Why it happens:** Current codebase has no tip display component (tips array exists in data, has no UI consumer today).
**How to avoid:** CVAR-01 requires both data expansion AND creating/updating a UI consumer. Pick one of: StatusBar, StealthReset mechanism section, or ImmersionContainer welcome tip line.
**Warning signs:** The tips array in stateData.js grows but the app shows no visible tip.

### Pitfall 5: ImmersionContainer WELCOME.tip is hardcoded
**What goes wrong:** Even after wiring `useContentRotation` for breath labels, the welcome screen's `.tip` line (e.g., "Feel your feet on the floor before you begin.") is still hardcoded in the `WELCOME` constant inside ImmersionContainer.
**Why it happens:** `WELCOME` is a separate constant from `breathCues` and from the `tips` pool. It's easy to update `breathCues` and forget `WELCOME.tip`.
**How to avoid:** Decide whether the WELCOME.tip line should come from the `tips` pool (making it the same tip visible elsewhere) or from a dedicated `welcomeTip` pool. Simplest: use `dailyTip` from `useContentRotation(stateData.tips)` as the `WELCOME.tip` line. This wires two birds with one hook call.
**Warning signs:** ImmersionContainer welcome phase shows the same tip every session despite CVAR-01 being "completed."

---

## Code Examples

All patterns are derived from existing project code — no external sources needed.

### CVAR-01: Using useContentRotation for tips
```javascript
// Source: regulation-station/src/hooks/useContentRotation.js (Phase 1)
import { useContentRotation } from '../hooks/useContentRotation'

// Inside component receiving stateData:
const { item: dailyTip } = useContentRotation(stateData?.tips ?? [])
// dailyTip: string | null
```

### CVAR-02: Breath label selection (ImmersionContainer.jsx)
```javascript
// Replace BREATH_LABEL constant with dynamic selection:
const { index: cueIdx } = useContentRotation(stateData?.breathCues?.inhale ?? [])
const breathLabel = {
  inhale: stateData?.breathCues?.inhale?.[cueIdx] ?? 'Breathe in',
  hold:   stateData?.breathCues?.hold?.[cueIdx]   ?? 'Hold',
  exhale: stateData?.breathCues?.exhale?.[cueIdx] ?? 'Breathe out',
}
// Use breathLabel.inhale / breathLabel.exhale in the stabilize phase render
```

### CVAR-03: Protocol variant selection (component-local)
```javascript
// In StealthReset.jsx and ImmersionContainer.jsx independently:
import { useContentRotation } from '../hooks/useContentRotation'

const resetPool = stateData?.resetVariants ?? (stateData?.reset ? [stateData.reset] : [])
const { item: selectedReset } = useContentRotation(resetPool)
// Replace all stateData.reset references with selectedReset
// (selectedReset is null if pool is empty — guard with selectedReset ?? stateData.reset)
```

### CVAR-04: Time-of-day filter (TaskFilter.jsx)
```javascript
// Pure detection — call once at component render (stable during session)
function getTimeOfDaySlot() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12)  return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  return 'evening'
}

// In TaskFilter component:
const slot = getTimeOfDaySlot()
const visibleItems = tasks.items.filter(
  item => !item.timeOfDay || item.timeOfDay === 'any' || item.timeOfDay === slot
)
// Use visibleItems instead of tasks.items in all rendering logic
```

### stateData.js breathCues shape (frozen state example)
```javascript
breathCues: {
  inhale: [
    'Breathe in',
    'Draw breath in slowly',
    'Open and receive',
    'Inhale through the nose',
  ],
  hold: ['Hold', 'Pause here', 'Rest at the top', 'Suspend'],
  exhale: [
    'Breathe out',
    'Release slowly',
    'Let it all go',
    'Long slow exhale',
  ],
},
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single static tip per session | 20+ daily-rotating tips via useContentRotation | Phase 2 | Users see fresh polyvagal content every day without repetition |
| "Breathe in / Hold / Breathe out" every session | 4+ phrase variants per breath phase, daily rotation | Phase 2 | Immersion feels different day-to-day, reducing habituation |
| One somatic protocol per state | 2-3 date-stable protocol variants per state | Phase 2 | Protocol familiarity remains (same day = same protocol) without long-term repetition |
| Static task list (all tasks always visible) | Time-tagged tasks filtered to morning/afternoon/evening | Phase 2 | Tasks feel contextually relevant — morning tasks don't appear at 9pm |

---

## Open Questions

1. **Where should the daily tip be displayed?**
   - What we know: `tips` array currently has no UI consumer. CVAR-01 requires one.
   - What's unclear: Whether to add to StealthReset, StatusBar, or ImmersionContainer welcome screen.
   - Recommendation: Add to the ImmersionContainer welcome screen as the `.tip` line (replaces hardcoded `WELCOME[state].tip`). This is the moment users are most receptive to educational content. As a bonus, also surface it in the StealthReset mechanism section. Planner can pick one or both.

2. **Should the `WELCOME` constant in ImmersionContainer be migrated to stateData.js?**
   - What we know: `WELCOME` is a per-state object with `headline`, `body`, and `tip` fields. It lives inside `ImmersionContainer.jsx` currently.
   - What's unclear: Phase 2 requirement is only for tip rotation (CVAR-01). Moving `headline` and `body` is out of scope.
   - Recommendation: Keep `headline` and `body` in `WELCOME` (scope-creep risk). Only replace `WELCOME[state].tip` with the daily tip from `stateData.tips`. Leave `WELCOME` as-is otherwise.

3. **How many task items per time slot to author?**
   - What we know: Current pool is 5 items per state (all untagged). TaskFilter "shed to one" mechanic needs sufficient items to be meaningful.
   - What's unclear: Exact authorship volume needed.
   - Recommendation: Author 3 items per slot (morning/afternoon/evening) + 2 `any` items = 11 items per state per slot-aware state. This gives users 5 visible items at any given time of day, which is enough for the shed mechanic.

---

## Validation Architecture

> `nyquist_validation` key absent from `.planning/config.json` — treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual browser smoke test (no automated test runner in project) |
| Config file | None |
| Quick run command | `npm run dev` (port 5173) |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CVAR-01 | Daily tip changes after calendar day advances; 20+ tips per state in stateData.js | Unit (pure data) + Smoke (visual) | Count `STATES.frozen.tips.length >= 20` in browser console | ❌ Wave 0 |
| CVAR-02 | Breath label in ImmersionContainer stabilize phase varies day-to-day; 4+ variants per phase in stateData | Unit (pure data) + Smoke (visual) | Enter immersion, observe "Breathe in" / "Hold" / "Breathe out" label text | ❌ Wave 0 |
| CVAR-03 | Opening app on different days shows different protocol title in StealthReset; 2-3 variants in stateData per state | Smoke (manual override date) | Temporarily change `new Date()` stub in useContentRotation and observe StealthReset title | ❌ Wave 0 |
| CVAR-04 | At 9am, morning-tagged tasks visible; at 7pm, evening-tagged tasks visible; all-day tasks always visible | Smoke (time manipulation) | Change system time or stub `getTimeOfDaySlot` return value; observe TaskFilter visible items | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Open app in browser, select a state, verify the changed component shows no console errors
- **Per wave merge:** `npm run build && npm run lint` must be clean
- **Phase gate:** All four CVAR requirements manually verified with explicit time/date boundary testing before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Manual verification script for stateData.js pool sizes (count tips, breathCues variants, resetVariants, time-tagged tasks)
- [ ] `TaskFilter.jsx` time-slot filter tested with mocked hour values
- [ ] `ImmersionContainer.jsx` breath label verified to use daily variant (not hardcoded constant)
- [ ] No automated test runner exists — verification remains manual for this phase

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `regulation-station/src/data/stateData.js` — exact current data shape, tip pool size (8/state), task item shape, reset protocol structure
- Direct code inspection: `regulation-station/src/components/ImmersionContainer.jsx` — hardcoded `BREATH_LABEL` constant (line 40), `WELCOME` constant, grounding phrases structure
- Direct code inspection: `regulation-station/src/components/StealthReset.jsx` — reads `stateData.reset` directly; component interface is `{ stateData, onComplete }`
- Direct code inspection: `regulation-station/src/components/TaskFilter.jsx` — renders `tasks.items` directly, no existing time-of-day filter
- Direct code inspection: `regulation-station/src/hooks/useContentRotation.js` — Phase 1 hook, confirmed working, returns `{ item, index }`
- Direct code inspection: `.planning/phases/01-foundations/01-VERIFICATION.md` — confirms useContentRotation is verified and ready for Phase 2 consumers
- `.planning/STATE.md` — architecture decisions: session-start-only rotation, no mid-session changes, no new dependencies, 44kB headroom

### Secondary (MEDIUM confidence)
- `new Date().getHours()` for time-of-day slot: standard JavaScript, zero browser compatibility concerns

### Tertiary (LOW confidence)
- Content authorship suggestions (specific protocol names, tip topic clusters): educated reasoning, not sourced from polyvagal literature. Quality review by human is required before content ships.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies; all patterns use Phase 1 infrastructure
- Architecture (data shapes): HIGH — derived from direct stateData.js and component inspection
- Architecture (wiring patterns): HIGH — all wiring follows established Phase 1 patterns
- Content authorship suggestions: LOW — topic clusters are reasonable but require expert review
- Pitfalls: HIGH — derived from direct reading of the specific components being modified

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable domain — no external APIs, no third-party libraries)
