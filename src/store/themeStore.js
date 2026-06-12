import { create } from 'zustand'
import { THEME_OPTIONS } from '../lib/defaults'

/* Template-agnostic theme switcher. The list (defaults.js) is the union of
   both templates' themes; this store just validates an id, writes
   <html data-theme="…"> and persists it. Whichever template's stylesheet is
   loaded interprets the attribute via its own html[data-theme] blocks, so the
   same store serves Classic (neon) and Analog (record-shop) themes. */
export const THEMES = THEME_OPTIONS

const IDS = THEMES.map((t) => t.id)
const KEY = 'artist-portfolio-theme'
const DEFAULT = 'midnight'

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
