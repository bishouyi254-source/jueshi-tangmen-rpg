// BEGIN FIERCE EFFECTS ENGINE v1
// Pure battle rules. State is JSON serializable; no storage or React access.
var __FBProfiles = {};
function __fbClone(s) { return JSON.parse(JSON.stringify(s)); }
function __fbFinite(n, fallback=0) { return Number.isFinite(n)?n:fallback; }
function __fbCreate(beastId, enemy, player, spirits=[]) {
  function actor(a) { return {name:a.name||'',hp:Math.max(0,a.hp),maxHp:Math.max(1,a.maxHp||a.hp),mana:Math.max(0,a.mana||0),maxMana:Math.max(0,a.maxMana||a.mana||0),stats:{attack:a.attack||0,defense:a.defense||0,speed:a.speed||0,spirit:a.spirit||0},effects:{},shield:0,action:0,immortalUsed:false}; }
  const actors={enemy:actor(enemy),player:actor(player)};
  for(const a of spirits) actors['spirit:'+a.id]=actor(a);
  return {version:1,beastId,actors,cooldowns:{},actions:0};
}
function __fbValue(a,type) { return Math.max(0,...Object.values(a.effects).filter(e=>e.type===type).map(e=>e.value||0)); }
function __fbAdd(s,key,e,logs=[]) {
  const a=s.actors[key];if(!a||a.hp<=0)return;
  const old=a.effects[e.id];
  a.effects[e.id]={...e,value:Math.max(e.value||0,old?.value||0),turns:Math.max(1,e.turns||1),born:a.action};
  logs.push(`${a.name} 获得【${e.label}】（${e.turns||1}次行动）。`);
}
function __fbHeal(s,key,amount,logs=[],label='治疗') {
  const a=s.actors[key];if(!a||a.hp<=0)return 0;
  const n=Math.min(a.maxHp-a.hp,Math.max(0,Math.round(amount*(1-Math.min(1,__fbValue(a,'antiHeal'))))));
  a.hp+=n;if(n>0)logs.push(`${a.name} ${label}恢复 ${n} 点气血。`);return n;
}
function __fbShield(s,key,pct,logs=[]) {
  const a=s.actors[key];if(!a||a.hp<=0)return;
  a.shield=Math.min(Math.floor(a.maxHp*.06),Math.max(a.shield,Math.floor(a.maxHp*pct)));
  logs.push(`${a.name} 获得护盾，当前 ${a.shield} 点。`);
}
function __fbDamage(s,target,amount,options={},logs=[]) {
  const a=s.actors[target],attacker=s.actors[options.attacker||'player'];
  if(!a||a.hp<=0||amount<=0)return {lost:0,absorbed:0,reflected:0};
  let damage=Math.max(0,Math.round(amount));
  if(!options.raw){damage=Math.round(damage*(1+__fbValue(a,'vulnerable'))*(1-Math.min(.9,__fbValue(a,'reduction'))));}
  if(Number.isFinite(options.cap))damage=Math.min(damage,Math.max(0,options.cap));
  const absorbed=Math.min(a.shield,damage);a.shield-=absorbed;damage-=absorbed;
  const before=a.hp;let lost=Math.min(before,damage);a.hp=before-lost;
  if(a.hp===0&&target==='enemy'&&__FBProfiles[s.beastId]?.immortal&&!a.immortalUsed){a.hp=1;a.immortalUsed=true;lost=before-1;logs.push('鬼帝触发【生死轮转】：本场唯一一次免死，保留1点气血。');}
  let reflected=0;
  // The defender must survive the hit; lethal hits never retaliate.
  if(options.direct!==false&&a.hp>0&&attacker?.hp>0){
    reflected=Math.min(Math.round(lost*__fbValue(a,'reflect')),Math.floor(attacker.maxHp*.08),attacker.hp);
    if(reflected>0){__fbDamage(s,options.attacker||'player',reflected,{direct:false,raw:true},logs);logs.push(`${a.name} 反伤 ${reflected} 点气血。`);}
  }
  return {lost,absorbed,reflected};
}
function __fbBegin(s,key,logs=[]) {
  const a=s.actors[key];if(!a||a.hp<=0)return {skip:true,dead:true};
  a.action++;
  const values=Object.values(a.effects),strongestDot=values.filter(e=>e.type==='dot').sort((a,b)=>b.value-a.value)[0],strongestHot=values.filter(e=>e.type==='hot').sort((a,b)=>b.value-a.value)[0];
  for(const e of values){
    if(e.type==='dot'&&e!==strongestDot||e.type==='hot'&&e!==strongestHot)continue;
    if(e.type==='dot'&&a.hp>0){const cap=Math.floor(a.maxHp*.03),n=Math.min(Math.round(e.value),cap);const hit=__fbDamage(s,key,n,{direct:false,cap},logs);logs.push(`${a.name} 【${e.label}】损失 ${hit.lost} 点气血${hit.absorbed?`，护盾吸收${hit.absorbed}`:''}。`);}
    if(e.type==='hot')__fbHeal(s,key,a.maxHp*e.value,logs,'持续治疗');
  }
  const controlled=Object.values(a.effects).find(e=>e.type==='freeze'||e.type==='stun');
  if(controlled&&a.hp>0)logs.push(`${a.name} 受到【${controlled.label}】，跳过本次行动。`);
  return {skip:a.hp<=0||!!controlled,dead:a.hp<=0};
}
function __fbFinish(s,key) {
  const a=s.actors[key];if(!a)return;
  for(const [id,e] of Object.entries(a.effects))if(e.born<a.action&&--e.turns<=0)delete a.effects[id];
}
function __fbDirect(s,target,damage,options={}) {
  const next=__fbClone(s),logs=[],result=__fbDamage(next,target,damage,options,logs);
  return {next,logs,...result};
}
function __fbDefense(s,key,originalDef,penetration=0) {
  const a=s.actors[key];return Math.max(0,originalDef*(1-Math.min(.9,a?__fbValue(a,'armorDown'):0))*(1-Math.min(1,penetration)));
}
function __fbSpeed(s,key,base) { return Math.max(1,base*(1-Math.min(.9,__fbValue(s.actors[key],'slow')))); }
function __fbEnemyAction(state,context={},rng=Math.random) {
  const s=__fbClone(state),logs=[],a=s.actors.enemy,profile=__FBProfiles[s.beastId];
  if(!profile||!a||a.hp<=0)return {next:s,logs,damage:0,nonDamage:true,skillName:'',target:'player'};
  const start=__fbBegin(s,'enemy',logs);
  if(start.skip){__fbFinish(s,'enemy');return {next:s,logs,damage:0,nonDamage:true,skillName:'无法行动',target:'player'};}
  for(const key of Object.keys(s.cooldowns))s.cooldowns[key]=Math.max(0,s.cooldowns[key]-1);
  const available=profile.skills.map((name,i)=>({name,slot:i+1})).filter(x=>!s.cooldowns[x.slot]&&a.mana>=x.slot*60);
  const useSkill=available.length>0&&rng()<.75;
  const choice=useSkill?available[Math.min(available.length-1,Math.floor(rng()*available.length))]:{name:'普通攻击',slot:0};
  const rule=profile.rules[choice.slot]||{},target=context.target||'player',t=s.actors[target];
  if(!t||t.hp<=0){__fbFinish(s,'enemy');return {next:s,logs,damage:0,nonDamage:true,skillName:choice.name,target};}
  if(useSkill){s.cooldowns[choice.slot]=rule.nonDamage?3:2;a.mana-=choice.slot*60;}
  const attr=a.stats[profile.attr||'attack']*(1+__fbValue(a,'attackUp'));
  let damage=0,totalLost=0,isCrit=false;
  if(!rule.nonDamage){
    const def=__fbDefense(s,target,context.defense??t.stats.defense,rule.penetration||0);
    const variance=.9+rng()*.2;isCrit=rng()<Math.min(.15,.05+a.stats.attack/5000);
    damage=Math.max(1,Math.round(attr*(useSkill?3:1)*500/(def+500)*variance*(isCrit?1.5:1)));
    if(rule.execute&&t.hp/t.maxHp<.3)damage=Math.round(damage*(1+rule.execute));
    const parts=rule.parts||1;
    // Split an unchanged damage budget, so rounding never increases total damage.
    for(let i=0;i<parts&&a.hp>0&&t.hp>0;i++){
      const part=Math.floor(damage/parts)+(i<damage%parts?1:0);
      const hit=__fbDamage(s,target,part,{attacker:'enemy',direct:true},logs);totalLost+=hit.lost;
      logs.push(`${a.name} ${choice.name}${parts>1?`（第${i+1}段）`:''}造成 ${hit.lost} 点气血伤害${hit.absorbed?`，护盾吸收${hit.absorbed}`:''}。`);
    }
    if(rule.chase&&a.hp>0&&t.hp>0&&rng()<rule.chase){const hit=__fbDamage(s,target,Math.round(damage*.3),{attacker:'enemy',direct:true},logs);totalLost+=hit.lost;logs.push(`${a.name} 追击造成 ${hit.lost} 点伤害。`);}
    if(rule.lifesteal&&a.hp>0)__fbHeal(s,'enemy',Math.min(totalLost*rule.lifesteal,a.maxHp*.03),logs,'吸血');
  }else logs.push(`${a.name} 使用「${choice.name}」，本次不追加攻击。`);
  if(a.hp>0){
    if(rule.heal)__fbHeal(s,'enemy',a.maxHp*rule.heal,logs);
    if(rule.shield)__fbShield(s,'enemy',rule.shield,logs);
    if(rule.cleanse){for(const [key,e] of Object.entries(a.effects))if(e.negative)delete a.effects[key];logs.push(`${a.name} 净化自身负面状态。`);}
    for(const effect of rule.self||[])__fbAdd(s,'enemy',effect,logs);
    if(t.hp>0){
      for(const effect of rule.target||[])if(!effect.chance||rng()<effect.chance)__fbAdd(s,target,{...effect,value:effect.type==='dot'?attr*(effect.scale||.5):effect.value},logs);
      if(rule.manaDrain){const n=Math.min(t.mana,Math.floor(t.mana*rule.manaDrain));t.mana-=n;if(rule.manaSteal)a.mana=Math.min(a.maxMana,a.mana+n);logs.push(`${t.name} 被削减 ${n} 点魂力。`);}
    }
  }
  __fbFinish(s,'enemy');s.actions++;
  return {next:s,logs,damage:totalLost,nonDamage:!!rule.nonDamage,skillName:choice.name,slot:choice.slot,target,isCrit};
}
function __fbStatus(s) {
  if(!s)return '';
  return Object.values(s.actors).filter(a=>a.hp>0).map(a=>{
    const effects=Object.values(a.effects).map(e=>`${e.type==='freeze'?'❄️':e.type==='reflect'?'↩️':e.type==='hot'?'💚':e.type==='dot'?'☠️':'◆'}${e.label}(${e.turns})`);
    if(a.shield>0)effects.unshift(`🛡️护盾 ${a.shield}`);
    return effects.length?`${a.name}：${effects.join(' · ')}`:'';
  }).filter(Boolean).join('\n');
}
// END FIERCE EFFECTS ENGINE
