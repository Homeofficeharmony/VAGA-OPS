# Notion Architecture — Nervous System Ops Pack
## Regulation Station Database System

---

## Database 1: `🧠 State Log`
*Primary database. One entry per session/check-in.*

| Property | Type | Notes |
|---|---|---|
| `Date` | Date | Auto-populated |
| `Time of Day` | Select | Morning · Afternoon · Evening · Night |
| `State` | Select | 🔴 Frozen/Shutdown · ⚡ Anxious/High-Alert · ◈ Safe/Flow |
| `Intensity (1–10)` | Number | Slider 1–10 |
| `Trigger` | Multi-select | Deadline · Client · Money · Isolation · Fatigue · Unknown |
| `Reset Performed` | Relation → `🔄 Reset Protocols` | Links to the protocol used |
| `Tasks Completed` | Relation → `✅ Task Filter` | Tasks executed in this session |
| `Audio Track` | Relation → `🎧 Binaural Library` | Track played during session |
| `Session Notes` | Text | Free field — keep brief |
| `Outcome State` | Select | Same · Better · Worse |
| `HRV Note` | Number | Optional — wearable data |

**Formulas:**

```
// State Score (numeric for rollups)
if(prop("State") == "◈ Safe/Flow", 3,
  if(prop("State") == "⚡ Anxious/High-Alert", 2, 1))

// Recovery flag
if(prop("Outcome State") == "Better" and prop("Intensity (1–10)") <= 4, "✅ Recovery", "⚠️ Monitor")

// Session label
format(prop("Date")) + " · " + prop("State")
```

---

## Database 2: `🔄 Reset Protocols`
*Library of all somatic reset protocols.*

| Property | Type | Notes |
|---|---|---|
| `Protocol Name` | Title | e.g., "Ear-Apex Pull" |
| `State Target` | Multi-select | Frozen · Anxious · Flow |
| `Duration` | Select | 60s · 2min · 5min · 10min |
| `Category` | Select | Vagal · Respiratory · Optic · Movement · Thermal |
| `Mechanism` | Text | 1-sentence physiological explanation |
| `Steps` | Text | Numbered step-by-step instructions |
| `Video Embed` | URL | Link to Loom/YouTube demo |
| `Difficulty` | Select | Low · Medium · High |
| `Stealthy?` | Checkbox | Can be done in a meeting/public |
| `Uses` | Rollup → `🧠 State Log` | Count of times used |
| `Effectiveness Avg` | Formula | Average outcome improvement |

**Formula — Effectiveness Avg:**
```
// Requires rollup of outcome numeric scores from State Log relation
// Rollup: Average of "State Score" from State Log where this protocol is linked
// Then formula:
format(round(prop("Avg Outcome Score") * 10) / 10) + " / 3.0"
```

**Formula — Stealthy Badge:**
```
if(prop("Stealthy?"), "🤫 No-Context Reset", "🏠 Private Protocol")
```

---

## Database 3: `✅ Task Filter`
*Pre-populated task library sorted by state and cognitive load.*

| Property | Type | Notes |
|---|---|---|
| `Task` | Title | e.g., "Clear inbox to zero" |
| `State` | Select | 🔴 Frozen · ⚡ Anxious · ◈ Flow |
| `Intensity` | Select | 1 – Low · 2 – Medium · 3 – High |
| `Category` | Select | Admin · Creative · Communication · Physical · Planning |
| `Time Box` | Select | 5min · 10min · 25min · 45min · 90min |
| `Prefrontal Required?` | Checkbox | Requires decision-making capacity |
| `Done Today` | Checkbox | Reset daily via automation |
| `Completions` | Rollup → `🧠 State Log` | Count via relation |
| `Notes` | Text | Optional context |

**Filter Views:**

- **Frozen View:** Filter `State` = 🔴 Frozen, Sort by Intensity ASC
- **Anxious View:** Filter `State` = ⚡ Anxious, Sort by Time Box ASC
- **Flow View:** Filter `State` = ◈ Flow, Sort by Intensity DESC

**Formula — Cognitive Load Label:**
```
if(prop("Intensity") == "1 – Low",
  "🟢 Execute — no decision needed",
  if(prop("Intensity") == "2 – Medium",
    "🟡 Focus — minimal decisions",
    "🔴 Deep — full PFC required"))
```

---

## Database 4: `🎧 Binaural Library`
*Audio protocol catalogue.*

| Property | Type | Notes |
|---|---|---|
| `Track Name` | Title | e.g., "Theta Emergence" |
| `State Match` | Select | Frozen · Anxious · Flow |
| `Frequency` | Select | Delta (0-4Hz) · Theta (4-7Hz) · Alpha (8-12Hz) · Beta (13-30Hz) · Gamma (40Hz) |
| `Duration` | Select | 20min · 30min · 45min · 60min · 90min |
| `Carrier` | Text | e.g., "Pink noise at 200Hz" |
| `Description` | Text | What it does in plain language |
| `Audio URL` | URL | Link to file |
| `Headphones Required?` | Checkbox | Binaural requires stereo |
| `Session Count` | Rollup | From State Log |

**Formula — Recommendation Tag:**
```
if(prop("State Match") == "Frozen",
  "⬆️ Upregulating — lifts shutdown",
  if(prop("State Match") == "Anxious",
    "⬇️ Downregulating — calms arousal",
    "→ Sustaining — maintains peak state"))
```

---

## Database 5: `🆘 Rupture Log`
*For Level 8–10 burnout events.*

| Property | Type | Notes |
|---|---|---|
| `Date` | Date | Auto |
| `Rupture Level (1–10)` | Number | Self-assessed severity |
| `Trigger Category` | Multi-select | Financial · Relational · Workload · Health · Existential |
| `Physical Symptoms` | Multi-select | Chest tight · Dissociation · Rage · Crying · Numbness · Nausea |
| `SOP Applied` | Select | Tier 1 (Self) · Tier 2 (Support) · Tier 3 (Emergency) |
| `Actions Taken` | Text | What you actually did |
| `Recovery Duration` | Select | Hours · 1 day · 2-3 days · Week+ |
| `Insight` | Text | What you learned |
| `Pattern Detected` | Checkbox | Has this happened before? |
| `Follow-Up Required` | Checkbox | Needs therapist/coach? |

---

## Relations Map

```
🧠 State Log
  └── → 🔄 Reset Protocols (many-to-one)
  └── → ✅ Task Filter (many-to-many)
  └── → 🎧 Binaural Library (many-to-one)
  └── → 🆘 Rupture Log (optional, when state = rupture)

🔄 Reset Protocols
  └── ← 🧠 State Log (rollup: usage count, avg outcome)

✅ Task Filter
  └── ← 🧠 State Log (rollup: completion count)

🎧 Binaural Library
  └── ← 🧠 State Log (rollup: session count)
```

---

## Notion Automation (Button / Recurring)

**Daily Reset Button:**
- Clears `Done Today` in Task Filter
- Creates new entry in State Log with today's date
- Filters Task Filter view to `State` matching last entry

**Weekly Rollup View:**
- Group State Log by Week
- Show formula: `State Score` average per week
- Trend indicator: if avg drops 2+ points vs prev week → "⚠️ Watch Week"

**Template: "Morning Ops Check-In"**
1. Select your State
2. Rate Intensity
3. Click matching Reset Protocol
4. Select 2 tasks from filtered list
5. Start Binaural track
6. Log Outcome at end of session
