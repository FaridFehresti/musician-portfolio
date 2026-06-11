import { memo, useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import {
  cssColor, diskCircle, buildBodyPerimeter, pointAtPerimeter,
  outwardNormal, drawGlowNode, createAudioEngine,
} from './effectLib'

/* ───────────────────────────────────────────────────────────────────────
 * CometOrbit — glowing comets race along the body outline (sleeve ∪ vinyl
 * disk bulge), riding 7px OUTSIDE the border so they trace the silhouette
 * without ever crossing the card's face. Slots wake as the song's flow
 * rises (quiet verse = one slow comet, chorus = four fast ones); beats
 * surge the orbit speed and burst sparks off every live head.
 * ──────────────────────────────────────────────────────────────────────── */

const GATES = [0.04, 0.3, 0.55, 0.78] // flow needed to wake each slot
const TRAIL_N = 10
const RIDE = 7 // px outside the border

export const CometOrbit = memo(function CometOrbit({
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

  // Wider X pad: the disk bulge reaches ~0.46·size past the card's right
  // edge, and the comet rides + glows another ~20px beyond that.
  const padX = Math.round(size * 0.6)
  const padTop = Math.round(size * 0.35)
  const cw = size + padX * 2
  const ch = size + padTop * 2

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
    const engine = createAudioEngine()

    const slots = GATES.map((gate, i) => ({
      gate,
      dir: i % 2 === 0 ? 1 : -1,
      even: i % 2 === 0, // even slots ride --accent, odd ride --accent-2
      s: (per.total * i) / GATES.length,
      act: 0, alive: false, flash: -1e4,
    }))
    // scratch positions: [0] = head, [1..TRAIL_N] = trail (reused per frame)
    const pts = Array.from({ length: TRAIL_N + 1 }, () => ({ x: 0, y: 0 }))

    const st = {
      sparks: [], surge: 0,
      accent: 'rgb(255,47,208)', accent2: 'rgb(0,229,255)', lastColor: -1e4,
      cleared: true, prev: performance.now(), raf: 0,
    }

    function headAt(s, out) {
      const p = pointAtPerimeter(per, s)
      const nrm = outwardNormal(p, ccx, ccy, diskC)
      out.x = p.x + nrm.x * RIDE
      out.y = p.y + nrm.y * RIDE
      return nrm
    }

    /* Outward fan off a comet's head — no gravity, short-lived. */
    function emitSparks(slot, count, now) {
      const nrm = headAt(slot.s, pts[0])
      for (let i = 0; i < count; i++) {
        const a = nrm.ang + (Math.random() - 0.5) * 1.8
        const sp = 60 + Math.random() * 180
        st.sparks.push({
          x: pts[0].x, y: pts[0].y,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          born: now, life: 250 + Math.random() * 300,
          w: 0.7 + Math.random() * 1.2,
          col: slot.even ? st.accent : st.accent2,
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

      if (drive.beat) {
        st.surge = Math.min(1.5, st.surge + 0.4 + drive.beat * 0.8)
        const n = 3 + Math.round(drive.beat * 5)
        for (const slot of slots) {
          if (!slot.alive) continue
          emitSparks(slot, n, now)
          slot.flash = now
        }
      } else if (drive.minor) {
        const first = slots.find(sl => sl.alive)
        if (first) emitSparks(first, 2, now)
      }
      st.surge *= Math.exp(-dt * 4)

      // lap time eases 14s (quiet) → 3.5s (full chorus); beats overdrive it
      const lapSeconds = 14 - 10.5 * drive.flow
      const speed = (per.total / lapSeconds) * (1 + st.surge * 0.9)

      let anyAct = false
      for (const slot of slots) {
        slot.alive = drive.flow > slot.gate
        slot.act += ((slot.alive ? 1 : 0) - slot.act) * Math.min(1, dt * 3)
        slot.s += slot.dir * speed * dt
        if (slot.act > 0.004) anyAct = true
      }

      const idle = !anyAct && !st.sparks.length
      if (idle && !playingRef.current) {
        if (!st.cleared) { ctx.clearRect(0, 0, cw, ch); st.cleared = true }
        return
      }
      ctx.clearRect(0, 0, cw, ch)
      st.cleared = idle
      ctx.globalCompositeOperation = 'lighter'

      for (let k = 0; k < slots.length; k++) {
        const slot = slots[k]
        if (slot.act <= 0.004) continue
        const col = slot.even ? st.accent : st.accent2
        headAt(slot.s, pts[0])
        const spacing = speed * 0.022
        for (let j = 1; j <= TRAIL_N; j++) headAt(slot.s - slot.dir * spacing * j, pts[j])

        for (let j = 1; j <= TRAIL_N; j++) {
          const f = (j - 1) / (TRAIL_N - 1)
          drawGlowNode(ctx, pts[j].x, pts[j].y, 5.5 - 4.5 * f, slot.act * (0.5 - 0.45 * f), col)
        }
        // thin white spine connecting head through the trail
        ctx.globalAlpha = slot.act * 0.35
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(pts[0].x, pts[0].y)
        for (let j = 1; j <= TRAIL_N; j++) ctx.lineTo(pts[j].x, pts[j].y)
        ctx.stroke()

        drawGlowNode(ctx, pts[0].x, pts[0].y, 7 + drive.flow * 5,
          slot.act * (0.7 + 0.3 * Math.sin(now * 0.02 + k)), col)
        const ft = (now - slot.flash) / 300
        if (ft < 1) drawGlowNode(ctx, pts[0].x, pts[0].y, 14, slot.act * (1 - ft) * 0.8, col)
      }

      for (let i = st.sparks.length - 1; i >= 0; i--) {
        const s = st.sparks[i]
        const t = (now - s.born) / s.life
        if (t >= 1 || s.x < -10 || s.x > cw + 10 || s.y < -10 || s.y > ch + 10) {
          st.sparks.splice(i, 1)
          continue
        }
        s.x += s.vx * dt
        s.y += s.vy * dt
        const a = Math.pow(1 - t, 1.4)
        const tx = s.x - s.vx * 0.022, ty = s.y - s.vy * 0.022
        ctx.globalAlpha = a * 0.5
        ctx.strokeStyle = s.col
        ctx.lineWidth = s.w * 2
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tx, ty); ctx.stroke()
        ctx.globalAlpha = a * 0.9
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = s.w * 0.8
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tx, ty); ctx.stroke()
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
