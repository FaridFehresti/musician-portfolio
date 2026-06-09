import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { audioSink } from './audioSink'

/* ───────────────────────────────────────────────────────────────────────
 * Resonance — the /lab music-reactive scene.
 *
 * A tilted disc of particles arranged into CLOSED concentric rings (nested
 * circles) around a dark vortex eye, fading at the rim. fbm warps the rings for
 * a little organic chaos and the per-particle height scatter gives them volume.
 *
 * Reaction = a real BOUNCE. The live spectrum is uploaded to a 1-D texture and
 * sampled by each ring's radius, and a smoothed bass kick lifts every ring on
 * the beat. Asymmetric per-bin smoothing (snap up, ease down) gives a springy
 * bounce; size/brightness barely move, so it's the rings that dance, not a
 * global flash.
 * ─────────────────────────────────────────────────────────────────────── */

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
    bass = 0.09 + 0.03 * Math.sin(clock * 0.7)
    mid = 0.07 + 0.02 * Math.sin(clock * 0.5 + 1)
    treble = 0.05 + 0.02 * Math.sin(clock * 1.1 + 2)
  }
  // asymmetric: snap up to peaks (follow transient hits), ease down (smooth decay)
  const ka = 1 - Math.exp(-dt * 22)
  const kr = 1 - Math.exp(-dt * 4.5)
  prev.bass   += (bass   - prev.bass)   * (bass   > prev.bass   ? ka : kr)
  prev.mid    += (mid    - prev.mid)    * (mid    > prev.mid    ? ka : kr)
  prev.treble += (treble - prev.treble) * (treble > prev.treble ? ka : kr)
  return prev
}
function energy(b) { return b.bass * 0.6 + b.mid * 0.3 + b.treble * 0.1 }

