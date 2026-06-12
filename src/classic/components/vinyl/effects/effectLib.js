import { getSharedAnalyser } from '../../../../hooks/useAudioAnalyser'

/* ───────────────────────────────────────────────────────────────────────
 * Shared toolkit for the Now Playing card effects (embers, pulse rings,
 * comet orbit, …). The audio engine and body-outline geometry are lifted
 * verbatim from the shipped LightningStrike engine so every effect reacts
 * to music the same proven way:
 *
 *   • spectral-flux onset detection per band (kick vs snare/hats) — raw
 *     level envelopes miss drum hits in dense mixes,
 *   • a "flow" envelope (mid-term ~0.3s loudness vs the song's ~3.5s
 *     average) so effects breathe with the arrangement,
 *   • body outline = sleeve rounded-rect ∪ vinyl-disk arc (the disk is
 *     part of the card's body).
 * ──────────────────────────────────────────────────────────────────────── */

export const TAU = Math.PI * 2
export const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v)

function hexToRgb(hex) {
  const h = hex.replace('#', '').trim()
  if (h.length === 3) return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
  if (h.length >= 6) return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  return [255, 255, 255]
}

/* Live theme color (e.g. cssColor('--accent', 'rgb(255,47,208)')) — always
   returns an rgb()/raw string usable as a canvas style. */
export function cssColor(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!v) return fallback
  return v.startsWith('#') ? `rgb(${hexToRgb(v).join(',')})` : v
}

/* The vinyl disk circle in canvas coords for a card at (bx, by, size) —
   uses the PLAYING slide-out position (HoloVinylCard's diskLeftFor), the
   one that matters while effects are active. */
export function diskCircle(bx, by, size, diskReach) {
  const d = Math.round(size * 0.92)
  const r = d / 2
  return { x: bx + (size - d * (1 - diskReach)) + r, y: by + size / 2, r }
}

/* Body outline sampled to a dense polyline (≈4px steps): the sleeve's
   rounded rect UNIONED with the disk's protruding arc. Returns
   { pts, cum, total } — cum lengths let effects travel along the border. */
