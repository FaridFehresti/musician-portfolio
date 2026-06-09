import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useContentStore } from '../../store/contentStore'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

/* Boot splash. An animated "sonar" loader (sound-wave pulses + a rotating
   accent ring + an equalizer) with the artist's brand — the uploaded logo,
   sized identically to the home hero, or the name — crisp in the centre.

   It finishes when the SITE items are ready: the CMS content has loaded AND
   the key visuals (logo + hero background image) have decoded — never the
   audio. A base time keeps the splash up long enough to enjoy even on an
   instant load. Then it FLIPs the logo to the real hero position (measured via
   `[data-brand-logo]` on the home page) and hands off seamlessly. */

const BASE_MS = 2000          // base time — always show at least this long
const ASSET_TIMEOUT_MS = 3500 // stop waiting on a slow/missing image past this
const MAX_MS = 9000           // hard safety: never trap the user behind the splash

function logoStyle(site) {
  const h = site.logoHeight || 90
  return {
    height: `clamp(48px, ${h / 9}vw, ${h}px)`,   // MUST match Home.jsx
    width: 'auto',
    maxHeight: `${h}px`,
    maxWidth: 'min(92vw, 760px)',
    objectFit: 'contain',
    display: 'block',
    filter: 'drop-shadow(0 0 44px color-mix(in srgb, var(--accent) 36%, transparent)) drop-shadow(0 2px 30px rgba(0,0,0,0.7))',
  }
}

const nameStyle = {
  fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 900,
  fontSize: 'clamp(40px, 6.5vw, 84px)', color: 'var(--color-text)',   // MUST match Home.jsx
  textShadow: '0 0 80px color-mix(in srgb, var(--accent) 30%, transparent), 0 0 40px color-mix(in srgb, var(--accent-2) 18%, transparent), 0 2px 40px rgba(0,0,0,0.8)',
  lineHeight: 1.05, letterSpacing: '-0.02em', margin: 0, whiteSpace: 'nowrap',
}

/* centre a fixed-size decorative box without touching `transform`
   (left free for scale / rotate animation) */
function centered(size) {
  return { position: 'absolute', top: '50%', left: '50%', width: size, height: size, marginTop: -size / 2, marginLeft: -size / 2 }
}

