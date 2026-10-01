// EXPORTS: IDivineTrial, IDivineArtifact, DIVINE_TRIALS, DIVINE_ARTIFACTS, getTrialById, getArtifactByDeity

// 神考等级
export type DeityTier = 'supreme' | 'king' | 'first' | 'second';

// 考核类型
export type TrialExamType =
  | 'reachLevel'        // 达到指定等级
  | 'absorbRing'        // 吸收指定年限魂环
  | 'defeatBeast'       // 击败指定魂兽（帝天等）
  | 'defeatAvatar'      // 击败自身化身
  | 'drawArtifact'      // 拔出神器（第六考）
  | 'arenaWinStreak'    // 竞技场连胜
  | 'defeatSpecific'    // 击败指定目标
  | 'attributeReach';   // 属性达到要求

// 单条考核定义
export interface ITrialExam {
  index: number;             // 第X考
  title: string;             // 考核名称
  description: string;       // 考核描述
  type: TrialExamType;
  // 参数字段（按 type 选用）
  targetLevel?: number;
  targetRingYears?: number;
  targetRingSlot?: number;
  beastName?: string;
  beastLocation?: string;
  winStreak?: number;
  // 奖励
  reward: {
    affinityPct?: number;    // 神位亲和度 +X%
    levelUp?: number;        // 等级+X
    ringYearsAll?: number;   // 所有魂环年限 +X
    divinePowerPct?: number; // 神力 +X%
    attrBonusPct?: number;   // 全属性 +X%
    boneYearsAll?: number;   // 魂骨年限 +X
  };
}

// 神考（神位）定义
export interface IDivineTrial {
  id: string;
  name: string;               // 神位名称，如「海神」
  fullName: string;           // 神考全称，如「海神九考」
  tier: DeityTier;            // 神王 / 一级神 / 二级神
  totalExams: number;         // 考核总数（7/8/9）
  element: string;            // 主属性
  color: string;              // 主题色（hex，喂给图表/渐变）
  bgGradient: string;         // 卡片背景渐变 tailwind 类
  description: string;        // 神位描述
  artifactId: string;         // 对应神器 id
  divineSkillName: string;    // 对应神技名称
  exams: ITrialExam[];        // 考核列表（按顺序）
  inheritBonus: {             // 继承神位奖励
    allAttrPct: number;       // 全属性 +X%
    levelTo100?: boolean;     // 是否突破百级
  };
}

// 神器定义
export interface IDivineArtifact {
  id: string;
  name: string;
  deityId: string;
  tier: 'super' | 'divine' | 'supreme';   // 超神器（神王级） / 神器（一级神/二级神） / 至高神器（至高神）
  maxLevel: number;           // 等级上限：至高神器200 / 超神器150 / 神器100
  description: string;
  icon: string;               // emoji 或单字
  baseCost: number;           // 每级升级费用（统一30万金币/级）
  // 每级全属性加成（百分比，五维均衡）
  // 至高神器 0.75%/级 × 200级 = 150%上限
  // 超神器   0.8%/级  × 150级 = 120%上限
  // 神器     0.9%/级  × 100级 = 90%上限
  perLevelBonus: {
    attack: number;
    defense: number;
    speed: number;
    spirit: number;
    hp: number;
  };
}

// ========== 至高神考核（7个）==========
const supremeTrials: Omit<IDivineTrial, 'exams'>[] = [
  { id: 'deity-creation', name: '创世神', fullName: '创世九考', tier: 'supreme', totalExams: 9, element: '创世', color: '#fcd34d',
    bgGradient: 'from-amber-500/30 via-yellow-400/20 to-orange-600/30',
    description: '创造和开辟宇宙的特殊存在，一挥手便是星辰生灭。', artifactId: 'art-creation-sword', divineSkillName: '创世·开天辟地',
    inheritBonus: { allAttrPct: 130, levelTo100: true } },
  { id: 'deity-dragon-god', name: '龙神', fullName: '龙神九考', tier: 'supreme', totalExams: 9, element: '龙', color: '#0ea5e9',
    bgGradient: 'from-cyan-600/30 via-blue-500/20 to-indigo-700/30',
    description: '诸天万界龙族的初代领袖，凌驾于众神之上的至强存在。', artifactId: 'art-dragon-god-spear', divineSkillName: '龙神·诸天寂灭',
    inheritBonus: { allAttrPct: 130, levelTo100: true } },
  { id: 'deity-pangu', name: '盘古', fullName: '盘古九考', tier: 'supreme', totalExams: 9, element: '力', color: '#f97316',
    bgGradient: 'from-orange-600/30 via-amber-500/20 to-red-700/30',
    description: '宇宙中开天辟地的无上存在，手持神斧劈开混沌。', artifactId: 'art-pangu-axe', divineSkillName: '盘古·开天一斧',
    inheritBonus: { allAttrPct: 130, levelTo100: true } },
  { id: 'deity-tea', name: '茶之神', fullName: '茶之九考', tier: 'supreme', totalExams: 9, element: '鸿蒙', color: '#22d3ee',
    bgGradient: 'from-teal-500/30 via-cyan-400/20 to-sky-700/30',
    description: '无上鸿蒙宇宙的创造者，一杯清茶，包罗万象。', artifactId: 'art-hongmeng-sword', divineSkillName: '鸿蒙·万道归一',
    inheritBonus: { allAttrPct: 130, levelTo100: true } },
  { id: 'deity-godslayer', name: '弑神', fullName: '弑神九考', tier: 'supreme', totalExams: 9, element: '弑', color: '#ef4444',
    bgGradient: 'from-red-700/40 via-rose-600/30 to-neutral-900/40',
    description: '远古时期击败过多位至高神的古老存在，神见神惧。', artifactId: 'art-godslayer-sword', divineSkillName: '弑神·万神俱灭',
    inheritBonus: { allAttrPct: 130, levelTo100: true } },
  { id: 'deity-fate', name: '命运之神', fullName: '命运九考', tier: 'supreme', totalExams: 9, element: '命运', color: '#a78bfa',
    bgGradient: 'from-violet-600/30 via-fuchsia-500/20 to-purple-800/30',
    description: '管理诸天万界所有人族气运的神秘存在，因果难逃。', artifactId: 'art-fate-wheel', divineSkillName: '命运·轮回审判',
    inheritBonus: { allAttrPct: 130, levelTo100: true } },
  { id: 'deity-wuji', name: '无极之神', fullName: '无极九考', tier: 'supreme', totalExams: 9, element: '无极', color: '#f472b6',
    bgGradient: 'from-pink-600/30 via-fuchsia-500/20 to-rose-700/30',
    description: '开创无极宇宙的超然存在，无极生太极，太极生万物。', artifactId: 'art-wuji-blade', divineSkillName: '无极·万物归源',
    inheritBonus: { allAttrPct: 130, levelTo100: true } },
  { id: 'deity-melancholy', name: '忧郁之神', fullName: '忧郁九考', tier: 'supreme', totalExams: 9, element: '忧郁', color: '#64748b',
    bgGradient: 'from-slate-600/30 via-gray-500/20 to-zinc-800/40',
    description: '执掌忧郁与哀伤的至高神，沉郁之力可侵蚀神魂，万物皆陷悲寂。', artifactId: 'art-melancholy-spear', divineSkillName: '忧郁·万古悲寂',
    inheritBonus: { allAttrPct: 130, levelTo100: true } },
];

