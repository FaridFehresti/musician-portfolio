/* Extract an embeddable YouTube ID from the usual URL shapes; null if the
   link isn't YouTube (those open externally instead of in the lightbox). */
export function youtubeId(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1) || null
    if (u.hostname.endsWith('youtube.com')) {
      if (u.pathname === '/watch') return u.searchParams.get('v')
      const m = u.pathname.match(/^\/(embed|shorts|live)\/([^/?#]+)/)
      if (m) return m[2]
    }
  } catch { /* not a URL */ }
  return null
}
