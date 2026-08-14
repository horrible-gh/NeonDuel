// Boss 2 targeted adjustments: immobilize/fade teleport and uniform ??? damage.
(function(){
 const baseUpdateBoss2=updateBoss2;
 const baseDamageMage=damageMage;

 function insideAura(p,b){return !!(p&&b&&Math.hypot(p.x-b.x,p.y-b.y)<=b.auraRadius);}
 function currentOrbReaction(b){return b?.boss2OrbMap?.[b.auraIndex]||0;}

 function teleportOutsideAura(p,b){
  let pos=null;
  for(let i=0;i<40;i++){
   const q=safeSpawn(p.r+8);
   if(Math.hypot(q.x-b.x,q.y-b.y)>b.auraRadius+p.r+20){pos=q;break;}
  }
  if(!pos){
   const ab=arenaBounds();
   const candidates=[
    {x:ab.left+arena.pad+p.r+20,y:ab.top+arena.pad+p.r+20},
    {x:ab.right-arena.pad-p.r-20,y:ab.top+arena.pad+p.r+20},
    {x:ab.left+arena.pad+p.r+20,y:ab.bottom-arena.pad-p.r-20},
    {x:ab.right-arena.pad-p.r-20,y:ab.bottom-arena.pad-p.r-20}
   ];
   pos=candidates.sort((a,c)=>Math.hypot(c.x-b.x,c.y-b.y)-Math.hypot(a.x-b.x,a.y-b.y))[0];
  }
  p.x=pos.x;p.y=pos.y;p.vx=0;p.vy=0;
 }

 updateBoss2=function(b,dt){
  baseUpdateBoss2(b,dt);
  if(!b||!b.alive||b.boss2Mode!=='orb'||currentOrbReaction(b)!==4)return;
  for(const p of livingPlayers()){
   const active=insideAura(p,b);
   if(!active){p.boss2TeleportLatch=false;continue;}
   if((p.boss2FadeAlpha??1)<=0&&!p.boss2TeleportLatch){
    p.boss2TeleportLatch=true;
    teleportOutsideAura(p,b);
   }
  }
 };

 function finishBoss2Hit(m,bullet){
  if(m===player||(bullet&&bullet.owner===player))sfx('hit');
  m.inv=.055;
  burst(bullet.x,bullet.y,bullet.color,bullet.blast?26:12,bullet.blast?250:140);
  ring(bullet.x,bullet.y,bullet.color,bullet.blast?105:44);
  shake+=bullet.blast?11:4;
  if(m.health>0)return true;
  m.health=0;m.alive=false;
  burst(m.x,m.y,m.color,150,520);ring(m.x,m.y,m.color,300);
  run.totalKills++;awardCredits(195);
  if(enemies.every(e=>!e.alive))endBattle(true);
  return true;
 }

 damageMage=function(m,damage,bullet){
  if(m&&m.boss2&&m.boss2Mode==='special'&&bullet&&(bullet.owner===player||bullet.owner===remotePlayer)){
   if(!m.alive)return false;
   if((m.invisibleEnemyT||0)>0)m.invisibleEnemyT=0;
   if(bullet.owner&&(bullet.owner.invisibleEnemyT||0)>0)bullet.owner.invisibleEnemyT=0;
   m.health-=777;
   return finishBoss2Hit(m,bullet);
  }
  return baseDamageMage(m,damage,bullet);
 };
})();
