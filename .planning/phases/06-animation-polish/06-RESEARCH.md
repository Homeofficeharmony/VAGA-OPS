# Phase 6: Animation Polish - Research

**Researched:** 2026-03-11
**Domain:** framer-motion AnimatePresence, CSS transitions, React state-driven animation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**State environment transition**
- Staggered transition: Background and ImmersionBackground color field transition first (~0–400ms), then cards and accent elements follow (~400–900ms)
- Timing: Deliberate — 600–900ms total. Communicates that selecting a state is a meaningful choice, not an accidental tap
- Scope: All elements using `stateData.accentHex` (border glows, status indicators, accent dots, buttons) transition to the new accent color, not just the wrapper
- Card participation in transition: Claude's discretion — pick the most natural approach given the existing CSS spring on the active card
- Accent color implementation: Claude's discretion — pick whatever is most maintainable given the existing CSS custom property + inline style mix

**Tab content animation**
- Style: Fade + slight upward rise (~12px translate Y) — new content fades in while lifting gently. No directional slide
- Speed: Medium, 250–350ms — noticeable but not slow, consistent with existing framer-motion usage in the app
- First mount: No animation on page load — only animate on tab switch. Regulate tab just appears on startup
- Container vs content: Claude's discretion — animate the container immediately rather than waiting for content to render

### Claude's Discretion
- Active card participation logic during state switch (how StateSelector cards deactivate/activate)
- CSS transition vs framer-motion for accent color changes across elements
- Exact easing curves within the deliberate 600–900ms envelope
- How many milliseconds of stagger between background and content layers
- Whether to delete `transition-opacity duration-200` from tab wrapper divs in App.jsx once AnimatePresence handles it

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STUX-01 | User sees the full page environment animate/transition when selecting a different nervous system state | framer-motion AnimatePresence keyed to activeTab for tab transitions; CSS `transition` on inline styles for accent color stagger; existing `transition-colors duration-1000` on App.jsx root wrapper as foundation |
</phase_requirements>

---

## Summary

This phase adds three layers of animation to existing, already-functional UI: (1) a staggered environment transition when the user switches nervous system states, (2) the active StateSelector card expanding with a deliberate spring, and (3) tab content fading in with a gentle upward rise on each tab switch. No new packages are needed — framer-motion 12.34.5 is already installed and already used in the codebase.

The app already has a strong foundation: `transition-colors duration-1000` on the App.jsx root wrapper, CSS transitions on StateSelector card opacity/border/background, and `AnimatePresence mode="wait"` used in BreathingOrb. The work is surgical — extend existing transitions and add AnimatePresence around tab content blocks in App.jsx.

The primary risk is coordination between the two animation systems: CSS transitions (used for color/opacity on persistent elements) and framer-motion (used for enter/exit of discrete elements). The rule already established in the codebase — CSS for persistent elements, framer-motion for mount/unmount — should be preserved. Mixing them on the same element for the same property causes conflicts.

**Primary recommendation:** Extend CSS transitions on inline styles for the accent color stagger, and wrap the three tab content divs in App.jsx with `<AnimatePresence mode="wait">` + `<motion.div key={activeTab}>` for tab transitions.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | ^12.34.5 (already installed) | AnimatePresence for tab enter/exit; motion.div for declarative animation | Already used in BreathingOrb, TabBar, AmbientSoundscape, RegulationDepthMeter — zero install cost |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CSS `transition` property | Browser native | Color, border-color, box-shadow, background, opacity on persistent elements | When the element stays mounted and only its visual properties change (accent color stagger) |
| CSS `@keyframes` | Browser native | One-shot animations (fadeIn, fadeInUp already defined in index.css) | Avoid here — framer-motion declarative API is more controllable for enter/exit |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| framer-motion AnimatePresence for tabs | CSS `@keyframes` + conditional class | CSS approach can't handle exit animations; tab content disappears before exit animates because the conditional removes it from DOM instantly |
| CSS `transition` for accent stagger | framer-motion `animate` on each accent element | framer-motion on every accentHex-bearing element adds unnecessary motion.div wrappers and is harder to audit; CSS transition on inline style is simpler and already partially in place |

