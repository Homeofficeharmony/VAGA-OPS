import VideoBackground from './VideoBackground'

const TOTAL = 60

export default function FocusMode({ open, stateData, elapsed, running, onTogglePlay, onExit }) {
  if (!open || !stateData) return null

  const { reset, accent, label, accentHex, id: stateId } = stateData

  const remaining = TOTAL - elapsed

  const currentStepIndex = reset.steps.findIndex((step) => {
    const end = parseInt(step.time.split('–')[1])
    return elapsed < end
  })
  const currentStep = reset.steps[currentStepIndex] ?? reset.steps[reset.steps.length - 1]

  const timeStr =
    String(Math.floor(remaining / 60)).padStart(2, '0') +
    ':' +
    String(remaining % 60).padStart(2, '0')

  return (
    <div className="fixed inset-0 z-[100] bg-[#050510]">
      <VideoBackground stateId={stateId} running={running} elapsedSec={elapsed} totalSec={TOTAL}>
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-black/40 backdrop-blur-sm">

          {/* Structured Card matching Stealth Reset */}
          <div className="relative w-full max-w-2xl bg-[#1D1B1B]/60 border border-[#2A2A2A] rounded-xl overflow-hidden p-8 shadow-2xl backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-8">

              {/* Left Column: Timer block */}
              <div className="flex flex-col items-center justify-center w-full sm:w-32 flex-shrink-0">
                <div className="h-20 flex items-center justify-center mb-4">
                  {remaining <= 0 ? (
                    <span style={{ color: accentHex }} className="text-4xl font-mono">&#10003;</span>
                  ) : (
                    <span className="font-mono text-4xl font-bold tracking-widest text-white leading-none tabular-nums"
                      style={{
                        opacity: running ? 0 : 1,
                        transition: 'opacity 0.5s',
                        textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                      }}>
                      {timeStr}
                    </span>
                  )}
                </div>

                {/* Large Action Button */}
                {remaining > 0 && (
                  <button
                    onClick={onTogglePlay}
                    className="w-full py-2.5 rounded-lg text-xs font-mono font-bold tracking-[0.2em] transition-all duration-300 border uppercase shadow-lg"
                    style={{
                      borderColor: accentHex,
                      color: running ? '#9ca3af' : accentHex,
                      backgroundColor: running ? 'rgba(0,0,0,0.4)' : accentHex + '20',
                      boxShadow: running ? 'none' : `0 4px 15px ${accentHex}30`
                    }}
                    onMouseEnter={(e) => {
                      if (!running) {
                        e.currentTarget.style.backgroundColor = accentHex + '30'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!running) {
                        e.currentTarget.style.backgroundColor = accentHex + '20'
                        e.currentTarget.style.transform = 'none'
                      }
                    }}
                  >
                    {running ? 'PAUSE' : elapsed > 0 ? 'RESUME' : 'PLAY'}
                  </button>
                )}
              </div>

              {/* Right Column: Content block */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-baseline gap-3 mb-4">
                  <h3 className="font-bold text-2xl text-white tracking-wide" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{label}</h3>
                  <span className="text-sm font-mono text-charcoal-400 tracking-wider">Focus Mode</span>
                </div>

                <div className="rounded-xl p-5 mb-5 border-l-2 relative overflow-hidden transition-all duration-500 bg-[#1E1E1E]/60 backdrop-blur-sm" style={{ borderColor: accentHex }}>
                  {running || elapsed > 0 ? (
                    <>
                      <div className="font-mono text-[11px] font-semibold tracking-widest uppercase mb-2" style={{ color: accentHex }}>
                        {currentStep?.time}
                      </div>
                      <p className="text-base text-slate-100 leading-relaxed font-medium">
                        {currentStep?.cue ?? ''}
                      </p>
                    </>
                  ) : (
                    <p className="text-[15px] text-slate-400 leading-relaxed italic h-[48px] flex items-center">
                      Press PLAY to begin your 60-second protocol.
                    </p>
                  )}
                </div>

                {/* Step indicators */}
                <div className="flex gap-2">
                  {reset.steps.map((step, i) => {
                    const stepEnd = parseInt(step.time.split('–')[1])
                    const stepStart = parseInt(step.time.split('–')[0])
                    const isActive = elapsed >= stepStart && Math.floor(elapsed) < stepEnd
                    const isPast = elapsed >= stepEnd
                    return (
                      <div
                        key={i}
                        className="h-1.5 flex-1 rounded-full transition-all duration-[800ms] shadow-sm"
                        style={{
                          backgroundColor: isPast ? accentHex : isActive ? accentHex + '80' : 'rgba(50,50,50,0.5)',
                          boxShadow: isActive ? `0 0 8px ${accentHex}60` : 'none'
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Exit button */}
          <button
            onClick={onExit}
            className="mt-8 font-mono text-[10px] tracking-widest uppercase transition-colors px-6 py-2 rounded-lg border text-gray-400 hover:text-white border-[#22262f] hover:border-gray-500 bg-black/50"
          >
            EXIT FOCUS
          </button>
        </div>
      </VideoBackground>
    </div>
  )
}
