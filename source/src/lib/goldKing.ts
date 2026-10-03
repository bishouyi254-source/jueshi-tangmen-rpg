// Names reference the research report; numerical effects are this game's balance rules.
export const GOLD_KING_BASE_SKILLS=['黄金龙体','金龙霸体','黄金龙吼','金龙狂暴领域','金龙震爆','金龙镇狱杀','金龙王真身（游戏原创）','黄金龙瀑','金龙王破灭（游戏原创）'];
export const DRAGON_FORBIDDEN=['禁万法·龙皇破','禁时空·龙皇斩','禁生死·龙皇刺','禁平凡·龙皇冲','禁天地·龙皇斗','禁乾坤·龙皇灭','禁苍穹·龙皇陨','禁寰宇·龙皇耀'];
export const GOLD_EVOLUTIONS=[
 {id:'claw',name:'爪部能力',stages:['金龙爪','粉碎与撕裂','龙爪震爆','双爪进化'],desc:'每阶攻击+2%、魂技伤害+1%，金龙王攻击魂技额外忽略5%防御'},
 {id:'body',name:'身体能力',stages:['金鳞护体','龙威','龙罡','金龙双翼'],desc:'每阶防御、速度、气血+2%；强化血脉护体与机动能力'},
 {id:'core',name:'气血结构',stages:['气血凝聚','龙核雏形','龙核凝成','龙核进化'],desc:'每阶魂力上限+3%，完成一次行动恢复0.5%魂力，最多2%'},
 {id:'state',name:'特殊状态',stages:['血龙初醒','血龙变','血龙稳固','血龙掌控'],desc:'升级后可主动释放血龙变：攻击+15%至30%，持续2次行动，易伤10%，冷却6次行动'},
] as const;
const rank=(x:any)=>Number.isFinite(x)?Math.min(4,Math.max(0,Math.floor(x))):0;
export function hasGoldKing(p:any){return p?.martialSoul?.name==='金龙王'||(p?.isTwinSoul===true&&p?.secondSoul?.name==='金龙王');}
export function goldSeals(p:any){return hasGoldKing(p)?Math.min(18,Math.max(0,Number.isFinite(p?.dragonBloodline?.seals)?Math.floor(p.dragonBloodline.seals):0)):0;}
export function goldEvolutions(p:any){const max=[2,6,12,16].filter(s=>goldSeals(p)>=s).length;return Object.fromEntries(GOLD_EVOLUTIONS.map(e=>[e.id,hasGoldKing(p)?Math.min(max,rank(p?.dragonBloodline?.evolutions?.[e.id])):0])) as Record<string,number>;}
export function goldSkill(p:any,slot:number,soulIndex=0){
 const soul=soulIndex===1?(p?.isTwinSoul===true?p.secondSoul:null):p?.martialSoul;
 if(soul?.name!=='金龙王'||slot<0||slot>8)return null;
 const seals=goldSeals(p),map=[0,1,2,3,4,5,-1,6,7],forbidden=slot<4?seals>=12:slot!==6&&seals>=16;
 const name=forbidden?DRAGON_FORBIDDEN[map[slot]]:GOLD_KING_BASE_SKILLS[slot];
 const kinds=['allBuff','buff','attack','allBuff','attack','attack','buff','buff','attack'];
 const desc=forbidden?[
 '攻击并净化自身负面状态；伤害×1.15。','攻击并眩晕1次行动，冷却3次行动。','伤害×1.25；吸血20%，单次最多恢复最大气血3%。','攻击并强化攻击、防御20%，持续2次行动。',
 '伤害×1.2，额外忽略35%防御。','伤害×1.3，并移除敌方正面状态。','伤害×1.4，并降低敌方攻击15%，持续2次行动。','伤害×1.5，释放后易伤10%，持续1次行动。'
 ][map[slot]]:[
 '攻击、防御、速度、精神+20%，持续3次行动；本次不攻击。','直接减伤25%，持续2次敌方行动；承受来力转为下一次直接攻击增量，最多原伤害50%；本次不攻击。',
 '攻击并有30%概率眩晕1次行动，冷却2次行动。','强化自身及上阵魂灵攻击、防御20%，持续3次行动；本次不攻击。',
 '震爆伤害×1.25。','镇狱伤害×1.35，20%概率眩晕1次行动，冷却3次行动。','游戏原创：沿用武魂真身开关与持续时间规则。',
 '游戏改编：6%气血护盾，并净化自身负面状态；本次不攻击。','游戏原创：伤害×1.5，释放后易伤10%，持续1次行动。'
 ][slot];
 const cooldown=(forbidden&&slot===1)?3:!forbidden&&slot===2?2:!forbidden&&slot===5?3:0;
 const melee=forbidden?[0,1,2,3,4].includes(slot):[4,5].includes(slot);
 return {name,desc:desc+(melee?' 金龙霸血：近战附加伤害随基础最大气血成长（不超过本次伤害20%）；力量成长不额外封顶。':''),melee,slot,forbidden,skillType:forbidden?'attack':kinds[slot],cooldown,key:'gold:'+soulIndex+':'+slot};
}
export function normalizeGoldKing(p:any){
 if(!p)return p;let out=p;
 for(const [soulKey,ringKey,index] of [['martialSoul','soulRings',0],['secondSoul','secondSoulRings',1]] as const){
  if((index===1&&p.isTwinSoul!==true)||p[soulKey]?.name!=='金龙王')continue;
  const skills=GOLD_KING_BASE_SKILLS.map((_,i)=>goldSkill(p,i,index)!.name);
  const rings=(p[ringKey]||[]).map((r:any,i:number)=>{const s=goldSkill(p,i,index);if(!s)return r;return r.skillName===s.name&&r.skillDesc===s.desc&&r.skillType===s.skillType?r:{...r,skillName:s.name,skillDesc:s.desc,skillType:s.skillType};});
  if(JSON.stringify(p[soulKey].soulSkills)!==JSON.stringify(skills)||rings.some((r:any,i:number)=>r!==p[ringKey]?.[i]))out={...out,[soulKey]:{...p[soulKey],soulSkills:skills},[ringKey]:rings};
 }
 return out;
}
