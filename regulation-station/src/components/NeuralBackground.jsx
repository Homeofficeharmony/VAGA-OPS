import ParticleField from './ParticleField'

export default function NeuralBackground({
  isImmersive,
  ambientMode = false,
  selectedState,
  breathPhase = 'inhale',
}) {
  if (!isImmersive && !ambientMode) return null
  if (!selectedState) return null

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <ParticleField selectedState={selectedState} breathPhase={breathPhase} />
    </div>
  )
}
