import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraPose} from '../camera-timeline.mjs';
import {shots} from '../camera-shots.mjs';

test('camera remains continuous at every cue and independent of playback history',()=>{
 for(let i=1;i<shots.length;i++){
 const t=shots[i].time,a=cameraPose(shots,t-.0001),b=cameraPose(shots,t+.0001);
 for(const key of ['zoom','yaw','pitch'])assert.ok(Math.abs(a[key]-b[key])<.001);
 a.target.forEach((v,k)=>assert.ok(Math.abs(v-b.target[k])<.001));
 }
 const first=cameraPose(shots,12);cameraPose(shots,80);assert.deepEqual(cameraPose(shots,12),first);
 assert.deepEqual(cameraPose(shots,20,true),cameraPose(shots,0));
 assert.deepEqual(cameraPose(shots,999),cameraPose(shots,shots.at(-1).time));
 assert.deepEqual(shots.at(-1).target,shots[0].target);
});

test("spoken object gets a moderate close-up, followed by a full-room hold",()=>{
 for(const t of [8, 12, 20])assert.ok(cameraPose(shots,t).zoom>=1.3);
 for(const t of [0, 5, 15, 25, 33, 58, 67.5, 75, 90]){const pose=cameraPose(shots,t);assert.equal(pose.zoom,1);assert.deepEqual(pose.target,shots[0].target);}
 assert.ok(shots.every(s=>s.yaw===0&&s.pitch===0&&s.zoom<=1.5));
});

import {focusEmphasis} from '../focus-emphasis.mjs';
test('focus stays on the named object, fades continuously and respects pause/reduced motion',()=>{
 const cue=shots.find(s=>s.focus),t=cue.time;
 assert.equal(focusEmphasis(shots,t).weights[cue.focus],1);
 const paused=focusEmphasis(shots,t+.1);focusEmphasis(shots,90);assert.deepEqual(focusEmphasis(shots,t+.1),paused);
 assert.equal(focusEmphasis(shots,t,true).pulse,focusEmphasis(shots,t+1,true).pulse);
 for(const s of shots.slice(1)) {const a=focusEmphasis(shots,s.time-.0001),b=focusEmphasis(shots,s.time+.0001);for(const k of new Set([...Object.keys(a.weights),...Object.keys(b.weights)]))assert.ok(Math.abs((a.weights[k]||0)-(b.weights[k]||0))<.001);}
 assert.deepEqual(focusEmphasis(shots,0).weights,{});assert.deepEqual(focusEmphasis(shots,999).weights,{});
});

test('sleep has one gentle held push and dawn remains completely still',()=>{
 const home=cameraPose(shots,30);
 for(let t=30;t<=60;t+=.25)assert.ok(cameraPose(shots,t).zoom<=1.12);
 const hold=cameraPose(shots,39);
 assert.equal(hold.zoom,1.12);
 for(let t=39;t<=51;t+=.5)assert.deepEqual(cameraPose(shots,t),hold);
 for(let t=60;t<=90;t+=.25){const p=cameraPose(shots,t);assert.equal(p.zoom,home.zoom);assert.deepEqual(p.target,home.target);assert.equal(p.yaw,0);assert.equal(p.pitch,0);}
 const pushes=shots.filter((s,i)=>i&&s.time>=30&&s.zoom>shots[i-1].zoom);
 assert.equal(pushes.length,1);
});
