const UPGRADES=[
 {k:'damage',name:'Pulse Damage',desc:'기본탄 피해 +5%',base:38,group:'attack',max:12},
 {k:'fireRate',name:'Fire Matrix',desc:'Stage 3 해금 · 연사 속도 +5%',base:75,group:'attack',max:12},
 {k:'projectile',name:'Rail Accelerator',desc:'Stage 2 해금 · 탄속 +5%',base:58,group:'attack',max:10},
 {k:'blast',name:'Nova Charge',desc:'Stage 4 해금 · 폭발탄 자동발사 (10발 → 최소 3발)',base:50,group:'attack',max:8},
 {k:'homing',name:'Hunter Pulse',desc:'Stage 6 해금 · 유도탄 자동발사 (9발 → 최소 2발)',base:150,group:'attack',max:8},
 {k:'elite',name:'Elite Breaker',desc:'Stage 5 해금 · 중간/대형보스 피해 +25%',base:90,group:'attack',max:5},
 {k:'hp',name:'Reinforced Hull',desc:'최대 HP +10%/Lv',base:52,group:'defense',max:14},
 {k:'shield',name:'Aegis Core',desc:'Stage 6 해금 · Lv1 실드 20 · 이후 최대 실드 +10',base:120,group:'defense',max:10},
 {k:'shieldRegen',name:'Aegis Reactor',desc:'Stage 6 해금 · 실드 재충전 속도 +0.3/s',base:96,group:'defense',max:10},
 {k:'speed',name:'Vector Drive',desc:'Stage 2 해금 · 이동속도 +3%',base:48,group:'defense',max:10}
];
function costOf(u,profile=run){const up=profile.up;if(u.k==='blast')return 100+50*up.blast;if(u.k==='homing')return 150+100*up.homing;if(u.k==='elite'){const costs=[90,225,400,650,950];return costs[Math.min(up.elite,costs.length-1)];}if(u.k==='speed')return Math.round(u.base*Math.pow(1.40,up.speed));return Math.round(u.base*Math.pow(1.48,up[u.k]));}
function novaInterval(profile=run){return profile.up.blast>0?Math.max(3,11-profile.up.blast):0;}
function homingInterval(profile=run){return profile.up.homing>0?Math.max(2,10-profile.up.homing):0;}
function playerStats(profile=run){const u=profile.up,shieldMax=u.shield>0?20+(u.shield-1)*10:0;return{maxHealth:100*Math.pow(1.10,u.hp),maxShield:shieldMax,shieldRegen:shieldMax>0?.5+u.shieldRegen*.3:0,damage:8*(1+u.damage*.05),fireRate:.575*(1+u.fireRate*.05),projectile:610*(1+u.projectile*.05),blastDamage:u.blast>0?22:0,armor:0,evasion:0,speed:255*(1+u.speed*.03),dashCd:1.65,dashPower:820,novaEvery:novaInterval(profile),homingEvery:homingInterval(profile),eliteMult:1+u.elite*.25};}
function exportProfile(){return{credits:run.credits,maxStage:run.maxStage,up:{...run.up}};}
function stageType(s){if(s%10===0)return'bigBoss';if(s%5===0)return'midBoss';return'normal';}
function enemyScale(s){return{hp:1+(s-1)*.06,damage:1+(s-1)*.02,fire:1+(s-1)*.006,speed:1+(s-1)*.007,projectile:1+(s-1)*.005,evasion:Math.min(.05,Math.floor((s-1)/5)*.0025)};}
function enemyCountForStage(s){
 const t=stageType(s);
 const base=t==='bigBoss'?1:t==='midBoss'?1+Math.min(2,Math.floor((s-1)/10)):1+Math.floor((s-1)/5);
 if(multiplayer.enabled&&multiplayer.mode==='coop'&&multiplayer.players>=2&&t==='normal')return base*2;
 return base;
}
function makeMage(x,y,color,ai=false,type='striker'){return{x,y,vx:0,vy:0,r:type==='boss'?42:type==='midboss'?29:18,color,health:100,maxHealth:100,aim:0,shotCd:0,blastCd:0,dashCd:0,dashT:0,inv:0,ai,type,decision:0,strafe:Math.random()<.5?-1:1,predict:.45,phase:Math.random()*10,effect:null,effectT:0,effectMul:1,evasion:0,armor:0,speed:235,damage:8,blastDamage:22,fireRate:1,projectile:610,dashBase:1.65,bossPhase:0,burstCd:rand(1,2),chargeCd:rand(2,4),bossSkillIndex:0,basicShotCount:0,homingShotCount:0,shield:0,maxShield:0,shieldRegen:0,shieldRechargeDelay:0,tempShield:0,tempShieldT:0,attackDebuffT:0,attackDebuffMul:1,specialLockT:0,invisibleEnemyT:0,deferredDebuffT:0,deferredDebuffStacks:0,excaliburT:0,fortressShieldDecay:0,boss2:false,auraRadius:375,auraColors:null,auraMap:null,auraIndex:0,auraEffect:0,auraT:0,auraPulse:0,auraPulseT:0,auraVisits:[0,0,0,0],purpleSpawnT:2,mouseSnapT:2,forcedAimT:0,forcedAimX:0,forcedAimY:0,fireGrace:0,targetLockT:0,combatTarget:null,alive:true};}
function spawnEnemy(type,index,total){const s=enemyScale(run.stage),angle=(index/Math.max(1,total))*Math.PI*2;const ab=arenaBounds();let x=ab.left+ab.w*.72+Math.cos(angle)*90,y=ab.top+ab.h*.5+Math.sin(angle)*150;const color=type==='sniper'?'#ffb35e':type==='rusher'?'#ff506e':type==='tank'?'#b877ff':type==='midboss'?'#ff47b7':type==='boss'?'#ff355f':'#ff59cf';const m=makeMage(x,y,color,true,type);let hpBase=100,damageMult=1,speedMult=1,fireMult=1,projectileMult=1;
 if(type==='sniper'){hpBase=72;damageMult=1.55;speedMult=.9;fireMult=.62;projectileMult=1.35;m.predict=.7;}
 if(type==='rusher'){hpBase=82;damageMult=.8;speedMult=1.3;fireMult=1.15;m.predict=.35;}
 if(type==='tank'){hpBase=170;damageMult=1.18;speedMult=.68;fireMult=.78;m.r=23;}
 if(type==='midboss'){hpBase=292.5;damageMult=1.22;speedMult=.9;fireMult=1.05;m.evasion=Math.min(.08,s.evasion+.015);}
 if(type==='boss'){hpBase=900;damageMult=1.3;speedMult=.72;fireMult=1.08;m.evasion=Math.min(.08,s.evasion+.02);}
 const coopHpMult=(multiplayer.enabled&&multiplayer.mode==='coop'&&multiplayer.players>=2)?(type==='midboss'?1.25:type==='boss'?2.00:1.00):1;
 m.maxHealth=hpBase*.6*s.hp*coopHpMult;m.health=m.maxHealth;
 if(type==='boss'&&run.stage===20){
   m.boss2=true;m.maxHealth=220000;m.health=220000;m.armor=.999;
   m.auraColors=['#ff9b9b','#9bc7ff','#9bffb0','#ffe89b'];
   m.auraMap=shuffleBoss2AuraMap();
   m.auraIndex=0;m.auraEffect=m.auraMap[0];m.auraT=10;m.auraPulse=0;m.auraPulseT=.9;m.auraVisits=[1,0,0,0];m.purpleSpawnT=2;m.mouseSnapT=2;
 }m.damage=8*s.damage*damageMult;m.blastDamage=22*s.damage*damageMult;m.speed=235*s.speed*speedMult;m.fireRate=.575*s.fire*fireMult;m.projectile=610*s.projectile*projectileMult;m.evasion=Math.max(m.evasion,s.evasion);return m;}
