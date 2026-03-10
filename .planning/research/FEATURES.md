# Feature Landscape

**Domain:** Calm-tech / Nervous system regulation dashboard (web PWA, WFH solopreneurs)
**Researched:** 2026-03-09
**Research mode:** Competitor-informed feature gap analysis
**Confidence note:** All competitor findings are from training data (knowledge cutoff August 2025). External web tools were unavailable during this session. Competitor UX claims rated MEDIUM confidence — well-documented, but unverified against live products.

---

## Competitor Reference Apps

Apps surveyed: Calm, Headspace, Balance, Breathwrk, Waking Up, Oak, Finch, Portal

---

## Domain 1: Visual Engagement During Sessions

### What Competitors Do

**Calm** (MEDIUM confidence)
- Animated nature scenes as full-screen session backgrounds: rain on leaves, fireplace, flowing water, northern lights. Video or high-quality looping GIF.
- During breathing exercises: simple expanding/contracting circle with text cues ("breathe in" / "hold" / "breathe out"). No complex animation — the background scenery carries the atmosphere.
- Transition between session phases uses slow cross-dissolve on background video.
- Minimal UI chrome during active session — just the orb and the timer, everything else hides.

**Headspace** (MEDIUM confidence)
- Character-based animations (illustrated "dot" characters) that respond to session state: anxious dots bounce, calm dots float gently.
- Progress through a session is visualized as the character changing posture or environment.
- Color fields shift slowly — from warm agitated oranges to cool lavender blues — as you regulate.
- Breathing circles are simpler than most competitors: just a ring that scales. The character storytelling carries engagement.

**Breathwrk** (MEDIUM confidence)
- The entire UI IS the breath animation. No dashboard visible during session.
- Pattern-specific visuals: box breathing shows a square that fills corner-by-corner. 4-7-8 shows a circle that segments. Wim Hof shows a pulsing energy field.
- Color shifts with each phase (inhale = brighter, exhale = darker).
- No extraneous text during session — the shape teaches the pattern.
- Post-session: a simple "session done" summary card with streak and HRV score.

**Balance** (MEDIUM confidence)
- Adaptive audio-reactive backgrounds: the background texture subtly shifts in density/motion with the guide's voice amplitude.
- Uses illustrated abstract forms — not photographs, not characters. Organic blob shapes that breathe with the session.
- Session "depth meter" similar to what's in ImmersionContainer but visualized as a gradient column filling from the bottom, not a number.

**Oak** (MEDIUM confidence)
- Minimalist to the extreme: a single ring, no background, dark screen. The ring is the product.
- Three breath programs: box, 4-7-8, unguided. No content variety — simplicity is the feature.
- Stats panel after session shows HRV (if Apple Watch connected).

**Portal** (MEDIUM confidence)
- The most visually ambitious of the group.
- Real 4K nature video backgrounds — not loops, but actual recorded scenes with spatial audio.
- "Teleportation" metaphor: you pick a destination (forest, beach, cave), not a breath technique. The environment handles the regulation.
- Very little UI chrome. The video IS the experience.

**Waking Up** (MEDIUM confidence)
- Audio-first. No visual engagement during sessions beyond a simple timer circle.
- Background is a dark static gradient. The theory: visual stimulation competes with contemplative attention.
- Notable exception: "Moments" sessions (1–5 min) show a slow geometric animation.

**Finch** (MEDIUM confidence)
- Gamified creature: your "penguin" grows and levels up with self-care check-ins.
- During breathing exercises: the penguin performs the breath with you — chest rises on inhale, drops on exhale.
- Color of the penguin's world shifts with mood rating (grey when struggling, colorful when thriving).

### What Regulation Station Has Now

