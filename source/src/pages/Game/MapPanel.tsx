import DragonValleyPanel from './DragonValleyPanel';
import AbyssFrontierPanel from './AbyssFrontierPanel';
import SweepSettings from './SweepSettings';
import { formatNumber } from '@/lib/utils';
import type { SweepFilterSummary } from '@/lib/sweepFilter';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Search, Swords, SkipForward, Lock, Zap, AlertTriangle, Trophy, Star, Coins, Crown, GraduationCap, Shield, Users, ChevronRight, UserCog, Sparkles, BookOpen, Snowflake, Ghost, Flower2, Leaf, Gift, Sparkles as SparklesIcon, X } from 'lucide-react';
import {
  useGame, RING_COLOR_MAP, RING_DISPLAY_COLOR, type ISoulRing,
  ARENA_RANK_LABEL, getTotalArenaStars, getArenaRankFromTotal,
  type ArenaRank, MENTOR_TEACHERS, type IMentorTeacher, getMaxRings,
  normalizeBeastAttribute, inferElementFromName,
} from '@/lib/gameStore';
import { generateBeastInstance, generateBeastByYearRange, getRingQualityFromYears, rollSoulBoneDrop, type ISoulBeastSpecies, getBeastStatsByYears, getBeastSpeciesByName } from '@/data/soulbeasts';
import { SEA_GOD_MEMBERS, SEA_GOD_POSITION_TITLE, calcSeaGodMemberStats, type ISeaGodMember } from '@/data/seaGodPavilion';
import { FIERCE_BEASTS_STAR_LAKE, FIERCE_BEASTS_FROZEN, type FierceBeast } from '@/data/fierceBeasts';
import { rollMaterialWithQuality, getMaterialsByTier, formatYearsLabel, MATERIAL_QUALITY_INFO, ICE_FIRE_IMMORTAL_GRASSES, HOLY_GRASSES, getConsumableExtra, type IItem } from '@/data/items';
import { SOUL_SPIRIT_POOL } from '@/data/soulSpirits';
import { TEA_CITY_NODES, TEA_CITY_CHARACTERS, type TeaCityCharacter, type TeaCityNode } from '@/data/teaCity';
import { toast } from 'sonner';
import SoulRing from '@/components/SoulRing';
import TianmengSacrificeDialog from '@/components/TianmengSacrificeDialog';
import { scopedStorage, logger } from '@lark-apaas/client-toolkit-lite';

type MapView = 'dragonValley' | 'abyssFrontier' | 'bigMap' | 'starForest' | 'starForestZone' | 'starForestDungeons' | 'sun-mountains' | 'mountain-dungeons' | 'exploration' | 'attribute-select' | 'shrekAcademy' | 'freshman' | 'freshTasks' | 'exam' | 'outerCourt' | 'arena' | 'innerCourt' | 'mentorship' | 'seaGodPavilion' | 'beiji' | 'beijiZone' | 'beijiDungeons' | 'beijiCore' | 'lifeLake' | 'spiritTower' | 'teaCity' | 'iceFireEye' | 'iceFireExplore';

interface IceFireDrop {
  type: 'immortal' | 'spirit' | 'coin' | 'soulbone';
  name: string;
  desc: string;
  color: string;
  iconChar: string;
  item?: IItem;
}

interface ForestZone {
  id: 'outer' | 'middle' | 'inner' | 'core' | 'life-lake' | 'million-year';
  name: string;
  description: string;
  yearsDesc: string;
  staminaCost: number;
  unlockLevel: number;
  locked: boolean;
  lockedMsg?: string;
  /** 是否为百万年专属区域（需选属性后进入） */
  isMillionYear?: boolean;
}

const FOREST_ZONES: ForestZone[] = [
  { id: 'outer', name: '外围', description: '星斗大森林最外层区域，魂兽实力较弱，适合初阶魂师。', yearsDesc: '魂兽年限：10年~999年（十年/百年魂兽），偶尔会遇到千年魂兽。', staminaCost: 10, unlockLevel: 1, locked: false },
  { id: 'middle', name: '中部', description: '星斗大森林中层区域，魂兽实力中等，适合已有一定修为的魂师。', yearsDesc: '魂兽年限：1000年~9999年（千年魂兽为主，偶尔遇到低阶万年魂兽）。', staminaCost: 15, unlockLevel: 1, locked: false },
  { id: 'inner', name: '内圈', description: '星斗大森林内层区域，魂兽实力强大，万年魂兽横行。', yearsDesc: '魂兽年限：10000年~99999年（低阶万年到高阶万年魂兽），偶尔会遇到十万年魂兽。', staminaCost: 50, unlockLevel: 1, locked: false },
  { id: 'core', name: '核心区', description: '星斗大森林核心腹地，十万年魂兽盘踞的绝对禁区。', yearsDesc: '魂兽年限：十万年以上 · 六节点探索猎取高阶魂环', staminaCost: 200, unlockLevel: 1, locked: false },
  { id: 'life-lake', name: '生命之湖', description: '星斗大森林的生命核心，十大凶兽栖息之地，帝天等凶兽之王的居所。', yearsDesc: '十大凶兽榜 · 挑战可获灵草仙草生命之水', staminaCost: 0, unlockLevel: 1, locked: false },
  { id: 'million-year', name: '百万年秘境', description: '星斗大森林最深处的禁忌之地，栖息着超越凡俗的百万年魂兽。唯有封号斗罗级别的强者，方有资格踏足其中。', yearsDesc: '魂兽年限：100万年 ~ 999万年 · 属性可选 · 6节点探索', staminaCost: 300, unlockLevel: 90, locked: false, isMillionYear: true },
];

// v2.0 星斗大森林副本配置：每个区域3个年限副本
interface ForestDungeon {
  id: string;
  name: string;
  yearsDesc: string;
  staminaCost: number;
  unlockLevel: number;
  yearMin: number;
  yearMax: number;
  rareChance: number; // 小概率碰到更高年限魂兽的概率
  rareBoostMin: number; // 稀有提升下限倍率
  rareBoostMax: number; // 稀有提升上限倍率
}

const FOREST_DUNGEONS: Record<string, ForestDungeon[]> = {
  outer: [
    { id: 'o1', name: '十年魂兽集聚地', yearsDesc: '魂兽年限：10年 ~ 99年', staminaCost: 8, unlockLevel: 1, yearMin: 10, yearMax: 99, rareChance: 0.05, rareBoostMin: 2, rareBoostMax: 5 },
    { id: 'o2', name: '百年魂兽聚集地', yearsDesc: '魂兽年限：100年 ~ 500年', staminaCost: 12, unlockLevel: 1, yearMin: 100, yearMax: 500, rareChance: 0.05, rareBoostMin: 2, rareBoostMax: 4 },
    { id: 'o3', name: '高阶百年猎场', yearsDesc: '魂兽年限：500年 ~ 1200年', staminaCost: 18, unlockLevel: 1, yearMin: 500, yearMax: 1200, rareChance: 0.08, rareBoostMin: 2, rareBoostMax: 3 },
  ],
  middle: [
    { id: 'm1', name: '低阶千年秘境', yearsDesc: '魂兽年限：1000年 ~ 3000年', staminaCost: 15, unlockLevel: 1, yearMin: 1000, yearMax: 3000, rareChance: 0.08, rareBoostMin: 2, rareBoostMax: 3 },
    { id: 'm2', name: '中阶千年秘境', yearsDesc: '魂兽年限：3000年 ~ 6000年', staminaCost: 20, unlockLevel: 1, yearMin: 3000, yearMax: 6000, rareChance: 0.08, rareBoostMin: 1.5, rareBoostMax: 2.5 },
    { id: 'm3', name: '高阶千年秘境', yearsDesc: '魂兽年限：6000年 ~ 9999年', staminaCost: 25, unlockLevel: 1, yearMin: 6000, yearMax: 9999, rareChance: 0.10, rareBoostMin: 1.5, rareBoostMax: 2 },
  ],
  inner: [
    { id: 'i1', name: '低阶万年猎场', yearsDesc: '魂兽年限：1万年 ~ 3万年', staminaCost: 40, unlockLevel: 1, yearMin: 10000, yearMax: 30000, rareChance: 0.08, rareBoostMin: 2, rareBoostMax: 3 },
    { id: 'i2', name: '中阶万年猎场', yearsDesc: '魂兽年限：3万年 ~ 6万年', staminaCost: 55, unlockLevel: 1, yearMin: 30000, yearMax: 60000, rareChance: 0.10, rareBoostMin: 1.5, rareBoostMax: 2.5 },
    { id: 'i3', name: '高阶万年猎场', yearsDesc: '魂兽年限：6万年 ~ 9.9万年', staminaCost: 70, unlockLevel: 1, yearMin: 60000, yearMax: 99000, rareChance: 0.10, rareBoostMin: 1.2, rareBoostMax: 2 },
  ],
   core: [
     { id: 'c1', name: '十万年边缘', yearsDesc: '魂兽年限：10万年 ~ 20万年', staminaCost: 150, unlockLevel: 1, yearMin: 100000, yearMax: 200000, rareChance: 0.08, rareBoostMin: 1.5, rareBoostMax: 2.5 },
     { id: 'c2', name: '二十万年腹地', yearsDesc: '魂兽年限：20万年 ~ 50万年', staminaCost: 250, unlockLevel: 1, yearMin: 200000, yearMax: 500000, rareChance: 0.08, rareBoostMin: 1.3, rareBoostMax: 2 },
     { id: 'c3', name: '五十万年禁区', yearsDesc: '魂兽年限：50万年 ~ 99万年', staminaCost: 400, unlockLevel: 1, yearMin: 500000, yearMax: 990000, rareChance: 0.05, rareBoostMin: 1.1, rareBoostMax: 1.5 },
   ],
   'million-year': [
     { id: 'my1', name: '百万年初境', yearsDesc: '魂兽年限：100万年 ~ 200万年', staminaCost: 300, unlockLevel: 90, yearMin: 1000000, yearMax: 2000000, rareChance: 0.10, rareBoostMin: 1.2, rareBoostMax: 1.5 },
     { id: 'my2', name: '二百万年秘境', yearsDesc: '魂兽年限：200万年 ~ 400万年', staminaCost: 500, unlockLevel: 92, yearMin: 2000000, yearMax: 4000000, rareChance: 0.08, rareBoostMin: 1.2, rareBoostMax: 1.5 },
     { id: 'my3', name: '四百万年圣境', yearsDesc: '魂兽年限：400万年 ~ 700万年', staminaCost: 800, unlockLevel: 95, yearMin: 4000000, yearMax: 7000000, rareChance: 0.06, rareBoostMin: 1.2, rareBoostMax: 1.4 },
   ],
 };

// 极北之地：4个区域
interface BeijiZone {
  id: 'outer' | 'middle' | 'inner' | 'core';
  name: string;
  description: string;
  yearsDesc: string;
  staminaCost: number;
  unlockLevel: number;
  locked: boolean;
  lockedMsg?: string;
  isFierceBeast?: boolean; // 核心区为凶兽区域
}

const BEIJI_ZONES: BeijiZone[] = [
  { id: 'outer', name: '冰原外围', description: '极北之地的最外层，风雪交加，冰属性魂兽出没。', yearsDesc: '魂兽年限：十年~千年（冰属性低阶魂兽）', staminaCost: 12, unlockLevel: 1, locked: false },
  { id: 'middle', name: '极寒深渊', description: '深入极北腹地，寒气刺骨，中高阶冰属性魂兽横行。', yearsDesc: '魂兽年限：千年~万年（冰属性中阶魂兽）', staminaCost: 20, unlockLevel: 1, locked: false },
  { id: 'inner', name: '雪帝领地外围', description: '接近极北核心，传说中的雪帝势力范围，万年冰兽盘踞。', yearsDesc: '魂兽年限：万年~十万年（高阶冰属性魂兽）', staminaCost: 60, unlockLevel: 1, locked: false },
  { id: 'core', name: '极寒冰域', description: '极北之地的核心禁区，四大凶兽栖息之地，有进无回。', yearsDesc: '凶兽：雪帝（70万年）、冰帝（40万年）、小白（30万年）、冰凰（35万年）', staminaCost: 200, unlockLevel: 1, locked: false, isFierceBeast: true },
];

// v2.0 极北之地副本配置：每个区域3个年限副本（核心区为凶兽挑战，不做副本式）
interface BeijiDungeon {
  id: string;
  name: string;
  yearsDesc: string;
  staminaCost: number;
  unlockLevel: number;
  yearMin: number;
  yearMax: number;
  rareChance: number;
  rareBoostMin: number;
  rareBoostMax: number;
}

const BEIJI_DUNGEONS: Record<string, BeijiDungeon[]> = {
  outer: [
    { id: 'bo1', name: '十年冰兽集聚地', yearsDesc: '冰属性魂兽：10年 ~ 99年', staminaCost: 8, unlockLevel: 1, yearMin: 10, yearMax: 99, rareChance: 0.05, rareBoostMin: 2, rareBoostMax: 5 },
    { id: 'bo2', name: '百年冰兽聚集地', yearsDesc: '冰属性魂兽：100年 ~ 500年', staminaCost: 12, unlockLevel: 1, yearMin: 100, yearMax: 500, rareChance: 0.05, rareBoostMin: 2, rareBoostMax: 4 },
    { id: 'bo3', name: '高阶百年冰原', yearsDesc: '冰属性魂兽：500年 ~ 1200年', staminaCost: 18, unlockLevel: 1, yearMin: 500, yearMax: 1200, rareChance: 0.08, rareBoostMin: 2, rareBoostMax: 3 },
  ],
  middle: [
    { id: 'bm1', name: '低阶千年秘境', yearsDesc: '冰属性魂兽：1000年 ~ 3000年', staminaCost: 15, unlockLevel: 1, yearMin: 1000, yearMax: 3000, rareChance: 0.08, rareBoostMin: 2, rareBoostMax: 3 },
    { id: 'bm2', name: '中阶千年秘境', yearsDesc: '冰属性魂兽：3000年 ~ 7000年', staminaCost: 20, unlockLevel: 1, yearMin: 3000, yearMax: 7000, rareChance: 0.08, rareBoostMin: 1.5, rareBoostMax: 2.5 },
    { id: 'bm3', name: '高阶千年秘境', yearsDesc: '冰属性魂兽：7000年 ~ 10000年', staminaCost: 25, unlockLevel: 1, yearMin: 7000, yearMax: 9999, rareChance: 0.10, rareBoostMin: 1.5, rareBoostMax: 2 },
  ],
  inner: [
    { id: 'bi1', name: '低阶万年猎场', yearsDesc: '冰属性魂兽：1万年 ~ 3万年', staminaCost: 40, unlockLevel: 1, yearMin: 10000, yearMax: 30000, rareChance: 0.08, rareBoostMin: 2, rareBoostMax: 3 },
    { id: 'bi2', name: '中阶万年猎场', yearsDesc: '冰属性魂兽：3万年 ~ 6万年', staminaCost: 55, unlockLevel: 1, yearMin: 30000, yearMax: 60000, rareChance: 0.10, rareBoostMin: 1.5, rareBoostMax: 2.5 },
    { id: 'bi3', name: '高阶万年猎场', yearsDesc: '冰属性魂兽：6万年 ~ 10万年', staminaCost: 70, unlockLevel: 1, yearMin: 60000, yearMax: 99000, rareChance: 0.10, rareBoostMin: 1.2, rareBoostMax: 2 },
  ],
};

// 日月山脉：9级区域
interface MountainZone {
  id: string; // 'mountain-1' ~ 'mountain-9'
  name: string;
  level: number; // 1~9
  description: string;
  yearsDesc: string;
  staminaCost: number;
  unlockLevel: number; // 进入所需等级
  beastTier: 'outer' | 'middle' | 'inner' | 'core' | 'life-lake'; // 映射到魂兽池
  locked: boolean;
  lockedMsg?: string;
}

const MOUNTAIN_ZONES: MountainZone[] = [
  { id: 'mountain-1', name: '日月山脉·一段', level: 1, description: '日月山脉最外围的丘陵地带，低阶魂兽出没。', yearsDesc: '魂兽年限：十年~百年', staminaCost: 5, unlockLevel: 1, beastTier: 'outer', locked: false },
  { id: 'mountain-2', name: '日月山脉·二段', level: 2, description: '山势渐起，百年魂兽开始增多。', yearsDesc: '魂兽年限：百年~千年', staminaCost: 8, unlockLevel: 1, beastTier: 'middle', locked: false },
  { id: 'mountain-3', name: '日月山脉·三段', level: 3, description: '千年魂兽的领地，山中蕴藏丰富矿产。', yearsDesc: '魂兽年限：千年为主', staminaCost: 10, unlockLevel: 1, beastTier: 'middle', locked: false },
  { id: 'mountain-4', name: '日月山脉·四段', level: 4, description: '万年魂兽开始出现，山中灵气渐浓。', yearsDesc: '魂兽年限：万年~几万年', staminaCost: 12, unlockLevel: 1, beastTier: 'inner', locked: false },
  { id: 'mountain-5', name: '日月山脉·五段', level: 5, description: '高阶万年魂兽横行，材料稀有。', yearsDesc: '魂兽年限：几万年~十万年', staminaCost: 15, unlockLevel: 1, beastTier: 'inner', locked: false },
  { id: 'mountain-6', name: '日月山脉·六段', level: 6, description: '十万年魂兽的领地，极其危险。', yearsDesc: '魂兽年限：十万年以上', staminaCost: 18, unlockLevel: 1, beastTier: 'core', locked: false },
  { id: 'mountain-7', name: '日月山脉·七段', level: 7, description: '山脉深处，凶兽出没之地。', yearsDesc: '魂兽年限：十万年~几十万年', staminaCost: 20, unlockLevel: 1, beastTier: 'core', locked: false },
  { id: 'mountain-8', name: '日月山脉·八段', level: 8, description: '接近山巅，传说中的禁地。', yearsDesc: '魂兽年限：几十万年以上', staminaCost: 25, unlockLevel: 1, beastTier: 'core', locked: false },
  { id: 'mountain-9', name: '日月山脉·九段', level: 9, description: '山脉之巅，神级魂兽的传说之地。', yearsDesc: '魂兽年限：神级以下至强', staminaCost: 30, unlockLevel: 1, beastTier: 'life-lake', locked: false },
];

// 材料品阶（每个山脉等级内的材料分普通/精良/稀有）
// 稀有概率已提升，保证玩家更容易刷到稀有材料
const DUNGEON_QUALITY = {
  common: { label: '普通', color: '#94a3b8', chance: 0.5 },
  fine:   { label: '精良', color: '#22c55e', chance: 0.3 },
  rare:   { label: '稀有', color: '#60a5fa', chance: 0.2 },
};
type DungeonQuality = keyof typeof DUNGEON_QUALITY;

interface DungeonDrop {
  matId: string;
  matName: string;
  iconChar: string;
  quality: DungeonQuality;
  qualityColor: string;
  tier: number;
}

interface MountainDungeon {
  id: string;
  name: string;
  mountainLevel: number; // 1~9
  beastName: string;
  beastYears: number;
  beastAttr: string;
  beastTier: 'outer' | 'middle' | 'inner' | 'core' | 'life-lake';
  drops: DungeonDrop[]; // 3~4 种
  coinReward: number;
  staminaCost: number;
  description: string;
}

 // 每级山脉 4 个副本，每个副本 4~5 种材料，11 种材料全覆盖，通用材料每个副本必出
// 材料类型索引：0=attack 攻击 1=defense 防御 2=speed 速度 3=spirit 精神 4=critRate 暴击率 5=critDmg 爆伤 6=allAttr 全属性 7=soulPower 魂力 8=hp 气血 9=core 核心 10=universal 通用
const DUNGEON_MATERIAL_PLAN: number[][] = [
  [0, 1, 4, 9, 10],    // 副本1：攻+防+暴+核+通
  [2, 3, 8, 10],       // 副本2：速+精+血+通
  [0, 6, 9, 10],       // 副本3：攻+全+核+通
  [4, 5, 7, 8, 10],    // 副本4：暴+伤+魂+血+通
];
// 材料名称/图标/索引对应（0~10 共11种）
const MATERIAL_META: { name: string; icon: string }[] = [
  { name: '攻击系', icon: '攻' },  // 0 - attack
  { name: '防御系', icon: '防' },  // 1 - defense
  { name: '速度系', icon: '速' },  // 2 - speed
  { name: '精神系', icon: '精' },  // 3 - spirit
  { name: '暴击系', icon: '暴' },  // 4 - critRate
  { name: '爆伤系', icon: '伤' },  // 5 - critDmg
  { name: '全属性系', icon: '全' },  // 6 - allAttr
  { name: '魂力系', icon: '魂' },  // 7 - soulPower
  { name: '气血系', icon: '血' },  // 8 - hp
  { name: '魂导核心', icon: '核' },  // 9 - core
  { name: '通用材料', icon: '通' },  // 10 - universal
];

// MATERIAL_META 索引 → items.ts 材料 ID 后缀数字的映射表
// items.ts 中 mat-X-1=攻击, mat-X-2=暴击率, mat-X-3=爆伤, mat-X-4=全属性, mat-X-5=魂力, mat-X-6=气血, mat-X-7=核心, mat-X-8=通用, mat-X-9=防御, mat-X-10=速度, mat-X-11=精神
const META_IDX_TO_MAT_SUFFIX: number[] = [1, 9, 10, 11, 2, 3, 4, 5, 6, 7, 8];

// 每级山脉副本的兽名/属性/奖励配置
const DUNGEON_THEMES: Record<number, { beasts: { name: string; attr: string; years: number }[]; names: string[]; baseCoin: number; baseStamina: number; tier: 'outer' | 'middle' | 'inner' | 'core' | 'life-lake' }> = {
  1: { tier: 'outer', baseCoin: 300, baseStamina: 5,
    names: ['铁矿洞', '密林溪谷', '岩石裂隙', '风狼谷'],
    beasts: [
      { name: '铁甲猪', attr: '土属性', years: 40 },
      { name: '毒蛇', attr: '木属性', years: 60 },
      { name: '岩蚁后', attr: '土属性', years: 80 },
      { name: '风狼', attr: '木属性', years: 90 },
    ],
  },
  2: { tier: 'outer', baseCoin: 600, baseStamina: 8,
    names: ['钢岩峭壁', '冰火洞', '百兽岭', '玉髓谷'],
    beasts: [
      { name: '钢岩熊', attr: '土属性', years: 200 },
      { name: '冰焰蟒', attr: '冰属性', years: 500 },
      { name: '青风虎', attr: '木属性', years: 700 },
      { name: '玉面狐', attr: '精神属性', years: 800 },
    ],
  },
  3: { tier: 'middle', baseCoin: 1500, baseStamina: 10,
    names: ['寒铁深渊', '紫晶洞', '极地冰原', '火山口'],
    beasts: [
      { name: '冰甲龙', attr: '冰属性', years: 1500 },
      { name: '紫晶蝎', attr: '木属性', years: 3000 },
      { name: '极冰豹', attr: '冰属性', years: 5000 },
      { name: '炎火龙', attr: '火属性', years: 8000 },
    ],
  },
  4: { tier: 'inner', baseCoin: 4000, baseStamina: 12,
    names: ['玄铁秘境', '剑林', '雷泽', '神玉谷'],
    beasts: [
      { name: '玄铁龙', attr: '金属性', years: 12000 },
      { name: '剑齿虎王', attr: '金属性', years: 20000 },
      { name: '雷霆兽', attr: '火属性', years: 40000 },
      { name: '神玉麒麟', attr: '光属性', years: 60000 },
    ],
  },
  5: { tier: 'inner', baseCoin: 10000, baseStamina: 15,
    names: ['陨星坑', '龙墓', '雷狱', '星核秘境'],
    beasts: [
      { name: '陨星巨兽', attr: '光属性', years: 120000 },
      { name: '骨龙', attr: '暗属性', years: 150000 },
      { name: '雷狱守卫', attr: '火属性', years: 200000 },
      { name: '星核之灵', attr: '空间属性', years: 300000 },
    ],
  },
  6: { tier: 'core', baseCoin: 25000, baseStamina: 18,
    names: ['太阳神殿', '太阴寒渊', '凶兽王庭', '神识之海'],
    beasts: [
      { name: '金乌', attr: '火属性', years: 400000 },
      { name: '月神鹿', attr: '冰属性', years: 500000 },
      { name: '凶兽王', attr: '暗属性', years: 600000 },
      { name: '神识巨兽', attr: '精神属性', years: 700000 },
    ],
  },
  7: { tier: 'core', baseCoin: 50000, baseStamina: 20,
    names: ['天帝战场', '不灭殿', '不死火山', '轮回之地'],
    beasts: [
      { name: '天帝虚影', attr: '光属性', years: 750000 },
      { name: '金神', attr: '金属性', years: 800000 },
      { name: '不死凤凰', attr: '火属性', years: 850000 },
      { name: '轮回兽', attr: '精神属性', years: 900000 },
    ],
  },
  8: { tier: 'core', baseCoin: 90000, baseStamina: 25,
    names: ['诛仙剑冢', '创世莲池', '太上道宫', '时光长河'],
    beasts: [
      { name: '诛仙剑灵', attr: '金属性', years: 950000 },
      { name: '创世青莲', attr: '木属性', years: 960000 },
      { name: '太上道祖虚影', attr: '光属性', years: 980000 },
      { name: '时光之灵', attr: '时间属性', years: 990000 },
    ],
  },
  9: { tier: 'life-lake', baseCoin: 180000, baseStamina: 30,
    names: ['神王祭坛', '审判之殿', '寂灭雷海', '神界之心'],
    beasts: [
      { name: '神王残魂', attr: '光属性', years: 1100000 },
      { name: '审判天使', attr: '光属性', years: 1200000 },
      { name: '寂灭雷神', attr: '火属性', years: 1500000 },
      { name: '神界守护兽', attr: '光属性', years: 2000000 },
    ],
  },
};

// 生成全部山脉副本
const MOUNTAIN_DUNGEONS: MountainDungeon[] = (() => {
  const result: MountainDungeon[] = [];
  for (let tier = 1; tier <= 9; tier++) {
    const theme = DUNGEON_THEMES[tier];
    for (let d = 0; d < 4; d++) {
      const matIdxs = DUNGEON_MATERIAL_PLAN[d];
      const tierMaterials = getMaterialsByTier(tier);
      const drops: DungeonDrop[] = matIdxs.map((mi, idx) => {
        // 品质分配：第一个 common，最后一个 rare，中间 fine
        // 通用材料(索引10)固定为 fine 品质，保证基础掉率充足
        let quality: 'common' | 'fine' | 'rare' = 'common';
        if (mi === 10) {
          quality = 'fine'; // 通用材料固定精良品质，玩家容易获得
        } else if (idx === matIdxs.length - 1) {
          quality = 'rare';
        } else if (idx === Math.floor(matIdxs.length / 2)) {
          quality = 'fine';
        }
        // 用映射表把 MATERIAL_META 索引转成正确的材料 ID 后缀
        const matSuffix = META_IDX_TO_MAT_SUFFIX[mi] ?? (mi + 1);
        const matId = `mat-${tier}-${matSuffix}`;
        // 从材料库找真实名称（保证副本介绍显示的材料名 = 实际掉落的材料名）
        const matDef = tierMaterials.find(m => m.id === matId);
        const matName = matDef ? matDef.name : `${tier}级${MATERIAL_META[mi].name}材料`;
        const iconChar = matDef ? matDef.iconChar : MATERIAL_META[mi].icon;
        return {
          matId,
          matName,
          iconChar,
          quality,
          qualityColor: DUNGEON_QUALITY[quality].color,
          tier,
        };
      });
      result.push({
        id: `dun-${tier}-${d + 1}`,
        name: theme.names[d],
        mountainLevel: tier,
        beastName: theme.beasts[d].name,
        beastYears: theme.beasts[d].years,
        beastAttr: theme.beasts[d].attr,
        beastTier: theme.tier,
        drops,
        coinReward: theme.baseCoin + d * Math.floor(theme.baseCoin * 0.2),
        staminaCost: theme.baseStamina + d * Math.floor(theme.baseStamina * 0.15),
        description: `${theme.beasts[d].attr}${theme.beasts[d].name}盘踞之地。`,
      });
    }
  }
  return result;
})();

