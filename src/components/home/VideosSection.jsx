import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { VideoLightbox } from '../ui/VideoLightbox'
import { GENRE_GRADIENTS } from '../../data/tracks'

/* A clickable video thumbnail (cover art + play overlay). Reused by the home
   Videos section and the /videos page. */
export function VideoCard({ track, onOpen }) {
  const grad = GENRE_GRADIENTS[track?.genre] || ['#1a0a33', '#08041a']
  return (
    <motion.button
      onClick={onOpen}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      style={{
        display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
        background: 'transparent', border: 'none', padding: 0,
      }}
    >
      <div style={{
        position: 'relative', width: '100%', aspectRatio: '16 / 10', borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 16px 38px rgba(0,0,0,0.5), 0 0 0 1px color-mix(in srgb, var(--accent-2) 14%, transparent)',
      }}>
        {track.coverArt
          ? <img src={track.coverArt} alt={track.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', background: `linear-gradient(145deg, ${grad[0]}, ${grad[1]})` }} />}

        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(6,3,16,0.1) 0%, rgba(6,3,16,0.55) 100%)' }} />

        {/* VIDEO tag */}
        <span style={{
          position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 5,
          padding: '3px 8px', borderRadius: 7, background: 'rgba(8,5,16,0.6)', backdropFilter: 'blur(6px)',
          border: '1px solid color-mix(in srgb, var(--neon-cyan) 50%, transparent)', color: 'var(--neon-cyan)',
          fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <rect x="0.6" y="3" width="10.5" height="10" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <path d="M11.5 6.6l3.9-2.1v7l-3.9-2.1z" /><path d="M3.4 6l3.6 2-3.6 2z" />
          </svg>
          Video
        </span>

        {/* play button */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 54, height: 54, borderRadius: '50%', background: 'color-mix(in srgb, var(--neon-magenta) 88%, transparent)',
          border: '2px solid #fff', boxShadow: '0 0 24px var(--glow-magenta)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        }}>
          <svg width="18" height="20" viewBox="0 0 14 16" fill="currentColor" style={{ marginLeft: 3 }}><path d="M0 0l13 8L0 16z" /></svg>
        </div>
      </div>

      <p style={{ marginTop: 10, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: 16, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {track.title}
      </p>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)', letterSpacing: '0.04em' }}>
        {track.artist}
      </p>
    </motion.button>
  )
}

/* Home "Videos" section — shows the first few video tracks + a See-all link.
   Renders nothing when the artist has no videos. */
export function VideosSection({ tracks, limit = 4 }) {
  const [open, setOpen] = useState(null)
  const videos = tracks.filter(t => t.video)
  if (!videos.length) return null
  const shown = videos.slice(0, limit)

  return (
    <section className="px-6 sm:px-10 pb-20">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-baseline justify-between gap-4 mb-8"
        >
          <div className="flex items-baseline gap-4">
            <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(26px, 4vw, 48px)', color: 'var(--color-text)' }}>
              Videos
            </h2>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)' }}>
              — {videos.length} {videos.length === 1 ? 'video' : 'videos'}
            </span>
          </div>
          {videos.length > shown.length && (
            <Link to="/videos" style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--color-accent)', textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
              See all →
            </Link>
          )}
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 22 }}>
          {shown.map(t => <VideoCard key={t.id} track={t} onOpen={() => setOpen(t)} />)}
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {open && <VideoLightbox url={open.video} title={open.title} onClose={() => setOpen(null)} />}
        </AnimatePresence>,
        document.body,
      )}
    </section>
  )
}
