import { useAudioEngine } from '../hooks/useAudioEngine'

const accentColor = {
  red: '#c4604a',
  amber: '#c8a040',
  green: '#52b87e',
}

function EqBars({ playing, color }) {
  const heights = [0.55, 0.9, 0.7, 0.45, 0.8, 0.6, 0.75]
  return (
    <div className="flex items-end gap-[3px]" style={{ height: 28 }}>
      {heights.map((h, i) => (
        <div
          key={i}
          style={{
            width: 3,
            borderRadius: 2,
            backgroundColor: color + (playing ? '' : '60'),
            height: playing ? `${h * 100}%` : '22%',
            transition: playing ? 'none' : 'height 0.4s ease',
            animation: playing ? `pulse ${[0.55, 0.38, 0.7, 0.48, 0.6, 0.42, 0.55][i]}s ease-in-out ${i * 0.1}s infinite alternate` : 'none',
          }}
        />
      ))}
    </div>
  )
}

export default function AudioPlayerMini({ stateData }) {
  const { audio, accent } = stateData ?? {}
  const color = accentColor[accent] ?? '#52b87e'
  const track = audio?.tracks?.[0]

  const { playing, play, pause, volume, setVolume, supported } =
    useAudioEngine({ carrierHz: track?.carrierHz ?? 200, beatHz: track?.beatHz ?? 40 })

  if (!stateData || !track) return null

  const handleToggle = () => (playing ? pause() : play())

  return (
    <div
      className="rounded-[10px] flex flex-col gap-3"
      style={{
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        padding: '16px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold" style={{ color: '#e2ebe3' }}>
          Binaural Audio
        </span>
        <div
          className="rounded px-2 py-0.5"
          style={{ backgroundColor: color + '26' }}
        >
          <span className="text-[10px] font-semibold" style={{ color }}>
            {audio.title}
          </span>
        </div>
      </div>

      {/* Visualizer */}
      <div
        className="flex items-center justify-center rounded-md"
        style={{
          backgroundColor: '#0f1410',
          height: '40px',
        }}
      >
        <EqBars playing={playing} color={color} />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggle}
          disabled={!supported}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-30"
          style={{
            backgroundColor: playing ? color : color + '18',
            border: playing ? 'none' : `1px solid ${color}40`,
          }}
        >
          {playing ? (
            <div className="flex gap-1">
              <div className="w-[2.5px] h-3 rounded-full" style={{ backgroundColor: '#0f1410' }} />
              <div className="w-[2.5px] h-3 rounded-full" style={{ backgroundColor: '#0f1410' }} />
            </div>
          ) : (
            <span className="text-[12px]" style={{ color: '#0f1410', marginLeft: '2px' }}>▶</span>
          )}
        </button>

        <div className="flex flex-col gap-0.5 flex-1">
          <span className="text-[10px]" style={{ color: '#7a9b7c' }}>
            {track.carrierHz} Hz carrier
          </span>
          <span className="text-[10px]" style={{ color }}>
            +{track.beatHz} Hz beat
          </span>
        </div>

        {/* Volume */}
        <div
          className="relative h-1 rounded-sm cursor-pointer"
          style={{
            width: '60px',
            backgroundColor: '#263024',
          }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            setVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)))
          }}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-sm"
            style={{
              width: `${volume * 100}%`,
              backgroundColor: color,
            }}
          />
        </div>
      </div>
    </div>
  )
}
