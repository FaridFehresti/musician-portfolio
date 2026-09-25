import { useEffect, useState } from 'react'
import { Activity, ArrowUpRight, CircleHelp, Headphones, MousePointer2, Play, Repeat2, Share2 } from 'lucide-react'
import { api } from '../../lib/api'
import { growth, percent } from './analyticsMath'

const WINDOWS = [[7, '7 days'], [30, '30 days'], [90, '90 days']]
const METRICS = [
  { key: 'listens', label: 'Meaningful listens', short: 'Listens', color: 'mint', icon: Headphones },
  { key: 'starts', label: 'Play starts', short: 'Starts', color: 'blue', icon: Play },
  { key: 'completions', label: 'Completions', short: 'Completed', color: 'violet', icon: Repeat2 },
  { key: 'shares', label: 'Shares', short: 'Shares', color: 'rose', icon: Share2 },
  { key: 'clicks', label: 'Outbound clicks', short: 'Clicks', color: 'amber', icon: MousePointer2 },
]
const fmt = n => new Intl.NumberFormat().format(n ?? 0)
const rate = value => value == null ? '—' : `${value}%`

export function AnalyticsSection() {
  const [days, setDays] = useState(7)
  const [metric, setMetric] = useState('listens')
  const [sort, setSort] = useState('listens')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let live = true
    api.analytics(days).then(result => { if (live) { setData(result); setError(null) } })
      .catch(e => { if (live) setError(e.message || 'Could not load analytics') })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [days])

  const selected = METRICS.find(item => item.key === metric)
  const current = data?.window
  const previous = data?.previous
  const sortedTracks = data ? [...data.perTrack].sort((a, b) => (b.window[sort] || 0) - (a.window[sort] || 0) || (b.window.listens || 0) - (a.window.listens || 0)) : []
  const lastUpdated = data?.trackingSince ? new Date(data.trackingSince).toLocaleDateString() : null

  return <div className="analytics-page">
    <div className="analytics-heading">
      <div>
        <span className="admin-eyebrow"><Activity size={14} /> Audience pulse</span>
        <h2>Listening analytics</h2>
        <p>See what people play, finish, share, and visit.</p>
      </div>
      <div className="analytics-period" role="group" aria-label="Analytics date range">
        {WINDOWS.map(([value, label]) => <button type="button" key={value} aria-pressed={days === value} onClick={() => { setDays(value); setLoading(true) }}>{label}</button>)}
      </div>
    </div>

    {error && <div className="admin-alert" role="alert">{error}</div>}
    {loading && !data && <div className="admin-empty">Loading analytics…</div>}
    {data && <div aria-busy={loading}>
      <div className="analytics-hero">
        <div className="analytics-hero-main">
          <div className="analytics-hero-label"><Headphones size={18} /> Meaningful listens</div>
          <div className="analytics-hero-number">{fmt(current.listens)}</div>
          <div className="analytics-hero-foot">
            <GrowthBadge current={current.listens} previous={previous.listens} />
            <span>vs previous {days} days</span>
          </div>
        </div>
        <div className="analytics-hero-rates">
          <RateTile label="Listen rate" value={percent(current.listens, current.trackedStarts)} note="of tracked starts" />
          <RateTile label="Completion rate" value={percent(current.completions, current.trackedStarts)} note="of tracked starts" />
          <div className="analytics-hero-key">{fmt(current.trackedStarts)} tracked starts in this period</div>
        </div>
      </div>

      <div className="analytics-kpis">
        {METRICS.map(({ key, label, color, icon: Icon }) => <button className={`analytics-kpi metric-${color}`} type="button" key={key} onClick={() => setMetric(key)} aria-pressed={metric === key}>
          <span className="analytics-kpi-top"><Icon size={18} /><span>{label}</span></span>
          <strong>{fmt(current[key])}</strong>
          <span className="analytics-kpi-bottom"><GrowthBadge current={current[key]} previous={previous[key]} compact /> <span>vs prior period</span></span>
        </button>)}
      </div>

      <section className="admin-data-panel analytics-trend" aria-labelledby="trend-title">
        <div className="admin-panel-heading">
          <div><span className="admin-eyebrow">Daily activity</span><h3 id="trend-title">Trend</h3></div>
          <div className="analytics-metric-switch" role="group" aria-label="Trend metric">
            {METRICS.map(({ key, short }) => <button key={key} type="button" aria-pressed={metric === key} onClick={() => setMetric(key)}>{short}</button>)}
          </div>
        </div>
        <TrendChart daily={data.daily} previousDaily={data.previousDaily} metric={metric} label={selected.label} />
        <div className="analytics-chart-footer">
          <span><i className="analytics-line-key current" /> Current period</span>
          <span><i className="analytics-line-key prior" /> Previous period</span>
          <strong>{fmt(current[metric])} {selected.short.toLowerCase()} <span>· previous {fmt(previous[metric])}</span></strong>
        </div>
      </section>

      <div className="analytics-secondary">
        <section className="admin-data-panel analytics-funnel" aria-labelledby="journey-title">
          <div className="admin-panel-heading"><div><span className="admin-eyebrow">Listening journey</span><h3 id="journey-title">From play to finish</h3></div></div>
          <FunnelRow label="Tracked starts" value={current.trackedStarts} width={100} color="blue" />
          <FunnelRow label="Meaningful listens" value={current.listens} width={percent(current.listens, current.trackedStarts) ?? 0} color="mint" />
          <FunnelRow label="Completions" value={current.completions} width={percent(current.completions, current.trackedStarts) ?? 0} color="violet" />
          <p className="analytics-footnote">A listen means 30 seconds heard, or finishing a shorter track.</p>
        </section>
        <section className="admin-data-panel analytics-context" aria-labelledby="context-title">
          <div className="admin-panel-heading"><div><span className="admin-eyebrow">Context</span><h3 id="context-title">Reading the numbers</h3></div><CircleHelp size={18} /></div>
          <div className="analytics-context-number"><span>All-time play starts</span><strong>{fmt(data.totals.starts)}</strong></div>
          <div className="analytics-context-number"><span>Earlier starts preserved</span><strong>{fmt(data.historicalStarts)}</strong></div>
          <p>{lastUpdated ? `Engagement tracking began ${lastUpdated}.` : 'Engagement tracking has no events yet.'} Rates use tracked starts only. Days use UTC; today is still in progress.</p>
        </section>
      </div>

      <section className="admin-data-panel analytics-tracks" aria-labelledby="tracks-title">
        <div className="admin-panel-heading">
          <div><span className="admin-eyebrow">Track performance</span><h3 id="tracks-title">Your music</h3></div>
          <label className="analytics-sort">Sort by <select value={sort} onChange={e => setSort(e.target.value)}>{METRICS.map(({ key, short }) => <option key={key} value={key}>{short}</option>)}</select></label>
        </div>
        {sortedTracks.length === 0 ? <div className="admin-empty">No track activity yet.</div> : <div className="analytics-table-wrap"><table className="analytics-table">
          <thead><tr><th>Track</th><th>Starts</th><th>Listens</th><th>Listen rate</th><th>Completed</th><th>Shares</th><th>Video clicks</th><th>Listen growth</th></tr></thead>
          <tbody>{sortedTracks.map(track => <tr key={track.id}>
            <th scope="row"><div className="analytics-track-name">{track.coverArt ? <img src={track.coverArt} alt="" /> : <span className="analytics-track-placeholder">♪</span>}<span><strong>{track.title}</strong><small>{track.artist || 'Unknown artist'}{!track.exists ? ' · deleted' : ''}</small></span></div></th>
            <td>{fmt(track.window.starts)}</td><td className="analytics-emphasis">{fmt(track.window.listens)}</td>
            <td>{rate(percent(track.window.listens, track.window.trackedStarts))}</td>
            <td>{fmt(track.window.completions)}</td><td>{fmt(track.window.shares)}</td><td>{fmt(track.window.clicks)}</td>
            <td><GrowthBadge current={track.window.listens} previous={track.previous.listens} compact /></td>
          </tr>)}</tbody>
        </table></div>}
      </section>

      <section className="admin-data-panel analytics-outbound" aria-labelledby="outbound-title">
        <div className="admin-panel-heading"><div><span className="admin-eyebrow">Beyond the site</span><h3 id="outbound-title">Outbound clicks</h3></div><ArrowUpRight size={20} /></div>
        {data.outbound.length === 0 ? <div className="admin-empty">No outbound clicks in this period.</div> : <div className="analytics-outbound-list">
          {data.outbound.map((item, index) => <div key={`${item.destination}-${item.label}-${index}`} className="analytics-outbound-row">
            <span className="analytics-outbound-type">{item.destination}</span><span className="analytics-outbound-name">{item.label || 'Unlabelled link'}</span>
            <div className="analytics-outbound-bar"><span style={{ width: `${item.clicks / data.outbound[0].clicks * 100}%` }} /></div><strong>{fmt(item.clicks)}</strong>
          </div>)}
        </div>}
      </section>
    </div>}
  </div>
}

