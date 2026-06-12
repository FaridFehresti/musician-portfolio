import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useContentStore } from '../../../store/contentStore'

const LINKS = [
  ['/library',     'Library'],
  ['/now-playing', 'Now Playing'],
  ['/about',       'About'],
  ['/donate',      'Support'],
]

export function Nav() {
  const location = useLocation()
  const site = useContentStore(s => s.site)
  const tracks = useContentStore(s => s.tracks)
  const hasVideos = tracks.some(t => t.video)
  const links = hasVideos
    ? [['/library', 'Library'], ['/videos', 'Videos'], ['/now-playing', 'Now Playing'], ['/about', 'About'], ['/donate', 'Support']]
    : LINKS
  const [scrolled, setScrolled] = useState(false)
  const [visible, setVisible]   = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const lastY = useRef(0)
  const menuRef = useRef(null)

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY
      setVisible(y < lastY.current || y < 60)
      setScrolled(y > 30)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    function onDoc(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])

  return (
    <motion.header
      animate={{ y: visible ? 0 : -72, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-10 h-16 flex items-center justify-between gap-2"
      style={{
        backdropFilter:       scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        background:           scrolled ? 'color-mix(in srgb, var(--color-surface) 90%, transparent)' : 'transparent',
        borderBottom:         scrolled ? '1px solid color-mix(in srgb, var(--accent-2) 14%, transparent)' : '1px solid transparent',
        transition:           'background 0.3s, border-color 0.3s',
      }}
    >
      {/* Brand — always the artist name (the logo lives in the hero only) */}
      <Link
        to="/"
        style={{
          display: 'flex', alignItems: 'center',
          fontFamily: 'var(--font-display)', fontStyle: 'italic',
          fontSize: 'clamp(15px, 4vw, 20px)', color: 'var(--color-accent)',
          textDecoration: 'none', letterSpacing: '-0.01em', whiteSpace: 'nowrap', flexShrink: 0,
        }}
      >
        {site.artistName || 'Artist Name'}
      </Link>

      {/* Right cluster */}
      <div className="flex items-center gap-1 sm:gap-2" ref={menuRef}>
        {/* Desktop links */}
        <nav className="hidden sm:flex items-center gap-1">
          {links.map(([to, label]) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className="relative px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                style={{ fontFamily: 'var(--font-body)', color: active ? 'var(--color-accent)' : 'var(--color-muted)', textDecoration: 'none', fontSize: 13 }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--color-text)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--color-muted)' }}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 22%, transparent)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menu"
          className="sm:hidden flex items-center justify-center rounded-lg"
          style={{ width: 34, height: 34, color: 'var(--color-text)', background: 'transparent', cursor: 'pointer', border: 'none' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            {menuOpen
              ? <><path d="M5 5l10 10" /><path d="M15 5L5 15" /></>
              : <><path d="M3 6h14" /><path d="M3 10h14" /><path d="M3 14h14" /></>}
          </svg>
        </button>

        {/* Mobile dropdown menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.16 }}
              className="sm:hidden"
              style={{
                position: 'absolute', top: 60, right: 12, width: 200, padding: 6, borderRadius: 12, zIndex: 60,
                background: 'var(--color-surface)',
                border: '1px solid color-mix(in srgb, var(--text) 14%, transparent)',
                boxShadow: '0 18px 46px rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)',
              }}
            >
              {links.map(([to, label]) => {
                const active = location.pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg"
                    style={{
                      padding: '10px 12px', textDecoration: 'none',
                      fontFamily: 'var(--font-body)', fontSize: 14,
                      color: active ? 'var(--color-accent)' : 'var(--color-text)',
                      background: active ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : 'transparent',
                    }}
                  >
                    {label}
                  </Link>
                )
              })}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}