// ========== 神王考核（8个）==========
const kingTrials: Omit<IDivineTrial, 'exams'>[] = [
  { id: 'deity-destruction', name: '毁灭之神', fullName: '毁灭九考', tier: 'king', totalExams: 9, element: '毁灭', color: '#6b21a8',
    bgGradient: 'from-purple-900/60 via-violet-900/50 to-indigo-950/60',
    description: '执掌毁灭权柄，万物归寂。拥有毁灭之力的至强神位。', artifactId: 'art-destruction-staff', divineSkillName: '毁灭冲击',
    inheritBonus: { allAttrPct: 100, levelTo100: true } },
  { id: 'deity-life', name: '生命之神', fullName: '生命九考', tier: 'king', totalExams: 9, element: '生命', color: '#16a34a',
    bgGradient: 'from-emerald-900/60 via-green-900/50 to-teal-950/60',
    description: '执掌生命权柄，生机勃发。万物之源的至善神位。', artifactId: 'art-life-staff', divineSkillName: '生命绽放',
    inheritBonus: { allAttrPct: 100, levelTo100: true } },
  { id: 'deity-asura', name: '修罗之神', fullName: '修罗九考', tier: 'king', totalExams: 9, element: '黑暗属性', color: '#6b21a8',
    bgGradient: 'from-purple-900/40 via-violet-800/20 to-slate-900/40',
    description: '执掌杀罚与审判，修罗一出，血染长空。', artifactId: 'art-asura-sword', divineSkillName: '修罗审判',
    inheritBonus: { allAttrPct: 85, levelTo100: true } },
  { id: 'deity-kindness', name: '善良之神', fullName: '善良九考', tier: 'king', totalExams: 9, element: '善良', color: '#f59e0b',
    bgGradient: 'from-amber-700/50 via-yellow-700/40 to-orange-950/60',
    description: '执掌善念，心怀慈悲。温暖与希望的化身。', artifactId: 'art-kindness-heart', divineSkillName: '善良之光',
    inheritBonus: { allAttrPct: 100, levelTo100: true } },
  { id: 'deity-evil', name: '邪恶之神', fullName: '邪恶九考', tier: 'king', totalExams: 9, element: '邪恶', color: '#7c3aed',
    bgGradient: 'from-fuchsia-900/60 via-purple-900/50 to-gray-950/60',
    description: '执掌邪恶，掌控贪欲。黑暗深处的诱惑之神。', artifactId: 'art-evil-spear', divineSkillName: '邪恶侵蚀',
    inheritBonus: { allAttrPct: 100, levelTo100: true } },
  { id: 'deity-sword', name: '剑神', fullName: '剑之九考', tier: 'king', totalExams: 9, element: '剑', color: '#06b6d4',
    bgGradient: 'from-cyan-900/60 via-sky-900/50 to-blue-950/60',
    description: '剑道极致，一剑破万法。剑中之神。', artifactId: 'art-zhu-zhu', divineSkillName: '万剑归宗',
    inheritBonus: { allAttrPct: 100, levelTo100: true } },
  { id: 'deity-spear', name: '枪神', fullName: '枪之九考', tier: 'king', totalExams: 9, element: '枪', color: '#ea580c',
    bgGradient: 'from-orange-900/60 via-amber-900/50 to-red-950/60',
    description: '枪道巅峰，一力破万巧。枪出如龙。', artifactId: 'art-mie-shi', divineSkillName: '贯穿天地',
    inheritBonus: { allAttrPct: 100, levelTo100: true } },
  { id: 'deity-archer', name: '弓神', fullName: '弓之九考', tier: 'king', totalExams: 9, element: '弓', color: '#eab308',
    bgGradient: 'from-yellow-900/60 via-amber-800/50 to-orange-950/60',
    description: '弓道通神，百步穿杨。一箭破万军。', artifactId: 'art-zhu-ri', divineSkillName: '逐日一箭',
    inheritBonus: { allAttrPct: 100, levelTo100: true } },
];

