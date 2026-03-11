export default function CompletionBurst({ accentHex, onComplete }) {
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[56] flex items-center justify-center pointer-events-none"
    >
      <div
        onAnimationEnd={onComplete}
        style={{
          width: 160,
          height: 160,
          borderRadius: '50%',
          border: `2px solid ${accentHex}`,
          boxShadow: `0 0 60px ${accentHex}60, inset 0 0 40px ${accentHex}20`,
          animation: 'completion-burst 1.2s ease-out forwards',
        }}
      />
    </div>
  )
}
