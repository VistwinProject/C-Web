import test from 'node:test';
import assert from 'node:assert/strict';
import {intro} from '../intro.mjs';
import {ending} from '../ending.mjs';
import {storyTime,showTime,isIntro,entryActive,isOutro,INTRO_DURATION,OUTRO_START,SHOW_DURATION,closingFade} from '../presentation-timeline.mjs';
test('introduction precedes original voice, interaction and all three chapters',()=>{
 assert.ok(intro.end<INTRO_DURATION);assert.equal(storyTime(0),0);assert.equal(storyTime(INTRO_DURATION-.01),0);
 assert.equal(entryActive(INTRO_DURATION+3),true);assert.equal(storyTime(INTRO_DURATION+12),12);
 assert.equal(isIntro(INTRO_DURATION),false);
 for(const t of [0,2,3,15,30,60,90])assert.equal(storyTime(showTime(t)),t);
 assert.equal(showTime(30),INTRO_DURATION+30);assert.equal(showTime(60),INTRO_DURATION+60);
});
test('ending preserves final environment, holds after voice and never wraps',()=>{
 assert.equal(OUTRO_START,INTRO_DURATION+90);assert.ok(OUTRO_START+ending.end<SHOW_DURATION-2);
 assert.equal(isOutro(OUTRO_START),true);assert.equal(storyTime(SHOW_DURATION),90);
 assert.equal(closingFade(OUTRO_START),0);assert.equal(closingFade(SHOW_DURATION),1);
});
