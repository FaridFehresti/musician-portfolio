import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DeckCard, CARD_TOTAL_W } from '../components/library/DeckCard'
import { tracks, GENRES } from '../data/tracks'

/* Deterministic tilt so cards look like a scattered deck */
const TILTS = tracks.map((_, i) => ((i * 137 + 17) % 9) - 4)  // range –4° to +4°

export default function Library() {
  const [activeGenre, setActiveGenre] = useState('All')
  const [search, setSearch]           = useState('')
  const [sort, setSort]               = useState('default')

  const filtered = useMemo(() => {
    let list = [...tracks]
    if (activeGenre !== 'All') list = list.filter(t => t.genre === activeGenre)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t => t.title.toLowerCase().includes(q))
    }
    switch (sort) {
      case 'title':    list.sort((a, b) => a.title.localeCompare(b.title)); break
      case 'duration': list.sort((a, b) => a.duration - b.duration); break
      case 'bpm':      list.sort((a, b) => a.bpm - b.bpm); break
      case 'newest':   list.sort((a, b) => b.year - a.year); break
    }
    return list
  }, [activeGenre, search, sort])

  return (
    <div
      className="min-h-screen px-4 sm:px-10 pb-36"
      style={{ background: 'var(--color-bg)', paddingTop: 100 }}
    >
      <div className="max-w-7xl mx-auto">

        {/* ── Heading ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-baseline gap-4 mb-10"
        >
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontStyle:  'italic',
            fontSize:   'clamp(32px, 5vw, 64px)',
            color:      'var(--color-text)',
          }}>
            Music Library
          </h1>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize:   12,
            color:      'var(--color-muted)',
            background: 'var(--color-surface-2)',
            padding:    '2px 8px',
            borderRadius: 20,
          }}>
            {filtered.length} {filtered.length === 1 ? 'track' : 'tracks'}
          </span>
        </motion.div>

        {/* ── Controls ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 mb-10">
          {/* Genre pills */}
          <div className="flex flex-wrap gap-2">
            {GENRES.map(g => {
              const active = g === activeGenre
              return (
                <button
                  key={g}
                  onClick={() => setActiveGenre(g)}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize:   11,
                    padding:    '5px 14px',
                    borderRadius: 20,
                    border:     active ? '1px solid var(--color-accent)' : '1px solid rgba(240,236,224,0.08)',
                    background: active ? 'var(--color-accent)' : 'var(--color-surface-2)',
                    color:      active ? '#0a0a0a' : 'var(--color-muted)',
                    cursor:     'pointer',
                    fontWeight: active ? 500 : 400,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {g}
                </button>
              )
            })}
          </div>

          {/* Search + Sort */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search tracks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg text-sm outline-none"
              style={{
                background: 'var(--color-surface)',
                border:     '1px solid rgba(240,236,224,0.08)',
                color:      'var(--color-text)',
                fontFamily: 'var(--font-mono)',
                fontSize:   12,
              }}
            />
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="px-4 py-2 rounded-lg text-sm outline-none"
              style={{
                background: 'var(--color-surface)',
                border:     '1px solid rgba(240,236,224,0.08)',
                color:      'var(--color-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize:   12,
                cursor:     'pointer',
                minWidth:   160,
              }}
            >
              <option value="default">Default</option>
              <option value="title">Title A → Z</option>
              <option value="duration">Duration ↑</option>
              <option value="bpm">BPM ↑</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {/* ── Deck of cards ────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle:  'italic',
                fontSize:   24,
                color:      'var(--color-muted)',
                textAlign:  'center',
                paddingTop: 80,
              }}
            >
              No tracks found
            </motion.p>
          ) : (
            <motion.div
              key={`${activeGenre}-${search}-${sort}`}
              style={{
                display:               'grid',
                gridTemplateColumns:   `repeat(auto-fill, minmax(${CARD_TOTAL_W}px, 1fr))`,
                gap:                   '28px 20px',
                paddingBottom:         40,
              }}
            >
              {filtered.map((track, i) => {
                const origIdx = tracks.indexOf(track)
                return (
                  <DeckCard
                    key={track.id}
                    track={track}
                    index={i}
                    allTracks={filtered}
                    tilt={TILTS[origIdx] ?? 0}
                  />
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
