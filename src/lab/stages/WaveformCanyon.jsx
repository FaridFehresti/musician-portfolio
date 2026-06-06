import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { NEON, smoothstep } from '../config'
import { audioSink } from '../audio/audioSink'

/* Stage 3 — a calm neon canyon whose ridges undulate with the (heavily
 * smoothed) spectrum. The plane is rotated flat; the vertex shader raises it
 * along world-up. Lines are soft and the traveling wave is slow. */

const vertexShader = /* glsl */ `
  uniform sampler2D uAudio;
  uniform float uLevel;
  uniform float uTime;
  varying vec2 vUv;
  varying float vH;
  void main() {
    vUv = uv;
    float s = texture2D(uAudio, vec2(uv.x, 0.5)).r; // 0..1 (already smoothed on the CPU)
    float h = s * (3.0 + uLevel * 6.0);
    h += sin(uv.y * 18.0 + uTime * 0.6) * 0.3 * (0.4 + uLevel); // slow gentle swell
    vH = h;
    vec3 p = position;
    p.z += h; // local +z → world +y after the -90° X rotation (ridges go up)
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  uniform vec3  uColorA; // crest
  uniform vec3  uColorB; // base
  varying vec2 vUv;
  varying float vH;

  float grid(vec2 uv, vec2 cells) {
    vec2 c = uv * cells;
    vec2 g = abs(fract(c - 0.5) - 0.5) / fwidth(c);
    float line = min(g.x, g.y);
    return 1.0 - min(line, 1.0);
  }

  void main() {
    float l = grid(vUv, vec2(40.0, 18.0));
    float height = clamp(vH / 8.0, 0.0, 1.0);
    vec3 col = mix(uColorB, uColorA, height);
    float a = (0.08 + l * 0.85) * uOpacity;
    if (a < 0.004) discard;
    gl_FragColor = vec4(col * (0.5 + l * 1.1 + height * 0.6), a);
  }
`

export function WaveformCanyon({ scrollRef, lite = false }) {
  const matRef = useRef()
  const texRef = useRef(null)
  const smooth = useRef(new Float32Array(128)) // per-bin low-pass of the spectrum

  const uniforms = useMemo(
    () => ({
      uAudio: { value: null },
      uLevel: { value: 0 },
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uColorA: { value: NEON.cyan.clone() },
      uColorB: { value: NEON.violet.clone() },
    }),
    [],
  )

  useLayoutEffect(() => {
    const tex = new THREE.DataTexture(new Uint8Array(128), 128, 1, THREE.RedFormat, THREE.UnsignedByteType)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.needsUpdate = true
    texRef.current = tex
    if (matRef.current) matRef.current.uniforms.uAudio.value = tex
    return () => tex.dispose()
  }, [])

  useFrame((state, delta) => {
    const m = matRef.current
    const tex = texRef.current
    if (!m || !tex) return

    // per-bin exponential smoothing → ridges breathe, never jitter
    const k = 1 - Math.exp(-Math.min(delta, 0.05) * 3.0)
    const sm = smooth.current
    const src = audioSink.freq
    const dst = tex.image.data
    for (let i = 0; i < 128; i++) {
      sm[i] += (src[i] - sm[i]) * k
      dst[i] = sm[i]
    }
    tex.needsUpdate = true

    m.uniforms.uLevel.value = audioSink.level
    m.uniforms.uTime.value = state.clock.elapsedTime
    const p = scrollRef.current
    m.uniforms.uOpacity.value =
      smoothstep(0.56, 0.68, p) * (1 - smoothstep(0.86, 1.0, p))
  })

  const segX = lite ? 80 : 180
  const segY = lite ? 40 : 90

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -8, -92]}>
      <planeGeometry args={[200, 120, segX, segY]} />
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
