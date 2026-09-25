export function percent(part, whole) {
  return whole > 0 ? Math.round(part / whole * 100) : null
}

export function growth(current, previous) {
  if (previous === 0) return current === 0 ? { text: 'No change', direction: 'flat' } : { text: 'New activity', direction: 'new' }
  const change = Math.round((current - previous) / previous * 100)
  return { text: `${change > 0 ? '+' : ''}${change}%`, direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat' }
}
