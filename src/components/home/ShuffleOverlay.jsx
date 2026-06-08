import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { DeckCard, CARD_W, CARD_H } from '../library/DeckCard'

/* ════════════════════════════════════════════════════════════════════════
   ShuffleStage — the "deal me a song" card trick, played IN the hero section
   (no full-screen overlay). It sits absolutely inside the CardTable box: the
   real deck fades out, the cards gather here, riffle-shuffle, spread into a
   hand, lift one, flip it face-up to reveal & play it, then it fades and the
   deck returns. Driven by a small timeline state machine.
   ════════════════════════════════════════════════════════════════════════ */

// [phase, duration ms] — plays top to bottom
const TIMELINE = [
  ['pile',    600],
  ['riffleA', 330], ['riffleB', 330], ['riffleA', 300], ['riffleB', 300],
  ['gather',  340],
  ['spread',  680],
  ['pick',    760],
  ['reveal', 1500],
  ['exit',    420],
]

function shuffled(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function ShuffleStage({ tracks, bp, onPick, onClose }) {
  const isMobile  = bp === 'mobile'
  const isTablet  = bp === 'tablet'
  const isDesktop = !isMobile && !isTablet
  // the hero has room — use big cards on desktop, tighten the fan so they fit
  const SCALE  = isMobile ? 0.5 : isTablet ? 0.64 : 0.84
  const W      = CARD_W * SCALE
  const H      = CARD_H * SCALE
  const SPREAD = W * (isMobile ? 0.44 : 0.5)
  const MAXN   = isMobile || isTablet ? 7 : 9

  // Chosen-card scale RELATIVE to the deck's base SCALE (1 = same as the rest).
  // Tuned per-breakpoint so the pick reads as a clear hero at every size —
  // small SCALE values need a bigger multiplier to land at a featured size.
  const PICK_SCALE   = isMobile ? 1.20 : isTablet ? 1.16 : 1.12
  const REVEAL_SCALE = isMobile ? 1.80 : isTablet ? 1.54 : 1.38

  const [deck]   = useState(() => shuffled(tracks).slice(0, Math.min(MAXN, tracks.length)))
  const [chosen] = useState(() => Math.floor(Math.random() * Math.min(MAXN, tracks.length)))
  const [pi, setPi] = useState(0)
  const phase = TIMELINE[pi][0]
  const n = deck.length
  const mid = (n - 1) / 2

  // run the timeline; play the chosen track as it flips face-up; close at the end
  useEffect(() => {
    const timers = []
    let t = 0
    let revealAt = 0
    TIMELINE.forEach(([name, dur], idx) => {
      timers.push(setTimeout(() => setPi(idx), t))
      if (name === 'reveal') revealAt = t
      t += dur
    })
    timers.push(setTimeout(() => onPick(deck[chosen]), revealAt + 140))
    timers.push(setTimeout(() => onClose(), t))
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function layout(i) {
    const t = i - mid
    const isC = i === chosen
    switch (phase) {
      case 'pile':    return { x: t * 1.5,  y: -i * 1.2,            rotate: t * 1.2,  rotateY: 0, scale: 1,    opacity: 1 }
      case 'riffleA': return { x: (i % 2 ? 1 : -1) * (W * 0.7), y: t * 5, rotate: (i % 2 ? 1 : -1) * 10, rotateY: 0, scale: 1, opacity: 1 }
      case 'riffleB': return { x: t * 3,    y: -Math.abs(t) * 3,    rotate: -t * 3.5, rotateY: 0, scale: 1,    opacity: 1 }
      case 'gather':  return { x: t * 1.2,  y: 0,                   rotate: t * 1,    rotateY: 0, scale: 1,    opacity: 1 }
      case 'spread':  return { x: t * SPREAD, y: t * t * 5,         rotate: t * 7,    rotateY: 0, scale: 1,    opacity: 1 }
      case 'pick':    return { x: t * SPREAD, y: t * t * 5 - (isC ? 78 : 0), rotate: isC ? 0 : t * 7, rotateY: 0, scale: isC ? PICK_SCALE : 1, opacity: isC ? 1 : 0.42 }
      case 'reveal':  return isC
        ? { x: 0, y: isMobile ? -6 : -16, rotate: 0, rotateY: 180, scale: REVEAL_SCALE, opacity: 1 }
        : { x: t * SPREAD * 1.15, y: 130, rotate: t * 12, rotateY: 0, scale: 0.86, opacity: 0 }
      case 'exit':
      default:        return { opacity: 0, scale: 0.92, y: 28, rotateY: isC ? 180 : 0 }
    }
  }

  const label = phase === 'reveal' || phase === 'exit' ? 'Your pick' : 'Shuffling the deck…'

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 30, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: isDesktop ? 40 : isTablet ? 28 : 20,
        // Solid stage — an opaque panel so the page no longer shows through
        // while the deck fades out. The radial accent rides on top of the fill.
        background:
          'radial-gradient(64% 60% at 50% 42%, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 72%),' +
          'linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 60%, var(--color-bg)) 0%, var(--color-bg) 100%)',
        border: '1px solid color-mix(in srgb, var(--accent) 24%, transparent)',
        boxShadow: 'inset 0 0 90px rgba(0,0,0,0.55), 0 30px 70px rgba(0,0,0,0.5)',
      }}
    >
      {/* fine inner frame to seat the cards on the solid stage */}
      <div style={{
        position: 'absolute', inset: 8, pointerEvents: 'none',
        borderRadius: isDesktop ? 32 : isTablet ? 22 : 14,
        border: '1px solid color-mix(in srgb, var(--neon-cyan) 14%, transparent)',
      }} />

      <motion.p
        key={label}
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'absolute', top: '3%', width: '100%', textAlign: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
          color: phase === 'reveal' ? 'var(--neon-magenta)' : 'var(--color-muted)',
          textShadow: phase === 'reveal' ? '0 0 18px var(--glow-magenta)' : 'none',
        }}
      >
        {label}
      </motion.p>

      <div style={{ position: 'relative', width: W, height: H, perspective: 1100 }} onClick={e => e.stopPropagation()}>
        {deck.map((track, i) => (
          <motion.div
            key={track.id}
            animate={layout(i)}
            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            style={{
              position: 'absolute', top: 0, left: 0, width: W, height: H,
              transformStyle: 'preserve-3d', zIndex: i === chosen ? 100 : i,
            }}
          >
            {/* back face (what you see while shuffling) */}
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
              <CardBack w={W} h={H} />
            </div>
            {/* face — only the chosen card needs the real card mounted */}
            {i === chosen && (
              <div style={{ position: 'absolute', inset: 0, transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                <div style={{ width: CARD_W, height: CARD_H, transform: `scale(${SCALE})`, transformOrigin: 'top left' }}>
                  <DeckCard track={track} index={tracks.indexOf(track)} allTracks={tracks} tiltEnabled={false} />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <p style={{
        position: 'absolute', bottom: '3%', width: '100%', textAlign: 'center',
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
        color: 'var(--color-muted)', opacity: 0.45,
      }}>
        tap to skip
      </p>
    </motion.div>
  )
}

/* ─── The card back — a synthwave deck back ─────────────────────────────── */
function CardBack({ w, h }) {
  const k = w / CARD_W
  return (
    <div style={{
      width: w, height: h, borderRadius: 20 * k, position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(130% 90% at 50% -16%, color-mix(in srgb, var(--accent) 34%, var(--card-1)) 0%, var(--card-1) 44%, var(--card-2) 100%)',
      boxShadow: '0 18px 34px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.05)',
    }}>
      {/* inner frame + diamond lattice */}
      <div style={{
        position: 'absolute', inset: 7 * k, borderRadius: 14 * k,
        border: `${Math.max(1, 1.2 * k)}px solid color-mix(in srgb, var(--neon-magenta) 45%, transparent)`,
        boxShadow: 'inset 0 0 18px color-mix(in srgb, var(--neon-magenta) 18%, transparent)',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.5,
          backgroundImage:
            `repeating-linear-gradient(45deg, transparent 0 ${9 * k}px, color-mix(in srgb, var(--neon-cyan) 16%, transparent) ${9 * k}px ${10 * k}px),` +
            `repeating-linear-gradient(-45deg, transparent 0 ${9 * k}px, color-mix(in srgb, var(--neon-cyan) 16%, transparent) ${9 * k}px ${10 * k}px)`,
        }} />
        {/* centre vinyl emblem */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={w * 0.46} height={w * 0.46} viewBox="0 0 100 100" aria-hidden>
            {[46, 38, 30, 22].map(r => (
              <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="color-mix(in srgb, var(--neon-magenta) 70%, transparent)" strokeWidth="1.1" opacity="0.85" />
            ))}
            <circle cx="50" cy="50" r="12" fill="color-mix(in srgb, var(--neon-cyan) 40%, transparent)" />
            <circle cx="50" cy="50" r="3.4" fill="var(--neon-magenta)" />
          </svg>
        </div>
      </div>
    </div>
  )
}
