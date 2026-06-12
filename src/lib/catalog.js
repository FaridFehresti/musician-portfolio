/* Pressing-style catalog numbers ("LP-007") derived from a track's position
   in the full catalogue — purely cosmetic, stable as long as track order is. */
export function catalogNumber(trackId, tracks) {
  const i = tracks.findIndex((t) => t.id === trackId)
  return `LP-${String((i >= 0 ? i : tracks.length) + 1).padStart(3, '0')}`
}
