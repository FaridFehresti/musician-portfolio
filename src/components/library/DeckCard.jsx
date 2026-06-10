import { useRef, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Tilt from 'react-parallax-tilt'
import { usePlayerStore } from '../../store/playerStore'
import { useFavoritesStore } from '../../store/favoritesStore'
import { GENRE_GRADIENTS, fmtDuration } from '../../data/tracks'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { useCursorFacing } from '../../hooks/useCursorFacing'
import { useIsHoverDevice } from '../../hooks/useViewport'
import { VideoLightbox } from '../ui/VideoLightbox'
import { ShareButton } from '../ui/ShareButton'

/* ── Sparkle texture: SVG fractal noise punched into sparse bright dots. ── */
const SPARKLE_SVG =
  `<svg xmlns='http://www.w3.org/2000/svg' width='170' height='170'>` +
  `<filter id='s'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' seed='11' stitchTiles='stitch'/>` +
  `<feColorMatrix type='matrix' values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 9 -4.2'/></filter>` +
  `<rect width='100%' height='100%' filter='url(#s)'/></svg>`
const SPARKLE_URL = `url("data:image/svg+xml,${encodeURIComponent(SPARKLE_SVG)}")`

/* ── Card geometry — a true "playing card" portrait tile ────────────────
   Square cover up top, a hairline rule, then the transport strip pinned to
   the bottom. A few flat constants keep the vertical rhythm even. */
export const CARD_W = 236
const RADIUS = 20
const PAD    = 15                          // inner padding (cover + body share it)
const COVER  = CARD_W - PAD * 2            // 206 — square art
const BODY_H = 160                         // cover-bottom → card-bottom
export const CARD_H = PAD + COVER + BODY_H // 381

/* Z-axis thickness — a stack of offset shadows reads as the card's physical
   edge. Offset up-RIGHT so the thickness sits on the top-right of the card.
   A fine lightness ramp (toward #fff) gives a smooth bevel and a final soft,
   blurred layer fades the rim out instead of ending on a hard step. Colours
   derive from the card's own --card-2 token, so the edge re-tints with every
   theme; box-shadow transforms with the element, so it also foreshortens on
   tilt. */
const EDGE = [
  '0.5px -0.5px 0 color-mix(in srgb, var(--card-2) 88%, #fff)',
  '1px -1px 0 color-mix(in srgb, var(--card-2) 74%, #fff)',
  '1.5px -1.5px 0 color-mix(in srgb, var(--card-2) 60%, #fff)',
  '2px -2px 3px color-mix(in srgb, var(--card-2) 50%, transparent)',
].join(', ')

export function DeckCard({ track, index, allTracks, tiltEnabled = true, inDeck = false }) {
  const {
    currentTrack, isPlaying,
    loadTrack, setQueue, play, pause, next, prev,
    currentTime, duration, seek,
    shuffle, repeat, toggleShuffle, cycleRepeat,
  } = usePlayerStore()

  const isActive = currentTrack?.id === track.id
  const playing  = isActive && isPlaying
  const progress = isActive && duration > 0 ? currentTime / duration : 0

  const reduced     = usePrefersReducedMotion()
  const hoverDevice = useIsHoverDevice()
  const tiltOn      = tiltEnabled && !reduced && hoverDevice
  const [hovered, setHovered] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)

  // Likes are global + persisted (localStorage) — they drive the favorites
  // deck on Now Playing. Selecting just the boolean keeps re-renders minimal.
  const liked = useFavoritesStore(s => s.ids.includes(track?.id))
  const toggleFavorite = useFavoritesStore(s => s.toggle)

  function openVideo() {
    setVideoOpen(true)   // VideoLightbox pauses any playing audio on open
  }

  const stageRef = useRef(null)
  const rafRef   = useRef(0)
  const pending  = useRef(null)
  /* Idle cards gently face the global cursor; disabled while hovered. */
  const facingRef = useCursorFacing(tiltOn && !hovered, 9)

  const grad   = GENRE_GRADIENTS[track?.genre] || ['#1a0a33', '#08041a']
  // Holographic GLASS foil on hover — cursor-tracked (onMove writes the --mx/
  // --my/--hyp CSS vars the .holo-* layers read in globals.css). Only on
  // hover-capable, tilt-enabled cards (home / library), where the pointer
  // actually drives it; it blooms toward the cursor and fades in over 0.4s.
  const foilOn = tiltOn && hovered

  /* Pointer → CSS vars on the stage; rAF-throttled to one write per frame. */
  const onMove = useCallback((_rx, _ry, rxp, ryp) => {
    pending.current = { rxp, ryp }
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      const el = stageRef.current
      const p  = pending.current
      if (!el || !p) return
      const mx = (p.ryp + 100) / 2
      const my = (p.rxp + 100) / 2
      el.style.setProperty('--mx', mx.toFixed(1))
      el.style.setProperty('--my', my.toFixed(1))
      el.style.setProperty('--posx', (50 + (mx - 50) * 0.9).toFixed(1))
      el.style.setProperty('--posy', (50 + (my - 50) * 0.9).toFixed(1))
      el.style.setProperty('--hyp', Math.min(1, Math.hypot(mx - 50, my - 50) / 50).toFixed(3))
    })
  }, [])

  const reset = useCallback(() => {
    setHovered(false)
    const el = stageRef.current
    if (!el) return
    el.style.setProperty('--mx', '50')
    el.style.setProperty('--my', '50')
    el.style.setProperty('--posx', '50')
    el.style.setProperty('--posy', '50')
    el.style.setProperty('--hyp', '0')
  }, [])

  function handlePlay() {
    if (isActive) {
      if (isPlaying) pause()
      else play()
    } else {
      setQueue(allTracks)
      loadTrack(track)
    }
  }

  function handleSeek(e) {
    if (!isActive || !duration) return
    const r = e.currentTarget.getBoundingClientRect()
    seek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration)
  }

  // The card body is dark in EVERY theme, so its text must stay light —
  // the page's --color-text/--color-muted go dark under light themes.
  const onCard      = 'rgba(255,255,255,0.94)'
  const onCardMuted = 'rgba(255,255,255,0.6)'
  const accent = isActive ? 'var(--neon-magenta)' : onCard

  const stage = (
    <div
      ref={stageRef}
      className="holo-stage"
      style={{ position: 'relative', width: CARD_W, height: CARD_H, borderRadius: RADIUS }}
    >
      {/* ── Card face ───────────────────────────────────────────────── */}
      <div
        className="holo-sleeve"
        style={{
          position: 'absolute', inset: 0, borderRadius: RADIUS, overflow: 'hidden',
          background: `radial-gradient(130% 90% at 50% -16%, color-mix(in srgb, ${grad[0]} 48%, var(--card-1)) 0%, var(--card-1) 46%, var(--card-2) 100%)`,
          boxShadow: isActive
            ? `${EDGE}, 0 0 0 1.5px var(--neon-magenta), 0 20px 44px rgba(0,0,0,0.6), 0 0 30px var(--glow-magenta), inset 0 0 0 1px rgba(255,255,255,0.06)`
            : `${EDGE}, 0 18px 34px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.05)`,
        }}
      >
        {/* Decorative inner card border (the classic playing-card frame) */}
        <div style={{
          position: 'absolute', inset: 6, borderRadius: RADIUS - 6, zIndex: 4, pointerEvents: 'none',
          border: '1px solid rgba(255,255,255,0.06)',
        }} />

        {/* ── Cover art (click to play) ─────────────────────────────── */}
        <div
          onClick={handlePlay}
          title={isActive ? (playing ? 'Pause' : 'Play') : `Play ${track.title}`}
          style={{
            position: 'absolute', top: PAD, left: PAD, width: COVER, height: COVER,
            borderRadius: 11, overflow: 'hidden', cursor: 'pointer', zIndex: 2,
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.5), 0 6px 16px rgba(0,0,0,0.4)',
          }}
        >
          {track?.coverArt
            ? <img src={track.coverArt} alt={track.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <GradientCover grad={grad} genre={track?.genre} />}

          {/* hover/active darken so the play button + chip stay readable.
              The spread MUST exceed half the cover (206/2 = 103px) or the inset
              shadow from opposing edges doesn't meet — leaving a bright ~6px
              square in the dead centre (the "weird square" bug). 220px covers it. */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.30) 0%, transparent 22%)',
            boxShadow: (hovered || isActive) ? 'inset 0 0 0 220px rgba(6,3,16,0.28)' : 'none',
            transition: 'box-shadow 0.2s ease',
          }} />

          {/* Holographic foil — CLIPPED TO THE COVER ART (overflow:hidden on
              this div). Mounting it here, not on the whole card, stops the
              light/foil from showing as a lit rectangle over the flat body. */}
          {foilOn && (
            <>
              <div className="holo-foil-layer holo-light-spot" />
              <div className="holo-foil-layer holo-foil-color" />
              <div className="holo-foil-layer holo-foil-glint" />
              <div className="holo-foil-layer holo-foil-sparkle" style={{ backgroundImage: SPARKLE_URL }} />
              <div className="holo-foil-layer holo-spec" />
            </>
          )}

          {/* (cover-overlay play button removed — the transport BigPlay below
              is the single play control; the cover stays click-to-play) */}
          {playing && <PlayingPulse />}
        </div>

        {/* index chip — legible over any artwork */}
        <IndexChip n={index + 1} active={isActive} />

        {/* genre — a frosted "vinyl tag" mirroring the index chip on the cover's
            top-right. Lives on the card face (sibling of the cover, like the
            index chip) so it costs ZERO body height; drops below the playing
            pulse dot while this card is the one playing. */}
        {track?.genre && (
          <div style={{
            position: 'absolute', top: playing ? 36 : PAD + 7, right: PAD + 7, zIndex: 6,
            maxWidth: COVER - 60, pointerEvents: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 8px 3px 6px', borderRadius: 8,
            background: 'rgba(8,5,16,0.82)',
            border: '1px solid color-mix(in srgb, var(--neon-cyan) 38%, transparent)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.35)', transition: 'top 0.2s ease',
          }}>
            <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden>
              <circle cx="8" cy="8" r="7" fill="none" stroke="var(--neon-cyan)" strokeWidth="1.1" opacity="0.92" />
              <circle cx="8" cy="8" r="2.1" fill="var(--neon-cyan)" opacity="0.92" />
            </svg>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 8.5, fontWeight: 600, lineHeight: 1,
              letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--neon-cyan)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {track.genre}
            </span>
          </div>
        )}

        {/* ── Body: mini-player (now-playing mark · title · like · transport) */}
        <div style={{
          position: 'absolute', left: PAD, right: PAD, top: PAD + COVER, bottom: PAD, zIndex: 5,
          display: 'flex', flexDirection: 'column',
        }}>
          {/* now-playing eq mark — floated to the body's top-left, OUT of the
              centered text flow (position:absolute = zero layout cost), so it
              never shifts the title off centre. */}
          <span aria-hidden style={{ position: 'absolute', top: 14, left: 0, pointerEvents: 'none' }}>
            <NowPlayingMark playing={playing} active={isActive} />
          </span>

          {/* action cluster — floated to the body's top-right, also OUT of flow,
              so the title centres on the true card midline whether or not the
              (conditional) video icon renders. Button wiring is unchanged. */}
          <div style={{ position: 'absolute', top: 9, right: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
            {track?.video && <VideoButton onClick={e => { e.stopPropagation(); openVideo() }} />}
            <ShareButton track={track} iconSize={15} color="rgba(255,255,255,0.55)" activeColor="var(--neon-cyan)" />
            <LikeButton liked={liked} onToggle={() => toggleFavorite(track?.id)} />
          </div>

          {/* Centered title + artist·album. The eq mark + icon cluster float at
              the corners at the TITLE's vertical level, so ONLY the title needs
              padding to clear them — it carries symmetric paddingLeft/Right:46 so
              it stays centred on the true midline. The artist·album line sits
              BELOW the clusters, so it spans the full width (no padding) and a
              long "artist · album" isn't squeezed into a double ellipsis. */}
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <p style={{
              margin: 0, paddingLeft: 46, paddingRight: track?.video ? 74 : 50,
              fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
              fontSize: 17, lineHeight: '21px', color: accent,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {track.title}
            </p>
            {/* artist · album — one centered line; album folds in (genre lives on
                the cover tag). Album shrinks first, then truncates. */}
            <p style={{
              display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 5,
              margin: 0, minWidth: 0,
              fontFamily: 'var(--font-mono)', fontSize: 10.5, lineHeight: '15px',
              letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden',
            }}>
              <span style={{ flexShrink: 1, minWidth: 0, color: onCardMuted, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {track.artist}
              </span>
              {track.album && (
                <>
                  <span aria-hidden style={{ flexShrink: 0, color: 'color-mix(in srgb, var(--neon-cyan) 55%, transparent)' }}>·</span>
                  <span style={{ flexShrink: 2, minWidth: 0, color: 'rgba(255,255,255,0.42)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {track.album}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Transport — progress + controls, pinned to the bottom */}
          <div style={{ marginTop: 'auto' }}>
            {/* progress */}
            <div
              onClick={handleSeek}
              style={{
                position: 'relative', height: 4, borderRadius: 3,
                background: 'rgba(255,255,255,0.16)',
                cursor: isActive ? 'pointer' : 'default',
              }}
            >
              <div style={{
                position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: 3,
                width: `${Math.min(100, progress * 100)}%`,
                background: 'var(--neon-magenta)', boxShadow: progress > 0 ? '0 0 8px var(--glow-magenta)' : 'none',
                transition: 'width 0.3s linear',
              }} />
              <div style={{
                position: 'absolute', top: '50%', left: `${Math.min(100, progress * 100)}%`,
                transform: 'translate(-50%, -50%)', width: 10, height: 10, borderRadius: '50%',
                background: '#fff', boxShadow: '0 0 8px var(--glow-magenta)',
                opacity: isActive ? 1 : 0, transition: 'opacity 0.2s',
              }} />
            </div>

            {/* times */}
            <div style={{
              marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.04em', color: onCardMuted,
            }}>
              <span>{fmtDuration(isActive ? currentTime : 0)}</span>
              <span>{fmtDuration(isActive ? duration : (track.duration || 0))}</span>
            </div>

            {/* controls: shuffle · prev · play · next · repeat */}
            <div style={{ marginTop: 11, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <MiniCtrl label="Shuffle" active={shuffle} onClick={e => { e.stopPropagation(); toggleShuffle() }}>
                <ShuffleIcon />
              </MiniCtrl>
              <MiniCtrl label="Previous" onClick={e => { e.stopPropagation(); prev() }}>
                <PrevIcon />
              </MiniCtrl>
              <BigPlay playing={playing} onClick={e => { e.stopPropagation(); handlePlay() }} />
              <MiniCtrl label="Next" onClick={e => { e.stopPropagation(); next() }}>
                <NextIcon />
              </MiniCtrl>
              <MiniCtrl label={`Repeat: ${repeat}`} active={repeat !== 'off'} onClick={e => { e.stopPropagation(); cycleRepeat() }}>
                {repeat === 'one' ? <RepeatOneIcon /> : <RepeatIcon />}
              </MiniCtrl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const inner = tiltOn ? (
    <Tilt
      tiltMaxAngleX={11}
      tiltMaxAngleY={11}
      perspective={1000}
      scale={1.04}
      transitionSpeed={900}
      glareEnable={false}
      gyroscope={false}
      onMove={onMove}
      onEnter={() => setHovered(true)}
      onLeave={reset}
      style={{ width: CARD_W, height: CARD_H }}
    >
      {stage}
    </Tilt>
  ) : (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={reset} style={{ width: CARD_W, height: CARD_H }}>
      {stage}
    </div>
  )

  return (
    <motion.div
      // `layout` re-measures every frame; inside the fan/carousel each card sits
      // in a plain `transform: scale()` wrapper that framer's layout projection
      // can't see, so on Now Playing (which re-renders ~60fps off the audio
      // analyser) it animates phantom sub-pixel deltas → the Firefox "bounce".
      // In a deck we also drop the hover lift (the fan supplies its own), which
      // otherwise ping-pongs mouseenter/leave on the overlapping siblings.
      layout={!inDeck}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={inDeck ? undefined : { y: -8, zIndex: 30 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={{ width: CARD_W, height: CARD_H, position: 'relative', zIndex: isActive ? 20 : 1 }}
    >
      <div ref={facingRef} style={{ width: CARD_W, height: CARD_H, transition: 'transform 0.22s ease-out' }}>
        {inner}
      </div>

      {/* Video lightbox — portalled to <body> so card transforms don't pin it */}
      {createPortal(
        <AnimatePresence>
          {videoOpen && (
            <VideoLightbox url={track.video} title={track.title} onClose={() => setVideoOpen(false)} />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </motion.div>
  )
}

/* ─── Video button (title row) — opens the clip ─────────────────────── */
function VideoButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Watch video"
      title="Watch video"
      style={{
        flexShrink: 0, width: 24, height: 24, borderRadius: '50%', border: 'none',
        background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--neon-cyan)', transition: 'color 0.18s',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <rect x="0.6" y="3" width="10.5" height="10" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <path d="M11.5 6.6l3.9-2.1v7l-3.9-2.1z" />
        <path d="M3.4 6l3.6 2-3.6 2z" />
      </svg>
    </button>
  )
}

/* ─── Index chip (track number + vinyl mark) — the card's "rank" ─────── */
function IndexChip({ n, active }) {
  return (
    <div style={{
      position: 'absolute', top: PAD + 7, left: PAD + 7, zIndex: 6, pointerEvents: 'none',
      display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px 3px 6px', borderRadius: 8,
      background: 'rgba(8,5,16,0.82)',
      border: `1px solid ${active ? 'color-mix(in srgb, var(--neon-magenta) 60%, transparent)' : 'rgba(255,255,255,0.14)'}`,
    }}>
      <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden>
        <circle cx="8" cy="8" r="7" fill="none" stroke={active ? 'var(--neon-magenta)' : '#fff'} strokeWidth="1.1" opacity="0.92" />
        <circle cx="8" cy="8" r="2.1" fill={active ? 'var(--neon-magenta)' : '#fff'} opacity="0.92" />
      </svg>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em',
        color: active ? 'var(--neon-magenta)' : '#fff',
      }}>
        {String(n).padStart(2, '0')}
      </span>
    </div>
  )
}

/* ─── Gradient placeholder cover ───────────────────────────────────── */
function GradientCover({ grad, genre }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: `linear-gradient(145deg, ${grad[0]} 0%, ${grad[1]} 100%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
    }}>
      <svg width="90" height="56" viewBox="0 0 90 56" opacity="0.5">
        {[10, 26, 42].map((y, i) => (
          <path key={y} d={`M 4 ${y} Q 28 ${y - 9 + i * 6} 50 ${y} Q 72 ${y + 9 - i * 6} 86 ${y}`}
            fill="none" stroke="var(--neon-cyan)" strokeWidth="1.4" strokeLinecap="round" />
        ))}
      </svg>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'color-mix(in srgb, var(--accent-2) 50%, transparent)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        {genre || 'Select a track'}
      </span>
    </div>
  )
}


/* ─── Now-playing mark — animated bars (active), static otherwise ───── */
function NowPlayingMark({ playing, active }) {
  const color = active ? 'var(--neon-magenta)' : 'rgba(255,255,255,0.5)'
  const rest  = [8, 12, 6]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 1.6, height: 12 }} aria-hidden>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 2.4, borderRadius: 2, background: color,
          boxShadow: active ? '0 0 6px var(--glow-magenta)' : 'none',
          height: playing ? '100%' : rest[i],
          transformOrigin: 'bottom',
          animation: playing ? `eq-bar 0.9s ease-in-out ${i * 0.15}s infinite` : 'none',
        }} />
      ))}
    </span>
  )
}

/* ─── Like (heart) toggle ───────────────────────────────────────────── */
function LikeButton({ liked, onToggle }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onToggle() }}
      aria-label={liked ? 'Unlike' : 'Like'}
      style={{
        flexShrink: 0, width: 24, height: 24, borderRadius: '50%', border: 'none',
        background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: liked ? 'var(--neon-magenta)' : 'rgba(255,255,255,0.55)', transition: 'color 0.18s',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    </button>
  )
}

/* ─── Small transport control (shuffle / prev / next / repeat) ──────── */
function MiniCtrl({ label, active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: 'transparent', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: active ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.62)', transition: 'color 0.15s',
      }}
    >
      {children}
    </button>
  )
}

/* ─── Big centre play / pause ───────────────────────────────────────── */
function BigPlay({ playing, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={playing ? 'Pause' : 'Play'}
      style={{
        width: 42, height: 42, borderRadius: '50%', flexShrink: 0, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: playing ? 'var(--neon-magenta)' : '#fff',
        color: playing ? 'var(--on-accent)' : '#0a0a12',
        boxShadow: playing ? '0 0 18px var(--glow-magenta)' : '0 4px 14px rgba(0,0,0,0.45)',
        transition: 'background 0.18s, box-shadow 0.18s, color 0.18s',
      }}
    >
      {playing
        ? <svg width="14" height="15" viewBox="0 0 14 16" fill="currentColor"><path d="M0 0h4v16H0zM9 0h4v16H9z" /></svg>
        : <svg width="14" height="15" viewBox="0 0 14 16" fill="currentColor" style={{ marginLeft: 2 }}><path d="M0 0l13 8L0 16z" /></svg>}
    </button>
  )
}

const STROKE = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
function ShuffleIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" {...STROKE}><path d="M16 3h5v5" /><path d="M4 20 21 3" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" /></svg>
}
function RepeatIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" {...STROKE}><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
}
function RepeatOneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" {...STROKE}>
      <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
      <text x="12" y="15.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor" stroke="none" fontFamily="var(--font-mono)">1</text>
    </svg>
  )
}
function PrevIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 3h2v10H4V3zm3 5l6-5v10L7 8z" /></svg>
}
function NextIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10 3h2v10h-2V3zM9 8L3 3v10l6-5z" /></svg>
}

function PlayingPulse() {
  return (
    <div style={{
      position: 'absolute', top: 10, right: 12, width: 9, height: 9, borderRadius: '50%',
      background: 'var(--neon-magenta)', boxShadow: '0 0 8px 3px var(--glow-magenta)',
      animation: 'pulse 1.2s ease-in-out infinite', zIndex: 8, pointerEvents: 'none',
    }} />
  )
}
