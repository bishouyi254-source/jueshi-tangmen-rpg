import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ChevronRight, ArrowLeft, Swords, Sparkles, TrendingUp, Shield, Zap, Clock, AlertTriangle } from 'lucide-react';
 import { useGame, getMaxSpiritSlots } from '@/lib/gameStore';
import { SOUL_SPIRIT_POOL, SPIRIT_MAJOR_REALMS, SPIRIT_ELEMENT_COLORS, getSpiritRealmName, calcSpiritUpgradeCost, calcSpiritBreakthroughCost, getSpiritStats, SPIRIT_SLOT_UNLOCK_LEVELS } from '@/data/soulSpirits';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import SoulSpiritAvatar from '@/components/SoulSpiritAvatar';
import { formatNumber } from '@/lib/utils';

type Tab = 'contracted' | 'pending' | 'active' | 'special';

export default function SoulSpiritPanel() {
  const { player, contractSpirit, discardPendingSpirit, cleanupExpiredSpirits, upgradeSpirit, breakthroughSpirit, setActiveSpirits, toggleSpecialSpiritActive } = useGame();
  const [tab, setTab] = useState<Tab>('contracted');
  const [selectedSpiritId, setSelectedSpiritId] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const specialSpirits = player?.specialSoulSpirits ?? [];
  const specialActiveIds = player?.specialActiveSpiritIds ?? [];

  const handleToggleSpecialActive = (spiritId: string) => {
    const res = toggleSpecialSpiritActive(spiritId);
    if (!res.success) {
      toast.error(res.reason || '操作失败');
    }
  };

  const cleanupRef = useRef(cleanupExpiredSpirits);
  cleanupRef.current = cleanupExpiredSpirits;

  useEffect(() => {
    const timer = setInterval(() => {
      cleanupRef.current();
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!player) return null;

  const soulSpirits = player.soulSpirits ?? [];
  const activeSpiritIds = player.activeSpiritIds ?? [];
  const pendingSpirits = player.pendingSpirits ?? [];
  const maxSlots = getMaxSpiritSlots(player.level);
  const selectedSpirit = soulSpirits.find((s) => s.spiritId === selectedSpiritId);
  const template = selectedSpirit ? SOUL_SPIRIT_POOL.find((s) => s.id === selectedSpirit.spiritId) : null;

  const handleContract = (pendingId: string) => {
    const result = contractSpirit(pendingId);
    if (result.success) {
      toast.success('魂灵契约成功！');
    } else {
      toast.error(result.reason || '契约失败');
    }
  };

  const handleUpgrade = () => {
    if (!selectedSpiritId) return;
    const result = upgradeSpirit(selectedSpiritId);
    if (result.success) {
      toast.success('魂灵境界提升！');
    } else {
      toast.error(result.reason || '提升失败');
    }
  };

  const handleBreakthrough = () => {
    if (!selectedSpiritId) return;
    const result = breakthroughSpirit(selectedSpiritId);
    if (result.success) {
      toast.success('大境界突破成功！');
    } else {
      toast.error(result.reason || '突破失败');
    }
  };

  const toggleActive = (spiritId: string) => {
    const isActive = activeSpiritIds.includes(spiritId);
    if (isActive) {
      setActiveSpirits(activeSpiritIds.filter((id) => id !== spiritId));
    } else {
      if (activeSpiritIds.length >= 4) {
        toast.error('最多上阵4个魂灵');
        return;
      }
      setActiveSpirits([...activeSpiritIds, spiritId]);
    }
  };

  return (
    <div className="h-full flex flex-col">
       <div className="flex border-b border-amber-700/30 mb-3">
         {[
            { k: 'contracted', label: `已契约 (${soulSpirits.length}/${maxSlots})` },
            { k: 'pending', label: `待选择 (${pendingSpirits.length})` },
            { k: 'active', label: `上阵 (${activeSpiritIds.length}/4)` },
            ...(specialSpirits.length > 0 ? [{ k: 'special', label: `特殊魂灵 (${specialSpirits.length})` }] : []),
         ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as Tab)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === t.k ? 'text-amber-300 border-b-2 border-amber-400' : 'text-amber-100/50 hover:text-amber-100/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

       <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-3">
         <AnimatePresence mode="wait">
           {tab === 'contracted' && (
             <motion.div
               key="contracted"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
               {soulSpirits.length === 0 ? (
                 <div className="text-center py-12 text-amber-100/40 text-sm">
                   <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-40" />
                   <p>尚未契约任何魂灵</p>
                   <p className="mt-1 text-xs">前往传灵塔击败魂兽，获取魂灵契约机会</p>
                 </div>
               ) : (
                 soulSpirits.map((spirit) => {
                  const tpl = SOUL_SPIRIT_POOL.find((s) => s.id === spirit.spiritId);
                  const colors = SPIRIT_ELEMENT_COLORS[spirit.attribute] || SPIRIT_ELEMENT_COLORS['金'];
                  const stats = tpl ? getSpiritStats(tpl, spirit.majorIndex, spirit.minor, spirit.evolutionStage) : null;
                  const isActive = activeSpiritIds.includes(spirit.spiritId);
                  return (
                    <motion.div
                      key={spirit.spiritId}
                      layout
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedSpiritId(spirit.spiritId)}
                      className={`relative rounded-xl border p-3 cursor-pointer transition-all ${
                        selectedSpiritId === spirit.spiritId
                          ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/20'
                          : `${colors.border}/30 border bg-slate-900/40 hover:bg-slate-800/50`
                      } ${isActive ? 'ring-2 ring-emerald-400/60' : ''}`}
                    >
                      {isActive && (
                        <Badge className="absolute top-2 right-2 bg-emerald-500/80 text-xs">已上阵</Badge>
                      )}
                      <div className="flex items-center gap-3">
                        <SoulSpiritAvatar iconChar={spirit.iconChar} attribute={spirit.attribute} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-100 truncate">{spirit.name}</span>
                            <Badge variant="outline" className={`${colors.border} ${colors.text} text-xs shrink-0`}>
                              {spirit.attribute}
                            </Badge>
                          </div>
                          <div className={`text-sm ${colors.text} mt-0.5`}>
                            {getSpiritRealmName(spirit.majorIndex, spirit.minor)}
                          </div>
                          {stats && (
                            <div className="flex gap-3 text-xs text-amber-100/60 mt-1">
                              <span>攻 {formatNumber(stats.attack)}</span>
                              <span>防 {formatNumber(stats.defense)}</span>
                              <span>血 {formatNumber(stats.hp)}</span>
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-amber-100/40 shrink-0" />
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

           {tab === 'pending' && (
             <motion.div
               key="pending"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-200/80 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>魂灵存在时限为7分钟，超时将自动消失。请尽快选择契约！</span>
              </div>
              {pendingSpirits.length === 0 ? (
                <div className="text-center py-12 text-amber-100/40 text-sm">
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p>暂无待选择的魂灵</p>
                  <p className="mt-1 text-xs">前往传灵塔击败魂兽获取</p>
                </div>
              ) : (
                  pendingSpirits.map((sp) => {
                  const colors = SPIRIT_ELEMENT_COLORS[sp.attribute] || SPIRIT_ELEMENT_COLORS['金'];
                  const remaining = Math.max(0, sp.expiresAt - Date.now());
                  const mins = Math.floor(remaining / 60000);
                  const secs = Math.floor((remaining % 60000) / 1000);
                  const totalSeconds = 7 * 60;
                  const elapsed = totalSeconds - Math.floor(remaining / 1000);
                  const pct = Math.max(0, Math.min(100, (elapsed / totalSeconds) * 100));
                  return (
                    <motion.div
                      key={sp.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`rounded-xl border ${colors.border}/40 bg-slate-900/50 p-3`}
                    >
                      <div className="flex items-center gap-3">
                        <SoulSpiritAvatar iconChar={sp.iconChar} attribute={sp.attribute} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-100 truncate">{sp.name}</span>
                            <Badge variant="outline" className={`${colors.border} ${colors.text} text-xs shrink-0`}>
                              {sp.attribute}
                            </Badge>
                          </div>
                          <div className="text-xs text-amber-100/60 mt-0.5 line-clamp-1">{sp.feature}</div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-amber-100/70 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />剩余 {mins}:{secs.toString().padStart(2, '0')}</span>
                        </div>
                        <Progress value={pct} className="h-1 [&>[data-slot=progress-indicator]]:bg-amber-400" />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="secondary" className="flex-1" onClick={() => handleContract(sp.id)}>
                          契约
                        </Button>
                        <Button size="sm" variant="ghost" className="text-amber-100/60" onClick={() => discardPendingSpirit(sp.id)}>
                          放弃
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

           {tab === 'active' && (
             <motion.div
               key="active"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-lg text-xs text-sky-200/80">
                点击下方魂灵切换上阵状态，最多上阵4个。战斗中魂灵会协助攻击。
              </div>
               {soulSpirits.length === 0 ? (
                 <div className="text-center py-12 text-amber-100/40 text-sm">
                   <Swords className="w-10 h-10 mx-auto mb-2 opacity-40" />
                   <p>尚未契约魂灵</p>
                 </div>
               ) : (
                 soulSpirits.map((spirit) => {
                   const isActive = activeSpiritIds.includes(spirit.spiritId);
                  const colors = SPIRIT_ELEMENT_COLORS[spirit.attribute] || SPIRIT_ELEMENT_COLORS['金'];
                  return (
                    <motion.div
                      key={spirit.spiritId}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleActive(spirit.spiritId)}
                      className={`rounded-xl border p-3 cursor-pointer transition-all ${
                        isActive
                          ? 'border-emerald-400 bg-emerald-500/10'
                          : `${colors.border}/30 bg-slate-900/40 hover:bg-slate-800/50`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <SoulSpiritAvatar iconChar={spirit.iconChar} attribute={spirit.attribute} size="sm" animate={isActive} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-amber-100 text-sm">{spirit.name}</div>
                          <div className={`text-xs ${colors.text}`}>
                            {getSpiritRealmName(spirit.majorIndex, spirit.minor)}
                          </div>
                        </div>
                        <Badge className={isActive ? 'bg-emerald-500' : 'bg-slate-700'}>
                          {isActive ? '已上阵' : '未上阵'}
                        </Badge>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

           {/* 🔴 特殊魂灵 Tab（三茶转化等） */}
           {tab === 'special' && (
             <motion.div
               key="special"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="grid grid-cols-1 md:grid-cols-2 gap-3"
             >
               <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-200/80">
                 特殊魂灵不占用普通魂灵上阵上限，战斗中同样会协助攻击。
               </div>
               {specialSpirits.map((sp) => {
                 const isActive = specialActiveIds.includes(sp.spiritId);
                 return (
                   <motion.div
                     key={sp.spiritId}
                     whileTap={{ scale: 0.98 }}
                     onClick={() => handleToggleSpecialActive(sp.spiritId)}
                     className={`rounded-xl border p-3 cursor-pointer transition-all ${
                       isActive
                         ? 'border-amber-400 bg-amber-500/10'
                         : 'border-amber-600/40 bg-slate-900/40 hover:bg-slate-800/50'
                     }`}
                   >
                     <div className="flex items-center gap-3">
                       <SoulSpiritAvatar iconChar={sp.iconChar} attribute={sp.attribute} size="sm" animate={isActive} />
                       <div className="flex-1 min-w-0">
                         <div className="font-medium text-amber-100 text-sm">{sp.name}</div>
                         <div className="text-xs text-amber-300/80">特殊 · 不可升级</div>
                       </div>
                       <Badge className={isActive ? 'bg-amber-500' : 'bg-slate-700'}>
                         {isActive ? '已上阵' : '未上阵'}
                       </Badge>
                     </div>
                     <div className="mt-2 pt-2 border-t border-amber-700/20 space-y-1 text-[10px] text-amber-200/70">
                       <div className="flex justify-between">
                         <span>攻击</span><span className="text-amber-200">{formatNumber(sp.attack)}</span>
                       </div>
                       <div className="flex justify-between">
                         <span>气血</span><span className="text-amber-200">{formatNumber(sp.hp)}</span>
                       </div>
                       <div className="pt-1">
                         <span className="text-amber-300">技能 · {sp.skillName}</span>
                         <span className="text-amber-200/60 ml-1">（{sp.skillDesc}）</span>
                       </div>
                     </div>
                   </motion.div>
                 );
               })}
             </motion.div>
           )}
         </AnimatePresence>
       </div>

      {/* 右侧详情面板 - 小屏底部弹出，大屏右侧 */}
      <AnimatePresence>
        {selectedSpirit && template && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-3 border-t border-amber-700/30 pt-3"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-amber-200 text-sm flex items-center gap-2">
                <ArrowLeft className="w-4 h-4 cursor-pointer" onClick={() => setSelectedSpiritId(null)} />
                魂灵详情
              </h3>
            </div>
            <Card className="bg-slate-900/60 border-amber-700/30">
              <div className="p-3 space-y-3">
                <div className="flex items-center gap-3">
                  <SoulSpiritAvatar iconChar={selectedSpirit.iconChar} attribute={selectedSpirit.attribute} size="lg" />
                  <div className="flex-1">
                    <div className="font-bold text-amber-100">{selectedSpirit.name}</div>
                    <div className="text-xs text-amber-200/70">{template.description}</div>
                    <div className="text-xs text-amber-300/90 mt-1">{getSpiritRealmName(selectedSpirit.majorIndex, selectedSpirit.minor)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <div className="text-rose-400 font-bold">{formatNumber(getSpiritStats(template, selectedSpirit.majorIndex, selectedSpirit.minor, selectedSpirit.evolutionStage).attack)}</div>
                    <div className="text-amber-100/50">攻击</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <div className="text-sky-400 font-bold">{formatNumber(getSpiritStats(template, selectedSpirit.majorIndex, selectedSpirit.minor, selectedSpirit.evolutionStage).defense)}</div>
                    <div className="text-amber-100/50">防御</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <div className="text-emerald-400 font-bold">{formatNumber(getSpiritStats(template, selectedSpirit.majorIndex, selectedSpirit.minor, selectedSpirit.evolutionStage).hp)}</div>
                    <div className="text-amber-100/50">气血</div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-100/70">小境界进度</span>
                    <span className="text-amber-300">{selectedSpirit.minor}/9 重</span>
                  </div>
                  <Progress value={(selectedSpirit.minor / 9) * 100} className="[&>[data-slot=progress-indicator]]:bg-amber-400" />
                </div>

                <div className="flex gap-2">
                  {selectedSpirit.minor < 9 ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      onClick={handleUpgrade}
                      disabled={player.soulCoins < calcSpiritUpgradeCost(selectedSpirit.majorIndex, selectedSpirit.minor)}
                    >
                      <TrendingUp className="w-4 h-4 mr-1" />
                      升级 ({formatNumber(calcSpiritUpgradeCost(selectedSpirit.majorIndex, selectedSpirit.minor))}金)
                    </Button>
                  ) : selectedSpirit.majorIndex < SPIRIT_MAJOR_REALMS.length - 1 ? (
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
                      onClick={handleBreakthrough}
                      disabled={player.soulCoins < calcSpiritBreakthroughCost(selectedSpirit.majorIndex)}
                    >
                      <Zap className="w-4 h-4 mr-1" />
                      突破 {SPIRIT_MAJOR_REALMS[selectedSpirit.majorIndex + 1]} ({formatNumber(calcSpiritBreakthroughCost(selectedSpirit.majorIndex))}金)
                    </Button>
                  ) : (
                    <Badge className="w-full justify-center py-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-900">已达神级</Badge>
                  )}
                </div>
                <p className="text-[10px] text-amber-100/40 text-center">
                   选择后不可更改 · 每重升级消耗递增15%
                 </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
