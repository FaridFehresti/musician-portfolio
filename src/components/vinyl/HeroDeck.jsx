import { useState } from 'react'
import { motion } from 'framer-motion'
import { usePlayerStore } from '../../store/playerStore'
import { HoloVinylCard } from './HoloVinylCard'

/**
 * HeroDeck — the interactive holographic deck on the home hero.
 * A fanned stack of cards (only the top one is "live"): click Play to start,
 * Shuffle riffles the deck and plays a random track, Next flips the top card
 * top-to-bottom and advances in order.
 */

const HERO_SIZE = 260
const VISIBLE = 5

function slot(i) {
  return {
    x: i * 13,
    y: i * 12,
    scale: 1 - i * 0.06,
    rotate: i * 1.6,
    rotateX: 0,
    opacity: i < VISIBLE ? 1 - i * 0.05 : 0,
    zIndex: 50 - i,
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
  const [order, setOrder] = useState(() => tracks.slice())
  const [flipping, setFlipping] = useState(false)
  const [riffling, setRiffling] = useState(false)

  const visible = order.slice(0, VISIBLE)
  const top = order[0]
  const topActive = currentTrack?.id === top?.id

  function playTrack(track, ord) {
    setQueue(ord || order)
    loadTrack(track)
  }

  function onTopPlay() {
    if (topActive) {
      if (isPlaying) pause()
      else play()
    } else {
      playTrack(top)
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 }}>
      <div style={{ position: 'relative', width: 460, height: 350 }}>
        {visible.map((track, i) => {
          const isTop = i === 0
          const target = riffling
            ? { x: (i - 2) * 74, y: 0, rotate: (i - 2) * 13, rotateX: 0, scale: 0.9, opacity: 1, zIndex: 50 - i }
            : isTop && flipping
              ? { x: 0, y: -32, rotateX: -94, scale: 0.94, opacity: 0, zIndex: 60 }
              : slot(i)

          return (
            <motion.div
              key={track.id}
              initial={false}
              animate={target}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              style={{ position: 'absolute', top: 30, left: 26, transformPerspective: 1100, transformStyle: 'preserve-3d' }}
            >
              <HoloVinylCard
                track={track}
                size={HERO_SIZE}
                variant="hero"
                diskEnabled={isTop}
                tiltEnabled={isTop && !flipping && !riffling}
                active={currentTrack?.id === track.id}
                playing={currentTrack?.id === track.id && isPlaying}
                showPlayButton={isTop}
                onPlay={isTop ? onTopPlay : () => playTrack(track)}
              />
            </motion.div>
          )
        })}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <DeckButton label="Shuffle" onClick={onShuffle}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4h2.5l7 8H14" /><path d="M2 12h2.5l2-2.3" /><path d="M9.5 5.3 11.5 4 14 4" />
            <path d="M12 2l2 2-2 2" /><path d="M12 10l2 2-2 2" />
          </svg>
          Shuffle
        </DeckButton>

        <motion.button
          onClick={onTopPlay}
          whileHover={{ scale: 1.08, backgroundColor: 'rgba(255,47,208,0.22)' }}
          whileTap={{ scale: 0.94 }}
          aria-label={topActive && isPlaying ? 'Pause' : 'Play'}
          style={{
            width: 64, height: 64, borderRadius: '50%',
            border: '2px solid var(--neon-magenta)',
            background: 'rgba(255,47,208,0.1)',
            color: 'var(--neon-magenta)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: topActive && isPlaying ? '0 0 24px var(--glow-magenta)' : '0 0 12px var(--glow-magenta)',
            transition: 'box-shadow 0.3s',
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
        padding: '9px 18px', borderRadius: 40,
        border: '1px solid rgba(0,229,255,0.4)',
        background: 'rgba(13,7,22,0.6)',
        color: 'rgba(0,229,255,0.85)',
        fontFamily: 'var(--font-mono)', fontSize: 11,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        cursor: 'pointer', backdropFilter: 'blur(6px)',
      }}
    >
      {children}
    </motion.button>
  )
}
