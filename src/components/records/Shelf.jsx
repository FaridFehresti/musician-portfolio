import { SleeveCard } from './SleeveCard'
import { catalogNumber } from '../../lib/catalog'
import { useContentStore } from '../../store/contentStore'

/* A run of sleeves on shelf rails. `onPlay(track)` comes from the page so
   the play queue always matches the list the visitor is looking at. */
export function Shelf({ tracks, onPlay, columns = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' }) {
  const allTracks = useContentStore((s) => s.tracks)

  if (!tracks.length) {
    return (
      <div className="rounded-sm border border-dashed border-line px-6 py-16 text-center">
        <p className="font-serif italic text-muted">Nothing in this crate yet.</p>
      </div>
    )
  }

  return (
    <div className={`grid gap-x-10 gap-y-12 ${columns}`}>
      {tracks.map((t) => (
        <SleeveCard key={t.id} track={t} catNo={catalogNumber(t.id, allTracks)} onPlay={onPlay} />
      ))}
    </div>
  )
}
