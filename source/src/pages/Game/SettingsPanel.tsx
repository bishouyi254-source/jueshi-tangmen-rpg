import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, RotateCcw, Info } from 'lucide-react';
import { useGame } from '@/lib/gameStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface SettingsPanelProps {
  onBack?: () => void;
}

export default function SettingsPanel({ onBack }: SettingsPanelProps) {
  const { resetGame } = useGame();
  const navigate = useNavigate();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    // 先调用 resetGame 清除内存状态和 localStorage 存档
    resetGame();
    setShowResetConfirm(false);
    toast.success('存档已清空，正在重新开始...');
    // 立即刷新页面：彻底终止所有自动存档定时器
    // 避免异步定时器在重置后又把旧 player 写回 localStorage
    setTimeout(() => {
      navigate('/');
    }, 600);
  };

  return (
    <div className="p-3 md:p-5 pb-4 space-y-4">
      {/* 顶部 */}
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-cyan-400" />
        <h2 className="text-lg md:text-xl font-bold" style={{ fontFamily: "'Noto Serif SC', serif" }}>
          设置
        </h2>
      </div>

      {/* 存档管理 */}
      <div className="rounded-2xl border border-border/40 bg-card/40 overflow-hidden">
        <div className="p-3 border-b border-border/30">
          <h3 className="text-sm font-semibold">存档管理</h3>
        </div>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="w-full p-3 flex items-center gap-3 hover:bg-red-500/10 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-red-900/40 flex items-center justify-center text-red-400 border border-red-500/30">
            <RotateCcw className="h-5 w-5" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="text-sm font-medium text-red-400">清空存档 / 重置游戏</div>
            <div className="text-[11px] text-red-400/70">
              清除所有游戏进度，角色、装备、魂环全部丢失
            </div>
          </div>
        </button>
      </div>

      {/* 关于游戏 */}
      <div className="rounded-2xl border border-border/40 bg-card/40 overflow-hidden">
        <div className="p-3 border-b border-border/30">
          <h3 className="text-sm font-semibold">关于</h3>
        </div>
        <div className="p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-900/40 flex items-center justify-center text-cyan-300 border border-cyan-500/30">
            <Info className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">斗罗大陆II 绝世唐门</div>
            <div className="text-[11px] text-muted-foreground">HTML5 网页 RPG · v2.0.0</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              基于原著世界观的修炼养成游戏
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-muted-foreground/60 pt-2">
        游戏自动保存进度 · 数据存储于本地
      </div>

      {/* 重置确认弹窗 */}
      {showResetConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowResetConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="w-full max-w-sm bg-card/95 rounded-2xl border-2 border-red-500/40 shadow-xl p-5 text-foreground backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-full bg-red-900/40 flex items-center justify-center text-red-400 border border-red-500/30">
                <RotateCcw className="h-7 w-7" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-center mb-2">确定重置游戏？</h3>
            <p className="text-sm text-muted-foreground text-center mb-5">
              所有游戏进度将被清除，角色、装备、魂环、魂币全部丢失，此操作不可撤销。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border bg-card/50 text-foreground font-medium text-sm hover:bg-card transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-cyan-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-red-500/30 transition-shadow"
              >
                确定重置
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
