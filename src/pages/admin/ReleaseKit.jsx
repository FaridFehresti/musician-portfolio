import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Area, Btn, Text, Uploader } from './ui'

export function ReleaseKit({ track, onClose, onSaved }) {
  const [kit, setKit] = useState(null)
  const [draft, setDraft] = useState(null)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    let live = true
    api.releaseKit(track.id).then(result => {
      if (live) { setKit(result); setDraft(result.fields) }
    }).catch(e => { if (live) setError(e.message) })
    return () => { live = false }
  }, [track.id])

  const dirty = !!kit && !!draft && Object.keys(kit.fields).some(key => draft[key] !== kit.fields[key])
  function close() {
    if (dirty && !window.confirm('Discard unsaved release kit changes?')) return
    onClose()
  }
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function edit(key, value) {
    setDraft(current => ({ ...current, [key]: value }))
    setError(null)
    setCopied('')
  }
  async function save() {
    setSaving(true); setError(null)
    try {
      const result = await api.saveReleaseKit(track.id, draft)
      setKit(result)
      setDraft(result.fields)
      onSaved?.(result.fields)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }
  async function copy(value, name) {
    if (!value) return
    try { await navigator.clipboard.writeText(value); setCopied(name) }
    catch { setError('Clipboard access failed. Select and copy the text manually.') }
  }

  const title = draft?.shareTitle.trim() || kit?.defaults.title || ''
  const description = draft?.shareDescription.trim() || ''
  const imagePath = draft?.shareImage.trim() || track.coverArt || ''
  const image = imagePath ? new URL(imagePath, window.location.origin).href : kit?.image
  const postTemplate = draft?.sharePostText.trim() || kit?.defaults.postText || ''
  const postText = kit?.url ? postTemplate.replaceAll('{url}', kit.url) : ''

  return <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    <section role="dialog" aria-modal="true" aria-label={`Release kit for ${track.title}`} onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', padding: 24, borderRadius: 16, background: 'var(--color-surface)', color: 'var(--color-text)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>Release kit</h2>
        <Btn variant="ghost" onClick={close}>Close</Btn>
      </div>
      {!kit && !error && <p>Loading release kit…</p>}
      {error && <p role="alert" style={{ color: '#ff8a9c', marginBottom: 12 }}>{error}</p>}
      {kit && draft && <>
        <p style={{ color: 'var(--color-muted)', fontSize: 12, marginBottom: 18 }}>Customize what appears when this track link is shared. Changes reach the public link after you save.</p>
        <Text label="Share title" value={draft.shareTitle} onChange={value => edit('shareTitle', value)} placeholder={kit.defaults.title} maxLength={160} hint="Leave empty to use the track title and artist." />
        <Area label="Share description" value={draft.shareDescription} onChange={value => edit('shareDescription', value)} rows={2} maxLength={500} hint="Optional. Leave empty to show no description." />
        <Uploader label="Share image" type="cover" accept="image/*" value={draft.shareImage} onChange={value => edit('shareImage', value)} hint="Optional. Leave empty to use the track cover." />
        <Area label="Suggested post text" value={draft.sharePostText} onChange={value => edit('sharePostText', value)} rows={3} maxLength={1000} placeholder={kit.defaults.postText} hint="Use {url} where the public track link should appear. Leave empty for the default text." />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <Btn onClick={save} disabled={!dirty || saving}>{saving ? 'Saving…' : 'Save release kit'}</Btn>
          {dirty && <span style={{ color: 'var(--color-muted)', fontSize: 12 }}>Unsaved changes</span>}
          {!dirty && <span style={{ color: 'var(--color-muted)', fontSize: 12 }}>Saved</span>}
        </div>
        <p style={{ color: 'var(--color-muted)', fontSize: 12, marginBottom: 10 }}>Share preview{dirty ? ' · unsaved' : ''}</p>
        <div style={{ border: '1px solid color-mix(in srgb, var(--text) 20%, transparent)', borderRadius: 12, overflow: 'hidden', background: 'var(--color-bg)' }}>
          {image && <img src={image} alt={`${track.title} share cover`} style={{ width: '100%', height: 220, objectFit: 'cover' }} />}
          <div style={{ padding: 16 }}>
            <strong style={{ fontSize: 17 }}>{title}</strong>
            {description && <p style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: 5 }}>{description}</p>}
            <small style={{ color: 'var(--color-accent)', overflowWrap: 'anywhere' }}>{kit.url || 'Unpublished · no public link yet'}</small>
          </div>
        </div>
        {!kit.published && <p style={{ color: '#ffbd70', fontSize: 12, marginTop: 14 }}>Publish this track before sharing its link.</p>}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
          <Btn disabled={!kit.published} onClick={() => copy(kit.url, 'link')}>{copied === 'link' ? 'Link copied ✓' : 'Copy track link'}</Btn>
          <Btn variant="ghost" disabled={!kit.published || dirty} onClick={() => copy(postText, 'post')}>{copied === 'post' ? 'Post text copied ✓' : 'Copy post text'}</Btn>
        </div>
        {kit.url && <textarea readOnly value={postText} aria-label="Post text preview" style={{ width: '100%', minHeight: 68, marginTop: 12, padding: 10, borderRadius: 8, background: 'var(--color-bg)', color: 'var(--color-text)' }} />}
      </>}
    </section>
  </div>
}
