import { api } from './api'

export function recordShare(trackId) {
  if (!trackId) return
  api.recordEvent({ id: crypto.randomUUID(), type: 'share', trackId }).catch(() => {})
}

export function recordOutbound(destination, label, trackId = null) {
  api.recordEvent({
    id: crypto.randomUUID(), type: 'outbound', destination,
    label: String(label || destination).slice(0, 120), trackId,
  }).catch(() => {})
}
