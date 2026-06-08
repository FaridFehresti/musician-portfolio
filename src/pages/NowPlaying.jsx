import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore } from '../store/playerStore'
import { useAudioAnalyser } from '../hooks/useAudioAnalyser'
import { CoverLightbox } from '../components/ui/CoverLightbox'
import { HoloVinylCard } from '../components/vinyl/HoloVinylCard'
import { DeckCard, CARD_W, CARD_H } from '../components/library/DeckCard'
import { useBreakpoint } from '../hooks/useViewport'
import { fmtDuration } from '../data/tracks'
import { useContentStore } from '../store/contentStore'

export default function NowPlaying() {
  const bp = useBreakpoint()
  const SLEEVE = bp === 'mobile' ? 200 : bp === 'tablet' ? 300 : 340
  const {
    currentTrack, isPlaying, isPaused,
    currentTime, duration, howl, volume,
    play, pause, next, prev, seek, setVolume,
    shuffle, repeat, toggleShuffle, cycleRepeat,
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
            background: 'color-mix(in srgb, var(--color-surface) 65%, transparent)',
            border: '1px solid color-mix(in srgb, var(--text) 10%, transparent)',
            backdropFilter: 'blur(8px)',
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
        <QueueDeck />
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

/* ─── Suggestions deck ────────────────────────────────────────────────
   Five random library tracks, held like a hand. The set is chosen ONCE
   when the page mounts and stays put — picking a card plays it without
   reshuffling. Desktop / tablet: an arced FAN — overlapping, rotated
   cards; hovering a card nudges it up a little and brings it to the front
   while it stays collided with the rest. Mobile: a centre-snap swipe
   carousel (a fan of tall transport cards is unusable on a phone). */
const SUGGEST_COUNT = 5

/* pick `n` distinct tracks at random, preserving their library index for the
   card's rank chip. Computed once via useState initialiser, so it's stable. */
function pickRandom(list, n) {
  const idxs = list.map((_, i) => i)
  for (let i = idxs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[idxs[i], idxs[j]] = [idxs[j], idxs[i]]
  }
  return idxs.slice(0, Math.min(n, list.length)).map(i => ({ track: list[i], idx: i }))
}

function QueueDeck() {
  const bp = useBreakpoint()
  const allTracks = useContentStore(s => s.tracks)
  const tracks = useMemo(() => allTracks.filter(t => t.inLibrary !== false), [allTracks])
  // stable random suggestions — only ever (re)generated on a fresh mount
  const [cards] = useState(() => pickRandom(tracks, SUGGEST_COUNT))

  if (!cards.length) return null

  const isMobile = bp === 'mobile'

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1">
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Suggestions
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', opacity: 0.5, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {cards.length} picks · {isMobile ? 'swipe ›' : 'hover · pick ›'}
        </p>
      </div>

      {isMobile
        ? <QueueCarousel cards={cards} allTracks={tracks} />
        : <QueueFan cards={cards} allTracks={tracks} scale={bp === 'tablet' ? 0.58 : 0.66} />}
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
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: 'relative', width: fanW, height: h + 56, margin: '0 auto', marginTop: 6 }}
      onMouseLeave={() => setHover(null)}
    >
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
                <DeckCard track={track} index={idx} allTracks={allTracks} tiltEnabled={false} />
              </div>
            </motion.div>
          </motion.div>
        )
      })}
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
            <DeckCard track={track} index={idx} allTracks={allTracks} tiltEnabled={false} />
          </div>
        </div>
      ))}
    </div>
  )
}
