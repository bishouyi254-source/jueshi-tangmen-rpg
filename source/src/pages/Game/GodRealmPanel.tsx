import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Swords, Shield, Heart, Zap, Sparkles, Lock, Check, Gem } from 'lucide-react';
import { useGame } from '@/lib/gameStore';
import { GOD_REALM_CATEGORIES, GOD_REALM_BOSSES, type GodRealmCategory, type IGodRealmBoss, hasAllGodKingShards } from '@/data/godRealm';
import { toast } from 'sonner';
import { formatNumber } from '@/lib/utils';

interface GodRealmPanelProps {
  onClose: () => void;
}

/** 格式化大数字（兆/亿） */
function formatBigNumber(n: number): string {
  if (n >= 1e16) return `${(n / 1e16).toFixed(1)}京`;
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}兆`;
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}亿`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)}万`;
  return n.toLocaleString();
}

export default function GodRealmPanel({ onClose }: GodRealmPanelProps) {
  const { player, startGodRealmBattle, craftDivineCore } = useGame();
  const [activeCat, setActiveCat] = useState<GodRealmCategory>('supreme');

  const defeatedIds = player?.godRealm?.defeatedIds ?? [];
  const totalDefeated = defeatedIds.length;
  const divineCoreCrafted = player?.godRealm?.divineCoreCrafted ?? false;
  const hasAllShards = hasAllGodKingShards(player?.inventory ?? []);
  // 5块神王碎片进度
  const shardIds = ['shard-destruction', 'shard-life', 'shard-evil', 'shard-kind', 'shard-asura'];
  const shardCount = shardIds.filter((id) => player?.inventory?.some((i) => i.id.startsWith(id))).length;

  const cat = GOD_REALM_CATEGORIES.find((c) => c.key === activeCat)!;
  const bosses = GOD_REALM_BOSSES.filter((b) => b.category === activeCat);

  const handleChallenge = (boss: IGodRealmBoss) => {
    if (defeatedIds.includes(boss.id)) {
      toast.info('该神祇已被击败过，不可再次挑战');
      return;
    }
    const res = startGodRealmBattle(boss.id);
    if (!res.success) {
      toast.error(res.reason || '挑战失败');
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950">
      {/* 顶部装饰光效 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-40 bg-gradient-to-b from-yellow-500/20 via-purple-500/10 to-transparent pointer-events-none blur-2xl" />

      {/* 头部 */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 border-b border-yellow-500/20">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>返回</span>
        </button>
        <div className="flex-1 text-center">
          <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-200 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            神界
            <Sparkles className="w-5 h-5 text-yellow-300" />
          </h2>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
            已击败 {totalDefeated} / {GOD_REALM_BOSSES.length} 位神祇
          </p>
        </div>
        <div className="w-16" />
      </div>

      {/* 中枢碎片进度条 + 合成按钮 */}
      <div className="relative z-10 mx-4 mt-3 md:mx-6 md:mt-4 rounded-xl border border-yellow-500/30 bg-gradient-to-r from-yellow-900/30 via-amber-900/20 to-yellow-900/30 p-3">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <Gem className="w-4 h-4 text-yellow-300 shrink-0" />
            <span className="text-xs font-bold text-yellow-200">神级中枢碎片</span>
            <span className="text-[10px] text-yellow-300/70 shrink-0">{shardCount} / 5</span>
          </div>
          {divineCoreCrafted ? (
            <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1 shrink-0">
              <Check className="w-3 h-3" />
              已合成神界中枢
            </span>
          ) : (
            <button
              onClick={() => {
                const res = craftDivineCore();
                if (res.success) {
                  toast.success('🎉 成功合成【神界中枢】！全属性 +1000%');
                } else {
                  toast.error(res.reason || '合成失败');
                }
              }}
              disabled={!hasAllShards}
              className={`text-[10px] px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                hasAllShards
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-900 hover:shadow-lg hover:shadow-yellow-500/40 active:scale-95'
                  : 'bg-muted/30 text-muted-foreground cursor-not-allowed border border-border/40'
              }`}
            >
              合成中枢
            </button>
          )}
        </div>
        <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-amber-400 transition-all duration-500"
            style={{ width: `${(shardCount / 5) * 100}%` }}
          />
        </div>
        {divineCoreCrafted && (
          <p className="text-[10px] text-emerald-300/80 mt-1.5">✨ 神界中枢已融合，被动全属性 +1000%</p>
        )}
        {!divineCoreCrafted && shardCount < 5 && (
          <p className="text-[10px] text-yellow-300/70 mt-1.5">击败五大神王可各获得一块中枢碎片</p>
        )}
      </div>

      {/* 分类Tab */}
      <div className="relative z-10 flex gap-1.5 md:gap-2 px-3 pt-3 md:px-6 md:pt-4">
        {GOD_REALM_CATEGORIES.map((c) => {
          const catDefeated = defeatedIds.filter((id) =>
            GOD_REALM_BOSSES.find((b) => b.id === id)?.category === c.key,
          ).length;
          const catTotal = GOD_REALM_BOSSES.filter((b) => b.category === c.key).length;
          const active = activeCat === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setActiveCat(c.key)}
              className={`flex-1 min-w-0 py-2 md:py-3 rounded-lg border transition-all font-bold ${active
                ? 'border-yellow-400/60 bg-gradient-to-b from-yellow-500/20 to-amber-500/10 text-yellow-200 shadow-lg shadow-yellow-500/20'
                : 'border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-0.5 px-1">
                <span className="text-lg md:text-xl leading-none">{c.icon}</span>
                <span className="text-[11px] md:text-sm truncate max-w-full">{c.label}</span>
                <span className="text-[9px] md:text-[10px] opacity-70 font-normal whitespace-nowrap">
                  {catDefeated}/{catTotal}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 分类描述 */}
      <div className="relative z-10 px-4 pt-2 md:px-6 md:pt-3">
        <p className="text-[11px] md:text-xs text-muted-foreground italic">
          {cat.desc}
        </p>
      </div>

      {/* Boss 列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 md:px-6 md:py-4 space-y-3 md:space-y-4">
        {bosses.map((boss, i) => {
          const isDefeated = defeatedIds.includes(boss.id);
          return (
            <motion.div
              key={boss.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className={`relative rounded-xl border overflow-hidden transition-all ${
                isDefeated
                  ? 'border-emerald-500/40 bg-emerald-950/30'
                  : 'border-white/10 bg-gradient-to-br from-slate-900/80 to-indigo-950/60 hover:border-yellow-400/40'
              }`}
            >
              {/* 左侧品质色条 */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: boss.qualityColor }}
              />
              <div className="p-3 md:p-4 pl-4 md:pl-5">
                {/* 顶部：名字+称号+状态 */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-base md:text-lg font-bold truncate"
                        style={{ color: boss.qualityColor, textShadow: `0 0 10px ${boss.qualityColor}50` }}
                      >
                        {boss.name}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded border font-bold"
                        style={{ color: boss.qualityColor, borderColor: `${boss.qualityColor}60` }}
                      >
                        {boss.qualityLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{boss.title}</p>
                  </div>
                  {isDefeated && (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/15 px-2 py-1 rounded-full border border-emerald-500/30 shrink-0">
                      <Check className="w-3.5 h-3.5" />
                      已击败
                    </div>
                  )}
                </div>

                {/* 背景描述 */}
                <p className="text-[11px] md:text-xs text-muted-foreground mb-3 leading-relaxed line-clamp-2">
                  {boss.background}
                </p>

                {/* 属性 */}
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3 text-[10px] md:text-xs">
                  <div className="flex items-center gap-1 text-red-300/90">
                    <Heart className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      血量: <span className="font-bold tabular-nums">{formatBigNumber(boss.hp)}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-orange-300/90">
                    <Swords className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      攻击: <span className="font-bold tabular-nums">{formatBigNumber(boss.attack)}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-300/90">
                    <Shield className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      防御: <span className="font-bold tabular-nums">{formatBigNumber(boss.defense)}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-cyan-300/90">
                    <Zap className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      速度: <span className="font-bold tabular-nums">{formatBigNumber(boss.speed)}</span>
                    </span>
                  </div>
                </div>

                {/* 神技 */}
                <div className="bg-black/30 rounded-lg px-3 py-2 mb-3 border border-white/5">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11px] md:text-xs font-bold shrink-0"
                      style={{ color: boss.qualityColor }}
                    >
                      神技 · {boss.skillName}
                    </span>
                    {boss.specialEffect?.type === 'ban-skill' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 shrink-0">
                        封禁魂技
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] md:text-[11px] text-muted-foreground mt-1">{boss.skillDesc}</p>
                </div>

                {/* 奖励 */}
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-[10px] text-yellow-400 font-bold shrink-0 mt-0.5">🎁 奖励</span>
                  <span className="text-[10px] md:text-xs text-yellow-200/90 leading-snug">
                    {boss.rewardDesc}
                  </span>
                </div>

                {/* 挑战按钮 */}
                <button
                  onClick={() => handleChallenge(boss)}
                  disabled={isDefeated}
                  className={`w-full py-2.5 md:py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    isDefeated
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                      : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-900 hover:shadow-lg hover:shadow-yellow-500/40 active:scale-95 border border-yellow-300/60'
                  }`}
                >
                  {isDefeated ? (
                    <>
                      <Check className="w-4 h-4" />
                      已征服
                    </>
                  ) : (
                    <>
                      <Swords className="w-4 h-4" />
                      发起挑战
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}

        {/* 底部提示 */}
        <div className="text-center text-[10px] text-muted-foreground/60 py-4">
          <p>击败后不可再次挑战 · 转世后神界重新开启</p>
        </div>
      </div>
    </div>
  );
}
