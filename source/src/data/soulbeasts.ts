// EXPORTS: ISoulBeastSpecies, SOUL_BEAST_POOL, generateBeastInstance, getRingQualityFromYears, RING_YEAR_RANGES, rollSoulBoneDrop, rollExternalSoulBone, getSkillNameForBeast, getBeastSpeciesByName, getDangerLevel, getBeastStatsByYears

export interface ISoulBeastSpecies {
  id: string;
  name: string;
  areaTier: 'outer' | 'middle' | 'inner' | 'core' | 'life-lake';
  // 基础属性按年限动态计算，这里给比例系数
  baseHpPerYear: number; // 每一年提供的血量
  baseAtkPerYear: number;
  baseDefPerYear: number;
  baseSpdPerYear: number;
  skills: { name: string; desc: string }[];
  description: string;
  element: string; // 冰属性 / 火属性 / 暗属性 等（11种标准属性必填）
}

// 年限区间（用于生成随机年限）—— 核心区 ≥10万年，生命之湖 ≥20万年
export const RING_YEAR_RANGES: Record<string, [number, number]> = {
  // 外围：十年~百年（严格低年限，不越界）
  outer: [10, 999],
  // 中部：百年~千年（百年起，千年止，主打百年~几千年）
  middle: [100, 9999],
  // 内圈：千年~万年（千年起，万年末，主打几千年~几万年）
  inner: [1000, 99999],
  // 核心区：万年~百万年（万年起，主打十万年级以上）
  core: [10000, 999999],
  // 生命之湖：二十万年起，更高质量
  'life-lake': [200000, 999999],
};

// 特殊年限概率：各区域小概率遇到更高年限魂兽（严格限制，只跨一小段，不大跨度穿越）
// 外围 2% 概率遇到低阶百年（100-300年），中部 3% 概率遇到低阶千年（1000-2000年）
// 内圈 3% 概率遇到低阶万年（10000-20000年），核心区 2% 概率遇到百万年级（100-150万年）
const RARE_YEAR_BOOST: Record<string, { chance: number; range: [number, number] }> = {
  outer: { chance: 0.02, range: [100, 300] },
  middle: { chance: 0.03, range: [1000, 2000] },
  inner: { chance: 0.03, range: [10000, 20000] },
  core: { chance: 0.02, range: [1000000, 1500000] },
  'life-lake': { chance: 0.03, range: [1200000, 2000000] },
};

// 根据年限判断魂环颜色（品质）
export function getRingQualityFromYears(years: number): { color: string; label: string } {
  if (years >= 1000000) return { color: 'gold', label: '百万年' };
  if (years >= 100000) return { color: 'red', label: '十万年' };
  if (years >= 10000) return { color: 'black', label: '万年' };
  if (years >= 1000) return { color: 'purple', label: '千年' };
  if (years >= 100) return { color: 'yellow', label: '百年' };
  return { color: 'white', label: '十年' };
}

