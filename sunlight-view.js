import * as THREE from 'three';
import {sunWindow} from './sunlight-field.mjs';
export function createSunlight(scene,exposure){
 const material=new THREE.LineBasicMaterial({color:0xd2943e,transparent:true,opacity:0,depthWrite:false});
 const lines=new THREE.LineSegments(new THREE.BufferGeometry(),material);lines.renderOrder=4;scene.add(lines);
 function rebuild(){
  const points=[];
  for(const y of [.22,.55,.86])for(const z of [.24,.72]){
   const start=[sunWindow.x,sunWindow.yMin+y*(sunWindow.yMax-sunWindow.yMin),sunWindow.zMin+z*(sunWindow.zMax-sunWindow.zMin)];
   points.push(new THREE.Vector3(...start),new THREE.Vector3(...exposure.trace(start)));
  }
  lines.geometry.dispose();lines.geometry=new THREE.BufferGeometry().setFromPoints(points);
 }
 return {rebuild,update(strength,visible){lines.visible=visible&&strength>.01;material.opacity=.23*Math.min(1,strength);}};
}
