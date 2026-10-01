import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, ArrowLeft, Sparkles, Gift, UserPlus, Crown, Flame, Droplets, Star, BookOpen, HeartCrack, ChevronRight, Swords } from 'lucide-react';
import { useGame } from '@/lib/gameStore';
import { FIERCE_BEASTS_STAR_LAKE, FIERCE_BEASTS_FROZEN, type FierceBeast } from '@/data/fierceBeasts';
import { TEA_CITY_CHARACTERS, type TeaCityCharacter } from '@/data/teaCity';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const ALL_BEASTS: FierceBeast[] = [...FIERCE_BEASTS_STAR_LAKE, ...FIERCE_BEASTS_FROZEN];

interface CompanionsPanelProps {
  onBack: () => void;
}

export default function CompanionsPanel({ onBack }: CompanionsPanelProps) {
  const { player, giftCompanion, helpTransformCompanion, becomeLover, becomeSpouse, dualCultivate, mateCompanion, divorceCompanion, forgetCompanion } = useGame();
  const [selectedBeastId, setSelectedBeastId] = useState<string | null>(null);
  const [showGift, setShowGift] = useState(false);
  const [giftTab, setGiftTab] = useState<'soulBone' | 'soulGuideMaterial' | 'immortalGrass' | 'spiritGrass'>('soulBone');
  const [tick, setTick] = useState(0);

   const acceptedBeasts = useMemo(() => {
      if (!player || !player.companions || !Array.isArray(player.companions.accepted) || !player.companions.details) return [];
      const list = ALL_BEASTS.filter(b => {
        if (!player.companions.accepted.includes(b.id)) return false;
        const d = player.companions.details[b.id];
        return !d?.forgotten;
      });
      // 排序：夫妻置顶 → 好感度降序 → 结为情侣时间升序（先达到的排前面）→ accepted数组顺序兜底
      return list.sort((a, b) => {
        const da = player.companions.details[a.id];
        const db = player.companions.details[b.id];
        const favA = da?.favorability ?? 0;
        const favB = db?.favorability ?? 0;
        // 夫妻（isSpouse）置顶
        if ((da?.isSpouse ? 1 : 0) !== (db?.isSpouse ? 1 : 0)) {
          return (db?.isSpouse ? 1 : 0) - (da?.isSpouse ? 1 : 0);
        }
        // 好感度降序
        if (favA !== favB) return favB - favA;
        // 结为情侣时间升序（先达到的排前面）
        const tA = da?.becameLoverAt ?? 0;
        const tB = db?.becameLoverAt ?? 0;
        if (tA !== tB) return tA - tB;
        // 兜底：按 accepted 数组出现顺序
        const idxA = player.companions.accepted.indexOf(a.id);
        const idxB = player.companions.accepted.indexOf(b.id);
        return idxA - idxB;
      });
    }, [player]);

    const acceptedHumans = useMemo(() => {
       if (!player || !player.companions || !Array.isArray(player.companions.accepted) || !player.companions.details) return [];
       const list = TEA_CITY_CHARACTERS.filter(c => {
          if (!player.companions.accepted.includes(c.id)) return false;
          const d = player.companions.details?.[c.id];
          return !d?.forgotten;
        });
        return list.sort((a, b) => {
          const da = player.companions.details?.[a.id];
          const db = player.companions.details?.[b.id];
         const favA = da?.favorability ?? 0;
         const favB = db?.favorability ?? 0;
         if ((da?.isSpouse ? 1 : 0) !== (db?.isSpouse ? 1 : 0)) {
           return (db?.isSpouse ? 1 : 0) - (da?.isSpouse ? 1 : 0);
         }
         if (favA !== favB) return favB - favA;
         const tA = da?.becameLoverAt ?? 0;
         const tB = db?.becameLoverAt ?? 0;
         if (tA !== tB) return tA - tB;
         const idxA = player.companions.accepted.indexOf(a.id);
         const idxB = player.companions.accepted.indexOf(b.id);
         return idxA - idxB;
       });
     }, [player]);

     // 🔴 特殊存在：无好感度、无情侣/夫妻，只有切磋+遗忘，单独分类放在最上面
     const specialBeings = useMemo(() => {
       return acceptedHumans.filter(c => !!c.isSpecialBeing);
     }, [acceptedHumans]);

     // 普通魂师知己：排除特殊存在后的茶城角色
     const normalHumanCompanions = useMemo(() => {
       return acceptedHumans.filter(c => !c.isSpecialBeing);
     }, [acceptedHumans]);

   const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

   const selectedCharacter = useMemo(() => {
     if (!selectedCharacterId) return null;
     return TEA_CITY_CHARACTERS.find(c => c.id === selectedCharacterId) || null;
   }, [selectedCharacterId]);

   const selectedCharacterDetail = useMemo(() => {
     if (!selectedCharacterId || !player || !player.companions?.details) return null;
     return player.companions.details[selectedCharacterId] || null;
   }, [selectedCharacterId, player]);

  const selectedBeast = useMemo(() => {
    if (!selectedBeastId) return null;
    return ALL_BEASTS.find(b => b.id === selectedBeastId) || null;
  }, [selectedBeastId]);

  const selectedDetail = useMemo(() => {
    if (!selectedBeastId || !player || !player.companions?.details) return null;
    return player.companions.details[selectedBeastId] || null;
  }, [selectedBeastId, player]);

  if (selectedBeast && selectedDetail) {
    return (
      <>
      <CompanionDetail
        beast={selectedBeast}
        detail={selectedDetail}
        onBack={() => setSelectedBeastId(null)}
        onOpenGift={() => setShowGift(true)}
        onTransform={() => {
          const r = helpTransformCompanion(selectedBeast.id);
          if (r.success) toast.success(`帮助${selectedBeast.name}化形成功！`);
          else toast.error(r.reason || '化形失败');
        }}
         onBecomeLover={() => {
           const r = becomeLover(selectedBeast.id);
           if (r.success) {
             toast.success(`已与${selectedBeast.name}结为情侣`);
           } else {
             toast.error(r.reason || '操作失败');
           }
         }}
         onBecomeSpouse={() => {
           const r = becomeSpouse(selectedBeast.id);
           if (r.success) toast.success(`恭喜与${selectedBeast.name}结为夫妻！`);
           else toast.error(r.reason || '操作失败');
         }}
         onDivorce={() => {
           if (!confirm(`确定要与${selectedBeast.name}离婚吗？\n\n离婚惩罚：\n· 全属性永久减少 5%（多次离婚加法累加）\n· 好感度大幅下降\n· 解除夫妻与情侣关系\n· 夫妻加成与情侣加成都将消失\n\n此操作无法撤销，请谨慎选择！`)) return;
           const r = divorceCompanion(selectedBeast.id);
           if (r.success) {
             toast.success(`已与${selectedBeast.name}离婚，全属性-5%`);
           } else {
             toast.error(r.reason || '离婚失败');
           }
         }}
         onForget={() => {
            if (!confirm(`确定要遗忘 ${selectedBeast.name} 吗？\n\n· 该角色将从伴侣列表中移除\n· 好感度与数据保留，下次再遇仍会继承\n· 遗忘后自动解除情侣关系\n\n好感度达到150将无法遗忘。`)) return;
            const r = forgetCompanion(selectedBeast.id);
            if (r.success) {
              toast.success(`已遗忘 ${selectedBeast.name}`);
              setSelectedBeastId(null);
            } else {
              toast.error(r.reason || '操作失败');
            }
          }}
         onDualCultivate={() => {
           const r = dualCultivate(selectedBeast.id);
           if (r.success) toast.success(`双修圆满！获得${r.expGained?.toLocaleString()}修为`);
           else toast.error(r.reason || '操作失败');
         }}
        onMate={() => {
          const r = mateCompanion(selectedBeast.id);
          if (r.success) toast.success('交融圆满，获得一颗结晶');
          else toast.error(r.reason || '操作失败');
        }}
        showGift={showGift}
        onCloseGift={() => setShowGift(false)}
        giftTab={giftTab}
        setGiftTab={setGiftTab}
         tick={tick}
         setTick={() => setTick(t => t + 1)}
       />
        </>
      );
    }

    // === 人类伴侣详情 ===
   if (selectedCharacter && selectedCharacterDetail) {
     return (
       <>
       <HumanCompanionDetail
        character={selectedCharacter}
        detail={selectedCharacterDetail}
        onBack={() => setSelectedCharacterId(null)}
        onOpenGift={() => setShowGift(true)}
          onBecomeLover={() => {
            const r = becomeLover(selectedCharacter.id);
            if (r.success) {
              toast.success(`已与${selectedCharacter.name}结为情侣`);
            } else {
              toast.error(r.reason || '操作失败');
            }
          }}
        onBecomeSpouse={() => {
          const r = becomeSpouse(selectedCharacter.id);
          if (r.success) toast.success(`恭喜与${selectedCharacter.name}结为夫妻！`);
          else toast.error(r.reason || '操作失败');
        }}
        onDivorce={() => {
         if (!confirm(`确定要与${selectedCharacter.name}离婚吗？\n\n离婚惩罚：\n· 全属性永久减少 5%（多次离婚加法累加）\n· 好感度大幅下降\n· 解除夫妻与情侣关系\n· 夫妻加成与情侣加成都将消失\n\n此操作无法撤销，请谨慎选择！`)) return;
           const r = divorceCompanion(selectedCharacter.id);
           if (r.success) {
             toast.success(`已与${selectedCharacter.name}离婚，全属性-5%`);
          } else {
            toast.error(r.reason || '离婚失败');
          }
        }}
         onDualCultivate={() => {
           const r = dualCultivate(selectedCharacter.id);
           if (r.success) toast.success(`双修圆满！获得${r.expGained?.toLocaleString()}修为`);
           else toast.error(r.reason || '操作失败');
         }}
         onForget={() => {
           if (!confirm(`确定要遗忘 ${selectedCharacter.name} 吗？\n\n· 该角色将从伴侣列表中移除\n· 好感度与数据保留，下次再遇仍会继承\n· 遗忘后自动解除情侣关系\n\n好感度达到150将无法遗忘。`)) return;
           const r = forgetCompanion(selectedCharacter.id);
           if (r.success) {
             toast.success(`已遗忘 ${selectedCharacter.name}`);
             setSelectedCharacterId(null);
           } else {
             toast.error(r.reason || '操作失败');
           }
         }}
        onMate={() => {
          const r = mateCompanion(selectedCharacter.id);
          if (r.success) toast.success('交融圆满，获得一颗结晶');
          else toast.error(r.reason || '操作失败');
        }}
        showGift={showGift}
        onCloseGift={() => setShowGift(false)}
        giftTab={giftTab}
        setGiftTab={setGiftTab}
         tick={tick}
         setTick={() => setTick(t => t + 1)}
       />
        </>
      );
    }

    return (
     <div className="space-y-4 md:space-y-6">
      {/* 顶部返回 */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-lg border border-border/50 bg-card/40 flex items-center justify-center text-foreground hover:bg-card/70 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
         <div>
           <h2 className="text-lg md:text-xl font-bold">侣</h2>
           <p className="text-xs text-muted-foreground">与凶兽结缘，共赴修行之路</p>
         </div>
      </div>

      {/* 状态说明 */}
       <div className="p-3 md:p-4 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-900/20 to-purple-900/10">
         <div className="flex items-center gap-2 text-amber-300 text-xs">
           <Heart className="w-4 h-4" />
           <span>已结缘 {acceptedBeasts.length + acceptedHumans.length} 位</span>
           {player?.companions?.weaknessUntil && player.companions?.weaknessUntil > Date.now() && (
             <span className="ml-auto text-red-400">⚠ 虚弱状态</span>
           )}
         </div>
       </div>

       {acceptedBeasts.length === 0 && acceptedHumans.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">💫</div>
            <div className="text-sm text-foreground mb-1">尚未获得任何伴侣的青睐</div>
            <div className="text-xs text-muted-foreground">
              在生命之湖或极寒冰域击败凶兽，或在茶城漫步邂逅名士
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* 凶兽伴侣 */}
            {acceptedBeasts.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-cyan-300 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>凶兽伴侣</span>
                  <span className="text-xs text-muted-foreground">{acceptedBeasts.length} 位</span>
                </div>
                <div className="space-y-2">
                  {acceptedBeasts.map((beast, i) => {
                    const detail = player?.companions?.details?.[beast.id];
                    return (
                      <motion.button
                        key={beast.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.04 }}
                        onClick={() => setSelectedBeastId(beast.id)}
                        whileHover={{ scale: 1.01 }}
                        className={`relative w-full rounded-xl border p-3 cursor-pointer transition-all text-left text-foreground ${selectedBeastId === beast.id
                          ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/20'
                          : 'border-cyan-500/30 bg-slate-900/40 hover:bg-slate-800/50'
                        }`}
                      >
                        {detail?.isSpouse && (
                          <Badge className="absolute top-2 right-8 bg-amber-500/80 text-xs">夫妻</Badge>
                        )}
                        {detail?.isLover && !detail?.isSpouse && (
                          <Badge className="absolute top-2 right-8 bg-pink-500/80 text-xs">情侣</Badge>
                        )}
                        <div className="flex items-center gap-3">
                          <BeastAvatar beast={beast} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                               <span className="font-bold text-amber-100 truncate">{beast.name}</span>
                              <Badge variant="outline" className="border-cyan-500/50 text-cyan-300 text-xs shrink-0">
                                {beast.element}
                              </Badge>
                            </div>
                            <div className="text-sm text-cyan-300/90 mt-0.5">
                              {detail ? `好感度 ${detail.favorability}/150` : beast.title}
                            </div>
                            {detail && (
                              <div className="text-xs text-amber-100/60 mt-1">
                                {detail.transformed ? '已化形成人' : beast.title}
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-amber-100/40 shrink-0" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

             {/* 特殊存在：混沌茶等无好感度系统的特殊角色，单独分类放在最上面 */}
             {specialBeings.length > 0 && (
               <div>
                 <div className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
                   <Sparkles className="w-4 h-4" />
                   <span>特殊存在</span>
                   <span className="text-xs text-muted-foreground">{specialBeings.length} 位</span>
                 </div>
                 <div className="space-y-2">
                   {specialBeings.map((ch, i) => {
                     const detail = player?.companions?.details?.[ch.id];
                     return (
                       <motion.button
                         key={ch.id}
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ duration: 0.25, delay: i * 0.04 }}
                         onClick={() => setSelectedCharacterId(ch.id)}
                         whileHover={{ scale: 1.01 }}
                         className={`relative w-full rounded-xl border p-3 cursor-pointer transition-all text-left text-foreground ${selectedCharacterId === ch.id
                           ? 'border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/20'
                           : 'border-purple-500/30 bg-slate-900/40 hover:bg-slate-800/50'
                         }`}
                       >
                         <Badge className="absolute top-2 right-2 bg-purple-600/80 text-xs">特殊存在</Badge>
                         <div className="flex items-center gap-3">
                           <HumanAvatar character={ch} size="sm" />
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2">
                               <span className="font-bold text-amber-100 truncate">{ch.name}</span>
                               <Badge variant="outline" className="border-purple-500/50 text-purple-300 text-xs shrink-0">
                                 {ch.gender}
                               </Badge>
                             </div>
                             <div className="text-sm text-purple-300/90 mt-0.5">
                               {ch.title}
                             </div>
                             <div className="text-xs text-amber-100/60 mt-1">
                               武魂：{ch.martialSoul}
                             </div>
                           </div>
                           <ChevronRight className="w-5 h-5 text-amber-100/40 shrink-0" />
                         </div>
                       </motion.button>
                     );
                   })}
                 </div>
               </div>
             )}

             {/* 人类伴侣 */}
             {normalHumanCompanions.length > 0 && (
               <div>
                 <div className="text-sm font-semibold text-amber-300 mb-3 flex items-center gap-2">
                   <Star className="w-4 h-4" />
                   <span>魂师知己</span>
                   <span className="text-xs text-muted-foreground">{normalHumanCompanions.length} 位</span>
                 </div>
                 <div className="space-y-2">
                   {normalHumanCompanions.map((ch, i) => {
                    const detail = player?.companions?.details?.[ch.id];
                    return (
                      <motion.button
                        key={ch.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.04 }}
                        onClick={() => setSelectedCharacterId(ch.id)}
                        whileHover={{ scale: 1.01 }}
                        className={`relative w-full rounded-xl border p-3 cursor-pointer transition-all text-left text-foreground ${selectedCharacterId === ch.id
                          ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/20'
                          : 'border-amber-500/30 bg-slate-900/40 hover:bg-slate-800/50'
                        }`}
                      >
                        {detail?.isSpouse && (
                          <Badge className="absolute top-2 right-8 bg-amber-500/80 text-xs">夫妻</Badge>
                        )}
                        {detail?.isLover && !detail?.isSpouse && (
                          <Badge className="absolute top-2 right-8 bg-pink-500/80 text-xs">情侣</Badge>
                        )}
                        {ch.favorMechanism === 'challenge' && (
                          <Badge className="absolute top-2 right-20 bg-purple-600/80 text-xs">可挑战</Badge>
                        )}
                        <div className="flex items-center gap-3">
                          <HumanAvatar character={ch} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-amber-100 truncate">{ch.name}</span>
                              <Badge variant="outline" className="border-amber-500/50 text-amber-300 text-xs shrink-0">
                                {ch.gender}
                              </Badge>
                            </div>
                            <div className="text-sm text-amber-300/90 mt-0.5">
                              {detail ? `好感度 ${detail.favorability}/150` : ch.title}
                            </div>
                            {detail && (
                              <div className="text-xs text-amber-100/60 mt-1">
                                {ch.title}
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-amber-100/40 shrink-0" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}
            </div>
          )}

      </div>
    );
 }

// ======================= 凶兽头像 =======================
// 参考天梦冰蚕魂环风格：多层渐变圆环 + 内发光 + 特色图标字
function BeastAvatar({ beast, size = 'md' }: { beast: FierceBeast; size?: 'sm' | 'md' | 'lg' }) {
  const rawEl = beast.element || '';

  // 属性 → 主色 / 辅色 / 光晕色（HSL，适配深色背景）
  const getPalette = (el: string): { main: string; secondary: string; glow: string; ring: string; text: string } => {
    if (el.includes('冰') || el.includes('水')) {
      return { main: '#67e8f9', secondary: '#3b82f6', glow: 'rgba(103,232,249,0.45)', ring: '#22d3ee', text: '#ecfeff' };
    }
    if (el.includes('火')) {
      return { main: '#fb923c', secondary: '#ef4444', glow: 'rgba(251,146,60,0.45)', ring: '#f97316', text: '#fff7ed' };
    }
    if (el.includes('暗') || el.includes('黑暗') || el.includes('亡灵')) {
      return { main: '#c084fc', secondary: '#6366f1', glow: 'rgba(192,132,252,0.45)', ring: '#a855f7', text: '#faf5ff' };
    }
    if (el.includes('精神')) {
      return { main: '#f0abfc', secondary: '#a855f7', glow: 'rgba(240,171,252,0.45)', ring: '#e879f9', text: '#fdf4ff' };
    }
    if (el.includes('生命') || el.includes('木') || el.includes('毒') || el.includes('翡翠')) {
      return { main: '#4ade80', secondary: '#10b981', glow: 'rgba(74,222,128,0.45)', ring: '#22c55e', text: '#f0fdf4' };
    }
    if (el.includes('力量') || el.includes('金')) {
      return { main: '#fbbf24', secondary: '#d97706', glow: 'rgba(251,191,36,0.45)', ring: '#f59e0b', text: '#fffbeb' };
    }
    if (el.includes('雷')) {
      return { main: '#facc15', secondary: '#eab308', glow: 'rgba(250,204,21,0.5)', ring: '#eab308', text: '#fefce8' };
    }
    if (el.includes('空间')) {
      return { main: '#818cf8', secondary: '#6366f1', glow: 'rgba(129,140,248,0.45)', ring: '#818cf8', text: '#eef2ff' };
    }
    if (el.includes('时间')) {
      return { main: '#fda4af', secondary: '#f43f5e', glow: 'rgba(253,164,175,0.45)', ring: '#fb7185', text: '#fff1f2' };
    }
    return { main: '#fbbf24', secondary: '#a855f7', glow: 'rgba(251,191,36,0.45)', ring: '#f59e0b', text: '#fffbeb' };
  };

  const palette = getPalette(rawEl);

  // 尺寸映射
  const sizeMap = {
    sm: { outer: 'w-12 h-12', inner: 'w-10 h-10', icon: 'text-base', ring: 'w-14 h-14' },
    md: { outer: 'w-16 h-16 md:w-18 md:h-18', inner: 'w-[3.25rem] h-[3.25rem] md:w-[3.75rem] md:h-[3.75rem]', icon: 'text-xl md:text-2xl', ring: 'w-[4.25rem] h-[4.25rem] md:w-[4.75rem] md:h-[4.75rem]' },
    lg: { outer: 'w-20 h-20 md:w-24 md:h-24', inner: 'w-[4.5rem] h-[4.5rem] md:w-[5.5rem] md:h-[5.5rem]', icon: 'text-2xl md:text-3xl', ring: 'w-[5.5rem] h-[5.5rem] md:w-[6.5rem] md:h-[6.5rem]' },
  };
  const s = sizeMap[size];

  return (
    <div className={`relative ${s.outer} flex items-center justify-center`}>
      {/* 外层魂环光晕 */}
      <div
        className={`absolute ${s.ring} rounded-full blur-md opacity-60`}
        style={{ background: `radial-gradient(circle, ${palette.glow} 0%, transparent 70%)` }}
      />
      {/* 外层魂环圆环 */}
      <div
        className={`absolute ${s.outer} rounded-full border-2`}
        style={{
          borderColor: palette.ring,
          boxShadow: `0 0 12px ${palette.glow}, inset 0 0 8px ${palette.glow}`,
        }}
      />
      {/* 内层渐变圆（图标背景） */}
      <div
        className={`relative ${s.inner} rounded-full flex items-center justify-center font-black ${s.icon}`}
        style={{
          background: `radial-gradient(circle at 30% 30%, ${palette.main}30 0%, ${palette.secondary}40 50%, ${palette.secondary}20 100%)`,
          color: palette.text,
          textShadow: `0 0 8px ${palette.main}, 0 0 16px ${palette.glow}`,
          boxShadow: `inset 0 0 16px ${palette.glow}, 0 0 12px ${palette.glow}`,
          border: `1px solid ${palette.main}60`,
          fontFamily: "'Noto Serif SC', serif",
        }}
      >
        {beast.iconChar}
        {/* 内圈细光环 */}
        <div
          className="absolute inset-1 rounded-full pointer-events-none"
          style={{ border: `1px solid ${palette.main}30` }}
        />
      </div>
    </div>
  );
}

// ======================= 凶兽详情 =======================
interface DetailProps {
  beast: FierceBeast;
  detail: {
    favorability: number;
    transformed: boolean;
    isLover: boolean;
    isSpouse: boolean;
    crystals: number;
    lastDualCultivateAt: number;
    lastMatingAt: number;
    forgotten?: boolean;
  };
  onBack: () => void;
  onOpenGift: () => void;
  onTransform: () => void;
  onBecomeLover: () => void;
   onBecomeSpouse: () => void;
   onDivorce: () => void;
   onForget: () => void;
   onDualCultivate: () => void;
   onMate: () => void;
   showGift: boolean;
   onCloseGift: () => void;
   giftTab: 'soulBone' | 'soulGuideMaterial' | 'immortalGrass' | 'spiritGrass';
   setGiftTab: (tab: 'soulBone' | 'soulGuideMaterial' | 'immortalGrass' | 'spiritGrass') => void;
   tick: number;
   setTick: () => void;
 }
 
 function CompanionDetail({
   beast, detail, onBack, onOpenGift, onTransform,
   onBecomeLover, onBecomeSpouse, onDivorce, onForget, onDualCultivate, onMate,
   showGift, onCloseGift, giftTab, setGiftTab, tick, setTick,
 }: DetailProps) {
  const { player } = useGame();

  // 计算冷却剩余
  const now = Date.now() + tick;
  const dualCooldown = 5 * 60 * 1000;
  const mateCooldown = 10 * 60 * 1000;
  const dualRemain = Math.max(0, dualCooldown - (now - detail.lastDualCultivateAt));
  const mateRemain = Math.max(0, mateCooldown - (now - detail.lastMatingAt));

  const human = beast.humanForm;
  const displayName = detail.transformed ? `${beast.name}（已化形成人）` : beast.name;

  // 可赠送物品：魂骨 / 魂导器材料 / 仙草 / 灵草
  const giftableItems = useMemo(() => {
    if (!player) return { soulBones: [], soulGuideMaterials: [], immortalGrass: [], spiritGrass: [] };
    const soulBones = player.inventory.filter(item =>
      item.type === 'soulBone'
    );
    const soulGuideMaterials = player.inventory.filter(item =>
      item.type === 'material' && item.materialTier != null
    );
    const immortalGrass = player.inventory.filter(item =>
      item.type === 'consumable' && item.effect?.startsWith('immortal:')
    );
    const spiritGrass = player.inventory.filter(item =>
      item.type === 'consumable' &&
      (item.effect?.startsWith('element-spirit:') ||
        item.effect?.startsWith('attribute-spirit:') ||
        item.effect?.startsWith('ice-fire-immortal:') ||
        item.effect?.startsWith('holy-grass:') ||
        item.effect?.startsWith('water-of-life:') ||
        item.effect?.startsWith('polar-ice-jade:'))
    );
    return { soulBones, soulGuideMaterials, immortalGrass, spiritGrass };
  }, [player]);

  return (
    <div className="space-y-4">
      {/* 顶部返回 */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-lg border border-border/50 bg-card/40 flex items-center justify-center text-foreground hover:bg-card/70 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg md:text-xl font-bold">{displayName}</h2>
          <p className="text-xs text-muted-foreground">{beast.title} · {beast.element}</p>
        </div>
        {detail.isSpouse && <Crown className="ml-auto w-5 h-5 text-amber-400" />}
      </div>

      {/* 头像+好感度 */}
      <div className="p-4 md:p-5 rounded-xl border border-border/50 bg-gradient-to-br from-card/60 to-card/30">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <BeastAvatar beast={beast} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-bold text-foreground">好感度</span>
              <span className="ml-auto text-sm text-amber-300 font-bold">{detail.favorability}/150</span>
            </div>
            <div className="h-2.5 bg-muted/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 via-amber-400 to-amber-300 transition-all duration-500"
                style={{ width: `${(detail.favorability / 150) * 100}%` }}
              />
            </div>
             <div className="flex gap-2 mt-2 text-[10px]">
               <span className={`px-1.5 py-0.5 rounded ${detail.favorability >= 50 ? 'bg-cyan-900/50 text-cyan-300' : 'bg-muted/40 text-muted-foreground'}`}>50 化形</span>
               <span className={`px-1.5 py-0.5 rounded ${detail.favorability >= 100 ? 'bg-pink-900/50 text-pink-300' : 'bg-muted/40 text-muted-foreground'}`}>100 情侣</span>
               <span className={`px-1.5 py-0.5 rounded ${detail.favorability >= 150 ? 'bg-amber-900/50 text-amber-300' : 'bg-muted/40 text-muted-foreground'}`}>150 夫妻</span>
             </div>
             {detail.favorability >= 100 && !detail.isLover && (
               <p className="text-[10px] text-amber-300/80 mt-2 flex items-center gap-1">
                 <Sparkles className="w-3 h-3" />
                 已达100上限，结为情侣后可继续提升至150
               </p>
             )}
          </div>
        </div>
      </div>

      {/* 化形外观 */}
      {detail.transformed && human && (
        <div className="p-4 rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-900/20 to-purple-900/10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-cyan-300" />
            <span className="text-sm font-bold text-cyan-200">化形外观</span>
             <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-cyan-900/40 text-cyan-300 border border-cyan-500/30">
               {human?.gender || '未知'}
             </span>
          </div>
          <p className="text-xs text-foreground/90 leading-relaxed">{human?.appearance}</p>
          <div className="mt-2 pt-2 border-t border-cyan-500/20">
            <div className="text-[10px] text-cyan-400 mb-0.5">性格</div>
            <p className="text-xs text-muted-foreground">{human?.personality}</p>
          </div>
        </div>
      )}

      {/* 结晶 */}
      {detail.crystals > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl border border-amber-500/30 bg-amber-900/10">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-300" />
            <span className="text-sm text-foreground">结晶</span>
          </div>
          <span className="text-sm font-bold text-amber-300">×{detail.crystals}</span>
        </div>
      )}

      {/* 凶兽介绍 */}
        <div className="rounded-xl border border-border/40 bg-card/40 p-4 space-y-3">
          <div>
            <div className="text-xs text-amber-300 mb-1 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" />
              <span>身份背景</span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">{beast.description}</p>
          </div>
          {beast.humanForm && (
            <>
              <div className="pt-2 border-t border-border/30">
                <div className="text-xs text-cyan-300 mb-1 flex items-center gap-1">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>外貌气质</span>
                </div>
                 <p className="text-xs text-foreground/80 leading-relaxed">{human?.appearance}</p>
              </div>
              <div className="pt-2 border-t border-border/30">
                <div className="text-xs text-pink-300 mb-1 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" />
                  <span>性格特点</span>
                </div>
                 <p className="text-xs text-foreground/80 leading-relaxed">{human?.personality}</p>
              </div>
            </>
          )}
        <div className="pt-2 border-t border-border/30 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[10px] text-muted-foreground">修为年限</div>
            <div className="text-xs font-bold text-foreground mt-0.5">
              {beast.years >= 10000 ? `${(beast.years / 10000).toFixed(0)}万年` : `${beast.years}年`}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">凶兽排名</div>
            <div className="text-xs font-bold text-amber-300 mt-0.5">第{beast.rank}位</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">属性</div>
            <div className="text-xs font-bold text-foreground mt-0.5">{beast.element}</div>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="space-y-2.5">
        {/* 赠送礼物 */}
        <button
          onClick={onOpenGift}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-pink-900/40 to-amber-900/30 border border-pink-500/40 text-pink-200 text-sm font-medium hover:from-pink-800/50 hover:to-amber-800/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Gift className="w-4 h-4" />
          赠送礼物（仙草/灵草/魂导器）
        </button>

        {/* 帮助化形 */}
        {!detail.transformed && (
          <button
            onClick={onTransform}
            disabled={detail.favorability < 50}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2
              ${detail.favorability < 50
                ? 'bg-muted/20 border border-border/30 text-muted-foreground opacity-50 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-900/40 to-blue-900/30 border border-cyan-500/40 text-cyan-200 hover:from-cyan-800/50 hover:to-blue-800/40'
              }`}
          >
            <UserPlus className="w-4 h-4" />
            帮助化形（消耗20%气血）
          </button>
        )}

        {/* 结为情侣 */}
        {!detail.isLover && (
          <button
            onClick={onBecomeLover}
            disabled={!detail.transformed || detail.favorability < 100}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2
              ${!detail.transformed || detail.favorability < 100
                ? 'bg-muted/20 border border-border/30 text-muted-foreground opacity-60 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-900/50 to-rose-900/40 border border-pink-500/50 text-pink-200 hover:from-pink-800/60 hover:to-rose-800/50'
              }`}
          >
            <Heart className="w-4 h-4" />
            {!detail.transformed ? '结为情侣（需先化形）' : detail.favorability < 100 ? `结为情侣（好感度${detail.favorability}/100）` : '结为情侣（全属性+10%）'}
          </button>
        )}

        {/* 双修（仅情侣可用） */}
        {detail.isLover && (
          <button
            onClick={onDualCultivate}
            disabled={dualRemain > 0}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2
              ${dualRemain > 0
                ? 'bg-muted/20 border border-border/30 text-muted-foreground opacity-60 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-900/50 to-pink-900/40 border border-purple-500/40 text-purple-200 hover:from-purple-800/60 hover:to-pink-800/50'
              }`}
          >
            <Flame className="w-4 h-4" />
            {dualRemain > 0 ? `双修冷却中（${Math.ceil(dualRemain / 1000)}秒）` : '双修（获得大量修为）'}
          </button>
        )}

        {/* 结为夫妻 / 夫妻关系区 */}
        {detail.transformed && detail.isLover && !detail.isSpouse && (
          <button
            onClick={onBecomeSpouse}
            disabled={detail.favorability < 150}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2
              ${detail.favorability < 150
                ? 'bg-muted/20 border border-border/30 text-muted-foreground opacity-50 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-700/50 to-amber-900/40 border border-amber-400/60 text-amber-200 hover:from-amber-600/60 hover:to-amber-800/50'
              }`}
          >
            <Crown className="w-4 h-4" />
            结为夫妻（夫妻唯一）
          </button>
        )}

        {/* 已是夫妻：关系卡 + 离婚操作 */}
        {detail.isSpouse && (
          <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-900/30 via-rose-900/20 to-transparent p-3 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-amber-200">夫妻关系</div>
                <div className="text-[10px] text-amber-300/70">永结同心 · 连理同枝</div>
              </div>
            </div>
            <button
              onClick={onDivorce}
              className="w-full py-2 rounded-lg text-xs font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 text-red-300 bg-red-950/40 border border-red-500/40 hover:bg-red-900/50 hover:border-red-400/60"
            >
              <HeartCrack className="w-3.5 h-3.5" />
              解除夫妻关系（离婚）
            </button>
            <p className="text-[10px] text-red-300/60 text-center leading-relaxed">
               ⚠ 离婚后全属性永久减少 5%（多次离婚加法累加），好感度大幅下降
             </p>
           </div>
         )}

         {/* 遗忘按钮：好感度<150且非夫妻时可用 */}
         {detail.favorability < 150 && !detail.isSpouse && (
           <button
             onClick={onForget}
             className="w-full py-2 rounded-lg text-xs font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 text-muted-foreground bg-muted/30 border border-border/50 hover:bg-red-950/30 hover:text-red-300 hover:border-red-500/30"
           >
             <X className="w-3.5 h-3.5" />
             遗忘此角色
           </button>
         )}

        {/* 交融（仅夫妻可用） */}
        {detail.isSpouse && (
          <button
            onClick={onMate}
            disabled={mateRemain > 0}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2
              ${mateRemain > 0
                ? 'bg-muted/20 border border-border/30 text-muted-foreground opacity-60 cursor-not-allowed'
                : 'bg-gradient-to-r from-rose-900/60 to-amber-900/50 border border-rose-400/50 text-rose-200 hover:from-rose-800/70 hover:to-amber-800/60'
              }`}
          >
            <Droplets className="w-4 h-4" />
            {mateRemain > 0 ? `交融冷却中（${Math.ceil(mateRemain / 1000)}秒）` : '交融（获得结晶 · 虚弱5分钟）'}
          </button>
        )}

      </div>

      {/* 赠送礼物弹窗 */}
      <AnimatePresence>
        {showGift && (
          <GiftModal
            beast={beast}
            items={giftableItems}
            tab={giftTab}
            onTabChange={setGiftTab}
            onClose={onCloseGift}
            onGifted={setTick}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ======================= 赠送礼物弹窗 =======================
interface GiftModalProps {
  beast: FierceBeast;
  items: { soulBones: any[]; soulGuideMaterials: any[]; immortalGrass: any[]; spiritGrass: any[] };
  tab: 'soulBone' | 'soulGuideMaterial' | 'immortalGrass' | 'spiritGrass';
  onTabChange: (tab: 'soulBone' | 'soulGuideMaterial' | 'immortalGrass' | 'spiritGrass') => void;
  onClose: () => void;
  onGifted: () => void;
}

function GiftModal({ beast, items, tab, onTabChange, onClose, onGifted }: GiftModalProps) {
  const { giftCompanion, computeFavorGain } = useGame();

  const handleGift = (itemId: string) => {
    const r = giftCompanion(beast.id, itemId);
    if (r.success) {
      toast.success(`赠送成功！好感度 +${r.favorGain}`);
      onGifted();
    } else {
      toast.error(r.reason || '赠送失败');
    }
  };

  const list = tab === 'soulBone' ? items.soulBones
    : tab === 'soulGuideMaterial' ? items.soulGuideMaterials
    : tab === 'immortalGrass' ? items.immortalGrass
    : items.spiritGrass;

  const computeGain = (item: any): number => computeFavorGain(item as any);

  const tabMeta: Record<string, { label: string; empty: string; hint: string; itemLabel: string }> = {
    soulBone:          { label: '魂骨',          empty: '背包里没有魂骨',              hint: '击败魂兽和凶兽有概率掉落魂骨',  itemLabel: '魂骨' },
    soulGuideMaterial: { label: '魂导器材料',    empty: '背包里没有魂导器材料',        hint: '击败魂兽可获得魂导器材料',     itemLabel: '魂导器材料' },
    immortalGrass:     { label: '仙草',          empty: '背包里没有仙草',              hint: '冰火两仪眼可采集珍稀仙草',     itemLabel: '仙草' },
    spiritGrass:       { label: '灵草',          empty: '背包里没有灵草',              hint: '各地秘境与森林可采集灵草',     itemLabel: '灵草' },
  };
  const meta = tabMeta[tab];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-md max-h-[80vh] flex flex-col"
        style={{
          background: 'linear-gradient(180deg, hsl(248 32% 16%) 0%, hsl(248 35% 12%) 100%)',
          border: '2px solid hsl(42 75% 55% / 0.5)',
          borderRadius: '16px',
          boxShadow: '0 0 40px hsl(320 70% 60% / 0.2), 0 20px 60px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div>
            <div className="text-base font-bold text-foreground">赠送礼物</div>
             <div className="text-[11px] text-muted-foreground mt-0.5">向 {beast.name} 赠送仙草·灵草·魂骨·魂导器材料</div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-card/80 hover:bg-card text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab 切换 */}
         <div className="flex p-2 gap-1 border-b border-border/30 overflow-x-auto">
           <button
             onClick={() => onTabChange('immortalGrass')}
             className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all
               ${tab === 'immortalGrass'
                 ? 'bg-emerald-900/40 text-emerald-200 border border-emerald-500/40'
                 : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
               }`}
           >
             仙草 ({items.immortalGrass.length})
           </button>
           <button
             onClick={() => onTabChange('spiritGrass')}
             className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all
               ${tab === 'spiritGrass'
                 ? 'bg-teal-900/40 text-teal-200 border border-teal-500/40'
                 : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
               }`}
           >
             灵草 ({items.spiritGrass.length})
           </button>
           <button
             onClick={() => onTabChange('soulBone')}
             className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all
               ${tab === 'soulBone'
                 ? 'bg-rose-900/40 text-rose-200 border border-rose-500/40'
                 : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
               }`}
           >
             魂骨 ({items.soulBones.length})
           </button>
           <button
             onClick={() => onTabChange('soulGuideMaterial')}
             className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all
               ${tab === 'soulGuideMaterial'
                 ? 'bg-amber-900/40 text-amber-200 border border-amber-500/40'
                 : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
               }`}
           >
             魂导器材料 ({items.soulGuideMaterials.length})
           </button>
         </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
           {list.length === 0 ? (
             <div className="py-16 text-center">
               <Gift className="w-10 h-10 mx-auto text-muted-foreground mb-2 opacity-40" />
               <p className="text-sm text-muted-foreground">{meta.empty}</p>
               <p className="text-xs text-muted-foreground/70 mt-1">{meta.hint}</p>
             </div>
          ) : (
            list.map((item) => {
              const gain = computeGain(item);
              const qty = item.quantity ?? 1;
              return (
                <button
                  key={item.id}
                  onClick={() => handleGift(item.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border/40 bg-card/40 hover:bg-card/70 hover:border-amber-500/40 transition-all text-left active:scale-[0.99]"
                >
                  <div
                    className="w-10 h-10 rounded-md flex items-center justify-center text-base font-bold border-2 shrink-0"
                    style={{ borderColor: item.qualityColor, color: item.qualityColor }}
                  >
                    {item.iconChar || '物'}
                  </div>
                  <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{item.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                                 {meta.itemLabel}
                              {qty > 1 && <span className="ml-1">× {qty}</span>}
                            </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-amber-300 font-bold">+{gain}</div>
                    <div className="text-[9px] text-pink-400/70">好感度</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ======================= 人类伴侣头像 =======================
function HumanAvatar({ character, size = 'md' }: { character: TeaCityCharacter; size?: 'sm' | 'md' | 'lg' }) {
  const qualityColors: Record<string, { from: string; to: string; glow: string; text: string }> = {
    common:    { from: 'from-gray-500/30', to: 'to-gray-700/30', glow: 'rgba(156,163,175,0.4)',  text: 'text-gray-200' },
    fine:      { from: 'from-green-500/30', to: 'to-emerald-700/30', glow: 'rgba(74,222,128,0.4)', text: 'text-green-200' },
    rare:      { from: 'from-blue-500/30', to: 'to-indigo-700/30', glow: 'rgba(96,165,250,0.4)', text: 'text-blue-200' },
    epic:      { from: 'from-purple-500/30', to: 'to-violet-700/30', glow: 'rgba(192,132,252,0.45)', text: 'text-purple-200' },
    legendary: { from: 'from-amber-400/40', to: 'to-rose-600/40', glow: 'rgba(251,191,36,0.55)', text: 'text-amber-100' },
  };
  const c = qualityColors[character.quality] ?? qualityColors.epic;
  const sizeMap = {
    sm: { outer: 'w-12 h-12', icon: 'text-base' },
    md: { outer: 'w-16 h-16 md:w-18 md:h-18', icon: 'text-xl md:text-2xl' },
    lg: { outer: 'w-20 h-20 md:w-24 md:h-24', icon: 'text-2xl md:text-3xl' },
  };
  const s = sizeMap[size];

  return (
    <div className={`relative ${s.outer} flex items-center justify-center mx-auto`}>
      {/* 外光晕 */}
      <div
        className={`absolute ${s.outer} rounded-full blur-md opacity-60`}
        style={{ background: `radial-gradient(circle, ${c.glow} 0%, transparent 70%)` }}
      />
      {/* 头像圆 */}
      <div
        className={`relative ${s.outer} rounded-full flex items-center justify-center font-black ${s.icon} ${c.text} bg-gradient-to-br ${c.from} ${c.to} border-2`}
        style={{
          borderColor: character.gender === '女' ? '#f472b660' : '#60a5fa60',
          boxShadow: `inset 0 0 14px ${c.glow}, 0 0 10px ${c.glow}`,
          textShadow: `0 0 8px currentColor`,
          fontFamily: "'Noto Serif SC', serif",
        }}
      >
        {character.iconChar}
      </div>
    </div>
  );
}

// ======================= 人类伴侣详情 =======================
interface HumanDetailProps {
  character: TeaCityCharacter;
  detail: {
    favorability: number;
    transformed: boolean;
    isLover: boolean;
    isSpouse: boolean;
    crystals: number;
    lastDualCultivateAt: number;
    lastMatingAt: number;
    forgotten?: boolean;
  };
  onBack: () => void;
  onOpenGift: () => void;
  onBecomeLover: () => void;
  onBecomeSpouse: () => void;
  onDivorce: () => void;
  onForget: () => void;
  onDualCultivate: () => void;
  onMate: () => void;
  showGift: boolean;
  onCloseGift: () => void;
  giftTab: 'soulBone' | 'soulGuideMaterial' | 'immortalGrass' | 'spiritGrass';
  setGiftTab: (tab: 'soulBone' | 'soulGuideMaterial' | 'immortalGrass' | 'spiritGrass') => void;
  tick: number;
  setTick: () => void;
}

function HumanCompanionDetail({
  character, detail, onBack, onOpenGift,
  onBecomeLover, onBecomeSpouse, onDivorce, onForget, onDualCultivate, onMate,
  showGift, onCloseGift, giftTab, setGiftTab, tick, setTick,
}: HumanDetailProps) {
  const { player, giftCompanion, computeFavorGain, challengeCompanionWin, getChallengeCooldown, startBattle } = useGame();
  const now = Date.now() + tick;
  const dualCooldown = 5 * 60 * 1000;
  const mateCooldown = 10 * 60 * 1000;
  const dualRemain = Math.max(0, dualCooldown - (now - detail.lastDualCultivateAt));
  const mateRemain = Math.max(0, mateCooldown - (now - detail.lastMatingAt));

  // 好感度门槛：挑战模式角色（阴阳茶）为 300/700，其他茶城角色为 100/150
  // 一次性挑战角色（混沌茶等）：无好感度积累，击败即获得神器并消失
  const isChallengeChar = character.favorMechanism === 'challenge';
  const isOneTimeChar = !!character.isOneTimeVictory;
  const loverThreshold = isOneTimeChar ? 1 : (isChallengeChar ? 300 : 100);
  const spouseThreshold = isOneTimeChar ? 1 : (isChallengeChar ? 700 : 150);
  const maxFavorDisplay = isOneTimeChar ? 1 : spouseThreshold;

  // 可赠送物品：仙草 / 灵草 / 魂骨 / 魂导器材料
  const giftableItems = useMemo(() => {
    if (!player) return { soulBones: [], soulGuideMaterials: [], immortalGrass: [], spiritGrass: [] };
    const soulBones = player.inventory.filter(item =>
      item.type === 'soulBone'
    );
    const soulGuideMaterials = player.inventory.filter(item =>
      item.type === 'material' && item.materialTier != null
    );
    const immortalGrass = player.inventory.filter(item =>
      item.type === 'consumable' && item.effect?.startsWith('immortal:')
    );
    const spiritGrass = player.inventory.filter(item =>
      item.type === 'consumable' &&
      (item.effect?.startsWith('element-spirit:') ||
        item.effect?.startsWith('attribute-spirit:') ||
        item.effect?.startsWith('ice-fire-immortal:') ||
        item.effect?.startsWith('holy-grass:') ||
        item.effect?.startsWith('water-of-life:') ||
        item.effect?.startsWith('polar-ice-jade:'))
    );
    return { soulBones, soulGuideMaterials, immortalGrass, spiritGrass };
  }, [player]);

  const handleGift = (itemInstanceId: string) => {
    const r = giftCompanion(character.id, itemInstanceId);
    if (r.success) {
      toast.success(`赠送成功！好感度 +${r.favorGain}`);
      setTick();
    } else {
      toast.error(r.reason || '赠送失败');
    }
  };

  const computeGain = (item: any) => computeFavorGain(item as any);

  const fmt = (ms: number) => {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const list = giftTab === 'soulBone' ? giftableItems.soulBones
    : giftTab === 'soulGuideMaterial' ? giftableItems.soulGuideMaterials
    : giftTab === 'immortalGrass' ? giftableItems.immortalGrass
    : giftableItems.spiritGrass;

  const qualityMap: Record<string, string> = {
    common: '普通', fine: '精良', rare: '稀有', epic: '史诗', legendary: '传说',
  };

  return (
    <div className="space-y-4">
      {/* 顶部返回 */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-lg border border-border/50 bg-card/40 flex items-center justify-center text-foreground hover:bg-card/70 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
           <h2 className="text-lg md:text-xl font-bold truncate">{character.name}</h2>
          <p className="text-xs text-muted-foreground truncate">{character.title}</p>
          <p className="text-[10px] text-amber-300/80 truncate mt-0.5">势力：{character.faction} · 武魂：{character.martialSoul}</p>
        </div>
        {detail.isSpouse && <Crown className="ml-auto w-5 h-5 text-amber-400 shrink-0" />}
        {detail.isLover && !detail.isSpouse && <Heart className="ml-auto w-5 h-5 text-pink-400 shrink-0" />}
      </div>

      {/* 头像+好感度：特殊存在无好感度系统 */}
       {character.isSpecialBeing ? (
         <div className="p-4 md:p-5 rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 via-card/60 to-fuchsia-900/10">
           <div className="flex items-center gap-4">
             <div className="shrink-0">
               <HumanAvatar character={character} size="lg" />
             </div>
             <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2 mb-1">
                 <Sparkles className="w-4 h-4 text-purple-300" />
                 <span className="text-sm font-bold text-foreground">特殊存在</span>
               </div>
               <div className="text-sm text-purple-300/90">
                 超越凡俗的创世级存在，无好感度系统
               </div>
               <div className="flex gap-2 mt-2 text-[10px] flex-wrap">
                 <span className="px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-300">唯一存在</span>
                 <span className="px-1.5 py-0.5 rounded bg-fuchsia-900/50 text-fuchsia-300">{qualityMap[character.quality]}</span>
               </div>
             </div>
           </div>
         </div>
       ) : (
         <div className="p-4 md:p-5 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-900/10 via-card/60 to-rose-900/10">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <HumanAvatar character={character} size="lg" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-bold text-foreground">好感度</span>
              <span className="ml-auto text-sm text-amber-300 font-bold tabular-nums">{detail.favorability}/{maxFavorDisplay}</span>
            </div>
            <div className="h-2.5 bg-muted/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 via-amber-400 to-amber-300 transition-all duration-500"
                style={{ width: `${Math.min(100, (detail.favorability / maxFavorDisplay) * 100)}%` }}
              />
            </div>
            <div className="flex gap-2 mt-2 text-[10px] flex-wrap">
              <span className={`px-1.5 py-0.5 rounded ${detail.favorability >= loverThreshold ? 'bg-pink-900/50 text-pink-300' : 'bg-muted/40 text-muted-foreground'}`}>{loverThreshold} 情侣</span>
              <span className={`px-1.5 py-0.5 rounded ${detail.favorability >= spouseThreshold ? 'bg-amber-900/50 text-amber-300' : 'bg-muted/40 text-muted-foreground'}`}>{spouseThreshold} 夫妻</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-900/50 text-cyan-300">{qualityMap[character.quality]}</span>
             </div>
             {detail.favorability >= loverThreshold && !detail.isLover && (
               <p className="text-[10px] text-amber-300/80 mt-2 flex items-center gap-1">
                 <Sparkles className="w-3 h-3" />
                 已达{loverThreshold}上限，结为情侣后可继续提升至{spouseThreshold}
               </p>
             )}
          </div>
        </div>
      </div>
       )}

        {/* 人物简介 */}
       <div className="rounded-xl border border-border/40 bg-card/40 p-4 space-y-3">
         <div>
           <div className="text-xs text-amber-300 mb-1 flex items-center gap-1">
             <UserPlus className="w-3.5 h-3.5" />
             <span>外貌气质</span>
           </div>
           <p className="text-xs text-foreground/80 leading-relaxed">{character.appearance}</p>
         </div>
         <div>
           <div className="text-xs text-pink-300 mb-1 flex items-center gap-1">
             <Heart className="w-3.5 h-3.5" />
             <span>性格特点</span>
           </div>
           <p className="text-xs text-foreground/80 leading-relaxed">{character.personality}</p>
         </div>
          {character.background && (
            <div>
              <div className="text-xs text-cyan-300 mb-1 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>背景故事</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">{character.background}</p>
            </div>
          )}
      </div>

      {/* 操作按钮 */}
       {character.isSpecialBeing ? (
         <div className="space-y-3">
           {/* 特殊存在挑战按钮 */}
           <button
             onClick={() => {
               const noCooldown = !!character.noCooldown;
               if (!noCooldown && detail.favorability >= spouseThreshold) {
                 toast.info('已击败，无需再战');
                 return;
               }
               const baseHp = character.challengeHp ?? 11e16;
               const baseAtk = character.challengeAttack ?? 1e14;
               const baseDef = character.challengeDefense ?? 0;
               const baseSpd = character.challengeSpeed ?? 999999;
               const baseSpr = character.challengeSpirit ?? 9999999;
               const skillName = character.challengeSkillName || '创世神技';
               const skillDesc = character.challengeSkillDesc || '创世级威能，直接斩杀目标';
               startBattle({
                 battleType: 'challenge',
                 locationId: 'tea-challenge-' + character.id,
                 enemy: {
                   id: character.id,
                   name: character.name,
                   years: 1000000000000000,
                   qualityColor: '#c084fc',
                   qualityLabel: character.victoryRewardTitle ? '元素创世·无上神级' : '混沌创世·无上神级',
                   hp: baseHp,
                   attack: baseAtk,
                   defense: baseDef,
                   speed: baseSpd,
                   spirit: baseSpr,
                   skillName,
                   skillDesc,
                   instantKillChance: character.victoryRewardTitle ? 0 : 0.5,
                   specialSkillCooldown: 0,
                   hasOnlySkill: !character.victoryRewardTitle,
                   element: character.element || '混沌·创世',
                 },
                 meta: { companionId: character.id, challengeType: 'tea-companion' },
               });
             }}
             disabled={!character.noCooldown && detail.favorability >= spouseThreshold}
             className={`w-full p-4 rounded-xl border transition-all active:scale-[0.97] ${
               !character.noCooldown && detail.favorability >= spouseThreshold
                 ? 'border-border/40 bg-card/30 opacity-50 cursor-not-allowed'
                 : character.victoryRewardTitle
                   ? 'border-cyan-400/40 bg-gradient-to-br from-cyan-900/40 via-blue-900/30 to-red-900/40 hover:from-cyan-800/50 hover:to-red-800/40'
                   : 'border-purple-400/40 bg-gradient-to-br from-purple-900/40 to-fuchsia-900/30 hover:from-purple-800/50 hover:to-fuchsia-800/40'
             }`}
           >
             <Swords className={`w-6 h-6 mx-auto mb-1.5 ${character.victoryRewardTitle ? 'text-cyan-300' : 'text-purple-300'}`} />
             <div className="text-sm font-bold text-foreground">
               {character.victoryRewardTitle ? '极致挑战' : '创世挑战'}
             </div>
             <div className="text-[10px] text-muted-foreground mt-0.5">
               {character.noCooldown
                 ? '可无限次挑战，证明你的实力'
                 : detail.favorability >= spouseThreshold
                   ? '已击败'
                   : `击败后获得${character.victoryArtifactItemId ? '专属神器' : '至宝'}（唯一）`}
             </div>
           </button>

           {/* 混沌茶强配为夫妻后：显示双修+交融按钮 */}
           {character.id === 'tc-hunduncha' && detail.isSpouse && (
             <div className="grid grid-cols-2 gap-3">
               <button
                 onClick={onDualCultivate}
                 disabled={!detail.isLover || dualRemain > 0}
                 className={`p-3 rounded-xl border transition-all active:scale-[0.97] ${
                   detail.isLover && dualRemain <= 0
                     ? 'border-cyan-500/40 bg-gradient-to-br from-cyan-900/20 to-blue-900/10 hover:from-cyan-900/30'
                     : 'border-border/40 bg-card/30 opacity-50 cursor-not-allowed'
                 }`}
               >
                 <Flame className="w-5 h-5 mx-auto mb-1 text-cyan-300" />
                 <div className="text-sm font-medium text-foreground">双修</div>
                 <div className="text-[10px] text-muted-foreground mt-0.5">
                   {dualRemain > 0 ? `冷却 ${fmt(dualRemain)}` : '获得大量修为'}
                 </div>
               </button>
               <button
                 onClick={onMate}
                 disabled={!detail.isSpouse || mateRemain > 0}
                 className={`p-3 rounded-xl border transition-all active:scale-[0.97] ${
                   detail.isSpouse && mateRemain <= 0
                     ? 'border-rose-500/40 bg-gradient-to-br from-rose-900/30 via-pink-900/20 to-amber-900/20 hover:from-rose-900/40'
                     : 'border-border/40 bg-card/30 opacity-50 cursor-not-allowed'
                 }`}
               >
                 <Droplets className="w-5 h-5 mx-auto mb-1 text-rose-300" />
                 <div className="text-sm font-medium text-foreground">交融</div>
                 <div className="text-[10px] text-muted-foreground mt-0.5">
                   {mateRemain > 0 ? `冷却 ${fmt(mateRemain)}` : `已有 ${detail.crystals} 颗结晶`}
                 </div>
               </button>
             </div>
           )}

           {/* 称号奖励展示 */}
           {character.victoryRewardTitle && (
             <div className="rounded-lg border border-amber-400/30 bg-gradient-to-r from-amber-900/20 to-yellow-900/20 p-3">
               <div className="flex items-center gap-2">
                 <span className="text-lg">🏆</span>
                 <div className="flex-1 min-w-0">
                   <div className="text-xs font-bold text-amber-300">永久称号</div>
                   <div className="text-sm font-semibold text-foreground truncate">【{character.victoryRewardTitle}】</div>
                 </div>
                 {(player?.permanentTitles ?? []).includes(character.victoryRewardTitle) ? (
                   <span className="shrink-0 text-[10px] text-green-400 font-bold">已获得</span>
                 ) : (
                   <span className="shrink-0 text-[10px] text-muted-foreground">未获得</span>
                 )}
               </div>
             </div>
           )}

           {/* 遗忘按钮：特殊存在（混沌茶等）无法遗忘 */}
           {character.id !== 'tc-hunduncha' && (
             <button
               onClick={onForget}
               className="w-full py-2 rounded-lg text-xs font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 text-muted-foreground bg-muted/30 border border-border/50 hover:bg-red-950/30 hover:text-red-300 hover:border-red-500/30"
             >
               <X className="w-3.5 h-3.5" />
               遗忘此角色
             </button>
           )}
         </div>
       ) : (
       <>
       <div className="grid grid-cols-2 gap-3">
        {/* 🔴 挑战模式角色：用「切磋挑战」按钮替代赠送礼物 */}
         {character.favorMechanism === 'challenge' ? (
           <button
             onClick={() => {
               if (detail.favorability >= spouseThreshold) {
                 toast.info('好感度已满，无需继续挑战');
                 return;
               }
               // 启动战斗：阴阳茶/梦小茶/甜小茶作为敌方
               // 好感度阶段：0~300为第一阶段（基础形态），结为情侣后进入第二阶段（全力形态，属性更强、好感奖励更高）
               // 一次性挑战角色（混沌茶）：单阶段，无好感度积累，击败直接获得神器
               const isPhase2 = !isOneTimeChar && detail.isLover && detail.favorability >= 300;
               // 梦小茶/甜小茶：精神系双姝，基础属性整体高于阴阳茶（因精神力增幅）
               const isMengXiaoCha = character.id === 'tc-mengxiaocha';
               const isTianXiaoCha = character.id === 'tc-tianxiaocha';
               const isHunDunCha = character.id === 'tc-hunduncha';
               const spiritMultiplier = isMengXiaoCha || isTianXiaoCha ? 2 : 1; // 精神系双姝的速度/精神/防御倍率
                // 两阶段数值：优先用角色自身的 phase2 字段，否则 fallback 到一阶段数值
                const baseHp = character.challengeHp ?? 6666e12;
                const baseAtk = character.challengeAttack ?? 666e8;
                const phase2Hp = character.phase2ChallengeHp ?? character.challengeHp ?? 8888e12;
                const phase2Atk = character.phase2ChallengeAttack ?? character.challengeAttack ?? 888e8;
                const skillName = isOneTimeChar
                  ? (character.challengeSkillName || '创世神技')
                  : isPhase2
                    ? (character.phase2ChallengeSkillName || character.challengeSkillName || '至高神技')
                    : (character.challengeSkillName || '无上神技');
                const skillDesc = isOneTimeChar
                  ? (character.challengeSkillDesc || '创世级威能，直接斩杀目标')
                  : isPhase2
                    ? (character.phase2ChallengeSkillDesc || character.challengeSkillDesc || '有概率直接斩杀目标')
                    : (character.challengeSkillDesc || '有概率直接斩杀目标');
                startBattle({
                  battleType: 'challenge',
                  locationId: 'tea-challenge-' + character.id,
                  enemy: {
                    id: character.id,
                    name: character.name,
                    years: isOneTimeChar ? 1000000000000000 : (isPhase2 ? 100000000000 : 1000000000),
                    qualityColor: isOneTimeChar ? '#c084fc' : (isPhase2 ? 'gold' : 'red'),
                    qualityLabel: isOneTimeChar
                      ? '混沌创世·无上神级'
                      : isPhase2
                        ? (isMengXiaoCha ? '永念梦极·神级' : (isTianXiaoCha ? '寰宇甜极·神级' : '阴阳极致·神级'))
                        : '无上至高·十万年',
                    hp: isOneTimeChar ? baseHp : (isPhase2 ? phase2Hp : baseHp),
                    attack: isOneTimeChar ? baseAtk : (isPhase2 ? phase2Atk : baseAtk),
                    defense: isOneTimeChar ? 0 : ((isPhase2 ? 5 * 1e12 : 5 * 1e12) * spiritMultiplier), // 混沌茶0防御=真实伤害
                    speed: isOneTimeChar ? 999999 : ((isPhase2 ? 99999 : 9999) * spiritMultiplier),
                    spirit: isOneTimeChar ? 9999999 : ((isPhase2 ? 999999 : 99999) * spiritMultiplier),
                    skillName,
                    skillDesc,
                    instantKillChance: isOneTimeChar
                      ? 0.5
                      : isMengXiaoCha || isTianXiaoCha
                        ? 0.45
                        : (isPhase2 ? 0.45 : 0.35),
                    specialSkillCooldown: 0,
                    hasOnlySkill: true,
                    element: isHunDunCha ? '混沌·创世' : (isMengXiaoCha ? '梦·精神' : (isTianXiaoCha ? '甜·精神' : '阴阳')),
                  },
                 meta: { companionId: character.id, challengeType: 'tea-companion' },
               });
            }}
            disabled={detail.favorability >= spouseThreshold}
            className={`p-3 rounded-xl border transition-all active:scale-[0.97] col-span-2 ${
              detail.favorability >= spouseThreshold
                ? 'border-border/40 bg-card/30 opacity-50 cursor-not-allowed'
                : isOneTimeChar
                  ? 'border-purple-400/40 bg-gradient-to-br from-purple-900/40 to-fuchsia-900/30 hover:from-purple-800/50 hover:to-fuchsia-800/40'
                  : 'border-gray-400/30 bg-gradient-to-br from-gray-900/40 to-slate-900/30 hover:from-gray-800/50 hover:to-slate-800/40'
            }`}
          >
            <Swords className={`w-5 h-5 mx-auto mb-1 ${isOneTimeChar ? 'text-purple-300' : 'text-slate-300'}`} />
            <div className="text-sm font-medium text-foreground">{isOneTimeChar ? '创世挑战' : '切磋挑战'}</div>
             <div className="text-[10px] text-muted-foreground mt-0.5">
               {detail.favorability >= spouseThreshold
                 ? '已战胜'
                 : isOneTimeChar
                   ? `击败后获得${character.victoryArtifactItemId ? '混沌神剑' : '专属神器'}（唯一）`
                   : detail.isLover
                   ? '获胜 +50~90 好感度'
                   : '获胜 +25~35 好感度'}
             </div>
          </button>
         ) : (
           <button
             onClick={onOpenGift}
             className="p-3 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-orange-900/10 hover:from-amber-900/30 transition-all active:scale-[0.97]"
           >
             <Gift className="w-5 h-5 text-amber-300 mx-auto mb-1" />
             <div className="text-sm font-medium text-foreground">赠送礼物</div>
             <div className="text-[10px] text-muted-foreground mt-0.5">仙草/灵草/魂骨/珍物</div>
           </button>
         )}

          {!isOneTimeChar && (<>
           <button
             onClick={onBecomeLover}
             disabled={detail.isLover || detail.favorability < loverThreshold}
             className={`p-3 rounded-xl border transition-all active:scale-[0.97] ${
               detail.isLover
                 ? 'border-pink-500/50 bg-pink-900/30 cursor-default'
                 : detail.favorability >= loverThreshold
                 ? 'border-pink-500/40 bg-gradient-to-br from-pink-900/20 to-rose-900/10 hover:from-pink-900/30'
                 : 'border-border/40 bg-card/30 opacity-50 cursor-not-allowed'
             }`}
           >
             <Heart className={`w-5 h-5 mx-auto mb-1 ${detail.isLover ? 'text-pink-400' : 'text-pink-300/70'}`} />
             <div className="text-sm font-medium text-foreground">
                {detail.isLover ? '已是情侣' : (detail.favorability >= loverThreshold ? '结为情侣（全属性+10%）' : '结为情侣')}
             </div>
             <div className="text-[10px] text-muted-foreground mt-0.5">
                {detail.isLover ? '相濡以沫 · 全属性+10%' : `好感度需 ≥ ${loverThreshold}`}
             </div>
           </button>

           <button
             onClick={onBecomeSpouse}
             disabled={detail.isSpouse || !detail.isLover || detail.favorability < spouseThreshold}
             className={`p-3 rounded-xl border transition-all active:scale-[0.97] ${
               detail.isSpouse
                 ? 'border-amber-500/50 bg-amber-900/30 cursor-default'
                 : detail.isLover && detail.favorability >= spouseThreshold
                 ? 'border-amber-500/40 bg-gradient-to-br from-amber-900/20 to-yellow-900/10 hover:from-amber-900/30'
                 : 'border-border/40 bg-card/30 opacity-50 cursor-not-allowed'
             }`}
           >
             <Crown className={`w-5 h-5 mx-auto mb-1 ${detail.isSpouse ? 'text-amber-400' : 'text-amber-300/70'}`} />
             <div className="text-sm font-medium text-foreground">
               {detail.isSpouse ? '已是夫妻' : '结为夫妻'}
             </div>
             <div className="text-[10px] text-muted-foreground mt-0.5">
               {detail.isSpouse ? '永结同心' : `需情侣 + 好感${spouseThreshold}`}
             </div>
           </button>

           <button
             onClick={onDualCultivate}
             disabled={!detail.isLover || dualRemain > 0}
             className={`p-3 rounded-xl border transition-all active:scale-[0.97] ${
               detail.isLover && dualRemain <= 0
                 ? 'border-cyan-500/40 bg-gradient-to-br from-cyan-900/20 to-blue-900/10 hover:from-cyan-900/30'
                 : 'border-border/40 bg-card/30 opacity-50 cursor-not-allowed'
             }`}
           >
             <Flame className="w-5 h-5 mx-auto mb-1 text-cyan-300" />
             <div className="text-sm font-medium text-foreground">双修</div>
             <div className="text-[10px] text-muted-foreground mt-0.5">
               {dualRemain > 0 ? `冷却 ${fmt(dualRemain)}` : '获得大量修为'}
             </div>
           </button>

           <button
             onClick={onMate}
             disabled={!detail.isSpouse || mateRemain > 0}
             className={`p-3 rounded-xl border transition-all active:scale-[0.97] col-span-2 ${
               detail.isSpouse && mateRemain <= 0
                 ? 'border-rose-500/40 bg-gradient-to-br from-rose-900/30 via-pink-900/20 to-amber-900/20 hover:from-rose-900/40'
                 : 'border-border/40 bg-card/30 opacity-50 cursor-not-allowed'
             }`}
           >
             <div className="flex items-center justify-center gap-2 mb-1">
               <Droplets className="w-5 h-5 text-rose-300" />
               <span className="text-sm font-medium text-foreground">交融</span>
               <Droplets className="w-5 h-5 text-rose-300" />
             </div>
              <div className="text-[10px] text-muted-foreground">
                {mateRemain > 0 ? `冷却 ${fmt(mateRemain)}` : `已有 ${detail.crystals} 颗交融结晶 · 虚弱5分钟`}
              </div>
            </button>
          </>)}
        </div>

        {/* 已是夫妻：离婚操作卡 */}
       {detail.isSpouse && (
         <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-900/30 via-rose-900/20 to-transparent p-3 space-y-2.5 mt-3">
           <div className="flex items-center gap-2">
             <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center shrink-0">
               <Crown className="w-4 h-4 text-white" />
             </div>
             <div className="flex-1 min-w-0">
               <div className="text-sm font-bold text-amber-200">夫妻关系</div>
               <div className="text-[10px] text-amber-300/70">永结同心 · 连理同枝</div>
             </div>
           </div>
           <button
             onClick={onDivorce}
             className="w-full py-2 rounded-lg text-xs font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 text-red-300 bg-red-950/40 border border-red-500/40 hover:bg-red-900/50 hover:border-red-400/60"
           >
             <HeartCrack className="w-3.5 h-3.5" />
             解除夫妻关系（离婚）
           </button>
           <p className="text-[10px] text-red-300/60 text-center leading-relaxed">
              ⚠ 离婚后全属性永久减少 5%（多次离婚加法累加），好感度大幅下降
            </p>
          </div>
       )}

       {/* 遗忘按钮：好感度<150且非夫妻时可用（特殊存在始终可用遗忘） */}
       {(character.isSpecialBeing || (detail.favorability < 150 && !detail.isSpouse)) && (
         <button
           onClick={onForget}
           className="w-full py-2 rounded-lg text-xs font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 text-muted-foreground bg-muted/30 border border-border/50 hover:bg-red-950/30 hover:text-red-300 hover:border-red-500/30"
         >
           <X className="w-3.5 h-3.5" />
           遗忘此角色
         </button>
       )}
       </>
       )}

      {/* 赠送礼物弹窗 */}
      <AnimatePresence>
        {showGift && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={onCloseGift}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-gradient-to-br from-card to-card/80 border border-border/60 rounded-2xl p-5 shadow-2xl max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">赠送礼物</h3>
                <button onClick={onCloseGift} className="p-1 hover:bg-card/70 rounded-md">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-2 mb-4 overflow-x-auto">
                {([
                  { key: 'immortalGrass',     label: '仙草' },
                  { key: 'spiritGrass',       label: '灵草' },
                  { key: 'soulBone',          label: '魂骨' },
                  { key: 'soulGuideMaterial', label: '魂导器材料' },
                ] as const).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setGiftTab(t.key)}
                    className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      giftTab === t.key
                        ? 'bg-amber-600/30 text-amber-200 border border-amber-500/40'
                        : 'bg-card/50 text-muted-foreground border border-border/40 hover:bg-card'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto -mx-2 px-2">
                {list.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="text-3xl mb-2">📦</div>
                      <div className="text-sm text-muted-foreground">
                        背包里没有可赠送的物品
                      </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {list.map((item) => {
                      const gain = computeGain(item);
                      const qty = item.quantity ?? 1;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleGift(item.id)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border/40 bg-card/40 hover:bg-card/70 hover:border-amber-500/40 transition-all text-left active:scale-[0.99]"
                        >
                          <div
                            className="w-10 h-10 rounded-md flex items-center justify-center text-base font-bold border-2 shrink-0"
                            style={{ borderColor: item.qualityColor, color: item.qualityColor }}
                          >
                            {item.iconChar || '物'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{item.name}</div>
                            <div className="text-[10px] text-muted-foreground">
                               {giftTab === 'immortalGrass' ? '仙草' : giftTab === 'spiritGrass' ? '灵草' : giftTab === 'soulBone' ? '魂骨' : '魂导器材料'}
                               {qty > 1 && <span className="ml-1">× {qty}</span>}
                             </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs text-amber-300 font-bold">+{gain}</div>
                            <div className="text-[9px] text-pink-400/70">好感度</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