// ========== 一级神考核（23个）==========
const firstTierTrials: Omit<IDivineTrial, 'exams'>[] = [
  { id: 'deity-sea', name: '海神', fullName: '海神九考', tier: 'first', totalExams: 9, element: '水', color: '#0284c7',
    bgGradient: 'from-blue-900/60 via-cyan-900/50 to-sky-950/60',
    description: '执掌浩瀚海洋，海神三叉戟威震八方。', artifactId: 'art-sea-trident', divineSkillName: '海神之怒',
    inheritBonus: { allAttrPct: 80, levelTo100: true } },
  { id: 'deity-emotion', name: '情绪之神', fullName: '情绪九考', tier: 'first', totalExams: 9, element: '精神', color: '#ec4899',
    bgGradient: 'from-pink-900/60 via-fuchsia-900/50 to-purple-950/60',
    description: '执掌七情六欲，情绪之力可融天地。', artifactId: 'art-emotion-sword', divineSkillName: '情绪风暴',
    inheritBonus: { allAttrPct: 80, levelTo100: true } },
  { id: 'deity-angel', name: '天使之神', fullName: '天使九考', tier: 'first', totalExams: 9, element: '光明', color: '#fbbf24',
    bgGradient: 'from-yellow-700/50 via-amber-700/40 to-orange-950/60',
    description: '执掌光明与神圣，天使降临普照万物。', artifactId: 'art-angel-sword', divineSkillName: '天使降临',
    inheritBonus: { allAttrPct: 80, levelTo100: true } },
  { id: 'deity-rakshasa', name: '罗刹之神', fullName: '罗刹九考', tier: 'first', totalExams: 9, element: '黑暗', color: '#be123c',
    bgGradient: 'from-rose-900/60 via-red-900/50 to-gray-950/60',
    description: '执掌邪念与杀戮，罗刹之神恐怖至极。', artifactId: 'art-rakshasa-scythe', divineSkillName: '罗刹噬魂',
    inheritBonus: { allAttrPct: 80, levelTo100: true } },
  { id: 'deity-destruction2', name: '破坏之神', fullName: '破坏九考', tier: 'first', totalExams: 9, element: '破坏', color: '#ef4444',
    bgGradient: 'from-red-800/60 via-orange-900/50 to-slate-950/60',
    description: '执掌破坏之力，毁灭一切桎梏。', artifactId: 'art-destruction-spear', divineSkillName: '破坏之力',
    inheritBonus: { allAttrPct: 80, levelTo100: true } },
  { id: 'deity-water', name: '水神', fullName: '水之九考', tier: 'first', totalExams: 9, element: '水', color: '#0ea5e9',
    bgGradient: 'from-sky-800/60 via-blue-900/50 to-cyan-950/60',
    description: '执掌水之法则，上善若水，润物无声。', artifactId: 'art-ping-shui', divineSkillName: '沧海横流',
    inheritBonus: { allAttrPct: 80, levelTo100: true } },
  { id: 'deity-fire', name: '火神', fullName: '火之九考', tier: 'first', totalExams: 9, element: '火', color: '#f97316',
    bgGradient: 'from-orange-800/60 via-red-800/50 to-yellow-950/60',
    description: '执掌火焰法则，焚尽八荒。', artifactId: 'art-yang-yan', divineSkillName: '烈焰焚天',
    inheritBonus: { allAttrPct: 80, levelTo100: true } },
  { id: 'deity-earth', name: '土神', fullName: '土之九考', tier: 'first', totalExams: 9, element: '土', color: '#a16207',
    bgGradient: 'from-yellow-900/60 via-amber-900/50 to-stone-950/60',
    description: '执掌大地法则，厚德载物。', artifactId: 'art-di-shield', divineSkillName: '大地崩裂',
    inheritBonus: { allAttrPct: 80, levelTo100: true } },
  { id: 'deity-wind', name: '风神', fullName: '风之九考', tier: 'first', totalExams: 9, element: '风', color: '#14b8a6',
    bgGradient: 'from-teal-800/60 via-emerald-900/50 to-cyan-950/60',
    description: '执掌风之法则，来去无踪，快如闪电。', artifactId: 'art-ji-feng', divineSkillName: '狂风怒号',
    inheritBonus: { allAttrPct: 80, levelTo100: true } },
  { id: 'deity-light', name: '光神', fullName: '光之九考', tier: 'first', totalExams: 9, element: '光明', color: '#facc15',
    bgGradient: 'from-yellow-600/50 via-amber-600/40 to-yellow-950/60',
    description: '执掌光明法则，光芒普照。', artifactId: 'art-guang-shou', divineSkillName: '圣光普照',
    inheritBonus: { allAttrPct: 80, levelTo100: true } },
  { id: 'deity-dark', name: '黑暗之神', fullName: '黑暗九考', tier: 'first', totalExams: 9, element: '黑暗', color: '#6366f1',
    bgGradient: 'from-indigo-900/60 via-purple-900/50 to-gray-950/60',
    description: '执掌黑暗法则，暗夜永临。', artifactId: 'art-hei-fa', divineSkillName: '黑暗吞噬',
    inheritBonus: { allAttrPct: 80, levelTo100: true } },
  { id: 'deity-greed', name: '贪婪之神', fullName: '贪婪九考', tier: 'first', totalExams: 9, element: '贪婪', color: '#ca8a04',
    bgGradient: 'from-yellow-800/60 via-amber-800/50 to-orange-950/60',
    description: '七宗罪之贪婪，无尽的占有欲。', artifactId: 'art-greed-sword', divineSkillName: '贪婪攫取',
    inheritBonus: { allAttrPct: 80, levelTo100: true } },
  { id: 'deity-lazy', name: '懒惰之神', fullName: '懒惰九考', tier: 'first', totalExams: 9, element: '懒惰', color: '#64748b',
    bgGradient: 'from-slate-800/60 via-gray-800/50 to-slate-950/60',
    description: '七宗罪之懒惰，沉眠与怠惰的主宰。', artifactId: 'art-lazy-sword', divineSkillName: '慵懒领域',
    inheritBonus: { allAttrPct: 80, levelTo100: true } },
  { id: 'deity-anger', name: '愤怒之神', fullName: '愤怒九考', tier: 'first', totalExams: 9, element: '愤怒', color: '#dc2626',
    bgGradient: 'from-red-800/60 via-rose-900/50 to-orange-950/60',
    description: '七宗罪之愤怒，怒火焚身的狂暴之神。', artifactId: 'art-anger-sword', divineSkillName: '暴怒一击',
    inheritBonus: { allAttrPct: 80, levelTo100: true } },
  { id: 'deity-arrogant', name: '傲慢之神', fullName: '傲慢九考', tier: 'first', totalExams: 9, element: '傲慢', color: '#7c3aed',
    bgGradient: 'from-violet-800/60 via-purple-800/50 to-indigo-950/60',
    description: '七宗罪之傲慢，俯视众生的高贵之神。', artifactId: 'art-arrogant-sword', divineSkillName: '傲慢蔑视',
    inheritBonus: { allAttrPct: 80, levelTo100: true } },
  { id: 'deity-envy', name: '嫉妒之神', fullName: '嫉妒九考', tier: 'first', totalExams: 9, element: '嫉妒', color: '#16a34a',
    bgGradient: 'from-green-800/60 via-emerald-900/50 to-teal-950/60',
    description: '七宗罪之嫉妒，不甘与怨念的化身。', artifactId: 'art-envy-sword', divineSkillName: '嫉妒诅咒',
    inheritBonus: { allAttrPct: 80, levelTo100: true } },
  { id: 'deity-lust', name: '色欲之神', fullName: '色欲九考', tier: 'first', totalExams: 9, element: '色欲', color: '#db2777',
    bgGradient: 'from-pink-800/60 via-rose-800/50 to-fuchsia-950/60',
    description: '七宗罪之色欲，魅惑与沉沦的化身。', artifactId: 'art-lust-sword', divineSkillName: '魅惑之术',
    inheritBonus: { allAttrPct: 80, levelTo100: true } },
  { id: 'deity-ice', name: '冰神', fullName: '冰之九考', tier: 'first', totalExams: 9, element: '冰', color: '#22d3ee',
    bgGradient: 'from-cyan-800/60 via-sky-900/50 to-blue-950/60',
    description: '执掌极致寒冰，冰封万里。', artifactId: 'art-ice-spear', divineSkillName: '绝对零度',
    inheritBonus: { allAttrPct: 80, levelTo100: true } },
  { id: 'deity-flower', name: '花神', fullName: '花之九考', tier: 'first', totalExams: 9, element: '花', color: '#f472b6',
    bgGradient: 'from-pink-800/60 via-fuchsia-800/50 to-rose-950/60',
    description: '执掌百花盛开，花之灵气，生命绽放。', artifactId: 'art-flower-wheel', divineSkillName: '花之绽放',
    inheritBonus: { allAttrPct: 80, levelTo100: true } },
  { id: 'deity-forging', name: '锻造之神', fullName: '锻造九考', tier: 'first', totalExams: 9, element: '锻造', color: '#f97316',
    bgGradient: 'from-orange-800/60 via-amber-800/50 to-stone-950/60',
    description: '执掌锻造工艺，神器的缔造者。', artifactId: 'art-forge-hammer', divineSkillName: '锻造重击',
    inheritBonus: { allAttrPct: 80, levelTo100: true } },
  { id: 'deity-thunder', name: '雷神', fullName: '雷之九考', tier: 'first', totalExams: 9, element: '雷', color: '#a855f7',
    bgGradient: 'from-violet-800/60 via-purple-800/50 to-indigo-950/60',
    description: '执掌雷霆万钧，天雷降世。', artifactId: 'art-thunder-hammer', divineSkillName: '雷霆万钧',
    inheritBonus: { allAttrPct: 80, levelTo100: true } },
  { id: 'deity-nature', name: '自然之神', fullName: '自然九考', tier: 'first', totalExams: 9, element: '自然', color: '#22c55e',
    bgGradient: 'from-green-800/60 via-emerald-800/50 to-teal-950/60',
    description: '执掌自然万物，森林与山川的守护。', artifactId: 'art-nature-spear', divineSkillName: '自然之怒',
    inheritBonus: { allAttrPct: 80, levelTo100: true } },
  { id: 'deity-death', name: '死神', fullName: '死神九考', tier: 'first', totalExams: 9, element: '死亡', color: '#374151',
    bgGradient: 'from-gray-900/70 via-slate-900/60 to-zinc-950/60',
    description: '执掌死亡，灵魂的最终归宿。', artifactId: 'art-death-blade', divineSkillName: '死亡收割',
    inheritBonus: { allAttrPct: 80, levelTo100: true } },
];

