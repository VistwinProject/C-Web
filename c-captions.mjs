import {ending} from './ending.mjs';
import {intro} from './intro.mjs';
import {narration} from './c-story.mjs?v=opening-7';
import {buildCaptions,captionAt} from './caption-timeline.mjs?v=slow-1';
const durations=[20.599,18.639,18.749];
// The measured first-phrase pause is 1.34–1.65 s in the audio file.
// Title and design explanation share uninterrupted audio across the visual interaction.
const opening=narration[0];
const clips=[
 {id:'c-0-title',text:opening[2].slice(0,opening[2].indexOf('，')+1),start:opening[3],end:3},
 {id:'c-0',text:opening[2].slice(opening[2].indexOf('，')+1),start:3,end:opening[3]+durations[0]},
 ...narration.slice(1).map((n,i)=>({id:'c-'+(i+1),text:n[2],start:n[3],end:n[3]+durations[i+1]}))
];
export const cues=buildCaptions(clips,28);
const introCues=buildCaptions([{id:"c-intro",text:intro.text,start:intro.start,end:intro.end}],28);
const endingCues=buildCaptions([{id:"c-ending",text:ending.text,start:ending.start,end:ending.end}],28);
let previous;
export function updateCaption(time){renderCaption(cues,time);}
export function updateIntroCaption(time){renderCaption(introCues,time);}
export function updateOutroCaption(time){renderCaption(endingCues,time);}
function renderCaption(timeline,time){
 const {cue,opacity}=captionAt(timeline,time),host=document.getElementById('narrative');
 const key=cue?.id||'idle';
 if(key!==previous){previous=key;host.classList.toggle('is-speaking',!!cue);document.getElementById('narrativeText').textContent=cue?.text||'';}
 host.querySelector('.caption-content').style.opacity=String(opacity);
}
