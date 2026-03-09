import { useState, useEffect, useRef } from 'react'
import { useAudioEngine } from '../hooks/useAudioEngine'
import LissajousVisualizer from './LissajousVisualizer'

const accentColor = {
  red: '#c4604a',
  amber: '#c8a040',
  green: '#52b87e',
}

const GRAIN_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.09'/%3E%3C/svg%3E")`

// Animated eq bars — used in track identity
function EqBars({ playing, color }) {
  const heights = [0.55, 0.9, 0.7, 0.45, 0.8]
  const delays = ['0s', '0.2s', '0.35s', '0.15s', '0.5s']
  return (
    <div className="flex items-end gap-[3px]" style={{ height: 20 }}>
      {heights.map((h, i) => (
        <div
          key={i}
          style={{
            width: 3,
            borderRadius: 2,
            backgroundColor: color,
            height: playing ? `${h * 100}%` : '22%',
            transition: playing ? 'none' : 'height 0.4s ease',
            animation: playing ? `pulse ${[0.55, 0.38, 0.7, 0.48, 0.6][i]}s ease-in-out ${delays[i]} infinite alternate` : 'none',
          }}
        />
      ))}
    </div>
  )
}

export default function AudioPlayer({ stateData }) {
  const { audio, accent } = stateData
  const color = accentColor[accent]

  const [activeTrack, setActiveTrack] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)

  const track = audio.tracks[activeTrack]

  const { playing, play, pause, volume, setVolume, supported } =
    useAudioEngine({ carrierHz: track.carrierHz, beatHz: track.beatHz })

  useEffect(() => {
    setActiveTrack(0)
    setElapsed(0)
  }, [stateData.id])

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [playing])

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const totalMin = parseInt(track.duration)
  const totalSec = totalMin * 60
  const progressPct = Math.min(elapsed / totalSec, 1)

  const handleTrackSelect = (i) => {
    if (playing) pause()
    setActiveTrack(i)
    setElapsed(0)
  }

  const handleScrub = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setElapsed(Math.floor(pct * totalSec))
  }

  const handleToggle = () => (playing ? pause() : play())

  return (
    <section>
      {/* Hz badge */}
      <div className="flex items-center justify-end gap-3 mb-3">
        <span
          className="font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 rounded border"
          style={{ color, borderColor: color + '50', backgroundColor: color + '10' }}
        >
          {audio.hz}
        </span>
      </div>

      {/* ── PANEL ── */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          border: `1px solid ${color}22`,
          background: `radial-gradient(ellipse at 50% 0%, ${color}0e 0%, transparent 55%), var(--bg-panel)`,
        }}
      >
        {/* Grain overlay across whole panel */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: GRAIN_BG,
            backgroundSize: '160px 160px',
            opacity: 0.4,
            mixBlendMode: 'overlay',
          }}
        />

        {/* ── TIER 1 — Track Identity ── */}
        <div className="relative px-5 pt-5 pb-4">
          {/* Hz badge + headphones notice */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full"
                style={{ color, border: `1px solid ${color}35`, backgroundColor: `${color}10` }}
              >
                {track.carrierHz} Hz · {track.carrierHz + track.beatHz} Hz
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {!supported && (
                <span className="text-[10px] text-ered font-mono">No Web Audio</span>
              )}
              <span className="text-[11px] leading-none" title="Stereo headphones required">🎧</span>
            </div>
          </div>

          {/* Track name + EQ bars */}
          <div className="flex items-center gap-3 mb-1">
            <div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                border: `1px solid ${color}30`,
                background: `radial-gradient(circle, ${color}18 0%, ${color}06 100%)`,
              }}
            >
              <EqBars playing={playing} color={color} />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="font-semibold leading-tight truncate"
                style={{ color: 'var(--text-primary)', fontSize: '16px', letterSpacing: '-0.015em' }}
              >
                {track.label}
              </div>
              <div className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {audio.title}
              </div>
            </div>
          </div>

          {/* Description — one atmospheric line */}
          <p
            className="text-[11px] leading-relaxed pl-[52px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {audio.description}
          </p>
        </div>

        {/* ── TIER 2 — Visualizer + Controls ── */}
        <div className="relative">
          {/* Visualizer container — dark atmosphere with accent bloom */}
          <div
            className="relative mx-0 overflow-hidden"
            style={{
              background: `radial-gradient(ellipse at 50% 60%, ${color}12 0%, #080b0a 55%, #060908 100%)`,
              borderTop: `1px solid ${color}18`,
              borderBottom: `1px solid ${color}18`,
            }}
          >
            <LissajousVisualizer
              playing={playing}
              carrierHz={track.carrierHz}
              beatHz={track.beatHz}
              color={color}
            />
            {/* Vignette — fades canvas edges to match panel */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow: 'inset 0 0 40px rgba(6,9,8,0.75)',
              }}
            />
            {/* L / R channel labels overlaid on visualizer corners */}
            <div
              className="absolute bottom-2.5 left-3 font-mono text-[9px] tracking-[0.25em] uppercase"
              style={{ color: color + '70' }}
            >
              L · {track.carrierHz} Hz
            </div>
            <div
              className="absolute bottom-2.5 right-3 font-mono text-[9px] tracking-[0.25em] uppercase text-right"
              style={{ color: color + '70' }}
            >
              {track.carrierHz + track.beatHz} Hz · R
            </div>
            {/* Playing indicator */}
            {playing && (
              <div
                className="absolute top-2.5 right-3 flex items-center gap-1.5"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse-slow"
                  style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
                />
                <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: color + '90' }}>
                  Live
                </span>
              </div>
            )}
          </div>

          {/* Controls area */}
          <div className="px-5 py-4">
            {/* Progress bar */}
            <div className="mb-4">
              <div
                className="relative h-0.5 rounded-full mb-1.5 cursor-pointer group"
                style={{ backgroundColor: color + '20' }}
                onClick={handleScrub}
              >
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${progressPct * 100}%`,
                    background: `linear-gradient(90deg, ${color}80, ${color})`,
                  }}
                />
                {/* Scrub thumb */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    left: `${progressPct * 100}%`,
                    marginLeft: '-6px',
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}`,
                  }}
                />
              </div>
              <div
                className="flex justify-between font-mono text-[10px]"
                style={{ color: 'var(--text-muted)' }}
              >
                <span>{fmt(elapsed)}</span>
                <span>{track.duration}</span>
              </div>
            </div>

            {/* Transport controls */}
            <div className="flex items-center justify-center gap-8 mb-4">
              <button
                onClick={() => setElapsed(Math.max(0, elapsed - 15))}
                className="font-mono text-[11px] tracking-wider transition-colors focus:outline-none"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                −15s
              </button>

              {/* Play / Pause — layered glow rings when active */}
              <div className="relative flex items-center justify-center">
                {playing && (
                  <div
                    className="absolute w-16 h-16 rounded-full animate-pulse-slow pointer-events-none"
                    style={{
                      border: `1px solid ${color}30`,
                      boxShadow: `0 0 0 4px ${color}08`,
                    }}
                  />
                )}
                <button
                  onClick={handleToggle}
                  disabled={!supported}
                  className="relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none disabled:opacity-30"
                  style={{
                    border: `1.5px solid ${color}`,
                    backgroundColor: playing ? color : `${color}10`,
                    boxShadow: playing
                      ? `0 0 28px ${color}45, 0 0 60px ${color}18`
                      : `0 0 12px ${color}15`,
                    transition: 'all 0.3s cubic-bezier(0.34, 1.4, 0.64, 1)',
                  }}
                >
                  {playing ? (
                    <div className="flex gap-1.5">
                      <div className="w-[3px] h-4 rounded-full" style={{ backgroundColor: 'var(--bg-base)' }} />
                      <div className="w-[3px] h-4 rounded-full" style={{ backgroundColor: 'var(--bg-base)' }} />
                    </div>
                  ) : (
                    <div
                      className="ml-0.5"
                      style={{
                        width: 0, height: 0,
                        borderTop: '7px solid transparent',
                        borderBottom: '7px solid transparent',
                        borderLeft: `11px solid ${color}`,
                      }}
                    />
                  )}
                </button>
              </div>

              <button
                onClick={() => setElapsed(Math.min(totalSec, elapsed + 15))}
                className="font-mono text-[11px] tracking-wider transition-colors focus:outline-none"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                +15s
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase" style={{ color: 'var(--text-muted)', width: 24 }}>
                Vol
              </span>
              <div
                className="flex-1 relative h-0.5 rounded-full cursor-pointer group"
                style={{ backgroundColor: color + '20' }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)))
                }}
              >
                <div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    width: `${volume * 100}%`,
                    background: `linear-gradient(90deg, ${color}50, ${color}90)`,
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `${volume * 100}%`, marginLeft: '-5px', backgroundColor: color }}
                />
              </div>
              <span
                className="font-mono text-[10px] tabular-nums text-right"
                style={{ color: 'var(--text-muted)', width: 24 }}
              >
                {Math.round(volume * 100)}
              </span>
            </div>
          </div>
        </div>

        {/* ── TIER 3 — Queue ── */}
        <div
          className="relative px-5 pb-5"
          style={{ borderTop: `1px solid ${color}14` }}
        >
          <div
            className="font-mono text-[9px] tracking-[0.28em] uppercase pt-4 pb-2.5"
            style={{ color: 'var(--text-muted)' }}
          >
            Queue
          </div>
          <div className="flex flex-col gap-1.5">
            {audio.tracks.map((t, i) => {
              const isActive = i === activeTrack
              return (
                <button
                  key={i}
                  onClick={() => handleTrackSelect(i)}
                  className="w-full text-left focus:outline-none group/track transition-all duration-200"
                  style={{
                    borderRadius: i === 0 ? '12px 18px 12px 12px' : i === 1 ? '12px 12px 18px 12px' : '18px 12px 12px 18px',
                    transition: 'transform 0.25s ease',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.transform = 'scale(1.01)' }}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div
                    style={{
                      borderRadius: 'inherit',
                      border: `1px solid ${isActive ? color + '40' : color + '12'}`,
                      background: isActive
                        ? `radial-gradient(ellipse at 15% 50%, ${color}16 0%, transparent 65%), var(--bg-panel-alt)`
                        : 'transparent',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      transition: 'all 0.25s ease',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = color + '28'
                        e.currentTarget.style.background = `radial-gradient(ellipse at 15% 50%, ${color}0a 0%, transparent 65%), transparent`
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = color + '12'
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    {/* State indicator */}
                    <div className="flex-shrink-0 w-4 flex items-center justify-center">
                      {isActive && playing ? (
                        <EqBars playing color={color} />
                      ) : (
                        <span
                          className="block w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: isActive ? color : color + '30',
                            boxShadow: isActive ? `0 0 5px ${color}80` : 'none',
                          }}
                        />
                      )}
                    </div>

                    {/* Track name */}
                    <span
                      className="flex-1 text-xs font-medium truncate"
                      style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}
                    >
                      {t.label}
                    </span>

                    {/* Mood tag */}
                    {t.mood && (
                      <span
                        className="font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{
                          color: isActive ? color : color + '50',
                          backgroundColor: isActive ? color + '12' : 'transparent',
                        }}
                      >
                        {t.mood}
                      </span>
                    )}

                    {/* Duration */}
                    <span
                      className="font-mono text-[10px] flex-shrink-0"
                      style={{ color: isActive ? color + 'aa' : 'var(--text-muted)' }}
                    >
                      {t.duration}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
