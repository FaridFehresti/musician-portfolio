import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DeckCard, CARD_W, CARD_H } from '../library/DeckCard'
import { ShuffleStage } from './ShuffleOverlay'
import { usePlayerStore } from '../../store/playerStore'
import { useContentStore } from '../../store/contentStore'
import { useBreakpoint } from '../../hooks/useViewport'
import { HOME_SLOTS, groupBySlot } from '../../lib/homeSlots'

/* Home showcase — the real library music card, dealt into a hand.
   EVERY track gets a card (dealt in order), and the queue is that same order,
   so the player's Next/Prev always walk to the next card — and the playing
   card surfaces + lights up. A Shuffle button plays the card-trick in place,
   right inside this section (the deck fades while it runs). */

const SWAP = { type: 'spring', stiffness: 240, damping: 26, mass: 0.9 }

export function CardTable({ tracks }) {
  const { loadTrack, setQueue, currentTrack } = usePlayerStore()
  const bp = useBreakpoint()
  const [shuffling, setShuffling] = useState(false)
  const isDesktop = bp === 'desktop'
  // Optional genre label per pile, set in the CMS (Music → Home deck arrangement).
  const slotLabels = useContentStore(s => s.site?.homeSlots) || {}

  function play(track, queue) {
    if (!track) return
    // Default queue is the dealt order so Next/Prev follow the cards. The
    // shuffle passes its own bounded random hand so playback stays within that
    // hand instead of walking the entire library.
    setQueue(queue && queue.length ? queue : tracks)
    loadTrack(track)
  }

  // Tracks are grouped into the fixed home slots (3 stacks + 3 fans),
  // arranged in the CMS. `ordered` is the flat visual order (for numbering
  // + the play queue); empty slots simply don't render.
  const { bySlot, ordered, startIndex } = groupBySlot(tracks)
  const stackSlots = HOME_SLOTS.filter(s => s.kind === 'stack')
  const fanSlots   = HOME_SLOTS.filter(s => s.kind === 'fan')

  // Only ONE stack is spread at a time: the one holding the playing track.
  // Playing a card in another stack moves the active key here, so the previous
  // stack collapses (open-one / close-others) and the three stacks stay narrow
  // enough to share a single row no matter how many cards are added.
  const activeStackKey = stackSlots.find(s => bySlot[s.key].some(t => t.id === currentTrack?.id))?.key || null

  const reveal = { hidden: {}, visible: { transition: { staggerChildren: 0.14, delayChildren: 0.08 } } }

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: isDesktop ? 1180 : '100%', margin: '0 auto', padding: isDesktop ? '0 8px' : 0 }}>
      {isDesktop && (
        <div style={{
          position: 'absolute', inset: '-40px -20px', zIndex: 0, pointerEvents: 'none', borderRadius: 48,
          background: 'radial-gradient(120% 80% at 50% 30%, color-mix(in srgb, var(--accent) 11%, transparent) 0%, transparent 64%)',
        }} />
      )}

      {/* the deck — fades out so the shuffle can play in its place */}
      <div style={{
        position: 'relative', zIndex: 1,
        opacity: shuffling ? 0 : 1, transition: 'opacity 0.4s ease',
        pointerEvents: shuffling ? 'none' : 'auto',
      }}>
        <motion.div
          variants={reveal} initial="hidden" animate="visible"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isDesktop ? 'clamp(24px, 4vw, 48px)' : 16 }}
        >
          <DeckToolbar onShuffle={() => setShuffling(true)} />

          {isDesktop ? (
            <>
              {/* Top row: stacks — nowrap so they always stay on one line;
                  compactness comes from only one stack being open at a time. */}
              <div style={{ display: 'flex', gap: 'clamp(14px, 2.5vw, 40px)', justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                {stackSlots.filter(s => bySlot[s.key].length).map(s => (
                  <PileColumn key={s.key} label={slotLabels[s.key]} reserve={stackSlots.some(x => bySlot[x.key].length && slotLabels[x.key])}>
                    <CardStack tracks={bySlot[s.key]} allTracks={ordered} startIndex={startIndex[s.key]} baseScale={1} onPlay={play} currentTrack={currentTrack} open={s.key === activeStackKey} />
                  </PileColumn>
                ))}
              </div>

              {/* Bottom row: fans */}
              <div style={{ display: 'flex', gap: 'clamp(16px, 4vw, 60px)', justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {fanSlots.filter(s => bySlot[s.key].length).map(s => (
                  <PileColumn key={s.key} label={slotLabels[s.key]} reserve={fanSlots.some(x => bySlot[x.key].length && slotLabels[x.key])}>
                    <CardFan tracks={bySlot[s.key]} allTracks={ordered} startIndex={startIndex[s.key]} baseScale={0.62} currentTrack={currentTrack} />
                  </PileColumn>
                ))}
              </div>
            </>
          ) : (
            <MobileDeck tracks={ordered} />
          )}
        </motion.div>
      </div>

      {/* shuffle plays right here in the section — no full-screen layer */}
      <AnimatePresence>
        {shuffling && (
          <ShuffleStage tracks={tracks} bp={bp} onPick={play} onClose={() => setShuffling(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ═══ Shuffle button ════════════════════════════════════════════════════ */
function DeckToolbar({ onShuffle }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <motion.button
        onClick={onShuffle}
        whileHover={{ scale: 1.05, backgroundColor: 'color-mix(in srgb, var(--accent) 16%, transparent)' }}
        whileTap={{ scale: 0.96 }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 9, padding: '9px 18px',
          borderRadius: 999, cursor: 'pointer',
          border: '1px solid color-mix(in srgb, var(--neon-magenta) 55%, transparent)',
          background: 'color-mix(in srgb, var(--neon-magenta) 8%, transparent)',
          color: 'var(--neon-magenta)', fontFamily: 'var(--font-mono)', fontSize: 11,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          boxShadow: '0 0 18px color-mix(in srgb, var(--neon-magenta) 22%, transparent)',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 3h5v5" /><path d="M4 20 21 3" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" />
        </svg>
        Shuffle &amp; deal
      </motion.button>
    </div>
  )
}

/* ═══ A pile + its optional genre label (set in the CMS) ════════════════
   `reserve` keeps every pile in a row vertically aligned: when ANY pile in
   the row is labelled, unlabelled ones render an invisible placeholder of the
   same height so their card tops still line up. */
function PileColumn({ label, reserve, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      {(label || reserve) && (
        <span
          aria-hidden={!label}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--color-accent)', whiteSpace: 'nowrap', padding: '4px 13px', borderRadius: 999,
            background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent) 32%, transparent)',
            visibility: label ? 'visible' : 'hidden',
          }}
        >
          {label || '—'}
        </span>
      )}
      {children}
    </div>
  )
}

/* ═══ A stack of real cards ══════════════════════════════════════════════
   COLLAPSED — only the top card (#1) shows, the rest hidden directly behind
   it, and the box reserves just a single card's footprint. OPEN (driven by
   CardTable: this stack holds the playing track) springs into a fanned pile.
   Only one stack is open at a time, so the row stays compact; playing a card
   in another stack collapses this one again. Once open the front card is the
   active one (so Next/Prev surface the playing card) and clicking a buried
   card plays it. */
function CardStack({ tracks, allTracks, startIndex, baseScale, onPlay, currentTrack, open }) {
  const n = tracks.length
  const w = CARD_W * baseScale
  const h = CARD_H * baseScale
  const OX = 40, OY = 10, ROT = 5

  const activeLocal = tracks.findIndex(t => t.id === currentTrack?.id)
  const front = activeLocal >= 0 ? activeLocal : 0
  const displayOrder = [front, ...tracks.map((_, i) => i).filter(i => i !== front)]

  // The inner stage shrinks to one card when collapsed and grows to the full
  // fanned spread only when open. The front card is anchored top-left
  // (x:0/y:0) so it barely shifts as the box resizes; the width/height ease
  // keeps the reflow smooth instead of snapping.
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 48, scale: 0.94 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 190, damping: 19 } } }}
      style={{ position: 'relative' }}
    >
      <div
        style={{
          position: 'relative',
          width:  open ? w + OX * (n - 1) : w,
          height: open ? h + OY * (n - 1) : h,
          transition: 'width 0.45s cubic-bezier(0.16,1,0.3,1), height 0.45s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {tracks.map((track, i) => {
          const d = displayOrder.indexOf(i)     // 0 = front
          const isFront = d === 0
          return (
            <motion.div
              key={track.id}
              animate={open
                ? { x: d * OX, y: d * OY, rotate: d * ROT, scale: 1 - d * 0.05, opacity: 1 }
                : { x: 0, y: 0, rotate: 0, scale: 1, opacity: isFront ? 1 : 0 }}
              transition={SWAP}
              style={{ position: 'absolute', top: 0, left: 0, width: w, height: h, zIndex: n - d, transformOrigin: 'center center' }}
            >
              <div style={{ width: CARD_W, height: CARD_H, transform: `scale(${baseScale})`, transformOrigin: 'top left' }}>
                <DeckCard track={track} index={startIndex + i} allTracks={allTracks} />
              </div>

              {/* buried cards catch the click → play (which surfaces them);
                  inert while collapsed so only the top card #1 is playable */}
              {!isFront && (
                <div
                  onClick={() => onPlay(track)}
                  title={`Play “${track.title}”`}
                  style={{ position: 'absolute', inset: 0, zIndex: 60, cursor: 'pointer', borderRadius: 20 * baseScale, pointerEvents: open ? 'auto' : 'none' }}
                />
              )}
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

/* ═══ A fan of the same card, scaled down — spreads on hover ═════════════ */
function CardFan({ tracks, allTracks, startIndex, baseScale, currentTrack }) {
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
      style={{ position: 'relative', width: w + open * (n - 1), height: h + 28, display: 'flex', justifyContent: 'flex-start' }}
    >
      {tracks.map((track, i) => {
        const isActive = track.id === currentTrack?.id
        return (
          <motion.div
            key={track.id}
            animate={{
              x: i * (hovered ? open : closed),
              rotate: i * (hovered ? 6 : 3),
              y: isActive ? -16 : (hovered ? -4 : i * 3),
            }}
            whileHover={{ y: -16, scale: 1.05, zIndex: 40 }}
            transition={SWAP}
            style={{ position: 'absolute', top: 6, left: 0, width: w, height: h, zIndex: isActive ? 45 : n - i, transformOrigin: 'bottom center' }}
          >
            <div style={{ width: CARD_W, height: CARD_H, transform: `scale(${baseScale})`, transformOrigin: 'top left' }}>
              <DeckCard track={track} index={startIndex + i} allTracks={allTracks} />
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

/* ═══ Mobile / tablet — a swipeable carousel of every card ═══════════════ */
function MobileDeck({ tracks }) {
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
        {tracks.map((track, i) => (
          <div
            key={track.id}
            style={{
              flex: '0 0 auto', scrollSnapAlign: 'center', width: CARD_W,
              marginLeft: i === 0 ? `max(8px, calc(50% - ${half}px))` : 0,
              marginRight: i === tracks.length - 1 ? `max(8px, calc(50% - ${half}px))` : 0,
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
