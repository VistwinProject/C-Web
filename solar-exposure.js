import * as THREE from 'three';
import {sunDirection,sunWindow,sunFloorY,windowHeatValue,blurHeat} from './sunlight-field.mjs?v=spread-2';
const inward=new THREE.Vector3(...sunDirection).normalize(),outward=inward.clone().negate();
export function createSolarExposure(){
 const ray=new THREE.Raycaster(),point=new THREE.Vector3();let receivers=[],fields=null;
 function trace(source){
  const origin=new THREE.Vector3(...source).addScaledVector(inward,.035);
  const distance=(sunFloorY-origin.y)/inward.y;
  ray.set(origin,inward);ray.near=.001;ray.far=distance;
  const hit=ray.intersectObjects(receivers,false)[0];return hit?hit.point.toArray():origin.addScaledVector(inward,distance).toArray();
 }
 function buildSurface(width,height,x0,z0,w,h,y){
  const direct=new Float32Array(width*height);
  for(let iz=0;iz<height;iz++)for(let ix=0;ix<width;ix++){
   const x=x0+ix/(width-1)*w,z=z0+iz/(height-1)*h,light=windowHeatValue(x,z,y);
   if(light<=0)continue;
   point.set(x,y+.009,z);ray.set(point,outward);ray.near=.015;ray.far=(sunWindow.x-.035-x)/outward.x;
   if(ray.far>0&&!ray.intersectObjects(receivers,false).length)direct[iz*width+ix]=light;
  }
  const near=blurHeat(direct,width,height,4),far=blurHeat(direct,width,height,10),heat=new Float32Array(direct.length);
  for(let i=0;i<heat.length;i++)heat[i]=direct[i]*.26+near[i]*.48+far[i]*.26;
  return {width,height,x0,z0,w,h,heat,direct};
 }
 function setRoom(root){root.updateMatrixWorld(true);receivers=[];root.traverse(o=>{if(o.isMesh)receivers.push(o);});
  fields={floor:buildSurface(64,52,-1.95,-1.55,3.9,3.1,sunFloorY),bed:buildSurface(32,42,-1.095,-.63,1.43,1.88,.535)};
 }
 function sample(x,z,isBed=false){
  if(!fields)return 0;const f=isBed?fields.bed:fields.floor;
  const u=Math.max(0,Math.min(f.width-1,(x-f.x0)/f.w*(f.width-1))),v=Math.max(0,Math.min(f.height-1,(z-f.z0)/f.h*(f.height-1))),ix=Math.floor(u),iz=Math.floor(v),fx=u-ix,fz=v-iz;
  const at=(a,b)=>f.heat[Math.min(f.height-1,b)*f.width+Math.min(f.width-1,a)];
  return (at(ix,iz)*(1-fx)+at(ix+1,iz)*fx)*(1-fz)+(at(ix,iz+1)*(1-fx)+at(ix+1,iz+1)*fx)*fz;
 }
 return {setRoom,sample,trace};
}