export function LoadingScreen({ isHome, onFinish }) {
  const site = useContentStore(s => s.site)
  const loaded = useContentStore(s => s.loaded)
  const reduced = usePrefersReducedMotion()

  const logoRef = useRef(null)
  const [baseDone, setBaseDone] = useState(false)
  const [assetsReady, setAssetsReady] = useState(false)
  const [flip, setFlip] = useState(false)
  const [delta, setDelta] = useState({ dx: 0, dy: 0 })
  const [fading, setFading] = useState(false)
  const fired = useRef(false)

  // Lock scroll while the splash is up.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Base on-screen time + hard safety cap.
  useEffect(() => {
    const t = setTimeout(() => setBaseDone(true), BASE_MS)
    const max = setTimeout(() => onFinish(), MAX_MS)
    return () => { clearTimeout(t); clearTimeout(max) }
  }, [onFinish])

  // Wait for the site's VISUAL assets — logo + hero background image — to
  // decode (so the reveal is a fully-painted page). Audio is never waited on.
  useEffect(() => {
    if (!loaded) return
    const s = useContentStore.getState()
    const urls = [s.site?.logoUrl, s.tracks?.[0]?.coverArt].filter(Boolean)
    if (urls.length === 0) { setAssetsReady(true); return }
    let done = 0, cancelled = false
    const tick = () => { if (!cancelled && ++done >= urls.length) setAssetsReady(true) }
    const imgs = urls.map(u => {
      const img = new Image()
      img.onload = tick
      img.onerror = tick
      img.src = u
      return img
    })
    const to = setTimeout(() => { if (!cancelled) setAssetsReady(true) }, ASSET_TIMEOUT_MS)
    return () => { cancelled = true; clearTimeout(to); imgs.forEach(i => { i.onload = null; i.onerror = null }) }
  }, [loaded])

  // Site items + visuals ready AND base time elapsed → hand off.
  useEffect(() => {
    if (!(loaded && assetsReady && baseDone) || fired.current) return
    fired.current = true
    const cur = logoRef.current
    const target = isHome ? document.querySelector('[data-brand-logo]') : null
    if (!reduced && cur && target) {
      const t = target.getBoundingClientRect()
      const c = cur.getBoundingClientRect()
      setDelta({ dx: (t.left + t.width / 2) - (c.left + c.width / 2), dy: (t.top + t.height / 2) - (c.top + c.height / 2) })
      setFlip(true)
      setFading(true)
      const id = setTimeout(onFinish, 860)
      return () => clearTimeout(id)
    }
    setFading(true)
    const id = setTimeout(onFinish, 560)
    return () => clearTimeout(id)
  }, [loaded, assetsReady, baseDone, isHome, reduced, onFinish])

  // NOTE: opacity is driven by `style` (always 1), never by the animation, so
  // the logo is visible even if rAF is throttled / animations don't run. Only
  // the non-home exit overrides opacity to fade out.
  const logoAnimate = flip
    ? { x: delta.dx, y: delta.dy, scale: 1 }
    : fading
      ? { opacity: 0, scale: 0.96 }
      : { x: 0, y: 0, scale: 1 }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      {/* Animated loader layer — fades out during the hand-off */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: fading ? 0 : 1 }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
        style={{ position: 'absolute', inset: 0, background: 'var(--color-bg)', overflow: 'hidden' }}
      >
        {/* pulsing ambient glow */}
        <motion.div
          animate={reduced ? {} : { opacity: [0.4, 0.75, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 46%, color-mix(in srgb, var(--accent) 13%, transparent) 0%, transparent 58%)' }}
        />

        {/* sonar sound-waves emanating from the centre */}
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            initial={{ scale: 0.42, opacity: 0 }}
            animate={reduced ? { scale: 1, opacity: 0.16 } : { scale: [0.42, 1.7], opacity: [0, 0.45, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, delay: i * 1.06, ease: 'easeOut' }}
            style={{ ...centered(168), borderRadius: '50%', border: '1.5px solid color-mix(in srgb, var(--accent) 55%, transparent)' }}
          />
        ))}

        {/* outer rotating accent arc */}
        <motion.div
          animate={reduced ? {} : { rotate: 360 }}
          transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
          style={{
            ...centered(300), borderRadius: '50%',
            background: 'conic-gradient(from 0deg, transparent 0deg, transparent 220deg, var(--color-accent) 350deg, transparent 360deg)',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px))',
          }}
        />
        {/* inner counter-rotating arc */}
        <motion.div
          animate={reduced ? {} : { rotate: -360 }}
          transition={{ duration: 4.4, repeat: Infinity, ease: 'linear' }}
          style={{
            ...centered(232), borderRadius: '50%',
            background: 'conic-gradient(from 0deg, transparent 0deg, transparent 280deg, var(--accent-2) 360deg)',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 0.5px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 0.5px))',
          }}
        />

        {/* equalizer + tagline near the bottom */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 'clamp(64px, 16vh, 140px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <Equalizer reduced={reduced} />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: fading ? 0 : 0.7 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--color-muted)', margin: 0, textAlign: 'center', padding: '0 16px' }}
          >
            {site.tagline || 'Loading'}
          </motion.p>
        </div>
      </motion.div>

      {/* Brand — above the loader; survives the hand-off on home (FLIP), fades elsewhere */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        {loaded && (
          site.logoUrl ? (
            <motion.img
              ref={logoRef}
              src={site.logoUrl}
              alt={site.artistName || 'Logo'}
              initial={{ scale: 0.94 }}
              animate={logoAnimate}
              transition={flip ? { duration: 0.85, ease: [0.16, 1, 0.3, 1] } : { duration: 0.6, ease: 'easeOut' }}
              style={{ ...logoStyle(site), opacity: 1 }}
            />
          ) : (
            <motion.h1
              ref={logoRef}
              initial={{ scale: 0.94 }}
              animate={logoAnimate}
              transition={flip ? { duration: 0.85, ease: [0.16, 1, 0.3, 1] } : { duration: 0.6, ease: 'easeOut' }}
              style={{ ...nameStyle, opacity: 1 }}
            >
              {site.artistName || 'Artist Name'}
            </motion.h1>
          )
        )}
      </div>
    </div>
  )
}

function Equalizer({ reduced }) {
  const bars = [0.45, 0.8, 0.55, 1, 0.6, 0.85, 0.4]
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 26 }} aria-hidden>
      {bars.map((h, i) => (
        <motion.span
          key={i}
          animate={reduced ? { scaleY: h } : { scaleY: [h, 1, 0.3, h] }}
          transition={{ duration: 0.95, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
          style={{
            width: 3, height: 26, borderRadius: 3, transformOrigin: 'bottom',
            background: 'linear-gradient(to top, var(--color-accent), color-mix(in srgb, var(--accent-2) 75%, var(--color-accent)))',
            boxShadow: '0 0 8px color-mix(in srgb, var(--accent) 40%, transparent)',
          }}
        />
      ))}
    </div>
  )
}
