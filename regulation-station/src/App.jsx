import { useState, useEffect, useRef } from 'react'
import { STATES } from './data/stateData'
import { ThemeProvider } from './context/ThemeContext'
import Header from './components/Header'
import StateSelector from './components/StateSelector'
import StealthReset from './components/StealthReset'
import TaskFilter from './components/TaskFilter'
import AudioPlayer from './components/AudioPlayer'
import StatusBar from './components/StatusBar'
import PostResetCheckin from './components/PostResetCheckin'
import RuptureModal from './components/RuptureModal'
import FocusMode from './components/FocusMode'
import PanicButton from './components/PanicButton'
import PanicReset from './components/PanicReset'
import DailySummary from './components/DailySummary'
import StateAssist from './components/StateAssist'
import FlowLock from './components/FlowLock'
import { useSessionLog } from './hooks/useSessionLog'
import { useStreak } from './hooks/useStreak'
import HRVIndicator from './components/HRVIndicator'
import ShortcutHelp from './components/ShortcutHelp'
import TodayIntention from './components/TodayIntention'
import TeamPanel from './components/TeamPanel'
import StreakMilestone from './components/StreakMilestone'
import WeeklyConsistency from './components/WeeklyConsistency'
import WeeklyIntelligenceCard from './components/WeeklyIntelligenceCard'
import FirstVisitExperience from './components/FirstVisitExperience'
import TacticalAdvisor from './components/TacticalAdvisor'
import MissionControl from './components/MissionControl'
import RegulationDepthMeter from './components/RegulationDepthMeter'

// New Immersive Components
import ImmersionContainer from './components/ImmersionContainer'
import NeuralBackground from './components/NeuralBackground'
import ImmersionBackground from './components/ImmersionBackground'
import BreathingOrb from './components/BreathingOrb'
import VagusLogSidebar from './components/VagusLogSidebar'
import AmbientSoundscape from './components/AmbientSoundscape'
import { useAmbientEngine } from './hooks/useAmbientEngine'

