import {syncSceneOSC} from './osc-control.js?v=2';
import {startOrb,endOrb,prepareOrbAudio} from './voice-orb.js';
import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';

import {config} from './scene-config.js?v=ac-1';

const $=id=>document.getElementById(id), viewport=$('viewport');
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch(error){$('loading').textContent='此瀏覽器未提供 WebGL。請改用支援 WebGL 的瀏覽器，或上方「比較 2D」。';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;viewport.prepend(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-4,4,3,-3,.05,80);
camera.position.set(-5.3,4.6,-6.1);camera.lookAt(0,.9,0);
renderer.shadowMap.enabled=false;renderer.toneMapping=THREE.NoToneMapping;
const base=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(4.16,.025,3.35)),new THREE.LineBasicMaterial({color:0x48658b,transparent:true,opacity:.6}));base.position.y=-.02;scene.add(base);
const grid=new THREE.GridHelper(16,40,0x132948,0x0d1c35);grid.position.y=-.12;grid.material.transparent=true;grid.material.opacity=.22;scene.add(grid);

const labels=[];
function label(text,pos,type=''){const el=document.createElement('div');el.className='label '+type;el.textContent=text;$('labels').append(el);const item={el,pos:new THREE.Vector3(...pos)};labels.push(item);return item;}
const mat=(color)=>new THREE.MeshBasicMaterial({color:0x0e1c35,transparent:true,opacity:.4,depthWrite:false});
function box(name,size,pos,material,parent=scene){const mesh=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(...size)),new THREE.LineBasicMaterial({color:0x9abbeb,transparent:true,opacity:.65}));mesh.name=name;mesh.position.fromArray(pos);parent.add(mesh);return mesh;}
// The six original bed meshes are inside the GLB with a recorded placement correction.
const bedSurfaces=[];
// Simplified bed outlines follow each source mesh's measured bounds, avoiding cloth triangulation noise.
function bedEnvelope(bounds){const group=new THREE.Group(),lo=bounds.min,hi=bounds.max,r=.045;
 for(const y of [lo.y,hi.y]){const pts=[];for(const [cx,cz,start] of [[hi.x-r,hi.z-r,0],[lo.x+r,hi.z-r,90],[lo.x+r,lo.z+r,180],[hi.x-r,lo.z+r,270]])for(let i=0;i<=5;i++){const a=(start+i*18)*Math.PI/180;pts.push(new THREE.Vector3(cx+Math.cos(a)*r,y,cz+Math.sin(a)*r));}pts.push(pts[0]);group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x8cb5e8,transparent:true,opacity:.56})));}
 for(const [x,z] of [[lo.x+r,lo.z],[hi.x-r,lo.z],[lo.x+r,hi.z],[hi.x-r,hi.z]])group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,lo.y,z),new THREE.Vector3(x,hi.y,z)]),new THREE.LineBasicMaterial({color:0x719bd1,transparent:true,opacity:.35})));scene.add(group);}
const bedLabel=label('原模型床組',[-.42,.65,-.65]);
function vent(name,position,color){const group=new THREE.Group();group.position.fromArray(position);scene.add(group);box(name,[.35,.07,.24],[0,0,0],mat(0xc6cfca,.5,.4),group);for(let i=0;i<6;i++)box('Grille',[.27,.008,.012],[0,-.04,-.09+i*.035],mat(color),group);return group;}
const freshVent=vent('Fresh supply',config.fresh.position,0x9ccfc5);
freshVent.traverse(o=>{if(o.material)o.material.color.set(0x9ccfc5);});
const freshLabel=label('新風進氣 · 依圖定位',[...config.fresh.position],'fresh');freshLabel.pos.y+=.18;
// Ceiling cassette traced from the white square in the supplied top-view video.
const acVent=new THREE.Group();acVent.position.fromArray(config.ac.position);scene.add(acVent);
box('AC outer frame',config.ac.size,[0,0,0],mat(),acVent);
// Rear (+Z / headboard wall) side outlet; underside has no discharge grille.
const acOutletZ=config.ac.size[2]/2+.004;
box('AC rear grille',[.34,.058,.008],[0,0,acOutletZ],mat(),acVent);
for(let i=0;i<3;i++)box('AC rear louver',[.30,.004,.012],[0,-.018+i*.018,acOutletZ+.003],mat(),acVent);
acVent.traverse(o=>{if(o.material){o.material.color.set(0x82baff);o.material.opacity=.8;}});
const acLabel=label('冷氣 · 窗邊出風口',[.68,2.79,.03],'ac');