/* ── Shaders ───────────────────────────────────────────────────────────── */
const vert = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  uniform float uBounce;
  uniform float uBass;        // smoothed bass — the beat kick shared by all rings
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uMaxR;
  uniform sampler2D uAudio;   // 1-D spectrum, x = freq bin (bass→treble)
  uniform vec3 uColorA;       // theme --accent   (rim)
  uniform vec3 uColorB;       // theme --accent-2 (core)
  attribute float aRand;
  varying float vBright;
  varying vec3 vColor;

  // --- simplex noise (Ashima / Stefan Gustavson) ---
  vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec2 mod289(vec2 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  float fbm(vec2 p){
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 3; i++){ s += a * snoise(p); p = p * 2.0 + 11.3; a *= 0.5; }
    return s;
  }
  // gentle whole-field rotation; only a faint radius term so it stays circular
  // (concentric) rather than winding into spiral arms
  vec2 swirl(vec2 p, float t){
    float r = length(p);
    float ang = atan(p.y, p.x) + r * 0.012 + t * 0.04;
    return vec2(cos(ang), sin(ang)) * r;
  }

  // CLOSED concentric rings → nested circles (not a spiral), with a dark vortex
  // eye and a fading rim. Radius-only phase keeps every ring a complete loop;
  // fbm warps it for a little organic chaos. (r coeff = ring spacing; fbm coeff
  // = chaos amount; drop the fbm term for perfect circles.)
  float ringMask(vec2 base, float r, float t){
    float phase = r * 1.05 - t * 0.35 + fbm(base * 0.07) * 0.8;
    float arm   = pow(0.5 + 0.5 * cos(phase), 2.6);   // bright ring crests
    float centre = smoothstep(1.0, 6.0, r);           // small dark vortex eye
    float rim    = 1.0 - smoothstep(24.0, 34.0, r);   // fade the outer edge to black
    return clamp(arm * centre * rim, 0.0, 1.0);
  }

  void main(){
    vec2 base = position.xz;
    float r = length(base);
    vec2 q = swirl(base, uTime);

    float arm = ringMask(base, r, uTime);
    float centre = smoothstep(0.0, 3.5, r);           // only the tiny core is calmed
    // everything reacts now (centre + gaps included); rings still move most
    float motion = (0.45 + 0.55 * arm) * centre;

    float n  = fbm(q * 0.06 + uTime * 0.02);
    float rN = clamp(r / 30.0, 0.0, 1.0);
    float fr = texture2D(uAudio, vec2(rN * 0.6, 0.5)).r;
    float kick = fr * 0.5 + uBass * 1.0;              // bass beat energy (0..~1.5)
    // SQUARE it so the reaction scales hard with intensity: soft music barely
    // moves, hard hits punch much higher (quadratic, not linear).
    float punch = min(kick * kick, 1.8);

    // all rings lift together, with a little organic drifting chaos
    float chaos = 0.8 + 0.2 * fbm(base * 0.12 + uTime * 0.6);
    // small always-on undulation (n) so soft passages stay calm; the music
    // drives the big motion via punch
    float h = (n * 0.4 + punch * uBounce * chaos) * motion * uAmp;

    // per-particle height scatter (more on the arms) → volume, not a flat sheet
    float hvar = (aRand - 0.5) * 2.0;
    h += hvar * (0.22 + arm * 0.95) * centre;

    vec3 pos = vec3(position.x, h, position.z);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    float dist = -mv.z;

    // brightness: bright along the rings BUT broken up by dark voids, dim
    // between, dark vortex centre. One cloud-noise lookup drives both the gentle
    // brightness variance and the dark patches carved into the rings.
    float nz    = fbm(q * 0.15 + 23.1) * 0.5 + 0.5;   // 0..1 cloud noise
    float tex   = 0.55 + 0.45 * nz;                   // gentle brightness variance
    float voids = smoothstep(0.22, 0.72, nz);         // dark voids in the rings
    float star  = pow(aRand, 0.85);                   // less dark-biased → dim dots lift
    float fade  = 1.0 - smoothstep(20.0, 80.0, dist);
    // dark particles given a HIGH floor + gentle per-particle variance so they
    // are clearly visible; the rings still stack much brighter via arm
    float baseB = (0.5 + arm * 1.1 * tex * voids) * (0.8 + star * 0.5);
    vBright = baseB * clamp(fade, 0.03, 1.0);
    vBright += punch * 1.2 * arm * (0.6 + star) * (0.45 + 0.55 * voids);  // flare scales with intensity

    // neon tint: gradient from accent-2 (core) → accent (rim). On the beat it
    // shifts toward the vivid primary accent and brightens — the reaction glows
    // ON-THEME (accent colour), not white.
    vec3 tint = mix(uColorB, uColorA, clamp(r / 26.0, 0.0, 1.0));
    float hot = clamp(kick * arm * 1.6, 0.0, 1.0);
    vColor = mix(tint, uColorA, hot) * (1.0 + hot * 0.45);

    float sz = uSize * uPixelRatio * (0.4 + arm * 0.9 + aRand * 0.25) * (1.0 + punch * arm * 0.7);
    gl_PointSize = clamp(sz / dist, 0.6, 14.0);
    gl_Position = projectionMatrix * mv;
  }
`

const frag = /* glsl */ `
  varying float vBright;
  varying vec3 vColor;
  void main(){
    // hexagon sprite: cut the corners off the point quad
    vec2 p = abs(gl_PointCoord - 0.5) * 2.0;          // 0..1 from centre
    float hexd = max(p.x * 0.866025 + p.y * 0.5, p.y);
    if (hexd > 1.0) discard;
    // soft hexagon falloff fakes a per-particle glow now that bloom is gone
    float a = smoothstep(1.0, 0.62, hexd) * 0.72;
    gl_FragColor = vec4(vColor * vBright, a);
  }
