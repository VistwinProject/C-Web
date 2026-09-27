import {cameraPose} from './camera-timeline.mjs';
// Each emphasis is: full room -> named object -> hold -> full room.
// Targets are the actual device positions, not a small bias from the room center.
const shot=(time,name,target,zoom=1)=>({time,name,target,zoom,focus:name.includes("冷氣")?"ac":name.includes("床位")?"bed":/窗/.test(name)?"window":null,yaw:0,pitch:0});
const home=[0,.9,0],ac=[.68,2.42,.03],window=[1.72,1.45,.30],bed=[-.38,.60,.32];
export const shots=[
 shot(0,'空間全景',home),shot(6.0,'空間全景',home),
 shot(7.2,'冷氣出風口特寫',ac,1.5),shot(8.8,'冷氣出風口特寫',ac,1.5),shot(10.1,'空間全景',home),
 shot(10.3,'空間全景',home),shot(11.5,'窗邊熱源特寫',window,1.4),shot(13.2,'窗邊熱源特寫',window,1.4),shot(14.5,'空間全景',home),
 shot(17.5,'空間全景',home),shot(18.8,'床位配置特寫',bed,1.3),shot(21.5,'床位配置特寫',bed,1.3),shot(23.0,'空間全景',home),
 shot(35.4,'空間全景',home),shot(36.8,'冷氣送風特寫',ac,1.5),shot(39.2,'冷氣送風特寫',ac,1.5),shot(40.5,'空間全景',home),
 shot(41.0,'空間全景',home),shot(42.3,'窗簾關閉特寫',window,1.4),shot(43.7,'窗簾關閉特寫',window,1.4),shot(45.0,'空間全景',home),
 shot(46.0,'空間全景',home),shot(47.4,'床位環境特寫',bed,1.3),shot(50.8,'床位環境特寫',bed,1.3),shot(52.2,'空間全景',home),
 shot(63.0,'空間全景',home),shot(64.4,'晨光窗簾特寫',window,1.4),shot(66.0,'晨光窗簾特寫',window,1.4),shot(67.3,'空間全景',home),
 shot(67.7,'空間全景',home),shot(69.0,'起床冷氣特寫',ac,1.5),shot(70.4,'起床冷氣特寫',ac,1.5),shot(71.8,'空間全景',home),
 shot(90,'結尾全景',home)
];
export const cameraAt=(time,reduced=false)=>cameraPose(shots,time,reduced);
