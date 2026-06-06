import { useRef, useEffect } from 'react'
import { usePlayerStore } from '../../store/playerStore'
import { useAudioAnalyser } from '../../hooks/useAudioAnalyser'

/* "#rrggbb" → "r,g,b" so the canvas gradient can follow the active theme. */
function hexToRgb(hex) {
  const h = (hex || '').trim().replace('#', '')
  if (h.length === 3) return `${parseInt(h[0] + h[0], 16)},${parseInt(h[1] + h[1], 16)},${parseInt(h[2] + h[2], 16)}`
  if (h.length >= 6) return `${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)}`
  return null
}

export function WaveformVisualizer() {
  const { howl, isPlaying } = usePlayerStore()
  const { frequencyData } = useAudioAnalyser(howl)
  const canvasRef = useRef(null)
  const decayRef  = useRef(new Float32Array(64).fill(0))
  const rafRef    = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const cs = getComputedStyle(document.documentElement)
    const c1 = hexToRgb(cs.getPropertyValue('--accent-2')) || '0,229,255'
    const c2 = hexToRgb(cs.getPropertyValue('--accent')) || '255,47,208'

    function draw() {
      rafRef.current = requestAnimationFrame(draw)
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      const bars = 64
      const barW = (W / bars) - 1
      const decay = decayRef.current

      for (let i = 0; i < bars; i++) {
        /* Live value from analyser, or decay toward 0 */
        const live = isPlaying ? (frequencyData[i * 2] || 0) * 0.7 : 0
        decay[i] = isPlaying
          ? Math.max(live, decay[i] * 0.85)
          : decay[i] * 0.92   /* gentle decay on pause/stop */

        const barH = (decay[i] / 255) * (H - 4)

        /* Gold gradient: brighter at centre */
        const distFromCentre = Math.abs(i - bars / 2) / (bars / 2)
        const alpha = 0.9 - distFromCentre * 0.6

        const grad = ctx.createLinearGradient(0, H - barH, 0, H)
        grad.addColorStop(0, `rgba(${c1},${alpha})`)
        grad.addColorStop(1, `rgba(${c2},${alpha * 0.6})`)

        ctx.fillStyle = grad
        const x = i * (barW + 1)
        ctx.beginPath()
        ctx.roundRect(x, H - barH, barW, barH, 2)
        ctx.fill()
      }
    }

    draw()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [isPlaying, frequencyData])

  /* Resize to container */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(([entry]) => {
      canvas.width  = entry.contentRect.width
      canvas.height = 80
    })
    ro.observe(canvas.parentElement)
    return () => ro.disconnect()
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={80}
      className="w-full"
      style={{ display: 'block' }}
    />
  )
}
