import { useEffect, useRef, useCallback } from 'react'
import Lenis from 'lenis'

/* ───────────────────────────────────────────────────────────────────────
 * Smooth, inertial scroll for the /lab journey (the buttery glide that makes
 * a scroll-driven 3D site feel cinematic rather than steppy). Lenis owns the
 * scroll, so it is also the single source of truth for progress: `onScroll`
 * fires every frame with Lenis's own 0..1 progress, which we feed straight to
 * the scene + overlays. (Driving everything from one Lenis value avoids the
 * desync you get pairing Lenis with framer-motion's useScroll.)
 *
 * Scoped to the page that mounts it and torn down on unmount so the rest of
 * the app keeps native scroll. Returns { scrollTo } where `scrollTo(progress)`
 * glides to a 0..1 fraction of the page — used by the chapter rail. When
 * `enabled` is false (reduced motion) it stays out of the way.
 * ──────────────────────────────────────────────────────────────────────── */
export function useLenis(enabled, onScroll) {
  const lenisRef = useRef(null)
  const cbRef = useRef(onScroll)
  // keep the latest callback in the ref without touching it during render
  useEffect(() => { cbRef.current = onScroll }, [onScroll])

  useEffect(() => {
    if (!enabled) return
    const lenis = new Lenis({
      lerp: 0.085,        // inertia — lower = more glide
      wheelMultiplier: 0.9,
      smoothWheel: true,
      touchMultiplier: 1.4,
    })
    lenisRef.current = lenis
    if (typeof window !== 'undefined') window.__lenis = lenis

    let raf
    const loop = (time) => {
      if (typeof window !== 'undefined') window.__lenisFrames = (window.__lenisFrames || 0) + 1
      lenis.raf(time)
      // Read progress straight off the instance every frame (the 'scroll' event
      // payload shape is version-dependent; the instance getter is reliable).
      const p = typeof lenis.progress === 'number'
        ? lenis.progress
        : lenis.limit ? lenis.scroll / lenis.limit : 0
      cbRef.current?.(p < 0 ? 0 : p > 1 ? 1 : p)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [enabled])

  const scrollTo = useCallback((progress) => {
    const lenis = lenisRef.current
    if (lenis) {
      lenis.scrollTo(Math.max(0, Math.min(1, progress)) * lenis.limit, { duration: 1.6 })
    } else {
      const max = document.documentElement.scrollHeight - window.innerHeight
      window.scrollTo({ top: progress * max, behavior: 'smooth' })
    }
  }, [])

  return { scrollTo }
}
