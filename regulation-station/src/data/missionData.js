/**
 * missionData.js
 *
 * Polyvagal "Missions" — structured, multi-phase regulation protocols
 * designed to guide the user up the polyvagal ladder from dysregulated
 * states toward Ventral Vagal (Safe & Social / Flow).
 *
 * Each mission is a sequence of phases. Each phase targets a specific
 * nervous system state with a somatic technique, breath timing, and
 * binaural audio frequency.
 */

export const MISSIONS = [
  {
    id: 'system-override',
    codename: 'SYSTEM OVERRIDE',
    classification: 'PRIORITY-1 · DORSAL → VENTRAL',
    objective: 'Lift from dorsal vagal shutdown into operational flow. Three sequential phases calibrate arousal upward through the polyvagal ladder without triggering sympathetic activation.',
    difficulty: 3,
    durationMin: 6,
    phases: [
      {
        id: 'initialize',
        label: 'PHASE 1 · INITIALIZE',
        stateId: 'frozen',
        accentHex: '#c4604a',
        durationSec: 120,
        technique: 'Ear-Apex Pull',
        instruction: 'Reach both hands up. Grip the top ridge of each ear between thumb and forefinger. Pull gently upward and outward. Hold steady for the full 2 minutes.',
        breathTiming: { inhale: 5000, hold: 0, exhale: 8000 },
        audio: { carrierHz: 180, beatHz: 5, label: 'Theta Emergence' },
        groundingCues: [
          'Feel the pull through your jaw and skull base.',
          'Gravity is holding you. You are already beginning to lift.',
          'Warmth is returning to your hands and face.',
          'The nervous system hears physical input. Keep pulling.',
          'One breath at a time. Nothing else is required.',
        ],
      },
      {
        id: 'engage',
        label: 'PHASE 2 · ENGAGE',
        stateId: 'anxious',
        accentHex: '#c8a040',
        durationSec: 120,
        technique: 'Lateral Rib Expansion',
        instruction: 'Place both palms flat on your lower ribs, fingers pointing inward. Inhale sideways — expand into your hands. Shoulders stay down. Your arousal is rising on purpose.',
        breathTiming: { inhale: 4000, hold: 2000, exhale: 6000 },
        audio: { carrierHz: 200, beatHz: 10, label: 'Alpha Rise' },
        groundingCues: [
          'Shoulders back. Chest open. You are building, not breaking.',
          'Each inhale is intentional arousal. Each exhale is control.',
          'Rib expansion signals safety to the brainstem.',
          'You are climbing the ladder. The next rung is reachable.',
          'This is mobilization without threat. Your body knows the difference.',
        ],
      },
      {
        id: 'execute',
        label: 'PHASE 3 · EXECUTE',
        stateId: 'flow',
        accentHex: '#52b87e',
        durationSec: 120,
        technique: 'Peripheral Vision Soften',
        instruction: 'Defocus your gaze. Let your visual field expand to the edges of the room. No fixation. Wide gaze = safety signal. You are in the window.',
        breathTiming: { inhale: 4000, hold: 0, exhale: 6000 },
        audio: { carrierHz: 200, beatHz: 40, label: 'Gamma Lock' },
        groundingCues: [
          'Gaze wide. Jaw soft. Mind clear.',
          'You are inside the window of tolerance.',
          'Peripheral vision is the nervous system\'s off-switch for threat.',
          'Sustain this. Protect this window.',
          'The work ahead is possible from here.',
        ],
      },
    ],
  },

  {
    id: 'cortisol-purge',
    codename: 'CORTISOL PURGE',
    classification: 'PRIORITY-2 · SYMPATHETIC DOWNREGULATION',
    objective: 'Neutralize an active stress response. Extended exhales engage the vagal brake to drop cortisol and restore prefrontal access within 5 minutes.',
    difficulty: 2,
    durationMin: 5,
    phases: [
      {
        id: 'deactivate',
        label: 'PHASE 1 · DEACTIVATE',
        stateId: 'anxious',
        accentHex: '#c8a040',
        durationSec: 150,
        technique: '4-8 Extended Exhale',
        instruction: 'Inhale 4 counts through the nose. Exhale 8 counts through the mouth. The long exhale activates the vagal brake — your built-in cortisol switch.',
        breathTiming: { inhale: 4000, hold: 0, exhale: 8000 },
        audio: { carrierHz: 200, beatHz: 10, label: 'Alpha Calm' },
        groundingCues: [
          'The exhale is twice as long. Let it be twice as long.',
          'Cortisol drops on every exhale. Keep going.',
          'Soften the jaw. Drop the shoulders. Release the grip.',
          'Your nervous system is listening to the breath.',
          'You are not fighting the stress response. You are outrunning it.',
        ],
      },
      {
        id: 'stabilize',
        label: 'PHASE 2 · STABILIZE',
        stateId: 'flow',
        accentHex: '#52b87e',
        durationSec: 150,
        technique: 'Coherent Breath',
        instruction: 'Equal inhale and exhale — 5 counts each. Steady rhythm. You are no longer responding to threat. You are generating stability.',
        breathTiming: { inhale: 5000, hold: 0, exhale: 5000 },
        audio: { carrierHz: 200, beatHz: 40, label: 'Gamma Steady' },
        groundingCues: [
          'Equal breath. Equal ground.',
          'You are generating stability, not finding it.',
          'Heart rate variability is rising. Your body feels this.',
          'The body believes what the breath tells it.',
          'From this state, everything is more accessible.',
        ],
      },
    ],
  },

  {
    id: 'field-stabilize',
    codename: 'FIELD STABILIZE',
    classification: 'RAPID RESPONSE · ANY STATE',
    objective: 'Fast vagal brake activation for high-pressure moments. Physiological sigh followed by panoramic gaze — complete nervous system reset in under 3 minutes.',
    difficulty: 1,
    durationMin: 3,
    phases: [
      {
        id: 'sigh',
        label: 'PHASE 1 · SIGH PROTOCOL',
        stateId: 'anxious',
        accentHex: '#c8a040',
        durationSec: 90,
        technique: 'Physiological Sigh',
        instruction: 'Double inhale through the nose: full breath, then a second sniff on top to fully inflate the lungs. Long, slow exhale through the mouth. This is the fastest known vagal reset.',
        breathTiming: { inhale: 3500, hold: 500, exhale: 7000 },
        audio: { carrierHz: 200, beatHz: 10, label: 'Alpha Reset' },
        groundingCues: [
          'Double inhale — sniff on top. Then let it all go.',
          'CO₂ drops fast. The brake engages immediately.',
          'One sigh resets what minutes of normal breathing cannot.',
          'Long exhale through the mouth. Feel the release.',
          'Your brainstem is receiving the signal.',
        ],
      },
      {
        id: 'scan',
        label: 'PHASE 2 · PANORAMIC SCAN',
        stateId: 'flow',
        accentHex: '#52b87e',
        durationSec: 90,
        technique: 'Panoramic Gaze',
        instruction: 'Eyes open. Soften your focus. Slowly sweep your gaze left to right — take in the full room without fixating anywhere. Wide vision = threat response off.',
        breathTiming: { inhale: 4000, hold: 0, exhale: 6000 },
        audio: { carrierHz: 200, beatHz: 40, label: 'Ventral Open' },
        groundingCues: [
          'Wide gaze. No fixation. The room is safe.',
          'Threat detection drops when peripheral vision is active.',
          'You can see the whole room. No threat occupies all of it.',
          'This is what safety feels like in the body.',
          'Stay here. The work can wait 90 more seconds.',
        ],
      },
    ],
  },
]
