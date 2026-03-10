# Domain Pitfalls

**Domain:** Visual & Experience Refresh — nervous system regulation dashboard (React 19 + Vite 7 + Tailwind 3)
**Researched:** 2026-03-09
**Scope:** Adding animations, data viz, content rotation, atmospheric effects, and visual overhaul to an existing system

---

## Critical Pitfalls

Mistakes that cause rewrites, regressions, or outright user harm in this app.

---

### Pitfall 1: Framer Motion Already Imported — Version Lock Risk

**What goes wrong:** `BreathingOrb.jsx` already imports `framer-motion` v12, but the rest of the app uses CSS transitions and inline `style` animations exclusively. Any new animated component that imports framer-motion must stay on the same major version — a mismatch (e.g., upgrading for a new feature) will break `AnimatePresence`/`motion` APIs app-wide.

**Why it happens:** The BreathingOrb was added in a later wave with framer-motion; the existing ImmersionContainer, ImmersionBackground, and all overlay components deliberately avoided it (they use CSS `transition` + `opacity` toggles). Two animation systems now coexist with no policy defining which to use where.

**Consequences:** If visual refresh work adds more framer-motion components, the bundle grows unpredictably. Current bundle is ~656kB — framer-motion v12 is approximately 45–60kB gzipped. Mixing two systems also makes debugging animation conflicts harder.

**Prevention:**
- Before adding any new animation, decide: is this a breath-driven animation (use CSS / RAF — zero runtime cost, deterministic) or a UI transition (framer-motion is acceptable)? Document this rule.
- Do not add framer-motion to any component inside ImmersionContainer — that system already works via direct CSS `transition` and is production-stable.
- `AnimatePresence` is the only framer-motion feature providing real value here (phase transition exit animations). Scope its use to shell-level tab transitions only.

**Detection:** Build size increasing by >40kB after adding a visual component is a sign framer-motion is being pulled into a new code path.

---

### Pitfall 2: rAF Loops Stacking — Multiple Concurrent Canvases

**What goes wrong:** `LissajousVisualizer` (AudioPlayer) runs its own `requestAnimationFrame` loop at 60fps. `ImmersionBackground` reads from `useBreathTimer`, which itself runs a RAF loop. `BreathingOrb` reads from the same `useBreathTimer` hook. If session history charts, an upgraded audio visualizer, or any atmospheric particle effect adds another RAF loop, the compositor must process multiple overlapping paint operations per frame.

**Why it happens:** Each canvas component manages its own animation lifecycle. There is no central render coordinator. When immersion mode is active, at least 2 RAF loops already run simultaneously. Adding a third (e.g., a canvas-based sparkline or particle field) pushes this to 3+.

**Consequences:** Frame drops on mid-range laptops (the primary hardware for this audience). Janky breath orb animation is the worst possible outcome — it defeats the regulation purpose. Battery drain on unplugged machines during work sessions.

**Prevention:**
- New data viz charts must NOT use canvas + RAF. Use SVG + CSS animation for session history (the 5-bar sparkline in VagusLogSidebar already does this correctly — replicate that pattern).
- Any upgraded audio visualizer should reuse the existing `LissajousVisualizer` RAF loop rather than create a new one. If it needs to show additional data, draw it within the same `animate()` call.
- For atmospheric effects (particle fields, flowing gradients), use CSS `@keyframes` with `will-change: transform` instead of canvas. CSS compositor thread animations do not block the main thread.
- Enforce a rule: at most one canvas RAF loop active at any time. Audit `useEffect` cleanup functions — missing `cancelAnimationFrame` on unmount is a common leak.

**Detection:** Add a dev-mode RAF counter (`let frameCount = 0; requestAnimationFrame(() => frameCount++)`) and log active loops. More than 2 concurrent loops during immersion mode = red flag.

---

### Pitfall 3: CSS Custom Property Override Collisions in Theme Overrides

**What goes wrong:** `index.css` contains a large `[data-theme="light"], [data-theme="pastel"]` block that overrides hardcoded Tailwind class selectors (e.g., `.bg-\[\#060d1a\]`, `.bg-charcoal-900`). New components added during the visual refresh that use hardcoded hex values directly in JSX `style` props (e.g., `style={{ backgroundColor: '#0A0D14' }}`) will NOT be caught by these theme overrides — they bypass the CSS cascade entirely.

**Why it happens:** The existing VagusLogSidebar uses hardcoded `#0A0D14`, `#22262f`, and `bg-charcoal-*` classes everywhere. Any copy-paste of its pattern into new components carries this forward. The sidebar works on dark theme only; it is visually broken on light and pastel themes already.

