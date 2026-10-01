import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Sparkles } from 'lucide-react';
import { useGame } from '@/lib/gameStore';
import { FIERCE_BEASTS_STAR_LAKE, FIERCE_BEASTS_FROZEN } from '@/data/fierceBeasts';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit-lite';

interface FavorModalProps {
  beastId: string;
}

const ALL_BEASTS = [...FIERCE_BEASTS_STAR_LAKE, ...FIERCE_BEASTS_FROZEN];

export default function FavorModal({ beastId }: FavorModalProps) {
  const { acceptCompanionFavor, rejectCompanionFavor, clearPendingFavor } = useGame();
  const [phase, setPhase] = useState<'appearing' | 'visible' | 'leaving'>('appearing');

  const beast = ALL_BEASTS.find(b => b.id === beastId);

  logger.info('[favor-modal] 渲染', { beastId, found: !!beast, beastName: beast?.name });

  if (!beast) {
    // 找不到直接清掉
    logger.warn('[favor-modal] 找不到对应凶兽，清除pending', { beastId });
    clearPendingFavor();
    return null;
  }

  const handleAccept = () => {
    setPhase('leaving');
    const ok = acceptCompanionFavor(beast.id);
    if (ok) {
      toast.success(`获得了${beast.name}的青睐！`);
    }
    logger.info('[favor-modal] accept', { beastId: beast.id, ok });
  };

  const handleReject = () => {
    setPhase('leaving');
    rejectCompanionFavor(beast.id);
    logger.info('[favor-modal] reject', { beastId: beast.id });
  };

  const handleClose = () => {
    // 点击蒙层关闭 = 拒绝
    handleReject();
  };

  return (
    <AnimatePresence>
      {phase !== 'leaving' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.35, type: 'spring', bounce: 0.35, delay: 0.1 }}
            className="relative w-full max-w-sm"
            style={{
              background: 'linear-gradient(180deg, hsl(320 40% 22%) 0%, hsl(248 35% 10%) 100%)',
              border: '2px solid hsl(320 80% 65% / 0.6)',
              borderRadius: '18px',
              boxShadow: '0 0 80px hsl(320 80% 60% / 0.35), 0 25px 80px rgba(0,0,0,0.7)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 装饰粒子 */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-pink-400/60"
                  style={{
                    left: `${8 + (i * 11) % 84}%`,
                    top: `${15 + (i * 17) % 65}%`,
                  }}
                  animate={{
                    y: [0, -24, 0],
                    opacity: [0.3, 0.95, 0.3],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 2.5 + (i % 4) * 0.6,
                    repeat: Infinity,
                    delay: i * 0.25,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>

            {/* 标题装饰 */}
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', bounce: 0.6 }}
              className="absolute -top-8 left-1/2 -translate-x-1/2"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400/70 via-amber-400/60 to-amber-300/70 border-2 border-pink-200/70 flex items-center justify-center shadow-2xl shadow-pink-500/50">
                  <Heart className="w-7 h-7 text-pink-50 fill-pink-200" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-300 animate-pulse" />
                <Sparkles className="absolute -bottom-1 -left-2 w-3 h-3 text-pink-300 animate-pulse" />
              </div>
            </motion.div>

            {/* 关闭按钮 */}
            <button
              onClick={handleReject}
              className="absolute right-3 top-3 z-10 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-pink-200/60 hover:text-pink-200 flex items-center justify-center transition-colors"
              aria-label="关闭"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* 内容区 */}
            <div className="relative pt-12 pb-6 px-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-black text-pink-100 mb-1"
                style={{ fontFamily: "'Noto Serif SC', serif", textShadow: '0 0 20px hsl(320 90% 65% / 0.6)' }}
              >
                获得青睐
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xs text-pink-300/70 mb-4"
              >
                {beast.title}对你产生了浓厚的兴趣
              </motion.div>

              {/* 凶兽信息卡 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="p-4 rounded-xl bg-black/40 border border-pink-500/25 mb-5"
              >
                <div className="text-lg font-bold text-foreground mb-1">{beast.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {beast.element} · {beast.years > 10000 ? `${Math.floor(beast.years / 10000)}万年` : `${beast.years}年`}
                </div>
                <div className="text-[11px] text-foreground/70 mt-2 leading-relaxed line-clamp-3">
                  {beast.description}
                </div>
              </motion.div>

              {/* 提示文字 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-[10px] text-pink-300/50 mb-4"
              >
                接受后可在「更多 → 侣」中查看与培养
              </motion.div>

              {/* 按钮 */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="flex gap-3"
              >
                <button
                  onClick={handleReject}
                  className="flex-1 py-2.5 rounded-lg bg-muted/30 border border-border/50 text-muted-foreground text-sm font-medium hover:bg-muted/50 transition-colors active:scale-[0.97]"
                >
                  拒绝
                </button>
                <button
                  onClick={handleAccept}
                  className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 text-white text-sm font-bold hover:from-pink-500 hover:via-rose-400 hover:to-amber-400 transition-all active:scale-[0.97] shadow-lg shadow-pink-500/40"
                >
                  接受
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
