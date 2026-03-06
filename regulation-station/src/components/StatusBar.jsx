import { useState, useEffect, useRef } from 'react'

const accentColor = {
  red: '#c4604a',
  amber: '#c8a040',
  green: '#52b87e',
}

const stateMessages = {
  frozen: 'Protocol active — low-activation mode. Execute without deliberation.',
  anxious: 'Regulation in progress — narrow focus, one task.',
  flow: 'Optimal state — protect the window. No interruptions.',
}

const TIP_INTERVAL_MS = 9000
const FADE_MS = 400

export default function StatusBar({ selectedState, stateData }) {
  const tips = stateData?.tips ?? []
  // Cycle: 0 = static message, 1..N = tips
  const total = tips.length + 1
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const timerRef = useRef(null)

  // Reset on state change
  useEffect(() => {
    setIndex(0)
    setVisible(true)
  }, [selectedState])

  useEffect(() => {
    if (total <= 1) return
    timerRef.current = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % total)
        setVisible(true)
      }, FADE_MS)
    }, TIP_INTERVAL_MS)
    return () => clearInterval(timerRef.current)
  }, [total, selectedState])

  if (!selectedState) return null

  const color = accentColor[stateData.accent]
  const isStaticMsg = index === 0
  const displayText = isStaticMsg ? stateMessages[selectedState] : tips[index - 1]

  return (
    <div
      className="rounded-xl px-5 py-3 flex items-center gap-4 border"
      style={{
        borderColor: color + '30',
        backgroundColor: color + '08',
      }}
    >
      <div
        className="flex-shrink-0 w-2 h-2 rounded-full animate-pulse"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 min-w-0">
        <span
          className="text-sm leading-relaxed transition-opacity duration-300"
          style={{ color: color + 'cc', opacity: visible ? 1 : 0 }}
        >
          {displayText}
        </span>
      </div>
      <div className="flex-shrink-0 flex items-center gap-2">
        {!isStaticMsg && (
          <span
            className="font-mono text-[9px] tracking-widest uppercase transition-opacity duration-300"
            style={{ color: color + '50', opacity: visible ? 1 : 0 }}
          >
            TIP {index}/{tips.length}
          </span>
        )}
        <div
          className="flex-shrink-0 font-mono text-[10px] tracking-widest uppercase"
          style={{ color: color + '60' }}
        >
          {stateData.polyvagalNote.split('—')[0].trim()}
        </div>
      </div>
    </div>
  )
}
