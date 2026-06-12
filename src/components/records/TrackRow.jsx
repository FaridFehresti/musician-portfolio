import { Pause, Play } from 'lucide-react'
import { usePlayerStore } from '../../store/playerStore'
import { fmtDuration } from '../../data/tracks'

/* Compact tracklist row — liner-notes style: position, title, runtime. */
export function TrackRow({ track, index, onPlay }) {
  const isCurrent = usePlayerStore((s) => s.currentTrack?.id === track.id)
  const isPlaying = usePlayerStore((s) => s.isPlaying && s.currentTrack?.id === track.id)
  const pause = usePlayerStore((s) => s.pause)

  return (
    <button
      onClick={() => (isPlaying ? pause() : onPlay(track))}
      className={`group flex w-full items-center gap-4 border-b border-line/50 px-3 py-3 text-left transition-colors hover:bg-surface ${
        isCurrent ? 'bg-surface' : ''
      }`}
    >
      <span className="w-7 shrink-0 font-mono text-[11px] tabular-nums text-muted">
        {isCurrent ? (
          isPlaying ? <Pause size={12} className="text-accent" /> : <Play size={12} className="text-accent" />
        ) : (
          <>
            <span className="group-hover:hidden">{String(index + 1).padStart(2, '0')}</span>
            <Play size={12} className="hidden group-hover:inline" />
          </>
        )}
      </span>
      <span className={`min-w-0 flex-1 truncate font-serif text-sm ${isCurrent ? 'text-accent' : 'text-text'}`}>
        {track.title}
      </span>
      {track.genre && (
        <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-muted sm:inline">
          {track.genre}
        </span>
      )}
      <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">
        {fmtDuration(track.duration)}
      </span>
    </button>
  )
}
