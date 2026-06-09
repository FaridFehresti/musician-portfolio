import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import { Panel, Btn } from './ui'

/* Streams dashboard for the client: all-time + windowed totals, a daily bar
   chart, and a per-track breakdown. Data comes from /api/admin/analytics,
   which aggregates the `plays` log written whenever a visitor starts a track. */

const WINDOWS = [[7, '7 days'], [30, '30 days'], [90, '90 days']]

export function AnalyticsSection() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (d) => {
    setLoading(true); setError(null)
    try {
      setData(await api.analytics(d))
    } catch (e) {
      setError(e.message || 'Could not load analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(days) }, [days, load])

  return (
    <>
      <Panel
        title="Streams"
        desc="Every time a visitor starts one of your tracks, it's counted here. Numbers update live as people listen."
        actions={
          <div style={{ display: 'flex', gap: 6 }}>
            {WINDOWS.map(([d, label]) => (
              <button
                key={d} onClick={() => setDays(d)}
                style={{
                  padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  background: days === d ? 'var(--color-accent)' : 'transparent',
                  color: days === d ? 'var(--on-accent, #0a0a0a)' : 'var(--color-muted)',
                  border: days === d ? 'none' : '1px solid color-mix(in srgb, var(--text) 16%, transparent)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        }
      >
        {error && <p style={{ color: '#ff5470', fontSize: 13 }}>{error}</p>}
        {loading && !data && <p style={{ color: 'var(--color-muted)' }}>Loading…</p>}

        {data && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 22 }}>
              <Stat label="Total streams" value={fmt(data.total)} hint="all time" />
              <Stat label={`Last ${data.days} days`} value={fmt(data.windowStreams)} hint="streams" />
              <Stat label="Tracks played" value={fmt(data.tracksPlayed)} hint="with ≥1 stream" />
              <Stat label="Top track" value={data.perTrack[0]?.title || '—'} hint={data.perTrack[0] ? `${fmt(data.perTrack[0].streams)} streams` : 'no plays yet'} small />
            </div>

            <Chart daily={data.daily} />
          </>
        )}
      </Panel>

      <Panel title="By track" desc="Your catalogue ranked by total streams (all time).">
        {data && data.perTrack.length === 0 && (
          <p style={{ color: 'var(--color-muted)' }}>No streams yet. Once visitors start playing your music, you'll see it here.</p>
        )}
        {data && data.perTrack.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.perTrack.map((t, i) => (
              <TrackRow key={t.id} rank={i + 1} track={t} max={data.perTrack[0].streams} />
            ))}
          </div>
        )}
      </Panel>
    </>
  )
}

/* ── Stat card ─────────────────────────────────────────────────────── */
function Stat({ label, value, hint, small }) {
  return (
    <div style={{
      padding: 16, borderRadius: 14, background: 'var(--color-bg)',
      border: '1px solid color-mix(in srgb, var(--text) 10%, transparent)',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 8 }}>{label}</div>
      <div style={{
        fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--color-text)',
        fontSize: small ? 18 : 30, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{value}</div>
      {hint && <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

/* ── Daily bar chart (pure CSS, no chart lib) ──────────────────────── */
function Chart({ daily }) {
  const max = Math.max(1, ...daily.map(d => d.streams))
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 2, height: 120,
        padding: '0 2px', borderBottom: '1px solid color-mix(in srgb, var(--text) 12%, transparent)',
      }}>
        {daily.map(d => (
          <div
            key={d.day}
            title={`${d.day} — ${d.streams} stream${d.streams === 1 ? '' : 's'}`}
            style={{
              flex: 1, minWidth: 0, borderRadius: '3px 3px 0 0',
              height: `${(d.streams / max) * 100}%`, minHeight: d.streams ? 3 : 0,
              background: d.streams
                ? 'linear-gradient(to top, color-mix(in srgb, var(--accent) 55%, transparent), var(--color-accent))'
                : 'transparent',
              transition: 'height 0.3s',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)' }}>
        <span>{shortDay(daily[0]?.day)}</span>
        <span>{shortDay(daily[daily.length - 1]?.day)}</span>
      </div>
    </div>
  )
}

/* ── Per-track row ─────────────────────────────────────────────────── */
function TrackRow({ rank, track, max }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 12,
      background: 'var(--color-bg)', border: '1px solid color-mix(in srgb, var(--text) 10%, transparent)',
      opacity: track.exists ? 1 : 0.55,
    }}>
      <span style={{ width: 22, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-muted)', flexShrink: 0 }}>{rank}</span>
      {track.coverArt
        ? <img src={track.coverArt} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
        : <div style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0, background: 'color-mix(in srgb, var(--text) 10%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>♪</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: 'var(--color-text)', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</p>
        <p style={{ color: 'var(--color-muted)', fontSize: 11, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {track.artist || '—'}{track.lastPlayed ? ` · last ${relTime(track.lastPlayed)}` : ''}
        </p>
        {/* mini bar */}
        <div style={{ height: 4, borderRadius: 2, marginTop: 6, background: 'color-mix(in srgb, var(--text) 10%, transparent)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(track.streams / max) * 100}%`, background: 'var(--color-accent)', borderRadius: 2 }} />
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 20, color: 'var(--color-text)', lineHeight: 1 }}>{fmt(track.streams)}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>streams</div>
      </div>
    </div>
  )
}

/* ── helpers ───────────────────────────────────────────────────────── */
function fmt(n) {
  return new Intl.NumberFormat().format(n ?? 0)
}
function shortDay(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00Z')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
}
function relTime(ms) {
  const s = Math.max(0, (Date.now() - ms) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`
  return new Date(ms).toLocaleDateString()
}