**Installation:** No new packages. framer-motion is already a dependency.

---

## Architecture Patterns

### Recommended Project Structure

No new directories. All changes are within existing files:

```
src/
├── App.jsx                     # ADD: AnimatePresence + motion.div around 3 tab blocks; ADD: isFirstRender guard
├── components/
│   └── StateSelector.jsx       # EXTEND: CSS transition on accent-bearing inline styles if needed
└── index.css                   # No changes required (fadeInUp keyframe already exists)
```

### Pattern 1: AnimatePresence Keyed to activeTab (Tab Transition)

**What:** Wrap the three tab content blocks in a single `<AnimatePresence mode="wait">`. Each block becomes a `<motion.div key={activeTab}>` with `initial`, `animate`, `exit` props.

**When to use:** Any time content is conditionally rendered and you need exit animations before new content mounts.

**Critical constraint:** `AnimatePresence` must wrap the conditional, not be inside it. The `motion.div` must be a **direct child** of `AnimatePresence`. Fragments inside `AnimatePresence` silently break exit animations.

**First-mount guard:** The user decision says "no animation on page load — regulate tab just appears on startup." This requires a `useRef` flag that tracks whether a tab switch has occurred, or `initial={false}` on `AnimatePresence` itself.

`initial={false}` on `AnimatePresence` suppresses the `initial` animation for all children on first mount. This is the correct tool for the "no animation on startup" requirement.

```jsx
// Source: framer-motion official docs + existing BreathingOrb.jsx:77 pattern
import { AnimatePresence, motion } from 'framer-motion'

// In App.jsx, replace the three conditional tab divs with:
<AnimatePresence mode="wait" initial={false}>
  {activeTab === 'regulate' && !isImmersive && (
    <motion.div
      key="regulate"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      {/* existing regulate content */}
    </motion.div>
  )}
  {activeTab === 'insights' && !isImmersive && (
    <motion.div
      key="insights"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      {/* existing insights content */}
    </motion.div>
  )}
  {activeTab === 'tools' && !isImmersive && (
    <motion.div
      key="tools"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      {/* existing tools content */}
    </motion.div>
  )}
</AnimatePresence>
```

**Note on `mode="wait"`:** Only one child animates at a time — the exiting tab fully exits before the entering tab begins. This matches the "deliberate" feel from the design brief and is consistent with how `BreathingOrb` uses it.

### Pattern 2: CSS Transition Stagger for Accent Color (State Environment Transition)

**What:** The App.jsx root wrapper already has `transition-colors duration-1000` (1000ms). The `isImmersive` background transitions on the wrapper. The stagger is implemented by **not changing** anything on the wrapper, but adding `transition` to inline-style properties on accent-bearing child elements with a `transitionDelay` of ~400ms.

**The mechanism:**
- Background color (App.jsx root wrapper `transition-colors duration-1000`) — already transitions when `selectedState` changes because Tailwind's `transition-colors` covers `background-color`, `border-color`, `color`, `fill`, `stroke`
- Accent elements (borders, glows, buttons in inline styles) — add `transition: 'color 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease, background-color 0.5s ease'` + `transitionDelay: '0.4s'` to the inline style objects that reference `stateData.accentHex`

**Example — StateSelector card surface (already has partial transition):**
```jsx
// Source: StateSelector.jsx:111 — extends existing transition string
style={{
  // existing:
  transition: 'opacity 0.35s ease, border-color 0.35s ease, background 0.45s ease, padding 0.35s ease',
  // extend to include delay for stagger:
  // The accentHex change comes from re-render when selectedState changes.
  // The existing transition already covers border-color and background.
  // Adding transitionDelay: '0.4s' staggers it behind the background layer.
  transitionDelay: '0.4s',
  border: `1px solid ${isActive ? s.accentHex + '50' : s.accentHex + '1c'}`,
  background: isActive ? `radial-gradient(...)` : `radial-gradient(...)`,
}}
```

