import { Link } from 'react-router-dom'
import { useContentStore } from '../store/contentStore'
import { usePlayerStore } from '../store/playerStore'
import { Turntable } from '../components/turntable/Turntable'
import { VUBank } from '../components/turntable/VUBank'
import { QueueCrate } from '../components/turntable/QueueCrate'
import { AnalogButton } from '../components/ui/AnalogButton'
import { StampTag } from '../components/ui/StampTag'
import { CrateToggle } from '../components/ui/CrateToggle'
import { ShareButton } from '../components/ui/ShareButton'
import { catalogNumber } from '../lib/catalog'

/* The listening room: deck on the left, monitor + crate on the right. */
export default function TurntablePage() {
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const tracks = useContentStore((s) => s.tracks)

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <Turntable />

          {currentTrack ? (
            <div className="mt-8">
              <div className="mb-3 flex flex-wrap gap-2">
                <StampTag tone="oxblood" tilt>{catalogNumber(currentTrack.id, tracks)}</StampTag>
                {currentTrack.genre && <StampTag tone="amber">{currentTrack.genre}</StampTag>}
                {currentTrack.year ? <StampTag>{currentTrack.year}</StampTag> : null}
              </div>
              <h1 className="font-serif text-3xl text-text md:text-4xl">{currentTrack.title}</h1>
              {currentTrack.artist && (
                <div className="mt-2 font-mono text-xs uppercase tracking-[0.22em] text-muted">
                  {currentTrack.artist}
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <CrateToggle trackId={currentTrack.id} />
                <ShareButton track={currentTrack} />
              </div>
            </div>
          ) : (
            <div className="mt-8 text-center lg:text-left">
              <p className="font-serif italic text-muted">
                Nothing on the platter. Pull a record off the shelf to get the room going.
              </p>
              <div className="mt-5">
                <AnalogButton variant="outline" as={Link} to="/records">
                  Browse the records
                </AnalogButton>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <VUBank />
          <QueueCrate />
        </div>
      </div>
    </div>
  )
}
