import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import { useContentStore } from '../../store/contentStore'
import { useThemeStore } from '../../store/themeStore'
import { Activity, ArrowUpRight, Disc3, Heart, Link2, LogOut, Palette, UserRound } from 'lucide-react'
import './admin.css'
import { BrandingSection } from './BrandingSection'
import { MusicSection } from './MusicSection'
import { AnalyticsSection } from './AnalyticsSection'
import { AboutSection, SocialsSection, LinksSection, DonationSection } from './ContentSection'

const TABS = [
  { id: 'analytics', label: 'Analytics', icon: Activity, summary: 'Audience and growth' },
  { id: 'music', label: 'Music', icon: Disc3, summary: 'Tracks and releases' },
  { id: 'branding', label: 'Appearance', icon: Palette, summary: 'Brand and site style' },
  { id: 'about', label: 'About', icon: UserRound, summary: 'Your story' },
  { id: 'links', label: 'Links', icon: Link2, summary: 'Socials and destinations' },
  { id: 'donate', label: 'Support', icon: Heart, summary: 'Donations' },
]

export default function AdminApp() {
  const [phase, setPhase] = useState('checking')   // checking | login | ready
  const [content, setContent] = useState(null)
  const [tab, setTab] = useState('analytics')
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

  const activeTab = TABS.find(item => item.id === tab)
  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-brand"><div className="admin-brand-mark">S</div><div><strong>Studio</strong><span>YOUR CONTROL ROOM</span></div></div>
        <div className="admin-artist"><span className="admin-artist-avatar">{content?.site?.artistName?.[0] || 'A'}</span><span><strong>{content?.site?.artistName || 'Artist'}</strong><small>Artist workspace</small></span></div>
        <div className="admin-nav-caption">WORKSPACE</div>
        <nav className="admin-nav" aria-label="Admin sections">
          {TABS.map(({ id, label, icon: Icon }) => <button type="button" key={id} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined}>
            <Icon size={19} strokeWidth={1.8} /><span>{label}</span>{tab === id && <i />}
          </button>)}
        </nav>
        <div className="admin-sidebar-footer">
          <a href="/" target="_blank" rel="noreferrer"><ArrowUpRight size={17} /> View public site</a>
          <button type="button" onClick={logout}><LogOut size={17} /> Log out</button>
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar"><span>STUDIO / {activeTab?.label.toUpperCase()}</span><a href="/" target="_blank" rel="noreferrer">View site <ArrowUpRight size={16} /></a></header>
        <nav className="admin-mobile-nav" aria-label="Admin sections">
          {TABS.map(({ id, label, icon: Icon }) => <button type="button" key={id} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined}><Icon size={17} />{label}</button>)}
        </nav>
        <main className={`admin-main ${tab === 'analytics' ? 'admin-main-wide' : ''}`}>
          {tab !== 'analytics' && <div className="admin-section-intro"><span className="admin-eyebrow">{activeTab?.summary}</span><h1>{activeTab?.label}</h1></div>}
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
