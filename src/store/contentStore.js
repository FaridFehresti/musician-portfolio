import { create } from 'zustand'
import { tracks as STATIC_TRACKS, GENRES } from '../data/tracks'
import { DEFAULT_CONTENT } from '../lib/defaults'
import { assignDefaultSlots } from '../lib/homeSlots'
import { api } from '../lib/api'
import { useThemeStore } from './themeStore'

/* The whole public site reads its content from here. It starts with the
   static catalog + defaults (so the site is fully functional with no server
   running), then `load()` replaces it with the live CMS content from /api. */

const FB_SLOTS = assignDefaultSlots(STATIC_TRACKS)
const FALLBACK = {
  ...DEFAULT_CONTENT,
  tracks: STATIC_TRACKS.map((t, i) => ({
    ...t, inHero: true, inFeatured: true, inLibrary: true, published: true,
    homeSlot: FB_SLOTS[i], sort: i,
  })),
  genres: GENRES,
}

export const useContentStore = create((set) => ({
  ...FALLBACK,
  loaded: false,
  online: false,         // true once the API answered
  error: null,

  async load() {
    try {
      const c = await api.content()
      set({ ...c, loaded: true, online: true, error: null })
      if (c.site?.theme) useThemeStore.getState().setTheme(c.site.theme)
    } catch (e) {
      // Keep the fallback content — the site still works offline.
      set({ loaded: true, online: false, error: e.message })
    }
  },

  // Let the admin push fresh content into the public store after a save.
  applyContent(c) {
    set({ ...c })
    if (c.site?.theme) useThemeStore.getState().setTheme(c.site.theme)
  },
}))

/* NOTE: derive placement lists (inHero / inFeatured / inLibrary) with useMemo
   inside components from `s.tracks` — do NOT pass a `.filter()` selector to
   useContentStore(), as the fresh array each render loops useSyncExternalStore. */
