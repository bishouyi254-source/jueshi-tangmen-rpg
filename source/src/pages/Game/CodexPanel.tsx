import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, BookOpen, Flame, Sparkles, Shield, Flower2, Swords, X, ChevronRight } from 'lucide-react';
import { SOUL_BEAST_POOL, getRingQualityFromYears, type ISoulBeastSpecies, getBeastStatsByYears } from '@/data/soulbeasts';
import { MOCK_MARTIAL_SOULS, type IMartialSoul, getSoulDepartment, generateSoulSkills } from '@/data/martialsouls';
import { IMMORTAL_GRASSES, ICE_FIRE_IMMORTAL_GRASSES, HOLY_GRASSES, SPECIAL_ITEMS, type IItem } from '@/data/items';
import { normalizeBeastAttribute, QUALITY_LABEL, QUALITY_COLOR } from '@/lib/gameStore';

interface CodexPanelProps {
  onBack: () => void;
}

type CodexTab = 'beast' | 'soul' | 'ring' | 'bone' | 'grass' | 'artifact';
type BeastSubTab = 'attribute' | 'year' | 'area';

const TAB_LIST: { key: CodexTab; label: string; icon: typeof Flame }[] = [
  { key: 'beast', label: '魂兽', icon: Flame },
  { key: 'soul', label: '武魂', icon: Sparkles },
  { key: 'ring', label: '魂环', icon: Swords },
  { key: 'bone', label: '魂骨', icon: Shield },
  { key: 'grass', label: '仙草', icon: Flower2 },
  { key: 'artifact', label: '神器', icon: Sparkles },
];

// 神器图鉴数据（汇集所有特殊神器信息，包含神位神器与特殊神器）
interface ArtifactDetail {
  id: string;
  name: string;
  tier: string;
  tierColor: string;
  iconChar: string;
  description: string;
  attributes?: { attack?: number; defense?: number; speed?: number; spirit?: number; hp?: number };
  obtainMethod: string;
}

const ARTIFACT_DETAILS: ArtifactDetail[] = [
  // 特殊无上神器
  {
    id: 'art-hundun-sword',
    name: '混沌神剑',
    tier: '创世·无上',
    tierColor: '#c084fc',
    iconChar: '混',
    description: '混沌茶所持的创世级神剑，凌驾于所有武魂之上的存在。以混沌初始之力锻造，开天辟地、斩碎时空。五维属性各 +30 亿，落入背包即被动生效。',
    attributes: { attack: 3000000000, defense: 3000000000, speed: 3000000000, spirit: 3000000000, hp: 3000000000 },
    obtainMethod: '击败混沌茶（唯一途径）',
  },
  {
    id: 'art-yinyang-sword',
    name: '鸿蒙两仪神剑',
    tier: '无上·至高',
    tierColor: '#fbbf24',
    iconChar: '☯',
    description: '阴阳茶所持的无上至高神器，以鸿蒙初判之时的阴阳二气锻造，掌生死，定阴阳。一剑出，阴阳分，天地裂。非神位继承，需与阴阳茶结为夫妻方可获得。攻击力 +10亿。',
    attributes: { attack: 1000000000 },
    obtainMethod: '与阴阳茶结为夫妻（唯一途径）',
  },
  {
    id: 'art-dream-sword',
    name: '永念梦之剑',
    tier: '无上·至高',
    tierColor: '#a78bfa',
    iconChar: '梦',
    description: '梦小茶所持的无上至高神器，以神魂与无尽思念凝结而成，剑出之时天地入梦，真实与虚幻的界限尽皆模糊。一梦千年，梦醒魂消。速度 +10亿。',
    attributes: { speed: 1000000000 },
    obtainMethod: '与梦小茶结为夫妻（唯一途径）',
  },
  {
    id: 'art-tianyu-spear',
    name: '寰宇之枪',
    tier: '无上·至高',
    tierColor: '#f472b6',
    iconChar: '甜',
    description: '甜小茶所持的无上至高神器，以宇宙初开之甜蜜本源锻造，甜到极致便是毁灭一切的力量。一枪出，寰宇碎，甜蜜入魂。精神力 +10亿。',
    attributes: { spirit: 1000000000 },
    obtainMethod: '与甜小茶结为夫妻（唯一途径）',
  },
  // 神王级神器
  {
    id: 'art-destruction',
    name: '毁灭权杖',
    tier: '神王级',
    tierColor: '#7c3aed',
    iconChar: '毁',
    description: '毁灭之神的本命神器，蕴含宇宙毁灭之力。一杖之下，星辰崩碎，万物归寂。',
    attributes: { attack: 500000000, spirit: 300000000 },
    obtainMethod: '毁灭之神神位传承',
  },
  {
    id: 'art-life',
    name: '生命之种',
    tier: '神王级',
    tierColor: '#22c55e',
    iconChar: '生',
    description: '生命之神的本命神器，蕴含宇宙生命本源之力。一粒种子，可创造万千生命。',
    attributes: { hp: 800000000, defense: 300000000 },
    obtainMethod: '生命之神神位传承',
  },
  {
    id: 'art-asura',
    name: '修罗魔剑',
    tier: '神王级',
    tierColor: '#dc2626',
    iconChar: '修',
    description: '修罗之神的本命神器，杀戮之气凝为实体。剑出必见血，杀道证长生。',
    attributes: { attack: 600000000, speed: 200000000 },
    obtainMethod: '修罗之神神位传承',
  },
  // 一级神祇神器
  {
    id: 'art-sea',
    name: '海神三叉戟',
    tier: '一级神祇',
    tierColor: '#0ea5e9',
    iconChar: '海',
    description: '海神的本命神器，操纵海洋之力。三叉戟出，万水臣服。',
    attributes: { attack: 200000000, defense: 150000000 },
    obtainMethod: '海神九考传承',
  },
  {
    id: 'art-angel',
    name: '天使圣剑',
    tier: '一级神祇',
    tierColor: '#fbbf24',
    iconChar: '使',
    description: '天使之神的本命神器，至纯至净的光明之力。圣剑出鞘，万邪退散。',
    attributes: { attack: 220000000, spirit: 150000000 },
    obtainMethod: '天使九考传承',
  },
  {
    id: 'art-rakshasa',
    name: '罗刹魔镰',
    tier: '一级神祇',
    tierColor: '#be123c',
    iconChar: '罗',
    description: '罗刹之神的本命神器，邪恶与杀戮的极致。魔镰挥舞，灵魂湮灭。',
    attributes: { attack: 210000000, speed: 180000000 },
    obtainMethod: '罗刹九考传承',
  },
];
const ATTR_LIST = [
  '金属性', '木属性', '水属性', '火属性', '土属性',
  '雷属性', '冰属性', '光属性', '暗属性', '时间属性', '空间属性', '精神属性',
];

