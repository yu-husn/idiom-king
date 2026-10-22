import {describe,it,expect} from 'vitest';
import {questions,type Question,characters} from '../src/data';
import {grade,summarize,outcome,appendRound,revise,selectOfficialQuestions,upsertCompleted,type Match,type Answer} from '../src/domain';
import {motionDefinitions} from '../src/animations';
const a=(correct:boolean):Answer=>({raw:'test',verdict:correct?'correct':'incorrect',reason:'fixture',elapsed:1000});
function match(left:number,right:number):Match{return {id:'test',profileId:'fake-a',opponentId:'fake-b',character:0,mode:'local',difficulty:1,createdAt:'2026-10-20T00:00:00Z',version:'demo-v2-12',complete:true,rounds:questions.map((q,i)=>({questionId:q.id,answers:[a(i<left),a(i<right)]}))};}
describe('計分與通關',()=>{
  it('選擇全對80分、填充全對20分；55與60邊界',()=>{
    expect(summarize(match(8,0),0).score).toBe(80);
    const m=match(0,0);m.rounds.slice(8).forEach(r=>r.answers[0]=a(true));
    expect(summarize(m,0).score).toBe(20);
    m.rounds.slice(0,3).forEach(r=>r.answers[0]=a(true));
    m.rounds[3].answers[0]=a(true);m.rounds[11].answers[0]=a(false);
    expect(summarize(m,0)).toMatchObject({score:55,passed:false});
    m.rounds[11].answers[0]=a(true);
    expect(summarize(m,0)).toMatchObject({score:60,passed:true});
  });
  it('12題、8/2/2，題號不重複且保留來源',()=>{
    expect(questions).toHaveLength(12);expect(new Set(questions.map(q=>q.id)).size).toBe(12);
    expect(['choice','meaning','idiom'].map(k=>questions.filter(q=>q.kind===k).length)).toEqual([8,2,2]);
    expect(questions.every(q=>q.source&&q.year===103&&q.status==='needs_review')).toBe(true);
    for(const q of questions.filter(q=>q.kind==='choice')){expect(new Set(q.options).size).toBe(4);expect(q.options).toContain(q.answer);}
  });
  it('50分不過、60分通關',()=>{expect(summarize(match(5,0),0).passed).toBe(false);expect(summarize(match(6,0),0).passed).toBe(true);});
  it('輸PK但60分仍過，贏PK但50分仍不過',()=>{expect(outcome(match(6,12))).toBe('right');expect(summarize(match(6,12),0).passed).toBe(true);expect(outcome(match(5,4))).toBe('left');expect(summarize(match(5,4),0).passed).toBe(false);});
  it('連擊不加分，12答對最多100',()=>expect(summarize(match(12,12),0).score).toBe(100));
  it('平手獨立判定',()=>expect(outcome(match(12,12))).toBe('tie'));
  it('未滿12題不能通關',()=>{const m=match(12,12);m.rounds.pop();expect(summarize(m,0).passed).toBe(false);expect(outcome(m)).toBe('pending');});
  it('重複提交同題不重複計分',()=>{let m=match(0,0);m={...m,complete:false,rounds:[]};m=appendRound(m,{questionId:questions[0].id,answers:[a(true),a(true)]});expect(appendRound(m,m.rounds[0]).rounds).toHaveLength(1);});
  it('待複核不判勝負，改判有歷史並重算',()=>{const m=match(6,5);m.rounds[0].answers[0].verdict='review';expect(outcome(m)).toBe('pending');expect(summarize(m,0).passed).toBe(false);const r=revise(m,0,0,'correct');expect(outcome(r)).toBe('left');expect(summarize(r,0).score).toBe(60);expect(r.rounds[0].answers[0].revised).toHaveLength(1);expect(m.rounds[0].answers[0].verdict).toBe('review');});
  it('正式模式拒絕未核准示範題',()=>expect(selectOfficialQuestions(questions)).toHaveLength(0));
  it('複核舊成績不改變首次挑戰的順序',()=>{const first=match(10,10),second={...match(11,10),id:'second'};const changed=revise(first,0,0,'correct');expect(upsertCompleted([first,second],changed).map(m=>m.id)).toEqual(['test','second']);});
});
describe('填充判分保守邊界',()=>{
  it('接受已收錄同義與標點',()=>expect(grade(questions[8],' 時間，飛逝。 ').verdict).toBe('correct'));
  it('否定不能因包含關鍵字被判對',()=>expect(grade(questions[8],'時間沒有飛逝').verdict).toBe('review'));
  it('模糊、錯字交人工',()=>{expect(grade(questions[8],'很快').verdict).toBe('review');expect(grade(questions[10],'金科玉綠').verdict).toBe('review');});
  it('空白0分',()=>expect(grade(questions[8],'  ').verdict).toBe('incorrect'));
  it('事倍功半不能收事半功倍',()=>expect(grade(questions[9],'事半功倍').verdict).toBe('incorrect'));
  it('不以為然與不以為意測試規則',()=>{const q:Question={...questions[8],answer:'不認同',accepted:['不認同','不同意'],rejected:['不放在心上']};expect(grade(q,'不同意').verdict).toBe('correct');expect(grade(q,'不放在心上').verdict).toBe('incorrect');});
});
describe('角色與動作',()=>{
  it('八位與紅藍紫黃配對，映曦更名',()=>{expect(characters).toHaveLength(8);expect(characters.slice(0,4).map(c=>c.color)).toEqual(characters.slice(4).map(c=>c.color));expect(characters[7].name).toBe('映曦');});
  it('七種動作索引都在16格以內',()=>{expect(Object.keys(motionDefinitions)).toHaveLength(7);for(const d of Object.values(motionDefinitions)){expect(d.frames.every(f=>f>=0&&f<16)).toBe(true);expect(new Set(d.frames).size).toBeGreaterThan(1);}});
});

