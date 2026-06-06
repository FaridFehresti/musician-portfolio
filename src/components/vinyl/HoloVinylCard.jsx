import { useRef, useCallback, useState, useMemo } from 'react'
import Tilt from 'react-parallax-tilt'
import { GENRE_GRADIENTS } from '../../data/tracks'
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

const VARIANTS = {
  grid: { tiltAngle: 13, scale: 1.05, radius: 14 },
  hero: { tiltAngle: 15, scale: 1.0,  radius: 16 },
  big:  { tiltAngle: 10, scale: 1.0,  radius: 18 },
}

/* Unified disk slide-out (modelled on NowPlaying, the approved reference).
   `visible` = fraction of the disk sticking out past the sleeve's right edge. */
function diskLeftFor({ size, disk, active, playing }) {
  const visible = !active ? 0.18 : playing ? 0.55 : 0.40
  return size - disk * (1 - visible)
}

export function HoloVinylCard({
  track,
  index = 0,
  size = 220,
  variant = 'grid',
  diskEnabled = true,
  tiltEnabled = true,
  holoIntensity = 1,
  active = false,
  playing = false,
  progress = 0,
  showInfo = true,
  showPlayButton = true,
  glowStrength = 0,
  onPlay,
  onClick,
  onCoverZoom,
}) {
  const v = VARIANTS[variant] || VARIANTS.grid
  const reduced = usePrefersReducedMotion()
  const hoverDevice = useIsHoverDevice()
  // Tilt / foil / cursor-facing are mouse-only — never on touch or reduced-motion.
  const tiltOn = tiltEnabled && !reduced && hoverDevice
  const [hovered, setHovered] = useState(false)

  const stageRef = useRef(null)
  const rafRef = useRef(0)
  const pending = useRef(null)

  /* Idle cards gently face the global cursor; disabled while hovered. */
  const facingRef = useCursorFacing(tiltOn && !hovered, variant === 'big' ? 6 : 9)

  const gradColors = GENRE_GRADIENTS[track?.genre] || ['#1a0a33', '#08041a']
  const disk = Math.round(size * 0.92)
  const radius = v.radius
  const frame = Math.max(6, Math.round(size * 0.03))
  const artRadius = Math.max(4, radius - Math.round(frame * 0.5))
  /* Holo glass only on cards that actually track the pointer — a non-tilt
     card (e.g. a fanned-back deck card) would just show a static washed
     glow, which looks broken. */
  const foilOn = tiltOn && (hovered || active)
  const cardClick = onClick || onPlay

  /* Pointer → CSS vars on the stage; rAF-throttled to one write per frame. */
  const onMove = useCallback((_rx, _ry, rxp, ryp) => {
    pending.current = { rxp, ryp }
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      const el = stageRef.current
      const p = pending.current
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

  const stage = (
    <div
      ref={stageRef}
      className="holo-stage"
      style={{ position: 'relative', width: size, height: size, overflow: 'visible', borderRadius: radius, '--holo': holoIntensity }}
    >
      {/* Disk — sibling, behind the sleeve, slides out + spins */}
      {diskEnabled && (
        <DiskLayer
          size={disk}
          coverArt={track?.coverArt}
          gradColors={gradColors}
          left={diskLeftFor({ size, disk, active, playing })}
          spinning={playing}
          active={active}
          glowStrength={glowStrength}
        />
      )}

      {/* Card tile — clean dark-framed cover at rest; holographic glass on hover */}
      <div
        className="holo-sleeve"
        style={{
          position: 'absolute', top: 0, left: 0, width: size, height: size,
          borderRadius: radius, overflow: 'hidden', zIndex: 1,
          background: 'linear-gradient(135deg, var(--card-1) 0%, var(--card-2) 100%)',
          boxShadow: active
            ? '0 0 0 1.5px var(--neon-magenta), 0 12px 34px rgba(0,0,0,0.55), 0 0 24px var(--glow-magenta), inset 0 0 0 1px rgba(255,255,255,0.06)'
            : '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.07), inset 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        {/* Cover art, inset to leave a slim frame */}
        <div style={{ position: 'absolute', inset: frame, borderRadius: artRadius, overflow: 'hidden', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.4)' }}>
          {track?.coverArt
            ? <img src={track.coverArt} alt={track.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <GradientCover gradColors={gradColors} genre={track?.genre} />}
        </div>

        {/* Holographic glass — only on hover/active. Light tracks the pointer
            so the foil ignites where the 3D light hits the surface. */}
        {foilOn && (
          <>
            <div className="holo-foil-layer holo-light-spot" />
            <div className="holo-foil-layer holo-foil-color" />
            <div className="holo-foil-layer holo-foil-glint" />
            <div className="holo-foil-layer holo-foil-sparkle" style={{ backgroundImage: SPARKLE_URL }} />
            <div className="holo-foil-layer holo-spec" />
          </>
        )}

        {/* Progress */}
        {active && progress > 0 && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(0,0,0,0.5)', zIndex: 5 }}>
            <div style={{ height: '100%', width: `${Math.min(100, progress * 100)}%`, background: 'var(--neon-magenta)', boxShadow: '0 0 8px var(--glow-magenta)', transition: 'width 0.4s linear' }} />
          </div>
        )}

        {showInfo && track?.title && (
          <InfoOverlay title={track.title} artist={track.artist} genre={track.genre} active={active} variant={variant} frame={frame} />
        )}

        {variant === 'grid' && (
          <div style={{ position: 'absolute', top: frame + 4, left: frame + 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.8)', textShadow: '0 1px 3px rgba(0,0,0,0.7)', zIndex: 5, pointerEvents: 'none' }}>
            {String(index + 1).padStart(2, '0')}
          </div>
        )}

        {/* Slot shadow on the right edge — disk emerges from here */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: 14, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.4))', zIndex: 3, pointerEvents: 'none' }} />

        {showPlayButton && (
          <PlayButton visible={hovered || active} playing={playing} onClick={e => { e.stopPropagation(); onPlay?.() }} />
        )}

        {variant === 'big' && onCoverZoom && <ZoomHint />}

        {playing && <PlayingPulse />}
      </div>
    </div>
  )

  const inner = tiltOn ? (
    <Tilt
      tiltMaxAngleX={v.tiltAngle}
      tiltMaxAngleY={v.tiltAngle}
      perspective={900}
      scale={v.scale}
      transitionSpeed={900}
      glareEnable={false}
      gyroscope={false}
      onMove={onMove}
      onEnter={() => setHovered(true)}
      onLeave={reset}
      style={{ width: size, height: size }}
    >
      {stage}
    </Tilt>
  ) : (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={reset} style={{ width: size, height: size }}>
      {stage}
    </div>
  )

  return (
    <div
      ref={facingRef}
      onClick={cardClick ? () => cardClick() : undefined}
      style={{
        width: size, height: size, position: 'relative',
        cursor: cardClick ? 'pointer' : 'default',
        transition: 'transform 0.22s ease-out',
      }}
    >
      {inner}
    </div>
  )
}

/* ─── Disk ─────────────────────────────────────────────────────────── */
function DiskLayer({ size, coverArt, gradColors, left, spinning, active, glowStrength = 0 }) {
  const grooves = useMemo(() => {
    const arr = []
    const max = size / 2 - 6
    for (let r = max, i = 0; r > size * 0.16; r -= 9, i++) arr.push({ r: +r.toFixed(1), i })
    return arr
  }, [size])

  const labelSize = size * 0.36
  const spindle = Math.max(6, Math.round(size * 0.03))
  const glow = active && spinning ? 10 + (glowStrength || 0) * 46 : 0

  return (
    <div
      style={{
        position: 'absolute', top: '50%', left, width: size, height: size,
        transform: 'translateY(-50%)',
        transition: 'left 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
        zIndex: 0,
      }}
    >
      <div
        style={{
          width: size, height: size, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 50%, #2a2a2a 0%, #0c0c0c 60%, #050505 100%)',
          boxShadow: [
            active ? '5px 0 26px rgba(0,0,0,0.8)' : '3px 0 14px rgba(0,0,0,0.7)',
            '0 0 0 1px color-mix(in srgb, var(--accent-2) 18%, transparent)',
            glow ? `0 0 ${glow.toFixed(0)}px var(--glow-cyan)` : '',
          ].filter(Boolean).join(', '),
          animation: 'vinyl-spin 1.8s linear infinite',
          animationPlayState: spinning ? 'running' : 'paused',
          overflow: 'hidden', position: 'relative',
          transition: 'box-shadow 0.12s ease',
        }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0 }}>
          {grooves.map(({ r, i }) => (
            <circle key={r} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={i % 2 ? 'rgba(255,255,255,0.03)' : 'color-mix(in srgb, var(--accent-2) 8%, transparent)'} strokeWidth="0.7" />
          ))}
        </svg>

        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 34% 28%, rgba(255,255,255,0.09) 0%, transparent 52%)' }} />

        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: labelSize, height: labelSize, borderRadius: '50%', overflow: 'hidden',
          boxShadow: '0 0 0 2px color-mix(in srgb, var(--accent) 40%, transparent)',
        }}>
          {coverArt
            ? <img src={coverArt} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${gradColors[0]}, ${gradColors[1]})` }} />}
        </div>

        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: spindle, height: spindle, borderRadius: '50%', background: '#000',
          boxShadow: '0 0 0 1.5px color-mix(in srgb, var(--accent-2) 60%, transparent)', zIndex: 5,
        }} />
      </div>
    </div>
  )
}

/* ─── Gradient placeholder cover ───────────────────────────────────── */
function GradientCover({ gradColors, genre }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: `linear-gradient(145deg, ${gradColors[0]} 0%, ${gradColors[1]} 100%)`,
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

/* ─── Bottom info overlay ──────────────────────────────────────────── */
function InfoOverlay({ title, artist, genre, active, variant, frame }) {
  const big = variant === 'big' || variant === 'hero'
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      padding: big ? `56px 22px ${frame + 8}px` : `40px ${frame + 5}px ${frame + 4}px`,
      background: 'linear-gradient(0deg, rgba(6,2,14,0.94) 0%, rgba(6,2,14,0.55) 55%, transparent 100%)',
      zIndex: 4, pointerEvents: 'none',
    }}>
      <p style={{
        fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
        fontSize: big ? 20 : 14, lineHeight: 1.2, marginBottom: 2,
        color: active ? 'var(--neon-magenta)' : '#ffffff',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {title}
      </p>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: big ? 12 : 9, color: 'rgba(255,255,255,0.72)', letterSpacing: '0.06em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {artist}{genre ? ` · ${genre}` : ''}
      </p>
    </div>
  )
}

/* ─── Centre play / pause ──────────────────────────────────────────── */
function PlayButton({ visible, playing, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={playing ? 'Pause' : 'Play'}
      style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -55%)',
        width: 52, height: 52, borderRadius: '50%',
        background: playing ? 'color-mix(in srgb, var(--accent) 95%, transparent)' : 'color-mix(in srgb, var(--card-2) 80%, transparent)',
        border: '2px solid var(--neon-magenta)',
        boxShadow: '0 0 18px var(--glow-magenta)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', zIndex: 6, backdropFilter: 'blur(4px)',
        opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.18s ease, background 0.18s ease',
      }}
    >
      {playing
        ? <svg width="14" height="16" viewBox="0 0 14 16" fill="var(--on-accent)"><path d="M0 0h4v16H0zM9 0h4v16H9z" /></svg>
        : <svg width="14" height="16" viewBox="0 0 14 16" fill="var(--accent)" style={{ marginLeft: 2 }}><path d="M0 0l13 8L0 16z" /></svg>}
    </button>
  )
}

function PlayingPulse() {
  return (
    <div style={{
      position: 'absolute', top: 12, right: 14, width: 9, height: 9, borderRadius: '50%',
      background: 'var(--neon-magenta)', boxShadow: '0 0 8px 3px var(--glow-magenta)',
      animation: 'pulse 1.2s ease-in-out infinite', zIndex: 6, pointerEvents: 'none',
    }} />
  )
}

function ZoomHint() {
  return (
    <div style={{
      position: 'absolute', top: 16, left: 16, width: 30, height: 30, borderRadius: '50%',
      background: 'color-mix(in srgb, var(--card-2) 70%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-2) 40%, transparent)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)', zIndex: 6, pointerEvents: 'none', color: 'var(--neon-cyan)',
    }}>
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
        <path d="M11.7 10.3a6.5 6.5 0 1 0-1.4 1.4l3.9 3.85a1 1 0 0 0 1.4-1.4l-3.85-3.85zM6.5 12a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11zM7.5 5v2.5H5v1h2.5V11h1V8.5H11v-1H8.5V5z" />
      </svg>
    </div>
  )
}
