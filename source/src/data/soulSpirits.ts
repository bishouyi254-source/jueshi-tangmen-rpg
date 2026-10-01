// EXPORTS: ISoulSpirit, SOUL_SPIRIT_POOL, SOUL_SPIRIT_REALMS, calcSpiritUpgradeCost, calcSpiritBreakthroughCost, getSpiritRealmName, getSpiritStats, SPIRIT_SLOT_UNLOCK_LEVELS, SPIRIT_ELEMENT_COLORS

export interface ISoulSpirit {
  id: string;
  name: string; // 魂灵名，带"魂灵·"前缀
  beastName: string; // 原始魂兽名
  attribute: string; // 属性：金/木/水/火/土/冰/雷/风/光明/黑暗/精神/混沌
  description: string; // 外貌介绍
  feature: string; // 魂兽特点
  iconChar: string; // 图标字
  // 基础属性（按1级初阶1重计算）
  baseAttack: number;
  baseDefense: number;
  baseHp: number;
  baseSpeed: number;
  // 属性成长（每重提升百分比）
  growthPerTier: number;
}

/** 魂灵境界定义 */
export interface ISpiritRealm {
  major: string; // 大境界名
  minor: number; // 当前大境界内的小重数 1~9
}

/** 大境界列表（从低到高） */
export const SPIRIT_MAJOR_REALMS = [
  '初阶',
  '中阶',
  '高阶',
  '地阶',
  '天阶',
  '准圣',
  '圣阶',
  '准帝',
  '帝阶',
  '神级',
];

/** 大境界突破所需金币（索引i = 突破到第i个大境界，即从i→i+1） */
export const SPIRIT_BREAKTHROUGH_COSTS = [
      2000,     // 初阶→中阶：2000
     10000,     // 中阶→高阶：1万
     25000,     // 高阶→地阶：2.5万
     60000,     // 地阶→天阶：6万
    150000,     // 天阶→准圣：15万
    300000,     // 准圣→圣阶：30万
    600000,     // 圣阶→准帝：60万
   1200000,     // 准帝→帝阶：120万
   3000000,     // 帝阶→神级：300万（突破封顶300万，远低于升级封顶3000万）
];

/** 获取境界显示名 */
export function getSpiritRealmName(majorIndex: number, minor: number): string {
  const major = SPIRIT_MAJOR_REALMS[Math.min(Math.max(0, majorIndex), SPIRIT_MAJOR_REALMS.length - 1)];
  return `${major}·第${minor}重`;
}

/** 计算小境界升级消耗金币（每升级1重）
 *  基础100金，每重递增15%，最高不超过3000万
 *  总重数 = majorIndex * 9 + minor（已经历的重数）
 */
export function calcSpiritUpgradeCost(majorIndex: number, minor: number): number {
  if (majorIndex >= SPIRIT_MAJOR_REALMS.length - 1 && minor >= 9) return Infinity;
  const totalTiers = majorIndex * 9 + minor; // 已经历的重数
  const base = 100; // v10.0 调整基数，每重递增从30%降至15%，整体更平缓
  let cost = base;
  for (let i = 0; i < totalTiers; i++) {
    cost = Math.round(cost * 1.15);
    if (cost > 30000000) { cost = 30000000; break; } // 最高封顶3000万
  }
  return Math.min(cost, 30000000);
}

/** 计算大境界突破所需金币 */
export function calcSpiritBreakthroughCost(majorIndex: number): number {
  if (majorIndex >= SPIRIT_BREAKTHROUGH_COSTS.length) return Infinity;
  return SPIRIT_BREAKTHROUGH_COSTS[majorIndex];
}

/** 根据境界计算魂灵实际战斗属性（v19.0 血厚攻低，辅助承伤定位） */
export function getSpiritStats(spirit: ISoulSpirit, majorIndex: number, minor: number) {
  const totalTiers = majorIndex * 9 + (minor - 1);
  const mult = Math.pow(1 + spirit.growthPerTier, totalTiers);
  // v19.0 魂灵承伤定位：攻击再砍半，防御×1.5，血量×2.5，速度略降
  const atkReduce = 0.028;  // 攻击：整体再降 50%
  const defMul = 1.5;       // 防御：整体 ×1.5
  const hpMul = 2.5;        // 血量：整体 ×2.5
  const spdReduce = 0.8;    // 速度：×0.8（略慢，坦克定位）
  return {
    attack: Math.max(1, Math.round(spirit.baseAttack * mult * atkReduce)),
    defense: Math.max(1, Math.round(spirit.baseDefense * mult * defMul * 0.056)),
    hp: Math.max(10, Math.round(spirit.baseHp * mult * hpMul * 0.056)),
    speed: Math.max(1, Math.round(spirit.baseSpeed * mult * spdReduce * 0.056)),
  };
}

