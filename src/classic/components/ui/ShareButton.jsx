import { useState, useEffect, useRef } from 'react'
import { shareTrack } from '../../../lib/share'

/* Share control for a track. Click → OS share sheet (mobile) or copy link
   (desktop), then briefly confirms with a check / "Link copied". Two looks:
   icon-only (default) for tight rows like the deck cards, and a labelled pill
   (pass `label`) for prominent spots like Now Playing. */
export function ShareButton({
  track,
  label,
  size = 24,
  iconSize = 16,
  color = 'rgba(255,255,255,0.55)',
  activeColor = 'var(--neon-cyan)',
  title = 'Share track',
}) {
  const [done, setDone] = useState(false)
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])

  async function onClick(e) {
    e.stopPropagation()
    const status = await shareTrack(track)
    if (status === 'shared' || status === 'copied') {
      setDone(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setDone(false), 1600)
    }
  }

  if (label) {
    return (
      <button
        onClick={onClick}
        aria-label={title}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 999,
          background: 'color-mix(in srgb, var(--color-surface) 60%, transparent)',
          border: `1px solid color-mix(in srgb, var(--neon-magenta) ${done ? 70 : 38}%, transparent)`,
          color: done ? 'var(--neon-magenta)' : 'var(--color-text)',
          fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.06em', cursor: 'pointer',
          backdropFilter: 'blur(8px)', transition: 'color 0.18s, border-color 0.18s',
        }}
      >
        {done ? <CheckIcon size={15} /> : <ShareIcon size={15} />}
        {done ? 'Link copied' : label}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      aria-label={title}
      title={done ? 'Link copied!' : title}
      style={{
        flexShrink: 0, width: size, height: size, borderRadius: '50%', border: 'none',
        background: 'transparent', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: done ? activeColor : color, transition: 'color 0.18s',
      }}
    >
      {done ? <CheckIcon size={iconSize} /> : <ShareIcon size={iconSize} />}
    </button>
  )
}

function ShareIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  )
}

function CheckIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12.5l5 5 11-11" />
    </svg>
  )
}
