import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Play } from 'lucide-react'
import { useContentStore } from '../store/contentStore'
import { usePlayFrom } from '../hooks/usePlayFrom'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { AnalogButton } from '../components/ui/AnalogButton'
import { SectionHeading } from '../components/ui/SectionHeading'
import { StampTag } from '../components/ui/StampTag'
import { Shelf } from '../components/records/Shelf'
import { fmtDuration } from '../data/tracks'

/* Front of House — the shop window: hero signage, the record on the platter
   today, the featured wall, a glimpse of the liner notes, and the tip jar. */
export default function Home() {
  const site = useContentStore((s) => s.site)
  const about = useContentStore((s) => s.about)
  const donation = useContentStore((s) => s.donation)
  const tracks = useContentStore((s) => s.tracks)
  const navigate = useNavigate()
  const reduced = usePrefersReducedMotion()

  const heroTracks = useMemo(
    () => tracks.filter((t) => t.inHero && t.published !== false),
    [tracks]
  )
  const featured = useMemo(
    () => tracks.filter((t) => t.inFeatured && t.published !== false).slice(0, 8),
    [tracks]
  )
  const spotlight = heroTracks[0] ?? featured[0] ?? null

  const playHero = usePlayFrom(heroTracks.length ? heroTracks : featured)
  const playFeatured = usePlayFrom(featured)

  function dropTheNeedle() {
    if (!spotlight) return
    playHero(spotlight)
    navigate('/turntable')
  }

  return (
    <div>
      {/* ── Hero: the shop sign ─────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-line">
        {/* oversized record rolling off-stage */}
        <div
          className="grooves absolute -right-[20%] top-1/2 hidden aspect-square w-[55%] -translate-y-1/2 rounded-full border border-black/60 opacity-50 md:block"
          style={reduced ? undefined : { animation: 'spin33 80s linear infinite' }}
          aria-hidden="true"
        >
          <div className="absolute left-1/2 top-1/2 h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-oxblood/80" />
        </div>

        <div className="relative z-[2] mx-auto max-w-7xl px-4 py-24 md:px-6 md:py-36">
          <div className="mb-5 font-mono text-[11px] uppercase tracking-[0.35em] text-accent">
            Est. on tape · Pressed on vinyl
          </div>
          <h1 className="max-w-3xl font-display text-5xl font-bold uppercase leading-[0.95] tracking-wide text-text sm:text-7xl md:text-8xl">
            {site.artistName}
          </h1>
          {site.tagline && (
            <p className="mt-6 max-w-xl font-serif text-lg italic text-muted md:text-xl">
              {site.tagline}
            </p>
          )}
          <div className="mt-10 flex flex-wrap gap-4">
            <AnalogButton onClick={dropTheNeedle}>
              <Play size={14} /> Drop the needle
            </AnalogButton>
            <AnalogButton variant="outline" as={Link} to="/records">
              Browse the records
            </AnalogButton>
          </div>
        </div>
      </section>

      {/* ── On the platter ──────────────────────────────────────────── */}
      {spotlight && (
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <SectionHeading overline="Today's pick" title="On the Platter" />
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="group relative mx-auto w-full max-w-md">
              <div
                className="grooves absolute inset-0 rounded-full border border-bg-deep transition-transform duration-500 md:group-hover:translate-x-[14%]"
                aria-hidden="true"
              >
                <div className="absolute left-1/2 top-1/2 h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-oxblood" />
              </div>
              <div className="ring-wear noise-overlay relative aspect-square overflow-hidden rounded-sm border border-line bg-surface-2 shadow-[0_24px_32px_-18px_rgba(0,0,0,0.85)] transition-transform duration-500 md:group-hover:-translate-x-[5%]">
                {spotlight.coverArt ? (
                  <img src={spotlight.coverArt} alt={`${spotlight.title} cover art`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center p-8 text-center">
                    <span className="font-serif text-2xl italic text-muted">{spotlight.title}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                {spotlight.genre && <StampTag tone="amber">{spotlight.genre}</StampTag>}
                {spotlight.year ? <StampTag>{spotlight.year}</StampTag> : null}
                <StampTag>{fmtDuration(spotlight.duration)}</StampTag>
              </div>
              <h3 className="font-serif text-3xl text-text md:text-4xl">{spotlight.title}</h3>
              {spotlight.artist && (
                <div className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">
                  {spotlight.artist}
                </div>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <AnalogButton onClick={dropTheNeedle}>
                  <Play size={14} /> Play this record
                </AnalogButton>
                <AnalogButton variant="ghost" as={Link} to={`/track/${encodeURIComponent(spotlight.id)}`}>
                  Liner notes <ArrowRight size={14} />
                </AnalogButton>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Featured pressings ──────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="border-t border-line bg-surface/30">
          <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
            <SectionHeading
              overline="Staff picks"
              title="Featured Pressings"
              right={
                <Link
                  to="/records"
                  className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted hover:text-accent"
                >
                  Full shelf →
                </Link>
              }
            />
            <Shelf tracks={featured} onPlay={playFeatured} />
          </div>
        </section>
      )}

      {/* ── Liner-notes teaser ──────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="paper overflow-hidden rounded-md p-8 md:p-12">
          <div className="relative z-[2] grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-paper-ink/60">
                {about.label}
              </div>
              <blockquote className="max-w-2xl font-serif text-2xl italic leading-snug text-paper-ink md:text-3xl">
                “{about.quote}”
              </blockquote>
              <Link
                to="/about"
                className="mt-6 inline-block border-b border-paper-ink/40 pb-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-paper-ink/80 hover:border-paper-ink hover:text-paper-ink"
              >
                Read the liner notes
              </Link>
            </div>
            {about.portraitUrl && (
              <img
                src={about.portraitUrl}
                alt="Artist portrait"
                className="relative z-[2] h-44 w-44 rotate-2 rounded-sm border-4 border-paper object-cover shadow-[0_12px_24px_rgba(34,27,18,0.4)] md:h-56 md:w-56"
              />
            )}
          </div>
        </div>
      </section>

      {/* ── Tip jar strip ───────────────────────────────────────────── */}
      <section className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 py-14 text-center md:px-6">
          <h3 className="font-display text-2xl font-semibold uppercase tracking-wide text-text">
            {donation.heading}
          </h3>
          <p className="max-w-xl font-serif text-sm italic text-muted">{donation.subtext}</p>
          <AnalogButton variant="outline" as={Link} to="/support">
            Visit the tip jar
          </AnalogButton>
        </div>
      </section>
    </div>
  )
}
