export default function PanicButton({ onOpen, accentHex, hidden }) {
  if (hidden) return null

  const color = accentHex ?? '#52b87e'

  return (
    <>
      <style>{`
        @keyframes panicPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
      `}</style>
      <button
        onClick={onOpen}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full font-mono text-[11px] tracking-widest uppercase font-semibold transition-colors duration-200"
        style={{
          backgroundColor: color + '15',
          border: `1px solid ${color}50`,
          color,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          animation: 'panicPulse 1.5s ease-in-out infinite',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = color + '28'
          e.currentTarget.style.boxShadow = `0 0 16px ${color}30`
          e.currentTarget.style.borderColor = color + '90'
          e.currentTarget.style.animationPlayState = 'paused'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = color + '15'
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.borderColor = color + '50'
          e.currentTarget.style.animationPlayState = 'running'
        }}
        title="30-second nervous system reset (Cmd+Shift+R)"
      >
        <span>⚡</span>
        <span>Breathe</span>
      </button>
    </>
  )
}
