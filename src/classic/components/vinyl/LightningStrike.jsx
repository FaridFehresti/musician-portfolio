import { memo, useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import { getSharedAnalyser } from '../../../hooks/useAudioAnalyser'

/* ───────────────────────────────────────────────────────────────────────
 * LightningStrike — procedural storm around the Now Playing card.
 *
 * A transparent 2D canvas overlays the card (pointer-events: none). Bass
 * transients from the shared audio analyser trigger fractal bolts (midpoint
 * displacement + branches) that strike the card's border. On impact:
 *   • spark particles burst off the border,
 *   • a glow runs along the rounded-rect perimeter from the hit point,
 *   • the card itself takes a 3D jolt + brightness flash (via `targetRef`,
 *     styled imperatively so the 60fps loop never touches React state).
 *
 * Colors come from the live theme vars (--accent / --accent-2), read per
 * strike so theme switches re-color the storm. Falls back to a synthetic
 * beat when the analyser is silent/unavailable (mirrors the /lab scene).
 * Disabled entirely under prefers-reduced-motion.
 * ──────────────────────────────────────────────────────────────────────── */

const TAU = Math.PI * 2

function hexToRgb(hex) {
  const h = hex.replace('#', '').trim()
  if (h.length === 3) return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
  if (h.length >= 6) return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  return [255, 255, 255]
}
function cssColor(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!v) return fallback
  return v.startsWith('#') ? `rgb(${hexToRgb(v).join(',')})` : v
}

/* Fractal bolt: recursive midpoint displacement between two points. */
function genBolt(x0, y0, x1, y1, rough) {
  let pts = [{ x: x0, y: y0 }, { x: x1, y: y1 }]
  let disp = Math.hypot(x1 - x0, y1 - y0) * 0.2 * rough
  for (let g = 0; g < 6; g++) {
    const out = [pts[0]]
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i]
      const dx = b.x - a.x, dy = b.y - a.y
      const len = Math.hypot(dx, dy) || 1
      const off = (Math.random() * 2 - 1) * disp
      out.push({ x: (a.x + b.x) / 2 - (dy / len) * off, y: (a.y + b.y) / 2 + (dx / len) * off }, b)
    }
    pts = out
    disp *= 0.55
  }
  return pts
}

/* (Re)build a bolt's geometry — also used for the mid-life re-strike.
   `pushOut` ejects any jittered/branch point that strays over the card's
   face (or the disk), so bolts never cross the body — they wrap around. */
function buildGeometry(b, pushOut) {
  b.pts = genBolt(b.x0, b.y0, b.x1, b.y1, b.rough)
  b.branches = []
  for (let i = 0; i < b.branchCount; i++) {
    const p = b.pts[Math.floor(b.pts.length * (0.2 + 0.6 * Math.random()))]
    const rx = b.x1 - p.x, ry = b.y1 - p.y
    const ang = (Math.random() * 2 - 1) * 1.0
    const cos = Math.cos(ang), sin = Math.sin(ang)
    const k = 0.25 + 0.35 * Math.random()
    b.branches.push(genBolt(p.x, p.y, p.x + (rx * cos - ry * sin) * k, p.y + (rx * sin + ry * cos) * k, b.rough * 1.3))
  }
  if (pushOut) {
    pushOut(b.pts)
    for (const br of b.branches) pushOut(br)
  }
}

/* Body outline sampled to a dense polyline (≈4px steps): the sleeve's
   rounded rect UNIONED with the vinyl disk's protruding arc (diskC =
   {x, y, r} circle, optional) — the disk is part of the card's body, so
   strikes / sparks / charge runs include it. Cumulative lengths let impact
   effects travel along the combined border. */
