import {useEffect,useState} from 'react';
import {characters} from './data';
import {frameLabels,motionDefinitions,sheetUrl,type Motion} from './animations';
export function MotionLab(){
  const [character,setCharacter]=useState(0),[motion,setMotion]=useState<Motion>('attack');
  const [frame,setFrame]=useState(0),[playing,setPlaying]=useState(true),[speed,setSpeed]=useState(1),[grid,setGrid]=useState(true);
  const sequence=motionDefinitions[motion];
  useEffect(()=>{
    if(!playing)return;
    let n=0;setFrame(sequence.frames[0]);
    const id=setInterval(()=>{n=(n+1)%sequence.frames.length;setFrame(sequence.frames[n]);},1000/sequence.fps/speed);
    return()=>clearInterval(id);
  },[motion,playing,speed,character]);
  const style=(f:number)=>({backgroundImage:`url("${sheetUrl(character)}")`,backgroundPosition:`${(f%4)*100/3}% ${Math.floor(f/4)*100/3}%`});
  return <section className="panel motion-lab"><span className="eyebrow">ANIMATION STUDIO · 角色動作室</span><h1>一招一式，都看得見。</h1><p>八位英雄各 16 格動作拆解，以逐格序列合成動作。可暫停、慢放與逐格檢查。</p>
    <div className="motion-tabs">{characters.map((c,i)=><button key={c.name} aria-pressed={character===i} onClick={()=>setCharacter(i)} style={{borderColor:character===i?c.color:undefined}}>{c.name}<small>{c.role}</small></button>)}</div>
    <div className="motion-layout"><div className={`motion-stage ${grid?'checker':''}`}><div className="motion-sprite" style={style(frame)} role="img" aria-label={`${characters[character].name}第${frame+1}格${frameLabels[frame]}`}/><span className="frame-counter">{String(frame+1).padStart(2,'0')} / 16 · {frameLabels[frame]}</span></div>
      <div className="motion-controls"><h2 style={{color:characters[character].color}}>{characters[character].name} <small>{characters[character].skill}</small></h2>
        <div className="motions">{Object.entries(motionDefinitions).map(([key,val])=><button aria-pressed={motion===key} key={key} onClick={()=>{setMotion(key as Motion);setPlaying(true);}}>{val.label}</button>)}</div>
        <div className="actions"><button className="primary" onClick={()=>setPlaying(!playing)}>{playing?'暫停':'播放'}</button><button onClick={()=>{setPlaying(false);setFrame(f=>(f+1)%16);}}>下一格</button></div>
        <label>播放速度<select aria-label="播放速度" value={speed} onChange={e=>setSpeed(+e.target.value)}><option value=".5">0.5 倍・慢動作</option><option value="1">1 倍</option><option value="1.5">1.5 倍</option></select></label>
        <label><input type="checkbox" checked={grid} onChange={e=>setGrid(e.target.checked)}/>透明底檢查格</label>
        <p className="hint">動作序列：{sequence.frames.map(f=>f+1).join(' → ')}。這是關鍵格動畫，尚非高幀數逐格手繪成品。</p>
      </div></div>
    <h2>16 格動作拆解</h2><div className="frame-grid">{frameLabels.map((name,i)=><button key={name} className={frame===i?'selected':''} onClick={()=>{setPlaying(false);setFrame(i);}}><div className="frame-thumbnail checker" style={style(i)}/><span>{String(i+1).padStart(2,'0')} · {name}</span></button>)}</div>
    <p className="hint">逐格播放方法參考 <a href="https://github.com/phaserjs/phaser/blob/master/skills/animations/SKILL.md" target="_blank" rel="noreferrer">Phaser 官方 animation skill</a>。角色圖為本專案生成；技能特效與音效另由程式播放。</p>
  </section>;
}
