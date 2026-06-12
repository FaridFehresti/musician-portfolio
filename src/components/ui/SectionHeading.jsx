/* Record-shop section divider: mono overline stamp + condensed headline,
   sitting on a shelf-rail rule. `right` slots actions (filters, links). */
export function SectionHeading({ overline, title, right }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4 border-b border-line pb-4">
      <div>
        {overline && (
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.3em] text-muted">
            {overline}
          </div>
        )}
        <h2 className="font-display text-3xl font-semibold uppercase tracking-wide text-text md:text-4xl">
          {title}
        </h2>
      </div>
      {right && <div className="shrink-0 pb-1">{right}</div>}
    </div>
  )
}
