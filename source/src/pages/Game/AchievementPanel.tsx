import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Lock, Sparkles } from 'lucide-react';
import { useGame } from '@/lib/gameStore';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, type AchievementCategory, type IAchievement } from '@/data/achievements';
import { Badge } from '@/components/ui/badge';

interface AchievementPanelProps {
  onClose: () => void;
}

const RARITY_STYLES: Record<IAchievement['rarity'], { label: string; border: string; bg: string; text: string; glow: string }> = {
  common: {
    label: '普通',
    border: 'border-gray-500/40',
    bg: 'bg-gray-500/10',
    text: 'text-gray-300',
    glow: '',
  },
  rare: {
    label: '稀有',
    border: 'border-green-500/50',
    bg: 'bg-green-500/10',
    text: 'text-green-300',
    glow: 'shadow-[0_0_20px_rgba(34_197_94_0.2)]',
  },
  epic: {
    label: '史诗',
    border: 'border-purple-500/50',
    bg: 'bg-purple-500/10',
    text: 'text-purple-300',
    glow: 'shadow-[0_0_25px_rgba(168_85_247_0.25)]',
  },
  legendary: {
    label: '传说',
    border: 'border-amber-500/60',
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
    glow: 'shadow-[0_0_30px_rgba(245_158_11_0.3)]',
  },
  mythic: {
    label: '神话',
    border: 'border-red-500/60',
    bg: 'bg-gradient-to-br from-red-500/20 via-amber-500/20 to-purple-500/20',
    text: 'text-amber-200',
    glow: 'shadow-[0_0_35px_rgba(239_68_68_0.35)]',
  },
};

