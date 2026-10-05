import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, ArrowLeft, Zap } from 'lucide-react';
import { useGame } from '@/lib/gameStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface LawPanelProps {
  onClose: () => void;
  onBack?: () => void;
}

interface LawInfo {
  key: string;
  name: string;
  fullName: string;
  effect: string;
  color: string;
  icon: string;
}

const LAW_LIST: LawInfo[] = [
  { key: 'time',   name: '时间',  fullName: '时间法则', effect: '速度 +15%',     color: '#a78bfa', icon: '⏳' },
  { key: 'space',  name: '空间',  fullName: '空间法则', effect: '精神 +15%',     color: '#818cf8', icon: '🌀' },
  { key: 'gold',   name: '金',    fullName: '金之法则', effect: '攻击 +15%',     color: '#fcd34d', icon: '⚔️' },
  { key: 'wood',   name: '木',    fullName: '木之法则', effect: '血量 +15%',     color: '#4ade80', icon: '🌿' },
  { key: 'water',  name: '水',    fullName: '水之法则', effect: '防御 +15%',     color: '#38bdf8', icon: '💧' },
  { key: 'fire',   name: '火',    fullName: '火之法则', effect: '攻击 +15%',     color: '#f87171', icon: '🔥' },
  { key: 'earth',  name: '土',    fullName: '土之法则', effect: '防御 +15%',     color: '#d4a373', icon: '🏔️' },
  { key: 'light',  name: '光',    fullName: '光之法则', effect: '全属性 +10%',   color: '#fde68a', icon: '☀️' },
  { key: 'dark',   name: '暗',    fullName: '暗之法则', effect: '全属性 +10%',   color: '#9ca3af', icon: '🌙' },
];

const CHAOS_LAW: LawInfo = {
  key: 'chaos', name: '混沌', fullName: '混沌法则', effect: '全属性 +20%', color: '#c084fc', icon: '🌌',
};

