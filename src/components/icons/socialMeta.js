/* Pure metadata + key resolution for social icons (no JSX, so it can be
   imported by both components and plain modules without tripping the
   fast-refresh "only export components" rule). */

export const SOCIAL_OPTIONS = [
  { key: 'soundcloud', label: 'SoundCloud' },
  { key: 'youtube',    label: 'YouTube' },
  { key: 'x',          label: 'X' },
  { key: 'instagram',  label: 'Instagram' },
  { key: 'twitch',     label: 'Twitch' },
  { key: 'link',       label: 'Other / Link' },
]

/* Legacy 2-letter codes (and old names) → current keys. */
const ALIASES = { yt: 'youtube', ig: 'instagram', sc: 'soundcloud', twitter: 'x', tw: 'x', tt: 'twitch' }

export function resolveIconKey(name) {
  const lower = String(name || '').toLowerCase()
  return ALIASES[lower] || lower
}

/* Map any stored value to a key that exists in SOCIAL_OPTIONS (for the CMS
   dropdown); unknown values fall back to 'link'. */
export function normalizeIconKey(name) {
  const k = resolveIconKey(name)
  return SOCIAL_OPTIONS.some(o => o.key === k) ? k : 'link'
}