function enemyTypeFor(i,s){if(s<4)return'striker';const bag=s<7?['striker','rusher']:s<10?['striker','rusher','sniper']:['striker','rusher','sniper','tank'];return bag[(i+s)%bag.length];}
function obstacleCount(){return clamp(Math.round(14+(Math.min(W*H,2200000)-700000)/500000),14,18);}
function createObstacles(){obstacles=[];const count=obstacleCount(),wallScale=.6*(1+(run.stage-1)*.015);for(let i=0;i<count;i++){const horizontal=Math.random()<.52,w=horizontal?rand(72,132):rand(36,64),h=horizontal?rand(28,50):rand(72,122);let p=null;for(let t=0;t<80;t++){const ab=arenaBounds(),x=rand(ab.left+ab.w*.22,ab.left+ab.w*.78),y=rand(ab.top+ab.h*.15,ab.top+ab.h*.85);if(Math.hypot(x-(ab.left+ab.w*.18),y-(ab.top+ab.h*.5))<135||Math.hypot(x-(ab.left+ab.w*.78),y-(ab.top+ab.h*.5))<145)continue;if(obstacles.some(o=>Math.abs(x-o.x)<(w+o.w)/2+28&&Math.abs(y-o.y)<(h+o.h)/2+28))continue;p={x,y};break;}if(!p)continue;const roll=Math.random(),kind=roll<.13?'reinforced':roll<.23?'explosive':'normal',baseHp=kind==='reinforced'?150:kind==='explosive'?62:82,hp=Math.round(baseHp*wallScale);obstacles.push({x:p.x,y:p.y,w,h,hp,maxHp:hp,kind,dead:false});}}
function applyPlayerStats(m,ps){Object.assign(m,{maxHealth:ps.maxHealth,health:ps.maxHealth,maxShield:ps.maxShield,shield:ps.maxShield,shieldRegen:ps.shieldRegen,damage:ps.damage,blastDamage:ps.blastDamage,fireRate:ps.fireRate,projectile:ps.projectile,armor:ps.armor,evasion:0,speed:ps.speed,dashBase:ps.dashCd,dashPower:ps.dashPower,novaEvery:ps.novaEvery||0,homingEvery:ps.homingEvery||0,eliteMult:ps.eliteMult||1});}
function startBattle(){
 state='battle';battleEnded=false;particles=[];bullets=[];rings=[];pickups=[];redRespawns=[];enemies=[];time=0;shake=0;redSpawn=3.2;blueSpawn=isActiveMultiplayer()?3.25:6.5;bossHealReady=true;bossHealCooldown=0;
 document.getElementById('shop').classList.remove('show');document.getElementById('resultBanner').classList.remove('show');
 const ps=playerStats(run),ab=arenaBounds();player=makeMage(ab.left+ab.w*.18,ab.top+ab.h*.43,'#58efff',false,'player');applyPlayerStats(player,ps);
 remotePlayer=null;
 if(multiplayer.enabled&&net.role==='host'&&net.peer){const rps=playerStats(peerProfile);remotePlayer=makeMage(ab.left+ab.w*.18,ab.top+ab.h*.60,'#72ff9d',false,'player2');applyPlayerStats(remotePlayer,rps);}
 net.localReady=false;net.peerReady=false;
 createObstacles();
 if(multiplayer.mode!=='vs'){
   const t=stageType(run.stage),cnt=enemyCountForStage(run.stage);
   if(t==='bigBoss')enemies.push(spawnEnemy('boss',0,1));
   else if(t==='midBoss'){
     if(multiplayer.enabled&&multiplayer.mode==='coop'&&multiplayer.players>=2){
       enemies.push(spawnEnemy('midboss',0,2));
       enemies.push(spawnEnemy('midboss',1,2));
     }else{
       enemies.push(spawnEnemy('midboss',0,cnt));
       for(let i=1;i<cnt;i++)enemies.push(spawnEnemy(enemyTypeFor(i,run.stage),i,cnt));
     }
   }
   else for(let i=0;i<cnt;i++)enemies.push(spawnEnemy(enemyTypeFor(i,run.stage),i,cnt));
   showMsg(t==='bigBoss'?'TITAN SIGNAL':t==='midBoss'?'GUARDIAN SIGNAL':`STAGE ${run.stage}`,1.0);
 }else showMsg('DUEL // VS',1.0);
 netSendSnapshot(true);
}
function resetReadyState(){net.localReady=false;net.peerReady=false;}
function showShop(){state='shop';document.getElementById('shop').classList.add('show');renderShop();}
function unlockStageFor(k){return (k==='projectile'||k==='speed')?2:k==='fireRate'?3:k==='blast'?4:k==='elite'?5:(k==='shield'||k==='shieldRegen'||k==='homing')?6:1;}
function renderShop(){
 document.getElementById('creditText').textContent=`${run.credits} CR`;const p=playerStats(run);
 document.getElementById('shipSummary').innerHTML=`HP ${Math.round(p.maxHealth)} · SHIELD ${Math.round(p.maxShield)}<br>DMG ${p.damage.toFixed(1)} · FIRE x${p.fireRate.toFixed(2)} · SPEED ${Math.round(p.speed)}<br>NOVA ${run.up.blast>0?`1/${novaInterval(run)}`:'LOCKED'} · HOMING ${run.up.homing>0?`1/${homingInterval(run)}`:'LOCKED'}<br>ELITE DMG +${run.up.elite*25}% · SHIELD REGEN ${p.shieldRegen.toFixed(1)}/s`;
 const sel=document.getElementById('stageSelect');
 const hostCanChoose=!multiplayer.enabled||net.role==='host';
 const selectorMax=Math.max(1,run.maxStage,(multiplayer.enabled&&net.role==='guest')?run.stage:1);
 if(sel.options.length!==selectorMax){sel.innerHTML='';for(let st=1;st<=selectorMax;st++){const op=document.createElement('option');op.value=st;op.textContent=stageLabel(st);sel.appendChild(op);}}
 sel.value=String(clamp(run.stage,1,selectorMax));sel.disabled=!hostCanChoose||net.localReady;
 document.getElementById('stageLockInfo').textContent=hostCanChoose?`최고 ${run.maxStage}`:`HOST 선택 · 내 최고 ${run.maxStage}`;
 document.getElementById('nextInfo').textContent=`NEXT: ${multiplayer.mode==='vs'?`DUEL // ${stageLabel(run.stage)}`:stageLabel(run.stage)}${multiplayer.mode==='coop'?` · ENEMY ${enemyCountForStage(run.stage)}`:''} · 누적 처치 ${run.totalKills}`;
 const ready=net.localReady;
 document.getElementById('readyWait').textContent=!multiplayer.enabled?'':ready?(net.peerReady?'양쪽 준비 완료':'다른 플레이어를 기다리고 있습니다.'):(net.peerReady?'상대방 READY · 준비를 완료하십시오.':'각자 업그레이드 후 READY');
 const sb=document.getElementById('startBtn');sb.textContent=multiplayer.enabled?'READY':'DEPLOY';sb.disabled=ready|| (multiplayer.enabled&&!net.peer);
 for(const group of ['attack','defense']){const root=document.getElementById(group==='attack'?'attackCol':'defenseCol');root.querySelectorAll('.upgrade').forEach(n=>n.remove());for(const u of UPGRADES.filter(x=>x.group===group).slice().sort((a,b)=>unlockStageFor(a.k)-unlockStageFor(b.k))){const lv=run.up[u.k],cost=costOf(u,run),d=document.createElement('div');d.className='upgrade';const unlockStage=unlockStageFor(u.k),stageLocked=run.maxStage<unlockStage;d.innerHTML=`<div class="uName">${u.name}</div><div class="uDesc">${u.desc}${stageLocked?` · Stage ${unlockStage}부터 구매 가능`:''}</div><div class="uLv">Lv ${lv} / ${u.max}</div><button ${ready||lv>=u.max||run.credits<cost||stageLocked?'disabled':''}>${lv>=u.max?'MAX':stageLocked?'STAGE '+unlockStage:cost+' CR'}</button>`;d.querySelector('button').onclick=()=>{if(net.localReady||run.up[u.k]>=u.max)return;if(run.maxStage<unlockStageFor(u.k))return;const c=costOf(u,run);if(run.credits<c)return;run.credits-=c;run.up[u.k]++;saveState();sfx('upgrade');if(multiplayer.enabled)wsSend({type:'profile',profile:exportProfile()});renderShop();};root.appendChild(d);}}
}
function tryStartMultiplayer(){if(net.role==='host'&&net.peer&&net.localReady&&net.peerReady){wsSend({type:'battleStart',stage:run.stage,mode:multiplayer.mode,hostProfile:exportProfile(),guestProfile:peerProfile});sfx('start');startBattle();}}
document.getElementById('stageSelect').onchange=e=>{
 if(net.localReady)return;
 if(multiplayer.enabled&&net.role!=='host'){renderShop();return;}
 run.stage=clamp(Math.floor(+e.target.value||1),1,run.maxStage);saveState();
 if(multiplayer.enabled&&net.role==='host')wsSend({type:'mode',mode:multiplayer.mode,stage:run.stage,maxStage:run.maxStage});
 renderShop();
};
document.getElementById('startBtn').onclick=()=>{
 if(!multiplayer.enabled){saveState();sfx('start');startBattle();return;}
 if(!net.peer||net.localReady)return;
 net.localReady=true;wsSend({type:'ready',ready:true,profile:exportProfile()});sfx('start');renderShop();tryStartMultiplayer();
};
function stageLabel(s){return stageType(s)==='bigBoss'?`STAGE ${s} // TITAN`:stageType(s)==='midBoss'?`STAGE ${s} // GUARDIAN`:`STAGE ${s}`;}
function showMsg(t,s=1.2){const el=document.getElementById('centerMsg');el.textContent=t;el.style.opacity=1;messageTimer=s;}
function burst(x,y,color,n=18,spd=160){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,sp=Math.random()*spd;particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rand(.25,.7),color,size:rand(1.5,4.5)});}}
function ring(x,y,color,max=90){rings.push({x,y,r:4,max,life:.4,color});}
function circleRect(cx,cy,r,o){const nx=clamp(cx,o.x-o.w/2,o.x+o.w/2),ny=clamp(cy,o.y-o.h/2,o.y+o.h/2);return Math.hypot(cx-nx,cy-ny)<r;}
function lineOfSight(a,b){const steps=14;for(let i=1;i<steps;i++){const t=i/steps,x=lerp(a.x,b.x,t),y=lerp(a.y,b.y,t);for(const o of obstacles)if(!o.dead&&x>o.x-o.w/2&&x<o.x+o.w/2&&y>o.y-o.h/2&&y<o.y+o.h/2)return false;}return true;}
function fire(m,target,blast=false,autoBlast=false,autoHoming=false){
 if(state!=='battle'||!m.alive)return;
 if(m===player||m===remotePlayer){
   m.fireGrace=.75;
 }
 const a=Math.atan2(target.y-m.y,target.x-m.x),speed=(blast?360:m.projectile),debuffAtk=(m.attackDebuffT||0)>0?(m.attackDebuffMul||.5):1,excaliburAtk=(m.excaliburT||0)>0?1.75:1,atkMul=debuffAtk*excaliburAtk;
 const boss2=enemies.find(e=>e.alive&&e.boss2);
 const inBoss2Aura=!!(boss2&&(m===player||m===remotePlayer)&&Math.hypot(m.x-boss2.x,m.y-boss2.y)<=boss2.auraRadius);
 const aura2=!!(inBoss2Aura&&boss2.auraEffect===3);
 const auraHoming=!!(inBoss2Aura&&(boss2.auraEffect===1||boss2.auraEffect===2));
 const aura4Normal=!!(inBoss2Aura&&boss2.auraEffect===4&&!blast&&!aura2);
 const bullet={x:m.x+Math.cos(a)*(m.r+8),y:m.y+Math.sin(a)*(m.r+8),vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:blast?8:4,life:blast?2.3:1.6,owner:m,damage:aura2?777:(blast?m.blastDamage:m.damage)*atkMul*((multiplayer.enabled&&multiplayer.mode==='coop'&&multiplayer.players>=2&&m.type==='boss')?1.25:1),color:aura2?'#d8f5ff':m.color,blast:aura2?false:blast,pulse:Math.random()*10,homingT:aura2?8:(auraHoming?2.5:(autoHoming?1:((m.effect==='homingBuff')?(m.homingBuffGuideT||1):0))),persistent:(m.type==='boss'||m.type==='midboss'),boss2AuraShot:aura2,boss2Aura4Normal:aura4Normal};
 bullets.push(bullet);burst(m.x+Math.cos(a)*22,m.y+Math.sin(a)*22,bullet.color,blast?12:6,blast?100:70);shake+=blast?4:1.2;sfx(blast?'blast':'shot');
 const fireEffect=((m.effect==='fireBuff'||m.effect==='fireDebuff')?m.effectMul:1)*((m.excaliburT||0)>0?1.25:1);m.shotCd=(autoBlast?.15:(blast?.9:.15))/(m.fireRate*fireEffect);if(blast&&!autoBlast)m.blastCd=3.8;
}

