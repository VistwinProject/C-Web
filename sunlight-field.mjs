// Parallel sunlight through the model's +X window. Exhibition angle, not a site solar study.
export const sunWindow={x:1.805,yMin:.89,yMax:2.13,zMin:-.305,zMax:.945};
export const sunDirection=[-.60,-1,-.16],sunFloorY=.079;
export const windowCorners=[
 [sunWindow.x,sunWindow.yMin,sunWindow.zMin],[sunWindow.x,sunWindow.yMin,sunWindow.zMax],
 [sunWindow.x,sunWindow.yMax,sunWindow.zMax],[sunWindow.x,sunWindow.yMax,sunWindow.zMin]
];
export function sunLanding(point){const t=(sunFloorY-point[1])/sunDirection[1];return point.map((v,i)=>v+t*sunDirection[i]);}
export const sunFootprint=windowCorners.map(sunLanding);
const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
export function windowHeatValue(wx,wz,surfaceY=sunFloorY){
 const t=(wx-sunWindow.x)/sunDirection[0];if(t<0)return 0;
 const wy=surfaceY-t*sunDirection[1],sourceZ=wz-t*sunDirection[2];
 const edge=Math.min(wy-sunWindow.yMin,sunWindow.yMax-wy,sourceZ-sunWindow.zMin,sunWindow.zMax-sourceZ);
 return smooth(edge/.16);
}
export function blurHeat(values,width,height,radius){
 const out=new Float32Array(values.length),temp=new Float32Array(values.length),sigma=Math.max(.5,radius/2),kernel=[];
 let sum=0;for(let k=-radius;k<=radius;k++){const w=Math.exp(-k*k/(2*sigma*sigma));kernel.push(w);sum+=w;}
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){let v=0;for(let k=-radius;k<=radius;k++)if(x+k>=0&&x+k<width)v+=values[y*width+x+k]*kernel[k+radius];temp[y*width+x]=v/sum;}
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){let v=0;for(let k=-radius;k<=radius;k++)if(y+k>=0&&y+k<height)v+=temp[(y+k)*width+x]*kernel[k+radius];out[y*width+x]=v/sum;}
 return out;
}
