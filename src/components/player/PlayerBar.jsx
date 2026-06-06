import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore } from '../../store/playerStore'
import { GENRE_GRADIENTS, fmtDuration } from '../../data/tracks'

export function PlayerBar() {
  const navigate = useNavigate()
  const {
    currentTrack, isPlaying, isPaused,
    currentTime, duration, volume,
    play, pause, next, prev, seek, setVolume,
    audioError,
  } = usePlayerStore()

  const [muted, setMuted] = useState(false)
  const [prevVol, setPrevVol] = useState(0.8)

  function togglePlayPause() {
    if (isPlaying) pause()
    else play()
  }

  function toggleMute() {
    if (muted) {
      setVolume(prevVol)
      setMuted(false)
    } else {
      setPrevVol(volume)
      setVolume(0)
      setMuted(true)
    }
  }

  const gradient = GENRE_GRADIENTS[currentTrack?.genre] || 'from-zinc-900 to-zinc-950'

  return (
    <AnimatePresence>
      {/* Audio error banner */}
      {audioError && (
        <motion.div
          key="audio-error"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          onClick={() => play()}
          style={{
            position: 'fixed', bottom: currentTrack ? 74 : 8, left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.4)',
            borderRadius: 8, padding: '8px 18px',
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--color-accent)', cursor: 'pointer', zIndex: 200,
            backdropFilter: 'blur(8px)',
          }}
        >
          ⚠ {audioError} — Click here to resume
        </motion.div>
      )}

      {(currentTrack) && (
        <motion.div
          initial={{ translateY: '100%' }}
          animate={{ translateY: 0 }}
          exit={{ translateY: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50"
          style={{
            height: 72,
            background: 'rgba(17,17,17,0.92)',
            backdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(0,229,255,0.12)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center h-full px-4 gap-4">

            {/* LEFT — Track info */}
            <div className="flex items-center gap-3 w-[30%] min-w-0">
              {/* Cover art circle */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
                style={{ boxShadow: '0 0 0 1px rgba(0,229,255,0.2)' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" opacity="0.4">
                  <circle cx="8" cy="8" r="7" fill="none" stroke="#f0ece0" strokeWidth="0.8" />
                  <circle cx="8" cy="8" r="4" fill="none" stroke="#f0ece0" strokeWidth="0.6" />
                  <circle cx="8" cy="8" r="1.5" fill="#ff2fd0" />
                </svg>
              </div>

              <div className="min-w-0">
                <p
                  className="truncate"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontSize: 13,
                    color: 'var(--color-text)',
                  }}
                >
                  {currentTrack?.title ?? 'No track'}
                </p>
                <p className="truncate text-xs" style={{ color: 'var(--color-muted)' }}>
                  {currentTrack?.artist ?? '—'}
                </p>
              </div>
            </div>

            {/* CENTER — Controls + progress */}
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              {/* Buttons */}
              <div className="flex items-center gap-4">
                <IconBtn onClick={prev} label="Previous">
                  <PrevIcon />
                </IconBtn>

                <button
                  onClick={togglePlayPause}
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    border: '1.5px solid var(--color-accent)',
                    background: 'transparent',
                    color: 'var(--color-accent)',
                    transition: 'transform 0.15s ease, background 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = 'rgba(0,229,255,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'transparent' }}
                >
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>

                <IconBtn onClick={next} label="Next">
                  <NextIcon />
                </IconBtn>
              </div>

              {/* Progress bar + times */}
              <div className="flex items-center gap-2 w-full max-w-sm">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                  {fmtDuration(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  step={0.5}
                  value={currentTime}
                  onChange={e => {
                    seek(Number(e.target.value))
                    // Auto-resume if was playing before scrub
                    if (!isPlaying && !isPaused) play()
                  }}
                  className="flex-1"
                  style={{
                    accentColor: 'var(--color-accent)',
                  }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                  {fmtDuration(duration)}
                </span>
              </div>
            </div>

            {/* RIGHT — Volume + nav */}
            <div className="flex items-center gap-3 w-[25%] justify-end">
              <IconBtn onClick={toggleMute} label={muted ? 'Unmute' : 'Mute'}>
                {muted ? <MuteIcon /> : <VolumeIcon />}
              </IconBtn>

              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                className="w-20 hidden sm:block"
                style={{ accentColor: 'var(--color-accent)' }}
              />

              <IconBtn onClick={() => navigate('/now-playing')} label="Now Playing">
                <GramIcon />
              </IconBtn>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function IconBtn({ onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="w-8 h-8 flex items-center justify-center rounded-full opacity-60 hover:opacity-100 transition-opacity"
      style={{ color: 'var(--color-text)' }}
    >
      {children}
    </button>
  )
}

function PlayIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.5l9 4.5-9 4.5V3.5z" /></svg>
}
function PauseIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3h2v10H5V3zm4 0h2v10H9V3z" /></svg>
}
function PrevIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 3h2v10H3V3zm2 5l8-5v10L5 8z" /></svg>
}
function NextIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11 3h2v10h-2V3zm-2 5L1 3v10l8-5z" /></svg>
}
function VolumeIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2.5L4 6H1v4h3l4 3.5V2.5zM11 5a4 4 0 010 6M13 3a7 7 0 010 10" stroke="currentColor" strokeWidth="1" fill="none" /><path d="M8 2.5L4 6H1v4h3l4 3.5V2.5z" /></svg>
}
function MuteIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2.5L4 6H1v4h3l4 3.5V2.5z" /><line x1="11" y1="6" x2="15" y2="10" stroke="currentColor" strokeWidth="1.5" /><line x1="15" y1="6" x2="11" y2="10" stroke="currentColor" strokeWidth="1.5" /></svg>
}
function GramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="10" r="5" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="8" cy="10" r="2" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="8" cy="10" r="0.8" fill="currentColor" />
      <path d="M8 5 C10 3 14 2 14 2" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  )
}
