export const motionDefinitions={
  idle:{label:'待機呼吸・眨眼',frames:[0,1,0,2,0],fps:3},
  dash:{label:'前衝',frames:[3,4,5,4,5,0],fps:8},
  attack:{label:'蓄力・攻擊・收招',frames:[6,7,8,9,0],fps:7},
  hurt:{label:'受擊・恢復',frames:[10,11,0],fps:5},
  combo:{label:'連擊',frames:[6,7,8,9,7,8,9,0],fps:9},
  ultimate:{label:'必殺技',frames:[12,12,13,13,14,0],fps:5},
  victory:{label:'勝利',frames:[0,15,15,15,0],fps:4},
};
export type Motion=keyof typeof motionDefinitions;
// Individual choreography; sprite proportions remain uniform throughout each move.
export const heroChoreography=[
  {name:'踏步重斬',reach:155,lift:8,lean:12},
  {name:'浮空施法',reach:65,lift:24,lean:4},
  {name:'疾影突刺',reach:185,lift:12,lean:16},
  {name:'躍起重擊',reach:130,lift:32,lean:10},
  {name:'迴旋炎舞',reach:145,lift:20,lean:20},
  {name:'星潮升騰',reach:80,lift:30,lean:6},
  {name:'幻月側旋',reach:120,lift:22,lean:18},
  {name:'後撤放箭',reach:-40,lift:12,lean:-10},
] as const;
export const frameLabels=['待機','吸氣','眨眼','前衝預備','跨步一','跨步二','蓄力','出手','命中','收招','受擊','恢復','必殺蓄能','必殺釋放','必殺收勢','勝利'];
export const sheetUrl=(i:number)=>`${import.meta.env.BASE_URL}art/character-${i}.png`;
