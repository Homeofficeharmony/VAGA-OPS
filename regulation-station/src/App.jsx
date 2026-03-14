import { useState, useEffect, useRef } from 'react'
import { STATES } from './data/stateData'
import { ThemeProvider } from './context/ThemeContext'

// Layout
import Header from './components/Header'
import BottomNav from './components/BottomNav'

// Pages
import StateSelectorPage from './components/StateSelectorPage'
import BreathePage from './components/BreathePage'
import ListenPage from './components/ListenPage'
import HistoryPage from './components/HistoryPage'
import TasksPage from './components/TasksPage'

// Overlays
import PostResetCheckin from './components/PostResetCheckin'
import RuptureModal from './components/RuptureModal'
import FocusMode from './components/FocusMode'
import PanicButton from './components/PanicButton'
import PanicReset from './components/PanicReset'
import FlowLock from './components/FlowLock'
import ShortcutHelp from './components/ShortcutHelp'
import StreakMilestone from './components/StreakMilestone'
import MissionControl from './components/MissionControl'

// Immersive mode
import ImmersionContainer from './components/ImmersionContainer'
import NeuralBackground from './components/NeuralBackground'
import ImmersionBackground from './components/ImmersionBackground'
import AmbientSoundscape from './components/AmbientSoundscape'

// Onboarding
import FirstVisitExperience from './components/FirstVisitExperience'

import { useSessionLog, getDailyStats } from './hooks/useSessionLog'
import { useStreak } from './hooks/useStreak'
import { useAmbientEngine } from './hooks/useAmbientEngine'

