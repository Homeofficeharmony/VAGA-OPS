import { useTheme } from '../context/ThemeContext'

const THEMES = [
  { key: 'dark',   icon: '🌑', label: 'Dark'   },
  { key: 'light',  icon: '☀️',  label: 'Light'  },
  { key: 'pastel', icon: '🌿', label: 'Pastel' },
]

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const current = THEMES.find(t => t.key === theme) ?? THEMES[0]
  const nextIndex = (THEMES.findIndex(t => t.key === theme) + 1) % THEMES.length
  const next = THEMES[nextIndex]

  return (
    <button
      onClick={() => setTheme(next.key)}
      title={`Switch to ${next.label}`}
      className="flex items-center justify-center rounded-full transition-all duration-200"
      style={{
        width: '72px',
        height: '30px',
        backgroundColor: '#161d15',
        border: '1px solid #263024',
        color: '#7a9b7c',
        fontSize: '11px',
        fontWeight: 500,
        fontFamily: 'Inter, sans-serif',
        gap: '4px',
      }}
    >
      {current.icon} {current.label}
    </button>
  )
}
