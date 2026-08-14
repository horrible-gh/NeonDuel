function safeSpawn(radius=24){for(let tries=0;tries<80;tries++){const ab=arenaBounds(),x=rand(ab.left+arena.pad+radius,ab.right-arena.pad-radius),y=rand(ab.top+arena.pad+radius,ab.bottom-arena.pad-radius);if(livingPlayers().some(p=>Math.hypot(x-p.x,y-p.y)<150)||enemies.some(e=>e.alive&&Math.hypot(x-e.x,y-e.y)<120))continue;if(obstacles.some(o=>!o.dead&&circleRect(x,y,radius+8,o)))continue;return{x,y};}const ab=arenaBounds();return{x:(ab.left+ab.right)/2,y:(ab.top+ab.bottom)/2};}
function isActiveMultiplayer(){return multiplayer.enabled&&multiplayer.players>=2;}
function nextBlueSpawn(){return isActiveMultiplayer()?rand(4,6):rand(8,12);}
function redOrbCap(){const ab=arenaBounds(),usableW=Math.max(320,ab.w-arena.pad*2),usableH=Math.max(240,ab.h-arena.pad*2);return clamp(Math.round((usableW*usableH)/260000)+2,4,11);}
function makeRedOrb(x,y){
 const deg=rand(15,45),a=deg*Math.PI/180,sx=Math.random()<.5?-1:1,sy=Math.random()<.5?-1:1,speed=rand(105,140);
 return{type:'red',x,y,r:22,vx:Math.cos(a)*speed*sx,vy:Math.sin(a)*speed*sy,spin:0,hit:new WeakSet()};
}
function spawnRed(){
 if(pickups.filter(p=>p.type==='red').length+redRespawns.length>=redOrbCap())return;
 const p=safeSpawn(22);pickups.push(makeRedOrb(p.x,p.y));
}
function respawnRedBehindPlayer(){
 if(!player||!player.alive)return;
 const ab=arenaBounds(),base=player.aim+Math.PI;
 let pos=null;
 for(let tries=0;tries<14;tries++){
   const a=base+rand(-.42,.42),d=rand(115,165);
   const x=clamp(player.x+Math.cos(a)*d,ab.left+arena.pad+24,ab.right-arena.pad-24);
   const y=clamp(player.y+Math.sin(a)*d,ab.top+arena.pad+24,ab.bottom-arena.pad-24);
   if(Math.hypot(x-player.x,y-player.y)<95)continue;
   if(obstacles.some(o=>!o.dead&&circleRect(x,y,30,o)))continue;
   pos={x,y};break;
 }
 if(!pos)pos=safeSpawn(22);
 const orb=makeRedOrb(pos.x,pos.y);
 const toward=norm(player.x-pos.x,player.y-pos.y);
 const speed=rand(110,145);
 orb.vx=toward.x*speed+rand(-28,28);
 orb.vy=toward.y*speed+rand(-28,28);
 pickups.push(orb);
 burst(pos.x,pos.y,'#ff405f',18,125);ring(pos.x,pos.y,'#ff405f',58);
}
function spawnBlue(){
 if(run.stage===20)return;
 if(pickups.some(p=>p.type==='blue'||p.type==='excalibur'||p.type==='fortress'))return;
 const p=safeSpawn(22);
 const bigBoss=stageType(run.stage)==='bigBoss';
 if(bigBoss){
   const fortressEligible=player&&player.alive&&player.health/player.maxHealth<=.50;
   const r=Math.random();
   if(fortressEligible&&r<.18){pickups.push({type:'fortress',x:p.x,y:p.y,r:24,vx:0,vy:0,spin:0});return;}
   if(r<(fortressEligible?.36:.22)){pickups.push({type:'excalibur',x:p.x,y:p.y,r:24,vx:0,vy:0,spin:0});return;}
 }
 pickups.push({type:'blue',x:p.x,y:p.y,r:22,vx:0,vy:0,spin:0});
}
function spawnBossHeals(){if(run.stage===20||bossHealCooldown>0)return;const low=livingPlayers().filter(p=>p.health/p.maxHealth<=.33),existing=pickups.filter(p=>p.type==='green').length,need=Math.max(0,low.length-existing);for(let i=0;i<need;i++){const p=safeSpawn(24);pickups.push({type:'green',x:p.x,y:p.y,r:24,vx:0,vy:0,spin:0});}if(need>0)bossHealCooldown=5;}
function applyRandomDebuff(m,allowDeferred=true){if(m!==player&&m!==remotePlayer)return;
 const types=['speed','fire','hp','attack','shieldBreak','invisible'];
 if(run.stage>=4)types.push('specialLock');
 const type=types[Math.floor(Math.random()*types.length)];
 if(type==='speed'){
   m.effect='speedDebuff';m.effectMul=rand(.10,.50);m.effectT=rand(2,4);
 }else if(type==='fire'){
   m.effect='fireDebuff';m.effectMul=rand(.10,.50);m.effectT=rand(2,5);
 }else if(type==='hp'){
   m.health=Math.max(0,m.health-m.maxHealth*.10);
   burst(m.x,m.y,'#ff405f',18,130);ring(m.x,m.y,'#ff405f',58);
   if(m.health<=0){m.alive=false;endBattle(false);}
 }else if(type==='attack'){
   m.attackDebuffMul=.50;m.attackDebuffT=rand(3,5);
 }else if(type==='shieldBreak'){
   m.shield=0;m.tempShield=0;m.tempShieldT=0;
   burst(m.x,m.y,'#a65cff',24,160);ring(m.x,m.y,'#a65cff',75);sfx('shieldBreak');
 }else if(type==='invisible'){
   m.invisibleEnemyT=10;
 }else if(type==='specialLock'){
   m.specialLockT=rand(4,6);
 }
}
function applyEffect(m,isBuff){if(!isBuff&&m!==player&&m!==remotePlayer)return;
 if(isBuff){
   const healAvailable=run.stage>=6;
   const roll=Math.random();
   if(!healAvailable){
     if(roll<.25){m.effect='speedBuff';m.effectMul=2;m.effectT=rand(7,10);}
     else if(roll<.5){m.effect='fireBuff';m.effectMul=3;m.effectT=rand(2,4);}
     else if(roll<.75){const t=rand(1.5,2.5);m.effect='homingBuff';m.effectMul=1;m.effectT=t;m.homingBuffGuideT=t;}
     else{m.effect='shieldBuff';m.effectMul=1;m.effectT=rand(7,12);m.tempShield=m.maxHealth*.25;m.tempShieldT=m.effectT;}
   }else{
     if(roll<.20){m.effect='speedBuff';m.effectMul=2;m.effectT=rand(7,10);}
     else if(roll<.40){m.effect='fireBuff';m.effectMul=3;m.effectT=rand(2,4);}
     else if(roll<.60){const t=rand(1.5,2.5);m.effect='homingBuff';m.effectMul=1;m.effectT=t;m.homingBuffGuideT=t;}
     else if(roll<.80){m.effect='shieldBuff';m.effectMul=1;m.effectT=rand(7,12);m.tempShield=m.maxHealth*.25;m.tempShieldT=m.effectT;}
     else{m.health=Math.min(m.maxHealth,m.health+m.maxHealth*.10);burst(m.x,m.y,'#58ff89',28,180);ring(m.x,m.y,'#58ff89',86);sfx('heal');}
   }
 }else{
   // While under deferred sentence, EVERY additional red pickup adds one stack.
   if((m.deferredDebuffT||0)>0){
     m.deferredDebuffStacks=(m.deferredDebuffStacks||1)+1;
     burst(m.x,m.y,'#ff9b3d',22,150);ring(m.x,m.y,'#ff9b3d',72);shake+=4;
     return;
   }
   const types=['speed','fire','hp','attack','shieldBreak','invisible','deferred'];
   if(run.stage>=4)types.push('specialLock');
   const type=types[Math.floor(Math.random()*types.length)];
   if(type==='speed'){m.effect='speedDebuff';m.effectMul=rand(.10,.50);m.effectT=rand(2,4);}
   else if(type==='fire'){m.effect='fireDebuff';m.effectMul=rand(.10,.50);m.effectT=rand(2,5);}
   else if(type==='hp'){
     m.health=Math.max(0,m.health-m.maxHealth*.10);
     if(m.health<=0){m.alive=false;endBattle(false);}
   }
   else if(type==='attack'){m.attackDebuffMul=.50;m.attackDebuffT=rand(3,5);}
   else if(type==='shieldBreak'){m.shield=0;m.tempShield=0;m.tempShieldT=0;sfx('shieldBreak');}
   else if(type==='invisible'){m.invisibleEnemyT=10;}
   else if(type==='specialLock'){m.specialLockT=rand(4,6);}
   else if(type==='deferred'){m.deferredDebuffStacks=1;m.deferredDebuffT=rand(5,10);}
 }
 burst(m.x,m.y,isBuff?'#55aaff':'#ff405f',28,190);
 ring(m.x,m.y,isBuff?'#55aaff':'#ff405f',80);shake+=5;sfx(isBuff?'buff':'debuff');
}
function updatePickups(dt){redSpawn-=dt;blueSpawn-=dt;
 for(let i=redRespawns.length-1;i>=0;i--){
   redRespawns[i]-=dt;
   if(redRespawns[i]<=0){redRespawns.splice(i,1);respawnRedBehindPlayer();}
 }bossHealCooldown=Math.max(0,bossHealCooldown-dt);const bossStage=stageType(run.stage)==='bigBoss'||stageType(run.stage)==='midBoss';const boss=enemies.find(e=>e.alive&&(e.type==='boss'||e.type==='midboss'));if(bossStage&&boss)spawnBossHeals();if(redSpawn<=0){spawnRed();redSpawn=pickups.filter(p=>p.type==='red').length<redOrbCap()?rand(2.2,3.4):rand(4,6);}if(blueSpawn<=0){spawnBlue();blueSpawn=nextBlueSpawn();}for(let i=pickups.length-1;i>=0;i--){const p=pickups[i];p.spin+=dt*3.5;if(p.type==='red'){p.x+=p.vx*dt;p.y+=p.vy*dt;const ab=arenaBounds();if(p.x-p.r<ab.left+arena.pad){p.x=ab.left+arena.pad+p.r;p.vx=Math.abs(p.vx);}if(p.x+p.r>ab.right-arena.pad){p.x=ab.right-arena.pad-p.r;p.vx=-Math.abs(p.vx);}if(p.y-p.r<ab.top+arena.pad){p.y=ab.top+arena.pad+p.r;p.vy=Math.abs(p.vy);}if(p.y+p.r>ab.bottom-arena.pad){p.y=ab.bottom-arena.pad-p.r;p.vy=-Math.abs(p.vy);}for(const o of obstacles){if(o.dead||!circleRect(p.x,p.y,p.r,o))continue;const dx=p.x-o.x,dy=p.y-o.y,px=o.w/2+p.r-Math.abs(dx),py=o.h/2+p.r-Math.abs(dy);if(px<py){p.x=o.x+Math.sign(dx||1)*(o.w/2+p.r+1);p.vx*=-1;}else{p.y=o.y+Math.sign(dy||1)*(o.h/2+p.r+1);p.vy*=-1;}break;}for(const target of livingPlayers()){
 if(!p.hit.has(target)&&Math.hypot(p.x-target.x,p.y-target.y)<p.r+target.r){
   applyEffect(target,false);redRespawns.push(rand(1.0,1.5));pickups.splice(i,1);continue;
 }
}}else if(p.type==='purple'){p.x+=(p.vx||0)*dt;p.y+=(p.vy||0)*dt;const ab=arenaBounds();if(p.x-p.r<ab.left+arena.pad||p.x+p.r>ab.right-arena.pad)p.vx*=-1;if(p.y-p.r<ab.top+arena.pad||p.y+p.r>ab.bottom-arena.pad)p.vy*=-1;p.x=clamp(p.x,ab.left+arena.pad+p.r,ab.right-arena.pad-p.r);p.y=clamp(p.y,ab.top+arena.pad+p.r,ab.bottom-arena.pad-p.r);for(const target of livingPlayers())if(Math.hypot(p.x-target.x,p.y-target.y)<p.r+target.r){applyEffect(target,false);pickups.splice(i,1);break;}
 }else if(p.type==='excalibur'){
   for(const target of livingPlayers())if(Math.hypot(p.x-target.x,p.y-target.y)<p.r+target.r){
     target.excaliburT=rand(8,12.5);burst(target.x,target.y,'#ffd86b',46,240);ring(target.x,target.y,'#ffd86b',125);sfx('buff');pickups.splice(i,1);blueSpawn=nextBlueSpawn();break;
   }
 }else if(p.type==='fortress'){
   for(const target of livingPlayers())if(Math.hypot(p.x-target.x,p.y-target.y)<p.r+target.r){
     if(target.maxShield>0){target.shield=Math.max(target.shield,target.maxShield*2);target.fortressShieldDecay=1;}
     target.health=Math.min(target.maxHealth*.75,target.health+target.maxHealth*.25);burst(target.x,target.y,'#76fff0',54,235);ring(target.x,target.y,'#76fff0',138);sfx('shield');pickups.splice(i,1);blueSpawn=nextBlueSpawn();break;
   }
 }else if(p.type==='green'){
   for(const target of livingPlayers())if(Math.hypot(p.x-target.x,p.y-target.y)<p.r+target.r){
     target.health=Math.min(target.maxHealth*.66,target.health+target.maxHealth*.33);burst(target.x,target.y,'#58ff89',40,220);ring(target.x,target.y,'#58ff89',110);sfx('heal');pickups.splice(i,1);break;
   }
 }else{for(const m of [player,remotePlayer,...enemies]){if(!m||!m.alive||m.type==='boss')continue;if(Math.hypot(p.x-m.x,p.y-m.y)<p.r+m.r){applyEffect(m,true);pickups.splice(i,1);blueSpawn=nextBlueSpawn();break;}}}}}
