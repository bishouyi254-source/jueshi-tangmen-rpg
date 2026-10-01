// Injected inside the BattlePage component; bindings are its existing state/ref setters.
function __fbGet() {
  if(Re!=='fierce-beast'||!__FBProfiles[U.id]||!W||!vn.current)return null;
  if(!__fbRef.current||__fbRef.current.beastId!==U.id){
    const saved=d?.meta?.fierceEffects;
    // The mount effect has initialized React state, but the HP mirror effects
    // have not necessarily run yet. Use the authoritative battle snapshot.
    un.current=d?.enemy?.hp??U.hp;dn.current=d?.enemy?.maxHp??U.maxHp??U.hp;
    __fbRef.current=saved?.version===1&&saved.beastId===U.id?__fbClone(saved):__fbCreate(U.id,
      {...U,hp:un.current,maxHp:dn.current,mana:Math.max(600,U.spirit*10),maxMana:Math.max(600,U.spirit*10)},
      {...W,name:Ve,hp:fn.current,maxHp:Math.round(W.hp*Lt.hpMul),mana:pn.current,maxMana:W.maxSoulPower},pe.current);
  }
  const s=__fbRef.current;s.actors.enemy.hp=un.current;s.actors.player.hp=fn.current;s.actors.player.mana=pn.current;
  s.actors.player.maxHp=Math.max(1,Math.round(W.hp*Lt.hpMul));
  for(const spirit of pe.current){const key='spirit:'+spirit.id;if(!s.actors[key])s.actors[key]=__fbCreate('',spirit,spirit).actors.player;s.actors[key].hp=spirit.hp;}
  return s;
}
function __fbCommit(s,logs=[]) {
  __fbRef.current=s;
  if(d)d.meta={...d.meta,fierceEffects:s};
  un.current=s.actors.enemy.hp;fn.current=s.actors.player.hp;pn.current=s.actors.player.mana;
  Ee(un.current);__fbRawPlayerHp(fn.current);__fbRawMana(pn.current);
  const spirits=pe.current.map(a=>{const saved=s.actors['spirit:'+a.id];return saved?{...a,hp:saved.hp,dead:saved.hp<=0}:a;});
  pe.current=spirits;jt(spirits);
  for(const line of logs)K(line,line.includes('恢复')?'heal':'system');
}
function et(value) {
  const before=fn.current,next=typeof value==='function'?value(before):value;
  const s=typeof value==='function'&&next>before?__fbGet():null;
  if(s){const copy=__fbClone(s),logs=[];__fbHeal(copy,'player',next-before,logs);__fbCommit(copy,logs);return;}
  fn.current=next;__fbRawPlayerHp(next);
}
function nt(value) {const next=typeof value==='function'?value(pn.current):value;pn.current=next;__fbRawMana(next);}
function __fbHitEnemy(damage,attacker='player',instant=false) {
  const s=__fbGet();
  if(!s){Ee(hp=>Math.max(0,hp-damage));return Math.min(un.current,damage);}
  const adjusted=instant?damage:Math.round(damage*(Math.max(0,U.defense)+500)/(__fbDefense(s,'enemy',U.defense)+500));
  const hit=__fbDirect(s,'enemy',adjusted,{attacker,direct:true});
  __fbCommit(hit.next,hit.logs);
  if(hit.absorbed>0)K(`🛡️ ${U.name} 护盾吸收 ${hit.absorbed} 点伤害。`,'system');
  return hit.lost;
}
function __fbSilenced() {
  const s=__fbRef.current||d?.meta?.fierceEffects;return !!s&&Object.values(s.actors.player.effects).some(e=>e.type==='silence');
}
function __fbSkillAllowed() {if(!__fbSilenced())return true;K('🔒 沉默中：不能释放魂技，仍可普通攻击。','system');return false;}
function __fbFinishPlayer() {
  const s=__fbGet();if(!s||!s.playerOpen)return;
  const copy=__fbClone(s);__fbFinish(copy,'player');copy.playerOpen=false;__fbCommit(copy);
}
function __fbEnterPlayer() {
  if(se.current||un.current<=0||fn.current<=0)return;
  const s=__fbGet();if(!s){ge('playerTurn');return;}
  if(s.playerOpen){ge('playerTurn');return;}
  const copy=__fbClone(s),logs=[],start=__fbBegin(copy,'player',logs);copy.playerOpen=true;copy.enemyActed=false;copy.spiritDone=false;
  __fbCommit(copy,logs);Ne(Object.values(copy.actors.player.effects).some(e=>e.type==='silence')?1:0);
  if(start.dead)return;
  if(start.skip){__fbFinishPlayer();ce.current=true;ge('enemyTurn');he(0);return;}
  ce.current=false;ge('playerTurn');
}
function __fbSpiritTurn(spirit) {
  const s=__fbGet();if(!s)return false;
  const copy=__fbClone(s),logs=[],key='spirit:'+spirit.id,start=__fbBegin(copy,key,logs);
  // Spirits have one attack per player action; all their statuses count that action.
  __fbFinish(copy,key);__fbCommit(copy,logs);return start.skip;
}
function __fbEnemyTurn() {
  const s=__fbGet();if(!s)return false;
  if(se.current||s.actors.enemy.hp<=0||s.actors.player.hp<=0)return true;
  const spirits=pe.current.filter(a=>!a.dead&&a.hp>0);
  const target=spirits.length?'spirit:'+spirits[Math.floor(Math.random()*spirits.length)].id:'player';
  let defense=target==='player'?Math.round(W.defense*Lt.defMul*(1+(Ut?.defense?.value||0))):s.actors[target].stats.defense;
  const result=__fbEnemyAction(s,{target,defense});result.next.enemyActed=true;__fbCommit(result.next,result.logs);
  if(result.damage>0)$t(`-${en(result.damage)}`,result.isCrit,'player');
  if(result.next.actors[target].hp<=0&&target!=='player')K(`魂灵「${result.next.actors[target].name}」已阵亡。`,'system');
  return true;
}
async function __fbRunSpirits() {
  const s=__fbGet();if(s?.spiritDone)return 0;
  const damage=await En();
  const next=__fbGet();if(next){const copy=__fbClone(next);copy.spiritDone=true;__fbCommit(copy);}
  return damage;
}
function __fbRestoreSpirits(spirits,saved) {
  return saved?.version===1?spirits.map(a=>{const x=saved.actors?.['spirit:'+a.id];return x?{...a,hp:Math.max(0,Math.min(a.maxHp,x.hp)),dead:x.hp<=0}:a;}):spirits;
}