export default function AchievementPanel({ onClose }: AchievementPanelProps) {
  const { player, getAchievementProgress, unlockedAchievementIds, clearNewAchievements } = useGame();
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all');

  // 打开面板时清除新成就提示
  useEffect(() => {
    if (player?.achievementStats?.newlyUnlocked?.length) {
      clearNewAchievements();
    }
  }, [player, clearNewAchievements]);

  const totalCount = ACHIEVEMENTS.length;
  const unlockedCount = unlockedAchievementIds.size;
  const progressPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const filteredAchievements = useMemo(() => {
    if (activeCategory === 'all') return ACHIEVEMENTS;
    return ACHIEVEMENTS.filter((a) => a.category === activeCategory);
  }, [activeCategory]);

  // 已完成排前面
  const sortedAchievements = useMemo(() => {
    return [...filteredAchievements].sort((a, b) => {
      const aDone = unlockedAchievementIds.has(a.id);
      const bDone = unlockedAchievementIds.has(b.id);
      if (aDone && !bDone) return -1;
      if (!aDone && bDone) return 1;
      const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'common'];
      const aIdx = rarityOrder.indexOf(a.rarity);
      const bIdx = rarityOrder.indexOf(b.rarity);
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
    });
  }, [filteredAchievements, unlockedAchievementIds]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; unlocked: number }> = {};
    for (const cat of ACHIEVEMENT_CATEGORIES) {
      const items = ACHIEVEMENTS.filter((a) => a.category === cat.key);
      const unlocked = items.filter((a) => unlockedAchievementIds.has(a.id)).length;
      stats[cat.key] = { total: items.length, unlocked };
    }
    return stats;
  }, [unlockedAchievementIds]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-amber-500/30 bg-card/95 backdrop-blur-xl shadow-2xl shadow-amber-500/10 overflow-hidden"
      >
        {/* 顶部光效 */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

        {/* 头部 */}
        <div className="relative px-5 md:px-6 py-4 md:py-5 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-amber-500/30 to-amber-700/30 border border-amber-400/40 flex items-center justify-center">
                <Trophy className="w-5 h-5 md:w-6 md:h-6 text-amber-300" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-foreground font-serif">成就殿堂</h2>
                <div className="text-xs text-muted-foreground mt-0.5">
                  已解锁 <span className="text-amber-400 font-semibold">{unlockedCount}</span> / {totalCount} 项成就
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 总进度条 */}
          <div className="mt-4">
            <div className="h-2 rounded-full bg-muted/40 overflow-hidden border border-border/30">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600"
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[11px] text-muted-foreground">
              <span>收集进度</span>
              <span className="text-amber-400 font-semibold">{progressPct}%</span>
            </div>
          </div>
        </div>

        {/* 分类 Tab */}
        <div className="px-4 md:px-5 pt-3 pb-2 border-b border-border/30 flex gap-2 overflow-x-auto">
          <CategoryTab
            active={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
            icon="🏆"
            label="全部"
            count={unlockedCount}
            total={totalCount}
          />
          {ACHIEVEMENT_CATEGORIES.map((cat) => (
            <CategoryTab
              key={cat.key}
              active={activeCategory === cat.key}
              onClick={() => setActiveCategory(cat.key)}
              icon={cat.icon}
              label={cat.name}
              count={categoryStats[cat.key]?.unlocked ?? 0}
              total={categoryStats[cat.key]?.total ?? 0}
            />
          ))}
        </div>

        {/* 成就列表 */}
        <div className="flex-1 overflow-y-auto px-4 md:px-5 py-4">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              {sortedAchievements.map((ach, i) => {
                const progressInfo = getAchievementProgress(ach) ?? { current: 0, target: 1, completed: false };
                const { current, target, completed } = progressInfo;
                const rarity = RARITY_STYLES[ach.rarity] || RARITY_STYLES.common;
                const progress = target > 0 ? Math.min(1, current / target) : 0;

                return (
                  <motion.div
                    key={ach.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.02 }}
                    whileHover={{ y: -2 }}
                    className={`relative rounded-xl border p-3 md:p-4 transition-all ${
                      completed
                        ? `${rarity.border} ${rarity.bg} ${rarity.glow}`
                        : 'border-border/30 bg-muted/10 opacity-70'
                    }`}
                  >
                    {/* 已完成闪光边 */}
                    {completed && (
                      <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 + i * 0.5, ease: 'easeInOut' }}
                        />
                      </div>
                    )}

                    <div className="flex gap-3 relative z-10">
                      {/* 图标 */}
                      <div
                        className={`relative shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-2xl md:text-3xl ${
                          completed
                            ? `${rarity.border} border-2 ${rarity.bg}`
                            : 'border border-border/30 bg-muted/20'
                        }`}
                      >
                        {completed ? (
                          <span>{ach.icon}</span>
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                            <Lock className="w-5 h-5 text-muted-foreground/60" />
                          </div>
                        )}
                        {completed && ach.rarity === 'mythic' && (
                          <motion.div
                            className="absolute inset-0 rounded-xl border border-amber-300/50"
                            animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          />
                        )}
                      </div>

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`font-bold text-sm md:text-base truncate ${completed ? rarity.text : 'text-muted-foreground'}`}>
                            {ach.name}
                          </span>
                          <Badge variant="outline" className={`shrink-0 text-[10px] px-1.5 py-0 h-4 ${
                            completed
                              ? `${rarity.border} ${rarity.text} bg-transparent`
                              : 'border-muted-foreground/20 text-muted-foreground/60 bg-transparent'
                          }`}>
                            {rarity.label}
                          </Badge>
                        </div>
                        <div className={`text-[11px] md:text-xs line-clamp-2 mb-2 ${
                          completed ? 'text-foreground/70' : 'text-muted-foreground/60'
                        }`}>
                          {ach.description}
                        </div>

                        {/* 进度条 */}
                        <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.round(progress * 100)}%` }}
                            transition={{ duration: 0.6, delay: 0.2 + i * 0.01, ease: 'easeOut' }}
                            className={`h-full ${
                              completed
                                ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                                : 'bg-muted-foreground/40'
                            }`}
                          />
                        </div>
                        <div className="flex justify-between mt-1 text-[10px] md:text-[11px]">
                          <span className={completed ? 'text-amber-400/80' : 'text-muted-foreground/50'}>
                            {completed ? '已完成' : '进行中'}
                          </span>
                          <span className="text-muted-foreground/70 tabular-nums">
                            {current >= target ? '✓' : `${current} / ${target}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {sortedAchievements.length === 0 && (
            <div className="py-16 text-center text-muted-foreground text-sm">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
              暂无成就
            </div>
          )}
        </div>

        {/* 底部装饰 */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
      </motion.div>
    </div>
  );
}

function CategoryTab({
  active,
  onClick,
  icon,
  label,
  count,
  total,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  count: number;
  total: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
        active
          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
      <span className={`text-[10px] ${active ? 'text-amber-400' : 'text-muted-foreground/60'}`}>
        {count}/{total}
      </span>
    </button>
  );
}
