/**
 * Track catalog. The real catalogue is managed in the CMS (/admin) and served
 * from the API; this module only provides the empty fallback used when the API
 * is unreachable, plus the genre→gradient lookup and duration formatter that
 * the UI components share.
 */

export const tracks = []

export const GENRES = ['All']

export const GENRE_GRADIENTS = {
  Metal:           ['#2a0533', '#10031a'],
  Psytrance:       ['#1a0540', '#06021a'],
  Electronic:      ['#06243a', '#03101f'],
  House:           ['#2a0a40', '#120420'],
  'Deep House':    ['#1a0a33', '#08041a'],
  Techno:          ['#330a3a', '#160320'],
  Ambient:         ['#062a33', '#03141a'],
  'Melodic House': ['#2a0533', '#140320'],
}

export function fmtDuration(s) {
  if (!s) return '--:--'
  const m  = Math.floor(s / 60)
  const ss = String(Math.floor(s % 60)).padStart(2, '0')
  return `${m}:${ss}`
}