// ========== 二级神考核（6个）==========
const secondTierTrials: Omit<IDivineTrial, 'exams'>[] = [
  { id: 'deity-food', name: '食神', fullName: '食神七考', tier: 'second', totalExams: 7, element: '辅助', color: '#f59e0b',
    bgGradient: 'from-amber-800/60 via-yellow-800/50 to-orange-950/60',
    description: '执掌美食之道，世间百味皆出神手。', artifactId: 'art-chef-knife', divineSkillName: '美食风暴',
    inheritBonus: { allAttrPct: 50, levelTo100: true } },
  { id: 'deity-nine-color', name: '九彩神女', fullName: '九彩七考', tier: 'second', totalExams: 7, element: '辅助', color: '#a855f7',
    bgGradient: 'from-purple-700/60 via-fuchsia-700/50 to-pink-950/60',
    description: '九彩流转，神佑众生。辅助系至尊神位。', artifactId: 'art-nine-color-tower', divineSkillName: '九彩神光',
    inheritBonus: { allAttrPct: 50, levelTo100: true } },
  { id: 'deity-butterfly', name: '蝶神', fullName: '蝶神七考', tier: 'second', totalExams: 7, element: '蝶', color: '#ec4899',
    bgGradient: 'from-pink-700/60 via-rose-700/50 to-fuchsia-950/60',
    description: '蝶舞翩翩，美丽与灵巧的化身。', artifactId: 'art-dragon-butterfly', divineSkillName: '蝶舞天涯',
    inheritBonus: { allAttrPct: 50, levelTo100: true } },
  { id: 'deity-speed', name: '速度之神', fullName: '速度七考', tier: 'second', totalExams: 7, element: '速度', color: '#06b6d4',
    bgGradient: 'from-cyan-700/60 via-sky-700/50 to-blue-950/60',
    description: '速度的极致，天下武功唯快不破。', artifactId: 'art-speed-blade', divineSkillName: '极速突袭',
    inheritBonus: { allAttrPct: 50, levelTo100: true } },
  { id: 'deity-war', name: '战神', fullName: '战神七考', tier: 'second', totalExams: 7, element: '力量', color: '#dc2626',
    bgGradient: 'from-red-800/60 via-orange-800/50 to-yellow-950/60',
    description: '战争之神，战场不败的神话。', artifactId: 'art-war-fist', divineSkillName: '战神之怒',
    inheritBonus: { allAttrPct: 50, levelTo100: true } },
  { id: 'deity-phoenix', name: '凤凰之神', fullName: '凤凰七考', tier: 'second', totalExams: 7, element: '火', color: '#f97316',
    bgGradient: 'from-orange-700/60 via-red-700/50 to-yellow-950/60',
    description: '凤凰涅槃，浴火重生。不死之神。', artifactId: 'art-phoenix', divineSkillName: '凤凰涅槃',
    inheritBonus: { allAttrPct: 50, levelTo100: true } },
];

