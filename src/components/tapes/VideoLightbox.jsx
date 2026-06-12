import { useEffect } from 'react'
import { X } from 'lucide-react'
import { youtubeId } from '../../lib/youtube'

export function VideoLightbox({ track, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const id = youtubeId(track?.video)
  if (!track || !id) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-deep/90 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${track.title} — video`}
    >
      <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <span className="font-serif text-sm italic text-text">{track.title}</span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-line text-muted hover:border-brass hover:text-text"
          >
            <X size={16} />
          </button>
        </div>
        <div className="aspect-video overflow-hidden rounded-md border border-line bg-bg-deep shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)]">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
            title={track.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
}
