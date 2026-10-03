// EXPORTS: IItem, MOCK_ITEMS, SOUL_GUIDE_ITEMS, SPIRIT_GRASSES, IMMORTAL_GRASSES, ICE_FIRE_IMMORTAL_GRASSES, HOLY_GRASSES, WATER_OF_LIFE, ConsumableExtra, SoulGuideGrade, SoulGuideType, CORE_GEMS, CRAFT_ATTR_CAP_PER_LEVEL, CRAFT_MATERIAL_REQ, MATERIAL_BONUS_BY_TIER, MATERIAL_QUALITY_INFO, MaterialQuality, getConsumableExtra, rollMaterialWithQuality, getMaterialsByTier, formatYearsLabel, rollFierceBeastDrops, rollIceGrassDrop, SPECIAL_ITEMS, getSpecialItemById
export type SoulGuideGrade = 'tier1' | 'tier2' | 'tier3';
export type SoulGuideType = 'melee' | 'defense' | 'ranged' | 'support' | 'flying';

export interface IItem {
  id: string;
  name: string;
  type: 'soulGuide' | 'soulBone' | 'consumable' | 'material' | 'special';
  slot?: string; // 对应装备槽 key
  soulGuideType?: SoulGuideType; // 魂导器类型：近战/防御/远程/辅助
  soulGuideGrade?: SoulGuideGrade; // 魂导器等级：一级/二级/三级
  quality: 'common' | 'rare' | 'fine' | 'epic' | 'legendary';
  qualityColor: string;
  iconChar: string;
  description: string;
  quantity?: number; // 堆叠数量（材料/消耗品等可堆叠物品）
  attributes?: {
    attack?: number;
    defense?: number;
    speed?: number;
    spirit?: number;
    hp?: number;
    critRate?: number;   // 暴击率，百分比值（如 5 表示 5%）
    critDmg?: number;    // 爆伤，百分比值（如 10 表示 +10%）
    allAttr?: number;    // 全属性，百分比值（如 5 表示五维各+5%）
    soulPower?: number;  // 最大魂力加成（数值）
  };
  effect?: string;
  sellPrice: number;
  buyPrice?: number; // 商店购买价
  // === 魂导材料专用字段 ===
  materialTier?: number; // 材料等级 1-9
  materialAttr?: 'attack' | 'defense' | 'speed' | 'spirit' | 'critRate' | 'critDmg' | 'allAttr' | 'soulPower' | 'hp' | 'core' | 'universal'; // 属性倾向
  materialBonus?: number; // 材料提供的基础属性点数
  materialQuality?: 'common' | 'fine' | 'rare'; // 材料品阶：普通/精良/稀有
  craftable?: boolean; // 是否为自制魂导器
  crafter?: string; // 制作者名称
  craftVersion?: number; // v2.0 自制魂导器版本标记（2=固定数值版）
   soulGuideLevel?: number; // 自制魂导器等级 1-9（商店魂导器用 soulGuideGrade 三级制，自制用 1-9 级制）
   specialEffect?: {
      key: 'skillDmg' | 'basicDmg' | 'hpRegen' | 'spiritBonus' | 'critRate' | 'speedBonus';
      name: string;
      desc: string;
      color: string;
    }; // 魂导核心刻画的特殊效果
   /** 魂兽属性（魂骨用），如 '冰属性'、'火属性' 等，用于属性克制 */
   beastAttribute?: string;
   /** 魂骨年限（具体年数，如 1500 表示1500年） */
   soulBoneYears?: number;
   /** 魂骨年限标签：十年/百年/千年/万年/十万年 */
   soulBoneYearsLabel?: string;
}

