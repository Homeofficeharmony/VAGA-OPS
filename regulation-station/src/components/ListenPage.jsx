import { useState } from 'react'
import AudioPlayerMini from './AudioPlayerMini'
import AmbientPanel from './AmbientPanel'

const BAR_HEIGHTS = [8, 20, 36, 50, 42, 28, 14, 30, 46, 34, 18, 10, 24]
const BAR_OPACITIES = [0.28, 0.50, 0.72, 1.0, 0.84, 0.58, 0.38, 0.64, 0.90, 0.70, 0.45, 0.28, 0.52]

const SOUND_PILLS = [
  { key: 'forest', label: 'Forest', icon: '🌲' },
  { key: 'ocean',  label: 'Ocean',  icon: '🌊' },
  { key: 'none',   label: 'Binaural', icon: '🎧' },
]

export default function ListenPage({ stateData, ambientEngine, onSelectState }) {
  const [activeSound, setActiveSound] = useState('forest')

  if (!stateData) {
    return (
      <div className="page-content flex flex-col items-center justify-center min-h-full px-6 py-16 page-enter">
        <p className="text-[14px] mb-4 text-center" style={{ color: 'var(--text-muted)' }}>
          Select a state to unlock audio tools.
        </p>
        {onSelectState && (
          <button
            onClick={onSelectState}
            className="px-6 py-3 rounded-xl text-[13px] font-medium transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{ backgroundColor: '#52b87e', color: '#0f1410' }}
          >
            Choose State →
          </button>
        )}
      </div>
    )
  }

  const { accentHex, audio } = stateData
  const beatHz = audio.tracks?.[0]?.beatHz ?? '—'
  const waveType = audio.waveType ?? ''

  return (
    <div className="page-content flex flex-col items-center gap-6 px-6 py-10 max-w-md mx-auto page-enter">

      {/* Heading */}
      <div className="text-center w-full">
        <h2 className="text-[22px] font-light tracking-wide" style={{ color: 'var(--text-primary)' }}>
          Sound & Frequency
        </h2>
        <p className="text-[12px] font-mono tracking-widest uppercase mt-1" style={{ color: accentHex }}>
          {audio.range}
        </p>
      </div>

      {/* Frequency Visualization Card */}
      <div
        className="w-full rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)' }}
      >
        {/* Concentric rings + Hz label */}
        <div className="relative flex items-center justify-center" style={{ height: 172 }}>
          <svg width="172" height="172" viewBox="0 0 172 172" className="absolute">
            <circle cx="86" cy="86" r="80" fill="none" stroke={accentHex} strokeWidth="1" opacity="0.18" />
            <circle cx="86" cy="86" r="58" fill="none" stroke={accentHex} strokeWidth="1" opacity="0.32" />
            <circle cx="86" cy="86" r="38" fill={accentHex} fillOpacity="0.08" stroke={accentHex} strokeWidth="1.5" opacity="0.6" />
          </svg>
          {/* Soft radial glow */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 72, height: 72,
              background: `radial-gradient(circle, ${accentHex}28 0%, transparent 70%)`,
            }}
          />
          {/* Hz + wave type labels */}
          <div className="relative flex flex-col items-center z-10">
            <span className="font-light leading-none" style={{ fontSize: 28, color: accentHex }}>
              {beatHz} Hz
            </span>
            <span
              className="font-mono tracking-[0.25em] uppercase mt-1"
              style={{ fontSize: 10, color: accentHex, opacity: 0.7 }}
            >
              {waveType}
            </span>
          </div>
        </div>

        {/* Waveform bars */}
        <div className="flex items-center justify-center gap-[5px] px-6 pb-5" style={{ height: 60 }}>
          {BAR_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className="rounded-full flex-shrink-0"
              style={{ width: 4, height: h, backgroundColor: accentHex, opacity: BAR_OPACITIES[i] }}
            />
          ))}
        </div>
      </div>

      {/* Sound type pill selector */}
      <div className="flex gap-2 w-full">
        {SOUND_PILLS.map(({ key, label, icon }) => {
          const isActive = activeSound === key
          return (
            <button
              key={key}
              onClick={() => setActiveSound(key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-medium transition-all duration-200 active:scale-95 hover:opacity-90"
              style={{
                backgroundColor: isActive ? accentHex : 'var(--bg-panel)',
                color: isActive ? '#0f1410' : 'var(--text-secondary)',
                border: `1px solid ${isActive ? accentHex : 'var(--border)'}`,
              }}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          )
        })}
      </div>

      {/* Binaural player */}
      <div className="w-full">
        <AudioPlayerMini stateData={stateData} />
      </div>

      {/* Ambient soundscape */}
      <div className="w-full">
        <AmbientPanel engine={ambientEngine} stateData={stateData} />
      </div>

      {/* Footer hint */}
      <p
        className="text-center text-[11px] italic"
        style={{ color: 'var(--text-muted)', opacity: 0.55 }}
      >
        Headphones recommended for full binaural effect
      </p>
    </div>
  )
}