// ===== 生成考核内容 =====
function generateExams(trial: Omit<IDivineTrial, 'exams'>): ITrialExam[] {
  const total = trial.totalExams;
  const tier = trial.tier;
  const exams: ITrialExam[] = [];

  // 第一考：按规则动态生成
  if (tier === 'second') {
    exams.push({
      index: 1,
      title: '第一考·初登神阶',
      description: '达到70级魂圣境界，证明你拥有接触神位的资格。',
      type: 'reachLevel',
      targetLevel: 70,
      reward: { ringYearsAll: 8000, affinityPct: 10 },
    });
  } else if (tier === 'supreme') {
    // 至高神第一考：门槛极高，需95级 + 击败帝天
    exams.push({
      index: 1,
      title: '第一考·至高试炼',
      description: '修为达到95级超级斗罗境界，且击败星斗大森林核心区的帝天。',
      type: 'defeatBeast',
      beastName: '帝天',
      beastLocation: 'star-forest-core',
      reward: { ringYearsAll: 100000, affinityPct: 10 },
    });
  } else {
    // 神王 / 一级神第一考
    const ringYearsByTier = tier === 'king' ? 50000 : 20000;
    exams.push({
      index: 1,
      title: '第一考·神之考验',
      description: '修为达到80级，吸收一枚十万年第八魂环，或击败星斗大森林帝天一次。',
      type: 'absorbRing',
      targetRingYears: 100000,
      targetRingSlot: 8,
      beastName: '帝天',
      beastLocation: 'star-forest-core',
      reward: { ringYearsAll: ringYearsByTier, affinityPct: 10 },
    });
  }

  // 第二考：至高神/神王级 = 击败自身化身；其余 = 达到指定等级
  if (tier === 'supreme' || tier === 'king') {
    exams.push({
      index: 2,
      title: '第二考·战胜自我',
      description: tier === 'supreme'
        ? '击败自己的至高化身。化身拥有神级力量，血量极厚，最多可挑战10次。'
        : '击败自己的化身。化身与你境界相当，血量极高，最多可挑战7次。',
      type: 'defeatAvatar',
      reward: { ringYearsAll: tier === 'supreme' ? 20000 : 5000, affinityPct: 10 },
    });
  } else {
    exams.push({
      index: 2,
      title: '第二考·修为精进',
      description: '等级提升至' + (tier === 'first' ? '85' : '75') + '级，证明你的修炼潜力。',
      type: 'reachLevel',
      targetLevel: tier === 'first' ? 85 : 75,
      reward: { affinityPct: 10, attrBonusPct: 10 },
    });
  }

  // 第三考：击败特定魂兽（全级别）
  const beastForTier =
    tier === 'supreme' ? { name: '龙神分身', years: '亿万年' } :
    tier === 'king' ? { name: '深海魔鲸王', years: '百万年' } :
    tier === 'first' ? { name: '邪眼暴君主宰', years: '七十九万年' } :
    { name: '银月狼王', years: '五万年' };
  exams.push({
    index: 3,
    title: '第三考·猎魂试炼',
    description: `击败${beastForTier.name}（${beastForTier.years}），证明你的战力足以承受神之力量。`,
    type: 'defeatBeast',
    beastName: beastForTier.name,
    reward: { affinityPct: 10, boneYearsAll: 1000 },
  });

  // 第四考：竞技场连胜
  exams.push({
    index: 4,
    title: '第四考·荣耀之战',
    description: `竞技场连胜${tier === 'supreme' ? 15 : tier === 'king' ? 10 : tier === 'first' ? 7 : 5}场，证明你的实战能力。`,
    type: 'arenaWinStreak',
    winStreak: tier === 'supreme' ? 15 : tier === 'king' ? 10 : tier === 'first' ? 7 : 5,
    reward: { affinityPct: 10, divinePowerPct: tier === 'supreme' ? 3 : 1 },
  });

  // 第五考：属性达标（仅8考/9考才有；二级神7考时此位置被神器考占用）
  if (total >= 8) {
    const attrTarget = tier === 'supreme' ? '至高的属性掌控' : tier === 'king' ? '极致的属性掌控' : tier === 'first' ? '卓越的属性掌控' : '优秀的属性掌控';
    exams.push({
      index: 5,
      title: '第五考·属性觉醒',
      description: `达到${attrTarget}，全属性突破神之阈值。`,
      type: 'attributeReach',
      reward: { affinityPct: 10, attrBonusPct: tier === 'supreme' ? 30 : tier === 'king' ? 15 : tier === 'first' ? 15 : 10 },
    });
  }

  // 第六考：神念洗礼（仅9考才有；二级神7考时此位置被99级突破考占用）
  if (total >= 9) {
    exams.push({
      index: 6,
      title: '第六考·神念洗礼',
      description: '接受神念的直接洗礼，精神力升华。',
      type: 'attributeReach',
      reward: {
        affinityPct: 10,
        divinePowerPct: tier === 'supreme' ? 5 : tier === 'king' ? 3 : tier === 'first' ? 3 : 2,
      },
    });
  }

  // ===== 倒数三考（所有级别一致）=====
  // 倒数第三考：神器认主（拔出神器）
  const artifactExamIndex = total - 2;
  exams.push({
    index: artifactExamIndex,
    title: `第${['','一','二','三','四','五','六','七','八','九'][artifactExamIndex]}考·神器认主`,
    description: `拔出${tier === 'supreme' ? '至高' : tier === 'king' ? '超' : ''}神器，获得神之兵器的认可。`,
    type: 'drawArtifact',
    reward: { affinityPct: 10, divinePowerPct: tier === 'supreme' ? 3 : 2 },
  });

  // 倒数第二考：境界突破至99级（极限斗罗，不含彩蛋等级）
  const level99ExamIndex = total - 1;
  exams.push({
    index: level99ExamIndex,
    title: `第${['','一','二','三','四','五','六','七','八','九'][level99ExamIndex]}考·境界突破`,
    description: '修为达到99级极限斗罗境界（不含准半神/半神/准神等彩蛋等级），触摸神之门槛。',
      type: 'reachLevel',
      targetLevel: 99,
      reward: { affinityPct: 10, divinePowerPct: tier === 'supreme' ? 8 : tier === 'king' ? 5 : tier === 'first' ? 4 : 3 },
  });

  // 倒数第一考（最终考）：神位继承
  const finalExamIndex = total;
  exams.push({
    index: finalExamIndex,
    title: `第${['','一','二','三','四','五','六','七','八','九'][finalExamIndex]}考·神位继承`,
    description: '完成最终考验，继承神位！',
    type: 'attributeReach',
      reward: {
        affinityPct: 10,
        divinePowerPct: 5,
        // 原奖励：等级+1 + 魂环年限。v3调整：等级奖励全部改为魂环年限
        // 各 tier 对应年限增量：至高神+10万 / 神王+5万 / 一级神+2万 / 二级神+8千
        ringYearsAll:
          (tier === 'supreme' ? 500000 : tier === 'king' ? 100000 : tier === 'first' ? 60000 : 40000)
          + (tier === 'supreme' ? 100000 : tier === 'king' ? 50000 : tier === 'first' ? 20000 : 8000),
        // 神位继承魂骨年限奖励：仅限已装备魂骨（含神装状态），属性同步提升
        // 二级神+10万 / 一级神+30万 / 神王+50万 / 至高神+100万
        boneYearsAll:
          tier === 'supreme' ? 1000000 :
          tier === 'king' ? 500000 :
          tier === 'first' ? 300000 :
          100000,
      },
  });

  // 按 index 重新排序，保证顺序正确
  exams.sort((a, b) => a.index - b.index);

  return exams;
}

