import { useEffect, useMemo, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useContentStore } from '../../store/contentStore'
import { usePlayerStore } from '../../store/playerStore'
import NowPlaying from './NowPlaying'

/* /track/:id — a shareable permalink for a single track. Cues it into the
   player (without autoplaying, which browsers block on a fresh load) so the
   Now Playing view opens already focused on that track. The server injects
   per-track Open Graph tags for this URL, so the link unfurls with the cover
   art in chats and on social. */
export default function Track() {
  const { id } = useParams()
  const tracks = useContentStore(s => s.tracks)
  const loaded = useContentStore(s => s.loaded)
  const track = useMemo(() => tracks.find(t => t.id === id), [tracks, id])
  const cued = useRef(null)

  useEffect(() => {
    if (!track || cued.current === track.id) return
    cued.current = track.id
    const player = usePlayerStore.getState()
    player.setQueue(tracks.filter(t => t.published !== false))
    if (player.currentTrack?.id !== track.id) {
      player.loadTrack(track, { autoplay: false })
    }
  }, [track, tracks])

  if (track) return <NowPlaying />

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--color-bg)', paddingTop: 88,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      {!loaded ? (
        <p style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading track…</p>
      ) : (
        <>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 26, color: 'var(--color-text)' }}>
            Track not found
          </p>
          <Link to="/library" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-accent)' }}>
            Browse the library →
          </Link>
        </>
      )}
    </div>
  )
}
