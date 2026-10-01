// EXPORTS: ISeaGodMember, SEA_GOD_MEMBERS, calcSeaGodMemberStats, SEA_GOD_POSITION_TITLE

import { calcAttributes, calcRingStatsByYears, type ISoulRing, type IDomain } from '@/lib/gameStore';
import { type IItem } from '@/data/items';

/** 海神阁成员 */
export interface ISeaGodMember {
  id: string;
  name: string;
  title: string; // 封号，如「龙神斗罗」
  level: number; // 等级 90-99
  position: 'pavilion-master' | 'vice-master' | 'elder' | 'common'; // 阁主/副阁主/长老/普通宿老
  martialSoul: {
    name: string;
    type: string; // 如「兽武魂·强攻系」
    extremeAttribute?: string; // 极致属性
    element?: string; // 属性
    baseStats: { attack: number; defense: number; speed: number; spirit: number; hp: number };
  };
  /** 魂环配比，从第1到第9魂环的颜色 */
  ringColors: Array<'white' | 'yellow' | 'purple' | 'black' | 'red' | 'gold'>;
  /** 魂环年限（按配比估算，用于属性计算） */
  ringYears: number[];
  /** 魂兽类型（决定属性分配倾向），每个魂环对应一种（这里简化用同一种） */
  beastType: 'qiang' | 'min' | 'kong' | 'fu' | 'fang';
  /** 魂兽属性（决定属性共鸣），读取自 martialSoul.element */
  /** 魂骨配置 */
  soulBones: Array<{
    slot: 'head' | 'torso' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg' | 'external';
    name: string;
    quality: 'fine' | 'epic' | 'legendary';
    years: number;
    attributes: {
      attack?: number;
      defense?: number;
      speed?: number;
      spirit?: number;
      hp?: number;
      critRate?: number;
      critDmg?: number;
      allAttr?: number;
    };
  }>;
  /** 领域（95级以上才有） */
  domain?: {
    name: string;
    cultivationAttr: 'strength' | 'spirit' | 'agility' | 'defense' | 'support' | 'chaos';
    baseBonuses: { attack?: number; defense?: number; speed?: number; spirit?: number; hp?: number; allAttr?: number; critRate?: number; critDmg?: number; skillDmg?: number };
  };
  /** 9个魂技名称 */
  soulSkills: string[];
  /** 击败奖励 */
  rewards: {
    exp: number;
    coins: number;
  };
}

/** 魂环品质对应的标准年限（用于属性计算） */
const RING_YEAR_MAP: Record<string, number> = {
  white: 50,
  yellow: 500,
  purple: 5000,
  black: 50000,
  red: 120000,
  gold: 500000,
};

/** 根据魂环颜色数组生成年限数组 */
function buildRingYears(colors: string[]): number[] {
  return colors.map((c) => RING_YEAR_MAP[c] ?? 100);
}

// ============================ 成员数据 ============================