const ATTR_COLORS: Record<string, string> = {
  '雷属性': 'text-violet-300 bg-violet-900/30 border-violet-500/40',
  '金属性': 'text-amber-300 bg-amber-900/30 border-amber-500/40',
  '木属性': 'text-green-300 bg-green-900/30 border-green-500/40',
  '水属性': 'text-blue-300 bg-blue-900/30 border-blue-500/40',
  '火属性': 'text-red-300 bg-red-900/30 border-red-500/40',
  '土属性': 'text-yellow-300 bg-yellow-900/30 border-yellow-500/40',
  '冰属性': 'text-cyan-300 bg-cyan-900/30 border-cyan-500/40',
  '光属性': 'text-yellow-200 bg-yellow-900/20 border-yellow-400/40',
  '暗属性': 'text-purple-300 bg-purple-900/30 border-purple-500/40',
  '时间属性': 'text-indigo-300 bg-indigo-900/30 border-indigo-500/40',
  '空间属性': 'text-fuchsia-300 bg-fuchsia-900/30 border-fuchsia-500/40',
  '精神属性': 'text-pink-300 bg-pink-900/30 border-pink-500/40',
};

// 年限区间
const YEAR_TIERS = [
  { key: 'outer', label: '十年', min: 10, max: 999 },
  { key: 'middle', label: '百年', min: 100, max: 9999 },
   { key: 'inner', label: '千年~万年', min: 1000, max: 99999 },
  { key: 'core', label: '十万年', min: 100000, max: 499999 },
  { key: 'life-lake', label: '五十万年+', min: 500000, max: 9999999 },
];

// 区域
const AREA_LIST = [
  { key: 'outer', label: '外围区' },
  { key: 'middle', label: '中部区' },
  { key: 'inner', label: '内圈' },
  { key: 'core', label: '核心区' },
  { key: 'life-lake', label: '生命之湖' },
];

// 魂环详细数据
interface RingDetail {
  years: string;
  color: string;
  label: string;
  desc: string;
  skillDamage: string;
  absorbLimit: string;
  dropRate: string;
}

const RING_DETAILS: RingDetail[] = [
  {
    years: '10 ~ 99 年', color: '#e5e7eb', label: '十年',
    desc: '最基础的魂环，由十年魂兽掉落。属性加成微薄，是魂师成长的起点。',
    skillDamage: '约 50 ~ 150% 攻击力',
    absorbLimit: '魂士及以上可吸收',
    dropRate: '★★★★★ 极常见',
  },
  {
    years: '100 ~ 999 年', color: '#eab308', label: '百年',
    desc: '黄色魂环，由百年魂兽掉落。提供稳定的属性加成与基础魂技。',
    skillDamage: '约 150 ~ 300% 攻击力',
    absorbLimit: '魂师及以上可吸收',
    dropRate: '★★★★☆ 常见',
  },
  {
    years: '1000 ~ 9999 年', color: '#9333ea', label: '千年',
    desc: '紫色魂环，由千年魂兽掉落。魂技威力大增，是魂尊魂宗的标配。',
    skillDamage: '约 300 ~ 600% 攻击力',
    absorbLimit: '大魂师及以上可吸收',
    dropRate: '★★★☆☆ 普通',
  },
  {
     years: '10000 ~ 99999 年', color: '#1f2937', label: '万年',
    desc: '黑色魂环，由万年魂兽掉落。威力强大，是魂圣魂斗罗的象征。',
    skillDamage: '约 600 ~ 1200% 攻击力',
    absorbLimit: '魂尊及以上可吸收',
    dropRate: '★★☆☆☆ 稀有',
  },
  {
    years: '100000 ~ 999999 年', color: '#dc2626', label: '十万年',
    desc: '红色魂环，由十万年魂兽掉落。极其稀有，封号斗罗梦寐以求。',
    skillDamage: '约 1500 ~ 3000% 攻击力',
    absorbLimit: '魂王及以上可吸收',
    dropRate: '★☆☆☆☆ 极稀有',
  },
  {
    years: '1000000 年以上', color: '#fbbf24', label: '百万年/神级',
    desc: '金色魂环，传说中的神级魂环。只有神级魂兽或凶兽才能产出，力量足以撼动天地。',
    skillDamage: '约 5000%+ 攻击力',
    absorbLimit: '封号斗罗及以上可吸收',
    dropRate: '☆☆☆☆☆ 传说',
  },
];

// 魂骨详细数据
interface BoneDetail {
  slot: string;
  desc: string;
  bonus: string;
  rarity: string;
  color: string;
}

const BONE_DETAILS: BoneDetail[] = [
  { slot: '头部魂骨', desc: '蕴含精神与灵魂之力，提升精神力与神识强度，稀有度高。', bonus: '精神力 + 神识强化', rarity: '★★★★☆ 稀有', color: '#a855f7' },
  { slot: '躯干魂骨', desc: '魂骨中最珍贵的部位之一，大幅提升气血与防御，是防御与生存的核心。', bonus: '气血 + 防御', rarity: '★★★★★ 极稀有', color: '#f97316' },
  { slot: '左臂魂骨', desc: '提升左臂力量与攻击，附带专属攻击类魂技。', bonus: '攻击力 + 左臂技能', rarity: '★★★☆☆ 普通', color: '#ef4444' },
  { slot: '右臂魂骨', desc: '提升右臂力量与攻击，通常带有控制或强攻类技能。', bonus: '攻击力 + 右臂技能', rarity: '★★★☆☆ 普通', color: '#ef4444' },
  { slot: '左腿魂骨', desc: '提升腿部力量与速度，附带飞行或加速技能。', bonus: '速度 + 飞行/加速技能', rarity: '★★★☆☆ 普通', color: '#22c55e' },
  { slot: '右腿魂骨', desc: '提升腿部力量与敏捷，附带位移或闪避技能。', bonus: '敏捷 + 位移/闪避技能', rarity: '★★★☆☆ 普通', color: '#22c55e' },
  { slot: '外附魂骨', desc: '最为稀有的魂骨种类，可随修为提升而进化，潜力巨大。', bonus: '可进化 · 潜力无限', rarity: '★★★★★ 传说', color: '#fbbf24' },
];

const qualityMap: Record<string, string> = {
  common: 'text-gray-300 border-gray-500/40 bg-gray-900/30',
  rare: 'text-green-300 border-green-500/40 bg-green-900/30',
  fine: 'text-blue-300 border-blue-500/40 bg-blue-900/30',
  epic: 'text-purple-300 border-purple-500/40 bg-purple-900/30',
  legendary: 'text-amber-300 border-amber-500/40 bg-amber-900/30',
  divine: 'text-red-300 border-red-500/40 bg-red-900/30',
  superDivine: 'text-fuchsia-300 border-fuchsia-500/40 bg-fuchsia-900/30',
  supremeDivine: 'text-yellow-200 border-yellow-400/40 bg-yellow-900/20',
};