/** 12种属性的魂灵池（每种属性8种魂兽→魂灵，强弱递增） */
export const SOUL_SPIRIT_POOL: ISoulSpirit[] = [
  // ========== 金属性 (8种) ==========
  { id: 'spirit-jin-jing', name: '魂灵·金晶兽', beastName: '金晶兽', attribute: '金', description: '通体金黄，鳞甲如晶，行走时金属嗡鸣', feature: '金属性魂力凝实，破甲能力极强', iconChar: '金', baseAttack: 45, baseDefense: 35, baseHp: 200, baseSpeed: 28, growthPerTier: 0.15 },
  { id: 'spirit-jin-tiejia', name: '魂灵·铁甲犀', beastName: '铁甲犀', attribute: '金', description: '身披玄铁甲片，犀角如锋刃', feature: '防御力出众，冲撞可碎金断石', iconChar: '铁', baseAttack: 38, baseDefense: 48, baseHp: 280, baseSpeed: 22, growthPerTier: 0.15 },
  { id: 'spirit-jin-yue', name: '魂灵·月金狼', beastName: '月金狼', attribute: '金', description: '银白毛色如月光，爪牙锋利无匹', feature: '速度极快，利爪可破一切防御', iconChar: '月', baseAttack: 52, baseDefense: 28, baseHp: 180, baseSpeed: 42, growthPerTier: 0.16 },
  { id: 'spirit-jin-jian', name: '魂灵·剑齿虎', beastName: '剑齿虎', attribute: '金', description: '两根剑齿如出鞘利剑，浑身金纹', feature: '攻击迅猛，剑齿可贯穿魂导器', iconChar: '剑', baseAttack: 58, baseDefense: 32, baseHp: 220, baseSpeed: 38, growthPerTier: 0.16 },
  { id: 'spirit-jin-tong', name: '魂灵·铜甲巨象', beastName: '铜甲巨象', attribute: '金', description: '全身覆盖铜色甲皮，象腿如铜柱', feature: '力量型魂兽，践踏可震碎大地', iconChar: '铜', baseAttack: 50, baseDefense: 55, baseHp: 400, baseSpeed: 18, growthPerTier: 0.17 },
  { id: 'spirit-jin-gang', name: '魂灵·金刚狮', beastName: '金刚狮', attribute: '金', description: '金毛如钢针，狮吼震彻山谷', feature: '刚猛无比，吼声可破魂师心神', iconChar: '刚', baseAttack: 65, baseDefense: 40, baseHp: 300, baseSpeed: 32, growthPerTier: 0.18 },
  { id: 'spirit-jin-tian', name: '魂灵·天金麒麟', beastName: '天金麒麟', attribute: '金', description: '通体天金之色，麟甲生辉，祥瑞之兆', feature: '金属性至尊魂兽，攻防一体', iconChar: '麒', baseAttack: 72, baseDefense: 52, baseHp: 380, baseSpeed: 36, growthPerTier: 0.20 },
  { id: 'spirit-jin-shen', name: '魂灵·金神饕餮', beastName: '金神饕餮', attribute: '金', description: '金眸饕餮，可吞噬万物，体覆神金鳞', feature: '神级金系魂灵，吞噬之力可化万物为金', iconChar: '饕', baseAttack: 85, baseDefense: 60, baseHp: 450, baseSpeed: 30, growthPerTier: 0.22 },

  // ========== 木属性 (8种) ==========
  { id: 'spirit-cui-mu', name: '魂灵·翠木灵', beastName: '翠木灵鹿', attribute: '木', description: '通体翠绿，鹿角生嫩叶，身形灵秀', feature: '木属性生生不息，自愈能力强', iconChar: '木', baseAttack: 30, baseDefense: 38, baseHp: 260, baseSpeed: 30, growthPerTier: 0.15 },
  { id: 'spirit-mu-teng', name: '魂灵·藤蛇', beastName: '青藤蛇', attribute: '木', description: '身如青藤，蜿蜒于林间，鳞片如叶', feature: '缠绕绞杀，毒液可腐蚀魂力', iconChar: '藤', baseAttack: 35, baseDefense: 28, baseHp: 180, baseSpeed: 35, growthPerTier: 0.15 },
  { id: 'spirit-mu-hua', name: '魂灵·花灵蝶', beastName: '花灵蝶', attribute: '木', description: '翅膀如花瓣绽放，翩翩起舞', feature: '鳞粉可迷魂，也可治疗伤势', iconChar: '花', baseAttack: 28, baseDefense: 25, baseHp: 160, baseSpeed: 40, growthPerTier: 0.16 },
  { id: 'spirit-mu-song', name: '魂灵·苍松熊', beastName: '苍松熊', attribute: '木', description: '毛如苍松针，爪生青绿藤蔓', feature: '力量型，藤蔓可束缚敌人', iconChar: '松', baseAttack: 48, baseDefense: 42, baseHp: 320, baseSpeed: 22, growthPerTier: 0.17 },
  { id: 'spirit-mu-zhu', name: '魂灵·竹影螳螂', beastName: '竹影螳螂', attribute: '木', description: '翠如竹影，双刀锋利如竹叶', feature: '敏捷型，双刀连击速度极快', iconChar: '竹', baseAttack: 52, baseDefense: 28, baseHp: 180, baseSpeed: 45, growthPerTier: 0.18 },
  { id: 'spirit-mu-yang', name: '魂灵·碧杨雀', beastName: '碧杨雀', attribute: '木', description: '碧绿雀鸟，羽翼如杨叶', feature: '飞行灵巧，木系魂力可治愈友军', iconChar: '杨', baseAttack: 32, baseDefense: 26, baseHp: 150, baseSpeed: 48, growthPerTier: 0.17 },
  { id: 'spirit-mu-jian', name: '魂灵·建木神树', beastName: '建木神树', attribute: '木', description: '上古神木，通天神木，枝叶蔽日', feature: '木属性至尊，生命力无穷无尽', iconChar: '建', baseAttack: 55, baseDefense: 60, baseHp: 500, baseSpeed: 15, growthPerTier: 0.20 },
  { id: 'spirit-mu-shen', name: '魂灵·生命之神', beastName: '生命古树', attribute: '木', description: '传说中的生命之树，一木一世界', feature: '神级木系魂灵，可起死回生', iconChar: '生', baseAttack: 60, baseDefense: 65, baseHp: 600, baseSpeed: 20, growthPerTier: 0.22 },

  // ========== 水属性 (8种) ==========
  { id: 'spirit-shui-han', name: '魂灵·寒水鳄', beastName: '寒水鳄', attribute: '水', description: '栖息于深潭，鳞甲泛冷光', feature: '水中霸主，撕咬力惊人', iconChar: '鳄', baseAttack: 42, baseDefense: 40, baseHp: 250, baseSpeed: 26, growthPerTier: 0.15 },
  { id: 'spirit-shui-shui', name: '魂灵·水灵蛇', beastName: '水灵蛇', attribute: '水', description: '通体碧蓝，如流动的水', feature: '身形如水流，难被击中', iconChar: '水', baseAttack: 32, baseDefense: 28, baseHp: 170, baseSpeed: 38, growthPerTier: 0.15 },
  { id: 'spirit-shui-jing', name: '魂灵·水晶鱼', beastName: '水晶锦鲤', attribute: '水', description: '鳞片如水晶，游曳时波光粼粼', feature: '祥瑞之兆，可增强魂师运势', iconChar: '晶', baseAttack: 25, baseDefense: 30, baseHp: 140, baseSpeed: 36, growthPerTier: 0.16 },
  { id: 'spirit-shui-cang', name: '魂灵·沧浪鲨', beastName: '沧浪鲨', attribute: '水', description: '深海霸主，牙齿如锋刃', feature: '攻击凶猛，撕咬可碎骨', iconChar: '鲨', baseAttack: 55, baseDefense: 38, baseHp: 280, baseSpeed: 35, growthPerTier: 0.17 },
  { id: 'spirit-shui-yuan', name: '魂灵·玄武', beastName: '玄水龟', attribute: '水', description: '背甲如山，头尾藏于壳中', feature: '防御力极强，可反弹伤害', iconChar: '玄', baseAttack: 35, baseDefense: 60, baseHp: 380, baseSpeed: 18, growthPerTier: 0.18 },
  { id: 'spirit-shui-jiao', name: '魂灵·蓝蛟龙', beastName: '蓝蛟龙', attribute: '水', description: '蓝鳞蛟龙，腾跃于巨浪之间', feature: '可呼风唤雨，水龙撕天裂地', iconChar: '蛟', baseAttack: 62, baseDefense: 45, baseHp: 350, baseSpeed: 38, growthPerTier: 0.20 },
  { id: 'spirit-shui-long', name: '魂灵·苍龙', beastName: '沧海苍龙', attribute: '水', description: '苍蓝色神龙，掌管水域', feature: '水属性至尊，翻江倒海之力', iconChar: '苍', baseAttack: 70, baseDefense: 50, baseHp: 420, baseSpeed: 40, growthPerTier: 0.22 },
  { id: 'spirit-shui-shen', name: '魂灵·水神共工', beastName: '水神鲸', attribute: '水', description: '如远古海神降临，身周万顷波涛', feature: '神级水系魂灵，掌控天下之水', iconChar: '水', baseAttack: 78, baseDefense: 55, baseHp: 500, baseSpeed: 38, growthPerTier: 0.24 },

  // ========== 火属性 (8种) ==========
  { id: 'spirit-huo-yan', name: '魂灵·烈焰狼', beastName: '烈焰狼', attribute: '火', description: '毛色赤红，奔跑时身后拖曳火焰', feature: '速度型，火焰灼烧持续伤害', iconChar: '焰', baseAttack: 48, baseDefense: 28, baseHp: 190, baseSpeed: 38, growthPerTier: 0.15 },
  { id: 'spirit-huo-shi', name: '魂灵·火狮', beastName: '赤焰狮', attribute: '火', description: '鬃毛如燃烧的火焰，吼声震天', feature: '刚猛霸气，狮吼可燃尽一切', iconChar: '狮', baseAttack: 55, baseDefense: 35, baseHp: 260, baseSpeed: 30, growthPerTier: 0.16 },
  { id: 'spirit-huo-feng', name: '魂灵·火凤雀', beastName: '火凤雀', attribute: '火', description: '形似凤凰，羽翼流火', feature: '飞禽之王，浴火重生', iconChar: '雀', baseAttack: 50, baseDefense: 25, baseHp: 170, baseSpeed: 45, growthPerTier: 0.17 },
  { id: 'spirit-huo-niao', name: '魂灵·青鸾火凤', beastName: '青鸾火凤', attribute: '火', description: '青赤二色神鸟，周身烈焰环绕', feature: '可青火焚天，速度与力量兼备', iconChar: '鸾', baseAttack: 60, baseDefense: 32, baseHp: 240, baseSpeed: 48, growthPerTier: 0.18 },
  { id: 'spirit-huo-niu', name: '魂灵·赤火牛', beastName: '赤火蛮牛', attribute: '火', description: '通体赤红，双角如燃火之矛', feature: '力量型，冲撞时角尖焚天', iconChar: '牛', baseAttack: 58, baseDefense: 45, baseHp: 350, baseSpeed: 25, growthPerTier: 0.17 },
  { id: 'spirit-huo-long', name: '魂灵·赤焰龙', beastName: '赤焰火龙', attribute: '火', description: '鳞甲如熔岩，吐息可焚山煮海', feature: '龙炎焚天，火焰属性至尊之一', iconChar: '龙', baseAttack: 72, baseDefense: 45, baseHp: 380, baseSpeed: 38, growthPerTier: 0.20 },
  { id: 'spirit-huo-huang', name: '魂灵·金乌凤凰', beastName: '金乌凤凰', attribute: '火', description: '三足金乌与凤凰结合，太阳之精', feature: '太阳真火，可焚烧万物', iconChar: '乌', baseAttack: 80, baseDefense: 42, baseHp: 350, baseSpeed: 50, growthPerTier: 0.22 },
  { id: 'spirit-huo-shen', name: '魂灵·火神祝融', beastName: '火神朱雀', attribute: '火', description: '南方神兽，掌天下之火，羽翼遮蔽苍穹', feature: '神级火系魂灵，神火可焚尽苍穹', iconChar: '雀', baseAttack: 88, baseDefense: 48, baseHp: 420, baseSpeed: 48, growthPerTier: 0.24 },

  // ========== 土属性 (8种) ==========
  { id: 'spirit-tu-sha', name: '魂灵·沙蜥', beastName: '黄沙蜥', attribute: '土', description: '土黄色鳞片，穿梭于沙地之下', feature: '潜行伏击，尾击可碎石', iconChar: '沙', baseAttack: 38, baseDefense: 40, baseHp: 220, baseSpeed: 30, growthPerTier: 0.15 },
  { id: 'spirit-tu-ju', name: '魂灵·巨岩熊', beastName: '巨岩熊', attribute: '土', description: '身躯如岩，熊掌可开山裂石', feature: '力量防御兼备，厚土之力', iconChar: '岩', baseAttack: 50, baseDefense: 52, baseHp: 350, baseSpeed: 20, growthPerTier: 0.16 },
  { id: 'spirit-tu-she', name: '魂灵·土行蛇', beastName: '土行蛇', attribute: '土', description: '身形如梭，可在土中自由穿行', feature: '遁地突袭，防不胜防', iconChar: '土', baseAttack: 42, baseDefense: 35, baseHp: 200, baseSpeed: 35, growthPerTier: 0.16 },
  { id: 'spirit-tu-yuan', name: '魂灵·玄元猿', beastName: '玄元猿', attribute: '土', description: '通身土黄，长臂可裂地', feature: '灵巧有力，地裂拳震荡大地', iconChar: '玄', baseAttack: 55, baseDefense: 40, baseHp: 280, baseSpeed: 32, growthPerTier: 0.17 },
  { id: 'spirit-tu-xie', name: '魂灵·地蝎王', beastName: '地蝎王', attribute: '土', description: '深褐甲壳，尾钩含剧毒', feature: '毒刺可穿甲，剧毒蚀魂', iconChar: '蝎', baseAttack: 48, baseDefense: 42, baseHp: 240, baseSpeed: 28, growthPerTier: 0.18 },
  { id: 'spirit-tu-shan', name: '魂灵·山魈', beastName: '山岳山魈', attribute: '土', description: '如山岳般高大，双臂如石柱', feature: '山岳之力，一拳可崩山', iconChar: '山', baseAttack: 65, baseDefense: 58, baseHp: 450, baseSpeed: 18, growthPerTier: 0.19 },
  { id: 'spirit-tu-hou', name: '魂灵·后土灵兽', beastName: '后土麒麟', attribute: '土', description: '黄土之色，踏地而行，稳重如山', feature: '土属性至尊，厚土载物之力', iconChar: '后', baseAttack: 68, baseDefense: 62, baseHp: 480, baseSpeed: 25, growthPerTier: 0.21 },
  { id: 'spirit-tu-shen', name: '魂灵·土神句龙', beastName: '土神龙', attribute: '土', description: '大地之神的化身，蜿蜒于厚土之下', feature: '神级土系魂灵，掌控大地之力', iconChar: '句', baseAttack: 78, baseDefense: 70, baseHp: 550, baseSpeed: 28, growthPerTier: 0.23 },

  // ========== 冰属性 (8种) ==========
  { id: 'spirit-bing-xue', name: '魂灵·雪狐', beastName: '冰晶雪狐', attribute: '冰', description: '通体雪白如玉，眼眸冰蓝', feature: '速度型，冰凝冻气可减速敌人', iconChar: '狐', baseAttack: 40, baseDefense: 28, baseHp: 180, baseSpeed: 42, growthPerTier: 0.16 },
  { id: 'spirit-bing-bao', name: '魂灵·冰魄豹', beastName: '冰魄豹', attribute: '冰', description: '冰晶皮毛，奔行如寒冰闪电', feature: '极致速度，冰爪撕裂如刀', iconChar: '豹', baseAttack: 52, baseDefense: 30, baseHp: 200, baseSpeed: 50, growthPerTier: 0.17 },
  { id: 'spirit-bing-xiong', name: '魂灵·冰原熊', beastName: '冰原巨熊', attribute: '冰', description: '极地冰原霸主，浑身冰霜', feature: '力量型，冰拳可冻魂裂脉', iconChar: '熊', baseAttack: 55, baseDefense: 48, baseHp: 350, baseSpeed: 22, growthPerTier: 0.18 },
  { id: 'spirit-bing-she', name: '魂灵·冰碧蛇', beastName: '冰碧蛇', attribute: '冰', description: '碧绿与冰蓝交织，寒意彻骨', feature: '剧毒冰冻，被咬者瞬间冰封', iconChar: '碧', baseAttack: 48, baseDefense: 32, baseHp: 190, baseSpeed: 38, growthPerTier: 0.18 },
  { id: 'spirit-bing-niao', name: '魂灵·冰凰', beastName: '冰凰', attribute: '冰', description: '冰蓝色神鸟，羽翼寒冰凝结', feature: '冰凰涅槃，冰寒之气可封天', iconChar: '凰', baseAttack: 60, baseDefense: 38, baseHp: 260, baseSpeed: 48, growthPerTier: 0.20 },
  { id: 'spirit-bing-di', name: '魂灵·冰帝', beastName: '冰碧帝皇蝎', attribute: '冰', description: '碧绿通透的帝皇蝎，极北三大天王之首', feature: '冰属性至尊之一，帝寒可冰封万里', iconChar: '帝', baseAttack: 75, baseDefense: 50, baseHp: 380, baseSpeed: 40, growthPerTier: 0.22 },
  { id: 'spirit-bing-xue-di', name: '魂灵·雪帝', beastName: '冰天雪女', attribute: '冰', description: '极北冰原的雪之女王，倾国倾城', feature: '极北三大天王之首，雪舞天下', iconChar: '雪', baseAttack: 70, baseDefense: 45, baseHp: 350, baseSpeed: 45, growthPerTier: 0.23 },
  { id: 'spirit-bing-shen', name: '魂灵·冰神', beastName: '北冥冰神', attribute: '冰', description: '传说中的冰之神诋，一怒冰封万界', feature: '神级冰系魂灵，绝对零度之威', iconChar: '冰', baseAttack: 82, baseDefense: 58, baseHp: 450, baseSpeed: 42, growthPerTier: 0.25 },

  // ========== 雷属性 (8种) ==========
  { id: 'spirit-lei-zi', name: '魂灵·紫电貂', beastName: '紫电貂', attribute: '雷', description: '紫纹毛皮，游走时带静电火花', feature: '速度极快，雷电突袭瞬间制敌', iconChar: '貂', baseAttack: 42, baseDefense: 26, baseHp: 170, baseSpeed: 48, growthPerTier: 0.16 },
  { id: 'spirit-lei-lang', name: '魂灵·雷狼', beastName: '雷霆狼', attribute: '雷', description: '银紫毛色，雷弧环绕全身', feature: '雷牙电爪，速度与攻击兼备', iconChar: '雷', baseAttack: 50, baseDefense: 30, baseHp: 210, baseSpeed: 42, growthPerTier: 0.17 },
  { id: 'spirit-lei-ying', name: '魂灵·雷鹰', beastName: '紫雷鹰', attribute: '雷', description: '深紫羽翼，展翅时雷鸣电闪', feature: '飞行速度极快，俯冲雷电一击必杀', iconChar: '鹰', baseAttack: 55, baseDefense: 28, baseHp: 190, baseSpeed: 52, growthPerTier: 0.18 },
  { id: 'spirit-lei-ma', name: '魂灵·雷兽', beastName: '雷兽', attribute: '雷', description: '形如骏马，全身电芒缠绕', feature: '雷光电火，奔行速度天下无双', iconChar: '马', baseAttack: 58, baseDefense: 35, baseHp: 240, baseSpeed: 50, growthPerTier: 0.19 },
  { id: 'spirit-lei-hu', name: '魂灵·雷虎', beastName: '紫雷虎', attribute: '雷', description: '紫纹白虎，雷电从毛孔迸发', feature: '雷虎咆哮，天雷降世', iconChar: '虎', baseAttack: 65, baseDefense: 40, baseHp: 300, baseSpeed: 38, growthPerTier: 0.20 },
  { id: 'spirit-lei-jiao', name: '魂灵·雷蛟龙', beastName: '雷蛟龙', attribute: '雷', description: '紫鳞蛟龙，腾跃于雷云之中', feature: '可引天雷，龙威浩荡', iconChar: '雷', baseAttack: 72, baseDefense: 45, baseHp: 350, baseSpeed: 42, growthPerTier: 0.22 },
  { id: 'spirit-lei-shen', name: '魂灵·雷神', beastName: '紫霄神雷兽', attribute: '雷', description: '紫霄神雷化身，万雷之王', feature: '雷属性至尊，紫霄神雷诛灭一切', iconChar: '紫', baseAttack: 85, baseDefense: 50, baseHp: 400, baseSpeed: 48, growthPerTier: 0.24 },
  { id: 'spirit-lei-di', name: '魂灵·雷帝', beastName: '九天雷帝', attribute: '雷', description: '九天之上的雷霆主宰，执掌天罚', feature: '神级雷系魂灵，九天雷罚可灭神', iconChar: '罚', baseAttack: 90, baseDefense: 48, baseHp: 420, baseSpeed: 52, growthPerTier: 0.26 },

  // ========== 风属性 (8种) ==========
  { id: 'spirit-feng-feng', name: '魂灵·风灵兔', beastName: '风灵兔', attribute: '风', description: '通体雪白，奔跑时身后起风', feature: '速度型，身形灵巧难以捕捉', iconChar: '风', baseAttack: 28, baseDefense: 22, baseHp: 140, baseSpeed: 45, growthPerTier: 0.15 },
  { id: 'spirit-feng-yan', name: '魂灵·风燕', beastName: '疾风燕', attribute: '风', description: '羽翼如风，穿梭于气流之间', feature: '飞行速度极快，风刃切割', iconChar: '燕', baseAttack: 35, baseDefense: 24, baseHp: 150, baseSpeed: 52, growthPerTier: 0.16 },
  { id: 'spirit-feng-lang', name: '魂灵·风狼', beastName: '风啸狼', attribute: '风', description: '银灰毛色，嚎叫时狂风大作', feature: '风系魂力加持，速度倍增', iconChar: '狼', baseAttack: 45, baseDefense: 30, baseHp: 200, baseSpeed: 45, growthPerTier: 0.17 },
  { id: 'spirit-feng-diao', name: '魂灵·风刃雕', beastName: '风刃雕', attribute: '风', description: '褐色羽翼，翅尖如刀刃', feature: '风刃无坚不摧，俯冲速度极快', iconChar: '雕', baseAttack: 52, baseDefense: 28, baseHp: 190, baseSpeed: 55, growthPerTier: 0.18 },
  { id: 'spirit-feng-hu', name: '魂灵·疾风虎', beastName: '疾风虎', attribute: '风', description: '青纹虎身，奔行时身后留残影', feature: '风虎合击，速度与力量兼备', iconChar: '疾', baseAttack: 58, baseDefense: 35, baseHp: 250, baseSpeed: 48, growthPerTier: 0.19 },
  { id: 'spirit-feng-peng', name: '魂灵·风鹏', beastName: '青风大鹏', attribute: '风', description: '青羽大鹏，展翅遮天蔽日', feature: '一翼可起万里狂风', iconChar: '鹏', baseAttack: 65, baseDefense: 38, baseHp: 320, baseSpeed: 58, growthPerTier: 0.21 },
  { id: 'spirit-feng-shen', name: '魂灵·风神', beastName: '天风圣羽', attribute: '风', description: '天风之神的化身，羽翼划开天际', feature: '风属性至尊，天下之风任其驱使', iconChar: '天', baseAttack: 72, baseDefense: 42, baseHp: 360, baseSpeed: 62, growthPerTier: 0.23 },
  { id: 'spirit-feng-di', name: '魂灵·风帝', beastName: '虚空风帝', attribute: '风', description: '虚无缥缈的风之帝王，无处不在', feature: '神级风系魂灵，速度超越时空', iconChar: '虚', baseAttack: 80, baseDefense: 45, baseHp: 400, baseSpeed: 68, growthPerTier: 0.25 },

  // ========== 光明属性 (8种) ==========
  { id: 'spirit-guang-xiao', name: '魂灵·光灵鹿', beastName: '光明鹿', attribute: '光明', description: '通体洁白，角上有圣光环绕', feature: '光明治愈，净化一切邪恶', iconChar: '光', baseAttack: 23, baseDefense: 38, baseHp: 270, baseSpeed: 38, growthPerTier: 0.16 },
  { id: 'spirit-guang-ge', name: '魂灵·圣光白鸽', beastName: '圣光鸽', attribute: '光明', description: '洁白羽翼，周身圣光点点', feature: '和平使者，可治愈伤势、净化邪祟', iconChar: '圣', baseAttack: 20, baseDefense: 32, baseHp: 220, baseSpeed: 42, growthPerTier: 0.16 },
  { id: 'spirit-guang-shi', name: '魂灵·光明狮', beastName: '光明狮', attribute: '光明', description: '金白色狮身，鬃毛如阳光般灿烂', feature: '光明狮吼，驱散黑暗', iconChar: '明', baseAttack: 40, baseDefense: 48, baseHp: 340, baseSpeed: 35, growthPerTier: 0.18 },
  { id: 'spirit-guang-tian', name: '魂灵·天使', beastName: '光明天使', attribute: '光明', description: '六翼天使，神圣不可侵犯', feature: '光明神力，可审判可治愈', iconChar: '使', baseAttack: 44, baseDefense: 52, baseHp: 380, baseSpeed: 45, growthPerTier: 0.20 },
  { id: 'spirit-guang-long', name: '魂灵·光龙', beastName: '圣耀光龙', attribute: '光明', description: '黄金色巨龙，浑身散发圣光', feature: '光明龙息，可焚尽黑暗', iconChar: '耀', baseAttack: 52, baseDefense: 60, baseHp: 480, baseSpeed: 42, growthPerTier: 0.22 },
  { id: 'spirit-guang-sheng', name: '魂灵·圣虎', beastName: '圣光白虎', attribute: '光明', description: '西方神兽，圣光环绕的白虎', feature: '圣兽之尊，光明与正义的化身', iconChar: '圣', baseAttack: 50, baseDefense: 62, baseHp: 460, baseSpeed: 40, growthPerTier: 0.23 },
  { id: 'spirit-guang-shen', name: '魂灵·光明神', beastName: '太阳神兽', attribute: '光明', description: '太阳之精所化，万丈光芒普照大地', feature: '光明属性至尊，太阳神光净化万物', iconChar: '日', baseAttack: 60, baseDefense: 68, baseHp: 540, baseSpeed: 48, growthPerTier: 0.25 },
  { id: 'spirit-guang-di', name: '魂灵·光帝', beastName: '极光神帝', attribute: '光明', description: '极光之巅的神明，万光之源', feature: '神级光系魂灵，极光之下众生臣服', iconChar: '极', baseAttack: 65, baseDefense: 72, baseHp: 620, baseSpeed: 50, growthPerTier: 0.27 },

  // ========== 黑暗属性 (8种) ==========
  { id: 'spirit-an-mo', name: '魂灵·暗影蝠', beastName: '暗影蝠', attribute: '黑暗', description: '漆黑翼膜，隐匿于阴影之中', feature: '暗影突袭，吸血恢复', iconChar: '影', baseAttack: 38, baseDefense: 25, baseHp: 160, baseSpeed: 40, growthPerTier: 0.16 },
  { id: 'spirit-an-she', name: '魂灵·冥蛇', beastName: '幽冥蛇', attribute: '黑暗', description: '深黑色鳞片，游走于幽冥之间', feature: '剧毒蚀魂，黑暗隐身', iconChar: '冥', baseAttack: 45, baseDefense: 30, baseHp: 200, baseSpeed: 35, growthPerTier: 0.17 },
  { id: 'spirit-an-lang', name: '魂灵·暗狼', beastName: '暗夜魔狼', attribute: '黑暗', description: '黑如墨汁，月光下眼中有幽火', feature: '暗夜猎杀，月黑风高时实力倍增', iconChar: '暗', baseAttack: 52, baseDefense: 32, baseHp: 230, baseSpeed: 40, growthPerTier: 0.18 },
  { id: 'spirit-an-hu', name: '魂灵·暗黑虎', beastName: '暗黑魔虎', attribute: '黑暗', description: '漆黑虎身，纹路如深渊', feature: '黑暗之力，吞噬光明', iconChar: '黑', baseAttack: 62, baseDefense: 40, baseHp: 300, baseSpeed: 38, growthPerTier: 0.20 },
  { id: 'spirit-an-long', name: '魂灵·黑龙', beastName: '金眼黑龙', attribute: '黑暗', description: '通体漆黑，金色竖瞳如死神凝视', feature: '黑龙吐息，腐蚀万物', iconChar: '黑', baseAttack: 75, baseDefense: 48, baseHp: 380, baseSpeed: 42, growthPerTier: 0.22 },
  { id: 'spirit-an-gu', name: '魂灵·骨龙', beastName: '白骨龙', attribute: '黑暗', description: '白骨构成的龙形，眼窝幽火跳动', feature: '亡灵之力，不死不灭', iconChar: '骨', baseAttack: 68, baseDefense: 55, baseHp: 400, baseSpeed: 32, growthPerTier: 0.23 },
  { id: 'spirit-an-shen', name: '魂灵·黑暗神', beastName: '冥王黑龙', attribute: '黑暗', description: '冥界主宰，掌控生死的黑龙', feature: '黑暗属性至尊，冥王之力可判生死', iconChar: '冥', baseAttack: 85, baseDefense: 55, baseHp: 450, baseSpeed: 45, growthPerTier: 0.25 },
  { id: 'spirit-an-di', name: '魂灵·暗帝', beastName: '黑暗圣龙', attribute: '黑暗', description: '黑暗中的至高存在，龙翼遮蔽日月', feature: '神级暗系魂灵，黑暗降临吞噬一切', iconChar: '圣', baseAttack: 92, baseDefense: 58, baseHp: 500, baseSpeed: 48, growthPerTier: 0.27 },

  // ========== 精神属性 (8种) ==========
  { id: 'spirit-jing-mu', name: '魂灵·灵眸猫', beastName: '灵眸猫', attribute: '精神', description: '紫色竖瞳，可看破一切幻象', feature: '精神探测，破幻之力', iconChar: '眸', baseAttack: 32, baseDefense: 25, baseHp: 160, baseSpeed: 40, growthPerTier: 0.17 },
  { id: 'spirit-jing-hudie', name: '魂灵·幻梦蝶', beastName: '幻梦蝶', attribute: '精神', description: '翅膀如梦幻泡影，粉紫流光', feature: '精神迷惑，让人陷入幻境', iconChar: '幻', baseAttack: 38, baseDefense: 22, baseHp: 140, baseSpeed: 45, growthPerTier: 0.18 },
  { id: 'spirit-jing-ling', name: '魂灵·心灵兽', beastName: '心灵兽', attribute: '精神', description: '半透明灵魂体，如梦似幻', feature: '心灵感应，可与魂师精神共鸣', iconChar: '灵', baseAttack: 42, baseDefense: 28, baseHp: 180, baseSpeed: 38, growthPerTier: 0.19 },
  { id: 'spirit-jing-hun', name: '魂灵·魂兽', beastName: '噬魂兽', attribute: '精神', description: '虚体魂兽，漂浮于虚空', feature: '吞噬魂力，精神攻击', iconChar: '魂', baseAttack: 50, baseDefense: 30, baseHp: 200, baseSpeed: 35, growthPerTier: 0.20 },
  { id: 'spirit-jing-shen', name: '魂灵·神识兽', beastName: '神识天狐', attribute: '精神', description: '九尾天狐，每尾代表一道神识', feature: '神识强大，可同时操控多道精神攻击', iconChar: '狐', baseAttack: 58, baseDefense: 35, baseHp: 250, baseSpeed: 42, growthPerTier: 0.22 },
  { id: 'spirit-jing-mo', name: '魂灵·魔眼', beastName: '通天魔眼', attribute: '精神', description: '巨大的紫色竖瞳，直冲天穹', feature: '精神属性至尊，魔眼可洞穿灵魂', iconChar: '瞳', baseAttack: 70, baseDefense: 38, baseHp: 280, baseSpeed: 38, growthPerTier: 0.24 },
  { id: 'spirit-jing-tian', name: '魂灵·天妖', beastName: '天幻妖狐', attribute: '精神', description: '九尾天狐妖，幻术可模拟一界', feature: '精神至尊之一，天狐幻境困杀万物', iconChar: '妖', baseAttack: 75, baseDefense: 40, baseHp: 320, baseSpeed: 45, growthPerTier: 0.25 },
  { id: 'spirit-jing-shen2', name: '魂灵·精神神', beastName: '灵眸神尊', attribute: '精神', description: '精神之海的神明，一眼可碎万魂', feature: '神级精神系魂灵，一念之间万千魂灭', iconChar: '尊', baseAttack: 85, baseDefense: 45, baseHp: 380, baseSpeed: 42, growthPerTier: 0.27 },

  // ========== 混沌属性 (8种，可被空间/时间属性副本使用) ==========
  // v10.0 混沌系魂灵基础属性整体下调 30%，平衡各属性差异，避免混沌系碾压
  { id: 'spirit-hun-qian', name: '魂灵·混沌兽', beastName: '混沌初兽', attribute: '混沌', description: '混沌未分之初的古兽，无形无相', feature: '混沌之力，可演化万物', iconChar: '混', baseAttack: 38, baseDefense: 28, baseHp: 210, baseSpeed: 22, growthPerTier: 0.18 },
  { id: 'spirit-hun-tai', name: '魂灵·太初龙', beastName: '太初古龙', attribute: '混沌', description: '天地开辟前诞生的远古神龙', feature: '太初之力，超越属性', iconChar: '初', baseAttack: 45, baseDefense: 34, baseHp: 270, baseSpeed: 25, growthPerTier: 0.20 },
  { id: 'spirit-hun-kong', name: '魂灵·空间兽', beastName: '虚空裂空兽', attribute: '混沌', description: '可撕裂空间的奇异魂兽，身周空间扭曲', feature: '空间之力，穿梭虚空', iconChar: '空', baseAttack: 42, baseDefense: 30, baseHp: 220, baseSpeed: 45, growthPerTier: 0.21 },
  { id: 'spirit-hun-shi', name: '魂灵·时之虫', beastName: '时光虫', attribute: '混沌', description: '流淌在时间长河中的奇异生物', feature: '时间之力，可加速或减速', iconChar: '时', baseAttack: 38, baseDefense: 32, baseHp: 250, baseSpeed: 40, growthPerTier: 0.20 },
  { id: 'spirit-hun-shi2', name: '魂灵·时空龙', beastName: '时空神龙', attribute: '混沌', description: '掌握时空两大本源的神龙', feature: '时空交错，无物可挡', iconChar: '时', baseAttack: 52, baseDefense: 37, baseHp: 300, baseSpeed: 42, growthPerTier: 0.22 },
  { id: 'spirit-hun-wu', name: '魂灵·无尽天', beastName: '无尽天帝兽', attribute: '混沌', description: '凌驾于诸天之上的混沌神兽', feature: '混沌属性至尊，无尽之力', iconChar: '无', baseAttack: 60, baseDefense: 41, baseHp: 340, baseSpeed: 38, growthPerTier: 0.24 },
  { id: 'spirit-hun-hong', name: '魂灵·鸿蒙', beastName: '鸿蒙之灵', attribute: '混沌', description: '鸿蒙未判之时的原始灵体', feature: '鸿蒙之力，开天辟地', iconChar: '蒙', baseAttack: 63, baseDefense: 42, baseHp: 370, baseSpeed: 40, growthPerTier: 0.25 },
  { id: 'spirit-hun-shen', name: '魂灵·混沌神', beastName: '混沌天神', attribute: '混沌', description: '混沌中诞生的至高神明，万物之祖', feature: '神级混沌系魂灵，演化三千大道', iconChar: '神', baseAttack: 70, baseDefense: 46, baseHp: 420, baseSpeed: 42, growthPerTier: 0.27 },
];


