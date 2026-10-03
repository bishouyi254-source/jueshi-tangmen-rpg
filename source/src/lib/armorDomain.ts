import {armorTier,dragonProgress} from './dragonLegend';
export type ArmorDomainState={used:boolean;turns:number;style:string;tier:3|4;skipTick:boolean};
export function readArmorDomain(raw:any):ArmorDomainState{
 return {used:raw?.used===true,turns:Math.min(raw?.tier===4?4:3,Math.max(0,Math.floor(Number(raw?.turns)||0))),tier:raw?.tier===4?4:3,style:['attack','defense','control','support'].includes(raw?.style)?raw.style:'attack',skipTick:raw?.skipTick===true};
}
export function startArmorDomain(player:any,state:any,mana:number,maxMana:number,otherDomain:boolean){
 const s=readArmorDomain(state),d=dragonProgress(player),cost=Math.ceil(maxMana*.15);
 const reason=!d.equipped||armorTier(player)<3?'需要装备三字套装':s.used?'本场已使用斗铠领域':otherDomain?'已有领域生效，请先关闭':mana<cost?'魂力不足':'';
 return reason?{state:s,cost:0,reason}:{state:{used:true,turns:armorTier(player)>=4?4:3,tier:armorTier(player)>=4?4:3,style:d.style,skipTick:true},cost,reason:''};
}
export function finishArmorDomainAction(state:any,hp:number,maxHp:number,enemyHp:number){
 const s=readArmorDomain(state);
 if(hp<=0||enemyHp<=0)return {state:{...s,turns:0,skipTick:false},heal:0};
 if(!s.turns)return {state:s,heal:0};
 if(s.skipTick)return {state:{...s,skipTick:false},heal:0};
 const heal=s.style==='support'?Math.min(Math.max(0,maxHp-hp),Math.floor(maxHp*(s.tier===4?.02:.01))):0;
 return {state:{...s,turns:s.turns-1},heal};
}
export function armorDomainMultiplier(state:any,kind:'skill'|'incoming'|'speed'){
 const s=readArmorDomain(state);if(!s.turns)return 1;
 const boost=s.tier===4?.2:.1;return kind==='skill'&&s.style==='attack'?1+boost:kind==='incoming'&&s.style==='defense'?1-boost:kind==='speed'&&s.style==='control'?1+boost:1;
}
export const ARMOR_DOMAIN_NAMES={attack:'锋芒',defense:'守御',control:'疾影',support:'生息'};
export const ARMOR_DOMAIN_EFFECTS={attack:'直接攻击魂技伤害+10%',defense:'直接受击伤害减少10%',control:'速度+10%',support:'后续行动结束恢复最大气血1%（最多3次）'};

export function armorDomainDescription(style:string,tier:number){return tier>=4?({attack:"直接攻击魂技伤害+20%",defense:"直接受击伤害减少20%",control:"速度+20%",support:"后续行动结束恢复最大气血2%（最多4次）"})[style]:ARMOR_DOMAIN_EFFECTS[style];}
