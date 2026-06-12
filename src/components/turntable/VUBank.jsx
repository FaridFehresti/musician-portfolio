import { VUMeter } from '../player/VUMeter'
import { usePlayerStore } from '../../store/playerStore'

/* Monitor section: a pair of big meters in a console face, with a pilot
   lamp that warms up while audio is flowing. */
export function VUBank({ className = '' }) {
  const isPlaying = usePlayerStore((s) => s.isPlaying)

  return (
    <div className={`console-face noise-overlay rounded-md border border-line p-4 ${className}`}>
      <div className="relative z-[2]">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">Monitor</span>
          <span
            className={`h-1.5 w-1.5 rounded-full ${isPlaying ? 'tube-glow animate-flicker bg-accent' : 'bg-line'}`}
          />
        </div>
        <div className="flex gap-3">
          <VUMeter band="low" label="L" className="h-20 flex-1 sm:h-24" />
          <VUMeter band="high" label="R" className="h-20 flex-1 sm:h-24" />
        </div>
      </div>
    </div>
  )
}
