import {getCultivationAttr} from '@/data/martialsouls';

function __localBuildShadow(orb){
 if(!orb||!orb.attributes||!orb.martialSoul)throw Error('该前世记录缺少属性或武魂，无法生成影子');
 const attrs=JSON.parse(JSON.stringify(orb.attributes));
 for(const key of ['attack','defense','speed','spirit','hp'])if(!Number.isFinite(attrs[key])||attrs[key]<0||(key==='hp'&&attrs[key]===0))throw Error('前世属性记录不完整，无法挑战');
 const lifeIndex=Number(orb.index);
 if(!Number.isInteger(lifeIndex)||lifeIndex<1||lifeIndex>99)throw Error('前世世数无效');
 const domain={name:'轮回领域',active:true,lifeIndex,attributeBonus:lifeIndex*.1,skillDamageBonus:lifeIndex*.01};
 for(const key of ['attack','defense','speed','spirit','hp'])attrs[key]=Math.round(attrs[key]*(1+domain.attributeBonus));
 const skills=[];
 for(const [soulIndex,rings,soul] of [[0,orb.soulRings,orb.martialSoul],[1,orb.secondSoulRings,orb.secondSoul]]){
  if(!soul)continue;
  for(const [idx,r] of (rings||[]).entries()){
   if(idx>8)continue;
   const pct=Number.isFinite(r.skillDamagePct)&&r.skillDamagePct>0?r.skillDamagePct:2;
   const dir=soul.cultivationAttr||getCultivationAttr(soul),key=dir==='agility'?'speed':dir==='defense'?'defense':dir==='spirit'||dir==='support'?'spirit':'attack';
   skills.push({id:`${soulIndex}-${idx}`,slot:idx+1,type:idx===6?'avatar':r.skillType||'attack',buffAttr:r.buffAttr||'attack',name:r.skillName||soul.soulSkills?.[idx]||`第${idx+1}魂技`,pct,cost:(idx+1)*60,key});
  }
 }
 const critRate=Math.max(0,Math.min(1,Number.isFinite(attrs.critRate)?attrs.critRate:0));
 const critExtra=Math.max(0,(Number.isFinite(attrs.critDmg)?attrs.critDmg:1.5)-1.5);
 const mana=Math.max(0,Number.isFinite(attrs.maxSoulPower)?attrs.maxSoulPower:0);
 return {battleType:'challenge',locationId:'reincarnation-shadow',enemy:{id:`shadow-life-${orb.index}`,name:`轮回之影·${orb.name}（第${orb.index}世）`,years:orb.level||99,qualityColor:'gold',qualityLabel:`前世·${orb.realm||''}`,hp:attrs.hp,attack:attrs.attack,defense:attrs.defense,speed:attrs.speed,spirit:attrs.spirit,skillName:skills[0]?.name||'前世一击',skillDesc:`轮回领域：五维属性 +${lifeIndex*10}%，魂技伤害 +${lifeIndex}%；第九魂技65%，第一至第八各4.375%（魂力充足且魂技齐全时）`,element:orb.martialSoul.element,instantKillChance:0,hasOnlySkill:false},meta:{challengeType:'reincarnation-shadow',shadow:{lifeIndex,domain,attrs,skills,critRate,critExtra,mana,buffs:{},turn:0}}};
}
function __localShadowAction(state,random=Math.random){
 const next={...state,buffs:{},turn:(state.turn||0)+1};
 for(const [key,buff] of Object.entries(state.buffs||{}))if(buff.turns>1)next.buffs[key]={...buff,turns:buff.turns-1};
 const available=(state.skills||[]).filter(s=>s.cost<=state.mana);
 const slots=[...new Set(available.map(s=>s.slot))].sort((a,b)=>a-b);
 const weight=slot=>slot===9?.65:.35/8;
 let ticket=random()*slots.reduce((sum,slot)=>sum+weight(slot),0),slot=slots.at(-1);
 for(const candidate of slots){ticket-=weight(candidate);if(ticket<0){slot=candidate;break;}}
 const candidates=available.filter(s=>s.slot===slot);
 const selected=candidates.length?candidates[Math.min(candidates.length-1,Math.floor(random()*candidates.length))]:null;
 const effective=key=>state.attrs[key]*(1+(state.buffs?.[key]?.value||0));
 let heal=0,nonDamage=false;
 if(selected){
  next.mana=Math.max(0,state.mana-selected.cost);
  nonDamage=['avatar','buff','heal','defense'].includes(selected.type);
  if(selected.type==='heal')heal=Math.round(Math.max(10,effective(selected.key)*selected.pct*.5));
  if(selected.type==='avatar')for(const key of ['attack','defense','speed','spirit'])next.buffs[key]={value:Math.max(next.buffs[key]?.value||0,.5),turns:3};
  if(selected.type==='buff'||selected.type==='defense'){
   const key=selected.type==='defense'?'defense':selected.buffAttr;
   if(['attack','defense','speed','spirit'].includes(key))next.buffs[key]={value:Math.max(next.buffs[key]?.value||0,.12+selected.pct*.08),turns:3};
  }
 }
 return {next,isSkill:!!selected,slot:selected?.slot,skillName:selected?.name||'普通攻击',attr:effective(selected?selected.key:'attack'),pct:selected?(1+selected.pct)*(1+(state.domain?.skillDamageBonus||0))-1:undefined,critRate:state.critRate,critExtra:state.critExtra,nonDamage,heal,defense:state.attrs.defense*(1+(next.buffs.defense?.value||0))};
}
// END REINCARNATION SHADOW ENGINE

export {__localBuildShadow,__localShadowAction};