/* SQLite layer built on Node's built-in `node:sqlite` (real SQL, zero native
   install). One file owns the schema, seeding and the small query helpers the
   routes use. Settings live as JSON blobs keyed by section; tracks get real
   columns so they can be ordered / filtered cheaply. */

import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DEFAULT_SITE, DEFAULT_ABOUT, DEFAULT_SOCIALS, DEFAULT_LINKS, DEFAULT_DONATION,
} from '../src/lib/defaults.js'
import { assignDefaultSlots } from '../src/lib/homeSlots.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.CMS_DATA_DIR || join(__dirname, 'data')
mkdirSync(DATA_DIR, { recursive: true })

const db = new DatabaseSync(join(DATA_DIR, 'cms.db'))
db.exec('PRAGMA journal_mode = WAL;')

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS tracks (
    id         TEXT PRIMARY KEY,
    title      TEXT NOT NULL,
    artist     TEXT DEFAULT '',
    album      TEXT DEFAULT '',
    genre      TEXT DEFAULT '',
    duration   REAL DEFAULT 0,
    year       INTEGER DEFAULT 0,
    src        TEXT DEFAULT '',
    coverArt   TEXT DEFAULT '',
    video      TEXT DEFAULT '',
    inHero     INTEGER DEFAULT 1,
    inFeatured INTEGER DEFAULT 1,
    inLibrary  INTEGER DEFAULT 1,
    published  INTEGER DEFAULT 1,
    homeSlot   TEXT DEFAULT '',
    sort       INTEGER DEFAULT 0
  );
