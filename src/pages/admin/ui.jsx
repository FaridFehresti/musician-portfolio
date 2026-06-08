import { useState } from 'react'
import { api } from '../../lib/api'

/* Shared CMS form primitives. Inline-styled with the theme tokens so the
   admin panel re-themes along with the rest of the site. */

export function Panel({ title, desc, actions, children }) {
  return (
    <section style={{
      background: 'var(--color-surface)', borderRadius: 16, padding: 22,
      border: '1px solid color-mix(in srgb, var(--text) 10%, transparent)',
      boxShadow: '0 12px 32px rgba(0,0,0,0.18)', marginBottom: 22,
    }}>
      {(title || actions) && (
        <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: desc ? 6 : 18 }}>
          <div>
            {title && <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, color: 'var(--color-text)' }}>{title}</h2>}
          </div>
          {actions}
        </header>
      )}
      {desc && <p style={{ color: 'var(--color-muted)', fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>{desc}</p>}
      {children}
    </section>
  )
}

const labelStyle = {
  display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10,
  letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 7,
}
const fieldBase = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  background: 'var(--color-bg)', color: 'var(--color-text)',
  border: '1px solid color-mix(in srgb, var(--text) 14%, transparent)',
  fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
}

export function Field({ label, hint, children }) {
  return (
    <label style={{ display: 'block', marginBottom: 16 }}>
      {label && <span style={labelStyle}>{label}</span>}
      {children}
      {hint && <span style={{ display: 'block', marginTop: 5, fontSize: 11, color: 'var(--color-muted)', opacity: 0.8 }}>{hint}</span>}
    </label>
  )
}

export function Text({ label, hint, value, onChange, ...rest }) {
  return (
    <Field label={label} hint={hint}>
      <input style={fieldBase} value={value ?? ''} onChange={e => onChange(e.target.value)} {...rest} />
    </Field>
  )
}

export function Area({ label, hint, value, onChange, rows = 4, ...rest }) {
  return (
    <Field label={label} hint={hint}>
      <textarea style={{ ...fieldBase, resize: 'vertical', lineHeight: 1.6 }} rows={rows} value={value ?? ''} onChange={e => onChange(e.target.value)} {...rest} />
    </Field>
  )
}

export function Btn({ children, onClick, variant = 'primary', disabled, type = 'button', style }) {
  const variants = {
    primary: { background: 'var(--color-accent)', color: 'var(--on-accent, #0a0a0a)', border: 'none' },
    ghost:   { background: 'transparent', color: 'var(--color-text)', border: '1px solid color-mix(in srgb, var(--text) 22%, transparent)' },
    danger:  { background: 'transparent', color: '#ff5470', border: '1px solid color-mix(in srgb, #ff5470 50%, transparent)' },
  }
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      style={{
        padding: '9px 18px', borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.06em',
        opacity: disabled ? 0.5 : 1, transition: 'opacity 0.15s, transform 0.1s',
        ...variants[variant], ...style,
      }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)' }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      {children}
    </button>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button" onClick={() => onChange(!checked)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
        cursor: 'pointer', padding: 0, color: 'var(--color-text)', fontSize: 12, fontFamily: 'var(--font-mono)',
      }}
    >
      <span style={{
        width: 38, height: 22, borderRadius: 999, flexShrink: 0, position: 'relative',
        background: checked ? 'var(--color-accent)' : 'color-mix(in srgb, var(--text) 22%, transparent)',
        transition: 'background 0.18s',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: checked ? 18 : 2, width: 18, height: 18, borderRadius: '50%',
          background: '#fff', transition: 'left 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }} />
      </span>
      {label}
    </button>
  )
}

/* File uploader → posts to /api/admin/upload and returns the served URL. */
export function Uploader({ label, hint, type, value, onChange, accept, preview = true }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const isImage = preview && value && /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(value)
  const isAudio = value && /\.(mp3|wav|ogg|m4a|flac)$/i.test(value)

  async function pick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true); setErr(null)
    try {
      const { url } = await api.upload(type, file)
      onChange(url)
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  return (
    <Field label={label} hint={hint}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        {isImage && (
          <img src={value} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10, border: '1px solid color-mix(in srgb, var(--text) 14%, transparent)' }} />
        )}
        {isAudio && <span style={{ fontSize: 22 }}>🎵</span>}
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10,
          cursor: busy ? 'wait' : 'pointer', background: 'var(--color-bg)',
          border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)',
          color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', fontSize: 12,
        }}>
          {busy ? 'Uploading…' : (value ? 'Replace file' : 'Upload file')}
          <input type="file" accept={accept} onChange={pick} disabled={busy} style={{ display: 'none' }} />
        </label>
        {value && (
          <button type="button" onClick={() => onChange('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            clear
          </button>
        )}
      </div>
      {value && <code style={{ display: 'block', marginTop: 8, fontSize: 11, color: 'var(--color-muted)', wordBreak: 'break-all' }}>{value}</code>}
      {err && <span style={{ display: 'block', marginTop: 6, fontSize: 12, color: '#ff5470' }}>{err}</span>}
    </Field>
  )
}

export function Saver({ onSave, dirty, saving, savedAt }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {savedAt && !dirty && <span style={{ fontSize: 12, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>Saved ✓</span>}
      <Btn onClick={onSave} disabled={saving || !dirty}>{saving ? 'Saving…' : 'Save changes'}</Btn>
    </div>
  )
}
