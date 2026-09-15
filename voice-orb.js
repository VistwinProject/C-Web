import {mountOrb} from './vendor/anlb-orb/orb.js';
const container=document.getElementById('voice-orb');
const orb=mountOrb(container);
let ready=false,active=false,context,graphs=[];
orb.ready.then(()=>{ready=true;container.dataset.ready='true';if(active)orb.start();}).catch(()=>{container.dataset.ready='false';container.hidden=true;});
export function startOrb(){active=true;if(ready)orb.start();}
export function endOrb(){active=false;if(ready)orb.end();}
export async function prepareOrbAudio(tracks){
 if(!context){context=new AudioContext();graphs=tracks.map(audio=>{const source=context.createMediaElementSource(audio),analyser=context.createAnalyser();analyser.fftSize=1024;source.connect(analyser);analyser.connect(context.destination);return {audio,analyser,samples:new Float32Array(1024)};});}
 await context.resume();
}
function tick(){let energy=0;
 for(const g of graphs){if(g.audio.paused||g.audio.ended)continue;g.analyser.getFloatTimeDomainData(g.samples);let sum=0;for(const sample of g.samples)sum+=sample*sample;energy+=sum/g.samples.length;}
 const level=Math.min(1,Math.max(0,Math.sqrt(energy)-.008)*5);
 container.dataset.level=level.toFixed(3);if(ready)orb.setLevel(active?level:0);requestAnimationFrame(tick);
}requestAnimationFrame(tick);