// 兽种库：按区域分层（5 个区域）
export const SOUL_BEAST_POOL: ISoulBeastSpecies[] = [
  // === 外围区：十年/百年魂兽 ===
  {
    id: 'feng-wei-ji',
    name: '风尾鸡冠蛇',
    areaTier: 'outer',
    baseHpPerYear: 0.8,
    baseAtkPerYear: 0.15,
    baseDefPerYear: 0.05,
    baseSpdPerYear: 0.2,
    skills: [{ name: '凤翼天翔', desc: '振翅掠击，速度极快' }],
    description: '速度极快的飞行魂兽',
    element: '木属性',
  },
  {
    id: 'you-ming-lang',
    name: '时序夜狼',
    areaTier: 'outer',
    baseHpPerYear: 1.0,
    baseAtkPerYear: 0.2,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.25,
    skills: [{ name: '幽冥影杀', desc: '隐匿身形后突袭' }],
  element: '时间属性',
    description: '游走于时序裂隙中的狼魂兽，动作迅捷无声，能短暂操控时间流速。',
  },
  {
    id: 'tie-jiao-niu',
    name: '铁角蛮牛',
    areaTier: 'outer',
    baseHpPerYear: 1.5,
    baseAtkPerYear: 0.12,
    baseDefPerYear: 0.15,
    baseSpdPerYear: 0.08,
    skills: [{ name: '铁角冲撞', desc: '用铁角冲撞敌人' }],
    description: '皮糙肉厚的力量型魂兽',
    element: '土属性',
  },
  {
    id: 'man-tuo-luo-she',
    name: '曼陀罗蛇',
    areaTier: 'outer',
    baseHpPerYear: 0.9,
    baseAtkPerYear: 0.18,
    baseDefPerYear: 0.06,
    baseSpdPerYear: 0.15,
    skills: [{ name: '毒牙噬咬', desc: '剧毒撕咬造成持续伤害' }],
    description: '剧毒的蛇形魂兽',
    element: '木属性',
  },
  {
    id: 'rou-gu-tu',
    name: '柔骨媚兔',
    areaTier: 'outer',
    baseHpPerYear: 0.7,
    baseAtkPerYear: 0.1,
    baseDefPerYear: 0.04,
    baseSpdPerYear: 0.3,
    skills: [{ name: '虚无', desc: '瞬间虚化闪避攻击' }],
    description: '速度极高的小型魂兽',
    element: '木属性',
  },
  {
    id: 'gang-mao-zhu',
    name: '钢毛刚猪',
    areaTier: 'outer',
    baseHpPerYear: 1.2,
    baseAtkPerYear: 0.14,
    baseDefPerYear: 0.12,
    baseSpdPerYear: 0.06,
    skills: [{ name: '钢毛散射', desc: '射出全身钢毛' }],
    description: '全身坚硬如钢的野猪',
    element: '金属性',
  },
  {
    id: 'feng-wei-ji-2',
    name: '青风雉',
    areaTier: 'outer',
    baseHpPerYear: 0.6,
    baseAtkPerYear: 0.12,
    baseDefPerYear: 0.04,
    baseSpdPerYear: 0.22,
    skills: [{ name: '疾风啄击', desc: '高速俯冲啄击' }],
    description: '风属性的小型飞禽魂兽',
    element: '木属性',
  },
  {
    id: 'jiao-yang',
    name: '岩角羚羊',
    areaTier: 'outer',
    baseHpPerYear: 1.1,
    baseAtkPerYear: 0.13,
    baseDefPerYear: 0.1,
    baseSpdPerYear: 0.14,
    skills: [{ name: '羊角冲撞', desc: '用锋利羊角冲撞' }],
    description: '长有坚硬利角的羊类魂兽',
    element: '土属性',
  },
  {
    id: 'feng-niao',
    name: '疾风蜂雀',
    areaTier: 'outer',
    baseHpPerYear: 0.4,
    baseAtkPerYear: 0.09,
    baseDefPerYear: 0.03,
    baseSpdPerYear: 0.35,
    skills: [{ name: '蜂刺突袭', desc: '极速刺击' }],
    description: '体型极小速度极快的蜂鸟魂兽',
    element: '木属性',
  },
  {
    id: 'ci-wei',
    name: '钢刺豪猪',
    areaTier: 'outer',
    baseHpPerYear: 0.9,
    baseAtkPerYear: 0.11,
    baseDefPerYear: 0.13,
    baseSpdPerYear: 0.07,
    skills: [{ name: '尖刺防御', desc: '竖起尖刺防御攻击' }],
    description: '浑身尖刺的防御型魂兽',
    element: '土属性',
  },
  {
    id: 'guang-ming-ying',
    name: '光明圣鹰',
    areaTier: 'outer',
    baseHpPerYear: 0.8,
    baseAtkPerYear: 0.18,
    baseDefPerYear: 0.06,
    baseSpdPerYear: 0.22,
    skills: [{ name: '光耀俯冲', desc: '裹挟圣光之力从天而降' }],
    description: '沐浴阳光的神圣飞禽',
    element: '光属性',
  },
  {
    id: 'jing-tie-hou',
    name: '精铁灵猴',
    areaTier: 'outer',
    baseHpPerYear: 0.95,
    baseAtkPerYear: 0.16,
    baseDefPerYear: 0.12,
    baseSpdPerYear: 0.18,
    skills: [{ name: '铁拳轰击', desc: '金属化的拳头重击敌人' }],
    description: '全身覆盖精铁甲片的猿类魂兽',
    element: '金属性',
  },

  // ===== 外围区新增：12属性全面覆盖 =====
  // 金属性
  {
    id: 'jin-jing-shou',
    name: '金晶兽',
    areaTier: 'outer',
    baseHpPerYear: 1.0,
    baseAtkPerYear: 0.18,
    baseDefPerYear: 0.14,
    baseSpdPerYear: 0.12,
    skills: [{ name: '金晶护体', desc: '金属结晶覆盖全身增强防御' }],
    description: '全身布满金色晶体的小型魂兽',
    element: '金属性',
  },
  // 木属性
  {
    id: 'qing-teng-she',
    name: '青藤蟒',
    areaTier: 'outer',
    baseHpPerYear: 0.8,
    baseAtkPerYear: 0.13,
    baseDefPerYear: 0.06,
    baseSpdPerYear: 0.14,
    skills: [{ name: '藤蔓缠绕', desc: '召唤藤蔓束缚敌人' }],
    description: '身如青藤的植物系蛇类魂兽',
    element: '木属性',
  },
  // 水属性
  {
    id: 'shui-wa',
    name: '碧水蟾',
    areaTier: 'outer',
    baseHpPerYear: 0.75,
    baseAtkPerYear: 0.1,
    baseDefPerYear: 0.07,
    baseSpdPerYear: 0.15,
    skills: [{ name: '水弹喷射', desc: '喷射高压水弹攻击' }],
    description: '栖息在水泽边的小型水属性魂兽',
    element: '水属性',
  },
  // 火属性
  {
    id: 'huo-yan-shu',
    name: '赤炎鼠',
    areaTier: 'outer',
    baseHpPerYear: 0.65,
    baseAtkPerYear: 0.15,
    baseDefPerYear: 0.04,
    baseSpdPerYear: 0.22,
    skills: [{ name: '火球喷吐', desc: '喷出小型火球' }],
    description: '尾部带火的小型鼠类魂兽',
    element: '火属性',
  },
  // 土属性
  {
    id: 'shi-tou-ren',
    name: '岩石傀儡',
    areaTier: 'outer',
    baseHpPerYear: 1.4,
    baseAtkPerYear: 0.1,
    baseDefPerYear: 0.16,
    baseSpdPerYear: 0.03,
    skills: [{ name: '岩石冲击', desc: '全身岩石化冲撞敌人' }],
    description: '由岩石构成的小型人形魂兽',
    element: '土属性',
  },
  // 冰属性
  {
    id: 'bing-can',
    name: '冰蚕',
    areaTier: 'outer',
    baseHpPerYear: 0.5,
    baseAtkPerYear: 0.08,
    baseDefPerYear: 0.05,
    baseSpdPerYear: 0.05,
    skills: [{ name: '冰丝缠绕', desc: '吐出冰冷丝线束缚敌人' }],
    description: '极北之地最基础的冰属性魂兽',
    element: '冰属性',
  },
  // 雷属性
  {
    id: 'lei-niao',
    name: '雷霆鸟',
    areaTier: 'outer',
    baseHpPerYear: 0.7,
    baseAtkPerYear: 0.16,
    baseDefPerYear: 0.04,
    baseSpdPerYear: 0.24,
    skills: [{ name: '电光闪', desc: '化作一道电光冲击' }],
    description: '身披电光的小型飞禽魂兽',
    element: '火属性',
  },
  // 风属性
  {
    id: 'feng-tu',
    name: '御风兔',
    areaTier: 'outer',
    baseHpPerYear: 0.6,
    baseAtkPerYear: 0.09,
    baseDefPerYear: 0.04,
    baseSpdPerYear: 0.3,
    skills: [{ name: '疾风疾驰', desc: '借助风力极速奔袭' }],
    description: '速度极快的风属性小型魂兽',
    element: '木属性',
  },
  // 光明属性
  {
    id: 'guang-ming-die',
    name: '光明蝶(幼体)',
    areaTier: 'outer',
    baseHpPerYear: 0.5,
    baseAtkPerYear: 0.1,
    baseDefPerYear: 0.03,
    baseSpdPerYear: 0.18,
    skills: [{ name: '光粉洒落', desc: '洒落带有光明之力的鳞粉' }],
    description: '鳞翅散发柔光的美丽蝴蝶',
    element: '光属性',
  },
  // 黑暗属性
  {
    id: 'hei-an-bian-fu',
    name: '深海水纹蝠',
    areaTier: 'outer',
    baseHpPerYear: 0.65,
    baseAtkPerYear: 0.12,
    baseDefPerYear: 0.04,
    baseSpdPerYear: 0.2,
    skills: [{ name: '暗夜声波', desc: '发出黑暗音波扰乱敌人' }],
  element: '水属性',
    description: '栖息于深海洞穴中的蝠形魂兽，靠水流波动定位猎物，利爪附带寒水之力。',
  },
  // 精神属性
  {
    id: 'jing-shen-tu',
    name: '灵眸兔',
    areaTier: 'outer',
    baseHpPerYear: 0.55,
    baseAtkPerYear: 0.08,
    baseDefPerYear: 0.04,
    baseSpdPerYear: 0.18,
    skills: [{ name: '精神干扰', desc: '发出精神波动干扰敌人' }],
    description: '天生精神力灵敏的小型魂兽',
     element: '精神属性',
  },
  // 混沌属性（外围极稀有，作为彩蛋）
  {
    id: 'hun-duan-chong',
    name: '混沌虫',
    areaTier: 'outer',
    baseHpPerYear: 0.7,
    baseAtkPerYear: 0.14,
    baseDefPerYear: 0.06,
    baseSpdPerYear: 0.16,
    skills: [{ name: '混沌之力', desc: '释放微弱的空间能量' }],
    description: '极其稀有的空间属性微小型魂兽',
    element: '空间属性',
  },

  // ===== 外围区补充：元素系 + 时空系（混沌属性）=====
  // 混沌属性·时空系
  {
    id: 'shi-kong-chong',
    name: '时空虫',
    areaTier: 'outer',
    baseHpPerYear: 0.3,
    baseAtkPerYear: 0.08,
    baseDefPerYear: 0.02,
    baseSpdPerYear: 0.25,
    skills: [{ name: '时空扭曲', desc: '微小时空涟漪造成诡异伤害' }],
    description: '栖息于时空裂隙中的微小虫类魂兽，蕴含稀薄空间之力',
    element: '空间属性',
  },
  {
    id: 'kong-jian-tu',
    name: '虚空兔',
    areaTier: 'outer',
    baseHpPerYear: 0.55,
    baseAtkPerYear: 0.1,
    baseDefPerYear: 0.04,
    baseSpdPerYear: 0.32,
    skills: [{ name: '空间跳跃', desc: '短距离空间瞬移躲避攻击' }],
    description: '能进行短距离空间跳跃的兔形魂兽，空间属性',
    element: '空间属性',
  },
  {
    id: 'shi-jian-she',
    name: '时之蛇',
    areaTier: 'outer',
    baseHpPerYear: 0.6,
    baseAtkPerYear: 0.11,
    baseDefPerYear: 0.05,
    baseSpdPerYear: 0.18,
    skills: [{ name: '时间迟缓', desc: '令目标动作短暂迟缓' }],
    description: '身上流淌着稀薄时间之力的蛇形魂兽，时间属性',
    element: '时间属性',
  },
  // 时间属性（外围）
  {
    id: 'shi-guang-chong',
    name: '时光虫',
    areaTier: 'outer',
    baseHpPerYear: 0.5,
    baseAtkPerYear: 0.09,
    baseDefPerYear: 0.03,
    baseSpdPerYear: 0.2,
    skills: [{ name: '时光流速', desc: '改变自身周围时间流速，诡异闪避攻击' }],
    description: '栖息在时间夹缝中的微小虫类魂兽，时间属性',
    element: '时间属性',
  },
  {
    id: 'zhong-biao-jing',
    name: '钟表精',
    areaTier: 'outer',
    baseHpPerYear: 0.7,
    baseAtkPerYear: 0.12,
    baseDefPerYear: 0.06,
    baseSpdPerYear: 0.12,
    skills: [{ name: '秒针切割', desc: '凝聚时间之力如秒针般切割敌人' }],
    description: '形如古老钟表的精怪魂兽，时间属性',
    element: '时间属性',
  },
  // 空间属性（外围）
  {
    id: 'kong-jian-xie',
    name: '空间刃蝎',
    areaTier: 'outer',
    baseHpPerYear: 0.6,
    baseAtkPerYear: 0.13,
    baseDefPerYear: 0.07,
    baseSpdPerYear: 0.22,
    skills: [{ name: '尾刺空间', desc: '尾刺破开空间造成诡异伤害' }],
    description: '尾尖含空间之力的小型蝎类魂兽，空间属性',
    element: '空间属性',
  },
  {
    id: 'xu-kong-ling',
    name: '虚空灵',
    areaTier: 'outer',
    baseHpPerYear: 0.45,
    baseAtkPerYear: 0.1,
    baseDefPerYear: 0.02,
    baseSpdPerYear: 0.28,
    skills: [{ name: '虚空穿梭', desc: '短距离空间移动躲避攻击' }],
    description: '游荡在虚空夹缝中的灵体魂兽，空间属性',
    element: '空间属性',
  },
  // 金属性
  {
    id: 'jin-tie-shou',
    name: '金铁兽',
    areaTier: 'outer',
    baseHpPerYear: 1.1,
    baseAtkPerYear: 0.17,
    baseDefPerYear: 0.15,
    baseSpdPerYear: 0.09,
    skills: [{ name: '金铁之躯', desc: '全身金铁化提升攻防' }],
    description: '通体如金铁铸就的小型兽类魂兽',
    element: '金属性',
  },
  {
    id: 'yin-jia-shou',
    name: '银甲兽',
    areaTier: 'outer',
    baseHpPerYear: 1.3,
    baseAtkPerYear: 0.15,
    baseDefPerYear: 0.18,
    baseSpdPerYear: 0.07,
    skills: [{ name: '银甲护御', desc: '银质甲壳大幅提升防御' }],
    description: '身披银色甲壳的防御型魂兽',
    element: '金属性',
  },
  // 木属性
  {
    id: 'teng-man-guai',
    name: '缠魂藤蔓',
    areaTier: 'outer',
    baseHpPerYear: 0.9,
    baseAtkPerYear: 0.1,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.04,
    skills: [{ name: '藤蔓缠绕', desc: '藤蔓束缚并持续汲取生命' }],
    description: '由藤蔓聚合而成的植物系魂兽',
    element: '木属性',
  },
  {
    id: 'shu-jing',
    name: '古树精',
    areaTier: 'outer',
    baseHpPerYear: 1.2,
    baseAtkPerYear: 0.09,
    baseDefPerYear: 0.12,
    baseSpdPerYear: 0.03,
    skills: [{ name: '根须穿刺', desc: '地下根须破土而出穿刺敌人' }],
    description: '觉醒灵智的小型树精灵魂兽',
    element: '木属性',
  },
  // 水属性
  {
    id: 'shui-yuan-su',
    name: '水之元素',
    areaTier: 'outer',
    baseHpPerYear: 0.7,
    baseAtkPerYear: 0.1,
    baseDefPerYear: 0.06,
    baseSpdPerYear: 0.14,
    skills: [{ name: '水箭术', desc: '凝聚水箭射向敌人' }],
    description: '纯粹水元素凝聚而成的灵体魂兽',
    element: '水属性',
  },
  {
    id: 'shui-ling',
    name: '水灵精',
    areaTier: 'outer',
    baseHpPerYear: 0.65,
    baseAtkPerYear: 0.12,
    baseDefPerYear: 0.05,
    baseSpdPerYear: 0.16,
    skills: [{ name: '水幕天华', desc: '召唤水幕防御并反弹部分伤害' }],
    description: '拥有初步灵智的水属性精灵魂兽',
    element: '水属性',
  },
  // 火属性
  {
    id: 'huo-yuan-su',
    name: '火之元素',
    areaTier: 'outer',
    baseHpPerYear: 0.6,
    baseAtkPerYear: 0.16,
    baseDefPerYear: 0.03,
    baseSpdPerYear: 0.15,
    skills: [{ name: '火焰弹', desc: '凝聚火焰弹轰击敌人' }],
    description: '纯粹火元素凝聚而成的灵体魂兽',
    element: '火属性',
  },
  {
    id: 'huo-ling',
    name: '火灵精',
    areaTier: 'outer',
    baseHpPerYear: 0.55,
    baseAtkPerYear: 0.18,
    baseDefPerYear: 0.04,
    baseSpdPerYear: 0.17,
    skills: [{ name: '烈焰风暴', desc: '掀起小型烈焰风暴' }],
    description: '拥有灵智的火属性精灵魂兽',
    element: '火属性',
  },
  // 土属性
  {
    id: 'tu-yuan-su',
    name: '土之元素',
    areaTier: 'outer',
    baseHpPerYear: 1.2,
    baseAtkPerYear: 0.09,
    baseDefPerYear: 0.14,
    baseSpdPerYear: 0.04,
    skills: [{ name: '岩石护盾', desc: '凝聚岩石护盾提升防御' }],
    description: '纯粹土元素凝聚而成的灵体魂兽',
    element: '土属性',
  },
  {
    id: 'yan-shi-guai',
    name: '磐岩怪',
    areaTier: 'outer',
    baseHpPerYear: 1.5,
    baseAtkPerYear: 0.1,
    baseDefPerYear: 0.17,
    baseSpdPerYear: 0.03,
    skills: [{ name: '岩石冲撞', desc: '岩石身躯猛烈冲撞' }],
    description: '由岩石构成的人形魂兽，防御力极强',
    element: '土属性',
  },
  // 冰属性
  {
    id: 'bing-yuan-su',
    name: '冰之元素',
    areaTier: 'outer',
    baseHpPerYear: 0.6,
    baseAtkPerYear: 0.12,
    baseDefPerYear: 0.05,
    baseSpdPerYear: 0.12,
    skills: [{ name: '冰锥术', desc: '凝聚冰锥刺向敌人' }],
    description: '纯粹冰元素凝聚而成的灵体魂兽',
    element: '冰属性',
  },
  {
    id: 'bing-shuang-lang',
    name: '冰霜雪狼',
    areaTier: 'outer',
    baseHpPerYear: 1.0,
    baseAtkPerYear: 0.16,
    baseDefPerYear: 0.07,
    baseSpdPerYear: 0.22,
    skills: [{ name: '冰霜撕咬', desc: '冰霜之力加持的撕咬攻击' }],
    description: '栖息于冰原的冰属性狼形魂兽',
    element: '冰属性',
  },
  // 雷属性
  {
    id: 'lei-yuan-su',
    name: '雷之元素',
    areaTier: 'outer',
    baseHpPerYear: 0.55,
    baseAtkPerYear: 0.17,
    baseDefPerYear: 0.03,
    baseSpdPerYear: 0.25,
    skills: [{ name: '雷击术', desc: '召唤雷电劈击敌人' }],
    description: '纯粹雷元素凝聚而成的灵体魂兽',
    element: '火属性',
  },
  {
    id: 'dian-man',
    name: '紫电鳗',
    areaTier: 'outer',
    baseHpPerYear: 0.85,
    baseAtkPerYear: 0.15,
    baseDefPerYear: 0.05,
    baseSpdPerYear: 0.18,
    skills: [{ name: '雷电吐息', desc: '释放电弧麻痹敌人' }],
    description: '通体带电的鳗鱼魂兽，擅长麻痹攻击',
    element: '火属性',
  },
  // 风属性
  {
    id: 'feng-yuan-su',
    name: '风之精灵',
    areaTier: 'outer',
    baseHpPerYear: 0.5,
    baseAtkPerYear: 0.1,
    baseDefPerYear: 0.03,
    baseSpdPerYear: 0.28,
    skills: [{ name: '风刃术', desc: '凝聚风刃切割敌人' }],
    description: '纯粹风元素凝聚而成的灵体魂兽',
    element: '木属性',
  },
  {
    id: 'feng-ling-niao',
    name: '凌风雀',
    areaTier: 'outer',
    baseHpPerYear: 0.6,
    baseAtkPerYear: 0.12,
    baseDefPerYear: 0.04,
    baseSpdPerYear: 0.28,
    skills: [{ name: '风之翔击', desc: '借助风力高速俯冲攻击' }],
    description: '与风同息的小型飞禽魂兽',
    element: '木属性',
  },
  // 光明属性
  {
    id: 'guang-yuan-su',
    name: '光之元素',
    areaTier: 'outer',
    baseHpPerYear: 0.55,
    baseAtkPerYear: 0.13,
    baseDefPerYear: 0.05,
    baseSpdPerYear: 0.2,
    skills: [{ name: '光之箭', desc: '凝聚光箭射穿敌人' }],
    description: '纯粹光明元素凝聚而成的灵体魂兽',
    element: '光属性',
  },
  {
    id: 'sheng-guang-lu',
    name: '圣光神鹿',
    areaTier: 'outer',
    baseHpPerYear: 0.9,
    baseAtkPerYear: 0.12,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.2,
    skills: [{ name: '圣光治愈', desc: '圣光之力恢复自身状态' }],
    description: '身披圣光的祥瑞鹿形魂兽',
    element: '光属性',
  },
  // 黑暗属性
  {
    id: 'an-yuan-su',
    name: '虚空元素',
    areaTier: 'outer',
    baseHpPerYear: 0.6,
    baseAtkPerYear: 0.14,
    baseDefPerYear: 0.04,
    baseSpdPerYear: 0.18,
    skills: [{ name: '暗影箭', desc: '凝聚暗影之力侵蚀敌人' }],
  element: '空间属性',
    description: '由纯粹虚空之力凝聚而成的元素生命，无形无质，擅长空间穿梭与扭曲。',
  },
  {
    id: 'an-ying-lang',
    name: '玄铁幽狼',
    areaTier: 'outer',
    baseHpPerYear: 0.95,
    baseAtkPerYear: 0.17,
    baseDefPerYear: 0.06,
    baseSpdPerYear: 0.24,
    skills: [{ name: '暗影突袭', desc: '融入暗影后突然袭击' }],
  element: '金属性',
    description: '出没于玄铁矿山的幽狼，毛发坚硬如钢，獠牙锋利可碎金断石。',
  },
  // 精神属性
  {
    id: 'jing-shen-yuan-su',
    name: '精神元素',
    areaTier: 'outer',
    baseHpPerYear: 0.45,
    baseAtkPerYear: 0.08,
    baseDefPerYear: 0.03,
    baseSpdPerYear: 0.15,
    skills: [{ name: '精神冲击', desc: '精神力直接冲击敌识海' }],
    description: '纯粹精神力凝聚而成的灵体魂兽',
     element: '精神属性',
  },
  {
    id: 'nian-li-shou',
    name: '念力玄兽',
    areaTier: 'outer',
    baseHpPerYear: 0.7,
    baseAtkPerYear: 0.1,
    baseDefPerYear: 0.06,
    baseSpdPerYear: 0.12,
    skills: [{ name: '念力控物', desc: '用念力操控物体攻击' }],
    description: '拥有初级念力的奇异魂兽',
     element: '精神属性',
   },
   {
     id: 'xin-ling-die',
     name: '心灵幻蝶',
     areaTier: 'outer',
     baseHpPerYear: 0.55,
     baseAtkPerYear: 0.09,
     baseDefPerYear: 0.04,
     baseSpdPerYear: 0.2,
     skills: [{ name: '心灵幻象', desc: '制造幻象迷惑敌人心智' }],
     description: '鳞粉能制造心灵幻象的小型蝶类魂兽',
     element: '精神属性',
   },
   {
     id: 'meng-jing-shou',
     name: '梦游兽',
     areaTier: 'outer',
     baseHpPerYear: 0.65,
     baseAtkPerYear: 0.07,
     baseDefPerYear: 0.05,
     baseSpdPerYear: 0.1,
     skills: [{ name: '梦境缠绕', desc: '令敌陷入梦境般的恍惚状态' }],
     description: '终日嗜睡的小型魂兽，能释放精神波动令敌昏睡',
     element: '精神属性',
   },

  // === 中部区：千年魂兽为主，偶有低阶万年 ===
  // 时间属性（中部）
  {
    id: 'shi-kong-die',
    name: '时光蝶',
    areaTier: 'middle',
    baseHpPerYear: 0.5,
    baseAtkPerYear: 0.14,
    baseDefPerYear: 0.04,
    baseSpdPerYear: 0.35,
    skills: [{ name: '时空鳞粉', desc: '鳞粉干扰时间流速，令敌动作迟缓' }],
    description: '翅膀上流转着时空纹路的美丽蝶类魂兽，时间属性',
    element: '时间属性',
  },
  {
    id: 'sui-yue-lang',
    name: '岁月狼',
    areaTier: 'middle',
    baseHpPerYear: 0.75,
    baseAtkPerYear: 0.16,
    baseDefPerYear: 0.07,
    baseSpdPerYear: 0.25,
    skills: [{ name: '岁月侵蚀', desc: '时间之力侵蚀敌人体魄，造成持续伤害' }],
    description: '毛发银白的狼形魂兽，身上流淌着岁月之力，时间属性',
    element: '时间属性',
  },
  // 空间属性（中部）
  {
    id: 'xu-kong-lang',
    name: '虚空魔狼',
    areaTier: 'middle',
    baseHpPerYear: 0.7,
    baseAtkPerYear: 0.17,
    baseDefPerYear: 0.06,
    baseSpdPerYear: 0.3,
    skills: [{ name: '虚空突袭', desc: '破开虚空从意想不到的角度突袭' }],
    description: '能短距离虚空穿梭的狼形魂兽，空间属性',
    element: '空间属性',
  },
  {
    id: 'ci-yuan-shou',
    name: '次元兽',
    areaTier: 'middle',
    baseHpPerYear: 0.65,
    baseAtkPerYear: 0.15,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.22,
    skills: [{ name: '次元撕裂', desc: '撕开次元裂缝造成诡异切割伤害' }],
    description: '能撕裂空间的奇异魂兽，形如四足走兽，空间属性',
    element: '空间属性',
  },
  {
    id: 'ren-mian-mo-zhu',
    name: '人面魔蛛',
    areaTier: 'middle',
    baseHpPerYear: 0.6,
    baseAtkPerYear: 0.12,
    baseDefPerYear: 0.05,
    baseSpdPerYear: 0.1,
    skills: [{ name: '蛛网束缚', desc: '喷射蛛网束缚敌人' }],
    description: '剧毒且狡猾的蛛形魂兽',
    element: '木属性',
  },
  {
    id: 'gui-hu',
    name: '赤焰鬼虎',
    areaTier: 'middle',
    baseHpPerYear: 0.8,
    baseAtkPerYear: 0.15,
    baseDefPerYear: 0.06,
    baseSpdPerYear: 0.18,
    skills: [{ name: '鬼影分身', desc: '分身迷惑敌人' }],
  element: '火属性',
    description: '凶煞的鬼虎魂兽，身具赤炎邪力，嘶吼声震彻山林，焚尽万物。',
  },
  {
    id: 'lin-jia-shou',
    name: '铁甲鳞兽',
    areaTier: 'middle',
    baseHpPerYear: 1.2,
    baseAtkPerYear: 0.1,
    baseDefPerYear: 0.12,
    baseSpdPerYear: 0.06,
    skills: [{ name: '鳞甲护盾', desc: '全身鳞甲硬化防御' }],
    description: '鳞甲坚硬的防御型魂兽',
    element: '土属性',
  },
  {
    id: 'huo-yan-shi-wang',
    name: '赤焰狮王',
    areaTier: 'middle',
    baseHpPerYear: 0.9,
    baseAtkPerYear: 0.16,
    baseDefPerYear: 0.07,
    baseSpdPerYear: 0.1,
    skills: [{ name: '烈焰冲击波', desc: '喷射炽热火焰' }],
    description: '掌控火焰之力的狮王',
    element: '火属性',
  },
  {
    id: 'bing-bi-xie',
    name: '冰碧蝎(幼体)',
    areaTier: 'middle',
    baseHpPerYear: 0.85,
    baseAtkPerYear: 0.14,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.09,
    skills: [{ name: '冰碧毒刺', desc: '剧毒冰刺攻击' }],
    description: '冰碧色的剧毒蝎子',
    element: '冰属性',
  },
  {
    id: 'du-jiao-mo-niu',
    name: '独角蛮牛',
    areaTier: 'middle',
    baseHpPerYear: 1.4,
    baseAtkPerYear: 0.15,
    baseDefPerYear: 0.13,
    baseSpdPerYear: 0.07,
    skills: [{ name: '独角突进', desc: '以独角发动狂暴冲锋' }],
    description: '头生独角的巨型牛类魂兽',
    element: '土属性',
  },
  {
    id: 'an-ying-bao',
    name: '疾风魔豹',
    areaTier: 'middle',
    baseHpPerYear: 0.75,
    baseAtkPerYear: 0.17,
    baseDefPerYear: 0.06,
    baseSpdPerYear: 0.22,
    skills: [{ name: '暗影突袭', desc: '融入阴影瞬间突袭' }],
  element: '木属性',
    description: '丛林中的疾行者，魔豹速度极快，攻击如风随形，防不胜防。',
  },
  {
    id: 'chi-jia-shou',
    name: '赤甲火兽',
    areaTier: 'middle',
    baseHpPerYear: 1.3,
    baseAtkPerYear: 0.13,
    baseDefPerYear: 0.14,
    baseSpdPerYear: 0.05,
    skills: [{ name: '赤甲爆发', desc: '全身赤红甲胄爆发' }],
    description: '身披赤色坚甲的防御魂兽',
    element: '火属性',
  },
  {
    id: 'du-wu-she',
    name: '九毒雾蛇',
    areaTier: 'middle',
    baseHpPerYear: 0.8,
    baseAtkPerYear: 0.14,
    baseDefPerYear: 0.07,
    baseSpdPerYear: 0.12,
    skills: [{ name: '毒雾弥漫', desc: '释放剧毒迷雾' }],
    description: '身含剧毒的雾蛇',
    element: '木属性',
  },
  {
    id: 'han-shui-jiao',
    name: '寒水玄蛟',
    areaTier: 'middle',
    baseHpPerYear: 0.85,
    baseAtkPerYear: 0.13,
    baseDefPerYear: 0.09,
    baseSpdPerYear: 0.14,
    skills: [{ name: '寒水激流', desc: '释放冰冷的水流冲击' }],
    description: '栖息在深潭中的水属性魂兽',
    element: '冰属性',
  },
  {
    id: 'sheng-guang-linglu',
    name: '圣光灵鹿',
    areaTier: 'middle',
    baseHpPerYear: 0.7,
    baseAtkPerYear: 0.12,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.16,
    skills: [{ name: '圣光普照', desc: '释放圣光净化一切' }],
    description: '身披圣光的祥瑞之兽',
    element: '光属性',
  },

  // ===== 中部区补充：混沌属性时空系（千年级）=====
  {
    id: 'xu-kong-bian-fu',
    name: '虚空魔蝠',
    areaTier: 'middle',
    baseHpPerYear: 0.85,
    baseAtkPerYear: 0.16,
    baseDefPerYear: 0.06,
    baseSpdPerYear: 0.3,
    skills: [{ name: '虚空潜行', desc: '遁入虚空短暂消失并突袭' }],
    description: '栖息于空间裂隙中的蝙蝠魂兽，掌握虚空之力',
    element: '空间属性',
  },
  {
    id: 'shi-kong-lang',
    name: '时空裂狼',
    areaTier: 'middle',
    baseHpPerYear: 1.1,
    baseAtkPerYear: 0.2,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.28,
    skills: [{ name: '时空裂爪', desc: '撕裂时空的爪击造成双重伤害' }],
    description: '身披时空纹理的狼形魂兽，混沌时空属性',
    element: '空间属性',
  },

  // === 内圈：低阶万年 ~ 高阶万年魂兽 ===
  // 时间属性（内圈）
  {
    id: 'sui-yue-shou',
    name: '岁月兽',
    areaTier: 'inner',
    baseHpPerYear: 0.9,
    baseAtkPerYear: 0.2,
    baseDefPerYear: 0.09,
    baseSpdPerYear: 0.22,
    skills: [{ name: '岁月回溯', desc: '短暂回溯时间，抵消部分伤害并重击敌人' }],
    description: '形如古老麒麟的魂兽，浑身流转岁月之光，时间属性',
    element: '时间属性',
  },
  {
    id: 'shi-guang-tian-e',
    name: '时光天鹅',
    areaTier: 'inner',
    baseHpPerYear: 0.8,
    baseAtkPerYear: 0.18,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.35,
    skills: [{ name: '时光长河', desc: '召唤时光长河冲刷敌人，造成大范围伤害' }],
    description: '羽毛闪耀着时间光芒的天鹅形魂兽，时间属性',
    element: '时间属性',
  },
  // 空间属性（内圈）
  {
    id: 'kong-jian-long-ya',
    name: '空间龙牙兽',
    areaTier: 'inner',
    baseHpPerYear: 1.0,
    baseAtkPerYear: 0.22,
    baseDefPerYear: 0.1,
    baseSpdPerYear: 0.25,
    skills: [{ name: '空间龙爪', desc: '龙爪撕开空间，造成撕裂伤害' }],
    description: '形似龙裔的凶猛魂兽，爪间蕴含空间之力，空间属性',
    element: '空间属性',
  },
  {
    id: 'xu-wu-kun',
    name: '虚无噬鲲',
    areaTier: 'inner',
    baseHpPerYear: 1.1,
    baseAtkPerYear: 0.19,
    baseDefPerYear: 0.12,
    baseSpdPerYear: 0.18,
    skills: [{ name: '虚无吞噬', desc: '张开虚空巨口吞噬敌人攻击并反击' }],
    description: '游荡在高空虚空层的巨型魂兽，空间属性',
    element: '空间属性',
  },
  {
    id: 'tai-tan-ju-yuan',
    name: '泰坦巨猿',
    areaTier: 'inner',
    baseHpPerYear: 1.2,
    baseAtkPerYear: 0.18,
    baseDefPerYear: 0.1,
    baseSpdPerYear: 0.08,
    skills: [{ name: '泰坦之力', desc: '凝聚巨力重击造成毁灭性伤害' }],
    description: '森林之王，力量型顶级魂兽',
    element: '土属性',
  },
  {
    id: 'tian-qing-niu-mang',
    name: '天青牛蟒',
    areaTier: 'inner',
    baseHpPerYear: 1.0,
    baseAtkPerYear: 0.2,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.07,
    skills: [{ name: '青天寂灭雷', desc: '召唤天雷毁天灭地' }],
    description: '星斗森林主宰之一',
    element: '火属性',
  },
  {
    id: 'an-mo-xie-shen-hu',
    name: '暗魔邪神虎',
    areaTier: 'inner',
    baseHpPerYear: 0.9,
    baseAtkPerYear: 0.22,
    baseDefPerYear: 0.07,
    baseSpdPerYear: 0.12,
    skills: [{ name: '暗魔邪神变', desc: '邪神之力全面爆发' }],
    description: '邪恶而强大的顶级魂兽',
    element: '暗属性',
  },
  {
    id: 'san-yan-jin-ni',
    name: '三眼金猊',
    areaTier: 'inner',
    baseHpPerYear: 0.8,
    baseAtkPerYear: 0.16,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.15,
    skills: [{ name: '命运之眼', desc: '第三只眼洞察命运' }],
    description: '瑞兽三眼金猊，极其稀有',
    element: '空间属性',
  },
  {
    id: 'bing-bi-di-huang-xie',
    name: '冰碧帝皇蝎',
    areaTier: 'inner',
    baseHpPerYear: 0.9,
    baseAtkPerYear: 0.19,
    baseDefPerYear: 0.09,
    baseSpdPerYear: 0.1,
    skills: [{ name: '冰帝之螯', desc: '极寒之力冻结一切' }],
    description: '极北三大天王之一',
    element: '冰属性',
  },
  {
    id: 'huang-jin-dai-mao',
    name: '黄金玳瑁',
    areaTier: 'inner',
    baseHpPerYear: 1.6,
    baseAtkPerYear: 0.1,
    baseDefPerYear: 0.18,
    baseSpdPerYear: 0.04,
    skills: [{ name: '黄金守护', desc: '坚不可摧的龟甲防御' }],
    description: '黄金血脉的防御型龟类魂兽',
    element: '金属性',
  },
  {
    id: 'chi-jia-long',
    name: '赤甲火龙',
    areaTier: 'inner',
    baseHpPerYear: 1.3,
    baseAtkPerYear: 0.17,
    baseDefPerYear: 0.13,
    baseSpdPerYear: 0.06,
    skills: [{ name: '赤龙咆哮', desc: '赤龙之焰焚尽万物' }],
    description: '身披赤甲的亚龙种魂兽',
    element: '火属性',
  },
  {
    id: 'zi-ji-mo-lang',
    name: '紫雷魔狼',
    areaTier: 'inner',
    baseHpPerYear: 0.85,
    baseAtkPerYear: 0.18,
    baseDefPerYear: 0.07,
    baseSpdPerYear: 0.16,
    skills: [{ name: '紫电狼啸', desc: '紫色电芒随狼啸迸发' }],
    description: '通体紫色的魔狼首领',
    element: '火属性',
  },
  {
    id: 'gu-long',
    name: '骸骨邪龙',
    areaTier: 'inner',
    baseHpPerYear: 1.1,
    baseAtkPerYear: 0.19,
    baseDefPerYear: 0.11,
    baseSpdPerYear: 0.09,
    skills: [{ name: '骨龙吐息', desc: '死亡龙息侵蚀生命' }],
    description: '由骸骨构成的亡灵龙族',
    element: '暗属性',
  },
  {
    id: 'xuan-jin-shi',
    name: '玄金狮王',
    areaTier: 'inner',
    baseHpPerYear: 1.15,
    baseAtkPerYear: 0.22,
    baseDefPerYear: 0.13,
    baseSpdPerYear: 0.12,
    skills: [{ name: '玄金咆哮', desc: '金属之力汇聚的毁灭咆哮' }],
    description: '通体玄金的万年级狮类魂兽',
    element: '金属性',
  },
  {
    id: 'cang-hai-kun',
    name: '沧海玄鲲',
    areaTier: 'inner',
    baseHpPerYear: 1.3,
    baseAtkPerYear: 0.16,
    baseDefPerYear: 0.1,
    baseSpdPerYear: 0.08,
    skills: [{ name: '沧海横流', desc: '召唤无尽海水淹没一切' }],
    description: '传说中的巨型水属性魂兽',
    element: '水属性',
  },

  // === 核心区：十万年以上，多种顶级魂兽（非十大凶兽） ===
  {
    id: 'tai-tan-ju-yuan-10w',
    name: '泰坦巨猿王',
    areaTier: 'core',
    baseHpPerYear: 1.3,
    baseAtkPerYear: 0.22,
    baseDefPerYear: 0.11,
    baseSpdPerYear: 0.08,
    skills: [{ name: '泰坦之力', desc: '森林之王的力量重击' }],
    description: '星斗森林核心区的古老巨猿，十万年以上修为',
    element: '土属性',
  },
  {
    id: 'tian-qing-niu-mang-10w',
    name: '天青牛蟒神',
    areaTier: 'core',
    baseHpPerYear: 1.1,
    baseAtkPerYear: 0.24,
    baseDefPerYear: 0.09,
    baseSpdPerYear: 0.07,
    skills: [{ name: '青天寂灭雷', desc: '召唤天雷毁天灭地' }],
    description: '牛头蟒身的古老魂兽，十万年以上修为',
    element: '火属性',
  },
  {
    id: 'an-mo-xie-shen-hu-10w',
    name: '十万年暗魔邪神虎',
    areaTier: 'core',
    baseHpPerYear: 1.0,
    baseAtkPerYear: 0.26,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.13,
    skills: [{ name: '暗魔邪神变', desc: '邪神之力全面爆发' }],
    description: '邪神附体的虎类魂兽，十万年以上修为',
    element: '暗属性',
  },
  {
    id: 'ren-mian-mo-zhu-huang',
    name: '人面魔蛛皇',
    areaTier: 'core',
    baseHpPerYear: 0.9,
    baseAtkPerYear: 0.25,
    baseDefPerYear: 0.07,
    baseSpdPerYear: 0.11,
    skills: [{ name: '蛛皇噬咬', desc: '剧毒蛛皇撕咬吞噬' }],
    description: '人面魔蛛族群的皇者，十万年以上修为',
    element: '暗属性',
  },
  {
    id: 'xie-mo-hu-jing-wang',
    name: '邪魔虎鲸王',
    areaTier: 'core',
    baseHpPerYear: 1.2,
    baseAtkPerYear: 0.23,
    baseDefPerYear: 0.1,
    baseSpdPerYear: 0.12,
    skills: [{ name: '邪魔撕咬', desc: '邪魔之力的狂暴撕咬' }],
    description: '海洋中的霸主级魂兽，十万年以上修为',
    element: '暗属性',
  },
  {
    id: 'mo-hun-da-bai-sha-wang',
    name: '魔魂大白鲨王',
    areaTier: 'core',
    baseHpPerYear: 1.1,
    baseAtkPerYear: 0.21,
    baseDefPerYear: 0.09,
    baseSpdPerYear: 0.15,
    skills: [{ name: '魔魂撕咬', desc: '魔魂鲨族的毁灭撕咬' }],
    description: '魔魂大白鲨族群之王，十万年以上修为',
    element: '暗属性',
  },
  {
    id: 'bing-bi-xie-10w',
    name: '冰碧蝎王',
    areaTier: 'core',
    baseHpPerYear: 1.0,
    baseAtkPerYear: 0.22,
    baseDefPerYear: 0.1,
    baseSpdPerYear: 0.1,
    skills: [{ name: '冰碧毒刺', desc: '极寒冰毒的致命刺击' }],
    description: '冰碧色的巨型毒蝎，十万年以上修为',
    element: '冰属性',
  },
  {
    id: 'jin-yan-hei-long-wang',
    name: '金眼黑龙王',
    areaTier: 'core',
    baseHpPerYear: 1.4,
    baseAtkPerYear: 0.24,
    baseDefPerYear: 0.12,
    baseSpdPerYear: 0.09,
    skills: [{ name: '黑龙吐息', desc: '金色龙瞳的毁灭龙息' }],
    description: '黑龙一族的强者，十万年以上修为（非帝天）',
    element: '暗属性', // 原龙属性→黑暗属性（金眼黑龙王系列）
  },
  {
    id: 'chi-jia-long-huang',
    name: '赤甲龙皇',
    areaTier: 'core',
    baseHpPerYear: 1.35,
    baseAtkPerYear: 0.2,
    baseDefPerYear: 0.14,
    baseSpdPerYear: 0.07,
    skills: [{ name: '赤龙咆哮', desc: '赤甲龙皇的烈焰龙啸' }],
    description: '身披赤红龙甲的亚龙皇者，十万年以上修为',
    element: '火属性',
  },
  {
    id: 'zi-ji-mo-lang-wang',
    name: '紫雷魔狼王',
    areaTier: 'core',
    baseHpPerYear: 1.0,
    baseAtkPerYear: 0.22,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.18,
    skills: [{ name: '紫电狼啸', desc: '紫色雷电随狼啸迸发' }],
    description: '魔狼族群的至高王者，十万年以上修为',
    element: '火属性',
  },
  {
    id: 'huang-jin-dai-mao-10w',
    name: '黄金玳瑁王',
    areaTier: 'core',
    baseHpPerYear: 1.7,
    baseAtkPerYear: 0.13,
    baseDefPerYear: 0.2,
    baseSpdPerYear: 0.04,
    skills: [{ name: '黄金守护', desc: '坚不可摧的黄金龟甲' }],
    description: '黄金血脉的防御型龟类魂兽，十万年以上修为',
    element: '金属性',
  },
  {
    id: 'san-yan-jin-ni-10w',
    name: '三眼金猊王',
    areaTier: 'core',
    baseHpPerYear: 0.95,
    baseAtkPerYear: 0.19,
    baseDefPerYear: 0.09,
    baseSpdPerYear: 0.16,
    skills: [{ name: '命运之眼', desc: '第三只眼洞察命运' }],
    description: '瑞兽三眼金猊的王者，十万年以上修为',
    element: '空间属性',
  },
  {
    id: 'guang-ming-shen-long',
    name: '光明神龙',
    areaTier: 'core',
    baseHpPerYear: 1.25,
    baseAtkPerYear: 0.24,
    baseDefPerYear: 0.12,
    baseSpdPerYear: 0.15,
    skills: [{ name: '神圣审判', desc: '光明之力降下神圣审判' }],
    description: '沐浴神圣光辉的十万年龙族',
    element: '光属性',
  },
  {
    id: 'bai-lian-jin-gang',
    name: '百炼金刚',
    areaTier: 'core',
    baseHpPerYear: 1.4,
    baseAtkPerYear: 0.23,
    baseDefPerYear: 0.18,
    baseSpdPerYear: 0.08,
    skills: [{ name: '金刚不坏', desc: '金属之躯坚不可摧' }],
    description: '经百炼而成的金属性十万年魂兽',
    element: '金属性',
  },

  // === 生命之湖：十大凶兽（暂不开放，数据预留） ===
  {
    id: 'di-tian-lake',
    name: '金眼黑龙王·帝天',
    areaTier: 'life-lake',
    baseHpPerYear: 1.8,
    baseAtkPerYear: 0.3,
    baseDefPerYear: 0.15,
    baseSpdPerYear: 0.1,
    skills: [{ name: '龙神爪', desc: '龙神遗族的毁灭之爪' }],
    description: '魂兽共主，十大凶兽之首，八十万年修为',
    element: '暗属性', // 原龙属性→黑暗属性（金眼黑龙王系列）
  },
  {
    id: 'bi-ji-lake',
    name: '翡翠天鹅·碧姬',
    areaTier: 'life-lake',
    baseHpPerYear: 1.4,
    baseAtkPerYear: 0.14,
    baseDefPerYear: 0.11,
    baseSpdPerYear: 0.12,
    skills: [{ name: '祈愿之光', desc: '治愈万物的生命之光' }],
    description: '十大凶兽排名第二，生命属性，六十万年修为',
    element: '光属性', // 生命属性→木属性（翡翠天鹅·碧姬）
  },
  {
    id: 'wan-yao-wang-lake',
    name: '妖眼魔树·万妖王',
    areaTier: 'life-lake',
    baseHpPerYear: 1.3,
    baseAtkPerYear: 0.2,
    baseDefPerYear: 0.1,
    baseSpdPerYear: 0.06,
    skills: [{ name: '万妖朝拜', desc: '召唤万千妖灵攻击' }],
    description: '十大凶兽排名第三，植物系之王，五十万年修为',
    element: '木属性',
  },
  {
    id: 'xiong-jun-lake',
    name: '暗金恐爪熊王·熊君',
    areaTier: 'life-lake',
    baseHpPerYear: 1.7,
    baseAtkPerYear: 0.26,
    baseDefPerYear: 0.15,
    baseSpdPerYear: 0.08,
    skills: [{ name: '寂灭撕裂', desc: '恐爪王的毁灭一击' }],
    description: '十大凶兽排名第六，暗金恐爪熊族之王，四十万年修为',
    element: '暗属性',
  },
  {
    id: 'chi-wang-lake',
    name: '三头赤魔獒·赤王',
    areaTier: 'life-lake',
    baseHpPerYear: 1.5,
    baseAtkPerYear: 0.24,
    baseDefPerYear: 0.12,
    baseSpdPerYear: 0.14,
    skills: [{ name: '赤焰焚天', desc: '三头齐喷的毁灭之火' }],
    description: '十大凶兽排名第八，火属性之王，三十万年修为',
    element: '火属性',
  },
  {
    id: 'bing-di-lake',
    name: '冰碧帝皇蝎·冰帝',
    areaTier: 'life-lake',
    baseHpPerYear: 1.2,
    baseAtkPerYear: 0.25,
    baseDefPerYear: 0.12,
    baseSpdPerYear: 0.12,
    skills: [{ name: '冰皇之怒', desc: '四十万年极致之冰爆发' }],
    description: '极北三大天王之二，四十万年修为',
    element: '冰属性',
  },
  {
    id: 'xue-di-lake',
    name: '冰天雪女·雪帝',
    areaTier: 'life-lake',
    baseHpPerYear: 1.3,
    baseAtkPerYear: 0.24,
    baseDefPerYear: 0.11,
    baseSpdPerYear: 0.16,
    skills: [{ name: '寒极冰封神域', desc: '七十万年极寒领域冻结天地' }],
    description: '极北三大天王之首，七十万年修为',
    element: '冰属性',
  },
  {
    id: 'xie-di-lake',
    name: '邪眼暴君主宰·邪帝',
    areaTier: 'life-lake',
    baseHpPerYear: 1.15,
    baseAtkPerYear: 0.27,
    baseDefPerYear: 0.09,
    baseSpdPerYear: 0.11,
    skills: [{ name: '邪眼凝视', desc: '精神攻击震慑灵魂' }],
    description: '邪魔森林主宰，精神属性，七十九万年修为',
      element: '精神属性',
   },
   {
     id: 'wang-si-you-ling',
     name: '忘川幽灵',
     areaTier: 'life-lake',
     baseHpPerYear: 0.95,
     baseAtkPerYear: 0.26,
     baseDefPerYear: 0.08,
     baseSpdPerYear: 0.18,
     skills: [{ name: '忘川之噬', desc: '吞噬记忆与精神，令敌魂飞魄散' }],
     description: '传说中栖息于生死之间的精神属性凶兽，五十万年以上修为',
     element: '精神属性',
   },
  {
    id: 'ji-di-bai-hu-lake',
    name: '极玄冰兽',
    areaTier: 'life-lake',
    baseHpPerYear: 1.4,
    baseAtkPerYear: 0.23,
    baseDefPerYear: 0.13,
    baseSpdPerYear: 0.13,
    skills: [{ name: '极寒之渊', desc: '绝对零度的极寒领域' }],
    description: '极北冰原的神秘霸主，不详的古老存在',
    element: '冰属性',
  },
  {
    id: 'zi-jing-di-wang-lake',
    name: '紫姬·魔后',
    areaTier: 'life-lake',
    baseHpPerYear: 1.0,
    baseAtkPerYear: 0.22,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.2,
    skills: [{ name: '天魔舞', desc: '魅惑众生的天魔之舞' }],
    description: '十大凶兽之一，速度与魅惑的王者',
    element: '暗属性',
  },
  {
    id: 'jin-gang-bi-xie',
    name: '金刚貔貅',
    areaTier: 'life-lake',
    baseHpPerYear: 1.35,
    baseAtkPerYear: 0.25,
    baseDefPerYear: 0.2,
    baseSpdPerYear: 0.1,
    skills: [{ name: '吞天纳地', desc: '金属之力吞噬万物' }],
    description: '传说中的金属性凶兽之王',
    element: '金属性',
  },
  {
    id: 'guang-ming-tian-shi',
    name: '光明天使',
    areaTier: 'life-lake',
    baseHpPerYear: 1.15,
    baseAtkPerYear: 0.26,
    baseDefPerYear: 0.12,
    baseSpdPerYear: 0.18,
    skills: [{ name: '神圣之光', desc: '最纯粹的光明之力' }],
    description: '降临人间的光明神祇化身',
    element: '光属性',
  },

  // ====== 补充：更多属性覆盖的魂兽 ======

  // —— 外围区补充：力量/防御/辅助/冰/火/水/雷/黑暗/毒/精神 ——
  {
    id: 'bao-li-xiong',
    name: '暴力棕熊',
    areaTier: 'outer',
    baseHpPerYear: 1.2,
    baseAtkPerYear: 0.18,
    baseDefPerYear: 0.1,
    baseSpdPerYear: 0.08,
    skills: [{ name: '蛮力重击', desc: '以绝对力量砸击敌人' }],
    description: '力大无穷的力量型魂兽，强攻系克星',
    element: '土属性',
  },
  {
    id: 'gang-tie-gui',
    name: '钢铁甲龟',
    areaTier: 'outer',
    baseHpPerYear: 1.5,
    baseAtkPerYear: 0.06,
    baseDefPerYear: 0.18,
    baseSpdPerYear: 0.04,
    skills: [{ name: '铁壁防御', desc: '全身甲壳硬化，防御力暴涨' }],
    description: '防御极强的龟类魂兽，防御系首选',
    element: '土属性',
  },
  {
    id: 'guang-hui-lu',
    name: '光辉圣鹿',
    areaTier: 'outer',
    baseHpPerYear: 0.9,
    baseAtkPerYear: 0.08,
    baseDefPerYear: 0.07,
    baseSpdPerYear: 0.12,
    skills: [{ name: '治愈光辉', desc: '释放柔和光芒恢复队友气血' }],
    description: '性格温和的辅助系魂兽，具有治愈之力',
    element: '光属性',
  },
  {
    id: 'han-bing-she',
    name: '寒冰蝰蛇',
    areaTier: 'outer',
    baseHpPerYear: 0.7,
    baseAtkPerYear: 0.14,
    baseDefPerYear: 0.04,
    baseSpdPerYear: 0.16,
    skills: [{ name: '冰刺突袭', desc: '凝结冰针刺向敌人' }],
    description: '栖息在阴凉处的冰属性蛇类魂兽',
    element: '冰属性',
  },
  {
    id: 'yan-huo-lang',
    name: '炎火狂狼',
    areaTier: 'outer',
    baseHpPerYear: 0.9,
    baseAtkPerYear: 0.17,
    baseDefPerYear: 0.05,
    baseSpdPerYear: 0.15,
    skills: [{ name: '烈焰撕咬', desc: '火焰包裹的獠牙撕咬敌人' }],
    description: '全身燃火的狼形魂兽，火属性',
    element: '火属性',
  },
  {
    id: 'shui-jing-shu',
    name: '水晶水獭',
    areaTier: 'outer',
    baseHpPerYear: 0.8,
    baseAtkPerYear: 0.1,
    baseDefPerYear: 0.06,
    baseSpdPerYear: 0.18,
    skills: [{ name: '水流刃', desc: '操控水流化作利刃攻击' }],
    description: '生活在水边的水属性可爱魂兽',
    element: '水属性',
  },
  {
    id: 'lei-yun-bao',
    name: '雷云玄豹',
    areaTier: 'outer',
    baseHpPerYear: 0.85,
    baseAtkPerYear: 0.16,
    baseDefPerYear: 0.05,
    baseSpdPerYear: 0.22,
    skills: [{ name: '闪电突袭', desc: '化身为雷电瞬间突进' }],
    description: '速度如闪电的雷属性魂兽',
    element: '火属性',
  },
  {
    id: 'an-ying-shu',
    name: '岩土幽鼠',
    areaTier: 'outer',
    baseHpPerYear: 0.6,
    baseAtkPerYear: 0.1,
    baseDefPerYear: 0.03,
    baseSpdPerYear: 0.2,
    skills: [{ name: '暗袭', desc: '融入阴影发动偷袭' }],
  element: '土属性',
    description: '栖息于地下岩层的幽鼠，体型虽小但牙齿锋利如钻，擅长破土偷袭。',
  },
  {
    id: 'mo-hua-die',
    name: '噬魔花蝶',
    areaTier: 'outer',
    baseHpPerYear: 0.55,
    baseAtkPerYear: 0.12,
    baseDefPerYear: 0.04,
    baseSpdPerYear: 0.1,
    skills: [{ name: '毒磷粉', desc: '洒落带有毒素的鳞粉' }],
    description: '美丽却致命的毒属性蝴蝶魂兽',
    element: '木属性',
  },
  {
    id: 'jing-shen-fu',
    name: '幻影蝠',
    areaTier: 'outer',
    baseHpPerYear: 0.6,
    baseAtkPerYear: 0.09,
    baseDefPerYear: 0.04,
    baseSpdPerYear: 0.2,
    skills: [{ name: '精神冲击', desc: '发出精神波动冲击敌人意识' }],
    description: '具有精神力天赋的蝙蝠魂兽，控制系适用',
     element: '精神属性',
  },

  // —— 中圈补充：力量/防御/辅助/冰/火/水/雷/光明/黑暗/金属性 ——
  {
    id: 'ju-li-yuan',
    name: '巨力玄猿',
    areaTier: 'middle',
    baseHpPerYear: 1.1,
    baseAtkPerYear: 0.22,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.1,
    skills: [{ name: '巨力捶地', desc: '双拳砸向地面引发冲击波' }],
    description: '力大无穷的千年级力量魂兽',
    element: '土属性',
  },
  {
    id: 'xuan-jia-xi',
    name: '玄甲岩犀',
    areaTier: 'middle',
    baseHpPerYear: 1.4,
    baseAtkPerYear: 0.12,
    baseDefPerYear: 0.2,
    baseSpdPerYear: 0.05,
    skills: [{ name: '玄岩护盾', desc: '全身覆盖岩石铠甲' }],
    description: '身披厚重甲壳的防御系魂兽',
    element: '土属性',
  },
  {
    id: 'sheng-yin-que',
    name: '圣音灵雀',
    areaTier: 'middle',
    baseHpPerYear: 0.8,
    baseAtkPerYear: 0.09,
    baseDefPerYear: 0.06,
    baseSpdPerYear: 0.18,
    skills: [{ name: '圣歌祝福', desc: '用歌声提升队友战力' }],
    description: '歌声具有治愈与增幅之力的辅助系魂兽',
    element: '光属性',
  },
  {
    id: 'xuan-bing-hu',
    name: '玄冰碧虎',
    areaTier: 'middle',
    baseHpPerYear: 1.0,
    baseAtkPerYear: 0.22,
    baseDefPerYear: 0.07,
    baseSpdPerYear: 0.16,
    skills: [{ name: '玄冰霜咬', desc: '冰气凝结的獠牙，命中即冻结' }],
    description: '千年级冰属性王者魂兽',
    element: '冰属性',
  },
  {
    id: 'chi-yan-niu',
    name: '炽焰蛮牛',
    areaTier: 'middle',
    baseHpPerYear: 1.2,
    baseAtkPerYear: 0.2,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.12,
    skills: [{ name: '火焰冲撞', desc: '全身火焰冲向敌人造成爆燃' }],
    description: '浑身烈焰的火属性牛形魂兽',
    element: '火属性',
  },
  {
    id: 'cang-lang-jiao',
    name: '苍浪玄蛟',
    areaTier: 'middle',
    baseHpPerYear: 1.1,
    baseAtkPerYear: 0.18,
    baseDefPerYear: 0.09,
    baseSpdPerYear: 0.14,
    skills: [{ name: '水龙波', desc: '凝聚水龙冲击敌人' }],
    description: '操控水流的蛟龙类魂兽',
    element: '水属性',
  },
  {
    id: 'zi-lei-yuan',
    name: '紫雷神猿',
    areaTier: 'middle',
    baseHpPerYear: 0.95,
    baseAtkPerYear: 0.21,
    baseDefPerYear: 0.07,
    baseSpdPerYear: 0.17,
    skills: [{ name: '雷霆一击', desc: '召唤雷电附在拳头上轰出' }],
    description: '身披紫色雷光的猿类魂兽',
    element: '火属性',
  },
  {
    id: 'jin-chi-ying',
    name: '金翅神鹰',
    areaTier: 'middle',
    baseHpPerYear: 0.85,
    baseAtkPerYear: 0.2,
    baseDefPerYear: 0.05,
    baseSpdPerYear: 0.22,
    skills: [{ name: '金刃俯冲', desc: '金色羽毛化作利刃从天而降' }],
    description: '羽毛如金属般锋利的金属性猛禽',
    element: '金属性',
  },
  {
    id: 'ming-guan-niao',
    name: '圣光冠雀',
    areaTier: 'middle',
    baseHpPerYear: 0.8,
    baseAtkPerYear: 0.18,
    baseDefPerYear: 0.05,
    baseSpdPerYear: 0.19,
    skills: [{ name: '冥火灼烧', desc: '释放幽冥黑焰灼烧魂魄' }],
  element: '光属性',
    description: ' rare 雀形魂兽，头顶圣光冠羽，叫声清亮如钟，能净化邪祟。',
  },
  {
    id: 'jing-shen-shuang-long',
    name: '双头灵蜥',
    areaTier: 'middle',
    baseHpPerYear: 0.9,
    baseAtkPerYear: 0.15,
    baseDefPerYear: 0.07,
    baseSpdPerYear: 0.12,
    skills: [{ name: '双重精神冲击', desc: '两个头颅同时发动精神攻击' }],
    description: '双头蜥蜴，精神力强大的控制系魂兽',
     element: '精神属性',
  },

  // ===== 中部区新增：12属性全面覆盖（千年级）=====
  // 金属性
  {
    id: 'tie-bei-di-long',
    name: '铁背地龙',
    areaTier: 'middle',
    baseHpPerYear: 1.2,
    baseAtkPerYear: 0.18,
    baseDefPerYear: 0.15,
    baseSpdPerYear: 0.06,
    skills: [{ name: '铁尾横扫', desc: '坚硬如铁的尾部横扫千军' }],
    description: '背覆铁甲的地行龙类魂兽',
    element: '金属性',
  },
  // 木属性
  {
    id: 'shi-hua-jing-gu',
    name: '食人花妖',
    areaTier: 'middle',
    baseHpPerYear: 1.0,
    baseAtkPerYear: 0.17,
    baseDefPerYear: 0.09,
    baseSpdPerYear: 0.02,
    skills: [{ name: '吞噬之花', desc: '花瓣张开吞噬敌人' }],
    description: '化为人形的植物系精魂兽',
    element: '木属性',
  },
  // 水属性
  {
    id: 'hai-ma-shou',
    name: '海马圣兽',
    areaTier: 'middle',
    baseHpPerYear: 1.0,
    baseAtkPerYear: 0.15,
    baseDefPerYear: 0.1,
    baseSpdPerYear: 0.16,
    skills: [{ name: '海流冲击', desc: '操控海流形成高压冲击' }],
    description: '生活在浅海的水属性马形魂兽',
     element: '水属性',
   },
   {
     id: 'bi-bo-xuan-gui',
     name: '碧波玄龟',
     areaTier: 'middle',
     baseHpPerYear: 1.2,
     baseAtkPerYear: 0.1,
     baseDefPerYear: 0.2,
     baseSpdPerYear: 0.08,
     skills: [{ name: '碧波护体', desc: '水流环绕形成防御屏障' }],
     description: '千年级水属性龟类魂兽，防御极强',
     element: '水属性',
   },
  // 火属性
  {
    id: 'lie-huo-xing-jiao-shu',
    name: '烈火杏娇疏',
    areaTier: 'middle',
    baseHpPerYear: 0.95,
    baseAtkPerYear: 0.2,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.03,
    skills: [{ name: '杏焰灼烧', desc: '花蕊喷射烈火灼烧一切' }],
    description: '生长于炽热之地的顶级火属性仙品植物',
    element: '火属性',
  },
  // 土属性
  {
    id: 'da-li-jin-gang-xiong',
    name: '大力金刚熊',
    areaTier: 'middle',
    baseHpPerYear: 1.3,
    baseAtkPerYear: 0.19,
    baseDefPerYear: 0.14,
    baseSpdPerYear: 0.06,
    skills: [{ name: '金刚巨力', desc: '金刚之力爆发重击' }],
    description: '力大无穷的熊类魂兽，金刚之躯坚不可摧',
    element: '金属性',
  },
  // 冰属性
  {
    id: 'bing-yuan',
    name: '玄冰玉螈',
    areaTier: 'middle',
    baseHpPerYear: 0.9,
    baseAtkPerYear: 0.16,
    baseDefPerYear: 0.1,
    baseSpdPerYear: 0.1,
    skills: [{ name: '冰爪撕裂', desc: '冰冻的利爪撕裂敌人' }],
    description: '栖息在冰川裂缝中的冰属性两栖魂兽',
    element: '冰属性',
  },
  // 雷属性
  {
    id: 'lan-dian-ba-wang-long-you',
    name: '蓝电霸王龙(幼体)',
    areaTier: 'middle',
    baseHpPerYear: 1.0,
    baseAtkPerYear: 0.2,
    baseDefPerYear: 0.09,
    baseSpdPerYear: 0.14,
    skills: [{ name: '雷霆万钧', desc: '召唤雷电轰击敌人' }],
    description: '上三宗蓝电霸王龙家族传承武魂的野生幼体',
    element: '火属性',
  },
  // 风属性
  {
    id: 'jian-wei-yu-yan',
    name: '尖尾雨燕',
    areaTier: 'middle',
    baseHpPerYear: 0.7,
    baseAtkPerYear: 0.15,
    baseDefPerYear: 0.05,
    baseSpdPerYear: 0.28,
    skills: [{ name: '雨燕疾风', desc: '极速俯冲一击必杀' }],
    description: '速度极快的风属性飞禽魂兽',
    element: '木属性',
  },
  // 光明属性
  {
    id: 'guang-ming-nv-shen-die-you',
    name: '光明女神蝶(幼体)',
    areaTier: 'middle',
    baseHpPerYear: 0.75,
    baseAtkPerYear: 0.17,
    baseDefPerYear: 0.06,
    baseSpdPerYear: 0.22,
    skills: [{ name: '神光蝶舞', desc: '光明鳞粉洒落形成神圣光刃' }],
    description: '极致之光属性的神级蝶类幼体',
    element: '光属性',
  },
  // 黑暗属性
  {
    id: 'you-ming-ling-mao',
    name: '幽冥灵猫',
    areaTier: 'middle',
    baseHpPerYear: 0.8,
    baseAtkPerYear: 0.2,
    baseDefPerYear: 0.06,
    baseSpdPerYear: 0.24,
    skills: [{ name: '幽冥附体', desc: '幽冥之力附体速度暴涨' }],
    description: '敏攻系顶级兽武魂，幽冥之中取敌首级',
    element: '暗属性',
  },
  // 精神属性
  {
    id: 'ling-mou-shou',
    name: '灵眸兽',
    areaTier: 'middle',
    baseHpPerYear: 0.75,
    baseAtkPerYear: 0.14,
    baseDefPerYear: 0.07,
    baseSpdPerYear: 0.16,
    skills: [{ name: '灵眸洞察', desc: '灵眸直视灵魂造成精神伤害' }],
    description: '拥有灵眸之力的精神属性魂兽',
     element: '精神属性',
   },
   {
     id: 'shi-hun-zhu',
     name: '噬魂蛛',
     areaTier: 'middle',
     baseHpPerYear: 0.7,
     baseAtkPerYear: 0.16,
     baseDefPerYear: 0.06,
     baseSpdPerYear: 0.12,
     skills: [{ name: '噬魂丝', desc: '蛛丝侵蚀敌神魂，造成持续精神伤害' }],
     description: '千年级精神属性蛛类魂兽，毒液能吞噬魂力',
     element: '精神属性',
   },
   {
     id: 'huan-xin-hu',
     name: '幻心狐',
     areaTier: 'middle',
     baseHpPerYear: 0.65,
     baseAtkPerYear: 0.15,
     baseDefPerYear: 0.05,
     baseSpdPerYear: 0.28,
     skills: [{ name: '幻心术', desc: '制造心灵幻象迷惑敌人判断' }],
     description: '千年级精神属性狐类魂兽，擅长安抚与操控心神',
     element: '精神属性',
   },
  // 混沌属性
  {
    id: 'hun-dun-jing',
    name: '混沌精',
    areaTier: 'middle',
    baseHpPerYear: 0.95,
    baseAtkPerYear: 0.18,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.16,
    skills: [{ name: '混沌侵蚀', desc: '空间能量侵蚀一切属性' }],
    description: '千年级混沌属性魂兽，极其稀有',
    element: '空间属性',
  },

  // —— 内圈补充：力量/敏攻/控制/防御/辅助/冰/火/毒/金属性 ——
  {
    id: 'kuang-bao-meng-xi',
    name: '狂暴猛犸',
    areaTier: 'inner',
    baseHpPerYear: 1.3,
    baseAtkPerYear: 0.2,
    baseDefPerYear: 0.13,
    baseSpdPerYear: 0.07,
    skills: [{ name: '狂暴冲锋', desc: '进入狂暴状态发起冲锋' }],
    description: '万年级力量型魂兽，强攻系绝佳选择',
    element: '土属性',
  },
  {
    id: 'ying-feng-diao',
    name: '影风玄雕',
    areaTier: 'inner',
    baseHpPerYear: 0.75,
    baseAtkPerYear: 0.23,
    baseDefPerYear: 0.05,
    baseSpdPerYear: 0.3,
    skills: [{ name: '影杀突袭', desc: '融入风中瞬间秒杀敌人' }],
    description: '速度极快的万年级敏攻系魂兽',
    element: '木属性',
  },
  {
    id: 'ji-guang-ci-hou',
    name: '极光灵猴',
    areaTier: 'inner',
    baseHpPerYear: 0.85,
    baseAtkPerYear: 0.16,
    baseDefPerYear: 0.06,
    baseSpdPerYear: 0.22,
    skills: [{ name: '极光幻控', desc: '操纵极光制造幻境控制敌人' }],
    description: '拥有强大精神控制能力的万年级魂兽',
     element: '精神属性',
  },
  {
    id: 'gang-shan-gui',
    name: '玄山刚龟',
    areaTier: 'inner',
    baseHpPerYear: 1.5,
    baseAtkPerYear: 0.1,
    baseDefPerYear: 0.23,
    baseSpdPerYear: 0.04,
    skills: [{ name: '山岳之盾', desc: '如山岳般不可撼动的防御' }],
    description: '防御力极强的万年级防御系魂兽',
    element: '土属性',
  },
  {
    id: 'sheng-shu-tian-ma',
    name: '圣树灵驹',
    areaTier: 'inner',
    baseHpPerYear: 1.0,
    baseAtkPerYear: 0.12,
    baseDefPerYear: 0.1,
    baseSpdPerYear: 0.2,
    skills: [{ name: '生命祝福', desc: '散发浓郁生命气息治愈队友' }],
    description: '拥有生命属性的辅助系万年魂兽',
    element: '木属性',
  },
  {
    id: 'han-feng-lang',
    name: '寒锋冰狼',
    areaTier: 'inner',
    baseHpPerYear: 0.95,
    baseAtkPerYear: 0.22,
    baseDefPerYear: 0.07,
    baseSpdPerYear: 0.17,
    skills: [{ name: '极寒之牙', desc: '零下千度的寒冰撕咬' }],
    description: '万年级冰属性魂兽，一击即可冰封',
    element: '冰属性',
  },
  {
    id: 'yan-xiao-shi',
    name: '炎啸狂狮',
    areaTier: 'inner',
    baseHpPerYear: 1.1,
    baseAtkPerYear: 0.24,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.14,
    skills: [{ name: '烈焰咆哮', desc: '火焰随咆哮声席卷全场' }],
    description: '万年级火属性霸主魂兽',
    element: '火属性',
  },
  {
    id: 'ju-du-xie-wang',
    name: '碧磷蝎王',
    areaTier: 'inner',
    baseHpPerYear: 0.9,
    baseAtkPerYear: 0.2,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.13,
    skills: [{ name: '蝎尾毒针', desc: '尾钩中的剧毒见血封喉' }],
    description: '万年级毒属性蝎类魂兽，剧毒无比',
    element: '木属性',
  },
  {
    id: 'xuan-jin-she',
    name: '玄金鳞蛇',
    areaTier: 'inner',
    baseHpPerYear: 0.85,
    baseAtkPerYear: 0.21,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.18,
    skills: [{ name: '金光穿射', desc: '全身金属化后化作金光刺穿敌人' }],
    description: '鳞片如玄金般坚硬的金属性魂兽',
    element: '金属性',
  },
  {
    id: 'xuan-feng-ji',
    name: '旋风裂隼',
    areaTier: 'inner',
    baseHpPerYear: 0.8,
    baseAtkPerYear: 0.2,
    baseDefPerYear: 0.05,
    baseSpdPerYear: 0.25,
    skills: [{ name: '旋风斩', desc: '高速旋转形成风刃切割敌人' }],
    description: '速度极快的万年级风属性魂兽',
    element: '木属性',
  },

  // ===== 内圈新增：12属性全面覆盖（万年级）=====
  // 金属性
  {
    id: 'jin-gang-hu',
    name: '金刚虎王',
    areaTier: 'inner',
    baseHpPerYear: 1.1,
    baseAtkPerYear: 0.24,
    baseDefPerYear: 0.12,
    baseSpdPerYear: 0.13,
    skills: [{ name: '金刚咆哮', desc: '金属之力汇聚的毁灭咆哮' }],
    description: '万年级金属性虎类魂兽，金刚之躯无坚不摧',
    element: '金属性',
  },
  // 木属性
  {
    id: 'shi-hun-zhu-huang',
    name: '噬魂蛛皇',
    areaTier: 'inner',
    baseHpPerYear: 0.9,
    baseAtkPerYear: 0.21,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.09,
    skills: [{ name: '噬魂毒网', desc: '带有噬魂剧毒的蛛网束缚' }],
    description: '双生武魂之一，万年级噬魂蛛皇，噬魂之毒侵蚀神魂',
    element: '木属性',
  },
  // 水属性
  {
    id: 'mo-hun-da-bai-sha',
    name: '魔魂大白鲨',
    areaTier: 'inner',
    baseHpPerYear: 1.1,
    baseAtkPerYear: 0.2,
    baseDefPerYear: 0.1,
    baseSpdPerYear: 0.18,
    skills: [{ name: '魔魂撕咬', desc: '魔魂之力的狂暴撕咬' }],
    description: '海魂师顶级武魂，万年级魔魂大白鲨',
    element: '水属性',
  },

  // ===== 内圈补充：混沌属性时空系（万年级）=====
  {
    id: 'kong-jian-si-lie-shou',
    name: '空间撕裂兽',
    areaTier: 'inner',
    baseHpPerYear: 1.2,
    baseAtkPerYear: 0.25,
    baseDefPerYear: 0.1,
    baseSpdPerYear: 0.22,
    skills: [{ name: '空间撕裂', desc: '撕裂空间造成毁灭性切割伤害' }],
    description: '能撕裂空间的恐怖魂兽，空间属性',
    element: '空间属性',
  },
  {
    id: 'shi-jian-sha-lou-shou',
    name: '时间沙漏兽',
    areaTier: 'inner',
    baseHpPerYear: 1.1,
    baseAtkPerYear: 0.2,
    baseDefPerYear: 0.12,
    baseSpdPerYear: 0.15,
    skills: [{ name: '时间倒流', desc: '短暂回溯时间修复自身伤势' }],
    description: '掌控时间之力的神秘魂兽，形如沙漏，时间属性',
    element: '时间属性',
  },

  // 火属性
  {
    id: 'shi-shou-huo-feng-huang',
    name: '十首火凤凰',
    areaTier: 'inner',
    baseHpPerYear: 1.0,
    baseAtkPerYear: 0.26,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.18,
    skills: [{ name: '十首烈焰', desc: '十个凤凰头同时喷射毁灭之火' }],
    description: '凤凰中的至强存在，十首齐出焚尽苍穹',
    element: '火属性',
  },
  // 土属性
  {
    id: 'tao-tie-shen-niu',
    name: '饕餮神牛',
    areaTier: 'inner',
    baseHpPerYear: 1.3,
    baseAtkPerYear: 0.22,
    baseDefPerYear: 0.15,
    baseSpdPerYear: 0.05,
    skills: [{ name: '饕餮吞噬', desc: '饕餮之力吞噬万物' }],
    description: '万年级饕餮神牛，越吃越强的土属性魂兽',
    element: '土属性',
  },
  // 冰属性
  {
    id: 'bing-tian-xue-nv',
    name: '冰天雪女',
    areaTier: 'inner',
    baseHpPerYear: 0.85,
    baseAtkPerYear: 0.22,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.2,
    skills: [{ name: '雪女之怒', desc: '极北三大天王之首的极寒之力' }],
    description: '极北三大天王之首，万年级冰天雪女，极致之冰的化身',
    element: '冰属性',
  },
  // 雷属性
  {
    id: 'zi-xiao-shen-lei-shou',
    name: '紫霄神雷兽',
    areaTier: 'inner',
    baseHpPerYear: 0.95,
    baseAtkPerYear: 0.25,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.2,
    skills: [{ name: '紫霄神雷', desc: '九天神雷之紫霄，一击出万雷齐发' }],
    description: '雷霆之主，万年级紫霄神雷兽',
    element: '火属性',
  },
  // 风属性
  {
    id: 'feng-zhi-jing-ling',
    name: '风之精灵王',
    areaTier: 'inner',
    baseHpPerYear: 0.75,
    baseAtkPerYear: 0.21,
    baseDefPerYear: 0.06,
    baseSpdPerYear: 0.32,
    skills: [{ name: '风之束缚', desc: '化身狂风束缚敌人' }],
    description: '风元素的至高精灵，万年级风之精灵王',
    element: '木属性',
  },
  // 光明属性
  {
    id: 'liu-yi-tian-shi',
    name: '六翼天使',
    areaTier: 'inner',
    baseHpPerYear: 0.95,
    baseAtkPerYear: 0.23,
    baseDefPerYear: 0.1,
    baseSpdPerYear: 0.18,
    skills: [{ name: '天使审判', desc: '六翼展开降下神圣审判' }],
    description: '极致之光属性，天使神位传承，万年级六翼天使',
    element: '光属性',
  },
  // 黑暗属性
  {
    id: 'si-wang-zhu-huang',
    name: '死亡蛛皇',
    areaTier: 'inner',
    baseHpPerYear: 0.9,
    baseAtkPerYear: 0.22,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.1,
    skills: [{ name: '死亡蛛网', desc: '死亡蛛网笼罩一切' }],
    description: '双生武魂之一，万年级死亡蛛皇，极致之黑暗',
    element: '暗属性',
  },
  // 精神属性
  {
    id: 'lun-hui-yan-shou',
    name: '轮回天眼兽',
    areaTier: 'inner',
    baseHpPerYear: 0.85,
    baseAtkPerYear: 0.18,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.14,
    skills: [{ name: '轮回之眸', desc: '掌控轮回之力的精神冲击' }],
    description: '万年级精神属性魂兽，轮回之眼洞察生死',
     element: '精神属性',
   },
   {
     id: 'xin-mo-yan',
     name: '心魔瞳兽',
     areaTier: 'inner',
     baseHpPerYear: 0.8,
     baseAtkPerYear: 0.2,
     baseDefPerYear: 0.07,
     baseSpdPerYear: 0.12,
     skills: [{ name: '心魔之瞳', desc: '引动敌内心魔念，造成精神崩溃' }],
     description: '万年级精神属性魂兽，第三只眼能引动人心魔',
     element: '精神属性',
   },
   {
     id: 'duo-po-he',
     name: '夺魄玄鹤',
     areaTier: 'inner',
     baseHpPerYear: 0.75,
     baseAtkPerYear: 0.18,
     baseDefPerYear: 0.06,
     baseSpdPerYear: 0.3,
     skills: [{ name: '夺魄鸣啼', desc: '一声鹤鸣夺人心魄，造成精神震荡' }],
     description: '万年级精神属性飞禽魂兽，鸣声能震慑三魂七魄',
     element: '精神属性',
   },
  // 混沌属性
  {
    id: 'hun-dun-shou-wan-nian',
    name: '混沌兽',
    areaTier: 'inner',
    baseHpPerYear: 1.1,
    baseAtkPerYear: 0.25,
    baseDefPerYear: 0.11,
    baseSpdPerYear: 0.15,
    skills: [{ name: '混沌初现', desc: '空间之力吞噬一切属性伤害' }],
    description: '万年级混沌属性魂兽，传说中的存在',
    element: '空间属性',
  },

  // —— 核心区补充：力量/敏攻/控制/防御/辅助/冰/火/水/雷/光明/黑暗/毒/金/混沌 ——
  {
    id: 'ba-wang-yuan',
    name: '霸王战猿',
    areaTier: 'core',
    baseHpPerYear: 1.3,
    baseAtkPerYear: 0.26,
    baseDefPerYear: 0.1,
    baseSpdPerYear: 0.11,
    skills: [{ name: '霸王铁拳', desc: '倾尽全身之力的毁灭一拳' }],
    description: '十万年级力量型魂兽，强攻系梦想之选',
    element: '土属性',
  },
  {
    id: 'you-ling-hu',
    name: '青风猛虎',
    areaTier: 'core',
    baseHpPerYear: 0.85,
    baseAtkPerYear: 0.28,
    baseDefPerYear: 0.06,
    baseSpdPerYear: 0.3,
    skills: [{ name: '幽冥鬼影', desc: '化身幽冥一击必杀' }],
  element: '木属性',
    description: '丛林中的疾风猛虎，身形如电，速度与力量兼具，风之力附于利爪。',
  },
  {
    id: 'kong-jian-long',
    name: '精神龙王',
    areaTier: 'core',
    baseHpPerYear: 1.1,
    baseAtkPerYear: 0.22,
    baseDefPerYear: 0.1,
    baseSpdPerYear: 0.25,
    skills: [{ name: '空间锁', desc: '扭曲空间禁锢敌人行动' }],
    description: '掌控空间之力的控制系十万年龙类',
    element: '空间属性',
  },
  {
    id: 'da-dian-xuan-gui',
    name: '镇殿玄龟',
    areaTier: 'core',
    baseHpPerYear: 1.6,
    baseAtkPerYear: 0.12,
    baseDefPerYear: 0.28,
    baseSpdPerYear: 0.04,
    skills: [{ name: '玄武之御', desc: '号称绝对防御的龟壳' }],
    description: '十万年级防御系魂兽，坚不可摧',
    element: '土属性',
  },
  {
    id: 'ci-xiang-tian-e',
    name: '圣光天鹅',
    areaTier: 'core',
    baseHpPerYear: 1.0,
    baseAtkPerYear: 0.1,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.22,
    skills: [{ name: '圣光普照', desc: '圣光洒落，全面恢复队友状态' }],
    description: '十万年级辅助系魂兽，治疗与增幅兼备',
    element: '光属性',
  },
  {
    id: 'bing-xue-tian-nv',
    name: '冰雪天女',
    areaTier: 'core',
    baseHpPerYear: 0.95,
    baseAtkPerYear: 0.25,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.2,
    skills: [{ name: '绝对零度', desc: '令周围一切冻结的极寒之力' }],
    description: '化身为人形的十万年级冰属性魂兽',
    element: '冰属性',
  },
  {
    id: 'yan-huang',
    name: '炎凰',
    areaTier: 'core',
    baseHpPerYear: 1.0,
    baseAtkPerYear: 0.28,
    baseDefPerYear: 0.07,
    baseSpdPerYear: 0.22,
    skills: [{ name: '凤凰涅槃', desc: '以自身涅槃之火焚烧一切' }],
    description: '十万年级火属性凤类魂兽，浴火重生',
    element: '火属性',
  },
  {
    id: 'zhen-lei-qilin',
    name: '震雷麒麟',
    areaTier: 'core',
    baseHpPerYear: 1.2,
    baseAtkPerYear: 0.27,
    baseDefPerYear: 0.09,
    baseSpdPerYear: 0.2,
    skills: [{ name: '万雷齐发', desc: '召唤万千雷电从天而降' }],
    description: '十万年级雷属性瑞兽，雷霆之主',
    element: '火属性',
  },
  {
    id: 'ming-he-jiu-wei',
    name: '灵渊九尾狐',
    areaTier: 'core',
    baseHpPerYear: 1.0,
    baseAtkPerYear: 0.25,
    baseDefPerYear: 0.07,
    baseSpdPerYear: 0.24,
    skills: [{ name: '九幽冥火', desc: '燃烧魂魄的黑暗之火' }],
  element: '精神属性',
    description: '灵渊之畔的九尾天狐，精通幻术与精神攻击，九条尾巴各蕴异力。',
  },
  {
    id: 'huang-jin-sheng-long',
    name: '黄金圣龙',
    areaTier: 'core',
    baseHpPerYear: 1.2,
    baseAtkPerYear: 0.26,
    baseDefPerYear: 0.11,
    baseSpdPerYear: 0.21,
    skills: [{ name: '圣光龙息', desc: '神圣金色龙焰净化一切邪恶' }],
    description: '十万年级光明属性龙类魂兽，血脉尊贵',
    element: '光属性',
  },
  {
    id: 'qian-du-mu-wang',
    name: '千毒木王',
    areaTier: 'core',
    baseHpPerYear: 1.1,
    baseAtkPerYear: 0.22,
    baseDefPerYear: 0.12,
    baseSpdPerYear: 0.09,
    skills: [{ name: '万毒噬体', desc: '释放上千种剧毒腐蚀敌人' }],
    description: '十万年级毒属性植物系魂兽之王',
    element: '木属性',
  },
  {
    id: 'kuang-tie-bao',
    name: '狂铁血豹',
    areaTier: 'core',
    baseHpPerYear: 0.95,
    baseAtkPerYear: 0.26,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.25,
    skills: [{ name: '金刚铁爪', desc: '金属化的利爪撕裂一切' }],
    description: '全身钢铁化的十万年级金属性魂兽',
    element: '金属性',
  },
  {
    id: 'hun-tun-shi',
    name: '混沌噬',
    areaTier: 'core',
    baseHpPerYear: 1.2,
    baseAtkPerYear: 0.3,
    baseDefPerYear: 0.1,
    baseSpdPerYear: 0.18,
    skills: [{ name: '混沌吞天', desc: '空间之力吞噬一切属性' }],
    description: '传说中的混沌属性魂兽，万属性俱全',
    element: '空间属性',
  },

  // ===== 核心区新增：12属性全面覆盖（十万年级）=====
  // 金属性
  {
    id: 'huang-jin-sheng-long-10w',
    name: '金刚圣龙',
    areaTier: 'core',
    baseHpPerYear: 1.25,
    baseAtkPerYear: 0.27,
    baseDefPerYear: 0.12,
    baseSpdPerYear: 0.18,
    skills: [{ name: '黄金龙息', desc: '黄金圣龙的毁灭龙息' }],
    description: '十万年黄金圣龙，金属性龙族至尊',
    element: '金属性',
  },
  {
    id: 'bai-jin-bi-meng',
    name: '白金比蒙',
    areaTier: 'core',
    baseHpPerYear: 1.5,
    baseAtkPerYear: 0.29,
    baseDefPerYear: 0.17,
    baseSpdPerYear: 0.1,
    skills: [{ name: '比蒙巨爪', desc: '比蒙巨兽的毁灭一击' }],
    description: '传说中的白金比蒙巨兽，金属性十万年兽神',
    element: '金属性',
  },
  // 木属性
  {
    id: 'shen-ming-tian-e-shou',
    name: '世界树守卫',
    areaTier: 'core',
    baseHpPerYear: 1.5,
    baseAtkPerYear: 0.18,
    baseDefPerYear: 0.16,
    baseSpdPerYear: 0.06,
    skills: [{ name: '生命之种', desc: '世界树之种，生机无限' }],
    description: '十万年生命之树守护者，木属性神兽',
    element: '木属性',
  },
  {
    id: 'fei-cui-tian-e',
    name: '翡翠天鹅',
    areaTier: 'core',
    baseHpPerYear: 1.1,
    baseAtkPerYear: 0.16,
    baseDefPerYear: 0.1,
    baseSpdPerYear: 0.18,
    skills: [{ name: '祈愿之光', desc: '治愈万物的生命之光' }],
    description: '十万年翡翠天鹅，生命属性的至强者',
    element: '光属性',
  },
  // 水属性
  {
    id: 'shen-hai-mo-jing-wang',
    name: '深海魔鲸王',
    areaTier: 'core',
    baseHpPerYear: 1.4,
    baseAtkPerYear: 0.26,
    baseDefPerYear: 0.12,
    baseSpdPerYear: 0.12,
    skills: [{ name: '深海吞噬', desc: '深海霸主的吞噬一击' }],
    description: '海洋中的至尊，十万年深海魔鲸王',
    element: '水属性',
  },
  // 火属性
  {
    id: 'feng-huang-10w',
    name: '涅槃凤凰',
    areaTier: 'core',
    baseHpPerYear: 1.05,
    baseAtkPerYear: 0.29,
    baseDefPerYear: 0.09,
    baseSpdPerYear: 0.24,
    skills: [{ name: '凤凰涅槃', desc: '浴火重生的神级火焰' }],
    description: '十万年凤凰，百鸟之王，火属性至强者',
    element: '火属性',
  },
  {
    id: 'lie-yan-fen-tian-niu',
    name: '烈焰焚天牛',
    areaTier: 'core',
    baseHpPerYear: 1.35,
    baseAtkPerYear: 0.26,
    baseDefPerYear: 0.14,
    baseSpdPerYear: 0.08,
    skills: [{ name: '焚天冲撞', desc: '全身烈焰冲撞，焚烧一切' }],
    description: '十万年烈焰焚天牛，火属性牛族至尊',
    element: '火属性',
  },
  // 土属性
  {
    id: 'da-di-zhi-wang',
    name: '大地之王',
    areaTier: 'core',
    baseHpPerYear: 1.6,
    baseAtkPerYear: 0.22,
    baseDefPerYear: 0.22,
    baseSpdPerYear: 0.05,
    skills: [{ name: '大地之怒', desc: '大地之力爆发，山崩地裂' }],
    description: '十万年大地之王，土属性魂兽至尊',
    element: '土属性',
  },
  // 冰属性
  {
    id: 'xue-di-10w',
    name: '雪帝',
    areaTier: 'core',
    baseHpPerYear: 1.0,
    baseAtkPerYear: 0.26,
    baseDefPerYear: 0.1,
    baseSpdPerYear: 0.18,
    skills: [{ name: '寒极冰封神域', desc: '绝对零度的极寒领域' }],
    description: '极北三大天王之首，十万年雪帝，极致之冰',
    element: '冰属性',
  },
  {
    id: 'bing-ji-shuang-mie-long',
    name: '冰极霜灭龙',
    areaTier: 'core',
    baseHpPerYear: 1.25,
    baseAtkPerYear: 0.27,
    baseDefPerYear: 0.12,
    baseSpdPerYear: 0.14,
    skills: [{ name: '霜灭龙息', desc: '霜灭之力冻结天地万物' }],
    description: '极致之冰属性龙族，十万年冰极霜灭龙',
    element: '冰属性',
  },
  // 雷属性
  {
    id: 'lei-ting-kui-niu',
    name: '雷霆夔牛',
    areaTier: 'core',
    baseHpPerYear: 1.3,
    baseAtkPerYear: 0.26,
    baseDefPerYear: 0.12,
    baseSpdPerYear: 0.14,
    skills: [{ name: '雷霆万钧', desc: '一吼雷鸣千里，雷霆万钧' }],
    description: '上古夔牛，一吼而雷霆千里，十万年雷属性至尊',
    element: '火属性',
  },
  // 风属性
  {
    id: 'feng-zhi-jing-ling-wang-10w',
    name: '风神·千羽',
    areaTier: 'core',
    baseHpPerYear: 0.9,
    baseAtkPerYear: 0.24,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.32,
    skills: [{ name: '风暴之眼', desc: '风暴中心的毁灭之风' }],
    description: '十万年风之精灵王，风元素的至高存在',
    element: '木属性',
  },
  // 光明属性
  {
    id: 'guang-ming-sheng-long-10w',
    name: '光明圣龙',
    areaTier: 'core',
    baseHpPerYear: 1.25,
    baseAtkPerYear: 0.26,
    baseDefPerYear: 0.12,
    baseSpdPerYear: 0.16,
    skills: [{ name: '圣光龙息', desc: '神圣之光的龙息审判' }],
    description: '极致之光属性的龙族，十万年光明圣龙',
    element: '光属性',
  },
  {
    id: 'shen-sheng-tian-shi',
    name: '神圣天使',
    areaTier: 'core',
    baseHpPerYear: 1.1,
    baseAtkPerYear: 0.27,
    baseDefPerYear: 0.11,
    baseSpdPerYear: 0.2,
    skills: [{ name: '神圣审判', desc: '天使降临的神圣审判' }],
    description: '降临人间的十万年神圣天使，光明之神的化身',
    element: '光属性',
  },
  // 黑暗属性
  {
    id: 'hei-an-sheng-long-10w',
    name: '黑暗圣龙',
    areaTier: 'core',
    baseHpPerYear: 1.25,
    baseAtkPerYear: 0.26,
    baseDefPerYear: 0.12,
    baseSpdPerYear: 0.14,
    skills: [{ name: '黑暗龙息', desc: '黑暗吞噬的毁灭龙息' }],
    description: '极致之暗属性的龙族，十万年黑暗圣龙',
    element: '暗属性',
  },
  {
    id: 'duo-tian-shi',
    name: '堕天使',
    areaTier: 'core',
    baseHpPerYear: 1.1,
    baseAtkPerYear: 0.28,
    baseDefPerYear: 0.1,
    baseSpdPerYear: 0.22,
    skills: [{ name: '堕落之翼', desc: '天堂堕落的毁灭之力' }],
    description: '自天堂堕落的天使，十万年堕天使，黑暗属性至强',
    element: '暗属性',
  },
  {
    id: 'zhong-yan-zhi-long',
    name: '终焉暗龙',
    areaTier: 'core',
    baseHpPerYear: 1.4,
    baseAtkPerYear: 0.3,
    baseDefPerYear: 0.14,
    baseSpdPerYear: 0.14,
    skills: [{ name: '终焉龙息', desc: '终焉之力毁灭一切' }],
    description: '黑暗属性龙武魂的顶点，十万年终焉之龙',
    element: '暗属性',
  },
  // 精神属性
  {
    id: 'she-hun-ling-mo',
    name: '摄魂铃魔',
    areaTier: 'core',
    baseHpPerYear: 0.95,
    baseAtkPerYear: 0.22,
    baseDefPerYear: 0.09,
    baseSpdPerYear: 0.16,
    skills: [{ name: '摄魂魔音', desc: '魔铃之音吞噬灵魂' }],
    description: '十万年摄魂铃魔，精神属性至强者',
     element: '精神属性',
   },
   {
     id: 'meng-mo',
     name: '梦貘',
     areaTier: 'core',
     baseHpPerYear: 1.0,
     baseAtkPerYear: 0.2,
     baseDefPerYear: 0.09,
     baseSpdPerYear: 0.22,
     skills: [{ name: '梦魇吞噬', desc: '将敌人拖入无尽梦魇，吞噬其精神力' }],
     description: '十万年梦貘，精神属性凶兽，能操控梦境吞噬神魂',
     element: '精神属性',
   },
   {
     id: 'po-nian-ming-wang',
     name: '破念明王',
     areaTier: 'core',
     baseHpPerYear: 1.15,
     baseAtkPerYear: 0.24,
     baseDefPerYear: 0.11,
     baseSpdPerYear: 0.16,
     skills: [{ name: '破念神诀', desc: '意念化刃，直接破碎敌之神魂' }],
     description: '十万年精神属性人形魂兽，精神力修炼至化境',
     element: '精神属性',
   },
  // 混沌属性
  {
    id: 'hun-dun-gu-long',
    name: '混沌古龙',
    areaTier: 'core',
    baseHpPerYear: 1.35,
    baseAtkPerYear: 0.3,
    baseDefPerYear: 0.13,
    baseSpdPerYear: 0.16,
    skills: [{ name: '混沌龙炎', desc: '空间之力的至强龙炎' }],
    description: '传说中的混沌古龙，天地未分之时的古老存在',
    element: '空间属性',
  },
  {
    id: 'jian-xian-zhi-jian-shou-hu-zhe',
    name: '天诛剑灵',
    areaTier: 'core',
    baseHpPerYear: 1.2,
    baseAtkPerYear: 0.32,
    baseDefPerYear: 0.11,
    baseSpdPerYear: 0.2,
    skills: [{ name: '剑仙守护', desc: '神王剑仙遗落人间的神剑守护者' }],
    description: '混沌属性的天诛剑守护者，万属性俱全',
    element: '空间属性',
  },

  // ===== 核心区补充：混沌属性时空系（十万年级）=====
  {
    id: 'xu-kong-gu-long',
    name: '虚空古龙',
    areaTier: 'core',
    baseHpPerYear: 1.6,
    baseAtkPerYear: 0.3,
    baseDefPerYear: 0.18,
    baseSpdPerYear: 0.25,
    skills: [{ name: '虚空龙息', desc: '喷吐虚空龙息湮灭一切' }],
    description: '传说中的虚空龙族，空间属性的十万年魂兽',
    element: '空间属性',
  },
  {
    id: 'shi-kong-zhi-zhu',
    name: '时空之主',
    areaTier: 'core',
    baseHpPerYear: 1.5,
    baseAtkPerYear: 0.28,
    baseDefPerYear: 0.16,
    baseSpdPerYear: 0.3,
    skills: [{ name: '时空主宰', desc: '操控时空法则，逆转战局' }],
    description: '掌控时空之力的顶级魂兽，被誉为时空之主',
    element: '空间属性',
  },
  // 时间属性·十万年
  {
    id: 'sui-yue-shou-hu-10w',
    name: '岁月守护者',
    areaTier: 'core',
    baseHpPerYear: 1.4,
    baseAtkPerYear: 0.26,
    baseDefPerYear: 0.17,
    baseSpdPerYear: 0.22,
    skills: [{ name: '岁月之盾', desc: '时间静止构筑绝对防御，反弹敌人攻击' }],
    description: '守护着时间长河的古老魂兽，时间属性的十万年存在',
    element: '时间属性',
  },
  {
    id: 'shi-sha-lou-10w',
    name: '时光沙漏兽',
    areaTier: 'core',
    baseHpPerYear: 1.3,
    baseAtkPerYear: 0.29,
    baseDefPerYear: 0.14,
    baseSpdPerYear: 0.26,
    skills: [{ name: '时间倒流', desc: '短暂回溯时间，修复自身并重置战局' }],
    description: '形如巨大沙漏的神秘魂兽，掌控时间之力的十万年存在',
    element: '时间属性',
  },
  // 空间属性·十万年
  {
    id: 'kong-jian-zhi-wang',
    name: '空间之王',
    areaTier: 'core',
    baseHpPerYear: 1.5,
    baseAtkPerYear: 0.3,
    baseDefPerYear: 0.15,
    baseSpdPerYear: 0.32,
    skills: [{ name: '空间放逐', desc: '将敌人放逐到异次元空间，造成毁灭伤害' }],
    description: '掌控空间法则的顶级十万年魂兽，被誉为空间之王',
    element: '空间属性',
  },
  {
    id: 'ci-yuan-shen-shou-10w',
    name: '次元神兽',
    areaTier: 'core',
    baseHpPerYear: 1.4,
    baseAtkPerYear: 0.27,
    baseDefPerYear: 0.16,
    baseSpdPerYear: 0.28,
    skills: [{ name: '次元斩', desc: '跨越次元的斩击，无视空间距离' }],
    description: '穿行于无数次元之间的神兽，空间属性的十万年魂兽',
    element: '空间属性',
  },

  // —— 生命之湖补充：冰/火/水/土/雷/光明/黑暗/毒/混沌/时间/精神 ——
   {
     id: 'shi-guang-gu-long',
     name: '时光古龙',
     areaTier: 'life-lake',
     baseHpPerYear: 1.25,
     baseAtkPerYear: 0.27,
     baseDefPerYear: 0.14,
     baseSpdPerYear: 0.24,
     skills: [{ name: '时光回溯', desc: '使时间倒流，将敌人的攻击还施彼身' }],
     description: '传说中诞生于时间长河源头的龙族，时间属性凶兽，六十万年以上修为',
     element: '时间属性',
   },
   {
    id: 'gu-bing-shen-shou',
    name: '古冰神兽',
    areaTier: 'life-lake',
    baseHpPerYear: 1.2,
    baseAtkPerYear: 0.28,
    baseDefPerYear: 0.12,
    baseSpdPerYear: 0.2,
    skills: [{ name: '万古冰封', desc: '将时间与空间一同冻结的终极寒气' }],
    description: '生命之湖深处的冰属性神兽，寒气亘古不灭',
    element: '冰属性',
  },
  {
    id: 'lian-yu-shen-huang',
    name: '炼狱神皇',
    areaTier: 'life-lake',
    baseHpPerYear: 1.1,
    baseAtkPerYear: 0.32,
    baseDefPerYear: 0.1,
    baseSpdPerYear: 0.22,
    skills: [{ name: '炼狱之火', desc: '焚烧灵魂的神级火焰' }],
    description: '掌控神级火焰的火属性神兽',
    element: '火属性',
  },
  {
   id: 'cang-hai-shen-jiao',
    name: '苍海神蛟',
    areaTier: 'life-lake',
    baseHpPerYear: 1.3,
    baseAtkPerYear: 0.25,
    baseDefPerYear: 0.13,
    baseSpdPerYear: 0.18,
    skills: [{ name: '沧海横流', desc: '操控无尽水流形成滔天巨浪' }],
    description: '生命之湖水之神兽，源自古苍海',
    element: '水属性',
  },
  {
    id: 'taishan-shou',
    name: '泰山兽',
    areaTier: 'life-lake',
    baseHpPerYear: 1.6,
    baseAtkPerYear: 0.18,
    baseDefPerYear: 0.3,
    baseSpdPerYear: 0.05,
    skills: [{ name: '五岳镇压', desc: '以山岳之势镇压万物' }],
    description: '身形如山的土属性神兽，防御无双',
    element: '土属性',
  },
  {
    id: 'tian-lei-shen-shou',
    name: '九天雷神兽',
    areaTier: 'life-lake',
    baseHpPerYear: 1.0,
    baseAtkPerYear: 0.32,
    baseDefPerYear: 0.09,
    baseSpdPerYear: 0.28,
    skills: [{ name: '九天雷霆', desc: '九天之上降下的神罚之雷' }],
    description: '执掌天罚的雷属性神兽',
    element: '火属性',
  },
  {
    id: 'da-guang-ming-shen-long',
    name: '大光明神龙',
    areaTier: 'life-lake',
    baseHpPerYear: 1.3,
    baseAtkPerYear: 0.28,
    baseDefPerYear: 0.13,
    baseSpdPerYear: 0.23,
    skills: [{ name: '光明普照', desc: '驱散一切黑暗的神级圣光' }],
    description: '神级光明属性龙，至高至纯',
    element: '光属性',
  },
  {
    id: 'wu-ming-shen-di',
    name: '冥渊神帝',
    areaTier: 'life-lake',
    baseHpPerYear: 1.2,
    baseAtkPerYear: 0.3,
    baseDefPerYear: 0.11,
    baseSpdPerYear: 0.21,
    skills: [{ name: '冥渊吞噬', desc: '将一切拖入永夜的黑暗神力' }],
    description: '自冥渊深处而来的黑暗属性神兽',
    element: '暗属性',
  },
  {
    id: 'bai-du-shen-mu',
    name: '百毒神木',
    areaTier: 'life-lake',
    baseHpPerYear: 1.4,
    baseAtkPerYear: 0.24,
    baseDefPerYear: 0.15,
    baseSpdPerYear: 0.08,
    skills: [{ name: '万毒朝宗', desc: '天下百毒皆归其所有' }],
    description: '万毒之源，神级毒属性植物系魂兽',
    element: '木属性',
  },
  {
    id: 'hun-yuan-tian-di',
    name: '混沌天地',
    areaTier: 'life-lake',
    baseHpPerYear: 1.3,
    baseAtkPerYear: 0.34,
    baseDefPerYear: 0.13,
    baseSpdPerYear: 0.2,
    skills: [{ name: '混沌初开', desc: '天地未分之前的空间本源之力' }],
    description: '混沌神兽，全属性一体，超越所有系别',
    element: '空间属性',
  },

  // ===== 生命之湖补充：混沌时空龙（百万年级）=====
  {
    id: 'hun-dun-shi-kong-long',
    name: '混沌时空龙',
    areaTier: 'life-lake',
    baseHpPerYear: 1.8,
    baseAtkPerYear: 0.35,
    baseDefPerYear: 0.2,
    baseSpdPerYear: 0.32,
    skills: [{ name: '混沌时空劫', desc: '空间与时间之力合一，毁天灭地的终极一击' }],
    description: '混沌初开时诞生的时空神龙，掌控时空本源，位列十大凶兽之上的传说存在',
    element: '空间属性',
  },

  // ===== 补充：水属性各 tier 扩充 =====
  {
    id: 'xuan-wu-gui',
    name: '玄水玄武龟',
    areaTier: 'inner',
    baseHpPerYear: 2.2,
    baseAtkPerYear: 0.08,
    baseDefPerYear: 0.25,
    baseSpdPerYear: 0.05,
    skills: [{ name: '玄水护体', desc: '召唤玄水屏障，大幅提升防御与恢复' }],
    description: '背负玄水之纹的古老龟类魂兽，防御力极强',
    element: '水属性',
  },
  {
    id: 'lan-hai-shou',
    name: '蓝海兽王',
    areaTier: 'core',
    baseHpPerYear: 2.0,
    baseAtkPerYear: 0.22,
    baseDefPerYear: 0.18,
    baseSpdPerYear: 0.1,
    skills: [{ name: '蓝海怒涛', desc: '召唤无尽海潮，范围水属性打击' }],
    description: '海魂兽中的霸主级存在，掌控一方海域',
    element: '水属性',
  },
  {
    id: 'ji-han-jing-e',
    name: '极寒鲸鳄',
    areaTier: 'core',
    baseHpPerYear: 1.9,
    baseAtkPerYear: 0.24,
    baseDefPerYear: 0.16,
    baseSpdPerYear: 0.12,
    skills: [{ name: '寒冰噬咬', desc: '极寒之力凝聚的撕咬，附带冰冻减速' }],
    description: '生活在极深海域的古老魂兽，水冰双修',
    element: '水属性',
  },
  {
    id: 'cang-long-jun',
    name: '沧龙君',
    areaTier: 'life-lake',
    baseHpPerYear: 2.0,
    baseAtkPerYear: 0.28,
    baseDefPerYear: 0.18,
    baseSpdPerYear: 0.18,
    skills: [{ name: '沧龙咆哮', desc: '远古苍龙之力，水属性本源冲击' }],
    description: '远古水系至尊魂兽，生命之湖深处的神秘存在',
    element: '水属性',
  },
  {
    id: 'shen-shui-tian-she',
    name: '神水天蛇',
    areaTier: 'life-lake',
    baseHpPerYear: 1.6,
    baseAtkPerYear: 0.3,
    baseDefPerYear: 0.12,
    baseSpdPerYear: 0.22,
    skills: [{ name: '弱水三千', desc: '神水之力化为千道水刃，无孔不入' }],
    description: '传说中的神水之灵，化形为蛇，水属性掌控达极致',
    element: '水属性',
  },

  // ===== 补充：时间属性各 tier 扩充 =====
  {
    id: 'sui-yue-die',
    name: '岁月蝶',
    areaTier: 'middle',
    baseHpPerYear: 0.6,
    baseAtkPerYear: 0.12,
    baseDefPerYear: 0.04,
    baseSpdPerYear: 0.28,
    skills: [{ name: '时光流转', desc: '操纵时光流速，使敌人衰老减速' }],
    description: '翅膀上铭刻着岁月纹路的神秘蝴蝶',
    element: '时间属性',
  },
  {
    id: 'ni-guang-ji',
    name: '逆光纪',
    areaTier: 'core',
    baseHpPerYear: 1.2,
    baseAtkPerYear: 0.25,
    baseDefPerYear: 0.1,
    baseSpdPerYear: 0.3,
    skills: [{ name: '时间逆流', desc: '逆转局部时间，抵消伤害并反击' }],
    description: '生活在时空裂隙中的时间系魂兽',
    element: '时间属性',
  },
  {
    id: 'yong-heng-zhong',
    name: '永恒钟魂',
    areaTier: 'life-lake',
    baseHpPerYear: 1.8,
    baseAtkPerYear: 0.22,
    baseDefPerYear: 0.2,
    baseSpdPerYear: 0.08,
    skills: [{ name: '永恒时间之牢', desc: '将敌人封印在静止的时间牢笼中' }],
    description: '时间法则的具象化存在，拥有永恒的寿命',
    element: '时间属性',
  },
  {
    id: 'lun-hui-pan',
    name: '轮回盘',
    areaTier: 'life-lake',
    baseHpPerYear: 1.5,
    baseAtkPerYear: 0.28,
    baseDefPerYear: 0.15,
    baseSpdPerYear: 0.12,
    skills: [{ name: '六道轮回', desc: '时间轮回之力，将敌人拖入轮回幻境' }],
    description: '掌握轮回奥秘的时间系凶兽，位于时间长河源头',
    element: '时间属性',
  },

  // ===== 补充：光属性 inner tier =====
  {
    id: 'guang-ming-shen-he',
    name: '光明神鹤',
    areaTier: 'inner',
    baseHpPerYear: 1.0,
    baseAtkPerYear: 0.2,
    baseDefPerYear: 0.1,
    baseSpdPerYear: 0.3,
    skills: [{ name: '圣光普照', desc: '释放圣洁光辉，净化邪恶' }],
    description: '通体洁白的神圣鹤类魂兽，光明属性浓郁',
    element: '光属性',
  },
  {
    id: 'ri-jin-tian-ma',
    name: '日耀天马',
    areaTier: 'inner',
    baseHpPerYear: 1.2,
    baseAtkPerYear: 0.22,
    baseDefPerYear: 0.12,
    baseSpdPerYear: 0.28,
    skills: [{ name: '太阳金焰', desc: '化作耀阳光焰冲撞敌人' }],
    description: '传说中吸收太阳精华而生的天马，羽翼闪耀金辉',
    element: '光属性',
  },

  // ===== 补充：金属性 life-lake =====
  {
    id: 'bai-lian-gang-jun',
    name: '百炼钢君',
    areaTier: 'life-lake',
    baseHpPerYear: 1.8,
    baseAtkPerYear: 0.32,
    baseDefPerYear: 0.25,
    baseSpdPerYear: 0.08,
    skills: [{ name: '千锤百炼', desc: '全身金属化，攻防兼备的钢铁之躯' }],
    description: '由地底核心矿脉孕育的金属性生命，坚不可摧',
    element: '金属性',
  },
  {
    id: 'wu-xing-jian-hou',
    name: '五行剑猴',
    areaTier: 'life-lake',
    baseHpPerYear: 1.4,
    baseAtkPerYear: 0.35,
    baseDefPerYear: 0.15,
    baseSpdPerYear: 0.25,
    skills: [{ name: '金锋万剑', desc: '操控金之法则，万剑齐发' }],
    description: '精通剑道的金属性魂兽，剑法通神',
    element: '金属性',
  },

  // ===== 补充：土属性 life-lake =====
  {
    id: 'zhen-yue-gui-yuan',
    name: '镇岳龟猿',
    areaTier: 'life-lake',
    baseHpPerYear: 2.5,
    baseAtkPerYear: 0.2,
    baseDefPerYear: 0.3,
    baseSpdPerYear: 0.05,
    skills: [{ name: '不动如山', desc: '大地之力加持，防御达到极致' }],
    description: '背驮山岳的巨型土系魂兽，稳如泰山',
    element: '土属性',
  },
  {
    id: 'huang-tu-da-shen',
    name: '黄土大神',
    areaTier: 'life-lake',
    baseHpPerYear: 2.2,
    baseAtkPerYear: 0.25,
    baseDefPerYear: 0.28,
    baseSpdPerYear: 0.06,
    skills: [{ name: '厚土载物', desc: '召唤大地之力，范围土属性毁灭打击' }],
    description: '黄土高原深处的土系至尊，掌控大地脉动',
    element: '土属性',
  },

  // ===== 补充：精神属性 middle =====
  {
    id: 'meng-huan-tian-zhu',
    name: '梦幻天蛛',
    areaTier: 'middle',
    baseHpPerYear: 0.9,
    baseAtkPerYear: 0.15,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.18,
    skills: [{ name: '幻梦蛛网', desc: '精神力织成的蛛网，将敌人拖入梦境' }],
    description: '擅长精神幻术的蜘蛛类魂兽，猎物在幻境中被蚕食',
    element: '精神属性',
  },

  // ===== 补充：金属性魂兽（按tier分布，坚硬锋利金属质感） =====
  // --- outer（十年~百年）---
  {
    id: 'jin-mao-xi',
    name: '金毛蜥',
    areaTier: 'outer',
    baseHpPerYear: 1.1,
    baseAtkPerYear: 0.16,
    baseDefPerYear: 0.12,
    baseSpdPerYear: 0.12,
    skills: [{ name: '金鳞冲撞', desc: '用坚硬的金色鳞片冲撞敌人' }],
    description: '身披金色鳞甲的小型蜥蜴，鳞片锋利如刃',
    element: '金属性',
  },
  {
    id: 'tie-bi-can-lang',
    name: '铁臂螳螂',
    areaTier: 'outer',
    baseHpPerYear: 0.8,
    baseAtkPerYear: 0.22,
    baseDefPerYear: 0.06,
    baseSpdPerYear: 0.22,
    skills: [{ name: '双刃斩', desc: '锋利镰臂交叉斩击' }],
    description: '双臂如镰刀般坚硬锐利的虫类魂兽',
    element: '金属性',
  },
  {
    id: 'tong-jia-shu',
    name: '铜甲鼠',
    areaTier: 'outer',
    baseHpPerYear: 1.0,
    baseAtkPerYear: 0.12,
    baseDefPerYear: 0.14,
    baseSpdPerYear: 0.18,
    skills: [{ name: '铜爪撕裂', desc: '用铜质利爪撕开防御' }],
    description: '全身覆盖铜色甲壳的鼠类魂兽，擅长钻洞偷袭',
    element: '金属性',
  },
  // === 外围·暗属性补全（确保11属性各tier至少3只） ===
  {
    id: 'you-ming-mao',
    name: '幽冥影猫',
    areaTier: 'outer',
    baseHpPerYear: 0.8,
    baseAtkPerYear: 0.18,
    baseDefPerYear: 0.05,
    baseSpdPerYear: 0.28,
    skills: [{ name: '暗影突袭', desc: '融入黑暗中发起致命突袭' }],
    description: '通体漆黑的猫形魂兽，擅长隐匿于阴影，夜间战力翻倍。',
    element: '暗属性',
  },
  {
    id: 'hei-yan-she',
    name: '黑焰蛇',
    areaTier: 'outer',
    baseHpPerYear: 0.9,
    baseAtkPerYear: 0.2,
    baseDefPerYear: 0.06,
    baseSpdPerYear: 0.18,
    skills: [{ name: '暗焰毒牙', desc: '喷射带有黑暗腐蚀力的毒液' }],
    description: '通体乌黑的毒蛇，蛇鳞在月光下泛着暗紫色光泽，毒液具有腐蚀灵魂的力量。',
    element: '暗属性',
  },
  {
    id: 'mo-yu-wu',
    name: '魔域乌鸦',
    areaTier: 'outer',
    baseHpPerYear: 0.7,
    baseAtkPerYear: 0.16,
    baseDefPerYear: 0.04,
    baseSpdPerYear: 0.26,
    skills: [{ name: '暗夜俯冲', desc: '从阴影中高速俯冲攻击' }],
    description: '浑身覆盖墨色羽毛的飞禽魂兽，成群出没时宛如移动的乌云。',
    element: '暗属性',
  },
  // --- middle（百年~千年）---
  {
    id: 'gang-jia-xi-niu',
    name: '钢甲犀牛',
    areaTier: 'middle',
    baseHpPerYear: 1.6,
    baseAtkPerYear: 0.18,
    baseDefPerYear: 0.20,
    baseSpdPerYear: 0.08,
    skills: [{ name: '钢铁冲撞', desc: '全身钢甲包裹的野蛮冲撞' }],
    description: '通体覆盖钢质铠甲的巨型犀牛，防御极强',
    element: '金属性',
  },
  {
    id: 'jin-chi-da-peng',
    name: '金翅大鹏',
    areaTier: 'middle',
    baseHpPerYear: 1.2,
    baseAtkPerYear: 0.24,
    baseDefPerYear: 0.08,
    baseSpdPerYear: 0.30,
    skills: [{ name: '金翅风刃', desc: '振翅挥出金色金属风刃' }],
    description: '翅如金刃的飞行魂兽，俯冲攻击势不可挡',
    element: '金属性',
  },
  {
    id: 'xuan-tie-jian-chi-hu',
    name: '玄铁剑齿虎',
    areaTier: 'middle',
    baseHpPerYear: 1.4,
    baseAtkPerYear: 0.22,
    baseDefPerYear: 0.12,
    baseSpdPerYear: 0.20,
    skills: [{ name: '玄铁獠牙', desc: '漆黑如玄铁的剑齿撕裂一切' }],
    description: '獠牙和利爪由玄铁构成的凶猛虎类魂兽',
    element: '金属性',
  },
  // === 中部·暗属性补全 ===
  {
    id: 'hei-mo-lang',
    name: '黑魔狼',
    areaTier: 'middle',
    baseHpPerYear: 1.2,
    baseAtkPerYear: 0.28,
    baseDefPerYear: 0.09,
    baseSpdPerYear: 0.30,
    skills: [{ name: '暗夜撕咬', desc: '黑暗中锁定目标的致命撕咬' }],
    description: '通体漆黑的凶猛狼兽，出没于暗夜森林，能操控周围的黑暗气息。',
    element: '暗属性',
  },
  {
    id: 'mo-yun-xiu',
    name: '魔云鹫',
    areaTier: 'middle',
    baseHpPerYear: 1.0,
    baseAtkPerYear: 0.25,
    baseDefPerYear: 0.07,
    baseSpdPerYear: 0.32,
    skills: [{ name: '魔云俯冲', desc: '从黑色云层中俯冲而下的致命一击' }],
    description: '翼展数丈的黑色巨鹰，所过之处乌云密布，遮天蔽日。',
    element: '暗属性',
  },
  // --- inner（千年~万年）---
  {
    id: 'jin-wen-shen-mang',
    name: '金纹神蟒',
    areaTier: 'inner',
    baseHpPerYear: 1.3,
    baseAtkPerYear: 0.20,
    baseDefPerYear: 0.14,
    baseSpdPerYear: 0.15,
    skills: [{ name: '金纹绞杀', desc: '全身金纹亮起，金属化躯体绞杀猎物' }],
    description: '身披金色神秘纹路的巨蟒，鳞甲堪比精钢',
    element: '金属性',
  },
  {
    id: 'bai-jin-sheng-hu',
    name: '白金圣虎',
    areaTier: 'inner',
    baseHpPerYear: 1.5,
    baseAtkPerYear: 0.26,
    baseDefPerYear: 0.16,
    baseSpdPerYear: 0.22,
    skills: [{ name: '白金咆哮', desc: '白金之气凝聚的声波震碎敌人筋脉' }],
    description: '通体白金相间的神圣虎类魂兽，高贵而致命',
    element: '金属性',
  },
  {
    id: 'gang-lie-xiong',
    name: '刚烈熊',
    areaTier: 'inner',
    baseHpPerYear: 1.8,
    baseAtkPerYear: 0.24,
    baseDefPerYear: 0.18,
    baseSpdPerYear: 0.10,
    skills: [{ name: '钢铁之拳', desc: '金属化的巨拳轰出毁灭性一击' }],
    description: '全身骨骼金属化的狂暴巨熊，一拳可碎山岳',
    element: '金属性',
  },
  // --- core（万年~十万年）---
  {
    id: 'jin-jing-qi-lin',
    name: '金晶麒麟',
    areaTier: 'core',
    baseHpPerYear: 2.0,
    baseAtkPerYear: 0.28,
    baseDefPerYear: 0.22,
    baseSpdPerYear: 0.18,
    skills: [{ name: '金晶圣光', desc: '金晶之力汇聚的神圣光柱净化一切' }],
    description: '浑身散发金色晶光的祥瑞神兽，攻防兼备',
    element: '金属性',
  },
  {
    id: 'xuan-tie-ju-long',
    name: '玄铁巨龙',
    areaTier: 'core',
    baseHpPerYear: 2.2,
    baseAtkPerYear: 0.26,
    baseDefPerYear: 0.26,
    baseSpdPerYear: 0.12,
    skills: [{ name: '玄铁龙息', desc: '漆黑如墨的玄铁龙息熔金销骨' }],
    description: '鳞片由玄铁凝成的巨龙，肉身坚硬无比',
    element: '金属性',
  },
  {
    id: 'jin-gang-bu-huai-xiong',
    name: '金刚不坏熊',
    areaTier: 'core',
    baseHpPerYear: 2.5,
    baseAtkPerYear: 0.24,
    baseDefPerYear: 0.30,
    baseSpdPerYear: 0.08,
    skills: [{ name: '金刚不坏', desc: '全身金刚化，物理防御达到极致' }],
    description: '修成金刚不坏之身的熊中至尊，刀枪不入',
    element: '金属性',
  },
  // --- life-lake（二十万年+）---
  {
    id: 'jin-jiao-ju-shou',
    name: '金角巨兽',
    areaTier: 'life-lake',
    baseHpPerYear: 2.4,
    baseAtkPerYear: 0.30,
    baseDefPerYear: 0.24,
    baseSpdPerYear: 0.14,
    skills: [{ name: '金角破灭光', desc: '金色独角射出毁灭光束' }],
    description: '头顶金色巨角的远古巨兽，破坏力惊人',
    element: '金属性',
  },
  {
    id: 'wu-xing-jian-sheng',
    name: '五行剑圣',
    areaTier: 'life-lake',
    baseHpPerYear: 1.8,
    baseAtkPerYear: 0.38,
    baseDefPerYear: 0.16,
    baseSpdPerYear: 0.26,
    skills: [{ name: '万剑归宗', desc: '万千金剑齐发，覆盖天地的剑道绝唱' }],
    description: '化形为人形的剑道至尊魂兽，一剑可破万法',
    element: '金属性',
  },
  {
    id: 'tai-shang-jin-shen',
    name: '太上金身',
    areaTier: 'life-lake',
    baseHpPerYear: 3.0,
    baseAtkPerYear: 0.32,
    baseDefPerYear: 0.35,
    baseSpdPerYear: 0.10,
    skills: [{ name: '金身不灭', desc: '太上道金神化身，肉身成圣永不磨灭' }],
    description: '传说中由道祖点化的金属性至尊魂兽，金身永恒',
    element: '金属性',
  },
];

