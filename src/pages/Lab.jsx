import { Component, Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Link } from 'react-router-dom'
import { Visualizer } from '../lab/Visualizer'
import { AudioBridge } from '../lab/audio/AudioBridge'
import { usePlayerStore } from '../store/playerStore'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { useBreakpoint } from '../hooks/useViewport'
import { tracks } from '../data/tracks'

/* Catches WebGL context-creation / render failures and degrades gracefully. */
class CanvasErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false } }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

/* ───────────────────────────────────────────────────────────────────────
 * /lab — "Resonance": a full-screen, music-reactive 3D scene. A distorting
 * neon orb + a ring of frequency bars + a synthwave grid all react to the
 * player's live audio (via <AudioBridge> → audioSink). Nav/PlayerBar are
 * hidden here (immersive), so this page carries its own minimal transport.
 * ─────────────────────────────────────────────────────────────────────── */
export default function Lab() {
  const reduced = usePrefersReducedMotion()
  const bp = useBreakpoint()
  const lite = bp === 'mobile'

  // This page is static (no scroll/resize), so react-use-measure can latch onto
  // a 0-size initial read and never re-fire, leaving the canvas at its default
  // 300×150. A couple of resize nudges after mount force it to fill the screen.
  useEffect(() => {
    const fire = () => window.dispatchEvent(new Event('resize'))
    const raf = requestAnimationFrame(fire)
    const t = setTimeout(fire, 250)
    return () => { cancelAnimationFrame(raf); clearTimeout(t) }
  }, [])

  const fallback = (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 18, textAlign: 'center', padding: 24,
    }}>
      <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', fontSize: 13 }}>
        3D isn’t available on this device.
      </p>
      <Link to="/" style={backLinkStyle}>← Back to portfolio</Link>
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#070410', overflow: 'hidden' }}>
      {/* live audio → shared sink (renders null) */}
      <AudioBridge />

      <CanvasErrorBoundary fallback={fallback}>
        <Canvas
          dpr={[1, lite ? 1.2 : 1.8]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          camera={{ fov: 42, near: 0.1, far: 100, position: [0, 2.4, 8] }}
        >
          <Suspense fallback={null}>
            <Visualizer reduced={reduced} lite={lite} />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>

      {/* edge darkening for cinematic framing */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        boxShadow: 'inset 0 0 220px 40px rgba(0,0,0,0.75)',
      }} />

      <Overlay reduced={reduced} />
    </div>
  )
}

/* ── DOM overlay: title, back link, transport ──────────────────────────── */
function Overlay() {
  const { currentTrack, isPlaying, play, pause, next, prev, loadTrack, setQueue } = usePlayerStore()

  function toggle() {
    if (!currentTrack) {
      setQueue(tracks)
      loadTrack(tracks[0]) // click = user gesture → unlocks AudioContext
      return
    }
    isPlaying ? pause() : play()
  }

  return (
    <>
      {/* top bar */}
      <div style={{ position: 'absolute', top: 22, left: 24, right: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none' }}>
        <Link to="/" style={{ ...backLinkStyle, pointerEvents: 'auto' }}>← Portfolio</Link>
        <div style={{ textAlign: 'right' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 900,
            fontSize: 'clamp(20px, 3vw, 34px)', color: 'var(--color-text)', lineHeight: 1,
            textShadow: '0 0 40px rgba(255,47,208,0.4)',
          }}>
            Resonance
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--color-muted)', marginTop: 4 }}>
            Audio-reactive lab
          </p>
        </div>
      </div>

      {/* bottom transport */}
      <div style={{
        position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px',
        borderRadius: 999, background: 'rgba(10,6,20,0.55)', backdropFilter: 'blur(12px)',
        border: '1px solid color-mix(in srgb, var(--accent-2) 24%, transparent)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)', maxWidth: '92vw',
      }}>
        <CircleBtn onClick={prev} label="Previous" disabled={!currentTrack}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2h2v12H4zM14 2v12l-8-6z" /></svg>
        </CircleBtn>

        <button onClick={toggle} aria-label={isPlaying ? 'Pause' : 'Play'} style={{
          width: 52, height: 52, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
          border: '1.5px solid var(--neon-magenta)',
          background: isPlaying ? 'var(--neon-magenta)' : 'color-mix(in srgb, var(--neon-magenta) 16%, transparent)',
          color: isPlaying ? 'var(--on-accent)' : 'var(--neon-magenta)',
          boxShadow: isPlaying ? '0 0 22px var(--glow-magenta)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .18s, box-shadow .18s',
        }}>
          {isPlaying
            ? <svg width="16" height="18" viewBox="0 0 14 16" fill="currentColor"><path d="M0 0h4v16H0zM9 0h4v16H9z" /></svg>
            : <svg width="16" height="18" viewBox="0 0 14 16" fill="currentColor" style={{ marginLeft: 2 }}><path d="M0 0l13 8L0 16z" /></svg>}
        </button>

        <CircleBtn onClick={next} label="Next" disabled={!currentTrack}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M10 2h2v12h-2zM2 2l8 6-8 6z" /></svg>
        </CircleBtn>

        <div style={{ minWidth: 0, maxWidth: 220, paddingRight: 6 }}>
          <p style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: 14,
            color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {currentTrack ? currentTrack.title : 'Press play to react'}
          </p>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--color-muted)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {currentTrack ? currentTrack.artist : 'the scene reacts to the music'}
          </p>
        </div>
      </div>
    </>
  )
}

function CircleBtn({ onClick, label, disabled, children }) {
  return (
    <button onClick={onClick} aria-label={label} disabled={disabled} style={{
      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
      cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.4 : 1,
      background: 'transparent', border: '1px solid color-mix(in srgb, var(--accent-2) 30%, transparent)',
      color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {children}
    </button>
  )
}

const backLinkStyle = {
  fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'var(--color-text)', textDecoration: 'none', padding: '8px 14px', borderRadius: 999,
  background: 'rgba(10,6,20,0.5)', backdropFilter: 'blur(8px)',
  border: '1px solid color-mix(in srgb, var(--accent-2) 22%, transparent)',
}
