(() => {
"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });
const TAU = Math.PI * 2;

const ui = {
  screens: [...document.querySelectorAll(".screen")],
  main: document.getElementById("mainMenu"),
  char: document.getElementById("characterMenu"),
  arena: document.getElementById("arenaMenu"),
  controls: document.getElementById("controlsMenu"),
  options: document.getElementById("optionsMenu"),
  hud: document.getElementById("gameHUD"),
  result: document.getElementById("resultMenu"),
  characterCards: document.getElementById("characterCards"),
  arenaCards: document.getElementById("arenaCards"),
  playerName: document.getElementById("playerName"),
  enemyName: document.getElementById("enemyName"),
  playerHP: document.getElementById("playerHP"),
  enemyHP: document.getElementById("enemyHP"),
  playerEnergy: document.getElementById("playerEnergy"),
  enemyEnergy: document.getElementById("enemyEnergy"),
  playerUlt: document.getElementById("playerUlt"),
  enemyUlt: document.getElementById("enemyUlt"),
  timer: document.getElementById("timer"),
  comboText: document.getElementById("comboText"),
  ultimateText: document.getElementById("ultimateText"),
  resultTitle: document.getElementById("resultTitle"),
  resultStats: document.getElementById("resultStats")
};

const settings = { shake:true, particles:true, sound:true };
document.getElementById("shakeToggle").onchange = e => settings.shake = e.target.checked;
document.getElementById("particleToggle").onchange = e => settings.particles = e.target.checked;
document.getElementById("soundToggle").onchange = e => settings.sound = e.target.checked;

const CHARACTERS = [
  {
    id:"vex", name:"VEX", title:"BOXER", desc:"Fast balanced striker. Builds pressure with short strings.",
    color:"#5de1ff", accent:"#2f70ff", stats:[82,76,72,70], hp:1000, speed:430, jump:760, power:1,
    attacks:{
      light:{damage:45,reach:76,wind:0.07,active:0.09,recovery:0.18,stun:.16,kb:180,energy:8},
      heavy:{damage:100,reach:92,wind:.18,active:.12,recovery:.42,stun:.34,kb:390,energy:13},
      special:{damage:145,reach:145,wind:.24,active:.18,recovery:.55,stun:.45,kb:440,energy:18}
    },
    specials:["Pulse Jab","Crosswave","Breaker Step"],
    ultimate:{damage:360,reach:240,kb:800}
  },
  {
    id:"bront", name:"BRONT", title:"TITAN", desc:"Heavy armored bruiser with huge knockback and resilience.",
    color:"#ff9d4d", accent:"#d64b31", stats:[98,46,96,58], hp:1300, speed:285, jump:650, power:1.12,
    attacks:{
      light:{damage:55,reach:78,wind:.09,active:.1,recovery:.24,stun:.2,kb:220,energy:7},
      heavy:{damage:145,reach:105,wind:.25,active:.14,recovery:.58,stun:.5,kb:560,energy:14},
      special:{damage:190,reach:150,wind:.35,active:.2,recovery:.75,stun:.62,kb:650,energy:20}
    },
    specials:["Quake Palm","Iron Arc","Meteor Shoulder"],
    ultimate:{damage:450,reach:260,kb:1000}
  },
  {
    id:"nyx", name:"NYX", title:"NINJA", desc:"Extreme mobility. Teleport-like dashes and precise close-range hits.",
    color:"#c28cff", accent:"#7045dc", stats:[65,99,58,94], hp:900, speed:540, jump:850, power:.92,
    attacks:{
      light:{damage:39,reach:82,wind:.045,active:.075,recovery:.13,stun:.13,kb:160,energy:9},
      heavy:{damage:86,reach:100,wind:.12,active:.11,recovery:.3,stun:.3,kb:330,energy:14},
      special:{damage:130,reach:175,wind:.16,active:.16,recovery:.42,stun:.4,kb:400,energy:22}
    },
    specials:["Void Shuriken","Blink Cut","Razor Spiral"],
    ultimate:{damage:340,reach:300,kb:780}
  },
  {
    id:"aeris", name:"AERIS", title:"ARCANE", desc:"Ranged energy fighter. Controls space with luminous projectiles.",
    color:"#6dffb0", accent:"#22a77b", stats:[70,72,62,100], hp:940, speed:350, jump:720, power:.98,
    attacks:{
      light:{damage:42,reach:72,wind:.07,active:.09,recovery:.18,stun:.15,kb:175,energy:9},
      heavy:{damage:92,reach:105,wind:.2,active:.12,recovery:.4,stun:.35,kb:360,energy:15},
      special:{damage:155,reach:330,wind:.22,active:.16,recovery:.6,stun:.42,kb:470,energy:23}
    },
    specials:["Star Lance","Orbit Mine","Prism Ray"],
    ultimate:{damage:390,reach:430,kb:850}
  }
];

const ARENAS = [
  {id:"ruins",name:"BROKEN CITY",desc:"A shattered avenue under a storm of ash.",sky:"#10182a",ground:"#252833",accent:"#e16b56"},
  {id:"dojo",name:"EMBER DOJO",desc:"An old training hall surrounded by silent peaks.",sky:"#211720",ground:"#45352b",accent:"#e89a4f"},
  {id:"future",name:"NEON PLATFORM",desc:"A suspended arena above an electric megacity.",sky:"#081a22",ground:"#152b34",accent:"#4be8dd"}
];

let W=1280,H=720,dpr=1;
function resize(){
  const rect=canvas.getBoundingClientRect();
  dpr=Math.min(window.devicePixelRatio||1,2);
  W=Math.max(320,rect.width); H=Math.max(240,rect.height);
  canvas.width=Math.floor(W*dpr); canvas.height=Math.floor(H*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener("resize",resize); resize();

let selectedChar=0, selectedArena=0, enemyChar=1, game=null, last=performance.now(), audio=null;

function show(screen){
  ui.screens.forEach(s=>s.classList.remove("active"));
  screen.classList.add("active");
}
document.querySelectorAll("[data-menu]").forEach(b=>b.addEventListener("click",()=>{
  const m=b.dataset.menu;
  if(m==="play") startGame();
  else if(m==="characters"){buildCharacters();show(ui.char)}
  else if(m==="arenas"){buildArenas();show(ui.arena)}
  else show({controls:ui.controls,options:ui.options}[m]);
}));
document.querySelectorAll("[data-back]").forEach(b=>b.addEventListener("click",()=>show(ui.main)));

function portraitHTML(c){
  return `<div class="portrait" style="background:radial-gradient(circle at 55% 38%,${c.color},${c.accent} 35%,#070a12 75%)">
    <div style="position:absolute;left:39%;top:12%;width:22%;height:28%;border-radius:45%;background:#111827;border:3px solid ${c.color}"></div>
    <div style="position:absolute;left:31%;top:38%;width:38%;height:48%;border-radius:35% 35% 22% 22%;background:#151a27;border:3px solid ${c.color}"></div>
    <div style="position:absolute;left:22%;top:49%;width:18%;height:9%;background:${c.color};transform:rotate(-18deg);border-radius:8px"></div>
    <div style="position:absolute;right:22%;top:49%;width:18%;height:9%;background:${c.color};transform:rotate(18deg);border-radius:8px"></div>
  </div>`;
}
function buildCharacters(){
  ui.characterCards.innerHTML=CHARACTERS.map((c,i)=>`<button class="card ${i===selectedChar?"selected":""}" data-char="${i}">
    ${portraitHTML(c)}<h3>${c.name} <small>${c.title}</small></h3><p>${c.desc}</p><small>HP ${c.hp} • SPD ${c.speed} • POW ${c.power}</small>
  </button>`).join("");
  ui.characterCards.querySelectorAll("[data-char]").forEach(b=>b.onclick=()=>{
    selectedChar=+b.dataset.char; buildCharacters();
  });
}
function buildArenas(){
  ui.arenaCards.innerHTML=ARENAS.map((a,i)=>`<button class="card ${i===selectedArena?"selected":""}" data-arena="${i}">
    <div class="portrait" style="background:linear-gradient(160deg,${a.sky},${a.ground});border-bottom:5px solid ${a.accent}"></div>
    <h3>${a.name}</h3><p>${a.desc}</p>
  </button>`).join("");
  ui.arenaCards.querySelectorAll("[data-arena]").forEach(b=>b.onclick=()=>{selectedArena=+b.dataset.arena;buildArenas()});
}

const keys=new Set();
window.addEventListener("keydown",e=>{
  const k=e.key.toLowerCase();
  if(["a","d","w","j","k","l","u","i"," "].includes(k)) e.preventDefault();
  keys.add(k);
  if(k==="j") queueAction("light");
  if(k==="k") queueAction("heavy");
  if(k==="l") queueAction("dash");
  if(k==="u") queueAction("special");
  if(k==="i") queueAction("ultimate");
  if(k==="w") queueAction("jump");
});
window.addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));

const mobile={x:0,y:0,active:false};
const joystick=document.getElementById("joystick"),stick=document.getElementById("stick");
function joystickMove(e){
  const r=joystick.getBoundingClientRect(), t=e.touches[0];
  let x=t.clientX-(r.left+r.width/2), y=t.clientY-(r.top+r.height/2);
  const max=r.width*.34, len=Math.hypot(x,y);
  if(len>max){x=x/len*max;y=y/len*max}
  mobile.x=x/max; mobile.y=y/max;
  stick.style.transform=`translate(${x}px,${y}px)`;
}
joystick.addEventListener("touchstart",e=>{e.preventDefault();mobile.active=true;joystickMove(e)},{passive:false});
joystick.addEventListener("touchmove",e=>{e.preventDefault();if(mobile.active)joystickMove(e)},{passive:false});
function joyEnd(e){e.preventDefault();mobile.active=false;mobile.x=mobile.y=0;stick.style.transform=""}
joystick.addEventListener("touchend",joyEnd,{passive:false});joystick.addEventListener("touchcancel",joyEnd,{passive:false});
document.querySelectorAll("[data-action]").forEach(b=>{
  const action=b.dataset.action;
  const press=e=>{e.preventDefault();queueAction(action)};
  b.addEventListener("touchstart",press,{passive:false});
  b.addEventListener("mousedown",press);
});

class AudioFX{
  constructor(){this.ctx=null}
  init(){if(!settings.sound)return;if(!this.ctx)this.ctx=new (window.AudioContext||window.webkitAudioContext)();if(this.ctx.state==="suspended")this.ctx.resume()}
  tone(freq,dur,type="sine",gain=.05,slide=0){
    if(!settings.sound)return;this.init();if(!this.ctx)return;
    const o=this.ctx.createOscillator(),g=this.ctx.createGain(),now=this.ctx.currentTime;
    o.type=type;o.frequency.setValueAtTime(freq,now);o.frequency.linearRampToValueAtTime(Math.max(40,freq+slide),now+dur);
    g.gain.setValueAtTime(gain,now);g.gain.exponentialRampToValueAtTime(.001,now+dur);
    o.connect(g).connect(this.ctx.destination);o.start(now);o.stop(now+dur);
  }
  hit(){this.tone(100,.07,"square",.07,-50);this.tone(180,.05,"triangle",.035,-100)}
  heavy(){this.tone(70,.16,"sawtooth",.09,-45)}
  jump(){this.tone(260,.1,"triangle",.035,180)}
  dash(){this.tone(420,.08,"sawtooth",.035,-250)}
  special(){this.tone(180,.2,"triangle",.06,500)}
  ultimate(){this.tone(80,.7,"sawtooth",.08,800);setTimeout(()=>this.tone(500,.5,"sine",.05,-300),100)}
  win(){[440,554,659,880].forEach((f,i)=>setTimeout(()=>this.tone(f,.18,"triangle",.05),i*100))}
}
audio=new AudioFX();

class Particle{
  constructor(x,y,color,size=5,life=.4,vx=0,vy=0,shape="dot"){
    this.x=x;this.y=y;this.color=color;this.size=size;this.life=life;this.max=life;this.vx=vx;this.vy=vy;this.shape=shape
  }
  update(dt){this.life-=dt;this.x+=this.vx*dt;this.y+=this.vy*dt;this.vy+=700*dt;this.size*=Math.pow(.05,dt)}
  draw(){
    const a=Math.max(0,this.life/this.max);ctx.globalAlpha=a;ctx.fillStyle=this.color;ctx.strokeStyle=this.color;
    if(this.shape==="line"){ctx.lineWidth=Math.max(1,this.size);ctx.beginPath();ctx.moveTo(this.x,this.y);ctx.lineTo(this.x-this.vx*.045,this.y-this.vy*.045);ctx.stroke()}
    else{ctx.beginPath();ctx.arc(this.x,this.y,Math.max(.5,this.size),0,TAU);ctx.fill()}
    ctx.globalAlpha=1
  }
}

class Fighter{
  constructor(def,x,side,isAI=false){
    this.def=def;this.x=x;this.y=0;this.vx=0;this.vy=0;this.side=side;this.ai=isAI;
    this.maxHP=def.hp;this.hp=def.hp;this.energy=0;this.state="IDLE";this.stateTime=0;this.attack=null;
    this.attackTimer=0;this.cool={dash:0,special:0,ultimate:0};this.stun=0;this.invuln=0;this.knockTimer=0;
    this.combo=0;this.comboDamage=0;this.comboTimer=0;this.hitsTaken=0;this.totalDamage=0;this.dead=false;
    this.aiThink=0;this.aiMode="approach";this.hitFlash=0;this.step=0;
  }
  get grounded(){return this.y<=0.01}
  get face(){if(!game)return this.side;return game.enemyOf(this).x>=this.x?1:-1}
  setState(s,t=0){this.state=s;this.stateTime=t}
  canAct(){return !this.dead&&!["HIT","STUN","KNOCKDOWN","ULTIMATE"].includes(this.state)&&this.stun<=0}
  hurtbox(){return {x:this.x-28,y:this.y-112,w:56,h:112}}
  attackBox(){
    if(!this.attack)return null;
    const a=this.attack;
    const dir=this.face;
    return {x:dir>0?this.x+22:this.x-22-a.reach,y:this.y-104,w:a.reach+22,h:70};
  }
  startAttack(type){
    if(!this.canAct()||this.attack)return false;
    if(type==="special"&&this.cool.special>0)return false;
    const a=type==="light"?this.def.attacks.light:type==="heavy"?this.def.attacks.heavy:this.def.attacks.special;
    this.attack={type,...a,hit:false,total:a.wind+a.active+a.recovery};
    this.attackTimer=0;this.setState(type==="special"?"SPECIAL":type==="heavy"?"HEAVY_ATTACK":"ATTACK");
    if(type==="special"){this.cool.special=2.5;audio.special()}
    else if(type==="heavy")audio.heavy(); else audio.tone(210,.05,"square",.025,80);
    return true;
  }
  jump(){
    if(this.canAct()&&this.grounded){this.vy=this.def.jump;this.setState("JUMP");audio.jump();burst(this.x,this.y, this.def.color, 8, -1)}
  }
  dash(){
    if(!this.canAct()||this.cool.dash>0)return false;
    this.cool.dash=.75;this.vx=this.face*900;this.invuln=.22;this.setState("DASH",.18);audio.dash();
    burst(this.x,this.y-55,this.def.color,10, this.face);
    return true;
  }
  ultimate(){
    if(!this.canAct()||this.energy<100||this.cool.ultimate>0)return false;
    this.energy=0;this.cool.ultimate=3;this.attack={type:"ultimate",damage:this.def.ultimate.damage,reach:this.def.ultimate.reach,wind:.42,active:.28,recovery:.9,stun:.9,kb:this.def.ultimate.kb,energy:0,total:1.6,hit:false};
    this.attackTimer=0;this.setState("ULTIMATE");game.slow=.32;game.shake=22;audio.ultimate();
    ui.ultimateText.classList.add("show");setTimeout(()=>ui.ultimateText.classList.remove("show"),600);
    burst(this.x,this.y-60,this.def.color,30,this.face);return true;
  }
  takeHit(a,attacker){
    if(this.dead||this.invuln>0)return;
    this.hp=Math.max(0,this.hp-a.damage);this.energy=Math.min(100,this.energy+a.damage*.13);this.hitsTaken++;this.totalDamage+=a.damage;
    this.vx=attacker.face*a.kb;this.stun=a.stun;this.invuln=.12;this.hitFlash=.12;
    this.attack=null;this.attackTimer=0;
    if(this.hp<=0){this.dead=true;this.setState("DEAD");this.vy=360;game.shake=24;burst(this.x,this.y-55,"#fff",28,attacker.face);audio.heavy();return}
    if(a.kb>700){this.setState("KNOCKDOWN",.65);this.knockTimer=.65}
    else this.setState("HIT",Math.min(.5,a.stun+.08));
    game.shake=Math.min(26,4+a.damage*.08);game.hitstop=Math.max(game.hitstop,.06+(a.damage/500)*.04);
    burst(this.x+attacker.face*25,this.y-62,a.damage>120?"#fff":attacker.def.color,Math.min(18,5+a.damage/18),attacker.face);
    audio.hit();
  }
  update(dt){
    if(this.dead){this.vy-=1400*dt;this.y+=this.vy*dt;return}
    this.step+=dt;
    for(const k of Object.keys(this.cool))this.cool[k]=Math.max(0,this.cool[k]-dt);
    this.invuln=Math.max(0,this.invuln-dt);this.hitFlash=Math.max(0,this.hitFlash-dt);
    this.comboTimer=Math.max(0,this.comboTimer-dt);if(this.comboTimer<=0){this.combo=0;this.comboDamage=0}
    if(this.stun>0){this.stun-=dt}
    this.stateTime=Math.max(0,this.stateTime-dt);

    if(this.ai)this.thinkAI(dt);

    if(this.attack){
      this.attackTimer+=dt;
      const start=this.attack.wind,end=start+this.attack.active;
      if(!this.attack.hit&&this.attackTimer>=start&&this.attackTimer<=end){
        const target=game.enemyOf(this), box=this.attackBox();
        if(overlap(box,target.hurtbox())){
          this.attack.hit=true;target.takeHit(this.attack,this);
          // corrected attacker reference below in hit resolution
        }
      }
      if(this.attackTimer>=this.attack.total){this.attack=null;this.setState("IDLE")}
    }

    let move=0;
    if(this===game.player) move=(keys.has("d")?1:0)-(keys.has("a")?1:0)+(mobile.active?mobile.x:0);
    else move=this.aiMove||0;
    if(this.canAct()&&!this.attack&&this.state!=="DASH"){
      if(Math.abs(move)>.08){move=Math.max(-1,Math.min(1,move));this.vx=approach(this.vx,move*this.def.speed,1800*dt);this.setState(Math.abs(this.vx)>this.def.speed*.7?"RUN":"IDLE")}
      else this.vx=approach(this.vx,0,1300*dt);
    } else if(this.state==="DASH"){this.vx=approach(this.vx,0,4200*dt)}
    else if(this.attack){this.vx=approach(this.vx,0,1600*dt)}
    else this.vx=approach(this.vx,0,900*dt);

    if(this.grounded&&this.state==="JUMP")this.setState("IDLE");
    this.vy-=1800*dt;this.y+=this.vy*dt;
    if(this.y<0){this.y=0;this.vy=0;if(this.state==="JUMP")this.setState("IDLE");if(Math.abs(this.vx)>100)burst(this.x,this.y,this.def.color,3,0)}
    this.x+=this.vx*dt;
    this.x=Math.max(game.bounds.left+35,Math.min(game.bounds.right-35,this.x));
    if(this.state==="HIT"&&this.stateTime<=0)this.setState("IDLE");
    if(this.state==="KNOCKDOWN"&&this.stateTime<=0){this.setState("IDLE");this.invuln=.18}
    if(this.hitFlash>0) {}
  }
  thinkAI(dt){
    this.aiThink-=dt;
    if(this.aiThink>0)return;
    this.aiThink=.08+Math.random()*.08;
    const target=game.player,dx=target.x-this.x,dist=Math.abs(dx),dir=Math.sign(dx)||1;
    this.aiMove=0;
    if(this.state==="HIT"||this.state==="STUN"||this.state==="KNOCKDOWN")return;
    const aggression=Math.min(1,game.elapsed/45);
    if(dist>170)this.aiMove=dir;
    else if(dist<95)this.aiMove=-dir*(Math.random()<.35?1:0);
    if(dist<145&&this.canAct()&&!this.attack){
      const r=Math.random();
      if(r<.24+aggression*.12)this.startAttack("light");
      else if(r<.39+aggression*.12)this.startAttack("heavy");
      else if(r<.52+aggression*.1)this.startAttack("special");
      else if(r<.62)this.dash();
      else if(r<.68)this.jump();
    }
    if(dist<210&&Math.random()<.07+aggression*.04&&this.energy>=100)this.ultimate();
  }
  draw(){
    const sx=this.x, sy=game.groundY-this.y;
    const dir=this.face, c=this.def.color, a=this.def.accent;
    ctx.save();ctx.translate(sx,sy);ctx.scale(dir,1);
    // shadow
    ctx.restore();
    ctx.globalAlpha=.25;ctx.fillStyle="#000";ctx.beginPath();ctx.ellipse(sx,game.groundY+3,45+Math.min(20,this.y/20),9,0,0,TAU);ctx.fill();ctx.globalAlpha=1;
    ctx.save();ctx.translate(sx,sy);ctx.scale(dir,1);
    if(this.invuln>0)ctx.globalAlpha=.72;
    if(this.hitFlash>0){ctx.globalCompositeOperation="lighter"}
    const bob=this.grounded?Math.sin(this.step*8)*2:0;
    // trail for dash
    if(this.state==="DASH"){ctx.globalAlpha=.22;for(let i=1;i<5;i++){ctx.fillStyle=c;ctx.fillRect(-18-i*20,-75+bob+i*3,36,55)}} 
    // legs
    ctx.fillStyle="#101522";roundRect(ctx,-22,-55+bob,18,55,7);ctx.fill();roundRect(ctx,4,-55+bob,18,55,7);ctx.fill();
    ctx.strokeStyle=c;ctx.lineWidth=4;ctx.stroke();
    // torso
    ctx.fillStyle="#151b29";roundRect(ctx,-31,-126+bob,62,78,18);ctx.fill();ctx.strokeStyle=c;ctx.lineWidth=4;ctx.stroke();
    // chest accent
    ctx.fillStyle=a;ctx.globalAlpha=.8;ctx.fillRect(-18,-110+bob,36,7);ctx.globalAlpha=1;
    // head
    ctx.fillStyle="#0c101b";ctx.beginPath();ctx.arc(0,-151+bob,28,0,TAU);ctx.fill();ctx.strokeStyle=c;ctx.lineWidth=4;ctx.stroke();
    // visor/face
    ctx.fillStyle=c;ctx.fillRect(8,-158+bob,17,7);
    // arms
    const armSwing=this.attack? -18:Math.sin(this.step*7)*6;
    ctx.save();ctx.translate(-28,-103+bob);ctx.rotate((-20+armSwing)*Math.PI/180);roundRect(ctx,-9,0,18,55,8);ctx.fillStyle="#121827";ctx.fill();ctx.strokeStyle=c;ctx.stroke();ctx.restore();
    ctx.save();ctx.translate(28,-103+bob);ctx.rotate((20-armSwing)*Math.PI/180);roundRect(ctx,-9,0,18,55,8);ctx.fillStyle="#121827";ctx.fill();ctx.strokeStyle=c;ctx.stroke();ctx.restore();
    // attack glow
    if(this.attack){
      const p=Math.min(1,this.attackTimer/this.attack.total);
      ctx.globalAlpha=.22;ctx.strokeStyle=c;ctx.lineWidth=12;
      ctx.beginPath();ctx.arc(30,-92,70+p*30,-.8,.65);ctx.stroke();ctx.globalAlpha=1;
    }
    if(this.state==="ULTIMATE"){ctx.globalAlpha=.45;ctx.fillStyle=c;ctx.beginPath();ctx.arc(0,-100,95+Math.sin(this.step*18)*10,0,TAU);ctx.fill();ctx.globalAlpha=1}
    ctx.restore();
  }
}

function roundRect(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r)}
function overlap(a,b){return a&&b&&a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function approach(v,t,a){return v<t?Math.min(v+a,t):Math.max(v-a,t)}
function burst(x,y,color,n,dir=0){
  if(!settings.particles||!game)return;
  n=Math.min(n,30);
  for(let i=0;i<n;i++){
    const ang=dir===0?Math.random()*TAU:(dir>0?(-.8+Math.random()*1.6):Math.PI-.8+Math.random()*1.6);
    const sp=80+Math.random()*420;
    game.particles.push(new Particle(x,y,color,2+Math.random()*6,.2+Math.random()*.35,Math.cos(ang)*sp,Math.sin(ang)*sp,"line"));
  }
}
function shockwave(x,y,color,scale=1){
  if(!game)return;
  game.effects.push({type:"shock",x,y,color,life:.35,max:.35,scale});
}
function slash(x,y,color,dir){
  if(!game)return;
  game.effects.push({type:"slash",x,y,color,life:.18,max:.18,dir});
}

class Game{
  constructor(){
    this.player=new Fighter(CHARACTERS[selectedChar],430,1,false);
    let eidx=(selectedChar+1+Math.floor(Math.random()*3))%CHARACTERS.length;
    this.enemy=new Fighter(CHARACTERS[eidx],850,-1,true);
    this.arena=ARENAS[selectedArena];this.groundY=H*.78;this.bounds={left:90,right:W-90};
    this.cameraX=640;this.particles=[];this.effects=[];this.elapsed=0;this.time=60;this.hitstop=0;this.slow=1;this.shake=0;this.over=false;
    this.score={playerHits:0,damage:0};
    ui.playerName.textContent=this.player.def.name;ui.enemyName.textContent=this.enemy.def.name;
    ui.hud.classList.add("active");show(ui.hud);
    audio.init();
  }
  enemyOf(f){return f===this.player?this.enemy:this.player}
  update(dt){
    if(this.over)return;
    this.elapsed+=dt;this.time=Math.max(0,60-this.elapsed);
    if(this.hitstop>0){this.hitstop-=dt;return}
    dt*=this.slow;this.slow=approach(this.slow,1,1.8*dt);
    this.player.update(dt);this.enemy.update(dt);
    // fix attack hit attribution by resolving after fighter updates if needed
    // fighters call takeHit with target; restore attacker-derived knock direction where necessary
    this.resolveAttacks();
    this.particles=this.particles.filter(p=>p.life>0);
    for(const p of this.particles)p.update(dt);
    this.effects=this.effects.filter(e=>e.life>0);
    for(const e of this.effects)e.life-=dt;
    this.shake=approach(this.shake,0,55*dt);
    this.cameraX=approach(this.cameraX,(this.player.x+this.enemy.x)/2,500*dt);
    this.cameraX=Math.max(W/2,Math.min(1600-W/2,this.cameraX));
    if(this.time<=0)this.end(this.player.hp>=this.enemy.hp);
    else if(this.player.dead)this.end(false);
    else if(this.enemy.dead)this.end(true);
    updateHUD(this);
  }
  resolveAttacks(){
    // A fresh attack that connected is marked. The generic takeHit above receives the target,
    // so correct the direction and visuals here using each attacker's face.
    for(const attacker of [this.player,this.enemy]){
      const target=this.enemyOf(attacker);
      if(attacker.attack&&attacker.attack.hit){
        target.vx=attacker.face*attacker.attack.kb;
        target.stun=Math.max(target.stun,attacker.attack.stun);
        target.invuln=Math.max(target.invuln,.1);
        if(attacker.attack._counted!==this.elapsed){
          attacker.attack._counted=this.elapsed;
          attacker.combo++;attacker.comboDamage+=attacker.attack.damage;
          attacker.energy=Math.min(100,attacker.energy+attacker.attack.energy);
          attacker.comboTimer=1.25;
          if(attacker===this.player){this.score.playerHits++;this.score.damage+=attacker.attack.damage}
          shockwave(target.x,target.y-65,attacker.def.color,1+attacker.attack.damage/180);
          slash(attacker.x+attacker.face*45,target.y-80,attacker.def.color,attacker.face);
        }
      }
    }
  }
  draw(){
    drawArena(this);
    const order=this.player.x<this.enemy.x?[this.player,this.enemy]:[this.enemy,this.player];
    order.forEach(f=>f.draw());
    for(const e of this.effects)drawEffect(e);
    for(const p of this.particles)p.draw();
    if(this.shake>0&&settings.shake){}
  }
  end(win){
    this.over=true;ui.hud.classList.remove("active");
    ui.resultTitle.textContent=win?"VICTORY":"DEFEAT";
    ui.resultTitle.style.color=win?"#8dffb7":"#ff718b";
    ui.resultStats.textContent=`${this.player.def.name}: ${Math.max(0,Math.ceil(this.player.hp))} HP • ${this.score.playerHits} hits • ${this.score.damage} damage`;
    show(ui.result);if(win)audio.win();
  }
}

function drawArena(g){
  const a=g.arena;
  const cam=g.cameraX;
  ctx.save();
  const shakeX=(Math.random()-.5)*g.shake,shakeY=(Math.random()-.5)*g.shake;
  ctx.translate(shakeX,shakeY);
  const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,a.sky);grad.addColorStop(1,"#070911");ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  // parallax skyline
  const ox=-(cam*.18)%260;
  for(let i=-2;i<8;i++){
    const x=ox+i*260,h=90+(i%4)*35;
    ctx.fillStyle="rgba(8,11,20,.75)";ctx.fillRect(x,H*.55-h,190,h);
    ctx.fillStyle=a.accent;ctx.globalAlpha=.25;
    for(let j=0;j<5;j++)ctx.fillRect(x+20+j*32,H*.55-h+22,7,5);
    ctx.globalAlpha=1;
  }
  // arena-specific decoration
  ctx.strokeStyle=a.accent;ctx.globalAlpha=.35;ctx.lineWidth=2;
  for(let i=-1;i<12;i++){const x=((i*180-cam*.55)%180)+90;ctx.beginPath();ctx.moveTo(x,H*.62);ctx.lineTo(x+40,H*.48);ctx.stroke()}
  ctx.globalAlpha=1;
  // ambient motes
  for(let i=0;i<35;i++){const x=(i*83+g.elapsed*18)%W,y=(i*47+g.elapsed*(7+(i%3)*5))%(H*.72);ctx.fillStyle=a.accent;ctx.globalAlpha=.15;ctx.fillRect(x,y,2,2)}
  ctx.globalAlpha=1;
  // ground
  ctx.fillStyle=a.ground;ctx.fillRect(0,g.groundY,W,H-g.groundY);
  ctx.fillStyle=a.accent;ctx.globalAlpha=.25;ctx.fillRect(0,g.groundY,W,4);ctx.globalAlpha=1;
  const grid=70, start=(-(cam*.9)%grid);
  ctx.strokeStyle="rgba(255,255,255,.06)";ctx.lineWidth=1;
  for(let x=start;x<W;x+=grid){ctx.beginPath();ctx.moveTo(x,g.groundY);ctx.lineTo(x+70,H);ctx.stroke()}
  ctx.restore();
}
function drawEffect(e){
  const a=Math.max(0,e.life/e.max);ctx.save();ctx.globalAlpha=a;
  if(e.type==="shock"){
    ctx.strokeStyle=e.color;ctx.lineWidth=6*a;ctx.beginPath();ctx.arc(e.x,e.y,30+(1-a)*110*e.scale,0,TAU);ctx.stroke();
  } else if(e.type==="slash"){
    ctx.strokeStyle=e.color;ctx.lineWidth=8*a;ctx.beginPath();ctx.arc(e.x,e.y,60,e.dir>0?-1.0:2.1,e.dir>0?0.5:3.6);ctx.stroke();
  }
  ctx.restore();
}
function updateHUD(g){
  ui.playerHP.style.width=`${Math.max(0,g.player.hp/g.player.maxHP*100)}%`;
  ui.enemyHP.style.width=`${Math.max(0,g.enemy.hp/g.enemy.maxHP*100)}%`;
  ui.playerEnergy.style.width=`${g.player.energy}%`;ui.enemyEnergy.style.width=`${g.enemy.energy}%`;
  ui.playerUlt.textContent=g.player.energy>=100?"ULT READY":"ULT";
  ui.enemyUlt.textContent=g.enemy.energy>=100?"ULT READY":"ULT";
  ui.timer.textContent=Math.ceil(g.time);
  if(g.player.combo>1){
    ui.comboText.style.opacity="1";ui.comboText.innerHTML=`${g.player.combo} HITS<br><small>${Math.round(g.player.comboDamage)} DAMAGE</small>`;
  } else ui.comboText.style.opacity="0";
}

function queueAction(action){
  if(!game||game.over)return;
  if(action==="light")game.player.startAttack("light");
  if(action==="heavy")game.player.startAttack("heavy");
  if(action==="special")game.player.startAttack("special");
  if(action==="jump")game.player.jump();
  if(action==="dash")game.player.dash();
  if(action==="ultimate")game.player.ultimate();
}

function startGame(){
  buildArenas();audio.init();game=new Game();
}
document.getElementById("rematch").onclick=()=>startGame();
document.getElementById("resultBack").onclick=()=>{game=null;ui.hud.classList.remove("active");show(ui.main)};

function loop(now){
  const dt=Math.min(.033,(now-last)/1000);last=now;
  if(game){game.update(dt);game.draw()}else{
    // subtle menu background
    ctx.fillStyle="#080a11";ctx.fillRect(0,0,W,H);
  }
  requestAnimationFrame(loop);
}
buildCharacters();buildArenas();requestAnimationFrame(loop);
})();