export function buildBodyPerimeter(bx, by, size, radius, diskC) {
  let pts = []
  const step = 4
  const seg = (x0, y0, x1, y1) => {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step))
    for (let i = 0; i < n; i++) pts.push({ x: x0 + ((x1 - x0) * i) / n, y: y0 + ((y1 - y0) * i) / n })
  }
  const arc = (cx, cy, a0, a1) => {
    const n = Math.max(2, Math.round((radius * Math.abs(a1 - a0)) / step))
    for (let i = 0; i < n; i++) {
      const a = a0 + ((a1 - a0) * i) / n
      pts.push({ x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius })
    }
  }
  const w = size, h = size, r = radius
  seg(bx + r, by, bx + w - r, by)
  arc(bx + w - r, by + r, -Math.PI / 2, 0)
  seg(bx + w, by + r, bx + w, by + h - r)
  arc(bx + w - r, by + h - r, 0, Math.PI / 2)
  seg(bx + w - r, by + h, bx + r, by + h)
  arc(bx + r, by + h - r, Math.PI / 2, Math.PI)
  seg(bx, by + h - r, bx, by + r)
  arc(bx + r, by + r, Math.PI, Math.PI * 1.5)

  if (diskC && diskC.r > 0) {
    const { x: dcx, y: dcy, r: rd } = diskC
    const inside = p => Math.hypot(p.x - dcx, p.y - dcy) < rd
    const n = pts.length
    let entry = -1, exit = -1
    for (let i = 0; i < n; i++) {
      const a = inside(pts[i]), b = inside(pts[(i + 1) % n])
      if (!a && b) entry = i
      if (a && !b) exit = (i + 1) % n
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

/* Point at arc-length `s` along the perimeter (wraps). */
export function pointAtPerimeter(per, s) {
  const total = per.total
  const ss = ((s % total) + total) % total
  let i = 0
  while (i < per.cum.length - 1 && per.cum[i + 1] < ss) i++
  return per.pts[i]
}

/* Outward unit normal at a body point — disk-centred on the vinyl's arc,
   card-centred everywhere else. Returns { x, y, ang }. */
export function outwardNormal(p, ccx, ccy, diskC) {
  let nx = p.x - ccx, ny = p.y - ccy
  if (diskC && Math.abs(Math.hypot(p.x - diskC.x, p.y - diskC.y) - diskC.r) < 3) {
    nx = p.x - diskC.x; ny = p.y - diskC.y
  }
  const len = Math.hypot(nx, ny) || 1
  return { x: nx / len, y: ny / len, ang: Math.atan2(ny, nx) }
}

/* Stroke a stretch of the perimeter from arc-length `sFrom`, walking forward
   `len` (wraps) — draws directly so the hot loop allocates nothing. */
export function strokePerimeter(ctx, per, sFrom, len, width, color, alpha) {
  if (alpha <= 0.004 || len < 2) return
  const total = per.total
  const s = ((sFrom % total) + total) % total
  let i = 0
  while (i < per.cum.length - 1 && per.cum[i + 1] < s) i++
  ctx.globalAlpha = Math.min(1, alpha)
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  let prev = per.pts[i]
  ctx.moveTo(prev.x, prev.y)
  let acc = 0, steps = 0
  while (acc < len && steps < per.pts.length) {
    i = (i + 1) % per.pts.length
    const p = per.pts[i]
    acc += Math.hypot(p.x - prev.x, p.y - prev.y)
    ctx.lineTo(p.x, p.y)
    prev = p
    steps++
  }
  ctx.stroke()
}

/* Soft glow dot: white-hot core → colored halo → transparent. */
export function drawGlowNode(ctx, x, y, r, alpha, glowColor) {
  if (alpha <= 0.004 || r <= 0) return
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, 'rgba(255,255,255,0.85)')
  g.addColorStop(0.4, glowColor.startsWith('rgb(') ? glowColor.replace('rgb(', 'rgba(').replace(')', ',0.45)') : glowColor)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.globalAlpha = Math.min(1, alpha)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.fill()
}

/* ── The music drive ──────────────────────────────────────────────────
 * One instance per effect. Call update() once per rAF tick:
 *
 *   const drive = engine.update(howl, playing, now, dt)
 *   // drive.bass  0..1   snappy bass envelope (kick weight)
 *   // drive.flow  0..1   the song's macro dynamics (verse 0 … chorus 1)
 *   // drive.beat  0 | intensity 0..1 — a kick/bass onset fired THIS frame
 *   // drive.minor 0 | intensity 0..1 — a snare/hat onset fired THIS frame
 *   // drive.playing       transport state (false ⇒ flow is fading out)
 *
 * Handles analyser (re)attachment on track change and falls back to a
 * synthetic groove when the analyser is silent/unavailable, exactly like
 * the shipped lightning effect.
 * ─────────────────────────────────────────────────────────────────────── */
export function createAudioEngine() {
  const freqBuf = new Uint8Array(128)
  const prevBuf = new Uint8Array(128)
  const st = {
    analyser: null, analyserHowl: null, lastAnTry: 0,
    fast: 0, fluxLowAvg: 0, fluxHighAvg: 0,
    energyMid: 0, energyLong: 0, silent: 0,
    lastBeat: 0, lastMinor: 0, nextSynth: 0,
  }
  return {
    update(howl, playing, now, dt) {
      // track change ⇒ the cached analyser belongs to the unloaded Howl
      if (st.analyserHowl !== howl) {
        st.analyser = null
        st.analyserHowl = howl
      }
      if (!st.analyser && now - st.lastAnTry > 300) {
        st.analyser = getSharedAnalyser(howl)
        st.lastAnTry = now
      }

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
        fluxLow = fl / (10 * 255)
        fluxHigh = fh / (100 * 255)
      }

      if (!playing) {
        st.fast = 0
        st.silent = 0
        st.energyMid += (0 - st.energyMid) * Math.min(1, dt * 5) // fade out
        const flow = clamp01((st.energyMid - 0.03) / 0.35)
        return { bass: 0, flow, beat: 0, minor: 0, playing: false }
      }

      st.fast += (bass - st.fast) * 0.6
      st.fluxLowAvg += (fluxLow - st.fluxLowAvg) * 0.035
      st.fluxHighAvg += (fluxHigh - st.fluxHighAvg) * 0.035
      st.silent = broad > 0.01 ? 0 : st.silent + dt

      let beat = 0, minor = 0
      if (st.silent > 1.2) {
        // analyser missing or muted (html5 fallback) — synthetic groove
        broad = 0.3 + 0.22 * Math.sin(now * 0.0021) + 0.1 * Math.sin(now * 0.013)
        st.fast = 0.2 + 0.2 * Math.max(0, Math.sin(now * 0.008))
        if (now > st.nextSynth) {
          beat = 0.4 + Math.random() * 0.5
          st.nextSynth = now + 1200 + Math.random() * 2000
          st.lastBeat = now
        }
      }
      st.energyMid += (broad - st.energyMid) * 0.06
      st.energyLong += (broad - st.energyLong) * 0.005
      const drive = clamp01((st.energyMid - 0.03) / 0.35)
      const swell = clamp01((st.energyMid / Math.max(0.04, st.energyLong) - 0.75) / 0.7)
      const flow = clamp01(0.6 * drive + 0.4 * swell)

      if (st.silent <= 1.2) {
        const lowRatio = fluxLow / Math.max(0.004, st.fluxLowAvg)
        const highRatio = fluxHigh / Math.max(0.003, st.fluxHighAvg)
        // Gates mirror the shipped lightning's POST-RETUNE tuning: strict
        // ratios + a refractory capping onsets at ~2/s in choruses, so
        // effects punctuate the music instead of flickering nonstop.
        const minRatio = 2.1 + (1 - flow) * 0.7
        const refractory = 380 + (1 - flow) * 340
        if (fluxLow > 0.022 && lowRatio > minRatio && now - st.lastBeat > refractory) {
          beat = Math.min(1, 0.16 + flow * 0.5 + (lowRatio - minRatio) * 0.16 + st.fast * 0.2)
          st.lastBeat = now
        }
        if (fluxHigh > 0.016 && highRatio > 2.5 + (1 - flow) * 0.6 &&
            now - st.lastMinor > 380 + (1 - flow) * 420 && now - st.lastBeat > 160) {
          minor = 0.1 + 0.18 * flow + Math.min(0.3, (highRatio - 2.5) * 0.1)
          st.lastMinor = now
        }
      }
      return { bass: st.fast, flow, beat, minor, playing: true }
    },
  }
}
