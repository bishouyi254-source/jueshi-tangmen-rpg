import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Sparkles, Check, RotateCcw, ChevronRight, Swords, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/lib/gameStore';
import {
  DIVINE_TRIALS,
  DIVINE_ARTIFACTS,
  getTrialById,
  getArtifactByDeity,
  type IDivineTrial,
} from '@/data/divineTrials';
import { toast } from 'sonner';

const TRIAL_TIER_LABEL = {
  supreme: '至高神考核',
  king: '神王考核',
  first: '一级神考核',
  second: '二级神考核',
} as const;

function getDeityIcon(id: string): string {
  const map: Record<string, string> = {
    'deity-destruction': '💀', 'deity-life': '🌿', 'deity-asura': '⚔️', 'deity-kindness': '💛',
    'deity-evil': '🖤', 'deity-sword': '🗡️', 'deity-spear': '🔱', 'deity-archer': '🏹',
    'deity-sea': '🔱', 'deity-emotion': '💫', 'deity-angel': '👼', 'deity-rakshasa': '😈',
    'deity-destruction2': '💥', 'deity-water': '💧', 'deity-fire': '🔥', 'deity-earth': '🌍',
    'deity-wind': '🌪️', 'deity-light': '✨', 'deity-dark': '🌑', 'deity-greed': '💰',
    'deity-lazy': '😴', 'deity-anger': '😡', 'deity-arrogant': '👑', 'deity-envy': '🐍',
    'deity-lust': '🌹', 'deity-ice': '❄️', 'deity-flower': '🌸', 'deity-forging': '🔨',
    'deity-thunder': '⚡', 'deity-nature': '🍃', 'deity-death': '💀',
    'deity-food': '🍳', 'deity-nine-color': '🌈', 'deity-butterfly': '🦋',
    'deity-speed': '💨', 'deity-war': '⚔️', 'deity-phoenix': '🐦‍🔥',
    // 至高神
    'deity-creation': '⚡', 'deity-dragon-god': '🐉', 'deity-pangu': '🪓',
    'deity-tea': '🍵', 'deity-godslayer': '🗡️', 'deity-fate': '☯️', 'deity-wuji': '🌌',
  };
  return map[id] ?? '⭐';
}

type TrialUI = IDivineTrial & { themeColor: string; examCount: number; deityName: string; shortName: string; icon: string; shortDesc: string };

function trialUI(t: IDivineTrial): TrialUI {
  return {
    ...t,
    themeColor: t.color,
    examCount: t.totalExams,
    deityName: t.name,
    shortName: t.name,
    icon: getDeityIcon(t.id),
    shortDesc: t.description.slice(0, 40),
  };
}

interface DivineTrialPanelProps {
  onClose?: () => void;
}

type View = 'intro' | 'draw' | 'select' | 'detail';

