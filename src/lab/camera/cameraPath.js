import * as THREE from 'three'

/* ───────────────────────────────────────────────────────────────────────
 * Camera travel: two Catmull-Rom curves sampled by scroll progress (0..1).
 * POS is where the camera flies; TGT is what it looks at (the focal object
 * of each stage). The caller damps toward these for frame-rate-independent
 * smoothing. Key focal points: vinyl @ z=-52, waveform canyon @ z≈-92.
 * ──────────────────────────────────────────────────────────────────────── */

const POS = [
  [0, 0, 20], // 0 entrance — drifting into the cloud
  [0, 1, 6], // ↘ glide
  [0, 2, -14], // gentle forward
  [2.5, 1.5, -34], // soft lean toward the vinyl (small offset, no swooping)
  [-2, 1, -52], // ease past it
  [0, 4, -74], // rise a little over the canyon
  [0, 3, -96], // float across
  [0, 1.5, -116], // arrival, settling
]

const TGT = [
  [0, 0, -8],
  [0, 0.5, -28],
  [0, 1, -46],
  [0, 0.5, -52], // vinyl center
  [0, 1, -64],
  [0, 2, -92], // canyon
  [0, 0, -112],
  [0, 0, -126],
]

const toVec3 = (a) => a.map((p) => new THREE.Vector3(p[0], p[1], p[2]))

const posCurve = new THREE.CatmullRomCurve3(toVec3(POS))
const tgtCurve = new THREE.CatmullRomCurve3(toVec3(TGT))

const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t)

/** Write the camera position for progress `t` into `out` (Vector3). */
export function samplePosition(t, out) {
  return posCurve.getPoint(clamp01(t), out)
}

/** Write the look-at target for progress `t` into `out` (Vector3). */
export function sampleTarget(t, out) {
  return tgtCurve.getPoint(clamp01(t), out)
}
