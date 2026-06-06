import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const FADE_UP = {
  hidden:  { opacity: 0, y: 20 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: d, ease: [0.16, 1, 0.3, 1] } }),
}

const GENRE_LABELS = ['Psytrance', 'Electronic', 'Metal', 'Ambient', 'House', 'Melodic']

const SOCIALS = [
  { label: 'SoundCloud', icon: 'SC', href: 'https://soundcloud.com' },
  { label: 'Instagram',  icon: 'IG', href: 'https://instagram.com' },
  { label: 'YouTube',    icon: 'YT', href: 'https://youtube.com' },
  { label: 'Bandcamp',   icon: 'BC', href: 'https://bandcamp.com' },
]

export default function About() {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--color-bg)', paddingTop: 100, paddingBottom: 120 }}
    >
      <div className="max-w-5xl mx-auto px-6 sm:px-10">

        {/* ── Hero quote ───────────────────────────────────────────── */}
        <motion.div
          variants={FADE_UP} initial="hidden" animate="visible" custom={0}
          className="mb-24 text-center"
        >
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--color-muted)', letterSpacing: '0.2em',
            textTransform: 'uppercase', marginBottom: 20,
          }}>
            About the Artist
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 900,
            fontSize: 'clamp(32px, 6vw, 76px)', color: 'var(--color-text)',
            lineHeight: 1.05, marginBottom: 24, letterSpacing: '-0.02em',
          }}>
            "Music is the space<br />between the notes."
          </h1>
          <p style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            — Artist Name
          </p>
        </motion.div>

        {/* ── Bio + portrait ───────────────────────────────────────── */}
        <div
          className="mb-24"
          style={{ display: 'grid', gap: 48, gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.5fr)', alignItems: 'center' }}
        >
          {/* Portrait placeholder */}
          <motion.div
            variants={FADE_UP} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
          >
            <div style={{
              aspectRatio: '1', borderRadius: 12, overflow: 'hidden',
              boxShadow: '0 24px 70px rgba(0,0,0,0.8), 0 0 0 1px color-mix(in srgb, var(--accent-2) 10%, transparent)',
              background: 'linear-gradient(145deg, #1a1208, #0a0a0a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              <svg width="55%" height="55%" viewBox="0 0 200 200" opacity="0.11">
                {[90, 78, 66, 54, 42, 30, 18].map(r => (
                  <circle key={r} cx="100" cy="100" r={r}
                    fill="none" stroke="var(--accent)" strokeWidth="0.8" />
                ))}
                <circle cx="100" cy="100" r="8" fill="var(--accent)" opacity="0.4" />
              </svg>
              <p style={{
                position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center',
                fontFamily: 'var(--font-display)', fontStyle: 'italic',
                fontSize: 13, color: 'color-mix(in srgb, var(--accent-2) 35%, transparent)',
              }}>
                Add your photo here
              </p>
            </div>
          </motion.div>

          {/* Bio text */}
          <motion.div
            variants={FADE_UP} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0.12}
            className="flex flex-col gap-5"
          >
            <p style={{ color: 'var(--color-text)', fontSize: 16, lineHeight: 1.85, fontFamily: 'var(--font-body)' }}>
              A music producer and sound explorer pushing boundaries across genres.
              From pulsing psytrance to heavy metal and hypnotic deep house — every track
              is a journey through texture, rhythm, and raw energy.
            </p>
            <p style={{ color: 'var(--color-muted)', fontSize: 15, lineHeight: 1.85, fontFamily: 'var(--font-body)' }}>
              Drawing from global influences — tribal rhythms, cinematic landscapes, and
              the underground — each release is crafted with precision and passion,
              to move bodies and expand minds.
            </p>
            <p style={{ color: 'var(--color-muted)', fontSize: 15, lineHeight: 1.85, fontFamily: 'var(--font-body)' }}>
              All music here is free. No subscriptions, no gatekeeping.
              Just sound — available to anyone who wants to listen.
            </p>

            {/* Socials */}
            <div className="flex flex-wrap gap-3 mt-2">
              {SOCIALS.map(({ label, icon, href }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 16px', borderRadius: 20,
                    border: '1px solid rgba(240,236,224,0.1)',
                    background: 'var(--color-surface)', color: 'var(--color-muted)',
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    textDecoration: 'none', letterSpacing: '0.06em',
                    transition: 'border-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-accent)'; e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent-2) 40%, transparent)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-muted)'; e.currentTarget.style.borderColor = 'rgba(240,236,224,0.1)' }}
                >
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'color-mix(in srgb, var(--accent-2) 12%, transparent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 7, color: 'var(--color-accent)', flexShrink: 0,
                  }}>
                    {icon}
                  </span>
                  {label}
                </a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Genre tags ───────────────────────────────────────────── */}
        <motion.div
          variants={FADE_UP} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mb-24"
        >
          <div style={{ width: 48, height: 1, background: 'color-mix(in srgb, var(--accent-2) 20%, transparent)', marginBottom: 28 }} />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 18 }}>
            The Sound
          </p>
          <div className="flex flex-wrap" style={{ gap: '12px 24px' }}>
            {GENRE_LABELS.map((g, i) => (
              <motion.span
                key={g}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                style={{
                  fontFamily: 'var(--font-display)', fontStyle: 'italic',
                  fontSize: 'clamp(20px, 3vw, 36px)',
                  color: i % 2 === 0 ? 'var(--color-text)' : 'rgba(240,236,224,0.28)',
                  lineHeight: 1.2,
                }}
              >
                {g}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <motion.div
          variants={FADE_UP} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link to="/library">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              style={{
                padding: '13px 34px', borderRadius: 40,
                background: 'var(--color-accent)', color: '#0a0a0a',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: 11,
                fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase',
              }}
            >
              Browse All Music
            </motion.button>
          </Link>
          <Link to="/donate">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              style={{
                padding: '13px 34px', borderRadius: 40,
                background: 'transparent', color: 'var(--color-accent)',
                border: '1px solid color-mix(in srgb, var(--accent-2) 40%, transparent)', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: 11,
                letterSpacing: '0.12em', textTransform: 'uppercase',
              }}
            >
              Support the Artist
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
