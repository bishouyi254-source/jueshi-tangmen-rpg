import { hasLiehun, readNianBonus } from '@/lib/liehunGrowth';
import { useState, useMemo, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Shield, Zap, Brain, Heart, Sparkles, Flame, Target, Droplets, X, Coins, CircleDot, Battery, Swords, Leaf, Crown, Paintbrush, Edit3, RotateCcw } from 'lucide-react';
import { useGame, calcAttributes, getRealmDisplay, QUALITY_COLOR, QUALITY_LABEL, RING_COLOR_MAP, RING_DISPLAY_COLOR, RING_LABEL, getRequiredLevelForRing, getMaxRings, type ISoulBoneSlots, type ISoulRing, getExtremeInfo, getStaminaMax, calcRecoveredStamina, inferElementFromName, calcAttributeBonus, calcSpiritBonusBreakdown, formatSkillDamagePct, calcReincarnationBonusBreakdown } from '@/lib/gameStore';
import ArmorContribution from './ArmorContribution';
import DivineRingAvatar from '@/components/DivineRingAvatar';
import { formatNumber, formatCombatPower } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import SoulRing from '@/components/SoulRing';
import type { IItem } from '@/data/items';
import { getTrialById, getArtifactByDeity, getArtifactById, DIVINE_ARTIFACTS } from '@/data/divineTrials';
import { TEA_CITY_CHARACTERS } from '@/data/teaCity';

const EQUIP_SLOTS: Array<{ key: 'melee' | 'support' | 'defense' | 'ranged' | 'flying'; label: string }> = [
  { key: 'melee', label: '近战魂导器' },
  { key: 'defense', label: '防御魂导器' },
  { key: 'ranged', label: '远程魂导器' },
  { key: 'support', label: '辅助魂导器' },
  { key: 'flying', label: '飞行魂导器' },
];

const BONE_SLOTS: Array<{ key: string; label: string }> = [
  { key: 'head', label: '头骨' },
  { key: 'torso', label: '躯干骨' },
  { key: 'leftArm', label: '左臂骨' },
  { key: 'rightArm', label: '右臂骨' },
  { key: 'leftLeg', label: '左腿骨' },
  { key: 'rightLeg', label: '右腿骨' },
  { key: 'external', label: '外部魂骨' },
];