// Separate wall projection and existing digital-window video reference.
const projectionCanvas=document.createElement('canvas');projectionCanvas.width=768;projectionCanvas.height=432;const pc=projectionCanvas.getContext('2d'),projectionTexture=new THREE.CanvasTexture(projectionCanvas);projectionTexture.colorSpace=THREE.SRGBColorSpace;
const projection=new THREE.Mesh(new THREE.PlaneGeometry(...config.projection.size),new THREE.MeshBasicMaterial({map:projectionTexture,transparent:true,opacity:.46,side:THREE.DoubleSide}));projection.position.fromArray(config.projection.position);projection.rotation.y=Math.PI;scene.add(projection);label('床上方整面投影 · 16:9',[-.38,2.72,1.45]);
const windowGroup=new THREE.Group();windowGroup.position.fromArray(config.digitalWindow.position);windowGroup.rotation.y=-Math.PI/2;scene.add(windowGroup);
box('Window outline',[1.25,1.24,.018],[0,0,0],mat(),windowGroup);
box('Window mullion',[.014,1.24,.018],[0,0,.01],mat(),windowGroup);
const curtains=[];
for(const side of [-1,1]){const g=new THREE.Group();g.position.set(side*.625,0,.04);windowGroup.add(g);for(let i=0;i<8;i++){const line=box('Curtain line',[.008,1.24,.008],[-side*i*.078,0,0],mat(),g);line.material.color.set(0x6999d0);line.material.opacity=.35;}curtains.push(g);}
const windowGlow=new THREE.Mesh(new THREE.PlaneGeometry(1.23,1.22),new THREE.MeshBasicMaterial({color:0xe7a450,transparent:true,opacity:.18,depthWrite:false,side:THREE.DoubleSide}));windowGlow.position.z=.01;windowGroup.add(windowGlow);
label('窗景位置',[1.81,2.27,.32]);
label('窗邊受熱上升 · 示意',[1.56,.65,-.02],'warm');

let root,cutaway=true,heatVisible=true,flowVisible=true;
const lightMarkers=new THREE.Group();scene.add(lightMarkers);const lampPositions=[];
new GLTFLoader().load(config.model,gltf=>{
 root=gltf.scene;root.updateMatrixWorld(true);const items=[];root.traverse(o=>{if(o.isMesh)items.push(o);});
 for(const o of items){const bounds=new THREE.Box3().setFromObject(o),size=bounds.getSize(new THREE.Vector3());const oldMats=Array.isArray(o.material)?o.material:[o.material];
   const foreground=bounds.max.x < -1.78 || bounds.max.z < -.9 || bounds.min.y > 2.40;
   const isBed=o.name.startsWith('BED_SOURCE_');
   if((o.userData.lightSource||oldMats.some(m=>/^Light_/.test(m.name)))){const pos=bounds.getCenter(new THREE.Vector3());if(!lampPositions.some(p=>p.distanceTo(pos)<.25)){lampPositions.push(pos);const ring=new THREE.Mesh(new THREE.SphereGeometry(.040,12,8),new THREE.MeshBasicMaterial({color:0xff555d,transparent:true,depthTest:false}));ring.position.copy(pos);ring.renderOrder=20;lightMarkers.add(ring);}}
   if(foreground || Math.max(size.x,size.y,size.z)<.12){o.visible=false;continue;}
   // Crease edges retain the actual model's shape without photoreal textures or shading.
   if(isBed){if(/^BED_SOURCE_(102|103|1294)_/.test(o.name))bedEnvelope(bounds);}
   else o.add(new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,38),new THREE.LineBasicMaterial({color:0x4c6e9c,transparent:true,opacity:.24,depthWrite:false})));
   o.material=new THREE.MeshBasicMaterial({color:0x050c1c,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide});
   if(isBed&&o.name.startsWith('BED_SOURCE_104')){o.material=new THREE.MeshBasicMaterial({color:0x214667,transparent:true,opacity:.14,depthWrite:false,side:THREE.DoubleSide});bedSurfaces.push(o.material);}
 }
 scene.add(root);period="";refresh();$('loading').hidden=true;$('viewport').dataset.model='loaded';
},xhr=>{if(xhr.total)$('loading').textContent=`正在載入主臥線框 · ${Math.round(xhr.loaded/xhr.total*100)}%`;},()=>{$('loading').textContent='主臥模型載入失敗。請確認本機服務及模型檔案。';});

