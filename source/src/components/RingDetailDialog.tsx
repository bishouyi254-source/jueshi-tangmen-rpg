import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, CheckCircle2, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { RING_COLOR_MAP, RING_DISPLAY_COLOR, inferElementFromName, normalizeBeastAttribute, calcAttributeBonus } from '@/lib/gameStore';
import type { ISoulRing } from '@/lib/gameStore';
import { getBeastSpeciesByName, getDangerLevel } from '@/data/soulbeasts';
import SoulRing from '@/components/SoulRing';

interface RingDetailDialogProps {
  ring: ISoulRing | null;
  ringIndex?: number;
  open: boolean;
  onClose: () => void;
  /** 玩家武魂属性，用于判断属性克制 */
  playerElement?: string;
  /** 武魂品质 */
  soulQuality?: string;
  /** 武魂极致属性 */
  extremeAttribute?: string;
  // 待吸收模式
  isPending?: boolean;
  timeLeftMs?: number;
  canAbsorb?: boolean;
  absorbSuccessRate?: number;
  guaranteedYears?: number;
  isUnlimitedSlot?: boolean;
  nextSlotIndex?: number;
   isAbsorbing?: boolean;
   absorbResult?: 'success' | 'fail' | null;
   absorbLevelDropped?: boolean;
  onAbsorb?: () => void;
  onDiscard?: () => void;
}

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return '已消散';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function RingDetailDialog({
  ring,
  ringIndex,
  open,
  onClose,
  playerElement,
  soulQuality,
  extremeAttribute,
  isPending = false,
  timeLeftMs,
  canAbsorb,
  absorbSuccessRate = 0,
  guaranteedYears = 0,
  isUnlimitedSlot = false,
  nextSlotIndex,
   isAbsorbing,
   absorbResult,
   absorbLevelDropped = true,
  onAbsorb,
  onDiscard,
}: RingDetailDialogProps) {
  if (!ring) return null;

  const ringColor = RING_COLOR_MAP[ring.color as keyof typeof RING_COLOR_MAP];
  const displayColor = RING_DISPLAY_COLOR[ring.color as keyof typeof RING_DISPLAY_COLOR] || ringColor;
  const beast = getBeastSpeciesByName(ring.soulBeastName);
  const dangerLevel = beast
    ? getDangerLevel(beast.areaTier, ring.years ?? 0)
    : '未知';

  const areaLabel: Record<string, string> = {
    outer: '外围区',
    middle: '中部区',
    inner: '内圈',
    core: '核心区',
    'life-lake': '生命之湖',
  };

  const isGuaranteed = absorbSuccessRate >= 100;

  // 魂兽属性：优先用 ring.beastAttribute，缺失时用 inferElementFromName 兜底
  // 🔴 修复：显示前先 normalizeBeastAttribute 归一化，保证与实际共鸣判断用的是同一套标准属性名
  // （例：'暗属性'→'黑暗属性'，避免界面显示『暗属性』但判断用『黑暗属性』）
  const rawRingBeastAttribute = ring.beastAttribute || inferElementFromName(ring.soulBeastName);
  const ringBeastAttribute = normalizeBeastAttribute(rawRingBeastAttribute);
  const playerEl = extremeAttribute && extremeAttribute !== '无' ? extremeAttribute : (playerElement || '无属性');
  const isAttributeMatch=calcAttributeBonus(playerElement||'无属性',[ring],[],{extremeAttribute}).hasRingMatch;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !isAbsorbing && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: 'tween', duration: 0.2 }}
             className="w-full max-w-sm bg-card/98 rounded-2xl border-2 border-cyan-500 shadow-2xl max-h-[82vh] overflow-y-auto relative text-foreground backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
             <button
               onClick={onClose}
               disabled={!!isAbsorbing}
               className="absolute top-2.5 right-2.5 z-10 p-1 rounded-full bg-card/80 text-cyan-400 hover:text-cyan-200 hover:bg-card transition-colors disabled:opacity-50"
               aria-label="关闭"
             >
               <X className="h-4 w-4" />
            </button>

            {/* 吸收动画覆盖层 */}
            <AnimatePresence>
              {isAbsorbing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl ${
                    absorbResult === 'fail' ? 'bg-red-900/50' : 'bg-card/90'
                  }`}
                >
                  {absorbResult === 'fail' ? (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center"
                    >
                      <div className="text-5xl mb-2">💥</div>
                       <div className="text-lg font-bold text-red-400">吸收失败</div>
                       <div className="text-xs text-red-600 mt-1">
                         {absorbLevelDropped ? '魂力反噬，等级倒退一级' : '您已达到封号斗罗境界，等级不会下降'}
                       </div>
                       <div className="text-[10px] text-red-500/70 mt-2">魂环已损毁</div>
                    </motion.div>
                  ) : (
                    <>
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <motion.div
                          initial={{ scale: 2, opacity: 0 }}
                          animate={{ scale: 0.4, opacity: 1, y: -20 }}
                          transition={{ duration: 1.1, ease: 'easeIn' }}
                          className="absolute"
                        >
                          <SoulRing color={ring.color} years={ring.years} beastAttribute={ring.beastAttribute} size={90} animate />
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ delay: 0.8, duration: 0.5 }}
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: `radial-gradient(circle, ${ringColor}60 0%, transparent 70%)`,
                          }}
                        />
                      </div>
                       <div className="text-sm text-cyan-300 font-medium mt-4">
                        正在吸收魂环...
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

             <div className="p-4">
               {/* 顶部：魂环外观 + 标题 */}
               <div className="flex flex-col items-center text-center mb-3">
                 <div className="relative">
                   <SoulRing color={ring.color} years={ring.years} beastAttribute={ring.beastAttribute} size={72} animate />
                 </div>
                  <h3
                    className="text-base font-bold mt-2"
                    style={{ color: displayColor }}
                  >
                   {ring.qualityLabel}魂环
                 </h3>
                {ringIndex != null && (
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    第 {ringIndex + 1} 魂环
                  </div>
                )}
                 <div className="text-xs text-foreground mt-0.5">
                   来源：{ring.soulBeastName}
                 </div>
                {ring.years != null && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {ring.years.toLocaleString()} 年
                  </div>
                )}

                {/* 待吸收剩余时间 */}
                {isPending && timeLeftMs != null && (
                  <div
                    className={`mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      timeLeftMs < 30000
                        ? 'bg-red-900/40 text-red-400 border border-red-500/30'
                        : 'bg-cyan-800/50 text-cyan-300 border border-cyan-500/40'
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    剩余 {formatTimeLeft(timeLeftMs)}
                  </div>
                )}
              </div>

               {/* 待吸收模式：顶部吸收按钮（玩家不用下滑即可点击） */}
               {isPending && canAbsorb != null && (
                 <div className="mb-3">
                   <div className="flex gap-2">
                     <button
                       onClick={onAbsorb}
                       disabled={!canAbsorb || isAbsorbing}
                       className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-400 text-cyan-950 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:from-cyan-400 hover:to-yellow-400 transition-all active:scale-[0.98]"
                     >
                       <Plus className="h-4 w-4" />
                       吸收魂环
                     </button>
                     <button
                       onClick={onDiscard}
                       disabled={isAbsorbing}
                       className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-red-900/30 text-red-400 border border-red-500/30 text-xs font-medium hover:bg-red-800/40 transition-colors disabled:opacity-50 active:scale-[0.98]"
                     >
                       <Trash2 className="h-4 w-4" />
                       销毁
                     </button>
                   </div>
                   {canAbsorb ? (
                     <div className="mt-2 text-center text-[11px] text-muted-foreground">
                       吸收成功率 <span className={isGuaranteed ? 'text-green-500 font-semibold' : absorbSuccessRate >= 50 ? 'text-cyan-300 font-semibold' : 'text-red-400 font-semibold'}>
                         {isGuaranteed ? '100%（必定成功）' : `${absorbSuccessRate}%`}
                       </span>
                     </div>
                   ) : (
                     <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-red-400">
                       <AlertTriangle className="h-3.5 w-3.5" />
                       暂不满足吸收条件
                     </div>
                   )}
                 </div>
               )}

                {/* 魂兽介绍 */}
               <div className="rounded-xl bg-cyan-900/30 p-2.5 mb-2.5 border border-cyan-500/20">
                 <h4 className="text-[11px] font-semibold text-cyan-300 mb-1.5">
                   魂兽介绍
                 </h4>
                 <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">名称</span>
                    <span className="font-medium">{ring.soulBeastName}</span>
                  </div>
                  {beast ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">栖息区域</span>
                        <span>{areaLabel[beast.areaTier] ?? beast.areaTier}</span>
                      </div>
                      {beast.element && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">属性</span>
                          <span>{normalizeBeastAttribute(beast.element)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">危险等级</span>
                        <span className="text-red-600">{dangerLevel}</span>
                      </div>
                      <div className="pt-1.5 border-t border-border/30">
                        <div className="text-[11px] text-foreground leading-relaxed">
                          {beast.description}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      暂无详细资料
                    </div>
                  )}
                </div>
              </div>

              {/* 魂技：已吸收模式显示魂技名称+描述；待吸收模式只显示伤害百分比 */}
               {!isPending ? (
                 <div className="rounded-xl bg-cyan-900/30 p-2.5 mb-2.5 border border-cyan-500/20">
                   <h4 className="text-[11px] font-semibold text-cyan-300 mb-1.5">
                     魂技
                   </h4>
                   <div className="text-xs font-medium mb-1">{ring.skillName}</div>
                   <p className="text-[11px] text-muted-foreground leading-relaxed">
                     {ring.skillDesc}
                   </p>
                  {/* 已吸收魂环的伤害百分比 */}
                   {ring.skillDamagePct && ring.skillDamagePct > 0 && (
                     <div className="mt-1.5 pt-1.5 border-t border-border/30 flex items-center justify-between">
                       <span className="text-[9px] text-muted-foreground">魂技伤害</span>
                       <span className="text-xs font-bold text-primary tabular-nums">
                         {(ring.skillDamagePct * 100).toFixed(1)}%
                       </span>
                     </div>
                   )}
                </div>
               ) : (
                 <div className="rounded-xl bg-cyan-900/30 p-2.5 mb-2.5 border border-cyan-500/20">
                   <h4 className="text-[11px] font-semibold text-cyan-300 mb-1.5">
                     魂环属性
                   </h4>
                   <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">年限</span>
                      <span className="font-medium">{ring.years != null ? `${ring.years.toLocaleString()} 年` : '—'}</span>
                    </div>
                    {/* 属性：归一化后显示，确保11种标准属性之一，绝不空白 */}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">属性</span>
                      <span className="font-medium">{ringBeastAttribute}</span>
                    </div>
                    {ring.beastType && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">系别</span>
                        <span className="font-medium">
                          {ring.beastType === 'qiang' ? '强攻系' : ring.beastType === 'min' ? '敏攻系' : ring.beastType === 'kong' ? '控制系' : ring.beastType === 'fu' ? '辅助系' : '防御系'}
                        </span>
                      </div>
                    )}
                     <div className="pt-1 border-t border-border/30 flex items-center justify-between">
                       <span className="text-[9px] text-muted-foreground">预计伤害百分比</span>
                       <span className="text-sm font-black text-primary tabular-nums">
                        {ring.skillDamagePct && ring.skillDamagePct > 0
                          ? `${(ring.skillDamagePct * 100).toFixed(1)}%`
                          : '—'}
                      </span>
                    </div>
                    <div className="text-[9px] text-muted-foreground leading-relaxed">
                      吸收后根据武魂属性契合度精确计算，属性共鸣可再+5%
                    </div>
                  </div>
                </div>
              )}

                 {/* 属性加成（数值） */}
               <div className="rounded-xl bg-cyan-900/30 p-2.5 mb-2.5 border border-cyan-500/20">
                 <h4 className="text-[11px] font-semibold text-cyan-300 mb-1.5">
                   属性加成（数值）
                 </h4>
                <div className="grid grid-cols-4 gap-1 text-center text-[11px]">
                  <div>
                    <div className="text-rose-600 font-semibold">
                      +{Math.round(ring.attackBonus ?? 0)}
                    </div>
                    <div className="text-[9px] text-muted-foreground">攻击</div>
                  </div>
                  <div>
                    <div className="text-blue-600 font-semibold">
                      +{Math.round(ring.defenseBonus ?? 0)}
                    </div>
                    <div className="text-[9px] text-muted-foreground">防御</div>
                  </div>
                  <div>
                    <div className="text-emerald-600 font-semibold">
                      +{Math.round(ring.speedBonus ?? 0)}
                    </div>
                    <div className="text-[9px] text-muted-foreground">速度</div>
                  </div>
                  <div>
                    <div className="text-purple-600 font-semibold">
                      +{Math.round(ring.spiritBonus ?? 0)}
                    </div>
                    <div className="text-[9px] text-muted-foreground">精神</div>
                  </div>
                </div>
                 <div className="grid grid-cols-4 gap-1 text-center text-[11px] mt-1.5">
                  <div>
                    <div className="text-cyan-300 font-semibold">
                      +{Math.round(ring.hpBonus ?? 0)}
                    </div>
                    <div className="text-[9px] text-muted-foreground">气血</div>
                  </div>
                  <div>
                    <div className="text-orange-600 font-semibold">
                      +{(ring.critRateBonus ?? 0).toFixed(1)}%
                    </div>
                    <div className="text-[9px] text-muted-foreground">暴击率</div>
                  </div>
                  <div>
                    <div className="text-pink-600 font-semibold">
                      +{(ring.critDmgBonus ?? 0).toFixed(0)}%
                    </div>
                    <div className="text-[9px] text-muted-foreground">爆伤</div>
                  </div>
                  <div>
                    <div className="text-sky-700 font-semibold">
                      +{Math.round(ring.soulPowerBonus ?? 0)}
                    </div>
                    <div className="text-[9px] text-muted-foreground">魂力</div>
                  </div>
                </div>
                 {/* 魂技伤害百分比 */}
                 <div className="mt-2 pt-2 border-t border-border/30 text-center">
                   <div className="text-[9px] text-muted-foreground mb-0.5">魂技伤害百分比</div>
                   <div className="text-xl font-black text-primary tabular-nums tracking-tight">
                    {ring.skillDamagePct && ring.skillDamagePct > 0
                      ? `${(ring.skillDamagePct * 100).toFixed(1)}%`
                      : '—'}
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-1 leading-relaxed space-y-0.5">
                    <div>基础魂技伤害 = 对应修炼属性 ×（1 + 保存系数）</div>
                    {isAttributeMatch && <div className="text-emerald-400">匹配魂环使常驻五维 +5%，同类只计一次</div>}
                  </div>
                </div>
                </div>

               {/* 属性克制提示 */}
               {/* 🔴 修复：显示条件用 playerEl（极致属性优先），而不是原始 playerElement
                *  神级武魂只有 extremeAttribute 没有 element 时，整个共鸣区不会被隐藏
                *  显示的武魂属性名也用 playerEl，与实际判断属性保持一致 */}
               {(
                 <div data-ring-resonance data-match={isAttributeMatch} className="rounded-xl p-2.5 mb-2.5 border text-[11px] space-y-1" style={{
                  backgroundColor: 'rgba(74,222,128,0.08)',
                  borderColor: (isAttributeMatch ? 'rgba(74,222,128,0.4)' : 'rgba(74,222,128,0.15)'),
                }}>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">属性共鸣</span>
                    <span className="text-cyan-300 font-medium">
                      魂兽：{ringBeastAttribute}
                    </span>
                  </div>
                   {isAttributeMatch ? (
                     <div className="flex items-center gap-1.5 text-emerald-400">
                       <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                       <span className="font-medium">与武魂属性匹配，常驻五维 <span className="font-bold">+5%</span></span>
                     </div>
                   ) : (
                    <div className="text-cyan-300/90">
                       武魂属性：{playerEl}，无共鸣加成
                    </div>
                  )}
                </div>
              )}

               {/* 魂环品质说明 */}
                <div className="rounded-xl p-2.5 mb-3 text-[11px]" style={{
                 backgroundColor: `${displayColor}12`,
                 border: `1px solid ${displayColor}40`,
               }}>
                 <div className="flex items-center gap-2">
                   <div
                     className="w-3 h-3 rounded-full shrink-0"
                     style={{ backgroundColor: ringColor, border: ring.color === 'black' ? '1px solid #94a3b8' : 'none', boxShadow: `0 0 6px ${displayColor}` }}
                   />
                   <span className="font-bold" style={{ color: displayColor, textShadow: `0 0 8px ${displayColor}80` }}>
                     {ring.qualityLabel}魂环
                   </span>
                </div>
                 <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                  {ring.color === 'white' && '十年魂环，最低阶品质，魂士阶段即可吸收。'}
                  {ring.color === 'yellow' && '百年魂环，常见品质，魂师阶段主力魂环。'}
                  {ring.color === 'purple' && '千年魂环，精良品质，大魂师以上可吸收。'}
                  {ring.color === 'black' && '万年魂环，稀有品质，魂尊以上可吸收，属性加成丰厚。'}
                  {ring.color === 'red' && '十万年魂环，传说品质，属性极为强大，可遇不可求。'}
                  {ring.color === 'gold' && '神级魂环，至高品质，仅神祇方能拥有。'}
                </p>
              </div>

               {/* 待吸收模式：底部吸收条件详情（已移到顶部，这里仅展示详细条件） */}
               {isPending && canAbsorb != null && (
                 <>
                    <div
                      className="rounded-xl p-2.5 mb-3 text-[11px] space-y-1.5"
                      style={{
                       backgroundColor: canAbsorb
                         ? 'rgba(251,191,36,0.08)'
                         : 'rgba(239,68,68,0.06)',
                       border: `1px solid ${
                         canAbsorb ? 'rgba(251,191,36,0.3)' : 'rgba(239,68,68,0.25)'
                       }`,
                     }}
                  >
                    {canAbsorb ? (
                      <>
                         <div className="flex items-center gap-2">
                           <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                           <span className="text-cyan-300 text-[11px]">
                            可吸收为第 {(nextSlotIndex ?? 0) + 1} 魂环
                          </span>
                        </div>
                        {ring.years != null && (
                          <>
                            <div className="flex justify-between text-muted-foreground">
                              <span>{isUnlimitedSlot ? '必成年限' : '必定成功上限'}</span>
                              <span className="text-green-600">
                                {isUnlimitedSlot
                                  ? `${guaranteedYears.toLocaleString()} 年（更高仍可吸收）`
                                  : `${guaranteedYears.toLocaleString()} 年`}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-muted-foreground">
                              <span>吸收成功率</span>
                              <span
                                className={
                                  isGuaranteed
                                    ? 'text-green-600 font-semibold'
                                    : absorbSuccessRate >= 50
                                     ? 'text-cyan-300 font-semibold'
                                    : 'text-red-600 font-semibold'
                                }
                              >
                                {isGuaranteed ? '100%（必定成功）' : `${absorbSuccessRate}%`}
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${absorbSuccessRate}%`,
                                  background: isGuaranteed
                                    ? 'linear-gradient(to right, #4ade80, #22c55e)'
                                    : absorbSuccessRate >= 50
                                    ? 'linear-gradient(to right, #fbbf24, #f59e0b)'
                                    : 'linear-gradient(to right, #f87171, #ef4444)',
                                }}
                              />
                            </div>
                             {!isGuaranteed && (
                               <div className="flex items-start gap-1.5 text-cyan-300/80 pt-1">
                                 <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                 <span>
                                   超过必定成功上限，存在失败风险
                                 </span>
                               </div>
                             )}
                          </>
                        )}
                      </>
                    ) : (
                       <div className="flex items-center gap-2">
                         <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                         <span className="text-red-600 text-[11px]">暂不满足吸收条件</span>
                      </div>
                    )}
                   </div>
                 </>
               )}

              {/* 已吸收模式：关闭按钮 */}
              {!isPending && (
                <button
                  onClick={onClose}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-100 to-yellow-100 text-cyan-200 border border-cyan-300/50 text-xs font-medium hover:from-cyan-200 hover:to-yellow-200 transition-all active:scale-[0.98]"
                >
                  关闭
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
