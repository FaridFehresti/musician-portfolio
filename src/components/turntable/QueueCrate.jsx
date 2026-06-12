import { usePlayerStore } from '../../store/playerStore'
import { fmtDuration } from '../../data/tracks'

/* The records pulled for tonight, leaning in a crate next to the deck.
   Click a spine to drop it on the platter. */
export function QueueCrate({ className = '' }) {
  const queue = usePlayerStore((s) => s.queue)
  const queueIndex = usePlayerStore((s) => s.queueIndex)
  const loadTrack = usePlayerStore((s) => s.loadTrack)

  if (!queue.length) {
    return (
      <div className={`rounded-md border border-dashed border-line p-6 text-center ${className}`}>
        <p className="font-serif text-sm italic text-muted">
          The crate is empty — pull something off the shelf.
        </p>
      </div>
    )
  }

  return (
    <div className={`rounded-md border border-line bg-surface ${className}`}>
      <div className="border-b border-line px-4 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
        In the crate · {queue.length}
      </div>
      <div className="no-scrollbar max-h-[420px] overflow-y-auto">
        {queue.map((t, i) => {
          const isCurrent = i === queueIndex
          return (
            <button
              key={t.id}
              onClick={() => loadTrack(t)}
              className={`flex w-full items-center gap-3 border-b border-line/40 px-4 py-2.5 text-left transition-colors hover:bg-surface-2 ${
                isCurrent ? 'bg-surface-2' : ''
              }`}
            >
              <span className={`h-8 w-1 shrink-0 rounded-sm ${isCurrent ? 'bg-accent' : 'bg-line'}`} />
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-sm border border-line bg-bg-deep">
                {t.coverArt && <img src={t.coverArt} alt="" loading="lazy" className="h-full w-full object-cover" />}
              </div>
              <span className={`min-w-0 flex-1 truncate font-serif text-sm ${isCurrent ? 'text-accent' : 'text-text'}`}>
                {t.title}
              </span>
              <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted">
                {fmtDuration(t.duration)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
