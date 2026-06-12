import { Link } from 'react-router-dom'
import { Pause, Play } from 'lucide-react'
import { usePlayerStore } from '../../store/playerStore'
import { CrateToggle } from '../ui/CrateToggle'
import { fmtDuration } from '../../data/tracks'

/* A record sleeve on the shelf: full-bleed cover art with ring wear and
   paper grain, the vinyl itself peeking out of the jacket on hover.
   `onPlay` is provided by the page so the queue matches the visible list. */
export function SleeveCard({ track, catNo, onPlay }) {
  const isCurrent = usePlayerStore((s) => s.currentTrack?.id === track.id)
  const isPlaying = usePlayerStore((s) => s.isPlaying && s.currentTrack?.id === track.id)
  const pause = usePlayerStore((s) => s.pause)

  function handlePlay(e) {
    e.preventDefault()
    e.stopPropagation()
    if (isPlaying) pause()
    else onPlay(track)
  }

  return (
    <div className="group relative">
      {/* vinyl sliding out of the jacket */}
      <div
        className="grooves absolute inset-0 rounded-full border border-bg-deep transition-transform duration-500 ease-out md:group-hover:translate-x-[16%]"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-1/2 flex h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-oxblood">
          <div className="h-[12%] w-[12%] rounded-full bg-bg-deep" />
        </div>
      </div>

      {/* the sleeve */}
      <Link
        to={`/track/${encodeURIComponent(track.id)}`}
        className="ring-wear noise-overlay relative block aspect-square overflow-hidden rounded-sm border border-line bg-surface-2 shadow-[0_16px_22px_-14px_rgba(0,0,0,0.8)] transition-transform duration-500 ease-out md:group-hover:-translate-x-[5%]"
      >
        {track.coverArt ? (
          <img
            src={track.coverArt}
            alt={`${track.title} cover art`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-2 p-4 text-center">
            <span className="font-serif text-lg italic text-muted">{track.title}</span>
          </div>
        )}

        {/* catalog stamp */}
        {catNo && (
          <span className="absolute right-2 top-2 z-[2] rounded-sm bg-bg-deep/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-text/80">
            {catNo}
          </span>
        )}

        {/* now-spinning lamp */}
        {isCurrent && (
          <span
            className={`tube-glow absolute left-2 top-2 z-[2] h-2 w-2 rounded-full bg-accent ${isPlaying ? 'animate-pulse' : 'opacity-60'}`}
            title={isPlaying ? 'Now spinning' : 'On the platter'}
          />
        )}

        {/* hover controls */}
        <div className="absolute inset-x-0 bottom-0 z-[2] flex items-center justify-between bg-gradient-to-t from-bg-deep/90 to-transparent p-2.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          <button
            onClick={handlePlay}
            aria-label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-accent bg-accent text-on-accent shadow-[0_2px_6px_rgba(0,0,0,0.5)] transition-transform hover:scale-105"
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
          </button>
          <CrateToggle trackId={track.id} compact />
        </div>
      </Link>

      {/* spine label */}
      <div className="mt-3 px-0.5">
        <div className="truncate font-serif text-[15px] leading-snug text-text group-hover:text-accent">
          {track.title}
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            {track.genre || track.artist || '—'}
          </span>
          <span className="font-mono text-[10px] tabular-nums text-muted">
            {fmtDuration(track.duration)}
          </span>
        </div>
      </div>
    </div>
  )
}
