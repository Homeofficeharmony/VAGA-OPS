import { useState, useEffect, useRef } from 'react'
import { useCompletionTone } from '../hooks/useCompletionTone'
import { useContentRotation } from '../hooks/useContentRotation'
import VideoBackground from './VideoBackground'
import VideoModal from './VideoModal'

const TOTAL = 60

const accentColor = {
  red: '#c4604a',
  amber: '#c8a040',
  green: '#52b87e',
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function StealthReset({ stateData, onComplete }) {
  const { accent, id: stateId } = stateData
  const resetPool = stateData?.resetVariants ?? (stateData?.reset ? [stateData.reset] : [])
  const { item: selectedReset } = useContentRotation(resetPool)
  const reset = selectedReset ?? stateData?.reset
  const color = accentColor[accent]
  const { item: dailyTip } = useContentRotation(stateData?.tips ?? [])

  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [done, setDone] = useState(false)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [activationBefore, setActivationBefore] = useState(null)

  // Completion signal state
  const [showBanner, setShowBanner] = useState(false)
  const [pulsePanel, setPulsePanel] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(false)

  const intervalRef = useRef(null)
  const prevDoneRef = useRef(false)
  const startedAtRef = useRef(null)
  const activationBeforeRef = useRef(null)

  const playTone = useCompletionTone()

  // Keep ref in sync with state so the done-effect always reads the current value,
  // even though it doesn't re-register when activationBefore changes.
  activationBeforeRef.current = activationBefore

  // Reset on state switch
  useEffect(() => {
    setRunning(false)
    setElapsed(0)
    setDone(false)
    setShowBanner(false)
    setPulsePanel(false)
    setBannerVisible(false)
    setIsVideoModalOpen(false)
    setActivationBefore(null)
    clearInterval(intervalRef.current)
    prevDoneRef.current = false
    startedAtRef.current = null
  }, [stateData.id])

  // Countdown timer
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed((e) => {
          if (e >= TOTAL) {
            clearInterval(intervalRef.current)
            setRunning(false)
            setDone(true)
            return TOTAL
          }
          return e + 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  // Derived values
  const remaining = TOTAL - elapsed

  const currentStepIndex = reset.steps.findIndex((step) => {
    const end = parseInt(step.time.split('–')[1])
    return elapsed < end
  })
  const currentStep = reset.steps[currentStepIndex] ?? reset.steps[reset.steps.length - 1]

  // ── Completion signal ────────────────────────────────────────────────────
  useEffect(() => {
    if (done && !prevDoneRef.current) {
      prevDoneRef.current = true

      // Play completion tone
      playTone()

      // Flash panel
      setPulsePanel(true)
      setTimeout(() => setPulsePanel(false), 1500)

      // Show banner
      setShowBanner(true)
      setBannerVisible(true)
      setTimeout(() => {
        setBannerVisible(false)
        // Let fade transition finish before hiding
        setTimeout(() => setShowBanner(false), 500)
      }, 3000)

      // Call onComplete prop if provided
      if (typeof onComplete === 'function') {
        onComplete({ activationBefore: activationBeforeRef.current, startedAt: startedAtRef.current })
      }
    }
    if (!done) {
      prevDoneRef.current = false
    }
  }, [done, onComplete])

  const handleStart = () => {
    // Stop video demo if open before starting live protocol
    setIsVideoModalOpen(false)
    if (done) {
      setElapsed(0)
      setDone(false)
      setActivationBefore(null)
      startedAtRef.current = null
    }
    // Capture start time only on first start (not resume)
    if (!startedAtRef.current) {
      startedAtRef.current = new Date().toISOString()
    }
    setRunning(true)
  }

  return (
    <section>
      <div className="flex items-center justify-end gap-3 mb-3">
        <span
          className="font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 rounded border"
          style={{ color, borderColor: color + '50', backgroundColor: color + '10' }}
        >
          {TOTAL} SEC
        </span>
      </div>

      <div className="relative overflow-hidden bg-[#1D1B1B] border border-[#2A2A2A] rounded-xl transition-all duration-300"
        style={{ backgroundColor: 'rgba(29, 27, 27, 0.4)' }}>

        {/* Immersive Video Background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <VideoBackground stateId={stateId} running={running} elapsedSec={elapsed} totalSec={TOTAL}>
            <div />{/* Empty child, VideoBackground fills parent relative div natively */}
          </VideoBackground>
        </div>

        {/* Content layering over the video background */}
        <div className={`relative z-10 p-8 transition-all duration-300${pulsePanel ? ' animate-pulse' : ''}`}>

          {/* Completion banner */}
          {showBanner && (
            <div className="absolute top-0 left-0 right-0 z-50 flex justify-center mt-4">
              <div
                className="flex items-center gap-2 px-6 py-2 rounded-full border shadow-2xl transition-opacity duration-500 backdrop-blur-md"
                style={{
                  borderColor: color,
                  backgroundColor: 'rgba(9, 11, 15, 0.95)',
                  opacity: bannerVisible ? 1 : 0,
                }}
              >
                <span style={{ color }} className="text-sm font-mono">&#10003;</span>
                <span className="font-mono text-[11px] tracking-widest uppercase font-semibold text-slate-100">
                  Protocol Complete
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-8 mb-8">

            {/* Integrated Timer Block (Left side) */}
            <div className="flex flex-col items-center justify-center w-full sm:w-32 flex-shrink-0">
              {/* Time Display */}
              <div className="h-20 flex items-center justify-center mb-4">
                {done ? (
                  <span style={{ color }} className="text-4xl font-mono">&#10003;</span>
                ) : (
                  <span className="font-mono text-4xl font-bold tracking-widest text-white leading-none tabular-nums"
                    style={{
                      opacity: running ? 0 : 1,
                      transition: 'opacity 0.5s',
                      textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                    }}>
                    {String(Math.floor(remaining / 60)).padStart(2, '0')}:
                    {String(remaining % 60).padStart(2, '0')}
                  </span>
                )}
              </div>

              {/* Large Action Button */}
              {!done && (
                <button
                  onClick={running ? () => setRunning(false) : handleStart}
                  className="w-full py-2.5 rounded-lg text-xs font-mono font-bold tracking-[0.2em] transition-all duration-300 border uppercase shadow-lg"
                  style={{
                    borderColor: color,
                    color: running ? '#9ca3af' : color,
                    backgroundColor: running ? 'rgba(0,0,0,0.4)' : color + '20',
                    boxShadow: running ? 'none' : `0 4px 15px ${color}30`
                  }}
                  onMouseEnter={(e) => {
                    if (!running) {
                      e.currentTarget.style.backgroundColor = color + '30'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!running) {
                      e.currentTarget.style.backgroundColor = color + '20'
                      e.currentTarget.style.transform = 'none'
                    }
                  }}
                >
                  {running ? 'PAUSE' : elapsed > 0 ? 'RESUME' : 'START'}
                </button>
              )}
              {done && (
                <button
                  onClick={() => { setElapsed(0); setDone(false) }}
                  className="w-full py-2.5 rounded-lg text-xs font-mono font-bold tracking-[0.2em] transition-all duration-300 border uppercase shadow-lg"
                  style={{ borderColor: color, color: color, backgroundColor: 'rgba(21,21,21,0.5)', backdropFilter: 'blur(4px)' }}
                >
                  REPEAT
                </button>
              )}
            </div>

            {/* Content Block (Right side) */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-baseline gap-3 mb-4">
                <h3 className="font-bold text-2xl text-white tracking-wide" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{reset.title}</h3>
                <span className="text-sm font-mono text-charcoal-400 tracking-wider">
                  {reset.protocol}
                </span>
              </div>

              {/* Active step cue inside subtle container */}
              <div
                className="rounded-xl p-5 mb-5 border-l-2 relative overflow-hidden transition-all duration-500"
                style={{ borderColor: color, backgroundColor: 'rgba(30, 30, 30, 0.6)', backdropFilter: 'blur(8px)' }}
              >
                {running || elapsed > 0 ? (
                  <>
                    <div className="font-mono text-[11px] font-semibold tracking-widest uppercase mb-2" style={{ color }}>
                      {currentStep?.time}
                    </div>
                    <p className="text-base text-slate-100 leading-relaxed font-medium">
                      {currentStep?.cue}
                    </p>
                  </>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-mono text-[10px] tracking-widest uppercase flex-shrink-0" style={{ color: color + '80' }}>
                        Activation
                      </span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <button
                            key={n}
                            onClick={() => setActivationBefore(n)}
                            className="w-5 h-5 rounded text-[9px] font-mono font-bold transition-all duration-150"
                            style={{
                              backgroundColor: activationBefore === n ? color : color + '18',
                              color: activationBefore === n ? '#0f1410' : color,
                              border: `1px solid ${color}40`,
                            }}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[14px] text-slate-500 italic">
                      Press START to begin your 60-second protocol.
                    </p>
                  </div>
                )}
              </div>

              {/* Step indicators */}
              <div className="flex gap-2 mb-6">
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
                        backgroundColor: isPast ? color : isActive ? color + '80' : 'rgba(50,50,50,0.5)',
                        boxShadow: isActive ? `0 0 8px ${color}60` : 'none'
                      }}
                    />
                  )
                })}
              </div>

              {/* Interactive Video Demo Button */}
              <div
                onClick={() => setIsVideoModalOpen(true)}
                className="rounded-xl overflow-hidden border relative flex items-center p-4 cursor-pointer group transition-all duration-300"
                style={{
                  borderColor: color + '40',
                  backgroundColor: 'rgba(20,20,20,0.6)',
                  backdropFilter: 'blur(4px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(30,30,30,0.8)'
                  e.currentTarget.style.borderColor = color + '80'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(20,20,20,0.6)'
                  e.currentTarget.style.borderColor = color + '40'
                }}
                title={`Watch: ${reset.title} demo`}
              >
                <div className="flex items-center gap-5 w-full justify-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 shadow-lg"
                    style={{ backgroundColor: color + '15', border: `1.5px solid ${color}` }}
                  >
                    <div className="ml-1"
                      style={{ width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: `12px solid ${color}` }} />
                  </div>
                  <div>
                    <div className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: color }}>
                      Video Demo
                    </div>
                    <div className="font-mono text-[10px] text-slate-400 mt-1 tracking-wider uppercase">
                      60s · {reset.title}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Mechanism text */}
          <div className="pt-5 border-t border-charcoal-700">
            <div className="font-mono text-[10px] tracking-widest uppercase text-charcoal-500 mb-2 font-semibold">
              Mechanism
            </div>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              {reset.mechanism}
            </p>
            {dailyTip && (
              <p className="text-xs text-slate-400 mt-3 leading-relaxed italic">
                {dailyTip}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* App-level Demo Modal */}
      <VideoModal
        open={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        stateId={stateId}
        resetTitle={reset.title}
      />
    </section>
  )
}
