import {annualScores} from './scores';
import {characterElement,characterScore} from './elements';
let ctx:AudioContext|undefined;
type Theme='journey'|'battle'|'victory';
// Original short scores, MIDI pitches; no downloaded recordings or API keys.
const melodies:Record<Theme,number[]>={
  journey:[76,79,83,79,74,78,81,78,72,76,79,83,74,78,81,79],
  battle:[64,71,76,71,67,74,79,74,62,69,74,69,66,71,78,71],
  victory:[72,76,79,84,83,79,76,79,74,78,81,86,84,79,76,72]
};
let musicGain:GainNode|undefined,timer:ReturnType<typeof setInterval>|undefined;
let voices=new Set<AudioScheduledSourceNode>(),theme:Theme='journey',step=0,nextNote=0,activeYear=103;
let activeCharacter=0;
export const music={
  async unlock(){ctx??=new AudioContext();await ctx.resume();if(ctx.state!=='running')throw new Error('Audio suspended');},
  volume(value:number){if(musicGain&&ctx)musicGain.gain.setTargetAtTime(value*.22,ctx.currentTime,.08);},
  stop(){
    if(timer!==undefined)clearInterval(timer);timer=undefined;
    voices.forEach(o=>{try{o.stop();}catch{/* Already ended. */}});voices.clear();
    musicGain?.disconnect();musicGain=undefined;
  },
  play(next:Theme,volume:number,year=103,character=0){
    this.stop();if(!ctx||ctx.state!=='running')return;
    const score=annualScores.find(s=>s.year===year)??annualScores[0];
    activeCharacter=character;
    const element=characterElement(character);
    const hero=characterScore(character);
    activeYear=score.year;theme=next;step=0;nextNote=ctx.currentTime+.04;
    musicGain=ctx.createGain();musicGain.connect(ctx.destination);this.volume(volume);
    const tone=(midi:number,time:number,duration:number,level:number,wave:OscillatorType)=>{
      const o=ctx!.createOscillator(),g=ctx!.createGain();
      o.type=wave;o.frequency.value=440*2**((midi-69)/12);
      g.gain.setValueAtTime(.0001,time);g.gain.linearRampToValueAtTime(level,time+.025);
      g.gain.exponentialRampToValueAtTime(.0001,time+duration);
      const filter=ctx!.createBiquadFilter();filter.type='lowpass';filter.frequency.value=wave==='square'?1800:3200;
      o.connect(filter);filter.connect(g);g.connect(musicGain!);voices.add(o);
      o.onended=()=>{voices.delete(o);o.disconnect();filter.disconnect();g.disconnect();};
      o.start(time);o.stop(time+duration+.02);
    };
    const noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.2),ctx.sampleRate);
    const data=noise.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
    const drum=(time:number,snare:boolean)=>{
      const source=ctx!.createBufferSource(),gain=ctx!.createGain(),filter=ctx!.createBiquadFilter();
      source.buffer=noise;filter.type='highpass';filter.frequency.value=snare?1200:6500;
      gain.gain.setValueAtTime(snare?.32:.08,time);gain.gain.exponentialRampToValueAtTime(.0001,time+(snare?.16:.045));
      source.connect(filter);filter.connect(gain);gain.connect(musicGain!);voices.add(source);
      source.onended=()=>{voices.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};
      source.start(time);source.stop(time+.2);
    };
    const kick=(time:number)=>{
      const o=ctx!.createOscillator(),g=ctx!.createGain();o.frequency.setValueAtTime(150,time);o.frequency.exponentialRampToValueAtTime(42,time+.16);
      g.gain.setValueAtTime(.65,time);g.gain.exponentialRampToValueAtTime(.0001,time+.22);
      o.connect(g);g.connect(musicGain!);voices.add(o);
      o.onended=()=>{voices.delete(o);o.disconnect();g.disconnect();};o.start(time);o.stop(time+.24);
    };
    const schedule=()=>{
      const beat=(theme==='battle'?60/score.bpm/4:.38)/hero.tempo;
      while(nextNote<ctx!.currentTime+.18){
        if(theme==='battle'){
          const n=step%16,root=score.root+score.bass[Math.floor(step/16)%4];
          if(step%2===0)tone(score.root+score.melody[(step/2)%16]+element.shift,nextNote,beat*1.65,.16,element.wave);
          if(step%2===1)tone(score.root+hero.shift+hero.motif[Math.floor(step/2)%8],nextNote,beat*1.7,.22,element.wave);
          tone(root+(n%4===2?7:0),nextNote,beat*.8,.17,'sawtooth');
          if(n%4===0)tone(root-12,nextNote,beat*3,.35,'triangle');
          if(score.kicks.includes(n)||hero.rhythm.some(k=>k===n))kick(nextNote);
          if(n===4||n===12){drum(nextNote,true);tone(50,nextNote,.1,.15,'triangle');}
          else if(n%2===0||n>12)drum(nextNote,false);
          if(n===0)[12,15,19].forEach(d=>tone(root+d,nextNote,beat*7,.075,'sawtooth'));
        }else{
        tone(60+hero.shift+hero.motif[step%8],nextNote,beat*1.8,.23,element.wave);
        if(step%2===0)tone(melodies[theme][step%16]+element.shift,nextNote,beat*1.6,.1,'sine');
        if(step%4===0){
          const root=[48,55,50,52][Math.floor(step/4)%4];
          [root,root+7,root+12].forEach(n=>tone(n,nextNote,beat*3.8,.13,'sine'));
        }
        }
        step++;nextNote+=beat;
      }
    };
    schedule();timer=setInterval(schedule,80);
  },
  status(){return {playing:timer!==undefined,theme,year:activeYear,character:activeCharacter,track:characterScore(activeCharacter).title,element:characterElement(activeCharacter).name,voices:voices.size,context:ctx?.state};}
};
// Layered, bounded combat cues. The scene owns cancellation when leaving/restarting.
export function combatSound(kind:'charge'|'swing'|'impact',character:number,volume:number,big=false):()=>void{
  if(volume<=0)return ()=>{};
  try{
    ctx??=new AudioContext();void ctx.resume();
    const context=ctx,t=context.currentTime,length=kind==='impact'?.32:.24;
    const bus=context.createGain(),compressor=context.createDynamicsCompressor();
    bus.gain.value=Math.min(1,Math.max(0,volume))*(big?.32:.24);
    compressor.threshold.value=-12;compressor.ratio.value=6;
    bus.connect(compressor);compressor.connect(context.destination);
    const nodes:AudioNode[]=[bus,compressor],sources:AudioScheduledSourceNode[]=[];
    const oscillator=context.createOscillator(),gain=context.createGain();
    const base=kind==='impact'?100:kind==='charge'?160:440;
    oscillator.type=kind==='impact'?'triangle':'sine';
    oscillator.frequency.setValueAtTime(base+character*12,t);
    oscillator.frequency.exponentialRampToValueAtTime(kind==='charge'?680:kind==='impact'?38:90,t+length);
    gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(.7,t+.015);gain.gain.exponentialRampToValueAtTime(.0001,t+length);
    oscillator.connect(gain);gain.connect(bus);nodes.push(oscillator,gain);sources.push(oscillator);
    const noise=context.createBuffer(1,Math.ceil(context.sampleRate*length),context.sampleRate),samples=noise.getChannelData(0);
    for(let n=0;n<samples.length;n++)samples[n]=(Math.random()*2-1)*(1-n/samples.length);
    const source=context.createBufferSource(),filter=context.createBiquadFilter(),noiseGain=context.createGain();
    source.buffer=noise;filter.type='bandpass';filter.frequency.value=kind==='impact'?800:2200+character*140;
    filter.Q.value=.8;noiseGain.gain.setValueAtTime(kind==='charge'?.12:.65,t);noiseGain.gain.exponentialRampToValueAtTime(.0001,t+length);
    source.connect(filter);filter.connect(noiseGain);noiseGain.connect(bus);nodes.push(source,filter,noiseGain);sources.push(source);
    let stopped=false;
    const stop=()=>{if(stopped)return;stopped=true;sources.forEach(s=>{try{s.stop();}catch{/* ended */}});nodes.forEach(n=>n.disconnect());};
    source.onended=stop;
    sources.forEach(s=>{s.start(t);s.stop(t+length+.01);});
    return stop;
  }catch{return ()=>{};}
}
export function sound(type:'attack'|'ice'|'hit'|'win'|'start', volume:number){
  if(volume<=0)return;
  try{
    ctx??=new AudioContext(); void ctx.resume();
    const notes=type==='win'?[523,659,784,1047]:type==='start'?[330,440,660]:type==='ice'?[1200,900,600]:type==='hit'?[120,65]:[320,150,80];
    notes.forEach((f,i)=>{
      const o=ctx!.createOscillator(),g=ctx!.createGain(),t=ctx!.currentTime+i*.09;
      o.type=type==='hit'?'triangle':'sine';o.frequency.setValueAtTime(f,t);
      o.frequency.exponentialRampToValueAtTime(f*.55,t+.16);
      g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume*.15,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+.23);
      o.connect(g);g.connect(ctx!.destination);o.start(t);o.stop(t+.25);
    });
  }catch{/* Audio is optional if the browser disables Web Audio. */}
}
