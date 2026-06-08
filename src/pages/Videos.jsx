import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useContentStore } from '../store/contentStore'
import { VideoCard } from '../components/home/VideosSection'
import { VideoLightbox } from '../components/ui/VideoLightbox'

export default function Videos() {
  const tracks = useContentStore(s => s.tracks)
  const videos = useMemo(() => tracks.filter(t => t.video), [tracks])
  const [open, setOpen] = useState(null)

  return (
    <div className="min-h-screen px-4 sm:px-10 pb-36" style={{ background: 'var(--color-bg)', paddingTop: 100 }}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="flex items-baseline gap-4 mb-10"
        >
          <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(32px, 5vw, 64px)', color: 'var(--color-text)' }}>
            Videos
          </h1>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-muted)',
            background: 'var(--color-surface-2)', padding: '2px 8px', borderRadius: 20,
          }}>
            {videos.length} {videos.length === 1 ? 'video' : 'videos'}
          </span>
        </motion.div>

        {videos.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 24, color: 'var(--color-muted)', textAlign: 'center', paddingTop: 80 }}>
            No videos yet
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
            {videos.map(t => <VideoCard key={t.id} track={t} onOpen={() => setOpen(t)} />)}
          </div>
        )}
      </div>

      {createPortal(
        <AnimatePresence>
          {open && <VideoLightbox url={open.video} title={open.title} onClose={() => setOpen(null)} />}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}
