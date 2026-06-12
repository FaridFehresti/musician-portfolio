import { useState } from 'react'
import { Check, Share2 } from 'lucide-react'
import { shareTrack } from '../../lib/share'

/* Per-track share: OS share sheet on mobile, clipboard on desktop.
   The /track/:id link unfurls with cover art via the server's OG tags. */
export function ShareButton({ track }) {
  const [status, setStatus] = useState(null)

  async function onShare() {
    const result = await shareTrack(track)
    if (result === 'copied') {
      setStatus('copied')
      setTimeout(() => setStatus(null), 2000)
    }
  }

  return (
    <button
      onClick={onShare}
      className="inline-flex items-center gap-2 rounded-sm border border-line px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:border-brass hover:text-text"
    >
      {status === 'copied' ? <Check size={13} /> : <Share2 size={13} />}
      {status === 'copied' ? 'Link copied' : 'Share'}
    </button>
  )
}
