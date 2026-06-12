import { Link, useLocation } from 'react-router-dom'
import { Disc3, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { usePlayerStore } from '../../store/playerStore'
import { TransportButton } from './TransportButton'
import { TapeCounter } from './TapeCounter'
import { VUMeter } from './VUMeter'

/* The console — a tape-deck style player strip fixed to the bottom of every
   public page. All playback state lives in the untouched playerStore. */
export function ConsoleBar() {
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const volume = usePlayerStore((s) => s.volume)
  const shuffle = usePlayerStore((s) => s.shuffle)
  const repeat = usePlayerStore((s) => s.repeat)
  const audioError = usePlayerStore((s) => s.audioError)
  const { play, pause, next, prev, seek, setVolume, toggleShuffle, cycleRepeat } = usePlayerStore.getState()

  const { pathname } = useLocation()
  const onTurntable = pathname === '/turntable'

  if (!currentTrack) return null

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="console-face noise-overlay fixed inset-x-0 bottom-0 z-50">
      {audioError && (
        <div className="border-b border-oxblood/50 bg-oxblood/20 px-4 py-1 text-center font-mono text-[11px] text-text">
          {audioError}
        </div>
      )}
      <div className="relative z-[2] mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:gap-6">

        {/* now spinning */}
        <Link to="/turntable" className="group flex min-w-0 flex-1 items-center gap-3 md:flex-initial md:basis-64">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-sm border border-line bg-bg-deep">
            {currentTrack.coverArt ? (
              <img src={currentTrack.coverArt} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grooves h-full w-full" />
            )}
            {isPlaying && (
              <span className="tube-glow absolute bottom-1 right-1 h-1.5 w-1.5 animate-flicker rounded-full bg-accent" />
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate font-serif text-sm text-text group-hover:text-accent">
              {currentTrack.title}
            </div>
            <div className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              {currentTrack.artist || 'Unknown artist'}
            </div>
          </div>
        </Link>

        {/* transport + tape window */}
        <div className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex items-center gap-2.5">
            <TransportButton label="Previous" onClick={prev} className="hidden sm:flex">
              <SkipBack size={14} />
            </TransportButton>
            <TransportButton primary label={isPlaying ? 'Pause' : 'Play'} onClick={isPlaying ? pause : play}>
              {isPlaying ? <Pause size={17} /> : <Play size={17} className="ml-0.5" />}
            </TransportButton>
            <TransportButton label="Next" onClick={next}>
              <SkipForward size={14} />
            </TransportButton>
          </div>
          <div className="hidden w-full max-w-md items-center gap-3 sm:flex">
            <TapeCounter seconds={currentTime} />
            <input
              type="range"
              className="tape-slider w-full"
              style={{ '--pct': `${pct}%` }}
              min={0}
              max={duration || 1}
              step="any"
              value={Math.min(currentTime, duration || 0)}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="Seek"
            />
            <TapeCounter seconds={duration} />
          </div>
        </div>

        {/* mode switches + level + meters */}
        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={toggleShuffle}
            title="Shuffle"
            aria-pressed={shuffle}
            className={`flex h-8 w-8 items-center justify-center rounded-sm border transition-colors ${
              shuffle ? 'border-accent/60 bg-accent/10 text-accent' : 'border-line text-muted hover:text-text'
            }`}
          >
            <Shuffle size={13} />
          </button>
          <button
            onClick={cycleRepeat}
            title={`Repeat: ${repeat}`}
            className={`flex h-8 w-8 items-center justify-center rounded-sm border transition-colors ${
              repeat !== 'off' ? 'border-accent/60 bg-accent/10 text-accent' : 'border-line text-muted hover:text-text'
            }`}
          >
            {repeat === 'one' ? <Repeat1 size={13} /> : <Repeat size={13} />}
          </button>

          <div className="hidden items-center gap-2 lg:flex">
            <Volume2 size={13} className="text-muted" />
            <input
              type="range"
              className="tape-slider w-20"
              style={{ '--pct': `${volume * 100}%` }}
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
            />
          </div>

          <div className="hidden gap-1.5 xl:flex">
            <VUMeter band="low" label="L" className="h-11 w-[72px]" />
            <VUMeter band="high" label="R" className="h-11 w-[72px]" />
          </div>

          {!onTurntable && (
            <Link
              to="/turntable"
              title="Open the turntable"
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-line text-muted transition-colors hover:border-brass hover:text-accent"
            >
              <Disc3 size={14} className={isPlaying ? 'animate-spin33' : ''} />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