// 生成魂兽实例（带随机年限、动态属性）
// 核心规则：先按区域确定年限范围，再按实际年限选对应 tier 的物种，确保物种品质与年限严格匹配
export function generateBeastInstance(areaTier: 'outer' | 'middle' | 'inner' | 'core' | 'life-lake', options?: { hpMultiplier?: number; attributeFilter?: string | string[] }) {
  let [minYear, maxYear] = RING_YEAR_RANGES[areaTier];

  // 核心区 & 生命之湖 分层概率：控制高年限魂兽出现率
  if (areaTier === 'core' || areaTier === 'life-lake') {
    const r = Math.random();
    const baseOffset = areaTier === 'life-lake' ? 100000 : 0;
    if (r < 0.41) {
       [minYear, maxYear] = [100000 + baseOffset, 200000 + baseOffset];
     } else if (r < 0.70) {
       [minYear, maxYear] = [200001 + baseOffset, 500000 + baseOffset];
     } else if (r < 0.85) {
       [minYear, maxYear] = [500001 + baseOffset, 800000 + baseOffset];
     } else if (r < 0.95) {
       [minYear, maxYear] = [800001 + baseOffset, 999999];
     } else {
       const r2 = Math.random();
       if (r2 < 0.7) {
         [minYear, maxYear] = [1000000, 2000000];
       } else if (r2 < 0.9) {
         [minYear, maxYear] = [2000001, 3000000];
       } else {
         [minYear, maxYear] = [3000001, 5000000];
       }
     }
  } else {
    // 其他区域：稀有年限加成（小概率碰到略高年限的魂兽，跨度严格限制）
    const rareBoost = RARE_YEAR_BOOST[areaTier];
    if (rareBoost && Math.random() < rareBoost.chance) {
      [minYear, maxYear] = rareBoost.range;
    }
  }

  // 先随机年限
  const years = Math.floor(Math.random() * (maxYear - minYear + 1)) + minYear;

  // 根据年限确定物种 tier（确保魂兽物种与年限匹配，不会出现"十年魂兽长着十万年属性"）
  let speciesTier: 'outer' | 'middle' | 'inner' | 'core' | 'life-lake';
  if (years < 1000) speciesTier = 'outer';           // 十年~百年 → 外围物种
  else if (years < 10000) speciesTier = 'middle';     // 千年级 → 中部物种
  else if (years < 100000) speciesTier = 'inner';     // 万年级 → 内圈物种
  else if (years < 500000) speciesTier = 'core';      // 十万年级 → 核心物种
  else speciesTier = 'life-lake';                     // 五十万年+ → 生命之湖/凶兽级物种

  // 属性归一化（内联轻量版，避免循环依赖 gameStore）：
  // 「X属性」标准名 + 常见别名 → 11种标准属性
  const normalizeAttr = (a: string): string => {
    const map: Record<string, string> = {
      '金属性': '金属性', '木属性': '木属性', '水属性': '水属性',
      '火属性': '火属性', '土属性': '土属性', '冰属性': '冰属性',
      '光属性': '光属性', '暗属性': '暗属性', '时间属性': '时间属性',
      '空间属性': '空间属性', '精神属性': '精神属性',
      '光明属性': '光属性', '神圣属性': '光属性', '圣属性': '光属性',
      '黑暗属性': '暗属性', '暗影属性': '暗属性', '亡灵属性': '暗属性',
      '死亡属性': '暗属性', '邪魔属性': '暗属性', '修罗属性': '暗属性', '幽冥属性': '暗属性',
      '雷属性': '火属性', '雷霆属性': '火属性',
      '风属性': '木属性', '敏捷属性': '木属性', '毒属性': '木属性', '生命属性': '木属性',
      '混沌属性': '空间属性', '时空属性': '空间属性',
      '神识属性': '精神属性', '灵魂属性': '精神属性', '轮回属性': '精神属性',
    };
    if (map[a]) return map[a];
    if (a.includes('光') || a.includes('明') || a.includes('神圣') || a.includes('圣')) return '光属性';
    if (a.includes('暗') || a.includes('黑暗') || a.includes('死亡') || a.includes('魔') || a.includes('修罗') || a.includes('幽冥')) return '暗属性';
    if (a.includes('火') || a.includes('雷') || a.includes('炎') || a.includes('焰') || a.includes('赤')) return '火属性';
    if (a.includes('冰') || a.includes('雪') || a.includes('霜') || a.includes('寒')) return '冰属性';
    if (a.includes('水') || a.includes('海') || a.includes('雨') || a.includes('浪')) return '水属性';
    if (a.includes('金') || a.includes('铁') || a.includes('钢')) return '金属性';
    if (a.includes('木') || a.includes('毒') || a.includes('植物') || a.includes('风') || a.includes('草') || a.includes('树') || a.includes('藤')) return '木属性';
    if (a.includes('土') || a.includes('岩') || a.includes('石') || a.includes('山')) return '土属性';
    if (a.includes('时间') || a.includes('春秋')) return '时间属性';
    if (a.includes('空间') || a.includes('混沌') || a.includes('虚空') || a.includes('太虚')) return '空间属性';
    if (a.includes('精神') || a.includes('灵魂') || a.includes('神识') || a.includes('轮回') || a.includes('心灵') || a.includes('念力')) return '精神属性';
    return a;
  };

  // 按 speciesTier 选物种池（属性过滤可选，按归一化后比较）
  let pool = SOUL_BEAST_POOL.filter((b) => b.areaTier === speciesTier);
  if (options?.attributeFilter) {
    const rawFilters = Array.isArray(options.attributeFilter) ? options.attributeFilter : [options.attributeFilter];
    const filters = rawFilters.map(normalizeAttr);
    const filtered = pool.filter((b) => b.element && filters.includes(normalizeAttr(b.element)));
    if (filtered.length > 0) pool = filtered;
  }
  // 兜底：该 tier 无匹配物种时，退一级找（同样按归一化属性匹配）
  if (pool.length === 0) {
    const fallbackTiers: Record<string, string[]> = {
      'life-lake': ['core', 'inner'],
      'core': ['inner', 'middle'],
      'inner': ['middle', 'outer'],
      'middle': ['outer'],
      'outer': [],
    };
    for (const ft of (fallbackTiers[speciesTier] || [])) {
      let fp = SOUL_BEAST_POOL.filter((b) => b.areaTier === ft);
      if (options?.attributeFilter) {
        const rawFilters = Array.isArray(options.attributeFilter) ? options.attributeFilter : [options.attributeFilter];
        const filters = rawFilters.map(normalizeAttr);
        const ffp = fp.filter((b) => b.element && filters.includes(normalizeAttr(b.element)));
        if (ffp.length > 0) fp = ffp;
      }
      if (fp.length > 0) { pool = fp; break; }
    }
  }
  if (pool.length === 0) return null;
  const species = pool[Math.floor(Math.random() * pool.length)];

  // 按年限 + 物种基础系数计算属性
  const stats = getBeastStatsByYears(years, species.baseAtkPerYear, species.baseDefPerYear, species.baseHpPerYear, species.baseSpdPerYear);
  const hpMul = options?.hpMultiplier ?? 1;
  const finalHp = Math.max(1, Math.round(stats.hp * hpMul));
  const { color, label } = getRingQualityFromYears(years);

  return {
    id: `${species.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    speciesId: species.id,
    name: species.name,
    years,
    qualityColor: color,
    qualityLabel: label,
    areaTier,
    hp: finalHp,
    attack: stats.attack,
    defense: stats.defense,
    speed: stats.speed,
    spirit: stats.spirit || 0,
    skillName: species.skills[0].name,
    skillDesc: species.skills[0].desc,
    description: species.description,
    element: species.element,
  };
}

// v2.0 按指定年限范围生成魂兽（副本模式）
// yearMin/yearMax：副本的基础年限范围
// rareChance / rareBoostMin / rareBoostMax：小概率跨级更高年限
// attributeFilter：可选属性过滤（如极北只出冰属性）
export function generateBeastByYearRange(
  yearMin: number,
  yearMax: number,
  rareChance: number = 0,
  rareBoostMin: number = 1,
  rareBoostMax: number = 1,
  attributeFilter?: string | string[],
) {
  // 基础年限范围
  let finalMin = yearMin;
  let finalMax = yearMax;

  // 稀有跨级：小概率碰到更高年限魂兽（先确定最终年限，再按年限选对应 tier 的物种）
  const isRare = rareChance > 0 && Math.random() < rareChance;
  if (isRare) {
    finalMin = Math.floor(yearMax * rareBoostMin);
    finalMax = Math.floor(yearMax * rareBoostMax);
  }

  // 按最终年限的中点推断 areaTier，用来选物种池（稀有跨级时物种也同步升级，避免低阶魂兽拥有高阶年限）
  const midYear = (finalMin + finalMax) / 2;
  let areaTier: 'outer' | 'middle' | 'inner' | 'core' | 'life-lake';
  if (midYear < 1000) areaTier = 'outer';
  else if (midYear < 10000) areaTier = 'middle';
  else if (midYear < 100000) areaTier = 'inner';
  else if (midYear < 500000) areaTier = 'core';
  else areaTier = 'life-lake';

  // 属性归一化（内联轻量版，与 generateBeastInstance 保持一致）
  const normalizeAttr = (a: string): string => {
    const map: Record<string, string> = {
      '金属性': '金属性', '木属性': '木属性', '水属性': '水属性',
      '火属性': '火属性', '土属性': '土属性', '冰属性': '冰属性',
      '光属性': '光属性', '暗属性': '暗属性', '时间属性': '时间属性',
      '空间属性': '空间属性', '精神属性': '精神属性',
      '光明属性': '光属性', '神圣属性': '光属性', '圣属性': '光属性',
      '黑暗属性': '暗属性', '暗影属性': '暗属性', '亡灵属性': '暗属性',
      '死亡属性': '暗属性', '邪魔属性': '暗属性', '修罗属性': '暗属性', '幽冥属性': '暗属性',
      '雷属性': '火属性', '雷霆属性': '火属性',
      '风属性': '木属性', '敏捷属性': '木属性', '毒属性': '木属性', '生命属性': '木属性',
      '混沌属性': '空间属性', '时空属性': '空间属性',
      '神识属性': '精神属性', '灵魂属性': '精神属性', '轮回属性': '精神属性',
    };
    if (map[a]) return map[a];
    if (a.includes('光') || a.includes('明') || a.includes('神圣') || a.includes('圣')) return '光属性';
    if (a.includes('暗') || a.includes('黑暗') || a.includes('死亡') || a.includes('魔') || a.includes('修罗') || a.includes('幽冥')) return '暗属性';
    if (a.includes('火') || a.includes('雷') || a.includes('炎') || a.includes('焰') || a.includes('赤')) return '火属性';
    if (a.includes('冰') || a.includes('雪') || a.includes('霜') || a.includes('寒')) return '冰属性';
    if (a.includes('水') || a.includes('海') || a.includes('雨') || a.includes('浪')) return '水属性';
    if (a.includes('金') || a.includes('铁') || a.includes('钢')) return '金属性';
    if (a.includes('木') || a.includes('毒') || a.includes('植物') || a.includes('风') || a.includes('草') || a.includes('树') || a.includes('藤')) return '木属性';
    if (a.includes('土') || a.includes('岩') || a.includes('石') || a.includes('山')) return '土属性';
    if (a.includes('时间') || a.includes('春秋')) return '时间属性';
    if (a.includes('空间') || a.includes('混沌') || a.includes('虚空') || a.includes('太虚')) return '空间属性';
    if (a.includes('精神') || a.includes('灵魂') || a.includes('神识') || a.includes('轮回') || a.includes('心灵') || a.includes('念力')) return '精神属性';
    return a;
  };

   let pool = SOUL_BEAST_POOL.filter((b) => b.areaTier === areaTier);
   const hasAttrFilter = !!attributeFilter;
   const rawFilters = hasAttrFilter
     ? (Array.isArray(attributeFilter) ? attributeFilter : [attributeFilter])
     : [];
   const filters = rawFilters.map(normalizeAttr);
   if (hasAttrFilter) {
     const filtered = pool.filter((b) => b.element && filters.includes(normalizeAttr(b.element)));
     if (filtered.length > 0) {
       pool = filtered;
     } else {
       // 🔴 修复：属性过滤无结果时，保持属性筛选逐级降级（跟 generateBeastInstance 一致）
       // 严禁退回无属性过滤的通用池，否则玩家选暗属性却出金属性魂兽
       const fallbackTiers: Record<string, string[]> = {
         'life-lake': ['core', 'inner', 'middle', 'outer'],
         'core': ['inner', 'middle', 'outer'],
         'inner': ['middle', 'outer'],
         'middle': ['outer'],
         'outer': [],
       };
       for (const ft of (fallbackTiers[areaTier] || [])) {
         const fp = SOUL_BEAST_POOL.filter((b) => b.areaTier === ft);
         const ffp = fp.filter((b) => b.element && filters.includes(normalizeAttr(b.element)));
         if (ffp.length > 0) { pool = ffp; break; }
       }
       // 全 tier 都找不到匹配属性的魂兽时返回 null，绝不乱出
       if (pool.length === 0 || pool.every((b) => b.areaTier === areaTier && !filters.includes(normalizeAttr(b.element || '')))) {
         // 二次确认：pool 里到底有没有符合属性的
         const stillFiltered = pool.filter((b) => b.element && filters.includes(normalizeAttr(b.element)));
         if (stillFiltered.length === 0) return null;
         pool = stillFiltered;
       }
     }
   }
   if (pool.length === 0) return null;

  const species = pool[Math.floor(Math.random() * pool.length)];

  const years = Math.floor(Math.random() * (finalMax - finalMin + 1)) + finalMin;

  const stats = getBeastStatsByYears(years, species.baseAtkPerYear, species.baseDefPerYear, species.baseHpPerYear, species.baseSpdPerYear);
  const finalHp = Math.max(1, stats.hp);
  const { color, label } = getRingQualityFromYears(years);

  return {
    id: `${species.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    speciesId: species.id,
    name: species.name,
    years,
    qualityColor: color,
    qualityLabel: label,
    areaTier,
    hp: finalHp,
    attack: stats.attack,
    defense: stats.defense,
    speed: stats.speed,
    spirit: stats.spirit || 0,
    skillName: species.skills[0].name,
    skillDesc: species.skills[0].desc,
    description: species.description,
    element: species.element,
  };
}

// v2.0 魂兽属性严格按新规定
// 十年魂兽：属性最低（基础值）
// 百年魂兽：血量800~3000，攻击50~200，防御20~500
// 千年魂兽：血量3000~1万，攻击200~700，防御200~300
// 万年魂兽：血量1万~10万，攻击1000~3000，防御300~700
// 10万~20万年：血量10万~50万，攻击5000~1万，防御1000~1200
// 20万~50万年：血量50万~200万，攻击1万~5万，防御1200~5000
// v8.0 重新规定魂兽血量（与年限匹配，合理梯度）
// 十年：100~500
// 百年：500~3000
// 千年：3000~15000
// 万年：1.5万~20万
// 十万年：20万~500万
// 二十万~五十万年：500万~3000万
// 五十万~八十万年：3000万~2亿
// 八十万~百万年：2亿~10亿
// 百万年以上：每多100万+30亿血量
// 攻击防御合理配平，防御不超过血量1%
export function getBeastStatsByYears(
  years: number,
  _baseAtk: number,
  _baseDef: number,
  _baseHp: number,
  baseSpd: number
) {
  const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * Math.max(0, Math.min(1, t)));

  let hp = 100, attack = 10, defense = 5, speed = 10;

  if (years < 100) {
    // 十年魂兽：血量100~500，攻击10~40，防御5~20
    const t = (years - 10) / 90;
    hp = lerp(100, 500, t);
    attack = lerp(10, 40, t);
    defense = lerp(5, 20, t);
    speed = Math.round(10 + t * 15 + baseSpd * 2);
  } else if (years < 1000) {
    // 百年魂兽：血量500~3000，攻击40~150，防御20~80
    const t = (years - 100) / 900;
    hp = Math.round(lerp(500, 3000, t) * 0.5);
    attack = lerp(40, 150, t);
    defense = lerp(20, 80, t);
    speed = Math.round(12 + t * 20 + baseSpd * 2.4);
  } else if (years < 10000) {
    // 千年魂兽：血量3000~15000，攻击150~600，防御80~300
    const t = (years - 1000) / 9000;
    hp = Math.round(lerp(3000, 15000, t) * 0.5);
    attack = lerp(150, 600, t);
    defense = lerp(80, 300, t);
    speed = Math.round(25 + t * 25 + baseSpd * 4);
  } else if (years < 100000) {
    // 万年魂兽：血量1.5万~20万，攻击600~3000，防御300~1500
    const t = (years - 10000) / 90000;
    hp = Math.round(lerp(15000, 200000, t) * 0.5);
    attack = lerp(600, 3000, t);
    defense = lerp(300, 1500, t);
    speed = Math.round(50 + t * 50 + baseSpd * 8);
  } else if (years < 200000) {
    // 10万~20万年：血量20万~100万，攻击3000~8000，防御1500~4000
    const t = (years - 100000) / 100000;
    hp = Math.round(lerp(200000, 1000000, t) * 0.25);
    attack = Math.round(lerp(3000, 8000, t) * 1.2);
    defense = Math.round(lerp(1500, 4000, t) * 1.2);
    speed = Math.round((80 + t * 20 + baseSpd * 10) * 1.3);
  } else if (years < 500000) {
    // 20万~50万年：血量100万~500万，攻击8000~25000，防御4000~12000
    const t = (years - 200000) / 300000;
    hp = Math.round(lerp(1000000, 5000000, t) * 0.25);
    attack = Math.round(lerp(8000, 25000, t) * 1.2);
    defense = Math.round(lerp(4000, 12000, t) * 1.2);
    speed = Math.round((100 + t * 30 + baseSpd * 12) * 1.4);
  } else if (years < 800000) {
    // 50万~80万年：血量500万~3000万，攻击25000~60000，防御12000~30000
    const t = (years - 500000) / 300000;
    hp = Math.round(lerp(5000000, 30000000, t) * 0.25);
    attack = Math.round(lerp(25000, 60000, t) * 1.25);
    defense = Math.round(lerp(12000, 30000, t) * 1.25);
    speed = Math.round((120 + t * 20 + baseSpd * 15) * 1.5);
  } else if (years < 1000000) {
    // 80万~100万年：血量3000万~10亿，攻击60000~120000，防御30000~60000
    const t = (years - 800000) / 200000;
    hp = Math.round(lerp(30000000, 1000000000, t) * 0.25);
    attack = Math.round(lerp(60000, 120000, t) * 1.3);
    defense = Math.round(lerp(30000, 60000, t) * 1.3);
    speed = Math.round((140 + t * 20 + baseSpd * 18) * 1.6);
  } else {
    // 100万年以上：100万年整=2亿血/1000万攻，每多10万年全属性+10%（四舍五入）
    const extra100k = Math.floor((years - 1000000) / 100000);
    const mul = Math.pow(1.1, extra100k);
    const baseHp = 200000000;
    const baseAtk = 10000000;
    const baseDef = 3000000;
    const baseSpd = 200;
    hp = Math.round(baseHp * mul);
    attack = Math.round(baseAtk * mul);
    defense = Math.round(baseDef * mul);
    speed = Math.round(baseSpd * (1 + baseSpd * 0.01) * mul);
  }

  // 安全检查
  if (!isFinite(hp) || isNaN(hp)) hp = 1000;
  if (!isFinite(attack) || isNaN(attack)) attack = 50;
  if (!isFinite(defense) || isNaN(defense)) defense = 20;
  if (!isFinite(speed) || isNaN(speed)) speed = 10;

  // 🔴 全局怪物属性加强10%（所有阶段的魂兽统一小幅度强化）
  hp = Math.max(1, Math.round(hp * 1.1));
  attack = Math.max(1, Math.round(attack * 1.1));
  defense = Math.max(1, Math.round(defense * 1.1));
  speed = Math.max(1, Math.round(speed * 1.1));

  return {
    hp,
    attack,
    defense,
    speed,
    spirit: 0,
  };
};