**Consequences:** Visual refresh components appear with dark-theme colors on light/pastel — unreadable text (dark text on dark background), invisible borders, color-inversion artifacts.

**Prevention:**
- All new components must use `var(--bg-base)`, `var(--bg-panel)`, `var(--bg-panel-alt)`, `var(--border)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)` exclusively.
- For state-reactive colors, use `stateData.accentHex` or `var(--accent-flow)` / `var(--accent-anxious)` / `var(--accent-frozen)`.
- Never copy inline style patterns from VagusLogSidebar — it is the one component that needs a theme remediation pass, not a template to follow.
- After each new component, manually switch to light theme and pastel theme in the browser before calling it done.

**Detection:** Any `style={{ backgroundColor: '#` or `style={{ color: '#` (hardcoded hex in JSX) that is NOT `stateData.accentHex` and NOT a one-off transparent overlay is a candidate for replacement.

---

### Pitfall 4: Data Visualization Library Adding 100kB+ to Bundle

**What goes wrong:** The session history data viz target (compelling charts, trends, mood arcs) is tempting to solve with a chart library (Recharts ~100kB gzipped, Victory ~80kB, Chart.js ~65kB). The project constraint is a 700kB JS bundle cap. Current bundle is ~656kB, leaving only ~44kB headroom. A chart library blows that cap immediately.

**Why it happens:** Charts feel like a "solved problem" — reaching for a library is the obvious move. But the actual data viz needed here is minimal: 5-bar sparklines (already built in VagusLogSidebar), weekly session counts, a mood arc over 7 days, and a shift delta summary. None of these require a full charting library.

**Consequences:** Bundle exceeds 700kB constraint. PWA cache hit ratio drops. Initial load on weak connections degrades. The app may feel slow exactly when the user is stressed — counterproductive for a regulation tool.

**Prevention:**
- Build all session history visualizations as raw SVG in JSX. A week's worth of sessions (max 90 stored) is trivially computable without a library.
- Reference the VagusLogSidebar sparkline as the pattern: `div` bars with `height` derived from data, rendered in a flex container. No library needed.
- If a genuine chart type is required (e.g., line chart for activation trend over 7 days), render it as an SVG `<polyline>` with computed points — ~20 lines of math, no import.
- Bundle-check every new dependency before adding: `vite-bundle-visualizer` or checking `dist/assets` size after `npm run build`.

**Detection:** `npm run build` output shows total JS increasing by >30kB after adding a dependency.

---

### Pitfall 5: Content Rotation Causing Jarring Interruptions During Active Regulation

**What goes wrong:** A content variety engine that rotates tips, breath cues, grounding phrases, or protocol steps during an active session can interrupt the user's focused state. The existing ImmersionContainer rotates `GROUNDING_PHRASES` every 20 seconds (line 341: `setInterval(() => setPhraseIndex(...), 20000)`) — this is intentionally slow. Anything faster, or anything that rotates during a breath phase transition, creates a competing visual event exactly when the user needs stillness.

**Why it happens:** Content rotation is usually designed for idle browse contexts (marketing sites, dashboards). A regulation tool is not an idle context — the user is mid-regulation, physiologically activated. Visual interruptions during exhale phases spike attention back to the screen.

**Consequences:** User notices the content change, breaks breath synchronization, has to restart the regulation sequence. Directly undermines the core product value.

**Prevention:**
- Tips and ambient content on the dashboard (non-immersive view) can rotate freely — the user is browsing, not regulating.
- Inside ImmersionContainer: only rotate grounding phrases, never rotate the breath cue label or protocol step. Keep the 20-second interval or slower.
- New "varied protocol steps" content must be selected at session START only, not during the session.
- Audio viz upgrades must not introduce visual novelty (new shapes, color pulses) during the stabilize phase. The existing LissajousVisualizer loops predictably — preserve that predictability.
- Rotation intervals shorter than one full breath cycle (~13 seconds for anxious state, 12 seconds for frozen) are forbidden inside immersion.

**Detection:** Any `setInterval` inside ImmersionContainer or BreathingOrb with an interval less than 12000ms is a red flag.

---

## Moderate Pitfalls

---

### Pitfall 6: Atmospheric Effects Triggering Vestibular Discomfort

**What goes wrong:** Atmospheric effects (flowing gradients, particle fields, parallax layers, pulsing background radials) can trigger motion discomfort or attention diversion in a significant portion of users. Anxious users — the primary users of this app when dysregulated — have heightened sensory sensitivity. The frozen state users have visual-field hyper-vigilance as a symptom.

