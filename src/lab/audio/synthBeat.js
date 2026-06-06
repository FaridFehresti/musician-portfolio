/* ───────────────────────────────────────────────────────────────────────
 * Synthetic "always-alive" motion. Before the user starts audio, the scene
 * drives its level + spectrum from these. Deliberately a SLOW, smooth swell
 * (layered low-frequency sines) — NOT a per-beat kick — so nothing strobes.
 * Same data shape as the real analyser: level ∈ 0..1, spectrum Uint8Array(128).
 * ──────────────────────────────────────────────────────────────────────── */

/** Gentle breathing 0.2..0.8 from a couple of slow sines (no sharp attack). */
export function syntheticBass(t) {
  const a = 0.5 + 0.3 * Math.sin(t * 0.45)
  const b = 0.5 + 0.5 * Math.sin(t * 0.19 + 1.7)
  return 0.2 + 0.6 * (a * 0.6 + b * 0.4)
}

/** Fill `out` with a smooth, slowly-undulating spectrum (mutates in place). */
export function syntheticSpectrum(out, t, level) {
  const n = out.length
  for (let i = 0; i < n; i++) {
    const f = i / n
    const wave = 0.5 + 0.5 * Math.sin(i * 0.12 + t * 0.8) * Math.sin(i * 0.03 + t * 0.35)
    const lowBias = (1 - f) * 0.6 + 0.4
    const v = level * lowBias * wave * 255
    out[i] = v < 0 ? 0 : v > 255 ? 255 : v
  }
}
