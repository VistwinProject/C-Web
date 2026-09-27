const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
export function ambientAt(t){
 const dusk=smooth((t-30)/15),dawn=smooth((t-60)/18);
 return {day:1-dusk+dawn,dawn};
}
export function mixColor(a,b,t){
 const channels=[16,8,0].map(shift=>Math.round(((a>>shift)&255)*(1-t)+((b>>shift)&255)*t));
 return `rgb(${channels.join(',')})`;
}
export function ambientBackground(t){
 const {day,dawn}=ambientAt(t);
 const color=(night,noon,morning)=>{
  const channels=[16,8,0].map(shift=>Math.round(((night>>shift)&255)*(1-day)+((noon>>shift)&255)*(day-dawn)+((morning>>shift)&255)*dawn));
  return `rgb(${channels.join(',')})`;
 };
 return `radial-gradient(ellipse at 24% 30%,${color(0x071831,0xf8f2e2,0xfff8e5)} 0%,${color(0x030c1c,0xdddcd3,0xeae6da)} 48%,${color(0x00040d,0xb9c4c6,0xb7c2c4)} 100%)`;
}