export default function LawPanel({ onClose, onBack }: LawPanelProps) {
  const { player, chooseLawFragment, fuseLaw, godBreakthrough, isGodBottleneck, getGodLevelCap } = useGame();
  const dt = player?.divineTrial;
  const glp = dt?.godLevelProgress;
  const lf = dt?.lawFragments;
  const fused = dt?.lawsFused;
  const pending = dt?.pendingLawFragmentChoices ?? 0;

  const [chooseDialog, setChooseDialog] = useState(false);
  const [breakthroughDialog, setBreakthroughDialog] = useState(false);

  const tierLabel = useMemo(() => {
    if (!glp) return '';
    return glp.currentTier === 'supreme' ? '至高神'
      : glp.currentTier === 'king' ? '神王'
      : glp.currentTier === 'first' ? '一级神'
      : '二级神';
  }, [glp]);

  const isBottleneckNow = player ? isGodBottleneck(player.level) : false;

  const totalFragments = useMemo(() => {
    if (!lf) return 0;
    return LAW_LIST.reduce((s, l) => s + (lf[l.key as keyof typeof lf] as number || 0), 0);
  }, [lf]);

  const handleChoose = (lawType: string) => {
    const r = chooseLawFragment(lawType);
    if (r.success) {
      toast.success(`获得 ${LAW_LIST.find(l => l.key === lawType)?.name}之法则碎片 ×1`);
      if (pending <= 1) setChooseDialog(false);
    } else {
      toast.error(r.reason || '选择失败');
    }
  };

  const handleFuse = (lawType: string) => {
    const r = fuseLaw(lawType);
    if (r.success) {
      const info = lawType === 'chaos' ? CHAOS_LAW : LAW_LIST.find(l => l.key === lawType);
      toast.success(`🎉 融合成功！掌握 ${info?.fullName}`);
    } else {
      toast.error(r.reason || '融合失败');
    }
  };

  const handleBreakthrough = (lawType: string) => {
    const r = godBreakthrough(lawType);
    if (r.success) {
      toast.success(`🌟 神级突破成功！进入下一等级`);
      setBreakthroughDialog(false);
    } else {
      toast.error(r.reason || '突破失败');
    }
  };

  // 可用法则（未消耗的）
  const availableLawsForBreakthrough = useMemo(() => {
    if (!fused) return [];
    const consumed = dt?.lawsConsumedForBreakthrough ?? [];
    return LAW_LIST.filter(l => fused[l.key as keyof typeof fused] && !consumed.includes(l.key));
  }, [fused, dt?.lawsConsumedForBreakthrough]);

  if (!glp?.unlocked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <div>尚未解锁神级修炼</div>
          <div className="text-xs mt-1">继承神位后开启</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full text-foreground p-4 pb-20">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h2 className="text-lg font-bold text-purple-300" style={{ fontFamily: "'Noto Serif SC', serif" }}>
            ⚖️ 法则修炼
          </h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 神级修炼状态 */}
      <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/25 via-card/70 to-indigo-900/20 p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">当前神位</div>
            <div className="text-xl font-bold" style={{ color: glp.currentTier === 'supreme' ? '#fde68a' : glp.currentTier === 'king' ? '#fcd34d' : '#a78bfa' }}>
              {tierLabel}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1">等级上限</div>
            <div className="text-xl font-bold text-purple-300">{glp.levelCap} 级</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          当前等级 {player?.level} 级
          {isBottleneckNow && (
            <span className="ml-2 text-amber-300 font-bold">⚠ 已达瓶颈，需消耗法则突破</span>
          )}
        </div>

        {/* 待选碎片提示 */}
        {pending > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-300" />
                <span className="text-sm font-medium text-purple-200">
                  待选择法则碎片 × {pending}
                </span>
              </div>
              <Button size="sm" onClick={() => setChooseDialog(true)} className="bg-purple-500 hover:bg-purple-600">
                立即选择
              </Button>
            </div>
          </div>
        )}

        {/* 突破按钮 */}
        {isBottleneckNow && (
          <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-amber-200">⚡ 神级突破</span>
              <Button
                size="sm"
                onClick={() => setBreakthroughDialog(true)}
                disabled={availableLawsForBreakthrough.length === 0}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50"
              >
                突破 +10级
              </Button>
            </div>
            <div className="text-[11px] text-amber-300/80">
              消耗 1 个已融合的法则突破当前瓶颈，最高等级由神位决定
              {availableLawsForBreakthrough.length === 0 && <span className="text-red-300">（暂无可用法则）</span>}
            </div>
          </div>
        )}
      </div>

      {/* 法则碎片收集 */}
      <div className="rounded-2xl border border-border/40 bg-card/60 p-4 mb-4">
        <h3 className="text-sm font-semibold mb-3 text-foreground/90">法则碎片收集</h3>
        <div className="text-xs text-muted-foreground mb-3 flex justify-between">
          <span>已收集：{totalFragments} / 27</span>
          <span>每 2 级获得 1 次选择机会</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {LAW_LIST.map((law) => {
            const count = (lf?.[law.key as keyof typeof lf] as number) || 0;
            const isFused = fused?.[law.key as keyof typeof fused];
            return (
              <div
                key={law.key}
                className="relative p-3 rounded-xl border transition-all"
                style={{
                  backgroundColor: isFused ? `${law.color}20` : 'transparent',
                  borderColor: isFused ? `${law.color}60` : `${law.color}20`,
                }}
              >
                <div className="text-2xl text-center mb-1">{law.icon}</div>
                <div className="text-xs text-center font-medium" style={{ color: law.color }}>
                  {law.name}之法则
                </div>
                <div className="text-[10px] text-center text-muted-foreground mt-0.5">
                  {law.effect}
                </div>
                <div className="flex justify-center gap-0.5 mt-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: i < count ? law.color : `${law.color}20`,
                        boxShadow: i < count ? `0 0 4px ${law.color}` : 'none',
                      }}
                    />
                  ))}
                </div>
                {isFused && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold shadow-md">
                    ✓
                  </div>
                )}
                {/* 融合按钮 */}
                {count >= 3 && !isFused && (
                  <Button
                    size="sm"
                    className="w-full mt-2 h-7 text-[10px]"
                    style={{ backgroundColor: law.color, color: '#1a1a2e' }}
                    onClick={() => handleFuse(law.key)}
                  >
                    融合
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 混沌法则（至高神专属） */}
      {glp.currentTier === 'supreme' && (
        <div className="rounded-2xl border border-fuchsia-500/40 bg-gradient-to-br from-fuchsia-900/20 via-card/70 to-purple-900/20 p-4 mb-4">
          <h3 className="text-sm font-semibold mb-3 text-fuchsia-300 flex items-center gap-2">
            <span>🌌</span> 混沌法则（至高神专属）
          </h3>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{ backgroundColor: 'rgba(192,132,252,0.15)', border: '1px solid rgba(192,132,252,0.4)' }}
            >
              🌌
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-fuchsia-200">混沌法则</div>
              <div className="text-xs text-fuchsia-300/80">全属性 +20%</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                151~159 级每级获得 1 碎片 · 169 级可融合
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-2 rounded-full bg-fuchsia-950/50 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-500 transition-all"
                style={{ width: `${Math.min(100, ((lf?.chaos ?? 0) / 9) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-bold text-fuchsia-300 tabular-nums">{lf?.chaos ?? 0} / 9</span>
          </div>
          {(lf?.chaos ?? 0) >= 9 && !fused?.chaos && (player?.level ?? 0) >= 169 && (
            <Button
              className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-600 hover:to-purple-600"
              onClick={() => handleFuse('chaos')}
            >
              🌌 融合混沌法则
            </Button>
          )}
          {fused?.chaos && (
            <div className="text-center text-emerald-300 font-bold py-2">
              ✓ 已掌握混沌法则
            </div>
          )}
          {(lf?.chaos ?? 0) >= 9 && (player?.level ?? 0) < 169 && (
            <div className="text-center text-xs text-amber-300/80 py-1">
              需要达到 169 级才能融合
            </div>
          )}
        </div>
      )}

      {/* 已融合法则总览 */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-900/10 p-4">
        <h3 className="text-sm font-semibold mb-3 text-emerald-300">已掌握法则</h3>
        {LAW_LIST.filter(l => fused?.[l.key as keyof typeof fused]).length === 0 && !fused?.chaos ? (
          <div className="text-center text-xs text-muted-foreground py-4">
            尚未掌握任何法则
          </div>
        ) : (
          <div className="space-y-2">
            {LAW_LIST.filter(l => fused?.[l.key as keyof typeof fused]).map((law) => {
              const consumed = dt?.lawsConsumedForBreakthrough?.includes(law.key);
              return (
                <div
                  key={law.key}
                  className="flex items-center justify-between p-2 rounded-lg"
                  style={{ backgroundColor: `${law.color}10`, border: `1px solid ${law.color}30` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{law.icon}</span>
                    <div>
                      <div className="text-sm font-medium" style={{ color: law.color }}>{law.fullName}</div>
                      <div className="text-[10px] text-muted-foreground">{law.effect}</div>
                    </div>
                  </div>
                  {consumed && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                      已用于突破
                    </span>
                  )}
                </div>
              );
            })}
            {fused?.chaos && (
              <div
                className="flex items-center justify-between p-2 rounded-lg"
                style={{ backgroundColor: 'rgba(192,132,252,0.12)', border: '1px solid rgba(192,132,252,0.4)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌌</span>
                  <div>
                    <div className="text-sm font-bold text-fuchsia-200">混沌法则</div>
                    <div className="text-[10px] text-muted-foreground">全属性 +20%</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                  至高神位
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 选择法则碎片弹窗 */}
      <Dialog open={chooseDialog} onOpenChange={setChooseDialog}>
        <DialogContent className="max-w-md bg-card text-foreground border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-purple-300">选择法则碎片</DialogTitle>
          </DialogHeader>
          <div className="text-xs text-muted-foreground mb-3">
            剩余待选择：<span className="text-purple-300 font-bold">{pending}</span> 次
          </div>
          <div className="grid grid-cols-3 gap-2 max-h-[40vh] overflow-y-auto">
            {LAW_LIST.map((law) => {
              const count = (lf?.[law.key as keyof typeof lf] as number) || 0;
              const isFused = fused?.[law.key as keyof typeof fused];
              const maxed = count >= 3 || isFused; // 已达3个或已融合
              return (
                <button
                  key={law.key}
                  disabled={maxed || pending === 0}
                  onClick={() => handleChoose(law.key)}
                  className={`p-2 rounded-lg border transition-all text-center
                    ${maxed ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                  style={{
                    backgroundColor: maxed ? 'transparent' : `${law.color}10`,
                    borderColor: `${law.color}40`,
                  }}
                >
                  <div className="text-xl mb-1">{law.icon}</div>
                  <div className="text-xs font-medium" style={{ color: law.color }}>{law.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{count}/3</div>
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setChooseDialog(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 突破选择弹窗 */}
      <Dialog open={breakthroughDialog} onOpenChange={setBreakthroughDialog}>
        <DialogContent className="max-w-md bg-card text-foreground border-amber-500/30">
          <DialogHeader>
            <DialogTitle className="text-amber-300">⚡ 神级突破</DialogTitle>
          </DialogHeader>
          <div className="text-sm mb-4">
            消耗 1 个法则，突破当前瓶颈，等级上限 +10 级。
          </div>
          {availableLawsForBreakthrough.length === 0 ? (
            <div className="text-center text-muted-foreground py-6">
              <Zap className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <div className="text-sm">暂无可用法则</div>
              <div className="text-xs mt-1">收集 3 枚相同碎片融合为法则</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {availableLawsForBreakthrough.map((law) => (
                <button
                  key={law.key}
                  onClick={() => handleBreakthrough(law.key)}
                  className="w-full p-3 rounded-lg border flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  style={{
                    backgroundColor: `${law.color}10`,
                    borderColor: `${law.color}50`,
                  }}
                >
                  <span className="text-xl">{law.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-bold" style={{ color: law.color }}>{law.fullName}</div>
                    <div className="text-[10px] text-muted-foreground">{law.effect}</div>
                  </div>
                  <span className="text-[10px] text-amber-300">消耗</span>
                </button>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBreakthroughDialog(false)}>取消</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
