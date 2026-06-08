import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  Icosahedron, MeshDistortMaterial, Grid, Sparkles,
  Environment, Lightformer, OrbitControls,
} from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { audioSink } from './audio/audioSink'

/* ───────────────────────────────────────────────────────────────────────
 * Resonance — the /lab music-reactive scene.
 *
 *   • a distorting neon orb whose wobble + glow track the bass
 *   • a ring of 72 bars around it, each driven by one frequency bin
 *   • a synthwave grid floor, drifting sparkles, pulsing key lights, bloom
 *
 * Everything reads the shared `audioSink` (filled by <AudioBridge> from the
 * player's live analyser) inside useFrame — so the audio→visual path never
 * re-renders React. When nothing is playing it idles on a slow synthetic
 * pulse so the scene is never dead.
 * ─────────────────────────────────────────────────────────────────────── */

const NEON_A = new THREE.Color('#ff2fd0') // magenta
const NEON_B = new THREE.Color('#00e5ff') // cyan
const NEON_C = new THREE.Color('#7a4dff') // violet

/* Read + smooth the frequency bands once per frame into `prev`. */
function readBands(prev, dt, clock) {
  const f = audioSink.freq
  let bass = 0, mid = 0, treble = 0
  const n = f.length
  const midEnd = Math.floor(n * 0.42)
  for (let i = 0; i < n; i++) {
    const v = f[i] / 255
    if (i < 10) bass += v
    else if (i < midEnd) mid += v
    else treble += v
  }
  bass /= 10
  mid /= Math.max(1, midEnd - 10)
  treble /= Math.max(1, n - midEnd)

  if (!audioSink.live) {
    // gentle idle so the scene breathes with no music
    bass = 0.14 + 0.06 * Math.sin(clock * 1.4)
    mid = 0.10 + 0.04 * Math.sin(clock * 0.9 + 1)
    treble = 0.08 + 0.03 * Math.sin(clock * 2.1 + 2)
  }

  const k = 1 - Math.exp(-dt * 9)
  prev.bass += (bass - prev.bass) * k
  prev.mid += (mid - prev.mid) * k
  prev.treble += (treble - prev.treble) * k
  return prev
}

/* ── Reactive orb ──────────────────────────────────────────────────────── */
function Orb() {
  const mesh = useRef()
  const mat = useRef()
  const bands = useRef({ bass: 0, mid: 0, treble: 0 })
  const tint = useRef(new THREE.Color())

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const b = readBands(bands.current, dt, state.clock.elapsedTime)
    if (mat.current) {
      mat.current.distort = 0.16 + b.bass * 0.85 + b.mid * 0.15
      mat.current.speed = 1.1 + b.treble * 3.5
      mat.current.emissiveIntensity = 0.5 + b.bass * 3.0
      // hue drifts magenta→violet→cyan with energy
      tint.current.copy(NEON_A).lerp(NEON_C, b.mid).lerp(NEON_B, b.treble)
      mat.current.emissive.copy(tint.current)
    }
    if (mesh.current) {
      const s = 1 + b.bass * 0.22
      mesh.current.scale.setScalar(s)
      mesh.current.rotation.y += dt * (0.15 + b.treble * 0.6)
      mesh.current.rotation.x += dt * 0.05
      mesh.current.position.y = 1.45 + Math.sin(state.clock.elapsedTime * 0.8) * 0.06
    }
  })

  return (
    <Icosahedron ref={mesh} args={[1.15, 12]} position={[0, 1.45, 0]}>
      <MeshDistortMaterial
        ref={mat}
        color="#140a22"
        emissive={NEON_A}
        emissiveIntensity={0.6}
        roughness={0.12}
        metalness={0.45}
        distort={0.2}
        speed={1.4}
        envMapIntensity={1.1}
      />
    </Icosahedron>
  )
}