export default function CodexPanel({ onBack }: CodexPanelProps) {
  const [activeTab, setActiveTab] = useState<CodexTab>('beast');
  const [search, setSearch] = useState('');
  const [beastSubTab, setBeastSubTab] = useState<BeastSubTab>('attribute');
  const [selectedAttr, setSelectedAttr] = useState<string>('all');
  const [selectedYearTier, setSelectedYearTier] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [soulSubTab, setSoulSubTab] = useState<'quality' | 'department' | 'element'>('quality');
  const [soulQuality, setSoulQuality] = useState<string>('all');
  const [soulDept, setSoulDept] = useState<string>('all');
  const [soulElement, setSoulElement] = useState<string>('all');

  const [artifactTier, setArtifactTier] = useState<string>('all');

  const [selectedBeast, setSelectedBeast] = useState<ISoulBeastSpecies | null>(null);
  const [selectedSoul, setSelectedSoul] = useState<IMartialSoul | null>(null);
  const [selectedRing, setSelectedRing] = useState<RingDetail | null>(null);
  const [selectedBone, setSelectedBone] = useState<BoneDetail | null>(null);
  const [selectedGrass, setSelectedGrass] = useState<(IItem & { grassType: string }) | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactDetail | null>(null);

  // 品质列表
  const qualityList = [
    { key: 'all', label: '全部' },
    { key: 'common', label: '普通级' },
    { key: 'rare', label: '稀有级' },
    { key: 'fine', label: '精良级' },
    { key: 'epic', label: '史诗级' },
    { key: 'legendary', label: '传说级' },
    { key: 'divine', label: '神级' },
    { key: 'superDivine', label: '超神级' },
    { key: 'supremeDivine', label: '至高神级' },
  ];

  const departmentList = [
    { key: 'all', label: '全部' },
    { key: 'qiang', label: '强攻系' },
    { key: 'min', label: '敏攻系' },
    { key: 'kong', label: '控制系' },
    { key: 'fu', label: '辅助系' },
    { key: 'fang', label: '防御系' },
  ];

  // 魂兽筛选
  const filteredBeasts = useMemo(() => {
    let list = SOUL_BEAST_POOL;
    if (search.trim()) {
      const kw = search.trim().toLowerCase();
      list = list.filter(b => b.name.toLowerCase().includes(kw) || b.description.toLowerCase().includes(kw));
    }
    if (beastSubTab === 'attribute' && selectedAttr !== 'all') {
      list = list.filter(b => normalizeBeastAttribute(b.element) === selectedAttr);
    }
    if (beastSubTab === 'year' && selectedYearTier !== 'all') {
      list = list.filter(b => b.areaTier === selectedYearTier);
    }
    if (beastSubTab === 'area' && selectedArea !== 'all') {
      list = list.filter(b => b.areaTier === selectedArea);
    }
    return list;
  }, [search, beastSubTab, selectedAttr, selectedYearTier, selectedArea]);

  // 武魂筛选
  const filteredSouls = useMemo(() => {
    let list = MOCK_MARTIAL_SOULS;
    if (search.trim()) {
      const kw = search.trim().toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(kw));
    }
    if (soulSubTab === 'quality' && soulQuality !== 'all') {
      list = list.filter(s => s.quality === soulQuality);
    }
    if (soulSubTab === 'department' && soulDept !== 'all') {
      list = list.filter(s => {
        const d = getSoulDepartment(s.type || '');
        if (soulDept === 'qiang') return d === '强攻系';
        if (soulDept === 'min') return d === '敏攻系';
        if (soulDept === 'kong') return d === '控制系';
        if (soulDept === 'fu') return d === '辅助系';
        if (soulDept === 'fang') return d === '防御系';
        return true;
      });
    }
    if (soulSubTab === 'element' && soulElement !== 'all') {
      list = list.filter(s => {
        const el = normalizeBeastAttribute(s.element || '');
        return el === soulElement;
      });
    }
    return list;
  }, [search, soulSubTab, soulQuality, soulDept, soulElement]);

   // 仙草数据分组（不合并，按来源分组展示，避免同名仙草重复显示的困扰）
   const grassCategories = useMemo(() => [
     { key: 'immortal', label: '极品仙草', list: IMMORTAL_GRASSES.map(g => ({ ...g, grassType: '极品仙草' })) },
     { key: 'icefire', label: '冰火两仪眼仙草', list: ICE_FIRE_IMMORTAL_GRASSES.map(g => ({ ...g, grassType: '冰火仙草' })) },
     { key: 'holy', label: '圣灵草', list: HOLY_GRASSES.map(g => ({ ...g, grassType: '圣灵草' })) },
   ], []);

   const [grassCat, setGrassCat] = useState<string>('all');

   const filteredGrasses = useMemo(() => {
     let list: (IItem & { grassType: string })[] = [];
     if (grassCat === 'all') {
       list = grassCategories.flatMap(c => c.list);
     } else {
       const cat = grassCategories.find(c => c.key === grassCat);
       if (cat) list = cat.list;
     }
     if (!search.trim()) return list;
     const kw = search.trim().toLowerCase();
     return list.filter(g => g.name.toLowerCase().includes(kw) || (g.description || '').toLowerCase().includes(kw));
   }, [grassCat, grassCategories, search]);

   // 神器数据
   const filteredArtifacts = useMemo(() => {
     let list = ARTIFACT_DETAILS;
     if (artifactTier !== 'all') {
       list = list.filter(a => a.tier.includes(artifactTier));
     }
     if (search.trim()) {
       const kw = search.trim().toLowerCase();
       list = list.filter(a => a.name.toLowerCase().includes(kw) || a.description.toLowerCase().includes(kw));
     }
     return list;
   }, [search, artifactTier]);

  const formatNum = (n: number) => {
    if (n >= 1e12) return (n / 1e12).toFixed(2) + '万亿';
    if (n >= 1e8) return (n / 1e8).toFixed(2) + '亿';
    if (n >= 1e4) return (n / 1e4).toFixed(2) + '万';
    return Math.round(n).toLocaleString();
  };

  const qualityLabel = (q: string) => QUALITY_LABEL[q as keyof typeof QUALITY_LABEL] || q;
  const qualityColor = (q: string) => QUALITY_COLOR[q as keyof typeof QUALITY_COLOR] || '#9ca3af';

  // 重置选中项 + 切换tab
  const switchTab = (tab: CodexTab) => {
    setActiveTab(tab);
    setSelectedBeast(null);
    setSelectedSoul(null);
    setSelectedRing(null);
    setSelectedBone(null);
    setSelectedGrass(null);
    setSelectedArtifact(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 顶部 */}
      <div className="flex items-center gap-3 px-3 py-2.5 shrink-0 border-b border-border/30 bg-card/40 backdrop-blur">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-accent/30 text-muted-foreground hover:text-foreground transition"
          aria-label="返回"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-foreground">图鉴</h2>
        </div>
        <span className="text-[11px] text-muted-foreground ml-auto">
          魂兽 {SOUL_BEAST_POOL.length} · 武魂 {MOCK_MARTIAL_SOULS.length}
        </span>
      </div>

      {/* 主Tab */}
      <div className="flex gap-1 px-2 py-2 shrink-0 overflow-x-auto border-b border-border/20 bg-card/20">
        {TAB_LIST.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                active
                  ? 'bg-gradient-to-r from-amber-600/40 to-amber-500/30 text-amber-100 border border-amber-400/40'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/20 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 搜索框 */}
      <div className="px-3 py-2 shrink-0 bg-card/10">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索名称..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-card/60 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition"
          />
        </div>
      </div>

      {/* 子筛选 */}
      {activeTab === 'beast' && (
        <div className="px-3 pb-2 shrink-0 space-y-2 bg-card/10">
          <div className="flex gap-1">
            {(['attribute', 'year', 'area'] as BeastSubTab[]).map(sub => (
              <button
                key={sub}
                onClick={() => setBeastSubTab(sub)}
                className={`flex-1 py-1.5 rounded-md text-[11px] font-medium transition ${
                  beastSubTab === sub
                    ? 'bg-amber-600/30 text-amber-100 border border-amber-500/40'
                    : 'bg-muted/20 text-muted-foreground hover:text-foreground border border-transparent'
                }`}
              >
                {sub === 'attribute' ? '按属性' : sub === 'year' ? '按年限' : '按区域'}
              </button>
            ))}
          </div>
          {beastSubTab === 'attribute' && (
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedAttr('all')}
                className={`px-2 py-1 rounded-full text-[10px] font-medium border transition ${
                  selectedAttr === 'all'
                    ? 'bg-amber-600/30 text-amber-100 border-amber-500/40'
                    : 'bg-muted/20 text-muted-foreground border-transparent hover:text-foreground'
                }`}
              >
                全部
              </button>
              {ATTR_LIST.map(attr => (
                <button
                  key={attr}
                  onClick={() => setSelectedAttr(attr)}
                  className={`px-2 py-1 rounded-full text-[10px] font-medium border transition ${
                    selectedAttr === attr ? ATTR_COLORS[attr] : 'bg-muted/20 text-muted-foreground border-transparent hover:text-foreground'
                  }`}
                >
                  {attr.replace('属性', '')}
                </button>
              ))}
            </div>
          )}
          {beastSubTab === 'year' && (
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedYearTier('all')}
                className={`px-2 py-1 rounded-full text-[10px] font-medium border transition ${
                  selectedYearTier === 'all'
                    ? 'bg-amber-600/30 text-amber-100 border-amber-500/40'
                    : 'bg-muted/20 text-muted-foreground border-transparent hover:text-foreground'
                }`}
              >
                全部
              </button>
              {YEAR_TIERS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setSelectedYearTier(t.key)}
                  className={`px-2 py-1 rounded-full text-[10px] font-medium border transition ${
                    selectedYearTier === t.key
                      ? 'bg-amber-600/30 text-amber-100 border-amber-500/40'
                      : 'bg-muted/20 text-muted-foreground border-transparent hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          {beastSubTab === 'area' && (
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedArea('all')}
                className={`px-2 py-1 rounded-full text-[10px] font-medium border transition ${
                  selectedArea === 'all'
                    ? 'bg-amber-600/30 text-amber-100 border-amber-500/40'
                    : 'bg-muted/20 text-muted-foreground border-transparent hover:text-foreground'
                }`}
              >
                全部
              </button>
              {AREA_LIST.map(a => (
                <button
                  key={a.key}
                  onClick={() => setSelectedArea(a.key)}
                  className={`px-2 py-1 rounded-full text-[10px] font-medium border transition ${
                    selectedArea === a.key
                      ? 'bg-amber-600/30 text-amber-100 border-amber-500/40'
                      : 'bg-muted/20 text-muted-foreground border-transparent hover:text-foreground'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'soul' && (
        <div className="px-3 pb-2 shrink-0 space-y-2 bg-card/10">
          <div className="flex gap-1">
            {(['quality', 'department', 'element'] as const).map(sub => (
              <button
                key={sub}
                onClick={() => setSoulSubTab(sub)}
                className={`flex-1 py-1.5 rounded-md text-[11px] font-medium transition ${
                  soulSubTab === sub
                    ? 'bg-amber-600/30 text-amber-100 border border-amber-500/40'
                    : 'bg-muted/20 text-muted-foreground hover:text-foreground border border-transparent'
                }`}
              >
                {sub === 'quality' ? '按品质' : sub === 'department' ? '按方向' : '按属性'}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {soulSubTab === 'quality' && qualityList.map(q => (
              <button
                key={q.key}
                onClick={() => setSoulQuality(q.key)}
                className={`px-2 py-1 rounded-full text-[10px] font-medium border transition ${
                  soulQuality === q.key
                    ? 'bg-amber-600/30 text-amber-100 border-amber-500/40'
                    : 'bg-muted/20 text-muted-foreground border-transparent hover:text-foreground'
                }`}
              >
                {q.label}
              </button>
            ))}
            {soulSubTab === 'department' && departmentList.map(d => (
              <button
                key={d.key}
                onClick={() => setSoulDept(d.key)}
                className={`px-2 py-1 rounded-full text-[10px] font-medium border transition ${
                  soulDept === d.key
                    ? 'bg-amber-600/30 text-amber-100 border-amber-500/40'
                    : 'bg-muted/20 text-muted-foreground border-transparent hover:text-foreground'
                }`}
              >
                {d.label}
              </button>
            ))}
            {soulSubTab === 'element' && (
              <>
                <button
                  onClick={() => setSoulElement('all')}
                  className={`px-2 py-1 rounded-full text-[10px] font-medium border transition ${
                    soulElement === 'all'
                      ? 'bg-amber-600/30 text-amber-100 border-amber-500/40'
                      : 'bg-muted/20 text-muted-foreground border-transparent hover:text-foreground'
                  }`}
                >
                  全部
                </button>
                {ATTR_LIST.map(a => (
                  <button
                    key={a}
                    onClick={() => setSoulElement(a)}
                    className={`px-2 py-1 rounded-full text-[10px] font-medium border transition ${
                      soulElement === a ? ATTR_COLORS[a] : 'bg-muted/20 text-muted-foreground border-transparent hover:text-foreground'
                    }`}
                  >
                    {a.replace('属性', '')}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

       {activeTab === 'grass' && (
         <div className="px-3 pb-2 shrink-0 bg-card/10">
           <div className="flex gap-1.5 flex-wrap">
             {[
               { key: 'all', label: '全部' },
               { key: 'immortal', label: '极品仙草' },
               { key: 'icefire', label: '冰火仙草' },
               { key: 'holy', label: '圣灵草' },
             ].map(t => (
               <button
                 key={t.key}
                 onClick={() => setGrassCat(t.key)}
                 className={`px-2 py-1 rounded-full text-[10px] font-medium border transition ${
                   grassCat === t.key
                     ? 'bg-green-600/30 text-green-100 border-green-500/40'
                     : 'bg-muted/20 text-muted-foreground border-transparent hover:text-foreground'
                 }`}
               >
                 {t.label}
               </button>
             ))}
           </div>
         </div>
       )}

       {activeTab === 'artifact' && (
         <div className="px-3 pb-2 shrink-0 bg-card/10">
           <div className="flex gap-1.5 flex-wrap">
             {[
               { key: 'all', label: '全部' },
               { key: '创世', label: '创世级' },
               { key: '无上', label: '无上·至高' },
               { key: '神王', label: '神王级' },
               { key: '一级', label: '一级神祇' },
             ].map(t => (
               <button
                 key={t.key}
                 onClick={() => setArtifactTier(t.key)}
                 className={`px-2 py-1 rounded-full text-[10px] font-medium border transition ${
                   artifactTier === t.key
                     ? 'bg-amber-600/30 text-amber-100 border-amber-500/40'
                     : 'bg-muted/20 text-muted-foreground border-transparent hover:text-foreground'
                 }`}
               >
                 {t.label}
               </button>
             ))}
           </div>
         </div>
       )}

       {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {activeTab === 'beast' && (
          filteredBeasts.length === 0 ? (
            <EmptyState text="暂无符合条件的魂兽" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {filteredBeasts.map(beast => {
                const attr = normalizeBeastAttribute(beast.element);
                const q = getRingQualityFromYears(
                  beast.areaTier === 'outer' ? 500 :
                  beast.areaTier === 'middle' ? 5000 :
                  beast.areaTier === 'inner' ? 50000 :
                  beast.areaTier === 'core' ? 200000 : 1000000
                );
                return (
                  <motion.button
                    key={beast.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedBeast(beast)}
                    className="relative p-3 rounded-xl border border-border/50 bg-gradient-to-br from-card/60 to-card/30 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10 text-left transition group"
                  >
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <div className="font-semibold text-sm text-foreground truncate flex-1">{beast.name}</div>
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                        style={{ backgroundColor: q.color, boxShadow: `0 0 6px ${q.color}` }}
                      />
                    </div>
                    <div className={`inline-block px-1.5 py-0.5 rounded text-[9px] border ${ATTR_COLORS[attr] || 'text-muted-foreground bg-muted/20 border-border'}`}>
                      {attr}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{beast.description}</div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-[10px]" style={{ color: q.color }}>{q.label}</div>
                      <div className="text-[10px] text-muted-foreground">{AREA_LIST.find(a => a.key === beast.areaTier)?.label}</div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )
        )}

        {activeTab === 'soul' && (
          filteredSouls.length === 0 ? (
            <EmptyState text="暂无符合条件的武魂" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {filteredSouls.map(soul => {
                const qc = qualityMap[soul.quality] || qualityMap.common;
                return (
                  <motion.button
                    key={soul.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedSoul(soul)}
                    className="p-3 rounded-xl border border-border/50 bg-gradient-to-br from-card/60 to-card/30 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10 text-left transition group"
                  >
                    <div className="font-semibold text-sm text-foreground mb-1.5 truncate">{soul.name}</div>
                    <div className={`inline-block px-1.5 py-0.5 rounded text-[9px] border ${qc}`}>
                      {qualityLabel(soul.quality)}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-2">
                      {getSoulDepartment(soul.type || '')}
                    </div>
                    {soul.element && (
                      <div className="text-[10px] text-cyan-300/70 mt-1">
                        {soul.element}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )
        )}

        {activeTab === 'ring' && (
          <div className="space-y-2.5">
            <p className="text-[11px] text-muted-foreground mb-1">魂环品质由魂兽年限决定，年限越高，魂环越强、魂技威力越大。点击卡片查看详细信息。</p>
            {RING_DETAILS.map((r, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRing(r)}
                className="w-full p-3 rounded-xl border border-border/50 bg-gradient-to-br from-card/60 to-card/30 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10 text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full border-2 shrink-0 flex items-center justify-center"
                    style={{ borderColor: r.color, backgroundColor: `${r.color}20`, boxShadow: `0 0 12px ${r.color}80` }}
                  >
                    <div className="w-5 h-5 rounded-full" style={{ backgroundColor: r.color, opacity: 0.6 }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-foreground">{r.label}魂环</div>
                    <div className="text-[10px] text-muted-foreground">{r.years}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-400 transition shrink-0" />
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {activeTab === 'bone' && (
          <div className="space-y-2.5">
            <p className="text-[11px] text-muted-foreground mb-1">魂骨是魂兽掉落的珍贵宝物，可大幅提升对应部位属性并附带魂技。点击卡片查看详细信息。</p>
            {BONE_DETAILS.map((b, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedBone(b)}
                className="w-full p-3 rounded-xl border border-border/50 bg-gradient-to-br from-card/60 to-card/30 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10 text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-lg shrink-0 flex items-center justify-center text-lg font-bold"
                    style={{ color: b.color, backgroundColor: `${b.color}15`, border: `1px solid ${b.color}40` }}
                  >
                    {b.slot[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-foreground">{b.slot}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{b.bonus}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-400 transition shrink-0" />
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {activeTab === 'grass' && (
          filteredGrasses.length === 0 ? (
            <EmptyState text="暂无符合条件的仙草" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {filteredGrasses.map((grass, i) => (
                <motion.button
                  key={grass.id + i}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedGrass(grass)}
                  className="p-3 rounded-xl border border-border/50 bg-gradient-to-br from-card/60 to-card/30 hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/10 text-left transition group"
                >
                  <div className="font-semibold text-sm text-foreground mb-1 truncate">{grass.name}</div>
                  <div className="text-[9px] text-green-300/80 mb-1">{grass.grassType}</div>
                  <div className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{grass.description}</div>
                </motion.button>
              ))}
            </div>
          )
        )}

         {activeTab === 'artifact' && (
           filteredArtifacts.length === 0 ? (
             <EmptyState text="暂无符合条件的神器" />
           ) : (
             <div className="space-y-2.5">
               {filteredArtifacts.map(art => (
                 <motion.button
                   key={art.id}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => setSelectedArtifact(art)}
                   className="w-full p-3 rounded-xl border hover:shadow-lg hover:shadow-amber-500/10 text-left transition group"
                   style={{
                     borderColor: `${art.tierColor}40`,
                     background: `linear-gradient(135deg, ${art.tierColor}15 0%, rgba(20,15,40,0.6) 100%)`,
                   }}
                 >
                   <div className="flex items-center gap-2.5">
                     <div
                       className="w-11 h-11 rounded-lg flex items-center justify-center text-lg font-bold shrink-0"
                       style={{
                         color: art.tierColor,
                         backgroundColor: `${art.tierColor}15`,
                         border: `1px solid ${art.tierColor}40`,
                         boxShadow: `0 0 12px ${art.tierColor}30`,
                       }}
                     >
                       {art.iconChar}
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="font-bold text-foreground truncate">{art.name}</div>
                       <div className="text-[10px]" style={{ color: art.tierColor }}>
                         {art.tier}
                       </div>
                     </div>
                     <ChevronRight className="w-4 h-4 text-amber-400/60 group-hover:text-amber-300 transition shrink-0" />
                   </div>
                   <div className="text-[11px] text-muted-foreground line-clamp-2 mt-2 leading-relaxed">{art.description}</div>
                 </motion.button>
               ))}
             </div>
           )
         )}
      </div>

      {/* 魂兽详情弹窗 */}
      <DetailDialog
        open={!!selectedBeast}
        onClose={() => setSelectedBeast(null)}
        title={selectedBeast?.name || ''}
        subtitle={
          selectedBeast ? (
            <div className="flex gap-2 mt-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${ATTR_COLORS[normalizeBeastAttribute(selectedBeast.element)] || ''}`}>
                {normalizeBeastAttribute(selectedBeast.element)}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-300 bg-amber-900/20">
                {AREA_LIST.find(a => a.key === selectedBeast.areaTier)?.label}
              </span>
            </div>
          ) : null
        }
        borderColor="rgba(34,211,238,0.3)"
        accentColor="#22d3ee"
      >
        {selectedBeast && (
          <div className="space-y-3">
            <div>
              <div className="text-xs font-semibold text-cyan-300 mb-1.5">简介</div>
              <div className="text-[11px] text-foreground/80 leading-relaxed">{selectedBeast.description}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <InfoCard label="代表技能" value={selectedBeast.skills?.[0]?.name || '—'} sub={selectedBeast.skills?.[0]?.desc} />
               <InfoCard label="栖息年限" value={
                 selectedBeast.areaTier === 'outer' ? '十年 ~ 百年' :
                 selectedBeast.areaTier === 'middle' ? '百年 ~ 千年' :
                 selectedBeast.areaTier === 'inner' ? '千年 ~ 万年' :
                 selectedBeast.areaTier === 'core' ? '十万年 ~ 百万年' : '五十万年 +'
               } sub="参考区间" />
            </div>
            <div>
              <div className="text-xs font-semibold text-cyan-300 mb-1.5">基础属性参考（万年级）</div>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {(() => {
                  const s = getBeastStatsByYears(10000, selectedBeast.baseAtkPerYear, selectedBeast.baseDefPerYear, selectedBeast.baseHpPerYear, selectedBeast.baseSpdPerYear);
                  return (
                    <>
                      <StatBox label="气血" value={formatNum(s.hp)} color="text-red-400" />
                      <StatBox label="攻击" value={formatNum(s.attack)} color="text-orange-400" />
                      <StatBox label="防御" value={formatNum(s.defense)} color="text-blue-400" />
                      <StatBox label="速度" value={formatNum(s.speed)} color="text-green-400" />
                    </>
                  );
                })()}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-cyan-300 mb-1.5">出没区域</div>
              <div className="text-[11px] text-foreground/80">星斗大森林 · {AREA_LIST.find(a => a.key === selectedBeast.areaTier)?.label}</div>
            </div>
          </div>
        )}
      </DetailDialog>

      {/* 武魂详情弹窗 */}
      <DetailDialog
        open={!!selectedSoul}
        onClose={() => setSelectedSoul(null)}
        title={selectedSoul?.name || ''}
        subtitle={
          selectedSoul ? (
            <div className="flex gap-2 mt-1 flex-wrap">
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${qualityMap[selectedSoul.quality] || ''}`}>
                {qualityLabel(selectedSoul.quality)}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-300 bg-amber-900/20">
                {getSoulDepartment(selectedSoul.type || '')}
              </span>
              {selectedSoul.element && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${ATTR_COLORS[normalizeBeastAttribute(selectedSoul.element)] || ''}`}>
                  {normalizeBeastAttribute(selectedSoul.element)}
                </span>
              )}
            </div>
          ) : null
        }
        borderColor="rgba(251,191,36,0.3)"
        accentColor="#fbbf24"
      >
        {selectedSoul && (
          <div className="space-y-3">
            <div>
              <div className="text-xs font-semibold text-amber-300 mb-1.5">武魂介绍</div>
              <div className="text-[11px] text-foreground/80 leading-relaxed">
                {selectedSoul.description || '传承自远古的强大武魂，蕴含神秘力量。'}
              </div>
            </div>

            {selectedSoul.baseStats && (
              <div>
                <div className="text-xs font-semibold text-amber-300 mb-1.5">初始属性</div>
                <div className="grid grid-cols-5 gap-1 text-center">
                  {(['attack', 'defense', 'speed', 'spirit', 'hp'] as const).map(k => {
                    const label = k === 'attack' ? '攻击' : k === 'defense' ? '防御' : k === 'speed' ? '速度' : k === 'spirit' ? '精神' : '气血';
                    return (
                      <div key={k} className="p-1.5 rounded-md bg-black/30 border border-border/30">
                        <div className="text-[9px] text-muted-foreground">{label}</div>
                        <div className="text-[11px] font-bold text-foreground">{selectedSoul.baseStats[k]}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs font-semibold text-amber-300 mb-1.5">魂技列表（1~9魂技）</div>
              <div className="space-y-1.5">
                {(generateSoulSkills(selectedSoul) || []).map((skillName, i) => {
                  const isAvatar = i === 6;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 p-2 rounded-lg border ${
                        isAvatar
                          ? 'bg-amber-900/20 border-amber-500/30'
                          : 'bg-black/20 border-border/30'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isAvatar ? 'bg-amber-500/40 text-amber-100' : 'bg-card text-foreground/80'
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-medium truncate ${isAvatar ? 'text-amber-200' : 'text-foreground'}`}>
                          {isAvatar ? '武魂真身' : skillName}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </DetailDialog>

      {/* 魂环详情弹窗 */}
      <DetailDialog
        open={!!selectedRing}
        onClose={() => setSelectedRing(null)}
        title={selectedRing ? `${selectedRing.label}魂环` : ''}
        subtitle={
          selectedRing ? (
            <div className="flex items-center gap-2 mt-1">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedRing.color, boxShadow: `0 0 6px ${selectedRing.color}` }}
              />
              <span className="text-[10px] text-muted-foreground">{selectedRing.years}</span>
            </div>
          ) : null
        }
        borderColor={selectedRing ? `${selectedRing.color}60` : 'rgba(34,211,238,0.3)'}
        accentColor={selectedRing?.color || '#22d3ee'}
      >
        {selectedRing && (
          <div className="space-y-3">
            <div className="flex justify-center py-3">
              <div
                className="w-24 h-24 rounded-full border-4 flex items-center justify-center"
                style={{
                  borderColor: selectedRing.color,
                  boxShadow: `0 0 30px ${selectedRing.color}80, inset 0 0 20px ${selectedRing.color}40`,
                }}
              >
                <div
                  className="w-14 h-14 rounded-full"
                  style={{ backgroundColor: `${selectedRing.color}30` }}
                />
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold mb-1.5" style={{ color: selectedRing.color }}>魂环介绍</div>
              <div className="text-[11px] text-foreground/80 leading-relaxed">{selectedRing.desc}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <InfoCard label="魂技威力" value={selectedRing.skillDamage} sub="参考范围" />
              <InfoCard label="吸收限制" value={selectedRing.absorbLimit} sub="最低境界" />
            </div>
            <InfoCard label="稀有度" value={selectedRing.dropRate} sub="星越多越常见" />
          </div>
        )}
      </DetailDialog>

      {/* 魂骨详情弹窗 */}
      <DetailDialog
        open={!!selectedBone}
        onClose={() => setSelectedBone(null)}
        title={selectedBone?.slot || ''}
        subtitle={
          selectedBone ? (
            <div className="text-[10px] mt-1" style={{ color: selectedBone.color }}>
              {selectedBone.bonus}
            </div>
          ) : null
        }
        borderColor={selectedBone ? `${selectedBone.color}60` : 'rgba(168,85,247,0.3)'}
        accentColor={selectedBone?.color || '#a855f7'}
      >
        {selectedBone && (
          <div className="space-y-3">
            <div className="flex justify-center py-3">
              <div
                className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-bold"
                style={{
                  color: selectedBone.color,
                  backgroundColor: `${selectedBone.color}15`,
                  border: `1px solid ${selectedBone.color}50`,
                  boxShadow: `0 0 20px ${selectedBone.color}30`,
                }}
              >
                {selectedBone.slot[0]}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold mb-1.5" style={{ color: selectedBone.color }}>魂骨介绍</div>
              <div className="text-[11px] text-foreground/80 leading-relaxed">{selectedBone.desc}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <InfoCard label="主要加成" value={selectedBone.bonus} sub="属性提升" />
              <InfoCard label="稀有度" value={selectedBone.rarity} sub="掉落难度" />
            </div>
          </div>
        )}
      </DetailDialog>

      {/* 仙草详情弹窗 */}
      <DetailDialog
        open={!!selectedGrass}
        onClose={() => setSelectedGrass(null)}
        title={selectedGrass?.name || ''}
        subtitle={
          selectedGrass ? (
            <div className="flex gap-2 mt-1 flex-wrap">
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-green-500/40 text-green-300 bg-green-900/20">
                {selectedGrass.grassType}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded border" style={{
                color: selectedGrass.qualityColor || '#a855f7',
                borderColor: `${selectedGrass.qualityColor || '#a855f7'}50`,
                backgroundColor: `${selectedGrass.qualityColor || '#a855f7'}15`,
              }}>
                {qualityLabel(selectedGrass.quality)}
              </span>
            </div>
          ) : null
        }
        borderColor="rgba(34,197,94,0.3)"
        accentColor="#22c55e"
      >
        {selectedGrass && (
          <div className="space-y-3">
            <div className="flex justify-center py-3">
              <div
                className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-bold"
                style={{
                  color: selectedGrass.qualityColor || '#22c55e',
                  backgroundColor: `${selectedGrass.qualityColor || '#22c55e'}15`,
                  border: `1px solid ${selectedGrass.qualityColor || '#22c55e'}50`,
                  boxShadow: `0 0 20px ${selectedGrass.qualityColor || '#22c55e'}30`,
                }}
              >
                {selectedGrass.iconChar || '草'}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-green-300 mb-1.5">仙草介绍</div>
              <div className="text-[11px] text-foreground/80 leading-relaxed">{selectedGrass.description}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <InfoCard label="获取方式" value={
                selectedGrass.grassType === '冰火仙草' ? '冰火两仪眼采集' :
                selectedGrass.grassType === '圣灵草' ? '特殊事件掉落' :
                '魂兽掉落 / 采集'
              } sub="主要途径" />
              <InfoCard label="服用限制" value="仅限一次" sub="同种仙草" />
            </div>
            <InfoCard label="效果说明" value={parseGrassEffect(selectedGrass.effect)} sub="服用后永久生效" />
          </div>
        )}
      </DetailDialog>

      {/* 神器详情弹窗 */}
       <DetailDialog
         open={!!selectedArtifact}
         onClose={() => setSelectedArtifact(null)}
         title={selectedArtifact?.name || ''}
         subtitle={
           selectedArtifact ? (
             <div className="text-[10px] mt-1" style={{ color: selectedArtifact.tierColor }}>
               {selectedArtifact.tier}神器
             </div>
           ) : null
         }
         borderColor={selectedArtifact ? `${selectedArtifact.tierColor}60` : 'rgba(251,191,36,0.3)'}
         accentColor={selectedArtifact?.tierColor}
       >
         {selectedArtifact && (
           <div className="space-y-3">
             <div className="flex justify-center py-3">
               <div
                 className="w-24 h-24 rounded-xl flex items-center justify-center text-4xl font-bold"
                 style={{
                   color: selectedArtifact.tierColor,
                   background: `radial-gradient(circle, ${selectedArtifact.tierColor}20 0%, transparent 70%)`,
                   border: `1px solid ${selectedArtifact.tierColor}50`,
                   boxShadow: `0 0 30px ${selectedArtifact.tierColor}40`,
                   textShadow: `0 0 12px ${selectedArtifact.tierColor}`,
                 }}
               >
                 {selectedArtifact.iconChar}
               </div>
             </div>
             <div>
               <div className="text-xs font-semibold mb-1.5" style={{ color: selectedArtifact.tierColor }}>神器介绍</div>
               <div className="text-[11px] text-foreground/80 leading-relaxed">{selectedArtifact.description}</div>
             </div>
             {selectedArtifact.attributes && Object.keys(selectedArtifact.attributes).length > 0 && (
               <div>
                 <div className="text-xs font-semibold mb-1.5" style={{ color: selectedArtifact.tierColor }}>属性加成</div>
                 <div className="grid grid-cols-5 gap-1 text-center">
                   {(['attack', 'defense', 'speed', 'spirit', 'hp'] as const).map(k => {
                     const v = (selectedArtifact.attributes as any)[k];
                     if (!v) return null;
                     const label = k === 'attack' ? '攻击' : k === 'defense' ? '防御' : k === 'speed' ? '速度' : k === 'spirit' ? '精神' : '气血';
                     return (
                       <div key={k} className="p-1.5 rounded-md bg-black/30 border" style={{ borderColor: `${selectedArtifact.tierColor}30` }}>
                         <div className="text-[9px] text-muted-foreground">{label}</div>
                         <div className="text-[10px] font-bold" style={{ color: selectedArtifact.tierColor }}>+{formatNum(v)}</div>
                       </div>
                     );
                   })}
                 </div>
               </div>
             )}
             <InfoCard label="获取方式" value={selectedArtifact.obtainMethod} sub="极为稀有" />
           </div>
         )}
       </DetailDialog>
    </div>
  );
}

// ============ 子组件 ============

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-full bg-card/40 border border-border/40 flex items-center justify-center mb-3">
        <Search className="w-6 h-6 text-muted-foreground/50" />
      </div>
      <div className="text-sm text-muted-foreground">{text}</div>
      <div className="text-[11px] text-muted-foreground/60 mt-1">试试调整筛选条件或搜索关键词</div>
    </div>
  );
}

function InfoCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-black/30 border border-border/30">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-xs font-semibold text-foreground mt-0.5 leading-tight">{value}</div>
      {sub && <div className="text-[9px] text-muted-foreground/70 mt-0.5">{sub}</div>}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-1.5 rounded-md bg-black/30 border border-border/30">
      <div className="text-[9px] text-muted-foreground">{label}</div>
      <div className={`text-[11px] font-bold ${color}`}>{value}</div>
    </div>
  );
}

interface DetailDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  borderColor?: string;
  accentColor?: string;
  children: React.ReactNode;
}

function DetailDialog({ open, onClose, title, subtitle, borderColor = 'rgba(34,211,238,0.3)', children }: DetailDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end md:items-center justify-center p-3"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md max-h-[82vh] overflow-hidden flex flex-col rounded-2xl bg-card/98 shadow-2xl"
            style={{ borderWidth: '1px', borderColor }}
          >
            <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-border/30 bg-card/95 backdrop-blur shrink-0 z-10">
              <div className="min-w-0 flex-1">
                <h3 className="text-base md:text-lg font-bold text-foreground truncate">{title}</h3>
                {subtitle}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-accent/30 text-muted-foreground hover:text-foreground transition shrink-0 ml-2"
                aria-label="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 解析仙草效果字符串
 function parseGrassEffect(effect?: string): string {
   if (!effect) return '提升修为与魂力';
   if (effect.startsWith('immortal:')) {
     // immortal:冰属性:attackPct+8%,speedPct+5%
     const parts = effect.split(':');
     const attr = parts[1] || '';
     const bonuses = parts[2] || '';
     const bonusText = bonuses
       .replace(/attackPct\+/g, '攻击+')
       .replace(/defensePct\+/g, '防御+')
       .replace(/speedPct\+/g, '速度+')
       .replace(/spiritPct\+/g, '精神+')
       .replace(/hpPct\+/g, '气血+')
       .replace(/,/g, '、');
     return `${attr}亲和提升 · ${bonusText}`;
   }
   if (effect.startsWith('element-spirit:')) {
     return '提升对应属性修为与魂力';
   }
   if (effect.startsWith('attribute-spirit:')) {
     return '提升对应属性修为与魂力';
   }
   if (effect.startsWith('ice-fire-immortal:')) {
     // 格式：ice-fire-immortal:<仙草名>:<效果段1>:...:<specialEffect?>
     // 从 effect 字符串中提取具体效果信息展示给玩家
     const parts = effect.split(':');
     const descParts: string[] = [];
     for (let i = 2; i < parts.length; i++) {
       const seg = parts[i];
       if (seg === 'evolve-ice') { descParts.push('冰武魂进化极致之冰'); continue; }
       if (seg === 'evolve-fire') { descParts.push('火武魂进化极致之火'); continue; }
       if (seg === 'evolve-tulip') { descParts.push('七宝进化九宝玲珑塔'); continue; }
       const cbMatch = seg.match(/cultivationBonus\+([\d.]+)/);
       if (cbMatch) { descParts.push(`修炼方向+${Number(cbMatch[1]).toLocaleString()}`); continue; }
       const hpMatch = seg.match(/hp\+([\d.]+)/);
       if (hpMatch) { descParts.push(`气血+${Number(hpMatch[1]).toLocaleString()}`); continue; }
       const allPct = seg.match(/allAttrPct\+([\d.]+)%/);
       if (allPct) { descParts.push(`全属性+${allPct[1]}%`); continue; }
       const atkMatch = seg.match(/attack\+([\d.]+)/);
       if (atkMatch) { descParts.push(`攻击+${Number(atkMatch[1]).toLocaleString()}`); continue; }
       const defMatch = seg.match(/defense\+([\d.]+)/);
       if (defMatch) { descParts.push(`防御+${Number(defMatch[1]).toLocaleString()}`); continue; }
       const spdMatch = seg.match(/speed\+([\d.]+)/);
       if (spdMatch) { descParts.push(`速度+${Number(spdMatch[1]).toLocaleString()}`); continue; }
       const sprMatch = seg.match(/spirit\+([\d.]+)/);
       if (sprMatch) { descParts.push(`精神+${Number(sprMatch[1]).toLocaleString()}`); continue; }
     }
     if (descParts.length > 0) return descParts.join('、');
     return '冰火两仪眼孕育，药力霸道';
   }
   if (effect.startsWith('sacred-dragon:')) {
     return '罗三炮进化耀阳圣龙（神级）';
   }
   if (effect.startsWith('holy-grass:')) {
     return '圣灵之力，净化心神';
   }
   return '提升修为与魂力';
 }
