const SOUNDSCAPES = [
  { id: 'forest', label: 'Forest' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'binaural', label: 'Tones' },
]

export default function AmbientPanel({ engine, stateData }) {
  const { activeId, select } = engine ?? {}
  const isOn = activeId && activeId !== 'silence'

  const handleToggle = () => {
    if (isOn) {
      select?.('silence')
    } else {
      select?.('forest', stateData)
    }
  }

  const handleSelect = (id) => {
    select?.(id, stateData)
  }

  return (
    <div
      className="rounded-[10px] flex flex-col gap-2.5"
      style={{
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        padding: '14px 16px',
      }}
    >
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold" style={{ color: '#e2ebe3' }}>
          Ambient Sound
        </span>
        <button
          onClick={handleToggle}
          className="rounded-full relative transition-colors duration-200"
          style={{
            width: '36px',
            height: '20px',
            backgroundColor: isOn ? '#52b87e' : '#263024',
          }}
        >
          <div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200"
            style={{
              left: isOn ? '18px' : '2px',
            }}
          />
        </button>
      </div>

      {/* Soundscape buttons */}
      <div className="flex gap-1.5">
        {SOUNDSCAPES.map(({ id, label }) => {
          const isActive = activeId === id
          return (
            <button
              key={id}
              onClick={() => handleSelect(id)}
              className="flex-1 flex items-center justify-center rounded-md py-1.5 text-[10px] font-medium transition-colors duration-200"
              style={{
                backgroundColor: isActive ? '#52b87e18' : 'var(--bg-panel)',
                border: isActive ? '1px solid #52b87e40' : '1px solid transparent',
                color: isActive ? '#52b87e' : '#7a9b7c',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
