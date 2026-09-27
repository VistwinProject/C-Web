// Exhibition illustration of relative environmental warmth, not a CFD result.
import {windowHeatValue} from './sunlight-field.mjs';
export {windowHeatValue};
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
function lobe(x,z,cx,cz,sx,sz,angle=0){
 const dx=x-cx,dz=z-cz,c=Math.cos(angle),s=Math.sin(angle);
 return Math.exp(-((dx*c+dz*s)**2/sx**2+(-dx*s+dz*c)**2/sz**2));
}
export function projectionValue(wx,wz,state,isBed,exposure,environment={}){
 const sun=environment.solar??1,ac=environment.acPower??.85;
 // Broad, stable variations bend the falloff around the furnishing layout.
 // They modulate source fields rather than generating unrelated colored spots.
 const x=wx+.09*Math.sin(wz*3.1+wx*.7),z=wz+.07*Math.sin(wx*3.8-wz);
 const variation=Math.sin(x*4.7+z*2.2)*Math.cos(z*3.3-x)*.040;
 const daylight=exposure??windowHeatValue(wx,wz);
 const windowSpread=lobe(x,z,1.37,.15,.88,1.35,-.28);
 const roomWarm=lobe(x,z,1.6,1.04,1.3,.73,.35);
 const cool=lobe(x,z,.58,.91,.72,1.02,-.4)*.8+lobe(x,z,-1.18,.88,.55,.84,.4)*.42;
 if(isBed){
  const bedCool=lobe(x,z,-.51,.69,.57,.81,-.26);
  const shelter=lobe(x,z,-.25,-.32,.72,.43,.35);
  return clamp(.36+variation+sun*(.105*windowSpread+.045*daylight)+.035*shelter-ac*(.105*bedCool+.045*cool),.21,.47);
 }
 const standing=state.occupantVisible?state.opacity*.055*lobe(x,z,state.position[0],state.position[2],.24,.30,.2):0;
 return clamp(.32+variation+sun*(.46*daylight+.23*windowSpread+.075*roomWarm)-(.35+.65*ac)*.28*cool-.095*lobe(x,z,-1.12,-.82,.72,.98,-.6)+standing,.10,.94);
}
export const thermalPalette=['#2864b6','#22afd2','#65cdab','#dad366','#f29b46','#e96742'];