const heatCanvas=document.createElement('canvas');heatCanvas.width=96;heatCanvas.height=80;const hc=heatCanvas.getContext('2d');const heatTexture=new THREE.CanvasTexture(heatCanvas);heatTexture.colorSpace=THREE.SRGBColorSpace;
const floorCanvas=document.createElement('canvas');floorCanvas.width=96;floorCanvas.height=80;const fc=floorCanvas.getContext('2d'),floorTexture=new THREE.CanvasTexture(floorCanvas);floorTexture.colorSpace=THREE.SRGBColorSpace;
const floorHeat=new THREE.Mesh(new THREE.PlaneGeometry(3.9,3.1),new THREE.MeshBasicMaterial({map:floorTexture,toneMapped:false,transparent:true,opacity:.72,depthWrite:false,side:THREE.DoubleSide}));floorHeat.rotation.x=-Math.PI/2;floorHeat.position.set(0,.065,0);scene.add(floorHeat);
const bedHeat=new THREE.Mesh(new THREE.PlaneGeometry(1.43,1.88),new THREE.MeshBasicMaterial({map:heatTexture,toneMapped:false,transparent:true,opacity:.16,depthWrite:false}));bedHeat.rotation.x=-Math.PI/2;bedHeat.position.set(-.38,.515,.31);scene.add(bedHeat);
const colors=[new THREE.Color('#3478d5'),new THREE.Color('#70c3ed'),new THREE.Color('#e0ad53'),new THREE.Color('#f37a30')];
function tempColor(t){const q=THREE.MathUtils.clamp((t-20)/4,0,2.999),i=Math.floor(q);return colors[i].clone().lerp(colors[i+1],q-i);}
let version="story",period="noon",target=26,heat=34,fresh=26,time=0,playing=true,last=performance.now(),lastUpdate=-1,phase=-1;
const descriptions=[
 ['進場與情境建立','白天窗邊熱流進入室內，燈光漸暗，開始看見床位熱感。'],
 ['空間掃描與數據呈現','地板熱力圖隨掃描逐步浮現，呈現窗邊暖區；新風啟動，環境數據同步變化。'],
 ['睡前情境展演','窗簾漸閉、燈光柔和；減少窗邊熱流與外部噪音干擾。'],
 ['睡眠中情境展演','維持低亮與穩定新風。床位趨於平穩，白噪音僅以狀態示意。'],
 ['清晨喚醒情境展演','背景逐漸轉亮、窗簾開啟；清晨暖流輕柔進入房間。'],
 ['完成與回饋','環境數據收斂成平穩呼吸線，完成這一次睡眠情境。']];
