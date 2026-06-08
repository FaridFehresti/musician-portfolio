import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CardTable } from '../components/home/CardTable'
import { VideosSection } from '../components/home/VideosSection'
import { TrackList } from '../components/library/TrackList'
import { usePlayerStore } from '../store/playerStore'
import { useContentStore } from '../store/contentStore'

const FADE_UP = {
  hidden:  { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] },
  }),
}

/* Floating vinyl particles — seeded so they don't shift on re-render */
const PARTICLES = [
  { id: 0,  size: 22, left: '8%',  top: '18%', delay: 0,   dur: 7  },
  { id: 1,  size: 12, left: '18%', top: '72%', delay: 1.2, dur: 9  },
  { id: 2,  size: 18, left: '30%', top: '10%', delay: 0.5, dur: 6  },
  { id: 3,  size: 8,  left: '45%', top: '85%', delay: 2,   dur: 8  },
  { id: 4,  size: 26, left: '60%', top: '15%', delay: 0.8, dur: 10 },
  { id: 5,  size: 10, left: '72%', top: '60%', delay: 1.5, dur: 7  },
  { id: 6,  size: 16, left: '82%', top: '30%', delay: 0.3, dur: 9  },
  { id: 7,  size: 20, left: '90%', top: '78%', delay: 2.5, dur: 6  },
  { id: 8,  size: 14, left: '5%',  top: '50%', delay: 1.8, dur: 8  },
  { id: 9,  size: 9,  left: '55%', top: '45%', delay: 0.6, dur: 11 },
  { id: 10, size: 24, left: '38%', top: '65%', delay: 3,   dur: 7  },
]

