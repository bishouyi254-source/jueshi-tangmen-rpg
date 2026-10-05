import {jiYueCount,applyJiYueAttack,settleJiYueVictory} from './jiYue';
import {readTwin,twinBonuses,createTwinBattle,settleTwin,extendTwinDomain} from './twinDragon';
import {elementSet,resonance,extremeMultipliers} from './attributeRules';
import {normalizeSilver,readSilverBlood,reincarnateSilver,silverBonuses,createSilverBattle,settleSilver,SILVER_ELEMENTS} from './silverKing';
import {normalizeGoldKing} from './goldKing';
import {normalizeGoldBlood,readGoldBlood,goldBloodBonuses,createGoldBattle,settleGoldBlood} from './goldDominance';
import {bloodlineProgress,valleyProgress,bloodlineBonuses,valleyAction,reincarnateBloodline,reincarnateValley} from './dragonBloodline';
import {abyssProgress,abyssAction,reincarnateAbyss} from './abyssFrontier';
import { STAMINA_CAP, godLevelExp, freshGrowthRules, migrateGrowthRules, godBreakthroughError, applyGodBreakthrough, type GrowthRules } from '@/lib/growthBatch3';
import { hasLiehun, readNianBonus, createLiehunLedger, settleLiehunGrowth, type LiehunLedger, type NianBonus } from '@/lib/liehunGrowth';
import { filterSweepDrops, normalizeSweepYears, type SweepFilterSummary } from '@/lib/sweepFilter';
import { hasDefeatedHundun, reconcileGodUnlock } from '@/lib/godUnlock';
import {dragonAction,dragonProgress,armorBonuses,evolutionMultiplier,reincarnateDragon} from '@/lib/dragonLegend';
import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import { scopedStorage, logger } from '@lark-apaas/client-toolkit-lite';
import { toast } from 'sonner';
import { ACHIEVEMENTS, type IAchievement } from '@/data/achievements';
import { MOCK_MARTIAL_SOULS, type IMartialSoul, getSoulElement, getCultivationAttr, generateSoulSkills, getSoulDepartment, evolveMartialSoul } from '@/data/martialsouls';
import { MOCK_ITEMS, MATERIAL_ITEMS, type IItem, type SoulGuideType, CRAFT_FIXED_STATS, CRAFT_MATERIAL_REQ, CRAFT_ATTR_CAP_PER_LEVEL, CORE_GEMS, getConsumableExtra, getConsumableById, type ConsumableExtra, ICE_FIRE_IMMORTAL_GRASSES, HOLY_GRASSES, getSpecialItemById } from '@/data/items';
import { MOCK_RECRUITS, type IRecruit } from '@/data/recruits';
import { SEA_GOD_MEMBERS } from '@/data/seaGodPavilion';
import { GOD_REALM_BOSSES, DIVINE_CORE_ITEM } from '@/data/godRealm';
import { getRingQualityFromYears, generateBeastByYearRange, rollSoulBoneDrop, getSkillNameForBeast } from '@/data/soulbeasts';
import { SOUL_SPIRIT_POOL, SPIRIT_MAJOR_REALMS, calcSpiritUpgradeCost, calcSpiritBreakthroughCost, getSpiritStats, SPIRIT_SLOT_UNLOCK_LEVELS, type ISoulSpirit } from '@/data/soulSpirits';
import { FIERCE_BEASTS_STAR_LAKE, FIERCE_BEASTS_FROZEN, type FierceBeast, getFierceBeastById } from '@/data/fierceBeasts';
import { TEA_CITY_CHARACTERS, TEA_CITY_NODES, type TeaCityCharacter } from '@/data/teaCity';

/** 根据玩家等级返回可契约的魂灵最大数量 */
export function getMaxSpiritSlots(level: number): number {
  let count = 0;
  for (const lv of SPIRIT_SLOT_UNLOCK_LEVELS) {
    if (level >= lv) count++;
    else break;
  }
  return Math.min(count, 4);
}
import { DIVINE_TRIALS, DIVINE_ARTIFACTS, TRIAL_DRAW_WEIGHTS, type IDivineTrial, type ITrialExam, getTrialById, getArtifactByDeity, getArtifactById } from '@/data/divineTrials';
import { formatNumber } from '@/lib/utils';

export const SAVE_KEY = '__game_douluo2_save';
export const SAVE_VERSION = 7; // v13.0 删除普通/困难魂核，统一阴阳双魂核体系；吸收时无条件重算魂技名
export const EXPLORE_SAVE_KEY = '__game_douluo2_exploration'; // 探索状态持久化，防止切后台/掉进程丢失魂环魂骨
export const BATTLE_REWARDS_KEY = '__game_douluo2_battle_rewards'; // 战斗胜利奖励持久化，防止未点收起就刷新丢失
export const BACKUP_SAVE_KEY = '__game_douluo2_save_backup'; // 存档备份键，写入主存档成功后同步写入备份，主存档损坏时自动回退
export const NATIVE_BACKUP_KEY = '__game_douluo2_native_backup'; // 🔴 原生 localStorage 终极兜底备份（不依赖 scopedStorage 前缀，防止 appId 变化导致丢档）
// v3→v4：魂骨倍率曲线重新调整（十万年以上大幅压缩，10万年80x→100万年120x，上限150x）+ 魂兽全局属性提升
// v2→v3: 修复 GameShell 裸写 localStorage 缺 saveVersion 导致读档清档的致命 bug

// ========== 存档读写工具：scopedStorage + 原生 localStorage 双写双读 ==========
// 优先使用 scopedStorage（按 appId 隔离），同时写入原生 localStorage 作为终极兜底
// 防止 appId 变化 / scopedStorage 异常 / 平台 SDK 升级等极端情况导致丢档
function safeRead(key: string): string | null {
  // 1. 优先读 scopedStorage（隔离版）
  try {
    const v = scopedStorage.getItem(key);
    if (v && v.length > 100) return v;
  } catch { /* ignore */ }
  // 2. 兜底读原生 localStorage（不带前缀，终极保命）
  try {
    const v = localStorage.getItem(key);
    if (v && v.length > 100) return v;
  } catch { /* ignore */ }
  // 3. 再兜底读带前缀的原生 key（scopedStorage 内部实现可能直接写原生 localStorage 带 appId 前缀）
  try {
    const allKeys = Object.keys(localStorage);
    for (const k of allKeys) {
      if (k.endsWith(key) && k.length > key.length) {
        const v = localStorage.getItem(k);
        if (v && v.length > 100) return v;
      }
    }
  } catch { /* ignore */ }
  return null;
}

function safeWrite(key: string, value: string): boolean {
  let ok = false;
  // 1. 写 scopedStorage（主）
  try {
    scopedStorage.setItem(key, value);
    ok = true;
  } catch (e) {
    logger.error(`safeWrite scopedStorage ${key} failed:`, String(e));
  }
  // 2. 同步写原生 localStorage 终极兜底（不带前缀）
  try {
    localStorage.setItem(key, value);
    ok = true;
  } catch (e) {
    logger.error(`safeWrite native localStorage ${key} failed:`, String(e));
  }
  return ok;
}

/** 简单校验和：计算存档内容的快速哈希，用于完整性检测 */
function calcChecksum(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

/** 带校验和的写入：内容末尾追加 __checksum 标记，读档时验证完整性 */
function safeWriteWithChecksum(key: string, value: string): boolean {
  const checksum = calcChecksum(value);
  const packed = value + '\n__checksum:' + checksum;
  return safeWrite(key, packed);
}

/** 带校验和的读取：验证 checksum，失败返回 null */
function safeReadWithChecksum(key: string): string | null {
  const raw = safeRead(key);
  if (!raw) return null;
  const checksumMarker = '\n__checksum:';
  const idx = raw.lastIndexOf(checksumMarker);
  if (idx === -1) {
    // 旧存档没有 checksum，视为有效（兼容）
    return raw;
  }
  const content = raw.slice(0, idx);
  const storedChecksum = raw.slice(idx + checksumMarker.length).trim();
  const actualChecksum = calcChecksum(content);
  if (storedChecksum !== actualChecksum) {
    logger.error(`save checksum mismatch for ${key}: stored=${storedChecksum} actual=${actualChecksum}`);
    return null;
  }
  return content;
}

function safeRemove(key: string): void {
  try { scopedStorage.removeItem(key); } catch { /* ignore */ }
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

// 品质相关
export const QUALITY_LABEL: Record<string, string> = {
  // 新四级品质
  epic: '史诗',
  legendary: '传说',
  divine: '神级',
  superDivine: '超神级',
  supremeDivine: '至高神级',
  // 旧品质（向后兼容，物品/招募角色仍使用）
  common: '普通',
  rare: '稀有',
  fine: '精良',
};

export const QUALITY_COLOR: Record<string, string> = {
  // 新四级品质（纯色色值，可用于文字/边框；背景渐变请用 QUALITY_GRADIENT）
  epic: '#a855f7',
  legendary: '#f59e0b',
  divine: '#ef4444',
  superDivine: '#fbbf24',
  supremeDivine: '#fde047',
  // 旧品质（向后兼容，物品/招募角色仍使用）
  common: '#9ca3af',
  rare: '#22c55e',
  fine: '#3b82f6',
};

/** 品质渐变背景色（用于卡片背景/按钮等需要渐变的场景） */
export const QUALITY_GRADIENT: Record<string, string> = {
  epic: 'linear-gradient(135deg, #a855f7, #7c3aed)',
  legendary: 'linear-gradient(135deg, #f59e0b, #d97706)',
  divine: 'linear-gradient(135deg, #ef4444, #dc2626)',
  superDivine: 'linear-gradient(135deg, #fbbf24, #ef4444, #a855f7, #3b82f6)',
  common: 'linear-gradient(135deg, #9ca3af, #6b7280)',
  rare: 'linear-gradient(135deg, #22c55e, #16a34a)',
  fine: 'linear-gradient(135deg, #3b82f6, #2563eb)',
};

export const RING_COLOR_MAP: Record<string, string> = {
  white: '#f0f0f0',
  yellow: '#fbbf24',
  purple: '#a855f7',
  black: '#000000',
  red: '#B22222',
  gold: '#fcd34d',
  blueWhite: '#60d2ff', // 天梦冰蚕百万年专属：纯蓝色（无金色）
};

/** 魂环展示色（用于文字、边框、背景底色等）
 *  万年魂环展示用深灰色，保证深紫蓝背景上有微弱轮廓但无白色/银灰色 */
export const RING_DISPLAY_COLOR: Record<string, string> = {
  white: '#f0f0f0',
  yellow: '#fbbf24',
  purple: '#a855f7',
  black: '#1a1a1a',
  red: '#B22222',
  gold: '#fcd34d',
  blueWhite: '#60d2ff',
};

export const RING_LABEL: Record<string, string> = {
  white: '十年',
  yellow: '百年',
  purple: '千年',
  black: '万年',
  red: '十万年',
  gold: '百万年',
  blueWhite: '百万年',
};

// 大境界
export const REALM_LIST = [
  { min: 1, max: 10, name: '魂士' },
  { min: 11, max: 20, name: '魂师' },
  { min: 21, max: 30, name: '大魂师' },
  { min: 31, max: 40, name: '魂尊' },
  { min: 41, max: 50, name: '魂宗' },
  { min: 51, max: 60, name: '魂王' },
  { min: 61, max: 70, name: '魂帝' },
  { min: 71, max: 80, name: '魂圣' },
  { min: 81, max: 90, name: '魂斗罗' },
  { min: 91, max: 99, name: '封号斗罗' },
];

export function getRealm(level: number): string {
  const r = REALM_LIST.find((x) => level >= x.min && level <= x.max);
  return r?.name ?? '魂士';
}

// 彩蛋境界名称（99级之上）
export const EASTER_REALM_NAMES = ['极限斗罗', '准半神', '半神', '准神'];

/** 获取当前彩蛋境阶段位对应的境界名 */
export function getEasterRealmName(stage: number): string {
  return EASTER_REALM_NAMES[Math.max(0, Math.min(3, stage))] || '极限斗罗';
}

/** 获取当前彩蛋境界所需经验（每阶500万） */
export function getEasterRealmExp(stage: number): number {
  if (stage >= 3) return Infinity; // 准神为上限
  return 5000000; // 500万
}

// 境界显示（新规则：准X在x9级显示，x0级及以后显示正式境界）
// 0-8级：魂士；9级：准魂师；10级：魂师 ... 79级：准魂斗罗；80级：魂斗罗；89级：准封号斗罗
// 90-94级：封号斗罗；95-97级：超级斗罗；98级：巅峰斗罗；99级：极限斗罗；彩蛋境界在99级后追加括号
// 100级且已继承神位：显示神位名称（如「至高·盘古」「神王·修罗之神」）；100级未继承：显示「百级魂师」
// 封号斗罗阶段若有自定义封号，显示「XX斗罗」作为主称号，括号内显示细分境界
export function getRealmDisplay(level: number, _ringCount: number, title?: string, easterStage?: number, divineTrial?: { inherited?: boolean; chosenTrialId?: string | null }): string {
  const realmNames = ['魂士', '魂师', '大魂师', '魂尊', '魂宗', '魂王', '魂帝', '魂圣', '魂斗罗', '封号斗罗'];

  // 百级且已继承神位 → 显示神位名称
  if (level >= 100) {
    if (divineTrial?.inherited && divineTrial.chosenTrialId) {
      const trial = DIVINE_TRIALS.find((t) => t.id === divineTrial!.chosenTrialId);
      if (trial) {
        if (trial.tier === 'supreme') return `至高·${trial.name}`;
        if (trial.tier === 'king') return `神王·${trial.name}`;
        return trial.name;
      }
    }
    return '百级魂师';
  }

  // 90级以上：有封号则主称号为「XX斗罗」，括号内为细分境界；无封号直接显示细分境界
  if (level >= 90) {
    let subRealm = '封号斗罗';
    if (level >= 99) subRealm = '极限斗罗';
    else if (level >= 98) subRealm = '巅峰斗罗';
    else if (level >= 95) subRealm = '超级斗罗';

    // 彩蛋境界：极限斗罗基础上追加
    if (level >= 99) {
      const es = Math.max(0, Math.min(3, easterStage ?? 0));
      if (es > 0) {
        subRealm = `极限斗罗·${EASTER_REALM_NAMES[es]}`;
      }
    }

    if (title) {
      const shortTitle = title.slice(0, 2);
      return `${shortTitle}斗罗（${subRealm}）`;
    }
    return subRealm;
  }

  // 90 级以下：基础境界索引
  let realmIndex = Math.floor(level / 10);
  if (level <= 0) realmIndex = 0;

  // 「准X」判定：x9 级时显示准下一个境界（9/19/.../89）
  if (level % 10 === 9 && level >= 9) {
    const nextIdx = realmIndex + 1;
    if (nextIdx <= 9) {
      return '准' + realmNames[nextIdx];
    }
  }

  return realmNames[realmIndex];
}

export function getMaxExp(level: number, easterStage = 0): number {
  // 百级起每10级乘3；统一乘0.7，不改变99级彩蛋修炼。
  if (level >= 100) return godLevelExp(level);
  // 99级极限斗罗之上，按彩蛋境阶段位返回对应所需经验（每阶500万）
  if (level >= 99) {
    return getEasterRealmExp(easterStage);
  }
  if (level <= 10) return 500;
  if (level <= 20) return 1000;
  if (level <= 30) return 2000;
  if (level <= 40) return 5000;
  if (level <= 50) return 10000;
  if (level <= 60) return 20000;
  if (level <= 70) return 50000;
  if (level <= 80) return 100000;
  if (level <= 90) return 200000;
  return 500000; // 91-98级
}

export function isBottleneck(level: number, brokenBottlenecks: number[] = []): boolean {
  if (level >= 100 && brokenBottlenecks.includes(level)) return false;
  // 9/19/29/39/49/59/69/79/89 是普通瓶颈（闭关突破）
  // 98 级是最终瓶颈（需魂核突破到 99 级）
  // 100级以上：109/119/129/... 是神级瓶颈（需法则突破）
  if (level >= 100) return level % 10 === 9;
  return (level % 10 === 9 && level < 99) || level === 98;
}

// v2.0 第二武魂各魂环槽位年限上限（按大境界）
// 返回数组：每个索引对应一个魂环槽位的必定成功上限（年）
// 第二武魂无法超年限吸收，只能按规定来
export function getSecondSoulRingLimits(level: number): number[] {
  if (level >= 90) {
    // 90级：第二武魂所有魂环100万年以下必定成功，百万年以上可超年限吸收
    return [1000000, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000, 1000000];
  }
  if (level >= 80) {
    // 80级：第1~8环分别为 3万/4万/4万/5万/6万/7万/8万/15万
    return [30000, 40000, 40000, 50000, 60000, 70000, 80000, 150000, 0];
  }
  if (level >= 70) {
    // 70级：第1~7环分别为 3万/3万/4万/4万/5万/5万/6万
    return [30000, 30000, 40000, 40000, 50000, 50000, 60000, 0, 0];
  }
  if (level >= 60) {
    // 60级：第1~6环分别为 1万/2万/2万/2万/3万/4万
    return [10000, 20000, 20000, 20000, 30000, 40000, 0, 0, 0];
  }
  if (level >= 50) {
    // 50级：第1~5环分别为 6000/8000/1万/2万/2万
    return [6000, 8000, 10000, 20000, 20000, 0, 0, 0, 0];
  }
  if (level >= 40) {
    // 40级：第1~4环分别为 5000/6000/7000/1万
    return [5000, 6000, 7000, 10000, 0, 0, 0, 0, 0];
  }
  if (level >= 30) {
    // 30级：第1~3环分别为 3000/5000/6000
    return [3000, 5000, 6000, 0, 0, 0, 0, 0, 0];
  }
  if (level >= 20) {
    // 20级：第1环3000年以下，第2环5000年以下
    return [3000, 5000, 0, 0, 0, 0, 0, 0, 0];
  }
  if (level >= 10) {
    // 10级：第一魂环900年以下必定成功
    return [900, 0, 0, 0, 0, 0, 0, 0, 0];
  }
  // 10级以下：无法吸收第二武魂魂环
  return [0, 0, 0, 0, 0, 0, 0, 0, 0];
}

// 获取第二武魂当前境界可吸收的魂环数量上限
export function getSecondSoulMaxRingCount(level: number): number {
  if (level >= 90) return 9; // 90级可吸收全部9个魂环
  if (level >= 80) return 8;
  if (level >= 70) return 7;
  if (level >= 60) return 6;
  if (level >= 50) return 5;
  if (level >= 40) return 4;
  if (level >= 30) return 3;
  if (level >= 20) return 2;
  if (level >= 10) return 1;
  return 0;
}

// 兼容旧接口（已废弃，保留避免报错）
/** @deprecated 请使用 getSecondSoulRingLimits 替代 */
export function getSecondSoulMaxYears(level: number): number {
  const limits = getSecondSoulRingLimits(level);
  // 返回最高环的上限作为兼容值
  const valid = limits.filter((v) => v > 0);
  if (valid.length === 0) return 0;
  return valid[valid.length - 1];
}

// ============================================================
// 属性归一化工具：将各种非标准属性名统一为「X属性」标准格式
// 标准属性：金/木/水/火/土/冰/光/暗/时间/空间/精神（共11种）
// ============================================================
// 【规定】游戏内元素共11种：金、木、水、火、土、冰、光、暗、时间、空间、精神
// 冰属性与水属性互不归属，各自独立
// 精神属性为独立元素（精神系武魂/魂兽专属，如灵眸、邪眼等）
// 雷为独立属性；风→木、光明→光、黑暗→暗、混沌→空间、毒→木、生命→木、全属性→光
// 雪/霜/极寒/极冰 → 冰属性
export function normalizeBeastAttribute(attr: string | undefined): string {
  if (!attr) return '无属性';
  let a = attr.trim();
  if (!a) return '无属性';

  // 先统一成「X属性」或标准格式
  // 去掉「极致之」前缀
  a = a.replace(/^极致之/, '');
  // 去掉「系」结尾，补「属性」
  if (/系$/.test(a)) {
    a = a.replace(/系$/, '') + '属性';
  }
  // 单字补属性
  if (a.length === 1 && !/属性$/.test(a)) {
    a = a + '属性';
  }

  // 【归一化映射表】所有非标准属性名 → 11种规定元素
   const normMap: Record<string, string> = {
     // 标准名（直接返回）
     '金属性': '金属性', '木属性': '木属性', '水属性': '水属性',
     '火属性': '火属性', '土属性': '土属性', '冰属性': '冰属性',
     '光属性': '光属性', '暗属性': '暗属性', '时间属性': '时间属性', '空间属性': '空间属性',
    // 光明 → 光
    '光明属性': '光属性', '神圣属性': '光属性', '圣属性': '光属性',
    // 黑暗 → 暗
    '黑暗属性': '暗属性', '暗影属性': '暗属性', '亡灵属性': '暗属性',
    '死亡属性': '暗属性', '邪魔属性': '暗属性',
    '修罗属性': '暗属性', '幽冥属性': '暗属性',
    // 冰系 → 冰属性（独立，不再归水）
    '极冰属性': '冰属性', '极寒属性': '冰属性', '雪属性': '冰属性',
    '霜属性': '冰属性', '寒冰属性': '冰属性', '冰晶属性': '冰属性',
    // 雷为独立属性
    '雷属性': '雷属性', '雷霆属性': '雷属性', '电属性': '雷属性',
    // 风 → 木
    '风属性': '木属性', '敏捷属性': '木属性',
    // 毒 → 木
    '毒属性': '木属性',
    // 生命 → 木
    '生命属性': '木属性', '植物属性': '木属性', '翡翠属性': '木属性',
    // 混沌 → 空间
     '混沌属性': '空间属性', '时空属性': '空间属性',
     // 精神 → 精神属性（独立，不再归空间）
     '精神属性': '精神属性', '神识属性': '精神属性', '灵魂属性': '精神属性',
     '轮回属性': '精神属性', '心灵属性': '精神属性', '念力属性': '精神属性',
     '噬魂属性': '精神属性', '摄魂属性': '精神属性',
    // 全属性 → 光（兜底处理）
    '全属性': '光属性', '全能属性': '光属性', '全元素属性': '光属性',
  };
  if (normMap[a]) return normMap[a];

  // 斜杠组合（如「冰/火」）：取第一个
  if (a.includes('/')) {
    const first = a.split('/')[0].trim();
    return normalizeBeastAttribute(first);
  }

  // 兜底：再尝试关键词模糊匹配
  if (a.includes('光') || a.includes('明') || a.includes('神圣') || a.includes('圣')) return '光属性';
  if (a.includes('暗') || a.includes('黑暗') || a.includes('死亡') || a.includes('魔') || a.includes('修罗') || a.includes('幽冥')) return '暗属性';
  if (a.includes('雷') || a.includes('电')) return '雷属性';
  if (a.includes('火') || a.includes('炎') || a.includes('焰') || a.includes('赤')) return '火属性';
  // 冰属性独立（优先级高于水，避免冰/雪/霜被水吞掉）
  if (a.includes('冰') || a.includes('雪') || a.includes('霜') || a.includes('寒')) return '冰属性';
  if (a.includes('水') || a.includes('海') || a.includes('雨') || a.includes('浪')) return '水属性';
  if (a.includes('金') || a.includes('铁') || a.includes('钢') || a.includes('剑') || a.includes('刀') || a.includes('枪') || a.includes('龙枪')) return '金属性';
  if (a.includes('木') || a.includes('毒') || a.includes('植物') || a.includes('风') || a.includes('草') || a.includes('树') || a.includes('藤')) return '木属性';
  if (a.includes('土') || a.includes('岩') || a.includes('石') || a.includes('山') || a.includes('防御') || a.includes('鼎') || a.includes('牛') || a.includes('熊') || a.includes('犀')) return '土属性';
  if (a.includes('时间') || a.includes('春秋') || a.includes('蝉')) return '时间属性';
   if (a.includes('空间') || a.includes('混沌') || a.includes('虚空') || a.includes('太虚')) return '空间属性';
   if (a.includes('精神') || a.includes('灵魂') || a.includes('神识') || a.includes('轮回') || a.includes('心灵') || a.includes('念力') || a.includes('摄魂') || a.includes('噬魂') || a.includes('灵眸')) return '精神属性';

  return '无属性';
}

// 魂环接口（属性为百分比加成，小数表示，如0.05=5%）
export interface ISoulRing {
  id: string;
  color: 'white' | 'yellow' | 'purple' | 'black' | 'red' | 'gold' | 'blueWhite';
  qualityLabel: string;
  soulBeastName: string;
  skillName: string;
  skillDesc: string;
  years?: number; // 年限
  /** 魂兽系别：强攻/敏攻/控制/辅助/防御，决定属性分配倾向 */
  beastType?: 'qiang' | 'min' | 'kong' | 'fu' | 'fang';
  /** 魂兽属性，如 '冰属性'、'火属性' 等，用于属性克制 */
  beastAttribute?: string;
  /** 魂技类型：attack(攻击型) / heal(治疗型) / buff(增益型) / allBuff(全属性增益) */
  skillType?: 'attack' | 'heal' | 'buff' | 'allBuff';
  /** 增益效果类型（buff型才有） */
  buffAttr?: 'attack' | 'defense' | 'speed' | 'spirit';
  // ===== 数值属性加成（新版） =====
  attackBonus: number;    // 攻击数值
  defenseBonus: number;   // 防御数值
  speedBonus: number;     // 速度数值
  spiritBonus: number;    // 精神数值
  hpBonus: number;        // 气血数值
  critRateBonus: number;  // 暴击率数值（小数，如 0.02 = 2%）
  critDmgBonus: number;   // 爆伤数值（小数，如 0.1 = 10%）
  soulPowerBonus: number; // 最大魂力数值
  /** 魂技伤害值（用于魂技伤害公式） */
  skillDamage: number;
  /** 魂技伤害百分比（小数表示，如 1.5 = 150%），基于年限+系别+位置+属性契合计算 */
  skillDamagePct: number;
  // ===== 旧版百分比字段（存档迁移用，迁移后清零/忽略） =====
  /** @deprecated 旧版百分比加成，已改为数值 */
  attackBonusPct?: number;
  /** @deprecated 旧版百分比加成 */
  defenseBonusPct?: number;
  /** @deprecated 旧版百分比加成 */
  speedBonusPct?: number;
  /** @deprecated 旧版百分比加成 */
  spiritBonusPct?: number;
  /** @deprecated 旧版百分比加成 */
  hpBonusPct?: number;
}

// 待吸收魂环（有存在时限）
export interface IPendingSoulRing extends ISoulRing {
  expiresAt: number; // 到期时间戳 ms
  soulIndex?: 0 | 1; // 归属武魂索引（0=主修，1=次修；不传默认0）
}

// 玩家契约的魂灵
export interface IPlayerSoulSpirit {
  evolutionStage?: number;
  evolutionYears?: number;
  spiritId: string; // 对应魂灵模板id
  name: string; // 魂灵名
  attribute: string; // 属性
  majorIndex: number; // 大境界索引（0=初阶...9=神级）
  minor: number; // 小境界1~9重
  currentHp: number; // 当前血量（战斗中用，平时满）
  iconChar: string;
}

// 🔴 特殊魂灵（吞噬茶武魂专属，三茶转化而来）
// 固定属性，无法升级，不占用普通魂灵上限，单独上阵
export interface ISpecialSoulSpirit {
  spiritId: string; // 唯一id
  name: string; // 魂灵名称，如「阴阳茶魂灵」
  attribute: string; // 属性
  sourceId: string; // 来源茶城角色id
  // 固定战斗属性（兆/亿单位，直接用大数）
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  spirit: number;
  // 特殊技能
  skillName: string;
  skillDesc: string;
  instantKillChance: number; // 秒杀概率 0~1
  iconChar: string; // 图标字
  quality: 'special'; // 特殊/至高品质
}

// 待选择魂灵（传灵塔战斗胜利后获得，7分钟时限）
export interface IPendingSoulSpirit {
  id: string;
  spiritId: string;
  name: string;
  attribute: string;
  description: string;
  feature: string;
  iconChar: string;
  expiresAt: number; // 到期时间戳 ms
}

// 探索状态（全局保持，切换 Tab 不丢失）
export type ExplorationNodeType = 'encounter' | 'treasure' | 'nothing' | 'adventure';

export interface IExplorationNode {
  id: number;
  type: ExplorationNodeType;
  title: string;
  description: string;
  completed: boolean;
  reward?: { exp?: number; coins?: number; itemName?: string };
  beast?: any;
}

export interface IExplorationState {
  locationId: string;
  areaName: string;
  tier: 'outer' | 'middle' | 'inner' | 'core' | 'life-lake';
  nodes: IExplorationNode[];
  currentNode: number;
  // 探索中收集到的物品（魂骨等），探索结束时合并进背包
  collectedItems: IItem[];
  // 探索中收集到的魂环，探索结束时合并进待吸收列表并开始倒计时
  // 注意：带 soulIndex 标记武魂归属（0=主修 1=次修），避免双生武魂玩家魂环归错武魂
  collectedRings: Array<ISoulRing & { soulIndex?: 0 | 1 }>;
  // 是否已经完成（6节点全部走完）
  completed: boolean;
  // 🔴 属性筛选：玩家选择的目标属性，探索出的魂兽强制为该属性
  attributeFilter?: string;
}

// 战斗状态（全局保持，切换 Tab 不丢失）
export interface IBattleState {
  battleType: 'hunt' | 'encounter' | 'challenge' | 'shrek-exam' | 'arena' | 'mountain-dungeon' | 'demon' | 'sea-god' | 'fierce-beast' | 'divine-avatar' | 'divine-ditian' | 'divine-beast' | 'spirit-tower' | 'god-realm';
  locationId: string;
  enemy: {
    id: string;
    name: string;
    years: number;
    qualityColor: string;
    qualityLabel: string;
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    speed: number;
    spirit: number;
    skillName: string;
    skillDesc: string;
    isEncounter?: boolean;
    element?: string;
    /** 特殊技能：概率秒杀（无视防御/血量/魂灵），值为概率 0~1 */
    instantKillChance?: number;
    /** 特殊技能冷却回合数 */
    specialSkillCooldown?: number;
    /** 是否只有技能攻击（无普攻），如阴阳茶 */
    hasOnlySkill?: boolean;
  };
  phase: 'intro' | 'playerTurn' | 'enemyTurn' | 'victory' | 'defeat' | 'flee';
  logs: Array<{ id: number; text: string; type: string }>;
  playerHp?: number;
  playerSoulPower?: number;
  rewards?: {
    exp: number;
    coins: number;
    items: any[];
    ring: ISoulRing | null;
    soulBones: any[];
    beastName: string;
    beastYears: number;
    beastQuality: string;
  };
  updatedAt: number;
  exploreSource?: { tier: string; nodeIdx: number; locationId: string; areaName?: 'star-forest' | 'sun-mountains' | string };
  meta?: Record<string, any>;
}

// 魂导器装备槽位（5个）
export interface IEquipmentSlots {
  melee: IItem | null;    // 近战魂导器
  support: IItem | null;  // 辅助魂导器
  defense: IItem | null;  // 防御魂导器
  ranged: IItem | null;   // 远程魂导器
  flying: IItem | null;   // 飞行魂导器
}

// 魂骨槽位
export interface ISoulBoneSlots {
  head: IItem | null;
  torso: IItem | null;
  leftArm: IItem | null;
  rightArm: IItem | null;
  leftLeg: IItem | null;
  rightLeg: IItem | null;
  external: IItem | null;
}

// 领域系统
export interface IDomain {
  id: string;
  name: string;
  description: string;
  // 修炼属性（决定领域颜色和加成方向）
  cultivationAttr: DomainCultivationAttr;
  // 基础加成百分比（魂圣70级时）
  baseBonuses: DomainBonus;
  // 是否为武魂专属领域
  exclusive?: boolean;
}

export type DomainCultivationAttr = 'fire' | 'ice' | 'water' | 'thunder' | 'wind' | 'earth' | 'metal' | 'wood' | 'light' | 'dark' | 'spirit' | 'chaos' | 'strength' | 'agility' | 'defense' | 'support';

export interface DomainBonus {
  attack?: number;   // 百分比，0.15 = +15%
  defense?: number;
  speed?: number;
  spirit?: number;
  hp?: number;
  allAttr?: number;  // 全属性百分比加成
  critRate?: number; // 百分比（0.05 = +5%）
  critDmg?: number;  // 百分比加成（加在 critDmg 基础上）
  skillDmg?: number; // 魂技伤害额外百分比（0.1 = +10%）
}

// 领域加成阶段（按大境界递增）
export function getDomainBonusTier(level: number): number {
  if (level >= 99) return 4;   // 极限斗罗：最高加成
  if (level >= 90) return 3;   // 封号斗罗
  if (level >= 80) return 2;   // 魂斗罗
  if (level >= 70) return 1;   // 魂圣（基础）
  return 0; // 未解锁
}

// 根据等级计算领域实际加成倍率
function getDomainMultiplier(level: number): number {
  const tier = getDomainBonusTier(level);
  // 基础1倍，每提升一个大境界 +50%
  return 1 + (tier - 1) * 0.5;
}

// 玩家数据
export interface IPlayer {
  dragonRewards?: string[];
  twinResonance?: ReturnType<typeof readTwin>;
  twinAutoBreak?: boolean;
  goldBlood?: ReturnType<typeof readGoldBlood>;
  silverBloodline?:ReturnType<typeof readSilverBlood>;
  dragonBloodline?: import('./dragonBloodline').BloodlineProgress;
  dragonValley?: import('./dragonBloodline').ValleyProgress;
  dragonLegend?: import('./dragonLegend').DragonProgress;
  abyssFrontier?: import('./abyssFrontier').AbyssProgress;
  name: string;
  martialSoul: IMartialSoul;
  soulPower: number; // 先天魂力
  level: number;
  exp: number;
  direction: string;
  gender: 'male' | 'female'; // 玩家性别
  soulCoins: number;
  stamina: number; // 当前体力（快照值，离线恢复通过 getCurrentStamina 计算）
  staminaUpdatedAt: number; // 上次体力结算时间戳 ms
  soulRings: ISoulRing[]; // 已吸收的魂环（主修武魂）
  secondSoulRings: ISoulRing[]; // 第二武魂的魂环（次修武魂，初始即可使用）
  /** 是否双生武魂 */
  isTwinSoul: boolean;
  /** 次修武魂（双生武魂才有） */
  secondSoul: IMartialSoul | null;
  pendingSoulRings: IPendingSoulRing[]; // 待吸收魂环（有时限）
  // 魂灵系统
  soulSpirits: IPlayerSoulSpirit[]; // 已契约的魂灵（最多4个）
  activeSpiritIds: string[]; // 上阵魂灵id列表（最多4个）
  pendingSpirits: IPendingSoulSpirit[]; // 传灵塔待选择魂灵（7分钟时限）
  // 🔴 特殊魂灵（吞噬茶武魂专属，三茶转化而来，不占用普通魂灵上限）
  specialSoulSpirits: ISpecialSoulSpirit[];
  specialActiveSpiritIds: string[]; // 已上阵的特殊魂灵id列表
  // 🔴 吞噬茶武魂·吞噬天赋
  devour: {
    count: number; // 吞噬次数
    totalAttack: number; // 累计攻击加成（固定值）
    totalDefense: number; // 累计防御加成
    totalSpeed: number; // 累计速度加成
    totalSpirit: number; // 累计精神加成
    totalHp: number; // 累计血量加成
    backlashCount: number; // 反噬次数
    backlashAttack: number; // 反噬累计降低攻击
    backlashDefense: number; // 反噬累计降低防御
    backlashSpeed: number; // 反噬累计降低速度
    backlashSpirit: number; // 反噬累计降低精神
    backlashHp: number; // 反噬累计降低血量
  };
  // 🔴 三茶击败次数记录（用于第二次击败时触发转化魂灵）
  teaDefeatCounts: Record<string, number>; // 茶城角色id -> 击败次数
  title: string; // 封号（封号斗罗命名，1-3字，空字符串表示未命名）
  permanentTitles: string[]; // 永久称号列表（转世不重置，如全游戏通关）
  equipment: IEquipmentSlots;
  soulBones: ISoulBoneSlots;
  inventory: IItem[];
  team: string[]; // 出战队伍角色 id（玩家外最多3人）
  recruited: string[]; // 已招募角色 id（永久，不会因下阵消失）
  // 天梦冰蚕献祭奇遇（每世重置，转世后可再次触发）
  tianmeng: {
    triggered: boolean;       // 本世是否已触发过奇遇（无论接受还是拒绝）
    accepted: boolean;        // 本世是否接受献祭
    evolved: boolean;         // 本世灵眸是否已进化为冰灵之眸
  };
  currentHp: number;
  trainingCooldowns: Record<string, number>; // locationId -> 结束时间戳
  cultivationEndTime: number | null; // 闭关结束时间戳
  cultivationFromLevel: number | null; // 闭关从哪个等级开始
  // 史莱克学院
  academyRank: AcademyRank; // 学院身份
  // 新生考核失败冷却结束时间戳（0 表示无冷却）
  examCooldownUntil: number;
  examPassed: boolean; // 是否已通过新生考核
  // 竞技场
  arenaRank: ArenaRank;
  arenaStars: number;
  // 内院名师指导：各导师冷却结束时间戳（ms），冷却中存时间戳，已冷却/未使用则不存在或<=0
  mentorCooldowns: Record<string, number>;
  // 魂核系统
  // normal = 普通魂核（击败心魔） / yin = 阴魂核（直接突破） / yang = 阳魂核（直接突破） / yin-yang = 双魂核圆满（89选阴+98选阳 或 89选阳+98选阴）
  soulCoreType: 'none' | 'yin' | 'yang' | 'yin-yang';
  soulCoreStage: number; // 0=未开始, 1=89级已突破（单魂核）, 3=双魂核圆满（99级）
  yinCoreStartTime: number | null; // 阴魂核开始凝聚时间戳（保留字段兼容存档，不再使用）
  yangCoreStartTime: number | null; // 阳魂核开始凝聚时间戳（保留字段兼容存档，不再使用）
  // 心魔挑战状态
  demonDefeated: { lvl90: 'none' | 'normal' | 'hard'; lvl99: boolean };
  // 彩蛋境界（99级之上）：0=极限斗罗（未突破）/ 1=准半神 / 2=半神 / 3=准神
  easterRealmStage: number;
  // 两仪神剑首次击败阴阳茶奖励是否已发放（顶层持久化）
  liangyiFirstBonusGiven?: boolean;
  /** 本世击败混沌茶；独立于可移除的伴侣记录。 */
  hundunChaDefeated?: boolean;
  nianBonus?: NianBonus;
  jiYueVictories?: number;
  jiYueLastBattleId?: string;
  sweepAutoDestroyRingYears?: number;
  sweepAutoSellBoneYears?: number;
   /** 一键扫荡探索次数记录：key 为区域标识（如 star-outer / beiji-inner / million-year），value 为累计进入次数 */
   sweepExploreCounts?: Record<string, number>;
   /** 每日轮回之影挑战是否已使用：日期字符串 'YYYY-MM-DD' */
   reincarnationShadowLastDate?: string;
  // 新生任务：已完成次数 {taskId: count}
  freshTaskProgress: Record<string, number>;
  freshTaskCooldowns: Record<string, number>; // 任务id -> 冷却结束时间戳
  // 冰火两仪眼探索冷却（区域id -> 冷却结束时间戳ms）
  iceFireCooldowns: Record<string, number>;
  // 商店：已购买的魂导器 itemId 列表（4分钟刷新后清空）
  purchasedShopItems: string[];
  shopLastRefreshAt: number; // 上次商店刷新时间戳 ms
  // 领域系统
  domain: IDomain | null;
  // 第二领域（双生武魂可激活两个领域）
  secondDomain: IDomain | null;
  // 海神阁
  seaGodDefeatedIds: string[]; // 已击败的海神阁成员id列表（按击败顺序，最后一个是当前位置上一级）
  seaGodPosition: number; // 玩家在海神阁的位置索引，初始 = SEA_GOD_MEMBERS.length（最底部，未击败任何），击败一人索引-1
  // 消耗品服用记录
  consumableCounts: Record<string, number>; // capKey -> 已服用数量（用于上限判定和显示）
  // 消耗品带来的属性加成（所有百分比已折算好，直接加到对应属性上）
  growthRules?: GrowthRules;
  brokenBottlenecks?: number[];
  consumableBonus: {
    attackPct: number;    // 攻击百分比加成（0.02 = +2%）
    defensePct: number;   // 防御百分比加成
    speedPct: number;     // 速度百分比加成
    spiritPct: number;    // 精神百分比加成
    hpPct: number;        // 气血百分比加成
    allAttrPct: number;   // 全属性百分比加成
    attackFix: number;    // 攻击固定值加成
    defenseFix: number;
    speedFix: number;
     spiritFix: number;
     hpFix: number;
   };
   // 神考系统
     divineTrial: {
      /** 抽取阶段：none=未抽取/drawing=抽取中/chose=已选好神考/inheriting=继承中/inherited=已继承 */
     stage: 'none' | 'drawing' | 'chose' | 'inherited';
    drawnTrials: string[];                // 7次抽取到的神考id列表
    drawIndex: number;                    // 当前是第几次抽取（0-6）
     chosenTrialId: string | null;         // 玩家最终选择的神考id
     affinityPct: number;                  // 神位亲和度 0-100
     currentExamIndex: number;             // 当前进行到第几考（0=未开始，1=第一考…）
     completedExams: number[];             // 已完成的考核编号
     failedExams: number[];                // 失败的考核编号
     // 第一考特殊追踪字段（接取后）
     firstExamTaken: boolean;              // 是否已接取第一考
     firstExamDiTianDefeated: boolean;     // 接取后是否击败过帝天（80-90级路线）
     // 第二考神王级：击败化身次数
     avatarAttempts: number;               // 化身挑战次数（0-7）
     avatarDefeated: boolean;              // 是否击败过化身
     // 第三考：击败指定魂兽
     beastDefeated: boolean;               // 是否击败过第三考魂兽（邪眼暴君主宰等）
     // 第六考：神器是否拔出
     artifactDrawn: boolean;               // 神器是否已拔出
     artifactLevel: number;                // 神器等级
     // 神力百分比（转化为全属性加成）
     divinePowerPct: number;               // 神力百分比，每1%=全属性+1%
     // 是否已继承神位
      inherited: boolean;                   // 神位继承完成
      inheritedLevel: number;               // 继承后等级（>99 表示百级以上）
       // 百级神环（第10魂环）
        divineSoulRing: null | {
          color: string;                        // 玩家自定义颜色（hex）
          skillName: string;                    // 神技名称
          skillDesc: string;
          years: number;                        // 神环年限（神级）
          beastAttribute: string;               // 神环属性（对应神位属性）
        };
        // 待发放等级奖励（遇到瓶颈等级时暂存，突破后自动结算）
        pendingLevelBonus: number;
       // 当前激活的神器ID（用于在继承神位神器和特殊无上神器之间切换）
       // 为 null 时使用默认的继承神位神器
       activeArtifactId: string | null;
       // 🔴 已获得的至高神器ID列表（永久叠加，不随切换丢失）
       // 通过结识特定角色（阴阳茶/梦小茶/甜小茶）夫妻关系获得
       supremeArtifacts: string[];
       // 🔴 v22.0 百级以上神级修炼系统
       godLevelProgress: {
         unlocked: boolean;             // 是否已解锁100级以上（继承神位+击败混沌茶）
         currentTier: 'second' | 'first' | 'king' | 'supreme'; // 神位等级，决定等级上限
         levelCap: number;              // 当前等级上限（139/149/159/169）
       };
       // 🔴 v22.0 法则碎片系统
       lawFragments: {
         time: number;     // 时间法则碎片（最多3个）
         space: number;    // 空间法则碎片
         gold: number;     // 金之法则碎片
         wood: number;     // 木之法则碎片
         water: number;    // 水之法则碎片
         fire: number;     // 火之法则碎片
         earth: number;    // 土之法则碎片
         light: number;    // 光之法则碎片
         dark: number;     // 暗之法则碎片
         chaos: number;    // 混沌法则碎片（至高神专属，最多9个）
       };
       // 已融合的法则（每个法则融合一次，融合后碎片-3，法则+1）
       lawsFused: {
         time: boolean;
         space: boolean;
         gold: boolean;
         wood: boolean;
         water: boolean;
         fire: boolean;
         earth: boolean;
         light: boolean;
         dark: boolean;
         chaos: boolean;
       };
        // 已用于突破消耗的法则（110/120/130/...级各消耗一个）
        lawsConsumedForBreakthrough: string[];
        // 待选择的法则碎片次数（每升2级获得1次，玩家主动选择类型后-1）
        pendingLawFragmentChoices: number;
      };
      // 转世轮回系统
       reincarnation: {
         count: number;                     // 已轮回次数（当前是第几世，0=第一世尚未轮回）
         totalAttackBonus: number;          // 累计攻击力加成（每世+10）
           totalRingYearBonus: number;        // 累计魂环年限上限加成（已废弃，保留兼容旧档）
          ringYearBonusPct: number;          // 魂环年限上限百分比加成（每世+50%，可叠加）
         orbs: IReincarnationOrb[];         // 轮回球列表，每世一个
       };
       // 成就统计（随 player 一起保存到存档，转世不重置）
         achievementStats: {
           totalBeastKills: number;             // 累计击败魂兽数
           arenaTotalWins: number;              // 竞技场累计胜场
           arenaBestStreak: number;             // 竞技场最高连胜
           herbTypesTaken: number;              // 服用过的仙草种类数
           lifeWaterTaken: boolean;             // 是否服用过生命之水
           craftedGuide: boolean;               // 是否自制过魂导器
           fierceBeastDefeated: boolean;        // 是否击败凶兽
            bestBeastQualityIndex: number;       // 击败过的魂兽最高品质索引（十年=0...百万年=5）
            liangyiEyeEnterCount: number;         // 进入冰火两仪眼次数
            newlyUnlocked: string[];             // 本轮新解锁的成就id（用于播放动画，查看后清空）
         };
        // 🔴 v14.0 成就永久化：已解锁成就ID永久保存，转世不重置
        // 之前的成就检测是每次读档时重算，转世后等级/魂环归零会导致成就消失
        unlockedAchievements: string[];       // 永久已解锁成就id列表（转世不重置）
        // 🔴 v14.0 神位继承记录：每世继承的神位都记录下来，用于收集类成就
        inheritedGodPositions: string[];      // 历史继承过的所有神位id（每世新增一个，去重）
        // 🔴 v15.0 神装系统：成神且魂骨全满后可将魂骨融合为神装
        divineArmor: {
          hasArmor: boolean;                   // 是否已转化出神装
          armorItem: IItem | null;             // 神装物品（装备到equipment上也保留一份引用）
          armorName: string;                   // 玩家自定义的神装名称（最多6字）
          sourceBones: ISoulBoneSlots;         // 融合进去的原始魂骨快照（用于计算属性）
          resonanceActive: boolean;            // 神装与神器共鸣是否激活（神器已拔出 + 有神装）
        };
         // 🔴 v16.0 神界系统：成神后可挑战至高神域/神王领域/神级领域三大方向
         godRealm: {
           unlocked: boolean;                    // 是否已开启（继承神位后开启）
           // 已击败的boss id集合（击败后不可再挑战，永久保存）
           defeatedIds: string[];
           // 是否已合成神界中枢（5个神王碎片合成）
           divineCoreCrafted: boolean;
         };
          // 🔴 v17.0 侣系统：获得青睐的凶兽/茶城人物
         companions: {
            /** 已获得青睐且接受的id列表（凶兽id + 茶城人物tc-* id 共存） */
            accepted: string[];
            /** 已拒绝过的id列表（再次遇到仍有概率触发） */
            rejected: string[];
            /** 每只/每位的好感度详情 */
             details: Record<string, {
               companionType: 'beast' | 'human'; // 伴侣类型：凶兽 / 人类
               favorability: number;    // 好感度 0-150
               transformed: boolean;    // 是否已化形（凶兽用，人类默认true）
               isLover: boolean;        // 是否为情侣
                isSpouse: boolean;       // 是否为夫妻（唯一）
                isForcedSpouse?: boolean; // 是否为强制配偶（混沌茶专属，可突破夫妻唯一限制）
                crystals: number;        // 结晶数量
               lastDualCultivateAt: number; // 上次双修时间戳
               lastMatingAt: number;    // 上次交融时间戳
               forgotten?: boolean;     // 是否被遗忘（不显示在列表，但数据保留，150好感禁止遗忘）
                  becameLoverAt?: number;  // 结为情侣的时间戳（用于列表排序）
                  lastChallengeAt?: number; // 挑战模式上次获胜时间戳（冷却用）
                 firstRingYearBonusGiven?: boolean; // 两仪神剑首次击败奖励是否已发放
                 hundunChaDefeated?: boolean; // 混沌茶是否已被击败（吞噬茶武魂专属）
               }>;
             /** 全局虚弱状态结束时间戳（"配"后的虚弱） */
             weaknessUntil: number;
             /** 已离婚次数（每离婚一次全属性-5%，加法累加） */
             divorceCount: number;
             /** 茶城待处理青睐的人物id（探索遇到后人型伴侣） */
             pendingTeaFavorId: string | null;
             /** 凶兽待处理青睐的beastId（战斗胜利后存入，回到主界面弹窗；持久化防丢失） */
             pendingFavorBeastId: string | null;
             /** 茶城各节点冷却（时间戳） */
             teaNodeCooldowns: Record<string, number>;
           };
    }

const EMPTY_EQUIPMENT: IEquipmentSlots = {
  melee: null, support: null, defense: null, ranged: null, flying: null,
};

const EMPTY_SOUL_BONES: ISoulBoneSlots = {
  head: null, torso: null, leftArm: null, rightArm: null,
  leftLeg: null, rightLeg: null, external: null,
};

// 体力上限统一为 10000 点（所有玩家一致，不再随等级变化）
export function getStaminaMax(_level: number): number {
  return STAMINA_CAP;
}

// 体力恢复：每秒 100 点，最多到上限
export function calcRecoveredStamina(current: number, lastUpdatedAt: number, maxStamina: number): { stamina: number; delta: number } {
  if (current >= maxStamina) return { stamina: maxStamina, delta: 0 };
  const now = Date.now();
  const elapsedMs = now - lastUpdatedAt;
  if (elapsedMs <= 0) return { stamina: current, delta: 0 };
  const recovered = Math.floor(elapsedMs / 1000) * 100; // 每秒 100 点
  if (recovered <= 0) return { stamina: current, delta: 0 };
  const next = Math.min(maxStamina, current + recovered);
  return { stamina: next, delta: next - current };
}

export function createNewPlayer(name: string, direction: string, soul: IMartialSoul, soulPower: number): IPlayer {
  // 初始等级 = 先天魂力等级（符合原著规律）
  const level = soulPower;
  const maxStamina = getStaminaMax(level);
  const basePlayer = {
    name,
    martialSoul: soul,
    soulPower,
    level,
    exp: 0,
    direction: direction || '强攻系',
    gender: 'male' as const,
    soulCoins: 100,
    stamina: maxStamina,
    staminaUpdatedAt: Date.now(),
    soulRings: [],
    secondSoulRings: [],
    isTwinSoul: false,
    secondSoul: null,
    pendingSoulRings: [],
    soulSpirits: [],
    activeSpiritIds: [],
    pendingSpirits: [],
    specialSoulSpirits: [],
    specialActiveSpiritIds: [],
     devour: {
       count: 0,
       totalAttack: 0,
       totalDefense: 0,
       totalSpeed: 0,
       totalSpirit: 0,
       totalHp: 0,
       backlashCount: 0,
       backlashAttack: 0,
       backlashDefense: 0,
       backlashSpeed: 0,
       backlashSpirit: 0,
       backlashHp: 0,
     },
    teaDefeatCounts: {},
    title: '',
    permanentTitles: [],
    equipment: { ...EMPTY_EQUIPMENT },
    soulBones: { ...EMPTY_SOUL_BONES },
    inventory: [],
    team: [],
    recruited: [],
    tianmeng: { triggered: false, accepted: false, evolved: false },
    currentHp: 100, // 先用占位值，下面用 calcAttributes 覆盖
    trainingCooldowns: {},
    cultivationEndTime: null,
    cultivationFromLevel: null,
    academyRank: 'none',
    examCooldownUntil: 0,
    examPassed: false,
    arenaRank: 'bronze',
    arenaStars: 0,
    mentorCooldowns: {},
    soulCoreType: 'none',
    soulCoreStage: 0,
    yinCoreStartTime: null,
    yangCoreStartTime: null,
    demonDefeated: { lvl90: 'none', lvl99: false },
    easterRealmStage: 0,
    freshTaskProgress: {},
    freshTaskCooldowns: {},
    iceFireCooldowns: {},
    purchasedShopItems: [],
    shopLastRefreshAt: Date.now(),
    domain: null,
    secondDomain: null,
    seaGodDefeatedIds: [],
    seaGodPosition: -1, // -1 表示未进入海神阁
    growthRules: freshGrowthRules(),
    brokenBottlenecks: [],
    consumableCounts: {},
    consumableBonus: {
      attackPct: 0, defensePct: 0, speedPct: 0, spiritPct: 0, hpPct: 0, allAttrPct: 0,
      attackFix: 0, defenseFix: 0, speedFix: 0, spiritFix: 0, hpFix: 0,
    },
    divineTrial: {
       stage: 'none',
      drawnTrials: [],
      drawIndex: 0,
      chosenTrialId: null,
      affinityPct: 0,
      currentExamIndex: 0,
      completedExams: [],
      failedExams: [],
      firstExamTaken: false,
      firstExamDiTianDefeated: false,
       avatarAttempts: 0,
       avatarDefeated: false,
       beastDefeated: false,
       artifactDrawn: false,
      artifactLevel: 1,
      divinePowerPct: 0,
      inherited: false,
      inheritedLevel: 99,
       divineSoulRing: null,
       pendingLevelBonus: 0,
       activeArtifactId: null,
        supremeArtifacts: [],
        godLevelProgress: {
          unlocked: false,
          currentTier: 'second',
          levelCap: 99,
        },
        lawFragments: {
          time: 0, space: 0, gold: 0, wood: 0, water: 0,
          fire: 0, earth: 0, light: 0, dark: 0, chaos: 0,
        },
        lawsFused: {
          time: false, space: false, gold: false, wood: false, water: false,
          fire: false, earth: false, light: false, dark: false, chaos: false,
        },
        lawsConsumedForBreakthrough: [],
        pendingLawFragmentChoices: 0,
        },
      reincarnation: {
        count: 0,
        totalAttackBonus: 0,
        totalRingYearBonus: 0,
        ringYearBonusPct: 0,
        orbs: [],
       },
    achievementStats: {
      totalBeastKills: 0,
      arenaTotalWins: 0,
      arenaBestStreak: 0,
      herbTypesTaken: 0,
      lifeWaterTaken: false,
      craftedGuide: false,
      fierceBeastDefeated: false,
      bestBeastQualityIndex: 0,
      liangyiEyeEnterCount: 0,
      newlyUnlocked: [],
    },
    unlockedAchievements: [],
    inheritedGodPositions: [],
     divineArmor: {
       hasArmor: false,
       armorItem: null,
       armorName: '',
       sourceBones: { ...EMPTY_SOUL_BONES },
       resonanceActive: false,
     },
       godRealm: {
        unlocked: false,
        defeatedIds: [],
        divineCoreCrafted: false,
      },
       companions: {
          accepted: [],
          rejected: [],
          details: {},
          weaknessUntil: 0,
          divorceCount: 0,
          pendingTeaFavorId: null,
          pendingFavorBeastId: null,
          teaNodeCooldowns: {},
        },
      };
   const attrs = calcAttributes(basePlayer as IPlayer);
  (basePlayer as IPlayer).currentHp = attrs.hp;
  return basePlayer as IPlayer;
}

// 根据魂环/魂兽信息推断魂兽系别（用于旧存档迁移和默认分配）
export function inferBeastTypeFromRing(ring: { soulBeastName?: string; skillName?: string; beastType?: string }): 'qiang' | 'min' | 'kong' | 'fu' | 'fang' {
  if (ring.beastType) return ring.beastType as 'qiang' | 'min' | 'kong' | 'fu' | 'fang';
  const name = (ring.soulBeastName || ring.skillName || '');
  // 常见辅助系魂兽关键字
  if (/七宝|琉璃|香肠|治疗|辅助|治愈|凤凰|鼎|塔|杖/.test(name)) return 'fu';
  // 防御系
  if (/玄龟|盾|甲|玄武|金刚|天蚕|防御|铠/.test(name)) return 'fang';
  // 敏攻系
  if (/风|疾|影|速|狼|豹|鹰|隼|蝶|蛇|蝎/.test(name)) return 'min';
  // 控制系
  if (/藤|网|冰|毒|蜘蛛|控制|迷|幻|魂/.test(name)) return 'kong';
  // 默认强攻系
  return 'qiang';
}

// ============================================================
// 魂技伤害百分比系统
// ============================================================

/** 属性相生相克表（斗罗大陆五行+特殊属性） */
const ELEMENT_COUNTER: Record<string, { generates: string[]; restrains: string[]; generatedBy: string[]; restrainedBy: string[] }> = {
  '金': { generates: ['水'], restrains: ['木'], generatedBy: ['土'], restrainedBy: ['火'] },
  '木': { generates: ['火'], restrains: ['土'], generatedBy: ['水'], restrainedBy: ['金'] },
  '水': { generates: ['木'], restrains: ['火'], generatedBy: ['金'], restrainedBy: ['土'] },
  '火': { generates: ['土'], restrains: ['金'], generatedBy: ['木'], restrainedBy: ['水'] },
  '土': { generates: ['金'], restrains: ['水'], generatedBy: ['火'], restrainedBy: ['木'] },
  '冰': { generates: ['水'], restrains: ['火'], generatedBy: ['金'], restrainedBy: ['火'] },
  '雷': { generates: ['火'], restrains: ['水'], generatedBy: ['火'], restrainedBy: ['土'] },
  '风': { generates: ['木'], restrains: ['土'], generatedBy: ['木'], restrainedBy: ['金'] },
  '光明': { generates: ['火'], restrains: ['黑暗'], generatedBy: ['火'], restrainedBy: ['黑暗'] },
  '黑暗': { generates: ['水'], restrains: ['光明'], generatedBy: ['水'], restrainedBy: ['光明'] },
  '精神': { generates: ['水'], restrains: ['精神'], generatedBy: ['水'], restrainedBy: ['精神'] },
  // v2.0 新增时间、空间属性（删除混沌属性）
  '时间': { generates: ['空间'], restrains: ['空间'], generatedBy: ['空间'], restrainedBy: ['空间'] },
  '空间': { generates: ['时间'], restrains: ['时间'], generatedBy: ['时间'], restrainedBy: ['时间'] },
};

/** 标准化属性名：去掉"属性"后缀，统一为裸属性名 */
function normalizeElement(attr: string | undefined): string {
  if (!attr) return '';
  const value=attr.replace(/属性$/, '').replace(/极致之/, '');
  return ['雷霆','电'].includes(value)?'雷':value;
}

/**
 * 计算属性契合度加成（用于魂技伤害百分比）
 * - 完全契合（同属性 / 混沌属性）：+30%
 * - 属性相生（武魂属性生魂环属性）：+15%
 * - 属性相克（武魂属性被魂环属性克）：-15%
 * - 其他：+0%
 */
export function calcElementAffinity(playerElement: string | undefined, ringElement: string | undefined): number {
  const p = normalizeElement(playerElement);
  const r = normalizeElement(ringElement);
  if (!p || !r || ['无','空'].includes(p) || ['无','空'].includes(r)) return 0;
  if(['全','全能','全元素'].includes(p))return __localElementSet(ringElement).size?.30:0;
  if(['七元素','七元素掌控'].includes(p))return (SILVER_ELEMENTS as readonly string[]).includes(r)?.3:0;
  // v2.0 特殊属性：时间、空间 互为相生，精神属性自洽
  if (p === '时间' && r === '空间') return 0.15;
  if (p === '空间' && r === '时间') return 0.15;
  if (p === '精神' && r === '精神') return 0.20;
  // 完全契合
  if (p === r) return 0.30;
  const pInfo = ELEMENT_COUNTER[p];
  if (!pInfo) return 0;
  // 武魂属性生魂环属性（相生，对武魂有利）
  if (pInfo.generates.includes(r)) return 0.15;
  // 武魂属性被魂环属性克（相克，不利）
  if (pInfo.restrainedBy.includes(r)) return -0.15;
  return 0;
}

// v4.0 魂技伤害百分比（全部降低到原来的30%）
// 十年：小于36%  → 区间 15%~33%
// 百年：小于75%  → 区间 36%~72%
// 千年：小于105%  → 区间 75%~102%
// 万年：小于165%  → 区间 105%~162%
// 10万~20万年：小于360%  → 区间 165%~345%
// 20万~50万年：小于600%  → 区间 360%~585%
// 50万~80万年：小于840%  → 区间 600%~825%
// 80万~100万年：小于960% → 区间 840%~945%
// 100万年以上：每多100万年增加300%（100万年=960%起步，每百万年+300%）
export function calcSkillDamagePct(
  years: number,
  _beastType: 'qiang' | 'min' | 'kong' | 'fu' | 'fang' = 'qiang',
  _ringIndex: number = 0,
  elementAffinity: number = 0,
): number {
  const y = Math.max(10, years || 10);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));
  let basePct: number;

  if (y < 100) {
    // 十年：15% ~ 33%（小于36%）
    const t = (y - 10) / 90;
    basePct = lerp(0.165, 0.363, t);
  } else if (y < 1000) {
    // 百年：36% ~ 72%（小于75%）
    const t = (y - 100) / 900;
    basePct = lerp(0.396, 0.792, t);
  } else if (y < 10000) {
    // 千年：75% ~ 102%（小于105%）
    const t = (y - 1000) / 9000;
    basePct = lerp(0.825, 1.122, t);
  } else if (y < 100000) {
    // 万年：105% ~ 162%（小于165%）
    const t = (y - 10000) / 90000;
    basePct = lerp(1.155, 1.782, t);
  } else if (y < 200000) {
    // 10万~20万年：165% ~ 345%（小于360%）
    const t = (y - 100000) / 100000;
    basePct = lerp(1.815, 3.795, t);
  } else if (y < 500000) {
    // 20万~50万年：360% ~ 585%（小于600%）
    const t = (y - 200000) / 300000;
    basePct = lerp(3.96, 6.435, t);
  } else if (y < 800000) {
    // 50万~80万年：600% ~ 825%（小于840%）
    const t = (y - 500000) / 300000;
    basePct = lerp(6.6, 9.075, t);
  } else if (y < 1000000) {
    // 80万~100万年：840% ~ 945%（小于960%）
    const t = (y - 800000) / 200000;
    basePct = lerp(9.24, 10.395, t);
  } else {
  // 100万年 = 960% 起步 → v7.0 提升10%后 = 1056%
  // 110万年 = 1056% × 1.15
  // 120万年 = 1056% × 1.30
  // 以此类推
  const extra100k = Math.floor((y - 1000000) / 100000);
    basePct = 10.56 * (1 + extra100k * 0.15);
  }
  const affinity = elementAffinity || 0;
  return Math.max(0.1, basePct * (1 + affinity)); // 最低10%伤害，防止属性被克制时出现负伤害
}

export function getRealmTier(level: number): number {
  // 魂士(1-10)=0, 魂师(11-20)=1, ..., 封号斗罗(91-99)=9
  if (level < 1) return 0;
  if (level >= 91) return 9;
  return Math.floor((level - 1) / 10);
}

/** 天梦冰蚕专属魂技伤害百分比（按大境界成长）
 *  魂士(1-10级)=100%, 魂师(11-20级)=180%, 每提升1个大境界再+80%, 封号斗罗=820%
 *  大境界数：魂士=0, 魂师=1, 大魂师=2, 魂尊=3, 魂宗=4, 魂王=5, 魂帝=6, 魂圣=7, 魂斗罗=8, 封号斗罗=9
 *  仅 color==='blueWhite' 的天梦冰蚕魂环使用此公式 */
export function calcTianmengDamagePct(level: number): number {
  const tier = getRealmTier(level); // 魂士(1-10)=0, 魂师(11-20)=1 ... 封号斗罗(91-99)=9
  // 魂士阶段(0)为基准100%，每高1个大境界+80%
  return 1 + tier * 0.8;
}

/** 统一刷新天梦冰蚕魂环的伤害百分比（按当前大境界成长）
 *  返回 { rings, updated }，updated 表示是否有变化（用于打日志）
 *  所有改变玩家等级的路径 MUST 调用此函数，确保天梦伤害同步提升 */
export function refreshTianmengDamagePct(
  rings: ISoulRing[],
  level: number,
  source = 'unknown',
): { rings: ISoulRing[]; updated: boolean; pct?: number } {
  if (!rings || rings.length === 0) return { rings, updated: false };
  const has = rings.some((r) => r.color === 'blueWhite');
  if (!has) return { rings, updated: false };
  const newPct = calcTianmengDamagePct(level);
  let changed = false;
  const newRings = rings.map((r) => {
    if (r.color !== 'blueWhite') return r;
    if (Math.abs((r.skillDamagePct ?? 0) - newPct) < 0.0001) return r;
    changed = true;
    return { ...r, skillDamagePct: newPct };
  });
  if (changed) {
    logger.info(`[天梦冰蚕] ${source}：伤害百分比更新为 ${(newPct * 100).toFixed(1)}%（等级${level}）`);
  }
  return { rings: newRings, updated: changed, pct: newPct };
}

/** 格式化魂技伤害百分比显示（保留1位小数，例 152.3%） */
export function formatSkillDamagePct(pct: number): string {
  return `${(pct * 100).toFixed(1)}%`;
}

// ============================================================
// 魂环数值属性加成计算
// ============================================================

// 根据魂环年限和魂兽系别计算数值属性加成（新版：全数值）
// 十年：每项+1~5；百年：每项+5~20；千年：每项+20~80；万年：每项+80~250；十万年：每项+250~800
// 不同系别有不同的主属性权重（强攻：攻+血高；敏攻：速+攻高；控制：精+速高；防御：防+血高；辅助：精+血+魂力高）
export function calcRingStatsByYears(
  years: number,
  beastType: 'qiang' | 'min' | 'kong' | 'fu' | 'fang' = 'qiang',
  options?: { deterministic?: boolean },
) {
  const y = Math.max(10, years || 10);
  let minBase = 1;
  let maxBase = 5;
  let tierBase = 10;
  let tierSpan = 90;

  if (y >= 1000000) {
    // 100万年以上：平滑线性增长，每100万年提升约100%，不封顶，年限越高属性越高
    minBase = 800;
    maxBase = 800 + ((y - 1000000) / 1000000) * 800 + 800;
    tierBase = 1000000;
    tierSpan = 1000000;
  } else if (y >= 100000) {
    minBase = 250; maxBase = 800;
    tierBase = 100000; tierSpan = 900000;
  } else if (y >= 10000) {
    minBase = 80; maxBase = 250;
    tierBase = 10000; tierSpan = 90000;
  } else if (y >= 1000) {
    minBase = 20; maxBase = 80;
    tierBase = 1000; tierSpan = 9000;
  } else if (y >= 100) {
    minBase = 5; maxBase = 20;
    tierBase = 100; tierSpan = 900;
  } else {
    minBase = 1; maxBase = 5;
    tierBase = 10; tierSpan = 90;
  }

  const ratio = y >= 1000000 ? 1 : Math.min(1, Math.max(0, (y - tierBase) / tierSpan));
  const baseVal = minBase + (maxBase - minBase) * ratio;
  // 100万年以上不再有随机浮动，稳定线性增长，避免年限提升反而属性下降
  // deterministic 模式（年限提升/重算场景）下同样使用无随机，确保年限越高属性越高
  const hasRandom = y >= 1000000 ? false : !(options?.deterministic);
  const variance = hasRandom ? (0.9 + Math.random() * 0.2) : 1;
  const v = hasRandom ? Math.max(minBase, Math.min(maxBase, baseVal * variance)) : baseVal;

  // 系别权重：主属性 1.5x，次属性 1.2x，普通 1.0x，弱属性 0.7x
  const weights: Record<string, { attack: number; defense: number; speed: number; spirit: number; hp: number; critRate: number; critDmg: number; soulPower: number; skillDmg: number }> = {
    qiang: { attack: 1.5, defense: 1.0, speed: 1.0, spirit: 0.7, hp: 1.3, critRate: 1.2, critDmg: 1.3, soulPower: 0.8, skillDmg: 1.5 },
    min:   { attack: 1.3, defense: 0.8, speed: 1.5, spirit: 1.0, hp: 0.9, critRate: 1.4, critDmg: 1.2, soulPower: 0.9, skillDmg: 1.4 },
    kong:  { attack: 0.9, defense: 0.9, speed: 1.3, spirit: 1.5, hp: 0.9, critRate: 1.0, critDmg: 1.0, soulPower: 1.3, skillDmg: 1.2 },
    fu:    { attack: 0.7, defense: 1.0, speed: 0.9, spirit: 1.4, hp: 1.3, critRate: 0.6, critDmg: 0.6, soulPower: 1.5, skillDmg: 1.0 },
    fang:  { attack: 0.9, defense: 1.5, speed: 0.7, spirit: 0.8, hp: 1.4, critRate: 0.7, critDmg: 0.7, soulPower: 0.9, skillDmg: 0.9 },
  };
  const w = weights[beastType] || weights.qiang;

  // 暴击/爆伤/魂力的基础值比例较低（相对主属性）
  const critBase = v * 0.03;   // 基础暴击率：十年约0.03~0.15，十万年约7.5~24
  const critDmgBase = v * 0.06; // 爆伤：十年约0.06~0.3，十万年约15~48
  const spBase = v * 0.5;       // 魂力：十年约0.5~2.5，十万年约125~400
  const skillDmgBase = v * 3;   // 魂技伤害基础值：十年约3~15，十万年约750~2400

  return {
    attackBonus: Math.round(v * w.attack),
    defenseBonus: Math.round(v * w.defense),
    speedBonus: Math.round(v * w.speed),
    spiritBonus: Math.round(v * w.spirit),
    hpBonus: Math.round(v * w.hp * 2),  // 气血基数更大，×2
    critRateBonus: +(critBase * w.critRate).toFixed(4),
    critDmgBonus: +(critDmgBase * w.critDmg).toFixed(4),
    soulPowerBonus: Math.round(spBase * w.soulPower),
    skillDamage: Math.round(skillDmgBase * w.skillDmg),
    // 魂技伤害百分比（位置0默认，实际赋值在吸收魂环时根据位置重算）
    skillDamagePct: 0,
  };
}

// 根据年限和部位重算魂骨基础属性（用于神考魂骨年限奖励、背包魂骨等场景）
// 返回 attributes 对象（attack/defense/speed/spirit/hp/critRate/critDmg/allAttr）
export function calcBoneAttrsByYears(years: number, slot: string): { attack: number; defense: number; speed: number; spirit: number; hp: number; critRate: number; critDmg: number; allAttr: number } {
   const y = Math.max(10, Math.min(years, 9990000));
   const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * Math.max(0, Math.min(1, t)));
   let atk = 0, def = 0, hp = 0, spd = 0, sprt = 0;
   // 魂骨属性公式必须与 rollSoulBoneDrop 严格一致，确保神考提升年限后属性只升不降
   // 区间：10年→99年 / 100年→999年 / 1000年→9999年 / 1万→9.9万年 / 10万→99万年 / 100万→999万年
   // 🔴 v18.0 重新定义魂骨属性（按用户要求）：
   //   - 10万年：五维各5万（基础）
   //   - 99万年：五维各8万（最高）
   //   - 每10万年约+0.33万，线性递增
   //   - 100万年：五维各10万（基础）
   //   - 999万年：五维各30万（最高）
   //   - 每100万年+2万，线性递增，无断点
   if (y >= 1000000) {
     const t = Math.min(1, (y - 1000000) / 8990000);
     atk = lerp(100000, 300000, t);
     def = lerp(100000, 300000, t);
     hp  = lerp(100000, 300000, t);
     spd = lerp(100000, 300000, t);
     sprt = lerp(100000, 300000, t);
   } else if (y >= 100000) {
     const t = (y - 100000) / 890000;
     atk = lerp(50000, 80000, t);
     def = lerp(50000, 80000, t);
     hp  = lerp(50000, 80000, t);
     spd = lerp(50000, 80000, t);
     sprt = lerp(50000, 80000, t);
   } else if (y >= 10000) {
     const t = (y - 10000) / 90000;
     atk = lerp(1200, 10000, t);
     def = lerp(960, 8000, t);
     hp  = lerp(4800, 40000, t);
     spd = lerp(600, 5000, t);
     sprt = lerp(720, 6000, t);
   } else if (y >= 1000) {
     const t = (y - 1000) / 9000;
     atk = lerp(100, 1100, t);
     def = lerp(80, 880, t);
     hp  = lerp(400, 4400, t);
     spd = lerp(50, 550, t);
     sprt = lerp(60, 660, t);
   } else if (y >= 100) {
     const t = (y - 100) / 900;
     atk = lerp(12, 90, t);
     def = lerp(10, 72, t);
     hp  = lerp(50, 360, t);
     spd = lerp(6, 44, t);
     sprt = lerp(7, 52, t);
   } else {
     const t = Math.max(0, (y - 10) / 90);
     atk = Math.max(1, lerp(2, 11, t));
     def = Math.max(1, lerp(1.6, 9, t));
     hp  = Math.max(10, lerp(8, 45, t));
     spd = Math.max(1, lerp(1, 5.5, t));
     sprt = Math.max(1, lerp(1.2, 6.5, t));
   }
  // 按部位侧重
  let attackBonus = atk, defenseBonus = def, speedBonus = spd;
  let spiritBonus = sprt, hpBonus = hp;
  if (slot === 'head') {
    spiritBonus = Math.floor(sprt * 1.6);
    attackBonus = Math.floor(atk * 0.7);
    defenseBonus = Math.floor(def * 0.7);
    hpBonus = Math.floor(hp * 0.7);
  } else if (slot === 'torso') {
    hpBonus = Math.floor(hp * 1.8);
    defenseBonus = Math.floor(def * 1.6);
    speedBonus = Math.floor(spd * 0.6);
  } else if (slot === 'leftArm' || slot === 'rightArm') {
    attackBonus = Math.floor(atk * 1.8);
    defenseBonus = Math.floor(def * 0.7);
    hpBonus = Math.floor(hp * 0.7);
  } else if (slot === 'leftLeg' || slot === 'rightLeg') {
    speedBonus = Math.floor(spd * 1.8);
    defenseBonus = Math.floor(def * 1.1);
    attackBonus = Math.floor(atk * 0.8);
  } else if (slot === 'external') {
    attackBonus = Math.floor(atk * 1.3);
    defenseBonus = Math.floor(def * 1.3);
    speedBonus = Math.floor(spd * 1.3);
    spiritBonus = Math.floor(sprt * 1.3);
    hpBonus = Math.floor(hp * 1.3);
  }
  return {
    attack: attackBonus,
    defense: defenseBonus,
    speed: speedBonus,
    spirit: spiritBonus,
    hp: hpBonus,
    critRate: 0,
    critDmg: 0,
    allAttr: 0,
  };
}

// 计算五维属性（基础属性 × (1+魂环百分比总和) + 装备固定 + 魂骨固定）
export interface IAttrs {
  attack: number;
  defense: number;
  speed: number;
  spirit: number;
  hp: number;
  critRate: number;
  critDmg: number;
  overflowCritConvertedDmg: number;
  allAttrPct: number;
  maxSoulPower: number;
  armorResonanceActive: boolean; // 神装-神器共鸣是否激活
  // 魂导核心宝石加成（从5个魂导器槽位累加）
  coreGemBonus: {
    skillDmgPct: number;    // 红宝石：魂技伤害加成 +10%/个
    basicDmgPct: number;    // 蓝宝石：普攻伤害加成 +10%/个
    hpRegenPct: number;     // 绿宝石：战斗后回血 +5%/个
    spiritBonusPct: number; // 紫宝石：精神属性 +5%/个（已计入spirit）
    critRateAdd: number;    // 金宝石：暴击率 +5%/个（已计入critRate）
    speedBonusPct: number;  // 青宝石：速度属性 +5%/个（已计入speed）
  };
  // 状态提示：影响战力的buff/debuff（供UI展示，解释战力波动原因）
  statusFlags: {
    weaknessActive: boolean;       // 虚弱状态（交融后5分钟，全属性-80%）
    weaknessRemainSec: number;     // 虚弱剩余秒数
    divorcePenaltyPct: number;     // 离婚惩罚百分比（每次-5%）
    divinePowerPct: number;        // 神力百分比
    affinityPct: number;           // 神位亲和度百分比
    soulCoreBonus: number;         // 魂核加成倍数
    inheritedBonusPct: number;     // 继承神位全属性加成
    artifactLevelBonusPct: number; // 神器等级加成（均值）
    totalSupremeArtifacts: number; // 已获得的至高神器数量
  };
}

// 转世轮回 - 轮回球（每一世的记录快照）
export interface IReincarnationOrb {
  dragonBloodline?: import('./dragonBloodline').BloodlineProgress;
  dragonLegend?: import('./dragonLegend').DragonProgress;
  index: number;           // 第几世（1-based）
  timestamp: number;       // 转世时间戳
  name: string;            // 角色名
  level: number;           // 最终等级
  realm: string;           // 最终境界
  direction: string;       // 修炼方向
  martialSoul: IMartialSoul;  // 主修武魂
  isTwinSoul: boolean;
  secondSoul: IMartialSoul | null;
  soulRings: ISoulRing[];
  secondSoulRings: ISoulRing[];
  soulBones: ISoulBoneSlots;
  equipment: IEquipmentSlots;
  soulSpirits: IPlayerSoulSpirit[];
  soulCoins: number;
  inventoryCount: number;  // 背包物品数（不存具体物品，只记数量）
  inventory: IItem[];       // 背包物品详细列表（完整物品数据）
  attributes: IAttrs;      // 最终属性快照
  recruitedCount: number;  // 招募角色数
  teamCount: number;       // 队伍人数
  domainName: string;      // 领域名称（无则空串）
  divineTrialName: string; // 神考名称（无则空串）
}
export function calcAttributes(player: IPlayer): IAttrs {
  // 防御性校验：确保关键字段为有限数字，避免 NaN 传播导致全属性崩溃
  const safeLevel = Number.isFinite(player.level) ? player.level : 1;
  const safeSoulPower = Number.isFinite(player.soulPower) ? player.soulPower : 1;
  const safePlayer = { ...player, level: safeLevel, soulPower: safeSoulPower };
  player = safePlayer;

  let base = player.martialSoul.baseStats || { attack: 50, defense: 50, speed: 50, spirit: 50, hp: 100 };

  // v2.0 品质整体加成：传说级以上武魂初始属性提升
  // v7.0 所有武魂基础属性提升30%；超神级额外全属性均衡加成
  // v7.1 所有武魂基础属性再提升10%（总计40%）
  const quality = player.martialSoul.quality;
  let qualityMultiplier = 1;
  if (quality === 'supremeDivine') qualityMultiplier = 3.0; // 至高神级×3.0（两仪神剑）
  else if (quality === 'superDivine') qualityMultiplier = 2.8;   // 超神级×2.8（均衡全属性）
  else if (quality === 'divine') qualityMultiplier = 2.3;   // 神级×2.3
  else if (quality === 'legendary') qualityMultiplier = 1.8; // 传说级×1.8
  else if (quality === 'epic') qualityMultiplier = 1.3;      // 史诗级×1.3
  // 基础提升40%（v7.1 由30%提升至40%）
  const baseBoost = 1.4;

  base = {
    attack: base.attack * qualityMultiplier * baseBoost,
    defense: base.defense * qualityMultiplier * baseBoost,
    speed: base.speed * qualityMultiplier * baseBoost,
    spirit: base.spirit * qualityMultiplier * baseBoost,
    hp: base.hp * qualityMultiplier * baseBoost,
  };

  // 至高神级/超神级武魂：全属性均衡补正（确保五维更接近，避免某一属性极端低）
  if (quality === 'supremeDivine' || quality === 'superDivine') {
    const vals = [base.attack, base.defense, base.speed, base.spirit, base.hp];
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    base.attack = Math.max(base.attack, avg * 0.85);
    base.defense = Math.max(base.defense, avg * 0.85);
    base.speed = Math.max(base.speed, avg * 0.85);
    base.spirit = Math.max(base.spirit, avg * 0.85);
    base.hp = Math.max(base.hp, avg * 0.85);
  }

  // 先天魂力加成（每级先天魂力+3%所有属性，额外精神+5%）
  const powerMultiplier = 1 + (player.soulPower - 1) * 0.03;
  const spiritPowerBonus = 1 + (player.soulPower - 1) * 0.05;

  // 等级成长（均衡成长，与武魂类型解耦）
  // v21.0 再次大幅提升升级成长：攻击×3、防御×3、速度×3、精神×3、血量×3，升级成长感强烈
  const lvlGrowth = { attack: 72, defense: 63, speed: 45, spirit: 45, hp: 660 };

  // 升级成长系数
  const growthMul = 1.0;
  let attack = base.attack * powerMultiplier + player.level * lvlGrowth.attack * growthMul;
  let defense = base.defense * powerMultiplier + player.level * lvlGrowth.defense * growthMul;
  let speed = base.speed * powerMultiplier + player.level * lvlGrowth.speed * growthMul;
  let spirit = base.spirit * spiritPowerBonus + player.level * lvlGrowth.spirit * growthMul;
  if(hasLiehun(player))spirit+=readNianBonus(player.nianBonus).totalSpirit;
  let hp = base.hp * powerMultiplier + player.level * lvlGrowth.hp * growthMul;

  // 转世轮回：每世增加觉醒武魂基础属性50%（可叠加，基于基础属性部分）
  const reicCount = player.reincarnation?.count ?? 0;
  const reicBasePct = reicCount * 0.5; // 每世50%
  if (reicBasePct > 0) {
    attack += (base.attack * powerMultiplier) * reicBasePct;
    defense += (base.defense * powerMultiplier) * reicBasePct;
    speed += (base.speed * powerMultiplier) * reicBasePct;
    spirit += (base.spirit * spiritPowerBonus) * reicBasePct;
    hp += (base.hp * powerMultiplier) * reicBasePct;
  }
  // 兼容旧存档的累计攻击力加成（保留以免旧档清零）
  const reincarnationAtkBonus = player.reincarnation?.totalAttackBonus ?? 0;
  if (reincarnationAtkBonus > 0) {
    attack += reincarnationAtkBonus;
  }

  const mainExtremeMul=extremeMultipliers(player.martialSoul.extremeAttribute||'');
  attack*=mainExtremeMul.attack;defense*=mainExtremeMul.defense;speed*=mainExtremeMul.speed;spirit*=mainExtremeMul.spirit;hp*=mainExtremeMul.hp;

  // 属性克制加成：武魂属性与魂环/魂骨魂兽属性相同，各+5%，叠加最高+10%
  // 主修武魂属性 + 第一武魂魂环 + 所有魂骨 参与共鸣
  // 🔴 修复：优先使用 extremeAttribute（极致属性）作为判定属性，再 fallback 到 element
  // 极致之冰/极致之火/全属性 等极致属性比普通 element 更精确，能确保同属性正确共鸣
  const playerElement=player.martialSoul.element||getSoulElement(player.martialSoul.name);
  const boneList = player.divineArmor?.hasArmor && player.divineArmor.sourceBones
    ? Object.values(player.divineArmor.sourceBones).filter((b): b is IItem => b !== null && b.type === 'soulBone')
    : Object.values(player.soulBones).filter((b): b is IItem => b !== null && b.type === 'soulBone');
  const ringList = player.soulRings || [];
  const attrBonus = calcAttributeBonus(playerElement, ringList, boneList, {
    quality: player.martialSoul.quality,
    extremeAttribute: player.martialSoul.extremeAttribute,
  });
  if (attrBonus.bonusPct > 0) {
    const mul = 1 + attrBonus.bonusPct;
    attack *= mul;
    defense *= mul;
    speed *= mul;
    spirit *= mul;
    hp *= mul;
  }
  // 第二武魂属性加成：次修武魂属性 + 第二武魂魂环 + 所有魂骨 参与共鸣（独立计算，不累加上限）
  if (player.isTwinSoul && player.secondSoul) {
    const secondElement=player.secondSoul.element||getSoulElement(player.secondSoul.name);
    const secondExtremeMul=extremeMultipliers(player.secondSoul.extremeAttribute||'',true);
    attack*=secondExtremeMul.attack;defense*=secondExtremeMul.defense;speed*=secondExtremeMul.speed;spirit*=secondExtremeMul.spirit;hp*=secondExtremeMul.hp;
    const secondBonus = calcAttributeBonus(secondElement, player.secondSoulRings||[], boneList, {
      quality: player.secondSoul.quality,
      extremeAttribute: player.secondSoul.extremeAttribute,
    });
    if (secondBonus.bonusPct > 0) {
      const mul = 1 + secondBonus.bonusPct;
      attack *= mul;
      defense *= mul;
      speed *= mul;
      spirit *= mul;
      hp *= mul;
    }
  }

  // 暴击/爆伤/全属性/魂力 累计变量（魂骨 + 魂导器 + 魂环 都会累加）
  let critRate = 0;     // 暴击率（小数，例如 0.1 = 10%）
  let critDmg = 0;      // 爆伤（小数，在基础150%上的额外，总爆伤 = 1.5 + critDmg）

  // 极致属性中的暴击/爆伤加成
  // 极致之剑/极致之刃/极致之杀 等近战类极致额外加暴击，避免与上方重复
  if (player.martialSoul.extremeAttribute) {
    const extreme = player.martialSoul.extremeAttribute;
    if (extreme === '全属性') {
      critRate += 0.08;  // 全属性：+8% 暴击率
      critDmg += 0.15;  // +15% 暴击伤害
    } else {
      if (extreme.includes('剑')) {
        critRate += 0.1; // 极致之剑：+10% 暴击率（精准）
      }
      if (extreme.includes('杀')) {
        critRate += 0.15; // 极致之杀：+15% 暴击率
        critDmg += 0.3;  // +30% 暴击伤害
      }
      if (extreme.includes('刃')) {
        critRate += 0.08; // 极致之刃：+8% 暴击率
        critDmg += 0.2;  // +20% 暴击伤害
      }
      if (extreme.includes('雷霆') || extreme.includes('雷')) {
        critRate += 0.06; // 极致之雷霆：+6% 暴击率
      }
      if (extreme.includes('黑暗') || extreme.includes('暗')) {
        critRate += 0.05; // 极致之黑暗：+5% 暴击率
      }
      if (extreme.includes('火') || extreme.includes('炎')) {
        critDmg += 0.1;  // 极致之火：+10% 暴击伤害
      }
    }
  }
  let allAttrPct = 0;   // 全属性百分比加成（加到五维上）
  let totalSoulPowerBonus = 0; // 最大魂力数值加成

  // 装备 + 魂骨 固定数值加成
  const allEquips = [...Object.values(player.equipment), ...Object.values(player.soulBones)];
  for (const item of allEquips) {
    if (item?.attributes && item.type === 'soulBone') {
      // 魂骨：五维固定数值加成（v8.0 全量生效）
      attack += (item.attributes.attack ?? 0);
      defense += (item.attributes.defense ?? 0);
      speed += (item.attributes.speed ?? 0);
      spirit += (item.attributes.spirit ?? 0);
      hp += (item.attributes.hp ?? 0);
      // 魂骨：暴击率/爆伤/全属性（百分比值，如 3 表示 +3%）
      critRate += (item.attributes.critRate ?? 0) / 100;
      critDmg += (item.attributes.critDmg ?? 0) / 100;
      allAttrPct += (item.attributes.allAttr ?? 0) / 100;
    }
   }

   // 🔴 v15.0 神装属性加成：已转化神装后，神装提供单独的属性（与魂骨独立，不叠加）
   if (player.divineArmor?.hasArmor && player.divineArmor.armorItem?.attributes) {
     const a = player.divineArmor.armorItem.attributes;
     attack += (a.attack ?? 0);
     defense += (a.defense ?? 0);
     speed += (a.speed ?? 0);
     spirit += (a.spirit ?? 0);
     hp += (a.hp ?? 0);
     critRate += (a.critRate ?? 0) / 100;
     critDmg += (a.critDmg ?? 0) / 100;
     allAttrPct += (a.allAttr ?? 0) / 100;
   }

   // 🔴 v16.0 神界系统：背包中拥有的被动物品（神界中枢、作者的第一次等）提供全属性加成
   // 支持 material（材料）和 special（特殊物品）两种类型，确保神界中枢等 special 物品正常生效
   if (player.inventory && player.inventory.length > 0) {
     for (const item of player.inventory) {
       if ((item.type === 'material' || item.type === 'special') && item.attributes?.allAttr && item.attributes.allAttr > 0) {
         allAttrPct += item.attributes.allAttr / 100;
       }
     }
   }

   // 🔴 特殊物品固定数值加成（混沌神剑等创世级神器，五维各+30亿固定值）
   if (player.inventory && player.inventory.length > 0) {
     for (const item of player.inventory) {
       if (item.type === 'special' && item.attributes) {
         attack += item.attributes.attack ?? 0;
         defense += item.attributes.defense ?? 0;
         speed += item.attributes.speed ?? 0;
         spirit += item.attributes.spirit ?? 0;
         hp += item.attributes.hp ?? 0;
       }
     }
   }

   // 魂灵上阵属性加成：每只上阵魂灵按境界提供少量百分比加成（v18.0 再提升50%）
   // 🔴 同属性加成：魂灵属性与主武魂属性契合时，该魂灵的属性加成额外 +50%
   if (player.activeSpiritIds && player.activeSpiritIds.length > 0 && player.soulSpirits) {
     let totalAtkPct = 0, totalDefPct = 0, totalSpdPct = 0, totalSpiPct = 0, totalHpPct = 0;
     // 预先构建 Map，O(1) 查找代替 Array.find（避免 O(n²)）
     const spiritMap = new Map(player.soulSpirits.map((s) => [s.spiritId, s]));
     // 获取主武魂主属性（归一化后用于匹配）
     const mainSoulElement = player.martialSoul?.element;
     const mainElementNorm = normalizeElement(mainSoulElement);
     const isChaosMain = mainElementNorm === '混沌' || mainElementNorm === '全属性';
     for (const spiritId of player.activeSpiritIds) {
       const spirit = spiritMap.get(spiritId);
       if (!spirit) continue;
       // 境界加成：初阶(0)+1.2%每重，逐大境界递增（v18.0 提升50%）
       const realmBonus = 0.012 + spirit.majorIndex * 0.0096; // 1.2% 起步，每大境界+0.96%
       const minorBonus = spirit.minor * 0.0024; // 每重+0.24%
       let singleBonus = (realmBonus + minorBonus) * evolutionMultiplier(spirit);
       // 🔴 同属性魂灵加成 +50%：魂灵属性与主武魂属性相同/相生 或 主武魂为混沌/全属性
       const spiritElementNorm = normalizeElement(spirit.attribute);
       const affinity = calcElementAffinity(mainSoulElement, spirit.attribute);
       if (isChaosMain || spiritElementNorm === mainElementNorm || affinity >= 0.15) {
         singleBonus *= 1.5;
       }
       // 属性方向：根据魂灵属性侧重不同属性
      const attr = spirit.attribute;
      if (attr === '金' || attr === '土' || attr === '力量') { totalAtkPct += singleBonus; totalDefPct += singleBonus * 0.5; }
      else if (attr === '木' || attr === '生命') { totalHpPct += singleBonus * 1.5; totalDefPct += singleBonus * 0.5; }
      else if (attr === '水' || attr === '冰') { totalDefPct += singleBonus; totalSpiPct += singleBonus * 0.5; }
      else if (attr === '火' || attr === '雷') { totalAtkPct += singleBonus * 1.3; }
      else if (attr === '风') { totalSpdPct += singleBonus * 1.5; totalAtkPct += singleBonus * 0.3; }
      else if (attr === '光' || attr === '光明' || attr === '神圣') { totalSpiPct += singleBonus; totalHpPct += singleBonus * 0.5; }
      else if (attr === '暗' || attr === '黑暗' || attr === '暗影' || attr === '幽冥') { totalAtkPct += singleBonus; totalSpiPct += singleBonus * 0.5; }
      else if (attr === '精神' || attr === '时间') { totalSpiPct += singleBonus * 1.2; totalSpdPct += singleBonus * 0.5; }
      else if (attr === '空间') { totalSpdPct += singleBonus; totalAtkPct += singleBonus * 0.5; }
      else if (attr === '混沌') { totalAtkPct += singleBonus * 0.8; totalSpiPct += singleBonus * 0.8; totalSpdPct += singleBonus * 0.4; }
      else { totalAtkPct += singleBonus * 0.5; totalDefPct += singleBonus * 0.5; totalSpdPct += singleBonus * 0.5; totalSpiPct += singleBonus * 0.5; totalHpPct += singleBonus * 0.5; }
    }
    // 应用魂灵加成
    if (totalAtkPct > 0) attack *= (1 + totalAtkPct);
    if (totalDefPct > 0) defense *= (1 + totalDefPct);
    if (totalSpdPct > 0) speed *= (1 + totalSpdPct);
    if (totalSpiPct > 0) spirit *= (1 + totalSpiPct);
    if (totalHpPct > 0) hp *= (1 + totalHpPct);
  }

    // 魂导器：商店魂导器数值加成，自制魂导器百分比加成
    for (const item of Object.values(player.equipment)) {
      if (item?.type === 'soulGuide' && item.attributes) {
         if (item.craftable && item.craftVersion !== 2) {
            // 旧版v1自制魂导器：百分比加成（v3.1 累计降低约 44%）
            const atkPct = (item.attributes.attack ?? 0) / 100 * 0.56;
            const defPct = (item.attributes.defense ?? 0) / 100 * 0.56;
            const spdPct = (item.attributes.speed ?? 0) / 100 * 0.56;
            const sprtPct = (item.attributes.spirit ?? 0) / 100 * 0.56;
            const hpPct = (item.attributes.hp ?? 0) / 100 * 0.56;
            if (atkPct > 0) attack *= (1 + atkPct);
            if (defPct > 0) defense *= (1 + defPct);
            if (spdPct > 0) speed *= (1 + spdPct);
            if (sprtPct > 0) spirit *= (1 + sprtPct);
            if (hpPct > 0) hp *= (1 + hpPct);
            critRate += (item.attributes.critRate ?? 0) / 100 * 0.56;
            critDmg += (item.attributes.critDmg ?? 0) / 100 * 0.56;
            allAttrPct += (item.attributes.allAttr ?? 0) / 100 * 0.56;
            totalSoulPowerBonus += (item.attributes.soulPower ?? 0) * 0.56;
          } else {
           // 商店魂导器 + v2.0自制魂导器：数值加成（v7.0 新数值表后直接加，不再额外压缩，保证面板与数值一致）
             const atk = (item.attributes.attack ?? 0);
             const def = (item.attributes.defense ?? 0);
             const spd = (item.attributes.speed ?? 0);
             const sprt = (item.attributes.spirit ?? 0);
             const hpVal = (item.attributes.hp ?? 0);
             attack += atk;
             defense += def;
             speed += spd;
             spirit += sprt;
             hp += hpVal;
             critRate += (item.attributes.critRate ?? 0) / 100;
             critDmg += (item.attributes.critDmg ?? 0) / 100;
             allAttrPct += (item.attributes.allAttr ?? 0) / 100;
             totalSoulPowerBonus += (item.attributes.soulPower ?? 0);
        }
      }
    }

   // 🔴 魂导核心宝石（specialEffect）属性类加成：5个魂导器槽位上的宝石效果累加
   // 属性类效果（spiritBonus/speedBonus/critRate）在此直接累加到最终属性
   // 战斗伤害类效果（skillDmg/basicDmg/hpRegen）收集到 coreGemBonus，供战斗页读取使用
   let coreGemSkillDmgPct = 0;
   let coreGemBasicDmgPct = 0;
   let coreGemHpRegenPct = 0;
   let coreGemSpiritPct = 0;
   let coreGemSpeedPct = 0;
   let coreGemCritRateAdd = 0;
   for (const item of Object.values(player.equipment)) {
     if (item?.type === 'soulGuide' && item.specialEffect?.key) {
       const key = item.specialEffect.key;
       if (key === 'skillDmg') coreGemSkillDmgPct += 0.10;       // 红宝石：魂技伤害+10%
       else if (key === 'basicDmg') coreGemBasicDmgPct += 0.10;  // 蓝宝石：普攻伤害+10%
       else if (key === 'hpRegen') coreGemHpRegenPct += 0.05;    // 绿宝石：战斗后回血+5%
       else if (key === 'spiritBonus') coreGemSpiritPct += 0.05; // 紫宝石：精神+5%
       else if (key === 'speedBonus') coreGemSpeedPct += 0.05;   // 青宝石：速度+5%
       else if (key === 'critRate') coreGemCritRateAdd += 0.05;  // 金宝石：暴击率+5%
     }
   }
   if (coreGemSpiritPct > 0) spirit *= (1 + coreGemSpiritPct);
   if (coreGemSpeedPct > 0) speed *= (1 + coreGemSpeedPct);
   if (coreGemCritRateAdd > 0) critRate += coreGemCritRateAdd;

  // 魂环数值加成（v3.1 累计降低约 65%）
  for (const ring of player.soulRings) {
    attack += (ring.attackBonus ?? 0) * 0.35;
    defense += (ring.defenseBonus ?? 0) * 0.35;
    speed += (ring.speedBonus ?? 0) * 0.35;
    spirit += (ring.spiritBonus ?? 0) * 0.35;
    hp += (ring.hpBonus ?? 0) * 0.35;
    critRate += (ring.critRateBonus ?? 0) * 0.35;
    critDmg += (ring.critDmgBonus ?? 0) * 0.35;
    totalSoulPowerBonus += (ring.soulPowerBonus ?? 0) * 0.35;
  }
  // 第二武魂魂环也计入总属性（双生武魂叠加，v3.1 累计降低约 65%）
  if (player.isTwinSoul && player.secondSoul && player.secondSoulRings) {
    for (const ring of player.secondSoulRings) {
      attack += (ring.attackBonus ?? 0) * 0.35;
      defense += (ring.defenseBonus ?? 0) * 0.35;
      speed += (ring.speedBonus ?? 0) * 0.35;
      spirit += (ring.spiritBonus ?? 0) * 0.35;
      hp += (ring.hpBonus ?? 0) * 0.35;
      critRate += (ring.critRateBonus ?? 0) * 0.35;
      critDmg += (ring.critDmgBonus ?? 0) * 0.35;
      totalSoulPowerBonus += (ring.soulPowerBonus ?? 0) * 0.35;
    }
  }

  // 消耗品单属性百分比加成（仙草单属性 / 属性灵草百分比等，按已保存加成完整计算）
  const cb = player.consumableBonus;
  const CONSUMABLE_PCT_SCALE = 1;
  if (cb) {
    if (cb.attackPct > 0) attack *= (1 + cb.attackPct * CONSUMABLE_PCT_SCALE);
    if (cb.defensePct > 0) defense *= (1 + cb.defensePct * CONSUMABLE_PCT_SCALE);
    if (cb.speedPct > 0) speed *= (1 + cb.speedPct * CONSUMABLE_PCT_SCALE);
    if (cb.spiritPct > 0) spirit *= (1 + cb.spiritPct * CONSUMABLE_PCT_SCALE);
    if (cb.hpPct > 0) hp *= (1 + cb.hpPct * CONSUMABLE_PCT_SCALE);
  }

  // 消耗品全属性百分比加成（仙草全属性 / 生命之水 / 极寒冰玉等）
  if (cb && cb.allAttrPct > 0) {
    allAttrPct += cb.allAttrPct * CONSUMABLE_PCT_SCALE;
  }

  // 全属性百分比加成（自制魂导器 + 魂骨 + 消耗品全属性）
  if (allAttrPct > 0) {
    attack = attack * (1 + allAttrPct);
    defense = defense * (1 + allAttrPct);
    speed = speed * (1 + allAttrPct);
    spirit = spirit * (1 + allAttrPct);
    hp = hp * (1 + allAttrPct);
  }

   // 消耗品固定数值加成（属性灵草等，按已保存固定值完整计算）
   // 🔴 修复：移到全属性百分比乘法之后，避免被 allAttrPct 二次放大导致战力异常
   if (cb) {
     attack += Math.round((cb.attackFix ?? 0) * CONSUMABLE_PCT_SCALE);
      defense += Math.round((cb.defenseFix ?? 0) * CONSUMABLE_PCT_SCALE);
      speed += Math.round((cb.speedFix ?? 0) * CONSUMABLE_PCT_SCALE);
      spirit += Math.round((cb.spiritFix ?? 0) * CONSUMABLE_PCT_SCALE);
      hp += Math.round((cb.hpFix ?? 0) * CONSUMABLE_PCT_SCALE);
    }

   // 🔴 吞噬茶武魂·吞噬天赋：永久固定属性加成（击败魂兽吞噬获得）
   if (player.devour) {
     attack += player.devour.totalAttack ?? 0;
     defense += player.devour.totalDefense ?? 0;
     speed += player.devour.totalSpeed ?? 0;
     spirit += player.devour.totalSpirit ?? 0;
     hp += player.devour.totalHp ?? 0;
     // 🔴 吞噬反噬：永久降低全属性
     attack -= player.devour.backlashAttack ?? 0;
     defense -= player.devour.backlashDefense ?? 0;
     speed -= player.devour.backlashSpeed ?? 0;
     spirit -= player.devour.backlashSpirit ?? 0;
     hp -= player.devour.backlashHp ?? 0;
   }

   // 🔴 两仪神剑特殊能力1：每突破一个大境界永久+10%攻击力
   // 大境界数 = 等级 // 10（10级=1个，20级=2个…90级=9个，最多90%）
   if (player.martialSoul.name === '两仪神剑' || player.secondSoul?.name === '两仪神剑') {
     const realmCount = Math.floor(player.level / 10);
     if (realmCount > 0) {
       const bonusPct = realmCount * 0.10;
       attack = Math.round(attack * (1 + bonusPct));
     }
   }

  // 魂核全属性加成（阴阳魂核突破奖励，在基础属性后、神级境界前应用）
  // 注意：魂核加成在此处只计算一次，下方不再重复叠加
  let soulCoreBonus = 0;
  // 阴阳魂核加成：单个魂核 +200%，双魂核圆满 +400%
  if ((player.soulCoreType === 'yin' || player.soulCoreType === 'yang') && player.level >= 90) {
    soulCoreBonus += 2.0; // 单魂核 +200%
  }
  if (player.soulCoreType === 'yin-yang' && player.level >= 99) {
    soulCoreBonus += 4.0; // 双魂核圆满 +400%
  }
   if (soulCoreBonus > 0) {
     attack = Math.round(attack * (1 + soulCoreBonus));
     defense = Math.round(defense * (1 + soulCoreBonus));
     speed = Math.round(speed * (1 + soulCoreBonus));
     spirit = Math.round(spirit * (1 + soulCoreBonus));
     hp = Math.round(hp * (1 + soulCoreBonus));
     allAttrPct += soulCoreBonus;
   }

   // 🔴 v22.0 法则被动效果（融合后自动生效）
   const lawsFused = player.divineTrial?.lawsFused;
   if (lawsFused) {
     if (lawsFused.time) speed = Math.round(speed * 1.15);            // 时间法则：速度+15%
     if (lawsFused.space) spirit = Math.round(spirit * 1.15);       // 空间法则：精神+15%
     if (lawsFused.gold) attack = Math.round(attack * 1.15);        // 金之法则：攻击+15%
     if (lawsFused.wood) hp = Math.round(hp * 1.15);               // 木之法则：血量+15%
     if (lawsFused.water) defense = Math.round(defense * 1.15);    // 水之法则：防御+15%
     if (lawsFused.fire) attack = Math.round(attack * 1.15);       // 火之法则：攻击+15%
     if (lawsFused.earth) defense = Math.round(defense * 1.15);    // 土之法则：防御+15%
     if (lawsFused.light) {                                         // 光之法则：全属性+10%
       attack = Math.round(attack * 1.10);
       defense = Math.round(defense * 1.10);
       speed = Math.round(speed * 1.10);
       spirit = Math.round(spirit * 1.10);
       hp = Math.round(hp * 1.10);
     }
     if (lawsFused.dark) {                                          // 暗之法则：全属性+10%
       attack = Math.round(attack * 1.10);
       defense = Math.round(defense * 1.10);
       speed = Math.round(speed * 1.10);
       spirit = Math.round(spirit * 1.10);
       hp = Math.round(hp * 1.10);
     }
     if (lawsFused.chaos) {                                         // 混沌法则：全属性+20%
       attack = Math.round(attack * 1.20);
       defense = Math.round(defense * 1.20);
       speed = Math.round(speed * 1.20);
       spirit = Math.round(spirit * 1.20);
       hp = Math.round(hp * 1.20);
     }
   }

  // 领域加成不在常驻属性里计算——领域是战斗内开关能力，开启时才生效
  // （保持与武魂真身类似的模式：基础属性不含领域，战斗内开启领域时额外叠加）
  let maxSoulPower = Math.round(spirit * 2 + player.level * 2 + totalSoulPowerBonus);

  // 暴击率上限100%，溢出部分每2%转1%爆伤
  let effectiveCritRate = Math.min(1, critRate);
  let overflowCritRate = Math.max(0, critRate - 1);
  let convertedCritDmg = overflowCritRate / 2;
  let totalCritDmg = 1.5 + critDmg + convertedCritDmg;

  // 彩蛋境界全属性加成（99级之上）：准半神+50%、半神+100%、准神+150%
  const easterStage = Math.max(0, Math.min(3, player.easterRealmStage ?? 0));
  if (easterStage > 0) {
    const easterBonus = easterStage * 0.5; // 每阶 +50%
    attack = Math.round(attack * (1 + easterBonus));
    defense = Math.round(defense * (1 + easterBonus));
    speed = Math.round(speed * (1 + easterBonus));
    spirit = Math.round(spirit * (1 + easterBonus));
    hp = Math.round(hp * (1 + easterBonus));
    maxSoulPower = Math.round(maxSoulPower * (1 + easterBonus));
  }

  // 神考系统加成：神力百分比（每1%神力=全属性+1%）
  const divinePowerPct = player.divineTrial?.divinePowerPct ?? 0;
  if (divinePowerPct > 0) {
    const d = divinePowerPct / 100;
    attack = Math.round(attack * (1 + d));
    defense = Math.round(defense * (1 + d));
    speed = Math.round(speed * (1 + d));
    spirit = Math.round(spirit * (1 + d));
    hp = Math.round(hp * (1 + d));
    maxSoulPower = Math.round(maxSoulPower * (1 + d));
    allAttrPct += d;  // 计入总全属性百分比展示
  }

  // 神考系统加成：神位亲和度（每1%亲和度=全属性+0.5%，满100%=全属性+50%）
  const affinityPct = player.divineTrial?.affinityPct ?? 0;
  if (affinityPct > 0) {
    const a = affinityPct * 0.5 / 100;  // 0.5% / 每点亲和度
    attack = Math.round(attack * (1 + a));
    defense = Math.round(defense * (1 + a));
    speed = Math.round(speed * (1 + a));
    spirit = Math.round(spirit * (1 + a));
    hp = Math.round(hp * (1 + a));
    maxSoulPower = Math.round(maxSoulPower * (1 + a));
    allAttrPct += a;
  }

  // 神考系统加成：神器等级加成（按各神器 perLevelBonus 线性累加）
  // 🔴 神器系统重构：神位神器等级加成 + 至高神器永久叠加
  // - 神位神器：继承神位后始终生效（按等级线性加成），与 activeArtifactId 无关
  // - 至高神器：通过结识角色夫妻获得，永久叠加固定属性，不随切换丢失
  // - 两者完全独立，叠加计算
  const artifactLevel = player.divineTrial?.artifactLevel ?? 1;
  const artifactDrawn = player.divineTrial?.artifactDrawn ?? false;
  const chosenTrialId = player.divineTrial?.chosenTrialId || null;
  const supremeArtifacts = player.divineTrial?.supremeArtifacts || [];
  
  // 神位神器等级加成：只要拔出了神器 + 选好了神考，就一直生效（按等级线性）
  // 不再因 activeArtifactId 切换至高神器而丢失
  // 🔴 修复：所有神位神器（至高/超/一级/二级）都享受等级加成，之前错误地排除了 supreme 级
  if (artifactDrawn && artifactLevel >= 1 && chosenTrialId) {
    const deityArt = getArtifactByDeity(chosenTrialId);
    if (deityArt) {
      const lv = artifactLevel;
      const atkBonus = deityArt.perLevelBonus.attack * lv;
      const defBonus = deityArt.perLevelBonus.defense * lv;
      const spdBonus = deityArt.perLevelBonus.speed * lv;
      const spiBonus = deityArt.perLevelBonus.spirit * lv;
      const hpBonus = deityArt.perLevelBonus.hp * lv;
      attack = Math.round(attack * (1 + atkBonus));
      defense = Math.round(defense * (1 + defBonus));
      speed = Math.round(speed * (1 + spdBonus));
      spirit = Math.round(spirit * (1 + spiBonus));
      hp = Math.round(hp * (1 + hpBonus));
      maxSoulPower = Math.round(maxSoulPower * (1 + spiBonus));
      const avgBonus = (atkBonus + defBonus + spdBonus + spiBonus + hpBonus) / 5;
      allAttrPct += avgBonus;
    }
  }
  
  // 至高神器永久叠加：所有已获得的至高神器固定属性永久生效
  for (const artId of supremeArtifacts) {
    if (artId === 'art-yinyang-sword') {
      attack += 1_000_000_000; // 鸿蒙两仪神剑：+10亿攻击力
    } else if (artId === 'art-dream-sword') {
      speed += 1_000_000_000;  // 永念梦之剑：+10亿速度
    } else if (artId === 'art-tianyu-spear') {
      spirit += 1_000_000_000; // 寰宇之枪：+10亿精神力
    }
  }

  // 神考系统加成：继承神位后的全属性加成（数值由 divineTrials 定义）
  const inherited = player.divineTrial?.inherited ?? false;
  let inheritBonusPct = 0;
  if (inherited && player.divineTrial?.chosenTrialId) {
    const trial = DIVINE_TRIALS.find((t) => t.id === player.divineTrial!.chosenTrialId);
    if (trial) {
      inheritBonusPct = trial.inheritBonus.allAttrPct / 100;
      attack = Math.round(attack * (1 + inheritBonusPct));
      defense = Math.round(defense * (1 + inheritBonusPct));
      speed = Math.round(speed * (1 + inheritBonusPct));
      spirit = Math.round(spirit * (1 + inheritBonusPct));
      hp = Math.round(hp * (1 + inheritBonusPct));
      maxSoulPower = Math.round(maxSoulPower * (1 + inheritBonusPct));
      allAttrPct += inheritBonusPct;
    }
  }

   // 魂核加成已在上方计算并应用过，此处不再重复叠加
   // maxSoulPower 已通过 spirit 间接乘以魂核加成（maxSoulPower = spirit * 2 + ...）

   // 🔴 v17.0 侣系统·情侣加成：每个情侣全属性+10%，叠加
   if (player.companions?.details) {
     let loverCount = 0;
     for (const id of Object.keys(player.companions.details)) {
       if (player.companions.details[id]?.isLover) loverCount++;
     }
     if (loverCount > 0) {
       const loverBonus = loverCount * 0.10; // 每个+10%
       attack = Math.round(attack * (1 + loverBonus));
       defense = Math.round(defense * (1 + loverBonus));
       speed = Math.round(speed * (1 + loverBonus));
       spirit = Math.round(spirit * (1 + loverBonus));
       hp = Math.round(hp * (1 + loverBonus));
       maxSoulPower = Math.round(maxSoulPower * (1 + loverBonus));
       allAttrPct += loverBonus;
     }
   }

   // 🔴 侣系统·离婚惩罚：每离婚一次全属性-5%（加法累加，不乘法叠加）
   if (player.companions && typeof player.companions.divorceCount === 'number' && player.companions.divorceCount > 0) {
     const divorcePenaltyPct = 0.05 * player.companions.divorceCount; // 每次5%，加法累加
     const factor = Math.max(0.1, 1 - divorcePenaltyPct); // 最低保留10%，避免归零
     attack = Math.max(1, Math.round(attack * factor));
     defense = Math.max(1, Math.round(defense * factor));
     speed = Math.max(1, Math.round(speed * factor));
     spirit = Math.max(1, Math.round(spirit * factor));
     hp = Math.max(1, Math.round(hp * factor));
     maxSoulPower = Math.max(1, Math.round(maxSoulPower * factor));
      allAttrPct = Math.max(-0.9, allAttrPct - divorcePenaltyPct); // 下界保护：最多-90%，与五维最低10%对应
   }

   // 🔴 v17.0 侣系统·虚弱状态：全属性-80%（"配"之后5分钟内）
    if (player.companions?.weaknessUntil && player.companions.weaknessUntil > Date.now()) {
     const weakFactor = 0.2; // 保留20%
     attack = Math.max(1, Math.round(attack * weakFactor));
     defense = Math.max(1, Math.round(defense * weakFactor));
     speed = Math.max(1, Math.round(speed * weakFactor));
     spirit = Math.max(1, Math.round(spirit * weakFactor));
     hp = Math.max(1, Math.round(hp * weakFactor));
     maxSoulPower = Math.max(1, Math.round(maxSoulPower * weakFactor));
      allAttrPct = Math.max(-0.9, allAttrPct - 0.8); // 下界保护：虚弱状态最多-80%
   }

    const bloodBonus=bloodlineBonuses(player),goldBloodBonus=goldBloodBonuses(player),silverBonus=silverBonuses(player),twinBonus=twinBonuses(player);attack*=1+bloodBonus.attack+goldBloodBonus.attack+twinBonus.attack;hp*=1+bloodBonus.hp+goldBloodBonus.hp+silverBonus.hp+twinBonus.hp;
  spirit*=1+silverBonus.spirit+twinBonus.spirit;defense*=1+bloodBonus.defense+silverBonus.defense+twinBonus.defense;speed*=1+bloodBonus.speed+silverBonus.speed;maxSoulPower=Math.max(1,Math.round(maxSoulPower*(1+bloodBonus.mana+silverBonus.mana)));
    const armorBonus=armorBonuses(player);
    attack*=1+armorBonus.attack;defense*=1+armorBonus.defense;speed*=1+armorBonus.speed;spirit*=1+armorBonus.spirit;hp*=1+armorBonus.hp;
    // 取最终常驻精神，转换一次；不重新进入属性倍率计算。
    if(hasLiehun(player))attack += Math.round(spirit) * 3;
    // === 状态信息收集（供UI展示，解释战力波动原因）===
    const weaknessUntil = player.companions?.weaknessUntil ?? 0;
    const isWeak = weaknessUntil > Date.now();
    const weaknessRemain = isWeak ? Math.max(0, Math.ceil((weaknessUntil - Date.now()) / 1000)) : 0;
    const divorceCount = player.companions?.divorceCount ?? 0;
    const stDivinePowerPct = divinePowerPct;
    const stAffinityPct = affinityPct;
    const stInheritedBonusPct = inheritBonusPct;
    // 神器等级加成均值（重算避免变量冲突）
    let artLvBonus = 0;
    if (artifactDrawn && artifactLevel >= 1 && chosenTrialId) {
      const deityArt = getArtifactByDeity(chosenTrialId);
      if (deityArt) {
        const per = deityArt.perLevelBonus;
        artLvBonus = (per.attack + per.defense + per.speed + per.spirit + per.hp) / 5 * artifactLevel;
      }
    }
    const supremeCount = (player.divineTrial?.supremeArtifacts ?? []).length;

    attack = applyJiYueAttack(player,attack);
    return {
      attack: Math.round(attack),
      defense: Math.round(defense),
      speed: Math.round(speed),
      spirit: Math.round(spirit),
      hp: Math.round(hp),
      critRate: effectiveCritRate,
      critDmg: totalCritDmg,
      overflowCritConvertedDmg: convertedCritDmg,
      allAttrPct,
      maxSoulPower,
       armorResonanceActive: !!(player.divineArmor?.hasArmor && player.divineTrial?.artifactDrawn),
       coreGemBonus: {
         skillDmgPct: coreGemSkillDmgPct,
         basicDmgPct: coreGemBasicDmgPct,
         hpRegenPct: coreGemHpRegenPct,
         spiritBonusPct: coreGemSpiritPct,
         critRateAdd: coreGemCritRateAdd,
         speedBonusPct: coreGemSpeedPct,
       },
       statusFlags: {
        weaknessActive: isWeak,
        weaknessRemainSec: weaknessRemain,
        divorcePenaltyPct: divorceCount * 5,
        divinePowerPct: stDivinePowerPct,
        affinityPct: stAffinityPct,
        soulCoreBonus: soulCoreBonus * 100, // 转百分比
        inheritedBonusPct: stInheritedBonusPct,
        artifactLevelBonusPct: artLvBonus * 100, // 转百分比
        totalSupremeArtifacts: supremeCount,
      },
    };
 }

// 极致属性列表（展示用）
export const EXTREME_ATTRIBUTES = [
  { key: '极致之冰', icon: '❄️', desc: '冰属性伤害与效果大幅提升' },
  { key: '极致之火', icon: '🔥', desc: '火属性伤害与效果大幅提升' },
  { key: '极致之光明', icon: '✨', desc: '光明属性伤害与净化效果' },
  { key: '极致之黑暗', icon: '🌑', desc: '黑暗属性伤害与侵蚀效果' },
  { key: '极致之力量', icon: '💪', desc: '物理攻击与力量属性大幅提升' },
  { key: '极致之精神', icon: '👁', desc: '精神力与控制效果大幅提升' },
  { key: '极致之毒', icon: '☠️', desc: '毒素伤害与持续效果' },
  { key: '极致之速度', icon: '⚡', desc: '速度属性大幅提升' },
  { key: '极致之防御', icon: '🛡️', desc: '防御属性大幅提升' },
  { key: '极致之剑', icon: '⚔️', desc: '剑道极致，攻击与精准双加成' },
  { key: '极致之杀', icon: '🗡️', desc: '杀伐之道，攻击与暴击双加成' },
  { key: '极致之金', icon: '🗡️', desc: '金之极致，锋锐无双，攻击与穿透能力极致' },
  { key: '极致之雷霆', icon: '⚡', desc: '雷霆之力，攻击与速度双加成' },
  { key: '极致之水', icon: '💧', desc: '水属性极致，柔中带刚，攻守兼备' },
  { key: '极致之生命', icon: '🌳', desc: '生命本源，恢复与辅助能力大幅提升' },
  { key: '极致之土', icon: '⛰️', desc: '大地之厚重，防御与气血双加成' },
];

// 获取极致属性的图标与描述
export function getExtremeInfo(attr: string) {
  return EXTREME_ATTRIBUTES.find((x) => x.key === attr) || { icon: '⭐', desc: '罕见的极致属性' };
}

// === 领域系统 ===

// 按元素属性划分的领域模板库（12属性 + 通用）
const ELEMENT_DOMAIN_TEMPLATES: Record<string, Array<Omit<IDomain, 'id'>>> = {
  fire: [
    { name: '炽焰域', description: '灼热烈焰席卷八荒，域内敌人持续灼烧，攻击力提升18%。', cultivationAttr: 'fire', baseBonuses: { attack: 0.18, skillDmg: 0.10 } },
    { name: '凤凰域', description: '浴火重生的不死凤凰之力，攻击与气血同增，越战越勇。', cultivationAttr: 'fire', baseBonuses: { attack: 0.15, hp: 0.10, critDmg: 0.10 } },
    { name: '焚天域', description: '天火焚世，万物化为灰烬，攻击力大幅提升。', cultivationAttr: 'fire', baseBonuses: { attack: 0.22, critRate: 0.05 } },
    { name: '红莲域', description: '红莲业火焚尽罪孽，魂技伤害暴涨。', cultivationAttr: 'fire', baseBonuses: { skillDmg: 0.20, attack: 0.10 } },
    { name: '大日域', description: '如烈日当空普照大地，全属性与攻击力同增。', cultivationAttr: 'fire', baseBonuses: { allAttr: 0.08, attack: 0.12 } },
    { name: '九焱域', description: '九重炎火焚灭苍穹，暴击伤害极致攀升。', cultivationAttr: 'fire', baseBonuses: { attack: 0.20, critDmg: 0.15 } },
  ],
  ice: [
    { name: '极寒域', description: '绝对零度的寒意，冻结一切行动与攻击，防御力提升。', cultivationAttr: 'ice', baseBonuses: { defense: 0.18, speed: 0.10 } },
    { name: '雪帝域', description: '雪帝降临，冰雪之力席卷全场，寒意刺骨。', cultivationAttr: 'ice', baseBonuses: { allAttr: 0.10, spirit: 0.10 } },
    { name: '冰封域', description: '冰封万里，敌人速度大幅减缓，防御骤降。', cultivationAttr: 'ice', baseBonuses: { defense: 0.20, hp: 0.10 } },
    { name: '永冻域', description: '永冻之力，一旦触及便化为冰雕，永不解冻。', cultivationAttr: 'ice', baseBonuses: { defense: 0.25, attack: 0.05 } },
    { name: '霜绝域', description: '寒霜凝结，霜刃入骨，减速敌人并提升自身攻防。', cultivationAttr: 'ice', baseBonuses: { defense: 0.15, attack: 0.10 } },
    { name: '玄冰域', description: '九天玄冰之威，极致冰属性威压，攻防兼备。', cultivationAttr: 'ice', baseBonuses: { allAttr: 0.08, defense: 0.12 } },
  ],
  water: [
    { name: '苍海域', description: '沧海横流，无穷无尽的水之力量，气血与防御暴涨。', cultivationAttr: 'water', baseBonuses: { hp: 0.20, defense: 0.12 } },
    { name: '怒涛域', description: '怒涛汹涌，攻击如巨浪连绵不绝，魂技伤害提升。', cultivationAttr: 'water', baseBonuses: { attack: 0.15, skillDmg: 0.12 } },
    { name: '深海域', description: '深海无尽压力，敌人受到无形压制，气血下降。', cultivationAttr: 'water', baseBonuses: { hp: 0.18, spirit: 0.08 } },
    { name: '潮汐域', description: '潮汐涨落有序，攻击节奏随心掌控。', cultivationAttr: 'water', baseBonuses: { attack: 0.12, speed: 0.10, hp: 0.08 } },
  ],
  thunder: [
    { name: '雷霆域', description: '雷霆万钧，每一击都裹挟毁灭之雷，攻击力飙升。', cultivationAttr: 'thunder', baseBonuses: { attack: 0.20, critRate: 0.05 } },
    { name: '紫霄域', description: '紫霄神雷降临，暴击伤害暴涨，天威不可抗。', cultivationAttr: 'thunder', baseBonuses: { attack: 0.15, critDmg: 0.20 } },
    { name: '天罚域', description: '天罚之雷劫，有罪者皆受雷苦，魂技伤害大增。', cultivationAttr: 'thunder', baseBonuses: { attack: 0.18, skillDmg: 0.15 } },
    { name: '疾雷域', description: '迅雷不及掩耳，速度与攻击双双提升。', cultivationAttr: 'thunder', baseBonuses: { speed: 0.20, attack: 0.10 } },
  ],
  wind: [
    { name: '疾风域', description: '身化疾风，速度飙升至极致，先发制人。', cultivationAttr: 'wind', baseBonuses: { speed: 0.22, critRate: 0.05 } },
    { name: '风暴域', description: '九天风暴席卷，范围内敌人无处可逃。', cultivationAttr: 'wind', baseBonuses: { speed: 0.18, attack: 0.10, critRate: 0.05 } },
    { name: '苍穹域', description: '翱翔苍穹之下，风之力加持，全属性升华。', cultivationAttr: 'wind', baseBonuses: { allAttr: 0.10, speed: 0.10 } },
  ],
  earth: [
    { name: '厚土域', description: '借助厚土之力，防御与气血双增，稳如泰山。', cultivationAttr: 'earth', baseBonuses: { defense: 0.22, hp: 0.18 } },
    { name: '山岳域', description: '山岳般厚重沉稳，万法不侵，防御力极致。', cultivationAttr: 'earth', baseBonuses: { defense: 0.28, hp: 0.10 } },
    { name: '磐石域', description: '磐石之坚不可摧，反弹部分伤害。', cultivationAttr: 'earth', baseBonuses: { defense: 0.25, attack: 0.06 } },
  ],
  metal: [
    { name: '锋锐域', description: '金铁之锋锐无坚不摧，攻击力大幅提升。', cultivationAttr: 'metal', baseBonuses: { attack: 0.22, critRate: 0.05 } },
    { name: '金刚域', description: '金刚不坏之身，防御力极致。', cultivationAttr: 'metal', baseBonuses: { defense: 0.25, attack: 0.08 } },
    { name: '破魔域', description: '破魔之刃，可斩一切邪祟，暴击伤害暴涨。', cultivationAttr: 'metal', baseBonuses: { attack: 0.18, critDmg: 0.15 } },
  ],
  wood: [
    { name: '生命域', description: '浓郁的生命气息，持续恢复气血，生生不息。', cultivationAttr: 'wood', baseBonuses: { hp: 0.22, defense: 0.10 } },
    { name: '森罗域', description: '万象森罗，森林之主，万物生长。', cultivationAttr: 'wood', baseBonuses: { hp: 0.18, spirit: 0.10 } },
    { name: '生机域', description: '盎然生机笼罩全域，全属性提升且自愈。', cultivationAttr: 'wood', baseBonuses: { allAttr: 0.08, hp: 0.12 } },
  ],
  light: [
    { name: '圣光域', description: '圣光普照，驱散一切黑暗，全属性与精神同增。', cultivationAttr: 'light', baseBonuses: { allAttr: 0.12, spirit: 0.10 } },
    { name: '天使域', description: '神圣天使降临，全属性大幅提升，受神之庇护。', cultivationAttr: 'light', baseBonuses: { allAttr: 0.15, hp: 0.10 } },
    { name: '神圣域', description: '神圣光辉庇护众生，攻防兼备。', cultivationAttr: 'light', baseBonuses: { attack: 0.12, defense: 0.12, spirit: 0.12 } },
    { name: '曙光域', description: '黎明曙光驱散阴霾，精神与攻击双提升。', cultivationAttr: 'light', baseBonuses: { spirit: 0.18, attack: 0.10 } },
  ],
  dark: [
    { name: '暗影域', description: '暗影笼罩天地，敌人在黑暗中迷失，暴击大增。', cultivationAttr: 'dark', baseBonuses: { speed: 0.15, critRate: 0.08, critDmg: 0.15 } },
    { name: '堕落域', description: '堕落之力腐蚀人心，削弱敌人防御。', cultivationAttr: 'dark', baseBonuses: { attack: 0.18, defense: -0.10 } },
    { name: '深渊域', description: '深渊凝视众生，灵魂层面的侵蚀。', cultivationAttr: 'dark', baseBonuses: { spirit: 0.20, attack: 0.10 } },
    { name: '寂灭域', description: '寂灭之息弥漫，范围内生命力持续流失。', cultivationAttr: 'dark', baseBonuses: { attack: 0.15, hp: 0.10, critDmg: 0.15 } },
  ],
  spirit: [
    { name: '精神域', description: '强大精神力化作实质，压制敌人意志。', cultivationAttr: 'spirit', baseBonuses: { spirit: 0.22, skillDmg: 0.10 } },
    { name: '灵魂域', description: '灵魂层面的交锋，直接造成真实伤害。', cultivationAttr: 'spirit', baseBonuses: { spirit: 0.20, critDmg: 0.15 } },
    { name: '幻梦域', description: '虚实难辨的梦幻之境，敌人在幻境中迷失方向。', cultivationAttr: 'spirit', baseBonuses: { spirit: 0.18, critRate: 0.08 } },
    { name: '轮回域', description: '六道轮回，万物皆在其中，精神力至高。', cultivationAttr: 'spirit', baseBonuses: { allAttr: 0.10, spirit: 0.15 } },
  ],
  chaos: [
    { name: '混沌域', description: '混沌之力笼罩一切，全属性暴涨。', cultivationAttr: 'chaos', baseBonuses: { allAttr: 0.18 } },
    { name: '时空域', description: '操控时空法则，速度与精神极致提升。', cultivationAttr: 'chaos', baseBonuses: { allAttr: 0.10, speed: 0.15, spirit: 0.15 } },
    { name: '虚无域', description: '归于虚无，无视部分伤害并提升全属性。', cultivationAttr: 'chaos', baseBonuses: { allAttr: 0.12, defense: 0.12 } },
    { name: '鸿蒙域', description: '鸿蒙初开，天地未分，本源之力无限。', cultivationAttr: 'chaos', baseBonuses: { allAttr: 0.15, attack: 0.10, critDmg: 0.10 } },
  ],
  common: [
    { name: '杀戮域', description: '杀戮之气冲天，攻击力与暴击大幅提升。', cultivationAttr: 'fire', baseBonuses: { attack: 0.20, critRate: 0.08 } },
    { name: '嗜血域', description: '嗜血成性，攻击吸血恢复气血。', cultivationAttr: 'fire', baseBonuses: { attack: 0.15, hp: 0.08 } },
    { name: '狂暴域', description: '狂暴之力，攻击暴涨但防御略降。', cultivationAttr: 'fire', baseBonuses: { attack: 0.25, defense: -0.05 } },
    { name: '守护域', description: '守护之力笼罩，防御力与气血提升。', cultivationAttr: 'earth', baseBonuses: { defense: 0.22, hp: 0.15 } },
    { name: '治愈域', description: '温润的治愈之力，持续恢复气血。', cultivationAttr: 'wood', baseBonuses: { hp: 0.20, defense: 0.08 } },
  ],
};

// 武魂元素 → 领域属性映射（用于rollDomains时选择对应元素的领域池）
function getDomainElementKey(soulElement: string): string {
  if (soulElement.includes('火')) return 'fire';
  if (soulElement.includes('冰')) return 'ice';
  if (soulElement.includes('水')) return 'water';
  if (soulElement.includes('雷')) return 'thunder';
  if (soulElement.includes('风')) return 'wind';
  if (soulElement.includes('土')) return 'earth';
  if (soulElement.includes('金') || soulElement.includes('金属')) return 'metal';
  if (soulElement.includes('木') || soulElement.includes('植物') || soulElement.includes('毒')) return 'wood';
  if (soulElement.includes('光明') || soulElement.includes('光') || soulElement.includes('圣')) return 'light';
  if (soulElement.includes('黑暗') || soulElement.includes('暗') || soulElement.includes('邪魔')) return 'dark';
  if (soulElement.includes('精神') || soulElement.includes('灵魂') || soulElement.includes('灵眸')) return 'spirit';
  if (soulElement.includes('混沌') || soulElement.includes('时空') || soulElement.includes('空间')) return 'chaos';
  return 'fire';
}

// 根据修炼方向推导领域修炼属性
export function getDomainCultivationAttr(direction: string, martialSoul: IMartialSoul): DomainCultivationAttr {
  const attr = martialSoul.cultivationAttr;
  if (attr) return attr as DomainCultivationAttr;
  if (direction.includes('强攻')) return 'strength';
  if (direction.includes('敏攻')) return 'agility';
  if (direction.includes('控制')) return 'spirit';
  if (direction.includes('辅助')) return 'support';
  if (direction.includes('防御')) return 'defense';
  return 'strength';
}

// 领域颜色（用于动画和保护罩）—— 按元素属性区分
const DOMAIN_COLORS_BY_ELEMENT: Record<string, { primary: string; secondary: string; glow: string; label: string }> = {
  fire:    { primary: '#ef4444', secondary: '#7f1d1d', glow: 'rgba(239, 68, 68, 0.55)', label: '火属性' },
  ice:     { primary: '#38bdf8', secondary: '#0369a1', glow: 'rgba(56, 189, 248, 0.55)', label: '冰属性' },
  water:   { primary: '#0ea5e9', secondary: '#075985', glow: 'rgba(14, 165, 233, 0.5)', label: '水属性' },
  thunder: { primary: '#a855f7', secondary: '#581c87', glow: 'rgba(168, 85, 247, 0.55)', label: '雷属性' },
  wind:    { primary: '#34d399', secondary: '#065f46', glow: 'rgba(52, 211, 153, 0.5)', label: '风属性' },
  earth:   { primary: '#a16207', secondary: '#713f12', glow: 'rgba(161, 98, 7, 0.5)', label: '土属性' },
  metal:   { primary: '#e5e7eb', secondary: '#6b7280', glow: 'rgba(229, 231, 235, 0.5)', label: '金属性' },
  wood:    { primary: '#22c55e', secondary: '#14532d', glow: 'rgba(34, 197, 94, 0.5)', label: '木属性' },
  light:   { primary: '#fde047', secondary: '#a16207', glow: 'rgba(253, 224, 71, 0.6)', label: '光明属性' },
  dark:    { primary: '#1f2937', secondary: '#0f172a', glow: 'rgba(88, 28, 135, 0.55)', label: '黑暗属性' },
  spirit:   { primary: '#c084fc', secondary: '#581c87', glow: 'rgba(192, 132, 252, 0.55)', label: '精神属性' },
  chaos:   { primary: '#f472b6', secondary: '#1d4ed8', glow: 'rgba(244, 114, 182, 0.55)', label: '混沌属性' },
  strength: { primary: '#dc2626', secondary: '#7f1d1d', glow: 'rgba(220, 38, 38, 0.4)', label: '强攻系' },
  agility:  { primary: '#06b6d4', secondary: '#0e7490', glow: 'rgba(6, 182, 212, 0.4)', label: '敏攻系' },
  defense:  { primary: '#a16207', secondary: '#713f12', glow: 'rgba(161, 98, 7, 0.4)', label: '防御系' },
  support:  { primary: '#eab308', secondary: '#a16207', glow: 'rgba(234, 179, 8, 0.4)', label: '辅助系' },
};

// 保持旧名兼容（战斗页 DOMAIN_COLORS 引用）
export const DOMAIN_COLORS = DOMAIN_COLORS_BY_ELEMENT;

// 根据领域cultivationAttr获取颜色方案
export function getDomainColor(attr: DomainCultivationAttr): { primary: string; secondary: string; glow: string } {
  return DOMAIN_COLORS_BY_ELEMENT[attr] || DOMAIN_COLORS_BY_ELEMENT.fire;
}

// 抽取5个领域供玩家选择（3个随机 + 2个武魂专属）
// 武魂专属领域：根据武魂元素和名称生成2个独特的领域
// secondSoul=true 表示是给第二武魂抽取专属领域

export function rollDomains(direction: string, martialSoul: IMartialSoul, secondSoul: IMartialSoul | null = null): IDomain[] {
  const soulElement = (martialSoul as any).element || getSoulElement(martialSoul.name) || '火属性';
  const elemKey = getDomainElementKey(soulElement);
  const elemPool = ELEMENT_DOMAIN_TEMPLATES[elemKey] || ELEMENT_DOMAIN_TEMPLATES.fire;
  const commonPool = ELEMENT_DOMAIN_TEMPLATES.common;

  // 洗牌元素池取2个
  const shuffledElem = [...elemPool].sort(() => Math.random() - 0.5);
  const picked = shuffledElem.slice(0, 2);

  // 通用池随机1个混入（60%概率混入，40%概率再取一个元素池的）
  if (Math.random() < 0.6 && commonPool.length > 0) {
    const randomCommon = commonPool[Math.floor(Math.random() * commonPool.length)];
    picked.push(randomCommon);
  } else if (shuffledElem.length > 2) {
    picked.push(shuffledElem[2]);
  } else {
    // 元素池不足3个时用通用补足
    const rest = 3 - picked.length;
    for (let i = 0; i < rest && i < commonPool.length; i++) {
      picked.push(commonPool[i]);
    }
  }

  // 新增2个武魂专属领域（基于武魂名称+元素生成）
  const exclusiveDomains = generateExclusiveDomains(martialSoul, elemKey);
  picked.push(...exclusiveDomains);

  // 最终打乱顺序（5个）
  const finalList = picked.slice(0, 5).sort(() => Math.random() - 0.5);
  return finalList.map((t, i) => ({
    ...t,
    id: `domain_${elemKey}_${Date.now()}_${i}`,
  }));
}

// 从11种元素属性中完全随机生成一个领域（每种属性概率均等）
// 返回单个领域，用于「随机属性」觉醒模式
export function rollRandomDomain(seed?: number): IDomain {
  const allElementKeys = ['fire', 'ice', 'water', 'thunder', 'wind', 'earth', 'metal', 'wood', 'light', 'dark', 'spirit'];
  const idx = seed !== undefined
    ? Math.floor(Math.abs(seed) % allElementKeys.length)
    : Math.floor(Math.random() * allElementKeys.length);
  const elemKey = allElementKeys[idx];
  const pool = ELEMENT_DOMAIN_TEMPLATES[elemKey] || ELEMENT_DOMAIN_TEMPLATES.fire;
  const template = pool[Math.floor(Math.random() * pool.length)];
  return {
    ...template,
    id: `domain_rand_${elemKey}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  };
}

// ========== 武魂专属领域查表 ==========
// 核心武魂（超神级 + 神级 + 热门传说级）定制专属领域名 + 描述
// 每个武魂对应2个专属领域，命名贴合武魂属性与名称风格，2-3字+"之域"
const EXCLUSIVE_DOMAIN_MAP: Record<string, Array<Omit<IDomain, 'id'>>> = {
  // === 超神级 ===
"曜金龙戟":[{"name":"曜金龙锋域","description":"开启后强化攻击、暴击率与魂技伤害，数值随等级缩放。","cultivationAttr":"metal","baseBonuses":{"attack":0.22,"critRate":0.05,"skillDmg":0.1}},{"name":"金鳞守阵域","description":"开启后提高攻击与防御，数值随等级缩放。","cultivationAttr":"metal","baseBonuses":{"attack":0.12,"defense":0.18}}],
"霜魄灵瞳":[{"name":"霜魄凝神域","description":"开启后提高精神与魂技伤害，数值随等级缩放。","cultivationAttr":"spirit","baseBonuses":{"spirit":0.24,"skillDmg":0.12}},{"name":"灵瞳明镜域","description":"开启后提高精神、速度与暴击率，数值随等级缩放。","cultivationAttr":"spirit","baseBonuses":{"spirit":0.16,"speed":0.1,"critRate":0.05}}],
"虚空天隼":[{"name":"虚空疾羽域","description":"开启后提高速度、攻击与暴击率，数值随等级缩放。","cultivationAttr":"chaos","baseBonuses":{"speed":0.24,"attack":0.08,"critRate":0.05}},{"name":"裂空隼影域","description":"开启后提高速度与魂技伤害，数值随等级缩放。","cultivationAttr":"chaos","baseBonuses":{"speed":0.18,"skillDmg":0.15}}],
"镇岳玄龟":[{"name":"镇岳磐石域","description":"开启后提高防御与气血，数值随等级缩放。","cultivationAttr":"earth","baseBonuses":{"defense":0.26,"hp":0.15}},{"name":"玄甲守御域","description":"开启后提高全属性与防御，数值随等级缩放。","cultivationAttr":"earth","baseBonuses":{"allAttr":0.08,"defense":0.18}}],
"星露琉璃莲":[{"name":"星露生机域","description":"开启后提高气血、精神与防御，数值随等级缩放。","cultivationAttr":"wood","baseBonuses":{"hp":0.22,"spirit":0.12,"defense":0.08}},{"name":"琉璃莲华域","description":"开启后提高全属性与精神，数值随等级缩放。","cultivationAttr":"wood","baseBonuses":{"allAttr":0.12,"spirit":0.12}}],
  '天诛剑': [
    { name: '诛天之域', description: '天诛剑出，万剑齐发，诛天灭地之威笼罩全域，攻击力与魂技伤害暴涨。', cultivationAttr: 'chaos', baseBonuses: { attack: 0.25, skillDmg: 0.15, critRate: 0.05 } },
    { name: '寂灭剑域', description: '一剑寂灭，万物归寂，剑道极致之域，全属性升华。', cultivationAttr: 'chaos', baseBonuses: { allAttr: 0.15, attack: 0.10, critDmg: 0.15 } },
  ],
  '造化玉蝶': [
    { name: '造化之域', description: '造化玉蝶展翅，造化之力流转，万法归宗，愈万伤、纳万法。', cultivationAttr: 'chaos', baseBonuses: { allAttr: 0.12, hp: 0.15, spirit: 0.15 } },
    { name: '蝶梦之域', description: '庄生晓梦迷蝴蝶，亦真亦幻，精神力与防御力极致提升。', cultivationAttr: 'spirit', baseBonuses: { spirit: 0.25, defense: 0.15, hp: 0.10 } },
  ],
  '孤竹': [
    { name: '翠竹之域', description: '孤竹摇曳，竹影婆娑纳万象，清幽竹韵中全属性缓缓提升。', cultivationAttr: 'wood', baseBonuses: { allAttr: 0.12, spirit: 0.15 } },
    { name: '虚空竹域', description: '天地一竹，空间之力汇聚，一竹可破万法，攻击与速度飙升。', cultivationAttr: 'chaos', baseBonuses: { attack: 0.20, speed: 0.15, critDmg: 0.10 } },
  ],
  '如意金箍棒': [
    { name: '定海之域', description: '定海神针镇乾坤，一棒之下山河倒转，力量与气血极致。', cultivationAttr: 'earth', baseBonuses: { attack: 0.25, hp: 0.15, defense: 0.10 } },
    { name: '齐天圣域', description: '齐天大圣之威，桀骜不驯，攻击力与暴击率暴涨。', cultivationAttr: 'fire', baseBonuses: { attack: 0.22, critRate: 0.08, critDmg: 0.12 } },
  ],
  '魔刀千刃': [
    { name: '千刃之域', description: '千刃齐发，一刀之下山河破碎，刀气纵横，攻击力极致。', cultivationAttr: 'dark', baseBonuses: { attack: 0.28, critDmg: 0.15 } },
    { name: '修罗刀域', description: '魔界至强魔刀，修罗杀伐之域，万刃之祖，暴击伤害暴涨。', cultivationAttr: 'dark', baseBonuses: { attack: 0.20, critRate: 0.08, critDmg: 0.20 } },
  ],

  // === 神级 ===
  '六翼天使': [
    { name: '天使之域', description: '六翼天使降临，神圣光辉普照万物，全属性大幅提升。', cultivationAttr: 'light', baseBonuses: { allAttr: 0.18, attack: 0.10 } },
    { name: '神圣审判域', description: '天使神位之力，审判之光裁决一切，魂技伤害暴涨。', cultivationAttr: 'light', baseBonuses: { attack: 0.18, skillDmg: 0.20, spirit: 0.10 } },
  ],
  '光明龙神蝶': [
    { name: '龙神之域', description: '龙神之力与光明女神蝶的完美融合，蝶翼一展龙神降世。', cultivationAttr: 'light', baseBonuses: { allAttr: 0.15, attack: 0.15, speed: 0.10 } },
    { name: '光蝶圣域', description: '光明蝶翼闪烁，光之力冠绝天下，速度与精神极致。', cultivationAttr: 'light', baseBonuses: { speed: 0.20, spirit: 0.18, attack: 0.10 } },
  ],
  '修罗之剑': [
    { name: '修罗杀域', description: '修罗神位传承，杀伐之剑一出万物寂，攻击力极致。', cultivationAttr: 'dark', baseBonuses: { attack: 0.25, critDmg: 0.20 } },
    { name: '血狱剑域', description: '修罗血狱降临，无尽杀伐之气，暴击与攻击双重暴涨。', cultivationAttr: 'dark', baseBonuses: { attack: 0.20, critRate: 0.10, critDmg: 0.15 } },
  ],
  '轮回之眼': [
    { name: '轮回之域', description: '掌控轮回之力，洞察生死奥秘，精神力至高无上。', cultivationAttr: 'spirit', baseBonuses: { spirit: 0.30, allAttr: 0.08 } },
    { name: '生死眼域', description: '一眼判生死，轮回转生，灵魂层面的绝对压制。', cultivationAttr: 'spirit', baseBonuses: { spirit: 0.22, critDmg: 0.18, skillDmg: 0.12 } },
  ],
  '白银龙枪': [
    { name: '银龙之域', description: '银龙王传承，极致之冰与生命之力的化身，攻防兼备。', cultivationAttr: 'ice', baseBonuses: { allAttr: 0.12, defense: 0.15, hp: 0.10 } },
    { name: '龙枪破冰域', description: '一枪破万冰，银龙枪威，冰属性攻击力极致。', cultivationAttr: 'ice', baseBonuses: { attack: 0.22, defense: 0.10, critDmg: 0.10 } },
  ],
  '黄金龙枪': [
    { name: '金龙之域', description: '金龙王传承，极致之力与毁灭之息，攻击力恐怖。', cultivationAttr: 'metal', baseBonuses: { attack: 0.28, hp: 0.10 } },
    { name: '力量圣域', description: '极致之力量，一力降十会，气血与攻击双重暴涨。', cultivationAttr: 'metal', baseBonuses: { attack: 0.22, hp: 0.15, critDmg: 0.12 } },
  ],
  '命运之盘': [
    { name: '命运之域', description: '命运长河流转，一盤定乾坤，时间与空间双法则加持。', cultivationAttr: 'chaos', baseBonuses: { allAttr: 0.15, speed: 0.10, spirit: 0.15 } },
    { name: '时空盘域', description: '执掌时空秩序，扭转乾坤，精神力与速度极致。', cultivationAttr: 'chaos', baseBonuses: { spirit: 0.20, speed: 0.18, critRate: 0.05 } },
  ],
  '鸿蒙金乌': [
    { name: '金乌之域', description: '太古太阳神鸟，三足金乌浴火而生，一翼遮天焚尽八荒。', cultivationAttr: 'fire', baseBonuses: { attack: 0.28, critDmg: 0.15 } },
    { name: '洪荒火域', description: '洪荒万火之祖，太阳真火焚灭苍穹，火属性极致。', cultivationAttr: 'fire', baseBonuses: { attack: 0.22, skillDmg: 0.18, critRate: 0.05 } },
  ],
  '奶龙': [
    { name: '虚空龙域', description: '空间之力化身，可穿梭虚空撕裂空间，速度与攻击极致。', cultivationAttr: 'chaos', baseBonuses: { speed: 0.25, attack: 0.18, allAttr: 0.08 } },
    { name: '混沌龙域', description: '以混沌为源，兼容天下万属性，全属性大幅提升。', cultivationAttr: 'chaos', baseBonuses: { allAttr: 0.18, hp: 0.10, critDmg: 0.10 } },
  ],

  // === 传说级热门 ===
  '光明女神蝶': [
    { name: '蝶光之域', description: '光明女神蝶翼一展，光芒万丈，极致之光属性。', cultivationAttr: 'light', baseBonuses: { allAttr: 0.12, speed: 0.15, spirit: 0.10 } },
    { name: '耀光蝶域', description: '蝶舞光落，美丽而强大，魂技伤害与速度暴涨。', cultivationAttr: 'light', baseBonuses: { speed: 0.20, skillDmg: 0.15, attack: 0.10 } },
  ],
  '邪眸白虎': [
    { name: '白虎之域', description: '白虎啸天，邪眸一开震慑乾坤，攻击力与气血暴涨。', cultivationAttr: 'metal', baseBonuses: { attack: 0.22, hp: 0.15, defense: 0.08 } },
    { name: '幽冥白虎域', description: '幽冥白虎真身，杀伐之威，暴击伤害大幅提升。', cultivationAttr: 'metal', baseBonuses: { attack: 0.18, critDmg: 0.20, critRate: 0.05 } },
  ],
  '柔骨兔': [
    { name: '魅影之域', description: '身形灵巧变幻万千，近身搏杀天下无双，速度极致。', cultivationAttr: 'agility', baseBonuses: { speed: 0.28, critRate: 0.08 } },
    { name: '腰弓域', description: '柔骨魅兔腰弓爆击，瞬间爆发力恐怖，暴击伤害暴涨。', cultivationAttr: 'agility', baseBonuses: { speed: 0.18, critDmg: 0.22, attack: 0.10 } },
  ],
  '幽冥灵猫': [
    { name: '幽冥之域', description: '幽冥之中取敌首级，极致速度，如影随形。', cultivationAttr: 'dark', baseBonuses: { speed: 0.30, critRate: 0.08 } },
    { name: '影杀猫域', description: '影随心动，一击必杀，暴击率与暴击伤害双重暴涨。', cultivationAttr: 'dark', baseBonuses: { speed: 0.20, critRate: 0.10, critDmg: 0.20 } },
  ],
  '邪火凤凰': [
    { name: '凤凰之域', description: '邪火凤凰燃烧天际，火焰毁灭一切，攻击力极致。', cultivationAttr: 'fire', baseBonuses: { attack: 0.25, critDmg: 0.15 } },
    { name: '浴火重生域', description: '凤凰涅槃，浴火重生，越战越强，气血与攻击同增。', cultivationAttr: 'fire', baseBonuses: { attack: 0.18, hp: 0.15, skillDmg: 0.10 } },
  ],
  '蓝电霸王龙': [
    { name: '雷霆之域', description: '上三宗传承武魂，雷霆霸主威震大陆，攻击力恐怖。', cultivationAttr: 'thunder', baseBonuses: { attack: 0.22, critRate: 0.05 } },
    { name: '雷龙圣域', description: '蓝电霸王龙真身，雷霆万钧，魂技伤害大幅提升。', cultivationAttr: 'thunder', baseBonuses: { attack: 0.18, skillDmg: 0.18, critDmg: 0.10 } },
  ],
  '冰碧帝皇蝎': [
    { name: '冰帝之域', description: '冰碧帝皇蝎降临，极致之冰属性，冻结万物。', cultivationAttr: 'ice', baseBonuses: { defense: 0.22, attack: 0.12, allAttr: 0.08 } },
    { name: '永冻蝎域', description: '帝皇之威，永冻冰封，攻防兼备，冰属性极致。', cultivationAttr: 'ice', baseBonuses: { allAttr: 0.10, defense: 0.18, attack: 0.15 } },
  ],
  '冰天雪女': [
    { name: '雪女之域', description: '冰天雪女降临，风雪漫卷，天地为之变色。', cultivationAttr: 'ice', baseBonuses: { spirit: 0.22, defense: 0.15, allAttr: 0.08 } },
    { name: '寒冰雪域', description: '极寒之雪中，敌人行动迟缓，精神力与防御暴涨。', cultivationAttr: 'ice', baseBonuses: { spirit: 0.18, defense: 0.20, speed: -0.05 } },
  ],
  '昊天锤': [
    { name: '昊天锤域', description: '昊天锤出，乱披风之威，力量与防御极致。', cultivationAttr: 'strength', baseBonuses: { attack: 0.25, defense: 0.12, hp: 0.10 } },
    { name: '乱披风域', description: '乱披风锤法九九八十一锤，攻击力持续暴涨。', cultivationAttr: 'strength', baseBonuses: { attack: 0.22, critDmg: 0.15, hp: 0.08 } },
  ],
  '七宝琉璃塔': [
    { name: '琉璃之域', description: '七宝琉璃，天下第一辅助武魂，全属性大幅提升。', cultivationAttr: 'support', baseBonuses: { allAttr: 0.18, hp: 0.10 } },
    { name: '七宝圣域', description: '七宝转出有琉璃，七道神光加持，辅助效果极致。', cultivationAttr: 'support', baseBonuses: { allAttr: 0.15, spirit: 0.15, hp: 0.15 } },
  ],
  '七杀剑': [
    { name: '七杀剑域', description: '七杀剑出，七杀现世，剑压天地，攻击力极致。', cultivationAttr: 'metal', baseBonuses: { attack: 0.25, critDmg: 0.15 } },
    { name: '万剑归宗域', description: '万剑归宗，剑气纵横三万里，魂技伤害暴涨。', cultivationAttr: 'metal', baseBonuses: { attack: 0.20, skillDmg: 0.20, critRate: 0.05 } },
  ],
  '灵眸': [
    { name: '灵眸之域', description: '灵眸洞察一切，精神力压制万物，控制系之极。', cultivationAttr: 'spirit', baseBonuses: { spirit: 0.25, allAttr: 0.08, critRate: 0.05 } },
    { name: '精神共享域', description: '精神共享全域，队友同步感知，精神力与暴击双提升。', cultivationAttr: 'spirit', baseBonuses: { spirit: 0.20, critRate: 0.08, skillDmg: 0.10 } },
  ],
  '死亡蛛皇': [
    { name: '蛛皇之域', description: '死亡蛛网笼罩一切，极致之黑暗属性。', cultivationAttr: 'dark', baseBonuses: { attack: 0.18, spirit: 0.15, critDmg: 0.10 } },
    { name: '冥蛛死域', description: '死亡蛛皇真身，死亡之息弥漫，生命力持续流失。', cultivationAttr: 'dark', baseBonuses: { spirit: 0.20, attack: 0.12, defense: 0.10 } },
  ],
  '噬魂蛛皇': [
    { name: '噬魂之域', description: '噬魂之毒侵蚀神魂，精神层面的毁灭打击。', cultivationAttr: 'spirit', baseBonuses: { spirit: 0.25, critDmg: 0.15 } },
    { name: '噬魂毒域', description: '噬魂蛛皇毒威，毒噬神魂，精神力与魂技伤害暴涨。', cultivationAttr: 'spirit', baseBonuses: { spirit: 0.20, skillDmg: 0.18, attack: 0.08 } },
  ],
  '青龙': [
    { name: '青龙之域', description: '东方青龙神兽降临，万木逢春，生机无限。', cultivationAttr: 'wood', baseBonuses: { hp: 0.22, defense: 0.15, spirit: 0.10 } },
    { name: '苍龙吟域', description: '青龙长啸，震摄苍穹，全属性提升且自愈。', cultivationAttr: 'wood', baseBonuses: { allAttr: 0.12, hp: 0.15, attack: 0.10 } },
  ],
  '玄武': [
    { name: '玄武之域', description: '北方玄武神兽，龟蛇合体，防御与气血极致。', cultivationAttr: 'water', baseBonuses: { defense: 0.28, hp: 0.22 } },
    { name: '玄水圣域', description: '玄武镇海，万水臣服，防御力与气血双暴涨。', cultivationAttr: 'water', baseBonuses: { defense: 0.22, hp: 0.18, spirit: 0.10 } },
  ],
  '骨龙': [
    { name: '骨龙之域', description: '龙族亡灵，骨龙咆哮，空间之力与攻击兼具。', cultivationAttr: 'dark', baseBonuses: { attack: 0.20, speed: 0.15, critDmg: 0.10 } },
    { name: '亡灵骨域', description: '亡灵骨海，白骨蔽日，死亡之息侵蚀万物。', cultivationAttr: 'dark', baseBonuses: { attack: 0.15, spirit: 0.15, critDmg: 0.15 } },
  ],
  '玄龟': [
    { name: '玄龟之域', description: '玄龟镇海，防御力天下无双，气血充盈。', cultivationAttr: 'water', baseBonuses: { defense: 0.25, hp: 0.20 } },
    { name: '玄甲圣域', description: '玄龟甲胄护体，反弹部分伤害，坚不可摧。', cultivationAttr: 'water', baseBonuses: { defense: 0.22, hp: 0.15, attack: 0.05 } },
  ],
  '饕餮神牛': [
    { name: '饕餮之域', description: '饕餮吞天，食尽万物，气血与力量极致。', cultivationAttr: 'earth', baseBonuses: { attack: 0.22, hp: 0.20, defense: 0.08 } },
    { name: '吞噬之域', description: '饕餮吞噬之力，化万物为己用，全属性提升。', cultivationAttr: 'earth', baseBonuses: { allAttr: 0.12, attack: 0.15, hp: 0.12 } },
  ],
  '黄金龙': [
    { name: '黄金龙域', description: '黄金龙威，极致之力量，一力降十会。', cultivationAttr: 'metal', baseBonuses: { attack: 0.25, hp: 0.15, defense: 0.10 } },
    { name: '金龙圣域', description: '黄金龙真身，光明与力量的化身，全属性暴涨。', cultivationAttr: 'light', baseBonuses: { allAttr: 0.15, attack: 0.15, hp: 0.10 } },
  ],
  '黑暗圣龙': [
    { name: '暗龙之域', description: '黑暗圣龙降临，黑暗之力毁灭一切。', cultivationAttr: 'dark', baseBonuses: { attack: 0.22, critDmg: 0.18, spirit: 0.08 } },
    { name: '暗龙圣域', description: '黑暗龙威，寂灭一切生机，攻击力与暴击暴涨。', cultivationAttr: 'dark', baseBonuses: { attack: 0.18, critRate: 0.08, critDmg: 0.18 } },
  ],
  '光明圣龙': [
    { name: '光龙之域', description: '光明圣龙降临，神圣之光净化万物。', cultivationAttr: 'light', baseBonuses: { allAttr: 0.15, attack: 0.12, hp: 0.10 } },
    { name: '光龙圣域', description: '光明龙威，神圣庇护，全属性与精神力双重提升。', cultivationAttr: 'light', baseBonuses: { allAttr: 0.12, spirit: 0.18, attack: 0.12 } },
  ],
  '九凤来仪萧': [
    { name: '凤鸣之域', description: '九凤来仪，箫声引凤，风与音波交织成域。', cultivationAttr: 'wind', baseBonuses: { spirit: 0.20, speed: 0.12, skillDmg: 0.12 } },
    { name: '箫音幻域', description: '箫声婉转，如泣如诉，幻境中敌人迷失心智。', cultivationAttr: 'spirit', baseBonuses: { spirit: 0.25, critRate: 0.06, defense: 0.08 } },
  ],
  '三生镇魂鼎': [
    { name: '镇魂之域', description: '三生镇魂，镇压万物魂魄，精神压制至极。', cultivationAttr: 'spirit', baseBonuses: { spirit: 0.22, defense: 0.15, hp: 0.10 } },
    { name: '鼎镇圣域', description: '一鼎镇乾坤，重若山岳，防御与气血双增。', cultivationAttr: 'earth', baseBonuses: { defense: 0.22, hp: 0.18, spirit: 0.08 } },
  ],
  '星尘剑': [
    { name: '星辰之域', description: '星辰剑引动星光，万星之力加持，光明璀璨。', cultivationAttr: 'light', baseBonuses: { attack: 0.22, critDmg: 0.12, speed: 0.08 } },
    { name: '星河剑域', description: '一剑光寒，星河倒转，魂技伤害暴涨。', cultivationAttr: 'light', baseBonuses: { skillDmg: 0.20, attack: 0.15, critRate: 0.05 } },
  ],
  '紫霄神雷': [
    { name: '紫霄之域', description: '紫霄神雷降临，天威浩荡，暴击伤害极致。', cultivationAttr: 'thunder', baseBonuses: { attack: 0.20, critDmg: 0.25 } },
    { name: '神雷劫域', description: '九天雷劫，神雷之威，攻击力与暴击双双暴涨。', cultivationAttr: 'thunder', baseBonuses: { attack: 0.22, critRate: 0.08, skillDmg: 0.12 } },
  ],
  '十首火凤凰': [
    { name: '十首火域', description: '十首火凤凰，十头十性，焚尽苍穹。', cultivationAttr: 'fire', baseBonuses: { attack: 0.25, critDmg: 0.15, hp: 0.08 } },
    { name: '凤凰涅槃域', description: '十首不死，涅槃重生，越战越勇。', cultivationAttr: 'fire', baseBonuses: { attack: 0.18, hp: 0.18, skillDmg: 0.12 } },
  ],
  '冰极霜灭龙': [
    { name: '霜灭之域', description: '冰极霜灭，一切冻结成冰，万古不化。', cultivationAttr: 'ice', baseBonuses: { defense: 0.25, attack: 0.12, speed: 0.08 } },
    { name: '冰龙吟域', description: '冰龙长啸，寒霜万里，冰属性攻击力极致。', cultivationAttr: 'ice', baseBonuses: { attack: 0.20, defense: 0.15, critDmg: 0.10 } },
  ],
  '寒汐凝霜琴': [
    { name: '霜琴之域', description: '琴音凝霜，寒汐涌动，冰与精神交织成域。', cultivationAttr: 'ice', baseBonuses: { spirit: 0.22, defense: 0.12, skillDmg: 0.10 } },
    { name: '琴音冰域', description: '一曲寒霜，万物冰封，控制与防御兼备。', cultivationAttr: 'ice', baseBonuses: { spirit: 0.18, defense: 0.18, critRate: 0.05 } },
  ],
  '欢愉面具': [
    { name: '欢愉之域', description: '欢愉面具之下，真假难辨，精神迷乱。', cultivationAttr: 'spirit', baseBonuses: { spirit: 0.22, critRate: 0.08, speed: 0.10 } },
    { name: '七情幻域', description: '七情六欲化幻，敌人沉沦于欲望幻境之中。', cultivationAttr: 'spirit', baseBonuses: { spirit: 0.20, critDmg: 0.15, defense: 0.05 } },
  ],
  '绝望光环': [
    { name: '绝望之域', description: '绝望光环笼罩，万物寂灭，精神崩溃。', cultivationAttr: 'spirit', baseBonuses: { spirit: 0.25, attack: 0.12, critDmg: 0.10 } },
    { name: '寂灭光域', description: '绝望之光照耀，所有希望消散，精神力极致压制。', cultivationAttr: 'spirit', baseBonuses: { spirit: 0.20, defense: -0.05, critDmg: 0.18 } },
  ],
  '太虚古龙': [
    { name: '古龙之域', description: '太虚古龙，空间主宰，穿梭虚空，速度极致。', cultivationAttr: 'chaos', baseBonuses: { speed: 0.22, attack: 0.18, allAttr: 0.08 } },
    { name: '虚空龙域', description: '虚空撕裂，龙游太虚，空间之力与攻击双提升。', cultivationAttr: 'chaos', baseBonuses: { attack: 0.20, speed: 0.15, critDmg: 0.12 } },
  ],
  '镇魂碑': [
    { name: '镇魂之域', description: '镇魂碑立，镇压一切阴邪，灵魂受困。', cultivationAttr: 'spirit', baseBonuses: { spirit: 0.22, defense: 0.15, hp: 0.10 } },
    { name: '碑镇圣域', description: '一碑镇万魂，精神压制与防御兼备。', cultivationAttr: 'spirit', baseBonuses: { spirit: 0.18, defense: 0.18, critRate: 0.05 } },
  ],
  '春秋蝉': [
    { name: '春秋之域', description: '春秋蝉鸣，时光流转，时间之力加持。', cultivationAttr: 'chaos', baseBonuses: { allAttr: 0.15, speed: 0.15, spirit: 0.10 } },
    { name: '时光蝉域', description: '一蝉知春秋，时光长河在掌中流转，速度与精神极致。', cultivationAttr: 'chaos', baseBonuses: { speed: 0.20, spirit: 0.20, critRate: 0.05 } },
  ],
  '斩魄刀': [
    { name: '斩魄之域', description: '斩魄刀出，一刀斩魂，直接攻击灵魂层面。', cultivationAttr: 'spirit', baseBonuses: { spirit: 0.25, attack: 0.15, critDmg: 0.10 } },
    { name: '万解刀域', description: '卍解之威，刀与魂合一，精神与攻击暴涨。', cultivationAttr: 'spirit', baseBonuses: { attack: 0.20, spirit: 0.20, critRate: 0.06 } },
  ],
  '终焉之龙': [
    { name: '终焉之域', description: '终焉之龙，终结一切，毁灭与黑暗并存。', cultivationAttr: 'dark', baseBonuses: { attack: 0.25, critDmg: 0.20, hp: 0.05 } },
    { name: '末地龙域', description: '末日降临，地龙翻身，世界走向终焉。', cultivationAttr: 'dark', baseBonuses: { attack: 0.20, spirit: 0.15, critDmg: 0.15 } },
  ],
  '堕天使': [
    { name: '堕落之域', description: '堕天使降临，天堂沦落，黑暗与光明交织。', cultivationAttr: 'dark', baseBonuses: { allAttr: 0.12, attack: 0.15, spirit: 0.10 } },
    { name: '堕天圣域', description: '堕天之力，亦光亦暗，双面属性极致发挥。', cultivationAttr: 'dark', baseBonuses: { attack: 0.18, spirit: 0.15, critDmg: 0.15 } },
  ],
  '生命之树': [
    { name: '世界树域', description: '生命之树，世界本源，生生不息。', cultivationAttr: 'wood', baseBonuses: { hp: 0.28, defense: 0.15, spirit: 0.10 } },
    { name: '源生之域', description: '源生之力，万物复苏，持续恢复与属性提升。', cultivationAttr: 'wood', baseBonuses: { allAttr: 0.12, hp: 0.20, defense: 0.10 } },
  ],
  '影戮剑': [
    { name: '影戮之域', description: '影中藏刃，杀戮无声，黑暗中一击必杀。', cultivationAttr: 'dark', baseBonuses: { attack: 0.22, critRate: 0.10, speed: 0.12 } },
    { name: '影杀剑域', description: '千影万杀，剑影重重，暴击伤害极致。', cultivationAttr: 'dark', baseBonuses: { attack: 0.18, critDmg: 0.22, speed: 0.10 } },
  ],
  '天罡无极剑': [
    { name: '天罡剑域', description: '天罡剑阵，无极之道，光明剑道之极。', cultivationAttr: 'light', baseBonuses: { attack: 0.22, allAttr: 0.10, critDmg: 0.12 } },
    { name: '无极圣域', description: '无极生太极，太极化万剑，全属性与攻击双提升。', cultivationAttr: 'light', baseBonuses: { allAttr: 0.15, attack: 0.18, spirit: 0.10 } },
  ],
  '冥王黑龙': [
    { name: '冥王之域', description: '冥王驾临，地府开启，黑暗与死亡之威。', cultivationAttr: 'dark', baseBonuses: { spirit: 0.20, attack: 0.18, critDmg: 0.15 } },
    { name: '冥龙死域', description: '冥龙咆哮，万物寂灭，死亡气息弥漫全域。', cultivationAttr: 'dark', baseBonuses: { attack: 0.20, spirit: 0.15, hp: -0.05 } },
  ],
  '星穹灵鹿': [
    { name: '星穹之域', description: '星穹灵鹿踏光而来，星辉洒落，光明与精神兼具。', cultivationAttr: 'light', baseBonuses: { spirit: 0.22, speed: 0.12, allAttr: 0.08 } },
    { name: '星辉鹿域', description: '鹿鸣星穹，指引迷途，精神力与防御力双提升。', cultivationAttr: 'light', baseBonuses: { spirit: 0.18, defense: 0.15, hp: 0.10 } },
  ],
  '雷霆夔牛': [
    { name: '夔牛之域', description: '雷霆夔牛一吼，天惊地动，雷威震天。', cultivationAttr: 'thunder', baseBonuses: { attack: 0.22, hp: 0.12, critDmg: 0.10 } },
    { name: '雷神之域', description: '夔牛雷神化身，雷霆万钧，攻击力与暴击暴涨。', cultivationAttr: 'thunder', baseBonuses: { attack: 0.20, critRate: 0.08, critDmg: 0.15 } },
  ],
  '青莲地心火': [
    { name: '青莲之域', description: '青莲地心火，莲生万火，火中奇葩。', cultivationAttr: 'fire', baseBonuses: { attack: 0.22, hp: 0.10, spirit: 0.10 } },
    { name: '地心火域', description: '地心深处的异火，焚尽万物，火属性极致。', cultivationAttr: 'fire', baseBonuses: { attack: 0.25, critDmg: 0.15, skillDmg: 0.08 } },
  ],
  '虚无吞炎': [
    { name: '吞炎之域', description: '虚无吞炎，可吞噬万物的诡异黑焰，攻击力极致。', cultivationAttr: 'fire', baseBonuses: { attack: 0.28, critRate: 0.06, skillDmg: 0.10 } },
    { name: '虚无火域', description: '归于虚无，黑焰焚世，火属性与暴击双重暴涨。', cultivationAttr: 'fire', baseBonuses: { attack: 0.22, critDmg: 0.20, hp: -0.05 } },
  ],
  '凯溟龙戟': [
    { name: '凯溟之域', description: '凯溟龙戟，海中霸主，暗水之威。', cultivationAttr: 'dark', baseBonuses: { attack: 0.22, defense: 0.12, speed: 0.08 } },
    { name: '深海戟域', description: '深渊海戟，溟灭一切，黑暗与水属性交织。', cultivationAttr: 'dark', baseBonuses: { attack: 0.18, skillDmg: 0.15, critDmg: 0.10 } },
  ],
  '金眼黑龙': [
    { name: '金眼之域', description: '金眼黑龙，黄金竖瞳洞察一切，黑暗龙威。', cultivationAttr: 'dark', baseBonuses: { attack: 0.22, critRate: 0.08, spirit: 0.10 } },
    { name: '黑龙圣域', description: '黑龙真身，毁灭与黑暗的化身，攻击力极致。', cultivationAttr: 'dark', baseBonuses: { attack: 0.25, critDmg: 0.18, hp: 0.08 } },
  ],
  '日冕圣龙': [
    { name: '日冕之域', description: '日冕圣龙，太阳之光冠冕其身，光暗同体。', cultivationAttr: 'light', baseBonuses: { allAttr: 0.15, attack: 0.15, critDmg: 0.10 } },
    { name: '冠日龙域', description: '日冕之光，照耀天地，光明属性攻击力极致。', cultivationAttr: 'light', baseBonuses: { attack: 0.22, spirit: 0.12, critDmg: 0.12 } },
  ],
  '碧磷蛇皇': [
    { name: '碧磷之域', description: '碧磷蛇皇之毒，举世无双，毒雾弥漫。', cultivationAttr: 'wood', baseBonuses: { attack: 0.18, spirit: 0.15, critDmg: 0.10 } },
    { name: '蛇皇毒域', description: '蛇皇之毒，蚀骨销魂，持续伤害恐怖。', cultivationAttr: 'wood', baseBonuses: { spirit: 0.20, skillDmg: 0.15, hp: 0.08 } },
  ],
  '魔魂大白鲨': [
    { name: '鲨皇之域', description: '魔魂大白鲨，海洋霸主，速度与攻击兼具。', cultivationAttr: 'water', baseBonuses: { attack: 0.20, speed: 0.15, hp: 0.10 } },
    { name: '深海鲨域', description: '深海捕猎，一击必杀，水属性攻击力暴涨。', cultivationAttr: 'water', baseBonuses: { attack: 0.18, critRate: 0.08, critDmg: 0.15 } },
  ],
  '邪魔虎鲸': [
    { name: '邪魔之域', description: '邪魔虎鲸，海中恶魔，黑暗与水的凶暴力量。', cultivationAttr: 'water', baseBonuses: { attack: 0.22, critDmg: 0.15, speed: 0.08 } },
    { name: '虎鲸杀域', description: '虎鲸猎杀，嗜血成性，攻击力与暴击暴涨。', cultivationAttr: 'water', baseBonuses: { attack: 0.18, critRate: 0.08, hp: 0.10 } },
  ],
  '香肠': [
    { name: '食神之域', description: '食神斗罗传承，香肠武魂恢复力惊人。', cultivationAttr: 'support', baseBonuses: { hp: 0.25, defense: 0.12, spirit: 0.10 } },
    { name: '美食圣域', description: '美食治愈一切，全属性与气血持续恢复。', cultivationAttr: 'support', baseBonuses: { allAttr: 0.10, hp: 0.20, defense: 0.10 } },
  ],
  '盘龙棍': [
    { name: '盘龙之域', description: '盘龙棍出，龙游棍势，力量与防御兼备。', cultivationAttr: 'earth', baseBonuses: { attack: 0.20, defense: 0.15, hp: 0.10 } },
    { name: '蟠龙棍域', description: '蟠龙缠身，棍影重重，攻击力与气血双提升。', cultivationAttr: 'earth', baseBonuses: { attack: 0.18, hp: 0.15, critDmg: 0.10 } },
  ],
  '擎天枪': [
    { name: '擎天之域', description: '擎天枪出，力可擎天，力量与气势无双。', cultivationAttr: 'metal', baseBonuses: { attack: 0.22, defense: 0.12, hp: 0.10 } },
    { name: '破云枪域', description: '一枪破云，直上九霄，攻击力与暴击暴涨。', cultivationAttr: 'metal', baseBonuses: { attack: 0.20, critDmg: 0.18, critRate: 0.05 } },
  ],
  '冰晶刹弓': [
    { name: '冰刹之域', description: '冰晶刹弓，一箭冰封，冰与速度的极致。', cultivationAttr: 'ice', baseBonuses: { attack: 0.20, speed: 0.15, critRate: 0.06 } },
    { name: '冰箭圣域', description: '万箭齐发，寒冰箭雨，暴击伤害与速度双提升。', cultivationAttr: 'ice', baseBonuses: { speed: 0.18, critDmg: 0.18, attack: 0.12 } },
  ],
  '三足金蟾': [
    { name: '金蟾之域', description: '三足金蟾，财富与金属性的化身。', cultivationAttr: 'metal', baseBonuses: { defense: 0.20, hp: 0.15, attack: 0.08 } },
    { name: '招财圣域', description: '金蟾献宝，财运亨通，全属性稳步提升。', cultivationAttr: 'metal', baseBonuses: { allAttr: 0.10, hp: 0.15, defense: 0.12 } },
  ],
  '朱晴冰蟾': [
    { name: '冰蟾之域', description: '朱晴冰蟾，冰毒双修，寒冷与剧毒交织。', cultivationAttr: 'ice', baseBonuses: { spirit: 0.20, attack: 0.15, defense: 0.10 } },
    { name: '冰毒蟾域', description: '冰蟾毒雾，遇寒愈烈，持续伤害与控制兼备。', cultivationAttr: 'ice', baseBonuses: { spirit: 0.18, critDmg: 0.12, skillDmg: 0.12 } },
  ],
  '破魔刀': [
    { name: '破魔之域', description: '破魔刀出，万魔伏诛，破魔之刃无坚不摧。', cultivationAttr: 'metal', baseBonuses: { attack: 0.22, critDmg: 0.18 } },
    { name: '斩魔刀域', description: '斩尽天下魔，刀光所至，邪祟皆灭。', cultivationAttr: 'metal', baseBonuses: { attack: 0.20, critRate: 0.08, critDmg: 0.15 } },
  ],
  '斩龙刀': [
    { name: '斩龙之域', description: '斩龙刀出，龙族授首，屠龙之威赫赫。', cultivationAttr: 'light', baseBonuses: { attack: 0.22, critDmg: 0.15, defense: 0.05 } },
    { name: '屠龙圣域', description: '屠尽恶龙，光明之刃，攻击力与暴击暴涨。', cultivationAttr: 'light', baseBonuses: { attack: 0.20, critRate: 0.08, critDmg: 0.18 } },
  ],
  '烈阳弓': [
    { name: '烈阳之域', description: '烈阳弓开，如火中天，火焰之箭焚尽苍穹。', cultivationAttr: 'fire', baseBonuses: { attack: 0.22, speed: 0.12, critRate: 0.06 } },
    { name: '烈日箭域', description: '烈阳箭雨，如同天降流火，暴击伤害暴涨。', cultivationAttr: 'fire', baseBonuses: { attack: 0.18, critDmg: 0.20, speed: 0.10 } },
  ],
  '蓝冰莲花': [
    { name: '冰莲之域', description: '蓝冰莲开，寒气四溢，冰清玉洁。', cultivationAttr: 'water', baseBonuses: { defense: 0.20, spirit: 0.15, hp: 0.10 } },
    { name: '莲华冰域', description: '冰莲盛放，万物冰封，冰属性与精神力双提升。', cultivationAttr: 'water', baseBonuses: { spirit: 0.18, defense: 0.18, skillDmg: 0.08 } },
  ],
  '红尘魔龙': [
    { name: '红尘之域', description: '红尘魔龙，欲望与黑暗交织，沉沦之威。', cultivationAttr: 'dark', baseBonuses: { attack: 0.20, spirit: 0.15, critDmg: 0.12 } },
    { name: '凡龙魔境', description: '红尘万丈，魔龙戏世，黑暗与精神双重压制。', cultivationAttr: 'dark', baseBonuses: { spirit: 0.18, attack: 0.18, critRate: 0.06 } },
  ],
  '浴火凤凰': [
    { name: '浴火之域', description: '浴火凤凰，涅槃重生，越战越强。', cultivationAttr: 'fire', baseBonuses: { attack: 0.22, hp: 0.15, critDmg: 0.10 } },
    { name: '涅槃圣域', description: '凤凰涅槃，死而复生，全属性与气血双提升。', cultivationAttr: 'fire', baseBonuses: { allAttr: 0.10, hp: 0.18, attack: 0.15 } },
  ],
  '冰神': [
    { name: '冰神之域', description: '冰神降临，绝对零度，冰封世界。', cultivationAttr: 'ice', baseBonuses: { defense: 0.28, attack: 0.15, allAttr: 0.08 } },
    { name: '极寒冰域', description: '冰神极寒，万物归寂，冰属性极致之境。', cultivationAttr: 'ice', baseBonuses: { allAttr: 0.12, defense: 0.22, spirit: 0.12 } },
  ],
  '提丰': [
    { name: '提丰之域', description: '万妖之父提丰，火焰与黑暗的化身。', cultivationAttr: 'fire', baseBonuses: { attack: 0.25, critDmg: 0.15, hp: 0.08 } },
    { name: '妖神火域', description: '妖王之火，焚尽诸神，火属性极致。', cultivationAttr: 'fire', baseBonuses: { attack: 0.22, critRate: 0.06, skillDmg: 0.15 } },
  ],
  '亡灵序曲·死者苏生': [
    { name: '亡者之域', description: '亡灵序曲奏响，死者从大地中苏醒。', cultivationAttr: 'dark', baseBonuses: { spirit: 0.20, attack: 0.15, defense: 0.10 } },
    { name: '死灵圣域', description: '死者苏生，亡灵大军降临，精神与防御双提升。', cultivationAttr: 'dark', baseBonuses: { spirit: 0.22, defense: 0.15, hp: 0.10 } },
  ],
  '玄铁重剑': [
    { name: '重剑之域', description: '玄铁重剑，重剑无锋，大巧不工。', cultivationAttr: 'metal', baseBonuses: { attack: 0.22, defense: 0.15, hp: 0.10 } },
    { name: '玄铁圣域', description: '重剑压境，力量为王，防御与攻击双提升。', cultivationAttr: 'metal', baseBonuses: { attack: 0.18, defense: 0.18, hp: 0.12 } },
  ],
  '黄金叶': [
    { name: '金叶之域', description: '黄金叶飘，金光灿灿，金属性与生机兼具。', cultivationAttr: 'metal', baseBonuses: { allAttr: 0.10, attack: 0.15, hp: 0.10 } },
    { name: '叶舞圣域', description: '金叶纷飞，每一片都是利刃，攻击与速度双提升。', cultivationAttr: 'metal', baseBonuses: { attack: 0.18, speed: 0.12, critRate: 0.06 } },
  ],
  '苍海棍': [
    { name: '苍海之域', description: '苍海横流，棍势如潮，水之力无穷无尽。', cultivationAttr: 'water', baseBonuses: { attack: 0.18, hp: 0.18, defense: 0.10 } },
    { name: '潮涌棍域', description: '潮起潮落，棍随水动，攻击与气血双提升。', cultivationAttr: 'water', baseBonuses: { attack: 0.15, hp: 0.15, skillDmg: 0.10 } },
  ],
  '疾风枪': [
    { name: '疾风之域', description: '疾风枪出，快如闪电，风之力加持。', cultivationAttr: 'wind', baseBonuses: { speed: 0.25, attack: 0.15, critRate: 0.05 } },
    { name: '风枪圣域', description: '风枪一体，一击绝尘，速度与暴击暴涨。', cultivationAttr: 'wind', baseBonuses: { speed: 0.20, critDmg: 0.18, attack: 0.10 } },
  ],
  '沧澜剑': [
    { name: '沧澜之域', description: '沧澜剑出，剑气如澜，水之剑意。', cultivationAttr: 'water', baseBonuses: { attack: 0.20, spirit: 0.12, skillDmg: 0.12 } },
    { name: '沧溟剑域', description: '沧溟无涯，剑海浮沉，魂技伤害与攻击双提升。', cultivationAttr: 'water', baseBonuses: { attack: 0.18, skillDmg: 0.18, spirit: 0.10 } },
  ],
  '卡冥狮': [
    { name: '卡冥之域', description: '卡冥狮吼，大地震动，土系兽武魂之威。', cultivationAttr: 'earth', baseBonuses: { attack: 0.20, defense: 0.15, hp: 0.10 } },
    { name: '狮王圣域', description: '狮王降临，万兽臣服，攻击力与气血暴涨。', cultivationAttr: 'earth', baseBonuses: { attack: 0.18, hp: 0.15, critDmg: 0.10 } },
  ],
  '三头赤魔獒': [
    { name: '赤魔之域', description: '三头赤魔獒，三头三性，魔焰滔天。', cultivationAttr: 'fire', baseBonuses: { attack: 0.22, critDmg: 0.12, hp: 0.10 } },
    { name: '魔獒火域', description: '赤魔咆哮，烈火焚天，火属性攻击力极致。', cultivationAttr: 'fire', baseBonuses: { attack: 0.20, critRate: 0.06, critDmg: 0.15 } },
  ],
  '瑞幸咖啡': [
    { name: '清醒之域', description: '瑞幸咖啡，精神百倍，头脑清醒，反应极速。', cultivationAttr: 'ice', baseBonuses: { spirit: 0.20, speed: 0.15, critRate: 0.06 } },
    { name: '拿铁圣域', description: '香醇拿铁，元气满满，全属性与精神力提升。', cultivationAttr: 'ice', baseBonuses: { allAttr: 0.10, spirit: 0.15, hp: 0.10 } },
  ],
};

// 根据武魂生成2个专属领域
function generateExclusiveDomains(martialSoul: IMartialSoul, elemKey: string): Array<Omit<IDomain, 'id'>> {
  const soulName = martialSoul.name;
  const elemPool = ELEMENT_DOMAIN_TEMPLATES[elemKey] || ELEMENT_DOMAIN_TEMPLATES.fire;
  const result: Array<Omit<IDomain, 'id'>> = [];

  // 优先查表：定制专属领域
  const custom = EXCLUSIVE_DOMAIN_MAP[soulName];
  if (custom && custom.length >= 2) {
    return custom.map(d => ({ ...d, exclusive: true }));
  }

  // 未覆盖到的武魂：基于属性池 + 武魂关键字智能生成
  // 第一个专属：元素池中选一个，命名风格为「武魂关键字·XX之域」
  if (elemPool.length > 0) {
    const pick = elemPool[Math.floor(Math.random() * elemPool.length)];
    // 提取武魂关键字（去掉前缀修饰词）
    let keyWord = soulName.replace('极致之', '');
    if (keyWord.includes('之')) keyWord = keyWord.split('之')[keyWord.split('之').length - 1];
    if (keyWord.length > 3) keyWord = keyWord.slice(-3);
    result.push({
      ...pick,
      name: `${keyWord}·真意之域`,
      description: `${soulName}武魂本源真意凝聚之域，${pick.description}`,
      exclusive: true,
    });
  }

  // 第二个专属：元素池中再选一个，命名为「武魂简称 + 属性域」
  if (elemPool.length > 1) {
    const remaining = elemPool.filter(d => d.name !== result[0]?.name);
    const pick = remaining[Math.floor(Math.random() * remaining.length)] || elemPool[0];
    // 取武魂名前2-3字做简称
    const shortName = soulName.length > 3 ? soulName.slice(0, 2) : soulName;
    result.push({
      ...pick,
      name: `${shortName}${pick.name.replace('域', '')}域`,
      description: `${soulName}武魂专属领域，${pick.description}`,
      exclusive: true,
    });
  } else if (result.length === 0 && elemPool.length > 0) {
    // 兜底：元素池只有1个时，直接用
    result.push({ ...elemPool[0], exclusive: true });
  }

  // 保底保证至少返回1个
  if (result.length === 0 && elemPool.length > 0) {
    result.push({ ...elemPool[0], name: `${soulName}·本源之域`, description: `${soulName}武魂本源之力所化之域，${elemPool[0].description}`, exclusive: true });
  }

  return result.slice(0, 2);
}

// 计算魂灵上阵加成明细（供UI展示）
// 转世轮回加成明细（供UI展示）
// 返回：转世次数、攻击固定加成、基础属性百分比加成、魂环年限上限加成
// 基础属性加成基于「武魂基础属性 × 先天魂力倍率」部分，每世+5%（与 calcAttributes 中实际生效的完全一致）
export function calcReincarnationBonusBreakdown(player: IPlayer): {
  count: number;
  attackFlat: number;
  baseAttrPct: number;
  ringYearBonus: number;
  ringYearBonusPct: number;
  attackPctValue: number;   // 攻击百分比加成对应的实际数值（方便展示
  defensePctValue: number;  // 防御百分比加成数值
  speedPctValue: number;    // 速度百分比加成数值
  spiritPctValue: number;   // 精神百分比加成数值
  hpPctValue: number;       // 气血百分比加成数值
} | null {
  const count = player.reincarnation?.count ?? 0;
  const attackFlat = player.reincarnation?.totalAttackBonus ?? 0;
  const ringYearBonus = player.reincarnation?.totalRingYearBonus ?? 0;
  const ringYearBonusPct = player.reincarnation?.ringYearBonusPct ?? 0;
  if (count === 0 && attackFlat === 0 && ringYearBonus === 0 && ringYearBonusPct === 0) return null;

  const base = player.martialSoul.baseStats || { attack: 50, defense: 50, speed: 50, spirit: 50, hp: 100 };
  const quality = player.martialSoul.quality;
  let qualityMultiplier = 1;
  if (quality === 'supremeDivine') qualityMultiplier = 3.0; // 至高神级×3.0
  else if (quality === 'superDivine') qualityMultiplier = 2.8;
  else if (quality === 'divine') qualityMultiplier = 2.3;
  else if (quality === 'legendary') qualityMultiplier = 1.8;
  else if (quality === 'epic') qualityMultiplier = 1.3;
  const baseBoost = 1.4;

  const powerMultiplier = 1 + (player.soulPower - 1) * 0.03;
  const spiritPowerBonus = 1 + (player.soulPower - 1) * 0.05;

  let baseAtk = base.attack * qualityMultiplier * baseBoost;
  let baseDef = base.defense * qualityMultiplier * baseBoost;
  let baseSpd = base.speed * qualityMultiplier * baseBoost;
  let baseSpi = base.spirit * qualityMultiplier * baseBoost;
  let baseHp  = base.hp  * qualityMultiplier * baseBoost;

  // 至高神级/超神级均衡补正（与 calcAttributes 完全一致，五维均衡）
  if (quality === 'supremeDivine' || quality === 'superDivine') {
    const vals = [baseAtk, baseDef, baseSpd, baseSpi, baseHp];
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    baseAtk = Math.max(baseAtk, avg * 0.85);
    baseDef = Math.max(baseDef, avg * 0.85);
    baseSpd = Math.max(baseSpd, avg * 0.85);
    baseSpi = Math.max(baseSpi, avg * 0.85);
    baseHp = Math.max(baseHp, avg * 0.85);
  }

  const reicBasePct = count * 0.5; // 每世 50%
  return {
    count,
    attackFlat,
    baseAttrPct: reicBasePct,
    ringYearBonus,
    ringYearBonusPct,
    attackPctValue:  baseAtk * powerMultiplier   * reicBasePct,
    defensePctValue: baseDef * powerMultiplier   * reicBasePct,
    speedPctValue:   baseSpd * powerMultiplier   * reicBasePct,
    spiritPctValue:  baseSpi * spiritPowerBonus  * reicBasePct,
    hpPctValue:      baseHp  * powerMultiplier   * reicBasePct,
  };
}

export function calcSpiritBonusBreakdown(player: IPlayer): { attack: number; defense: number; speed: number; spirit: number; hp: number } | null {
  if (!player.activeSpiritIds || player.activeSpiritIds.length === 0 || !player.soulSpirits) return null;
  let totalAtkPct = 0, totalDefPct = 0, totalSpdPct = 0, totalSpiPct = 0, totalHpPct = 0;
  // 预先构建 Map，O(1) 查找代替 Array.find（避免 O(n²)，与 calcAttributes 保持一致）
  const spiritMap = new Map(player.soulSpirits.map((s) => [s.spiritId, s]));
  for (const spiritId of player.activeSpiritIds) {
    const spirit = spiritMap.get(spiritId);
    if (!spirit) continue;
    // 境界加成：与 calcAttributes 完全一致 (v18.0 再提升50%)
    const realmBonus = 0.012 + spirit.majorIndex * 0.0096;
    const minorBonus = spirit.minor * 0.0024;
    let singleBonus = (realmBonus + minorBonus) * evolutionMultiplier(spirit);
    const mainElement=normalizeElement(player.martialSoul?.element);
    if(mainElement==='混沌'||mainElement==='全属性'||normalizeElement(spirit.attribute)===mainElement||calcElementAffinity(player.martialSoul?.element,spirit.attribute)>=.15)singleBonus*=1.5;
    const attr = spirit.attribute;
    if (attr === '金' || attr === '土' || attr === '力量') { totalAtkPct += singleBonus; totalDefPct += singleBonus * 0.5; }
    else if (attr === '木' || attr === '生命') { totalHpPct += singleBonus * 1.5; totalDefPct += singleBonus * 0.5; }
    else if (attr === '水' || attr === '冰') { totalDefPct += singleBonus; totalSpiPct += singleBonus * 0.5; }
    else if (attr === '火' || attr === '雷') { totalAtkPct += singleBonus * 1.3; }
    else if (attr === '风') { totalSpdPct += singleBonus * 1.5; totalAtkPct += singleBonus * 0.3; }
    else if (attr === '光') { totalSpiPct += singleBonus; totalHpPct += singleBonus * 0.5; }
    else if (attr === '暗') { totalAtkPct += singleBonus; totalSpiPct += singleBonus * 0.5; }
    else if (attr === '空间') { totalSpdPct += singleBonus; totalAtkPct += singleBonus * 0.5; }
    else if (attr === '时间') { totalSpiPct += singleBonus * 1.2; totalSpdPct += singleBonus * 0.5; }
    else { totalAtkPct += singleBonus * 0.5; totalDefPct += singleBonus * 0.5; totalSpdPct += singleBonus * 0.5; totalSpiPct += singleBonus * 0.5; }
  }
  return { attack: totalAtkPct, defense: totalDefPct, speed: totalSpdPct, spirit: totalSpiPct, hp: totalHpPct };
}

// 计算领域实际加成（按等级递增）
export function calcDomainBonus(domain: IDomain | null, level: number): DomainBonus | null {
  if (!domain) return null;
  const tier = getDomainBonusTier(level);
  if (tier === 0) return null;
  const mult = 1 + (tier - 1) * 0.5; // 魂圣=1x, 魂斗罗=1.5x, 封号=2x, 极限=2.5x
  // v3.0 领域加成降低 40%
  const reduce = 0.48;
  const base = domain.baseBonuses;
  const result: DomainBonus = {};
  if (base.attack) result.attack = base.attack * mult * reduce;
  if (base.defense) result.defense = base.defense * mult * reduce;
  if (base.speed) result.speed = base.speed * mult * reduce;
  if (base.spirit) result.spirit = base.spirit * mult * reduce;
  if (base.hp) result.hp = base.hp * mult * reduce;
  if (base.allAttr) result.allAttr = base.allAttr * mult * reduce;
  if (base.critRate) result.critRate = base.critRate * mult * reduce;
  if (base.critDmg) result.critDmg = base.critDmg * mult * reduce;
  if (base.skillDmg) result.skillDmg = base.skillDmg * mult * reduce;
  return result;
}

// === 属性克制系统 ===
// 根据魂兽/物品名推导属性（兜底用，优先使用 element 字段）
// 🔴 重要：新生成的魂环/魂骨严格优先使用 element；inferElementFromName 仅作为老存档迁移兜底
// 多字关键词必须排在短关键词前面，避免短词抢先匹配
const ATTRIBUTE_RULES: Array<{ keywords: string[]; element: string }> = [
  {keywords:['雷','霆','紫电','蓝电','寂月仙剑','电浆','电翼'],element:'雷属性'},
  { keywords: ['精神', '灵眸', '摄魂', '神识', '轮回', '心灵', '念力', '噬魂', '邪眼', '梦貘', '忘川', '夺魄', '梦游', '双头灵蜥', '灵渊九尾狐', '破念明王'], element: '精神属性' },
  { keywords: ['三眼金猊', '虚空', '太虚', '古龙', '混沌', '空间', '次元', '时空虫', '时空裂狼', '时空之主'], element: '空间属性' },
  { keywords: ['时间', '春秋', '蝉', '时之蛇', '钟表精', '时光', '轮回盘'], element: '时间属性' },
  // 暗属性：长词优先，避免「黑暗圣龙」被「圣龙」匹配成光属性
  { keywords: ['黑暗圣龙', '金眼黑龙王', '金眼黑龙', '暗魔邪神虎', '终焉暗龙', '堕天使', '邪魔虎鲸王', '黑暗', '幽冥', '死亡', '噬魂', '邪魔', '骨龙', '修罗', '暗', '魔', '堕', '亡灵', '冥', '人面魔蛛', '疾风魔豹', '骸骨邪龙', '邪龙'], element: '暗属性' },
  // 光属性：圣龙/天使等（注意：暗属性已在前面，黑暗圣龙/暗圣龙等不会匹配到这里）
  { keywords: ['光明', '天使', '神圣圣龙', '光', '神圣', '星尘', '琉璃', '翡翠天鹅', '圣音灵雀', '日耀天马', '碧姬', '圣龙'], element: '光属性' },
  { keywords: ['冰碧', '冰帝', '冰', '雪', '寒冰', '霜', '寒'], element: '冰属性' },
  { keywords: ['水', '海', '鲨', '鲸', '河', '沧', '碧水蟾'], element: '水属性' },
  { keywords: ['雷','霆','紫电','蓝电','寂月仙剑'], element:'雷属性' },
  { keywords: ['火', '凤凰', '赤', '炎', '焰', '炼狱神皇'], element: '火属性' },
  { keywords: ['金', '铁', '钢', '玄铁', '龙枪', '剑', '枪', '棍', '斧', '矛', '刃', '昊天锤', '黄金叶', '斩龙', '银甲兽', '铁甲', '钢刺'], element: '金属性' },
  { keywords: ['土', '玄龟', '牛', '熊', '犀', '鼎', '石', '岩', '山', '金刚', '饕餮', '板甲', '盘龙', '镇魂', '泰坦巨猿', '巨力玄猿', '狂暴猛犸', '霸王战猿', '大地之王', '镇岳龟猿', '猛犸', '铁角蛮牛'], element: '土属性' },
  { keywords: ['毒', '蛇皇', '蛛皇', '碧磷', '蟾', '蛛', '植物', '草', '树', '藤', '蓝银', '生命', '风', '燕', '猫鹰', '疾风', '柔骨', '幽冥灵猫', '九凤', '曼陀罗蛇', '食人花妖'], element: '木属性' },
];

export function inferElementFromName(name: string): string {
  for (const rule of ATTRIBUTE_RULES) {
    if (rule.keywords.some((k) => name.includes(k))) {
      return rule.element;
    }
  }
  return '无属性';
}

/**
 * 计算属性克制伤害加成
 * 规则：
 * - 武魂属性与魂环魂兽属性相同 → +5%
 * - 武魂属性与魂骨魂兽属性相同 → +5%
 * - 两者都满足时叠加 → 最高 +10%
 */
export function calcAttributeBonus(
  playerElement: string,
  soulRings: Array<Pick<ISoulRing, 'soulBeastName' | 'beastAttribute'>>,
  soulBones: Array<{ name: string; beastAttribute?: string }>,
  options?: { quality?: string; extremeAttribute?: string }
): { bonusPct: number; hasRingMatch: boolean; hasBoneMatch: boolean; isAllAttr?: boolean } {
  return __localResonance(playerElement,soulRings,soulBones,options);
}

// v2.0 武魂抽取：按品阶概率
// 超神级：12%
// 神级：28%
// 传说级：50%
// 史诗级：10%

// ============================================================
// 改进的随机数工具（基于 crypto API，比 Math.random 更均匀）
// ============================================================

/** 生成 [0, 1) 区间均匀分布的随机数，优先使用 crypto.getRandomValues 提高均匀性 */
function secureRandom(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    // 除以 2^32 得到 [0, 1) 的浮点数
    return buf[0] / 0x1_0000_0000;
  }
  // 兜底：Math.random + 时间戳微扰动，减少可预测性
  const t = performance.now();
  return (Math.random() * 0.9 + (t * 0.001 % 1) * 0.1) % 1;
}

/** 生成 [min, max) 区间的随机整数 */
function randInt(min: number, max: number): number {
  return Math.floor(secureRandom() * (max - min)) + min;
}

/** Fisher-Yates 洗牌：返回新数组，不修改原数组 */
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randInt(0, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 品质概率分布（总和 = 100）
 const QUALITY_PROBABILITY: Record<IMartialSoul['quality'], number> = {
   superDivine: 10,   // 超神级 10%
   supremeDivine: 10, // 至高神级 10%（两仪神剑）
   divine: 25,        // 神级 25%
   legendary: 45,     // 传说级 45%
   epic: 10,          // 史诗级 10%
 };

// 按品质分组的武魂池缓存（初始化时计算一次，避免每次 filter）
let _qualityPools: Record<string, IMartialSoul[]> | null = null;
function getQualityPools(): Record<string, IMartialSoul[]> {
  if (_qualityPools) return _qualityPools;
  const pools: Record<string, IMartialSoul[]> = {
    superDivine: [],
    supremeDivine: [],
    divine: [],
    legendary: [],
    epic: [],
  };
  for (const soul of MOCK_MARTIAL_SOULS) {
    if (pools[soul.quality]) {
      pools[soul.quality].push(soul);
    }
  }
  _qualityPools = pools;
  return _qualityPools;
}

 // 耀阳圣龙：只能通过罗三炮进化获得，不能直接觉醒
 const EVOLUTION_ONLY_SOULS = ['耀阳圣龙'];

/**
  * 按品质概率抽取一个武魂
  * 使用 Fisher-Yates 洗牌 + 递增索引，避免 Math.floor * 长度在边界值上的轻微偏差
  */
 export function rollMartialSoul(opts?: { excludeNames?: string[] }): IMartialSoul {
   const extraExcludes = opts?.excludeNames || [];
   const excludeNames = [...EVOLUTION_ONLY_SOULS, ...extraExcludes];
   const pools = getQualityPools();
   const rand = secureRandom() * 100;

  let pickedQuality: IMartialSoul['quality'];
  let cumulative = 0;

  const qualities: IMartialSoul['quality'][] = ['supremeDivine', 'superDivine', 'divine', 'legendary', 'epic'];
  pickedQuality = 'legendary'; // 默认兜底
  for (const q of qualities) {
    cumulative += QUALITY_PROBABILITY[q];
    if (rand < cumulative) {
      pickedQuality = q;
      break;
    }
  }

  let pool = pools[pickedQuality] || pools.epic;
  if (excludeNames.length > 0) {
    pool = pool.filter((s) => !excludeNames.includes(s.name));
  }
  if (pool.length === 0) {
    // 被全部过滤就退回 epic
    const fallback = pools.epic.filter((s) => !excludeNames.includes(s.name));
    return fallback[0] ?? MOCK_MARTIAL_SOULS[0];
  }

  // 🔴 灵眸加权：传说级品质内灵眸概率提升为 5 倍，其他武魂相对概率不变
   if (pickedQuality === 'legendary') {
     const lingmuIndex = pool.findIndex((s) => s.name === '灵眸');
     if (lingmuIndex >= 0) {
       const LINGMU_WEIGHT = 5; // 灵眸权重 5 倍
       const totalWeight = pool.length - 1 + LINGMU_WEIGHT;
       const r = secureRandom() * totalWeight;
       if (r < LINGMU_WEIGHT) return pool[lingmuIndex];
       // 其余武魂均等，从 pool 中排除灵眸后随机
       const others = pool.filter((_, i) => i !== lingmuIndex);
       const idx = randInt(0, others.length);
       return others[idx];
     }
   }

   // 🔴 罗三炮加权：史诗级品质内罗三炮概率提升为 4 倍（约 2.7% 总概率，保持稀有但可遇）
   if (pickedQuality === 'epic') {
     const lspIdx = pool.findIndex((s) => s.name === '罗三炮');
     if (lspIdx >= 0) {
       const LUOSANPAO_WEIGHT = 4; // 罗三炮权重 4 倍
       const totalWeight = pool.length - 1 + LUOSANPAO_WEIGHT;
       const r = secureRandom() * totalWeight;
       if (r < LUOSANPAO_WEIGHT) return pool[lspIdx];
       const others = pool.filter((_, i) => i !== lspIdx);
       const idx = randInt(0, others.length);
       return others[idx];
     }
   }

  // 用洗牌算法保证同品质内每个武魂均等概率
  const idx = randInt(0, pool.length);
  return pool[idx];
}

/**
 * 品质加权抽取「不同武魂」：与 rollMartialSoul 概率分布完全一致
 * 使用洗牌排除法，保证概率精确且永不死循环
 */
function rollDifferentMartialSoulWeighted(excludeSoul: IMartialSoul, opts?: { excludeNames?: string[] }): IMartialSoul {
  const excludeNames = opts?.excludeNames || [];
  const pools = getQualityPools();

  // 各品质候选：过滤掉与 excludeSoul 同名或同id的武魂，以及额外排除列表
  const candidatesByQuality: Record<string, IMartialSoul[]> = {};
  for (const q of Object.keys(pools)) {
    candidatesByQuality[q] = pools[q].filter(
      (s) => s.id !== excludeSoul.id && s.name !== excludeSoul.name && !excludeNames.includes(s.name),
    );
  }

  // 重新归一化品质概率（因排除后某品质可能变为0）
  const qualities: IMartialSoul['quality'][] = ['supremeDivine', 'superDivine', 'divine', 'legendary', 'epic'];
  const totalProb = qualities.reduce((sum, q) => {
    return sum + (candidatesByQuality[q]?.length > 0 ? QUALITY_PROBABILITY[q] : 0);
  }, 0);

  if (totalProb <= 0) {
    // 极端兜底：武魂池只有1个时返回原pool的第一个
    return MOCK_MARTIAL_SOULS[0];
  }

  // 归一化后按品质概率抽取
  const rand = secureRandom() * totalProb;
  let cumulative = 0;
  let pickedQuality: IMartialSoul['quality'] = 'legendary';
  for (const q of qualities) {
    if (candidatesByQuality[q]?.length > 0) {
      cumulative += QUALITY_PROBABILITY[q];
      if (rand < cumulative) {
        pickedQuality = q;
        break;
      }
    }
  }

  const pool = candidatesByQuality[pickedQuality] || candidatesByQuality.legendary || [];
  if (pool.length === 0) return MOCK_MARTIAL_SOULS[0];

  // 🔴 灵眸加权：传说级品质内灵眸概率提升为 5 倍（与 rollMartialSoul 一致）
  if (pickedQuality === 'legendary') {
    const lingmuIndex = pool.findIndex((s) => s.name === '灵眸');
    if (lingmuIndex >= 0 && pool.length > 1) {
      const LINGMU_WEIGHT = 5;
      const totalWeight = pool.length - 1 + LINGMU_WEIGHT;
      const r = secureRandom() * totalWeight;
      if (r < LINGMU_WEIGHT) return pool[lingmuIndex];
      const others = pool.filter((_, i) => i !== lingmuIndex);
      const idx = randInt(0, others.length);
      return others[idx];
    }
  }

  const idx = randInt(0, pool.length);
  return pool[idx];
}

// 双生武魂概率（精确 25%）
 const TWIN_SOUL_CHANCE = 0.25;
 // 🔴 至高神级双生概率：两个武魂都是至高神级的概率（吞噬茶可以双生，两仪神剑不行）
 // 当第一武魂是至高神级且非严格单武魂时，第二武魂有 0.1% 概率也是至高神级
 const TWIN_SUPREME_DIVINE_CHANCE = 0.001;

// 🔴 严格单武魂限制列表：这些武魂觉醒后永远不能有第二武魂
// 两仪神剑：至高武魂，独占性极强，终身单武魂
// 罗三炮：变异武魂，进化为耀阳圣龙后限制解除（但已成既定事实，不会凭空出现第二武魂）
const SINGLE_SOUL_NAMES = ['罗三炮'];

/**
 * 🔴 严格单武魂守卫：任何设置第二武魂的入口必须经过此检查
 * - 两仪神剑：支持双生，主修与次修均可触发天赋
 * - 罗三炮：永远单武魂（进化为耀阳圣龙后限制解除，但已单武魂即成事实）
 * 返回是否为单武魂（true 表示强制单武魂，禁止有第二武魂）
 */
export function isStrictlySingleSoul(soul: IMartialSoul | null | undefined): boolean {
  if (!soul) return false;
  return SINGLE_SOUL_NAMES.includes(soul.name);
}

/**
 * 强制单武魂：若主武魂属于严格单武魂列表，则清除第二武魂
 * 多重保险：在 rollTwinSouls / createPlayer / 转世 reroll / preset 模式 各入口都调用
 */
export function enforceSingleSoul(
  primary: IMartialSoul,
  secondary: IMartialSoul | null,
): { primary: IMartialSoul; secondary: IMartialSoul | null; isTwin: boolean } {
  if (isStrictlySingleSoul(primary)) {
    return { primary, secondary: null, isTwin: false };
  }
  return { primary, secondary, isTwin: !!secondary };
}

/**
 * 双生武魂抽取：25%概率双生
  * - 两个武魂独立按品质概率抽取
  * - 第二个武魂品质可与第一个不同
  * - 保证两个武魂不会相同
  * - 🔴 严格单武魂守卫：罗三炮强制单武魂
 */
export function rollTwinSouls(opts?: { excludeNames?: string[] }): { primary: IMartialSoul; secondary: IMartialSoul | null; isTwin: boolean } {
  // 用独立的随机源判断是否双生（与武魂抽取出独立）
  let isTwin = secureRandom() < TWIN_SOUL_CHANCE;
  const primary = rollMartialSoul(opts);

  // 🔴 严格单武魂守卫：罗三炮强制单武魂（多重保险第一层）
  if (isStrictlySingleSoul(primary)) {
    isTwin = false;
  }

  if (!isTwin) {
    return { primary, secondary: null, isTwin: false };
  }

   // 第二个武魂：品质加权抽取，且与第一个不同（独立随机）
   let secondary = rollDifferentMartialSoulWeighted(primary);
   // 🔴 至高神级双生（0.1%）：第一武魂是至高神级且非严格单武魂时，小概率第二武魂也是至高神级
   // 两仪神剑支持双生；至高神级次修仍按当前抽取规则生成
   const isPrimarySupreme = primary.quality === 'supremeDivine';
   if (isPrimarySupreme && secureRandom() >= TWIN_SUPREME_DIVINE_CHANCE) {
     // 未中 0.1% 至高双生 → 第二武魂不能是至高神级（通过排除法重抽）
     let safety = 0;
     while (secondary.quality === 'supremeDivine' && safety < 20) {
       secondary = rollDifferentMartialSoulWeighted(primary, { excludeNames: [primary.name] });
       safety++;
     }
   }
  // 🔴 严格单武魂守卫：若第二武魂也是严格单武魂（极端情况），重抽一个（多重保险第二层）
  if (isStrictlySingleSoul(secondary)) {
    secondary = rollDifferentMartialSoulWeighted(primary, { excludeNames: SINGLE_SOUL_NAMES });
    if (isStrictlySingleSoul(secondary)) {
      return { primary, secondary: null, isTwin: false };
    }
  }
  return { primary, secondary, isTwin: true };
}

// 双生武魂先天魂力：任一神级及以上→10级；否则按高的那个品质算
export function rollTwinSoulPower(primary: IMartialSoul, secondary: IMartialSoul | null): number {
  if (!secondary) return rollSoulPower(primary.quality);
  // 任一神级及以上，先天满魂力
  if (primary.quality === 'supremeDivine' || secondary.quality === 'supremeDivine' ||
      primary.quality === 'superDivine' || secondary.quality === 'superDivine' ||
      primary.quality === 'divine' || secondary.quality === 'divine') {
    return 10;
  }
  // 取品质高的那个算
  const qualityRank: Record<string, number> = { epic: 1, legendary: 2, divine: 3, superDivine: 4, supremeDivine: 5 };
  const pRank = qualityRank[primary.quality] ?? 0;
  const sRank = qualityRank[secondary.quality] ?? 0;
  const higher = pRank >= sRank ? primary : secondary;
  return rollSoulPower(higher.quality);
}

/** 先天魂力：至高神级/超神级/神级/传说级满魂力10级，史诗6-10级，精良4-7级，稀有2-5级，普通1-3级 */
export function rollSoulPower(quality: string): number {
  if (quality === 'supremeDivine' || quality === 'superDivine' || quality === 'divine' || quality === 'legendary') {
    return 10;
  }
  if (quality === 'epic') {
    return randInt(6, 11); // 6,7,8,9,10 五选一
  }
  if (quality === 'fine') {
    return randInt(4, 8); // 4,5,6,7 四选一
  }
  if (quality === 'rare') {
    return randInt(2, 6); // 2,3,4,5 四选一
  }
  return randInt(1, 4); // 普通：1,2,3 三选一
}

export function getMaxRings(level: number): number {
  // 第1魂环需10级，第2需20级...第9需90级
  // 1-9级0环，10-19级1环...90+级9环
  return Math.min(9, Math.floor(level / 10));
}

export function canAbsorbNextRing(level: number, currentRings: number): boolean {
  // 当前魂环数 < 等级对应最大可拥有环数，就能再吸收一个
  return currentRings < getMaxRings(level);
}

export function getRequiredLevelForRing(ringIndex: number): number {
  // 第N环需要达到N*10级才能吸收（0索引）
  // 第1环(索引0)=10级, 第2环(索引1)=20级...
  return (ringIndex + 1) * 10;
}

/**
 * 获取闭关突破时长（秒）
 * 10级(魂师):10秒，每提升一个大境界+10秒
 * 90级突破(89级瓶颈):90秒
 */
export function getCultivationSeconds(level: number): number {
  const realmIndex = Math.floor((level - 9) / 10); // 9级=0, 19=1, ...
  return 10 + realmIndex * 10;
}

// 阴阳魂核凝聚时长（毫秒）— 统一10分钟
export const YIN_CORE_DURATION_MS = 10 * 60 * 1000;
export const YANG_CORE_DURATION_MS = 10 * 60 * 1000;

/** @deprecated 已改用秒，保留兼容 */
export function getCultivationMinutes(level: number): number {
  return getCultivationSeconds(level) / 60;
}

// 各魂环槽位的必定成功年限上限与超额成功率计算规则
interface RingAbsorptionRule {
  guaranteedMaxYears: number; // 必定成功上限（含）
  stepYears: number;          // 每多少年为一个计算单位
  stepPenalty: number;        // 每单位减少的成功率（百分比）
  baseRate: number;           // 超额后初始成功率（百分比）
  unlimited?: boolean;        // 是否无年限上限（第9魂环专用）
}

// v2.0 第一武魂魂环吸收规则（严格按新规定）
// 必定成功上限：第1环600年、第2环900年、第3环5000年、第4环7000年、
//              第5环3万年、第6环6万年、第7环8万年、第8环9万年、第9环100万年
// 超年限吸收：基础成功率60%，每超过对应上限10%年份，减少5%成功率
// 吸收失败不掉级
export const RING_ABSORPTION_RULES: RingAbsorptionRule[] = [
  { guaranteedMaxYears: 600,     stepYears: 60,    stepPenalty: 3, baseRate: 95 }, // 第1魂环（百年95%）
  { guaranteedMaxYears: 900,     stepYears: 90,    stepPenalty: 3, baseRate: 95 }, // 第2魂环（百年95%）
  { guaranteedMaxYears: 5000,    stepYears: 500,   stepPenalty: 3, baseRate: 85 }, // 第3魂环（千年85%）
  { guaranteedMaxYears: 7000,    stepYears: 700,   stepPenalty: 3, baseRate: 85 }, // 第4魂环（千年85%）
  { guaranteedMaxYears: 30000,   stepYears: 3000,  stepPenalty: 4, baseRate: 70 }, // 第5魂环（万年70%）
  { guaranteedMaxYears: 60000,   stepYears: 6000,  stepPenalty: 4, baseRate: 70 }, // 第6魂环（万年70%）
  { guaranteedMaxYears: 80000,   stepYears: 8000,  stepPenalty: 4, baseRate: 70 }, // 第7魂环（万年70%）
  { guaranteedMaxYears: 90000,   stepYears: 9000,  stepPenalty: 4, baseRate: 50 }, // 第8魂环（十万年50%）
  { guaranteedMaxYears: 1000000, stepYears: 100000, stepPenalty: 5, baseRate: 30, unlimited: true }, // 第9魂环：百万年30%，超过后每超10%减5%
];

/**
 * 计算魂环吸收成功率
 * @param slotIndex 魂环槽位索引（0-8，对应第1-9魂环）
 * @param years 魂环年限
 * @param extraGuaranteedYears 额外必定成功年限（固定年限加成）
 * @param bonusPct 必定成功上限百分比加成（如0.5 = +50%），转世每世+50%，可叠加
 * @returns 成功率 0-100 的整数，100 表示必定成功
 */
// v2.0 第一武魂魂环吸收成功率
// 规则：年限≤必定成功上限 → 100%成功
//       超过上限 → 基础成功率60%，每超过上限10%年份，减少5%成功率
//       吸收失败不掉级
export function calcAbsorbSuccessRate(slotIndex: number, years: number, extraGuaranteedYears: number = 0, bonusPct: number = 0): number {
  if (slotIndex < 0 || slotIndex >= RING_ABSORPTION_RULES.length) return 0;
  const rule = RING_ABSORPTION_RULES[slotIndex];
  const pctBonusYears = Math.floor(rule.guaranteedMaxYears * bonusPct);
  const guaranteedYears = rule.guaranteedMaxYears + extraGuaranteedYears + pctBonusYears;
  if (years <= guaranteedYears) return 100;
  if (guaranteedYears <= 0) return Math.max(0.01, rule.baseRate);
  // 超出比例（相对于上限的百分比）
  const exceedRatio = (years - guaranteedYears) / guaranteedYears;
  // 每超10%减5%成功率
  const penaltySteps = Math.floor(exceedRatio / 0.1);
  const rate = rule.baseRate - penaltySteps * rule.stepPenalty;
  return Math.max(0.01, Math.min(100, Math.round(rate * 10) / 10));
}

/** 获取某魂环槽位的必定成功年限上限（含轮回加成+百分比加成） */
export function getRingGuaranteedYears(slotIndex: number, extraGuaranteedYears: number = 0, bonusPct: number = 0): number {
  if (slotIndex < 0 || slotIndex >= RING_ABSORPTION_RULES.length) return 0;
  const pctBonusYears = Math.floor(RING_ABSORPTION_RULES[slotIndex].guaranteedMaxYears * bonusPct);
  return RING_ABSORPTION_RULES[slotIndex].guaranteedMaxYears + extraGuaranteedYears + pctBonusYears;
}

/** 某魂环槽位是否无年限上限（第9魂环专用） */
export function isRingSlotUnlimited(slotIndex: number): boolean {
  if (slotIndex < 0 || slotIndex >= RING_ABSORPTION_RULES.length) return false;
  return !!RING_ABSORPTION_RULES[slotIndex].unlimited;
}

/** 获取第二武魂某槽位的必定成功年限上限（含转世加成） */
export function getSecondSoulGuaranteedYears(
  level: number,
  slotIndex: number,
  extraGuaranteedYears: number = 0,
  bonusPct: number = 0,
): number {
  const limits = getSecondSoulRingLimits(level);
  const baseLimit = limits[slotIndex] ?? 0;
  if (baseLimit <= 0) return 0;
  // 90级及以上：第二武魂所有魂环百万年以下必定成功
  if (level >= 90) {
    const pctBonusYears = Math.floor(1000000 * bonusPct);
    return 1000000 + extraGuaranteedYears + pctBonusYears;
  }
  const pctBonusYears = baseLimit < Infinity ? Math.floor(baseLimit * bonusPct) : 0;
  return baseLimit + extraGuaranteedYears + pctBonusYears;
}

// v2.0 第二武魂魂环吸收成功率
// 规则：90级以下：第二武魂无法超年限吸收，超过上限直接失败，不超过则100%成功
//       90级及以上：所有9个魂环100万年以下必定成功，超过100万年按超年限规则计算（基础60%，每超10%减5%）
export function calcSecondSoulAbsorbSuccessRate(level: number, years: number, slotIndex = 0, extraGuaranteedYears: number = 0, bonusPct: number = 0): number {
  const limits = getSecondSoulRingLimits(level);
  const slotLimit = limits[slotIndex] || 0;

  // 90级及以上：第二武魂所有魂环支持百万年以上吸收
  // 100万年以下必定成功，超过100万年按超年限规则计算
  if (level >= 90) {
    const pctBonusYears = Math.floor(1000000 * bonusPct);
    const guaranteedYears = 1000000 + extraGuaranteedYears + pctBonusYears;
    if (years <= guaranteedYears) return 100;
    // 超年限吸收：基础成功率30%，每超过上限10%年份，减少5%成功率
    const exceedRatio = (years - guaranteedYears) / guaranteedYears;
    const penaltySteps = Math.floor(exceedRatio / 0.1);
    const rate = 30 - penaltySteps * 5;
    return Math.max(0.01, Math.min(100, Math.round(rate * 10) / 10));
  }

  // 某槽位为 Infinity 表示无上限（90级以上已处理，此处兜底）
  if (slotLimit === Infinity) return 100;
  const pctBonusYears = Math.floor(slotLimit * bonusPct);
  const maxYears = slotLimit + extraGuaranteedYears + pctBonusYears;
  // 90级以下：第二武魂无法超年限吸收，超过上限直接失败
  return years <= maxYears ? 100 : 0;
}

// 战斗启动配置
export interface BattleStartConfig {
   battleType: 'hunt' | 'encounter' | 'challenge' | 'shrek-exam' | 'arena' | 'mountain-dungeon' | 'demon' | 'sea-god' | 'fierce-beast' | 'divine-avatar' | 'divine-ditian' | 'divine-beast' | 'spirit-tower' | 'god-realm';
  locationId?: string;
  enemy: {
    id: string;
    name: string;
    years: number;
    qualityColor: string;
    qualityLabel: string;
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    spirit: number;
    skillName: string;
    skillDesc: string;
    element?: string;
    instantKillChance?: number;
    specialSkillCooldown?: number;
    hasOnlySkill?: boolean;
  };
  meta?: Record<string, any>;
  exploreSource?: any;
}

// 学院身份
export type AcademyRank = 'none' | 'freshman' | 'outer' | 'inner' | 'sea-god';

// 竞技场段位
export type ArenaRank = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'star' | 'king';

export const ARENA_RANK_LABEL: Record<ArenaRank, string> = {
  bronze: '青铜',
  silver: '白银',
  gold: '黄金',
  platinum: '铂金',
  diamond: '钻石',
  star: '星耀',
  king: '王者',
};

const ARENA_RANK_ORDER: ArenaRank[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'star', 'king'];

// 内院名师指导
export interface IMentorTeacher {
  id: string;
  name: string;
  martialSoul: string;
  level: number; // 等级
  title: string; // 称号/职位
  description: string;
  expReward: number; // 指导可获得的修为
}

export const MENTOR_TEACHERS: IMentorTeacher[] = [
  // === 海神阁高层 ===
  { id: 'muen', name: '穆恩', martialSoul: '光明圣龙', level: 99, title: '极限斗罗·龙神斗罗·海神阁阁主', description: '史莱克学院海神阁阁主，九十九级极限斗罗，当世三大极限斗罗之一，龙神斗罗穆恩。', expReward: 200000 },
  { id: 'xuanzi', name: '玄子', martialSoul: '饕餮神牛', level: 98, title: '巅峰斗罗·饕餮斗罗·海神阁副阁主', description: '史莱克学院海神阁副阁主，九十八级巅峰斗罗，饕餮斗罗玄子。', expReward: 180000 },
  { id: 'yanshaozhe', name: '言少哲', martialSoul: '光明凤凰', level: 95, title: '超级斗罗·明凤斗罗·外院院长', description: '史莱克学院外院院长，九十五级超级斗罗，明凤斗罗言少哲。', expReward: 120000 },
  { id: 'xianliner', name: '仙琳儿', martialSoul: '青炎凤凰', level: 95, title: '超级斗罗', description: '史莱克学院内院副院长，九十五级超级斗罗，青炎凤凰武魂。', expReward: 120000 },
  { id: 'qianduoduo', name: '钱多多', martialSoul: '大力金刚熊', level: 95, title: '超级斗罗·魂导系院长', description: '史莱克学院魂导系院长，九十五级超级斗罗，大力金刚熊武魂。', expReward: 120000 },
  { id: 'fanyu', name: '帆羽', martialSoul: '魂导器', level: 92, title: '封号斗罗·魂导系副院长', description: '史莱克学院魂导系副院长，九十二级封号斗罗，顶级魂导师。', expReward: 90000 },
  // === 学院老师 ===
  { id: 'zhouyi', name: '周漪', martialSoul: '寒冰', level: 89, title: '魂斗罗·新生班主任', description: '史莱克学院新生一班班主任，八十九级魂斗罗，教学严格，人称"周老太太"。', expReward: 60000 },
  { id: 'wangyan', name: '王言', martialSoul: '星罗棋布', level: 88, title: '魂斗罗', description: '史莱克学院外院教师，八十八级魂斗罗，学识渊博，战术大师。', expReward: 55000 },
  // === 内院弟子 ===
  { id: 'zhanglehuan', name: '张乐萱', martialSoul: '月', level: 85, title: '魂斗罗·内院大师姐', description: '史莱克内院首席弟子，内院大师姐，月武魂，实力深不可测。', expReward: 50000 },
  { id: 'maxiaotao', name: '马小桃', martialSoul: '邪火凤凰', level: 82, title: '魂斗罗·内院', description: '史莱克内院弟子，邪火凤凰武魂，强攻系魂师，爆发力极强。', expReward: 45000 },
  { id: 'daihuabin', name: '戴华斌', martialSoul: '白虎', level: 70, title: '魂圣·内院', description: '史莱克内院弟子，白虎武魂，强攻系，戴家后裔，性格高傲。', expReward: 30000 },
  { id: 'wufeng', name: '巫风', martialSoul: '红龙', level: 65, title: '魂帝·内院', description: '史莱克内院弟子，红龙武魂，强攻系，性格刚烈。', expReward: 25000 },
  { id: 'ningtian', name: '宁天', martialSoul: '七宝琉璃塔', level: 65, title: '魂帝·内院', description: '史莱克内院弟子，七宝琉璃塔武魂，辅助系，出身名门。', expReward: 25000 },
  // === 七怪（学长学姐指导） ===
  { id: 'huoyuhao', name: '霍雨浩', martialSoul: '灵眸·极限单兵', level: 0, title: '主角·灵眸武魂', description: '史莱克学院最年轻的海神阁成员，灵眸武魂拥有者，擅长精神探测与控制。', expReward: 50000 },
  { id: 'tangwutong', name: '唐舞桐', martialSoul: '光明女神蝶', level: 0, title: '主角·光明女神蝶', description: '海神之女，光明女神蝶武魂，绚丽而强大的光明系魂师。', expReward: 48000 },
  { id: 'beibei', name: '贝贝', martialSoul: '蓝电霸王龙', level: 0, title: '大师兄·蓝电霸王龙', description: '史莱克七怪老大，蓝电霸王龙武魂继承人，性格沉稳。', expReward: 40000 },
  { id: 'hecaitou', name: '和菜头', martialSoul: '魂导师', level: 0, title: '二师兄·魂导师', description: '顶级魂导师，擅长魂导器制作与远程攻击。', expReward: 38000 },
  { id: 'xusanshi', name: '徐三石', martialSoul: '玄冥龟', level: 0, title: '三师兄·玄冥龟', description: '防御系魂师，玄冥龟武魂防御力惊人。', expReward: 36000 },
  { id: 'jiangnannan', name: '江楠楠', martialSoul: '柔骨兔', level: 0, title: '四师姐·柔骨兔', description: '敏攻系魂师，柔骨兔武魂身法灵动。', expReward: 35000 },
  { id: 'xiaoxiao', name: '萧萧', martialSoul: '三生镇魂鼎', level: 0, title: '五师姐·三生镇魂鼎', description: '控制系魂师，三生镇魂鼎攻守兼备。', expReward: 36000 },
];

export function getTotalArenaStars(rank: ArenaRank, stars: number): number {
  const idx = ARENA_RANK_ORDER.indexOf(rank);
  return idx * 5 + stars;
}

export function getArenaRankFromTotal(total: number): { rank: ArenaRank; stars: number } {
  if (total < 0) total = 0;
  if (total >= 30) {
    return { rank: 'king', stars: total - 30 };
  }
  const idx = Math.floor(total / 5);
  const stars = total % 5;
  return { rank: ARENA_RANK_ORDER[Math.min(idx, 6)], stars };
}


interface GameContextValue {
  player: IPlayer | null;
  /** 玩家属性（memo 化，组件层直接取用避免重复计算） */
  attributes: IAttrs | null;
  hasSave: boolean;
  loading: boolean;
  inBattle: boolean;
  setInBattle: (v: boolean) => void;
  exploration: IExplorationState | null;
  setExploration: (s: IExplorationState | null | ((prev: IExplorationState | null) => IExplorationState | null)) => void;
  battleState: IBattleState | null;
  setBattleState: (s: IBattleState | null) => void;
  createPlayer: (name: string, direction: string, soul: IMartialSoul, soulPower: number, secondSoul?: IMartialSoul | null) => void;
  loadSave: () => void;
  saveGame: () => void;
  resetGame: () => void;
  // 转世轮回
  performReincarnation: (option: 'keep' | 'reroll', newName?: string, preset?: { mainSoul?: IMartialSoul; secondSoul?: IMartialSoul | null; soulPower?: number }) => { success: boolean; reason?: string; newSoul?: IMartialSoul | null; newSecondSoul?: IMartialSoul | null };
  getReincarnationOrbs: () => IReincarnationOrb[];
  getReincarnationBonus: () => { count: number; attackBonus: number; ringYearBonus: number; ringYearBonusPct: number };
  canReincarnate: () => boolean;
  exportSave: () => string;
  importSave: (code: string) => { success: boolean; reason: string };
  addExp: (exp: number) => { leveledUp: boolean; newLevel: number; bottleneck: boolean; blocked: boolean };
  addCoins: (amount: number) => void;
  addItem: (item: IItem) => boolean;
  addSoulRing: (ring: ISoulRing) => boolean;
  addPendingRing: (ring: IPendingSoulRing) => void;
  absorbPendingRing: (pendingRingId: string, slotIndex: number, soulIndex?: 0 | 1) => { success: boolean; levelDropped: boolean };
  // 天梦冰蚕献祭奇遇
  canTriggerTianmeng: () => boolean;
  markTianmengTriggered: () => void;
  acceptTianmengSacrifice: () => { success: boolean; reason?: string; newSoul?: IMartialSoul; newRing?: ISoulRing };
  rejectTianmengSacrifice: () => void;
  discardPendingRing: (pendingRingId: string) => void;
  cleanupExpiredRings: () => void;
  // 魂灵系统
  addPendingSpirit: (spirit: IPendingSoulSpirit) => void;
  contractSpirit: (pendingId: string) => { success: boolean; reason?: string };
  discardPendingSpirit: (pendingId: string) => void;
  cleanupExpiredSpirits: () => void;
  upgradeSpirit: (spiritId: string) => { success: boolean; reason?: string };
  breakthroughSpirit: (spiritId: string) => { success: boolean; reason?: string };
  setActiveSpirits: (ids: string[]) => void;
  setPlayer: (updater: (p: IPlayer) => IPlayer) => void;
  setTitle: (title: string) => void;
  setDomain: (domain: IDomain | null) => void;
  setSecondDomain: (domain: IDomain | null) => void;
  setCurrentHp: (hp: number) => void;
  consumeStamina: (amount: number) => boolean;
  recoverStamina: () => number;
  getCurrentStamina: () => { current: number; max: number };
  startCultivation: () => void;
  finishCultivation: () => void;
  // 彩蛋境界突破（99级之上，经验满后手动点击）
  breakthroughEasterRealm: () => { success: boolean; newStage: number; reason?: string };
  // 神考系统
  canEnterDivineTrials: () => boolean;                                  // 是否可进入神考（有券或70级+）
  performDivineDraw: () => { success: boolean; trial: IDivineTrial | null; isMiss: boolean; reason?: string };
  confirmDivineTrial: (trialId: string) => { success: boolean; reason?: string };
  refreshDivineDraw: () => { success: boolean; reason?: string; cost: number };
  acceptExam: (examIndex: number) => { success: boolean; reason?: string };
  checkExamComplete: (examIndex: number) => boolean;
  completeExam: (examIndex: number) => { success: boolean; rewards: string[]; reason?: string };
  failExam: (examIndex: number) => { success: boolean; reason?: string };
  drawArtifact: () => { success: boolean; reason?: string; rewards: string[] };
  upgradeArtifact: (levels?: number) => { success: boolean; levelsUp: number; cost: number; reason?: string };
  getArtifactUpgradeCost: (targetLevel: number) => number;
  inheritDeity: () => { success: boolean; reason?: string };
  setDivineRingColor: (color: string) => void;
  confirmDivineAvatarVictory: () => void;
  confirmDiTianVictory: () => void;
  confirmDivineBeastVictory: () => void;
  recordDivineAvatarDefeat: () => boolean;
  recruitCharacter: (recruit: IRecruit) => boolean;
  toggleTeamMember: (recruitId: string) => boolean;
  equipItem: (item: IItem) => void;
  unequipSlot: (slot: keyof IEquipmentSlots) => void;
   unequipSoulBone: (slot: keyof ISoulBoneSlots) => void;
   // 🔴 v15.0 神装系统
   convertToDivineArmor: () => { success: boolean; reason?: string };
   renameDivineArmor: (name: string) => { success: boolean; reason?: string };
   refreshArmorResonance: () => void;
   // 🔴 v16.0 神界系统
   startGodRealmBattle: (bossId: string) => { success: boolean; reason?: string };
   confirmGodRealmVictory: (bossId: string) => void;
   craftDivineCore: () => { success: boolean; reason?: string };
   // 自制魂导器：消耗材料生成自定义魂导器（新6步流程）
  craftSoulGuide: (params: {
    type: SoulGuideType;
    level: number;
    materialNames: string[];
    coreGemId: string | null;
    name: string;
  }) => { success: boolean; reason?: string; item?: IItem; finalAttrs?: Record<string, number> };
  startBattle: (config: BattleStartConfig) => void;
  endBattle: () => void;
  // 探索：收集物品（探索过程中临时保存到探索状态，结束时合并）
  collectExploreItem: (item: IItem) => void;
  // 探索：收集魂环（探索中不启动倒计时，结束后统一启动）
  collectExploreRing: (ring: ISoulRing, soulIndex?: 0 | 1) => void;
  // 从探索收集列表移除魂环（玩家选择销毁时）
  removeExploreRing: (ringId: string) => void;
  // 结束探索：将探索中收集的物品/魂环合并进玩家数据，魂环统一设置3分钟倒计时
  finishExploration: () => void;
  // 学院系统
  joinShrekAcademy: () => void;
  promoteToOuterCourt: () => void;
  promoteToInnerAcademy: () => boolean;
  setExamCooldown: (ms: number) => void;
  takeMentorGuidance: (teacherId: string) => { success: boolean; expGained: number };
  getMentorCooldown: (teacherId: string) => number;
  chooseSoulCore: (type: 'yin' | 'yang') => void;
  breakThroughWithYinYangCore: (level: 89 | 98) => boolean;
  // 海神阁
  confirmSeaGodVictory: (memberId: string) => { success: boolean; expGained: number; coinGained: number; newPosition: number; isPavilionMaster: boolean };
  // 竞技场
  addArenaResult: (win: boolean, coinGain: number) => { rank: ArenaRank; stars: number; rankUp: boolean; rankDown: boolean };
  // 上一场战斗的结果（用于战斗结束后页面仍可查询胜负）
  lastBattleResult: { phase: 'victory' | 'defeat' | 'flee' | null; battleType: string | null; locationId?: string | null; enemyId?: string | null };
  // 中断探索（保留魂环和魂骨物品，直接清空探索状态）
  abortExploration: () => { rings: number; items: number };
   // 消耗品：服用物品，返回是否成功及原因
   useConsumable: (itemInstanceId: string) => { success: boolean; reason?: string; itemName?: string };
    // 材料转换：将指定名称+数量的材料转换为目标材料
    materialConvert: (params: { fromName: string; fromQty: number; toName: string; fromQuality?: string; toQuality?: string }) => { success: boolean; reason?: string; gotQty?: number };
   // 🔴 v17.0 侣系统
   /** 接受凶兽青睐，加入侣列表 */
   acceptCompanionFavor: (beastId: string) => boolean;
   /** 拒绝凶兽青睐，加入拒绝列表（下次仍可能触发） */
   rejectCompanionFavor: (beastId: string) => void;
   /** 检测并存储待处理青睐（战斗胜利后调用，存储到pendingFavorBeastId） */
   checkAndStoreFavorTrigger: (beastId: string, area: 'star-lake' | 'frozen-domain') => boolean;
   /** 待处理青睐的凶兽id（回到主界面后弹出用） */
   pendingFavorBeastId: string | null;
   /** 清除待处理青睐（接受/拒绝/关闭后） */
   clearPendingFavor: () => void;
   /** 计算赠送物品的好感度增量（UI 展示与实际赠送共用，保证一致） */
   computeFavorGain: (item: IItem) => number;
   /** 赠送物品增加好感度 */
   giftCompanion: (beastId: string, itemInstanceId: string) => { success: boolean; reason?: string; favorGain?: number };
   /** 帮助化形（好感度≥50时），消耗20%当前血量 */
   helpTransformCompanion: (beastId: string) => { success: boolean; reason?: string };
    /** 结为情侣（好感度≥100时），可选传性别修改显示名 */
    becomeLover: (beastId: string, gender?: 'male' | 'female') => { success: boolean; reason?: string };
    /** 结为夫妻（好感度≥150且尚未有配偶时） */
    becomeSpouse: (beastId: string) => { success: boolean; reason?: string };
    /** 离婚：解除夫妻关系+情侣关系，好感-500，全属性-50%惩罚 */
    divorceCompanion: (beastId: string) => { success: boolean; reason?: string };
    /** 遗忘角色（好感度<150时可用），从列表隐藏但保留数据 */
    forgetCompanion: (beastId: string) => { success: boolean; reason?: string };
   /** 双修，获得大量经验，冷却5分钟 */
   dualCultivate: (beastId: string) => { success: boolean; reason?: string; expGained?: number };
   /** 交融（仅夫妻可用），获得结晶，虚弱5分钟 */
   mateCompanion: (beastId: string) => { success: boolean; reason?: string };
    /** 计算当前所有情侣的全属性百分比加成（每个情侣+10%，叠加） */
    getCompanionLoverBonus: () => number;
    // 🔴 v17.2 茶城系统
    /** 茶城待处理青睐的人物id（探索遇到后弹出用） */
    pendingTeaFavorId: string | null;
    /** 茶城各节点冷却 */
    teaNodeCooldowns: Record<string, number>;
    /** 探索茶城节点，有概率遇到人物 */
    exploreTeaNode: (nodeId: string) => { success: boolean; reason?: string; encounterId?: string; expGained?: number; coinGained?: number };
    setSweepFilters: (ringYears: number, boneYears: number) => void;
    settleLiehunVictory: (ledger: LiehunLedger, phase: string) => void;
    settleJiYueBattle: (id: string, phase: string) => void;
    /** 一键扫荡：模拟多个节点探索，返回所有掉落 */
    sweepExplore: (areaKey: string, params: {
      yearMin: number;
      yearMax: number;
      staminaCost: number;
      attributeFilter?: string | string[];
      rareChance?: number;
      rareBoostMin?: number;
      rareBoostMax?: number;
      nodesCount?: number;
    }) => {
      success: boolean;
      reason?: string;
      result?: {
        beasts: any[];
        rings: any[];
        items: any[];
        coins: number;
        exp: number;
        filterSummary: SweepFilterSummary;
      };
    };
    /** 读取某区域的累计探索次数（用于扫荡解锁判断） */
    getSweepCount: (areaKey: string) => number;
    /** 增加某区域探索次数（每次探索完调用） */
    incrementSweepCount: (areaKey: string) => void;
    /** 轮回之影：获取上一世镜像（最近一世） */
    getReincarnationShadow: () => IReincarnationOrb | null;
    /** 轮回之影：今日是否已挑战 */
    hasShadowChallengedToday: () => boolean;
    /** 轮回之影：开始挑战（记录挑战日期） */
    startShadowChallenge: () => { success: boolean; reason?: string; orb?: IReincarnationOrb };
    /** 轮回之影：战斗胜利后发放奖励 */
    claimShadowVictory: (expReward: number, coinReward: number) => { success: boolean; reason?: string };
    /** 接受茶城人物青睐 */
    acceptTeaFavor: (characterId: string) => boolean;
    /** 拒绝茶城人物青睐 */
    rejectTeaFavor: (characterId: string) => void;
    /** 清除茶城待处理青睐 */
    clearPendingTeaFavor: () => void;
    /** 挑战伴侣获胜后增加好感度（仅challenge机制角色可用），返回实际增加量 */
    challengeCompanionWin: (companionId: string) => { success: boolean; reason?: string; favorGain?: number; oneTimeVictory?: boolean; artifactItemName?: string; titleReward?: string; isFirstTime?: boolean };
    challengeCompanionLose: (companionId: string) => { success: boolean; reason?: string; nextAvailableAt?: number };
    /** 检查挑战模式伴侣是否在冷却中 */
    getChallengeCooldown: (companionId: string) => number; // 返回剩余秒数，0表示可挑战
    /** 切换当前激活的神器（仅神位继承后可用），传 null 切回继承神位神器 */
    switchActiveArtifact: (artifactId: string | null) => { success: boolean; reason?: string };
    // 🔴 吞噬茶武魂·吞噬天赋
    /** 吞噬魂兽：根据年限随机增加一项五维属性 */
    devourBeast: (beastYears: number, beastName: string) => { success: boolean; attr?: string; attrLabel?: string; value?: number; reason?: string; isBacklash?: boolean; backlashValue?: number };
    /** 记录击败茶城角色次数（返回当前次数） */
    recordTeaDefeat: (teaId: string) => number;
    /** 读取击败次数 */
    getTeaDefeatCount: (teaId: string) => number;
    /** 转化特殊魂灵（三茶第二次击败时） */
    convertSpecialSpirit: (spiritId: string, name: string, attribute: string, sourceId: string, hp: number, attack: number, defense: number, speed: number, spirit: number, skillName: string, skillDesc: string, instantKillChance: number, iconChar: string) => { success: boolean; reason?: string };
    /** 切换特殊魂灵上阵 */
    toggleSpecialSpiritActive: (spiritId: string) => { success: boolean; reason?: string };
     /** 强配混沌茶 */
     forceMarryHundunCha: () => { success: boolean; reason?: string };
     // 🔴 v22.0 百级神级修炼 + 法则碎片系统
     /** 解锁百级神级修炼 */
     unlockGodLevelCultivation: () => void;
     /** 检查是否可以解锁百级修炼 */
     canUnlockGodLevel: () => boolean;
     /** 选择法则碎片类型（百级后每升2级领1枚） */
     chooseLawFragment: (lawType: string) => { success: boolean; reason?: string };
     /** 融合法则（3枚→1个） */
     fuseLaw: (lawType: string) => { success: boolean; reason?: string };
     /** 百级突破（消耗一个法则） */
     godBreakthrough: (lawType: string) => { success: boolean; reason?: string };
     /** 是否神级瓶颈 */
     isGodBottleneck: (level: number) => boolean;
     /** 已融合法则数 */
     getFusedLawsCount: () => number;
     /** 获取神位等级上限 */
     getGodLevelCap: (tier: string) => number;
    /** 检查是否已有混沌茶配偶 */
    hasHundunChaSpouse: () => boolean;
     // 成就系统
   achievements: IAchievement[];
   unlockedAchievementIds: Set<string>;
   getAchievementProgress: (achievement: IAchievement) => { current: number; target: number; completed: boolean };
   clearNewAchievements: () => void;
 }

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [player, rawSetPlayerState] = useState<IPlayer | null>(null);
  const setPlayerState=useCallback((update:any)=>rawSetPlayerState(prev=>normalizeSilver(normalizeGoldBlood(normalizeGoldKing(typeof update==='function'?update(prev):update)))),[]);
  const [hasSave, setHasSave] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inBattle, setInBattle] = useState(false);
  const [exploration, setExplorationState] = useState<IExplorationState | null>(null);
  const [battleState, setBattleState] = useState<IBattleState | null>(null);

  // 探索状态持久化包装器：每次变化都写入 localStorage，防止切后台/掉进程丢失魂环魂骨
  const setExploration = useCallback((s: IExplorationState | null | ((prev: IExplorationState | null) => IExplorationState | null)) => {
    setExplorationState((prev) => {
      let next: IExplorationState | null;
      if (typeof s === 'function') {
        next = (s as (prev: IExplorationState | null) => IExplorationState | null)(prev);
      } else {
        next = s;
      }
      try {
        if (next) {
          scopedStorage.setItem(EXPLORE_SAVE_KEY, JSON.stringify(next));
        } else {
          scopedStorage.removeItem(EXPLORE_SAVE_KEY);
        }
      } catch (err) {
        logger.error('saveExploration failed:', String(err));
      }
      return next;
    });
  }, []);
  const [lastBattleResult, setLastBattleResult] = useState<{ phase: 'victory' | 'defeat' | 'flee' | null; battleType: string | null; locationId?: string | null; enemyId?: string | null }>({ phase: null, battleType: null, locationId: null, enemyId: null });
  // 🔴 v17.1 侣系统·待处理青睐：战斗胜利后先存这里，回到主界面再弹（防误触）
  // 🔴 v17.2 修复：直接从 player.companions.pendingFavorBeastId 派生，不再单独 useState
  // 避免 React 重渲染 / 路由切换 / 页面刷新导致状态丢失（player 已持久化）
  const pendingFavorBeastId = player?.companions?.pendingFavorBeastId ?? null;

  // ========== 存档节流（减少 localStorage 同步阻塞）==========
  const saveTimerRef = useRef<number | null>(null);
  const pendingSaveRef = useRef<IPlayer | null>(null);
  const isResettingRef = useRef(false); // 重置锁：true 时拒绝任何存档写入，防止生命周期事件写回旧档
  const flushSave = useCallback(() => {
    // 重置过程中禁止任何写入（包括 beforeunload / pagehide / visibilitychange 触发的）
    if (isResettingRef.current) return;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (pendingSaveRef.current) {
      const data = pendingSaveRef.current;
      // 🔴 终极兜底：保存前强制刷新天梦冰蚕魂环伤害
      // 防止任何遗漏的升级路径导致伤害不随境界提升
      const savedLevel = data.level;
      const mainRefresh = refreshTianmengDamagePct(data.soulRings, savedLevel, '存档兜底');
      let finalData = data;
      if (mainRefresh.updated) {
        finalData = { ...finalData, soulRings: mainRefresh.rings };
      }
      if (finalData.isTwinSoul && finalData.secondSoulRings) {
        const secRefresh = refreshTianmengDamagePct(finalData.secondSoulRings, savedLevel, '存档兜底（次修）');
        if (secRefresh.updated) {
          finalData = { ...finalData, secondSoulRings: secRefresh.rings };
        }
      }
       const saveData = { ...normalizeSilver(normalizeGoldKing(finalData)), saveVersion: SAVE_VERSION };
       const jsonStr = JSON.stringify(saveData);
       // 写入重试：最多 3 次，每次走 safeWriteWithChecksum（带完整性校验 + scopedStorage + 原生 localStorage 双写）
       let saved = false;
       for (let attempt = 0; attempt < 3 && !saved; attempt++) {
         const ok = safeWriteWithChecksum(SAVE_KEY, jsonStr);
         if (ok) {
           // 回读校验：从 safeReadWithChecksum 多路径读回并验证 checksum
           const verify = safeReadWithChecksum(SAVE_KEY);
           if (verify && verify.length > 100 && verify === jsonStr) {
             saved = true;
             setHasSave(true);
           }
         }
       }
       if (!saved) {
         logger.error('saveGame all 3 attempts failed, save lost!');
         // 🔴 终极兜底：写入全部失败时，尝试从最近一次 pending 内容恢复到备份
         try {
           const existing = safeReadWithChecksum(BACKUP_SAVE_KEY);
           if (!existing || existing.length < 100) {
             safeWriteWithChecksum(BACKUP_SAVE_KEY, jsonStr);
           }
         } catch {
           /* ignore */
         }
         // 再兜底：直接写原生 localStorage 终极备份（不带前缀，key 不同）
         try {
           localStorage.setItem(NATIVE_BACKUP_KEY, jsonStr);
           // 标记时间戳，便于排查
           localStorage.setItem(NATIVE_BACKUP_KEY + '_time', String(Date.now()));
         } catch (nativeErr) {
           logger.error('native backup save failed:', String(nativeErr));
         }
       } else {
         // ✅ 主存档写入成功，同步更新备份（双保险，防止下次写入失败时回退）
         try {
           safeWriteWithChecksum(BACKUP_SAVE_KEY, jsonStr);
         } catch (backupErr) {
           logger.error('backup save failed:', String(backupErr));
         }
         // 额外：写一份到原生 localStorage 终极兜底（每 30 秒更新一次，降低 IO 的同时保证时效性）
         try {
           const lastNative = Number(localStorage.getItem(NATIVE_BACKUP_KEY + '_time') || '0');
           if (!lastNative || Date.now() - lastNative > 30000) {
             localStorage.setItem(NATIVE_BACKUP_KEY, jsonStr);
             localStorage.setItem(NATIVE_BACKUP_KEY + '_time', String(Date.now()));
           }
         } catch {
           /* ignore */
         }
       }
      pendingSaveRef.current = null;
    }
  }, []);
  const scheduleSave = useCallback((data: IPlayer) => {
    pendingSaveRef.current = data;
    if (saveTimerRef.current) return;
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      flushSave();
    }, 200);
  }, [flushSave]);

  // 卸载时强制刷入存档，避免数据丢失
  useEffect(() => {
    return () => {
      flushSave();
    };
  }, [flushSave]);

  // 页面隐藏/关闭时立即存档（三重兜底：visibilitychange + pagehide + beforeunload）
  // - visibilitychange: 切后台/切标签页时触发（移动端最可靠）
  // - pagehide: 浏览器关闭标签页/后退前进缓存时触发（iOS Safari 最可靠）
  // - beforeunload: 桌面端关闭窗口时触发（兜底）
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushSave();
    };
    const onPageHide = () => flushSave();
    const onBeforeUnload = () => flushSave();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [flushSave]);

  // 30秒定时自动存档（即使玩家操作不多也定时持久化，防止异常闪退丢失进度）
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!isResettingRef.current) {
        flushSave();
      }
    }, 30000);
    return () => window.clearInterval(timer);
  }, [flushSave]);

  // 初始化：检查存档，版本不匹配则清除旧存档
  useEffect(() => {
    let raw: string | null = null;
    raw = safeReadWithChecksum(SAVE_KEY);
    // 主存档校验失败/不存在 → 尝试从备份恢复 hasSave 状态
    if (!raw) {
      raw = safeReadWithChecksum(BACKUP_SAVE_KEY);
      if (raw) {
        logger.warn('init: main save missing, hasSave based on backup');
      }
    }
    if (!raw) {
      try {
        const nativeRaw = localStorage.getItem(NATIVE_BACKUP_KEY);
        if (nativeRaw && nativeRaw.length > 100) {
          raw = nativeRaw;
          logger.warn('init: recovered hasSave from native backup');
        }
      } catch { /* ignore */ }
    }
    if (raw) {
      try {
        const data = JSON.parse(raw);
        // 旧版本存档也认为有存档，进入游戏后自动升级魂技名称
        if (data && typeof data === 'object' && data.name && data.martialSoul) {
          setHasSave(true);
        } else {
          setHasSave(false);
        }
      } catch {
        // 解析失败不清除（可能是 checksum 封装格式差异），交由 loadSave 正式处理时走兜底链
        setHasSave(false);
      }
    } else {
      setHasSave(false);
    }
    // 恢复探索状态：防止意外退出后魂环魂骨丢失
    try {
      const expRaw = scopedStorage.getItem(EXPLORE_SAVE_KEY);
      if (expRaw) {
        const expData = JSON.parse(expRaw);
        if (expData && typeof expData === 'object' && Array.isArray(expData.nodes)) {
          // 防御性校验：关键字段存在才恢复
          if (typeof expData.locationId === 'string' && Array.isArray(expData.collectedItems) && Array.isArray(expData.collectedRings)) {
            setExplorationState(expData as IExplorationState);
          } else {
            scopedStorage.removeItem(EXPLORE_SAVE_KEY);
          }
        } else {
          scopedStorage.removeItem(EXPLORE_SAVE_KEY);
        }
      }
    } catch {
      try { scopedStorage.removeItem(EXPLORE_SAVE_KEY); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const saveGame = () => {
    if (player) {
      // 直接 flush，强制写入
      pendingSaveRef.current = player;
      flushSave();
    }
  };

  const loadSave = () => {
    let raw = safeReadWithChecksum(SAVE_KEY);
    // 🔴 存档丢失/损坏自动回退机制（5 层兜底）
    // 1. scopedStorage 主存档（带checksum校验）→ 2. scopedStorage 备份 → 3. 原生 localStorage 主存档 → 4. 原生 localStorage 终极备份(NATIVE_BACKUP_KEY) → 5. 扫描所有带后缀的 key
    let loadFromBackup = false;
    let recoverySource = 'main';
    
    // 第2层：scopedStorage 备份（带checksum校验）
    if (!raw || raw.length < 100) {
      const backupRaw = safeReadWithChecksum(BACKUP_SAVE_KEY);
      if (backupRaw && backupRaw.length > 100) {
        logger.warn('main save missing/corrupted, loading from scoped backup');
        raw = backupRaw;
        loadFromBackup = true;
        recoverySource = 'scoped-backup';
      }
    }
    // 第3层：原生 localStorage 主存档（不带 appId 前缀，应对 appId 变化场景）
    if (!raw || raw.length < 100) {
      try {
        const nativeRaw = localStorage.getItem(SAVE_KEY);
        if (nativeRaw && nativeRaw.length > 100) {
          // 尝试 checksum 校验，失败时直接用原始内容兜底（宁可用旧数据也不要清档）
          const checksumMarker = '\n__checksum:';
          const idx = nativeRaw.lastIndexOf(checksumMarker);
          const content = idx !== -1 ? nativeRaw.slice(0, idx) : nativeRaw;
          if (content && content.length > 100) {
            logger.warn('scoped saves missing, recovered from native localStorage main save');
            raw = content;
            loadFromBackup = true;
            recoverySource = 'native-main';
          }
        }
      } catch { /* ignore */ }
    }
    // 第4层：原生 localStorage 终极备份（NATIVE_BACKUP_KEY，应对 appId 变化 + key 重命名场景）
    if (!raw || raw.length < 100) {
      try {
        const nativeRaw = localStorage.getItem(NATIVE_BACKUP_KEY);
        if (nativeRaw && nativeRaw.length > 100) {
          logger.warn('scoped saves missing, recovered from native localStorage ultimate backup');
          raw = nativeRaw;
          loadFromBackup = true;
          recoverySource = 'native-backup';
        }
      } catch { /* ignore */ }
    }
    // 第5层：扫描 localStorage 所有 key，找形如 *__game_douluo2_save 的历史存档（应对前缀变化）
    if (!raw || raw.length < 100) {
      try {
        const allKeys = Object.keys(localStorage);
        let bestMatch: string | null = null;
        let bestLen = 0;
        for (const k of allKeys) {
          if ((k.includes('douluo2') || k.includes('douluo')) && k.includes('save') && !k.includes('backup')) {
            const v = localStorage.getItem(k);
            if (v && v.length > bestLen) {
              bestLen = v.length;
              bestMatch = v;
            }
          }
        }
        if (bestMatch) {
          logger.warn('recovered from localStorage key scan');
          raw = bestMatch;
          loadFromBackup = true;
          recoverySource = 'local-scan';
        }
      } catch { /* ignore */ }
    }
    if (raw) {
      try {
        let data: any = null;
        let parseFailed = false;
        try {
          data = JSON.parse(raw) as IPlayer & { saveVersion?: number };
        } catch {
          parseFailed = true;
        }
      // 主存档解析失败 → 尝试备份（safeRead 多路径）
      if (parseFailed || !data || typeof data !== 'object' || !data.name || !data.martialSoul) {
        if (!loadFromBackup) {
          const backupRaw = safeRead(BACKUP_SAVE_KEY);
          if (backupRaw && backupRaw.length > 50) {
            try {
              const backupData = JSON.parse(backupRaw);
              if (backupData && typeof backupData === 'object' && backupData.name && backupData.martialSoul) {
                logger.warn('main save corrupted, recovered from backup');
                data = backupData;
                loadFromBackup = true;
                // 恢复后立刻回写主存档（带checksum双写）
                safeWriteWithChecksum(SAVE_KEY, backupRaw);
              }
            } catch {
              /* backup also corrupted */
            }
          }
          // 再尝试原生终极备份
          if (!data || !data.name) {
            try {
              const nativeRaw = localStorage.getItem(NATIVE_BACKUP_KEY);
              if (nativeRaw && nativeRaw.length > 100) {
                const nativeData = JSON.parse(nativeRaw);
                if (nativeData && typeof nativeData === 'object' && nativeData.name && nativeData.martialSoul) {
                  logger.warn('recovered from native backup after parse failure');
                  data = nativeData;
                  loadFromBackup = true;
                  safeWriteWithChecksum(SAVE_KEY, nativeRaw);
                }
              }
            } catch { /* ignore */ }
          }
        }
        // 还是失败 → 清除主存档，保留备份（如果备份存在）
        if (!data || typeof data !== 'object' || !data.name || !data.martialSoul) {
          safeRemove(SAVE_KEY);
          setHasSave(false);
          return false;
        }
      }

      // v5及以下老版本：可能没 soulSkills 字段，兜底补上
        if (!data.martialSoul?.soulSkills || !Array.isArray(data.martialSoul.soulSkills)) {
          // 下面的默认值补全逻辑会处理
        }
        // ===== v7 迁移：普通魂核 → 阴魂核 =====
        // v13.0 删除普通/困难魂核体系，统一为阴阳互补双魂核
        // 旧存档 soulCoreType 为 normal 的迁移为 yin（单魂核），属性加成按阴魂核算
        if (data.soulCoreType === 'normal') {
          if (data.soulCoreStage >= 2) {
            // 99级已完成普通魂核突破 → 视为阴阳双魂核圆满
            data.soulCoreType = 'yin-yang';
            data.soulCoreStage = 3;
          } else if (data.soulCoreStage >= 1 || data.level >= 90) {
            // 89级已突破 / 等级≥90且有普通魂核 → 视为单阴魂核
            data.soulCoreType = 'yin';
            data.soulCoreStage = 1;
          } else {
            data.soulCoreType = 'none';
            data.soulCoreStage = 0;
          }
        }

        // ===== 全字段默认值兜底 =====
        // 确保所有新字段在旧存档中缺失时都有合理默认值，防止 undefined 传播
        if (typeof data.isTwinSoul !== 'boolean') data.isTwinSoul = false;
        if (!data.secondSoul) data.secondSoul = null;
        if (!Array.isArray(data.secondSoulRings)) data.secondSoulRings = [];
        // 🔴 防御性修复：第二武魂魂环数量最多9个，超出的裁切
        if (data.secondSoulRings.length > 9) data.secondSoulRings = data.secondSoulRings.slice(0, 9);
        if (!Array.isArray(data.pendingSoulRings)) data.pendingSoulRings = [];
        // 魂灵系统字段兜底（旧存档缺失时补充默认值，防止 undefined 导致运行时崩溃）
        if (!Array.isArray(data.soulSpirits)) data.soulSpirits = [];
        if (!Array.isArray(data.activeSpiritIds)) data.activeSpiritIds = [];
        if (!Array.isArray(data.pendingSpirits)) data.pendingSpirits = [];
        // 🔴 吞噬茶新字段兜底
        if (!Array.isArray(data.specialSoulSpirits)) data.specialSoulSpirits = [];
        if (!Array.isArray(data.specialActiveSpiritIds)) data.specialActiveSpiritIds = [];
         if (!data.devour || typeof data.devour !== 'object') {
           data.devour = { count: 0, totalAttack: 0, totalDefense: 0, totalSpeed: 0, totalSpirit: 0, totalHp: 0, backlashCount: 0, backlashAttack: 0, backlashDefense: 0, backlashSpeed: 0, backlashSpirit: 0, backlashHp: 0 };
         } else {
           const d = data.devour as any;
           if (typeof d.count !== 'number') d.count = 0;
           if (typeof d.totalAttack !== 'number') d.totalAttack = 0;
           if (typeof d.totalDefense !== 'number') d.totalDefense = 0;
           if (typeof d.totalSpeed !== 'number') d.totalSpeed = 0;
           if (typeof d.totalSpirit !== 'number') d.totalSpirit = 0;
           if (typeof d.totalHp !== 'number') d.totalHp = 0;
           if (typeof d.backlashCount !== 'number') d.backlashCount = 0;
           if (typeof d.backlashAttack !== 'number') d.backlashAttack = 0;
           if (typeof d.backlashDefense !== 'number') d.backlashDefense = 0;
           if (typeof d.backlashSpeed !== 'number') d.backlashSpeed = 0;
           if (typeof d.backlashSpirit !== 'number') d.backlashSpirit = 0;
           if (typeof d.backlashHp !== 'number') d.backlashHp = 0;
         }
        if (!data.teaDefeatCounts || typeof data.teaDefeatCounts !== 'object') data.teaDefeatCounts = {};
        if (typeof data.currentHp !== 'number') data.currentHp = 100;
        if (!Array.isArray(data.soulRings)) data.soulRings = [];
        // 🔴 防御性修复：魂环数量最多9个，超出的裁切（防止旧存档/历史bug导致显示第十魂技）
        if (data.soulRings.length > 9) data.soulRings = data.soulRings.slice(0, 9);
        if (!data.martialSoul) data.martialSoul = { id: 'fallback', name: '未知武魂', quality: 'epic' as const, type: '强攻系', element: '无属性', cultivationAttr: 'strength', baseStats: { attack: 10, defense: 10, speed: 10, spirit: 10, hp: 20 }, description: '未知武魂', soulSkills: ['未知魂技一','未知魂技二','未知魂技三','未知魂技四','未知魂技五','未知魂技六','未知魂技七','未知魂技八','未知魂技九'] };
        if (typeof data.soulPower !== 'number') data.soulPower = 1;
        if (typeof data.level !== 'number') data.level = 1;
        if (typeof data.exp !== 'number') data.exp = 0;
        if (typeof data.soulCoins !== 'number') data.soulCoins = 0;
        if (!data.direction) data.direction = '强攻系';
        if (data.gender !== 'male' && data.gender !== 'female') data.gender = 'male';
        if (!data.title && data.title !== '') data.title = '';
        if (!data.equipment || typeof data.equipment !== 'object') data.equipment = { ...EMPTY_EQUIPMENT };
        if (!data.soulBones || typeof data.soulBones !== 'object') data.soulBones = { ...EMPTY_SOUL_BONES };
        if (!Array.isArray(data.inventory)) data.inventory = [];
        if (!Array.isArray(data.team)) data.team = [];
        if (!Array.isArray(data.recruited)) data.recruited = [];
        // 天梦冰蚕献祭奇遇字段兜底（永久保存，转世不重置）
        if (!data.tianmeng || typeof data.tianmeng !== 'object') {
          data.tianmeng = { triggered: false, accepted: false, evolved: false };
        } else {
          if (typeof data.tianmeng.triggered !== 'boolean') data.tianmeng.triggered = false;
          if (typeof data.tianmeng.accepted !== 'boolean') data.tianmeng.accepted = false;
          if (typeof data.tianmeng.evolved !== 'boolean') data.tianmeng.evolved = false;
        }
        if (!data.trainingCooldowns || typeof data.trainingCooldowns !== 'object') data.trainingCooldowns = {};
        if (typeof data.cultivationEndTime !== 'number' && data.cultivationEndTime !== null) data.cultivationEndTime = null;
        if (typeof data.cultivationFromLevel !== 'number' && data.cultivationFromLevel !== null) data.cultivationFromLevel = null;
        if (!data.domain && data.domain !== null) data.domain = null;
        if (!data.secondDomain && data.secondDomain !== null) data.secondDomain = null;
        if (typeof data.purchasedShopItems === 'undefined') data.purchasedShopItems = [];
        if (typeof data.shopLastRefreshAt !== 'number') data.shopLastRefreshAt = Date.now();
        // 兼容旧存档：没有体力字段则补默认值
        if (typeof data.stamina !== 'number') {
          data.stamina = getStaminaMax(data.level);
          data.staminaUpdatedAt = Date.now();
        }
        // 兼容旧存档：学院系统字段缺失时补默认值
        if (!data.academyRank) data.academyRank = 'none';
        if (typeof data.examCooldownUntil !== 'number') data.examCooldownUntil = 0;
        if (!data.arenaRank) data.arenaRank = 'bronze';
        if (typeof data.arenaStars !== 'number') data.arenaStars = 0;
        if (!data.freshTaskProgress) data.freshTaskProgress = {};
        if (!data.freshTaskCooldowns) data.freshTaskCooldowns = {};
        // 冰火两仪眼探索冷却
        if (!data.iceFireCooldowns || typeof data.iceFireCooldowns !== 'object') data.iceFireCooldowns = {};
        Object.keys(data.iceFireCooldowns).forEach((k) => {
          const v = data.iceFireCooldowns[k];
          if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > Date.now() + 60 * 60 * 1000) {
            data.iceFireCooldowns[k] = 0;
          }
        });
        // 新生任务冷却时间戳修复：异常值（非数字 / 负数 / 超过当前时间+1小时的异常大值）重置为 0，避免显示错乱
        Object.keys(data.freshTaskCooldowns).forEach((k) => {
          const v = data.freshTaskCooldowns[k];
          if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > Date.now() + 60 * 60 * 1000) {
            data.freshTaskCooldowns[k] = 0;
          }
        });
        // 导师指导冷却时间戳同样校验
        if (!data.mentorCooldowns || typeof data.mentorCooldowns !== 'object') data.mentorCooldowns = {};
        Object.keys(data.mentorCooldowns).forEach((k) => {
          const v = data.mentorCooldowns[k];
          if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > Date.now() + 24 * 60 * 60 * 1000) {
            data.mentorCooldowns[k] = 0;
          }
        });
        // 考核冷却时间戳校验
        if (typeof data.examCooldownUntil !== 'number' || !Number.isFinite(data.examCooldownUntil) || data.examCooldownUntil < 0) {
          data.examCooldownUntil = 0;
        }
        // 兼容旧存档：彩蛋境界字段缺失时补默认值（99级之上的境界系统）
        if (typeof data.easterRealmStage !== 'number') data.easterRealmStage = 0;
        // 兼容旧存档：神考系统字段缺失时补默认值
        if (!data.divineTrial || typeof data.divineTrial !== 'object') {
          data.divineTrial = {
             stage: 'none',
            drawnTrials: [],
            drawIndex: 0,
            chosenTrialId: null,
            affinityPct: 0,
            currentExamIndex: 0,
            completedExams: [],
            failedExams: [],
            firstExamTaken: false,
            firstExamDiTianDefeated: false,
       avatarAttempts: 0,
       avatarDefeated: false,
       beastDefeated: false,
       artifactDrawn: false,
            artifactLevel: 1,
            divinePowerPct: 0,
            inherited: false,
             inheritedLevel: 99,
             divineSoulRing: null,
             pendingLevelBonus: 0,
           };
         } else {
           // 字段补齐
           const d = data.divineTrial;
           if (!d.stage) d.stage = 'none';
           if (!Array.isArray(d.drawnTrials)) d.drawnTrials = [];
           if (typeof d.drawIndex !== 'number') d.drawIndex = 0;
           if (!d.chosenTrialId) d.chosenTrialId = null;
           if (typeof d.affinityPct !== 'number') d.affinityPct = 0;
           if (typeof d.currentExamIndex !== 'number') d.currentExamIndex = 0;
           if (!Array.isArray(d.completedExams)) d.completedExams = [];
           if (!Array.isArray(d.failedExams)) d.failedExams = [];
           if (typeof d.firstExamTaken !== 'boolean') d.firstExamTaken = false;
           if (typeof d.firstExamDiTianDefeated !== 'boolean') d.firstExamDiTianDefeated = false;
           if (typeof d.avatarAttempts !== 'number') d.avatarAttempts = 0;
            if (typeof d.avatarDefeated !== 'boolean') d.avatarDefeated = false;
            if (typeof d.beastDefeated !== 'boolean') d.beastDefeated = false;
            if (typeof d.artifactDrawn !== 'boolean') d.artifactDrawn = false;
           if (typeof d.artifactLevel !== 'number') d.artifactLevel = 1;
           if (typeof d.divinePowerPct !== 'number') d.divinePowerPct = 0;
           if (typeof d.inherited !== 'boolean') d.inherited = false;
           if (typeof d.inheritedLevel !== 'number') d.inheritedLevel = 99;
            if (d.divineSoulRing === undefined) d.divineSoulRing = null;
            // 旧存档迁移：神环补 beastAttribute 字段（默认光属性）
            if (d.divineSoulRing && typeof d.divineSoulRing === 'object' && !('beastAttribute' in d.divineSoulRing)) {
              d.divineSoulRing.beastAttribute = '光属性';
            }
            if (typeof d.pendingLevelBonus !== 'number') d.pendingLevelBonus = 0;
            if (d.activeArtifactId === undefined) d.activeArtifactId = null;
             if (!Array.isArray(d.supremeArtifacts)) d.supremeArtifacts = [];
             // 🔴 v22.0 百级神级修炼 + 法则碎片系统迁移
             if (!d.godLevelProgress || typeof d.godLevelProgress !== 'object') {
               d.godLevelProgress = { unlocked: false, currentTier: 'second', levelCap: 99 };
             } else {
               const g = d.godLevelProgress;
               if (typeof g.unlocked !== 'boolean') g.unlocked = false;
               if (!['second', 'first', 'king', 'supreme'].includes(g.currentTier)) g.currentTier = 'second';
               if (typeof g.levelCap !== 'number') g.levelCap = 99;
             }
             if (!d.lawFragments || typeof d.lawFragments !== 'object') {
               d.lawFragments = { time: 0, space: 0, gold: 0, wood: 0, water: 0, fire: 0, earth: 0, light: 0, dark: 0, chaos: 0 };
             } else {
               const lf = d.lawFragments;
               const keys = ['time', 'space', 'gold', 'wood', 'water', 'fire', 'earth', 'light', 'dark', 'chaos'] as const;
               for (const k of keys) { if (typeof lf[k] !== 'number') lf[k] = 0; }
             }
             if (!d.lawsFused || typeof d.lawsFused !== 'object') {
               d.lawsFused = { time: false, space: false, gold: false, wood: false, water: false, fire: false, earth: false, light: false, dark: false, chaos: false };
             } else {
               const lf = d.lawsFused;
               const keys = ['time', 'space', 'gold', 'wood', 'water', 'fire', 'earth', 'light', 'dark', 'chaos'] as const;
               for (const k of keys) { if (typeof lf[k] !== 'boolean') lf[k] = false; }
             }
             if (!Array.isArray(d.lawsConsumedForBreakthrough)) d.lawsConsumedForBreakthrough = [];
             if (typeof d.pendingLawFragmentChoices !== 'number') d.pendingLawFragmentChoices = 0;

            // 旧存档修复：已继承神位但亲和度不足100% → 自动补满
            if (d.inherited && typeof d.affinityPct === 'number' && d.affinityPct < 100) {
              d.affinityPct = 100;
            }

            // 🔴 已移除：自动标记第一考完成的逻辑
            // 原逻辑（firstExamTaken && firstExamDiTianDefeated → 自动加入completedExams）会导致：
            // 玩家击败帝天后尚未手动领取奖励，退出重进后系统自动将第一考标记为已完成，
            // 但没有发放奖励（亲和度/神力/等级/魂环年限等），玩家损失严重。
            // 正确流程：击败帝天只是满足考核条件，玩家必须手动点「领取奖励」按钮
            // 调用 completeExam() 才会写入 completedExams 并发放奖励。
            // 旧存档中确实存在的「击败帝天但未写入completedExams」历史遗留问题，
            // 由玩家手动点领取按钮即可正常完成，不需要在loadSave时自动修复。

            // 旧存档修复：已选定神考但 currentExamIndex=0 且 firstExamTaken=false 且 completedExams 为空
            // → 不是 bug，正常状态，玩家需要手动接取第一考。无需迁移。

            // 神考顺序迁移 v2：神器考调整为倒数第三考、99级突破为倒数第二考、神位继承为最后一考
            // 仅当旧 completedExams 的最大序号超过 trial.totalExams（明显是旧结构数据）时才迁移
            // 正常新结构存档不需要迁移，避免误伤
            const trial = d.chosenTrialId ? DIVINE_TRIALS.find((t) => t.id === d.chosenTrialId) : undefined;
            const maxCompleted = d.completedExams.length > 0 ? Math.max(...d.completedExams) : 0;
            const needsMigration = !!trial && (
              maxCompleted > trial.totalExams ||
              (d.completedExams.includes(1) && trial.exams[0]?.type === 'absorbRing' && d.firstExamDiTianDefeated && !d.firstExamTaken)
            );
            if (d.chosenTrialId && d.completedExams.length > 0 && needsMigration && trial && trial.exams.length > 0) {
                // 收集旧已完成的考核类型（用 Map 按 type 计数，区分多份同类型考核）
                const oldCompletedTypes = new Map<string, number>();
                const oldExamMap = new Map<number, string>(); // index -> type
                // 注意：旧顺序与新顺序不同，但 trial.exams 已是新顺序
                // 我们不能直接从 trial.exams 反推旧类型，需要基于当前完成状态推断
                // 简化策略：用 trial.exams 里第 N 个对应的 type 作为旧第 N 考的 type（近似成立）
                // 更稳妥：直接按「状态标志」迁移 — 击败帝天/化身/魂兽/拔出神器 等标志位优先
                const newCompleted: number[] = [];
                // 按类型 + 标志位映射到新考核
                for (const exam of trial.exams) {
                  let done = false;
                  switch (exam.type) {
                    case 'absorbRing':
                      // 第一考：击败帝天 或 80级以上 或 旧completedExams包含1且不是因reachLevel
                      done = d.firstExamDiTianDefeated || d.completedExams.includes(1);
                      break;
                    case 'reachLevel':
                      // 等级达标考：玩家当前等级达标就算完成过
                      done = data.level >= (exam.targetLevel ?? 70);
                      // 如果玩家等级没到但旧completed里有，说明是旧数据的其他reachLevel考 — 保持false让玩家重接
                      break;
                    case 'defeatAvatar':
                      done = d.avatarDefeated;
                      break;
                    case 'defeatBeast':
                      done = d.beastDefeated;
                      break;
                    case 'drawArtifact':
                      done = d.artifactDrawn;
                      break;
                    case 'arenaWinStreak':
                    case 'attributeReach':
                      // 这两类是接取即完成，如果旧completedExams数量大于等于该考序号，视为已完成
                      // 用完成数量估算：按顺序排，前面唯一型（absorb/reach/defeat*/draw）的数量 + attribute/arena 的数量
                      done = d.completedExams.filter((i) => i >= exam.index).length > 0
                        ? d.completedExams.includes(exam.index)
                        : false;
                      break;
                    default:
                      break;
                  }
                  if (done) newCompleted.push(exam.index);
                }
                // 另外，如果玩家已继承神位，自动把所有考都标完成，并强制亲和度满
                 if (d.inherited) {
                   d.completedExams = trial.exams.map((e) => e.index);
                   d.currentExamIndex = trial.totalExams;
                   d.affinityPct = 100; // 已继承神位，亲和度必须100%
                 } else if (newCompleted.length > 0) {
                  d.completedExams = newCompleted;
                  // currentExamIndex 取最大已完成index
                  d.currentExamIndex = Math.max(...newCompleted, d.currentExamIndex);
                }
            }

             // 通用修复：清理 completedExams / failedExams 中不存在于当前考核列表的索引
             // （防止因考核结构调整导致旧存档残留无效索引）
             const curTrial = d.chosenTrialId ? DIVINE_TRIALS.find((t) => t.id === d.chosenTrialId) : undefined;
             if (curTrial) {
               const validIndices = new Set(curTrial.exams.map((e) => e.index));
               if (d.completedExams.some((idx) => !validIndices.has(idx))) {
                 d.completedExams = d.completedExams.filter((idx) => validIndices.has(idx));
               }
               if (d.failedExams.some((idx) => !validIndices.has(idx))) {
                 d.failedExams = d.failedExams.filter((idx) => validIndices.has(idx));
               }
                // currentExamIndex 不应超过 totalExams
                if (d.currentExamIndex > curTrial.totalExams) {
                  d.currentExamIndex = curTrial.totalExams;
                }
                // 最终兜底：所有考核都完成 → 亲和度必须100%（防止各迁移路径遗漏）
                const allExamsDone = curTrial.exams.every((e) => d.completedExams.includes(e.index));
                if (allExamsDone && typeof d.affinityPct === 'number' && d.affinityPct < 100) {
                  d.affinityPct = 100;
                }
                // 最终兜底：已继承神位 → 亲和度必须100%
                if (d.inherited && typeof d.affinityPct === 'number' && d.affinityPct < 100) {
                  d.affinityPct = 100;
                }
              }

              // 🔴 v15.0 神器等级上限调整：至高神器200 / 超神器150 / 神器100
              // 旧存档中超过新上限的神器等级自动截断到上限，避免数值溢出
              if (d.artifactDrawn && typeof d.artifactLevel === 'number' && d.chosenTrialId) {
                const art = getArtifactByDeity(d.chosenTrialId);
                if (art && d.artifactLevel > art.maxLevel) {
                  d.artifactLevel = art.maxLevel;
                }
                // 安全下限：等级至少为1
                if (d.artifactLevel < 1) d.artifactLevel = 1;
              }
           }
           // 转世轮回系统字段兜底
         if (!data.reincarnation || typeof data.reincarnation !== 'object') {
           data.reincarnation = {
              count: 0,
              totalAttackBonus: 0,
              totalRingYearBonus: 0,
              ringYearBonusPct: 0,
              orbs: [],
            };
           } else {
             const r = data.reincarnation;
             if (typeof r.count !== 'number') r.count = 0;
             if (typeof r.totalAttackBonus !== 'number') r.totalAttackBonus = 0;
              if (typeof r.totalRingYearBonus !== 'number') r.totalRingYearBonus = 0;
              if (typeof r.ringYearBonusPct !== 'number') {
                // 旧存档兼容：按转世次数 × 50% 自动推算（每世 +50%，可叠加）
                r.ringYearBonusPct = r.count * 0.5;
              }
              if (!Array.isArray(r.orbs)) r.orbs = [];
             // v202609：魂环年限加成从每世400年提升为每世1000年
             // 旧存档按 count*400 产生的值统一重算为 count*1000
             if (r.count > 0 && r.totalRingYearBonus > 0 && r.totalRingYearBonus === r.count * 400) {
               r.totalRingYearBonus = r.count * 1000;
             }
             // 防御性修复：每世应获得 +10 攻击加成、+1000 魂环年限
             // 如果 count 与 total 不匹配（中途失败/老bug导致少发或多发），自动按 count 重算
             // 保证每次转世的加成都是确定的、不会丢
             const expectedAttack = r.count * 10;
             const expectedRing = r.count * 1000;
             if (r.count > 0 && r.totalAttackBonus !== expectedAttack) {
               r.totalAttackBonus = expectedAttack;
             }
              if (r.count > 0 && r.totalRingYearBonus !== expectedRing) {
                // 只在差值明显时重算（避免误伤自定义数值的存档）
                // 判定：当前值与期望值差距 > count*50（误差范围），且不是旧400年标准（上面已处理）
                const diff = Math.abs(r.totalRingYearBonus - expectedRing);
                if (diff > r.count * 50 && r.totalRingYearBonus !== r.count * 400) {
                  r.totalRingYearBonus = expectedRing;
                }
              }
              // 🔴 修复：转世 orb 的 level 兜底——只有99级才能转世，所以每世的最终等级至少是99
              // 旧版本bug或存档迁移可能导致 orb.level 变成初始等级（10级），统一修复为99
              for (const orb of r.orbs) {
                if (typeof orb.level !== 'number' || orb.level < 99) {
                  orb.level = 99;
                  // 同步修正境界
                  orb.realm = getRealm(99);
                }
              }
            }
         // 兼容旧存档：武魂名去掉「极X·」前缀（旧存档使用带前缀名字，统一迁移为简洁名）
        const nameRenameMap: Record<string, string> = {
          '极冰·冰天雪女': '冰天雪女',
          '极冰·冰碧帝皇蝎': '冰碧帝皇蝎',
          '极暗·黑暗圣龙': '黑暗圣龙',
          '极火·饕餮神牛': '饕餮神牛',
          '极水·青龙': '青龙',
          '极水·玄武': '玄武',
          '极火·十首火凤凰': '十首火凤凰',
          '极暗·金眼黑龙': '金眼黑龙',
          '极木·生命之树': '生命之树',
          '极刃·破魔刀': '破魔刀',
          '极暗·红尘魔龙': '红尘魔龙',
          '极火·浴火凤凰': '浴火凤凰',
          '极冰·冰神': '冰神',
          '极水·苍海棍': '苍海棍',
          '极风·疾风枪': '疾风枪',
          '极水·沧澜剑': '沧澜剑',
          '极土·卡冥狮': '卡冥狮',
          '极火·黄金龙': '黄金龙',
          '极暗·冥王黑龙': '冥王黑龙',
          '极光·天罡无极剑': '天罡无极剑',
          '极暗·日冕圣龙': '日冕圣龙',
          '极水·蓝冰莲花': '蓝冰莲花',
          '极火·烈阳弓': '烈阳弓',
          '极雷·紫霄神雷': '紫霄神雷',
          '极火·虚无吞炎': '虚无吞炎',
          '极火·青莲地心火': '青莲地心火',
        };
        if (data.martialSoul?.name && nameRenameMap[data.martialSoul.name]) data.martialSoul.name = nameRenameMap[data.martialSoul.name];
        if (data.secondSoul?.name && nameRenameMap[data.secondSoul.name]) data.secondSoul.name = nameRenameMap[data.secondSoul.name];
        data.nianBonus = readNianBonus(data.nianBonus);
        data.sweepAutoDestroyRingYears = normalizeSweepYears(data.sweepAutoDestroyRingYears);
        data.sweepAutoSellBoneYears = normalizeSweepYears(data.sweepAutoSellBoneYears);
        data = reconcileGodUnlock(data);
        data.silverBloodline=readSilverBlood(data.silverBloodline);data.dragonLegend=dragonProgress(data);data.abyssFrontier=abyssProgress(data);data.dragonBloodline=bloodlineProgress(data);data.dragonValley=valleyProgress(data);
        for(const soul of [data.martialSoul,data.secondSoul]) {if(soul?.name==='吞噬茶')soul.name='混沌无极';}
        if(data.reincarnation?.orbs)for(const orb of data.reincarnation.orbs)for(const soul of [orb.martialSoul,orb.secondSoul])if(soul?.name==='吞噬茶')soul.name='混沌无极';
        if(data.firstRingYearBonusGiven||data.companions?.details?.['tc-yinyangcha']?.firstRingYearBonusGiven)data.liangyiFirstBonusGiven=true;
        if(data.divineTrial?.godLevelProgress?.unlocked)data.divineTrial.pendingLawFragmentChoices=localPendingLawChoices(data.level,data.divineTrial);
        // 剑仙之剑 → 天诛剑 迁移
        const divineSwordRename: Record<string, string> = { '剑仙之剑': '天诛剑' };
        if (data.martialSoul?.name && divineSwordRename[data.martialSoul.name]) data.martialSoul.name = divineSwordRename[data.martialSoul.name];
        if (data.secondSoul?.name && divineSwordRename[data.secondSoul.name]) data.secondSoul.name = divineSwordRename[data.secondSoul.name];
        // 兼容旧存档：鸿蒙金乌品质从超神级调整为神级
        if (data.martialSoul?.name === '鸿蒙金乌' && data.martialSoul.quality === 'superDivine') {
          data.martialSoul.quality = 'divine';
        }
        if (data.secondSoul?.name === '鸿蒙金乌' && data.secondSoul.quality === 'superDivine') {
          data.secondSoul.quality = 'divine';
        }
        // 兼容旧存档：光明女神蝶品质从神级降为传说级
        if (data.martialSoul?.name === '光明女神蝶' && data.martialSoul.quality === 'divine') {
          data.martialSoul.quality = 'legendary';
        }
        if (data.secondSoul?.name === '光明女神蝶' && data.secondSoul.quality === 'divine') {
          data.secondSoul.quality = 'legendary';
        }
        // 兼容旧存档：封号字段缺失补空
        if (typeof data.title !== 'string') data.title = '';
        // 兼容旧存档：永久称号列表缺失补空
        if (!Array.isArray(data.permanentTitles)) data.permanentTitles = [];
        // 装备系统重做迁移：旧装备槽→4魂导器槽。旧装备转化为魂币补偿，清除所有装备槽旧装备
        const oldEquip = data.equipment as any;
        if (oldEquip && typeof oldEquip === 'object' && ('helmet' in oldEquip || 'chest' in oldEquip || 'weapon' in oldEquip || 'soulGuide' in oldEquip)) {
          let coinBonus = 0;
          const oldSlots: (keyof typeof oldEquip)[] = ['helmet','chest','pants','shoes','weapon','necklace','bracelet','soulGuide'];
          for (const s of oldSlots) {
            if (oldEquip[s]) coinBonus += Math.max(100, oldEquip[s].sellPrice || 200);
          }
          (data.equipment as any) = { melee: null, support: null, defense: null, ranged: null, flying: null };
          data.soulCoins = (data.soulCoins || 0) + coinBonus;
        }
        // 清除背包中的恢复香肠和旧装备类型（equipment 类型物品）
        if (Array.isArray(data.inventory)) {
          let coinBonus2 = 0;
          data.inventory = data.inventory.filter((item: any) => {
            if (item.name && item.name.includes('恢复香肠')) return false;
            if (item.type === 'equipment') {
              coinBonus2 += Math.max(50, item.sellPrice || 100);
              return false;
            }
            return true;
          });
          if (coinBonus2 > 0) data.soulCoins = (data.soulCoins || 0) + coinBonus2;
        }
        // 背包材料/消耗品堆叠合并：同名+同品质物品合并为堆叠（材料需区分品质）
        if (Array.isArray(data.inventory)) {
          const keyMap = new Map<string, { item: any; count: number }>();
          const uniqueItems: any[] = [];
           for (const item of data.inventory) {
             const stackable = item.type === 'material' || item.type === 'consumable' || item.type === 'special';
             if (!stackable) {
               uniqueItems.push(item);
               continue;
             }
             // 材料：按 type|name|materialQuality 作为 key（不同品质不能堆叠）
             // 消耗品/特殊物品：按 type|name 作为 key
             let stackKey = `${item.type}|${item.name}`;
             if (item.type === 'material') {
               stackKey += `|${item.materialQuality || 'common'}`;
             }
            const existing = keyMap.get(stackKey);
            if (existing) {
              existing.count += item.quantity ?? 1;
            } else {
              keyMap.set(stackKey, { item, count: item.quantity ?? 1 });
            }
          }
          // 把堆叠的合并回去
          for (const { item, count } of keyMap.values()) {
            uniqueItems.push({ ...item, quantity: count });
          }
          data.inventory = uniqueItems;
        }
         // 商店字段迁移
         if (!Array.isArray(data.purchasedShopItems)) data.purchasedShopItems = [];
         if (typeof data.shopLastRefreshAt !== 'number') data.shopLastRefreshAt = Date.now();
          // 魂导器数值化迁移：旧存档商店魂导器从百分比转换为数值加成
          const convertSoulGuideToNum = (item: any) => {
            if (!item || item.type !== 'soulGuide' || !item.attributes) return item;
            // 自制魂导器：统一百分比数值格式迁移
            if (item.craftable) {
              const attrs = item.attributes || {};
              // 判断是否是旧格式：attack/defense/speed/spirit/hp 都 < 1（小数表示百分比，如 0.15 表示 15%）
              const isOldFormat = ['attack', 'defense', 'speed', 'spirit', 'hp'].some(k =>
                typeof attrs[k] === 'number' && attrs[k] > 0 && attrs[k] < 1
              );
              if (isOldFormat) {
                const newAttrs: any = { ...attrs };
                ['attack', 'defense', 'speed', 'spirit', 'hp'].forEach(k => {
                  if (typeof newAttrs[k] === 'number' && newAttrs[k] > 0) {
                    newAttrs[k] = Number((newAttrs[k] * 100).toFixed(1));
                  }
                });
                // critRate/critDmg/allAttr 旧版是乘了100的百分比值，已是百分比数值格式，不用动
                // soulPower 已是数值，不用动
                return { ...item, attributes: newAttrs };
              }
              return item;
            }
            // 商店魂导器：数值化迁移
            const attrs = item.attributes;
           // 新版：所有属性都 >=1（数值），无需迁移
           const isNew = ['attack', 'defense', 'speed', 'spirit', 'hp'].every(k => 
             attrs[k] == null || attrs[k] >= 1 || attrs[k] === 0
           );
           if (isNew && typeof attrs.attack === 'number' && attrs.attack >= 1) return item;
           // 旧版百分比转数值：按等级折算（一级基础值20~60，二级60~150，三级150~350）
           const grade = item.soulGuideGrade || 'tier1';
           const type = item.soulGuideType || 'melee';
           const baseVal = grade === 'tier1' ? 30 : grade === 'tier2' ? 90 : 220;
           const mainMul = 1.5;
           const hpMul = 2;
           const newAttrs: any = {
             attack: Math.round(baseVal * (type === 'melee' || type === 'ranged' ? mainMul : 1)),
             defense: Math.round(baseVal * (type === 'defense' ? mainMul : 1)),
             speed: Math.round(baseVal * (type === 'ranged' ? mainMul : 1) * 0.8),
             spirit: Math.round(baseVal * (type === 'support' ? mainMul : 1) * 0.8),
             hp: Math.round(baseVal * (type === 'defense' || type === 'support' ? mainMul : 1) * hpMul),
           };
           // 暴击/爆伤迁移（从百分比转为小数百分比值，UI展示时再/100）
           if (attrs.critRate) newAttrs.critRate = attrs.critRate * 100;
           if (attrs.critDmg) newAttrs.critDmg = attrs.critDmg * 100;
           if (attrs.allAttr) newAttrs.allAttr = attrs.allAttr * 100;
           if (attrs.soulPower) newAttrs.soulPower = Math.round(baseVal * 0.5);
           return { ...item, attributes: newAttrs };
         };
          // 装备栏迁移
          if (data.equipment) {
            const eq = data.equipment as any;
            if (!eq.flying) eq.flying = null;
            (['melee', 'defense', 'ranged', 'support', 'flying'] as const).forEach((slot) => {
              if (eq[slot]) eq[slot] = convertSoulGuideToNum(eq[slot]);
            });
          }
         // 背包魂导器迁移
         if (Array.isArray(data.inventory)) {
           data.inventory = data.inventory.map((item: any) => convertSoulGuideToNum(item));
         }
         // 已购商店魂导器迁移
         if (Array.isArray(data.purchasedShopItems)) {
           data.purchasedShopItems = data.purchasedShopItems.map((item: any) => convertSoulGuideToNum(item));
         }
         // 旧存档兼容修复：已经20级以上并通过新生考核但学院身份还是 freshman 的，自动晋升外院
         // （检查是否有过外院战斗胜利记录或等级足够且考核冷却为0等间接证据）
         if (data.level >= 20 && data.academyRank === 'freshman') {
           // 简单修复：等级>=20 + freshman 身份且 examCooldownUntil 很大（说明考核失败过）也保留 freshman；
           // 但如果等级远超20级且还在freshman，大概率是卡bug了，自动晋升
           if (data.level >= 30) {
             data.academyRank = 'outer';
           }
         }

            // 魂环数值化迁移：旧存档（百分比）按年限重新计算数值属性
             // 同时统一计算 skillDamagePct（魂技伤害百分比）
             if (Array.isArray(data.soulRings)) {
               const playerEl = data.martialSoul?.element || getSoulElement(data.martialSoul?.name || '');
               data.soulRings = data.soulRings.map((ring: any, idx: number) => {
                 const years = ring.years || 100;
                 // 🔴 天梦冰蚕专属蓝白色魂环：跳过年限→颜色重算，保持纯蓝色（不能被百万年金魂环逻辑覆盖）
                 if (ring.color === 'blueWhite') {
                   const beastType: 'qiang' | 'min' | 'kong' | 'fu' | 'fang' = ring.beastType || inferBeastTypeFromRing(ring);
                   const sdp = ring.skillDamagePct && ring.skillDamagePct > 0 ? ring.skillDamagePct : calcSkillDamagePct(years, beastType, idx, 0);
                   return { ...ring, beastType, skillDamagePct: sdp };
                 }
                 const hasOldPct = typeof ring.attackBonus === 'number' && ring.attackBonus > 0 && ring.attackBonus < 1;
                 const hasNewNumeric = typeof ring.skillDamage === 'number';
                // beastAttribute 缺失兜底：按魂兽名推断属性（旧存档可能没有 beastAttribute 字段）
                const beastAttr = ring.beastAttribute || inferElementFromName(ring.soulBeastName || '');
                // 按年限重算颜色和品质标签（兼容百万年金魂环）
                const quality = getRingQualityFromYears(years);
                // 计算魂技伤害百分比
                const beastType: 'qiang' | 'min' | 'kong' | 'fu' | 'fang' = ring.beastType || inferBeastTypeFromRing(ring);
                const affinity = calcElementAffinity(playerEl, beastAttr);
                const sdp = calcSkillDamagePct(years, beastType, idx, affinity);
                if (hasNewNumeric && !hasOldPct) {
                  return {
                    ...ring,
                    color: ring.color === 'gold' && years < 1000000 ? quality.color : quality.color,
                    qualityLabel: quality.label,
                    beastAttribute: !ring.beastAttribute && beastAttr !== '无属性' ? beastAttr : ring.beastAttribute,
                    skillDamagePct: ring.skillDamagePct && ring.skillDamagePct > 0 ? ring.skillDamagePct : sdp,
                  };
                }
               // 根据武魂类型推断兽系别（默认强攻系）- 已在上方计算
                const stats = calcRingStatsByYears(years, beastType);
                return {
                  ...ring,
                  beastType,
                  beastAttribute: beastAttr,
                  color: quality.color,
                  qualityLabel: quality.label,
                  skillType: ring.skillType || 'attack',
                  attackBonus: stats.attackBonus,
                  defenseBonus: stats.defenseBonus,
                  speedBonus: stats.speedBonus,
                  spiritBonus: stats.spiritBonus,
                  hpBonus: stats.hpBonus,
                  critRateBonus: stats.critRateBonus,
                  critDmgBonus: stats.critDmgBonus,
                  soulPowerBonus: stats.soulPowerBonus,
                  skillDamage: stats.skillDamage,
                  skillDamagePct: sdp,
                  // 旧百分比存档保存到 Pct 后缀字段
                  attackBonusPct: hasOldPct ? ring.attackBonus : undefined,
                  defenseBonusPct: hasOldPct ? ring.defenseBonus : undefined,
                  speedBonusPct: hasOldPct ? ring.speedBonus : undefined,
                  spiritBonusPct: hasOldPct ? ring.spiritBonus : undefined,
                  hpBonusPct: hasOldPct ? ring.hpBonus : undefined,
                };
             });
           }
          if (Array.isArray(data.pendingSoulRings)) {
            const playerEl = data.martialSoul?.element || getSoulElement(data.martialSoul?.name || '');
            data.pendingSoulRings = data.pendingSoulRings.map((ring: any, idx: number) => {
              const years = ring.years || 100;
              const beastType: 'qiang' | 'min' | 'kong' | 'fu' | 'fang' = ring.beastType || inferBeastTypeFromRing(ring);
              const beastAttr = ring.beastAttribute || inferElementFromName(ring.soulBeastName || '');
              const affinity = calcElementAffinity(playerEl, beastAttr);
              const sdp = calcSkillDamagePct(years, beastType, idx, affinity);
              const hasNewNumeric = typeof ring.skillDamage === 'number';
              const stats = calcRingStatsByYears(years, beastType);
              return {
                ...ring,
                beastType,
                beastAttribute: beastAttr,
                skillType: ring.skillType || 'attack',
                attackBonus: hasNewNumeric ? ring.attackBonus : stats.attackBonus,
                defenseBonus: hasNewNumeric ? ring.defenseBonus : stats.defenseBonus,
                speedBonus: hasNewNumeric ? ring.speedBonus : stats.speedBonus,
                spiritBonus: hasNewNumeric ? ring.spiritBonus : stats.spiritBonus,
                hpBonus: hasNewNumeric ? ring.hpBonus : stats.hpBonus,
                critRateBonus: hasNewNumeric ? ring.critRateBonus : stats.critRateBonus,
                critDmgBonus: hasNewNumeric ? ring.critDmgBonus : stats.critDmgBonus,
                soulPowerBonus: hasNewNumeric ? ring.soulPowerBonus : stats.soulPowerBonus,
                skillDamage: hasNewNumeric ? ring.skillDamage : stats.skillDamage,
                skillDamagePct: ring.skillDamagePct && ring.skillDamagePct > 0 ? ring.skillDamagePct : sdp,
              };
            });
          }
          // 新字段兜底
          if (typeof data.examPassed !== 'boolean') data.examPassed = data.academyRank === 'outer' || data.academyRank === 'inner' || data.academyRank === 'sea-god';
          // 内院名师指导：旧存档迁移（mentoredTeachers 一次性 → mentorCooldowns 冷却制）
          if (!data.mentorCooldowns || typeof data.mentorCooldowns !== 'object') {
            data.mentorCooldowns = {};
            // 旧存档已指导过的导师直接重置为可用，享受新冷却机制
          }
          // 旧字段 mentoredTeachers 已废弃，读取时忽略即可
          if (!data.soulCoreType) data.soulCoreType = 'none';
          if (typeof data.soulCoreStage !== 'number') data.soulCoreStage = 0;
          if (typeof data.yinCoreStartTime !== 'number' && data.yinCoreStartTime !== null) data.yinCoreStartTime = null;
          if (typeof data.yangCoreStartTime !== 'number' && data.yangCoreStartTime !== null) data.yangCoreStartTime = null;
          // 旧存档迁移：旧版 yin-yang 类型阴阳魂核 → 新版 yin/yang/yin-yang
          // 旧版 stage=0 且 89级 + 阴魂核凝聚中 → 迁移为 yin（若未突破则视为已凝聚直接给单魂核+90级，防止卡关）
          // 旧版 stage=1 且 ≥90级 且 <99级 → 迁移为 yin
          // 旧版 stage=2 且 98级 + 阳魂核凝聚中 → 迁移为 yin（阴魂核已完成）
          // 旧版 stage=3 → 迁移为 yin-yang（双魂核圆满）
          if (data.soulCoreType === 'yin-yang') {
            if (data.soulCoreStage === 3) {
              data.soulCoreType = 'yin-yang'; // 保持双魂核圆满
            } else if (data.soulCoreStage >= 1 && data.level >= 90) {
              // 阴魂核已完成，阳魂核未完成或凝聚中 → 视为单魂核 yin
              data.soulCoreType = 'yin';
              data.soulCoreStage = 1;
            } else if (data.soulCoreStage === 0 && data.level === 89) {
              // 阴魂核凝聚中未完成 → 直接视为已突破到90级，避免卡关
              data.soulCoreType = 'yin';
              data.soulCoreStage = 1;
              data.level = 90;
              data.exp = 0;
            } else {
              data.soulCoreType = 'yin';
              data.soulCoreStage = 1;
            }
          }
            if (!data.demonDefeated) data.demonDefeated = { lvl90: 'none', lvl99: false };
            // 海神阁：旧存档兜底
            if (!Array.isArray(data.seaGodDefeatedIds)) data.seaGodDefeatedIds = [];
            if (typeof data.seaGodPosition !== 'number') data.seaGodPosition = -1;

            // 消耗品系统：旧存档兜底
            if (!data.consumableCounts || typeof data.consumableCounts !== 'object') {
               data.consumableCounts = {};
             } else {
               // 旧存档迁移：修复异常的服用次数（非数字、负数、超过上限的都矫正）
               const cc = data.consumableCounts as Record<string, number>;
                const CAP_MAP: Record<string, number> = {
                  elementGrass: 5,
                  attributeGrass: 5,
                  immortalGrass: 3,
                  waterOfLife: 1,
                  polarIceJade: 3,
                  sacredDragonGrass: 1,
                };
                for (const key of Object.keys(cc)) {
                  const v = cc[key];
                  if (typeof v !== 'number' || isNaN(v) || v < 0) {
                    cc[key] = 0;
                  } else if (CAP_MAP[key] !== undefined && v > CAP_MAP[key]) {
                    // 超过上限的矫正到上限，防止溢出
                    cc[key] = CAP_MAP[key];
                  } else if (key.startsWith('iceFire:') && v > 1) {
                    // 冰火两仪眼仙草每种一世限1株
                    cc[key] = 1;
                  } else if (key.startsWith('holyGrass:') && v > 5) {
                    // 圣灵草每种限5株
                    cc[key] = 5;
                  } else {
                    cc[key] = Math.floor(v); // 保证整数
                  }
                }
             }
            if (!data.consumableBonus || typeof data.consumableBonus !== 'object') {
              data.consumableBonus = {
                attackPct: 0, defensePct: 0, speedPct: 0, spiritPct: 0, hpPct: 0, allAttrPct: 0,
                attackFix: 0, defenseFix: 0, speedFix: 0, spiritFix: 0, hpFix: 0,
              };
            } else {
              const cb = data.consumableBonus as any;
              if (typeof cb.attackPct !== 'number') cb.attackPct = 0;
              if (typeof cb.defensePct !== 'number') cb.defensePct = 0;
              if (typeof cb.speedPct !== 'number') cb.speedPct = 0;
              if (typeof cb.spiritPct !== 'number') cb.spiritPct = 0;
              if (typeof cb.hpPct !== 'number') cb.hpPct = 0;
              if (typeof cb.allAttrPct !== 'number') cb.allAttrPct = 0;
              if (typeof cb.attackFix !== 'number') cb.attackFix = 0;
              if (typeof cb.defenseFix !== 'number') cb.defenseFix = 0;
              if (typeof cb.speedFix !== 'number') cb.speedFix = 0;
              if (typeof cb.spiritFix !== 'number') cb.spiritFix = 0;
              if (typeof cb.hpFix !== 'number') cb.hpFix = 0;
            }

          data = migrateGrowthRules(data);

          // 魂骨年限化迁移：旧存档魂骨根据 quality 自动推导 soulBoneYears
          // 注意：标签必须按实际年限计算（quality=legendary 可能对应十万年或百万年）
          const qualityToYears: Record<string, number> = {
            common: 50,
            rare: 500,
            fine: 5000,
            epic: 30000,
            legendary: 120000,
          };
          // 根据实际年限返回对应标签（十年/百年/千年/万年/十万年/百万年）
          const calcBoneYearLabel = (years: number): string => {
            if (years >= 1000000) return '百万年';
            if (years >= 100000) return '十万年';
            if (years >= 10000) return '万年';
            if (years >= 1000) return '千年';
            if (years >= 100) return '百年';
            return '十年';
          };
          const migrateBoneYear = (item: any) => {
            if (!item || item.type !== 'soulBone') return item;
            if (item.soulBoneYearsLabel && item.beastAttribute && item.soulBoneYears != null) return item; // 已有，跳过
            const years = item.soulBoneYears || (qualityToYears[item.quality] ?? 1000);
            const label = calcBoneYearLabel(years);
            // beastAttribute 缺失时根据魂兽名（item.name 格式如「幽冥狼·头骨」）推断
            let beastAttr = item.beastAttribute;
            if (!beastAttr && item.name) {
              const beastName = item.name.split('·')[0] || item.name;
              const inferred = inferElementFromName(beastName);
              if (inferred !== '无属性') beastAttr = inferred;
            }
            return { ...item, soulBoneYearsLabel: label, soulBoneYears: years, beastAttribute: beastAttr };
          };
          // 装备栏魂骨迁移
          if (data.soulBones && typeof data.soulBones === 'object') {
            const sb = data.soulBones as any;
            (['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'external'] as const).forEach((slot) => {
              if (sb[slot]) sb[slot] = migrateBoneYear(sb[slot]);
            });
          }
           // 背包魂骨迁移
           if (Array.isArray(data.inventory)) {
             data.inventory = data.inventory.map((item: any) => migrateBoneYear(item));
           }

              // 魂骨属性重算迁移 v9（整体下调50%）
                const needAttrRecalc = (item: any) => {
                  if (!item || item.type !== 'soulBone') return false;
                  if (!item.soulBoneYears) return false;
                    if (item._attrVersion === 9) return false; // v9=2026-09 魂骨数值整体降低50%
                  return true;
                };
               const recalcBoneAttrs = (item: any, slot: string) => {
                 if (!needAttrRecalc(item)) return item;
                 // 最高年限限制为 999 万年
                 const years = Math.min(item.soulBoneYears, 9990000);
                 const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * Math.max(0, Math.min(1, t)));
                 let atk = 0, def = 0, hp = 0, spd = 0, sprt = 0;
                  if (years >= 1000000) {
                     // 百万年~999万年：主属性 5万 → 10万，线性增长
                     const t = Math.min(1, (years - 1000000) / 8990000);
                     atk = lerp(50000, 100000, t);
                     def = lerp(40000, 80000, t);
                     hp  = lerp(200000, 400000, t);
                     spd = lerp(25000, 50000, t);
                     sprt = lerp(30000, 60000, t);
                   } else if (years >= 100000) {
                     // 十万年~99万年：主属性 4000 → 4万，线性增长
                     const t = (years - 100000) / 890000;
                     atk = lerp(4000, 40000, t);
                     def = lerp(3200, 32000, t);
                     hp  = lerp(16000, 160000, t);
                     spd = lerp(2000, 20000, t);
                     sprt = lerp(2400, 24000, t);
                  } else if (years >= 10000) {
                    // 万年：500→4000攻击
                    const t = (years - 10000) / 90000;
                    atk = lerp(500, 4000, t);
                    def = lerp(400, 3200, t);
                    hp  = lerp(2000, 16000, t);
                    spd = lerp(250, 2000, t);
                    sprt = lerp(300, 2400, t);
                  } else if (years >= 1000) {
                    // 千年：40→450攻击
                    const t = (years - 1000) / 9000;
                    atk = lerp(40, 450, t);
                    def = lerp(32, 360, t);
                    hp  = lerp(160, 1800, t);
                    spd = lerp(20, 225, t);
                    sprt = lerp(24, 270, t);
                  } else if (years >= 100) {
                    // 百年：5→35攻击
                    const t = (years - 100) / 900;
                    atk = lerp(5, 35, t);
                    def = lerp(4, 28, t);
                    hp  = lerp(20, 140, t);
                    spd = lerp(2.5, 17.5, t);
                    sprt = lerp(3, 21, t);
                  } else {
                    // 十年：1→4.5攻击
                    const t = Math.max(0, (years - 10) / 90);
                    atk = Math.max(1, lerp(1, 4.5, t));
                    def = Math.max(1, lerp(1, 3.5, t));
                    hp  = Math.max(10, lerp(4, 18, t));
                    spd = Math.max(1, lerp(0.5, 2.5, t));
                    sprt = Math.max(1, lerp(0.5, 2.5, t));
                  }
                // 按部位侧重（同 soulbeasts.ts v6）
               let attackBonus = atk, defenseBonus = def, speedBonus = spd;
               let spiritBonus = sprt, hpBonus = hp;
               if (slot === 'head') {
                 spiritBonus = Math.floor(sprt * 1.6);
                 attackBonus = Math.floor(atk * 0.7);
                 defenseBonus = Math.floor(def * 0.7);
                 hpBonus = Math.floor(hp * 0.7);
               } else if (slot === 'torso') {
                 hpBonus = Math.floor(hp * 1.8);
                 defenseBonus = Math.floor(def * 1.6);
                 speedBonus = Math.floor(spd * 0.6);
               } else if (slot === 'leftArm' || slot === 'rightArm') {
                 attackBonus = Math.floor(atk * 1.8);
                 defenseBonus = Math.floor(def * 0.7);
                 hpBonus = Math.floor(hp * 0.7);
               } else if (slot === 'leftLeg' || slot === 'rightLeg') {
                 speedBonus = Math.floor(spd * 1.8);
                 defenseBonus = Math.floor(def * 1.1);
                 attackBonus = Math.floor(atk * 0.8);
               } else if (slot === 'external') {
                 attackBonus = Math.floor(atk * 1.3);
                 defenseBonus = Math.floor(def * 1.3);
                 speedBonus = Math.floor(spd * 1.3);
                 spiritBonus = Math.floor(sprt * 1.3);
                 hpBonus = Math.floor(hp * 1.3);
               }
                 return {
                    ...item,
                     _attrVersion: 9,
                 attributes: {
                 attack: attackBonus,
                 defense: defenseBonus,
                 speed: speedBonus,
                 spirit: spiritBonus,
                 hp: hpBonus,
                 critRate: 0,
                 critDmg: 0,
                 allAttr: 0,
               },
             };
           };
           // 装备栏魂骨重算
           if (data.soulBones && typeof data.soulBones === 'object') {
             const sb = data.soulBones as any;
             (['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'external'] as const).forEach((slot) => {
               if (sb[slot]) sb[slot] = recalcBoneAttrs(sb[slot], slot);
             });
           }
           // 背包魂骨重算（从name推断slot）
           if (Array.isArray(data.inventory)) {
             data.inventory = data.inventory.map((item: any) => {
               if (!item || item.type !== 'soulBone') return item;
               // 从 name 推断部位：格式如「幽冥狼·头骨」
               let slot = 'external';
               if (item.slot) slot = item.slot;
               else if (item.name) {
                 const parts = item.name.split('·');
                 const boneName = parts[1] || parts[0];
                 if (boneName.includes('头')) slot = 'head';
                 else if (boneName.includes('躯干') || boneName.includes('胸')) slot = 'torso';
                 else if (boneName.includes('左臂') || boneName.includes('左') && boneName.includes('臂')) slot = 'leftArm';
                 else if (boneName.includes('右臂') || boneName.includes('右') && boneName.includes('臂')) slot = 'rightArm';
                 else if (boneName.includes('左腿') || boneName.includes('左') && boneName.includes('腿')) slot = 'leftLeg';
                 else if (boneName.includes('右腿') || boneName.includes('右') && boneName.includes('腿')) slot = 'rightLeg';
                 else slot = 'external';
               }
               return recalcBoneAttrs(item, slot);
             });
            }

             // 属性系统迁移：统一用 normalizeBeastAttribute 清洗所有非标准属性名
             // 覆盖旧存档里的「X系」「单字」「暗属性/毒属性」「剑道/精神/神级」等各种非标准值
             const migrateAttr = (attr: string | undefined): string | undefined => {
               if (!attr) return attr;
               return normalizeBeastAttribute(attr);
             };
            // 迁移魂环 beastAttribute（缺失时按魂兽名推断补全）
            if (Array.isArray(data.soulRings)) {
              data.soulRings = data.soulRings.map((ring: any) => ({
                ...ring,
                beastAttribute: migrateAttr(ring.beastAttribute) || inferElementFromName(ring.soulBeastName || ''),
              }));
            }
            if (Array.isArray(data.pendingSoulRings)) {
              data.pendingSoulRings = data.pendingSoulRings.map((ring: any) => ({
                ...ring,
                beastAttribute: migrateAttr(ring.beastAttribute) || inferElementFromName(ring.soulBeastName || ''),
              }));
            }
           // 迁移魂骨 beastAttribute（装备栏）
           if (data.soulBones && typeof data.soulBones === 'object') {
             const sb = data.soulBones as any;
             (['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'external'] as const).forEach((slot) => {
               if (sb[slot]?.beastAttribute) {
                 sb[slot].beastAttribute = migrateAttr(sb[slot].beastAttribute);
               }
             });
           }
             // 迁移背包中魂骨/物品的 beastAttribute（缺失时按物品名推断补全）
             if (Array.isArray(data.inventory)) {
               data.inventory = data.inventory.map((item: any) => {
                 if (item && (item.type === 'soulBone' || item.type === 'soulRing' || item.beastAttribute)) {
                   return { ...item, beastAttribute: migrateAttr(item.beastAttribute) || inferElementFromName(item.name || item.soulBeastName || '') };
                 }
                 return item;
              });
            }

            // ===== 武魂属性校准迁移 =====
            // 用显式映射表（原著设定）统一修正主武魂和第二武魂的 element 和 cultivationAttr，确保旧存档也正确
            if (data.martialSoul && typeof data.martialSoul === 'object') {
              const correctElement = getSoulElement(data.martialSoul.name);
              if (data.martialSoul.element !== correctElement) {
                data.martialSoul.element = correctElement;
              }
              const correctAttr = getCultivationAttr(data.martialSoul);
              if (data.martialSoul.cultivationAttr !== correctAttr) {
                data.martialSoul.cultivationAttr = correctAttr;
              }
            }
            if (data.secondSoul && typeof data.secondSoul === 'object') {
              const correctElement = getSoulElement(data.secondSoul.name);
              if (data.secondSoul.element !== correctElement) {
                data.secondSoul.element = correctElement;
              }
              const correctAttr = getCultivationAttr(data.secondSoul);
              if (data.secondSoul.cultivationAttr !== correctAttr) {
                data.secondSoul.cultivationAttr = correctAttr;
              }
            }

             // 第二武魂魂环 beastAttribute 也做属性名迁移（与第一武魂保持一致）
             // 同时补算 skillDamagePct
             if (Array.isArray(data.secondSoulRings) && data.isTwinSoul && data.secondSoul) {
               const secondEl = data.secondSoul.element || getSoulElement(data.secondSoul.name || '');
               data.secondSoulRings = data.secondSoulRings.map((ring: any, idx: number) => {
                 const years = ring.years || 100;
                 // 🔴 天梦冰蚕专属蓝白色魂环：跳过年限→颜色重算
                 if (ring.color === 'blueWhite') {
                   const beastType: 'qiang' | 'min' | 'kong' | 'fu' | 'fang' = ring.beastType || inferBeastTypeFromRing(ring);
                   const sdp = ring.skillDamagePct && ring.skillDamagePct > 0 ? ring.skillDamagePct : calcSkillDamagePct(years, beastType, idx, 0);
                   return { ...ring, beastType, skillDamagePct: sdp };
                 }
                 const beastType: 'qiang' | 'min' | 'kong' | 'fu' | 'fang' = ring.beastType || inferBeastTypeFromRing(ring);
                 const beastAttr = ring.beastAttribute || inferElementFromName(ring.soulBeastName || '');
                 const affinity = calcElementAffinity(secondEl, beastAttr);
                 const sdp = calcSkillDamagePct(years, beastType, idx, affinity);
                 const quality = getRingQualityFromYears(years);
                 const hasNewNumeric = typeof ring.skillDamage === 'number';
                 const stats = calcRingStatsByYears(years, beastType);
                 return {
                   ...ring,
                   beastType,
                   beastAttribute: migrateAttr(ring.beastAttribute) || beastAttr,
                   color: quality.color,
                   qualityLabel: quality.label,
                   skillType: ring.skillType || 'attack',
                   attackBonus: hasNewNumeric ? ring.attackBonus : stats.attackBonus,
                   defenseBonus: hasNewNumeric ? ring.defenseBonus : stats.defenseBonus,
                   speedBonus: hasNewNumeric ? ring.speedBonus : stats.speedBonus,
                   spiritBonus: hasNewNumeric ? ring.spiritBonus : stats.spiritBonus,
                   hpBonus: hasNewNumeric ? ring.hpBonus : stats.hpBonus,
                   critRateBonus: hasNewNumeric ? ring.critRateBonus : stats.critRateBonus,
                   critDmgBonus: hasNewNumeric ? ring.critDmgBonus : stats.critDmgBonus,
                   soulPowerBonus: hasNewNumeric ? ring.soulPowerBonus : stats.soulPowerBonus,
                   skillDamage: hasNewNumeric ? ring.skillDamage : stats.skillDamage,
                   skillDamagePct: ring.skillDamagePct && ring.skillDamagePct > 0 ? ring.skillDamagePct : sdp,
                 };
               });
              } else if (Array.isArray(data.secondSoulRings) && data.secondSoulRings.length > 0) {
                // 🔴 修复：第二武魂有魂环但 secondSoul 为 null（旧存档损坏/迁移不完整）
                // 兜底生成一个第二武魂，确保魂环能正确显示魂技名，避免所有魂环显示同名字
                // 优先用第一个魂环的兽名推断武魂，实在不行用「次修武魂」占位
                const firstRing = data.secondSoulRings[0];
                const beastName = firstRing?.soulBeastName || '次修';
                const fallbackSoul: IMartialSoul = {
                  id: `fallback-second-${Date.now()}`,
                  name: `${beastName}武魂`,
                  quality: (firstRing?.color === 'red' || firstRing?.qualityLabel?.includes('十万')) ? 'legendary' : 'epic',
                  type: '强攻系',
                  element: firstRing?.beastAttribute || '无属性',
                  cultivationAttr: 'strength',
                  baseStats: { attack: 10, defense: 10, speed: 10, spirit: 10, hp: 20 },
                  description: '次修武魂',
                  soulSkills: [],
                };
                fallbackSoul.element = getSoulElement(fallbackSoul.name);
                fallbackSoul.cultivationAttr = getCultivationAttr(fallbackSoul);
                fallbackSoul.soulSkills = generateSoulSkills(fallbackSoul);
                data.secondSoul = fallbackSoul;
                data.isTwinSoul = true;
                // 重新计算属性并刷新魂技名
                const secondEl = fallbackSoul.element;
                data.secondSoulRings = data.secondSoulRings.map((ring: any, idx: number) => {
                   const years = ring.years || 100;
                   // 🔴 天梦冰蚕专属蓝白色魂环：跳过年限→颜色重算，保持纯蓝色
                   if (ring.color === 'blueWhite') {
                     const beastType: 'qiang' | 'min' | 'kong' | 'fu' | 'fang' = ring.beastType || inferBeastTypeFromRing(ring);
                     const sdp = ring.skillDamagePct && ring.skillDamagePct > 0 ? ring.skillDamagePct : calcSkillDamagePct(years, beastType, idx, 0);
                     return { ...ring, beastType, skillDamagePct: sdp };
                   }
                   const beastType: 'qiang' | 'min' | 'kong' | 'fu' | 'fang' = ring.beastType || inferBeastTypeFromRing(ring);
                   const beastAttr = migrateAttr(ring.beastAttribute) || inferElementFromName(ring.soulBeastName || '');
                   const affinity = calcElementAffinity(secondEl, beastAttr);
                   const sdp = calcSkillDamagePct(years, beastType, idx, affinity);
                   const quality = getRingQualityFromYears(years);
                   const stats = calcRingStatsByYears(years, beastType);
                   return {
                     ...ring,
                     beastType,
                     beastAttribute: beastAttr,
                     color: quality.color,
                     qualityLabel: quality.label,
                     skillType: ring.skillType || 'attack',
                    attackBonus: typeof ring.attackBonus === 'number' ? ring.attackBonus : stats.attackBonus,
                    defenseBonus: typeof ring.defenseBonus === 'number' ? ring.defenseBonus : stats.defenseBonus,
                    speedBonus: typeof ring.speedBonus === 'number' ? ring.speedBonus : stats.speedBonus,
                    spiritBonus: typeof ring.spiritBonus === 'number' ? ring.spiritBonus : stats.spiritBonus,
                    hpBonus: typeof ring.hpBonus === 'number' ? ring.hpBonus : stats.hpBonus,
                    critRateBonus: typeof ring.critRateBonus === 'number' ? ring.critRateBonus : stats.critRateBonus,
                    critDmgBonus: typeof ring.critDmgBonus === 'number' ? ring.critDmgBonus : stats.critDmgBonus,
                    soulPowerBonus: typeof ring.soulPowerBonus === 'number' ? ring.soulPowerBonus : stats.soulPowerBonus,
                    skillDamage: typeof ring.skillDamage === 'number' ? ring.skillDamage : stats.skillDamage,
                    skillDamagePct: ring.skillDamagePct && ring.skillDamagePct > 0 ? ring.skillDamagePct : sdp,
                  };
                });
              }

              // 魂技名称全量刷新（v12.0 按属性+器/兽武魂重新生成所有魂环的魂技名）
              // 覆盖旧存档中所有魂环的 skillName，确保与武魂属性匹配、不重复、第7魂技恒为武魂真身
              const refreshRingSkillNames = (rings: any[], soul: IMartialSoul | null | undefined): any[] => {
                if (!rings || rings.length === 0) return rings;
                // 🔴 防御性修复：裁切超过9个的魂环（旧存档/历史bug可能导致魂环数>9）
                // 游戏规则最多9个魂环，第10环及以后会显示成「第十魂技」等错误文案
                const safeRings = rings.length > 9 ? rings.slice(0, 9) : rings;
                const soulSkills = soul ? generateSoulSkills(soul) : [];
                const dept = soul ? getSoulDepartment(soul.type) : '强攻系';
                const soulName = soul?.name || '武魂';
                return safeRings.map((ring, idx) => {
                  if (idx === 6) {
                    // 第7魂环：武魂真身
                    return { ...ring, skillName: '武魂真身', skillType: 'buff' as const, buffAttr: 'attack' as const, skillDesc: `释放${soulName}真身，全属性与魂技威力大幅提升！` };
                  }
                  // 🔴 防御性修复：idx >= 9 时兜底为「神技」而不是「第十魂技」
                  // 正常游戏流程不会触发，仅作为极端数据错误时的最后防线
                  const newName = soulSkills[idx] || (idx < 9 ? `第${idx + 1}魂技` : '神技');
                  // 辅助系：根据槽位重新校准类型（奇位攻击、偶位辅助）
                  // 其他系：保留原 heal/allBuff 类型，其余重置为 attack
                  let newType: string;
                  let newBuffAttr: string | undefined;
                  let newDesc = `由${soulName}衍生的第${idx + 1}魂技，威力随魂环品质提升。`;
                  if (dept === '辅助系') {
                    if (idx % 2 === 0) {
                      // 奇位：攻击型（第1/3/5/9魂技）
                      newType = 'attack';
                      newDesc = `凝聚${soulName}之力发动攻击，威力随魂环品质提升。`;
                    } else {
                      // 偶位：辅助型（第2/4/6/8魂技）
                      // buffIdx: idx=1→0, idx=3→1, idx=5→2, idx=7→3
                      if (idx === 1 || idx === 3 || idx === 5) {
                        newType = 'heal';
                        newDesc = `恢复自身气血，治疗量随魂环品质提升。`;
                      } else if (idx === 7) {
                        // 第8魂技：增益 buff
                        // 九宝玲珑塔 → 九宝神光（全属性增幅 allBuff，持续5回合，神级辅助）
                        // 七宝琉璃塔 → 精神力单属性 buff（辅助系标准第8魂技）
                        const isJiubao = soulName === '九宝玲珑塔';
                        if (isJiubao) {
                          newType = 'allBuff';
                          newBuffAttr = 'attack';
                          newDesc = `九宝神光！九宝玲珑塔第八魂技，全属性大幅提升，持续5回合。`;
                        } else {
                          const attrList = ['attack', 'defense', 'speed', 'spirit'];
                          const buffIdx = Math.floor((idx - 1) / 2);
                          newBuffAttr = attrList[buffIdx % 4];
                          newType = 'buff';
                          const attrCN = newBuffAttr === 'attack' ? '攻击'
                            : newBuffAttr === 'defense' ? '防御'
                            : newBuffAttr === 'speed' ? '速度'
                            : '精神';
                          newDesc = `提升自身${attrCN}力，持续3回合。`;
                        }
                      } else {
                        // idx >= 9 等极端情况兜底
                        newType = 'allBuff';
                        newBuffAttr = 'attack';
                        newDesc = `全面提升自身攻击、防御、速度、精神力，持续3回合。`;
                      }
                    }
                   } else {
                     // 非辅助系（强攻/敏攻/控制/防御/器武魂/兽武魂等）：全部为攻击型
                     // 🔴 修复：历史旧存档可能遗留 heal/allBuff 在强攻系里，这里统一重置为 attack
                     newType = 'attack';
                     newBuffAttr = undefined;
                     newDesc = `由${soulName}衍生的第${idx + 1}魂技，威力随魂环品质提升。`;
                   }
                  return { ...ring, skillName: newName, skillType: newType as any, buffAttr: newBuffAttr as any, skillDesc: newDesc };
                });
              };
              if (Array.isArray(data.soulRings)) {
                data.soulRings = refreshRingSkillNames(data.soulRings, data.martialSoul);
              }
              if (Array.isArray(data.secondSoulRings) && data.isTwinSoul) {
                data.secondSoulRings = refreshRingSkillNames(data.secondSoulRings, data.secondSoul);
              }
              // 武魂 soulSkills 也刷新（角色页/详情页展示用）
              if (data.martialSoul) {
                data.martialSoul.soulSkills = generateSoulSkills(data.martialSoul);
              }
              if (data.secondSoul && data.isTwinSoul) {
                data.secondSoul.soulSkills = generateSoulSkills(data.secondSoul);
              }

              // 天梦冰蚕魂环：按当前等级重算伤害百分比（确保升级后存档也同步）
              // 主修武魂 + 次修武魂 都检查并重算（双生武魂双端适配）
              if (Array.isArray(data.soulRings) && data.soulRings.some((r: any) => r.color === 'blueWhite')) {
                const tianmengPct = calcTianmengDamagePct(data.level);
                data.soulRings = data.soulRings.map((r: any) =>
                  r.color === 'blueWhite' ? { ...r, skillDamagePct: tianmengPct } : r,
                );
              }
              if (data.isTwinSoul && Array.isArray(data.secondSoulRings) && data.secondSoulRings.some((r: any) => r.color === 'blueWhite')) {
                const tianmengPct2 = calcTianmengDamagePct(data.level);
                data.secondSoulRings = data.secondSoulRings.map((r: any) =>
                  r.color === 'blueWhite' ? { ...r, skillDamagePct: tianmengPct2 } : r,
                );
              }

               // 🔴 修复：加载存档时清空 newlyUnlocked，避免每次进入游戏都重复弹成就提示
               // newlyUnlocked 仅为「本次会话内新解锁」的运行时标记，不应持久化跨会话
               if (data.achievementStats) {
                  data.achievementStats = { ...data.achievementStats, newlyUnlocked: [] };
                  // v18 新增：冰火两仪眼进入次数
                  if (typeof (data.achievementStats as any).liangyiEyeEnterCount !== 'number') {
                    (data.achievementStats as any).liangyiEyeEnterCount = 0;
                  }
                }
               // 🔴 修复：旧存档 bestBeastQualityIndex 回推补全
               // 历史 bug 导致 beastYears 未正确写入 bestBeastQualityIndex（始终为 0/1）
               // 玩家拥有的魂环/魂骨只能通过击败对应品质魂兽获得，因此用最高品质回推
               if (data.achievementStats) {
                 const qualityIdxByYears = (y: number): number => {
                   if (y >= 1000000) return 6;
                   if (y >= 100000) return 5;
                   if (y >= 10000) return 4;
                   if (y >= 1000) return 3;
                   if (y >= 100) return 2;
                   if (y >= 10) return 1;
                   return 0;
                 };
                 let bestFromRings = 0;
                 for (const r of (data.soulRings || [])) {
                   const y = (r as any).years ?? 0;
                   bestFromRings = Math.max(bestFromRings, qualityIdxByYears(y));
                 }
                 if (data.isTwinSoul && data.secondSoulRings) {
                   for (const r of data.secondSoulRings) {
                     const y = (r as any).years ?? 0;
                     bestFromRings = Math.max(bestFromRings, qualityIdxByYears(y));
                   }
                 }
                 let bestFromBones = 0;
                 const boneVals = Object.values(data.soulBones || {}).filter(Boolean) as any[];
                 for (const b of boneVals) {
                   const y = b.soulBoneYears ?? 0;
                   bestFromBones = Math.max(bestFromBones, qualityIdxByYears(y));
                 }
                 const inferredBest = Math.max(bestFromRings, bestFromBones);
                 const currentBest = data.achievementStats.bestBeastQualityIndex ?? 0;
                 if (inferredBest > currentBest) {
                   data.achievementStats.bestBeastQualityIndex = inferredBest;
                 }
               }
              // 🔴 修复：旧存档成就补全
              // v14.0 之前的存档或异常存档，unlockedAchievements 可能为空或缺失
              // 但玩家实际上已经达成了很多成就。加载时统一跑一遍全量检测，
              // 把已达成的成就补进永久列表（不弹新解锁提示，避免一次性弹一堆）
              if (!Array.isArray(data.unlockedAchievements) || data.unlockedAchievements.length === 0) {
                const existingUnlocked: string[] = Array.isArray(data.unlockedAchievements) ? [...data.unlockedAchievements] : [];
                for (const ach of ACHIEVEMENTS) {
                  if (existingUnlocked.includes(ach.id)) continue;
                  // 直接用 computeAchievementProgress 检测（复用 checkAchievements 内的逻辑）
                  // 注意：getRingQualityIndex 等辅助函数在 hook 内定义，此处用简化的 inline 检测
                  let completed = false;
                  const tgt = ach.target;
                  switch (ach.checkType) {
                    case 'level':
                      completed = (data.level ?? 1) >= (tgt as number);
                      break;
                    case 'ringCount': {
                      const mc = (data.soulRings || []).length;
                      const sc = data.isTwinSoul && data.secondSoulRings ? data.secondSoulRings.length : 0;
                      completed = Math.max(mc, sc) >= (tgt as number);
                      break;
                    }
                    case 'ringQuality': {
                      const qualityIdx = (ring: any) => {
                        if (!ring) return 0;
                        if (ring.color === 'gold') return 7;
                        if (ring.color === 'blueWhite') return 6;
                        const q = ring.qualityLabel || '';
                        if (q.includes('百万年')) return 6;
                        if (q.includes('十万年')) return 5;
                        if (q.includes('万年')) return 4;
                        if (q.includes('千年')) return 3;
                        if (q.includes('百年')) return 2;
                        if (q.includes('十年')) return 1;
                        const y = ring.years ?? 0;
                        if (y >= 1000000) return 6;
                        if (y >= 100000) return 5;
                        if (y >= 10000) return 4;
                        if (y >= 1000) return 3;
                        if (y >= 100) return 2;
                        return 1;
                      };
                      const bestMain = (data.soulRings || []).reduce((mx: number, r: any) => Math.max(mx, qualityIdx(r)), 0);
                      const bestSecond = data.isTwinSoul && data.secondSoulRings
                        ? data.secondSoulRings.reduce((mx: number, r: any) => Math.max(mx, qualityIdx(r)), 0)
                        : 0;
                      completed = Math.max(bestMain, bestSecond) >= (tgt as number);
                      break;
                    }
                    case 'boneCount': {
                      const bones = Object.values(data.soulBones || {}).filter((b) => !!b);
                      completed = bones.length >= (tgt as number);
                      break;
                    }
                    case 'boneQuality': {
                      const bones = Object.values(data.soulBones || {}).filter((b) => !!b) as any[];
                      const best = bones.reduce((mx, b) => {
                        const y = b.soulBoneYears ?? 0;
                        if (y >= 1000000) return 6;
                        if (y >= 100000) return 5;
                        if (y >= 10000) return 4;
                        if (y >= 1000) return 3;
                        if (y >= 100) return 2;
                        return 1;
                      }, 0);
                      completed = best >= (tgt as number);
                      break;
                    }
                    case 'beastKills':
                      completed = (data.achievementStats?.totalBeastKills ?? 0) >= (tgt as number);
                      break;
                    case 'fierceBeast':
                      completed = !!(data.achievementStats?.fierceBeastDefeated);
                      break;
                    case 'beastKillsMaxQuality':
                      completed = (data.achievementStats?.bestBeastQualityIndex ?? 0) >= (tgt as number);
                      break;
                    case 'divineInherit': {
                      const list = Array.isArray(data.inheritedGodPositions) ? data.inheritedGodPositions : [];
                      const curId = data.divineTrial?.inherited ? data.divineTrial.chosenTrialId : null;
                      completed = list.includes(tgt as string) || curId === tgt;
                      break;
                    }
                    case 'divineTier': {
                      const list = Array.isArray(data.inheritedGodPositions) ? data.inheritedGodPositions : [];
                      const curId = data.divineTrial?.inherited ? data.divineTrial.chosenTrialId : null;
                      const all = curId ? [...list, curId] : list;
                      let tierScore = 0;
                      for (const gid of all) {
                        const trial = getTrialById(gid);
                        if (!trial) continue;
                        let s = 0;
                        if (trial.tier === 'supreme') s = 4;
                        else if (trial.tier === 'king') s = 3;
                        else if (trial.tier === 'first') s = 2;
                        else if (trial.tier === 'second') s = 1;
                        if (s > tierScore) tierScore = s;
                      }
                      const targetScore = 5 - (tgt as number);
                      completed = tierScore >= targetScore;
                      break;
                    }
                    case 'soulQuality': {
                      const qIdx = (q: string) => {
                        if (q === 'common') return 1;
                        if (q === 'rare') return 2;
                        if (q === 'fine') return 3;
                        if (q === 'epic') return 4;
                        if (q === 'legendary') return 5;
                        if (q === 'divine') return 6;
                        if (q === 'superDivine') return 7;
                        return 1;
                      };
                      const m = qIdx(data.martialSoul?.quality || 'common');
                      const s = data.secondSoul ? qIdx(data.secondSoul.quality) : 0;
                      completed = Math.max(m, s) >= (tgt as number);
                      break;
                    }
                    case 'twinSoul': {
                      const main9 = (data.soulRings || []).length >= 9;
                      const second9 = data.isTwinSoul && data.secondSoulRings && data.secondSoulRings.length >= 9;
                      completed = !!(data.isTwinSoul && main9 && second9);
                      break;
                    }
                    case 'twinSoulAwake':
                      completed = !!data.isTwinSoul;
                      break;
                    case 'reincarnation':
                      completed = (data.reincarnation?.count ?? 0) >= (tgt as number);
                      break;
                    case 'academy': {
                      const rank = data.academyRank || 'none';
                      let level = 0;
                      if (rank === 'freshman' || rank === 'outer' || rank === 'inner' || rank === 'sea-god') level = 1;
                      if (rank === 'inner' || rank === 'sea-god') level = 2;
                      if (rank === 'sea-god') level = 3;
                      completed = level >= (tgt as number);
                      break;
                    }
                    case 'artifact':
                      completed = !!data.divineTrial?.artifactDrawn;
                      break;
                    case 'domain':
                      completed = !!data.domain;
                      break;
                    case 'soulSpirit':
                      completed = (data.soulSpirits?.length ?? 0) >= (tgt as number);
                      break;
                    case 'craftGuide':
                      completed = !!data.achievementStats?.craftedGuide;
                      break;
                    case 'herb':
                      completed = (data.achievementStats?.herbTypesTaken ?? 0) >= (tgt as number);
                      break;
                    case 'lifeWater':
                      completed = !!data.achievementStats?.lifeWaterTaken;
                      break;
                    case 'arenaWin':
                      completed = (data.achievementStats?.arenaTotalWins ?? 0) >= (tgt as number);
                      break;
                    case 'arenaStreak':
                      completed = (data.achievementStats?.arenaBestStreak ?? 0) >= (tgt as number);
                      break;
                    case 'seaGod':
                      completed = (data.seaGodDefeatedIds?.length ?? 0) >= (tgt as number);
                      break;
                    case 'hundredLevel':
                      completed = !!data.divineTrial?.inherited;
                      break;
                    case 'godRealmBoss':
                      completed = (data.godRealm?.defeatedIds ?? []).includes(tgt as string);
                      break;
                    case 'godRealmKills':
                      completed = (data.godRealm?.defeatedIds ?? []).length >= (tgt as number);
                      break;
                    default:
                      break;
                  }
                  if (completed) {
                    existingUnlocked.push(ach.id);
                  }
                }
                data.unlockedAchievements = existingUnlocked;
                if (existingUnlocked.length > 0) {
                  logger.info(`[成就系统] 旧存档补全：已解锁 ${existingUnlocked.length} 个成就`);
                }
               }
                // 🔴 v15.0 神装系统：旧存档补全 divineArmor 默认值
                if (!data.divineArmor) {
                  data.divineArmor = {
                    hasArmor: false,
                    armorItem: null,
                    armorName: '',
                    sourceBones: { ...EMPTY_SOUL_BONES },
                    resonanceActive: false,
                  };
                }
                // 🔴 v16.0 神界系统：旧存档补全 godRealm 默认值
                if (!data.godRealm) {
                  data.godRealm = {
                    unlocked: !!(data.divineTrial?.inherited), // 已继承的直接开启
                    defeatedIds: [],
                    divineCoreCrafted: false,
                  };
                }
                // 🔴 v17.0 侣系统：旧存档补全 companions 默认值，防止读取时 undefined 崩溃
                if (!data.companions || typeof data.companions !== 'object') {
                  data.companions = {
                    accepted: [],
                    rejected: [],
                    details: {},
                    weaknessUntil: 0,
                    divorceCount: 0,
                    pendingTeaFavorId: null,
                    pendingFavorBeastId: null,
                    teaNodeCooldowns: {},
                  };
                } else {
                  if (!Array.isArray(data.companions.accepted)) data.companions.accepted = [];
                  if (!Array.isArray(data.companions.rejected)) data.companions.rejected = [];
                  if (!data.companions.details || typeof data.companions.details !== 'object') data.companions.details = {};
                   if (typeof data.companions.weaknessUntil !== 'number') data.companions.weaknessUntil = 0;
                   if (typeof data.companions.divorceCount !== 'number') data.companions.divorceCount = 0;
                  if (typeof data.companions.pendingTeaFavorId !== 'string' && data.companions.pendingTeaFavorId !== null) {
                    data.companions.pendingTeaFavorId = null;
                  }
                  // 🔴 v17.2 迁移：凶兽待处理青睐id（旧存档无此字段）
                  if (typeof data.companions.pendingFavorBeastId !== 'string' && data.companions.pendingFavorBeastId !== null) {
                    data.companions.pendingFavorBeastId = null;
                  }
                  if (!data.companions.teaNodeCooldowns || typeof data.companions.teaNodeCooldowns !== 'object') {
                    data.companions.teaNodeCooldowns = {};
                  } else {
                    // 🔴 茶城节点冷却时间戳异常值校验：非数字/负数/超过当前+1小时重置为0
                    Object.keys(data.companions.teaNodeCooldowns).forEach((k) => {
                      const v = data.companions.teaNodeCooldowns[k];
                      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > Date.now() + 60 * 60 * 1000) {
                        data.companions.teaNodeCooldowns[k] = 0;
                      }
                    });
                  }
                  // v17.1 迁移：details 每项补全 companionType（旧存档都是 beast）
                   const dets = data.companions.details as Record<string, any>;
                   for (const id of Object.keys(dets)) {
                     if (!dets[id]) continue;
                     if (dets[id].companionType !== 'beast' && dets[id].companionType !== 'human') {
                       dets[id].companionType = 'beast';
                     }
                     // v18.0 迁移：补全新增字段
                     if (typeof dets[id].crystals !== 'number') dets[id].crystals = 0;
                     if (typeof dets[id].lastDualCultivateAt !== 'number') dets[id].lastDualCultivateAt = 0;
                     if (typeof dets[id].lastMatingAt !== 'number') dets[id].lastMatingAt = 0;
                     if (typeof dets[id].forgotten !== 'boolean') dets[id].forgotten = false;
                   }
                }
               setPlayerState(data);
          // 🔴 如果是从备份/原生 localStorage 恢复的，立刻回写到 scopedStorage 主存档
          // 防止下次启动又走恢复流程，或后续写入时 scopedStorage 前缀不对导致覆盖
          if (loadFromBackup && raw) {
            try { safeWriteWithChecksum(SAVE_KEY, raw); } catch { /* ignore */ }
            try { safeWriteWithChecksum(BACKUP_SAVE_KEY, raw); } catch { /* ignore */ }
            logger.warn(`存档从 ${recoverySource} 恢复并回写成功`);
          }
          // 经验曲线升级兼容：旧存档如果当前经验超过新的满级经验，自动连升对应等级
          setTimeout(() => {
            setPlayer((p) => {
              if (!p || p.level >= 99) return p;
              let curLevel = p.level;
              let curExp = p.exp;
              let safeCounter = 0;
              // 🔴 武魂专属等级限制：罗三炮未进化卡29级，七宝琉璃塔未进化卡79级
               const isLuosanpaoLoad = p.martialSoul.name === '罗三炮';
               const isQibaoLoad = p.martialSoul.name === '七宝琉璃塔' || p.secondSoul?.name === '七宝琉璃塔';
              while (safeCounter < 200) {
                safeCounter++;
                const maxExp = getMaxExp(curLevel, p.easterRealmStage);
                if (curExp < maxExp) break;
                if (isBottleneck(curLevel, p.brokenBottlenecks)) { curExp = maxExp; break; }
                if (curLevel >= 99) { const cap = getMaxExp(99, p.easterRealmStage); if (curExp > cap) curExp = cap; break; }
                const nextMaxRings = getMaxRings(curLevel + 1);
                if (nextMaxRings > p.soulRings.length) { curExp = maxExp; break; }
                // 罗三炮未进化：卡在29级
                if (isLuosanpaoLoad && curLevel >= 29) { curExp = maxExp; break; }
                // 七宝琉璃塔未进化：卡在79级
                if (isQibaoLoad && curLevel >= 79) { curExp = maxExp; break; }
                curExp -= maxExp;
                curLevel += 1;
              }
              if (curLevel === p.level && curExp === p.exp) return p;
              const attrs = calcAttributes({ ...p, level: curLevel });

              // 🔴 天梦冰蚕魂环：读档经验曲线连升后重算伤害百分比
              let finalSoulRings = p.soulRings;
              let finalSecondSoulRings = p.secondSoulRings;
              const oldTier = getRealmTier(p.level);
              const newTier = getRealmTier(curLevel);
              if (oldTier !== newTier && p.soulRings.some((r) => r.color === 'blueWhite')) {
                const res = refreshTianmengDamagePct(p.soulRings, curLevel, '读档连升');
                finalSoulRings = res.rings;
              }
              if (oldTier !== newTier && p.isTwinSoul && p.secondSoulRings && p.secondSoulRings.some((r) => r.color === 'blueWhite')) {
                const res2 = refreshTianmengDamagePct(p.secondSoulRings, curLevel, '读档连升（次修）');
                finalSecondSoulRings = res2.rings;
              }

              return {
                ...p,
                level: curLevel,
                exp: curExp,
                currentHp: attrs.hp,
                soulRings: finalSoulRings,
                secondSoulRings: finalSecondSoulRings,
              };
            });
          }, 0);
          setHasSave(true);
          logger.info('存档加载成功');
      } catch (err) {
        // 存档损坏：清除坏档，重置为无存档状态，避免白屏
        logger.error('存档加载失败，已清除损坏存档:', String(err));
        try { scopedStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
        setHasSave(false);
        setPlayerState(null);
      }
    } else {
      // 没有存档
      setHasSave(false);
    }
  };

  const createPlayer = (name: string, direction: string, soul: IMartialSoul, soulPower: number, secondSoul: IMartialSoul | null = null) => {
    // 🔴 严格单武魂守卫：主武魂是罗三炮时，强制清除第二武魂（多重保险第三层）
    const guarded = enforceSingleSoul(soul, secondSoul);
    let p = createNewPlayer(name, direction, guarded.primary, soulPower);
    if (guarded.secondary) {
      p = {
        ...p,
        isTwinSoul: true,
        secondSoul: guarded.secondary,
      };
    }
    setPlayerState(p);
    // 新角色创建立即双写保存（带checksum + scopedStorage + 原生 localStorage 兜底）
    safeWriteWithChecksum(SAVE_KEY, JSON.stringify({ ...p, saveVersion: SAVE_VERSION }));
    // 新建角色时清掉 tab 记忆：避免老玩家留下的 tab 值（如 more/settings）让新玩家进游戏后白屏或停留在非默认页
    try { scopedStorage.removeItem('game_active_tab'); } catch { /* ignore */ }
    // 重置锁释放：新角色创建成功后，确保自动存档可以正常工作
    // 防止 resetGame 延迟释放锁还未到期就已经创建了新角色，导致后续保存被拦截
    isResettingRef.current = false;
    setHasSave(true);
  };

  const resetGame = () => {
    // 上锁：在重置完成前，所有 flushSave/saveGame/setPlayer 都不得写入 localStorage
    // 防止 beforeunload / visibilitychange / setInterval 等事件在清档后立刻写回旧 player
    isResettingRef.current = true;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    pendingSaveRef.current = null;
    safeRemove(SAVE_KEY);
    safeRemove(BACKUP_SAVE_KEY);
    // 重置时也清掉原生 localStorage 终极备份，确保真正清档
    try {
      localStorage.removeItem(NATIVE_BACKUP_KEY);
      localStorage.removeItem(NATIVE_BACKUP_KEY + '_time');
    } catch { /* ignore */ }
    // 清掉 tab 记忆，避免新角色创建后停留在非默认 tab
    try { scopedStorage.removeItem('game_active_tab'); } catch { /* ignore */ }
    setPlayerState(null);
    setHasSave(false);
    // 延迟释放锁：等 GameShell 卸载、所有定时器/事件监听都清理完后再开
    // 2000ms 足够 SettingsPanel 的 navigate('/') 触发页面切换 + 组件完全卸载
    setTimeout(() => {
       isResettingRef.current = false;
     }, 2000);
   };

   // ========== 转世轮回系统 ==========

   // 是否可进行转世（99级+未达99世上限）
   const canReincarnate = (): boolean => {
     if (!player) return false;
     if (player.level < 99) return false;
     const count = player.reincarnation?.count ?? 0;
     return count < 99;
   };

   // 获取轮回加成信息
   const getReincarnationBonus = (): { count: number; attackBonus: number; ringYearBonus: number; ringYearBonusPct: number } => {
     if (!player) return { count: 0, attackBonus: 0, ringYearBonus: 0, ringYearBonusPct: 0 };
     const r = player.reincarnation;
     return {
       count: r?.count ?? 0,
       attackBonus: r?.totalAttackBonus ?? 0,
       ringYearBonus: r?.totalRingYearBonus ?? 0,
       ringYearBonusPct: r?.ringYearBonusPct ?? 0,
     };
   };

   // 获取所有轮回球
   const getReincarnationOrbs = (): IReincarnationOrb[] => {
     if (!player) return [];
     return player.reincarnation?.orbs ?? [];
   };

    // 执行转世
    // option: 'keep' 保留武魂, 'reroll' 重新抽取武魂
    // 可选 presetSoul / presetSecondSoul / presetSoulPower：预览模式下，用户已选定武魂后传入，保证结果与预览一致
    const performReincarnation = (option: 'keep' | 'reroll', newName?: string, preset?: { mainSoul?: IMartialSoul; secondSoul?: IMartialSoul | null; soulPower?: number }): { success: boolean; reason?: string; newSoul?: IMartialSoul | null; newSecondSoul?: IMartialSoul | null } => {
     if (!player) return { success: false, reason: '玩家数据不存在' };
     if (player.level < 99) return { success: false, reason: '需达到99级才能转世' };

     const prevCount = player.reincarnation?.count ?? 0;
     if (prevCount >= 99) return { success: false, reason: '已达最大轮回次数（99次）' };

     // 1. 计算当前属性快照
     const currentAttrs = calcAttributes(player);

     // 2. 构建轮回球
     const orb: IReincarnationOrb = {
       index: prevCount + 1,
       timestamp: Date.now(),
       name: player.name,
       level: player.level,
       realm: getRealm(player.level),
       direction: player.direction,
       martialSoul: player.martialSoul,
       isTwinSoul: player.isTwinSoul,
       secondSoul: player.secondSoul,
       soulRings: [...(player.soulRings || [])],
       secondSoulRings: [...(player.secondSoulRings || [])],
       soulBones: { ...player.soulBones },
       equipment: { ...player.equipment },
       soulSpirits: [...(player.soulSpirits || [])],
       soulCoins: player.soulCoins,
        inventoryCount: (player.inventory || []).length,
        inventory: [...(player.inventory || [])],
       attributes: currentAttrs,
       dragonLegend: JSON.parse(JSON.stringify(dragonProgress(player))),
       dragonBloodline: bloodlineProgress(player),
       recruitedCount: (player.recruited || []).length,
       teamCount: (player.team || []).length + 1, // 含玩家自身
       domainName: player.domain?.name || '',
       divineTrialName: player.divineTrial?.chosenTrialId
         ? (DIVINE_TRIALS.find((t) => t.id === player.divineTrial!.chosenTrialId)?.name || '')
         : '',
     };

      // 3. 确定新一世的武魂
         let newMainSoul: IMartialSoul = player.martialSoul; // 默认保留
        let newSecondSoul: IMartialSoul | null = player.secondSoul;
        let rerollResult: { isTwin: boolean; secondary: IMartialSoul | null } = { isTwin: false, secondary: null };
         if (option === 'reroll') {
            // 重新抽取：优先使用预设武魂（预览模式），否则用标准武魂觉醒函数保证概率分布一致
            if (preset?.mainSoul) {
              // 🔴 严格单武魂守卫：preset 模式下强制校验（多重保险第四层）
              const guarded = enforceSingleSoul(preset.mainSoul, preset.secondSoul ?? null);
              newMainSoul = guarded.primary;
              newSecondSoul = guarded.secondary;
              rerollResult = { isTwin: guarded.isTwin, secondary: guarded.secondary };
            } else {
              const rollResult = rollTwinSouls({});
              newMainSoul = rollResult.primary;
              // 🔴 修复：转生 reroll 的双生判定调整
              // 原本是双生武魂玩家未抽中时：50%概率保底仍是双生（不是100%保底）
              // 让玩家在转生时有机会体验单武魂
              // 🔴 严格单武魂守卫：主武魂是罗三炮时，绝对不能保底补第二武魂（多重保险第五层）
               if (rollResult.isTwin && rollResult.secondary) {
                 newSecondSoul = rollResult.secondary;
                 } else if (player.isTwinSoul && !isStrictlySingleSoul(newMainSoul) && secureRandom() < 0.5) {
                  newSecondSoul = rollDifferentMartialSoulWeighted(newMainSoul, {});
                } else {
                 newSecondSoul = null;
               }
              // 🔴 最终守卫：再 enforce 一次，确保万无一失（多重保险第六层）
              const finalGuarded = enforceSingleSoul(newMainSoul, newSecondSoul);
              newMainSoul = finalGuarded.primary;
              newSecondSoul = finalGuarded.secondary;
             rerollResult = { isTwin: !!newSecondSoul, secondary: newSecondSoul };
           }
         }

     // 4. 构建新玩家数据（保留轮回次数/加成/武魂选择，其余重置）
     const newCount = prevCount + 1;
      const newAttackBonus = (player.reincarnation?.totalAttackBonus ?? 0) + 10;
       const newRingBonus = (player.reincarnation?.totalRingYearBonus ?? 0) + 1000;
       const newRingBonusPct = (player.reincarnation?.ringYearBonusPct ?? 0) + 0.5;

      const orbs = [...(player.reincarnation?.orbs || []), orb];

       // 🔴 修复：转生 reroll 第二武魂判定（从上面的 reroll 逻辑直接读取 newSecondSoul，不重复判定）
       // isTwinAfterReroll 直接看 newSecondSoul 是否存在即可（与上方抽取逻辑保持一致）
       const isTwinAfterReroll = option === 'reroll'
         ? !!newSecondSoul
         : player.isTwinSoul;

       // 用保留的武魂创建新角色（等级回到先天魂力等级）
       const newSoulPower = option === 'reroll'
         ? (preset?.soulPower ?? (isTwinAfterReroll ? rollTwinSoulPower(newMainSoul, newSecondSoul) : rollSoulPower(newMainSoul.quality)))
         : player.soulPower;
       const finalName = newName && newName.trim() ? newName.trim() : player.name;
       const baseP = createNewPlayer(finalName, player.direction, newMainSoul, newSoulPower);

        const newPlayer: IPlayer = {
          ...baseP,
          jiYueVictories: jiYueCount(player),
          jiYueLastBattleId: player.jiYueLastBattleId,
          dragonLegend: reincarnateDragon(player),
          abyssFrontier: reincarnateAbyss(player),
          twinResonance:readTwin(player.twinResonance),dragonBloodline: reincarnateBloodline(player),dragonValley:reincarnateValley(player),goldBlood:readGoldBlood(player.goldBlood),silverBloodline:reincarnateSilver(player),
          name: finalName,
          direction: player.direction,
          isTwinSoul: isTwinAfterReroll,
          secondSoul: isTwinAfterReroll ? newSecondSoul : null,
          // 🔴 转世后背包彻底清空（显式赋值，防御性防止 baseP 继承残留）
          // 同时确保特殊物品（如混沌神剑）被一并清除，转世后需重新获得
          inventory: [],
          // 🔴 魂灵系统：转世后全部重置，需重新契约
          soulSpirits: [],
          activeSpiritIds: [],
          pendingSpirits: [],
          // 🔴 修复：转世后待吸收魂环显式清空，防止上一世魂环残留
          pendingSoulRings: [],
          // 🔴 防御性重置：已吸收魂环显式清零（第一武魂+第二武魂）
          soulRings: [],
          secondSoulRings: [],
          // 🔴 防御性重置：魂币重置为初始值，避免上一世财富残留
          soulCoins: 100,
          // 🔴 防御性重置：体力重置为满值 + 更新时间戳
          stamina: STAMINA_CAP,
          staminaUpdatedAt: Date.now(),
          // 🔴 防御性重置：魂核系统清零
          soulCoreType: 'none',
          soulCoreStage: 0,
          yinCoreStartTime: null,
          yangCoreStartTime: null,
          // 🔴 防御性重置：心魔挑战状态清零
          demonDefeated: { lvl90: 'none', lvl99: false },
          // 🔴 防御性重置：彩蛋境界/封号清零
          easterRealmStage: 0,
          title: '',
          permanentTitles: Array.isArray(player.permanentTitles) ? [...player.permanentTitles] : [],
          // 🔴 防御性重置：海神阁进度清零
          seaGodDefeatedIds: [],
          seaGodPosition: -1,
          // 🔴 防御性重置：各类冷却和进度清零
          trainingCooldowns: {},
          cultivationEndTime: null,
          cultivationFromLevel: null,
          examCooldownUntil: 0,
          mentorCooldowns: {},
          freshTaskProgress: {},
          freshTaskCooldowns: {},
          iceFireCooldowns: {},
          purchasedShopItems: [],
          shopLastRefreshAt: Date.now(),
          // 🔴 修复：转世后招募角色和队伍显式清空，防御性重置
          recruited: [],
          team: [],
          // 🔴 防御性重置：装备和魂骨显式清空（防止baseP变更或继承残留）
          equipment: { ...EMPTY_EQUIPMENT },
          soulBones: { ...EMPTY_SOUL_BONES },
          // 🔴 防御性重置：消耗品服用记录与加成显式清零（仙草/灵草/生命之水等）
           consumableCounts: {},
           growthRules: freshGrowthRules(),
           brokenBottlenecks: [],
           consumableBonus: {
             attackPct: 0, defensePct: 0, speedPct: 0, spiritPct: 0, hpPct: 0, allAttrPct: 0,
             attackFix: 0, defenseFix: 0, speedFix: 0, spiritFix: 0, hpFix: 0,
           },
            // 🔴 吞噬茶武魂：转世后吞噬次数、三茶击败次数、特殊魂灵、反噬全部重置，下一世重新积累
            devour: { count: 0, totalAttack: 0, totalDefense: 0, totalSpeed: 0, totalSpirit: 0, totalHp: 0, backlashCount: 0, backlashAttack: 0, backlashDefense: 0, backlashSpeed: 0, backlashSpirit: 0, backlashHp: 0 },
           teaDefeatCounts: {},
           specialSoulSpirits: [],
           specialActiveSpiritIds: [],
          // 🔴 防御性重置：领域、学院、竞技场状态全部清零
          domain: null,
          secondDomain: null,
          academyRank: 'none',
          arenaRank: 'bronze',
          arenaStars: 0,
          examPassed: false,
          // 🔴 防御性重置：性别保留玩家选择
          gender: player.gender || 'male',
          // 🔴 神考系统：转世后重置，需重新接取考核
          divineTrial: {
            stage: 'none' as const,
            drawnTrials: [],
            drawIndex: 0,
            chosenTrialId: null,
            affinityPct: 0,
            currentExamIndex: 0,
            completedExams: [],
            failedExams: [],
            firstExamTaken: false,
            firstExamDiTianDefeated: false,
            avatarAttempts: 0,
            avatarDefeated: false,
            beastDefeated: false,
            artifactDrawn: false,
            artifactLevel: 1,
            divinePowerPct: 0,
            inherited: false,
            inheritedLevel: 0,
            divineSoulRing: null,
            pendingLevelBonus: 0,
            activeArtifactId: null,
            supremeArtifacts: [], // 🔴 转世清空至高神器，需重新结识角色并击败获得
            godLevelProgress: {
              unlocked: false,
              currentTier: 'second',
              levelCap: 99,
            },
            lawFragments: {
              time: 0, space: 0, gold: 0, wood: 0, water: 0,
              fire: 0, earth: 0, light: 0, dark: 0, chaos: 0,
            },
            lawsFused: {
              time: false, space: false, gold: false, wood: false, water: false,
              fire: false, earth: false, light: false, dark: false, chaos: false,
            },
             lawsConsumedForBreakthrough: [],
             pendingLawFragmentChoices: 0,
           },
             reincarnation: {
              count: newCount,
              totalAttackBonus: newAttackBonus,
              totalRingYearBonus: newRingBonus,
              ringYearBonusPct: newRingBonusPct,
              orbs,
            },
          // 成就数据：永久保留，不随轮回转世重置
          achievementStats: {
            ...(player.achievementStats ?? {} as any),
            newlyUnlocked: [],
          },
          // 🔴 v14.0 成就永久化：已解锁成就永远保留，转世不清空
          unlockedAchievements: Array.isArray(player.unlockedAchievements) ? [...player.unlockedAchievements] : [],
          // 🔴 v14.0 神位继承记录：每世继承的神位都累积记录（用于收集类成就）
           inheritedGodPositions: Array.isArray(player.inheritedGodPositions) ? [...player.inheritedGodPositions] : [],
           // 天梦冰蚕献祭奇遇：每世重置，转世后可再次触发
           tianmeng: {
             triggered: false,
             accepted: false,
             evolved: false,
           },
             // 🔴 v15.0 神装系统：转世后神装消失，需重新获得神位并集齐7块魂骨才可再次融合
             divineArmor: {
               hasArmor: false,
               armorItem: null,
               armorName: '',
               sourceBones: { ...EMPTY_SOUL_BONES },
               resonanceActive: false,
             },
               // 🔴 v16.0 神界系统：转世后刷新所有神界BOSS击败记录
               // unlocked 重置（需重新成神才开启入口），defeatedIds 清空以便重新挑战
               // divineCoreCrafted 重置（转世后背包清空，需重新收集碎片并合成）
               godRealm: {
                 unlocked: false, // 转世后入口关闭，需重新继承神位
                 defeatedIds: [], // 转世后清空击败记录，可重新挑战
                 divineCoreCrafted: false, // 转世后重置，需重新收集碎片合成
               },
              // 🔴 v17.0 侣系统：转世后全部清空，需重新获得青睐从头开始
                companions: {
                  accepted: [],
                  rejected: [],
                  details: {},
                  weaknessUntil: 0,
                  divorceCount: 0,
                  pendingTeaFavorId: null,
                  pendingFavorBeastId: null,
                  teaNodeCooldowns: {},
                },
          };

     // 重新计算血量
      const newAttrs = calcAttributes(newPlayer);
      newPlayer.currentHp = newAttrs.hp;

      // 5. 重置所有战斗相关的 React state（防御性清除）
      // 防止玩家在战斗结算界面直接转世，导致上一世的战斗状态/掉落残留到下一世
      setBattleState(null);
      setInBattle(false);
      setLastBattleResult({ phase: null, battleType: null, locationId: null, enemyId: null });
      // 清空探索状态，防止从子地点直接转世残留
      setExploration(null);

      // 6. 保存
      setPlayerState(newPlayer);
      pendingSaveRef.current = newPlayer;
      flushSave();

      return { success: true, newSoul: newMainSoul, newSecondSoul };
   };

  // 导出存档：返回 Base64 编码的 JSON 字符串
  // UTF-16 压缩：将 UTF-8 字节流打包进 UTF-16 编码单元，缩短约 50% 长度
  // 每 2 个字节存进 1 个 16-bit char，余数用特殊标识
  const utf16Compress = (str: string): string => {
    const out: string[] = [];
    let i = 0;
    const len = str.length;
    while (i < len) {
      const c1 = str.charCodeAt(i) & 0xff;
      const c2 = i + 1 < len ? str.charCodeAt(i + 1) & 0xff : 0;
      out.push(String.fromCharCode((c1 << 8) | c2));
      i += 2;
    }
    // 末尾加标记：原始长度的奇偶性（0=偶,1=奇），用最后一字节表示
    // 实际使用 btoa 输出，所以我们把长度也编码进去（通过前缀区分）
    return out.join('');
  };

  const utf16Decompress = (encoded: string): string => {
    const out: number[] = [];
    for (let i = 0; i < encoded.length; i++) {
      const code = encoded.charCodeAt(i);
      const hi = (code >> 8) & 0xff;
      const lo = code & 0xff;
      out.push(hi);
      if (lo !== 0 || i < encoded.length - 1) out.push(lo);
    }
    // 用 fromCharCode 拼接（字节是 0~255，即 latin1 范围）
    return String.fromCharCode(...out);
  };

  const exportSave = (): string => {
     try {
       flushSave();
       const raw = scopedStorage.getItem(SAVE_KEY);
       if (!raw) return '';
       // 步骤：JSON → 去掉空格（parse 再 stringify 无空格）→ UTF-8 字节 → UTF-16 压缩 → Base64 → 前缀 DL2_
       const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
       const compact = JSON.stringify(obj); // 紧凑 JSON，无空格
       // 先 encodeURIComponent 转 UTF-8 字节序列，再打包进 UTF-16
       const utf8Str = unescape(encodeURIComponent(compact));
       const compressed = utf16Compress(utf8Str);
       // 用 btoa 转 base64（compressed 是 16-bit char，latin1 范围内的 char 用 btoa 正常）
       // 注意：btoa 只接受 0-255 的 char，我们的 compressed 是 16-bit，需要先转成字节序列再 base64
       // 改用更直接方式：compressed 是 UTF-16 字符串，直接 encode + base64
       const b64 = btoa(unescape(encodeURIComponent(compressed)));
       return `DL2_${b64}`;
     } catch (err) {
       logger.error('exportSave failed:', String(err));
       return '';
     }
   };

   // 导入存档：校验格式 + 写入 + 重新加载
   const importSave = (code: string): { success: boolean; reason: string } => {
     try {
       const trimmed = code.trim();
       if (!trimmed) return { success: false, reason: '存档代码不能为空' };

       let jsonStr = '';
       if (trimmed.startsWith('DL2_')) {
         // 新格式：UTF-16 压缩 + Base64
         const b64 = trimmed.slice('DL2_'.length);
         try {
           const compressed = decodeURIComponent(escape(atob(b64)));
           const utf8Str = utf16Decompress(compressed);
           jsonStr = decodeURIComponent(escape(utf8Str));
         } catch {
           return { success: false, reason: '存档代码格式错误，无法解码' };
         }
       } else if (trimmed.startsWith('DL2_SAVE_')) {
         // 旧格式：纯 Base64（兼容）
         const b64 = trimmed.slice('DL2_SAVE_'.length);
         try {
           jsonStr = decodeURIComponent(escape(atob(b64)));
         } catch {
           return { success: false, reason: '存档代码格式错误，无法解码' };
         }
       } else {
         // 兼容：直接是 JSON 字符串
         jsonStr = trimmed;
       }

      // 校验 JSON 格式
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        return { success: false, reason: '存档代码不是有效的 JSON 格式' };
      }

      if (!parsed || typeof parsed !== 'object') {
        return { success: false, reason: '存档数据格式无效' };
      }

      // 基本字段校验（至少有 name 和 level）
      const obj = parsed as Record<string, unknown>;
      if (typeof obj.name !== 'string' || typeof obj.level !== 'number') {
        return { success: false, reason: '存档数据缺少必要字段，可能不是有效的存档代码' };
      }

      // 写入 localStorage 并重新加载
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    pendingSaveRef.current = null;
     try {
       safeWriteWithChecksum(SAVE_KEY, jsonStr);
       // 导入成功后同步写入备份，保证5层存档保护完整
       safeWriteWithChecksum(BACKUP_SAVE_KEY, jsonStr);
       try { localStorage.setItem(NATIVE_BACKUP_KEY, jsonStr); } catch (_e) { /* ignore */ }
     } catch (err) {
       logger.error('importSave write failed:', String(err));
       return { success: false, reason: '写入存档失败' };
     }
     setHasSave(true);

      // 重新加载存档
      loadSave();

      return { success: true, reason: '存档导入成功，游戏将重新加载' };
    } catch (err) {
      logger.error('importSave failed:', String(err));
      return { success: false, reason: `导入失败：${String(err)}` };
    }
  };

   const setPlayer = (updater: (p: IPlayer) => IPlayer) => {
     setPlayerState((prev) => {
       if (!prev) return prev;
       const nextRaw = updater(prev);
       // 成就检测：每次状态变更后检查新解锁成就
       const next = normalizeGoldKing(checkAchievements(prev, nextRaw));
       // 节流写入：连续操作合并为一次 localStorage IO
       scheduleSave(next);
       return next;
     });
   };

  // ========== 成就系统 ==========
  // 武魂品质索引（用于成就检测）
  const getSoulQualityIndex = (quality: string): number => {
    switch (quality) {
      case 'common': return 1;
      case 'rare': return 2;
      case 'fine': return 3;
      case 'epic': return 4;
      case 'legendary': return 5;
      case 'divine': return 6;
      case 'superDivine': return 7;
      default: return 1;
    }
  };

  // 魂环品质索引（按 qualityLabel 文本判断）
  const getRingQualityIndex = (ring: { qualityLabel: string; color: string; years?: number }): number => {
    if (ring.color === 'gold') return 7;
    if (ring.color === 'blueWhite') return 6; // 天梦冰蚕百万年魂环，按百万年算
    const q = ring.qualityLabel || '';
    if (q.includes('百万年')) return 6;
    if (q.includes('十万年')) return 5;
    if (q.includes('万年')) return 4;
    if (q.includes('千年')) return 3;
    if (q.includes('百年')) return 2;
    if (q.includes('十年')) return 1;
    // 按年份兜底
    const y = ring.years ?? 0;
    if (y >= 1000000) return 6;
    if (y >= 100000) return 5;
    if (y >= 10000) return 4;
    if (y >= 1000) return 3;
    if (y >= 100) return 2;
    return 1;
  };

  // 魂骨品质索引（用年份近似）
  const getBoneQualityIndex = (bone: { years?: number; quality?: string }): number => {
    const y = bone.years ?? 0;
    if (y >= 1000000) return 6;
    if (y >= 100000) return 5;
    if (y >= 10000) return 4;
    if (y >= 1000) return 3;
    if (y >= 100) return 2;
    return 1;
  };

  // 魂灵品质索引：与items.ts中ITEM_QUALITY_MAP一致
  const getSpiritQualityIndex = (quality: string): number => {
    switch (quality) {
      case 'white': return 1;
      case 'yellow': return 2;
      case 'purple': return 3;
      case 'black': return 4;
      case 'red': return 5;
      case 'gold': return 6;
      case 'god': return 7;
      case 'supreme': return 8;
      default: return 1;
    }
  };

  // 检测成就进度
  const computeAchievementProgress = (p: IPlayer, ach: IAchievement): { current: number; target: number; completed: boolean } => {
    const tgt = ach.target;
    let current = 0;
    let target = 1;

    switch (ach.checkType) {
      case 'level':
        current = p.level;
        target = tgt as number;
        break;
      case 'ringCount': {
        // 魂环数量取两个武魂中较多的那个（天梦冰蚕在次修时主修可能0环）
        const mainCount = p.soulRings.length;
        const secondCount = p.isTwinSoul && p.secondSoulRings ? p.secondSoulRings.length : 0;
        current = Math.max(mainCount, secondCount);
        target = tgt as number;
        break;
      }
      case 'ringQuality': {
        // 两个武魂都检查，取最高品质
        const bestMain = p.soulRings.reduce((mx, r) => Math.max(mx, getRingQualityIndex(r)), 0);
        const bestSecond = p.isTwinSoul && p.secondSoulRings
          ? p.secondSoulRings.reduce((mx, r) => Math.max(mx, getRingQualityIndex(r)), 0)
          : 0;
        current = Math.max(bestMain, bestSecond);
        target = tgt as number;
        break;
      }
      case 'boneCount': {
        // 神装转化后从 sourceBones 读取，否则从 soulBones 读取
        let bones: any[];
        if (p.divineArmor?.hasArmor && p.divineArmor.sourceBones) {
          bones = Object.values(p.divineArmor.sourceBones).filter((b) => !!b);
        } else {
          bones = Object.values(p.soulBones || {}).filter((b) => !!b);
        }
        current = bones.length;
        target = tgt as number;
        break;
      }
      case 'boneQuality': {
        // 神装转化后从 sourceBones 读取，否则从 soulBones 读取
        let bonesList: IItem[];
        if (p.divineArmor?.hasArmor && p.divineArmor.sourceBones) {
          bonesList = Object.values(p.divineArmor.sourceBones).filter(Boolean) as IItem[];
        } else {
          bonesList = Object.values(p.soulBones || {}).filter(Boolean) as IItem[];
        }
        const best = bonesList.reduce((mx, b) => Math.max(mx, getBoneQualityIndex({ years: b.soulBoneYears ?? 0 })), 0);
        current = best;
        target = tgt as number;
        break;
      }
      case 'beastKills':
        current = p.achievementStats?.totalBeastKills ?? 0;
        target = tgt as number;
        break;
      case 'fierceBeast':
        current = p.achievementStats?.fierceBeastDefeated ? 1 : 0;
        target = 1;
        break;
      case 'beastKillsMaxQuality':
        current = p.achievementStats?.bestBeastQualityIndex ?? 0;
        target = tgt as number;
        break;
      case 'divineInherit':
        // 🔴 v14.0 神位成就特殊处理：从 inheritedGodPositions 历史记录判断
        // 每世继承不同神位都会记录到 inheritedGodPositions，玩家可以收集多个神位成就
        // 每个神位成就只触发一次（unlockedAchievements 永久保存后自动跳过）
        current = Array.isArray(p.inheritedGodPositions) && p.inheritedGodPositions.includes(tgt as string) ? 1 : 0;
        target = 1;
        break;
      case 'divineTier': {
        // 成就 target: 1=至高/2=神王/3=一级/4=二级
        // 从 inheritedGodPositions 历史记录中找最高 tier（转世后也能保留成就进度）
        // tierScore: supreme=4, king=3, first=2, second=1
        let tierScore = 0;
        const inheritedList = Array.isArray(p.inheritedGodPositions) ? p.inheritedGodPositions : [];
        // 同时考虑当前世正在继承的神考
        const currentTrialId = p.divineTrial?.inherited ? p.divineTrial.chosenTrialId : null;
        const allGodIds = currentTrialId ? [...inheritedList, currentTrialId] : inheritedList;
        for (const gid of allGodIds) {
          const trial = getTrialById(gid);
          if (!trial) continue;
          let s = 0;
          if (trial.tier === 'supreme') s = 4;
          else if (trial.tier === 'king') s = 3;
          else if (trial.tier === 'first') s = 2;
          else if (trial.tier === 'second') s = 1;
          if (s > tierScore) tierScore = s;
        }
        const tgtNum = tgt as number; // 1=至高 / 2=神王 / 3=一级 / 4=二级
        const targetScore = 5 - tgtNum; // 1→4, 2→3, 3→2, 4→1
        current = tierScore;
        target = targetScore;
        break;
      }
      case 'soulQuality': {
        const mainIdx = getSoulQualityIndex(p.martialSoul.quality);
        const secondIdx = p.secondSoul ? getSoulQualityIndex(p.secondSoul.quality) : 0;
        current = Math.max(mainIdx, secondIdx);
        target = tgt as number;
        break;
      }
      case 'twinSoul': {
        // 双生武魂 + 双武魂九环全满（对应『双生武魂·九环同辉』成就）
        const main9 = p.soulRings.length >= 9;
        const second9 = p.isTwinSoul && p.secondSoulRings && p.secondSoulRings.length >= 9;
        current = (p.isTwinSoul && main9 && second9) ? 1 : 0;
        target = 1;
        break;
      }
      case 'twinSoulAwake':
        // 仅检测是否觉醒双生武魂（对应『双生武魂』成就）
        current = p.isTwinSoul ? 1 : 0;
        target = 1;
        break;
      case 'reincarnation':
        current = p.reincarnation?.count ?? 0;
        target = tgt as number;
        break;
      case 'academy': {
        const rank = p.academyRank;
        let level = 0;
        if (rank === 'freshman' || rank === 'outer' || rank === 'inner' || rank === 'sea-god') level = 1;
        if (rank === 'inner' || rank === 'sea-god') level = 2;
        if (rank === 'sea-god') level = 3;
        current = level;
        target = tgt as number;
        break;
      }
      case 'artifact':
        current = p.divineTrial?.artifactDrawn ? 1 : 0;
        target = 1;
        break;
      case 'domain':
        current = p.domain ? 1 : 0;
        target = 1;
        break;
      case 'soulSpirit':
        current = p.soulSpirits?.length ?? 0;
        target = tgt as number;
        break;
      case 'craftGuide':
        current = p.achievementStats?.craftedGuide ? 1 : 0;
        target = 1;
        break;
      case 'herb':
        current = p.achievementStats?.herbTypesTaken ?? 0;
        target = tgt as number;
        break;
      case 'lifeWater':
        current = p.achievementStats?.lifeWaterTaken ? 1 : 0;
        target = 1;
        break;
      case 'arenaWin':
        current = p.achievementStats?.arenaTotalWins ?? 0;
        target = tgt as number;
        break;
      case 'arenaStreak':
        current = p.achievementStats?.arenaBestStreak ?? 0;
        target = tgt as number;
        break;
      case 'seaGod':
        current = p.seaGodDefeatedIds?.length ?? 0;
        target = tgt as number;
        break;
      case 'hundredLevel':
        current = p.divineTrial?.inherited ? 1 : 0;
        target = 1;
        break;
      case 'companionCount': {
        const details = p.companions?.details ?? {};
        current = Object.keys(details).length;
        target = tgt as number;
        break;
      }
      case 'lover': {
        const details = p.companions?.details ?? {};
        const hasLover = Object.values(details).some((d) => d?.isLover);
        current = hasLover ? 1 : 0;
        target = 1;
        break;
      }
      case 'spouse': {
        const details = p.companions?.details ?? {};
        const hasSpouse = Object.values(details).some((d) => d?.isSpouse);
        current = hasSpouse ? 1 : 0;
        target = 1;
        break;
      }
      case 'teaCityCount': {
        // 茶城人物从伴侣中识别（id前缀tc-）
        const details = p.companions?.details ?? {};
        const teaIds = Object.keys(details).filter((k) => k.startsWith('tc-'));
        current = teaIds.length;
        target = tgt as number;
        break;
      }
      case 'allTeaCity': {
        const details = p.companions?.details ?? {};
        const teaIds = Object.keys(details).filter((k) => k.startsWith('tc-'));
        // 茶城目前共9位人物，达到7个即视为"结识大部分"展示成就
        current = teaIds.length >= 7 ? 1 : 0;
        target = 1;
        break;
      }
      case 'divineArmor':
        current = p.divineArmor?.hasArmor ? 1 : 0;
        target = 1;
        break;
      case 'godRealmBoss': {
        const defeated = p.godRealm?.defeatedIds ?? [];
        current = defeated.includes(tgt as string) ? 1 : 0;
        target = 1;
        break;
      }
      case 'godRealmKills':
        current = (p.godRealm?.defeatedIds ?? []).length;
        target = tgt as number;
        break;
      case 'liangyiEye':
        // 使用实际进入次数统计，而非仙草种类数近似
        current = p.achievementStats?.liangyiEyeEnterCount ?? 0;
        target = tgt as number;
        break;
      case 'supremeSoul': {
        // 至高神级/超神级武魂判断（supremeDivine/superDivine都算）
        const mainQ = p.martialSoul.quality;
        const secondQ = p.secondSoul?.quality;
        const isSupreme = mainQ === 'supremeDivine' || mainQ === 'superDivine' || secondQ === 'supremeDivine' || secondQ === 'superDivine';
        current = isSupreme ? 1 : 0;
        target = 1;
        break;
      }
      case 'luosanpaoEvolve': {
        // 罗三炮进化阶段：0=未进化/未觉醒罗三炮, 1=耀阳圣龙
        const evolved = p.martialSoul.name === '耀阳圣龙' || p.secondSoul?.name === '耀阳圣龙';
        const isSanpao = p.martialSoul.name === '罗三炮' || p.secondSoul?.name === '罗三炮';
        const stage = evolved ? 1 : (isSanpao ? 0 : 0);
        current = (tgt as number) === 0 ? (isSanpao ? 1 : 0) : (evolved ? 1 : 0);
        target = 1;
        break;
      }
      case 'qibaoEvolve': {
        const evolved = p.martialSoul.name === '九宝玲珑塔' || p.secondSoul?.name === '九宝玲珑塔';
        current = evolved ? 1 : 0;
        target = 1;
        break;
      }
      case 'divineInheritCount':
        current = Array.isArray(p.inheritedGodPositions) ? p.inheritedGodPositions.length : 0;
        target = tgt as number;
        break;
      case 'boneFullSet': {
        const bones = Object.values(p.soulBones || {}).filter(Boolean);
        current = bones.length >= 7 ? 1 : 0;
        target = 1;
        break;
      }
      case 'boneMillion': {
        const bones = Object.values(p.soulBones || {}).filter(Boolean) as IItem[];
        const hasMillion = bones.some((b) => (b.soulBoneYears ?? 0) >= 1_000_000);
        current = hasMillion ? 1 : 0;
        target = 1;
        break;
      }
      case 'soulSpiritGod': {
        // 神级魂灵：majorIndex >= 9 (神级)
        const spirits = p.soulSpirits ?? [];
        const hasGod = spirits.some((s) => s.majorIndex >= 9);
        current = hasGod ? 1 : 0;
        target = 1;
        break;
      }
      case 'reincarnation99':
        current = (p.reincarnation?.count ?? 0) >= 99 ? 1 : 0;
        target = 1;
        break;
      case 'tianmeng':
        // 天梦冰蚕成就：接受过献祭即算完成（武魂进化为冰灵之眸）
        // 🔴 修复：原逻辑检查 secondSoul.name === '天梦冰蚕' 永远不成立（天梦冰蚕是魂兽名，武魂进化后叫冰灵之眸）
        // 改为检查 tianmeng.accepted 标记，转世后新完成也能正常触发（成就永久化由 unlockedAchievements 保证）
        current = p.tianmeng?.accepted ? 1 : 0;
        target = 1;
        break;
      case 'divineSoulRing':
        current = p.divineTrial?.divineSoulRing ? 1 : 0;
        target = 1;
        break;
      case 'soulSpiritQuality': {
        // 魂灵最高大境界索引（近似品质）
        const spirits = p.soulSpirits ?? [];
        let maxIdx = 0;
        for (const s of spirits) {
          if (s.majorIndex > maxIdx) maxIdx = s.majorIndex;
        }
        current = maxIdx;
        target = tgt as number;
        break;
      }
      default:
        current = 0;
        target = 1;
    }

    return { current, target, completed: current >= target };
  };

  // 检查并解锁新成就（在 setPlayer 变更后调用）
  // 🔴 v14.0 成就永久化：
  // - 已解锁成就存入 unlockedAchievements 永久数组，转世不重置
  // - 神位成就基于 inheritedGodPositions 历史记录判断（每世继承不同神位都算）
  // - 每一世只会解锁新的成就，已解锁的不会重复触发
  const checkAchievements = (prev: IPlayer, next: IPlayer): IPlayer => {
    const stats = next.achievementStats ?? {
      totalBeastKills: 0, arenaTotalWins: 0, arenaBestStreak: 0,
      herbTypesTaken: 0, lifeWaterTaken: false, craftedGuide: false,
      fierceBeastDefeated: false, bestBeastQualityIndex: 0, newlyUnlocked: [],
      liangyiEyeEnterCount: 0,
    };
    const newly: string[] = [...(stats.newlyUnlocked || [])];
    const permanentUnlocked: string[] = Array.isArray(next.unlockedAchievements) ? [...next.unlockedAchievements] : [];
    let changed = false;
    let permanentChanged = false;

    for (const ach of ACHIEVEMENTS) {
      // 永久已解锁的成就跳过检测，不会重复触发
      if (permanentUnlocked.includes(ach.id)) continue;

      const after = computeAchievementProgress(next, ach).completed;
      if (after) {
        // 新解锁：加入永久列表 + 新解锁提示列表
        permanentUnlocked.push(ach.id);
        permanentChanged = true;
        if (!newly.includes(ach.id)) {
          newly.push(ach.id);
          changed = true;
        }
      }
    }

    if (permanentChanged || changed) {
      const result = { ...next, unlockedAchievements: permanentUnlocked };
      if (changed) {
        result.achievementStats = { ...stats, newlyUnlocked: newly };
      }
      return result;
    }
    return next;
  };

  // 清除新成就提示
  const clearNewAchievements = () => {
    setPlayerState((p) => {
      if (!p) return p;
      return { ...p, achievementStats: { ...(p.achievementStats ?? {} as any), newlyUnlocked: [] } };
    });
  };

  const setTitle = (title: string) => {
    setPlayer((p) => {
      // 已有封号则不可修改（一生只有一次命名机会）
      if (p.title) return p;
      return { ...p, title };
    });
  };

  const setDomain = (domain: IDomain | null) => {
    setPlayer((p) => ({ ...p, domain }));
  };

  const setSecondDomain = (domain: IDomain | null) => {
    setPlayer((p) => ({ ...p, secondDomain: domain }));
  };

  const addExp = (exp: number) => {
    let leveledUp = false;
    let newLevel = 0;
    let bottleneck = false;
    let blocked = false; // 因缺魂环被阻断
    setPlayer((p) => {
      // 如果当前境界缺少魂环（应有的环数 > 已有环数），则经验不再累积
      const expectedRings = getMaxRings(p.level);
      if (p.soulRings.length < expectedRings) {
        blocked = true;
        // 魂环不足时：经验仍然累积到当前等级满级满经验后停止（与瓶颈行为一致），避免玩家历练零收益困惑
        const maxExp = getMaxExp(p.level);
        if (p.exp >= maxExp) return p; // 已经满级满经验，不增加
        const newExp = Math.min(maxExp, p.exp + exp);
        return { ...p, exp: newExp };
      }

      let curExp = p.exp + exp;
      let curLevel = p.level;
      let curHp = p.currentHp;
      // 🔴 武魂专属等级限制标记（用于下面的升级循环判断）
      // 罗三炮未进化：终身卡29级（29级是瓶颈，需要光属性魂环闭关突破）
      // 七宝琉璃塔未进化：最高79级（79级是瓶颈，需绮罗郁金香进化后突破）
      const isLuosanpaoLocked = p.martialSoul.name === '罗三炮';
       const isQibaoLiuliLocked = p.martialSoul.name === '七宝琉璃塔' || p.secondSoul?.name === '七宝琉璃塔';
      while (true) {
        const maxExp = getMaxExp(curLevel);
        if (curExp < maxExp) break;
        if (isBottleneck(curLevel, p.brokenBottlenecks)) {
          // 瓶颈，经验停在满级满
          curExp = maxExp;
          bottleneck = true;
          break;
        }
          if (curLevel >= 99) {
            // 百级以上逻辑：已解锁神级修炼且未达等级上限时可继续升级
            const glp = p.divineTrial?.godLevelProgress;
            // 🔴 自动解锁：继承神位 + 击败混沌茶 → 自动解锁百级修炼
            let newDivTrial = p.divineTrial;
            if (!glp?.unlocked && p.divineTrial?.inherited) {
              const hundunDetail = p.companions?.details?.['tc-hunduncha'];
              if (hasDefeatedHundun(p)) {
                const trial = DIVINE_TRIALS.find(t => t.id === p.divineTrial!.chosenTrialId);
                const tier = (trial?.tier as 'second' | 'first' | 'king' | 'supreme') || 'second';
                const cap = getGodLevelCap(tier);
                newDivTrial = {
                  ...p.divineTrial!,
                  godLevelProgress: {
                    unlocked: true,
                    currentTier: tier,
                    levelCap: cap,
                  },
                };
                p = { ...p, divineTrial: newDivTrial };
              }
            }
            const actualGlp = p.divineTrial?.godLevelProgress;
            if (actualGlp?.unlocked && curLevel < actualGlp.levelCap) {
             // 百级以上也有瓶颈（x9级），遇到瓶颈就停住
             if (isBottleneck(curLevel, p.brokenBottlenecks)) {
               const cap = getMaxExp(curLevel, p.easterRealmStage);
               if (curExp > cap) curExp = cap;
               bottleneck = true;
               break;
             }
             // 继续升级（百级以上不受魂环数量限制）
             const nextLevel = curLevel + 1;
              if (nextLevel > actualGlp.levelCap) {
               // 达上限，停在满级满经验
               const cap = getMaxExp(curLevel, p.easterRealmStage);
               if (curExp > cap) curExp = cap;
               break;
             }
              curExp -= maxExp;
              curLevel = nextLevel;
              leveledUp = true;
              const attrs = calcAttributes({ ...p, level: curLevel });
              curHp = attrs.hp;
              // 🔴 每升2级获得1次法则碎片选择机会（从100级起算：102/104/106...）
              // 且碎片总数未达上限（9法则×3碎片=27）
              const lf = p.divineTrial?.lawFragments;
              const totalFragments = lf ? Object.keys(lf).filter(k => k !== 'chaos').reduce((s, k) => s + (lf[k as keyof typeof lf] as number || 0), 0) : 0;
              const fusedLaws = p.divineTrial?.lawsFused;
              const fusedCount = fusedLaws ? Object.keys(fusedLaws).filter(k => k !== 'chaos' && fusedLaws[k as keyof typeof fusedLaws]).length : 0;
              // 剩余可获得碎片 = 27 - 已获碎片 - 已融合法则×3（融合消耗3个）
              const remainingFragments = 27 - totalFragments - fusedCount * 3;
              if (curLevel > 100 && (curLevel - 100) % 2 === 0 && remainingFragments > 0) {
                const dt = p.divineTrial!;
                p.divineTrial = {
                  ...dt,
                  pendingLawFragmentChoices: (dt.pendingLawFragmentChoices || 0) + 1,
                };
              }
              // 🔴 至高神151~159级：每级额外获得1个混沌法则碎片（共9个）
              const tier = p.divineTrial?.godLevelProgress?.currentTier;
              if (tier === 'supreme' && curLevel >= 151 && curLevel <= 159) {
                const dt = p.divineTrial!;
                const currentChaos = dt.lawFragments?.chaos || 0;
                if (currentChaos < 9) {
                  p.divineTrial = {
                    ...dt,
                    lawFragments: { ...dt.lawFragments, chaos: currentChaos + 1 },
                  };
                }
              }
              continue; // 继续循环判断
           }
           // 未解锁或已达上限：经验累积到当前阶段上限，不自动升级
           const cap = getMaxExp(curLevel, p.easterRealmStage);
           if (curExp > cap) curExp = cap;
           break;
         }
        // 检查下一级是否需要更多魂环，如果魂环不足则卡在当前等级
        const nextLevel = curLevel + 1;
        const nextMaxRings = getMaxRings(nextLevel);
        if (nextMaxRings > p.soulRings.length) {
          curExp = maxExp;
          break;
        }
        curExp -= maxExp;
        curLevel += 1;
        leveledUp = true;
        // 升级回满血
        const attrs = calcAttributes({ ...p, level: curLevel });
        curHp = attrs.hp;
      }
      newLevel = curLevel;
      // 自动结算待发放等级奖励（非瓶颈、非满级时）
      let pendingBonus = p.divineTrial.pendingLevelBonus ?? 0;
      if (pendingBonus > 0 && curLevel < 99 && !isBottleneck(curLevel, p.brokenBottlenecks)) {
        // 同时检查魂环数量限制，避免神考等级奖励绕过魂环瓶颈
        while (pendingBonus > 0 && curLevel < 99 && !isBottleneck(curLevel + 1) && getMaxRings(curLevel + 1) <= p.soulRings.length && !(isQibaoLiuliLocked && curLevel >= 79) && !(isLuosanpaoLocked && curLevel >= 29)) {
          curLevel += 1;
          pendingBonus -= 1;
          leveledUp = true;
        }
        // 升级后重新计算血量
        if (leveledUp) {
          const attrs = calcAttributes({ ...p, level: curLevel });
          curHp = attrs.hp;
          newLevel = curLevel;
        }
      }
      const newDivineTrial = pendingBonus !== (p.divineTrial.pendingLevelBonus ?? 0)
        ? { ...p.divineTrial, pendingLevelBonus: pendingBonus }
        : p.divineTrial;
      // 天梦冰蚕魂环：升级后重算伤害百分比（按大境界成长）
      // 主修武魂 + 次修武魂 都检查并重算（双生武魂双端适配）
      let newSoulRings2 = p.soulRings;
      let newSecondSoulRings2 = p.secondSoulRings;
      if (leveledUp && p.soulRings.some((r) => r.color === 'blueWhite')) {
        const res = refreshTianmengDamagePct(p.soulRings, curLevel, '历练升级');
        newSoulRings2 = res.rings;
      }
      if (leveledUp && p.isTwinSoul && p.secondSoulRings && p.secondSoulRings.some((r) => r.color === 'blueWhite')) {
        const res2 = refreshTianmengDamagePct(p.secondSoulRings, curLevel, '历练升级（次修）');
        newSecondSoulRings2 = res2.rings;
      }
      return {
        ...p,
        exp: curExp,
        level: curLevel,
        currentHp: curHp,
        divineTrial: newDivineTrial,
        soulRings: newSoulRings2,
        secondSoulRings: newSecondSoulRings2,
      };
    });
    return { leveledUp, newLevel, bottleneck, blocked };
  };

  const addCoins = (amount: number) => {
    setPlayer((p) => ({ ...p, soulCoins: p.soulCoins + amount }));
  };

   const addItem = (item: IItem): boolean => {
     setPlayer((p) => {
       // 可堆叠物品：材料 / 消耗品 / 特殊物品（相同 name + type 视为同一种，材料还需品质一致）
        const stackable = item.type === 'material' || item.type === 'consumable' || item.type === 'special';
        if (stackable) {
          const idx = p.inventory.findIndex((it) => {
            if (it.name !== item.name || it.type !== item.type) return false;
            if (item.type === 'material') {
              // 材料需品质一致才堆叠
              return (it.materialQuality || 'common') === (item.materialQuality || 'common');
            }
            return true;
          });
         if (idx >= 0) {
           const newInv = [...p.inventory];
           newInv[idx] = { ...newInv[idx], quantity: (newInv[idx].quantity ?? 1) + (item.quantity ?? 1) };
           return { ...p, inventory: newInv };
         }
       }
       // 不可堆叠或背包中没有同类：新增一格（带唯一 id），背包无上限
       const newItem = { ...item, id: `${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
       if (stackable && newItem.quantity === undefined) newItem.quantity = 1;
       return {
         ...p,
         inventory: [...p.inventory, newItem],
       };
     });
      return true;
    };

  // 服用消耗品
  const useConsumable = (itemInstanceId: string): { success: boolean; reason?: string; itemName?: string } => {
    let result: { success: boolean; reason?: string; itemName?: string } = { success: false };
    setPlayer((p) => {
      const item = p.inventory.find((i) => i.id === itemInstanceId);
      if (!item || item.type !== 'consumable') {
        result = { success: false, reason: '物品不存在或不可服用' };
        return p;
      }
      const extra = getConsumableExtra(item);
      if (!extra) {
        result = { success: false, reason: '该物品无法服用' };
        return p;
      }
      // 检查服用上限（防御性：次数非数字/负数按0算）
      const rawCount = p.consumableCounts?.[extra.capKey];
      const currentCount = typeof rawCount === 'number' && !isNaN(rawCount) && rawCount >= 0 ? Math.floor(rawCount) : 0;
      if (currentCount >= extra.cap) {
        result = { success: false, reason: `已达服用上限（${currentCount}/${extra.cap}）` };
        return p;
      }
      // 圣龙耀阳草专属限制：仅罗三炮武魂可服用，已进化为耀阳圣龙后不可再服
      if (extra.subType === 'sacred-dragon') {
        const soulName = p.martialSoul.name;
        if (soulName === '耀阳圣龙') {
          result = { success: false, reason: '已进化为耀阳圣龙，无需再次服用' };
          return p;
        }
        if (soulName !== '罗三炮') {
          result = { success: false, reason: '仅罗三炮武魂可服用圣龙耀阳草' };
          return p;
        }
      }
      // 绮罗郁金香专属限制：仅辅助系武魂可服用（主修或次修任一为辅助系即可）
       // 七宝琉璃塔服用后额外进化为九宝玲珑塔（解除79级限制）
       // 其他辅助武魂服用后获得属性加成，不触发进化
       if (extra.specialEffect === 'evolve-tulip') {
         const mainAttr = getCultivationAttr(p.martialSoul);
         const secondAttr = p.isTwinSoul && p.secondSoul ? getCultivationAttr(p.secondSoul) : undefined;
         if (mainAttr !== 'support' && secondAttr !== 'support') {
           result = { success: false, reason: '仅辅助系武魂可服用绮罗郁金香' };
           return p;
         }
       }
      // 检查属性要求（元素要求）：与 UI 层 InventoryPanel 逻辑保持一致
      if (extra.elementReq.length > 0) {
        // 与 InventoryPanel.tsx 的 GRASS_ATTR_TO_STANDARD 完全一致，两份必须同步
        const GRASS_ATTR_TO_STANDARD: Record<string, string[]> = {
          '毒属性': ['木属性'],
          '暗属性': ['黑暗属性'],
          '力量属性': ['金属性'],
          '生命属性': ['木属性', '水属性'],
          '冰属性': ['冰属性'],
          '火属性': ['火属性'],
          '水属性': ['水属性'],
          '雷属性': ['雷属性'],
          '风属性': ['风属性'],
          '光明属性': ['光明属性'],
          '黑暗属性': ['黑暗属性'],
          '精神属性': ['精神属性'],
          '金属性': ['金属性'],
          '木属性': ['木属性'],
          '土属性': ['土属性'],
          '混沌属性': ['混沌属性'],
          // 仙草复合属性
          '气血/全属性': [],
          '全属性': [],
          '辅助属性': [],
          '防御属性': ['土属性'],
          '速度属性': ['风属性'],
        };
        const getStandardElements = (el: string): string[] => {
          const key = el.endsWith('属性') ? el : el + '属性';
          return GRASS_ATTR_TO_STANDARD[key] || [key];
        };
         const souls = [p.martialSoul];
         if (p.isTwinSoul && p.secondSoul) souls.push(p.secondSoul);
         // 武魂元素归一化为「X属性」标准格式
         // 极致属性（如「极致之冰」「极致之火」）也同步归一，确保极致武魂能正确匹配同属性灵草
         const soulElements = souls.flatMap((s) => {
           const results: string[] = [];
           const raw = s.element || getSoulElement(s.name) || '';
           if (raw) {
             const key = raw.endsWith('属性') ? raw : raw + '属性';
             results.push(key);
           }
           const extreme = s.extremeAttribute;
           if (extreme && extreme !== '无') {
             if (extreme === '全属性') {
               results.push('全属性');
             } else if (extreme.startsWith('极致之')) {
               const attr = extreme.replace('极致之', '');
               results.push(attr.endsWith('属性') ? attr : attr + '属性');
             }
           }
           return results;
         });
        // 归一化灵草要求
        const requiredStandard = extra.elementReq.flatMap((req) => getStandardElements(req));
         let match = false;
         // 混沌属性武魂可以适配所有属性的灵草仙草
         const hasChaosSoul = soulElements.some((el) => el === '混沌属性');
        if (hasChaosSoul) {
          match = true;
        } else if (requiredStandard.length > 0) {
          match = requiredStandard.some((req) =>
            soulElements.some((el) =>
              el === req || el.includes(req.replace('属性', '')) || req.includes(el.replace('属性', ''))
            )
          );
        } else {
          match = true; // 空要求 = 不限属性
        }
        if (!match) {
          result = { success: false, reason: '属性不符' };
          return p;
        }
      }
      // 计算属性加成
      const bonus = { ...p.consumableBonus };
      const counts = { ...(p.consumableCounts || {}) };
      counts[extra.capKey] = currentCount + 1;

      const attrs = calcAttributes(p);
      // 修炼方向加成（仙草专用：按武魂修炼方向加指定属性数值）
       // 双生武魂时优先取主修方向；若主修不符合（如七宝为次修），取次修方向
       if (extra.cultivationBonus && extra.cultivationBonus > 0) {
         const mainAttr = getCultivationAttr(p.martialSoul);
         const secondAttr = p.isTwinSoul && p.secondSoul ? getCultivationAttr(p.secondSoul) : undefined;
         let cultAttr = mainAttr;
         // 若主修方向没有匹配的加成类型，但次修有，则用次修方向
         if (!['strength', 'agility', 'spirit', 'defense', 'support'].includes(mainAttr) && secondAttr) {
           cultAttr = secondAttr;
         }
         const bonusVal = extra.cultivationBonus;
         if (cultAttr === 'strength') bonus.attackFix += bonusVal;
         else if (cultAttr === 'agility') bonus.speedFix += bonusVal;
         else if (cultAttr === 'spirit') bonus.spiritFix += bonusVal;
         else if (cultAttr === 'defense') bonus.defenseFix += bonusVal;
         else if (cultAttr === 'support') bonus.spiritFix += bonusVal; // 辅助系加精神
       }
      // 固定数值加成（仙草/灵草/极寒冰玉：直接加固定属性）
      if (extra.fixedBonus) {
        const fb = extra.fixedBonus;
        if (fb.allAttr) {
          bonus.attackFix += fb.allAttr;
          bonus.defenseFix += fb.allAttr;
          bonus.speedFix += fb.allAttr;
          bonus.spiritFix += fb.allAttr;
          bonus.hpFix += fb.allAttr * 5;
        }
        if (fb.attack) bonus.attackFix += fb.attack;
        if (fb.defense) bonus.defenseFix += fb.defense;
        if (fb.speed) bonus.speedFix += fb.speed;
        if (fb.spirit) bonus.spiritFix += fb.spirit;
        if (fb.hp) bonus.hpFix += fb.hp;
      }
      // 百分比加成（仅生命之水等特殊物品保留）
      if (extra.attrBonus) {
        if (extra.attrBonus.allAttr) bonus.allAttrPct += extra.attrBonus.allAttr / 100;
        if (extra.attrBonus.attack) bonus.attackPct += extra.attrBonus.attack / 100;
        if (extra.attrBonus.defense) bonus.defensePct += extra.attrBonus.defense / 100;
        if (extra.attrBonus.speed) bonus.speedPct += extra.attrBonus.speed / 100;
        if (extra.attrBonus.spirit) bonus.spiritPct += extra.attrBonus.spirit / 100;
        if (extra.attrBonus.hp) bonus.hpPct += extra.attrBonus.hp / 100;
      }
      if (extra.subType === 'element-spirit' && !extra.fixedBonus) {
        // 旧版元素灵草兜底（如果没定义fixedBonus）
        bonus.attackFix += 30;
        bonus.spiritFix += 20;
      }

      // 从背包中扣除 1 个（stackable，按name+type找）
      const newInv = [...p.inventory];
      const idx = newInv.findIndex((i) => i.id === itemInstanceId);
      if (idx >= 0) {
        const qty = newInv[idx].quantity ?? 1;
        if (qty <= 1) {
          newInv.splice(idx, 1);
        } else {
          newInv[idx] = { ...newInv[idx], quantity: qty - 1 };
        }
      }

      // 更新血量上限后，当前血量按比例增加（避免加成后掉血比例异常）
      let newHp = p.currentHp;
      if (bonus.hpPct > 0 || bonus.hpFix > 0 || bonus.allAttrPct > 0) {
        const prevMax = attrs.hp;
        const nextPlayer = { ...p, consumableBonus: bonus };
        const nextMax = calcAttributes(nextPlayer as IPlayer).hp;
        if (nextMax > prevMax && prevMax > 0) {
          newHp = Math.floor(p.currentHp * (nextMax / prevMax));
        }
      }

      result = { success: true, itemName: item.name };

      // 🔴 仙草服用成功后立即存档（绕过200ms节流），防止玩家服用后立刻大退/切后台丢数据
      // 仙草属于高价值消耗品，宁可多一次IO也不能吞草
      setTimeout(() => flushSave(), 0);

      // 成就统计：仙草/生命之水
      const stats = p.achievementStats ?? {} as any;
      const newStats = { ...stats };
      const isHerb = extra.subType === 'immortal' || extra.subType === 'element-spirit' || extra.subType === 'attribute-spirit' || extra.subType === 'ice-fire-immortal' || extra.subType === 'holy-grass';
      if (isHerb) {
        // 按种类去重统计仙草种类数
        const herbSet: string[] = newStats._herbTypeSet ?? [];
        const herbKey = extra.capKey || item.name;
        if (!herbSet.includes(herbKey)) {
          newStats._herbTypeSet = [...herbSet, herbKey];
          newStats.herbTypesTaken = herbSet.length + 1;
        }
      }
      const isLifeWater = extra.capKey?.includes('lifeWater') || item.name?.includes('生命之水');
      if (isLifeWater) {
        newStats.lifeWaterTaken = true;
      }

      // 仙草特殊效果：武魂进化
      let evolvedSoul = p.martialSoul;
      let evolvedSecond = p.secondSoul;
      let soulRingsAfterEvolve = p.soulRings;
      let secondRingsAfterEvolve = p.secondSoulRings;
      if (extra.specialEffect && extra.specialEffect !== 'all-attr-pct') {
        // 先处理主修武魂进化
        const beforeName = p.martialSoul.name;
        evolvedSoul = evolveMartialSoul(p.martialSoul, extra.specialEffect);
        // 圣龙进化：重生魂技名称（保留年限、颜色、属性数值等）
        if (extra.specialEffect === 'evolve-shenglong' && beforeName === '罗三炮' && evolvedSoul.name === '耀阳圣龙') {
          const newSkills = evolvedSoul.soulSkills || [];
          soulRingsAfterEvolve = p.soulRings.map((ring, idx) => ({
            ...ring,
            skillName: newSkills[idx] || ring.skillName,
            skillDesc: `由耀阳圣龙武魂衍生的第${idx + 1}魂技，圣龙威压之下，万物臣服。`,
          }));
        }
        // 双生武魂且第二武魂也符合条件时同时进化（优先进化主修）
        if (p.isTwinSoul && p.secondSoul) {
          evolvedSecond = evolveMartialSoul(p.secondSoul, extra.specialEffect);
        }
      }

      return {
        ...p,
        inventory: newInv,
        growthRules: extra.subType === 'water-of-life' ? {version:3, waterOfLifePct:2, waterMigration:'current'} : p.growthRules,
        consumableCounts: counts,
        consumableBonus: bonus,
        currentHp: newHp,
        achievementStats: newStats,
        martialSoul: evolvedSoul,
        secondSoul: evolvedSecond,
        soulRings: soulRingsAfterEvolve,
        secondSoulRings: secondRingsAfterEvolve,
      };
    });
    return result;
  };

  // ==================== 材料转换 ====================
  // 转换规则：
  //   同等级不同材料互换：2:1
  //   高1级转低1级：1:2
  //   低1级转高1级：3:1
// 材料品阶（普通/精良/稀有）也影响比例：
//   同品质同等级：1:1
//   高品质转低品质：1:2
//   低品质转高品质：2:1
// 等级差和品质差叠加计算（相乘）
// 玩家任意等级均可使用材料转换，无等级限制
  const materialConvert = (params: { fromName: string; fromQty: number; toName: string; fromQuality?: string; toQuality?: string }): { success: boolean; reason?: string; gotQty?: number } => {
    const { fromName, fromQty, toName } = params;
    if (fromQty <= 0) return { success: false, reason: '数量必须大于0' };
    if (fromName === toName) return { success: false, reason: '不能转换相同材料' };

    let result = { success: false, reason: '转换失败', gotQty: 0 };

    setPlayer((p) => {
      // 1. 找源材料和目标材料（在 MATERIAL_ITEMS 模板中查找）
      const fromTemplate = MATERIAL_ITEMS.find(m => m.name === fromName);
      const toTemplate = MATERIAL_ITEMS.find(m => m.name === toName);
      if (!fromTemplate || !toTemplate) {
        result = { success: false, reason: '材料不存在', gotQty: 0 };
        return p;
      }

      const fromTier = fromTemplate.materialTier ?? 1;
      const toTier = toTemplate.materialTier ?? 1;
      const fromQuality = params.fromQuality ?? fromTemplate.materialQuality ?? 'common';
      const toQuality = params.toQuality ?? toTemplate.materialQuality ?? 'common';

      // 2. 计算转换比例
      // 等级差比例
      let tierRatio = 1;
      if (fromTier > toTier) {
        // 高级转低级：每差1级，1个高级 = 2个低级
        tierRatio = Math.pow(2, fromTier - toTier);
      } else if (fromTier < toTier) {
        // 低级转高级：每差1级，3个低级 = 1个高级
        tierRatio = 1 / Math.pow(3, toTier - fromTier);
      }

      // 品质差比例
      const qualityRank: Record<string, number> = { common: 1, fine: 2, rare: 3 };
      const fromQ = qualityRank[fromQuality] ?? 1;
      const toQ = qualityRank[toQuality] ?? 1;
      let qualityRatio = 1;
      if (fromQ > toQ) {
        qualityRatio = Math.pow(2, fromQ - toQ);
      } else if (fromQ < toQ) {
        qualityRatio = 1 / Math.pow(2, toQ - fromQ);
      }

      // 同级同品质不同材料互换：额外 2:1 损耗
      // 注意：同级不同品质时，qualityRatio 已经体现了品质差（2:1），不再叠加同级互换损耗
      let sameTierPenalty = 1;
      if (fromTier === toTier && fromQuality === toQuality) {
        sameTierPenalty = 1 / 2; // 2个换1个
      }

      // 总比例 = 等级差比例 × 品质差比例 × 同级互换损耗
      const totalRatio = tierRatio * qualityRatio * sameTierPenalty;

      // 4. 计算可获得数量（向下取整，至少1个）
      let gotQty = Math.floor(fromQty * totalRatio);
      if (gotQty < 1) {
        result = { success: false, reason: '数量不足，无法转换（至少获得1个）', gotQty: 0 };
        return p;
      }

      // 5. 检查背包中是否有足够的源材料（按名称+品质匹配堆叠）
       const fromIdx = p.inventory.findIndex(i => i.name === fromName && i.type === 'material' && i.materialQuality === fromQuality);
       if (fromIdx < 0) {
        result = { success: false, reason: '背包中没有该材料', gotQty: 0 };
        return p;
      }
      const haveQty = p.inventory[fromIdx].quantity ?? 1;
      if (haveQty < fromQty) {
        result = { success: false, reason: `材料数量不足（当前${haveQty}个）`, gotQty: 0 };
        return p;
      }

      // 6. 扣除源材料
      const newInv = [...p.inventory];
      const remaining = haveQty - fromQty;
      if (remaining <= 0) {
        newInv.splice(fromIdx, 1);
      } else {
        newInv[fromIdx] = { ...newInv[fromIdx], quantity: remaining };
      }

      // 7. 添加目标材料（按名称+品质堆叠，同名不同品质不合并）
       const toIdx = newInv.findIndex(i => i.name === toName && i.type === 'material' && i.materialQuality === toQuality);
      if (toIdx >= 0) {
        newInv[toIdx] = { ...newInv[toIdx], quantity: (newInv[toIdx].quantity ?? 1) + gotQty };
      } else {
        // 生成新物品（带唯一id，保持品质）
        newInv.push({
          ...toTemplate,
          id: `${toTemplate.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          quantity: gotQty,
        });
      }

      result = { success: true, gotQty, reason: undefined };
      return { ...p, inventory: newInv };
    });

    return result;
  };

  const addSoulRing = (ring: ISoulRing): boolean => {
    let success = false;
    setPlayer((p) => {
      const maxRings = getMaxRings(p.level);
      if (p.soulRings.length >= maxRings || p.soulRings.length >= 9) {
        return p;
      }
      success = true;
      return { ...p, soulRings: [...p.soulRings, ring] };
    });
    return success;
  };

  // ============================================================
  // 天梦冰蚕献祭奇遇
  // ============================================================
  // 触发条件：主修或次修武魂是灵眸（传说级）、等级10级、该武魂没有第一魂环、从未触发过
  // 双生武魂支持：两端都可能触发，以灵眸所在武魂为准
  const canTriggerTianmeng = (): boolean => {
    if (!player) {
      logger.info('[天梦冰蚕] 条件不满足：无玩家数据');
      return false;
    }
    if (player.tianmeng?.triggered) {
      logger.info('[天梦冰蚕] 条件不满足：已触发过');
      return false;
    }
    // 等级需达到10级（即能拥有第一魂环的等级），严格按需求：玩家等级10级
    if (player.level < 10) {
      logger.info('[天梦冰蚕] 条件不满足：等级不足10级，当前等级=' + player.level);
      return false;
    }
    if (player.level > 10) {
      logger.info('[天梦冰蚕] 条件不满足：等级超过10级，当前等级=' + player.level);
      return false;
    }
    // 判断灵眸在哪个武魂上（主修或次修都可以）
    const mainIsLingmu = player.martialSoul.name === '灵眸' && player.martialSoul.quality === 'legendary';
    const secondIsLingmu = player.isTwinSoul && player.secondSoul?.name === '灵眸' && player.secondSoul.quality === 'legendary';
    if (!mainIsLingmu && !secondIsLingmu) {
      logger.info('[天梦冰蚕] 条件不满足：无灵眸武魂，主修=' + player.martialSoul.name + ', 次修=' + (player.secondSoul?.name || '无'));
      return false;
    }
    // 对应武魂没有第一魂环
    if (mainIsLingmu && player.soulRings.length > 0) {
      logger.info('[天梦冰蚕] 条件不满足：主修灵眸已有魂环，数量=' + player.soulRings.length);
      return false;
    }
    if (secondIsLingmu && (player.secondSoulRings ?? []).length > 0) {
      logger.info('[天梦冰蚕] 条件不满足：次修灵眸已有魂环，数量=' + (player.secondSoulRings?.length ?? 0));
      return false;
    }
    logger.info('[天梦冰蚕] ✅ 全部条件满足，可以触发奇遇');
    return true;
  };

  // 标记天梦冰蚕奇遇已触发（弹窗一出现就标记，防止刷新后重复触发）
  // 标记后无论接受/拒绝/离开，都不会再触发
  const markTianmengTriggered = () => {
    if (!player) return;
    if (player.tianmeng?.triggered) return; // 已标记过直接跳过
    setPlayer((p) => ({
      ...p,
      tianmeng: {
        ...p.tianmeng,
        triggered: true,
      },
    }));
  };

  // 获取灵眸所在的武魂索引（0=主修，1=次修）；不满足条件时返回 null
  const getLingmuSoulIndex = (): 0 | 1 | null => {
    if (!player) return null;
    if (player.martialSoul.name === '灵眸' && player.martialSoul.quality === 'legendary') return 0;
    if (player.isTwinSoul && player.secondSoul?.name === '灵眸' && player.secondSoul.quality === 'legendary') return 1;
    return null;
  };

  // 接受献祭：获得百万年天梦冰蚕第一魂环，灵眸进化为冰灵之眸（超神级）
  const acceptTianmengSacrifice = () => {
    if (!player) return { success: false, reason: '玩家数据不存在' };

    // 🔴 修复：进化确认按钮点击时，不检查 canTriggerTianmeng（因为弹窗出现时已 markTianmengTriggered 把 triggered 设为 true）
    // 这里只检查核心条件：有灵眸武魂、等级10级、对应武魂无魂环
    const lingmuIdx = ((): 0 | 1 | null => {
      const mainIsLingmu = player.martialSoul.name === '灵眸' && player.martialSoul.quality === 'legendary';
      const secondIsLingmu = player.isTwinSoul && player.secondSoul?.name === '灵眸' && player.secondSoul.quality === 'legendary';
      if (mainIsLingmu && player.soulRings.length === 0) return 0;
      if (secondIsLingmu && (player.secondSoulRings ?? []).length === 0) return 1;
      return null;
    })();
    if (lingmuIdx === null) return { success: false, reason: '未找到可进化的灵眸武魂' };

    // 根据武魂名动态生成魂技名（与 generateSoulSkills 保持一致，防止硬编码与武魂不匹配）
    const targetSoul = lingmuIdx === 0 ? player.martialSoul : player.secondSoul!;
    const allSoulSkills = generateSoulSkills(targetSoul);
    const skillName = allSoulSkills[0] || '第1魂技·灵魂冲击';

    // 1. 创建百万年天梦冰蚕魂环（蓝白色，第1魂环）
    const tianmengRing: ISoulRing = {
      id: `ring-tianmeng-${Date.now()}`,
      color: 'blueWhite',
      qualityLabel: '百万年',
      soulBeastName: '天梦冰蚕',
      skillName,
      skillDesc: '天梦冰蚕百万年魂环赋予的精神攻击，以强大精神力直接冲击敌人大脑，造成巨额精神伤害并有几率眩晕。',
      years: 1000000,
      beastType: 'kong',
      beastAttribute: '精神属性',
      skillType: 'attack',
      attackBonus: 120,
      defenseBonus: 80,
      speedBonus: 100,
      spiritBonus: 500,
      hpBonus: 800,
      critRateBonus: 0.05,
      critDmgBonus: 0.3,
      soulPowerBonus: 200,
      skillDamage: 300,
      // 天梦冰蚕专属：按当前大境界计算伤害百分比（10级=100%，每大境界+80%）
      skillDamagePct: calcTianmengDamagePct(player.level),
    };

    // 2. 灵眸进化为冰灵之眸（超神级）——在灵眸所在的武魂上进化
    const evolvedSoul: IMartialSoul = {
      ...targetSoul,
      name: '冰灵之眸',
      quality: 'superDivine',
      description: '由灵眸与百万年天梦冰蚕融合进化而成的超神级武魂，兼具精神力极致与冰之力量，一眸之下，万物冰封，万念俱寂。',
      extremeAttribute: '极致之精神·极致之冰',
      element: '全属性',
      baseStats: {
        attack: 75,
        defense: 65,
        speed: 80,
        spirit: 150,
        hp: 90,
      },
      soulSkills: generateSoulSkills({
        ...targetSoul,
        quality: 'superDivine',
          element: '全属性',
          name: '冰灵之眸',
          type: '本体武魂·控制系',
          baseStats: { attack: 75, defense: 65, speed: 80, spirit: 150, hp: 90 },
          extremeAttribute: '极致之精神·极致之冰',
        description: '',
      }),
      id: 'ice-spirit-eye',
      cultivationAttr: 'spirit',
    };

    // 3. 更新玩家数据——根据灵眸位置决定更新哪个武魂
    setPlayer((p) => {
      const newP: IPlayer = {
        ...p,
        tianmeng: {
          ...p.tianmeng,
          triggered: true,
          accepted: true,
          evolved: true,
        },
      };
      if (lingmuIdx === 0) {
        // 灵眸在主修：进化主修武魂 + 加魂环到主修
        newP.martialSoul = evolvedSoul;
        newP.soulRings = [tianmengRing];
      } else {
        // 灵眸在次修：进化次修武魂 + 加魂环到次修
        newP.secondSoul = evolvedSoul;
        newP.secondSoulRings = [tianmengRing];
      }
      return newP;
    });

    return { success: true, newSoul: evolvedSoul, newRing: tianmengRing };
  };

  // 拒绝献祭：标记为已触发，永不触发
  const rejectTianmengSacrifice = () => {
    if (!player) return;
    setPlayer((p) => ({
      ...p,
      tianmeng: {
        ...p.tianmeng,
        triggered: true,
        accepted: false,
        evolved: false,
      },
     }));
     // 拒绝后需要持久化，防止刷新重复触发
     setTimeout(() => flushSave(), 0);
    };

   // ============================================================
   // 🔴 v17.0 侣系统
   // ============================================================

   // 所有可获得青睐的凶兽列表（星斗+极北）
   const ALL_COMPANION_BEASTS: FierceBeast[] = [...FIERCE_BEASTS_STAR_LAKE, ...FIERCE_BEASTS_FROZEN];

   // 根据 id 获取凶兽
   const getBeastById = (id: string): FierceBeast | undefined => ALL_COMPANION_BEASTS.find(b => b.id === id);

     // 检测是否触发青睐：战斗胜利后 50% 概率（已接受则不再触发；已拒绝概率降为 40%）
      const rollCompanionFavor = (beastId: string): boolean => {
        logger.info('[companions] rollFavor 开始', { beastId });
        if (!player) {
          logger.info('[companions] rollFavor skip: player 为空', { beastId });
          return false;
        }
        const comp = player.companions;
        if (!comp) {
          logger.info('[companions] rollFavor skip: companions 为空', { beastId });
          return false;
        }
        if (!Array.isArray(comp.accepted)) {
          logger.info('[companions] rollFavor skip: accepted 不是数组', { beastId });
          return false;
        }
        // 🔴 防御性：已接受的不再触发（彻底杜绝重复弹窗）
        if (comp.accepted.includes(beastId)) {
          logger.info('[companions] rollFavor skip: 已接受', { beastId });
          return false;
        }
        // 正在待处理的也不重复抽
        if (pendingFavorBeastId === beastId) {
          logger.info('[companions] rollFavor skip: 已有待处理', { beastId });
          return false;
        }
        // 只有可化形的凶兽才能触发青睐
        const beast = getBeastById(beastId);
        if (!beast) {
          logger.info('[companions] rollFavor skip: 凶兽不存在', { beastId });
          return false;
        }
        if (!beast.humanForm) {
          logger.info('[companions] rollFavor skip: 不可化形', { beastId, beastName: beast.name });
          return false;
        }
        const wasRejected = Array.isArray(comp.rejected) && comp.rejected.includes(beastId);
        const chance = wasRejected ? 0.40 : 0.50;
        const roll = Math.random();
        const hit = roll < chance;
        logger.info('[companions] 青睐抽卡结果', { beastId, beastName: beast.name, wasRejected, chance, roll, hit });
        return hit;
      };

     // 战斗胜利后调用：抽卡 + 存储到待处理队列，回到主界面再弹
     const checkAndStoreFavorTrigger = (beastId: string, area: 'star-lake' | 'frozen-domain'): boolean => {
       logger.info('[companions] checkAndStoreFavorTrigger 进入', { beastId, area, hasPlayer: !!player, currentPending: pendingFavorBeastId });
       if (rollCompanionFavor(beastId)) {
         // 🔴 直接持久化到 player.companions，刷新/切页面/重渲染都不会丢
         setPlayer((p) => {
           if (!p) return p;
           return {
             ...p,
             companions: {
               ...p.companions,
               pendingFavorBeastId: beastId,
             },
           };
         });
         logger.info('[companions] 青睐命中，已持久化到 companions.pendingFavorBeastId', { beastId, area });
         return true;
       }
       logger.info('[companions] 青睐未命中', { beastId, area });
       return false;
     };

      const clearPendingFavor = () => {
       setPlayer((p) => {
         if (!p || !p.companions?.pendingFavorBeastId) return p;
         return {
           ...p,
           companions: {
             ...p.companions,
             pendingFavorBeastId: null,
           },
         };
       });
     };

   // 接受青睐
   const acceptCompanionFavor = (beastId: string): boolean => {
     if (!player) return false;
     const beast = getBeastById(beastId);
     if (!beast?.humanForm) return false; // 只有可化形的凶兽才能成为侣
     // 🔴 双重防御：accepted 数组里已有的直接返回（杜绝重复接受）
     if (player.companions.accepted.includes(beastId)) {
       logger.info('[companions] 重复接受，跳过', { beastId });
       clearPendingFavor();
       return false;
     }
     setPlayer((p) => {
       const newAccepted = [...p.companions.accepted, beastId];
       // 从 rejected 中移除（如存在）
       const newRejected = p.companions.rejected.filter(id => id !== beastId);
       const newDetails = {
         ...p.companions.details,
          [beastId]: {
            companionType: 'beast' as const,
            favorability: 10,
            transformed: false,
            isLover: false,
            isSpouse: false,
            crystals: 0,
            lastDualCultivateAt: 0,
            lastMatingAt: 0,
          },
       };
       return {
         ...p,
         companions: {
           ...p.companions,
           accepted: newAccepted,
           rejected: newRejected,
           details: newDetails,
         },
       };
    });
     // 接受成功后清除待处理状态
       clearPendingFavor();
       return true;
     };

    // 拒绝青睐
   const rejectCompanionFavor = (beastId: string): void => {
     if (!player) return;
     setPlayer((p) => {
       if (p.companions.rejected.includes(beastId)) return p;
       return {
         ...p,
         companions: {
           ...p.companions,
           rejected: [...p.companions.rejected, beastId],
         },
       };
      });
      // 拒绝后也清除待处理状态
      clearPendingFavor();
    };

   // 赠送物品增加好感度（仙草/灵草/魂骨/魂导器材料等）
   /** 计算赠送物品的好感度增量（与 UI 展示完全一致，唯一数据源） */
   const computeFavorGain = (item: IItem): number => {
     if (item.type === 'consumable' && item.effect?.startsWith('immortal:')) {
       // 仙草类
       switch (item.quality) {
         case 'legendary': return 30;
         case 'epic': return 20;
         case 'fine': return 12;
         case 'rare': return 8;
         default: return 5;
       }
     }
     if (item.type === 'consumable' && item.effect?.startsWith('ice-fire-immortal:')) {
       // 冰火两仪眼仙草（顶级仙草，好感度更高）
       switch (item.quality) {
         case 'legendary': return 35;
         case 'epic': return 28;
         case 'fine': return 18;
         case 'rare': return 10;
         default: return 6;
       }
     }
     if (item.type === 'consumable' && (
       item.effect?.startsWith('element-spirit:') || 
       item.effect?.startsWith('attribute-spirit:') ||
       item.effect?.startsWith('holy-grass:')
     )) {
       // 元素灵草 / 属性灵草 / 圣灵草
       switch (item.quality) {
         case 'legendary': return 25;
         case 'epic': return 18;
         case 'fine': return 10;
         case 'rare': return 6;
         default: return 3;
       }
     }
     if (item.type === 'consumable' && item.effect?.startsWith('water-of-life:')) {
       return 35; // 生命之水
     }
     if (item.type === 'consumable' && item.effect?.startsWith('polar-ice-jade:')) {
       return 30; // 极冰玉
     }
     if (item.type === 'soulGuide') {
       // 魂导器，按等级/品阶
       if (item.soulGuideGrade === 'tier3') return 25;
       if (item.soulGuideGrade === 'tier2') return 15;
       if (item.soulGuideGrade === 'tier1') return 8;
       if (item.soulGuideLevel != null) return 3 + item.soulGuideLevel * 2;
       return 5;
     }
     if (item.type === 'soulBone') {
       // 魂骨（按年限品质分级）
       switch (item.quality) {
         case 'legendary': return 40;  // 十万年及以上
         case 'epic': return 25;       // 万年
         case 'fine': return 15;       // 千年
         case 'rare': return 8;        // 百年
         default: return 5;            // 十年
       }
     }
     if (item.type === 'material' && item.materialTier != null) {
       // 魂导器材料
       switch (item.quality) {
         case 'legendary': return 20;
         case 'epic': return 12;
         case 'fine': return 6;
         case 'rare': return 3;
         default: return 2;
       }
     }
     return 0; // 其他类型不可赠送
   };

    const giftCompanion = (beastId: string, itemInstanceId: string) => {
      if (!player) return { success: false, reason: '玩家数据不存在' };
       const detail = player.companions.details[beastId];
       if (!detail) return { success: false, reason: '该凶兽尚未获得青睐' };

       // 🔴 特殊好感机制：挑战模式角色（如阴阳茶）无法通过赠送礼物增加好感度
       const teaChar = TEA_CITY_CHARACTERS.find(c => c.id === beastId);
       if (teaChar?.favorMechanism === 'challenge') {
         return { success: false, reason: `${teaChar.name}对寻常礼物毫无兴趣，唯有以剑道论高下方能赢得她的青睐。` };
       }

       if (detail.favorability >= 150) return { success: false, reason: '好感度已满' };

      // 🔴 原子化处理：物品查找、可赠送性校验、好感度计算、物品扣除 全部在 setPlayer callback 内完成
      // 用 giftResultRef 记录实际结果，避免 StrictMode 下 setState callback 双调用导致的误判
      const giftResultRef = { success: false, reason: '', favorGain: 0, checked: false };
      setPlayer((p) => {
        // 查找物品（从最新的 p.inventory 中找，保证原子性）
        const item = p.inventory.find(i => i.id === itemInstanceId);
        if (!item) {
          if (!giftResultRef.checked) { giftResultRef.checked = true; giftResultRef.reason = '物品不存在'; }
          return p;
        }
        // 计算好感度增长
        const gain = computeFavorGain(item);
        if (gain <= 0) {
          if (!giftResultRef.checked) { giftResultRef.checked = true; giftResultRef.reason = '该物品无法赠送给伴侣'; }
          return p;
        }
        const prevDetail = p.companions.details[beastId];
        const curFav = prevDetail?.favorability ?? 0;
        const cap = prevDetail?.isLover ? 150 : 100;
        if (curFav >= cap) {
          if (!giftResultRef.checked) {
            giftResultRef.checked = true;
            giftResultRef.reason = curFav >= 150 ? '好感度已满' : '好感度已达100上限，结为情侣后可继续提升';
          }
          return p;
        }
        const newFav = Math.min(cap, curFav + gain);
        const actualGain = newFav - curFav;
        if (actualGain <= 0) {
          if (!giftResultRef.checked) { giftResultRef.checked = true; giftResultRef.reason = '好感度已满'; }
          return p;
        }
        // 消耗物品（堆叠物品只减1个，否则整格移除）
        const stackable = item.type === 'material' || item.type === 'consumable' || item.type === 'special';
        let newInv: typeof p.inventory;
        if (stackable && (item.quantity ?? 1) > 1) {
          newInv = p.inventory.map(i =>
            i.id === itemInstanceId
              ? { ...i, quantity: (i.quantity ?? 1) - 1 }
              : i
          );
        } else {
          newInv = p.inventory.filter(i => i.id !== itemInstanceId);
        }
        if (!giftResultRef.checked) {
          giftResultRef.checked = true;
          giftResultRef.success = true;
          giftResultRef.favorGain = actualGain;
        }
        return {
          ...p,
          inventory: newInv,
          companions: {
            ...p.companions,
            details: {
              ...p.companions.details,
              [beastId]: {
                ...prevDetail,
                favorability: newFav,
              },
            },
          },
        };
      });
      // 返回结果（从 giftResultRef 读取）
      if (giftResultRef.success) {
        return { success: true, favorGain: giftResultRef.favorGain };
      }
      return { success: false, reason: giftResultRef.reason || '赠送失败' };
    };

   // 帮助化形（好感度≥50），消耗20%当前血量
   const helpTransformCompanion = (beastId: string) => {
     if (!player) return { success: false, reason: '玩家数据不存在' };
     const detail = player.companions.details[beastId];
     if (!detail) return { success: false, reason: '该凶兽尚未获得青睐' };
     if (detail.transformed) return { success: false, reason: '已经化形成人了' };
     if (detail.favorability < 50) return { success: false, reason: '好感度需达到50才能帮助化形' };
     if (player.currentHp <= 0) return { success: false, reason: '当前血量不足' };

     const hpCost = Math.max(1, Math.floor(player.currentHp * 0.2));
     setPlayer((p) => {
       const newHp = Math.max(1, p.currentHp - hpCost);
       const prevDetail = p.companions.details[beastId];
        return {
          ...p,
          currentHp: newHp,
          companions: {
            ...p.companions,
            details: {
              ...p.companions.details,
              [beastId]: {
                ...prevDetail,
                transformed: true,
              },
            },
          },
        };
      });
      return { success: true };
    };

   // 结为情侣（好感度≥100 + 已化形）
   const becomeLover = (beastId: string) => {
     if (!player) return { success: false, reason: '玩家数据不存在' };
     const detail = player.companions.details[beastId];
     if (!detail) return { success: false, reason: '该角色尚未获得青睐' };
     if (detail.isLover) return { success: false, reason: '已经是情侣了' };
     if (!detail.transformed) return { success: false, reason: '需要先化形成人' };
     // 好感度门槛：挑战模式角色（阴阳茶）300，其他100
     const teaChar = TEA_CITY_CHARACTERS.find(c => c.id === beastId);
     const loverThreshold = teaChar?.favorMechanism === 'challenge' ? 300 : 100;
     if (detail.favorability < loverThreshold) return { success: false, reason: `好感度需达到${loverThreshold}才能结为情侣` };

     setPlayer((p) => {
       const prevDetail = p.companions.details[beastId];
        return {
          ...p,
          companions: {
            ...p.companions,
            details: {
              ...p.companions.details,
               [beastId]: {
                 ...prevDetail,
                 isLover: true,
                 becameLoverAt: prevDetail.becameLoverAt ?? Date.now(),
               },
            },
          },
        };
      });
      return { success: true };
    };

    // 结为夫妻（好感度≥150 + 已化形 + 已是情侣 + 尚无配偶）
   const becomeSpouse = (beastId: string) => {
     if (!player) return { success: false, reason: '玩家数据不存在' };
     const detail = player.companions.details[beastId];
     if (!detail) return { success: false, reason: '该凶兽尚未获得青睐' };
     if (detail.isSpouse) return { success: false, reason: '已经是夫妻了' };
     if (!detail.transformed) return { success: false, reason: '需要先化形成人' };
     if (!detail.isLover) return { success: false, reason: '需先结为情侣才能结为夫妻' };
     // 好感度门槛：挑战模式角色（阴阳茶）700，其他150
     const teaChar = TEA_CITY_CHARACTERS.find(c => c.id === beastId);
     const spouseThreshold = teaChar?.favorMechanism === 'challenge' ? 700 : 150;
     if (detail.favorability < spouseThreshold) return { success: false, reason: `好感度需达到${spouseThreshold}才能结为夫妻` };

     // 检查是否已有配偶（夫妻只能有一位）
     const hasSpouse = Object.values(player.companions.details).some(d => d.isSpouse);
     if (hasSpouse) return { success: false, reason: '你已与他人结为夫妻，夫妻只能有一位' };

     // 🔴 特殊角色：阴阳茶结为夫妻时获得无上神器「鸿蒙两仪神剑」
     const spouseArtifactId = teaChar?.spouseArtifactId || null;

     setPlayer((p) => {
       const prevDetail = p.companions.details[beastId];
        return {
          ...p,
          companions: {
            ...p.companions,
            details: {
              ...p.companions.details,
              [beastId]: {
                ...prevDetail,
                isLover: true, // 夫妻同时也是情侣
                isSpouse: true,
              },
            },
          },
          divineTrial: spouseArtifactId ? {
            ...p.divineTrial,
            activeArtifactId: spouseArtifactId,
            // 🔴 至高神器永久叠加：结婚获得后加入永久列表，切换神位神器时属性不丢失
            supremeArtifacts: p.divineTrial.supremeArtifacts?.includes(spouseArtifactId)
              ? p.divineTrial.supremeArtifacts
              : [...(p.divineTrial.supremeArtifacts || []), spouseArtifactId],
          } : p.divineTrial,
        };
      });
      return { success: true };
    };

    // 离婚：解除夫妻关系+情侣关系，好感度保底到0，离婚次数+1，全属性惩罚每次-5%（加法累加）
    const divorceCompanion = (beastId: string) => {
      if (!player) return { success: false, reason: '玩家数据不存在' };
      const detail = player.companions.details[beastId];
      if (!detail) return { success: false, reason: '该伴侣尚未获得青睐' };
      if (!detail.isSpouse) return { success: false, reason: '尚未结为夫妻，无需离婚' };

      // 🔴 特殊角色：阴阳茶离婚后直接消失，玩家无法再结识，无上神器也消失
      const teaChar = TEA_CITY_CHARACTERS.find(c => c.id === beastId);
      const isYinYang = teaChar?.favorMechanism === 'challenge' && !!teaChar.spouseArtifactId;

      setPlayer((p) => {
        const prevDetail = p.companions.details[beastId];
        if (isYinYang) {
          // 阴阳茶：彻底从伴侣列表中移除，accepted 中保留但加入永久屏蔽，activeArtifactId 清空
          const newAccepted = p.companions.accepted.filter(id => id !== beastId);
          const newDetails = { ...p.companions.details };
          delete newDetails[beastId];
          return {
            ...p,
            currentHp: p.currentHp,
            companions: {
              ...p.companions,
              divorceCount: (p.companions.divorceCount || 0) + 1,
              accepted: newAccepted,
              // 永久黑名单（转世后重置，但本世无法再刷到）—— 此处用 accepted 移除 + rejected 永久标记
              rejected: [...p.companions.rejected, beastId + ':permanent'],
              details: newDetails,
            },
            divineTrial: {
              ...p.divineTrial,
              activeArtifactId: p.divineTrial.activeArtifactId === teaChar?.spouseArtifactId
                ? null
                : p.divineTrial.activeArtifactId,
              // 离婚后从永久叠加列表中移除对应至高神器
              supremeArtifacts: teaChar?.spouseArtifactId
                ? (p.divineTrial.supremeArtifacts || []).filter(id => id !== teaChar.spouseArtifactId)
                : (p.divineTrial.supremeArtifacts || []),
            },
          };
        }
        return {
          ...p,
          currentHp: p.currentHp, // 血量在 calcAttributes 后重算
          companions: {
            ...p.companions,
            divorceCount: (p.companions.divorceCount || 0) + 1,
            details: {
              ...p.companions.details,
              [beastId]: {
                ...prevDetail,
                isLover: false,
                isSpouse: false,
                // 🔴 修复：离婚后好感度保底为0，避免出现负数
                favorability: Math.max(0, (prevDetail?.favorability ?? 0) - 500),
              },
            },
          },
        };
      });

      // 重新计算血量（惩罚后）
      setTimeout(() => {
        setPlayer((p) => {
          const newAttrs = calcAttributes(p);
          return {
            ...p,
            currentHp: Math.min(p.currentHp, newAttrs.hp),
          };
        });
      }, 0);

      return { success: true };
    };

    // ===================== 伴侣遗忘 =====================

    // 遗忘角色：好感度<150时可用，从列表隐藏但保留数据（下次再探索仍可遇到）
    const forgetCompanion = (beastId: string) => {
      if (!player) return { success: false, reason: '玩家数据不存在' };
      const detail = player.companions.details[beastId];
      if (!detail) return { success: false, reason: '该角色尚未获得青睐' };
      if (detail.favorability >= 150) return { success: false, reason: '好感度达到150后无法遗忘' };
      if (detail.isSpouse) return { success: false, reason: '夫妻关系无法遗忘' };
      if (beastId === 'tc-hunduncha') return { success: false, reason: '混沌茶为特殊存在，无法遗忘' };

      setPlayer((p) => {
        const prevDetail = p.companions.details[beastId];
        return {
          ...p,
          companions: {
            ...p.companions,
            accepted: p.companions.accepted.filter(id => id !== beastId),
            details: {
              ...p.companions.details,
              [beastId]: {
                ...prevDetail,
                forgotten: true,
                isLover: false, // 遗忘自动解除情侣关系
              },
            },
          },
        };
      });
      return { success: true };
    };

   // 双修：获得大量经验，冷却5分钟（仅情侣可用）
   const dualCultivate = (beastId: string) => {
     if (!player) return { success: false, reason: '玩家数据不存在' };
     const detail = player.companions.details[beastId];
     if (!detail) return { success: false, reason: '该凶兽尚未获得青睐' };
     if (!detail.isLover) return { success: false, reason: '需要先结为情侣' };

     const COOLDOWN = 5 * 60 * 1000; // 5分钟
     const now = Date.now();
     if (now - detail.lastDualCultivateAt < COOLDOWN) {
       const remain = Math.ceil((COOLDOWN - (now - detail.lastDualCultivateAt)) / 1000);
       return { success: false, reason: `双修冷却中，剩余${remain}秒` };
     }

     const baseExp = player.level * 500 + 2000;
     const expGained = Math.round(baseExp * (0.9 + Math.random() * 0.2) * 1.5);

     setPlayer((p) => {
       const prevDetail = p.companions.details[beastId];
       // 双修好感度上限：挑战模式角色（阴阳茶）夫妻前300/夫妻后700，普通角色150（与spouseThreshold对齐）
       const teaChar = TEA_CITY_CHARACTERS.find(c => c.id === beastId);
       const isChallenge = teaChar?.favorMechanism === 'challenge';
       const baseFavorCap = isChallenge ? 300 : 150;
       const isSpouse = prevDetail?.isSpouse ?? false;
       const favorCap = isChallenge && isSpouse ? 700 : baseFavorCap;
       return {
         ...p,
         companions: {
           ...p.companions,
           details: {
             ...p.companions.details,
             [beastId]: {
               ...prevDetail,
               lastDualCultivateAt: Date.now(),
               // 双修微量提升好感度（好感度达上限后不再增加，避免被封顶降低）
               favorability:
                 (prevDetail?.favorability ?? 0) >= favorCap
                   ? prevDetail?.favorability ?? 0
                   : Math.min(favorCap, (prevDetail?.favorability ?? 0) + 1),
             },
           },
         },
       };
     });
     // 加经验（复用 addExp 统一处理升级逻辑）
     addExp(expGained);
     return { success: true, expGained };
   };

    // 交融（仅夫妻可用），获得结晶，虚弱5分钟
    const mateCompanion = (beastId: string) => {
      if (!player) return { success: false, reason: '玩家数据不存在' };
      const detail = player.companions.details[beastId];
      if (!detail) return { success: false, reason: '该凶兽尚未获得青睐' };
      if (!detail.isSpouse) return { success: false, reason: '需要先结为夫妻' };

      const COOLDOWN = 10 * 60 * 1000; // 10分钟
      const now = Date.now();
      if (now - detail.lastMatingAt < COOLDOWN) {
        const remain = Math.ceil((COOLDOWN - (now - detail.lastMatingAt)) / 1000);
        return { success: false, reason: `冷却中，剩余${remain}秒` };
      }

      const WEAKNESS_DURATION = 5 * 60 * 1000; // 5分钟虚弱
      const allBeasts: FierceBeast[] = [...FIERCE_BEASTS_STAR_LAKE, ...FIERCE_BEASTS_FROZEN];
      const beast = allBeasts.find((b) => b.id === beastId);
      const teaChar = TEA_CITY_CHARACTERS.find((c) => c.id === beastId);
      const beastName = beast?.name ?? teaChar?.name ?? '伴侣';

      // 结晶物品：特殊物品类，史诗品质，不可出售、不可使用，仅作记录
       const crystalItem: IItem = {
         id: `mate-crystal-${beastId}`,
         name: `${beastName}·交融结晶`,
         type: 'special',
         quality: 'epic',
         qualityColor: '#a855f7',
         iconChar: '晶',
         description: `与${beastName}交融后凝结的结晶，铭刻着彼此的羁绊。无法出售，无法使用，仅作为交融次数的见证。`,
         quantity: 1,
         sellPrice: 0,
       };

      setPlayer((p) => {
        const prevDetail = p.companions.details[beastId];
        // 背包中找同类结晶（相同 id 前缀 + same name），堆叠数量
         const crystalIdx = p.inventory.findIndex(
           (it) => it.type === 'special' && it.name === crystalItem.name,
         );
        let newInventory: IItem[];
        if (crystalIdx >= 0) {
          newInventory = [...p.inventory];
          newInventory[crystalIdx] = {
            ...newInventory[crystalIdx],
            quantity: (newInventory[crystalIdx].quantity ?? 1) + 1,
          };
        } else {
          newInventory = [
            ...p.inventory,
            { ...crystalItem, id: `${crystalItem.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
          ];
        }
        return {
           ...p,
           inventory: newInventory,
           companions: {
             ...p.companions,
             weaknessUntil: Date.now() + WEAKNESS_DURATION,
             details: {
               ...p.companions.details,
               [beastId]: {
                 ...prevDetail,
                 lastMatingAt: Date.now(),
                 crystals: (prevDetail?.crystals ?? 0) + 1,
               },
             },
           },
         };
       });
       return { success: true };
     };

   // 计算情侣全属性加成百分比（每个情侣+10%，叠加）
   const getCompanionLoverBonus = (): number => {
     if (!player) return 0;
     const details = player.companions.details;
     let count = 0;
     for (const id of Object.keys(details)) {
       if (details[id]?.isLover) count++;
     }
     return count * 10; // 每个+10%
   };

   // ==================== 🔴 v17.2 茶城系统 ====================
   const pendingTeaFavorId = player?.companions?.pendingTeaFavorId ?? null;
   const teaNodeCooldowns = player?.companions?.teaNodeCooldowns ?? {};

   // 探索茶城节点：消耗少量体力，获得修为/魂币，概率遇到人物
   const exploreTeaNode = (nodeId: string) => {
     if (!player) return { success: false, reason: '玩家数据不存在' };
     const node = TEA_CITY_NODES.find(n => n.id === nodeId);
     if (!node) return { success: false, reason: '节点不存在' };

     const now = Date.now();
     const cooldownUntil = player.companions.teaNodeCooldowns[nodeId] ?? 0;
     if (now < cooldownUntil) {
       const remain = Math.ceil((cooldownUntil - now) / 1000);
       return { success: false, reason: `冷却中，剩余${remain}秒` };
     }

      // 消耗 500 体力（用 consumeStamina 先结算离线恢复再扣除，避免快照值过时）
      const staminaCost = 500;
      const ok = consumeStamina(staminaCost);
      if (!ok) {
        return { success: false, reason: '体力不足，需要500点体力' };
      }

     // 基础奖励：修为 + 魂币
     const baseExp = (player.level * 80 + 500) * 1.5;
     const expGained = Math.round(baseExp * (0.8 + Math.random() * 0.4));
     const coinGained = Math.round(20 + player.level * 2 + Math.random() * 30);

      // 抽卡：遇到某位人物（已接受的不会再遇到；已有待处理青睐时不再抽新人物）
      let encounterId: string | undefined;
      const hasPendingFavor = !!player.companions.pendingTeaFavorId;
       const candidates = node.characterIds
         .map(id => TEA_CITY_CHARACTERS.find(c => c.id === id))
         .filter((c): c is TeaCityCharacter =>
           !!c
           && !player.companions.accepted.includes(c.id)
           && c.id !== player.companions.pendingTeaFavorId
           && !(c.levelRequired && player.level < c.levelRequired)
           && !player.companions.rejected.includes(c.id + ':permanent')
         );
      logger.info('[tea-city] 探索抽卡候选', {
        nodeId,
        totalNodeChars: node.characterIds.length,
        candidatesLen: candidates.length,
        hasPendingFavor,
        pendingId: player.companions.pendingTeaFavorId,
        acceptedCount: player.companions.accepted.length,
      });
      if (hasPendingFavor) {
        logger.info('[tea-city] 有待处理青睐，跳过本次人物抽卡');
      } else if (candidates.length > 0) {
          // 首次50%基础概率；被拒绝过的人物单独权重×0.8（单人概率降低而非整池）
          const weightedCandidates = candidates.map(c => ({
            ...c,
            adjWeight: player.companions.rejected.includes(c.id) ? c.encounterChance * 0.8 : c.encounterChance,
          }));
          const totalWeight = weightedCandidates.reduce((s, c) => s + c.adjWeight, 0);
          const encounterRoll = Math.random() * totalWeight;
          let roll = encounterRoll;
          for (const c of weightedCandidates) {
            roll -= c.adjWeight;
            if (roll <= 0) {
              encounterId = c.id;
              break;
            }
          }
          // 兜底：浮点误差时取第一个
          if (!encounterId && weightedCandidates.length > 0) {
            encounterId = weightedCandidates[0].id;
          }
        }

      setPlayer((p) => {
        const newDetails = { ...p.companions.details };
        if (encounterId && !p.companions.accepted.includes(encounterId)) {
          // 遇到了人物，设置为待处理青睐
        }
        return {
          ...p,
          // stamina 已由 consumeStamina 处理，此处只更新业务字段
          soulCoins: p.soulCoins + coinGained,
          // exp 通过下方 addExp 统一添加（带升级判定），此处不直接加
          companions: {
            ...p.companions,
            pendingTeaFavorId: encounterId && !p.companions.accepted.includes(encounterId) ? encounterId : p.companions.pendingTeaFavorId,
            teaNodeCooldowns: {
              ...p.companions.teaNodeCooldowns,
               [nodeId]: now + 4 * 60 * 1000, // 冷却 4 分钟
           },
           details: newDetails,
         },
       };
     });

     // 加经验（带升级判定，替代之前的 setTimeout addExp(0) 升级检查）
     addExp(expGained);

     return { success: true, encounterId, expGained, coinGained };
    };

   // 接受茶城人物青睐
   const acceptTeaFavor = (characterId: string): boolean => {
     if (!player) return false;
     const character = TEA_CITY_CHARACTERS.find(c => c.id === characterId);
     if (!character) return false;
     if (player.companions.accepted.includes(characterId)) {
       clearPendingTeaFavor();
       return false;
     }
     setPlayer((p) => {
       const newAccepted = [...p.companions.accepted, characterId];
       const newRejected = p.companions.rejected.filter(id => id !== characterId);
         const newDetails = {
           ...p.companions.details,
           [characterId]: {
             companionType: 'human' as const,
             // 🔴 一次性挑战角色（混沌茶等特殊存在）：初始好感度为0
             // 否则 favorability=10 会 >= spouseThreshold=1，导致挑战按钮一接受就显示「已击败」置灰
             favorability: character.isOneTimeVictory ? 0 : 10,
             transformed: true, // 人类伴侣本来就是人形
             isLover: false,
             isSpouse: false,
             crystals: 0,
             lastDualCultivateAt: 0,
              lastMatingAt: 0,
           },
         };
       return {
         ...p,
         companions: {
           ...p.companions,
           accepted: newAccepted,
           rejected: newRejected,
           details: newDetails,
           pendingTeaFavorId: null,
         },
       };
      });
      return true;
    };

   // 拒绝茶城人物青睐
   const rejectTeaFavor = (characterId: string): void => {
     if (!player) return;
     setPlayer((p) => {
       const newRejected = p.companions.rejected.includes(characterId)
         ? p.companions.rejected
         : [...p.companions.rejected, characterId];
       return {
         ...p,
         companions: {
           ...p.companions,
           rejected: newRejected,
           pendingTeaFavorId: null,
         },
       };
      });
    };

   // 清除待处理茶城青睐
   const clearPendingTeaFavor = () => {
     if (!player) return;
     setPlayer((p) => ({
       ...p,
       companions: {
         ...p.companions,
         pendingTeaFavorId: null,
       },
     }));
   };

  // 🔴 挑战模式伴侣：获胜后增加好感度（阴阳茶等特殊角色）
  // 取消挑战冷却，随时可以挑战
  const challengeCompanionWin = (companionId: string) => {
    if (!player) return { success: false, reason: '玩家数据不存在' };
    const detail = player.companions.details[companionId];
    if (!detail) return { success: false, reason: '该伴侣尚未获得青睐' };
    const teaChar = TEA_CITY_CHARACTERS.find(c => c.id === companionId);
    if (!teaChar || teaChar.favorMechanism !== 'challenge') {
      return { success: false, reason: '该角色不支持挑战模式' };
    }
    // 挑战模式好感度上限：非情侣300（第一阶段上限），情侣后700（第二阶段上限）
    // 特殊存在（冰红茶等）：无好感度系统，直接返回称号奖励
    const isSpecialNoFavor = !!teaChar.isSpecialBeing && teaChar.victoryRewardTitle;
    if (isSpecialNoFavor) {
      const title = teaChar.victoryRewardTitle;
      const alreadyHas = (player.permanentTitles ?? []).includes(title);
      setPlayer((p) => {
        const titles = Array.isArray(p.permanentTitles) ? [...p.permanentTitles] : [];
        if (!titles.includes(title)) titles.push(title);
        return { ...p, permanentTitles: titles };
      });
      return { success: true, titleReward: title, isFirstTime: !alreadyHas, favorGain: 0 };
    }
    const capForFull = detail.isLover ? 700 : 300;
    if (detail.favorability >= capForFull) return { success: false, reason: '好感度已满' };

     // 好感度奖励：第一阶段（非情侣）25~35，第二阶段（情侣后）50~90
    const favorGain = detail.isLover
      ? 50 + Math.floor(Math.random() * 41)
      : 25 + Math.floor(Math.random() * 11);
    // 好感度上限：非情侣300，情侣后700
    const cap = detail.isLover ? 700 : 300;
    let actualGain = 0;

     // 一次性挑战角色（混沌茶等）：击败后永久消失并发放专属特殊物品
     // 🔴 例外：吞噬茶武魂玩家击败混沌茶时，不删除伴侣记录，保留以便强配机制
     const isOneTimeVictory = !!teaChar.isOneTimeVictory;
     const hasTunshiSoul = player.martialSoul.name === '混沌无极' || (player.isTwinSoul && player.secondSoul?.name === '混沌无极');
     const isHundunCha = companionId === 'tc-hunduncha';
     const skipPermanentDelete = hasTunshiSoul && isHundunCha;
     const artifactItemTemplate = teaChar.victoryArtifactItemId
       ? getSpecialItemById(teaChar.victoryArtifactItemId)
       : undefined;

    setPlayer((p) => {
      const prev = p.companions.details[companionId];
      if (!prev) return p;
      const newFav = Math.min(cap, prev.favorability + favorGain);
      actualGain = newFav - prev.favorability;
      if (actualGain <= 0) return p;

       // 🔴 两仪神剑特殊能力：首次击败阴阳茶奖励所有魂环年限+100万年（仅限第一次，主或副武魂为两仪神剑即可触发）
       const hasLiangyiSoul = p.martialSoul.name === '两仪神剑' || p.secondSoul?.name === '两仪神剑';
       const isYinyangcha = companionId === 'tc-yinyangcha';
       // 标记存放在玩家顶层，避免伴侣详情中丢失
       const firstBonusAlreadyGiven = !!p.liangyiFirstBonusGiven;
       const firstBonusEligible = hasLiangyiSoul && isYinyangcha && !firstBonusAlreadyGiven;

      let newSoulRings = p.soulRings;
      let newSecondSoulRings = p.secondSoulRings;
      let ringYearBonusGiven = firstBonusAlreadyGiven;

      if (firstBonusEligible) {
        const addYears = 1_000_000; // 100万年
        ringYearBonusGiven = true;
        // 主武魂元素
        const mainEl = p.martialSoul.element || getSoulElement(p.martialSoul.name);
        newSoulRings = p.soulRings.map((r, idx) => {
          if (r.color === 'blueWhite') return r; // 天梦冰蚕不提升
          const newYears = (r.years ?? 0) + addYears;
          const quality = getRingQualityFromYears(newYears);
          // deterministic 模式确保年限提升属性只增不减
          const stats = localRingGrowthStats(r,newYears);
          const beastAttr = r.beastAttribute || '';
          const affinity = calcElementAffinity(mainEl, beastAttr);
          const newSdp = calcSkillDamagePct(newYears, r.beastType as any, idx, affinity);
          return {
            ...r,
            years: newYears,
            color: quality.color as typeof r.color,
            qualityLabel: quality.label,
            attackBonus: stats.attackBonus,
            defenseBonus: stats.defenseBonus,
            speedBonus: stats.speedBonus,
            spiritBonus: stats.spiritBonus,
            hpBonus: stats.hpBonus,
            critRateBonus: stats.critRateBonus,
            critDmgBonus: stats.critDmgBonus,
            soulPowerBonus: stats.soulPowerBonus,
            skillDamage: stats.skillDamage,
            skillDamagePct: Math.max(newSdp,r.skillDamagePct||0),
          };
        });
        if (p.secondSoulRings && p.secondSoulRings.length > 0) {
          const secEl = p.secondSoul?.element || (p.secondSoul ? getSoulElement(p.secondSoul.name) : '');
          newSecondSoulRings = p.secondSoulRings.map((r, idx) => {
            if (r.color === 'blueWhite') return r;
            const newYears = (r.years ?? 0) + addYears;
            const quality = getRingQualityFromYears(newYears);
            const stats = localRingGrowthStats(r,newYears);
            const beastAttr = r.beastAttribute || '';
            const affinity = calcElementAffinity(secEl, beastAttr);
            const newSdp = calcSkillDamagePct(newYears, r.beastType as any, idx, affinity);
            return {
              ...r,
              years: newYears,
              color: quality.color as typeof r.color,
              qualityLabel: quality.label,
              attackBonus: stats.attackBonus,
              defenseBonus: stats.defenseBonus,
              speedBonus: stats.speedBonus,
              spiritBonus: stats.spiritBonus,
              hpBonus: stats.hpBonus,
              critRateBonus: stats.critRateBonus,
              critDmgBonus: stats.critDmgBonus,
              soulPowerBonus: stats.soulPowerBonus,
              skillDamage: stats.skillDamage,
              skillDamagePct: Math.max(newSdp,r.skillDamagePct||0),
            };
          });
        }
      }

       return reconcileGodUnlock({
         ...p,
         ...(isHundunCha ? { hundunChaDefeated: true } : {}),
         soulRings: newSoulRings,
         secondSoulRings: newSecondSoulRings,
         // 两仪神剑首次击败阴阳茶奖励标记（顶层持久化）
         ...(ringYearBonusGiven && !firstBonusAlreadyGiven ? { liangyiFirstBonusGiven: true } : {}),
         ...(isOneTimeVictory && artifactItemTemplate
           ? skipPermanentDelete
             ? {
                 // 🔴 吞噬茶武魂·混沌茶：只给神器，不删除伴侣记录（强配弹窗随后触发）
                 inventory: [...p.inventory, { ...artifactItemTemplate, id: `${artifactItemTemplate.id}-${Date.now()}` }],
                 companions: {
                   ...p.companions,
                   details: {
                     ...p.companions.details,
                     [companionId]: {
                       ...prev,
                       favorability: Math.max(prev.favorability, 100), // 至少100好感保证可显示
                       hundunChaDefeated: true,
                     },
                   },
                 },
               }
             : {
              inventory: [...p.inventory, { ...artifactItemTemplate, id: `${artifactItemTemplate.id}-${Date.now()}` }],
              companions: {
                ...p.companions,
                accepted: p.companions.accepted.filter(id => id !== companionId),
                details: (() => {
                  const nd = { ...p.companions.details };
                  delete nd[companionId];
                  return nd;
                })(),
                rejected: [...p.companions.rejected, companionId + ':permanent'],
              },
            }
          : {
              companions: {
                ...p.companions,
                details: {
                  ...p.companions.details,
                    [companionId]: {
                      ...prev,
                      favorability: newFav,
                    },
                },
              },
            }
        ),
      });
    });
     return { success: true, favorGain: actualGain, oneTimeVictory: isOneTimeVictory, artifactItemName: artifactItemTemplate?.name };
   };

   // 🔴 茶城挑战失败：不进入冷却，随时可以再次挑战
   const challengeCompanionLose = (companionId: string) => {
     if (!player) return { success: false, reason: '玩家数据不存在' };
     const detail = player.companions.details[companionId];
     if (!detail) return { success: false, reason: '该伴侣尚未获得青睐' };
     const teaChar = TEA_CITY_CHARACTERS.find(c => c.id === companionId);
     if (!teaChar || teaChar.favorMechanism !== 'challenge') {
       return { success: false, reason: '该角色不支持挑战模式' };
     }
     return { success: true };
   };

   // 获取挑战模式冷却剩余秒数（已取消冷却，始终返回 0）
   const getChallengeCooldown = (_companionId: string): number => {
     return 0;
   };

  // 🔴 神器切换（仅成神后可用）：在继承神位神器和特殊无上神器之间切换
  const switchActiveArtifact = (artifactId: string | null) => {
    if (!player) return { success: false, reason: '玩家数据不存在' };
    if (!player.divineTrial?.inherited) {
      return { success: false, reason: '需继承神位后方可切换神器' };
    }
    if (artifactId) {
      const art = getArtifactById(artifactId);
      if (!art) return { success: false, reason: '神器不存在' };
      // 无上神器必须对应特定伴侣的夫妻关系才能切换
      if (art.tier === 'supreme') {
        const defaultArtId = getArtifactByDeity(player.divineTrial.chosenTrialId || '')?.id;
        if (art.id !== defaultArtId) {
          // 鸿蒙两仪神剑：阴阳茶夫妻
          if (art.id === 'art-yinyang-sword') {
            const owns = player.companions.details['tc-yinyangcha']?.isSpouse;
            if (!owns) return { success: false, reason: '尚未获得该无上神器' };
          } else if (art.id === 'art-dream-sword') {
            // 永念梦之剑：梦小茶夫妻
            const owns = player.companions.details['tc-mengxiaocha']?.isSpouse;
            if (!owns) return { success: false, reason: '尚未获得该无上神器' };
          } else if (art.id === 'art-tianyu-spear') {
            // 寰宇之枪：甜小茶夫妻
            const owns = player.companions.details['tc-tianxiaocha']?.isSpouse;
            if (!owns) return { success: false, reason: '尚未获得该无上神器' };
          } else {
            // 其他无上神器默认需要任意夫妻（防御性）
            const owns = Object.values(player.companions.details).some(d => d.isSpouse);
            if (!owns) return { success: false, reason: '尚未获得该无上神器' };
          }
        }
      }
    }
    setPlayer((p) => ({
      ...p,
      divineTrial: {
        ...p.divineTrial,
        activeArtifactId: artifactId,
      },
    }));
    return { success: true };
  };

  // ============================================================
  // 🔴 吞噬茶武魂专属：吞噬天赋 / 特殊魂灵 / 强配混沌茶
  // ============================================================

  const DEVOUR_ATTR_KEYS: { key: keyof IPlayer['devour']; label: string }[] = [
    { key: 'totalAttack', label: '攻击' },
    { key: 'totalDefense', label: '防御' },
    { key: 'totalSpeed', label: '速度' },
    { key: 'totalSpirit', label: '精神' },
    { key: 'totalHp', label: '血量' },
  ];

  /** 根据魂兽年限获取吞噬属性加成区间 [min, max]（v2.0 大幅降低约90%） */
   function getDevourRange(years: number): [number, number] {
     if (years < 100) return [1, 5];                     // 十年
     if (years < 1000) return [5, 20];                   // 百年
     if (years < 10000) return [20, 100];                // 千年
     if (years < 100000) return [100, 500];              // 万年
     if (years < 1000000) return [500, 2000];            // 十万年
     return [2000, 10000];                                // 百万年及以上
   }

   /** v22.0 根据魂兽年限获取反噬数值区间 [min, max]（比吞噬增益降低约50%） */
   function getBacklashRange(years: number): [number, number] {
     if (years < 100) return [1, 3];                      // 十年
     if (years < 1000) return [3, 10];                    // 百年
     if (years < 10000) return [10, 50];                  // 千年
     if (years < 100000) return [50, 200];                // 万年
     if (years < 1000000) return [200, 1000];             // 十万年
     return [1000, 5000];                                  // 百万年及以上
   }

   /** 反噬属性键映射：总属性→反噬属性 */
   const BACKLASH_ATTR_MAP: Record<string, { key: keyof IPlayer['devour']; label: string }> = {
     totalAttack: { key: 'backlashAttack', label: '攻击' },
     totalDefense: { key: 'backlashDefense', label: '防御' },
     totalSpeed: { key: 'backlashSpeed', label: '速度' },
     totalSpirit: { key: 'backlashSpirit', label: '精神' },
     totalHp: { key: 'backlashHp', label: '血量' },
   };

   /** 吞噬魂兽：根据年限随机增加一项五维属性（主修或副修是吞噬茶均可触发）
     *  5%概率触发反噬，随机降低一项属性（数值比增益低约50%）
     */
    const devourBeast = (beastYears: number, _beastName: string) => {
      if (!player) return { success: false, reason: '玩家数据不存在' };
     const isTunshi = player.martialSoul.name === '混沌无极' || (player.isTwinSoul && player.secondSoul?.name === '混沌无极');
     if (!isTunshi) {
       return { success: false, reason: '仅有混沌无极武魂可吞噬魂兽' };
      }
      const [lo, hi] = getDevourRange(beastYears);
      const value = Math.floor(lo + Math.random() * (hi - lo + 1));
      const attrItem = DEVOUR_ATTR_KEYS[Math.floor(Math.random() * DEVOUR_ATTR_KEYS.length)];
      // 🔴 吞噬反噬：5%概率，随机降低一项五维属性（数值比增益低约50%）
      const BACKLASH_CHANCE = 0.05;
      const isBacklash = Math.random() < BACKLASH_CHANCE;
      let backlashValue = 0;
      let backlashAttrKey: keyof IPlayer['devour'] | null = null;
      let backlashAttrLabel = '';
      if (isBacklash) {
        const [blo, bhi] = getBacklashRange(beastYears);
        backlashValue = Math.floor(blo + Math.random() * (bhi - blo + 1));
        // 从五维中随机选一个属性降低
        const randAttr = DEVOUR_ATTR_KEYS[Math.floor(Math.random() * DEVOUR_ATTR_KEYS.length)];
        const mapped = BACKLASH_ATTR_MAP[randAttr.key];
        backlashAttrKey = mapped.key;
        backlashAttrLabel = mapped.label;
      }
      setPlayer((p) => {
        const dev = { ...p.devour };
        dev.count = (dev.count ?? 0) + 1;
        dev[attrItem.key] = (dev[attrItem.key] ?? 0) + value;
        if (isBacklash && backlashAttrKey) {
          dev.backlashCount = (dev.backlashCount ?? 0) + 1;
          dev[backlashAttrKey] = (dev[backlashAttrKey] ?? 0) + backlashValue;
        }
        return { ...p, devour: dev };
      });
      return {
        success: true,
        attr: attrItem.key,
        attrLabel: attrItem.label,
        value,
        isBacklash,
        backlashValue,
        backlashAttr: backlashAttrKey,
        backlashAttrLabel,
      };
     };

  // ============================================================
  // 🔴 v22.0 百级神级修炼 + 法则碎片系统
  // ============================================================

  const LAW_NAMES: Record<string, string> = {
    time: '时间法则', space: '空间法则', gold: '金之法则',
    wood: '木之法则', water: '水之法则', fire: '火之法则',
    earth: '土之法则', light: '光之法则', dark: '暗之法则',
    chaos: '混沌法则',
  };

  const NORMAL_LAWS = ['time', 'space', 'gold', 'wood', 'water', 'fire', 'earth', 'light', 'dark'];

  /** 根据神位tier获取等级上限 */
  function getGodLevelCap(tier: string): number {
    if (tier === 'supreme') return 169;
    if (tier === 'king') return 159;
    if (tier === 'first') return 149;
    return 139; // second
  }

  /** 解锁百级神级修炼（继承神位+击败混沌茶后调用） */
  const unlockGodLevelCultivation = () => {
    setPlayer((p) => {
      if (!p.divineTrial?.inherited) return p;
      // 确认击败过混沌茶（在伴侣details中）
      const hundunDetail = p.companions?.details?.['tc-hunduncha'];
      if (!hasDefeatedHundun(p)) return p;
      if (p.divineTrial.godLevelProgress?.unlocked) return p;
      const trial = DIVINE_TRIALS.find((t) => t.id === p.divineTrial!.chosenTrialId);
      const tier = (trial?.tier as 'second' | 'first' | 'king' | 'supreme') || 'second';
      const cap = getGodLevelCap(tier);
      return {
        ...p,
        divineTrial: {
          ...p.divineTrial!,
          godLevelProgress: {
            unlocked: true,
            currentTier: tier,
            levelCap: cap,
          },
        },
      };
    });
  };

  /** 检查是否可以解锁百级修炼（条件：继承神位 + 击败混沌茶） */
  const canUnlockGodLevel = (): boolean => {
    if (!player?.divineTrial?.inherited) return false;
    const hundunDetail = player.companions?.details?.['tc-hunduncha'];
    if (!hasDefeatedHundun(player)) return false;
    return true;
  };

  /** 选择法则碎片（百级后每升2级获得1枚，由玩家选择类型） */
  const chooseLawFragment = (lawType: string): { success: boolean; reason?: string } => {
    if (!player) return { success: false, reason: '玩家不存在' };
    if (!player.divineTrial?.godLevelProgress?.unlocked) {
      return { success: false, reason: '尚未解锁神级修炼' };
    }
    if(!NORMAL_LAWS.includes(lawType as any))return {success:false,reason:'请选择普通法则'};
    if (player.level < 101) return { success: false, reason: '101级后才可获得法则碎片' };

    // 计算当前等级应该获得多少枚碎片：(level - 100) / 2，向下取整
    const totalFragmentsEarned = Math.floor((player.level - 100) / 2);
    // 已领取的碎片数 = 所有普通法则碎片总数（chaos单独计算）
    const frags = player.divineTrial.lawFragments;
    const totalClaimed = NORMAL_LAWS.reduce((s,k)=>s+(frags[k as keyof typeof frags]||0)+(player.divineTrial.lawsFused?.[k]?3:0),0);

    if (totalClaimed >= totalFragmentsEarned) {
      return { success: false, reason: '暂无法则碎片可领取' };
    }
    // 每个法则最多3枚
    if(player.divineTrial.lawsFused?.[lawType])return {success:false,reason:'已融合该法则'};
    const current = frags[lawType as keyof typeof frags] || 0;
    if (current >= 3) {
      return { success: false, reason: `${LAW_NAMES[lawType] || lawType}碎片已达上限（3枚）` };
    }
    // 所有法则全满了就不再获得
    const allFull = NORMAL_LAWS.every((k) => (frags[k as keyof typeof frags] || 0) >= 3);
    if (allFull) return { success: false, reason: '所有法则碎片已集齐' };

    setPlayer((p) => {
      if(!localPendingLawChoices(p.level,p.divineTrial)||p.divineTrial?.lawsFused?.[lawType]||(p.divineTrial?.lawFragments?.[lawType]||0)>=3)return p;
      const lf = { ...p.divineTrial!.lawFragments };
      lf[lawType as keyof typeof lf] = (lf[lawType as keyof typeof lf] || 0) + 1;
      return {
        ...p,
        divineTrial: { ...p.divineTrial!, lawFragments: lf, pendingLawFragmentChoices: localPendingLawChoices(p.level,{...p.divineTrial,lawFragments:lf}) },
      };
    });
    return { success: true };
  };

  /** 融合法则（3枚碎片→1个法则） */
  const fuseLaw = (lawType: string): { success: boolean; reason?: string } => {
    if (!player) return { success: false, reason: '玩家不存在' };
    const frags = player.divineTrial?.lawFragments;
    const fused = player.divineTrial?.lawsFused;
    if (!frags || !fused) return { success: false, reason: '系统未解锁' };

    // 混沌法则特殊：需9枚，且169级后才能融合
    if (lawType === 'chaos') {
      if (player.level < 169) return { success: false, reason: '达到169级后才能融合混沌法则' };
      if ((frags.chaos || 0) < 9) return { success: false, reason: '需要9枚混沌法则碎片' };
      if (fused.chaos) return { success: false, reason: '已融合混沌法则' };
      setPlayer((p) => {
        const lf = { ...p.divineTrial!.lawFragments, chaos: (p.divineTrial!.lawFragments.chaos || 0) - 9 };
        const lfuse = { ...p.divineTrial!.lawsFused, chaos: true };
        return { ...p, divineTrial: { ...p.divineTrial!, lawFragments: lf, lawsFused: lfuse } };
      });
      return { success: true };
    }

    if ((frags as any)[lawType] < 3) return { success: false, reason: '需要3枚相同法则碎片' };
    if ((fused as any)[lawType]) return { success: false, reason: '已融合该法则' };
    if (!NORMAL_LAWS.includes(lawType)) return { success: false, reason: '未知法则类型' };

    setPlayer((p) => {
      const lf = { ...p.divineTrial!.lawFragments };
      (lf as any)[lawType] = (lf as any)[lawType] - 3;
      const lfuse = { ...p.divineTrial!.lawsFused };
      (lfuse as any)[lawType] = true;
      return { ...p, divineTrial: { ...p.divineTrial!, lawFragments: lf, lawsFused: lfuse } };
    });
    return { success: true };
  };

  /** 百级突破（每10级消耗一个法则，突破后等级上限+10） */
  const godBreakthrough = (lawType: string): { success: boolean; reason?: string } => {
    const required = player ? getMaxExp(player.level, player.easterRealmStage) : 0;
    const reason = godBreakthroughError(player, lawType, required);
    if (reason) return { success: false, reason };
    const expectedLevel = player!.level;
    setPlayer(p => {
      const next = applyGodBreakthrough(p, lawType, getMaxExp(p.level, p.easterRealmStage), expectedLevel);
      if (next === p) return p;
      return { ...next, currentHp: calcAttributes(next).hp };
    });
    return { success: true };
  };

  /** 检查指定等级是否是百级以上瓶颈（需要法则突破） */
  const isGodBottleneck = (lvl: number): boolean => {
    return lvl >= 100 && lvl % 10 === 9;
  };

  /** 获取已融合的法则数量 */
  const getFusedLawsCount = (): number => {
    if (!player?.divineTrial?.lawsFused) return 0;
    const f = player.divineTrial.lawsFused;
    return Object.values(f).filter(Boolean).length;
  };

  /** 记录击败茶城角色次数，返回最新次数 */
  const recordTeaDefeat = (teaId: string): number => {
    if (!player) return 0;
    let next = 0;
    setPlayer((p) => {
      const counts = { ...p.teaDefeatCounts };
      counts[teaId] = (counts[teaId] ?? 0) + 1;
      next = counts[teaId];
      return { ...p, teaDefeatCounts: counts };
    });
    return next;
  };

  const getTeaDefeatCount = (teaId: string): number => {
    if (!player) return 0;
    return player.teaDefeatCounts[teaId] ?? 0;
  };

  /** 转化特殊魂灵（三茶） */
  const convertSpecialSpirit = (
    spiritId: string,
    name: string,
    attribute: string,
    sourceId: string,
    hp: number,
    attack: number,
    defense: number,
    speed: number,
    spirit: number,
    skillName: string,
    skillDesc: string,
    instantKillChance: number,
    iconChar: string,
  ) => {
    if (!player) return { success: false, reason: '玩家数据不存在' };
    const isTunshi2 = player.martialSoul.name === '混沌无极' || (player.isTwinSoul && player.secondSoul?.name === '混沌无极');
    if (!isTunshi2) {
      return { success: false, reason: '仅有混沌无极武魂可转化特殊魂灵' };
     }
    if (player.specialSoulSpirits.some(s => s.spiritId === spiritId)) {
      return { success: false, reason: '该特殊魂灵已存在' };
    }
    const newSpirit: ISpecialSoulSpirit = {
      spiritId, name, attribute, sourceId,
      hp, attack, defense, speed, spirit,
      skillName, skillDesc, instantKillChance, iconChar,
      quality: 'special',
    };
    setPlayer((p) => ({ ...p, specialSoulSpirits: [...p.specialSoulSpirits, newSpirit] }));
    return { success: true };
  };

  /** 切换特殊魂灵上阵（不占用普通魂灵上限） */
  const toggleSpecialSpiritActive = (spiritId: string) => {
    if (!player) return { success: false, reason: '玩家数据不存在' };
    const exists = player.specialSoulSpirits.some(s => s.spiritId === spiritId);
    if (!exists) return { success: false, reason: '特殊魂灵不存在' };
    setPlayer((p) => {
      const ids = p.specialActiveSpiritIds.includes(spiritId)
        ? p.specialActiveSpiritIds.filter(id => id !== spiritId)
        : [...p.specialActiveSpiritIds, spiritId];
      return { ...p, specialActiveSpiritIds: ids };
    });
    return { success: true };
  };

  /** 强配混沌茶：突破唯一夫妻限制，直接成为夫妻，并给全属性+10% */
  const forceMarryHundunCha = () => {
    if (!player) return { success: false, reason: '玩家数据不存在' };
    const id = 'tc-hunduncha';
    const detail = player.companions.details[id];
    if (!detail) return { success: false, reason: '尚未结识混沌茶' };
    setPlayer((p) => {
      const details = { ...p.companions.details };
       details[id] = {
         ...details[id],
         isLover: true,
         isSpouse: true,
         isForcedSpouse: true, // 强制配偶标记
         favorability: 150,    // 直接满好感
         transformed: true,
         becameLoverAt: Date.now(),
       };
      return { ...p, companions: { ...p.companions, details } };
    });
    return { success: true };
  };

  const hasHundunChaSpouse = (): boolean => {
     if (!player) return false;
     return !!player.companions.details['tc-hunduncha']?.isSpouse;
   };

   // ===== 一键扫荡系统 =====
   const getSweepCount = (areaKey: string): number => {
     if (!player) return 0;
     return player.sweepExploreCounts?.[areaKey] ?? 0;
   };

   const incrementSweepCount = (areaKey: string) => {
     setPlayer((p) => {
       if (!p) return p;
       const prev = p.sweepExploreCounts?.[areaKey] ?? 0;
       return {
         ...p,
         sweepExploreCounts: {
           ...(p.sweepExploreCounts || {}),
           [areaKey]: prev + 1,
         },
       };
     });
   };

   const setSweepFilters = (ringYears: number, boneYears: number) => { setPlayer(p=>p?{...p,sweepAutoDestroyRingYears:normalizeSweepYears(ringYears),sweepAutoSellBoneYears:normalizeSweepYears(boneYears)}:p); };
   const settleJiYueBattle = useCallback((id: string,phase: string)=>{setPlayer(p=>p?settleJiYueVictory(p,id,phase):p);},[]);
   const settleLiehunVictory = useCallback((ledger: LiehunLedger, phase: string) => {setPlayer(p=>p?settleLiehunGrowth(p,ledger,phase):p);},[]);
   const sweepExplore = (
     areaKey: string,
     params: {
       yearMin: number;
       yearMax: number;
       staminaCost: number;
       attributeFilter?: string | string[];
       rareChance?: number;
       rareBoostMin?: number;
       rareBoostMax?: number;
       nodesCount?: number;
     },
   ) => {
     if (!player) return { success: false, reason: '玩家数据不存在' };
     if(getSweepCount(areaKey)<10)return {success:false,reason:'需探索10次后解锁扫荡'};
     const { yearMin, yearMax, attributeFilter, rareChance = 0, rareBoostMin = 1, rareBoostMax = 1, nodesCount = 6 } = params;
     // 消耗总体力 = 单个节点体力 × 节点数
     const totalStamina = params.staminaCost * nodesCount;
     const maxStamina = getStaminaMax(player.level);
     const { stamina: currentStamina } = calcRecoveredStamina(player.stamina, player.staminaUpdatedAt, maxStamina);
     if (currentStamina < totalStamina) {
       return { success: false, reason: `体力不足，需要 ${totalStamina} 点，当前 ${Math.floor(currentStamina)} 点` };
     }

     const beasts: any[] = [];
     let rings: any[] = [];
     let items: any[] = [];
     let totalCoins = 0;
     let totalExp = 0;
     const now = Date.now();

     for (let i = 0; i < nodesCount; i++) {
       const beast = generateBeastByYearRange(yearMin, yearMax, rareChance, rareBoostMin, rareBoostMax, attributeFilter);
       if (!beast) continue;
       beasts.push(beast);

       // 魂环：直接生成一个（扫荡默认必得魂环，简化处理）
       const ringYears = beast.years;
       const beastType = inferBeastTypeFromRing({ soulBeastName: beast.name });
       const ringStats = calcRingStatsByYears(ringYears, beastType);
       const qualityInfo = getRingQualityFromYears(ringYears);
       const qualityColor = qualityInfo.color;
       const qualityLabel = qualityInfo.label;
       const ringId = `sweep-${areaKey}-${i}-${now}-${Math.random().toString(36).slice(2, 6)}`;
       const ringElement = localBeastElement(beast.element,beast.name);
       const ring = {
         id: ringId,
         years: ringYears,
         color: qualityColor as ISoulRing['color'],
         qualityColor,
         qualityLabel,
         soulBeastName: beast.name,
         skillName: getSkillNameForBeast(beast.name, '第一魂技'),
         skillDesc: `来自 ${beast.name} 的魂技`,
         beastAttribute: ringElement,
         beastType,
         attackBonus: ringStats.attackBonus,
         defenseBonus: ringStats.defenseBonus,
         speedBonus: ringStats.speedBonus,
         spiritBonus: ringStats.spiritBonus,
         hpBonus: ringStats.hpBonus,
         critRateBonus: ringStats.critRateBonus,
         critDmgBonus: ringStats.critDmgBonus,
         soulPowerBonus: ringStats.soulPowerBonus,
         skillDamage: ringStats.skillDamage,
         skillDamagePct: 0,
         skillType: 'attack' as const,
         soulIndex: 0,
         expiresAt: now + 3 * 60 * 1000, // 3分钟
       };
       if(!areaKey.startsWith('mountain'))rings.push(ring);

       // 魂骨：概率掉落（rollSoulBoneDrop 返回物品本身，可能为null）
       const bone = rollSoulBoneDrop(beast.years, beast.name, qualityColor, ringElement);
       if (bone) {
         items.push(bone);
       }

       // 金币 + 经验（按年限估算，约为猎魂战斗的一半）
       const coinGain = Math.floor(beast.years / 10) + 100;
       const expGain = Math.floor(beast.years / 50) + 50;
       totalCoins += coinGain;
       totalExp += expGain;
     }

     const filtered = filterSweepDrops(rings,items,player.sweepAutoDestroyRingYears,player.sweepAutoSellBoneYears);
     rings=filtered.rings;items=filtered.items;totalCoins+=filtered.summary.soldCoins;
     // 应用：扣体力 + 加金币 + 加经验 + 魂环进入待吸收 + 物品入背包 + 增加探索次数
     setPlayer((p) => {
       if (!p) return p;
       const { stamina: curStam } = calcRecoveredStamina(p.stamina, p.staminaUpdatedAt, maxStamina);
       const nextStamina = Math.max(0, curStam - totalStamina);
       const prevCount = p.sweepExploreCounts?.[areaKey] ?? 0;

       let newP: IPlayer = {
         ...p,
         stamina: nextStamina,
         staminaUpdatedAt: now,
         soulCoins: p.soulCoins + totalCoins,
         pendingSoulRings: [...p.pendingSoulRings, ...rings],
        sweepExploreCounts: {
          ...(p.sweepExploreCounts || {}),
          [areaKey]: prevCount + 1,
        },
       };
       // 物品入库
       for (const item of items) {
         const inv = [...(newP as any).inventory || []];
         inv.push({ ...item, id: `${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` });
         newP = { ...newP, inventory: inv };
       }
       return newP;
     });

     // 加经验（独立处理升级）
     if (totalExp > 0) {
       // 用 setTimeout 避免 setState 嵌套
       setTimeout(() => addExp(totalExp), 0);
     }

     return {
       success: true,
       result: {
         beasts,
         rings,
         items,
         coins: totalCoins,
         exp: totalExp,
         filterSummary: filtered.summary,
       },
     };
   };

   // ===== 轮回之影系统 =====
   const getReincarnationShadow = (): IReincarnationOrb | null => {
     if (!player) return null;
     const orbs = player.reincarnation?.orbs || [];
     if (orbs.length === 0) return null;
     // 返回最近一世（最后一个）
     return orbs[orbs.length - 1] || null;
   };

   const hasShadowChallengedToday=()=>false;
   const startShadowChallenge=()=>{const orb=getReincarnationShadow();return orb?{success:true,orb}:{success:false,reason:'尚无前世记录'};};
   const claimShadowVictory = (expReward: number, coinReward: number) => {
     if (!player) return { success: false, reason: '玩家数据不存在' };
     if (expReward > 0) {
       setTimeout(() => addExp(expReward), 0);
     }
     if (coinReward > 0) {
       setPlayer((p) => p ? { ...p, soulCoins: p.soulCoins + coinReward } : p);
     }
     return { success: true };
   };

   // 收取魂环（进入待吸收列表，3分钟时限）
  const addPendingRing = (ring: IPendingSoulRing) => {
    setPlayer((p) => ({
      ...p,
      pendingSoulRings: [...p.pendingSoulRings, ring].slice(-20), // 最多20个
    }));
  };

  // 吸收待吸收魂环到指定槽位
  // soulIndex: 0=主修武魂（默认）, 1=次修武魂（第二武魂）
  // 返回 { success: 是否成功, levelDropped: 是否因失败倒退等级 }
  const absorbPendingRing = (
    pendingRingId: string,
    slotIndex: number,
    soulIndex: 0 | 1 = 0,
  ): { success: boolean; levelDropped: boolean } => {
    let success = false;
    let levelDropped = false;
    setPlayer((p) => {
      const ring = p.pendingSoulRings.find((r) => r.id === pendingRingId);
      if (!ring) return p;
      const maxRings = getMaxRings(p.level);
      // slotIndex 必须合法（0 ~ 当前环数，也就是插入到下一个空位）
      if (slotIndex < 0 || slotIndex >= maxRings) return p;
      // 到期检查
      if (ring.expiresAt <= Date.now()) return p;

      const isSecondSoul = soulIndex === 1;
      const targetRings = isSecondSoul ? (p.secondSoulRings ?? []) : p.soulRings;

      // 只能按顺序吸收，slotIndex 必须等于当前环数（不能跳过中间槽位）
      if (slotIndex !== targetRings.length) return p;

      // 第二武魂不存在
      if (isSecondSoul && !p.secondSoul) return p;
      // 🔴 修复：第二武魂魂环吸收必须是双生武魂，单武魂玩家不可吸收
      if (isSecondSoul && !p.isTwinSoul) return p;

      // 🔴 第一武魂硬上限 9 个普通魂环，防止成神后 maxRings > 9 导致第10个魂环异常
      if (!isSecondSoul && targetRings.length >= 9) return p;

      // v2.0 第二武魂：检查当前境界是否允许吸收该槽位
      if (isSecondSoul) {
        const maxCount = getSecondSoulMaxRingCount(p.level);
        if (targetRings.length >= maxCount) return p;
      }

       // 计算成功率并判定
       const years = ring.years ?? 0;
       const ringBonus = p.reincarnation?.totalRingYearBonus ?? 0;
       const ringBonusPct = p.reincarnation?.ringYearBonusPct ?? 0;
       const successRate = isSecondSoul
         ? calcSecondSoulAbsorbSuccessRate(p.level, years, slotIndex, ringBonus, ringBonusPct)
         : calcAbsorbSuccessRate(slotIndex, years, ringBonus, ringBonusPct);
      const roll = Math.random() * 100;
      const isSuccess = roll < successRate;

       if (isSuccess) {
         success = true;
         const newRings = [...targetRings];
         // 吸收成功时根据准确的 slotIndex 和武魂元素重算 skillDamagePct
          const soul = isSecondSoul ? p.secondSoul : p.martialSoul;
          const playerEl = soul?.element || getSoulElement(soul?.name || '');
          const affinity = calcElementAffinity(playerEl, ring.beastAttribute);
          // 天梦冰蚕魂环：使用专属成长公式（按大境界成长，而非固定年限）
          const sdp = ring.color === 'blueWhite'
            ? calcTianmengDamagePct(p.level)
            : calcSkillDamagePct(ring.years ?? 100, ring.beastType || 'qiang', slotIndex, affinity);

         // 🔴 关键修复：吸收时无条件用对应武魂重新生成 skillName 和 skillType
         // 彻底杜绝「第二武魂魂环显示第一武魂魂技名」的bug
         // 原因：掉落时魂技名根据掉落时的 targetSoul 生成，若归属标记有误或跨武魂吸收，
         // 旧逻辑只在武魂真身/buff 情况下才重算，导致大部分魂环保留错误名字
          const soulSkills = soul ? generateSoulSkills(soul) : [];
          const soulName = soul?.name || '武魂';
          let fixedRing: ISoulRing = {
             ...ring,
             skillDamagePct: sdp,
             beastAttribute: ring.beastAttribute || inferElementFromName(ring.soulBeastName || ''),
           };
          if (slotIndex === 6) {
            // 第7魂环：武魂真身（固定）
            fixedRing = {
              ...fixedRing,
              skillName: '武魂真身',
              skillType: 'buff',
              buffAttr: 'attack',
              skillDesc: `释放${soulName}真身，全属性与魂技威力大幅提升！`,
            };
           } else {
             // 其他位置：直接用对应武魂的 generateSoulSkills 结果校准
             // 🔴 防御性修复：slotIndex >= 9 时兜底为「神技」，杜绝「第十魂技」错误显示
             const correctName = soulSkills[slotIndex] || (slotIndex < 9 ? `第${slotIndex + 1}魂技` : '神技');
            // 根据武魂系别 + 槽位推断技能类型与描述（与掉落时逻辑保持一致，彻底杜绝张冠李戴）
            const dept = soul ? getSoulDepartment(soul.type) : '强攻系';
            let correctType: 'attack' | 'heal' | 'buff' | 'allBuff' = 'attack';
            let correctBuffAttr: 'attack' | 'defense' | 'speed' | 'spirit' | undefined;
            let correctDesc = `由${soulName}衍生的第${slotIndex + 1}魂技，威力随魂环品质提升。`;
             if (dept === '辅助系') {
               // 辅助系：奇位(第1/3/5/9魂技)攻击型，偶位(第2/4/6/8魂技)辅助型
               if (slotIndex % 2 === 0) {
                 // 索引0/2/4/8 → 第1/3/5/9魂技：攻击型
                 correctType = 'attack';
                 correctDesc = `凝聚${soulName}之力发动攻击，威力随魂环品质提升。`;
               } else {
                 // 索引1/3/5/7 → 第2/4/6/8魂技：辅助型
                 // buffIdx: idx=1→0, idx=3→1, idx=5→2, idx=7→3
                 const buffIdx = Math.floor((slotIndex - 1) / 2);
                 const attrList: ('attack' | 'defense' | 'speed' | 'spirit')[] = ['attack', 'defense', 'speed', 'spirit'];
                 if (slotIndex === 1 || slotIndex === 3 || slotIndex === 5) {
                   // 第2/4/6魂技：治疗
                   correctType = 'heal';
                   correctDesc = `恢复自身气血，治疗量随魂环品质提升。`;
                 } else if (slotIndex === 7) {
                   // 第8魂技：增益（对应 buffIdx=3 → spirit）
                   correctBuffAttr = attrList[buffIdx % 4];
                   correctType = 'buff';
                   const attrCN = correctBuffAttr === 'attack' ? '攻击'
                     : correctBuffAttr === 'defense' ? '防御'
                     : correctBuffAttr === 'speed' ? '速度'
                     : '精神';
                   correctDesc = `提升自身${attrCN}力，持续3回合。`;
                 } else {
                   // 其他索引兜底（正常流程不会走到）
                   correctType = 'allBuff';
                   correctBuffAttr = 'attack';
                   correctDesc = `全面提升自身攻击、防御、速度、精神力，持续3回合。`;
                 }
               }
             }
             // 吸收时以武魂为准重算，彻底覆盖旧的掉落数据，避免跨武魂张冠李戴
             fixedRing = { ...fixedRing, skillName: correctName, skillType: correctType as any, buffAttr: correctBuffAttr as any, skillDesc: correctDesc };
           }

           // 🔴 魂环数值加成按武魂修炼方向重算
           // 强攻系→主加攻击，敏攻系→主加速度，辅助/控制系→主加精神，防御系→主加防御
           // 魂环的元素属性只影响共鸣和技能伤害百分比，不影响加什么属性
           const ringBeastType=['qiang','min','kong','fu','fang'].includes(fixedRing.beastType)?fixedRing.beastType:'qiang';
           const ringStats=localRingGrowthStats(fixedRing,fixedRing.years??100,ringBeastType);
           fixedRing = {
             ...fixedRing,
             beastType: ringBeastType,
             originalBeastType: ringBeastType,
             attackBonus: ringStats.attackBonus,
             defenseBonus: ringStats.defenseBonus,
             speedBonus: ringStats.speedBonus,
             spiritBonus: ringStats.spiritBonus,
             hpBonus: ringStats.hpBonus,
             critRateBonus: ringStats.critRateBonus,
             critDmgBonus: ringStats.critDmgBonus,
             soulPowerBonus: ringStats.soulPowerBonus,
             skillDamage: ringStats.skillDamage,
           };

          newRings[slotIndex] = fixedRing;
        // 吸收成功后重新计算属性并回满血（新魂环提升了最大血量）
        const newP: IPlayer = {
          ...p,
          soulRings: isSecondSoul ? p.soulRings : newRings,
          secondSoulRings: isSecondSoul ? newRings : (p.secondSoulRings ?? []),
          pendingSoulRings: p.pendingSoulRings.filter((r) => r.id !== pendingRingId),
        };
        const newAttrs = calcAttributes(newP);
        return { ...newP, currentHp: newAttrs.hp };
      }

      // v2.0 吸收失败：魂环损毁，不掉级（所有魂环均不掉级）
      return {
        ...p,
        pendingSoulRings: p.pendingSoulRings.filter((r) => r.id !== pendingRingId),
      };
    });
    return { success, levelDropped };
  };

  // 销毁待吸收魂环
  const discardPendingRing = (pendingRingId: string) => {
    setPlayer((p) => ({
      ...p,
      pendingSoulRings: p.pendingSoulRings.filter((r) => r.id !== pendingRingId),
    }));
  };

  // 清理过期魂环（3分钟时限，超时自动消失）
  const cleanupExpiredRings = () => {
    const now = Date.now();
    setPlayer((p) => {
      const alive = p.pendingSoulRings.filter((r) => r.expiresAt > now);
      if (alive.length === p.pendingSoulRings.length) return p;
      return { ...p, pendingSoulRings: alive };
    });
  };

  // ============================================================
  // 魂灵系统
  // ============================================================

  // 添加待选择魂灵（7分钟时限）
  const addPendingSpirit = (spirit: IPendingSoulSpirit) => {
    setPlayer((p) => ({
      ...p,
      pendingSpirits: [...p.pendingSpirits, spirit].slice(-20),
    }));
  };

  // 契约魂灵（从待选择列表契约，永久获得）
  const contractSpirit = (pendingId: string): { success: boolean; reason?: string } => {
    let result = { success: false, reason: '' };
    setPlayer((p) => {
      const pending = p.pendingSpirits.find((s) => s.id === pendingId);
      if (!pending) {
        result = { success: false, reason: '魂灵已消失' };
        return p;
      }
      if (pending.expiresAt <= Date.now()) {
        result = { success: false, reason: '魂灵契约时限已过' };
        return p;
      }
      // 检查是否已契约过同名魂灵（需不同魂灵）
      if (p.soulSpirits.some((s) => s.spiritId === pending.spiritId)) {
        result = { success: false, reason: '已契约过该魂灵' };
        return p;
      }
      // 检查魂灵槽位数量限制
      const maxSlots = getMaxSpiritSlots(p.level);
      if (p.soulSpirits.length >= maxSlots) {
        result = { success: false, reason: `当前等级最多契约${maxSlots}个魂灵` };
        return p;
      }
      const newSpirit: IPlayerSoulSpirit = {
        spiritId: pending.spiritId,
        name: pending.name,
        attribute: pending.attribute,
        majorIndex: 0,
        minor: 1,
        currentHp: 0, // 下面根据初始属性计算
        iconChar: pending.iconChar,
      };
      // 计算初始血量
      const template = SOUL_SPIRIT_POOL.find((s) => s.id === pending.spiritId);
      if (template) {
        const stats = getSpiritStats(template, 0, 1);
        newSpirit.currentHp = stats.hp;
      }
      result = { success: true, reason: '' };
      return {
        ...p,
        soulSpirits: [...p.soulSpirits, newSpirit],
        pendingSpirits: p.pendingSpirits.filter((s) => s.id !== pendingId),
      };
    });
    return result;
  };

  // 丢弃待选择魂灵
  const discardPendingSpirit = (pendingId: string) => {
    setPlayer((p) => ({
      ...p,
      pendingSpirits: p.pendingSpirits.filter((s) => s.id !== pendingId),
    }));
  };

  // 清理过期待选择魂灵
  const cleanupExpiredSpirits = () => {
    setPlayer((p) => {
      const now = Date.now();
      const alive = p.pendingSpirits.filter((s) => s.expiresAt > now);
      if (alive.length === p.pendingSpirits.length) return p;
      return { ...p, pendingSpirits: alive };
    });
  };

  // 魂灵小境界升级
  const upgradeSpirit = (spiritId: string): { success: boolean; reason?: string } => {
    let result = { success: false, reason: '' };
    setPlayer((p) => {
      const idx = p.soulSpirits.findIndex((s) => s.spiritId === spiritId);
      if (idx < 0) {
        result = { success: false, reason: '魂灵不存在' };
        return p;
      }
      const spirit = p.soulSpirits[idx];
      // 神级第9重无法再升
      if (spirit.majorIndex >= SPIRIT_MAJOR_REALMS.length - 1 && spirit.minor >= 9) {
        result = { success: false, reason: '已达最高境界' };
        return p;
      }
      // 第9重需要先突破大境界
      if (spirit.minor >= 9) {
        result = { success: false, reason: '当前大境界已满，请先突破' };
        return p;
      }
      const cost = calcSpiritUpgradeCost(spirit.majorIndex, spirit.minor);
      if (p.soulCoins < cost) {
        result = { success: false, reason: '魂币不足' };
        return p;
      }
      const newSpirits = [...p.soulSpirits];
      newSpirits[idx] = { ...spirit, minor: spirit.minor + 1 };
      // 提升后回满血
      const template = SOUL_SPIRIT_POOL.find((s) => s.id === spirit.spiritId);
      if (template) {
        const stats = getSpiritStats(template, newSpirits[idx].majorIndex, newSpirits[idx].minor, newSpirits[idx].evolutionStage);
        newSpirits[idx].currentHp = stats.hp;
      }
      result = { success: true, reason: '' };
      return { ...p, soulCoins: p.soulCoins - cost, soulSpirits: newSpirits };
    });
    return result;
  };

  // 魂灵大境界突破
  const breakthroughSpirit = (spiritId: string): { success: boolean; reason?: string } => {
    let result = { success: false, reason: '' };
    setPlayer((p) => {
      const idx = p.soulSpirits.findIndex((s) => s.spiritId === spiritId);
      if (idx < 0) {
        result = { success: false, reason: '魂灵不存在' };
        return p;
      }
      const spirit = p.soulSpirits[idx];
      if (spirit.minor < 9) {
        result = { success: false, reason: '需达到第9重才能突破' };
        return p;
      }
      if (spirit.majorIndex >= SPIRIT_MAJOR_REALMS.length - 1) {
        result = { success: false, reason: '已达最高大境界' };
        return p;
      }
      const cost = calcSpiritBreakthroughCost(spirit.majorIndex);
      if (p.soulCoins < cost) {
        result = { success: false, reason: '魂币不足' };
        return p;
      }
      const newSpirits = [...p.soulSpirits];
      newSpirits[idx] = { ...spirit, majorIndex: spirit.majorIndex + 1, minor: 1 };
      // 突破后回满血
      const template = SOUL_SPIRIT_POOL.find((s) => s.id === spirit.spiritId);
      if (template) {
        const stats = getSpiritStats(template, newSpirits[idx].majorIndex, newSpirits[idx].minor, newSpirits[idx].evolutionStage);
        newSpirits[idx].currentHp = stats.hp;
      }
      result = { success: true, reason: '' };
      return { ...p, soulCoins: p.soulCoins - cost, soulSpirits: newSpirits };
    });
    return result;
  };

  // 设置上阵魂灵
  const setActiveSpirits = (ids: string[]) => {
    setPlayer((p) => {
      const valid = ids.filter((id) => p.soulSpirits.some((s) => s.spiritId === id)).slice(0, 4);
      return { ...p, activeSpiritIds: valid };
    });
  };

  const setCurrentHp = (hp: number) => {
    setPlayer((p) => {
      const attrs = calcAttributes(p);
      const maxHp = attrs.hp;
      const next = Math.max(0, Math.min(maxHp, hp));
      return { ...p, currentHp: next };
    });
  };

  // 钳制血量（装备/魂环变化时调用，保证 currentHp 不超过 maxHp）
  const clampHp = () => {
    setPlayer((p) => {
      const attrs = calcAttributes(p);
      const maxHp = attrs.hp;
      const next = Math.max(0, Math.min(maxHp, p.currentHp));
      if (next === p.currentHp) return p;
      return { ...p, currentHp: next };
    });
  };

  // 体力系统：消耗体力（不足返回 false）
  // 注意：先基于当前 player 快照实时计算恢复量并判断，再同步 setPlayer，避免 React 批处理导致的时序问题
  const consumeStamina = (amount: number): boolean => {
    if (!player) return false;
    const maxStamina = getStaminaMax(player.level);
    const { stamina: current } = calcRecoveredStamina(player.stamina, player.staminaUpdatedAt, maxStamina);
    if (current < amount) return false;
    setPlayer((p) => {
      const max = getStaminaMax(p.level);
      const { stamina: cur } = calcRecoveredStamina(p.stamina, p.staminaUpdatedAt, max);
      if (cur < amount) return p; // 二次保护，极端并发下仍安全
      return {
        ...p,
        stamina: cur - amount,
        staminaUpdatedAt: Date.now(),
      };
    });
    return true;
  };

  // 体力系统：立即结算离线恢复，返回恢复的点数
  const recoverStamina = (): number => {
    let delta = 0;
    setPlayer((p) => {
      const maxStamina = getStaminaMax(p.level);
      const { stamina: next, delta: d } = calcRecoveredStamina(p.stamina, p.staminaUpdatedAt, maxStamina);
      delta = d;
      if (d === 0) return p;
      return { ...p, stamina: next, staminaUpdatedAt: Date.now() };
    });
    return delta;
  };

  // 体力系统：获取当前体力（即时计算离线恢复）
  const getCurrentStamina = (): { current: number; max: number } => {
    if (!player) return { current: 0, max: 0 };
    const maxStamina = getStaminaMax(player.level);
    const { stamina: current } = calcRecoveredStamina(player.stamina, player.staminaUpdatedAt, maxStamina);
    return { current, max: maxStamina };
  };

  const startCultivation = () => {
    setPlayer((p) => {
      // 89级→90级走魂核路线，不走普通闭关
      // 98级→99级也走魂核路线，不走普通闭关
      if (p.level === 89 || p.level === 98) return p;
      // 必须是瓶颈等级且经验已满
      if (!isBottleneck(p.level)) return p;
      if (p.exp < getMaxExp(p.level)) return p;
      // 已在闭关中不重复开始
      if (p.cultivationEndTime && p.cultivationEndTime > Date.now()) return p;

      // 🔴 七宝琉璃塔专属：最高只能修炼到79级，无法突破80级（主修或次修为七宝琉璃塔时生效）
       // 服用绮罗郁金香进化为九宝玲珑塔后解除限制
       if ((p.martialSoul.name === '七宝琉璃塔' || p.secondSoul?.name === '七宝琉璃塔') && p.level >= 79) {
         return p;
       }

       // 🔴 罗三炮29级闭关限制：未进化前29级→30级突破必须前2个魂环均为光属性
       // 只有29级才检查，其他等级正常闭关；已进化为耀阳圣龙后解除所有限制
       // 使用 normalizeBeastAttribute 归一化后判断，确保所有光属性别名（光明/神圣/圣属性等）都被正确识别
       if (p.martialSoul.name === '罗三炮' && p.level === 29) {
         const rings = p.soulRings;
         const frontRings = rings.slice(0, 2);
         const allLight = frontRings.length >= 2 && frontRings.every((r) => {
           return normalizeBeastAttribute(r.beastAttribute) === '光属性';
         });
        if (!allLight) {
          // 不满足光属性魂环条件，不能突破到30级
          return p;
        }
      }

      const seconds = getCultivationSeconds(p.level);
      const durationMs = seconds * 1000;
      return {
        ...p,
        cultivationEndTime: Date.now() + durationMs,
        cultivationFromLevel: p.level,
      };
    });
  };

  const finishCultivation = () => {
    setPlayer((p) => {
      // 89级和98级走魂核路线，不走普通闭关
      if (p.level === 89 || p.level === 98) return p;
      // 🔴 防御性检查：必须是瓶颈等级且经验满
      if (!isBottleneck(p.level)) return p;
      if (p.exp < getMaxExp(p.level)) return p;
      // 🔴 防御性检查：七宝琉璃塔79级限制（主修或次修为七宝且未进化不能突破80级）
       if ((p.martialSoul.name === '七宝琉璃塔' || p.secondSoul?.name === '七宝琉璃塔') && p.level >= 79) return p;
       // 🔴 防御性检查：罗三炮29级限制（未进化且前2魂环非光属性不能突破30级）
       if (p.martialSoul.name === '罗三炮' && p.level === 29) {
         const frontRings = p.soulRings.slice(0, 2);
         const allLight = frontRings.length >= 2 && frontRings.every((r) => {
           return normalizeBeastAttribute(r.beastAttribute) === '光属性';
         });
         if (!allLight) return p;
       }
      const newLevel = p.level + 1;
      const attrs = calcAttributes({ ...p, level: newLevel });

      // 🔴 天梦冰蚕魂环：闭关突破升级后重算伤害百分比（按大境界成长）
      // 主修武魂 + 次修武魂 都检查并重算
      let newSoulRings = p.soulRings;
      let newSecondSoulRings = p.secondSoulRings;
      const oldTier = getRealmTier(p.level);
      const newTier = getRealmTier(newLevel);
      if (oldTier !== newTier && p.soulRings.some((r) => r.color === 'blueWhite')) {
        const res = refreshTianmengDamagePct(p.soulRings, newLevel, '闭关突破');
        newSoulRings = res.rings;
      }
      if (oldTier !== newTier && p.isTwinSoul && p.secondSoulRings && p.secondSoulRings.some((r) => r.color === 'blueWhite')) {
        const res2 = refreshTianmengDamagePct(p.secondSoulRings, newLevel, '闭关突破（次修）');
        newSecondSoulRings = res2.rings;
      }

      // 🔴 罗三炮90级进化（注意：89→90级实际走魂核路线chooseSoulCore，不走finishCultivation，此段为兜底）
      // 正常情况下此段不会触发，因为89级在函数开头已被 return p 拦截
      let evolvedSoul = p.martialSoul;
      if (newLevel >= 90 && p.martialSoul.name === '罗三炮') {
        const rings = p.soulRings;
         const allLight = rings.length >= 9 && rings.slice(0, 9).every((r) => {
           return normalizeBeastAttribute(r.beastAttribute) === '光属性';
         });
        if (allLight) {
          evolvedSoul = evolveMartialSoul(p.martialSoul, 'evolve-shenglong');
          // 魂技重生（保留魂环年限、颜色、属性数值）
          const newSkills = evolvedSoul.soulSkills || [];
          newSoulRings = p.soulRings.map((ring, idx) => ({
            ...ring,
            skillName: newSkills[idx] || ring.skillName,
            skillDesc: `由耀阳圣龙武魂衍生的第${idx + 1}魂技，圣龙威压之下，万物臣服。`,
          }));
        }
      }

      return {
        ...p,
        level: newLevel,
        exp: 0,
        cultivationEndTime: null,
        cultivationFromLevel: null,
        currentHp: attrs.hp,
        soulRings: newSoulRings,
        secondSoulRings: newSecondSoulRings,
        martialSoul: evolvedSoul,
      };
    });
  };

  // 彩蛋境界突破：99级极限斗罗之上的三阶段（准半神/半神/准神），经验满后手动点击突破
  const breakthroughEasterRealm = () => {
    let result = { success: false, newStage: 0, reason: '' };
    setPlayer((p) => {
      if (p.level < 99) {
        result = { success: false, newStage: p.easterRealmStage, reason: '尚未达到99级，无法突破彩蛋境界' };
        return p;
      }
      const curStage = Math.max(0, Math.min(3, p.easterRealmStage ?? 0));
      if (curStage >= 3) {
        result = { success: false, newStage: 3, reason: '已达最高境界（准神）' };
        return p;
      }
      const required = getEasterRealmExp(curStage);
      if (p.exp < required) {
        result = { success: false, newStage: curStage, reason: `修为不足，还需 ${formatNumber(required - p.exp)} 经验` };
        return p;
      }
      const newStage = curStage + 1;
      result = { success: true, newStage, reason: undefined };
      // 突破后经验清零（每阶独立计算），并回满血
      const attrs = calcAttributes({ ...p, easterRealmStage: newStage });
      return {
        ...p,
        easterRealmStage: newStage,
        exp: 0,
        currentHp: attrs.hp,
      };
    });
    return result;
  };

  // ========== 神考系统 ==========

  const canEnterDivineTrials = (): boolean => {
     if (!player) return false;
     // 70级及以上可直接进入
     return player.level >= 70;
   };

  // 执行一次抽取，返回结果（miss 表示未抽中，不消耗次数）
  const performDivineDraw = (): { success: boolean; trial: IDivineTrial | null; isMiss: boolean; reason?: string } => {
    let result: { success: boolean; trial: IDivineTrial | null; isMiss: boolean; reason?: string } = { success: false, trial: null, isMiss: false };
    setPlayer((p) => {
      const dt = p.divineTrial;
      // 校验：未选好神位 + 抽取次数 < 5
      if (dt.stage === 'chose' || dt.stage === 'inherited') {
        result = { success: false, trial: null, isMiss: false, reason: '已选定神考，不可再抽' };
        return p;
      }
      if (dt.drawIndex >= 7) {
        result = { success: false, trial: null, isMiss: false, reason: '7次抽取机会已用完' };
        return p;
      }
       // 权限校验：需70级
       if (p.level < 70) {
         result = { success: false, trial: null, isMiss: false, reason: '需要达到70级才能抽取神考' };
         return p;
       }
       // 按 TRIAL_DRAW_WEIGHTS 权重随机 tier（必中，无 miss）
       const total = (TRIAL_DRAW_WEIGHTS.supreme ?? 0) + TRIAL_DRAW_WEIGHTS.king + TRIAL_DRAW_WEIGHTS.first + TRIAL_DRAW_WEIGHTS.second;
       const roll = Math.random() * total;
       let tier: 'supreme' | 'king' | 'first' | 'second' = 'second';
       const supW = TRIAL_DRAW_WEIGHTS.supreme ?? 0;
       if (roll < supW) tier = 'supreme';
       else if (roll < supW + TRIAL_DRAW_WEIGHTS.king) tier = 'king';
       else if (roll < supW + TRIAL_DRAW_WEIGHTS.king + TRIAL_DRAW_WEIGHTS.first) tier = 'first';

      // 从对应 tier 中排除已抽取过的，若该 tier 已抽完则从其他 tier 补
      let pool = DIVINE_TRIALS.filter((t) => t.tier === tier && !dt.drawnTrials.includes(t.id));
      // 当前 tier 已抽完 → 降级/升级到其他 tier
      if (pool.length === 0) {
        const allRemaining = DIVINE_TRIALS.filter((t) => !dt.drawnTrials.includes(t.id));
        if (allRemaining.length === 0) {
          // 所有神考都抽过了（理论上7次抽取不可能，但兜底）
          result = { success: false, trial: null, isMiss: false, reason: '所有神考已抽取完毕' };
          return p;
        }
        pool = allRemaining;
      }
      const picked = pool[Math.floor(Math.random() * pool.length)];
      const newDrawn = [...dt.drawnTrials, picked.id];
      result = { success: true, trial: picked, isMiss: false };
       return {
         ...p,
          divineTrial: {
            ...dt,
            stage: 'drawing',
            drawnTrials: newDrawn,
            drawIndex: newDrawn.length,
          },
       };
    });
    return result;
  };

  // 确认选择某个神考
  const confirmDivineTrial = (trialId: string) => {
    let result = { success: false, reason: '' };
    setPlayer((p) => {
      const dt = p.divineTrial;
      if (!dt.drawnTrials.includes(trialId)) {
        result = { success: false, reason: '该神考不在抽取结果中' };
        return p;
      }
      result = { success: true, reason: '' };
      return {
        ...p,
        divineTrial: {
          ...dt,
          stage: 'chose',
          chosenTrialId: trialId,
        },
      };
    });
    return result;
  };

  // 刷新神考抽取：消耗10万金币，清空已抽取列表，重新开始抽取（无次数限制）
  const REFRESH_COST = 100000;
  const refreshDivineDraw = (): { success: boolean; reason?: string; cost: number } => {
    let result = { success: false, reason: '', cost: 0 };
    setPlayer((p) => {
      const dt = p.divineTrial;
      if (dt.stage === 'chose' || dt.stage === 'inherited') {
        result = { success: false, reason: '已选定神考，不可刷新', cost: 0 };
        return p;
      }
      if (p.soulCoins < REFRESH_COST) {
        result = { success: false, reason: `金币不足，需要 ${REFRESH_COST} 魂币`, cost: 0 };
        return p;
      }
      result = { success: true, reason: '', cost: REFRESH_COST };
      return {
        ...p,
        soulCoins: p.soulCoins - REFRESH_COST,
         divineTrial: {
           ...dt,
           stage: 'drawing',
           drawnTrials: [],
           drawIndex: 0,
         },
      };
    });
    return result;
  };

  // 接取考核
  const acceptExam = (examIndex: number) => {
    let result = { success: false, reason: '' };
    setPlayer((p) => {
      const dt = p.divineTrial;
      if (!dt.chosenTrialId) { result = { success: false, reason: '未选定神考' }; return p; }
      // 已完成的考核不能再接取
      if (dt.completedExams.includes(examIndex)) { result = { success: false, reason: '该考核已完成' }; return p; }
      // 必须按顺序接取：第一考直接接；其他考核需前一考已完成或已失败（失败可重试推进）
      if (examIndex > 1) {
        const prevDone = dt.completedExams.includes(examIndex - 1) || dt.failedExams.includes(examIndex - 1);
        if (!prevDone) { result = { success: false, reason: '请先完成上一考' }; return p; }
      }
      // 当前考号必须小于等于目标考号（不能回退接取）
      if (dt.currentExamIndex > examIndex) { result = { success: false, reason: '该考核已接取过' }; return p; }
      result = { success: true, reason: '' };
      const newDt = { ...dt, currentExamIndex: Math.max(dt.currentExamIndex, examIndex) };
      if (examIndex === 1) newDt.firstExamTaken = true;
      return { ...p, divineTrial: newDt };
    });
    return result;
  };

  // 检查某考核是否已满足完成条件（自动判定类）
  // 注：必须先接取该考核，完成条件才算数；未接取时即使达成条件也返回 false
  const checkExamComplete = (examIndex: number): boolean => {
    if (!player || !player.divineTrial.chosenTrialId) return false;
    const dt = player.divineTrial;
    const trial = getTrialById(dt.chosenTrialId);
    if (!trial) return false;
    const exam = trial.exams.find((e) => e.index === examIndex);
    if (!exam) return false;
    if (dt.completedExams.includes(examIndex)) return true;

    // 未接取 → 即使条件达成也不算完成（必须先点"接取"）
    if (examIndex > (dt.currentExamIndex ?? 0)) return false;

    // ===== 严格校验：倒数第二考（境界突破）必须玩家等级 >= 99 才能完成 =====
    // 防止利用奖励等级提升或跳级绕过99级门槛
    const level99ExamIndex = trial ? trial.totalExams - 1 : -1;
    if (examIndex === level99ExamIndex && exam.type === 'reachLevel' && (exam.targetLevel ?? 0) >= 99) {
      // 必须玩家实际等级 >= 99（不含彩蛋等级，只算到99）
      const effectiveLvl = Math.min(player.level, 99);
      if (effectiveLvl < 99) return false;
      return true;
    }

    switch (exam.type) {
      case 'reachLevel':
        // 99级考核：仅计算到99级（不含准半神/半神/准神等彩蛋等级）
        const effectiveLevel = (exam.targetLevel ?? 0) >= 99 ? Math.min(player.level, 99) : player.level;
        return effectiveLevel >= (exam.targetLevel ?? 70);
       case 'absorbRing': {
         // 80级以下：无法通过吸收第八魂环完成（还没有第8魂环槽位），直接返回false
         // 80-89级：满足任一条件即可 —— 吸收十万年第八魂环 或 击败帝天
         // 90级及以上：已突破魂斗罗境界，第一考自动完成（进入第二考）
         if (player.level < 80) return false;
         if (player.level >= 90) return true;
         const hasTenthousandYearRing = player.soulRings.length >= 8
           && player.soulRings.some((r, idx) => idx === 7 && r.years >= 100000);
         return hasTenthousandYearRing || dt.firstExamDiTianDefeated;
       }
      case 'defeatAvatar':
        return dt.avatarDefeated;
      case 'drawArtifact':
        return dt.artifactDrawn;
       case 'defeatBeast':
         // 第一考击败帝天 → 检查 firstExamDiTianDefeated；其他魂兽考试 → 检查 beastDefeated
         if (examIndex === 1 && (exam as any).beastName === '帝天') {
           return dt.firstExamDiTianDefeated;
         }
         return dt.beastDefeated;
       case 'defeatSpecific':
         // 击败指定凶兽：统一使用 beastDefeated 标记
         return dt.beastDefeated;
      case 'arenaWinStreak':
        // 竞技场连胜考核：接取后视为完成（简化实现，玩家可在心中模拟连胜过程）
        return true;
       case 'attributeReach':
         // 属性达标类考核：接取后即可手动领取（属性值随修炼自然增长，此处简化为接取后立即完成）
         // 更严格的实现应在此处比对 player 属性与 exam.targetAttr，但当前数据未定义 targetAttr 字段
         return true;
      default:
        return false;
    }
  };

  // 完成考核并发放奖励
  const completeExam = (examIndex: number) => {
    const rewards: string[] = [];
    let result = { success: false, rewards, reason: '' };
    if (!player) return result;
    const dt = player.divineTrial;
    if (!dt.chosenTrialId) return { ...result, reason: '未选定神考' };
    if (dt.completedExams.includes(examIndex)) return { ...result, reason: '已完成' };
    const trial = getTrialById(dt.chosenTrialId);
    if (!trial) return { ...result, reason: '神考不存在' };
    const exam = trial.exams.find((e) => e.index === examIndex);
    if (!exam) return { ...result, reason: '考核不存在' };

    // 简单判定：reachLevel / absorbRing(部分) / defeatAvatar / drawArtifact 可自动check；其余需手动触发
    if (!checkExamComplete(examIndex)) return { ...result, reason: '考核条件未满足' };

    // ===== 兜底硬校验：倒数第二考必须玩家等级 >= 99，防止跳级 =====
    const curTrial = getTrialById(dt.chosenTrialId);
    if (curTrial && examIndex === curTrial.totalExams - 1 && exam.type === 'reachLevel' && (exam.targetLevel ?? 0) >= 99) {
      if (Math.min(player.level, 99) < 99) {
        return { ...result, reason: '需要达到99级才能完成此考核' };
      }
    }

    // 预生成奖励文案（在setPlayer外计算，保证toast能正确显示）
    const fmtYears = (y: number) => {
      if (y >= 10000000) return (y / 10000000).toFixed(1) + '千万年';
      if (y >= 10000) return (y / 10000).toFixed(1) + '万年';
      if (y >= 1000) return (y / 1000).toFixed(1) + '千年';
      return y + '年';
    };
    if (exam.reward.levelUp) rewards.push(`等级 +${exam.reward.levelUp}`);
    if (exam.reward.ringYearsAll) rewards.push(`魂环年限 +${fmtYears(exam.reward.ringYearsAll)}`);
    if (exam.reward.boneYearsAll) rewards.push(`魂骨年限 +${fmtYears(exam.reward.boneYearsAll)}`);
    if (exam.reward.attrBonusPct) rewards.push(`神力 +${(exam.reward.attrBonusPct / 2).toFixed(1)}%`);
    if (exam.reward.affinityPct) rewards.push(`亲和度 +${exam.reward.affinityPct}%`);
    if (exam.reward.divinePowerPct) rewards.push(`神力 +${exam.reward.divinePowerPct}%`);

    // 发放奖励
     setPlayer((p) => {
       const newExams = [...p.divineTrial.completedExams, examIndex];
       let affinityPct = p.divineTrial.affinityPct + (exam.reward.affinityPct ?? 0);
       let divinePowerPct = p.divineTrial.divinePowerPct + (exam.reward.divinePowerPct ?? 0);
       let level = p.level;
       let easterRealmStage = p.easterRealmStage;
       let newPendingBonus: number | undefined;
       // 神考魂骨年限奖励后更新的背包（仅在有 boneYearsAll 奖励时赋值）
       let newInventoryAfterBoneYears: IItem[] | null = null;

       // 等级提升奖励（仅9级瓶颈以下 + 99级以上有效，其他等级自动存到pendingLevelBonus）
       // 至高神/神王的倒数第二考奖励的等级提升，如果玩家还没到99级，暂存到pending
       // 但倒数第二考(突破99级)本身要求先达到99级才能完成，所以奖励等级不会直接推过门槛
       // 这里做兜底保护：玩家等级 < 99 且奖励会推到 >=99 时，截到 98 级，剩余存 pending
       if (exam.reward.levelUp) {
         const currentRealLevel = Math.min(level, 99);
         const wouldBe = level + exam.reward.levelUp;
         // 如果当前实际等级 < 99 且加完会 >= 99（且本次不是99级突破考本身）
         const isLevel99Exam = examIndex === (getTrialById(dt.chosenTrialId!)?.totalExams ?? 9) - 1;
         if (currentRealLevel < 99 && wouldBe >= 99 && !isLevel99Exam) {
           // 加到 98 级为止，超出部分暂存
           const deltaTo98 = 98 - level;
           if (deltaTo98 > 0) {
             level = 98;
             newPendingBonus = (p.divineTrial.pendingLevelBonus ?? 0) + (exam.reward.levelUp - deltaTo98);
           } else {
             newPendingBonus = (p.divineTrial.pendingLevelBonus ?? 0) + exam.reward.levelUp;
           }
          } else if (level < 99) {
            // 9级瓶颈以下正常加
            // 🔴 武魂专属等级限制：罗三炮未进化卡29级，七宝琉璃塔未进化卡79级
             const isLuosanpaoExam = p.martialSoul.name === '罗三炮';
             const isQibaoExam = p.martialSoul.name === '七宝琉璃塔' || p.secondSoul?.name === '七宝琉璃塔';
            let pending = p.divineTrial.pendingLevelBonus ?? 0;
            for (let i = 0; i < exam.reward.levelUp; i++) {
              if ((level + 1) % 10 === 9) {
                // 下一级是瓶颈等级（x9级），暂存到待发奖励
                pending += 1;
              } else if (isLuosanpaoExam && level >= 29) {
                // 罗三炮未进化：29级以上全部转为pending
                pending += 1;
              } else if (isQibaoExam && level >= 79) {
                // 七宝琉璃塔未进化：79级以上全部转为pending
                pending += 1;
              } else {
                level += 1;
              }
            }
            // 结算 pendingLevelBonus（当前等级不是瓶颈、魂环数足够时立即发放）
            // 🔴 武魂专属等级限制：罗三炮未进化卡29级，七宝琉璃塔未进化卡79级
             const isLuosanpao = p.martialSoul.name === '罗三炮';
             const isQibao = p.martialSoul.name === '七宝琉璃塔' || p.secondSoul?.name === '七宝琉璃塔';
            while (pending > 0 && level < 99 && (level + 1) % 10 !== 9 && getMaxRings(level + 1) <= p.soulRings.length) {
              // 罗三炮未进化：卡在29级
              if (isLuosanpao && level >= 29) break;
              // 七宝琉璃塔未进化：卡在79级
              if (isQibao && level >= 79) break;
              level += 1;
              pending -= 1;
            }
           newPendingBonus = pending;
         } else {
           // 99级及以上（已突破），正常加
           for (let i = 0; i < exam.reward.levelUp; i++) {
             if (easterRealmStage < 3) {
               divinePowerPct += 1;
             } else {
               divinePowerPct += 1; // 已圆满转神力
             }
           }
         }
       }

        // 魂环年限提升（所有魂环，双武魂都提升）
        // 修复：年限增加后必须重新计算 skillDamagePct，否则魂技伤害不提升
        let newSoulRings = p.soulRings;
        let newSecondSoulRings = p.secondSoulRings;
        if (exam.reward.ringYearsAll) {
           const add = exam.reward.ringYearsAll;
           // 计算玩家主武魂元素，用于重算元素亲和度
           const playerEl = p.martialSoul.element || getSoulElement(p.martialSoul.name);
           newSoulRings = p.soulRings.map((r, idx) => {
             // 天梦冰蚕魂环：不走年限公式，伤害由大境界决定（跳过重算）
             if (r.color === 'blueWhite') return r;
             const newYears = (r.years ?? 0) + add;
             const quality = getRingQualityFromYears(newYears);
             // 重新计算基础属性（攻防速气血/暴击/魂力/魂技伤害）
             // 使用 deterministic 模式：年限提升场景下属性只增不减，避免随机浮动导致战力下降
             const stats = localRingGrowthStats(r,newYears);
             // 重新计算魂技伤害百分比（按年限+环位+元素亲和度）
             const beastAttr = r.beastAttribute || '';
             const affinity = calcElementAffinity(playerEl, beastAttr);
             const newSdp = calcSkillDamagePct(newYears, r.beastType as any, idx, affinity);
             return {
               ...r,
               years: newYears,
               color: quality.color as typeof r.color,
               qualityLabel: quality.label,
               attackBonus: stats.attackBonus,
               defenseBonus: stats.defenseBonus,
               speedBonus: stats.speedBonus,
               spiritBonus: stats.spiritBonus,
               hpBonus: stats.hpBonus,
               critRateBonus: stats.critRateBonus,
               critDmgBonus: stats.critDmgBonus,
               soulPowerBonus: stats.soulPowerBonus,
               skillDamage: stats.skillDamage,
               skillDamagePct: Math.max(newSdp,r.skillDamagePct||0),
             };
           });
           if (newSecondSoulRings && newSecondSoulRings.length > 0) {
             // 第二武魂元素
             const secondEl = p.secondSoul?.element || (p.secondSoul ? getSoulElement(p.secondSoul.name) : '');
             newSecondSoulRings = newSecondSoulRings.map((r, idx) => {
               if (r.color === 'blueWhite') return r;
               const newYears = (r.years ?? 0) + add;
               const quality = getRingQualityFromYears(newYears);
               const stats = localRingGrowthStats(r,newYears);
               const beastAttr = r.beastAttribute || '';
               const affinity = calcElementAffinity(secondEl, beastAttr);
               const newSdp = calcSkillDamagePct(newYears, r.beastType as any, idx, affinity);
               return {
                 ...r,
                 years: newYears,
                 color: quality.color as typeof r.color,
                 qualityLabel: quality.label,
                 attackBonus: stats.attackBonus,
                 defenseBonus: stats.defenseBonus,
                 speedBonus: stats.speedBonus,
                 spiritBonus: stats.spiritBonus,
                 hpBonus: stats.hpBonus,
                 critRateBonus: stats.critRateBonus,
                 critDmgBonus: stats.critDmgBonus,
                 soulPowerBonus: stats.soulPowerBonus,
                 skillDamage: stats.skillDamage,
                 skillDamagePct: Math.max(newSdp,r.skillDamagePct||0),
               };
             });
           }
        }

       // 魂骨年限提升（所有已装备魂骨），最高年限为 999 万年
        const newSoulBones = { ...p.soulBones };
        let newDivineArmor = p.divineArmor;
        if (exam.reward.boneYearsAll) {
          const addBone = exam.reward.boneYearsAll;
          // 根据年限获取魂骨颜色（十六进制）
          const getBoneColorByYears = (years: number): string => {
            if (years >= 1000000) return '#fcd34d'; // 百万年 - 金色
            if (years >= 100000) return '#dc2626';  // 十万年 - 红色
            if (years >= 10000) return '#1f2937';   // 万年 - 黑色
            if (years >= 1000) return '#a855f7';    // 千年 - 紫色
            if (years >= 100) return '#fbbf24';     // 百年 - 黄色
            return '#e5e7eb';                       // 十年 - 白色
          };
          const getBoneQualityByYears = (years: number): IItem['quality'] => {
            if (years >= 100000) return 'legendary';
            if (years >= 10000) return 'epic';
            if (years >= 1000) return 'fine';
            return 'rare';
          };
          (Object.keys(newSoulBones) as Array<keyof ISoulBoneSlots>).forEach((slot) => {
             const bone = newSoulBones[slot];
             if (bone) {
               const curYears = bone.soulBoneYears ?? 0;
               const newYears = Math.min(curYears + addBone, 9990000);
               const label = newYears >= 1000000 ? '百万年' : newYears >= 100000 ? '十万年' : newYears >= 10000 ? '万年' : newYears >= 1000 ? '千年' : newYears >= 100 ? '百年' : '十年';
               const newAttrs = __localBoneGrowth(bone,newYears,slot);
               newSoulBones[slot] = {
                 ...bone,
                 soulBoneYears: newYears,
                 soulBoneYearsLabel: label,
                 qualityColor: getBoneColorByYears(newYears),
                 quality: getBoneQualityByYears(newYears),
                 attributes: {
                   ...bone.attributes,
                   attack: newAttrs.attack,
                   defense: newAttrs.defense,
                   speed: newAttrs.speed,
                   spirit: newAttrs.spirit,
                   hp: newAttrs.hp,
                 },
               };
             }
           });
          // 神装状态：同步提升 sourceBones 年限，并重算 armorItem 属性（保证神装转化后仍吃魂骨年限奖励）
          if (p.divineArmor?.hasArmor && p.divineArmor.sourceBones) {
            const newSourceBones = { ...p.divineArmor.sourceBones };
            let totalAtk = 0, totalDef = 0, totalSpd = 0, totalSpi = 0, totalHp = 0;
            let totalCritRate = 0, totalCritDmg = 0, totalAllAttr = 0;
            (Object.keys(newSourceBones) as Array<keyof ISoulBoneSlots>).forEach((slot) => {
              const bone = newSourceBones[slot];
              if (bone) {
                const curYears = bone.soulBoneYears ?? 0;
                const newYears = Math.min(curYears + addBone, 9990000);
                const label = newYears >= 1000000 ? '百万年' : newYears >= 100000 ? '十万年' : newYears >= 10000 ? '万年' : newYears >= 1000 ? '千年' : newYears >= 100 ? '百年' : '十年';
               const newAttrs = __localBoneGrowth(bone,newYears,slot);
                 const updatedBone = {
                   ...bone,
                   soulBoneYears: newYears,
                   soulBoneYearsLabel: label,
                   qualityColor: getBoneColorByYears(newYears),
                   quality: getBoneQualityByYears(newYears),
                   attributes: { ...bone.attributes, ...newAttrs },
                 };
                newSourceBones[slot] = updatedBone;
                const a = updatedBone.attributes;
                totalAtk += (a.attack ?? 0);
                totalDef += (a.defense ?? 0);
                totalSpd += (a.speed ?? 0);
                totalSpi += (a.spirit ?? 0);
                totalHp += (a.hp ?? 0);
                totalCritRate += (a.critRate ?? 0);
                totalCritDmg += (a.critDmg ?? 0);
                totalAllAttr += (a.allAttr ?? 0);
              }
            });
            const MULTIPLIER = 2.0;
            const newArmorItem = p.divineArmor.armorItem ? {
              ...p.divineArmor.armorItem,
              attributes: {
                attack: Math.round(totalAtk * MULTIPLIER),
                defense: Math.round(totalDef * MULTIPLIER),
                speed: Math.round(totalSpd * MULTIPLIER),
                spirit: Math.round(totalSpi * MULTIPLIER),
                hp: Math.round(totalHp * MULTIPLIER),
                critRate: +(totalCritRate * MULTIPLIER).toFixed(2),
                critDmg: +(totalCritDmg * MULTIPLIER).toFixed(2),
                allAttr: +(totalAllAttr * MULTIPLIER).toFixed(2),
              },
            } : null;
            newDivineArmor = {
               ...p.divineArmor,
               sourceBones: newSourceBones,
               armorItem: newArmorItem,
             };
           }
           // 背包中的魂骨同样提升年限并重算属性
           const updatedInventory = p.inventory.map((item) => {
             if (item.type !== 'soulBone' || !item.slot) return item;
             const curYears = item.soulBoneYears ?? 0;
             const newYears = Math.min(curYears + addBone, 9990000);
             const label = newYears >= 1000000 ? '百万年' : newYears >= 100000 ? '十万年' : newYears >= 10000 ? '万年' : newYears >= 1000 ? '千年' : newYears >= 100 ? '百年' : '十年';
             const newAttrs = __localBoneGrowth(item,newYears,item.slot);
             return {
               ...item,
               soulBoneYears: newYears,
               soulBoneYearsLabel: label,
               qualityColor: getBoneColorByYears(newYears),
               quality: getBoneQualityByYears(newYears),
               attributes: {
                 ...item.attributes,
                 attack: newAttrs.attack,
                 defense: newAttrs.defense,
                 speed: newAttrs.speed,
                 spirit: newAttrs.spirit,
                 hp: newAttrs.hp,
               },
             };
           });
           // 把更新后的 inventory 挂到 newSoulBones 同级变量上，在 return 中使用
           // （复用 newSoulBones 变量名在外侧已存在，这里用独立变量）
           newInventoryAfterBoneYears = updatedInventory;
         }

        // 全属性加成（转神力，更简洁）
       if (exam.reward.attrBonusPct) {
         divinePowerPct += exam.reward.attrBonusPct / 2; // 一半转神力
       }

       // 自动推进当前考核索引：完成第N考后推进到第N考（即已进行到第N考），
        // 这样下一考（N+1）的接取检查可以通过（currentExamIndex+1 === N+1）
        const nextExamIndex = Math.max(p.divineTrial.currentExamIndex, examIndex);

        // 最后一考完成后，亲和度直接补满到 100%（保证继承神位时满亲和度）
        // 使用外层已校验过的 trial，避免内层重新获取失败导致判断失效
        const curTrial = getTrialById(p.divineTrial.chosenTrialId ?? '');
        const isFinalExam = curTrial
          ? examIndex === curTrial.totalExams
          : examIndex >= 9;
        if (isFinalExam) {
          affinityPct = 100;
        }
        // 额外保险：如果当前完成后所有考核都已完成，亲和度强制补满
        const allDone = curTrial
          ? curTrial.exams.every((e) => newExams.includes(e.index))
          : false;
        if (allDone && affinityPct < 100) {
          affinityPct = 100;
        }

        // 🔴 天梦冰蚕魂环：神考等级奖励后必须重算伤害
        // （神考奖励可能直接推升多个大境界，最容易漏的路径）
        if (level !== p.level) {
          const res = refreshTianmengDamagePct(newSoulRings, level, '神考奖励');
          newSoulRings = res.rings;
          if (p.isTwinSoul && newSecondSoulRings) {
            const res2 = refreshTianmengDamagePct(newSecondSoulRings, level, '神考奖励（次修）');
            newSecondSoulRings = res2.rings;
          }
        }

        // 奖励后血量按比例缩放（最大HP提升时，当前HP同比例提升，避免满奖励后空血）
        const newAttrs = calcAttributes({
          ...p,
          level,
          soulRings: newSoulRings,
          secondSoulRings: newSecondSoulRings,
           soulBones: newSoulBones,
           divineArmor: newDivineArmor,
           divineTrial: { ...p.divineTrial, affinityPct: Math.min(100, affinityPct), divinePowerPct },
        });
        const prevMaxHp = calcAttributes(p).hp || 1;
        const newMaxHp = newAttrs.hp || 1;
        const ratio = newMaxHp / prevMaxHp;
        const newCurrentHp = Math.min(newMaxHp, Math.max(1, Math.round(p.currentHp * ratio)));

         return {
          ...p,
           level,
           easterRealmStage,
           soulRings: newSoulRings,
           secondSoulRings: newSecondSoulRings,
            soulBones: newSoulBones,
            divineArmor: newDivineArmor,
            inventory: newInventoryAfterBoneYears ?? p.inventory,
            currentHp: newCurrentHp,
           divineTrial: {
           ...p.divineTrial,
           completedExams: newExams,
           currentExamIndex: nextExamIndex,
           affinityPct: Math.min(100, affinityPct),
           divinePowerPct,
           pendingLevelBonus: (typeof newPendingBonus === 'number' ? newPendingBonus : p.divineTrial.pendingLevelBonus) ?? 0,
         },
      };
    });
    return { success: true, rewards, reason: '' };
  };

  // 考核失败
   const failExam = (examIndex: number) => {
     let result = { success: false, reason: '' };
     setPlayer((p) => {
       if (p.divineTrial.completedExams.includes(examIndex)) { result = { success: false, reason: '已完成' }; return p; }
       const newFailed = [...p.divineTrial.failedExams];
       if (!newFailed.includes(examIndex)) newFailed.push(examIndex);
       // 失败也推进 currentExamIndex，保证下一考可接取
       const nextExamIndex = Math.max(p.divineTrial.currentExamIndex ?? 0, examIndex);
       result = { success: true, reason: '' };
       return { ...p, divineTrial: { ...p.divineTrial, failedExams: newFailed, currentExamIndex: nextExamIndex } };
     });
     return result;
   };

   // 拔出神器 — 同步发放神器考核奖励（动态查找神器认主考核的index）
   const drawArtifact = () => {
     let result = { success: false, reason: '', rewards: [] as string[] };
     setPlayer((p) => {
       const dt = p.divineTrial;
       if (!dt.chosenTrialId) { result = { success: false, reason: '未选定神考', rewards: [] }; return p; }
       if (dt.artifactDrawn) { result = { success: false, reason: '神器已拔出', rewards: [] }; return p; }
       const trial = getTrialById(dt.chosenTrialId);
       // 查找类型为 drawArtifact 的考核（倒数第三考）
       const artifactExam = trial?.exams.find((e) => e.type === 'drawArtifact');
       if (!artifactExam) { result = { success: false, reason: '神考配置异常', rewards: [] }; return p; }
       const examIdx = artifactExam.index;
       // 前置校验：必须按顺序，上一考已完成或已失败
       if (examIdx > 1) {
         const prevDone = dt.completedExams.includes(examIdx - 1) || dt.failedExams.includes(examIdx - 1);
         if (!prevDone) { result = { success: false, reason: '请先完成上一考', rewards: [] }; return p; }
       }
       // 必须已接取或可接取（currentExamIndex + 1 >= examIdx 表示已推进到可以接这考）
       if ((dt.currentExamIndex ?? 0) + 1 < examIdx) {
         result = { success: false, reason: '请先接取前序考核', rewards: [] };
         return p;
       }
       const rewards: string[] = [];
       if (artifactExam?.reward.affinityPct) rewards.push(`亲和度 +${artifactExam.reward.affinityPct}%`);
       if (artifactExam?.reward.divinePowerPct) rewards.push(`神力 +${artifactExam.reward.divinePowerPct}%`);
       result = { success: true, reason: '', rewards };
       const newAffinity = Math.min(100, dt.affinityPct + (artifactExam?.reward.affinityPct ?? 0));
       const newDivinePower = dt.divinePowerPct + (artifactExam?.reward.divinePowerPct ?? 0);
       const newCompleted = !dt.completedExams.includes(examIdx) ? [...dt.completedExams, examIdx] : dt.completedExams;
       const nextExamIndex = Math.max(dt.currentExamIndex ?? 0, examIdx);
        return {
          ...p,
          divineTrial: {
            ...dt,
            artifactDrawn: true,
            artifactLevel: 1,
            completedExams: newCompleted,
            currentExamIndex: nextExamIndex,
            affinityPct: newAffinity,
            divinePowerPct: newDivinePower,
          },
        };
      });
      // 拔出神器后同步刷新神装共鸣状态（保证UI一致）
      refreshArmorResonance();
      return result;
   };

  // 神器升级花费（统一 30 万金币/级，至高神器/超神器/神器全部相同）
  // 注意：费用公式必须与 upgradeArtifact 内部扣金币公式完全一致，避免展示与实际扣费不符
  const ARTIFACT_COST_PER_LEVEL = 300000;
  const getArtifactUpgradeCost = (targetLevel: number): number => {
    if (!player || !player.divineTrial.chosenTrialId) return 0;
    const art = getArtifactByDeity(player.divineTrial.chosenTrialId);
    if (!art) return 0;
    const cur = player.divineTrial.artifactLevel;
    const levels = Math.max(0, Math.min(targetLevel, art.maxLevel) - cur);
    return levels * ARTIFACT_COST_PER_LEVEL;
  };

  // 升级神器（花金币）
  const upgradeArtifact = (levels: number = 1) => {
    let result = { success: false, levelsUp: 0, cost: 0, reason: '' };
    setPlayer((p) => {
      const dt = p.divineTrial;
      if (!dt.chosenTrialId || !dt.artifactDrawn) { result = { success: false, levelsUp: 0, cost: 0, reason: '尚未拔出神器' }; return p; }
      const art = getArtifactByDeity(dt.chosenTrialId);
      if (!art) { result = { success: false, levelsUp: 0, cost: 0, reason: '神器不存在' }; return p; }
      const maxLv = art.maxLevel;
      if (dt.artifactLevel >= maxLv) { result = { success: false, levelsUp: 0, cost: 0, reason: '已达最高等级' }; return p; }

      let cur = dt.artifactLevel;
      const ARTIFACT_COST_PER_LEVEL = 300000;
      const canAffordLevels = Math.floor(p.soulCoins / ARTIFACT_COST_PER_LEVEL);
      const maxUp = maxLv - cur;
      const actualUp = Math.max(0, Math.min(levels, maxUp, canAffordLevels));
      const totalCost = actualUp * ARTIFACT_COST_PER_LEVEL;
      if (actualUp === 0) { result = { success: false, levelsUp: 0, cost: 0, reason: '魂币不足' }; return p; }
       result = { success: true, levelsUp: actualUp, cost: totalCost, reason: '' };
       return {
         ...p,
         soulCoins: p.soulCoins - totalCost,
         divineTrial: { ...dt, artifactLevel: cur + actualUp },
       };
    });
    return result;
  };

   // 继承神位（所有考核完成后调用）
   const inheritDeity = () => {
     let result = { success: false, reason: '' };
     setPlayer((p) => {
       const dt = p.divineTrial;
       if (!dt.chosenTrialId) { result = { success: false, reason: '未选定神考' }; return p; }
       if (dt.inherited) { result = { success: false, reason: '已继承神位' }; return p; }
       const trial = getTrialById(dt.chosenTrialId);
       if (!trial) { result = { success: false, reason: '神考不存在' }; return p; }
       // 检查所有考核是否完成
       const allDone = trial.exams.every((e) => dt.completedExams.includes(e.index));
       if (!allDone) { result = { success: false, reason: '尚有考核未完成' }; return p; }
       result = { success: true, reason: '' };
       const attrs = calcAttributes({ ...p, divineTrial: { ...dt, inherited: true, inheritedLevel: 100 } });
        // 初始化神环（第10魂环）
        const divineSoulRing = dt.divineSoulRing ?? {
           color: '#fcd34d',
           skillName: trial.divineSkillName || '神之审判',
           skillDesc: `${trial.name}的至高神技，蕴藏神之力量。`,
           years: 9999999,
           beastAttribute: normalizeBeastAttribute(trial.element) || '光属性',
         };
         // 继承后等级突破至百级
          const newLevel = Math.max(p.level, 100);
          // 🔴 天梦冰蚕魂环：神位继承突破百级后重算伤害
          const tianmengRes = refreshTianmengDamagePct(p.soulRings, newLevel, '神位继承');
          const newSoulRingsTianmeng = tianmengRes.rings;
          const newSecondSoulRingsTianmeng = p.isTwinSoul && p.secondSoulRings
            ? refreshTianmengDamagePct(p.secondSoulRings, newLevel, '神位继承（次修）').rings
            : p.secondSoulRings;
          // 🔴 v14.0 神位成就：继承神位时记录到 inheritedGodPositions 永久列表
         // 玩家每世可继承不同神位，收集所有神位成就（每个神位成就只触发一次）
         const existingPositions = Array.isArray(p.inheritedGodPositions) ? [...p.inheritedGodPositions] : [];
         if (!existingPositions.includes(dt.chosenTrialId)) {
           existingPositions.push(dt.chosenTrialId);
         }
         return reconcileGodUnlock({
           ...p,
           level: newLevel,
           currentHp: attrs.hp,
           soulRings: newSoulRingsTianmeng,
           secondSoulRings: newSecondSoulRingsTianmeng,
           divineTrial: {
            ...dt,
            stage: 'inherited',
            inherited: true,
            inheritedLevel: 100,
             affinityPct: 100, // 继承神位强制亲和度满（防御性，防止任何路径下不满）
             divinePowerPct: dt.divinePowerPct + 10, // 继承额外 +10% 神力
            divineSoulRing,
          },
           inheritedGodPositions: existingPositions,
           godRealm: {
             ...(p.godRealm ?? { unlocked: false, defeatedIds: [], divineCoreCrafted: false }),
             unlocked: true, // 继承神位后自动开启神界
           },
         });
     });
     return result;
   };

  const setDivineRingColor = (color: string) => {
    setPlayer((p) => {
      if (!p.divineTrial.inherited) return p;
      const ring = p.divineTrial.divineSoulRing ?? {
         color: '#fcd34d',
         skillName: '神之审判',
         skillDesc: '神之力量凝聚的至高神技。',
         years: 9999999,
         beastAttribute: '光属性',
       };
      return {
        ...p,
        divineTrial: { ...p.divineTrial, divineSoulRing: { ...ring, color } },
      };
    });
  };

   // 神王第二考：击败自身化身（胜利不直接加年限，走 completeExam 统一发放；此处只标记胜利）
   const confirmDivineAvatarVictory = () => {
     setPlayer((p) => {
       const dt = p.divineTrial;
       if (dt.avatarDefeated) return p;
       return {
         ...p,
         divineTrial: {
           ...dt,
           avatarDefeated: true,
           avatarAttempts: dt.avatarAttempts + 1,
         },
       };
     });
   };

   // 第三考：击败指定魂兽（邪眼暴君主宰 / 深海魔鲸王 / 银月狼王）
   const confirmDivineBeastVictory = () => {
     setPlayer((p) => {
       const dt = p.divineTrial;
        // 只有接取第三考后击败才有效，且只记录一次
        if (dt.currentExamIndex < 3 || dt.beastDefeated) return p;
       return {
         ...p,
         divineTrial: { ...dt, beastDefeated: true },
       };
     });
   };

   // 第一考：击败帝天（80-90级路线）
   const confirmDiTianVictory = () => {
    setPlayer((p) => {
      const dt = p.divineTrial;
      // 只有接取第一考后击败才有效，且只记录一次
      if (!dt.firstExamTaken || dt.firstExamDiTianDefeated) return p;
      return {
        ...p,
        divineTrial: { ...dt, firstExamDiTianDefeated: true },
      };
    });
  };

  // 神王第二考：化身挑战失败，扣减次数；返回是否还有剩余次数
  const recordDivineAvatarDefeat = (): boolean => {
    let hasRemaining = false;
    setPlayer((p) => {
      const dt = p.divineTrial;
      if (dt.avatarDefeated) { hasRemaining = false; return p; }
      const newAttempts = Math.min(dt.avatarAttempts + 1, 7);
      hasRemaining = newAttempts < 7;
      return {
        ...p,
        divineTrial: { ...dt, avatarAttempts: newAttempts },
      };
    });
    return hasRemaining;
  };

  const recruitCharacter = (recruit: IRecruit): boolean => {
    let success = false;
    setPlayer((p) => {
      if (p.recruited.includes(recruit.id)) return p;
      if (p.soulCoins < recruit.recruitCost) return p;
      success = true;
      return {
        ...p,
        soulCoins: p.soulCoins - recruit.recruitCost,
        recruited: [...p.recruited, recruit.id],
      };
    });
    return success;
  };

  const toggleTeamMember = (recruitId: string): boolean => {
    // 上阵/下阵切换，队伍最多4人（玩家 + 3 招募角色）
    // 已招募的角色才能上阵；下阵只是从出战队伍移除，已招募状态保留
    let success = false;
    setPlayer((p) => {
      if (p.team.includes(recruitId)) {
        // 下阵：仅从出战队伍移除
        success = true;
        return { ...p, team: p.team.filter((id) => id !== recruitId) };
      }
      if (!p.recruited.includes(recruitId)) return p; // 未招募不能上阵
      if (p.team.length >= 3) return p; // 玩家外最多3个
      success = true;
      return { ...p, team: [...p.team, recruitId] };
    });
    return success;
  };

  const equipItem = (item: IItem) => {
    setPlayer((p) => {
      // 魂导器装备
      if (item.type === 'soulGuide' && item.soulGuideType) {
        const slot = item.soulGuideType as keyof IEquipmentSlots;
        const oldItem = p.equipment[slot];
        const newInv = p.inventory.filter((i) => i.id !== item.id);
        if (oldItem) newInv.push(oldItem);
        const newP = {
          ...p,
          equipment: { ...p.equipment, [slot]: item },
          inventory: newInv,
        };
        // 装备变化后钳制血量
        const newAttrs = calcAttributes(newP);
        newP.currentHp = Math.max(0, Math.min(newAttrs.hp, p.currentHp));
        return newP;
      }
      if (item.type === 'soulBone' && item.slot) {
        // 🔴 神装限制：已转化神装后无法再装备魂骨
        if (p.divineArmor?.hasArmor) {
          toast.error('已转化神装，魂骨无法更换');
          return p;
        }
        const slot = item.slot as keyof ISoulBoneSlots;
        const oldItem = p.soulBones[slot];
        const newInv = p.inventory.filter((i) => i.id !== item.id);
        if (oldItem) newInv.push(oldItem);
        const newP = {
          ...p,
          soulBones: { ...p.soulBones, [slot]: item },
          inventory: newInv,
        };
        const newAttrs = calcAttributes(newP);
        newP.currentHp = Math.max(0, Math.min(newAttrs.hp, p.currentHp));
        return newP;
      }
      return p;
    });
  };

  const unequipSlot = (slot: keyof IEquipmentSlots) => {
    setPlayer((p) => {
      const item = p.equipment[slot];
      if (!item) return p;
      const newP = {
        ...p,
        equipment: { ...p.equipment, [slot]: null },
        inventory: [...p.inventory, item],
      };
      const newAttrs = calcAttributes(newP);
      newP.currentHp = Math.max(0, Math.min(newAttrs.hp, p.currentHp));
      return newP;
    });
  };

   const unequipSoulBone = (slot: keyof ISoulBoneSlots) => {
     setPlayer((p) => {
       // 🔴 神装限制：已转化神装后无法卸下魂骨
       if (p.divineArmor?.hasArmor) {
         toast.error('已转化神装，魂骨无法卸下');
         return p;
       }
       const item = p.soulBones[slot];
       if (!item) return p;
       const newP = {
         ...p,
         soulBones: { ...p.soulBones, [slot]: null },
         inventory: [...p.inventory, item],
       };
       const newAttrs = calcAttributes(newP);
       newP.currentHp = Math.max(0, Math.min(newAttrs.hp, p.currentHp));
       return newP;
     });
   };

   // 🔴 v15.0 神装系统：魂骨融合转化为神装
   const convertToDivineArmor = (): { success: boolean; reason?: string } => {
     let result = { success: false, reason: '' };
     setPlayer((p) => {
       // 前置条件检查
       if (!p.divineTrial?.inherited) {
         result = { success: false, reason: '需先继承神位才能转化神装' };
         return p;
       }
       if (p.divineArmor?.hasArmor) {
         result = { success: false, reason: '已拥有神装，无法重复转化' };
         return p;
       }
       const bones = Object.values(p.soulBones || {}).filter((b) => !!b) as IItem[];
       if (bones.length < 7) {
         result = { success: false, reason: '需将所有魂骨槽位装满才能转化神装' };
         return p;
       }

       // 计算神装属性：所有魂骨属性之和 × 200%（神装融合倍率）
       let totalAtk = 0, totalDef = 0, totalSpd = 0, totalSpi = 0, totalHp = 0;
       let totalCritRate = 0, totalCritDmg = 0, totalAllAttr = 0;
       for (const b of bones) {
         const a = b.attributes;
         if (!a) continue;
         totalAtk += (a.attack ?? 0);
         totalDef += (a.defense ?? 0);
         totalSpd += (a.speed ?? 0);
         totalSpi += (a.spirit ?? 0);
         totalHp += (a.hp ?? 0);
         totalCritRate += (a.critRate ?? 0);
         totalCritDmg += (a.critDmg ?? 0);
         totalAllAttr += (a.allAttr ?? 0);
       }
       // 神装融合：所有魂骨属性之和 × 200%（二合为一，属性翻倍）
       const MULTIPLIER = 2.0;
       const armorAttrs = {
         attack: Math.round(totalAtk * MULTIPLIER),
         defense: Math.round(totalDef * MULTIPLIER),
         speed: Math.round(totalSpd * MULTIPLIER),
         spirit: Math.round(totalSpi * MULTIPLIER),
         hp: Math.round(totalHp * MULTIPLIER),
         critRate: +(totalCritRate * MULTIPLIER).toFixed(2),
         critDmg: +(totalCritDmg * MULTIPLIER).toFixed(2),
         allAttr: +(totalAllAttr * MULTIPLIER).toFixed(2),
       };

       // 构造神装物品（type 用 soulGuide，槽位用 melee 之外？其实它有独立divineArmor字段，物品仅作展示）
       const armorItem: IItem = {
         id: `divine-armor-${Date.now()}`,
         name: '神装',
         type: 'soulGuide',
         quality: 'legendary',
         qualityColor: '#fcd34d',
         iconChar: '神',
         description: '由七块魂骨融合而成的至强神装，蕴含着超越凡骨的神圣力量。',
         attributes: armorAttrs,
         sellPrice: 0,
       };

       result = { success: true, reason: '' };

       // 魂骨清空（不再生效；神装属性通过 divineArmor 字段计算）
       // 注意：魂骨不进入背包，直接消耗掉
       const newP: IPlayer = {
         ...p,
         soulBones: { ...EMPTY_SOUL_BONES },
         divineArmor: {
           hasArmor: true,
           armorItem,
           armorName: '神装',
           sourceBones: { ...p.soulBones },
           resonanceActive: !!p.divineTrial?.artifactDrawn,
         },
       };
       const newAttrs = calcAttributes(newP);
       newP.currentHp = Math.max(0, Math.min(newAttrs.hp, p.currentHp));
       return newP;
     });
     return result;
   };

   // 神装重命名
   const renameDivineArmor = (newName: string): { success: boolean; reason?: string } => {
     const trimmed = newName.trim();
     if (!trimmed) return { success: false, reason: '名称不能为空' };
     if (trimmed.length > 6) return { success: false, reason: '名称不能超过6个字' };
     setPlayer((p) => {
       if (!p.divineArmor?.hasArmor) return p;
       return {
         ...p,
         divineArmor: {
           ...p.divineArmor,
           armorName: trimmed,
           armorItem: p.divineArmor.armorItem
             ? { ...p.divineArmor.armorItem, name: trimmed }
             : null,
         },
       };
     });
     return { success: true };
   };

   // 刷新神装-神器共鸣状态（神器拔出/收回时调用）
   const refreshArmorResonance = () => {
     setPlayer((p) => {
       if (!p.divineArmor?.hasArmor) return p;
       const active = !!p.divineTrial?.artifactDrawn;
       if (p.divineArmor.resonanceActive === active) return p;
       return {
         ...p,
         divineArmor: { ...p.divineArmor, resonanceActive: active },
       };
     });
   };

   // 🔴 v16.0 神界系统：开始挑战神界Boss
   const startGodRealmBattle = (bossId: string): { success: boolean; reason?: string } => {
     let result = { success: false, reason: '' };
     setPlayer((p) => {
       if (p.level < 100) {
         result = { success: false, reason: '需达到100级才能进入神界' };
         return p;
       }
       if (!p.divineTrial?.inherited) {
         result = { success: false, reason: '需继承神位后才能进入神界' };
         return p;
       }
       const gr = p.godRealm ?? { unlocked: false, defeatedIds: [], divineCoreCrafted: false };
       if (!gr.unlocked) {
         result = { success: false, reason: '神界尚未开启' };
         return p;
       }
       if (gr.defeatedIds.includes(bossId)) {
         result = { success: false, reason: '该神祇已被击败过，不可再次挑战' };
         return p;
       }
       const boss = GOD_REALM_BOSSES.find((b) => b.id === bossId);
       if (!boss) {
         result = { success: false, reason: '挑战目标不存在' };
         return p;
       }
       result = { success: true, reason: '' };
       // 触发战斗
       startBattle({
         battleType: 'god-realm',
         locationId: `god-realm-${boss.category}`,
         enemy: {
           id: boss.id,
           name: `${boss.title}·${boss.name}`,
           years: 99999999,
           qualityColor: boss.qualityColor,
           qualityLabel: boss.qualityLabel,
           hp: boss.hp,
           attack: boss.attack,
           defense: boss.defense,
           speed: boss.speed,
           spirit: boss.spirit,
           skillName: boss.skillName,
           skillDesc: boss.skillDesc,
           element: 'divine',
         },
         meta: { bossId, category: boss.category },
       });
       return p;
     });
     return result;
   };

   // 神界战斗胜利：记录击败id并发放奖励
   const confirmGodRealmVictory = (bossId: string) => {
     setPlayer((p) => {
       const gr = p.godRealm ?? { unlocked: false, defeatedIds: [], divineCoreCrafted: false };
       if (gr.defeatedIds.includes(bossId)) return p;
       const boss = GOD_REALM_BOSSES.find((b) => b.id === bossId);
       if (!boss) return p;
       // 发放奖励物品到背包
       const newInv = [...p.inventory];
       for (const item of boss.rewardItems) {
         // 检查是否已存在（防止重复）
         if (newInv.some((i) => i.id === item.id)) continue;
         newInv.push({ ...item });
       }
       return {
         ...p,
         inventory: newInv,
         godRealm: {
           ...gr,
           defeatedIds: [...gr.defeatedIds, bossId],
         },
       };
     });
   };

   // 合成神界中枢（5块神王碎片 → 完整神界中枢）
   const craftDivineCore = (): { success: boolean; reason?: string } => {
     if (!player) return { success: false, reason: '玩家未初始化' };
     const gr = player.godRealm ?? { unlocked: false, defeatedIds: [], divineCoreCrafted: false };
     if (gr.divineCoreCrafted) {
       // 防御性修复：已标记合成但背包中没有 → 补回
       const hasCore = player.inventory.some((i) => i.id.startsWith('divine-core'));
       if (!hasCore) {
         setPlayer((p) => {
           return {
             ...p,
             inventory: [...p.inventory, { ...DIVINE_CORE_ITEM }],
           };
         });
         return { success: true, reason: '已补发神界中枢' };
       }
       return { success: false, reason: '已拥有完整神界中枢' };
     }
     const shardIds = ['shard-destruction', 'shard-life', 'shard-evil', 'shard-kind', 'shard-asura'];
     // 使用前缀匹配：addItem 会给材料id加时间戳后缀，需兼容
     const hasAll = shardIds.every((id) => player.inventory.some((i) => i.id.startsWith(id)));
     if (!hasAll) {
       return { success: false, reason: '五块神级中枢碎片未集齐' };
     }
      // 扣除5块碎片，加入完整神界中枢
      setPlayer((p) => {
        const curGr = p.godRealm ?? { unlocked: false, defeatedIds: [], divineCoreCrafted: false };
        if (curGr.divineCoreCrafted) return p;
        // 按前缀扣除每类碎片各1个（先浅拷贝，避免filter副作用）
        const removedIds = new Set<string>();
        const newInv = p.inventory.map((i) => ({ ...i })).filter((i) => {
          for (const sid of shardIds) {
            if (i.id.startsWith(sid) && !removedIds.has(sid)) {
              if ((i.quantity ?? 1) > 1) {
                i.quantity = (i.quantity ?? 1) - 1;
                return true;
              }
              removedIds.add(sid);
              return false;
            }
          }
          return true;
        });
        newInv.push({ ...DIVINE_CORE_ITEM });
       return {
         ...p,
         inventory: newInv,
         godRealm: {
           ...curGr,
           divineCoreCrafted: true,
         },
       };
     });
     return { success: true, reason: '' };
   };

   // 自制魂导器：消耗材料生成新魂导器（新6步流程）
   const craftSoulGuide = (params: {
     type: SoulGuideType;
     level: number;
     materialNames: string[];
     coreGemId: string | null;
     name: string;
   }): { success: boolean; reason?: string; item?: IItem; finalAttrs?: Record<string, number> } => {
     if (!player) return { success: false, reason: '玩家未初始化' };
      const { type, level, materialNames, coreGemId, name } = params;
      if (level < 1 || level > 9) return { success: false, reason: '等级无效（1-9级）' };
      const trimmedName = name.trim();
     if (!trimmedName) return { success: false, reason: '请输入魂导器名称' };
     if (trimmedName.length > 5) return { success: false, reason: '名称不能超过5个字' };
      // v2.0 材料总需求 = 基础数 + 核心刻画额外2个（去掉属性数影响）
      const baseReq = CRAFT_MATERIAL_REQ[level] ?? 3;
      const coreExtra = coreGemId ? 2 : 0;
      const totalRequired = baseReq + coreExtra;
      if (materialNames.length < totalRequired) {
        return { success: false, reason: `材料数量不足（需要 ${totalRequired} 个）` };
      }

     const tierColor: Record<number, string> = {
       1: '#94a3b8', 2: '#22c55e', 3: '#3b82f6', 4: '#a855f7', 5: '#f97316',
       6: '#ef4444', 7: '#ec4899', 8: '#eab308', 9: '#ffd700',
     };
     const tierQuality: Record<number, IItem['quality']> = {
       1: 'common', 2: 'rare', 3: 'fine', 4: 'epic', 5: 'legendary',
       6: 'legendary', 7: 'legendary', 8: 'legendary', 9: 'legendary',
     };

      // v2.0 自制魂导器：固定数值，每个人做出来的同等级魂导器数值完全一样
      const fixedStats = CRAFT_FIXED_STATS[level];
      const coreGem = coreGemId ? CORE_GEMS.find(g => g.id === coreGemId) : null;

     let result: { success: boolean; reason?: string; item?: IItem; finalAttrs?: Record<string, number> } = { success: false };
       setPlayer((p) => {
          // 扣除材料：按 name + quality 双维度匹配，避免同名不同品质材料扣错
          let newInv: IItem[] = [];
          const keyCounts: Record<string, number> = {};
          for (const n of materialNames) {
            // 材料名中已包含品质信息的用全名，否则默认common品质
            const key = n;
            keyCounts[key] = (keyCounts[key] || 0) + 1;
          }
          for (const it of p.inventory) {
            if (it.type === 'material') {
              const itKey = it.name;
              if (keyCounts[itKey] && keyCounts[itKey] > 0) {
                const qty = it.quantity ?? 1;
                const deduct = Math.min(qty, keyCounts[itKey]);
                keyCounts[itKey] -= deduct;
                const remain = qty - deduct;
                if (remain > 0) newInv.push({ ...it, quantity: remain });
              } else {
                newInv.push(it);
              }
            } else {
              newInv.push(it);
            }
          }
        for (const k of Object.keys(keyCounts)) {
          if (keyCounts[k] > 0) {
            result = { success: false, reason: '材料不足或已被使用' };
            return p;
          }
        }

           // v2.0 固定数值：从 CRAFT_FIXED_STATS 读取，不随机
           const finalAttrs: Record<string, number> = {
             attack: fixedStats.attack,
             defense: fixedStats.defense,
             speed: fixedStats.speed,
             spirit: fixedStats.spirit,
             hp: fixedStats.hp,
             critRate: fixedStats.critRate,
             critDmg: fixedStats.critDmg,
             allAttr: fixedStats.allAttr,
             soulPower: fixedStats.soulPower,
           };

           // v2.0 自制魂导器必定成功（固定数值系统）
           const successRate = 100;

        const newItem: IItem = {
          id: `craft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: trimmedName,
          type: 'soulGuide',
          soulGuideType: type,
          soulGuideGrade: 'tier3',
          soulGuideLevel: level,
          quality: tierQuality[level] || 'common',
          qualityColor: tierColor[level] || '#94a3b8',
          iconChar: trimmedName.slice(0, 1),
          description: `${p.name} 亲手打造的 ${level} 级魂导器，蕴含稳定的魂力波动${coreGem ? '，核心镶嵌了' + coreGem.name + '。' : '。'}`,
            attributes: {
              attack: finalAttrs.attack || 0,
              defense: finalAttrs.defense || 0,
              speed: finalAttrs.speed || 0,
              spirit: finalAttrs.spirit || 0,
              hp: finalAttrs.hp || 0,
              critRate: finalAttrs.critRate || 0,    // 百分比数值，如 5 表示 +5%
              critDmg: finalAttrs.critDmg || 0,      // 百分比数值
              allAttr: finalAttrs.allAttr || 0,      // 百分比数值
              soulPower: finalAttrs.soulPower || 0,   // v2.0 固定数值
            },
          specialEffect: coreGem ? {
            key: coreGem.effectKey,
            name: coreGem.effect,
            desc: coreGem.effectDesc,
            color: coreGem.color,
         } : undefined,
         craftable: true,
         crafter: p.name,
         craftVersion: 2, // v2.0 标记，用于 calcAttributes 区分处理路径
         sellPrice: Math.round(level * 1000 + (coreGem ? 500 : 0)),
       };

        newInv.push(newItem);
         result = {
           success: true,
           item: newItem,
           finalAttrs,
         };
        // 成就：自制魂导器标记（首次制作）
        const stats = p.achievementStats ?? {} as any;
        const newStats = { ...stats };
        if (!newStats.craftedGuide) {
          newStats.craftedGuide = true;
        }
        return { ...p, inventory: newInv, achievementStats: newStats };
     });
     return result;
   };

   // 启动战斗：设置初始战斗状态并打开战斗界面
   const startBattle = (config: BattleStartConfig) => {
     // 🔴 修复：已在战斗中则忽略新战斗请求，防止状态被意外覆盖
     if (inBattle) return;
     const enemy = config.enemy;
     const bType = config.battleType;
     // 神界BOSS列表：白山茶、五大神王、神级领域、阴阳茶、梦小茶等——防御为0，玩家打出真实伤害
     const GOD_REALM_TYPES = [
       'god-realm',        // 神界中枢BOSS（白山茶、五大神王、神级领域）
       'divine-avatar',    // 神考·神祇分身（神考怪物）
       'divine-ditian',    // 神考·帝天（神考怪物）
       'divine-beast',     // 神考·神兽（神考怪物）
       'sea-god',          // 海神考怪物
       'tea-companion',    // 茶城挑战（阴阳茶等）
     ];
     const isGodRealmBoss = GOD_REALM_TYPES.includes(bType) || 
       (bType === 'challenge' && (config.meta as any)?.challengeType === 'tea-companion');

     // 防御性保底：血量/攻击/防御/速度 为0或NaN时给兜底值，防止战斗卡死
      let safeHp = !enemy.hp || isNaN(enemy.hp) || enemy.hp <= 0 ? 1000 : enemy.hp;
      let safeAtk = !enemy.attack || isNaN(enemy.attack) || enemy.attack <= 0 ? 10 : enemy.attack;
      // 神界BOSS：防御强制为0，真实伤害
      // 普通怪物：防御降低95%
      let enemyDef = (enemy.defense && !isNaN(enemy.defense) && enemy.defense > 0) ? enemy.defense : 0;
      if (config.meta?.shadow||config.meta?.abyss||config.meta?.valley) { /* fixed or recorded defense */ } else if (isGodRealmBoss) {
        enemyDef = 0;
      } else {
        enemyDef = Math.floor(enemyDef * 0.05);
      }
      let safeDef = enemyDef;
      let safeSpd = !enemy.speed || isNaN(enemy.speed) || enemy.speed <= 0 ? 10 : enemy.speed;
      let safeSpirit = !enemy.spirit || isNaN(enemy.spirit) || enemy.spirit <= 0 ? 10 : enemy.spirit;

      // 🔴 全局怪物属性小幅度加强10%（魂兽/神界BOSS/茶城挑战/神考守卫/副本怪物全部覆盖）
      // 血量+10%、攻击+10%、防御+10%、速度+10%、精神+10%
      if(!config.meta?.shadow&&!config.meta?.abyss&&!config.meta?.valley){
      safeHp = Math.max(1, Math.floor(safeHp * 1.1));
      safeAtk = Math.max(1, Math.floor(safeAtk * 1.1));
      if (safeDef > 0) {
        safeDef = Math.max(1, Math.floor(safeDef * 1.1));
      }
      safeSpd = Math.max(1, Math.floor(safeSpd * 1.1));
      safeSpirit = Math.max(1, Math.floor(safeSpirit * 1.1));
      }
    setBattleState({
      battleType: config.battleType,
      locationId: config.locationId ?? '',
      enemy: {
        id: enemy.id,
        name: enemy.name,
        years: enemy.years,
        qualityColor: enemy.qualityColor,
        qualityLabel: enemy.qualityLabel,
        hp: safeHp,
        maxHp: safeHp,
        attack: safeAtk,
        defense: safeDef,
        speed: safeSpd,
        spirit: safeSpirit,
        skillName: enemy.skillName,
        skillDesc: enemy.skillDesc,
        isEncounter: config.battleType === 'encounter',
        element: localBeastElement(enemy.element,enemy.name),
        instantKillChance: enemy.instantKillChance ?? 0,
        specialSkillCooldown: enemy.specialSkillCooldown ?? 0,
        hasOnlySkill: enemy.hasOnlySkill ?? false,
      },
      phase: 'playerTurn',
      logs: [],
      updatedAt: Date.now(),
      exploreSource: config.exploreSource,
      meta: { ...config.meta, jiYueBattleId: crypto.randomUUID(), liehunGrowth: createLiehunLedger(player, config.meta, crypto.randomUUID()),twinBattle:createTwinBattle(player,config,crypto.randomUUID()),goldBattle:extendTwinDomain(player,createGoldBattle(player,config,player?calcAttributes(player).hp:1,crypto.randomUUID())),silverBattle:extendTwinDomain(player,createSilverBattle(player,config,crypto.randomUUID())) },
    });
    setInBattle(true);
  };

  const endBattle = () => {
    if (battleState) {
      setLastBattleResult({ phase: battleState.phase as 'victory' | 'defeat' | 'flee', battleType: battleState.battleType, locationId: battleState.locationId });
    }
    const ascensionId=(battleState?.meta as any)?.ascension?.id;
    const abyssId=battleState?.meta?.abyss?.id;const valleyId=battleState?.meta?.valley?.id;
    const bType = battleState?.battleType;
    const bPhase = battleState?.phase as 'victory' | 'defeat' | 'flee' | undefined;
    setBattleState(null);
    setInBattle(false);
    // 战斗结束后立即回满血
    setPlayer((p) => {
      p=settleTwin(settleSilver(settleGoldBlood(p,battleState?.meta?.goldBattle,bPhase||''),battleState?.meta?.silverBattle,bPhase||''),battleState?.meta?.twinBattle,bPhase||'');
      const attrs = calcAttributes(p);
      let np = ascensionId ? dragonAction(p,{type:"leave",id:ascensionId}).player : { ...p };
      if(abyssId)np=abyssAction(np,{type:"leave",id:abyssId}).player;
      if(valleyId)np=valleyAction(np,{type:"leave",id:valleyId}).player;
      np.currentHp = attrs.hp; // 战斗结束回满/修正血量（可能因buff溢出超过上限）
      // 神考战斗结果处理
      if (bType && bPhase) {
        const dt = np.divineTrial;
        if (dt.chosenTrialId) {
          const trial = getTrialById(dt.chosenTrialId);
          if (trial) {
            if (bPhase === 'victory') {
              if (bType === 'divine-ditian') {
                // 击败帝天 → 第一考通过标记（需要第一考已接取）
                if (dt.currentExamIndex >= 1) {
                  np.divineTrial = { ...dt, firstExamDiTianDefeated: true };
                }
              } else if (bType === 'divine-avatar') {
                np.divineTrial = { ...dt, avatarDefeated: true };
              } else if (bType === 'divine-beast') {
                np.divineTrial = { ...dt, beastDefeated: true };
              }
            } else if (bPhase === 'defeat') {
              // 失败不扣罚，仅保留标记状态
            }
          }
        }
      }
      // 成就统计：击败魂兽数累加
      if (bPhase === 'victory') {
        const beastBattleTypes = ['hunt', 'encounter', 'mountain-dungeon', 'spirit-tower'];
        const stats = np.achievementStats ?? {} as any;
        const isBeastBattle = beastBattleTypes.includes(bType || '');
        const isFierce = bType === 'fierce-beast';
        if (isBeastBattle || isFierce) {
          // 计算本次击败魂兽的品质索引（与魂环/魂骨索引对齐：十年=1, 百年=2, 千年=3, 万年=4, 十万年=5, 百万年=6）
          // 优先从 enemy.years 读取（战斗开始就有，更可靠），rewards.beastYears 兜底
          const by = battleState?.enemy?.years ?? battleState?.rewards?.beastYears ?? 0;
          let qIdx = 1;
          if (by >= 1000000) qIdx = 6;
          else if (by >= 100000) qIdx = 5;
          else if (by >= 10000) qIdx = 4;
          else if (by >= 1000) qIdx = 3;
          else if (by >= 100) qIdx = 2;
          np.achievementStats = {
            ...stats,
            totalBeastKills: (stats.totalBeastKills ?? 0) + 1,
            fierceBeastDefeated: stats.fierceBeastDefeated || isFierce,
            bestBeastQualityIndex: Math.max(stats.bestBeastQualityIndex ?? 0, qIdx),
          };
        }
      }
      return np;
    });
  };

  // 探索中收集物品（暂存到 exploration.collectedItems）
  const collectExploreItem = (item: IItem) => {
    setExploration((prev) => {
      if (!prev) return prev;
      return { ...prev, collectedItems: [...prev.collectedItems, item] };
    });
  };

  // 探索中收集魂环（暂存到 exploration.collectedRings，不启动倒计时）
  // soulIndex: 0=主修武魂, 1=次修武魂（双生武魂场景必须传，否则默认归到第一武魂）
  const collectExploreRing = (ring: ISoulRing, soulIndex: 0 | 1 = 0) => {
    setExploration((prev) => {
      if (!prev) return prev;
      const ringWithSoulIdx = { ...ring, soulIndex };
      return { ...prev, collectedRings: [...prev.collectedRings, ringWithSoulIdx] };
    });
  };

  // 从探索收集列表中移除魂环（玩家选择销毁时调用）
  const removeExploreRing = (ringId: string) => {
    setExploration((prev) => {
      if (!prev) return prev;
      return { ...prev, collectedRings: prev.collectedRings.filter((r) => r.id !== ringId) };
    });
  };

  // 结束探索：将收集的物品合并进背包，魂环合并进待吸收列表并统一设置3分钟倒计时
  const finishExploration = () => {
    // 🔴 关键：直接读取当前 exploration 状态，不要用 setExploration callback 读取
    // setState callback 是 React 异步批处理的，下面的合并代码同步执行时拿不到数据，会导致魂环魂骨全部丢失
    const exp = exploration;
    if (!exp) {
      setExploration(null);
      return;
    }
    const collectedItems = exp.collectedItems;
    const collectedRings = exp.collectedRings;

    // 先标记完成，再合并物品和魂环（都在同一次更新里）
    setExploration(null);

    // 合并物品（使用 addItem 逻辑，确保材料/消耗品正确堆叠）
    if (collectedItems.length > 0) {
      setPlayer((p) => {
        let newInv = [...p.inventory];
        for (const item of collectedItems) {
          const stackable = item.type === 'material' || item.type === 'consumable' || item.type === 'special';
          let merged = false;
          if (stackable) {
            const idx = newInv.findIndex((it) => {
              if (it.name !== item.name || it.type !== item.type) return false;
              if (item.type === 'material') {
                return (it.materialQuality || 'common') === (item.materialQuality || 'common');
              }
              return true;
            });
            if (idx >= 0) {
              newInv[idx] = { ...newInv[idx], quantity: (newInv[idx].quantity ?? 1) + (item.quantity ?? 1) };
              merged = true;
            }
          }
          if (!merged) {
            const newItem = { ...item, id: `${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
            if (stackable && newItem.quantity === undefined) newItem.quantity = 1;
            newInv = [...newInv, newItem];
          }
        }
        return { ...p, inventory: newInv };
      });
    }
    // 合并魂环（3分钟时限，超时自动消失），保留 soulIndex 武魂归属
    if (collectedRings.length > 0) {
      const expiresAt = Date.now() + 3 * 60 * 1000;
      setPlayer((p) => {
        const newPending: IPendingSoulRing[] = collectedRings.map((ring) => ({
          ...ring,
          expiresAt,
          soulIndex: ring.soulIndex ?? 0,
        }));
        return {
          ...p,
          pendingSoulRings: [...p.pendingSoulRings, ...newPending].slice(-20),
        };
      });
    }
  };

  // 中断探索（玩家切换页面等异常退出）：保留已收集的魂环和魂骨/物品，不清空探索进度
  const abortExploration = (): { rings: number; items: number } => {
    let ringsCount = 0;
    let itemsCount = 0;
    if (!exploration) return { rings: 0, items: 0 };
    const collectedItems = exploration.collectedItems;
    const collectedRings = exploration.collectedRings;
    // 合并物品（含魂骨，使用与 addItem 一致的堆叠逻辑）
    if (collectedItems.length > 0) {
      itemsCount = collectedItems.length;
      setPlayer((p) => {
        let newInv = [...p.inventory];
        for (const item of collectedItems) {
          const stackable = item.type === 'material' || item.type === 'consumable' || item.type === 'special';
          let merged = false;
          if (stackable) {
            const idx = newInv.findIndex((it) => {
              if (it.name !== item.name || it.type !== item.type) return false;
              if (item.type === 'material') {
                return (it.materialQuality || 'common') === (item.materialQuality || 'common');
              }
              return true;
            });
            if (idx >= 0) {
              newInv[idx] = { ...newInv[idx], quantity: (newInv[idx].quantity ?? 1) + (item.quantity ?? 1) };
              merged = true;
            }
          }
          if (!merged) {
            const newItem = { ...item, id: `${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
            if (stackable && newItem.quantity === undefined) newItem.quantity = 1;
            newInv = [...newInv, newItem];
          }
        }
        return { ...p, inventory: newInv };
      });
    }
    // 合并魂环（3分钟时限，超时自动消失），保留 soulIndex 武魂归属
    if (collectedRings.length > 0) {
      ringsCount = collectedRings.length;
      const expiresAt = Date.now() + 3 * 60 * 1000;
      setPlayer((p) => {
        const newPending: IPendingSoulRing[] = collectedRings.map((ring) => ({
          ...ring,
          expiresAt,
          soulIndex: ring.soulIndex ?? 0,
        }));
        return {
          ...p,
          pendingSoulRings: [...p.pendingSoulRings, ...newPending].slice(-20),
        };
      });
    }
    // 清理探索状态
    setExploration(null);
    return { rings: ringsCount, items: itemsCount };
  };

  
  // === 魂核系统 ===
  // 选择魂核类型（89级瓶颈+经验满时调用）
  // 选择魂核类型（89级瓶颈+经验满时调用）
  // 阴阳魂核选择：直接选择阴或阳魂核，选完立即突破到90级
  const chooseSoulCore = (type: 'yin' | 'yang') => {
    setPlayer((p) => {
      if (p.level !== 89 || p.soulCoreType !== 'none') return p;
      if (p.exp < getMaxExp(p.level)) return p;

      let newSoulRings = p.soulRings;
      let newMartialSoul = p.martialSoul;

       // 🔴 罗三炮90级进化：凝聚魂核突破90级且前九个魂环全是光属性 → 进化为耀阳圣龙
       // 注意：89→90级走魂核路线（chooseSoulCore），不走普通闭关finishCultivation，所以进化逻辑必须在这里处理
       if (p.martialSoul.name === '罗三炮') {
         const rings = p.soulRings;
         const allLight = rings.length >= 9 && rings.slice(0, 9).every((r) => {
           return normalizeBeastAttribute(r.beastAttribute) === '光属性';
         });
        if (allLight) {
          newMartialSoul = evolveMartialSoul(p.martialSoul, 'evolve-shenglong');
          // 魂技重生（保留魂环年限、颜色、属性数值）
          const newSkills = newMartialSoul.soulSkills || [];
          newSoulRings = p.soulRings.map((ring, idx) => ({
            ...ring,
            skillName: newSkills[idx] || ring.skillName,
            skillDesc: `由耀阳圣龙武魂衍生的第${idx + 1}魂技，圣龙威压之下，万物臣服。`,
          }));
        }
      }

      const newP = {
          ...p,
          level: 90,
          exp: 0,
          soulCoreType: type as 'yin' | 'yang',
          soulCoreStage: 1, // 单魂核已完成
          martialSoul: newMartialSoul,
          soulRings: newSoulRings,
      };
      const newAttrs = calcAttributes(newP);
      newP.currentHp = newAttrs.hp;

      // 🔴 天梦冰蚕魂环：魂核突破90级后重算伤害百分比（按大境界成长）
      if (newP.soulRings.some((r) => r.color === 'blueWhite')) {
        const res = refreshTianmengDamagePct(newP.soulRings, 90, '魂核突破');
        newP.soulRings = res.rings;
      }
      if (newP.isTwinSoul && newP.secondSoulRings && newP.secondSoulRings.some((r) => r.color === 'blueWhite')) {
        const res2 = refreshTianmengDamagePct(newP.secondSoulRings, 90, '魂核突破（次修）');
        newP.secondSoulRings = res2.rings;
      }

      return newP;
    });
  };

  // 98级突破：使用另一个阴阳魂核直接突破到99级（双魂核圆满）
   const breakThroughWithYinYangCore = (level: 89 | 98): boolean => {
     if (level !== 98) return false; // 仅支持98级突破（89级走chooseSoulCore）
     let success = false;
    setPlayer((p) => {
      if (p.level !== 98) return p;
      if (p.exp < getMaxExp(p.level)) return p;
      // 必须是单魂核状态（yin 或 yang），已经是 yin-yang 直接返回
      if (p.soulCoreType !== 'yin' && p.soulCoreType !== 'yang') return p;
      success = true;
      const newP = {
        ...p,
        level: 99,
        exp: 0,
        soulCoreType: 'yin-yang' as const, // 双魂核圆满
        soulCoreStage: 3, // 双魂核圆满
      };
      const newAttrs = calcAttributes(newP);
      newP.currentHp = newAttrs.hp;
      // 🔴 天梦冰蚕魂环：双魂核突破99级后重算伤害
      const res = refreshTianmengDamagePct(newP.soulRings, 99, '双魂核突破');
      newP.soulRings = res.rings;
      if (newP.isTwinSoul && newP.secondSoulRings) {
        const res2 = refreshTianmengDamagePct(newP.secondSoulRings, 99, '双魂核突破（次修）');
        newP.secondSoulRings = res2.rings;
      }
      return newP;
    });
    return success;
  };

  // === 海神阁 ===
  const confirmSeaGodVictory = (memberId: string) => {
    let result = { success: false, expGained: 0, coinGained: 0, newPosition: -1, isPavilionMaster: false };
    setPlayer((p) => {
      // 找到被击败的成员
      const memberIdx = SEA_GOD_MEMBERS.findIndex((m) => m.id === memberId);
      if (memberIdx < 0) return p;
      // 检查是否已经击败过
      if (p.seaGodDefeatedIds.includes(memberId)) return p;
      const member = SEA_GOD_MEMBERS[memberIdx];
      const newDefeatedIds = [...p.seaGodDefeatedIds, memberId];
      // 新位置 = 被击败成员的索引（接替他的位置）
      const newPosition = memberIdx;
      const isPavilionMaster = memberIdx === 0; // 击败阁主（索引0）= 成为阁主

      // 首次进入海神阁（seaGodPosition 为 -1），同时晋升 academyRank 为 sea-god
      const newAcademyRank = p.seaGodPosition < 0 && p.academyRank !== 'sea-god' ? 'sea-god' : p.academyRank;

       const newP = {
         ...p,
         seaGodDefeatedIds: newDefeatedIds,
         seaGodPosition: newPosition,
         academyRank: newAcademyRank as any,
         // 成就：击败凶兽（帝天等海神阁成员若为凶兽级）→ 简化：击败海神阁成员也计入凶兽成就
         achievementStats: {
           ...(p.achievementStats ?? {} as any),
           fierceBeastDefeated: (p.achievementStats?.fierceBeastDefeated) || memberIdx <= 2, // 前3名视为凶兽级
         },
       };

      result = {
        success: true,
        expGained: member.rewards.exp,
        coinGained: member.rewards.coins,
        newPosition,
        isPavilionMaster,
      };

      // 加经验和金币（通过 addExp/addCoins 方式）
      return newP;
    });
    // 加经验和金币（在 setPlayer 外再走一遍 addExp/addCoins 确保升级等逻辑触发）
    if (result.success && result.expGained > 0) addExp(result.expGained);
    if (result.success && result.coinGained > 0) addCoins(result.coinGained);
    return result;
  };

  // === 史莱克学院 ===
  const joinShrekAcademy = () => {
    setPlayer((p) => {
      if (p.academyRank && p.academyRank !== 'none') return p;
      return { ...p, academyRank: 'freshman' };
    });
  };

  const promoteToOuterCourt = () => {
    setPlayer((p) => {
      if (p.academyRank === 'outer' || p.academyRank === 'inner' || p.academyRank === 'sea-god') return p;
      return { ...p, academyRank: 'outer', examPassed: true };
    });
  };

  const promoteToInnerAcademy = (): boolean => {
    let promoted = false;
    setPlayer((p) => {
      // 王者段位且当前是外院或更低 → 晋升内院
      if (p.arenaRank === 'king' && (p.academyRank === 'outer' || p.academyRank === 'freshman' || p.academyRank === 'none')) {
        promoted = true;
        return { ...p, academyRank: 'inner' };
      }
      return p;
    });
    return promoted;
  };

  const setExamCooldown = (ms: number) => {
    setPlayer((p) => ({ ...p, examCooldownUntil: Date.now() + ms }));
  };

  // === 竞技场 ===
  const addArenaResult = (win: boolean, coinGain: number) => {
    let rank: ArenaRank = 'bronze';
    let stars = 0;
    let rankUp = false;
    let rankDown = false;
    setPlayer((p) => {
      let total = getTotalArenaStars(p.arenaRank || 'bronze', p.arenaStars || 0);
      const beforeRank = p.arenaRank || 'bronze';
      if (win) {
        total += 1;
      }
      const r = getArenaRankFromTotal(total);
      rank = r.rank;
      stars = r.stars;
      rankUp = ARENA_RANK_ORDER.indexOf(r.rank) > ARENA_RANK_ORDER.indexOf(beforeRank);
      rankDown = ARENA_RANK_ORDER.indexOf(r.rank) < ARENA_RANK_ORDER.indexOf(beforeRank);
      const newCoins = Math.max(0, p.soulCoins + coinGain);
      let newAcademyRank = p.academyRank;
      if (r.rank === 'king' && beforeRank !== 'king' &&
          (p.academyRank === 'outer' || p.academyRank === 'freshman' || p.academyRank === 'none')) {
        newAcademyRank = 'inner';
      }
      // 成就统计：竞技场胜场 + 连胜
      const stats = p.achievementStats ?? {} as any;
      const newStats = { ...stats };
      if (win) {
        const newWins = (stats.arenaTotalWins ?? 0) + 1;
        const newStreak = (stats._arenaCurrentStreak ?? 0) + 1;
        const bestStreak = Math.max(stats.arenaBestStreak ?? 0, newStreak);
        Object.assign(newStats, { arenaTotalWins: newWins, _arenaCurrentStreak: newStreak, arenaBestStreak: bestStreak });
      } else {
        Object.assign(newStats, { _arenaCurrentStreak: 0 });
      }
      return { ...p, arenaRank: rank, arenaStars: stars, soulCoins: newCoins, academyRank: newAcademyRank, achievementStats: newStats };
    });
    return { rank, stars, rankUp, rankDown };
  };

  // === 内院名师指导 ===
  // 内院名师指导冷却时间（5分钟）
  const MENTOR_COOLDOWN_MS = 5 * 60 * 1000;

  const takeMentorGuidance = (teacherId: string): { success: boolean; expGained: number } => {
    let success = false;
    let expGained = 0;
    setPlayer((p) => {
      const now = Date.now();
      const cdEnd = p.mentorCooldowns[teacherId] || 0;
      if (cdEnd > now) return p; // 冷却中，不可指导
      const teacher = MENTOR_TEACHERS.find((t) => t.id === teacherId);
      if (!teacher) return p;
      // 检查是否因魂环不足被阻断
      const expectedRings = getMaxRings(p.level);
      if (p.soulRings.length < expectedRings) return p;
      // 增加经验（不会突破瓶颈）
      let curExp = p.exp + teacher.expReward;
      let curLevel = p.level;
      let curHp = p.currentHp;
      let leveledUp = false;
      while (true) {
        const maxExp = getMaxExp(curLevel);
        if (curExp < maxExp) break;
        if (isBottleneck(curLevel, p.brokenBottlenecks)) {
          curExp = maxExp;
          break;
        }
        if (curLevel >= 99) {
          curExp = maxExp;
          break;
        }
        const nextLevel = curLevel + 1;
        if (getMaxRings(nextLevel) > p.soulRings.length) {
          curExp = getMaxExp(curLevel);
          break;
        }
        curExp -= maxExp;
        curLevel = nextLevel;
        leveledUp = true;
        const attrs = calcAttributes({ ...p, level: curLevel });
        curHp = attrs.hp;
      }
      success = true;
      expGained = teacher.expReward;
      // 🔴 天梦冰蚕魂环：名师指导升级后重算伤害
      let finalSoulRings = p.soulRings;
      let finalSecondSoulRings = p.secondSoulRings;
      if (leveledUp) {
        const res = refreshTianmengDamagePct(p.soulRings, curLevel, '名师指导');
        finalSoulRings = res.rings;
        if (p.isTwinSoul && p.secondSoulRings) {
          const res2 = refreshTianmengDamagePct(p.secondSoulRings, curLevel, '名师指导（次修）');
          finalSecondSoulRings = res2.rings;
        }
      }
      return {
        ...p,
        exp: curExp,
        level: curLevel,
        currentHp: curHp,
        soulRings: finalSoulRings,
        secondSoulRings: finalSecondSoulRings,
        mentorCooldowns: { ...p.mentorCooldowns, [teacherId]: now + MENTOR_COOLDOWN_MS },
      };
    });
    return { success, expGained };
  };

  // 获取导师剩余冷却时间（毫秒），<=0 表示可用
  const getMentorCooldown = (teacherId: string): number => {
    if (!player) return 0;
    const cdEnd = player.mentorCooldowns[teacherId] || 0;
    const remaining = cdEnd - Date.now();
    return remaining > 0 ? remaining : 0;
  };


  // ========== 全局属性 memo（避免组件层重复调用 calcAttributes）==========
  const attributes = useMemo(() => {
    if (!player) return null;
    return calcAttributes(player);
  }, [player]);

  // 成就系统：已解锁成就ID集合（从永久保存的 unlockedAchievements 读取）
  // 🔴 v14.0 成就永久化：不再根据当前玩家状态实时计算，而是从永久列表读取
  // 转世后等级/魂环归零，但已解锁成就永远保留
  const unlockedAchievementIds = useMemo(() => {
    if (!player) return new Set<string>();
    const set = new Set<string>();
    if (Array.isArray(player.unlockedAchievements)) {
      for (const id of player.unlockedAchievements) set.add(id);
    }
    return set;
  }, [player]);

  // 获取成就进度（显示用）—— 从实际进度算，但完成态以永久解锁列表为准
  const getAchievementProgress = useCallback((ach: IAchievement) => {
    if (!player) return { current: 0, target: 1, completed: false };
    const prog = computeAchievementProgress(player, ach);
    // 已永久解锁的成就视为完成，显示满进度
    const permanentlyUnlocked = Array.isArray(player.unlockedAchievements) && player.unlockedAchievements.includes(ach.id);
    if (permanentlyUnlocked) {
      return { ...prog, completed: true, current: Math.max(prog.current, prog.target) };
    }
    return prog;
  }, [player]);

  const value = useMemo<GameContextValue>(() => ({
    player, attributes, hasSave, loading, inBattle, setInBattle,
     exploration, setExploration,
     battleState, setBattleState, lastBattleResult,
     createPlayer, loadSave, saveGame, resetGame, exportSave, importSave,
     performReincarnation, getReincarnationOrbs, getReincarnationBonus, canReincarnate,
    addExp, addCoins, addItem, addSoulRing, setPlayer, setTitle, setDomain,
    addPendingRing, absorbPendingRing, discardPendingRing, cleanupExpiredRings,
    setCurrentHp, consumeStamina, recoverStamina, getCurrentStamina,
    startCultivation, finishCultivation, breakthroughEasterRealm,
    canEnterDivineTrials, performDivineDraw, confirmDivineTrial, refreshDivineDraw, acceptExam, checkExamComplete,
    completeExam, failExam, drawArtifact, upgradeArtifact, getArtifactUpgradeCost,
     inheritDeity, setDivineRingColor, confirmDivineAvatarVictory, confirmDiTianVictory, confirmDivineBeastVictory, recordDivineAvatarDefeat,
     recruitCharacter, toggleTeamMember, equipItem, unequipSlot, unequipSoulBone,
       convertToDivineArmor, renameDivineArmor, refreshArmorResonance,
       startGodRealmBattle, confirmGodRealmVictory, craftDivineCore,
       craftSoulGuide,
     startBattle, endBattle,
     collectExploreItem, collectExploreRing, removeExploreRing, finishExploration, abortExploration,
     takeMentorGuidance, getMentorCooldown,
       chooseSoulCore,
       breakThroughWithYinYangCore,
       confirmSeaGodVictory,
       joinShrekAcademy, promoteToOuterCourt, promoteToInnerAcademy, setExamCooldown, addArenaResult,
       useConsumable,
       materialConvert,
       // 魂灵系统
       addPendingSpirit, contractSpirit, discardPendingSpirit, cleanupExpiredSpirits,
       upgradeSpirit, breakthroughSpirit, setActiveSpirits,
     setSecondDomain,
     // 天梦冰蚕献祭奇遇
     canTriggerTianmeng, markTianmengTriggered, acceptTianmengSacrifice, rejectTianmengSacrifice,
     // 🔴 v17.1 侣系统
     acceptCompanionFavor, rejectCompanionFavor, checkAndStoreFavorTrigger, computeFavorGain, giftCompanion,
       helpTransformCompanion, becomeLover, becomeSpouse, divorceCompanion, forgetCompanion, dualCultivate, mateCompanion,
     getCompanionLoverBonus, pendingFavorBeastId, clearPendingFavor,
      // 🔴 v17.2 茶城系统
     pendingTeaFavorId, teaNodeCooldowns, exploreTeaNode, acceptTeaFavor, rejectTeaFavor, clearPendingTeaFavor,
       challengeCompanionWin, challengeCompanionLose, getChallengeCooldown, switchActiveArtifact,
       // 🔴 吞噬茶武魂
       devourBeast, recordTeaDefeat, getTeaDefeatCount, convertSpecialSpirit,
        toggleSpecialSpiritActive, forceMarryHundunCha, hasHundunChaSpouse,
       // 🔴 v22.0 百级神级修炼 + 法则碎片系统
        unlockGodLevelCultivation, canUnlockGodLevel, chooseLawFragment, fuseLaw,
        godBreakthrough, isGodBottleneck, getFusedLawsCount, getGodLevelCap,
       // 一键扫荡
       setSweepFilters, settleLiehunVictory, settleJiYueBattle, sweepExplore, getSweepCount, incrementSweepCount,
       // 轮回之影
       getReincarnationShadow, hasShadowChallengedToday, startShadowChallenge, claimShadowVictory,
      // 成就系统
       achievements: ACHIEVEMENTS,
       unlockedAchievementIds,
       getAchievementProgress,
       clearNewAchievements,
      }), [player, attributes, hasSave, loading, exploration, battleState, lastBattleResult, inBattle, clearNewAchievements, unlockedAchievementIds, getAchievementProgress, sweepExplore, getSweepCount, incrementSweepCount, getReincarnationShadow, hasShadowChallengedToday, startShadowChallenge, claimShadowVictory]);

  const localBattleLoaded=useRef(false);
  useEffect(()=>{if(!player)return;const key='__local_fierce_battle_v1_'+(window.appId||'local');const owner=player.name+'|'+(player.reincarnationCount||0)+'|'+player.martialSoul?.name;try{if(!localBattleLoaded.current){localBattleLoaded.current=true;const raw=localStorage.getItem(key);if(raw&&!inBattle&&!battleState){const x=JSON.parse(raw);if(x.owner===owner&&['playerTurn','enemyTurn','victory','defeat','flee'].includes(x.battle?.phase)&&(x.battle.enemy?.hp>0 || x.battle.phase==='victory')){setBattleState(x.battle);setInBattle(true);return;}}}if(inBattle&&(battleState?.battleType==='fierce-beast'||(battleState?.meta as any)?.ascension||(battleState?.meta as any)?.abyss||(battleState?.meta as any)?.valley||(battleState?.meta as any)?.bloodBattle||(battleState?.meta as any)?.silverBattle||(battleState?.meta as any)?.goldBattle||(battleState?.meta as any)?.armorDomain?.used||(battleState?.meta as any)?.liehunGrowth))localStorage.setItem(key,JSON.stringify({owner,battle:battleState}));else localStorage.removeItem(key);}catch{}},[player?.name,inBattle,battleState]);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    // 无 Provider 时返回默认空值，避免崩溃
    return {
      player: null,
      attributes: null,
      hasSave: false,
      loading: false,
      inBattle: false,
      setInBattle: () => {},
       exploration: null,
       setExploration: () => {},
       battleState: null,
       setBattleState: () => {},
       lastBattleResult: { phase: null, battleType: null, locationId: null },
      createPlayer: () => {},
      loadSave: () => false,
       saveGame: () => {},
       resetGame: () => {},
       performReincarnation: () => ({ success: false, reason: '未初始化' }),
       getReincarnationOrbs: () => [],
       getReincarnationBonus: () => ({ count: 0, attackBonus: 0, ringYearBonus: 0, ringYearBonusPct: 0 }),
       canReincarnate: () => false,
      exportSave: () => '',
      importSave: () => ({ success: false, reason: '' }),
      addExp: () => ({ leveledUp: false, newLevel: 1, bottleneck: false, blocked: false }),
      addCoins: () => {},
      addItem: () => false,
      addSoulRing: () => false,
      addPendingRing: () => {},
       absorbPendingRing: () => ({ success: false, levelDropped: false }),
       canTriggerTianmeng: () => false,
       markTianmengTriggered: () => {},
       acceptTianmengSacrifice: () => ({ success: false, reason: '未初始化' }),
       rejectTianmengSacrifice: () => {},
       discardPendingRing: () => {},
      cleanupExpiredRings: () => {},
       setPlayer: () => {},
       setTitle: () => {},
       setDomain: () => {},
      setCurrentHp: () => {},
      consumeStamina: () => false,
      recoverStamina: () => 0,
      getCurrentStamina: () => ({ current: 0, max: 0 }),
      startCultivation: () => {},
      finishCultivation: () => {},
      breakthroughEasterRealm: () => ({ success: false, newStage: 0, reason: '' }),
      canEnterDivineTrials: () => false,
      performDivineDraw: () => ({ success: false, trial: null, isMiss: false, reason: '' }),
      confirmDivineTrial: () => ({ success: false, reason: '' }),
      refreshDivineDraw: () => ({ success: false, reason: '', cost: 0 }),
      acceptExam: () => ({ success: false, reason: '' }),
      checkExamComplete: () => false,
      completeExam: () => ({ success: false, rewards: [], reason: '' }),
      failExam: () => ({ success: false, reason: '' }),
      drawArtifact: () => ({ success: false, reason: '', rewards: [] }),
      upgradeArtifact: () => ({ success: false, levelsUp: 0, cost: 0, reason: '' }),
      getArtifactUpgradeCost: () => 0,
      inheritDeity: () => ({ success: false, reason: '' }),
      setDivineRingColor: () => {},
  confirmDivineAvatarVictory: () => {},
  confirmDiTianVictory: () => {},
  confirmDivineBeastVictory: () => {},
  recordDivineAvatarDefeat: () => false,
      recruitCharacter: () => false,
      toggleTeamMember: () => false,
      equipItem: () => {},
      unequipSlot: () => {},
        unequipSoulBone: () => {},
        convertToDivineArmor: () => ({ success: false, reason: '未初始化' }),
        renameDivineArmor: () => ({ success: false, reason: '未初始化' }),
         refreshArmorResonance: () => {},
         startGodRealmBattle: () => ({ success: false, reason: '未初始化' }),
         confirmGodRealmVictory: () => {},
         craftDivineCore: () => ({ success: false, reason: '未初始化' }),
         craftSoulGuide: () => ({ success: false, reason: '未初始化' }),
      startBattle: () => {},
      endBattle: () => {},
       collectExploreItem: () => {},
      collectExploreRing: () => {},
      removeExploreRing: () => {},
       finishExploration: () => {},
       abortExploration: () => ({ rings: 0, items: 0 }),
       joinShrekAcademy: () => {},
      promoteToOuterCourt: () => {},
      promoteToInnerAcademy: () => false,
      setExamCooldown: () => {},
      takeMentorGuidance: () => ({ success: false, expGained: 0 }),
      getMentorCooldown: () => 0,
      chooseSoulCore: () => {},
      breakThroughWithYinYangCore: () => false,
      confirmSeaGodVictory: () => ({ success: false, expGained: 0, coinGained: 0, newPosition: -1, isPavilionMaster: false }),
      addArenaResult: () => ({ rank: 'bronze' as const, stars: 0, rankUp: false, rankDown: false }),
      useConsumable: () => ({ success: false, reason: '未加载游戏' }),
      materialConvert: () => ({ success: false, reason: '未初始化', gotQty: 0 }),
      addPendingSpirit: () => {},
      contractSpirit: () => ({ success: false, reason: '未初始化' }),
      discardPendingSpirit: () => {},
      cleanupExpiredSpirits: () => {},
      upgradeSpirit: () => ({ success: false, reason: '未初始化' }),
      breakthroughSpirit: () => ({ success: false, reason: '未初始化' }),
       setActiveSpirits: () => {},
       setSecondDomain: () => {},
       // 🔴 v17.1 侣系统
       acceptCompanionFavor: () => false,
       rejectCompanionFavor: () => {},
       checkAndStoreFavorTrigger: () => false,
       pendingFavorBeastId: null,
       clearPendingFavor: () => {},
       computeFavorGain: () => 0,
       giftCompanion: () => ({ success: false, reason: '未初始化' }),
       helpTransformCompanion: () => ({ success: false, reason: '未初始化' }),
       becomeLover: () => ({ success: false, reason: '未初始化' }),
       becomeSpouse: () => ({ success: false, reason: '未初始化' }),
       divorceCompanion: () => ({ success: false, reason: '未初始化' }),
       forgetCompanion: () => ({ success: false, reason: '未初始化' }),
       dualCultivate: () => ({ success: false, reason: '未初始化' }),
       mateCompanion: () => ({ success: false, reason: '未初始化' }),
       getCompanionLoverBonus: () => 0,
       // 🔴 v17.2 茶城系统
       pendingTeaFavorId: null,
       teaNodeCooldowns: {},
       exploreTeaNode: () => ({ success: false, reason: '未初始化' }),
       setSweepFilters: () => {}, settleLiehunVictory: () => {}, settleJiYueBattle: () => {},
       sweepExplore: () => ({ success: false, reason: '未初始化' }),
       getSweepCount: () => 0,
       incrementSweepCount: () => {},
       getReincarnationShadow: () => null,
       hasShadowChallengedToday: () => false,
       startShadowChallenge: () => ({ success: false, reason: '未初始化' }),
       claimShadowVictory: () => ({ success: false, reason: '未初始化' }),
       acceptTeaFavor: () => false,
       rejectTeaFavor: () => {},
       clearPendingTeaFavor: () => {},
      challengeCompanionWin: () => ({ success: false, reason: '未初始化' }),
      challengeCompanionLose: () => ({ success: false, reason: '未初始化' }),
      getChallengeCooldown: () => 0,
       switchActiveArtifact: () => ({ success: false, reason: '未初始化' }),
       // 🔴 吞噬茶武魂
       devourBeast: () => ({ success: false, reason: '未初始化' }),
       recordTeaDefeat: () => 0,
       getTeaDefeatCount: () => 0,
       convertSpecialSpirit: () => ({ success: false, reason: '未初始化' }),
       toggleSpecialSpiritActive: () => ({ success: false, reason: '未初始化' }),
       forceMarryHundunCha: () => ({ success: false, reason: '未初始化' }),
       hasHundunChaSpouse: () => false,
        // 🔴 v22.0 百级神级修炼 + 法则碎片系统
        unlockGodLevelCultivation: () => {},
        canUnlockGodLevel: () => false,
        chooseLawFragment: () => ({ success: false, reason: '未初始化' }),
        fuseLaw: () => ({ success: false, reason: '未初始化' }),
        godBreakthrough: () => ({ success: false, reason: '未初始化' }),
        isGodBottleneck: () => false,
        getFusedLawsCount: () => 0,
        getGodLevelCap: () => 99,
        // 成就系统
       achievements: ACHIEVEMENTS,
       unlockedAchievementIds: new Set<string>(),
       getAchievementProgress: () => ({ current: 0, target: 1, completed: false }),
       clearNewAchievements: () => {},
     };
   }
   return ctx;
 }

// 获取已招募的角色数据
export function useRecruits() {
  const { player } = useGame();
  return useMemo(() => {
    return MOCK_RECRUITS.filter((r) => player?.team.includes(r.id) ?? false);
  }, [player?.team]);
}

function __localElementSet(value){return elementSet(value,normalizeBeastAttribute);}
function __localResonance(element,rings,bones,options){return resonance(element,rings,bones,options,normalizeBeastAttribute,inferElementFromName);}
function __localBoneGrowth(bone,newYears,slot){
 const oldYears=Math.max(0,Number(bone.soulBoneYears)||0);
 const years=Math.max(oldYears,Math.min(9990000,newYears));
 const before=calcBoneAttrsByYears(oldYears,slot),after=calcBoneAttrsByYears(years,slot);
 const result={...(bone.attributes||{})};
 for(const key of ['attack','defense','speed','spirit','hp']){
  const original=Number.isFinite(result[key])?result[key]:before[key];
  result[key]=Math.max(original,original+Math.max(0,after[key]-before[key]));
 }
 return result;
}

export function localRingGrowthStats(ring:any, years:number, type=ring.originalBeastType||ring.beastType||'qiang') {const stats=calcRingStatsByYears(years,type,{deterministic:true});for(const key of ['attackBonus','defenseBonus','speedBonus','spiritBonus','hpBonus','critRateBonus','critDmgBonus','soulPowerBonus','skillDamage'])if(Number.isFinite(ring[key]))stats[key]=Math.max(stats[key],ring[key]);return stats;}
const localBeastElements={"风尾鸡冠蛇":"木属性","时序夜狼":"时间属性","铁角蛮牛":"土属性","曼陀罗蛇":"木属性","柔骨媚兔":"木属性","钢毛刚猪":"金属性","青风雉":"木属性","岩角羚羊":"土属性","疾风蜂雀":"木属性","钢刺豪猪":"土属性","光明圣鹰":"光属性","精铁灵猴":"金属性","金晶兽":"金属性","青藤蟒":"木属性","碧水蟾":"水属性","赤炎鼠":"火属性","岩石傀儡":"土属性","冰蚕":"冰属性","雷霆鸟":"雷属性","御风兔":"木属性","光明蝶(幼体)":"光属性","深海水纹蝠":"水属性","灵眸兔":"精神属性","混沌虫":"空间属性","时空虫":"空间属性","虚空兔":"空间属性","时之蛇":"时间属性","时光虫":"时间属性","钟表精":"时间属性","空间刃蝎":"空间属性","虚空灵":"空间属性","金铁兽":"金属性","银甲兽":"金属性","缠魂藤蔓":"木属性","古树精":"木属性","水之元素":"水属性","水灵精":"水属性","火之元素":"火属性","火灵精":"火属性","土之元素":"土属性","磐岩怪":"土属性","冰之元素":"冰属性","冰霜雪狼":"冰属性","雷之元素":"雷属性","紫电鳗":"雷属性","风之精灵":"木属性","凌风雀":"木属性","光之元素":"光属性","圣光神鹿":"光属性","虚空元素":"空间属性","玄铁幽狼":"金属性","精神元素":"精神属性","念力玄兽":"精神属性","心灵幻蝶":"精神属性","梦游兽":"精神属性","时光蝶":"时间属性","岁月狼":"时间属性","虚空魔狼":"空间属性","次元兽":"空间属性","人面魔蛛":"木属性","赤焰鬼虎":"火属性","铁甲鳞兽":"土属性","赤焰狮王":"火属性","冰碧蝎(幼体)":"冰属性","独角蛮牛":"土属性","疾风魔豹":"木属性","赤甲火兽":"火属性","九毒雾蛇":"木属性","寒水玄蛟":"冰属性","圣光灵鹿":"光属性","虚空魔蝠":"空间属性","时空裂狼":"空间属性","岁月兽":"时间属性","时光天鹅":"时间属性","空间龙牙兽":"空间属性","虚无噬鲲":"空间属性","泰坦巨猿":"土属性","天青牛蟒":"火属性","暗魔邪神虎":"暗属性","三眼金猊":"空间属性","冰碧帝皇蝎":"冰属性","黄金玳瑁":"金属性","赤甲火龙":"火属性","紫雷魔狼":"火属性","骸骨邪龙":"暗属性","玄金狮王":"金属性","沧海玄鲲":"水属性","泰坦巨猿王":"土属性","天青牛蟒神":"火属性","十万年暗魔邪神虎":"暗属性","人面魔蛛皇":"暗属性","邪魔虎鲸王":"暗属性","魔魂大白鲨王":"暗属性","冰碧蝎王":"冰属性","金眼黑龙王":"暗属性","赤甲龙皇":"火属性","紫雷魔狼王":"火属性","黄金玳瑁王":"金属性","三眼金猊王":"空间属性","光明神龙":"光属性","百炼金刚":"金属性","金眼黑龙王·帝天":"暗属性","翡翠天鹅·碧姬":"光属性","妖眼魔树·万妖王":"木属性","暗金恐爪熊王·熊君":"暗属性","三头赤魔獒·赤王":"火属性","冰碧帝皇蝎·冰帝":"冰属性","冰天雪女·雪帝":"冰属性","邪眼暴君主宰·邪帝":"精神属性","忘川幽灵":"精神属性","极玄冰兽":"冰属性","紫姬·魔后":"暗属性","金刚貔貅":"金属性","光明天使":"光属性","暴力棕熊":"土属性","钢铁甲龟":"土属性","光辉圣鹿":"光属性","寒冰蝰蛇":"冰属性","炎火狂狼":"火属性","水晶水獭":"水属性","雷云玄豹":"雷属性","岩土幽鼠":"土属性","噬魔花蝶":"木属性","幻影蝠":"精神属性","巨力玄猿":"土属性","玄甲岩犀":"土属性","圣音灵雀":"光属性","玄冰碧虎":"冰属性","炽焰蛮牛":"火属性","苍浪玄蛟":"水属性","紫雷神猿":"雷属性","金翅神鹰":"金属性","圣光冠雀":"光属性","双头灵蜥":"精神属性","铁背地龙":"金属性","食人花妖":"木属性","海马圣兽":"水属性","碧波玄龟":"水属性","烈火杏娇疏":"火属性","大力金刚熊":"金属性","玄冰玉螈":"冰属性","蓝电霸王龙(幼体)":"雷属性","尖尾雨燕":"木属性","光明女神蝶(幼体)":"光属性","幽冥灵猫":"暗属性","灵眸兽":"精神属性","噬魂蛛":"精神属性","幻心狐":"精神属性","混沌精":"空间属性","狂暴猛犸":"土属性","影风玄雕":"木属性","极光灵猴":"精神属性","玄山刚龟":"土属性","圣树灵驹":"木属性","寒锋冰狼":"冰属性","炎啸狂狮":"火属性","碧磷蝎王":"木属性","玄金鳞蛇":"金属性","旋风裂隼":"木属性","金刚虎王":"金属性","噬魂蛛皇":"木属性","魔魂大白鲨":"水属性","空间撕裂兽":"空间属性","时间沙漏兽":"时间属性","十首火凤凰":"火属性","饕餮神牛":"土属性","冰天雪女":"冰属性","紫霄神雷兽":"雷属性","风之精灵王":"木属性","六翼天使":"光属性","死亡蛛皇":"暗属性","轮回天眼兽":"精神属性","心魔瞳兽":"精神属性","夺魄玄鹤":"精神属性","混沌兽":"空间属性","霸王战猿":"土属性","青风猛虎":"木属性","精神龙王":"空间属性","镇殿玄龟":"土属性","圣光天鹅":"光属性","冰雪天女":"冰属性","炎凰":"火属性","震雷麒麟":"雷属性","灵渊九尾狐":"精神属性","黄金圣龙":"光属性","千毒木王":"木属性","狂铁血豹":"金属性","混沌噬":"空间属性","金刚圣龙":"金属性","白金比蒙":"金属性","世界树守卫":"木属性","翡翠天鹅":"光属性","深海魔鲸王":"水属性","涅槃凤凰":"火属性","烈焰焚天牛":"火属性","大地之王":"土属性","雪帝":"冰属性","冰极霜灭龙":"冰属性","雷霆夔牛":"雷属性","风神·千羽":"木属性","光明圣龙":"光属性","神圣天使":"光属性","黑暗圣龙":"暗属性","堕天使":"暗属性","终焉暗龙":"暗属性","摄魂铃魔":"精神属性","梦貘":"精神属性","破念明王":"精神属性","混沌古龙":"空间属性","天诛剑灵":"空间属性","虚空古龙":"空间属性","时空之主":"空间属性","岁月守护者":"时间属性","时光沙漏兽":"时间属性","空间之王":"空间属性","次元神兽":"空间属性","时光古龙":"时间属性","古冰神兽":"冰属性","炼狱神皇":"火属性","苍海神蛟":"水属性","泰山兽":"土属性","九天雷神兽":"雷属性","大光明神龙":"光属性","冥渊神帝":"暗属性","百毒神木":"木属性","混沌天地":"空间属性","混沌时空龙":"空间属性","玄水玄武龟":"水属性","蓝海兽王":"水属性","极寒鲸鳄":"水属性","沧龙君":"水属性","神水天蛇":"水属性","岁月蝶":"时间属性","逆光纪":"时间属性","永恒钟魂":"时间属性","轮回盘":"时间属性","光明神鹤":"光属性","日耀天马":"光属性","百炼钢君":"金属性","五行剑猴":"金属性","镇岳龟猿":"土属性","黄土大神":"土属性","梦幻天蛛":"精神属性","金毛蜥":"金属性","铁臂螳螂":"金属性","铜甲鼠":"金属性","幽冥影猫":"暗属性","黑焰蛇":"暗属性","魔域乌鸦":"暗属性","钢甲犀牛":"金属性","金翅大鹏":"金属性","玄铁剑齿虎":"金属性","黑魔狼":"暗属性","魔云鹫":"暗属性","金纹神蟒":"金属性","白金圣虎":"金属性","刚烈熊":"金属性","金晶麒麟":"金属性","玄铁巨龙":"金属性","金刚不坏熊":"金属性","金角巨兽":"金属性","五行剑圣":"金属性","太上金身":"金属性"};
export function localBeastElement(element,name){const known=new Set(['雷属性','金属性','木属性','水属性','火属性','土属性','冰属性','光属性','暗属性','时间属性','空间属性','精神属性']);const explicit=normalizeBeastAttribute(element);if(known.has(explicit))return explicit;const species=normalizeBeastAttribute(localBeastElements[name]);if(known.has(species))return species;return normalizeBeastAttribute(inferElementFromName(name||''));}

export function localPendingLawChoices(level:number,dt:any){const earned=Math.min(27,Math.max(0,Math.floor((level-100)/2)));const claimed=['time','space','gold','wood','water','fire','earth','light','dark'].reduce((sum,k)=>sum+(dt?.lawFragments?.[k]||0)+(dt?.lawsFused?.[k]?3:0),0);return Math.max(0,earned-claimed);}

export function dragonAttributeSources(p:any){
 const active=p?.martialSoul&&['金龙王','银龙王'].includes(p.martialSoul.name)||p?.isTwinSoul&&['金龙王','银龙王'].includes(p.secondSoul?.name);if(!active)return null;
 const bones=p.divineArmor?.hasArmor&&p.divineArmor.sourceBones?Object.values(p.divineArmor.sourceBones).filter((b:any)=>b?.type==='soulBone'):Object.values(p.soulBones||{}).filter((b:any)=>b?.type==='soulBone');
 const souls=[{soul:p.martialSoul,rings:p.soulRings||[],secondary:false},...(p.isTwinSoul&&p.secondSoul?[{soul:p.secondSoul,rings:p.secondSoulRings||[],secondary:true}]:[])].map(x=>({...x,extreme:extremeMultipliers(x.soul.extremeAttribute||'',x.secondary),resonance:calcAttributeBonus(x.soul.element||getSoulElement(x.soul.name),x.rings,bones,{extremeAttribute:x.soul.extremeAttribute})}));
 const b=bloodlineBonuses(p),g=goldBloodBonuses(p),v=silverBonuses(p),a=armorBonuses(p);
 return {twin:twinBonuses(p),souls,bones,blood:{attack:b.attack+g.attack,defense:b.defense+v.defense,speed:b.speed+v.speed,spirit:v.spirit,hp:b.hp+g.hp+v.hp,mana:b.mana+v.mana},skill:{gold:b.skill,silver:v.skill},armor:a};
}
