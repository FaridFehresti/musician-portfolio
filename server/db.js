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
import { tracks as SEED_TRACKS } from '../src/data/tracks.js'
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
    bpm        INTEGER DEFAULT 0,
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
  'id', 'title', 'artist', 'album', 'genre', 'bpm', 'duration', 'year',
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
    else if (c === 'bpm' || c === 'year') v = Number.isFinite(+v) ? Math.round(+v) : 0
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

/* ── First-run seed ────────────────────────────────────────────────── */
export function seedIfEmpty() {
  if (getSetting('site') == null) setSetting('site', DEFAULT_SITE)
  if (getSetting('about') == null) setSetting('about', DEFAULT_ABOUT)
  if (getSetting('socials') == null) setSetting('socials', DEFAULT_SOCIALS)
  if (getSetting('links') == null) setSetting('links', DEFAULT_LINKS)
  if (getSetting('donation') == null) setSetting('donation', DEFAULT_DONATION)

  const count = db.prepare('SELECT COUNT(*) AS n FROM tracks').get().n
  if (count === 0) {
    const slots = assignDefaultSlots(SEED_TRACKS)
    SEED_TRACKS.forEach((t, i) => {
      upsertTrack({
        ...t,
        inHero: true, inFeatured: true, inLibrary: true, published: true,
        homeSlot: slots[i], sort: i,
      })
    })
  }
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
