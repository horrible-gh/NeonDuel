function bossPatternBullet(m,a,speed,damage,blast=false,r=4){
 bullets.push({
  x:m.x+Math.cos(a)*(m.r+10),y:m.y+Math.sin(a)*(m.r+10),
  vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r,life:9999,owner:m,damage,
  color:m.color,blast,pulse:Math.random()*10,homingT:0,persistent:true
 });
}
function bossExplosive64(m){sfx('bossWarn');
 for(let i=0;i<64;i++){const a=i/64*Math.PI*2+time*.08;bossPatternBullet(m,a,175,m.blastDamage*.62,true,7);}
 ring(m.x,m.y,'#ff6b8f',220);burst(m.x,m.y,'#ff6b8f',48,170);shake+=12;sfx('bossBurst');
}
function bossSpiral64x3(m){sfx('bossWarn');
 // 3-circle shot: three rotated expanding circles. Stronger than normal fire.
 for(let turn=0;turn<3;turn++){
   const offset=turn*.17+time*.22;
   const speed=130+turn*38;
   for(let i=0;i<64;i++){
     const radial=i/64*Math.PI*2+offset;
     const travel=radial+.38;
     bullets.push({
       x:m.x+Math.cos(radial)*(m.r+10),y:m.y+Math.sin(radial)*(m.r+10),
       vx:Math.cos(travel)*speed,vy:Math.sin(travel)*speed,r:4,life:9999,
       owner:m,damage:m.damage*1.35,color:'#ff73cf',blast:false,pulse:Math.random()*10,
       homingT:0,persistent:true
     });
   }
 }
 ring(m.x,m.y,'#ff73cf',260);shake+=9;sfx('bossBurst');
}
function bossMultiSpeed128(m){sfx('bossWarn');
 // Fake 4-whirl shot: four speed bands create the illusion of four rotating arms.
 const speeds=[125,185,255,335];
 for(let i=0;i<128;i++){
   const a=i/128*Math.PI*2+time*.11;
   const sp=speeds[i%speeds.length];
   bossPatternBullet(m,a,sp,m.damage*1.25,false,4);
 }
 ring(m.x,m.y,'#ffb36c',250);shake+=10;sfx('bossBurst');
}
function startTrueWhirl(m,mini=false){
 if(m.trueWhirl)return;
 const stepDeg=mini?rand(6,8):360/64;
 const turns=mini?2:(Math.random()<.5?2:3);
 m.trueWhirl={
   angle:time*.19,
   step:stepDeg*Math.PI/180,
   shots:0,
   maxShots:Math.ceil((360/stepDeg)*turns),
   shotGap:mini?.024:.018,
   shotT:0,
   speed:mini?245:285,
   damage:m.damage*(mini?1.22:1.55),
   color:mini?'#ff78e7':'#ffdc73',
   mini
 };
 m.burstCd=999;
 sfx('bossWarn');ring(m.x,m.y,m.trueWhirl.color,mini?165:235);
}
function updateTrueWhirl(m,dt){
 const w=m.trueWhirl;if(!w)return false;
 w.shotT-=dt;
 // Catch up if a frame is late, but cap the work per frame.
 let emitted=0;
 while(w.shotT<=0&&w.shots<w.maxShots&&emitted<5){
   const a=w.angle+w.step*w.shots;
   bossPatternBullet(m,a,w.speed,w.damage,false,w.mini?4:5);
   if(w.shots%12===0)burst(m.x+Math.cos(a)*(m.r+10),m.y+Math.sin(a)*(m.r+10),w.color,5,75);
   w.shots++;w.shotT+=w.shotGap;emitted++;
 }
 if(w.shots>=w.maxShots){
   const mini=w.mini;m.trueWhirl=null;
   ring(m.x,m.y,w.color,mini?190:275);shake+=mini?6:10;sfx('bossBurst');
   m.burstCd=mini?4.4:Math.max(4.2,7.5-(m.bossPhase||0)*.6);
   return false;
 }
 return true;
}
function midBossExplosiveDouble32(m){sfx('bossWarn');
 const base=time*.09,twist=rand(6,8)*Math.PI/180;
 for(let wave=0;wave<2;wave++)for(let i=0;i<32;i++){
   const a=i/32*Math.PI*2+base+(wave?twist:0);
   bossPatternBullet(m,a,185,m.blastDamage*.48,true,6);
 }
 ring(m.x,m.y,'#ff6688',175);shake+=8;sfx('bossBurst');
}
function midBossCircle32x2(m){sfx('bossWarn');
 for(let turn=0;turn<2;turn++){
   const offset=turn*.22+time*.17,speed=150+turn*45;
   for(let i=0;i<32;i++){
     const radial=i/32*Math.PI*2+offset,travel=radial+.28;
     bullets.push({x:m.x+Math.cos(radial)*(m.r+9),y:m.y+Math.sin(radial)*(m.r+9),vx:Math.cos(travel)*speed,vy:Math.sin(travel)*speed,r:4,life:9999,owner:m,damage:m.damage*1.12,color:'#ff72c9',blast:false,pulse:Math.random()*10,homingT:0,persistent:true});
   }
 }
 ring(m.x,m.y,'#ff72c9',180);shake+=6;sfx('bossBurst');
}
function midBossFakeWhirl(m){sfx('bossWarn');
 const speeds=[145,215,295];
 for(let i=0;i<72;i++){
   const a=i/72*Math.PI*2+time*.13,sp=speeds[i%speeds.length];
   bossPatternBullet(m,a,sp,m.damage*1.08,false,4);
 }
 ring(m.x,m.y,'#ffb06d',185);shake+=6;sfx('bossBurst');
}

