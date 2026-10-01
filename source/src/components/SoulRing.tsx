import { memo, useMemo } from 'react';
import { RING_COLOR_MAP, RING_DISPLAY_COLOR } from '@/lib/gameStore';

/**
 * 魂环组件 —— 高镂空星形装饰风格
 *
 * 设计参考：斗罗大陆动画魂环 —— 细环身 + 星形/火焰形装饰均匀分布
 *
 * 结构（由外到内）：
 * 1. 12方向星形主装饰（四尖星芒形，向外突出，镂空骨架）
 * 2. 次级小尖刺（主装饰之间，更小更细）
 * 3. 外沿双圈细线（环身骨架外沿）
 * 4. 环身骨架：网状花纹线条 + 宝石节点 + 交叉纹（大面积镂空）
 * 5. 内沿双圈细线
 *
 * 特点：
 * - 环身较瘦（宽度窄）
 * - 星形/火焰装饰向外突出，均匀分布
 * - 无横线装饰
 * - 整体精致有层次感
 * - 保留大面积镂空，背景可透出
 * - 少发光特效
 */

interface SoulRingProps {
  color: string;
  years?: number;
  /** 魂兽属性，如 '冰属性'、'火属性' 等，用于百万年魂环光晕着色 */
  beastAttribute?: string;
  customColor?: string;
  size?: number;
  animate?: boolean;
  rotateDuration?: number;
  rotateDir?: number;
  className?: string;
  glowScale?: number;
  /** 简化模式：小尺寸图标用时只渲染核心圆环+基础装饰，省略复杂细节（性能优化） */
  simpleMode?: boolean;
}

interface RingPalette {
  /** 外光晕 */
  glow: string;
  /** 装饰主色（星形/火焰描边主色） */
  ornamentMain: string;
  /** 装饰亮色（高光边） */
  ornamentLight: string;
  /** 装饰暗线（内凹/阴影边） */
  ornamentDark: string;
  /** 次级尖刺色 */
  subSpike: string;
  /** 外沿高光圈 */
  ringEdgeOuter: string;
  /** 外沿次暗圈 */
  ringEdgeOuterDark: string;
  /** 内沿高光圈 */
  ringEdgeInner: string;
  /** 内沿次暗圈 */
  ringEdgeInnerDark: string;
  /** 环身实心主色 */
  ringBodyMain: string;
  /** 环身实心暗侧（内圈渐变端） */
  ringBodyDark: string;
  /** 环身实心亮侧（外圈渐变端） */
  ringBodyLight: string;
  /** 蕾丝花纹亮色 */
  laceLight: string;
  /** 蕾丝花纹深色 */
  laceDark: string;
  /** 宝石色 */
  gem: string;
  /** 宝石高光 */
  gemHighlight: string;
}

// 魂兽属性 → 光晕颜色映射（用于百万年魂环外圈光晕）
const ELEMENT_GLOW_MAP: Record<string, string> = {
  '金': '#FFD700',
  '金属性': '#FFD700',
  '木': '#22C55E',
  '木属性': '#22C55E',
  '生命': '#22C55E',
  '水': '#3B82F6',
  '水属性': '#3B82F6',
  '火': '#EF4444',
  '火属性': '#EF4444',
  '土': '#A16207',
  '土属性': '#A16207',
  '冰': '#22D3EE',
  '冰属性': '#22D3EE',
  '雷': '#A855F7',
  '雷属性': '#A855F7',
  '雷霆': '#A855F7',
  '风': '#14B8A6',
  '风属性': '#14B8A6',
  '速度': '#14B8A6',
  '光明': '#FEF3C7',
  '光': '#FEF3C7',
  '光属性': '#FEF3C7',
  '黑暗': '#6D28D9',
  '暗': '#6D28D9',
  '暗属性': '#6D28D9',
  '死亡': '#1F2937',
  '精神': '#EC4899',
  '灵魂': '#EC4899',
  '轮回': '#EC4899',
  '混沌': '#D946EF',
  '毁灭': '#7C3AED',
  '杀': '#DC2626',
  '力量': '#F59E0B',
  '刃': '#F59E0B',
  '防御': '#78716C',
  '辅助': '#A3E635',
  '破坏': '#EF4444',
  '贪婪': '#CA8A04',
  '愤怒': '#DC2626',
  '傲慢': '#7C3AED',
  '嫉妒': '#16A34A',
  '色欲': '#DB2777',
  '懒惰': '#64748B',
  '锻造': '#F97316',
  '花': '#F472B6',
  '蝶': '#EC4899',
  '剑': '#06B6D4',
  '枪': '#EA580C',
  '弓': '#EAB308',
  '善良': '#F59E0B',
  '邪恶': '#7C3AED',
  '情绪': '#EC4899',
  '罗刹': '#BE123C',
  '天使': '#FBBF24',
  '食物': '#F59E0B',
  '九彩': '#A855F7',
};

function getElementGlow(attribute?: string): string {
  if (!attribute) return 'rgba(252, 211, 77, 0.25)';
  // 去掉常见后缀，匹配关键字
  const clean = attribute.replace(/属性$/, '').replace(/之/, '');
  // 精确匹配
  if (ELEMENT_GLOW_MAP[attribute]) return ELEMENT_GLOW_MAP[attribute];
  if (ELEMENT_GLOW_MAP[clean]) return ELEMENT_GLOW_MAP[clean];
  // 关键词模糊匹配
  for (const key of Object.keys(ELEMENT_GLOW_MAP)) {
    if (attribute.includes(key)) return ELEMENT_GLOW_MAP[key];
  }
  return 'rgba(252, 211, 77, 0.25)';
}

