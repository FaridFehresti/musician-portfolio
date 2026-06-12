const VARIANTS = {
  /* amber bakelite — the primary action */
  solid:
    'bg-accent text-on-accent border border-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_6px_rgba(0,0,0,0.45)] hover:brightness-110 active:translate-y-px active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.35)]',
  /* brass-trimmed walnut — secondary */
  outline:
    'bg-surface text-text border border-brass/60 shadow-[0_2px_6px_rgba(0,0,0,0.35)] hover:border-brass hover:text-text active:translate-y-px',
  /* bare label — tertiary */
  ghost:
    'bg-transparent text-muted border border-transparent hover:text-text hover:border-line',
}

export function AnalogButton({ variant = 'solid', as: Tag = 'button', className = '', children, ...rest }) {
  return (
    <Tag
      className={`inline-flex items-center justify-center gap-2 rounded-sm px-5 py-2.5 font-display text-sm font-medium uppercase tracking-[0.14em] transition-all duration-150 ${VARIANTS[variant] ?? VARIANTS.solid} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}
