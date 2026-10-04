import {hasSilverKing} from '@/lib/silverKing';
import {hasGoldKing} from '@/lib/goldKing';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Settings, Hammer, Lock, Sparkles, Orbit, ArrowRightLeft, Crown, Sword, Ghost, RotateCcw, Trophy, Heart, History, Users, BookOpen, Zap } from 'lucide-react';
import { useGame } from '@/lib/gameStore';
import { ACHIEVEMENTS } from '@/data/achievements';

interface MoreItem {
  key: string;
  label: string;
  desc: string;
  icon: typeof Settings;
  iconColor: string;
  iconBg: string;
  locked?: boolean;
  lockedMsg?: string;
  onClick: () => void;
  badge?: string;
}

interface MorePageProps {
  onOpenLeaderboard?: () => void;
  onOpenSilverBloodline?:()=>void;
  onOpenGoldBloodline?:()=>void;
  onOpenAscension?:()=>void;
  onOpenForgeArmor?:()=>void;
  onOpenSettings: () => void;
  onOpenCraft: () => void;
  onOpenDomain: () => void;
  onOpenSoulSpirit?: () => void;
  onOpenConvert?: () => void;
  onOpenDivineTrial?: () => void;
  onOpenArtifact?: () => void;
  onOpenReincarnation?: () => void;
  onOpenReincarnationView?: () => void;
  onOpenReincarnationShadow?: () => void;
  onOpenAchievement: () => void;
  onOpenGodRealm?: () => void;
  onOpenCompanions?: () => void;
  onOpenCodex?: () => void;
  onOpenLaws?: () => void;
}

type CategoryKey = 'growth' | 'partner' | 'craft' | 'reinc' | 'system';

const CATEGORIES: { key: CategoryKey; label: string; icon: typeof Sparkles; color: string }[] = [
  { key: 'growth',  label: '成长进阶', icon: Zap,     color: 'text-amber-300'  },
  { key: 'partner', label: '伴侣羁绊', icon: Heart,   color: 'text-pink-300'   },
  { key: 'craft',   label: '锻造工坊', icon: Hammer,  color: 'text-cyan-300'   },
  { key: 'reinc',   label: '轮回转世', icon: RotateCcw, color: 'text-purple-300' },
  { key: 'system',  label: '系统设置', icon: Settings, color: 'text-muted-foreground' },
];

