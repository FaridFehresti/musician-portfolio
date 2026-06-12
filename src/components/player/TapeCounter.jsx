import { fmtDuration } from '../../data/tracks'

/* mm:ss readout in the style of a tape-deck counter window. */
export function TapeCounter({ seconds, className = '' }) {
  return (
    <span className={`font-mono text-[11px] tabular-nums tracking-[0.12em] text-muted ${className}`}>
      {fmtDuration(seconds)}
    </span>
  )
}
