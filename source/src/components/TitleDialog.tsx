import { useState, useEffect } from 'react';
import { useGame } from '@/lib/gameStore';
import { Crown } from 'lucide-react';

/**
 * 封号斗罗命名弹窗
 * - 达到90级且拥有9个魂环且尚未命名封号时自动弹出
 * - 封号1-2字，确认后不可修改
 */
export default function TitleDialog() {
  const { player, setTitle } = useGame();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  // 检测是否满足封号条件：90级以上 + 9个魂环 + 未命名封号
  useEffect(() => {
    if (!player) return;
    if (player.title) return;
    if (player.level >= 90 && player.soulRings.length >= 9) {
      setOpen(true);
    }
  }, [player]);

  const onConfirm = () => {
    const val = input.trim();
    if (!val) {
      setError('请输入封号');
      return;
    }
    if (val.length > 2) {
      setError('封号最多两个字');
      return;
    }
    setTitle(val);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-sm md:max-w-md rounded-2xl border-2 border-cyan-500/40 bg-gradient-to-b from-[#1a120a] via-[#221608] to-[#160e05] shadow-2xl overflow-hidden ring-1 ring-cyan-400/20">
        {/* 顶部金色光边 */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* 装饰光点 */}
        <div className="absolute top-0 left-1/4 w-32 h-32 -translate-y-1/2 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-24 h-24 -translate-y-1/2 bg-cyan-300/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-6 md:p-8 pt-7 md:pt-9">
          {/* 皇冠图标 */}
              <div className="flex justify-center mb-3 md:mb-4">
            <div className="relative">
              <Crown className="w-12 h-12 md:w-16 md:h-16 text-cyan-400" strokeWidth={1.5} />
              <div className="absolute inset-0 blur-md bg-cyan-400/30 -z-10" />
            </div>
          </div>

          {/* 标题 */}
            <h2 className="text-center text-xl md:text-2xl font-bold bg-gradient-to-b from-cyan-200 via-cyan-400 to-cyan-600 bg-clip-text text-transparent tracking-widest font-['Noto_Serif_SC']">
            封 号 斗 罗
          </h2>

          <div className="mt-1 text-center text-xs text-cyan-200/40 tracking-wider">
            TITLE DUELUO
          </div>

          {/* 分割线 */}
          <div className="mx-auto mt-4 w-2/3 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

          {/* 提示文字 */}
            <p className="mt-4 md:mt-5 text-center text-sm md:text-base text-cyan-100/80 leading-relaxed">
            恭喜您达到封号斗罗境界
            <br />
            请为自己命名封号
          </p>

          {/* 输入框 */}
              <div className="mt-4 md:mt-5">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  const v = e.target.value;
                  setInput(v);
                  if (v.length > 2) setError('封号最多两个字');
                  else if (v.length === 2 && error) setError('');
                }}
                placeholder="请输入封号（1-2字）"
                maxLength={2}
                className="w-full h-11 md:h-12 px-4 rounded-xl bg-[#0d0804]/80 border border-cyan-500/30 text-cyan-100 text-center text-lg md:text-xl tracking-widest placeholder:text-cyan-200/30 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all font-['Noto_Serif_SC']"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-cyan-200/40 tabular-nums">
                 {input.length}/2
              </div>
            </div>
            {error && (
              <div className="mt-2 text-center text-xs text-red-400">{error}</div>
            )}
          </div>

          {/* 提示 */}
          <p className="mt-3 text-center text-[11px] text-cyan-200/40">
            一经定下，不可修改
          </p>

          {/* 确认按钮 */}
           <button
             onClick={onConfirm}
             disabled={!input.trim() || input.length > 2 || input.length < 1}
             className="mt-5 md:mt-6 w-full h-11 md:h-12 rounded-xl font-semibold text-base md:text-lg tracking-wider transition-all font-['Noto_Serif_SC']
              bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-600
              text-[#2a1a05]
              shadow-lg shadow-cyan-500/20
              hover:from-cyan-300 hover:via-cyan-400 hover:to-cyan-500
              active:scale-[0.98]
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-cyan-400
              border border-cyan-300/50
            "
          >
            确 认 封 号
          </button>
        </div>
      </div>
    </div>
  );
}
