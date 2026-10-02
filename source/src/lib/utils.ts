import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 数字单位格式化
 * 支持单位（从低到高）：个 → 万 → 亿 → 兆 → 京 → 垓 → 秭 → 穰 → 沟 → 涧 → 正 → 载
 * 万=10^4  亿=10^8  兆=10^12  京=10^16  垓=10^20  秭=10^24
 * 穰=10^28  沟=10^32  涧=10^36  正=10^40  载=10^44
 * 1万以下直接显示；1万以上保留2位小数，末尾0省略
 */
const UNIT_STEPS: { value: number; unit: string }[] = [
  { value: 1e44, unit: '载' },
  { value: 1e40, unit: '正' },
  { value: 1e36, unit: '涧' },
  { value: 1e32, unit: '沟' },
  { value: 1e28, unit: '穰' },
  { value: 1e24, unit: '秭' },
  { value: 1e20, unit: '垓' },
  { value: 1e16, unit: '京' },
  { value: 1e12, unit: '兆' },
  { value: 1e8,  unit: '亿' },
  { value: 1e4,  unit: '万' },
];

function formatWithUnits(n: number, fractionDigits: number = 2): string {
  if (!isFinite(n)) return '0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e48) return n.toExponential(2);
  if (abs < 10000) {
    return sign + Math.floor(abs).toString();
  }
  for (const step of UNIT_STEPS) {
    if (abs >= step.value) {
      const v = abs / step.value;
      const rounded = Math.round(v * Math.pow(10, fractionDigits)) / Math.pow(10, fractionDigits);
      return sign + rounded + step.unit;
    }
  }
  return sign + Math.floor(abs).toString();
}

export function formatNumber(n: number): string {
  return formatWithUnits(n, 2);
}

/**
 * 战力数字专属格式化
 * - 10万以下：直接显示原数字（带千分位）
 * - 10万及以上：使用中文大单位（万/亿/兆/京/垓/秭/穰/沟/涧/正/载）
 * - 保留2位小数，末尾0省略
 */
export function formatCombatPower(n: number): string {
  if (!isFinite(n)) return '0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs < 100000) {
    return sign + Math.floor(abs).toLocaleString();
  }
  return formatWithUnits(abs >= 0 ? n : -abs, 2);
}
