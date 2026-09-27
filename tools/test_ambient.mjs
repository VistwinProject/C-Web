import test from 'node:test';
import assert from 'node:assert/strict';
import {ambientAt,ambientBackground} from '../ambient-light.mjs';
test('daylight fades across sleep and dawn without chapter-boundary jumps',()=>{
 assert.equal(ambientAt(30).day,1);assert.equal(ambientAt(45).day,0);
 assert.equal(ambientAt(60).day,0);assert.equal(ambientAt(78).day,1);
 for(const t of [30,45,60,78])assert.ok(Math.abs(ambientAt(t+.001).day-ambientAt(t-.001).day)<.001);
 for(let t=45;t<=60;t+=.1)assert.equal(ambientAt(t).day,0);
 let previous=1;
 for(let t=30;t<=45;t+=.1){const value=ambientAt(t).day;assert.ok(value<=previous);previous=value;}
 for(let t=0;t<=90;t+=.1){assert.ok(ambientAt(t).day>=0&&ambientAt(t).day<=1);assert.ok(!ambientBackground(t).includes('NaN'));}
});
