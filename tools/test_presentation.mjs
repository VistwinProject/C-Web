import test from 'node:test';
import assert from 'node:assert/strict';
import {intro} from '../intro.mjs';
import {ending} from '../ending.mjs';
import {voiceTiming} from '../voice-timing.mjs';
import {storyTime,showTime,isIntro,entryActive,isOutro,INTRO_DURATION,OUTRO_START,SHOW_DURATION,closingFade} from '../presentation-timeline.mjs';
test('intro, voice and shortened chapters retain round-trip seeking',()=>{
 assert.ok(intro.end<INTRO_DURATION);assert.equal(storyTime(0),0);assert.equal(storyTime(INTRO_DURATION-.01),0);
 assert.equal(entryActive(INTRO_DURATION+3),true);assert.equal(isIntro(INTRO_DURATION),false);
 for(const t of [0,2,3,15,30,45,60,75,90])assert.ok(Math.abs(storyTime(showTime(t))-t)<1e-9);
 for(let i=1;i<3;i++)assert.equal(showTime(i*30),INTRO_DURATION+voiceTiming.chapterStarts[i]);
});
test('each full-speed recording fits before its chapter ends',()=>{
 for(let i=0;i<3;i++){
  assert.ok(voiceTiming.voiceStarts[i]>=voiceTiming.chapterStarts[i]);
  assert.ok(voiceTiming.voiceStarts[i]+voiceTiming.durations[i]<voiceTiming.chapterStarts[i+1]);
 }
});
test('ending holds final environment and text-only farewell without wrapping',()=>{
 assert.equal(OUTRO_START,INTRO_DURATION+voiceTiming.bodyDuration);
 assert.ok(ending.summaryEnd<ending.farewellStart);
 assert.equal(ending.sectionDuration-ending.farewellStart,3);
 assert.equal(isOutro(OUTRO_START),true);assert.equal(storyTime(SHOW_DURATION),90);
 assert.equal(closingFade(OUTRO_START),0);assert.equal(closingFade(SHOW_DURATION),1);
 assert.ok(SHOW_DURATION<138);assert.ok(OUTRO_START+ending.end<SHOW_DURATION-2);
});
