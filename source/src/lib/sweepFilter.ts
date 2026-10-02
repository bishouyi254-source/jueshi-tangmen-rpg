export type SweepFilterSummary = { destroyedRings: number; soldBones: number; soldCoins: number; keptRings: number; keptBones: number };
export function normalizeSweepYears(value: any): number {
  return Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER ? Math.floor(value) : 0;
}
/** 只接收本次掉落；已存在的背包、待吸收魂环不参与过滤。 */
export function filterSweepDrops<R extends { years: number }, B extends { soulBoneYears?: number; sellPrice?: number }>(
  rings: R[], items: B[], ringMin = 0, boneMin = 0,
): { rings: R[]; items: B[]; summary: SweepFilterSummary } {
  const summary = { destroyedRings: 0, soldBones: 0, soldCoins: 0, keptRings: 0, keptBones: 0 };
  const rmin = normalizeSweepYears(ringMin), bmin = normalizeSweepYears(boneMin);
  const keptRings = rings.filter(r => { if (rmin > 0 && r.years < rmin) { summary.destroyedRings++; return false; } return true; });
  const keptItems = items.filter(b => {
    if (!Number.isFinite(b.soulBoneYears) || b.soulBoneYears! < 0) return true;
    if (bmin > 0 && b.soulBoneYears! < bmin) {
      // 与手动出售一致；不可出售的物品保留，避免无偿丢失。
      if (!Number.isFinite(b.sellPrice) || b.sellPrice! <= 0) { summary.keptBones++; return true; }
      summary.soldBones++; summary.soldCoins += Math.floor(b.sellPrice!); return false;
    }
    summary.keptBones++; return true;
  });
  summary.keptRings = keptRings.length;
  return { rings: keptRings, items: keptItems, summary };
}
