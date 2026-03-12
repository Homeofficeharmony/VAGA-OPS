import { STATES } from '../data/stateData'

const accentColor = {
  red: '#c4604a',
  amber: '#c8a040',
  green: '#52b87e',
}

export default function ProtocolSteps({ stateData, activeStep = 0 }) {
  if (!stateData) return null

  const color = accentColor[stateData.accent]
  const steps = stateData.reset?.steps ?? []
  // Show first 4 steps
  const displaySteps = steps.slice(0, 4)
  const stepLabels = [
    { label: displaySteps[0]?.cue?.split('.')[0] ?? 'Step 1', sub: displaySteps[0]?.cue?.split('.').slice(1).join('.').trim() ?? '' },
    { label: displaySteps[1]?.cue?.split('.')[0] ?? 'Step 2', sub: displaySteps[1]?.cue?.split('.').slice(1).join('.').trim() ?? '' },
    { label: displaySteps[2]?.cue?.split('.')[0] ?? 'Step 3', sub: displaySteps[2]?.cue?.split('.').slice(1).join('.').trim() ?? '' },
    { label: displaySteps[3]?.cue?.split('.')[0] ?? 'Step 4', sub: displaySteps[3]?.cue?.split('.').slice(1).join('.').trim() ?? '' },
  ]

  return (
    <div className="flex flex-col gap-2">
      <div
        className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase mb-1"
        style={{ color: '#7a9b7c' }}
      >
        Protocol Steps
      </div>
      {stepLabels.map((step, i) => {
        const isActive = i === activeStep
        return (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg"
            style={{
              padding: '12px 14px',
              backgroundColor: isActive ? color + '18' : 'var(--bg-panel)',
              border: isActive ? `1px solid ${color}40` : '1px solid transparent',
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: isActive ? color : '#263024',
                color: isActive ? '#0f1410' : color,
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {i + 1}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span
                className="text-[13px] font-semibold leading-tight truncate"
                style={{ color: isActive ? 'var(--text-primary)' : '#c0d4c2' }}
              >
                {step.label}
              </span>
              {step.sub && (
                <span
                  className="text-[11px] leading-tight truncate"
                  style={{ color: '#7a9b7c' }}
                >
                  {step.sub}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
