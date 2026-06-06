import { create } from 'zustand'
import { Howl, Howler } from 'howler'

/* ── Global Howler config ─────────────────────────────────────────── */
Howler.autoSuspend  = false   // never suspend AudioContext
Howler.autoUnlock   = true    // auto-unlock on first user gesture (default, explicit)

let tickInterval = null

function clearTick() {
  if (tickInterval) { clearInterval(tickInterval); tickInterval = null }
}

function startTick(get) {
  clearTick()
  tickInterval = setInterval(() => {
    const h = get().howl
    if (h?.playing()) set_ref({ currentTime: h.seek() ?? 0 })
  }, 250)
}

/* Reference to the set function, set during store creation */
let set_ref = null

export const usePlayerStore = create((set, get) => {
  set_ref = set   // capture so startTick can call it

  return {
    /* ── State ─────────────────────────────────────────────────── */
    currentTrack: null,
    queue:        [],
    queueIndex:   -1,
    isPlaying:    false,
    isPaused:     false,
    volume:       0.8,
    currentTime:  0,
    duration:     0,
    howl:         null,
    audioError:   null,   // holds a user-visible error string

    /* ── Actions ────────────────────────────────────────────────── */

    setQueue(tracks) { set({ queue: tracks }) },

    loadTrack(track) {
      const { howl, volume } = get()

      if (howl) { howl.stop(); howl.unload() }
      clearTick()
      set({ audioError: null })

      if (!track.src) {
        set({
          currentTrack: track,
          howl: null, isPlaying: false, isPaused: false,
          currentTime: 0, duration: track.duration || 0,
          queueIndex: get().queue.findIndex(t => t.id === track.id),
        })
        return
      }

      const newHowl = new Howl({
        src:   [track.src],
        html5: true,          // use HTML5 Audio so large MP3s stream
        volume,
        format: ['mp3', 'wav', 'ogg'],

        onplay() {
          set({ isPlaying: true, isPaused: false, audioError: null })
          startTick(get)
        },

        onpause() {
          set({ isPlaying: false, isPaused: true })
          clearTick()
        },

        onstop() {
          set({ isPlaying: false, isPaused: false, currentTime: 0 })
          clearTick()
        },

        onend() {
          set({ isPlaying: false, isPaused: false, currentTime: 0 })
          clearTick()
          // Small delay so state settles before loading next
          setTimeout(() => get().next(), 50)
        },

        onload() {
          set({ duration: newHowl.duration() })
        },

        onloaderror(_id, err) {
          console.error('[Howler] Load error:', err, track.src)
          set({
            isPlaying: false, isPaused: false,
            audioError: `Could not load audio file. (${err})`,
          })
        },

        onplayerror(_id, err) {
          console.error('[Howler] Play error:', err)
          // Try to unlock AudioContext and retry once
          Howler.ctx?.resume?.().then(() => {
            newHowl.once('unlock', () => newHowl.play())
          })
          set({ audioError: 'Browser blocked playback — click anywhere to unlock audio.' })
        },
      })

      const idx = get().queue.findIndex(t => t.id === track.id)

      set({
        currentTrack: track,
        howl:         newHowl,
        isPlaying:    false,
        isPaused:     false,
        currentTime:  0,
        duration:     track.duration || 0,
        queueIndex:   idx,
      })

      newHowl.play()
    },

    play() {
      const { howl } = get()
      if (!howl) return
      // Resume the AudioContext first if suspended (Safari / strict browsers)
      if (Howler.ctx?.state === 'suspended') {
        Howler.ctx.resume().then(() => howl.play())
      } else {
        howl.play()
      }
    },

    pause()  { get().howl?.pause()  },
    stop()   { get().howl?.stop()   },

    seek(seconds) {
      const { howl } = get()
      if (!howl) return
      howl.seek(seconds)
      set({ currentTime: seconds })
    },

    setVolume(v) {
      set({ volume: v })
      const { howl } = get()
      if (howl) howl.volume(v)
      Howler.volume(v)   // also set global so new Howls inherit it
    },

    next() {
      const { queue, queueIndex, loadTrack } = get()
      if (!queue.length) return
      loadTrack(queue[(queueIndex + 1) % queue.length])
    },

    prev() {
      const { queue, queueIndex, currentTime, howl, loadTrack } = get()
      if (!queue.length) return
      if (currentTime > 3) { howl?.seek(0); set({ currentTime: 0 }); return }
      const prevIdx = ((queueIndex - 1) + queue.length) % queue.length
      loadTrack(queue[prevIdx])
    },
  }
})