// 魂导器商店数据：3个等级 × 4种类型 × 每种4个
// 商店魂导器属性均为数值加成（魂环、魂骨、装备同理数值化）
// 一级：主属性 55~75，次属性 25~45，气血 ≈ 主属性×1.5
// 二级：主属性 200~270，次属性 100~180，气血 ≈ 主属性×1.5
// 三级：主属性 850~1000，次属性 400~750，气血 ≈ 主属性×1.5
export const SOUL_GUIDE_ITEMS: IItem[] = [
  // ===== 一级魂导器（绿色，500-2000魂币）=====
  // 近战
  { id: 'sg-m1-1', name: '破甲刀', type: 'soulGuide', slot: 'melee', soulGuideType: 'melee', soulGuideGrade: 'tier1',
    quality: 'rare', qualityColor: '#22c55e', iconChar: '破',
    description: '专为破甲设计的近战魂导器，锋刃附带魂力震荡。',
    attributes: { attack: 70, defense: 25, speed: 25, spirit: 25, hp: 80, critRate: 1.5, critDmg: 4 }, sellPrice: 250, buyPrice: 800 },
  { id: 'sg-m1-2', name: '裂地锤', type: 'soulGuide', slot: 'melee', soulGuideType: 'melee', soulGuideGrade: 'tier1',
    quality: 'rare', qualityColor: '#22c55e', iconChar: '裂',
    description: '沉重的魂力巨锤，一击之下地面龟裂。',
    attributes: { attack: 65, defense: 40, speed: 25, spirit: 25, hp: 100 }, sellPrice: 300, buyPrice: 1000 },
  { id: 'sg-m1-3', name: '嗜血剑', type: 'soulGuide', slot: 'melee', soulGuideType: 'melee', soulGuideGrade: 'tier1',
    quality: 'rare', qualityColor: '#22c55e', iconChar: '嗜',
    description: '吸血附魔的长剑，攻击时回复少量气血。',
    attributes: { attack: 65, defense: 25, speed: 45, spirit: 30, hp: 70, critRate: 2, critDmg: 5 }, sellPrice: 350, buyPrice: 1200 },
  { id: 'sg-m1-4', name: '龙牙匕', type: 'soulGuide', slot: 'melee', soulGuideType: 'melee', soulGuideGrade: 'tier1',
    quality: 'rare', qualityColor: '#22c55e', iconChar: '龙',
    description: '以龙牙锻造的短匕，出窍快如闪电。',
    attributes: { attack: 55, defense: 25, speed: 65, spirit: 35, hp: 60 }, sellPrice: 450, buyPrice: 1500 },

  // 防御
  { id: 'sg-d1-1', name: '玄铁盾', type: 'soulGuide', slot: 'defense', soulGuideType: 'defense', soulGuideGrade: 'tier1',
    quality: 'rare', qualityColor: '#22c55e', iconChar: '玄',
    description: '玄铁打造的重盾，防御坚实可靠。',
    attributes: { attack: 25, defense: 70, speed: 25, spirit: 25, hp: 100, critDmg: 2.5 }, sellPrice: 250, buyPrice: 800 },
  { id: 'sg-d1-2', name: '金刚护臂', type: 'soulGuide', slot: 'defense', soulGuideType: 'defense', soulGuideGrade: 'tier1',
    quality: 'rare', qualityColor: '#22c55e', iconChar: '金',
    description: '覆盖手臂的金刚魂导器，格挡力极强。',
    attributes: { attack: 30, defense: 65, speed: 25, spirit: 25, hp: 90 }, sellPrice: 300, buyPrice: 1000 },
  { id: 'sg-d1-3', name: '天蚕护甲', type: 'soulGuide', slot: 'defense', soulGuideType: 'defense', soulGuideGrade: 'tier1',
    quality: 'rare', qualityColor: '#22c55e', iconChar: '蚕',
    description: '天蚕丝编织的护身甲，轻便而坚韧。',
    attributes: { attack: 25, defense: 55, speed: 35, spirit: 25, hp: 100 }, sellPrice: 400, buyPrice: 1300 },
  { id: 'sg-d1-4', name: '锁子甲魂导器', type: 'soulGuide', slot: 'defense', soulGuideType: 'defense', soulGuideGrade: 'tier1',
    quality: 'rare', qualityColor: '#22c55e', iconChar: '锁',
    description: '魂力锁子甲，层层相扣，抗打击能力出众。',
    attributes: { attack: 25, defense: 70, speed: 25, spirit: 30, hp: 110 }, sellPrice: 500, buyPrice: 1700 },

  // 远程
  { id: 'sg-r1-1', name: '连射弩', type: 'soulGuide', slot: 'ranged', soulGuideType: 'ranged', soulGuideGrade: 'tier1',
    quality: 'rare', qualityColor: '#22c55e', iconChar: '连',
    description: '可连续发射魂力箭矢的连弩。',
    attributes: { attack: 65, defense: 25, speed: 45, spirit: 25, hp: 70, critRate: 2.5 }, sellPrice: 250, buyPrice: 800 },
  { id: 'sg-r1-2', name: '追魂炮', type: 'soulGuide', slot: 'ranged', soulGuideType: 'ranged', soulGuideGrade: 'tier1',
    quality: 'rare', qualityColor: '#22c55e', iconChar: '追',
    description: '自带追踪效果的小型魂导炮。',
    attributes: { attack: 70, defense: 25, speed: 30, spirit: 35, hp: 75 }, sellPrice: 350, buyPrice: 1200 },
  { id: 'sg-r1-3', name: '鹰眼弓', type: 'soulGuide', slot: 'ranged', soulGuideType: 'ranged', soulGuideGrade: 'tier1',
    quality: 'rare', qualityColor: '#22c55e', iconChar: '鹰',
    description: '鹰眼雕纹的长弓，精准度远超普通弓弩。',
    attributes: { attack: 65, defense: 25, speed: 55, spirit: 40, hp: 65 }, sellPrice: 450, buyPrice: 1500 },
  { id: 'sg-r1-4', name: '爆裂弹', type: 'soulGuide', slot: 'ranged', soulGuideType: 'ranged', soulGuideGrade: 'tier1',
    quality: 'rare', qualityColor: '#22c55e', iconChar: '爆',
    description: '投掷后爆裂的魂力炸弹，范围伤害可观。',
    attributes: { attack: 70, defense: 25, speed: 30, spirit: 30, hp: 90 }, sellPrice: 500, buyPrice: 1800 },

  // 辅助
  { id: 'sg-s1-1', name: '聚能灯', type: 'soulGuide', slot: 'support', soulGuideType: 'support', soulGuideGrade: 'tier1',
    quality: 'rare', qualityColor: '#22c55e', iconChar: '聚',
    description: '聚集天地魂力的魂导灯，提升精神力。',
    attributes: { attack: 25, defense: 25, speed: 30, spirit: 70, hp: 80, soulPower: 15 }, sellPrice: 250, buyPrice: 700 },
  { id: 'sg-s1-2', name: '增幅徽章', type: 'soulGuide', slot: 'support', soulGuideType: 'support', soulGuideGrade: 'tier1',
    quality: 'rare', qualityColor: '#22c55e', iconChar: '增',
    description: '佩戴后可小幅增幅全属性的徽章。',
    attributes: { attack: 35, defense: 35, speed: 35, spirit: 35, hp: 70, allAttr: 0 }, sellPrice: 350, buyPrice: 1100 },
  { id: 'sg-s1-3', name: '治愈权杖', type: 'soulGuide', slot: 'support', soulGuideType: 'support', soulGuideGrade: 'tier1',
    quality: 'rare', qualityColor: '#22c55e', iconChar: '愈',
    description: '蕴含治愈魂力的权杖，增加气血上限。',
    attributes: { attack: 25, defense: 35, speed: 25, spirit: 55, hp: 110, soulPower: 20 }, sellPrice: 400, buyPrice: 1400 },
  { id: 'sg-s1-4', name: '风行靴', type: 'soulGuide', slot: 'support', soulGuideType: 'support', soulGuideGrade: 'tier1',
    quality: 'rare', qualityColor: '#22c55e', iconChar: '风',
    description: '风行附魔的短靴，大幅提升移动速度。',
    attributes: { attack: 25, defense: 30, speed: 70, spirit: 35, hp: 65 }, sellPrice: 500, buyPrice: 1700 },

  // 飞行
  { id: 'sg-f1-1', name: '御风靴', type: 'soulGuide', slot: 'flying', soulGuideType: 'flying', soulGuideGrade: 'tier1',
    quality: 'rare', qualityColor: '#22c55e', iconChar: '御',
    description: '初级飞行魂导器，借助风力短暂浮空，速度大增。',
    attributes: { attack: 20, defense: 20, speed: 75, spirit: 40, hp: 60 }, sellPrice: 300, buyPrice: 1000 },
  { id: 'sg-f1-2', name: '羽翼飞环', type: 'soulGuide', slot: 'flying', soulGuideType: 'flying', soulGuideGrade: 'tier1',
    quality: 'rare', qualityColor: '#22c55e', iconChar: '羽',
    description: '羽翼造型的飞行魂导环，轻盈灵动。',
    attributes: { attack: 25, defense: 25, speed: 65, spirit: 50, hp: 70 }, sellPrice: 400, buyPrice: 1300 },
  { id: 'sg-f1-3', name: '青风翼', type: 'soulGuide', slot: 'flying', soulGuideType: 'flying', soulGuideGrade: 'tier1',
    quality: 'rare', qualityColor: '#22c55e', iconChar: '青',
    description: '以青风雕羽炼制的飞行魂导器，速度与精神兼具。',
    attributes: { attack: 20, defense: 20, speed: 70, spirit: 55, hp: 65 }, sellPrice: 500, buyPrice: 1700 },

  // ===== 二级魂导器（蓝色，3000-8000魂币）=====
  // 近战
  { id: 'sg-m2-1', name: '雷霆战斧', type: 'soulGuide', slot: 'melee', soulGuideType: 'melee', soulGuideGrade: 'tier2',
    quality: 'fine', qualityColor: '#3b82f6', iconChar: '雷',
    description: '引动雷霆之力的战斧，每一击都附带雷电伤害。',
    attributes: { attack: 230, defense: 100, speed: 140, spirit: 100, hp: 250 }, sellPrice: 1500, buyPrice: 3500 },
  { id: 'sg-m2-2', name: '炎魔之刃', type: 'soulGuide', slot: 'melee', soulGuideType: 'melee', soulGuideGrade: 'tier2',
    quality: 'fine', qualityColor: '#3b82f6', iconChar: '炎',
    description: '燃烧着不灭炎魔之火的魔刃。',
    attributes: { attack: 250, defense: 100, speed: 100, spirit: 140, hp: 250, critRate: 3, critDmg: 6 }, sellPrice: 2000, buyPrice: 4500 },
  { id: 'sg-m2-3', name: '寒冰重剑', type: 'soulGuide', slot: 'melee', soulGuideType: 'melee', soulGuideGrade: 'tier2',
    quality: 'fine', qualityColor: '#3b82f6', iconChar: '冰',
    description: '极北寒冰锻造的重剑，攻击附带减速效果。',
    attributes: { attack: 200, defense: 170, speed: 100, spirit: 100, hp: 320 }, sellPrice: 2500, buyPrice: 5500 },
  { id: 'sg-m2-4', name: '七星龙渊', type: 'soulGuide', slot: 'melee', soulGuideType: 'melee', soulGuideGrade: 'tier2',
    quality: 'fine', qualityColor: '#3b82f6', iconChar: '七',
    description: '镶嵌七枚魂导石的长剑，随魂力激发七星阵。',
    attributes: { attack: 260, defense: 100, speed: 180, spirit: 140, hp: 250 }, sellPrice: 3500, buyPrice: 7500 },

  // 防御
  { id: 'sg-d2-1', name: '玄武盾', type: 'soulGuide', slot: 'defense', soulGuideType: 'defense', soulGuideGrade: 'tier2',
    quality: 'fine', qualityColor: '#3b82f6', iconChar: '玄',
    description: '玄武虚影护体的大盾，防御力极强。',
    attributes: { attack: 100, defense: 250, speed: 100, spirit: 100, hp: 380 }, sellPrice: 1500, buyPrice: 3500 },
  { id: 'sg-d2-2', name: '琉璃战铠', type: 'soulGuide', slot: 'defense', soulGuideType: 'defense', soulGuideGrade: 'tier2',
    quality: 'fine', qualityColor: '#3b82f6', iconChar: '琉',
    description: '琉璃质感的全身魂导战铠，华丽而坚固。',
    attributes: { attack: 100, defense: 220, speed: 150, spirit: 140, hp: 260, allAttr: 0 }, sellPrice: 2000, buyPrice: 4500 },
  { id: 'sg-d2-3', name: '幽冥铠甲', type: 'soulGuide', slot: 'defense', soulGuideType: 'defense', soulGuideGrade: 'tier2',
    quality: 'fine', qualityColor: '#3b82f6', iconChar: '幽',
    description: '暗影材质的铠甲，可吸收部分物理伤害。',
    attributes: { attack: 140, defense: 250, speed: 100, spirit: 100, hp: 330 }, sellPrice: 2800, buyPrice: 6000 },
  { id: 'sg-d2-4', name: '不动明王铠', type: 'soulGuide', slot: 'defense', soulGuideType: 'defense', soulGuideGrade: 'tier2',
    quality: 'fine', qualityColor: '#3b82f6', iconChar: '明',
    description: '明王虚影守护的重铠，如山岳般不可撼动。',
    attributes: { attack: 100, defense: 270, speed: 100, spirit: 130, hp: 400 }, sellPrice: 3500, buyPrice: 7800 },

  // 远程
  { id: 'sg-r2-1', name: '穿云弓', type: 'soulGuide', slot: 'ranged', soulGuideType: 'ranged', soulGuideGrade: 'tier2',
    quality: 'fine', qualityColor: '#3b82f6', iconChar: '穿',
    description: '可一箭穿云的强力魂导弓，射程极远。',
    attributes: { attack: 230, defense: 100, speed: 180, spirit: 100, hp: 250 }, sellPrice: 1500, buyPrice: 3500 },
  { id: 'sg-r2-2', name: '毁灭炮', type: 'soulGuide', slot: 'ranged', soulGuideType: 'ranged', soulGuideGrade: 'tier2',
    quality: 'fine', qualityColor: '#3b82f6', iconChar: '毁',
    description: '单发威力惊人的重型魂导炮。',
    attributes: { attack: 260, defense: 100, speed: 100, spirit: 120, hp: 280, critDmg: 7.5 }, sellPrice: 2200, buyPrice: 5000 },
  { id: 'sg-r2-3', name: '暴风连射炮', type: 'soulGuide', slot: 'ranged', soulGuideType: 'ranged', soulGuideGrade: 'tier2',
    quality: 'fine', qualityColor: '#3b82f6', iconChar: '暴',
    description: '高射速魂导炮，短时间内倾泻大量魂力弹。',
    attributes: { attack: 200, defense: 100, speed: 270, spirit: 140, hp: 250 }, sellPrice: 2800, buyPrice: 6200 },
  { id: 'sg-r2-4', name: '凤翼翎箭', type: 'soulGuide', slot: 'ranged', soulGuideType: 'ranged', soulGuideGrade: 'tier2',
    quality: 'fine', qualityColor: '#3b82f6', iconChar: '凤',
    description: '附带凤凰烈焰的翎箭，灼烧敌人。',
    attributes: { attack: 250, defense: 100, speed: 160, spirit: 170, hp: 250 }, sellPrice: 3500, buyPrice: 7800 },

  // 辅助
  { id: 'sg-s2-1', name: '魂力结晶', type: 'soulGuide', slot: 'support', soulGuideType: 'support', soulGuideGrade: 'tier2',
    quality: 'fine', qualityColor: '#3b82f6', iconChar: '晶',
    description: '凝结精纯魂力的晶体，可显著提升精神力。',
    attributes: { attack: 100, defense: 100, speed: 100, spirit: 250, hp: 300, soulPower: 40 }, sellPrice: 1500, buyPrice: 3200 },
  { id: 'sg-s2-2', name: '全属性护符', type: 'soulGuide', slot: 'support', soulGuideType: 'support', soulGuideGrade: 'tier2',
    quality: 'fine', qualityColor: '#3b82f6', iconChar: '全',
    description: '均衡提升五维属性的稀有护符。',
    attributes: { attack: 140, defense: 140, speed: 140, spirit: 140, hp: 280, allAttr: 0 }, sellPrice: 2200, buyPrice: 4800 },
  { id: 'sg-s2-3', name: '生命之树徽章', type: 'soulGuide', slot: 'support', soulGuideType: 'support', soulGuideGrade: 'tier2',
    quality: 'fine', qualityColor: '#3b82f6', iconChar: '树',
    description: '蕴含生命本源之力的徽章，气血充沛。',
    attributes: { attack: 100, defense: 150, speed: 100, spirit: 180, hp: 420, soulPower: 30 }, sellPrice: 2800, buyPrice: 6000 },
  { id: 'sg-s2-4', name: '瞬移披风', type: 'soulGuide', slot: 'support', soulGuideType: 'support', soulGuideGrade: 'tier2',
    quality: 'fine', qualityColor: '#3b82f6', iconChar: '瞬',
    description: '附带短距瞬移能力的魂导披风，速度惊人。',
    attributes: { attack: 100, defense: 100, speed: 250, spirit: 180, hp: 250 }, sellPrice: 3500, buyPrice: 7500 },

  // 飞行
  { id: 'sg-f2-1', name: '流云飞翼', type: 'soulGuide', slot: 'flying', soulGuideType: 'flying', soulGuideGrade: 'tier2',
    quality: 'fine', qualityColor: '#3b82f6', iconChar: '流',
    description: '踏云而行的中级飞行魂导器，速度与精神双修。',
    attributes: { attack: 80, defense: 80, speed: 270, spirit: 200, hp: 220 }, sellPrice: 1800, buyPrice: 4000 },
  { id: 'sg-f2-2', name: '雷霆飞梭', type: 'soulGuide', slot: 'flying', soulGuideType: 'flying', soulGuideGrade: 'tier2',
    quality: 'fine', qualityColor: '#3b82f6', iconChar: '梭',
    description: '以雷力推进的飞梭型魂导器，极速破空。',
    attributes: { attack: 120, defense: 80, speed: 280, spirit: 150, hp: 200 }, sellPrice: 2500, buyPrice: 5500 },
  { id: 'sg-f2-3', name: '精神御空环', type: 'soulGuide', slot: 'flying', soulGuideType: 'flying', soulGuideGrade: 'tier2',
    quality: 'fine', qualityColor: '#3b82f6', iconChar: '御',
    description: '以精神力驱动的飞行魂导器，精神越强飞得越快越高。',
    attributes: { attack: 70, defense: 70, speed: 240, spirit: 260, hp: 240, soulPower: 30 }, sellPrice: 3200, buyPrice: 7000 },

  // ===== 三级魂导器（紫色，10000-30000魂币）=====
  // 近战
  { id: 'sg-m3-1', name: '审判之剑', type: 'soulGuide', slot: 'melee', soulGuideType: 'melee', soulGuideGrade: 'tier3',
    quality: 'epic', qualityColor: '#a855f7', iconChar: '审',
    description: '传说中的审判之剑，一剑之下万魔伏诛。',
    attributes: { attack: 900, defense: 400, speed: 600, spirit: 500, hp: 1200, critRate: 5, critDmg: 10 }, sellPrice: 6000, buyPrice: 12000 },
  { id: 'sg-m3-2', name: '碎星巨锤', type: 'soulGuide', slot: 'melee', soulGuideType: 'melee', soulGuideGrade: 'tier3',
    quality: 'epic', qualityColor: '#a855f7', iconChar: '碎',
    description: '魂力驱动的重型战锤，力之极致的象征。',
    attributes: { attack: 1000, defense: 700, speed: 400, spirit: 400, hp: 1600 }, sellPrice: 8000, buyPrice: 16000 },
  { id: 'sg-m3-3', name: '断岳斩魂剑', type: 'soulGuide', slot: 'melee', soulGuideType: 'melee', soulGuideGrade: 'tier3',
    quality: 'epic', qualityColor: '#a855f7', iconChar: '断',
    description: '斩山断岳的长剑，魂力灌注下剑芒凌厉无匹。',
    attributes: { attack: 950, defense: 400, speed: 750, spirit: 600, hp: 1200 }, sellPrice: 10000, buyPrice: 20000 },
  { id: 'sg-m3-4', name: '龙神之刃', type: 'soulGuide', slot: 'melee', soulGuideType: 'melee', soulGuideGrade: 'tier3',
    quality: 'epic', qualityColor: '#a855f7', iconChar: '龙',
    description: '蕴含龙神之力的至高魂导器，万刃之皇。',
    attributes: { attack: 1000, defense: 400, speed: 700, spirit: 650, hp: 1400 }, sellPrice: 15000, buyPrice: 30000 },

  // 防御
  { id: 'sg-d3-1', name: '圣光守护盾', type: 'soulGuide', slot: 'defense', soulGuideType: 'defense', soulGuideGrade: 'tier3',
    quality: 'epic', qualityColor: '#a855f7', iconChar: '圣',
    description: '圣光笼罩的守护之盾，可抵御绝大多数魂技攻击。',
    attributes: { attack: 400, defense: 900, speed: 400, spirit: 550, hp: 1500, allAttr: 0 }, sellPrice: 6000, buyPrice: 12000 },
  { id: 'sg-d3-2', name: '泰坦巨猿铠', type: 'soulGuide', slot: 'defense', soulGuideType: 'defense', soulGuideGrade: 'tier3',
    quality: 'epic', qualityColor: '#a855f7', iconChar: '泰',
    description: '以泰坦巨猿魂骨为核心的防御魂导器。',
    attributes: { attack: 500, defense: 1000, speed: 400, spirit: 400, hp: 1600 }, sellPrice: 8500, buyPrice: 17000 },
  { id: 'sg-d3-3', name: '万象琉璃护罩', type: 'soulGuide', slot: 'defense', soulGuideType: 'defense', soulGuideGrade: 'tier3',
    quality: 'epic', qualityColor: '#a855f7', iconChar: '琉',
    description: '琉璃质地的魂导护罩，层层叠叠坚不可摧。',
    attributes: { attack: 500, defense: 950, speed: 500, spirit: 600, hp: 1300 }, sellPrice: 10000, buyPrice: 21000 },
  { id: 'sg-d3-4', name: '大地之盾', type: 'soulGuide', slot: 'defense', soulGuideType: 'defense', soulGuideGrade: 'tier3',
    quality: 'epic', qualityColor: '#a855f7', iconChar: '地',
    description: '大地之力凝聚的至坚之盾，如山岳屹立。',
    attributes: { attack: 400, defense: 1000, speed: 400, spirit: 500, hp: 1600 }, sellPrice: 14000, buyPrice: 28000 },

  // 远程
  { id: 'sg-r3-1', name: '聚能爆破炮', type: 'soulGuide', slot: 'ranged', soulGuideType: 'ranged', soulGuideGrade: 'tier3',
    quality: 'epic', qualityColor: '#a855f7', iconChar: '聚',
    description: '蓄能后发射的高爆魂导炮，单发威力惊人。',
    attributes: { attack: 900, defense: 400, speed: 500, spirit: 500, hp: 1200, critRate: 4, critDmg: 9 }, sellPrice: 6500, buyPrice: 13000 },
  { id: 'sg-r3-2', name: '千刃散射炮', type: 'soulGuide', slot: 'ranged', soulGuideType: 'ranged', soulGuideGrade: 'tier3',
    quality: 'epic', qualityColor: '#a855f7', iconChar: '千',
    description: '大范围散射型魂导炮，千刃齐发覆盖敌阵。',
    attributes: { attack: 1000, defense: 400, speed: 650, spirit: 600, hp: 1200 }, sellPrice: 9000, buyPrice: 18000 },
  { id: 'sg-r3-3', name: '爆裂莲华炮', type: 'soulGuide', slot: 'ranged', soulGuideType: 'ranged', soulGuideGrade: 'tier3',
    quality: 'epic', qualityColor: '#a855f7', iconChar: '莲',
    description: '莲华形态的爆裂魂导炮，绽放时毁灭一切。',
    attributes: { attack: 1000, defense: 400, speed: 500, spirit: 700, hp: 1400 }, sellPrice: 12000, buyPrice: 24000 },
  { id: 'sg-r3-4', name: '万魂风暴炮', type: 'soulGuide', slot: 'ranged', soulGuideType: 'ranged', soulGuideGrade: 'tier3',
    quality: 'epic', qualityColor: '#a855f7', iconChar: '万',
    description: '顶级范围魂导炮，万道魂力光束形成毁灭风暴。',
    attributes: { attack: 1000, defense: 400, speed: 750, spirit: 600, hp: 1200 }, sellPrice: 15000, buyPrice: 30000 },

  // 辅助
  { id: 'sg-s3-1', name: '深海凝魂晶', type: 'soulGuide', slot: 'support', soulGuideType: 'support', soulGuideGrade: 'tier3',
    quality: 'epic', qualityColor: '#a855f7', iconChar: '深',
    description: '深海孕育的魂力水晶，精神力浩瀚如海。',
    attributes: { attack: 400, defense: 400, speed: 400, spirit: 1000, hp: 1300, soulPower: 80 }, sellPrice: 6000, buyPrice: 12000 },
  { id: 'sg-s3-2', name: '万象增幅塔', type: 'soulGuide', slot: 'support', soulGuideType: 'support', soulGuideGrade: 'tier3',
    quality: 'epic', qualityColor: '#a855f7', iconChar: '塔',
    description: '塔形增幅魂导器，可全方位提升五维属性。',
    attributes: { attack: 600, defense: 600, speed: 600, spirit: 700, hp: 1300, allAttr: 0 }, sellPrice: 8000, buyPrice: 16000 },
  { id: 'sg-s3-3', name: '九转回春盏', type: 'soulGuide', slot: 'support', soulGuideType: 'support', soulGuideGrade: 'tier3',
    quality: 'epic', qualityColor: '#a855f7', iconChar: '回',
    description: '传说级治愈魂导器，九转还魂生死人肉白骨。',
    attributes: { attack: 400, defense: 550, speed: 400, spirit: 800, hp: 1600, soulPower: 60 }, sellPrice: 11000, buyPrice: 22000 },
  { id: 'sg-s3-4', name: '命运之眼', type: 'soulGuide', slot: 'support', soulGuideType: 'support', soulGuideGrade: 'tier3',
    quality: 'epic', qualityColor: '#a855f7', iconChar: '命',
    description: '能洞察命运轨迹的神秘眼型魂导器。',
    attributes: { attack: 600, defense: 500, speed: 700, spirit: 1000, hp: 1200 }, sellPrice: 14000, buyPrice: 28000 },

  // 飞行
  { id: 'sg-f3-1', name: '九霄神舟', type: 'soulGuide', slot: 'flying', soulGuideType: 'flying', soulGuideGrade: 'tier3',
    quality: 'epic', qualityColor: '#a855f7', iconChar: '舟',
    description: '传说中的飞行魂导器，可载人遨游九霄云天。',
    attributes: { attack: 500, defense: 600, speed: 900, spirit: 700, hp: 1500 }, sellPrice: 7000, buyPrice: 14000 },
  { id: 'sg-f3-2', name: '通天飞翼', type: 'soulGuide', slot: 'flying', soulGuideType: 'flying', soulGuideGrade: 'tier3',
    quality: 'epic', qualityColor: '#a855f7', iconChar: '翼',
    description: '可通天彻地的至高飞行魂导翼，一念之间万里之遥。',
    attributes: { attack: 600, defense: 500, speed: 1000, spirit: 750, hp: 1300 }, sellPrice: 10000, buyPrice: 20000 },
  { id: 'sg-f3-3', name: '太虚飞舟', type: 'soulGuide', slot: 'flying', soulGuideType: 'flying', soulGuideGrade: 'tier3',
    quality: 'epic', qualityColor: '#a855f7', iconChar: '飞',
    description: '空间属性的顶级飞行魂导器，可穿梭虚空瞬息千里。',
    attributes: { attack: 550, defense: 550, speed: 950, spirit: 800, hp: 1400, allAttr: 0 }, sellPrice: 14000, buyPrice: 28000 },
];

