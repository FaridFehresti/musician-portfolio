import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DeckCard, CARD_TOTAL_W } from './DeckCard'
import { usePlayerStore } from '../../store/playerStore'

const CARD_W  = CARD_TOTAL_W  // 328px — sleeve + disk space
const GAP     = 20             // gap between cards
const STRIDE  = CARD_W + GAP  // 348px

// Visual style per slot position (-2 … +2)
const SLOT = {
  '-2': { scale: 0.66, opacity: 0.18, z: 1 },
  '-1': { scale: 0.83, opacity: 0.52, z: 5 },
   '0': { scale: 1.00, opacity: 1.00, z: 10 },
   '1': { scale: 0.83, opacity: 0.52, z: 5 },
   '2': { scale: 0.66, opacity: 0.18, z: 1 },
}

export function FeaturedCarousel({ tracks, allTracks }) {
  const [idx,    setIdx]    = useState(0)
  const [paused, setPaused] = useState(false)
  const resumeRef           = useRef(null)
  const n = tracks.length
  const currentTrack = usePlayerStore(s => s.currentTrack)

  /* ── Auto-advance ── stops for good once the user plays a track ──── */
  useEffect(() => {
    if (paused || n < 2 || currentTrack) return
    const id = setInterval(() => setIdx(i => (i + 1) % n), 4500)
    return () => clearInterval(id)
  }, [paused, n, currentTrack])

  /* ── Pause + auto-resume after 3 s of no interaction ──────────── */
  function interact() {
    setPaused(true)
    clearTimeout(resumeRef.current)
    resumeRef.current = setTimeout(() => setPaused(false), 3000)
  }

  function go(d) {
    interact()
    setIdx(i => ((i + d) % n + n) % n)
  }

  const focused = tracks[idx]

  return (
    <div
      className="relative w-full rounded-2xl overflow-visible"
      style={{ padding: '52px 0 48px' }}
      onMouseEnter={interact}
    >
      {/* ── Blurred cover-art background ───────────────────────────── */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{ zIndex: 0 }}>
        <AnimatePresence>
          <motion.div
            key={focused?.id ?? 'none'}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1,  scale: 1    }}
            exit={{   opacity: 0,  scale: 0.96  }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
            style={{
              position:           'absolute',
              inset:              -80,
              backgroundImage:    focused?.coverArt ? `url(${focused.coverArt})` : 'none',
              backgroundColor:    focused?.coverArt ? undefined : '#140a22',
              backgroundSize:     'cover',
              backgroundPosition: 'center',
              filter:             'blur(34px) saturate(0.9) brightness(0.62)',
            }}
          />
        </AnimatePresence>
        {/* Scrim so text stays readable */}
        <div style={{
          position:   'absolute', inset: 0,
          background: 'rgba(11,6,18,0.4)',
        }} />
        {/* Vignette on sides + bottom so cards/labels stay readable */}
        <div style={{
          position:   'absolute', inset: 0,
          background: 'linear-gradient(90deg, rgba(11,6,18,0.92) 0%, transparent 24%, transparent 76%, rgba(11,6,18,0.92) 100%)',
        }} />
        <div style={{
          position:   'absolute', inset: 0,
          background: 'linear-gradient(0deg, rgba(11,6,18,0.85) 0%, transparent 38%)',
        }} />
      </div>

      {/* ── Cards ──────────────────────────────────────────────────── */}
      <div
        className="relative"
        style={{
          height:   220 + 40,   /* card height + breathing room */
          zIndex:   1,
          overflow: 'visible',
        }}
      >
        {tracks.map((track, i) => {
          /* Normalised offset: –floor(n/2) … +floor(n/2) */
          const raw    = ((i - idx) % n + n) % n
          const offset = raw > Math.floor(n / 2) ? raw - n : raw
          if (Math.abs(offset) > 2) return null

          const slot = SLOT[String(offset)]
          const xPx  = offset * STRIDE

          return (
            <motion.div
              key={track.id}
              animate={{
                x:       xPx,
                scale:   slot.scale,
                opacity: slot.opacity,
              }}
              transition={{ type: 'spring', stiffness: 220, damping: 28 }}
              onClick={offset !== 0 ? () => go(Math.sign(offset)) : undefined}
              style={{
                position:        'absolute',
                left:            '50%',
                marginLeft:      -(CARD_W / 2),
                top:             '50%',
                marginTop:       -(220 / 2),  /* card HEIGHT is 220, not CARD_W */
                zIndex:          slot.z,
                cursor:          offset !== 0 ? 'pointer' : 'default',
                pointerEvents:   slot.opacity < 0.1 ? 'none' : 'auto',
              }}
            >
              <DeckCard
                track={track}
                index={i}
                allTracks={allTracks}
                tiltEnabled={offset === 0}
              />
            </motion.div>
          )
        })}
      </div>

      {/* ── Arrow buttons ──────────────────────────────────────────── */}
      <CarouselArrow dir="left"  onClick={() => go(-1)} />
      <CarouselArrow dir="right" onClick={() => go(1)}  />

      {/* ── Focused track name (below cards) ───────────────────────── */}
      <div className="relative text-center mt-4" style={{ zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={focused?.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{   opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            {focused && (
              <>
                <p style={{
                  fontFamily:   'var(--font-display)',
                  fontStyle:    'italic',
                  fontSize:     20,
                  fontWeight:   700,
                  color:        'var(--color-text)',
                  marginBottom: 2,
                }}>
                  {focused.title}
                </p>
                <p style={{
                  fontFamily:   'var(--font-mono)',
                  fontSize:     11,
                  color:        'var(--color-muted)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}>
                  {focused.genre}
                  <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
                  {focused.bpm} BPM
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Dot indicators ─────────────────────────────────────── */}
        <div className="flex justify-center gap-2 mt-5">
          {tracks.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => { setIdx(i); interact() }}
              animate={{
                width:      i === idx ? 22 : 6,
                background: i === idx ? '#ff2fd0' : 'rgba(255,47,208,0.25)',
              }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              style={{
                height:       6,
                borderRadius: 3,
                border:       'none',
                cursor:       'pointer',
                padding:      0,
              }}
            />
          ))}
        </div>

        {/* Pause indicator (only while autoplay is still in effect) */}
        {paused && !currentTrack && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              fontFamily:   'var(--font-mono)',
              fontSize:     9,
              color:        'rgba(0,229,255,0.4)',
              marginTop:    8,
              letterSpacing: '0.1em',
            }}
          >
            PAUSED — RESUMING SOON
          </motion.p>
        )}
      </div>
    </div>
  )
}

function CarouselArrow({ dir, onClick }) {
  const isLeft = dir === 'left'
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.15, opacity: 1 }}
      whileTap={{ scale: 0.9 }}
      style={{
        position:       'absolute',
        top:            '50%',
        [isLeft ? 'left' : 'right']: 12,
        transform:      'translateY(-50%)',
        zIndex:         20,
        width:          40,
        height:         40,
        borderRadius:   '50%',
        background:     'rgba(13,7,22,0.65)',
        border:         '1px solid rgba(0,229,255,0.3)',
        color:          'rgba(0,229,255,0.8)',
        cursor:         'pointer',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        opacity:        0.7,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        {isLeft
          ? <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          : <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        }
      </svg>
    </motion.button>
  )
}
