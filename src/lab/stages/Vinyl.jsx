import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { NEON, smoothstep } from '../config'

/* Stage 2 — a giant holographic vinyl record rotating in space.
 * Grooves (radial rings) + a foil sheen that cycles cyan→violet→magenta by
 * angle, a glowing center label, a hot rim, and a transparent spindle hole. */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3  uA; // cyan
  uniform vec3  uB; // violet
  uniform vec3  uC; // magenta
  varying vec2 vUv;

  const float TAU = 6.28318530718;

  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0; // 0 at center → 1 at edge
    if (r > 1.0) discard;

    float ang = atan(p.y, p.x);

    // holographic foil: hue cycles around the disc and drifts slowly with time
    float h = fract(ang / TAU + uTime * 0.015 + r * 0.5);
    vec3 foil = h < 0.3333
      ? mix(uA, uB, h * 3.0)
      : (h < 0.6666 ? mix(uB, uC, (h - 0.3333) * 3.0) : mix(uC, uA, (h - 0.6666) * 3.0));

    float grooves = 0.5 + 0.5 * sin(r * 260.0);
    float label = smoothstep(0.27, 0.25, r); // inner label disc
    float hole  = smoothstep(0.04, 0.05, r); // transparent spindle hole
    float rim   = smoothstep(0.965, 1.0, r);

    vec3 base = mix(vec3(0.02, 0.02, 0.05), foil, 0.5);
    vec3 col = base * (0.35 + grooves * 0.45);
    col += foil * label * 0.8;     // glowing label
    col += uA * rim * 1.6;         // soft cyan rim catches the bloom

    float a = uOpacity * hole;
    if (a < 0.01) discard;
    gl_FragColor = vec4(col, a);
  }
`

export function Vinyl({ scrollRef }) {
  const meshRef = useRef()
  const matRef = useRef()
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uA: { value: NEON.cyan.clone() },
      uB: { value: NEON.violet.clone() },
      uC: { value: NEON.magenta.clone() },
    }),
    [],
  )

  useFrame((state, delta) => {
    const m = matRef.current
    if (!m) return
    m.uniforms.uTime.value = state.clock.elapsedTime
    const p = scrollRef.current
    // wide, overlapping fade so the record glides in and out, never pops
    m.uniforms.uOpacity.value =
      smoothstep(0.34, 0.48, p) * (1 - smoothstep(0.6, 0.76, p))
    if (meshRef.current) meshRef.current.rotation.z += Math.min(delta, 0.05) * 0.22
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -52]}>
      <circleGeometry args={[10, 128]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