export default function Home() {
  const { loadTrack, setQueue, currentTrack } = usePlayerStore()
  const site = useContentStore(s => s.site)
  const tracks = useContentStore(s => s.tracks)
  // Derive placement lists with useMemo — selecting a freshly-filtered array
  // straight from the store would loop useSyncExternalStore.
  // Home deck = tracks assigned to a slot; CardTable groups them by slot.
  const heroList = useMemo(() => tracks.filter(t => t.homeSlot), [tracks])
  const featuredList = useMemo(() => {
    const picks = tracks.filter(t => t.inFeatured !== false)
    return picks.length ? picks : tracks
  }, [tracks])
  const heroTrack = currentTrack || tracks[0]

  function handlePlay() {
    setQueue(tracks)
    if (tracks[0]) loadTrack(tracks[0])
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="noise-overlay relative flex flex-col items-center justify-center text-center px-6 pb-20 overflow-hidden"
        style={{ minHeight: '100vh', paddingTop: 80 }}
      >
        {/* Focused-track cover as a smooth ambient background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
          <AnimatePresence>
            <motion.div
              key={heroTrack?.id || 'none'}
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              style={{
                position: 'absolute', inset: -100,
                backgroundImage: heroTrack?.coverArt ? `url("${heroTrack.coverArt}")` : 'none',
                backgroundSize: 'cover', backgroundPosition: 'center',
                filter: 'blur(26px) saturate(1.15) brightness(0.95)',
              }}
            />
          </AnimatePresence>
          {/* Light scrim — keeps the title/controls legible without hiding the cover */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 95% 85% at 50% 44%, color-mix(in srgb, var(--bg) 2%, transparent) 0%, color-mix(in srgb, var(--bg) 28%, transparent) 58%, color-mix(in srgb, var(--bg) 80%, transparent) 100%)' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 180, background: 'linear-gradient(180deg, color-mix(in srgb, var(--bg) 55%, transparent) 0%, transparent 100%)' }} />
        </div>

        {/* Deep ambient glow behind gramophone */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 600, height: 600,
            background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 9%, transparent) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Floating vinyl particles */}
        {PARTICLES.map(p => (
          <motion.div
            key={p.id}
            className="absolute pointer-events-none rounded-full"
            style={{
              width: p.size, height: p.size,
              left: p.left, top: p.top,
              border: '1px solid color-mix(in srgb, var(--accent-2) 20%, transparent)',
            }}
            animate={{
              y:       [-18, 18, -18],
              rotate:  [0, 360],
              opacity: [0.08, 0.22, 0.08],
            }}
            transition={{
              duration: p.dur,
              delay:    p.delay,
              repeat:   Infinity,
              ease:     'easeInOut',
            }}
          />
        ))}

        <div className="relative z-10 flex flex-col items-center gap-3 w-full">

          {/* Artist name — replaced by the uploaded logo when one is set */}
          {site.logoUrl ? (
            <motion.img
              src={site.logoUrl}
              alt={site.artistName || 'Logo'}
              variants={FADE_UP} initial="hidden" animate="visible" custom={0}
              style={{
                height: `clamp(48px, ${(site.logoHeight || 90) / 9}vw, ${site.logoHeight || 90}px)`,
                width: 'auto',
                maxHeight: `${site.logoHeight || 90}px`,
                maxWidth: 'min(78vw, 320px)',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 40px color-mix(in srgb, var(--accent) 30%, transparent)) drop-shadow(0 2px 30px rgba(0,0,0,0.7))',
              }}
            />
          ) : (
            <motion.h1
              variants={FADE_UP} initial="hidden" animate="visible" custom={0}
              style={{
                fontFamily:  'var(--font-display)',
                fontStyle:   'italic',
                fontWeight:  900,
                fontSize:    'clamp(40px, 6.5vw, 84px)',
                color:       'var(--color-text)',
                textShadow:  '0 0 80px color-mix(in srgb, var(--accent) 30%, transparent), 0 0 40px color-mix(in srgb, var(--accent-2) 18%, transparent), 0 2px 40px rgba(0,0,0,0.8)',
                lineHeight:  1.05,
                letterSpacing: '-0.02em',
              }}
            >
              {site.artistName || 'Artist Name'}
            </motion.h1>
          )}

          {/* Tagline */}
          <motion.p
            variants={FADE_UP} initial="hidden" animate="visible" custom={0.18}
            style={{
              fontFamily:    'var(--font-mono)',
              fontWeight:    400,
              fontSize:      'clamp(11px, 1.4vw, 16px)',
              color:         'var(--color-muted)',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
            }}
          >
            {site.tagline}
          </motion.p>

          {/* ── Card table ───────────────────────────────────────────── */}
          <motion.div
            variants={FADE_UP} initial="hidden" animate="visible" custom={0.35}
            className="relative flex justify-center items-center w-full"
            style={{ marginTop: 28, marginBottom: 20 }}
          >
            <CardTable tracks={heroList} />
          </motion.div>

          {/* Play button */}
          <motion.button
            variants={FADE_UP} initial="hidden" animate="visible" custom={0.5}
            onClick={handlePlay}
            className="flex items-center gap-3 px-8 py-3 rounded-full"
            style={{
              border:      '1px solid color-mix(in srgb, var(--accent) 50%, transparent)',
              background:  'transparent',
              color:       'var(--color-accent)',
              fontFamily:  'var(--font-mono)',
              fontSize:    12,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor:      'pointer',
              transition:  'background 0.2s, border-color 0.2s',
            }}
            whileHover={{ scale: 1.05, backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 85%, transparent)' }}
            whileTap={{ scale: 0.97 }}
          >
            <span
              style={{
                width: 26, height: 26, borderRadius: '50%',
                border: '1.5px solid currentColor',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor">
                <path d="M0 0l8 5-8 5V0z" />
              </svg>
            </span>
            Start Listening
          </motion.button>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            style={{ marginTop: 32 }}
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{ color: 'var(--color-muted)', opacity: 0.4 }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M10 4v12M4 10l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Featured Carousel ────────────────────────────────────────── */}
      <section className="px-6 sm:px-10 pb-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="flex items-baseline gap-4 mb-8"
          >
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontStyle:  'italic',
              fontSize:   'clamp(26px, 4vw, 48px)',
              color:      'var(--color-text)',
            }}>
              Latest Releases
            </h2>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)' }}>
              — {featuredList.length} {featuredList.length === 1 ? 'track' : 'tracks'}
            </span>
          </motion.div>

          <TrackList tracks={featuredList} />
        </div>
      </section>

      {/* ── Videos (shown only when the artist has videos) ───────────── */}
      <VideosSection tracks={tracks} />

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="px-6 pb-40 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto"
        >
          {/* Divider */}
          <div className="flex items-center gap-6 mb-10 justify-center">
            <div style={{ width: 60, height: 1, background: 'color-mix(in srgb, var(--accent-2) 25%, transparent)' }} />
            <svg width="16" height="16" viewBox="0 0 16 16" opacity="0.4">
              <circle cx="8" cy="8" r="7" fill="none" stroke="var(--accent)" strokeWidth="0.8" />
              <circle cx="8" cy="8" r="4" fill="none" stroke="var(--accent)" strokeWidth="0.6" />
              <circle cx="8" cy="8" r="1.5" fill="var(--accent)" />
            </svg>
            <div style={{ width: 60, height: 1, background: 'color-mix(in srgb, var(--accent-2) 25%, transparent)' }} />
          </div>

          <p style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(20px, 3vw, 30px)',
            color: 'var(--color-text)', lineHeight: 1.3, marginBottom: 28,
          }}>
            Every track, free — no account, no subscription.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/library">
              <motion.button
                whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.97 }}
                className="px-10 py-3.5 rounded-full text-sm"
                style={{
                  background:    'var(--color-accent)',
                  color:         '#0a0a0a',
                  border:        'none',
                  fontFamily:    'var(--font-mono)',
                  fontWeight:    500,
                  cursor:        'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  fontSize:      11,
                }}
              >
                Browse Library
              </motion.button>
            </Link>
            <Link to="/donate">
              <motion.button
                whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.97 }}
                className="px-10 py-3.5 rounded-full text-sm"
                style={{
                  background:    'transparent',
                  color:         'var(--color-accent)',
                  border:        '1px solid color-mix(in srgb, var(--accent-2) 40%, transparent)',
                  fontFamily:    'var(--font-mono)',
                  cursor:        'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  fontSize:      11,
                }}
              >
                Support the Artist
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