export default function App() {
  const [selectedState, setSelectedState] = useState(
    () => localStorage.getItem('vaga-last-state') || null
  )
  const stateData = selectedState ? STATES[selectedState] : null

  const [activePage, setActivePage] = useState(() => {
    const lastState = localStorage.getItem('vaga-last-state')
    return lastState ? 'breathe' : 'state-select'
  })

  const handleStateSelect = (state) => {
    setSelectedState(state)
    if (state) {
      localStorage.setItem('vaga-last-state', state)
      setActivePage('breathe')
      const data = STATES[state]
      ambientEngine.autoStartForState?.(state, data)
    } else {
      localStorage.removeItem('vaga-last-state')
      setActivePage('state-select')
    }
  }

  const [stateWash, setStateWash] = useState(false)
  const prevStateRef = useRef(null)
  useEffect(() => {
    if (selectedState && prevStateRef.current && selectedState !== prevStateRef.current) {
      setStateWash(true)
      setTimeout(() => setStateWash(false), 550)
    }
    prevStateRef.current = selectedState
  }, [selectedState])

  const [ruptureOpen, setRuptureOpen] = useState(false)
  const [focusOpen, setFocusOpen] = useState(false)
  const [panicOpen, setPanicOpen] = useState(false)
  const [flowLockOpen, setFlowLockOpen] = useState(false)
  const [isImmersive, setIsImmersive] = useState(false)
  const [ambientMode, setAmbientMode] = useState(false)
  const [missionOpen, setMissionOpen] = useState(false)
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false)
  const [todayIntention] = useState('')

  const [breathPhase, setBreathPhase] = useState('inhale')
  useEffect(() => {
    if (!isImmersive) setBreathPhase('inhale')
  }, [isImmersive])

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

  // Scroll lock while immersion is active
  useEffect(() => {
    document.body.style.overflow = isImmersive ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isImmersive])

  useEffect(() => {
    if (isImmersive) setAmbientMode(false)
  }, [isImmersive])

  // Focus-mode timer
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

  const handleAmbientToggle = () => {
    if (!selectedState) return
    const next = !ambientMode
    setAmbientMode(next)
    if (next) {
      ambientEngine.autoStartForState?.(selectedState, stateData)
    } else {
      ambientEngine.select?.('silence')
    }
  }

  const anyOverlayOpen = panicOpen || flowLockOpen || focusOpen

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      const mod = e.metaKey || e.ctrlKey

      if (mod && e.shiftKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault(); setPanicOpen(true); return
      }
      if (mod && e.key === '1') { e.preventDefault(); handleStateSelect('frozen'); return }
      if (mod && e.key === '2') { e.preventDefault(); handleStateSelect('anxious'); return }
      if (mod && e.key === '3') { e.preventDefault(); handleStateSelect('flow'); return }
      if (mod && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault()
        if (selectedState === 'flow') setFlowLockOpen((v) => !v)
        return
      }

      if (mod) return
      if (e.key === '1') handleStateSelect('frozen')
      if (e.key === '2') handleStateSelect('anxious')
      if (e.key === '3') handleStateSelect('flow')
      if (e.key === 'a' || e.key === 'A') handleAmbientToggle()
      if (e.key === 'r' || e.key === 'R') setRuptureOpen(true)
      if (e.key === 'i' || e.key === 'I') { if (selectedState) setIsImmersive((v) => !v) }
      if (e.key === 'm' || e.key === 'M') setMissionOpen((v) => !v)
      if (e.key === 'f' || e.key === 'F') {
        if (stateData) setFocusOpen((v) => !v)
      }
      if (e.key === '?' || e.key === '/') {
        setShortcutHelpOpen((v) => !v); return
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateData, selectedState, ambientMode])

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
        className="h-screen flex flex-col font-sans relative transition-colors duration-1000"
        style={{
          backgroundColor: isImmersive ? 'transparent' : 'var(--bg-base)',
          color: 'var(--text-primary)',
          overflow: 'hidden',
          '--current-state-color': stateData ? stateData.accentHex : 'transparent',
          '--theme-accent': stateData ? stateData.accentHex : 'var(--text-muted)',
        }}
        data-calm={selectedState === 'frozen' || selectedState === 'anxious' ? 'true' : undefined}
      >
        {/* Ambient backgrounds */}
        <NeuralBackground
          isImmersive={isImmersive}
          ambientMode={ambientMode}
          selectedState={selectedState}
          breathPhase={breathPhase}
        />
        <ImmersionBackground isImmersive={isImmersive} selectedState={selectedState} />

        {/* ═══ NORMAL MODE ═══ */}
        {!isImmersive && (
          <>
            <Header
              onShortcutHelp={() => setShortcutHelpOpen((v) => !v)}
              accentHex={stateData?.accentHex ?? '#52b87e'}
            />

            {/* Scrollable page area */}
            <div
              className="flex-1 overflow-y-auto scrollbar-thin"
              style={{ backgroundColor: 'var(--bg-base)' }}
            >
              {activePage === 'state-select' && (
                <StateSelectorPage
                  selected={selectedState}
                  onSelect={handleStateSelect}
                />
              )}

              {activePage === 'breathe' && (
                <BreathePage
                  stateData={stateData}
                  stateKey={selectedState}
                  onBeginReset={() => { if (selectedState) setIsImmersive(true) }}
                  onPanicReset={() => setPanicOpen(true)}
                  onChangeState={() => setActivePage('state-select')}
                  onOpenMission={() => setMissionOpen(true)}
                  onFlowLock={() => setFlowLockOpen(true)}
                  todayResets={getDailyStats(sessions).resetCount}
                />
              )}

              {activePage === 'listen' && (
                <ListenPage
                  stateData={stateData}
                  ambientEngine={ambientEngine}
                  onSelectState={() => setActivePage('state-select')}
                />
              )}

              {activePage === 'tasks' && (
                <TasksPage stateData={stateData} />
              )}

              {activePage === 'history' && (
                <HistoryPage sessions={sessions} streak={streak} />
              )}
            </div>

            {/* Bottom Nav */}
            <BottomNav
              activePage={activePage}
              onNavigate={setActivePage}
              stateData={stateData}
              hasState={!!selectedState}
              onNeedsState={() => setActivePage('state-select')}
            />
          </>
        )}

        {/* ═══ Ambient soundscape (persistent across pages) ═══ */}
        <AmbientSoundscape isImmersive={isImmersive} stateData={stateData} engine={ambientEngine} />

        {/* ═══ Fixed overlays ═══ */}
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

        <ImmersionContainer
          open={isImmersive}
          stateData={stateData}
          ambientEngine={ambientEngine}
          onBreathPhaseChange={setBreathPhase}
          onComplete={({ activationAfter, startedAt, resetCompleted }) => {
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

        {/* Panic Button — visible on all non-immersive pages */}
        {!isImmersive && (
          <PanicButton
            onOpen={() => setPanicOpen(true)}
            accentHex={stateData?.accentHex}
            hidden={anyOverlayOpen}
          />
        )}

        {/* Page overlays */}
        {!isImmersive && (
          <>
            <PanicReset
              open={panicOpen}
              accentHex={stateData?.accentHex}
              onComplete={() => {
                setPanicOpen(false)
                setTimeout(() => {
                  setCheckinPending({
                    source: 'panic',
                    accentHex: stateData?.accentHex ?? '#52b87e',
                    state: selectedState,
                    activationBefore: null,
                    startedAt: null,
                    protocolUsed: 'emergency-reset',
                  })
                }, 1500)
              }}
              onClose={() => setPanicOpen(false)}
            />

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

            {checkinPending && (
              <PostResetCheckin
                accentHex={checkinPending.accentHex}
                source={checkinPending.source}
                activationBefore={checkinPending.activationBefore}
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
          </>
        )}

        {/* State transition color wash */}
        {stateWash && stateData && (
          <div
            className="fixed inset-0 pointer-events-none z-[300] state-wash"
            style={{ background: stateData.accentHex }}
          />
        )}
      </div>
    </ThemeProvider>
  )
}