// Local VoAI recordings: Yi-Ting Neo, original rate and pitch.
const narration=[
 [0,'01 · 看見環境','日光從窗邊進來，熱也慢慢累積。地板上的熱力圖，讓看不見的溫度差異浮現。窗邊的黃色，是局部偏暖的區域。隨著新風緩緩送入，一起看看空間的變化。',10,'01-environment.wav'],
 [30,'02 · 安心入睡','夜晚來了，窗簾緩緩關閉，光線也慢慢柔和下來。窗邊的熱逐漸減弱，新風持續輕輕送入。讓環境安靜地維持，陪你從準備入睡，走進平穩的夜晚。',30,'02-sleep.wav'],
 [60,'03 · 自然醒來','晨光慢慢亮起，窗簾再次打開，新的一天開始了。回看這一夜的環境變化，數據漸漸淡去，留下平穩的呼吸。從入睡到醒來，讓空間跟著生活的節奏，陪你迎接早晨。早安。',65,'03-morning.wav']
];
let voiceEnabled=false,narrationIndex=-1,showComplete=false;
const voiceTracks=narration.map(cue=>{const el=document.createElement('audio');el.src='./assets/audio/'+cue[4];el.preload='auto';el.dataset.act=cue[1];el.hidden=true;document.body.append(el);return el;});
function syncVoice(force=false){
 const act=Math.min(2,Math.floor(time/30));
 voiceTracks.forEach((audio,i)=>{
  const offset=time-narration[i][3];
  if(i!==act||!voiceEnabled||!playing||offset<0||!Number.isFinite(audio.duration)||offset>=audio.duration){audio.pause();return;}
  if(force||Math.abs(audio.currentTime-offset)>.6)audio.currentTime=offset;
  if(audio.paused)audio.play().catch(()=>{voiceEnabled=false;voiceTracks.forEach(a=>a.pause());$('voiceToggle').textContent='語音：點擊播放';$('voiceToggle').setAttribute('aria-pressed','false');});
 });
}
function updateNarration(){if(!showComplete)startOrb();const index=Math.min(2,Math.floor(time/30));if(index!==narrationIndex){narrationIndex=index;$('narrativeStage').textContent=narration[index][1];$('narrativeText').textContent=narration[index][2];}syncVoice();}
$('voiceToggle').title='VoAI 怡婷 Neo · 三幕導覽';
$('voiceToggle').onclick=async()=>{voiceEnabled=!voiceEnabled;if(voiceEnabled){try{await prepareOrbAudio(voiceTracks);}catch{ /* Keep original audio playback if analysis is unavailable. */ }}$('voiceToggle').textContent='語音：'+(voiceEnabled?'開':'關');$('voiceToggle').setAttribute('aria-pressed',String(voiceEnabled));syncVoice(true);};
const ranges={story:[0,90],noon:[0,30],night:[30,60],morning:[60,90]};
function smooth(t){t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t);}
function periodAt(t){return t<30?'noon':t<60?'night':'morning';}
function sample(t){
 const cool=smooth((t-18)/28),wake=smooth((t-60)/18),power=t<18?0:t<27?smooth((t-18)/9):t<43?1:t<60?.4:.32;
 const curtain=t<30?0:t<43?smooth((t-30)/13):t<60?1:1-smooth((t-60)/12);
 const solar=(t<30?1:t<60?1-.9*smooth((t-30)/13):.12+.42*smooth((t-60)/14))*THREE.MathUtils.clamp((heat-24)/10,.15,1.4);
 // Fresh air is not refrigeration: the bed approaches supply temperature plus
 // residual window load. Warm supply can warm the room. Reference target is assessment only.
 const initial=29+(heat-34)*.12,equilibrium=fresh+Math.max(0,heat-fresh)*.13*solar;
 const temp=THREE.MathUtils.lerp(initial,equilibrium,cool);
 return {temp,rh:68-15*cool+2*solar,noise:43-10*cool+3*power-3*curtain,power,cool,curtain,solar,wake};
}
function drawHeat(s){const pixels=hc.createImageData(96,80);for(let y=0;y<80;y++)for(let x=0;x<96;x++){const warmth=Math.exp(-((x-94)**2/700+(y-35)**2/1800));const coolSpot=s.power*Math.exp(-((x-43)**2/1000+(y-68)**2/1400));const t=s.temp+(heat-s.temp)*warmth*.8*s.solar-coolSpot*Math.max(0,s.temp-fresh)*.25;const c=tempColor(t).convertLinearToSRGB();const i=(y*96+x)*4;pixels.data[i]=c.r*255;pixels.data[i+1]=c.g*255;pixels.data[i+2]=c.b*255;pixels.data[i+3]=190;}hc.putImageData(pixels,0,0);heatTexture.needsUpdate=true;
 // Reveal only the floor texture, leaving wall projection and bed layers independent.
 const reveal=smooth((time-15)/9);
 // Floor colors show relative window heat, not an absolute temperature reading.
 const floorPixels=fc.createImageData(96,80),baseColor=new THREE.Color('#629fca'),windowColor=new THREE.Color('#efd477');
 for(let y=0;y<80;y++)for(let x=0;x<96;x++){
  const localWarmth=Math.exp(-((x-94)**2/155+(y-48)**2/320))*Math.min(1,s.solar);
  const c=baseColor.clone().lerp(windowColor,smooth(localWarmth)).convertLinearToSRGB(),i=(y*96+x)*4;
  floorPixels.data[i]=c.r*255;floorPixels.data[i+1]=c.g*255;floorPixels.data[i+2]=c.b*255;floorPixels.data[i+3]=y<80*reveal?205:0;
 }
 fc.putImageData(floorPixels,0,0);floorTexture.needsUpdate=true;
 floorHeat.visible=heatVisible&&time>=15;
 floorHeat.material.opacity=.72-.56*smooth((time-30)/13);
 for(const m of bedSurfaces)m.color.copy(heatVisible?tempColor(s.temp):new THREE.Color(0x214667));}
