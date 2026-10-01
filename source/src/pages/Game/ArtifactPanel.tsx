import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sword, Coins, ArrowUp, Sparkles, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/lib/gameStore';
import { getArtifactByDeity, getTrialById } from '@/data/divineTrials';
import { toast } from 'sonner';

interface ArtifactPanelProps {
  onClose?: () => void;
}

export default function ArtifactPanel({ onClose }: ArtifactPanelProps) {
  const { player, upgradeArtifact, getArtifactUpgradeCost } = useGame();
  const dt = player?.divineTrial;
  const trial = dt?.chosenTrialId ? getTrialById(dt.chosenTrialId) : null;
  const artifact = dt?.chosenTrialId ? getArtifactByDeity(dt.chosenTrialId) : null;

  const [upgradeCount, setUpgradeCount] = useState<1 | 10 | 100>(1);

  if (!artifact || !trial || !dt?.artifactDrawn) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-slate-950 via-indigo-950/40 to-slate-950 text-foreground">
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-500/20">
          <div className="flex items-center gap-2">
            <Sword className="h-5 w-5 text-amber-300" />
            <h2 className="text-lg font-bold">神器</h2>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Sword className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>尚未拔出神器</p>
             <p className="text-xs mt-1">需获得神器解锁</p>
          </div>
        </div>
      </div>
    );
  }

  const currentLevel = dt.artifactLevel;
  const maxLevel = artifact.maxLevel;
  const nextLevel = Math.min(currentLevel + upgradeCount, maxLevel);
  const cost = getArtifactUpgradeCost(nextLevel);
  const canUpgrade = currentLevel < maxLevel && (player?.soulCoins ?? 0) >= cost;
  const artifactColor = trial.color;

  // 计算当前属性加成百分比（全属性均衡加成，五维相同，取单值即可）
  const perLevelPct = artifact.perLevelBonus.attack * 100;
  const currentBonus = currentLevel * perLevelPct;
  const nextBonus = (nextLevel - 1) * perLevelPct;
  const maxBonus = (maxLevel - 1) * perLevelPct;

  const handleUpgrade = () => {
    const res = upgradeArtifact(upgradeCount);
    if (res.success) {
      toast.success(`神器升级成功！Lv.${currentLevel} → Lv.${currentLevel + res.levelsUp}`);
    } else {
      toast.error(res.reason ?? '升级失败');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-950 via-amber-950/20 to-slate-950 text-foreground">
      {/* 顶部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-500/20 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Sword className="h-5 w-5 text-amber-300" />
          <h2 className="text-lg font-bold bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent">
            神器
          </h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 md:space-y-6">
        {/* 神器展示区 */}
        <div className="relative aspect-square max-w-[280px] mx-auto">
          {/* 外圈旋转光环 */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 0deg, ${artifactColor}00, ${artifactColor}60, ${artifactColor}00)`,
              filter: 'blur(2px)',
            }}
          />
          {/* 反向内圈 */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-4 rounded-full border border-amber-400/30"
            style={{ borderStyle: 'dashed' }}
          />
          {/* 神器主体 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              <div
                className="w-28 h-36 rounded-2xl flex items-center justify-center text-6xl relative overflow-hidden"
                style={{
                  background: `linear-gradient(145deg, ${artifactColor}40, ${artifactColor}10)`,
                  border: `2px solid ${artifactColor}80`,
                  boxShadow: `0 0 40px ${artifactColor}40, inset 0 0 30px ${artifactColor}20`,
                }}
              >
                <span className="drop-shadow-[0_0_20px_rgba(250_204_21_0.6)]">
                  {artifact.icon}
                </span>
                {/* 顶部金光 */}
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 w-16 h-20 rounded-full"
                  style={{ background: `radial-gradient(ellipse at center, ${artifactColor}80 0%, transparent 70%)` }}
                />
              </div>
              {/* 等级角标 */}
              <div
                className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: artifactColor,
                  color: '#0f172a',
                  boxShadow: `0 0 10px ${artifactColor}`,
                }}
              >
                Lv.{currentLevel}
              </div>
            </motion.div>
          </div>
          {/* 粒子 */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: artifactColor,
                boxShadow: `0 0 6px ${artifactColor}`,
                top: `${30 + Math.sin(i * 60 * Math.PI / 180) * 35}%`,
                left: `${50 + Math.cos(i * 60 * Math.PI / 180) * 35}%`,
              }}
              animate={{
                scale: [0.5, 1.2, 0.5],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>

        {/* 神器信息 */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${artifactColor}25`, color: artifactColor, border: `1px solid ${artifactColor}50` }}
            >
              {artifact.tier === 'supreme' ? '至高神器' : artifact.tier === 'super' ? '超神器' : '神器'}
            </span>
          </div>
          <h3
            className="text-xl font-bold"
            style={{ color: artifactColor, textShadow: `0 0 20px ${artifactColor}40` }}
          >
            {artifact.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{artifact.description}</p>
          <p className="text-xs mt-1">
            <span className="text-slate-400">神器属性：</span>
            <span style={{ color: artifactColor }} className="font-medium">
              {trial.element}
            </span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {trial.name} · 专属神器
          </p>
        </div>

        {/* 属性面板 */}
        <div className="bg-slate-900/60 border border-amber-500/20 rounded-xl p-4 md:p-5 space-y-3 md:space-y-4">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            属性加成
          </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 text-sm">
             <div className="flex justify-between">
               <span className="text-muted-foreground">当前加成</span>
               <span className="text-amber-300 font-medium">+{currentBonus.toFixed(2)}%</span>
             </div>
             <div className="flex justify-between">
               <span className="text-muted-foreground">升级后</span>
               <span className="text-emerald-300 font-medium">
                 {currentLevel < maxLevel ? `+${nextBonus.toFixed(2)}%` : '已满级'}
               </span>
             </div>
             <div className="flex justify-between">
               <span className="text-muted-foreground">每级加成</span>
               <span>+{perLevelPct.toFixed(3)}%</span>
             </div>
             <div className="flex justify-between">
               <span className="text-muted-foreground">满级加成</span>
               <span className="text-amber-300/80">+{maxBonus.toFixed(2)}%</span>
             </div>
             <div className="flex justify-between">
               <span className="text-muted-foreground">等级上限</span>
               <span>{maxLevel}级</span>
             </div>
           </div>

          {/* 进度条 */}
          <div className="pt-1">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Lv.{currentLevel}</span>
              <span>Lv.{maxLevel}</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(currentLevel / maxLevel) * 100}%` }}
                transition={{ duration: 1 }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${artifactColor}, #fcd34d, ${artifactColor})`,
                }}
              />
            </div>
          </div>
        </div>

        {/* 升级操作 */}
        <div className="bg-slate-900/60 border border-amber-500/20 rounded-xl p-4 md:p-5 space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <ArrowUp className="w-4 h-4 text-emerald-400" />
              升级神器
            </h4>
            <div className="text-sm text-amber-300 flex items-center gap-1">
              <Coins className="w-4 h-4" />
              {player?.soulCoins.toLocaleString() ?? 0}
            </div>
          </div>

          {/* 升级数量选择 */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
            {[1, 10, 100].map((n) => (
              <button
                key={n}
                onClick={() => setUpgradeCount(n as 1 | 10 | 100)}
                className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                  upgradeCount === n
                    ? 'bg-amber-500/20 border border-amber-500/60 text-amber-200'
                    : 'bg-slate-800/50 border border-slate-700 text-muted-foreground hover:text-foreground'
                }`}
              >
                {n === 100 ? '百级' : n === 10 ? '十级' : '一级'}
              </button>
            ))}
          </div>

          {/* 消耗 */}
          {currentLevel < maxLevel && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">消耗魂币</span>
              <span className={`font-medium ${(player?.soulCoins ?? 0) >= cost ? 'text-amber-300' : 'text-red-400'}`}>
                {cost.toLocaleString()}
              </span>
            </div>
          )}

          <Button
            onClick={handleUpgrade}
            disabled={!canUpgrade}
            className="w-full h-11 font-bold"
            style={{
              background: canUpgrade ? `linear-gradient(90deg, ${artifactColor}, #fcd34d)` : undefined,
              color: canUpgrade ? '#0f172a' : undefined,
            }}
          >
            {currentLevel >= maxLevel ? (
              <>已满级</>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                升级 Lv.{currentLevel} → Lv.{nextLevel}
              </>
            )}
          </Button>

          {!canUpgrade && currentLevel < maxLevel && (
            <p className="text-xs text-center text-red-400/80">
              魂币不足
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