**Prevention:**
- All moving atmospheric effects must respect `prefers-reduced-motion`. Add `@media (prefers-reduced-motion: reduce)` overrides to every new `@keyframes` block that uses `transform` or `opacity` animation.
- Cap atmospheric motion to sub-perceptual scale changes. ImmersionBackground already does this correctly: `peakScale: 1.18` for anxious, `1.10` for frozen, `1.05` for flow. New effects should not exceed these values.
- Avoid lateral motion entirely. The breath orb is purely radial (scale). Any left-right or diagonal movement is inappropriate for a regulation context.
- Test all atmospheric effects with Chromium devtools > Rendering > "Emulate CSS media feature prefers-reduced-motion: reduce".

---

### Pitfall 7: Randomness in Content Rotation Producing Repeated Content

**What goes wrong:** Using `Math.random()` to select tips or breath cues will produce repetitions — statistically guaranteed within small arrays. The stateData has 8 tips per state. With pure random selection, the same tip can appear twice in a row.

**Prevention:**
- Use a shuffle-once-per-session approach rather than random-each-time. On session start, shuffle the tips array with Fisher-Yates and store the result in a `useRef`. Advance through it linearly.
- Never pick the same index twice in a row. Simple guard: `if (newIndex === lastIndex) newIndex = (newIndex + 1) % array.length`.
- For protocol step variation (different phrasing for the same step), rotate through variants in fixed order per session. Randomness is a UX antipattern here.

---

### Pitfall 8: State Selection UX Enhancement Breaking the Auto-Immersion Flow

**What goes wrong:** The state selection UX is currently wired to `handleStateSelect` in App.jsx, which auto-immersive only on the first selection (`hasEnteredImmersion.current`). Any enhancement to the state selector (richer cards, hover animations, selection confirmation step) that delays or wraps the `onSelect` callback will break this auto-immersion trigger.

**Prevention:**
- The `onSelect(state)` call must remain synchronous and fire at the same point in the interaction (user commits to a state). Do not add an interstitial confirmation step between selection and the callback.
- Visual enrichment (cards, hover states, animations) is safe as long as the final `onClick` still calls `onSelect(state)` directly.
- Test the full flow after any state selector change: select a state → immersion should open automatically on first selection of the session.

---

### Pitfall 9: Hardcoded Canvas Dimensions Not Responding to Container Size

**What goes wrong:** `LissajousVisualizer` renders with `width={320} height={192}` fixed attributes on the `<canvas>` element. On narrow screens or if the container width changes (e.g., during a layout shift from immersion mode toggle), the canvas does not re-render at the new size. Pixels appear stretched or the Lissajous figure is clipped.

**Prevention:**
- If upgrading the audio visualizer, use a `ResizeObserver` to update canvas dimensions when the container resizes. The pattern: observe the parent `div`, update `canvas.width` and `canvas.height` in the observer callback, then re-run the draw.
- Do not use CSS `width: 100%` on the canvas element without also setting `canvas.width` in JavaScript — CSS scaling just stretches pixels.

---

### Pitfall 10: `prefers-color-scheme` Conflicting with the Manual Theme System

**What goes wrong:** If any new component or library adds `@media (prefers-color-scheme: dark)` CSS, it will conflict with the `[data-theme]` attribute system. The app uses a manual theme toggle that overrides the OS preference — this is intentional (the user may want pastel on a dark-OS system).

**Prevention:**
- Never use `@media (prefers-color-scheme)` in component CSS or in new `@layer` blocks.
- If a third-party library injects its own dark-mode styles via `prefers-color-scheme`, override them in `index.css` under all three `[data-theme]` selectors.
- This is a particular risk if adding any charting library or UI component library that ships its own CSS.

---

## Minor Pitfalls

---

### Pitfall 11: Google Fonts Network Dependency Breaking Offline Feel

**What goes wrong:** `index.css` imports Inter and JetBrains Mono from Google Fonts via `@import url(...)`. In offline conditions (PWA cached) the fonts load from cache correctly after first visit. But the very first load on a new device requires network access — if fonts fail, the app renders in system-ui fallback, which changes layout metrics and can shift the UI noticeably.

**Prevention:**
- The PWA service worker (vite-plugin-pwa) should cache the Google Fonts stylesheets and font files. Verify the PWA manifest's `cacheId` covers font URLs.
- Long-term: consider `@font-face` self-hosting the two font subsets (Latin, weights 300-600) in `public/fonts/` to eliminate the external dependency entirely.

---

