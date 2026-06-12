/* Chunky console transport key — bakelite with a brass rim when primary. */
export function TransportButton({ primary = false, label, onClick, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex items-center justify-center rounded-sm border transition-all duration-100 active:translate-y-px ${
        primary
          ? 'h-11 w-11 border-accent bg-accent text-on-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_5px_rgba(0,0,0,0.5)] hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.35)]'
          : 'h-9 w-9 border-line bg-surface-2 text-muted shadow-[inset_0_1px_0_rgba(236,226,207,0.07),0_2px_4px_rgba(0,0,0,0.4)] hover:text-text hover:border-brass/60 active:shadow-[inset_0_2px_3px_rgba(0,0,0,0.45)]'
      } ${className}`}
    >
      {children}
    </button>
  )
}