function dash(m,dx,dy){if(m.dashCd>0||state!=='battle'||!m.alive)return;const n=norm(dx,dy),power=m.dashPower||820;m.vx=n.x*power;m.vy=n.y*power;m.dashT=.16;m.dashCd=m.dashBase||1.65;m.inv=.18;ring(m.x,m.y,m.color,55);sfx('dash');}
function updatePlayer(dt){
 let dx=(keys.d?1:0)-(keys.a?1:0),dy=(keys.s?1:0)-(keys.w?1:0);
 const b2=enemies.find(e=>e.alive&&e.boss2);
 if(b2&&b2.auraEffect===1&&Math.hypot(player.x-b2.x,player.y-b2.y)<=b2.auraRadius){dx*=-1;dy*=-1;}
 if(dx||dy){const n=norm(dx,dy);dx=n.x;dy=n.y;}
 if(keys[' ']&&player.dashCd<=0)dash(player,dx||Math.cos(player.aim),dy||Math.sin(player.aim));
 const sp=player.speed*(player.effect==='speedBuff'?player.effectMul:(player.effect==='speedDebuff'?player.effectMul:1))*((player.excaliburT||0)>0?1.125:1)*boss2AuraSpeedMult(player);
 if(player.dashT<=0){player.vx=lerp(player.vx,dx*sp,1-Math.exp(-dt*11));player.vy=lerp(player.vy,dy*sp,1-Math.exp(-dt*11));}
 const aimTarget=(player.forcedAimT||0)>0?{x:player.forcedAimX,y:player.forcedAimY}:mouse;
 player.aim=Math.atan2(aimTarget.y-player.y,aimTarget.x-player.x);
 if(mouse.down&&player.shotCd<=0){
   const specialLocked=(player.specialLockT||0)>0;
   let autoBlast=false,autoHoming=false;
   if(!specialLocked){
     player.basicShotCount++;player.homingShotCount++;
     const ni=player.novaEvery||novaInterval(run),hi=player.homingEvery||homingInterval(run);
     autoBlast=ni>0&&player.basicShotCount%ni===0;autoHoming=hi>0&&player.homingShotCount%hi===0;
   }
   fire(player,aimTarget,autoBlast,autoBlast,autoHoming);
 }
}
function livingPlayers(){return [player,remotePlayer].filter(x=>x&&x.alive);}
function nearestLivingPlayer(m){let best=player,bd=1e18;for(const p of livingPlayers()){const d=Math.hypot(p.x-m.x,p.y-m.y);if(d<bd){bd=d;best=p;}}return best||player;}
function chooseCombatTarget(m,dt){
 const alive=livingPlayers();
 if(!alive.length)return player;
 const multi=multiplayer.enabled&&multiplayer.mode==='coop'&&multiplayer.players>=2&&alive.length>1;
 if(!multi){
   m.combatTarget=alive[0];
   m.targetLockT=0;
   return m.combatTarget;
 }
 let nearest=alive[0],nearestD=Math.hypot(nearest.x-m.x,nearest.y-m.y);
 for(let i=1;i<alive.length;i++){
   const d=Math.hypot(alive[i].x-m.x,alive[i].y-m.y);
   if(d<nearestD){nearest=alive[i];nearestD=d;}
 }
 let cur=m.combatTarget;
 if(!cur||!cur.alive||!alive.includes(cur)){
   cur=nearest;
   m.targetLockT=rand(1.5,2.0);
 }else{
   m.targetLockT=Math.max(0,(m.targetLockT||0)-dt);
   const curD=Math.hypot(cur.x-m.x,cur.y-m.y);
   // Avoid rapid ping-pong: switch early only if the other player is at least 25% closer.
   if(nearest!==cur&&nearestD<curD*.75){
     cur=nearest;
     m.targetLockT=rand(1.5,2.0);
   }else if(m.targetLockT<=0){
     cur=nearest;
     m.targetLockT=rand(1.5,2.0);
   }
 }
 m.combatTarget=cur;
 return cur;
}
function boss2AuraSpeedMult(m){return 1;}