export const SEA_GOD_MEMBERS: ISeaGodMember[] = [
  // 1. 穆恩 - 海神阁阁主
  {
    id: 'mu-en',
    name: '穆恩',
    title: '龙神斗罗',
    level: 99,
    position: 'pavilion-master',
    martialSoul: {
      name: '光明圣龙',
      type: '兽武魂·强攻系',
      extremeAttribute: '极致之光明',
      element: '光属性',
      baseStats: { attack: 90, defense: 75, speed: 80, spirit: 85, hp: 90 },
    },
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'red'],
    ringYears: [],
    beastType: 'qiang',
    soulBones: [
      { slot: 'head', name: '光明圣龙头骨', quality: 'legendary', years: 150000, attributes: { spirit: 80, attack: 30, allAttr: 5, critRate: 3 } },
      { slot: 'torso', name: '圣龙躯干骨', quality: 'legendary', years: 180000, attributes: { hp: 500, defense: 60, allAttr: 5 } },
      { slot: 'external', name: '龙神外附魂骨', quality: 'legendary', years: 200000, attributes: { attack: 50, speed: 30, critDmg: 10, allAttr: 3 } },
    ],
    domain: {
      name: '光明龙神领域',
      cultivationAttr: 'strength',
      baseBonuses: { attack: 0.25, defense: 0.15, allAttr: 0.05, critRate: 0.05 },
    },
    soulSkills: [
      '光明龙爪',
      '龙光之怒',
      '圣龙护体',
      '龙息喷射',
      '光明龙域',
      '龙神之威',
      '武魂真身·光明圣龙',
      '光明净化',
      '龙神降临',
    ],
    rewards: { exp: 500000, coins: 500000 },
  },
  // 2. 玄子 - 副阁主
  {
    id: 'xuan-zi',
    name: '玄子',
    title: '饕餮斗罗',
    level: 98,
    position: 'vice-master',
    martialSoul: {
      name: '饕餮神牛',
      type: '兽武魂·强攻系',
      extremeAttribute: '极致之力量',
      element: '土属性',
      baseStats: { attack: 95, defense: 80, speed: 60, spirit: 65, hp: 100 },
    },
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'red'],
    ringYears: [],
    beastType: 'qiang',
    soulBones: [
    ],
    domain: {
      name: '饕餮吞噬领域',
      cultivationAttr: 'strength',
      baseBonuses: { attack: 0.22, hp: 0.20, defense: 0.10 },
    },
    soulSkills: [
      '饕餮噬咬',
      '巨牛冲撞',
      '土之壁垒',
      '吞噬天地',
      '大地崩裂',
      '神力爆发',
      '武魂真身·饕餮神牛',
      '饕餮吞天',
      '饕餮之怒',
    ],
    rewards: { exp: 300000, coins: 300000 },
  },
  // 3. 言少哲
  {
    id: 'yan-shao-zhe',
    name: '言少哲',
    title: '明凤斗罗',
    level: 97,
    position: 'elder',
    martialSoul: {
      name: '光明凤凰',
      type: '兽武魂·强攻系',
      extremeAttribute: '极致之光明',
      element: '光属性',
      baseStats: { attack: 88, defense: 65, speed: 90, spirit: 75, hp: 75 },
    },
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'red'],
    ringYears: [],
    beastType: 'qiang',
    soulBones: [
    ],
    domain: {
      name: '光明凤凰领域',
      cultivationAttr: 'strength',
      baseBonuses: { attack: 0.20, speed: 0.10, critRate: 0.05 },
    },
    soulSkills: [
      '凤凰火线',
      '光明炎爆',
      '凤翼天翔',
      '烈焰风暴',
      '凤凰涅槃',
      '光明普照',
      '武魂真身·光明凤凰',
      '凤舞九天',
      '凤凰穿云击',
    ],
    rewards: { exp: 200000, coins: 200000 },
  },
  // 4. 仙琳儿
  {
    id: 'xian-liner',
    name: '仙琳儿',
    title: '青炎斗罗',
    level: 95,
    position: 'elder',
    martialSoul: {
      name: '青炎鹰',
      type: '兽武魂·敏攻系',
      extremeAttribute: '极致之火',
      element: '火属性',
      baseStats: { attack: 80, defense: 55, speed: 95, spirit: 70, hp: 65 },
    },
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'black'],
    ringYears: [],
    beastType: 'min',
    soulBones: [
    ],
    domain: {
      name: '青炎焚空领域',
      cultivationAttr: 'agility',
      baseBonuses: { speed: 0.25, attack: 0.15, critRate: 0.05 },
    },
    soulSkills: [
      '青炎爪击',
      '烈焰俯冲',
      '鹰击长空',
      '青炎风暴',
      '火焰旋刃',
      '极速连击',
      '武魂真身·青炎鹰',
      '焚空一击',
      '炎翼天杀',
    ],
    rewards: { exp: 150000, coins: 150000 },
  },
  // 5. 钱多多
  {
    id: 'qian-duo-duo',
    name: '钱多多',
    title: '乌龙斗罗',
    level: 95,
    position: 'elder',
    martialSoul: {
      name: '乌龙',
      type: '兽武魂·防御系',
      extremeAttribute: '极致之防御',
      element: '土属性',
      baseStats: { attack: 65, defense: 95, speed: 50, spirit: 60, hp: 110 },
    },
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'black'],
    ringYears: [],
    beastType: 'fang',
    soulBones: [
    ],
    domain: {
      name: '乌龙磐石领域',
      cultivationAttr: 'defense',
      baseBonuses: { defense: 0.30, hp: 0.25, attack: 0.05 },
    },
    soulSkills: [
      '乌龙护盾',
      '铜墙铁壁',
      '岩石铠甲',
      '土龙护体',
      '不动如山',
      '龙鳞防御',
      '武魂真身·乌龙',
      '乌龙金身',
      '绝对防御',
    ],
    rewards: { exp: 150000, coins: 150000 },
  },
  // 6. 蔡媚儿
  {
    id: 'cai-meier',
    name: '蔡媚儿',
    title: '灵猫斗罗',
    level: 94,
    position: 'elder',
    martialSoul: {
      name: '幽冥灵猫',
      type: '兽武魂·敏攻系',
      element: '暗属性',
      baseStats: { attack: 78, defense: 50, speed: 92, spirit: 72, hp: 60 },
    },
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'black'],
    ringYears: [],
    beastType: 'min',
    soulBones: [
    ],
    soulSkills: [
      '幽冥突刺',
      '灵猫影杀',
      '暗影分身',
      '幽冥百爪',
      '潜行暗杀',
      '影杀术',
      '武魂真身·幽冥灵猫',
      '幽冥斩',
      '万魂朝宗',
    ],
    rewards: { exp: 120000, coins: 120000 },
  },
  // 7. 庄老
  {
    id: 'zhuang-lao',
    name: '庄老',
    title: '盘龙斗罗',
    level: 93,
    position: 'elder',
    martialSoul: {
      name: '盘龙棍',
      type: '器武魂·强攻系',
      element: '金属性',
      baseStats: { attack: 85, defense: 60, speed: 65, spirit: 65, hp: 80 },
    },
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'black'],
    ringYears: [],
    beastType: 'qiang',
    soulBones: [
    ],
    soulSkills: [
      '盘龙一击',
      '棍影重重',
      '盘龙护体',
      '横扫千军',
      '龙棍贯日',
      '盘龙领域',
      '武魂真身·盘龙棍',
      '盘龙九天',
      '龙棍镇世',
    ],
    rewards: { exp: 100000, coins: 100000 },
  },
  // 8. 宋老
  {
    id: 'song-lao',
    name: '宋老',
    title: '七杀斗罗',
    level: 92,
    position: 'elder',
    martialSoul: {
      name: '七杀剑',
      type: '器武魂·强攻系',
      element: '金属性',
      baseStats: { attack: 90, defense: 50, speed: 70, spirit: 70, hp: 70 },
    },
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'black'],
    ringYears: [],
    beastType: 'qiang',
    soulBones: [
    ],
    soulSkills: [
      '七杀斩',
      '剑气纵横',
      '剑影分身',
      '长距离剑气',
      '人剑合一',
      '七杀领域',
      '武魂真身·七杀剑',
      '诛仙剑气',
      '一剑隔世',
    ],
    rewards: { exp: 90000, coins: 90000 },
  },
  // 9. 赵老
  {
    id: 'zhao-lao',
    name: '赵老',
    title: '昊天斗罗',
    level: 91,
    position: 'elder',
    martialSoul: {
      name: '昊天锤',
      type: '器武魂·强攻系',
      element: '金属性',
      baseStats: { attack: 92, defense: 55, speed: 55, spirit: 55, hp: 90 },
    },
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'black'],
    ringYears: [],
    beastType: 'qiang',
    soulBones: [
    ],
    soulSkills: [
      '锤击大地',
      '泰坦之锤',
      '昊天之威',
      '大须弥锤',
      '千钧壁垒',
      '锤震八方',
      '武魂真身·昊天锤',
      '破煞七杀',
      '昊天锤法',
    ],
    rewards: { exp: 80000, coins: 80000 },
  },
  // 10. 普通宿老1
  {
    id: 'elder-1',
    name: '林宿老',
    title: '青火斗罗',
    level: 90,
    position: 'common',
    martialSoul: {
      name: '青火豹',
      type: '兽武魂·敏攻系',
      element: '火属性',
      baseStats: { attack: 75, defense: 50, speed: 85, spirit: 60, hp: 65 },
    },
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'black'],
    ringYears: [],
    beastType: 'min',
    soulBones: [
    ],
    soulSkills: [
      '青火爪',
      '火焰冲刺',
      '豹影分身',
      '烈焰连击',
      '爆炎突袭',
      '火焰护体',
      '武魂真身·青火豹',
      '青火爆裂',
      '豹王怒焰',
    ],
    rewards: { exp: 60000, coins: 60000 },
  },
  // 11. 普通宿老2
  {
    id: 'elder-2',
    name: '周宿老',
    title: '玄冰斗罗',
    level: 90,
    position: 'common',
    martialSoul: {
      name: '玄冰龟',
      type: '兽武魂·防御系',
      element: '冰属性',
      baseStats: { attack: 60, defense: 85, speed: 45, spirit: 65, hp: 100 },
    },
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'black'],
    ringYears: [],
    beastType: 'fang',
    soulBones: [
    ],
    soulSkills: [
      '玄冰盾',
      '冰甲护体',
      '冻气蔓延',
      '冰封千里',
      '寒冰领域',
      '龟息守御',
      '武魂真身·玄冰龟',
      '绝对零度',
      '冰封天地',
    ],
    rewards: { exp: 60000, coins: 60000 },
  },
  // 12. 普通宿老3
  {
    id: 'elder-3',
    name: '吴宿老',
    title: '疾风斗罗',
    level: 91,
    position: 'common',
    martialSoul: {
      name: '疾风雕',
      type: '兽武魂·敏攻系',
      element: '风属性',
      baseStats: { attack: 72, defense: 45, speed: 95, spirit: 65, hp: 60 },
    },
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'black'],
    ringYears: [],
    beastType: 'min',
    soulBones: [
    ],
    soulSkills: [
      '疾风斩',
      '风之翼',
      '疾风连斩',
      '旋风刃',
      '极速俯冲',
      '风之领域',
      '武魂真身·疾风雕',
      '暴风骤雨',
      '风之极',
    ],
    rewards: { exp: 70000, coins: 70000 },
  },
];

