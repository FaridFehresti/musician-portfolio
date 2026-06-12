import { Archive, Check } from 'lucide-react'
import { useFavoritesStore } from '../../store/favoritesStore'

/* "My Crate" toggle — the analog take on a like button. Reads/writes the
   long-lived favorites store (localStorage), so crates survive reloads and
   hearts collected in the old version carry over. */
export function CrateToggle({ trackId, compact = false }) {
  const inCrate = useFavoritesStore((s) => s.ids.includes(trackId))
  const toggle = useFavoritesStore((s) => s.toggle)

  if (compact) {
    return (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(trackId) }}
        title={inCrate ? 'Remove from my crate' : 'Add to my crate'}
        aria-pressed={inCrate}
        className={`flex h-8 w-8 items-center justify-center rounded-sm border transition-colors ${
          inCrate
            ? 'border-accent bg-accent/15 text-accent'
            : 'border-line bg-bg-deep/60 text-muted hover:border-brass hover:text-text'
        }`}
      >
        {inCrate ? <Check size={14} /> : <Archive size={14} />}
      </button>
    )
  }

  return (
    <button
      onClick={() => toggle(trackId)}
      aria-pressed={inCrate}
      className={`inline-flex items-center gap-2 rounded-sm border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors ${
        inCrate
          ? 'border-accent bg-accent/15 text-accent'
          : 'border-line text-muted hover:border-brass hover:text-text'
      }`}
    >
      {inCrate ? <Check size={13} /> : <Archive size={13} />}
      {inCrate ? 'In my crate' : 'Add to crate'}
    </button>
  )
}