// v2.0 魂骨掉落规则
// - 100万年以上（不含100万）魂兽击杀不掉落魂骨，只掉魂环
// - 魂骨不增加暴击与爆伤属性
// - 年限倍率：按新规定重新计算
//   十年(10-99): 基础值
//   百年(100-999): 最低是十年的20%，最高是十年的40%
//   千年(1000-9999): 最低是百年的50%，最高是百年的70%
//   万年(10000-99999): 最低是千年的100%，最高是千年的200%
//   十万年~百万年：最低五维均为5万，随年份增长，100万年最高800万五维
export function rollSoulBoneDrop(beastYears: number, beastName: string, qualityColor: string, beastAttribute?: string) {
  // v13.0：魂骨掉率大幅提升，确保玩家有充足的魂骨获取途径
  // 🔴 100万年以上（不含100万整）魂兽不掉落魂骨，只掉魂环（符合原著设定）
  if (beastYears > 1000000) return null;
  let rate = 0.15; // 十年默认 15%
  if (beastYears >= 1000000) rate = 1;                // 100万年整 100%（神级）
  else if (beastYears >= 100000) rate = 1;             // 十万年 100%
  else if (beastYears >= 50000) rate = 0.7;            // 高阶万年（5万~9.9万）70%
  else if (beastYears >= 10000) rate = 0.5;            // 低阶万年（1万~5万）50%
  else if (beastYears >= 1000) rate = 0.3;             // 千年 30%
  else if (beastYears >= 100) rate = 0.2;              // 百年 20%
  // 十年 15%

  if (Math.random() > rate) return null;

  // 部位随机（5% 概率为外附魂骨，其余六部位平分）
  const isExternal = Math.random() < 0.05;
  const boneSlots = [
    { slot: 'head', name: '头骨' },
    { slot: 'torso', name: '躯干骨' },
    { slot: 'leftArm', name: '左臂骨' },
    { slot: 'rightArm', name: '右臂骨' },
    { slot: 'leftLeg', name: '左腿骨' },
    { slot: 'rightLeg', name: '右腿骨' },
  ];
  const picked = isExternal
    ? { slot: 'external', name: '外附魂骨' }
    : boneSlots[Math.floor(Math.random() * boneSlots.length)];

  // 根据年限确定魂骨品质和颜色
  const qualityMap: Record<string, { quality: 'common' | 'rare' | 'fine' | 'epic' | 'legendary'; color: string; label: string }> = {
    white: { quality: 'common', color: '#f0f0f0', label: '十年' },
    yellow: { quality: 'rare', color: '#fbbf24', label: '百年' },
    purple: { quality: 'fine', color: '#a855f7', label: '千年' },
    black: { quality: 'epic', color: '#000000', label: '万年' },
    red: { quality: 'legendary', color: '#ef4444', label: '十万年' },
    gold: { quality: 'legendary', color: '#fcd34d', label: '百万年' },
  };
  const tier = qualityMap[qualityColor] || qualityMap.purple;

  // 🔴 v18.0 魂骨五维基础数值（按用户要求重新定义）
  // 基础规则：
  //   - 10万年 = 5万五维属性，99万年 = 8万五维属性，线性增长
  //   - 100万年 = 10万五维属性，999万年 = 30万五维属性，线性增长
  //   - 每100万年+2万五维属性，无断点
  //   - 五维各属性等值（攻击/防御/速度/精神/气血）
  //   - 游戏最高年限为 999 万年，不存在 1000 万年
  let atk = 0, def = 0, hp = 0, spd = 0, sprt = 0;
  let tierLabel = '十年';

  const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * Math.max(0, Math.min(1, t)));
  // 限制最高年限为 999 万年
  const cappedYears = Math.min(beastYears, 9990000);

  if (cappedYears >= 1000000) {
    // 百万年~999万年：五维 10万 → 30万，线性增长，每100万年+2万
    tierLabel = '百万年';
    const t = Math.min(1, (cappedYears - 1000000) / 8990000);
    atk = lerp(100000, 300000, t);
    def = lerp(100000, 300000, t);
    hp  = lerp(100000, 300000, t);
    spd = lerp(100000, 300000, t);
    sprt = lerp(100000, 300000, t);
  } else if (cappedYears >= 100000) {
    // 十万年~99万年：五维 5万 → 8万，线性增长
    tierLabel = '十万年';
    const t = (cappedYears - 100000) / 890000;
    atk = lerp(50000, 80000, t);
    def = lerp(50000, 80000, t);
    hp  = lerp(50000, 80000, t);
    spd = lerp(50000, 80000, t);
    sprt = lerp(50000, 80000, t);
  } else if (cappedYears >= 10000) {
    // 万年：1200→10000攻击（×2.5）
    tierLabel = '万年';
    const t = (cappedYears - 10000) / 90000;
    atk = lerp(1200, 10000, t);
    def = lerp(960, 8000, t);
    hp  = lerp(5000, 40000, t);
    spd = lerp(600, 5000, t);
    sprt = lerp(720, 6000, t);
  } else if (cappedYears >= 1000) {
    // 千年：100→1100攻击（×2.5）
    tierLabel = '千年';
    const t = (cappedYears - 1000) / 9000;
    atk = lerp(100, 1100, t);
    def = lerp(80, 880, t);
    hp  = lerp(400, 4400, t);
    spd = lerp(50, 550, t);
    sprt = lerp(60, 660, t);
  } else if (cappedYears >= 100) {
    // 百年：12→90攻击（×2.5）
    tierLabel = '百年';
    const t = (cappedYears - 100) / 900;
    atk = lerp(12, 90, t);
    def = lerp(10, 72, t);
    hp  = lerp(50, 360, t);
    spd = lerp(6, 44, t);
    sprt = lerp(7, 52, t);
  } else {
    // 十年：2→11攻击（×2.5）
    tierLabel = '十年';
    const t = Math.max(0, (cappedYears - 10) / 90);
    atk = Math.max(2, lerp(2, 11, t));
    def = Math.max(2, lerp(2, 9, t));
    hp  = Math.max(20, lerp(10, 45, t));
    spd = Math.max(1, lerp(1, 6, t));
    sprt = Math.max(1, lerp(1, 6, t));
  }

  // v2.0 按部位侧重差异化（主属性+60%，其他保持基础值）
  // 魂骨不增加暴击与爆伤属性
  let attackBonus = atk;
  let defenseBonus = def;
  let speedBonus = spd;
  let spiritBonus = sprt;
  let hpBonus = hp;

  const slot = picked.slot;
  if (slot === 'head') {
    // 头骨：精神为主
    spiritBonus = Math.floor(sprt * 1.6);
    attackBonus = Math.floor(atk * 0.7);
    defenseBonus = Math.floor(def * 0.7);
    hpBonus = Math.floor(hp * 0.7);
  } else if (slot === 'torso') {
    // 躯干骨：气血、防御为主
    hpBonus = Math.floor(hp * 1.8);
    defenseBonus = Math.floor(def * 1.6);
    speedBonus = Math.floor(spd * 0.6);
  } else if (slot === 'leftArm' || slot === 'rightArm') {
    // 臂骨：攻击为主
    attackBonus = Math.floor(atk * 1.8);
    defenseBonus = Math.floor(def * 0.7);
    hpBonus = Math.floor(hp * 0.7);
  } else if (slot === 'leftLeg' || slot === 'rightLeg') {
    // 腿骨：速度为主
    speedBonus = Math.floor(spd * 1.8);
    defenseBonus = Math.floor(def * 1.1);
    attackBonus = Math.floor(atk * 0.8);
  } else if (slot === 'external') {
    // 外附魂骨：全属性强化
    attackBonus = Math.floor(atk * 1.3);
    defenseBonus = Math.floor(def * 1.3);
    speedBonus = Math.floor(spd * 1.3);
    spiritBonus = Math.floor(sprt * 1.3);
    hpBonus = Math.floor(hp * 1.3);
  }

  // 随机浮动：±10%
  const randomFactor = 0.9 + Math.random() * 0.2;
  attackBonus = Math.max(1, Math.floor(attackBonus * randomFactor));
  defenseBonus = Math.max(1, Math.floor(defenseBonus * randomFactor));
  speedBonus = Math.max(1, Math.floor(speedBonus * randomFactor));
  spiritBonus = Math.max(1, Math.floor(spiritBonus * randomFactor));
  hpBonus = Math.max(1, Math.floor(hpBonus * randomFactor));

  return {
     id: `bone-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
     name: `${beastName}·${picked.name}`,
     type: 'soulBone' as const,
     slot: picked.slot,
     quality: tier.quality,
     qualityColor: tier.color,
     iconChar: beastName.slice(0, 1),
     description: `${tierLabel}魂骨，${beastName}掉落的${picked.name}，蕴含强大的魂兽之力`,
     attributes: {
       attack: attackBonus,
       defense: defenseBonus,
       speed: speedBonus,
       spirit: spiritBonus,
       hp: hpBonus,
       critRate: 0,     // v2.0 魂骨不加暴击
       critDmg: 0,      // v2.0 魂骨不加爆伤
       allAttr: 0,      // v2.0 移除全属性百分比
     },
      sellPrice: Math.floor(beastYears * 0.8),
      soulBoneYears: beastYears,
      soulBoneYearsLabel: tierLabel,
      beastAttribute,
      _attrVersion: 9, // v11.0 魂骨属性版本标记（整体下调50%）
    };
}

// 外附魂骨（已合并进 rollSoulBoneDrop 的 1% 概率分支中，保留此函数作为兼容接口）
export function rollExternalSoulBone() {
  return null;
}

// 魂技库：根据魂兽种类获取魂技名称（供吸收魂环时使用）
export function getSkillNameForBeast(beastName: string, defaultSkill: string): string {
  // 直接用魂兽自带的技能名（已在 generateBeastInstance 的 skillName 中返回）
  return defaultSkill || '未知魂技';
}

// 根据魂兽名称获取种族信息（用于魂环详情弹窗展示魂兽介绍）
export function getBeastSpeciesByName(name: string): ISoulBeastSpecies | null {
  return SOUL_BEAST_POOL.find((b) => b.name === name) || null;
}

// 根据区域和年限评估危险等级
export function getDangerLevel(areaTier: string, years: number): string {
  if (years >= 100000) return '极度危险（十万年级）';
  if (areaTier === 'core' || years >= 10000) return '高度危险（万年级）';
  if (areaTier === 'inner') return '危险（万年级）';
  if (areaTier === 'middle') return '中等（千年级）';
  return '较低（十年/百年）';
}
