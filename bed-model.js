import * as THREE from 'three';

// Exhibition linework at the measured bed footprint. The imported, decimated
// cloth meshes contain protruding triangles; keep the source GLB untouched.
export function createBedModel(bed) {
 const group=new THREE.Group();group.name='Bed presentation';
 const lineMaterial=new THREE.LineBasicMaterial({color:0x6b90b7,transparent:true,opacity:.62,depthWrite:false});
 const surface=new THREE.MeshBasicMaterial({color:0x6684a2,transparent:true,opacity:.075,depthWrite:false,side:THREE.FrontSide});
 const cx=bed.center[0],cz=bed.center[2];
 function contour(w,d,r,y,x=cx,z=cz){
  const pts=[];
  for(const [sx,sz,start] of [[1,1,0],[-1,1,90],[-1,-1,180],[1,-1,270]]){
   for(let i=0;i<=8;i++){const a=(start+i*90/8)*Math.PI/180;pts.push(new THREE.Vector3(x+sx*(w/2-r)+Math.cos(a)*r,y,z+sz*(d/2-r)+Math.sin(a)*r));}
  }
  pts.push(pts[0].clone());group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),lineMaterial.clone()));
 }
 function cushion(name,w,d,bottom,top,r){
  const shape=new THREE.Shape(),x=-w/2,z=-d/2;
  shape.moveTo(x+r,z);shape.lineTo(x+w-r,z);shape.quadraticCurveTo(x+w,z,x+w,z+r);
  shape.lineTo(x+w,z+d-r);shape.quadraticCurveTo(x+w,z+d,x+w-r,z+d);
  shape.lineTo(x+r,z+d);shape.quadraticCurveTo(x,z+d,x,z+d-r);
  shape.lineTo(x,z+r);shape.quadraticCurveTo(x,z,x+r,z);
  const bevel=.018,geo=new THREE.ExtrudeGeometry(shape,{depth:top-bottom-2*bevel,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:10});
  geo.rotateX(-Math.PI/2);const mesh=new THREE.Mesh(geo,surface.clone());mesh.name=name;mesh.position.set(cx,bottom+bevel,cz);group.add(mesh);
  contour(w,d,r,bottom+bevel);contour(w,d,r,top-bevel);
  for(const sx of [-1,1])for(const sz of [-1,1]){
   const px=cx+sx*(w/2-r+r/Math.sqrt(2)),pz=cz+sz*(d/2-r+r/Math.sqrt(2));
   const points=[new THREE.Vector3(px,bottom+bevel,pz),new THREE.Vector3(px,top-bevel,pz)];
   group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),lineMaterial.clone()));
  }
 }
 cushion('Bed base',bed.width+.035,bed.length+.04,.10,.315,.06);
 cushion('Mattress',bed.width-.036,bed.length-.036,.32,.535,.085);
 // Flat, gently domed pillows: no upright bounding boxes.
 for(const x of [cx-.355,cx+.355]){
  const z=cz+bed.length/2-.29;
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,32,16),surface.clone());mesh.name='Pillow';mesh.scale.set(.295,.07,.205);mesh.position.set(x,.605,z);group.add(mesh);
  const seam=[];for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;seam.push(new THREE.Vector3(x+Math.cos(a)*.295,.597,z+Math.sin(a)*.205));}
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(seam),lineMaterial.clone()));
  const ridge=[];for(let i=0;i<=32;i++){const a=i/32*Math.PI;ridge.push(new THREE.Vector3(x-Math.cos(a)*.295,.605+Math.sin(a)*.07,z));}
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ridge),lineMaterial.clone()));
 }
 return group;
}
