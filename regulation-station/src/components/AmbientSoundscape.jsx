import { motion } from 'framer-motion'
import { TreePine, Waves, AudioLines, VolumeX } from 'lucide-react'
import { useAmbientEngine } from '../hooks/useAmbientEngine'

const SOUNDSCAPES = [
  { id: 'forest',   icon: TreePine,   label: 'Forest',   color: '#52b87e', bg: '#52b87e20' },
  { id: 'ocean',    icon: Waves,      label: 'Ocean',    color: '#3b82f6', bg: '#3b82f620' },
  { id: 'binaural', icon: AudioLines, label: 'Binaural', color: '#a855f7', bg: '#a855f720' },
  { id: 'silence',  icon: VolumeX,    label: 'Silence',  color: '#64748b', bg: 'transparent' },
]

export default function AmbientSoundscape({ isImmersive, stateData }) {
  const { activeId, select } = useAmbientEngine()

  if (!isImmersive) return null

  const isPlaying = activeId !== 'silence'

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
      <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-charcoal-500 mb-2">
        Ambient Soundscape
      </span>

      <div className="flex bg-[#0A0D14]/80 backdrop-blur-md rounded-full border border-[#22262f] p-1 shadow-2xl">
        {SOUNDSCAPES.map((scape) => {
          const isActive = activeId === scape.id
          const Icon = scape.icon

          return (
            <button
              key={scape.id}
              onClick={() => select(scape.id, stateData)}
              className="relative flex items-center justify-center w-12 h-10 rounded-full transition-all duration-300 group"
              style={{ backgroundColor: isActive ? scape.bg : 'transparent' }}
              title={scape.label}
            >
              <Icon
                size={16}
                color={isActive ? scape.color : '#64748b'}
                className={isActive && scape.id !== 'silence' && isPlaying ? 'opacity-0' : 'opacity-100 transition-opacity'}
              />

              {/* Animated waveform bars — only when actually playing */}
              {isActive && scape.id !== 'silence' && isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center gap-[2px]">
                  {[0.4, 0.8, 0.5, 0.9, 0.3].map((h, i) => (
                    <motion.div
                      key={i}
                      className="w-0.5 rounded-full"
                      style={{ backgroundColor: scape.color }}
                      animate={{ height: [`${h * 10}px`, `${(h * 10) + 8}px`, `${h * 10}px`] }}
                      transition={{
                        duration: 0.6 + (i * 0.1),
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
