import { motion } from 'framer-motion'
import { usePlayerStore } from '../../store/playerStore'
import { HoloVinylCard } from '../vinyl/HoloVinylCard'

/* Square holographic card for the Library grid (the spinning disk lives on
   Now Playing; in a grid it just broke the column spacing). */
export const CARD_SIZE = 240

export function DeckCard({ track, index, allTracks, tiltEnabled = true }) {
  const {
    currentTrack, isPlaying, isPaused,
    loadTrack, setQueue, play, pause,
    currentTime, duration,
  } = usePlayerStore()

  const isActive = currentTrack?.id === track.id
  const progress = isActive && duration > 0 ? currentTime / duration : 0

  function handlePlay() {
    if (isActive) {
      if (isPlaying) pause()
      else play()
    } else {
      setQueue(allTracks)
      loadTrack(track)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -8, zIndex: 20 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={{ width: CARD_SIZE, height: CARD_SIZE, position: 'relative' }}
    >
      <HoloVinylCard
        track={track}
        index={index}
        size={CARD_SIZE}
        variant="grid"
        diskEnabled={false}
        active={isActive}
        playing={isActive && isPlaying}
        paused={isActive && isPaused}
        progress={progress}
        tiltEnabled={tiltEnabled}
        onPlay={handlePlay}
      />
    </motion.div>
  )
}
