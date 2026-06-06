import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CORRIDOR } from './config'
import { audioSink } from './audio/audioSink'
import './materials/journeyParticles' // side-effect: registers <journeyParticlesMaterial />

/* Pure, seeded PRNG (mulberry32) — deterministic layout, no Math.random in render. */
function makePRNG(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* The hero particle cosmos. A static cloud filling the corridor; the curl-noise
 * flow field (in the shader) makes it stream smoothly, the camera travels through it. */
export function Particles({ count, scrollRef, sizeScale = 1 }) {
  const matRef = useRef()

  const geometry = useMemo(() => {
    const rand = makePRNG(count * 2654435761 + 1)
    const g = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    const { zMin, zMax } = CORRIDOR

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (rand() * 2 - 1) * 44
      positions[i * 3 + 1] = (rand() * 2 - 1) * 28
      positions[i * 3 + 2] = zMin + rand() * (zMax - zMin)
      seed[i] = rand()
    }

    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    return g
  }, [count])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((state) => {
    const m = matRef.current
    if (!m) return
    m.uniforms.uTime.value = state.clock.elapsedTime
    m.uniforms.uScroll.value = scrollRef.current
    m.uniforms.uLevel.value = audioSink.level
    m.uniforms.uPixelRatio.value = state.gl.getPixelRatio()
  })

  return (
    <points geometry={geometry}>
      <journeyParticlesMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uSize={2.8 * sizeScale}
      />
    </points>
  )
}
