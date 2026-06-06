import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { NEON, smoothstep } from '../config'

/* Stage 1 — a calm synthwave grid receding to a soft horizon. Slow scroll,
 * low-contrast lines, distant rows dimmed hard so they never shimmer/moiré. */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying float vDist;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDist = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3  uColorA; // near
  uniform vec3  uColorB; // far
  varying vec2 vUv;
  varying float vDist;

  float grid(vec2 uv, float cells) {
    vec2 c = uv * cells;
    vec2 g = abs(fract(c - 0.5) - 0.5) / fwidth(c);
    float line = min(g.x, g.y);
    return 1.0 - min(line, 1.0);
  }

  void main() {
    vec2 uv = vUv;
    uv.y += uTime * 0.02;                 // slow drift toward the viewer
    float l = grid(uv, 30.0);
    vec3 col = mix(uColorB, uColorA, vUv.y);
    float fade = smoothstep(150.0, 12.0, vDist); // dim distant rows → no shimmer
    float a = l * uOpacity * fade * 0.6;
    if (a < 0.004) discard;
    gl_FragColor = vec4(col * (0.7 + l * 0.7), a);
  }
`

export function GridFloor({ scrollRef }) {
  const matRef = useRef()
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uColorA: { value: NEON.magenta.clone() },
      uColorB: { value: NEON.cyan.clone() },
    }),
    [],
  )

  useFrame((state) => {
    const m = matRef.current
    if (!m) return
    m.uniforms.uTime.value = state.clock.elapsedTime
    const p = scrollRef.current
    // wide, overlapping window — eases in and out, never pops
    m.uniforms.uOpacity.value =
      smoothstep(0.1, 0.3, p) * (1 - smoothstep(0.54, 0.74, p))
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -9, -50]}>
      <planeGeometry args={[220, 260, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
