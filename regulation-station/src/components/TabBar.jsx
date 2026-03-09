import { motion } from 'framer-motion'

const TABS = [
    { id: 'regulate', label: 'Regulate', icon: '◉' },
    { id: 'insights', label: 'Insights', icon: '◐' },
    { id: 'tools', label: 'Tools', icon: '◎' },
]

export default function TabBar({ activeTab, onTabChange, accentHex, hidden }) {
    if (hidden) return null

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center"
            style={{
                backgroundColor: 'var(--bg-base)',
                borderTop: '1px solid var(--border)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
            }}
        >
            <div className="flex items-center w-full max-w-md">
                {TABS.map(tab => {
                    const isActive = activeTab === tab.id
                    const color = isActive ? (accentHex || '#52b87e') : 'var(--text-muted)'

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className="flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-200 focus:outline-none"
                            style={{ color }}
                        >
                            <span
                                className="text-lg transition-transform duration-200"
                                style={{ transform: isActive ? 'scale(1.15)' : 'scale(1)' }}
                            >
                                {tab.icon}
                            </span>
                            <span
                                className="font-mono text-[9px] tracking-widest uppercase transition-opacity duration-200"
                                style={{ opacity: isActive ? 1 : 0.6 }}
                            >
                                {tab.label}
                            </span>
                            {/* Active indicator dot */}
                            <motion.div
                                animate={{ opacity: isActive ? 1 : 0, scaleX: isActive ? 1 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="h-[2px] w-5 rounded-full mt-0.5"
                                style={{ backgroundColor: color }}
                            />
                        </button>
                    )
                })}
            </div>
        </nav>
    )
}
