import test from 'node:test';
import assert from 'node:assert/strict';
import {storyTime,showTime,entryState,entryActive,SHOW_DURATION} from '../entry-timeline.mjs';
import {projectionValue,windowHeatValue} from '../entry-projection.mjs';
import {voiceTiming} from '../voice-timing.mjs';
test('compressed chapters preserve simulation boundaries and ten-second reveal',()=>{
 assert.equal(storyTime(0),0);assert.equal(entryActive(3),true);assert.equal(entryActive(13),false);
 assert.ok(SHOW_DURATION<90);assert.equal(showTime(90),SHOW_DURATION);
 for(const t of [0,2,3,15,30,45,60,75,90])assert.ok(Math.abs(storyTime(showTime(t))-t)<1e-9);
 for(let i=0;i<3;i++)assert.equal(showTime(i*30),voiceTiming.chapterStarts[i]);
});
test('projection reveal stays deterministic without a placeholder person',()=>{
 assert.equal(entryState(0).opacity,0);assert.equal(entryState(3).floor,0);
 assert.ok(entryState(6).floor>entryState(6).bed);assert.equal(entryState(13).bed,1);
 const paused=entryState(8);entryState(60);assert.deepEqual(entryState(8),paused);
 assert.equal(entryState(8,true).stride,0);assert.equal(entryState(40).opacity,0);assert.equal(entryState(100).floor,0);
 assert.equal(paused.occupantVisible,false);assert.equal(paused.lying,false);assert.deepEqual(paused.position,[-.38,.83,-.48]);
});
test('bed stays between cold floor and window warmth without phantom body heat',()=>{
 const state=entryState(10),bed=projectionValue(-.38,.28,state,true,0);
 assert.ok(bed>.25&&bed<.4);
 assert.equal(bed,projectionValue(-.38,.28,{...state,lying:true,opacity:1},true,0));
 assert.ok(projectionValue(-1.18,.88,state,false,0)<bed);
 assert.ok(projectionValue(.9,.1,state,false,1)>bed);
 assert.ok(projectionValue(.3,.28,state,true,1)<.47);
});
import {windowCorners,sunFootprint,sunLanding,sunDirection,sunFloorY} from '../sunlight-field.mjs';
test('the warm footprint is the angled projection of the actual window, not a radial hotspot',()=>{
 for(let i=0;i<4;i++){
  const a=windowCorners[i],b=sunFootprint[i];assert.deepEqual(b,sunLanding(a));assert.ok(Math.abs(b[1]-sunFloorY)<1e-9);
  assert.ok(b[0]<a[0]);assert.ok(b[2]<a[2]);
  assert.ok(Math.abs((b[0]-a[0])/(b[1]-a[1])-sunDirection[0]/sunDirection[1])<1e-9);
 }
 const center=sunLanding([1.805,1.51,.32]);
 assert.ok(windowHeatValue(center[0],center[2])>.95);
 assert.equal(windowHeatValue(1.75,.3),0);assert.equal(windowHeatValue(-.38,.3),0);
 assert.ok(projectionValue(center[0],center[2],entryState(10),false)>.75);
});

import {blurHeat} from '../sunlight-field.mjs';
test('heat spreads beyond direct-light edge without creating a sharp isolated block',()=>{
 const field=new Float32Array(21*21);field[10*21+10]=1;
 const blurred=blurHeat(field,21,21,4);
 assert.ok(blurred[10*21+11]>0);assert.ok(blurred[10*21+10]<1);
 assert.ok(blurred[10*21+11]>blurred[10*21+14]);
 assert.equal(blurred[10*21+11],blurred[10*21+9]);
});

test('mattress has a varied cool field and night excludes every daylight contribution',()=>{
 const state=entryState(10),bed=[];
 for(let x=-1;x<.3;x+=.1)for(let z=-.5;z<1.2;z+=.1)bed.push(projectionValue(x,z,state,true,.3));
 assert.ok(Math.max(...bed)-Math.min(...bed)>.09);
 assert.ok(Math.max(...bed)<.48);
 for(const isBed of [true,false]){
  const dark={solar:0,acPower:.3};
  assert.equal(projectionValue(.9,.2,state,isBed,1,dark),projectionValue(.9,.2,state,isBed,0,dark));
 }
});

import {narration} from '../c-story.mjs';
import {cues} from '../c-captions.mjs';
test('audio runs at original speed across visual reveal with no split or restart',()=>{
 const parts=cues.filter(c=>c.id.startsWith('c-0-'));
 assert.equal(parts.map(c=>c.text).join(''),narration[0][2]);
 assert.equal(parts[0].start,.6);
 assert.equal(parts.at(-1).end,narration[0][3]+voiceTiming.durations[0]);
 assert.ok(parts[0].start<3&&parts.at(-1).end>13);
});