// =====================================================================
// 魂导材料数据（9 个等级，每级 6 种材料，分别对应不同属性倾向）
// =====================================================================

const MATERIAL_QUALITY_BY_TIER: Record<number, { quality: IItem['quality']; color: string; label: string }> = {
  1: { quality: 'common', color: '#94a3b8', label: '一级' },
  2: { quality: 'rare', color: '#22c55e', label: '二级' },
  3: { quality: 'fine', color: '#3b82f6', label: '三级' },
  4: { quality: 'epic', color: '#a855f7', label: '四级' },
  5: { quality: 'legendary', color: '#f97316', label: '五级' },
  6: { quality: 'legendary', color: '#ef4444', label: '六级' },
  7: { quality: 'legendary', color: '#ec4899', label: '七级' },
  8: { quality: 'legendary', color: '#eab308', label: '八级' },
  9: { quality: 'legendary', color: 'linear-gradient(135deg,#ff0000,#ff7f00,#ffff00,#00ff00,#00ffff,#0000ff,#8b00ff)', label: '九级' },
};

// 材料品阶（独立于 tier 等级，普通/精良/稀有）
export const MATERIAL_QUALITY_INFO: Record<string, { label: string; color: string; bonusMult: number; chance: number }> = {
  common: { label: '普通', color: '#94a3b8', bonusMult: 1.0, chance: 0.4 },
  fine:   { label: '精良', color: '#3b82f6', bonusMult: 1.05, chance: 0.35 },
  rare:   { label: '稀有', color: '#a855f7', bonusMult: 1.1, chance: 0.25 },
};

export type MaterialQuality = 'common' | 'fine' | 'rare';

// 每级材料提供的基础属性点数（用于自制魂导器）
export const MATERIAL_BONUS_BY_TIER: Record<number, number> = {
  1: 10, 2: 25, 3: 50, 4: 100, 5: 200, 6: 400, 7: 800, 8: 1600, 9: 3200,
};

interface MaterialDef {
  id: string;
  name: string;
  iconChar: string;
  attr: 'attack' | 'defense' | 'speed' | 'spirit' | 'critRate' | 'critDmg' | 'allAttr' | 'soulPower' | 'hp' | 'core' | 'universal';
  description: string;
}

