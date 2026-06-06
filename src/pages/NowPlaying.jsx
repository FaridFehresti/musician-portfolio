import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore } from '../store/playerStore'
import { useAudioAnalyser } from '../hooks/useAudioAnalyser'
import { WaveformVisualizer } from '../components/player/WaveformVisualizer'
import { CoverLightbox } from '../components/ui/CoverLightbox'
import { HoloVinylCard } from '../components/vinyl/HoloVinylCard'
import { useBreakpoint } from '../hooks/useViewport'
import { fmtDuration } from '../data/tracks'

export default function NowPlaying() {
  const bp = useBreakpoint()
  const SLEEVE = bp === 'mobile' ? 230 : bp === 'tablet' ? 300 : 340
  const {
    currentTrack, isPlaying, isPaused,
    currentTime, duration, howl, volume,
    play, pause, next, prev, seek, setVolume,
    queue, queueIndex, loadTrack,
  } = usePlayerStore()

  const { averageBass } = useAudioAnalyser(howl)
  const [lightbox, setLightbox] = useState(false)
  const [prevVol, setPrevVol] = useState(0.8)

  function toggleMute() {
    if (volume === 0) { setVolume(prevVol || 0.8) }
    else { setPrevVol(volume); setVolume(0) }
  }

  const hasTrack = !!currentTrack
  const progress = hasTrack && duration > 0 ? currentTime / duration : 0
  const glowAlpha = 0.08 + (averageBass / 255) * 0.2

  function togglePlay() {
    if (isPlaying) pause()
    else play()
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center relative"
      style={{ background: 'var(--color-bg)', paddingTop: 88, paddingBottom: 130 }}
    >
      {/* Ambient groove BG */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.05 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 600, repeat: Infinity, ease: 'linear' }}
          style={{ width: 900, height: 900 }}
        >
          <svg viewBox="0 0 900 900">
            {[420, 380, 340, 300, 260, 220, 180, 140, 100].map(r => (
              <circle key={r} cx="450" cy="450" r={r} fill="none" stroke="color-mix(in srgb, var(--accent-2) 60%, transparent)" strokeWidth="0.8" />
            ))}
          </svg>
        </motion.div>
      </div>

      {/* Bass-reactive spotlight */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 55% 45% at 50% 38%, color-mix(in srgb, var(--accent) ${(glowAlpha * 100).toFixed(1)}%, transparent) 0%, transparent 68%)`,
          transition: 'background 0.1s ease',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-2xl px-4">

        {/* ── BIG holographic card ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'relative' }}
        >
          <HoloVinylCard
            variant="big"
            size={SLEEVE}
            diskEnabled={bp !== 'mobile'}
            track={currentTrack}
            active={hasTrack}
            playing={isPlaying}
            paused={isPaused}
            glowStrength={averageBass / 255}
            showInfo={false}
            showPlayButton={false}
            holoIntensity={1.1}
            onClick={currentTrack?.coverArt ? () => setLightbox(true) : undefined}
            onCoverZoom={currentTrack?.coverArt ? () => setLightbox(true) : undefined}
          />
        </motion.div>

        {/* ── Track info ────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTrack?.id || 'empty'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            {currentTrack ? (
              <>
                <h1 style={{
                  fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 900,
                  fontSize: 'clamp(28px, 5vw, 54px)', color: 'var(--color-text)',
                  marginBottom: 8, lineHeight: 1.1,
                }}>
                  {currentTrack.title}
                </h1>
                <p style={{ color: 'var(--color-muted)', fontSize: 13, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
                  {currentTrack.artist}
                  <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
                  {currentTrack.genre}
                  <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
                  {currentTrack.bpm} BPM
                </p>
              </>
            ) : (
              <p style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22 }}>
                Select a track to play
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Progress bar ──────────────────────────────────────────── */}
        <div className="w-full flex flex-col gap-2">
          <div
            style={{ position: 'relative', height: 4, borderRadius: 2, background: 'color-mix(in srgb, var(--text) 10%, transparent)', cursor: 'pointer' }}
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect()
              const ratio = (e.clientX - rect.left) / rect.width
              seek(ratio * (duration || 0))
            }}
          >
            <motion.div
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.4, ease: 'linear' }}
              style={{ height: '100%', borderRadius: 2, background: 'var(--neon-magenta)', boxShadow: '0 0 10px var(--glow-magenta)' }}
            />
            <div style={{
              position: 'absolute', top: '50%', left: `${progress * 100}%`,
              transform: 'translate(-50%, -50%)', width: 12, height: 12, borderRadius: '50%',
              background: 'var(--neon-magenta)', boxShadow: '0 0 8px var(--glow-magenta)',
              transition: 'left 0.4s linear',
            }} />
          </div>
          <div className="flex justify-between">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)' }}>{fmtDuration(currentTime)}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)' }}>{fmtDuration(duration)}</span>
          </div>
        </div>

        {/* ── Controls ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-8 w-full">
          <CtrlBtn onClick={prev}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M3 3h2v10H3V3zm2 5l8-5v10L5 8z" /></svg>
          </CtrlBtn>

          <motion.button
            onClick={togglePlay}
            whileHover={{ scale: 1.08, backgroundColor: 'color-mix(in srgb, var(--accent) 24%, transparent)' }}
            whileTap={{ scale: 0.94 }}
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
            style={{
              border: '2px solid var(--neon-magenta)',
              background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
              color: 'var(--neon-magenta)',
              cursor: 'pointer',
              boxShadow: isPlaying ? '0 0 24px var(--glow-magenta)' : 'none',
              transition: 'box-shadow 0.3s',
            }}
          >
            {isPlaying
              ? <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3h2v10H5V3zm4 0h2v10H9V3z" /></svg>
              : <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor" style={{ marginLeft: 3 }}><path d="M5 3.5l9 4.5-9 4.5V3.5z" /></svg>}
          </motion.button>

          <CtrlBtn onClick={next}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M11 3h2v10h-2V3zm-2 5L1 3v10l8-5z" /></svg>
          </CtrlBtn>
        </div>

        {/* ── Volume ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 w-full max-w-xs">
          <button
            onClick={toggleMute}
            aria-label={volume === 0 ? 'Unmute' : 'Mute'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', flexShrink: 0 }}
          >
            {volume === 0
              ? <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2.5L4 6H1v4h3l4 3.5V2.5z" /><line x1="11" y1="6" x2="15" y2="10" stroke="currentColor" strokeWidth="1.5" /><line x1="15" y1="6" x2="11" y2="10" stroke="currentColor" strokeWidth="1.5" /></svg>
              : <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2.5L4 6H1v4h3l4 3.5V2.5z" /><path d="M11 5a4 4 0 010 6M13 3a7 7 0 010 10" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" /></svg>}
          </button>
          <input
            type="range" min={0} max={1} step={0.02} value={volume}
            onChange={e => setVolume(Number(e.target.value))}
            className="flex-1" aria-label="Volume"
            style={{ accentColor: 'var(--neon-magenta)' }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)', minWidth: 30, textAlign: 'right' }}>
            {Math.round(volume * 100)}
          </span>
        </div>

        {/* ── Waveform ──────────────────────────────────────────────── */}
        <div className="w-full rounded-xl overflow-hidden" style={{ background: 'var(--color-surface)', padding: '14px 16px' }}>
          <WaveformVisualizer />
        </div>

        {/* ── Queue ─────────────────────────────────────────────────── */}
        <QueueList queue={queue} queueIndex={queueIndex} loadTrack={loadTrack} />
      </div>

      {/* Cover lightbox */}
      <AnimatePresence>
        {lightbox && currentTrack && (
          <CoverLightbox src={currentTrack.coverArt} title={currentTrack.title} onClose={() => setLightbox(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Control button ──────────────────────────────────────────────── */
function CtrlBtn({ onClick, children }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.15, opacity: 1 }}
      whileTap={{ scale: 0.9 }}
      style={{
        width: 44, height: 44, borderRadius: '50%',
        background: 'transparent', border: 'none',
        color: 'var(--color-text)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: 0.6,
      }}
    >
      {children}
    </motion.button>
  )
}

/* ─── Queue list ──────────────────────────────────────────────────── */
function QueueList({ queue, queueIndex, loadTrack }) {
  const upcoming = queue.slice(queueIndex + 1, queueIndex + 6)
  if (!upcoming.length) return null

  return (
    <div className="w-full">
      <p className="mb-3" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        Up Next
      </p>
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid color-mix(in srgb, var(--accent-2) 14%, transparent)' }}>
        {upcoming.map((track, i) => (
          <button
            key={track.id}
            onClick={() => loadTrack(track)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
            style={{
              borderBottom: i < upcoming.length - 1 ? '1px solid color-mix(in srgb, var(--text) 5%, transparent)' : 'none',
              background: 'transparent', cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 6%, transparent)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', minWidth: 22 }}>
              {String(queueIndex + 2 + i).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0">
              <p className="truncate" style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--color-text)' }}>{track.title}</p>
              <p className="truncate" style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>{track.genre}</p>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)' }}>{fmtDuration(track.duration)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