export default function App() {
  const [selectedState, setSelectedState] = useState(null)
  const stateData = selectedState ? STATES[selectedState] : null

  // Wrap setSelectedState to auto-enter immersion when a state is selected
  const handleStateSelect = (state) => {
    setSelectedState(state)
    if (state) {
      setIsImmersive(true)
      setShowDashboard(false)
      setBreathCycles(0)
      // Auto-start ambient audio (needs user interaction first for Web Audio)
      const data = STATES[state]
      ambientEngine.autoStartForState?.(state, data)
    } else {
      setIsImmersive(false)
    }
  }

  const [ruptureOpen, setRuptureOpen] = useState(false)
  const [focusOpen, setFocusOpen] = useState(false)
  const [panicOpen, setPanicOpen] = useState(false)
  const [flowLockOpen, setFlowLockOpen] = useState(false)
  const [isImmersive, setIsImmersive] = useState(false)
  const [missionOpen, setMissionOpen] = useState(false)
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false)
  const [todayIntention, setTodayIntention] = useState('')

  // Auto-immersion: track whether user is in focused regulation vs dashboard
  const [showDashboard, setShowDashboard] = useState(false)
  const [breathCycles, setBreathCycles] = useState(0)

  // Unified checkin queue: { source: 'stealth'|'panic', accentHex, state }
  const [checkinPending, setCheckinPending] = useState(null)

  const [resetElapsed, setResetElapsed] = useState(0)
  const [resetRunning, setResetRunning] = useState(false)

  const { sessions, logSession } = useSessionLog()
  const { streak } = useStreak(sessions)
  const ambientEngine = useAmbientEngine()

  const [isFirstVisit, setIsFirstVisit] = useState(
    () => localStorage.getItem('vagaFirstVisitComplete') !== 'true'
  )

  const intervalRef = useRef(null)

  // Scroll lock while immersion mode is active
  useEffect(() => {
    document.body.style.overflow = isImmersive ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isImmersive])

  // Drive focus-mode timer when focusOpen and resetRunning
  useEffect(() => {
    if (resetRunning) {
      intervalRef.current = setInterval(() => {
        setResetElapsed((e) => {
          if (e >= 60) {
            clearInterval(intervalRef.current)
            setResetRunning(false)
            return 60
          }
          return e + 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [resetRunning])

  // Reset timer when state changes
  useEffect(() => {
    setResetRunning(false)
    setResetElapsed(0)
  }, [selectedState])

  const handleTogglePlay = () => {
    if (resetElapsed >= 60) {
      setResetElapsed(0)
      setResetRunning(true)
    } else {
      setResetRunning((r) => !r)
    }
  }

  const anyOverlayOpen = panicOpen || flowLockOpen || focusOpen

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      const mod = e.metaKey || e.ctrlKey

      // Cmd/Ctrl combos
      if (mod && e.shiftKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault()
        setPanicOpen(true)
        return
      }
      if (mod && e.key === '1') { e.preventDefault(); handleStateSelect('frozen'); return }
      if (mod && e.key === '2') { e.preventDefault(); handleStateSelect('anxious'); return }
      if (mod && e.key === '3') { e.preventDefault(); handleStateSelect('flow'); return }
      if (mod && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault()
        if (selectedState === 'flow') setFlowLockOpen((v) => !v)
        return
      }

      // Plain shortcuts (no modifier)
      if (mod) return
      if (e.key === '1') handleStateSelect('frozen')
      if (e.key === '2') handleStateSelect('anxious')
      if (e.key === '3') handleStateSelect('flow')
      if (e.key === 'r' || e.key === 'R') setRuptureOpen(true)
      if (e.key === 'i' || e.key === 'I') setIsImmersive(v => !v)
      if (e.key === 'm' || e.key === 'M') setMissionOpen(v => !v)
      if (e.key === 'f' || e.key === 'F') {
        if (stateData) setFocusOpen((v) => !v)
      }
      if (e.key === '?' || e.key === '/') {
        setShortcutHelpOpen(v => !v)
        return
      }
      if (e.key === 'Escape') {
        setRuptureOpen(false)
        setFocusOpen(false)
        setPanicOpen(false)
        setFlowLockOpen(false)
        setCheckinPending(null)
        setIsImmersive(false)
        setMissionOpen(false)
        setShortcutHelpOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [stateData, selectedState])

  if (isFirstVisit) {
    return (
      <ThemeProvider>
        <FirstVisitExperience
          onStateSelect={(s) => handleStateSelect(s)}
          onComplete={() => {
            localStorage.setItem('vagaFirstVisitComplete', 'true')
            setIsFirstVisit(false)
          }}
        />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <div
        className="min-h-screen font-sans relative transition-colors duration-1000"
        style={{
          backgroundColor: isImmersive ? 'transparent' : 'var(--bg-base)',
          color: 'var(--text-primary)'
        }}
        data-calm={selectedState === 'frozen' || selectedState === 'anxious' ? 'true' : undefined}
      >

        {/* Immersive Neural Background */}
        <NeuralBackground isImmersive={isImmersive} />
        {/* State-adaptive breath-synced pulse (z-[1], between neural bg and content) */}
        <ImmersionBackground isImmersive={isImmersive} selectedState={selectedState} />

        <div className={`relative z-10 transition-all duration-1000 ${isImmersive ? 'xl:pr-[17rem]' : ''}`}>
          <Header
            streak={streak}
            sessions={sessions}
            onRuptureClick={() => setRuptureOpen(true)}
            isImmersive={isImmersive}
            selectedState={selectedState}
            onToggleImmersive={() => setIsImmersive((v) => !v)}
            onShortcutHelp={() => setShortcutHelpOpen(v => !v)}
          />

          <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

            {/* Page title — hidden in immersion mode */}
            {!isImmersive && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-charcoal-400">
                    VAGA OPS
                  </span>
                  <span className="font-mono text-[11px] text-charcoal-700">·</span>
                  <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-charcoal-600">
                    Regulation Station
                  </span>
                </div>
                <p className="text-2xl font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                  Where are you right now?
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Biological state determines capacity. Identify, then regulate.
                </p>
              </div>
            )}

            {/* Today's Intention — daily ritual card */}
            {!isImmersive && (
              <TodayIntention onIntentionSet={setTodayIntention} />
            )}

            {/* State Assist — 2-question widget */}
            <StateAssist
              visible={!selectedState}
              onSelectState={handleStateSelect}
            />

            {/* Breathing Orb + Depth Meter — core regulation experience */}
            <BreathingOrb
              isImmersive={isImmersive}
              stateData={stateData}
              onCycleComplete={() => setBreathCycles(c => c + 1)}
            />
            {isImmersive && stateData && (
              <div className="flex flex-col items-center mb-6 z-20 relative">
                <RegulationDepthMeter
                  cycles={breathCycles}
                  accentHex={stateData.accentHex}
                />
                {/* Dashboard toggle */}
                <button
                  onClick={() => setShowDashboard(d => !d)}
                  className="mt-4 font-mono text-[9px] tracking-widest uppercase transition-colors duration-200"
                  style={{ color: `${stateData.accentHex}50` }}
                  onMouseEnter={e => { e.currentTarget.style.color = stateData.accentHex }}
                  onMouseLeave={e => { e.currentTarget.style.color = `${stateData.accentHex}50` }}
                >
                  {showDashboard ? '← Back to breathing' : 'View dashboard →'}
                </button>
              </div>
            )}

            {/* State selector — always visible */}
            <div className={`mb-4 relative z-20 transition-all duration-1000 ${isImmersive && stateData ? 'opacity-30 hover:opacity-100' : 'opacity-100'}`}>
              <StateSelector selected={selectedState} onSelect={handleStateSelect} isImmersive={isImmersive} />
            </div>

            {/* Mission Control trigger — hidden in immersion mode */}
            {!isImmersive && (
              <button
                onClick={() => setMissionOpen(true)}
                className="w-full mb-4 py-2.5 px-4 rounded-2xl font-mono text-[10px] tracking-[0.24em] uppercase focus:outline-none transition-all duration-200 flex items-center justify-between"
                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-panel)', color: 'var(--text-muted)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#52b87e40'
                  e.currentTarget.style.color = '#52b87e'
                  e.currentTarget.style.backgroundColor = '#52b87e07'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.color = 'var(--text-muted)'
                  e.currentTarget.style.backgroundColor = 'var(--bg-panel)'
                }}
              >
                <span>⊙ Mission Control</span>
                <span style={{ opacity: 0.5 }}>M</span>
              </button>
            )}

            {/* Operational noise — hidden in immersion mode (unless dashboard toggled) */}
            {(!isImmersive || showDashboard) && (
              <div>
                <DailySummary sessions={sessions} />

                {/* Tactical Advisor — rule-based session pattern alerts */}
                <TacticalAdvisor
                  sessions={sessions}
                  onAction={(action) => {
                    if (action === 'immersion') {
                      if (selectedState) setIsImmersive(true)
                    } else if (action === 'panic') {
                      setPanicOpen(true)
                    } else if (action === 'flow') {
                      handleStateSelect('flow')
                    }
                  }}
                />

                {sessions.length > 0 && (
                  <div className="mb-4">
                    <WeeklyConsistency sessions={sessions} />
                  </div>
                )}

                <div className="mb-4">
                  <HRVIndicator selectedState={selectedState} onAcceptSuggestion={handleStateSelect} />
                </div>
              </div>
            )}

            {/* Status bar */}
            {stateData && (
              <div className="mb-8 relative z-20">
                <StatusBar selectedState={selectedState} stateData={stateData} />
              </div>
            )}

            {/* Empty state */}
            {!stateData && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div
                  className="w-14 h-14 rounded-full border-2 border-dashed border-charcoal-600 flex items-center justify-center mb-4 animate-pulse relative z-20"
                >
                  <div className="w-2 h-2 rounded-full bg-charcoal-600" />
                </div>
                <p className="font-mono text-[11px] tracking-widest uppercase text-charcoal-500">
                  Pick how you're feeling right now to begin
                </p>
              </div>
            )}

            {/* Dashboard grid — centered single column in immersion mode */}
            {stateData && (!isImmersive || showDashboard) && (
              <div className={`relative z-20 transition-all duration-700 ${isImmersive ? 'flex justify-center' : 'grid grid-cols-1 lg:grid-cols-5 gap-6'}`}>

                {/* Protocol column — full width centred in immersion */}
                <div className={isImmersive ? 'w-full max-w-xl space-y-6' : 'lg:col-span-3 space-y-6'}>
                  {/* Focus / Flow Lock buttons — hidden in immersion */}
                  {!isImmersive && (<div className="flex justify-end gap-2">
                    <button
                      onClick={() => setFocusOpen(true)}
                      className="font-mono text-[10px] tracking-widest uppercase px-4 py-2 rounded-lg border transition-all duration-200"
                      style={{
                        borderColor: stateData.accentHex + '50',
                        color: stateData.accentHex,
                        backgroundColor: stateData.accentHex + '0d',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = stateData.accentHex + '1a' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = stateData.accentHex + '0d' }}
                    >
                      ⊡ FOCUS
                    </button>
                    {selectedState === 'flow' && (
                      <button
                        onClick={() => setFlowLockOpen(true)}
                        className="font-mono text-[10px] tracking-widest uppercase px-4 py-2 rounded-lg border transition-all duration-200"
                        style={{
                          borderColor: stateData.accentHex + '80',
                          color: stateData.accentHex,
                          backgroundColor: stateData.accentHex + '18',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = stateData.accentHex + '28' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = stateData.accentHex + '18' }}
                        title="Enter 90-minute deep work session (Cmd+F)"
                      >
                        ⊞ FLOW LOCK
                      </button>
                    )}
                  </div>
                  )}

                  <StealthReset
                    stateData={stateData}
                    onComplete={({ activationBefore = null, startedAt = null } = {}) => setCheckinPending({
                      source: 'stealth',
                      accentHex: stateData.accentHex,
                      state: selectedState,
                      activationBefore,
                      startedAt,
                      protocolUsed: stateData.reset.id,
                    })}
                  />
                  {/* Task list — hidden in immersion to keep focus on protocol */}
                  {!isImmersive && <TaskFilter stateData={stateData} />}
                </div>

                {!isImmersive && (
                  <div className="lg:col-span-2">
                    <AudioPlayer stateData={stateData} />
                  </div>
                )}
              </div>
            )}

            {/* Team panel, weekly intelligence, footer — hidden in immersion */}
            {(!isImmersive || showDashboard) && (
              <>
                <div className="mt-8">
                  <TeamPanel />
                </div>

                <div className="mt-6">
                  <WeeklyIntelligenceCard sessions={sessions} />
                </div>
              </>
            )}

            {/* Footer — hidden in immersion */}
            {(!isImmersive || showDashboard) && (
              <footer className="mt-16 pt-6 border-t border-charcoal-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded overflow-hidden flex-shrink-0">
                    <img
                      src="/vaga-ops-logo.jpg"
                      alt=""
                      className="w-full h-full object-cover"
                      style={{ objectPosition: '50% 45%', transform: 'scale(1.6)' }}
                    />
                  </div>
                  <div className="font-mono text-[10px] tracking-widest uppercase text-charcoal-600 space-x-4">
                    <span>VAGA OPS · Nervous System Ops Pack · v1.0</span>
                    <button
                      onClick={() => setShortcutHelpOpen(true)}
                      className="underline hover:text-charcoal-400 text-charcoal-700 transition"
                    >
                      View keyboard shortcuts
                    </button>
                  </div>
                </div>
                <div className="font-mono text-[10px] tracking-widest uppercase text-charcoal-600">
                  Polyvagal Theory · Somatic Reset Protocols
                </div>
              </footer>
            )}
          </main>
        </div> {/* End of .relative.z-10 wrapper */}

        {/* Floating elements tied to Immersive Mode */}
        <VagusLogSidebar isImmersive={isImmersive} streak={streak} sessions={sessions} />
        <AmbientSoundscape isImmersive={isImmersive} stateData={stateData} engine={ambientEngine} />

        {/* ── Fixed overlays ───────────────────────────────────── */}

        {/* Mission Control — z-[60], above ImmersionContainer (z-[55]) */}
        <MissionControl
          open={missionOpen}
          ambientEngine={ambientEngine}
          onMissionComplete={({ missionId, totalElapsed, completedPhases }) => {
            logSession({
              state: 'flow',
              type: 'stealth',
              resetCompleted: completedPhases > 0,
              protocolUsed: missionId,
              durationSec: totalElapsed,
              flowMinutes: Math.round(totalElapsed / 60),
              outcome: null,
              shift: null,
            })
          }}
          onClose={() => setMissionOpen(false)}
        />

        {/* Guided Immersion Container — 3-phase regulated experience */}
        <ImmersionContainer
          open={isImmersive}
          stateData={stateData}
          ambientEngine={ambientEngine}
          onComplete={({ activationAfter, notes, startedAt, resetCompleted }) => {
            logSession({
              state: selectedState,
              type: 'stealth',
              resetCompleted,
              activationBefore: null,
              activationAfter: activationAfter ?? null,
              activationDelta: null,
              startedAt,
              protocolUsed: stateData?.reset?.id ?? null,
              outcome: null,
              shift: null,
              flowMinutes: selectedState === 'flow' ? 2 : 0,
            })
            setIsImmersive(false)
          }}
          onClose={() => setIsImmersive(false)}
        />

        {/* Panic Button — always visible unless a full-screen overlay is open */}
        <PanicButton
          onOpen={() => setPanicOpen(true)}
          accentHex={stateData?.accentHex}
          hidden={anyOverlayOpen}
        />

        {/* Panic Reset — 30-sec breath overlay */}
        <PanicReset
          open={panicOpen}
          accentHex={stateData?.accentHex}
          onComplete={({ activationBefore = null, startedAt = null } = {}) => {
            setPanicOpen(false)
            setCheckinPending({
              source: 'panic',
              accentHex: stateData?.accentHex ?? '#52b87e',
              state: selectedState,
              activationBefore,
              startedAt,
              protocolUsed: 'emergency-reset',
            })
          }}
          onClose={() => setPanicOpen(false)}
        />

        {/* Flow Lock — 90-min deep work overlay */}
        {selectedState === 'flow' && stateData && (
          <FlowLock
            open={flowLockOpen}
            accentHex={stateData.accentHex}
            todayIntention={todayIntention}
            onComplete={(flowMinutes) => {
              setFlowLockOpen(false)
              if (flowMinutes > 0) {
                logSession({ state: 'flow', type: 'flow', flowMinutes, resetCompleted: false })
              }
            }}
            onClose={() => setFlowLockOpen(false)}
          />
        )}

        {/* FocusMode — existing 60-sec overlay */}
        {stateData && (
          <FocusMode
            open={focusOpen}
            stateData={stateData}
            elapsed={resetElapsed}
            running={resetRunning}
            onTogglePlay={handleTogglePlay}
            onExit={() => setFocusOpen(false)}
          />
        )}

        {/* Unified PostResetCheckin */}
        {checkinPending && (
          <PostResetCheckin
            accentHex={checkinPending.accentHex}
            source={checkinPending.source}
            onRate={({ outcome, shift, activationAfter }) => {
              logSession({
                state: checkinPending.state,
                type: checkinPending.source,
                durationSec: checkinPending.source === 'panic' ? 30 : 60,
                resetCompleted: true,
                outcome,
                shift,
                activationBefore: checkinPending.activationBefore ?? null,
                activationAfter: activationAfter ?? null,
                startedAt: checkinPending.startedAt ?? null,
                protocolUsed: checkinPending.protocolUsed ?? null,
              })
              setCheckinPending(null)
            }}
          />
        )}

        <RuptureModal
          open={ruptureOpen}
          onClose={() => setRuptureOpen(false)}
          onEmergencyReset={() => {
            setRuptureOpen(false)
            setSelectedState('anxious')
            setPanicOpen(true)
          }}
        />
        <ShortcutHelp open={shortcutHelpOpen} onClose={() => setShortcutHelpOpen(false)} />
        <StreakMilestone streak={streak} />

      </div>
    </ThemeProvider>
  )
}