function updateRemoteControlled(m,dt){
 if(!m||!m.alive)return;let dx=net.input.dx||0,dy=net.input.dy||0;
 const b2=enemies.find(e=>e.alive&&e.boss2);
 if(b2&&b2.auraEffect===1&&Math.hypot(m.x-b2.x,m.y-b2.y)<=b2.auraRadius){dx*=-1;dy*=-1;}
 if(dx||dy){const n=norm(dx,dy);dx=n.x;dy=n.y;}
 m.aim=(m.forcedAimT||0)>0?Math.atan2(m.forcedAimY-m.y,m.forcedAimX-m.x):(Number.isFinite(net.input.aim)?net.input.aim:m.aim);
 if(net.input.dash&&m.dashCd<=0){dash(m,dx||Math.cos(m.aim),dy||Math.sin(m.aim));net.input.dash=false;}
 const sp=m.speed*(m.effect==='speedBuff'?m.effectMul:(m.effect==='speedDebuff'?m.effectMul:1))*((m.excaliburT||0)>0?1.125:1)*boss2AuraSpeedMult(m);
 if(m.dashT<=0){m.vx=lerp(m.vx,dx*sp,1-Math.exp(-dt*11));m.vy=lerp(m.vy,dy*sp,1-Math.exp(-dt*11));}
 if(net.input.fire&&m.shotCd<=0){const specialLocked=(m.specialLockT||0)>0;let autoBlast=false,autoHoming=false;if(!specialLocked){m.basicShotCount++;m.homingShotCount++;const ni=m.novaEvery||0,hi=m.homingEvery||0;autoBlast=ni>0&&m.basicShotCount%ni===0;autoHoming=hi>0&&m.homingShotCount%hi===0;}fire(m,{x:m.x+Math.cos(m.aim)*700,y:m.y+Math.sin(m.aim)*700},autoBlast,autoBlast,autoHoming);}
}
function localInputPacket(){let dx=(keys.d?1:0)-(keys.a?1:0),dy=(keys.s?1:0)-(keys.w?1:0);return{type:'input',dx,dy,aim:player?Math.atan2(mouse.y-player.y,mouse.x-player.x):0,fire:mouse.down,dash:!!keys[' ']};}
function wsSend(obj){if(net.ws&&net.ws.readyState===1)net.ws.send(JSON.stringify(obj));}