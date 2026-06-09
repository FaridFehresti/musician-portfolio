import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import { useContentStore } from '../../store/contentStore'
import { useThemeStore } from '../../store/themeStore'
import { Btn } from './ui'
import { BrandingSection } from './BrandingSection'
import { MusicSection } from './MusicSection'
import { AnalyticsSection } from './AnalyticsSection'
import { AboutSection, SocialsSection, LinksSection, DonationSection } from './ContentSection'

const TABS = [
  ['branding', 'Branding'],
  ['music', 'Music'],
  ['analytics', 'Analytics'],
  ['about', 'About'],
  ['links', 'Socials & Links'],
  ['donate', 'Donations'],
]

export default function AdminApp() {
  const [phase, setPhase] = useState('checking')   // checking | login | ready
  const [content, setContent] = useState(null)
  const [tab, setTab] = useState('branding')
  const applyContent = useContentStore(s => s.applyContent)
  const setTheme = useThemeStore(s => s.setTheme)

  const loadContent = useCallback(async () => {
    const c = await api.content()
    setContent(c)
    if (c.site?.theme) setTheme(c.site.theme)
  }, [setTheme])

  useEffect(() => {
    api.session()
      .then(({ authed }) => {
        if (authed) { loadContent().then(() => setPhase('ready')) }
        else setPhase('login')
      })
      .catch(() => setPhase('login'))
  }, [loadContent])

  // Sections call this after a successful save — refresh admin + public stores.
  const onSaved = useCallback((c) => {
    setContent(c)
    applyContent(c)
  }, [applyContent])

  async function logout() {
    await api.logout()
    setPhase('login')
  }

  if (phase === 'checking') {
    return <Centered><p style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>Loading…</p></Centered>
  }
  if (phase === 'login') {
    return <Login onSuccess={() => loadContent().then(() => setPhase('ready'))} />
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* top bar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        padding: '14px 22px', background: 'color-mix(in srgb, var(--color-surface) 92%, transparent)',
        backdropFilter: 'blur(12px)', borderBottom: '1px solid color-mix(in srgb, var(--text) 12%, transparent)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 20, color: 'var(--color-accent)' }}>Studio CMS</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)' }}>{content?.site?.artistName}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/" target="_blank" rel="noreferrer"><Btn variant="ghost">View site ↗</Btn></a>
          <Btn variant="ghost" onClick={logout}>Log out</Btn>
        </div>
      </header>

      {/* tabs */}
      <nav style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '14px 22px 0', maxWidth: 920, margin: '0 auto' }}>
        {TABS.map(([id, label]) => {
          const active = tab === id
          return (
            <button
              key={id} onClick={() => setTab(id)}
              style={{
                padding: '8px 16px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12,
                background: active ? 'var(--color-accent)' : 'transparent',
                color: active ? 'var(--on-accent, #0a0a0a)' : 'var(--color-muted)',
                border: active ? 'none' : '1px solid color-mix(in srgb, var(--text) 16%, transparent)',
              }}
            >
              {label}
            </button>
          )
        })}
      </nav>

      <main style={{ maxWidth: 920, margin: '0 auto', padding: '22px' }}>
        {!content
          ? <p style={{ color: 'var(--color-muted)' }}>Loading content…</p>
          : (
            <>
              {tab === 'branding' && <BrandingSection site={content.site} onSaved={onSaved} />}
              {tab === 'music' && <MusicSection site={content.site} onSaved={onSaved} onChanged={() => useContentStore.getState().load()} />}
              {tab === 'analytics' && <AnalyticsSection />}
              {tab === 'about' && <AboutSection about={content.about} onSaved={onSaved} />}
              {tab === 'links' && (
                <>
                  <SocialsSection socials={content.socials} onSaved={onSaved} />
                  <LinksSection links={content.links} onSaved={onSaved} />
                </>
              )}
              {tab === 'donate' && <DonationSection donation={content.donation} onSaved={onSaved} />}
            </>
          )}
      </main>
    </div>
  )
}

/* ── Login ─────────────────────────────────────────────────────────── */
function Login({ onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      await api.login(username, password)
      onSuccess()
    } catch (e2) {
      setError(e2.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Centered>
      <form onSubmit={submit} style={{
        width: 340, padding: 30, borderRadius: 16, background: 'var(--color-surface)',
        border: '1px solid color-mix(in srgb, var(--text) 12%, transparent)', boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
      }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 28, color: 'var(--color-text)', marginBottom: 4 }}>Studio CMS</h1>
        <p style={{ color: 'var(--color-muted)', fontSize: 13, marginBottom: 22 }}>Sign in to manage your site.</p>

        <input
          autoFocus placeholder="Username" value={username} onChange={e => setUsername(e.target.value)}
          style={loginInput}
        />
        <input
          type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          style={{ ...loginInput, marginTop: 10 }}
        />
        {error && <p style={{ color: '#ff5470', fontSize: 13, marginTop: 12 }}>{error}</p>}
        <button type="submit" disabled={busy} style={{
          width: '100%', marginTop: 18, padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: 'var(--color-accent)', color: 'var(--on-accent, #0a0a0a)', fontFamily: 'var(--font-mono)',
          fontSize: 13, letterSpacing: '0.06em', opacity: busy ? 0.6 : 1,
        }}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </Centered>
  )
}

const loginInput = {
  width: '100%', padding: '11px 13px', borderRadius: 10,
  background: 'var(--color-bg)', color: 'var(--color-text)',
  border: '1px solid color-mix(in srgb, var(--text) 16%, transparent)',
  fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
}

function Centered({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {children}
    </div>
  )
}
