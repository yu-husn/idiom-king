export type AnnualScore={year:number;name:string;bpm:number;root:number;voice:OscillatorType;melody:number[];bass:number[];kicks:number[]};
// Original motifs, expressed as semitone offsets; each year has its own score.
export const annualScores:AnnualScore[]=[
  {year:103,name:'初始之森',bpm:138,root:52,voice:'sawtooth',melody:[12,19,15,19,14,19,17,15,12,15,19,24,22,19,15,14],bass:[0,8,3,10],kicks:[0,3,8,10]},
  {year:104,name:'風之迴廊',bpm:144,root:50,voice:'triangle',melody:[19,17,14,12,14,17,21,19,17,14,10,14,17,22,21,17],bass:[0,5,10,7],kicks:[0,6,8,14]},
  {year:105,name:'冰晶湖',bpm:128,root:54,voice:'sine',melody:[24,19,15,12,19,22,17,14,22,19,15,10,17,14,12,19],bass:[0,3,8,7],kicks:[0,8,11]},
  {year:106,name:'烈焰隘口',bpm:156,root:48,voice:'sawtooth',melody:[12,12,15,19,12,15,20,19,17,17,15,14,12,19,24,23],bass:[0,0,8,7],kicks:[0,2,6,8,10,14]},
  {year:107,name:'星河遺跡',bpm:134,root:57,voice:'triangle',melody:[12,16,19,23,26,23,19,16,14,17,21,24,23,21,17,14],bass:[0,5,2,7],kicks:[0,5,8,13]},
  {year:108,name:'影之迷宮',bpm:142,root:49,voice:'square',melody:[12,13,19,18,12,15,18,19,24,19,18,15,13,12,7,11],bass:[0,1,6,7],kicks:[0,3,7,10,14]},
  {year:109,name:'雷鳴山脈',bpm:160,root:52,voice:'sawtooth',melody:[12,19,24,19,22,17,22,17,20,15,20,15,19,14,23,19],bass:[0,10,8,7],kicks:[0,2,8,10,11,14]},
  {year:110,name:'月光神殿',bpm:126,root:55,voice:'sine',melody:[19,24,22,19,17,22,20,17,15,19,17,15,14,17,19,23],bass:[0,5,8,7],kicks:[0,6,8,12]},
  {year:111,name:'沙海遠征',bpm:148,root:50,voice:'square',melody:[12,13,16,19,20,19,16,13,12,16,17,20,19,16,13,11],bass:[0,1,5,7],kicks:[0,3,6,8,11]},
  {year:112,name:'天空之橋',bpm:150,root:53,voice:'triangle',melody:[12,19,21,24,28,24,21,19,17,21,24,26,24,21,19,16],bass:[0,7,9,5],kicks:[0,4,7,8,12]},
  {year:113,name:'深淵回聲',bpm:140,root:47,voice:'sawtooth',melody:[12,7,12,15,14,10,14,17,15,12,15,18,19,18,14,11],bass:[0,10,8,6],kicks:[0,5,8,11,14]},
  {year:114,name:'黎明堡壘',bpm:154,root:55,voice:'square',melody:[12,16,19,24,23,19,16,19,17,21,24,29,28,24,21,19],bass:[0,5,9,7],kicks:[0,2,6,8,12,14]},
  {year:115,name:'王者之巔',bpm:166,root:52,voice:'sawtooth',melody:[12,15,19,24,27,24,22,19,20,24,27,29,26,23,19,11],bass:[0,8,5,7],kicks:[0,3,6,8,10,14,15]}
];
