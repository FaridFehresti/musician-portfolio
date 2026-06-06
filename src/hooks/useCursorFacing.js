import { useEffect, useRef } from 'react'

/**
 * Global "face the cursor" tilt for idle cards (Dota hero-grid feel).
 *
 * One window pointer listener + one rAF drive every registered card, so a
 * full grid costs a single listener. Each card tilts gently toward the global
 * cursor position; when `enabled` is false (e.g. the card is hovered and the
 * local hover-tilt takes over, or reduced-motion) its transform is cleared.
 *
 * The element's `transform` is written directly (not via React) — keep it out
 * of the element's style prop and let a CSS `transition` smooth the motion.
 */

let px = -99999
let py = -99999
let raf = 0
let listeners = 0
const subs = new Set()

function onMove(e) {
  px = e.clientX
  py = e.clientY
  if (!raf) raf = requestAnimationFrame(flush)
}

function flush() {
  raf = 0
  subs.forEach(fn => fn(px, py))
}

export function useCursorFacing(enabled, maxDeg = 9) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) {
      if (el) el.style.transform = ''
      return
    }

    const update = (mx, my) => {
      const r = el.getBoundingClientRect()
      if (!r.width) return
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = Math.max(-1, Math.min(1, (mx - cx) / (window.innerWidth / 2)))
      const dy = Math.max(-1, Math.min(1, (my - cy) / (window.innerHeight / 2)))
      el.style.transform =
        `perspective(1000px) rotateY(${(dx * maxDeg).toFixed(2)}deg) rotateX(${(-dy * maxDeg).toFixed(2)}deg)`
    }

    subs.add(update)
    if (listeners++ === 0) window.addEventListener('pointermove', onMove, { passive: true })
    if (px > -99999) update(px, py) // orient toward last known cursor immediately

    return () => {
      subs.delete(update)
      if (--listeners === 0) {
        window.removeEventListener('pointermove', onMove)
        if (raf) { cancelAnimationFrame(raf); raf = 0 }
      }
      if (el) el.style.transform = ''
    }
  }, [enabled, maxDeg])

  return ref
}