const MATERIAL_DEFS_BY_TIER: Record<number, MaterialDef[]> = {
  1: [
    { id: 'mat-1-1', name: '1级精铁', iconChar: '攻', attr: 'attack', description: '常见的铁矿石，攻击系魂导器基础材料。' },
    { id: 'mat-1-9', name: '1级玄铁石', iconChar: '防', attr: 'defense', description: '坚硬的玄铁原石，防御系魂导器基础材料。' },
    { id: 'mat-1-10', name: '1级疾风羽', iconChar: '速', attr: 'speed', description: '风系魂鸟羽毛，速度系基础材料。' },
    { id: 'mat-1-11', name: '1级凝神草', iconChar: '精', attr: 'spirit', description: '宁神静气的灵草，精神系基础材料。' },
    { id: 'mat-1-2', name: '1级锐晶石', iconChar: '暴', attr: 'critRate', description: '锋锐的晶石碎末，提升暴击率。' },
    { id: 'mat-1-3', name: '1级爆裂石', iconChar: '伤', attr: 'critDmg', description: '爆裂能量结晶，提升暴击伤害。' },
    { id: 'mat-1-4', name: '1级万象石', iconChar: '全', attr: 'allAttr', description: '蕴含万象之力，全属性均衡提升。' },
    { id: 'mat-1-5', name: '1级聚灵珠', iconChar: '魂', attr: 'soulPower', description: '聚敛魂力的灵珠，魂力系核心材料。' },
    { id: 'mat-1-6', name: '1级生命石', iconChar: '血', attr: 'hp', description: '生命能量凝结的晶石，气血充沛。' },
    { id: 'mat-1-7', name: '1级魂导核心', iconChar: '核', attr: 'core', description: '魂导器的核心媒介，传递魂力驱动。' },
    { id: 'mat-1-8', name: '1级铜晶', iconChar: '通', attr: 'universal', description: '铜绿色晶体，通用的基础材料。' },
  ],
  2: [
    { id: 'mat-2-1', name: '2级百炼钢', iconChar: '攻', attr: 'attack', description: '千锤百炼的钢材，攻击系材料。' },
    { id: 'mat-2-9', name: '2级厚土岩', iconChar: '防', attr: 'defense', description: '厚土之精凝聚，防御系进阶材料。' },
    { id: 'mat-2-10', name: '2级疾风翎', iconChar: '速', attr: 'speed', description: '高阶风系魂兽尾翎，速度系进阶。' },
    { id: 'mat-2-11', name: '2级静心莲', iconChar: '精', attr: 'spirit', description: '静心凝神的莲花，精神系进阶。' },
    { id: 'mat-2-2', name: '2级锋锐晶', iconChar: '暴', attr: 'critRate', description: '锋锐之气四溢，暴击率提升明显。' },
    { id: 'mat-2-3', name: '2级爆裂晶', iconChar: '伤', attr: 'critDmg', description: '高爆烈性晶体，暴击伤害显著。' },
    { id: 'mat-2-4', name: '2级万象晶', iconChar: '全', attr: 'allAttr', description: '万象合一之晶，全属性均衡进阶。' },
    { id: 'mat-2-5', name: '2级聚灵晶', iconChar: '魂', attr: 'soulPower', description: '聚灵凝晶，魂力增幅更上一层。' },
    { id: 'mat-2-6', name: '2级生命晶', iconChar: '血', attr: 'hp', description: '生命力凝练的晶体，气血旺盛。' },
    { id: 'mat-2-7', name: '2级魂导核心', iconChar: '核', attr: 'core', description: '二级魂导核心，承载更强魂力。' },
    { id: 'mat-2-8', name: '2级银晶', iconChar: '通', attr: 'universal', description: '银白色晶体，通用性强的进阶材料。' },
  ],
  3: [
    { id: 'mat-3-1', name: '3级千年寒铁', iconChar: '攻', attr: 'attack', description: '千年寒冰中孕育的寒铁，锋利无比。' },
    { id: 'mat-3-9', name: '3级玄武甲片', iconChar: '防', attr: 'defense', description: '千年玄武蜕甲，防御坚不可摧。' },
    { id: 'mat-3-10', name: '3级雷翼羽', iconChar: '速', attr: 'speed', description: '雷电系魂兽羽翼，速度迅捷如电。' },
    { id: 'mat-3-11', name: '3级紫芝', iconChar: '精', attr: 'spirit', description: '千年紫色灵芝，精神力滋养。' },
    { id: 'mat-3-2', name: '3级破甲晶', iconChar: '暴', attr: 'critRate', description: '破甲之力凝结，暴击率大幅提升。' },
    { id: 'mat-3-3', name: '3级爆炎晶', iconChar: '伤', attr: 'critDmg', description: '爆炎之精，暴击伤害恐怖。' },
    { id: 'mat-3-4', name: '3级三才石', iconChar: '全', attr: 'allAttr', description: '天地人三才之精，全属性强化。' },
    { id: 'mat-3-5', name: '3级魂玉', iconChar: '魂', attr: 'soulPower', description: '千年灵玉所化，魂力滋养深厚。' },
    { id: 'mat-3-6', name: '3级龙血石', iconChar: '血', attr: 'hp', description: '蕴含龙之精血，气血如龙。' },
    { id: 'mat-3-7', name: '3级魂导核心', iconChar: '核', attr: 'core', description: '三级魂导核心，千年魂力凝聚。' },
    { id: 'mat-3-8', name: '3级紫金晶', iconChar: '通', attr: 'universal', description: '紫色光泽的紫金晶，高阶通用材料。' },
  ],
  4: [
    { id: 'mat-4-1', name: '4级玄铁精', iconChar: '攻', attr: 'attack', description: '万年玄铁精粹，攻击威能极强。' },
    { id: 'mat-4-9', name: '4级玄龟甲', iconChar: '防', attr: 'defense', description: '万年玄龟背甲，防御如铜墙铁壁。' },
    { id: 'mat-4-10', name: '4级疾风翼', iconChar: '速', attr: 'speed', description: '万年风系魂兽之翼，速度快如闪电。' },
    { id: 'mat-4-11', name: '4级凝神玉', iconChar: '精', attr: 'spirit', description: '万年凝神玉，精神力浩瀚如海。' },
    { id: 'mat-4-2', name: '4级弑神剑英', iconChar: '暴', attr: 'critRate', description: '弑神之剑所化剑英，暴击绝伦。' },
    { id: 'mat-4-3', name: '4级灭世雷晶', iconChar: '伤', attr: 'critDmg', description: '灭世雷霆结晶，暴伤毁天灭地。' },
    { id: 'mat-4-4', name: '4级四象灵玉', iconChar: '全', attr: 'allAttr', description: '青龙白虎朱雀玄武四象之灵，全属性飞跃。' },
    { id: 'mat-4-5', name: '4级神魂珠', iconChar: '魂', attr: 'soulPower', description: '神魂之力凝结的灵珠，魂力浩瀚。' },
    { id: 'mat-4-6', name: '4级凤凰血玉', iconChar: '血', attr: 'hp', description: '凤凰精血所化玉，气血涅槃重生。' },
    { id: 'mat-4-7', name: '4级魂导核心', iconChar: '核', attr: 'core', description: '四级魂导核心，万年级别能量承载。' },
    { id: 'mat-4-8', name: '4级混沌之石', iconChar: '通', attr: 'universal', description: '混沌初开之石，万能通用材料。' },
  ],
  5: [
    { id: 'mat-5-1', name: '5级陨星寒铁', iconChar: '攻', attr: 'attack', description: '从天而降的陨铁，蕴含星辰攻击之力。' },
    { id: 'mat-5-9', name: '5级星辰盾晶', iconChar: '防', attr: 'defense', description: '星辰陨铁凝盾，防御固若金汤。' },
    { id: 'mat-5-10', name: '5级流光飞羽', iconChar: '速', attr: 'speed', description: '十万年飞羽，速度流光溢彩。' },
    { id: 'mat-5-11', name: '5级识神晶', iconChar: '精', attr: 'spirit', description: '识海之神结晶，精神力通神。' },
    { id: 'mat-5-2', name: '5级天命杀晶', iconChar: '暴', attr: 'critRate', description: '天命所归的杀伐之晶，暴击无双。' },
    { id: 'mat-5-3', name: '5级末日爆核', iconChar: '伤', attr: 'critDmg', description: '末日爆裂核心，暴击伤害惊天。' },
    { id: 'mat-5-4', name: '5级五行之精', iconChar: '全', attr: 'allAttr', description: '金木水火土五行精华，全属性大成。' },
    { id: 'mat-5-5', name: '5级紫神之玉', iconChar: '魂', attr: 'soulPower', description: '紫色神光环绕的神玉，魂力顶级。' },
    { id: 'mat-5-6', name: '5级十万年兽丹', iconChar: '血', attr: 'hp', description: '十万年魂兽内丹，气血如海。' },
    { id: 'mat-5-7', name: '5级魂导核心', iconChar: '核', attr: 'core', description: '五级魂导核心，承载十万年级魂力。' },
    { id: 'mat-5-8', name: '5级龙鳞金', iconChar: '通', attr: 'universal', description: '巨龙鳞片所化的神金，顶级通用材。' },
  ],
  6: [
    { id: 'mat-6-1', name: '6级太阳神金', iconChar: '攻', attr: 'attack', description: '蕴含太阳真火的神金，攻击力恐怖。' },
    { id: 'mat-6-9', name: '6级大地之心', iconChar: '防', attr: 'defense', description: '大地本源之力，防御可挡神击。' },
    { id: 'mat-6-10', name: '6级空间之晶', iconChar: '速', attr: 'speed', description: '空间法则结晶，速度瞬移万里。' },
    { id: 'mat-6-11', name: '6级元神晶', iconChar: '精', attr: 'spirit', description: '元神凝晶，精神力可照乾坤。' },
    { id: 'mat-6-2', name: '6级诛仙剑气', iconChar: '暴', attr: 'critRate', description: '诛仙四剑一缕剑气，暴击破万法。' },
    { id: 'mat-6-3', name: '6级毁天灭地晶', iconChar: '伤', attr: 'critDmg', description: '毁天灭地之能所化，暴伤无匹。' },
    { id: 'mat-6-4', name: '6级天地之心', iconChar: '全', attr: 'allAttr', description: '天地本源之心，全属性至强。' },
    { id: 'mat-6-5', name: '6级神识之晶', iconChar: '魂', attr: 'soulPower', description: '神识凝聚成晶，魂力境界突破。' },
    { id: 'mat-6-6', name: '6级凶兽精血', iconChar: '血', attr: 'hp', description: '十大凶兽本命精血，气血滔天。' },
    { id: 'mat-6-7', name: '6级魂导核心', iconChar: '核', attr: 'core', description: '六级魂导核心，神级以下最强。' },
    { id: 'mat-6-8', name: '6级太阴玄冰', iconChar: '通', attr: 'universal', description: '太阴之力凝结的玄冰，神级通用材。' },
  ],
  7: [
    { id: 'mat-7-1', name: '7级天帝之刃', iconChar: '攻', attr: 'attack', description: '天帝佩剑碎片，蕴含无上攻击力。' },
    { id: 'mat-7-9', name: '7级太古玄盾', iconChar: '防', attr: 'defense', description: '太古神盾碎片，防御万法不侵。' },
    { id: 'mat-7-10', name: '7级时空结晶', iconChar: '速', attr: 'speed', description: '时空法则凝聚，速度超越时光。' },
    { id: 'mat-7-11', name: '7级道心神晶', iconChar: '精', attr: 'spirit', description: '道心凝化神晶，精神力近道。' },
    { id: 'mat-7-2', name: '7级命运之眼', iconChar: '暴', attr: 'critRate', description: '命运之眼所化，看穿一切破绽。' },
    { id: 'mat-7-3', name: '7级诸神黄昏', iconChar: '伤', attr: 'critDmg', description: '诸神黄昏之力，暴击毁灭众神。' },
    { id: 'mat-7-4', name: '7级轮回之眼', iconChar: '全', attr: 'allAttr', description: '轮回之力化身，全属性无上。' },
    { id: 'mat-7-5', name: '7级鸿蒙之灵', iconChar: '魂', attr: 'soulPower', description: '鸿蒙初开灵物，精神力无上。' },
    { id: 'mat-7-6', name: '7级不死凤血', iconChar: '血', attr: 'hp', description: '不死凤凰真血，气血再生无穷。' },
    { id: 'mat-7-7', name: '7级魂导核心', iconChar: '核', attr: 'core', description: '七级魂导核心，半神级威能。' },
    { id: 'mat-7-8', name: '7级不灭金身', iconChar: '通', attr: 'universal', description: '不灭金身铸造材料，近乎无敌。' },
  ],
  8: [
    { id: 'mat-8-1', name: '8级创世神锋', iconChar: '攻', attr: 'attack', description: '创世神器的锋刃碎片，攻击冠绝天下。' },
    { id: 'mat-8-9', name: '8级玄黄母气', iconChar: '防', attr: 'defense', description: '天地玄黄母气，防御承载万物。' },
    { id: 'mat-8-10', name: '8级极速神光', iconChar: '速', attr: 'speed', description: '极速法则神光，速度跨越宇宙。' },
    { id: 'mat-8-11', name: '8级无上道心', iconChar: '精', attr: 'spirit', description: '无上道心结晶，精神力冠绝古今。' },
    { id: 'mat-8-2', name: '8级天机神算', iconChar: '暴', attr: 'critRate', description: '洞悉天机的神算之晶，必中要害。' },
    { id: 'mat-8-3', name: '8级开天斧意', iconChar: '伤', attr: 'critDmg', description: '开天辟地的斧意，暴伤可开天。' },
    { id: 'mat-8-4', name: '8级阴阳鱼', iconChar: '全', attr: 'allAttr', description: '太极阴阳二鱼，五行万物之母。' },
    { id: 'mat-8-5', name: '8级太上道魂', iconChar: '魂', attr: 'soulPower', description: '太上道祖一缕神魂，精神力通天。' },
    { id: 'mat-8-6', name: '8级创世青莲', iconChar: '血', attr: 'hp', description: '创世青莲莲子，气血与天地同寿。' },
    { id: 'mat-8-7', name: '8级魂导核心', iconChar: '核', attr: 'core', description: '八级魂导核心，准神级威能。' },
    { id: 'mat-8-8', name: '8级混沌钟壁', iconChar: '通', attr: 'universal', description: '混沌钟钟壁碎片，万法不侵。' },
  ],
  9: [
    { id: 'mat-9-1', name: '9级神王之骨', iconChar: '攻', attr: 'attack', description: '神王陨落留下的神骨，蕴含无上攻击神力。' },
    { id: 'mat-9-9', name: '9级永恒之盾', iconChar: '防', attr: 'defense', description: '永恒神王之盾，防御无物可破。' },
    { id: 'mat-9-10', name: '9级神速之靴', iconChar: '速', attr: 'speed', description: '神速法则本源，速度凌驾时光。' },
    { id: 'mat-9-11', name: '9级神识海洋', iconChar: '精', attr: 'spirit', description: '神明级神识之海，精神力浩瀚无垠。' },
    { id: 'mat-9-2', name: '9级审判之眼', iconChar: '暴', attr: 'critRate', description: '神界审判之眼，洞察一切弱点。' },
    { id: 'mat-9-3', name: '9级寂灭神雷', iconChar: '伤', attr: 'critDmg', description: '寂灭之雷，暴击可灭诸神。' },
    { id: 'mat-9-4', name: '9级神界之心', iconChar: '全', attr: 'allAttr', description: '神界核心本源，九维至强。' },
    { id: 'mat-9-5', name: '9级创世神魂', iconChar: '魂', attr: 'soulPower', description: '创世神本源神魂，魂力超越神明。' },
    { id: 'mat-9-6', name: '9级生命源晶', iconChar: '血', attr: 'hp', description: '生命之神本源结晶，气血无尽。' },
    { id: 'mat-9-7', name: '9级魂导核心', iconChar: '核', attr: 'core', description: '九级魂导核心，神级魂力承载。' },
    { id: 'mat-9-8', name: '9级创世神甲', iconChar: '通', attr: 'universal', description: '创世神铠甲碎片，防御无可匹敌。' },
  ],
};

export const MATERIAL_ITEMS: IItem[] = [];

// 生成全部 9 级材料（默认普通品阶，品阶由 rollMaterialWithQuality 决定）
for (let tier = 1; tier <= 9; tier++) {
  const defs = MATERIAL_DEFS_BY_TIER[tier];
  const q = MATERIAL_QUALITY_BY_TIER[tier];
  const bonus = MATERIAL_BONUS_BY_TIER[tier];
  for (const def of defs) {
    MATERIAL_ITEMS.push({
      id: def.id,
      name: def.name,
      type: 'material',
      quality: q.quality,
      qualityColor: q.color,
      iconChar: def.iconChar,
      description: def.description,
      materialTier: tier,
      materialAttr: def.attr,
      materialBonus: bonus,
      materialQuality: 'common',
      sellPrice: Math.round(bonus * 2),
    });
  }
}

// 按等级获取材料列表
export function getMaterialsByTier(tier: number): IItem[] {
  return MATERIAL_ITEMS.filter((m) => m.materialTier === tier);
}

// 根据等级和品阶随机抽取材料（用于山脉副本掉落）
export function rollMaterialByTier(tier: number, count = 3): IItem[] {
  const pool = getMaterialsByTier(tier);
  const result: IItem[] = [];
  // 高等级副本稀有材料概率更高：每级+2%稀有，上限40%
  const rareBonus = Math.min(0.15, (tier - 1) * 0.02);
  const commonChance = Math.max(0.25, MATERIAL_QUALITY_INFO.common.chance - rareBonus * 0.6);
  const fineChance = Math.max(0.3, MATERIAL_QUALITY_INFO.fine.chance - rareBonus * 0.4);
  const rareChance = MATERIAL_QUALITY_INFO.rare.chance + rareBonus;
  for (let i = 0; i < count; i++) {
    const r = Math.random();
    let quality: MaterialQuality = 'common';
    if (r < commonChance) quality = 'common';
    else if (r < commonChance + fineChance) quality = 'fine';
    else quality = 'rare';
    const qPool = pool.filter(m => m.materialQuality === quality);
    const choosePool = qPool.length > 0 ? qPool : pool;
    const idx = Math.floor(Math.random() * choosePool.length);
    result.push({ ...choosePool[idx] });
  }
  return result;
}

 // 按品阶概率掉落材料（普通60%、精良30%、稀有10%）
// 优先按 matId 精确查找（如 'mat-1-1'），其次按 name 模糊匹配，最后随机
export function rollMaterialWithQuality(tier: number, quality: MaterialQuality, nameOrId?: string): IItem {
  const pool = getMaterialsByTier(tier);
  let base: IItem | undefined;
  if (nameOrId) {
    // 先按 ID 精确匹配（副本 matId 格式如 'mat-1-1'，与材料 ID 一致）
    base = pool.find(m => m.id === nameOrId);
    // 再按名称精确匹配
    if (!base) base = pool.find(m => m.name === nameOrId);
  }
  if (!base) base = pool[Math.floor(Math.random() * pool.length)];
  const info = MATERIAL_QUALITY_INFO[quality];
  const baseBonus = MATERIAL_BONUS_BY_TIER[tier] ?? 10;
  return {
    ...base,
    id: `${base.id}-${quality}-${Math.random().toString(36).slice(2, 6)}`,
    materialQuality: quality,
    materialBonus: Math.round(baseBonus * info.bonusMult),
    qualityColor: info.color,
    description: `${info.label}品质 · ${base.description}`,
    sellPrice: Math.round(baseBonus * 2 * info.bonusMult),
  };
}

// v2.0 自制魂导器每级固定数值（所有人做出的同等级魂导器数值完全一样）
// 9级所有属性最高不超过200万（攻击为200万）
export interface CraftFixedStats {
  attack: number;
  defense: number;
  speed: number;
  spirit: number;
  hp: number;
  critRate: number;   // 百分比值，如 5 表示 +5%
  critDmg: number;    // 百分比值
  allAttr: number;    // 百分比值
  soulPower: number;  // 固定数值
}

export const FIXED_ATTR_KEYS: Array<{ key: keyof CraftFixedStats; label: string; isPercent: boolean }> = [
  { key: 'attack', label: '攻击', isPercent: false },
  { key: 'defense', label: '防御', isPercent: false },
  { key: 'speed', label: '速度', isPercent: false },
  { key: 'spirit', label: '精神', isPercent: false },
  { key: 'hp', label: '气血', isPercent: false },
  { key: 'critRate', label: '暴击率', isPercent: true },
  { key: 'critDmg', label: '爆伤', isPercent: true },
  { key: 'allAttr', label: '全属性', isPercent: true },
  { key: 'soulPower', label: '魂力', isPercent: false },
];

