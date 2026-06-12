import { useEffect, useRef } from 'react'
import { audioSink } from '../visualizer/audioSink'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

/* Analog VU meter. The needle is driven imperatively from a private rAF loop
   that reads the shared audioSink (written by AudioBridge) — zero React state
   per frame, per the audio→visual pattern this codebase already uses. */

const MIN_DEG = -48
const MAX_DEG = 48

function polar(deg, r) {
  const a = (deg * Math.PI) / 180
  return [50 + r * Math.sin(a), 54 - r * Math.cos(a)]
}

const TICKS = [-48, -36, -24, -12, 0, 12, 24, 36, 48]
const [rzx1, rzy1] = polar(24, 44)
const [rzx2, rzy2] = polar(48, 44)
const RED_ARC = `M ${rzx1.toFixed(1)} ${rzy1.toFixed(1)} A 44 44 0 0 1 ${rzx2.toFixed(1)} ${rzy2.toFixed(1)}`

export function VUMeter({ band = 'all', label = 'VU', className = '' }) {
  const needleRef = useRef(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced) return // decorative — leave the needle at rest
    let raf
    let value = 0
    const lo = band === 'high' ? 48 : 0
    const hi = band === 'low' ? 24 : 128
    function tick() {
      raf = requestAnimationFrame(tick)
      let target = 0
      if (audioSink.live) {
        const f = audioSink.freq
        let sum = 0
        for (let i = lo; i < hi; i++) sum += f[i]
        target = Math.min(1, (sum / (hi - lo) / 255) * 1.45)
      }
      // VU ballistics: fast attack, slow release
      value += (target - value) * (target > value ? 0.35 : 0.07)
      const deg = MIN_DEG + (MAX_DEG - MIN_DEG) * value
      needleRef.current?.setAttribute('transform', `rotate(${deg.toFixed(2)} 50 54)`)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [band, reduced])

  return (
    <div className={`vu-glass relative overflow-hidden rounded-sm border border-bg-deep ${className}`}>
      <svg viewBox="0 0 100 60" className="block h-full w-full" aria-hidden="true">
        {/* dial ticks */}
        {TICKS.map((d) => {
          const [x1, y1] = polar(d, 37)
          const [x2, y2] = polar(d, 43)
          const hot = d >= 24
          return (
            <line
              key={d}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={hot ? '#a2452e' : '#221b12'}
              strokeWidth={d === 0 ? 1.4 : 0.9}
              opacity={hot ? 0.9 : 0.55}
            />
          )
        })}
        {/* red zone arc */}
        <path d={RED_ARC} fill="none" stroke="#a2452e" strokeWidth="2.2" opacity="0.85" />
        {/* needle */}
        <g ref={needleRef} transform={`rotate(${MIN_DEG} 50 54)`}>
          <line x1="50" y1="54" x2="50" y2="15" stroke="#221b12" strokeWidth="1.4" />
        </g>
        {/* pivot + label */}
        <circle cx="50" cy="54" r="3.4" fill="#221b12" />
        <text
          x="50" y="51" textAnchor="middle"
          fontSize="8" fontFamily="IBM Plex Mono, monospace" fontWeight="500"
          fill="#221b12" opacity="0.7"
        >
          {label}
        </text>
      </svg>
    </div>
  )
}