`)

/* Migration: add homeSlot to databases created before fixed slots existed. */
{
  const cols = db.prepare('PRAGMA table_info(tracks)').all().map(c => c.name)
  if (!cols.includes('homeSlot')) db.exec("ALTER TABLE tracks ADD COLUMN homeSlot TEXT DEFAULT ''")
}

/* Stream log — one row per play. Additive (CREATE … IF NOT EXISTS), so it
   appears on the next server start without touching existing track/settings
   data. `bpm` was retired from the track schema above; databases created
   earlier keep the now-unused column harmlessly (no destructive DROP). */
db.exec(`
  CREATE TABLE IF NOT EXISTS plays (
    id      INTEGER PRIMARY KEY,
    trackId TEXT NOT NULL,
    ts      INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_plays_trackId ON plays(trackId);
  CREATE INDEX IF NOT EXISTS idx_plays_ts ON plays(ts);
`)

/* ── Settings (JSON blobs) ─────────────────────────────────────────── */
const getSettingStmt = db.prepare('SELECT value FROM settings WHERE key = ?')
const setSettingStmt = db.prepare(
  'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
)

export function getSetting(key, fallback = null) {
  const row = getSettingStmt.get(key)
  if (!row) return fallback
  try { return JSON.parse(row.value) } catch { return fallback }
}

export function setSetting(key, value) {
  setSettingStmt.run(key, JSON.stringify(value))
  return value
}

/* ── Tracks ────────────────────────────────────────────────────────── */
const TRACK_COLS = [
  'id', 'title', 'artist', 'album', 'genre', 'duration', 'year',
  'src', 'coverArt', 'video', 'inHero', 'inFeatured', 'inLibrary', 'published', 'homeSlot', 'sort',
]
const BOOL_COLS = new Set(['inHero', 'inFeatured', 'inLibrary', 'published'])

function rowToTrack(row) {
  if (!row) return null
  const t = { ...row }
  for (const c of BOOL_COLS) t[c] = !!t[c]
  return t
}

const listTracksStmt = db.prepare('SELECT * FROM tracks ORDER BY sort ASC, rowid ASC')
const getTrackStmt   = db.prepare('SELECT * FROM tracks WHERE id = ?')
const deleteTrackStmt = db.prepare('DELETE FROM tracks WHERE id = ?')

export function listTracks() {
  return listTracksStmt.all().map(rowToTrack)
}

export function getTrack(id) {
  return rowToTrack(getTrackStmt.get(id))
}

function coerce(track) {
  const out = {}
  for (const c of TRACK_COLS) {
    let v = track[c]
    if (BOOL_COLS.has(c)) v = v ? 1 : 0
    else if (c === 'year') v = Number.isFinite(+v) ? Math.round(+v) : 0
    else if (c === 'duration' || c === 'sort') v = Number.isFinite(+v) ? +v : 0
    else v = v == null ? '' : String(v)
    out[c] = v
  }
  return out
}

const upsertStmt = db.prepare(`
  INSERT INTO tracks (${TRACK_COLS.join(', ')})
  VALUES (${TRACK_COLS.map(c => '@' + c).join(', ')})
  ON CONFLICT(id) DO UPDATE SET
    ${TRACK_COLS.filter(c => c !== 'id').map(c => `${c} = excluded.${c}`).join(', ')}
`)

export function upsertTrack(track) {
  upsertStmt.run(coerce(track))
  return getTrack(track.id)
}

export function deleteTrack(id) {
  deleteTrackStmt.run(id)
}

export function nextSort() {
  const row = db.prepare('SELECT MAX(sort) AS m FROM tracks').get()
  return (row?.m ?? -1) + 1
}

/* ── Streams / analytics ───────────────────────────────────────────── */
const insertPlayStmt = db.prepare('INSERT INTO plays (trackId, ts) VALUES (?, ?)')

/* Log one stream. `ts` is epoch ms (defaults to now). */
export function recordPlay(trackId, ts = Date.now()) {
  insertPlayStmt.run(String(trackId), Math.round(ts))
}

/* Dashboard payload: all-time + windowed totals, per-track breakdown (joined
   to live track metadata), and a gap-filled daily series for the chart. */
export function getAnalytics({ days = 30 } = {}) {
  const safeDays = Math.min(365, Math.max(1, Math.round(days) || 30))
  const total = db.prepare('SELECT COUNT(*) AS n FROM plays').get().n

  const byId = new Map(listTracks().map(t => [t.id, t]))
  const perTrack = db.prepare(`
    SELECT trackId, COUNT(*) AS streams, MAX(ts) AS lastPlayed
    FROM plays GROUP BY trackId ORDER BY streams DESC, lastPlayed DESC
  `).all().map(r => {
    const t = byId.get(r.trackId)
    return {
      id: r.trackId,
      title:    t?.title  || '(deleted track)',
      artist:   t?.artist || '',
      coverArt: t?.coverArt || '',
      exists:   !!t,
      streams:  r.streams,
      lastPlayed: r.lastPlayed,
    }
  })

  const since = Date.now() - (safeDays - 1) * 86400000
  const rows = db.prepare(`
    SELECT strftime('%Y-%m-%d', ts / 1000, 'unixepoch') AS day, COUNT(*) AS streams
    FROM plays WHERE ts >= ? GROUP BY day
  `).all(since)
  const byDay = new Map(rows.map(r => [r.day, r.streams]))

  const daily = []
  const cursor = new Date(since)
  for (let i = 0; i < safeDays; i++) {
    const key = cursor.toISOString().slice(0, 10)
    daily.push({ day: key, streams: byDay.get(key) || 0 })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return {
    total,
    days: safeDays,
    windowStreams: daily.reduce((a, d) => a + d.streams, 0),
    tracksPlayed: perTrack.length,
    perTrack,
    daily,
  }
}

/* ── First-run seed ──────────────────────────────────────────────────
   Only the default branding/about/socials settings are seeded (and the
   frontend falls back to these anyway). The track catalogue starts EMPTY —
   a fresh install / deploy has no music; content is added via the admin CMS. */
export function seedIfEmpty() {
  if (getSetting('site') == null) setSetting('site', DEFAULT_SITE)
  if (getSetting('about') == null) setSetting('about', DEFAULT_ABOUT)
  if (getSetting('socials') == null) setSetting('socials', DEFAULT_SOCIALS)
  if (getSetting('links') == null) setSetting('links', DEFAULT_LINKS)
  if (getSetting('donation') == null) setSetting('donation', DEFAULT_DONATION)
}

/* Distribute existing tracks into home slots once, if none are assigned yet
   (covers databases that predate the fixed-slot feature). */
function ensureSlots() {
  const assigned = db.prepare("SELECT COUNT(*) AS n FROM tracks WHERE homeSlot != ''").get().n
  if (assigned > 0) return
  const eligible = listTracks().filter(t => t.inHero !== false)
  const slots = assignDefaultSlots(eligible)
  eligible.forEach((t, i) => upsertTrack({ ...t, homeSlot: slots[i] }))
}

seedIfEmpty()
ensureSlots()

export default db
