import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Snowflake } from 'lucide-react';

interface TianmengSacrificeDialogProps {
  open: boolean;
  onAccept: () => void;
  onReject: () => void;
}

export default function TianmengSacrificeDialog({ open, onAccept, onReject }: TianmengSacrificeDialogProps) {
  const [showEvolution, setShowEvolution] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const acceptLockRef = useRef(false);

  const handleAccept = useCallback(() => {
    if (acceptLockRef.current) return;
    acceptLockRef.current = true;
    setAccepted(true);
    setShowEvolution(true);
  }, []);

  const handleConfirmEvolution = useCallback(() => {
    onAccept();
  }, [onAccept]);

  return (
    <AnimatePresence>
      {open && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
           {/* 背景遮罩 - 点击不关闭（防止误触） */}
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="absolute inset-0 bg-black/80 backdrop-blur-md"
           />

           {/* 弹窗主体：绝对居中 + 最大高度限制，保证小屏不被截断 */}
           <motion.div
             initial={{ opacity: 0, scale: 0.9, y: 20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.9, y: 20 }}
             transition={{ duration: 0.35, ease: 'easeOut' }}
             className="relative z-10 w-full max-w-md md:max-w-lg max-h-[92dvh] rounded-2xl border-2 overflow-hidden flex flex-col"
             style={{
               borderColor: '#7dd3fc',
               background: 'linear-gradient(160deg, rgba(8, 20, 40, 0.95) 0%, rgba(20, 40, 70, 0.95) 50%, rgba(8, 20, 40, 0.95) 100%)',
               boxShadow: '0 0 60px rgba(125, 211, 252, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
             }}
           >
            {/* 顶部蓝色装饰线 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sky-300 to-transparent z-20" />

            {/* 粒子光点装饰 */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-cyan-300"
                  style={{
                    left: `${10 + (i * 7) % 80}%`,
                    top: `${15 + (i * 11) % 70}%`,
                    boxShadow: '0 0 6px rgba(125, 211, 252, 0.8)',
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 2.5 + (i % 5) * 0.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>

            {/* 标题区域（固定不滚动） */}
            <div className="relative z-10 pt-3 pb-2 px-4 sm:pt-4 sm:pb-3 md:py-3 md:px-6 text-center shrink-0">
                <div className="flex items-center justify-center gap-2 mb-1">
                <Snowflake className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" />
                <h2 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-cyan-200 via-white to-cyan-200 bg-clip-text text-transparent">
                  天梦冰蚕献祭
                </h2>
                <Snowflake className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" />
              </div>
              <div className="text-[11px] sm:text-xs text-cyan-400/70 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>传说中的百万年魂兽</span>
                <Sparkles className="w-3 h-3" />
              </div>
            </div>

            {/* 可滚动内容区 */}
            <div className="relative z-10 px-4 pb-4 sm:px-6 sm:pb-5 overflow-y-auto flex-1">
              <AnimatePresence mode="wait">
                {!showEvolution ? (
                  <motion.div
                    key="intro"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3 sm:space-y-4"
                  >
                    {/* 天梦冰蚕形象 - "梦"字 */}
                    <div className="flex justify-center">
                      <motion.div
                        className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center"
                        style={{
                          background: 'radial-gradient(circle, rgba(125, 211, 252, 0.4) 0%, rgba(125, 211, 252, 0.1) 60%, transparent 100%)',
                          boxShadow: '0 0 40px rgba(125, 211, 252, 0.5), inset 0 0 20px rgba(125, 211, 252, 0.3)',
                        }}
                        animate={{
                          scale: [1, 1.05, 1],
                        }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        {/* "梦"字主体 */}
                        <span
                          className="text-2xl sm:text-3xl md:text-4xl font-black select-none"
                          style={{
                            background: 'linear-gradient(180deg, #e0f2fe 0%, #7dd3fc 50%, #38bdf8 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 0 8px rgba(125, 211, 252, 0.5))',
                            fontFamily: "'Noto Serif SC', serif",
                          }}
                        >
                          梦
                        </span>
                        {/* 环绕冰环 */}
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-cyan-300/40"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                        />
                        <motion.div
                          className="absolute -inset-2 rounded-full border border-cyan-200/30"
                          animate={{ rotate: -360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                        />
                        {/* 小雪花点缀 */}
                        <motion.div
                          className="absolute -top-1 -right-1 text-cyan-200"
                          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        >
                          <Snowflake className="w-3 h-3 sm:w-4 sm:h-4" />
                        </motion.div>
                      </motion.div>
                    </div>

                    {/* 魂环展示 */}
                    <div className="flex justify-center items-center gap-2 md:gap-3">
                      <div
                        className="w-12 sm:w-16 h-2 rounded-full"
                        style={{
                          background: 'linear-gradient(90deg, transparent, #7dd3fc, transparent)',
                          boxShadow: '0 0 12px rgba(125, 211, 252, 0.6)',
                        }}
                      />
                      <span className="text-cyan-200 text-xs sm:text-sm font-bold whitespace-nowrap">百万年 · 蓝白色魂环</span>
                      <div
                        className="w-12 sm:w-16 h-2 rounded-full"
                        style={{
                          background: 'linear-gradient(90deg, transparent, #7dd3fc, transparent)',
                          boxShadow: '0 0 12px rgba(125, 211, 252, 0.6)',
                        }}
                      />
                    </div>

                    {/* 介绍文字 */}
                    <div className="text-center space-y-1.5 sm:space-y-2 py-1">
                      <p className="text-xs sm:text-sm text-cyan-100/90 leading-relaxed">
                        天梦冰蚕感受到你极其恐怖的<span className="text-amber-300 font-bold">精神系天赋</span>，
                        愿以<span className="text-cyan-300 font-bold">百万年修为</span>献祭自身，
                        成为你灵眸的第一魂环。
                      </p>
                      <p className="text-[11px] sm:text-xs text-cyan-400/70 leading-relaxed">
                        接受献祭，你的灵眸将进化为超神级武魂——<span className="text-amber-300 font-semibold">冰灵之眸</span>，
                        同时获得强大的百万年第一魂环。
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="evolution"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4 text-center"
                  >
                    {/* 进化动画：灵眸 → 冰灵之眸 */}
                    <div className="relative h-24 sm:h-28 md:h-32 flex items-center justify-center">
                      {/* 光芒背景 */}
                      <motion.div
                        className="absolute w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full"
                        style={{
                          background: 'radial-gradient(circle, rgba(125, 211, 252, 0.5) 0%, rgba(251, 191, 36, 0.3) 40%, transparent 70%)',
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.7] }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                      />
                      {/* 冲天光柱 */}
                      <motion.div
                        className="absolute w-5 sm:w-6 md:w-8 h-32 sm:h-40 md:h-48 rounded-full"
                        style={{
                          background: 'linear-gradient(to top, rgba(125, 211, 252, 0.2), rgba(125, 211, 252, 0.8), rgba(255,255,255,0.9))',
                          filter: 'blur(2px)',
                        }}
                        initial={{ scaleY: 0, opacity: 0 }}
                        animate={{ scaleY: 1, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                      />
                      {/* 武魂名称展示 */}
                      <motion.div
                        className="relative z-10 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                      >
                        <div className="text-[10px] text-cyan-400 mb-1">灵眸 →</div>
                        <div
                          className="text-lg sm:text-xl md:text-2xl font-black"
                          style={{
                            background: 'linear-gradient(135deg, #fcd34d 0%, #7dd3fc 50%, #fcd34d 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textShadow: '0 0 20px rgba(252, 211, 77, 0.5)',
                          }}
                        >
                          冰灵之眸
                        </div>
                        <div className="text-amber-300 text-xs mt-1 flex items-center justify-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>超神级 · 本体武魂·控制系</span>
                          <Sparkles className="w-3 h-3" />
                        </div>
                      </motion.div>
                    </div>

                    {/* 获得提示 */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.3 }}
                      className="space-y-1 py-1"
                    >
                      <p className="text-xs sm:text-sm text-cyan-100">
                        🎉 获得 <span className="text-cyan-300 font-bold">百万年魂环 · 天梦冰蚕</span>
                      </p>
                      <p className="text-[11px] sm:text-xs text-cyan-400/70">
                        灵眸已进化为超神级武魂「冰灵之眸」，精神力与冰属性完美融合
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 底部操作区（固定不滚动，按钮始终可见） */}
            <div className="relative z-10 px-4 pb-4 pt-2 sm:px-6 sm:pb-5 md:px-6 md:pb-5 border-t border-cyan-500/20 bg-gradient-to-t from-slate-950/80 to-transparent shrink-0">
              <AnimatePresence mode="wait">
                {!showEvolution ? (
                  <motion.div
                    key="intro-actions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={handleAccept}
                        disabled={accepted}
                        className="relative z-10 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                        style={{
                          background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                          color: '#0c1222',
                          boxShadow: '0 2px 12px rgba(6, 182, 212, 0.4)',
                          border: '1px solid rgba(125, 211, 252, 0.6)',
                        }}
                      >
                        接受献祭
                      </button>
                      <button
                        type="button"
                        onClick={onReject}
                        disabled={accepted}
                        className="relative z-10 py-2.5 rounded-lg font-bold text-sm text-slate-300 bg-slate-700/40 border border-slate-500/40 hover:bg-slate-600/40 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                      >
                        拒绝
                      </button>
                    </div>
                    <p className="text-center text-[10px] text-slate-500 pt-1">
                      此奇遇一生仅一次，请慎重选择
                    </p>
                  </motion.div>
                ) : (
                  <motion.button
                    key="evolution-confirm"
                    type="button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.8 }}
                    onClick={handleConfirmEvolution}
                    className="relative z-10 w-full py-2.5 rounded-lg font-bold text-sm transition-all active:scale-95 cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)',
                      color: '#1a1628',
                      boxShadow: '0 2px 16px rgba(252, 211, 77, 0.5)',
                    }}
                  >
                    确认，开启新的修炼之路
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
