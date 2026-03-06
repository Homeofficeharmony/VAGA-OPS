import { useTheme } from '../context/ThemeContext'

const THEMES = [
  { key: 'dark',   icon: '🌑', label: 'Dark'   },
  { key: 'light',  icon: '☀️',  label: 'Light'  },
  { key: 'pastel', icon: '🌿', label: 'Pastel' },
]

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div
      className="flex items-center rounded-md overflow-hidden"
      style={{ border: '1px solid var(--border)' }}
    >
      {THEMES.map(({ key, icon, label }, i) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          title={label}
          className="font-mono text-[11px] px-2 py-1 transition-all duration-200"
          style={{
            background: theme === key
              ? 'color-mix(in srgb, var(--accent-flow) 18%, transparent)'
              : 'var(--bg-panel)',
            color: theme === key ? 'var(--accent-flow)' : 'var(--text-muted)',
            borderRight: i < THEMES.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}