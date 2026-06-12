const TONES = {
  ink:     'border-line text-muted',
  amber:   'border-accent/60 text-accent',
  oxblood: 'border-oxblood/70 text-oxblood',
  paper:   'border-paper-ink/40 text-paper-ink/80',
}

/* Rubber-stamp chip: bordered uppercase mono, slightly imperfect by way of a
   tiny rotation. Used for genres, pressing info, "side A" labels. */
export function StampTag({ children, tone = 'ink', tilt = false }) {
  return (
    <span
      className={`inline-block border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${TONES[tone] ?? TONES.ink} ${tilt ? '-rotate-2' : ''}`}
    >
      {children}
    </span>
  )
}