const PALETTES: Record<string, RingPalette> = {
  white: {
    glow: 'rgba(180, 180, 195, 0.12)',
    ornamentMain: '#b8b8c4',
    ornamentLight: '#dcdce4',
    ornamentDark: '#6a6a7a',
    subSpike: '#a8a8b4',
    ringEdgeOuter: '#c8c8d0',
    ringEdgeOuterDark: '#888898',
    ringEdgeInner: '#b0b0bc',
    ringEdgeInnerDark: '#606070',
    ringBodyMain: '#b0b0bc',
    ringBodyDark: '#808090',
    ringBodyLight: '#c8c8d0',
    laceLight: '#d0d0d8',
    laceDark: '#787888',
    gem: '#d0d0d8',
    gemHighlight: '#e8e8f0',
  },
  yellow: {
    glow: 'rgba(180, 130, 10, 0.16)',
    ornamentMain: '#c89018',
    ornamentLight: '#e8b840',
    ornamentDark: '#704a08',
    subSpike: '#a87810',
    ringEdgeOuter: '#d8a020',
    ringEdgeOuterDark: '#806008',
    ringEdgeInner: '#b88018',
    ringEdgeInnerDark: '#5a4006',
    ringBodyMain: '#a07010',
    ringBodyDark: '#704a08',
    ringBodyLight: '#c89018',
    laceLight: '#d09820',
    laceDark: '#604408',
    gem: '#d8a020',
    gemHighlight: '#e8b840',
  },
  purple: {
    glow: 'rgba(80, 25, 140, 0.22)',
    ornamentMain: '#7a30b8',
    ornamentLight: '#a860d8',
    ornamentDark: '#3a0f60',
    subSpike: '#6b24a0',
    ringEdgeOuter: '#8b40c8',
    ringEdgeOuterDark: '#4a1870',
    ringEdgeInner: '#6b28a0',
    ringEdgeInnerDark: '#2a0a48',
    ringBodyMain: '#5a1e8f',
    ringBodyDark: '#3a0f60',
    ringBodyLight: '#7a30b8',
    laceLight: '#8b40c8',
    laceDark: '#3a0f60',
    gem: '#8b40c8',
    gemHighlight: '#a860d8',
  },
  black: {
    glow: 'rgba(0, 0, 0, 0.7)',
    ornamentMain: '#1a1a1a',
    ornamentLight: '#3a3a3a',
    ornamentDark: '#000000',
    subSpike: '#101010',
    ringEdgeOuter: '#333333',
    ringEdgeOuterDark: '#000000',
    ringEdgeInner: '#222222',
    ringEdgeInnerDark: '#000000',
    ringBodyMain: '#000000',
    ringBodyDark: '#000000',
    ringBodyLight: '#111111',
    laceLight: '#3a3a3a',
    laceDark: '#000000',
    gem: '#444444',
    gemHighlight: '#666666',
  },
  red: {
    glow: 'rgba(178, 34, 34, 0.28)',
    ornamentMain: '#8B1A1A',
    ornamentLight: '#cc4040',
    ornamentDark: '#5a0a0a',
    subSpike: '#7a1515',
    ringEdgeOuter: '#b02020',
    ringEdgeOuterDark: '#6a0d0d',
    ringEdgeInner: '#8B1A1A',
    ringEdgeInnerDark: '#4a0808',
    ringBodyMain: '#8B0000',
    ringBodyDark: '#5a0a0a',
    ringBodyLight: '#a82525',
    laceLight: '#b02020',
    laceDark: '#5a0a0a',
    gem: '#c03030',
    gemHighlight: '#dc5050',
  },
  gold: {
    glow: 'rgba(200, 160, 20, 0.25)',
    ornamentMain: '#b8860b',
    ornamentLight: '#e0b020',
    ornamentDark: '#705006',
    subSpike: '#9a7008',
    ringEdgeOuter: '#c89610',
    ringEdgeOuterDark: '#806006',
    ringEdgeInner: '#a0780a',
    ringEdgeInnerDark: '#5a4004',
    ringBodyMain: '#8a6808',
    ringBodyDark: '#604806',
    ringBodyLight: '#b8860b',
    laceLight: '#c89610',
    laceDark: '#604806',
    gem: '#c89610',
    gemHighlight: '#e0b020',
  },
  // 天梦冰蚕专属：纯蓝色魂环（百万年，冰灵之眸）
  // 🔴 严格纯蓝色，无任何金色/黄色元素
  blueWhite: {
    glow: 'rgba(96, 210, 255, 0.45)',
    ornamentMain: '#38bdf8',
    ornamentLight: '#7dd3fc',
    ornamentDark: '#0369a1',
    subSpike: '#0ea5e9',
    ringEdgeOuter: '#60d2ff',
    ringEdgeOuterDark: '#0284c7',
    ringEdgeInner: '#38bdf8',
    ringEdgeInnerDark: '#0ea5e9',
    ringBodyMain: '#0ea5e9',
    ringBodyDark: '#0369a1',
    ringBodyLight: '#7dd3fc',
    laceLight: '#bae6fd',
    laceDark: '#0284c7',
    gem: '#7dd3fc',
    gemHighlight: '#e0f2fe',
  },
};

