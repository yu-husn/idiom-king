import {streak,summarize,type Match} from './domain';

export function QuestHud({match}:{match:Match}){
  return <section className="quest-hud" aria-label="試煉任務進度">
    <div className="quest-objective"><span>◆ 主線任務 · 完成試煉</span><strong>{match.rounds.length} / 12 題</strong><progress aria-label="答題進度" value={match.rounds.length} max={12}/></div>
    {[0,1].map(index=>{
      const player=index as 0|1,s=summarize(match,player),combo=streak(match,player);
      const status=s.passed?'已通關':s.pending?'待複核':match.complete?'未通關':s.score>=60?'已達分數門檻，完成12題後判定':'挑戰中';
      return <div className="quest-player" key={player} aria-label={`${player?'右方':'左方'}試煉目標`}>
        <div><span>{player?'右方':'左方'} · {status}</span><strong>{s.score} / 60 分目標</strong></div>
        <progress aria-label={`${player?'右方':'左方'}通關分數進度`} value={Math.min(s.score,60)} max={60}/>
        <div className="charge"><span>元素蓄能</span><span className="charge-pips" aria-hidden="true">{Array.from({length:5},(_,i)=><i key={i} className={combo>i?'charged':''}/>)}</span><small>{combo>=5?'必殺已觸發':combo>=3?'連擊已觸發':`${combo} / 5 連續答對`}</small></div>
      </div>;
    })}
  </section>;
}


