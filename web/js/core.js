const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
let W=innerWidth,H=innerHeight,DPR=Math.min(2,devicePixelRatio||1);
function resize(){W=innerWidth;H=innerHeight;canvas.width=W*DPR;canvas.height=H*DPR;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0);} resize(); addEventListener('resize',resize);
const keys={}; addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key===' ')e.preventDefault();}); addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
const mouse={x:W*.5,y:H*.5,down:false,right:false}; addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY}); addEventListener('mousedown',e=>{if(e.button===0)mouse.down=true;if(e.button===2)mouse.right=true}); addEventListener('mouseup',e=>{if(e.button===0)mouse.down=false;if(e.button===2)mouse.right=false}); addEventListener('contextmenu',e=>e.preventDefault());
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,rand=(a,b)=>a+Math.random()*(b-a),norm=(x,y)=>{const d=Math.hypot(x,y)||1;return{x:x/d,y:y/d}},dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const AudioCtx=window.AudioContext||window.webkitAudioContext;
let audioCtx=null,masterGain=null,audioLimiter=null,lastShotSfx=0,lastHitSfx=0;
function ensureAudio(){
 if(!AudioCtx)return null;
 if(!audioCtx){
   audioCtx=new AudioCtx();
   masterGain=audioCtx.createGain();
   audioLimiter=audioCtx.createDynamicsCompressor();
   masterGain.gain.value=.78;
   audioLimiter.threshold.value=-8;
   audioLimiter.knee.value=4;
   audioLimiter.ratio.value=10;
   audioLimiter.attack.value=.003;
   audioLimiter.release.value=.12;
   masterGain.connect(audioLimiter);
   audioLimiter.connect(audioCtx.destination);
 }
 if(audioCtx.state==='suspended')audioCtx.resume();
 return audioCtx;
}
function tone(freq=440,dur=.08,type='sine',vol=.12,slide=1,when=0,pan=0){
 const ac=ensureAudio();if(!ac)return;
 const t=ac.currentTime+when,o=ac.createOscillator(),g=ac.createGain();
 const p=ac.createStereoPanner?ac.createStereoPanner():null;
 o.type=type;o.frequency.setValueAtTime(freq,t);
 o.frequency.exponentialRampToValueAtTime(Math.max(25,freq*slide),t+dur);
 g.gain.setValueAtTime(.0001,t);
 g.gain.exponentialRampToValueAtTime(vol,t+.006);
 g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 o.connect(g);if(p){p.pan.value=pan;g.connect(p);p.connect(masterGain);}else g.connect(masterGain);
 o.start(t);o.stop(t+dur+.03);
}
function noise(dur=.12,vol=.08,cut=1200,when=0,highpass=0){
 const ac=ensureAudio();if(!ac)return;
 const t=ac.currentTime+when,len=Math.max(1,Math.floor(ac.sampleRate*dur)),buf=ac.createBuffer(1,len,ac.sampleRate),data=buf.getChannelData(0);
 for(let i=0;i<len;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/len,1.5);
 const s=ac.createBufferSource(),lp=ac.createBiquadFilter(),g=ac.createGain();
 s.buffer=buf;lp.type='lowpass';lp.frequency.value=cut;
 let last=lp;
 if(highpass>0){const hp=ac.createBiquadFilter();hp.type='highpass';hp.frequency.value=highpass;lp.connect(hp);last=hp;}
 g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 s.connect(lp);last.connect(g);g.connect(masterGain);s.start(t);
}
function laser(startF,endF,dur=.09,vol=.11,when=0){
 const ac=ensureAudio();if(!ac)return;
 const t=ac.currentTime+when,o=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();
 o.type='sine';o.frequency.setValueAtTime(startF,t);o.frequency.exponentialRampToValueAtTime(endF,t+dur);
 f.type='bandpass';f.frequency.setValueAtTime(Math.max(startF,endF)*.72,t);f.Q.value=4;
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 o.connect(f);f.connect(g);g.connect(masterGain);o.start(t);o.stop(t+dur+.02);
}
function sfx(name){
 const now=performance.now();
 if(name==='shot'){
   if(now-lastShotSfx<38)return;lastShotSfx=now;
   laser(1450,430,.055,.12);noise(.035,.035,5200,0,2200);
 }else if(name==='blast'){
   noise(.22,.17,1800,0,90);tone(115,.24,'sine',.22,.34);laser(480,105,.16,.09);
 }else if(name==='hit'){
   if(now-lastHitSfx<50)return;lastHitSfx=now;
   noise(.055,.07,4200,0,900);laser(760,260,.05,.065);
 }else if(name==='dash'){
   noise(.14,.07,6800,0,1600);laser(220,1800,.14,.14);laser(430,2400,.11,.055,.025);
 }else if(name==='buff'){
   laser(430,720,.10,.10);laser(650,1080,.12,.10,.06);laser(980,1550,.14,.085,.12);
 }else if(name==='debuff'){
   laser(900,260,.15,.12);noise(.10,.055,2800,0,500);tone(135,.18,'sine',.09,.62,.05);
 }else if(name==='shield'){
   laser(520,1350,.15,.11);tone(980,.18,'sine',.07,1.16,.04);
 }else if(name==='heal'){
   tone(330,.15,'sine',.10,1.01);tone(494,.16,'sine',.10,1.01,.07);tone(740,.20,'sine',.09,1.03,.14);
 }else if(name==='shieldBreak'){
   noise(.16,.13,6500,0,1800);laser(1800,120,.14,.13);tone(82,.22,'sine',.14,.48);
 }else if(name==='bossWarn'){
   tone(78,.34,'sine',.18,1.04);tone(117,.34,'sine',.12,.98,.035);noise(.24,.06,900,0,80);
 }else if(name==='bossBurst'){
   noise(.30,.18,2400,0,70);tone(62,.34,'sine',.22,.58);laser(520,95,.20,.10);
 }else if(name==='upgrade'){
   laser(540,920,.075,.085);laser(900,1500,.085,.09,.055);tone(1250,.12,'sine',.055,1.08,.11);
 }else if(name==='locked'){
   laser(430,240,.075,.07);tone(145,.09,'sine',.055,.85,.035);
 }else if(name==='start'){
   laser(180,620,.13,.10);laser(420,1200,.14,.09,.075);
 }else if(name==='victory'){
   tone(330,.16,'sine',.10,1.01);tone(494,.17,'sine',.10,1.01,.13);tone(659,.25,'sine',.11,1.03,.27);
 }else if(name==='defeat'){
   laser(520,180,.22,.10);tone(145,.24,'sine',.10,.65,.12);tone(72,.32,'sine',.11,.62,.27);
 }
}
function unlockAudio(){
 const ac=ensureAudio();if(!ac)return;
 setTimeout(()=>{tone(620,.05,'sine',.08,1.12);},20);
}
addEventListener('pointerdown',unlockAudio,{once:true});
addEventListener('keydown',unlockAudio,{once:true});

