export type Kind = 'choice' | 'meaning' | 'idiom';
export type Question = {
  id: string; year: number; kind: Kind; prompt: string; options?: string[];
  answer: string; accepted: string[]; rejected?: string[]; explanation: string;
  source: string; origin: 'teacher_adapted'; status: 'needs_review'; version: string;
};
const terms = [
  ['屏氣凝神','抑止呼吸，集中精神','集中精神|專心一意|屏住呼吸集中精神'],
  ['驚心動魄','使人感觸很深，震撼很大','震撼很大|令人十分震撼'],
  ['光陰似箭','形容時間過得很快','時間過得很快|時間飛逝|時光飛逝'],
  ['不識之無','比喻不識字或毫無學問','不識字|沒有學問|毫無學問'],
  ['淋漓盡致','形容表達充分、透徹','表達得很充分|表達充分透徹|充分透徹'],
  ['不知所措','驚慌失度，不知道怎麼辦才好','不知道怎麼辦|驚慌得不知如何是好'],
  ['福壽全歸','對年高而有福者死亡的題辭','年高有福者去世的輓辭'],
  ['獨樹一格','比喻自成一家，有獨特的風格','有獨特的風格|自成一家|風格獨特'],
  ['臨風顧盼','形容志得意滿、神采飛揚的模樣','神采飛揚|志得意滿'],
  ['金科玉律','比喻不可變更的信條','不可變更的信條|不能更改的規則'],
  ['時過境遷','時間過去，情況也跟著改變','時間過去情況改變|時光流逝環境改變'],
  ['千載難逢','形容機會非常難得','機會難得|非常難得遇到|機會很難得'],
  ['老當益壯','年紀雖大，志氣卻更加豪壯','年紀大但志氣更豪壯|年老志氣更壯'],
  ['日積月累','長時間一點一滴地累積','長期累積|慢慢累積|一點一滴累積'],
  ['推波助瀾','助長事物的發展，使影響擴大','助長事情發展|助長聲勢'],
  ['倚老賣老','自恃年紀大、閱歷豐富而看不起別人','仗著年紀大看不起別人'],
  ['適可而止','到適當的程度就停止','到適當程度就停止|恰到好處就停止|適當就停止'],
  ['事倍功半','花費的力量多，得到的成效少','花很多力氣但成效少|付出多收穫少|花費多效果小'],
  ['大快朵頤','痛快地享用美食','痛快吃東西|大吃一頓|享用美食'],
];
function q(i: number, kind: Kind, prompt: string, answer: string, accepted: string[], options?: string[]): Question {
  return { id:`demo-103-${i+1}`, year:103, kind, prompt, answer, accepted, options,
    explanation: terms.find(t=>t[0]===answer)?.[1] ?? answer,
    source:'蔡思怡老師編製練習／103學年度配對詞條；本題為改編示範，尚未教師核准',
    origin:'teacher_adapted',status:'needs_review',version:'demo-v1' };
}
export const questions: Question[] = [
  ...terms.slice(0,8).map((t,i)=>{
    const options = [t[1],terms[(i+5)%19][1],terms[(i+10)%19][1],terms[(i+14)%19][1]];
    const shift=i%4;
    return q(i,'choice',`「${t[0]}」的意思最接近下列哪一項？`,t[1],[t[1]], [...options.slice(shift),...options.slice(0,shift)]);
  }),
  ...[2,17].map((idx,i)=>{
    const t=terms[idx]; return q(i+8,'meaning',`請用自己的話解釋「${t[0]}」。`,t[1],[t[1],...t[2].split('|')]);
  }),
  ...[9,10].map((idx,i)=>{
    const t=terms[idx];return q(i+10,'idiom',`請填入103年練習中的成語：${t[1]}。`,t[0],[t[0]]);
  })
];
questions[9].rejected=['付出少收穫多','事半功倍','花少量力氣效果很好'];
export const questionPoints=(question:Question)=>question.kind==='choice'?10:5;
export const QUESTION_COUNT=12;
export const MATCH_VERSION='demo-v2-12' as const;
export const characters = [
  {name:'炎刃',role:'火焰劍士',skill:'烈焰斬擊',color:'#ff785b',tag:'炎',available:true},
  {name:'凜夜',role:'冰霜法師',skill:'極寒風暴',color:'#72caff',tag:'冰',available:true},
  {name:'夜影',role:'暗影忍者',skill:'影分身斬',color:'#b397ff',tag:'影',available:true},
  {name:'雷曜',role:'雷霆戰士',skill:'天雷降臨',color:'#ffd66d',tag:'雷',available:true},
  {name:'緋羽',role:'赤焰女武神',skill:'鳳凰炎舞',color:'#ff785b',tag:'炎',available:true},
  {name:'星璃',role:'星辰魔導士',skill:'星河審判',color:'#72caff',tag:'星',available:true},
  {name:'紫夜',role:'幻影魔女',skill:'幻月之刃',color:'#b397ff',tag:'月',available:true},
  {name:'映曦',role:'疾風射手',skill:'千羽風暴',color:'#ffd66d',tag:'風',available:true},
];
export const demoProfiles = [
  {id:'a0000000-0000-4000-8000-000000000001',name:'練習生 A'},
  {id:'a0000000-0000-4000-8000-000000000002',name:'練習生 B'},
];
