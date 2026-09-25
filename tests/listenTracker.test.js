import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { ListenTracker } from '../src/lib/listenTracker.js'

function tracker() {
  const events = []
  return { events, value: new ListenTracker('track-a', event => events.push(event), randomUUID) }
}

test('counts a listen only after 30 seconds of audio advancing', () => {
  const { value, events } = tracker()
  value.start(0, 0)
  value.tick(29, 29000)
  assert.deepEqual(events.map(e => e.type), ['start'])
  value.tick(30, 30000)
  assert.deepEqual(events.map(e => e.type), ['start', 'listen'])
  value.tick(35, 35000)
  assert.equal(events.filter(e => e.type === 'listen').length, 1)
})

test('pauses and seeks do not add heard time or new starts', () => {
  const { value, events } = tracker()
  value.start(0, 0)
  value.tick(10, 10000)
  value.pause(10, 10000)
  value.start(10, 60000)
  value.seek(80, 61000)
  value.tick(90, 71000)
  assert.deepEqual(events.map(e => e.type), ['start'])
  value.tick(100, 81000)
  assert.deepEqual(events.map(e => e.type), ['start', 'listen'])
})

test('short natural end counts a listen and completion once', () => {
  const { value, events } = tracker()
  value.start(0, 0)
  value.finish(12, 12, 12000)
  assert.deepEqual(events.map(e => e.type), ['start', 'listen', 'complete'])
  value.finish(12, 12, 12000)
  assert.equal(events.length, 3)
})

test('repeat starts a separate playback and listen', () => {
  const { value, events } = tracker()
  value.start(0, 0)
  value.tick(30, 30000)
  value.finish(42, 42, 42000)
  value.start(0, 43000)
  value.tick(30, 73000)
  assert.deepEqual(events.map(e => e.type), ['start', 'listen', 'complete', 'start', 'listen'])
  assert.notEqual(events[0].playbackId, events[3].playbackId)
})

test('stopping and replaying starts a separate playback without a completion', () => {
  const { value, events } = tracker()
  value.start(0, 0)
  value.tick(10, 10000)
  value.pause(10, 10000)
  value.reset()
  value.start(0, 11000)
  assert.deepEqual(events.map(e => e.type), ['start', 'start'])
  assert.notEqual(events[0].playbackId, events[1].playbackId)
})