function GrowthBadge({ current, previous, compact = false }) {
  const result = growth(current, previous)
  return <span className={`analytics-growth growth-${result.direction}${compact ? ' compact' : ''}`}>{result.text}</span>
}

function RateTile({ label, value, note }) {
  return <div className="analytics-rate"><span>{label}</span><strong>{rate(value)}</strong><small>{note}</small></div>
}

function FunnelRow({ label, value, width, color }) {
  return <div className={`analytics-funnel-row metric-${color}`}><div><span>{label}</span><strong>{fmt(value)}</strong></div><div className="analytics-funnel-bar"><span style={{ width: `${Math.min(100, width)}%` }} /></div></div>
}

function TrendChart({ daily, previousDaily, metric, label }) {
  const values = daily.map(day => day[metric] || 0)
  const oldValues = previousDaily.map(day => day[metric] || 0)
  const max = Math.max(1, ...values, ...oldValues)
  const left = 38, top = 16, width = 884, height = 194
  const point = (value, index) => `${left + index / Math.max(1, values.length - 1) * width},${top + height - value / max * height}`
  const line = numbers => numbers.map((value, index) => `${index ? 'L' : 'M'}${point(value, index)}`).join(' ')
  const area = `${line(values)} L${left + width},${top + height} L${left},${top + height} Z`
  const ticks = [0, 0.5, 1]
  return <div className="analytics-chart"><svg viewBox="0 0 960 235" role="img" aria-label={`${label} each day, compared with the previous ${daily.length} days`} preserveAspectRatio="none">
    <defs><linearGradient id="analytics-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#69e2d0" stopOpacity=".35" /><stop offset="100%" stopColor="#69e2d0" stopOpacity="0" /></linearGradient></defs>
    {ticks.map(tick => <g key={tick}><line x1={left} x2={left + width} y1={top + height - tick * height} y2={top + height - tick * height} stroke="rgba(176,193,227,.15)" strokeDasharray="4 5" /><text x="30" y={top + height - tick * height + 4} textAnchor="end" fill="#91a3c5" fontSize="11">{fmt(Math.round(max * tick))}</text></g>)}
    <path d={area} fill="url(#analytics-area)" />
    <path d={line(oldValues)} fill="none" stroke="#8d94b0" strokeWidth="2" strokeDasharray="7 7" vectorEffect="non-scaling-stroke" />
    <path d={line(values)} fill="none" stroke="#69e2d0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
  </svg><div className="analytics-chart-dates"><span>{daily[0]?.day}</span><span>{daily[daily.length - 1]?.day}</span></div></div>
}
