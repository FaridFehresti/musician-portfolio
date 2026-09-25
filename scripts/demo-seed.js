import { existsSync, lstatSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

const root = resolve(import.meta.dirname, '..')
const demo = join(root, '.dev-preview')
const data = join(demo, 'data')
const uploads = join(demo, 'uploads')
if (process.env.NODE_ENV === 'production' || process.env.CMS_DATA_DIR || process.env.CMS_UPLOAD_DIR) {
  throw new Error('Demo seed only runs without production data settings.')
}
for (const path of [demo, data, uploads]) {
  if (existsSync(path) && lstatSync(path).isSymbolicLink()) throw new Error(`Refusing linked demo path: ${path}`)
}
if (existsSync(join(data, 'cms.db'))) throw new Error('Demo database already exists. Refusing to overwrite it.')
mkdirSync(join(uploads, 'covers'), { recursive: true })
mkdirSync(join(uploads, 'audio'), { recursive: true })
process.env.CMS_DATA_DIR = data
process.env.CMS_UPLOAD_DIR = uploads

const { getSetting, setSetting, upsertTrack, recordPlay, recordEvent } = await import('../server/db.js')
const palettes = [
  ['#541b86', '#ec4dc5'], ['#123d82', '#40d8f5'], ['#8b2444', '#ff9d67'],
  ['#273078', '#af7cff'], ['#265f66', '#72edc5'], ['#735628', '#f5cf78'],
]
const names = [
  ['Neon Tides', 'Electronic', 'stack-1', 42],
  ['Afterimage', 'Ambient', 'stack-2', 42],
  ['Low Orbit', 'Techno', 'stack-3', 12],
  ['Signal Bloom', 'Melodic House', 'fan-1', 42],
  ['Night Drive', 'Deep House', 'fan-2', 42],
  ['Glass Horizon', 'Ambient', 'fan-3', 42],
]
function cover(i, title) {
  const [dark, glow] = palettes[i]
  const words = title.split(' ')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><radialGradient id="g"><stop stop-color="${glow}"/><stop offset="1" stop-color="${dark}"/></radialGradient></defs><rect width="600" height="600" fill="#090d1d"/><circle cx="300" cy="260" r="235" fill="url(#g)" opacity=".78"/><circle cx="300" cy="260" r="165" fill="none" stroke="white" stroke-opacity=".4" stroke-width="3"/><path d="M40 390Q300 150 560 390M40 420Q300 180 560 420" fill="none" stroke="${glow}" stroke-width="5"/><text x="300" y="472" text-anchor="middle" fill="white" font-family="sans-serif" font-size="44" font-weight="700">${words.join(' ')}</text><text x="300" y="525" text-anchor="middle" fill="white" fill-opacity=".75" font-family="sans-serif" font-size="22" letter-spacing="5">MIRA VALE</text></svg>`
}
function tone(seconds, frequency) {
  const rate = 16000
  const samples = rate * seconds
  const bytes = samples * 2
  const wav = Buffer.alloc(44 + bytes)
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + bytes, 4); wav.write('WAVEfmt ', 8)
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22)
  wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28)
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34)
  wav.write('data', 36); wav.writeUInt32LE(bytes, 40)
  for (let i = 0; i < samples; i++) {
    const fade = Math.min(1, i / rate, (samples - i) / rate)
    const note = Math.sin(2 * Math.PI * frequency * i / rate) * 0.08 * fade
    wav.writeInt16LE(Math.round(note * 32767), 44 + i * 2)
  }
  return wav
}
writeFileSync(join(uploads, 'audio', 'demo-long.wav'), tone(42, 220))
writeFileSync(join(uploads, 'audio', 'demo-short.wav'), tone(12, 329.63))

const tracks = names.map(([title, genre, homeSlot, duration], i) => {
  writeFileSync(join(uploads, 'covers', `demo-${i + 1}.svg`), cover(i, title))
  return upsertTrack({
    id: `demo-${i + 1}`, title, artist: 'Mira Vale', album: i < 3 ? 'Night Signals' : 'Open Circuits',
    genre, homeSlot, duration, year: 2026, sort: i,
    src: `/uploads/audio/demo-${duration === 12 ? 'short' : 'long'}.wav`,
    coverArt: `/uploads/covers/demo-${i + 1}.svg`, video: i === 0 ? 'https://www.youtube.com/watch?v=jfKfPfyJRdk' : '',
    inHero: true, inFeatured: true, inLibrary: true, published: i !== 5,
  })
})
setSetting('site', { ...getSetting('site'), artistName: 'Mira Vale', tagline: 'Fictional music for the local preview',
  template: 'classic', homeSlots: { 'stack-1': 'Electronic', 'stack-2': 'Ambient', 'fan-1': 'Melodic' } })
setSetting('links', [{ label: 'Press kit', href: 'https://example.com/press' }])
setSetting('socials', [{ label: 'Instagram', icon: 'instagram', href: 'https://instagram.com' },
  { label: 'YouTube', icon: 'youtube', href: 'https://youtube.com' }])
setSetting('donation', { ...getSetting('donation'), checkyaUrl: 'https://example.com/tips' })

const day = 86400000
for (let daysAgo = 45; daysAgo >= 0; daysAgo--) {
  const ts = Date.now() - daysAgo * day
  for (let i = 0; i < 5; i++) {
    const count = Math.max(1, 6 - i) + (daysAgo % 4)
    for (let n = 0; n < count; n++) {
      const at = ts + n * 1000
      if (daysAgo > 14) recordPlay(tracks[i].id, at)
      else {
        const playbackId = randomUUID()
        recordEvent({ id: randomUUID(), playbackId, type: 'start', trackId: tracks[i].id }, at)
        if (n % 4 !== 0) recordEvent({ id: randomUUID(), playbackId, type: 'listen', trackId: tracks[i].id }, at + 30000)
        if (n % 3 === 0) recordEvent({ id: randomUUID(), playbackId, type: 'complete', trackId: tracks[i].id }, at + 42000)
      }
    }
    if (daysAgo <= 14 && i < 3) {
      recordEvent({ id: randomUUID(), type: 'share', trackId: tracks[i].id }, ts + 50000)
      recordEvent({ id: randomUUID(), type: 'outbound', trackId: tracks[i].id, destination: 'video', label: tracks[i].title }, ts + 60000)
    }
  }
  if (daysAgo <= 14) {
    recordEvent({ id: randomUUID(), type: 'outbound', destination: 'social', label: 'Instagram' }, ts + 70000)
    recordEvent({ id: randomUUID(), type: 'outbound', destination: 'donation', label: 'Tip jar' }, ts + 80000)
  }
}
console.log(`Demo seeded at ${demo} with ${tracks.length} fictional tracks.`)