function buildPerimeter(bx, by, w, h, r, diskC) {
  let pts = []
  const step = 4
  const seg = (x0, y0, x1, y1) => {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step))
    for (let i = 0; i < n; i++) pts.push({ x: x0 + ((x1 - x0) * i) / n, y: y0 + ((y1 - y0) * i) / n })
  }
  const arc = (cx, cy, a0, a1) => {
    const n = Math.max(2, Math.round((r * Math.abs(a1 - a0)) / step))
    for (let i = 0; i < n; i++) {
      const a = a0 + ((a1 - a0) * i) / n
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r })
    }
  }
  seg(bx + r, by, bx + w - r, by)
  arc(bx + w - r, by + r, -Math.PI / 2, 0)
  seg(bx + w, by + r, bx + w, by + h - r)
  arc(bx + w - r, by + h - r, 0, Math.PI / 2)
  seg(bx + w - r, by + h, bx + r, by + h)
  arc(bx + r, by + h - r, Math.PI / 2, Math.PI)
  seg(bx, by + h - r, bx, by + r)
  arc(bx + r, by + r, Math.PI, Math.PI * 1.5)

  // splice the disk bulge into the right side: drop the rect points the
  // circle swallows and walk the circle arc between the two crossings
  if (diskC && diskC.r > 0) {
    const { x: dcx, y: dcy, r: rd } = diskC
    const inside = p => Math.hypot(p.x - dcx, p.y - dcy) < rd
    const n = pts.length
    let entry = -1, exit = -1
    for (let i = 0; i < n; i++) {
      const a = inside(pts[i]), b = inside(pts[(i + 1) % n])
      if (!a && b) entry = i               // last outside point before the run
      if (a && !b) exit = (i + 1) % n      // first outside point after it
    }
    if (entry !== -1 && exit !== -1) {
      let a0 = Math.atan2(pts[entry].y - dcy, pts[entry].x - dcx)
      let a1 = Math.atan2(pts[exit].y - dcy, pts[exit].x - dcx)
      while (a1 <= a0) a1 += TAU
      const out = []
      let i = exit
      for (;;) {
        out.push(pts[i])
        if (i === entry) break
        i = (i + 1) % n
      }
      const steps = Math.max(2, Math.round((rd * (a1 - a0)) / step))
      for (let k = 1; k < steps; k++) {
        const a = a0 + ((a1 - a0) * k) / steps
        out.push({ x: dcx + Math.cos(a) * rd, y: dcy + Math.sin(a) * rd })
      }
      pts = out
    }
  }

  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y))
  const total = cum[pts.length - 1] + Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y)
  return { pts, cum, total }
}

/* Border point whose angle from the card centre best matches `angle`. */
function targetOnPerimeter(per, cx, cy, angle) {
  // normalize to (-π, π] — atan2 below lives there, and without this the
  // wrap-around distance goes NEGATIVE for angles > π, which made every
  // second strike snap to the leftmost border point
  const want = Math.atan2(Math.sin(angle), Math.cos(angle))
  let best = 0, bestD = Infinity
  for (let i = 0; i < per.pts.length; i += 2) {
    const p = per.pts[i]
    let d = Math.abs(Math.atan2(p.y - cy, p.x - cx) - want)
    if (d > Math.PI) d = TAU - d
    if (d < bestD) { bestD = d; best = i }
  }
  return { x: per.pts[best].x, y: per.pts[best].y, s: per.cum[best] }
}

/* Sub-polyline starting at arc-length `sFrom`, walking forward `len` (wraps). */
function alongPerimeter(per, sFrom, len) {
  const total = per.total
  let s = ((sFrom % total) + total) % total
  let i = 0
  while (i < per.cum.length - 1 && per.cum[i + 1] < s) i++
  const out = [per.pts[i]]
  let acc = 0
  let prev = per.pts[i]
  while (acc < len && out.length <= per.pts.length) {
    i = (i + 1) % per.pts.length
    const p = per.pts[i]
    acc += Math.hypot(p.x - prev.x, p.y - prev.y)
    out.push(p)
    prev = p
  }
  return out
}

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v)

function strokePoly(ctx, pts, width, color, alpha) {
  if (alpha <= 0.004 || pts.length < 2) return
  ctx.globalAlpha = Math.min(1, alpha)
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
  ctx.stroke()
}