export default function DivineTrialPanel({ onClose }: DivineTrialPanelProps) {
  const { player, performDivineDraw, confirmDivineTrial, refreshDivineDraw } = useGame();
  const dt = player?.divineTrial;
  const [view, setView] = useState<View>('intro');
  const [drawing, setDrawing] = useState(false);
  const [currentDrawResult, setCurrentDrawResult] = useState<IDivineTrial | null>(null);
  const [showMiss, setShowMiss] = useState(false);
  const [selectedForDetail, setSelectedForDetail] = useState<IDivineTrial | null>(null);

  // 根据当前状态决定初始视图
  useEffect(() => {
    if (!dt) return;
    if (dt.chosenTrialId) setView('detail');
    else if (dt.drawnTrials.length > 0) setView('draw');
    else setView('intro');
  }, [dt?.chosenTrialId, dt?.drawnTrials.length]);

  const drawnTrials = useMemo(
    () => (dt?.drawnTrials ?? []).map((id) => getTrialById(id)).filter(Boolean) as IDivineTrial[],
    [dt?.drawnTrials],
  );

  const chosenTrial = useMemo(
    () => (dt?.chosenTrialId ? getTrialById(dt.chosenTrialId) : null),
    [dt?.chosenTrialId],
  );

  const handleDraw = () => {
    if (drawing) return;
    if (!dt) return;
    if (dt.drawIndex >= 7 && drawnTrials.length >= 7) {
      toast.info('7次抽取机会已用完，请选择你的神考');
      return;
    }
    setDrawing(true);
    setCurrentDrawResult(null);
    setShowMiss(false);
    // 点击立即出结果，无动画
    const res = performDivineDraw();
    if (!res.success) {
      toast.error(res.reason ?? '抽取失败');
      setDrawing(false);
      return;
    }
    if (res.isMiss) {
      setShowMiss(true);
      setTimeout(() => {
        setShowMiss(false);
        setDrawing(false);
      }, 800);
    } else if (res.trial) {
      setCurrentDrawResult(res.trial);
      setDrawing(false);
    } else {
      setDrawing(false);
    }
  };

  const handleConfirm = (trial: IDivineTrial) => {
    const res = confirmDivineTrial(trial.id);
    if (res.success) {
      toast.success(`你选择了 ${trial.fullName}！`);
      setView('detail');
    } else {
      toast.error(res.reason ?? '选择失败');
    }
  };

  const handleRefresh = () => {
    if (drawing) return;
    const res = refreshDivineDraw();
    if (res.success) {
      toast.success(`刷新成功！消耗 ${res.cost.toLocaleString()} 魂币`);
      setCurrentDrawResult(null);
      setShowMiss(false);
    } else {
      toast.error(res.reason ?? '刷新失败');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-950 via-indigo-950/40 to-slate-950 text-foreground">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-300" />
          <h2 className="text-lg font-bold bg-gradient-to-r from-yellow-200 to-amber-400 bg-clip-text text-transparent">
            神考之地
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {view === 'intro' && (
            <IntroView key="intro" onStart={() => setView('draw')} />
          )}
          {view === 'draw' && (
            <DrawView
              key="draw"
              drawing={drawing}
              showMiss={showMiss}
              currentResult={currentDrawResult}
              drawnTrials={drawnTrials}
              drawIndex={dt?.drawIndex ?? 0}
              onDraw={handleDraw}
              onRefresh={handleRefresh}
              onConfirmAll={() => setView('select')}
            />
          )}
          {view === 'select' && (
            <SelectView
              key="select"
              drawnTrials={drawnTrials}
              onBack={() => setView('draw')}
              onConfirm={handleConfirm}
            />
          )}
          {view === 'detail' && chosenTrial && (
            <TrialDetailView key="detail" trial={chosenTrial} onClose={onClose} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============ 介绍页 ============
function IntroView({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 md:p-6 space-y-4 md:space-y-6"
    >
      <div className="text-center space-y-3">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400/30 to-amber-600/20 border border-yellow-400/40 shadow-[0_0_30px_rgba(250_204_21_0.3)]"
        >
          <Crown className="h-10 w-10 text-yellow-300" />
        </motion.div>
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
          神考之地
        </h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          传说之中，魂师修炼至巅峰，便可触及神的领域。
          <br />
          在此地，你将抽取属于自己的神位传承，历经重重考核，最终继承神位，突破百级！
        </p>
      </div>

      <div className="bg-slate-900/60 border border-cyan-500/20 rounded-xl p-4 space-y-2">
        <h3 className="font-semibold text-cyan-300 flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> 抽取规则
        </h3>
        <ul className="text-sm text-muted-foreground space-y-1.5">
          <li>• 共有 <span className="text-yellow-300 font-medium">7次</span> 抽取机会</li>
           <li>• 每次抽取<span className="text-emerald-300 font-medium">必定获得</span> <span className="text-yellow-300">至高神</span> / <span className="text-red-300">神王</span> / <span className="text-purple-300">一级神</span> / <span className="text-blue-300">二级神</span> 考核之一</li>
          <li>• 7次抽取完毕后，可自由选择其一传承</li>
          <li>• 神位等级越高，考核难度越大，奖励越丰厚</li>
        </ul>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-gradient-to-b from-red-950/60 to-transparent border border-red-500/30 rounded-lg p-3">
          <div className="text-xs text-yellow-300 mb-1">至高神考核</div>
          <div className="text-xs text-red-300 mb-1">神王考核</div>
          <div className="text-lg font-bold text-red-200">15%</div>
          <div className="text-[10px] text-red-400/70">九考</div>
        </div>
        <div className="bg-gradient-to-b from-purple-950/60 to-transparent border border-purple-500/30 rounded-lg p-3">
          <div className="text-xs text-purple-300 mb-1">一级神考核</div>
          <div className="text-lg font-bold text-purple-200">45%</div>
          <div className="text-[10px] text-purple-400/70">7-9考</div>
        </div>
        <div className="bg-gradient-to-b from-blue-950/60 to-transparent border border-blue-500/30 rounded-lg p-3">
          <div className="text-xs text-blue-300 mb-1">二级神考核</div>
          <div className="text-lg font-bold text-blue-200">40%</div>
          <div className="text-[10px] text-blue-400/70">七考</div>
        </div>
      </div>

      <Button
        onClick={onStart}
        className="w-full h-12 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-900 font-bold shadow-lg shadow-yellow-500/20"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        开始抽取神考
      </Button>
    </motion.div>
  );
}

// ============ 抽取页 ============
function DrawView({
  drawing,
  showMiss,
  currentResult,
  drawnTrials,
  drawIndex,
  onDraw,
  onRefresh,
  onConfirmAll,
}: {
  drawing: boolean;
  showMiss: boolean;
  currentResult: IDivineTrial | null;
  drawnTrials: IDivineTrial[];
  drawIndex: number;
  onDraw: () => void;
  onRefresh: () => void;
  onConfirmAll: () => void;
}) {
  const canDraw = drawIndex < 7;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 md:p-6 space-y-4 md:space-y-6"
    >
      <div className="text-center">
        <div className="text-sm text-muted-foreground">已抽取 {drawnTrials.length} / 7</div>
        <div className="flex justify-center gap-1.5 mt-2">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`w-6 h-1.5 rounded-full transition-colors ${
                i < drawnTrials.length ? 'bg-yellow-400' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 抽卡转盘区域 */}
       <div className="relative aspect-square max-w-[320px] md:max-w-[380px] mx-auto">
        <DrawRoulette spinning={drawing} result={currentResult} miss={showMiss} />
      </div>

      {/* 已抽取的卡片缩略 */}
      {drawnTrials.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">已抽取的神考：</div>
          <div className="grid grid-cols-7 gap-1.5 md:gap-2">
            {drawnTrials.map((t, i) => (
              <motion.div
                key={t.id + i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                className="aspect-[3/4] rounded-lg border text-[10px] flex flex-col items-center justify-center p-1 text-center font-medium"
                style={{
                  background: `linear-gradient(145deg, ${t.color}20, transparent)`,
                  borderColor: `${t.color}50`,
                  color: t.color,
                }}
              >
                <div className="text-lg leading-none mb-1">{getDeityIcon(t.id)}</div>
                <div className="truncate w-full leading-tight">{t.name.replace(/考核$/, '')}</div>
              </motion.div>
            ))}
            {Array.from({ length: 7 - drawnTrials.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="aspect-[3/4] rounded-lg border border-dashed border-slate-700 flex items-center justify-center text-slate-600 text-xl"
              >
                ?
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="space-y-2 pt-2">
        {canDraw ? (
          <Button
            onClick={onDraw}
            disabled={drawing}
            className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-bold shadow-lg shadow-cyan-500/20"
          >
            {drawing ? (
              <>
                <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                抽取中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                第 {drawnTrials.length + 1} 次抽取
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={onConfirmAll}
            className="w-full h-12 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-900 font-bold shadow-lg shadow-yellow-500/20"
          >
            <Crown className="w-4 h-4 mr-2" />
            选择我的神考
          </Button>
        )}
        {!canDraw && (
          <p className="text-center text-xs text-muted-foreground">
            7次抽取已完成，点击上方按钮选择你要传承的神位
          </p>
        )}
        <Button
          onClick={onRefresh}
          disabled={drawing}
          variant="outline"
          className="w-full h-10 border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          刷新神考（10万魂币）
        </Button>
      </div>
    </motion.div>
  );
}

// 抽卡转盘/光效动画
function DrawRoulette({ spinning, result, miss }: { spinning: boolean; result: IDivineTrial | null; miss: boolean }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* 外圈光环 */}
      <motion.div
        animate={spinning ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: 2, repeat: spinning ? Infinity : 0, ease: 'linear' }}
        className="absolute inset-0 rounded-full border-2 border-cyan-400/40"
        style={{
          background: spinning
            ? 'conic-gradient(from 0deg, rgba(34,211,238,0.1), rgba(167,139,250,0.3), rgba(250,204,21,0.3), rgba(248,113,113,0.3), rgba(34,211,238,0.1))'
            : 'none',
        }}
      />
      <motion.div
        animate={spinning ? { rotate: -360 } : { rotate: 0 }}
        transition={{ duration: 3, repeat: spinning ? Infinity : 0, ease: 'linear' }}
        className="absolute inset-6 rounded-full border border-purple-400/30"
      />

      {/* 中心内容 */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              className="text-center"
            >
              <TrialCardMini trial={result} />
            </motion.div>
          ) : miss ? (
            <motion.div
              key="miss"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="text-center text-slate-400"
            >
              <div className="text-5xl mb-2">💨</div>
              <div className="font-medium">未抽中</div>
              <div className="text-xs text-slate-500">再来一次吧</div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="text-6xl mb-3">
                {spinning ? '✨' : '🎴'}
              </div>
              <div className="text-sm text-slate-400">
                {spinning ? '神之意志正在显现...' : '点击下方按钮抽取'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 粒子 */}
      {spinning && (
        <>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-cyan-300"
              initial={{ top: '50%', left: '50%', opacity: 1 }}
              animate={{
                top: ['50%', `${20 + Math.random() * 60}%`],
                left: ['50%', `${10 + (i * 11) % 80}%`],
                opacity: [1, 0],
                scale: [1, 0.3],
              }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </>
      )}
    </div>
  );
}

function TrialCardMini({ trial }: { trial: IDivineTrial }) {
  const tierLabel = TRIAL_TIER_LABEL[trial.tier];
  return (
    <div
      className="w-44 rounded-xl p-4 text-center relative overflow-hidden"
      style={{
        background: `linear-gradient(145deg, ${trial.color}30, ${trial.color}08)`,
        border: `1px solid ${trial.color}80`,
        boxShadow: `0 0 30px ${trial.color}30`,
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      <div className="text-3xl mb-2">{getDeityIcon(trial.id)}</div>
      <div
        className="text-xs font-medium mb-1 px-2 py-0.5 rounded-full inline-block"
        style={{ backgroundColor: `${trial.color}30`, color: trial.color }}
      >
        {tierLabel}
      </div>
      <div className="font-bold text-lg mb-1" style={{ color: trial.color }}>
        {trial.fullName}
      </div>
      <div className="text-xs text-slate-300">{trial.totalExams}考 · {trial.name}</div>
    </div>
  );
}

// ============ 选择页 ============
function SelectView({
  drawnTrials,
  onBack,
  onConfirm,
}: {
  drawnTrials: IDivineTrial[];
  onBack: () => void;
  onConfirm: (t: IDivineTrial) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-4 md:p-6 space-y-4 md:space-y-6"
    >
      <div className="text-center space-y-1">
        <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-yellow-200 to-amber-400 bg-clip-text text-transparent">
          选择你的神考
        </h3>
        <p className="text-xs text-muted-foreground">
          7次抽取已完成，请慎重选择你要传承的神位
        </p>
      </div>

      <div className="space-y-3">
        {drawnTrials.map((t, i) => (
          <motion.div
            key={t.id + i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="relative rounded-xl p-4 cursor-pointer hover:brightness-125 transition-all group"
            style={{
              background: `linear-gradient(145deg, ${t.color}25, transparent)`,
              border: `1px solid ${t.color}60`,
            }}
            onClick={() => onConfirm(t)}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: `${t.color}25`, border: `1px solid ${t.color}50` }}
              >
                {getDeityIcon(t.id)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${t.color}30`, color: t.color }}
                  >
                    {TRIAL_TIER_LABEL[t.tier]}
                  </span>
                  <span className="font-bold" style={{ color: t.color }}>
                    {t.fullName}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t.name} · {t.totalExams}考
                </div>
                <div className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {t.description}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-foreground shrink-0" />
            </div>
          </motion.div>
        ))}
      </div>

      <button
        onClick={onBack}
        className="w-full text-sm text-muted-foreground hover:text-foreground py-2"
      >
        ← 返回抽取
      </button>
    </motion.div>
  );
}

