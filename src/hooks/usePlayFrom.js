import { useCallback } from 'react'
import { usePlayerStore } from '../store/playerStore'

/* Play a track in the context of a visible list: the queue becomes that
   list, so next/prev walk what the visitor was actually looking at. */
export function usePlayFrom(list) {
  return useCallback(
    (track) => {
      const { setQueue, loadTrack } = usePlayerStore.getState()
      setQueue(list)
      loadTrack(track)
    },
    [list]
  )
}
