// EXPORTS: GOD_REALM_BOSSES, IGodRealmBoss, GodRealmCategory, GOD_REALM_CATEGORIES

import type { IItem } from './items';

export type GodRealmCategory = 'supreme' | 'god-king' | 'god-level';

export interface IGodRealmBoss {
  id: string;
  category: GodRealmCategory;
  name: string;
  title: string;           // 称号（如"毁灭之神"）
  qualityColor: string;     // 品质色（hex）
  qualityLabel: string;     // 品质标签文字
  hp: number;              // 血量
  attack: number;          // 攻击
  defense: number;         // 防御
  speed: number;           // 速度
  spirit: number;          // 精神
  skillName: string;       // 神技名
  skillDesc: string;       // 神技描述
  /** 特殊神技效果：ban-skill=禁止玩家魂技N回合（配合banSkillTurns/banSkillCooldown） */
  specialEffect?: {
    type: 'ban-skill';
    banSkillTurns: number;  // 禁用回合数
    banSkillCooldown: number; // 技能冷却回合
  };
  rewardItems: IItem[];    // 击败后获得的物品
  rewardDesc: string;      // 奖励文字描述
  background: string;      // boss 背景/形象描述
}

export interface IGodRealmCategory {
  key: GodRealmCategory;
  label: string;
  desc: string;
  icon: string;            // emoji icon
  color: string;           // 主题色 hex
}

export const GOD_REALM_CATEGORIES: IGodRealmCategory[] = [
  {
    key: 'supreme',
    label: '至高神域',
    desc: '凌驾众神之上的至高存在，世间最强者',
    icon: '👑',
    color: '#fcd34d',
  },
  {
    key: 'god-king',
    label: '神王领域',
    desc: '五大神王镇守的神界中枢，掌管一方法则',
    icon: '⚜️',
    color: '#c084fc',
  },
  {
    key: 'god-level',
    label: '神级领域',
    desc: '唐三与史莱克七怪的神级传承之地',
    icon: '🌟',
    color: '#60a5fa',
  },
];

// 神界中枢碎片物品模板（击败每位神王掉落1片）
function makeShard(id: string, name: string, desc: string): IItem {
  return {
    id,
    name,
    type: 'special',
    quality: 'legendary',
    qualityColor: '#c084fc',
    iconChar: '碎',
    description: desc,
    sellPrice: 0,
    attributes: { allAttr: 0 },
  };
}

// 神界中枢完整物品（5碎片合成，不可出售，被动+1000%全属性）
export const DIVINE_CORE_ITEM: IItem = {
  id: 'divine-core',
  name: '神界中枢',
  type: 'special',
  quality: 'legendary',
  qualityColor: '#fcd34d',
  iconChar: '枢',
  description: '由五块神级中枢碎片融合而成的神界核心，蕴含完整神王之力。\n被动效果：全属性增加 1000%。',
  sellPrice: 0,
  attributes: {
    allAttr: 1000,
  },
};

// 作者的第一次（击败白山茶奖励，特殊物品，可出售，+100%全属性）
export const AUTHOR_FIRST_ITEM: IItem = {
  id: 'author-first',
  name: "作者的第一次",
  type: 'special',
  quality: 'legendary',
  qualityColor: '#fcd34d',
  iconChar: '作',
  description: '我喜欢女的，男的可以点击出售了。被动效果：全属性增加 100%。',
  sellPrice: 9999999,
  attributes: {
    allAttr: 100,
  },
};

// 神级领域击败角色后收入背包的纪念物品（特殊物品，不可出售、不可赠送、不可制作魂导器）
function makeGodSouvenir(id: string, name: string, title: string, qualityColor: string): IItem {
  return {
    id,
    name: `${name}·神之印记`,
    type: 'special',
    quality: 'legendary',
    qualityColor,
    iconChar: name[0] ?? '神',
    description: `${title}${name}留下的神之印记，记录着一段不朽的传说。\n被动效果：全属性 +100%（多个神之印记可叠加，最多7个叠加至700%）。\n【特殊物品】不可出售、不可赠送、不可用于制作魂导器`,
    sellPrice: 0,
    attributes: { allAttr: 100 },
  };
}