export const CRAFT_FIXED_STATS: Record<number, CraftFixedStats> = {
  // v8.0 重新平衡：数值大幅压缩，等级越高数值越高但不过分
  // v19.0 小幅度提升：低阶+10%/中阶+15%/高阶+20%
  // v21.0 大幅提升：整体×2.5，确保高等级魂导器价值感强烈
  // 特色：每个等级都带少量暴击率、暴击伤害、全属性百分比、魂力加成
  1: { attack: 82,      defense: 55,     speed: 42,     spirit: 60,     hp: 410,       critRate: 1.1,  critDmg: 2.7, allAttr: 0.55, soulPower: 3 },
  2: { attack: 220,     defense: 143,    speed: 110,    spirit: 165,    hp: 1100,      critRate: 1.7,  critDmg: 4.2, allAttr: 1.1,  soulPower: 5 },
  3: { attack: 550,     defense: 330,    speed: 275,    spirit: 413,    hp: 2750,      critRate: 2.7,  critDmg: 5.5, allAttr: 1.65, soulPower: 10 },
  4: { attack: 1380,    defense: 828,    speed: 690,    spirit: 1035,   hp: 6900,      critRate: 3.4,  critDmg: 8.7, allAttr: 2.3,  soulPower: 18 },
  5: { attack: 3160,    defense: 1898,   speed: 1583,   spirit: 2373,   hp: 15810,     critRate: 4.6,  critDmg: 11.5, allAttr: 3.45, soulPower: 25 },
  6: { attack: 6900,    defense: 4140,   speed: 3450,   spirit: 5175,   hp: 34500,     critRate: 5.7,  critDmg: 14.5, allAttr: 4.6,  soulPower: 35 },
  7: { attack: 14400,   defense: 8640,   speed: 7200,   spirit: 10800,  hp: 72000,     critRate: 7.5,  critDmg: 18,   allAttr: 6,    soulPower: 48 },
  8: { attack: 26400,   defense: 15840,  speed: 13200,  spirit: 19800,  hp: 132000,    critRate: 9,    critDmg: 21,   allAttr: 7.5,  soulPower: 65 },
  9: { attack: 45000,   defense: 27000,  speed: 22500,  spirit: 33750,  hp: 225000,    critRate: 12,   critDmg: 27,   allAttr: 9,    soulPower: 90 },
};

// 旧版百分比上限（v2.0 已废弃，保留用于旧存档兼容）
// 单属性百分比上限
export const CRAFT_ATTR_CAP_PER_LEVEL: Record<number, number> = {
  1: 5, 2: 15, 3: 20, 4: 30, 5: 40, 6: 50, 7: 60, 8: 70, 9: 80,
};

// 魂导核心宝石定义
interface CoreGem {
  id: string;
  name: string;
  color: string;
  glowColor: string;
  effect: string;
  effectDesc: string;
  // 对应到 IItem.specialEffect 字段的标识
  effectKey: 'skillDmg' | 'basicDmg' | 'hpRegen' | 'spiritBonus' | 'critRate' | 'speedBonus';
}

export const CORE_GEMS: CoreGem[] = [
  { id: 'red', name: '红宝石', color: '#ef4444', glowColor: '#ef444480', effect: '魂技伤害增强', effectDesc: '魂技伤害 +10%', effectKey: 'skillDmg' },
  { id: 'blue', name: '蓝宝石', color: '#3b82f6', glowColor: '#3b82f680', effect: '普攻伤害增强', effectDesc: '普攻伤害 +10%', effectKey: 'basicDmg' },
  { id: 'green', name: '绿宝石', color: '#22c55e', glowColor: '#22c55e80', effect: '气血恢复增强', effectDesc: '战斗后回血 +5%', effectKey: 'hpRegen' },
  { id: 'purple', name: '紫宝石', color: '#a855f7', glowColor: '#a855f780', effect: '精神力增强', effectDesc: '精神属性额外 +5%', effectKey: 'spiritBonus' },
  { id: 'gold', name: '金宝石', color: '#fbbf24', glowColor: '#fbbf2480', effect: '暴击率增强', effectDesc: '暴击率 +5%', effectKey: 'critRate' },
  { id: 'cyan', name: '青宝石', color: '#06b6d4', glowColor: '#06b6d480', effect: '速度增强', effectDesc: '速度额外 +5%', effectKey: 'speedBonus' },
];

// 自制魂导器每级属性总和上限（超过则按比例归一化，避免多个属性全部接近上限）
export const CRAFT_TOTAL_ATTR_CAP: Record<number, number> = {
  1: 15, 2: 30, 3: 45, 4: 60, 5: 80, 6: 100, 7: 120, 8: 140, 9: 160,
};

// 自制魂导器每级所需最低材料数量
export const CRAFT_MATERIAL_REQ: Record<number, number> = {
  1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8, 7: 9, 8: 10, 9: 12,
};

// 初始 mock 物品（背包示例） - 去掉恢复香肠，保留几个示例魂导器和魂骨
export const MOCK_ITEMS: IItem[] = [
  // 给新玩家一把初始一级近战魂导器作为示例（实际新角色背包为空，这里仅留作参考数据）
  SOUL_GUIDE_ITEMS.find(i => i.id === 'sg-m1-1')!,
];

// 将年限数字格式化为中文描述（如 五千年 / 一万二千年 / 十万年 / 二十万年）
export function formatYearsLabel(years: number): string {
  if (years < 100) return `${years}年`;
  if (years < 1000) {
    const h = Math.floor(years / 100);
    const rest = years % 100;
    if (rest === 0) return `${h}百年`;
    return `${years}年`;
  }
  if (years < 10000) {
    const q = Math.floor(years / 1000);
    const rest = Math.floor((years % 1000) / 100);
    if (rest === 0) return `${q}千年`;
    return `${q}千${rest}百年`;
  }
  const wan = Math.floor(years / 10000);
  const restWan = Math.floor((years % 10000) / 1000);
  if (wan < 10) {
    if (restWan === 0) return `${wan}万年`;
    return `${wan}万${restWan}千年`;
  }
  // 十万年及以上
  if (wan < 10000) {
    return `${wan}万年`;
  }
  return `${Math.floor(wan / 10000)}亿年`;
}

// ================================
// 消耗品：灵草 / 仙草 / 特殊物品
// ================================

/** 灵草/仙草的额外属性（挂在 IItem 上用 effect 字段存 json 字符串不太友好，这里单独建表） */
export interface ConsumableExtra {
  /** 子类型：element-spirit 元素灵草 / attribute-spirit 属性灵草 / immortal 仙草 / water-of-life 生命之水 / polar-ice-jade 极寒冰玉 / ice-fire-immortal 冰火两仪眼仙品仙草 / holy-grass 普通灵草（冰火两仪眼掉落） */
  subType: 'element-spirit' | 'attribute-spirit' | 'immortal' | 'water-of-life' | 'polar-ice-jade' | 'ice-fire-immortal' | 'holy-grass' | 'sacred-dragon';
  /** 适用的元素属性（元素灵草/仙草/极寒冰玉用）；空数组表示无属性限制 */
  elementReq: string[]; // 如 ['冰属性', '水属性']
  /** 加成的属性（属性灵草用，随机选一个） */
  randomAttrs?: Array<'attack' | 'defense' | 'speed' | 'spirit' | 'hp'>;
  /** 百分比属性加成（仙草/生命之水/极寒冰玉用，百分比值，如 10 表示 +10%） */
  attrBonus?: {
    attack?: number;
    defense?: number;
    speed?: number;
    spirit?: number;
    hp?: number;
    allAttr?: number; // 全属性百分比
  };
  /** 固定数值加成（灵草/仙草用，直接加到属性上） */
  fixedBonus?: {
    attack?: number;
    defense?: number;
    speed?: number;
    spirit?: number;
    hp?: number;
    allAttr?: number; // 全属性固定值
  };
  /** 服用上限 */
  cap: number; // 如 5=最多5株，1=仅1次
  /** cap 对应的 key（用来在 player.consumableCounts 里计数） */
  capKey: string;
  /** 描述（服用效果说明） */
  effectDesc: string;
  /** 按修炼方向加成的固定值（仙草「增加对应武魂修炼方向X数值」用） */
  cultivationBonus?: number;
  /** 特殊效果枚举：武魂进化等，服用后由 gameStore 特殊处理 */
  specialEffect?: 'evolve-ice' | 'evolve-fire' | 'evolve-tulip' | 'all-attr-pct' | 'evolve-shenglong';
}

// 灵草列表（元素灵草 + 属性灵草）
export const SPIRIT_GRASSES: IItem[] = [
  // --- 元素灵草 ---
  {
    id: 'spirit-grass-ice',
    name: '冰灵草',
    type: 'consumable',
    quality: 'fine',
    qualityColor: '#60a5fa',
    iconChar: '冰',
    description: '蕴含冰元素之力的灵草，服用后可提升冰属性修炼效果。',
    effect: 'element-spirit:冰属性:attack+100030,spirit+100020',
    sellPrice: 500,
    quantity: 1,
  },
  {
    id: 'spirit-grass-fire',
    name: '火灵草',
    type: 'consumable',
    quality: 'fine',
    qualityColor: '#f97316',
    iconChar: '火',
    description: '蕴含火元素之力的灵草，服用后可提升火属性修炼效果。',
    effect: 'element-spirit:火属性:attack+100030,spirit+100020',
    sellPrice: 500,
    quantity: 1,
  },
  {
    id: 'spirit-grass-dark',
    name: '暗灵草',
    type: 'consumable',
    quality: 'fine',
    qualityColor: '#7c3aed',
    iconChar: '暗',
    description: '蕴含黑暗之力的灵草，服用后可提升暗属性修炼效果。',
    effect: 'element-spirit:暗属性:attack+100030,spirit+100020',
    sellPrice: 500,
    quantity: 1,
  },
  {
    id: 'spirit-grass-spirit',
    name: '精神灵草',
    type: 'consumable',
    quality: 'fine',
    qualityColor: '#22d3ee',
    iconChar: '精',
    description: '蕴含精神之力的灵草，服用后可提升精神属性修炼效果。',
    effect: 'element-spirit:精神属性:attack+100030,spirit+100020',
    sellPrice: 500,
    quantity: 1,
  },
  {
    id: 'spirit-grass-poison',
    name: '毒灵草',
    type: 'consumable',
    quality: 'fine',
    qualityColor: '#84cc16',
    iconChar: '毒',
    description: '蕴含剧毒之力的灵草，服用后可提升毒属性修炼效果。',
    effect: 'element-spirit:毒属性:attack+100030,spirit+100020',
    sellPrice: 500,
    quantity: 1,
  },
  {
    id: 'spirit-grass-strength',
    name: '力灵草',
    type: 'consumable',
    quality: 'fine',
    qualityColor: '#f59e0b',
    iconChar: '力',
    description: '蕴含力量之气的灵草，服用后可提升力量属性修炼效果。',
    effect: 'element-spirit:力量属性:attack+100030,spirit+100020',
    sellPrice: 500,
    quantity: 1,
  },
  {
    id: 'spirit-grass-water',
    name: '水灵草',
    type: 'consumable',
    quality: 'fine',
    qualityColor: '#38bdf8',
    iconChar: '水',
    description: '蕴含水元素之力的灵草，服用后可提升水属性修炼效果。',
    effect: 'element-spirit:水属性:attack+100030,spirit+100020',
    sellPrice: 500,
    quantity: 1,
  },
  {
    id: 'spirit-grass-thunder',
    name: '雷灵草',
    type: 'consumable',
    quality: 'fine',
    qualityColor: '#a3e635',
    iconChar: '雷',
    description: '蕴含雷霆之力的灵草，服用后可提升雷属性修炼效果。',
    effect: 'element-spirit:雷属性:attack+100030,spirit+100020',
    sellPrice: 500,
    quantity: 1,
  },
  {
    id: 'spirit-grass-life',
    name: '生灵草',
    type: 'consumable',
    quality: 'fine',
    qualityColor: '#4ade80',
    iconChar: '生',
    description: '蕴含生命之力的灵草，服用后可提升生命属性修炼效果。',
    effect: 'element-spirit:生命属性:attack+100030,spirit+100020',
    sellPrice: 500,
    quantity: 1,
  },
  {
    id: 'spirit-grass-metal',
    name: '金灵草',
    type: 'consumable',
    quality: 'fine',
    qualityColor: '#fbbf24',
    iconChar: '金',
    description: '蕴含金元素之力的灵草，服用后可提升金属性修炼效果。',
    effect: 'element-spirit:金属性:attack+100035,defense+100015',
    sellPrice: 500,
    quantity: 1,
  },
  {
    id: 'spirit-grass-wood',
    name: '木灵草',
    type: 'consumable',
    quality: 'fine',
    qualityColor: '#22c55e',
    iconChar: '木',
    description: '蕴含木元素之力的灵草，服用后可提升木属性修炼效果。',
    effect: 'element-spirit:木属性:defense+100030,hp+100050',
    sellPrice: 500,
    quantity: 1,
  },
  {
    id: 'spirit-grass-earth',
    name: '土灵草',
    type: 'consumable',
    quality: 'fine',
    qualityColor: '#a16207',
    iconChar: '土',
    description: '蕴含土元素之力的灵草，服用后可提升土属性修炼效果。',
    effect: 'element-spirit:土属性:defense+100035,hp+100025',
    sellPrice: 500,
    quantity: 1,
  },
  {
    id: 'spirit-grass-light',
    name: '光灵草',
    type: 'consumable',
    quality: 'fine',
    qualityColor: '#fde047',
    iconChar: '光',
    description: '蕴含光明之力的灵草，服用后可提升光属性修炼效果。',
    effect: 'element-spirit:光属性:spirit+100030,attack+100020',
    sellPrice: 500,
    quantity: 1,
  },
  {
    id: 'spirit-grass-space',
    name: '空灵草',
    type: 'consumable',
    quality: 'fine',
    qualityColor: '#06b6d4',
    iconChar: '空',
    description: '蕴含空间之力的灵草，服用后可提升空间属性修炼效果。',
    effect: 'element-spirit:空间属性:speed+100035,spirit+100025',
    sellPrice: 500,
    quantity: 1,
  },
  {
    id: 'spirit-grass-time',
    name: '时灵草',
    type: 'consumable',
    quality: 'fine',
    qualityColor: '#f472b6',
    iconChar: '时',
    description: '蕴含时间之力的灵草，服用后可提升时间属性修炼效果。',
    effect: 'element-spirit:时间属性:spirit+100035,speed+100020',
    sellPrice: 500,
    quantity: 1,
  },
  // --- 属性灵草（随机加一种个体属性，不超过3%） ---
  {
    id: 'attribute-grass-attack',
    name: '攻灵草',
    type: 'consumable',
    quality: 'rare',
    qualityColor: '#ef4444',
    iconChar: '攻',
    description: '提升攻击的属性灵草，服用后随机增加攻击属性。',
    effect: 'attribute-spirit:attack:100050',
    sellPrice: 800,
    quantity: 1,
  },
  {
    id: 'attribute-grass-defense',
    name: '防灵草',
    type: 'consumable',
    quality: 'rare',
    qualityColor: '#3b82f6',
    iconChar: '防',
    description: '提升防御的属性灵草，服用后随机增加防御属性。',
    effect: 'attribute-spirit:defense:100050',
    sellPrice: 800,
    quantity: 1,
  },
  {
    id: 'attribute-grass-speed',
    name: '速灵草',
    type: 'consumable',
    quality: 'rare',
    qualityColor: '#22c55e',
    iconChar: '速',
    description: '提升速度的属性灵草，服用后随机增加速度属性。',
    effect: 'attribute-spirit:speed:100050',
    sellPrice: 800,
    quantity: 1,
  },
  {
    id: 'attribute-grass-spirit',
    name: '念灵草',
    type: 'consumable',
    quality: 'rare',
    qualityColor: '#06b6d4',
    iconChar: '念',
    description: '提升精神的属性灵草，服用后随机增加精神属性。',
    effect: 'attribute-spirit:spirit:100050',
    sellPrice: 800,
    quantity: 1,
  },
  {
    id: 'attribute-grass-hp',
    name: '气血草',
    type: 'consumable',
    quality: 'rare',
    qualityColor: '#f43f5e',
    iconChar: '气',
    description: '提升气血的属性灵草，服用后随机增加气血上限。',
    effect: 'attribute-spirit:hp:100500',
    sellPrice: 800,
    quantity: 1,
  },
];

