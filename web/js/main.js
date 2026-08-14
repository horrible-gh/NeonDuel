let last=performance.now(),fatalGameError='';function loop(now){try{const dt=Math.min(.033,(now-last)/1000);last=now;time+=dt;net.sendT+=dt;net.snapT+=dt;
 if(net.role==='guest'){
   if(net.connected&&net.sendT>=1/30){net.sendT=0;wsSend(localInputPacket());}
 }else if(state==='battle'&&!battleEnded){
   updatePlayer(dt);if(remotePlayer)updateRemoteControlled(remotePlayer,dt);
   if(multiplayer.mode!=='vs')for(const e of enemies)updateAI(e,dt);
   moveMage(player,dt);if(remotePlayer)moveMage(remotePlayer,dt);for(const e of enemies)moveMage(e,dt);
   if(multiplayer.mode!=='vs')updatePickups(dt);updateBullets(dt);netSendSnapshot();
 }
 updateFX(dt);draw();updateUI();}catch(err){fatalGameError=String(err&&err.stack||err);console.error(err);const el=document.getElementById('centerMsg');if(el){el.textContent='GAME ERROR';el.style.opacity=1;} }requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
document.getElementById('shop').classList.remove('show');
document.getElementById('soloBtn').onclick=()=>connectNet('solo','coop');
document.getElementById('hostCoopBtn').onclick=()=>connectNet('host','coop');
document.getElementById('hostVsBtn').onclick=()=>connectNet('host','vs');
document.getElementById('joinBtn').onclick=()=>connectNet('guest','coop',document.getElementById('joinAddr').value.trim());
