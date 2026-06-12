import { Link } from 'react-router-dom'
import { useContentStore } from '../../store/contentStore'
import { SocialIcon } from '../icons/SocialIcons'

/* Back of the record sleeve: imprint, press links, socials, copyright. */
export function Footer() {
  const site = useContentStore((s) => s.site)
  const socials = useContentStore((s) => s.socials)
  const links = useContentStore((s) => s.links)

  return (
    <footer className="border-t border-line bg-bg-deep">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-3 md:px-6">
        <div>
          <div className="font-display text-lg font-semibold uppercase tracking-[0.22em] text-text">
            {site.artistName}
          </div>
          {site.tagline && (
            <p className="mt-2 font-serif text-sm italic text-muted">{site.tagline}</p>
          )}
        </div>

        <div>
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
            The shop
          </div>
          <div className="flex flex-col gap-2">
            <Link to="/records" className="font-body text-sm text-muted hover:text-accent">Records</Link>
            <Link to="/tapes" className="font-body text-sm text-muted hover:text-accent">Tape archive</Link>
            <Link to="/support" className="font-body text-sm text-muted hover:text-accent">Tip jar</Link>
            {links.map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="font-body text-sm text-muted hover:text-accent">
                {l.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
            Elsewhere
          </div>
          <div className="flex gap-3">
            {socials.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                title={s.label}
                className="flex h-9 w-9 items-center justify-center rounded-sm border border-line text-muted transition-colors hover:border-brass hover:text-accent"
              >
                <SocialIcon name={s.icon} size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-line/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            © {new Date().getFullYear()} {site.artistName}. All rights reserved.
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted/60">
            33⅓ RPM · Long play
          </span>
        </div>
      </div>
    </footer>
  )
}