// === 至高神域 ===
const BOSS_BAISHANCHA: IGodRealmBoss = {
  id: 'boss-baishancha',
  category: 'supreme',
  name: '白山茶',
  title: '至高神',
  qualityColor: '#fcd34d',
  qualityLabel: '至高神级',
  hp: 4000e12, // 4000兆
  attack: 900e8, // 900亿
  defense: 0, // 真实伤害，防御为0
  speed: 30e6,
  spirit: 100e8,
  skillName: '禁',
  skillDesc: '以至高之力封禁对手魂技，两回合内无法使用任何魂技',
  specialEffect: {
    type: 'ban-skill',
    banSkillTurns: 2,
    banSkillCooldown: 5,
  },
  rewardItems: [AUTHOR_FIRST_ITEM],
  rewardDesc: '作者的第一次（全属性 +100%，可出售）',
  background: '传说中的至高神，凌驾于所有神王之上的终极存在。',
};

// === 神王领域：五大神王 ===
const BOSS_DESTRUCTION: IGodRealmBoss = {
  id: 'boss-destruction',
  category: 'god-king',
  name: '毁灭之神',
  title: '五大神王',
  qualityColor: '#a855f7',
  qualityLabel: '神王级',
  hp: 5000e12, // 5000兆
  attack: 500e8, // 500亿
  defense: 30e8,
  speed: 5e7,
  spirit: 50e8,
  skillName: '寂灭神雷',
  skillDesc: '毁灭之源爆发，寂灭一切生机',
  rewardItems: [makeShard('shard-destruction', '毁灭中枢碎片', '五大神王·毁灭之神的中枢碎片，蕴含毁灭法则。集齐五块可合成完整神界中枢。')],
  rewardDesc: '神级中枢碎片（毁灭）×1',
  background: '五大神王之一，执掌毁灭法则，性格刚愎，手段凌厉。',
};

const BOSS_LIFE: IGodRealmBoss = {
  id: 'boss-life',
  category: 'god-king',
  name: '生命之神',
  title: '五大神王',
  qualityColor: '#34d399',
  qualityLabel: '神王级',
  hp: 5000e12, // 5000兆
  attack: 500e8, // 500亿
  defense: 30e8,
  speed: 3e7,
  spirit: 50e8,
  skillName: '生命源泉',
  skillDesc: '生命之泉涌动，恢复大量气血',
  rewardItems: [makeShard('shard-life', '生命中枢碎片', '五大神王·生命之神的中枢碎片，蕴含生命法则。集齐五块可合成完整神界中枢。')],
  rewardDesc: '神级中枢碎片（生命）×1',
  background: '五大神王之一，执掌生命法则，温柔而坚韧，与毁灭之神相伴相生。',
};

const BOSS_EVIL: IGodRealmBoss = {
  id: 'boss-evil',
  category: 'god-king',
  name: '邪恶之神',
  title: '五大神王',
  qualityColor: '#6366f1',
  qualityLabel: '神王级',
  hp: 5000e12, // 5000兆
  attack: 500e8, // 500亿
  defense: 30e8,
  speed: 6e7,
  spirit: 50e8,
  skillName: '邪恶审判',
  skillDesc: '邪恶意念降临，审判世间一切',
  rewardItems: [makeShard('shard-evil', '邪恶中枢碎片', '五大神王·邪恶之神的中枢碎片，蕴含邪恶法则。集齐五块可合成完整神界中枢。')],
  rewardDesc: '神级中枢碎片（邪恶）×1',
  background: '五大神王之一，执掌邪恶法则，与善良之神共同掌管神界刑罚。',
};

const BOSS_KIND: IGodRealmBoss = {
  id: 'boss-kind',
  category: 'god-king',
  name: '善良之神',
  title: '五大神王',
  qualityColor: '#fbbf24',
  qualityLabel: '神王级',
  hp: 5000e12, // 5000兆
  attack: 500e8, // 500亿
  defense: 30e8,
  speed: 5e7,
  spirit: 50e8,
  skillName: '圣光裁决',
  skillDesc: '善良之光普照，净化世间万恶',
  rewardItems: [makeShard('shard-kind', '善良中枢碎片', '五大神王·善良之神的中枢碎片，蕴含善良法则。集齐五块可合成完整神界中枢。')],
  rewardDesc: '神级中枢碎片（善良）×1',
  background: '五大神王之一，执掌善良法则，心怀苍生，与邪恶之神共掌神界秩序。',
};

