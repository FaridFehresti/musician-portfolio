import { Archive } from 'lucide-react'

export const CRATE = '__crate__'

/* Crate dividers: the kraft-card genre tabs sticking up out of a record
   crate. The active divider is pulled forward (paper face). */
export function GenreDividers({ genres, active, onChange, crateCount = 0 }) {
  const tabs = [...genres.map((g) => ({ id: g, label: g })), { id: CRATE, label: 'My crate', icon: true }]

  return (
    <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {tabs.map((t) => {
        const isActive = active === t.id
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-t-md border border-b-0 px-4 pb-2.5 pt-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-all ${
              isActive
                ? 'border-brass/50 bg-paper text-paper-ink shadow-[0_-2px_8px_rgba(0,0,0,0.3)]'
                : 'translate-y-1 border-line bg-surface text-muted hover:translate-y-0.5 hover:text-text'
            }`}
          >
            {t.icon && <Archive size={11} />}
            {t.label}
            {t.id === CRATE && crateCount > 0 && (
              <span className={`ml-0.5 ${isActive ? 'text-oxblood' : 'text-accent'}`}>({crateCount})</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
