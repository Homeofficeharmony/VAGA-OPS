import { getShiftTrajectory } from '../lib/chartData'

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function getDayAbbr(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return DAY_LABELS[d.getDay()]
}

const W = 280
const H = 100
const PAD = { left: 28, right: 8, top: 12, bottom: 24 }
const Y_MIN = -1
const Y_MAX = 2

const innerW = W - PAD.left - PAD.right
const innerH = H - PAD.top - PAD.bottom

function yScale(v) {
  return PAD.top + innerH - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * innerH
}

function xScale(i) {
  return PAD.left + (i / 6) * innerW
}

export default function ShiftTrajectoryChart({ sessions }) {
  const points = getShiftTrajectory(sessions, 7)

  const panelStyle = {
    borderRadius: '0.75rem',
    padding: '1rem',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-panel)',
  }

  // Empty state — no shift data at all
  if (points.every((p) => p.y === null)) {
    return (
      <div style={panelStyle}>
        <p
          className="font-mono text-[9px] tracking-widest uppercase text-center"
          style={{ color: 'var(--text-muted)' }}
        >
          Complete a reset to begin tracking shifts.
        </p>
      </div>
    )
  }

  // Build contiguous segments for polyline rendering (skip null gaps)
  const segments = []
  let current = []
  for (let i = 0; i < points.length; i++) {
    if (points[i].y === null) {
      if (current.length > 1) segments.push([...current])
      current = []
    } else {
      current.push({ i, ...points[i] })
    }
  }
  if (current.length > 1) segments.push(current)

  // Collect individual non-null points for dot rendering
  const dotPoints = points
    .map((pt, i) => ({ i, ...pt }))
    .filter((pt) => pt.y !== null)

  const zeroY = yScale(0)

  return (
    <div style={panelStyle}>
      <p
        className="font-mono text-[9px] tracking-widest uppercase mb-3"
        style={{ color: 'var(--text-muted)' }}
      >
        Regulation Shift (7 days)
      </p>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ overflow: 'visible' }}
        aria-label="shift trajectory"
      >
        {/* Zero baseline */}
        <line
          x1={PAD.left}
          y1={zeroY}
          x2={W - PAD.right}
          y2={zeroY}
          stroke="var(--border)"
          strokeWidth={1}
          strokeDasharray="2 3"
        />

        {/* Y-axis labels */}
        <text
          x={PAD.left - 4}
          y={yScale(Y_MAX) + 3}
          fill="var(--text-muted)"
          fontSize={7}
          fontFamily="JetBrains Mono, monospace"
          textAnchor="end"
        >
          {Y_MAX}
        </text>
        <text
          x={PAD.left - 4}
          y={yScale(Y_MIN) + 3}
          fill="var(--text-muted)"
          fontSize={7}
          fontFamily="JetBrains Mono, monospace"
          textAnchor="end"
        >
          {Y_MIN}
        </text>

        {/* Polyline segments (contiguous non-null runs) */}
        {segments.map((seg, si) => {
          const pts = seg
            .map((p) => `${xScale(p.i)},${yScale(p.y)}`)
            .join(' ')
          return (
            <polyline
              key={si}
              points={pts}
              stroke="var(--text-primary)"
              strokeWidth={1.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )
        })}

        {/* Data point dots */}
        {dotPoints.map((pt) => (
          <circle
            key={pt.i}
            cx={xScale(pt.i)}
            cy={yScale(pt.y)}
            r={3}
            fill="var(--text-primary)"
          />
        ))}

        {/* X-axis day labels */}
        {points.map((pt, i) => (
          <text
            key={i}
            x={xScale(i)}
            y={H - 4}
            fill="var(--text-muted)"
            fontSize={8}
            fontFamily="JetBrains Mono, monospace"
            textAnchor="middle"
          >
            {getDayAbbr(pt.x)}
          </text>
        ))}
      </svg>
    </div>
  )
}