const BOSS_ASURA: IGodRealmBoss = {
  id: 'boss-asura',
  category: 'god-king',
  name: '修罗之神',
  title: '五大神王',
  qualityColor: '#ef4444',
  qualityLabel: '神王级',
  hp: 5000e12, // 5000兆
  attack: 500e8, // 500亿
  defense: 30e8,
  speed: 8e7,
  spirit: 50e8,
  skillName: '修罗神斩',
  skillDesc: '修罗神剑出鞘，一击斩尽万物',
  rewardItems: [makeShard('shard-asura', '修罗中枢碎片', '五大神王·修罗之神的中枢碎片，蕴含修罗法则。集齐五块可合成完整神界中枢。')],
  rewardDesc: '神级中枢碎片（修罗）×1',
  background: '五大神王之首，执掌修罗法则，神界审判者与执法者，战力冠绝神界。',
};

// === 神级领域：唐三 + 史莱克六怪 ===
const BOSS_TANGSAN: IGodRealmBoss = {
  id: 'boss-tangsan',
  category: 'god-level',
  name: '唐三',
  title: '海神·修罗神',
  qualityColor: '#60a5fa',
  qualityLabel: '神级',
  hp: 3000e12, // 3000兆
  attack: 400e8, // 400亿
  defense: 20e8,
  speed: 6e7,
  spirit: 30e8,
  skillName: '双神共存',
  skillDesc: '海神与修罗神双神位同体，威能无可估量',
  rewardItems: [makeGodSouvenir('souvenir-tangsan', '唐三', '海神·修罗神', '#60a5fa')],
  rewardDesc: '唐三·神之印记（纪念收藏）',
  background: '从斗罗大陆走出的传奇，先后继承海神与修罗神双神位，神界执法者。',
};

const BOSS_XIAOWU: IGodRealmBoss = {
  id: 'boss-xiaowu',
  category: 'god-level',
  name: '小舞',
  title: '柔骨斗罗',
  qualityColor: '#f472b6',
  qualityLabel: '神级',
  hp: 3000e12, // 3000兆
  attack: 400e8, // 400亿
  defense: 8e7,
  speed: 10e7,
  spirit: 1e8,
  skillName: '虚无爆杀八段摔',
  skillDesc: '柔骨魅兔的终极杀招，狂暴八连摔',
  rewardItems: [makeGodSouvenir('souvenir-xiaowu', '小舞', '柔骨斗罗', '#f472b6')],
  rewardDesc: '小舞·神之印记（纪念收藏）',
  background: '十万年柔骨兔化形，唐三挚爱，史莱克七怪之一。',
};

const BOSS_NINGRONG: IGodRealmBoss = {
  id: 'boss-ningrong',
  category: 'god-level',
  name: '宁荣荣',
  title: '九彩斗罗',
  qualityColor: '#a78bfa',
  qualityLabel: '神级',
  hp: 3000e12, // 3000兆
  attack: 400e8, // 400亿
  defense: 8e7,
  speed: 6e7,
  spirit: 1e8,
  skillName: '九宝神光',
  skillDesc: '九宝琉璃塔增幅，全属性大幅提升',
  rewardItems: [makeGodSouvenir('souvenir-ningrong', '宁荣荣', '九彩斗罗', '#a78bfa')],
  rewardDesc: '宁荣荣·神之印记（纪念收藏）',
  background: '九宝琉璃塔宗主之女，史莱克七怪之一，天下第一辅助系魂师。',
};

