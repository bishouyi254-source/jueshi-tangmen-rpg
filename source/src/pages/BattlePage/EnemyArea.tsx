import { memo } from 'react';
import { RING_DISPLAY_COLOR, normalizeBeastAttribute, inferElementFromName } from '@/lib/gameStore';
import SoulRing from '@/components/SoulRing';

interface DamagePopup {
  id: number;
  target: 'enemy' | 'player';
  text: string;
  isCrit: boolean;
  left?: number;
}

interface EnemyAreaProps {
  enemy: {
    name: string;
    qualityColor: string;
    qualityLabel: string;
    years: number;
    element?: string;
  };
  enemyHp: number;
  enemyMaxHp: number;
  enemyHpPercent: number;
  phase: string;
  damagePopups: DamagePopup[];
  formatYearsLabel: (y: number) => string;
  formatNumber: (n: number) => string;
}

function EnemyArea({
  enemy, enemyHp, enemyMaxHp, enemyHpPercent,
  phase, damagePopups, formatYearsLabel, formatNumber,
}: EnemyAreaProps) {
  const ringColor = RING_DISPLAY_COLOR[enemy.qualityColor as keyof typeof RING_DISPLAY_COLOR] ?? '#888';

  return (
    <div className="flex justify-center md:justify-start md:items-start flex-shrink-0 py-0.5 relative md:w-72 md:py-4 w-full" style={{ minHeight: 0 }}>
      <div className="text-center relative md:text-left w-full">
        {/* 敌方伤害弹层 */}
        <div className="absolute inset-0 pointer-events-none flex items-start justify-center z-10 md:justify-start" style={{ top: 6 }}>
          {damagePopups.filter(d => d.target === 'enemy').map(d => (
            <span
              key={d.id}
              className="absolute font-black tabular-nums"
              style={{
                color: d.isCrit ? '#fbbf24' : '#fca5a5',
                fontSize: d.isCrit ? '24px' : '16px',
                textShadow: d.isCrit
                  ? '0 0 10px rgba(251,191,36,0.6), 0 2px 3px rgba(0,0,0,0.5)'
                  : '0 0 6px rgba(252,165,165,0.5), 0 1px 2px rgba(0,0,0,0.6)',
                animation: 'dmg-float 1s ease-out forwards',
              }}
            >
              {d.isCrit && <span className="text-xs mr-0.5">暴击</span>}
              {d.text}
            </span>
          ))}
        </div>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3 w-full">
          {/* 敌人头像 */}
          <div
            className={`w-12 md:w-20 h-12 md:h-20 rounded-lg flex items-center justify-center text-lg md:text-2xl font-black border-2 shrink-0 transition-transform duration-200 ${
              phase === 'enemyTurn' ? 'scale-110' : ''
            }`}
            style={{
              borderColor: ringColor,
              background: `linear-gradient(135deg, ${ringColor}20, transparent)`,
              color: ringColor,
              boxShadow: `0 0 10px ${ringColor}40`,
            }}
          >
            {enemy.name.slice(0, 1)}
          </div>
          {/* 敌人信息 + 血条 */}
          <div className="flex-1 min-w-0 text-center md:text-left">
            <div className="text-xs md:text-sm font-bold text-foreground truncate">{enemy.name}</div>
            <div className="text-[10px] md:text-xs text-cyan-400 font-medium truncate">
              {enemy.qualityLabel} · {formatYearsLabel(enemy.years)}
            </div>
            {/* 属性：双重兜底，保证绝不显示空白或无属性 */}
            <div className="text-[9px] md:text-[10px] text-sky-300/90 mt-0.5 font-medium truncate">
              属性：{normalizeBeastAttribute(enemy.element || inferElementFromName(enemy.name))}
            </div>
            {/* 血条 */}
            <div className="mt-1.5 mx-auto md:mx-0 w-28 md:w-40 h-1.5 md:h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-red-400 hp-bar-fill"
                style={{ width: `${enemyHpPercent}%` }}
              />
            </div>
            <div className="text-[9px] md:text-[11px] text-red-500 font-bold tabular-nums mt-0.5 truncate">
              {formatNumber(Math.round(enemyHp))} / {formatNumber(Math.round(enemyMaxHp))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(EnemyArea);