/** 魂灵等级解锁（第N个魂灵需要的等级） */
export const SPIRIT_SLOT_UNLOCK_LEVELS = [60, 70, 80, 90];

/** 魂灵属性颜色映射 */
export const SPIRIT_ELEMENT_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  '金': { bg: 'bg-amber-400/20', border: 'border-amber-400', text: 'text-amber-300', glow: 'shadow-amber-400/50' },
  '木': { bg: 'bg-emerald-400/20', border: 'border-emerald-400', text: 'text-emerald-300', glow: 'shadow-emerald-400/50' },
  '水': { bg: 'bg-sky-400/20', border: 'border-sky-400', text: 'text-sky-300', glow: 'shadow-sky-400/50' },
  '火': { bg: 'bg-rose-500/20', border: 'border-rose-500', text: 'text-rose-300', glow: 'shadow-rose-500/50' },
  '土': { bg: 'bg-yellow-600/20', border: 'border-yellow-600', text: 'text-yellow-400', glow: 'shadow-yellow-600/50' },
  '冰': { bg: 'bg-cyan-300/20', border: 'border-cyan-300', text: 'text-cyan-200', glow: 'shadow-cyan-300/50' },
  '雷': { bg: 'bg-violet-500/20', border: 'border-violet-500', text: 'text-violet-300', glow: 'shadow-violet-500/50' },
  '风': { bg: 'bg-teal-400/20', border: 'border-teal-400', text: 'text-teal-300', glow: 'shadow-teal-400/50' },
  '光明': { bg: 'bg-yellow-200/20', border: 'border-yellow-200', text: 'text-yellow-100', glow: 'shadow-yellow-200/50' },
  '黑暗': { bg: 'bg-slate-600/30', border: 'border-slate-500', text: 'text-slate-200', glow: 'shadow-slate-500/50' },
  '精神': { bg: 'bg-fuchsia-400/20', border: 'border-fuchsia-400', text: 'text-fuchsia-300', glow: 'shadow-fuchsia-400/50' },
  '混沌': { bg: 'bg-indigo-500/20', border: 'border-indigo-400', text: 'text-indigo-300', glow: 'shadow-indigo-500/50' },
};
