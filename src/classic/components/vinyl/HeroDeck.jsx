import { useState } from 'react'
import { motion } from 'framer-motion'
import { usePlayerStore } from '../../../store/playerStore'
import { useBreakpoint } from '../../../hooks/useViewport'
import { HoloVinylCard } from './HoloVinylCard'

/**
 * HeroDeck — interactive holographic coverflow on the home hero.
 * Focused card front-and-centre; the rest fan out symmetrically left/right
 * behind it. Click any card to bring it to focus (springs to centre);
 * Shuffle riffles; Next flips the top card. Fully responsive — shrinks and
 * narrows the fan on tablet/mobile so it never overflows.
 */

const LAYOUT = {
  desktop: { size: 300, visible: 5, step1: 122, stepN: 112, riffle: 150, disk: 0.42 },
  tablet:  { size: 250, visible: 5, step1: 100, stepN: 92,  riffle: 124, disk: 0.4 },
  mobile:  { size: 196, visible: 3, step1: 56,  stepN: 0,   riffle: 70,  disk: 0.3 },
}

function slot(i, L) {
  if (i === 0) return { x: 0, y: 0, scale: 1, rotate: 0, rotateX: 0, opacity: 1, zIndex: 50 }
  const depth = Math.ceil(i / 2)
  const dir = i % 2 === 1 ? 1 : -1
  return {
    x: dir * (L.step1 + (depth - 1) * L.stepN),
    y: depth * 4,
    scale: 1 - depth * 0.1,
    rotate: dir * depth * 5,
    rotateX: 0,
    opacity: Math.max(0.3, 1 - depth * 0.32),
    zIndex: 50 - depth,
  }
}

function shuffleArray(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function HeroDeck({ tracks }) {
  const { currentTrack, isPlaying, setQueue, loadTrack, play, pause } = usePlayerStore()
  const bp = useBreakpoint()
  const L = LAYOUT[bp] || LAYOUT.desktop

  const [order, setOrder] = useState(() => tracks.slice())
  const [flipping, setFlipping] = useState(false)
  const [riffling, setRiffling] = useState(false)

  const visible = order.slice(0, L.visible)
  const top = order[0]
  const topActive = currentTrack?.id === top?.id

  function playTrack(track, ord) {
    setQueue(ord || order)
    loadTrack(track)
  }

  function clickCard(track) {
    if (order[0]?.id === track.id) {
      if (currentTrack?.id === track.id) {
        if (isPlaying) pause()
        else play()
      } else {
        playTrack(track)
      }
    } else {
      const newOrder = [track, ...order.filter(t => t.id !== track.id)]
      setOrder(newOrder)
      playTrack(track, newOrder)
    }
  }

  function onShuffle() {
    if (flipping || riffling || order.length < 2) return
    setRiffling(true)
    window.setTimeout(() => {
      const shuffled = shuffleArray(order)
      setOrder(shuffled)
      playTrack(shuffled[0], shuffled)
      setRiffling(false)
    }, 300)
  }

  function onNext() {
    if (flipping || riffling || order.length < 2) return
    setFlipping(true)
    window.setTimeout(() => {
      const newOrder = [...order.slice(1), order[0]]
      setOrder(newOrder)
      playTrack(newOrder[0], newOrder)
      setFlipping(false)
    }, 240)
  }

  const mid = Math.floor(L.visible / 2)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: bp === 'mobile' ? 24 : 34, width: '100%' }}>
      <div style={{ position: 'relative', width: '100%', height: L.size + (bp === 'mobile' ? 64 : 90) }}>
        {visible.map((track, i) => {
          const isTop = i === 0
          const target = riffling
            ? { x: (i - mid) * L.riffle, y: 0, rotate: (i - mid) * 11, rotateX: 0, scale: 0.9, opacity: 1, zIndex: 50 - Math.abs(i - mid) }
            : isTop && flipping
              ? { x: 0, y: -32, rotateX: -94, scale: 0.94, opacity: 0, zIndex: 60 }
              : slot(i, L)

          return (
            <motion.div
              key={track.id}
              initial={false}
              animate={target}
              transition={{ type: 'spring', stiffness: 240, damping: 26 }}
              style={{
                position: 'absolute',
                top: '50%', left: '50%',
                marginTop: -L.size / 2, marginLeft: -L.size / 2,
                transformPerspective: 1200, transformStyle: 'preserve-3d',
              }}
            >
              <HoloVinylCard
                track={track}
                size={L.size}
                variant="hero"
                diskEnabled={isTop && !flipping && !riffling && currentTrack?.id === track.id}
                diskReach={L.disk}
                tiltEnabled={isTop && !flipping && !riffling}
                active={currentTrack?.id === track.id}
                playing={currentTrack?.id === track.id && isPlaying}
                showPlayButton={isTop}
                onPlay={() => clickCard(track)}
              />
            </motion.div>
          )
        })}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <DeckButton label="Shuffle" onClick={onShuffle}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4h2.5l7 8H14" /><path d="M2 12h2.5l2-2.3" /><path d="M9.5 5.3 11.5 4 14 4" />
            <path d="M12 2l2 2-2 2" /><path d="M12 10l2 2-2 2" />
          </svg>
          Shuffle
        </DeckButton>

        <motion.button
          onClick={() => clickCard(top)}
          whileHover={{ scale: 1.08, backgroundColor: 'color-mix(in srgb, var(--accent) 22%, transparent)' }}
          whileTap={{ scale: 0.94 }}
          aria-label={topActive && isPlaying ? 'Pause' : 'Play'}
          style={{
            width: 64, height: 64, borderRadius: '50%',
            border: '2px solid var(--neon-magenta)',
            background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
            color: 'var(--neon-magenta)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: topActive && isPlaying ? '0 0 24px var(--glow-magenta)' : '0 0 12px var(--glow-magenta)',
            transition: 'box-shadow 0.3s', flexShrink: 0,
          }}
        >
          {topActive && isPlaying
            ? <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3h2v10H5V3zm4 0h2v10H9V3z" /></svg>
            : <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" style={{ marginLeft: 3 }}><path d="M5 3.5l9 4.5-9 4.5V3.5z" /></svg>}
        </motion.button>

        <DeckButton label="Next" onClick={onNext}>
          Next
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M11 3h2v10h-2V3zm-2 5L1 3v10l8-5z" /></svg>
        </DeckButton>
      </div>
    </div>
  )
}

function DeckButton({ label, onClick, children }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05, borderColor: 'var(--neon-cyan)', color: 'var(--neon-cyan)' }}
      whileTap={{ scale: 0.96 }}
      aria-label={label}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 16px', borderRadius: 40,
        border: '1px solid color-mix(in srgb, var(--accent-2) 40%, transparent)',
        background: 'color-mix(in srgb, var(--surface) 60%, transparent)',
        color: 'color-mix(in srgb, var(--accent-2) 85%, transparent)',
        fontFamily: 'var(--font-mono)', fontSize: 11,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        cursor: 'pointer', backdropFilter: 'blur(6px)', whiteSpace: 'nowrap',
      }}
    >
      {children}
    </motion.button>
  )
}
