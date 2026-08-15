function updatePingBadge(){
 const b=document.getElementById('pingBadge');if(!b)return;
 if(!multiplayer.enabled||!net.connected){b.style.display='none';return;}
 b.style.display='block';
 b.textContent=`PING ${Number.isFinite(net.pingMs)?Math.round(net.pingMs)+'ms':'--ms'}`;
}
function stopNetPing(){
 if(net.pingTimer){clearInterval(net.pingTimer);net.pingTimer=null;}
 net.pingMs=null;updatePingBadge();
}
function sendNetPing(){
 if(!net.connected||!net.ws||net.ws.readyState!==WebSocket.OPEN||!net.peer)return;
 wsSend({type:'ping',t:Date.now()});
}
function startNetPing(){
 stopNetPing();updatePingBadge();sendNetPing();net.pingTimer=setInterval(sendNetPing,1000);
}
function connectNet(role,mode,addr){
 net.role=role;multiplayer.enabled=role!=='solo';multiplayer.mode=mode||'coop';multiplayer.players=multiplayer.enabled?2:1;resetReadyState();
 if(role==='solo'){stopNetPing();document.getElementById('netLobby').classList.add('hide');document.getElementById('peerBadge').style.display='none';showShop();return;}
 const host=role==='host'?location.host:(addr||location.host);const proto=location.protocol==='https:'?'wss':'ws';
 const url=`${proto}://${host}/ws?role=${role}`;document.getElementById('netStatus').textContent=`CONNECTING ${url}`;
 try{net.ws=new WebSocket(url);}catch(e){document.getElementById('netStatus').textContent='연결 생성 실패: '+e;return;}
 net.ws.onopen=()=>{net.connected=true;document.getElementById('netLobby').classList.add('hide');const b=document.getElementById('peerBadge');b.style.display='block';b.textContent=role==='host'?`HOST // ${multiplayer.mode.toUpperCase()} // WAITING`:'GUEST // CONNECTED';startNetPing();showShop();wsSend({type:'mode',mode:multiplayer.mode,stage:run.stage,maxStage:run.maxStage});wsSend({type:'profile',profile:exportProfile()});};
 net.ws.onclose=()=>{net.connected=false;net.peer=false;stopNetPing();document.getElementById('peerBadge').textContent='LINK LOST';if(role==='guest'){document.getElementById('netLobby').classList.remove('hide');document.getElementById('netStatus').textContent='HOST 연결이 종료되었습니다.';}};
 net.ws.onerror=()=>{document.getElementById('netStatus').textContent='WebSocket 연결 실패. IP/포트포워딩/방화벽을 확인하십시오.';};
 net.ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return;}handleNetMessage(m);};
}
function handleNetMessage(m){
 if(m.type==='ping'){wsSend({type:'pong',t:m.t});return;}
 if(m.type==='pong'){if(Number.isFinite(+m.t)){net.pingMs=Math.max(0,Date.now()-(+m.t));updatePingBadge();}return;}
 if(m.type==='peer'){net.peer=!!m.connected;if(!net.peer){net.peerReady=false;net.pingMs=null;}else sendNetPing();updatePingBadge();const b=document.getElementById('peerBadge');b.style.display='block';b.textContent=net.role==='host'?`HOST // ${multiplayer.mode.toUpperCase()} // ${net.peer?'GUEST CONNECTED':'WAITING'}`:`GUEST // ${multiplayer.mode.toUpperCase()} // ${net.peer?'HOST CONNECTED':'WAITING'}`;if(net.role==='host'&&net.peer){wsSend({type:'mode',mode:multiplayer.mode,stage:run.stage,maxStage:run.maxStage});wsSend({type:'profile',profile:exportProfile()});}if(state==='shop')renderShop();return;}
 if(m.type==='mode'&&net.role==='guest'){multiplayer.mode=m.mode||'coop';if(m.stage)run.stage=Math.max(1,Math.floor(m.stage));renderShop();return;}
 if(m.type==='profile'){if(net.role==='host'&&m.profile){peerProfile={credits:+m.profile.credits||0,maxStage:Math.max(1,+m.profile.maxStage||1),up:{...emptyUp(),...(m.profile.up||{})}};}return;}
 if(m.type==='ready'){net.peerReady=!!m.ready;if(net.role==='host'&&m.profile)peerProfile={credits:+m.profile.credits||0,maxStage:Math.max(1,+m.profile.maxStage||1),up:{...emptyUp(),...(m.profile.up||{})}};if(state==='shop')renderShop();tryStartMultiplayer();return;}
 if(m.type==='battleStart'&&net.role==='guest'){multiplayer.mode=m.mode||multiplayer.mode;if(m.stage)run.stage=m.stage;net.localReady=false;net.peerReady=false;document.getElementById('shop').classList.remove('show');state='battle';return;}
 if(m.type==='roundEnd'&&net.role==='guest'){run.credits=m.credits??run.credits;run.stage=m.stage??run.stage;run.maxStage=Math.max(run.maxStage,Math.floor(+m.maxStage||run.stage||1));run.totalKills=m.totalKills??run.totalKills;saveState();resetReadyState();const box=document.getElementById('resultBanner');document.getElementById('resultTitle').textContent=m.localWin?'VICTORY':'DEFEAT';document.getElementById('resultSub').textContent=`${m.localWin?'전투 보상':'회수 보상'} +${m.reward||0} CR · 현재 ${run.credits} CR`;box.classList.add('show');setTimeout(()=>{box.classList.remove('show');showShop();},1500);return;}
 if(m.type==='input'&&net.role==='host'){net.input={dx:+m.dx||0,dy:+m.dy||0,aim:+m.aim||0,fire:!!m.fire,dash:!!m.dash};return;}
 if(m.type==='snapshot'&&net.role==='guest')applySnapshot(m);
}
function plainMage(m){if(!m)return null;const o={};for(const k of ['x','y','vx','vy','r','color','health','maxHealth','aim','type','alive','shield','maxShield','tempShield','tempShieldT','effect','effectT','effectMul','excaliburT','fortressShieldDecay','invisibleEnemyT','phase','boss2','auraRadius','auraColors','auraMap','auraIndex','auraEffect','auraT','auraPulse','auraPulseT','auraVisits','mouseSnapT','forcedAimT','forcedAimX','forcedAimY','fireGrace','boss2WarpT','boss2WarpAlpha','boss2WarpRecoverFrom','boss2WarpRecoverT'])o[k]=m[k];return o;}
function netSendSnapshot(force=false){if(net.role!=='host'||!net.connected)return;if(!force&&net.snapT<.05)return;net.snapT=0;wsSend({type:'snapshot',mode:multiplayer.mode,state,time,stage:run.stage,credits:run.credits,peerCredits:peerProfile.credits,p1:plainMage(player),p2:plainMage(remotePlayer),enemies:enemies.map(plainMage),bullets:bullets.map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy,r:b.r,color:b.color,blast:b.blast,pulse:b.pulse,playerShot:b.owner===player||b.owner===remotePlayer})),pickups:pickups.map(p=>({type:p.type,x:p.x,y:p.y,r:p.r,spin:p.spin,hp:p.hp,maxHp:p.maxHp})),obstacles:obstacles.map(o=>({x:o.x,y:o.y,w:o.w,h:o.h,hp:o.hp,maxHp:o.maxHp,kind:o.kind,dead:o.dead})),battleEnded});}
function applySnapshot(m){multiplayer.mode=m.mode||multiplayer.mode;if(m.state==='battle'||state==='battle')state=m.state||state;time=m.time||time;run.stage=m.stage||run.stage;if(m.peerCredits!=null)run.credits=m.peerCredits;player=m.p2||m.p1;remotePlayer=m.p1;enemies=m.enemies||[];bullets=m.bullets||[];pickups=m.pickups||[];obstacles=m.obstacles||[];battleEnded=!!m.battleEnded;if(state==='battle')document.getElementById('shop').classList.remove('show');}
