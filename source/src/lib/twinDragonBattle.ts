import {twinSkillReady,twinBaseDamage,twinRate} from './twinDragon';
import {goldPenetration} from './goldDominance';
import {__fbClone,__fbAdd,__fbDirect,__fbDefense} from './fierceEffects';
export function applyTwinSkill(p:any,state:any,b:any,id:string,turn:number,maxMana:number,attack:number,spirit:number,defense:number,critRate:number,critDmg:number,g:any,s:any,rng=Math.random,skillMultiplier=1){
 const a=state?.actors?.player,e=state?.actors?.enemy,ready=twinSkillReady(p,b,id,turn,a?.mana||0,maxMana,g,s),fail=(reason:string)=>({reason,next:state,battle:b,logs:[] as string[],damage:0,isCrit:false});
 if(ready.reason)return fail(ready.reason);if(!a||!e||a.hp<=0||e.hp<=0)return fail('战斗已结束');
 const base=twinBaseDamage(p,attack,spirit,__fbDefense(state,'enemy',defense));if(id!=='guard'&&!base)return fail('需要两武魂各有第一至第六攻击魂技');
 const next=__fbClone(state),logs:string[]=[],actor=next.actors.player;actor.mana-=ready.cost;
 const battle={...b,used:b.used||id==='break',cooldowns:{...b.cooldowns,...(id==='break'?{}:{[id]:turn+ready.skill!.cooldown+1})}};
 if(id==='guard'){
  const amount=Math.min(Math.floor(actor.maxHp*.06)-actor.shield,Math.floor(actor.maxHp*(ready.stage===5?.05:.04)));
  if(amount>0){actor.shield+=amount;actor.twinShieldAmount=(actor.twinShieldAmount||0)+amount;actor.twinShieldTurns=2;}
  __fbAdd(next,'player',{id:'twinGuard',type:'goldDirectReduction',value:ready.stage===5?.12:.1,turns:1,label:'双龙护体减伤'},logs);
  logs.push('双龙护体：护盾新增'+Math.max(0,amount)+'，总护盾不超过6%气血，2次敌方行动后剩余联动护盾消失；本次不攻击。');
  return {reason:'',next,battle,logs,damage:0,isCrit:false};
 }
 const isCrit=rng()<Math.min(1,Math.max(0,critRate)),mult=id==='break'?1.6:1.2+(ready.stage-3)*.1;
 const effectiveDef=__fbDefense(state,'enemy',defense),domainPen=g?.turns>0?goldPenetration(g):0,penetrationMultiplier=(effectiveDef+500)/(effectiveDef*(1-domainPen)+500);
 const damage=Math.max(1,Math.round(base*penetrationMultiplier*mult*(isCrit?1.5+Math.max(0,critDmg):1)*Math.max(1,skillMultiplier)));
 const hit=__fbDirect(next,'enemy',damage,{attacker:'player',direct:true,silverSkill:true,twinRate:twinRate(p,g,s)});logs.push(...hit.logs);
 if(id==='break'&&hit.next.actors.player.hp>0)__fbAdd(hit.next,'player',{id:'twinRisk',type:'goldDirectVulnerable',value:.1,turns:1,negative:true,label:'破界直接易伤'},logs);
 logs.push(ready.skill!.name+'（游戏原创）：D='+Math.round(base)+'，倍率'+mult.toFixed(2)+'，实际扣血'+hit.lost+'；不继承原魂技附带效果。');
 return {reason:'',next:hit.next,battle,logs,damage:hit.lost,isCrit};
}