interface EncounterBeast {
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
  speciesId: string;
  element?: string;
  description?: string;
}

interface ExplorationNode {
  id: number;
  searched: boolean;
  beast?: EncounterBeast | null;
}

// === 新生任务配置 ===
interface FreshTask {
  id: string;
  name: string;
  description: string;
  expReward: number;
  coinReward: number;
  target: number; // 目标次数/等级等
  type: 'click' | 'level';
}

const FRESH_TASKS: FreshTask[] = [
  { id: 'fresh-1', name: '初识魂力', description: '感受体内魂力的流动，完成一次基础修炼。', expReward: 50, coinReward: 1000, target: 1, type: 'click' },
  { id: 'fresh-2', name: '体能训练', description: '进行基础体能训练，强化身体素质。', expReward: 120, coinReward: 2000, target: 3, type: 'click' },
  { id: 'fresh-3', name: '魂技入门', description: '学习释放第一魂技的基本要领。', expReward: 300, coinReward: 3000, target: 5, type: 'click' },
  { id: 'fresh-4', name: '猎杀十年魂兽', description: '独立猎杀一只十年魂兽，证明自己的实力。', expReward: 600, coinReward: 5000, target: 10, type: 'click' },
  { id: 'fresh-5', name: '境界突破', description: '突破至魂师境界（10级）。', expReward: 1000, coinReward: 8000, target: 10, type: 'level' },
  { id: 'fresh-6', name: '精英新生', description: '成为新生中的佼佼者，完成最终试炼。', expReward: 2000, coinReward: 15000, target: 20, type: 'click' },
];

// === 竞技场对手配置 ===
const ARENA_OPPONENTS = [
  { name: '贝贝', martialSoul: '蓝电霸王龙' },
  { name: '和菜头', martialSoul: '霹雳火' },
  { name: '萧萧', martialSoul: '三生镇魂鼎' },
  { name: '徐三石', martialSoul: '玄冥龟' },
  { name: '江楠楠', martialSoul: '柔骨兔' },
  { name: '马小桃', martialSoul: '邪火凤凰' },
  { name: '戴华斌', martialSoul: '白虎' },
  { name: '朱露', martialSoul: '幽冥灵猫' },
  { name: '崔雅洁', martialSoul: '九尾狐' },
  { name: '霍雨浩', martialSoul: '灵眸' },
];

const ARENA_RANK_COLORS: Record<ArenaRank, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#00e5ff',
  diamond: '#b9f2ff',
  star: '#ff6b9d',
  king: '#ff4757',
};

