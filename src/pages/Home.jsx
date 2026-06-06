import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HeroDeck } from '../components/vinyl/HeroDeck'
import { FeaturedCarousel } from '../components/library/FeaturedCarousel'
import { usePlayerStore } from '../store/playerStore'
import { tracks } from '../data/tracks'

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
  const { loadTrack, setQueue } = usePlayerStore()

  function handlePlay() {
    setQueue(tracks)
    if (tracks[0]) loadTrack(tracks[0])
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="noise-overlay relative flex flex-col items-center justify-center text-center px-6 pb-20"
        style={{ minHeight: '100vh', paddingTop: 80 }}
      >
        {/* Deep ambient glow behind gramophone */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 600, height: 600,
            background: 'radial-gradient(circle, rgba(255,47,208,0.09) 0%, transparent 70%)',
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
              border: '1px solid rgba(0,229,255,0.2)',
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

          {/* Artist name */}
          <motion.h1
            variants={FADE_UP} initial="hidden" animate="visible" custom={0}
            style={{
              fontFamily:  'var(--font-display)',
              fontStyle:   'italic',
              fontWeight:  900,
              fontSize:    'clamp(52px, 9vw, 120px)',
              color:       'var(--color-text)',
              textShadow:  '0 0 80px rgba(255,47,208,0.3), 0 0 40px rgba(0,229,255,0.18), 0 2px 40px rgba(0,0,0,0.8)',
              lineHeight:  1.05,
              letterSpacing: '-0.02em',
            }}
          >
            Artist Name
          </motion.h1>

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
            Electronic · House · Techno · Ambient
          </motion.p>

          {/* ── Gramophone ───────────────────────────────────────────── */}
          <motion.div
            variants={FADE_UP} initial="hidden" animate="visible" custom={0.35}
            className="relative flex justify-center items-center"
            style={{ marginTop: 8, marginBottom: 8 }}
          >
            {/* Extra spotlight behind gramophone */}
            <div
              className="absolute pointer-events-none"
              style={{
                width: 480, height: 320,
                background: 'radial-gradient(ellipse 55% 45% at 50% 55%, rgba(0,229,255,0.12) 0%, transparent 75%)',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
              }}
            />
            <HeroDeck tracks={tracks} />
          </motion.div>

          {/* Play button */}
          <motion.button
            variants={FADE_UP} initial="hidden" animate="visible" custom={0.5}
            onClick={handlePlay}
            className="flex items-center gap-3 px-8 py-3 rounded-full"
            style={{
              border:      '1px solid rgba(255,47,208,0.5)',
              background:  'transparent',
              color:       'var(--color-accent)',
              fontFamily:  'var(--font-mono)',
              fontSize:    12,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor:      'pointer',
              transition:  'background 0.2s, border-color 0.2s',
            }}
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,47,208,0.1)', borderColor: 'rgba(255,47,208,0.85)' }}
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
              — {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
            </span>
          </motion.div>

          <FeaturedCarousel tracks={tracks} allTracks={tracks} />
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="px-6 pb-40 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto"
        >
          {/* Divider */}
          <div className="flex items-center gap-6 mb-16 justify-center">
            <div style={{ width: 60, height: 1, background: 'rgba(0,229,255,0.25)' }} />
            <svg width="16" height="16" viewBox="0 0 16 16" opacity="0.4">
              <circle cx="8" cy="8" r="7" fill="none" stroke="#ff2fd0" strokeWidth="0.8" />
              <circle cx="8" cy="8" r="4" fill="none" stroke="#ff2fd0" strokeWidth="0.6" />
              <circle cx="8" cy="8" r="1.5" fill="#ff2fd0" />
            </svg>
            <div style={{ width: 60, height: 1, background: 'rgba(0,229,255,0.25)' }} />
          </div>

          <h2
            style={{
              fontFamily:  'var(--font-display)',
              fontStyle:   'italic',
              fontWeight:  900,
              fontSize:    'clamp(40px, 7vw, 88px)',
              color:       'var(--color-text)',
              lineHeight:  1.0,
              marginBottom: 16,
            }}
          >
            {tracks.length} tracks.
            <br />
            <span style={{ color: 'var(--color-accent)' }}>All free.</span>
          </h2>

          <p style={{ color: 'var(--color-muted)', marginBottom: 44, fontSize: 15, lineHeight: 1.7 }}>
            No subscription. No account required.
            <br />
            Just press play — anytime, anywhere.
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
                  border:        '1px solid rgba(0,229,255,0.4)',
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
