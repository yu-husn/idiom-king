import {useEffect,useState} from 'react';
import {characters} from './data';
import {sheetUrl} from './animations';
export function HeroStage({character,reduce}:{character:number;reduce:boolean}){
  const [frame,setFrame]=useState(0);
  const ch=characters[character];
  useEffect(()=>{
    setFrame(0);
    if(reduce)return;
    let index=0;
    // Brief ready stance between breaths; the same framing is shared by all eight heroes.
    const idle=[0,0,0,1,0,2,0,0,6,7,9,0,0,15,0,0];
    const timer=setInterval(()=>{index=(index+1)%idle.length;setFrame(idle[index]);},320);
    return()=>clearInterval(timer);
  },[character,reduce]);
  return <div className={`hero-showcase ambient-hero ${reduce?'still':''}`} style={{'--hero-color':ch.color} as React.CSSProperties}>
    <div className="ambient-hero-mover">
      <div className="walking-shadow"/>
      <div className="walking-sprite" role="img" aria-label={`${ch.name}角色立繪`} style={{backgroundImage:`url("${sheetUrl(character)}")`,backgroundPosition:`${frame%4*100/3}% ${Math.floor(frame/4)*100/3}%`}}/>
    </div>
    <div className="hero-nameplate"><small>{ch.role}</small><strong>{ch.name}</strong><span>{ch.skill}</span></div>
  </div>;
}
