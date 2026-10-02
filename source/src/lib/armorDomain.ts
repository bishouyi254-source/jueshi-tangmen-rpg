import {armorTier,dragonProgress} from './dragonLegend';
export type ArmorDomainState={used:boolean;turns:number;style:string;skipTick:boolean};
export function readArmorDomain(raw:any):ArmorDomainState{
 return {used:raw?.used===true,turns:Math.min(3,Math.max(0,Math.floor(Number(raw?.turns)||0))),style:['attack','defense','control','support'].includes(raw?.style)?raw.style:'attack',skipTick:raw?.skipTick===true};
}
export function startArmorDomain(player:any,state:any,mana:number,maxMana:number,otherDomain:boolean){
 const s=readArmorDomain(state),d=dragonProgress(player),cost=Math.ceil(maxMana*.15);
 const reason=!d.equipped||armorTier(player)<3?'需要装备三字套装':s.used?'本场已使用斗铠领域':otherDomain?'已有领域生效，请先关闭':mana<cost?'魂力不足':'';
 return reason?{state:s,cost:0,reason}:{state:{used:true,turns:3,style:d.style,skipTick:true},cost,reason:''};
}
export function finishArmorDomainAction(state:any,hp:number,maxHp:number,enemyHp:number){
 const s=readArmorDomain(state);
 if(hp<=0||enemyHp<=0)return {state:{...s,turns:0,skipTick:false},heal:0};
 if(!s.turns)return {state:s,heal:0};
 if(s.skipTick)return {state:{...s,skipTick:false},heal:0};
 const heal=s.style==='support'?Math.min(Math.max(0,maxHp-hp),Math.floor(maxHp*.01)):0;
 return {state:{...s,turns:s.turns-1},heal};
}
export function armorDomainMultiplier(state:any,kind:'skill'|'incoming'|'speed'){
 const s=readArmorDomain(state);if(!s.turns)return 1;
 return kind==='skill'&&s.style==='attack'?1.1:kind==='incoming'&&s.style==='defense'?.9:kind==='speed'&&s.style==='control'?1.1:1;
}
export const ARMOR_DOMAIN_NAMES={attack:'锋芒',defense:'守御',control:'疾影',support:'生息'};
export const ARMOR_DOMAIN_EFFECTS={attack:'直接攻击魂技伤害+10%',defense:'直接受击伤害减少10%',control:'速度+10%',support:'后续行动结束恢复最大气血1%（最多3次）'};
