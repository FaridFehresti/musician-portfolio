import { create } from 'zustand'
import { Howl, Howler } from 'howler'
import { api } from '../lib/api'

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

/* pick a random index that isn't the current one (for shuffle) */
function randomOther(len, cur) {
  if (len <= 1) return 0
  let r = Math.floor(Math.random() * (len - 1))
  if (r >= cur) r += 1
  return r
}

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
    shuffle:      false,
    repeat:       'off',    // 'off' | 'all' | 'one'
    currentTime:  0,
    duration:     0,
    howl:         null,
    audioError:   null,   // holds a user-visible error string

    /* ── Actions ────────────────────────────────────────────────── */

    setQueue(tracks) { set({ queue: tracks }) },

    loadTrack(track, { autoplay = true } = {}) {
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

      let streamCounted = false   // one stream per loaded track (not per resume)

      const newHowl = new Howl({
        src:   [track.src],
        html5: true,          // use HTML5 Audio so large MP3s stream
        volume,
        format: ['mp3', 'wav', 'ogg'],

        onplay() {
          set({ isPlaying: true, isPaused: false, audioError: null })
          startTick(get)
          if (!streamCounted) {
            streamCounted = true
            // fire-and-forget; analytics must never disrupt playback
            if (track.id) Promise.resolve(api.recordPlay(track.id)).catch(() => {})
          }
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
          const { repeat, shuffle, queue, queueIndex } = get()
          if (repeat === 'one') { newHowl.seek(0); newHowl.play(); return }   // loop this track
          // stop at the end of the queue unless repeating all (or shuffling)
          if (!shuffle && repeat !== 'all' && queueIndex >= queue.length - 1) return
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
      newHowl.loop(get().repeat === 'one')

      set({
        currentTrack: track,
        howl:         newHowl,
        isPlaying:    false,
        isPaused:     false,
        currentTime:  0,
        duration:     track.duration || 0,
        queueIndex:   idx,
      })

      if (autoplay) newHowl.play()
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
      const { queue, queueIndex, shuffle, loadTrack } = get()
      if (!queue.length) return
      const i = shuffle ? randomOther(queue.length, queueIndex) : (queueIndex + 1) % queue.length
      loadTrack(queue[i])
    },

    prev() {
      const { queue, queueIndex, currentTime, howl, shuffle, loadTrack } = get()
      if (!queue.length) return
      if (currentTime > 3) { howl?.seek(0); set({ currentTime: 0 }); return }
      const i = shuffle
        ? randomOther(queue.length, queueIndex)
        : ((queueIndex - 1) + queue.length) % queue.length
      loadTrack(queue[i])
    },

    toggleShuffle() { set(s => ({ shuffle: !s.shuffle })) },

    cycleRepeat() {
      const repeat = { off: 'all', all: 'one', one: 'off' }[get().repeat]
      set({ repeat })
      get().howl?.loop(repeat === 'one')
    },
  }
})