export default function CharacterPanel() {
  const { player, unequipSlot, unequipSoulBone, setDivineRingColor, setTitle, convertToDivineArmor, renameDivineArmor, switchActiveArtifact } = useGame();
  const [showTitleDialog, setShowTitleDialog] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  // 达到90级并吸收第9魂环后可自定义封号
  const canSetTitle = player.level >= 90 && player.soulRings.length >= 9 && !player.title;

  const handleOpenTitleDialog = () => {
    setTitleInput(player.title || '');
    setShowTitleDialog(true);
  };

  const handleSaveTitle = () => {
    const trimmed = titleInput.trim();
    if (!trimmed) {
      toast.error('封号不能为空');
      return;
    }
    if (trimmed.length > 2) {
      toast.error('封号限制2个字以内');
      return;
    }
    setTitle(trimmed);
    setShowTitleDialog(false);
    toast.success('封号设置成功！');
  };
  const [showRingRelease, setShowRingRelease] = useState(false);
  const [ringReleaseSoul, setRingReleaseSoul] = useState<0 | 1>(0); // 0=主修, 1=次修
  const [soulRingTab, setSoulRingTab] = useState<0 | 1>(0); // 魂环页当前查看的武魂
  const [activeTab, setActiveTab] = useState('equipment');
  const [selectedEquip, setSelectedEquip] = useState<{ slot: string; item: IItem | null } | null>(null);
  const [, setTick] = useState(0);
  const [showDivineRingPicker, setShowDivineRingPicker] = useState(false);
  // 🔴 v15.0 神装系统弹窗
  const [showArmorConvert, setShowArmorConvert] = useState(false); // 转化确认弹窗
  const [showArmorRename, setShowArmorRename] = useState(false);   // 命名弹窗
  const [armorNameInput, setArmorNameInput] = useState('');
  const [convertingArmor, setConvertingArmor] = useState(false);

  const dt = player?.divineTrial;
  const divineTrial = dt?.chosenTrialId ? getTrialById(dt.chosenTrialId) : null;
  const defaultArtifact = dt?.chosenTrialId && dt.artifactDrawn ? getArtifactByDeity(dt.chosenTrialId) : null;
  // 🔴 当前激活神器：activeArtifactId 优先，否则使用继承神位的默认神器
  const activeArtifact = dt?.activeArtifactId ? getArtifactById(dt.activeArtifactId) : defaultArtifact;
  const divineArtifact = activeArtifact;
   // 玩家通过夫妻等途径拥有的特殊神器（非神位继承）
   const ownedSpecialArtifacts = useMemo(() => {
     if (!player?.companions?.details) return [];
     const specialIds: string[] = [];
     // 鸿蒙两仪神剑：与阴阳茶结为夫妻获得
     const yinYangChar = TEA_CITY_CHARACTERS.find(c => c.id === 'tc-yinyangcha');
     if (yinYangChar && player.companions.details[yinYangChar.id]?.isSpouse) {
       specialIds.push('art-yinyang-sword');
     }
      // 永念梦之剑：与梦小茶结为夫妻获得
      const mengChar = TEA_CITY_CHARACTERS.find(c => c.id === 'tc-mengxiaocha');
      if (mengChar && player.companions.details[mengChar.id]?.isSpouse) {
        specialIds.push('art-dream-sword');
      }
      // 寰宇之枪：与甜小茶结为夫妻获得
      const tianChar = TEA_CITY_CHARACTERS.find(c => c.id === 'tc-tianxiaocha');
      if (tianChar && player.companions.details[tianChar.id]?.isSpouse) {
        specialIds.push('art-tianyu-spear');
      }
     return specialIds;
   }, [player?.companions?.details]);
  const divineRing = dt?.divineSoulRing;
  const divineRingColor = divineRing?.color ?? '#ffd700';

  const attrs = useMemo(() => player ? calcAttributes(player) : null, [player]);

  // 上阵魂灵及加成明细
  const activeSpirits = useMemo(() => {
    if (!player?.activeSpiritIds || !player?.soulSpirits) return [];
    return player.activeSpiritIds
      .map((id) => player.soulSpirits!.find((s) => s.spiritId === id))
      .filter((s): s is NonNullable<typeof s> => !!s);
  }, [player]);
  const spiritBonus = useMemo(() => player ? calcSpiritBonusBreakdown(player) : null, [player]);

  // 转世轮回加成明细
  const reincBonus = useMemo(() => player ? calcReincarnationBonusBreakdown(player) : null, [player]);

  // 每秒刷新（用于倒计时等实时数据）
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);


  // 实时体力
  const currentStamina = useMemo(() => {
    if (!player) return 0;
    const max = getStaminaMax(player.level);
    const { stamina } = calcRecoveredStamina(player.stamina, player.staminaUpdatedAt, max);
    return stamina;
  }, [player]);

  const maxStamina = useMemo(() => player ? getStaminaMax(player.level) : 0, [player]);

  // 战力：(攻击+防御+速度+精神+气血+暴击率*100+爆伤*50+魂力) * 0.5
  const combatPower = useMemo(() => {
    if (!attrs) return 0;
    const base = attrs.attack + attrs.defense + attrs.speed + attrs.spirit + attrs.hp;
    const critVal = attrs.critRate * 100 + attrs.critDmg * 50;
    const soulVal = attrs.maxSoulPower;
    return Math.round((base + critVal + soulVal) * 0.5);
  }, [attrs]);

  const combatPowerStr = useMemo(() => formatCombatPower(combatPower), [combatPower]);

  // 武魂修炼属性名称（优先用武魂的极致属性，否则用系别对应名称）
  const cultivationAttrLabel = useMemo(() => {
    if (!player) return '';
    // 有极致属性时直接显示
    if (player.martialSoul.extremeAttribute) return player.martialSoul.extremeAttribute;
    const attr = player.martialSoul.cultivationAttr;
    const map: Record<string, string> = {
      strength: '极致之力量',
      spirit: '极致之精神',
      agility: '极致之敏捷',
      defense: '极致之防御',
      support: '极致之辅助',
      chaos: '极致之混沌',
    };
    return map[attr] || '';
  }, [player]);

  // 次修武魂修炼属性名
  const secondCultivationAttrLabel = useMemo(() => {
    if (!player?.secondSoul) return '';
    if (player.secondSoul.extremeAttribute) return player.secondSoul.extremeAttribute;
    const attr = player.secondSoul.cultivationAttr;
    const map: Record<string, string> = {
      strength: '极致之力量',
      spirit: '极致之精神',
      agility: '极致之敏捷',
      defense: '极致之防御',
      support: '极致之辅助',
      chaos: '极致之混沌',
    };
    return map[attr] || '';
  }, [player?.secondSoul]);

  // 品质纯色（兼容 borderColor / color / boxShadow 等需要单值的 CSS 属性）
  const soulQualityColor = useMemo(() => {
    if (!player) return '#a855f7';
    const q = player.martialSoul.quality;
    if (q === 'superDivine') return '#f472b6';
    const c = QUALITY_COLOR[q];
    return (typeof c === 'string' && !c.startsWith('linear-gradient')) ? c : '#f59e0b';
  }, [player]);
  const secondSoulQualityColor = player?.secondSoul ? QUALITY_COLOR[player.secondSoul.quality] : '#9ca3af';

  // 属性格子数据（大数字自动带万/亿单位）
  const attrGrid = useMemo(() => {
    if (!attrs) return [];
    const data = [
      { key: 'attack', label: '攻击', value: formatNumber(attrs.attack), icon: Sword, color: '#f97316' },
      { key: 'defense', label: '防御', value: formatNumber(attrs.defense), icon: Shield, color: '#3b82f6' },
      { key: 'speed', label: '速度', value: formatNumber(attrs.speed), icon: Zap, color: '#22c55e' },
      { key: 'spirit', label: '精神', value: formatNumber(attrs.spirit), icon: Brain, color: '#a855f7' },
      { key: 'hp', label: '气血', value: formatNumber(attrs.hp), icon: Heart, color: '#ef4444' },
      { key: 'critRate', label: '暴击率', value: `${Math.round(attrs.critRate * 100)}%`, icon: Target, color: '#fbbf24', sub: attrs.overflowCritConvertedDmg > 0 ? `溢出转爆伤 +${Math.round(attrs.overflowCritConvertedDmg * 100)}%` : undefined },
      { key: 'critDmg', label: '爆伤', value: `${Math.round(attrs.critDmg * 100)}%`, icon: Flame, color: '#f97316' },
      { key: 'allAttr', label: '全属性', value: `+${Math.round(attrs.allAttrPct * 100)}%`, icon: Sparkles, color: '#fcd34d' },
      { key: 'soulPower', label: '魂力', value: formatNumber(attrs.maxSoulPower), icon: Droplets, color: '#38bdf8' },
      { key: 'stamina', label: '体力', value: `${formatNumber(Math.round(currentStamina))}/${formatNumber(maxStamina)}`, icon: Battery, color: '#10b981' },
    ];
    return data;
  }, [attrs, currentStamina, maxStamina]);

  if (!player || !attrs) return null;

  const handleUnequip = (slotKey: string, type: 'equip' | 'bone') => {
    if (type === 'equip') {
      unequipSlot(slotKey as 'melee' | 'support' | 'defense' | 'ranged' | 'flying');
    } else {
      unequipSoulBone(slotKey as keyof ISoulBoneSlots);
    }
    setSelectedEquip(null);
  };

  if (!player) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-muted-foreground">加载中…</div>
      </div>
    );
  }

  return (
    <div className="p-0 md:p-1 space-y-4 md:space-y-6">
      {/* 角色信息卡 */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-card/75 backdrop-blur-sm p-4 md:p-6 shadow-md text-foreground">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="relative">
            <DivineRingAvatar
              name={player.name}
              isDeity={!!dt?.inherited}
              ringColor={divineRing?.color ?? '#fcd34d'}
              borderColor={soulQualityColor}
              size="lg"
              shape="circle"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg md:text-2xl font-bold truncate flex items-center gap-1.5">
                {player.name}
                {player.title && (
                  <span className="text-cyan-400 text-base font-bold tracking-wide">· {player.title.slice(0, 2)}斗罗</span>
                )}
                {canSetTitle && (
                  <button
                    onClick={handleOpenTitleDialog}
                    className="shrink-0 p-1 rounded hover:bg-cyan-500/20 text-cyan-300/70 hover:text-cyan-200 transition-colors"
                    title="设置封号"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </h2>
              {/* 永久称号显示 */}
              {(player.permanentTitles ?? []).length > 0 && (
                <div className="flex items-center gap-1 flex-wrap mt-0.5">
                  {player.permanentTitles!.map(t => (
                    <span key={t} className="shrink-0 rounded bg-gradient-to-r from-amber-600/40 to-yellow-600/40 px-2 py-0.5 text-[10px] font-bold text-amber-200 border border-amber-400/40 shadow-sm">
                      🏆 {t}
                    </span>
                  ))}
                </div>
              )}

              <span className="shrink-0 rounded bg-cyan-900/50 px-1.5 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-500/30">
                {getRealmDisplay(player.level, player.soulRings.length, player.title, player.easterRealmStage, player.divineTrial)}
              </span>
            </div>
            <div className="text-xs md:text-sm text-cyan-400 mt-0.5 flex items-center gap-2">
              <span>Lv.{player.level} · {player.direction}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-1 text-xs">
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{
                  backgroundColor: `${soulQualityColor}20`,
                  color: soulQualityColor,
                }}
              >
                主修 · {QUALITY_LABEL[player.martialSoul.quality]}
              </span>
              <span className="text-cyan-400 truncate">
                {player.martialSoul.name}
              </span>
              {cultivationAttrLabel && (
                <span className="text-[10px] text-amber-400/90 ml-1 shrink-0">· {cultivationAttrLabel}</span>
              )}
            </div>
            {/* 次修武魂 */}
            {player.isTwinSoul && player.secondSoul && (
              <div className="mt-1 flex items-center gap-1 text-xs">
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={{
                    backgroundColor: `${secondSoulQualityColor}20`,
                    color: secondSoulQualityColor,
                  }}
                >
                  次修 · {QUALITY_LABEL[player.secondSoul.quality]}
                </span>
                <span className="text-purple-400 truncate">
                  {player.secondSoul.name}
                </span>
                {secondCultivationAttrLabel && (
                  <span className="text-[10px] text-purple-300/90 ml-1 shrink-0">· {secondCultivationAttrLabel}</span>
                )}
              </div>
            )}
            {/* 极致属性标识 */}
            {player.martialSoul.extremeAttribute && (
              <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                {player.martialSoul.extremeAttribute.split('·').map((attr) => {
                  const info = getExtremeInfo(attr);
                  return (
                    <span
                      key={attr}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-cyan-900/60 to-red-900/30 border border-cyan-500/40 text-cyan-200"
                      title={info.desc}
                    >
                      {info.icon} {attr}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 核心信息栏 - 2行2列布局 + 战力展示 */}
        <div className="mt-3 pt-3 border-t border-cyan-500/10 space-y-2">
          {/* 战力行 */}
          <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-900/40 via-cyan-800/30 to-cyan-900/40 border border-cyan-500/30" style={{ boxShadow: 'inset 0 1px 0 rgba(34,211,238,0.1), 0 0 12px rgba(34,211,238,0.08)' }}>
            <Swords className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-cyan-300">战力</span>
            <span className="text-lg font-bold text-cyan-200 tabular-nums" style={{ textShadow: '0 0 8px rgba(34,211,238,0.5)' }}>
              {combatPowerStr}
            </span>
          </div>

          {/* 状态提示：影响战力的 debuff/buff */}
          {attrs?.statusFlags && (attrs.statusFlags.weaknessActive || attrs.statusFlags.divorcePenaltyPct > 0) && (
            <div className="space-y-1">
              {attrs.statusFlags.weaknessActive && (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-red-950/40 border border-red-500/40 text-xs">
                  <span className="text-red-400 font-semibold">⚠️ 虚弱状态</span>
                  <span className="text-red-300">全属性-80%</span>
                  <span className="text-red-400/80 ml-auto">
                    剩余 {Math.floor(attrs.statusFlags.weaknessRemainSec / 60)}:{String(attrs.statusFlags.weaknessRemainSec % 60).padStart(2, '0')}
                  </span>
                </div>
              )}
              {attrs.statusFlags.divorcePenaltyPct > 0 && (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-orange-950/40 border border-orange-500/40 text-xs">
                  <span className="text-orange-400 font-semibold">💔 离婚惩罚</span>
                  <span className="text-orange-300">全属性-{attrs.statusFlags.divorcePenaltyPct}%</span>
                </div>
              )}
            </div>
          )}
          {/* 两行两列信息 */}
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-cyan-900/30 border border-cyan-500/20">
              <Coins className="h-4 w-4 text-yellow-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-cyan-400 leading-tight">魂币</div>
                <div className="text-sm font-bold tabular-nums text-yellow-600 truncate">{formatNumber(player.soulCoins)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-card/40 border border-border/30">
              <Heart className="h-4 w-4 text-red-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-cyan-400 leading-tight">气血</div>
                <div className="text-sm font-bold tabular-nums text-red-600 truncate">
                  {formatNumber(Math.min(Math.round(player.currentHp), Math.round(attrs.hp)))} / {formatNumber(Math.round(attrs.hp))}
                </div>
              </div>
            </div>
             <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-cyan-900/30 border border-cyan-500/20">
               <Sparkles className="h-4 w-4 shrink-0" style={{ color: soulQualityColor }} />
               <div className="min-w-0 flex-1">
                 <div className="text-[10px] text-cyan-400 leading-tight">武魂</div>
                 <div className="text-sm font-bold truncate" style={{ color: soulQualityColor }}>{player.martialSoul.name}</div>
               </div>
             </div>
             {cultivationAttrLabel && (
               <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/10 to-cyan-500/10 border border-cyan-500/30">
                 <Leaf className="h-4 w-4 shrink-0 text-cyan-400" />
                 <div className="min-w-0 flex-1">
                   <div className="text-[10px] text-cyan-400 leading-tight">修炼属性</div>
                    <div className="text-sm font-bold truncate text-cyan-200">{cultivationAttrLabel}</div>
                 </div>
               </div>
             )}
             <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-cyan-900/30 border border-cyan-500/20">
                <CircleDot className="h-4 w-4 text-cyan-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-cyan-400 leading-tight">魂环</div>
                  <div className="text-sm font-bold tabular-nums text-cyan-400">
                    主{player.soulRings.length}环
                    {player.isTwinSoul && player.secondSoul && ` / 次${(player.secondSoulRings ?? []).length}环`}
                  </div>
                </div>
              </div>
              {reincBonus && reincBonus.count > 0 && (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/15 to-purple-500/15 border border-amber-400/30">
                  <RotateCcw className="h-4 w-4 text-amber-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-amber-300 leading-tight">转世</div>
                    <div className="text-sm font-bold tabular-nums text-amber-300 truncate">
                      第 {reincBonus.count + 1} 世
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
       </div>

      {/* 神考 / 神器 / 神力 */}
      {dt && (dt.chosenTrialId || dt.drawIndex < 5) && (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-slate-900/50 to-purple-950/20 backdrop-blur-sm p-3 text-foreground">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: "'Noto Serif SC', serif" }}>
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent">
              神之传承
            </span>
          </h3>
          <div className="space-y-2">
            {/* 神位 */}
            {divineTrial ? (
              <div className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: `linear-gradient(90deg, ${divineTrial.color}15, transparent)` }}>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: `${divineTrial.color}30`, border: `1px solid ${divineTrial.color}60` }}
                >
                  {divineTrial.tier === 'supreme' ? '🌟' : divineTrial.tier === 'king' ? '👑' : divineTrial.tier === 'first' ? '⭐' : '✨'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold" style={{ color: divineTrial.color }}>{divineTrial.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${divineTrial.color}25`, color: divineTrial.color }}>
                      {divineTrial.tier === 'supreme' ? '至高神' : divineTrial.tier === 'king' ? '神王' : divineTrial.tier === 'first' ? '一级神' : '二级神'}
                    </span>
                    {dt.inherited && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900 font-bold">
                        已继承
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    第 {dt.currentExamIndex} / {divineTrial.totalExams} 考 · {dt.inherited ? '神位传承完成' : dt.currentExamIndex > 0 ? '考核进行中' : '待接取'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 bg-slate-700/50 border border-slate-600/50">
                  ❓
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-muted-foreground">未知神位</div>
                  <div className="text-xs text-muted-foreground mt-0.5">剩余 {5 - dt.drawIndex} 次抽取机会</div>
                </div>
              </div>
            )}

            {/* 神器 */}
            {divineArtifact && (
              <div className="rounded-xl p-2.5" style={{ background: `linear-gradient(90deg, ${divineTrial?.color ?? '#fcd34d'}12, transparent)` }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 relative"
                    style={{ backgroundColor: `${divineTrial?.color ?? '#fcd34d'}25`, border: `1px solid ${divineTrial?.color ?? '#fcd34d'}60` }}
                  >
                    {divineArtifact.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium" style={{ color: divineTrial?.color ?? '#fcd34d' }}>{divineArtifact.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${divineTrial?.color ?? '#fcd34d'}25`, color: divineTrial?.color ?? '#fcd34d' }}>
                        {divineArtifact.tier === 'supreme' ? '至高神器' : divineArtifact.tier === 'super' ? '超神器' : '神器'}
                      </span>
                       {(divineArtifact.id !== 'art-yinyang-sword' && divineArtifact.id !== 'art-dream-sword' && divineArtifact.id !== 'art-tianyu-spear') && (
                         <span className="text-[10px] text-amber-300 font-bold">Lv.{dt.artifactLevel}</span>
                       )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                       {divineArtifact.id === 'art-yinyang-sword'
                         ? '攻击力 +10亿（无上神器）'
                         : divineArtifact.id === 'art-dream-sword'
                         ? '速度 +10亿（无上神器）'
                         : divineArtifact.id === 'art-tianyu-spear'
                         ? '精神力 +10亿（无上神器）'
                         : `全属性 +${(Math.pow(1 + (divineArtifact.perLevelBonus.attack + divineArtifact.perLevelBonus.defense + divineArtifact.perLevelBonus.speed + divineArtifact.perLevelBonus.spirit + divineArtifact.perLevelBonus.hp) / 5, Math.max(0, dt.artifactLevel - 1)) - 1 < 0.01 ? 0 : (Math.pow(1 + (divineArtifact.perLevelBonus.attack + divineArtifact.perLevelBonus.defense + divineArtifact.perLevelBonus.speed + divineArtifact.perLevelBonus.spirit + divineArtifact.perLevelBonus.hp) / 5, Math.max(0, dt.artifactLevel - 1)) - 1) * 100).toFixed(1)}%`}
                    </div>
                  </div>
                </div>
                {/* 🔴 至高神器永久叠加提示 */}
                {ownedSpecialArtifacts.length > 0 && (
                  <div className="mt-2 px-2 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <div className="text-[10px] text-emerald-300 flex items-center gap-1">
                      <span>✓</span>
                      <span>已获得 {ownedSpecialArtifacts.length} 件至高神器，属性永久叠加（与神位神器叠加生效）</span>
                    </div>
                  </div>
                )}
                {/* 🔴 神器切换：继承神位后 + 拥有特殊神器时显示 */}
                {dt.inherited && ownedSpecialArtifacts.length > 0 && (
                  <div className="mt-2.5 pt-2.5 border-t border-border/30 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-muted-foreground">切换：</span>
                    {defaultArtifact && (
                      <button
                        onClick={() => switchActiveArtifact(null)}
                        className={`px-2 py-1 rounded text-[10px] transition-all ${!dt.activeArtifactId
                          ? 'bg-amber-500/30 border border-amber-400/50 text-amber-200'
                          : 'bg-muted/30 border border-border/40 text-muted-foreground hover:bg-muted/50'}
                        `}
                      >
                        {defaultArtifact.name}
                      </button>
                    )}
                    {ownedSpecialArtifacts.map(artId => {
                      const art = getArtifactById(artId);
                      if (!art) return null;
                      const isActive = dt.activeArtifactId === artId;
                      return (
                        <button
                          key={artId}
                          onClick={() => switchActiveArtifact(artId)}
                          className={`px-2 py-1 rounded text-[10px] transition-all ${isActive
                            ? 'bg-gradient-to-r from-slate-500/30 to-gray-500/30 border border-slate-400/50 text-slate-100'
                            : 'bg-muted/30 border border-border/40 text-muted-foreground hover:bg-muted/50'}
                          `}
                        >
                          {art.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 神力 */}
            {dt.inherited && divineTrial && (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/30">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 bg-gradient-to-br from-amber-500/30 to-purple-500/30 border border-amber-400/50">
                  ⚡
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-200">神力加成</span>
                  </div>
                  <div className="text-xs text-amber-300/90 mt-0.5">
                    全属性 +{divineTrial.inheritBonus.allAttrPct}% · 等级突破百级
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

       {/* 🔴 v22.0 法则碎片与神级修炼 */}
      {dt?.godLevelProgress?.unlocked && (
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 via-card/70 to-indigo-900/20 backdrop-blur-sm p-3 text-foreground">
          <h3 className="text-sm font-semibold mb-3 text-purple-300" style={{ fontFamily: "'Noto Serif SC', serif" }}>
            ⚖️ 法则之力
          </h3>
          <div className="flex justify-between text-xs mb-3">
            <span className="text-muted-foreground">
              等级上限：<span className="text-purple-300 font-bold">{dt.godLevelProgress.levelCap}级</span>
            </span>
            <span className="text-muted-foreground">
              神位：<span className="text-purple-300">
                {dt.godLevelProgress.currentTier === 'supreme' ? '至高神' :
                 dt.godLevelProgress.currentTier === 'king' ? '神王' :
                 dt.godLevelProgress.currentTier === 'first' ? '一级神' : '二级神'}
              </span>
            </span>
          </div>
          {/* 已融合法则 */}
          {dt.lawsFused && Object.keys(dt.lawsFused).filter(k => dt.lawsFused![k as keyof typeof dt.lawsFused]).length > 0 && (
            <div className="mb-3">
              <div className="text-[11px] text-purple-300/80 mb-1.5">已掌握法则</div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(dt.lawsFused).filter(([, v]) => v).map(([key]) => {
                  const lawInfo: Record<string, { name: string; effect: string; color: string }> = {
                    time: { name: '时间法则', effect: '速度+15%', color: '#a78bfa' },
                    space: { name: '空间法则', effect: '精神+15%', color: '#818cf8' },
                    gold: { name: '金之法则', effect: '攻击+15%', color: '#fcd34d' },
                    wood: { name: '木之法则', effect: '血量+15%', color: '#4ade80' },
                    water: { name: '水之法则', effect: '防御+15%', color: '#38bdf8' },
                    fire: { name: '火之法则', effect: '攻击+15%', color: '#f87171' },
                    earth: { name: '土之法则', effect: '防御+15%', color: '#a78bfa' },
                    light: { name: '光之法则', effect: '全属性+10%', color: '#fde68a' },
                    dark: { name: '暗之法则', effect: '全属性+10%', color: '#6b7280' },
                    chaos: { name: '混沌法则', effect: '全属性+20%', color: '#c084fc' },
                  };
                  const info = lawInfo[key] || { name: key, effect: '', color: '#a78bfa' };
                  return (
                    <div
                      key={key}
                      className="px-2 py-1 rounded-md text-[10px] font-bold"
                      style={{
                        backgroundColor: `${info.color}20`,
                        color: info.color,
                        border: `1px solid ${info.color}50`,
                      }}
                      title={info.effect}
                    >
                      {info.name}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* 法则碎片收集进度 */}
          {dt.lawFragments && (
            <div>
              <div className="text-[11px] text-purple-300/80 mb-1.5 flex justify-between">
                <span>法则碎片</span>
                <span>{Object.values(dt.lawFragments).reduce((s, v) => s + v, 0)} / 27</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(['time', 'space', 'gold', 'wood', 'water', 'fire', 'earth', 'light', 'dark'] as const).map((key) => {
                  const count = dt.lawFragments![key] || 0;
                  const lawInfo: Record<string, { name: string; color: string }> = {
                    time: { name: '时', color: '#a78bfa' },
                    space: { name: '空', color: '#818cf8' },
                    gold: { name: '金', color: '#fcd34d' },
                    wood: { name: '木', color: '#4ade80' },
                    water: { name: '水', color: '#38bdf8' },
                    fire: { name: '火', color: '#f87171' },
                    earth: { name: '土', color: '#a78bfa' },
                    light: { name: '光', color: '#fde68a' },
                    dark: { name: '暗', color: '#9ca3af' },
                  };
                  const info = lawInfo[key];
                  return (
                    <div
                      key={key}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold"
                      style={{
                        backgroundColor: count > 0 ? `${info.color}25` : 'transparent',
                        color: count > 0 ? info.color : '#4b5563',
                        border: `1px solid ${count > 0 ? info.color + '50' : '#374151'}`,
                        opacity: count > 0 ? 1 : 0.4,
                      }}
                      title={`${info.name}之碎片 ×${count}`}
                    >
                      {info.name}
                    </div>
                  );
                })}
              </div>
              {dt.lawFragments.chaos !== undefined && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] text-purple-300/80">混沌法则碎片：</span>
                  <span className="text-xs font-bold text-purple-200">{dt.lawFragments.chaos} / 9</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

       {/* 九维属性方格子 */}
      <div className="rounded-2xl border border-cyan-500/30 bg-card/70 backdrop-blur-sm p-3 text-foreground">
        <h3 className="text-sm font-semibold mb-3 text-cyan-300" style={{ fontFamily: "'Noto Serif SC', serif" }}>
          角色属性
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 md:gap-3">
          {attrGrid.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="relative rounded-xl border border-cyan-500/15 bg-gradient-to-br from-card/60 to-background/40 p-3 hover:border-cyan-400/40 transition-all"
                title={item.sub}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${item.color}1A`, color: item.color }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[11px] text-cyan-400 font-medium">{item.label}</span>
                </div>
                <div
                  className="text-lg font-bold tabular-nums leading-tight"
                  style={{ color: item.color, textShadow: `0 0 10px ${item.color}33` }}
                >
                  {item.value}
                </div>
                {item.sub && (
                  <div className="text-[9px] text-cyan-300/70 mt-0.5 leading-tight">{item.sub}</div>
                )}
              </div>
            );
          })}
        </div>

        <ArmorContribution player={player} attributes={attrs}/>{/* 魂灵上阵加成 */}
         {activeSpirits.length > 0 && spiritBonus && (
           <div className="mt-3 pt-3 border-t border-cyan-500/20">
             <div className="flex items-center justify-between mb-2">
               <h4 className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                 <Sparkles className="w-3.5 h-3.5" />
                 魂灵上阵加成（{activeSpirits.length}只）
               </h4>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[10px]">
               {spiritBonus.attack > 0 && (
                 <div className="flex justify-between bg-red-500/10 rounded px-2 py-1">
                   <span className="text-red-300/80">攻击</span>
                   <span className="text-red-400 font-bold">+{(spiritBonus.attack * 100).toFixed(1)}%</span>
                 </div>
               )}
               {spiritBonus.defense > 0 && (
                 <div className="flex justify-between bg-blue-500/10 rounded px-2 py-1">
                   <span className="text-blue-300/80">防御</span>
                   <span className="text-blue-400 font-bold">+{(spiritBonus.defense * 100).toFixed(1)}%</span>
                 </div>
               )}
               {spiritBonus.speed > 0 && (
                 <div className="flex justify-between bg-green-500/10 rounded px-2 py-1">
                   <span className="text-green-300/80">速度</span>
                   <span className="text-green-400 font-bold">+{(spiritBonus.speed * 100).toFixed(1)}%</span>
                 </div>
               )}
               {spiritBonus.spirit > 0 && (
                 <div className="flex justify-between bg-purple-500/10 rounded px-2 py-1">
                   <span className="text-purple-300/80">精神</span>
                   <span className="text-purple-400 font-bold">+{(spiritBonus.spirit * 100).toFixed(1)}%</span>
                 </div>
               )}
               {spiritBonus.hp > 0 && (
                 <div className="flex justify-between bg-rose-500/10 rounded px-2 py-1">
                   <span className="text-rose-300/80">气血</span>
                   <span className="text-rose-400 font-bold">+{(spiritBonus.hp * 100).toFixed(1)}%</span>
                 </div>
               )}
             </div>
           </div>
         )}

         {/* 转世轮回加成 */}
         {reincBonus && (
           <div className="mt-3 pt-3 border-t border-amber-500/20">
             <div className="flex items-center justify-between mb-2">
               <h4 className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                 <RotateCcw className="w-3.5 h-3.5" />
                 转世轮回加成（第 {reincBonus.count + 1} 世）
               </h4>
             </div>
             <div className="space-y-2">
               {/* 基础属性百分比加成 */}
               {reincBonus.baseAttrPct > 0 && (
                 <div className="rounded bg-amber-500/10 px-2.5 py-1.5">
                   <div className="flex items-center justify-between text-[11px] mb-1">
                     <span className="text-amber-200/80">觉醒武魂基础属性</span>
                     <span className="text-amber-300 font-bold">+{(reincBonus.baseAttrPct * 100).toFixed(0)}%</span>
                   </div>
                   <div className="grid grid-cols-5 gap-1 text-[9px] text-amber-200/70">
                     <div className="text-center">攻 +{Math.round(reincBonus.attackPctValue)}</div>
                     <div className="text-center">防 +{Math.round(reincBonus.defensePctValue)}</div>
                     <div className="text-center">速 +{Math.round(reincBonus.speedPctValue)}</div>
                     <div className="text-center">精 +{Math.round(reincBonus.spiritPctValue)}</div>
                     <div className="text-center">血 +{Math.round(reincBonus.hpPctValue)}</div>
                   </div>
                 </div>
               )}
               {/* 固定攻击加成 + 魂环年限加成 */}
               <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                 {reincBonus.attackFlat > 0 && (
                   <div className="flex justify-between bg-red-500/10 rounded px-2 py-1">
                     <span className="text-red-300/80">攻击（固定）</span>
                     <span className="text-red-400 font-bold">+{reincBonus.attackFlat}</span>
                   </div>
                 )}
                 {player.reincarnation?.ringYearBonusPct && player.reincarnation.ringYearBonusPct > 0 && (
                   <div className="flex justify-between bg-purple-500/10 rounded px-2 py-1">
                     <span className="text-purple-300/80">魂环上限</span>
                     <span className="text-purple-400 font-bold">+{Math.round(player.reincarnation.ringYearBonusPct * 100)}%</span>
                   </div>
                 )}
               </div>
             </div>
           </div>
         )}

          {hasLiehun(player) && <div className="mt-3 pt-3 border-t border-purple-500/20 text-xs space-y-1" data-liehun-panel>
            <h4 className="font-semibold text-purple-300">裂魂神戟 · 碎念汲取</h4>
            <div>本世永久精神力 +{formatNumber(readNianBonus(player.nianBonus).totalSpirit)}</div>
            <div>精神转攻击 +{formatNumber(attrs.spirit * 3)} · 已结算 {readNianBonus(player.nianBonus).count} 场</div>
            <p className="text-muted-foreground">胜利后每1京玩家直接扣血增长1点精神；升灵台与轮回之影不计入，转世重置。</p>
          </div>}
          {/* 🔴 混沌无极武魂·吞噬天赋面板 */}
           {(player.martialSoul.name === '混沌无极' || (player.isTwinSoul && player.secondSoul?.name === '混沌无极')) && player.devour && player.devour.count > 0 && (
             <div className="mt-3 pt-3 border-t border-purple-500/20">
               <div className="flex items-center justify-between mb-2">
                 <h4 className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                   🌀 吞噬天赋
                 </h4>
                 <span className="text-[10px] text-purple-300/80">
                   已吞噬 <span className="font-bold">{player.devour.count}</span> 次
                 </span>
               </div>
               <div className="grid grid-cols-5 gap-1 text-[9px] mb-2">
                 <div className="rounded bg-purple-500/10 px-1.5 py-1 text-center">
                   <div className="text-purple-200/70">攻击</div>
                   <div className="text-purple-300 font-bold tabular-nums">+{formatNumber(player.devour.totalAttack || 0)}</div>
                 </div>
                 <div className="rounded bg-purple-500/10 px-1.5 py-1 text-center">
                   <div className="text-purple-200/70">防御</div>
                   <div className="text-purple-300 font-bold tabular-nums">+{formatNumber(player.devour.totalDefense || 0)}</div>
                 </div>
                 <div className="rounded bg-purple-500/10 px-1.5 py-1 text-center">
                   <div className="text-purple-200/70">速度</div>
                   <div className="text-purple-300 font-bold tabular-nums">+{formatNumber(player.devour.totalSpeed || 0)}</div>
                 </div>
                 <div className="rounded bg-purple-500/10 px-1.5 py-1 text-center">
                   <div className="text-purple-200/70">精神</div>
                   <div className="text-purple-300 font-bold tabular-nums">+{formatNumber(player.devour.totalSpirit || 0)}</div>
                 </div>
                 <div className="rounded bg-purple-500/10 px-1.5 py-1 text-center">
                   <div className="text-purple-200/70">血量</div>
                   <div className="text-purple-300 font-bold tabular-nums">+{formatNumber(player.devour.totalHp || 0)}</div>
                 </div>
               </div>
               {player.devour.backlashCount > 0 && (
                 <div className="pt-2 border-t border-red-500/20">
                   <div className="flex items-center justify-between mb-1.5">
                     <span className="text-[10px] font-semibold text-red-400 flex items-center gap-1">
                       ⚠️ 吞噬反噬
                     </span>
                     <span className="text-[10px] text-red-400/80">
                       已反噬 <span className="font-bold">{player.devour.backlashCount}</span> 次
                     </span>
                   </div>
                   <div className="grid grid-cols-5 gap-1 text-[9px]">
                     <div className="rounded bg-red-500/10 px-1.5 py-1 text-center">
                       <div className="text-red-300/70">攻击</div>
                       <div className="text-red-400 font-bold tabular-nums">-{formatNumber(player.devour.backlashAttack || 0)}</div>
                     </div>
                     <div className="rounded bg-red-500/10 px-1.5 py-1 text-center">
                       <div className="text-red-300/70">防御</div>
                       <div className="text-red-400 font-bold tabular-nums">-{formatNumber(player.devour.backlashDefense || 0)}</div>
                     </div>
                     <div className="rounded bg-red-500/10 px-1.5 py-1 text-center">
                       <div className="text-red-300/70">速度</div>
                       <div className="text-red-400 font-bold tabular-nums">-{formatNumber(player.devour.backlashSpeed || 0)}</div>
                     </div>
                     <div className="rounded bg-red-500/10 px-1.5 py-1 text-center">
                       <div className="text-red-300/70">精神</div>
                       <div className="text-red-400 font-bold tabular-nums">-{formatNumber(player.devour.backlashSpirit || 0)}</div>
                     </div>
                     <div className="rounded bg-red-500/10 px-1.5 py-1 text-center">
                       <div className="text-red-300/70">血量</div>
                       <div className="text-red-400 font-bold tabular-nums">-{formatNumber(player.devour.backlashHp || 0)}</div>
                     </div>
                   </div>
                 </div>
               )}
             </div>
           )}
      </div>

       {/* 三页签（成神且已转化神装时，魂骨替换为神装） */}
       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-cyan-900/30 text-cyan-200">
          <TabsTrigger value="equipment" className="text-xs md:text-sm py-2 md:py-3">装备</TabsTrigger>
          <TabsTrigger
            value={player?.divineArmor?.hasArmor ? 'divineArmor' : 'soulBone'}
            className="text-xs md:text-sm py-2 md:py-3"
          >
            {player?.divineArmor?.hasArmor ? '神装' : '魂骨'}
          </TabsTrigger>
          <TabsTrigger value="soulRing" className="text-xs md:text-sm py-2 md:py-3">魂环</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="mt-3">
          <div className="grid grid-cols-2 gap-3">
            {EQUIP_SLOTS.map((slot) => {
              const item = player.equipment[slot.key];
              return (
                <div key={slot.key} className="flex flex-col items-center">
                  <ItemSlotIcon
                    item={item}
                    label={slot.label}
                    onClick={() => {
                      if (item) {
                        setSelectedEquip({ slot: slot.key, item });
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
        </TabsContent>

         <TabsContent value="soulBone" className="mt-3">
           <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
            {BONE_SLOTS.map((slot) => {
              const item = player.soulBones[slot.key as keyof ISoulBoneSlots];
              return (
                <div key={slot.key} className="flex flex-col items-center">
                  <ItemSlotIcon
                    item={item}
                    label={slot.label}
                    showBoneYear={!!item && item.type === 'soulBone'}
                    onClick={() => {
                      if (item) {
                        setSelectedEquip({ slot: slot.key, item });
                      }
                    }}
                  />
                </div>
              );
             })}            
           </div>
           {/* 🔴 v15.0 神装转化入口：成神 + 魂骨全满 且 未转化 */}
           {player.divineTrial?.inherited &&
             Object.values(player.soulBones || {}).filter((b) => !!b).length >= 7 &&
             !player.divineArmor?.hasArmor && (
               <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/15 to-yellow-500/15 border border-amber-500/40">
                 <div className="flex items-center gap-2 mb-2">
                   <span className="text-lg">👑</span>
                   <div className="flex-1">
                     <div className="text-sm font-bold text-amber-300">神装觉醒</div>
                     <div className="text-xs text-amber-200/70">融合全身七块魂骨，凝聚成神之铠甲</div>
                   </div>
                 </div>
                 <button
                   onClick={() => setShowArmorConvert(true)}
                   className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 font-bold text-sm hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20"
                 >
                   ✨ 融合魂骨 · 转化神装
                 </button>
               </div>
             )}
         </TabsContent>

         {/* 🔴 v15.0 神装 Tab */}
         <TabsContent value="divineArmor" className="mt-3">
           {player.divineArmor?.hasArmor && player.divineArmor.armorItem ? (
             <div className="space-y-4">
               {/* 神装主展示 */}
               <div className="relative p-5 rounded-2xl bg-gradient-to-b from-amber-500/20 via-yellow-500/10 to-transparent border-2 border-amber-400/50 overflow-hidden">
                 {/* 光晕装饰 */}
                 <div className="absolute inset-0 pointer-events-none">
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-amber-400/20 blur-3xl" />
                 </div>
                 <div className="relative flex flex-col items-center">
                   <div
                     className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-bold border-[3px] mb-3 animate-pulse"
                     style={{
                       borderColor: '#fcd34d',
                       backgroundColor: 'rgba(252, 211, 77, 0.15)',
                       color: '#fcd34d',
                       boxShadow: '0 0 30px rgba(252, 211, 77, 0.4), inset 0 0 20px rgba(252, 211, 77, 0.2)',
                       borderWidth: '3px',
                     }}
                   >
                     神
                   </div>
                   <h3 className="text-xl font-bold text-amber-300">{player.divineArmor.armorName || '神装'}</h3>
                   <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
                     <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                       神级 · 唯一
                     </span>
                     {player.divineArmor.resonanceActive && (
                       <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                         ✨ 神器共鸣中
                       </span>
                     )}
                   </div>
                 </div>
               </div>

               {/* 神装属性 */}
               <div className="rounded-xl bg-card/50 p-3 space-y-1.5 text-sm">
                 <div className="text-xs font-semibold text-amber-300 mb-2 flex items-center gap-1.5">
                   <span>⚜️</span> 神装属性（原魂骨属性 × 120%）
                 </div>
                 {player.divineArmor.armorItem.attributes?.attack != null && player.divineArmor.armorItem.attributes.attack > 0 && (
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">攻击</span>
                     <span className="text-red-400 font-medium">+{formatNumber(Math.round(player.divineArmor.armorItem.attributes.attack))}</span>
                   </div>
                 )}
                 {player.divineArmor.armorItem.attributes?.defense != null && player.divineArmor.armorItem.attributes.defense > 0 && (
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">防御</span>
                     <span className="text-blue-400 font-medium">+{formatNumber(Math.round(player.divineArmor.armorItem.attributes.defense))}</span>
                   </div>
                 )}
                 {player.divineArmor.armorItem.attributes?.speed != null && player.divineArmor.armorItem.attributes.speed > 0 && (
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">速度</span>
                     <span className="text-green-400 font-medium">+{formatNumber(Math.round(player.divineArmor.armorItem.attributes.speed))}</span>
                   </div>
                 )}
                 {player.divineArmor.armorItem.attributes?.spirit != null && player.divineArmor.armorItem.attributes.spirit > 0 && (
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">精神</span>
                     <span className="text-purple-400 font-medium">+{formatNumber(Math.round(player.divineArmor.armorItem.attributes.spirit))}</span>
                   </div>
                 )}
                 {player.divineArmor.armorItem.attributes?.hp != null && player.divineArmor.armorItem.attributes.hp > 0 && (
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">气血</span>
                     <span className="text-pink-400 font-medium">+{formatNumber(Math.round(player.divineArmor.armorItem.attributes.hp))}</span>
                   </div>
                 )}
                 {player.divineArmor.armorItem.attributes?.critRate != null && player.divineArmor.armorItem.attributes.critRate > 0 && (
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">暴击率</span>
                     <span className="text-yellow-400 font-medium">+{player.divineArmor.armorItem.attributes.critRate.toFixed(2)}%</span>
                   </div>
                 )}
                 {player.divineArmor.armorItem.attributes?.critDmg != null && player.divineArmor.armorItem.attributes.critDmg > 0 && (
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">爆伤</span>
                     <span className="text-orange-400 font-medium">+{player.divineArmor.armorItem.attributes.critDmg.toFixed(2)}%</span>
                   </div>
                 )}
                 {player.divineArmor.armorItem.attributes?.allAttr != null && player.divineArmor.armorItem.attributes.allAttr > 0 && (
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">全属性</span>
                     <span className="text-amber-400 font-medium">+{player.divineArmor.armorItem.attributes.allAttr.toFixed(2)}%</span>
                   </div>
                 )}
               </div>

               {/* 神装-神器共鸣说明 */}
               <div className={`rounded-xl p-3 border text-xs space-y-1 ${
                 player.divineArmor.resonanceActive
                   ? 'bg-purple-500/10 border-purple-500/40 text-purple-200'
                   : 'bg-muted/30 border-border/50 text-muted-foreground'
               }`}>
                 <div className="font-semibold flex items-center gap-1.5">
                   {player.divineArmor.resonanceActive ? '✨ 神器共鸣已激活' : '🔒 神器共鸣未激活'}
                 </div>
                 <div>
                   {player.divineArmor.resonanceActive
                     ? '神装与神器共鸣共振，神器神技造成的伤害翻倍！'
                     : '拔出神器后，神装将与神器产生共鸣，神器神技伤害翻倍。'}
                 </div>
               </div>

               {/* 操作按钮 */}
               <div className="grid grid-cols-2 gap-2">
                 <button
                   onClick={() => {
                     setArmorNameInput(player.divineArmor?.armorName || '');
                     setShowArmorRename(true);
                   }}
                   className="py-2 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 font-medium text-sm hover:bg-amber-500/20 transition-colors"
                 >
                   ✏️ 命名
                 </button>
                 <button
                   disabled
                   className="py-2 rounded-lg border border-border/50 bg-muted/20 text-muted-foreground font-medium text-sm cursor-not-allowed"
                 >
                   已装备
                 </button>
               </div>

               {/* 注意提示 */}
               <div className="text-[11px] text-muted-foreground/70 leading-relaxed px-1">
                  ⚠️ 神装由魂骨融合而成，无法卸下、无法更换、无法出售。转世后神装消失，需重新成神并集齐7块魂骨才可重新融合。
               </div>
             </div>
           ) : (
             <div className="flex flex-col items-center py-10 text-muted-foreground">
               <div className="text-4xl mb-3">🔒</div>
               <div className="text-sm">神装未开启</div>
             </div>
           )}
         </TabsContent>

         <TabsContent value="soulRing" className="mt-3">
          {/* 双生武魂切换 Tab */}
          {player.isTwinSoul && player.secondSoul && (
            <div className="flex gap-1 mb-3 p-0.5 rounded-lg bg-card/40 border border-border/50">
              <button
                onClick={() => setSoulRingTab(0)}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${soulRingTab === 0 ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40' : 'text-muted-foreground hover:text-foreground border border-transparent'}`}
              >
                主修 · {player.martialSoul.name}
              </button>
              <button
                onClick={() => setSoulRingTab(1)}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${soulRingTab === 1 ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40' : 'text-muted-foreground hover:text-foreground border border-transparent'}`}
              >
                次修 · {player.secondSoul.name}
              </button>
            </div>
          )}
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold">
              魂环 ({soulRingTab === 0 ? player.soulRings.length : (player.secondSoulRings ?? []).length}/9)
            </h4>
            {(soulRingTab === 0 ? player.soulRings.length > 0 : (player.secondSoulRings ?? []).length > 0) && (
              <button
                 onClick={() => { setRingReleaseSoul(soulRingTab); setShowRingRelease(true); }}
                className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-cyan-800/50 to-cyan-900/50 border border-cyan-500/40 text-cyan-200 font-medium hover:from-cyan-700/60 hover:to-cyan-700/60 transition-all"
              >
                释放魂环
              </button>
            )}
          </div>
          {/* 修炼属性伤害计算说明 */}
          <div className="mb-3 rounded-lg p-2.5 bg-cyan-900/20 border border-cyan-500/30 text-[11px] flex items-center gap-2 text-cyan-200">
             <Sparkles className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
             <span>
               {soulRingTab === 0 ? '主修武魂' : '次修武魂'}修炼属性为 <span className="font-bold text-cyan-300">{soulRingTab === 0 ? cultivationAttrLabel : secondCultivationAttrLabel}</span>，
               魂技伤害按 <span className="font-bold text-cyan-300">
               {(soulRingTab === 0 ? player.martialSoul.cultivationAttr : player.secondSoul?.cultivationAttr) === 'strength' ? '攻击力'
                 : (soulRingTab === 0 ? player.martialSoul.cultivationAttr : player.secondSoul?.cultivationAttr) === 'spirit' ? '精神力'
                 : (soulRingTab === 0 ? player.martialSoul.cultivationAttr : player.secondSoul?.cultivationAttr) === 'agility' ? '速度'
                 : (soulRingTab === 0 ? player.martialSoul.cultivationAttr : player.secondSoul?.cultivationAttr) === 'defense' ? '防御力'
                 : (soulRingTab === 0 ? player.martialSoul.cultivationAttr : player.secondSoul?.cultivationAttr) === 'support' ? '精神力'
                 : '全属性最高值'} 计算</span>
             </span>
           </div>
          {player.level >= 10 && (soulRingTab === 0 ? player.soulRings.length : (player.secondSoulRings ?? []).length) < getMaxRings(player.level) && (
            <div className="mb-3 rounded-lg p-2.5 bg-cyan-900/30 border border-cyan-500/20 text-[11px] flex items-center gap-2 text-cyan-200">
              <span>⚠️ 有未吸收的魂环槽位，前往魂环页面吸收后可继续修炼</span>
            </div>
          )}
          {/* 魂环圆环阵列（竖直） */}
          <div className="flex flex-col items-center py-2 gap-2.5">
            {Array.from({ length: 9 }).map((_, i) => {
              const ring = (soulRingTab === 0 ? player.soulRings : (player.secondSoulRings ?? []))[i];
              const requiredLv = getRequiredLevelForRing(i);
              const unlocked = player.level >= requiredLv;
              const ringSize = 56 + i * 5;
              return (
                <div
                  key={i}
                  className="relative flex items-center justify-center"
                  style={{ width: ringSize + 8, height: ringSize + 8 }}
                >
                  <span className="absolute -left-10 text-[10px] text-cyan-400 w-8 text-right">
                    第{i + 1}环
                  </span>
                  {ring ? (
                    <SoulRing
                      color={ring.color}
                      years={ring.years}
                      beastAttribute={ring.beastAttribute}
                      size={ringSize}
                      animate
                    />
                  ) : unlocked ? (
                    <div className="relative flex items-center justify-center" style={{ width: ringSize, height: ringSize }}>
                      <div
                        className="rounded-full border-2 border-dashed"
                        style={{ width: ringSize, height: ringSize, borderColor: 'rgba(148,163,184,0.25)' }}
                      />
                      <div
                        className="absolute rounded-full border border-dashed"
                        style={{ width: ringSize * 0.6, height: ringSize * 0.6, borderColor: 'rgba(148,163,184,0.12)' }}
                      />
                      <span className="absolute text-[9px] text-cyan-400/80">空位</span>
                    </div>
                  ) : (
                    <div className="relative flex items-center justify-center" style={{ width: ringSize, height: ringSize }}>
                      <div
                        className="rounded-full border border-dashed opacity-40"
                        style={{ width: ringSize, height: ringSize, borderColor: 'rgba(148,163,184,0.2)' }}
                      />
                      <span className="absolute text-[9px] text-cyan-400/70">{requiredLv}级</span>
                    </div>
                  )}
                   {ring && (
                      <span
                        className="absolute -right-10 text-[10px] font-bold w-10 text-left"
                        style={{ color: RING_DISPLAY_COLOR[ring.color], textShadow: `0 0 6px ${RING_DISPLAY_COLOR[ring.color]}80` }}
                      >
                       {ring.qualityLabel}
                     </span>
                   )}
                </div>
              );
            })}
          </div>
          {/* 已吸收魂环详细列表（memo 优化，避免父组件无关 state 更新导致重渲染） */}
          {(soulRingTab === 0 ? player.soulRings.length > 0 : (player.secondSoulRings ?? []).length > 0) && (
            <SoulRingDetailList rings={soulRingTab === 0 ? player.soulRings : (player.secondSoulRings ?? [])} />
          )}

          {/* 百级神环 */}
          {dt?.inherited && dt.divineSoulRing && (
            <div className="mt-5">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent">
                    神环（百级神位）
                  </span>
                </h4>
                <button
                  onClick={() => setShowDivineRingPicker((v) => !v)}
                  className="text-xs px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-200 flex items-center gap-1 hover:bg-amber-500/30 transition-colors"
                >
                  <Paintbrush className="w-3 h-3" />
                  自定义颜色
                </button>
              </div>

              {/* 颜色选择器 */}
              <AnimatePresence>
                {showDivineRingPicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-amber-500/30 mb-3 space-y-3">
                      <p className="text-xs text-muted-foreground">选择神环颜色，彰显你的神位特色</p>
                      <div className="grid grid-cols-8 gap-2">
                        {['#ffd700', '#ff6b6b', '#4ecdc4', '#a78bfa', '#60a5fa', '#34d399', '#f472b6', '#fb923c', '#ffffff', '#000000', '#facc15', '#22d3ee', '#f87171', '#c084fc', '#4ade80', '#fde047'].map((c) => (
                          <button
                            key={c}
                            onClick={() => { setDivineRingColor(c); }}
                            className={`w-full aspect-square rounded-lg border-2 transition-transform hover:scale-110 ${divineRingColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: c, boxShadow: `0 0 8px ${c}80` }}
                            aria-label={`神环颜色 ${c}`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground shrink-0">自定义色值</label>
                        <input
                          type="text"
                          value={divineRingColor}
                          onChange={(e) => {
                            const v = e.target.value.trim();
                            if (/^#[0-9a-fA-F]{6}$/.test(v)) setDivineRingColor(v);
                          }}
                          className="flex-1 px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-foreground"
                          placeholder="#ffd700"
                        />
                        <input
                          type="color"
                          value={divineRingColor}
                          onChange={(e) => setDivineRingColor(e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer bg-transparent border border-slate-600"
                          aria-label="颜色选择器"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 神环大展示（科技感细环）*/}
              <div className="relative flex items-center justify-center py-4">
                <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
                  {/* 外层淡淡光晕 */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute rounded-full"
                    style={{
                      width: 120,
                      height: 120,
                      left: '50%',
                      top: '50%',
                      marginLeft: -60,
                      marginTop: -60,
                      background: `conic-gradient(from 0deg, transparent 0%, ${divineRingColor}40 30%, ${divineRingColor}70 50%, ${divineRingColor}40 70%, transparent 100%)`,
                      filter: 'blur(6px)',
                      opacity: 0.5,
                    }}
                  />
                  {/* 神环本体 - 细环 */}
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    className="rounded-full relative"
                    style={{
                      width: 110,
                      height: 110,
                      border: `2px solid ${divineRingColor}`,
                      boxShadow: `0 0 12px ${divineRingColor}aa, 0 0 20px ${divineRingColor}40, inset 0 0 8px ${divineRingColor}30`,
                    }}
                  >
                    {/* 内圈细环 */}
                    <div
                      className="absolute rounded-full"
                      style={{
                        inset: 6,
                        border: `1px solid ${divineRingColor}70`,
                      }}
                    />
                    {/* 科技感刻度线 */}
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute left-1/2 -translate-x-1/2"
                        style={{
                          top: -1,
                          width: 2,
                          height: 5,
                          backgroundColor: divineRingColor,
                          transform: `translateX(-50%) rotate(${i * 30}deg)`,
                          transformOrigin: '50% 56px',
                          borderRadius: 1,
                          boxShadow: `0 0 4px ${divineRingColor}`,
                        }}
                      />
                    ))}
                    {/* 四个科技亮点 */}
                    {[0, 90, 180, 270].map((deg) => (
                      <div
                        key={`dot-${deg}`}
                        className="absolute rounded-full"
                        style={{
                          width: 5,
                          height: 5,
                          left: '50%',
                          top: 0,
                          marginLeft: -2.5,
                          marginTop: -1.5,
                          backgroundColor: '#fff',
                          transform: `rotate(${deg}deg)`,
                          transformOrigin: '50% 56px',
                          boxShadow: `0 0 6px ${divineRingColor}, 0 0 12px ${divineRingColor}`,
                        }}
                      />
                    ))}
                  </motion.div>
                  {/* 中心文字 */}
                  <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                    <span className="text-[10px] text-muted-foreground/70">神级</span>
                    <span className="text-sm font-bold tracking-wider" style={{ color: divineRingColor, textShadow: `0 0 8px ${divineRingColor}aa` }}>神环</span>
                  </div>
                </div>
              </div>

              {/* 神技信息 */}
              <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-slate-900/50 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold" style={{ color: divineRingColor }}>{dt.divineSoulRing.skillName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: `${divineRingColor}30`, color: divineRingColor }}>
                    神技
                  </span>
                </div>
                 <p className="text-xs text-muted-foreground">{dt.divineSoulRing.skillDesc}</p>
                 <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                   <span className="text-amber-300/80 flex items-center gap-1">
                     <Crown className="w-3 h-3" />
                     神级魂环 · 年限无尽
                   </span>
                   <span className="text-cyan-300/90 flex items-center gap-1">
                     属性：{dt.divineSoulRing.beastAttribute || '光属性'}
                   </span>
                 </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 装备详情弹窗 */}
      <AnimatePresence>
        {selectedEquip?.item && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedEquip(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              transition={{ type: 'tween', duration: 0.2 }}
               className="w-full max-w-md bg-card/95 rounded-2xl border-2 border-cyan-500 shadow-xl max-h-[82vh] overflow-y-auto text-foreground backdrop-blur-md"
               onClick={(e) => e.stopPropagation()}
             >
               <button
                 onClick={() => setSelectedEquip(null)}
                 className="absolute top-2.5 right-2.5 z-10 p-1 rounded-full bg-card/70 text-cyan-400 hover:text-cyan-200 hover:bg-card transition-colors"
               >
                 <X className="h-4 w-4" />
               </button>

               <div className="p-4">
                 <div className="flex flex-col items-center text-center mb-3">
                   <div
                     className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold border-2 mb-2"
                     style={{
                       borderColor: selectedEquip.item.type === 'soulBone' && selectedEquip.item.qualityColor
                         ? selectedEquip.item.qualityColor
                         : QUALITY_COLOR[selectedEquip.item.quality as keyof typeof QUALITY_COLOR],
                       backgroundColor: (selectedEquip.item.type === 'soulBone' && selectedEquip.item.qualityColor
                         ? selectedEquip.item.qualityColor
                         : QUALITY_COLOR[selectedEquip.item.quality as keyof typeof QUALITY_COLOR]) + '15',
                       color: selectedEquip.item.type === 'soulBone' && selectedEquip.item.qualityColor
                         ? selectedEquip.item.qualityColor
                         : QUALITY_COLOR[selectedEquip.item.quality as keyof typeof QUALITY_COLOR],
                       boxShadow: `0 0 16px ${
                         selectedEquip.item.type === 'soulBone' && selectedEquip.item.qualityColor
                           ? selectedEquip.item.qualityColor
                           : QUALITY_COLOR[selectedEquip.item.quality as keyof typeof QUALITY_COLOR]
                       }30`,
                     }}
                   >
                     {selectedEquip.item.iconChar}
                   </div>
                   <h3 className="font-bold text-lg">{selectedEquip.item.name}</h3>
                   <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
                     <span
                       className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                       style={{
                         backgroundColor: (selectedEquip.item.type === 'soulBone' && selectedEquip.item.qualityColor
                           ? selectedEquip.item.qualityColor
                           : QUALITY_COLOR[selectedEquip.item.quality as keyof typeof QUALITY_COLOR]) + '20',
                         color: selectedEquip.item.type === 'soulBone' && selectedEquip.item.qualityColor
                           ? selectedEquip.item.qualityColor
                           : QUALITY_COLOR[selectedEquip.item.quality as keyof typeof QUALITY_COLOR],
                       }}
                     >
                       {selectedEquip.item.type === 'soulBone'
                         ? (selectedEquip.item.soulBoneYearsLabel || '百年') + '魂骨'
                         : QUALITY_LABEL[selectedEquip.item.quality as keyof typeof QUALITY_LABEL]}
                     </span>
                     <span className="text-[10px] text-muted-foreground">
                        {selectedEquip.item.type === 'soulGuide' ? '魂导器' : '魂骨'}
                        {selectedEquip.item.crafter && ` · ${selectedEquip.item.crafter} 制`}
                      </span>
                   </div>
                 </div>

                 <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                   {selectedEquip.item.type === 'soulBone' && selectedEquip.item.soulBoneYearsLabel
                     ? `【${selectedEquip.item.soulBoneYearsLabel}魂骨】${selectedEquip.item.description}`
                     : selectedEquip.item.description}
                 </p>

                {/* 魂骨：显示具体年限 */}
                 {selectedEquip.item.type === 'soulBone' && selectedEquip.item.soulBoneYears != null && (
                   <div className="text-[11px] text-amber-400 mb-2.5 flex items-center gap-1.5">
                     <span className="w-1 h-1 rounded-full bg-amber-400" />
                     年限：<span className="font-bold">{Number(selectedEquip.item.soulBoneYears).toLocaleString()} 年</span>
                     {selectedEquip.item.beastAttribute && <span className="text-muted-foreground">· 属性：{selectedEquip.item.beastAttribute}</span>}
                   </div>
                 )}

                 {selectedEquip.item.attributes && (
                   <div className="rounded-xl bg-card/50 p-2.5 mb-3 text-xs space-y-1">
                     <div className="text-[10px] font-semibold text-muted-foreground mb-1.5">属性加成</div>
                    {/* 自制魂导器：v2.0数值加成，v1.0百分比加成 */}
                    {selectedEquip.item.type === 'soulGuide' && selectedEquip.item.craftable ? (
                       <>
                         {selectedEquip.item.craftVersion === 2 ? (
                           <>
                             <div className="flex justify-between">
                               <span className="text-muted-foreground">攻击</span>
                               <span className="text-red-600 font-medium">+{formatNumber(Math.round(selectedEquip.item.attributes.attack ?? 0))}</span>
                             </div>
                             <div className="flex justify-between">
                               <span className="text-muted-foreground">防御</span>
                               <span className="text-blue-600 font-medium">+{formatNumber(Math.round(selectedEquip.item.attributes.defense ?? 0))}</span>
                             </div>
                             <div className="flex justify-between">
                               <span className="text-muted-foreground">速度</span>
                               <span className="text-green-600 font-medium">+{formatNumber(Math.round(selectedEquip.item.attributes.speed ?? 0))}</span>
                             </div>
                             <div className="flex justify-between">
                               <span className="text-muted-foreground">精神</span>
                               <span className="text-cyan-300 font-medium">+{formatNumber(Math.round(selectedEquip.item.attributes.spirit ?? 0))}</span>
                             </div>
                             <div className="flex justify-between">
                               <span className="text-muted-foreground">气血</span>
                               <span className="text-cyan-400 font-medium">+{formatNumber(Math.round(selectedEquip.item.attributes.hp ?? 0))}</span>
                             </div>
                           </>
                         ) : (
                           <>
                             <div className="flex justify-between">
                               <span className="text-muted-foreground">攻击</span>
                               <span className="text-red-600 font-medium">+{Number((selectedEquip.item.attributes.attack ?? 0)).toFixed(1)}%</span>
                             </div>
                             <div className="flex justify-between">
                               <span className="text-muted-foreground">防御</span>
                               <span className="text-blue-600 font-medium">+{Number((selectedEquip.item.attributes.defense ?? 0)).toFixed(1)}%</span>
                             </div>
                             <div className="flex justify-between">
                               <span className="text-muted-foreground">速度</span>
                               <span className="text-green-600 font-medium">+{Number((selectedEquip.item.attributes.speed ?? 0)).toFixed(1)}%</span>
                             </div>
                             <div className="flex justify-between">
                               <span className="text-muted-foreground">精神</span>
                               <span className="text-cyan-300 font-medium">+{Number((selectedEquip.item.attributes.spirit ?? 0)).toFixed(1)}%</span>
                             </div>
                             <div className="flex justify-between">
                               <span className="text-muted-foreground">气血</span>
                               <span className="text-cyan-400 font-medium">+{Number((selectedEquip.item.attributes.hp ?? 0)).toFixed(1)}%</span>
                             </div>
                           </>
                         )}
                         <div className="flex justify-between">
                           <span className="text-muted-foreground">暴击率</span>
                           <span className="text-yellow-600 font-medium">+{Number((selectedEquip.item.attributes.critRate ?? 0)).toFixed(1)}%</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-muted-foreground">爆伤</span>
                           <span className="text-orange-600 font-medium">+{Number((selectedEquip.item.attributes.critDmg ?? 0)).toFixed(1)}%</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-muted-foreground">全属性</span>
                           <span className="text-cyan-300 font-medium">+{Number((selectedEquip.item.attributes.allAttr ?? 0)).toFixed(1)}%</span>
                         </div>
                       </>
                    ) : (
                      <>
                        {/* 商店魂导器 / 魂骨：数值显示（大数字带万/亿单位） */}
                        {selectedEquip.item.attributes.attack !== undefined && selectedEquip.item.attributes.attack > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">攻击</span>
                            <span className="text-red-600 font-medium">+{formatNumber(Math.round(selectedEquip.item.attributes.attack))}</span>
                          </div>
                        )}
                        {selectedEquip.item.attributes.defense !== undefined && selectedEquip.item.attributes.defense > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">防御</span>
                            <span className="text-blue-600 font-medium">+{formatNumber(Math.round(selectedEquip.item.attributes.defense))}</span>
                          </div>
                        )}
                        {selectedEquip.item.attributes.speed !== undefined && selectedEquip.item.attributes.speed > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">速度</span>
                            <span className="text-green-600 font-medium">+{formatNumber(Math.round(selectedEquip.item.attributes.speed))}</span>
                          </div>
                        )}
                        {selectedEquip.item.attributes.spirit !== undefined && selectedEquip.item.attributes.spirit > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">精神</span>
                            <span className="text-cyan-300 font-medium">+{formatNumber(Math.round(selectedEquip.item.attributes.spirit))}</span>
                          </div>
                        )}
                        {selectedEquip.item.attributes.hp !== undefined && selectedEquip.item.attributes.hp > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">气血</span>
                            <span className="text-cyan-400 font-medium">+{formatNumber(Math.round(selectedEquip.item.attributes.hp))}</span>
                          </div>
                        )}
                        {selectedEquip.item.attributes.critRate !== undefined && selectedEquip.item.attributes.critRate > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">暴击率</span>
                            <span className="text-yellow-600 font-medium">+{selectedEquip.item.attributes.critRate}%</span>
                          </div>
                        )}
                        {selectedEquip.item.attributes.critDmg !== undefined && selectedEquip.item.attributes.critDmg > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">爆伤</span>
                            <span className="text-orange-600 font-medium">+{selectedEquip.item.attributes.critDmg}%</span>
                          </div>
                        )}
                        {selectedEquip.item.attributes.soulPower !== undefined && selectedEquip.item.attributes.soulPower > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">魂力</span>
                            <span className="text-sky-400 font-medium">+{formatNumber(Math.round(selectedEquip.item.attributes.soulPower))}</span>
                          </div>
                        )}
                        </>
                     )}
                   </div>
                 )}

                 {/* 魂导核心宝石特殊效果 */}
                 {selectedEquip.item.type === 'soulGuide' && selectedEquip.item.specialEffect && (
                   <div className="rounded-xl bg-card/50 p-2.5 mb-3 text-xs border-t-0">
                     <div className="text-[10px] font-semibold text-muted-foreground mb-1.5">魂导核心</div>
                     <div className="flex items-center gap-2">
                       <div
                         className="w-6 h-6 rounded-full shrink-0 border-2"
                         style={{
                           borderColor: selectedEquip.item.specialEffect.color,
                           backgroundColor: selectedEquip.item.specialEffect.color + '20',
                           boxShadow: `0 0 8px ${selectedEquip.item.specialEffect.color}60`,
                         }}
                       />
                       <div className="flex-1 min-w-0">
                         <div className="font-medium" style={{ color: selectedEquip.item.specialEffect.color }}>
                           {selectedEquip.item.specialEffect.name}
                         </div>
                         <div className="text-[10px] text-muted-foreground">{selectedEquip.item.specialEffect.desc}</div>
                       </div>
                     </div>
                   </div>
                 )}

                  {/* 魂骨属性克制提示 */}
                 {selectedEquip.item.type === 'soulBone'  && (() => {
                   const boneAttr = selectedEquip.item.beastAttribute ?? inferElementFromName(selectedEquip.item.name);
                   // 使用 gameStore 中的 calcAttributeBonus 统一归一化逻辑，确保显示与计算一致
                   // 单块魂骨测试：传入 1 个魂环（空）+ 1 块魂骨（当前），看是否有 bone match
                  const testResult = calcAttributeBonus(
                    player.martialSoul.extremeAttribute && player.martialSoul.extremeAttribute !== '无'
                      ? player.martialSoul.extremeAttribute
                      : player.martialSoul.element || '无属性',
                    [],
                    [{ name: selectedEquip.item.name, beastAttribute: selectedEquip.item.beastAttribute }],
                    { quality: player.martialSoul.quality, extremeAttribute: player.martialSoul.extremeAttribute }
                  );
                  const isMatch = testResult.hasBoneMatch;
                  // 第二武魂也检查
                  let secondMatch = false;
                  if (player.isTwinSoul && player.secondSoul) {
                    const secondEl = player.secondSoul.extremeAttribute && player.secondSoul.extremeAttribute !== '无'
                      ? player.secondSoul.extremeAttribute
                      : (player.secondSoul.element || '无属性');
                    const secondResult = calcAttributeBonus(
                      secondEl,
                      [],
                      [{ name: selectedEquip.item.name, beastAttribute: selectedEquip.item.beastAttribute }],
                      { quality: player.secondSoul.quality, extremeAttribute: player.secondSoul.extremeAttribute }
                    );
                    secondMatch = secondResult.hasBoneMatch;
                  }
                  const finalMatch = isMatch || secondMatch;
                  return (
                     <div className="rounded-xl p-2.5 mb-3 border text-[11px] space-y-1" style={{
                      backgroundColor: 'rgba(74,222,128,0.08)',
                      borderColor: finalMatch ? 'rgba(74,222,128,0.4)' : 'rgba(74,222,128,0.15)',
                    }}>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold">属性共鸣</span>
                        <span className="text-cyan-300 font-medium">
                          魂骨：{boneAttr}
                        </span>
                      </div>
                      {finalMatch ? (
                           <div className="flex items-center gap-1.5 text-emerald-400">
                             <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                             <span className="font-medium">与武魂属性相同，伤害 <span className="font-bold">+5%</span></span>
                           </div>
                        ) : (
                         <div className="text-cyan-300">
                           武魂属性：{player.martialSoul.extremeAttribute && player.martialSoul.extremeAttribute !== '无' ? player.martialSoul.extremeAttribute : player.martialSoul.element}，无共鸣加成
                         </div>
                       )}
                    </div>
                  );
                })()}

                 <button
                   onClick={() => handleUnequip(selectedEquip.slot, selectedEquip.item.type === 'soulGuide' ? 'equip' : 'bone')}
                   className="w-full py-2 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 font-bold text-xs hover:bg-red-500/20 transition-colors"
                 >
                   卸下
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
       </AnimatePresence>

       {/* 🔴 v15.0 神装转化确认弹窗 */}
       <AnimatePresence>
         {showArmorConvert && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
             onClick={() => !convertingArmor && setShowArmorConvert(false)}
           >
             <motion.div
               initial={{ scale: 0.9, opacity: 0, y: 10 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 10 }}
               transition={{ type: 'tween', duration: 0.2 }}
               className="w-full max-w-md bg-gradient-to-b from-amber-500/10 via-card/95 to-card/95 rounded-2xl border-2 border-amber-500/50 shadow-2xl shadow-amber-500/20 max-h-[85vh] overflow-y-auto text-foreground backdrop-blur-md"
               onClick={(e) => e.stopPropagation()}
             >
               <div className="p-5">
                 <div className="flex flex-col items-center text-center mb-4">
                   <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold border-2 border-amber-400 bg-amber-500/15 text-amber-300 mb-3 animate-pulse">
                     ✨
                   </div>
                   <h3 className="font-bold text-xl text-amber-300">融合神装</h3>
                   <p className="text-sm text-muted-foreground mt-1">将全身七块魂骨凝聚为神之铠甲</p>
                 </div>

                 <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 mb-4 text-xs text-red-300 space-y-2">
                   <div className="font-bold text-red-400 flex items-center gap-1.5">
                     <span>⚠️</span> 重要提示（请仔细阅读）
                   </div>
                   <ul className="space-y-1 list-disc list-inside text-red-200/80">
                     <li>转化后所有已装备魂骨将<span className="font-bold text-red-300">永久融合</span>，无法卸下、无法更换</li>
                     <li>背包中的魂骨将<span className="font-bold text-red-300">无法再装备</span>，魂骨页面锁定</li>
                     <li>神装<span className="font-bold text-red-300">无法出售</span>，占据一个装备位置</li>
                     <li>神装属性 = 所有融合魂骨属性之和 × <span className="font-bold text-amber-300">120%</span></li>
                     <li>拔出神器后，神装与神器共鸣，<span className="font-bold text-purple-300">神技伤害翻倍</span></li>
                      <li>转世后神装<span className="font-bold text-red-300">消失</span>，需重新成神并集齐7块魂骨才可重新融合</li>
                   </ul>
                 </div>

                 <div className="grid grid-cols-2 gap-2">
                   <button
                     onClick={() => setShowArmorConvert(false)}
                     disabled={convertingArmor}
                     className="py-2.5 rounded-xl border border-border/50 bg-muted/20 text-foreground font-bold text-sm hover:bg-muted/40 transition-colors disabled:opacity-50"
                   >
                     再想想
                   </button>
                   <button
                     onClick={async () => {
                       setConvertingArmor(true);
                       // 小延迟让玩家感受转化过程
                       await new Promise((r) => setTimeout(r, 800));
                       const res = convertToDivineArmor();
                       setConvertingArmor(false);
                       if (res.success) {
                         toast.success('✨ 神装融合成功！');
                         setShowArmorConvert(false);
                         setActiveTab('divineArmor');
                       } else {
                         toast.error(res.reason || '转化失败');
                       }
                     }}
                     disabled={convertingArmor}
                     className="py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 font-bold text-sm hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                   >
                     {convertingArmor ? (
                       <>
                         <div className="w-4 h-4 border-2 border-amber-950/30 border-t-amber-950 rounded-full animate-spin" />
                         融合中...
                       </>
                     ) : '确认转化'}
                   </button>
                 </div>
               </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>

       {/* 🔴 v15.0 神装命名弹窗 */}
       <AnimatePresence>
         {showArmorRename && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
             onClick={() => setShowArmorRename(false)}
           >
             <motion.div
               initial={{ scale: 0.9, opacity: 0, y: 10 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 10 }}
               transition={{ type: 'tween', duration: 0.2 }}
               className="w-full max-w-sm bg-card/95 rounded-2xl border border-amber-500/40 shadow-xl text-foreground backdrop-blur-md"
               onClick={(e) => e.stopPropagation()}
             >
               <div className="p-5">
                 <h3 className="font-bold text-lg text-amber-300 mb-3 text-center">为神装命名</h3>
                 <p className="text-xs text-muted-foreground mb-3 text-center">六个字以内，赋予你的神装独特之名</p>
                 <Input
                   value={armorNameInput}
                   onChange={(e) => setArmorNameInput(e.target.value.slice(0, 6))}
                   placeholder="请输入神装名称"
                   maxLength={6}
                   className="text-center text-lg font-bold mb-4"
                 />
                 <div className="text-xs text-right text-muted-foreground mb-4">
                   {armorNameInput.length}/6
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                   <button
                     onClick={() => setShowArmorRename(false)}
                     className="py-2.5 rounded-xl border border-border/50 bg-muted/20 text-foreground font-medium text-sm hover:bg-muted/40 transition-colors"
                   >
                     取消
                   </button>
                   <button
                     onClick={() => {
                       const res = renameDivineArmor(armorNameInput);
                       if (res.success) {
                         toast.success('命名成功！');
                         setShowArmorRename(false);
                       } else {
                         toast.error(res.reason || '命名失败');
                       }
                     }}
                     className="py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 font-bold text-sm hover:from-amber-400 hover:to-yellow-400 transition-all"
                   >
                     确认
                   </button>
                 </div>
               </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>

       {/* 魂环释放全屏动画 —— 正圆同心圆 + CSS transform 动画（高性能不闪退） */}
      <AnimatePresence>
        {showRingRelease && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowRingRelease(false)}
          >
            <button
              type="button"
              onClick={() => setShowRingRelease(false)}
              className="absolute top-4 right-4 rounded-full p-2 text-white/50 hover:text-white z-20"
              aria-label="关闭"
            >
              <X className="h-5 w-5" />
            </button>

            {/* 双武魂切换Tab */}
            {player.isTwinSoul && player.secondSoul && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 p-0.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10 z-20">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setRingReleaseSoul(0); }}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                    ringReleaseSoul === 0
                      ? 'bg-cyan-500 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  主修 · {player.martialSoul.name}
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setRingReleaseSoul(1); }}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                    ringReleaseSoul === 1
                      ? 'bg-cyan-500 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  次修 · {player.secondSoul.name}
                </button>
              </div>
            )}

            {/* 正圆同心魂环容器 —— 使用 aspect-square 保证宽高1:1，绝对定位居中 */}
            <div
              key={ringReleaseSoul}
              className="relative aspect-square w-[min(90vw,85vh)] max-w-[720px] flex items-center justify-center"
            >
              {(ringReleaseSoul === 0 ? player.soulRings : (player.secondSoulRings ?? [])).map((ring, i, arr) => {
                 const total = arr.length;
                 // 动态计算魂环尺寸：从内到外间隔逐渐增大
                 const maxOuterRadius = 46; // 最外圈魂环的外边缘最大半径（%），留余量避免截断
                 const minInnerRadius = 6;  // 最内圈魂环内边缘最小半径（%）
                 const ringWidth = 1.4;     // 每个环自身径向宽度（百分比）
                 const totalRingWidth = total * ringWidth;
                 const availableSpace = maxOuterRadius - minInnerRadius - totalRingWidth;
                 // 间隔从内到外递增：第 i 个间隔 = baseGap * (1 + i * gapGrowth)
                 // 通过公式使总间隔 = availableSpace，间隔由内到外线性增长
                 let centerRadiusPct: number;
                 if (total <= 1) {
                   centerRadiusPct = minInnerRadius + (maxOuterRadius - minInnerRadius) / 2;
                 } else {
                   // 设最内圈间隔为 g0，最外圈间隔为 g0*(1 + growthFactor)
                   // 平均间隔 = g0 * (1 + growthFactor/2)
                   // 总间隔 = (total-1) * 平均间隔 = availableSpace
                    // 外疏内密：外圈间隔比内圈明显大，避免外圈拥挤重叠
                    const growthFactor = 2.8; // 外圈间隔 = 内圈间隔 × (1+growthFactor)
                    const avgGap = availableSpace / (total - 1);
                   const g0 = avgGap / (1 + growthFactor / 2);
                   // 第 i 个环之前有 i 个间隔（从第 0 个间隔到第 i-1 个间隔）
                   // 第 k 个间隔的大小 = g0 * (1 + growthFactor * k / (total - 2))  (k from 0 to total-2)
                   let accumulatedGap = 0;
                   for (let k = 0; k < i; k++) {
                     accumulatedGap += g0 * (1 + (total > 2 ? growthFactor * k / (total - 2) : 0));
                   }
                   const innerRadius = minInnerRadius + accumulatedGap + i * ringWidth;
                   centerRadiusPct = innerRadius + ringWidth / 2;
                 }
                 const sizePct = centerRadiusPct * 2; // 直径百分比
                return (
                  <div
                    key={ring.id || i}
                    className="absolute left-1/2 top-1/2"
                    style={{
                      width: `${sizePct}%`,
                      height: `${sizePct}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <motion.div
                      className="w-full h-full flex items-center justify-center"
                      style={{ willChange: 'transform, opacity' }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.3 + i * 0.28,
                        duration: 0.65,
                        ease: 'easeOut',
                      }}
                    >
                      <SoulRing
                        color={ring.color}
                        years={ring.years}
                        beastAttribute={ring.beastAttribute}
                        size={typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.9 * sizePct / 100, window.innerHeight * 0.8 * sizePct / 100) : 300}
                        animate
                        rotateDuration={10 + i * 3}
                        rotateDir={i % 2 === 0 ? 1 : -1}
                        glowScale={0}  // 关闭所有发光特效，只保留基础外观
                      />
                    </motion.div>
                  </div>
                );
              })}

              {/* 中央武魂名 —— 独立于圆环，保证正圆 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + Math.min((ringReleaseSoul === 0 ? player.soulRings : player.secondSoulRings ?? []).length, 9) * 0.25, duration: 0.5 }}
                className="relative z-10 text-center px-4 pointer-events-none"
              >
                <div
                  className="text-lg md:text-xl font-black tracking-wider"
                  style={{
                    color: ringReleaseSoul === 0 ? soulQualityColor : secondSoulQualityColor,
                    textShadow: `0 0 12px ${ringReleaseSoul === 0 ? soulQualityColor : secondSoulQualityColor}`,
                    fontFamily: "'Noto Serif SC', serif",
                  }}
                >
                  {ringReleaseSoul === 0 ? player.martialSoul.name : player.secondSoul?.name || ''}
                </div>
                <div className="text-xs text-white/60 mt-1 flex items-center justify-center gap-1">
                    {player.name}
                    {player.title && <span className="text-cyan-400">· {player.title}</span>}
                  </div>
                <div className="text-xs text-cyan-300 mt-1 font-medium">
                  {(ringReleaseSoul === 0 ? player.soulRings : player.secondSoulRings ?? []).length} 魂环 · {ringReleaseSoul === 0 ? '主修' : '次修'}
                </div>
              </motion.div>
            </div>

            <p className="absolute bottom-8 text-xs text-white/30">点击任意处关闭</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 自定义封号弹窗 */}
      <Dialog open={showTitleDialog} onOpenChange={setShowTitleDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">设置封号</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground text-center">恭喜达到封号斗罗！请自定义你的封号（2个字以内）</p>
            <Input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value.slice(0, 2))}
              placeholder="请输入封号（如：昊天）"
              maxLength={2}
              className="text-center text-lg"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTitleDialog(false)}>取消</Button>
            <Button onClick={handleSaveTitle}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ItemSlotIcon({ item, label, onClick, showBoneYear = false }: { item: IItem | null; label: string; onClick?: () => void; showBoneYear?: boolean }) {
  // 自制魂导器：按等级显示对应颜色（1级白→9级彩）；其他物品用品质色
  // 魂骨：使用 qualityColor（按年限：白/黄/紫/黑/红）
  let color = item ? QUALITY_COLOR[item.quality as keyof typeof QUALITY_COLOR] : '#475569';
  let isRainbow = false;
  let boneYearLabel = '';
  if (item && item.type === 'soulBone' && item.qualityColor) {
    color = item.qualityColor;
    boneYearLabel = item.soulBoneYearsLabel || '';
  } else if (item && item.type === 'soulGuide' && item.craftable && item.soulGuideLevel) {
    const tierColors: Record<number, string> = {
      1: '#cbd5e1', 2: '#22c55e', 3: '#3b82f6', 4: '#a855f7', 5: '#f97316',
      6: '#ef4444', 7: '#ec4899', 8: '#eab308', 9: '#ffffff',
    };
    if (item.soulGuideLevel === 9) {
      isRainbow = true;
    } else if (tierColors[item.soulGuideLevel]) {
      color = tierColors[item.soulGuideLevel];
    }
  }
  return (
    <div className="flex flex-col items-center gap-1 w-full">
      <button
        onClick={onClick}
        className={`relative w-full aspect-square max-w-[72px] rounded-lg flex items-center justify-center text-lg font-bold border-2 transition-transform hover:scale-105 active:scale-95 ${isRainbow ? 'craft-rainbow-border' : ''}`}
        style={{
          borderColor: item ? color : 'rgba(148,163,184,0.25)',
          borderStyle: item ? 'solid' : 'dashed',
          backgroundColor: item ? `${color}15` : 'rgba(148,163,184,0.06)',
          color: item ? color : 'rgba(148,163,184,0.4)',
          boxShadow: item && !isRainbow ? `0 0 10px ${color}30, inset 0 0 10px ${color}10` : 'none',
        }}
        disabled={!item}
      >
        {item ? item.iconChar : '空'}
        {/* 魂骨年限角标 */}
        {item && showBoneYear && boneYearLabel && (
          <span
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1 rounded whitespace-nowrap border"
            style={{
              backgroundColor: color,
              color: color === '#f0f0f0' || color === '#ffffff' ? '#333' : '#fff',
              borderColor: color,
              lineHeight: 1.4,
            }}
          >
            {boneYearLabel}
          </span>
        )}
      </button>
      <div className="text-[10px] text-muted-foreground text-center leading-tight">{label}</div>
    </div>
  );
}

// ============================================================
// 魂环详情列表（memo 化，避免父组件无关状态更新导致整列表重渲染）
// ============================================================
interface SoulRingDetailListProps {
  rings: ISoulRing[];
}

const SoulRingDetailList = memo(function SoulRingDetailList({ rings }: SoulRingDetailListProps) {
  return (
    <div className="mt-3 space-y-2">
      {rings.map((ring, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-card/60 p-2"
        >
          <div
            className="w-6 h-6 rounded-full border shrink-0"
            style={{
              borderColor: RING_DISPLAY_COLOR[ring.color],
              boxShadow: `0 0 6px ${RING_DISPLAY_COLOR[ring.color]}80`,
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium truncate">{ring.skillName}</span>
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                style={{
                  backgroundColor: `${RING_DISPLAY_COLOR[ring.color]}25`,
                  color: RING_DISPLAY_COLOR[ring.color],
                  textShadow: `0 0 4px ${RING_DISPLAY_COLOR[ring.color]}60`,
                }}
              >
                {ring.qualityLabel}
              </span>
            </div>
            <div className="text-[10px] text-cyan-400 truncate">
               {ring.soulBeastName} · {ring.years.toLocaleString()}年
               {ring.beastAttribute && <span className="ml-1 text-purple-300">[{ring.beastAttribute}]</span>}
             </div>
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-[9px] text-cyan-400">
              {ring.attackBonus > 0 && <span className="text-red-600">攻+{ring.attackBonus}</span>}
              {ring.defenseBonus > 0 && <span className="text-blue-600">防+{ring.defenseBonus}</span>}
              {ring.speedBonus > 0 && <span className="text-green-600">速+{ring.speedBonus}</span>}
              {ring.spiritBonus > 0 && <span className="text-cyan-400">精+{ring.spiritBonus}</span>}
              {ring.hpBonus > 0 && <span className="text-cyan-400">血+{ring.hpBonus}</span>}
              {ring.skillDamagePct && ring.skillDamagePct > 0 ? (
                <span className="text-orange-400">魂技伤害：{formatSkillDamagePct(ring.skillDamagePct)}</span>
              ) : ring.skillDamage > 0 ? (
                <span className="text-orange-600">魂技伤害+{ring.skillDamage}</span>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});