import { create } from 'zustand'

/* Client-side "favorites" — the tracks a visitor hearts with the like button.
   Stored as an ordered list of track ids in localStorage (like order, oldest
   first), so it survives reloads and is shared across every card on the site.
   Mirrors the localStorage idiom in themeStore.js. */

const KEY = 'artist-portfolio-favorites'

function load() {
  if (typeof window === 'undefined') return []
  try {
    const arr = JSON.parse(window.localStorage.getItem(KEY) || '[]')
    return Array.isArray(arr) ? arr.filter(id => typeof id === 'string') : []
  } catch { return [] }
}

function save(ids) {
  try { window.localStorage.setItem(KEY, JSON.stringify(ids)) } catch { /* ignore */ }
}

export const useFavoritesStore = create((set, get) => ({
  ids: load(),

  isFavorite(id) { return get().ids.includes(id) },

  toggle(id) {
    if (!id) return
    set(s => {
      const ids = s.ids.includes(id) ? s.ids.filter(x => x !== id) : [...s.ids, id]
      save(ids)
      return { ids }
    })
  },
}))
