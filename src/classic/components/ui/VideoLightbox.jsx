import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { usePlayerStore } from '../../../store/playerStore'

/**
 * Full-screen video lightbox for a track's optional YouTube / Vimeo link.
 * Usage: <VideoLightbox url={track.video} title="..." onClose={() => setOpen(false)} />
 * Wrap the call site with <AnimatePresence>.
 */

/** Turn a watch/share URL into an autoplaying embed URL. Falls back to the
 *  raw URL so a direct embed/mp4 link still works. */
function toEmbedUrl(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')

    // YouTube — youtu.be/ID, youtube.com/watch?v=ID, /embed/ID, /shorts/ID
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1)
      return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`
    }
    if (host.endsWith('youtube.com')) {
      let id = u.searchParams.get('v')
      if (!id) {
        const m = u.pathname.match(/\/(embed|shorts)\/([^/?]+)/)
        if (m) id = m[2]
      }
      if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`
    }

    // Vimeo — vimeo.com/ID or player.vimeo.com/video/ID
    if (host.endsWith('vimeo.com')) {
      const id = (u.pathname.match(/(\d+)/) || [])[1]
      if (id) return `https://player.vimeo.com/video/${id}?autoplay=1`
    }
  } catch {
    /* not a parseable URL — fall through */
  }
  return url
}

/** Friendly name for the "open original" link, or null for a generic label. */
function sourceName(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (host === 'youtu.be' || host.endsWith('youtube.com')) return 'YouTube'
    if (host.endsWith('vimeo.com')) return 'Vimeo'
  } catch { /* not a parseable URL */ }
  return null
}

export function VideoLightbox({ url, title, onClose }) {
  const embed = toEmbedUrl(url)
  const source = sourceName(url)

  // Pause any playing audio on open so the track and the video don't overlap.
  useEffect(() => { usePlayerStore.getState().pause() }, [])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(14px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'zoom-out', padding: '4vmin',
      }}
    >
      <motion.div
        initial={{ scale: 0.86, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.86, opacity: 0, y: 24 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative', width: 'min(94vw, 1100px)', aspectRatio: '16 / 9',
          borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 40px 120px rgba(0,0,0,0.95), 0 0 0 1px color-mix(in srgb, var(--accent-2) 18%, transparent), 0 0 60px color-mix(in srgb, var(--accent) 20%, transparent)',
          background: '#000', cursor: 'auto',
        }}
      >
        <iframe
          src={embed}
          title={title || 'Video'}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
        />
      </motion.div>

      {/* Title + close, outside the frame so they never cover the video */}
      {title && (
        <p style={{
          position: 'absolute', top: 'max(16px, 3vmin)', left: 'max(16px, 4vmin)',
          fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(16px, 2.4vw, 26px)',
          color: 'var(--color-text)', textShadow: '0 2px 20px rgba(0,0,0,0.8)', margin: 0, pointerEvents: 'none',
        }}>
          {title}
        </p>
      )}
      {/* Top-right controls: open the original link, then close */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', top: 'max(16px, 3vmin)', right: 'max(16px, 4vmin)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}
      >
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={source ? `Watch on ${source} (opens in a new tab)` : 'Open video link (opens in a new tab)'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 999,
              background: 'rgba(10,10,10,0.8)', border: '1px solid rgba(240,236,224,0.18)',
              color: 'rgba(240,236,224,0.92)', cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap',
              fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.04em', backdropFilter: 'blur(4px)',
            }}
          >
            {source ? `Watch on ${source}` : 'Open link'}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M7 17 17 7" /><path d="M9 7h8v8" />
            </svg>
          </a>
        )}
        <button
          onClick={onClose}
          aria-label="Close video"
          style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(10,10,10,0.8)', border: '1px solid rgba(240,236,224,0.18)',
            color: 'rgba(240,236,224,0.85)', cursor: 'pointer', fontSize: 18, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)',
          }}
        >
          ✕
        </button>
      </div>
    </motion.div>
  )
}
