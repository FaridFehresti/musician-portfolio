import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ExternalLink, Play } from 'lucide-react'
import { useContentStore } from '../store/contentStore'
import { usePlayFrom } from '../hooks/usePlayFrom'
import { catalogNumber } from '../lib/catalog'
import { fmtDuration } from '../data/tracks'
import { AnalogButton } from '../components/ui/AnalogButton'
import { StampTag } from '../components/ui/StampTag'
import { CrateToggle } from '../components/ui/CrateToggle'
import { ShareButton } from '../components/ui/ShareButton'
import { TrackRow } from '../components/records/TrackRow'

/* The Pressing — one record pulled out of its sleeve, liner notes and all.
   Route path /track/:id is load-bearing: the server decorates it with OG
   tags for share-card unfurls. */
export default function Track() {
  const { id } = useParams()
  const tracks = useContentStore((s) => s.tracks)
  const loaded = useContentStore((s) => s.loaded)

  const track = useMemo(() => tracks.find((t) => t.id === id), [tracks, id])

  const shelf = useMemo(
    () => tracks.filter((t) => t.inLibrary && t.published !== false),
    [tracks]
  )
  const moreFromShelf = useMemo(() => {
    if (!track) return []
    const sameGenre = shelf.filter((t) => t.id !== track.id && t.genre && t.genre === track.genre)
    const others = shelf.filter((t) => t.id !== track.id && (!t.genre || t.genre !== track.genre))
    return [...sameGenre, ...others].slice(0, 5)
  }, [shelf, track])

  const playFrom = usePlayFrom(shelf.length ? shelf : tracks)

  if (!loaded) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center md:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">Pulling the record…</p>
      </div>
    )
  }

  if (!track) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center md:px-6">
        <h1 className="font-display text-3xl uppercase tracking-wide text-text">Not in the catalogue</h1>
        <p className="mt-3 font-serif italic text-muted">This pressing may have been pulled from the shelf.</p>
        <div className="mt-8">
          <AnalogButton variant="outline" as={Link} to="/records">Back to the shelf</AnalogButton>
        </div>
      </div>
    )
  }

  const catNo = catalogNumber(track.id, tracks)

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <div className="grid items-start gap-10 lg:grid-cols-2">
        {/* the sleeve */}
        <div className="group relative mx-auto w-full max-w-lg">
          <div
            className="grooves absolute inset-0 rounded-full border border-bg-deep transition-transform duration-500 md:group-hover:translate-x-[12%]"
            aria-hidden="true"
          >
            <div className="absolute left-1/2 top-1/2 h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-oxblood" />
          </div>
          <div className="ring-wear noise-overlay relative aspect-square overflow-hidden rounded-sm border border-line bg-surface-2 shadow-[0_28px_40px_-20px_rgba(0,0,0,0.85)] transition-transform duration-500 md:group-hover:-translate-x-[4%]">
            {track.coverArt ? (
              <img src={track.coverArt} alt={`${track.title} cover art`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center p-8 text-center">
                <span className="font-serif text-2xl italic text-muted">{track.title}</span>
              </div>
            )}
          </div>
        </div>

        {/* pressing info */}
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <StampTag tone="oxblood" tilt>{catNo}</StampTag>
            {track.genre && <StampTag tone="amber">{track.genre}</StampTag>}
            {track.year ? <StampTag>{track.year}</StampTag> : null}
          </div>

          <h1 className="font-serif text-4xl leading-tight text-text md:text-5xl">{track.title}</h1>
          {track.artist && (
            <div className="mt-3 font-mono text-xs uppercase tracking-[0.22em] text-muted">
              {track.artist}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <AnalogButton onClick={() => playFrom(track)}>
              <Play size={14} /> Drop the needle
            </AnalogButton>
            <CrateToggle trackId={track.id} />
            <ShareButton track={track} />
          </div>

          {/* pressing details */}
          <dl className="mt-10 border-t border-line">
            {[
              ['Catalog №', catNo],
              ['Album', track.album],
              ['Genre', track.genre],
              ['Year', track.year || null],
              ['Runtime', fmtDuration(track.duration)],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between border-b border-line/50 py-3">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">{k}</dt>
                  <dd className="font-serif text-sm text-text">{v}</dd>
                </div>
              ))}
          </dl>

          {track.video && (
            <a
              href={track.video}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted hover:text-accent"
            >
              <ExternalLink size={13} /> Watch the tape
            </a>
          )}
        </div>
      </div>

      {/* more from the shelf */}
      {moreFromShelf.length > 0 && (
        <div className="mt-20">
          <div className="mb-4 border-b border-line pb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
            More from the shelf
          </div>
          <div className="rounded-md border border-line bg-surface/40">
            {moreFromShelf.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} onPlay={playFrom} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
