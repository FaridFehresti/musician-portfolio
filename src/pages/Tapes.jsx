import { useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { useContentStore } from '../store/contentStore'
import { SectionHeading } from '../components/ui/SectionHeading'
import { AnalogButton } from '../components/ui/AnalogButton'
import { TapeCard } from '../components/tapes/TapeCard'
import { VideoLightbox } from '../components/tapes/VideoLightbox'
import { youtubeId } from '../lib/youtube'

/* The Tape Archive — every track with a video, racked as cassettes.
   YouTube links play in a lightbox; anything else opens in a new tab. */
export default function Tapes() {
  const tracks = useContentStore((s) => s.tracks)
  const site = useContentStore((s) => s.site)
  const [openTrack, setOpenTrack] = useState(null)

  const tapes = useMemo(
    () => tracks.filter((t) => t.video && t.published !== false),
    [tracks]
  )

  function openTape(track) {
    if (youtubeId(track.video)) setOpenTrack(track)
    else window.open(track.video, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <SectionHeading
        overline={`${tapes.length} tapes on the rack`}
        title="The Tape Archive"
        right={
          site.youtubeUrl ? (
            <AnalogButton
              variant="outline"
              as="a"
              href={site.youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="!px-4 !py-2 !text-xs"
            >
              Full archive <ExternalLink size={12} />
            </AnalogButton>
          ) : null
        }
      />

      {tapes.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tapes.map((t) => (
            <TapeCard key={t.id} track={t} onOpen={openTape} />
          ))}
        </div>
      ) : (
        <div className="rounded-sm border border-dashed border-line px-6 py-16 text-center">
          <p className="font-serif italic text-muted">The rack is empty — no tapes digitised yet.</p>
        </div>
      )}

      {openTrack && <VideoLightbox track={openTrack} onClose={() => setOpenTrack(null)} />}
    </div>
  )
}