**Key insight on accentHex transitions:** The accentHex value changes when React re-renders with a new `selectedState`. CSS `transition` on `border-color` and `background-color` in inline styles will animate the change automatically — the browser interpolates between the old computed value and the new one. This works for hex colors but NOT for complex values like `radial-gradient(...)`. For gradient backgrounds, the transition will snap, not interpolate. This is an acceptable constraint given the existing design.

**Background layer (already works — just verify):**
`App.jsx:229` has `transition-colors duration-1000`. The `backgroundColor` inline style uses `'var(--bg-base)'` not a state-reactive value, so the background transition is driven by the `data-theme` change path, not `selectedState`. The actual per-state background shift happens via `ImmersionBackground.jsx` (which uses no transitions by design). For the dashboard view (non-immersive), the "environment" color shift is expressed through the StateSelector cards and accent elements — not the page background.

**Practical implication:** The stagger implementation should focus on the StateSelector card accent colors and status indicators, not the page background, which does not change per state in dashboard mode.

### Pattern 3: Polyvagal Note Slide-In (Active Card Expansion)

The active card in StateSelector already uses:
- `transform: 0.45s cubic-bezier(0.34, 1.4, 0.64, 1)` spring on the button wrapper (line 84)
- Conditional rendering of the `polyvagalNote` div with `animate-fade-in` CSS class (line 185)

The `animate-fade-in` class applies `fadeIn 0.4s ease-out forwards` (tailwind.config.js:52). This is already a 400ms fade. No changes needed to the card expansion behavior — it already works. The phase can leave this as-is or confirm it reads correctly.

**If the active card needs to participate more visibly in the stagger:** Add `transitionDelay: '0.5s'` to the card border inline style so the border glow catch-up is visible after the background settles.

### Anti-Patterns to Avoid

- **Fragment inside AnimatePresence:** `<AnimatePresence><><motion.div .../><motion.div .../></></AnimatePresence>` silently kills exit animations. Use an array or single child.
- **Animating the same property with both CSS transition AND framer-motion:** Pick one system per property per element. The existing pattern (CSS for persistent color transitions, framer-motion for enter/exit opacity/transform) must be preserved.
- **`mode="wait"` with multiple simultaneous children:** `mode="wait"` only works correctly when there is one child at a time. The three tab blocks must be mutually exclusive (they already are via the `activeTab === 'x'` conditionals).
- **Forgetting `key` prop on motion.div inside AnimatePresence:** Without a unique `key`, React does not unmount/remount the component, and AnimatePresence never triggers exit animations.
- **Animating `box-shadow` via CSS transition on many elements simultaneously:** Box-shadow animation is not GPU-composited and triggers paint. Limit to 2–3 elements per state transition to stay at 60fps. The existing StateSelector halo `div` already uses `transition: 'box-shadow 0.4s ease'` (line 97) — this is acceptable because it is a single element.
- **Gradient interpolation via CSS transition:** `background: radial-gradient(...)` does not interpolate with CSS transitions in most browsers. The gradient will snap. Accept this or switch affected elements to use `backgroundColor` + `opacity` layering instead.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab exit animations | `setTimeout` to delay DOM removal + CSS class add/remove | `AnimatePresence mode="wait"` | Manual timing with setTimeout is fragile — React can batch state updates, animations desync |
| Stagger timing | Custom `useState` counter incremented per element | CSS `transitionDelay` on inline styles | CSS delay is zero-JS overhead; stagger is a presentation concern, not logic |
| Cross-fade between two tabs | Render both simultaneously with opacity | `AnimatePresence mode="wait"` | Double-rendering both tabs simultaneously can cause audio/timer side effects in the tab being exited |

