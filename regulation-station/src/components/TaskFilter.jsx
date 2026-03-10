import { useState, useEffect } from 'react'

const accentColor = {
  red: '#c4604a',
  amber: '#c8a040',
  green: '#52b87e',
}

function getTimeOfDaySlot() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  return 'evening'
}

export default function TaskFilter({ stateData }) {
  const { tasks, accent } = stateData
  const color = accentColor[accent]
  const capacity = tasks.capacity || {}

  const [shedIds, setShedIds] = useState(new Set())
  const [isCalibrated, setIsCalibrated] = useState(false)
  const [expandedWhy, setExpandedWhy] = useState(null)

  const slot = getTimeOfDaySlot()
  const visibleItems = tasks.items.filter(
    item => !item.timeOfDay || item.timeOfDay === 'any' || item.timeOfDay === slot
  )

  useEffect(() => {
    setShedIds(new Set())
    setIsCalibrated(false)
    setExpandedWhy(null)
  }, [stateData])

  const handleShed = (id) => {
    if (isCalibrated) return
    setShedIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      if (visibleItems.length - next.size === 1) {
        setIsCalibrated(true)
        setExpandedWhy(null)
      }
      return next
    })
  }

  const handleReset = () => {
    setShedIds(new Set())
    setIsCalibrated(false)
    setExpandedWhy(null)
  }

  const remainingCount = visibleItems.length - shedIds.size
  const totalCount = visibleItems.length

  // Meter colors: full state uses a softer amber instead of alarming red
  const fullColor = '#c87840'
  const meterLabel = capacity.meterLabel || 'Cognitive Load'
  const fullStatus = capacity.fullStatus || 'OVERLOAD'
  const optimalStatus = capacity.optimalStatus || 'OPTIMAL'

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <span className="font-mono text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-300">
          03 / Capacity Calibrator
        </span>
        <div className="flex-1 h-px bg-charcoal-700" />
        <span
          className="font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 rounded border transition-colors duration-500"
          style={{
            color: isCalibrated ? '#111318' : color,
            borderColor: isCalibrated ? color : color + '50',
            backgroundColor: isCalibrated ? color : color + '10'
          }}
        >
          {isCalibrated ? optimalStatus : 'Shed Load'}
        </span>
      </div>

      <div
        className="bg-[#111318] border rounded-xl p-5 transition-all duration-500"
        style={{ borderColor: isCalibrated ? color + '60' : '#22262f' }}
      >
        {/* Load Level Meter */}
        <div className="mb-5">
          <div className="flex justify-between items-end mb-2">
            <span className="font-mono text-[10px] tracking-widest uppercase text-slate-400">
              {meterLabel}
            </span>
            <span
              className="font-mono text-[10px] tracking-widest uppercase transition-colors duration-500"
              style={{ color: isCalibrated ? color : fullColor }}
            >
              {isCalibrated ? optimalStatus : fullStatus}
            </span>
          </div>
          <div className="flex gap-1 h-1.5">
            {Array.from({ length: totalCount }).map((_, i) => {
              const isActive = i < remainingCount
              return (
                <div
                  key={i}
                  className="flex-1 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: isActive
                      ? (isCalibrated ? color : fullColor + 'cc')
                      : '#22262f'
                  }}
                />
              )
            })}
          </div>
        </div>

        {/* Rationale + directive note */}
        <div
          className={`rounded-lg px-4 py-3 border-l-2 bg-[#1a1d24] transition-all duration-500 overflow-hidden ${
            isCalibrated ? 'h-0 py-0 mb-0 opacity-0 border-transparent' : 'mb-5 opacity-100'
          }`}
          style={{ borderColor: color }}
        >
          {capacity.rationale && (
            <p className="text-sm text-slate-300 leading-relaxed mb-2">
              {capacity.rationale}
            </p>
          )}
          <div className="font-mono text-[10px] tracking-widest uppercase" style={{ color: color + '90' }}>
            {tasks.note}
          </div>
        </div>

        {/* Task list */}
        <div className="space-y-2.5">
          {visibleItems.map((task) => {
            const isShed = shedIds.has(task.id)
            const isSoleRemaining = isCalibrated && !isShed
            const isWhyOpen = expandedWhy === task.id

            if (isShed && isCalibrated) return null

            return (
              <div
                key={task.id}
                className={`rounded-xl border transition-all duration-500 transform overflow-hidden ${
                  isShed
                    ? 'opacity-0 scale-95 max-h-0 border-transparent'
                    : 'opacity-100 scale-100 max-h-48'
                } ${isSoleRemaining ? 'shadow-lg' : ''}`}
                style={{
                  borderColor: isSoleRemaining ? color : '#22262f',
                  backgroundColor: isSoleRemaining ? color + '12' : '#15181e',
                }}
              >
                {/* Main row */}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  {/* Icon */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 border"
                    style={{
                      borderColor: isSoleRemaining ? color + '50' : '#2a2f3a',
                      backgroundColor: isSoleRemaining ? color + '15' : '#1a1d24',
                    }}
                  >
                    {task.icon}
                  </div>

                  {/* Label + why toggle */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-medium leading-snug transition-colors ${
                        isSoleRemaining ? 'text-slate-100' : 'text-slate-200'
                      }`}
                    >
                      {task.label}
                    </div>
                    {task.estimatedDurationMin && (
                      <span className="font-mono text-[9px] text-charcoal-600 mt-0.5 block">
                        ~{task.estimatedDurationMin} min
                      </span>
                    )}
                    {isSoleRemaining && capacity.calibratedNote && (
                      <div
                        className="text-[11px] mt-0.5 leading-snug"
                        style={{ color }}
                      >
                        {capacity.calibratedNote}
                      </div>
                    )}
                    {!isSoleRemaining && task.why && (
                      <button
                        onClick={() => setExpandedWhy(isWhyOpen ? null : task.id)}
                        className="font-mono text-[9px] tracking-widest uppercase mt-0.5 transition-colors"
                        style={{ color: isWhyOpen ? color : '#4a5568' }}
                      >
                        {isWhyOpen ? '▴ why this' : '▾ why this'}
                      </button>
                    )}
                  </div>

                  {/* Release button */}
                  {!isSoleRemaining && !isShed && (
                    <button
                      onClick={() => handleShed(task.id)}
                      className="flex-shrink-0 font-mono text-[10px] font-semibold tracking-widest uppercase px-3 py-1.5 rounded-lg border transition-all duration-200"
                      style={{ borderColor: '#3a404d', color: '#5a6272' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = color + '80'
                        e.currentTarget.style.color = color
                        e.currentTarget.style.backgroundColor = color + '12'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#3a404d'
                        e.currentTarget.style.color = '#5a6272'
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                      title="Release this task from your focus"
                    >
                      Release
                    </button>
                  )}

                  {/* Calibrated indicator */}
                  {isSoleRemaining && (
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: color }}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    </div>
                  )}
                </div>

                {/* Expandable why row */}
                {isWhyOpen && task.why && !isSoleRemaining && (
                  <div
                    className="px-4 pb-3 pt-0 text-[12px] leading-relaxed text-slate-400 border-t"
                    style={{ borderColor: '#1e2330' }}
                  >
                    {task.why}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-charcoal-800 flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-widest uppercase text-charcoal-500">
            {meterLabel}: {remainingCount} / {totalCount}
          </span>
          {shedIds.size > 0 && (
            <button
              onClick={handleReset}
              className="font-mono text-[10px] tracking-widest uppercase transition-colors"
              style={{ color: '#6b7280' }}
              onMouseEnter={(e) => (e.target.style.color = '#9ca3af')}
              onMouseLeave={(e) => (e.target.style.color = '#6b7280')}
            >
              Restore All
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
