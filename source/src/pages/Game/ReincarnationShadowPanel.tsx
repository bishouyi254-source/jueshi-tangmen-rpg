import { useMemo, useState } from 'react';
import { X, Swords, Coins, Sparkles, Shield, Sword, Zap, Heart, Clock, Ghost } from 'lucide-react';
import { useGame, type IReincarnationOrb } from '@/lib/gameStore';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { avatarImages } from '@lark-apaas/client-toolkit-lite';

interface ReincarnationShadowPanelProps {
  onClose: () => void;
  onStartBattle: (orb: IReincarnationOrb) => void;
}

export default function ReincarnationShadowPanel({ onClose, onStartBattle }: ReincarnationShadowPanelProps) {
  const { player, attributes, getReincarnationShadow, hasShadowChallengedToday, startShadowChallenge } = useGame();
  const [confirming, setConfirming] = useState(false);

  const orb = useMemo(() => getReincarnationShadow(), [player?.reincarnation?.orbs]);
  const challengedToday = false;

  const handleStart = () => {
    if (!orb) {
      toast.error('尚未转世，没有上一世的记忆');
      return;
    }
    if (challengedToday) {
      toast.error('今日已挑战过轮回之影，明日再来吧');
      return;
    }
    setConfirming(true);
  };

  const confirmBattle = () => {
    const result = startShadowChallenge();
    if (!result.success || !result.orb) {
      toast.error(result.reason || '挑战失败');
      setConfirming(false);
      return;
    }
    toast.success('轮回之影已苏醒，战斗即将开始...');
    setConfirming(false);
    onStartBattle(result.orb);
  };

  // 实力对比
  const currentAtk = attributes?.attack ?? 0;
  const currentDef = attributes?.defense ?? 0;
  const currentHp = attributes?.hp ?? 0;
  const currentSpd = attributes?.speed ?? 0;
  const currentSpr = attributes?.spirit ?? 0;

  const shadowAtk = orb?.attributes.attack ?? 0;
  const shadowDef = orb?.attributes.defense ?? 0;
  const shadowHp = orb?.attributes.hp ?? 0;
  const shadowSpd = orb?.attributes.speed ?? 0;
  const shadowSpr = orb?.attributes.spirit ?? 0;

  // 奖励预览：按上一世等级估算
  const expReward = orb ? Math.max(1000, Math.floor(orb.level * orb.level * 20)) : 0;
  const coinReward = orb ? Math.max(500, Math.floor(orb.level * 500)) : 0;

  if (!orb) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md rounded-2xl border border-purple-500/30 bg-gradient-to-br from-card/95 to-background/90 p-6 shadow-xl"
        >
          <button
            aria-label="关闭" onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-purple-900/40 border border-purple-500/40 flex items-center justify-center">
              <Ghost className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">轮回之影</h3>
              <p className="text-sm text-muted-foreground">暂无前世记忆</p>
            </div>
            <p className="text-xs text-muted-foreground/80 max-w-xs mx-auto leading-relaxed">
              当你完成第一次转世后，上一世的修行残影将留存于轮回长河中。
              届时你可挑战自己的前世之影，以证今生修为更胜往昔。
            </p>
            <button
              aria-label="关闭" onClick={onClose}
              className="px-6 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 transition-colors"
            >
              我知道了
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const StatCompare = ({ label, cur, prev, icon: Icon }: { label: string; cur: number; prev: number; icon: typeof Sword }) => {
    const diff = cur - prev;
    const pct = prev > 0 ? Math.min(100, Math.round((cur / prev) * 100)) : 100;
    const isStronger = diff >= 0;
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-foreground/80">
            <Icon className="h-3.5 w-3.5 text-purple-400" />
            {label}
          </div>
          <span className={`text-[11px] font-medium ${isStronger ? 'text-green-400' : 'text-red-400'}`}>
            {isStronger ? '↑' : '↓'} {Math.abs(Math.round((diff / Math.max(1, prev)) * 100))}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted/40 overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-purple-400"
            style={{ width: `${Math.min(50, pct / 2)}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400"
            style={{ width: `${Math.min(50, ((100 - pct) / 2) + (pct > 100 ? 50 : 0))}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>前世 {prev.toLocaleString()}</span>
          <span>今生 {cur.toLocaleString()}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg rounded-2xl border border-purple-500/30 bg-gradient-to-br from-card/95 to-background/90 shadow-xl my-auto"
      >
        <button
          aria-label="关闭" onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-5 space-y-4">
          {/* 顶部标题 */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Ghost className="h-5 w-5 text-purple-400" />
              <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                轮回之影
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">挑战上一世的自己，检验今生修行成果</p>
          </div>

          {/* 对手信息 */}
          <div className="rounded-xl border border-purple-500/25 bg-gradient-to-br from-purple-900/20 to-card/50 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-purple-500/40 shrink-0">
                <Image src={avatarImages.avatarImg3} alt="前世" className="w-full h-full object-cover opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 to-transparent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-purple-200 truncate">{orb.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    第{orb.index}世
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {orb.realm} · {orb.level}级 · {orb.direction}
                </div>
                <div className="text-[11px] text-purple-300/80 mt-0.5 truncate">
                  武魂：{orb.martialSoul.name}
                  {orb.isTwinSoul && orb.secondSoul && ` / ${orb.secondSoul.name}`}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-black/30 border border-purple-500/20 py-2">
                <div className="text-[10px] text-muted-foreground">魂环</div>
                <div className="text-sm font-bold text-purple-300">{orb.soulRings.length}</div>
              </div>
              <div className="rounded-lg bg-black/30 border border-purple-500/20 py-2">
                <div className="text-[10px] text-muted-foreground">魂骨</div>
                <div className="text-sm font-bold text-purple-300">
                  {Object.values(orb.soulBones || {}).filter(Boolean).length}
                </div>
              </div>
              <div className="rounded-lg bg-black/30 border border-purple-500/20 py-2">
                <div className="text-[10px] text-muted-foreground">魂灵</div>
                <div className="text-sm font-bold text-purple-300">{(orb.soulSpirits || []).length}</div>
              </div>
            </div>
          </div>

          {/* 实力对比 */}
          <div className="rounded-xl border border-border/40 bg-card/40 p-4 space-y-3">
            <div className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Swords className="h-4 w-4 text-amber-400" />
              实力对比
            </div>
            <StatCompare label="攻击" cur={currentAtk} prev={shadowAtk} icon={Sword} />
            <StatCompare label="防御" cur={currentDef} prev={shadowDef} icon={Shield} />
            <StatCompare label="气血" cur={currentHp} prev={shadowHp} icon={Heart} />
            <StatCompare label="速度" cur={currentSpd} prev={shadowSpd} icon={Zap} />
            <StatCompare label="精神" cur={currentSpr} prev={shadowSpr} icon={Sparkles} />
          </div>

          {/* 奖励预览 */}
          <div className="rounded-xl border border-amber-500/25 bg-amber-900/10 p-4">
            <div className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
              <Coins className="h-4 w-4" />
              胜利奖励
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2 border border-amber-500/20">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <div>
                  <div className="text-[10px] text-muted-foreground">经验</div>
                  <div className="text-sm font-bold text-cyan-300">+{expReward.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2 border border-amber-500/20">
                <Coins className="h-4 w-4 text-amber-400" />
                <div>
                  <div className="text-[10px] text-muted-foreground">魂币</div>
                  <div className="text-sm font-bold text-amber-300">+{coinReward.toLocaleString()}</div>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground/80 mt-2 flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              可重复挑战，失败无惩罚
            </div>
          </div>

          {/* 挑战按钮 */}
          {challengedToday ? (
            <div className="text-center py-2">
              <div className="text-sm text-muted-foreground">今日已挑战，明日再来</div>
            </div>
          ) : (
            <button
              onClick={handleStart}
              className="w-full h-12 rounded-xl font-bold text-base transition-all bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 text-white border border-purple-400/50 shadow-[0_0_20px_rgba(168_85_247_0.3)] hover:shadow-[0_0_30px_rgba(168_85_247_0.5)] active:scale-[0.98]"
            >
              <div className="flex items-center justify-center gap-2">
                <Swords className="h-5 w-5" />
                挑战轮回之影
              </div>
            </button>
          )}
        </div>

        {/* 确认弹窗 */}
        {confirming && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-purple-500/40 rounded-xl p-5 w-72 text-center space-y-4"
            >
              <div className="text-foreground font-semibold">确认挑战？</div>
              <p className="text-xs text-muted-foreground">
                挑战上一世的自己，胜利可获得丰厚奖励，失败无惩罚。
                <br />
                <span className="text-amber-300/80">不限挑战次数</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 h-9 rounded-lg bg-muted/50 text-foreground text-sm font-medium hover:bg-muted/70 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={confirmBattle}
                  className="flex-1 h-9 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium hover:from-purple-500 hover:to-purple-400 transition-colors"
                >
                  开始挑战
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
