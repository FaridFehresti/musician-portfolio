import { usePlayerStore } from '../../store/playerStore'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

/* The deck: walnut plinth, grooved platter, the current track's cover art as
   the record label. The record spins at 33⅓ while playing (CSS animation,
   paused otherwise) and the tonearm tracks playback progress. */
export function Turntable({ className = '' }) {
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const reduced = usePrefersReducedMotion()

  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0
  // tonearm: resting off the platter → lead-in groove → run-out
  const armDeg = currentTrack ? 16 + progress * 20 : -8

  return (
    <div className={`noise-overlay relative rounded-md border border-line bg-gradient-to-b from-surface-2 to-surface p-5 shadow-[0_24px_40px_-20px_rgba(0,0,0,0.8)] sm:p-8 ${className}`}>
      <div className="relative z-[2]">
        {/* platter */}
        <div className="relative mx-auto aspect-square w-full max-w-xl">
          <div className="absolute inset-0 rounded-full border border-brass/30 bg-bg-deep shadow-[inset_0_2px_10px_rgba(0,0,0,0.7)]" />

          {/* the record */}
          <div
            className={`grooves absolute inset-[3%] rounded-full border border-black/60 shadow-[0_4px_14px_rgba(0,0,0,0.6)] ${
              !reduced ? 'animate-spin33' : ''
            }`}
            style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
          >
            {/* label */}
            <div className="absolute left-1/2 top-1/2 h-[36%] w-[36%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-2 border-bg-deep bg-oxblood">
              {currentTrack?.coverArt ? (
                <img src={currentTrack.coverArt} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-3 text-center">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-paper/80">
                    {currentTrack ? currentTrack.title : 'No record'}
                  </span>
                </div>
              )}
            </div>
            {/* spindle */}
            <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/70 bg-paper" />
          </div>

          {/* tonearm */}
          <div
            className="absolute -right-1 -top-1 h-[68%] w-[14%] transition-transform duration-700 ease-out"
            style={{ transform: `rotate(${armDeg}deg)`, transformOrigin: '50% 9%' }}
            aria-hidden="true"
          >
            <svg viewBox="0 0 30 140" className="h-full w-full overflow-visible">
              {/* pivot base */}
              <circle cx="15" cy="13" r="11" fill="var(--surface-2)" stroke="var(--line)" />
              <circle cx="15" cy="13" r="5" fill="var(--brass)" opacity="0.9" />
              {/* arm */}
              <line x1="15" y1="13" x2="15" y2="112" stroke="var(--brass)" strokeWidth="3.5" strokeLinecap="round" />
              {/* headshell */}
              <rect x="9" y="110" width="12" height="20" rx="2" fill="var(--surface-2)" stroke="var(--line)" />
              <rect x="13" y="128" width="4" height="5" fill="var(--accent)" />
            </svg>
          </div>
        </div>

        {/* deck controls strip: speed stamp + pilot lamp */}
        <div className="mt-6 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
            33⅓ RPM
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full transition-all ${
                isPlaying ? 'tube-glow animate-flicker bg-accent' : 'bg-line'
              }`}
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
              {isPlaying ? 'Spinning' : currentTrack ? 'Stopped' : 'Idle'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
