import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CircleDot, Clock, Trash2, AlertTriangle, CheckCircle2, X, Sparkles, Info,
} from 'lucide-react';
import RingDetailDialog from '@/components/RingDetailDialog';
import {
  useGame,
  calcAttributes,
  getMaxRings,
  getRequiredLevelForRing,
  calcAbsorbSuccessRate,
  getRingGuaranteedYears,
  getSecondSoulMaxYears,
  getSecondSoulGuaranteedYears,
  getSecondSoulRingLimits,
  getSecondSoulMaxRingCount,
  isRingSlotUnlimited,
  calcSecondSoulAbsorbSuccessRate,
  isBottleneck,
  RING_COLOR_MAP, RING_DISPLAY_COLOR, RING_ABSORPTION_RULES,
  type IPendingSoulRing,
} from '@/lib/gameStore';
import { toast } from 'sonner';
import SoulRing from '@/components/SoulRing';
import { getBeastSpeciesByName, getDangerLevel } from '@/data/soulbeasts';

// 灰色空槽圆环
function EmptyRingSlot({ size = 56, label }: { size?: number; label?: string }) {
  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <div
        className="rounded-full border-2 border-dashed"
        style={{
          width: size,
          height: size,
          borderColor: 'rgba(148,163,184,0.25)',
        }}
      />
      <div
        className="absolute rounded-full border border-dashed"
        style={{
          width: size * 0.6,
          height: size * 0.6,
          borderColor: 'rgba(148,163,184,0.12)',
        }}
      />
      {label && (
        <span className="absolute text-[9px] text-muted-foreground/50">{label}</span>
      )}
    </div>
  );
}

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return '已消散';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

interface SoulRingPanelProps {
  onBack?: () => void;
}