function projectionDraw(s){
 const scan=smooth((time-15)/9),settle=smooth((time-75)/9),day=periodAt(time)!=='night',ink=day?'#36596a':'#c5e4ff';
 pc.clearRect(0,0,768,432);pc.fillStyle=day?'#fff8e6a8':'#174a7948';pc.fillRect(0,0,768,432);
 pc.save();pc.globalAlpha=1-settle;
 pc.strokeStyle=day?'#718d9755':'#82bfff55';pc.lineWidth=1;pc.strokeRect(1,1,766,430);
 pc.fillStyle=ink;pc.font='22px sans-serif';pc.fillText('C  /  SLEEP ENVIRONMENT',32,48);
 pc.save();pc.beginPath();pc.rect(32,85,340,270*(time<15?0:scan));pc.clip();
 pc.globalAlpha=.62*(1-settle);pc.drawImage(heatCanvas,32,85,340,270);pc.restore();
 pc.strokeStyle=day?'#547787':'#bcdfff';pc.lineWidth=3;pc.strokeRect(124,126,142,190);
 if(time>=15&&time<24){pc.strokeStyle='#e3f3ff';pc.beginPath();pc.moveTo(32,85+270*scan);pc.lineTo(372,85+270*scan);pc.stroke();}
 for(const [start,font,text,y] of [[17,70,s.temp.toFixed(1)+'°',173],[20,25,Math.round(s.rh)+'% RH',234],[23,25,Math.round(s.noise)+' dBA',280]]){
  pc.globalAlpha=(1-settle)*smooth((time-start)/2);pc.font=font+'px sans-serif';pc.fillStyle=ink;pc.fillText(text,455,y);
 }
 pc.globalAlpha=1-settle;pc.font='19px sans-serif';pc.fillText('EXHIBITION SIMULATION',32,405);pc.restore();
 if(settle>0){
  pc.save();pc.globalAlpha=settle;pc.strokeStyle=day?'#496c7a':'#d9edff';pc.lineWidth=3;pc.beginPath();
  for(let x=25;x<745;x++){const y=216+Math.sin(x*.012-time*1.05)*28*Math.exp(-(((x-384)/260)**2));x===25?pc.moveTo(x,y):pc.lineTo(x,y);}pc.stroke();
  pc.fillStyle=ink;pc.font='27px sans-serif';pc.fillText('早安，讓空間回到平穩。',32,75);
  pc.font='19px sans-serif';pc.fillText('STEADY BREATH  /  本次情境完成',32,380);pc.restore();
 }
 projectionTexture.needsUpdate=true;
}
// A single quiet sweep makes the storyboard scan visible in the room.
const scanSweep=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1.95,.085,0),new THREE.Vector3(1.95,.085,0)]),new THREE.LineBasicMaterial({color:0x62c6ed,transparent:true,opacity:0,depthTest:true}));
scanSweep.renderOrder=10;scene.add(scanSweep);

// Curves describe illustrative flow paths, not a fluid solver. Particles move in the
// directions of window-side rising warmth and fresh-air dispersion only.
const flowGroup=new THREE.Group();scene.add(flowGroup);let paths=[],supplyParticles=[],acParticles=[];
const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;const gc=glowCanvas.getContext('2d'),gr=gc.createRadialGradient(32,32,1,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.18,'rgba(255,255,255,.9)');gr.addColorStop(.45,'rgba(255,255,255,.25)');gr.addColorStop(1,'rgba(255,255,255,0)');gc.fillStyle=gr;gc.fillRect(0,0,64,64);const glowTexture=new THREE.CanvasTexture(glowCanvas);
function addPath(points,color,kind,phaseOffset){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const line=new THREE.Mesh(new THREE.TubeGeometry(curve,48,.008,5,false),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.45,depthWrite:false}));flowGroup.add(line);const beads=[];for(let i=0;i<5;i++){const bead=new THREE.Mesh(new THREE.SphereGeometry(.026,8,6),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85}));const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending}));glow.scale.set(.15,.15,1);bead.add(glow);flowGroup.add(bead);beads.push(bead);}const arrow=new THREE.Mesh(new THREE.ConeGeometry(.035,.12,5),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8}));flowGroup.add(arrow);const trail=new THREE.Mesh(new THREE.TubeGeometry(curve,48,.017,6,false),new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{phase:{value:0},strength:{value:1},tint:{value:new THREE.Color(color)}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float phase;uniform float strength;uniform vec3 tint;void main(){float d=fract(vUv.x-phase);float a=pow(1.-d,5.)*strength;gl_FragColor=vec4(tint,min(a*1.35,1.));}' }));flowGroup.add(trail);paths.push({curve,line,beads,arrow,trail,kind,offset:phaseOffset,progress:phaseOffset});}
function rebuildFlows(){for(const child of [...flowGroup.children]){child.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});flowGroup.remove(child);}paths=[];supplyParticles=[];acParticles=[];
const fx=freshVent.position.x,fy=freshVent.position.y,fz=freshVent.position.z;
// Independently seeded parcels: broadening, decelerating and fading mixing plume.
// No fixed blue tubes, synchronized strips, or arrows that imply measured streamlines.
let seed=7391;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(let i=0;i<110;i++){
 const origin=new THREE.Vector3(fx+(rand()-.5)*.24,fy-.05,fz+(rand()-.5)*.16);
 const dx=.4+rand()*1.65,dz=.3+rand()*1.48,drop=.75+rand()*.9;
 const curve=new THREE.CubicBezierCurve3(origin,origin.clone().add(new THREE.Vector3((rand()-.5)*.14,-.28,(rand()-.5)*.12)),origin.clone().add(new THREE.Vector3(dx*.58,-drop*.75,-dz*.46)),origin.clone().add(new THREE.Vector3(dx,-drop,-dz)));
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:0x8bcdff,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));
 const size=.055+rand()*.055;sprite.scale.set(size,size,1);flowGroup.add(sprite);
 supplyParticles.push({sprite,curve,age:rand(),rate:.023+rand()*.019,seed:rand()*20,size});
}
// Separate blue cooling plume; source stays between the window and bed.
for(let i=0;i<100;i++){
 const origin=new THREE.Vector3(...config.ac.position).add(new THREE.Vector3((rand()-.5)*.30,(rand()-.5)*.038,acOutletZ+.012));
 const dx=(rand()-.5)*.95,dz=.78+rand()*.28,drop=.22+rand()*.5;
 // Start horizontally toward the rear wall, then broaden and gently descend.
 const curve=new THREE.CubicBezierCurve3(origin,origin.clone().add(new THREE.Vector3(0,0,.32)),origin.clone().add(new THREE.Vector3(dx*.4,-drop*.2,dz*.8)),origin.clone().add(new THREE.Vector3(dx,-drop,dz)));
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:0x75afff,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));
 const size=.05+rand()*.045;sprite.scale.set(size,size,1);flowGroup.add(sprite);
 acParticles.push({sprite,curve,age:rand(),rate:.035+rand()*.02,seed:rand()*20,size});
}
for(let i=0;i<6;i++){const z=-.18+i*.18,h=.62+(i%2)*.09;addPath([[1.73,h,z],[1.69,1.05,z+.018],[1.71,1.48,z-.025],[1.65,1.92,z+.025],[1.47,2.24,z+.04],[1.12,2.44,z+.08]],0xf4ae55,'warm',i*.12);}
}

