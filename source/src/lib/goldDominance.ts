import {hasGoldKing,goldSeals} from './goldKing';
import {ABYSS_NODES} from './abyssFrontier';
export const GOLD_BLOOD_CAP=2000;
const natural=(x:any)=>Number.isFinite(x)?Math.max(0,Math.floor(x)):0;
export function readGoldBlood(value:any){return {version:1,points:Math.min(GOLD_BLOOD_CAP,natural(value?.points)),claimed:Array.isArray(value?.claimed)?[...new Set(value.claimed.filter((x:any)=>typeof x==='string'&&x.length<100))].slice(0,2000):[]};}
export function normalizeGoldBlood(p:any){if(!p)return p;const v=readGoldBlood(p.goldBlood);return JSON.stringify(p.goldBlood)===JSON.stringify(v)?p:{...p,goldBlood:v};}
export function goldBloodBonuses(p:any){const points=hasGoldKing(p)?readGoldBlood(p.goldBlood).points:0,steps=Math.floor(points/100);return {hp:steps*.01,attack:steps*.005,points,steps};}
export function goldMeleeRate(p:any){const seals=goldSeals(p);return !hasGoldKing(p)?0:seals>=18?.02:seals>=12?.015:seals>=6?.01:.005;}
export function goldDomainStats(seals:number){return seals>=18?{pressure:.2,penetration:.25,rage:.2,risk:.1}:seals>=12?{pressure:.15,penetration:.2,rage:.15,risk:.08}:seals>=6?{pressure:.1,penetration:.15,rage:.1,risk:.05}:null;}
export type GoldBattle={version:1;id:string;maxHp:number;meleeRate:number;seals:number;turns:number;reward:number;settled:boolean;reason:string};
// Regions/years define progression bands; weak monsters never inherit a reward merely from battleType.
export function goldRewardEligibility(p:any,config:any){
 const enemy=config?.enemy||{},meta=config?.meta||{},type=meta.challengeType==='tea-companion'?'tea-companion':config?.battleType,level=natural(p?.level);
 if(!hasGoldKing(p))return {reward:0,reason:'未持有金龙王'};
 if(meta.shadow||meta.ascension||meta.training||meta.summon||['arena','academy-exam','shrek-exam','spirit-tower'].includes(type))return {reward:0,reason:'训练、召唤、轮回之影或契约战斗不提供霸血'};
 if(meta.valley){const trial=meta.valley,node=String(trial.node||''),match=/^valley-(\d)-(\d)$/.exec(node);if(!match||trial.seal>0)return {reward:0,reason:'封印试炼不提供霸血'};const zone=Number(match[1]),rank=Number(match[2]),min=[60,100,140][zone];return level>=min&&level<min+40?{reward:rank===2?10:rank===1?3:1,reason:''}:{reward:0,reason:'龙谷敌人低于当前成长阶段'};}
 if(meta.abyss){const n=ABYSS_NODES.find(n=>n.id===meta.abyss.node),tier=meta.abyss.mode==='divine'?100:99;return n&&level>=tier&&(tier===100||level===99)?{reward:n.rank===2?10:n.rank===1?3:1,reason:''}:{reward:0,reason:'深渊难度低于当前成长阶段'};}
 const bosses=['fierce-beast','god-realm','divine-avatar','divine-ditian','divine-beast','sea-god','tea-companion'];
 const minYears=level<20?10:level<30?100:level<50?1000:level<70?10000:level<100?100000:1000000;
 if(enemy.years>=minYears)return {reward:bosses.includes(type)?10:meta.elite||type==='mountain-dungeon'?3:['hunt','encounter'].includes(type)?1:0,reason:''};
 // God bosses may have no soul-beast age. Their tier/required level must match explicitly.
 const required=natural(enemy.level||meta.enemyLevel||meta.requiredLevel);
 if(bosses.includes(type)&&required>=Math.max(1,level-10))return {reward:10,reason:''};
 return {reward:0,reason:'敌人年限或等级低于当前成长阶段'};
}
export function createGoldBattle(p:any,config:any,maxHp:number,id:string):GoldBattle|undefined{if(!hasGoldKing(p))return;const e=goldRewardEligibility(p,config),seals=goldSeals(p);return {version:1,id,maxHp:Math.max(1,Number.isFinite(maxHp)?maxHp:1),meleeRate:goldMeleeRate(p),seals,turns:goldDomainStats(seals)?3:0,reward:e.reward,settled:false,reason:e.reason};}
export function readGoldBattle(value:any):GoldBattle|undefined{if(value?.version!==1||typeof value.id!=='string'||!value.id||value.id.length>=100)return;return {...value,maxHp:Math.max(1,Number.isFinite(value.maxHp)?value.maxHp:1),meleeRate:[.005,.01,.015,.02].includes(value.meleeRate)?value.meleeRate:.005,seals:Math.min(18,natural(value.seals)),turns:Math.min(3,natural(value.turns)),reward:[1,3,10].includes(value.reward)?value.reward:0,settled:value.settled===true};}
export function settleGoldBlood(p:any,battle:GoldBattle|undefined,phase:string){if(!hasGoldKing(p)||phase!=='victory'||!battle||battle.settled||!battle.reward)return p;const old=readGoldBlood(p.goldBlood);if(old.points>=GOLD_BLOOD_CAP||old.claimed.includes(battle.id))return p;return {...p,goldBlood:{...old,points:Math.min(GOLD_BLOOD_CAP,old.points+battle.reward),claimed:[...old.claimed,battle.id]}};}
export function goldMeleeExtra(battle:GoldBattle|undefined,damage:number,defense:number){if(!battle||!Number.isFinite(damage)||damage<=0)return 0;return Math.max(0,Math.min(damage*.2,battle.maxHp*battle.meleeRate*500/(Math.max(0,defense)+500)));}
export function goldPenetration(battle:GoldBattle|undefined,other=0){const domain=battle&&battle.turns>0?goldDomainStats(battle.seals):null;return Math.min(.6,Math.max(0,other)+(domain?.penetration||0));}
const ids=['goldPrison:pressure','goldPrison:rage','goldPrison:risk'];
export function syncGoldDomain(state:any,battle:GoldBattle|undefined){if(!state)return;const stats=battle&&battle.turns>0?goldDomainStats(battle.seals):null,player=state.actors.player,enemy=state.actors.enemy;
 for(const a of [player,enemy])for(const id of ids)delete a.effects[id];
 if(!stats||player.hp<=0||enemy.hp<=0)return;
 const effect=(actor:any,id:string,type:string,value:number,negative=false)=>{actor.effects[id]={id,type,value,turns:battle!.turns,born:actor.action,manual:true,negative,label:'金龙镇狱领域'};};
 effect(enemy,ids[0],'attackDown',stats.pressure,true);effect(player,ids[1],'directDamageUp',stats.rage);effect(player,ids[2],'goldDirectVulnerable',stats.risk,true);
}
export function goldDomainDescription(p:any){const d=goldDomainStats(goldSeals(p));return !d?'第六道封印解锁：入战自动展开，每场一次，持续3次行动。':`入战自动展开3次行动：敌方攻击降低${d.pressure*100}%、忽略${d.penetration*100}%防御、直接伤害提高${d.rage*100}%；受到直接伤害增加${d.risk*100}%。总破甲上限60%。`;}
