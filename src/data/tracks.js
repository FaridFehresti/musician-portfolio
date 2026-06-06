/**
 * Real track catalog — edit src/coverArt paths when you add new music.
 * Files live in:  public/music/...
 * Covers live in: public/music/.../cover.jpg  OR  public/music/.../Folder.jpg
 */

/* ── Shared covers ──────────────────────────────────────────────── */
const ASTRIX_COVER      = '/music/Astrix%20-%20He.Art%20(2016)/cover.jpg'
const MONKEY_HOPE_COVER = '/music/metal/Folder.jpg'

/* ── Base path helper ────────────────────────────────────────────── */
function astrix(filename) {
  return `/music/Astrix%20-%20He.Art%20(2016)/${encodeURIComponent(filename)}`
}
function metal(filename) {
  return `/music/metal/${encodeURIComponent(filename)}`
}

export const tracks = [
  /* ── Astrix — He.Art (2016) ─────────────────────────────────── */
  {
    id:       'astrix-01',
    title:    'Shamanic Tales',
    artist:   'Astrix',
    album:    'He.Art',
    genre:    'Psytrance',
    bpm:      148,
    duration: 0,   /* auto-set by Howler on load */
    src:      astrix('01. Astrix - Shamanic Tales (Original Mix).mp3'),
    coverArt: ASTRIX_COVER,
    year:     2016,
  },
  {
    id:       'astrix-02',
    title:    'Deep Jungle Walk',
    artist:   'Astrix',
    album:    'He.Art',
    genre:    'Psytrance',
    bpm:      148,
    duration: 0,
    src:      astrix('02. Astrix - Deep Jungle Walk (Original Mix).mp3'),
    coverArt: ASTRIX_COVER,
    year:     2016,
  },
  {
    id:       'astrix-03',
    title:    'Alien Turned Human',
    artist:   'Astrix',
    album:    'He.Art',
    genre:    'Psytrance',
    bpm:      147,
    duration: 0,
    src:      astrix('03. Astrix - Alien Turned Human (Original Mix).mp3'),
    coverArt: ASTRIX_COVER,
    year:     2016,
  },
  {
    id:       'astrix-04',
    title:    'Valley of Stevie',
    artist:   'Ace Ventura, Astrix',
    album:    'He.Art',
    genre:    'Psytrance',
    bpm:      146,
    duration: 0,
    src:      astrix('04. Ace Ventura, Astrix - Valley of Stevie (Original Mix).mp3'),
    coverArt: ASTRIX_COVER,
    year:     2016,
  },
  {
    id:       'astrix-05',
    title:    'He.art',
    artist:   'Astrix',
    album:    'He.Art',
    genre:    'Psytrance',
    bpm:      145,
    duration: 0,
    src:      astrix('05. Astrix - He.art (Original Mix).mp3'),
    coverArt: ASTRIX_COVER,
    year:     2016,
  },
  {
    id:       'astrix-06',
    title:    'Agate',
    artist:   'Astrix, Ritmo',
    album:    'He.Art',
    genre:    'Psytrance',
    bpm:      147,
    duration: 0,
    src:      astrix('06. Astrix, Ritmo - Agate (Original Mix).mp3'),
    coverArt: ASTRIX_COVER,
    year:     2016,
  },
  {
    id:       'astrix-07',
    title:    'Sapana',
    artist:   'Astrix',
    album:    'He.Art',
    genre:    'Psytrance',
    bpm:      146,
    duration: 0,
    src:      astrix('07. Astrix - Sapana (Album Version).mp3'),
    coverArt: ASTRIX_COVER,
    year:     2016,
  },
  {
    id:       'astrix-08',
    title:    'Awake the Snake',
    artist:   'Tristan, Astrix',
    album:    'He.Art',
    genre:    'Psytrance',
    bpm:      148,
    duration: 0,
    src:      astrix('08. Tristan, Astrix - Awake the Snake (Original Mix).mp3'),
    coverArt: ASTRIX_COVER,
    year:     2016,
  },
  {
    id:       'astrix-09',
    title:    'Conquistador',
    artist:   'Juno Reactor (Astrix Remix)',
    album:    'He.Art',
    genre:    'Psytrance',
    bpm:      148,
    duration: 0,
    src:      astrix('09. Juno Reactor - Conquistador (Astrix Remix).mp3'),
    coverArt: ASTRIX_COVER,
    year:     2016,
  },

  /* ── Monkey Hope ─────────────────────────────────────────────── */
  {
    id:       'mh-01',
    title:    'A Killer',
    artist:   'Monkey Hope',
    album:    'Monkey Hope',
    genre:    'Metal',
    bpm:      160,
    duration: 0,
    src:      metal('Monkey Hope - A Killer.mp3'),
    coverArt: MONKEY_HOPE_COVER,
    year:     2024,
  },
  {
    id:       'mh-02',
    title:    'Give it a Try',
    artist:   'Monkey Hope',
    album:    'Monkey Hope',
    genre:    'Metal',
    bpm:      138,
    duration: 0,
    src:      metal('Monkey Hope - Give it a Try.mp3'),
    coverArt: MONKEY_HOPE_COVER,
    year:     2024,
  },
  {
    id:       'mh-03',
    title:    'Lions are Liars',
    artist:   'Monkey Hope',
    album:    'Monkey Hope',
    genre:    'Metal',
    bpm:      145,
    duration: 0,
    src:      metal('Monkey Hope - Lions are Liars.mp3'),
    coverArt: MONKEY_HOPE_COVER,
    year:     2024,
  },
  {
    id:       'mh-04',
    title:    'Next to Mars',
    artist:   'Monkey Hope',
    album:    'Monkey Hope',
    genre:    'Metal',
    bpm:      152,
    duration: 0,
    src:      metal('Monkey Hope - Next to Mars.mp3'),
    coverArt: MONKEY_HOPE_COVER,
    year:     2024,
  },
]

export const GENRES = ['All', 'Psytrance', 'Metal']

/* Synthwave duotones — neon-tinted darks behind cover art / foil */
export const GENRE_GRADIENTS = {
  Psytrance:       ['#1a0540', '#06021a'],
  Metal:           ['#2a0533', '#10031a'],
  Electronic:      ['#06243a', '#03101f'],
  House:           ['#2a0a40', '#120420'],
  'Deep House':    ['#1a0a33', '#08041a'],
  Techno:          ['#330a3a', '#160320'],
  Ambient:         ['#062a33', '#03141a'],
  'Melodic House': ['#2a0533', '#140320'],
}

export function fmtDuration(s) {
  if (!s) return '--:--'
  const m  = Math.floor(s / 60)
  const ss = String(Math.floor(s % 60)).padStart(2, '0')
  return `${m}:${ss}`
}
