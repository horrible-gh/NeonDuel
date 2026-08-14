// Boss 2 mode feedback. Keeps the random aura mappings hidden while showing
// the active orb reward / special-mode timer so orb destruction is readable.
(function(){
 const baseBoss2OnOrbDestroyed=boss2OnOrbDestroyed;
 const baseEffectText=effectText;

 function boss2Now(){return enemies.find(e=>e.alive&&e.boss2);}
 function signedPercent(v){const n=Math.round((v-1)*100);return `${n>=0?'+':''}${n}%`;}
 function orbItemText(b){
  if(!b||b.boss2Mode!=='orb')return'';
  if(b.boss2OrbItem===1)return'ORB · 보스 타격 +1';
  if(b.boss2OrbItem===2)return`ORB · 연사 ${signedPercent(b.boss2OrbItemMul||1)}`;
  if(b.boss2OrbItem===3)return`ORB · 이동 ${signedPercent(b.boss2OrbItemMul||1)}`;
  if(b.boss2OrbItem===4)return`ORB · 탄속 ${signedPercent(b.boss2OrbItemMul||1)}`;
  return'ORB';
 }

 boss2OnOrbDestroyed=function(owner){
  baseBoss2OnOrbDestroyed(owner);
  const b=boss2Now();if(!b)return;
  if(b.boss2Mode==='special')showMsg('PURPLE BREAK // SPECIAL 10s',1.35);
  else if(b.boss2Mode==='orb')showMsg(`PURPLE BREAK // ${orbItemText(b)} // 10s`,1.55);
 };

 effectText=function(m){
  let text=baseEffectText(m),b=boss2Now();
  if(!b||!m||(m!==player&&m!==remotePlayer))return text;
  if(b.boss2Mode==='special'&&(b.boss2ModeT||0)>0)text+=` · SPECIAL ${(b.boss2ModeT||0).toFixed(1)}s`;
  else if(b.boss2Mode==='orb'&&(b.boss2ModeT||0)>0)text+=` · ${orbItemText(b)} ${(b.boss2ModeT||0).toFixed(1)}s`;
  return text;
 };
})();
