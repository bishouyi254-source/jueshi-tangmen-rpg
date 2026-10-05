export function hasJiYue(p:any):boolean {
  return p?.martialSoul?.name==='寂月仙剑'||(p?.isTwinSoul===true&&p?.secondSoul?.name==='寂月仙剑');
}
export function jiYueCount(p:any):number {
  const n=p?.jiYueVictories;return Number.isFinite(n)&&n>=0?Math.floor(n):0;
}
// 线性累计，无成长上限；以最终面板攻击作为统一入口，避免战斗再乘一次。
export function applyJiYueAttack(p:any,attack:number):number {
  return hasJiYue(p)?attack*(1+jiYueCount(p)*.01):attack;
}
export function settleJiYueVictory<T>(p:T,id:string|undefined,phase:string):T {
  if(!hasJiYue(p)||phase!=='victory'||!id||(p as any).jiYueLastBattleId===id)return p;
  return {...p,jiYueVictories:jiYueCount(p)+1,jiYueLastBattleId:id};
}
