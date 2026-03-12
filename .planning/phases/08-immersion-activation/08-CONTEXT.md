# Phase 8: Immersion Activation Capture - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a pre-session activation level picker to ImmersionContainer's welcome phase. The picked value flows through `onComplete` as `activationBefore`, replacing the hardcoded `null` at App.jsx:542. After this phase, PostResetCheckin renders ActivationBars with real before/after data for all immersion sessions.

</domain>

<decisions>
## Implementation Decisions

### Picker placement
- Inline in the welcome screen — below the tip, above the Begin button
- A subtle horizontal rule (faint accent-colored border) separates the welcome copy + tip from the picker section
- Single screen — no extra sub-step before the welcome headline/body

### Picker interaction
- Begin button is **disabled** until a number is selected — picking is required, not optional
- No skip link — every immersion session must capture activationBefore to close the DVIZ-01 gap completely
- Closing via ✕ exit or Esc fires `onClose` with no session logged (same as today — no prompt needed)

### Picker visual treatment
- Selected number gets accentHex background fill (matching PostResetCheckin's activation selection style)
- Unselected buttons: transparent background, accentHex border at 40% opacity (same as PostResetCheckin)
- Begin button uses existing styling but is visually dimmed (reduced opacity) when no number is selected

### Picker copy
- Label: **"Where are you right now?"** — softer, somatic language consistent with the app's regulation-first tone
- Scale subtitle: **"0 = shut down · 10 = wired"** — same format as PostResetCheckin but with state-aware endpoint language

### Data flow
- `activationBefore` stored in a ref inside `ImmersionContainer` (set when user taps a number, same pattern as `activationRef` for the after-value)
- `handleComplete` adds `activationBefore` to the object passed to `onComplete`
- App.jsx `onComplete` handler for immersion uses the passed `activationBefore` instead of hardcoded `null`

### Claude's Discretion
- Exact opacity/transition for disabled Begin button state
- Whether to store activationBefore in a ref or useState (ref preferred — no re-render needed)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PostResetCheckin.jsx:201–242` — existing 0–9 activation picker UI with exact button styles to mirror
- `ImmersionContainer.jsx:387–393` — `handleComplete` already collects `activationAfter` from a ref; `activationBefore` follows same pattern
- `ImmersionContainer.jsx:481–560` — welcome phase render block; picker slots in after tip paragraph, before Begin button
- `ImmersionContainer.jsx:94` — `activationRef` pattern: `useRef(null)`, updated on selection, read in `handleComplete`

### Established Patterns
- Refs for in-flight session data (not useState) — `activationRef`, `startedAtRef` in ImmersionContainer
- `onComplete` callback shape: `{ activationAfter, notes, startedAt, resetCompleted }` — extend with `activationBefore`
- Button disabled state handled inline via opacity + pointer-events (no dedicated disabled component)

### Integration Points
- `ImmersionContainer.jsx` — add `activationBeforeRef`, picker UI in welcome block, pass `activationBefore: activationBeforeRef.current` in `handleComplete`
- `App.jsx:536–542` — replace `activationBefore: null` with `activationBefore: activationBefore ?? null` from destructured `onComplete` args
- `PostResetCheckin.jsx` — no changes needed; already renders ActivationBars when `activationBefore` is non-null

</code_context>

<specifics>
## Specific Ideas

- The picker should feel like a quick check-in, not a form — same visual language as the PostResetCheckin "after" picker so users recognize the pattern immediately
- "Where are you right now?" chosen over "Energy level now?" to avoid clinical tone before a calming session

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-immersion-activation*
*Context gathered: 2026-03-11*
