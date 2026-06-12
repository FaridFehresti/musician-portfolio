import { memo, useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../../../../hooks/usePrefersReducedMotion'
import {
  cssColor,
  diskCircle,
  buildBodyPerimeter,
  outwardNormal,
  createAudioEngine,
} from './effectLib'

/* ───────────────────────────────────────────────────────────────────────
 * PulseRings — the card body emits shockwave rings on beats, like a
 * subwoofer membrane. Each ring is the body outline (sleeve ∪ disk)
 * offset OUTWARD along precomputed per-point normals, so by construction
 * a ring can never cross the body's face. A bass-following halo hugs the
 * outline between beats so the border visibly thumps with the low end.
 * ──────────────────────────────────────────────────────────────────────── */

const easeOutSine = t => Math.sin((t * Math.PI) / 2)

/* Trace the body outline offset outward by `d` as one closed path.
   Strokes accumulate on this path, so callers stroke it multiple times. */
function traceOffset(ctx, pts, nrm, d) {
  ctx.beginPath()
  ctx.moveTo(pts[0].x + nrm[0].x * d, pts[0].y + nrm[0].y * d)
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x + nrm[i].x * d, pts[i].y + nrm[i].y * d)
  }
  ctx.closePath()
}

export const PulseRings = memo(function PulseRings({
  size,
  playing = false,
  howl = null,
  lite = false,
  radius = 18,
  diskReach = 0.5,
}) {
  const reduced = usePrefersReducedMotion()
  const canvasRef = useRef(null)
  const playingRef = useRef(playing)
  const howlRef = useRef(howl)
  useEffect(() => { playingRef.current = playing }, [playing])
  useEffect(() => { howlRef.current = howl }, [howl])

  // Rings travel up to ~0.62*size outward — equal sky on every side.
  const pad = Math.round(size * 0.6)
  const padX = pad, padTop = pad, padBottom = pad
  const cw = size + padX * 2
  const ch = padTop + size + padBottom

  useEffect(() => {
    if (reduced) return
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2)
    canvas.width = Math.round(cw * dpr)
    canvas.height = Math.round(ch * dpr)
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const bx = padX, by = padTop
    const ccx = bx + size / 2, ccy = by + size / 2
    const diskC = diskCircle(bx, by, size, diskReach)
    const per = buildBodyPerimeter(bx, by, size, radius, diskC)
    // parallel array: outward unit normal per perimeter point — a ring at
    // offset d is the closed polyline per.pts[i] + nrm[i]*d
    const nrm = per.pts.map(p => outwardNormal(p, ccx, ccy, diskC))

    const engine = createAudioEngine()
    const st = {
      rings: [],
      accent: 'rgb(255,47,208)', accent2: 'rgb(0,229,255)', lastColor: 0,
      cleared: true, prev: performance.now(), raf: 0,
    }

    function pushRing(r) {
      if (st.rings.length >= 14) st.rings.shift() // cap: drop oldest
      st.rings.push(r)
    }

    /* Relaxed by design: rings stay close to the card (≤ ~0.3·size), expand
       slowly on a gentle ease, and fade soft — a ripple, not a blast. */
    function spawnBeat(intensity, now) {
      const swap = Math.random() < 0.3
      const glow = swap ? st.accent2 : st.accent
      const col = swap ? st.accent : st.accent2
      const life = 900 + 400 * intensity
      const dMax = size * (0.14 + 0.16 * intensity)
      pushRing({
        born: now, life, dMax,
        w: 2 + 2 * intensity, intensity, glow, col, mul: 1,
      })
      if (intensity > 0.85) {
        // only monster hits get the trailing double-thump
        pushRing({
          born: now, life: life * 0.8, dMax: dMax * 0.6,
          w: 2 + 2 * intensity, intensity, glow, col, mul: 1,
        })
      }
    }

    function tick(now) {
      st.raf = requestAnimationFrame(tick)
      const dt = Math.min(0.05, (now - st.prev) / 1000)
      st.prev = now

      const drive = engine.update(howlRef.current, playingRef.current, now, dt)

      if (now - st.lastColor > 800) {
        st.accent = cssColor('--accent', 'rgb(255,47,208)')
        st.accent2 = cssColor('--accent-2', 'rgb(0,229,255)')
        st.lastColor = now
      }

      // dormant section / stopped transport ⇒ no halo, no new rings
      const live = !(drive.flow < 0.02 && !drive.playing)
      if (live) {
        if (drive.beat) spawnBeat(drive.beat, now)
        if (drive.minor) {
          pushRing({
            born: now, life: 420, dMax: size * 0.16,
            w: 1.5, intensity: drive.minor,
            glow: st.accent, col: st.accent2, mul: 0.6,
          })
        }
      }

      const idle = !st.rings.length && !playingRef.current
      if (idle && !live) {
        if (!st.cleared) { ctx.clearRect(0, 0, cw, ch); st.cleared = true }
        return
      }
      ctx.clearRect(0, 0, cw, ch)
      st.cleared = false
      ctx.globalCompositeOperation = 'lighter'

      // breathing halo: outline offset rides the bass envelope
      if (live) {
        const flick = 0.9 + 0.1 * Math.sin(now * 0.017)
        traceOffset(ctx, per.pts, nrm, 2 + drive.bass * 9)
        ctx.strokeStyle = st.accent2
        ctx.lineWidth = 5
        ctx.globalAlpha = Math.min(1, (0.05 + drive.flow * 0.2) * flick)
        ctx.stroke()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1.4
        ctx.globalAlpha = Math.min(1, (0.07 + drive.flow * 0.22) * flick)
        ctx.stroke()
      }

      for (let i = st.rings.length - 1; i >= 0; i--) {
        const r = st.rings[i]
        const t = (now - r.born) / r.life
        if (t >= 1) { st.rings.splice(i, 1); continue }
        const a = Math.pow(1 - t, 1.6) * (0.35 + 0.5 * r.intensity) * r.mul
        if (a <= 0.004) continue
        traceOffset(ctx, per.pts, nrm, r.dMax * easeOutCubic(t))
        ctx.strokeStyle = r.glow
        ctx.lineWidth = r.w * 4
        ctx.globalAlpha = Math.min(1, a * 0.25)
        ctx.stroke()
        ctx.strokeStyle = r.col
        ctx.lineWidth = r.w * 1.6
        ctx.globalAlpha = Math.min(1, a * 0.6)
        ctx.stroke()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = r.w * 0.55
        ctx.globalAlpha = Math.min(1, a)
        ctx.stroke()
      }

      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    st.raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(st.raf)
  }, [size, lite, radius, reduced, cw, ch, padX, padTop, diskReach])

  if (reduced) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'absolute', left: -padX, top: -padTop,
        width: cw, height: ch,
        pointerEvents: 'none', zIndex: 2,
      }}
    />
  )
})