/* ── Frequency ring — 72 bars, one per frequency bin, around the orb ────── */
function Ring() {
  const ref = useRef()
  const count = 72
  const radius = 3.25
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const heights = useRef(new Float32Array(count))
  const bands = useRef({ bass: 0, mid: 0, treble: 0 })
  const colorObj = useMemo(() => new THREE.Color(), [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const f = audioSink.freq
    const b = readBands(bands.current, dt, state.clock.elapsedTime)
    const im = ref.current
    if (!im) return
    const k = 1 - Math.exp(-dt * 18)
    for (let i = 0; i < count; i++) {
      const bin = 4 + Math.floor((i / count) * (f.length - 6))
      const v = audioSink.live
        ? f[bin] / 255
        : 0.1 + 0.45 * Math.pow((Math.sin(i * 0.5 + state.clock.elapsedTime * 3) + 1) / 2, 2) * (0.5 + b.bass)
      const target = 0.15 + v * 4.4
      heights.current[i] += (target - heights.current[i]) * k
      const h = Math.max(0.04, heights.current[i])

      const a = (i / count) * Math.PI * 2
      dummy.position.set(Math.cos(a) * radius, h / 2, Math.sin(a) * radius)
      dummy.scale.set(0.11, h, 0.11)
      dummy.rotation.set(0, -a, 0)
      dummy.updateMatrix()
      im.setMatrixAt(i, dummy.matrix)

      // tall (loud) bars glow hotter and shift magenta; quiet bars stay cyan
      const heat = Math.min(1, v * 1.4)
      colorObj.copy(NEON_B).lerp(NEON_A, heat)
      colorObj.multiplyScalar(0.5 + heat * 2.4) // >1 so bloom catches the peaks
      im.setColorAt(i, colorObj)
    }
    im.instanceMatrix.needsUpdate = true
    if (im.instanceColor) im.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      {/* unlit + toneMapped:false so the per-instance colours (scaled >1) bloom
          in their own neon hue rather than a uniform emissive white */}
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

/* ── Pulsing key lights ────────────────────────────────────────────────── */
function Lights() {
  const a = useRef()
  const b = useRef()
  const bands = useRef({ bass: 0, mid: 0, treble: 0 })
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const bd = readBands(bands.current, dt, state.clock.elapsedTime)
    if (a.current) a.current.intensity = 6 + bd.bass * 40
    if (b.current) b.current.intensity = 5 + bd.treble * 30
  })
  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight ref={a} position={[-4, 3, 3]} color={NEON_A} intensity={8} distance={20} />
      <pointLight ref={b} position={[4, 2, -2]} color={NEON_B} intensity={6} distance={20} />
      <directionalLight position={[0, 8, 4]} intensity={0.4} color="#ffffff" />
    </>
  )
}

/* ── Bloom that breathes with the bass ─────────────────────────────────── */
function Post() {
  const bloom = useRef()
  const bands = useRef({ bass: 0, mid: 0, treble: 0 })
  useFrame((state, delta) => {
    const bd = readBands(bands.current, Math.min(delta, 0.05), state.clock.elapsedTime)
    if (bloom.current) bloom.current.intensity = 0.9 + bd.bass * 1.6
  })
  return (
    <EffectComposer disableNormalPass>
      <Bloom ref={bloom} intensity={1.1} luminanceThreshold={0.25} luminanceSmoothing={0.9} mipmapBlur radius={0.7} />
    </EffectComposer>
  )
}

export function Visualizer({ reduced = false, lite = false }) {
  return (
    <>
      <color attach="background" args={['#070410']} />
      <fog attach="fog" args={['#070410', 9, 22]} />

      <Lights />

      <Orb />
      <Ring />

      {/* synthwave floor */}
      <Grid
        position={[0, 0, 0]}
        args={[40, 40]}
        cellSize={0.6}
        cellThickness={0.6}
        cellColor="#2a1147"
        sectionSize={3}
        sectionThickness={1.1}
        sectionColor="#ff2fd0"
        fadeDistance={26}
        fadeStrength={1.4}
        infiniteGrid
      />

      {!lite && (
        <Sparkles count={reduced ? 40 : 120} scale={[16, 8, 16]} position={[0, 3, 0]} size={2.4} speed={reduced ? 0.1 : 0.4} color="#7a4dff" opacity={0.7} />
      )}

      {/* neon environment for the orb's reflections (no HDRI download) */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3} color="#ff2fd0" position={[-5, 4, 2]} scale={[6, 8, 1]} />
        <Lightformer form="rect" intensity={3} color="#00e5ff" position={[5, 3, 1]} scale={[6, 8, 1]} />
        <Lightformer form="ring" intensity={2} color="#7a4dff" position={[0, 2, -6]} scale={6} />
      </Environment>

      <OrbitControls
        enablePan={false}
        enableZoom={!reduced}
        minDistance={4.5}
        maxDistance={11}
        minPolarAngle={0.4}
        maxPolarAngle={Math.PI / 2 + 0.05}
        autoRotate={!reduced}
        autoRotateSpeed={0.5}
        enableDamping
        target={[0, 1.2, 0]}
      />

      <Post />
    </>
  )
}
