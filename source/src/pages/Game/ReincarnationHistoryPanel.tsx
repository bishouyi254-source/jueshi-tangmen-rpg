import {formatNumber} from '@/lib/utils';
import ShadowComparison from '@/components/ShadowComparison';
import {PublicLoadout} from './PublicGrowthPanel';
import {__localBuildShadow} from '@/lib/shadow';
import {toast} from 'sonner';
import { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronLeft, Swords, Shield, Zap, Heart,
  Brain, Star, X, Award, Crown, Gem, Package, Clock,
} from 'lucide-react';
import { useGame, QUALITY_LABEL, QUALITY_COLOR } from '@/lib/gameStore';
import type { IReincarnationOrb } from '@/lib/gameStore';
import type { IItem } from '@/data/items';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const MAX_REINCARNATION = 99;

interface ReincarnationHistoryPanelProps {
  onClose: () => void;
  externalOrbs?: IReincarnationOrb[];
  readOnly?: boolean;
  currentView?: boolean;
  title?: string;
}

export default memo(function ReincarnationHistoryPanel({ onClose, externalOrbs, readOnly = false, currentView = false, title = '轮回史鉴' }: ReincarnationHistoryPanelProps) {
  const { getReincarnationOrbs,startBattle,attributes } = useGame();
  const orbs = externalOrbs ?? getReincarnationOrbs();
  const [searchIndex, setSearchIndex] = useState('');
  const [selectedOrb, setSelectedOrb] = useState<IReincarnationOrb | null>(currentView ? orbs[0] ?? null : null);

  const filteredOrbs = useMemo(() => {
    if (!searchIndex.trim()) return orbs;
    const idx = parseInt(searchIndex, 10);
    if (isNaN(idx)) return orbs;
    return orbs.filter((o) => o.index === idx);
  }, [orbs, searchIndex]);

  const sortedOrbs = useMemo(
    () => [...filteredOrbs].sort((a, b) => b.index - a.index),
    [filteredOrbs],
  );

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-bold">{title}</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="number"
          placeholder="搜索第几世（输入数字快速定位）"
          value={searchIndex}
          onChange={(e) => setSearchIndex(e.target.value)}
          className="pl-9"
          min={1}
          max={MAX_REINCARNATION}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
          {currentView ? '今生' : `共 ${orbs.length} 世`}
        </div>
      </div>

      {/* 轮回球列表 */}
      <div className="max-h-[480px] md:max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
        {sortedOrbs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            {searchIndex ? `未找到第 ${searchIndex} 世的记录` : '尚无轮回史迹'}
          </div>
        ) : (
          <div className="space-y-1.5">
            {sortedOrbs.map((orb, i) => {
              // 战力公式与角色页保持一致：(攻击+防御+速度+精神+气血+暴击率*100+爆伤*50+魂力) * 0.5
              const base = orb.attributes.attack + orb.attributes.defense + orb.attributes.speed + orb.attributes.spirit + orb.attributes.hp;
              const critVal = (orb.attributes.critRate || 0) * 100 + (orb.attributes.critDmg || 0) * 50;
              const soulVal = orb.attributes.maxSoulPower || 0;
               const power = Math.round((base + critVal + soulVal) * 0.5);
               const powerDisplay=formatNumber(power);
               const showUnit=null;
              return (
                <motion.button
                  key={orb.index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  whileHover={{ x: 2 }}
                  onClick={() => setSelectedOrb(orb)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border/40 bg-card/30 hover:border-purple-500/40 hover:bg-purple-900/15 transition-all text-left flex items-center gap-3 group"
                >
                  <div className="relative w-10 h-10 shrink-0">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 via-indigo-500/20 to-cyan-500/30" />
                    <div className="absolute inset-1 rounded-full bg-gradient-to-br from-purple-900 to-indigo-950 flex items-center justify-center">
                      <span className="text-[13px] font-bold text-yellow-300 tabular-nums">
                        {orb.index}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm truncate">{orb.name}</span>
                      {orb.isTwinSoul && (
                        <span className="text-[9px] px-1 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 shrink-0">
                          双生
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <span>{orb.realm}</span>
                      <span className="text-border/60">·</span>
                      <span>{orb.level}级</span>
                      <span className="text-border/60 hidden sm:inline">·</span>
                      <span className="hidden sm:inline truncate">{orb.direction}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                     <div className="text-sm font-bold text-yellow-300 tabular-nums">
                       {powerDisplay}
                       {showUnit && (
                         <span className="text-[10px] font-normal text-muted-foreground ml-0.5">{showUnit}</span>
                       )}
                     </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
                      <Gem className="h-2.5 w-2.5" />
                      {orb.inventoryCount ?? orb.inventory?.length ?? 0}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* 轮回球详情弹窗 */}
      <AnimatePresence>
        {selectedOrb && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={readOnly && currentView?'relative':'fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4'}
            onClick={() => setSelectedOrb(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={readOnly && currentView?'w-full rounded-xl border border-border/40 bg-card/40 p-4':'w-full max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border border-purple-500/40 bg-gradient-to-b from-purple-950/95 to-indigo-950/95 p-5 shadow-2xl'}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedOrb(null)}>
                    <ChevronLeft className="h-4 w-4" />
                    返回
                  </Button>
                </div>
                <Badge variant="outline" className="border-yellow-500/50 text-yellow-300">
                  {currentView ? '当前角色' : `第 ${selectedOrb.index} 世`}
                </Badge>
              </div>

              {/* 头部：轮回球 + 基本信息 */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-20 h-20 shrink-0">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/50 via-indigo-500/30 to-cyan-500/50" />
                  <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-purple-900 to-indigo-950 flex items-center justify-center">
                    <span className="text-xl font-bold text-yellow-300">{selectedOrb.index}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-lg font-bold truncate">{selectedOrb.name}</div>
                    {selectedOrb.isTwinSoul && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 shrink-0">
                        双生武魂
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm mb-1">
                    <span className="text-yellow-300 font-semibold">{selectedOrb.realm}</span>
                    <span className="text-border/50">·</span>
                    <span>{selectedOrb.level} 级</span>
                    <span className="text-border/50 hidden sm:inline">·</span>
                    <span className="hidden sm:inline truncate text-muted-foreground">
                      {selectedOrb.direction}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(selectedOrb.timestamp).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Crown className="h-3 w-3 text-amber-400/70" />
                      招募 {selectedOrb.recruitedCount} 人
                    </span>
                  </div>
                </div>
              </div>

            {readOnly && <div className="mb-3"><PublicLoadout orb={selectedOrb}/></div>}
            {!readOnly && <><ShadowComparison orb={selectedOrb} current={attributes}/>
            <button className="w-full mb-3 rounded-lg p-3 bg-purple-700" onClick={()=>{try{const cfg=__localBuildShadow(selectedOrb);cfg.meta.shadowOrb=selectedOrb;cfg.meta.expReward=Math.max(1000,selectedOrb.level**2*20);cfg.meta.coinReward=Math.max(500,selectedOrb.level*500);onClose();startBattle(cfg);}catch(err){toast.error(err.message);}}}>挑战轮回之影 · 第{selectedOrb.index}世</button></>}
              {/* 五维属性 */}
              <div className="rounded-lg border border-border/50 bg-black/30 p-3 mb-3">
                <div className="flex items-center gap-1.5 text-xs text-yellow-300 mb-2">
                  <Award className="h-3.5 w-3.5" />
                  <span className="font-semibold">{currentView ? '当前属性' : '最终属性'}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 text-center">
                  <div className="rounded-md bg-black/20 py-2">
                    <div className="text-[10px] text-muted-foreground mb-0.5">攻击</div>
                    <div className="text-sm font-semibold text-red-300 tabular-nums">
                      {formatNumber(selectedOrb.attributes.attack)}
                    </div>
                  </div>
                  <div className="rounded-md bg-black/20 py-2">
                    <div className="text-[10px] text-muted-foreground mb-0.5">防御</div>
                    <div className="text-sm font-semibold text-blue-300 tabular-nums">
                      {formatNumber(selectedOrb.attributes.defense)}
                    </div>
                  </div>
                  <div className="rounded-md bg-black/20 py-2">
                    <div className="text-[10px] text-muted-foreground mb-0.5">速度</div>
                    <div className="text-sm font-semibold text-yellow-300 tabular-nums">
                      {formatNumber(selectedOrb.attributes.speed)}
                    </div>
                  </div>
                  <div className="rounded-md bg-black/20 py-2">
                    <div className="text-[10px] text-muted-foreground mb-0.5">精神</div>
                    <div className="text-sm font-semibold text-purple-300 tabular-nums">
                      {formatNumber(selectedOrb.attributes.spirit)}
                    </div>
                  </div>
                  <div className="rounded-md bg-black/20 py-2">
                    <div className="text-[10px] text-muted-foreground mb-0.5">气血</div>
                    <div className="text-sm font-semibold text-pink-300 tabular-nums">
                      {formatNumber(selectedOrb.attributes.hp)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 武魂信息 */}
              <div className="space-y-2 mb-3">
                <div className="rounded-lg border border-border/50 bg-black/30 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-muted-foreground mb-0.5">主修武魂</div>
                      <div
                        className="font-semibold truncate"
                        style={{
                          color:
                            (QUALITY_COLOR[selectedOrb.martialSoul.quality] as string) ||
                            undefined,
                        }}
                      >
                        {selectedOrb.martialSoul.name}
                      </div>
                    </div>
                    <div className="shrink-0 text-right ml-2">
                      <div className="text-xs font-semibold text-cyan-300">
                        {selectedOrb.soulRings.length} 环
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-muted-foreground truncate max-w-[50%]">
                      {selectedOrb.martialSoul.type}
                    </span>
                    <span
                      className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold"
                      style={{
                        background: `${(QUALITY_COLOR[selectedOrb.martialSoul.quality] as string) || '#9ca3af'}20`,
                        color:
                          (QUALITY_COLOR[selectedOrb.martialSoul.quality] as string) || '#9ca3af',
                        border: `1px solid ${(QUALITY_COLOR[selectedOrb.martialSoul.quality] as string) || '#9ca3af'}40`,
                      }}
                    >
                      {QUALITY_LABEL[selectedOrb.martialSoul.quality] ||
                        selectedOrb.martialSoul.quality}
                    </span>
                  </div>
                </div>
                {selectedOrb.isTwinSoul && selectedOrb.secondSoul && (
                  <div className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-950/10 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-fuchsia-400/80 mb-0.5">第二武魂</div>
                        <div
                          className="font-semibold truncate"
                          style={{
                            color:
                              (QUALITY_COLOR[selectedOrb.secondSoul.quality] as string) ||
                              undefined,
                          }}
                        >
                          {selectedOrb.secondSoul.name}
                        </div>
                      </div>
                      <div className="shrink-0 text-right ml-2">
                        <div className="text-xs font-semibold text-fuchsia-300">
                          {selectedOrb.secondSoulRings.length} 环
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-muted-foreground truncate max-w-[50%]">
                        {selectedOrb.secondSoul.type}
                      </span>
                      <span
                        className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold"
                        style={{
                          background: `${(QUALITY_COLOR[selectedOrb.secondSoul.quality] as string) || '#9ca3af'}20`,
                          color:
                            (QUALITY_COLOR[selectedOrb.secondSoul.quality] as string) || '#9ca3af',
                          border: `1px solid ${(QUALITY_COLOR[selectedOrb.secondSoul.quality] as string) || '#9ca3af'}40`,
                        }}
                      >
                        {QUALITY_LABEL[selectedOrb.secondSoul.quality] ||
                          selectedOrb.secondSoul.quality}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 成就概览 */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="rounded-lg bg-black/30 p-2 text-center">
                  <Zap className="h-4 w-4 text-purple-300 mx-auto mb-0.5" />
                  <div className="text-[10px] text-muted-foreground">魂骨</div>
                  <div className="font-semibold text-sm tabular-nums">
                    {Object.values(selectedOrb.soulBones).filter((v) => v !== null).length}/7
                  </div>
                </div>
                <div className="rounded-lg bg-black/30 p-2 text-center">
                  <Gem className="h-4 w-4 text-cyan-300 mx-auto mb-0.5" />
                  <div className="text-[10px] text-muted-foreground">魂灵</div>
                  <div className="font-semibold text-sm tabular-nums">
                    {selectedOrb.soulSpirits?.length ?? 0}
                  </div>
                </div>
                <div className="rounded-lg bg-black/30 p-2 text-center">
                  <Swords className="h-4 w-4 text-orange-300 mx-auto mb-0.5" />
                  <div className="text-[10px] text-muted-foreground">队伍</div>
                  <div className="font-semibold text-sm tabular-nums">{selectedOrb.teamCount}人</div>
                </div>
                <div className="rounded-lg bg-black/30 p-2 text-center">
                  <Shield className="h-4 w-4 text-yellow-400 mx-auto mb-0.5" />
                  <div className="text-[10px] text-muted-foreground">魂币</div>
                  <div className="font-semibold text-sm tabular-nums">
                    {formatNumber(selectedOrb.soulCoins)}
                  </div>
                </div>
              </div>

              {/* 背包物品详情 */}
              <OrbInventorySection orb={selectedOrb} />

              {/* 特殊成就 */}
              <div className="space-y-2">
                {selectedOrb.domainName && (
                  <div className="rounded-lg border border-purple-500/30 bg-purple-900/20 p-2.5 flex items-center gap-2.5">
                    <Star className="h-4 w-4 text-purple-300 shrink-0" />
                    <div>
                      <div className="text-[10px] text-purple-300/80">领域</div>
                      <div className="text-sm font-semibold text-purple-200">
                        {selectedOrb.domainName}
                      </div>
                    </div>
                  </div>
                )}
                {selectedOrb.divineTrialName && (
                  <div className="rounded-lg border border-yellow-500/30 bg-yellow-900/20 p-2.5 flex items-center gap-2.5">
                    <Star className="h-4 w-4 text-yellow-300 shrink-0" />
                    <div>
                      <div className="text-[10px] text-yellow-300/80">神考传承</div>
                      <div className="text-sm font-semibold text-yellow-200">
                        {selectedOrb.divineTrialName}
                      </div>
                    </div>
                  </div>
                )}
                {!selectedOrb.domainName && !selectedOrb.divineTrialName && (
                  <div className="rounded-lg border border-border/40 bg-black/20 p-3 text-center text-[11px] text-muted-foreground">
                    此世尚未传承神考与领悟领域
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

interface OrbInventorySectionProps {
  orb: IReincarnationOrb;
}

const INV_TABS: Array<{ key: 'all' | IItem['type']; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'soulBone', label: '魂骨' },
  { key: 'soulGuide', label: '魂导器' },
  { key: 'consumable', label: '消耗品' },
  { key: 'material', label: '材料' },
  { key: 'special', label: '特殊' },
];

const TYPE_LABEL: Record<string, string> = {
  soulBone: '魂骨',
  soulGuide: '魂导器',
  consumable: '消耗品',
  material: '材料',
  special: '特殊',
};

function OrbInventorySection({ orb }: OrbInventorySectionProps) {
  const [tab, setTab] = useState<'all' | IItem['type']>('all');
  const [detailItem, setDetailItem] = useState<IItem | null>(null);

  const items = orb.inventory || [];

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    for (const item of items) {
      counts[item.type] = (counts[item.type] || 0) + 1;
    }
    return counts;
  }, [items]);

  const filtered = useMemo(() => {
    if (tab === 'all') return items;
    return items.filter((i) => i.type === tab);
  }, [items, tab]);

  const getItemColor = (item: IItem) => {
    const base = QUALITY_COLOR[item.quality as keyof typeof QUALITY_COLOR] || '#9ca3af';
    return {
      border: `${base}80`,
      bg: `${base}10`,
      text: base,
      shadow: `0 0 6px ${base}20`,
    };
  };

  const getQualityLabel = (item: IItem) => {
    return QUALITY_LABEL[item.quality as keyof typeof QUALITY_LABEL] || item.quality;
  };

  return (
    <div className="rounded-lg border border-border/50 bg-black/30 p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs text-yellow-300">
          <Package className="h-3.5 w-3.5" />
          <span className="font-semibold">背包物品</span>
        </div>
        <span className="text-[11px] text-muted-foreground">共 {items.length} 件</span>
      </div>

      {/* 分类 Tab */}
      <div className="flex gap-1 mb-2.5 overflow-x-auto custom-scrollbar">
        {INV_TABS.map((t) => {
          const count = typeCounts[t.key] || 0;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 px-2 py-1 rounded-md text-[11px] transition-colors ${
                active
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                  : 'bg-card/30 text-muted-foreground border border-border/30 hover:border-border/60'
              }`}
            >
              {t.label}
              <span
                className={`ml-1 text-[10px] ${active ? 'text-yellow-200' : 'text-muted-foreground/70'}`}
              >
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* 物品网格 */}
      {filtered.length === 0 ? (
        <div className="text-center py-5 text-[11px] text-muted-foreground">
          此世未收集此类物品
        </div>
      ) : (
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5">
          {filtered.map((item, idx) => {
            const c = getItemColor(item);
            return (
              <button
                key={`${item.id}-${idx}`}
                onClick={() => setDetailItem(item)}
                className="relative aspect-square rounded-lg border flex flex-col items-center justify-center p-0.5 transition-transform hover:scale-105 active:scale-95"
                style={{ borderColor: c.border, background: c.bg, boxShadow: c.shadow }}
                title={item.name}
              >
                <div
                  className="text-base font-bold leading-none"
                  style={{ color: c.text }}
                >
                  {item.iconChar}
                </div>
                {item.quantity && item.quantity > 1 && (
                  <span className="absolute bottom-0 right-0.5 text-[9px] font-bold text-yellow-200 leading-none">
                    {item.quantity > 99 ? '99+' : item.quantity}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 物品详情弹窗 */}
      <AnimatePresence>
        {detailItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4"
            onClick={() => setDetailItem(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl border border-purple-500/40 bg-gradient-to-b from-purple-950/95 to-indigo-950/95 p-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 shrink-0 rounded-xl border flex items-center justify-center text-xl font-bold"
                  style={{
                    borderColor: getItemColor(detailItem).border,
                    background: getItemColor(detailItem).bg,
                    color: getItemColor(detailItem).text,
                  }}
                >
                  {detailItem.iconChar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{detailItem.name}</div>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    <span
                      className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold"
                      style={{
                        background: `${getItemColor(detailItem).text}20`,
                        color: getItemColor(detailItem).text,
                        border: `1px solid ${getItemColor(detailItem).text}50`,
                      }}
                    >
                      {getQualityLabel(detailItem)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {TYPE_LABEL[detailItem.type] || detailItem.type}
                    </span>
                    {detailItem.quantity && detailItem.quantity > 1 && (
                      <span className="text-[10px] text-yellow-300">×{detailItem.quantity}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border/40 bg-black/30 p-3 space-y-2 text-[12px]">
                <div className="text-muted-foreground leading-relaxed text-[11px]">
                  {detailItem.description}
                </div>
                {detailItem.effect && (
                  <div className="text-cyan-300/90 text-[11px] pt-1.5 border-t border-border/30">
                    <span className="text-muted-foreground">效果：</span>
                    {detailItem.effect}
                  </div>
                )}
                {detailItem.attributes &&
                  Object.keys(detailItem.attributes).length > 0 && (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1.5 border-t border-border/30 text-[11px]">
                      {detailItem.attributes.attack !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">攻击</span>
                          <span className="text-red-300 font-semibold tabular-nums">
                            +{detailItem.attributes.attack}
                          </span>
                        </div>
                      )}
                      {detailItem.attributes.defense !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">防御</span>
                          <span className="text-blue-300 font-semibold tabular-nums">
                            +{detailItem.attributes.defense}
                          </span>
                        </div>
                      )}
                      {detailItem.attributes.speed !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">速度</span>
                          <span className="text-yellow-300 font-semibold tabular-nums">
                            +{detailItem.attributes.speed}
                          </span>
                        </div>
                      )}
                      {detailItem.attributes.spirit !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">精神</span>
                          <span className="text-purple-300 font-semibold tabular-nums">
                            +{detailItem.attributes.spirit}
                          </span>
                        </div>
                      )}
                      {detailItem.attributes.hp !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">气血</span>
                          <span className="text-pink-300 font-semibold tabular-nums">
                            +{detailItem.attributes.hp}
                          </span>
                        </div>
                      )}
                      {detailItem.attributes.critRate !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">暴击率</span>
                          <span className="text-orange-300 font-semibold tabular-nums">
                            +{detailItem.attributes.critRate}%
                          </span>
                        </div>
                      )}
                      {detailItem.attributes.critDmg !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">爆伤</span>
                          <span className="text-orange-300 font-semibold tabular-nums">
                            +{detailItem.attributes.critDmg}%
                          </span>
                        </div>
                      )}
                      {detailItem.attributes.allAttr !== undefined && (
                        <div className="flex justify-between col-span-2">
                          <span className="text-muted-foreground">全属性</span>
                          <span className="text-amber-300 font-semibold tabular-nums">
                            +{detailItem.attributes.allAttr}%
                          </span>
                        </div>
                      )}
                      {detailItem.attributes.soulPower !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">最大魂力</span>
                          <span className="text-cyan-300 font-semibold tabular-nums">
                            +{detailItem.attributes.soulPower}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={() => setDetailItem(null)}
              >
                关闭
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
