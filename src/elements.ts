export const elements = [
  {name:'烈焰',color:'#ff785b',wave:'sawtooth',tempo:1.08,shift:0,motif:[0,7,3,12,7,10,3,7],kicks:[0,2,6,8,10,14]},
  {name:'流水',color:'#72caff',wave:'sine',tempo:.94,shift:5,motif:[0,2,7,9,7,2,4,7],kicks:[0,6,8,14]},
  {name:'暗影',color:'#b397ff',wave:'triangle',tempo:.98,shift:-5,motif:[0,1,7,6,3,1,6,7],kicks:[0,3,8,11]},
  {name:'鎏金',color:'#ffd66d',wave:'square',tempo:1.04,shift:7,motif:[0,4,7,12,11,7,4,7],kicks:[0,4,7,8,12,14]},
] as const;
export function characterElement(character:number){return elements[((Math.trunc(character)%4)+4)%4];}
export const heroScores=[
  {title:'炎刃・烽火進軍',tempo:1.06,shift:0,motif:[0,7,3,12,7,10,3,7],rhythm:[0,2,6,8,10,14]},
  {title:'凜夜・寒潮回響',tempo:.96,shift:0,motif:[12,7,2,0,2,9,7,4],rhythm:[0,6,8,14]},
  {title:'夜影・潛行之刃',tempo:1.02,shift:0,motif:[0,1,7,6,3,1,6,7],rhythm:[0,3,8,11]},
  {title:'雷曜・金戈戰歌',tempo:1.08,shift:0,motif:[0,4,7,12,11,7,4,7],rhythm:[0,4,7,8,12,14]},
  {title:'緋羽・鳳舞赤空',tempo:1.12,shift:12,motif:[12,10,7,3,7,12,15,10],rhythm:[0,3,6,8,11,14]},
  {title:'星璃・流光星海',tempo:1,shift:12,motif:[0,4,9,7,12,9,4,2],rhythm:[0,5,8,13]},
  {title:'紫夜・幻月咒歌',tempo:.92,shift:12,motif:[7,3,0,6,7,13,12,6],rhythm:[0,7,8,15]},
  {title:'映曦・曙光金羽',tempo:1.03,shift:12,motif:[4,7,12,14,12,7,9,4],rhythm:[0,2,8,12,15]},
] as const;
export const characterScore=(character:number)=>heroScores[((Math.trunc(character)%8)+8)%8];
