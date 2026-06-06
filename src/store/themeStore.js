import { create } from 'zustand'

/* 5 themes, ordered light → dark. */
export const THEMES = [
  { id: 'aurora',    label: 'Aurora',    bg: '#f4f2fb', a: '#6d4dff', b: '#00b3c4' },
  { id: 'sandstone', label: 'Sandstone', bg: '#ece4d6', a: '#b8430f', b: '#1f8a70' },
  { id: 'slate',     label: 'Slate',     bg: '#2a303c', a: '#38bdf8', b: '#34d399' },
  { id: 'midnight',  label: 'Midnight',  bg: '#0b1020', a: '#6d8bff', b: '#22d3ee' },
  { id: 'synthwave', label: 'Synthwave', bg: '#0b0612', a: '#ff2fd0', b: '#00e5ff' },
]

const IDS = THEMES.map(t => t.id)
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
