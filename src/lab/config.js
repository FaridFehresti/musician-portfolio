import * as THREE from 'three'

/* ───────────────────────────────────────────────────────────────────────
 * /lab — tuning knobs for the immersive scroll-driven music journey.
 * Single source of truth so the page stays an easy "experiment" surface.
 * Colors mirror the app's synthwave tokens (src/styles/globals.css).
 * ──────────────────────────────────────────────────────────────────────── */

export const COLORS = {
  bg:      '#0b0612', // --color-bg
  cyan:    '#00e5ff', // --neon-cyan
  magenta: '#ff2fd0', // --neon-magenta
  violet:  '#7a4dff', // --neon-violet
  text:    '#f3e9ff', // --color-text
  muted:   '#8b7da6', // --color-muted
}

/** THREE.Color instances for shader uniforms (cloned per material). */
export const NEON = {
  cyan:    new THREE.Color(COLORS.cyan),
  magenta: new THREE.Color(COLORS.magenta),
  violet:  new THREE.Color(COLORS.violet),
}

/** Particle counts per device tier (keys match useBreakpoint()). Curl-noise
 *  flow reads best with fewer, softer, larger particles — calmer, less noise. */
export const PARTICLE_COUNTS = { mobile: 2500, tablet: 6500, desktop: 14000 }

/** Device-pixel-ratio caps — never uncapped (retina + bloom = GPU death). */
export const DPR = { mobile: [1, 1.25], tablet: [1, 1.5], desktop: [1, 1.75] }

/** EffectComposer MSAA samples per tier. */
export const MULTISAMPLING = { mobile: 0, tablet: 2, desktop: 4 }

/** Bloom: deliberately near-CONSTANT. Audio adds only a tiny, smoothed swell
 *  so the whole frame never strobes (the old per-beat pulsing caused headaches). */
export const BLOOM = {
  threshold:     0.2,
  smoothing:     0.04,
  radius:        0.7,
  intensity:     0.72, // baseline, held steady
  intensityLevel: 0.18, // added * SMOOTHED level (gentle breathing, not a strobe)
  intensityMax:  1.0,
}

/** Scroll spacer height in viewport-heights → also the # of journey stages. */
export const SCROLL_PAGES = 5

/** Flight corridor the particles fill (world Z). Spans the whole camera path so
 *  there are always particles around the lens — travel comes from the camera. */
export const CORRIDOR = { zMin: -140, zMax: 30 }

export const DEFAULT_BPM = 120

export const COPY = {
  title:      'RESONANCE',
  subtitle:   'a journey through sound',
  scrollHint: 'scroll to travel',
  ctaHeading: 'Enter the collection',
  play:       'Begin with sound',
}

/** GLSL-style smoothstep for JS-side scroll-window math. */
export function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}
