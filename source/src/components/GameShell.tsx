import { formatNumber } from '@/lib/utils';
import DragonLegendPanel from '@/pages/Game/DragonLegendPanel';
import {__localBuildShadow} from '@/lib/shadow';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  User, Backpack, Map, Sparkles, CircleDot, MoreHorizontal, Coins,
  ShoppingBag, Crown, Award, Hammer, RefreshCw, Mountain, Settings, X,
  Ghost, RotateCcw, Clock, HeartHandshake, History,
} from 'lucide-react';
import { useGame, getRealmDisplay, isBottleneck } from '@/lib/gameStore';
import { ACHIEVEMENTS, type IAchievement } from '@/data/achievements';
import { toast } from 'sonner';
import DivineRingAvatar from '@/components/DivineRingAvatar';
import StarryBackground from '@/components/StarryBackground';
import CharacterPanel from '@/pages/Game/CharacterPanel';
import InventoryPanel from '@/pages/Game/InventoryPanel';
import MapPanel from '@/pages/Game/MapPanel';
import CultivationPanel from '@/pages/Game/CultivationPanel';
import SoulRingPanel from '@/pages/Game/SoulRingPanel';

import SettingsPanel from '@/pages/Game/SettingsPanel';
import CraftPanel from '@/pages/Game/CraftPanel';
import DomainPanel from '@/pages/Game/DomainPanel';
import MaterialConvertPanel from '@/pages/Game/MaterialConvertPanel';
import DivineTrialPanel from '@/pages/Game/DivineTrialPanel';
import GodRealmPanel from '@/pages/Game/GodRealmPanel';
import LawPanel from '@/pages/Game/LawPanel';
import ArtifactPanel from '@/pages/Game/ArtifactPanel';
import BattlePage from '@/pages/BattlePage/BattlePage';
import MorePage from '@/pages/Game/MorePage';
import CompanionsPanel from '@/pages/Game/CompanionsPanel';
import ReincarnationPanel from '@/pages/Game/ReincarnationPanel';
import ReincarnationHistoryPanel from '@/pages/Game/ReincarnationHistoryPanel';
import ReincarnationShadowPanel from '@/pages/Game/ReincarnationShadowPanel';
import SoulSpiritPanel from '@/pages/Game/SoulSpiritPanel';
import AchievementPanel from '@/pages/Game/AchievementPanel';
import CodexPanel from '@/pages/Game/CodexPanel';
import AchievementToastCard from '@/components/AchievementToastCard';
import FavorModal from '@/components/FavorModal';
import TitleDialog from '@/components/TitleDialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

import { scopedStorage, logger, getAppId } from '@lark-apaas/client-toolkit-lite';

// Tab 持久化 key：按 appId 隔离，避免多应用互相覆盖
const TAB_STORAGE_KEY = `game_active_tab_${getAppId() ?? 'app'}`;

type TabValue =
  | 'character' | 'inventory' | 'map' | 'soulRing' | 'cultivation' | 'more'
   | 'shop' | 'craft' | 'domain' | 'convert' | 'divineTrial' | 'artifact' | 'soulSpirit' | 'settings' | 'reincarnation' | 'reincarnationHistory'
  | 'achievement' | 'godRealm' | 'companions' | 'ascension' | 'forgeArmor' | 'laws' | 'reincarnationShadow';

// 移动端底部导航（6个）
const MOBILE_NAV_ITEMS: Array<{ value: TabValue; label: string; icon: typeof User }> = [
  { value: 'character', label: '角色', icon: User },
  { value: 'inventory', label: '背包', icon: Backpack },
  { value: 'map', label: '地图', icon: Map },
  { value: 'soulRing', label: '魂环', icon: CircleDot },
  { value: 'cultivation', label: '闭关', icon: Sparkles },
  { value: 'more', label: '更多', icon: MoreHorizontal },
];