export const LightningStrike = memo(function LightningStrike({
  size,            // card sleeve size in px (canvas pads out around it)
  playing = false,
  howl = null,
  targetRef = null, // element that takes the 3D jolt + flash on impact
  lite = false,     // mobile: fewer branches/sparks, lower DPR
  radius = 18,      // card corner radius — border effects follow it
  diskReach = 0.5,  // how far the vinyl pokes out right (matches HoloVinylCard)
}) {
  const reduced = usePrefersReducedMotion()
  const canvasRef = useRef(null)
  const playingRef = useRef(playing)
  const howlRef = useRef(howl)
  useEffect(() => { playingRef.current = playing }, [playing])
  useEffect(() => { howlRef.current = howl }, [howl])

  // Geometry: room on ALL sides — strikes come from every direction, so the
  // canvas needs sky above AND travel distance left/right/below the card.
  // (Extra X room because the disk widens the body on the right.)
  const padX = Math.round(size * 0.85)
  const padTop = Math.round(size * 0.85)
  const padBottom = Math.round(size * 0.5)
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
    // The vinyl disk's playing position (HoloVinylCard's diskLeftFor with
    // `playing` visibility) — part of the body. Strikes only fire while
    // playing, so the slid-out position is the one that matters.
    const diskD = Math.round(size * 0.92)
    const rd = diskD / 2
    const dcx = bx + (size - diskD * (1 - diskReach)) + rd
    const dcy = ccy
    const diskC = { x: dcx, y: dcy, r: rd }
    const per = buildPerimeter(bx, by, size, size, radius, diskC)
    const freqBuf = new Uint8Array(128)
    const prevBuf = new Uint8Array(128)

    /* Eject stray bolt points off the card face / disk so no bolt segment
       ever crosses the body. Runs once per geometry build, not per frame. */
    function pushOut(pts) {
      for (const p of pts) {
        if (p.x > bx + 2 && p.x < bx + size - 2 && p.y > by + 2 && p.y < by + size - 2) {
          const dl = p.x - bx, dr = bx + size - p.x, dt = p.y - by, db = by + size - p.y
          const m = Math.min(dl, dr, dt, db)
          if (m === dt) p.y = by - 2
          else if (m === db) p.y = by + size + 2
          else if (m === dl) p.x = bx - 2
          else p.x = bx + size + 2
        }
        const ddx = p.x - dcx, ddy = p.y - dcy
        const dd = Math.hypot(ddx, ddy)
        if (dd < rd - 1 && dd > 0.001) {
          const k = (rd + 2) / dd
          p.x = dcx + ddx * k
          p.y = dcy + ddy * k
        }
      }
    }

    const st = {
      bolts: [], sparks: [], runs: [], flashes: [],
      fast: 0, fluxLowAvg: 0, fluxHighAvg: 0, silent: 0,
      energyMid: 0, energyLong: 0,
      lastStrike: 0, lastMinor: 0, lastAnTry: 0, nextSynth: 0,
      jolt: 0, joltPhase: 0, joltApplied: false,
      glowColor: 'rgba(0,229,255,0.5)',
      cleared: true, analyser: null, analyserHowl: null,
      prev: performance.now(), raf: 0,
    }

    /* `minor` strikes (hats/snare at high tempos) keep their own cooldown so
       they never eat into the bass refractory. */
    function strike(intensity, now, minor = false) {
      if (minor) st.lastMinor = now
      else st.lastStrike = now
      const accent = cssColor('--accent', 'rgb(255,47,208)')
      const accent2 = cssColor('--accent-2', 'rgb(0,229,255)')
      st.glowColor = accent2
      // impact: uniform around the body — sky, sides, diagonals AND below
      const tAng = Math.random() * TAU
      const tgt = targetOnPerimeter(per, ccx, ccy, tAng + (Math.random() - 0.5) * 0.2)
      // outward normal at the impact point (disk-centred when the hit lands
      // on the vinyl's arc). The origin spawns along THIS direction, so a
      // bolt always comes in from its own side — never across the card.
      let nx = tgt.x - ccx, ny = tgt.y - ccy
      if (Math.abs(Math.hypot(tgt.x - dcx, tgt.y - dcy) - rd) < 3) {
        nx = tgt.x - dcx; ny = tgt.y - dcy
      }
      const nAng = Math.atan2(ny, nx)
      const oDir = nAng + (Math.random() - 0.5) * 0.55
      const cos = Math.cos(oDir), sin = Math.sin(oDir)
      let tMax = Infinity
      if (cos > 1e-4) tMax = Math.min(tMax, (cw - 8 - tgt.x) / cos)
      if (cos < -1e-4) tMax = Math.min(tMax, (8 - tgt.x) / cos)
      if (sin > 1e-4) tMax = Math.min(tMax, (ch - 8 - tgt.y) / sin)
      if (sin < -1e-4) tMax = Math.min(tMax, (8 - tgt.y) / sin)
      const dist = tMax * (0.7 + Math.random() * 0.3)
      const ox = tgt.x + cos * dist
      const oy = tgt.y + sin * dist
      const swap = Math.random() < 0.3
      const b = {
        x0: ox, y0: oy, x1: tgt.x, y1: tgt.y,
        rough: 0.85 + Math.random() * 0.5,
        branchCount: lite ? 2 : 3 + Math.round(intensity * 3),
        born: now, life: (150 + Math.random() * 160) * (0.8 + 0.6 * intensity),
        w: (lite ? 1.5 : 2.0) * (0.7 + intensity * 1.4),
        glow: swap ? accent2 : accent, col: swap ? accent : accent2,
        intensity, restruck: false,
      }
      buildGeometry(b, pushOut)
      st.bolts.push(b)

      // impact burst — sparks fly outward along the impact normal
      const count = Math.round((lite ? 8 : 14) + intensity * (lite ? 10 : 26))
      for (let i = 0; i < count; i++) {
        const a = nAng + (Math.random() - 0.5) * 2.6
        const sp = (70 + Math.random() * 420) * (0.5 + intensity)
        st.sparks.push({
          x: tgt.x, y: tgt.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60,
          born: now, life: 320 + Math.random() * 420, w: 0.8 + Math.random() * 1.6,
          col: Math.random() < 0.5 ? accent : accent2,
        })
      }
      st.runs.push({ s0: tgt.s, born: now, life: 620, intensity, col: accent2 })
      st.flashes.push({ x: tgt.x, y: tgt.y, born: now, life: 380, rmax: 46 + 70 * intensity, intensity })
      // heavy hits slam the card; minor (hat/snare) arcs barely nudge it
      st.jolt = Math.min(1, st.jolt + (minor ? 0.05 + 0.15 * intensity : 0.2 + 0.8 * intensity))
    }

    function tick(now) {
      st.raf = requestAnimationFrame(tick)
      const dt = Math.min(0.05, (now - st.prev) / 1000)
      st.prev = now

      // ── audio → onset detection ──────────────────────────────────
      // track change ⇒ the cached analyser belongs to the unloaded Howl;
      // drop it so the storm re-attaches to the NEW track's audio graph
      if (st.analyserHowl !== howlRef.current) {
        st.analyser = null
        st.analyserHowl = howlRef.current
      }
      if (!st.analyser && now - st.lastAnTry > 300) {
        st.analyser = getSharedAnalyser(howlRef.current)
        st.lastAnTry = now
      }
      // Spectral flux onset detection: drums are broadband ENERGY JUMPS, so
      // summing positive bin-to-bin increases catches kicks/snares even when
      // sustained low-end (downtuned guitars, bass) keeps raw levels high —
      // raw-level envelopes miss exactly those hits in dense mixes.
      let bass = 0, broad = 0, fluxLow = 0, fluxHigh = 0
      if (st.analyser) {
        st.analyser.getByteFrequencyData(freqBuf)
        let sum = 0
        for (let i = 0; i < 8; i++) sum += freqBuf[i]
        bass = sum / 8 / 255
        let sb = 0
        for (let i = 0; i < 56; i++) sb += freqBuf[i]
        broad = sb / 56 / 255
        let fl = 0, fh = 0
        for (let i = 0; i < 110; i++) {
          const d = freqBuf[i] - prevBuf[i]
          if (d > 0) { if (i < 10) fl += d; else fh += d }
          prevBuf[i] = freqBuf[i]
        }
        fluxLow = fl / (10 * 255)    // kick / bass-drop band
        fluxHigh = fh / (100 * 255)  // snare / hats / attack band
      }
      if (playingRef.current) {
        st.fast += (bass - st.fast) * 0.6
        st.fluxLowAvg += (fluxLow - st.fluxLowAvg) * 0.035
        st.fluxHighAvg += (fluxHigh - st.fluxHighAvg) * 0.035
        // The FLOW of the song: where the loudness sits right now (~0.3s)
        // vs the song's own recent average (~3.5s). Choruses / build-ups
        // push flow → 1, breakdowns and quiet verses pull it → 0; the storm's
        // size, rate and thresholds all ride it so the lightning breathes
        // with the arrangement instead of slamming constantly.
        st.energyMid += (broad - st.energyMid) * 0.06
        st.energyLong += (broad - st.energyLong) * 0.005
        const drive = clamp01((st.energyMid - 0.03) / 0.35)
        const swell = clamp01((st.energyMid / Math.max(0.04, st.energyLong) - 0.75) / 0.7)
        const flow = clamp01(0.6 * drive + 0.4 * swell)
        st.silent = bass > 0.01 ? 0 : st.silent + dt
        const lowRatio = fluxLow / Math.max(0.004, st.fluxLowAvg)
        const highRatio = fluxHigh / Math.max(0.003, st.fluxHighAvg)
        // quiet sections: pickier + slower + smaller; loud: rapid + heavy.
        // Gates are deliberately strict — only onsets well above the song's
        // own average fire, and the refractory caps the storm at ~2 bolts/s
        // even in choruses, so strikes punctuate the music instead of
        // flickering nonstop.
        const minRatio = 2.5 + (1 - flow) * 0.8
        const refractory = 380 + (1 - flow) * 340
        if (fluxLow > 0.028 && lowRatio > minRatio && now - st.lastStrike > refractory) {
          const inten = Math.min(1, 0.16 + flow * 0.5 + (lowRatio - minRatio) * 0.16 + st.fast * 0.2)
          strike(inten, now)
          if (inten > 0.85 && flow > 0.7) strike(inten * 0.8, now) // peak section ⇒ double bolt
        } else if (st.silent > 1.2 && now > st.nextSynth) {
          // analyser missing or silent (e.g. html5 fallback) — synthetic storm
          strike(0.35 + Math.random() * 0.45, now)
          st.nextSynth = now + 1200 + Math.random() * 2000
        } else if (now - st.lastStrike > 3000 && st.fast > 0.04 && Math.random() < dt * 0.5) {
          strike(0.12 + flow * 0.2 + Math.random() * 0.1, now) // ambient filler arc
        }
        // snare / hats ⇒ occasional small accent arcs between bass hits —
        // hard-gated; these firing every ~120ms were the constant-flicker feel
        if (fluxHigh > 0.02 && highRatio > 2.9 + (1 - flow) * 0.7 &&
            now - st.lastMinor > 380 + (1 - flow) * 420 && now - st.lastStrike > 160) {
          strike(0.1 + 0.18 * flow + Math.min(0.3, (highRatio - 2.9) * 0.1), now, true)
        }
      }

      // ── card jolt (imperative, off React) ────────────────────────
      const el = targetRef?.current
      if (el) {
        if (st.jolt > 0.015) {
          st.joltPhase += dt * 46
          const j = st.jolt
          const rx = Math.sin(st.joltPhase) * 2.6 * j
          const ry = Math.sin(st.joltPhase * 0.77 + 1.3) * 2.2 * j
          el.style.transform = `perspective(800px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${(1 + 0.018 * j).toFixed(4)})`
          el.style.filter = `brightness(${(1 + 0.5 * j).toFixed(3)}) saturate(${(1 + 0.35 * j).toFixed(3)}) drop-shadow(0 0 ${Math.round(20 * j)}px ${st.glowColor})`
          st.joltApplied = true
        } else if (st.joltApplied) {
          el.style.transform = ''
          el.style.filter = ''
          st.joltApplied = false
        }
        st.jolt *= Math.exp(-dt * 4.2)
      }

      // ── draw ──────────────────────────────────────────────────────
      const idle = !st.bolts.length && !st.sparks.length && !st.runs.length && !st.flashes.length
      if (idle && !playingRef.current) {
        if (!st.cleared) { ctx.clearRect(0, 0, cw, ch); st.cleared = true }
        return
      }
      ctx.clearRect(0, 0, cw, ch)
      st.cleared = idle
      ctx.globalCompositeOperation = 'lighter'

      for (let i = st.bolts.length - 1; i >= 0; i--) {
        const b = st.bolts[i]
        const t = (now - b.born) / b.life
        if (t >= 1) { st.bolts.splice(i, 1); continue }
        if (!b.restruck && t > 0.32) { buildGeometry(b, pushOut); b.restruck = true } // return stroke
        const env = t < 0.07 ? t / 0.07 : Math.pow(1 - (t - 0.07) / 0.93, 1.55)
        const flicker = (Math.random() < 0.08 ? 0.35 : 1) * (0.78 + 0.22 * Math.random())
        const a = env * flicker * (0.55 + 0.45 * b.intensity)
        strokePoly(ctx, b.pts, b.w * 7, b.glow, a * 0.1)
        strokePoly(ctx, b.pts, b.w * 3.2, b.glow, a * 0.2)
        strokePoly(ctx, b.pts, b.w * 1.6, b.col, a * 0.55)
        strokePoly(ctx, b.pts, b.w * 0.6, '#ffffff', a * 0.95)
        for (const br of b.branches) {
          strokePoly(ctx, br, b.w * 2.0, b.glow, a * 0.12)
          strokePoly(ctx, br, b.w * 0.9, b.col, a * 0.4)
          strokePoly(ctx, br, b.w * 0.35, '#ffffff', a * 0.6)
        }
      }

      for (let i = st.runs.length - 1; i >= 0; i--) {
        const r = st.runs[i]
        const t = (now - r.born) / r.life
        if (t >= 1) { st.runs.splice(i, 1); continue }
        const head = t * per.total * 0.5
        const tail = Math.min(head, size * 0.55)
        if (tail < 2) continue
        const a = Math.pow(1 - t, 1.35) * (0.5 + 0.5 * r.intensity)
        for (const dir of [1, -1]) {
          const from = dir === 1 ? r.s0 + head - tail : r.s0 - head
          const pts = alongPerimeter(per, from, tail)
          strokePoly(ctx, pts, 4.5, r.col, a * 0.3)
          strokePoly(ctx, pts, 1.5, '#ffffff', a * 0.75)
        }
      }

      for (let i = st.flashes.length - 1; i >= 0; i--) {
        const f = st.flashes[i]
        const t = (now - f.born) / f.life
        if (t >= 1) { st.flashes.splice(i, 1); continue }
        const r = 6 + t * f.rmax
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r)
        g.addColorStop(0, 'rgba(255,255,255,0.9)')
        g.addColorStop(0.35, st.glowColor.startsWith('rgb(') ? st.glowColor.replace('rgb(', 'rgba(').replace(')', ',0.5)') : st.glowColor)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.globalAlpha = Math.pow(1 - t, 2) * (0.4 + 0.5 * f.intensity)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(f.x, f.y, r, 0, TAU)
        ctx.fill()
      }

      for (let i = st.sparks.length - 1; i >= 0; i--) {
        const s = st.sparks[i]
        const t = (now - s.born) / s.life
        if (t >= 1) { st.sparks.splice(i, 1); continue }
        s.vy += 500 * dt
        s.vx *= Math.exp(-dt * 2.2)
        s.vy *= Math.exp(-dt * 1.2)
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
    const joltHost = targetRef?.current // capture for cleanup (ref may clear first)
    return () => {
      cancelAnimationFrame(st.raf)
      if (joltHost) { joltHost.style.transform = ''; joltHost.style.filter = '' }
    }
  }, [size, lite, radius, reduced, cw, ch, padX, padTop, targetRef, diskReach])

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
