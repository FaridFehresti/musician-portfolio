import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useContentStore } from '../store/contentStore'
import { useFavoritesStore } from '../store/favoritesStore'
import { usePlayFrom } from '../hooks/usePlayFrom'
import { SectionHeading } from '../components/ui/SectionHeading'
import { GenreDividers, CRATE } from '../components/records/GenreDividers'
import { Shelf } from '../components/records/Shelf'

/* The Shelf — the full discography, browsed like crates in a record shop. */
export default function Records() {
  const tracks = useContentStore((s) => s.tracks)
  const genres = useContentStore((s) => s.genres)
  const crateIds = useFavoritesStore((s) => s.ids)

  const [active, setActive] = useState('All')
  const [query, setQuery] = useState('')

  const shelfTracks = useMemo(
    () => tracks.filter((t) => t.inLibrary && t.published !== false),
    [tracks]
  )

  const genreTabs = useMemo(
    () => (genres.includes('All') ? genres : ['All', ...genres]),
    [genres]
  )

  const visible = useMemo(() => {
    let list = shelfTracks
    if (active === CRATE) list = list.filter((t) => crateIds.includes(t.id))
    else if (active !== 'All') list = list.filter((t) => t.genre === active)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((t) =>
        [t.title, t.artist, t.album, t.genre].some((f) => f && f.toLowerCase().includes(q))
      )
    }
    return list
  }, [shelfTracks, active, query, crateIds])

  const playFrom = usePlayFrom(visible)

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <SectionHeading
        overline={`${shelfTracks.length} pressings in stock`}
        title="The Shelf"
        right={
          <label className="flex items-center gap-2 rounded-sm border border-line bg-surface px-3 py-2 focus-within:border-brass">
            <Search size={13} className="text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Dig through the crates…"
              className="w-36 bg-transparent font-mono text-xs text-text placeholder:text-muted focus:outline-none sm:w-52"
            />
          </label>
        }
      />

      <GenreDividers
        genres={genreTabs}
        active={active}
        onChange={setActive}
        crateCount={crateIds.length}
      />

      <div className="rounded-b-md rounded-tr-md border border-line bg-surface/40 p-4 sm:p-6">
        <Shelf tracks={visible} onPlay={playFrom} />
      </div>
    </div>
  )
}