function shuffleBoss2AuraMap(previous=null){
 const a=[1,2,3,4];
 for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
 if(previous&&a.every((v,i)=>v===previous[i])){[a[0],a[1]]=[a[1],a[0]];}
 return a;
}
function spawnBoss2Purple(m){const a=Math.random()*Math.PI*2,sp=rand(55,90);pickups.push({type:'purple',x:m.x+Math.cos(a)*(m.r+18),y:m.y+Math.sin(a)*(m.r+18),r:19,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,spin:0,hp:125,maxHp:125});burst(m.x,m.y,'#bd6bff',18,120);}
function updateBoss2(m,dt){
 m.auraT-=dt;
 if(m.auraT<=0){
   m.auraIndex=(m.auraIndex+1)%4;
   m.auraEffect=m.auraMap[m.auraIndex];
   m.auraVisits[m.auraIndex]=(m.auraVisits[m.auraIndex]||0)+1;
   m.auraT=10;m.auraPulse=0;m.auraPulseT=.9;m.mouseSnapT=2;
   ring(m.x,m.y,m.auraColors[m.auraIndex],120);sfx('bossWarn');
 }
 if(m.auraPulseT>0){m.auraPulseT=Math.max(0,m.auraPulseT-dt);m.auraPulse=1-m.auraPulseT/.9;}
 const living=livingPlayers();
 const inside=living.filter(p=>Math.hypot(p.x-m.x,p.y-m.y)<=m.auraRadius);
 const outside=living.filter(p=>Math.hypot(p.x-m.x,p.y-m.y)>m.auraRadius);

 if(m.auraEffect===1||m.auraEffect===2){
   for(const p of inside){
     p.health=Math.max(0,p.health-1*dt);
     if(p.health<=0&&p.alive){p.alive=false;if(livingPlayers().length===0)endBattle(false);}
   }
   for(const p of outside){
     if((p.fireGrace||0)<=0){
       p.health=Math.max(0,p.health-1*dt);
       if(p.health<=0&&p.alive){p.alive=false;if(livingPlayers().length===0)endBattle(false);}
     }
   }
   if(m.auraEffect===2&&inside.length){
     m.mouseSnapT-=dt;
     if(m.mouseSnapT<=0){
       for(const p of inside){
         p.forcedAimT=.45;p.forcedAimX=m.x;p.forcedAimY=m.y;
         if(p===player){mouse.x=m.x;mouse.y=m.y;}
       }
       burst(m.x,m.y,'#9bc7ff',14,90);ring(m.x,m.y,'#9bc7ff',72);
       m.mouseSnapT=2;
     }
   }else if(m.auraEffect===2){
     m.mouseSnapT=2;
   }
 }else if(m.auraEffect===3){
   for(const p of outside){
     p.health=Math.max(0,p.health-1*dt);
     if(p.health<=0&&p.alive){p.alive=false;if(livingPlayers().length===0)endBattle(false);}
   }
 }else if(m.auraEffect===4){
   if(outside.length>0){
     m.purpleSpawnT-=dt;
     if(m.purpleSpawnT<=0){spawnBoss2Purple(m);m.purpleSpawnT=2;}
   }else if(inside.length>0){
     m.purpleSpawnT-=dt;
     if(m.purpleSpawnT<=0){spawnBoss2Purple(m);m.purpleSpawnT=3;}
   }else{
     m.purpleSpawnT=Math.min(m.purpleSpawnT,2);
   }

   for(const p of outside){
     p.health=Math.max(0,p.health-1*dt);
     if(p.health<=0&&p.alive){p.alive=false;if(livingPlayers().length===0)endBattle(false);}
   }
   for(const p of inside){
     if((p.fireGrace||0)<=0){
       p.health=Math.max(0,p.health-1*dt);
       if(p.health<=0&&p.alive){p.alive=false;if(livingPlayers().length===0)endBattle(false);}
     }
   }
 }
}

