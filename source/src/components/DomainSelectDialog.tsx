import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw } from 'lucide-react';
import { useGame, DOMAIN_COLORS, getDomainCultivationAttr, type IDomain } from '@/lib/gameStore';

interface DomainSelectDialogProps {
  domains: IDomain[];
  /** 是否为「随机属性」模式（单卡展示 + 可无限随机重抽） */
  randomMode?: boolean;
  /** 随机重抽回调（randomMode 为 true 时有效） */
  onReroll?: () => void;
  onChoose: (domain: IDomain) => void;
  onClose: () => void;
}

function DomainSelectDialog({ domains, randomMode, onReroll, onChoose, onClose }: DomainSelectDialogProps) {
  const { player } = useGame();
  const [phase, setPhase] = useState<'rolling' | 'reveal'>('rolling');
  const [revealedIndex, setRevealedIndex] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const attr = player ? getDomainCultivationAttr(player.direction, player.martialSoul) : 'strength';
  // 安全兜底：如果属性不在颜色映射中，默认用混沌属性颜色
  const colorSet = DOMAIN_COLORS[attr as keyof typeof DOMAIN_COLORS] || DOMAIN_COLORS.chaos;

  // 单卡模式下显示第一张
  const singleDomain = domains[0];
  const singleAttr = singleDomain?.cultivationAttr || 'chaos';
  const singleColor = DOMAIN_COLORS[singleAttr as keyof typeof DOMAIN_COLORS] || DOMAIN_COLORS.chaos;

  // 滚动阶段：卡片旋转动画（0.8秒，控制在1秒内保证流畅）
  useEffect(() => {
    if (phase !== 'rolling') return;
    const timer = setTimeout(() => {
      setPhase('reveal');
      // 随机模式下默认选中第一张
      if (randomMode) setSelectedIndex(0);
    }, 800);
    return () => clearTimeout(timer);
  }, [phase, randomMode, domains.length]);

  // 揭示阶段：逐个显示卡片（加快节奏，减少重排次数）
  useEffect(() => {
    if (phase !== 'reveal' || randomMode) return;
    let i = 0;
    const interval = setInterval(() => {
      setRevealedIndex(i);
      i++;
      if (i >= domains.length) clearInterval(interval);
    }, 150);
    return () => clearInterval(interval);
  }, [phase, domains.length, randomMode]);

  // 随机模式下，每次 domains 变化都从 rolling 重新开始
  useEffect(() => {
    if (randomMode) {
      setPhase('rolling');
      setSelectedIndex(0);
    }
  }, [domains, randomMode]);

  const handleConfirm = () => {
    if (selectedIndex === null) return;
    onChoose(domains[selectedIndex]);
  };

  const handleReroll = () => {
    if (!randomMode || !onReroll) return;
    setPhase('rolling');
    setSelectedIndex(null);
    onReroll();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto">
      {/* 背景遮罩 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm rounded-2xl border p-5 overflow-hidden"
        style={{
          borderColor: randomMode ? singleColor.primary : colorSet.primary,
          background: 'linear-gradient(180deg, #1a1410 0%, #0f0a08 100%)',
          boxShadow: `0 0 40px ${randomMode ? singleColor.glow : colorSet.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
        }}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* 标题 */}
        <div className="text-center mb-5">
          <div className="text-xs text-muted-foreground mb-1">
            {randomMode ? '领域觉醒 · 随机属性' : '领域觉醒'}
          </div>
          <div
            className="text-xl font-black font-serif"
            style={{
              color: randomMode ? singleColor.primary : colorSet.primary,
              textShadow: `0 0 20px ${randomMode ? singleColor.glow : colorSet.glow}`,
            }}
          >
            {phase === 'rolling' ? '觉醒中...' : (randomMode ? '你的领域' : '选择你的领域')}
          </div>
        </div>

        {/* 随机模式：单卡展示 + 随机按钮 */}
        {randomMode && singleDomain ? (
          <div className="space-y-4 mb-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={singleDomain.id}
                initial={{ opacity: 0, rotateY: 180, scale: 0.95 }}
                animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                exit={{ opacity: 0, rotateY: -180, scale: 0.95 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full rounded-xl p-4 border-2"
                style={{
                  borderColor: singleColor.primary,
                  background: `linear-gradient(135deg, ${singleColor.glow}, transparent 60%)`,
                  boxShadow: `0 0 24px ${singleColor.glow}`,
                  transformStyle: 'preserve-3d',
                  perspective: '1000px',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base font-bold" style={{ color: singleColor.primary }}>
                    {singleDomain.name}
                  </span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full border"
                    style={{
                      color: singleColor.primary,
                      borderColor: `${singleColor.primary}80`,
                      background: `${singleColor.primary}15`,
                    }}
                  >
                    {DOMAIN_COLORS[singleAttr as keyof typeof DOMAIN_COLORS]?.label || singleAttr}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground leading-relaxed">
                  {singleDomain.description}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {Object.entries(singleDomain.baseBonuses).map(([key, val]) => {
                    const pct = Math.round((val as number) * 100);
                    const label = attrLabel(key);
                    return (
                      <span
                        key={key}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-green-900/40 text-green-400 border border-green-500/30"
                      >
                        {label} {val && val > 0 ? '+' : ''}{pct}%
                      </span>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            <button
              onClick={handleReroll}
              disabled={phase === 'rolling'}
              className="w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 text-white border border-violet-400/40 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
            >
              <RefreshCw className="w-4 h-4" />
              随机属性
            </button>

            <div className="text-[10px] text-muted-foreground/60 text-center -mt-2">
              可无限次随机，满意后再确定
            </div>
          </div>
        ) : (
          /* 经典五选二模式：卡片区域 */
          <div className="space-y-3 mb-5">
            {domains.map((domain, i) => {
              const isRevealed = phase === 'reveal' && i <= revealedIndex;
              const isSelected = selectedIndex === i;
              const dAttr = domain.cultivationAttr as keyof typeof DOMAIN_COLORS;
              const dColor = DOMAIN_COLORS[dAttr] || DOMAIN_COLORS.chaos;
              return (
                <motion.button
                  key={domain.id}
                  initial={false}
                  animate={{
                    rotateY: phase === 'rolling' ? [0, 360] : isRevealed ? 0 : 180,
                    scale: isSelected ? 1.02 : 1,
                    opacity: phase === 'rolling' ? 0.7 : isRevealed ? 1 : 0,
                  }}
                  transition={{
                    rotateY: phase === 'rolling'
                      ? { duration: 0.8, repeat: Infinity, ease: 'linear', delay: i * 0.15 }
                      : { duration: 0.4, ease: 'easeOut' },
                    scale: { duration: 0.15 },
                    opacity: { duration: 0.25 },
                  }}
                  onClick={() => phase === 'reveal' && isRevealed && setSelectedIndex(i)}
                  disabled={phase === 'rolling' || !isRevealed}
                  className={`w-full text-left rounded-xl p-4 border-2 transition-all ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-500/10 shadow-lg'
                      : 'border-border/60 bg-card/40 hover:border-cyan-500/50'
                  } ${phase === 'rolling' || !isRevealed ? 'cursor-wait' : 'cursor-pointer'}`}
                  style={{
                    borderColor: isSelected ? dColor.primary : undefined,
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                    willChange: 'transform, opacity',
                  }}
                >
                  {phase === 'rolling' || !isRevealed ? (
                    <div className="flex items-center justify-center h-16">
                      <div className="text-3xl" style={{ textShadow: `0 0 15px ${colorSet.glow}` }}>
                        ✦
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base font-bold" style={{ color: dColor.primary }}>
                          {domain.name}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-800/50 text-cyan-300 border border-cyan-500/40">
                            已选择
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground leading-relaxed">
                        {domain.description}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {Object.entries(domain.baseBonuses).map(([key, val]) => {
                          const pct = Math.round((val as number) * 100);
                          const label = attrLabel(key);
                          return (
                            <span
                              key={key}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-green-900/40 text-green-400 border border-green-500/30"
                            >
                              {label} +{pct}%
                            </span>
                          );
                        })}
                      </div>
                    </>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* 确认按钮 */}
        <button
          onClick={handleConfirm}
          disabled={selectedIndex === null || phase === 'rolling'}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
            selectedIndex !== null && phase === 'reveal'
              ? 'bg-gradient-to-r from-cyan-500 to-cyan-500 text-cyan-950 shadow-lg shadow-cyan-500/30 active:scale-[0.98]'
              : 'bg-muted/30 text-muted-foreground cursor-not-allowed'
          }`}
        >
          确定觉醒
        </button>

        <div className="text-[10px] text-muted-foreground/60 text-center mt-2">
          {randomMode ? '一经选择，不可更改' : '一经选择，不可更改'}
        </div>
      </motion.div>
    </div>
  );
}

function attrLabel(key: string): string {
  const map: Record<string, string> = {
    attack: '攻击',
    defense: '防御',
    speed: '速度',
    spirit: '精神',
    hp: '气血',
    allAttr: '全属性',
    critRate: '暴击率',
    critDmg: '爆伤',
    skillDmg: '魂技伤害',
  };
  return map[key] || key;
}

export default memo(DomainSelectDialog);
