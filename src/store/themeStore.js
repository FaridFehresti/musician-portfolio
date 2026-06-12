import { create } from 'zustand'
import { THEME_OPTIONS } from '../lib/defaults'

/* Analog theme switcher. The list lives in defaults.js (server-safe, shared
   with the CMS picker + the index.html pre-paint script); each id maps to an
   html[data-theme='…'] block in globals.css. Selecting a theme writes the
   attribute on <html> and persists it; the public site shows whatever theme
   the admin saved (via contentStore.applySite → setTheme). */
export const THEMES = THEME_OPTIONS

const IDS = THEMES.map(t => t.id)
const KEY = 'artist-portfolio-theme'
const DEFAULT = 'smoke'

function initialTheme() {
  if (typeof window === 'undefined') return DEFAULT
  try {
    const saved = window.localStorage.getItem(KEY)
    if (IDS.includes(saved)) return saved
  } catch { /* ignore */ }
  return DEFAULT
}

export const useThemeStore = create((set) => ({
  theme: initialTheme(),
  setTheme(theme) {
    if (!IDS.includes(theme)) return
    try { window.localStorage.setItem(KEY, theme) } catch { /* ignore */ }
    if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', theme)
    set({ theme })
  },
}))
