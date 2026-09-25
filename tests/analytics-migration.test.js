import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'
import { backup, DatabaseSync } from 'node:sqlite'

test('additive migration preserves a copied legacy database and deduplicates events', async () => {
  const root = mkdtempSync(join(tmpdir(), 'portfolio-analytics-'))
  const original = join(root, 'original')
  const copy = join(root, 'copy')
  mkdirSync(original); mkdirSync(copy)
  const source = new DatabaseSync(join(original, 'cms.db'))
  source.exec(`
    CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE tracks (id TEXT PRIMARY KEY, title TEXT NOT NULL, artist TEXT DEFAULT '', album TEXT DEFAULT '', genre TEXT DEFAULT '', duration REAL DEFAULT 0, year INTEGER DEFAULT 0, src TEXT DEFAULT '', coverArt TEXT DEFAULT '', video TEXT DEFAULT '', inHero INTEGER DEFAULT 1, inFeatured INTEGER DEFAULT 1, inLibrary INTEGER DEFAULT 1, published INTEGER DEFAULT 1, homeSlot TEXT DEFAULT '', sort INTEGER DEFAULT 0);
    CREATE TABLE plays (id INTEGER PRIMARY KEY, trackId TEXT NOT NULL, ts INTEGER NOT NULL);
  `)
  source.prepare('INSERT INTO tracks (id, title, artist, coverArt) VALUES (?, ?, ?, ?)')
    .run('old-track', 'Old Song', 'Existing Artist', '/uploads/covers/old.svg')
  source.prepare('INSERT INTO plays (trackId, ts) VALUES (?, ?)').run('old-track', Date.now())
  await backup(source, join(copy, 'cms.db'))
  source.close()

  process.env.CMS_DATA_DIR = copy
  process.env.CMS_UPLOAD_DIR = join(root, 'uploads')
  try {
    const { default: migrated, recordEvent, getAnalytics, getTrack, upsertTrack } = await import('../server/db.js')
    const playbackId = randomUUID()
    const id = randomUUID()
    const event = { id, playbackId, type: 'start', trackId: 'old-track' }
    assert.equal(recordEvent(event), true)
    assert.equal(recordEvent(event), false)
    assert.equal(recordEvent({ ...event, id: randomUUID() }), false)
    recordEvent({ id: randomUUID(), playbackId: randomUUID(), type: 'listen', trackId: 'old-track' }, Date.now() - 8 * 86400000)
    const report = getAnalytics({ days: 7 })
    assert.equal(report.historicalStarts, 1)
    assert.equal(report.totals.starts, 2)
    assert.equal(report.window.starts, 2)
    assert.equal(report.window.trackedStarts, 1)
    assert.equal(report.previous.listens, 1)
    assert.equal(report.previousDaily.length, 7)
    assert.equal(report.perTrack[0].previous.listens, 1)
    assert.equal(getTrack('old-track').title, 'Old Song')
    assert.equal(getTrack('old-track').shareDescription, '')
    const request = { path: '/track/old-track', originalUrl: '/track/old-track', protocol: 'http', headers: {}, get: () => 'localhost:4173' }
    const { headTags } = await import('../server/index.js')
    assert.doesNotMatch(headTags(request), /og:description/)
    upsertTrack({ ...getTrack('old-track'), shareTitle: 'A new share title', shareDescription: 'A new share description', shareImage: '/uploads/covers/share.svg', sharePostText: 'Hear this: {url}' })
    const tags = headTags(request)
    assert.match(tags, /og:title" content="A new share title"/)
    assert.match(tags, /og:description" content="A new share description"/)
    assert.match(tags, /og:image" content="http:\/\/localhost:4173\/uploads\/covers\/share.svg"/)
    assert.equal(getTrack('old-track').title, 'Old Song')
    const untouched = new DatabaseSync(join(original, 'cms.db'))
    assert.equal(untouched.prepare('SELECT COUNT(*) AS n FROM plays').get().n, 1)
    assert.equal(untouched.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name = 'engagement_events'").get().n, 0)
    untouched.close()
    migrated.close()
  } finally {
    delete process.env.CMS_DATA_DIR
    delete process.env.CMS_UPLOAD_DIR
    rmSync(root, { recursive: true, force: true })
  }
})
