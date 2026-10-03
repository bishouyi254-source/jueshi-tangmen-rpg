import {goldSkill,goldEvolutions} from './goldKing';
import {__fbClone,__fbAdd,__fbShield,__fbHeal,__fbDirect} from './fierceEffects';
export function goldSkillReady(p:any,battle:any,slot:number,soul=0){const s=goldSkill(p,slot,soul);return !s?'无效金龙王魂技':(battle?.cooldowns?.[s.key]||0)>(battle?.turn||0)?'魂技冷却中':'';}
export function applyGoldKingSkill(p:any,state:any,battle:any,slot:number,soul:number,damage:number,rng=Math.random){
 const skill=goldSkill(p,slot,soul),reason=goldSkillReady(p,battle,slot,soul);if(reason||!skill)return {reason,next:state,battle,logs:[],damage:0};
 const next=__fbClone(state),logs:string[]=[],actor=next.actors.player,enemy=next.actors.enemy;
 if(actor.hp<=0||enemy.hp<=0)return {reason:'战斗已结束',next:state,battle,logs:[],damage:0};
 const effect=(key:string,id:string,type:string,value:number,turns:number,negative=false)=>__fbAdd(next,key,{id,type,value,turns,negative,label:skill.name},logs);
 const cleanse=(key:string,negative=true)=>{for(const [id,e] of Object.entries(next.actors[key].effects) as any)if(!!e.negative===negative)delete next.actors[key].effects[id];logs.push(skill.name+'：'+(negative?'净化负面状态':'移除正面状态'));};
 let direct=true,mul=1;
 if(!skill.forbidden){
  if(slot===0){for(const type of ['attackUp','defenseUp','speedUp','spiritUp'])effect('player','goldBody:'+type,type,.2,3);direct=false;}
  if(slot===1){effect('player','goldDominion','goldDirectReduction',.25,2);effect('player','goldCounter','goldCounter',.5,2);direct=false;}
  if(slot===3){for(const key of Object.keys(next.actors).filter(k=>k!=='enemy')){effect(key,'goldRealm:attack','attackUp',.2,3);effect(key,'goldRealm:defense','defenseUp',.2,3);}direct=false;}
  if(slot===4)mul=1.25;if(slot===5)mul=1.35;
  if(slot===7){__fbShield(next,'player',.06,logs);cleanse('player');direct=false;}
  if(slot===8)mul=1.5;
  if(slot===6)direct=false;
 }else{mul=slot===0?1.15:slot===2?1.25:slot===4?1.2:slot===5?1.3:slot===7?1.4:slot===8?1.5:1;if(slot===0)cleanse('player');if(slot===5)cleanse('enemy',false);}
 let lost=0;
 if(direct){const hit=__fbDirect(next,'enemy',Math.max(1,Math.round(damage*mul)),{attacker:'player',direct:true});Object.assign(next,hit.next);logs.push(...hit.logs);lost=hit.lost;}
 if(next.actors.player.hp>0){
  if((!skill.forbidden&&slot===8)||(skill.forbidden&&slot===8))effect('player','goldRisk','vulnerable',.1,1,true);
  if(skill.forbidden&&slot===2)__fbHeal(next,'player',Math.min(lost*.2,next.actors.player.maxHp*.03),logs,'吸血');
  if(skill.forbidden&&slot===3){effect('player','goldCharge:attack','attackUp',.2,2);effect('player','goldCharge:defense','defenseUp',.2,2);}
 }
 if(next.actors.enemy.hp>0&&next.actors.player.hp>0){
  if((skill.forbidden&&slot===1)||(!skill.forbidden&&slot===2&&rng()<.3)||(!skill.forbidden&&slot===5&&rng()<.2))effect('enemy','goldStun','stun',0,1,true);
  if(skill.forbidden&&slot===7)effect('enemy','goldPressure','attackDown',.15,2,true);
 }
 return {reason:'',next,logs,damage:lost,battle:{...battle,cooldowns:{...battle?.cooldowns,[skill.key]:(battle?.turn||0)+skill.cooldown+1}}};
}
export function applyBloodTransform(p:any,state:any){const next=__fbClone(state),rank=goldEvolutions(p).state,logs:string[]=[];if(!rank)return {reason:'血龙变尚未进化',next:state,logs};__fbAdd(next,'player',{id:'bloodTransform',type:'attackUp',value:.1+rank*.05,turns:2,label:'血龙变'},logs);__fbAdd(next,'player',{id:'bloodTransformRisk',type:'vulnerable',value:.1,turns:2,negative:true,label:'血龙变易伤'},logs);return {reason:'',next,logs};}
