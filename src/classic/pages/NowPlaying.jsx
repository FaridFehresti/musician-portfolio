import { useState, useMemo, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore } from '../../store/playerStore'
import { useFavoritesStore } from '../../store/favoritesStore'
import { useAudioAnalyser } from '../../hooks/useAudioAnalyser'
import { CoverLightbox } from '../components/ui/CoverLightbox'
import { ShareButton } from '../components/ui/ShareButton'
import { HoloVinylCard } from '../components/vinyl/HoloVinylCard'
import { LightningStrike } from '../components/vinyl/LightningStrike'
import { EmberDrift } from '../components/vinyl/effects/EmberDrift'
import { PulseRings } from '../components/vinyl/effects/PulseRings'
import { CometOrbit } from '../components/vinyl/effects/CometOrbit'
import { DeckCard, CARD_W, CARD_H } from '../components/library/DeckCard'
import { useBreakpoint } from '../../hooks/useViewport'
import { fmtDuration } from '../../data/tracks'
import { useContentStore } from '../../store/contentStore'
import { VisualizerBackground } from '../components/visualizer/VisualizerBackground'

export default function NowPlaying() {
  const bp = useBreakpoint()
  const SLEEVE = bp === 'mobile' ? 200 : bp === 'tablet' ? 300 : 340
  const {
    currentTrack, isPlaying, isPaused,
    currentTime, duration, howl, volume,
    play, pause, next, prev, seek, setVolume, setQueue, loadTrack,
    shuffle, repeat, toggleShuffle, cycleRepeat,
  } = usePlayerStore()
  const allTracks = useContentStore(s => s.tracks)
  // CMS switches for the card effects (Branding panel). Lightning predates
  // the setting, so undefined counts as ON; the newer effects are opt-in.
  const lightningOn = useContentStore(s => s.site?.npLightning !== false)
  const embersOn = useContentStore(s => s.site?.npEmbers === true)
  const pulseOn = useContentStore(s => s.site?.npPulse === true)
  const orbitOn = useContentStore(s => s.site?.npOrbit === true)

  const { averageBass } = useAudioAnalyser(howl)
  const [lightbox, setLightbox] = useState(false)
  const [prevVol, setPrevVol] = useState(0.8)
  // The lightning's impact jolt is applied imperatively to this wrapper —
  // a dedicated element so it never fights framer-motion's transforms.
  const joltRef = useRef(null)

  // Audio-reactive galaxy background. `vizOn` is the user's keep/hide choice
  // (persisted); `vizFull` expands it to a fullscreen visualizer.
  const [vizOn, setVizOn] = useState(() => {
    try { return localStorage.getItem('np-viz') !== 'off' } catch { return true }
  })
  const [vizFull, setVizFull] = useState(false)
  useEffect(() => {
    try { localStorage.setItem('np-viz', vizOn ? 'on' : 'off') } catch { /* ignore */ }
  }, [vizOn])
  useEffect(() => {
    if (!vizFull) return
    const onKey = (e) => { if (e.key === 'Escape') setVizFull(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [vizFull])

  function toggleMute() {
    if (volume === 0) { setVolume(prevVol || 0.8) }
    else { setPrevVol(volume); setVolume(0) }
  }

  const hasTrack = !!currentTrack
  const progress = hasTrack && duration > 0 ? currentTime / duration : 0
  const glowAlpha = 0.08 + (averageBass / 255) * 0.2

  function togglePlay() {
    if (currentTrack) {
      if (isPlaying) pause()
      else play()
      return
    }
    // Nothing selected yet → select the first song and play it.
    const library = allTracks.filter(t => t.inLibrary !== false)
    if (library.length) {
      setQueue(library)
      loadTrack(library[0])   // loadTrack autoplays by default
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center relative"
      style={{ background: 'var(--color-bg)', paddingTop: 88, paddingBottom: 130 }}
    >
      {/* ── Background: the audio-reactive galaxy, or the original groove ──
          The WebGL galaxy is desktop/tablet only — too heavy for mobile GPUs,
          and it sits behind the swipe carousel there. Mobile falls back to the
          cheap CSS ambient groove. */}
      {vizOn && bp !== 'mobile' ? (
        <>
          <div style={{
            position: 'fixed', inset: 0,
            zIndex: vizFull ? 9999 : 0,
            pointerEvents: vizFull ? 'auto' : 'none',
            background: '#000',
          }}>
            <VisualizerBackground interactive={vizFull} />
          </div>
          {/* readability "layer" — a scrim over the galaxy so the UI stays legible
              (only in background mode; fullscreen shows the pure visualizer) */}
          {!vizFull && (
            <div aria-hidden style={{
              position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
              background: 'linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.2) 24%, rgba(0,0,0,0.24) 62%, rgba(0,0,0,0.68) 100%)',
            }} />
          )}
        </>
      ) : (
        <>
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
        </>
      )}

      {/* ── Visualizer controls: hide/show + fullscreen (desktop/tablet only) ── */}
      {!vizFull && bp !== 'mobile' && (
        <VizControls vizOn={vizOn} onToggle={() => setVizOn(v => !v)} onFull={() => setVizFull(true)} />
      )}

      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-2xl px-4">

        {/* ── BIG holographic card ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'relative' }}
        >
          <div ref={joltRef} style={{ position: 'relative', zIndex: 1, willChange: 'transform, filter' }}>
            <HoloVinylCard
              variant="big"
              size={SLEEVE}
              diskEnabled
              diskReach={bp === 'mobile' ? 0.32 : 0.5}
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
              overlay={
                /* Effect layers — they ride INSIDE the card's transform
                   chain so border-hugging visuals move with the card.
                   Each is its own canvas; the CMS toggles them. */
                <>
                  {lightningOn && (
                    <LightningStrike
                      size={SLEEVE}
                      playing={isPlaying}
                      howl={howl}
                      targetRef={joltRef}
                      lite={bp === 'mobile'}
                      diskReach={bp === 'mobile' ? 0.32 : 0.5}
                    />
                  )}
                  {embersOn && (
                    <EmberDrift
                      size={SLEEVE}
                      playing={isPlaying}
                      howl={howl}
                      lite={bp === 'mobile'}
                      diskReach={bp === 'mobile' ? 0.32 : 0.5}
                    />
                  )}
                  {pulseOn && (
                    <PulseRings
                      size={SLEEVE}
                      playing={isPlaying}
                      howl={howl}
                      lite={bp === 'mobile'}
                      diskReach={bp === 'mobile' ? 0.32 : 0.5}
                    />
                  )}
                  {orbitOn && (
                    <CometOrbit
                      size={SLEEVE}
                      playing={isPlaying}
                      howl={howl}
                      lite={bp === 'mobile'}
                      diskReach={bp === 'mobile' ? 0.32 : 0.5}
                    />
                  )}
                </>
              }
            />
          </div>
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
                </p>
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                  <ShareButton track={currentTrack} label="Share track" title="Share this track" />
                </div>
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
        <div className="flex items-center justify-center gap-5 sm:gap-7 w-full">
          <ModeBtn active={shuffle} onClick={toggleShuffle} title="Shuffle">
            <ShuffleSvg />
          </ModeBtn>

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

          <ModeBtn active={repeat !== 'off'} onClick={cycleRepeat} title={`Repeat: ${repeat}`}>
            {repeat === 'one' ? <RepeatOneSvg /> : <RepeatSvg />}
          </ModeBtn>
        </div>

        {/* ── Volume ────────────────────────────────────────────────── */}
        <div
          className="w-full"
          style={{
            display: 'flex', alignItems: 'center', gap: 14, maxWidth: 380,
            padding: '11px 18px', borderRadius: 999,
            background: 'color-mix(in srgb, var(--color-surface) 90%, transparent)',
            border: '1px solid color-mix(in srgb, var(--text) 10%, transparent)',
          }}
        >
          <button
            onClick={toggleMute}
            aria-label={volume === 0 ? 'Unmute' : 'Mute'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: volume === 0 ? 'var(--color-muted)' : 'var(--neon-magenta)', display: 'flex', flexShrink: 0 }}
          >
            {volume === 0
              ? <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2.5L4 6H1v4h3l4 3.5V2.5z" /><line x1="11" y1="6" x2="15" y2="10" stroke="currentColor" strokeWidth="1.5" /><line x1="15" y1="6" x2="11" y2="10" stroke="currentColor" strokeWidth="1.5" /></svg>
              : <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2.5L4 6H1v4h3l4 3.5V2.5z" /><path d="M11 5a4 4 0 010 6M13 3a7 7 0 010 10" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" /></svg>}
          </button>
          <input
            type="range" min={0} max={1} step={0.01} value={volume}
            onChange={e => setVolume(Number(e.target.value))}
            className="vol-slider" aria-label="Volume"
            style={{ flex: 1, '--pct': `${Math.round(volume * 100)}%` }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text)', minWidth: 38, textAlign: 'right' }}>
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* ── Suggestions deck (the music cards) ────────────────────── */}
        <QueueDeckMemo />
      </div>

      {/* ── Fullscreen visualizer chrome (over the interactive canvas) ── */}
      {vizFull && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none' }}>
          <div aria-hidden style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 220px 50px rgba(0,0,0,0.7)' }} />

          {/* top bar: title + close */}
          <div style={{ position: 'absolute', top: 20, left: 24, right: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 800, fontSize: 22, color: 'var(--color-text)', lineHeight: 1.1, textShadow: '0 0 30px var(--glow-magenta)' }}>
                {currentTrack ? currentTrack.title : 'Resonance'}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-muted)', marginTop: 4 }}>
                {currentTrack ? currentTrack.artist : 'Audio-reactive'}
              </p>
            </div>
            <button onClick={() => setVizFull(false)} aria-label="Exit fullscreen" title="Exit fullscreen (Esc)" style={{ ...iconBtnStyle, pointerEvents: 'auto' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" {...M_STROKE}><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>

          {/* bottom transport */}
          <div style={{ position: 'absolute', bottom: 34, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 18, pointerEvents: 'auto', padding: '10px 18px', borderRadius: 999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', border: '1px solid color-mix(in srgb, var(--text) 10%, transparent)' }}>
            <CtrlBtn onClick={prev}>
              <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M3 3h2v10H3V3zm2 5l8-5v10L5 8z" /></svg>
            </CtrlBtn>
            <button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'} style={{
              width: 58, height: 58, borderRadius: '50%', cursor: 'pointer',
              border: '2px solid var(--neon-magenta)',
              background: isPlaying ? 'var(--neon-magenta)' : 'color-mix(in srgb, var(--neon-magenta) 14%, transparent)',
              color: isPlaying ? 'var(--on-accent)' : 'var(--neon-magenta)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isPlaying ? '0 0 24px var(--glow-magenta)' : 'none',
            }}>
              {isPlaying
                ? <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3h2v10H5V3zm4 0h2v10H9V3z" /></svg>
                : <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" style={{ marginLeft: 3 }}><path d="M5 3.5l9 4.5-9 4.5V3.5z" /></svg>}
            </button>
            <CtrlBtn onClick={next}>
              <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M11 3h2v10h-2V3zm-2 5L1 3v10l8-5z" /></svg>
            </CtrlBtn>
          </div>
        </div>
      )}

      {/* Cover lightbox */}
      <AnimatePresence>
        {lightbox && currentTrack && (
          <CoverLightbox src={currentTrack.coverArt} title={currentTrack.title} onClose={() => setLightbox(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Visualizer controls: hide/show toggle + fullscreen ──────────────── */
const iconBtnStyle = {
  width: 40, height: 40, borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: 'var(--color-text)',
  background: 'color-mix(in srgb, var(--color-surface) 92%, transparent)',
  border: '1px solid color-mix(in srgb, var(--text) 12%, transparent)',
}

function VizControls({ vizOn, onToggle, onFull }) {
  return (
    <div style={{ position: 'fixed', top: 96, right: 16, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button
        onClick={onToggle}
        aria-label={vizOn ? 'Hide visualizer' : 'Show visualizer'}
        aria-pressed={vizOn}
        title={vizOn ? 'Hide visualizer' : 'Show visualizer'}
        style={{
          ...iconBtnStyle,
          color: vizOn ? 'var(--neon-magenta)' : 'var(--color-muted)',
          borderColor: vizOn ? 'color-mix(in srgb, var(--neon-magenta) 45%, transparent)' : 'color-mix(in srgb, var(--text) 12%, transparent)',
        }}
      >
        {vizOn ? <EyeSvg /> : <EyeOffSvg />}
      </button>
      {vizOn && (
        <button onClick={onFull} aria-label="Fullscreen visualizer" title="Fullscreen visualizer" style={iconBtnStyle}>
          <ExpandSvg />
        </button>
      )}
    </div>
  )
}

function EyeSvg() { return <svg width="18" height="18" viewBox="0 0 24 24" {...M_STROKE}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg> }
function EyeOffSvg() { return <svg width="18" height="18" viewBox="0 0 24 24" {...M_STROKE}><path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M6.06 6.06A18.4 18.4 0 0 0 1 12s4 7 11 7a9.7 9.7 0 0 0 5.94-2.06M1 1l22 22" /></svg> }
function ExpandSvg() { return <svg width="17" height="17" viewBox="0 0 24 24" {...M_STROKE}><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" /></svg> }

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

/* ─── Shuffle / Repeat mode button — clear on/off state ───────────── */
function ModeBtn({ active, onClick, title, children }) {
  return (
    <motion.button
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.9 }}
      style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: active ? 'var(--neon-magenta)' : 'var(--color-muted)',
        background: active ? 'color-mix(in srgb, var(--neon-magenta) 16%, transparent)' : 'transparent',
        border: active ? '1px solid color-mix(in srgb, var(--neon-magenta) 55%, transparent)' : '1px solid transparent',
        boxShadow: active ? '0 0 14px color-mix(in srgb, var(--neon-magenta) 30%, transparent)' : 'none',
        transition: 'color 0.15s, background 0.15s, border-color 0.15s',
      }}
    >
      {children}
    </motion.button>
  )
}

const M_STROKE = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
function ShuffleSvg() { return <svg width="17" height="17" viewBox="0 0 24 24" {...M_STROKE}><path d="M16 3h5v5" /><path d="M4 20 21 3" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" /></svg> }
function RepeatSvg() { return <svg width="17" height="17" viewBox="0 0 24 24" {...M_STROKE}><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg> }
function RepeatOneSvg() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" {...M_STROKE}>
      <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
      <text x="12" y="15.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor" stroke="none" fontFamily="var(--font-mono)">1</text>
    </svg>
  )
}

/* ─── The hand of cards ───────────────────────────────────────────────
   A hand of ALWAYS DECK_WINDOW (5) cards on Now Playing (clamped only by how
   many tracks exist). The visitor's FAVORITES (hearted tracks) come FIRST,
   then the hand is padded out with random library tracks — so the count never
   drops below 5 just because you have few (or zero) favorites. With more than
   5 in the pool the window slides as you advance (one card out the left, one
   in the right, wrapping) anchored to the now-playing card. Playing a card
   sets the pool as the player queue, so Next / Prev walk it and the window
   follows. Desktop / tablet: an arced FAN. Mobile: a centre-snap swipe carousel. */
const DECK_WINDOW = 5

/* Fisher–Yates shuffle of a track list — a stable random ordering used to pad
   the hand up to DECK_WINDOW (and the whole pool when nothing is liked). */
function shuffleTracks(list) {
  const a = list.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* Memoized: the page re-renders ~60fps from the audio analyser, but the deck
   only depends on track/favorites/breakpoint — memo keeps the 5 cards out of
   that per-frame reconcile (a big main-thread/scroll win, esp. on Gecko). */
const QueueDeckMemo = memo(QueueDeck)

function QueueDeck() {
  const bp = useBreakpoint()
  const allTracks = useContentStore(s => s.tracks)
  const favIds    = useFavoritesStore(s => s.ids)
  const currentId = usePlayerStore(s => s.currentTrack?.id)

  const library = useMemo(() => allTracks.filter(t => t.inLibrary !== false), [allTracks])

  // Liked tracks resolved to library tracks, in like-order. Drops likes whose
  // track has since been unpublished / removed from the library.
  const favTracks = useMemo(() => {
    const byId = new Map(library.map(t => [t.id, t]))
    return favIds.map(id => byId.get(id)).filter(Boolean)
  }, [favIds, library])
  const hasFavorites = favTracks.length > 0

  // A stable random ordering of the library — pads the hand up to DECK_WINDOW
  // and is the whole pool when nothing's liked. Re-shuffled only when the
  // library changes (content load / CMS edit), NOT on every render or like
  // toggle, so the hand stays put. (Starts empty; content arrives after mount.)
  const [shuffledLib, setShuffledLib] = useState(() => shuffleTracks(library))
  useEffect(() => { setShuffledLib(shuffleTracks(library)) }, [library])

  // The pool: FAVORITES first, then the rest of the shuffled library. The
  // window is ALWAYS DECK_WINDOW cards (clamped only by how many tracks exist),
  // so the count never drops below 5 just because you have few favorites.
  const pool = useMemo(() => {
    const favSet = new Set(favTracks.map(t => t.id))
    return [...favTracks, ...shuffledLib.filter(t => !favSet.has(t.id))]
  }, [favTracks, shuffledLib])

  // Fixed-size window anchored to the now-playing card; slides with wraparound.
  const cards = useMemo(() => {
    const N = pool.length
    if (!N) return []
    const visible = Math.min(N, DECK_WINDOW)
    const anchor  = Math.max(0, pool.findIndex(t => t.id === currentId))
    return Array.from({ length: visible }, (_, k) => {
      const i = (anchor + k) % N
      return { track: pool[i], idx: i }
    })
  }, [pool, currentId])

  if (!cards.length) return null

  const isMobile = bp === 'mobile'

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1">
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {hasFavorites ? 'Favorites' : 'Suggestions'}
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', opacity: 0.5, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {cards.length} picks · {isMobile ? 'swipe ›' : 'hover · pick ›'}
        </p>
      </div>

      {/* Playing a card sets the pool as the player queue, so Next / Prev walk it. */}
      {isMobile
        ? <QueueCarousel cards={cards} allTracks={pool} />
        : <QueueFan cards={cards} allTracks={pool} scale={bp === 'tablet' ? 0.58 : 0.66} />}
    </div>
  )
}

/* ═══ Desktop / tablet — a fanned hand of cards ═════════════════════════ */
const FAN_SPRING = { type: 'spring', stiffness: 280, damping: 30, mass: 0.8 }

function QueueFan({ cards, scale, allTracks }) {
  const [hover, setHover] = useState(null)
  const n = cards.length
  const mid = (n - 1) / 2
  const w = CARD_W * scale
  const h = CARD_H * scale

  // fan geometry — keep the whole hand inside a sensible width and overlap
  // the cards so only their left edge + cover peeks (classic held-hand look)
  const stepX  = Math.min(86, Math.max(34, Math.round((560 - w) / Math.max(1, n - 1))))
  const perDeg = Math.min(8, 42 / n)          // degrees of tilt per card from centre
  const fanW   = w + stepX * (n - 1)
  // outer cards sit a touch lower than the centre → gentle upward arc
  const dropAt = t => Math.abs(t) * Math.abs(t) * (3.2 / scale)

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: 'relative', width: fanW, height: h + 56, margin: '0 auto', marginTop: 6 }}
      onMouseLeave={() => setHover(null)}
    >
      <AnimatePresence>
      {cards.map(({ track, idx }, i) => {
        const t = i - mid
        const isUp = hover === i
        // The OUTER wrapper owns the fan position AND the hover hit-area, and it
        // NEVER moves on hover — so the pointer can't slide off it and there's no
        // enter/leave bounce loop. Only the INNER wrapper eases up a little, like
        // pulling one card a touch out of a real hand. Stacking order is kept
        // (zIndex: i), so a lifted card never jumps in front of its neighbours.
        return (
          <motion.div
            key={track.id}
            onMouseEnter={() => setHover(i)}
            initial={{ opacity: 0, y: 70 }}
            animate={{ opacity: 1, x: t * stepX, y: dropAt(t), rotate: t * perDeg }}
            exit={{ opacity: 0, y: 64, scale: 0.9, transition: { duration: 0.22 } }}
            transition={{ ...FAN_SPRING, delay: hover === null ? 0.05 * i : 0 }}
            style={{
              position: 'absolute', top: 40, left: `calc(50% - ${w / 2}px)`,
              width: w, height: h, transformOrigin: 'bottom center',
              zIndex: i, cursor: 'pointer',
            }}
          >
            <motion.div
              animate={{ y: isUp ? -22 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              style={{ width: '100%', height: '100%' }}
            >
              <div style={{ width: CARD_W, height: CARD_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                <DeckCard track={track} index={idx} allTracks={allTracks} tiltEnabled={false} inDeck />
              </div>
            </motion.div>
          </motion.div>
        )
      })}
      </AnimatePresence>
    </motion.div>
  )
}

/* ═══ Mobile — a centre-snap swipe carousel ═════════════════════════════ */
function QueueCarousel({ cards, allTracks }) {
  const scale = 0.9
  const w = CARD_W * scale
  const h = CARD_H * scale
  const half = Math.round(w / 2)

  return (
    <div
      className="no-scrollbar"
      style={{
        display: 'flex', gap: 18, overflowX: 'auto', overflowY: 'visible',
        scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
        padding: '16px 0 20px', scrollPaddingInline: '50%',
      }}
    >
      {cards.map(({ track, idx }, i) => (
        <div
          key={track.id}
          style={{
            flex: '0 0 auto', scrollSnapAlign: 'center', width: w, height: h,
            marginLeft:  i === 0 ? `max(4px, calc(50% - ${half}px))` : 0,
            marginRight: i === cards.length - 1 ? `max(4px, calc(50% - ${half}px))` : 0,
          }}
        >
          <div style={{ width: CARD_W, height: CARD_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <DeckCard track={track} index={idx} allTracks={allTracks} tiltEnabled={false} inDeck />
          </div>
        </div>
      ))}
    </div>
  )
}
