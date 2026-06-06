import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { NEON, smoothstep } from '../config'
import { audioSink } from '../audio/audioSink'

/* Stage 3 — a neon canyon whose ridges are displaced by the live spectrum.
 * The vertex shader samples a 128×1 audio texture (real frequencies when a
 * track plays, synthetic otherwise) to raise the terrain; the camera flies
 * over it as bass scales the height. */

const vertexShader = /* glsl */ `
  uniform sampler2D uAudio;
  uniform float uBass;
  uniform float uTime;
  varying vec2 vUv;
  varying float vH;
  void main() {
    vUv = uv;
    float s = texture2D(uAudio, vec2(uv.x, 0.5)).r; // 0..1
    float h = s * (4.0 + uBass * 10.0);
    h += sin(uv.y * 30.0 + uTime * 1.5) * 0.4 * (0.3 + uBass);
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
    float l = grid(vUv, vec2(60.0, 30.0));
    float height = clamp(vH / 9.0, 0.0, 1.0);
    vec3 col = mix(uColorB, uColorA, height);
    float a = (0.12 + l) * uOpacity;
    if (a < 0.01) discard;
    gl_FragColor = vec4(col * (0.6 + l * 1.6 + height), a);
  }
`

export function WaveformCanyon({ scrollRef, lite = false }) {
  const matRef = useRef()
  const texRef = useRef(null)

  // uAudio is wired up in the layout effect below (refs aren't read in render).
  const uniforms = useMemo(
    () => ({
      uAudio: { value: null },
      uBass: { value: 0 },
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

  useFrame((state) => {
    const m = matRef.current
    const tex = texRef.current
    if (!m || !tex) return
    tex.image.data.set(audioSink.freq)
    tex.needsUpdate = true
    m.uniforms.uBass.value = audioSink.bass
    m.uniforms.uTime.value = state.clock.elapsedTime
    const p = scrollRef.current
    m.uniforms.uOpacity.value =
      smoothstep(0.58, 0.66, p) * (1 - smoothstep(0.86, 0.96, p))
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