rebuildFlows();
function animateFlows(dt,s){flowGroup.visible=flowVisible;
 const day=periodAt(time)!=='night';
 const supplyColor=new THREE.Color(day?0x619e96:0xa4d9ce);
 for(const p of supplyParticles){
  if(playing&&s.power>0)p.age=(p.age+dt*p.rate*(.5+.5*s.power))%1;
  const age=p.age,u=1-Math.pow(1-age,1.35),pos=p.curve.getPoint(u),mix=Math.pow(u,1.4);
  pos.x+=Math.sin(u*7.5+p.seed)*.12*mix;
  pos.y+=Math.sin(u*9+p.seed*1.7)*.065*mix;
  pos.z+=Math.cos(u*8+p.seed*.8)*.11*mix;
  p.sprite.position.copy(pos);p.sprite.material.color.copy(supplyColor);p.sprite.material.blending=day?THREE.NormalBlending:THREE.AdditiveBlending;
  const fade=smooth(age/.09)*(1-smooth((age-.58)/.42));
  p.sprite.material.opacity=s.power>0?fade*(.58+.30*s.power):0;
  const radius=p.size*(1+u*.55);p.sprite.scale.set(radius,radius,1);
 }
 const acPower=.45+.55*s.power;
 for(const p of acParticles){
  if(playing)p.age=(p.age+dt*p.rate*(.6+.4*acPower))%1;
  const u=1-Math.pow(1-p.age,1.3),pos=p.curve.getPoint(u);
  pos.z+=Math.sin(u*8+p.seed)*.075*u;pos.x+=Math.cos(u*7+p.seed)*.06*u;
  p.sprite.position.copy(pos);p.sprite.material.color.set(day?0x397fd3:0x76afff);
  p.sprite.material.blending=day?THREE.NormalBlending:THREE.AdditiveBlending;
  p.sprite.material.opacity=smooth(p.age/.08)*(1-smooth((p.age-.65)/.35))*(.5+.3*acPower);
  const radius=p.size*(1+u*.7);p.sprite.scale.set(radius,radius,1);
 }
 for(const p of paths){const warm=p.kind==='warm',opacity=warm?Math.min(1,s.solar*1.2):(s.power>0?.6+.4*s.power:0),speed=warm?.022:(.018+s.power*.022);
 if(!warm){const color=new THREE.Color(fresh>s.temp+.5?0xe7aa63:0x75b9f2);p.line.material.color.copy(color);p.trail.material.uniforms.tint.value.copy(color);p.arrow.material.color.copy(color);for(const bead of p.beads){bead.material.color.copy(color);bead.children[0].material.color.copy(color);}}
 if(playing)p.progress=(p.progress+dt*speed)%1; p.line.material.opacity=(warm?.15:.18)*opacity;p.trail.material.uniforms.phase.value=p.progress;p.trail.material.uniforms.strength.value=opacity;
 for(let i=0;i<p.beads.length;i++){const t=(p.progress+i/5)%1;p.beads[i].position.copy(p.curve.getPoint(t));p.beads[i].material.opacity=.95*opacity;p.beads[i].children[0].material.opacity=.85*opacity;}
 const t=p.progress;p.arrow.position.copy(p.curve.getPoint(t));p.arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),p.curve.getTangent(t).normalize());p.arrow.material.opacity=.65*opacity;
}}
function update(){updateNarration();const s=sample(time),p=Math.min(5,Math.floor(time/15));if(p!==phase){phase=p;$('phaseNumber').textContent=`0${Math.floor(p/2)+1} / 03`;$('phaseTitle').textContent=narration[Math.floor(p/2)][1].split(' · ')[1];$('phaseText').textContent=descriptions[p][1];document.querySelectorAll('button[data-phase]').forEach((b,i)=>b.classList.toggle('active',i===Math.floor(p/2)));}
$('temperature').textContent=s.temp.toFixed(1);$('humidity').textContent=Math.round(s.rh);$('noise').textContent=Math.round(s.noise);$('humidityBar').style.width=s.rh+'%';const stable=Math.abs(s.temp-target)<1.2&&s.cool>.85;$('bedStatus').textContent=s.temp>27?'偏暖':stable?'平穩':'調節中';$('bedStatus').style.color=periodAt(time)==='night'?(s.temp>27?'#edbc7b':'#a7d3ff'):(s.temp>27?'#93631f':'#306a89');$('bedDetail').textContent=stable?'接近本次展示目標':s.power>0?'氣流正在改善床位熱感':'等待環境調節';$('acReadout').textContent='藍色送風 · 示意';$('freshReadout').textContent=s.power>0?`${fresh.toFixed(1)}°C · ${Math.round(s.power*100)}%`:'待機';$('time').textContent=`${String(Math.floor(time/60)).padStart(2,'0')}:${String(Math.floor(time%60)).padStart(2,'0')} / 01:30`;$('progress').style.width=(time/90*100)+'%';$('viewport').dataset.simulationTime=time.toFixed(2);$('viewport').dataset.phase=String(p);$('viewport').dataset.bedTemperature=s.temp.toFixed(2);
const points=[];for(let t=0;t<=time;t+=1){points.push(`${(t/90*238).toFixed(1)},${(35-(sample(t).temp-19)/20*30).toFixed(1)}`);}$('trend').firstElementChild.setAttribute('d',points.length?'M'+points.join(' L'):'');drawHeat(s);projectionDraw(s);
 const next=periodAt(time);if(next!==period||document.body.dataset.period!==next){period=next;document.body.dataset.period=next;grid.material.opacity=next!=="night"?.05:.22;
 scene.traverse(o=>{if(!o.isLine||o===grid)return;const m=o.material;if(!m.userData.baseColor){m.userData.baseColor=m.color.clone();m.userData.baseOpacity=m.opacity;}m.color.copy(m.userData.baseColor);m.opacity=m.userData.baseOpacity;if(next!=='night'){m.color.lerp(new THREE.Color(0x365a70),.6);m.opacity=Math.min(.85,m.opacity*2.1);}});
 }
 $('curtainReadout').textContent=s.curtain>.9?'關閉':s.curtain<.1?'開啟':'移動中';
 $('solarReadout').textContent=s.solar>.7?'強 · 緩慢上升':s.solar>.25?'柔和暖流':'減弱';
 $('storyCue').textContent=p===0?'燈光漸暗 · 建立情境':p===1?'地板掃描 · 熱力圖浮現':p===2?'柔和燈光 · 窗簾關閉':p===3?'低亮維持 · 白噪音示意':p===4?'清晨漸亮 · 窗簾開啟':'平穩呼吸 · 完成回饋';
 const scan=smooth((time-15)/9);
 scanSweep.visible=heatVisible&&time>=15&&time<24;
 scanSweep.position.z=-1.55+scan*3.1;
 scanSweep.material.opacity=.85*smooth((time-15)/.6)*(1-smooth((time-23)/1));
 // Brightness follows story time, so pausing and chapter jumps remain deterministic.
 document.body.style.setProperty('--dawn-shade',String(next==='morning'?.76*(1-s.wake):0));
 document.body.style.setProperty('--room-dim',String(time<15?.12*smooth(time/12):next==='night'?.12:0));
 projection.material.opacity=(next==='night'?.46*(p===3?.65:1):.82)*(p===1?.12+.88*smooth((time-24)/4):1);
 bedHeat.material.opacity=p===1?.04:.16;
 document.querySelectorAll('.metrics article').forEach((card,i)=>{card.style.opacity=String(p===1?.18+.82*smooth((time-(24+i*.7))/1.2):1);});
 $('bedDetail').textContent=p===5?'本次模擬 '+sample(0).temp.toFixed(1)+' → '+s.temp.toFixed(1)+'°C':stable?'接近本次展示目標':s.power>0?(fresh<s.temp?'新風混合中，床位熱感漸緩':'新風混合中，持續觀察熱感'):'等待環境調節';
 curtains[0].scale.x=curtains[1].scale.x=.025+.975*s.curtain;
 windowGlow.material.opacity=.08+.16*s.solar;
 for(const point of lightMarkers.children)point.material.opacity=p===3?.65:.95;
}
function frame(now){const dt=Math.max(0,Math.min((now-last)/1000,.1));last=now;if(playing){time+=dt;if(time>=ranges[version][1]){if(version==='story'){time=89.999;playing=false;showComplete=true;endOrb();syncPlay();syncVoice();}else{time=ranges[version][0];phase=-1;}}}syncSceneOSC(time,playing,version);if(Math.abs(time-lastUpdate)>.12||lastUpdate<0){update();lastUpdate=time;}animateFlows(dt,sample(time));for(const l of labels){const p=l.pos.clone().project(camera);l.el.style.left=(p.x*.5+.5)*viewport.clientWidth+'px';l.el.style.top=(-p.y*.5+.5)*viewport.clientHeight+'px';l.el.hidden=p.z>1;}renderer.render(scene,camera);requestAnimationFrame(frame);}
new ResizeObserver(()=>{const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h);const aspect=w/h,half=Math.max(2.5,3.1/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();}).observe(viewport);
function refresh(){lastUpdate=-1;update();}
function syncPlay(){ $('playPause').textContent=playing?'Ⅱ 暫停':'▶ 播放';}
$('playPause').onclick=()=>{if(showComplete){$('restart').click();return;}playing=!playing;syncVoice(true);syncPlay();};$('restart').onclick=()=>{showComplete=false;endOrb();time=ranges[version][0];phase=-1;playing=true;syncSceneOSC(time,playing,version,true);refresh();syncPlay();};document.querySelectorAll('button[data-phase]').forEach(b=>b.onclick=()=>{showComplete=false;version='story';document.querySelectorAll('[data-version]').forEach(v=>v.classList.toggle('selected',v.dataset.version==='story'));const selected=Number(b.dataset.phase);const next=selected===2&&time>=60?0:selected;time=next*30;phase=-1;playing=true;syncSceneOSC(time,playing,version,true);refresh();syncPlay();});
$('heatToggle').onclick=()=>{heatVisible=!heatVisible;floorHeat.visible=bedHeat.visible=heatVisible;$('heatToggle').textContent='溫度層：'+(heatVisible?'開':'關');$('heatToggle').setAttribute('aria-pressed',String(heatVisible));refresh();};
$('flowToggle').onclick=()=>{flowVisible=!flowVisible;$('flowToggle').textContent='氣流：'+(flowVisible?'開':'關');$('flowToggle').setAttribute('aria-pressed',String(flowVisible));};
$('lightToggle').onclick=()=>{lightMarkers.visible=!lightMarkers.visible;for(const l of labels)if(l.light)l.el.style.display=lightMarkers.visible?'':'none';$('lightToggle').textContent='光源標示：'+(lightMarkers.visible?'開':'關');$('lightToggle').setAttribute('aria-pressed',String(lightMarkers.visible));};
for(const id of ['target','heat','fresh'])$(id).oninput=e=>{const v=Number(e.target.value);if(id==='target')target=v;if(id==='heat')heat=v;if(id==='fresh'){fresh=v;rebuildFlows();}$(id+'Out').textContent=v+'°C';refresh();};
$('freshX').oninput=e=>{freshVent.position.x=Number(e.target.value);freshLabel.pos.x=freshVent.position.x;$('freshXOut').textContent=freshVent.position.x.toFixed(1)+' m';rebuildFlows();};
document.querySelectorAll('[data-version]').forEach(b=>b.onclick=()=>{showComplete=false;version=b.dataset.version;time=ranges[version][0]+.05;phase=-1;playing=true;syncSceneOSC(time,playing,version,true);document.querySelectorAll('[data-version]').forEach(v=>v.classList.toggle('selected',v===b));refresh();syncPlay();});
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('fullscreen').textContent='使用瀏覽器全螢幕';}};
document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();$('playPause').click();}if(e.key.toLowerCase()==='r')$('restart').click();});
document.addEventListener('visibilitychange',()=>{last=performance.now();});
refresh();requestAnimationFrame(frame);
