import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Clock, ArrowUp, Star, Sparkles } from 'lucide-react';
import { useGame, isBottleneck, getMaxExp, getCultivationSeconds, getRealmDisplay, REALM_LIST, calcAttributes, EASTER_REALM_NAMES, getEasterRealmExp, normalizeBeastAttribute } from '@/lib/gameStore';
import { toast } from 'sonner';

export default function CultivationPanel() {
  const {
    player, startCultivation, finishCultivation, startBattle,
    chooseSoulCore, breakThroughWithYinYangCore,
    battleState, lastBattleResult, inBattle, endBattle, breakthroughEasterRealm,
  } = useGame();
  const [tick, setTick] = useState(0);
  const [showBreakthrough, setShowBreakthrough] = useState(false);
  const [showSoulCoreChoice, setShowSoulCoreChoice] = useState(false);

  // 每秒刷新
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // 检查普通闭关完成
  const breakthroughCompletedRef = useRef(false);
  useEffect(() => {
    if (player?.cultivationEndTime && Date.now() >= player.cultivationEndTime && !breakthroughCompletedRef.current) {
      breakthroughCompletedRef.current = true;
      finishCultivation();
      setShowBreakthrough(true);
      toast.success('闭关成功！突破新境界！');
    }
    // 玩家重新开始闭关时重置标记
    if (player?.cultivationEndTime && Date.now() < player.cultivationEndTime) {
      breakthroughCompletedRef.current = false;
    }
  }, [player?.cultivationEndTime, finishCultivation, tick]);

  const attrs = useMemo(() => player ? calcAttributes(player) : null, [player]);

  if (!player) return null;

  const bottleneck = isBottleneck(player.level);
  const easterStage = Math.max(0, Math.min(3, player.easterRealmStage ?? 0));
  const maxExp = getMaxExp(player.level, easterStage);
  const expPct = !isFinite(maxExp) ? 100 : Math.min(100, (player.exp / maxExp) * 100);
  const realm = getRealmDisplay(player.level, player.soulRings.length, player.title, easterStage, player.divineTrial);

  const isCultivating = !!player.cultivationEndTime;
  const now = Date.now();
  const remainingMs = isCultivating ? Math.max(0, player.cultivationEndTime! - now) : 0;
  const totalSeconds = player.cultivationFromLevel != null ? getCultivationSeconds(player.cultivationFromLevel) : getCultivationSeconds(player.level);
  const totalMs = totalSeconds * 1000;
  const progressPct = isCultivating ? ((totalMs - remainingMs) / totalMs) * 100 : 0;

  const remainingSec = Math.ceil(remainingMs / 1000);
  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;

  const nextRealm = REALM_LIST.find((r) => r.min > player.level);

  // 89级瓶颈且已选魂核 - 显示魂核凝聚界面
  const atLvl89 = player.level === 89 && bottleneck && player.exp >= maxExp;
  const atLvl98 = player.level === 98 && bottleneck && player.exp >= maxExp;
  const isMaxLevel = player.level >= 99;

  // 阴阳魂核状态
  const isSingleYinCore = player.soulCoreType === 'yin'; // 只有阴魂核（89级选了阴）
  const isSingleYangCore = player.soulCoreType === 'yang'; // 只有阳魂核（89级选了阳）
  const isDualCore = player.soulCoreType === 'yin-yang'; // 双魂核圆满
  const hasYinCore = isSingleYinCore || isDualCore;
  const hasYangCore = isSingleYangCore || isDualCore;

  const canStartNormalCultivation = bottleneck && player.exp >= maxExp && !isCultivating && player.level < 89;

  // 🔴 罗三炮专属：光属性魂环突破检测
  // 29级突破30级：需要前2个魂环全为光属性（原著设定，罗三炮前两魂环必须是光明属性才能突破三十级）
  // 90级进化：前9个魂环全为光属性 → 进化为耀阳圣龙
  const isLuosanpao = player.martialSoul?.name === '罗三炮';
  // 判断魂环是否为光属性（使用归一化函数，保证与逻辑层一致）
  const isLightRing = (ring: { beastAttribute?: string }) => {
    return normalizeBeastAttribute(ring.beastAttribute) === '光属性';
  };
  let lightRingCount = 0;
  let requiredLightRings = 0;
  // 29级瓶颈：需前2个魂环都是光属性
  if (isLuosanpao && player.level === 29) {
    requiredLightRings = 2;
    const frontRings = (player.soulRings || []).slice(0, 2);
    lightRingCount = frontRings.filter(isLightRing).length;
  }
  const lightRingCheckPassed = requiredLightRings === 0 || lightRingCount >= requiredLightRings;
  // 罗三炮未进化 + 当前瓶颈且光属性魂环不足 → 无法闭关
  const luosanpaoBlocked = isLuosanpao && canStartNormalCultivation && !lightRingCheckPassed;

  // 🔴 七宝琉璃塔专属：79级瓶颈且未进化 → 无法闭关突破80级（主修或次修均生效）
  const isQibaoLiuli = player.martialSoul?.name === '七宝琉璃塔' || player.secondSoul?.name === '七宝琉璃塔';
  const qibaoLiuliBlocked = isQibaoLiuli && player.level >= 79 && bottleneck;

  const handleStartCultivation = () => {
    if (qibaoLiuliBlocked) {
      toast.error('七宝琉璃塔最高修炼至79级！需服用仙草「绮罗郁金香」进化为九宝玲珑塔后方可继续突破。');
      return;
    }
    if (luosanpaoBlocked) {
      toast.error(`突破失败！罗三炮武魂需要前${requiredLightRings}个魂环均为光属性才能突破（当前${lightRingCount}/${requiredLightRings}）`);
      return;
    }
    startCultivation();
  };

  // 魂核选择（89级）- 仅阴阳魂核
  const handleChooseSoulCore = (type: 'yin' | 'yang') => {
    chooseSoulCore(type);
    setShowSoulCoreChoice(false);
    setShowBreakthrough(true);
    toast.success(`${type === 'yin' ? '阴' : '阳'}魂核凝聚完成！突破至 90 级！全属性 +200%`);
  };

  // 98级突破：使用另一个魂核直接突破到99级
  const handleLvl98YinYangBreak = () => {
    const success = breakThroughWithYinYangCore(98);
    if (success) {
      setShowBreakthrough(true);
      toast.success(`双魂核圆满！突破至 99 级极限斗罗！全属性 +400%`);
    } else {
      toast.error('突破失败：条件不满足');
    }
  };

  // 彩蛋境界突破（99级之上）
  const handleEasterBreakthrough = () => {
    const result = breakthroughEasterRealm();
    if (result.success) {
      setShowBreakthrough(true);
      toast.success(`突破成功！晋升【${EASTER_REALM_NAMES[result.newStage]}】！全属性 +${result.newStage * 50}%`);
    } else {
      toast.error(result.reason || '突破失败');
    }
  };

  return (
    <div className="p-3 md:p-5">
      <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-5 flex items-center gap-2">
        <Flame className="h-5 w-5 text-cyan-400" />
        闭关修炼
      </h2>

      {/* 当前状态卡 */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-card/75 backdrop-blur-sm p-4 md:p-6 mb-4 md:mb-6 shadow-md text-foreground">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">当前境界</span>
             <span className="px-2 py-0.5 rounded-full bg-cyan-900/40 text-cyan-300 text-xs font-medium border border-cyan-500/30">
              {realm} · Lv.{player.level}
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground mb-3">
            {player.level} 级
            {nextRealm && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                → 下一境界：{nextRealm.name}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>修为进度</span>
              <span>{Math.floor(player.exp)} / {!isFinite(maxExp) ? 'MAX' : maxExp}</span>
            </div>
              <div className="h-2 rounded-full bg-cyan-950/60 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-yellow-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${expPct}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
          </div>

          {bottleneck && player.level < 89 && (
            <div className="mt-3 p-2 rounded-lg bg-red-900/30 border border-red-500/30 text-xs text-red-400">
              ⚠️ 已达瓶颈等级 {player.level} 级，经验已满，需闭关突破
            </div>
          )}
          {isLuosanpao && player.level === 29 && bottleneck && (
            <div className={`mt-3 p-2 rounded-lg border text-xs ${
              lightRingCheckPassed
                ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-300'
                : 'bg-yellow-900/30 border-yellow-500/30 text-yellow-300'
            }`}>
              🐲 罗三炮突破条件：前{requiredLightRings}个魂环需全为光属性（当前 {lightRingCount}/{requiredLightRings}）
              {lightRingCheckPassed ? ' ✓ 已满足' : ''}
            </div>
          )}
          {atLvl89 && player.soulCoreType === 'none' && (
            <div className="mt-3 p-2 rounded-lg bg-cyan-900/30 border border-cyan-500/30 text-xs text-cyan-200">
              🌟 90 级突破：选择魂核类型以凝聚魂核
            </div>
          )}
          {atLvl98 && (
            <div className="mt-3 p-2 rounded-lg bg-cyan-800/50 border border-cyan-500/30 text-xs text-cyan-300">
              🔮 99 级突破：最终瓶颈，凝聚神魂！
            </div>
          )}
          {isMaxLevel && easterStage < 3 && (
            <div className="mt-3 p-2 rounded-lg bg-yellow-900/30 border border-yellow-500/30 text-xs text-yellow-300">
              ✨ 彩蛋境界：{EASTER_REALM_NAMES[easterStage]} → {EASTER_REALM_NAMES[easterStage + 1]}（每阶 +50% 全属性）
            </div>
          )}
          {isMaxLevel && easterStage >= 3 && (
            <div className="mt-3 p-2 rounded-lg bg-yellow-900/40 border border-yellow-400/50 text-xs text-yellow-300">
              👑 已达最高境界【准神】，全属性累计 +150%
            </div>
          )}
        </div>
      </div>

      {/* 魂核系统展示（始终显示，未凝聚时展示解锁条件） */}
      <div className="rounded-2xl border border-cyan-500/30 bg-card/75 backdrop-blur-sm p-4 mb-4 shadow-md text-foreground">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-violet-700">
          <Sparkles className="h-4 w-4" />
          魂核系统
        </h3>
        {player.soulCoreType === 'none' ? (
          <div className="text-center py-3">
            <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-500/60 flex items-center justify-center opacity-60">
              <div className="text-slate-400 text-xs font-bold">未凝聚</div>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {player.level < 89
                ? `89级瓶颈时可凝聚魂核（当前 ${player.level} 级）`
                : atLvl89
                ? '🌟 已达 89 级瓶颈，下方选择魂核类型开始凝聚！'
                : '当前阶段无需凝聚魂核'}
            </div>
             <div className="text-[10px] text-muted-foreground/60 mt-1">
                阴阳互补双魂核：单魂核 +200%，双魂核圆满 +400% 全属性
              </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              {/* 阴魂核 */}
              <div className="flex-1 text-center">
              <div
                 className={`w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center ${
                   hasYinCore
                     ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-300'
                     : 'bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-500/50 opacity-40'
                 }`}
                 style={{ boxShadow: hasYinCore ? '0 0 20px rgba(200,200,220,0.5)' : undefined }}
               >
                 <div className="relative w-10 h-10">
                   <svg viewBox="0 0 100 100" className={`w-full h-full ${!hasYinCore ? 'opacity-40' : ''}`}>
                     <circle cx="50" cy="50" r="45" fill="#1a1a2e" stroke="#ccc" strokeWidth="2" />
                     <path d="M50 5 A45 45 0 0 1 50 95 A22.5 22.5 0 0 1 50 50 A22.5 22.5 0 0 0 50 5 Z" fill="#eee" />
                     <circle cx="50" cy="27.5" r="7" fill="#1a1a2e" />
                     <circle cx="50" cy="72.5" r="7" fill="#eee" />
                   </svg>
                 </div>
               </div>
               <div className="text-xs font-medium text-violet-700">阴魂核</div>
               <div className="text-[10px] text-muted-foreground mt-0.5">
                 {hasYinCore ? '已凝聚' : '未凝聚'}
               </div>
            </div>

            {(player.soulCoreType === 'yin' || player.soulCoreType === 'yang' || player.soulCoreType === 'yin-yang') && (
              <>
                <div className="text-muted-foreground text-lg">+</div>
                {/* 阳魂核 */}
                <div className="flex-1 text-center">
                  <div
                    className={`w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center ${
                      hasYangCore
                        ? 'bg-gradient-to-br from-yellow-500 to-cyan-500 border-2 border-yellow-300'
                        : 'bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-500'
                    }`}
                    style={{ boxShadow: hasYangCore ? '0 0 25px rgba(251,191,36,0.6)' : undefined }}
                  >
                    <div className="relative w-10 h-10">
                      <svg viewBox="0 0 100 100" className={`w-full h-full ${!hasYangCore ? 'opacity-40' : ''}`}>
                        <circle cx="50" cy="50" r="45" fill="#fff8e1" stroke="#ffd700" strokeWidth="2" />
                        <path d="M50 5 A45 45 0 0 1 50 95 A22.5 22.5 0 0 1 50 50 A22.5 22.5 0 0 0 50 5 Z" fill="#1a1a2e" />
                        <circle cx="50" cy="27.5" r="7" fill="#eee" />
                        <circle cx="50" cy="72.5" r="7" fill="#1a1a2e" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-yellow-700">阳魂核</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {hasYangCore ? '已凝聚' : (player.level >= 98 && (isSingleYinCore || isSingleYangCore)) ? '可凝聚' : '未解锁'}
                  </div>
                </div>
              </>
            )}
          </div>

           {/* 属性加成展示 */}
           <div className="mt-3 pt-3 border-t border-violet-500/20 text-xs space-y-1">
             {(isSingleYinCore || isDualCore) && player.level >= 90 && (
               <div className="flex justify-between">
                 <span className="text-muted-foreground">阴魂核</span>
                 <span className="text-violet-700 font-medium">全属性 +200%</span>
               </div>
             )}
             {isDualCore && (
               <div className="flex justify-between">
                 <span className="text-muted-foreground">阳魂核</span>
                 <span className="text-yellow-700 font-medium">全属性 +200%（累计400%）</span>
               </div>
             )}
             {isSingleYangCore && player.level >= 90 && player.level < 99 && (
               <div className="flex justify-between">
                 <span className="text-muted-foreground">阳魂核</span>
                 <span className="text-yellow-700 font-medium">全属性 +200%</span>
               </div>
             )}
           </div>
          </>
        )}
      </div>

      {/* 彩蛋境界突破（99级之上） */}
      {isMaxLevel && easterStage < 3 && (
        <div className="relative overflow-hidden rounded-2xl border border-yellow-500/40 bg-gradient-to-br from-yellow-900/20 via-card/75 to-orange-900/20 backdrop-blur-sm p-4 mb-4 shadow-md text-foreground">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/15 rounded-full blur-2xl" />
          <div className="relative">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-yellow-400">
              <Star className="h-4 w-4" />
              彩蛋境界 · 神之路
            </h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">当前境界</span>
                <span className="font-bold text-yellow-300">{EASTER_REALM_NAMES[easterStage]}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">下一境界</span>
                <span className="font-bold text-orange-300">{EASTER_REALM_NAMES[easterStage + 1]}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">突破所需修为</span>
                <span className="text-cyan-300 tabular-nums">{getEasterRealmExp(easterStage).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">当前修为</span>
                <span className="text-foreground tabular-nums">{Math.floor(player.exp).toLocaleString()}</span>
              </div>
            </div>
            {/* 修为进度条 */}
            <div className="h-2.5 rounded-full bg-yellow-950/60 overflow-hidden mb-3">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-500 via-amber-400 to-orange-400"
                initial={{ width: 0 }}
                animate={{ width: `${expPct}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
            <div className="text-xs text-muted-foreground mb-3 flex justify-between">
              <span>进度 {expPct.toFixed(1)}%</span>
              <span className="text-yellow-500/80">突破后全属性 +{(easterStage + 1) * 50}%</span>
            </div>
            {/* 三阶段标记 */}
            <div className="flex items-center justify-between mb-4 px-1">
              {['准半神', '半神', '准神'].map((name, i) => (
                <div key={name} className="flex flex-col items-center flex-1">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold mb-1
                    ${easterStage > i ? 'bg-yellow-500 border-yellow-400 text-yellow-900' :
                      easterStage === i ? 'bg-yellow-500/30 border-yellow-400 text-yellow-300' :
                      'bg-transparent border-gray-500 text-gray-500'}`}>
                    {easterStage > i ? '✓' : i + 1}
                  </div>
                  <span className={`text-[10px] ${easterStage >= i ? 'text-yellow-300' : 'text-muted-foreground'}`}>{name}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleEasterBreakthrough}
              disabled={player.exp < getEasterRealmExp(easterStage)}
              className="w-full py-3 rounded-xl font-bold text-sm
                bg-gradient-to-r from-yellow-600 via-amber-500 to-orange-500 text-yellow-950
                hover:from-yellow-500 hover:via-amber-400 hover:to-orange-400
                disabled:opacity-40 disabled:cursor-not-allowed
                shadow-lg shadow-yellow-500/20
                transition-all"
            >
              {player.exp >= getEasterRealmExp(easterStage) ? `突破至 ${EASTER_REALM_NAMES[easterStage + 1]}` : '修为不足'}
            </button>
          </div>
        </div>
      )}

      {/* 突破闭景区 */}
      <div className="rounded-2xl border border-border/40 bg-card/40 p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-600" />
          突破修炼
        </h3>

         {/* 89级魂核选择 */}
         {atLvl89 && player.soulCoreType === 'none' && (
           <div className="space-y-3">
             <p className="text-sm text-center text-muted-foreground">
               已达 89 级瓶颈，请选择魂核类型凝聚，突破至 90 级：
             </p>
             <p className="text-[10px] text-center text-muted-foreground/70">
               阴阳互补双魂核：98级可凝聚第二魂核，99级圆满 +400% 全属性
             </p>
             <div className="grid grid-cols-2 gap-3">
               <button
                 onClick={() => handleChooseSoulCore('yin')}
                 className="p-4 rounded-xl border-2 border-violet-500/30 bg-violet-900/20 text-center hover:border-violet-400/50 transition-all active:scale-[0.98]"
               >
                 <div className="w-14 h-14 mx-auto mb-2 rounded-full flex items-center justify-center">
                   <svg viewBox="0 0 100 100" className="w-full h-full">
                     <circle cx="50" cy="50" r="45" fill="#1a1a2e" stroke="#ccc" strokeWidth="2" />
                     <path d="M50 5 A45 45 0 0 1 50 95 A22.5 22.5 0 0 1 50 50 A22.5 22.5 0 0 0 50 5 Z" fill="#eee" />
                     <circle cx="50" cy="27.5" r="7" fill="#1a1a2e" />
                     <circle cx="50" cy="72.5" r="7" fill="#eee" />
                   </svg>
                 </div>
                 <div className="font-bold text-sm text-violet-700">阴魂核</div>
                 <div className="text-[10px] text-muted-foreground mt-1">点击直接突破 +200%</div>
               </button>

               <button
                 onClick={() => handleChooseSoulCore('yang')}
                 className="p-4 rounded-xl border-2 border-yellow-500/30 bg-yellow-900/20 text-center hover:border-yellow-400/50 transition-all active:scale-[0.98]"
               >
                 <div className="w-14 h-14 mx-auto mb-2 rounded-full flex items-center justify-center">
                   <svg viewBox="0 0 100 100" className="w-full h-full">
                     <circle cx="50" cy="50" r="45" fill="#fff8e1" stroke="#ffd700" strokeWidth="2" />
                     <path d="M50 5 A45 45 0 0 1 50 95 A22.5 22.5 0 0 1 50 50 A22.5 22.5 0 0 0 50 5 Z" fill="#1a1a2e" />
                     <circle cx="50" cy="27.5" r="7" fill="#eee" />
                     <circle cx="50" cy="72.5" r="7" fill="#1a1a2e" />
                   </svg>
                 </div>
                 <div className="font-bold text-sm text-yellow-700">阳魂核</div>
                 <div className="text-[10px] text-muted-foreground mt-1">点击直接突破 +200%</div>
               </button>
             </div>
           </div>
         )}

         {/* 98级阴阳魂核：点击另一个魂核直接突破到99级 */}
         {(isSingleYinCore || isSingleYangCore) && atLvl98 && (
           <div className="text-center py-4">
             <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-500/20 to-cyan-600/20 border-2 border-dashed border-yellow-500/50 flex items-center justify-center">
               <Star className="h-8 w-8 text-yellow-500/60" />
             </div>
             <p className="text-sm text-foreground mb-2">
               凝聚{isSingleYinCore ? '阳' : '阴'}魂核，突破至 99 级
             </p>
             <p className="text-xs text-muted-foreground mb-4">
               双魂核圆满：全属性 +400%
             </p>
             <motion.button
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               onClick={handleLvl98YinYangBreak}
               className="w-full py-3 rounded-xl font-bold shadow-lg bg-gradient-to-r from-yellow-500 via-cyan-400 to-yellow-500 text-yellow-950 shadow-yellow-500/30 hover:shadow-yellow-500/50"
             >
               凝聚{isSingleYinCore ? '阳' : '阴'}魂核 · 突破 99 级
             </motion.button>
           </div>
         )}

         {/* 普通闭关界面（非魂核关卡） */}
         {/* 89级、98级魂核关卡时不显示普通闭关 */}
         {!atLvl89 && !atLvl98 && (
          <>
            {isCultivating ? (
              <div className="text-center py-4">
                <div className="relative h-40 flex items-center justify-center mb-4">
                  <motion.div
                    className="absolute w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400/40 to-orange-500/40"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ filter: 'blur(10px)' }}
                  />
                  <motion.div
                    className="absolute w-8 h-48"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      background: 'linear-gradient(to top, transparent, rgba(251,191,36,0.6), transparent)',
                      filter: 'blur(3px)',
                    }}
                  />
                  <motion.div
                    className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-cyan-300 to-orange-500"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ boxShadow: '0 0 40px rgba(251,191,36,0.6)' }}
                  >
                    <div className="w-full h-full flex items-center justify-center text-xl font-black text-cyan-950">
                      修
                    </div>
                  </motion.div>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full bg-cyan-300"
                      animate={{ y: [20, -60], opacity: [0, 1, 0] }}
                      transition={{ duration: 2, delay: i * 0.25, repeat: Infinity, ease: 'easeOut' }}
                      style={{
                        left: `${30 + (i % 4) * 12}%`,
                        boxShadow: '0 0 6px rgba(251,191,36,0.8)',
                      }}
                    />
                  ))}
                </div>

                <div className="text-3xl font-bold text-cyan-200 tabular-nums mb-1">
                  {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                </div>
                <div className="text-sm text-muted-foreground mb-3">闭关突破中...</div>

                <div className="h-2 rounded-full bg-cyan-950/60 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-600"
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1, ease: 'linear' }}
                  />
                </div>
              </div>
            ) : canStartNormalCultivation ? (
              <div className="text-center py-4">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-orange-500/20 border-2 border-cyan-500/40 flex items-center justify-center">
                  <Flame className="h-8 w-8 text-cyan-400" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  准备突破至 <span className="text-cyan-300 font-semibold">{player.level + 1} 级</span>
                </p>
                <p className="text-xs text-muted-foreground mb-4 flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  预计时长：{totalSeconds} 秒
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartCultivation}
                  className="w-full py-3 rounded-xl font-bold shadow-lg bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-500 text-cyan-950 shadow-cyan-500/30 hover:shadow-cyan-500/50"
                >
                  开始闭关突破
                </motion.button>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted/20 flex items-center justify-center">
                  <Star className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {isMaxLevel && bottleneck && player.exp >= maxExp
                    ? '已达当前版本最高等级（99级）'
                    : isMaxLevel
                    ? '已达当前版本最高等级（99级）'
                    : bottleneck
                    ? player.exp >= maxExp
                      ? '可以开始闭关突破了！'
                      : '修为不足，继续历练积累修为吧'
                    : '还未到瓶颈等级，继续历练升级吧'}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1 text-center">
                  瓶颈等级：9 / 19 / 29 / 39 / 49 / 59 / 69 / 79 / 89 级
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* 时长说明 */}
      <div className="mt-4 rounded-xl border border-border/30 bg-card/30 p-3">
        <h4 className="text-xs font-semibold text-muted-foreground mb-2">闭关时长规则</h4>
        <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
          <div className="text-center">
            <div className="text-cyan-200 font-bold">10 秒</div>
            <div>魂士→魂师</div>
          </div>
          <div className="text-center">
            <div className="text-cyan-200 font-bold">20 秒</div>
            <div>魂师→大魂师</div>
          </div>
          <div className="text-center">
            <div className="text-cyan-200 font-bold">30 秒</div>
            <div>大魂师→魂尊</div>
          </div>
          <div className="text-center">
            <div className="text-cyan-200 font-bold">40 秒</div>
            <div>魂尊→魂宗</div>
          </div>
          <div className="text-center">
            <div className="text-cyan-200 font-bold">50 秒</div>
            <div>魂宗→魂王</div>
          </div>
          <div className="text-center">
            <div className="text-cyan-200 font-bold">60 秒</div>
            <div>魂王→魂帝</div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-2 text-center">
          每提升一个大境界，闭关时长增加 10 秒
        </p>
      </div>

      {/* 突破成功动画 */}
      <AnimatePresence>
        {showBreakthrough && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
            onClick={() => setShowBreakthrough(false)}
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
              className="text-center"
            >
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 2, 1.5], opacity: [0, 1, 0.5] }}
                transition={{ duration: 1 }}
                style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.8) 0%, transparent 70%)' }}
              />
              <div className="relative">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="text-white text-sm mb-2 font-medium drop-shadow-lg">突破成功</div>
                  <div className="text-5xl font-black text-cyan-300 mb-2" style={{ textShadow: '0 0 40px rgba(251,191,36,0.8)' }}>
                    Lv.{player.level}
                  </div>
                  <div className="text-xl font-bold text-white">
                    {getRealmDisplay(player.level, player.soulRings.length, player.title, easterStage, player.divineTrial)}
                  </div>
                </motion.div>
                <div className="mt-6 text-sm text-white/60">点击任意处继续</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 魂核选择确认弹窗 */}
      <AnimatePresence>
        {showSoulCoreChoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowSoulCoreChoice(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rounded-2xl border-2 p-6 relative overflow-hidden" style={{
                backgroundColor: 'rgba(88,28,135,0.15)',
                borderColor: 'rgba(139,92,246,0.5)',
                boxShadow: '0 0 60px rgba(139,92,246,0.2)',
              }}>
                <h3 className="text-xl font-bold text-center text-violet-800 mb-1">选择魂核类型</h3>
                <p className="text-xs text-center text-muted-foreground mb-5">选择后不可更改</p>

                <div className="space-y-3">
                   <button
                     onClick={() => handleChooseSoulCore('yin')}
                     className="w-full p-4 rounded-xl border border-cyan-500/30 bg-cyan-900/20 text-left hover:border-cyan-400/50 transition-all active:scale-[0.98]"
                   >
                     <div className="flex items-center gap-3">
                       <div className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center">
                         <svg viewBox="0 0 100 100" className="w-full h-full">
                           <circle cx="50" cy="50" r="45" fill="#1a1a2e" stroke="#ccc" strokeWidth="2" />
                           <path d="M50 5 A45 45 0 0 1 50 95 A22.5 22.5 0 0 1 50 50 A22.5 22.5 0 0 0 50 5 Z" fill="#eee" />
                           <circle cx="50" cy="27.5" r="7" fill="#1a1a2e" />
                           <circle cx="50" cy="72.5" r="7" fill="#eee" />
                         </svg>
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="font-bold text-violet-800">阴魂核</div>
                         <div className="text-[11px] text-muted-foreground mt-0.5">
                           点击直接突破至 90 级<br/>
                           全属性 +200%<br/>
                           98级可再凝聚阳魂核 → 累计 +400%
                         </div>
                       </div>
                     </div>
                   </button>

                   <button
                     onClick={() => handleChooseSoulCore('yang')}
                     className="w-full p-4 rounded-xl border border-yellow-500/30 bg-yellow-900/20 text-left hover:border-yellow-400/50 transition-all active:scale-[0.98]"
                   >
                     <div className="flex items-center gap-3">
                       <div className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center">
                         <svg viewBox="0 0 100 100" className="w-full h-full">
                           <circle cx="50" cy="50" r="45" fill="#fff8e1" stroke="#ffd700" strokeWidth="2" />
                           <path d="M50 5 A45 45 0 0 1 50 95 A22.5 22.5 0 0 1 50 50 A22.5 22.5 0 0 0 50 5 Z" fill="#1a1a2e" />
                           <circle cx="50" cy="27.5" r="7" fill="#eee" />
                           <circle cx="50" cy="72.5" r="7" fill="#1a1a2e" />
                         </svg>
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="font-bold text-yellow-700">阳魂核</div>
                         <div className="text-[11px] text-muted-foreground mt-0.5">
                           点击直接突破至 90 级<br/>
                           全属性 +200%<br/>
                           98级可再凝聚阴魂核 → 累计 +400%
                         </div>
                       </div>
                     </div>
                   </button>
                </div>

                <button
                  onClick={() => setShowSoulCoreChoice(false)}
                  className="mt-4 w-full py-2 rounded-xl bg-muted/30 text-muted-foreground text-sm hover:bg-muted/50 transition-colors"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
