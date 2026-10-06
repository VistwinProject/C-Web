import test from 'node:test';
import assert from 'node:assert/strict';
import {narration} from '../c-story.mjs';
import {cues} from '../c-captions.mjs';
import {captionAt} from '../caption-timeline.mjs';
test('C captions preserve all narration and stop at measured voice endpoints',()=>{
 for(let i=0;i<3;i++){const parts=cues.filter(c=>c.id.startsWith('c-'+i+'-'));assert.equal(parts.map(c=>c.text).join(''),narration[i][2]);assert.equal(parts[0].start,narration[i][3]);assert.ok(parts.every(c=>[...c.text].length<=28));assert.equal(captionAt(cues,parts.at(-1).end).cue,null);}
 assert.equal(captionAt(cues,0).cue,null);assert.ok(captionAt(cues,4).cue);assert.ok(captionAt(cues,narration[1][3]+1).cue.id.startsWith('c-1'));assert.ok(captionAt(cues,narration[2][3]+1).cue.id.startsWith('c-2'));assert.deepEqual(captionAt(cues,4),captionAt(cues,4));
});