// ===== 组装 =====
function withExams(arr: Omit<IDivineTrial, 'exams'>[]): IDivineTrial[] {
  return arr.map((t) => ({ ...t, exams: generateExams(t) }));
}

export const DIVINE_TRIALS: IDivineTrial[] = [
  ...withExams(supremeTrials),
  ...withExams(kingTrials),
  ...withExams(firstTierTrials),
  ...withExams(secondTierTrials),
];

// ========== 至高神器（7个）==========
const supremeArtifacts: IDivineArtifact[] = [
  { id: 'art-creation-sword', name: '创世神剑', deityId: 'deity-creation', tier: 'supreme', maxLevel: 200,
    description: '创世神执掌的至高神器，一剑挥出，开天辟地，创造万物。', icon: '⚡',
    baseCost: 300000, perLevelBonus: { attack: 0.0075, defense: 0.0075, speed: 0.0075, spirit: 0.0075, hp: 0.0075 } },
  { id: 'art-dragon-god-spear', name: '龙神之枪', deityId: 'deity-dragon-god', tier: 'supreme', maxLevel: 200,
    description: '龙神执掌的至高神器，枪尖所指，龙族臣服，诸天震颤。', icon: '🐉',
    baseCost: 300000, perLevelBonus: { attack: 0.0075, defense: 0.0075, speed: 0.0075, spirit: 0.0075, hp: 0.0075 } },
  { id: 'art-pangu-axe', name: '盘古斧', deityId: 'deity-pangu', tier: 'supreme', maxLevel: 200,
    description: '盘古开天辟地所用的至高神器，一斧劈下，混沌两分。', icon: '🪓',
    baseCost: 300000, perLevelBonus: { attack: 0.0075, defense: 0.0075, speed: 0.0075, spirit: 0.0075, hp: 0.0075 } },
  { id: 'art-hongmeng-sword', name: '鸿蒙之剑', deityId: 'deity-tea', tier: 'supreme', maxLevel: 200,
    description: '茶之神执掌的至高神器，鸿蒙初判，万道归宗，一剑化万法。', icon: '🍵',
    baseCost: 300000, perLevelBonus: { attack: 0.0075, defense: 0.0075, speed: 0.0075, spirit: 0.0075, hp: 0.0075 } },
  { id: 'art-godslayer-sword', name: '弑神之剑', deityId: 'deity-godslayer', tier: 'supreme', maxLevel: 200,
    description: '弑神执掌的至高神器，剑锋所过，神形俱灭，万神避退。', icon: '🗡️',
    baseCost: 300000, perLevelBonus: { attack: 0.0075, defense: 0.0075, speed: 0.0075, spirit: 0.0075, hp: 0.0075 } },
  { id: 'art-fate-wheel', name: '命运轮盘', deityId: 'deity-fate', tier: 'supreme', maxLevel: 200,
    description: '命运之神执掌的至高神器，轮盘转动，因果注定，众生难逃。', icon: '☯️',
    baseCost: 300000, perLevelBonus: { attack: 0.0075, defense: 0.0075, speed: 0.0075, spirit: 0.0075, hp: 0.0075 } },
  { id: 'art-wuji-blade', name: '无极之刃', deityId: 'deity-wuji', tier: 'supreme', maxLevel: 200,
    description: '无极之神执掌的至高神器，无极生太极，一刀斩出，万物归源。', icon: '🌌',
    baseCost: 300000, perLevelBonus: { attack: 0.0075, defense: 0.0075, speed: 0.0075, spirit: 0.0075, hp: 0.0075 } },
  { id: 'art-melancholy-spear', name: '忧郁之枪', deityId: 'deity-melancholy', tier: 'supreme', maxLevel: 200,
    description: '忧郁之神执掌的至高神器，枪锋所及，悲意蔓延，万物沉沦。', icon: '🌫️',
    baseCost: 300000, perLevelBonus: { attack: 0.0075, defense: 0.0075, speed: 0.0075, spirit: 0.0075, hp: 0.0075 } },
];

