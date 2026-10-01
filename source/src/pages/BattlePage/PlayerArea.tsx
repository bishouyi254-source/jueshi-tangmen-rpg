import { memo } from 'react';
import DivineRingAvatar from '@/components/DivineRingAvatar';
import { QUALITY_COLOR } from '@/lib/gameStore';
import { SPIRIT_ELEMENT_COLORS } from '@/data/soulSpirits';
import { formatNumber } from '@/lib/utils';

interface BattleSpirit {
  id: string;
  name: string;
  iconChar: string;
  attribute: string;
  attack: number;
  hp: number;
  maxHp: number;
  dead: boolean;
}

interface TempBuff {
  attack: { value: number; turns: number };
  defense: { value: number; turns: number };
  speed: { value: number; turns: number };
  spirit: { value: number; turns: number };
}

interface PlayerAreaProps {
  playerName: string;
  playerTitle?: string;
  playerLevel: number;
  playerQuality?: string;
  playerSoulRings: unknown[];
  isDeity: boolean;
  ringColor: string;
  anyTrueBody: boolean;
  activeTrueBodyIndex: number;
  phase: string;
  playerHpPercent: number;
  playerDisplayHp: number;
  maxHp: number;
  soulPowerPercent: number;
  currentSoulPower: number;
  maxSoulPower: number;
  battleSpirits: BattleSpirit[];
  damagePopups: Array<{ id: number; target: string; text: string; isCrit: boolean }>;
  trueBodyTurns: number;
  secondTrueBodyTurns: number;
  tempBuffs: TempBuff | null;
  showHp: boolean;
}

