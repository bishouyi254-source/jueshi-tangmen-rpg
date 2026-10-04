import {silverSkill,silverRanks} from './silverKing';
import {__fbClone,__fbAdd,__fbShield,__fbHeal,__fbDirect} from './fierceEffects';
export function silverSkillReady(p:any,b:any,slot:number,index=0){const s=silverSkill(p,slot,index);return !s?'无效银龙王魂技':(b?.cooldowns?.[s.key]||0)>(b?.turn||0)?'魂技冷却中':'';}
export function applySilverSkill(p:any,state:any,battle:any,slot:number,index:number,damage:number,rng=Math.random,twinRate=0){const skill=silverSkill(p,slot,index),reason=silverSkillReady(p,battle,slot,index);if(reason||!skill)return {reason,next:state,battle,logs:[],damage:0};const next=__fbClone(state),logs:string[]=[],a=next.actors.player,e=next.actors.enemy;if(a.hp<=0||e.hp<=0)return {reason:'战斗已结束',next:state,battle,logs,damage:0};const add=(key:string,id:string,type:string,value:number,turns:number,negative=false)=>__fbAdd(next,key,{id,type,value,turns,negative,label:skill.name},logs);let lost=0;
 if(slot===0)add('player','silverTide','spiritUp',.15,3);
 if(slot===1){add('player','silverMastery','spiritUp',.2,2);add('player','silverDefense','defenseUp',.2,2);}
 if(slot===3){__fbShield(next,'player',.06,logs);for(const [id,x] of Object.entries(a.effects) as any)if(x.negative)delete a.effects[id];logs.push('元素之杖净化负面状态。');}
 if(![0,1,3,6].includes(slot)){const mult=slot===2?1.15:slot===4?1.2:slot===7?1.4:slot===8?1.5:1;const hit=__fbDirect(next,'enemy',Math.max(1,Math.round(damage*mult)),{attacker:'player',direct:true,silverSkill:true,twinRate});Object.assign(next,hit.next);logs.push(...hit.logs);lost=hit.lost;}
 if(next.actors.enemy.hp>0&&next.actors.player.hp>0){if(slot===4)add('enemy','silverStorm','dot',Math.min(Math.round(damage*.15),Math.floor(e.maxHp*.03)),2,true);if(slot===5&&rng()<.2+silverRanks(p).body.spirit*.05)add('enemy','silverSpace','stun',0,1,true);}
 if(slot===8&&next.actors.player.hp>0)__fbHeal(next,'player',next.actors.player.maxHp*.03,logs);
 return {reason:'',next,logs,damage:lost,battle:{...battle,cooldowns:{...battle?.cooldowns,[skill.key]:(battle?.turn||0)+skill.cooldown+1}}};}