// ========== 超神器（8个）==========
const superArtifacts: IDivineArtifact[] = [
  { id: 'art-destruction-staff', name: '毁灭权杖', deityId: 'deity-destruction', tier: 'super', maxLevel: 150,
    description: '毁灭之神执掌的超神器，一杖挥出，万物归寂。', icon: '🔥',
    baseCost: 300000, perLevelBonus: { attack: 0.008, defense: 0.008, speed: 0.008, spirit: 0.008, hp: 0.008 } },
  { id: 'art-life-staff', name: '生命权杖', deityId: 'deity-life', tier: 'super', maxLevel: 150,
    description: '生命之神执掌的超神器，生机无限，万物复苏。', icon: '🌿',
    baseCost: 300000, perLevelBonus: { attack: 0.008, defense: 0.008, speed: 0.008, spirit: 0.008, hp: 0.008 } },
  { id: 'art-asura-sword', name: '修罗神剑', deityId: 'deity-asura', tier: 'super', maxLevel: 150,
    description: '修罗之神执掌的超神器，极致之黑暗，一剑寂灭。', icon: '⚔️',
    baseCost: 300000, perLevelBonus: { attack: 0.008, defense: 0.008, speed: 0.008, spirit: 0.008, hp: 0.008 } },
  { id: 'art-kindness-heart', name: '善良之心', deityId: 'deity-kindness', tier: 'super', maxLevel: 150,
    description: '善良之神执掌的超神器，慈悲之心，化解万物。', icon: '💛',
    baseCost: 300000, perLevelBonus: { attack: 0.008, defense: 0.008, speed: 0.008, spirit: 0.008, hp: 0.008 } },
  { id: 'art-evil-spear', name: '邪恶之枪', deityId: 'deity-evil', tier: 'super', maxLevel: 150,
    description: '邪恶之神执掌的超神器，邪恶之念，腐化众生。', icon: '🗡️',
    baseCost: 300000, perLevelBonus: { attack: 0.008, defense: 0.008, speed: 0.008, spirit: 0.008, hp: 0.008 } },
  { id: 'art-zhu-zhu', name: '诛仙剑', deityId: 'deity-sword', tier: 'super', maxLevel: 150,
    description: '剑神执掌的超神器，诛仙四剑之首，剑气纵横。', icon: '🗡️',
    baseCost: 300000, perLevelBonus: { attack: 0.008, defense: 0.008, speed: 0.008, spirit: 0.008, hp: 0.008 } },
  { id: 'art-mie-shi', name: '灭世枪', deityId: 'deity-spear', tier: 'super', maxLevel: 150,
    description: '枪神执掌的超神器，一枪灭世，霸道无匹。', icon: '🔱',
    baseCost: 300000, perLevelBonus: { attack: 0.008, defense: 0.008, speed: 0.008, spirit: 0.008, hp: 0.008 } },
  { id: 'art-zhu-ri', name: '逐日弓', deityId: 'deity-archer', tier: 'super', maxLevel: 150,
    description: '弓神执掌的超神器，一箭逐日，精准无匹。', icon: '🏹',
    baseCost: 300000, perLevelBonus: { attack: 0.008, defense: 0.008, speed: 0.008, spirit: 0.008, hp: 0.008 } },
];

