import { useState } from 'react'
import { motion } from 'framer-motion'
import { DeckCard, CARD_W, CARD_H } from '../library/DeckCard'
import { usePlayerStore } from '../../store/playerStore'
import { useBreakpoint } from '../../hooks/useViewport'

/* Home showcase — the real library music card, dealt into a hand.
   Desktop: three feature STACKS (click a buried card → it comes to the front
   AND plays) over three fanned RUNS of the same card, scaled down.
   Mobile / tablet: a clean swipeable carousel of the same cards. */

const SWAP = { type: 'spring', stiffness: 240, damping: 26, mass: 0.9 }

export function CardTable({ tracks }) {
  const { loadTrack, setQueue } = usePlayerStore()
  const bp = useBreakpoint()

  function play(track) {
    if (!track) return
    setQueue(tracks)
    loadTrack(track)
  }

  if (bp !== 'desktop') return <MobileDeck tracks={tracks} onPlay={play} />

  const stacks = [tracks.slice(0, 3), tracks.slice(3, 6), tracks.slice(6, 9)].map(c => c.filter(Boolean))
  const fans   = [tracks.slice(9, 12), tracks.slice(12, 15), tracks.slice(15, 18)].map(c => c.filter(Boolean))

  const reveal = { hidden: {}, visible: { transition: { staggerChildren: 0.14, delayChildren: 0.08 } } }

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 1180, margin: '0 auto', padding: '0 8px' }}>
      <div style={{
        position: 'absolute', inset: '-40px -20px', zIndex: 0, pointerEvents: 'none', borderRadius: 48,
        background: 'radial-gradient(120% 80% at 50% 30%, color-mix(in srgb, var(--accent) 11%, transparent) 0%, transparent 64%)',
      }} />

      <motion.div
        variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
        style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(34px, 5vw, 64px)' }}
      >
        {/* ── Top row: three feature stacks ──────────────────────────── */}
        <div style={{ display: 'flex', gap: 'clamp(14px, 2.5vw, 40px)', justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {stacks.map((group, i) => (
            <CardStack key={i} tracks={group} allTracks={tracks} startIndex={i * 3} baseScale={1} onPlay={play} />
          ))}
        </div>

        {/* ── Bottom row: three fanned runs of the same card ─────────── */}
        <div style={{ display: 'flex', gap: 'clamp(16px, 4vw, 60px)', justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {fans.map((group, i) => (
            <CardFan key={i} tracks={group} allTracks={tracks} startIndex={9 + i * 3} baseScale={0.62} onPlay={play} />
          ))}
        </div>
      </motion.div>
    </div>
  )
}

/* ═══ A stack of real cards — click behind → comes to front + plays ══ */
function CardStack({ tracks, allTracks, startIndex, baseScale, onPlay }) {
  // order[0] is the front card; clicking a buried card brings it forward
  const [order, setOrder] = useState(() => tracks.map((_, i) => i))
  const n = tracks.length
  const w = CARD_W * baseScale
  const h = CARD_H * baseScale

  const OX = 40, OY = 10, ROT = 5
  const select = (i, track) => {
    setOrder(prev => (prev[0] === i ? prev : [i, ...prev.filter(x => x !== i)]))
    onPlay(track)
  }

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 48, scale: 0.94 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 190, damping: 19 } } }}
      style={{ position: 'relative', width: w + OX * (n - 1), height: h + OY * (n - 1) }}
    >
      {tracks.map((track, i) => {
        const d = order.indexOf(i)            // 0 = front
        const isFront = d === 0
        return (
          <motion.div
            key={track.id}
            animate={{ x: d * OX, y: d * OY, rotate: d * ROT, scale: 1 - d * 0.05 }}
            transition={SWAP}
            style={{ position: 'absolute', top: 0, left: 0, width: w, height: h, zIndex: n - d, transformOrigin: 'center center' }}
          >
            <div style={{ width: CARD_W, height: CARD_H, transform: `scale(${baseScale})`, transformOrigin: 'top left' }}>
              <DeckCard track={track} index={startIndex + i} allTracks={allTracks} />
            </div>

            {/* buried cards catch the click → bring forward & play */}
            {!isFront && (
              <div
                onClick={() => select(i, track)}
                title={`Play “${track.title}”`}
                style={{ position: 'absolute', inset: 0, zIndex: 60, cursor: 'pointer', borderRadius: 20 * baseScale }}
              />
            )}
          </motion.div>
        )
      })}
    </motion.div>
  )
}

/* ═══ A fan of the same card, scaled down — spreads on hover ═════════ */
function CardFan({ tracks, allTracks, startIndex, baseScale }) {
  const [hovered, setHovered] = useState(false)
  const n = tracks.length
  const w = CARD_W * baseScale
  const h = CARD_H * baseScale

  const closed = w * 0.24
  const open = w * 0.56

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 22 } } }}
      style={{ position: 'relative', width: w + open * (n - 1), height: h + 22, display: 'flex', justifyContent: 'flex-start' }}
    >
      {tracks.map((track, i) => (
        <motion.div
          key={track.id}
          animate={{ x: i * (hovered ? open : closed), rotate: i * (hovered ? 6 : 3), y: hovered ? -4 : i * 3 }}
          whileHover={{ y: -16, scale: 1.05, zIndex: 40 }}
          transition={SWAP}
          style={{ position: 'absolute', top: 6, left: 0, width: w, height: h, zIndex: n - i, transformOrigin: 'bottom center' }}
        >
          <div style={{ width: CARD_W, height: CARD_H, transform: `scale(${baseScale})`, transformOrigin: 'top left' }}>
            <DeckCard track={track} index={startIndex + i} allTracks={allTracks} />
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

/* ═══ Mobile / tablet — a swipeable carousel of the real card ════════ */
function MobileDeck({ tracks, onPlay }) {
  const list = tracks.slice(0, 9).filter(Boolean)
  const half = Math.round(CARD_W / 2)
  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <div
        className="no-scrollbar"
        style={{
          display: 'flex', gap: 22, overflowX: 'auto', overflowY: 'visible',
          scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
          padding: '14px 0 22px', scrollPaddingInline: '50%',
        }}
      >
        {list.map((track, i) => (
          <div
            key={track.id}
            style={{
              flex: '0 0 auto', scrollSnapAlign: 'center', width: CARD_W,
              marginLeft: i === 0 ? `max(8px, calc(50% - ${half}px))` : 0,
              marginRight: i === list.length - 1 ? `max(8px, calc(50% - ${half}px))` : 0,
            }}
          >
            <DeckCard track={track} index={i} allTracks={tracks} tiltEnabled={false} />
          </div>
        ))}
      </div>
      <p style={{
        textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: 'var(--color-muted)', opacity: 0.5, marginTop: 2,
      }}>
        ‹ swipe ›
      </p>
    </div>
  )
}