function PlayerArea({
  playerName, playerTitle, playerLevel, playerQuality, playerSoulRings,
  isDeity, ringColor, anyTrueBody, activeTrueBodyIndex, phase,
  playerHpPercent, playerDisplayHp, maxHp,
  soulPowerPercent, currentSoulPower, maxSoulPower,
  battleSpirits, damagePopups, trueBodyTurns, secondTrueBodyTurns, tempBuffs, showHp,
}: PlayerAreaProps) {
  // 魂灵分配：左奇右偶（index 0/2 在左，1/3 在右），1-4个魂灵都能左右对称显示
  const leftSpirits = battleSpirits.filter((_, i) => i % 2 === 0);
  const rightSpirits = battleSpirits.filter((_, i) => i % 2 === 1);

  const borderColor = anyTrueBody
    ? activeTrueBodyIndex === 1 ? '#c084fc' : '#fbbf24'
    : playerQuality
      ? QUALITY_COLOR[playerQuality as keyof typeof QUALITY_COLOR]
      : 'var(--border)';

  return (
    <div className="flex justify-center md:justify-end md:items-start flex-shrink-0 py-0.5 relative md:w-72 md:py-4 w-full min-w-0" style={{ minHeight: 0 }}>
      <div className="text-center relative md:text-right w-full">
        {/* 魂灵 + 玩家 主容器：玩家居中，魂灵分列左右 */}
        <div className="relative flex items-center justify-center md:justify-end gap-2 md:gap-3">
          {/* 左侧魂灵（上下排列） */}
          {battleSpirits.length > 0 && (
            <div className="flex flex-col gap-1 items-center">
              {leftSpirits.map((s) => {
                const ec = SPIRIT_ELEMENT_COLORS[s.attribute] || SPIRIT_ELEMENT_COLORS['金'];
                return (
                  <div
                    key={s.id}
                    className={`relative transition-all duration-200 ${s.dead ? 'opacity-30 grayscale' : ''}`}
                  >
                    <div
                      className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-xs font-bold border-2 ${s.dead ? '' : 'animate-pulse'}`}
                      style={{
                        borderColor: ec.border,
                        backgroundColor: `${ec.bg}60`,
                        color: ec.text,
                        boxShadow: s.dead ? 'none' : `0 0 6px ${ec.glow}80`,
                      }}
                    >
                      {s.iconChar}
                    </div>
                    <div className="w-7 md:w-8 h-1 bg-slate-300 rounded-full overflow-hidden mt-0.5 mx-auto">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-green-500 hp-bar-fill"
                        style={{ width: `${Math.max(0, (s.hp / s.maxHp) * 100)}%` }}
                      />
                    </div>
                    {s.dead && (
                      <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-red-500">
                        阵亡
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 玩家头像（居中） */}
          <div className="relative z-20 flex-shrink-0">
            {/* 玩家伤害弹层 */}
            <div className="absolute inset-0 pointer-events-none flex items-start justify-center z-10" style={{ top: -6 }}>
              {damagePopups.filter(d => d.target === 'player').map(d => (
                <span
                  key={d.id}
                  className="absolute font-black tabular-nums"
                  style={{
                    color: d.isCrit ? '#fbbf24' : '#fca5a5',
                    fontSize: d.isCrit ? '22px' : '15px',
                    textShadow: d.isCrit
                      ? '0 0 10px rgba(251,191,36,0.8), 0 2px 3px rgba(0,0,0,0.6)'
                      : '0 0 5px rgba(0,0,0,0.8)',
                    animation: 'dmg-float 1s ease-out forwards',
                  }}
                >
                  {d.isCrit && <span className="text-xs mr-0.5">暴击</span>}
                  {d.text}
                </span>
              ))}
            </div>
            <DivineRingAvatar
              name={playerName}
              isDeity={isDeity}
              ringColor={ringColor}
              borderColor={borderColor}
              size="md"
              shape="rounded"
              className={`transition-all duration-300 ${phase === 'playerTurn' ? 'scale-105' : ''}`}
            />
          </div>

          {/* 右侧魂灵（上下排列） */}
          {rightSpirits.length > 0 && (
            <div className="flex flex-col gap-1 items-center">
              {rightSpirits.map((s) => {
                const ec = SPIRIT_ELEMENT_COLORS[s.attribute] || SPIRIT_ELEMENT_COLORS['金'];
                return (
                  <div
                    key={s.id}
                    className={`relative transition-all duration-200 ${s.dead ? 'opacity-30 grayscale' : ''}`}
                  >
                    <div
                      className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-xs font-bold border-2"
                      style={{
                        borderColor: ec.border,
                        backgroundColor: `${ec.bg}60`,
                        color: ec.text,
                        boxShadow: s.dead ? 'none' : `0 0 6px ${ec.glow}80`,
                      }}
                    >
                      {s.iconChar}
                    </div>
                    <div className="w-7 md:w-8 h-1 bg-slate-300 rounded-full overflow-hidden mt-0.5 mx-auto">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-green-500 hp-bar-fill"
                        style={{ width: `${Math.max(0, (s.hp / s.maxHp) * 100)}%` }}
                      />
                    </div>
                    {s.dead && (
                      <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-red-500">
                        阵亡
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 玩家名字 + 等级 */}
        <div className={`mt-1.5 text-sm md:text-base font-bold flex items-center justify-center gap-0.5 relative z-20 ${anyTrueBody ? 'text-cyan-400' : 'text-foreground'}`}>
          {playerName}
          {playerTitle && <span className="text-cyan-400">·{playerTitle.slice(0, 2)}斗罗</span>}
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          Lv.{playerLevel} · {playerSoulRings.length} 环
        </div>

        {/* 血条 + 魂力条 */}
        {showHp && maxHp > 0 && (
          <div className="mx-auto w-36 md:w-48 space-y-1 mt-2">
            <div>
              <div className="h-2 md:h-3 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 hp-bar-fill"
                  style={{ width: `${playerHpPercent}%` }}
                />
              </div>
              <div className="text-[9px] md:text-xs text-green-600 font-bold tabular-nums mt-0.5 text-center truncate">
                {formatNumber(Math.round(playerDisplayHp))} / {formatNumber(Math.round(maxHp))}
              </div>
            </div>
            <div>
              <div className="h-2 md:h-3 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-blue-500 hp-bar-fill"
                  style={{ width: `${soulPowerPercent}%` }}
                />
              </div>
              <div className="text-[9px] md:text-xs text-sky-600 font-bold tabular-nums mt-0.5 text-center truncate">
                魂力 {formatNumber(Math.round(currentSoulPower))} / {formatNumber(Math.round(maxSoulPower))}
              </div>
            </div>
          </div>
        )}
        {/* 状态标签 */}
        {(anyTrueBody || tempBuffs) && (
          <div className="flex flex-wrap justify-center gap-1 mt-1.5 px-2">
            {trueBodyTurns > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-cyan-300 bg-cyan-800/50 border border-cyan-500/40">
                一武真身·{trueBodyTurns}回
              </span>
            )}
            {secondTrueBodyTurns > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-cyan-300 bg-cyan-800/50 border border-cyan-500/40">
                二武真身·{secondTrueBodyTurns}回
              </span>
            )}
            {tempBuffs && tempBuffs.attack.value > 0 && (
               <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-rose-300 bg-rose-500/15 border border-rose-500/40">
                 攻击+{Math.round(tempBuffs.attack.value * 100)}%({tempBuffs.attack.turns}回)
               </span>
             )}
             {tempBuffs && tempBuffs.defense.value > 0 && (
               <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-blue-300 bg-blue-500/15 border border-blue-500/40">
                 防御+{Math.round(tempBuffs.defense.value * 100)}%({tempBuffs.defense.turns}回)
               </span>
             )}
             {tempBuffs && tempBuffs.speed.value > 0 && (
               <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-emerald-300 bg-emerald-500/15 border border-emerald-500/40">
                 速度+{Math.round(tempBuffs.speed.value * 100)}%({tempBuffs.speed.turns}回)
               </span>
             )}
            {tempBuffs && tempBuffs.spirit.value > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-cyan-400 bg-cyan-900/30 border border-cyan-500/30">
                精神+{Math.round(tempBuffs.spirit.value * 100)}%({tempBuffs.spirit.turns}回)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(PlayerArea);
