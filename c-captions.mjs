import {ending} from './ending.mjs?v=mp3-20261007';
import {intro} from './intro.mjs?v=mp3-20261007';
import {narration} from './c-story.mjs?v=mp3-20261007';
import {buildCaptions,captionAt} from './caption-timeline.mjs?v=slow-1';
import {voiceTiming} from './voice-timing.mjs';
const clips=narration.map((n,i)=>({id:'c-'+i,text:n[2],start:n[3],end:n[3]+voiceTiming.durations[i]}));
export const cues=buildCaptions(clips,28);
const introCues=buildCaptions([{id:"c-intro",text:intro.text,start:intro.start,end:intro.end}],28);
const endingCues=[...buildCaptions([{id:"c-ending",text:ending.summaryText,start:ending.start,end:ending.summaryEnd}],28),
 {id:"c-farewell",text:ending.farewellText,start:ending.farewellStart,end:Infinity,closing:true}];
let previous;
export function updateCaption(time){renderCaption(cues,time);}
export function updateIntroCaption(time){renderCaption(introCues,time);}
export function updateOutroCaption(time){renderCaption(endingCues,time);}
function renderCaption(timeline,time){
 const {cue,opacity}=captionAt(timeline,time),host=document.getElementById('narrative');
 const key=cue?.id||'idle';
 if(key!==previous){previous=key;host.classList.toggle('is-speaking',!!cue);host.classList.toggle('is-closing',!!cue?.closing);document.getElementById('narrativeText').textContent=cue?.text||'';}
 host.querySelector('.caption-content').style.opacity=String(opacity);
}
