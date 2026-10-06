// C area trial: illustrative exhibition states, not measured thermal/sleep analysis.
// 0 / 30 / 60 remain the existing TouchDesigner scene boundaries.
export const narration = [
  [
    0,
    "01 · 最懂你的空間",
    "最懂你的空間，從設計規劃就開始。冷氣的送風方向、窗邊熱源與床位配置，在規劃時就一起考量。讓冷風避開直吹，也減少熱源對休息區的影響，為每一天的睡眠，預先安排更舒適的空間。",
    0.6,
    "01-layout-owner.wav"
  ],
  [
    30,
    "02 · 睡前到入睡",
    "準備休息，房間切換到睡前情境。冷氣先調整室溫，再轉為柔和送風；窗簾關閉，照明逐步降低。從睡前到入睡，一起觀察床位周圍的溫度與光線，如何隨著需求改變。",
    21.639,
    "02-sleep-owner.wav"
  ],
  [
    60,
    "03 · 清晨起床",
    "清晨到來，照明漸亮，窗簾緩緩開啟，冷氣自動切換到起床設定。從睡前、睡眠到起床，溫度、送風與光線，會隨著不同時刻調整。讓同一個房間，跟著一天之間不同的生活節奏，持續回應你與家人的需要。",
    40.798,
    "03-wake-owner.wav"
  ]
];
export const descriptions = [
 ['設計先行','從設計規劃階段，整合冷氣送風、窗邊熱源與床位配置。'],
 ['為舒眠預先考量','讓送風避開直吹，減少窗邊熱源對休息區的影響。'],
 ['睡前調整','冷氣預先調整室溫；窗簾關閉，照明由明轉暗。'],
 ['入睡維持','冷氣轉為低風量，保留低亮照明，觀察床位環境。'],
 ['起床調整','照明漸亮、窗簾開啟，冷氣切換到起床情境。'],
 ['回應生活節奏','同一個房間，持續回應你與家人的需要。']
];
const clamp = (v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));
const smooth = v => {v=clamp(v);return v*v*(3-2*v);};
const lerp = (a,b,t)=>a+(b-a)*t;
export function sampleEnvironment(t,{heat=34,target=26,fresh=26}={}) {
 t=clamp(t,0,90);
 const cool=smooth((t-8)/40),wake=smooth((t-60)/18);
 const curtain=t<30?0:t<45?smooth((t-30)/15):t<60?1:1-smooth((t-60)/15);
 // Fade daylight out before the night chapter; opening curtains at dawn restores it.
 const solar=(t<30?1-smooth((t-25)/5):t<60?0:.55*smooth((t-60)/15))*clamp((heat-24)/10,.15,1.4);
 const acPower=t<8?0:t<18?smooth((t-8)/10):t<30?1:t<45?lerp(1,.3,smooth((t-30)/15)):t<60?.3:lerp(.3,.5,wake);
 const acSet=t<30?target-1.5:t<45?lerp(target-1.5,target,smooth((t-30)/15)):t<60?target:lerp(target,target+.5,wake);
 // AC drives the illustrative room response. Fresh air is a separate mixing load.
 const initial=29+(heat-34)*.12;
 const equilibrium=acSet+.35*solar+.04*(fresh-acSet);
 const temp=lerp(initial,equilibrium,cool);
 const light=t<30?.75:t<45?lerp(.75,.08,smooth((t-30)/15)):t<60?.08:lerp(.08,.7,wake);
 const power=t<15?0:lerp(.2,.35,smooth((t-15)/15));
 return {temp,acSet,acPower,light,power,cool,curtain,solar,wake};
}
