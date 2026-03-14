import TaskFilter from './TaskFilter'

export default function TasksPage({ stateData }) {
  if (!stateData) {
    return (
      <div className="page-content flex flex-col items-center justify-center min-h-full px-6 py-16 page-enter">
        <p className="text-[13px] text-center" style={{ color: 'var(--text-muted)' }}>
          Select a state first to see task recommendations.
        </p>
      </div>
    )
  }

  const { accentHex } = stateData

  return (
    <div className="page-content flex flex-col page-enter">
      {/* State accent strip */}
      <div
        style={{
          height: 3,
          flexShrink: 0,
          background: `linear-gradient(90deg, transparent, ${accentHex}, transparent)`,
        }}
      />

      <div className="flex flex-col gap-5 px-6 py-8 max-w-md mx-auto w-full">
        {/* State identity chip */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full w-fit"
          style={{
            backgroundColor: `${accentHex}18`,
            border: `1px solid ${accentHex}30`,
          }}
        >
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accentHex }} />
          <span className="text-[11px] font-medium" style={{ color: accentHex }}>
            {stateData.label}
          </span>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-[22px] font-light tracking-wide" style={{ color: 'var(--text-primary)' }}>
            Capacity Calibrator
          </h2>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Shed tasks until one remains — your optimal focus target.
          </p>
        </div>

        <TaskFilter stateData={stateData} />
      </div>
    </div>
  )
}