const BOSS_ZHUZHU: IGodRealmBoss = {
  id: 'boss-zhuzhu',
  category: 'god-level',
  name: '朱竹清',
  title: '幽冥斗罗',
  qualityColor: '#64748b',
  qualityLabel: '神级',
  hp: 3000e12, // 3000兆
  attack: 400e8, // 400亿
  defense: 6e7,
  speed: 1e8,
  spirit: 10e7,
  skillName: '幽冥影分身',
  skillDesc: '幽冥灵猫分身突袭，快如鬼魅',
  rewardItems: [makeGodSouvenir('souvenir-zhuzhu', '朱竹清', '幽冥斗罗', '#64748b')],
  rewardDesc: '朱竹清·神之印记（纪念收藏）',
  background: '幽冥灵猫武魂，史莱克七怪之一，速度冠绝七怪。',
};

const BOSS_OSCAR: IGodRealmBoss = {
  id: 'boss-oscar',
  category: 'god-level',
  name: '奥斯卡',
  title: '食神斗罗',
  qualityColor: '#fbbf24',
  qualityLabel: '神级',
  hp: 3000e12, // 3000兆
  attack: 400e8, // 400亿
  defense: 8e7,
  speed: 6e7,
  spirit: 1e8,
  skillName: '食神香肠',
  skillDesc: '食神传承香肠，恢复与增益兼备',
  rewardItems: [makeGodSouvenir('souvenir-oscar', '奥斯卡', '食神斗罗', '#fbbf24')],
  rewardDesc: '奥斯卡·神之印记（纪念收藏）',
  background: '天下第一位食物系封号斗罗，史莱克七怪之一，继承食神之位。',
};

const BOSS_MAHONGJUN: IGodRealmBoss = {
  id: 'boss-mahongjun',
  category: 'god-level',
  name: '马红俊',
  title: '凤凰斗罗',
  qualityColor: '#f97316',
  qualityLabel: '神级',
  hp: 3000e12, // 3000兆
  attack: 400e8, // 400亿
  defense: 8e7,
  speed: 8e7,
  spirit: 1e8,
  skillName: '凤凰涅槃',
  skillDesc: '十首火凤凰涅槃重生，烈焰焚天',
  rewardItems: [makeGodSouvenir('souvenir-mahongjun', '马红俊', '凤凰斗罗', '#f97316')],
  rewardDesc: '马红俊·神之印记（纪念收藏）',
  background: '邪火凤凰武魂，史莱克七怪之一，后进化为十首火凤凰。',
};

const BOSS_DAIMOBAI: IGodRealmBoss = {
  id: 'boss-daimobai',
  category: 'god-level',
  name: '戴沫白',
  title: '白虎斗罗',
  qualityColor: '#eab308',
  qualityLabel: '神级',
  hp: 3000e12, // 3000兆
  attack: 400e8, // 400亿
  defense: 10e7,
  speed: 8e7,
  spirit: 10e7,
  skillName: '白虎破灭杀',
  skillDesc: '邪眸白虎全力一击，破灭万物',
  rewardItems: [makeGodSouvenir('souvenir-daimobai', '戴沫白', '白虎斗罗', '#eab308')],
  rewardDesc: '戴沫白·神之印记（纪念收藏）',
  background: '邪眸白虎武魂，史莱克七怪老大，星罗帝国皇子。',
};

export const GOD_REALM_BOSSES: IGodRealmBoss[] = [
  // 至高神域
  BOSS_BAISHANCHA,
  // 神王领域
  BOSS_DESTRUCTION,
  BOSS_LIFE,
  BOSS_EVIL,
  BOSS_KIND,
  BOSS_ASURA,
  // 神级领域
  BOSS_TANGSAN,
  BOSS_XIAOWU,
  BOSS_NINGRONG,
  BOSS_ZHUZHU,
  BOSS_OSCAR,
  BOSS_MAHONGJUN,
  BOSS_DAIMOBAI,
];

/** 获取指定分类的boss列表 */
export function getBossesByCategory(cat: GodRealmCategory): IGodRealmBoss[] {
  return GOD_REALM_BOSSES.filter((b) => b.category === cat);
}

/** 检查是否所有5块碎片都已收集（前缀匹配，兼容 addItem 加的时间戳后缀） */
export function hasAllGodKingShards(inventory: IItem[]): boolean {
  const shardIds = ['shard-destruction', 'shard-life', 'shard-evil', 'shard-kind', 'shard-asura'];
  return shardIds.every((id) => inventory.some((i) => i.id.startsWith(id)));
}
