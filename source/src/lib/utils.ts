import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 数字单位格式化
 * - 10000 以下：直接显示
 * - 10000 ~ 99999999：X万（保留1位小数，末尾0则省略）
 * - 1亿以上：X亿（保留2位小数，末尾0则省略）
 */
export function formatNumber(n: number): string {
  if (!isFinite(n)) return '0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs < 10000) {
    return sign + Math.floor(abs).toString();
  }
  if (abs < 100000000) {
    const v = abs / 10000;
    const rounded = Math.round(v * 10) / 10;
    return sign + rounded + '万';
  }
  if (abs < 1000000000000) {
    const v = abs / 100000000;
    const rounded = Math.round(v * 100) / 100;
    return sign + rounded + '亿';
  }
  if (abs < 1e16) {
    const v = abs / 1e12;
    const rounded = Math.round(v * 100) / 100;
    return sign + rounded + '兆';
  }
  const v = abs / 1e16;
  const rounded = Math.round(v * 100) / 100;
  return sign + rounded + '京';
}

/**
 * 战力数字专属格式化
 * - 10万以下：直接显示原数字（如33000 → "33,000"）
 * - 10万及以上：X万（保留1位小数，末尾0省略）
 * - 1亿及以上：X亿（保留2位小数，末尾0省略）
 */
export function formatCombatPower(n: number): string {
  if (!isFinite(n)) return '0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs < 100000) {
    return sign + Math.floor(abs).toLocaleString();
  }
  if (abs < 100000000) {
    const v = abs / 10000;
    const rounded = Math.round(v * 10) / 10;
    return sign + rounded + '万';
  }
  const v = abs / 100000000;
  const rounded = Math.round(v * 100) / 100;
  return sign + rounded + '亿';
}
