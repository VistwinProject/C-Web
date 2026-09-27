import * as THREE from 'three';
import {projectionValue,thermalPalette} from './entry-projection.mjs?v=organic-6';
import {entryState} from './entry-timeline.mjs?v=no-person-5';

// Only the environmental projection is shown; no visitor asset is loaded.
export function createEntryExperience(scene,solarExposure){
 const palette=thermalPalette.map(c=>new THREE.Color(c));
 function surface(w,h,x,y,z){const canvas=document.createElement('canvas');canvas.width=128;canvas.height=96;const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);mesh.renderOrder=3;scene.add(mesh);
  return {ctx,texture,mesh,w,h,x,z};
 }
 const floor=surface(3.9,3.1,0,.079,0),bed=surface(1.43,1.88,-.38,.535,.31);
 let lastPaint=-Infinity;
 function paint(layer,state,isBed){
  const pixels=layer.ctx.createImageData(128,96);
  for(let y=0;y<96;y++)for(let x=0;x<128;x++){
   const wx=layer.x+(x/127-.5)*layer.w,wz=layer.z+(y/95-.5)*layer.h;
   const value=projectionValue(wx,wz,state,isBed,solarExposure.sample(wx,wz,isBed)),q=value*5,k=Math.floor(q);
   const c=palette[k].clone().lerp(palette[Math.min(5,k+1)],q-k).convertLinearToSRGB(),i=(y*128+x)*4;
   pixels.data[i]=c.r*255;pixels.data[i+1]=c.g*255;pixels.data[i+2]=c.b*255;
   // Light is mapped onto the floor and mattress separately, not a floating cloud.
   const underBed=!isBed&&wx>-1.10&&wx<.34&&wz>-.63&&wz<1.25;
   const edge=Math.min(x/6,(127-x)/6,y/6,(95-y)/6,1);
   pixels.data[i+3]=underBed?0:Math.round(235*Math.max(0,edge));
  }
  layer.ctx.putImageData(pixels,0,0);layer.texture.needsUpdate=true;
 }
 function update(playhead,{heatVisible=true,reduced=false}={}){
  const state=entryState(playhead,reduced);
  floor.mesh.visible=heatVisible&&state.floor>.001;bed.mesh.visible=heatVisible&&state.bed>.001;
  floor.mesh.material.opacity=state.floor*.70;bed.mesh.material.opacity=state.bed*.73;
  if(Math.abs(playhead-lastPaint)>.08&&(floor.mesh.visible||bed.mesh.visible)){paint(floor,state,false);paint(bed,state,true);lastPaint=playhead;}
  return {...state,visitorReady:false};
 }
 return {update};
}
