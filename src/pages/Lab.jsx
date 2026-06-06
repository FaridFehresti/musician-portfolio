import { Component, Suspense, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { motion, useScroll, useMotionValueEvent, useTransform } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Scene } from '../lab/Scene'
import { AudioBridge } from '../lab/audio/AudioBridge'
import { ReducedMotionScene } from '../lab/ReducedMotionScene'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { useBreakpoint, useIsHoverDevice } from '../hooks/useViewport'
import { usePlayerStore } from '../store/playerStore'
import { tracks } from '../data/tracks'
import { PARTICLE_COUNTS, DPR, MULTISAMPLING, COPY, COLORS } from '../lab/config'
import styles from '../lab/lab.module.css'

/* Catches WebGL context-creation / render failures and degrades gracefully. */
class CanvasErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) return this.props.fallback
    return this.props.children
  }
}

/* ───────────────────────────────────────────────────────────────────────
 * /lab — immersive scroll-driven 3D music journey. Full-screen (Nav/PlayerBar
 * are hidden for this route in App.jsx). A fixed WebGL canvas sits behind DOM
 * overlays; a 500vh spacer drives document scroll, mapped to camera travel.
 * ──────────────────────────────────────────────────────────────────────── */
export default function Lab() {
  const reduced = usePrefersReducedMotion()
  const breakpoint = useBreakpoint()
  const hover = useIsHoverDevice()
  const navigate = useNavigate()

  // Shared mutable refs — written outside React's render loop, read in useFrame.
  // (Live audio flows through the audioSink module singleton, not a prop ref.)
  const scrollRef = useRef(0)
  const pointerRef = useRef({ x: 0, y: 0 })

  const { scrollYProgress } = useScroll()
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    scrollRef.current = v
  })

  // Overlay reveals — GPU-driven by framer-motion, no React re-renders.
  const heroOpacity = useTransform(scrollYProgress, [0, 0.1, 0.16], [1, 1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.16], [0, -40])
  const heroPE = useTransform(scrollYProgress, (v) => (v < 0.16 ? 'auto' : 'none'))
  const hintOpacity = useTransform(scrollYProgress, [0, 0.06, 0.14], [0.8, 0.8, 0])
  const ctaOpacity = useTransform(scrollYProgress, [0.86, 0.93], [0, 1])
  const ctaPE = useTransform(scrollYProgress, (v) => (v > 0.86 ? 'auto' : 'none'))

  // Pointer parallax — desktop pointer devices only.
  useEffect(() => {
    if (!hover) return
    const onMove = (e) => {
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointerRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [hover])

  const startAudio = () => {
    const store = usePlayerStore.getState()
    if (!store.queue.length) store.setQueue(tracks)
    store.loadTrack(tracks[0]) // runs in a click handler → unlocks the AudioContext
  }

  if (reduced) {
    return <ReducedMotionScene onPlay={startAudio} onNavigate={navigate} />
  }

  const lite = breakpoint === 'mobile'
  const fallback = <ReducedMotionScene onPlay={startAudio} onNavigate={navigate} />

  return (
    <div className={styles.root} style={{ background: COLORS.bg }}>
      {/* DOM-side bridge from live audio analyser → audioSink module (renders null) */}
      <AudioBridge />

      <div className={styles.canvasLayer}>
        <CanvasErrorBoundary fallback={fallback}>
          <Canvas
            flat
            dpr={DPR[breakpoint]}
            gl={{ antialias: false, powerPreference: 'high-performance' }}
            camera={{ fov: 72, near: 0.1, far: 400, position: [0, 0, 18] }}
          >
            <Suspense fallback={null}>
              <Scene
                scrollRef={scrollRef}
                pointerRef={pointerRef}
                particleCount={PARTICLE_COUNTS[breakpoint]}
                multisampling={MULTISAMPLING[breakpoint]}
                lite={lite}
              />
            </Suspense>
          </Canvas>
        </CanvasErrorBoundary>
      </div>

      {/* Stage 0 — entrance hero */}
      <motion.div className={styles.hero} style={{ opacity: heroOpacity, y: heroY, pointerEvents: heroPE }}>
        <p className={styles.kicker}>{COPY.subtitle}</p>
        <h1 className={styles.title}>{COPY.title}</h1>
        <div className={styles.ctaRow}>
          <button className={styles.playBtn} onClick={startAudio}>▶ {COPY.play}</button>
        </div>
      </motion.div>

      <motion.div className={styles.hint} style={{ opacity: hintOpacity }}>
        {COPY.scrollHint} ↓
      </motion.div>

      {/* Stage 4 — arrival / CTA */}
      <motion.div className={styles.cta} style={{ opacity: ctaOpacity, pointerEvents: ctaPE }}>
        <h2 className={styles.ctaTitle}>{COPY.ctaHeading}</h2>
        <div className={styles.ctaRow}>
          <button className={styles.playBtn} onClick={startAudio}>▶ Play</button>
          <button className={styles.ghostBtn} onClick={() => navigate('/library')}>Library</button>
          <button className={styles.ghostBtn} onClick={() => navigate('/now-playing')}>Now Playing</button>
        </div>
      </motion.div>

      {/* Scroll length for the journey */}
      <div className={styles.spacer} aria-hidden="true" />
    </div>
  )
}
