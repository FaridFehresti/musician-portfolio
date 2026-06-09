/* Tiny fetch wrapper for the CMS API. Same-origin paths (/api/*) — Vite proxies
   them to the Express server in dev; in production they're served by it too. */

// Mirrors the server's multer fileSize cap (server/index.js MAX_UPLOAD_MB) so
// oversized uploads fail instantly instead of after a doomed full transfer.
const MAX_UPLOAD_MB = 250

async function req(path, opts = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  })
  if (!res.ok) {
    let msg = res.statusText
    try { msg = (await res.json()).error || msg } catch { /* non-JSON */ }
    const err = new Error(msg)
    err.status = res.status
    throw err
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  // public
  content: () => req('/api/content'),
  recordPlay: (trackId) => req('/api/plays', { method: 'POST', body: JSON.stringify({ trackId }) }),

  // analytics (admin)
  analytics: (days = 30) => req(`/api/admin/analytics?days=${days}`),

  // auth
  session: () => req('/api/admin/session'),
  login:  (username, password) => req('/api/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => req('/api/admin/logout', { method: 'POST' }),

  // settings
  saveSettings: (patch) => req('/api/admin/settings', { method: 'PUT', body: JSON.stringify(patch) }),

  // tracks
  getTracks:     () => req('/api/admin/tracks'),
  createTrack:   (t)     => req('/api/admin/tracks', { method: 'POST', body: JSON.stringify(t) }),
  updateTrack:   (id, t) => req(`/api/admin/tracks/${id}`, { method: 'PUT', body: JSON.stringify(t) }),
  deleteTrack:   (id)    => req(`/api/admin/tracks/${id}`, { method: 'DELETE' }),
  reorderTracks: (order) => req('/api/admin/tracks-order', { method: 'PUT', body: JSON.stringify({ order }) }),

  // uploads → { url }
  async upload(type, file) {
    if (file && file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      throw new Error(`File is too large (max ${MAX_UPLOAD_MB} MB).`)
    }
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`/api/admin/upload?type=${encodeURIComponent(type)}`, {
      method: 'POST', credentials: 'include', body: fd,
    })
    if (!res.ok) {
      let msg = 'Upload failed'
      try { msg = (await res.json()).error || msg } catch { /* ignore */ }
      throw new Error(msg)
    }
    return res.json()
  },
}
