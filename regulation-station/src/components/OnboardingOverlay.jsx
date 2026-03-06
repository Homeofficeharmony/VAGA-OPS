import { useState, useEffect } from 'react'

const SLIDES = [
  {
    id: 0,
    title: 'What is this?',
  },
  {
    id: 1,
    title: 'Three States',
  },
  {
    id: 2,
    title: 'How to use it',
  },
]

function Slide0() {
  return (
    <div
      className="flex flex-col items-center text-center"
      style={{ transition: 'opacity 0.3s ease' }}
    >
      <img
        src="/vaga-ops-logo.jpg"
        alt="VAGA OPS"
        style={{ width: 64, height: 64, borderRadius: 8 }}
        className="mb-4"
      />
      <div
        className="font-mono text-xl tracking-widest mb-1"
        style={{ color: '#00ff88' }}
      >
        VAGA OPS
      </div>
      <div
        className="font-mono text-xs mb-6"
        style={{ color: '#4a5568' }}
      >
        Regulation Station
      </div>
      <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
        Your nervous system runs your output. This tool maps your biological
        state and gives you the exact protocol to shift it — in 60 seconds.
      </p>
    </div>
  )
}

function Slide1() {
  const states = [
    {
      color: '#ff3d5a',
      dot: 'circle',
      name: 'Frozen / Shutdown',
      desc: 'Dorsal vagal. Dissociated. Can\'t start.',
    },
    {
      color: '#ffb800',
      dot: 'bolt',
      name: 'Anxious / High-Alert',
      desc: 'Sympathetic. Fight/flight. Scattered.',
    },
    {
      color: '#00ff88',
      dot: 'diamond',
      name: 'Safe / Flow',
      desc: 'Ventral vagal. Present. Ready to build.',
    },
  ]

  return (
    <div>
      <div className="space-y-4 mb-6">
        {states.map((s) => (
          <div key={s.name} className="flex items-start gap-3">
            <div
              className="flex-shrink-0 mt-0.5"
              style={{ width: 10, height: 10 }}
            >
              {s.dot === 'circle' && (
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: s.color,
                    marginTop: 3,
                  }}
                />
              )}
              {s.dot === 'bolt' && (
                <div
                  className="font-mono text-xs leading-none"
                  style={{ color: s.color, marginTop: 1 }}
                >
                  ⚡
                </div>
              )}
              {s.dot === 'diamond' && (
                <div
                  className="font-mono text-xs leading-none"
                  style={{ color: s.color, marginTop: 1 }}
                >
                  ◈
                </div>
              )}
            </div>
            <div>
              <div
                className="font-mono text-xs tracking-wide font-semibold"
                style={{ color: s.color }}
              >
                {s.name}
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                {s.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm" style={{ color: '#94a3b8' }}>
        Select your honest state — not your aspirational one.
      </p>
    </div>
  )
}

function Slide2({ onEnter }) {
  const steps = [
    'Select your state above.',
    'Run the 60-second Stealth Reset.',
    'Follow the Task Filter. Start the binaural track.',
  ]

  return (
    <div>
      <ol className="space-y-3 mb-6">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className="font-mono text-sm font-bold flex-shrink-0 w-5"
              style={{ color: '#00ff88' }}
            >
              {i + 1}.
            </span>
            <span className="text-sm" style={{ color: '#94a3b8' }}>
              {step}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-sm mb-8" style={{ color: '#94a3b8' }}>
        The protocol takes 60 seconds. Your capacity takes 3–5 minutes to
        shift. Give it time.
      </p>
      <button
        onClick={onEnter}
        className="w-full py-3 rounded-lg font-mono text-sm tracking-widest uppercase font-semibold transition-all duration-200"
        style={{
          backgroundColor: '#00ff88',
          color: '#060d1a',
          boxShadow: '0 0 24px #00ff8860',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 0 36px #00ff8899'
          e.currentTarget.style.backgroundColor = '#22ffaa'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 0 24px #00ff8860'
          e.currentTarget.style.backgroundColor = '#00ff88'
        }}
      >
        ENTER STATION
      </button>
    </div>
  )
}

export default function OnboardingOverlay() {
  const [dismissed, setDismissed] = useState(false)
  const [slide, setSlide] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('vaga-onboarded') === 'true') {
      setDismissed(true)
    } else {
      // Slight delay so the fade-in is visible
      requestAnimationFrame(() => setVisible(true))
    }
  }, [])

  const handleEnter = () => {
    localStorage.setItem('vaga-onboarded', 'true')
    setVisible(false)
    setTimeout(() => setDismissed(true), 300)
  }

  if (dismissed) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(6,13,26,0.96)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div
        className="w-full max-w-md mx-4 rounded-xl p-8"
        style={{
          backgroundColor: '#111318',
          border: '1px solid #22262f',
        }}
      >
        {/* Slide title */}
        <div className="mb-6">
          <div
            className="font-mono text-[10px] tracking-[0.2em] uppercase mb-1"
            style={{ color: '#4a5568' }}
          >
            Step {slide + 1} of {SLIDES.length}
          </div>
          <div
            className="font-mono text-base tracking-wide font-semibold"
            style={{ color: '#e2e8f0' }}
          >
            {SLIDES[slide].title}
          </div>
        </div>

        {/* Slide content with opacity fade */}
        <div style={{ minHeight: 200 }}>
          {slide === 0 && <Slide0 />}
          {slide === 1 && <Slide1 />}
          {slide === 2 && <Slide2 onEnter={handleEnter} />}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setSlide((s) => Math.max(0, s - 1))}
            disabled={slide === 0}
            className="font-mono text-xs tracking-widest uppercase px-4 py-2 rounded-lg transition-all duration-150 disabled:opacity-20 disabled:cursor-not-allowed"
            style={{
              color: '#94a3b8',
              border: '1px solid #22262f',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled)
                e.currentTarget.style.borderColor = '#4a5568'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#22262f'
            }}
          >
            Previous
          </button>

          {/* Slide dots */}
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === slide ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === slide ? '#00ff88' : '#2c313c',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>

          {slide < SLIDES.length - 1 ? (
            <button
              onClick={() => setSlide((s) => Math.min(SLIDES.length - 1, s + 1))}
              className="font-mono text-xs tracking-widest uppercase px-4 py-2 rounded-lg transition-all duration-150"
              style={{
                color: '#00ff88',
                border: '1px solid #00ff8850',
                backgroundColor: '#00ff8810',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#00ff8820'
                e.currentTarget.style.borderColor = '#00ff8880'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#00ff8810'
                e.currentTarget.style.borderColor = '#00ff8850'
              }}
            >
              Next
            </button>
          ) : (
            // Spacer to keep dots centered on last slide
            <div style={{ width: 72 }} />
          )}
        </div>
      </div>
    </div>
  )
}
