import { memo, useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../../../../hooks/usePrefersReducedMotion'
import {
  TAU, cssColor, diskCircle, buildBodyPerimeter, pointAtPerimeter,
  outwardNormal, strokePerimeter, drawGlowNode, createAudioEngine,
} from './effectLib'

/* ───────────────────────────────────────────────────────────────────────
 * EmberDrift — the card sheds glowing embers, like a body running hot.
 *
 * Embers spawn on the body outline (sleeve ∪ disk) and leave along the
 * outward normal with buoyancy + waver, so nothing ever crosses the face.
 * Shedding rate rides drive.flow; beats flare a burst + heat flash + a
 * bright border stretch; minor onsets sputter a few small embers. A warm
 * under-glow pools below the bottom edge — heat rising.
 * ──────────────────────────────────────────────────────────────────────── */

const rgbA = (c, a) => (c.startsWith('rgb(') ? c.replace('rgb(', 'rgba(').replace(')', `,${a})`) : c)

export const EmberDrift = memo(function EmberDrift({
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

  // headroom above for rising embers, a strip below for the under-glow
  const padX = Math.round(size * 0.6)
  const padTop = Math.round(size * 0.75)
  const padBottom = Math.round(size * 0.45)
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

    const bx = padX, by = padTop
    const ccx = bx + size / 2, ccy = by + size / 2
    const diskC = diskCircle(bx, by, size, diskReach)
    const per = buildBodyPerimeter(bx, by, size, radius, diskC)
    const engine = createAudioEngine()
    const cap = lite ? 90 : 220

    const st = {
      embers: [], flashes: [], runs: [],
      accent: 'rgb(255,47,208)', accent2: 'rgb(0,229,255)',
      lastColor: 0, spawnAcc: 0, cleared: true,
      prev: performance.now(), raf: 0,
    }

    function emberColor() {
      const r = Math.random()
      return r < 0.55 ? st.accent : r < 0.9 ? st.accent2 : 'rgb(255,255,255)'
    }

    /* One ember leaving body point p along angle `ang`. */
    function spawnEmber(p, ang, speed, now, life, sz) {
      st.embers.push({
        x: p.x, y: p.y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed - (4 + Math.random() * 10),
        born: now, life, size: sz,
        seed: Math.random() * TAU * 4,
        glowK: 3 + Math.random() * 4,
        col: emberColor(),
      })
    }

    /* Beat flare: ember fan + heat flash + bright border stretch, all at
       ONE random perimeter point. */
    function flare(intensity, now) {
      const s = Math.random() * per.total
      const p = pointAtPerimeter(per, s)
      const n = outwardNormal(p, ccx, ccy, diskC)
      const count = Math.round(8 + 18 * intensity)
      for (let i = 0; i < count && st.embers.length < cap; i++) {
        const ang = n.ang + (Math.random() - 0.5) * 1.9
        const sp = (50 + Math.random() * 130) * (0.55 + intensity)
        spawnEmber(p, ang, sp, now, 700 + Math.random() * 900, (1 + Math.random() * 2.2) * (0.6 + intensity))
      }
      // flash centre nudged outward so the glow leans off the face
      st.flashes.push({
        x: p.x + n.x * 8, y: p.y + n.y * 8,
        born: now, life: 400, rmax: 30 + 60 * intensity, intensity,
      })
      st.runs.push({ s0: s - size * 0.2, len: size * 0.4, born: now, life: 500, intensity })
    }

    /* Minor onset: a few quick small embers, no flash. */
    function sputter(now) {
      const s = Math.random() * per.total
      const p = pointAtPerimeter(per, s)
      const n = outwardNormal(p, ccx, ccy, diskC)
      const count = 3 + Math.round(Math.random() * 2)
      for (let i = 0; i < count && st.embers.length < cap; i++) {
        const ang = n.ang + (Math.random() - 0.5) * 1.2
        spawnEmber(p, ang, 30 + Math.random() * 50, now, 500 + Math.random() * 400, 0.8 + Math.random() * 1.2)
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

      // continuous shedding — rate breathes with the song's flow
      if (drive.playing) {
        st.spawnAcc += (2 + drive.flow * 26) * (lite ? 0.5 : 1) * dt
        while (st.spawnAcc >= 1) {
          st.spawnAcc -= 1
          if (st.embers.length >= cap) { st.spawnAcc = 0; break }
          const s = Math.random() * per.total
          const p = pointAtPerimeter(per, s)
          const n = outwardNormal(p, ccx, ccy, diskC)
          spawnEmber(p, n.ang, 20 + Math.random() * 40, now,
            1200 + Math.random() * 1400, (1 + Math.random() * 2.2) * (0.6 + drive.flow))
        }
        if (drive.beat) flare(drive.beat, now)
        else if (drive.minor) sputter(now)
      } else {
        st.spawnAcc = 0
      }

      const idle = !st.embers.length && !st.flashes.length && !st.runs.length
      if (idle && !playingRef.current) {
        if (!st.cleared) { ctx.clearRect(0, 0, cw, ch); st.cleared = true }
        return
      }
      ctx.clearRect(0, 0, cw, ch)
      st.cleared = idle
      ctx.globalCompositeOperation = 'lighter'

      // under-glow: heat pooling below the bottom edge — clipped to below
      // the card so the face stays clean; squashed to a shallow ellipse
      const glowA = (drive.playing ? 0.04 + drive.flow * 0.22 : drive.flow * 0.26)
        * (0.82 + 0.18 * Math.sin(now * 0.0016))
      if (glowA > 0.004) {
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, by + size, cw, ch - by - size)
        ctx.clip()
        ctx.translate(ccx, by + size)
        ctx.scale(1, 0.34)
        const rr = size * 0.55
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rr)
        g.addColorStop(0, rgbA(st.accent, 0.9))
        g.addColorStop(0.55, rgbA(st.accent2, 0.35))
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.globalAlpha = glowA
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(0, 0, rr, 0, TAU)
        ctx.fill()
        ctx.restore()
      }

      for (let i = st.runs.length - 1; i >= 0; i--) {
        const r = st.runs[i]
        const t = (now - r.born) / r.life
        if (t >= 1) { st.runs.splice(i, 1); continue }
        const a = Math.pow(1 - t, 1.4) * (0.45 + 0.55 * r.intensity)
        strokePerimeter(ctx, per, r.s0, r.len, 5, st.accent2, a * 0.35)
        strokePerimeter(ctx, per, r.s0, r.len, 1.4, '#ffffff', a * 0.8)
      }

      for (let i = st.flashes.length - 1; i >= 0; i--) {
        const f = st.flashes[i]
        const t = (now - f.born) / f.life
        if (t >= 1) { st.flashes.splice(i, 1); continue }
        const a = Math.pow(1 - t, 1.6) * (0.4 + 0.6 * f.intensity)
        drawGlowNode(ctx, f.x, f.y, f.rmax * (0.55 + 0.45 * t), a, st.accent)
      }

      for (let i = st.embers.length - 1; i >= 0; i--) {
        const e = st.embers[i]
        const t = (now - e.born) / e.life
        if (t >= 1) { st.embers.splice(i, 1); continue }
        e.vy -= 30 * dt                 // buoyancy: hot air rises
        e.vx *= Math.exp(-dt * 0.9)     // mild drag
        e.vy *= Math.exp(-dt * 0.9)
        e.x += (e.vx + Math.sin(now * 0.004 + e.seed) * 14) * dt
        e.y += e.vy * dt
        if (e.x < -12 || e.x > cw + 12 || e.y < -12 || e.y > ch + 12) { st.embers.splice(i, 1); continue }
        // buoyant embers can drift back over the face — kill them at the
        // outline (delay covers corner spawns that sit inside the bbox)
        if (now - e.born > 350) {
          const inCard = e.x > bx + 2 && e.x < bx + size - 2 && e.y > by + 2 && e.y < by + size - 2
          if (inCard || Math.hypot(e.x - diskC.x, e.y - diskC.y) < diskC.r - 2) {
            st.embers.splice(i, 1)
            continue
          }
        }
        const flicker = 0.68 + 0.32 * Math.sin(now * 0.012 + e.seed)
        const a = Math.pow(1 - t, 1.3) * flicker
        const r = Math.max(0.2, e.size * (1 - 0.65 * t))
        drawGlowNode(ctx, e.x, e.y, r * e.glowK, a, e.col)
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
