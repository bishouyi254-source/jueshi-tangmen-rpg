import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame, QUALITY_COLOR, QUALITY_LABEL } from '@/lib/gameStore';
import type { IItem } from '@/data/items';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { X, Coins, Leaf, Trash2, CheckSquare, Square, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { MATERIAL_QUALITY_INFO, getConsumableExtra, FIXED_ATTR_KEYS } from '@/data/items';
import { getSoulElement } from '@/data/martialsouls';
import { hasAllGodKingShards } from '@/data/godRealm';
import { formatNumber } from '@/lib/utils';

const FILTER_TABS = [
  { value: 'all', label: '全部' },
  { value: 'soulGuide', label: '魂导器' },
  { value: 'soulBone', label: '魂骨' },
  { value: 'consumable', label: '消耗品' },
  { value: 'material', label: '材料' },
  { value: 'special', label: '特殊物品' },
];

// ===== 物品 effect 字段中文翻译 =====
function translateEffect(effect: string): string {
  if (!effect) return '';

  // 元素灵草：element-spirit:XXX属性
  if (effect.startsWith('element-spirit:')) {
    const attr = effect.replace('element-spirit:', '');
    return `提升${attr}修炼效果`;
  }

  // 属性灵草：attribute-spirit:attack/defense/speed/spirit/hp
  if (effect.startsWith('attribute-spirit:')) {
    const attr = effect.replace('attribute-spirit:', '');
    const map: Record<string, string> = {
      attack: '提升攻击力',
      defense: '提升防御力',
      speed: '提升速度',
      spirit: '提升精神力',
      hp: '提升气血上限',
    };
    return map[attr] || effect;
  }

  // 仙草：immortal:属性名:加成说明
  if (effect.startsWith('immortal:')) {
    const parts = effect.split(':');
    if (parts.length >= 3) {
      const attrName = parts[1];
      const bonus = parts.slice(2).join(':');
      // 把加成里的英文 key 翻译成中文
      let bonusText = bonus
        .replace(/allAttr/g, '全属性')
        .replace(/attack/g, '攻击')
        .replace(/defense/g, '防御')
        .replace(/speed/g, '速度')
        .replace(/spirit/g, '精神')
        .replace(/hp/g, '气血');
      return `${attrName}仙草 · ${bonusText}`;
    }
    return effect;
  }

  // 生命之水：water-of-life:xxx
  if (effect.startsWith('water-of-life:')) {
    const val = effect.replace('water-of-life:', '');
    return `生命之水 · 恢复${val}气血`;
  }

  // 极寒冰玉：polar-ice-jade:xxx
  if (effect.startsWith('polar-ice-jade:')) {
    const val = effect.replace('polar-ice-jade:', '');
    return `极寒冰玉 · ${val}`;
  }

  // 冰火两仪眼仙草：ice-fire-immortal:仙草名:效果段:特殊效果
  if (effect.startsWith('ice-fire-immortal:')) {
    const parts = effect.split(':');
    const name = parts[1] || '仙草';
    return `冰火仙草 · ${name}`;
  }

  // 圣灵草：holy-grass:属性名:属性加成
  if (effect.startsWith('holy-grass:')) {
    const parts = effect.split(':');
    const attr = parts[1] || '圣灵';
    return `圣灵草 · ${attr}`;
  }

  return effect;
}

// 灵草属性名 → 标准武魂属性名的映射（用于属性匹配判定）
// 12种标准属性：金/木/水/火/土/冰/雷/风/光明/黑暗/精神/混沌
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

function normalizeGrassAttr(req: string): string[] {
  const key = req.endsWith('属性') ? req : req + '属性';
  if (GRASS_ATTR_TO_STANDARD[key]) return GRASS_ATTR_TO_STANDARD[key];
  return [key];
}

export default function InventoryPanel() {
  const { player, addCoins, setPlayer, equipItem, useConsumable: consumeItem, craftDivineCore } = useGame();
  const [filter, setFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<IItem | null>(null);
  const [sellQuality, setSellQuality] = useState<string[]>(['common', 'rare']);
  const [showSellConfirm, setShowSellConfirm] = useState(false);
  const [boneSellConfirmItem, setBoneSellConfirmItem] = useState<IItem | null>(null);
  const [selectedSellIds, setSelectedSellIds] = useState<Set<string>>(new Set());
  const [boneSlotFilter, setBoneSlotFilter] = useState<string>('all');
  // 服用中状态：防重复点击，防止快速连点导致同一颗仙草被消耗多次（StrictMode双调用保护）
  const [consumingId, setConsumingId] = useState<string | null>(null);

  const BONE_SLOTS = [
    { value: 'all', label: '全部' },
    { value: 'head', label: '头骨' },
    { value: 'torso', label: '躯干骨' },
    { value: 'leftArm', label: '左臂骨' },
    { value: 'rightArm', label: '右臂骨' },
    { value: 'leftLeg', label: '左腿骨' },
    { value: 'rightLeg', label: '右腿骨' },
    { value: 'external', label: '外附魂骨' },
  ];

  // 魂骨年限颜色映射：十年白/百年黄/千年紫/万年黑/十万年红/百万年金
  const BONE_YEAR_COLORS: Record<string, { border: string; bg: string; text: string; shadow: string }> = {
    '十年': { border: '#e5e7eb', bg: '#f9fafb', text: '#6b7280', shadow: '0 0 6px rgba(200,200,200,0.3)' },
    '百年': { border: '#fbbf24', bg: '#fef3c7', text: '#d97706', shadow: '0 0 8px rgba(251,191,36,0.3)' },
    '千年': { border: '#a855f7', bg: '#f3e8ff', text: '#7c3aed', shadow: '0 0 10px rgba(168,85,247,0.3)' },
    '万年': { border: '#1f2937', bg: '#374151', text: '#e5e7eb', shadow: '0 0 10px rgba(31,41,55,0.4)' },
    '十万年': { border: '#dc2626', bg: '#fef2f2', text: '#b91c1c', shadow: '0 0 12px rgba(220,38,38,0.35)' },
    '百万年': { border: '#fcd34d', bg: '#fffbeb', text: '#b45309', shadow: '0 0 14px rgba(252,211,77,0.5)' },
  };

  // 一键出售：材料、消耗品和魂骨可出售（魂导器不出售；已装备的魂骨不出售）
  const sellableItems = useMemo(() => {
    if (!player) return [] as IItem[];
    const equippedBoneIds = new Set(
      Object.values(player.soulBones)
        .filter((b): b is IItem => b !== null && typeof b === 'object' && 'id' in b)
        .map((b) => b.id)
    );
    return player.inventory.filter((i) => {
      if (i.type === 'soulGuide') return false;
      if (i.type === 'soulBone' && equippedBoneIds.has(i.id)) return false;
      if (i.type === 'special') return false; // 特殊物品不可出售
      if (!i.sellPrice || i.sellPrice <= 0) return false;
      return true;
    });
  }, [player]);

  const selectedSellItems = useMemo(() => {
    return sellableItems.filter((i) => selectedSellIds.has(i.id));
  }, [sellableItems, selectedSellIds]);

  const totalSellPrice = useMemo(() => {
    return selectedSellItems.reduce((sum, item) => sum + (item.sellPrice ?? 0) * (item.quantity ?? 1), 0);
  }, [selectedSellItems]);

  const allSellableSelected = sellableItems.length > 0 && sellableItems.every((i) => selectedSellIds.has(i.id));

  const toggleSellItem = (id: string) => {
    setSelectedSellIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllSell = () => {
    if (allSellableSelected) {
      setSelectedSellIds(new Set());
    } else {
      setSelectedSellIds(new Set(sellableItems.map((i) => i.id)));
    }
  };

  const handleBulkSell = () => {
    if (selectedSellItems.length === 0) {
      toast.info('请先勾选要出售的物品');
      return;
    }
    const ids = new Set(selectedSellItems.map((i) => i.id));
    let total = 0;
    selectedSellItems.forEach((i) => { total += (i.sellPrice ?? 0) * (i.quantity ?? 1); });
    addCoins(total);
    setPlayer((p) => {
      const newInv = p.inventory.filter((i) => !ids.has(i.id));
      return { ...p, inventory: newInv };
    });
    toast.success(`出售 ${selectedSellItems.length} 件物品，获得 ${formatNumber(total)} 魂币`);
    setShowSellConfirm(false);
    setSelectedSellIds(new Set());
  };

  const filtered = useMemo(() => {
    if (!player) return [];
    let list = player.inventory;
    if (filter !== 'all') list = list.filter((i) => i.type === filter);
    // 魂骨部位筛选
    if (filter === 'soulBone' && boneSlotFilter !== 'all') {
      list = list.filter((i) => i.slot === boneSlotFilter);
    }
    return list;
  }, [player, filter, boneSlotFilter]);

  if (!player) return null;

  const handleEquip = (item: IItem) => {
    if (item.type === 'soulGuide' || item.type === 'soulBone') {
      equipItem(item);
      toast.success(`已装备：${item.name}`);
      setSelectedItem(null);
    }
  };

  const handleSell = (item: IItem) => {
    if (item.type === 'special') {
      toast.error('特殊物品无法出售');
      return;
    }
    if (!item.sellPrice || item.sellPrice <= 0) {
      toast.error('该物品无法出售');
      return;
    }
    if (item.type === 'soulBone') {
      setBoneSellConfirmItem(item);
      return;
    }
    addCoins(item.sellPrice);
    setPlayer((p) => {
      const stackable = item.type === 'material' || item.type === 'consumable' || item.type === 'special';
      const qty = item.quantity ?? 1;
      if (stackable && qty > 1) {
        // 堆叠物品：只减 1，不从背包移除
        const newInv = p.inventory.map((i) =>
          i.id === item.id ? { ...i, quantity: qty - 1 } : i
        );
        return { ...p, inventory: newInv };
       } else {
         const newInv = p.inventory.filter((i) => i.id !== item.id);
         return { ...p, inventory: newInv };
       }
     });
     toast.success(`出售成功，获得 ${formatNumber(item.sellPrice)} 魂币`);
     setSelectedItem(null);
   };

   const confirmSellBone = () => {
    if (!boneSellConfirmItem) return;
    const item = boneSellConfirmItem;
    addCoins(item.sellPrice);
    setPlayer((p) => {
      const newInv = p.inventory.filter((i) => i.id !== item.id);
      return { ...p, inventory: newInv };
    });
    toast.success(`出售成功，获得 ${formatNumber(item.sellPrice)} 魂币`);
    setSelectedItem(null);
    setBoneSellConfirmItem(null);
  };

  const handleUseConsumable = (item: IItem) => {
    // 防重复点击：服用中直接忽略
    if (consumingId) return;
    setConsumingId(item.id);
    try {
      const result = consumeItem(item.id);
      if (result.success) {
        toast.success(`服用成功！${result.itemName ? item.name + ' 已吸收' : '属性提升'}`);
        setSelectedItem(null);
      } else {
        toast.error(result.reason || '服用失败');
      }
    } finally {
      // 短暂延迟后恢复，防止 StrictMode 双调用导致同一物品被吃两次
      setTimeout(() => setConsumingId(null), 300);
    }
  };

  // 计算消耗品状态信息
  const getConsumableStatus = (item: IItem) => {
    const extra = getConsumableExtra(item);
    if (!extra) return null;
    const currentCount = player?.consumableCounts?.[extra.capKey] || 0;
    const atMax = currentCount >= extra.cap;
    // 属性判定：双生武魂适配——只要一个武魂符合就可服用
    let attrMatch = true;
    let attrReason = '';
    let displayAttrReq: string[] = [];
    if (extra.elementReq && extra.elementReq.length > 0) {
      const souls = [player?.martialSoul];
      if (player?.secondSoul) souls.push(player.secondSoul);
       // 武魂元素：使用 element 字段（如有）或从名字推断，归一为标准属性名
       // 极致属性（如「极致之冰」「极致之火」）也归一为「X属性」标准格式
       const soulElements = souls
         .filter(Boolean)
         .flatMap((s) => {
           const raw = s!.element || getSoulElement(s!.name);
           const extreme = s!.extremeAttribute;
           const results: string[] = [];
           // 主属性归一化
           if (raw) {
             const key = raw.endsWith('属性') ? raw : raw + '属性';
             results.push(key);
           }
           // 极致属性也归一为标准属性（如「极致之冰」→「冰属性」），确保极致武魂能正确匹配同属性灵草
            if (extreme && extreme !== '无') {
              if (extreme.startsWith('极致之')) {
                const attr = extreme.replace('极致之', '');
                results.push(attr.endsWith('属性') ? attr : attr + '属性');
              }
            }
           return results;
         });
      // 把灵草要求的属性映射为标准属性名数组
      const requiredStandard = extra.elementReq.flatMap((req) => normalizeGrassAttr(req));
      displayAttrReq = extra.elementReq.map((r) => {
        // 毒/暗等特殊属性显示更清晰的中文
        if (r === '毒属性') return '毒(木)属性';
        if (r === '暗属性') return '黑暗属性';
        if (r === '力量属性') return '力(金)属性';
        if (r === '生命属性') return '生命属性';
        return r;
      });
       if (requiredStandard.length === 0) {
          // 无属性限制的仙草，直接匹配
          attrMatch = true;
        } else if (soulElements.some((el) => el === '混沌属性')) {
          // 混沌属性武魂可以服用所有属性的灵草仙草
          attrMatch = true;
        } else {
        const matchOne = requiredStandard.some((req) =>
          soulElements.some((el) =>
            el === req || el.includes(req.replace('属性', '')) || req.includes(el.replace('属性', ''))
          )
        );
        attrMatch = matchOne;
        attrReason = `需要${displayAttrReq.join('/')}武魂`;
      }
    }
    const canUse = attrMatch && !atMax;
    return {
      extra,
      currentCount,
      atMax,
      attrMatch,
      attrReason,
      canUse,
      displayAttrReq,
    };
  };

  const typeLabel = (t: string) => {
    const map: Record<string, string> = {
      soulGuide: '魂导器',
      soulBone: '魂骨',
      consumable: '消耗品',
      material: '材料',
      special: '特殊物品',
    };
    return map[t] ?? t;
  };

  const soulGuideTypeLabel = (t?: string) => {
    const map: Record<string, string> = {
      melee: '近战',
      defense: '防御',
      ranged: '远程',
      support: '辅助',
      flying: '飞行',
    };
    return t ? (map[t] ?? t) : '';
  };

  const gradeLabel = (g?: string) => {
    const map: Record<string, string> = {
      tier1: '一级',
      tier2: '二级',
      tier3: '三级',
    };
    return g ? (map[g] ?? g) : '';
  };

  return (
    <div className="p-3 md:p-5">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="text-lg md:text-xl font-bold">背包</h2>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setShowSellConfirm(true)}
             className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-900/30 text-amber-300 border border-amber-500/30 text-xs font-medium hover:bg-amber-900/50 transition-colors shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">一键出售</span>
            <span className="sm:hidden">出售</span>
          </button>
          <div className="text-sm md:text-base text-muted-foreground tabular-nums">
            {player.inventory.length} 件物品
          </div>
        </div>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="w-full grid grid-cols-5 bg-card/40">
           {FILTER_TABS.map((t) => (
             <TabsTrigger key={t.value} value={t.value} className="text-xs md:text-sm px-1 md:px-2 py-1.5 md:py-2.5">
               {t.label}
             </TabsTrigger>
           ))}
         </TabsList>
       </Tabs>

       {/* 🔴 v16.0 神界系统：集齐5块神王中枢碎片时显示合成按钮 */}
       {hasAllGodKingShards(player?.inventory ?? []) && !player?.godRealm?.divineCoreCrafted && (
         <div className="mt-3 rounded-lg border border-yellow-400/40 bg-gradient-to-r from-yellow-500/15 via-amber-500/10 to-yellow-500/15 p-3 flex items-center gap-3">
           <div className="text-2xl">🌟</div>
           <div className="flex-1 min-w-0">
             <p className="text-sm font-bold text-yellow-200">五块神级中枢碎片已集齐！</p>
               <p className="text-[11px] text-yellow-300/80">可合成完整神界中枢，被动增加 200% 全属性</p>
           </div>
           <button
             onClick={() => {
               const res = craftDivineCore();
               if (res.success) {
                 toast.success('🎉 成功合成【神界中枢】！全属性 +200%');
               } else {
                 toast.error(res.reason || '合成失败');
               }
             }}
             className="px-3 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-900 text-xs font-bold hover:shadow-lg hover:shadow-yellow-500/40 active:scale-95 transition-all shrink-0"
           >
             立即合成
           </button>
         </div>
       )}

        {/* 操作栏：魂骨部位筛选（一键出售已移到右上角） */}
        {filter === 'soulBone' && (
          <div className="mt-2">
            <div className="flex gap-1 overflow-x-auto pb-0.5 -mx-1 px-1">
              {BONE_SLOTS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setBoneSlotFilter(s.value)}
                  className={`shrink-0 text-[11px] px-2 py-1 rounded-md transition-colors ${
                    boneSlotFilter === s.value
                      ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
                      : 'bg-card/40 text-muted-foreground border border-border/30 hover:text-foreground'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

      <div className="mt-3 md:mt-4 grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2 md:gap-3">
         {filtered.map((item) => {
            // 魂骨：按年限颜色；材料和自制魂导器：按等级用对应颜色；其他用品质色
           let borderColor = QUALITY_COLOR[item.quality as keyof typeof QUALITY_COLOR] + '80';
           let bgColor = QUALITY_COLOR[item.quality as keyof typeof QUALITY_COLOR] + '10';
           let textColor = QUALITY_COLOR[item.quality as keyof typeof QUALITY_COLOR];
           let shadowColor = `0 0 8px ${QUALITY_COLOR[item.quality as keyof typeof QUALITY_COLOR]}20`;
           let boneYearLabel = ''; // 魂骨年限标签
            const tierColors: Record<number, { border: string; bg: string; text: string; shadow: string }> = {
              1: { border: '#cbd5e180', bg: '#cbd5e110', text: '#cbd5e1', shadow: '0 0 8px rgba(203,213,225,0.15)' },
              2: { border: '#22c55e80', bg: '#22c55e10', text: '#22c55e', shadow: '0 0 8px rgba(34,197,94,0.2)' },
              3: { border: '#3b82f680', bg: '#3b82f610', text: '#3b82f6', shadow: '0 0 8px rgba(59,130,246,0.2)' },
              4: { border: '#a855f780', bg: '#a855f710', text: '#a855f7', shadow: '0 0 10px rgba(168,85,247,0.2)' },
              5: { border: '#f9731680', bg: '#f9731610', text: '#f97316', shadow: '0 0 8px rgba(249,115,22,0.2)' },
              6: { border: '#ef444480', bg: '#ef444410', text: '#ef4444', shadow: '0 0 8px rgba(239,68,68,0.2)' },
              7: { border: '#ec489980', bg: '#ec489910', text: '#ec4899', shadow: '0 0 8px rgba(236,72,153,0.2)' },
              8: { border: '#eab30880', bg: '#eab30810', text: '#eab308', shadow: '0 0 8px rgba(234,179,8,0.25)' },
              9: { border: '#ffffff90', bg: 'rgba(255,255,255,0.1)', text: '#ffffff', shadow: '0 0 12px rgba(234,179,8,0.35)' },
            };
            // 魂骨优先按年限上色
            if (item.type === 'soulBone' && item.soulBoneYearsLabel && BONE_YEAR_COLORS[item.soulBoneYearsLabel]) {
                const bc = BONE_YEAR_COLORS[item.soulBoneYearsLabel];
                borderColor = bc.border;
                bgColor = bc.bg;
                textColor = bc.text;
                shadowColor = bc.shadow;
                boneYearLabel = item.soulBoneYearsLabel;
            } else {
              let tier = -1;
              if (item.type === 'material' && item.materialTier !== undefined) tier = item.materialTier;
              else if (item.type === 'soulGuide' && item.craftable && item.soulGuideLevel) tier = item.soulGuideLevel;
              if (tier >= 1 && tier <= 9 && tierColors[tier]) {
                borderColor = tierColors[tier].border;
                bgColor = tierColors[tier].bg;
                textColor = tierColors[tier].text;
                shadowColor = tierColors[tier].shadow;
              }
            }
            const isRainbow = (item.type === 'material' || (item.type === 'soulGuide' && item.craftable)) && (item.materialTier === 9 || item.soulGuideLevel === 9);
           return (
             <div key={item.id} className="flex flex-col items-center gap-1 md:gap-1.5">
               <button
                 onClick={() => setSelectedItem(item)}
                 className={`relative w-full aspect-square rounded-lg md:rounded-xl border-2 transition-all hover:scale-105 active:scale-95 ${isRainbow ? 'craft-rainbow-border' : ''}`}
                 style={{
                   borderColor: borderColor,
                   backgroundColor: bgColor,
                   boxShadow: isRainbow ? undefined : shadowColor,
                 }}
               >
                 <div
                   className="w-full h-full flex items-center justify-center text-base md:text-xl font-bold"
                   style={{ color: textColor }}
                 >
                   {item.iconChar}
                 </div>
                 {(item.quantity ?? 1) > 1 && (
                    <span className="absolute right-0.5 bottom-0.5 text-[10px] font-bold text-foreground bg-black/60 px-1 rounded leading-tight">
                      {item.quantity}
                    </span>
                  )}
                 {item.type === 'material' && item.materialQuality && (
                    <span
                      className="absolute top-0.5 left-0.5 w-2 h-2 rounded-full"
                      style={{ backgroundColor: MATERIAL_QUALITY_INFO[item.materialQuality]?.color || '#94a3b8' }}
                      title={MATERIAL_QUALITY_INFO[item.materialQuality]?.label || '普通'}
                    />
                  )}
                 {item.type === 'soulBone' && boneYearLabel && (
                    <span
                      className="absolute top-0 left-0 right-0 text-[8px] font-bold text-center py-0.5 rounded-t-md truncate"
                      style={{
                        backgroundColor: boneYearLabel === '万年' ? '#1f2937' : 'transparent',
                        color: boneYearLabel === '万年' ? '#fef3c7' : textColor,
                      }}
                    >
                      {boneYearLabel}
                    </span>
                  )}
               </button>
               <div className="text-[10px] md:text-xs text-foreground/90 w-full text-center truncate font-medium">
                {item.name}
              </div>
            </div>
          );
        })}
      </div>

       {filtered.length === 0 && (
         <div className="text-center py-16 text-muted-foreground/60 text-sm">
           暂无物品
         </div>
       )}

       {/* 一键出售确认弹窗 */}
       <AnimatePresence>
         {showSellConfirm && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
             onClick={() => setShowSellConfirm(false)}
           >
             <motion.div
               initial={{ scale: 0.9, opacity: 0, y: 10 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 10 }}
               transition={{ type: 'tween', duration: 0.2 }}
               className="w-full max-w-sm bg-card/95 rounded-2xl border-2 border-amber-500/40 shadow-xl max-h-[85vh] overflow-y-auto text-foreground backdrop-blur-md"
               onClick={(e) => e.stopPropagation()}
             >
               <div className="p-5">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="font-bold text-lg flex items-center gap-2">
                     <Trash2 className="h-5 w-5 text-amber-400" />
                     一键出售
                   </h3>
                   <button
                     onClick={() => setShowSellConfirm(false)}
                     className="p-1.5 rounded-full bg-card/60 text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
                   >
                     <X className="h-4 w-4" />
                   </button>
                 </div>

                   <div className="text-xs text-muted-foreground mb-3">勾选要出售的物品（材料、消耗品和魂骨可出售，魂导器不在此列；已装备的魂骨不显示）</div>

                  {/* 全选 + 统计 */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/40">
                    <button
                      onClick={toggleSelectAllSell}
                      className="flex items-center gap-2 text-xs text-foreground hover:text-amber-300 transition-colors"
                    >
                      {allSellableSelected ? (
                        <CheckSquare className="h-4 w-4 text-amber-400" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground" />
                      )}
                      {allSellableSelected ? '取消全选' : '全选'}
                    </button>
                    <div className="text-xs text-muted-foreground">
                      共 {sellableItems.length} 件可售
                    </div>
                  </div>

                  {/* 物品列表 */}
                  <div className="space-y-1.5 mb-4 max-h-[40vh] overflow-y-auto pr-1">
                     {sellableItems.length === 0 && (
                       <div className="text-center py-8 text-muted-foreground/60 text-xs">
                         没有可出售的物品
                       </div>
                     )}
                    {sellableItems.map((item) => {
                      const checked = selectedSellIds.has(item.id);
                      const qColor = QUALITY_COLOR[item.quality as keyof typeof QUALITY_COLOR] || '#94a3b8';
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleSellItem(item.id)}
                          className={`w-full flex items-center gap-2.5 p-2 rounded-lg border transition-all text-left ${checked ? 'border-amber-400/40 bg-amber-500/10' : 'border-border/30 bg-card/30 hover:bg-card/50'}`}
                        >
                          {checked ? (
                            <CheckSquare className="h-4 w-4 shrink-0 text-amber-400" />
                          ) : (
                            <Square className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                          )}
                          <div
                            className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-base font-bold border"
                            style={{ borderColor: qColor + '80', backgroundColor: qColor + '15', color: qColor }}
                          >
                            {item.iconChar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{item.name}</div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                              <span>{QUALITY_LABEL[item.quality as keyof typeof QUALITY_LABEL] || item.quality}</span>
                              <span>·</span>
                              <span>{item.quantity && item.quantity > 1 ? `x${item.quantity}` : '1个'}</span>
                            </div>
                          </div>
                          <div className="shrink-0 text-amber-300 text-xs font-medium flex items-center gap-0.5">
                            <Coins className="h-3 w-3" />
                            {formatNumber((item.sellPrice ?? 0) * (item.quantity ?? 1))}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="rounded-xl bg-black/30 border border-amber-500/20 p-3 mb-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">已勾选</span>
                      <span className="font-bold text-foreground">{selectedSellItems.length} 件物品</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-2">
                      <span className="text-muted-foreground">获得魂币</span>
                      <span className="font-bold text-amber-300 flex items-center gap-1">
                        <Coins className="h-4 w-4" />
                        {formatNumber(totalSellPrice)}
                      </span>
                    </div>
                  </div>

                 <div className="flex gap-2">
                   <button
                     onClick={() => setShowSellConfirm(false)}
                     className="flex-1 py-2.5 rounded-xl border border-border bg-card/50 text-foreground font-medium text-sm hover:bg-card transition-colors"
                   >
                     取消
                   </button>
                   <button
                     onClick={handleBulkSell}
                      disabled={selectedSellItems.length === 0}
                     className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold text-sm hover:from-amber-500 hover:to-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-900/30"
                   >
                     确认出售
                   </button>
                 </div>
               </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>

      {/* 物品详情弹窗 */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              transition={{ type: 'tween', duration: 0.2 }}
               className="w-full max-w-md bg-card/95 rounded-2xl border-2 border-cyan-500 shadow-xl max-h-[82vh] overflow-y-auto text-foreground backdrop-blur-md"
               onClick={(e) => e.stopPropagation()}
             >
               <button
                 onClick={() => setSelectedItem(null)}
                 className="absolute top-2.5 right-2.5 z-10 p-1 rounded-full bg-card/60 text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
               >
                 <X className="h-4 w-4" />
               </button>

               <div className="p-4">
                 <div className="flex flex-col items-center text-center mb-3">
                   <div
                     className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold border-2 mb-2"
                     style={{
                       borderColor: QUALITY_COLOR[selectedItem.quality as keyof typeof QUALITY_COLOR],
                       backgroundColor:
                         QUALITY_COLOR[selectedItem.quality as keyof typeof QUALITY_COLOR] + '15',
                       color: QUALITY_COLOR[selectedItem.quality as keyof typeof QUALITY_COLOR],
                       boxShadow: `0 0 16px ${
                         QUALITY_COLOR[selectedItem.quality as keyof typeof QUALITY_COLOR]
                       }30`,
                     }}
                   >
                     {selectedItem.iconChar}
                   </div>
                   <h3 className="font-bold text-lg">{selectedItem.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap justify-center">
                      {selectedItem.type === 'soulBone' && selectedItem.soulBoneYearsLabel ? (
                        <>
                           <span
                             className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                            style={{
                              backgroundColor: (BONE_YEAR_COLORS[selectedItem.soulBoneYearsLabel]?.bg) || (QUALITY_COLOR[selectedItem.quality as keyof typeof QUALITY_COLOR] + '20'),
                              color: (BONE_YEAR_COLORS[selectedItem.soulBoneYearsLabel]?.text) || QUALITY_COLOR[selectedItem.quality as keyof typeof QUALITY_COLOR],
                              border: `1px solid ${(BONE_YEAR_COLORS[selectedItem.soulBoneYearsLabel]?.border) || (QUALITY_COLOR[selectedItem.quality as keyof typeof QUALITY_COLOR] + '40')}`,
                              boxShadow: (BONE_YEAR_COLORS[selectedItem.soulBoneYearsLabel]?.shadow) || 'none',
                            }}
                          >
                            {selectedItem.soulBoneYearsLabel}魂骨
                          </span>
                         {selectedItem.slot && (
                           <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                             {BONE_SLOTS.find((s) => s.value === selectedItem.slot)?.label ?? selectedItem.slot}
                           </span>
                         )}
                        </>
                      ) : (
                         <span
                           className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor:
                              QUALITY_COLOR[selectedItem.quality as keyof typeof QUALITY_COLOR] + '20',
                            color: QUALITY_COLOR[selectedItem.quality as keyof typeof QUALITY_COLOR],
                          }}
                        >
                          {QUALITY_LABEL[selectedItem.quality as keyof typeof QUALITY_LABEL]}
                        </span>
                      )}
                     <span className="text-[10px] text-muted-foreground">
                      {typeLabel(selectedItem.type)}
                      {selectedItem.soulGuideGrade && ` · ${gradeLabel(selectedItem.soulGuideGrade)}`}
                      {selectedItem.soulGuideLevel && ` · ${selectedItem.soulGuideLevel}级`}
                      {selectedItem.soulGuideType && ` · ${soulGuideTypeLabel(selectedItem.soulGuideType)}型`}
                      {selectedItem.materialTier !== undefined && ` · ${selectedItem.materialTier}级材料`}
                    </span>
                  </div>
                </div>

                 {selectedItem.type === 'soulBone' && selectedItem.soulBoneYears !== undefined && selectedItem.soulBoneYears > 0 && (
                   <div className="text-[11px] text-amber-300/90 text-center mb-2">
                     具体年限：{formatNumber(selectedItem.soulBoneYears)} 年
                   </div>
                 )}

                 {/* 🔴 操作按钮放在顶部，玩家不用下滑即可点击 */}
                 <div className="flex gap-2 mb-3">
                   {(selectedItem.type === 'soulGuide' || selectedItem.type === 'soulBone') && (() => {
                     const isBoneDisabled = selectedItem.type === 'soulBone' && !!player.divineArmor?.hasArmor;
                     return (
                       <button
                         onClick={() => !isBoneDisabled && handleEquip(selectedItem)}
                         disabled={isBoneDisabled}
                         className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                           isBoneDisabled
                             ? 'bg-muted/40 text-muted-foreground cursor-not-allowed border border-border/50'
                             : 'bg-gradient-to-r from-cyan-600 to-cyan-400 text-cyan-950 hover:shadow-lg hover:shadow-cyan-500/30'
                         }`}
                       >
                         {isBoneDisabled ? '已凝聚神装' : (selectedItem.type === 'soulGuide' ? '穿戴' : '装备')}
                       </button>
                     );
                   })()}
                  {selectedItem.type === 'consumable' && (() => {
                    const status = getConsumableStatus(selectedItem);
                    if (!status) return null;
                    const { atMax, attrMatch, attrReason, canUse } = status;
                    const isConsuming = consumingId === selectedItem.id;
                    const btnDisabled = !canUse || isConsuming;
                    return (
                      <button
                        onClick={() => handleUseConsumable(selectedItem)}
                        disabled={btnDisabled}
                         className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                          canUse && !isConsuming
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/30'
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }`}
                      >
                        {isConsuming ? '吸收中...' : atMax ? '已达服用上限' : !attrMatch ? attrReason : '服用'}
                      </button>
                    );
                  })()}
                  <button
                    onClick={() => handleSell(selectedItem)}
                    disabled={!selectedItem.sellPrice || selectedItem.sellPrice <= 0}
                    className={`flex-1 py-2.5 rounded-xl border font-medium text-xs flex items-center justify-center gap-1 transition-colors ${
                      !selectedItem.sellPrice || selectedItem.sellPrice <= 0
                        ? 'border-border/30 bg-muted/20 text-muted-foreground cursor-not-allowed'
                        : 'border-border bg-card/50 text-foreground hover:bg-card'
                    }`}
                  >
                    <Coins className="h-4 w-4 text-yellow-600" />
                    {!selectedItem.sellPrice || selectedItem.sellPrice <= 0 ? '无法出售' : `出售 ${formatNumber(selectedItem.sellPrice)}`}
                  </button>
                </div>

                 {/* 🔴 神装提示紧跟按钮下方 */}
                 {selectedItem.type === 'soulBone' && !!player.divineArmor?.hasArmor && (
                   <div className="text-[11px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1.5 mb-2">
                     ⚠️ 已凝聚神装，魂骨无法再装备
                   </div>
                 )}

                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  {selectedItem.description}
                </p>

                {selectedItem.type === 'soulBone' && selectedItem.slot && player.soulBones &&
                  (player.soulBones[selectedItem.slot as keyof typeof player.soulBones] as IItem | null) &&
                  (player.soulBones[selectedItem.slot as keyof typeof player.soulBones] as IItem).id !== selectedItem.id && (
                  <SoulBoneCompare
                    equipped={player.soulBones[selectedItem.slot as keyof typeof player.soulBones] as IItem}
                    candidate={selectedItem}
                  />
                )}

                 {selectedItem.attributes && Object.keys(selectedItem.attributes).length > 0 && (
                   <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 p-3 mb-3 text-xs space-y-1.5">
                     <div className="text-[10px] font-semibold text-sky-300 mb-1">属性加成</div>
                     {FIXED_ATTR_KEYS.map((attr) => {
                       const val = (selectedItem.attributes as Record<string, number>)[attr.key] ?? 0;
                       if (val <= 0) return null;
                       return (
                         <div key={attr.key} className="flex justify-between">
                           <span className="text-muted-foreground">{attr.label}</span>
                           <span className={attr.isPercent ? 'text-cyan-300 font-medium' : 'text-purple-400 font-medium'}>
                             +{attr.isPercent ? `${val}%` : formatNumber(val)}
                           </span>
                         </div>
                       );
                     })}
                     {selectedItem.specialEffect && (
                       <div className="pt-2 mt-2 border-t border-sky-500/20">
                         <div className="text-[10px] text-muted-foreground mb-1">特殊属性</div>
                         <div className="font-medium text-sm" style={{ color: selectedItem.specialEffect.color }}>
                           {selectedItem.specialEffect.name} · {selectedItem.specialEffect.desc}
                         </div>
                       </div>
                     )}
                   </div>
                 )}

                 {selectedItem.crafter && (
                   <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-2.5 mb-2.5 text-[11px]">
                    <span className="text-cyan-300 font-medium">制作者：</span>
                    <span className="text-foreground">{selectedItem.crafter}</span>
                  </div>
                )}

                {selectedItem.type === 'material' && (
                    <div className="rounded-xl bg-card/50 p-2.5 mb-3 text-xs space-y-1.5">
                      <div className="text-[10px] font-semibold text-muted-foreground mb-1">材料信息</div>
                     <div className="flex justify-between text-xs">
                       <span className="text-muted-foreground">持有数量</span>
                       <span className="text-foreground font-medium">{selectedItem.quantity ?? 1} 件</span>
                     </div>
                     <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">材料等级</span>
                      <span className="text-cyan-300 font-medium">{selectedItem.materialTier} 级</span>
                    </div>
                    {selectedItem.materialAttr && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">属性倾向</span>
                      <span className="text-emerald-400 font-medium">
                           {selectedItem.materialAttr === 'attack' && '攻击倾向'}
                           {selectedItem.materialAttr === 'critRate' && '暴击倾向'}
                           {selectedItem.materialAttr === 'critDmg' && '爆伤倾向'}
                           {selectedItem.materialAttr === 'allAttr' && '全属性倾向'}
                           {selectedItem.materialAttr === 'soulPower' && '魂力倾向'}
                           {selectedItem.materialAttr === 'hp' && '气血倾向'}
                           {selectedItem.materialAttr === 'core' && '核心媒介'}
                           {selectedItem.materialAttr === 'universal' && '通用材料'}
                         </span>
                      </div>
                    )}
                    {selectedItem.materialBonus !== undefined && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">属性点数</span>
                        <span className="text-blue-600 font-medium">+{selectedItem.materialBonus}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">获取地点</span>
                      <span className="text-foreground">日月山脉 {selectedItem.materialTier} 段</span>
                    </div>
                  </div>
                )}

                 {selectedItem.effect && (
                    <div className="rounded-xl bg-green-900/30 p-2.5 mb-3 text-xs text-green-400 border border-green-500/30">
                      效果：{translateEffect(selectedItem.effect)}
                    </div>
                  )}

                {/* 消耗品：服用信息 */}
                 {selectedItem.type === 'consumable' && (() => {
                   const status = getConsumableStatus(selectedItem);
                   if (!status) return null;
                    const { extra, currentCount, atMax, attrMatch, attrReason, canUse, displayAttrReq } = status;
                   return (
                      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 mb-3 text-xs space-y-1.5">
                        <div className="text-[10px] font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                         <Leaf className="h-3.5 w-3.5" />
                         灵草信息
                       </div>
                       {extra.subType && (
                         <div className="flex justify-between text-xs">
                           <span className="text-muted-foreground">类型</span>
                            <span className="text-emerald-400 font-medium">
                              {extra.subType === 'element-spirit' ? '元素灵草' :
                               extra.subType === 'attribute-spirit' ? '属性灵草' :
                               extra.subType === 'immortal' ? '仙草' :
                               extra.subType === 'ice-fire-immortal' ? '仙品仙草' :
                               extra.subType === 'holy-grass' ? '灵草' :
                               extra.subType === 'water-of-life' ? '生命之水' :
                               extra.subType === 'polar-ice-jade' ? '极寒冰玉' : '消耗品'}
                            </span>
                         </div>
                       )}
                       <div className="flex justify-between text-xs">
                         <span className="text-muted-foreground">已服用</span>
                         <span className="text-emerald-400 font-medium">
                           {currentCount} / {extra.cap}
                         </span>
                       </div>
                       {(displayAttrReq && displayAttrReq.length > 0) && (
                         <div className="flex justify-between text-xs">
                           <span className="text-muted-foreground">属性要求</span>
                           <span className={`font-medium ${attrMatch ? 'text-emerald-400' : 'text-red-400'}`}>
                             {displayAttrReq.join(' / ')}
                             {attrMatch ? ' ✓' : ' ✗'}
                           </span>
                         </div>
                       )}
                       {extra.attrBonus && (
                          <div className="pt-2 mt-2 border-t border-emerald-500/10 space-y-1">
                            <div className="text-[10px] text-muted-foreground mb-1">服用效果</div>
                            {extra.attrBonus.allAttr !== undefined && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">全属性</span>
                                <span className="text-cyan-300 font-medium">+{extra.attrBonus.allAttr}%</span>
                              </div>
                            )}
                            {extra.attrBonus.attack !== undefined && extra.attrBonus.attack > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">攻击</span>
                                <span className="text-red-400 font-medium">+{extra.attrBonus.attack}%</span>
                              </div>
                            )}
                            {extra.attrBonus.defense !== undefined && extra.attrBonus.defense > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">防御</span>
                                <span className="text-blue-400 font-medium">+{extra.attrBonus.defense}%</span>
                              </div>
                            )}
                            {extra.attrBonus.speed !== undefined && extra.attrBonus.speed > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">速度</span>
                                <span className="text-green-400 font-medium">+{extra.attrBonus.speed}%</span>
                              </div>
                            )}
                            {extra.attrBonus.spirit !== undefined && extra.attrBonus.spirit > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">精神</span>
                                <span className="text-cyan-300 font-medium">+{extra.attrBonus.spirit}%</span>
                              </div>
                            )}
                            {extra.attrBonus.hp !== undefined && extra.attrBonus.hp > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">气血</span>
                                <span className="text-cyan-400 font-medium">+{extra.attrBonus.hp}%</span>
                              </div>
                            )}
                          </div>
                        )}
                        {/* 元素灵草：显示固定加成 */}
                        {extra.subType === 'element-spirit' && (
                          <div className="pt-2 mt-2 border-t border-emerald-500/10 space-y-1">
                            <div className="text-[10px] text-muted-foreground mb-1">服用效果</div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">攻击</span>
                              <span className="text-red-400 font-medium">+2%</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">精神力</span>
                              <span className="text-cyan-300 font-medium">+1.5%</span>
                            </div>
                          </div>
                        )}
                        {/* 属性灵草显示随机加成 */}
                        {extra.randomAttrs && extra.randomAttrs.length > 0 && !extra.attrBonus && (
                          <div className="pt-2 mt-2 border-t border-emerald-500/10">
                            <div className="text-[10px] text-muted-foreground mb-1">随机属性加成</div>
                            <div className="text-xs text-cyan-300">
                              随机提升 {extra.randomAttrs.map(a =>
                                a === 'attack' ? '攻击' : a === 'defense' ? '防御' :
                                a === 'speed' ? '速度' : a === 'spirit' ? '精神' : '气血'
                              ).join('/')} 之一（0.5%~3%）
                            </div>
                          </div>
                        )}
                         {/* 仙草/灵草 固定数值加成 + 修炼方向加成 + 特殊效果（ice-fire-immortal / immortal / holy-grass / sacred-dragon） */}
                         {((extra.subType === 'ice-fire-immortal' || extra.subType === 'immortal' || extra.subType === 'holy-grass' || extra.subType === 'sacred-dragon') &&
                           (extra.fixedBonus && Object.values(extra.fixedBonus).some(v => v && v > 0) ||
                            extra.cultivationBonus && extra.cultivationBonus > 0 ||
                            extra.specialEffect)) && (
                          <div className="pt-2 mt-2 border-t border-emerald-500/10 space-y-1">
                            <div className="text-[10px] text-muted-foreground mb-1">服用效果</div>
                           {extra.fixedBonus?.attack !== undefined && extra.fixedBonus.attack > 0 && (
                             <div className="flex justify-between text-xs">
                               <span className="text-muted-foreground">攻击</span>
                               <span className="text-red-400 font-medium">+{formatNumber(Number(extra.fixedBonus.attack))}</span>
                             </div>
                           )}
                           {extra.fixedBonus?.defense !== undefined && extra.fixedBonus.defense > 0 && (
                             <div className="flex justify-between text-xs">
                               <span className="text-muted-foreground">防御</span>
                               <span className="text-blue-400 font-medium">+{formatNumber(Number(extra.fixedBonus.defense))}</span>
                             </div>
                           )}
                           {extra.fixedBonus?.speed !== undefined && extra.fixedBonus.speed > 0 && (
                             <div className="flex justify-between text-xs">
                               <span className="text-muted-foreground">速度</span>
                               <span className="text-green-400 font-medium">+{formatNumber(Number(extra.fixedBonus.speed))}</span>
                             </div>
                           )}
                           {extra.fixedBonus?.spirit !== undefined && extra.fixedBonus.spirit > 0 && (
                             <div className="flex justify-between text-xs">
                               <span className="text-muted-foreground">精神</span>
                               <span className="text-cyan-300 font-medium">+{formatNumber(Number(extra.fixedBonus.spirit))}</span>
                             </div>
                           )}
                           {extra.fixedBonus?.hp !== undefined && extra.fixedBonus.hp > 0 && (
                             <div className="flex justify-between text-xs">
                               <span className="text-muted-foreground">气血</span>
                               <span className="text-pink-400 font-medium">+{formatNumber(Number(extra.fixedBonus.hp))}</span>
                             </div>
                           )}
                           {extra.fixedBonus?.allAttr !== undefined && extra.fixedBonus.allAttr > 0 && (
                             <div className="flex justify-between text-xs">
                               <span className="text-muted-foreground">全属性</span>
                               <span className="text-amber-300 font-medium">+{formatNumber(Number(extra.fixedBonus.allAttr))}</span>
                             </div>
                           )}
                           {extra.cultivationBonus && extra.cultivationBonus > 0 && (
                             <div className="flex justify-between text-xs">
                               <span className="text-muted-foreground">修炼方向属性</span>
                               <span className="text-purple-300 font-medium">+{formatNumber(Number(extra.cultivationBonus))}</span>
                             </div>
                           )}
                           {extra.specialEffect === 'evolve-ice' && (
                             <div className="text-xs text-cyan-300 pt-1">
                               ✨ 冰属性武魂进化为极致之冰
                             </div>
                           )}
                           {extra.specialEffect === 'evolve-fire' && (
                             <div className="text-xs text-orange-300 pt-1">
                               ✨ 火属性武魂进化为极致之火
                             </div>
                           )}
                           {extra.specialEffect === 'evolve-tulip' && (
                              <div className="text-xs text-yellow-300 pt-1">
                                ✨ 七宝琉璃塔进化为九宝琉璃塔
                              </div>
                            )}
                            {extra.specialEffect === 'evolve-shenglong' && (
                              <div className="text-xs text-amber-300 pt-1">
                                ✨ 罗三炮进化为耀阳圣龙（神级）
                              </div>
                            )}
                         </div>
                       )}
                    </div>
                  );
                 })()}  
               </div>
            </motion.div>
          </motion.div>
         )}
       </AnimatePresence>

       {/* 魂骨出售确认弹窗 */}
       <AlertDialog open={!!boneSellConfirmItem} onOpenChange={(open) => !open && setBoneSellConfirmItem(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>确认出售魂骨？</AlertDialogTitle>
             <AlertDialogDescription>
               确定要出售 <span className="text-amber-300 font-medium">{boneSellConfirmItem?.name}</span> 吗？
               出售后将获得 <span className="text-amber-300 font-medium">{formatNumber(boneSellConfirmItem?.sellPrice ?? 0)} 魂币</span>，魂骨无法恢复。
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>取消</AlertDialogCancel>
             <AlertDialogAction onClick={confirmSellBone} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
               确认出售
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
        </AlertDialog>
      </div>
    );
}

interface SoulBoneCompareProps {
  equipped: IItem;
  candidate: IItem;
}

function SoulBoneCompare({ equipped, candidate }: SoulBoneCompareProps) {
  const attrs = ['attack', 'defense', 'speed', 'spirit', 'hp'] as const;
  const labelMap: Record<string, string> = {
    attack: '攻击', defense: '防御', speed: '速度', spirit: '精神', hp: '气血',
  };

  const eqYears = equipped.soulBoneYears ?? 0;
  const newYears = candidate.soulBoneYears ?? 0;
  const yearDiff = newYears - eqYears;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-900/10 to-card/50 p-3 mb-4">
      <div className="text-xs font-semibold text-amber-400 mb-3 flex items-center gap-1.5">
        <Scale className="h-3.5 w-3.5" />
        魂骨属性对比
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground mb-1.5">当前装备</div>
          <div
            className="mx-auto w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold border-2 mb-1"
            style={{
              borderColor: QUALITY_COLOR[equipped.quality as keyof typeof QUALITY_COLOR],
              backgroundColor: QUALITY_COLOR[equipped.quality as keyof typeof QUALITY_COLOR] + '15',
              color: QUALITY_COLOR[equipped.quality as keyof typeof QUALITY_COLOR],
            }}
          >
            {equipped.iconChar}
          </div>
          <div className="text-[11px] font-medium text-foreground truncate w-full">{equipped.name}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-amber-400 mb-1.5 font-medium">候选（背包中）</div>
          <div
            className="mx-auto w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold border-2 mb-1 ring-2 ring-amber-500/40 ring-offset-2 ring-offset-card"
            style={{
              borderColor: QUALITY_COLOR[candidate.quality as keyof typeof QUALITY_COLOR],
              backgroundColor: QUALITY_COLOR[candidate.quality as keyof typeof QUALITY_COLOR] + '15',
              color: QUALITY_COLOR[candidate.quality as keyof typeof QUALITY_COLOR],
            }}
          >
            {candidate.iconChar}
          </div>
          <div className="text-[11px] font-bold text-foreground truncate w-full">{candidate.name}</div>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-amber-500/20 space-y-1.5">
        {attrs.map((attr) => {
          const eqVal = (equipped.attributes?.[attr] as number) || 0;
          const newVal = (candidate.attributes?.[attr] as number) || 0;
          if (eqVal === 0 && newVal === 0) return null;
          const diff = newVal - eqVal;
          return (
            <div key={attr} className="grid grid-cols-3 text-[11px] items-center">
              <span className="text-muted-foreground">{labelMap[attr]}</span>
              <span className="text-center text-foreground tabular-nums">{formatNumber(eqVal)}</span>
              <span
                className={`text-right tabular-nums font-medium ${
                  diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-muted-foreground'
                }`}
              >
                {diff > 0 ? `↑ +${formatNumber(diff)}` : diff < 0 ? `↓ ${formatNumber(diff)}` : '—'}
              </span>
            </div>
          );
        })}
        {(equipped.soulBoneYears !== undefined || candidate.soulBoneYears !== undefined) && (
          <div className="grid grid-cols-3 text-[11px] items-center pt-1.5 border-t border-amber-500/10">
            <span className="text-muted-foreground">魂骨年限</span>
            <span className="text-center text-foreground tabular-nums">{formatNumber(eqYears)} 年</span>
            <span
              className={`text-right tabular-nums font-medium ${
                yearDiff > 0 ? 'text-emerald-400' : yearDiff < 0 ? 'text-red-400' : 'text-muted-foreground'
              }`}
            >
              {yearDiff > 0 ? `↑ +${formatNumber(yearDiff)} 年` : yearDiff < 0 ? `↓ ${formatNumber(yearDiff)} 年` : '—'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

