import { useContentStore } from '../store/contentStore'
import { AnalogButton } from '../components/ui/AnalogButton'

/* The Tip Jar — a letterpress poster tacked up by the register. */
export default function Support() {
  const donation = useContentStore((s) => s.donation)

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <div className="poster overflow-hidden rounded-md p-8 text-center md:p-14">
        <div className="relative z-[2]">
          <div className="mb-6 font-mono text-[10px] uppercase tracking-[0.35em] text-muted">
            By the register
          </div>
          <h1 className="font-display text-4xl font-bold uppercase leading-tight tracking-wide text-text md:text-5xl">
            {donation.heading}
          </h1>
          <p className="mx-auto mt-6 max-w-xl font-serif text-base italic leading-relaxed text-muted">
            {donation.subtext}
          </p>

          {/* why it matters — stamped cards */}
          {donation.why?.length > 0 && (
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {donation.why.map((w) => (
                <div
                  key={w.title}
                  className="border border-line bg-bg-deep/30 p-5 odd:-rotate-1 even:rotate-1"
                >
                  <div className="text-2xl">{w.icon}</div>
                  <div className="mt-3 font-display text-sm font-semibold uppercase tracking-[0.12em] text-text">
                    {w.title}
                  </div>
                  <p className="mt-2 font-body text-xs leading-relaxed text-muted">{w.text}</p>
                </div>
              ))}
            </div>
          )}

          {donation.checkyaUrl && (
            <div className="mt-12">
              <AnalogButton as="a" href={donation.checkyaUrl} target="_blank" rel="noreferrer">
                {donation.buttonLabel || 'Leave a tip'}
              </AnalogButton>
            </div>
          )}

          {donation.note && (
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted/70">
              {donation.note}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
