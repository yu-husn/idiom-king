import {describe,it,expect} from 'vitest';
import {annualPracticeBank,drawQuestions} from '../src/annualBank';
import {questionPoints} from '../src/data';
import {appendRound,grade,summarize,matchQuestions,type Match} from '../src/domain';
describe('年度30題與隨機抽題',()=>{
  it('13年度共390題，24選擇、6填成語；來源、解析及選項完整',()=>{
    expect(annualPracticeBank).toHaveLength(390);
    expect(new Set(annualPracticeBank.map(q=>q.id)).size).toBe(390);
    for(let year=103;year<=115;year++){
      const bank=annualPracticeBank.filter(q=>q.year===year);
      expect(['choice','meaning','idiom'].map(k=>bank.filter(q=>q.kind===k).length)).toEqual([24,0,6]);
      for(const q of bank){expect(q.source).toContain('非官方原題');expect(q.explanation).toBeTruthy();expect(q.accepted).toContain(q.answer);expect(q.status).toBe('needs_review');
        if(q.options){expect(q.options).toHaveLength(4);expect(new Set(q.options).size).toBe(4);expect(q.options.filter(o=>o===q.answer)).toHaveLength(1);}}
    }
  });
  it('每年多次抽樣仍為8/4、100分、不重複、不跨年',()=>{
    for(let y=103;y<=115;y++)for(let n=0;n<30;n++){
      const deck=drawQuestions(y);expect(deck).toHaveLength(12);expect(new Set(deck.map(q=>q.id)).size).toBe(12);
      expect(deck.every(q=>q.year===y)).toBe(true);expect(deck.reduce((a,q)=>a+questionPoints(q),0)).toBe(100);
      expect(['choice','meaning','idiom'].map(k=>deck.filter(q=>q.kind===k).length)).toEqual([8,0,4]);
    }
    expect(drawQuestions(104,()=>0).map(q=>q.id)).not.toEqual(drawQuestions(104,()=>.99).map(q=>q.id));
    expect(()=>drawQuestions(102)).toThrow();
  });
  it('題目快照可持續計分，不接受別場題目，待複核不通關',()=>{
    const deck=drawQuestions(104,()=>.4);let m:Match={id:'test',year:104,deck,profileId:'a',opponentId:'b',character:0,mode:'local',difficulty:1,rounds:[],createdAt:'test',version:'demo-v2-12',complete:false};
    for(const q of deck){const a={raw:q.answer,...grade(q,q.answer),elapsed:1000};m=appendRound(m,{questionId:q.id,answers:[a,{...a}]});}
    expect(summarize(m,0)).toMatchObject({score:100,passed:true});
    expect(matchQuestions(JSON.parse(JSON.stringify(m)))).toEqual(deck);
    m.rounds[8].answers[0].verdict='review';expect(summarize(m,0).passed).toBe(false);
    const empty={...m,rounds:[],complete:false};expect(appendRound(empty,{...m.rounds[0],questionId:'other-year'})).toBe(empty);
  });
});

it('填成語必須逐字一致，不送AI或複核',()=>{
 const q=annualPracticeBank.find(q=>q.kind==='idiom')!;
 expect(grade(q,q.answer).verdict).toBe('correct');
 for(const raw of [q.answer+'。',' '+q.answer,q.answer.slice(0,-1),'不確定','同義成語'])expect(grade(q,raw).verdict).toBe('incorrect');
});