function updateBossPatterns(m,dt,d,targetPlayer){
 if(m.boss2){updateBoss2(m,dt);return;}
 m.burstCd-=dt;m.chargeCd-=dt;
 const whirling=updateTrueWhirl(m,dt);
 if(m.type==='boss'){
   const hp=m.health/m.maxHealth;
   m.bossPhase=hp<.25?3:hp<.5?2:hp<.72?1:0;
   if(!whirling&&m.burstCd<=0){
     const skill=m.bossSkillIndex%4;
     if(skill===0)bossExplosive64(m);
     else if(skill===1)bossSpiral64x3(m);
     else if(skill===2)bossMultiSpeed128(m);
     else startTrueWhirl(m,false);
     m.bossSkillIndex++;
     if(skill!==3)m.burstCd=Math.max(3.6,7.2-m.bossPhase*.65);
   }
 }else if(m.type==='midboss'&&!whirling&&m.burstCd<=0){
   if(run.stage>=15){
     const skill=m.bossSkillIndex%4;
     if(skill===0)midBossExplosiveDouble32(m);
     else if(skill===1)midBossCircle32x2(m);
     else if(skill===2)midBossFakeWhirl(m);
     else startTrueWhirl(m,true);
     m.bossSkillIndex++;
     if(skill!==3)m.burstCd=4.2;
   }else{
     // Stage 5 guardian keeps the original introductory pattern.
     for(let i=0;i<64;i++){
       const a=i/64*Math.PI*2+time*.08;
       bossPatternBullet(m,a,235,m.damage*.52,false,4);
     }
     ring(m.x,m.y,m.color,170);
     m.burstCd=4.2;
   }
 }
 if(!m.trueWhirl&&m.chargeCd<=0&&d>180){
   const target=targetPlayer||chooseCombatTarget(m,0);
   dash(m,target.x-m.x,target.y-m.y);
   m.chargeCd=m.type==='boss'?Math.max(1.8,4.5-m.bossPhase*.5):5.2;
 }
}
function moveMage(m,dt){if(!m.alive)return;m.x+=m.vx*dt;m.y+=m.vy*dt;const ab=arenaBounds();m.x=clamp(m.x,ab.left+arena.pad,ab.right-arena.pad);m.y=clamp(m.y,ab.top+arena.pad,ab.bottom-arena.pad);for(const o of obstacles){if(o.dead)continue;if(circleRect(m.x,m.y,m.r,o)){const dx=m.x-o.x,dy=m.y-o.y;if(Math.abs(dx/o.w)>Math.abs(dy/o.h)){m.x=o.x+Math.sign(dx||1)*(o.w/2+m.r+1);if(Math.sign(m.vx)===-Math.sign(dx||1))m.vx=0;}else{m.y=o.y+Math.sign(dy||1)*(o.h/2+m.r+1);if(Math.sign(m.vy)===-Math.sign(dy||1))m.vy=0;}}}m.shotCd=Math.max(0,m.shotCd-dt);m.blastCd=Math.max(0,m.blastCd-dt);m.dashCd=Math.max(0,m.dashCd-dt);m.dashT=Math.max(0,m.dashT-dt);m.inv=Math.max(0,m.inv-dt);m.shieldRechargeDelay=Math.max(0,(m.shieldRechargeDelay||0)-dt);m.tempShieldT=Math.max(0,(m.tempShieldT||0)-dt);if(m.tempShieldT<=0)m.tempShield=0;if(m.maxShield>0&&m.shield<m.maxShield&&m.shieldRechargeDelay<=0&&m.shieldRegen>0)m.shield=Math.min(m.maxShield,m.shield+m.shieldRegen*dt);m.effectT=Math.max(0,m.effectT-dt);
 m.attackDebuffT=Math.max(0,(m.attackDebuffT||0)-dt);if(m.attackDebuffT<=0)m.attackDebuffMul=1;
 m.specialLockT=Math.max(0,(m.specialLockT||0)-dt);
 m.invisibleEnemyT=Math.max(0,(m.invisibleEnemyT||0)-dt);m.forcedAimT=Math.max(0,(m.forcedAimT||0)-dt);m.fireGrace=Math.max(0,(m.fireGrace||0)-dt);
 m.excaliburT=Math.max(0,(m.excaliburT||0)-dt);
 if((m.fortressShieldDecay||0)>0&&m.maxShield>0&&m.shield>m.maxShield){
   const excess=m.shield-m.maxShield;
   const decay=Math.max(m.maxShield*.06,excess*.18)*dt;
   m.shield=Math.max(m.maxShield,m.shield-decay);
   if(m.shield<=m.maxShield+.01)m.fortressShieldDecay=0;
 }
 if((m.deferredDebuffT||0)>0){
   m.deferredDebuffT=Math.max(0,m.deferredDebuffT-dt);
   if(m.deferredDebuffT<=0){
     const stacks=Math.max(1,m.deferredDebuffStacks||1);
     m.deferredDebuffStacks=0;
     for(let i=0;i<stacks;i++)applyRandomDebuff(m,false);
     burst(m.x,m.y,'#ff9b3d',36,220);ring(m.x,m.y,'#ff9b3d',110);
   }
 }
 if(m.effectT<=0){m.effect=null;m.effectMul=1;}
 if(m.dashT>0)particles.push({x:m.x,y:m.y,vx:rand(-25,25),vy:rand(-25,25),life:.28,color:m.color,size:rand(5,10)});}
