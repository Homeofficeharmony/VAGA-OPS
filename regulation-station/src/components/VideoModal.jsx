import { useEffect } from 'react'
import { useBreathTimer } from '../hooks/useBreathTimer'
import VideoBackground from './VideoBackground'

export default function VideoModal({ open, stateId, resetTitle, onClose }) {
    // We use useBreathTimer internally to drive a front-and-center demo animation
    const { phase, progress } = useBreathTimer(open ? stateId : null)

    useEffect(() => {
        if (!open) return
        const handler = (e) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [open, onClose])

    if (!open) return null

    // Calculate size of the demo orb based on breath phase
    let scale = 1
    if (phase === 'inhale') {
        scale = 1 + progress * 0.5 // scale up to 1.5x
    } else if (phase === 'hold') {
        scale = 1.5
    } else if (phase === 'exhale') {
        scale = 1.5 - progress * 0.5 // scale down back to 1x
    }

    return (
        <div
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 backdrop-blur-md animate-fade-in"
            style={{ backgroundColor: 'rgba(9, 11, 15, 0.95)' }}
        >
            {/* Background layer for ambiance */}
            <div className="absolute inset-0 pointer-events-none opacity-50">
                <VideoBackground stateId={stateId} running={open} elapsedSec={10} totalSec={60} />
            </div>

            <div className="relative z-10 w-full max-w-2xl text-center">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <div className="text-left">
                        <h2 className="font-mono text-sm tracking-widest text-slate-300 uppercase mb-1">
                            DEMONSTRATION RUNNING
                        </h2>
                        <p className="text-xl font-bold text-slate-100">{resetTitle}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-charcoal-800 border border-charcoal-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-charcoal-700 transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Breathing Orb Demo */}
                <div className="h-64 flex flex-col items-center justify-center relative mb-12">
                    {/* Inner ring */}
                    <div
                        className="w-32 h-32 rounded-full border-2 border-slate-700 absolute transition-all duration-[50ms]"
                        style={{
                            transform: `scale(${scale})`,
                            boxShadow: phase === 'inhale' || phase === 'hold' ? '0 0 40px rgba(255,255,255,0.1)' : 'none'
                        }}
                    />
                    {/* Label matching phase */}
                    <div className="font-mono text-sm tracking-[0.2em] uppercase text-slate-200 z-10">
                        {phase}
                    </div>
                </div>

                {/* Caption */}
                <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                    Follow the expanding ring to inhale, hold steady if pausing, and follow it back down to exhale. Close this window to begin your timed 60-second protocol.
                </p>

                <button
                    onClick={onClose}
                    className="mt-12 font-mono text-[11px] font-semibold tracking-widest uppercase px-8 py-3 rounded-lg bg-charcoal-800 border border-charcoal-600 text-white hover:bg-charcoal-700 transition shadow-lg"
                >
                    Return to Reset
                </button>
            </div>
        </div>
    )
}
