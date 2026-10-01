import { memo, useMemo } from 'react';

/**
 * 斗罗大陆玄幻星空背景
 * - 深紫蓝渐变夜空 + 繁星闪烁 + 魂环光雾
 * - 纯 CSS 实现，无 canvas 无 DOM 爆炸
 */
export default memo(function StarryBackground() {
  // 预生成固定随机星点，避免每次渲染重算
  const stars = useMemo(() => {
    const arr: Array<{ top: string; left: string; size: number; delay: string; duration: number }> = [];
    for (let i = 0; i < 80; i++) {
      arr.push({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: Math.random() * 2 + 1,
        delay: `${Math.random() * 4}s`,
        duration: 2 + Math.random() * 3,
      });
    }
    return arr;
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* 深紫蓝渐变夜空基底 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at top, hsl(268 50% 18%) 0%, hsl(248 40% 10%) 40%, hsl(228 40% 6%) 100%)',
        }}
      />

      {/* 魂环光雾 - 底部金色光晕 */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-[-20%] w-[120%] aspect-square rounded-full opacity-20 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, hsl(185 80% 55%) 0%, transparent 60%)',
        }}
      />

      {/* 上方紫光雾 */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-[-10%] w-[80%] aspect-square rounded-full opacity-15 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, hsl(200 70% 50%) 0%, transparent 60%)',
        }}
      />

      {/* 繁星闪烁 */}
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            top: s.top,
            left: s.left,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: 0.6,
            boxShadow: '0 0 4px rgba(255,255,255,0.8)',
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay} infinite`,
          }}
        />
      ))}

      {/* 柔和星尘层 */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.08) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(168,85,247,0.1) 0%, transparent 40%)',
        }}
      />

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
});