function evadeCheck(m){return Math.random()<m.evasion;}
function awardCredits(amount){run.credits+=amount;if(multiplayer.enabled&&net.role==='host'&&net.peer)peerProfile.credits+=amount;}
function damageMage(m,damage,b){
 if(!m.alive||m.inv>0)return false;if((m.invisibleEnemyT||0)>0)m.invisibleEnemyT=0;if(b&&b.owner&&(b.owner.invisibleEnemyT||0)>0)b.owner.invisibleEnemyT=0;
 if(evadeCheck(m)){burst(m.x,m.y,'#ffffff',7,90);ring(m.x,m.y,'#ffffff',38);return true;}
 let dealt;
 if((m===player||m===remotePlayer)&&b&&b.owner&&b.owner.boss2){
   m.shield=0;m.tempShield=0;m.tempShieldT=0;m.shieldRechargeDelay=3;
   dealt=b.blast?damage:1;
 }else if(m.boss2&&b&&(b.owner===player||b.owner===remotePlayer)){
   if(b.boss2AuraShot){
     dealt=777;
     const src=b.owner;
     src.health=Math.min(src.maxHealth,src.health+2);
   }else if(b.boss2Aura4Normal){
     dealt=444;
   }else{
     const elite=b.owner.eliteMult||1;
     dealt=Math.max(elite,damage*.001);
   }
 }else dealt=damage*(1-m.armor);
 if((m.tempShield||0)>0){const absorbed=Math.min(m.tempShield,dealt);m.tempShield-=absorbed;dealt-=absorbed;burst(b.x,b.y,'#b7f4ff',12,120);ring(m.x,m.y,'#b7f4ff',m.r+24);}
 if(dealt>0&&(m.shield||0)>0){const absorbed=Math.min(m.shield,dealt);m.shield-=absorbed;dealt-=absorbed;burst(b.x,b.y,'#7de7ff',10,110);ring(m.x,m.y,'#7de7ff',m.r+22);}
 m.shieldRechargeDelay=3;if(dealt>0)m.health-=dealt;
 if(m.boss2&&(m.auraEffect===1||m.auraEffect===2)&&b&&!b.boss2AuraShot&&!b.boss2Aura4Normal&&(b.owner===player||b.owner===remotePlayer)&&dealt>0){
   const src=b.owner;
   const reflected=Math.max(0,dealt);
   src.health=Math.max(0,src.health-reflected);
   if(src.health<=0&&src.alive){src.alive=false;if(livingPlayers().length===0)endBattle(false);}
 }
 if(m===player||(b&&b.owner===player))sfx('hit');m.inv=.055;burst(b.x,b.y,b.color,b.blast?26:12,b.blast?250:140);ring(b.x,b.y,b.color,b.blast?105:44);shake+=b.blast?11:4;
 if(m.health<=0){m.health=0;m.alive=false;burst(m.x,m.y,m.color,m.type==='boss'?150:m.type==='midboss'?100:70,m.type==='boss'?520:380);ring(m.x,m.y,m.color,m.type==='boss'?300:m.type==='midboss'?220:170);if(m===player||m===remotePlayer){if(multiplayer.mode==='vs'){endBattle(m===remotePlayer);}else if(livingPlayers().length===0)endBattle(false);}else{run.totalKills++;awardCredits(m.type==='boss'?195:m.type==='midboss'?78:10);if(enemies.every(e=>!e.alive))endBattle(true);}}
 return true;
}function explodeObstacle(o,b){if(o.dead)return;o.dead=true;const baseReward=o.kind==='reinforced'?15:o.kind==='explosive'?11:7;const wallRewardMult=1+Math.floor(run.stage/5)*.5;const reward=Math.round(baseReward*wallRewardMult);awardCredits(reward);burst(o.x,o.y,o.kind==='explosive'?'#ff6a58':'#758cff',o.kind==='explosive'?42:24,o.kind==='explosive'?320:180);ring(o.x,o.y,o.kind==='explosive'?'#ff765f':'#788cff',o.kind==='explosive'?135:85);if(o.kind==='explosive'){for(const m of [player,...enemies]){if(m.alive&&Math.hypot(m.x-o.x,m.y-o.y)<120)damageMage(m,18,{x:o.x,y:o.y,color:'#ff765f',blast:true});}}}
function updateBullets(dt){for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];b.life-=dt;
 if(b.homingT>0){b.homingT-=dt;let targets=[];if(b.owner===player||b.owner===remotePlayer){targets=multiplayer.mode==='vs'?(b.owner===player?[remotePlayer]:[player]):enemies.filter(e=>e.alive);}else targets=livingPlayers();targets=targets.filter(Boolean);let best=null,bd=220;const va=Math.atan2(b.vy,b.vx);for(const t of targets){const dx=t.x-b.x,dy=t.y-b.y,d=Math.hypot(dx,dy);if(d>=bd)continue;const da=Math.abs(Math.atan2(Math.sin(Math.atan2(dy,dx)-va),Math.cos(Math.atan2(dy,dx)-va)));if(da<Math.PI/4){best=t;bd=d;}}if(best){const sp=Math.hypot(b.vx,b.vy),desired=Math.atan2(best.y-b.y,best.x-b.x),cur=Math.atan2(b.vy,b.vx),delta=Math.atan2(Math.sin(desired-cur),Math.cos(desired-cur)),na=cur+clamp(delta,-2.4*dt,2.4*dt);b.vx=Math.cos(na)*sp;b.vy=Math.sin(na)*sp;}}
 b.x+=b.vx*dt;b.y+=b.vy*dt;b.pulse+=dt*12;const ab=arenaBounds();let dead=(!b.persistent&&b.life<=0)||b.x<ab.left||b.x>ab.right||b.y<ab.top||b.y>ab.bottom;
 if(!dead&&(b.owner===player||b.owner===remotePlayer)){for(let pi=pickups.length-1;pi>=0;pi--){const p=pickups[pi];if(p.type!=='purple')continue;if(Math.hypot(b.x-p.x,b.y-p.y)<b.r+p.r){p.hp-=Math.max(1,b.damage);burst(b.x,b.y,'#bd6bff',10,120);dead=true;if(p.hp<=0){burst(p.x,p.y,'#bd6bff',28,190);ring(p.x,p.y,'#bd6bff',70);pickups.splice(pi,1);}break;}}}
 if(!dead){for(const o of obstacles){if(o.dead)continue;if(b.x>o.x-o.w/2&&b.x<o.x+o.w/2&&b.y>o.y-o.h/2&&b.y<o.y+o.h/2){o.hp-=b.blast?34:8;burst(b.x,b.y,b.color,b.blast?22:8,b.blast?220:110);if(o.hp<=0)explodeObstacle(o,b);dead=true;break;}}}
 if(!dead){let targets;if(b.owner===player||b.owner===remotePlayer){targets=multiplayer.mode==='vs'?(b.owner===player?[remotePlayer]:[player]):enemies;}else targets=livingPlayers();for(const m of targets.filter(Boolean)){if(!m.alive||m===b.owner)continue;if(Math.hypot(b.x-m.x,b.y-m.y)<b.r+m.r){const eliteMult=((b.owner===player||b.owner===remotePlayer)&&(m.type==='midboss'||m.type==='boss')&&!m.boss2)?(b.owner.eliteMult||1):1;damageMage(m,b.damage*eliteMult,b);dead=true;break;}}}
 if(dead)bullets.splice(i,1);
}}
function endBattle(win){if(battleEnded)return;battleEnded=true;sfx(win?'victory':'defeat');state='result';
 const baseReward=stageType(run.stage)==='bigBoss'?260:stageType(run.stage)==='midBoss'?169:80;
 const rewardMult=1+Math.floor(run.stage/5)*.5;
 const fullReward=Math.round(baseReward*rewardMult);
 let hostReward=8,guestReward=8,guestWin=false;
 if(multiplayer.mode==='vs'){if(win){hostReward=fullReward;guestReward=8;guestWin=false;}else{hostReward=8;guestReward=fullReward;guestWin=true;}}
 else{hostReward=win?fullReward:8;guestReward=hostReward;guestWin=win;}
 run.credits+=hostReward;if(multiplayer.enabled&&net.role==='host'&&net.peer)peerProfile.credits+=guestReward;
 if(win){run.wins++;if(multiplayer.mode!=='vs')run.stage++;}else run.losses++;
 if(multiplayer.mode==='vs')run.stage++;
 run.maxStage=Math.max(run.maxStage,run.stage);saveState();
 const box=document.getElementById('resultBanner');document.getElementById('resultTitle').textContent=win?'VICTORY':'DEFEAT';
 document.getElementById('resultSub').textContent=`${win?'전투 보상':'회수 보상'} +${hostReward} CR · 현재 ${run.credits} CR`;
 if(multiplayer.enabled&&net.role==='host')wsSend({type:'roundEnd',localWin:guestWin,reward:guestReward,credits:peerProfile.credits,stage:run.stage,maxStage:run.stage,totalKills:run.totalKills});
 resetReadyState();box.classList.add('show');setTimeout(()=>{box.classList.remove('show');showShop();if(multiplayer.enabled&&net.role==='host'){wsSend({type:'mode',mode:multiplayer.mode,stage:run.stage,maxStage:run.maxStage});wsSend({type:'profile',profile:exportProfile()});}},1500);
}
