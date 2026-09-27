import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleEnvironment as sample, narration} from '../c-story.mjs';

test('sleep and waking actually change AC and lighting states',()=>{
 const day=sample(29),sleep=sample(55),wake=sample(85);
 assert.ok(sleep.acPower<day.acPower);
 assert.ok(sleep.light<day.light);
 assert.ok(wake.light>sleep.light);
 assert.ok(wake.acSet>sleep.acSet);
 assert.equal(sample(0).acPower,0);
});
test('AC setting drives the temperature illustration and hot supply does not cool it',()=>{
 assert.ok(sample(55,{target:24}).temp<sample(55,{target:27}).temp);
 assert.ok(sample(55,{fresh:32}).temp>sample(55,{fresh:20}).temp);
 assert.ok(sample(25,{heat:38}).temp>sample(25,{heat:28}).temp);
});
test('chapter boundaries remain continuous and compatible with three TD scenes',()=>{
 assert.deepEqual(narration.map(c=>c[0]),[0,30,60]);
 for(const t of [8,15,18,30,45,60,78]){
  const before=sample(t-.001),after=sample(t+.001);
  for(const key of ['temp','acSet','acPower','light','curtain'])
   assert.ok(Math.abs(after[key]-before[key])<.01,`${key} jumps at ${t}`);
 }
 for(let t=0;t<=90;t+=.25){
  const s=sample(t);
  assert.ok(Object.values(s).every(Number.isFinite));
  for(const key of ['acPower','light','curtain'])assert.ok(s[key]>=0&&s[key]<=1);
 }
});

test('night has no solar input and dawn returns gradually',()=>{
 for(let t=30;t<=60;t+=.25)assert.equal(sample(t).solar,0);
 assert.ok(sample(25).solar>0);assert.ok(sample(60.1).solar<.001);assert.ok(sample(75).solar>sample(65).solar);
});