// 仙草列表（原著所有仙草，均为百分比加成，上限3株）
export const IMMORTAL_GRASSES: IItem[] = [
  {
    id: 'immortal-ba-jiao-xuan-bing-cao',
    name: '八角玄冰草',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#a855f7',
    iconChar: '冰',
    description: '性寒至极的仙草，八角叶片晶莹剔透，蕴含极致冰属性之力。',
    effect: 'immortal:冰属性:attackPct+8%,speedPct+5%',
    sellPrice: 50000,
    quantity: 1,
  },
  {
    id: 'immortal-lie-huo-xing-jiao-shu',
    name: '烈火杏娇疏',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#ef4444',
    iconChar: '火',
    description: '性烈如火的仙草，花瓣如烈焰燃烧，蕴含极致火属性之力。',
    effect: 'immortal:火属性:attackPct+12%',
    sellPrice: 50000,
    quantity: 1,
  },
  {
    id: 'immortal-wang-chuan-qiu-shui-lu',
    name: '望穿秋水露',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#06b6d4',
    iconChar: '秋',
    description: '提升精神力的仙草，服之可明目静心，精神力大增。',
    effect: 'immortal:精神属性:spiritPct+15%',
    sellPrice: 50000,
    quantity: 1,
  },
  {
    id: 'immortal-ji-guan-feng-huang-kui',
    name: '鸡冠凤凰葵',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#f97316',
    iconChar: '凤',
    description: '形如鸡冠的火属性仙草，有凤舞九天之姿。',
    effect: 'immortal:火属性:attackPct+7%,speedPct+6%',
    sellPrice: 50000,
    quantity: 1,
  },
  {
    id: 'immortal-qi-luo-yu-jin-xiang',
    name: '绮罗郁金香',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#ec4899',
    iconChar: '郁',
    description: '辅助系仙草之王，通体金紫，能提升全属性修炼速度。',
    effect: 'immortal:辅助属性:allAttrPct+8%',
    sellPrice: 60000,
    quantity: 1,
  },
  {
    id: 'immortal-xiang-si-duan-chang-hong',
    name: '相思断肠红',
    type: 'consumable',
    quality: 'legendary',
    qualityColor: '#f59e0b',
    iconChar: '红',
    description: '至情至性之仙草，血色花瓣如泣如诉，乃仙草中最为神奇者。',
    effect: 'immortal:气血/全属性:hpPct+20%,allAttrPct+5%',
    sellPrice: 100000,
    quantity: 1,
  },
  {
    id: 'immortal-shui-xian-yu-ji-gu',
    name: '水仙玉肌骨',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#22d3ee',
    iconChar: '仙',
    description: '形如水仙的防御仙草，服之可令筋骨如玉，防御力大增。',
    effect: 'immortal:防御属性:defensePct+15%',
    sellPrice: 50000,
    quantity: 1,
  },
  {
    id: 'immortal-qi-rong-tong-tian-ju',
    name: '奇茸通天菊',
    type: 'consumable',
    quality: 'legendary',
    qualityColor: '#f59e0b',
    iconChar: '菊',
    description: '金刚不坏之仙草，通体金黄，有通天彻地之能，全属性提升。',
    effect: 'immortal:全属性:allAttrPct+12%',
    sellPrice: 80000,
    quantity: 1,
  },
  {
    id: 'immortal-ba-ban-xian-lan',
    name: '八瓣仙兰',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#a855f7',
    iconChar: '兰',
    description: '八瓣绽放的速度仙草，清香四溢，身轻如燕。',
    effect: 'immortal:速度属性:speedPct+15%',
    sellPrice: 50000,
    quantity: 1,
  },
  {
    id: 'immortal-xue-se-tian-e-wen',
    name: '雪色天鹅吻',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#84cc16',
    iconChar: '鹅',
    description: '剧毒仙草，雪色花瓣天鹅之形，毒中之王。',
    effect: 'immortal:毒/暗属性:attackPct+8%,spiritPct+7%',
    sellPrice: 50000,
    quantity: 1,
  },
  {
    id: 'immortal-long-zhi-ye',
    name: '龙芝叶',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#22c55e',
    iconChar: '龙',
    description: '形如龙吟的力量仙草，有龙之气息，力大无穷。',
    effect: 'immortal:力量属性:attackPct+10%,defensePct+5%',
    sellPrice: 50000,
    quantity: 1,
  },
  {
    id: 'immortal-huang-jing-yang-zhi',
    name: '黄泉露',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#7c3aed',
    iconChar: '黄',
    description: '来自黄泉的剧毒灵露，饮之可增暗毒之力。',
    effect: 'immortal:暗属性:attackPct+7%,spiritPct+9%',
    sellPrice: 50000,
    quantity: 1,
  },
  {
    id: 'immortal-jin-gang-bu-huai',
    name: '金刚不坏莲',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#fbbf24',
    iconChar: '刚',
    description: '金属性仙草，莲台如金刚铸就，防御坚不可摧。',
    effect: 'immortal:金属性:defensePct+10%,attackPct+5%',
    sellPrice: 55000,
    quantity: 1,
  },
  {
    id: 'immortal-qian-nian-teng',
    name: '千年藤',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#22c55e',
    iconChar: '藤',
    description: '木属性仙草，千年古藤化形，生生不息气血绵长。',
    effect: 'immortal:木属性:hpPct+12%,defensePct+5%',
    sellPrice: 55000,
    quantity: 1,
  },
  {
    id: 'immortal-cang-hai-zhu',
    name: '沧海珠',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#38bdf8',
    iconChar: '沧',
    description: '水属性仙草，生于深海的灵珠，蕴含无穷水之本源。',
    effect: 'immortal:水属性:spiritPct+10%,hpPct+8%',
    sellPrice: 55000,
    quantity: 1,
  },
  {
    id: 'immortal-xuan-tu-ding',
    name: '玄土鼎',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#a16207',
    iconChar: '鼎',
    description: '土属性仙草，形如古鼎，厚土载物防御惊人。',
    effect: 'immortal:土属性:defensePct+12%,hpPct+6%',
    sellPrice: 55000,
    quantity: 1,
  },
  {
    id: 'immortal-tai-yang-jing',
    name: '太阳精',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#fde047',
    iconChar: '阳',
    description: '光属性仙草，凝聚太阳精华，光芒万丈。',
    effect: 'immortal:光属性:attackPct+8%,spiritPct+7%',
    sellPrice: 55000,
    quantity: 1,
  },
  {
    id: 'immortal-xu-kong-jing',
    name: '虚空晶',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#06b6d4',
    iconChar: '虚',
    description: '空间属性仙草，虚空凝聚之晶，可穿梭空间。',
    effect: 'immortal:空间属性:speedPct+12%,spiritPct+6%',
    sellPrice: 60000,
    quantity: 1,
  },
  {
    id: 'immortal-sui-yue-hua',
    name: '岁月花',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#f472b6',
    iconChar: '岁',
    description: '时间属性仙草，花开一瞬已过千年，蕴含时间之力。',
    effect: 'immortal:时间属性:spiritPct+12%,speedPct+5%',
    sellPrice: 60000,
    quantity: 1,
  },
  {
    id: 'immortal-tian-lei-guo',
    name: '天雷果',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#a3e635',
    iconChar: '雷',
    description: '雷属性仙草，受万雷淬炼而生，攻击力霸道无比。',
    effect: 'immortal:雷属性:attackPct+11%,speedPct+4%',
    sellPrice: 55000,
    quantity: 1,
  },
  {
    id: 'immortal-feng-yin-yi',
    name: '风影翼',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#86efac',
    iconChar: '风',
    description: '风属性仙草，形如羽翼，服用后身法如风。',
    effect: 'immortal:风属性:speedPct+11%,attackPct+4%',
    sellPrice: 55000,
    quantity: 1,
  },
  {
    id: 'sacred-dragon-yang-grass',
    name: '圣龙耀阳草',
    type: 'consumable',
    quality: 'legendary',
    qualityColor: '#fbbf24',
    iconChar: '龙',
    description: '传说中只生长在极阴极阳交汇处的特殊仙草，蕴含上古圣龙血脉之力。罗三炮武魂专属，服用后可直接进化为耀阳圣龙。',
    effect: 'sacred-dragon:耀阳圣龙:evolve-shenglong',
    sellPrice: 1,
    quantity: 1,
  },
];