// 电脑端侧边栏分组
const SIDEBAR_GROUPS: Array<{
  groupLabel: string;
  items: Array<{ value: Exclude<TabValue, 'more'>; label: string; icon: typeof User }>;
}> = [
  {
    groupLabel: '基础',
    items: [
      { value: 'character', label: '角色', icon: User },
      { value: 'inventory', label: '背包', icon: Backpack },
      { value: 'map', label: '地图', icon: Map },
      { value: 'soulRing', label: '魂环', icon: CircleDot },
      { value: 'cultivation', label: '闭关', icon: Sparkles },
    ],
  },
  {
    groupLabel: '进阶',
    items: [
      { value: 'artifact', label: '神器', icon: Crown },
      { value: 'divineTrial', label: '神考', icon: Award },
      { value: 'godRealm', label: '神界', icon: Sparkles },
      { value: 'soulSpirit', label: '魂灵', icon: Ghost },
      {value:'ascension',label:'升灵台',icon:Sparkles},
      {value:'forgeArmor',label:'锻造斗铠',icon:Hammer},
      { value: 'companions', label: '侣', icon: HeartHandshake },
      { value: 'craft', label: '自制魂导器', icon: Hammer },
      { value: 'convert', label: '材料转换', icon: RefreshCw },
      { value: 'domain', label: '领域', icon: Mountain },
    ],
  },
  {
    groupLabel: '系统',
    items: [
      { value: 'achievement', label: '成就殿堂', icon: Award },
      { value: 'reincarnation', label: '转世轮回', icon: RotateCcw },
      { value: 'reincarnationHistory', label: '轮回史鉴', icon: History },
      {value:'reincarnationShadow',label:'轮回之影',icon:Ghost},
      {value:'laws',label:'法则',icon:Sparkles},
      { value: 'settings', label: '设置', icon: Settings },
    ],
  },
];

// 所有有效 tab（用于 storage 校验）
const ALL_VALID_TABS: TabValue[] = [
  'character', 'inventory', 'map', 'soulRing', 'cultivation', 'more', 'ascension', 'forgeArmor',
  'reincarnationShadow', 'laws', 'shop', 'craft', 'domain', 'convert', 'divineTrial', 'artifact', 'soulSpirit', 'settings', 'reincarnation', 'reincarnationHistory', 'achievement', 'godRealm', 'companions','laws','reincarnationShadow',
];

