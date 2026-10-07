const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../bedroom.js'),'utf8');
const frame=source.slice(source.indexOf('function advanceClock(now)'),source.indexOf('new ResizeObserver',source.indexOf('function frame(now)')));
test('all C versions stop once, force the final display update, and never wrap',async()=>{
 const clock=await import('../presentation-timeline.mjs');
 for(const [version,end] of [['story',90],['noon',30],['night',60],['morning',90]]){
 const finish=version==='story'?clock.SHOW_DURATION:clock.showTime(end);
 const context={...clock,version,playhead:finish-.04,sunlight:{update(){}},entryExperience:{update:()=>({active:false,floor:0,bed:0})},viewport:{dataset:{}},heatVisible:true,cameraMotionPreference:{matches:false},time:end-.04,last:0,playing:true,showComplete:false,lastUpdate:finish-.04,ranges:{story:[0,90],noon:[0,30],night:[30,60],morning:[60,90]},labels:[],camera:{},scene:{},renderer:{render(){}},updates:0,update(){this.updates++},sample:()=>({}),endOrb(){},syncPlay(){},syncVoice(){},syncSceneOSC(){},animateFlows(){},updateCaption(){},updateIntroCaption(){},updateOutroCaption(){},settleScene(){},updateCamera(){},requestAnimationFrame(){}};
 context.update=()=>context.updates++;vm.createContext(context);vm.runInContext(frame,context);context.frame(100);
 assert.equal(context.playing,false);assert.equal(context.showComplete,true);assert.equal(context.updates,1);const stopped=context.time;assert.equal(stopped,end-(version==='story'?0:.001));
 for(let i=1;i<=5;i++)context.frame(i*10000);assert.equal(context.time,stopped);assert.equal(context.updates,1);
 }
});

test('design voice keeps advancing while the entry projection is active',async()=>{
 const clock=await import('../presentation-timeline.mjs');
 const {narration}=await import('../c-story.mjs');
 const fake=duration=>({duration,currentTime:0,paused:true,pause(){this.paused=true},play(){this.paused=false;return Promise.resolve()}});
 const ctx={...clock,narration,ending:{start:.8},endingAudio:fake(13),intro:{start:1},introAudio:fake(24),voiceTracks:[fake(20.599),fake(18.639),fake(18.749)],voiceEnabled:true,playing:true,syncPlay(){}};
 const fn=source.slice(source.indexOf('function syncVoice(force=false)'),source.indexOf('function updateNarration()'));
 vm.createContext(ctx);vm.runInContext(fn,ctx);
 for(const time of [3.1,8.1,12.5]){
  ctx.time=time;ctx.playhead=clock.INTRO_DURATION+time;assert.equal(clock.entryActive(ctx.playhead),true);
  ctx.syncVoice(true);assert.equal(ctx.voiceTracks[0].paused,false);assert.ok(Math.abs(ctx.voiceTracks[0].currentTime-(time-narration[0][3]))<1e-9);
  assert.equal(ctx.introAudio.paused,true);assert.equal(ctx.voiceTracks[1].paused,true);
 }
});

test('selecting chapter three again stays in chapter three, including after completion',async()=>{
 const clock=await import('../presentation-timeline.mjs');
 const buttons=[0,1,2].map(n=>({dataset:{phase:String(n)},classList:{toggle(){}}}));
 const controls={playPause:{},restart:{}};
 const ctx={...clock,time:75,version:'story',showComplete:false,playing:false,phase:5,ranges:{story:[0,90]},endOrb(){},syncVoice(){},syncPlay(){},syncSceneOSC(){},refresh(){},$:id=>controls[id],document:{querySelectorAll:selector=>selector==='button[data-phase]'?buttons:[]}};
 const handlers=source.slice(source.indexOf("$('playPause').onclick="),source.indexOf("document.querySelector('[data-ending]').onclick="));
 vm.createContext(ctx);vm.runInContext(handlers,ctx);
 for(const complete of [false,true]){ctx.showComplete=complete;ctx.time=90;buttons[2].onclick();assert.equal(ctx.time,60);assert.equal(ctx.playhead,clock.showTime(60));assert.equal(ctx.playing,true);}
});

test('keyboard repeats and shortcuts at completion cannot restart playback',()=>{
 let handler,clicks=0;
 const ctx={showComplete:true,$:()=>({click(){clicks++}}),document:{addEventListener:(name,fn)=>{handler=fn}}};
 const keys=source.slice(source.indexOf("document.addEventListener('keydown'"),source.indexOf("document.addEventListener('visibilitychange'"));
 vm.createContext(ctx);vm.runInContext(keys,ctx);
 const event=(code,key,extra={})=>({code,key,target:{tagName:'BODY'},preventDefault(){},...extra});
 handler(event('Space',' '));handler(event('KeyR','r'));assert.equal(clicks,0);
 ctx.showComplete=false;handler(event('Space',' ',{repeat:true}));assert.equal(clicks,0);
 handler(event('Space',' '));assert.equal(clicks,1);
 handler(event('Space',' ',{target:{tagName:'BUTTON'}}));assert.equal(clicks,1);
});