// 填充 ringYears（空则按颜色推断）
for (const m of SEA_GOD_MEMBERS) {
  if (m.ringYears.length === 0) {
    m.ringYears = buildRingYears(m.ringColors);
  }
}

/** 位置称号映射（按位置索引 → 称号） */
export const SEA_GOD_POSITION_TITLE: Record<string, string> = {
  'pavilion-master': '海神阁阁主',
  'vice-master': '海神阁副阁主',
  'elder': '海神阁长老',
  'common': '海神阁宿老',
};

// ============================ 属性计算 ============================

/**
 * 使用 calcAttributes 计算海神阁成员属性（复用玩家属性计算逻辑，确保一致）
 */
export function calcSeaGodMemberStats(member: ISeaGodMember) {
  // 构造伪 IPlayer 对象，只填充 calcAttributes 用到的字段
  const direction = (() => {
    if (member.martialSoul.type.includes('强攻')) return '强攻系';
    if (member.martialSoul.type.includes('敏攻')) return '敏攻系';
    if (member.martialSoul.type.includes('控制')) return '控制系';
    if (member.martialSoul.type.includes('辅助')) return '辅助系';
    if (member.martialSoul.type.includes('防御')) return '防御系';
    return '强攻系';
  })();

  // 构造魂环列表
  const soulRings: ISoulRing[] = member.ringColors.map((color, i) => {
    const years = member.ringYears[i];
    const stats = calcRingStatsByYears(years, member.beastType);
    const qualityLabel = ['', '十年', '百年', '千年', '万年', '十万年', '神级'][
      ['white', 'yellow', 'purple', 'black', 'red', 'gold'].indexOf(color) + 1
    ] || '万年';
    return {
      id: `ring-${member.id}-${i}`,
      color,
      qualityLabel,
      soulBeastName: member.martialSoul.name,
      skillName: member.soulSkills[i] || `第${i + 1}魂技`,
      skillDesc: '',
      years,
      beastType: member.beastType,
      skillType: i === 6 ? 'buff' : 'attack', // 第7魂技武魂真身 = buff
      attackBonus: stats.attackBonus,
      defenseBonus: stats.defenseBonus,
      speedBonus: stats.speedBonus,
      spiritBonus: stats.spiritBonus,
      hpBonus: stats.hpBonus,
      critRateBonus: stats.critRateBonus,
      critDmgBonus: stats.critDmgBonus,
      soulPowerBonus: stats.soulPowerBonus,
      skillDamage: stats.skillDamage,
      skillDamagePct: 0, // 海神阁成员不参与战斗伤害计算，留0即可
    };
  });

  // 构造魂骨
  const soulBones: Record<string, IItem | null> = {
    head: null, torso: null, leftArm: null, rightArm: null,
    leftLeg: null, rightLeg: null, external: null,
  };
  for (const b of member.soulBones) {
    soulBones[b.slot] = {
      id: `bone-${member.id}-${b.slot}`,
      name: b.name,
      type: 'soulBone',
      quality: b.quality,
      slot: b.slot,
      attributes: b.attributes,
      materialTier: 0,
      soulBoneYearsLabel: b.years >= 100000 ? '十万年' : b.years >= 10000 ? '万年' : b.years >= 1000 ? '千年' : '百年',
    } as any;
  }

  // 领域
  const domain: IDomain | null = member.domain
    ? {
        id: `domain-${member.id}`,
        name: member.domain.name,
        description: '',
        cultivationAttr: member.domain.cultivationAttr as any,
        baseBonuses: member.domain.baseBonuses as any,
      }
    : null;

  const pseudoPlayer = {
    martialSoul: {
      ...member.martialSoul,
      soulSkills: member.soulSkills,
      cultivationAttr: member.beastType === 'qiang' ? 'strength' :
        member.beastType === 'min' ? 'agility' :
        member.beastType === 'kong' ? 'spirit' :
        member.beastType === 'fu' ? 'support' : 'defense',
    },
    soulPower: 8, // 宿老按先天8级魂力计算
    level: member.level,
    direction,
    soulRings,
    soulBones,
    equipment: { melee: null, support: null, defense: null, ranged: null },
    domain,
    soulCoreType: 'none' as const,
    soulCoreStage: 0,
    yinCoreStartTime: null,
    yangCoreStartTime: null,
    isTwinSoul: false,
    secondSoul: null,
    secondSoulRings: [],
    demonDefeated: { lvl90: 'none' as const, lvl99: false },
  };

  const attrs = calcAttributes(pseudoPlayer as any);
  return {
    attack: Math.round(attrs.attack),
    defense: Math.round(attrs.defense),
    speed: Math.round(attrs.speed),
    spirit: Math.round(attrs.spirit),
    hp: Math.round(attrs.hp * 0.7), // 海神阁成员血量降低30%
    critRate: attrs.critRate,
    critDmg: attrs.critDmg,
  };
}
