import { useHRV } from '../hooks/useHRV'

const STATE_LABELS = { frozen: 'Frozen', anxious: 'Anxious', flow: 'Flow' }
const STATE_ACCENT = { frozen: '#ff3d5a', anxious: '#ffb800', flow: '#00ff88' }

function BluetoothIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M 12 2 L 12 22" />
      <path d="M 5 7 L 19 17" />
      <path d="M 5 17 L 19 7" />
    </svg>
  )
}

export default function HRVIndicator({ selectedState, onAcceptSuggestion }) {
  const { connected, connecting, hr, rmssd, suggestedState, connect, disconnect } = useHRV()

  // Keep UI clean — return null until user explicitly connects or a suggestion exists
  if (!connected && !connecting && !suggestedState) return null

  const showSuggestion = suggestedState && suggestedState !== selectedState
  const suggestionAccent = showSuggestion ? STATE_ACCENT[suggestedState] : null

  return (
    <div className="bg-[#111318] border border-[#22262f] rounded-xl px-4 py-2.5 flex items-center gap-4">
      {/* Left side */}
      <div className="flex items-center gap-2">
        <BluetoothIcon />

        {!connected && !connecting && (
          <button
            onClick={connect}
            className="font-mono text-[10px] tracking-widest uppercase border rounded px-2 py-0.5"
            style={{ color: '#00ff88', borderColor: '#00ff8830' }}
          >
            Connect HRM
          </button>
        )}

        {connecting && (
          <div className="flex items-center gap-1.5">
            <div className="animate-spin border-t-2 border-[#00ff88] w-3 h-3 rounded-full" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-slate-400">
              Connecting...
            </span>
          </div>
        )}

        {connected && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse inline-block" />
            <span className="font-mono text-xs text-slate-300">
              HR: {hr} bpm
            </span>
          </div>
        )}
      </div>

      {/* Middle — HRV readout */}
      {connected && rmssd !== null && (
        <div className="flex items-center gap-2">
          <span className="text-slate-700 select-none">|</span>
          <span className="font-mono text-xs text-slate-400">
            HRV: {rmssd}ms
          </span>
        </div>
      )}

      {/* Right — suggestion pill + accept */}
      {showSuggestion && (
        <div className="flex items-center gap-2 ml-auto">
          <span
            className="font-mono text-[10px] tracking-widest uppercase border rounded-full px-2 py-0.5"
            style={{ color: suggestionAccent, borderColor: suggestionAccent + '55' }}
          >
            HRV &rarr; {STATE_LABELS[suggestedState]}
          </span>
          <button
            onClick={() => onAcceptSuggestion(suggestedState)}
            className="font-mono text-[10px] tracking-widest uppercase border rounded px-2 py-0.5"
            style={{ color: '#00ff88', borderColor: '#00ff8830' }}
          >
            Accept
          </button>
        </div>
      )}

      {/* Disconnect × button */}
      {connected && (
        <button
          onClick={disconnect}
          className="ml-auto text-slate-600 hover:text-slate-400 text-sm leading-none font-mono"
          aria-label="Disconnect heart rate monitor"
        >
          &times;
        </button>
      )}
    </div>
  )
}