const divineArtifacts: IDivineArtifact[] = [
  // 一级神神器
  { id: 'art-sea-trident', name: '海神三叉戟', deityId: 'deity-sea', tier: 'divine', maxLevel: 100,
    description: '海神执掌的神器，浩瀚海洋的象征。', icon: '🔱',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-emotion-sword', name: '情绪之剑', deityId: 'deity-emotion', tier: 'divine', maxLevel: 100,
    description: '情绪之神执掌的神器，七情六欲皆可为剑。', icon: '🗡️',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-angel-sword', name: '天使之剑', deityId: 'deity-angel', tier: 'divine', maxLevel: 100,
    description: '天使之神执掌的神器，神圣光明之剑。', icon: '⚔️',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-rakshasa-scythe', name: '罗刹魔镰', deityId: 'deity-rakshasa', tier: 'divine', maxLevel: 100,
    description: '罗刹之神执掌的神器，死亡与邪念的化身。', icon: '🗡️',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-destruction-spear', name: '破坏之枪', deityId: 'deity-destruction2', tier: 'divine', maxLevel: 100,
    description: '破坏之神执掌的神器，万物皆碎。', icon: '🔱',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-ping-shui', name: '萍水剑', deityId: 'deity-water', tier: 'divine', maxLevel: 100,
    description: '水神执掌的神器，上善若水，至柔克刚。', icon: '⚔️',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-yang-yan', name: '阳之炎', deityId: 'deity-fire', tier: 'divine', maxLevel: 100,
    description: '火神执掌的神器，至阳至烈。', icon: '🔥',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-di-shield', name: '大地之盾', deityId: 'deity-earth', tier: 'divine', maxLevel: 100,
    description: '土神执掌的神器，坚不可摧。', icon: '🛡️',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-ji-feng', name: '疾风弓', deityId: 'deity-wind', tier: 'divine', maxLevel: 100,
    description: '风神执掌的神器，风一般的速度与锐利。', icon: '🏹',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-guang-shou', name: '光之守护', deityId: 'deity-light', tier: 'divine', maxLevel: 100,
    description: '光神执掌的神器，光明之盾，净化一切。', icon: '✨',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-hei-fa', name: '黑暗法杖', deityId: 'deity-dark', tier: 'divine', maxLevel: 100,
    description: '黑暗之神执掌的神器，暗夜无边。', icon: '🪄',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-greed-sword', name: '贪婪之剑', deityId: 'deity-greed', tier: 'divine', maxLevel: 100,
    description: '贪婪之神执掌的神器，吞噬一切。', icon: '🗡️',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-lazy-sword', name: '懒惰之剑', deityId: 'deity-lazy', tier: 'divine', maxLevel: 100,
    description: '懒惰之神执掌的神器，看似平凡实则暗藏杀机。', icon: '🗡️',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-anger-sword', name: '愤怒之剑', deityId: 'deity-anger', tier: 'divine', maxLevel: 100,
    description: '愤怒之神执掌的神器，怒火中烧，越战越勇。', icon: '🗡️',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-arrogant-sword', name: '傲慢之剑', deityId: 'deity-arrogant', tier: 'divine', maxLevel: 100,
    description: '傲慢之神执掌的神器，高高在上，睥睨众生。', icon: '🗡️',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-envy-sword', name: '嫉妒之剑', deityId: 'deity-envy', tier: 'divine', maxLevel: 100,
    description: '嫉妒之神执掌的神器，不甘的怨念化为毒刃。', icon: '🗡️',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-lust-sword', name: '色欲之剑', deityId: 'deity-lust', tier: 'divine', maxLevel: 100,
    description: '色欲之神执掌的神器，魅惑之剑，迷惑心神。', icon: '🗡️',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-ice-spear', name: '冰神枪', deityId: 'deity-ice', tier: 'divine', maxLevel: 100,
    description: '冰神执掌的神器，冰封万里，寒气逼人。', icon: '🔱',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-flower-wheel', name: '花神轮盘', deityId: 'deity-flower', tier: 'divine', maxLevel: 100,
    description: '花神执掌的神器，百花齐放，生命绽放。', icon: '🌸',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-forge-hammer', name: '锻造之锤', deityId: 'deity-forging', tier: 'divine', maxLevel: 100,
    description: '锻造之神执掌的神器，千锤百炼，神兵出世。', icon: '🔨',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-thunder-hammer', name: '雷神之锤', deityId: 'deity-thunder', tier: 'divine', maxLevel: 100,
    description: '雷神执掌的神器，雷霆万钧，天罚降临。', icon: '⚡',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-nature-spear', name: '自然之枪', deityId: 'deity-nature', tier: 'divine', maxLevel: 100,
    description: '自然之神执掌的神器，万物生长，生生不息。', icon: '🌿',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-death-blade', name: '死亡之刃', deityId: 'deity-death', tier: 'divine', maxLevel: 100,
    description: '死神执掌的神器，死亡的终极化身。', icon: '💀',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  // 二级神神器
  { id: 'art-chef-knife', name: '厨师刀', deityId: 'deity-food', tier: 'divine', maxLevel: 100,
    description: '食神执掌的神器，一把菜刀走天下。', icon: '🔪',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-nine-color-tower', name: '九彩琉璃塔', deityId: 'deity-nine-color', tier: 'divine', maxLevel: 100,
    description: '九彩神女执掌的神器，九彩流光，神佑众生。', icon: '🏯',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-dragon-butterfly', name: '龙蝶之枪', deityId: 'deity-butterfly', tier: 'divine', maxLevel: 100,
    description: '蝶神执掌的神器，龙蝶共舞，美丽而致命。', icon: '🦋',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-speed-blade', name: '极速之刃', deityId: 'deity-speed', tier: 'divine', maxLevel: 100,
    description: '速度之神执掌的神器，快如闪电。', icon: '⚡',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-war-fist', name: '战神之拳', deityId: 'deity-war', tier: 'divine', maxLevel: 100,
    description: '战神执掌的神器，一拳破万法。', icon: '👊',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
  { id: 'art-phoenix', name: '凤凰涅槃', deityId: 'deity-phoenix', tier: 'divine', maxLevel: 100,
    description: '凤凰之神执掌的神器，涅槃重生，不死不灭。', icon: '🦅',
    baseCost: 300000, perLevelBonus: { attack: 0.009, defense: 0.009, speed: 0.009, spirit: 0.009, hp: 0.009 } },
];

// ====== 特殊无上神器（非神位继承，由特殊途径获得）======
const specialSupremeArtifacts: IDivineArtifact[] = [
  { id: 'art-yinyang-sword', name: '鸿蒙两仪神剑', deityId: 'yinyangcha', tier: 'supreme', maxLevel: 1,
    description: '阴阳茶所持的无上至高神器，以鸿蒙初判之时的阴阳二气锻造，掌生死，定阴阳。非神位继承，需与阴阳茶结为夫妻方可获得。攻击力 +10亿。', icon: '☯️',
    baseCost: 0, perLevelBonus: { attack: 0, defense: 0, speed: 0, spirit: 0, hp: 0 } },
  { id: 'art-dream-sword', name: '永念梦之剑', deityId: 'mengxiaocha', tier: 'supreme', maxLevel: 1,
    description: '梦小茶所持的无上至高神器，以神魂与无尽思念凝结而成，剑出之时天地入梦，真实与虚幻的界限尽皆模糊。非神位继承，需与梦小茶结为夫妻方可获得。速度 +10亿。', icon: '🌙',
    baseCost: 0, perLevelBonus: { attack: 0, defense: 0, speed: 0, spirit: 0, hp: 0 } },
  { id: 'art-tianyu-spear', name: '寰宇之枪', deityId: 'tianxiaocha', tier: 'supreme', maxLevel: 1,
    description: '甜小茶所持的无上至高神器，以宇宙初开之甜蜜本源锻造，甜到极致便是毁灭一切的力量。非神位继承，需与甜小茶结为夫妻方可获得。精神力 +10亿。', icon: '🍯',
    baseCost: 0, perLevelBonus: { attack: 0, defense: 0, speed: 0, spirit: 0, hp: 0 } },
];

export const DIVINE_ARTIFACTS: IDivineArtifact[] = [
  ...supremeArtifacts,
  ...superArtifacts,
  ...divineArtifacts,
  ...specialSupremeArtifacts,
];

// ===== 查询工具 =====
export function getTrialById(id: string): IDivineTrial | undefined {
  return DIVINE_TRIALS.find((t) => t.id === id);
}

export function getArtifactByDeity(deityId: string): IDivineArtifact | undefined {
  return DIVINE_ARTIFACTS.find((a) => a.deityId === deityId);
}

export function getArtifactById(id: string): IDivineArtifact | undefined {
  return DIVINE_ARTIFACTS.find((a) => a.id === id);
}

// 抽卡权重（必中，无 miss，总和 100）
export const TRIAL_DRAW_WEIGHTS: Record<DeityTier, number> = {
  supreme: 3,   // 3% 至高神
  king: 12,     // 12% 神王
  first: 45,    // 45% 一级神
  second: 40,   // 40% 二级神
};
