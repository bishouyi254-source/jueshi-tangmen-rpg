import { useState, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, RotateCcw, X, AlertTriangle, CheckCircle2, ArrowRight, RefreshCw,
  Award, Crown, Gem, Swords, Shield, Zap, Heart, BookOpen,
} from 'lucide-react';
import {
  useGame, rollTwinSouls, rollTwinSoulPower, rollSoulPower, rollMartialSoul,
  QUALITY_LABEL, QUALITY_COLOR, getRealm, isStrictlySingleSoul,
} from '@/lib/gameStore';
import type { IMartialSoul } from '@/data/martialsouls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { logger } from '@lark-apaas/client-toolkit-lite';

interface ReincarnationPanelProps {
  onClose: () => void;
  onOpenHistory?: () => void;
}

const MAX_REINCARNATION = 99;

export default memo(function ReincarnationPanel({ onClose, onOpenHistory }: ReincarnationPanelProps) {
  const { player, canReincarnate, getReincarnationBonus, performReincarnation, getReincarnationOrbs } = useGame();
  const bonus = getReincarnationBonus();
  const orbs = getReincarnationOrbs();
  const totalReincarnations = orbs.length;

  const [showWarning, setShowWarning] = useState(false);
  const [soulChoice, setSoulChoice] = useState<'keep' | 'reroll'>('keep');
  const [isAnimating, setIsAnimating] = useState(false);
  const isAnimatingRef = useRef(false);
  const [animatePhase, setAnimatePhase] = useState<'gather' | 'burst' | 'done'>('gather');
  const [rerollResult, setRerollResult] = useState<{
    soul: string;
    soulQuality: string;
    secondSoul?: string | null;
    secondSoulQuality?: string | null;
    soulPower: number;
    isTwin: boolean;
  } | null>(null);
  const [newName, setNewName] = useState('');
  const [previewSoul, setPreviewSoul] = useState<{
    main: IMartialSoul;
    second: IMartialSoul | null;
    soulPower: number;
    isTwin: boolean;
  } | null>(null);
  const [previewRolling, setPreviewRolling] = useState(false);
  const [soulChoiceConfirmed, setSoulChoiceConfirmed] = useState(false);

  const canReincarnateNow = canReincarnate();
  const currentRealm = player ? getRealm(player.level) : '';

  const handleReincarnate = () => {
    if (!canReincarnateNow) return;
    setShowWarning(true);
    setSoulChoice('keep');
    setNewName('');
    setPreviewSoul(null);
    setPreviewRolling(false);
    setSoulChoiceConfirmed(false);
  };

  const confirmReincarnate = () => {
    if(previewRolling||isAnimatingRef.current)return;
    setShowWarning(false);
    setIsAnimating(true);
    isAnimatingRef.current = true;
    setAnimatePhase('gather');

    const timeoutId = window.setTimeout(() => {
      if (isAnimatingRef.current) {
        isAnimatingRef.current = false;
        setIsAnimating(false);
        setAnimatePhase('burst');
        doReincarnate();
      }
    }, 5000);

    window.setTimeout(() => setAnimatePhase('burst'), 1800);
    window.setTimeout(() => {
      clearTimeout(timeoutId);
      if (isAnimatingRef.current) {
        isAnimatingRef.current = false;
        setIsAnimating(false);
        doReincarnate();
      }
    }, 2600);
  };

  const doReincarnate = () => {
    try {
      const preset =
        soulChoice === 'reroll' && previewSoul
          ? {
              mainSoul: previewSoul.main,
              secondSoul: previewSoul.second,
              soulPower: previewSoul.soulPower,
            }
          : undefined;
      const result = performReincarnation(
        soulChoice,
        newName.trim() || undefined,
        preset as any,
      );
      setIsAnimating(false);
      setAnimatePhase('done');
      if (result.success) {
        logger.info('转世成功', { count: result.newSoul ? result.newSoul.name : 'keep' });
        if (soulChoice === 'reroll' && result.newSoul) {
          const newSp = preset?.soulPower ?? (player?.soulPower ?? 1);
          setRerollResult({
            soul: result.newSoul.name,
            soulQuality: result.newSoul.quality,
            secondSoul: result.newSecondSoul?.name || null,
            secondSoulQuality: result.newSecondSoul?.quality || null,
            soulPower: newSp,
            isTwin: !!result.newSecondSoul,
          });
        } else {
          onClose();
        }
      } else {
        setIsAnimating(false);
        isAnimatingRef.current = false;
        setAnimatePhase('done');
        logger.error('转世失败:', result.reason ?? '未知原因');
        setShowWarning(true);
      }
    } catch (err) {
      setIsAnimating(false);
      isAnimatingRef.current = false;
      setAnimatePhase('done');
      logger.error('转世异常:', String(err));
      setShowWarning(true);
    }
  };

  const handlePreviewReroll = () => {
    if (!player) return;
    if(previewRolling)return;
    setPreviewRolling(true);
    setTimeout(() => {
       const { primary, secondary, isTwin } = rollTwinSouls({});
       let finalSecond: IMartialSoul | null = secondary;
       let finalIsTwin = isTwin;
       // 🔴 严格单武魂守卫：主武魂是罗三炮时，强制清除第二武魂（不触发保底）
       if (!isStrictlySingleSoul(primary) && player.isTwinSoul && !isTwin && Math.random() < 0.5) {
         let second = rollTwinSouls({}).primary;
         for (let i = 0; i < 10; i++) {
           if (second.id !== primary.id) break;
           second = rollMartialSoul({ excludeNames: [primary.name] });
         }
         finalSecond = second.id !== primary.id ? second : null;
         finalIsTwin = second.id !== primary.id;
      }
      if(finalSecond?.id===primary.id){finalSecond=null;finalIsTwin=false;}
      const soulPower = finalIsTwin
        ? rollTwinSoulPower(primary, finalSecond)
        : rollSoulPower(primary.quality);
      setPreviewSoul({
        main: primary,
        second: finalSecond,
        soulPower,
        isTwin: finalIsTwin,
      });
      setSoulChoiceConfirmed(true);
      setPreviewRolling(false);
    }, 300);
  };

  if (!player) return null;

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-purple-400" />
          <h2 className="text-lg font-bold">转世轮回</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 轮回球可视化 + 状态卡 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-950/50 via-indigo-950/40 to-cyan-950/30 p-5"
      >
        {/* 背景装饰粒子 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-purple-400/40"
              style={{ left: `${8 + (i * 7) % 85}%`, top: `${10 + (i * 13) % 80}%` }}
              animate={{
                opacity: [0.3, 0.8, 0.3],
                y: [0, -8, 0],
              }}
              transition={{
                duration: 3 + (i % 3),
                delay: i * 0.25,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        <div className="relative flex items-center gap-4 mb-4">
          {/* 轮回球 */}
          <div className="relative w-20 h-20 shrink-0">
            {/* 外层旋转光环 */}
            <motion.div
              className="absolute -inset-2 rounded-full border-2 border-purple-400/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              style={{ borderStyle: 'dashed' }}
            />
            <motion.div
              className="absolute -inset-4 rounded-full border border-cyan-400/20"
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              style={{ borderStyle: 'dotted' }}
            />
            {/* 核心球 */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/60 via-indigo-500/40 to-cyan-400/60 shadow-[0_0_30px_8px_rgba(168_85_247_0.35)]" />
            <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-purple-900 via-indigo-950 to-purple-900 flex items-center justify-center">
              <span className="text-xl font-bold text-yellow-300 tabular-nums" style={{ textShadow: '0 0 10px rgba(250,204,21,0.5)' }}>
                {bonus.count}
              </span>
            </div>
            {/* 脉冲光效 */}
            <motion.div
              className="absolute inset-0 rounded-full bg-purple-400/20"
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-yellow-400 shrink-0" />
              <span className="text-base font-bold text-yellow-300">
                轮回·第 {bonus.count + 1} 世
              </span>
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              {currentRealm} · {player.level} 级 · 已历 {bonus.count} 世
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="border-purple-400/40 text-purple-300 text-[10px] px-1.5 py-0">
                攻击 +{bonus.attackBonus}
              </Badge>
              <Badge variant="outline" className="border-cyan-400/40 text-cyan-300 text-[10px] px-1.5 py-0">
                魂环上限 +{Math.round(bonus.ringYearBonusPct * 100)}%
              </Badge>
              <Badge variant="outline" className="border-yellow-400/40 text-yellow-300 text-[10px] px-1.5 py-0">
                基础属性 +{bonus.count * 50}%
              </Badge>
            </div>
          </div>
        </div>

        {/* 三加成网格 */}
        <div className="relative grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-black/30 border border-red-500/20 p-2.5">
            <Swords className="h-4 w-4 text-red-300 mx-auto mb-1" />
            <div className="text-[10px] text-muted-foreground mb-0.5">攻击加成</div>
            <div className="text-sm font-bold text-red-300 tabular-nums">
              +{bonus.attackBonus}
            </div>
          </div>
          <div className="rounded-lg bg-black/30 border border-cyan-500/20 p-2.5">
            <Shield className="h-4 w-4 text-cyan-300 mx-auto mb-1" />
            <div className="text-[10px] text-muted-foreground mb-0.5">魂环上限</div>
            <div className="text-sm font-bold text-cyan-300 tabular-nums">
              +{Math.round(bonus.ringYearBonusPct * 100)}%
            </div>
          </div>
          <div className="rounded-lg bg-black/30 border border-yellow-500/20 p-2.5">
            <Zap className="h-4 w-4 text-yellow-300 mx-auto mb-1" />
            <div className="text-[10px] text-muted-foreground mb-0.5">基础属性</div>
            <div className="text-sm font-bold text-yellow-300 tabular-nums">
              +{bonus.count * 50}%
            </div>
          </div>
        </div>
      </motion.div>

      {/* 轮回史鉴入口 */}
      {onOpenHistory && totalReincarnations > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          onClick={onOpenHistory}
          className="w-full rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 to-yellow-950/20 p-3 flex items-center gap-3 hover:border-amber-400/50 hover:bg-amber-900/20 transition-all group"
        >
          <div className="w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br from-amber-500/30 to-yellow-500/20 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-amber-300" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-semibold text-amber-200">轮回史鉴</div>
            <div className="text-[11px] text-muted-foreground">查看过往 {totalReincarnations} 世的修炼历程</div>
          </div>
          <div className="shrink-0 flex items-center gap-1.5 text-amber-300 group-hover:translate-x-0.5 transition-transform">
            <span className="text-xs font-semibold">查看</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </motion.button>
      )}

      {/* 转世按钮 */}
      <Button
        onClick={handleReincarnate}
        disabled={!canReincarnateNow}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/50"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        {canReincarnateNow
          ? '转世重修'
          : player.level < 99
            ? `需99级可转世（当前${player.level}级）`
            : '已达最大轮回次数'}
      </Button>

      {/* 转世说明 */}
      <div className="rounded-xl border border-border/30 bg-card/20 p-4 space-y-2 text-[12px] text-muted-foreground">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-yellow-300/80 mb-2">
          <Award className="h-4 w-4" />
          <span>转世说明</span>
        </div>
        <ul className="space-y-1.5 list-none">
          <li className="flex items-start gap-2">
            <span className="text-purple-400 shrink-0 mt-0.5">◆</span>
            <span>达到 99 级（封号斗罗）后方可转世</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 shrink-0 mt-0.5">◆</span>
            <span>转世后等级、魂环、魂骨、装备、背包、队伍全部重置</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 shrink-0 mt-0.5">◆</span>
            <span>每一世获得永久攻击加成、魂环年限上限加成、基础属性加成</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 shrink-0 mt-0.5">◆</span>
            <span>保留武魂可继续使用本世武魂，重新觉醒可随机抽取新武魂</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-400 shrink-0 mt-0.5">◆</span>
            <span>最多可转世 99 次，历世成就记入轮回史鉴</span>
          </li>
        </ul>
      </div>

      {/* 确认弹窗 */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 p-4 overflow-y-auto"
            onClick={() => !isAnimating && setShowWarning(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm my-auto rounded-xl border border-orange-500/40 bg-gradient-to-br from-amber-950/95 to-red-950/95 p-6 shadow-2xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-6 w-6 text-orange-400" />
                <h3 className="text-lg font-bold text-orange-200">转世确认</h3>
              </div>

              <div className="space-y-2 text-sm text-amber-100/90 mb-5">
                <p>轮回后将失去当前所有：</p>
                <ul className="list-disc list-inside space-y-1 text-amber-200/80 text-xs">
                  <li>修为与等级（重置为先天魂力等级）</li>
                  <li>全部魂环、魂骨、装备</li>
                  <li>背包所有物品与魂币</li>
                  <li>招募角色与队伍</li>
                  <li>神考进度、领域、魂核</li>
                </ul>
                <p className="pt-2 text-yellow-300">
                  仅保留：<span className="font-semibold">轮回记录</span>、
                  <span className="font-semibold">轮回加成</span>
                </p>
              </div>

              <div className="mb-4">
                <div className="text-sm font-semibold text-amber-200 mb-2">
                  新的名字（可选）：
                </div>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value.slice(0, 12))}
                  placeholder="留空则使用原名"
                  maxLength={12}
                  className="bg-card/50"
                />
                <div className="text-[10px] text-muted-foreground mt-1">
                  输入新名字开启新的一世，最多12字
                </div>
              </div>

              <div className="mb-5">
                <div className="text-sm font-semibold text-amber-200 mb-2">武魂选择：</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSoulChoice('keep')}
                    className={`p-3 rounded-lg border text-sm transition-all ${
                      soulChoice === 'keep'
                        ? 'border-purple-400 bg-purple-900/50 text-white'
                        : 'border-border/50 bg-card/30 text-muted-foreground hover:border-purple-500/40'
                    }`}
                  >
                    <div className="font-semibold mb-0.5">保留武魂</div>
                    <div className="text-[10px] opacity-70">继续使用本世武魂</div>
                  </button>
                  <button
                    onClick={() => setSoulChoice('reroll')}
                    className={`p-3 rounded-lg border text-sm transition-all ${
                      soulChoice === 'reroll'
                        ? 'border-purple-400 bg-purple-900/50 text-white'
                        : 'border-border/50 bg-card/30 text-muted-foreground hover:border-purple-500/40'
                    }`}
                  >
                    <div className="font-semibold mb-0.5">重新觉醒</div>
                    <div className="text-[10px] opacity-70">重新抽取武魂品质</div>
                  </button>
                </div>
              </div>

              {soulChoice === 'reroll' && (
                <div className="mb-5 rounded-lg border border-fuchsia-500/30 bg-black/30 p-4">
                  <div className="text-sm font-semibold text-fuchsia-300 mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    武魂预览（满意后再确认转世）
                  </div>
                  {previewSoul ? (
                    <div className="space-y-2 mb-3">
                      {previewSoul.isTwin && previewSoul.second && (
                        <div className="text-[11px] text-cyan-300 text-center mb-1">
                          👆 默认第一武魂为主修，可点击卡片切换后确认转世
                        </div>
                      )}
                      <div
                        className={`rounded-md border p-2.5 cursor-pointer transition-all ${
                          soulChoiceConfirmed
                            ? 'border-yellow-500/60 bg-yellow-900/30 shadow-[0_0_12px_rgba(234_179_8_0.25)]'
                            : 'border-border/60 bg-card/40 hover:border-yellow-500/40'
                        }`}
                        onClick={() => {
                          if (!previewSoul.isTwin || !previewSoul.second) return;
                          setPreviewSoul((prev) => (prev ? { ...prev, main: prev.main } : prev));
                          setSoulChoiceConfirmed(true);
                        }}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="text-[10px] text-yellow-400 font-bold flex items-center gap-1">
                            {previewSoul.isTwin && previewSoul.second ? '第一武魂' : '主修武魂'}
                            {soulChoiceConfirmed && <CheckCircle2 className="w-3 h-3" />}
                          </div>
                          {previewSoul.isTwin && previewSoul.second && (
                            <span className="text-[10px] text-yellow-500/80">设为主修</span>
                          )}
                        </div>
                        <div
                          className="text-base font-bold"
                          style={{
                            color:
                              (QUALITY_COLOR[previewSoul.main.quality] as string) || '#fde68a',
                            textShadow: `0 0 10px ${(QUALITY_COLOR[previewSoul.main.quality] as string) || '#fde68a'}40`,
                          }}
                        >
                          {previewSoul.main.name}
                        </div>
                        <div
                          className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold"
                          style={{
                            background: `${(QUALITY_COLOR[previewSoul.main.quality] as string) || '#fde68a'}20`,
                            color:
                              (QUALITY_COLOR[previewSoul.main.quality] as string) || '#fde68a',
                            border: `1px solid ${(QUALITY_COLOR[previewSoul.main.quality] as string) || '#fde68a'}50`,
                          }}
                        >
                          {QUALITY_LABEL[previewSoul.main.quality] ||
                            previewSoul.main.quality}
                        </div>
                      </div>
                      {previewSoul.isTwin && previewSoul.second && (
                        <div
                          className={`rounded-md border p-2.5 cursor-pointer transition-all ${
                            !soulChoiceConfirmed
                              ? 'border-fuchsia-500/60 bg-fuchsia-900/30 shadow-[0_0_12px_rgba(217_70_239_0.25)]'
                              : 'border-border/60 bg-card/40 hover:border-fuchsia-500/40'
                          }`}
                          onClick={() => {
                            setPreviewSoul((prev) => {
                              if (!prev || !prev.second) return prev;
                              return {
                                ...prev,
                                main: prev.second,
                                second: prev.main,
                              };
                            });
                            setSoulChoiceConfirmed(true);
                          }}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="text-[10px] text-fuchsia-400 font-bold flex items-center gap-1">
                              第二武魂 · 双生武魂
                              {!soulChoiceConfirmed && <CheckCircle2 className="w-3 h-3" />}
                            </div>
                            <span className="text-[10px] text-fuchsia-500/80">设为主修</span>
                          </div>
                          <div
                            className="text-base font-bold"
                            style={{
                              color:
                                (QUALITY_COLOR[previewSoul.second.quality] as string) ||
                                '#f0abfc',
                              textShadow: `0 0 10px ${(QUALITY_COLOR[previewSoul.second.quality] as string) || '#f0abfc'}40`,
                            }}
                          >
                            {previewSoul.second?.name}
                          </div>
                          <div
                            className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold"
                            style={{
                              background: `${(QUALITY_COLOR[previewSoul.second.quality] as string) || '#f0abfc'}20`,
                              color:
                                (QUALITY_COLOR[previewSoul.second.quality] as string) ||
                                '#f0abfc',
                              border: `1px solid ${(QUALITY_COLOR[previewSoul.second.quality] as string) || '#f0abfc'}50`,
                            }}
                          >
                            {QUALITY_LABEL[previewSoul.second.quality] ||
                              previewSoul.second.quality}
                          </div>
                        </div>
                      )}
                      <div className="rounded-md border border-cyan-500/30 bg-cyan-900/20 p-2.5">
                        <div className="text-[10px] text-muted-foreground mb-0.5">先天魂力</div>
                        <div className="text-base font-bold text-cyan-200">
                          {previewSoul.soulPower} 级
                          {previewSoul.soulPower >= 8 && (
                            <span className="ml-2 text-yellow-300 text-xs">天才！</span>
                          )}
                        </div>
                      </div>
                      {previewSoul.isTwin && previewSoul.second && soulChoiceConfirmed && (
                        <div className="text-[11px] text-green-400 text-center pt-1 border-t border-border/30">
                          ✓ 已选择主修：
                          <span className="font-bold">{previewSoul.main.name}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground text-sm mb-2">
                      点击下方按钮抽取预览武魂
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-fuchsia-500/50 text-fuchsia-300 hover:bg-fuchsia-500/20"
                    onClick={handlePreviewReroll}
                    disabled={previewRolling || isAnimating}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${previewRolling ? 'animate-spin' : ''}`}
                    />
                    {previewSoul ? '🔄 再抽一次' : '✨ 抽取预览武魂'}
                  </Button>
                  <div className="text-[10px] text-muted-foreground mt-2 text-center">
                    可无限次重抽，满意后点击下方「确认转世」使用当前预览的武魂
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowWarning(false)}
                  disabled={isAnimating}
                >
                  再想想
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500"
                  onClick={confirmReincarnate}
                  disabled={
                    isAnimating ||
                    (soulChoice === 'reroll' && previewSoul?.isTwin && !soulChoiceConfirmed)
                  }
                >
                  {soulChoice === 'reroll' && previewSoul?.isTwin && !soulChoiceConfirmed
                    ? '请先选择主修武魂'
                    : '确认转世'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 轮回凝聚动画 */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-black/90"
          >
            <div className="relative w-48 h-48 flex items-center justify-center">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border border-purple-400/60"
                  initial={{ width: 0, height: 0, opacity: 0 }}
                  animate={
                    animatePhase === 'gather'
                      ? {
                          width: [0, 120 + i * 30],
                          height: [0, 120 + i * 30],
                          opacity: [0, 0.3 + i * 0.1, 0.2],
                        }
                      : animatePhase === 'burst'
                        ? {
                            width: [120 + i * 30, 400 + i * 80],
                            height: [120 + i * 30, 400 + i * 80],
                            opacity: [0.3, 0],
                          }
                        : {}
                  }
                  transition={{
                    duration: animatePhase === 'gather' ? 1.5 : 0.8,
                    delay: i * 0.15,
                    ease: 'easeOut',
                  }}
                />
              ))}
              <motion.div
                className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 via-purple-400 to-indigo-500 shadow-[0_0_60px_20px_rgba(168_85_247_0.5)]"
                animate={
                  animatePhase === 'gather'
                    ? { scale: [0.1, 1], rotate: [0, 360] }
                    : animatePhase === 'burst'
                      ? { scale: [1, 2.5, 0.1], opacity: [1, 0.8, 0] }
                      : {}
                }
                transition={{ duration: animatePhase === 'gather' ? 1.5 : 0.8, ease: 'easeInOut' }}
              />
            </div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-lg font-bold text-purple-200"
            >
              {animatePhase === 'gather' ? '轮回之力凝聚中...' : '开启新的一世...'}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 重抽武魂结果弹窗 */}
      <AnimatePresence>
        {rerollResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[105] flex items-center justify-center bg-black/80 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-full max-w-sm rounded-xl border border-yellow-500/40 bg-gradient-to-b from-amber-950/95 to-purple-950/95 p-6 text-center shadow-2xl"
            >
              <div className="text-2xl font-bold text-yellow-300 mb-2">
                新一世 · 武魂觉醒
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                轮回之力汇聚，全新武魂已然觉醒
              </p>

              <div className="space-y-3 mb-6">
                <div className="rounded-lg border border-yellow-500/30 bg-black/40 p-4">
                  <div className="text-xs text-muted-foreground mb-1">主修武魂</div>
                  <div
                    className="text-xl font-bold"
                    style={{
                      color:
                        (QUALITY_COLOR[rerollResult.soulQuality] as string) || '#fde68a',
                      textShadow: `0 0 12px ${(QUALITY_COLOR[rerollResult.soulQuality] as string) || '#fde68a'}40`,
                    }}
                  >
                    {rerollResult.soul}
                  </div>
                  <div
                    className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-semibold"
                    style={{
                      background: `${(QUALITY_COLOR[rerollResult.soulQuality] as string) || '#fde68a'}20`,
                      color:
                        (QUALITY_COLOR[rerollResult.soulQuality] as string) || '#fde68a',
                      border: `1px solid ${(QUALITY_COLOR[rerollResult.soulQuality] as string) || '#fde68a'}50`,
                    }}
                  >
                    {QUALITY_LABEL[rerollResult.soulQuality] || rerollResult.soulQuality}
                  </div>
                </div>
                {rerollResult.isTwin && rerollResult.secondSoul && (
                  <div className="rounded-lg border border-fuchsia-500/30 bg-black/40 p-4">
                    <div className="text-xs text-muted-foreground mb-1">第二武魂</div>
                    <div
                      className="text-xl font-bold"
                      style={{
                        color:
                          (QUALITY_COLOR[rerollResult.secondSoulQuality || ''] as string) ||
                          '#f0abfc',
                        textShadow: `0 0 12px ${(QUALITY_COLOR[rerollResult.secondSoulQuality || ''] as string) || '#f0abfc'}40`,
                      }}
                    >
                      {rerollResult.secondSoul}
                    </div>
                    <div
                      className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-semibold"
                      style={{
                        background: `${(QUALITY_COLOR[rerollResult.secondSoulQuality || ''] as string) || '#f0abfc'}20`,
                        color:
                          (QUALITY_COLOR[rerollResult.secondSoulQuality || ''] as string) ||
                          '#f0abfc',
                        border: `1px solid ${(QUALITY_COLOR[rerollResult.secondSoulQuality || ''] as string) || '#f0abfc'}50`,
                      }}
                    >
                      {QUALITY_LABEL[rerollResult.secondSoulQuality || ''] ||
                        rerollResult.secondSoulQuality}
                    </div>
                    <div className="text-[11px] text-fuchsia-400/70 mt-1">
                      双生武魂 · 天赋异禀
                    </div>
                  </div>
                )}
                <div className="rounded-lg border border-cyan-500/30 bg-black/40 p-3">
                  <div className="text-xs text-muted-foreground mb-0.5">先天魂力</div>
                  <div className="text-lg font-bold text-cyan-300">
                    {rerollResult.soulPower} 级
                    {rerollResult.soulPower >= 8 && (
                      <span className="ml-2 text-yellow-300 text-sm">天才！</span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500"
              >
                开始新一世修炼
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
