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
            backgroundColor: isCalibrated ? color : color + '10',
          }}
        >
          {isCalibrated ? optimalStatus : 'Shed Load'}
        </span>
      </div>

      <div
        className="bg-[#111318] border rounded-xl p-5 transition-all duration-500 relative flex flex-col items-center justify-center min-h-[400px] overflow-hidden"
        style={{ borderColor: isCalibrated ? color + '60' : '#22262f' }}
      >
        {/* Background Grid/Glow for atmosphere */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(circle at center, ${color}05 0%, transparent 60%)`
        }} />

        {/* Load Level Meter (Top Left) */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] tracking-widest uppercase text-slate-500 mb-1">
              {meterLabel}
            </span>
            <div className="flex gap-1 h-1 w-32">
              {Array.from({ length: totalCount }).map((_, i) => {
                const isActive = i < remainingCount
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: isActive
                        ? (isCalibrated ? color : fullColor + 'aa')
                        : '#1e232e'
                    }}
                  />
                )
              })}
            </div>
          </div>

          <button
              onClick={handleReset}
              className="font-mono text-[10px] tracking-widest uppercase transition-colors pointer-events-auto"
              style={{ color: shedIds.size > 0 ? '#6b7280' : 'transparent' }}
            >
              Restore All
          </button>
        </div>


        {/* The Constellation */}
        <div className="relative w-64 h-64 mt-6 flex items-center justify-center">
          
          {/* Central Core */}
          <div 
            className="absolute z-10 w-28 h-28 rounded-full border border-dashed flex flex-col items-center justify-center text-center p-3 transition-all duration-700"
            style={{ 
              borderColor: isCalibrated ? color : '#333a45',
              backgroundColor: isCalibrated ? color + '15' : '#15181e',
              boxShadow: isCalibrated ? `0 0 30px ${color}30, inset 0 0 20px ${color}20` : 'none',
              transform: isCalibrated ? 'scale(1.1)' : 'scale(1)'
            }}
          >
             {isCalibrated ? (
                <>
                  <div className="text-xl mb-1">{visibleItems.find(t => !shedIds.has(t.id))?.icon}</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest" style={{ color }}>{optimalStatus}</div>
                  <div className="text-[10px] text-slate-200 mt-1 leading-tight line-clamp-2">
                    {visibleItems.find(t => !shedIds.has(t.id))?.label}
                  </div>
                </>
             ) : (
                <>
                  <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: fullColor }}>
                    {fullStatus}
                  </div>
                  {expandedWhy ? (
                    <div className="text-[10px] text-slate-300 mt-1.5 leading-tight absolute inset-1 flex items-center justify-center p-2 bg-[#15181e] rounded-full fade-in">
                       {visibleItems.find(t => t.id === expandedWhy)?.label}
                    </div>
                  ) : (
                    <div className="text-[9px] text-slate-500 mt-2">
                       Hover node.<br/>Click to shed.
                    </div>
                  )}
                </>
             )}
          </div>

          {/* Orbiting Nodes */}
          {visibleItems.map((task, i) => {
            const isShed = shedIds.has(task.id)
            const isSoleRemaining = isCalibrated && !isShed
            
            // Do not render shed items or the final item (it's in the center)
            if (isShed || isSoleRemaining) return null

            // Calculate position along a circle
            // Start at top (-90deg), distribute evenly
            const activeItems = visibleItems.filter(t => !shedIds.has(t.id))
            const activeIndex = activeItems.findIndex(t => t.id === task.id)
            if (activeIndex === -1) return null

            const angleStep = (Math.PI * 2) / activeItems.length
            const angle = (activeIndex * angleStep) - (Math.PI / 2)
            const radius = 105 // Orbit distance
            
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius

            return (
              <button
                key={task.id}
                onClick={() => handleShed(task.id)}
                onMouseEnter={() => setExpandedWhy(task.id)}
                onMouseLeave={() => setExpandedWhy(null)}
                className="absolute w-10 h-10 rounded-full flex flex-col items-center justify-center transition-all duration-500 border hover:scale-110 z-20 group"
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                  borderColor: expandedWhy === task.id ? color : '#2a2f3a',
                  backgroundColor: expandedWhy === task.id ? color + '20' : '#1a1d24',
                  boxShadow: expandedWhy === task.id ? `0 0 15px ${color}40` : '0 4px 6px rgba(0,0,0,0.3)'
                }}
              >
                <span className="text-lg group-hover:drop-shadow-md transition-all">{task.icon}</span>
              </button>
            )
          })}
        </div>

        {/* Note / Directive at bottom */}
        <div className="mt-8 text-center max-w-sm relative z-10 h-10 flex items-center justify-center">
            <p className="font-mono text-[10px] tracking-widest uppercase transition-colors duration-500" style={{ color: isCalibrated ? color : color + '90' }}>
              {isCalibrated ? capacity.calibratedNote : tasks.note}
            </p>
        </div>

      </div>
    </section>
  )
}
