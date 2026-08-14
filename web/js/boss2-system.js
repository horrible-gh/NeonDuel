// Boss 2 ruleset. Loaded after the legacy gameplay modules so Stage 20 behavior
// lives in one place without changing other stages.
(function(){
 const baseSpawnEnemy=spawnEnemy;
 const baseFire=fire;
 const baseDamageMage=damageMage;
 const baseUpdateBullets=updateBullets;
 const baseUpdatePickups=updatePickups;
 const baseDrawMage=drawMage;
 const baseDrawBullet=drawBullet;
 const basePlainMage=plainMage;
 const baseApplyEffect=applyEffect;
 const baseApplyRandomDebuff=applyRandomDebuff;

 function b2(){return enemies.find(e=>e.alive&&e.boss2);}
 function shuffled4(){const a=[1,2,3,4];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 function insideAura(m,b){return !!(m&&b&&Math.hypot(m.x-b.x,m.y-b.y)<=b.auraRadius);}
 function orbReaction(b){return b&&b.boss2Mode==='orb'?b.boss2OrbMap?.[b.auraIndex]||0:0;}
 function specialReaction(b){return b&&b.boss2Mode==='special'?b.boss2SpecialMap?.[b.auraIndex]||0:0;}
 function orbItemMul(item){return item===2?rand(.70,1.10):item===3?rand(.60,1.20):item===4?rand(.50,1.30):1;}
 function rollOrbItem(b){b.boss2OrbItem=1+Math.floor(Math.random()*4);b.boss2OrbItemMul=orbItemMul(b.boss2OrbItem);}
 function killPlayerIfNeeded(p){if(p.health<=0&&p.alive){p.health=0;p.alive=false;if(livingPlayers().length===0)endBattle(false);}}
 function reflectToPlayer(p,amount){p.health=Math.max(0,p.health-amount);killPlayerIfNeeded(p);}
 function addBoss2ItemHpPenalty(m,before){
  if(run.stage!==20||!m||!m.alive)return;
  const lost=before-m.health;
  if(Math.abs(lost-10)<.001){m.health=Math.max(0,m.health-5);killPlayerIfNeeded(m);}
 }

 function initBoss2(b){
  b.auraEffect=0; // disables the retired fixed-color gimmicks in legacy code
  b.auraIndex=0;b.auraT=10;b.auraPulse=0;b.auraPulseT=.9;
  b.boss2SpecialMap=shuffled4();
  b.boss2OrbMap=shuffled4();
  b.boss2Mode=null;b.boss2ModeT=0;
  b.boss2OrbItem=0;b.boss2OrbItemMul=1;
  b.boss2RapidT=0;b.purpleSpawnT=3;
 }

 spawnEnemy=function(type,index,total){
  const m=baseSpawnEnemy(type,index,total);
  if(m&&m.boss2)initBoss2(m);
  return m;
 };

 applyEffect=function(m,isBuff){
  const before=m?.health??0;
  const result=baseApplyEffect(m,isBuff);
  if(!isBuff)addBoss2ItemHpPenalty(m,before);
  return result;
 };
 applyRandomDebuff=function(m,allowDeferred=true){
  const before=m?.health??0;
  const result=baseApplyRandomDebuff(m,allowDeferred);
  addBoss2ItemHpPenalty(m,before);
  return result;
 };

 spawnBoss2Purple=function(b,x=null,y=null){
  if(!b||!b.alive)return;
  const a=Math.random()*Math.PI*2,sp=rand(55,90);
  const px=x??(b.x+Math.cos(a)*(b.r+18)),py=y??(b.y+Math.sin(a)*(b.r+18));
  pickups.push({type:'purple',x:px,y:py,r:19,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,spin:0,hp:100,maxHp:100});
  burst(px,py,'#bd6bff',18,120);
 };

 boss2OnOrbDestroyed=function(owner){
  const b=b2();if(!b)return;
  if(Math.random()<.5){
   b.boss2Mode='special';b.boss2ModeT=10;b.boss2OrbItem=0;b.boss2OrbItemMul=1;
  }else{
   b.boss2Mode='orb';b.boss2ModeT=10;rollOrbItem(b);
  }
  ring(b.x,b.y,b.auraColors[b.auraIndex],100);sfx('bossWarn');
 };

 updateBoss2=function(b,dt){
  b.auraEffect=0;
  b.auraT-=dt;
  if(b.auraT<=0){
   b.auraIndex=(b.auraIndex+1)%4;b.auraT=10;b.auraPulse=0;b.auraPulseT=.9;
   b.purpleSpawnT=Math.min(b.purpleSpawnT||3,3);
   ring(b.x,b.y,b.auraColors[b.auraIndex],120);sfx('bossWarn');
  }
  if(b.auraPulseT>0){b.auraPulseT=Math.max(0,b.auraPulseT-dt);b.auraPulse=1-b.auraPulseT/.9;}
  b.boss2RapidT=Math.max(0,(b.boss2RapidT||0)-dt);

  const noPlayerFade=b.boss2Mode==='orb'&&orbReaction(b)===2;
  for(const p of livingPlayers()){
   if(noPlayerFade){p.boss2FadeAlpha=1;continue;}
   p.boss2FadeAlpha=clamp((p.boss2FadeAlpha??1)+(insideAura(p,b)?-dt:dt),0,1);
  }

  if((b.boss2ModeT||0)>0){
   b.boss2ModeT=Math.max(0,b.boss2ModeT-dt);
   if(b.boss2ModeT<=0){
    if(b.boss2Mode==='special'){
     b.boss2Mode='orb';b.boss2ModeT=10;rollOrbItem(b);
    }else{
     b.boss2Mode=null;b.boss2OrbItem=0;b.boss2OrbItemMul=1;
    }
   }
  }

  const stopSpawn=b.boss2Mode==='special'||(b.boss2Mode==='orb'&&orbReaction(b)===2);
  if(!stopSpawn){
   b.purpleSpawnT=(b.purpleSpawnT||3)-dt;
   if(b.purpleSpawnT<=0){spawnBoss2Purple(b);b.purpleSpawnT=3;}
  }else b.purpleSpawnT=Math.min(b.purpleSpawnT||3,3);
 };

 boss2AuraSpeedMult=function(m){
  const b=b2();if(!b||!m||!m.alive)return 1;
  if(b.boss2Mode==='orb'&&insideAura(m,b)&&orbReaction(b)===4)return 0;
  if(b.boss2Mode==='orb'&&b.boss2OrbItem===3)return b.boss2OrbItemMul||1;
  return 1;
 };
 function playerFireMul(){const b=b2();return b&&b.boss2Mode==='orb'&&b.boss2OrbItem===2?(b.boss2OrbItemMul||1):1;}
 function playerProjectileMul(){const b=b2();return b&&b.boss2Mode==='orb'&&b.boss2OrbItem===4?(b.boss2OrbItemMul||1):1;}

 fire=function(m,target,blast=false,autoBlast=false,autoHoming=false){
  const before=bullets.length;
  baseFire(m,target,blast,autoBlast,autoHoming);
  if(bullets.length<=before)return;
  const bullet=bullets[bullets.length-1],b=b2();
  const playerShot=m===player||m===remotePlayer;
  bullet.playerShot=playerShot;

  if(playerShot){
   const fm=playerFireMul();if(fm!==1)m.shotCd/=fm;
   const pm=playerProjectileMul();if(pm!==1){bullet.vx*=pm;bullet.vy*=pm;}
   const special3=!!(b&&insideAura(m,b)&&b.boss2Mode==='special'&&specialReaction(b)===3);
   if(special3){
    const cur=Math.max(1,Math.hypot(bullet.vx,bullet.vy)),want=m.projectile*pm,scale=want/cur;
    bullet.vx*=scale;bullet.vy*=scale;bullet.r=4;bullet.blast=false;bullet.homingT=8;
    bullet.color='#d8f5ff';bullet.boss2VisibleInAura=true;bullet.boss2Special3=true;
   }else bullet.boss2VisibleInAura=false;
  }else if(m.boss2){
   // Stage 20 is normally 75% of the old firing rate; orb-reaction 3 raises it to 200%.
   m.shotCd*=((m.boss2RapidT||0)>0?.5:(4/3));
  }
 };

 damageMage=function(m,damage,bullet){
  if(!(m&&m.boss2&&bullet&&(bullet.owner===player||bullet.owner===remotePlayer)))return baseDamageMage(m,damage,bullet);
  const src=bullet.owner,inside=insideAura(src,m),mode=m.boss2Mode;
  const special=inside&&mode==='special'?specialReaction(m):0;
  const orb=inside&&mode==='orb'?orbReaction(m):0;
  const bonus=mode==='orb'&&m.boss2OrbItem===1?1:0;
  let dealt=inside?1+bonus:1;

  if(special===2){
   m.health=Math.min(m.maxHealth,m.health+10);
   burst(bullet.x,bullet.y,'#58ff89',12,120);ring(m.x,m.y,'#58ff89',44);sfx('hit');
   return true;
  }
  if(special===1)reflectToPlayer(src,dealt);
  else if(special===3){dealt=777;src.health=Math.min(src.maxHealth,src.health+2);src.boss2FadeAlpha=1;bullet.boss2VisibleInAura=true;}
  else if(special===4)spawnBoss2Purple(m,bullet.x,bullet.y);
  else if(orb===1)reflectToPlayer(src,dealt);
  else if(orb===2){dealt=444;src.health=Math.min(src.maxHealth,src.health+(m.boss2OrbItem===1?2:1));}
  else if(orb===3)m.boss2RapidT=.25;

  const oldElite=src.eliteMult;src.eliteMult=1;
  const oldAuraShot=bullet.boss2AuraShot,oldAura4=bullet.boss2Aura4Normal;
  bullet.boss2AuraShot=false;bullet.boss2Aura4Normal=false;
  const result=baseDamageMage(m,dealt*1000,bullet);
  src.eliteMult=oldElite;bullet.boss2AuraShot=oldAuraShot;bullet.boss2Aura4Normal=oldAura4;
  return result;
 };

 updatePickups=function(dt){
  if(run.stage===20){
   for(let i=pickups.length-1;i>=0;i--){
    const p=pickups[i];if(p.type!=='purple')continue;
    for(const target of livingPlayers()){
     if(Math.hypot(p.x-target.x,p.y-target.y)<p.r+target.r){
      target.health=Math.max(0,target.health-10);
      burst(target.x,target.y,'#bd6bff',22,150);ring(target.x,target.y,'#bd6bff',72);shake+=4;sfx('debuff');
      pickups.splice(i,1);killPlayerIfNeeded(target);break;
     }
    }
   }
  }
  baseUpdatePickups(dt);
 };

 updateBullets=function(dt){
  const before=pickups.filter(p=>p.type==='purple');
  baseUpdateBullets(dt);
  for(const p of before){
   if((p.hp||0)<=0&&!pickups.includes(p))boss2OnOrbDestroyed(null);
  }
 };

 drawMage=function(m){
  if(!m||!m.alive)return;
  const alpha=clamp(m.boss2FadeAlpha??1,0,1);
  if(alpha>=.999){baseDrawMage(m);return;}
  ctx.save();
  ctx.globalAlpha=alpha;
  // Draw a simplified but identical silhouette while fading so no internal alpha reset leaks through.
  ctx.translate(m.x,m.y);ctx.rotate(m.aim);ctx.shadowBlur=m.type==='boss'?40:24;ctx.shadowColor=m.color;ctx.strokeStyle=m.color;ctx.fillStyle='rgba(10,14,30,.95)';ctx.lineWidth=m.type==='boss'?4:3;
  const sides=m.type==='boss'?8:6;ctx.beginPath();for(let i=0;i<sides;i++){const a=i*Math.PI*2/sides,r=m.r*(i%2?.78:1),x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(m.r*.45,-m.r*.25);ctx.lineTo(m.r*1.55,0);ctx.lineTo(m.r*.45,m.r*.25);ctx.closePath();ctx.fillStyle=m.color;ctx.fill();ctx.restore();
 };

 drawBullet=function(bullet){
  const b=b2();
  if(bullet&&bullet.playerShot&&b&&!bullet.boss2VisibleInAura&&Math.hypot(bullet.x-b.x,bullet.y-b.y)<=b.auraRadius)return;
  baseDrawBullet(bullet);
 };

 plainMage=function(m){
  const o=basePlainMage(m);if(!o)return o;
  for(const k of ['boss2FadeAlpha','boss2SpecialMap','boss2OrbMap','boss2Mode','boss2ModeT','boss2OrbItem','boss2OrbItemMul','boss2RapidT'])o[k]=m[k];
  return o;
 };

 netSendSnapshot=function(force=false){
  if(net.role!=='host'||!net.connected)return;if(!force&&net.snapT<.05)return;net.snapT=0;
  wsSend({type:'snapshot',mode:multiplayer.mode,state,time,stage:run.stage,credits:run.credits,peerCredits:peerProfile.credits,p1:plainMage(player),p2:plainMage(remotePlayer),enemies:enemies.map(plainMage),bullets:bullets.map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy,r:b.r,color:b.color,blast:b.blast,pulse:b.pulse,playerShot:b.playerShot,boss2VisibleInAura:b.boss2VisibleInAura})),pickups:pickups.map(p=>({type:p.type,x:p.x,y:p.y,r:p.r,spin:p.spin,hp:p.hp,maxHp:p.maxHp})),obstacles:obstacles.map(o=>({x:o.x,y:o.y,w:o.w,h:o.h,hp:o.hp,maxHp:o.maxHp,kind:o.kind,dead:o.dead})),battleEnded});
 };
})();