**Key insight:** `AnimatePresence` solves the exit animation problem that pure CSS cannot — CSS alone cannot animate elements that are being removed from the DOM because they disappear before the transition completes.

---

## Common Pitfalls

### Pitfall 1: `initial={false}` Suppresses All Children on All Renders
**What goes wrong:** `<AnimatePresence initial={false}>` suppresses `initial` state for all children on every render, not just the first. It prevents the `initial` prop from being used on mount.
**Why it happens:** `initial={false}` is a global flag for the entire AnimatePresence instance.
**How to avoid:** This is actually the desired behavior here — `initial={false}` is specifically the tool to prevent animation on first render. The `initial` prop on `motion.div` still defines the starting state for subsequent mounts (tab switches). This is correct.
**Warning signs:** If no animation appears on tab switch after the first one, check that `initial` on the `motion.div` is set (e.g., `initial={{ opacity: 0, y: 12 }}`).

### Pitfall 2: `transition-opacity duration-200` Conflict
**What goes wrong:** App.jsx lines 277, 365, 403 have `<div className="transition-opacity duration-200">` on the tab content wrappers. If these divs are wrapped in `motion.div`, and `motion.div` also animates opacity, the CSS transition on the parent div and the framer-motion on the child `motion.div` both run. The outer div's CSS `transition-opacity` triggers on the same opacity change that framer-motion is managing.
**Why it happens:** `motion.div` replaces the outer div when wrapping. The `transition-opacity` class would be on `motion.div` itself.
**How to avoid:** Remove `transition-opacity duration-200` from the className of the three tab wrapper divs once `motion.div` handles opacity. The CONTEXT.md explicitly notes this as a cleanup task (Claude's discretion).
**Warning signs:** Opacity "double-transitions" — animation feels sluggish or stutters.

### Pitfall 3: Stagger Delay Persists After First Transition
**What goes wrong:** CSS `transitionDelay` on inline styles applies to every property change, including hover states, not just the state-switch transition. An element with `transitionDelay: '0.4s'` will delay its hover effect by 400ms too.
**Why it happens:** `transition-delay` in CSS is not contextual — it applies whenever the transition triggers.
**How to avoid:** Use a `transitionDelay` only when the accent color change is happening (i.e., keyed to the state change), or accept the slightly delayed hover response. In practice with these biophilic, deliberate interactions, a 400ms hover delay is acceptable but noticeable.
**Warning signs:** Hover feedback on inactive StateSelector cards feels unresponsive.

### Pitfall 4: Gradient Background Snap
**What goes wrong:** StateSelector card backgrounds use `radial-gradient(ellipse..., ${s.accentHex}...)` which does not interpolate via CSS transition. The gradient snaps to the new color instantly.
**Why it happens:** CSS transitions cannot interpolate between two different gradient expressions unless they match the same gradient type and number of stops. Most browsers do not attempt gradient interpolation.
**How to avoid:** Accept the snap for the gradient layer (it is the background texture, not the primary accent indicator). The `border-color` and `box-shadow` transitions on the card are the primary visual signal and do interpolate.
**Warning signs:** Card background snaps while border and shadow animate smoothly — this is expected behavior, not a bug.

### Pitfall 5: AnimatePresence Requires Direct Motion Children
**What goes wrong:** `AnimatePresence` wraps a regular `<div>` instead of a `<motion.div>`. No exit animation occurs.
**Why it happens:** `AnimatePresence` only detects mount/unmount of `motion.*` components.
**How to avoid:** Every child of `AnimatePresence` that should animate must be a `motion.*` element with a `key` prop.
**Warning signs:** Content disappears instantly on tab switch with no exit animation.

---

## Code Examples

Verified patterns from existing codebase and framer-motion API:

### Tab Transition (App.jsx — complete implementation)
```jsx
// Source: framer-motion AnimatePresence API (confirmed by BreathingOrb.jsx:77 in this codebase)
import { AnimatePresence, motion } from 'framer-motion'

const TAB_VARIANTS = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
}
const TAB_TRANSITION = { duration: 0.28, ease: 'easeOut' }

// Replace lines 276-485 in App.jsx:
<AnimatePresence mode="wait" initial={false}>
  {activeTab === 'regulate' && !isImmersive && (
    <motion.div
      key="regulate"
      variants={TAB_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={TAB_TRANSITION}
      className="space-y-0"  {/* remove transition-opacity duration-200 */}
    >
      {/* existing regulate content, unchanged */}
    </motion.div>
  )}
  {activeTab === 'insights' && !isImmersive && (
    <motion.div
      key="insights"
      variants={TAB_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={TAB_TRANSITION}
      className="space-y-6"  {/* remove transition-opacity duration-200 */}
    >
      {/* existing insights content, unchanged */}
    </motion.div>
  )}
  {activeTab === 'tools' && !isImmersive && (
    <motion.div
      key="tools"
      variants={TAB_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={TAB_TRANSITION}
      className="space-y-6"  {/* remove transition-opacity duration-200 */}
    >
      {/* existing tools content, unchanged */}
    </motion.div>
  )}
</AnimatePresence>
```

### Accent Color Stagger (StateSelector.jsx — card surface inline style extension)
```jsx
// Source: StateSelector.jsx:111 — extends existing transition
// The transitionDelay staggers accent color updates behind the background layer.
// Gradient backgrounds will snap; border-color and box-shadow will interpolate.
style={{
  borderRadius: radius,
  border: `1px solid ${isActive ? s.accentHex + '50' : s.accentHex + '1c'}`,
  background: isActive
    ? `radial-gradient(ellipse at 22% 28%, ${s.accentHex}1a 0%, transparent 62%), var(--bg-panel)`
    : `radial-gradient(ellipse at 50% 50%, ${s.accentHex}09 0%, transparent 55%), var(--bg-panel)`,
  padding: '18px 16px 16px',
  opacity: isActive ? 1 : 0.6,
  transition: 'opacity 0.35s ease, border-color 0.5s ease, background 0.45s ease, padding 0.35s ease, box-shadow 0.5s ease',
  transitionDelay: '0.4s',  // stagger behind background layer
}}
```

### Existing Reference Pattern (BreathingOrb.jsx:77 — already in codebase)
```jsx
// Source: regulation-station/src/components/BreathingOrb.jsx:77
<AnimatePresence mode="wait">
  <motion.h3
    key={phase}
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.4 }}
  >
    {PHASE_LABELS[phase]}
  </motion.h3>
</AnimatePresence>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` package name | `motion/react` import path | Late 2024 (rebranded) | API identical — existing `import { motion, AnimatePresence } from 'framer-motion'` still works in v12, no migration needed |
| `mode="popLayout"` for tabs | `mode="wait"` preferred for deliberate UI | v10+ | `wait` forces sequential exit→enter which matches "meaningful choice" design intent |

**Deprecated/outdated:**
- `AnimateSharedLayout`: Removed in framer-motion v11+, replaced by `layoutId` on motion elements. Not relevant to this phase.

---

## Open Questions

1. **Stagger delay on hover interaction**
   - What we know: `transitionDelay: '0.4s'` on StateSelector card inline style will also delay hover feedback by 400ms
   - What's unclear: Whether this hover delay is acceptable given the biophilic, deliberate interaction style, or whether it will feel broken
   - Recommendation: Implement with the delay; assess during manual verification. If hover delay is objectionable, split the transition into two separate style objects — one for state-switch properties (with delay) and one for hover-reactive properties (without delay). This requires a `isTransitioning` state boolean that resets after 900ms.

2. **Background layer stagger source**
   - What we know: In dashboard (non-immersive) mode, `App.jsx:229` has `transition-colors duration-1000` but the background color is `var(--bg-base)` — a theme CSS var, not a state-reactive value. The page background does not change when `selectedState` changes.
   - What's unclear: What the user envisions as the "background layer" that transitions first in the stagger. Candidates: (a) the StateSelector card backgrounds, (b) the NeuralBackground component, (c) the `ImmersionBackground` (only visible in immersive mode)
   - Recommendation: For dashboard mode, the "background layer" is the StateSelector cards' subtle accent gradient. The 0–400ms first layer transitions via the existing `transition-colors duration-1000` on the root wrapper as a CSS-custom-property transition. The 400–900ms second layer is the explicit accent elements with `transitionDelay: '0.4s'`.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None installed — no test runner found in package.json or project root |
| Config file | None — see Wave 0 |
| Quick run command | `npm run lint` (ESLint only) |
| Full suite command | `npm run build` (build verification) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STUX-01 | Tab content animates on switch (fade + rise, not cut) | manual | Visual inspection in browser | N/A — animation |
| STUX-01 | No animation on first page load (regulate tab appears immediately) | manual | Visual inspection in browser | N/A — animation |
| STUX-01 | Accent color elements transition with 400ms stagger after state select | manual | Visual inspection in browser | N/A — animation |
| STUX-01 | Build succeeds with no new lint errors | smoke | `npm run build && npm run lint` | ✅ existing scripts |

**Note:** Animation behavior cannot be automatically asserted without a visual regression or Playwright/Cypress test suite, neither of which is installed. All animation correctness is manual-verification territory. The automated gate is `npm run build && npm run lint` confirming no regressions.

### Sampling Rate
- **Per task commit:** `npm run lint`
- **Per wave merge:** `npm run build && npm run lint`
- **Phase gate:** Build green + manual visual check of all three animations before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] No test framework installed — all animation verification is manual. No gaps to fill programmatically; this is acceptable for a UI animation phase.