export default function MapPanel() {
    const {
      player, attributes, consumeStamina, getCurrentStamina, startBattle, setExploration, exploration,
      battleState, lastBattleResult, inBattle, collectExploreItem, collectExploreRing, finishExploration,
      joinShrekAcademy, promoteToOuterCourt, setExamCooldown, addArenaResult, addExp, addCoins, setPlayer, takeMentorGuidance, getMentorCooldown, addPendingSpirit,
      addItem, canTriggerTianmeng, markTianmengTriggered, acceptTianmengSacrifice, rejectTianmengSacrifice,
      exploreTeaNode, acceptTeaFavor, rejectTeaFavor, clearPendingTeaFavor, pendingTeaFavorId, teaNodeCooldowns, giftCompanion,
      pendingFavorBeastId, acceptCompanionFavor, rejectCompanionFavor,
      sweepExplore, getSweepCount, incrementSweepCount,
    } = useGame();

  const [view, setView] = useState<MapView>(lastBattleResult?.locationId==='dragon-valley'?'dragonValley':lastBattleResult?.locationId==='abyss-frontier'&&player?.level>=99?'abyssFrontier':'bigMap');
  useEffect(()=>{if(!inBattle&&lastBattleResult?.locationId==='dragon-valley')setView('dragonValley');if(!inBattle&&lastBattleResult?.locationId==='abyss-frontier'&&player?.level>=99)setView('abyssFrontier');},[inBattle,lastBattleResult]);
  const [currentZone, setCurrentZone] = useState<ForestZone | null>(null);
  const [currentBeijiZone, setCurrentBeijiZone] = useState<BeijiZone | null>(null);
  const [currentMountain, setCurrentMountain] = useState<MountainZone | null>(null);
  const [currentForestDungeon, setCurrentForestDungeon] = useState<ForestDungeon | null>(null);
  const [currentBeijiDungeon, setCurrentBeijiDungeon] = useState<BeijiDungeon | null>(null);
  const [nodes, setNodes] = useState<ExplorationNode[]>([]);
  const [currentNodeIdx, setCurrentNodeIdx] = useState(0);
  const [encounterBeast, setEncounterBeast] = useState<EncounterBeast | null>(null);
  const [showEncounter, setShowEncounter] = useState(false);
  // 🔴 属性选择：进入年限副本后先选属性再探索
  const [attrSelectSource, setAttrSelectSource] = useState<{
    area: 'star-forest' | 'beiji' | 'sun-mountains';
    zoneId?: string;
    dungeonId?: string;
    dungeonYearMin?: number;
    dungeonYearMax?: number;
    dungeonRareChance?: number;
    dungeonRareBoostMin?: number;
    dungeonRareBoostMax?: number;
    staminaCost: number;
    title: string;
  } | null>(null);
  const prevSpiritTowerInBattleRef = useRef(false);
  const [selectedTowerAttr, setSelectedTowerAttr] = useState<string | null>(null);

  // 茶城
  const [selectedTeaNode, setSelectedTeaNode] = useState<TeaCityNode | null>(null);
  const [showTeaFavor, setShowTeaFavor] = useState(false);
  const [exploreResult, setExploreResult] = useState<{ expGained: number; coinGained: number; encounterId?: string } | null>(null);

  // 凶兽青睐：战斗胜利返回后检测 pendingFavorBeastId 并弹窗
  const [showBeastFavor, setShowBeastFavor] = useState(false);
  // 一键扫荡结算弹窗
  const [sweepResult, setSweepResult] = useState<{
    areaKey: string;
    rings: any[];
    items: any[];
    coins: number;
    exp: number;
    beasts: any[];
    filterSummary?: SweepFilterSummary;
  } | null>(null);

  const favorBeast = pendingFavorBeastId
    ? [...FIERCE_BEASTS_STAR_LAKE, ...FIERCE_BEASTS_FROZEN].find(b => b.id === pendingFavorBeastId)
    : undefined;
  useEffect(() => {
    if (pendingFavorBeastId && !inBattle) {
      setShowBeastFavor(true);
    }
  }, [pendingFavorBeastId, inBattle]);
  const handleAcceptBeastFavor = () => {
    if (!pendingFavorBeastId) return;
    const ok = acceptCompanionFavor(pendingFavorBeastId);
    if (ok) toast.success('💖 已接受青睐，结为道侣之缘');
    setShowBeastFavor(false);
  };
  const handleRejectBeastFavor = () => {
    if (pendingFavorBeastId) {
      rejectCompanionFavor(pendingFavorBeastId);
      toast.info('你婉拒了这份青睐');
    }
    setShowBeastFavor(false);
  };

  // 竞技场
  const [arenaMode, setArenaMode] = useState<'single' | 'team'>('single');
  const [arenaResult, setArenaResult] = useState<null | { win: boolean; stars: number; coins: number; rankUp: boolean; rankDown: boolean; beforeRank: ArenaRank; beforeStars: number; afterRank: ArenaRank; afterStars: number; opponent: string }>(null);
  const [arenaTick, setArenaTick] = useState(0); // 触发重渲染冷却显示
  const [examCooldownTick, setExamCooldownTick] = useState(0);
  const [mentorCdTick, setMentorCdTick] = useState(0);

  // 每 1 秒刷新冷却显示（竞技场 + 神考 + 名师指导）
  useEffect(() => {
    const t = setInterval(() => {
      setExamCooldownTick((x) => x + 1);
      setArenaTick((x) => x + 1);
      setMentorCdTick((x) => x + 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // 恢复上次的探索状态（切Tab不丢失）
  useEffect(() => {
    if (exploration && exploration.locationId && nodes.length === 0) {
      if (exploration.areaName === 'star-forest') {
        const zone = FOREST_ZONES.find((z) => z.id === exploration.tier);
        if (zone) {
          setCurrentZone(zone);
          setView('exploration');
          const restored: ExplorationNode[] = exploration.nodes.map((n, i) => ({
            id: i,
            searched: n.completed,
            beast: (n as any).beast || null,
          }));
          setNodes(restored);
          setCurrentNodeIdx(exploration.currentNode);
        }
       } else if (exploration.areaName === 'beiji') {
         const bz = BEIJI_ZONES.find((z) => z.id === exploration.tier?.replace('beiji-', ''));
         if (bz) {
           setCurrentBeijiZone(bz);
           setView('exploration');
           const restored: ExplorationNode[] = exploration.nodes.map((n, i) => ({
             id: i,
             searched: n.completed,
             beast: (n as any).beast || null,
           }));
           setNodes(restored);
           setCurrentNodeIdx(exploration.currentNode);
         }
       } else if (exploration.areaName === 'sun-mountains') {
        const mz = MOUNTAIN_ZONES.find((z) => z.id === exploration.tier);
        if (mz) {
          setCurrentMountain(mz);
          setView('exploration');
          const restored: ExplorationNode[] = exploration.nodes.map((n, i) => ({
            id: i,
            searched: n.completed,
            beast: (n as any).beast || null,
          }));
          setNodes(restored);
          setCurrentNodeIdx(exploration.currentNode);
        }
      }
    }
  }, []);

  // 点击星斗大森林 → 进入区域选择（完全清理日月山脉和极北之地的所有状态）
  const enterStarForest = () => {
    // 完全清理日月山脉和极北之地的所有残留状态
    setCurrentMountain(null);
    setCurrentBeijiZone(null);
    setSelectedDungeon(null);
    if (exploration && exploration.areaName !== 'star-forest') {
      setExploration(null);
      setNodes([]);
      setCurrentNodeIdx(0);
      setEncounterBeast(null);
      setShowEncounter(false);
    }
    setView('starForest');
  };

  const enterShrekAcademy = () => {
    setView('shrekAcademy');
  };

  // 点击极北之地 → 进入区域选择
  const enterBeiji = () => {
    // 清理其他探索状态（星斗、日月山脉）
    if (exploration && exploration.areaName !== 'beiji') {
      setExploration(null);
      setNodes([]);
      setCurrentNodeIdx(0);
      setEncounterBeast(null);
      setShowEncounter(false);
    }
    setCurrentZone(null);
    setCurrentMountain(null);
    setSelectedDungeon(null);
    setView('beiji');
  };

  // 极北之地开始探索（外围/中部/内圈：六节点探索模式）
  const startBeijiExploration = (zone: BeijiZone) => {
    if (!player) return;
    if (zone.locked) {
      toast.error(zone.lockedMsg || '该区域暂不开放');
      return;
    }
    if (player.level < zone.unlockLevel) {
      toast.error(`需要达到 ${zone.unlockLevel} 级才能进入`);
      return;
    }
    const ok = consumeStamina(zone.staminaCost);
    if (!ok) {
      toast.error('体力不足');
      return;
    }
    const newNodes: ExplorationNode[] = Array.from({ length: 6 }, (_, i) => ({
      id: i, searched: false, beast: null,
    }));
    setNodes(newNodes);
    setCurrentNodeIdx(0);
    setCurrentBeijiZone(zone);
    setView('exploration');
    setExploration({
      locationId: `beiji-${zone.id}`,
      areaName: 'beiji',
      tier: `beiji-${zone.id}` as any,
      nodes: newNodes.map((n, i) => ({
        id: i, type: 'encounter', title: `节点 ${i + 1}`, description: '', completed: false,
      })),
      currentNode: 0,
      collectedItems: [],
      collectedRings: [],
      completed: false,
    });
    toast.success(`消耗 ${zone.staminaCost} 点体力，开始探索 ${zone.name}`);
  };

  // v2.0 极北副本探索（按副本年限范围生成冰属性魂兽）
  const startBeijiDungeonExploration = (zone: BeijiZone, dun: BeijiDungeon) => {
    if (!player) return;
    if (player.level < dun.unlockLevel) {
      toast.error(`需要达到 ${dun.unlockLevel} 级才能进入`);
      return;
    }
     const ok = consumeStamina(dun.staminaCost);
     if (!ok) {
       toast.error('体力不足');
       return;
     }
     // 🔴 v18.0 先进入属性选择界面，玩家选择目标属性后再开始探索
     setCurrentBeijiZone(zone);
     setCurrentBeijiDungeon(dun);
     setAttrSelectSource({
       area: 'beiji',
       zoneId: zone.id,
       dungeonId: dun.id,
       dungeonYearMin: dun.yearMin,
       dungeonYearMax: dun.yearMax,
       dungeonRareChance: dun.rareChance,
       dungeonRareBoostMin: dun.rareBoostMin,
       dungeonRareBoostMax: dun.rareBoostMax,
       staminaCost: dun.staminaCost,
       title: `${zone.name} · ${dun.name}`,
     });
     setView('attribute-select');
  };

  // 进入生命之湖（星斗核心）
  const enterLifeLake = () => {
    if (!player) return;
    if (player.level < 70) {
      toast.error('需要达到 70 级才能进入生命之湖');
      return;
    }
    setView('lifeLake');
  };

  // 开始凶兽战斗
  const startFierceBeastBattle = (beast: FierceBeast) => {
    if (!player) return;
    // 凶兽属性大幅强化：攻击 ×3.0、防御 ×2.5、速度 ×1.5
    // 血量保持现有水平（已经足够高）
    const HP_CAP = 500000000000; // 5000亿上限
    // v5.0 凶兽属性降低80%
    const boostedHp = Math.round(beast.hp * 1.2);
    const beastHp = Math.max(1, Math.min(HP_CAP, boostedHp));
    const beastAttack = Math.round(beast.attack * 0.6);
    const beastDefense = Math.round(beast.defense * 0.5);
    const beastSpeed = Math.round(beast.speed * 0.3);
    const quality = beast.years >= 100000 ? 'red' : 'black';
    startBattle({
      battleType: 'fierce-beast',
      locationId: beast.area === 'star-lake' ? 'life-lake' : 'frozen-domain',
      enemy: {
        id: beast.id,
        name: beast.name,
        years: beast.years,
        qualityColor: quality,
        qualityLabel: beast.years >= 500000 ? '凶兽·五十万年以上' : '凶兽·十万年以上',
        hp: beastHp,
        attack: beastAttack,
        defense: beastDefense,
        speed: beastSpeed,
        spirit: beast.spirit,
        skillName: beast.soulSkills[0] || '凶兽之威',
        skillDesc: `来自${beast.title}的强力攻击`,
        element: beast.element,
      },
      meta: {
        drops: beast.drops,
        beastTitle: beast.title,
        beastMartialSoul: beast.martialSoul,
      },
    });
  };

  // 点击日月山脉 → 进入区域选择（完全清理星斗大森林和极北之地的所有状态）
  const enterSunMountains = () => {
    // 完全清理星斗大森林和极北之地的所有残留状态
    setCurrentZone(null);
    setCurrentBeijiZone(null);
    setSelectedDungeon(null);
    if (exploration && exploration.areaName !== 'sun-mountains') {
      setExploration(null);
      setNodes([]);
      setCurrentNodeIdx(0);
      setEncounterBeast(null);
      setShowEncounter(false);
    }
    setView('sun-mountains');
  };

  // 进入传灵塔
  const enterSpiritTower = () => {
    setView('spiritTower');
  };

  // 进入茶城
  const enterTeaCity = () => {
    setView('teaCity');
  };

  // 进入冰火两仪眼
  const enterIceFireEye = () => {
    setView('iceFireEye');
  };

  // 冰火两仪眼·六大区域掉落配置（掉落池严格按区域特色筛选）
  //  仙草池/灵草池均按区域限定；仙草内部再按品质分级加权
  const ICE_FIRE_ZONE_DROPS: Record<string, { immortals: string[]; spiritGrasses: string[] }> = {
    'icefire-1': {
      // 炽热阳泉：火/光属性仙草 + 圣龙耀阳草
      immortals: ['烈火杏娇疏', '奇茸通天菊', '圣龙耀阳草', '鸡冠凤凰葵', '太阳精', '龙芝叶'],
      spiritGrasses: ['赤炎花', '金芝叶', '厚土参'],
    },
    'icefire-2': {
      // 寒凉阴泉：冰/水属性仙草
      immortals: ['八角玄冰草', '幽香绮罗仙品', '望穿秋水露', '沧海珠'],
      spiritGrasses: ['冰魄莲', '水涟花', '虚空晶'],
    },
    'icefire-3': {
      // 湖心小岛：仙品圣地核心
      immortals: ['相思断肠红', '绮罗郁金香', '奇茸通天菊', '水仙玉肌骨', '八瓣仙兰'],
      spiritGrasses: ['净世莲', '岁时花', '金芝叶'],
    },
    'icefire-4': {
      // 药香小径：外围普通仙草+灵草丰富
      immortals: ['幽香绮罗仙品', '烈火杏娇疏', '八角玄冰草', '千年藤', '风影翼'],
      spiritGrasses: ['长生藤', '赤炎花', '冰魄莲', '水涟花', '厚土参'],
    },
    'icefire-5': {
      // 毒瘴谷口：暗属性/空间/时间仙草灵草
      immortals: ['幽香绮罗仙品', '八角玄冰草', '雪色天鹅吻', '黄泉露', '岁月花', '虚空晶'],
      spiritGrasses: ['幽冥菇', '虚空晶', '岁时花'],
    },
    'icefire-6': {
      // 仙品圣地：全仙草池 + 稀有灵草
      immortals: [
        '相思断肠红', '绮罗郁金香', '奇茸通天菊',
        '烈火杏娇疏', '八角玄冰草', '幽香绮罗仙品',
        '圣龙耀阳草', '黄泉露', '望穿秋水露', '鸡冠凤凰葵',
        '水仙玉肌骨', '八瓣仙兰', '雪色天鹅吻', '龙芝叶',
        '金刚不坏莲', '千年藤', '沧海珠', '玄土鼎',
        '太阳精', '虚空晶', '岁月花', '天雷果', '风影翼',
      ],
      spiritGrasses: ['净世莲', '岁时花', '幽冥菇', '虚空晶'],
    },
  };

  // 冰火两仪眼掉落生成（按当前区域筛选掉落池）
  const rollIceFireDrop = (zoneId: string): IceFireDrop => {
    const zone = ICE_FIRE_ZONE_DROPS[zoneId];
    const immortalPool = zone
      ? ICE_FIRE_IMMORTAL_GRASSES.filter((g) => zone.immortals.includes(g.name))
      : ICE_FIRE_IMMORTAL_GRASSES;
    const spiritPool = zone
      ? HOLY_GRASSES.filter((g) => zone.spiritGrasses.includes(g.name))
      : HOLY_GRASSES;

    // 特殊：圣龙耀阳草的区域定制概率
    // - 炽热阳泉（icefire-1）：30% 仙草档内直接指定圣龙耀阳草
    // - 仙品圣地（icefire-6）：20% 仙草档内直接指定圣龙耀阳草
    // - 其他区域：保持原规则（5% 特殊档）
    const sacredDragonInPool = immortalPool.some((g) => g.id === 'sacred-dragon-yang-grass-icefire');
    const sacredDragonRate = zoneId === 'icefire-1' ? 0.30 : zoneId === 'icefire-6' ? 0.20 : 0;

    const r = Math.random();
    // 35% 仙草 / 40% 灵草 / 10% 金币 / 15% 魂骨（总和 100%）
    if (r < 0.35) {
      // 仙草按品质分级加权，品质越高概率越低：
      // - 普通仙草（epic）：60%，池内均分
      // - 仙品仙草（legendary，不含相思/圣龙）：25%，池内均分
      // - 神品仙草（相思断肠红）：10%，仅当池中有才掉落
      // - 特殊仙草（圣龙耀阳草）：默认 5%；炽热阳泉 30%、仙品圣地 20%
      // 若某档在当前区域池中不存在，则顺移到下一可用档
      const qualityRoll = Math.random();
      let pool: IItem[];
      const epicPool = immortalPool.filter((g) => g.quality === 'epic');
      const legendaryPool = immortalPool.filter(
         (g) => g.quality === 'legendary'
           && g.id !== 'immortal-xiang-si-duan-chang-hong-2'
           && g.id !== 'sacred-dragon-yang-grass-icefire'
       );
      const divinePool = immortalPool.filter((g) => g.id === 'immortal-xiang-si-duan-chang-hong-2');
      const sacredPool = immortalPool.filter((g) => g.id === 'sacred-dragon-yang-grass-icefire');

      // 圣龙耀阳草优先判定（炽热阳泉/仙品圣地高概率路径）
      if (sacredDragonInPool && sacredDragonRate > 0 && qualityRoll < sacredDragonRate) {
        pool = sacredPool;
      } else if (qualityRoll < 0.60 && epicPool.length > 0) {
        pool = epicPool;
      } else if (qualityRoll < 0.85 && legendaryPool.length > 0) {
        pool = legendaryPool;
      } else if (qualityRoll < 0.95 && divinePool.length > 0) {
        pool = divinePool;
      } else if (sacredPool.length > 0) {
        pool = sacredPool;
      } else if (legendaryPool.length > 0) {
        pool = legendaryPool;
      } else if (epicPool.length > 0) {
        pool = epicPool;
      } else {
        pool = immortalPool.length > 0 ? immortalPool : ICE_FIRE_IMMORTAL_GRASSES;
      }
      const grass = pool[Math.floor(Math.random() * pool.length)];
      const extra = getConsumableExtra(grass);
      addItem({
        ...grass,
        id: `${grass.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        quantity: 1,
      });
      return {
        type: 'immortal',
        name: grass.name,
        desc: extra?.effectDesc || grass.description,
        color: grass.qualityColor || '#fcd34d',
        iconChar: grass.iconChar || '仙',
        item: grass,
      };
    } else if (r < 0.75) {
      // 灵草：从区域灵草池中随机（空池兜底用全灵草池）
      const pool = spiritPool.length > 0 ? spiritPool : HOLY_GRASSES;
      const grass = pool[Math.floor(Math.random() * pool.length)];
      const extra = getConsumableExtra(grass);
      addItem({
        ...grass,
        id: `${grass.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        quantity: 1,
      });
      return {
        type: 'spirit',
        name: grass.name,
        desc: extra?.effectDesc || grass.description,
        color: grass.qualityColor || '#22c55e',
        iconChar: grass.iconChar || '灵',
        item: grass,
      };
    } else if (r < 0.85) {
      // 金币：5000-50000随机
      const amount = Math.floor(5000 + Math.random() * 45000);
      addCoins(amount);
      return {
        type: 'coin',
        name: `${amount.toLocaleString()} 魂币`,
        desc: '探索获得的魂币奖励',
        color: '#fbbf24',
        iconChar: '币',
      };
    } else {
      // 魂骨：随机生成 1万 ~ 10万年魂兽并掉落
      const years = Math.floor(10000 + Math.random() * 90000);
      const beastNames = ['冰碧帝皇蝎', '泰坦巨猿', '天青牛蟒', '邪火凤凰', '柔骨兔', '玄武'];
      const bname = beastNames[Math.floor(Math.random() * beastNames.length)];
      // 🔴 修复：按魂兽名推断属性并归一化，确保魂骨属性与魂兽一致
      const boneAttr = normalizeBeastAttribute(inferElementFromName(bname));
      const bone = rollSoulBoneDrop(years, bname, '#8b5cf6', boneAttr);
      if (bone) {
        addItem({
          ...bone,
          id: `bone-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          quantity: 1,
        });
        return {
          type: 'soulbone',
          name: bone.name,
          desc: bone.description || '珍稀魂骨',
          color: bone.qualityColor || '#a855f7',
          iconChar: bone.iconChar || '骨',
          item: bone as any,
        };
      }
      // 兜底：给金币
      const amount = 20000;
      addCoins(amount);
      return {
        type: 'coin',
        name: `${amount.toLocaleString()} 魂币`,
        desc: '探索获得的魂币奖励',
        color: '#fbbf24',
        iconChar: '币',
      };
    }
  };

  // 进入传灵塔某属性副本（展示魂兽列表供选择）
  const enterTowerAttribute = (attrName: string) => {
    setSelectedTowerAttr(attrName);
  };

  // 传灵塔：选择指定魂兽进入战斗
  const startSpiritBeastBattle = (spiritId: string) => {
    if (!player || !attributes) return;
    const spiritTpl = SOUL_SPIRIT_POOL.find((s) => s.id === spiritId);
    if (!spiritTpl) return;
    const attrs = attributes;
    // 难度由魂灵自身强度 + 玩家等级共同决定
    const lvlFactor = Math.max(0.6, Math.min(1.5, player.level / 50));
    // 用魂灵基础攻击作为强度参考，再乘等级系数
    const powerRatio = (spiritTpl.baseAttack + spiritTpl.baseDefense) / 80;
    const diffMul = 0.6 + powerRatio * 0.5 + lvlFactor * 0.2;
    const beastHp = Math.max(80, Math.round(attrs.hp * diffMul * 0.9));
    const beastAtk = Math.max(8, Math.round(attrs.attack * diffMul * 0.75));
    const beastDef = Math.max(5, Math.round(attrs.defense * diffMul * 0.7));
    const beastSpd = Math.max(6, Math.round(attrs.speed * diffMul * 0.85));
    const beastSpirit = Math.max(6, Math.round(attrs.spirit * diffMul * 0.7));

    startBattle({
      battleType: 'spirit-tower' as const,
      locationId: `tower-${spiritTpl.attribute}`,
      enemy: {
        id: `spirit-beast-${spiritTpl.id}-${Date.now()}`,
        name: spiritTpl.beastName,
        years: 0,
        qualityColor: 'spirit',
        qualityLabel: `${spiritTpl.attribute}属性魂兽`,
        hp: beastHp,
        attack: beastAtk,
        defense: beastDef,
        speed: beastSpd,
        spirit: beastSpirit,
        skillName: `${spiritTpl.attribute}属性冲击`,
        skillDesc: spiritTpl.feature,
        element: spiritTpl.attribute,
      },
      meta: {
        spiritTower: true,
        spiritId: spiritTpl.id,
        spiritName: spiritTpl.name,
        spiritAttribute: spiritTpl.attribute,
        spiritDesc: spiritTpl.description,
        spiritFeature: spiritTpl.feature,
        spiritIconChar: spiritTpl.iconChar,
      },
    });
  };

  // 从区域选择返回大地图（清理所有子界面状态）
  const backToBigMap = () => {
    setView('bigMap');
    setCurrentZone(null);
    setCurrentBeijiZone(null);
    setCurrentMountain(null);
    setSelectedDungeon(null);
    setArenaResult(null);
    setNodes([]);
    setCurrentNodeIdx(0);
    setEncounterBeast(null);
    setShowEncounter(false);
  };

  // 开始探索（6个节点）
  const startExploration = (zone: ForestZone) => {
    if (!player) return;
    if (zone.locked) {
      toast.error(zone.lockedMsg || '该区域暂不开放');
      return;
    }
    if (player.level < zone.unlockLevel) {
      toast.error(`需要达到 ${zone.unlockLevel} 级才能进入`);
      return;
    }
    // 直接调用 consumeStamina，内部会先结算恢复量再扣减，返回false表示不足
    // 不要先 getCurrentStamina 再 consumeStamina，避免两次计算间出现不一致
    const ok = consumeStamina(zone.staminaCost);
    if (!ok) {
      toast.error('体力不足');
      return;
    }
    const newNodes: ExplorationNode[] = Array.from({ length: 6 }, (_, i) => ({
      id: i, searched: false, beast: null,
    }));
    setNodes(newNodes);
    setCurrentNodeIdx(0);
    setCurrentZone(zone);
    setView('exploration');
    setExploration({
      locationId: `star-${zone.id}`,
      areaName: 'star-forest',
      tier: zone.id as any,
      nodes: newNodes.map((n, i) => ({
        id: i, type: 'encounter', title: `节点 ${i + 1}`, description: '', completed: false,
      })),
      currentNode: 0,
      collectedItems: [],
      collectedRings: [],
      completed: false,
    });
    toast.success(`消耗 ${zone.staminaCost} 点体力，开始探索 ${zone.name}`);
  };

  // v2.0 星斗副本探索（按副本年限范围生成魂兽）
  const startForestDungeonExploration = (zone: ForestZone, dun: ForestDungeon) => {
    if (!player) return;
    if (player.level < dun.unlockLevel) {
      toast.error(`需要达到 ${dun.unlockLevel} 级才能进入`);
      return;
    }
    const ok = consumeStamina(dun.staminaCost);
    if (!ok) {
      toast.error('体力不足');
      return;
    }
    // 🔴 v18.0 先进入属性选择界面，玩家选择目标属性后再开始探索
    setCurrentZone(zone);
    setCurrentForestDungeon(dun);
    setAttrSelectSource({
      area: 'star-forest',
      zoneId: zone.id,
      dungeonId: dun.id,
      dungeonYearMin: dun.yearMin,
      dungeonYearMax: dun.yearMax,
      dungeonRareChance: dun.rareChance,
      dungeonRareBoostMin: dun.rareBoostMin,
      dungeonRareBoostMax: dun.rareBoostMax,
      staminaCost: dun.staminaCost,
      title: `${zone.name} · ${dun.name}`,
    });
    setView('attribute-select');
  };

  // 一键扫荡：森林副本（不选属性，随机）
  const handleSweepForest = (zone: ForestZone, dun: ForestDungeon) => {
    if (!player) return;
    if (player.level < dun.unlockLevel) {
      toast.error(`需要达到 ${dun.unlockLevel} 级才能扫荡`);
      return;
    }
    const areaKey = `forest-${zone.id}-${dun.id}`;
    const count = getSweepCount(areaKey);
    if (count < 10) {
      toast.error(`需探索10次后解锁扫荡（当前 ${count}/10）`);
      return;
    }
    const result = sweepExplore(areaKey, {
      yearMin: dun.yearMin,
      yearMax: dun.yearMax,
      staminaCost: dun.staminaCost,
      rareChance: dun.rareChance,
      rareBoostMin: dun.rareBoostMin,
      rareBoostMax: dun.rareBoostMax,
      nodesCount: 6,
    });
    if (!result.success || !result.result) {
      toast.error(result.reason || '扫荡失败');
      return;
    }
    setSweepResult({
      areaKey,
      rings: result.result.rings,
      items: result.result.items,
      coins: result.result.coins,
      exp: result.result.exp,
      beasts: result.result.beasts,
      filterSummary: result.result.filterSummary,
    });
    toast.success(`扫荡完成！获得 ${result.result.rings.length} 个魂环，${result.result.items.length} 件物品`);
  };

  // 一键扫荡：极北副本
  const handleSweepBeiji = (zone: BeijiZone, dun: BeijiDungeon) => {
    if (!player) return;
    if (player.level < dun.unlockLevel) {
      toast.error(`需要达到 ${dun.unlockLevel} 级才能扫荡`);
      return;
    }
    const areaKey = `beiji-${zone.id}-${dun.id}`;
    const count = getSweepCount(areaKey);
    if (count < 10) {
      toast.error(`需探索10次后解锁扫荡（当前 ${count}/10）`);
      return;
    }
    const result = sweepExplore(areaKey, {
      yearMin: dun.yearMin,
      yearMax: dun.yearMax,
      staminaCost: dun.staminaCost,
      attributeFilter: ['冰属性', '水属性'],
      rareChance: dun.rareChance,
      rareBoostMin: dun.rareBoostMin,
      rareBoostMax: dun.rareBoostMax,
      nodesCount: 6,
    });
    if (!result.success || !result.result) {
      toast.error(result.reason || '扫荡失败');
      return;
    }
    setSweepResult({
      areaKey,
      rings: result.result.rings,
      items: result.result.items,
      coins: result.result.coins,
      exp: result.result.exp,
      beasts: result.result.beasts,
      filterSummary: result.result.filterSummary,
    });
    toast.success(`扫荡完成！获得 ${result.result.rings.length} 个魂环，${result.result.items.length} 件物品`);
  };

  // 一键扫荡：山脉副本（不掉魂环，只掉材料和金币）
  const handleSweepMountain = (mzone: MountainZone) => {
    if (!player) return;
    if (player.level < mzone.unlockLevel) {
      toast.error(`需要达到 ${mzone.unlockLevel} 级才能扫荡`);
      return;
    }
    if (mzone.locked) {
      toast.error(mzone.lockedMsg || '该区域暂不开放');
      return;
    }
    const areaKey = `mountain-${mzone.id}`;
    const count = getSweepCount(areaKey);
    if (count < 10) {
      toast.error(`需探索10次后解锁扫荡（当前 ${count}/10）`);
      return;
    }
    const result = sweepExplore(areaKey, {
      yearMin: mzone.beastTier === 'outer' ? 10 : mzone.beastTier === 'middle' ? 100 : mzone.beastTier === 'inner' ? 10000 : mzone.beastTier === 'core' ? 10000 : 100000,
      yearMax: mzone.beastTier === 'outer' ? 999 : mzone.beastTier === 'middle' ? 9999 : mzone.beastTier === 'inner' ? 99999 : mzone.beastTier === 'core' ? 499999 : 999999,
      staminaCost: mzone.staminaCost,
      nodesCount: 6,
    });
    if (!result.success || !result.result) {
      toast.error(result.reason || '扫荡失败');
      return;
    }
    setSweepResult({
      areaKey,
      rings: [],
      items: result.result.items,
      coins: result.result.coins,
      exp: result.result.exp,
      beasts: result.result.beasts,
      filterSummary: result.result.filterSummary,
    });
    toast.success(`扫荡完成！获得 ${result.result.items.length} 件物品`);
  };

  // 进入山脉副本列表
  const enterMountainDungeons = (mzone: MountainZone) => {
    if (!player) return;
    if (mzone.locked) {
      toast.error(mzone.lockedMsg || '该区域暂不开放');
      return;
    }
    if (player.level < mzone.unlockLevel) {
      toast.error(`需要达到 ${mzone.unlockLevel} 级才能进入`);
      return;
    }
    setCurrentMountain(mzone);
    setView('mountain-dungeons');
  };

  // 当前山脉等级的副本列表
  const currentDungeons = useMemo(() => {
    if (!currentMountain) return [];
    return MOUNTAIN_DUNGEONS.filter((d) => d.mountainLevel === currentMountain.level);
  }, [currentMountain]);

  // 当前选中的副本（弹窗用）
  const [selectedDungeon, setSelectedDungeon] = useState<MountainDungeon | null>(null);
  const [selectedForestZone, setSelectedForestZone] = useState<ForestZone | null>(null);
  const [selectedBeijiZone, setSelectedBeijiZone] = useState<BeijiZone | null>(null);

  // 开始副本战斗（山脉副本：不掉魂环，只掉材料和金币）
  const startDungeonBattle = (dungeon: MountainDungeon) => {
    if (!player) return;
    const ok = consumeStamina(dungeon.staminaCost);
    if (!ok) {
      toast.error('体力不足');
      return;
    }
    // 按副本指定年限直接生成魂兽属性（不依赖魂兽库名称匹配，避免匹配失败导致战斗启动崩溃）
    const y = Math.max(10, dungeon.beastYears);
    const quality = getRingQualityFromYears(y);

    // 基于年限的基础属性计算（血量统一按 getBeastStatsByYears 规定，攻防速保持原副本体系）
    const standardStats = getBeastStatsByYears(y, 0, 0, 1, 0);
    let atkPerYear = 0.3;
    let defPerYear = 0.2;
    let spdPerYear = 0.15;
    if (y >= 100000) { // 十万年级
      atkPerYear = 1.2; defPerYear = 0.9; spdPerYear = 0.5;
    } else if (y >= 10000) { // 万年级
      atkPerYear = 0.8; defPerYear = 0.6; spdPerYear = 0.35;
    } else if (y >= 1000) { // 千年级
      atkPerYear = 0.5; defPerYear = 0.35; spdPerYear = 0.22;
    } else if (y >= 100) { // 百年级
      atkPerYear = 0.35; defPerYear = 0.25; spdPerYear = 0.17;
    }

    const baseAtk = 10 + y * atkPerYear;
    const baseDef = 5 + y * defPerYear;
    const baseSpd = 8 + y * spdPerYear;
    const baseSpr = 5 + y * atkPerYear * 0.6;

    // 根据副本属性标签微调
    const attr = dungeon.beastAttr || '';
    let atkMul = 1, defMul = 1, hpMul = 1, spdMul = 1;
    if (attr.includes('土') || attr.includes('金')) { defMul = 1.2; hpMul = 1.1; }
    if (attr.includes('火') || attr.includes('光')) { atkMul = 1.2; }
    if (attr.includes('冰')) { atkMul = 1.1; defMul = 1.1; }
    if (attr.includes('风')) { spdMul = 1.25; }
    if (attr.includes('毒') || attr.includes('暗')) { atkMul = 1.15; spdMul = 1.1; }
    if (attr.includes('精神')) { atkMul = 0.9; spdMul = 1.2; }
    if (attr.includes('全属性')) { atkMul = 1.1; defMul = 1.1; hpMul = 1.1; spdMul = 1.1; }

    // 血量走标准魂兽血量表（按规定），再乘属性微调，全局上限 10 亿
    const HP_CAP = 1000000000;
    const beastHp = Math.max(1, Math.min(HP_CAP, Math.round(standardStats.hp * hpMul)));
    const beastAtk = Math.round(baseAtk * atkMul);
    const beastDef = Math.round(baseDef * defMul);
    const beastSpd = Math.round(baseSpd * spdMul);
    const beastSpr = Math.round(baseSpr);

    // 从魂兽库尝试匹配名称拿技能名，匹配失败则用通用技能名
    const species = getBeastSpeciesByName(dungeon.beastName);
    const skillName = species?.skills?.[0]?.name ?? '魂兽咆哮';
    const skillDesc = species?.skills?.[0]?.desc ?? '魂兽的强力一击';

    startBattle({
      battleType: 'mountain-dungeon',
      locationId: dungeon.id,
      enemy: {
        id: `dun-${dungeon.id}-${Date.now()}`,
        name: dungeon.beastName,
        years: y,
        qualityColor: quality.color,
        qualityLabel: quality.label,
        hp: beastHp,
        attack: beastAtk,
        defense: beastDef,
        speed: beastSpd,
        spirit: beastSpr,
        skillName,
        skillDesc,
        element: dungeon.beastAttr || undefined, // 缺失时不传，后续用 inferElementFromName 按魂兽名兜底
      },
      meta: { dungeonId: dungeon.id, drops: dungeon.drops, coinReward: dungeon.coinReward },
    });
  };

  // 开始山脉探索（6个节点）
  const startMountainExploration = (mzone: MountainZone) => {
    if (!player) return;
    if (mzone.locked) {
      toast.error(mzone.lockedMsg || '该区域暂不开放');
      return;
    }
    if (player.level < mzone.unlockLevel) {
      toast.error(`需要达到 ${mzone.unlockLevel} 级才能进入`);
      return;
    }
    const ok = consumeStamina(mzone.staminaCost);
    if (!ok) {
      toast.error('体力不足');
      return;
    }
    const newNodes: ExplorationNode[] = Array.from({ length: 6 }, (_, i) => ({
      id: i, searched: false, beast: null,
    }));
    setNodes(newNodes);
    setCurrentNodeIdx(0);
    setCurrentMountain(mzone);
    setView('exploration');
    setExploration({
      locationId: mzone.id,
      areaName: 'sun-mountains',
      tier: mzone.id as any,
      nodes: newNodes.map((n, i) => ({
        id: i, type: 'encounter', title: `节点 ${i + 1}`, description: '', completed: false,
      })),
      currentNode: 0,
      collectedItems: [],
      collectedRings: [],
      completed: false,
    });
    toast.success(`消耗 ${mzone.staminaCost} 点体力，进入 ${mzone.name}`);
  };

  // 🔴 v18.0 属性选择后真正启动探索
  const startExplorationWithAttribute = (attribute: string) => {
    if (!attrSelectSource) return;
    const src = attrSelectSource;
    const newNodes: ExplorationNode[] = Array.from({ length: 6 }, (_, i) => ({
      id: i, searched: false, beast: null,
    }));
    setNodes(newNodes);
    setCurrentNodeIdx(0);

    let locationId = '';
    let areaName: 'star-forest' | 'beiji' | 'sun-mountains' = 'star-forest';
    let tier: any = 'outer';

    if (src.area === 'star-forest') {
      locationId = `star-${src.zoneId}-${src.dungeonId}`;
      areaName = 'star-forest';
      tier = src.zoneId;
    } else if (src.area === 'beiji') {
      locationId = `beiji-${src.zoneId}-${src.dungeonId}`;
      areaName = 'beiji';
      tier = `beiji-${src.zoneId}`;
    } else if (src.area === 'sun-mountains') {
      locationId = src.zoneId || 'mountain-1';
      areaName = 'sun-mountains';
      tier = src.zoneId;
    }

    setExploration({
      locationId,
      areaName,
      tier,
      dungeonId: src.dungeonId,
      dungeonYearMin: src.dungeonYearMin,
      dungeonYearMax: src.dungeonYearMax,
      dungeonRareChance: src.dungeonRareChance,
      dungeonRareBoostMin: src.dungeonRareBoostMin,
      dungeonRareBoostMax: src.dungeonRareBoostMax,
      nodes: newNodes.map((n, i) => ({
        id: i, type: 'encounter', title: `节点 ${i + 1}`, description: '', completed: false,
      })),
      currentNode: 0,
      collectedItems: [],
      collectedRings: [],
      completed: false,
      attributeFilter: attribute,
    } as any);
    setView('exploration');
    setAttrSelectSource(null);
    toast.success(`目标属性：${attribute}，开始探索！`);
  };

  // 搜索当前节点 → 遇到魂兽 → 弹出遭遇弹窗
  const handleSearchNode = (idx: number) => {
    if (!player) return;
    const node = nodes[idx];
    if (!node || node.searched || idx !== currentNodeIdx) return;

    // 确定魂兽 tier：森林/极北用 zone.id 直接映射，山脉用 currentMountain.beastTier
    let beastTier: 'outer' | 'middle' | 'inner' | 'core' | 'life-lake' = 'outer';
    let locationLabel = '';
    if (currentZone) {
      // 森林区域 id 直接对应魂兽 tier
      const zoneId = currentZone.id as string;
      if (zoneId === 'outer') beastTier = 'outer';
      else if (zoneId === 'middle') beastTier = 'middle';
      else if (zoneId === 'inner') beastTier = 'inner';
      else if (zoneId === 'core') beastTier = 'core';
      else if (zoneId === 'life-lake') beastTier = 'life-lake';
      locationLabel = currentZone.name;
    } else if (currentBeijiZone) {
      // 极北之地区域 id 直接对应魂兽 tier
      const zoneId = currentBeijiZone.id;
      if (zoneId === 'outer') beastTier = 'outer';
      else if (zoneId === 'middle') beastTier = 'middle';
      else if (zoneId === 'inner') beastTier = 'inner';
      else if (zoneId === 'core') beastTier = 'core';
      locationLabel = currentBeijiZone.name;
     } else if (currentMountain) {
       beastTier = currentMountain.beastTier;
       locationLabel = currentMountain.name;
     } else {
       // 百万年属性副本模式：tier 直接从 exploration 读取
       const expAny2 = exploration as any;
       if (expAny2?.dungeonYearMin && expAny2?.dungeonYearMax) {
         beastTier = 'life-lake'; // 用生命之湖的物种池（最高级）
         locationLabel = '百万年秘境';
       } else {
         return;
       }
     }

    // 魂兽血量统一按规定的年限血量表（百年/千年/万年/十万年分段线性增长）
    // v2.0 副本模式：有副本年限范围时按副本范围生成
    const expAny = exploration as any;
    let beast: any;
    // 属性筛选：优先用 exploration.attributeFilter（玩家选属性模式）
    // 其次按区域默认属性（极北默认冰/水）
    const selectedAttr = expAny?.attributeFilter;
    if (expAny?.dungeonYearMin && expAny?.dungeonYearMax) {
      let attrFilter: string[] | undefined;
      if (selectedAttr) {
        attrFilter = [selectedAttr];
      } else if (currentBeijiZone) {
        attrFilter = ['冰属性', '水属性'];
      }
      beast = generateBeastByYearRange(
        expAny.dungeonYearMin,
        expAny.dungeonYearMax,
        expAny.dungeonRareChance || 0,
        expAny.dungeonRareBoostMin || 1,
        expAny.dungeonRareBoostMax || 1,
        attrFilter,
      );
    } else {
      let attrFilter: string[] | undefined;
      if (selectedAttr) {
        attrFilter = [selectedAttr];
      } else if (currentBeijiZone) {
        attrFilter = ['冰属性', '水属性'];
      }
      beast = generateBeastInstance(beastTier, { attributeFilter: attrFilter });
    }
    if (!beast) {
      toast.error('未遇到魂兽，请稍后再试');
      return;
    }

    const quality = getRingQualityFromYears(beast.years);
    const encBeast: EncounterBeast = {
      id: beast.id,
      name: beast.name,
      years: beast.years,
      qualityColor: quality.color,
      qualityLabel: quality.label,
      hp: beast.hp,
      attack: beast.attack,
      defense: beast.defense,
      speed: beast.speed,
      spirit: beast.spirit || 0,
      skillName: beast.skillName,
      skillDesc: beast.skillDesc,
      speciesId: beast.id,
      element: beast.element,
      description: beast.description,
    };
    setEncounterBeast(encBeast);
    setShowEncounter(true);
  };

  // 迎战 → 启动战斗（先关遭遇弹窗避免 z-index 叠加）
  const handleFight = () => {
    if (!encounterBeast) return;
     if (!currentZone && !currentBeijiZone && !currentMountain) {
       // 百万年属性副本模式兜底
       const expAny = exploration as any;
       if (!expAny?.dungeonYearMin) return;
     }
    let locationId: string;
    let tier: string;
    let areaName: string;
    if (currentBeijiZone) {
      locationId = `beiji-${currentBeijiZone.id}`;
      tier = `beiji-${currentBeijiZone.id}`;
      areaName = 'beiji';
    } else if (currentZone) {
      locationId = currentZone.id;
      tier = currentZone.id;
      areaName = 'star-forest';
     } else {
       locationId = currentMountain!.id;
       tier = currentMountain!.id;
       areaName = 'sun-mountains';
     }
     // 副本/百万年模式：从 exploration 取精确 locationId 和 tier
     const expAny = exploration as any;
     if (expAny?.dungeonYearMin && expAny?.dungeonYearMax) {
       locationId = expAny.locationId || locationId;
       tier = expAny.tier || tier;
     }
    setShowEncounter(false);
    startBattle({
      battleType: 'encounter',
      locationId,
      enemy: {
        id: encounterBeast.id,
        name: encounterBeast.name,
        years: encounterBeast.years,
        qualityColor: encounterBeast.qualityColor,
        qualityLabel: encounterBeast.qualityLabel,
        hp: encounterBeast.hp,
        attack: encounterBeast.attack,
        defense: encounterBeast.defense,
        speed: encounterBeast.speed,
        spirit: Math.round(encounterBeast.attack * 0.6),
        skillName: encounterBeast.skillName,
        skillDesc: encounterBeast.skillDesc,
        element: encounterBeast.element,
      },
      exploreSource: {
        tier,
        nodeIdx: currentNodeIdx,
        locationId,
        areaName,
      },
    });
  };

  // 绕过魂兽（遭遇弹窗逃跑）→ 前往下一个节点（ref 锁防快速连点）
  const bypassLockRef = useRef(false);
  const handleBypass = () => {
    if (bypassLockRef.current) return;
    bypassLockRef.current = true;
    setShowEncounter(false);
    setEncounterBeast(null);
    advanceNode();
    // 下一个节点遭遇时重置锁（1.2 秒后，节点动画过渡完成后）
    setTimeout(() => { bypassLockRef.current = false; }, 1200);
  };

  // 推进节点
  const advanceNode = () => {
    setNodes((prev) => {
      const next = [...prev];
      if (next[currentNodeIdx]) {
        next[currentNodeIdx] = { ...next[currentNodeIdx], searched: true };
      }
      return next;
    });
    setCurrentNodeIdx((prev) => {
      const next = prev + 1;
      if (next >= 6) {
        endExploration('complete');
      }
      return next;
    });
  };

  // 战斗结束后自动回到探索节点界面并推进（监听 inBattle 变化，只在战斗真正结束时触发）
  const prevExploreInBattleRef = useRef(inBattle);
  useEffect(() => {
    const wasInBattle = prevExploreInBattleRef.current;
    prevExploreInBattleRef.current = inBattle;
    if (wasInBattle && !inBattle && view === 'exploration' && (currentZone || currentBeijiZone || currentMountain) && encounterBeast) {
      setEncounterBeast(null);
      setShowEncounter(false);
      advanceNode();
    }
  }, [inBattle, view, currentZone, currentBeijiZone, currentMountain, encounterBeast]);

  // 探索结束
  const endExploration = (reason: 'complete' | 'flee' | 'defeat') => {
    const fromForest = currentZone !== null;
    const fromBeiji = currentBeijiZone !== null;
    const fromMountain = currentMountain !== null;
    const savedZone = currentZone;
    const savedBeijiZone = currentBeijiZone;
    const savedMountain = currentMountain;

    // 🔴 扫荡进度累加：每次完整探索（6节点，无论完成/逃跑/失败）都算1次
    if (exploration && nodes.length >= 6) {
      let sweepAreaKey = '';
      const expAny = exploration as any;
      if (exploration.areaName === 'star-forest' && expAny.dungeonId) {
        sweepAreaKey = `forest-${exploration.tier}-${expAny.dungeonId}`;
      } else if (exploration.areaName === 'beiji' && expAny.dungeonId) {
        const zoneId = String(exploration.tier || '').replace(/^beiji-/, '');
        sweepAreaKey = `beiji-${zoneId}-${expAny.dungeonId}`;
      }
      if (sweepAreaKey) {
        incrementSweepCount(sweepAreaKey);
      }
    }

    finishExploration();
    setTimeout(() => {
      if (fromForest && savedZone) {
        // 返回星斗单区域详情页
        setSelectedForestZone(savedZone);
        setView('starForestZone');
      } else if (fromBeiji && savedBeijiZone && !savedBeijiZone.isFierceBeast) {
        // 返回极北单区域详情页
        setSelectedBeijiZone(savedBeijiZone);
        setView('beijiZone');
      } else if (fromMountain && savedMountain) {
        // 山脉 6 节点探索：返回该山脉段副本列表
        setCurrentMountain(savedMountain);
        setView('mountain-dungeons');
      } else if (fromForest) {
        setView('starForest');
      } else if (fromBeiji) {
        setView('beiji');
      } else if (fromMountain) {
        setView('sun-mountains');
      } else {
        setView('bigMap');
      }
      setCurrentZone(null);
      setCurrentBeijiZone(null);
      setCurrentMountain(null);
      setNodes([]);
      setCurrentNodeIdx(0);
      setEncounterBeast(null);
      setShowEncounter(false);
      setSelectedDungeon(null);
      if (reason === 'complete') toast.success('探索完成！收集的魂环将在3分钟后消散');
      else if (reason === 'flee') toast.info('已撤离，带回来了探索中收集的物品与魂环');
      else toast.error('探索失败，你被击倒了');
    }, 50);
  };

  const handleFleeExploration = () => {
    endExploration('flee');
  };

  // === 史莱克：新生考核战斗 ===
  const startExamBattle = () => {
    if (!player) return;
    if (player.level < 10) {
      toast.error('需要达到 10 级才能参加新生考核');
      return;
    }
    if (player.examCooldownUntil > Date.now()) {
      toast.error('考核冷却中，请稍后再试');
      return;
    }
    // 新生考核：百年魂兽（100~999年），用 outer tier 但限定百年区间
    let beast = generateBeastByYearRange(100, 999, 0, 1, 1);
    if (!beast) {
      toast.error('无法生成考核魂兽');
      return;
    }
    const quality = getRingQualityFromYears(beast.years);
    startBattle({
      battleType: 'shrek-exam',
      locationId: 'shrek-exam',
      enemy: {
        id: beast.id,
        name: beast.name,
        years: beast.years,
        qualityColor: quality.color,
        qualityLabel: quality.label,
        hp: beast.hp,
        attack: beast.attack,
        defense: beast.defense,
        speed: beast.speed,
        spirit: Math.round(beast.attack * 0.6),
        skillName: beast.skillName,
        skillDesc: beast.skillDesc,
      },
      meta: { exam: true },
    });
  };

  // 监听考核战斗结果（使用 lastBattleResult，避免 battleState 被清空后无法判断胜负）
  const prevExamResultRef = useRef<string | null>(null);
  useEffect(() => {
    if (view !== 'exam') return;
    const resultPhase = lastBattleResult.phase;
    const isExamBattle = lastBattleResult.battleType === 'shrek-exam';
    if (!isExamBattle || !resultPhase) return;
    // 防止重复触发：只有 phase 从无变有才处理一次
    if (prevExamResultRef.current === resultPhase) return;
    prevExamResultRef.current = resultPhase;
    if (resultPhase === 'victory') {
      promoteToOuterCourt();
      toast.success('恭喜通过新生考核！获得外院学员资格！');
      setTimeout(() => {
        setView('outerCourt');
      }, 300);
    } else {
      setExamCooldown(1 * 60 * 1000); // 1分钟冷却
      toast.error('考核失败，1分钟后可再次挑战');
    }
  }, [lastBattleResult, view, promoteToOuterCourt, setExamCooldown]);

  // === 竞技场：开始单人战 ===
  const startArenaBattle = () => {
    if (!player || !attributes) return;
    // 随机对手
    const opp = ARENA_OPPONENTS[Math.floor(Math.random() * ARENA_OPPONENTS.length)];
    const attrs = attributes;
    const totalStars = getTotalArenaStars(player.arenaRank, player.arenaStars);
    // 对手强度调整：玩家属性的 0.5 倍起步，每星 +2%，上限 0.9 倍（大幅削弱，保证玩家易胜）
    const mult = Math.min(0.9, 0.5 + totalStars * 0.02);
    const oppHp = Math.round(attrs.hp * mult);
    const oppAttack = Math.round(attrs.attack * mult * 0.6); // 攻击力再降 40%
    const oppDefense = Math.round(attrs.defense * mult);
    const oppSpeed = Math.round(attrs.speed * mult * 0.95);
    startBattle({
      battleType: 'arena',
      locationId: 'shrek-arena',
      enemy: {
        id: `opp-${Date.now()}`,
        name: opp.name,
        years: player.level * 100,
        qualityColor: 'purple',
        qualityLabel: `${opp.martialSoul}`,
        hp: oppHp,
        attack: oppAttack,
        defense: oppDefense,
        speed: oppSpeed,
        spirit: Math.round(oppAttack * 0.6),
        skillName: '第一魂技',
        skillDesc: `${opp.martialSoul}第一魂技`,
      },
      meta: { arena: true, opponent: opp.name },
    });
  };

  // 监听竞技场战斗结果（使用 lastBattleResult，避免 battleState 被清空后无法判断胜负）
  const prevArenaInBattleRef = useRef(inBattle);
  useEffect(() => {
    if (prevArenaInBattleRef.current && !inBattle && view === 'arena' && lastBattleResult.battleType === 'arena') {
      const won = lastBattleResult.phase === 'victory';
      const beforeRank = player?.arenaRank ?? 'bronze';
      const beforeStars = player?.arenaStars ?? 0;
      const coinGain = won ? 5000 + beforeStars * 500 : 0;
      const result = addArenaResult(won, coinGain);
      setArenaResult({
        win: won,
        stars: won ? 1 : 0,
        coins: coinGain,
        rankUp: result.rankUp,
        rankDown: result.rankDown,
        beforeRank,
        beforeStars,
        afterRank: result.rank,
        afterStars: result.stars,
        opponent: '未知魂师',
      });
    }
    prevArenaInBattleRef.current = inBattle;
  }, [inBattle, view, lastBattleResult, player, addArenaResult]);

  // 传灵塔战斗胜利 → 生成待选择魂灵（弹窗已在 BattlePage 内处理，此处仅兜底同步）
  useEffect(() => {
    if (
      prevSpiritTowerInBattleRef.current && !inBattle &&
      lastBattleResult.battleType === 'spirit-tower' &&
      lastBattleResult.phase === 'victory' &&
      battleState?.meta?.spiritId
    ) {
      // BattlePage 已处理弹窗+收入逻辑，这里什么都不做，仅保证副作用引用正确
    }
    prevSpiritTowerInBattleRef.current = inBattle && lastBattleResult.battleType === 'spirit-tower';
   }, [inBattle, lastBattleResult, battleState, addPendingSpirit]);

  // ============================================================
  // 天梦冰蚕献祭奇遇：战斗胜利返回地图后触发
  // 仅在星斗大森林外围区（十年魂兽区域）+ 满足条件时弹出
  // ============================================================
  const [showTianmengDialog, setShowTianmengDialog] = useState(false);
  // 冰火两仪眼
  const [iceFireCurrentZone, setIceFireCurrentZone] = useState<{ id: string; name: string } | null>(null);
  const [iceFireNodes, setIceFireNodes] = useState<Array<{ id: number; searched: boolean; drop?: IceFireDrop }>>(
    Array.from({ length: 6 }, (_, i) => ({ id: i, searched: false }))
  );
  const [iceFireDropOpen, setIceFireDropOpen] = useState(false);
  const [iceFireCurrentDrop, setIceFireCurrentDrop] = useState<IceFireDrop | null>(null);
  const [iceFireLootOpen, setIceFireLootOpen] = useState(false);
  const [iceFireLootZoneId, setIceFireLootZoneId] = useState<string | null>(null);
  // 冰火两仪眼冷却：从 player 持久化数据读取，避免大退后重置
  const iceFireCooldowns = player?.iceFireCooldowns ?? {};
  const prevTianmengInBattleRef = useRef(inBattle);
  const tianmengNodeIdxRef = useRef(0); // 战斗开始时的节点索引快照，避免 advanceNode 先推进
  const tianmengTriggeredRef = useRef(false); // 本次会话是否已尝试触发（防止重复触发）
  // 战斗开始时记录当前节点索引（天梦冰蚕要求第一个节点）
  useEffect(() => {
    if (inBattle) {
      tianmengNodeIdxRef.current = currentNodeIdx;
      logger.info('[天梦冰蚕] 战斗开始，记录节点索引=' + currentNodeIdx);
    }
  }, [inBattle, currentNodeIdx]);
  useEffect(() => {
    const wasInBattle = prevTianmengInBattleRef.current;
    prevTianmengInBattleRef.current = inBattle;
    // 战斗中绝不触发；仅在「战斗中 → 战斗结束」的下降沿，且完全回到地图后判断
    if (inBattle || !wasInBattle) return;
    if (tianmengTriggeredRef.current) {
      logger.info('[天梦冰蚕] 本次会话已触发过，跳过');
      return;
    }
    logger.info('[天梦冰蚕] 检测到战斗结束下降沿，开始检查条件');
    logger.info('[天梦冰蚕] lastBattleResult.phase=' + lastBattleResult.phase + ', battleType=' + lastBattleResult.battleType);
    logger.info('[天梦冰蚕] exploration.areaName=' + exploration?.areaName + ', tier=' + exploration?.tier);
    logger.info('[天梦冰蚕] tianmengNodeIdxRef.current=' + tianmengNodeIdxRef.current);
    // 仅 encounter 战 + 胜利 + 星斗大森林外围（outer）+ 第1个节点
    const isVictory = lastBattleResult.phase === 'victory';
    const isEncounter = lastBattleResult.battleType === 'encounter';
    const isStarForestOuter = exploration?.areaName === 'star-forest' && exploration?.tier === 'outer';
    const isFirstNode = tianmengNodeIdxRef.current === 0;
    const canTrigger = canTriggerTianmeng();
    logger.info('[天梦冰蚕] 条件检查：胜利=' + isVictory + ', 遭遇战=' + isEncounter + ', 星斗外围=' + isStarForestOuter + ', 第一节点=' + isFirstNode + ', 奇遇条件=' + canTrigger);
    if (
      isVictory &&
      isEncounter &&
      isStarForestOuter &&
      isFirstNode &&
      canTrigger
    ) {
      tianmengTriggeredRef.current = true;
      // 延迟一帧再打开，确保战斗覆盖层已卸载、弹窗在地图层渲染
      const timer = requestAnimationFrame(() => {
        // 弹窗一出现就标记为已触发（100%触发，一生仅一次，防止刷新后重复触发）
        logger.info('[天梦冰蚕] 🎉 所有条件满足，触发奇遇弹窗！');
        markTianmengTriggered();
        setShowTianmengDialog(true);
      });
      return () => cancelAnimationFrame(timer);
    }
  }, [inBattle, lastBattleResult, exploration, canTriggerTianmeng, markTianmengTriggered]);

  const handleAcceptTianmeng = () => {
    const result = acceptTianmengSacrifice();
    if (result.success) {
      setShowTianmengDialog(false);
      toast.success('🌟 天梦冰蚕献祭完成！灵眸进化为冰灵之眸！');
    }
  };

  const handleRejectTianmeng = () => {
    rejectTianmengSacrifice();
    setShowTianmengDialog(false);
    toast.info('你拒绝了天梦冰蚕的献祭，与这份机缘擦肩而过。');
  };

  // === 新生任务：点击完成 ===
  const completeTask = (task: FreshTask) => {
    if (!player) return;
    const cooldownUntil = player.freshTaskCooldowns[task.id] || 0;
    const now = Date.now();
    // 异常冷却值（>1小时）视为脏数据，自动放行
    const remaining = cooldownUntil - now;
    if (cooldownUntil > now && remaining <= 60 * 60 * 1000) {
      const left = Math.ceil(remaining / 1000);
      toast.error(`冷却中，还剩 ${left} 秒`);
      return;
    }
    if (task.type === 'level') {
      if (player.level < task.target) {
        toast.error(`需要达到 ${task.target} 级才能完成`);
        return;
      }
    }
    const count = player.freshTaskProgress[task.id] || 0;
    setPlayer((p) => {
      const curNow = Date.now();
      return {
        ...p,
        freshTaskProgress: { ...p.freshTaskProgress, [task.id]: count + 1 },
        // 严格 60 秒冷却，毫秒级时间戳
        freshTaskCooldowns: { ...p.freshTaskCooldowns, [task.id]: curNow + 60 * 1000 },
      };
    });
    addExp(task.expReward);
    addCoins(task.coinReward);
    toast.success(`任务完成！获得 ${task.expReward} 经验、${task.coinReward} 金魂币`);
  };

  // === 渲染：大地图 ===
  if (!player) return null;

  if(view==='dragonValley')return <DragonValleyPanel onBack={()=>setView('bigMap')}/>;
  if(view==='abyssFrontier')return <AbyssFrontierPanel onBack={()=>setView('bigMap')}/>;
  if (view === 'bigMap') {
     const coreRegions = [
       { id: 'shrek', name: '史莱克学院', desc: '大陆第一学院，魂师的圣地', icon: GraduationCap, locked: false, tag: '修炼·学院', action: enterShrekAcademy },
       { id: 'star-forest', name: '星斗大森林', desc: '魂兽栖息之地，猎魂的主要场所', icon: Swords, locked: false, tag: '猎魂·探索', action: enterStarForest },
       { id: 'sun-mountains', name: '日月山脉', desc: '蕴藏魂导材料的连绵山脉', icon: Zap, locked: false, tag: '锻造·材料', action: enterSunMountains },
       { id: 'beiji', name: '极北之地', desc: '冰属性魂兽的极寒圣地', icon: Snowflake, locked: false, tag: '猎魂·极寒', action: enterBeiji },
     ];

     const secretRegions = [
       {id:'dragon-valley',name:'龙谷 · 龙魂遗迹',desc:'三大区域，探索龙魂遗迹与封印试炼',icon:Shield,locked:player.level<60,tag:'龙魂·探索',action:()=>setView('dragonValley'),lockedMsg:'需达到60级'},
       {id:'abyss-frontier',name:'血神军团 · 深渊前线',desc:'三章九关，赢取军功与神锻结晶',icon:Shield,locked:player.level<99,tag:'后期·斗铠',action:()=>setView('abyssFrontier'),lockedMsg:'需达到99级'},
       { id: 'spirit-tower', name: '传灵塔', desc: '传承魂灵的神秘之地，12属性副本', icon: Ghost, locked: (player?.level ?? 0) < 20, tag: '魂灵·契约', action: enterSpiritTower, lockedMsg: '需达到20级方可进入' },
       { id: 'tea-city', name: '茶城', desc: '茶香氤氲的邂逅之城，名士佳人云集', icon: Sparkles, locked: (player?.level ?? 0) < 60, tag: '邂逅·伴侣', action: enterTeaCity, lockedMsg: '需达到60级方可进入' },
       { id: 'ice-fire-eye', name: '冰火两仪眼', desc: '天然聚宝盆，珍稀仙草遍地的阴阳秘境', icon: Flower2, locked: (player?.level ?? 0) < 20, tag: '仙草·探秘', action: enterIceFireEye, lockedMsg: '需达到20级方可进入' },
     ];

     const renderRegionCard = (r: any, idx: number) => {
       const Icon = r.icon;
       return (
         <motion.button
           key={r.id}
           initial={{ opacity: 0, y: 12 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.35, delay: idx * 0.06 }}
           onClick={r.action}
           disabled={r.locked}
           className={`group relative overflow-hidden rounded-xl border text-left transition-all duration-300 ${
             r.locked
               ? 'border-border/20 bg-card/20 opacity-50 cursor-not-allowed'
               : 'border-cyan-500/30 bg-gradient-to-br from-card/60 to-background/40 hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(212_168_67_0.15)] active:scale-[0.99]'
           }`}
         >
           {/* 顶部金边装饰 */}
           {!r.locked && (
             <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
           )}

           <div className="relative p-4 md:p-5">
             <div className="flex items-start gap-4">
               <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shrink-0 ${
                 r.locked
                   ? 'bg-muted/30 border border-border/30'
                   : 'bg-black/40 border border-cyan-500/40'
               }`} style={!r.locked ? { boxShadow: 'inset 0 0 15px rgba(34,211,238,0.1)' } : {}}>
                 {r.locked
                   ? <Lock className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
                   : <Icon className="h-5 w-5 md:h-6 md:w-6 text-cyan-400" />
                 }
               </div>

               <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-2 mb-1 flex-wrap">
                   <div className="font-bold text-sm md:text-base text-cyan-100">{r.name}</div>
                   <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                     r.locked
                       ? 'bg-muted/40 text-muted-foreground border border-border/30'
                       : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                   }`}>
                     {r.tag}
                   </span>
                 </div>
                 <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                   {r.locked ? (r.lockedMsg || '暂不开放') : r.desc}
                 </div>
               </div>

               {!r.locked && (
                 <div className="shrink-0 flex items-center text-cyan-400/60 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all">
                   <ChevronRight className="h-5 w-5" />
                 </div>
               )}
             </div>
           </div>
         </motion.button>
       );
     };

     return (
        <div className="space-y-6 md:space-y-8">
          {/* 页头 */}
          <div className="text-center relative">
            <div className="absolute inset-0 -top-4 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
            <h2 className="text-2xl md:text-4xl font-bold text-cyan-200 relative" style={{ fontFamily: "'Noto Serif SC', serif", textShadow: '0 0 20px rgba(34,211,238,0.4)' }}>
             斗罗大陆
           </h2>
           <p className="text-xs text-muted-foreground mt-2 tracking-[0.3em]">选择区域开始探索</p>
           <div className="flex items-center justify-center gap-3 mt-3">
             <div className="w-12 h-px bg-gradient-to-r from-transparent to-cyan-500/40" />
             <MapPin className="h-3.5 w-3.5 text-cyan-400/60" />
             <div className="w-12 h-px bg-gradient-to-l from-transparent to-cyan-500/40" />
           </div>
         </div>

         {/* 核心区域 */}
         <div className="space-y-3">
           <div className="flex items-center gap-2 px-1">
             <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-cyan-400 to-cyan-600" />
             <h3 className="text-sm font-bold text-foreground">核心区域</h3>
             <span className="text-[10px] text-muted-foreground ml-1">新手修炼与猎魂的主要场所</span>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
             {coreRegions.map((r, i) => renderRegionCard(r, i))}
           </div>
         </div>

         {/* 秘境圣地 */}
         <div className="space-y-3">
           <div className="flex items-center gap-2 px-1">
             <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-amber-400 to-amber-600" />
             <h3 className="text-sm font-bold text-foreground">秘境圣地</h3>
             <span className="text-[10px] text-muted-foreground ml-1">珍稀资源与高阶挑战</span>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
             {secretRegions.map((r, i) => renderRegionCard(r, i + coreRegions.length))}
           </div>
         </div>
       </div>
     );
   }

  // === 渲染：星斗大森林区域选择 ===
  if (view === 'starForest') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={backToBigMap}
            className="p-1.5 rounded-lg bg-card/40 border border-cyan-500/20 hover:bg-card/60 transition-colors text-cyan-300"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-cyan-200" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              星斗大森林
            </h2>
            <p className="text-[10px] text-muted-foreground -mt-0.5">魂兽栖息之地 · 猎魂主场</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {FOREST_ZONES.map((zone) => {
            const isLocked = zone.locked || player.level < zone.unlockLevel;
            const canAfford = getCurrentStamina().current >= zone.staminaCost;
            const dangerLevel = zone.id === 'outer' ? 1 : zone.id === 'middle' ? 2 : zone.id === 'inner' ? 3 : zone.id === 'core' ? 4 : 5;
            return (
                <button
                  key={zone.id}
                  onClick={() => {
                     if (isLocked) return;
                     if (zone.id === 'life-lake') {
                       enterLifeLake();
                      } else if (zone.isMillionYear) {
                        // 百万年魂兽区域：进入区域详情页展示3个年限副本
                        setSelectedForestZone(zone);
                        setView('starForestZone');
                      } else {
                       setSelectedForestZone(zone);
                       setView('starForestZone');
                     }
                  }}
                   disabled={isLocked}
                className={`group relative overflow-hidden rounded-xl border text-left transition-all duration-300 ${
                  isLocked
                    ? 'border-border/20 bg-card/20 opacity-50 cursor-not-allowed'
                    : 'border-cyan-500/30 bg-gradient-to-br from-card/70 to-background/50 hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(212_168_67_0.12)] active:scale-[0.99]'
                }`}
              >
                {/* 顶部金边装饰 */}
                {!isLocked && canAfford && (
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
                )}

                <div className="relative p-4">
                  {/* 顶部：标题 + 进入按钮 */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg ${
                      isLocked
                        ? 'bg-muted/30 border border-border/30 text-muted-foreground'
                        : 'bg-black/40 border border-cyan-500/40 text-cyan-300'
                    }`} style={!isLocked ? { boxShadow: 'inset 0 0 12px rgba(34,211,238,0.1)' } : {}}>
                      {isLocked ? <Lock className="h-5 w-5" /> : dangerLevel}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-bold text-base text-cyan-100">{zone.name}</div>
                       {(zone.id === 'core' || zone.id === 'life-lake') && (
                           <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-500/30">
                             极度危险
                           </span>
                         )}
                         {zone.isMillionYear && (
                           <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-900/40 text-yellow-300 border border-yellow-500/40">
                             百万年·禁忌
                           </span>
                         )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <div className="flex items-center gap-1 text-cyan-400/80">
                          <Zap className="h-3 w-3" />
                          <span className="tabular-nums font-medium">{zone.staminaCost} 体力</span>
                        </div>
                        {player.level < zone.unlockLevel && !zone.locked && (
                          <span className="text-cyan-400/70">需{zone.unlockLevel}级</span>
                        )}
                      </div>
                    </div>

                    {/* 进入按钮移到右上角 */}
                     <span className={`text-xs font-medium px-3 py-1.5 rounded-lg shrink-0 ${
                       isLocked
                         ? 'bg-muted/40 text-muted-foreground'
                         : zone.id === 'life-lake'
                           ? 'bg-red-500/20 text-red-300 border border-red-400/40 group-hover:bg-red-500/30 transition-colors'
                           : zone.isMillionYear
                             ? 'bg-gradient-to-r from-yellow-600 to-amber-400 text-yellow-950 font-bold group-hover:from-yellow-500 group-hover:to-amber-300 transition-all shadow shadow-yellow-500/20'
                             : canAfford
                               ? 'bg-gradient-to-r from-cyan-600 to-cyan-400 text-cyan-950 font-bold group-hover:from-cyan-500 group-hover:to-cyan-300 transition-all shadow shadow-cyan-500/20'
                               : 'bg-red-900/40 text-red-400 border border-red-500/30'
                     }`}>
                       {zone.locked ? '暂不开放' : player.level < zone.unlockLevel ? `需${zone.unlockLevel}级` : zone.id === 'life-lake' ? '进入' : zone.isMillionYear ? '选择属性' : '查看详情'}
                     </span>
                  </div>

                  {/* 下方：介绍 */}
                  <div className="pt-3 border-t border-cyan-500/10">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{zone.description}</p>
                    <p className="text-[10px] text-cyan-300/60 mt-1.5">{zone.yearsDesc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // === 渲染：星斗大森林 - 单区域详情 ===
  if (view === 'starForestZone' && selectedForestZone) {
    const zone = selectedForestZone;
    const isLocked = zone.locked || player.level < zone.unlockLevel;
    const canAfford = getCurrentStamina().current >= zone.staminaCost;
    const dangerLevel = zone.id === 'outer' ? 1 : zone.id === 'middle' ? 2 : zone.id === 'inner' ? 3 : zone.id === 'core' ? 4 : 5;

    const handleEnter = () => {
      if (isLocked) return;
      // v2.0：生命之湖保持原逻辑（凶兽挑战），其他区域进入副本列表
      if (zone.id === 'life-lake') {
        enterLifeLake();
        return;
      }
      setCurrentZone(zone);
      setView('starForestDungeons');
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('starForest')}
            className="p-1.5 rounded-lg bg-card/40 border border-cyan-500/20 hover:bg-card/60 transition-colors text-cyan-300"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-cyan-200" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              {zone.name}
            </h2>
            <p className="text-[10px] text-muted-foreground -mt-0.5">星斗大森林 · 第{dangerLevel}危险区</p>
          </div>
        </div>

        {/* 生命之湖特殊处理：保持凶兽挑战入口 */}
        {zone.id === 'life-lake' ? (
          <button
            onClick={handleEnter}
            disabled={isLocked}
            className={`w-full h-14 rounded-xl font-bold text-base transition-all ${
              isLocked
                ? 'bg-muted/40 text-muted-foreground cursor-not-allowed border border-border/30'
                : 'bg-gradient-to-r from-red-600 via-orange-500 to-red-600 text-white border border-red-400/50 shadow-[0_0_25px_rgba(239_68_68_0.3)] hover:shadow-[0_0_35px_rgba(239_68_68_0.5)] active:scale-[0.98]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Swords className="h-5 w-5" />
              {isLocked ? `需${zone.unlockLevel}级` : '挑战十大凶兽'}
            </div>
          </button>
        ) : zone.isMillionYear ? (
          <button
            onClick={handleEnter}
            disabled={isLocked}
            className={`w-full h-14 rounded-xl font-bold text-base transition-all ${
              isLocked
                ? 'bg-muted/40 text-muted-foreground cursor-not-allowed border border-border/30'
                : 'bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-600 text-yellow-950 border border-yellow-400/50 shadow-[0_0_25px_rgba(251_191_36_0.3)] hover:shadow-[0_0_35px_rgba(251_191_36_0.5)] active:scale-[0.98]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Crown className="h-5 w-5" />
              {isLocked ? (player.level < zone.unlockLevel ? `需${zone.unlockLevel}级` : '暂不开放') : '选择年限副本'}
            </div>
          </button>
        ) : (
          <button
            onClick={handleEnter}
            disabled={isLocked}
            className={`w-full h-14 rounded-xl font-bold text-base transition-all ${
              isLocked
                ? 'bg-muted/40 text-muted-foreground cursor-not-allowed border border-border/30'
                : 'bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-600 text-cyan-950 border border-cyan-400/50 shadow-[0_0_25px_rgba(212_168_67_0.3)] hover:shadow-[0_0_35px_rgba(212_168_67_0.5)] active:scale-[0.98]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Swords className="h-5 w-5" />
              {isLocked ? (player.level < zone.unlockLevel ? `需${zone.unlockLevel}级` : '暂不开放') : '选择副本'}
            </div>
          </button>
        )}

        {/* 区域介绍 */}
        <div className="rounded-xl border border-cyan-500/25 bg-gradient-to-br from-card/70 to-background/50 p-4 space-y-3">
          <div>
            <div className="text-xs font-semibold text-cyan-300 mb-1.5">区域介绍</div>
            <p className="text-sm text-foreground/90 leading-relaxed">{zone.description}</p>
          </div>
          <div>
            <div className="text-xs font-semibold text-cyan-300 mb-1.5">魂兽年限</div>
            <p className="text-sm text-cyan-200/80">{zone.yearsDesc}</p>
          </div>
           {zone.id !== 'life-lake' && !zone.isMillionYear && (
            <div>
              <div className="text-xs font-semibold text-cyan-300 mb-1.5">副本模式</div>
              <p className="text-xs text-muted-foreground leading-relaxed">该区域分为 3 个年限副本，每个副本 6 节点随机探索。击败魂兽可获得修为、魂币，并有几率获得魂环。各副本有小概率遇到更高年限魂兽。</p>
            </div>
          )}
        </div>

        {/* 危险等级 */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">危险等级</span>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < dangerLevel
                    ? dangerLevel >= 4 ? 'bg-red-500' : dangerLevel >= 3 ? 'bg-orange-500' : 'bg-yellow-500'
                    : 'bg-muted/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // === 渲染：星斗大森林 - 副本列表 ===
  if (view === 'starForestDungeons' && currentZone) {
    const dungeons = FOREST_DUNGEONS[currentZone.id] || [];
    return (
      <div className="space-y-4">
        <SweepSettings />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('starForestZone')}
            className="p-1.5 rounded-lg bg-card/40 border border-cyan-500/20 hover:bg-card/60 transition-colors text-cyan-300"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-cyan-200" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              {currentZone.name} · 副本
            </h2>
            <p className="text-[10px] text-muted-foreground -mt-0.5">选择目标年限副本进入探索</p>
          </div>
        </div>

        <div className="space-y-3">
           {dungeons.map((dun, idx) => {
             const locked = player.level < dun.unlockLevel;
             const canAfford = getCurrentStamina().current >= dun.staminaCost;
             const areaKey = `forest-${currentZone?.id}-${dun.id}`;
             const sweepCount = getSweepCount(areaKey);
             const sweepUnlocked = sweepCount >= 10;
             const sweepCost = dun.staminaCost * 6;
             const canSweepAfford = getCurrentStamina().current >= sweepCost;
             return (
               <div
                 key={dun.id}
                 className={`w-full rounded-xl border p-4 transition-all ${
                   locked
                     ? 'bg-muted/20 border-border/20 opacity-60'
                     : 'bg-gradient-to-br from-card/70 to-background/50 border-cyan-500/25'
                 }`}
               >
                 <button
                   onClick={() => {
                     if (locked) { toast.error(`需要 ${dun.unlockLevel} 级`); return; }
                     if (!canAfford) { toast.error('体力不足'); return; }
                     setCurrentForestDungeon(dun);
                     startForestDungeonExploration(currentZone!, dun);
                   }}
                   disabled={locked}
                   className="w-full text-left"
                 >
                   <div className="flex items-start justify-between gap-3">
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2">
                         <span className="text-sm font-bold text-cyan-100">副本 {idx + 1}</span>
                         <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                           {dun.name}
                         </span>
                       </div>
                       <div className="text-xs text-cyan-200/80 mt-1.5">{dun.yearsDesc}</div>
                       <div className="text-[10px] text-muted-foreground mt-1">
                         小概率遇到更高年限魂兽 · 6节点探索
                       </div>
                     </div>
                     <div className="text-right shrink-0 space-y-1">
                       <div className={`text-xs font-medium ${
                         canAfford ? 'text-amber-400' : 'text-red-400'
                       }`}>
                         {dun.staminaCost} 体力
                       </div>
                       {locked && (
                         <div className="text-[10px] text-red-400">需{dun.unlockLevel}级</div>
                       )}
                       {!locked && canAfford && (
                         <div className="text-[10px] text-cyan-300">进入 →</div>
                       )}
                     </div>
                   </div>
                 </button>

                 {/* 扫荡进度 + 扫荡按钮 */}
                 {!locked && (
                   <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-3">
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center justify-between text-[10px] mb-1">
                         <span className="text-muted-foreground">扫荡进度</span>
                         <span className={sweepUnlocked ? 'text-green-400 font-medium' : 'text-cyan-300'}>
                           {sweepUnlocked ? '已解锁' : `${Math.min(sweepCount, 10)}/10`}
                         </span>
                       </div>
                       <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                         <div
                           className={`h-full transition-all duration-300 ${sweepUnlocked ? 'bg-green-500' : 'bg-cyan-500'}`}
                           style={{ width: `${Math.min(100, (sweepCount / 10) * 100)}%` }}
                         />
                       </div>
                     </div>
                     <button
                       onClick={() => handleSweepForest(currentZone!, dun)}
                       disabled={!sweepUnlocked || !canSweepAfford}
                       className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                         sweepUnlocked && canSweepAfford
                           ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-amber-950 hover:from-amber-400 hover:to-amber-300 shadow-[0_0_10px_rgba(251_191_36_0.3)] active:scale-[0.97]'
                           : 'bg-muted/40 text-muted-foreground cursor-not-allowed border border-border/30'
                       }`}
                     >
                       <SparklesIcon className="h-3 w-3" />
                       扫荡
                     </button>
                   </div>
                 )}
                 {!locked && sweepUnlocked && (
                   <div className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                     <Zap className="h-3 w-3" />
                     扫荡消耗 {sweepCost} 体力（6节点×单节点消耗）
                   </div>
                 )}
               </div>
             );
           })}
         </div>
      </div>
    );
  }

  // === 渲染：日月山脉区域选择 ===
  if (view === 'sun-mountains') {
    const tierColors: Record<number, string> = {
      1: '#94a3b8', 2: '#4ade80', 3: '#60a5fa', 4: '#a78bfa',
      5: '#fb923c', 6: '#f87171', 7: '#f472b6', 8: '#facc15',
      9: '#d4a843',
    };
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={backToBigMap}
            className="p-1.5 rounded-lg bg-card/40 border border-cyan-500/20 hover:bg-card/60 transition-colors text-cyan-300"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-cyan-200" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              日月山脉
            </h2>
            <p className="text-[10px] text-muted-foreground -mt-0.5">盛产魂导材料 · 锻造圣地</p>
          </div>
        </div>

         <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 md:gap-3">
          {MOUNTAIN_ZONES.map((zone) => {
            const isLocked = zone.locked || (player?.level ?? 0) < zone.unlockLevel;
            const canAfford = getCurrentStamina().current >= zone.staminaCost;
            const color = tierColors[zone.level] || '#94a3b8';
            return (
               <button
                 key={zone.id}
                 onClick={() => !isLocked && enterMountainDungeons(zone)}
                 disabled={isLocked}
                className={`group relative overflow-hidden rounded-xl border transition-all duration-300 p-3 ${
                  isLocked
                    ? 'border-border/20 bg-card/20 opacity-50 cursor-not-allowed'
                    : canAfford
                      ? 'border-cyan-500/20 bg-gradient-to-br from-card/60 to-background/40 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(212_168_67_0.1)] active:scale-[0.98]'
                      : 'border-red-500/20 bg-card/30 opacity-70 cursor-not-allowed'
                }`}
              >
                {/* 顶部色带 */}
                {!isLocked && (
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: `linear-gradient(90deg, transparent, ${color}99, transparent)` }}
                  />
                )}

                <div className="relative text-center">
                  <div
                    className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center font-bold text-lg mb-2 border"
                    style={{
                      color: isLocked ? '#6b7280' : color,
                      borderColor: isLocked ? '#374151' : `${color}55`,
                      background: isLocked ? '#1f293733' : `${color}15`,
                      boxShadow: isLocked ? 'none' : `inset 0 0 10px ${color}20`,
                    }}
                  >
                    {isLocked ? <Lock className="h-4 w-4" /> : zone.level}
                  </div>

                  <div className="text-xs font-medium text-cyan-100 truncate">{zone.name}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">
                    {zone.staminaCost}体力
                  </div>
                  {(player?.level ?? 0) < zone.unlockLevel && !zone.locked && (
                    <div className="text-[9px] text-cyan-400/80 mt-0.5">需{zone.unlockLevel}级</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-cyan-400/50 text-center py-1">
          击败魂兽可获得对应等级的魂导材料
        </div>
      </div>
    );
  }

  // === 渲染：山脉副本列表 ===
  if (view === 'mountain-dungeons' && currentMountain) {
    const tierColors: Record<number, string> = {
      1: '#94a3b8', 2: '#4ade80', 3: '#60a5fa', 4: '#a78bfa',
      5: '#fb923c', 6: '#f87171', 7: '#f472b6', 8: '#facc15', 9: '#d4a843',
    };
    const color = tierColors[currentMountain.level] || '#94a3b8';

    return (
      <div className="space-y-4">
        <SweepSettings />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('sun-mountains')}
            className="p-1.5 rounded-lg bg-card/40 border border-cyan-500/20 hover:bg-card/60 transition-colors text-cyan-300"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-cyan-200" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              {currentMountain.name}
            </h2>
            <p className="text-[10px] text-muted-foreground -mt-0.5">选择副本进行挑战 · 消耗体力获取材料</p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground px-1">
          {currentMountain.description}
        </div>

        {/* 副本卡片列表 */}
        <div className="space-y-3">
          {currentDungeons.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm border border-dashed border-cyan-500/20 rounded-xl">
              该等级暂未开放副本
            </div>
          ) : (
            currentDungeons.map((dun) => {
              const canAfford = getCurrentStamina().current >= dun.staminaCost;
              return (
                <button
                  key={dun.id}
                  onClick={() => canAfford && setSelectedDungeon(dun)}
                  disabled={!canAfford}
                  className={`w-full text-left rounded-xl border transition-all duration-200 p-4 ${
                    canAfford
                      ? 'border-cyan-500/25 bg-gradient-to-br from-card/60 to-background/40 hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(212_168_67_0.1)] active:scale-[0.99]'
                      : 'border-border/20 bg-card/20 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="text-sm font-bold"
                          style={{ color, fontFamily: "'Noto Serif SC', serif" }}
                        >
                          {dun.name}
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300/80 border border-cyan-500/20">
                          {dun.coinReward} 金魂币
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mb-2">{dun.description}</div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-cyan-300">🐉 {dun.beastName}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{dun.beastYears.toLocaleString()}年</span>
                        <span className="text-muted-foreground">·</span>
                         <span className="text-muted-foreground">{normalizeBeastAttribute(dun.beastAttr)}</span>
                      </div>
                      {/* 掉落材料预览 */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="text-[10px] text-muted-foreground">掉落：</span>
                        {dun.drops.map((d) => (
                          <div
                            key={d.matId}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] border"
                            style={{
                              borderColor: `${d.qualityColor}40`,
                              color: d.qualityColor,
                              backgroundColor: `${d.qualityColor}0D`,
                            }}
                          >
                            <span className="font-bold">{d.iconChar}</span>
                            <span className="text-foreground/70">{d.matName}</span>
                            <span className="opacity-60">{d.quality === 'common' ? '普' : d.quality === 'fine' ? '精' : '稀'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs font-semibold text-cyan-300">{dun.staminaCost} 体力</div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* 副本详情弹窗 */}
        <AnimatePresence>
          {selectedDungeon && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              onClick={() => setSelectedDungeon(null)}
            >
               <motion.div
                 initial={{ scale: 0.85, y: 20 }}
                 animate={{ scale: 1, y: 0 }}
                 exit={{ scale: 0.9, y: 10 }}
                 transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                 className="w-full max-w-sm bg-card border border-cyan-500/30 rounded-2xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto"
                 onClick={(e) => e.stopPropagation()}
               >
                 <div className="text-center mb-4">
                   <div className="text-xs text-muted-foreground mb-1">副本</div>
                   <div
                     className="text-xl font-black"
                     style={{ fontFamily: "'Noto Serif SC', serif", color: '#fbbf24' }}
                   >
                     {selectedDungeon.name}
                   </div>
                   <div className="text-[11px] text-muted-foreground mt-1">
                     {selectedDungeon.description}
                   </div>
                 </div>

                 {/* 进入挑战按钮 - 移到顶部 */}
                 <button
                   onClick={() => {
                     const dun = selectedDungeon;
                     setSelectedDungeon(null);
                     startDungeonBattle(dun);
                   }}
                   className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-600 text-cyan-950 font-bold border border-cyan-400/50 shadow-[0_0_20px_rgba(212_168_67_0.25)] hover:shadow-[0_0_30px_rgba(212_168_67_0.4)] active:scale-[0.98] transition-all mb-4"
                 >
                   <Swords className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                   进入挑战
                 </button>

                 {/* 魂兽信息 */}
                 <div className="rounded-xl bg-black/30 border border-cyan-500/20 p-3 mb-4">
                  <div className="text-xs text-cyan-300 mb-2 font-semibold">镇守魂兽</div>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500/20 to-red-500/20 border-2 border-cyan-500/40 flex items-center justify-center text-2xl shrink-0">
                      🐉
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="font-bold text-foreground">{selectedDungeon.beastName}</div>
                       <div className="text-[11px] text-muted-foreground">
                          {formatYearsLabel(selectedDungeon.beastYears)} · {normalizeBeastAttribute(selectedDungeon.beastAttr)}
                       </div>
                     </div>
                  </div>
                </div>

                {/* 掉落材料 */}
                 <div className="rounded-xl bg-black/30 border border-cyan-500/20 p-3 mb-4">
                   <div className="text-xs text-cyan-300 mb-2 font-semibold">可能掉落</div>
                   <div className="space-y-2">
                     {selectedDungeon.drops.map((d) => {
                       const qColor = MATERIAL_QUALITY_INFO[d.quality]?.color || d.qualityColor;
                       const qLabel = MATERIAL_QUALITY_INFO[d.quality]?.label || d.quality;
                       const chance = MATERIAL_QUALITY_INFO[d.quality]?.chance ?? 0;
                       return (
                         <div
                           key={d.matId}
                           className="flex items-center gap-3 p-2 rounded-lg border"
                           style={{
                             borderColor: `${qColor}30`,
                             backgroundColor: `${qColor}0A`,
                           }}
                         >
                           <div
                             className="w-10 h-10 rounded-md flex items-center justify-center text-base font-bold border shrink-0"
                             style={{
                               borderColor: `${qColor}66`,
                               color: qColor,
                               backgroundColor: `${qColor}12`,
                             }}
                           >
                             {d.iconChar}
                           </div>
                           <div className="flex-1 min-w-0">
                             <div className="text-sm font-medium text-foreground">{d.matName}</div>
                             <div className="text-[10px]" style={{ color: qColor }}>
                               {qLabel}品阶 · 掉率约{Math.round(chance * 100)}%
                             </div>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 <div className="text-[10px] text-muted-foreground/70 mt-2 text-center">
                      每次击败随机掉落 1~3 个材料
                    </div>
                  </div>

                  {/* 不掉落提示 */}
                  <div className="rounded-lg bg-red-500/5 border border-red-500/20 px-3 py-2 mb-4">
                    <div className="text-[11px] text-red-600 text-center">
                      此副本仅掉落材料与金魂币，不会掉落魂环与魂骨
                    </div>
                  </div>

                 {/* 奖励信息 */}
                 <div className="flex items-center justify-between mb-2 px-1">
                   <div className="text-xs text-muted-foreground">金魂币奖励</div>
                   <div className="text-sm font-bold text-cyan-300">+{selectedDungeon.coinReward}</div>
                 </div>
                 <div className="flex items-center justify-between mb-4 px-1">
                   <div className="text-xs text-muted-foreground">体力消耗</div>
                   <div className="text-sm font-bold text-cyan-300">-{selectedDungeon.staminaCost}</div>
                 </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
  if (view === 'shrekAcademy') {
    const notEnrolled = player?.academyRank === 'none';
    const areas = [
      { id: 'freshman', name: '新生区域', desc: '初入学院的新生学习与成长之地', rank: 'none', locked: notEnrolled, lockedMsg: '未加入学院', action: () => setView('freshman') },
      { id: 'outer', name: '外院', desc: '正式学员的修炼与竞技场所', rank: 'outer', locked: player?.academyRank !== 'outer' && player?.academyRank !== 'inner' && player?.academyRank !== 'sea-god', lockedMsg: '权限不足，需通过新生考核', needRank: 'outer' as const, action: () => setView('outerCourt') },
      { id: 'inner', name: '内院', desc: '学院核心精英培养之地', rank: 'inner', locked: player?.arenaRank !== 'king', lockedMsg: '需达到王者段位解锁', action: () => setView('innerCourt') },
       { id: 'sea-god', name: '海神阁', desc: '史莱克最高权力象征', rank: 'sea-god', locked: (player.soulRings?.length ?? 0) < 9, lockedMsg: '需吸收第九魂环', action: () => setView('seaGodPavilion') },
    ];

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={backToBigMap}
            className="p-1.5 rounded-lg bg-card/50 border border-border/40 hover:bg-card transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-bold bg-gradient-to-r from-emerald-200 to-green-400 bg-clip-text text-transparent">
            史莱克学院
          </h2>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/30 to-green-900/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-800/50 border border-emerald-500/40 flex items-center justify-center">
              <Crown className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-emerald-500/80">当前身份</div>
              <div className="text-lg font-bold text-emerald-400">
                {player?.academyRank === 'none' && '未入学'}
                {player?.academyRank === 'freshman' && '史莱克新生'}
                {player?.academyRank === 'outer' && '外院学员'}
                {player?.academyRank === 'inner' && '内院学员'}
                {player?.academyRank === 'sea-god' && '海神阁成员'}
              </div>
            </div>
          </div>
        </div>

        {/* 未加入学院时显示加入按钮 */}
        {notEnrolled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-900/40 to-green-900/20 p-4 text-center"
          >
            <GraduationCap className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-sm font-bold text-emerald-400 mb-1">加入史莱克学院</div>
            <div className="text-xs text-muted-foreground mb-3">
              成为史莱克新生，开启修炼之路
            </div>
            <button
              onClick={joinShrekAcademy}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-medium hover:from-emerald-400 hover:to-green-400 shadow-lg shadow-emerald-900/40 transition-all active:scale-95 text-sm"
            >
              立即加入
            </button>
          </motion.div>
        )}

        <div className="space-y-2">
          {areas.map((a) => {
            const isLocked = a.locked;
            return (
              <button
                key={a.id}
                onClick={a.action}
                disabled={isLocked}
                className={`w-full rounded-xl border p-4 text-left transition-all ${
                  isLocked
                    ? 'bg-muted/20 border-border/30 opacity-60 cursor-not-allowed'
                    : 'bg-gradient-to-br from-emerald-800/30 to-green-900/20 border-emerald-500/30 hover:border-emerald-400/50 active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isLocked ? 'bg-muted/40' : 'bg-emerald-800/50 border border-emerald-500/40'}`}>
                    {isLocked ? <Lock className="h-5 w-5 text-muted-foreground" /> : <GraduationCap className="h-5 w-5 text-emerald-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-foreground">{a.name}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {isLocked ? (a.lockedMsg || '权限不足') : a.desc}
                    </div>
                  </div>
                  {!isLocked && <ArrowLeft className="h-4 w-4 rotate-180 text-emerald-500/70" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // === 渲染：新生区域 ===
  if (view === 'freshman') {
    const isFreshman = player?.academyRank === 'freshman' || player?.academyRank === 'outer';
    const notEnrolled = player?.academyRank === 'none';
    const canExam = (player?.level ?? 0) >= 10 && isFreshman && player?.academyRank !== 'outer';
    const examCooldownLeft = player ? Math.max(0, player.examCooldownUntil - Date.now()) : 0;
    const examCooldownMin = Math.floor(examCooldownLeft / 60000);
    const examCooldownSec = Math.floor((examCooldownLeft % 60000) / 1000);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('shrekAcademy')}
            className="p-1.5 rounded-lg bg-card/50 border border-border/40 hover:bg-card transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-bold text-emerald-400">新生区域</h2>
        </div>

        {notEnrolled ? (
          <div className="rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-900/40 to-green-900/20 p-5 text-center">
            <GraduationCap className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-emerald-400 mb-1">加入史莱克学院</div>
            <div className="text-xs text-muted-foreground mb-4">
              成为史莱克新生，解锁新生任务与考核
            </div>
            <button
              onClick={joinShrekAcademy}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-medium hover:from-emerald-400 hover:to-green-400 shadow-lg shadow-emerald-900/40 transition-all active:scale-95"
            >
              加入史莱克学院
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setView('freshTasks')}
              className="w-full rounded-xl border p-4 text-left transition-all bg-cyan-900/30 border-cyan-500/30 hover:border-cyan-400/50 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-800/50 border border-cyan-500/40 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-cyan-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-foreground">新生任务</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    完成6个难度递增的任务，获得经验奖励
                  </div>
                </div>
                <ArrowLeft className="h-4 w-4 rotate-180 text-cyan-400/70" />
              </div>
            </button>

            <button
              onClick={() => canExam && examCooldownLeft === 0 && setView('exam')}
              disabled={!canExam || examCooldownLeft > 0}
              className={`w-full rounded-xl border p-4 text-left transition-all ${
                canExam && examCooldownLeft === 0
                  ? 'bg-cyan-900/30 border-cyan-500/30 hover:border-cyan-400/50 active:scale-[0.99]'
                  : 'bg-muted/20 border-border/30 opacity-70 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${canExam ? 'bg-cyan-800/50 border border-cyan-500/40' : 'bg-muted/40'}`}>
                  {canExam ? <Swords className="h-5 w-5 text-cyan-400" /> : <AlertTriangle className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-foreground">新生考核</div>
                   <div className="text-[11px] text-muted-foreground mt-0.5">
                     {player?.examPassed
                       ? '已通过新生考核'
                       : !canExam
                        ? '需达到 10 级开启'
                       : examCooldownLeft > 0
                         ? `冷却中：${examCooldownMin}分${examCooldownSec}秒`
                         : '通过考核即可成为外院学员，解锁竞技场'}
                   </div>
                </div>
                {canExam && examCooldownLeft === 0 && <ArrowLeft className="h-4 w-4 rotate-180 text-cyan-400/70" />}
              </div>
            </button>
          </>
        )}
      </div>
    );
  }

  // === 渲染：新生任务列表 ===
  if (view === 'freshTasks') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('freshman')}
            className="p-1.5 rounded-lg bg-card/50 border border-border/40 hover:bg-card transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-bold text-cyan-200">新生任务</h2>
        </div>

        <div className="space-y-2">
          {FRESH_TASKS.map((task, idx) => {
            const completed = player ? (player.freshTaskProgress[task.id] || 0) : 0;
             const cooldownUntil = player ? (player.freshTaskCooldowns[task.id] || 0) : 0;
            const now = Date.now();
            // 异常兜底：冷却剩余>1小时视为异常值，重置为0，避免显示错乱
            let isCooldown = cooldownUntil > now && (cooldownUntil - now) <= 60 * 60 * 1000;
            const cooldownLeft = isCooldown ? Math.min(60, Math.ceil((cooldownUntil - now) / 1000)) : 0;
            const min = Math.floor(cooldownLeft / 60);
            const sec = cooldownLeft % 60;
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-xl border p-3 bg-cyan-900/20 border-cyan-500/30"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-800/40 flex items-center justify-center text-cyan-300 font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{task.name}</span>
                      {completed > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/40 text-green-400 border border-green-500/30">
                          已完成 {completed} 次
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{task.description}</p>
                     <div className="flex items-center justify-between mt-2">
                       <div className="text-[11px] text-cyan-300/80 flex items-center gap-2">
                          <span>经验 +{task.expReward}</span>
                          <span className="text-yellow-600 flex items-center gap-0.5">
                            <Coins className="h-3 w-3" /> +{task.coinReward}
                          </span>
                        </div>
                       <button
                         onClick={() => completeTask(task)}
                         disabled={isCooldown || (task.type === 'level' && (player?.level ?? 0) < task.target)}
                         className="px-3 py-1 rounded-md bg-gradient-to-r from-cyan-600 to-cyan-400 text-white text-xs font-medium hover:from-cyan-400 hover:to-cyan-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         {isCooldown
                           ? `冷却中 ${min}:${sec.toString().padStart(2, '0')}`
                           : task.type === 'level' ? '领取奖励' : '完成任务'}
                       </button>
                     </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // === 渲染：新生考核入口（战前确认） ===
  if (view === 'exam') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('freshman')}
            className="p-1.5 rounded-lg bg-card/50 border border-border/40 hover:bg-card transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-bold text-cyan-300">新生考核</h2>
        </div>

        <div className="rounded-xl border border-cyan-500/30 bg-cyan-900/20 p-5">
          <div className="text-center">
            <div className="text-cyan-300 text-sm mb-2">外院入学考核</div>
             <div className="text-xl font-bold text-cyan-50 mb-3">对战百年魂兽</div>
             <div className="text-xs text-muted-foreground mb-5 leading-relaxed">
               战胜一只百年魂兽，证明你有资格进入外院。<br/>
               战斗胜利：成为外院学员，解锁竞技场<br/>
               战斗失败：1分钟冷却后方可再次挑战
             </div>

             {player?.examPassed ? (
               <div className="px-8 py-3 rounded-xl bg-green-900/40 border border-green-500/30 text-green-400 font-bold">
                 ✓ 已通过考核
               </div>
             ) : (
               <button
                 onClick={startExamBattle}
                 className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-500 text-white font-bold hover:from-cyan-400 hover:to-cyan-400 shadow-lg shadow-cyan-900/40 transition-all active:scale-95"
               >
                 <div className="flex items-center gap-2">
                   <Swords className="h-5 w-5" />
                   开始考核
                 </div>
               </button>
             )}
          </div>
        </div>
      </div>
    );
  }

  // === 渲染：外院 ===
  if (view === 'outerCourt') {
    const isOuterOrAbove = player && ['outer', 'inner', 'sea-god'].includes(player.academyRank);
    if (!isOuterOrAbove) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('shrekAcademy')}
              className="p-1.5 rounded-lg bg-card/50 border border-border/40 hover:bg-card transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-bold text-blue-400">外院</h2>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-red-900/20 p-6 text-center">
            <Lock className="h-10 w-10 text-red-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-red-400 mb-1">权限不足</div>
            <div className="text-xs text-muted-foreground mb-4">
              通过新生考核（10级+战胜百年魂兽）后才能进入外院
            </div>
            <button
              onClick={() => setView('freshman')}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-500 text-white text-sm font-medium hover:from-cyan-400 hover:to-cyan-400 transition-all"
            >
              前往新生考核
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('shrekAcademy')}
            className="p-1.5 rounded-lg bg-card/50 border border-border/40 hover:bg-card transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-bold text-blue-400">外院</h2>
        </div>

        <div className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-900/30 to-cyan-900/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-800/50 border border-blue-500/40 flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-blue-600">当前身份</div>
              <div className="text-lg font-bold text-blue-400">外院学员</div>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setArenaResult(null);
            setView('arena');
          }}
          className="w-full rounded-xl border p-4 text-left transition-all bg-gradient-to-br from-yellow-900/30 to-cyan-900/20 border-yellow-500/30 hover:border-yellow-400/50 active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-800/50 border border-yellow-500/40 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-foreground">竞技场</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                与其他魂师对战，提升段位，获得金魂币奖励
              </div>
            </div>
            <ArrowLeft className="h-4 w-4 rotate-180 text-yellow-600" />
          </div>
        </button>
      </div>
    );
  }

  // === 渲染：竞技场 ===
  if (view === 'arena') {
    const isOuterOrAbove = player && ['outer', 'inner', 'sea-god'].includes(player.academyRank);
    if (!isOuterOrAbove) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('outerCourt')}
              className="p-1.5 rounded-lg bg-card/50 border border-border/40 hover:bg-card transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-bold text-yellow-700">竞技场</h2>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-red-900/20 p-6 text-center">
            <Lock className="h-10 w-10 text-red-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-red-400 mb-1">权限不足</div>
            <div className="text-xs text-muted-foreground">
              通过新生考核成为外院学员后才能使用竞技场
            </div>
          </div>
        </div>
      );
    }

    const rank = player?.arenaRank ?? 'bronze';
    const stars = player?.arenaStars ?? 0;
    const rankColor = ARENA_RANK_COLORS[rank];
    const totalStars = getTotalArenaStars(rank, stars);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('outerCourt')}
            className="p-1.5 rounded-lg bg-card/50 border border-border/40 hover:bg-card transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-bold text-yellow-700">竞技场</h2>
        </div>

        {/* 段位展示 */}
        <div
          className="rounded-xl border p-5 text-center relative overflow-hidden"
          style={{
            borderColor: `${rankColor}50`,
            background: `linear-gradient(135deg, ${rankColor}15, transparent)`,
            boxShadow: `0 0 40px ${rankColor}20, inset 0 1px 0 ${rankColor}30`,
          }}
        >
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: `${rankColor}20` }} />
          <div className="relative">
            <div className="text-xs text-muted-foreground mb-1">当前段位</div>
            <div
              className="text-3xl font-black mb-2"
              style={{ color: rankColor, textShadow: `0 0 20px ${rankColor}60` }}
            >
              {ARENA_RANK_LABEL[rank]}
            </div>
            <div className="flex items-center justify-center gap-1 mb-1">
              {Array.from({ length: rank === 'king' ? Math.min(stars, 5) : 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${i < stars ? 'fill-current' : 'opacity-20'}`}
                  style={{ color: i < stars ? rankColor : '#666' }}
                />
              ))}
              {rank === 'king' && stars > 5 && (
                <span className="text-xs ml-1" style={{ color: rankColor }}>+{stars - 5}</span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {rank === 'king' ? `王者 ${stars} 星（无限星）` : `${stars} / 5 星`}
            </div>
            <div className="text-[10px] text-muted-foreground mt-2">
              累计 {totalStars} 星 · 对手属性加成：{(totalStars * 4).toFixed(0)}%
            </div>
          </div>
        </div>

         {/* 对战模式选择 */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => setArenaMode('single')}
            className={`rounded-xl border p-4 text-center transition-all ${
              arenaMode === 'single'
                ? 'bg-gradient-to-br from-yellow-600/30 to-cyan-700/20 border-yellow-500/50 shadow-lg shadow-yellow-900/20'
                : 'bg-card/30 border-border/30 hover:border-border/60'
            }`}
          >
            <Swords className="h-6 w-6 mx-auto mb-2" style={{ color: arenaMode === 'single' ? '#ffd700' : undefined }} />
            <div className="font-bold text-sm">单人战</div>
            <div className="text-[10px] text-muted-foreground mt-1">获胜 +1 星</div>
          </button>
          <button
            disabled
            className="rounded-xl border p-4 text-center opacity-50 cursor-not-allowed bg-muted/20 border-border/30"
          >
            <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <div className="font-bold text-sm">四人战</div>
            <div className="text-[10px] text-muted-foreground mt-1">暂不开放</div>
          </button>
        </div>

        {/* 开始对战按钮 */}
        <button
          onClick={startArenaBattle}
          disabled={arenaMode !== 'single'}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-cyan-500 text-white font-bold hover:from-yellow-400 hover:to-cyan-400 shadow-lg shadow-yellow-900/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center gap-2">
            <Swords className="h-5 w-5" />
            开始对战
          </div>
        </button>

        {/* 结果弹窗 */}
        <AnimatePresence>
          {arenaResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              onClick={() => setArenaResult(null)}
            >
              <motion.div
                initial={{ scale: 0.85, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="rounded-2xl border-2 p-6 text-center relative overflow-hidden"
                  style={{
                    backgroundColor: arenaResult.win ? 'rgba(251,191,36,0.08)' : 'rgba(239,68,68,0.08)',
                    borderColor: arenaResult.win ? 'rgba(251,191,36,0.5)' : 'rgba(239,68,68,0.5)',
                    boxShadow: arenaResult.win ? '0 0 60px rgba(251,191,36,0.2)' : '0 0 60px rgba(239,68,68,0.2)',
                  }}
                >
                  <div className="text-3xl mb-2">{arenaResult.win ? '🎉' : '💔'}</div>
                  <div className="text-2xl font-black mb-1" style={{ color: arenaResult.win ? '#fbbf24' : '#ef4444' }}>
                    {arenaResult.win ? '战斗胜利！' : '战斗失败'}
                  </div>
                  <div className="text-xs text-muted-foreground mb-4">
                    对手：{arenaResult.opponent}
                  </div>

                  <div className="space-y-2 mb-5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">星级变化</span>
                      <span style={{ color: arenaResult.win ? '#fbbf24' : '#ef4444' }}>
                        {arenaResult.win ? '+' : ''}{arenaResult.stars} 星
                      </span>
                    </div>
                    {arenaResult.rankUp && (
                      <div className="text-center text-yellow-600 font-bold text-sm animate-pulse">
                        ✨ 段位提升！{ARENA_RANK_LABEL[arenaResult.beforeRank]} → {ARENA_RANK_LABEL[arenaResult.afterRank]}
                      </div>
                    )}
                    {arenaResult.win && arenaResult.coins > 0 && (
                      <div className="flex items-center justify-center gap-1 text-yellow-600 text-sm">
                        <Coins className="h-4 w-4" />
                        <span>+{arenaResult.coins} 金魂币</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setArenaResult(null)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-cyan-500 text-white font-medium hover:from-yellow-400 hover:to-cyan-400 transition-all active:scale-95"
                  >
                    确定
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // === 渲染：内院 ===
  if (view === 'innerCourt') {
    const isInnerOrAbove = player && player.arenaRank === 'king';
    if (!isInnerOrAbove) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('shrekAcademy')}
              className="p-1.5 rounded-lg bg-card/50 border border-border/40 hover:bg-card transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-bold text-cyan-300">内院</h2>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-red-900/20 p-6 text-center">
            <Lock className="h-10 w-10 text-red-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-red-400 mb-1">权限不足</div>
            <div className="text-xs text-muted-foreground mb-4">
              竞技场段位达到王者后才能进入内院
            </div>
            <button
              onClick={() => setView('arena')}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-cyan-500 text-white text-sm font-medium hover:from-yellow-400 hover:to-cyan-400 transition-all"
            >
              前往竞技场
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('shrekAcademy')}
            className="p-1.5 rounded-lg bg-card/50 border border-border/40 hover:bg-card transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-bold text-cyan-300">内院</h2>
        </div>

        <div className="rounded-xl border border-cyan-500/30 bg-cyan-900/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-800/50 border border-cyan-500/40 flex items-center justify-center">
              <Crown className="h-6 w-6 text-cyan-400" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-cyan-400/80">当前身份</div>
              <div className="text-lg font-bold text-cyan-300">内院学员</div>
              <div className="text-[11px] text-cyan-400/70 mt-0.5">
                王者段位特权
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setView('mentorship')}
          className="w-full rounded-xl border p-4 text-left transition-all bg-cyan-900/30 border-cyan-500/30 hover:border-cyan-400/50 active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-800/50 border border-violet-500/40 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-foreground">修炼心得</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                聆听名师指导，获得大量修为（冷却5分钟可重复）
              </div>
            </div>
            <ChevronRight className="h-4 w-4 rotate-180 text-violet-600/70" />
          </div>
        </button>
      </div>
    );
  }

  // === 渲染：名师指导 ===
  if (view === 'mentorship') {
    const handleGuidance = (teacherId: string) => {
      if (!player) return;
      const cd = getMentorCooldown(teacherId);
      if (cd > 0) {
        toast.info('导师正在休息，请稍候再试');
        return;
      }
      // 前置检查：魂环不足时给出明确提示（避免用户误以为点不动）
      const maxRingsForLevel = getMaxRings(player.level);
      if (player.soulRings.length < maxRingsForLevel) {
        toast.warning(`魂环数量不足（${player.soulRings.length}/${maxRingsForLevel}），请先猎魂获取对应魂环`);
        return;
      }
      const result = takeMentorGuidance(teacherId);
      if (result.success) {
        toast.success(`获得 ${result.expGained.toLocaleString()} 点修为！冷却5分钟后可再次指导`);
      } else {
        toast.error('指导失败，请稍后再试');
      }
    };

    const formatCooldown = (ms: number) => {
      if (ms <= 0) return '';
      const total = Math.ceil(ms / 1000);
      const m = Math.floor(total / 60);
      const s = total % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('innerCourt')}
            className="p-1.5 rounded-lg bg-card/50 border border-border/40 hover:bg-card transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-bold text-violet-700">修炼心得</h2>
        </div>

        <div className="rounded-xl border border-violet-500/20 bg-violet-50 p-3 text-xs text-violet-700 border border-violet-200">
          💡 每位导师指导后有5分钟冷却时间，冷却结束后可再次聆听指导
        </div>

        <div className="space-y-2">
           {MENTOR_TEACHERS.map((teacher) => {
             // 使用 mentorCdTick 强制每秒重渲染，保证冷却倒计时实时刷新
             void mentorCdTick;
             const cdMs = getMentorCooldown(teacher.id);
             const isCooling = cdMs > 0;
            const cdText = formatCooldown(cdMs);
            return (
              <button
                key={teacher.id}
                onClick={() => handleGuidance(teacher.id)}
                disabled={isCooling}
                className={`w-full rounded-xl border p-3 text-left transition-all ${isCooling
                  ? 'bg-muted/10 border-border/30 opacity-70 cursor-not-allowed'
                  : 'bg-cyan-900/30 border-cyan-500/30 hover:border-cyan-400/50 active:scale-[0.99]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isCooling ? 'bg-muted/40' : 'bg-violet-800/50 border border-violet-500/40'}`}>
                    <UserCog className={`h-5 w-5 ${isCooling ? 'text-muted-foreground' : 'text-violet-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{teacher.name}</span>
                      {teacher.level > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300 shrink-0 border border-amber-500/30">
                          {teacher.level}级
                        </span>
                      )}
                      {isCooling && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300 shrink-0 border border-amber-500/30 tabular-nums">
                          冷却中 {cdText}
                        </span>
                      )}
                      {!isCooling && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/40 text-green-400 shrink-0 border border-green-500/30">
                          可指导
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-violet-600/80 mt-0.5">武魂：{teacher.martialSoul}</div>
                    <div className="text-[10px] text-cyan-500/80 mt-0.5">{teacher.title}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{teacher.description}</div>
                    <div className="text-[11px] text-cyan-300 mt-1.5 font-medium">
                      修为奖励：+{teacher.expReward.toLocaleString()}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // === 渲染：属性选择界面 ===
  if (view === 'attribute-select' && attrSelectSource) {
    // 11种标准属性（含精神属性）
     const ALL_ATTRIBUTES = [
       { key: '金属性', name: '金', color: '#fbbf24', icon: '金' },
       { key: '木属性', name: '木', color: '#4ade80', icon: '木' },
       { key: '水属性', name: '水', color: '#60a5fa', icon: '水' },
       { key: '火属性', name: '火', color: '#f87171', icon: '火' },
       { key: '土属性', name: '土', color: '#a78bfa', icon: '土' },
       { key: '冰属性', name: '冰', color: '#67e8f9', icon: '冰' },
       { key: '光属性', name: '光', color: '#fde68a', icon: '光' },
       { key: '暗属性', name: '暗', color: '#6b21a8', icon: '暗' },
       { key: '时间属性', name: '时间', color: '#e879f9', icon: '时' },
       { key: '空间属性', name: '空间', color: '#22d3ee', icon: '空' },
       { key: '精神属性', name: '精神', color: '#a78bfa', icon: '灵' },
     ];
    // 计算各属性在该区域/副本的魂兽数量（用于显示）
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setAttrSelectSource(null);
              // 返回上一级：副本列表
              if (attrSelectSource.area === 'star-forest') {
                setView('starForestDungeons');
              } else if (attrSelectSource.area === 'beiji') {
                setView('beijiDungeons');
              } else {
                setView('mountain-dungeons');
              }
            }}
            className="p-1.5 rounded-lg bg-card/40 border border-cyan-500/20 hover:bg-card/60 transition-colors text-cyan-300"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-cyan-200" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              选择魂兽属性
            </h2>
            <p className="text-[10px] text-muted-foreground -mt-0.5">{attrSelectSource.title}</p>
          </div>
        </div>

        <div className="rounded-xl border border-cyan-500/25 bg-gradient-to-br from-card/70 to-background/50 p-4">
          <div className="text-xs text-muted-foreground mb-3">选择目标属性后，探索遇到的魂兽将全部为该属性，掉落的魂环属性也一致。</div>

          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {ALL_ATTRIBUTES.map((attr) => (
              <button
                key={attr.key}
                onClick={() => startExplorationWithAttribute(attr.key)}
                className="flex flex-col items-center justify-center gap-1 py-3 rounded-lg border border-border/40 bg-card/50 hover:border-cyan-400/60 hover:bg-card/80 active:scale-[0.96] transition-all"
                style={{ boxShadow: `0 0 10px ${attr.color}20` }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    backgroundColor: `${attr.color}20`,
                    color: attr.color,
                    border: `1.5px solid ${attr.color}60`,
                  }}
                >
                  {attr.icon}
                </div>
                <span className="text-xs text-foreground/90">{attr.name}属性</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // === 渲染：探索节点界面 ===
  if (view === 'exploration') {
    const completed = nodes.filter((n) => n.searched).length;
    const collectedCount = exploration?.collectedRings.length ?? 0;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleFleeExploration}
            className="p-1.5 rounded-lg bg-card/50 border border-border/40 hover:bg-card transition-colors shrink-0"
            title="返回"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate">
               {currentZone?.name || currentMountain?.name || '探索中'}
             </h2>
             <div className="text-xs text-muted-foreground">
               进度 {completed}/6 · 已收集魂环 {collectedCount} 个
             </div>
           </div>
           <button
             onClick={handleFleeExploration}
             className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors shrink-0 ${
               currentMountain
                 ? 'bg-cyan-800/50 border-cyan-500/40 text-cyan-200 hover:bg-cyan-700/60'
                 : 'bg-red-900/40 text-red-400 border border-red-500/30 hover:bg-red-800/50'
             }`}
           >
             <SkipForward className="h-3.5 w-3.5" />
             撤离
           </button>
         </div>

        {/* 进度条 */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-400 to-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${(completed / 6) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* 提示 */}
        <div className="text-[11px] text-cyan-300/80 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-2">
          ⚠️ 探索中无法返回，请完成全部节点或选择撤离。收集的魂环将在探索结束后开始3分钟倒计时。
        </div>

         {/* 节点展示：6 个节点 */}
         <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {nodes.map((node, idx) => {
            const isCurrent = idx === currentNodeIdx;
            const isPast = idx < currentNodeIdx || node.searched;
            return (
              <motion.button
                key={idx}
                whileHover={isCurrent ? { scale: 1.03 } : {}}
                whileTap={isCurrent ? { scale: 0.97 } : {}}
                onClick={() => isCurrent && !node.searched && handleSearchNode(idx)}
                disabled={!isCurrent || node.searched}
                className={`relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
                  isPast
                    ? 'bg-emerald-900/20 border-emerald-500/40'
                    : isCurrent
                      ? 'bg-gradient-to-br from-emerald-700/30 to-green-800/20 border-emerald-400/60 shadow-lg shadow-emerald-500/20 cursor-pointer'
                      : 'bg-card/30 border-border/30 opacity-50'
                }`}
              >
                <div className={`text-2xl font-bold ${
                  isPast ? 'text-emerald-500' : isCurrent ? 'text-emerald-400' : 'text-muted-foreground'
                }`}>
                  {idx + 1}
                </div>
                <div className="text-[10px] mt-1">
                  {node.searched ? '已搜索' : isCurrent ? '点击搜索' : '未探索'}
                </div>
                {node.beast && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-emerald-500 whitespace-nowrap max-w-full truncate px-1">
                    {node.beast.name.slice(0, 5)}
                  </div>
                )}
                {isPast && (
                  <div className="absolute top-1 right-1 text-emerald-500">
                    ✓
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* 遭遇魂兽弹窗 */}
        <AnimatePresence>
          {showEncounter && encounterBeast && (
            <EncounterModal
              beast={encounterBeast}
              onFight={handleFight}
              onFlee={handleBypass}
            />
          )}
        </AnimatePresence>

        {/* 天梦冰蚕献祭奇遇弹窗（仅在非战斗状态、回到地图后显示） */}
        {!inBattle && (
          <TianmengSacrificeDialog
            open={showTianmengDialog}
            onAccept={handleAcceptTianmeng}
            onReject={handleRejectTianmeng}
          />
        )}
      </div>
    );
  }

  // === 海神阁 ===
  if (view === 'seaGodPavilion') {
    const defeatedIds = player?.seaGodDefeatedIds || [];
    const playerPos = player?.seaGodPosition ?? -1;

    const handleChallenge = (member: ISeaGodMember) => {
      if (!player || !startBattle) return;
      const memberIdx = SEA_GOD_MEMBERS.findIndex((m) => m.id === member.id);
      // 只能挑战比自己位置高一级的成员
      if (playerPos < 0) {
        // 还没进入排名（未击败任何人），只能挑战最后一名
        if (memberIdx !== SEA_GOD_MEMBERS.length - 1) {
          toast.info('请从最末位宿老开始挑战');
          return;
        }
      } else {
        // 已在排名中，只能挑战前一位
        if (memberIdx !== playerPos - 1) {
          toast.info('只能挑战上一名成员');
          return;
        }
      }

      const stats = calcSeaGodMemberStats(member);
      const maxRingYear = Math.max(...member.ringYears);
      const qualityLabel = maxRingYear >= 100000 ? '十万年' : maxRingYear >= 10000 ? '万年' : maxRingYear >= 1000 ? '千年' : '百年';
      const qualityColor = member.ringColors[member.ringColors.length - 1] || 'black';

      startBattle({
        battleType: 'sea-god',
        locationId: 'sea-god-pavilion',
        enemy: {
          id: member.id,
          name: `${member.title}·${member.name}`,
          years: maxRingYear,
          qualityColor,
          qualityLabel,
          hp: stats.hp,
          attack: stats.attack,
          defense: stats.defense,
          speed: stats.speed,
          spirit: stats.spirit,
          skillName: `第${member.level >= 90 ? 9 : 8}魂技`,
          skillDesc: `${member.martialSoul.name}第${member.level >= 90 ? 9 : 8}魂技`,
          element: member.martialSoul.element || '',
        },
        meta: {
          memberId: member.id,
          memberName: member.name,
          coinReward: member.rewards.coins,
        },
      });
    };

    const canChallenge = (memberIdx: number): boolean => {
      if (!player) return false;
      if (defeatedIds.includes(SEA_GOD_MEMBERS[memberIdx].id)) return false;
      if (playerPos < 0) {
        // 未进入排名，可挑战最后一名
        return memberIdx === SEA_GOD_MEMBERS.length - 1;
      }
      // 只能挑战前一位
      return memberIdx === playerPos - 1;
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('shrekAcademy')}
            className="p-1.5 rounded-lg bg-card/50 border border-border/40 hover:bg-card transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-bold bg-gradient-to-r from-cyan-200 to-cyan-400 bg-clip-text text-transparent">
            海神阁
          </h2>
        </div>

        {/* 顶部信息 */}
        <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-900/30 to-cyan-900/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-800/50 border border-cyan-500/40 flex items-center justify-center">
              <Crown className="h-6 w-6 text-cyan-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-cyan-400/80">当前位置</div>
              <div className="text-lg font-bold text-cyan-200 truncate">
                {playerPos < 0
                  ? '尚未进入海神阁'
                  : playerPos === 0
                    ? '海神阁阁主'
                    : `第${playerPos + 1}位 · ${SEA_GOD_POSITION_TITLE[SEA_GOD_MEMBERS[playerPos]?.position ?? 'common']}`}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                已击败 {defeatedIds.length} 位成员
              </div>
            </div>
          </div>
        </div>

        {/* 成员列表 */}
        <div className="space-y-2">
          {SEA_GOD_MEMBERS.map((member, idx) => {
            const isDefeated = defeatedIds.includes(member.id);
            const isCurrent = playerPos === idx;
            const challengable = canChallenge(idx);
            const positionColor = member.position === 'pavilion-master' ? 'text-cyan-300 border-cyan-500/40 bg-amber-900/30'
              : member.position === 'vice-master' ? 'text-cyan-300 border-cyan-500/30 bg-cyan-800/50'
                : member.position === 'elder' ? 'text-violet-700 border-violet-300 bg-violet-100'
                  : 'text-foreground border-border/30 bg-card/30';
            return (
              <div
                key={member.id}
                className={`rounded-xl border p-3 transition-all ${isCurrent ? 'ring-2 ring-emerald-400/50 ' + positionColor : positionColor}`}
              >
                <div className="flex items-start gap-3">
                  {/* 排名编号 */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0 ${
                    isCurrent ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/30' : isDefeated ? 'bg-green-900/40 text-green-400' : 'bg-muted/40 text-muted-foreground'
                  }`}>
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* 名字 + 封号 */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground text-sm">{member.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-medium shrink-0">
                        {member.title}
                      </span>
                      {isDefeated && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-900/40 text-green-400 shrink-0 border border-green-500/30">
                          已击败
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 shrink-0">
                          你的位置
                        </span>
                      )}
                    </div>

                    {/* 身份 + 等级 + 武魂 */}
                    <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{SEA_GOD_POSITION_TITLE[member.position]}</span>
                      <span>·</span>
                      <span className="text-cyan-300/80">{member.level}级</span>
                      <span>·</span>
                      <span className="truncate">{member.martialSoul.name}</span>
                    </div>

                    {/* 魂环配比 */}
                    <div className="flex items-center gap-1 mt-2">
                      {member.ringColors.map((color, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded-full border shrink-0"
                          style={{
                            backgroundColor: RING_DISPLAY_COLOR[color as keyof typeof RING_DISPLAY_COLOR] || '#888',
                            borderColor: color === 'black' ? 'rgba(255,255,255,0.2)' : RING_DISPLAY_COLOR[color as keyof typeof RING_DISPLAY_COLOR] || '#888',
                            boxShadow: color === 'red' || color === 'gold' ? `0 0 4px ${RING_DISPLAY_COLOR[color as keyof typeof RING_DISPLAY_COLOR]}80` : 'none',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 挑战按钮 */}
                  <button
                    onClick={() => handleChallenge(member)}
                    disabled={!challengable}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      challengable
                        ? 'bg-gradient-to-r from-cyan-600 to-cyan-400 text-cyan-950 hover:from-cyan-400 hover:to-cyan-400 active:scale-95 shadow-lg shadow-cyan-500/20'
                        : 'bg-muted/30 text-muted-foreground cursor-not-allowed border border-border/30'
                    }`}
                  >
                    {isDefeated ? '已击败' : isCurrent ? '当前' : challengable ? '挑战' : '未解锁'}
                  </button>
                </div>

                {/* 领域标识 */}
                {member.domain && (
                  <div className="mt-2 pt-2 border-t border-border/30">
                    <div className="text-[10px] text-violet-600 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      <span className="font-medium">领域：{member.domain.name}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-[10px] text-muted-foreground text-center pt-2">
          💡 每次只能挑战排名高一位的成员，胜利后接替其位置
        </div>
      </div>
    );
  }

  // === 极北之地 ===
  if (view === 'beiji') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={backToBigMap}
            className="p-1.5 rounded-lg bg-card/40 border border-cyan-500/20 hover:bg-card/60 transition-colors text-cyan-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-cyan-300" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              极北之地
            </h2>
            <p className="text-[10px] text-muted-foreground -mt-0.5">冰属性魂兽的极寒圣地 · 四大凶兽坐镇</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {BEIJI_ZONES.map((zone) => {
            const isLocked = zone.locked || player.level < zone.unlockLevel;
            const canAfford = getCurrentStamina().current >= zone.staminaCost;
            const dangerLevel = zone.id === 'outer' ? 1 : zone.id === 'middle' ? 2 : zone.id === 'inner' ? 3 : 5;
            return (
              <button
                key={zone.id}
                onClick={() => {
                  if (isLocked) return;
                  if (zone.isFierceBeast) {
                    setView('beijiCore');
                  } else {
                    setSelectedBeijiZone(zone);
                    setView('beijiZone');
                  }
                }}
                disabled={isLocked}
                className={`group relative overflow-hidden rounded-xl border text-left transition-all duration-300 ${
                  isLocked
                    ? 'border-border/20 bg-card/20 opacity-50 cursor-not-allowed'
                    : zone.isFierceBeast
                      ? 'border-red-500/30 bg-gradient-to-br from-red-950/40 via-card/60 to-cyan-950/30 hover:border-red-400/50 active:scale-[0.99]'
                      : 'border-cyan-500/30 bg-gradient-to-br from-card/70 to-background/50 hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(34_211_238_0.12)] active:scale-[0.99]'
                }`}
              >
                {/* 顶部边装饰 */}
                {!isLocked && (
                  <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent`} />
                )}

                <div className="relative p-4">
                  {/* 顶部：标题 + 进入按钮 */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg ${
                      isLocked
                        ? 'bg-muted/30 border border-border/30 text-muted-foreground'
                        : zone.isFierceBeast
                          ? 'bg-red-900/30 border border-red-500/30 text-red-400'
                          : 'bg-cyan-900/30 border border-cyan-500/30 text-cyan-300'
                    }`} style={!isLocked ? { boxShadow: `inset 0 0 12px ${zone.isFierceBeast ? 'rgba(239,68,68,0.15)' : 'rgba(34,211,238,0.1)'}` } : {}}>
                      {isLocked ? <Lock className="h-5 w-5" /> : <Snowflake className="h-5 w-5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-bold text-base text-cyan-100">{zone.name}</div>
                        {zone.isFierceBeast && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-500/30">
                            凶兽禁地
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <div className="flex items-center gap-1 text-cyan-600/80">
                          <Zap className="h-3 w-3" />
                          <span className="tabular-nums font-medium">{zone.isFierceBeast ? '—' : `${zone.staminaCost} 体力`}</span>
                        </div>
                        {player.level < zone.unlockLevel && !zone.locked && (
                          <span className="text-cyan-600">需{zone.unlockLevel}级</span>
                        )}
                      </div>
                    </div>

                    {/* 进入按钮移到右上角 */}
                    <span className={`text-xs font-medium px-3 py-1.5 rounded-lg shrink-0 ${
                      isLocked
                        ? 'bg-muted/40 text-muted-foreground'
                        : zone.isFierceBeast
                          ? 'bg-red-900/40 text-red-400 border border-red-500/30 group-hover:bg-red-800/50 transition-colors'
                          : 'bg-gradient-to-r from-cyan-600 to-cyan-400 text-cyan-950 font-bold group-hover:from-cyan-500 group-hover:to-cyan-300 transition-all shadow shadow-cyan-500/20'
                    }`}>
                      {zone.locked ? '暂不开放' : player.level < zone.unlockLevel ? '等级不足' : zone.isFierceBeast ? '查看凶兽' : '查看详情'}
                    </span>
                  </div>

                  {/* 下方：介绍 */}
                  <div className="pt-3 border-t border-cyan-500/10">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{zone.description}</p>
                    <p className="text-[10px] text-cyan-600 mt-1.5">{zone.yearsDesc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // === 极北之地 - 单区域详情 ===
  if (view === 'beijiZone' && selectedBeijiZone) {
    const zone = selectedBeijiZone;
    const isLocked = zone.locked || player.level < zone.unlockLevel;
    const canAfford = getCurrentStamina().current >= zone.staminaCost;
    const dangerLevel = zone.id === 'outer' ? 1 : zone.id === 'middle' ? 2 : zone.id === 'inner' ? 3 : 5;

    const handleEnter = () => {
      if (isLocked) return;
      // 核心区为凶兽挑战，保持原逻辑
      if (zone.isFierceBeast) {
        setView('beijiCore');
        return;
      }
      setCurrentBeijiZone(zone);
      setView('beijiDungeons');
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('beiji')}
            className="p-1.5 rounded-lg bg-card/40 border border-cyan-500/20 hover:bg-card/60 transition-colors text-cyan-300"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-cyan-300" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              {zone.name}
            </h2>
            <p className="text-[10px] text-muted-foreground -mt-0.5">极北之地 · 冰属性魂兽区域</p>
          </div>
        </div>

        {/* 顶部按钮：核心区凶兽 / 其他区域副本列表 */}
        {zone.isFierceBeast ? (
          <button
            onClick={handleEnter}
            disabled={isLocked}
            className={`w-full h-14 rounded-xl font-bold text-base transition-all ${
              isLocked
                ? 'bg-muted/40 text-muted-foreground cursor-not-allowed border border-border/30'
                : 'bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 text-white border border-blue-400/50 shadow-[0_0_25px_rgba(59_130_246_0.3)] hover:shadow-[0_0_35px_rgba(59_130_246_0.5)] active:scale-[0.98]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Snowflake className="h-5 w-5" />
              {isLocked ? (player.level < zone.unlockLevel ? `需${zone.unlockLevel}级` : '暂不开放') : '挑战极北凶兽'}
            </div>
          </button>
        ) : (
          <button
            onClick={handleEnter}
            disabled={isLocked}
            className={`w-full h-14 rounded-xl font-bold text-base transition-all ${
              isLocked
                ? 'bg-muted/40 text-muted-foreground cursor-not-allowed border border-border/30'
                : 'bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-600 text-cyan-950 border border-cyan-400/50 shadow-[0_0_25px_rgba(34_211_238_0.3)] hover:shadow-[0_0_35px_rgba(34_211_238_0.5)] active:scale-[0.98]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Snowflake className="h-5 w-5" />
              {isLocked ? (player.level < zone.unlockLevel ? `需${zone.unlockLevel}级` : '暂不开放') : '选择副本'}
            </div>
          </button>
        )}

        {/* 区域介绍 */}
        <div className="rounded-xl border border-cyan-500/25 bg-gradient-to-br from-card/70 to-background/50 p-4 space-y-3">
          <div>
            <div className="text-xs font-semibold text-cyan-300 mb-1.5">区域介绍</div>
            <p className="text-sm text-foreground/90 leading-relaxed">{zone.description}</p>
          </div>
          <div>
            <div className="text-xs font-semibold text-cyan-300 mb-1.5">魂兽年限</div>
            <p className="text-sm text-cyan-200/80">{zone.yearsDesc}</p>
          </div>
          {!zone.isFierceBeast && (
            <div>
              <div className="text-xs font-semibold text-cyan-300 mb-1.5">副本模式</div>
              <p className="text-xs text-muted-foreground leading-relaxed">该区域分为 3 个年限副本，每个副本 6 节点探索。副本内均为冰属性魂兽，有小概率遇到更高年限魂兽。</p>
            </div>
          )}
        </div>

        {/* 危险等级 */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">危险等级</span>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < dangerLevel
                    ? dangerLevel >= 4 ? 'bg-red-500' : dangerLevel >= 3 ? 'bg-orange-500' : 'bg-yellow-500'
                    : 'bg-muted/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // === 渲染：极北之地 - 副本列表 ===
  if (view === 'beijiDungeons' && currentBeijiZone) {
    const dungeons = BEIJI_DUNGEONS[currentBeijiZone.id] || [];
    return (
      <div className="space-y-4">
        <SweepSettings />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('beijiZone')}
            className="p-1.5 rounded-lg bg-card/40 border border-cyan-500/20 hover:bg-card/60 transition-colors text-cyan-300"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-cyan-300" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              {currentBeijiZone.name} · 副本
            </h2>
            <p className="text-[10px] text-muted-foreground -mt-0.5">冰属性魂兽 · 选择目标年限副本</p>
          </div>
        </div>

        <div className="space-y-3">
          {dungeons.map((dun, idx) => {
            const locked = player.level < dun.unlockLevel;
            const canAfford = getCurrentStamina().current >= dun.staminaCost;
            const areaKey = `beiji-${currentBeijiZone?.id}-${dun.id}`;
            const sweepCount = getSweepCount(areaKey);
            const sweepUnlocked = sweepCount >= 10;
            const sweepCost = dun.staminaCost * 6;
            const canSweepAfford = getCurrentStamina().current >= sweepCost;
            return (
              <div
                key={dun.id}
                className={`w-full rounded-xl border p-4 transition-all ${
                  locked
                    ? 'bg-muted/20 border-border/20 opacity-60'
                    : 'bg-gradient-to-br from-blue-950/40 to-background/50 border-blue-500/25'
                }`}
              >
                <button
                  onClick={() => {
                    if (locked) { toast.error(`需要 ${dun.unlockLevel} 级`); return; }
                    if (!canAfford) { toast.error('体力不足'); return; }
                    setCurrentBeijiDungeon(dun);
                    startBeijiDungeonExploration(currentBeijiZone, dun);
                  }}
                  disabled={locked}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-blue-100">副本 {idx + 1}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {dun.name}
                        </span>
                      </div>
                      <div className="text-xs text-blue-200/80 mt-1.5">{dun.yearsDesc}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        小概率遇到更高年限冰兽 · 6节点探索
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <div className={`text-xs font-medium ${
                        canAfford ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {dun.staminaCost} 体力
                      </div>
                      {locked && (
                        <div className="text-[10px] text-red-400">需{dun.unlockLevel}级</div>
                      )}
                      {!locked && canAfford && (
                        <div className="text-[10px] text-blue-300">进入 →</div>
                      )}
                    </div>
                  </div>
                </button>

                {/* 扫荡进度 + 扫荡按钮 */}
                {!locked && (
                  <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground">扫荡进度</span>
                        <span className={sweepUnlocked ? 'text-green-400 font-medium' : 'text-cyan-300'}>
                          {sweepUnlocked ? '已解锁' : `${Math.min(sweepCount, 10)}/10`}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${sweepUnlocked ? 'bg-green-500' : 'bg-cyan-500'}`}
                          style={{ width: `${Math.min(100, (sweepCount / 10) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleSweepBeiji(currentBeijiZone!, dun)}
                      disabled={!sweepUnlocked || !canSweepAfford}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                        sweepUnlocked && canSweepAfford
                          ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-amber-950 hover:from-amber-400 hover:to-amber-300 shadow-[0_0_10px_rgba(251_191_36_0.3)] active:scale-[0.97]'
                          : 'bg-muted/40 text-muted-foreground cursor-not-allowed border border-border/30'
                      }`}
                    >
                      <SparklesIcon className="h-3 w-3" />
                      扫荡
                    </button>
                  </div>
                )}
                {!locked && sweepUnlocked && (
                  <div className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    扫荡消耗 {sweepCost} 体力（6节点×单节点消耗）
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // === 极寒冰域（极北核心区凶兽列表） ===
  if (view === 'beijiCore') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('beiji')}
            className="p-1.5 rounded-lg bg-card/40 border border-cyan-500/20 hover:bg-card/60 transition-colors text-cyan-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-cyan-300" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              极寒冰域
            </h2>
            <p className="text-[10px] text-red-600 -mt-0.5">极北核心禁区 · 四大凶兽栖息</p>
          </div>
        </div>

        {/* 极寒背景装饰 */}
        <div className="relative overflow-hidden rounded-xl border border-cyan-500/20 bg-gradient-to-b from-cyan-950/30 via-card/40 to-card/20 p-4">
          <div className="absolute inset-0 pointer-events-none opacity-30" style={{
            background: 'radial-gradient(circle at 30% 20%, rgba(34,211,238,0.15), transparent 50%), radial-gradient(circle at 70% 80%, rgba(34,211,238,0.1), transparent 50%)'
          }} />
          <div className="relative space-y-3">
            {FIERCE_BEASTS_FROZEN.map((beast, idx) => (
              <div
                key={beast.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-cyan-500/20 bg-black/30 hover:border-cyan-400/40 transition-all"
              >
                {/* 凶兽头像 */}
                <div className="relative w-14 h-14 shrink-0 rounded-xl bg-gradient-to-br from-cyan-900/60 to-blue-900/60 border border-cyan-400/40 flex items-center justify-center text-xl font-bold text-cyan-200" style={{ boxShadow: '0 0 20px rgba(34,211,238,0.2), inset 0 0 15px rgba(34,211,238,0.1)' }}>
                  {beast.name.charAt(0)}
                  <span className="absolute -top-1.5 -right-1.5 text-[9px] px-1 py-0.5 rounded bg-red-500/80 text-white font-bold border border-red-400/60">
                    {idx + 1}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-cyan-100">{beast.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-800/50 text-cyan-300 border border-cyan-500/40">
                      {beast.element}
                    </span>
                  </div>
                  <div className="text-[11px] text-cyan-600">{beast.title} · {beast.years >= 10000 ? `${(beast.years / 10000).toFixed(0)}万年` : `${beast.years}年`}</div>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{beast.description}</p>
                </div>

                <button
                  onClick={() => startFierceBeastBattle(beast)}
                  className="shrink-0 px-3 py-2 rounded-lg bg-red-900/40 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-800/50 hover:border-red-400/60 transition-all active:scale-95"
                >
                  挑战
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-muted-foreground text-center py-2">
          ⚠️ 凶兽实力极强，挑战失败无惩罚，但胜利奖励丰厚
        </div>
      </div>
    );
  }

  // === 生命之湖（星斗核心十大凶兽） ===
  if (view === 'lifeLake') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('starForest')}
            className="p-1.5 rounded-lg bg-card/40 border border-emerald-500/20 hover:bg-card/60 transition-colors text-emerald-500"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-emerald-400" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              生命之湖
            </h2>
            <p className="text-[10px] text-emerald-500/80 -mt-0.5">星斗大森林核心 · 十大凶兽栖息之地</p>
          </div>
        </div>

        {/* 生命之湖水波纹动画头图 */}
        <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-b from-emerald-950/40 via-teal-900/20 to-card/20 h-40">
          {/* 水波动画 */}
          <div className="absolute inset-0">
            <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-emerald-600/20 to-transparent" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-64 h-16 rounded-full bg-emerald-400/15 animate-pulse" style={{ animationDuration: '3s' }} />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 h-12 rounded-full bg-emerald-300/20 animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-32 h-8 rounded-full bg-emerald-200/25 animate-pulse" style={{ animationDuration: '2s', animationDelay: '1s' }} />
            {/* 生命气息光点 */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-emerald-300/40 animate-bounce"
                style={{
                  width: `${4 + (i % 3) * 2}px`,
                  height: `${4 + (i % 3) * 2}px`,
                  left: `${15 + i * 10}%`,
                  bottom: `${20 + (i % 4) * 15}%`,
                  animationDuration: `${2 + (i % 3)}s`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
          {/* 中央标题 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400" style={{ fontFamily: "'Noto Serif SC', serif", textShadow: '0 0 20px rgba(52,211,153,0.5)' }}>
                生命之湖
              </div>
              <div className="text-[11px] text-emerald-500/70 mt-1">孕育万物的生命之源</div>
            </div>
          </div>
        </div>

        {/* 十大凶兽列表 */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground px-1">十大凶兽榜</div>
          {FIERCE_BEASTS_STAR_LAKE.map((beast, idx) => (
            <div
              key={beast.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card/40 hover:border-emerald-500/30 hover:bg-card/60 transition-all"
            >
              {/* 凶兽头像 */}
              <div className="relative w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-emerald-900/60 to-teal-900/60 border border-emerald-400/40 flex items-center justify-center text-lg font-bold text-emerald-400" style={{ boxShadow: '0 0 15px rgba(52,211,153,0.15), inset 0 0 10px rgba(52,211,153,0.1)' }}>
                {beast.name.charAt(0)}
                <span className="absolute -top-1.5 -left-1.5 text-[9px] w-5 h-5 flex items-center justify-center rounded-full bg-cyan-500 text-white font-bold border border-cyan-400/60">
                  {idx + 1}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-foreground">{beast.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    排名 {beast.rank}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">{beast.title} · {beast.years >= 10000 ? `${(beast.years / 10000).toFixed(0)}万年` : `${beast.years}年`} · {beast.element}</div>
              </div>

              <button
                onClick={() => startFierceBeastBattle(beast)}
                className="shrink-0 px-3 py-2 rounded-lg bg-cyan-800/50 border border-cyan-500/40 text-cyan-200 text-xs font-medium hover:bg-cyan-700/60 hover:border-cyan-400 transition-all active:scale-95"
              >
                挑战
              </button>
            </div>
          ))}
        </div>

        <div className="text-[10px] text-muted-foreground text-center py-2">
          生命之湖底部 · 暂不开放
        </div>
      </div>
    );
  }

  // === 传灵塔（12属性副本入口 + 魂兽选择） ===
  const SPIRIT_TOWER_ATTRIBUTES = [
    { attr: '金', color: 'from-yellow-500/30 to-amber-600/20', border: 'border-yellow-500/40', text: 'text-yellow-200' },
    { attr: '木', color: 'from-green-500/30 to-emerald-600/20', border: 'border-green-500/40', text: 'text-green-200' },
    { attr: '水', color: 'from-blue-500/30 to-cyan-600/20', border: 'border-blue-500/40', text: 'text-blue-200' },
    { attr: '火', color: 'from-red-500/30 to-orange-600/20', border: 'border-red-500/40', text: 'text-red-200' },
    { attr: '土', color: 'from-amber-700/30 to-yellow-800/20', border: 'border-amber-700/40', text: 'text-amber-200' },
    { attr: '风', color: 'from-teal-400/30 to-cyan-500/20', border: 'border-teal-400/40', text: 'text-teal-200' },
    { attr: '雷', color: 'from-purple-500/30 to-violet-600/20', border: 'border-purple-500/40', text: 'text-purple-200' },
    { attr: '冰', color: 'from-sky-300/30 to-blue-400/20', border: 'border-sky-300/40', text: 'text-sky-200' },
    { attr: '光', color: 'from-yellow-200/40 to-amber-300/20', border: 'border-yellow-200/40', text: 'text-yellow-100' },
    { attr: '暗', color: 'from-purple-900/40 to-slate-900/30', border: 'border-purple-700/40', text: 'text-purple-300' },
    { attr: '空间', color: 'from-indigo-500/30 to-purple-600/20', border: 'border-indigo-500/40', text: 'text-indigo-200' },
    { attr: '时间', color: 'from-stone-400/30 to-amber-600/20', border: 'border-stone-400/40', text: 'text-stone-200' },
  ];

  const mapSpiritAttr = (attr: string) =>
    attr === '空间' || attr === '时间' ? '混沌'
    : attr === '光' ? '光明'
    : attr === '暗' ? '黑暗'
    : attr;

  // 传灵塔·12属性副本入口（未选择具体属性时显示）
  if (view === 'spiritTower' && !selectedTowerAttr) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={backToBigMap}
            className="p-2 rounded-lg bg-card/50 border border-border/50 hover:bg-card transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-yellow-200" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              传灵塔
            </h2>
            <p className="text-xs text-muted-foreground">传承魂灵的神秘之地</p>
          </div>
        </div>

        <div className="rounded-xl border border-yellow-600/30 bg-gradient-to-br from-yellow-900/20 via-card/40 to-purple-900/20 p-4">
          <p className="text-sm text-foreground/90 leading-relaxed">
            传灵塔是传承魂灵的圣地。塔中有十二座属性副本，每座副本镇守着对应属性的魂兽。
            战胜它们可获得<span className="text-yellow-300 font-semibold">魂灵契约机会</span>，
            契约后的魂灵将与你并肩作战。
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            · 魂灵契约机会有效期 <span className="text-yellow-300">7分钟</span>，逾期失效
          </p>
        </div>

         <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {SPIRIT_TOWER_ATTRIBUTES.map((t) => {
            const poolAttr = mapSpiritAttr(t.attr);
            const spirits = SOUL_SPIRIT_POOL.filter((s) => s.attribute === poolAttr);
            const sampleSpirit = spirits[0];
            return (
              <button
                key={t.attr}
                onClick={() => enterTowerAttribute(t.attr)}
                className={`relative overflow-hidden rounded-lg border ${t.border} bg-gradient-to-br ${t.color} p-3 text-center transition-all hover:scale-105 active:scale-95`}
              >
                <div className={`text-3xl font-bold ${t.text} mb-1`} style={{ textShadow: '0 0 10px currentColor' }}>
                  {t.attr}
                </div>
                <div className="text-xs text-foreground/80">{sampleSpirit?.beastName || '???'}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{spirits.length} 种魂兽</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // === 传灵塔·属性副本魂兽选择 ===
  if (view === 'spiritTower' && selectedTowerAttr) {
    const t = SPIRIT_TOWER_ATTRIBUTES.find((x) => x.attr === selectedTowerAttr) || SPIRIT_TOWER_ATTRIBUTES[0];
    const poolAttr = mapSpiritAttr(selectedTowerAttr);
    const spirits = SOUL_SPIRIT_POOL.filter((s) => s.attribute === poolAttr);
    const isMapped = selectedTowerAttr !== poolAttr;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedTowerAttr(null)}
            className="p-2 rounded-lg bg-card/50 border border-border/50 hover:bg-card transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-yellow-200" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              {selectedTowerAttr}属性副本
            </h2>
            <p className="text-xs text-muted-foreground">
              {isMapped ? `魂兽池：${poolAttr}属性` : `镇守魂兽：${spirits.length} 种`}
            </p>
          </div>
        </div>

        <div className={`rounded-xl border ${t.border} bg-gradient-to-br ${t.color} p-3`}>
          <p className="text-sm text-foreground/90 leading-relaxed">
            {selectedTowerAttr}属性副本镇守着 <span className="text-yellow-300 font-semibold">{spirits.length}</span> 种魂兽。
            选择你想挑战的魂兽，击败它有机会获得魂灵契约。
          </p>
          {isMapped && (
            <p className="text-[11px] text-yellow-300/90 mt-2">
              提示：{selectedTowerAttr}属性魂兽极为罕见，此处由{poolAttr}属性魂兽代为镇守。
            </p>
          )}
        </div>

        <div className="space-y-2">
          {spirits.map((sp, idx) => (
            <button
              key={sp.id}
              onClick={() => startSpiritBeastBattle(sp.id)}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-card/60 border border-border/50 hover:bg-card hover:border-yellow-500/40 transition-all text-left group"
            >
              <div className={`w-12 h-12 shrink-0 rounded-lg flex items-center justify-center text-xl font-bold ${t.text} bg-gradient-to-br ${t.color} border ${t.border}`} style={{ textShadow: '0 0 8px currentColor' }}>
                {sp.iconChar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-foreground truncate">{sp.beastName}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">第{idx + 1}阶</span>
                </div>
                <div className="text-xs text-muted-foreground truncate">{sp.description}</div>
                <div className="text-[11px] text-yellow-400/80 mt-1 truncate">特点：{sp.feature}</div>
              </div>
              <div className="shrink-0 text-yellow-500 group-hover:translate-x-1 transition-transform">
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

    // === 茶城视图 ===
    if (view === 'teaCity') {
      const now = Date.now();

      const handleExplore = (node: TeaCityNode) => {
        const result = exploreTeaNode(node.id);
        if (result.success) {
          setExploreResult({ expGained: result.expGained ?? 0, coinGained: result.coinGained ?? 0, encounterId: result.encounterId });
          setSelectedTeaNode(node);
          if (result.encounterId) {
            setTimeout(() => setShowTeaFavor(true), 500);
          }
        } else {
          toast.error(result.reason ?? '探索失败');
        }
      };

     const handleAcceptTeaFavor = () => {
       if (!pendingTeaFavorId) return;
       const ok = acceptTeaFavor(pendingTeaFavorId);
       if (ok) {
         toast.success('缘分已至，成功结识！');
       }
       setShowTeaFavor(false);
       setExploreResult(null);
     };

     const handleRejectTeaFavor = () => {
       if (pendingTeaFavorId) {
         rejectTeaFavor(pendingTeaFavorId);
         toast.info('婉拒了这次邂逅');
       }
       setShowTeaFavor(false);
       setExploreResult(null);
     };

     const favorChar = pendingTeaFavorId ? TEA_CITY_CHARACTERS.find(c => c.id === pendingTeaFavorId) : null;

     const qualityMap: Record<string, { label: string; color: string; ring: string }> = {
       common:    { label: '普通', color: 'text-gray-300',   ring: 'ring-gray-400/40' },
       fine:      { label: '精良', color: 'text-green-300',  ring: 'ring-green-400/40' },
       rare:      { label: '稀有', color: 'text-blue-300',   ring: 'ring-blue-400/40' },
       epic:      { label: '史诗', color: 'text-purple-300', ring: 'ring-purple-400/40' },
       legendary: { label: '传说', color: 'text-yellow-300', ring: 'ring-yellow-400/60' },
     };

     return (
       <div className="space-y-4">
         <div className="flex items-center gap-2">
           <button
             onClick={backToBigMap}
             className="p-2 rounded-lg bg-card/50 border border-border/50 hover:bg-card transition-colors"
           >
             <ArrowLeft className="w-4 h-4" />
           </button>
           <div className="flex-1">
             <h2 className="text-lg font-bold text-amber-200" style={{ fontFamily: "'Noto Serif SC', serif" }}>
               茶城
             </h2>
             <p className="text-xs text-muted-foreground">茶香氤氲，邂逅之地</p>
           </div>
         </div>

         <div className="rounded-xl border border-amber-600/30 bg-gradient-to-br from-amber-900/20 via-card/40 to-orange-900/20 p-4">
           <p className="text-sm text-foreground/90 leading-relaxed">
             茶城坐落于斗罗大陆东南沿海，是一座以茶香闻名的优雅小城。
             城中名士云集，常有魂师界的传奇人物在此品茶论道、结交好友。
             漫步于六大胜景之间，或许会有一场<span className="text-amber-300 font-semibold">美丽的邂逅</span>在等你。
           </p>
           <p className="text-xs text-muted-foreground mt-2">
              · 每次探索消耗 <span className="text-amber-300">500 体力</span>，冷却 <span className="text-amber-300">4 分钟</span>
             <br />
             · 探索可获得修为与魂币，更有概率邂逅魂师名士
           </p>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
           {TEA_CITY_NODES.map((node) => {
             const cdUntil = teaNodeCooldowns[node.id] ?? 0;
             const isCooling = now < cdUntil;
             const remainSec = Math.max(0, Math.ceil((cdUntil - now) / 1000));
             const sampleChar = TEA_CITY_CHARACTERS.find(c => c.id === node.characterIds[0]);
             return (
               <button
                 key={node.id}
                 onClick={() => handleExplore(node)}
                 disabled={isCooling}
                 className={`relative overflow-hidden rounded-xl border border-amber-600/20 bg-gradient-to-br from-amber-900/10 via-card/60 to-orange-900/10 p-3 text-left transition-all hover:border-amber-500/40 hover:scale-[1.02] active:scale-[0.98] ${isCooling ? 'opacity-50 cursor-not-allowed' : ''}`}
               >
                 <div className="text-3xl mb-2">{node.icon}</div>
                 <div className="font-semibold text-foreground text-sm">{node.name}</div>
                 <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{node.description}</div>
                 <div className="text-[10px] text-amber-300/80 mt-2">
                   可遇：{sampleChar?.name ?? '???'}等{node.characterIds.length}人
                 </div>
                 {isCooling && (
                   <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-sm text-white/90 font-medium">
                     冷却中 {remainSec}s
                   </div>
                 )}
               </button>
             );
           })}
         </div>

         {/* 探索结果 + 青睐弹窗 */}
         <AnimatePresence>
           {exploreResult && (
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
               onClick={() => { if (!showTeaFavor) setExploreResult(null); }}
             >
               <motion.div
                 initial={{ opacity: 0, scale: 0.85, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 10 }}
                 transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                 className="w-full max-w-sm bg-gradient-to-br from-amber-900/40 via-card to-orange-900/40 border border-amber-500/30 rounded-2xl p-5 shadow-2xl"
                 onClick={(e) => e.stopPropagation()}
               >
                 <div className="text-center mb-4">
                   <div className="text-amber-300 text-2xl mb-1">🍵</div>
                   <h3 className="text-lg font-bold text-amber-200" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                     探索完成
                   </h3>
                 </div>
                 <div className="space-y-2 mb-5 bg-card/50 rounded-lg p-3 border border-border/40">
                   <div className="flex items-center justify-between text-sm">
                     <span className="text-muted-foreground">获得修为</span>
                     <span className="text-cyan-300 font-semibold">+{exploreResult.expGained}</span>
                   </div>
                   <div className="flex items-center justify-between text-sm">
                     <span className="text-muted-foreground">获得魂币</span>
                     <span className="text-yellow-300 font-semibold">+{exploreResult.coinGained}</span>
                   </div>
                 </div>
                 {!exploreResult.encounterId && !showTeaFavor && (
                   <button
                     onClick={() => setExploreResult(null)}
                     className="w-full py-2.5 rounded-lg bg-amber-600/30 border border-amber-500/40 text-amber-100 font-medium hover:bg-amber-600/50 transition-colors"
                   >
                     知道了
                   </button>
                 )}
               </motion.div>
             </motion.div>
           )}
         </AnimatePresence>

         {/* 茶城青睐弹窗 */}
         <AnimatePresence>
           {showTeaFavor && favorChar && (
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
             >
               <motion.div
                 initial={{ opacity: 0, scale: 0.8, y: 30 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 10 }}
                 transition={{ type: 'spring', damping: 22, stiffness: 280, delay: 0.1 }}
                 className="w-full max-w-md bg-gradient-to-br from-amber-900/60 via-card to-rose-900/40 border border-amber-400/40 rounded-2xl p-6 shadow-2xl text-center"
               >
                 <div className="relative inline-block mb-4">
                   <div className={`w-24 h-24 mx-auto rounded-2xl flex items-center justify-center text-4xl font-bold bg-gradient-to-br from-amber-500/30 to-rose-500/30 ring-4 ${qualityMap[favorChar.quality]?.ring} ${qualityMap[favorChar.quality]?.color}`} style={{ textShadow: '0 0 12px currentColor' }}>
                     {favorChar.iconChar}
                   </div>
                   <div className="absolute -top-1 -right-1 text-xl">✨</div>
                   <div className="absolute -bottom-1 -left-1 text-xl">🌸</div>
                 </div>

                 <div className={`text-sm font-medium ${qualityMap[favorChar.quality]?.color} mb-1`}>
                   {qualityMap[favorChar.quality]?.label}品质
                 </div>
                 <h3 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                   {favorChar.name}
                 </h3>
                  <div className="text-sm text-amber-200/80 mb-1">{favorChar.title}</div>
                  <div className="text-[11px] text-amber-300/70 mb-3">势力：{favorChar.faction}</div>
                  <div className="text-xs text-muted-foreground mb-4">
                   {favorChar.martialSoul} · {favorChar.soulType}
                 </div>

                 <div className="bg-card/60 rounded-lg p-3 mb-5 text-left border border-border/40 max-h-40 overflow-y-auto">
                   <div className="text-xs text-foreground/90 leading-relaxed">
                     {favorChar.appearance.slice(0, 120)}…
                   </div>
                 </div>

                 <p className="text-sm text-amber-200/90 mb-5" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                   「萍水相逢，亦是前缘。
                   <br />不知阁下，可愿与我结为知己？」
                 </p>

                 <div className="flex gap-3">
                   <button
                     onClick={handleRejectTeaFavor}
                     className="flex-1 py-2.5 rounded-lg bg-card/50 border border-border/60 text-foreground/80 font-medium hover:bg-card transition-colors"
                   >
                     婉拒
                   </button>
                   <button
                     onClick={handleAcceptTeaFavor}
                     className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold shadow-lg hover:brightness-110 transition-all"
                   >
                     接受
                   </button>
                 </div>
               </motion.div>
             </motion.div>
           )}
         </AnimatePresence>
       </div>
     );
    }

    // === 冰火两仪眼视图 ===
    if (view === 'iceFireEye') {
      // 冰火两仪眼节点产出配置
      const ICE_FIRE_ZONES: Array<{
        id: string; name: string; desc: string; level: number; icon: string;
        immortals: string[]; // 可能产出的仙草名称列表
        spiritGrasses: string[]; // 可能产出的灵草名称列表
        otherDrops: string[]; // 其他掉落
        dropRates: { immortal: string; spirit: string; coin: string; soulbone: string };
        detailDesc: string;
      }> = [
        {
          id: 'icefire-1', name: '炽热阳泉', desc: '极热之地，火属性仙草生长之处', level: 20, icon: '炽',
          immortals: ['烈火杏娇疏', '奇茸通天菊', '圣龙耀阳草', '鸡冠凤凰葵', '太阳精', '龙芝叶'],
          spiritGrasses: ['赤炎花', '金芝叶', '厚土参'],
          otherDrops: ['魂币 5000~50000', '万年魂骨（随机）'],
          dropRates: { immortal: '20%', spirit: '50%', coin: '15%', soulbone: '15%' },
          detailDesc: '炽热阳泉终年喷涌灼热火泉，泉水中蕴含浓郁的火属性灵气。生长于此的仙草皆具烈阳之性，火属性武魂魂师服用效果最佳。圣龙耀阳草在此地大量生长，仙草掉落中约30%概率为圣龙耀阳草，蕴含上古圣龙血脉之力。',
        },
        {
          id: 'icefire-2', name: '寒凉阴泉', desc: '极寒之地，水属性仙草生长之处', level: 50, icon: '寒',
          immortals: ['八角玄冰草', '幽香绮罗仙品', '望穿秋水露', '沧海珠'],
          spiritGrasses: ['冰魄莲', '水涟花', '虚空晶'],
          otherDrops: ['魂币 5000~50000', '万年魂骨（随机）'],
          dropRates: { immortal: '20%', spirit: '50%', coin: '15%', soulbone: '15%' },
          detailDesc: '寒凉阴泉深不见底，寒气彻骨，泉水凝而不冻。生长于此的仙草蕴含极寒之力，冰/水属性武魂服用可获奇效。',
        },
        {
          id: 'icefire-3', name: '湖心小岛', desc: '两仪眼中心的小岛，生长着最珍贵的仙草', level: 55, icon: '岛',
          immortals: ['相思断肠红', '绮罗郁金香', '奇茸通天菊', '水仙玉肌骨', '八瓣仙兰'],
          spiritGrasses: ['净世莲', '岁时花', '金芝叶'],
          otherDrops: ['魂币 5000~50000', '万年魂骨（随机）'],
          dropRates: { immortal: '20%', spirit: '50%', coin: '15%', soulbone: '15%' },
          detailDesc: '湖心小岛是冰火两仪眼的中心，阴阳二气在此交汇融合，灵气最为浓郁。传说中至情至性的仙草——相思断肠红便生长于此。',
        },
        {
          id: 'icefire-4', name: '药香小径', desc: '遍布灵草的小径，芬芳扑鼻', level: 80, icon: '径',
          immortals: ['幽香绮罗仙品', '烈火杏娇疏', '八角玄冰草', '千年藤', '风影翼'],
          spiritGrasses: ['长生藤', '赤炎花', '冰魄莲', '水涟花', '厚土参'],
          otherDrops: ['魂币 5000~50000', '万年魂骨（随机）'],
          dropRates: { immortal: '20%', spirit: '50%', coin: '15%', soulbone: '15%' },
          detailDesc: '药香小径蜿蜒于两仪眼外围，沿途生长着各色灵草与普通仙草。药香馥郁，百步之外便可闻知，是采药人常往之地。',
        },
        {
          id: 'icefire-5', name: '毒瘴谷口', desc: '通往毒瘴深处的入口，危险与机遇并存', level: 82, icon: '瘴',
          immortals: ['幽香绮罗仙品', '八角玄冰草', '雪色天鹅吻', '黄泉露', '岁月花', '虚空晶'],
          spiritGrasses: ['幽冥菇', '虚空晶', '岁时花'],
          otherDrops: ['魂币 5000~50000', '万年魂骨（随机）'],
          dropRates: { immortal: '20%', spirit: '50%', coin: '15%', soulbone: '15%' },
          detailDesc: '毒瘴谷口常年笼罩着剧毒瘴气，普通魂师难以靠近。然毒物旁必有灵药，此处生长的仙草灵草皆具抗毒御邪之效。传说剧毒仙草黄泉露便隐匿于谷口深处。',
        },
         {
           id: 'icefire-6', name: '仙品圣地', desc: '传说中相思断肠红所在的秘境', level: 90, icon: '仙',
           immortals: ['相思断肠红', '绮罗郁金香', '奇茸通天菊', '烈火杏娇疏', '八角玄冰草', '幽香绮罗仙品', '圣龙耀阳草', '黄泉露', '望穿秋水露', '鸡冠凤凰葵', '水仙玉肌骨', '八瓣仙兰', '雪色天鹅吻', '龙芝叶', '金刚不坏莲', '千年藤', '沧海珠', '玄土鼎', '太阳精', '虚空晶', '岁月花', '天雷果', '风影翼'],
           spiritGrasses: ['净世莲', '岁时花', '幽冥菇', '虚空晶'],
           otherDrops: ['魂币 5000~50000', '万年魂骨（随机）'],
           dropRates: { immortal: '20%', spirit: '50%', coin: '15%', soulbone: '15%' },
           detailDesc: '仙品圣地是冰火两仪眼最深处的秘境，传说中所有仙品仙草皆源于此地。灵气浓度冠绝两仪眼，是炼丹采药的终极圣地。圣龙耀阳草在此地亦有生长，仙草掉落中约20%概率可得。',
         },
      ];

      const openLootGuide = (zoneId: string) => {
        setIceFireLootZoneId(zoneId);
        setIceFireLootOpen(true);
      };

      const currentLootZone = ICE_FIRE_ZONES.find((z) => z.id === iceFireLootZoneId);

      // 根据仙草/灵草名称查找详细信息
      const findImmortal = (name: string) => ICE_FIRE_IMMORTAL_GRASSES.find((g) => g.name === name);
      const findSpiritGrass = (name: string) => HOLY_GRASSES.find((g) => g.name === name);

      const handleExploreZone = (zoneId: string, zoneName: string) => {
        if (!player) return;
         // 冷却检查：每个地点独立3分钟冷却
         const lastExplore = iceFireCooldowns[zoneId] || 0;
         const now = Date.now();
         const remaining = 180000 - (now - lastExplore);
         if (remaining > 0) {
           const sec = Math.ceil(remaining / 1000);
           toast.error(`冷却中，还需 ${sec} 秒`);
           return;
         }
          // 🔴 进入探索区域立即触发冷却，防止留节点不探索返回后绕过冷却
          // 同时递增冰火两仪眼进入次数，用于成就统计
          setPlayer((p) => ({
            ...p,
            iceFireCooldowns: { ...p.iceFireCooldowns, [zoneId]: Date.now() + 180000 },
            achievementStats: {
              ...(p.achievementStats ?? {} as any),
              liangyiEyeEnterCount: ((p.achievementStats as any)?.liangyiEyeEnterCount ?? 0) + 1,
            },
          }));
         setIceFireCurrentZone({ id: zoneId, name: zoneName });
         setView('iceFireExplore');
      };

      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={backToBigMap}
              className="p-1.5 rounded-lg bg-card/40 border border-cyan-500/20 hover:bg-card/60 transition-colors text-cyan-600"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-cyan-300" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                冰火两仪眼
              </h2>
              <p className="text-[10px] text-muted-foreground -mt-0.5">天然聚宝盆 · 珍稀仙草遍地</p>
            </div>
          </div>

          <div className="rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-950/30 via-card/50 to-cyan-950/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flower2 className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-semibold text-orange-200">探索规则</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
               <p>· 每个地点探索冷却 3 分钟</p>
               <p>· 可能获得：仙草（35%）、灵草（40%）、金币（10%）、魂骨（15%）</p>
               <p>· 仙草中：普通仙草约60%、仙品约25%、神品约10%、特殊仙草约5%（炽热阳泉圣龙耀阳草约30%、仙品圣地约20%）</p>
               <p>· 仙品仙草一世仅限服用一株，灵草每种最多服用5株</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ICE_FIRE_ZONES.map((zone) => {
               const locked = (player?.level ?? 0) < zone.level;
               const lastExplore = iceFireCooldowns[zone.id] || 0;
               const now = Date.now();
               const remaining = Math.max(0, 180000 - (now - lastExplore));
               const onCooldown = remaining > 0;
               return (
                 <div
                   key={zone.id}
                   className={`group relative overflow-hidden rounded-xl border text-left transition-all duration-300 ${
                     locked
                       ? 'border-border/20 bg-card/20 opacity-60'
                       : 'border-orange-500/30 bg-gradient-to-br from-orange-950/20 via-card/60 to-cyan-950/20'
                   }`}
                 >
                   <div className="relative p-4">
                     <div className="flex items-start gap-3 mb-3">
                       <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-base ${
                         locked
                           ? 'bg-muted/30 border border-border/30 text-muted-foreground'
                           : 'bg-gradient-to-br from-orange-600/30 to-cyan-600/30 border border-orange-500/40 text-orange-200'
                       }`}>
                         {locked ? <Lock className="h-4 w-4" /> : zone.icon}
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="font-bold text-sm text-foreground mb-0.5">{zone.name}</div>
                         <div className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{zone.desc}</div>
                         <div className="text-[10px] mt-1">
                           {locked ? (
                             <span className="text-red-400">需{zone.level}级</span>
                           ) : onCooldown ? (
                             <span className="text-amber-400">冷却中 {Math.ceil(remaining / 1000)}s</span>
                           ) : (
                             <span className="text-green-400">可探索</span>
                           )}
                         </div>
                       </div>
                     </div>
                     <div className="flex gap-2">
                       <button
                         onClick={() => !locked && !onCooldown && handleExploreZone(zone.id, zone.name)}
                         disabled={locked || onCooldown}
                         className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-orange-600/40 to-cyan-600/40 border border-orange-500/40 text-orange-100 hover:from-orange-500/50 hover:to-cyan-500/50 active:scale-[0.97]"
                       >
                         <span className="flex items-center justify-center gap-1">
                           <Search className="h-3 w-3" />
                           进入探索
                         </span>
                       </button>
                       <button
                         onClick={() => openLootGuide(zone.id)}
                         className="py-2 px-3 rounded-lg text-xs font-semibold transition-all bg-card/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-card/80 hover:border-orange-500/40 active:scale-[0.97]"
                       >
                         <span className="flex items-center justify-center gap-1">
                           <BookOpen className="h-3 w-3" />
                           产出
                         </span>
                       </button>
                     </div>
                   </div>
                 </div>
               );
             })}
           </div>

           {/* 产出介绍弹窗 */}
           {iceFireLootOpen && currentLootZone && (
             <div
               className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
               onClick={() => setIceFireLootOpen(false)}
             >
               <motion.div
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ duration: 0.2 }}
                 onClick={(e) => e.stopPropagation()}
                 className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl border border-orange-500/40 bg-gradient-to-br from-card via-card/95 to-card shadow-2xl"
               >
                 <div className="sticky top-0 z-10 bg-gradient-to-r from-orange-950/80 to-cyan-950/80 backdrop-blur-md border-b border-orange-500/30 p-4 flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold bg-gradient-to-br from-orange-600/40 to-cyan-600/40 border border-orange-500/40 text-orange-200">
                     {currentLootZone.icon}
                   </div>
                   <div className="flex-1 min-w-0">
                     <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                       {currentLootZone.name} · 产出一览
                     </h3>
                     <p className="text-[11px] text-muted-foreground">推荐等级 {currentLootZone.level} 级</p>
                   </div>
                   <button
                     onClick={() => setIceFireLootOpen(false)}
                     className="p-1.5 rounded-lg hover:bg-card/60 text-muted-foreground hover:text-foreground transition-colors"
                   >
                     ✕
                   </button>
                 </div>

                 <div className="p-4 space-y-4">
                   {/* 区域介绍 */}
                   <div className="text-xs text-muted-foreground leading-relaxed bg-card/40 rounded-lg p-3 border border-border/30">
                     {currentLootZone.detailDesc}
                   </div>

                   {/* 掉落概率 */}
                   <div>
                     <div className="text-sm font-semibold text-orange-300 mb-2 flex items-center gap-2">
                       <Sparkles className="h-3.5 w-3.5" />
                       掉落概率
                     </div>
                     <div className="grid grid-cols-2 gap-2 text-xs">
                       <div className="flex items-center justify-between bg-card/40 rounded-lg px-3 py-2 border border-border/30">
                         <span className="text-amber-300">仙品仙草</span>
                         <span className="font-bold text-amber-200">{currentLootZone.dropRates.immortal}</span>
                       </div>
                       <div className="flex items-center justify-between bg-card/40 rounded-lg px-3 py-2 border border-border/30">
                         <span className="text-green-300">灵草</span>
                         <span className="font-bold text-green-200">{currentLootZone.dropRates.spirit}</span>
                       </div>
                       <div className="flex items-center justify-between bg-card/40 rounded-lg px-3 py-2 border border-border/30">
                         <span className="text-yellow-300">魂币</span>
                         <span className="font-bold text-yellow-200">{currentLootZone.dropRates.coin}</span>
                       </div>
                       <div className="flex items-center justify-between bg-card/40 rounded-lg px-3 py-2 border border-border/30">
                         <span className="text-purple-300">魂骨</span>
                         <span className="font-bold text-purple-200">{currentLootZone.dropRates.soulbone}</span>
                       </div>
                     </div>
                   </div>

                   {/* 仙草列表 */}
                   <div>
                     <div className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
                       <Flower2 className="h-3.5 w-3.5" />
                       可能产出 · 仙品仙草
                     </div>
                     <div className="space-y-2">
                       {currentLootZone.immortals.map((name) => {
                         const item = findImmortal(name);
                         if (!item) return null;
                         const extra = getConsumableExtra(item);
                         return (
                           <div
                             key={name}
                             className="rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-950/20 to-transparent p-3"
                           >
                             <div className="flex items-start gap-2">
                               <div
                                 className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm border"
                                 style={{ borderColor: item.qualityColor + '60', color: item.qualityColor, backgroundColor: item.qualityColor + '15' }}
                               >
                                 {item.iconChar}
                               </div>
                               <div className="flex-1 min-w-0">
                                 <div className="text-sm font-bold" style={{ color: item.qualityColor }}>{item.name}</div>
                                 <div className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                                   {extra?.effectDesc || item.description}
                                 </div>
                               </div>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>

                   {/* 灵草列表 */}
                   <div>
                     <div className="text-sm font-semibold text-green-300 mb-2 flex items-center gap-2">
                       <Leaf className="h-3.5 w-3.5" />
                       可能产出 · 灵草
                     </div>
                     <div className="grid grid-cols-1 gap-2">
                       {currentLootZone.spiritGrasses.map((name) => {
                         const item = findSpiritGrass(name);
                         if (!item) return null;
                         const extra = getConsumableExtra(item);
                         return (
                           <div
                             key={name}
                             className="rounded-lg border border-green-500/20 bg-gradient-to-r from-green-950/15 to-transparent p-2.5"
                           >
                             <div className="flex items-center gap-2">
                               <div
                                 className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 font-bold text-xs border"
                                 style={{ borderColor: item.qualityColor + '50', color: item.qualityColor, backgroundColor: item.qualityColor + '12' }}
                               >
                                 {item.iconChar}
                               </div>
                               <div className="flex-1 min-w-0">
                                 <div className="text-xs font-semibold" style={{ color: item.qualityColor }}>{item.name}</div>
                                 <div className="text-[10px] text-muted-foreground truncate">
                                   {extra?.effectDesc || item.description}
                                 </div>
                               </div>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>

                   {/* 其他掉落 */}
                   <div>
                     <div className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                       <Gift className="h-3.5 w-3.5" />
                       其他掉落
                     </div>
                     <div className="space-y-1 text-xs text-muted-foreground">
                       {currentLootZone.otherDrops.map((d, i) => (
                         <div key={i} className="flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                           {d}
                         </div>
                       ))}
                     </div>
                   </div>

                   <div className="pt-2">
                     <button
                       onClick={() => setIceFireLootOpen(false)}
                       className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-600/50 to-cyan-600/50 border border-orange-500/40 text-sm font-bold text-orange-100 hover:from-orange-500/60 hover:to-cyan-500/60 active:scale-[0.98] transition-all"
                     >
                       我知道了
                     </button>
                   </div>
                 </div>
               </motion.div>
             </div>
           )}
         </div>
       );
     }

     // === 冰火两仪眼 - 探索节点视图 ===
    if (view === 'iceFireExplore' && iceFireCurrentZone) {
      const { id: zoneId, name: zoneName } = iceFireCurrentZone;
      const nodes = iceFireNodes;

      const handleSearchNode = (nodeIdx: number) => {
        if (nodes[nodeIdx].searched) return;
        const result = rollIceFireDrop(zoneId);
        const newNodes = [...nodes];
        newNodes[nodeIdx] = { ...newNodes[nodeIdx], searched: true, drop: result };
        setIceFireNodes(newNodes);
        setIceFireCurrentDrop(result);
        setIceFireDropOpen(true);
        // 所有节点探索完也记录一次（确保与进入时一致，防止前端状态偏差）
        const allDone = newNodes.every((n) => n.searched);
        if (allDone) {
          setPlayer((p) => ({
            ...p,
            iceFireCooldowns: { ...p.iceFireCooldowns, [zoneId]: Date.now() + 180000 },
          }));
        }
      };

      const handleBack = () => {
        setView('iceFireEye');
        setIceFireNodes(Array.from({ length: 6 }, (_, i) => ({ id: i, searched: false })));
        setIceFireCurrentZone(null);
      };

      const allDone = nodes.every((n) => n.searched);

      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="p-1.5 rounded-lg bg-card/40 border border-cyan-500/20 hover:bg-card/60 transition-colors text-cyan-600"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-orange-300" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                {zoneName}
              </h2>
              <p className="text-[10px] text-muted-foreground -mt-0.5">探索 6 个节点获取仙草与灵草</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {nodes.map((node, idx) => (
              <button
                key={node.id}
                onClick={() => handleSearchNode(idx)}
                disabled={node.searched}
                className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                  node.searched
                    ? 'border-border/20 bg-card/20 opacity-60'
                    : 'border-orange-500/30 bg-gradient-to-br from-orange-950/20 to-cyan-950/20 hover:border-orange-400/60 active:scale-95'
                }`}
              >
                <Flower2 className={`h-6 w-6 ${node.searched ? 'text-muted-foreground' : 'text-orange-400'}`} />
                <span className={`text-xs font-medium ${node.searched ? 'text-muted-foreground' : 'text-foreground'}`}>
                  节点 {idx + 1}
                </span>
                {node.searched && (
                  <span className="text-[10px] text-muted-foreground">已探索</span>
                )}
              </button>
            ))}
          </div>

          {allDone && (
            <button
              onClick={handleBack}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 text-white font-bold shadow-lg shadow-orange-500/20 active:scale-[0.99] transition-all"
            >
              完成探索
            </button>
          )}

          {/* 掉落弹窗 */}
          {iceFireDropOpen && iceFireCurrentDrop && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
              onClick={() => setIceFireDropOpen(false)}
            >
              <div
                className="w-full max-w-sm rounded-2xl border border-orange-500/30 bg-gradient-to-br from-card to-background p-5 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-4">
                  <div className="text-sm text-muted-foreground mb-1">探索获得</div>
                  <div className="text-xl font-bold text-orange-300" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                    {iceFireCurrentDrop.type === 'immortal' && '仙品仙草！'}
                    {iceFireCurrentDrop.type === 'spirit' && '灵草'}
                    {iceFireCurrentDrop.type === 'coin' && '魂币'}
                    {iceFireCurrentDrop.type === 'soulbone' && '魂骨！'}
                  </div>
                </div>
                <div className="flex justify-center mb-5">
                  <div
                    className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-bold border-2"
                    style={{
                      borderColor: iceFireCurrentDrop.color || '#888',
                      color: iceFireCurrentDrop.color || '#888',
                      backgroundColor: `${iceFireCurrentDrop.color || '#888'}15`,
                      boxShadow: `0 0 30px ${iceFireCurrentDrop.color || '#888'}40`,
                    }}
                  >
                    {iceFireCurrentDrop.iconChar}
                  </div>
                </div>
                <div className="text-center mb-5">
                  <div className="font-bold text-base mb-1">{iceFireCurrentDrop.name}</div>
                  <div className="text-xs text-muted-foreground">{iceFireCurrentDrop.desc}</div>
                </div>
                <button
                  onClick={() => setIceFireDropOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 text-white font-bold active:scale-[0.98] transition-all"
                >
                  确定
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

  return (
    <>
      {/* 天梦冰蚕献祭奇遇弹窗（仅在非战斗状态、回到地图后显示） */}
      {!inBattle && (
        <TianmengSacrificeDialog
          open={showTianmengDialog}
          onAccept={handleAcceptTianmeng}
          onReject={handleRejectTianmeng}
        />
      )}
      {/* 凶兽青睐弹窗（战斗胜利返回地图后触发） */}
      <AnimatePresence>
        {showBeastFavor && favorBeast?.humanForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowBeastFavor(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280, delay: 0.1 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-amber-400/40 bg-gradient-to-b from-amber-950/95 via-purple-950/95 to-indigo-950/95 p-5 shadow-2xl relative overflow-hidden"
            >
              {/* 装饰粒子 */}
              <div className="absolute inset-0 pointer-events-none opacity-40">
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-amber-400/20 blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-pink-500/20 blur-3xl" />
              </div>

              {/* 头部：获得青睐 */}
              <div className="text-center mb-4 relative">
                <div className="text-xs text-amber-300/80 tracking-widest mb-1">· 凶兽青睐 ·</div>
                <div className="text-lg font-bold text-amber-200" style={{ textShadow: '0 0 12px rgba(251, 191, 36, 0.4)' }}>
                  你获得了 {favorBeast.name} 的青睐
                </div>
              </div>

              {/* 头像区 */}
              <div className="relative mb-4">
                <div className="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center text-5xl font-bold bg-gradient-to-br from-amber-500/30 to-rose-500/30 ring-4 ring-amber-400/60" style={{ textShadow: '0 0 12px currentColor' }}>
                  {favorBeast.iconChar}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10px] font-bold whitespace-nowrap">
                  {favorBeast.title}
                </div>
              </div>

              {/* 信息区 */}
              <div className="text-center mb-4">
                <div className="text-base font-bold text-amber-200">{favorBeast.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{favorBeast.martialSoul} · {favorBeast.element}</div>
                <div className="text-[11px] text-amber-300/70 mt-1">{favorBeast.humanForm.gender}性 · 化形修为</div>
              </div>

              {/* 外观描述 */}
              <div className="rounded-lg border border-amber-500/20 bg-black/30 p-3 mb-4 max-h-28 overflow-y-auto">
                <div className="text-[10px] text-muted-foreground mb-1">化形外观</div>
                <p className="text-xs text-amber-100/80 leading-relaxed">{favorBeast.humanForm.appearance}</p>
              </div>

              {/* 性格 */}
              <div className="rounded-lg border border-purple-500/20 bg-purple-900/20 p-3 mb-5">
                <div className="text-[10px] text-purple-300 mb-1">性格</div>
                <p className="text-xs text-purple-100/80">{favorBeast.humanForm.personality}</p>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={handleRejectBeastFavor}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs border border-border/60 text-muted-foreground hover:bg-accent/30 hover:text-foreground transition-all"
                >
                  婉拒
                </button>
                <button
                  onClick={handleAcceptBeastFavor}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-rose-500 text-white hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                >
                  接受青睐
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔴 一键扫荡结算弹窗 */}
      <AnimatePresence>
        {sweepResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setSweepResult(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md max-h-[85vh] overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-b from-amber-950/90 via-purple-950/90 to-indigo-950/90 shadow-2xl flex flex-col"
            >
              {/* 顶部标题 */}
              <div className="relative px-5 py-4 border-b border-amber-500/30 flex-shrink-0">
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-amber-400/20 blur-3xl" />
                </div>
                <div className="relative text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <SparklesIcon className="h-5 w-5 text-amber-400" />
                    <h3 className="text-xl font-bold text-amber-200" style={{ fontFamily: "'Noto Serif SC', serif", textShadow: '0 0 12px rgba(251, 191, 36, 0.4)' }}>
                      扫荡完成
                    </h3>
                    <SparklesIcon className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="text-[11px] text-amber-300/70">6 节点一键完成，掉落按筛选设置处理</div>
                </div>
                <button
                  onClick={() => setSweepResult(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 滚动内容区 */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {/* 基础收益 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-black/40 border border-cyan-500/30 p-3 text-center">
                    <div className="text-[10px] text-muted-foreground mb-1">修为</div>
                    <div className="text-lg font-bold text-cyan-300">+{sweepResult.exp.toLocaleString()}</div>
                  </div>
                  <div className="rounded-xl bg-black/40 border border-amber-500/30 p-3 text-center">
                    <div className="text-[10px] text-muted-foreground mb-1">魂币</div>
                    <div className="text-lg font-bold text-amber-300">+{sweepResult.coins.toLocaleString()}</div>
                  </div>
                </div>

                {sweepResult.filterSummary && <div className="rounded-xl bg-card/60 border border-cyan-500/25 p-3 text-xs space-y-1" data-sweep-summary>
                  <div>魂环保留 {sweepResult.filterSummary.keptRings} 个 · 销毁 {sweepResult.filterSummary.destroyedRings} 个</div>
                  <div>魂骨保留 {sweepResult.filterSummary.keptBones} 件 · 出售 {sweepResult.filterSummary.soldBones} 件</div>
                  <div className="text-amber-300">出售所得 +{formatNumber(sweepResult.filterSummary.soldCoins)} 魂币（已计入总收益）</div>
                </div>}
                {/* 魂环列表 */}
                {sweepResult.rings.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-[0_0_8px_rgba(251_191_36_0.5)]" />
                      魂环 × {sweepResult.rings.length}
                      <span className="text-[10px] text-muted-foreground font-normal ml-1">（3分钟内可吸收）</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {sweepResult.rings.slice(0, 12).map((ring: any, i: number) => {
                        const ringColor = RING_DISPLAY_COLOR[ring.color as keyof typeof RING_DISPLAY_COLOR] || '#fff';
                        return (
                          <motion.div
                            key={ring.id || i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="flex items-center gap-2 rounded-lg bg-black/30 border border-border/40 p-2"
                          >
                            <div
                              className="w-6 h-6 shrink-0 rounded-full border-2 flex-shrink-0"
                              style={{
                                borderColor: ringColor,
                                boxShadow: `0 0 8px ${ringColor}80`,
                                background: `radial-gradient(circle, ${ringColor}20 0%, transparent 70%)`,
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-medium text-foreground truncate">{ring.soulBeastName}</div>
                              <div className="text-[9px] text-muted-foreground flex items-center gap-1">
                                <span>{formatYearsLabel(ring.years || 0)}</span>
                                {ring.beastAttribute && <span>· {ring.beastAttribute}</span>}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                    {sweepResult.rings.length > 12 && (
                      <div className="text-[10px] text-muted-foreground text-center">
                        还有 {sweepResult.rings.length - 12} 个魂环未展示...
                      </div>
                    )}
                  </div>
                )}

                {/* 物品列表（魂骨、仙草、材料） */}
                {sweepResult.items.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Gift className="h-4 w-4 text-purple-400" />
                      物品 × {sweepResult.items.length}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {sweepResult.items.slice(0, 10).map((item: any, i: number) => (
                        <motion.div
                          key={item.id || i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.03 }}
                          className="flex items-center gap-2 rounded-lg bg-black/30 border border-border/40 p-2"
                        >
                          <div
                            className="w-7 h-7 shrink-0 rounded-md flex items-center justify-center text-sm font-bold border"
                            style={{
                              borderColor: item.qualityColor || 'hsl(var(--muted-foreground))',
                              backgroundColor: `${item.qualityColor || 'hsl(var(--muted))'}15`,
                              color: item.qualityColor || 'hsl(var(--foreground))',
                            }}
                          >
                            {item.iconChar || item.name?.charAt?.(0) || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-medium text-foreground truncate">{item.name}</div>
                            <div className="text-[9px] text-muted-foreground truncate">{item.type || item.qualityLabel || '物品'}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    {sweepResult.items.length > 10 && (
                      <div className="text-[10px] text-muted-foreground text-center">
                        还有 {sweepResult.items.length - 10} 件物品未展示...
                      </div>
                    )}
                  </div>
                )}

                {sweepResult.rings.length === 0 && sweepResult.items.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    本次扫荡未获得额外物品
                  </div>
                )}
              </div>

              {/* 底部按钮 */}
              <div className="px-5 py-4 border-t border-border/30 flex-shrink-0">
                <button
                  onClick={() => setSweepResult(null)}
                  className="w-full h-11 rounded-xl font-bold text-base bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-amber-950 hover:shadow-[0_0_20px_rgba(251_191_36_0.4)] active:scale-[0.98] transition-all"
                >
                  我知道了
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// === 遭遇魂兽弹窗组件 ===
interface EncounterModalProps {
  beast: EncounterBeast;
  onFight: () => void;
  onFlee: () => void;
}

function EncounterModal({ beast, onFight, onFlee }: EncounterModalProps) {
  const ringColor = RING_DISPLAY_COLOR[beast.qualityColor as keyof typeof RING_DISPLAY_COLOR] || '#ccc';
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onFlee}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="rounded-2xl border-2 p-5 text-center relative overflow-hidden"
          style={{
            backgroundColor: `${ringColor}12`,
            borderColor: `${ringColor}70`,
            boxShadow: `0 0 60px ${ringColor}40, inset 0 1px 0 ${ringColor}30`,
          }}
        >
          {/* 顶部光晕 */}
          <div
            className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full blur-3xl pointer-events-none"
            style={{ backgroundColor: `${ringColor}30` }}
          />

          <div className="relative">
            <div className="text-xs text-muted-foreground mb-1">遭遇魂兽！</div>

            {/* 魂兽名称 */}
            <h2
              className="text-2xl font-black mb-1"
              style={{ color: ringColor, textShadow: `0 0 18px ${ringColor}80` }}
            >
              {beast.name}
            </h2>

            {/* 魂环品质 + 年限 */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <div
                className="w-7 h-1.5 rounded-full border-2"
                style={{
                  borderColor: ringColor,
                  backgroundColor: `${ringColor}40`,
                  boxShadow: `0 0 8px ${ringColor}`,
                }}
              />
              <span className="text-sm font-bold" style={{ color: ringColor }}>
                {beast.qualityLabel}
              </span>
              <span className="text-xs text-muted-foreground">
                {beast.years.toLocaleString()} 年
              </span>
            </div>

            {/* 属性标签：双重兜底，确保绝不显示空白或无属性 */}
            <div className="text-xs text-muted-foreground mb-2">
              属性：{normalizeBeastAttribute(beast.element || inferElementFromName(beast.name))}
            </div>

            {/* 魂兽描述 */}
            {beast.description && (
              <div className="text-[11px] text-foreground/80 mb-3 bg-background/30 rounded-lg px-2.5 py-1.5 leading-relaxed">
                {beast.description}
              </div>
            )}

            {/* 属性概览 */}
            <div className="grid grid-cols-4 gap-1.5 mb-3 text-xs">
              <div className="bg-background/40 rounded-lg p-1.5">
                <div className="text-[10px] text-muted-foreground">气血</div>
                <div className="font-bold text-red-600 tabular-nums">{beast.hp}</div>
              </div>
              <div className="bg-background/40 rounded-lg p-1.5">
                <div className="text-[10px] text-muted-foreground">攻击</div>
                <div className="font-bold text-cyan-300 tabular-nums">{beast.attack}</div>
              </div>
              <div className="bg-background/40 rounded-lg p-1.5">
                <div className="text-[10px] text-muted-foreground">防御</div>
                <div className="font-bold text-blue-600 tabular-nums">{beast.defense}</div>
              </div>
              <div className="bg-background/40 rounded-lg p-1.5">
                <div className="text-[10px] text-muted-foreground">速度</div>
                <div className="font-bold text-green-600 tabular-nums">{beast.speed}</div>
              </div>
            </div>

            {/* 魂技介绍 */}
            <div className="bg-background/40 rounded-lg p-2.5 mb-3 text-left">
              <div className="text-[10px] text-muted-foreground mb-0.5">魂技</div>
              <div className="text-sm font-bold" style={{ color: ringColor }}>
                {beast.skillName}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {beast.skillDesc}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={onFight}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white font-medium hover:from-red-400 hover:to-red-600 shadow-lg shadow-red-900/40 transition-all active:scale-95 text-sm"
              >
                <Swords className="h-4 w-4" />
                开始对战
              </button>
              <button
                onClick={onFlee}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-muted/70 border border-border/50 text-foreground/80 font-medium hover:bg-muted hover:text-foreground transition-all active:scale-95 text-sm"
              >
                <SkipForward className="h-4 w-4" />
                逃跑
              </button>
            </div>
            <div className="text-[10px] text-muted-foreground mt-2.5">
              逃跑将跳过此魂兽，不获得奖励也不额外消耗体力
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* 天梦冰蚕奇遇弹窗在 MapPanel 主 return 中渲染（见下方） */
