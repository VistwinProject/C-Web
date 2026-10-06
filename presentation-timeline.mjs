import {ending} from './ending.mjs?v=owner-20261007';
import {intro} from './intro.mjs';
import {storyTime as bodyStoryTime,showTime as bodyShowTime,entryActive as bodyEntryActive,SHOW_DURATION as BODY_DURATION} from './entry-timeline.mjs?v=owner-20261007';
export const INTRO_DURATION=intro.sectionDuration,OUTRO_START=INTRO_DURATION+BODY_DURATION,SHOW_DURATION=OUTRO_START+ending.sectionDuration;
export const isIntro=t=>t>=0&&t<INTRO_DURATION;
export const bodyTime=t=>Math.min(BODY_DURATION,Math.max(0,t-INTRO_DURATION));
export const isOutro=t=>t>=OUTRO_START;
export function closingFade(t){const u=Math.max(0,Math.min(1,(t-OUTRO_START)/8));return u*u*(3-2*u);}
export const storyTime=t=>bodyStoryTime(bodyTime(t));
export const showTime=t=>t===0?0:INTRO_DURATION+bodyShowTime(t);
export const entryActive=t=>!isIntro(t)&&bodyEntryActive(bodyTime(t));
export const formatTime=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
