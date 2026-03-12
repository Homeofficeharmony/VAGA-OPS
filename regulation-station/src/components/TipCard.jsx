const STATE_LABELS = {
  frozen: 'SHUTDOWN TIP',
  anxious: 'ALERT TIP',
  flow: 'FLOW TIP',
}

export default function TipCard({ stateData, selectedState }) {
  if (!stateData) return null

  const tips = stateData.tips ?? []
  // Pick a tip based on the current minute for variety
  const tipIndex = tips.length > 0 ? new Date().getMinutes() % tips.length : 0
  const tip = tips[tipIndex] ?? stateData.polyvagalNote

  const color = stateData.accentHex
  const label = STATE_LABELS[selectedState] ?? 'TIP'

  return (
    <div
      className="rounded-[10px] flex flex-col gap-2.5"
      style={{
        backgroundColor: color + '0a',
        border: `1px solid ${color}30`,
        padding: '16px',
      }}
    >
      <span
        className="font-mono text-[10px] font-semibold tracking-[0.06em] uppercase"
        style={{ color }}
      >
        {label}
      </span>
      <p
        className="text-[11px] leading-[1.5]"
        style={{ color: '#c0d4c2' }}
      >
        {tip}
      </p>
    </div>
  )
}
