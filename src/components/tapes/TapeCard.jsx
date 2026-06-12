/* A cassette in the rack. Cover art + title on the paper label, reels spin
   on hover. Click hands the track to the page (lightbox or external link). */

function Reel() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7 animate-reel [animation-play-state:paused] group-hover:[animation-play-state:running]"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" fill="none" stroke="var(--muted)" strokeWidth="1.4" />
      {[0, 60, 120].map((d) => (
        <line
          key={d}
          x1="12" y1="4.5" x2="12" y2="9"
          stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round"
          transform={`rotate(${d} 12 12)`}
        />
      ))}
      <circle cx="12" cy="12" r="2.4" fill="var(--muted)" />
    </svg>
  )
}

export function TapeCard({ track, onOpen }) {
  return (
    <button
      onClick={() => onOpen(track)}
      className="group block w-full text-left"
      aria-label={`Watch ${track.title}`}
    >
      <div className="noise-overlay relative overflow-hidden rounded-md border border-line bg-surface-2 shadow-[0_14px_18px_-12px_rgba(0,0,0,0.7)] transition-transform duration-300 group-hover:-translate-y-1">
        <div className="relative z-[2] p-3">
          {/* paper label */}
          <div className="paper flex items-center gap-3 overflow-hidden rounded-sm p-2.5">
            <div className="relative z-[2] h-12 w-12 shrink-0 overflow-hidden rounded-sm border border-paper-ink/20">
              {track.coverArt ? (
                <img src={track.coverArt} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-paper-ink/10" />
              )}
            </div>
            <div className="relative z-[2] min-w-0">
              <div className="truncate font-serif text-sm font-bold text-paper-ink">{track.title}</div>
              <div className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-[0.18em] text-paper-ink/60">
                {track.genre || track.artist || 'Video'} · VHS-{track.year || '——'}
              </div>
            </div>
          </div>

          {/* tape window */}
          <div className="mt-3 flex items-center justify-between rounded-sm border border-bg-deep bg-bg-deep px-5 py-2.5">
            <Reel />
            <div className="mx-3 h-1 flex-1 rounded-full bg-surface" />
            <Reel />
          </div>
        </div>

        {/* play hint */}
        <div className="absolute inset-x-0 bottom-0 z-[3] flex justify-center bg-gradient-to-t from-bg-deep/90 to-transparent py-2 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">▶ Play tape</span>
        </div>
      </div>
    </button>
  )
}
