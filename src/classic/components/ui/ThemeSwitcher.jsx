import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '../../../store/themeStore'
import { THEME_OPTIONS_CLASSIC as THEMES } from '../../../lib/defaults'

export function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  /* Keep the <html> attribute in sync (covers dev HMR / first mount). */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!open) return
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  const cur = THEMES.find(t => t.id === theme) || THEMES[3]

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Change theme"
        title="Theme"
        className="flex items-center justify-center rounded-full"
        style={{
          width: 32, height: 32, cursor: 'pointer',
          background: 'var(--color-surface)',
          border: '1px solid color-mix(in srgb, var(--accent-2) 35%, transparent)',
        }}
      >
        <span style={{ width: 15, height: 15, borderRadius: '50%', background: `conic-gradient(from 210deg, ${cur.a}, ${cur.b}, ${cur.a})`, boxShadow: 'inset 0 0 0 1.5px var(--color-surface)' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            style={{
              position: 'absolute', right: 0, top: 42, width: 190, padding: 6, borderRadius: 12, zIndex: 60,
              background: 'var(--color-surface)',
              border: '1px solid color-mix(in srgb, var(--text) 14%, transparent)',
              boxShadow: '0 18px 46px rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)',
            }}
          >
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-muted)', padding: '4px 10px 6px' }}>
              Theme
            </p>
            {THEMES.map(t => {
              const active = t.id === theme
              return (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); setOpen(false) }}
                  className="flex items-center gap-3 w-full rounded-lg"
                  style={{
                    padding: '8px 10px', border: 'none', textAlign: 'left', cursor: 'pointer',
                    background: active ? 'color-mix(in srgb, var(--accent) 16%, transparent)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'color-mix(in srgb, var(--text) 7%, transparent)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ display: 'flex', flexShrink: 0, alignItems: 'center' }}>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', background: t.bg, border: '1px solid rgba(255,255,255,0.25)' }} />
                    <span style={{ width: 16, height: 16, borderRadius: '50%', background: t.a, marginLeft: -6, border: '1px solid rgba(0,0,0,0.2)' }} />
                    <span style={{ width: 16, height: 16, borderRadius: '50%', background: t.b, marginLeft: -6, border: '1px solid rgba(0,0,0,0.2)' }} />
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.04em', color: active ? 'var(--color-accent)' : 'var(--color-text)' }}>
                    {t.label}
                  </span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
