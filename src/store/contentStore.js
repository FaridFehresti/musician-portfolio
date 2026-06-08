import { create } from 'zustand'
import { tracks as STATIC_TRACKS, GENRES } from '../data/tracks'
import { DEFAULT_CONTENT } from '../lib/defaults'
import { assignDefaultSlots } from '../lib/homeSlots'
import { api } from '../lib/api'
import { useThemeStore } from './themeStore'

/* The whole public site reads its content from here. It starts with the
   static catalog + defaults (so the site is fully functional with no server
   running), then `load()` replaces it with the live CMS content from /api. */

/* Reflect branding into the document: theme, tab title, and favicon (the
   uploaded logo). Runs live so admin changes show without a reload. */
function applyFavicon(url) {
  if (typeof document === 'undefined' || !url) return
  let link = document.querySelector('link[rel="icon"]')
  if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link) }
  link.removeAttribute('type')   // logo may be png/webp/svg — let the browser detect
  link.href = url
}
function applySite(site) {
  if (!site) return
  if (site.theme) useThemeStore.getState().setTheme(site.theme)
  if (typeof document !== 'undefined' && site.artistName) {
    document.title = `${site.artistName} — Music`
  }
  applyFavicon(site.logoUrl)
}

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
      applySite(c.site)
    } catch (e) {
      // Keep the fallback content — the site still works offline.
      set({ loaded: true, online: false, error: e.message })
    }
  },

  // Let the admin push fresh content into the public store after a save.
  applyContent(c) {
    set({ ...c })
    applySite(c.site)
  },
}))

/* NOTE: derive placement lists (inHero / inFeatured / inLibrary) with useMemo
   inside components from `s.tracks` — do NOT pass a `.filter()` selector to
   useContentStore(), as the fresh array each render loops useSyncExternalStore. */
