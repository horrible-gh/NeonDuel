function nearestThreat(m){let best=null,bd=1e9;for(const b of bullets){if(b.owner===m)continue;const rx=m.x-b.x,ry=m.y-b.y,rel=Math.hypot(rx,ry);if(rel<bd&&(rx*b.vx+ry*b.vy)>0){bd=rel;best=b;}}return best;}
function updateAI(m,dt){if(!m.alive)return;
 m.attackDebuffT=0;m.attackDebuffMul=1;m.specialLockT=0;m.invisibleEnemyT=0;m.deferredDebuffT=0;m.deferredDebuffStacks=0;
 if(m.effect==='speedDebuff'||m.effect==='fireDebuff'){m.effect=null;m.effectT=0;m.effectMul=1;}
const p=chooseCombatTarget(m,dt),d=dist(m,p),los=lineOfSight(m,p),threat=nearestThreat(m);m.decision-=dt;if(m.decision<=0){m.decision=rand(.06,.13);if(Math.random()<.16)m.strafe*=-1;}let moveX=0,moveY=0;if(threat){const rvx=threat.vx,rvy=threat.vy,rx=m.x-threat.x,ry=m.y-threat.y,t=clamp((rx*rvx+ry*rvy)/(rvx*rvx+rvy*rvy),0,.8),cx=threat.x+rvx*t,cy=threat.y+rvy*t,miss=Math.hypot(m.x-cx,m.y-cy);if(miss<m.r+16&&t<.3){const side=Math.sign((p.x-m.x)*rvy-(p.y-m.y)*rvx)||1;moveX=-rvy*side;moveY=rvx*side;if(m.dashCd<=0&&t<.16&&Math.random()<.5)dash(m,moveX,moveY);}}
 if(!moveX&&!moveY){const to=norm(p.x-m.x,p.y-m.y),perp={x:-to.y*m.strafe,y:to.x*m.strafe};let desired=m.type==='sniper'?470:m.type==='rusher'?165:m.type==='tank'?310:m.type==='boss'?360:330;const radial=clamp((d-desired)/110,-1,1);moveX=to.x*radial+perp.x*(m.type==='rusher'?.48:.82);moveY=to.y*radial+perp.y*(m.type==='rusher'?.48:.82);const ab=arenaBounds(),margin=70;if(m.x<ab.left+margin)moveX+=1.5;if(m.x>ab.right-margin)moveX-=1.5;if(m.y<ab.top+margin)moveY+=1.5;if(m.y>ab.bottom-margin)moveY-=1.5;for(const o of obstacles){if(o.dead)continue;const od=Math.hypot(m.x-o.x,m.y-o.y);if(od<115){moveX+=(m.x-o.x)/(od||1)*1.8;moveY+=(m.y-o.y)/(od||1)*1.8;}}}
 let blue=null,bd=1e9;
 for(const it of pickups){
   if(it.type!=='blue')continue;
   const dd=Math.hypot(m.x-it.x,m.y-it.y);
   if(dd<bd){blue=it;bd=dd;}
 }
 let itemHunter=false;
 if(blue&&m.type!=='boss'){
   // Only the nearest living non-boss enemy claims the pickup.
   let claimant=null,claimDist=1e9;
   for(const e of enemies){
     if(!e.alive||e.type==='boss')continue;
     const ed=Math.hypot(e.x-blue.x,e.y-blue.y);
     if(ed<claimDist){claimDist=ed;claimant=e;}
   }
   // Immediate projectile danger remains the highest priority.
   let imminent=false;
   if(threat){
     const rvx=threat.vx,rvy=threat.vy,rx=m.x-threat.x,ry=m.y-threat.y;
     const tt=clamp((rx*rvx+ry*rvy)/(rvx*rvx+rvy*rvy),0,.5);
     const miss=Math.hypot(m.x-(threat.x+rvx*tt),m.y-(threat.y+rvy*tt));
     imminent=miss<m.r+14&&tt<.16;
   }
   const hpRatio=m.health/Math.max(1,m.maxHealth);
   const shieldLow=(m.maxShield||0)>0?(m.shield||0)<m.maxShield*.35:true;
   const seekRange=(hpRatio<.45||shieldLow)?620:540;
   if(claimant===m&&bd<seekRange&&!imminent){
     const toward=norm(blue.x-m.x,blue.y-m.y);
     const urgency=bd<140?4.8:bd<280?3.8:3.0;
     moveX=toward.x*urgency;moveY=toward.y*urgency;
     itemHunter=true;
     if(bd<250&&m.dashCd<=0&&Math.random()<dt*3.2)dash(m,toward.x,toward.y);
   }
 }
 
 if(m.boss2&&(m.auraEffect===1||m.auraEffect===2)&&(m.auraVisits[m.auraIndex]||0)>=3){
   if(p){
     const toward=norm(p.x-m.x,p.y-m.y);
     moveX=toward.x*2.35;moveY=toward.y*2.35;
   }
 }
 const n=norm(moveX,moveY),sp=m.speed*(m.effect==='speedBuff'?m.effectMul:(m.effect==='speedDebuff'?m.effectMul:1));if(m.dashT<=0){m.vx=lerp(m.vx,n.x*sp,1-Math.exp(-dt*8));m.vy=lerp(m.vy,n.y*sp,1-Math.exp(-dt*8));}const travel=d/Math.max(1,m.projectile),aimX=p.x+p.vx*travel*m.predict,aimY=p.y+p.vy*travel*m.predict;m.aim=Math.atan2(aimY-m.y,aimX-m.x);
 if((m.type==='midboss'||m.type==='boss'))updateBossPatterns(m,dt,d,p);
 if(los&&m.shotCd<=0){
 const err=(m.type==='sniper'?.035:.09)*rand(-1,1),target={x:m.x+Math.cos(m.aim+err)*700,y:m.y+Math.sin(m.aim+err)*700};
 const specialLocked=(m.specialLockT||0)>0;
 let autoBlast=false;
 if(!specialLocked){m.basicShotCount++;autoBlast=m.basicShotCount%10===0;}
 if(autoBlast)fire(m,target,true,true);
 else if(!specialLocked&&m.blastCd<=0&&(m.type==='tank'||d<260||Math.random()<.09))fire(m,target,true);
 else fire(m,target,false);
}if(!los&&m.dashCd<=0&&Math.random()<dt*.22)dash(m,n.x,n.y);}
