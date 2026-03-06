export default function NeuralBackground({ isImmersive }) {
  if (!isImmersive) return null
  // Minimal dark base — no animations, no visual noise
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ backgroundColor: 'var(--bg-base)' }}
    />
  )
}
