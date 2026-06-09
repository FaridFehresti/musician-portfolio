import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Panel, Toggle, Btn, Saver } from './ui'
import { useEditor } from './useEditor'
import { HOME_SLOTS, groupBySlot } from '../../lib/homeSlots'
import { TrackModal } from './TrackModal'

/* Music manager — add/edit tracks in a modal form, see the home deck
   arrangement at a glance, and assign each track to a home slot. */
export function MusicSection({ site, onSaved, onChanged }) {
  const [tracks, setTracks] = useState(null)
  const [modal, setModal] = useState(null)   // null | 'new' | trackObject
  const [stale, setStale] = useState(false)  // server silently ignored a field

  // Genre label per home pile (stored in site.homeSlots) — its own draft + save.
  const slots = useEditor('site', site, onSaved)
  const slotLabels = slots.draft.homeSlots || {}
  const setSlotLabel = (key, val) => slots.set({ homeSlots: { ...slotLabels, [key]: val } })

  useEffect(() => { api.getTracks().then(setTracks).catch(() => setTracks([])) }, [])

  const notify = () => onChanged?.()

  // Detect an outdated server: if we sent a field but it didn't round-trip,
  // the running API is stale (needs a clean restart) — surface it loudly.
  function checkStale(sent, saved) {
    for (const k of Object.keys(sent)) {
      if (saved[k] !== undefined && JSON.stringify(saved[k]) !== JSON.stringify(sent[k])) {
        setStale(true)
        return
      }
    }
  }

  async function patch(id, fields) {
    const saved = await api.updateTrack(id, fields)
    setTracks(ts => ts.map(t => (t.id === saved.id ? saved : t)))
    checkStale(fields, saved)
    notify()
  }
  async function remove(id) {
    if (!window.confirm('Delete this track? This cannot be undone.')) return
    await api.deleteTrack(id)
    setTracks(ts => ts.filter(t => t.id !== id))
    notify()
  }
  async function move(id, dir) {
    const idx = tracks.findIndex(t => t.id === id)
    const j = idx + dir
    if (j < 0 || j >= tracks.length) return
    const order = tracks.map(t => t.id)
    ;[order[idx], order[j]] = [order[j], order[idx]]
    setTracks(await api.reorderTracks(order))
    notify()
  }
  function onSaved(saved, isNew) {
    setTracks(ts => (isNew ? [...(ts || []), saved] : ts.map(t => (t.id === saved.id ? saved : t))))
    notify()
  }

  if (!tracks) return <Panel title="Music"><p style={{ color: 'var(--color-muted)' }}>Loading…</p></Panel>

  const { bySlot } = groupBySlot(tracks)

  return (
    <>
      {stale && (
        <div style={{
          marginBottom: 20, padding: '14px 18px', borderRadius: 12,
          background: 'color-mix(in srgb, #ff5470 14%, transparent)', border: '1px solid color-mix(in srgb, #ff5470 55%, transparent)',
          color: '#ff8a9c', fontSize: 13, lineHeight: 1.6,
        }}>
          <strong>The API server looks out of date.</strong> A change you saved didn’t persist, which means a stale Node
          process is still running. Stop the dev server, run <code>taskkill /IM node.exe /F</code>, then <code>pnpm run dev</code> again.
        </div>
      )}

      <Panel
        title="Home deck arrangement"
        desc="This is exactly how the home card piles are filled. Drag isn’t needed — set each track’s pile from the list below, or in its editor. Give a pile a genre name to label it on the home page."
        actions={<Saver onSave={slots.save} dirty={slots.dirty} saving={slots.saving} savedAt={slots.savedAt} />}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {HOME_SLOTS.map(s => (
            <div key={s.key} style={{
              borderRadius: 12, padding: 12, minHeight: 84,
              background: 'var(--color-bg)', border: '1px solid color-mix(in srgb, var(--text) 12%, transparent)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text)' }}>{s.label}</span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'var(--color-accent)', background: 'color-mix(in srgb, var(--accent) 14%, transparent)',
                  padding: '2px 7px', borderRadius: 999,
                }}>{s.kind}</span>
              </div>
              <input
                value={slotLabels[s.key] || ''}
                onChange={e => setSlotLabel(s.key, e.target.value)}
                placeholder="Genre label (optional)"
                aria-label={`${s.label} genre label`}
                style={{
                  width: '100%', marginBottom: 8, padding: '6px 9px', borderRadius: 8,
                  background: 'var(--color-surface)', color: 'var(--color-text)',
                  border: '1px solid color-mix(in srgb, var(--text) 14%, transparent)',
                  fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none',
                }}
              />
              {bySlot[s.key].length === 0
                ? <p style={{ color: 'var(--color-muted)', fontSize: 12, opacity: 0.6 }}>empty</p>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {bySlot[s.key].map((t, i) => (
                      <span key={t.id} style={{ fontSize: 12, color: t.published ? 'var(--color-text)' : 'var(--color-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {i + 1}. {t.title}{t.published ? '' : ' (hidden)'}
                      </span>
                    ))}
                  </div>
                )}
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="All tracks"
        desc="Upload, edit, reorder, and choose where each track appears."
        actions={<Btn onClick={() => setModal('new')}>+ Add track</Btn>}
      >
        {tracks.length === 0 && <p style={{ color: 'var(--color-muted)' }}>No tracks yet — add one above.</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tracks.map((t, i) => (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 12,
              border: '1px solid color-mix(in srgb, var(--text) 12%, transparent)', background: 'var(--color-bg)',
              opacity: t.published ? 1 : 0.6,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <button type="button" onClick={() => move(t.id, -1)} disabled={i === 0} style={miniBtn}>↑</button>
                <button type="button" onClick={() => move(t.id, 1)} disabled={i === tracks.length - 1} style={miniBtn}>↓</button>
              </div>
              <Thumb src={t.coverArt} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: 'var(--color-text)', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title || 'Untitled'}</p>
                <p style={{ color: 'var(--color-muted)', fontSize: 12, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.artist || '—'}{t.src ? '' : ' · no audio'}
                </p>
              </div>

              <SlotSelect value={t.homeSlot} onChange={v => patch(t.id, { homeSlot: v })} />

              <div style={{ display: 'flex', gap: 14, flexShrink: 0, alignItems: 'center' }}>
                <Toggle checked={t.inFeatured} onChange={v => patch(t.id, { inFeatured: v })} label="Featured" />
                <Toggle checked={t.inLibrary} onChange={v => patch(t.id, { inLibrary: v })} label="Library" />
              </div>
              <Btn variant="ghost" onClick={() => setModal(t)} style={{ flexShrink: 0 }}>Edit</Btn>
              <Btn variant="danger" onClick={() => remove(t.id)} style={{ flexShrink: 0 }}>Delete</Btn>
            </div>
          ))}
        </div>
      </Panel>

      {modal && (
        <TrackModal
          track={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={onSaved}
        />
      )}
    </>
  )
}

function SlotSelect({ value, onChange }) {
  const stacks = HOME_SLOTS.filter(s => s.kind === 'stack')
  const fans = HOME_SLOTS.filter(s => s.kind === 'fan')
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      title="Home deck pile"
      style={{
        flexShrink: 0, width: 130, padding: '7px 9px', borderRadius: 8, cursor: 'pointer',
        background: 'var(--color-surface)', color: value ? 'var(--color-accent)' : 'var(--color-muted)',
        border: `1px solid ${value ? 'color-mix(in srgb, var(--accent) 45%, transparent)' : 'color-mix(in srgb, var(--text) 14%, transparent)'}`,
        fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none',
      }}
    >
      <option value="">Not on home</option>
      <optgroup label="Stacks (top)">
        {stacks.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
      </optgroup>
      <optgroup label="Fans (bottom)">
        {fans.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
      </optgroup>
    </select>
  )
}

function Thumb({ src }) {
  return src
    ? <img src={src} alt="" style={{ width: 46, height: 46, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
    : <div style={{ width: 46, height: 46, borderRadius: 8, flexShrink: 0, background: 'color-mix(in srgb, var(--text) 10%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>♪</div>
}

const miniBtn = {
  width: 22, height: 20, lineHeight: '18px', cursor: 'pointer', padding: 0,
  background: 'transparent', border: '1px solid color-mix(in srgb, var(--text) 16%, transparent)',
  color: 'var(--color-muted)', fontSize: 11, borderRadius: 5, marginBottom: 2,
}
