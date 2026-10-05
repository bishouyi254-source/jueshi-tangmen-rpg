import { DIVINE_TRIALS } from '@/data/divineTrials';
import type { IPlayer } from './gameStore';

/** 兼容旧版胜利后移除伴侣记录的存档；普通拒绝不是击败证据。 */
export function hasDefeatedHundun(p: Partial<IPlayer> | null | undefined): boolean {
  return !!(p?.hundunChaDefeated
    || p?.companions?.details?.['tc-hunduncha']?.hundunChaDefeated
    || p?.companions?.rejected?.includes('tc-hunduncha:permanent'));
}

/** 继承神位即可解锁；已解锁的法则与上限保持不变。 */
export function reconcileGodUnlock<T extends Partial<IPlayer>>(p: T): T {
  const next = hasDefeatedHundun(p) && !p.hundunChaDefeated ? { ...p, hundunChaDefeated: true } : p;
  if (!next.divineTrial?.inherited || next.divineTrial.godLevelProgress?.unlocked) return next;
  const tier = DIVINE_TRIALS.find(t => t.id === next.divineTrial!.chosenTrialId)?.tier || 'second';
  const levelCap = ({ supreme: 169, king: 159, first: 149, second: 139 })[tier] || 139;
  return { ...next, divineTrial: { ...next.divineTrial,
    godLevelProgress: { ...next.divineTrial.godLevelProgress, unlocked: true, currentTier: tier, levelCap },
  } };
}