---

## Sources

### Primary (HIGH confidence)
- `regulation-station/src/components/BreathingOrb.jsx:77` — existing `AnimatePresence mode="wait"` usage confirms v12 API is identical to documented patterns
- `regulation-station/src/App.jsx:229` — existing `transition-colors duration-1000` is the foundation for the background stagger layer
- `regulation-station/src/components/StateSelector.jsx:84,111` — existing CSS spring and transition strings confirm the extension pattern
- `regulation-station/src/index.css` — `fadeIn`, `fadeInUp`, `stateBreathe` keyframes confirmed; `animate-fade-in` and `animate-pulse-slow` mapped to tailwind.config.js
- `regulation-station/package.json` — framer-motion 12.34.5 confirmed installed

### Secondary (MEDIUM confidence)
- [AnimatePresence modes — Motion tutorial](https://motion.dev/tutorials/react-animate-presence-modes) — `mode="wait"` behavior, one-child-at-a-time constraint, complementary easing tip
- [AnimatePresence — Framer docs](https://www.framer.com/docs/animate-presence/) — `initial={false}` suppresses first-render animation; key prop triggers unmount/remount
- [The Power of Keys in Framer Motion](https://www.nan.fyi/keys-in-framer-motion) — key change pattern for tab switching
- [Understanding AnimatePresence in Framer Motion](https://medium.com/javascript-decoded-in-plain-english/understanding-animatepresence-in-framer-motion-attributes-usage-and-a-common-bug-914538b9f1d3) — fragment bug and direct-child requirement

### Tertiary (LOW confidence)
- [How to animate box-shadow with silky smooth performance](https://tobiasahlin.com/blog/how-to-animate-box-shadow/) — box-shadow is not GPU-composited, use sparingly

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — framer-motion 12.34.5 is already installed; API verified from live codebase usage
- Architecture: HIGH — tab pattern is well-established; accent stagger pattern verified from existing StateSelector CSS transition strings
- Pitfalls: HIGH — gradient interpolation limitation and transitionDelay hover side effect are CSS spec facts; AnimatePresence direct-child requirement is documented and observed in codebase

**Research date:** 2026-03-11
**Valid until:** 2026-09-11 (framer-motion v12 API is stable; CSS transition behavior is permanent spec)
