import test from 'node:test'
import assert from 'node:assert/strict'
import { growth, percent } from '../src/pages/admin/analyticsMath.js'

test('growth handles rises, declines, and an empty comparison period', () => {
  assert.deepEqual(growth(150, 100), { text: '+50%', direction: 'up' })
  assert.deepEqual(growth(40, 100), { text: '-60%', direction: 'down' })
  assert.deepEqual(growth(5, 0), { text: 'New activity', direction: 'new' })
  assert.deepEqual(growth(0, 0), { text: 'No change', direction: 'flat' })
})

test('rates do not imply a percentage when no tracked starts exist', () => {
  assert.equal(percent(3, 4), 75)
  assert.equal(percent(0, 0), null)
})