// 冰火两仪眼·仙品仙草（原著顶级仙草，一世限一株，独立于普通仙草计数）
// 冰火两仪眼仙草池，按品质分三档：
// - 普通仙草（epic，紫色）：八角玄冰草 / 烈火杏娇疏 / 幽香绮罗仙品
// - 仙品仙草（legendary，金色）：绮罗郁金香 / 奇茸通天菊
// - 神品仙草（legendary + 红色金边，视觉神品）：相思断肠红
// - 特殊仙草（圣龙耀阳草，单独一档最低概率）
export const ICE_FIRE_IMMORTAL_GRASSES: IItem[] = [
  // —— 普通仙草（epic，紫色）——
  {
    id: 'immortal-ba-jiao-xuan-bing-cao-2',
    name: '八角玄冰草',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#a855f7',
    iconChar: '冰',
    description: '性寒至极的仙草，八角叶片晶莹剔透。可令冰属性武魂进化为极致之冰，按修炼方向增加20万数值。',
    effect: 'ice-fire-immortal:八角玄冰草:cultivationBonus+200000:evolve-ice',
    sellPrice: 200000,
    quantity: 1,
  },
  {
    id: 'immortal-lie-huo-xing-jiao-shu-2',
    name: '烈火杏娇疏',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#f97316',
    iconChar: '火',
    description: '性烈如火的仙草，花瓣如烈焰燃烧。可令火属性武魂进化为极致之火，按修炼方向增加20万数值。',
    effect: 'ice-fire-immortal:烈火杏娇疏:cultivationBonus+200000:evolve-fire',
    sellPrice: 200000,
    quantity: 1,
  },
  {
    id: 'immortal-you-xiang-qi-luo-2',
    name: '幽香绮罗仙品',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#ec4899',
    iconChar: '幽',
    description: '万毒不侵之仙草，幽香四溢百毒辟易。按武魂修炼方向增加20万数值。',
    effect: 'ice-fire-immortal:幽香绮罗仙品:cultivationBonus+200000',
    sellPrice: 180000,
    quantity: 1,
  },
  // —— 仙品仙草（legendary，金色）——
  {
    id: 'immortal-qi-luo-yu-jin-xiang-2',
    name: '绮罗郁金香',
    type: 'consumable',
    quality: 'legendary',
    qualityColor: '#fcd34d',
    iconChar: '郁',
    description: '辅助系仙草之王，通体金紫。七宝琉璃塔可进化为九宝玲珑塔，按修炼方向增加10万数值。',
    effect: 'ice-fire-immortal:绮罗郁金香:cultivationBonus+100000:evolve-tulip',
    sellPrice: 400000,
    quantity: 1,
  },
  {
    id: 'immortal-qi-rong-tong-tian-ju-2',
    name: '奇茸通天菊',
    type: 'consumable',
    quality: 'legendary',
    qualityColor: '#fcd34d',
    iconChar: '菊',
    description: '金刚不坏之仙草，通体金黄。服用后气血+100万，按修炼方向增加40万数值。',
    effect: 'ice-fire-immortal:奇茸通天菊:hp+1000000:cultivationBonus+400000',
    sellPrice: 350000,
    quantity: 1,
  },
  // —— 神品仙草（legendary，红色金边，最为稀有）——
  {
    id: 'immortal-xiang-si-duan-chang-hong-2',
    name: '相思断肠红',
    type: 'consumable',
    quality: 'legendary',
    qualityColor: '#dc2626',
    iconChar: '红',
    description: '至情至性之仙草，血色花瓣如泣如诉。服用后全属性提升30%，乃仙草中最为神奇者。',
    effect: 'ice-fire-immortal:相思断肠红:allAttrPct+30%',
    sellPrice: 800000,
    quantity: 1,
  },
  // —— 特殊仙草（圣龙耀阳草，单独一档）——
  {
    id: 'sacred-dragon-yang-grass-icefire',
    name: '圣龙耀阳草',
    type: 'consumable',
    quality: 'legendary',
    qualityColor: '#fbbf24',
    iconChar: '龙',
    description: '传说中只生长在极阴极阳交汇处的特殊仙草，蕴含上古圣龙血脉之力。罗三炮武魂专属，服用后可直接进化为耀阳圣龙。',
    effect: 'sacred-dragon:耀阳圣龙:evolve-shenglong',
    sellPrice: 1,
    quantity: 1,
  },
  // —— 其他仙品仙草（来自极品仙草池的冰火两仪眼版本，一世每种限一株）——
  {
    id: 'icefire-wang-chuan-qiu-shui-lu',
    name: '望穿秋水露',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#06b6d4',
    iconChar: '秋',
    description: '提升精神力的仙草，服之可明目静心，精神力大增。按武魂修炼方向增加15万数值。',
    effect: 'ice-fire-immortal:望穿秋水露:cultivationBonus+150000',
    sellPrice: 180000,
    quantity: 1,
  },
  {
    id: 'icefire-ji-guan-feng-huang-kui',
    name: '鸡冠凤凰葵',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#f97316',
    iconChar: '凤',
    description: '形如鸡冠的火属性仙草，有凤舞九天之姿。按武魂修炼方向增加18万数值。',
    effect: 'ice-fire-immortal:鸡冠凤凰葵:cultivationBonus+180000',
    sellPrice: 180000,
    quantity: 1,
  },
  {
    id: 'icefire-shui-xian-yu-ji-gu',
    name: '水仙玉肌骨',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#22d3ee',
    iconChar: '仙',
    description: '形如水仙的防御仙草，服之可令筋骨如玉，防御力大增。按武魂修炼方向增加15万数值。',
    effect: 'ice-fire-immortal:水仙玉肌骨:cultivationBonus+150000',
    sellPrice: 180000,
    quantity: 1,
  },
  {
    id: 'icefire-ba-ban-xian-lan',
    name: '八瓣仙兰',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#a855f7',
    iconChar: '兰',
    description: '八瓣绽放的速度仙草，清香四溢，身轻如燕。按武魂修炼方向增加15万数值。',
    effect: 'ice-fire-immortal:八瓣仙兰:cultivationBonus+150000',
    sellPrice: 180000,
    quantity: 1,
  },
  {
    id: 'icefire-xue-se-tian-e-wen',
    name: '雪色天鹅吻',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#84cc16',
    iconChar: '鹅',
    description: '剧毒仙草，雪色花瓣天鹅之形，毒中之王。按武魂修炼方向增加16万数值。',
    effect: 'ice-fire-immortal:雪色天鹅吻:cultivationBonus+160000',
    sellPrice: 180000,
    quantity: 1,
  },
  {
    id: 'icefire-long-zhi-ye',
    name: '龙芝叶',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#22c55e',
    iconChar: '龙',
    description: '形如龙吟的力量仙草，有龙之气息，力大无穷。按武魂修炼方向增加15万数值。',
    effect: 'ice-fire-immortal:龙芝叶:cultivationBonus+150000',
    sellPrice: 180000,
    quantity: 1,
  },
  {
    id: 'icefire-huang-quan-lu',
    name: '黄泉露',
    type: 'consumable',
    quality: 'legendary',
    qualityColor: '#7c3aed',
    iconChar: '黄',
    description: '来自黄泉的剧毒仙露，饮之可增暗毒之力，乃暗属性魂师梦寐以求之物。按武魂修炼方向增加20万数值。',
    effect: 'ice-fire-immortal:黄泉露:cultivationBonus+200000',
    sellPrice: 250000,
    quantity: 1,
  },
  {
    id: 'icefire-jin-gang-bu-huai',
    name: '金刚不坏莲',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#fbbf24',
    iconChar: '刚',
    description: '金属性仙草，莲台如金刚铸就，防御坚不可摧。按武魂修炼方向增加16万数值。',
    effect: 'ice-fire-immortal:金刚不坏莲:cultivationBonus+160000',
    sellPrice: 180000,
    quantity: 1,
  },
  {
    id: 'icefire-qian-nian-teng',
    name: '千年藤',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#22c55e',
    iconChar: '藤',
    description: '木属性仙草，千年古藤化形，生生不息气血绵长。按武魂修炼方向增加15万数值。',
    effect: 'ice-fire-immortal:千年藤:cultivationBonus+150000',
    sellPrice: 180000,
    quantity: 1,
  },
  {
    id: 'icefire-cang-hai-zhu',
    name: '沧海珠',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#38bdf8',
    iconChar: '沧',
    description: '水属性仙草，生于深海的灵珠，蕴含无穷水之本源。按武魂修炼方向增加16万数值。',
    effect: 'ice-fire-immortal:沧海珠:cultivationBonus+160000',
    sellPrice: 180000,
    quantity: 1,
  },
  {
    id: 'icefire-xuan-tu-ding',
    name: '玄土鼎',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#a16207',
    iconChar: '鼎',
    description: '土属性仙草，形如古鼎，厚土载物防御惊人。按武魂修炼方向增加15万数值。',
    effect: 'ice-fire-immortal:玄土鼎:cultivationBonus+150000',
    sellPrice: 180000,
    quantity: 1,
  },
  {
    id: 'icefire-tai-yang-jing',
    name: '太阳精',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#fde047',
    iconChar: '阳',
    description: '光属性仙草，凝聚太阳精华，光芒万丈。按武魂修炼方向增加16万数值。',
    effect: 'ice-fire-immortal:太阳精:cultivationBonus+160000',
    sellPrice: 180000,
    quantity: 1,
  },
  {
    id: 'icefire-xu-kong-jing-immortal',
    name: '虚空晶',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#06b6d4',
    iconChar: '虚',
    description: '空间属性仙草，虚空凝聚之晶，可穿梭空间。按武魂修炼方向增加18万数值。',
    effect: 'ice-fire-immortal:虚空晶:cultivationBonus+180000',
    sellPrice: 200000,
    quantity: 1,
  },
  {
    id: 'icefire-sui-yue-hua',
    name: '岁月花',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#f472b6',
    iconChar: '岁',
    description: '时间属性仙草，花开一瞬已过千年，蕴含时间之力。按武魂修炼方向增加18万数值。',
    effect: 'ice-fire-immortal:岁月花:cultivationBonus+180000',
    sellPrice: 200000,
    quantity: 1,
  },
  {
    id: 'icefire-tian-lei-guo',
    name: '天雷果',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#a3e635',
    iconChar: '雷',
    description: '雷属性仙草，受万雷淬炼而生，攻击力霸道无比。按武魂修炼方向增加18万数值。',
    effect: 'ice-fire-immortal:天雷果:cultivationBonus+180000',
    sellPrice: 200000,
    quantity: 1,
  },
  {
    id: 'icefire-feng-yin-yi',
    name: '风影翼',
    type: 'consumable',
    quality: 'epic',
    qualityColor: '#86efac',
    iconChar: '风',
    description: '风属性仙草，形如羽翼，服用后身法如风。按武魂修炼方向增加15万数值。',
    effect: 'ice-fire-immortal:风影翼:cultivationBonus+150000',
    sellPrice: 180000,
    quantity: 1,
  },
];

// 冰火两仪眼·普通灵草（固定数值加成，单种上限5株，全属性上限20万）
export const HOLY_GRASSES: IItem[] = [
  {
    id: 'holy-gold-leaf',
    name: '金芝叶',
    type: 'consumable',
    quality: 'rare',
    qualityColor: '#fbbf24',
    iconChar: '金',
    description: '金属性灵草，形如灵芝，金光熠熠。',
    effect: 'holy-grass:金属性:attack+130000',
    sellPrice: 20000,
    quantity: 1,
  },
  {
    id: 'holy-wood-herb',
    name: '长生藤',
    type: 'consumable',
    quality: 'rare',
    qualityColor: '#22c55e',
    iconChar: '木',
    description: '木属性灵草，生生不息，延年益寿。',
    effect: 'holy-grass:木属性:defense+125000:hp+150000',
    sellPrice: 20000,
    quantity: 1,
  },
  {
    id: 'holy-water-grass',
    name: '水涟花',
    type: 'consumable',
    quality: 'rare',
    qualityColor: '#38bdf8',
    iconChar: '水',
    description: '水属性灵草，生于寒泉之畔，水波不兴。',
    effect: 'holy-grass:水属性:spirit+128000',
    sellPrice: 20000,
    quantity: 1,
  },
  {
    id: 'holy-fire-flower',
    name: '赤炎花',
    type: 'consumable',
    quality: 'rare',
    qualityColor: '#f97316',
    iconChar: '火',
    description: '火属性灵草，状如烈焰，触之灼手。',
    effect: 'holy-grass:火属性:attack+135000',
    sellPrice: 20000,
    quantity: 1,
  },
  {
    id: 'holy-earth-root',
    name: '厚土参',
    type: 'consumable',
    quality: 'rare',
    qualityColor: '#a16207',
    iconChar: '土',
    description: '土属性灵草，扎根千尺，厚重如山。',
    effect: 'holy-grass:土属性:defense+135000:hp+130000',
    sellPrice: 20000,
    quantity: 1,
  },
  {
    id: 'holy-light-lotus',
    name: '净世莲',
    type: 'consumable',
    quality: 'rare',
    qualityColor: '#fde047',
    iconChar: '光',
    description: '光属性灵草，出淤泥而不染，圣光普照。',
    effect: 'holy-grass:光属性:spirit+130000:attack+115000',
    sellPrice: 20000,
    quantity: 1,
  },
  {
    id: 'holy-dark-mushroom',
    name: '幽冥菇',
    type: 'consumable',
    quality: 'rare',
    qualityColor: '#7c3aed',
    iconChar: '暗',
    description: '暗属性灵草，生于阴暗深处，幽光隐现。',
    effect: 'holy-grass:暗属性:attack+128000:spirit+115000',
    sellPrice: 20000,
    quantity: 1,
  },
  {
    id: 'holy-ice-lotus',
    name: '冰魄莲',
    type: 'consumable',
    quality: 'rare',
    qualityColor: '#38bdf8',
    iconChar: '冰',
    description: '冰属性灵草，生于极寒冰渊，莲心如冰玉。',
    effect: 'holy-grass:冰属性:attack+130000:defense+120000',
    sellPrice: 22000,
    quantity: 1,
  },
  {
    id: 'holy-time-flower',
    name: '岁时花',
    type: 'consumable',
    quality: 'rare',
    qualityColor: '#f472b6',
    iconChar: '时',
    description: '时间属性灵草，花期一瞬，花开千年。',
    effect: 'holy-grass:时间属性:spirit+132000:speed+118000',
    sellPrice: 25000,
    quantity: 1,
  },
  {
    id: 'holy-space-crystal',
    name: '虚空晶',
    type: 'consumable',
    quality: 'rare',
    qualityColor: '#06b6d4',
    iconChar: '空',
    description: '空间属性灵草，形如晶簇，隐有空间波动。',
    effect: 'holy-grass:空间属性:speed+130000:spirit+120000',
    sellPrice: 25000,
    quantity: 1,
  },
];

// 特殊物品：生命之水
export const WATER_OF_LIFE: IItem = {
  id: 'water-of-life',
  name: '生命之水',
  type: 'consumable',
  quality: 'legendary',
  qualityColor: '#fcd34d',
  iconChar: '命',
  description: '生命之湖的本源精华，拥有极其庞大的生命力量。服用后全属性提升200%，一生仅可服用一次。',
  effect: 'water-of-life:allAttr+200%',
  sellPrice: 500000,
  quantity: 1,
};

// 特殊物品：极寒冰玉
export const POLAR_ICE_JADE: IItem = {
  id: 'polar-ice-jade',
  name: '极寒冰玉',
  type: 'consumable',
  quality: 'epic',
  qualityColor: '#67e8f9',
  iconChar: '晶',
  description: '极北之地万年寒冰所化的玉晶，蕴含极致之冰的力量。仅限冰属性或水属性武魂服用，每颗增加全属性10%，最多服用3颗。',
  effect: 'polar-ice-jade:冰/水属性:allAttr+300',
  sellPrice: 100000,
  quantity: 1,
};

// 所有消耗品汇总（用于查找）
// ⚠️ v18.0 已移除灵草/仙草/生命之水/极寒冰玉等草药类物品
// 保留原数据定义（下方SPIRIT_GRASSES/IMMORTAL_GRASSES/WATER_OF_LIFE/POLAR_ICE_JADE）以兼容旧存档中已有的物品
// 但不再加入 ALL_CONSUMABLES，确保不会通过任何掉落/商店/奖励途径新增
export const ALL_CONSUMABLES: IItem[] = [
  // 草药类物品已移除
];

/** 根据 id 查找消耗品模板 */
export function getConsumableById(id: string): IItem | undefined {
  const all = [...SPIRIT_GRASSES, ...IMMORTAL_GRASSES, ...ICE_FIRE_IMMORTAL_GRASSES, ...HOLY_GRASSES, WATER_OF_LIFE];
  return all.find((item) => item.id === id);
}

