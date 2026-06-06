import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const LINKS = [
  ['/library',     'Library'],
  ['/now-playing', 'Now Playing'],
  ['/about',       'About'],
  ['/donate',      'Support'],
]

export function Nav() {
  const location = useLocation()
  const [scrolled, setScrolled]   = useState(false)
  const [visible, setVisible]     = useState(true)
  const lastY = useRef(0)

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

  return (
    <motion.header
      animate={{ y: visible ? 0 : -72, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-10 h-16 flex items-center justify-between"
      style={{
        backdropFilter:       scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        background:           scrolled ? 'rgba(10,10,10,0.88)' : 'transparent',
        borderBottom:         scrolled ? '1px solid rgba(0,229,255,0.1)' : '1px solid transparent',
        transition:           'background 0.3s, border-color 0.3s',
      }}
    >
      {/* Brand */}
      <Link
        to="/"
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 20,
          color: 'var(--color-accent)',
          textDecoration: 'none',
          letterSpacing: '-0.01em',
        }}
      >
        Artist Name
      </Link>

      {/* Links */}
      <nav className="flex items-center gap-1 sm:gap-2">
        {LINKS.map(([to, label]) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className="relative px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{
                fontFamily:  'var(--font-body)',
                color:       active ? 'var(--color-accent)' : 'var(--color-muted)',
                textDecoration: 'none',
                fontSize: 13,
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--color-text)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--color-muted)' }}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{label}</span>
            </Link>
          )
        })}
      </nav>
    </motion.header>
  )
}
