import {useEffect,useRef} from 'react';
import Phaser from 'phaser';
import type {Verdict} from './domain';
import {sound,combatSound} from './audio';
import {ATTACK_SLOT,battleDuration} from './combatTiming';
import {characters} from './data';
import {heroChoreography,motionDefinitions,sheetUrl} from './animations';

export type BattleEvent={id:number; verdicts:[Verdict,Verdict]; combos:[number,number]};
type Props={left:number;right:number;event?:BattleEvent;reduce:boolean;low:boolean;volume:number;winner?:'left'|'right'|'tie'};
class Arena extends Phaser.Scene {
  fighters:Phaser.GameObjects.Sprite[]=[];
  shadows:Phaser.GameObjects.Ellipse[][]=[];
  groundRings:Phaser.GameObjects.Ellipse[][]=[];
  settings:Props;
  phase='待機';
  phaseText?:Phaser.GameObjects.Text;
  stopSounds:(()=>void)[]=[];
  constructor(settings:Props){super('arena');this.settings=settings;}
  preload(){
    this.load.image('forest',`${import.meta.env.BASE_URL}art/adventure-forest.png`);
    for(const ch of new Set([this.settings.left,this.settings.right]))this.load.image(`hero-${ch}`,sheetUrl(ch));
  }
  create(){
    this.events.once('shutdown',()=>this.stopSounds.splice(0).forEach(stop=>stop()));
    const backdrop=this.add.image(550,165,'forest');
    backdrop.setScale(Math.max(1100/backdrop.width,330/backdrop.height));
    this.add.rectangle(550,165,1100,330,0x07182b,.30);
    // Atmospheric separation belongs behind all combat geometry, never over silhouettes.
    const atmosphere=this.textures.createCanvas('atmosphere',1100,330)!;
    const context=atmosphere.getContext();
    const mist=context.createLinearGradient(0,30,0,220);
    mist.addColorStop(0,'rgba(105,143,160,0)');
    mist.addColorStop(.45,'rgba(105,143,160,.22)');
    mist.addColorStop(1,'rgba(105,143,160,0)');
    context.fillStyle=mist;context.fillRect(0,0,1100,220);atmosphere.refresh();
    this.add.image(550,165,'atmosphere');
    const g=this.add.graphics();
    g.lineStyle(2,0xf9db93,.3);g.strokeEllipse(550,282,790,68);
    for(const ch of new Set([this.settings.left,this.settings.right])){
      const key=`hero-${ch}`,source=this.textures.get(key).getSourceImage() as HTMLImageElement;
      const fw=source.width/4,fh=source.height/4;
      for(let i=0;i<16;i++)this.textures.get(key).add(i,0,Math.floor((i%4)*fw),Math.floor(Math.floor(i/4)*fh),Math.floor(fw),Math.floor(fh));
      for(const [name,def] of Object.entries(motionDefinitions)){
        this.anims.create({key:`${ch}-${name}`,frames:def.frames.map(f=>({key,frame:f})),frameRate:def.fps,repeat:name==='idle'?-1:0,repeatDelay:name==='idle'?1800:0});
      }
    }
    [this.settings.left,this.settings.right].forEach((ch,i)=>{
      const color=Phaser.Display.Color.HexStringToColor(characters[ch].color).color;
      const x=i?805:295;
      const glow=this.add.ellipse(x,297,184,39,color,.08).setDepth(4);
      const outer=this.add.ellipse(x,297,184,39).setStrokeStyle(2,color,.8).setDepth(4);
      const inner=this.add.ellipse(x,297,142,26).setStrokeStyle(1,color,.45).setDepth(4);
      this.groundRings.push([glow,outer,inner]);
      if(!this.settings.reduce&&!this.settings.low)this.tweens.add({targets:[glow,outer],alpha:.55,duration:1350+ch*70,yoyo:true,repeat:-1,ease:'Sine.inOut'});
      this.shadows.push([
        this.add.ellipse(i?805:295,297,126,23,0x03101a,.25).setDepth(3),
        this.add.ellipse(i?805:295,297,78,11,0x020912,.55).setDepth(3),
      ]);
      const sprite=this.add.sprite(i?805:295,180,`hero-${ch}`,0).setDisplaySize(300,300).setFlipX(i===1).setDepth(10);
      if(!this.settings.reduce)sprite.play(`${ch}-idle`);
      this.fighters.push(sprite);
      this.add.text(i?805:295,320,`${characters[ch].name} · ${characters[ch].skill}`,{fontFamily:'sans-serif',fontSize:'12px',color:characters[ch].color,backgroundColor:'#081622',padding:{x:12,y:2},stroke:'#081622',strokeThickness:2}).setOrigin(.5).setDepth(15);
    });
    this.phaseText=this.add.text(550,32,'等待作答',{fontFamily:'sans-serif',fontSize:'19px',color:'#f6e2ae',backgroundColor:'#071322cc',padding:{x:14,y:5}}).setOrigin(.5).setDepth(25);
    if(!this.settings.reduce){
      this.fighters.forEach((_,i)=>this.idle(i));
      for(let i=0;i<(this.settings.low?4:10);i++){
        const dot=this.add.circle(Phaser.Math.Between(0,1100),Phaser.Math.Between(20,280),2,0xe5dcac,.5);
        this.tweens.add({targets:dot,y:dot.y-60,alpha:0,duration:3500+i*100,repeat:-1,yoyo:true});
      }
    }
  }
  update(){
    const host=this.game.canvas.parentElement;
    if(host){host.dataset.phase=this.phase;host.dataset.leftX=String(Math.round(this.fighters[0]?.x??0));host.dataset.rightX=String(Math.round(this.fighters[1]?.x??0));}
    this.fighters.forEach((sprite,i)=>this.groundRings[i]?.forEach(ring=>ring.setX(sprite.x)));
    this.fighters.forEach((sprite,i)=>this.shadows[i]?.forEach(shadow=>{
      shadow.setPosition(sprite.x,297).setScale(1-Math.max(0,180-sprite.y)/150);
    }));
  }
  busy=false;
  idle(i:number){
    const ch=i?this.settings.right:this.settings.left;
    this.tweens.add({targets:this.fighters[i],y:180-(ch%4===1?9:5),angle:i?-1.5:1.5,duration:1200+ch*95,yoyo:true,repeat:-1,ease:'Sine.inOut'});
  }
  resetFrames(){this.fighters.forEach((s,i)=>{
    const ch=i?this.settings.right:this.settings.left;
    this.tweens.killTweensOf(s);
    s.stop().setFrame(0).setAngle(0).setPosition(i?805:295,180).setDisplaySize(300,300).setAlpha(1).clearTint();
    if(!this.settings.reduce){s.play(`${ch}-idle`);this.idle(i);}
  });}
  setPhase(phase:string,ch?:number){
    this.phase=phase;
    this.phaseText?.setText(ch===undefined?phase:`${characters[ch].name} · ${phase}`);
  }
  play(event:BattleEvent){
    if(!this.fighters.length||this.busy)return;
    this.busy=true;this.resetFrames();
    this.fighters.forEach(s=>this.tweens.killTweensOf(s));
    const attackers=event.verdicts.flatMap((v,i)=>v==='correct'?[i]:[]);
    event.verdicts.forEach((v,i)=>{
      if(v==='review')this.label(i?805:295,95,'待複核','#f2d18a');
      else if(v==='incorrect')this.label(i?805:295,95,'防禦失衡','#ffc2c5');
    });
    if(this.settings.reduce){
      attackers.forEach(i=>{this.fighters[i].setFrame(8);this.label(i?805:295,70,'命中！','#fff0bd');});
    }else{
      // Complete one exchange before the other attacker advances: never cross silhouettes.
      attackers.forEach((i,order)=>this.time.delayedCall(order*ATTACK_SLOT,()=>this.exchange(i,event.combos[i])));
    }
    this.time.delayedCall(battleDuration(event.verdicts,this.settings.reduce)-50,()=>{
      this.resetFrames();this.busy=false;this.setPhase('等待下一回合');
      this.stopSounds.splice(0).forEach(stop=>stop());
    });
  }
  exchange(i:number,combo:number){
    const s=this.fighters[i],target=this.fighters[1-i],ch=i?this.settings.right:this.settings.left;
    const dir=i?-1:1,home=i?805:295,targetHome=i?295:805;
    const pose=heroChoreography[ch],ultimate=combo>=5;
    const color=Phaser.Display.Color.HexStringToColor(characters[ch].color).color;
    this.tweens.killTweensOf(s);this.tweens.killTweensOf(target);
    s.stop().setPosition(home,180).setAngle(0).setFrame(ultimate?12:6);
    target.stop().setPosition(targetHome,180).setAngle(0).setFrame(0);
    this.setPhase('蓄力',ch);
    this.stopSounds.push(combatSound('charge',ch,this.settings.volume,ultimate));
    this.tweens.add({targets:s,x:home-dir*36,angle:-dir*Math.max(9,Math.abs(pose.lean)),duration:260,ease:'Sine.inOut'});
    const charge=this.add.ellipse(home,297,190,40).setStrokeStyle(3,color,.8).setDepth(5);
    this.tweens.add({targets:charge,scale:.6,alpha:0,duration:280,onComplete:()=>charge.destroy()});
    if(ultimate&&!this.settings.low)this.cutin(ch,i,color);
    this.time.delayedCall(280,()=>{
      this.setPhase('突進打擊',ch);s.setFrame(7);
      this.stopSounds.push(combatSound('swing',ch,this.settings.volume,ultimate));
      const contact=targetHome-dir*210;
      this.tweens.add({targets:s,x:contact,angle:dir*Math.abs(pose.lean),duration:180,ease:'Cubic.in'});
      if(!this.settings.low)for(let n=0;n<3;n++)this.time.delayedCall(n*45,()=>{
        const ghost=this.add.sprite(s.x-dir*22,s.y,s.texture.key,s.frame.name).setDisplaySize(300,300).setAngle(s.angle).setFlipX(i===1).setTint(color).setAlpha(.22).setDepth(8);
        this.tweens.add({targets:ghost,alpha:0,duration:220,onComplete:()=>ghost.destroy()});
      });
      const trail=this.add.ellipse(home,295,110,12,color,.4).setDepth(5);
      this.tweens.add({targets:trail,x:contact,scaleX:2,alpha:0,duration:260,onComplete:()=>trail.destroy()});
    });
    this.time.delayedCall(460,()=>{
      this.setPhase('命中',ch);s.setFrame(ultimate?13:8);target.setFrame(10);
      this.weaponSweep(ch,s.x,180,dir,color,ultimate);
      const projectile=this.projectile(ch,s.x+dir*90,180,dir,color,ultimate);
      this.tweens.add({targets:projectile,x:targetHome-dir*45,duration:100,onComplete:()=>projectile.destroy()});
      this.burst(targetHome-dir*65,190,color,ultimate);
      this.elementImpact(targetHome-dir*65,190,ch%4,color,ultimate);
      this.stopSounds.push(combatSound('impact',ch,this.settings.volume,ultimate));
      this.label(targetHome,80,ultimate?'必殺命中！':combo>=3?`${combo} 連擊！`:'命中！','#fff0bd');
      this.tweens.add({targets:target,x:targetHome+dir*30,angle:dir*10,duration:100,yoyo:true,hold:80,ease:'Cubic.out'});
      // Impact hold is a sprite pose; it never suspends the question timer or score.
      this.time.delayedCall(90,()=>s.setFrame(ultimate?14:9));
      if(!this.settings.low){
        this.cameras.main.shake(ultimate?110:70,ultimate?.004:.002);
        if(ultimate)this.cameras.main.zoomTo(1.025,100);
      }
    });
    this.time.delayedCall(740,()=>{
      this.setPhase('收招',ch);s.setFrame(9);target.setFrame(11);
      this.tweens.killTweensOf(s);
      this.tweens.add({targets:s,x:home,y:180,angle:0,duration:330,ease:'Sine.inOut'});
      this.cameras.main.zoomTo(1,160);
    });
    this.time.delayedCall(1100,()=>{
      this.resetFrames();this.setPhase('站姿',ch);
    });
  }
  projectile(ch:number,x:number,y:number,dir:number,color:number,big:boolean){
    const g=this.add.graphics({x,y}).setDepth(6).setScale(dir*(big?1.2:1),big?1.2:1);
    g.lineStyle(4,color,.9);
    if(ch===7){
      // Arrowhead and trailing shaft make direction readable even in a still frame.
      g.lineBetween(-64,0,22,0);g.lineBetween(8,-10,24,0);g.lineBetween(8,10,24,0);
      g.lineStyle(2,color,.4);g.lineBetween(-90,-6,-30,-6);g.lineBetween(-90,6,-30,6);
    }else if(ch===1||ch===5){
      g.strokeCircle(0,0,22);g.lineStyle(2,color,.6);g.strokeCircle(-10,0,30);
      if(ch===5)for(const dy of [-32,32])g.strokeCircle(-22,dy,10);
      g.fillStyle(color,.16);g.fillCircle(0,0,21);
    }else if(ch===2){
      g.lineBetween(-75,18,22,-12);g.lineBetween(-62,-14,24,14);
    }else if(ch===3){
      g.fillStyle(color,.65);g.fillTriangle(-28,-12,30,0,-28,12);
    }else{
      g.beginPath();g.arc(-12,0,ch===6?44:34,-Math.PI*.42,Math.PI*.42);g.strokePath();
      g.lineStyle(2,color,.5);g.beginPath();g.arc(-28,0,48,-Math.PI*.38,Math.PI*.38);g.strokePath();
    }
    return g;
  }
  weaponSweep(ch:number,x:number,y:number,dir:number,color:number,big:boolean){
    const g=this.add.graphics({x:x+dir*45,y}).setDepth(6).setScale(dir,1);
    g.lineStyle(big?7:5,color,.75);
    if(ch===1||ch===5||ch===6){
      // Casters project a stable sigil, rather than a melee slash.
      g.strokeCircle(35,0,54);g.lineStyle(2,color,.6);g.strokeCircle(35,0,65);
      for(let k=0;k<6;k++){const a=k*Math.PI/3;g.lineBetween(35+Math.cos(a)*54,Math.sin(a)*54,35+Math.cos(a)*66,Math.sin(a)*66);}
    }else if(ch===7){
      g.beginPath();g.arc(-30,0,68,-1.1,1.1);g.strokePath();
      g.lineStyle(2,color,.8);g.lineBetween(0,-60,-35,0);g.lineBetween(-35,0,0,60);
    }else if(ch===3){
      g.lineBetween(30,-80,55,75);g.lineBetween(55,75,125,90);g.lineBetween(55,75,-45,90);
    }else{
      g.beginPath();g.arc(0,0,ch===4?100:85,-1.5,1.15);g.strokePath();
      if(ch===2){g.lineBetween(-65,-45,100,45);g.lineBetween(-65,45,100,-45);}
    }
    this.tweens.add({targets:g,angle:ch===4?dir*100:0,alpha:0,duration:this.settings.low?220:380,onComplete:()=>g.destroy()});
  }
  cutin(ch:number,side:number,color:number){
    // Each fighter owns half the screen, so simultaneous ultimates remain legible.
    const x=side?825:275;
    const panel=this.add.container(0,0).setDepth(20);
    panel.add(this.add.rectangle(x,101,330,44,0x071322,.9).setStrokeStyle(1,color,.7));
    panel.add(this.add.text(x,101,`${characters[ch].name} · ${characters[ch].skill}`,{fontSize:'20px',color:characters[ch].color,fontStyle:'bold',fontFamily:'sans-serif'}).setOrigin(.5));
    panel.x=side?80:-80;panel.alpha=0;
    this.tweens.add({targets:panel,x:0,alpha:1,duration:120,ease:'Cubic.out'});
    this.tweens.add({targets:panel,alpha:0,delay:420,duration:180,onComplete:()=>panel.destroy(true)});
  }
  elementImpact(x:number,y:number,element:number,color:number,big:boolean){
    const count=this.settings.low?3:big?7:4;
    const ring=this.add.ellipse(x,y,35,35).setStrokeStyle(big?4:2,color,.7).setDepth(6);
    this.tweens.add({targets:ring,scale:big?5:3,alpha:0,duration:360,onComplete:()=>ring.destroy()});
    for(let k=0;k<count;k++){
      const angle=k/count*Math.PI*2,dx=Math.cos(angle),dy=Math.sin(angle);
      const piece=element===1?this.add.polygon(x,y,[0,-25,8,0,0,22,-8,0],color):
        element===2?this.add.star(x,y,5,5,18,color):
        element===3?this.add.polygon(x,y,[-4,-30,9,-5,2,-5,8,27,-10,0,-2,0],color):
        this.add.ellipse(x,y,13,36,color);
      piece.setRotation(angle).setAlpha(.7).setDepth(6);
      this.tweens.add({targets:piece,x:x+dx*(big?115:70),y:y+dy*65,alpha:0,scale:.2,duration:420,onComplete:()=>piece.destroy()});
    }
  }
  burst(x:number,y:number,color:number,big:boolean){
    for(let j=0;j<(this.settings.low?3:big?12:7);j++){
      const p=this.add.star(x,y,4,2,Phaser.Math.Between(4,8),color,.7).setDepth(6);
      this.tweens.add({targets:p,x:x+Phaser.Math.Between(-100,100),y:y+Phaser.Math.Between(-75,75),alpha:0,angle:180,duration:550,onComplete:()=>p.destroy()});
    }
  }
  label(x:number,y:number,t:string,color:string){
    const label=this.add.text(x,y,t,{fontFamily:'sans-serif',fontSize:'22px',fontStyle:'bold',color,stroke:'#142139',strokeThickness:5}).setOrigin(.5).setDepth(30);
    this.tweens.add({targets:label,y:y-20,alpha:0,delay:650,duration:600,onComplete:()=>label.destroy()});
  }
  victory(winner:Props['winner']){
    if(!this.fighters.length)return;
    this.busy=true;
    this.resetFrames();
    this.fighters.forEach((s,i)=>{
      this.tweens.killTweensOf(s);
      const won=winner==='tie'||winner===(i?'right':'left');
      s.stop().setFrame(won?15:10);
      if(won&&!this.settings.reduce)this.tweens.add({targets:s,y:160,duration:300,yoyo:true,repeat:1,ease:'Sine.out'});
    });
  }
}
export default function Battle(props:Props){
  const host=useRef<HTMLDivElement>(null),scene=useRef<Arena>(null);
  useEffect(()=>{
    const s=new Arena(props);scene.current=s;
    const game=new Phaser.Game({type:Phaser.AUTO,parent:host.current!,width:1100,height:330,
      transparent:true,scene:s,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
      fps:{target:30,forceSetTimeOut:true},render:{antialias:true}});
    return ()=>{scene.current=null;game.destroy(true);};
  },[props.left,props.right,props.reduce,props.low]);
  useEffect(()=>{if(scene.current)scene.current.settings=props;},[props.volume]);
  useEffect(()=>{if(props.event)scene.current?.play(props.event);},[props.event]);
  useEffect(()=>{if(props.winner){const timer=setTimeout(()=>scene.current?.victory(props.winner),1500);return()=>clearTimeout(timer);}},[props.winner]);
  return <div className="arena" ref={host} role="img" aria-label="Q版角色戰鬥動畫場景"/>;
}

