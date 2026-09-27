// The ten-second visual experience overlaps narration; it never holds the voice clock.
export const ENTRY_START=3,ENTRY_DURATION=10,SHOW_DURATION=90;
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
export function storyTime(playhead){return playhead;}
export function showTime(story){return story;}
export function entryActive(playhead){return playhead>=ENTRY_START&&playhead<ENTRY_START+ENTRY_DURATION;}
export function entryState(playhead,reduced=false){
 const elapsed=playhead-ENTRY_START;
 const position=[-.38,.83,-.48];
 const fade=smooth(elapsed/.8)*(1-smooth((storyTime(playhead)-25)/4));
 const stride=0;
 return {elapsed,position,stride,lying:false,occupantVisible:false,opacity:fade,floor:smooth((elapsed-.5)/2.5)*fade,bed:smooth((elapsed-3.2)/3.8)*fade,active:entryActive(playhead)};
}
