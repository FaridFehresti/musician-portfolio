import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useContentStore } from '../../store/contentStore'

const LINKS = [
  { to: '/records', label: 'Records' },
  { to: '/turntable', label: 'Turntable' },
  { to: '/tapes', label: 'Tapes' },
  { to: '/about', label: 'About' },
  { to: '/support', label: 'Support' },
]

function navClass({ isActive }) {
  return `font-display text-sm font-medium uppercase tracking-[0.18em] transition-colors ${
    isActive ? 'text-accent' : 'text-muted hover:text-text'
  }`
}

/* Shop signage: artist logotype on the left, departments on the right. */
export function Nav() {
  const site = useContentStore((s) => s.site)
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          {site.logoUrl ? (
            <img src={site.logoUrl} alt={site.artistName} className="h-9 w-auto" />
          ) : (
            <span className="font-display text-xl font-semibold uppercase tracking-[0.22em] text-text">
              {site.artistName}
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={navClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-sm border border-line text-muted md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-line bg-bg-deep md:hidden">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block border-b border-line/50 px-6 py-4 font-display text-base uppercase tracking-[0.18em] ${
                  isActive ? 'text-accent' : 'text-muted'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
