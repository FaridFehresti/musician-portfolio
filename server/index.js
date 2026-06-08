/* CMS API server — Express + node:sqlite. Serves:
     • GET  /api/content            public, aggregate site content (dynamic)
     • POST /api/admin/login        user/pass from .env → signed cookie session
     • admin CRUD for settings, tracks and file uploads (cookie-guarded)
     • /uploads/*                   uploaded logos / covers / audio (static)
     • dist/*                       the built SPA in production (with fallback)
   Run:  node --env-file=.env server/index.js   (or `pnpm run server`) */

import express from 'express'
import cookieParser from 'cookie-parser'
import multer from 'multer'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join, extname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { randomUUID } from 'node:crypto'

import {
  getSetting, setSetting, listTracks, getTrack, upsertTrack, deleteTrack, nextSort,
} from './db.js'
import {
  DEFAULT_SITE, DEFAULT_ABOUT, DEFAULT_SOCIALS, DEFAULT_LINKS, DEFAULT_DONATION,
} from '../src/lib/defaults.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

/* ── Minimal .env loader (avoids a dotenv dep; no-op if file missing) ── */
function loadEnv() {
  const f = join(ROOT, '.env')
  if (!existsSync(f)) return
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
    if (!m) continue
    const key = m[1]
    let val = (m[2] || '').trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = val
  }
}
loadEnv()

const PORT = process.env.PORT || 3001
const ADMIN_USER = process.env.ADMIN_USER || 'admin'
const ADMIN_PASS = process.env.ADMIN_PASS || 'changeme'
const SECRET = process.env.SESSION_SECRET || 'dev-insecure-secret-change-me'
const COOKIE = 'cms_session'

const app = express()
app.set('trust proxy', true)   // correct req.protocol/host behind nginx etc.
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser(SECRET))

