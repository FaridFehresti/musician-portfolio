import { Component, Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Visualizer } from './Visualizer'
import { AudioBridge } from './AudioBridge'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { useBreakpoint } from '../../hooks/useViewport'

/* Catches WebGL context-creation / render failures and degrades to nothing
   (the page's normal background shows through). */
class CanvasErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false } }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? (this.props.fallback ?? null) : this.props.children }
}

/* ───────────────────────────────────────────────────────────────────────
 * The "Resonance" audio-reactive galaxy, packaged as a drop-in layer. It fills
 * its positioned parent (100%×100%), self-rotates the camera smoothly, and
 * reads the player's live audio via <AudioBridge> → audioSink. Used as the
 * Now Playing background and, expanded, as the fullscreen visualizer.
 *
 *   interactive — allow click-drag / zoom (fullscreen mode); off = pure backdrop
 * ─────────────────────────────────────────────────────────────────────── */
export function VisualizerBackground({ interactive = false }) {
  const reduced = usePrefersReducedMotion()
  const bp = useBreakpoint()
  const lite = bp === 'mobile'

  // The container can mount at a 0 size for a frame (react-use-measure latches
  // it), leaving the canvas at its default 300×150. A couple of resize nudges
  // force it to fill the container once laid out.
  useEffect(() => {
    const fire = () => window.dispatchEvent(new Event('resize'))
    const raf = requestAnimationFrame(fire)
    const t = setTimeout(fire, 250)
    return () => { cancelAnimationFrame(raf); clearTimeout(t) }
  }, [])

  return (
    <>
      {/* live audio → shared sink (renders null, lives in the DOM not the Canvas) */}
      <AudioBridge />

      <CanvasErrorBoundary fallback={null}>
        <Canvas
          dpr={[1, lite ? 1.2 : 1.8]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          camera={{ fov: 56, near: 0.1, far: 200, position: [0, 0, 42] }}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <Suspense fallback={null}>
            <Visualizer reduced={reduced} lite={lite} autoRotate interactive={interactive} />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>
    </>
  )
}
