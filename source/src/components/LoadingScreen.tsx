import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

const MOBILE_BG = 'https://aka.doubaocdn.com/s/rjxbTYddYN';
const DESKTOP_BG = 'https://aka.doubaocdn.com/s/lx5gLTcMH7';

const QUOTES = [
  '三十年河东，三十年河西，莫欺少年穷',
  '你若盛开，蝴蝶自来',
  '天若赐我辉煌，我必比天猖狂',
  '我命由我不由天',
  '武魂觉醒，逆天改命',
  '魂环加身，谁与争锋',
  '成神之路，荆棘满途',
  '极致之冰，冻结万物',
  '修罗一剑，斩断因果',
  '龙神降世，万龙臣服',
];

interface LoadingScreenProps {
  onEnter: () => void;
  hasSave: boolean;
}

export default function LoadingScreen({ onEnter, hasSave }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [canEnter, setCanEnter] = useState(false);
  const isMobile = useIsMobile();
  const bgUrl = isMobile ? MOBILE_BG : DESKTOP_BG;

  // 名言行：预生成不同速度、延迟、纵向位置，保证性能（不每帧 setState）
  const quoteLines = useMemo(() => {
    return QUOTES.map((text, i) => ({
      text,
      top: `${8 + i * 9}%`,
      duration: 18 + (i % 5) * 4, // 18~34秒不等
      delay: -(i * 3.5),          // 错开起始位置
      opacity: 0.12 + (i % 3) * 0.05, // 半透明 12%~22%
      fontSize: isMobile ? '14px' : '18px',
    }));
  }, [isMobile]);

  useEffect(() => {
    const duration = 2200;
    const startTime = Date.now();
    let raf = 0;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(100, (elapsed / duration) * 100);
      setProgress(p);
      if (p < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setCanEnter(true);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative w-full h-[100dvh] flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* 背景图片 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgUrl})` }}
      />
      {/* 深色渐变遮罩：顶部底部加深，中部略亮，突出标题 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

      {/* ========== 名言飘过层（transform + opacity，GPU 加速） ========== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {quoteLines.map((q, i) => (
          <motion.div
            key={i}
            className="absolute whitespace-nowrap font-serif tracking-widest"
            style={{
              top: q.top,
              right: 0,
              color: '#f5d68a',
              opacity: q.opacity,
              fontSize: q.fontSize,
              textShadow: '0 0 8px rgba(245, 214, 138, 0.3)',
              willChange: 'transform',
            }}
            animate={{ x: ['100%', '-120%'] }}
            transition={{
              duration: q.duration,
              ease: 'linear',
              repeat: Infinity,
              delay: q.delay,
            }}
          >
            {q.text}
          </motion.div>
        ))}
      </div>

      {/* ========== 魂环旋转加载动画 ========== */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative flex flex-col items-center z-10"
      >
        {/* 三环旋转：从内到外不同速度，模拟魂环效果 */}
        <div className="relative w-24 h-24 md:w-32 md:h-32 mb-6 md:mb-8">
          {/* 内环 - 金色 */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-amber-300/60"
            style={{ boxShadow: '0 0 15px rgba(251, 191, 36, 0.4), inset 0 0 15px rgba(251, 191, 36, 0.2)', willChange: 'transform' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, ease: 'linear', repeat: Infinity }}
          />
          {/* 中环 - 紫色 */}
          <motion.div
            className="absolute inset-3 rounded-full border border-purple-400/50"
            style={{ boxShadow: '0 0 12px rgba(192, 132, 252, 0.4), inset 0 0 12px rgba(192, 132, 252, 0.2)', willChange: 'transform' }}
            animate={{ rotate: -360 }}
            transition={{ duration: 5, ease: 'linear', repeat: Infinity }}
          />
          {/* 外环 - 暗金 */}
          <motion.div
            className="absolute -inset-2 rounded-full border border-amber-500/30"
            style={{ boxShadow: '0 0 20px rgba(212, 168, 67, 0.3), inset 0 0 20px rgba(212, 168, 67, 0.1)', willChange: 'transform' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, ease: 'linear', repeat: Infinity }}
          />
          {/* 中心光点 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-amber-300"
              style={{ boxShadow: '0 0 20px rgba(251, 191, 36, 0.8), 0 0 40px rgba(251, 191, 36, 0.4)' }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{ duration: 1.6, ease: 'easeInOut', repeat: Infinity }}
            />
          </div>
        </div>

        {/* ========== 游戏标题：斗罗大陆·继承 ========== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
          className="text-center"
        >
          <h1
            className="text-4xl md:text-6xl font-black tracking-[0.3em] leading-tight"
            style={{
              fontFamily: "'Noto Serif SC', serif",
              background: 'linear-gradient(180deg, #fde68a 0%, #d97706 50%, #fbbf24 70%, #fef3c7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.5))',
            }}
          >
            斗罗大陆
          </h1>
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
            className="mt-2 mb-2 flex items-center justify-center gap-3"
          >
            <div className="h-px w-12 md:w-20 bg-gradient-to-r from-transparent to-amber-500/60" />
            <span
              className="text-sm md:text-xl font-bold tracking-[0.5em] text-amber-300/90"
              style={{
                fontFamily: "'Noto Serif SC', serif",
                textShadow: '0 0 10px rgba(251, 191, 36, 0.5)',
              }}
            >
              · 继 承 ·
            </span>
            <div className="h-px w-12 md:w-20 bg-gradient-to-l from-transparent to-amber-500/60" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="text-xs md:text-sm text-amber-100/40 tracking-[0.4em] mt-1"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            绝 世 唐 门
          </motion.p>
        </motion.div>

        {/* ========== 加载进度条 ========== */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-10 md:mt-12 w-48 md:w-64"
        >
          <div className="relative w-full h-1 bg-black/50 rounded-full overflow-hidden border border-amber-600/30">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #b45309, #fbbf24, #fde68a, #fbbf24, #b45309)',
                boxShadow: '0 0 10px rgba(251, 191, 36, 0.6)',
                backgroundSize: '200% 100%',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%`, backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{
                width: { duration: 0.05, ease: 'linear' },
                backgroundPosition: { duration: 2, ease: 'linear', repeat: Infinity },
              }}
            />
          </div>
          <div className="text-center text-xs text-amber-200/60 mt-2 tabular-nums tracking-wider">
            加载中 · {Math.floor(progress)}%
          </div>
        </motion.div>

        {/* ========== 进入按钮 ========== */}
        {canEnter && (
          <motion.button
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 220, damping: 20 }}
            onClick={onEnter}
            className="mt-8 group relative px-10 py-3 rounded-lg border border-amber-500/70 text-amber-200 tracking-[0.3em] text-sm font-medium hover:bg-amber-500/10 hover:border-amber-400 hover:text-amber-100 transition-all duration-300"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <div
              className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ boxShadow: '0 0 25px rgba(251, 191, 36, 0.4), inset 0 0 20px rgba(251, 191, 36, 0.08)' }}
            />
            <span className="relative">
              {hasSave ? '进入世界' : '开启旅程'}
            </span>
          </motion.button>
        )}
      </motion.div>

      {/* 底部小字 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
        className="absolute bottom-6 text-[10px] md:text-xs text-amber-200/30 tracking-[0.3em] z-10"
        style={{ fontFamily: "'Noto Serif SC', serif" }}
      >
        v1.0 · 斗罗大陆·继承
      </motion.div>
    </div>
  );
}
