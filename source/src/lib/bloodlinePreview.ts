import {goldEvolutions} from './goldKing';
import {silverRanks,readSilverBlood} from './silverKing';
export function trueBodyPreview(p:any,index:number){const soul=index?p?.secondSoul:p?.martialSoul;const turns=({superDivine:7,divine:6,legendary:5,epic:4} as Record<string,number>)[soul?.quality]||3;return `真身基础消耗150魂力 · 当前品质持续${turns}回合 · 结束或主动关闭后冷却4回合；普通领域每个使消耗×2`;}
export function growthBenefit(king:'gold'|'silver',kind:string,id:string,rank:number){
 const pct=(n:number)=>(n*rank).toFixed(1).replace(/\.0$/,'')+'%';
 if(king==='silver'&&kind==='elements')return '银龙王魂技伤害 +'+pct(.5);
 const map:Record<string,string>=king==='gold'?{
 claw:`攻击 +${pct(2)} · 魂技伤害 +${pct(1)} · 忽略防御 ${pct(5)}`,
 body:`气血、防御、速度各 +${pct(2)}`,
 core:`魂力上限 +${pct(3)} · 每次行动恢复 ${pct(.5)} 魂力`,
 state:rank?`血龙变攻击 +${10+rank*5}% · 持续2次行动 · 易伤10%`:'血龙变未解锁',
 }:{body:`气血、防御各 +${pct(2)}`,spirit:`精神 +${pct(2)} · 禁锢概率 ${20+rank*5}%`,heart:`魂力上限 +${pct(3)} · 魂技消耗降低 ${pct(2)}`,space:`速度 +${pct(2)} · 忽略防御 ${pct(5)}`};
 return map[id]||'无路线收益';
}
export function growthRank(p:any,king:'gold'|'silver',kind:string,id:string,stored=false){
 return king==='gold'?(stored?Math.min(4,Math.max(0,Math.floor(p?.dragonBloodline?.evolutions?.[id]||0))):goldEvolutions(p)[id]):(stored?readSilverBlood(p?.silverBloodline):silverRanks(p))[kind][id];
}
