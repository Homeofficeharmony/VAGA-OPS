import { useTheme } from '../context/ThemeContext'

const STATE_LABEL = {
  frozen: 'Dorsal vagal (shutdown)',
  anxious: 'Sympathetic (alert)',
  flow: 'Ventral vagal (flow)',
}

const STATE_COLOR = {
  frozen: '#c4604a',
  anxious: '#c8a040',
  flow: '#52b87e',
}

export default function StatusBar({ selectedState, onShortcutHelp }) {
  const { theme } = useTheme()
  const color = STATE_COLOR[selectedState] ?? '#52b87e'
  const label = STATE_LABEL[selectedState] ?? 'No state selected'
  const themeLabel = theme === 'dark' ? 'Dark theme' : theme === 'light' ? 'Light theme' : 'Pastel theme'

  return (
    <footer
      className="flex items-center justify-between"
      style={{
        height: '28px',
        backgroundColor: '#090d0a',
        borderTop: '1px solid #1e2b1f',
        padding: '0 24px',
        flexShrink: 0,
      }}
    >
      {/* Left — nervous system status */}
      <div className="flex items-center gap-3">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-[10px]" style={{ color: '#7a9b7c' }}>
          Nervous system: {label}
        </span>
      </div>

      {/* Center — connectivity + theme */}
      <div className="hidden sm:flex items-center gap-4">
        <span className="text-[10px]" style={{ color: '#4a6b4c' }}>
          Offline mode
        </span>
        <span className="text-[10px]" style={{ color: '#263024' }}>·</span>
        <span className="text-[10px]" style={{ color: '#4a6b4c' }}>
          {themeLabel}
        </span>
      </div>

      {/* Right — version + shortcuts */}
      <div className="flex items-center gap-2">
        <span
          className="font-mono text-[9px]"
          style={{ color: '#4a6b4c' }}
        >
          v1.0
        </span>
        <button
          onClick={onShortcutHelp}
          className="text-[10px] focus:outline-none"
          style={{ color: '#4a6b4c' }}
        >
          ? shortcuts
        </button>
      </div>
    </footer>
  )
}