// ============ 神考详情页 ============
function TrialDetailView({ trial, onClose }: { trial: IDivineTrial; onClose?: () => void }) {
  const { player, attributes, acceptExam, checkExamComplete, completeExam, drawArtifact, inheritDeity, startBattle, upgradeArtifact, getArtifactUpgradeCost } = useGame();
  const dt = player?.divineTrial;
  const artifact = getArtifactByDeity(trial.id);
  const attrs = attributes;

  const handleAccept = (examIndex: number) => {
    const res = acceptExam(examIndex);
    if (!res.success) toast.error(res.reason ?? '接取失败');
  };

  const acceptedForExam = (examIndex: number): boolean => {
    return (dt?.currentExamIndex ?? 0) >= examIndex;
  };

  const handleComplete = (examIndex: number) => {
    const res = completeExam(examIndex);
    if (res.success) {
      toast.success(`第${examIndex}考完成！${res.rewards.join('，')}`);
    } else {
      toast.error(res.reason ?? '完成失败');
    }
  };

  const handleDrawArtifact = () => {
    const res = drawArtifact();
    if (res.success) toast.success(`神器拔出成功！${res.rewards?.join('、') || ''}`);
    else toast.error(res.reason ?? '拔出失败');
  };

  const handleInherit = () => {
    const res = inheritDeity();
    if (res.success) {
      toast.success(`恭喜继承${trial.name}神位！`);
    } else {
      toast.error(res.reason ?? '继承失败');
    }
  };

  // 第一考：帝天挑战（自动接取后进入战斗）
   const handleChallengeDiTian = () => {
     if (!player || !attrs) return;
     if (dt?.firstExamDiTianDefeated) {
       toast.info('已击败过帝天');
       return;
     }
     // 若尚未接取第一考，先自动接取
     if (!acceptedForExam(1)) {
       const res = acceptExam(1);
       if (!res.success) {
         toast.error(res.reason ?? '接取失败');
         return;
       }
     }
     startBattle({
      battleType: 'divine-ditian',
      locationId: 'divine-exam-1',
      enemy: {
        id: 'ditian-divine',
        name: '兽神·帝天',
        years: 800000,
        qualityColor: '#dc2626',
        qualityLabel: '八十万年',
        hp: Math.max(100, Math.round(attrs.hp * 8)), // 帝天血量（8倍玩家血量）
        attack: Math.max(1, Math.round(attrs.attack * 1.45)),
        defense: Math.max(1, Math.round(attrs.defense * 1.4)),
        speed: Math.max(1, Math.round(attrs.speed * 1.1)),
        spirit: Math.max(1, Math.round(attrs.spirit * 1.3)),
        skillName: '黑暗龙炎',
        skillDesc: '黑龙一族的毁灭之焰',
        element: 'dark',
      },
      meta: { examIndex: 1 },
    });
    onClose?.();
  };

  // 第三考：击败指定魂兽（自动接取后进入战斗）
   const handleChallengeBeast = () => {
     if (!player || !attrs) return;
     if (dt?.beastDefeated) {
       toast.info('已击败过该魂兽');
       return;
     }
     // 若尚未接取第三考，先自动接取
     if (!acceptedForExam(3)) {
       const res = acceptExam(3);
       if (!res.success) {
         toast.error(res.reason ?? '接取失败');
         return;
       }
     }
     const exam = trial.exams.find((e) => e.index === 3);
    const beastName = (exam as any)?.beastName || '邪眼暴君主宰';
    const yearsLabel = exam?.description.match(/（(.+?)）/)?.[1] || '七十九万年';
    const yearsNum = yearsLabel.includes('百万') ? 1000000 : yearsLabel.includes('万') ? parseInt(yearsLabel) * 10000 : 790000;
    startBattle({
      battleType: 'divine-beast',
      locationId: 'divine-exam-3',
      enemy: {
        id: 'divine-beast',
        name: beastName,
        years: yearsNum,
        qualityColor: '#dc2626',
        qualityLabel: yearsLabel,
        hp: Math.max(100, Math.round(attrs.hp * 12)), // 神考凶兽血量（12倍玩家血量）
        attack: Math.max(1, Math.round(attrs.attack * 1.7)),
        defense: Math.max(1, Math.round(attrs.defense * 1.5)),
        speed: Math.max(1, Math.round(attrs.speed * 1.1)),
        spirit: Math.max(1, Math.round(attrs.spirit * 1.1)),
        skillName: '邪眼射线',
        skillDesc: '极致之邪的毁灭光束',
        element: 'evil',
      },
      meta: { examIndex: 3 },
    });
    onClose?.();
  };

  // 第二考：神王化身挑战（自动接取后进入战斗）
   const handleChallengeAvatar = () => {
     if (!player || !attrs) return;
     if (dt?.avatarDefeated) {
       toast.info('已击败过化身');
       return;
     }
     if ((dt?.avatarAttempts ?? 0) >= 7) {
       toast.error('7次挑战机会已用完');
       return;
     }
     // 若尚未接取第二考，先自动接取
     if (!acceptedForExam(2)) {
       const res = acceptExam(2);
       if (!res.success) {
         toast.error(res.reason ?? '接取失败');
         return;
       }
     }
     startBattle({
      battleType: 'divine-avatar',
      locationId: 'divine-exam-2',
      enemy: {
        id: 'divine-avatar',
        name: `${trial.name}·化身`,
        years: 999999,
        qualityColor: trial.color,
        qualityLabel: trial.tier === 'supreme' ? '至高神级' : trial.tier === 'king' ? '神王级' : '一级神',
        hp: Math.max(100, Math.round(attrs.hp * (trial.tier === 'supreme' ? 25 : trial.tier === 'king' ? 20 : 14))),
        attack: Math.max(1, Math.round(attrs.attack * 2.2)), // 神王化身攻击力大幅提升
        defense: Math.max(1, Math.round(attrs.defense * 1.8)),
        speed: Math.max(1, Math.round(attrs.speed * 1.2)),
        spirit: Math.max(1, Math.round(attrs.spirit * 1.5)),
        skillName: '神之投影',
        skillDesc: '神位力量的微弱投影',
        element: 'divine',
      },
      meta: { examIndex: 2 },
    });
    onClose?.();
  };

  const allDone = trial.exams.every((e) => dt?.completedExams.includes(e.index));

   return (
     <motion.div
       initial={{ opacity: 0, x: 20 }}
       animate={{ opacity: 1, x: 0 }}
       exit={{ opacity: 0, x: -20 }}
       className="p-4 md:p-6 space-y-4 md:space-y-6"
     >
       {/* 神位头图 */}
       <div
         className="rounded-xl p-5 md:p-8 text-center relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${trial.color}40 0%, transparent 60%), linear-gradient(225deg, ${trial.color}20 0%, transparent 70%), rgba(15,23,42,0.8)`,
          border: `1px solid ${trial.color}50`,
        }}
      >
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="text-5xl md:text-6xl mb-2 md:mb-3"
        >
          {getDeityIcon(trial.id)}
        </motion.div>
        <div className="text-xs px-2 py-0.5 rounded-full inline-block mb-2" style={{ backgroundColor: `${trial.color}30`, color: trial.color }}>
          {TRIAL_TIER_LABEL[trial.tier]}
        </div>
        <h2 className="text-xl font-bold" style={{ color: trial.color }}>
          {trial.fullName}
        </h2>
        <div className="text-sm text-slate-300 mt-1">传承者：{trial.name}</div>
         <div className="text-xs text-muted-foreground mt-2">
           亲和度 {dt?.affinityPct ?? 0}% · 神力 {dt?.divinePowerPct ?? 0}%
         </div>
         {(dt?.pendingLevelBonus ?? 0) > 0 && (
           <div className="text-xs text-amber-300 mt-2 flex items-center gap-1">
             <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
             有 {dt?.pendingLevelBonus} 级奖励待突破瓶颈后自动发放
           </div>
         )}
        <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${dt?.affinityPct ?? 0}%` }}
            transition={{ duration: 0.8 }}
            className="h-full"
            style={{ background: `linear-gradient(90deg, ${trial.color}, white)` }}
          />
        </div>
      </div>

      {/* 描述 */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
        <p className="text-sm text-slate-300 leading-relaxed">{trial.description}</p>
      </div>

      {/* 神器卡片（拔出后显示） */}
      {dt?.artifactDrawn && artifact && (
        <div className="rounded-xl p-4 mb-3 border border-yellow-500/40 bg-gradient-to-r from-yellow-500/10 to-amber-500/5">
          <div className="flex items-center justify-between mb-2">
             <div>
               <div className="text-sm font-semibold text-yellow-200">{artifact.name}</div>
               <div className="text-xs text-amber-300/80">
                 {artifact.tier === 'supreme' ? '至高神器' : artifact.tier === 'super' ? '超神器' : '神器'} · Lv.{dt.artifactLevel}/{artifact.maxLevel}
               </div>
             </div>
              <div className="text-right text-xs leading-tight">
                 <div className="text-amber-200">攻+{((artifact.perLevelBonus.attack * dt.artifactLevel) * 100).toFixed(1)}% 防+{((artifact.perLevelBonus.defense * dt.artifactLevel) * 100).toFixed(1)}%</div>
                <div className="text-amber-300/60">速+{((artifact.perLevelBonus.speed * dt.artifactLevel) * 100).toFixed(1)}% 精+{((artifact.perLevelBonus.spirit * dt.artifactLevel) * 100).toFixed(1)}% 血+{((artifact.perLevelBonus.hp * dt.artifactLevel) * 100).toFixed(1)}%</div>
              </div>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all"
              style={{ width: `${((dt.artifactLevel ?? 1) / artifact.maxLevel) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                const res = upgradeArtifact(1);
                if (res.success) toast.success(`神器升级成功！+${res.levelsUp}级`);
                else toast.error(res.reason ?? '升级失败');
              }}
              disabled={(dt.artifactLevel ?? 1) >= artifact.maxLevel}
              className="flex-1 h-8 text-xs bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500"
            >
              {(dt.artifactLevel ?? 1) >= artifact.maxLevel
                ? '已满级'
                : `升级（${getArtifactUpgradeCost((dt.artifactLevel ?? 1) + 1) - getArtifactUpgradeCost(dt.artifactLevel ?? 1)} 魂币）`}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const res = upgradeArtifact(10);
                if (res.success) toast.success(`连升${res.levelsUp}级！`);
                else toast.error(res.reason ?? '升级失败');
              }}
              disabled={(dt.artifactLevel ?? 1) >= artifact.maxLevel}
              className="h-8 text-xs"
            >
              +10级
            </Button>
          </div>
        </div>
      )}

      {/* 神考列表 */}
      <div className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400" />
          考核内容
        </h3>
        {trial.exams.map((exam, i) => {
          const completed = dt?.completedExams.includes(exam.index);
          const failed = dt?.failedExams.includes(exam.index);
          const canAccept =
            !completed &&
            (dt?.currentExamIndex ?? 0) < exam.index &&
            (i === 0 || (dt?.completedExams.includes(trial.exams[i - 1].index) ?? false) || (dt?.failedExams.includes(trial.exams[i - 1].index) ?? false));
          const canComplete = completed ? false : checkExamComplete(exam.index);
          const accepted = (dt?.currentExamIndex ?? 0) >= exam.index || (dt?.completedExams.includes(exam.index) ?? false);
          const isArtifactExam = exam.type === 'drawArtifact';
          // 倒数第二考（reachLevel + targetLevel=99）的特殊提示
          const isLevel99Exam = exam.type === 'reachLevel' && (exam.targetLevel ?? 0) >= 99;
          const playerLevel = player?.level ?? 0;
          const effectiveLevel = Math.min(playerLevel, 99);
          const level99NotReady = isLevel99Exam && accepted && !completed && effectiveLevel < 99;
          // 战斗型考核判定
          // 第一考类型为 absorbRing（神王/一级神，击败帝天 或 吸收第八魂环）或 类型为 defeatBeast 且 beastName 为帝天（至高神第一考）→ 走帝天挑战
          const isDiTianExam = exam.index === 1 && (exam.type === 'absorbRing' || (exam.type === 'defeatBeast' && (exam as any).beastName === '帝天')) && trial.tier !== 'second';
          const isAvatarExam = exam.type === 'defeatAvatar';
          const isBeastExam = exam.type === 'defeatBeast' && (exam as any).beastName !== '帝天'; // 排除帝天（走专门分支）
          const isBattleExam = isDiTianExam || isAvatarExam || isBeastExam;
           const canChallengeDiTian = isDiTianExam && (accepted || canAccept) && !dt?.firstExamDiTianDefeated && !completed;
           const canChallengeAvatar = isAvatarExam && (accepted || canAccept) && !dt?.avatarDefeated && !completed && (dt?.avatarAttempts ?? 0) < 7;
           const canChallengeBeast = isBeastExam && (accepted || canAccept) && !dt?.beastDefeated && !completed;
          // 战斗型考核已接取且未完成时，显示挑战按钮而非"进行中"
          const canChallengeNow = canChallengeDiTian || canChallengeAvatar || canChallengeBeast;
          const inProgress = accepted && !completed && !canComplete && !canChallengeNow && !isArtifactExam;

          return (
            <div
              key={exam.index}
              className={`rounded-lg p-3 border transition-colors ${
                completed
                  ? 'bg-emerald-950/30 border-emerald-500/30'
                  : failed
                  ? 'bg-red-950/30 border-red-500/30'
                  : canAccept
                  ? 'bg-slate-900/60 border-cyan-500/30'
                  : 'bg-slate-900/30 border-slate-700/40 opacity-70'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    completed
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-300 border border-slate-600'
                  }`}
                >
                  {completed ? <Check className="w-4 h-4" /> : exam.index}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{exam.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{exam.description}</div>
                   {exam.reward && (
                      <div className="text-xs text-amber-300/90 mt-1 leading-relaxed">
                        奖励：
                        {exam.reward.affinityPct ? `亲和+${exam.reward.affinityPct}% ` : ''}
                        {exam.reward.divinePowerPct ? `神力+${exam.reward.divinePowerPct}% ` : ''}
                        {exam.reward.levelUp ? `等级+${exam.reward.levelUp} ` : ''}
                        {exam.reward.ringYearsAll ? `魂环+${exam.reward.ringYearsAll >= 10000 ? (exam.reward.ringYearsAll / 10000).toFixed(1) + '万' : exam.reward.ringYearsAll + '年'} ` : ''}
                        {exam.reward.boneYearsAll ? `魂骨+${exam.reward.boneYearsAll >= 10000 ? (exam.reward.boneYearsAll / 10000).toFixed(1) + '万' : exam.reward.boneYearsAll + '年'} ` : ''}
                        {exam.reward.attrBonusPct ? `全属性+${exam.reward.attrBonusPct}%` : ''}
                      </div>
                   )}
                   {level99NotReady && (
                     <div className="text-xs text-red-400 mt-1 font-medium">
                       ⚠ 需要达到99级才能完成此考核（当前 {effectiveLevel} 级）
                     </div>
                   )}
                  {isArtifactExam && artifact && (
                    <div className="text-xs text-yellow-300 mt-1">
                      神器：{artifact.name} {dt?.artifactDrawn ? '✓ 已拔出' : ''}
                    </div>
                  )}
                </div>
                  <div className="shrink-0">
                    {completed ? (
                      <span className="text-xs text-emerald-400 font-medium">已完成</span>
                    ) : inProgress ? (
                      <span className="text-xs text-cyan-300 font-medium">进行中</span>
                    ) : isArtifactExam && dt?.artifactDrawn ? (
                      <span className="text-xs text-emerald-400">已拔出</span>
                    ) : isArtifactExam && canAccept ? (
                      <Button size="sm" variant="secondary" onClick={handleDrawArtifact} className="h-7 text-xs">
                        拔出神器
                      </Button>
                    ) : canChallengeDiTian ? (
                      <Button size="sm" onClick={handleChallengeDiTian} className="h-7 text-xs bg-red-600 hover:bg-red-700">
                        挑战帝天
                      </Button>
                     ) : canChallengeAvatar ? (
                       <div className="flex flex-col items-end gap-1">
                         <Button size="sm" onClick={handleChallengeAvatar} className="h-7 text-xs" style={{ backgroundColor: trial.color, color: '#0f172a' }}>
                           挑战化身
                         </Button>
                          <span className="text-[9px] text-slate-400">已用 {dt?.avatarAttempts ?? 0}/7 次</span>
                       </div>
                     ) : canChallengeBeast ? (
                       <Button size="sm" onClick={handleChallengeBeast} className="h-7 text-xs bg-red-600 hover:bg-red-700">
                         挑战{(exam as any)?.beastName?.slice(0, 4) || '魂兽'}
                       </Button>
                     ) : canComplete ? (
                      <Button size="sm" onClick={() => handleComplete(exam.index)} className="h-7 text-xs">
                        领取奖励
                      </Button>
                    ) : isDiTianExam && dt?.firstExamDiTianDefeated ? (
                      <span className="text-xs text-emerald-400">已击败</span>
                     ) : isAvatarExam && dt?.avatarDefeated ? (
                       <span className="text-xs text-emerald-400">已击败</span>
                     ) : isBeastExam && dt?.beastDefeated ? (
                       <span className="text-xs text-emerald-400">已击败</span>
                     ) : canAccept ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAccept(exam.index)}
                        className="h-7 text-xs"
                      >
                        接取
                      </Button>
                    ) : null}
                  </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 继承神位 */}
      {allDone && !dt?.inherited && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-5 text-center"
          style={{
            background: `linear-gradient(135deg, ${trial.color}40, transparent)`,
            border: `1px solid ${trial.color}70`,
          }}
        >
          <Crown className="w-10 h-10 text-yellow-300 mx-auto mb-2" />
          <h3 className="font-bold text-lg" style={{ color: trial.color }}>
            全部考核完成！
          </h3>
          <p className="text-sm text-slate-300 mt-1">
            你已通过 {trial.fullName} 的全部考验，可继承 {trial.name} 之位
          </p>
          <p className="text-xs text-amber-300 mt-2">
            继承后突破百级，全属性 +{trial.inheritBonus.allAttrPct}%
          </p>
          <Button
            onClick={handleInherit}
            className="mt-4 w-full h-11 bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-900 font-bold"
          >
            继承神位
          </Button>
        </motion.div>
      )}

      {dt?.inherited && (
        <div
          className="rounded-xl p-4 text-center"
          style={{
            background: `linear-gradient(135deg, ${trial.color}30, transparent)`,
            border: `1px solid ${trial.color}60`,
          }}
        >
          <div className="text-3xl mb-1">👑</div>
          <div className="font-bold" style={{ color: trial.color }}>
            已继承 {trial.name} 神位
          </div>
          <div className="text-xs text-slate-300 mt-1">
            百级神祗 · 全属性 +{trial.inheritBonus.allAttrPct}%
          </div>
        </div>
      )}
    </motion.div>
  );
}