export default function GameShell() {
  const { player, attributes, loading, inBattle, battleState, exploration, abortExploration, setCurrentHp, endBattle, pendingFavorBeastId, startBattle } = useGame();
  const [moreSub, setMoreSub] = useState<'settings' | 'craft' | 'domain' | 'soulSpirit' | 'convert' | 'shop' | 'divineTrial' | 'artifact' | 'reincarnation' | 'reincarnationHistory' | 'reincarnationView' | 'reincarnationShadow' | 'achievement' | 'godRealm' | 'companions' | 'codex' | 'ascension' | 'forgeArmor' | 'laws' | null>(null);
  const [showTopNotice, setShowTopNotice] = useState(() => {
    try {
      return scopedStorage.getItem('__douluo_top_notice_closed') !== '1';
    } catch { return true; }
  });
  const isMobile = useIsMobile();

  // 🔴 调试：凶兽青睐状态变化日志（帮助定位弹窗不显示问题）
  useEffect(() => {
    logger.info('[game-shell] 青睐状态变化', { pendingFavorBeastId, inBattle, isMobile, shouldShow: !!pendingFavorBeastId && !inBattle });
  }, [pendingFavorBeastId, inBattle, isMobile]);

  const [activeTab, setActiveTab] = useState<TabValue>(() => {
    try {
      const saved = scopedStorage.getItem(TAB_STORAGE_KEY);
      if (saved && ALL_VALID_TABS.includes(saved as TabValue)) {
        // 电脑端没有 more 侧边栏选项，fallback 到 character
        if (typeof window !== 'undefined' && window.innerWidth >= 768 && saved === 'more') {
          return 'character';
        }
        return saved as TabValue;
      }
    } catch { /* ignore */ }
    return 'character';
  });

  // 非战斗状态下每秒回复20%最大血量
  const playerRef = useRef(player);
  const attrsRef = useRef(attributes);
  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { attrsRef.current = attributes; }, [attributes]);

  // 虚弱倒计时每秒刷新驱动
  const [weaknessTick, setWeaknessTick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setWeaknessTick((t) => t + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // 虚弱状态剩余时间（毫秒），<=0 表示不虚弱
  const weaknessRemain = useMemo(() => {
    if (!player?.companions?.weaknessUntil) return 0;
    return Math.max(0, player.companions.weaknessUntil - Date.now());
  }, [player, weaknessTick]);

  // 格式化倒计时为 mm:ss
  const formatWeaknessTime = (ms: number): string => {
    const total = Math.ceil(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 成就解锁弹出动画 Toast
  const shownAchievementsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const newly = player?.achievementStats?.newlyUnlocked;
    if (!newly || newly.length === 0) return;
    for (const achId of newly) {
      if (shownAchievementsRef.current.has(achId)) continue;
      shownAchievementsRef.current.add(achId);
      const ach = ACHIEVEMENTS.find((a) => a.id === achId);
      if (!ach) continue;
      const rarityLabel: Record<string, string> = {
        common: '普通', rare: '稀有', epic: '史诗', legendary: '传说', mythic: '神话',
      };
      toast.custom((_id) => (
        <AchievementToastCard
          ach={ach}
          rarityLabel={rarityLabel[ach.rarity] || ''}
          visible={true}
        />
      ), {
        duration: 3500,
        position: 'top-center',
        className: 'bg-transparent border-none shadow-none',
      });
    }
  }, [player?.achievementStats?.newlyUnlocked]);
  useEffect(() => {
    if (inBattle || !player || !attributes) return;
    if (player.currentHp >= attributes.hp) return;
    const timer = window.setInterval(() => {
      const p = playerRef.current;
      const a = attrsRef.current;
      if (!p || !a) return;
      if (p.currentHp >= a.hp) {
        clearInterval(timer);
        return;
      }
      const healAmount = Math.ceil(a.hp * 0.2);
      setCurrentHp(Math.min(a.hp, p.currentHp + healAmount));
    }, 1000);
    return () => clearInterval(timer);
  }, [inBattle, player?.currentHp, attributes]);

  // Tab 持久化
  useEffect(() => {
    try {
      scopedStorage.setItem(TAB_STORAGE_KEY, activeTab);
    } catch { /* ignore */ }
  }, [activeTab]);

  // 电脑端：切换 tab
  const handleDesktopNav = (newTab: Exclude<TabValue, 'more'>) => {
    if (newTab === activeTab) return;
    if (exploration && newTab !== 'map') {
      const { rings, items } = abortExploration();
      toast.info(
        `探索中断，已获得的${rings > 0 ? ` ${rings} 个魂环` : ''}${items > 0 ? ` ${items} 件物品` : ''}已保留`,
        { description: '探索中切换页面将中断本次探索' }
      );
    }
    setActiveTab(newTab);
  };

  // 移动端：切换 tab
  const handleMobileTabChange = (newTab: TabValue) => {
    if (newTab === 'more') {
      setMoreSub(null);
      setActiveTab('more');
      return;
    }
    if (newTab === activeTab) return;
    if (exploration && newTab !== 'map') {
      const { rings, items } = abortExploration();
      toast.info(
        `探索中断，已获得的${rings > 0 ? ` ${rings} 个魂环` : ''}${items > 0 ? ` ${items} 件物品` : ''}已保留`,
        { description: '探索中切换页面将中断本次探索' }
      );
    }
    setMoreSub(null);
    setActiveTab(newTab);
  };

  // 更多页面内部跳转（移动端）
  const openMoreSub = (sub: 'settings' | 'craft' | 'domain' | 'soulSpirit' | 'convert' | 'shop' | 'divineTrial' | 'artifact' | 'reincarnation' | 'reincarnationHistory' | 'reincarnationView' | 'reincarnationShadow' | 'achievement' | 'godRealm' | 'companions' | 'codex' | 'ascension' | 'forgeArmor' | 'laws') => {
    setMoreSub(sub);
  };

  // ============================================================
  // 返回键拦截 + 历史栈管理（移动端浏览器返回键）
  // 策略：
  //   1. 进入战斗/更多弹窗时 pushState 压栈
  //   2. 用户按返回键触发 popstate：先关闭最上层弹窗，再 history.back() 抵消我们 push 的那条
  //   3. 战斗中按返回键：弹出确认，玩家选择后决定是否退出
  //   4. 组件卸载时清理所有历史栈，避免留痕
  // ============================================================
  const battleExitRef = useRef<{ resolve: (v: boolean) => void } | null>(null);
  const [showBattleExitConfirm, setShowBattleExitConfirm] = useState(false);

  // 判断当前是否有需要拦截返回的"叠加层"
  const hasOverlay = inBattle || (activeTab === 'more' && moreSub !== null);

  useEffect(() => {
    // 确保历史栈深度正确：有叠加层时 history.length 应该比基准多1
    // 不做精确计数，只保证有叠加层时栈里有可pop的项
    if (hasOverlay) {
      // 只在状态从无变有时压栈，避免重复push
      // 用 sessionStorage 记录我们自己 push 的层数
      try {
        const pushed = Number(sessionStorage.getItem('__douluo_stack_count') || '0');
        if (pushed < 1 || history.state?.overlay !== true) {
          history.pushState({ overlay: true }, '');
          sessionStorage.setItem('__douluo_stack_count', '1');
        }
      } catch {
        history.pushState({ overlay: true }, '');
      }
    } else {
      // 叠加层全部关闭时，清掉我们 push 的历史栈
      try {
        const pushed = Number(sessionStorage.getItem('__douluo_stack_count') || '0');
        if (pushed > 0) {
          // 回退对应步数
          if (history.state?.overlay === true) history.go(-1);
          sessionStorage.setItem('__douluo_stack_count', '0');
        }
      } catch {
        // 兜底：单次回退
        if (history.length > 1) history.back();
      }
    }
  }, [hasOverlay]);

  const onPopState = useCallback(() => {
    // 减少计数
    try {
      const pushed = Number(sessionStorage.getItem('__douluo_stack_count') || '0');
      if (pushed > 0) {
        sessionStorage.setItem('__douluo_stack_count', String(pushed - 1));
      }
    } catch { /* ignore */ }

    // 最上层：更多子页面
    if (activeTab === 'more' && moreSub) {
      setMoreSub(null);
      // 再 push 回去，让后续返回还能继续拦截
      try {
        const pushed = Number(sessionStorage.getItem('__douluo_stack_count') || '0');
        history.pushState({ overlay: true }, '');
        sessionStorage.setItem('__douluo_stack_count', '1');
      } catch {
        history.pushState({ overlay: true }, '');
      }
      return;
    }
    // 更多页（不再是弹窗，这里无需特殊处理）
    // 战斗中：弹出确认，然后保持栈深度（再push回去）
    if (inBattle) {
      setShowBattleExitConfirm(true);
      try {
        const pushed = Number(sessionStorage.getItem('__douluo_stack_count') || '0');
        history.pushState({ overlay: true }, '');
        sessionStorage.setItem('__douluo_stack_count', '1');
      } catch {
        history.pushState({ overlay: true }, '');
      }
      return;
    }
    // 没有叠加层：让浏览器正常返回（通常是回到启动页或退出网页）
   }, [inBattle, moreSub, activeTab]);

  useEffect(() => {
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      // 卸载时清空栈计数
      try { sessionStorage.removeItem('__douluo_stack_count'); } catch { /* ignore */ }
    };
  }, [onPopState]);

  // 页面隐藏/关闭前的最后一次存档（移动端切后台、关闭标签页、锁屏等）
  // + 30秒定时自动保存，防止大退/崩溃丢失进度
  // 注意：必须使用 saveGame() 而非直接写 scopedStorage，确保 saveVersion 字段正确（否则读档版本校验失败会清档）
  const { saveGame } = useGame();
  // 用 ref 存最新 saveGame，避免 player 变化导致 useEffect 重建定时器
  // （之前每次 player 变更都会清掉旧 interval，30 秒定时永远走不到第一下）
  const saveGameRef = useRef<() => void>(() => {});
  useEffect(() => { saveGameRef.current = saveGame; }, [saveGame]);

  // 全局定时清理过期魂环/魂灵（每10秒，所有页面下都生效）
  const { cleanupExpiredRings, cleanupExpiredSpirits, finishCultivation } = useGame();
  const [tickBreakthrough, setTickBreakthrough] = useState(0);
  // 全局定时清理过期魂环/魂灵 + 检查闭关/魂核突破（每2秒，所有页面下都生效）
  useEffect(() => {
    if (!player) return;
    const t = setInterval(() => {
      cleanupExpiredRings();
      cleanupExpiredSpirits();
      setTickBreakthrough((t) => t + 1);
    }, 2000);
    return () => clearInterval(t);
  }, [player, cleanupExpiredRings, cleanupExpiredSpirits]);

  // 普通闭关完成检测（全局，切后台回来也能立即突破）
  useEffect(() => {
    if (!player) return;
    if (player.cultivationEndTime && Date.now() >= player.cultivationEndTime && isBottleneck(player.level) && player.level !== 89 && player.level !== 98) {
      finishCultivation();
    }
   }, [tickBreakthrough, player, finishCultivation]);

   useEffect(() => {
     if (!player) return;

      const onVisibilityChange = () => {
        if (document.visibilityState === 'hidden') saveGameRef.current();
        // 切后台回来时：立即检测闭关/魂核是否完成（防止时间到了但没触发）
         if (document.visibilityState === 'visible') {
           setTickBreakthrough((t) => t + 1);
        }
     };
     const onPageHide = () => saveGameRef.current();
     const onBeforeUnload = () => saveGameRef.current();

    // 30秒定时自动保存（只建一次，不会因 player 变化而重置）
    const intervalId = setInterval(() => saveGameRef.current(), 30000);
    // 额外兜底：10 秒后先存一次，避免刚进游戏就大退丢进度
    const firstSaveTimer = setTimeout(() => saveGameRef.current(), 10000);

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      clearInterval(intervalId);
      clearTimeout(firstSaveTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
      // 组件卸载时也保存一次
      saveGameRef.current();
    };
  }, [player]);

  // 加载中
  if (loading || !player) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // 渲染主内容面板
  const renderPanel = (tab: TabValue) => {
    switch (tab) {
      case 'character': return <CharacterPanel />;
      case 'inventory': return <InventoryPanel />;
      case 'map': return <MapPanel />;
      case 'soulRing': return <SoulRingPanel />;
      case 'cultivation': return <CultivationPanel />;
      case 'craft': return <CraftPanel onBack={() => handleDesktopNav('character')} />;
      case 'domain': return <DomainPanel onBack={() => handleDesktopNav('character')} />;
      case 'convert': return <MaterialConvertPanel onBack={() => handleDesktopNav('character')} />;
      case 'divineTrial': return <DivineTrialPanel onClose={() => handleDesktopNav('character')} />;
      case 'artifact': return <ArtifactPanel onClose={() => handleDesktopNav('character')} />;
      case 'ascension': return <DragonLegendPanel mode="ascension"/>;
      case 'forgeArmor': return <DragonLegendPanel mode="forge"/>;
      case 'soulSpirit': return <SoulSpiritPanel />;
      case 'settings': return <SettingsPanel onBack={() => handleDesktopNav('character')} />;
      case 'reincarnation': return <ReincarnationPanel onClose={() => handleDesktopNav('character')} onOpenHistory={() => setActiveTab('reincarnationHistory')} />;
      case 'reincarnationHistory': return <ReincarnationHistoryPanel onClose={() => handleDesktopNav('character')} />;
      case 'achievement': return <AchievementPanel onClose={() => handleDesktopNav('character')} />;
      case 'godRealm': return <GodRealmPanel onClose={() => handleDesktopNav('character')} />;
      case 'laws': return <LawPanel onClose={() => handleDesktopNav('character')} />;
      case 'companions': return <CompanionsPanel onBack={() => handleDesktopNav('character')} />;
      case 'shop': return <InventoryPanel />;
      case 'reincarnationShadow': return <ReincarnationShadowPanel onClose={()=>handleDesktopNav('character')} onStartBattle={orb=>{const cfg=__localBuildShadow(orb);cfg.meta.shadowOrb=orb;cfg.meta.expReward=Math.max(1000,orb.level**2*20);cfg.meta.coinReward=Math.max(500,orb.level*500);startBattle(cfg);}}/>;
      case 'more':
        if (moreSub === 'settings') return <SettingsPanel onBack={() => setMoreSub(null)} />;
        if (moreSub === 'craft') return <CraftPanel onBack={() => setMoreSub(null)} />;
        if (moreSub === 'domain') return <DomainPanel onBack={() => setMoreSub(null)} />;
        if(moreSub==='ascension')return <DragonLegendPanel mode="ascension"/>;
        if(moreSub==='forgeArmor')return <DragonLegendPanel mode="forge"/>;
        if (moreSub === 'soulSpirit') return <SoulSpiritPanel />;
        if (moreSub === 'convert') return <MaterialConvertPanel onBack={() => setMoreSub(null)} />;
        if (moreSub === 'divineTrial') return <DivineTrialPanel onClose={() => setMoreSub(null)} />;
         if (moreSub === 'artifact') return <ArtifactPanel onClose={() => setMoreSub(null)} />;
          if (moreSub === 'reincarnation') return <ReincarnationPanel onClose={() => setMoreSub(null)} onOpenHistory={() => setMoreSub('reincarnationView')} />
           if (moreSub === 'reincarnationView') return <ReincarnationHistoryPanel onClose={() => setMoreSub(null)} />;
           if (moreSub === 'reincarnationShadow') return (
             <ReincarnationShadowPanel
               onClose={() => setMoreSub(null)}
               onStartBattle={(orb) => {
                 const cfg=__localBuildShadow(orb);cfg.meta.shadowOrb=orb;cfg.meta.expReward=Math.max(1000,orb.level**2*20);cfg.meta.coinReward=Math.max(500,orb.level*500);startBattle(cfg);
                 setMoreSub(null);
               }}
             />
           );
         if (moreSub === 'achievement') return <AchievementPanel onClose={() => setMoreSub(null)} />;
           if (moreSub === 'godRealm') return <GodRealmPanel onClose={() => setMoreSub(null)} />;
           if (moreSub === 'laws') return <LawPanel onClose={() => setMoreSub(null)} onBack={() => setMoreSub(null)} />;
           if (moreSub === 'companions') return <CompanionsPanel onBack={() => setMoreSub(null)} />;
           if (moreSub === 'codex') return <CodexPanel onBack={() => setMoreSub(null)} />;
        return (
          <MorePage
             onOpenSettings={() => openMoreSub('settings')}
             onOpenCraft={() => openMoreSub('craft')}
             onOpenDomain={() => openMoreSub('domain')}
             onOpenAscension={() => openMoreSub('ascension')}
             onOpenForgeArmor={() => openMoreSub('forgeArmor')}
             onOpenSoulSpirit={() => openMoreSub('soulSpirit')}
             onOpenConvert={() => openMoreSub('convert')}
             onOpenDivineTrial={() => openMoreSub('divineTrial')}
             onOpenArtifact={() => openMoreSub('artifact')}
             onOpenReincarnation={() => openMoreSub('reincarnation')}
             onOpenReincarnationView={() => openMoreSub('reincarnationView')}
             onOpenReincarnationShadow={() => openMoreSub('reincarnationShadow')}
             onOpenAchievement={() => openMoreSub('achievement')}
              onOpenGodRealm={() => openMoreSub('godRealm')}
              onOpenLaws={() => openMoreSub('laws')}
              onOpenCompanions={() => openMoreSub('companions')}
              onOpenCodex={() => openMoreSub('codex')}
           />
        );
      default: return <CharacterPanel />;
    }
  };

  // ========== 移动端布局 ==========
  if (isMobile) {
    return (
      <div className="relative flex flex-col h-[100dvh] w-full overflow-hidden">
        {/* 天空背景 */}
        <div className="absolute inset-0 pointer-events-none">
          <StarryBackground />
        </div>

        {/* 顶部状态栏 */}
        <div
          className="relative shrink-0 px-3 pt-2 pb-1.5 border-b border-cyan-500/20 backdrop-blur-lg bg-card/90 flex items-center justify-between gap-2 z-10 text-foreground"
          style={{ boxShadow: '0 1px 0 rgba(34,211,238,0.1), 0 2px 8px rgba(0,0,0,0.3)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <DivineRingAvatar
              name={player.name}
              isDeity={!!player.divineTrial?.inherited}
              ringColor={player.divineTrial?.divineSoulRing?.color ?? '#fcd34d'}
              borderColor="hsl(185 85% 55%)"
              size="sm"
              shape="circle"
              textSize="text-[11px]"
            />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-cyan-100 truncate">
                {player.name}
              </div>
              <div className="text-[10px] text-cyan-400/70">Lv.{player.level} · {getRealmDisplay(player.level, player.soulRings.length, player.title, player.easterRealmStage, player.divineTrial)}</div>
            </div>
          </div>

          {/* 魂币 */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/15 border border-amber-400/30">
              <Coins className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />
              <span className="text-xs font-semibold text-amber-300 tabular-nums">{formatNumber(player.soulCoins)}</span>
            </div>
          </div>
        </div>

        {/* 顶部小字滚动公告 */}
        <AnimatePresence>
          {showTopNotice && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="relative flex items-center gap-2 px-3 py-1.5 bg-amber-950/40 border-b border-amber-500/30 text-amber-200 overflow-hidden">
                <span className="shrink-0 text-[10px] font-bold text-amber-400">公告</span>
                <div className="flex-1 overflow-hidden whitespace-nowrap relative">
                  <div
                    className="inline-block text-xs"
                    style={{
                      animation: 'notice-scroll 25s linear infinite',
                    }}
                  >
                    如果游戏中遇见什么问题或者是bug的，请及时反馈Q群：1097183773
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTopNotice(false);
                    try { scopedStorage.setItem('__douluo_top_notice_closed', '1'); } catch {}
                  }}
                  className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-amber-500/20 text-amber-300/80 hover:text-amber-200 transition-colors"
                  aria-label="关闭公告"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <style>{`
                @keyframes notice-scroll {
                  0% { transform: translateX(100%); }
                  100% { transform: translateX(-100%); }
                }
              `}</style>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 虚弱状态倒计时横幅 */}
        <AnimatePresence>
          {weaknessRemain > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-3 py-2 bg-red-950/60 border-b border-red-500/30 flex items-center gap-2 text-red-300">
                <Clock className="w-3.5 h-3.5 shrink-0 text-red-400 animate-pulse" />
                <span className="text-xs font-medium">虚弱中</span>
                <span className="ml-auto text-xs font-bold tabular-nums text-red-300">
                  {formatWeaknessTime(weaknessRemain)}
                </span>
                <span className="text-[10px] text-red-400/70">· 全属性-80%</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 主内容区 */}
        <div className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden mx-auto w-full max-w-2xl md:max-w-3xl lg:max-w-5xl" style={{ paddingBottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px) + 1rem)' }}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="px-3 py-3"
          >
            {renderPanel(activeTab)}
          </motion.div>
        </div>

        {/* 底部导航栏 */}
        <div
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-cyan-500/20 bg-background/90 backdrop-blur-xl text-cyan-200"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            boxShadow: '0 -2px 12px rgba(34,211,238,0.08), 0 -1px 0 rgba(34,211,238,0.15)',
          }}
        >
          <div className="mx-auto max-w-2xl">
            <Tabs
              value={activeTab}
              onValueChange={(v) => {
                handleMobileTabChange(v as TabValue);
              }}
            >
              <TabsList className="w-full grid grid-cols-6 bg-transparent border-0 p-0 h-14">
                {MOBILE_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <TabsTrigger
                      key={item.value}
                      value={item.value}
                      className="flex flex-col items-center justify-center gap-0.5 py-1.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full relative data-[state=active]:text-cyan-400 text-cyan-400/50"
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.8} />
                      <span className="text-[11px]">{item.label}</span>
                      {item.value === activeTab && (
                        <motion.div
                          layoutId="nav-underline"
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-cyan-400"
                        />
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* 战斗退出确认弹窗 */}
        {showBattleExitConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-sm rounded-xl border border-border/60 bg-card p-5 shadow-2xl">
              <div className="text-lg font-bold mb-2">退出战斗？</div>
              <div className="text-sm text-muted-foreground mb-5 leading-relaxed">
                战斗进行中，退出将视为逃跑，本次战斗奖励将丢失。确定要退出吗？
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBattleExitConfirm(false);
                  }}
                  className="flex-1 h-10 rounded-lg border border-border/60 bg-card text-sm font-medium hover:bg-accent/30 transition-colors"
                >
                  继续战斗
                </button>
                <button
                  onClick={() => {
                    setShowBattleExitConfirm(false);
                    endBattle();
                  }}
                  className="flex-1 h-10 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm font-bold hover:bg-red-500/30 transition-colors"
                >
                  退出战斗
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 战斗界面覆盖层 */}
        {inBattle && battleState && (
          <div className="fixed inset-0 z-[100]">
            <BattlePage />
          </div>
        )}

        {/* 封号斗罗命名弹窗 */}
        <TitleDialog />

        {/* 🔴 v17.1 侣系统·青睐弹窗（战斗结束回到主界面后弹出，防误触） */}
        {pendingFavorBeastId && !inBattle && (
          <FavorModal
            beastId={pendingFavorBeastId}
          />
        )}
      </div>
    );
  }

  // ========== 电脑端布局（侧边栏） ==========
  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden bg-background">
      {/* 天空背景 */}
      <div className="absolute inset-0 pointer-events-none">
        <StarryBackground />
      </div>

      {/* 左侧侧边栏 */}
      <aside
        className="relative z-20 flex flex-col w-56 shrink-0 border-r border-cyan-500/20 bg-card/80 backdrop-blur-xl text-cyan-100"
        style={{ boxShadow: '1px 0 12px rgba(34,211,238,0.06)' }}
      >
        {/* Logo / 游戏标题 */}
        <div className="px-5 py-5 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black border-2 shrink-0"
              style={{
                borderColor: 'hsl(185 85% 55%)',
                background: 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(34,211,238,0.08))',
                color: 'hsl(185 85% 70%)',
                boxShadow: '0 0 12px rgba(34,211,238,0.3), inset 0 0 10px rgba(34,211,238,0.15)',
              }}
            >
              斗
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-cyan-200 truncate" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                绝世唐门
              </div>
              <div className="text-[11px] text-cyan-400/60">魂师修炼录</div>
            </div>
          </div>
        </div>

        {/* 玩家信息 */}
        <div className="px-4 py-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0"
              style={{
                borderColor: 'hsl(185 85% 55%)',
                background: 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(34,211,238,0.08))',
                color: 'hsl(185 85% 70%)',
                boxShadow: '0 0 10px rgba(34,211,238,0.3), inset 0 0 8px rgba(34,211,238,0.15)',
              }}
            >
              {player.name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-cyan-100 truncate">
                {player.name}
              </div>
              <div className="text-[11px] text-cyan-400/70 truncate">
                Lv.{player.level} · {getRealmDisplay(player.level, player.soulRings.length, player.title, player.easterRealmStage, player.divineTrial)}
              </div>
            </div>
          </div>
          {/* 魂币 */}
          <div className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-400/20">
            <Coins className="w-4 h-4 text-amber-400" fill="currentColor" />
            <span className="text-sm font-semibold text-amber-300 tabular-nums flex-1">{formatNumber(player.soulCoins)}</span>
            <span className="text-[10px] text-amber-400/70">魂币</span>
          </div>
        </div>

        {/* 导航列表 */}
        <nav className="flex-1 min-h-0 overflow-y-auto py-3 px-3 space-y-4">
          {SIDEBAR_GROUPS.map((group) => (
            <div key={group.groupLabel}>
              <div className="px-3 mb-1.5 text-[11px] font-semibold text-cyan-500/50 tracking-wider uppercase">
                {group.groupLabel}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.value;
                  return (
                    <button
                      key={item.value}
                      onClick={() => handleDesktopNav(item.value)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 shadow-md shadow-cyan-500/10'
                          : 'text-cyan-300/60 hover:bg-cyan-500/10 hover:text-cyan-200 border border-transparent'
                      }`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-cyan-300' : 'text-cyan-500/50'}`} strokeWidth={1.8} />
                      <span className="font-medium truncate">{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="ml-auto w-1 h-5 rounded-full bg-cyan-400"
                          style={{ boxShadow: '0 0 8px rgba(34,211,238,0.6)' }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* 右侧主区域 */}
      <div className="flex flex-col flex-1 min-w-0 relative">
        {/* 顶部状态栏（电脑端简化：显示当前页标题） */}
        <header
          className="relative shrink-0 px-8 py-4 border-b border-cyan-500/20 backdrop-blur-lg bg-card/50 flex items-center justify-between z-10"
          style={{ boxShadow: '0 1px 0 rgba(34,211,238,0.08), 0 2px 12px rgba(0,0,0,0.2)' }}
        >
          <div>
            <h1 className="text-xl font-bold text-cyan-100" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              {getPageTitle(activeTab)}
            </h1>
            <div className="text-xs text-cyan-400/60 mt-0.5">
              {getRealmDisplay(player.level, player.soulRings.length, player.title, player.easterRealmStage, player.divineTrial)}
            </div>
          </div>

          {/* 虚弱状态倒计时（桌面端） */}
          <AnimatePresence>
            {weaknessRemain > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300"
              >
                <Clock className="w-4 h-4 text-red-400 animate-pulse" />
                <span className="text-sm font-medium">虚弱</span>
                <span className="text-sm font-bold tabular-nums text-red-200">
                  {formatWeaknessTime(weaknessRemain)}
                </span>
                <span className="text-xs text-red-400/70">· 全属性-80%</span>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* 顶部小字滚动公告（电脑端） */}
        <AnimatePresence>
          {showTopNotice && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="relative flex items-center gap-3 px-8 py-2 bg-amber-950/40 border-b border-amber-500/30 text-amber-200 overflow-hidden">
                <span className="shrink-0 text-xs font-bold text-amber-400">📢 公告</span>
                <div className="flex-1 overflow-hidden whitespace-nowrap relative">
                  <div
                    className="inline-block text-sm"
                    style={{
                      animation: 'notice-scroll-desktop 30s linear infinite',
                    }}
                  >
                    如果游戏中遇见什么问题或者是bug的，请及时反馈Q群：1097183773
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTopNotice(false);
                    try { scopedStorage.setItem('__douluo_top_notice_closed', '1'); } catch {}
                  }}
                  className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-amber-500/20 text-amber-300/80 hover:text-amber-200 transition-colors"
                  aria-label="关闭公告"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <style>{`
                @keyframes notice-scroll-desktop {
                  0% { transform: translateX(100%); }
                  100% { transform: translateX(-100%); }
                }
              `}</style>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 主内容区 */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="max-w-6xl mx-auto px-8 py-6"
          >
            {renderPanel(activeTab)}
          </motion.div>
        </main>
      </div>

      {/* 战斗界面覆盖层 */}
      {inBattle && battleState && (
        <div className="fixed inset-0 z-[100]">
          <BattlePage />
        </div>
      )}

      {/* 封号斗罗命名弹窗 */}
      <TitleDialog />

      {/* 🔴 v17.1 侣系统·青睐弹窗（仅主界面显示，战斗结束回到主界面后弹出，防误触） */}
      {pendingFavorBeastId && !inBattle && (
        <FavorModal
          beastId={pendingFavorBeastId}
        />
      )}
    </div>
  );
}

// 获取当前页面标题
function getPageTitle(tab: TabValue): string {
  const titles: Record<TabValue, string> = {
    character: '角色',
    inventory: '背包',
    map: '地图',
    soulRing: '魂环',
    cultivation: '闭关修炼',
    more: '更多',
    shop: '魂导器商店',
    craft: '自制魂导器',
    domain: '领域',
    convert: '材料转换',
    divineTrial: '神考',
    artifact: '神器',
    soulSpirit: '魂灵', ascension:'升灵台', forgeArmor:'锻造斗铠',
    reincarnation: '转世轮回',
    reincarnationHistory: '轮回史鉴',
    settings: '设置',
    achievement: '成就殿堂',
    godRealm: '神界',
    laws: '法则修炼',
    companions: '侣',
  };
  return titles[tab] || '角色';
}

