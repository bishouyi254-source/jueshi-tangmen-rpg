/** 第三批成长规则。无副作用，旧档迁移可重复执行。 */
export const STAMINA_CAP = 10000;
export const GROWTH_RULES_VERSION = 3;

export type GrowthRules = {
  version: number;
  waterOfLifePct?: number;
  waterMigration?: 'not-taken' | 'topped-up' | 'current' | 'needs-review';
};

export function godLevelExp(level: number): number {
  return Math.round(10000000 * 3 ** Math.floor((Math.max(100, level) - 100) / 10) * 0.7);
}

export function shadowVictoryExp(level: number): number {
  return Math.max(1500, level ** 2 * 30);
}

export function freshGrowthRules(): GrowthRules {
  return { version: GROWTH_RULES_VERSION, waterOfLifePct: 0, waterMigration: 'not-taken' };
}

export function migrateGrowthRules<T extends Record<string, any>>(player: T): T {
  if (player.growthRules?.version >= GROWTH_RULES_VERSION) return player;
  const rules = freshGrowthRules();
  let bonus = player.consumableBonus;
  // 不根据总面板反推服用记录。汇总加成无法区分其他仙草与新版导入存档。
  if (player.consumableCounts?.waterOfLife === 1) {
    const pct = bonus?.allAttrPct;
    const tracked = player.growthRules?.waterOfLifePct;
    if (tracked === 2) {
      rules.waterOfLifePct = 2; rules.waterMigration = 'current';
    } else if (Number.isFinite(pct) && pct >= 0.4 && (tracked === 0.4 || pct < 2)) {
      bonus = { ...bonus, allAttrPct: pct + 1.6 };
      rules.waterOfLifePct = 2; rules.waterMigration = 'topped-up';
    } else {
      // ≥200%的汇总或损坏数据来源不明：保留原值，不重复发奖。
      rules.waterOfLifePct = undefined; rules.waterMigration = 'needs-review';
    }
  }
  const inventory = Array.isArray(player.inventory) ? player.inventory.map((item: any) =>
    item?.effect?.startsWith('water-of-life:') ? { ...item,
      effect: 'water-of-life:allAttr+200%',
      description: String(item.description || '').replace('40%', '200%') } : item) : player.inventory;
  return { ...player, inventory, consumableBonus: bonus, growthRules: rules,
    brokenBottlenecks: Array.isArray(player.brokenBottlenecks)
      ? [...new Set(player.brokenBottlenecks.filter((n: number) => Number.isInteger(n) && n >= 109 && n % 10 === 9))] : [] };
}

export function godBreakthroughError(p: any, lawType: string, requiredExp: number): string | undefined {
  if (!p) return '玩家不存在';
  const dt = p.divineTrial;
  if (!dt?.godLevelProgress?.unlocked) return '尚未解锁神级修炼';
  if (p.level < 100 || p.level % 10 !== 9) return '仅109/119/…瓶颈等级可突破';
  if (p.level >= dt.godLevelProgress.levelCap) return '已达当前神位等级上限';
  if (p.brokenBottlenecks?.includes(p.level)) return '该瓶颈已经突破';
  if (!Number.isFinite(p.exp) || p.exp < requiredExp) return '经验未满';
  if (lawType === 'chaos') return '混沌法则不用于突破';
  if (!dt.lawsFused?.[lawType]) return '尚未融合该法则';
  if (dt.lawsConsumedForBreakthrough?.includes(lawType)) return '该法则已用于突破';
}

export function applyGodBreakthrough<T extends Record<string, any>>(p: T, lawType: string, requiredExp: number, expectedLevel: number): T {
  if (p.level !== expectedLevel || godBreakthroughError(p, lawType, requiredExp)) return p;
  return { ...p, level: p.level + 1, exp: p.exp - requiredExp,
    brokenBottlenecks: [...(p.brokenBottlenecks || []), p.level],
    divineTrial: { ...p.divineTrial,
      lawsConsumedForBreakthrough: [...(p.divineTrial.lawsConsumedForBreakthrough || []), lawType] } };
}