export default function SoulRingPanel({ onBack }: SoulRingPanelProps) {
  const { player, absorbPendingRing, discardPendingRing, cleanupExpiredRings } = useGame();
  const [soulTab, setSoulTab] = useState<0 | 1>(0); // 0=主修武魂, 1=次修武魂
  const [selectedRingId, setSelectedRingId] = useState<string | null>(null);
  const [absorbingRingId, setAbsorbingRingId] = useState<string | null>(null);
  const [absorbResult, setAbsorbResult] = useState<'success' | 'fail' | null>(null);
  const absorbTimerRef = useRef<number | null>(null);
  const [detailAbsorbedIndex, setDetailAbsorbedIndex] = useState<number | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      cleanupExpiredRings();
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cleanupExpiredRings]);

  const attrs = useMemo(() => (player ? calcAttributes(player) : null), [player]);
  const maxRings = player ? getMaxRings(player.level) : 0;
  // 第二武魂魂环数量上限：按境界决定（与 getSecondSoulMaxRingCount 一致）
  const secondMaxRings = player ? getSecondSoulMaxRingCount(player.level) : 0;
  const secondRingLimits = getSecondSoulRingLimits(player.level);

  if (!player || !attrs) return null;

  const isTwin = player.isTwinSoul && player.secondSoul;
  const currentSoulName = soulTab === 0 ? player.martialSoul.name : player.secondSoul!.name;
  const currentSoulRings = soulTab === 0 ? player.soulRings : (player.secondSoulRings ?? []);
  const currentMaxRings = soulTab === 0 ? maxRings : secondMaxRings;

  // 第二武魂年限上限（随境界叠加）
  const secondSoulMaxYears = getSecondSoulMaxYears(player.level);

  const selectedRing = player.pendingSoulRings.find((r) => r.id === selectedRingId) || null;
  const absorbedCount = currentSoulRings.length;
  const nextSlotIndex = absorbedCount;
  const nextRequiredLevel = getRequiredLevelForRing(nextSlotIndex);
  // 第一武魂：需达到对应等级且在最大魂环数内
  // 第二武魂：需下一环等级要求满足且在第二武魂数量上限内
  const canAbsorbNext =
    soulTab === 0
      ? (player.level >= nextRequiredLevel && nextSlotIndex < maxRings && nextSlotIndex < 9)
      : (nextSlotIndex < secondMaxRings && nextSlotIndex < 9);

  // 第二武魂：下一环是否因等级限制而锁定（用于展示锁定状态）
  const secondSlotLocked = (slotIdx: number) => soulTab === 1 && slotIdx >= secondMaxRings;

  // 成功率计算（基于选中的魂环和下一个槽位 + 轮回加成）
  const ringBonus = player?.reincarnation?.totalRingYearBonus ?? 0;
  const ringBonusPct = player?.reincarnation?.ringYearBonusPct ?? 0;
  const absorbSuccessRate =
    selectedRing && canAbsorbNext
      ? (soulTab === 1
          ? calcSecondSoulAbsorbSuccessRate(player.level, selectedRing.years ?? 0, nextSlotIndex, ringBonus, ringBonusPct)
          : calcAbsorbSuccessRate(nextSlotIndex, selectedRing.years ?? 0, ringBonus, ringBonusPct))
      : 0;
   const guaranteedYears =
     selectedRing && canAbsorbNext
       ? (soulTab === 1
           ? getSecondSoulGuaranteedYears(player.level, nextSlotIndex, ringBonus, ringBonusPct)
           : getRingGuaranteedYears(nextSlotIndex, ringBonus, ringBonusPct))
       : 0;
  const isUnlimitedSlot = soulTab === 1
    ? (player.level >= 90 && nextSlotIndex < 9)
    : isRingSlotUnlimited(nextSlotIndex);
  const isGuaranteed = absorbSuccessRate >= 100;
  // 按该槽位的计算单位四舍五入后展示年限
  function formatRoundedYears(years: number, slotIdx: number): number {
    const steps = [100, 100, 100, 1000, 1000, 1000, 10000, 10000, 20000];
    const unit = steps[slotIdx] ?? 100;
    return Math.round(years / unit) * unit;
  }

  const handleAbsorb = () => {
    if (!selectedRing) return;
    if (!canAbsorbNext) {
      toast.warning(`需达到 ${nextRequiredLevel} 级才能吸收第 ${nextSlotIndex + 1} 魂环`);
      return;
    }
    setAbsorbingRingId(selectedRing.id);
    setAbsorbResult(null);
    if (absorbTimerRef.current) clearTimeout(absorbTimerRef.current);
    absorbTimerRef.current = window.setTimeout(() => {
      const result = absorbPendingRing(selectedRing.id, nextSlotIndex, soulTab);
      const soulName = soulTab === 0 ? player.martialSoul.name : player.secondSoul!.name;
      if (result.success) {
        setAbsorbResult('success');
        toast.success(`✨ ${soulName}成功吸收第 ${nextSlotIndex + 1} 魂环！`);
        absorbTimerRef.current = window.setTimeout(() => {
          setSelectedRingId(null);
          setAbsorbingRingId(null);
          setAbsorbResult(null);
          absorbTimerRef.current = null;
        }, 800);
       } else {
         setAbsorbResult('fail');
         if (soulTab === 1) {
           toast.error('吸收失败！第二武魂承受不住，魂环已消散');
         } else {
           toast.error('吸收失败，魂环已消散');
         }
        absorbTimerRef.current = window.setTimeout(() => {
          setSelectedRingId(null);
          setAbsorbingRingId(null);
          setAbsorbResult(null);
          absorbTimerRef.current = null;
        }, 1200);
      }
    }, 1300);
  };

  const handleDiscard = (ringId: string) => {
    discardPendingRing(ringId);
    if (selectedRingId === ringId) setSelectedRingId(null);
    toast.info('魂环已销毁');
  };

  return (
    <div className="p-3 md:p-5 pb-4 space-y-4 md:space-y-6">
      <div className="flex items-center gap-2">
        <CircleDot className="h-5 w-5 text-primary" />
        <h2 className="text-lg md:text-xl font-bold text-foreground">魂环</h2>
      </div>

      {/* 双武魂切换标签 */}
      {isTwin && (
        <div className="flex gap-1 p-1 rounded-xl bg-card/40 border border-border/30">
          <button
            onClick={() => setSoulTab(0)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              soulTab === 0
                ? 'bg-cyan-800/50 text-cyan-300 border border-cyan-500/40'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            主修武魂 · {player.martialSoul.name}
          </button>
          <button
            onClick={() => setSoulTab(1)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all relative ${
              soulTab === 1
                ? 'bg-purple-900/40 text-purple-400 border border-purple-500/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            次修武魂 · {player.secondSoul!.name}
          </button>
        </div>
      )}

      {/* 魂环槽位展示 - 竖直排列的真正圆环 */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-card/75 backdrop-blur-sm p-4 text-foreground">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            {soulTab === 0 ? '主修' : '次修'}魂环槽位
          </h3>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>已吸收 {absorbedCount}/{currentMaxRings}</span>
            {soulTab === 1 && isFinite(secondSoulMaxYears) && (
              <span className="text-amber-400/80">上限 {secondSoulMaxYears >= 10000 ? `${(secondSoulMaxYears/10000).toFixed(1)}万年` : `${secondSoulMaxYears}年`}</span>
            )}
            {soulTab === 1 && !isFinite(secondSoulMaxYears) && (
              <span className="text-emerald-400/80">无上限</span>
            )}
          </div>
        </div>

        {/* 竖直排列的魂环圆环阵列 - 间隔明显，方便数清数量 */}
        <div className="relative flex flex-col items-center py-3 gap-5">
          <div className="text-xs font-bold text-foreground/80 mb-1 tracking-widest">
            {currentSoulName}
          </div>
           {Array.from({ length: 9 }).map((_, i) => {
             const ring = currentSoulRings[i];
             const requiredLv = getRequiredLevelForRing(i);
             const mainUnlocked = player.level >= requiredLv;
             const secondUnlocked = i < secondMaxRings;
             const unlocked = soulTab === 0 ? mainUnlocked : secondUnlocked;
             const isNextSlot = i === absorbedCount && canAbsorbNext && selectedRing;
             const ringSize = 42 + i * 4; // 环数越靠下尺寸越大，整体缩小
             return (
              <div
                key={i}
                className="relative flex items-center justify-center"
                style={{ width: ringSize + 8, height: ringSize + 8 }}
              >
                {/* 左侧序号 */}
                <span className="absolute -left-10 text-[10px] text-muted-foreground w-8 text-right">
                  第{i + 1}环
                </span>

                {ring ? (
                   <button
                     onClick={() => setDetailAbsorbedIndex(i)}
                     className="focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 rounded-full transition-transform hover:scale-105"
                     title={`第${i + 1}魂环 · ${ring.soulBeastName}`}
                   >
                      <SoulRing
                         color={ring.color}
                         years={ring.years}
                         beastAttribute={ring.beastAttribute}
                         size={ringSize}
                         animate
                         simpleMode
                       />
                   </button>
                 ) : isNextSlot ? (
                  <motion.div
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                  >
                    <EmptyRingSlot size={ringSize} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-cyan-400" />
                    </div>
                  </motion.div>
                ) : unlocked ? (
                  <EmptyRingSlot size={ringSize} label="空位" />
                ) : (
                  <div className="relative">
                    <EmptyRingSlot size={ringSize} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] text-muted-foreground/40">
                        {soulTab === 1
                          ? `${(i + 1) * 10}级`
                          : `${requiredLv}级`}
                      </span>
                    </div>
                  </div>
                )}

                {/* 右侧品质/状态 */}
                {ring ? (
                  <span
                    className="absolute -right-10 text-[10px] font-bold w-10 text-left"
                     style={{
                       color: RING_DISPLAY_COLOR[ring.color as keyof typeof RING_DISPLAY_COLOR],
                       textShadow: `0 0 6px ${RING_DISPLAY_COLOR[ring.color as keyof typeof RING_DISPLAY_COLOR]}80`,
                     }}
                   >
                     {ring.qualityLabel}
                   </span>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* 吸收状态提示 */}
        <div
          className="mt-3 rounded-lg p-2.5 text-[11px] flex items-start gap-2"
          style={{
            backgroundColor: canAbsorbNext ? 'rgba(251,191,36,0.08)' : 'rgba(239,68,68,0.06)',
            border: `1px solid ${canAbsorbNext ? 'rgba(251,191,36,0.3)' : 'rgba(239,68,68,0.25)'}`,
          }}
        >
          {canAbsorbNext ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-cyan-200 font-medium mb-0.5">
                  可吸收第 {nextSlotIndex + 1} 魂环
                </div>
                <div className="text-muted-foreground">从下方待吸收列表中选择魂环吸收</div>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-red-600 font-medium mb-0.5">
                  {absorbedCount >= 9 ? '魂环已满' : `下一环需达到 ${nextRequiredLevel} 级`}
                </div>
                <div className="text-muted-foreground leading-relaxed">
                  {absorbedCount >= 9
                    ? '已达到封号斗罗巅峰，恭喜！'
                    : '未吸收魂环时无法继续获得修为经验。'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 待吸收魂环列表 - 圆环样式 */}
      <div className="rounded-2xl border border-border/40 bg-card/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-cyan-400" />
            待吸收魂环
          </h3>
          <div className="text-xs text-muted-foreground">
            {player.pendingSoulRings.length} 个 · 3分钟倒计时
          </div>
        </div>

        {player.pendingSoulRings.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <CircleDot className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p>暂无待吸收的魂环</p>
            <p className="text-[11px] mt-1">前往星斗大森林猎魂获取</p>
          </div>
        ) : (
          <div className="space-y-2">
            {player.pendingSoulRings.map((ring) => {
              const now = Date.now();
              const left = ring.expiresAt - now;
              const pct = Math.max(0, Math.min(100, (left / (3 * 60 * 1000)) * 100));
              const isExpired = left <= 0;
              const isAbsorbing = absorbingRingId === ring.id;
              return (
                <motion.button
                  key={ring.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !isExpired && setSelectedRingId(ring.id)}
                  className={`w-full text-left rounded-xl border p-3 transition-all flex items-center gap-3 ${
                    isExpired
                      ? 'border-border/20 bg-card/20 opacity-50 cursor-not-allowed'
                      : 'border-border/30 bg-card/30 hover:border-cyan-500/40 hover:bg-card/50'
                  } ${isAbsorbing ? 'opacity-0 scale-95' : ''}`}
                >
                  <SoulRing color={ring.color} years={ring.years} beastAttribute={ring.beastAttribute} size={48} animate />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                       <span
                         className="text-[11px] font-bold"
                         style={{ color: RING_COLOR_MAP[ring.color as keyof typeof RING_COLOR_MAP], textShadow: `0 0 6px ${RING_COLOR_MAP[ring.color as keyof typeof RING_COLOR_MAP]}60` }}
                       >
                         {ring.qualityLabel}
                       </span>
                      <span className="text-sm font-semibold truncate">{ring.soulBeastName}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      伤害：{ring.skillDamagePct && ring.skillDamagePct > 0 ? `${(ring.skillDamagePct * 100).toFixed(1)}%` : '—'}
                    </div>
                    {ring.years && (
                      <div className="text-[10px] text-muted-foreground">
                        {ring.years.toLocaleString()} 年
                      </div>
                    )}
                    {ring.beastAttribute && (
                      <div className="text-[10px] text-cyan-300 mt-0.5">属性：{ring.beastAttribute}</div>
                    )}
                  </div>
                  <div
                    className={`text-xs font-bold tabular-nums shrink-0 text-right ${
                      left < 30000 ? 'text-red-500' : 'text-cyan-300'
                    }`}
                  >
                    {formatTimeLeft(left)}
                    <div className="w-16 h-1 rounded-full bg-foreground/10 mt-1 ml-auto overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          left < 30000 ? 'bg-red-500' : 'bg-cyan-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* 待吸收魂环详情弹窗 */}
      <RingDetailDialog
        ring={selectedRing}
        open={!!selectedRing}
        onClose={() => setSelectedRingId(null)}
        playerElement={soulTab === 0 ? player.martialSoul.element : (player.secondSoul?.element ?? player.martialSoul.element)}
        soulQuality={soulTab === 0 ? player.martialSoul.quality : player.secondSoul?.quality}
        extremeAttribute={soulTab === 0 ? player.martialSoul.extremeAttribute : player.secondSoul?.extremeAttribute}
        isPending
        timeLeftMs={selectedRing ? selectedRing.expiresAt - Date.now() : undefined}
        canAbsorb={canAbsorbNext}
        absorbSuccessRate={absorbSuccessRate}
        guaranteedYears={guaranteedYears}
        isUnlimitedSlot={isUnlimitedSlot}
        nextSlotIndex={nextSlotIndex}
        isAbsorbing={!!absorbingRingId}
        absorbResult={absorbResult}
        onAbsorb={handleAbsorb}
        onDiscard={() => selectedRing && handleDiscard(selectedRing.id)}
      />

      {/* 已吸收魂环详情弹窗 */}
      <RingDetailDialog
        ring={detailAbsorbedIndex != null ? currentSoulRings[detailAbsorbedIndex] ?? null : null}
        ringIndex={detailAbsorbedIndex ?? undefined}
        open={detailAbsorbedIndex != null}
        onClose={() => setDetailAbsorbedIndex(null)}
        playerElement={soulTab === 0 ? player.martialSoul.element : (player.secondSoul?.element ?? player.martialSoul.element)}
        soulQuality={soulTab === 0 ? player.martialSoul.quality : player.secondSoul?.quality}
        extremeAttribute={soulTab === 0 ? player.martialSoul.extremeAttribute : player.secondSoul?.extremeAttribute}
      />

      {/* 魂环吸收上限表 */}
      <div className="rounded-2xl border border-border/40 bg-card/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Info className="h-4 w-4 text-cyan-400" />
            魂环吸收上限表
          </h3>
          {(player.reincarnation?.count ?? 0) > 0 && (
            <div className="text-xs text-purple-300">
              第 {player.reincarnation.count + 1} 世 · 每世 +50% 上限
            </div>
          )}
        </div>

        {/* 第一武魂 */}
        <div className="mb-4">
          <div className="text-xs text-foreground/80 font-medium mb-2">
            第一武魂 · {player.martialSoul.name}
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-1.5 text-[10px]">
            {RING_ABSORPTION_RULES.map((rule, i) => {
              const reincBonus = player.reincarnation?.totalRingYearBonus ?? 0;
              const bonusPct = player.reincarnation?.ringYearBonusPct ?? 0;
              const pctBonus = Math.floor(rule.guaranteedMaxYears * bonusPct);
              const total = rule.guaranteedMaxYears + reincBonus + pctBonus;
              const isCurrent = i === nextSlotIndex && canAbsorbNext && soulTab === 0;
              const isUnlimited = rule.unlimited; // 第9魂环无年限上限（超年限可尝试）
              return (
                <div
                  key={i}
                  className={`rounded-lg border p-2 text-center transition-all ${
                    isCurrent
                      ? 'border-cyan-400/60 bg-cyan-500/10 ring-1 ring-cyan-400/30'
                      : 'border-border/40 bg-card/50'
                  }`}
                >
                  <div className="text-foreground/60 mb-0.5">第{i + 1}环</div>
                  <div className={`font-bold ${isCurrent ? 'text-cyan-300' : 'text-foreground'}`}>
                    {isUnlimited
                      ? `${(rule.guaranteedMaxYears / 10000).toFixed(0)}万+`
                      : total >= 10000
                        ? `${(total / 10000).toFixed(total >= 100000 ? 0 : 1)}万`
                        : `${total}年`}
                  </div>
                  {(reincBonus > 0 || pctBonus > 0) && !isUnlimited && (
                    <div className="text-[9px] text-purple-300 mt-0.5">
                      轮回 +{reincBonus + pctBonus}年
                    </div>
                  )}
                  {isUnlimited && (
                    <div className="text-[9px] text-amber-400 mt-0.5">
                      超年限可尝试
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 第二武魂 */}
        {isTwin && player.secondSoul && (
          <div>
            <div className="text-xs text-fuchsia-300/90 font-medium mb-2">
              第二武魂 · {player.secondSoul.name}
            </div>
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-1.5 text-[10px]">
                  {Array.from({ length: 9 }).map((_, i) => {
                   const reincBonus = player.reincarnation?.totalRingYearBonus ?? 0;
                   const bonusPct = player.reincarnation?.ringYearBonusPct ?? 0;
                   const baseMax = secondRingLimits[i] ?? 0;
                   const total = getSecondSoulGuaranteedYears(player.level, i, reincBonus, bonusPct);
                  const isCurrent = i === nextSlotIndex && canAbsorbNext && soulTab === 1;
                  const isInfinite = player.level >= 90;
                  return (
                   <div
                     key={i}
                     className={`rounded-lg border p-2 text-center transition-all ${
                       isCurrent
                         ? 'border-fuchsia-400/60 bg-fuchsia-500/10 ring-1 ring-fuchsia-400/30'
                         : 'border-fuchsia-500/20 bg-fuchsia-900/10'
                     } ${baseMax === 0 ? 'opacity-40' : ''}`}
                   >
                     <div className="text-fuchsia-300/60 mb-0.5">第{i + 1}环</div>
                      <div className="font-bold text-fuchsia-200">
                        {baseMax === 0
                          ? '未解锁'
                          : isInfinite
                            ? '百万年+'
                            : total >= 10000
                              ? `${(total / 10000).toFixed(total >= 100000 ? 0 : 1)}万`
                              : `${total}年`}
                      </div>
                      {reincBonus > 0 && baseMax > 0 && (
                        <div className="text-[9px] text-purple-300 mt-0.5">
                          {isInfinite ? '百万年以下必定成功' : `+${reincBonus}年轮回`}
                        </div>
                      )}
                   </div>
                 );
               })}
             </div>
          </div>
        )}
      </div>

      {/* 规则说明 */}
      <div className="rounded-xl border border-border/30 bg-card/20 p-3 text-[11px] text-muted-foreground space-y-1.5">
        <div className="font-medium text-foreground">💡 魂环吸收规则</div>
        <div>· 击败魂兽后可选择「收起魂环」，魂环仅存在 3 分钟</div>
        <div>· 3 分钟内未吸收，魂环会自动消散</div>
        <div>· 必须按顺序吸收（第1→2→3…环），吸收后不可替换</div>
        <div>· 每达到 10/20/30...90 级可吸收对应魂环</div>
        <div>· 达到整十级但未吸收魂环时，无法继续获得经验</div>
        {(player?.reincarnation?.count ?? 0) > 0 && (
          <div className="pt-1 border-t border-purple-500/30 text-purple-200">
            <span className="font-semibold">🌟 轮回加成：</span>
             当前第 {player.reincarnation.count + 1} 世，每世 +50% 魂环吸收上限（累计 +{Math.round(((player.reincarnation?.ringYearBonusPct ?? 0)) * 100)}%），所有魂环必定成功年限同步提升
          </div>
        )}
          <div className="pt-1 border-t border-border/20">
            <div className="font-medium text-foreground mb-1">⚠️ 吸收成功率</div>
             <div>· 第1环 ≤600年、第2环 ≤900年、第3环 ≤5000年 必定成功</div>
             <div>· 第4环 ≤7000年、第5环 ≤3万年、第6环 ≤6万年 必定成功</div>
             <div>· 第7环 ≤8万年、第8环 ≤9万年 必定成功</div>
             <div>· 第9环 <span className="text-amber-300 font-semibold">100万年以下必定成功</span>，超过后成功率递减，无硬性上限</div>
              <div>· 超过必定成功上限后，基础成功率60%，每超上限10%年份减5%成功率</div>
            <div className="text-cyan-200">· 大境界瓶颈（10/20…90级）吸收失败不掉级</div>
          </div>
          {isTwin && (
            <div className="pt-2 border-t border-border/20">
              <div className="font-medium text-fuchsia-300 mb-1">💫 第二武魂规则</div>
               <div>· 第二武魂无法超年限吸收，超过上限则不能吸收</div>
               <div>· 90级封号斗罗后，所有魂环 100万年以下必定成功</div>
              <div className="text-emerald-500">· 第二武魂吸收失败不掉级，仅魂环损毁</div>
            </div>
          )}
      </div>
    </div>
  );
}

function ringYearsShort(y: number): string {
  if (y >= 10000) return `${(y / 10000).toFixed(1)}万`;
  if (y >= 1000) return `${(y / 1000).toFixed(1)}千`;
  return y.toString();
}
