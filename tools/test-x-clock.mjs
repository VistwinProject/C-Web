import { test } from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../bedroom.js', import.meta.url), 'utf8')
const clock = source.slice(source.indexOf('function advanceClock(now){'), source.indexOf('function frame(now){'))
function setup() {
  const state = { last: 0, playhead: 0, time: 0, playing: true, version: 'story',
    SHOW_DURATION: 138, ranges: { story: [0,90] }, showComplete: false, lastUpdate: 0,
    storyTime: t => Math.max(0, Math.min(90, t-26)), showTime: t => t+26,
    endOrb() {}, syncPlay() {}, syncVoice() {} }
  vm.createContext(state); vm.runInContext(clock, state); return state
}
test('C clock advances during hidden-page reports without animation frames', () => {
  const s = setup(); s.advanceClock(5000); assert.equal(s.playhead, 5)
  s.advanceClock(6000); assert.equal(s.playhead, 6)
  s.playing = false; s.advanceClock(10000); assert.equal(s.playhead, 6)
  s.playing = true; s.advanceClock(11000); assert.equal(s.playhead, 7)
})
test('C stops exactly at the end after a long browser suspension', () => {
  const s = setup(); s.advanceClock(180000)
  assert.equal(s.playhead, 138); assert.equal(s.playing, false); assert.equal(s.showComplete, true)
  s.advanceClock(200000); assert.equal(s.playhead, 138)
})
