import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { easing } from 'maath'
import { Particles } from './Particles'
import { GridFloor } from './stages/GridFloor'
import { Vinyl } from './stages/Vinyl'
import { WaveformCanyon } from './stages/WaveformCanyon'
import { samplePosition, sampleTarget } from './camera/cameraPath'
import { syntheticBass, syntheticSpectrum } from './audio/synthBeat'
import { audioSink } from './audio/audioSink'
import { BLOOM, COLORS, smoothstep } from './config'

/* The R3F scene root. Owns the master useFrame: low-passes audio into a calm
 * `level`, glides the camera along the scroll path with heavy damping, drifts
 * the fog gently, and keeps bloom essentially constant. Everything is smoothed
 * so nothing strobes. Each stage runs its own useFrame for its uniforms. */

export function Scene({ scrollRef, pointerRef, particleCount, multisampling, lite }) {
  const bloomRef = useRef()
  const fogRef = useRef()

  // Mutable scratch (refs are the sanctioned escape hatch for mutation).
  const camPos = useRef(new THREE.Vector3(0, 0, 20))
  const camTmp = useRef(new THREE.Vector3())
  const look = useRef(new THREE.Vector3(0, 0, -10))
  const lookTarget = useRef(new THREE.Vector3())
  const synthBuf = useRef(new Uint8Array(128))
  const level = useRef(0)

  useFrame((state, delta) => {
    const p = scrollRef.current
    const t = state.clock.elapsedTime
    const dt = Math.min(delta, 0.05) // clamp so a stutter can't jolt the smoothing

    // ── audio: raw → heavily low-passed `level` (calm, never strobes)
    if (!audioSink.live) audioSink.bass = syntheticBass(t)
    level.current += (audioSink.bass - level.current) * (1 - Math.exp(-dt * 2.2))
    audioSink.level = level.current
    if (!audioSink.live) {
      syntheticSpectrum(synthBuf.current, t, level.current)
      audioSink.freq = synthBuf.current
    }

    // ── camera travel: slow, heavily damped glide (smoothTime ~0.5s)
    samplePosition(p, camPos.current)
    const ptr = pointerRef.current
    const tmp = camTmp.current
    tmp.copy(camPos.current)
    tmp.x += ptr.x * 1.4 // whisper-subtle parallax
    tmp.y += ptr.y * 1.0
    easing.damp3(state.camera.position, tmp, 0.5, dt)

    sampleTarget(p, lookTarget.current)
    easing.damp3(look.current, lookTarget.current, 0.45, dt)
    state.camera.lookAt(look.current)

    // ── fog: gentle, slow drift (no abrupt clears)
    if (fogRef.current) {
      const clear = smoothstep(0.12, 0.5, p) * (1 - smoothstep(0.85, 1.0, p))
      fogRef.current.density = THREE.MathUtils.lerp(0.015, 0.008, clear)
    }

    // ── bloom: essentially constant, with a tiny smoothed breath
    if (bloomRef.current) {
      bloomRef.current.intensity = Math.min(
        BLOOM.intensityMax,
        BLOOM.intensity + level.current * BLOOM.intensityLevel,
      )
    }
  })

  return (
    <>
      <color attach="background" args={[COLORS.bg]} />
      <fogExp2 ref={fogRef} attach="fog" args={[COLORS.bg, 0.014]} />

      <Particles count={particleCount} scrollRef={scrollRef} />
      <GridFloor scrollRef={scrollRef} />
      <Vinyl scrollRef={scrollRef} />
      <WaveformCanyon scrollRef={scrollRef} lite={lite} />

      <EffectComposer disableNormalPass multisampling={multisampling}>
        <Bloom
          ref={bloomRef}
          luminanceThreshold={BLOOM.threshold}
          luminanceSmoothing={BLOOM.smoothing}
          mipmapBlur
          intensity={BLOOM.intensity}
          radius={BLOOM.radius}
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  )
}
