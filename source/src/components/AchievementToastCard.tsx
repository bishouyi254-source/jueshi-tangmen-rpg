import { motion } from 'framer-motion';
import { Trophy, Sparkles } from 'lucide-react';
import type { IAchievement } from '@/data/achievements';

interface AchievementToastCardProps {
  ach: IAchievement;
  rarityLabel: string;
  visible: boolean;
}

const RARITY_STYLES: Record<IAchievement['rarity'], { bg: string; border: string; glow: string; text: string }> = {
  common: {
    bg: 'bg-gray-900/90',
    border: 'border-gray-400/60',
    glow: '',
    text: 'text-gray-200',
  },
  rare: {
    bg: 'bg-gradient-to-br from-emerald-900/95 to-green-950/95',
    border: 'border-green-400/60',
    glow: 'shadow-[0_0_25px_rgba(34_197_94_0.4)]',
    text: 'text-green-200',
  },
  epic: {
    bg: 'bg-gradient-to-br from-purple-900/95 to-indigo-950/95',
    border: 'border-purple-400/60',
    glow: 'shadow-[0_0_30px_rgba(168_85_247_0.45)]',
    text: 'text-purple-200',
  },
  legendary: {
    bg: 'bg-gradient-to-br from-amber-900/95 to-orange-950/95',
    border: 'border-amber-400/70',
    glow: 'shadow-[0_0_35px_rgba(245_158_11_0.5)]',
    text: 'text-amber-200',
  },
  mythic: {
    bg: 'bg-gradient-to-br from-red-900/95 via-amber-900/95 to-purple-950/95',
    border: 'border-amber-300/80',
    glow: 'shadow-[0_0_40px_rgba(239_68_68_0.55)]',
    text: 'text-amber-100',
  },
};

export default function AchievementToastCard({ ach, rarityLabel, visible }: AchievementToastCardProps) {
  const style = RARITY_STYLES[ach.rarity];

  return (
    <motion.div
      initial={{ opacity: 0, y: -60, scale: 0.8 }}
      animate={{
        opacity: visible ? 1 : 0,
        y: visible ? 0 : -40,
        scale: visible ? 1 : 0.9,
      }}
      exit={{ opacity: 0, y: -50, scale: 0.85 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`relative w-80 rounded-2xl border-2 ${style.border} ${style.bg} ${style.glow} backdrop-blur-xl p-4 overflow-hidden`}
    >
      {/* 光束扫射 */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
      >
        <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </motion.div>

      {/* 顶部金光边 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />

      <div className="relative flex items-center gap-3">
        {/* 图标 */}
        <motion.div
          initial={{ rotate: -20, scale: 0.6 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 12 }}
          className="relative shrink-0"
        >
          <div className={`w-14 h-14 rounded-xl border-2 ${style.border} flex items-center justify-center text-3xl bg-background/40`}>
            <span>{ach.icon}</span>
          </div>
          {/* 外圈光环 */}
          <motion.div
            className={`absolute inset-0 rounded-xl border ${style.border} opacity-60`}
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* 星星装饰 */}
          <motion.div
            className="absolute -top-1 -right-1"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
          </motion.div>
        </motion.div>

        {/* 文字 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Trophy className={`w-3.5 h-3.5 ${style.text}`} />
            <span className={`text-[11px] font-bold tracking-wide ${style.text}`}>
              成就解锁
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${style.border} ${style.text} ml-auto`}>
              {rarityLabel}
            </span>
          </div>
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className={`font-bold text-base truncate ${style.text}`}
          >
            {ach.name}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="text-[11px] text-muted-foreground/80 line-clamp-1"
          >
            {ach.description}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
