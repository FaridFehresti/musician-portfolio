import { motion } from 'framer-motion'
import { usePlayerStore } from '../../store/playerStore'
import { HoloVinylCard } from '../vinyl/HoloVinylCard'

/* Layout constants consumed by Library grid + FeaturedCarousel.
   The sleeve is CARD_SIZE; DISK_SPACE reserves room for the disk that
   slides out to the right so the grid never shifts. */
export const CARD_SIZE    = 220
export const DISK_SIZE    = 200
export const DISK_SPACE   = 108
export const CARD_TOTAL_W = CARD_SIZE + DISK_SPACE  // 328px

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
      whileHover={{ y: -10, zIndex: 20 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={{ width: CARD_TOTAL_W, height: CARD_SIZE, position: 'relative', flexShrink: 0 }}
    >
      <HoloVinylCard
        track={track}
        index={index}
        size={CARD_SIZE}
        variant="grid"
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
