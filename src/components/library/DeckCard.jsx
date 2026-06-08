import { useRef, useCallback, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Tilt from 'react-parallax-tilt'
import { usePlayerStore } from '../../store/playerStore'
import { GENRE_GRADIENTS, fmtDuration } from '../../data/tracks'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { useCursorFacing } from '../../hooks/useCursorFacing'
import { useIsHoverDevice } from '../../hooks/useViewport'

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

export function DeckCard({ track, index, allTracks, tiltEnabled = true }) {
  const {
    currentTrack, isPlaying, isPaused, howl,
    loadTrack, setQueue, play, pause, next, prev,
    currentTime, duration, seek,
  } = usePlayerStore()

  const isActive = currentTrack?.id === track.id
  const playing  = isActive && isPlaying
  const paused   = isActive && isPaused
  const progress = isActive && duration > 0 ? currentTime / duration : 0

  const reduced     = usePrefersReducedMotion()
  const hoverDevice = useIsHoverDevice()
  const tiltOn      = tiltEnabled && !reduced && hoverDevice
  const [hovered, setHovered] = useState(false)
  const [liked, setLiked]     = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat]   = useState(false)

  /* Repeat toggles loop on the live audio while this card is the active one. */
  useEffect(() => {
    if (isActive && howl) howl.loop(repeat)
  }, [isActive, howl, repeat])

  const stageRef = useRef(null)
  const rafRef   = useRef(0)
  const pending  = useRef(null)
  /* Idle cards gently face the global cursor; disabled while hovered. */
  const facingRef = useCursorFacing(tiltOn && !hovered, 9)

  const grad   = GENRE_GRADIENTS[track?.genre] || ['#1a0a33', '#08041a']
  // Holographic foil removed — the white light streak it cast on hover was
  // unwanted. Hover keeps the 3D tilt + lift only. (Flip to `tiltOn && hovered`
  // to bring a subtle foil back.)
  const foilOn = false

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

          {/* hover/active darken so the play button + chip stay readable */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.30) 0%, transparent 22%)',
            boxShadow: (hovered || isActive) ? 'inset 0 0 0 100px rgba(6,3,16,0.28)' : 'none',
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

          <PlayButton visible={hovered || isActive} playing={playing} paused={paused} />
          {playing && <PlayingPulse />}
        </div>

        {/* index chip — legible over any artwork */}
        <IndexChip n={index + 1} active={isActive} />

        {/* ── Body: mini-player (now-playing mark · title · like · transport) */}
        <div style={{
          position: 'absolute', left: PAD, right: PAD, top: PAD + COVER, bottom: PAD, zIndex: 5,
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: 12 }}>
            <span style={{ marginTop: 3, flexShrink: 0 }}>
              <NowPlayingMark playing={playing} active={isActive} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
                fontSize: 17, lineHeight: '21px', color: accent,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {track.title}
              </p>
              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: 10.5, lineHeight: '15px', color: onCardMuted,
                letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {track.artist}
              </p>
            </div>
            <LikeButton liked={liked} onToggle={() => setLiked(v => !v)} />
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
              <MiniCtrl label="Shuffle" active={shuffle} onClick={e => { e.stopPropagation(); setShuffle(v => !v) }}>
                <ShuffleIcon />
              </MiniCtrl>
              <MiniCtrl label="Previous" onClick={e => { e.stopPropagation(); prev() }}>
                <PrevIcon />
              </MiniCtrl>
              <BigPlay playing={playing} onClick={e => { e.stopPropagation(); handlePlay() }} />
              <MiniCtrl label="Next" onClick={e => { e.stopPropagation(); next() }}>
                <NextIcon />
              </MiniCtrl>
              <MiniCtrl label="Repeat" active={repeat} onClick={e => { e.stopPropagation(); setRepeat(v => !v) }}>
                <RepeatIcon />
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
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -8, zIndex: 30 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={{ width: CARD_W, height: CARD_H, position: 'relative', zIndex: isActive ? 20 : 1 }}
    >
      <div ref={facingRef} style={{ width: CARD_W, height: CARD_H, transition: 'transform 0.22s ease-out' }}>
        {inner}
      </div>
    </motion.div>
  )
}

/* ─── Index chip (track number + vinyl mark) — the card's "rank" ─────── */
function IndexChip({ n, active }) {
  return (
    <div style={{
      position: 'absolute', top: PAD + 7, left: PAD + 7, zIndex: 6, pointerEvents: 'none',
      display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px 3px 6px', borderRadius: 8,
      background: 'rgba(8,5,16,0.5)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
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

/* ─── Centre play / pause (over the cover) ─────────────────────────── */
function PlayButton({ visible, playing, paused }) {
  return (
    <div
      style={{
        position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) scale(${visible ? 1 : 0.85})`,
        width: 54, height: 54, borderRadius: '50%',
        background: playing || paused ? 'color-mix(in srgb, var(--neon-magenta) 88%, transparent)' : 'rgba(10,8,20,0.46)',
        border: '2px solid var(--neon-magenta)', boxShadow: '0 0 20px var(--glow-magenta)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        pointerEvents: 'none', zIndex: 7, backdropFilter: 'blur(4px)',
        opacity: visible ? 1 : 0, transition: 'opacity 0.18s ease, background 0.18s ease, transform 0.18s ease',
      }}
    >
      {playing
        ? <svg width="15" height="17" viewBox="0 0 14 16" fill="currentColor"><path d="M0 0h4v16H0zM9 0h4v16H9z" /></svg>
        : <svg width="15" height="17" viewBox="0 0 14 16" fill="currentColor" style={{ marginLeft: 3 }}><path d="M0 0l13 8L0 16z" /></svg>}
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
