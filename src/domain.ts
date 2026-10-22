import {yearQuestions} from './annualBank';
import {questionPoints,QUESTION_COUNT,MATCH_VERSION,type Question} from './data';
export type Verdict='correct'|'incorrect'|'review';
export type Answer={raw:string; verdict:Verdict; reason:string; elapsed:number; revised?:{from:Verdict;to:Verdict;at:string}[]};
export type Round={questionId:string; answers:[Answer,Answer]};
export type Match={id:string; year?:number; deck?:Question[]; profileId:string; opponentId:string; character:number; opponentCharacter?:number; mode:'bot'|'local'; difficulty:number; rounds:Round[]; createdAt:string; version:typeof MATCH_VERSION; complete:boolean};
export const matchQuestions=(m:Match)=>m.deck??yearQuestions(m.year??103);
export const normalize=(s:string)=>s.normalize('NFKC').replace(/[\s，。！？、；：「」『』,.!?;:"']/g,'').trim();
export function grade(q:Question,raw:string):Pick<Answer,'verdict'|'reason'>{
  if(q.kind==='idiom')return raw===q.answer?{verdict:'correct',reason:'與標準成語完全一致'}:{verdict:'incorrect',reason:raw.trim()?'須與標準成語逐字一致（含字形，不接受錯字、同義詞或額外標點）':'未作答／逾時'};
  const n=normalize(raw);
  if(!n) return {verdict:'incorrect',reason:'未作答／逾時'};
  if(q.accepted.some(a=>normalize(a)===n)) return {verdict:'correct',reason:'符合示範答案或收錄的同義表達'};
  if(q.kind==='choice' || q.rejected?.some(a=>normalize(a)===n))
    return {verdict:'incorrect',reason:'選項不正確或符合已標記的近義陷阱'};
  return {verdict:'review',reason:'尚未收錄的表達，需人工複核；P1未連接AI'};
}
export function summarize(m:Match,player:0|1){
  const answers=m.rounds.map(r=>r.answers[player]);
  const score=matchQuestions(m).reduce((total,q)=>total+(m.rounds.find(r=>r.questionId===q.id)?.answers[player].verdict==='correct'?questionPoints(q):0),0);
  const pending=answers.filter(a=>a.verdict==='review').length;
  return {score,pending,passed:m.complete&&m.rounds.length===QUESTION_COUNT&&pending===0&&score>=60};
}
export function outcome(m:Match):'pending'|'tie'|'left'|'right'{
  const a=summarize(m,0),b=summarize(m,1);
  if(!m.complete||m.rounds.length!==QUESTION_COUNT||a.pending||b.pending)return 'pending';
  return a.score===b.score?'tie':a.score>b.score?'left':'right';
}
export function appendRound(m:Match,r:Round):Match {
  if(m.complete||m.rounds.length>=QUESTION_COUNT||!matchQuestions(m).some(q=>q.id===r.questionId)||m.rounds.some(x=>x.questionId===r.questionId)) return m;
  const rounds=[...m.rounds,r];
  return {...m,rounds,complete:rounds.length===QUESTION_COUNT};
}
export function upsertCompleted(matches:Match[],m:Match):Match[]{
  return matches.some(x=>x.id===m.id)?matches.map(x=>x.id===m.id?m:x):[...matches,m];
}
export function streak(m:Match,p:0|1){
  let n=0; for(let i=m.rounds.length-1;i>=0&&m.rounds[i].answers[p].verdict==='correct';i--)n++;
  return n;
}
export function revise(m:Match,idx:number,player:0|1,to:'correct'|'incorrect'):Match {
  return {...m,rounds:m.rounds.map((r,i)=>i!==idx?r:{...r,answers:r.answers.map((a,p)=>p!==player?a:{
    ...a,verdict:to,reason:'本機複核演練已判定',revised:[...(a.revised??[]),{from:a.verdict,to,at:new Date().toISOString()}]
  }) as [Answer,Answer]})};
}
export function selectOfficialQuestions(bank:Question[]){
  // The P1 bank is deliberately not approved and cannot enter the production path.
  return bank.filter(q=>(q.status as string)==='approved');
}
export const STORAGE_KEY='idiom-king-demo-v2-12';
export type Store={matches:Match[];character:number;profileId:string;active?:Match};
export const emptyStore=():Store=>({matches:[],character:0,profileId:'a0000000-0000-4000-8000-000000000001'});
export function loadStore():Store{
  try{
    const s=JSON.parse(localStorage.getItem(STORAGE_KEY)??'null');
    if(s&&Array.isArray(s.matches)&&typeof s.profileId==='string')return {...s,matches:s.matches.filter((m:Match)=>m.version===MATCH_VERSION),active:s.active?.version===MATCH_VERSION?s.active:undefined};
    // Preserve the original 20-question save byte-for-byte; only copy appearance/profile.
    const old=JSON.parse(localStorage.getItem('idiom-king-demo-v1')??'null');
    return {...emptyStore(),...(old&&typeof old.profileId==='string'?{profileId:old.profileId,character:Number.isInteger(old.character)&&old.character>=0&&old.character<8?old.character:0}:{})};
  }
  catch{return emptyStore();}
}
export function persist(s:Store):boolean{
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(s));return true;}catch{return false;}
}
