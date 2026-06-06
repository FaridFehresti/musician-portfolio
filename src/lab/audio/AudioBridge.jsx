import { useEffect } from 'react'
import { useAudioAnalyser } from '../../hooks/useAudioAnalyser'
import { usePlayerStore } from '../../store/playerStore'
import { audioSink } from './audioSink'

/* ───────────────────────────────────────────────────────────────────────
 * Render-null bridge between the player's live audio analyser and the 3D
 * scene. It lives in the DOM (NOT inside <Canvas>), runs the existing
 * useAudioAnalyser hook (which setStates ~60fps), and writes the values
 * into the shared audioSink module. Because it renders null, those 60fps
 * updates never re-render the Canvas/scene — the scene reads `audioSink`
 * in useFrame. When nothing is playing, `live` flips false and Scene.jsx
 * fills the same sink from synthBeat instead.
 * ──────────────────────────────────────────────────────────────────────── */

export function AudioBridge() {
  const howl = usePlayerStore((s) => s.howl)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const { frequencyData, averageBass } = useAudioAnalyser(howl)

  useEffect(() => {
    if (isPlaying && howl) {
      audioSink.bass = averageBass / 255
      audioSink.freq = frequencyData
      audioSink.live = true
    } else {
      audioSink.live = false
    }
  }, [frequencyData, averageBass, isPlaying, howl])

  return null
}