export default memo(function SoulRing({
  color,
  years = 0,
  beastAttribute,
  customColor,
  size = 60,
  animate = true,
  rotateDuration = 18,
  rotateDir = 1,
  className = '',
  glowScale = 0.3,
  simpleMode = false,
}: SoulRingProps) {
  const ringColor = customColor || RING_COLOR_MAP[color as keyof typeof RING_COLOR_MAP] || '#f59e0b';
  const displayColor = customColor
    ? (color === 'white' ? '#5a4a3a' : customColor)
    : RING_DISPLAY_COLOR[color as keyof typeof RING_DISPLAY_COLOR] || ringColor;

  const palette = PALETTES[color] || PALETTES.yellow;

  const isGod = color === 'gold';
  const isBlack = color === 'black';
  const isWhite = color === 'white';
  const isBlueWhite = color === 'blueWhite'; // 天梦冰蚕专属
  // 百万年魂环（金色品质 / 蓝白色天梦冰蚕）：天梦冰蚕用淡蓝色属性光晕
  const isMillionYear = (color === 'gold' && years >= 1000000) || isBlueWhite;
  const elementGlow = isBlueWhite
    ? '#60d2ff' // 天梦冰蚕专属：纯净淡蓝色光晕（无任何金色）
    : isMillionYear
    ? getElementGlow(beastAttribute)
    : palette.glow;

  // 金色波纹数量 = Math.floor((年限 - 100000) / 100000)
  // 10万年：0道；20万年：1道；百万年：9道+；百万年以上金魂环也显示金纹
  const goldWaveCount = useMemo(() => {
    if (years < 100000) return 0;
    // 最多显示9道（视觉上已足够复杂）
    return Math.min(9, Math.max(0, Math.floor((years - 100000) / 100000)));
  }, [years]);

  // 是否显示金色波纹（红色十万年以上 / 金色百万年）
  // 🔴 天梦冰蚕蓝白色魂环：纯蓝色，不带金色装饰
  const hasGoldWaves = goldWaveCount > 0 && !isBlueWhite;

  // 小尺寸自动降级：size < 36 或 simpleMode=true 时走简化渲染
  const useSimple = simpleMode || size < 36;

  /** 年限等级，影响装饰复杂度 */
  const tier = useMemo(() => {
    if (isGod) return 6;
    // 天梦冰蚕：百万年品质但用蓝色装饰，tier 与红色十万年同级（5级）
    if (color === 'red' || years >= 100000 || isBlueWhite) return 5;
    if (isBlack || years >= 10000) return 4;
    if (color === 'purple' || years >= 1000) return 3;
    if (color === 'yellow' || years >= 100) return 2;
    return 1;
  }, [color, isGod, isBlack, years, isBlueWhite]);

  const center = size / 2;
  const sw = Math.max(0.7, size * 0.015); // 基础线条宽度（瘦身，比原版窄）

  // 半径定义（从外到内）— 环身更瘦
  const rOrnamentTip = center - sw * 0.4;     // 星形装饰最外尖端
  const rOrnamentBase = center - sw * 2.2;    // 星形装饰底部（环外沿附近）
  const rRingOuter = center - sw * 2.5;       // 环最外沿
  const rRingOuter2 = center - sw * 2.8;      // 外沿第二圈
  const rRingMidOuter = center - sw * 3.6;    // 环身骨架外弧半径
  const rLace = center - sw * 4.2;            // 环身中线（宝石贴合线）
  const rRingMidInner = center - sw * 4.8;    // 环身骨架内弧半径
  const rRingInner2 = center - sw * 5.5;      // 内沿第二圈
  const rRingInner = center - sw * 5.8;       // 环最内沿

  // 主装饰数量：12个（均匀分布，参考图的密度）
  const mainOrnamentCount = 12;
  // 次级尖刺数量：12个（主装饰之间）
  const subSpikeCount = 12;

  // ===================== 星形主装饰（12方向，四尖星芒 + 镂空骨架） =====================
  const mainOrnaments = useMemo(() => {
    const items: React.ReactNode[] = [];

    for (let i = 0; i < mainOrnamentCount; i++) {
      const angle = (i / mainOrnamentCount) * Math.PI * 2;
      const sinA = Math.sin(angle);
      const cosA = Math.cos(angle);

      // 外尖端
      const tipX = center + cosA * rOrnamentTip;
      const tipY = center + sinA * rOrnamentTip;

      // 底部宽度（装饰根部宽度）
      const baseHalf = sw * (1.1 + tier * 0.15);

      // 底部左右点（在环外沿）
      const baseLx = center + cosA * rOrnamentBase - sinA * baseHalf;
      const baseLy = center + sinA * rOrnamentBase + cosA * baseHalf;
      const baseRx = center + cosA * rOrnamentBase + sinA * baseHalf;
      const baseRy = center + sinA * rOrnamentBase - cosA * baseHalf;

      // 星形：双肩部 + 尖顶（火焰/星芒造型，两侧有内凹尖角）
      const shoulderR = rOrnamentBase + (rOrnamentTip - rOrnamentBase) * 0.35;
      const shoulderHalf = baseHalf * 0.85;
      const sLx = center + cosA * shoulderR - sinA * shoulderHalf;
      const sLy = center + sinA * shoulderR + cosA * shoulderHalf;
      const sRx = center + cosA * shoulderR + sinA * shoulderHalf;
      const sRy = center + sinA * shoulderR - cosA * shoulderHalf;

      // 腰部内凹（星形的内凹点）
      const waistR = rOrnamentBase + (rOrnamentTip - rOrnamentBase) * 0.6;
      const waistHalf = baseHalf * 0.55;
      const wLx = center + cosA * waistR - sinA * waistHalf;
      const wLy = center + sinA * waistR + cosA * waistHalf;
      const wRx = center + cosA * waistR + sinA * waistHalf;
      const wRy = center + sinA * waistR - cosA * waistHalf;

      // 星形主轮廓 path（火焰/星芒形状：底部宽 → 肩部展开 → 腰部内凹 → 尖顶）
      const starOutline = `M ${baseLx.toFixed(2)} ${baseLy.toFixed(2)}
        L ${sLx.toFixed(2)} ${sLy.toFixed(2)}
        Q ${wLx.toFixed(2)} ${wLy.toFixed(2)} ${tipX.toFixed(2)} ${tipY.toFixed(2)}
        Q ${wRx.toFixed(2)} ${wRy.toFixed(2)} ${sRx.toFixed(2)} ${sRy.toFixed(2)}
        L ${baseRx.toFixed(2)} ${baseRy.toFixed(2)} Z`;

      // 底色（实心填充，与环身同色系但略浅，突出装饰立体感）
      items.push(
        <path
          key={`mo-bg-${i}`}
          d={starOutline}
          fill={palette.ornamentMain}
          opacity={0.85}
        />
      );

      // 外轮廓描边（主骨架线）
      items.push(
        <path
          key={`mo-outline-${i}`}
          d={starOutline}
          fill="none"
          stroke={palette.ornamentDark}
          strokeWidth={Math.max(0.35, sw * 0.22)}
          strokeLinejoin="round"
          opacity={0.9}
        />
      );

      // 内层高光描边（比外轮廓略小，亮色，增强层次感）
      const innerScale = 0.72;
      const innerTipR = rOrnamentBase + (rOrnamentTip - rOrnamentBase) * innerScale;
      const iTipX = center + cosA * innerTipR;
      const iTipY = center + sinA * innerTipR;
      const iShoulderR = rOrnamentBase + (shoulderR - rOrnamentBase) * innerScale;
      const iShoulderHalf = shoulderHalf * innerScale;
      const isLx = center + cosA * iShoulderR - sinA * iShoulderHalf;
      const isLy = center + sinA * iShoulderR + cosA * iShoulderHalf;
      const isRx = center + cosA * iShoulderR + sinA * iShoulderHalf;
      const isRy = center + sinA * iShoulderR - cosA * iShoulderHalf;
      const iBaseHalf = baseHalf * innerScale;
      const ibLx = center + cosA * (rOrnamentBase + sw * 0.1) - sinA * iBaseHalf;
      const ibLy = center + sinA * (rOrnamentBase + sw * 0.1) + cosA * iBaseHalf;
      const ibRx = center + cosA * (rOrnamentBase + sw * 0.1) + sinA * iBaseHalf;
      const ibRy = center + sinA * (rOrnamentBase + sw * 0.1) - cosA * iBaseHalf;

      const innerOutline = `M ${ibLx.toFixed(2)} ${ibLy.toFixed(2)}
        L ${isLx.toFixed(2)} ${isLy.toFixed(2)}
        Q ${center + cosA * (rOrnamentBase + (waistR - rOrnamentBase) * innerScale) - sinA * (waistHalf * innerScale)} ${center + sinA * (rOrnamentBase + (waistR - rOrnamentBase) * innerScale) + cosA * (waistHalf * innerScale)} ${iTipX.toFixed(2)} ${iTipY.toFixed(2)}
        Q ${center + cosA * (rOrnamentBase + (waistR - rOrnamentBase) * innerScale) + sinA * (waistHalf * innerScale)} ${center + sinA * (rOrnamentBase + (waistR - rOrnamentBase) * innerScale) - cosA * (waistHalf * innerScale)} ${isRx.toFixed(2)} ${isRy.toFixed(2)}
        L ${ibRx.toFixed(2)} ${ibRy.toFixed(2)} Z`;

      items.push(
        <path
          key={`mo-inner-${i}`}
          d={innerOutline}
          fill="none"
          stroke={palette.ornamentLight}
          strokeWidth={Math.max(0.25, sw * 0.15)}
          strokeLinejoin="round"
          opacity={0.75}
        />
      );

      // 中脊高光线（从底部到尖顶）
      const ridgeBaseX = center + cosA * (rOrnamentBase + sw * 0.05);
      const ridgeBaseY = center + sinA * (rOrnamentBase + sw * 0.05);
      const ridgeTipX = center + cosA * (rOrnamentTip - sw * 0.3);
      const ridgeTipY = center + sinA * (rOrnamentTip - sw * 0.3);
      items.push(
        <path
          key={`mo-ridge-${i}`}
          d={`M ${ridgeBaseX.toFixed(2)} ${ridgeBaseY.toFixed(2)} L ${ridgeTipX.toFixed(2)} ${ridgeTipY.toFixed(2)}`}
          stroke={palette.ornamentLight}
          strokeWidth={Math.max(0.3, sw * 0.2)}
          strokeLinecap="round"
          opacity={0.7}
        />
      );

      // 肩部两侧小尖（星芒侧边突出的小尖）
      if (tier >= 2) {
        for (let side = -1; side <= 1; side += 2) {
          const sideAngle = angle + side * 0.32;
          const sideSin = Math.sin(sideAngle);
          const sideCos = Math.cos(sideAngle);
          const sideTipR = rOrnamentBase + (rOrnamentTip - rOrnamentBase) * 0.38;
          const sideTipX = center + sideCos * sideTipR;
          const sideTipY = center + sideSin * sideTipR;
          // 从肩部到侧尖
          const sFromX = side > 0 ? sRx : sLx;
          const sFromY = side > 0 ? sRy : sLy;
          items.push(
            <path
              key={`mo-side-${i}-${side}`}
              d={`M ${sFromX.toFixed(2)} ${sFromY.toFixed(2)} L ${sideTipX.toFixed(2)} ${sideTipY.toFixed(2)}`}
              stroke={palette.ornamentLight}
              strokeWidth={Math.max(0.2, sw * 0.13)}
              strokeLinecap="round"
              opacity={0.5}
            />
          );
        }
      }

      // 尖端小菱形/宝石装饰（高等级才有）
      if (tier >= 3) {
        const gemSize = sw * 0.35;
        const gx = center + cosA * (rOrnamentTip - sw * 0.25);
        const gy = center + sinA * (rOrnamentTip - sw * 0.25);
        items.push(
          <path
            key={`mo-gem-${i}`}
            d={`M ${gx} ${(gy - gemSize).toFixed(2)}
                L ${(gx + gemSize * 0.55).toFixed(2)} ${gy}
                L ${gx} ${(gy + gemSize).toFixed(2)}
                L ${(gx - gemSize * 0.55).toFixed(2)} ${gy} Z`}
            fill={palette.ornamentLight}
            opacity={0.7}
          />
        );
      }
    }

    return items;
  }, [center, rOrnamentTip, rOrnamentBase, palette, sw, tier]);

  // ===================== 次级尖刺（主装饰之间，更小的尖刺） =====================
  const subSpikes = useMemo(() => {
    const items: React.ReactNode[] = [];
    if (tier < 2) return items;

    for (let i = 0; i < subSpikeCount; i++) {
      const angle = ((i + 0.5) / subSpikeCount) * Math.PI * 2;
      const sinA = Math.sin(angle);
      const cosA = Math.cos(angle);

      const tipR = rOrnamentBase + (rOrnamentTip - rOrnamentBase) * 0.45;
      const tipX = center + cosA * tipR;
      const tipY = center + sinA * tipR;

      const baseHalf = sw * 0.5;
      const baseLx = center + cosA * rOrnamentBase - sinA * baseHalf;
      const baseLy = center + sinA * rOrnamentBase + cosA * baseHalf;
      const baseRx = center + cosA * rOrnamentBase + sinA * baseHalf;
      const baseRy = center + sinA * rOrnamentBase - cosA * baseHalf;

      // 小尖刺轮廓（简化版星形）
      const d = `M ${baseLx.toFixed(2)} ${baseLy.toFixed(2)}
        L ${tipX.toFixed(2)} ${tipY.toFixed(2)}
        L ${baseRx.toFixed(2)} ${baseRy.toFixed(2)} Z`;

      items.push(
        <path
          key={`ss-bg-${i}`}
          d={d}
          fill={palette.subSpike}
          opacity={0.25}
        />
      );
      items.push(
        <path
          key={`ss-outline-${i}`}
          d={d}
          fill="none"
          stroke={palette.ornamentDark}
          strokeWidth={Math.max(0.25, sw * 0.15)}
          strokeLinejoin="round"
          opacity={0.75}
        />
      );

      // 中脊线
      items.push(
        <line
          key={`ss-ridge-${i}`}
          x1={(center + cosA * (rOrnamentBase + sw * 0.05)).toFixed(2)}
          y1={(center + sinA * (rOrnamentBase + sw * 0.05)).toFixed(2)}
          x2={(center + cosA * (tipR - sw * 0.2)).toFixed(2)}
          y2={(center + sinA * (tipR - sw * 0.2)).toFixed(2)}
          stroke={palette.ornamentLight}
          strokeWidth={Math.max(0.2, sw * 0.12)}
          strokeLinecap="round"
          opacity={0.5}
        />
      );
    }
    return items;
  }, [center, rOrnamentTip, rOrnamentBase, palette, sw, tier]);

  // ===================== 蕾丝网状花纹（骨架镂空，无横线） =====================
  const lacePattern = useMemo(() => {
    const items: React.ReactNode[] = [];
    const segments = 12; // 12段，跟装饰数量对应

    for (let s = 0; s < segments; s++) {
      const leftAngle = (s / segments) * Math.PI * 2;
      const rightAngle = ((s + 1) / segments) * Math.PI * 2;
      const midAngle = (leftAngle + rightAngle) / 2;

      // 宝石节点数（每段1~2个）
      const gemCountPerSeg = 1 + Math.floor(tier / 3);

      // === 水滴形宝石节点（切面镂空感）===
      for (let g = 0; g <= gemCountPerSeg; g++) {
        const t = g / gemCountPerSeg;
        const gemAngle = leftAngle + (rightAngle - leftAngle) * t;
        const gemSin = Math.sin(gemAngle);
        const gemCos = Math.cos(gemAngle);
        const gx = center + gemCos * rLace;
        const gy = center + gemSin * rLace;

        const gemW = sw * 0.4;
        const gemH = sw * 0.85;
        const gTipX = gx + gemCos * gemH * 0.5;
        const gTipY = gy + gemSin * gemH * 0.5;
        const gBaseX = gx - gemCos * gemH * 0.4;
        const gBaseY = gy - gemSin * gemH * 0.4;
        const gLeftX = gx - gemSin * gemW;
        const gLeftY = gy + gemCos * gemW;
        const gRightX = gx + gemSin * gemW;
        const gRightY = gy - gemCos * gemW;

        const gemD = `M ${gTipX.toFixed(2)} ${gTipY.toFixed(2)}
          Q ${gRightX.toFixed(2)} ${(gy + gemSin * gemH * 0.1).toFixed(2)} ${gRightX.toFixed(2)} ${gBaseY.toFixed(2)}
          Q ${gx.toFixed(2)} ${(gBaseY - gemH * 0.15).toFixed(2)} ${gLeftX.toFixed(2)} ${gBaseY.toFixed(2)}
          Q ${gLeftX.toFixed(2)} ${(gy + gemSin * gemH * 0.1).toFixed(2)} ${gTipX.toFixed(2)} ${gTipY.toFixed(2)} Z`;

        // 宝石底色（半透明）
        items.push(
          <path
            key={`gem-bg-${s}-${g}`}
            d={gemD}
            fill={palette.gem}
            opacity={0.3}
          />
        );
        // 宝石外描边
        items.push(
          <path
            key={`gem-stroke-${s}-${g}`}
            d={gemD}
            fill="none"
            stroke={palette.laceLight}
            strokeWidth={Math.max(0.25, sw * 0.18)}
            strokeLinejoin="round"
            opacity={0.8}
          />
        );

        // 宝石切面线（十字，形成镂空切面感）
        items.push(
          <path
            key={`gem-cut-v-${s}-${g}`}
            d={`M ${gTipX.toFixed(2)} ${gTipY.toFixed(2)} L ${gBaseX.toFixed(2)} ${gBaseY.toFixed(2)}`}
            stroke={palette.laceDark}
            strokeWidth={Math.max(0.15, sw * 0.1)}
            opacity={0.5}
          />
        );
        items.push(
          <path
            key={`gem-cut-h-${s}-${g}`}
            d={`M ${gLeftX.toFixed(2)} ${gLeftY.toFixed(2)} L ${gRightX.toFixed(2)} ${gRightY.toFixed(2)}`}
            stroke={palette.laceDark}
            strokeWidth={Math.max(0.15, sw * 0.09)}
            opacity={0.4}
          />
        );

        // 宝石高光点
        items.push(
          <ellipse
            key={`gem-hl-${s}-${g}`}
            cx={gx - gemCos * gemH * 0.1 + gemSin * gemW * 0.2}
            cy={gy - gemSin * gemH * 0.1 - gemCos * gemW * 0.2}
            rx={gemW * 0.22}
            ry={gemH * 0.15}
            fill={palette.gemHighlight}
            opacity={0.4}
          />
        );
      }

      // === 网状弧线（上下双弧，花瓣形镂空骨架）===
      const arcPoints = gemCountPerSeg + 1;
      for (let p = 0; p < arcPoints - 1; p++) {
        const t1 = p / gemCountPerSeg;
        const t2 = (p + 1) / gemCountPerSeg;
        const a1 = leftAngle + (rightAngle - leftAngle) * t1;
        const a2 = leftAngle + (rightAngle - leftAngle) * t2;
        const midA = (a1 + a2) / 2;

        const x1 = center + Math.cos(a1) * rLace;
        const y1 = center + Math.sin(a1) * rLace;
        const x2 = center + Math.cos(a2) * rLace;
        const y2 = center + Math.sin(a2) * rLace;

        // 外弧（亮色，主骨架）
        const outerR = rRingMidOuter;
        const ox = center + Math.cos(midA) * outerR;
        const oy = center + Math.sin(midA) * outerR;
        items.push(
          <path
            key={`lace-up-${s}-${p}`}
            d={`M ${x1.toFixed(2)} ${y1.toFixed(2)} Q ${ox.toFixed(2)} ${oy.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`}
            fill="none"
            stroke={palette.laceLight}
            strokeWidth={Math.max(0.3, sw * 0.22)}
            strokeLinecap="round"
            opacity={0.75}
          />
        );

        // 内弧（深色，次骨架）
        const innerR = rRingMidInner;
        const ix = center + Math.cos(midA) * innerR;
        const iy = center + Math.sin(midA) * innerR;
        items.push(
          <path
            key={`lace-dn-${s}-${p}`}
            d={`M ${x1.toFixed(2)} ${y1.toFixed(2)} Q ${ix.toFixed(2)} ${iy.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`}
            fill="none"
            stroke={palette.laceDark}
            strokeWidth={Math.max(0.22, sw * 0.16)}
            strokeLinecap="round"
            opacity={0.6}
          />
        );

        // === X 形交叉斜纹（连接内外弧，形成菱形镂空；无横线装饰）===
        const crossOuterR = rRingMidOuter - sw * 0.05;
        const crossInnerR = rRingMidInner + sw * 0.05;
        const crossA1 = a1 + (a2 - a1) * 0.2;
        const crossA2 = a1 + (a2 - a1) * 0.8;

        const cx1 = center + Math.cos(crossA1) * crossOuterR;
        const cy1 = center + Math.sin(crossA1) * crossOuterR;
        const cx2 = center + Math.cos(crossA2) * crossInnerR;
        const cy2 = center + Math.sin(crossA2) * crossInnerR;
        const cx3 = center + Math.cos(crossA1) * crossInnerR;
        const cy3 = center + Math.sin(crossA1) * crossInnerR;
        const cx4 = center + Math.cos(crossA2) * crossOuterR;
        const cy4 = center + Math.sin(crossA2) * crossOuterR;

        items.push(
          <line
            key={`cross1-${s}-${p}`}
            x1={cx1.toFixed(2)}
            y1={cy1.toFixed(2)}
            x2={cx2.toFixed(2)}
            y2={cy2.toFixed(2)}
            stroke={palette.laceLight}
            strokeWidth={Math.max(0.2, sw * 0.13)}
            strokeLinecap="round"
            opacity={0.5}
          />
        );
        items.push(
          <line
            key={`cross2-${s}-${p}`}
            x1={cx3.toFixed(2)}
            y1={cy3.toFixed(2)}
            x2={cx4.toFixed(2)}
            y2={cy4.toFixed(2)}
            stroke={palette.laceLight}
            strokeWidth={Math.max(0.2, sw * 0.13)}
            strokeLinecap="round"
            opacity={0.5}
          />
        );

        // tier>=4：第二组更细的交叉纹
        if (tier >= 4) {
          const crossA3 = a1 + (a2 - a1) * 0.38;
          const crossA4 = a1 + (a2 - a1) * 0.62;
          const c31x = center + Math.cos(crossA3) * crossOuterR;
          const c31y = center + Math.sin(crossA3) * crossOuterR;
          const c32x = center + Math.cos(crossA4) * crossInnerR;
          const c32y = center + Math.sin(crossA4) * crossInnerR;
          const c33x = center + Math.cos(crossA3) * crossInnerR;
          const c33y = center + Math.sin(crossA3) * crossInnerR;
          const c34x = center + Math.cos(crossA4) * crossOuterR;
          const c34y = center + Math.sin(crossA4) * crossOuterR;
          items.push(
            <line
              key={`cross3-${s}-${p}`}
              x1={c31x.toFixed(2)}
              y1={c31y.toFixed(2)}
              x2={c32x.toFixed(2)}
              y2={c32y.toFixed(2)}
              stroke={palette.laceDark}
              strokeWidth={Math.max(0.15, sw * 0.1)}
              strokeLinecap="round"
              opacity={0.4}
            />
          );
          items.push(
            <line
              key={`cross4-${s}-${p}`}
              x1={c33x.toFixed(2)}
              y1={c33y.toFixed(2)}
              x2={c34x.toFixed(2)}
              y2={c34y.toFixed(2)}
              stroke={palette.laceDark}
              strokeWidth={Math.max(0.15, sw * 0.1)}
              strokeLinecap="round"
              opacity={0.4}
            />
          );
        }
      }

      // === 段中心辐射细丝（纯线条，无横线）===
      const midSin = Math.sin(midAngle);
      const midCos = Math.cos(midAngle);
      const midRays = 2 + Math.floor(tier * 0.6);
      for (let r = 0; r < midRays; r++) {
        const spread = -0.3 + (r / (midRays - 1)) * 0.6;
        const rayAngle = midAngle + spread;
        const raySin = Math.sin(rayAngle);
        const rayCos = Math.cos(rayAngle);
        const rayInnerR = rRingMidInner + sw * 0.15;
        const rayOuterR = rRingMidOuter - sw * 0.15;

        const rx1 = center + rayCos * rayInnerR;
        const ry1 = center + raySin * rayInnerR;
        const rx2 = center + rayCos * rayOuterR;
        const ry2 = center + raySin * rayOuterR;

        items.push(
          <line
            key={`ray-${s}-${r}`}
            x1={rx1.toFixed(2)}
            y1={ry1.toFixed(2)}
            x2={rx2.toFixed(2)}
            y2={ry2.toFixed(2)}
            stroke={palette.laceLight}
            strokeWidth={Math.max(0.15, sw * (0.15 - Math.abs(spread) * 0.18))}
            strokeLinecap="round"
            opacity={0.4 - Math.abs(spread) * 0.35}
          />
        );
      }
    }

    return items;
  }, [center, rLace, rRingMidOuter, rRingMidInner, palette, sw, tier, color, isGod]);

  // ===================== 方波连接（锯齿波浪线，沿环身弧度连接镂空处） =====================
  const squareWaves = useMemo(() => {
    const items: React.ReactNode[] = [];
    // 3 道波浪：分别在环身骨架的外/中/内不同半径
    const waveRadii = [
      rRingMidOuter - sw * 0.2,
      rLace,
      rRingMidInner + sw * 0.2,
    ];
    // 十万年以上（red/gold）波纹改为淡金色，柔和对比；其余按原 palette
    const isSenior = color === 'red' || isGod;
    const waveColors = isSenior
      ? [
          'rgba(232, 200, 120, 0.9)',  // 外圈：偏亮的淡金色
          'rgba(218, 185, 100, 0.8)',  // 中圈：标准淡金色
          'rgba(200, 165, 80, 0.7)',   // 内圈：略深的淡金色
        ]
      : [
          palette.laceLight,
          palette.ornamentMain,
          palette.laceDark,
        ];
    const waveOps = isSenior ? [0.6, 0.55, 0.5] : [0.5, 0.45, 0.4];
    const waveWidths = [sw * 0.14, sw * 0.12, sw * 0.1];

    // 一圈波峰数：24 个，疏密适中
    const waveCount = 24;
    const waveSpan = (Math.PI * 2) / waveCount;
    const toothDepth = sw * 0.24; // 波浪振幅

    waveRadii.forEach((baseR, wi) => {
      // 使用 path + Q 曲线画平滑波浪（每一波一个贝塞尔段）
      let d = '';
      for (let i = 0; i <= waveCount; i++) {
        const angle = i * waveSpan;
        const nextAngle = (i + 1) * waveSpan;
        const midAngle = (angle + nextAngle) / 2;

        // 波谷点（起点）
        const r1 = baseR - toothDepth * 0.5;
        const x1 = center + Math.cos(angle) * r1;
        const y1 = center + Math.sin(angle) * r1;
        // 波峰点（控制点+终点）
        const rPeak = baseR + toothDepth;
        const cx = center + Math.cos(midAngle) * rPeak;
        const cy = center + Math.sin(midAngle) * rPeak;
        const r2 = baseR - toothDepth * 0.5;
        const x2 = center + Math.cos(nextAngle) * r2;
        const y2 = center + Math.sin(nextAngle) * r2;

        if (i === 0) d = `M ${x1.toFixed(2)} ${y1.toFixed(2)}`;
        d += ` Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
      }

      items.push(
        <path
          key={`sw-${wi}`}
          d={d}
          fill="none"
          stroke={waveColors[wi]}
          strokeWidth={Math.max(0.2, waveWidths[wi])}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={waveOps[wi]}
        />
      );

      // 中层波浪加一圈更细的内凹波浪，增加层次感
      if (wi === 1) {
        let d2 = '';
        const innerBaseR = baseR - toothDepth * 0.3;
        for (let i = 0; i <= waveCount; i++) {
          const angle = i * waveSpan + waveSpan / 2; // 相位错开
          const nextAngle = (i + 1) * waveSpan + waveSpan / 2;
          const midAngle = (angle + nextAngle) / 2;
          const r1 = innerBaseR + toothDepth * 0.35;
          const x1 = center + Math.cos(angle) * r1;
          const y1 = center + Math.sin(angle) * r1;
          const rPeak = innerBaseR - toothDepth * 0.25;
          const cx = center + Math.cos(midAngle) * rPeak;
          const cy = center + Math.sin(midAngle) * rPeak;
          const r2 = innerBaseR + toothDepth * 0.35;
          const x2 = center + Math.cos(nextAngle) * r2;
          const y2 = center + Math.sin(nextAngle) * r2;
          if (i === 0) d2 = `M ${x1.toFixed(2)} ${y1.toFixed(2)}`;
          d2 += ` Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
        }
        items.push(
          <path
            key={`sw-inner-mid`}
            d={d2}
            fill="none"
            stroke={palette.laceLight}
            strokeWidth={Math.max(0.15, sw * 0.08)}
            strokeLinecap="round"
            opacity={0.35}
          />
        );
      }
    });

    return items;
  }, [center, rRingMidOuter, rLace, rRingMidInner, palette, sw, tier]);

  // 星形装饰和扣环尖角错位分布：尖角在星形装饰之间，布局更协调
  // 旋转偏移：半个间隔角度，让尖角卡在两个星形装饰中间
  const clipSpikeOffset = Math.PI / mainOrnamentCount; // 15 度偏移

  // ===================== 扣环尖角（上下都有，像夹子一样扣在环身上） =====================
  // 12 个尖角均匀分布，从环身外沿 + 内沿双向突出，双层描边 + 内部纹理，无横线装饰
  const clipSpikes = useMemo(() => {
    const items: React.ReactNode[] = [];
    const spikeCount = 12; // 12 个，与星形装饰数量一致，布局更协调

    for (let i = 0; i < spikeCount; i++) {
      const angle = (i / spikeCount) * Math.PI * 2 + clipSpikeOffset;
      const sinA = Math.sin(angle);
      const cosA = Math.cos(angle);

      // === 外侧尖角（向外扣） ===
      const outTipR = rOrnamentBase + (rOrnamentTip - rOrnamentBase) * 0.3;
      const outTipX = center + cosA * outTipR;
      const outTipY = center + sinA * outTipR;

      // 底部：扣在环身外沿上，宽度适中
      const outBaseHalf = sw * (0.85 + tier * 0.08);
      const outBaseR = rRingOuter2;
      const outBLx = center + cosA * outBaseR - sinA * outBaseHalf;
      const outBLy = center + sinA * outBaseR + cosA * outBaseHalf;
      const outBRx = center + cosA * outBaseR + sinA * outBaseHalf;
      const outBRy = center + sinA * outBaseR - cosA * outBaseHalf;

      // 腰部（尖角向内收的位置，形成"夹子"造型）
      const outWaistR = outBaseR + (outTipR - outBaseR) * 0.5;
      const outWaistHalf = outBaseHalf * 0.38;
      const outWLx = center + cosA * outWaistR - sinA * outWaistHalf;
      const outWLy = center + sinA * outWaistR + cosA * outWaistHalf;
      const outWRx = center + cosA * outWaistR + sinA * outWaistHalf;
      const outWRy = center + sinA * outWaistR - cosA * outWaistHalf;

      // 外尖角轮廓（底部宽 → 腰部内收 → 尖顶，尖顶用圆弧突出更锐利）
      const outD = `M ${outBLx.toFixed(2)} ${outBLy.toFixed(2)}
        L ${outWLx.toFixed(2)} ${outWLy.toFixed(2)}
        Q ${outTipX.toFixed(2)} ${outTipY.toFixed(2)} ${outWRx.toFixed(2)} ${outWRy.toFixed(2)}
        L ${outBRx.toFixed(2)} ${outBRy.toFixed(2)} Z`;

      // 底色半透明
      items.push(
        <path
          key={`clip-out-bg-${i}`}
          d={outD}
          fill={palette.ornamentMain}
          opacity={0.25}
        />
      );
      // 外轮廓描边（暗边）
      items.push(
        <path
          key={`clip-out-stroke-${i}`}
          d={outD}
          fill="none"
          stroke={palette.ornamentDark}
          strokeWidth={Math.max(0.3, sw * 0.2)}
          strokeLinejoin="round"
          opacity={0.85}
        />
      );
      // 内层高光描边（双层描边效果）
      const inScale = 0.58;
      const inTipR = outBaseR + (outTipR - outBaseR) * inScale;
      const inTipX = center + cosA * inTipR;
      const inTipY = center + sinA * inTipR;
      const inWaistR = outBaseR + (outWaistR - outBaseR) * inScale;
      const inWaistHalf = outWaistHalf * inScale;
      const inBaseR = outBaseR + sw * 0.18;
      const inBaseHalf = outBaseHalf * inScale;
      const iBLx = center + cosA * inBaseR - sinA * inBaseHalf;
      const iBLy = center + sinA * inBaseR + cosA * inBaseHalf;
      const iBRx = center + cosA * inBaseR + sinA * inBaseHalf;
      const iBRy = center + sinA * inBaseR - cosA * inBaseHalf;
      const iWLx = center + cosA * inWaistR - sinA * inWaistHalf;
      const iWLy = center + sinA * inWaistR + cosA * inWaistHalf;
      const iWRx = center + cosA * inWaistR + sinA * inWaistHalf;
      const iWRy = center + sinA * inWaistR - cosA * inWaistHalf;

      const inD = `M ${iBLx.toFixed(2)} ${iBLy.toFixed(2)}
        L ${iWLx.toFixed(2)} ${iWLy.toFixed(2)}
        Q ${inTipX.toFixed(2)} ${inTipY.toFixed(2)} ${iWRx.toFixed(2)} ${iWRy.toFixed(2)}
        L ${iBRx.toFixed(2)} ${iBRy.toFixed(2)} Z`;

      items.push(
        <path
          key={`clip-out-inner-${i}`}
          d={inD}
          fill="none"
          stroke={palette.ornamentLight}
          strokeWidth={Math.max(0.2, sw * 0.13)}
          strokeLinejoin="round"
          opacity={0.7}
        />
      );

      // 外侧尖角内部纹理：中脊线 + 两侧小斜纹（精致细节）
      const ridgeX1 = center + cosA * (inBaseR + sw * 0.05);
      const ridgeY1 = center + sinA * (inBaseR + sw * 0.05);
      const ridgeX2 = center + cosA * (inTipR - sw * 0.1);
      const ridgeY2 = center + sinA * (inTipR - sw * 0.1);
      items.push(
        <line
          key={`clip-out-ridge-${i}`}
          x1={ridgeX1.toFixed(2)}
          y1={ridgeY1.toFixed(2)}
          x2={ridgeX2.toFixed(2)}
          y2={ridgeY2.toFixed(2)}
          stroke={palette.ornamentLight}
          strokeWidth={Math.max(0.15, sw * 0.1)}
          strokeLinecap="round"
          opacity={0.5}
        />
      );
      // 两侧短斜纹（高等级才显示）
      if (tier >= 3) {
        for (let side = -1; side <= 1; side += 2) {
          const sAngle = angle + side * 0.15;
          const sSin = Math.sin(sAngle);
          const sCos = Math.cos(sAngle);
          const sx1 = center + sCos * (outBaseR + sw * 0.3);
          const sy1 = center + sSin * (outBaseR + sw * 0.3);
          const sx2 = center + sCos * (inWaistR + sw * 0.05) + side * sinA * sw * 0.15;
          const sy2 = center + sSin * (inWaistR + sw * 0.05) - side * cosA * sw * 0.15;
          items.push(
            <line
              key={`clip-out-side-${i}-${side}`}
              x1={sx1.toFixed(2)}
              y1={sy1.toFixed(2)}
              x2={sx2.toFixed(2)}
              y2={sy2.toFixed(2)}
              stroke={palette.laceLight}
              strokeWidth={Math.max(0.12, sw * 0.07)}
              strokeLinecap="round"
              opacity={0.35}
            />
          );
        }
      }

      // === 内侧尖角（向内扣，上下对称） ===
      const inTipR2 = rRingInner2 - (rRingInner2 - rRingInner) * 0.3;
      const inTipX2 = center + cosA * inTipR2;
      const inTipY2 = center + sinA * inTipR2;

      const inBaseHalf2 = sw * (0.85 + tier * 0.09);
      const inBaseR2 = rRingInner;
      const i2BLx = center + cosA * inBaseR2 - sinA * inBaseHalf2;
      const i2BLy = center + sinA * inBaseR2 + cosA * inBaseHalf2;
      const i2BRx = center + cosA * inBaseR2 + sinA * inBaseHalf2;
      const i2BRy = center + sinA * inBaseR2 - cosA * inBaseHalf2;

      const inWaistR2 = inBaseR2 - (inBaseR2 - inTipR2) * 0.5;
      const inWaistHalf2 = inBaseHalf2 * 0.42;
      const i2WLx = center + cosA * inWaistR2 - sinA * inWaistHalf2;
      const i2WLy = center + sinA * inWaistR2 + cosA * inWaistHalf2;
      const i2WRx = center + cosA * inWaistR2 + sinA * inWaistHalf2;
      const i2WRy = center + sinA * inWaistR2 - cosA * inWaistHalf2;

      const inD2 = `M ${i2BLx.toFixed(2)} ${i2BLy.toFixed(2)}
        L ${i2WLx.toFixed(2)} ${i2WLy.toFixed(2)}
        L ${inTipX2.toFixed(2)} ${inTipY2.toFixed(2)}
        L ${i2WRx.toFixed(2)} ${i2WRy.toFixed(2)}
        L ${i2BRx.toFixed(2)} ${i2BRy.toFixed(2)} Z`;

      items.push(
        <path
          key={`clip-in-bg-${i}`}
          d={inD2}
          fill={palette.ornamentMain}
          opacity={0.25}
        />
      );
      items.push(
        <path
          key={`clip-in-stroke-${i}`}
          d={inD2}
          fill="none"
          stroke={palette.ornamentDark}
          strokeWidth={Math.max(0.28, sw * 0.18)}
          strokeLinejoin="round"
          opacity={0.8}
        />
      );

      // 内层高光（内侧尖角更小，高光略简化）
      if (tier >= 2) {
        const inScale2 = 0.58;
        const inTipR3 = inBaseR2 - (inBaseR2 - inTipR2) * inScale2;
        const inTipX3 = center + cosA * inTipR3;
        const inTipY3 = center + sinA * inTipR3;
        const inWaistR3 = inBaseR2 - (inBaseR2 - inWaistR2) * inScale2;
        const inWaistHalf3 = inWaistHalf2 * inScale2;
        const inBaseR3 = inBaseR2 - sw * 0.12;
        const inBaseHalf3 = inBaseHalf2 * inScale2;
        const i3BLx = center + cosA * inBaseR3 - sinA * inBaseHalf3;
        const i3BLy = center + sinA * inBaseR3 + cosA * inBaseHalf3;
        const i3BRx = center + cosA * inBaseR3 + sinA * inBaseHalf3;
        const i3BRy = center + sinA * inBaseR3 - cosA * inBaseHalf3;
        const i3WLx = center + cosA * inWaistR3 - sinA * inWaistHalf3;
        const i3WLy = center + sinA * inWaistR3 + cosA * inWaistHalf3;
        const i3WRx = center + cosA * inWaistR3 + sinA * inWaistHalf3;
        const i3WRy = center + sinA * inWaistR3 - cosA * inWaistHalf3;

        const inD3 = `M ${i3BLx.toFixed(2)} ${i3BLy.toFixed(2)}
          L ${i3WLx.toFixed(2)} ${i3WLy.toFixed(2)}
          L ${inTipX3.toFixed(2)} ${inTipY3.toFixed(2)}
          L ${i3WRx.toFixed(2)} ${i3WRy.toFixed(2)}
          L ${i3BRx.toFixed(2)} ${i3BRy.toFixed(2)} Z`;

        items.push(
          <path
            key={`clip-in-inner-${i}`}
            d={inD3}
            fill="none"
            stroke={palette.ornamentLight}
            strokeWidth={Math.max(0.18, sw * 0.11)}
            strokeLinejoin="round"
            opacity={0.6}
          />
        );
      }
    }

    return items;
  }, [center, rOrnamentTip, rOrnamentBase, rRingOuter, rRingOuter2, rRingInner, rRingInner2, palette, sw, tier]);

  // ===================== 环身镂空装饰（少量菱形小孔 + 小圆孔，均匀分布） =====================
  const hollowHoles = useMemo(() => {
    const items: React.ReactNode[] = [];
    // 简单模式不显示镂空
    if (useSimple) return items;
    
    // 菱形小孔数量：24个（与主装饰对应），放在宝石节点之间
    const diamondCount = tier >= 3 ? 24 : 16;
    // 小圆孔数量：36个，放在菱形孔之间
    const dotCount = tier >= 4 ? 36 : 20;
    
    // 镂空孔的半径位置（环身中线附近偏外）
    const hollowR = rLace + sw * 0.6;
    // 菱形孔大小（略增大）
    const diamondSize = sw * 0.42;
    // 小圆孔大小（略增大）
    const dotSize = Math.max(0.8, sw * 0.22);
    
    // 菱形小孔（12个，均匀分布在星形装饰之间）
    for (let i = 0; i < diamondCount; i++) {
      // 偏移半个间隔，放在主装饰之间
      const angle = ((i + 0.5) / diamondCount) * Math.PI * 2;
      const sinA = Math.sin(angle);
      const cosA = Math.cos(angle);
      
      const cx = center + cosA * hollowR;
      const cy = center + sinA * hollowR;
      
      // 菱形（旋转45度的正方形）
      const d = `M ${(cx).toFixed(2)} ${(cy - diamondSize).toFixed(2)}
        L ${(cx + diamondSize * 0.7).toFixed(2)} ${(cy).toFixed(2)}
        L ${(cx).toFixed(2)} ${(cy + diamondSize).toFixed(2)}
        L ${(cx - diamondSize * 0.7).toFixed(2)} ${(cy).toFixed(2)} Z`;
      
      items.push(
        <path
          key={`hollow-diamond-${i}`}
          d={d}
          fill="black"
          opacity={0.9}
        />
      );
    }
    
    // 小圆孔（数量更多，更小，放在菱形孔之间）
    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * Math.PI * 2;
      const sinA = Math.sin(angle);
      const cosA = Math.cos(angle);
      
      // 位置偏内圈一点，与菱形孔错开
      const cx = center + cosA * (hollowR - sw * 0.8);
      const cy = center + sinA * (hollowR - sw * 0.8);
      
      items.push(
        <circle
          key={`hollow-dot-${i}`}
          cx={cx.toFixed(2)}
          cy={cy.toFixed(2)}
          r={dotSize}
          fill="black"
          opacity={0.8}
        />
      );
    }
    
    return items;
  }, [center, rLace, sw, tier, useSimple]);

  const visibilityStroke = (isBlack || isWhite) ? (
    <>
      <circle
        cx={center}
        cy={center}
        r={rRingOuter + sw * 0.5}
        fill="none"
        stroke={isBlack ? '#8a8aa0' : '#c0c0cc'}
        strokeWidth={Math.max(0.4, sw * 0.14)}
        opacity={isBlack ? 0.7 : 0.5}
      />
      <circle
        cx={center}
        cy={center}
        r={rRingInner - sw * 0.3}
        fill="none"
        stroke={isBlack ? '#6a6a80' : '#a0a0b0'}
        strokeWidth={Math.max(0.3, sw * 0.1)}
        opacity={isBlack ? 0.5 : 0.35}
      />
    </>
  ) : null;

  const animationStyle: React.CSSProperties = animate
    ? {
        animation: `soulRingSpin ${rotateDuration}s linear infinite`,
        animationDirection: rotateDir >= 0 ? 'normal' : 'reverse',
        willChange: 'transform',
      }
    : {};

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size, colorScheme: 'light only' }}
    >
      {/* 柔和外光晕（低强度，少发光；百万年魂环为属性色光晕，更强） */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${elementGlow} 0%, transparent 65%)`,
          transform: `scale(${isMillionYear ? 1.25 * glowScale : 1.02 * glowScale})`,
          filter: `blur(${isMillionYear ? 6 : 2}px)`,
          opacity: isMillionYear ? 0.5 * glowScale : 0.15 * glowScale,
        }}
      />

      {/* 百万年魂环额外外圈光环（属性色） */}
      {isMillionYear && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            border: `2px solid ${elementGlow}`,
            transform: `scale(${1.08 * glowScale})`,
            filter: 'blur(3px)',
            opacity: 0.6 * glowScale,
            boxShadow: `0 0 20px ${elementGlow}, 0 0 40px ${elementGlow}`,
          }}
        />
      )}

      {/* 主魂环 SVG */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={animationStyle}
        className="relative z-10"
      >
        {visibilityStroke}

        {/* 扣环尖角（12 个，扣在环身内外侧）简化模式下不渲染 */}
        {!useSimple && <g>{clipSpikes}</g>}

        {/* 实心环身主体（径向渐变，外亮内暗，厚重质感） */}
        <defs>
          <radialGradient id={`ringBody-${color}-${size}`} cx="50%" cy="50%" r="50%">
            <stop offset={`${(rRingInner / center * 100).toFixed(1)}%`} stopColor={palette.ringBodyDark} />
            <stop offset={`${(rLace / center * 100).toFixed(1)}%`} stopColor={palette.ringBodyMain} />
            <stop offset={`${(rRingOuter / center * 100).toFixed(1)}%`} stopColor={palette.ringBodyLight} />
          </radialGradient>
          <mask id={`ringMask-${color}-${size}`}>
            <rect x="0" y="0" width={size} height={size} fill="white" />
            <circle cx={center} cy={center} r={rRingInner} fill="black" />
            {/* 少量镂空装饰孔 */}
            {!useSimple && <g>{hollowHoles}</g>}
           </mask>
          {/* 金色波纹光晕 filter —— 柔和高斯模糊，性能友好 */}
          <filter id={`goldGlow-${color}-${size}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={Math.max(1.5, size * 0.025)} />
          </filter>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={rRingOuter}
          fill={`url(#ringBody-${color}-${size})`}
          mask={`url(#ringMask-${color}-${size})`}
        />

        {/* 12方向星形主装饰 */}
        <g>{mainOrnaments}</g>

        {/* 次级尖刺 简化模式下不渲染 */}
        {!useSimple && <g>{subSpikes}</g>}

        {/* 方波纹理（叠在实心环身上的装饰线，不是镂空）简化模式下只保留1道 */}
        <g>{useSimple ? squareWaves.slice(0, 1) : squareWaves}</g>

        {/* 外沿描边（实心环的外缘高光线） */}
        <circle
          cx={center}
          cy={center}
          r={rRingOuter}
          fill="none"
          stroke={palette.ringEdgeOuter}
          strokeWidth={Math.max(0.4, sw * 0.32)}
          opacity={0.85}
        />
        {/* 外沿第二圈暗线（层次感） */}
        <circle
          cx={center}
          cy={center}
          r={rRingOuter2}
          fill="none"
          stroke={palette.ringEdgeOuterDark}
          strokeWidth={Math.max(0.2, sw * 0.15)}
          opacity={0.6}
        />

        {/* 中圈细纹（宝石贴合线，增加纹理感） */}
        <circle
          cx={center}
          cy={center}
          r={rLace}
          fill="none"
          stroke={palette.ringEdgeInnerDark}
          strokeWidth={Math.max(0.15, sw * 0.1)}
          strokeDasharray={`${sw * 0.4} ${sw * 0.3}`}
          opacity={0.45}
        />

        {/* ===== 十万年以上金色波纹 ===== */}
        {hasGoldWaves && !useSimple && (
          <g>
            {/* 光晕层：每道波纹对应一圈柔光，向内外扩散，多层叠加自然变亮 */}
            {Array.from({ length: goldWaveCount }).map((_, idx) => {
              const offsetFromMid = (idx - (goldWaveCount - 1) / 2) * sw * 0.55;
              const baseR = rLace + offsetFromMid;
              return (
                <circle
                  key={`gold-glow-${idx}`}
                  cx={center}
                  cy={center}
                  r={baseR}
                  fill="none"
                  stroke="#ffd700"
                  strokeWidth={sw * 1.8}
                  strokeLinecap="round"
                  opacity={0.12}
                  filter={`url(#goldGlow-${color}-${size})`}
                />
              );
            })}
            {/* 次级外扩光晕（更大更淡）—— 只在 3 道以上时叠加，增强层次感 */}
            {goldWaveCount >= 3 && (
              <circle
                cx={center}
                cy={center}
                r={rLace}
                fill="none"
                stroke="#ffe066"
                strokeWidth={sw * 4}
                opacity={Math.min(0.18, 0.06 * goldWaveCount)}
                filter={`url(#goldGlow-${color}-${size})`}
              />
            )}
            {Array.from({ length: goldWaveCount }).map((_, idx) => {
              // 多道波纹从环身中线向内外两侧均匀分布
              const offsetFromMid = (idx - (goldWaveCount - 1) / 2) * sw * 0.55;
              const baseR = rLace + offsetFromMid;
              const waveAmp = sw * 0.2; // 波浪振幅
              const waveCount = 40 + idx * 3; // 一圈的波浪数量

              // 生成波浪形圆环路径（半径随角度正弦波动）
              let d = '';
              const segments = waveCount * 4; // 每波长4段，保证平滑
              for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const r = baseR + Math.sin(angle * waveCount) * waveAmp;
                const x = center + Math.cos(angle) * r;
                const y = center + Math.sin(angle) * r;
                d += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
              }
              d += ' Z';

              return (
                <g key={`gold-wave-${idx}`}>
                  {/* 金色波纹主色 */}
                  <path
                    d={d}
                    fill="none"
                    stroke="#ffd700"
                    strokeWidth={Math.max(0.6, sw * 0.35)}
                    strokeLinejoin="round"
                    opacity={0.6}
                  />
                  {/* 波纹高光（更亮更细一层） */}
                  <path
                    d={d}
                    fill="none"
                    stroke="#ffeb66"
                    strokeWidth={Math.max(0.2, sw * 0.12)}
                    strokeLinejoin="round"
                    opacity={0.45}
                    transform={`translate(${(-Math.sin(0) * waveAmp * 0.3).toFixed(2)} ${(-Math.cos(0) * waveAmp * 0.3).toFixed(2)})`}
                  />
                </g>
              );
            })}
          </g>
        )}
        {/* 简化模式下显示对应数量的细金纹（保证小尺寸也能看出年限层级） */}
        {hasGoldWaves && useSimple && goldWaveCount > 0 && (
          <g>
            {Array.from({ length: goldWaveCount }).map((_, idx) => {
              const offsetFromMid = (idx - (goldWaveCount - 1) / 2) * sw * 0.7;
              const r = rLace + offsetFromMid;
              return (
                <g key={`simple-gold-${idx}`}>
                  {/* 外圈柔光 */}
                  <circle
                    cx={center}
                    cy={center}
                    r={r}
                    fill="none"
                    stroke="#ffd700"
                    strokeWidth={Math.max(0.6, sw * 0.4)}
                    opacity={0.15}
                  />
                  {/* 核心金纹 */}
                  <circle
                    cx={center}
                    cy={center}
                    r={r}
                    fill="none"
                    stroke="#ffe066"
                    strokeWidth={Math.max(0.3, sw * 0.22)}
                    opacity={0.75}
                  />
                </g>
              );
            })}
          </g>
        )}

        {/* 蕾丝网状花纹（叠在实心环身上的细线装饰，不是镂空）简化模式下省略 */}
        {!useSimple && <g>{lacePattern}</g>}

        {/* 内沿描边（实心环的内缘高光线） */}
        <circle
          cx={center}
          cy={center}
          r={rRingInner2}
          fill="none"
          stroke={palette.ringEdgeInnerDark}
          strokeWidth={Math.max(0.2, sw * 0.15)}
          opacity={0.55}
        />
        <circle
          cx={center}
          cy={center}
          r={rRingInner}
          fill="none"
          stroke={palette.ringEdgeInner}
          strokeWidth={Math.max(0.35, sw * 0.28)}
          opacity={0.75}
        />
      </svg>

      <style>{`
        @keyframes soulRingSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});
