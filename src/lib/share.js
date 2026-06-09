/* Shareable per-track permalinks. `trackUrl` builds the link; `shareTrack`
   hands it to the OS share sheet (mobile) or the clipboard (desktop) and
   returns a status the UI can reflect: 'shared' | 'copied' | 'cancelled' |
   'failed'. The link resolves to the /track/:id route, which the server
   decorates with Open Graph tags so it unfurls with the cover art. */

export function trackUrl(id) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/track/${encodeURIComponent(id)}`
}

export async function shareTrack(track) {
  if (!track?.id) return 'failed'
  const url = trackUrl(track.id)
  const title = `${track.title}${track.artist ? ` — ${track.artist}` : ''}`

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text: `Listen to ${title}`, url })
      return 'shared'
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled'
      // any other share failure → fall through to clipboard
    }
  }
  return copyToClipboard(url)
}

async function copyToClipboard(url) {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      return 'copied'
    }
  } catch { /* fall through to the legacy path */ }

  try {
    const ta = document.createElement('textarea')
    ta.value = url
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok ? 'copied' : 'failed'
  } catch {
    return 'failed'
  }
}
