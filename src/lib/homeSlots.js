/* The home hero deck is a fixed set of card piles: 3 stacks (top row) and
   3 fans (bottom row). Each track is assigned to one slot (or none = not on
   home). Shared by the public CardTable and the admin Music manager. */

export const HOME_SLOTS = [
  { key: 'stack-1', label: 'Stack 1', kind: 'stack' },
  { key: 'stack-2', label: 'Stack 2', kind: 'stack' },
  { key: 'stack-3', label: 'Stack 3', kind: 'stack' },
  { key: 'fan-1',   label: 'Fan 1',   kind: 'fan' },
  { key: 'fan-2',   label: 'Fan 2',   kind: 'fan' },
  { key: 'fan-3',   label: 'Fan 3',   kind: 'fan' },
]

export const HOME_SLOT_KEYS = HOME_SLOTS.map(s => s.key)

export function slotMeta(key) {
  return HOME_SLOTS.find(s => s.key === key) || null
}

/* Split a list into 6 sequential, near-even groups and return the slot key for
   each position (preserves reading order). Used to seed/migrate existing
   tracks into slots so the deck looks the same before any manual arranging. */
export function assignDefaultSlots(list) {
  const n = HOME_SLOTS.length
  const out = []
  let start = 0
  for (let g = 0; g < n; g++) {
    const size = Math.ceil((list.length - start) / (n - g))
    for (let k = 0; k < size; k++) out[start + k] = HOME_SLOTS[g].key
    start += size
  }
  return out
}

/* Group home tracks by slot, ordered by `sort` within each slot. Returns
   { bySlot, ordered, startIndex } — ordered is the flat visual order, and
   startIndex[key] is the running count before that slot (for card numbering). */
export function groupBySlot(tracks) {
  const bySlot = {}
  HOME_SLOTS.forEach(s => { bySlot[s.key] = [] })
  for (const t of tracks) {
    if (bySlot[t.homeSlot]) bySlot[t.homeSlot].push(t)
  }
  for (const key of HOME_SLOT_KEYS) bySlot[key].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
  const ordered = HOME_SLOTS.flatMap(s => bySlot[s.key])
  const startIndex = {}
  let acc = 0
  for (const s of HOME_SLOTS) { startIndex[s.key] = acc; acc += bySlot[s.key].length }
  return { bySlot, ordered, startIndex }
}