/** 根据物品返回其额外属性定义 */
export function getConsumableExtra(item: IItem): ConsumableExtra | null {
  const effect = item.effect || '';
  if (effect.startsWith('element-spirit:')) {
    const rest = effect.replace('element-spirit:', '');
    const [element, bonusStr] = rest.includes(':') ? rest.split(':', 2) : [rest, ''];
    const fixedBonus: ConsumableExtra['fixedBonus'] = {};
    if (bonusStr) {
      const parts = bonusStr.split(',');
      for (const p of parts) {
        const match = p.match(/(attack|defense|speed|spirit|hp|allAttr)\+([\d.]+)/);
        if (!match) continue;
        const [, key, val] = match;
        (fixedBonus as any)[key] = parseFloat(val);
      }
    }
    return {
      subType: 'element-spirit',
      elementReq: [element],
      fixedBonus,
      cap: 5,
      capKey: 'elementGrass',
      effectDesc: `提升${element}修炼效果，攻击+${fixedBonus.attack ?? 0}、精神+${fixedBonus.spirit ?? 0}（元素灵草最多服用5株）`,
    };
  }
  if (effect.startsWith('attribute-spirit:')) {
    const rest = effect.replace('attribute-spirit:', '');
    const parts = rest.split(':');
    const attr = parts[0] as 'attack' | 'defense' | 'speed' | 'spirit' | 'hp';
    const fixVal = parts[1] ? parseFloat(parts[1]) : 50;
    const attrName = attr === 'hp' ? '气血' : attr === 'attack' ? '攻击' : attr === 'defense' ? '防御' : attr === 'speed' ? '速度' : '精神';
    return {
      subType: 'attribute-spirit',
      elementReq: [],
      randomAttrs: [attr],
      fixedBonus: { [attr]: fixVal } as ConsumableExtra['fixedBonus'],
      cap: 5,
      capKey: 'attributeGrass',
      effectDesc: `增加${attrName}属性 +${fixVal}（属性灵草最多服用5株）`,
    };
  }
  if (effect.startsWith('immortal:')) {
    const parts = effect.split(':');
    const element = parts[1] || '';
    const bonusStr = parts[2] || '';
    const fixedBonus: ConsumableExtra['fixedBonus'] = {};
    const attrBonus: ConsumableExtra['attrBonus'] = {};
    let hasAttrBonus = false;
    // 解析百分比属性（Pct结尾，带%）
    const parsePct = (key: string, bonusKey: keyof ConsumableExtra['attrBonus']) => {
      const m = bonusStr.match(new RegExp(`${key}\\+([\\d.]+)%`));
      if (m) {
        (attrBonus as any)[bonusKey] = parseFloat(m[1]);
        hasAttrBonus = true;
      }
    };
    parsePct('allAttrPct', 'allAttr');
    parsePct('attackPct', 'attack');
    parsePct('defensePct', 'defense');
    parsePct('speedPct', 'speed');
    parsePct('spiritPct', 'spirit');
    parsePct('hpPct', 'hp');
    // 解析固定数值属性（兼容旧存档，以防部分旧档还是固定值格式）
    const parseVal = (key: string) => {
      const m = bonusStr.match(new RegExp(`${key}\\+([\\d.]+)(?!%)`));
      if (m) (fixedBonus as any)[key] = parseFloat(m[1]);
    };
    ['allAttr', 'attack', 'defense', 'speed', 'spirit', 'hp'].forEach(parseVal);
    // 描述拼接
    const descParts: string[] = [];
    if (attrBonus.attack) descParts.push(`攻击+${attrBonus.attack}%`);
    if (attrBonus.defense) descParts.push(`防御+${attrBonus.defense}%`);
    if (attrBonus.speed) descParts.push(`速度+${attrBonus.speed}%`);
    if (attrBonus.spirit) descParts.push(`精神+${attrBonus.spirit}%`);
    if (attrBonus.hp) descParts.push(`气血+${attrBonus.hp}%`);
    if (attrBonus.allAttr) descParts.push(`全属性+${attrBonus.allAttr}%`);
    if (fixedBonus.attack) descParts.push(`攻击+${fixedBonus.attack}`);
    if (fixedBonus.defense) descParts.push(`防御+${fixedBonus.defense}`);
    if (fixedBonus.speed) descParts.push(`速度+${fixedBonus.speed}`);
    if (fixedBonus.spirit) descParts.push(`精神+${fixedBonus.spirit}`);
    if (fixedBonus.hp) descParts.push(`气血+${fixedBonus.hp}`);
    if (fixedBonus.allAttr) descParts.push(`全属性+${fixedBonus.allAttr}`);
     // 解析元素属性要求：气血/全属性/辅助属性/防御属性/速度属性 视为全属性（无限制）
     // 力量属性映射到金属性（需走属性匹配）
     let elementReq: string[] = [];
     if (element && element !== '全属性' && element !== '辅助属性' && element !== '气血/全属性' && element !== '防御属性' && element !== '速度属性') {
       if (element === '力量属性') {
         elementReq = ['金属性'];
       } else {
         elementReq = element.split('/').map((e) => e + '属性').filter((e) => !['气血/全属性', '全属性'].includes(e.replace('属性', '')));
       }
     }
    return {
      subType: 'immortal',
      elementReq,
      fixedBonus: Object.keys(fixedBonus).length > 0 ? fixedBonus : undefined,
      attrBonus: hasAttrBonus ? attrBonus : undefined,
      cap: 3,
      capKey: 'immortalGrass',
      effectDesc: `仙草，${descParts.join('、')}（仙草最多服用3株）`,
    };
  }
  if (effect.startsWith('ice-fire-immortal:')) {
     // 格式：ice-fire-immortal:<仙草名>:<效果段1>:<效果段2>:...:<specialEffect?>
     // specialEffect 仅限 evolve-ice / evolve-fire / evolve-tulip，且必须在最后一段
     const parts = effect.split(':');
     const grassName = parts[1] || '';
     // 检测最后一段是否为特殊效果
     let specialEffectRaw = '';
     let bonusEndIdx = parts.length;
     const lastPart = parts[parts.length - 1];
      if (lastPart === 'evolve-ice' || lastPart === 'evolve-fire' || lastPart === 'evolve-tulip' || lastPart === 'evolve-shenglong') {
       specialEffectRaw = lastPart;
       bonusEndIdx = parts.length - 1;
     }
     // 所有效果段（parts[2] 到 bonusEndIdx-1）用 : 连接，支持多段加成（如 hp+100万:cultivationBonus+40万）
     const bonusStr = parts.slice(2, bonusEndIdx).join(':');
    const fixedBonus: ConsumableExtra['fixedBonus'] = {};
    let cultivationBonus = 0;
    let attrBonus: ConsumableExtra['attrBonus'] | undefined;
    // 解析属性加成
    const parseVal = (key: string, regStr: string) => {
      const m = bonusStr.match(new RegExp(`${key}\\+([\\d.]+)${regStr}`));
      if (m) (fixedBonus as any)[key] = parseFloat(m[1]);
    };
    ['attack', 'defense', 'speed', 'spirit', 'hp'].forEach((k) => parseVal(k, ''));
    // 解析修炼方向加成
    const cbMatch = bonusStr.match(/cultivationBonus\+([\d.]+)/);
    if (cbMatch) cultivationBonus = parseFloat(cbMatch[1]);
    // 解析全属性百分比（相思断肠红）
    const aapMatch = bonusStr.match(/allAttrPct\+([\d.]+)%/);
    if (aapMatch) {
      attrBonus = { allAttr: parseFloat(aapMatch[1]) };
    }
    // 解析特殊效果
    let specialEffect: ConsumableExtra['specialEffect'];
    if (specialEffectRaw === 'evolve-ice') specialEffect = 'evolve-ice';
    else if (specialEffectRaw === 'evolve-fire') specialEffect = 'evolve-fire';
    else if (specialEffectRaw === 'evolve-tulip') specialEffect = 'evolve-tulip';
    else if (specialEffectRaw === 'evolve-shenglong') specialEffect = 'evolve-shenglong';
    // 描述拼接
    const descParts: string[] = [];
    if (cultivationBonus > 0) descParts.push(`修炼属性+${cultivationBonus.toLocaleString()}`);
    if (fixedBonus.hp) descParts.push(`气血+${fixedBonus.hp.toLocaleString()}`);
    if (attrBonus?.allAttr) descParts.push(`全属性+${attrBonus.allAttr}%`);
    if (specialEffect === 'evolve-ice') descParts.push('冰属性武魂进化为极致之冰');
    if (specialEffect === 'evolve-fire') descParts.push('火属性武魂进化为极致之火');
    if (specialEffect === 'evolve-tulip') descParts.push('七宝琉璃塔进化为九宝玲珑塔');
    if (specialEffect === 'evolve-shenglong') descParts.push('罗三炮武魂进化为耀阳圣龙');
    // 属性要求：按仙草类型不同
    let elementReq: string[] = [];
    if (specialEffect === 'evolve-ice') elementReq = ['冰属性'];
    else if (specialEffect === 'evolve-fire') elementReq = ['火属性'];
    else if (specialEffect === 'evolve-tulip') elementReq = []; // 辅助系武魂都可服用获得属性，七宝琉璃塔额外进化（gameStore中特殊判定）
    // 无特殊效果的仙品仙草（相思断肠红/奇茸通天菊/幽香绮罗仙品）全属性通用，elementReq 保持为空数组
    // capKey 按仙草名单独计数（一世每种限一株）
    const capKey = `iceFire:${grassName}`;
    return {
      subType: 'ice-fire-immortal',
      elementReq,
      fixedBonus,
      attrBonus,
      cultivationBonus,
      specialEffect,
      cap: 1,
      capKey,
      effectDesc: `仙品仙草·${grassName}：${descParts.join('、')}（一世仅限服用一株）`,
    };
  }
  if (effect.startsWith('holy-grass:')) {
    // 格式：holy-grass:<元素属性>:<attr1>+<val1>:<attr2>+<val2>...
    const parts = effect.split(':');
    const element = parts[1] || '';
    const rest = parts.slice(2).join(':');
    const fixedBonus: ConsumableExtra['fixedBonus'] = {};
    // 匹配所有 attr+number 对
    const re = /(attack|defense|speed|spirit|hp)\+([\d.]+)/g;
    let m;
    while ((m = re.exec(rest)) !== null) {
      (fixedBonus as any)[m[1]] = parseFloat(m[2]);
    }
    // 描述
    const attrNames: Record<string, string> = { attack: '攻击', defense: '防御', speed: '速度', spirit: '精神', hp: '气血' };
    const descParts = Object.entries(fixedBonus)
      .filter(([, v]) => v)
      .map(([k, v]) => `${attrNames[k] || k}+${Number(v).toLocaleString()}`);
    return {
      subType: 'holy-grass',
      elementReq: [element],
      fixedBonus,
      cap: 5,
      capKey: `holyGrass:${element}`,
      effectDesc: `灵草·${element.replace('属性', '')}：${descParts.join('、')}（每种灵草最多服用5株，总上限不超过20万）`,
    };
  }
  if (effect.startsWith('water-of-life:')) {
    return {
      subType: 'water-of-life',
      elementReq: [],
      attrBonus: { allAttr: 200 },
      cap: 1,
      capKey: 'waterOfLife',
      effectDesc: '生命之水，全属性+200%（一生仅限服用一次）',
    };
  }
  if (effect.startsWith('polar-ice-jade:')) {
    const rest = effect.replace('polar-ice-jade:', '');
    const segs = rest.split(':');
    const elementStr = segs[0] || '冰/水属性';
    const bonusStr = segs[1] || '';
    const fixedBonus: ConsumableExtra['fixedBonus'] = {};
    const m = bonusStr.match(/allAttr\+([\d.]+)/);
    if (m) fixedBonus.allAttr = parseFloat(m[1]);
    return {
      subType: 'polar-ice-jade',
      elementReq: elementStr.split('/').map((e) => e.endsWith('属性') ? e : e + '属性'),
      fixedBonus,
      cap: 3,
      capKey: 'polarIceJade',
      effectDesc: `极寒冰玉，全属性+${fixedBonus.allAttr ?? 0}（仅限冰/水属性武魂服用，最多3颗）`,
    }; 
  }
  if (effect.startsWith('sacred-dragon:')) {
     // 圣龙耀阳草：特殊仙草，罗三炮专属进化材料
     // 注意：元素要求置空，专属限制由 gameStore 的 useConsumable 函数处理（仅罗三炮可服）
     return {
       subType: 'sacred-dragon',
       elementReq: [],
       cap: 1,
       capKey: 'sacredDragonGrass',
       cultivationBonus: 200000, // 20万修为，与其他进化仙草对齐
       attrBonus: { attack: 15, defense: 10, speed: 8, spirit: 12, hp: 30 },
       effectDesc: '罗三炮武魂专属仙草，服用后直接进化为神级耀阳圣龙（极致之光），解除等级限制，魂技重生。额外增加20万修为与五维属性。非罗三炮武魂无法服用。',
       specialEffect: 'evolve-shenglong',
     };
   }

  return null;
}

/**
 * 根据凶兽掉落池抽取物品（每种独立roll，可能掉落多个或空手而归）
 */
export function rollFierceBeastDrops(drops: Array<{ itemId: string; chance: number; amount?: number }>): IItem[] {
  const result: IItem[] = [];
  for (const d of drops) {
    if (Math.random() < d.chance) {
      const tmpl = getConsumableById(d.itemId);
      if (tmpl) {
        const qty = d.amount ?? 1;
        result.push({ ...tmpl, id: `${tmpl.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, quantity: qty });
      }
    }
  }
  return result;
}

/** 冰/水属性灵草列表（v18.0 已移除，保留定义兼容旧存档） */
const ICE_GRASS_IDS: string[] = [];

/** 极北之地探索击杀魂兽小概率掉落冰属性灵草（v18.0 已移除，不再掉落） */
export function rollIceGrassDrop(_chance = 0.08): IItem | null {
  return null;
}

// ================================
// 特殊物品（创世级神器等无法出售/赠送/制作的稀有物品）
// ================================
export const SPECIAL_ITEMS: IItem[] = [
  {
    id: 'item-hundun-sword',
    name: '混沌神剑',
    type: 'special',
    quality: 'legendary',
    qualityColor: '#c084fc',
    iconChar: '混',
    description: '混沌茶所持的创世级神剑，凌驾于所有武魂之上的存在。五维属性各 +30 亿，落入背包即被动生效。无法出售、无法赠送、无法作为材料。',
    attributes: {
      attack: 3000000000,
      defense: 3000000000,
      speed: 3000000000,
      spirit: 3000000000,
      hp: 3000000000,
    },
    sellPrice: 0,
    quantity: 1,
  },
];

/** 根据 id 查找特殊物品模板 */
export function getSpecialItemById(id: string): IItem | undefined {
  return SPECIAL_ITEMS.find((item) => item.id === id);
}
