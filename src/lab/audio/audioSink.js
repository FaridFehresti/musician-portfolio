/* ───────────────────────────────────────────────────────────────────────
 * Shared audio sink — a single module-level object the AudioBridge writes
 * (from the live analyser, or synthetic beat via Scene) and the 3D scene
 * reads in useFrame. A module singleton (rather than a prop-threaded ref)
 * keeps the cross-component write out of React's render/immutability model,
 * and there is only ever one /lab scene instance at a time.
 *
 *   bass ∈ 0..1   freq = Uint8Array(128) of 0..255   live = real audio playing
 * ──────────────────────────────────────────────────────────────────────── */
export const audioSink = {
  bass: 0, // raw (per-frame) bass, written by AudioBridge / synth
  level: 0, // SMOOTHED bass (low-passed in Scene) — what the visuals actually use
  freq: new Uint8Array(128),
  live: false,
}
