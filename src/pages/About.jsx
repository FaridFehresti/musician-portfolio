import { useContentStore } from '../store/contentStore'
import { StampTag } from '../components/ui/StampTag'
import { SocialIcon } from '../components/icons/SocialIcons'

/* Liner Notes — the about page set like the inside of a gatefold sleeve:
   aged dark cardstock, serif pull-quote, a taped-in print photo, two-column
   notes. The panel takes on the active theme's tone. */
export default function About() {
  const about = useContentStore((s) => s.about)
  const links = useContentStore((s) => s.links)
  const socials = useContentStore((s) => s.socials)

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-6">
      <div className="poster overflow-hidden rounded-md p-8 md:p-14">
        <div className="relative z-[2]">
          {/* label stamp */}
          <div className="mb-10 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-muted">
              {about.label}
            </span>
            <span className="hidden -rotate-3 border border-oxblood/60 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-oxblood sm:block">
              Original pressing
            </span>
          </div>

          <div className="grid gap-10 md:grid-cols-[1fr_auto]">
            <blockquote className="font-serif text-3xl italic leading-snug text-text md:text-4xl">
              “{about.quote}”
            </blockquote>

            {about.portraitUrl && (
              <div className="relative mx-auto shrink-0">
                {/* tape strip */}
                <span className="absolute -top-3 left-1/2 z-[3] h-6 w-20 -translate-x-1/2 -rotate-2 bg-paper/15 backdrop-blur-[1px]" />
                <img
                  src={about.portraitUrl}
                  alt="Artist portrait"
                  className="relative z-[2] h-52 w-52 -rotate-1 border-8 border-paper object-cover shadow-[0_18px_32px_rgba(0,0,0,0.5)] md:h-64 md:w-64"
                />
              </div>
            )}
          </div>

          {/* the notes */}
          <div className="mt-12 border-t border-line pt-10 font-body text-[15px] leading-relaxed text-text/85 md:columns-2 md:gap-10">
            {about.bio.map((para, i) => (
              <p key={i} className="mb-5 break-inside-avoid">
                {para}
              </p>
            ))}
          </div>

          {/* genre stamps */}
          {about.genres?.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {about.genres.map((g) => (
                <StampTag key={g} tone="amber">{g}</StampTag>
              ))}
            </div>
          )}

          {/* press / stockists */}
          {links.length > 0 && (
            <div className="mt-12 border-t border-line pt-8">
              <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
                Press &amp; stockists
              </div>
              <div className="flex flex-col gap-2">
                {links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="w-fit border-b border-line font-serif text-sm text-muted hover:border-brass hover:text-accent"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* socials */}
          {socials.length > 0 && (
            <div className="mt-12 flex items-center gap-3 border-t border-line pt-8">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
                Elsewhere
              </span>
              <div className="flex gap-2">
                {socials.map((s) => (
                  <a
                    key={s.href}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    title={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-sm border border-line text-muted transition-colors hover:border-brass hover:text-accent"
                  >
                    <SocialIcon name={s.icon} size={15} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