/* ── Uploads ───────────────────────────────────────────────────────── */
const UPLOAD_DIR = join(__dirname, 'uploads')
const TYPES = { cover: 'covers', audio: 'audio', logo: 'logo', portrait: 'portrait' }
for (const d of Object.values(TYPES)) mkdirSync(join(UPLOAD_DIR, d), { recursive: true })

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const sub = TYPES[req.query.type] || 'misc'
    const dir = join(UPLOAD_DIR, sub)
    mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename(_req, file, cb) {
    const ext = (extname(file.originalname) || '').toLowerCase().replace(/[^.a-z0-9]/g, '')
    cb(null, `${randomUUID()}${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 80 * 1024 * 1024 } })

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }))

/* ── Auth ──────────────────────────────────────────────────────────── */
function isAuthed(req) {
  return req.signedCookies?.[COOKIE] === 'ok'
}
function requireAuth(req, res, next) {
  if (!isAuthed(req)) return res.status(401).json({ error: 'unauthorized' })
  next()
}

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {}
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.cookie(COOKIE, 'ok', {
      httpOnly: true, signed: true, sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    })
    return res.json({ ok: true })
  }
  res.status(401).json({ error: 'Invalid username or password' })
})

app.post('/api/admin/logout', (req, res) => {
  res.clearCookie(COOKIE)
  res.json({ ok: true })
})

app.get('/api/admin/session', (req, res) => {
  res.json({ authed: isAuthed(req) })
})

/* ── Public content (the dynamic source for the whole site) ────────── */
function buildContent({ includeUnpublished = false } = {}) {
  const all = listTracks()
  const tracks = includeUnpublished ? all : all.filter(t => t.published)
  const genres = [...new Set(tracks.map(t => t.genre).filter(Boolean))]
  return {
    site:     getSetting('site', DEFAULT_SITE),
    about:    getSetting('about', DEFAULT_ABOUT),
    socials:  getSetting('socials', DEFAULT_SOCIALS),
    links:    getSetting('links', DEFAULT_LINKS),
    donation: getSetting('donation', DEFAULT_DONATION),
    tracks,
    genres:   ['All', ...genres],
  }
}

app.get('/api/content', (_req, res) => {
  res.json(buildContent())
})

/* ── Admin: settings ───────────────────────────────────────────────── */
const SECTION_DEFAULTS = {
  site: DEFAULT_SITE, about: DEFAULT_ABOUT, socials: DEFAULT_SOCIALS,
  links: DEFAULT_LINKS, donation: DEFAULT_DONATION,
}

app.put('/api/admin/settings', requireAuth, (req, res) => {
  const body = req.body || {}
  for (const key of Object.keys(SECTION_DEFAULTS)) {
    if (!(key in body)) continue
    const incoming = body[key]
    if (Array.isArray(incoming)) {
      setSetting(key, incoming)                       // socials / links → replace
    } else if (incoming && typeof incoming === 'object') {
      const cur = getSetting(key, SECTION_DEFAULTS[key])
      setSetting(key, { ...cur, ...incoming })        // site / about / donation → merge
    }
  }
  res.json(buildContent({ includeUnpublished: true }))
})

/* ── Admin: tracks ─────────────────────────────────────────────────── */
function slugify(s) {
  return String(s || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60) || 'track'
}

app.get('/api/admin/tracks', requireAuth, (_req, res) => {
  res.json(listTracks())
})

app.post('/api/admin/tracks', requireAuth, (req, res) => {
  const t = req.body || {}
  let id = t.id ? slugify(t.id) : slugify(`${t.artist || ''}-${t.title || ''}`)
  let unique = id
  let i = 2
  while (getTrack(unique)) unique = `${id}-${i++}`
  const saved = upsertTrack({
    id: unique,
    title: t.title || 'Untitled', artist: t.artist || '', album: t.album || '',
    genre: t.genre || '', bpm: t.bpm || 0, duration: t.duration || 0, year: t.year || 0,
    src: t.src || '', coverArt: t.coverArt || '', video: t.video || '',
    inHero: t.inHero ?? true, inFeatured: t.inFeatured ?? true, inLibrary: t.inLibrary ?? true,
    homeSlot: t.homeSlot || '', published: t.published ?? true, sort: nextSort(),
  })
  res.json(saved)
})

app.put('/api/admin/tracks/:id', requireAuth, (req, res) => {
  const existing = getTrack(req.params.id)
  if (!existing) return res.status(404).json({ error: 'not found' })
  res.json(upsertTrack({ ...existing, ...req.body, id: existing.id }))
})

app.delete('/api/admin/tracks/:id', requireAuth, (req, res) => {
  deleteTrack(req.params.id)
  res.json({ ok: true })
})

/* Reorder: body = { order: [id, id, ...] } */
app.put('/api/admin/tracks-order', requireAuth, (req, res) => {
  const order = req.body?.order || []
  order.forEach((id, i) => {
    const t = getTrack(id)
    if (t) upsertTrack({ ...t, sort: i })
  })
  res.json(listTracks())
})

/* ── Admin: uploads ────────────────────────────────────────────────── */
app.post('/api/admin/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' })
  const sub = TYPES[req.query.type] || 'misc'
  res.json({ url: `/uploads/${sub}/${req.file.filename}` })
})

/* ── Production: serve the built SPA, injecting per-request <head> tags ──
   Social crawlers (Twitter/X, Discord, Facebook, iMessage) don't run JS, so
   the favicon + Open Graph / Twitter Card tags must be in the served HTML.
   We read the current site settings and inject them, using the uploaded logo
   as the favicon and the share-card image. */
function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function publicBase(req) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/+$/, '')
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'http').split(',')[0]
  return `${proto}://${req.get('host')}`
}
export function headTags(req) {
  const site = getSetting('site', DEFAULT_SITE)
  const base = publicBase(req)
  const name = site.artistName || 'Artist'
  const title = `${name} — Music`
  const desc = site.tagline || 'Listen free — no account, no subscription.'
  const logo = site.logoUrl ? base + site.logoUrl : ''
  const url = base + (req.originalUrl || '/')
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}" />`,
    logo && `<link rel="icon" href="${esc(site.logoUrl)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(name)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    logo && `<meta property="og:image" content="${esc(logo)}" />`,
    `<meta name="twitter:card" content="${logo ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(desc)}" />`,
    logo && `<meta name="twitter:image" content="${esc(logo)}" />`,
  ].filter(Boolean).join('\n    ')
}
export function renderIndex(html, req) {
  // strip the static title / favicon / description / og / twitter tags, then inject fresh ones
  const stripped = html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<link[^>]*\brel=["']icon["'][^>]*>/gi, '')
    .replace(/<meta[^>]*\b(?:name=["'](?:description|twitter:[^"']*)["']|property=["']og:[^"']*["'])[^>]*>/gi, '')
  return stripped.replace('</head>', `    ${headTags(req)}\n  </head>`)
}

const DIST = join(ROOT, 'dist')
if (existsSync(join(DIST, 'index.html'))) {
  const INDEX_HTML = readFileSync(join(DIST, 'index.html'), 'utf8')
  app.use(express.static(DIST, { index: false, maxAge: '1h' }))
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
    res.set('Cache-Control', 'no-cache').type('html').send(renderIndex(INDEX_HTML, req))
  })
}

app.use((err, _req, res, _next) => {
  console.error('[api] error:', err?.message || err)
  res.status(err?.status || 500).json({ error: err?.message || 'server error' })
})

// Only listen when run directly (`node server/index.js`), not when imported.
const isMain = pathToFileURL(process.argv[1] || '').href === import.meta.url
if (isMain) {
  app.listen(PORT, () => {
    console.log(`[cms] API on http://localhost:${PORT}  (admin user: ${ADMIN_USER})`)
  })
}
