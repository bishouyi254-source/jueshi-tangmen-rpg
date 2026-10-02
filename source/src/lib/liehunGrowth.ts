export type LiehunLedger = { id: string; eligible: boolean; damage: number; settled?: boolean };
export type NianBonus = { totalSpirit: number; totalDamageDealt: number; count: number; lastBattleId?: string };
export function hasLiehun(p: any): boolean {
  return p?.martialSoul?.name === '裂魂神戟' || (p?.isTwinSoul === true && p?.secondSoul?.name === '裂魂神戟');
}
export function readNianBonus(value: any): NianBonus {
  const n = (x: any) => Number.isFinite(x) && x >= 0 ? x : 0;
  return { totalSpirit: Math.floor(n(value?.totalSpirit)), totalDamageDealt: n(value?.totalDamageDealt),
    count: Math.floor(n(value?.count)), lastBattleId: typeof value?.lastBattleId === 'string' ? value.lastBattleId : undefined };
}
export function createLiehunLedger(p: any, meta: any = {}, id: string): LiehunLedger | undefined {
  if (!hasLiehun(p)) return undefined;
  return { id, damage: 0, eligible: !meta.ascension && !meta.shadow };
}
export function recordLiehunHit(ledger: LiehunLedger | undefined, lost: number, attacker: string): LiehunLedger | undefined {
  if (!ledger?.eligible || ledger.settled || attacker !== 'player' || !Number.isFinite(lost) || lost <= 0) return ledger;
  const damage = ledger.damage + lost;
  return Number.isFinite(damage) ? { ...ledger, damage } : ledger;
}
export function settleLiehunGrowth<T extends { nianBonus?: NianBonus }>(p: T, ledger: LiehunLedger | undefined, phase: string): T {
  if (!hasLiehun(p) || phase !== 'victory' || !ledger?.eligible || !ledger.id || !Number.isFinite(ledger.damage) || ledger.damage < 0) return p;
  const old = readNianBonus(p.nianBonus);
  if (old.lastBattleId === ledger.id) return p;
  const gained = Math.floor(ledger.damage / 1e16);
  return { ...p, nianBonus: { totalSpirit: old.totalSpirit + gained, totalDamageDealt: old.totalDamageDealt + ledger.damage,
    count: old.count + 1, lastBattleId: ledger.id } };
}