- ImmersionContainer: expanding/contracting breath orb with glow rings, bloom effect on exhale, ambient radial gradient background
- LissajousVisualizer: animated Lissajous curve on canvas, trail of 200 points, paused state shows static figure
- VideoBackground in StealthReset: immersive video per state during 60-sec protocol
- BreathingOrb component (separate from ImmersionContainer's inline orb)
- ImmersionBackground + NeuralBackground components exist (not yet deeply wired into sessions)
- RegulationDepthMeter component exists

### Gap Analysis: Visual Engagement

| Gap | Competitors Who Have It | Our Current State |
|-----|------------------------|-------------------|
| Background atmosphere that changes with breath phase | Calm, Balance, Portal | Radial gradient is static during session |
| Orb responds to breath amplitude (grows with force, not just time) | Breathwrk, Balance | Orb scales by phaseProgress only |
| Color field shift across full session duration (start anxious red → end calm green) | Headspace, Balance | Accent color is fixed for the whole session |
| Breath pattern teaches itself visually (shape = pattern) | Breathwrk | We use text cues ("Breathe in") over visual shape |
| "Session depth" shown visually, not as a number | Balance | We have a depth meter component but it renders a number slider |
| Post-session glow / celebration moment | All competitors | We show a plain "How do you feel now?" immediately |
| Particles or organic motion that reacts to breath | Balance, Headspace | None |

---

## Domain 2: Content Variety and Rotation

### What Competitors Do

**Calm** (MEDIUM confidence)
- Daily "Daily Calm" session: new every day, unique topic, curated pacing
- Library of 200+ guided sessions organized by goal, duration, teacher
- Sleep stories with new additions weekly
- Music tracks: 50+ with genre tags (focus, sleep, relax)
- The variety is largely solved by volume of content, not algorithmic rotation

**Headspace** (MEDIUM confidence)
- "Today" tab surfaces a different featured session daily
- Sessions are organized into multi-week "courses" with daily progression — so you get automatic variety without choosing
- "Singles" for one-off needs
- Content is teacher-narrated, so even the same technique feels fresh with a different guide voice

**Balance** (MEDIUM confidence)
- First-run adaptive questionnaire shapes a personal "plan" — so variety is engineered from day 1
- Each day of the plan is a unique session (not repeating)
- "Quick sessions" are randomized within a category on each open

**Breathwrk** (MEDIUM confidence)
- Content variety is minimal — it's technique-focused. About 15 named breath patterns.
- Variety comes from goal-based entry ("I want to: energize / calm / sleep") rather than library browsing

**Finch** (MEDIUM confidence)
- Daily "goals" rotate (set by the user or auto-generated): "drink water", "take 3 deep breaths", "write one thing you're proud of"
- The creature's "adventures" are new locations unlocked with streaks

### What Regulation Station Has Now

- 8 tips per state in stateData.js (static, no rotation mechanism)
- 5 grounding phrases per state in ImmersionContainer (rotates every 20s within a session, but fixed set)
- Reset protocol steps: fixed sequence per state, no variation
- Tasks: fixed list per state, filtered by selected state

### Gap Analysis: Content Variety

| Gap | Competitors Who Have It | Our Current State |
|-----|------------------------|-------------------|
| Daily rotating featured content | Calm, Balance, Headspace | No daily rotation — same content every session |
| Multi-step content progressions (course/plan) | Headspace, Balance | No sequence logic — users pick state, get same content |
| Multiple somatic protocols per state (not just one) | None directly — but Calm/Breathwrk have technique libraries | One reset protocol per state |
| Breath cues that vary between sessions | None — competitors reuse cues too | Same grounding phrases repeat |
| Goal-based entry that surfaces appropriate content | Breathwrk ("I want to: energize") | No goal filter — only state filter |
| Protocol intensity options (quick / standard / deep) | Calm (3–30 min session lengths) | Fixed 60-sec stealth, 120–180 sec immersion |

---

## Domain 3: Progress and History Visualization

### What Competitors Do

**Calm** (MEDIUM confidence)
- Journey view: calendar with colored dots for practice days
- Streak counter prominently featured with milestone badges
- "Minutes mindful" lifetime stat
- Simple bar chart for weekly minutes
- No nervous-system-specific data — just engagement metrics

**Headspace** (MEDIUM confidence)
- Calendar heatmap (most well-known in this category)
- "Headspace score" — a compound wellness metric updated weekly
- Animated milestone cards (e.g., 10-session milestone shows a special animation)
- Friend streaks visible in social tab

**Balance** (MEDIUM confidence)
- "Streak" replaced with "consistency" — shown as percentage of planned days completed
- Weekly review session: the app talks you through what you did and how to improve
- Data is minimal but what's shown is interpreted, not raw ("You tend to practice in the morning — mornings show better mood shifts")

**Breathwrk** (MEDIUM confidence)
- HRV trend line (if Apple Watch connected)
- Breath session history: list of sessions with duration and technique
- No visualization beyond list + streak

**Waking Up** (MEDIUM confidence)
- Progress is framed philosophically: number of "days of practice" not minutes or streaks
- No charts. The insight is the practice, not the data.

**Finch** (MEDIUM confidence)
- The bird's happiness % is the progress visualization — highly gamified
- Detailed mood log: color-coded emoji timeline for the week
- Journey map showing where the bird has "traveled" based on your care

### What Regulation Station Has Now

- DailySummary: inline strip — reset count, avg shift arrow, flow minutes (text only)
- VagusLogSidebar: 5-bar sparkline (dominant state per day, color-coded), streak badge, quick-log textarea
- WeeklyIntelligenceCard: text metrics (avgActivationBefore, avgActivationDelta, recoveryTime, volatility, bestProtocol), interpreted insights
- useSessionLog: full session objects with shift, state, type, duration, timestamps

### Gap Analysis: Progress Visualization

| Gap | Competitors Who Have It | Our Current State |
|-----|------------------------|-------------------|
| Calendar heatmap (month view, colored by sessions) | Headspace, Calm | Only 5-day sparkline in sidebar |
| Lifetime stats (total sessions, total reset minutes, total flow minutes) | Calm ("minutes mindful") | No lifetime aggregates shown in UI |
| Shift trajectory chart (activation before vs. after, plotted over time) | None of the above directly, but this is unique to us | Raw data exists in sessions, no chart |
| State distribution chart (frozen/anxious/flow mix over 7/30 days) | None directly | Not visualized |
| Streak milestone moments (animated celebration at 7d, 30d, etc.) | Headspace, Calm | StreakMilestone component exists but unclear how it's surfaced |
| Interpreted weekly narrative ("You showed up 5x this week, mostly anxious on Mondays") | Balance | interpretWeeklySummary.js exists but renders as bullet list |
| Session replays or summaries you can review | None do this | No per-session detail view |

---

## Domain 4: Audio Visualization

### What Competitors Do

**Calm** (MEDIUM confidence)
- No dedicated audio visualizer. Background video + track name is the UI.
- Sleep stories: just a dark screen with minimal title card and volume.

**Headspace** (MEDIUM confidence)
- No audio visualizer at all. Audio-first, no visual representation of the signal.

**Balance** (MEDIUM confidence)
- Subtle texture animation that moves in time with audio amplitude — not a traditional waveform, but an organic ripple that reacts to sound
- The background shifts slightly in brightness on loud moments in the audio guide

**Breathwrk** (MEDIUM confidence)
- No audio visualizer — no custom audio (just system sounds and optional guided voice)

**Portal** (MEDIUM confidence)
- Spatial audio indicator: shows a directional compass for ambient sound position (left/right/front/back). Not a visualizer, but communicates stereo positioning.
- No frequency visualization.

**Oak** (MEDIUM confidence)
- No audio visualization. Dark screen, ring, nothing else.

### What Regulation Station Has Now

- LissajousVisualizer: animated Lissajous curve (a mathematical figure, not a waveform). Visually interesting but abstract. Correctly represents the binaural frequency ratio.
- EqBars: simple animated EQ bars in AudioPlayer when playing (5 bars, fixed heights, CSS animation)
- AudioPlayer shows carrier Hz, beat Hz, track labels, volume slider, playhead scrubber

### Gap Analysis: Audio Visualization

| Gap | Competitors Who Have It | Our Current State |
|-----|------------------------|-------------------|
| Waveform or spectrum display reacting to actual audio output | Balance (subtle) | Lissajous is mathematical, not reactive to audio amplitude |
| L/R channel separation visualization (binaural-specific) | None — unique opportunity | L/R Hz labels exist in AudioPlayer, but no visual separation |
| Audio-reactive background (brightness/texture responds to beat) | Balance | No audio-reactive background |
| Frequency slider showing where in the brain spectrum we're targeting | None — unique opportunity | Hz badge only, no contextual chart |
| "Now playing" ambient glow that pulses with beat frequency | None directly | Play button has a slow pulse, not beat-synced |
| Visual proof that binaural beat is working (beat rate visualization) | None — unique opportunity | beatHz is displayed as a number only |

---

## Domain 5: State Selection and Mood Check-In UX

### What Competitors Do

**Calm** (MEDIUM confidence)
- No state selection. Content is organized by goal (sleep, focus, anxiety, stress), not current state.
- Onboarding asks for goals, not current mood.
- Mood check-in is optional and separate from session flow ("How are you feeling today?" — presented as a journal prompt, not a gate).

**Headspace** (MEDIUM confidence)
- "How are you feeling?" prompt on app open — 5-emoji scale (sad/stressed/neutral/good/great)
- The answer influences "recommended for you" but doesn't lock you into content
- Session completion: same 5-emoji scale. Delta is tracked.

**Balance** (MEDIUM confidence)
- Deep initial questionnaire (10+ questions about goals, lifestyle, challenges) — sets up your entire plan
- Daily "check in" prompt before session: slider from 1–10, labeled with the app's own wellness vocabulary
- Post-session: "Did this help? Not much / A little / A lot" — three simple options

**Breathwrk** (MEDIUM confidence)
- Goal-based entry rather than state-based: "What do you want to do right now?" with icons: Energize / Calm Down / Sleep / Focus / Boost Immunity
- Very fast — no mood check-in, just intent selection. Leads directly to a curated breath pattern.

**Finch** (MEDIUM confidence)
- Mood check-in is the primary daily action: tap the emoji that matches your mood, optionally add a note
- Mood is the input; the creature's world state is the output. Highly visible feedback loop.

**Waking Up** (MEDIUM confidence)
- No mood check-in. Philosophy-first: "sit and practice" without framing your current condition.

### What Regulation Station Has Now

- StateSelector: three botanical-icon cards (frozen/anxious/flow) with radial gradient, grain texture, hover preview of what unlocks
- Asymmetric border-radius per state personality (crystalline for frozen, off-balance for anxious, leaf-curve for flow)
- Active state shows polyvagal note, pulse dot
- StateAssist: 2-question quiz (Energy/Focus) → recommendation (separate component, dismissable)
- FirstVisitExperience component exists

### Gap Analysis: State Selection UX

| Gap | Competitors Who Have It | Our Current State |
|-----|------------------------|-------------------|
| Mood/state pre-session check-in integrated into the flow (not a separate component) | Headspace, Balance, Finch | StateAssist is a separate, dismissable quiz — not woven into the primary flow |
| Post-session mood comparison shown visually (before vs after side-by-side) | Balance, Headspace (emoji delta) | PostResetCheckin has a slider but no before/after visual comparison |
| State transition animation when selecting (world changes around you) | None — opportunity | Cards animate with border-radius shift but background/environment doesn't change |
| Body-scan or somatic guided state identification | None — opportunity | StateAssist uses Energy/Focus axis only |
| Quick re-check option mid-session ("still feeling anxious?") | None directly | No mid-session re-check |
| Suggested state when re-opening after a gap | Balance | No "welcome back" state suggestion |

---

## Domain 6: Ambient Atmosphere

### What Competitors Do

**Calm** (MEDIUM confidence)
- Nature scenes are central to the brand: rain, forest, ocean, fire. Professionally shot video.
- "Scenes" mode: pure ambient video + spatial audio, no guided content. This is a major use case.
- 50+ scenes available. Users play them during work, sleep, transit.
- No interaction during a scene — pure passive atmosphere.

**Portal** (MEDIUM confidence)
- Portal is essentially "Calm Scenes" at 4K with spatial audio and location storytelling.
- Locations are branded (Icelandic waterfall, Redwood forest, Tokyo rain). The location is content.
- Monthly new locations added.
- Subtle UI: volume, timer, and a gentle pulsing indicator. Nothing else.

**Balance** (MEDIUM confidence)
- Background texture shifts with session depth — becoming richer as you regulate.
- Not nature video — abstract, procedurally influenced texture.

**Headspace** (MEDIUM confidence)
- "Sleepcasts" and focus music — audio-first ambient, no video.
- "Move Mode" and "Focus" have illustrated ambient backgrounds but they're static.

**Oak** (MEDIUM confidence)
- No ambient atmosphere — deliberately bare.

### What Regulation Station Has Now

- AmbientSoundscape: real Web Audio API — forest (brown noise + LFO), ocean (pink noise + bandpass + LFO), binaural tones
- syncBreath() on ambient engine: ramps gain 1.28x on inhale, 0.62x on exhale — breath-synced audio
- VideoBackground in StealthReset: plays during the 60-sec protocol
- ImmersionBackground + NeuralBackground components exist (neural background is the dark animated canvas)

### Gap Analysis: Ambient Atmosphere

| Gap | Competitors Who Have It | Our Current State |
|-----|------------------------|-------------------|
| Pure "ambient mode" — no session, just atmosphere | Calm Scenes, Portal | No standalone ambient mode. Audio + video only exist inside a session. |
| Atmosphere selection tied to state (frozen = warm fireplace, anxious = rain, flow = forest) | None directly — opportunity | AmbientSoundscape exists but selection isn't opinionated per state |
| Ambient background that evolves over session duration (more lush/calm as you regulate) | Balance | ImmersionBackground is static gradient |
| Layered soundscape (nature layer + binaural layer + optional guide voice) | Calm (nature + voice) | Forest and binaural are separate; no layering UI |
| Spatial audio (L/R field indicated) | Portal | L/R Hz indicators exist in AudioPlayer; no spatial positioning |
| Background that reacts to breath (e.g. particles slow down on exhale) | Balance | Ambient gain changes on breath, but visuals don't react |

---

## Table Stakes Features

Features users of calm-tech apps now expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes | Status |
|---------|--------------|------------|-------|--------|
| Streak counter with daily entry | Every competitor has it; builds habit | Low | Done — in VagusLogSidebar | BUILT |
| Before/after activation comparison in one view | Headspace, Balance, Finch all show this delta | Low | PostResetCheckin has a slider but no visual before/after | PARTIAL |
| Calendar-style history (at least 2 weeks) | Headspace heatmap is the standard | Medium | Only 5-day bar sparkline | GAP |
| Session length options (5-min / 10-min / 20-min) | Calm, Balance offer length choices | Medium | Fixed lengths only (60s stealth, 2-3 min immersion) | GAP |
| Ambient mode (separate from session) | Calm Scenes is the standard | Medium | No dedicated ambient mode | GAP |
| State-appropriate visual atmosphere during session | Calm, Portal, Balance all do this | Medium | Video exists in StealthReset; ImmersionContainer is static gradient | PARTIAL |
| Rotating/daily fresh content | Calm daily, Balance plans | High | No rotation mechanism; same 8 tips every session | GAP |
| Post-session streak milestone moment | Headspace, Calm celebrate milestones | Low | StreakMilestone component exists but unclear surfacing | PARTIAL |

---

## Differentiators

Features that set this product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes | Architecture Dependency |
|---------|-------------------|------------|-------|------------------------|
| Nervous-system-specific state detection (not mood, not emotion — polyvagal state) | No competitor uses polyvagal framing. This is the intellectual differentiator. | Low | Already exists — the three-state model is unique | Core to existing model |
| Shift trajectory visualization (activation delta plotted over time) | Shows "regulation ROI" — quantified proof that the app works | Medium | Session data includes shift values; need a line chart | useSessionLog has all needed data |
| Binaural beat frequency visualizer that shows the beat rate and brainwave target zone | No competitor explains why the audio works | Medium | LissajousVisualizer is a good start; add brainwave band overlay | AudioPlayer + useAudioEngine |
| Breath-synced ambient audio (amplitude changes with breath phase) | Competitors have ambient audio; none sync it to breath | Low | Already built in useAmbientEngine via syncBreath() — needs surfacing | BUILT — needs UI visibility |
| Full-screen immersion that hides all dashboard chrome | Balance, Portal do this — rare in web apps | Medium | ImmersionContainer already goes fixed-fullscreen | ImmersionContainer |
| State-keyed somatic protocols with polyvagal science explanations | No competitor grounds their techniques in polyvagal theory | Low | polyvagalNoteScience in stateData.js; needs better UI placement | stateData.js |
| Color field that transitions across session (red → amber → green as you regulate) | Would make regulation visually tangible | Medium | No competitor does this exactly. Requires new CSS transition logic | ImmersionContainer breathPhase + timing |
| Beat-frequency reactive glow on play button | Makes audio feel alive in a binaural-specific way | Low | beatHz is available; could pulse at beatHz rate with requestAnimationFrame | AudioPlayer |

---

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| AI-generated content / personalization | Out of scope (PROJECT.md); adds complexity, risks content quality | Keep content human-curated, improve rotation and variety manually |
| Social comparison / friend streaks | Against the calm-tech brand; Headspace tried it and it added anxiety | Team panel already exists and is the limit; no leaderboards |
| Gamification beyond streaks (badges, levels, points) | Finch works because it commits fully; half-gamification feels cheap | Keep the streak + milestone system, don't add XP or achievement grids |
| Push notifications | PWA supports them but they're hostile to the app's "when you need it" positioning | Let the user come to the app — don't chase them |
| Guided voice narration | Requires audio production infrastructure; Calm/Headspace have years of it | Stick to text cues + grounding phrases; let user voice their own experience |
| Social content sharing | Screenshots of "I completed a session" don't fit the biophilic, private tone | Regulation is personal, not performative |
| Mood journal (long-form) | Notion architecture exists for this; journal textarea is enough in-app | Keep Quick Log in VagusLogSidebar at textarea level |
| Subscription paywalls / content gating | This is a personal tool, not a SaaS product at this stage | Keep all features accessible |

---

## Feature Dependencies

Dependencies between proposed new features and existing architecture.

```
Calendar heatmap → useSessionLog (date, state fields — already present)
Shift trajectory chart → useSessionLog (activation, shift fields — already present)
Color field transition across session → ImmersionContainer breathElapsed / stabilizePct
State-to-atmosphere mapping → AmbientSoundscape + ImmersionBackground (new prop)
Ambient mode → New minimal overlay (wraps AmbientSoundscape, no session logic)
Session length options → ImmersionContainer STABILIZE_DURATION (currently hardcoded per state)
Before/after visual comparison → PostResetCheckin (needs activationBefore plumbed through)
Beat-reactive glow → AudioPlayer + useAudioEngine (beatHz already exposed)
Daily content rotation → stateData.js (tips array exists; need date-seeded index)
```

---

## MVP Recommendation for Visual Refresh

**Highest impact, lowest effort:**

1. **Color field transition during immersion** — single CSS change in ImmersionContainer: interpolate accent color from state default toward a "settled" hue as stabilizePct approaches 1.0. No new data, no new components.

2. **Daily tip rotation** — date-seeded index into the existing 8-tip array. Two lines of code in stateData.js or in the consuming component.

3. **Shift trajectory mini-chart** — a simple SVG polyline using existing session data. No new hooks, no new data collection.

4. **Beat-reactive glow on AudioPlayer play button** — requestAnimationFrame at beatHz rate, 5 lines added to AudioPlayer.jsx.

5. **Before/after activation shown side-by-side** — plumb activationBefore (already captured in StealthReset) into PostResetCheckin and render two numbers with an arrow.

**Medium complexity, high brand impact:**

6. **Calendar heatmap (14 or 30 days)** — new component consuming useSessionLog, renders a grid of colored dots. ~100 lines.

7. **Ambient mode toggle** — minimal overlay that starts ambient audio without entering a full session. Wraps existing AmbientSoundscape.

8. **State-to-atmosphere visual pairing** — pass stateId into ImmersionBackground and have it select a different radial gradient or particle color per state (frozen = cool blue-grey, anxious = warm amber haze, flow = soft green field).

**Defer:**

- Portal-style 4K video: bundle size and streaming concerns conflict with offline-first constraint.
- Adaptive content plans (Balance-style): requires a content authoring system well beyond current scope.
- Spatial audio: requires HRTF processing, significant audio engine work.

---

## Sources

All competitor findings from training data (knowledge cutoff August 2025). Confidence: MEDIUM.

- Calm: widespread reviews, official feature page (calm.com), App Store description
- Headspace: App Store reviews, official blog posts on UX decisions
- Balance: product reviews (Engadget, The Verge 2022-2024), App Store
- Breathwrk: official website breathwrk.com, App Store
- Waking Up: waking-up.com, public interviews with Sam Harris on product philosophy
- Oak: oak.app, App Store (minimalist design is its documented selling point)
- Finch: finchcare.com, App Store, mental health app review roundups
- Portal: portal.app, App Store, TechCrunch coverage

**Existing codebase analysis:** Direct read of all relevant components (ImmersionContainer.jsx, AudioPlayer.jsx, StateSelector.jsx, LissajousVisualizer.jsx, VagusLogSidebar.jsx, WeeklyIntelligenceCard.jsx, DailySummary.jsx, StealthReset.jsx). HIGH confidence on current state.
