import {yearQuestions,drawQuestions} from './annualBank';
import {useEffect,useRef,useState} from 'react';
import {characters,demoProfiles,questionPoints,MATCH_VERSION} from './data';
import {appendRound,grade,loadStore,outcome,persist,revise,streak,summarize,upsertCompleted,matchQuestions,type Match,type Answer,type Store} from './domain';
import Battle,{type BattleEvent} from './Battle';
import {battleDuration} from './combatTiming';
import {sound,music} from './audio';
import {annualScores} from './scores';
import {characterElement} from './elements';
import {HeroStage} from './HeroStage';
import {QuestHud} from './QuestHud';

const labels={correct:'答對',incorrect:'答錯 +0',review:'待複核'};
const difficulties=['見習騎士','精英劍士','傳說戰神'];
const fontOptions={sans:{label:'清晰黑體',family:'"Noto Sans TC","Microsoft JhengHei",sans-serif'},serif:{label:'經典明體',family:'"Noto Serif TC","PMingLiU",serif'},system:{label:'系統字體',family:'system-ui,sans-serif'}};
type FontChoice=keyof typeof fontOptions;
function Portrait({index,large=false}:{index:number;large?:boolean}){
  return <div className={`portrait ${large?'large':''}`} style={{backgroundPosition:`${(index%4)*100/3}% ${index<4?0:100}%`}}/>;
}
export default function App(){
  const [store,setStore]=useState<Store>(loadStore);
  const [page,setPage]=useState<'lobby'|'world'|'battle'|'result'|'history'>('lobby');
  const [selectedStage,setSelectedStage]=useState(0);
  const [fontChoice,setFontChoice]=useState<FontChoice>(()=>{try{const saved=localStorage.getItem('idiom-king-font');return saved&&Object.hasOwn(fontOptions,saved)?saved as FontChoice:'sans';}catch{return 'sans';}});
  useEffect(()=>{try{localStorage.setItem('idiom-king-font',fontChoice);}catch{/* Optional appearance preference. */}},[fontChoice]);
  const [mode,setMode]=useState<'bot'|'local'>('bot'),[difficulty,setDifficulty]=useState(1);
  const [match,setMatch]=useState<Match|null>(null);
  const [inputs,setInputs]=useState<[string,string]>(['','']);
  const [locked,setLocked]=useState<[string|null,string|null]>([null,null]);
  const [feedback,setFeedback]=useState(false),[event,setEvent]=useState<BattleEvent>();
  const [animationReady,setAnimationReady]=useState(true);
  const [remaining,setRemaining]=useState(10),[notice,setNotice]=useState('');
  const [volume,setVolume]=useState(.35),[reduce,setReduce]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),[low,setLow]=useState(false);
  const [rival,setRival]=useState(1);
  const [musicOn,setMusicOn]=useState(false),[musicVolume,setMusicVolume]=useState(.4);
  const musicLevel=useRef(musicVolume);musicLevel.current=musicVolume;
  const musicTheme=page==='battle'?'battle':page==='result'?'victory':'journey';
  const musicYear=(page==='battle'||page==='result')?(match?.year??103):103+selectedStage;
  const questions=match?matchQuestions(match):yearQuestions(103);
  useEffect(()=>{
    const sync=()=>{music.stop();if(musicOn&&!document.hidden)music.play(musicTheme,musicLevel.current,musicYear,store.character);};
    sync();document.addEventListener('visibilitychange',sync);
    return()=>{music.stop();document.removeEventListener('visibilitychange',sync);};
  },[musicOn,musicTheme,musicYear,store.character]);
  useEffect(()=>{music.volume(musicVolume);},[musicVolume]);
  async function toggleMusic(){
    if(musicOn){setMusicOn(false);return;}
    try{await music.unlock();setMusicOn(true);}
    catch{setNotice('瀏覽器尚未允許播放音樂，請再次點擊「開啟配樂」。');}
  }
  const deadline=useRef(Date.now()+10000),started=useRef(Date.now()),processed=useRef(false);
  const elapsed=useRef<[number,number]>([0,0]);
  useEffect(()=>{if(!persist(store))setNotice('瀏覽器無法儲存紀錄，請先匯出練習結果。');},[store]);
  useEffect(()=>{
    if(!event)return;
    setAnimationReady(false);
    const t=setTimeout(()=>setAnimationReady(true),battleDuration(event.verdicts,reduce));
    return()=>clearTimeout(t);
  },[event,reduce]);
  const profile=demoProfiles.find(p=>p.id===store.profileId)??demoProfiles[0];
  const ownMatches=store.matches.filter(m=>m.profileId===profile.id || m.opponentId===profile.id);
  const ownSummary=(m:Match)=>summarize(m,m.profileId===profile.id?0:1);
  const yearPassed=(year:number)=>ownMatches.some(m=>(m.year??103)===year&&ownSummary(m).passed);
  const unlocked=(year:number)=>year===103||Array.from({length:year-103},(_,i)=>103+i).every(yearPassed);

  function saveMatch(m:Match){
    setMatch(m);
    setStore(s=>({...s,active:m.complete?(s.active?.id===m.id?undefined:s.active):m,matches:m.complete?upsertCompleted(s.matches,m):s.matches}));
  }
  function resetRound(){
    setInputs(['','']);setLocked([null,null]);setFeedback(false);setRemaining(10);
    processed.current=false;deadline.current=Date.now()+10000;started.current=Date.now();elapsed.current=[0,0];
  }
  function start(resume=false,year=103+selectedStage){
    if(!resume&&!unlocked(year)){setNotice('請先完成前一年度，達60分且無待複核題。');return;}
    const m=resume&&store.active?store.active:{
      id:crypto.randomUUID(),year,deck:drawQuestions(year),profileId:store.profileId,opponentId:mode==='bot'?'bot':demoProfiles.find(p=>p.id!==store.profileId)!.id,
      character:store.character,opponentCharacter:rival,mode,difficulty,rounds:[],createdAt:new Date().toISOString(),version:MATCH_VERSION,complete:false
    };
    setSelectedStage((m.year??103)-103);saveMatch(m);resetRound();setPage('battle');setEvent(undefined);sound('start',volume);
  }
  const q=questions[match?Math.min(match.rounds.length,questions.length-1):0];
  useEffect(()=>{
    if(page!=='battle'||feedback||!match)return;
    const tick=setInterval(()=>{
      const left=Math.max(0,Math.ceil((deadline.current-Date.now())/1000));setRemaining(left);
      if(left===0)setLocked(a=>a.map((v,i)=>{if(v===null)elapsed.current[i]=10000;return v??'';}) as [string,string]);
    },200);
    return()=>clearInterval(tick);
  },[page,feedback,match?.rounds.length]);
  useEffect(()=>{
    if(page!=='battle'||feedback||!match||match.mode!=='bot')return;
    const t=setTimeout(()=>{
      const correct=Math.random()<[.45,.7,.9][match.difficulty];
      const raw=correct?q.answer:q.options?.find(o=>o!==q.answer)??'';
      elapsed.current[1]=Date.now()-started.current;
      setLocked(a=>[a[0],raw]);
    },1300+Math.random()*1800);
    return()=>clearTimeout(t);
  },[page,feedback,match?.rounds.length]);
  useEffect(()=>{
    if(page!=='battle'||!match||locked.some(a=>a===null)||processed.current)return;
    processed.current=true;
    const answers=locked.map((raw,i)=>({raw:raw!,...grade(q,raw!),elapsed:elapsed.current[i]})) as [Answer,Answer];
    const m=appendRound(match,{questionId:q.id,answers});saveMatch(m);
    setFeedback(true);
    setEvent({id:Date.now(),verdicts:[answers[0].verdict,answers[1].verdict],combos:[streak(m,0),streak(m,1)]});
  },[locked,page]);
  function submit(player:0|1){
    if(locked[player]!==null||!inputs[player].trim())return;
    elapsed.current[player]=Date.now()-started.current;
    setLocked(a=>a.map((v,i)=>i===player?inputs[player]:v) as [string|null,string|null]);
  }
  function next(){
    if(match?.complete){setPage('result');sound('win',volume);return;}
    resetRound();
  }
  function exportData(){
    const blob=new Blob([JSON.stringify(ownMatches,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='成語王者-本機練習紀錄.json';a.click();URL.revokeObjectURL(url);
  }
  const last=match?.rounds.at(-1);
  return <div className={`app page-${page}`} style={{'--game-font':fontOptions[fontChoice].family} as React.CSSProperties}>
    <header>
      <button className="brand" onClick={()=>setPage('lobby')}><span className="crest">王</span><span>成語王者<small>會考巔峰對決</small></span></button>
      <nav aria-label="主選單">
        <button className={page==='lobby'?'active':''} onClick={()=>setPage('lobby')}>冒險大廳</button>
        <button className={page==='world'?'active':''} onClick={()=>setPage('world')}>世界地圖</button>
        <button className={page==='history'?'active':''} onClick={()=>setPage('history')}>我的戰績</button>
      </nav>
      <span className="demo-badge">本機原型 · 示範資料</span>
    </header>
    {notice&&<div role="status" className="notice">{notice}<button onClick={()=>setNotice('')}>關閉</button></div>}
    <main>
    {page==='lobby'&&<div className="game-lobby">
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow">CHAPTER 01 / 初始之森</div><h1>英雄集結</h1><p>以成語之力，迎戰試煉。</p><button className="world-link" onClick={()=>setPage('world')}>◇ 探索世界地圖 →</button></div>
        <HeroStage character={store.character} reduce={reduce}/>
      </section>
      <section className="story-prologue" aria-labelledby="story-title">
        <span className="eyebrow">PROLOGUE · 冒險序章</span>
        <h2 id="story-title">失落的成語之書</h2>
        <p>暗影魔王撕裂了成語之書，讓文字失去原本的力量。散落的書頁，藏在十三道年度試煉之中。</p>
        <p>選擇你的守護者，辨明句中的成語真義。每一次正確判斷都能點燃技能，連續答對，更能釋放必殺。從初始之森出發，奪回書頁，寫下你的王者傳說！</p>
      </section>
      <div className="lobby-grid">
      <section className="panel choose"><div className="section-heading"><div><span className="eyebrow">SELECT YOUR HERO</span><h2>選擇出戰英雄</h2></div><span className="subtle">紅・藍・紫・黃</span></div>
        <div className="characters">{characters.map((ch,i)=><button key={ch.name} aria-pressed={store.character===i} aria-label={`選擇${ch.name}`} className={`character ${store.character===i?'selected':''}`} style={{'--element':ch.color} as React.CSSProperties} onClick={()=>setStore(s=>({...s,character:i}))}>
          <Portrait index={i}/><span>{ch.name}</span><small>{ch.role}</small>
        </button>)}</div>
        <div className="selected-detail"><span className="element" style={{color:characters[store.character].color}}>{characterElement(store.character).name}</span><div><strong>{characters[store.character].name} · {characters[store.character].skill}</strong><p>連續答對 3 題觸發連擊，5 題釋放必殺。選擇題每題 10 分，填充題每題 5 分。</p></div></div>
      </section>
      <section className="panel setup"><span className="eyebrow">ADVENTURE / {103+selectedStage}</span><h2>{annualScores[selectedStage].name}</h2><div className="mission-rules"><span>12 題</span><span>100 分</span><span>60 分通關</span></div>
        <label>虛構練習身分<select aria-label="練習身分" value={store.profileId} onChange={e=>setStore(s=>({...s,profileId:e.target.value}))}>{demoProfiles.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <div className="segmented"><button aria-pressed={mode==='bot'} onClick={()=>setMode('bot')}>人機對戰</button><button aria-pressed={mode==='local'} onClick={()=>setMode('local')}>同機雙人</button></div>
        {mode==='bot'?<label>電腦難度<select aria-label="電腦難度" value={difficulty} onChange={e=>setDifficulty(+e.target.value)}>{difficulties.map((d,i)=><option value={i} key={d}>{d}</option>)}</select></label>:<p className="hint">兩位練習生在同一螢幕各自作答。兩台平板連線將於 P2 提供。</p>}
        <label>對手角色<select aria-label="對手角色" value={rival} onChange={e=>setRival(+e.target.value)}>{characters.map((c,i)=><option key={c.name} value={i}>{c.name}</option>)}</select></label>
        <button className="primary start" disabled={!unlocked(103+selectedStage)} onClick={()=>start()}>進入 {103+selectedStage} 年試煉 <span>→</span></button>
        {store.active&&!matchQuestions(store.active).some(q=>q.kind==='meaning')&&<button className="resume" onClick={()=>start(true)}>繼續未完成練習 · 已答 {store.active.rounds.length}/12</button>}
        <p className="hint">12 題新制另行統計，舊版 20 題紀錄保留在原存檔。各年度30題隨機抽12題，改編題待教師核准，成績僅儲存於此瀏覽器。</p>
      </section>
      </div>
    </div>}
    {page==='world'&&<>
      <section className="panel journey"><div className="section-heading"><div><span className="eyebrow">YOUR JOURNEY</span><h2>十三年 · 王者之路</h2></div><span className="subtle">{Array.from({length:13},(_,i)=>103+i).filter(yearPassed).length} / 13 試煉達標</span></div>
        <p className="map-caption">初始之森 → 星河遺跡 → 雷鳴山脈 → 王者之巔</p>
        <div className="world-map"><svg className="journey-path" viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden="true"><path d="M60 160 Q150 30 240 160 T420 160 T600 160 T780 160 T960 160 T1140 160"/></svg>
        <div className="stages">{annualScores.map((stage,i)=><button key={stage.year} aria-pressed={selectedStage===i} className={selectedStage===i?'current':''} onClick={()=>setSelectedStage(i)}>
          <span className="stage-art" role="img" aria-label={`${stage.year}年${stage.name}關卡圖片`} style={{backgroundPosition:`${i%4*100/3}% ${Math.floor(i/4)*100/3}%`}}/>
          <span className="stage-copy"><small>{yearPassed(stage.year)?'練習達標':unlocked(stage.year)?'可挑戰':'需通過前關'}</small><strong>{stage.year}</strong><b>{stage.name}</b><span>{unlocked(stage.year)?'⚑ 可練習':'鎖定'}</span></span>
        </button>)}</div></div>
        <div className="world-detail" aria-live="polite"><div><small>年度試煉 · {annualScores[selectedStage].year}</small><h3>{annualScores[selectedStage].name}</h3><p>{unlocked(103+selectedStage)?'本年度30道改編練習題，每場隨機抽8道選擇題與4道看解釋填成語題。題目待教師審核，練習進度不等同正式會考成績。':'完成前面年度並達60分、無待複核題後解鎖。'}</p></div><button className="primary" disabled={!unlocked(103+selectedStage)} onClick={()=>start()}>{unlocked(103+selectedStage)?`進入 ${103+selectedStage} 年試煉`:'需先通過前關'}</button></div>
        <div className="boss-lock">♛ 終極魔王殿 <span>通過全部 13 年度後解鎖 · 尚未實作</span></div>
      </section>
    </>}
    {page==='battle'&&match&&<>
      <div className="battle-title"><div><span className="eyebrow">CHAPTER {String((match.year??103)-102).padStart(2,'0')} · {annualScores[(match.year??103)-103].name}</span><h1>{match.year??103} 年成語試煉</h1></div><div className="round-counter">第 <strong>{feedback?match.rounds.length:match.rounds.length+1}</strong> / 12 題<span>{match.mode==='bot'?'人機對戰':'同機雙人'} · 示例改編題</span></div></div>
      <QuestHud match={match}/>
      <section className="battle-card">
        <div className="scoreboard">{[0,1].map(p=><div className={`fighter-score side-${p}`} key={p}><span>{p===0?demoProfiles.find(d=>d.id===match.profileId)?.name:match.mode==='bot'?difficulties[match.difficulty]:demoProfiles.find(d=>d.id===match.opponentId)?.name}</span><strong>{summarize(match,p as 0|1).score}<small> 分</small></strong><div className="hp"><i style={{width:`${100-summarize(match,(1-p) as 0|1).score}%`}}/></div><small>戰意 {100-summarize(match,(1-p) as 0|1).score} · 連擊 {streak(match,p as 0|1)}</small></div>)}</div>
        <Battle left={match.character} right={match.opponentCharacter??1} event={event} reduce={reduce} low={low} volume={volume}/>
      </section>
      {!feedback?<section className="panel question-panel">
        <div className="question-top"><span className="question-type">{q.kind==='choice'?'四選一':q.kind==='meaning'?'成語 → 意思':'意思 → 成語'} · {questionPoints(q)} 分</span><span className={`timer ${remaining<=3?'urgent':''}`} role="timer" aria-label="作答倒數" aria-live="off"><strong>{remaining}</strong><small>秒</small></span></div>
        <h2>{q.prompt}</h2><p className="hint">雙方鎖定答案或逾時後，一起揭曉結果。填成語須逐字一致，不接受錯字、同義詞或額外標點。</p>
        <div className={`answer-panels ${match.mode==='local'?'dual':''}`}>{[0,...(match.mode==='local'?[1]:[])].map(p=><div className="answer-player" key={p}><h3>{p===0?'左方':'右方'}作答 {locked[p]!==null&&<span className="locked">✓ 已鎖定</span>}</h3>
          {locked[p]!==null?<div className="waiting">答案已鎖定，等待對手…</div>:<>
          {q.options?<div className="options">{q.options.map((o,i)=><button className={inputs[p]===o?'picked':''} key={o} onClick={()=>setInputs(a=>a.map((v,n)=>n===p?o:v) as [string,string])}><b>{'ABCD'[i]}</b><span>{o}</span></button>)}</div>:<input aria-label={`${p===0?'左方':'右方'}答案`} value={inputs[p]} maxLength={120} placeholder="輸入正確成語，須與標準答案完全一致" onChange={e=>setInputs(a=>a.map((v,n)=>n===p?e.target.value:v) as [string,string])} onKeyDown={e=>{if(e.key==='Enter'&&!e.nativeEvent.isComposing)submit(p as 0|1);}}/>}
          <button className="primary submit" disabled={!inputs[p].trim()} onClick={()=>submit(p as 0|1)}>鎖定{p===0?'左方':'右方'}答案</button></>}
        </div>)}</div>
        {match.mode==='bot'&&<p className="bot-status">{locked[1]!==null?'◆ 電腦已作答':'◇ 電腦思考中…'}</p>}
      </section>:<section className="panel feedback" aria-live="polite"><div className="verdict-row">{last?.answers.map((a,i)=><span key={i} className={`verdict ${a.verdict}`}>{i?'右方':'左方'} · {labels[a.verdict]}{a.verdict==='correct'?` +${questionPoints(questions[match.rounds.length-1])}`:''}</span>)}</div>
        <h2>{questions[match.rounds.length-1].prompt}</h2><p><strong>參考答案：</strong>{questions[match.rounds.length-1].answer}</p><p className="hint">解析：{questions[match.rounds.length-1].explanation}</p>
        {last?.answers.map((a,i)=><p key={i} className="hint">{i?'右方':'左方'}：「{a.raw||'未作答'}」 — {a.reason}</p>)}
        <button className="primary" disabled={!animationReady} onClick={next}>{match.complete?'查看挑戰結果':'前往下一題'} →</button>
      </section>}
    </>}
    {page==='result'&&match&&<section className="panel results">
      <span className="eyebrow">BATTLE REPORT · {match.year??103} 年練習</span><h1>{outcome(match)==='pending'?'等待複核，暫不決定勝負':outcome(match)==='tie'?'勢均力敵！':`${outcome(match)==='left'?'左方':'右方'}贏得對決！`}</h1>
      <Battle left={match.character} right={match.opponentCharacter??1} reduce={reduce} low={low} volume={volume} winner={outcome(match)==='pending'?undefined:outcome(match) as 'left'|'right'|'tie'}/>
      <div className="result-scores">{[0,1].map(p=>{const s=summarize(match,p as 0|1);return <div key={p}><span>{p?'右方':'左方'}分數</span><strong>{s.score}<small> / 100</small></strong><p>{s.pending?`${s.pending} 題待複核，正式分數未定`:s.passed?'✓ 達 60 分通關門檻':'未達 60 分，可再次挑戰'}</p></div>;})}</div>
      <p>PK 勝負與通關分開計算。完成12題、達60分且無待複核題，可解鎖下一年度練習。</p>
      <div className="actions"><button className="primary" onClick={()=>start(false,match.year??103)}>再次挑戰</button><button onClick={()=>setPage('lobby')}>返回大廳</button><button onClick={exportData}>匯出我的練習紀錄</button></div>
      <h2>逐題紀錄</h2><p className="hint">填成語須與標準答案逐字一致，不使用 AI 判題。{questions.some(q=>q.kind==='meaning')?'此為舊版紀錄，待複核答案可在本機演練改判。':''}</p>
      <div className="review-list">{match.rounds.map((r,i)=><details key={r.questionId} open={r.answers.some(a=>a.verdict==='review')}><summary>{i+1}. {questions[i].prompt} <span>{labels[r.answers[0].verdict]} / {labels[r.answers[1].verdict]}</span></summary>
        <p>參考答案：{questions[i].answer}</p><p className="hint">{questions[i].source}</p>
        {r.answers.map((a,p)=><div className="review-answer" key={p}><p>{p?'右方':'左方'}：「{a.raw||'未作答'}」 · {(a.elapsed/1000).toFixed(1)} 秒 · {labels[a.verdict]}</p>
          {a.verdict==='review'&&<div><button onClick={()=>saveMatch(revise(match,i,p as 0|1,'correct'))}>演練：判為正確</button><button onClick={()=>saveMatch(revise(match,i,p as 0|1,'incorrect'))}>演練：判為錯誤</button></div>}
          {a.revised?.map((v,n)=><small key={n}>改判紀錄 {v.at}：{v.from} → {v.to}</small>)}
        </div>)}</details>)}</div>
    </section>}
    {page==='history'&&<section className="panel history"><span className="eyebrow">ADVENTURE RECORD</span><h1>{profile.name}的戰績</h1><p>此瀏覽器的虛構練習紀錄。沒有連接雲端帳號。</p>
      <div className="result-scores"><div><span>已完成挑戰</span><strong>{ownMatches.length}</strong></div><div><span>歷年最高分</span><strong>{ownMatches.length?Math.max(...ownMatches.map(m=>ownSummary(m).score)):'—'}</strong></div><div><span>首次分數</span><strong>{ownMatches.length?ownSummary(ownMatches[0]).score:'—'}</strong></div></div>
      <div className="table-scroll"><table><thead><tr><th>年度</th><th>最高已確認分數</th><th>狀態</th><th>挑戰次數</th></tr></thead><tbody>{Array.from({length:13},(_,i)=><tr key={i}><td>{103+i}</td><td>{ownMatches.some(m=>(m.year??103)===103+i)?Math.max(...ownMatches.filter(m=>(m.year??103)===103+i).map(m=>ownSummary(m).score)):'—'}</td><td>{yearPassed(103+i)?'練習達標':unlocked(103+i)?'可挑戰':'未解鎖'}</td><td>{ownMatches.filter(m=>(m.year??103)===103+i).length}</td></tr>)}</tbody></table></div>
      <h2>歷次挑戰</h2>{!ownMatches.length?<p className="empty">你的冒險紀錄，從第一場挑戰開始。</p>:ownMatches.slice().reverse().map(m=><button className="history-item" key={m.id} onClick={()=>{setMatch(m);setPage('result');}}><span>{m.year??103} 年 · {new Date(m.createdAt).toLocaleString('zh-TW')} · {m.mode==='bot'?'人機':'同機雙人'}</span><strong>{ownSummary(m).score} 分 {ownSummary(m).pending?'（待複核）':''} →</strong></button>)}
    </section>}
    </main>
    <footer><span>成語王者 · P1 本機練習版</span><div className="settings"><label>字體<select aria-label="介面字體" value={fontChoice} onChange={e=>setFontChoice(e.target.value as FontChoice)}>{Object.entries(fontOptions).map(([key,value])=><option key={key} value={key}>{value.label}</option>)}</select></label><button aria-label="切換配樂" aria-pressed={musicOn} onClick={toggleMusic}>{musicOn?'♫ 關閉配樂':'♫ 開啟配樂'}</button><label>配樂 <input aria-label="配樂音量" type="range" min="0" max="1" step=".05" value={musicVolume} onChange={e=>setMusicVolume(+e.target.value)}/></label><button aria-label="切換靜音" onClick={()=>setVolume(v=>v?0:.35)}>{volume?'音效開':'音效關'}</button><label>音效 <input aria-label="音量" type="range" min="0" max="1" step=".05" value={volume} onChange={e=>setVolume(+e.target.value)}/></label><label><input type="checkbox" checked={low} onChange={e=>setLow(e.target.checked)}/>低特效</label><label><input type="checkbox" checked={reduce} onChange={e=>setReduce(e.target.checked)}/>減少動態</label></div></footer>
  </div>;
}