export default function MorePage({ onOpenLeaderboard, onOpenSilverBloodline, onOpenGoldBloodline, onOpenAscension, onOpenForgeArmor, onOpenSettings, onOpenCraft, onOpenDomain, onOpenSoulSpirit, onOpenConvert, onOpenDivineTrial, onOpenArtifact, onOpenReincarnation, onOpenReincarnationView, onOpenReincarnationShadow, onOpenAchievement, onOpenGodRealm, onOpenCompanions, onOpenCodex, onOpenLaws }: MorePageProps) {
  const { player, canEnterDivineTrials, canReincarnate } = useGame();
  const canCraft = player && player.level >= 10;
  const canDomain = player && player.level >= 70 && player.soulRings.length >= 7;
  const hasDomain = player && player.domain;
  const canSpirit = player && player.level >= 60;
  const spiritCount = player?.soulSpirits.length ?? 0;
  const spiritBadge = spiritCount > 0 ? `${spiritCount}个` : undefined;
  const canDivine = canEnterDivineTrials();
  const hasArtifact = player?.divineTrial?.artifactDrawn ?? false;
  const canReinc = canReincarnate();
  const reincCount = player?.reincarnation?.count ?? 0;
  const totalAchievements = ACHIEVEMENTS.length;
  const newAchievementCount = player?.achievementStats?.newlyUnlocked?.length ?? 0;
  const companionCount = player?.companions?.accepted?.length ?? 0;
  const companionBadge = companionCount > 0 ? `${companionCount}位` : undefined;

  const allItems = useMemo<Record<CategoryKey, MoreItem[]>>(() => ({
    growth: [
      ...(hasSilverKing(player)?[{key:'silverBloodline',label:'银龙王血脉',desc:'七元素掌控、银龙真身与银龙神技',icon:Sparkles,iconColor:'text-cyan-200',iconBg:'bg-cyan-900/30',onClick:()=>onOpenSilverBloodline?.()}]:[]),
      ...(hasGoldKing(player)?[{key:'goldBloodline',label:'金龙王血脉',desc:'解开十八道封印，培养四条血脉进化路线',icon:Sparkles,iconColor:'text-amber-300',iconBg:'bg-amber-900/30',onClick:()=>onOpenGoldBloodline?.()}]:[]),
      {key:'ascension',label:'升灵台',desc:'试炼获取灵力，进化已契约魂灵',icon:Sparkles,iconColor:'text-cyan-300',iconBg:'bg-cyan-900/30',onClick:()=>onOpenAscension?.()},
      {key:'forgeArmor',label:'锻造斗铠',desc:'采矿、千锻、灵锻，制作一字与二字斗铠',icon:Hammer,iconColor:'text-amber-300',iconBg:'bg-amber-900/30',onClick:()=>onOpenForgeArmor?.()},
      {
        key: 'achievement',
        label: '成就殿堂',
        desc: `回顾修炼之路，收集斗罗大陆的${totalAchievements}项荣耀`,
        icon: Trophy,
        iconColor: 'text-amber-300',
        iconBg: 'bg-amber-900/30 border border-amber-500/30',
        onClick: () => onOpenAchievement(),
        badge: newAchievementCount > 0 ? `新${newAchievementCount}` : undefined,
      },
      {
        key: 'codex',
        label: '图鉴',
        desc: '查阅魂兽、武魂、魂环、魂骨、仙草、神器的全部资料',
        icon: BookOpen,
        iconColor: 'text-cyan-300',
        iconBg: 'bg-cyan-900/30 border border-cyan-500/30',
        onClick: () => onOpenCodex?.(),
      },
      {
        key: 'domain',
        label: '领域',
        desc: '觉醒专属领域，获得强大属性加成',
        icon: Orbit,
        iconColor: 'text-fuchsia-400',
        iconBg: 'bg-fuchsia-900/30 border border-fuchsia-500/30',
        locked: !canDomain,
        lockedMsg: canDomain ? undefined : '70级+第七魂环解锁',
        onClick: () => {
          if (!canDomain) return;
          onOpenDomain();
        },
        badge: hasDomain ? '已觉醒' : undefined,
      },
      {
        key: 'soulSpirit',
        label: '魂灵',
        desc: '契约魂灵，并肩作战',
        icon: Ghost,
        iconColor: 'text-cyan-300',
        iconBg: 'bg-cyan-900/30 border border-cyan-500/30',
        locked: !canSpirit,
        lockedMsg: canSpirit ? undefined : '60级解锁',
        onClick: () => {
          if (!canSpirit) return;
          onOpenSoulSpirit?.();
        },
        badge: spiritBadge,
      },
      {
        key: 'divineTrial',
        label: '神考',
        desc: '传承神位，踏上百级成神之路',
        icon: Crown,
        iconColor: 'text-yellow-300',
        iconBg: 'bg-yellow-900/30 border border-yellow-500/30',
        locked: !canDivine,
        lockedMsg: canDivine ? undefined : '70级解锁',
        onClick: () => {
          if (!canDivine) return;
          onOpenDivineTrial?.();
        },
        badge: player?.divineTrial?.inherited ? '已继承' : player?.divineTrial?.chosenTrialId ? '进行中' : undefined,
       },
       {
         key: 'laws',
         label: '法则修炼',
         desc: '凝聚法则碎片，融合法则之力，突破百级瓶颈',
         icon: Orbit,
         iconColor: 'text-purple-300',
         iconBg: 'bg-purple-900/30 border border-purple-500/30',
         locked: !player?.divineTrial?.godLevelProgress?.unlocked,
         lockedMsg: player?.divineTrial?.godLevelProgress?.unlocked ? undefined : '需解锁神级修炼',
         onClick: () => {
           if (!player?.divineTrial?.godLevelProgress?.unlocked) return;
           onOpenLaws?.();
         },
         badge: (player?.divineTrial?.pendingLawFragmentChoices ?? 0) > 0
           ? `${player.divineTrial.pendingLawFragmentChoices}待选`
           : undefined,
       },
      {
        key: 'godRealm',
        label: '神界',
        desc: '百级成神后的终极战场，挑战至高神王',
        icon: Sparkles,
        iconColor: 'text-yellow-200',
        iconBg: 'bg-yellow-900/30 border border-yellow-500/30',
        locked: !((player?.level ?? 0) >= 100 && player?.divineTrial?.inherited && player?.godRealm?.unlocked),
        lockedMsg:
          (player?.level ?? 0) < 100
            ? '需达到100级解锁'
            : !player?.divineTrial?.inherited
            ? '需继承神位后解锁'
            : '神界尚未开启',
        onClick: () => {
          if (!((player?.level ?? 0) >= 100 && player?.divineTrial?.inherited && player?.godRealm?.unlocked)) return;
          onOpenGodRealm?.();
        },
        badge: player?.godRealm?.defeatedIds?.length ? `${player.godRealm.defeatedIds.length}/13神王` : undefined,
      },
      {
        key: 'artifact',
        label: '神器',
        desc: '拔出并升级专属神器，获得无上神力',
        icon: Sword,
        iconColor: 'text-amber-300',
        iconBg: 'bg-amber-900/30 border border-amber-500/30',
        locked: !hasArtifact,
        lockedMsg: hasArtifact ? undefined : '需获得神器解锁',
        onClick: () => {
          if (!hasArtifact) return;
          onOpenArtifact?.();
        },
        badge: hasArtifact ? `Lv.${player?.divineTrial?.artifactLevel ?? 1}` : undefined,
      },
    ],
    partner: [
      {
        key: 'companions',
        label: '伴侣',
        desc: '与凶兽、茶城名士结缘，共赴修行之路',
        icon: Users,
        iconColor: 'text-pink-300',
        iconBg: 'bg-pink-900/40 border border-pink-500/30',
        onClick: () => onOpenCompanions?.(),
        badge: companionBadge,
      },
    ],
    craft: [
      {
        key: 'craft',
        label: '自制魂导器',
        desc: '自由打造专属魂导器，属性由你决定',
        icon: Hammer,
        iconColor: 'text-cyan-300',
        iconBg: 'bg-cyan-900/40 border border-cyan-500/30',
        locked: !canCraft,
        lockedMsg: canCraft ? undefined : '10级解锁',
        onClick: () => {
          if (!canCraft) return;
          onOpenCraft();
        },
      },
      {
        key: 'convert',
        label: '材料转换',
        desc: '将材料转换为其他等级或品质',
        icon: ArrowRightLeft,
        iconColor: 'text-emerald-400',
        iconBg: 'bg-emerald-900/30 border border-emerald-500/30',
        onClick: () => onOpenConvert?.(),
      },
    ],
    reinc: [
      {
        key: 'reincarnation',
        label: '转世轮回',
        desc: canReinc ? '凝聚轮回之力，开启下一世修行' : '需达到99级才能转世',
        icon: RotateCcw,
        iconColor: 'text-purple-300',
        iconBg: 'bg-purple-900/40 border border-purple-500/30',
        locked: !canReinc,
        lockedMsg: `需达到99级可转世${reincCount > 0 ? `（已轮回${reincCount}世）` : ''}`,
        onClick: () => onOpenReincarnation?.(),
        badge: reincCount > 0 ? `第${reincCount + 1}世` : undefined,
      },
      {
        key: 'reincarnationView',
        label: '轮回史鉴',
        desc: '查阅前世记忆，回顾每一世的修行轨迹与收藏',
        icon: History,
        iconColor: 'text-amber-300',
        iconBg: 'bg-amber-900/30 border border-amber-500/30',
        onClick: () => onOpenReincarnationView?.(),
        badge: reincCount > 0 ? `${reincCount}世` : undefined,
      },
      {
        key: 'reincarnationShadow',
        label: '轮回之影',
        desc: '挑战上一世的自己，检验今生修为，不限次数',
        icon: Ghost,
        iconColor: 'text-purple-300',
        iconBg: 'bg-purple-900/40 border border-purple-500/30',
        onClick: () => onOpenReincarnationShadow?.(),
        badge: reincCount > 0 ? '不限次数挑战' : '未解锁',
      },
    ],
    system: [
      {key:'leaderboard', label:'排行榜', desc:'战力排名 · 当前角色与历代轮回档案', icon:Trophy, iconColor:'text-amber-300', iconBg:'bg-amber-900/30 border border-amber-500/30', onClick:()=>onOpenLeaderboard?.()},
      {
        key: 'settings',
        label: '设置',
        desc: '显示、音效、账号与存档管理',
        icon: Settings,
        iconColor: 'text-cyan-300',
        iconBg: 'bg-cyan-900/40 border border-cyan-500/30',
        onClick: onOpenSettings,
      },
    ],
  }), [
    player, canCraft, canDomain, hasDomain, canSpirit, spiritBadge, canDivine, hasArtifact, canReinc,
    reincCount, totalAchievements, newAchievementCount, companionBadge,
    onOpenLeaderboard, onOpenAchievement, onOpenDomain, onOpenSoulSpirit, onOpenDivineTrial, onOpenGodRealm,
    onOpenLaws, onOpenSilverBloodline, onOpenGoldBloodline,
    onOpenArtifact, onOpenCompanions, onOpenCraft, onOpenConvert,
    onOpenReincarnation, onOpenReincarnationView, onOpenReincarnationShadow, onOpenSettings, onOpenCodex,
  ]);

  return (
    <div className="space-y-5 md:space-y-6">
      {/* 页头 */}
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-cyan-400" />
        <div>
          <h2 className="text-lg md:text-xl font-bold text-foreground">更多功能</h2>
          <p className="text-[11px] text-muted-foreground -mt-0.5">成长 · 伴侣 · 锻造 · 轮回 · 设置</p>
        </div>
      </div>

      {/* 分类展示 */}
      <div className="space-y-5 md:space-y-6">
        {CATEGORIES.map((cat, catIdx) => {
          const Icon = cat.icon;
          const items = allItems[cat.key];
          if (!items || items.length === 0) return null;
          return (
            <motion.section
              key={cat.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: catIdx * 0.08 }}
              className="space-y-3"
            >
              {/* 分类标题 */}
              <div className="flex items-center gap-2 px-0.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-card/60 border border-border/40`}>
                  <Icon className={`h-4 w-4 ${cat.color}`} />
                </div>
                <div className="text-sm font-bold text-foreground">{cat.label}</div>
                <div className="flex-1 h-px bg-gradient-to-r from-border/50 to-transparent ml-2" />
                <span className="text-[10px] text-muted-foreground">{items.length} 项</span>
              </div>

              {/* 功能卡片网格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map((item, i) => {
                  const ItemIcon = item.icon;
                  return (
                    <motion.button
                      key={item.key}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: catIdx * 0.08 + i * 0.04 }}
                      onClick={item.onClick}
                      disabled={item.locked}
                      className={`relative w-full p-3 md:p-4 rounded-xl border text-left transition-all group ${
                         item.locked
                           ? 'border-border/30 bg-muted/20 opacity-60 cursor-not-allowed'
                           : 'border-border/50 bg-gradient-to-br from-card/60 to-card/30 hover:border-cyan-500/40 hover:from-card/80 active:scale-[0.98]'
                      }`}
                    >
                      {/* 顶部金边装饰（未锁定） */}
                      {!item.locked && (
                        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}

                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 md:w-12 md:h-12 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}>
                          {item.locked ? (
                            <Lock className="h-5 w-5 text-muted-foreground" />
                          ) : (
                             <ItemIcon className={`h-5 w-5 md:h-5 md:w-5 ${item.iconColor}`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <div className="font-semibold text-sm md:text-base text-foreground truncate">{item.label}</div>
                            {item.badge && (
                              <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-green-900/40 text-green-400 border border-green-500/30">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                            {item.locked ? item.lockedMsg : item.desc}
                          </div>
                        </div>
                        {!item.locked && (
                          <div className="shrink-0 text-muted-foreground group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.section>
          );
        })}
      </div>

      <div className="text-[11px] text-muted-foreground/60 text-center pt-2 pb-2">
        更多功能持续开发中...
      </div>
    </div>
  );
}
