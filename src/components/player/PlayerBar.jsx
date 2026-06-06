import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore } from '../../store/playerStore'
import { GENRE_GRADIENTS, fmtDuration } from '../../data/tracks'

export function PlayerBar() {
  const navigate = useNavigate()
  const {
    currentTrack, isPlaying, currentTime, duration, volume,
    play, pause, next, prev, seek, setVolume, audioError,
  } = usePlayerStore()

  const [muted, setMuted] = useState(false)
  const [prevVol, setPrevVol] = useState(0.8)

  function togglePlayPause() { if (isPlaying) pause(); else play() }
  function toggleMute() {
    if (muted) { setVolume(prevVol); setMuted(false) }
    else { setPrevVol(volume); setVolume(0); setMuted(true) }
  }
  function openNowPlaying() { navigate('/now-playing') }

  const grad = GENRE_GRADIENTS[currentTrack?.genre] || ['#2a0533', '#10031a']
  const progress = duration > 0 ? currentTime / duration : 0

  return (
    <AnimatePresence>
      {audioError && (
        <motion.div
          key="audio-error"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          onClick={() => play()}
          style={{
            position: 'fixed', bottom: currentTrack ? 86 : 12, left: '50%', transform: 'translateX(-50%)',
            background: 'color-mix(in srgb, var(--accent-2) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-2) 40%, transparent)',
            borderRadius: 8, padding: '8px 18px', fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--neon-cyan)', cursor: 'pointer', zIndex: 200, backdropFilter: 'blur(8px)',
          }}
        >
          ⚠ {audioError} — Click here to resume
        </motion.div>
      )}

      {currentTrack && (
        <motion.div
          initial={{ translateY: '100%' }}
          animate={{ translateY: 0 }}
          exit={{ translateY: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50"
          style={{
            height: 76,
            background: 'color-mix(in srgb, var(--surface) 94%, transparent)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            borderTop: '1px solid color-mix(in srgb, var(--accent-2) 22%, transparent)',
          }}
        >
          {/* Full-width seek bar along the top edge */}
          <SeekBar progress={progress} duration={duration} onSeek={seek} />

          <div className="grid items-center h-full px-3 sm:px-5 gap-2" style={{ gridTemplateColumns: '1fr auto 1fr' }}>

            {/* LEFT — cover + title, click anywhere → Now Playing */}
            <button
              onClick={openNowPlaying}
              title="Open Now Playing"
              className="flex items-center gap-3 min-w-0 rounded-lg py-1 pr-2"
              style={{ background: 'transparent', cursor: 'pointer', transition: 'background 0.15s', justifySelf: 'start' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div
                className="relative flex-shrink-0"
                style={{
                  width: 50, height: 50, borderRadius: 8, overflow: 'hidden',
                  boxShadow: isPlaying
                    ? '0 0 0 1.5px var(--neon-magenta), 0 0 14px var(--glow-magenta)'
                    : '0 0 0 1px rgba(255,255,255,0.14)',
                }}
              >
                {currentTrack.coverArt
                  ? <img src={currentTrack.coverArt} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})` }} />}
              </div>

              <div className="min-w-0 text-left">
                <p className="truncate" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: 14, color: 'var(--color-text)', lineHeight: 1.2 }}>
                  {currentTrack.title}
                </p>
                <p className="truncate" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)', letterSpacing: '0.04em' }}>
                  {currentTrack.artist}{currentTrack.genre ? ` · ${currentTrack.genre}` : ''}
                </p>
              </div>
            </button>

            {/* CENTER — transport + time */}
            <div className="flex flex-col items-center gap-1" style={{ justifySelf: 'center' }}>
              <div className="flex items-center gap-4 sm:gap-6">
                <CtrlIcon onClick={prev} label="Previous"><PrevIcon /></CtrlIcon>
                <motion.button
                  onClick={togglePlayPause}
                  whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  style={{
                    width: 46, height: 46, borderRadius: '50%', border: 'none',
                    background: 'var(--neon-magenta)', color: 'var(--on-accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 18px var(--glow-magenta)', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  {isPlaying
                    ? <svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor"><path d="M4 3h3v10H4zm5 0h3v10H9z" /></svg>
                    : <svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor" style={{ marginLeft: 2 }}><path d="M4 3l9 5-9 5V3z" /></svg>}
                </motion.button>
                <CtrlIcon onClick={next} label="Next"><NextIcon /></CtrlIcon>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', letterSpacing: '0.04em' }}>
                {fmtDuration(currentTime)} / {fmtDuration(duration)}
              </span>
            </div>

            {/* RIGHT — volume + expand (mute always visible; slider on md+) */}
            <div className="flex items-center gap-2 sm:gap-3" style={{ justifySelf: 'end' }}>
              <CtrlIcon onClick={toggleMute} label={muted || volume === 0 ? 'Unmute' : 'Mute'}>
                {muted || volume === 0 ? <MuteIcon /> : <VolumeIcon />}
              </CtrlIcon>
              <input
                type="range" min={0} max={1} step={0.02} value={volume}
                onChange={e => { setVolume(Number(e.target.value)); setMuted(false) }}
                className="w-20 hidden md:block" aria-label="Volume"
                style={{ accentColor: 'var(--neon-magenta)' }}
              />
              <CtrlIcon onClick={openNowPlaying} label="Open Now Playing"><ExpandIcon /></CtrlIcon>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ─── Full-width seek bar (top edge) ──────────────────────────────── */
function SeekBar({ progress, duration, onSeek }) {
  return (
    <div
      className="group absolute top-0 left-0 right-0"
      style={{ height: 10, cursor: 'pointer' }}
      onClick={e => {
        const r = e.currentTarget.getBoundingClientRect()
        onSeek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * (duration || 0))
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'color-mix(in srgb, var(--text) 12%, transparent)' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, height: 3, width: `${progress * 100}%`, background: 'var(--neon-magenta)', boxShadow: '0 0 8px var(--glow-magenta)' }} />
      <div
        className="opacity-0 group-hover:opacity-100"
        style={{ position: 'absolute', top: -3, left: `${progress * 100}%`, transform: 'translateX(-50%)', width: 10, height: 10, borderRadius: '50%', background: 'var(--neon-magenta)', boxShadow: '0 0 8px var(--glow-magenta)', transition: 'opacity 0.15s' }}
      />
    </div>
  )
}

/* ─── Control icon button ─────────────────────────────────────────── */
function CtrlIcon({ onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex items-center justify-center rounded-full flex-shrink-0"
      style={{ width: 36, height: 36, color: 'var(--color-text)', opacity: 0.85, cursor: 'pointer', transition: 'color 0.15s, opacity 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--neon-cyan)'; e.currentTarget.style.opacity = '1' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.opacity = '0.85' }}
    >
      {children}
    </button>
  )
}

function PrevIcon() { return <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M4 3h2v10H4V3zm2 5l7-5v10L6 8z" /></svg> }
function NextIcon() { return <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M10 3h2v10h-2V3zm-2 5L1 3v10l7-5z" /></svg> }
function VolumeIcon() { return <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2.5L4 6H1v4h3l4 3.5V2.5z" /><path d="M11 5a4 4 0 010 6M13 3a7 7 0 010 10" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" /></svg> }
function MuteIcon() { return <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2.5L4 6H1v4h3l4 3.5V2.5z" /><line x1="11" y1="6" x2="15" y2="10" stroke="currentColor" strokeWidth="1.5" /><line x1="15" y1="6" x2="11" y2="10" stroke="currentColor" strokeWidth="1.5" /></svg> }
function ExpandIcon() { return <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10l4-4 4 4" /></svg> }
