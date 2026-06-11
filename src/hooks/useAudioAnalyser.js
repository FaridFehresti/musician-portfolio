import { useEffect, useRef, useState } from 'react'

/**
 * Connects to a Howl instance's audio element and returns live frequency data.
 *
 * A media element may only ever have ONE MediaElementSource. NowPlaying and
 * the WaveformVisualizer both want analysis of the same Howl, so we cache one
 * source+analyser per audio node in a WeakMap and share it — multiple readers
 * of a single analyser are fine. Cleanup only stops the local rAF; the shared
 * graph is left connected for any other consumer (and is GC'd with the node).
 *
 * @param {object|null} howl  Howler.js Howl instance from playerStore
 * @returns {{ frequencyData: Uint8Array, averageBass: number }}
 */
const graphCache = new WeakMap() // HTMLMediaElement -> { source, analyser }

function getGraph(ctx, node) {
  let g = graphCache.get(node)
  if (!g) {
    const source = ctx.createMediaElementSource(node)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.6   // lower = snappier; preserves transient hits
    source.connect(analyser)
    analyser.connect(ctx.destination)
    g = { source, analyser }
    graphCache.set(node, g)
  }
  return g
}

/* Imperative access to the same shared analyser graph (no React state) —
   for canvas/WebGL loops that read frequency data inside their own rAF.
   Returns null until the Howl's media node is connectable. */
export function getSharedAnalyser(howl) {
  const ctx = window.Howler?.ctx
  const node = howl?._sounds?.[0]?._node
  if (!ctx || !node) return null
  try { return getGraph(ctx, node).analyser } catch { return null }
}

export function useAudioAnalyser(howl) {
  const rafRef = useRef(null)
  const [frequencyData, setFrequencyData] = useState(() => new Uint8Array(128))
  const [averageBass, setAverageBass] = useState(0)

  useEffect(() => {
    if (!howl) return

    const ctx = window.Howler?.ctx
    if (!ctx) return

    const sound = howl?._sounds?.[0]
    const node = sound?._node
    if (!node) return

    let graph
    try {
      graph = getGraph(ctx, node)
    } catch {
      return // node not connectable yet; bail quietly
    }

    const analyser = graph.analyser
    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    function tick() {
      rafRef.current = requestAnimationFrame(tick)
      analyser.getByteFrequencyData(dataArray)
      const copy = new Uint8Array(dataArray)
      setFrequencyData(copy)
      const bass = copy.slice(0, 8).reduce((a, b) => a + b, 0) / 8
      setAverageBass(bass)
    }
    tick()

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      // Intentionally do NOT disconnect the shared source/analyser here —
      // another consumer may still be reading it.
    }
  }, [howl])

  return { frequencyData, averageBass }
}
