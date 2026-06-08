import { useState } from 'react'
import { api } from '../../lib/api'
import { Text, Uploader, Toggle, Btn, Field } from './ui'
import { HOME_SLOTS } from '../../lib/homeSlots'

/* Full add / edit form for one track, shown as a modal. Nothing is written
   until "Save". */

const BLANK = {
  title: '', artist: '', album: '', genre: '', bpm: 0, year: 0,
  video: '', src: '', coverArt: '',
  homeSlot: '', inFeatured: true, inLibrary: true, published: true,
}

const stacks = HOME_SLOTS.filter(s => s.kind === 'stack')
const fans   = HOME_SLOTS.filter(s => s.kind === 'fan')

export function TrackModal({ track, onClose, onSaved }) {
  const isNew = !track?.id
  const [d, setD] = useState({ ...BLANK, ...(track || {}) })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)
  const set = (patch) => setD(p => ({ ...p, ...patch }))

  async function save() {
    if (!d.title.trim()) { setErr('Please enter a title.'); return }
    setSaving(true); setErr(null)
    try {
      const saved = isNew ? await api.createTrack(d) : await api.updateTrack(track.id, d)
      onSaved(saved, isNew)
      onClose()
    } catch (e) {
      setErr(e.message || 'Could not save')
      setSaving(false)
    }
  }

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <header style={head}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, color: 'var(--color-text)' }}>
            {isNew ? 'Add track' : 'Edit track'}
          </h2>
          <button onClick={onClose} aria-label="Close" style={closeBtn}>✕</button>
        </header>

        <div style={{ padding: '20px 22px', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Uploader label="Audio file" type="audio" accept="audio/*" value={d.src} onChange={url => set({ src: url })} hint="MP3 / WAV / OGG." />
            <Uploader label="Cover image" type="cover" accept="image/*" value={d.coverArt} onChange={url => set({ coverArt: url })} />
            <Text label="Title *" value={d.title} onChange={v => set({ title: v })} placeholder="Song title" />
            <Text label="Artist" value={d.artist} onChange={v => set({ artist: v })} />
            <Text label="Album" value={d.album} onChange={v => set({ album: v })} />
            <Text label="Genre" value={d.genre} onChange={v => set({ genre: v })} hint="Used by the library filters." />
            <Text label="BPM" type="number" value={d.bpm} onChange={v => set({ bpm: Number(v) || 0 })} />
            <Text label="Year" type="number" value={d.year} onChange={v => set({ year: Number(v) || 0 })} />
          </div>
          <Text label="Music video URL (optional)" value={d.video} onChange={v => set({ video: v })} placeholder="https://youtube.com/watch?v=…" />

          <Field label="Home deck placement" hint="Pick which card pile this track sits in on the home page (or keep it off the home deck).">
            <select value={d.homeSlot || ''} onChange={e => set({ homeSlot: e.target.value })} style={selectStyle}>
              <option value="">— Not on the home deck —</option>
              <optgroup label="Stacks (top row)">
                {stacks.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </optgroup>
              <optgroup label="Fans (bottom row)">
                {fans.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </optgroup>
            </select>
          </Field>

          <Field label="Also show in">
            <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
              <Toggle checked={d.inFeatured} onChange={v => set({ inFeatured: v })} label="Featured row (home)" />
              <Toggle checked={d.inLibrary} onChange={v => set({ inLibrary: v })} label="Library page" />
              <Toggle checked={d.published} onChange={v => set({ published: v })} label="Published" />
            </div>
          </Field>

          {err && <p style={{ color: '#ff5470', fontSize: 13, marginTop: 4 }}>{err}</p>}
        </div>

        <footer style={foot}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : (isNew ? 'Add track' : 'Save changes')}</Btn>
        </footer>
      </div>
    </div>
  )
}

const overlay = {
  position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
  padding: '40px 16px', overflowY: 'auto',
}
const sheet = {
  width: '100%', maxWidth: 640, maxHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column',
  background: 'var(--color-surface)', borderRadius: 16,
  border: '1px solid color-mix(in srgb, var(--text) 12%, transparent)', boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
}
const head = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px',
  borderBottom: '1px solid color-mix(in srgb, var(--text) 10%, transparent)',
}
const foot = {
  display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 22px',
  borderTop: '1px solid color-mix(in srgb, var(--text) 10%, transparent)',
}
const closeBtn = {
  width: 32, height: 32, borderRadius: 8, cursor: 'pointer', flexShrink: 0,
  background: 'var(--color-bg)', border: '1px solid color-mix(in srgb, var(--text) 14%, transparent)',
  color: 'var(--color-muted)', fontSize: 14,
}
const selectStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
  background: 'var(--color-bg)', color: 'var(--color-text)',
  border: '1px solid color-mix(in srgb, var(--text) 14%, transparent)',
  fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
}
