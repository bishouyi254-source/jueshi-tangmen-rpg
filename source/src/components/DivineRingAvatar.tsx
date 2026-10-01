import { useMemo } from 'react';

interface DivineRingAvatarProps {
  name: string;
  /** 是否继承神位（决定是否显示神环） */
  isDeity: boolean;
  /** 神环颜色（hex），默认金色 */
  ringColor?: string;
  /** 头像边框颜色 */
  borderColor?: string;
  /** 头像尺寸（像素），默认与容器一致 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 形状：圆形或圆角矩形 */
  shape?: 'circle' | 'rounded';
  /** 额外 className */
  className?: string;
  /** 头像内部文字大小 */
  textSize?: string;
}

/**
 * 神环环绕头像组件
 * - 未成神：普通头像
 * - 已成神：头像外环绕一圈缓慢旋转的科技感细神环
 * - 神环颜色取自玩家自定义 divineSoulRing.color
 */
export default function DivineRingAvatar({
  name,
  isDeity,
  ringColor = '#fcd34d',
  borderColor = '#fbbf24',
  size = 'md',
  shape = 'circle',
  className = '',
  textSize,
}: DivineRingAvatarProps) {
  // 尺寸映射
  const sizeMap = useMemo(() => {
    const map = {
      sm: { box: 'w-7 h-7', ringInset: -3, ringW: 1.5, text: 'text-[11px]' },
      md: { box: 'w-12 h-12 md:w-14 md:h-14', ringInset: -4, ringW: 2, text: 'text-base md:text-lg' },
      lg: { box: 'w-16 h-16 md:w-20 md:h-20', ringInset: -6, ringW: 2.5, text: 'text-lg md:text-xl' },
      xl: { box: 'w-24 h-24 md:w-28 md:h-28', ringInset: -8, ringW: 3, text: 'text-2xl md:text-3xl' },
    };
    return map[size];
  }, [size]);

  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl';
  const ringShapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';
  const firstChar = name?.slice(0, 1) ?? '?';

  return (
    <div className={`relative inline-flex items-center justify-center ${sizeMap.box} ${className}`}>
      {/* 神环：仅成神时显示 */}
      {isDeity && (
        <>
          {/* 外层主光环 - 缓慢顺时针旋转 */}
          <div
            className={`absolute inset-0 ${ringShapeClass} pointer-events-none`}
            style={{
              inset: `${sizeMap.ringInset}px`,
              border: `${sizeMap.ringW}px solid transparent`,
              borderTopColor: ringColor,
              borderRightColor: `${ringColor}aa`,
              borderBottomColor: `${ringColor}55`,
              boxShadow: `0 0 12px ${ringColor}60, inset 0 0 8px ${ringColor}30`,
              animation: 'divine-ring-spin 6s linear infinite',
              filter: `drop-shadow(0 0 4px ${ringColor})`,
            }}
            aria-hidden="true"
          />
          {/* 内层副光环 - 反向慢速旋转，增加层次感 */}
          <div
            className={`absolute ${ringShapeClass} pointer-events-none`}
            style={{
              inset: `${sizeMap.ringInset / 2}px`,
              border: `1px dashed ${ringColor}70`,
              animation: 'divine-ring-spin-reverse 10s linear infinite',
            }}
            aria-hidden="true"
          />
          {/* 四角光点 - 科技感装饰 */}
          <span
            className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
            style={{
              top: -1,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: ringColor,
              boxShadow: `0 0 6px ${ringColor}, 0 0 12px ${ringColor}80`,
              animation: 'divine-ring-pulse 2s ease-in-out infinite',
            }}
            aria-hidden="true"
          />
          <span
            className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
            style={{
              bottom: -1,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: ringColor,
              boxShadow: `0 0 6px ${ringColor}, 0 0 12px ${ringColor}80`,
              animation: 'divine-ring-pulse 2s ease-in-out infinite 1s',
            }}
            aria-hidden="true"
          />
        </>
      )}

      {/* 头像本体 */}
      <div
        className={`relative flex w-full h-full items-center justify-center ${shapeClass} border-2 font-bold shadow-xl z-10`}
        style={{
          borderColor,
          background: `linear-gradient(135deg, ${borderColor}30, transparent)`,
          boxShadow: isDeity
            ? `0 0 16px ${ringColor}50, 0 0 32px ${ringColor}20`
            : `0 0 20px ${borderColor}30`,
          color: borderColor,
        }}
      >
        <span className={textSize || sizeMap.text}>{firstChar}</span>
      </div>
    </div>
  );
}
