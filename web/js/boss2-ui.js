// Boss 2 status text only. Aura mappings remain hidden.
(function(){
 const baseEffectText=effectText;

 function boss2Now(){return enemies.find(e=>e.alive&&e.boss2);}
 function signedPercent(v){const n=Math.round((v-1)*100);return `${n>=0?'+':''}${n}%`;}
 function orbItemText(b){
  if(!b||b.boss2Mode!=='orb')return'';
  if(b.boss2OrbItem===1)return'보스 타격 +1';
  if(b.boss2OrbItem===2)return`연사 ${signedPercent(b.boss2OrbItemMul||1)}`;
  if(b.boss2OrbItem===3)return`이동 ${signedPercent(b.boss2OrbItemMul||1)}`;
  if(b.boss2OrbItem===4)return`탄속 ${signedPercent(b.boss2OrbItemMul||1)}`;
  return'';
 }

 effectText=function(m){
  let text=baseEffectText(m),b=boss2Now();
  if(!b||!m||(m!==player&&m!==remotePlayer))return text;
  if(b.boss2Mode==='special'&&(b.boss2ModeT||0)>0)text+=` · ??? ${(b.boss2ModeT||0).toFixed(1)}s`;
  else if(b.boss2Mode==='orb'&&(b.boss2ModeT||0)>0){
   const item=orbItemText(b);
   if(item)text+=` · ${item} ${(b.boss2ModeT||0).toFixed(1)}s`;
  }
  return text;
 };
})();