const arena={pad:44,maxW:1440,maxH:810,shrinkDelay:60,shrinkRate:18,minW:720,minH:405};
function shrinkDelayForStage(){const t=stageType(run.stage);return t==='bigBoss'?null:t==='midBoss'?90:60;}
function arenaBounds(){const baseW=Math.min(W,arena.maxW),baseH=Math.min(H,arena.maxH),delay=shrinkDelayForStage(),shrink=state==='battle'&&delay!=null?Math.max(0,time-delay)*arena.shrinkRate:0;const aw=Math.max(arena.minW,baseW-shrink),ah=Math.max(arena.minH,baseH-shrink);return{left:(W-aw)/2,right:(W+aw)/2,top:(H-ah)/2,bottom:(H+ah)/2,w:aw,h:ah};}
let particles=[],bullets=[],rings=[],obstacles=[],pickups=[],redRespawns=[],enemies=[],player,remotePlayer=null,time=0,shake=0,redSpawn=4,blueSpawn=7,battleEnded=false,state='shop',messageTimer=0,bossHealReady=true,bossHealCooldown=0;
const multiplayer={enabled:false,mode:'coop',players:1};
const net={role:'solo',ws:null,connected:false,peer:false,input:{dx:0,dy:0,aim:0,fire:false,dash:false},sendT:0,snapT:0,localReady:false,peerReady:false};
const emptyUp=()=>({damage:0,fireRate:0,projectile:0,blast:0,homing:0,elite:0,hp:0,shield:0,shieldRegen:0,speed:0});
const SAVE_KEY='neon_duel_save_v3';
const run={stage:1,maxStage:1,credits:100,totalKills:0,wins:0,losses:0,up:emptyUp()};
let peerProfile={credits:100,maxStage:1,up:emptyUp()};
function loadSave(){try{const d=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(!d)return;run.maxStage=Math.max(1,Math.floor(+d.maxStage||1));run.stage=clamp(Math.floor(+d.stage||run.maxStage),1,run.maxStage);run.credits=Math.max(0,Math.floor(+d.credits||0));run.totalKills=Math.max(0,Math.floor(+d.totalKills||0));run.wins=Math.max(0,Math.floor(+d.wins||0));run.losses=Math.max(0,Math.floor(+d.losses||0));run.up={...emptyUp(),...(d.up||{})};}catch(e){console.warn('save load failed',e);}}
function saveState(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({stage:run.stage,maxStage:run.maxStage,credits:run.credits,totalKills:run.totalKills,wins:run.wins,losses:run.losses,up:run.up}));}catch(e){console.warn('save failed',e);}}
loadSave();
