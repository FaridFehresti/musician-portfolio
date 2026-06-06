import { COPY } from './config'
import styles from './lab.module.css'

/* Static, animation-free fallback for users who prefer reduced motion (or
 * when WebGL is unavailable). Delivers the same content — title + a way into
 * the music — with no rAF loop and no GPU work. */
export function ReducedMotionScene({ onPlay, onNavigate }) {
  return (
    <div className={styles.reducedRoot}>
      <div className={styles.heroInner}>
        <p className={styles.kicker}>{COPY.subtitle}</p>
        <h1 className={styles.title}>{COPY.title}</h1>
        <p className={styles.reducedNote}>Motion reduced — step straight into the music.</p>
        <div className={styles.ctaRow}>
          <button className={styles.playBtn} onClick={onPlay}>▶ Play</button>
          <button className={styles.ghostBtn} onClick={() => onNavigate('/library')}>Library</button>
          <button className={styles.ghostBtn} onClick={() => onNavigate('/now-playing')}>Now Playing</button>
        </div>
      </div>
    </div>
  )
}
