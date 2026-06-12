import { motion } from 'framer-motion'
import { usePlayerStore } from '../../../store/playerStore'
import { GENRE_GRADIENTS } from '../../../data/tracks'

/**
 * A clean numbered track list for the home page — a deliberately different
 * presentation from the hero deck (not another card slider). Click a row to
 * play; the active row shows a live equalizer.
 */
export function TrackList({ tracks }) {
  const { currentTrack, isPlaying, loadTrack, setQueue, play, pause } = usePlayerStore()

  function handleRow(track) {
    if (currentTrack?.id === track.id) {
      if (isPlaying) pause()
      else play()
    } else {
      setQueue(tracks)
      loadTrack(track)
    }
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--color-surface)', border: '1px solid color-mix(in srgb, var(--accent-2) 16%, transparent)', boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}
    >
      {tracks.map((track, i) => {
        const active = currentTrack?.id === track.id
        const playing = active && isPlaying
        const grad = GENRE_GRADIENTS[track.genre] || ['#1a0a33', '#08041a']

        return (
          <motion.button
            key={track.id}
            onClick={() => handleRow(track)}
            whileHover={{ x: 4 }}
            className="w-full flex items-center gap-4 px-4 sm:px-5 py-3 text-left"
            style={{
              borderBottom: i < tracks.length - 1 ? '1px solid color-mix(in srgb, var(--text) 5%, transparent)' : 'none',
              background: active ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'transparent',
              cursor: 'pointer', transition: 'background 0.18s ease',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
          >
            {/* Number / live equalizer */}
            <span style={{ width: 26, flexShrink: 0, display: 'flex', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: active ? 'var(--neon-magenta)' : 'var(--color-muted)' }}>
              {playing ? <Equalizer /> : String(i + 1).padStart(2, '0')}
            </span>

            {/* Cover thumbnail */}
            <div style={{ width: 46, height: 46, borderRadius: 7, overflow: 'hidden', flexShrink: 0, boxShadow: active ? '0 0 0 1.5px var(--neon-magenta), 0 0 14px var(--glow-magenta)' : '0 0 0 1px rgba(255,255,255,0.08)' }}>
              {track.coverArt
                ? <img src={track.coverArt} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})` }} />}
            </div>

            {/* Title + artist */}
            <div className="flex-1 min-w-0">
              <p className="truncate" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: 15, color: active ? 'var(--neon-magenta)' : 'var(--color-text)', lineHeight: 1.2 }}>
                {track.title}
              </p>
              <p className="truncate" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)', letterSpacing: '0.04em' }}>
                {track.artist}
              </p>
            </div>

            {/* Genre */}
            <span className="hidden sm:block" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {track.genre}
            </span>

            {/* Play / pause glyph */}
            <span style={{ width: 30, height: 30, flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${active ? 'var(--neon-magenta)' : 'rgba(255,255,255,0.14)'}`, color: active ? 'var(--neon-magenta)' : 'var(--color-muted)' }}>
              {playing
                ? <svg width="11" height="12" viewBox="0 0 12 14" fill="currentColor"><path d="M0 0h3.5v14H0zM8.5 0H12v14H8.5z" /></svg>
                : <svg width="11" height="12" viewBox="0 0 12 14" fill="currentColor" style={{ marginLeft: 2 }}><path d="M0 0l12 7L0 14z" /></svg>}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}

function Equalizer() {
  return (
    <span className="flex items-end" style={{ gap: 2, height: 14 }}>
      <span className="animate-equalizer1" style={{ width: 3, height: 6, borderRadius: 1, background: 'var(--neon-magenta)' }} />
      <span className="animate-equalizer2" style={{ width: 3, height: 12, borderRadius: 1, background: 'var(--neon-cyan)' }} />
      <span className="animate-equalizer3" style={{ width: 3, height: 8, borderRadius: 1, background: 'var(--neon-magenta)' }} />
    </span>
  )
}