### Pitfall 12: Tailwind Purge Removing Dynamically Constructed Classes

**What goes wrong:** Classes constructed at runtime like `bg-${state}-glow` or `border-${accent}` are not in the static source and will be purged by Tailwind's content scanner. The existing code already handles this by using `style` props for dynamic hex values — but if visual refresh adds dynamic Tailwind class names (e.g., building `text-egreen`, `text-eamber`, `text-ered` from a variable), those classes may be stripped from the production build.

**Prevention:**
- Dynamic Tailwind classes must be safelisted in `tailwind.config.js` under `safelist`. Alternatively, keep dynamic styling in `style` props.
- The existing pattern (CSS custom properties for theme colors + `stateData.accentHex` for state colors + `style` prop for dynamic values) is correct — do not switch to dynamic Tailwind class construction.

---

### Pitfall 13: Blur Effects and `backdrop-filter` Performance on Safari

**What goes wrong:** `backdrop-filter: blur()` is used in VagusLogSidebar (`backdrop-blur-md`). Adding more frosted-glass / blur effects (a common "premium UI" pattern) is expensive to composite — especially in Safari, which repaints the entire blur region on every animation frame. Since immersion mode has animated background elements, any blurred panel on top will force a full repaint at 60fps.

**Prevention:**
- Use background color with low opacity (`var(--bg-panel)` at 85–95% opacity) instead of `backdrop-filter` for new panels.
- Reserve `backdrop-blur` only for panels that are completely static when visible (no animations in z-layers below them).

---

### Pitfall 14: Inline `onMouseEnter`/`onMouseLeave` Style Mutations Causing React Reconciliation Noise

**What goes wrong:** App.jsx and multiple components (MissionControl button, FlowLock button, AudioPlayer track rows) use `onMouseEnter`/`onMouseLeave` to mutate `e.currentTarget.style` directly. This is intentional — it avoids React state updates on hover. If the visual refresh introduces hover animations via `useState` (e.g., `const [hovered, setHovered] = useState(false)`), it will cause re-renders on every mouse move, which is heavy when the hover state is on a component that also renders animated children.

**Prevention:**
- Maintain the existing `onMouseEnter` direct style mutation pattern for hover effects.
- Use CSS `:hover` pseudo-classes via Tailwind utilities where possible (they have zero JS cost).
- Reserve `useState` hover tracking only when the hovered state needs to propagate to sibling or parent components.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Audio viz upgrade | Adding a second RAF loop alongside LissajousVisualizer | Extend the existing `animate()` function rather than creating a new canvas |
| Session history charts | Recharts/Victory bundle impact | Build SVG-in-JSX; reference VagusLogSidebar sparkline pattern |
| State selection UX | Wrapping `onSelect` in animation delay | Keep `onSelect` synchronous; animate the card, not the callback |
| Immersive visual expansion | Content rotating during breath stabilize phase | Rotate only at session start; enforce 20s minimum interval inside immersion |
| Atmospheric background effects | Vestibular/motion sensitivity | `prefers-reduced-motion` on every new keyframe; test with frozen-state users in mind |
| Theme-adaptive components | Hardcoded hex in JSX `style` props | CSS vars only; verify every new component on all 3 themes before merge |
| Content variety engine | `Math.random()` repetitions | Fisher-Yates shuffle-once-per-session; no consecutive repeats |
| framer-motion expansion | Version drift or duplicate bundle | Only use framer-motion for UI shell transitions; CSS+RAF for breath-driven animations |

---

## Sources

All findings derived from direct code analysis of the existing implementation:

- `regulation-station/src/App.jsx` — state machine, overlay management, auto-immersion trigger
- `regulation-station/src/index.css` — theme system, CSS custom properties, light/pastel overrides
- `regulation-station/src/components/LissajousVisualizer.jsx` — RAF canvas loop
- `regulation-station/src/components/ImmersionBackground.jsx` — breath-synced atmospheric layer
- `regulation-station/src/components/ImmersionContainer.jsx` — grounding phrase rotation timing
- `regulation-station/src/components/BreathingOrb.jsx` — framer-motion usage
- `regulation-station/src/components/VagusLogSidebar.jsx` — sparkline pattern, theme hardcoding
- `regulation-station/src/hooks/useAmbientEngine.js` — Web Audio API engine
- `regulation-station/package.json` — dependency inventory (framer-motion v12, no chart lib)
- `regulation-station/tailwind.config.js` — custom tokens and animation keyframes

**Confidence:** HIGH — all pitfalls are grounded in specific existing code patterns, not general best practices. No external sources required.