`

function ParticleWave({ reduced = false, lite = false, spin = false }) {
  const matRef = useRef()
  const groupRef = useRef()
  const bands = useRef({ bass: 0, mid: 0, treble: 0 })
  const smBins = useRef(new Float32Array(128))
  const sm = useRef({ amp: 1 })
  const themeTick = useRef(0)

  const COLS = lite ? 130 : 200
  const ROWS = lite ? 130 : 200
  const W = 66, D = 56
  const maxR = Math.hypot(W / 2, D / 2)

  const geometry = useMemo(() => {
    const count = COLS * ROWS
    const pos = new Float32Array(count * 3)
    const rand = new Float32Array(count)
    let i = 0
    for (let z = 0; z < ROWS; z++) {
      for (let x = 0; x < COLS; x++) {
        pos[i * 3]     = (x / (COLS - 1) - 0.5) * W
        pos[i * 3 + 1] = 0
        pos[i * 3 + 2] = (z / (ROWS - 1) - 0.5) * D
        rand[i] = Math.random()
        i++
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aRand', new THREE.BufferAttribute(rand, 1))
    return g
  }, [COLS, ROWS, W, D])

  const audioTex = useMemo(() => {
    const tex = new THREE.DataTexture(new Uint8Array(128 * 4), 128, 1, THREE.RGBAFormat)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.wrapS = THREE.ClampToEdgeWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    tex.needsUpdate = true
    return tex
  }, [])

  const uniforms = useMemo(() => {
    // seed colours from the live theme so the first frame is on-theme (no blue→accent flash)
    const cs = typeof document !== 'undefined' ? getComputedStyle(document.documentElement) : null
    const ca = (cs && cs.getPropertyValue('--accent').trim()) || '#6d8bff'
    const cb = (cs && cs.getPropertyValue('--accent-2').trim()) || '#22d3ee'
    return {
      uTime: { value: 0 },
      uAmp: { value: 1 },
      uBounce: { value: 2.6 },
      uBass: { value: 0 },
      uSize: { value: lite ? 80 : 90 },
      uPixelRatio: { value: 1 },
      uMaxR: { value: maxR },
      uAudio: { value: audioTex },
      uColorA: { value: new THREE.Color(ca) },
      uColorB: { value: new THREE.Color(cb) },
    }
  }, [lite, maxR, audioTex])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const u = matRef.current?.uniforms
    if (!u) return

    const f = audioSink.freq
    const live = audioSink.live
    const t = state.clock.elapsedTime
    const bins = smBins.current
    const data = audioTex.image.data
    // Asymmetric per-bin smoothing: snap up on a hit, ease back down → bounce.
    const up = 1 - Math.exp(-dt * 15)
    const down = 1 - Math.exp(-dt * 3.0)
    for (let i = 0; i < 128; i++) {
      let target = live ? f[i] / 255 : 0.05 + 0.04 * Math.sin(t * 1.3 + i * 0.25)
      if (target < 0) target = 0
      bins[i] += (target - bins[i]) * (target > bins[i] ? up : down)
      const v = Math.max(0, Math.min(255, bins[i] * 255)) | 0
      data[i * 4] = v; data[i * 4 + 1] = v; data[i * 4 + 2] = v; data[i * 4 + 3] = 255
    }
    audioTex.needsUpdate = true

    const b = readBands(bands.current, dt, t)
    const e = energy(b)
    sm.current.amp += ((1.0 + e * 0.2) - sm.current.amp) * (1 - Math.exp(-dt * 2.0))
    u.uTime.value += dt * (0.4 + e * 0.2) * (reduced ? 0.5 : 1)
    u.uAmp.value = sm.current.amp
    u.uBass.value = b.bass
    u.uPixelRatio.value = state.gl.getPixelRatio()

    // pull the live theme accents (~twice a second) so the colours re-theme
    if ((themeTick.current++ % 30) === 0 && typeof document !== 'undefined') {
      const cs = getComputedStyle(document.documentElement)
      const a = cs.getPropertyValue('--accent').trim()
      const c = cs.getPropertyValue('--accent-2').trim()
      if (a) u.uColorA.value.set(a)
      if (c) u.uColorB.value.set(c)
    }

    // smooth pendulum swing ±~45° (no full rotation)
    if (spin && groupRef.current) groupRef.current.rotation.y = Math.sin(t * 0.08) * 0.3
  })

  return (
    <points ref={groupRef} geometry={geometry} rotation={[0.6, 0, -0.58]}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vert}
        fragmentShader={frag}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export function Visualizer({ reduced = false, lite = false, autoRotate = false, interactive = false }) {
  return (
    <>
      <color attach="background" args={['#000000']} />

      <ParticleWave reduced={reduced} lite={lite} spin={autoRotate && !reduced} />

      <OrbitControls
        enablePan={false}
        enableRotate={interactive}
        enableZoom={interactive && !reduced}
        minDistance={12}
        maxDistance={60}
        minPolarAngle={0.3}
        maxPolarAngle={1.62}
        autoRotate={false}
        autoRotateSpeed={0.45}
        enableDamping
        dampingFactor={0.06}
        target={[0, 0, 0]}
      />
    </>
  )
}
