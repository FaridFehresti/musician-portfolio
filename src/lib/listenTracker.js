// One tracker represents one playback, including pauses and seeks. Only time
// during which both the clock and audio position advance counts as heard.
export class ListenTracker {
  constructor(trackId, send, id = () => crypto.randomUUID()) {
    this.trackId = trackId
    this.send = send
    this.id = id
    this.reset()
  }

  reset() {
    this.playbackId = this.id()
    this.heard = 0
    this.started = false
    this.listened = false
    this.finished = false
    this.lastTime = null
    this.lastPosition = null
  }

  emit(type) {
    this.send({ id: this.id(), playbackId: this.playbackId, type, trackId: this.trackId })
  }

  start(position, now) {
    if (!this.started) { this.started = true; this.emit('start') }
    this.lastTime = now
    this.lastPosition = position
  }

  tick(position, now) {
    if (this.lastTime === null || !Number.isFinite(position)) return
    const wall = Math.max(0, (now - this.lastTime) / 1000)
    const audio = Math.max(0, position - this.lastPosition)
    this.heard += Math.min(wall, audio)
    this.lastTime = now
    this.lastPosition = position
    if (!this.listened && this.heard >= 30) {
      this.listened = true
      this.emit('listen')
    }
  }

  pause(position, now) {
    this.tick(position, now)
    this.lastTime = null
    this.lastPosition = null
  }

  seek(position, now) {
    this.lastTime = now
    this.lastPosition = position
  }

  finish(duration, position, now) {
    if (this.finished || !this.started) return
    this.tick(position, now)
    if (!this.listened && duration > 0 && duration <= 30) {
      this.listened = true
      this.emit('listen')
    }
    this.finished = true
    this.emit('complete')
    this.reset()
  }
}
