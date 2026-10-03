import { recordLiehunHit, type LiehunLedger } from '@/lib/liehunGrowth';
import {readArmorDomain,startArmorDomain,finishArmorDomainAction,armorDomainMultiplier,ARMOR_DOMAIN_NAMES,ARMOR_DOMAIN_EFFECTS} from '@/lib/armorDomain';
import {dragonAction,dragonProgress,armorTier} from '@/lib/dragonLegend';
import {__FBProfiles,__fbClone,__fbCreate,__fbHeal,__fbDefense,__fbDirect,__fbBegin,__fbFinish,__fbEnemyAction,__fbSpeed,__fbStatus} from '@/lib/fierceEffects';
import {__localShadowAction} from '@/lib/shadow';
import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Heart, ArrowLeft, Coins, Plus, Trash2, Sparkles, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useGame, calcAttributes, RING_COLOR_MAP, RING_DISPLAY_COLOR, QUALITY_COLOR, type IPendingSoulRing, type ISoulRing, calcRingStatsByYears, inferBeastTypeFromRing, DOMAIN_COLORS, getDomainCultivationAttr, calcDomainBonus, calcSkillDamagePct, normalizeBeastAttribute, inferElementFromName, type IReincarnationOrb } from '@/lib/gameStore';
import BattleLog from './BattleLog';
import EnemyArea from './EnemyArea';
import PlayerArea from './PlayerArea';
import DivineRingAvatar from '@/components/DivineRingAvatar';
import { getSoulElement, generateSoulSkills, getSoulDepartment } from '@/data/martialsouls';
import { type IMartialSoul } from '@/data/martialsouls';
import { rollSoulBoneDrop, getRingQualityFromYears, generateBeastInstance, getBeastSpeciesByName, getDangerLevel } from '@/data/soulbeasts';
import type { IItem } from '@/data/items';
import { rollMaterialByTier, rollMaterialWithQuality, MATERIAL_QUALITY_INFO, formatYearsLabel, getConsumableExtra, rollFierceBeastDrops, rollIceGrassDrop, IMMORTAL_GRASSES } from '@/data/items';
import { GOD_REALM_BOSSES } from '@/data/godRealm';
import { getTrialById, getArtifactByDeity } from '@/data/divineTrials';
import { SOUL_SPIRIT_POOL, getSpiritRealmName, getSpiritStats, SPIRIT_ELEMENT_COLORS, SPIRIT_SLOT_UNLOCK_LEVELS } from '@/data/soulSpirits';
import { FIERCE_BEASTS_STAR_LAKE, FIERCE_BEASTS_FROZEN } from '@/data/fierceBeasts';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit-lite';
import SoulRing from '@/components/SoulRing';
import { formatNumber } from '@/lib/utils';

type BattlePhase = 'intro' | 'playerTurn' | 'enemyTurn' | 'victory' | 'defeat' | 'flee';

interface LogEntry {
  id: number;
  text: string;
  type: 'info' | 'damage' | 'heal' | 'skill' | 'system';
}

interface BattleEnemy {
  id: string;
  name: string;
  years: number;
  qualityColor: string;
  qualityLabel: string;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  spirit: number;
  skillName: string;
  skillDesc: string;
  isEncounter?: boolean;
  element?: string; // 魂兽属性，严格传递给掉落魂环
  instantKillChance?: number; // 秒杀概率（阴阳茶等特殊角色）
  specialSkillCooldown?: number; // 特殊技能冷却回合数
  hasOnlySkill?: boolean; // 是否只有技能攻击（无普攻）
}

interface DungeonDrop {
  matId: string;
  matName: string;
  quality: 'common' | 'fine' | 'rare';
  qualityColor: string;
  tier: number;
  iconChar: string;
}

interface BattleMeta {
  coinReward?: number;
  dungeonId?: string;
  drops?: DungeonDrop[];
  spiritId?: string;
  spiritName?: string;
  spiritAttribute?: string;
  spiritDesc?: string;
  spiritFeature?: string;
  spiritIconChar?: string;
  spiritTower?: boolean;
}

interface BattlePageProps {
  battleType?: 'hunt' | 'encounter' | 'challenge' | 'shrek-exam' | 'arena' | 'mountain-dungeon' | 'demon' | 'sea-god' | 'fierce-beast' | 'divine-avatar' | 'divine-ditian' | 'divine-beast' | 'spirit-tower' | 'god-realm';
  locationId?: string;
  beastId?: string;
  beastName?: string;
  beastYears?: number;
  beastColor?: string;
  beastLabel?: string;
  beastHp?: number;
  beastAttack?: number;
  beastDefense?: number;
  beastSpeed?: number;
  beastSpirit?: number;
  beastSkillName?: string;
  beastSkillDesc?: string;
  beastElement?: string;
  exploreTier?: string;
  nodeIdx?: number;
}

const RING_ORDER = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

export default memo(function BattlePage(props: BattlePageProps = {}) {
  const {
    player,
    addExp,
    addCoins,
    addItem,
    addSoulRing,
    addPendingRing,
    discardPendingRing,
    addPendingSpirit,
    setCurrentHp,
    setPlayer,
    battleState,
    setBattleState,
    setInBattle,
    endBattle,
     saveGame,
    collectExploreItem,
    collectExploreRing,
    removeExploreRing,
    finishExploration,
    addArenaResult,
    confirmSeaGodVictory,
    confirmDivineAvatarVictory,
    confirmDiTianVictory,
     confirmDivineBeastVictory,
     confirmGodRealmVictory,
       canTriggerTianmeng,
      acceptTianmengSacrifice,
      rejectTianmengSacrifice,
      recordDivineAvatarDefeat,
        checkAndStoreFavorTrigger,
        challengeCompanionWin,
        claimShadowVictory,
        settleLiehunVictory,
        challengeCompanionLose,
        devourBeast,
        recordTeaDefeat,
        getTeaDefeatCount,
        convertSpecialSpirit,
        forceMarryHundunCha,
        hasHundunChaSpouse,
     } = useGame();

  const logRef = useRef<HTMLDivElement>(null);
  const logIdRef = useRef(0);
  // 统一用一个 ref 管理敌方回合的外层 + 内层调度，避免嵌套定时器泄漏
  const enemyTurnTimerRef = useRef<number | null>(null);
  // 领域开启动画定时器，用于清理
  const domainAnimTimerRef = useRef<number | null>(null);
  // 第二领域开启动画定时器
  const secondDomainAnimTimerRef = useRef<number | null>(null);
  // 魂灵依次攻击的递归定时器
  const spiritAttackTimerRef = useRef<number | null>(null);

  // 战斗是否已经结束（胜利/失败/逃跑），用于防止胜利判定被重复触发
  const battleEndedRef = useRef(false);
  // 行动锁：防止玩家在回合切换延迟窗口内连击
  const actionLockRef = useRef(false);
  // 最后造成伤害的武魂索引（0=主修, 1=次修），用于魂环掉落判定
  const lastHitSoulIndexRef = useRef<0 | 1>(0);
  // 伤害数字弹出定时器集合，用于卸载时清理
  const popupTimersRef = useRef<number[]>([]);
  // 逃跑成功后的结束战斗定时器
  const fleeEndTimerRef = useRef<number | null>(null);
  const defeatHealTimerRef = useRef<number | null>(null);
  const battleSpiritsRef = useRef<typeof battleSpirits>([]);
  const __fbRef=useRef<any>(null);

  // 安全清理敌方回合定时器（嵌套两层都清）
  const clearEnemyTimer = () => {
    if (enemyTurnTimerRef.current) {
      clearTimeout(enemyTurnTimerRef.current);
      enemyTurnTimerRef.current = null;
    }
  };

  // 安全调度敌方回合（先清旧的再设新的，保证不会并发两个调度）
  // 流程：玩家行动 → 魂灵出手 → 敌人行动
  const scheduleEnemyAction = (delay: number, completePlayerAction=true) => {
    __fbFinishPlayer();if(completePlayerAction)__armorFinishAction();clearEnemyTimer();
    if(battleEndedRef.current||enemyHpRef.current<=0||playerHpRef.current<=0)return;
    if(__fbGet()?.enemyActed){enemyTurnTimerRef.current=window.setTimeout(()=>__fbEnterPlayer(),getAnimDelay(600));return;}
    enemyTurnTimerRef.current = window.setTimeout(async () => {
      // 先让魂灵依次攻击（如果敌人还活着）
      const aliveSpirits = battleSpiritsRef.current.filter((s) => !s.dead && s.hp > 0);
      if (aliveSpirits.length > 0) {
        await __fbRunSpirits();
        // 魂灵攻击后如果敌人已死，不再进入敌人回合
        if (battleEndedRef.current) {
          actionLockRef.current = false;
          return;
        }
      }
      setPhase('enemyTurn');
      enemyTurnTimerRef.current = window.setTimeout(() => {
        enemyAction();
      }, getAnimDelay(700));
    }, getAnimDelay(delay));
  };

  const [phase, setPhase] = useState<BattlePhase>((battleState?.phase==='intro'?'playerTurn':battleState?.phase||'playerTurn') as BattlePhase);
  // 胜利阶段细分：'ring-select' 选择魂环 → 'summary' 结算展示
   const [victoryStep, setVictoryStep] = useState<'ring-select' | 'spirit-select' | 'summary'>('ring-select');
   // 🔴 吞噬茶武魂·吞噬弹窗（魂环收取/销毁后弹出）
   const [devourDialog, setDevourDialog] = useState<{
     open: boolean;
     phase: 'confirm' | 'result' | 'backlash';
     attrLabel?: string;
     value?: number;
     backlashValue?: number;
   }>({ open: false, phase: 'confirm' });
   // 🔴 三茶转化魂灵弹窗（第二次击败时）
   const [convertSpiritDialog, setConvertSpiritDialog] = useState<{
     open: boolean;
     spiritId?: string;
     name?: string;
     sourceId?: string;
     attribute?: string;
     hp?: number;
     attack?: number;
     defense?: number;
     speed?: number;
     spirit?: number;
     skillName?: string;
     skillDesc?: string;
     instantKillChance?: number;
     iconChar?: string;
     done?: boolean;
   }>({ open: false });
   // 🔴 混沌茶强配弹窗
   const [hundunForceDialog, setHundunForceDialog] = useState<{
     open: boolean;
     phase: 'confirm' | 'story' | 'done';
   }>({ open: false, phase: 'confirm' });
  const [enemyHp, setEnemyHp] = useState(battleState?.enemy?.hp ?? 100);
  const [enemyMaxHp, setEnemyMaxHp] = useState(battleState?.enemy?.maxHp ?? 100);
  const [logs, setLogs] = useState<LogEntry[]>([]);
   const [rewards, setRewards] = useState<{
     exp: number;
     coins: number;
     items: IItem[];
     ring: ISoulRing | null;
     ringSoulIndex: 0 | 1;
     soulBones: IItem[];
     beastName: string;
     beastYears: number;
     beastQuality: string;
   }>({
     exp: 0, coins: 0, items: [], ring: null, ringSoulIndex: 0, soulBones: [], beastName: '', beastYears: 0, beastQuality: 'white',
   });

   // 🔴 v16.0 神界系统：禁魂技状态（被神技封禁后玩家N回合无法使用魂技）
   const [skillBanTurns, setSkillBanTurns] = useState(0);
   // 敌方禁魂技神技冷却回合（白山茶的「禁」）
   const [enemyBanCooldown, setEnemyBanCooldown] = useState(0);
   // 🔴 敌方特殊技能冷却（阴阳茶等特殊角色的必杀技）
   const [enemySpecialCd, setEnemySpecialCd] = useState(0);

    const battleType = battleState?.battleType ?? props.battleType ?? 'hunt';
  const locationId = battleState?.locationId ?? props.locationId ?? '';
  const isExploreBattle = battleType === 'encounter' && (battleState?.exploreSource != null || !!battleState?.locationId);

  // ============================================================
  // 构造敌人（useMemo 避免重复计算）
  // ============================================================
  const enemy: BattleEnemy = useMemo(() => {
    // 全局战斗状态优先（无论进行中还是已结束，都用实际战斗的敌人数据）
    if (battleState && battleState.enemy) {
      const e = battleState.enemy;
      return {
        id: e.id,
        name: e.name,
        years: e.years,
        qualityColor: e.qualityColor,
        qualityLabel: e.qualityLabel,
        hp: e.hp,
        attack: e.attack,
        defense: e.defense,
        speed: e.speed,
        spirit: e.spirit ?? Math.round(e.attack * 0.6),
        skillName: e.skillName,
        skillDesc: e.skillDesc,
        isEncounter: e.isEncounter,
        element: e.element,
        instantKillChance: (e as any).instantKillChance ?? 0,
        specialSkillCooldown: (e as any).specialSkillCooldown ?? 0,
        hasOnlySkill: !!(e as any).hasOnlySkill,
      };
    }

     // 搜索遭遇模式
     if (battleType === 'encounter') {
       const years = props.beastYears ?? 100;
       const color = props.beastColor || 'white';
       return {
         id: props.beastId || 'encounter-beast',
         name: props.beastName || '未知魂兽',
         years,
         qualityColor: color,
         qualityLabel: props.beastLabel || '',
         hp: props.beastHp ?? 200,
         attack: props.beastAttack ?? 20,
         defense: props.beastDefense ?? 10,
         speed: props.beastSpeed ?? 15,
         spirit: props.beastSpirit ?? Math.round((props.beastAttack ?? 20) * 0.6),
         skillName: props.beastSkillName || '撞击',
         skillDesc: props.beastSkillDesc || '用身体撞击',
         isEncounter: true,
         element: props.beastElement,
       };
     }

    // 挑战 / 旧猎魂模式
    let tier: 'outer' | 'middle' | 'core' | 'life-lake' = 'outer';
    if (locationId.includes('middle') || locationId.includes('zhong') || locationId.includes('中部') || locationId.endsWith('-2')) tier = 'middle';
    else if (locationId.includes('core') || locationId.includes('核心') || locationId.endsWith('-3')) tier = 'core';
    else if (locationId.includes('life') || locationId.includes('生命之湖') || locationId.includes('lake') || locationId.endsWith('-4')) tier = 'life-lake';

    const beast = generateBeastInstance(tier);
    return {
      id: beast.id,
      name: beast.name,
      years: beast.years,
      qualityColor: beast.qualityColor,
      qualityLabel: beast.qualityLabel,
      hp: beast.hp,
      attack: beast.attack,
      defense: beast.defense,
      speed: beast.speed,
      spirit: Math.round(beast.attack * 0.6),
      skillName: beast.skillName,
      skillDesc: beast.skillDesc,
      element: beast.element,
    };
  }, [battleState, props, locationId, battleType]);

  // ============================================================
  // 玩家属性（useMemo 缓存）
  // ============================================================
  const attrs = useMemo(() => (player ? calcAttributes(player) : null), [player]);

  // ============================================================
  // 玩家/敌人信息（提前计算，避免 early return 后 hooks 顺序错乱）
  // ============================================================
  const playerName = player?.name ?? '';
  const playerTitle = player?.title ?? '';
  const playerLevel = player?.level ?? 1;
  const playerSoulRings = player?.soulRings ?? [];
  const playerCurrentHp = player?.currentHp ?? 0;
  const playerMartialSoul = player?.martialSoul;
  const playerSecondSoul = player?.secondSoul ?? null;
  const secondSoulRings = player?.secondSoulRings ?? [];
  const isTwinSoul = !!player?.isTwinSoul && !!player.secondSoul;
  const playerQuality = player?.martialSoul?.quality ?? 'common';

  // 根据给定武魂的修炼属性，取对应的基础主属性值（不含领域加成）
  const getMainAttrForSoul = useCallback(
    (soul: IMartialSoul | null | undefined): number => {
      if (!attrs || !soul) return attrs?.attack ?? 0;
      const a = soul.cultivationAttr;
      if (a === 'strength') return attrs.attack;
      if (a === 'spirit') return attrs.spirit;
      if (a === 'agility') return attrs.speed;
      if (a === 'defense') return attrs.defense;
      if (a === 'support') return attrs.spirit;
      // 混沌/全属性：取最高攻击类属性（排除气血，避免用血量计算伤害）
      return Math.max(attrs.attack, attrs.defense, attrs.speed, attrs.spirit);
    },
    [attrs],
  );

  // 主修武魂的基础主属性值（用于UI展示等非技能伤害场景）
  const mainAttrValue = useMemo(() => getMainAttrForSoul(playerMartialSoul), [getMainAttrForSoul, playerMartialSoul]);

  // 战斗内当前血量/魂力（本地 state，战斗结束回写）
  // ⚠️ attrs 在 player 未加载完成时为 null，用 0 兜底防崩溃
  const [playerHp, __fbRawPlayerHp] = useState(battleState?.playerHp ?? attrs?.hp ?? 0);
  const [currentSoulPower, __fbRawMana] = useState(battleState?.playerSoulPower ?? attrs?.maxSoulPower ?? 0);
  // 双生武魂魂技显示切换（0=第一武魂，1=第二武魂）
  const [activeSoulSkillTab, setActiveSoulSkillTab] = useState(0);

  // 武魂真身状态：剩余回合数（0=未开启）
  const [trueBodyTurns, setTrueBodyTurns] = useState(0);
  // 武魂真身关闭后冷却回合数（关闭后4回合内不能再次开启）
  const [trueBodyCooldown, setTrueBodyCooldown] = useState(0);
  // 第二武魂真身状态（双生武魂专用）
  const [secondTrueBodyTurns, setSecondTrueBodyTurns] = useState(0);
  const [secondTrueBodyCooldown, setSecondTrueBodyCooldown] = useState(0);

  // 统一真身判断：任一武魂真身激活即为 true
  const anyTrueBody = trueBodyTurns > 0 || secondTrueBodyTurns > 0;
  // 当前激活的真身武魂索引：0=主修，1=次修，-1=未激活
  const activeTrueBodyIndex = trueBodyTurns > 0 ? 0 : secondTrueBodyTurns > 0 ? 1 : -1;
  // 当前激活真身的武魂品质
  const activeTrueQuality = useMemo(() => {
    if (activeTrueBodyIndex === 1) return playerSecondSoul?.quality ?? 'common';
    return playerQuality;
  }, [activeTrueBodyIndex, playerSecondSoul, playerQuality]);
  // 当前激活真身的武魂名
  const activeTrueSoulName = useMemo(() => {
    if (activeTrueBodyIndex === 1) return playerSecondSoul?.name ?? '';
    return playerMartialSoul?.name ?? '';
  }, [activeTrueBodyIndex, playerSecondSoul, playerMartialSoul]);
  // 领域状态：是否开启（开启期间有额外加成+保护罩+魂力消耗2倍）
  const [domainActive, setDomainActive] = useState(false);
  const armorDomainRef=useRef(readArmorDomain(battleState?.meta?.armorDomain));
  const armorDomainEnemyRef=useRef(battleState?.enemy?.id);
  if(armorDomainEnemyRef.current!==battleState?.enemy?.id){armorDomainEnemyRef.current=battleState?.enemy?.id;armorDomainRef.current=readArmorDomain(battleState?.meta?.armorDomain);}
  function __armorCommit(next){armorDomainRef.current=next;setBattleState(prev=>prev&&prev.enemy?.id===enemy.id?({...prev,meta:{...prev.meta,armorDomain:next}}):prev);}
  function __armorFinishAction(){const old=armorDomainRef.current;if(!old.turns)return;const r=finishArmorDomainAction(old,playerHpRef.current,attrs.hp,enemyHpRef.current);__armorCommit(r.state);if(r.heal>0){setPlayerHp(v=>Math.min(attrs.hp,v+r.heal));addLog('斗铠领域·生息：恢复 '+formatNumber(r.heal)+' 气血。','heal');}if(old.turns&&!r.state.turns)addLog('斗铠领域已结束。','system');}
  useEffect(()=>{if(['victory','defeat','flee'].includes(phase)&&armorDomainRef.current.turns)__armorCommit({...armorDomainRef.current,turns:0,skipTick:false});},[phase]);
  // 第二领域（双生武魂）
  const [secondDomainActive, setSecondDomainActive] = useState(false);
  // 领域开启动画显示中
  const [domainAnimating, setDomainAnimating] = useState(false);
  // 第二领域动画
  const [secondDomainAnimating, setSecondDomainAnimating] = useState(false);
  // 魂灵战斗：上阵魂灵列表 + 血条
  const [battleSpirits, setBattleSpirits] = useState<{ id: string; name: string; attribute: string; iconChar: string; hp: number; maxHp: number; attack: number; defense: number; speed: number; dead: boolean; instantKillChance?: number; isSpecial?: boolean }[]>([]);
  // 同步 ref，供定时器回调读取最新值（避免 stale closure）
  useEffect(() => {
    battleSpiritsRef.current = battleSpirits;
  }, [battleSpirits]);
  // 领域颜色方案：根据领域自身cultivationAttr对应元素色
  const domainColor = useMemo(() => {
    if (!player?.domain) return null;
    const attr = player.domain.cultivationAttr as keyof typeof DOMAIN_COLORS;
    return DOMAIN_COLORS[attr] || DOMAIN_COLORS.fire;
  }, [player]);
  const secondDomainColor = useMemo(() => {
    if (!player?.secondDomain) return null;
    const attr = player.secondDomain.cultivationAttr as keyof typeof DOMAIN_COLORS;
    return DOMAIN_COLORS[attr] || DOMAIN_COLORS.ice;
  }, [player]);
  // 玩家是否有领域（70级+已觉醒选择完成，战斗中才显示领域按钮）
  const hasDomain = !!player?.domain && (player?.level ?? 0) >= 70;
  const hasSecondDomain = !!player?.secondDomain && (player?.level ?? 0) >= 70;
  // 是否双领域同时开启
  const bothDomainsActive = domainActive && secondDomainActive;
  // 战斗中领域开启时的有效属性加成（全部是百分比增量，直接乘到对应属性上）
  const domainBonus = useMemo(() => {
    if (!domainActive && !secondDomainActive) return null;
    let combined: ReturnType<typeof calcDomainBonus> = null;
    if (domainActive && player?.domain) {
      const b = calcDomainBonus(player.domain, player.level);
      if (b) combined = b;
    }
    if (secondDomainActive && player?.secondDomain) {
      const b2 = calcDomainBonus(player.secondDomain, player.level);
      if (b2) {
        if (!combined) {
          combined = b2;
        } else {
          // 双领域叠加：各加成相加（累加百分比）
          combined = {
            allAttr: (combined.allAttr || 0) + (b2.allAttr || 0),
            attack: (combined.attack || 0) + (b2.attack || 0),
            defense: (combined.defense || 0) + (b2.defense || 0),
            speed: (combined.speed || 0) + (b2.speed || 0),
            spirit: (combined.spirit || 0) + (b2.spirit || 0),
            critRate: (combined.critRate || 0) + (b2.critRate || 0),
            critDmg: (combined.critDmg || 0) + (b2.critDmg || 0),
            skillDmg: (combined.skillDmg || 0) + (b2.skillDmg || 0),
          };
        }
      }
    }
    return combined;
  }, [domainActive, secondDomainActive, player]);
  // 领域加成后的攻击/防御/速度/精神/暴击/爆伤/魂技伤害倍率
  const domainEff = useMemo(() => {
    if (!domainBonus) {
      return { atkMul: 1, defMul: 1, spdMul: armorDomainMultiplier(armorDomainRef.current,'speed'), spiMul: 1, hpMul: 1, critAdd: 0, critDmgAdd: 0, skillDmgAdd: 0 };
    }
    let atk = 1, def = 1, spd = 1, spi = 1, hp = 1;
    if (domainBonus.allAttr) { atk *= 1 + domainBonus.allAttr; def *= 1 + domainBonus.allAttr; spd *= 1 + domainBonus.allAttr; spi *= 1 + domainBonus.allAttr; hp *= 1 + domainBonus.allAttr; }
    if (domainBonus.attack) atk *= 1 + domainBonus.attack;
    if (domainBonus.defense) def *= 1 + domainBonus.defense;
    if (domainBonus.speed) spd *= 1 + domainBonus.speed;
    if (domainBonus.spirit) spi *= 1 + domainBonus.spirit;
    if (domainBonus.hp) hp *= 1 + domainBonus.hp;
    return {
      atkMul: atk,
      defMul: def,
      spdMul: spd*armorDomainMultiplier(armorDomainRef.current,'speed'),
      spiMul: spi,
      hpMul: hp,
      critAdd: domainBonus.critRate || 0,
      critDmgAdd: domainBonus.critDmg || 0,
      skillDmgAdd: domainBonus.skillDmg || 0,
    };
  }, [domainBonus,battleState?.meta?.armorDomain]);

  // 根据武魂修炼属性，取领域加成后的有效主属性值
  // 支持双生武魂各自修炼属性；混沌系自动匹配最高属性对应的领域倍率
  const getEffectiveMainAttrForSoul = useCallback(
    (soul: IMartialSoul | null | undefined): number => {
      const base = getMainAttrForSoul(soul);
      if (!attrs || !soul) return base;
      const a = soul.cultivationAttr;
      if (a === 'strength') return Math.round(base * domainEff.atkMul);
      if (a === 'spirit') return Math.round(base * domainEff.spiMul);
      if (a === 'agility') return Math.round(base * domainEff.spdMul);
      if (a === 'defense') return Math.round(base * domainEff.defMul);
      if (a === 'support') return Math.round(base * domainEff.spiMul);
      // 混沌/全属性：找出哪个属性经领域加成后最高，用对应领域倍率
      const attrsArr = [
        { val: attrs.attack, mul: domainEff.atkMul },
        { val: attrs.defense, mul: domainEff.defMul },
        { val: attrs.speed, mul: domainEff.spdMul },
        { val: attrs.spirit, mul: domainEff.spiMul },
      ];
      const best = attrsArr.reduce((max, cur) => {
        const curFinal = cur.val * cur.mul;
        const maxFinal = max.val * max.mul;
        return curFinal > maxFinal ? cur : max;
      }, attrsArr[0]);
      return Math.round(best.val * best.mul);
    },
    [attrs, domainEff, getMainAttrForSoul],
  );

  // 主修武魂的有效主属性（便捷引用）
  const effectiveMainAttr = useMemo(() => getEffectiveMainAttrForSoul(playerMartialSoul), [getEffectiveMainAttrForSoul, playerMartialSoul]);

  // 神器信息（拔出神器后普攻变神器名+有神技）
  const artifactInfo = useMemo(() => {
    const dt = player?.divineTrial;
    if (!dt?.artifactDrawn || !dt?.chosenTrialId) return null;
    const trial = getTrialById(dt.chosenTrialId);
    const artifact = getArtifactByDeity(dt.chosenTrialId);
    if (!trial || !artifact) return null;
    return { trial, artifact, level: dt.artifactLevel ?? 1 };
  }, [player?.divineTrial]);

  // 是否已继承神位（决定神技是否可用）
  const hasDivineSkill = !!player?.divineTrial?.inherited && !!artifactInfo;

  // 临时增益（攻击/防御/速度/精神，每个属性独立剩余回合数）
  const [tempBuffs, setTempBuffs] = useState<{ attack: { value: number; turns: number }; defense: { value: number; turns: number }; speed: { value: number; turns: number }; spirit: { value: number; turns: number } } | null>(null);
  // 神技冷却回合数
  const [divineSkillCooldown, setDivineSkillCooldown] = useState(0);
  const [damagePopups, setDamagePopups] = useState<Array<{ id: number; text: string; isCrit: boolean; target: 'player' | 'enemy' }>>([]);
  // 🔴 v22.0 自动战斗系统
  const [autoBattle, setAutoBattle] = useState(false);
  const [battleSpeed, setBattleSpeed] = useState(1); // 1~9倍速
  const autoBattleTimerRef = useRef<number | null>(null);
  // 武魂真身魂力消耗：基础150点（领域激活时×2/双领域×4）
  const TRUE_BODY_BASE_COST = 150;
  const TRUE_BODY_COST = TRUE_BODY_BASE_COST;
  const getTrueBodyCost = useCallback(() => {
    let cost = TRUE_BODY_COST;
    if (domainActive) cost *= 2;
    if (secondDomainActive) cost *= 2;
    return cost;
  }, [domainActive, secondDomainActive]);
  const popupIdRef = useRef(0);
  const showDamagePopup = (text: string, isCrit: boolean, target: 'player' | 'enemy') => {
    const id = ++popupIdRef.current;
    setDamagePopups((p) => [...p, { id, text, isCrit, target }]);
    const timer = window.setTimeout(() => {
      setDamagePopups((p) => p.filter((x) => x.id !== id));
      popupTimersRef.current = popupTimersRef.current.filter((t) => t !== timer);
    }, getAnimDelay(1000));
    popupTimersRef.current.push(timer);
  };

  // 格式化伤害数字（带万/亿单位）
  const fmtDmg = (n: number) => formatNumber(Math.round(n));

  // ============================================================
  // 血条百分比（稳定计算，不触发 state）
  // ============================================================
  const enemyHpPercent = useMemo(() => {
    if (enemyMaxHp <= 0) return 0;
    return Math.max(0, Math.min(100, (enemyHp / enemyMaxHp) * 100));
  }, [enemyHp, enemyMaxHp]);

  const playerHpPercent = useMemo(() => {
    if (!attrs || attrs.hp <= 0) return 0;
    const effectiveMaxHp = Math.round(attrs.hp * domainEff.hpMul);
    return Math.max(0, Math.min(100, (playerHp / effectiveMaxHp) * 100));
  }, [attrs, playerHp, domainEff]);

  const soulPowerPercent = useMemo(() => {
    const max = attrs?.maxSoulPower ?? 0;
    if (max <= 0) return 0;
    return Math.max(0, Math.min(100, (currentSoulPower / max) * 100));
  }, [attrs?.maxSoulPower, currentSoulPower]);

  const playerDisplayHp = playerHp;

  // 🔴 战斗关键状态实时 ref —— 屏幕旋转/切后台/组件卸载时一律从 ref 读取最新值保存
  // 彻底避免 useEffect cleanup 闭包捕获旧值导致血量/魂力/回合数被重置（敌人血变100的根因）
  const enemyHpRef = useRef(enemyHp);
  const enemyMaxHpRef = useRef(enemyMaxHp);
  const playerHpRef = useRef(playerHp);
  const soulPowerRef = useRef(currentSoulPower);
  const phaseRef = useRef(phase);
  const logsRef = useRef(logs);
  const rewardsRef = useRef(rewards);
  const liehunRef = useRef<LiehunLedger | undefined>(battleState?.meta?.liehunGrowth);
  function recordDirectDamage(lost: number, attacker: string) {
    const next=recordLiehunHit(liehunRef.current,lost,attacker);if(!next)return;
    // 气血与伤害账本同步保存；魂灵扣血也必须保存，避免刷新后重复扣同一段气血。
    const hp=enemyHpRef.current;
    liehunRef.current=next;setBattleState(prev=>prev?.meta?.liehunGrowth?.id===next.id?{...prev,enemy:{...prev.enemy,hp},meta:{...prev.meta,liehunGrowth:next}}:prev);
  }
  function settleDirectGrowth() {
    const ledger=liehunRef.current;if(!ledger)return;
    settleLiehunVictory(ledger,'victory');
    if(!ledger.settled){liehunRef.current={...ledger,settled:true};setBattleState(prev=>prev?{...prev,meta:{...prev.meta,liehunGrowth:liehunRef.current}}:prev);}
  }
  useEffect(()=>{if(phase==='victory' && battleInitRef.current)settleDirectGrowth();},[phase,battleState?.meta?.liehunGrowth?.id]);
  useEffect(() => { enemyHpRef.current = enemyHp; }, [enemyHp]);
  useEffect(() => { enemyMaxHpRef.current = enemyMaxHp; }, [enemyMaxHp]);
  useEffect(() => { playerHpRef.current = playerHp; }, [playerHp]);
  useEffect(() => { soulPowerRef.current = currentSoulPower; }, [currentSoulPower]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { logsRef.current = logs; }, [logs]);
  useEffect(() => { rewardsRef.current = rewards; }, [rewards]);

  // 立即保存战斗状态到全局（强制绕开节流，从 ref 读取最新值）
  const flushBattleState = useCallback(() => {
    if (!battleState || !enemy) return;
    const curPhase = phaseRef.current;
    if (curPhase === 'victory' || curPhase === 'defeat' || curPhase === 'flee') return;
    try {
      setBattleState(prev=>prev&&prev.enemy?.id===battleState.enemy.id?{
        ...prev,
        meta:{...prev.meta,liehunGrowth:liehunRef.current,...(__fbRef.current?{fierceEffects:__fbRef.current}:{})},
        enemy: {
          ...battleState.enemy,
          hp: enemyHpRef.current,
          maxHp: enemyMaxHpRef.current,
        },
        phase: curPhase,
        logs: logsRef.current,
        rewards: rewardsRef.current,
        playerHp: playerHpRef.current,
        playerSoulPower: soulPowerRef.current,
        updatedAt: Date.now(),
      }:prev);
    } catch {
      /* 静默 */
    }
  }, [battleState, enemy, setBattleState]);

  // ============================================================
  // 初始化战斗状态（battleState 就绪后再跑，避免空状态下初始化导致血量变默认值）
  // ============================================================
  const battleInitRef = useRef(false);
  useEffect(() => {
    // 横屏再竖屏 remount 防御：只初始化一次，remount 时从 battleState 恢复
    // 关键：战斗状态已在全局 battleState 中持久化，组件卸载/重挂载不会丢失
    if (battleInitRef.current) return;
    const hasPropsBattle = !!props.battleType;
    if (!battleState && !hasPropsBattle) return; // 等 battleState 就绪
    if (!attrs) return; // 等属性就绪，避免血量为 0 或默认值
    battleInitRef.current = true;

      if (battleState && battleState.enemy && battleState.enemy.hp > 0 && battleState.enemy.maxHp > 0) {
        // 从全局战斗状态恢复（横屏竖屏切换、组件 remount 后血量不丢失）
        setEnemyHp(battleState.enemy.hp);
        setEnemyMaxHp(battleState.enemy.maxHp);
        // 玩家血量/魂力从 battleState 恢复，优先级高于 player.currentHp
        const savedHp = battleState.playerHp;
        const savedSp = battleState.playerSoulPower;
        setPlayerHp(savedHp != null && savedHp > 0 ? Math.min(savedHp, attrs.hp) : Math.min(player?.currentHp ?? attrs.hp, attrs.hp));
        setCurrentSoulPower(savedSp != null && savedSp >= 0 ? Math.min(savedSp, attrs.maxSoulPower) : attrs.maxSoulPower);
        // 兼容旧存档的 intro 阶段，直接覆盖为玩家回合
        const restoredPhase = battleState.phase === 'intro' ? 'playerTurn' : battleState.phase;
        setPhase(restoredPhase as BattlePhase);
        setLogs(battleState.logs.length > 0
          ? battleState.logs.map((l) => ({ ...l, type: l.type as LogEntry['type'] }))
          : [{ id: 0, text: `遭遇了 ${battleState.enemy.name}（${battleState.enemy.qualityLabel}魂兽）`, type: 'system' as const }]);
        if (battleState.rewards) setRewards(battleState.rewards as any);
         // 恢复魂灵阵容（从玩家数据重建）
         const activeIds = player?.activeSpiritIds ?? [];
         const spirits = player?.soulSpirits ?? [];
         const activeSpirits = activeIds
           .map((id) => spirits.find((s) => s.spiritId === id))
           .filter((s): s is NonNullable<typeof s> => !!s)
           .slice(0, 4)
           .map((s) => {
             const tpl = SOUL_SPIRIT_POOL.find((t) => t.id === s.spiritId);
             const stats = getSpiritStats(tpl ?? SOUL_SPIRIT_POOL[0], s.majorIndex, s.minor, s.evolutionStage);
             const maxHp = Math.max(50, Math.round((attrs?.hp ?? 100) * (0.25 + s.majorIndex * 0.03) * (1 + s.minor * 0.02)));
             const atk = Math.max(5, Math.round(stats.attack * 0.8));
             const def = Math.max(3, Math.round(stats.defense * 0.8));
             const spd = Math.max(5, Math.round(stats.speed * 0.8));
             return { id: s.spiritId, name: s.name, attribute: s.attribute, iconChar: s.iconChar, hp: maxHp, maxHp, attack: atk, defense: def, speed: spd, dead: false };
           });
         // 🔴 特殊魂灵（三茶转化等）：不占用普通魂灵上限
         const specialSpirits = player?.specialSoulSpirits ?? [];
         const specialActiveIds = player?.specialActiveSpiritIds ?? [];
         const specialBattleSpirits = specialSpirits
           .filter(s => specialActiveIds.includes(s.spiritId))
           .map(s => ({
             id: s.spiritId,
             name: s.name,
             attribute: s.attribute,
             iconChar: s.iconChar,
             hp: s.hp,
             maxHp: s.hp,
             attack: s.attack,
             defense: s.defense || 0,
             speed: s.speed || 0,
             dead: false,
             instantKillChance: s.instantKillChance || 0,
             isSpecial: true,
           }));
         setBattleSpirits(__fbRestoreSpirits([...activeSpirits,...specialBattleSpirits],battleState?.meta?.fierceEffects));
        battleEndedRef.current = false;
        // 🔴 恢复进行中战斗时，若处于敌方回合，需重新调度敌方行动定时器（防止remount后卡死）
        if (restoredPhase === 'enemyTurn') {
          actionLockRef.current = true;
          scheduleEnemyAction(800,false);
        } else {
          actionLockRef.current = false;
        }
    } else if (battleState && (battleState.phase === 'victory' || battleState.phase === 'defeat' || battleState.phase === 'flee')) {
      // 从全局恢复已结束的战斗：直接恢复到结算态，不要重置为新战斗
      battleEndedRef.current = true;
      setEnemyHp(battleState.enemy.hp);
      setEnemyMaxHp(battleState.enemy.maxHp);
      setPhase(battleState.phase as BattlePhase);
      setLogs(battleState.logs.length > 0
        ? battleState.logs.map((l) => ({ ...l, type: l.type as LogEntry['type'] }))
        : []);
      if (battleState.rewards) setRewards(battleState.rewards as any);
      // 如果是胜利态，根据战斗类型恢复到对应步骤
      if (battleState.phase === 'victory') {
        const bType = battleState.battleType ?? battleType;
        const noRingTypes = ['arena','shrek-exam','sea-god','mountain-dungeon','fierce-beast','demon','divine-avatar','divine-ditian','divine-beast','spirit-tower'];
        if (bType === 'spirit-tower') {
          setVictoryStep('spirit-select');
        } else if (battleState.rewards?.ring && !noRingTypes.includes(bType ?? '')) {
          setVictoryStep('ring-select');
        } else {
          setVictoryStep('summary');
        }
      }
    } else {
      // 全新战斗
      const safeHp = !enemy.hp || isNaN(enemy.hp) || enemy.hp <= 0 ? 1000 : enemy.hp;
      setEnemyHp(safeHp);
      setEnemyMaxHp(safeHp);
      // 全新战斗：玩家血量取当前血量（已由 attrs effect 设好），但这里兜底一次
      setPlayerHp(Math.min(player?.currentHp ?? attrs.hp, attrs.hp));
      setCurrentSoulPower(attrs.maxSoulPower);
      // 初始化完成后根据速度判定先手：敌人速度高于玩家则敌方先手
      const playerSpd = (attrs?.speed ?? 10)*armorDomainMultiplier(armorDomainRef.current,'speed');
      const enemySpd = enemy.speed ?? 10;
       if (enemySpd > playerSpd) {
         setPhase('enemyTurn');
         actionLockRef.current = true;
         // 敌方先手也走 scheduleEnemyAction 流程（魂灵先攻再敌方行动）
         scheduleEnemyAction(1000,false);
       } else {
        setPhase('playerTurn');
        actionLockRef.current = false;
      }
      battleEndedRef.current = false;
      // 根据敌人类型显示不同的遭遇文案
      const isDivineType = battleType === 'divine-avatar' || battleType === 'divine-ditian' || battleType === 'divine-beast';
      const meetText = isDivineType
        ? `${enemy.name} 出现在你面前！`
        : `遭遇了 ${enemy.name}（${enemy.qualityLabel}魂兽）`;
      setLogs([{ id: 0, text: meetText, type: 'system' as const }]);
      // 重置神技冷却和临时buff
      setDivineSkillCooldown(0);
      setTempBuffs(null);
       // 初始化魂灵战斗阵容
       const activeIds = player?.activeSpiritIds ?? [];
       const spirits = player?.soulSpirits ?? [];
       const activeSpirits = activeIds
         .map((id) => spirits.find((s) => s.spiritId === id))
         .filter((s): s is NonNullable<typeof s> => !!s)
         .slice(0, 4)
         .map((s) => {
           const tpl = SOUL_SPIRIT_POOL.find((t) => t.id === s.spiritId);
           const stats = getSpiritStats(tpl ?? SOUL_SPIRIT_POOL[0], s.majorIndex, s.minor, s.evolutionStage);
           // 魂灵血量约为玩家的 30-50%，随境界提升
           const maxHp = Math.max(50, Math.round((attrs?.hp ?? 100) * (0.25 + s.majorIndex * 0.03) * (1 + s.minor * 0.02)));
           const atk = Math.max(5, Math.round(stats.attack * 0.8));
           const def = Math.max(3, Math.round(stats.defense * 0.8));
           const spd = Math.max(5, Math.round(stats.speed * 0.8));
           return {
             id: s.spiritId,
             name: s.name,
             attribute: s.attribute,
             iconChar: s.iconChar,
             hp: maxHp,
             maxHp,
             attack: atk,
             defense: def,
             speed: spd,
             dead: false,
           };
         });
       // 🔴 特殊魂灵（三茶转化等）：不占用普通魂灵上限
       const specialSpirits = player?.specialSoulSpirits ?? [];
       const specialActiveIds = player?.specialActiveSpiritIds ?? [];
       const specialBattleSpirits = specialSpirits
         .filter(s => specialActiveIds.includes(s.spiritId))
         .map(s => ({
           id: s.spiritId,
           name: s.name,
           attribute: s.attribute,
           iconChar: s.iconChar,
           hp: s.hp,
           maxHp: s.hp,
           attack: s.attack,
           defense: s.defense || 0,
           speed: s.speed || 0,
           dead: false,
           instantKillChance: s.instantKillChance || 0,
           isSpecial: true,
         }));
       setBattleSpirits(__fbRestoreSpirits([...activeSpirits,...specialBattleSpirits],battleState?.meta?.fierceEffects));
     }
     setInBattle(true);
   }, [battleState, props.battleType, attrs, player, enemy, battleType, locationId, setInBattle]);

   // 清理仅在卸载时执行，避免初始化保存触发更新后取消恢复回合。
   useEffect(() => {
      return () => {
        // 🔴 组件卸载前强制同步保存战斗状态（从 ref 读取最新值，彻底绕开闭包陈旧）
        // 用于屏幕旋转、标签页切换等导致 BattlePage remount 的场景，确保血量不丢失
        flushBattleState();
        battleInitRef.current=false;
       // 清理所有定时器
       clearEnemyTimer();
       if (domainAnimTimerRef.current) {
         clearTimeout(domainAnimTimerRef.current);
         domainAnimTimerRef.current = null;
       }
       if (secondDomainAnimTimerRef.current) {
         clearTimeout(secondDomainAnimTimerRef.current);
         secondDomainAnimTimerRef.current = null;
       }
       if (spiritAttackTimerRef.current) {
         clearTimeout(spiritAttackTimerRef.current);
         spiritAttackTimerRef.current = null;
       }
       if (fleeEndTimerRef.current) {
         clearTimeout(fleeEndTimerRef.current);
         fleeEndTimerRef.current = null;
       }
       if (defeatHealTimerRef.current) {
         clearTimeout(defeatHealTimerRef.current);
         defeatHealTimerRef.current = null;
       }
       popupTimersRef.current.forEach((t) => clearTimeout(t));
       popupTimersRef.current = [];
     };
   }, []);

  // 🔴 切后台 / 屏幕旋转 / 窗口大小变化 时强制保存战斗状态（全部从 ref 读最新值）
  // 覆盖：切后台、切标签、最小化、横屏竖屏切换、浏览器缩放、开发者工具拖动 等所有可能重绘的场景
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushBattleState();
      }
    };
    // pagehide / beforeunload：页面关闭、刷新、跳转前最后兜底
    const handlePageHide = () => {
      flushBattleState();
    };
    // resize：横屏竖屏切换、窗口缩放、开发者工具拖动 都会触发 resize
    const handleResize = () => {
      flushBattleState();
    };
    // orientationchange：部分设备的方向变化事件（兼容旧设备）
    const handleOrientationChange = () => {
      flushBattleState();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [flushBattleState]);

  // ============================================================
  // 保存战斗状态到全局（节流：只在关键 state 变化时保存）
  // ============================================================
  const lastSaveRef = useRef(0);
  const savedSnapshotRef = useRef<{ phase: string; enemyHp: number; rewardsLen: number; logsLen: number; playerHp: number; soulPower: number } | null>(null);
  useEffect(() => {
    if (!enemy) return;
    // 胜利/失败/逃跑也需要把最终 phase 写入 battleState，保证 endBattle 时 lastBattleResult 正确
    if (phase === 'victory' || phase === 'defeat' || phase === 'flee') {
      if (battleState && battleState.phase !== phase) {
        setBattleState(prev=>prev&&prev.enemy.id===enemy.id?{...prev,phase}:prev);
      }
      return;
    }

    const now = Date.now();
    if (now - lastSaveRef.current < 100) return; // 节流从 300ms 降到 100ms，更及时保存

    // 内容未变化则跳过保存，避免自激更新（加入 playerHp 和 soulPower 对比，防止血量变化不存）
    const snapshot = { phase, enemyHp, rewardsLen: rewards.items.length + (rewards.ring ? 1 : 0), logsLen: logs.length, playerHp, soulPower: currentSoulPower };
    const prev = savedSnapshotRef.current;
    if (prev && prev.phase === snapshot.phase && prev.enemyHp === snapshot.enemyHp && prev.rewardsLen === snapshot.rewardsLen && prev.logsLen === snapshot.logsLen && prev.playerHp === snapshot.playerHp && prev.soulPower === snapshot.soulPower) {
      return;
    }
    savedSnapshotRef.current = snapshot;
    lastSaveRef.current = now;

     setBattleState(prev=>prev&&prev.enemy?.id===enemy.id?{
       battleType,
       locationId,
       enemy: {
         id: enemy.id,
         name: enemy.name,
         years: enemy.years,
         qualityColor: enemy.qualityColor,
         qualityLabel: enemy.qualityLabel,
         hp: enemyHp,
         maxHp: enemyMaxHp,
         attack: enemy.attack,
         defense: enemy.defense,
         speed: enemy.speed,
         spirit: enemy.spirit,
         skillName: enemy.skillName,
         skillDesc: enemy.skillDesc,
         element: (enemy as any).element,
         instantKillChance:(enemy as any).instantKillChance,
         specialSkillCooldown:(enemy as any).specialSkillCooldown,
         hasOnlySkill:(enemy as any).hasOnlySkill,
         isEncounter: enemy.isEncounter,
       },
       phase,
       logs,
       rewards,
       playerHp,
       playerSoulPower: currentSoulPower,
       updatedAt: now,
       exploreSource: battleState?.exploreSource,
       meta: {...prev?.meta,liehunGrowth:liehunRef.current,...(__fbRef.current?{fierceEffects:__fbRef.current}:{})},
     }:prev);
   }, [phase, enemyHp, enemyMaxHp, rewards, enemy, battleType, locationId, setBattleState, playerHp, currentSoulPower]);

  // （清理逻辑已合并到上方初始化 useEffect 的 cleanup 中，避免重复清理）

  // ============================================================
  // 监听玩家血量变化检测失败（与敌方血量胜利检测对称）
  // ============================================================
  useEffect(() => {
    if (playerHp <= 0 && !battleEndedRef.current && battleInitRef.current && phase !== 'victory' && phase !== 'defeat' && phase !== 'flee') {
      battleEndedRef.current = true;
      clearEnemyTimer();
      // 清理领域动画定时器，防止失败后领域异常亮起
      if (domainAnimTimerRef.current) {
        clearTimeout(domainAnimTimerRef.current);
        domainAnimTimerRef.current = null;
      }
      if (secondDomainAnimTimerRef.current) {
        clearTimeout(secondDomainAnimTimerRef.current);
        secondDomainAnimTimerRef.current = null;
      }
      setPhase('defeat');
      addLog('你被击败了...', 'system');
      // 竞技场失败：不扣星
      if (battleType === 'arena') {
        addArenaResult(false, 0);
      }
      // 神考·化身战斗失败：扣减次数
      if (battleType === 'divine-avatar') {
        const hasRemaining = recordDivineAvatarDefeat();
        // 当前值+1 = 本次失败后的次数；剩余 = 7 - (当前+1)
        const remaining = Math.max(0, 7 - ((player?.divineTrial.avatarAttempts ?? 0) + 1));
        addLog(`化身挑战失败，剩余 ${remaining} 次机会`, 'system');
        if (!hasRemaining) {
          addLog('7次机会已用尽，第二考失败...', 'system');
        }
      }
      // 🔴 茶城挑战失败：触发3分钟冷却（输赢都进入冷却）
      const isTeaChallenge = battleType === 'challenge' && (battleState?.meta as any)?.challengeType === 'tea-companion';
      if (isTeaChallenge) {
        const companionId = (battleState?.meta as any)?.companionId as string;
        if (companionId) {
          challengeCompanionLose(companionId);
          addLog('挑战失败，3分钟后可再次挑战。', 'system');
        }
      }
      // 失败后回满血
      defeatHealTimerRef.current = window.setTimeout(() => {
        if (attrs) {
          setCurrentHp(attrs.hp);
        }
        defeatHealTimerRef.current = null;
      }, getAnimDelay(500));
    }
  }, [playerHp, phase]);

  // ============================================================
  // 日志滚动
  // ============================================================
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    logIdRef.current += 1;
    setLogs((prev) => [...prev.slice(-30), { id: logIdRef.current, text, type }]);
  }, []);

  // ============================================================
  // 🔴 v17.1 侣系统：凶兽战斗胜利后检测青睐（统一入口）
  // 从胜利步骤进入 summary 时执行一次，确保无论是自动关闭还是手动返回都会触发
  // ============================================================
  const favorCheckedRef = useRef(false);
  useEffect(() => {
    logger.info('[battle] 胜利检测 effect 触发', { phase, victoryStep, battleType, alreadyChecked: favorCheckedRef.current });
    if (phase !== 'victory') return;
    if (victoryStep !== 'summary') return;
    if (favorCheckedRef.current) return;
    favorCheckedRef.current = true;
    if (battleType !== 'fierce-beast') {
      logger.info('[battle] 非凶兽战斗，跳过青睐检测', { battleType });
    } else {
      favorCheckedRef.current = true;
      const ALL_BEASTS = [...FIERCE_BEASTS_STAR_LAKE, ...FIERCE_BEASTS_FROZEN];
      const beastIdFromState = battleState?.enemy?.id || enemy?.id;
      const beast = ALL_BEASTS.find(b => b.id === beastIdFromState);
      logger.info('[battle] 凶兽胜利，检测青睐', { beastIdFromState, found: !!beast, beastName: beast?.name, hasHumanForm: !!beast?.humanForm, area: beast?.area });
      if (beast?.humanForm) {
        const area: 'star-lake' | 'frozen-domain' = beast.area;
        const result = checkAndStoreFavorTrigger(beast.id, area);
        logger.info('[battle] 青睐检测完成', { beastId: beast.id, result });
      } else {
        logger.info('[battle] 凶兽不可化形或不存在，跳过', { beastIdFromState });
      }
    }
    // 🔴 轮回之影：胜利后发放奖励
    if (battleType === 'challenge' && battleState?.locationId === 'reincarnation-shadow') {
      const meta = battleState?.meta as { expReward?: number; coinReward?: number; shadowOrb?: IReincarnationOrb } | undefined;
      const expReward = meta?.expReward ?? 0;
      const coinReward = meta?.coinReward ?? 0;
      if (expReward > 0 || coinReward > 0) {
        const res = claimShadowVictory(expReward, coinReward);
        logger.info('[battle] 轮回之影胜利奖励已发放', { expReward, coinReward, success: res.success });
      }
    }
  }, [phase, victoryStep, battleType, battleState?.enemy?.id, battleState?.locationId, battleState?.meta, enemy?.id, checkAndStoreFavorTrigger, claimShadowVictory]);
  useEffect(() => {
    let timer: number | undefined;
      if (phase === 'victory' && victoryStep === 'summary' && !rewards.ring && rewards.items.length === 0 && rewards.soulBones.length === 0) {
       // 结算展示阶段 2 秒后自动返回
       timer = window.setTimeout(() => {
         endBattle();
       }, 2000);
     } else if (phase === 'defeat') {
       timer = window.setTimeout(() => {
         endBattle();
       }, 2000);
     } else if (phase === 'flee') {
       timer = window.setTimeout(() => {
         endBattle();
       }, 1200);
     }
    return () => { if (timer) clearTimeout(timer); };
  }, [phase, victoryStep, rewards.ring, rewards.items.length, rewards.soulBones.length, endBattle, setBattleState, setInBattle]);

  // ============================================================
  // 伤害计算（魂技百分比制）
  // 魂技伤害 = 玩家主属性 × 魂技伤害百分比(skillDamagePct)
  // ============================================================
  // 伤害算法 v2.0 — 严格按修炼方向属性计算
  // 强攻系魂技：攻击力 + 攻击力 × 魂环百分比
  // 敏攻系魂技：速度 + 速度 × 魂环百分比
  // 辅助/控制系魂技：精神力 + 精神力 × 魂环百分比
  // 防御系魂技：防御力 + 防御力 × 魂环百分比
  // 普攻：攻击力（无其他加成）
  // 所有伤害均可暴击爆伤（防御系也可）
  // 属性只影响魂环共鸣，与伤害无关
  // ============================================================
   const calculateDamage = useCallback((
      attrValue: number,
      def: number,
      isSkill: boolean,
      critRate: number,
      critDmg: number,
      skillDmgPct?: number,
      trueBodyActive?: boolean,
      isSupport?: boolean,
      soul?: IMartialSoul | null,
      isArtifactSkill?: boolean,
      isEnemy?: boolean,
    ): { damage: number; isCrit: boolean } => {
    let base: number;
    if (isSkill && skillDmgPct && skillDmgPct > 0) {
      // 魂技伤害 = 属性值 + 属性值 × 魂技伤害百分比
      base = Math.max(1, attrValue + attrValue * skillDmgPct);
    } else if (isSkill) {
      // 兜底：旧魂技按 200% 计算
      base = Math.max(1, attrValue * 3.0);
    } else {
      // 普通攻击 = 攻击力
      base = Math.max(1, attrValue);
    }
    // 防御减伤：按百分比减伤公式，防御越高减伤越多，但永远不会到100%
    // 下界保护：def 最低取 -400，避免除零和负防御导致的减伤反常
    const shadow=battleState?.meta?.shadow;const adjustedDef=!isEnemy&&shadow?def*(1+(shadow.buffs?.defense?.value||0)):def;
    const safeDef = Math.max(-400,adjustedDef);
    const damageReduction = safeDef / (safeDef + 500);
    base = base * (1 - damageReduction);
    // 武魂真身：魂技伤害 +200%（总3倍）
    if (isSkill && trueBodyActive) {
      base *= 3.0;
    }
    // 神装-神器共鸣：神器神技伤害翻倍
    if (isSkill && isArtifactSkill && attrs?.armorResonanceActive) {
      base *= 2.0;
    }
    const variance = 0.9 + Math.random() * 0.2;
    base = base * variance;
    if(isSkill&&!isEnemy&&!isSupport)base*=armorDomainMultiplier(armorDomainRef.current,'skill');
    const isCrit = Math.random() < Math.min(1, critRate);
    // 暴击伤害统一语义：critDmg 是「额外爆伤」，总爆伤 = 1.5 + critDmg
    const totalCritDmg = 1.5 + critDmg;
    const incoming=isEnemy?armorDomainMultiplier(armorDomainRef.current,'incoming'):1;
    const finalDmg = isCrit ? Math.round(base * totalCritDmg*incoming) : Math.round(base*incoming);
     return { damage: Math.max(1, finalDmg), isCrit };
   }, [attrs?.armorResonanceActive,battleState?.meta?.shadow]);

  // 敌方调用 calculateDamage 的封装：跳过玩家武魂极致属性加成
  const calculateEnemyDamage = useCallback(
    (atk: number, def: number, isSkill: boolean, critRate: number, critDmg: number, skillDmgPct?: number): { damage: number; isCrit: boolean } => {
      return calculateDamage(atk, def, isSkill, critRate, critDmg, skillDmgPct, false, false, null, false, true);
    },
    [calculateDamage],
  );

  // ============================================================
  // 魂灵行动（依次攻击敌人，每只独立判定）
  // ============================================================
// Injected inside the BattlePage component; bindings are its existing state/ref setters.
function __fbGet() {
  if(battleType!=='fierce-beast'||!__FBProfiles[enemy.id]||!attrs||!battleInitRef.current)return null;
  if(!__fbRef.current||__fbRef.current.beastId!==enemy.id){
    const saved=battleState?.meta?.fierceEffects;
    // The mount effect has initialized React state, but the HP mirror effects
    // have not necessarily run yet. Use the authoritative battle snapshot.
    enemyHpRef.current=battleState?.enemy?.hp??enemy.hp;enemyMaxHpRef.current=battleState?.enemy?.maxHp??enemy.maxHp??enemy.hp;
    __fbRef.current=saved?.version===1&&saved.beastId===enemy.id?__fbClone(saved):__fbCreate(enemy.id,
      {...enemy,hp:enemyHpRef.current,maxHp:enemyMaxHpRef.current,mana:Math.max(600,enemy.spirit*10),maxMana:Math.max(600,enemy.spirit*10)},
      {...attrs,name:playerName,hp:playerHpRef.current,maxHp:Math.round(attrs.hp*domainEff.hpMul),mana:soulPowerRef.current,maxMana:attrs.maxSoulPower},battleSpiritsRef.current);
  }
  const s=__fbRef.current;s.actors.enemy.hp=enemyHpRef.current;s.actors.player.hp=playerHpRef.current;s.actors.player.mana=soulPowerRef.current;
  s.actors.player.maxHp=Math.max(1,Math.round(attrs.hp*domainEff.hpMul));
  for(const spirit of battleSpiritsRef.current){const key='spirit:'+spirit.id;if(!s.actors[key])s.actors[key]=__fbCreate('',spirit,spirit).actors.player;s.actors[key].hp=spirit.hp;}
  return s;
}
function __fbCommit(s,logs=[]) {
  __fbRef.current=s;
  
  enemyHpRef.current=s.actors.enemy.hp;playerHpRef.current=s.actors.player.hp;soulPowerRef.current=s.actors.player.mana;
  setEnemyHp(enemyHpRef.current);__fbRawPlayerHp(playerHpRef.current);__fbRawMana(soulPowerRef.current);
  const spirits=battleSpiritsRef.current.map(a=>{const saved=s.actors['spirit:'+a.id];return saved?{...a,hp:saved.hp,dead:saved.hp<=0}:a;});
  battleSpiritsRef.current=spirits;setBattleSpirits(spirits);
  for(const line of logs)addLog(line,line.includes('恢复')?'heal':'system');
}
function setPlayerHp(value) {
  const before=playerHpRef.current,next=typeof value==='function'?value(before):value;
  const s=typeof value==='function'&&next>before?__fbGet():null;
  if(s){const copy=__fbClone(s),logs=[];__fbHeal(copy,'player',next-before,logs);__fbCommit(copy,logs);return;}
  playerHpRef.current=next;__fbRawPlayerHp(next);
}
function setCurrentSoulPower(value) {const next=typeof value==='function'?value(soulPowerRef.current):value;soulPowerRef.current=next;__fbRawMana(next);}
function __fbHitEnemy(damage,attacker='player',instant=false) {
  const s=__fbGet();
  if(!s){const lost=Math.min(Math.max(0,enemyHpRef.current),Math.max(0,damage));enemyHpRef.current-=lost;setEnemyHp(enemyHpRef.current);recordDirectDamage(lost,attacker);return lost;}
  const adjusted=instant?damage:Math.round(damage*(Math.max(0,enemy.defense)+500)/(__fbDefense(s,'enemy',enemy.defense)+500));
  const hit=__fbDirect(s,'enemy',adjusted,{attacker,direct:true});
  __fbCommit(hit.next,hit.logs);
  if(hit.absorbed>0)addLog(`🛡️ ${enemy.name} 护盾吸收 ${hit.absorbed} 点伤害。`,'system');
  recordDirectDamage(hit.lost,attacker);
  return hit.lost;
}
function __fbSilenced() {
  const s=__fbRef.current||battleState?.meta?.fierceEffects;return !!s&&Object.values(s.actors.player.effects).some(e=>e.type==='silence');
}
function __fbSkillAllowed() {if(!__fbSilenced())return true;addLog('🔒 沉默中：不能释放魂技，仍可普通攻击。','system');return false;}
function __fbFinishPlayer() {
  const s=__fbGet();if(!s||!s.playerOpen)return;
  const copy=__fbClone(s);__fbFinish(copy,'player');copy.playerOpen=false;__fbCommit(copy);
}
function __fbEnterPlayer() {
  if(battleEndedRef.current||enemyHpRef.current<=0||playerHpRef.current<=0)return;
  const s=__fbGet();if(!s){setPhase('playerTurn');return;}
  if(s.playerOpen){setPhase('playerTurn');return;}
  const copy=__fbClone(s),logs=[],start=__fbBegin(copy,'player',logs);copy.playerOpen=true;copy.enemyActed=false;copy.spiritDone=false;
  __fbCommit(copy,logs);setSkillBanTurns(Object.values(copy.actors.player.effects).some(e=>e.type==='silence')?1:0);
  if(start.dead)return;
  if(start.skip){__fbFinishPlayer();actionLockRef.current=true;setPhase('enemyTurn');scheduleEnemyAction(0);return;}
  actionLockRef.current=false;setPhase('playerTurn');
}
function __fbSpiritTurn(spirit) {
  const s=__fbGet();if(!s)return false;
  const copy=__fbClone(s),logs=[],key='spirit:'+spirit.id,start=__fbBegin(copy,key,logs);
  // Spirits have one attack per player action; all their statuses count that action.
  __fbFinish(copy,key);__fbCommit(copy,logs);return start.skip;
}
function __fbEnemyTurn() {
  const s=__fbGet();if(!s)return false;
  if(battleEndedRef.current||s.actors.enemy.hp<=0||s.actors.player.hp<=0)return true;
  const spirits=battleSpiritsRef.current.filter(a=>!a.dead&&a.hp>0);
  const target=spirits.length?'spirit:'+spirits[Math.floor(Math.random()*spirits.length)].id:'player';
  let defense=target==='player'?Math.round(attrs.defense*domainEff.defMul*(1+(tempBuffs?.defense?.value||0))):s.actors[target].stats.defense;
  const result=__fbEnemyAction(s,{target,defense,directDamageMultiplier:target==='player'?armorDomainMultiplier(armorDomainRef.current,'incoming'):1});result.next.enemyActed=true;__fbCommit(result.next,result.logs);
  if(result.damage>0)showDamagePopup(`-${fmtDmg(result.damage)}`,result.isCrit,'player');
  if(result.next.actors[target].hp<=0&&target!=='player')addLog(`魂灵「${result.next.actors[target].name}」已阵亡。`,'system');
  return true;
}
async function __fbRunSpirits() {
  const s=__fbGet();if(s?.spiritDone)return 0;
  const damage=await spiritAttack();
  const next=__fbGet();if(next){const copy=__fbClone(next);copy.spiritDone=true;__fbCommit(copy);}
  return damage;
}
function __fbRestoreSpirits(spirits,saved) {
  return saved?.version===1?spirits.map(a=>{const x=saved.actors?.['spirit:'+a.id];return x?{...a,hp:Math.max(0,Math.min(a.maxHp,x.hp)),dead:x.hp<=0}:a;}):spirits;
}

  useEffect(()=>{if(battleType==='fierce-beast'&&phase==='playerTurn'&&battleInitRef.current&&!battleEndedRef.current)__fbEnterPlayer();},[phase]);
  const spiritAttack = useCallback((): Promise<number> => {
    return new Promise((resolve) => {
      const aliveSpirits = battleSpirits.filter((s) => !s.dead && s.hp > 0);
      if (aliveSpirits.length === 0) {
        resolve(0);
        return;
      }
      let totalDmg = 0;
      let idx = 0;
      const attackNext = () => {
        // 敌人已死，提前结束
        if (enemyHpRef.current <= 0) {
          resolve(totalDmg);
          return;
        }
        if (idx >= aliveSpirits.length) {
          resolve(totalDmg);
          return;
        }
        const spirit = aliveSpirits[idx];
         idx++;
         if(__fbSpiritTurn(spirit)){attackNext();return;}
         // 🔴 特殊魂灵秒杀判定
         if (spirit.instantKillChance && spirit.instantKillChance > 0 && Math.random() < spirit.instantKillChance) {
           const killDmg = enemyHpRef.current;
           totalDmg += killDmg;
           addLog(`🌟 魂灵「${spirit.name}」施展必杀技，直接斩杀敌方！`, 'skill');
           showDamagePopup(`-${fmtDmg(killDmg)}`, true, 'enemy');
           __fbHitEnemy(enemyHpRef.current,'spirit:'+spirit.id,true);
           resolve(totalDmg);
           return;
         }
         // 魂灵伤害 = 攻击 - 敌防*0.3，不暴击
         const baseDmg = Math.max(1, spirit.attack - enemy.defense * 0.3);
        const variance = 0.9 + Math.random() * 0.2;
        const dmg = __fbHitEnemy(Math.max(1,Math.round(baseDmg*variance)),'spirit:'+spirit.id);
        totalDmg += dmg;
        addLog(`魂灵「${spirit.name}」发动攻击，造成 ${formatNumber(dmg)} 点伤害！`, 'damage');
        showDamagePopup(`-${fmtDmg(dmg)}`, false, 'enemy');
        
        if (spiritAttackTimerRef.current) clearTimeout(spiritAttackTimerRef.current);
        spiritAttackTimerRef.current = window.setTimeout(attackNext,getAnimDelay(350));
      };
      attackNext();
    });
  }, [battleSpirits, enemy.defense, addLog]);

  // ============================================================
   // 敌人行动
   // ============================================================
   const enemyAction = useCallback(() => {
     if(battleEndedRef.current||enemyHpRef.current<=0||playerHpRef.current<=0)return;
     if (!attrs) {
       // 防御性兜底：属性为空时直接结束敌方回合，防止卡死
       actionLockRef.current = false;
       __fbEnterPlayer();
       return;
     }
     if(__fbEnemyTurn()){}else{
     // 🔴 v16.0 神界系统：god-realm 战斗中，若敌方有ban-skill神技且冷却就绪，优先释放
     const bossId = battleState?.meta?.bossId as string | undefined;
     const bossData = bossId ? GOD_REALM_BOSSES.find((b) => b.id === bossId) : undefined;
     if (battleType === 'god-realm' && bossData?.specialEffect?.type === 'ban-skill' && enemyBanCooldown === 0) {
       const banTurns = bossData.specialEffect.banSkillTurns;
       const cd = bossData.specialEffect.banSkillCooldown;
       addLog(`${enemy.name} 施展神技「${bossData.skillName}」，封禁你的魂技 ${banTurns} 回合！`, 'skill');
       setSkillBanTurns((prev) => Math.max(prev, banTurns));
       setEnemyBanCooldown(cd);
       // 神技释放后直接结束本回合（不再普攻/魂技）
       if (enemyTurnTimerRef.current) {
         clearTimeout(enemyTurnTimerRef.current);
         enemyTurnTimerRef.current = null;
       }
       enemyTurnTimerRef.current = window.setTimeout(() => {
         if (battleEndedRef.current) return;
         // 玩家回合前递减冷却/封禁/buff等
         setTrueBodyCooldown((c) => Math.max(0, c - 1));
         setSecondTrueBodyCooldown((c) => Math.max(0, c - 1));
         setTrueBodyTurns((t) => {
           const next = Math.max(0, t - 1);
           if (t === 1) { setTrueBodyCooldown(4); addLog('第一武魂真身自然消散，进入4回合冷却。', 'system'); }
           return next;
         });
         setSecondTrueBodyTurns((t) => {
           const next = Math.max(0, t - 1);
           if (t === 1) { setSecondTrueBodyCooldown(4); addLog('第二武魂真身自然消散，进入4回合冷却。', 'system'); }
           return next;
         });
         setTempBuffs((b) => {
           if (!b) return null;
           const next = {
             attack: { value: b.attack.value, turns: Math.max(0, b.attack.turns - 1) },
             defense: { value: b.defense.value, turns: Math.max(0, b.defense.turns - 1) },
             speed: { value: b.speed.value, turns: Math.max(0, b.speed.turns - 1) },
             spirit: { value: b.spirit.value, turns: Math.max(0, b.spirit.turns - 1) },
           };
           if (next.attack.turns <= 0 && next.defense.turns <= 0 && next.speed.turns <= 0 && next.spirit.turns <= 0) return null;
           return next;
         });
         setDivineSkillCooldown((c) => Math.max(0, c - 1));
         setSkillBanTurns((t) => Math.max(0, t - 1));
         setEnemyBanCooldown((c) => Math.max(0, c - 1));
         setEnemySpecialCd((c) => Math.max(0, c - 1));
         actionLockRef.current = false;
         __fbEnterPlayer();
       }, getAnimDelay(800));
       return;
     }
     let shadowPlan:any=null;
     if(battleState?.meta?.shadow){shadowPlan=__localShadowAction(battleState.meta.shadow);setBattleState(prev=>prev&&prev.enemy.id===enemy.id?{...prev,meta:{...prev.meta,shadow:shadowPlan.next}}:prev);if(shadowPlan.nonDamage){if(shadowPlan.heal>0)setEnemyHp(hp=>Math.min(enemyMaxHpRef.current,hp+shadowPlan.heal));addLog(enemy.name+' 释放「'+shadowPlan.skillName+'」。','skill');}}
     // 特殊角色（如阴阳茶）只有技能攻击，无普攻；普通敌人 30% 概率使用技能
    const hasOnlySkill = !!(enemy as any).hasOnlySkill;
    const useSkill = shadowPlan?shadowPlan.isSkill:hasOnlySkill?true:Math.random()<0.3;
     // 🔴 特殊技能：概率秒杀（阴阳茶等），在使用技能时额外判定
     const instantKillChance = (enemy as any).instantKillChance ?? 0;
     const specialSkillCd = (enemy as any).specialSkillCooldown ?? 0;
     const triggerInstantKill = useSkill && instantKillChance > 0 && enemySpecialCd === 0 && Math.random() < instantKillChance;
     if (triggerInstantKill) {
       // 秒杀：无视血量、防御、魂灵，直接击杀玩家
       addLog(`${enemy.name} 施展无上神技「${(shadowPlan?.skillName??enemy.skillName)}」——阴阳寂灭，万法皆空！`, 'skill');
       addLog(`一道黑白交织的剑光洞穿了你的神魂，你被直接斩杀！`, 'damage');
       showDamagePopup('秒杀', true, 'player');
       setPlayerHp(0);
       setEnemySpecialCd(specialSkillCd || 3);
        actionLockRef.current = false;
        // 直接进入失败判定（由血量监听 effect 接管）
        return;
     }
     // 敌人暴击率：按年限大致 5%~15%
    const enemyCritRate = shadowPlan?.critRate??Math.min(0.15,0.05+(enemy.attack||0)/5000);
     const enemyCritDmg = shadowPlan?.critExtra??0; // 敌方只有基础150%爆伤，无额外
    // 领域防御加成（玩家受到攻击时，防御 = 基础防御 × 领域防御倍率）
    // 临时增益：防御buff也参与减伤（玩家释放防御增幅魂技后应能降低受到的伤害）
    let playerDef = Math.round(attrs.defense * domainEff.defMul);
    if (tempBuffs?.defense?.value && tempBuffs.defense.value > 0) {
      playerDef = Math.round(playerDef * (1 + tempBuffs.defense.value));
    }
    const result = useSkill
      ? calculateEnemyDamage(shadowPlan?.attr??enemy.attack,playerDef,true,enemyCritRate,enemyCritDmg,shadowPlan?.pct)
      : calculateEnemyDamage(shadowPlan?.attr??enemy.attack,playerDef,false,enemyCritRate,enemyCritDmg);
    const dmg = shadowPlan?.nonDamage?0:result.damage;
    const critText = result.isCrit ? '【暴击】' : '';
    if(!shadowPlan?.nonDamage){
    // 魂灵优先受击机制：只要有存活魂灵，敌人100%攻击魂灵；全部阵亡后才攻击玩家
    const aliveSpirits = battleSpiritsRef.current.filter((s) => !s.dead && s.hp > 0);
    if (aliveSpirits.length > 0) {
      // 随机选一只存活魂灵挨打
      const target = aliveSpirits[Math.floor(Math.random() * aliveSpirits.length)];
      const spiritDef = target.defense;
       // 魂灵承伤：按双方防御加权，魂灵防御越高承伤越少（约为玩家受到伤害的40-70%）
       const actualDmg = Math.max(1, Math.round(dmg * 0.6 * (playerDef / (spiritDef + playerDef))));
      if (useSkill) {
        addLog(`${enemy.name} 使用「${(shadowPlan?.skillName??enemy.skillName)}」命中魂灵「${target.name}」，${critText}造成 ${formatNumber(actualDmg)} 点伤害！`, 'skill');
      } else {
        addLog(`${enemy.name} 攻击魂灵「${target.name}」，${critText}造成 ${formatNumber(actualDmg)} 点伤害！`, 'damage');
      }
      showDamagePopup(`-${fmtDmg(actualDmg)}`, result.isCrit, 'player');
      setBattleSpirits((prev) => prev.map((s) => {
        if (s.id !== target.id) return s;
        const newHp = Math.max(0, s.hp - actualDmg);
        if (newHp <= 0) {
          addLog(`魂灵「${s.name}」已阵亡，本场战斗不再出手。`, 'system');
          return { ...s, hp: 0, dead: true };
        }
        return { ...s, hp: newHp };
      }));
    } else {
      // 所有魂灵阵亡后才攻击玩家
      if (useSkill) {
        addLog(`${enemy.name} 使用「${(shadowPlan?.skillName??enemy.skillName)}」，${critText}造成 ${formatNumber(dmg)} 点伤害！`, 'skill');
      } else {
        addLog(`${enemy.name} 发动攻击，${critText}造成 ${formatNumber(dmg)} 点伤害！`, 'damage');
      }
       showDamagePopup(`-${fmtDmg(dmg)}`, result.isCrit, 'player');
       // 扣血（击杀由 useEffect 统一检测）
       setPlayerHp((hp) => Math.max(0, hp - dmg));
       // 🔴 魂导核心绿宝石：受到攻击后回复 hpRegenPct 最大血量（累加每个魂导器上的绿宝石 +5%）
       const hpRegenPct = attrs.coreGemBonus?.hpRegenPct ?? 0;
       if (hpRegenPct > 0) {
         const maxHp = attrs.hp;
         const regen = Math.round(maxHp * hpRegenPct);
         if (regen > 0) {
           setPlayerHp((hp) => Math.min(maxHp, hp + regen));
           addLog(`💚 魂导核心·绿宝石生效，回复 ${formatNumber(regen)} 点气血！`, 'heal');
         }
       }
    }


    }

     }
    // 600ms 后切回玩家回合（如果玩家还活着且战斗未结束）
    // 若玩家被击杀，由玩家血量监听 effect 接管走失败流程
    // 先清理外层调度定时器引用，再赋内层的，避免 clearEnemyTimer 失效
    if (enemyTurnTimerRef.current) {
      clearTimeout(enemyTurnTimerRef.current);
      enemyTurnTimerRef.current = null;
    }
    enemyTurnTimerRef.current = window.setTimeout(() => {
      if (battleEndedRef.current) return;
       // 玩家回合开始前：衰减武魂真身回合数 + 增益buff + 冷却（统一函数式，避免多次setter导致重复log）
        // 武魂真身回合与冷却统一在一个批次内更新
        // 用 ref 记录本回合是否已触发自然消散，防止 React 批处理或 StrictMode 双调用导致重复 log
        let firstFaded = false;
        let secondFaded = false;
        setTrueBodyTurns((prevT) => {
          if (prevT === 1) firstFaded = true;
          return Math.max(0, prevT - 1);
        });
        setSecondTrueBodyTurns((prevT) => {
          if (prevT === 1) secondFaded = true;
          return Math.max(0, prevT - 1);
        });
        if (firstFaded) {
          setTrueBodyCooldown(4);
          addLog('第一武魂真身自然消散，进入4回合冷却。', 'system');
        } else {
          setTrueBodyCooldown((prev) => Math.max(0, prev - 1));
        }
        if (secondFaded) {
          setSecondTrueBodyCooldown(4);
          addLog('第二武魂真身自然消散，进入4回合冷却。', 'system');
        } else {
          setSecondTrueBodyCooldown((prev) => Math.max(0, prev - 1));
        }
        setTempBuffs((b) => {
          if (!b) return null;
          // 每个属性独立衰减回合计数，归零则该属性buff消失
          const next = {
            attack: { value: b.attack.value, turns: Math.max(0, b.attack.turns - 1) },
            defense: { value: b.defense.value, turns: Math.max(0, b.defense.turns - 1) },
            speed: { value: b.speed.value, turns: Math.max(0, b.speed.turns - 1) },
            spirit: { value: b.spirit.value, turns: Math.max(0, b.spirit.turns - 1) },
          };
          // 全部归零时清除整个buff对象
          if (next.attack.turns <= 0 && next.defense.turns <= 0 && next.speed.turns <= 0 && next.spirit.turns <= 0) return null;
          return next;
        });
        // 神技冷却-1
        setDivineSkillCooldown((c) => Math.max(0, c - 1));
        // 🔴 v16.0 神界系统：每回合递减魂技封禁回合和敌方神技冷却
        setSkillBanTurns((t) => Math.max(0, t - 1));
        setEnemyBanCooldown((c) => Math.max(0, c - 1));
        setEnemySpecialCd((c) => Math.max(0, c - 1));
      // 每回合不自动回复魂力（需通过道具/特殊技能恢复）
      actionLockRef.current = false;
      __fbEnterPlayer();
    }, getAnimDelay(600));
   }, [enemy, attrs, calculateDamage, addLog, domainEff, tempBuffs, battleType, battleState, enemyBanCooldown]);

  // ============================================================
  // 普通攻击
  // ============================================================
  const handleAttack = useCallback(() => {
    if (phase !== 'playerTurn') return;
    if (actionLockRef.current) return;
    if (!attrs) return;
    actionLockRef.current = true;
    try {
    // 先清理可能存在的旧定时器
    if (enemyTurnTimerRef.current) {
      clearTimeout(enemyTurnTimerRef.current);
      enemyTurnTimerRef.current = null;
    }
    // 普攻固定使用攻击力，与修炼方向无关
    let baseAtk = Math.round(attrs.attack * domainEff.atkMul);
    // 临时增益：攻击 buff
    if (tempBuffs?.attack?.value) baseAtk = Math.round(baseAtk * (1 + tempBuffs.attack.value));
    let atk = baseAtk;
    // 神器加成（拔出神器后普攻改为神器攻击，吃神器等级加成）
     // 至高神器0.9%/级 / 超神器0.85%/级 / 神器0.8%/级（品质越高加成越高）
     if (artifactInfo) {
       const perLevel = artifactInfo.artifact.tier === 'supreme' ? 0.009 : artifactInfo.artifact.tier === 'super' ? 0.0085 : 0.008;
       const artifactBonus = 1 + (artifactInfo.level - 1) * perLevel;
      atk = Math.round(atk * artifactBonus);
    }
     const critRate = attrs.critRate + domainEff.critAdd;
     const critDmg = attrs.critDmg + domainEff.critDmgAdd;
     // 🔴 魂导核心蓝宝石：普攻伤害加成（累加每个魂导器上的蓝宝石 +10%）
     const basicGemBonus = attrs.coreGemBonus?.basicDmgPct ?? 0;
     let atkWithGem = atk;
     if (basicGemBonus > 0) {
       atkWithGem = Math.round(atk * (1 + basicGemBonus));
     }
     const result = calculateDamage(atkWithGem, enemy.defense, false, critRate, critDmg);
    const dmg = __fbHitEnemy(result.damage);
    
    lastHitSoulIndexRef.current = 0; // 普攻默认主修武魂
    showDamagePopup(`-${fmtDmg(dmg)}`, result.isCrit, 'enemy');
    const attackName = artifactInfo ? artifactInfo.artifact.name : '普通攻击';
    addLog(
      `${playerName} 发动${attackName}，${result.isCrit ? '【暴击】' : ''}造成 ${formatNumber(dmg)} 点伤害！`,
      'damage',
    );

    // 调度敌方回合（先清旧定时器，防止连击导致多个敌方回合并行）
    scheduleEnemyAction(500);
    } catch (err) {
      logger.error('[battle] handleAttack error:', String(err));
      addLog('普攻出现异常，战斗继续。', 'system');
      actionLockRef.current = false;
    }
   }, [phase, attrs.attack, attrs.critRate, attrs.critDmg, attrs.coreGemBonus?.basicDmgPct, enemy.defense, player.name, calculateDamage, addLog, enemyAction, tempBuffs, domainEff, artifactInfo]);

  // ============================================================
  // 神技释放（需拔出神器）
  // ============================================================
  const DIVINE_SKILL_COST = 300;
  const DIVINE_SKILL_COOLDOWN = 3;

  const handleDivineSkill = useCallback(() => {
    if (phase !== 'playerTurn') return;
    if(!__fbSkillAllowed())return;
    if (actionLockRef.current) return;
    if (!hasDivineSkill || !artifactInfo) return;
    if (divineSkillCooldown > 0) return;
    if (currentSoulPower < DIVINE_SKILL_COST) {
      toast.info(`魂力不足，神技需要 ${DIVINE_SKILL_COST} 点魂力`);
      return;
    }
    actionLockRef.current = true;
    try {
    // 先清理可能存在的旧定时器
    if (enemyTurnTimerRef.current) {
      clearTimeout(enemyTurnTimerRef.current);
      enemyTurnTimerRef.current = null;
    }
    // 扣除魂力
    setCurrentSoulPower((p) => Math.max(0, p - DIVINE_SKILL_COST));
    // 设置冷却
    setDivineSkillCooldown(DIVINE_SKILL_COOLDOWN);

    // 神技伤害：神技倍率作为技能伤害百分比计算伤害
    // （注意：神器等级加成已在 calcAttributes 的 attrs.attack 中包含，此处不再重复乘，避免双重计算）
    // 至高神5倍/神王3.5倍/一级神3倍/二级神2.5倍
    // 🔴 修复：神技按修炼方向取主属性（强攻→攻击、敏攻→速度、控制/辅助→精神、防御→防御）
    const cultAttr = playerMartialSoul?.cultivationAttr || 'strength';
    let mainAttr = attrs.attack;
    if (cultAttr === 'agility') mainAttr = attrs.speed;
    else if (cultAttr === 'spirit' || cultAttr === 'support') mainAttr = attrs.spirit;
    else if (cultAttr === 'defense') mainAttr = attrs.defense;
    // 领域主属性倍率
    let domainAttrMul = domainEff.atkMul;
    if (cultAttr === 'agility') domainAttrMul = domainEff.spdMul;
    else if (cultAttr === 'spirit' || cultAttr === 'support') domainAttrMul = domainEff.spiMul;
    else if (cultAttr === 'defense') domainAttrMul = domainEff.defMul;
    let atk = Math.round(mainAttr * domainAttrMul);
    // 临时 buff 加成（对应属性）
    if (tempBuffs?.attack?.value && cultAttr === 'strength') atk = Math.round(atk * (1 + tempBuffs.attack.value));
    else if (tempBuffs?.speed?.value && cultAttr === 'agility') atk = Math.round(atk * (1 + tempBuffs.speed.value));
    else if (tempBuffs?.spirit?.value && (cultAttr === 'spirit' || cultAttr === 'support')) atk = Math.round(atk * (1 + tempBuffs.spirit.value));
    else if (tempBuffs?.defense?.value && cultAttr === 'defense') atk = Math.round(atk * (1 + tempBuffs.defense.value));
    const tierMul = artifactInfo.trial.tier === 'supreme' ? 5 : artifactInfo.trial.tier === 'king' ? 3.5 : artifactInfo.trial.tier === 'first' ? 3 : 2.5;
     // 🔴 修复：神技享受领域魂技伤害加成（跟普通魂技一致） + 魂导核心红宝石加成
     const skillGemBonus = attrs.coreGemBonus?.skillDmgPct ?? 0;
     const divineMultiplier = tierMul * (1 + domainEff.skillDmgAdd + skillGemBonus);

    const critRate = attrs.critRate + domainEff.critAdd + 0.1; // 神技额外+10%暴击
    const critDmg = attrs.critDmg + domainEff.critDmgAdd + 0.5; // 神技额外+50%暴伤
    // 神技用 isSkill=true 走 skillDmgPct 逻辑，同时 isArtifactSkill=true 触发神装共鸣翻倍
    // divineMultiplier 作为 skillDmgPct 传入（5/3.5/3/2.5 倍率），叠加 base=atk*pct+atk 公式
    // 🔴 修复：神技享受武魂真身加成（任意武魂真身激活即可，跟普通魂技一致）
    const result = calculateDamage(atk, enemy.defense, true, critRate, critDmg, divineMultiplier, anyTrueBody, false, playerMartialSoul, true, false);
    const dmg = __fbHitEnemy(result.damage);
    
    lastHitSoulIndexRef.current = 0;
    showDamagePopup(`-${fmtDmg(dmg)}`, result.isCrit, 'enemy');
    addLog(
      `🌟 ${artifactInfo.artifact.name} 释放神技【${artifactInfo.trial.divineSkillName}】，${result.isCrit ? '【神击暴击】' : ''}造成 ${formatNumber(dmg)} 点伤害！`,
      'skill',
    );

    // 调度敌方回合
    scheduleEnemyAction(700);
    } catch (err) {
      logger.error('[battle] handleDivineSkill error:', String(err));
      addLog('神技释放出现异常，战斗继续。', 'system');
      actionLockRef.current = false;
    }
  }, [phase, hasDivineSkill, artifactInfo, divineSkillCooldown, currentSoulPower, attrs.attack, attrs.speed, attrs.spirit, attrs.defense, attrs.critRate, attrs.critDmg, enemy.defense, calculateDamage, addLog, tempBuffs, domainEff, formatNumber, anyTrueBody, playerMartialSoul]);

  // ============================================================
  // 魂技释放（新版：数值化伤害 + 武魂真身 + 辅助系治疗/增益）
  // soulIndex: 0=主修武魂, 1=次修武魂
  // ============================================================
  const handleSkill = useCallback((ringIndex: number, soulIndex: 0 | 1 = 0) => {
    if (phase !== 'playerTurn') return;
    if(!__fbSkillAllowed())return;
    if (actionLockRef.current) return;
    if (!attrs) return;
    const rings = soulIndex === 1 ? secondSoulRings : playerSoulRings;
    const ring = rings[ringIndex];
    if (!ring) return;

    const soul = soulIndex === 1 ? playerSecondSoul : playerMartialSoul;
    const soulName = soul?.name || (soulIndex === 0 ? '主修' : '次修');
    const isPrimary = soulIndex === 0;
    const skillType = ring.skillType || 'attack';
    const isTrueBody = ringIndex === 6; // 两个武魂的第七魂技都是武魂真身
    // 🔴 修复：魂技名去前缀，避免日志里「第X魂技『第X魂技·XXX』」重复
    const pureSkillName = ring.skillName?.replace(/^第\d+魂技·/, '') || ring.skillName;

    // 第七魂技走下方专用开关按钮，这里直接返回（不设置lock，直接返回即可）
    if (isTrueBody) {
      addLog('第七魂技为武魂真身，请通过下方武魂真身按钮开启/关闭。', 'system');
      return;
    }

    // 魂力消耗：第N魂技 = N×60；任一武魂真身激活时×4；领域开启时×2（双领域叠加则×4）
    let cost = (ringIndex + 1) * 60;
    if (anyTrueBody) cost = Math.round(cost * 4);
    if (domainActive) cost = Math.round(cost * 2);
    if (secondDomainActive) cost = Math.round(cost * 2);
    if (currentSoulPower < cost) {
      addLog('魂力不足，无法释放魂技！', 'system');
      return;
    }

     actionLockRef.current = true;
     try {
     setCurrentSoulPower((sp) => Math.max(0, sp - cost));

     // 先清理可能存在的旧定时器
    if (enemyTurnTimerRef.current) {
      clearTimeout(enemyTurnTimerRef.current);
      enemyTurnTimerRef.current = null;
    }

    if (skillType === 'heal') {
      // 治疗型魂技：治疗量 = 主属性 × 魂技伤害百分比 × 0.5（辅助系减半）
      const main = getEffectiveMainAttrForSoul(soul);
      const pct = ring.skillDamagePct && ring.skillDamagePct > 0 ? ring.skillDamagePct : 1.5;
      const baseHeal = Math.max(10, main * pct * 0.5);
      const trueBodyMul = anyTrueBody ? 3 : 1;
      const heal = Math.round(baseHeal * trueBodyMul);
      // 用函数式更新避免 stale closure（治疗后敌方回合基于最新血量）
      const maxHp = Math.round(attrs.hp * domainEff.hpMul);
      setPlayerHp((hp) => Math.min(maxHp, hp + heal));
      showDamagePopup(`+${fmtDmg(heal)}`, false, 'player');
      addLog(
        `${playerName} 释放第 ${RING_ORDER[ringIndex]} 魂技「${pureSkillName}」，恢复 ${formatNumber(heal)} 点气血！`,
        'skill',
      );
    } else if (skillType === 'buff') {
      // 增益型魂技：提升对应属性3回合，不同属性可叠加
      const attr = ring.buffAttr || 'attack';
      const pct = ring.skillDamagePct && ring.skillDamagePct > 0 ? ring.skillDamagePct : 1.5;
      const buffPct = 0.12 + pct * 0.08; // 基础12% + 百分比×8%（伤害150%的魂技约+24%buff）
      const trueBodyMul = anyTrueBody ? 1.5 : 1;
      const value = buffPct * trueBodyMul;
       const turnCount = 3;
       setTempBuffs((prev) => {
         // 同属性新buff取较大值，但回合数独立（新buff从满3回合开始）
         return {
           attack: {
             value: Math.max(prev?.attack.value ?? 0, attr === 'attack' ? value : 0),
             turns: attr === 'attack' ? Math.max(prev?.attack.turns ?? 0, turnCount) : (prev?.attack.turns ?? 0),
           },
           defense: {
             value: Math.max(prev?.defense.value ?? 0, attr === 'defense' ? value : 0),
             turns: attr === 'defense' ? Math.max(prev?.defense.turns ?? 0, turnCount) : (prev?.defense.turns ?? 0),
           },
           speed: {
             value: Math.max(prev?.speed.value ?? 0, attr === 'speed' ? value : 0),
             turns: attr === 'speed' ? Math.max(prev?.speed.turns ?? 0, turnCount) : (prev?.speed.turns ?? 0),
           },
           spirit: {
             value: Math.max(prev?.spirit.value ?? 0, attr === 'spirit' ? value : 0),
             turns: attr === 'spirit' ? Math.max(prev?.spirit.turns ?? 0, turnCount) : (prev?.spirit.turns ?? 0),
           },
         };
       });
      const attrName = attr === 'attack' ? '攻击' : attr === 'defense' ? '防御' : attr === 'speed' ? '速度' : '精神';
      addLog(
        `${playerName} 释放第 ${RING_ORDER[ringIndex]} 魂技「${pureSkillName}」，${attrName}提升 ${Math.round(value * 100)}%，持续 ${turnCount} 回合！`,
        'skill',
      );
    } else if (skillType === 'allBuff') {
       // 全属性增益：攻击/防御/速度/精神 同时提升
       // 九宝神光（九宝玲珑塔第8魂技）：强力全属性增幅，持续5回合，无冷却
       // 普通全属性增幅：基础3回合
       const pct = ring.skillDamagePct && ring.skillDamagePct > 0 ? ring.skillDamagePct : 1.5;
       const isJiubaoShenguang = pureSkillName === '九宝神光';
       const basePct = isJiubaoShenguang ? 0.20 : 0.10;
       const pctMul = isJiubaoShenguang ? 0.10 : 0.06;
       const buffPct = basePct + pct * pctMul;
       const trueBodyMul = anyTrueBody ? 1.5 : 1;
       const value = buffPct * trueBodyMul;
       const turnCount = isJiubaoShenguang ? 5 : 3;
        setTempBuffs((prev) => ({
          attack: { value: Math.max(prev?.attack.value ?? 0, value), turns: Math.max(prev?.attack.turns ?? 0, turnCount) },
          defense: { value: Math.max(prev?.defense.value ?? 0, value), turns: Math.max(prev?.defense.turns ?? 0, turnCount) },
          speed: { value: Math.max(prev?.speed.value ?? 0, value), turns: Math.max(prev?.speed.turns ?? 0, turnCount) },
          spirit: { value: Math.max(prev?.spirit.value ?? 0, value), turns: Math.max(prev?.spirit.turns ?? 0, turnCount) },
       }));
      addLog(
        `${playerName} 释放第 ${RING_ORDER[ringIndex]} 魂技「${pureSkillName}」，全属性提升 ${Math.round(value * 100)}%，持续 ${turnCount} 回合！`,
        'skill',
      );
    } else {
      // 攻击型魂技：伤害 = 对应属性 + 对应属性 × 魂技伤害百分比
      // 强攻→攻击、敏攻→速度、控制/辅助→精神、防御→防御、混沌/全属性→取最高属性
      const attrVal = getEffectiveMainAttrForSoul(soul);
      const cultAttr = soul?.cultivationAttr || 'strength';
      // 临时 buff 加成（仅加成对应属性）
      let finalAttrVal = attrVal;
      if (cultAttr === 'strength' && tempBuffs?.attack?.value) finalAttrVal = Math.round(finalAttrVal * (1 + tempBuffs.attack.value));
      else if (cultAttr === 'agility' && tempBuffs?.speed?.value) finalAttrVal = Math.round(finalAttrVal * (1 + tempBuffs.speed.value));
      else if ((cultAttr === 'spirit' || cultAttr === 'support') && tempBuffs?.spirit?.value) finalAttrVal = Math.round(finalAttrVal * (1 + tempBuffs.spirit.value));
      else if (cultAttr === 'defense' && tempBuffs?.defense?.value) finalAttrVal = Math.round(finalAttrVal * (1 + tempBuffs.defense.value));
      const critRate = attrs.critRate + domainEff.critAdd;
      const critDmg = attrs.critDmg + domainEff.critDmgAdd;
       // 魂技伤害百分比（乘以领域加成 + 魂导核心红宝石加成）
       const basePct = ring.skillDamagePct && ring.skillDamagePct > 0 ? ring.skillDamagePct : 1.5;
       const skillGemBonus = attrs.coreGemBonus?.skillDmgPct ?? 0;
       const adjustedPct = basePct * (1 + domainEff.skillDmgAdd + skillGemBonus);
       const trueBodyActive = soulIndex === 0 ? (trueBodyTurns > 0) : (secondTrueBodyTurns > 0);
       const baseResult = calculateDamage(finalAttrVal, enemy.defense, true, critRate, critDmg, adjustedPct, trueBodyActive, false, soul);
      const dmg = __fbHitEnemy(baseResult.damage);
      
      showDamagePopup(`-${fmtDmg(dmg)}`, baseResult.isCrit, 'enemy');
      lastHitSoulIndexRef.current = soulIndex;
      addLog(
        `${playerName} 释放第 ${RING_ORDER[ringIndex]} 魂技「${pureSkillName}」，${baseResult.isCrit ? '【暴击】' : ''}造成 ${formatNumber(dmg)} 点伤害！`,
        'skill',
      );
    }

    // 调度敌方回合（先清旧定时器）
     scheduleEnemyAction(600);
     } catch (err) {
       logger.error('[battle] handleSkill error:', String(err));
       addLog('魂技释放出现异常，战斗继续。', 'system');
       actionLockRef.current = false;
     }
     }, [phase, playerSoulRings, secondSoulRings, attrs, effectiveMainAttr, playerQuality, playerMartialSoul, playerSecondSoul, playerName, enemy.defense, currentSoulPower, anyTrueBody, tempBuffs, playerHp, calculateDamage, addLog, enemyAction, domainEff, domainActive, secondDomainActive, getEffectiveMainAttrForSoul, attrs.coreGemBonus?.skillDmgPct]);

  // ============================================================
  // 武魂真身手开关（第七魂环解锁后显示）
  // soulIndex: 0=主修武魂, 1=次修武魂
  // 规则：开关不算回合操作；两个武魂真身互斥（开启一个自动取消另一个）；各有独立冷却
  // ============================================================
  const handleToggleTrueBody = useCallback((soulIndex: 0 | 1 = 0) => {
    if(!__fbSkillAllowed())return;
    if (phase !== 'playerTurn') return;
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    try {
    const rings = soulIndex === 1 ? secondSoulRings : playerSoulRings;
    if (rings.length < 7) return;

    const turnsState = soulIndex === 0 ? trueBodyTurns : secondTrueBodyTurns;
    const cooldownState = soulIndex === 0 ? trueBodyCooldown : secondTrueBodyCooldown;
    const setTurns = soulIndex === 0 ? setTrueBodyTurns : setSecondTrueBodyTurns;
    const setCooldown = soulIndex === 0 ? setTrueBodyCooldown : setSecondTrueBodyCooldown;
    const otherSetTurns = soulIndex === 0 ? setSecondTrueBodyTurns : setTrueBodyTurns;
    const otherSetCooldown = soulIndex === 0 ? setSecondTrueBodyCooldown : setTrueBodyCooldown;
    const otherTurns = soulIndex === 0 ? secondTrueBodyTurns : trueBodyTurns;
    const soul = soulIndex === 0 ? playerMartialSoul : playerSecondSoul;
    const soulLabel = soulIndex === 0 ? '第一武魂' : '第二武魂';
    const quality = soulIndex === 0 ? playerQuality : (playerSecondSoul?.quality ?? 'common');

    if (turnsState > 0) {
      // 主动关闭：立即结束，开始4回合冷却
      setTurns(0);
      setCooldown(4);
      addLog(`${playerName} 主动收束${soulLabel}真身，进入4回合冷却。`, 'system');
    } else {
      // 冷却中禁止开启
      if (cooldownState > 0) {
        addLog(`${soulLabel}真身冷却中（剩余${cooldownState}回合）！`, 'system');
        return;
      }
      // 开启武魂真身：基础150点魂力（领域×2=300，双领域×4=600）
      const cost = getTrueBodyCost();
      if (currentSoulPower < cost) {
        addLog('魂力不足，无法开启武魂真身！', 'system');
        return;
      }
      setCurrentSoulPower((sp) => Math.max(0, sp - cost));
       let turns = 3;
       if (quality === 'superDivine') turns = 7;
       else if (quality === 'divine') turns = 6;
       else if (quality === 'legendary') turns = 5;
       else if (quality === 'epic') turns = 4;
       else turns = 3;
      // 互斥：如果另一个武魂真身激活中，先关闭它并进入冷却
      if (otherTurns > 0) {
        otherSetTurns(0);
        otherSetCooldown(4);
        addLog(`切换至${soulLabel}真身，另一武魂真身自动收束。`, 'system');
      }
      setTurns(turns);
      addLog(
        `🌟 ${playerName} 释放「${soulLabel}真身」！${soul?.name || ''}之力全面爆发，持续 ${turns} 回合！（魂技消耗×4）`,
        'skill',
      );
     }
    } finally {
      actionLockRef.current = false;
    }
  }, [phase, playerSoulRings.length, secondSoulRings.length, trueBodyTurns, trueBodyCooldown, secondTrueBodyTurns, secondTrueBodyCooldown, currentSoulPower, playerQuality, playerMartialSoul, playerSecondSoul, playerName, addLog, domainActive]);

  // ============================================================
  // 领域开关（无冷却，可随时开关，不算回合操作；开启后魂力消耗×2）
  // ============================================================
  const handleToggleDomain = useCallback(() => {
    if(!__fbSkillAllowed())return;
    if (phase !== 'playerTurn') return;
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    try {
      if (!hasDomain) return;
    if(!domainActive&&armorDomainRef.current.turns){toast.info('斗铠领域正在生效，不能同时展开其他领域');return;}

    if (domainActive) {
      // 关闭领域：先清动画定时器，立即关闭，同时截断血量到新上限
      if (domainAnimTimerRef.current) {
        clearTimeout(domainAnimTimerRef.current);
        domainAnimTimerRef.current = null;
      }
      setDomainAnimating(false);
      setDomainActive(false);
      // 截断血量到新上限，避免领域关闭后血量溢出
      const baseMaxHp = attrs?.hp ?? 0;
      setPlayerHp((hp) => Math.min(hp, baseMaxHp));
      addLog('领域已关闭，魂力消耗恢复正常。', 'system');
      toast.info('领域已关闭');
     } else {
       // 开启领域：消耗100点魂力，播放动画，属性加成生效
       const cost = 100;
       if (currentSoulPower < cost) {
         addLog('魂力不足，无法开启领域！', 'system');
         actionLockRef.current = false;
         return;
       }
        setCurrentSoulPower((sp) => Math.max(0, sp - cost));
        // 开启动画
        if (domainAnimTimerRef.current) clearTimeout(domainAnimTimerRef.current);
        setDomainAnimating(true);
        domainAnimTimerRef.current = window.setTimeout(() => {
          setDomainActive(true);
          setDomainAnimating(false);
          addLog(`🌟 ${playerName} 展开「${player?.domain?.name || '领域'}」！领域之力灌注全身！（魂技消耗×2）`, 'skill');
        }, 1300);
     }
    } finally {
      actionLockRef.current = false;
    }
    }, [phase, hasDomain, domainActive, currentSoulPower, playerName, player?.domain?.name, addLog]);

  // 第二领域开关
  const handleToggleSecondDomain = useCallback(() => {
    if(!__fbSkillAllowed())return;
    if (phase !== 'playerTurn') return;
    if (actionLockRef.current) return;
    if (!hasSecondDomain) return;
    if(!secondDomainActive&&armorDomainRef.current.turns){toast.info('斗铠领域正在生效，不能同时展开其他领域');return;}
    actionLockRef.current = true;
    try {
      if (secondDomainActive) {
        setSecondDomainAnimating(false);
        setSecondDomainActive(false);
        // 关闭第二领域后，血量截断到新上限
        // 若第一领域仍开着，单独计算第一领域的血量加成；若第一领域也关了，上限为基础值
        const baseMaxHp = attrs?.hp ?? 0;
        let newMaxHp = baseMaxHp;
        if (domainActive && player?.domain) {
          const firstBonus = calcDomainBonus(player.domain, player.level);
          if (firstBonus) {
            let hpMul = 1;
            if (firstBonus.allAttr) hpMul *= 1 + firstBonus.allAttr;
            if (firstBonus.hp) hpMul *= 1 + firstBonus.hp;
            newMaxHp = Math.round(baseMaxHp * hpMul);
          }
        }
        setPlayerHp((hp) => Math.min(hp, newMaxHp > 0 ? newMaxHp : baseMaxHp));
        addLog('第二领域已关闭。', 'system');
        toast.info('第二领域已关闭');
      } else {
        // 开启第二领域：消耗100点魂力
        const cost = 100;
        if (currentSoulPower < cost) {
          addLog('魂力不足，无法开启第二领域！', 'system');
          actionLockRef.current = false;
          return;
        }
        setCurrentSoulPower((sp) => Math.max(0, sp - cost));
        if (secondDomainAnimTimerRef.current) clearTimeout(secondDomainAnimTimerRef.current);
        setSecondDomainAnimating(true);
        secondDomainAnimTimerRef.current = window.setTimeout(() => {
          setSecondDomainActive(true);
          setSecondDomainAnimating(false);
          const doubleInfo = domainActive ? '（双领域叠加，魂技消耗×4）' : '（魂技消耗×2）';
          addLog(
            `🌟 ${playerName} 展开第二领域「${player?.secondDomain?.name || '领域'}」！${doubleInfo}`,
            'skill',
          );
        }, 1300);
      }
    } finally {
      actionLockRef.current = false;
    }
  }, [phase, hasSecondDomain, secondDomainActive, domainActive, currentSoulPower, playerName, player?.secondDomain?.name, addLog]);

  // ============================================================
  // 逃跑
  // ============================================================
  const handleFlee = useCallback(() => {
    if (phase !== 'playerTurn') return;
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    try {
    // 清理已有定时器
    clearEnemyTimer();
    // 🔴 修复：逃跑概率受速度差影响，高速敏攻系更容易逃跑
    const playerSpd = attrs?.speed ?? 10;
    const enemySpd = enemy.speed ?? 10;
    const speedRatio = playerSpd / Math.max(1, enemySpd);
    const fleeChance = Math.min(0.85, Math.max(0.2, 0.4 + (speedRatio - 1) * 0.2));
    const success = Math.random() < fleeChance;
    if (success) {
        addLog('逃跑成功！', 'system');
      setPhase('flee');
      battleEndedRef.current = true;
      actionLockRef.current = false;
      // 注意：phase === 'flee' 的自动 endBattle 由统一的结算 effect 管理（1200ms）
    } else {
      addLog('逃跑失败！', 'system');
      // 逃跑失败仍消耗回合：由敌方行动结束后回到玩家回合时释放 actionLock
      scheduleEnemyAction(0);
    }
    } catch (err) {
      logger.error('[battle] handleFlee error:', String(err));
      actionLockRef.current = false;
    }
   }, [phase, addLog, setBattleState, setInBattle, enemyAction]);

  // ============================================================
  // 🔴 v22.0 自动战斗系统
  // ============================================================

  // 自动战斗决策：根据修炼方向选择最优动作
  const executeAutoAction = useCallback(() => {
    if (phase !== 'playerTurn') return;
    if (actionLockRef.current) return;
    if (battleEndedRef.current) return;

    if(__fbSilenced()){handleAttack();return;}
    const direction = player?.direction || '强攻系';
    const sp = currentSoulPower;
    const divineCost = DIVINE_SKILL_COST;
    const tbCost = getTrueBodyCost();

    // 1. 优先开启领域（如果有领域且魂力足够且未开启）
    if (hasDomain && !domainActive && !armorDomainRef.current.turns && sp >= 100) {
      handleToggleDomain();
      return;
    }
    // 双领域也开
    if (hasSecondDomain && !secondDomainActive && !armorDomainRef.current.turns && sp >= 200) {
      handleToggleSecondDomain();
      return;
    }

    // 2. 武魂真身（魂力足够且7环以上且冷却完成）
    if (playerSoulRings.length >= 7 && trueBodyTurns === 0 && trueBodyCooldown === 0 && sp >= tbCost) {
      handleToggleTrueBody(0);
      return;
    }
    // 第二武魂真身
    if (isTwinSoul && secondSoulRings.length >= 7 && secondTrueBodyTurns === 0 && secondTrueBodyCooldown === 0 && sp >= tbCost * 1.5) {
      handleToggleTrueBody(1);
      return;
    }

    // 3. 神技（拔出神器+已继承神位+冷却完成+魂力足够）
    const dt = player?.divineTrial;
    const hasArt = !!(dt?.artifactDrawn && dt?.chosenTrialId);
    const hasInherited = !!(dt?.inherited);
    const getSkillCostFn = (i: number): number => {
      let cost = (i + 1) * 60;
      if (anyTrueBody) cost = Math.round(cost * 4);
      if (domainActive) cost = Math.round(cost * 2);
      if (secondDomainActive) cost = Math.round(cost * 2);
      return cost;
    };
    if (hasArt && hasInherited && divineSkillCooldown === 0 && sp >= divineCost && playerSoulRings.length >= 10) {
      handleDivineSkill();
      return;
    }

    // 4. 选择最优魂技（按修炼方向策略）
    // 收集所有可用魂技：有魂力+未被封禁
    const rings = activeSoulSkillTab === 0 ? playerSoulRings : secondSoulRings;
    const availableSkills: { index: number; ring: typeof rings[0]; soulIndex: 0 | 1 }[] = [];

    if (skillBanTurns === 0) {
      rings.forEach((ring, i) => {
        if (!ring) return;
        const cost = getSkillCostFn(i);
        if (sp >= cost) {
          availableSkills.push({ index: i, ring, soulIndex: activeSoulSkillTab as 0 | 1 });
        }
      });
    }

    if (availableSkills.length > 0) {
      // 不同修炼方向有不同策略
      let chosen = availableSkills[availableSkills.length - 1]; // 默认选最高环

      if (direction === '强攻系') {
        // 强攻系：优先选伤害最高的（高环）
        chosen = availableSkills[availableSkills.length - 1];
      } else if (direction === '敏攻系') {
        // 敏攻系：优先速度型技能（高环伤害优先）
        chosen = availableSkills[availableSkills.length - 1];
      } else if (direction === '辅助系') {
        // 辅助系：优先增幅/治疗类技能（判断技能类型）
        // 简化策略：低环比高环更偏辅助，从低到高选第一个有回复/增益的
        // 找不到就用普攻
        const lowIndex = availableSkills[0];
        // 血量低于60%时优先恢复，否则选低环增益
        if (playerHp < (attrs?.hp ?? 100) * 0.6) {
          // 找带恢复字样的技能
          const healSkill = availableSkills.find(s => s.ring.skillDesc?.includes('恢复') || s.ring.skillDesc?.includes('治疗') || s.ring.skillDesc?.includes('回血'));
          chosen = healSkill || lowIndex;
        } else {
          chosen = lowIndex;
        }
      } else if (direction === '控制系') {
        // 控制系：优先控制类技能（低环），然后高环伤害
        const ctrlSkill = availableSkills.find(s => s.ring.skillDesc?.includes('眩晕') || s.ring.skillDesc?.includes('控制') || s.ring.skillDesc?.includes('冻结') || s.ring.skillDesc?.includes('束缚'));
        chosen = ctrlSkill || availableSkills[availableSkills.length - 1];
      } else if (direction === '防御系') {
        // 防御系：优先防御技能（低环），再攻击
        const defSkill = availableSkills.find(s => s.ring.skillDesc?.includes('防御') || s.ring.skillDesc?.includes('护盾') || s.ring.skillDesc?.includes('减伤'));
        chosen = defSkill || availableSkills[0];
      }

      handleSkill(chosen.index, chosen.soulIndex);
      return;
    }

    // 5. 魂力不足，普通攻击
    handleAttack();
  }, [
    phase, player?.direction, currentSoulPower, hasDomain, domainActive, hasSecondDomain, secondDomainActive,
    playerSoulRings.length, trueBodyTurns, trueBodyCooldown, secondSoulRings.length, secondTrueBodyTurns, secondTrueBodyCooldown,
    isTwinSoul, divineSkillCooldown, skillBanTurns, playerHp, attrs?.hp,
    activeSoulSkillTab, getTrueBodyCost, anyTrueBody, domainActive, secondDomainActive, player?.divineTrial,
    handleToggleDomain, handleToggleSecondDomain, handleToggleTrueBody, handleDivineSkill, handleSkill, handleAttack,
  ]);

  // 自动战斗定时器：玩家回合时自动触发动作
  useEffect(() => {
    if (autoBattle && phase === 'playerTurn' && !battleEndedRef.current) {
      const delay = Math.max(100, 800 / battleSpeed);
      autoBattleTimerRef.current = window.setTimeout(() => {
        executeAutoAction();
      }, getAnimDelay(delay));
    }
    return () => {
      if (autoBattleTimerRef.current) {
        clearTimeout(autoBattleTimerRef.current);
        autoBattleTimerRef.current = null;
      }
    };
  }, [autoBattle, phase, battleSpeed, executeAutoAction]);

  // 加速所有动画定时器（敌人行动、回合切换等）的钩子
  // 原理：通过修改 setTimeout 的延迟来实现加速效果
  const getAnimDelay = useCallback((baseMs: number) => {
    return Math.max(50, Math.floor(baseMs / battleSpeed));
  }, [battleSpeed]);

  // ============================================================
  // 胜利处理
  // ============================================================
   const handleVictory = () => {
     // 🔴 关键：只允许胜利判定一次，防止重复触发弹窗/重复掉落
     if (battleEndedRef.current) return;
     battleEndedRef.current = true;
     settleDirectGrowth();
     // 清理所有可能还在调度的敌方回合定时器，防止回流
      clearEnemyTimer();
      // 清理魂灵攻击定时器，防止胜利后继续出手
      if (spiritAttackTimerRef.current) {
        clearTimeout(spiritAttackTimerRef.current);
        spiritAttackTimerRef.current = null;
      }
      // 清理领域动画定时器，防止胜利后领域异常亮起
      if (domainAnimTimerRef.current) {
        clearTimeout(domainAnimTimerRef.current);
        domainAnimTimerRef.current = null;
      }
      if (secondDomainAnimTimerRef.current) {
        clearTimeout(secondDomainAnimTimerRef.current);
        secondDomainAnimTimerRef.current = null;
      }
       if((battleState?.meta as any)?.ascension){const trial=(battleState.meta as any).ascension;setPlayer(p=>dragonAction(p,{type:'win',id:trial.id}).player);addLog('升灵台试炼成功，灵力 +'+trial.reward,'system');setRewards({items:[],soulBones:[],ring:null,exp:0,coins:0});setVictoryStep('summary');setPhase('victory');return;}
       if(battleState?.meta?.shadow){setRewards({items:[],soulBones:[],ring:null,exp:battleState.meta.expReward||0,coins:battleState.meta.coinReward||0});setVictoryStep('summary');setPhase('victory');return;}
       const isArenaOrExam = battleType === 'arena' || battleType === 'shrek-exam';
        const isSeaGod = battleType === 'sea-god';
        const isFierceBeast = (battleType as string) === 'fierce-beast';
        const isMountainDungeon = (battleType as string) === 'mountain-dungeon';
        const isDivineAvatar = battleType === 'divine-avatar';
        const isDivineDiTian = battleType === 'divine-ditian';
        const isDivineBeast = battleType === 'divine-beast';
        const isSpiritTower = battleType === 'spirit-tower';
         const isGodRealm = battleType === 'god-realm';
         const isMountainExplore = !!battleState?.exploreSource && (battleState.exploreSource as any).areaName === 'sun-mountains';
         const isTeaChallenge = battleType === 'challenge' && (battleState?.meta as any)?.challengeType === 'tea-companion';
        // 不掉魂环/魂骨的战斗直接进入 summary，避免 ring-select 阶段无弹窗卡死
          const isNoRingBoneBattle = isArenaOrExam || isSeaGod || isMountainDungeon || isFierceBeast || isDivineAvatar || isDivineDiTian || isDivineBeast || isMountainExplore || isSpiritTower || isGodRealm || isTeaChallenge;
          setPhase('victory');
          // 🔴 修复：无魂环/魂骨战斗必须立即切到 summary，否则 victoryStep 仍为 ring-select
          // 而 rewards.ring 为空导致 ring-select 弹窗不显示，结算界面也不显示，玩家只能点左上角返回
          if (isNoRingBoneBattle) {
            setVictoryStep('summary');
          }
        addLog(`击败了 ${enemy.name}！`, 'system');

        // 🔴 茶城挑战：伴侣挑战获胜，增加好感度 + 3分钟冷却
        if (isTeaChallenge) {
          const companionId = (battleState?.meta as any)?.companionId as string;
          if (companionId) {
            const r = challengeCompanionWin(companionId);
            if (r.success) {
              if (r.titleReward) {
                // 🔴 特殊存在·称号奖励（如冰红茶→全游戏通关）
                addLog(`🏆 你以无上之力击败了${enemy.name}！`, 'system');
                addLog(`🌟 获得永久称号：【${r.titleReward}】！`, 'system');
                if (r.isFirstTime) {
                  addLog(`💫 称号已永久铭刻，转世也不会消失`, 'system');
                } else {
                  addLog(`💫 称号已拥有，继续挑战证明你的实力！`, 'system');
                }
                setRewards(prev => ({ ...prev, exp: (prev?.exp || 0) + 999999, coins: (prev?.coins || 0) + 999999 }));
              } else if (r.oneTimeVictory) {
                // 一次性挑战角色胜利（如混沌茶）：获得专属神器，角色永久消失
                addLog(`⚔ 你以无上之力击败了${enemy.name}！`, 'system');
                if (r.artifactItemName) {
                  addLog(`🌟 获得唯一创世神器：${r.artifactItemName}！`, 'system');
                  addLog(`💫 ${r.artifactItemName}已收入背包，五维属性各 +30亿（被动生效）`, 'system');
                }
                addLog(`🌙 ${enemy.name}从此从世间消失，唯留传说...`, 'system');
                setRewards(prev => ({ ...prev, exp: (prev?.exp || 0) + 100000, coins: (prev?.coins || 0) + 100000 }));
              } else if (r.favorGain) {
                addLog(`🌟 你以剑道折服了${enemy.name}，好感度 +${r.favorGain}！`, 'system');
                setRewards(prev => ({ ...prev, exp: (prev?.exp || 0) + 500, coins: (prev?.coins || 0) + 1000 }));
              }
            } else if (!r.success) {
              addLog(r.reason || '挑战结算异常', 'system');
            }
          }
         }

         // 🔴 吞噬茶武魂专属：茶城角色击败后的特殊机制
         if (isTeaChallenge && (player?.martialSoul.name === '混沌无极' || (player?.isTwinSoul && player?.secondSoul?.name === '混沌无极'))) {
           const companionId = (battleState?.meta as any)?.companionId as string;
           if (companionId) {
             // 三茶（阴阳茶 / 梦小茶 / 甜小茶）：记录击败次数，第二次击败时弹出转化魂灵
             const threeTeaMap: Record<string, { name: string; attribute: string; hp: number; attack: number; defense: number; speed: number; spirit: number; skillName: string; skillDesc: string; instantKillChance: number; iconChar: string; }> = {
               'tc-yinyangcha': {
                 name: '阴阳茶魂灵', attribute: '光暗双生',
                 hp: 2000000000000000, attack: 66600000000, defense: 0, speed: 0, spirit: 0,
                 skillName: '鸿蒙两仪', skillDesc: '35%概率直接斩杀敌方', instantKillChance: 0.35,
                 iconChar: '阴阳',
               },
               'tc-mengxiaocha': {
                 name: '梦小茶魂灵', attribute: '梦幻',
                 hp: 2000000000000000, attack: 66600000000, defense: 0, speed: 0, spirit: 0,
                 skillName: '永念梦境', skillDesc: '45%概率直接斩杀敌方', instantKillChance: 0.45,
                 iconChar: '梦',
               },
               'tc-tianxiaocha': {
                 name: '甜小茶魂灵', attribute: '甜蜜',
                 hp: 2000000000000000, attack: 66600000000, defense: 0, speed: 0, spirit: 0,
                 skillName: '寰宇之枪', skillDesc: '45%概率直接斩杀敌方', instantKillChance: 0.45,
                 iconChar: '甜',
               },
             };
             if (threeTeaMap[companionId]) {
               const prev = getTeaDefeatCount(companionId);
               const next = recordTeaDefeat(companionId);
               if (next === 2) {
                 const info = threeTeaMap[companionId];
                 setConvertSpiritDialog({
                   open: true,
                   spiritId: `sp-${companionId}`,
                   name: info.name,
                   sourceId: companionId,
                   attribute: info.attribute,
                   hp: info.hp,
                   attack: info.attack,
                   defense: info.defense,
                   speed: info.speed,
                   spirit: info.spirit,
                   skillName: info.skillName,
                   skillDesc: info.skillDesc,
                   instantKillChance: info.instantKillChance,
                   iconChar: info.iconChar,
                   done: false,
                 });
               }
               // 防止未使用变量警告
               void prev;
             }
             // 混沌茶：击败后，如已掉落混沌神剑且玩家有混沌无极武魂，则弹出强配选项
             if (companionId === 'tc-hunduncha') {
               // 延迟到 summary 展示后再弹，让玩家先看到奖励
               setTimeout(() => {
                 setHundunForceDialog({ open: true, phase: 'confirm' });
               }, getAnimDelay(800));
             }
           }
         }

        // 神考·第二考 化身战斗胜利
        if (isDivineAvatar) {
          confirmDivineAvatarVictory();
          addLog('🌟 击败自身化身！第二考完成，可领取奖励。', 'system');
          const eGain = 50000;
          const cGain = 10000;
          addExp(eGain);
          addCoins(cGain);
          setRewards({
            exp: eGain,
            coins: cGain,
            items: [],
            ring: null,
            ringSoulIndex: 0,
            soulBones: [],
            beastName: enemy.name,
            beastYears: enemy.years,
            beastQuality: enemy.qualityColor,
          });
          return;
        }

        // 神考·第一考 帝天战斗胜利
        if (isDivineDiTian) {
          confirmDiTianVictory();
          addLog('🌟 击败兽神帝天！第一考条件达成。', 'system');
          const eGain = 200000;
          const cGain = 50000;
          addExp(eGain);
          addCoins(cGain);
          setRewards({
            exp: eGain,
            coins: cGain,
            items: [],
            ring: null,
            ringSoulIndex: 0,
            soulBones: [],
            beastName: enemy.name,
            beastYears: enemy.years,
            beastQuality: enemy.qualityColor,
          });
          return;
        }

        // 神考·第三考 猎魂试炼 战斗胜利
        if (isDivineBeast) {
          confirmDivineBeastVictory();
          addLog(`🌟 击败 ${enemy.name}！第三考条件达成。`, 'system');
          const eGain = 300000;
          const cGain = 80000;
          addExp(eGain);
          addCoins(cGain);
          setRewards({
            exp: eGain,
            coins: cGain,
            items: [],
            ring: null,
            ringSoulIndex: 0,
            soulBones: [],
            beastName: enemy.name,
            beastYears: enemy.years,
            beastQuality: enemy.qualityColor,
          });
          return;
        }

        // 🔴 v16.0 神界系统：神界挑战胜利
        if (isGodRealm) {
          const bId = battleState?.meta?.bossId as string | undefined;
          if (bId) {
            confirmGodRealmVictory(bId);
            const boss = GOD_REALM_BOSSES.find((b) => b.id === bId);
            addLog(`🏆 击败了 ${enemy.name}！获得【${boss?.rewardDesc || '神界奖励'}】！`, 'system');
            const eGain = 999999;
            const cGain = 999999;
            addExp(eGain);
            addCoins(cGain);
            setRewards({
              exp: eGain,
              coins: cGain,
              items: boss?.rewardItems ?? [],
              ring: null,
              ringSoulIndex: 0,
              soulBones: [],
              beastName: enemy.name,
              beastYears: enemy.years,
              beastQuality: enemy.qualityColor,
            });
          }
          return;
        }

       // 按魂兽年限计算经验和金币奖励（山脉副本用副本预设金币）
      let expGain = 0;
      let coinGain = 0;

      // 凶兽战斗：固定经验10万~20万（约为核心区普通魂兽的2倍），魂币按年限合理缩放，掉落灵草/仙草
      if (isFierceBeast) {
        const y = enemy.years;
        // 经验：10万~20万 随机（凶兽比普通核心区魂兽强，但远不至于几千万）
        expGain = Math.round((100000 + Math.random() * 100000) * 1.5);
        coinGain = Math.round(250000 + Math.random() * 250000);
        if (expGain > 0) addExp(expGain);
        if (coinGain > 0) addCoins(coinGain);

        const beastDrops = (battleState?.meta as any)?.drops ?? [];
        const lootItems = rollFierceBeastDrops(beastDrops);
        if (lootItems.length === 0) {
          addLog('可惜，这次什么都没获得...', 'info');
        } else {
          for (const it of lootItems) {
            addItem(it);
            addLog(`🍃 获得：${it.name} × ${it.quantity ?? 1}`, 'skill');
          }
        }
        // 直接返回，不走魂环/魂骨掉落
        setRewards({
          exp: expGain,
          coins: coinGain,
          items: lootItems,
          ring: null,
          ringSoulIndex: 0,
          soulBones: [],
          beastName: enemy.name,
          beastYears: enemy.years,
          beastQuality: enemy.qualityColor,
        });
        // 🔴 修复：凶兽战斗无魂环无魂灵，直接进入summary阶段，避免卡在ring-select软锁
        setVictoryStep('summary');
        return;
      }

      // 按魂兽年限计算经验和金币奖励（山脉副本用副本预设金币）

      // 海神阁战斗：给大量经验+金币，标记击败
      if (isSeaGod) {
        const memberId = (battleState?.meta as any)?.memberId;
        if (memberId) {
          const seaGodResult = confirmSeaGodVictory(memberId);
          if (seaGodResult.success) {
            // 经验和金币已在 confirmSeaGodVictory 内部通过 addExp/addCoins 添加
            expGain = seaGodResult.expGained;
            coinGain = seaGodResult.coinGained;
          }
        }
      } else if (isMountainDungeon) {
       // 山脉副本：经验按年限给，金币用副本预设值
       const y = enemy.years;
       let baseExp = y < 1000 ? 200 : y < 10000 ? 600 : y < 100000 ? 1500 : 3000;
       expGain = Math.round(baseExp * (0.9 + Math.random() * 0.2) * 1.5);
       coinGain = (battleState?.meta as BattleMeta)?.coinReward ?? 50;
     } else if (!isArenaOrExam) {
       const y = enemy.years;
       let baseExp = 0;
       let baseCoin = 0;
       let factor = 0;
       if (y < 100) {
         // 十年魂兽：经验50，金币2000
         baseExp = 50;
         baseCoin = 2000;
         factor = y / 100;
       } else if (y < 1000) {
         // 百年魂兽：经验200，金币10000
         baseExp = 200;
         baseCoin = 10000;
         factor = y / 1000;
       } else if (y < 10000) {
         // 千年魂兽：经验800，金币50000
         baseExp = 800;
         baseCoin = 50000;
         factor = y / 10000;
       } else if (y < 100000) {
         // 万年魂兽：经验3000，金币200000
         baseExp = 3000;
         baseCoin = 200000;
         factor = y / 100000;
       } else {
         // 十万年魂兽：经验10000，金币800000
         baseExp = 10000;
         baseCoin = 800000;
         factor = Math.min(1, (y - 100000) / 500000);
       }
      // 在基础值的 100%~120% 区间内浮动
      const randomFactor = 1 + factor * 0.2;
      expGain = Math.round(baseExp * randomFactor * 1.5);
      coinGain = Math.round(baseCoin * randomFactor);

      // 核心区 / 生命之湖（六节点探索 & 直接猎魂）：击败魂兽固定获得 5万~8万 经验
      // locationId 可能为 'core'/'life-lake'（直接猎魂）、'forest-3'/'forest-4'（旧版id）、
      //                     'star-core'/'star-life-lake'（星斗六节点探索）、
      //                     'beiji-core'（极北·极寒冰域）、'mountain-6'~'mountain-9'（日月山脉高阶段）
      // exploreSource.tier 可能为 'core'/'life-lake' 或上述区域id
      const exploreTier = battleState?.exploreSource?.tier || '';
      const coreKeywords = ['core', 'life-lake', 'forest-3', 'forest-4', 'star-core', 'star-life-lake', 'beiji-core'];
      const isCoreOrLake = isExploreBattle && locationId && (
        coreKeywords.some(k => locationId.includes(k)) ||
        (exploreTier && coreKeywords.some(k => String(exploreTier).includes(k)))
      );
      if (isCoreOrLake) {
        expGain = Math.round((50000 + Math.random() * 30000) * 1.5); // 75000 ~ 120000 随机
      }
    }

    if (expGain > 0) addExp(expGain);
    if (coinGain > 0) addCoins(coinGain);

    // 竞技场胜利：+1星 + 金币奖励
    if (battleType === 'arena') {
      const arenaCoinReward = Math.max(0, (battleState?.meta as BattleMeta)?.coinReward ?? 5000);
      addArenaResult(true, arenaCoinReward);
    }

    const dropItems: IItem[] = [];

      // 魂骨掉落：仅普通魂兽战斗（猎魂/遭遇战）才掉；海神阁/竞技场/凶兽/神考/心魔/山脉不掉
      // 百万年魂兽特殊规则：除刚好100万年整外，不掉魂骨
      const boneDrops: IItem[] = [];
      const isMillionYearNoBone = (enemy.years || 0) > 1000000 && (enemy.years || 0) !== 1000000;
      if (!isNoRingBoneBattle && !isMillionYearNoBone) {
      const bone = rollSoulBoneDrop(enemy.years, enemy.name, enemy.qualityColor, normalizeBeastAttribute(enemy.element || inferElementFromName(enemy.name)));
        if (bone) {
         boneDrops.push(bone);
         if (isExploreBattle) {
           collectExploreItem(bone);
         } else {
           // 非探索战：胜利时直接入包（与材料掉落处理一致）
           addItem(bone);
         }
        if (bone.slot === 'external') {
          addLog(`🌟 稀有外附魂骨：${bone.name}！`, 'skill');
        } else {
          addLog(`💀 获得魂骨：${bone.name}！`, 'skill');
        }
      }

      // 🔴 圣龙耀阳草：仅十年魂兽掉落，概率70%
       if (enemy.qualityLabel === '十年' && !isExploreBattle && battleType === 'hunt') {
         if (Math.random() < 0.7) {
          const grass = IMMORTAL_GRASSES.find((g) => g.id === 'sacred-dragon-yang-grass');
          if (grass) {
            const drop = { ...grass, instanceId: `sacred-dragon-${Date.now()}` };
            dropItems.push(drop);
            addItem(drop);
            addLog(`🐲 传说仙草：圣龙耀阳草！`, 'skill');
          }
        }
      }
    }

     // 掉魂环：仅普通魂兽战斗（猎魂/遭遇战）100% 掉落；非魂兽战斗（人/凶兽/神考等）不掉
     let droppedRing: ISoulRing | null = null;
     let droppedRingSoulIndex: 0 | 1 = 0; // 魂环归属的武魂索引
     if (!isNoRingBoneBattle) {
       const y = enemy.years || 100;
       // 推断魂兽系别（按魂兽名）
       const beastType = inferBeastTypeFromRing({ soulBeastName: enemy.name });
       // 计算数值属性
       const ringStats = calcRingStatsByYears(y, beastType);
       // 双生武魂：根据最后一击的武魂决定魂环归属
       const hitSoulIdx = lastHitSoulIndexRef.current;
        const targetSoulRings = hitSoulIdx === 1 ? secondSoulRings : playerSoulRings;
        const targetSoul = hitSoulIdx === 1 ? playerSecondSoul : playerMartialSoul;
       // 魂技由对应武魂决定（当前已有魂环数+1 对应第N魂技）
        const nextRingIndex = targetSoulRings.length;
        // 🔴 修复：使用 generateSoulSkills 统一生成魂技名称，确保与吸收后 / 旧存档刷新的名称完全一致
        // 避免战斗掉落时一套名字、吸收后另一套名字，导致玩家感觉"魂技变了"
        const allSoulSkills = targetSoul ? generateSoulSkills(targetSoul) : [];
        const skillName = allSoulSkills[nextRingIndex] || `第${nextRingIndex + 1}魂技`;
         const soulName = targetSoul?.name || playerMartialSoul?.name || '武魂';
        let skillDesc = `由${soulName}衍生的第${nextRingIndex + 1}魂技，威力随魂环品质提升。`;

        // 根据武魂系别 + 魂技名称推断技能类型（与吸收后 / generateSoulSkills 保持一致）
        const dept = targetSoul ? getSoulDepartment(targetSoul.type) : '强攻系';
       let skillType: 'attack' | 'heal' | 'buff' | 'allBuff' = 'attack';
       let buffAttr: 'attack' | 'defense' | 'speed' | 'spirit' | undefined;

        // 第7魂环：武魂真身（固定 buff）
       if (nextRingIndex === 6) {
         skillType = 'buff';
         buffAttr = 'attack';
         skillDesc = `释放${soulName}真身，全属性与魂技威力大幅提升！`;
        } else if (dept === '辅助系') {
          // 辅助系：奇位(第1/3/5/9魂技)攻击型，偶位(第2/4/6/8魂技)辅助型
          if (nextRingIndex % 2 === 0) {
            // 奇位：攻击魂技（索引0/2/4/8 → 第1/3/5/9）
            skillType = 'attack';
            skillDesc = `凝聚${soulName}之力发动攻击，威力随魂环品质提升。`;
          } else {
            // 偶位：辅助魂技（索引1/3/5/7 → 第2/4/6/8），偶数治疗、奇数增益
            const buffIdx = Math.floor((nextRingIndex - 1) / 2);
            const attrList: ('attack' | 'defense' | 'speed' | 'spirit')[] = ['attack', 'defense', 'speed', 'spirit'];
            if (nextRingIndex === 1 || nextRingIndex === 3 || nextRingIndex === 5) {
              // 第2/4/6魂技：治疗
              skillType = 'heal';
              skillDesc = `恢复自身气血，治疗量随魂环品质提升。`;
            } else if (buffIdx >= 4) {
              skillType = 'allBuff';
              buffAttr = 'attack';
              skillDesc = `全面提升自身攻击、防御、速度、精神力，持续3回合。`;
            } else {
               // 第8魂技：九宝玲珑塔 → 九宝神光（全属性增幅，持续5回合，神级辅助）
               // 七宝琉璃塔 → 精神力单属性 buff（辅助系标准第8魂技）
               const isJiubao = soulName === '九宝玲珑塔';
               if (isJiubao) {
                 skillType = 'allBuff';
                 buffAttr = 'attack';
                 skillDesc = `九宝神光！九宝玲珑塔第八魂技，全属性大幅提升，持续5回合。`;
               } else {
                 buffAttr = attrList[buffIdx % 4];
                 skillType = 'buff';
                 skillDesc = `提升自身${buffAttr === 'attack' ? '攻击' : buffAttr === 'defense' ? '防御' : buffAttr === 'speed' ? '速度' : '精神'}力，持续3回合。`;
               }
             }
          }
        }

       droppedRing = {
         id: `ring-${Date.now()}`,
         color: enemy.qualityColor as ISoulRing['color'],
         qualityLabel: enemy.qualityLabel,
         soulBeastName: enemy.name,
        skillName,
        skillDesc,
        years: enemy.years,
        beastType,
         // 🔴 属性一致性：严格使用魂兽自身的 element 并立即归一化到11种标准属性
         // 确保魂兽介绍→掉落→待吸收→吸收→显示全链路属性完全一致
         beastAttribute: normalizeBeastAttribute(enemy.element || inferElementFromName(enemy.name)),
        skillType,
        buffAttr,
        attackBonus: ringStats.attackBonus,
        defenseBonus: ringStats.defenseBonus,
        speedBonus: ringStats.speedBonus,
        spiritBonus: ringStats.spiritBonus,
        hpBonus: ringStats.hpBonus,
        critRateBonus: ringStats.critRateBonus,
        critDmgBonus: ringStats.critDmgBonus,
        soulPowerBonus: ringStats.soulPowerBonus,
        skillDamage: ringStats.skillDamage,
        // 掉落时预计算伤害百分比（属性契合按0预估，吸收时根据武魂属性精确重算）
         skillDamagePct: calcSkillDamagePct(enemy.years, beastType, nextRingIndex, 0),
       };
       // 武魂真身防御性校验：确保第7魂环（索引6）skillName 固定为"武魂真身"
       // generateSoulSkills 已在索引6返回"武魂真身"，这里做双重保险
       if (nextRingIndex === 6) {
         droppedRing.skillName = '武魂真身';
       }
       droppedRingSoulIndex = hitSoulIdx;
       addLog(`🌟 获得 ${enemy.qualityLabel}魂环：${enemy.name}！`, 'skill');
    }

    // 山脉战斗：额外掉落魂导材料（旧的山脉探索模式）
    const materialDrops: IItem[] = [];
    if (battleState?.exploreSource?.tier?.startsWith('mountain-')) {
      const tier = parseInt(battleState.exploreSource.tier.replace('mountain-', ''), 10) || 1;
      const count = 3 + Math.floor(Math.random() * 4);
      const mats = rollMaterialByTier(tier, count);
      for (const m of mats) {
        materialDrops.push({ ...m, id: `${m.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` });
        if (isExploreBattle) {
          collectExploreItem(materialDrops[materialDrops.length - 1]);
        } else {
          addItem(materialDrops[materialDrops.length - 1]);
        }
      }
      addLog(`🔧 获得 ${count} 件 ${tier} 级魂导材料！`, 'skill');
    }

    // 山脉副本战斗：按副本指定材料池随机掉落（1~3 个，按品阶概率），100% 必掉
    if (isMountainDungeon) {
      const dropList = (battleState?.meta as BattleMeta)?.drops;
      if (dropList && dropList.length > 0) {
        const dropCount = 1 + Math.floor(Math.random() * 3); // 1~3 个
        const batchItems: IItem[] = [];
        for (let i = 0; i < dropCount; i++) {
          // 通用材料(matAttr=universal)保证 40% 掉率，其余按品阶权重随机
          const universalDrop = dropList.find((d) => d.matId && d.matId.endsWith('-8'));
          let chosen: typeof dropList[0];
          if (universalDrop && Math.random() < 0.4) {
            // 40% 概率必掉通用材料（精良品质）
            chosen = universalDrop;
          } else {
            // 其余 60% 按品阶权重随机选（排除通用材料，避免重复加权）
            const otherDrops = dropList.filter((d) => !(d.matId && d.matId.endsWith('-8')));
            const pool = otherDrops.length > 0 ? otherDrops : dropList;
            const weights = pool.map((d) => MATERIAL_QUALITY_INFO[d.quality]?.chance ?? 0.5);
            const total = weights.reduce((s, w) => s + w, 0);
            let r = Math.random() * total;
            chosen = pool[0];
            for (let j = 0; j < pool.length; j++) {
              r -= weights[j];
              if (r <= 0) { chosen = pool[j]; break; }
            }
          }
          // 用 matId 精确匹配材料（matId 格式如 'mat-1-1'，与材料库 ID 一致）
          const matItem = rollMaterialWithQuality(chosen.tier, chosen.quality, chosen.matId);
          const newItem: IItem = { ...matItem, id: `${chosen.matId}-${chosen.quality}-${Date.now()}-${i}`, quantity: 1 };
          batchItems.push(newItem);
          materialDrops.push(newItem);
        }
        // 批量入包，避免多次 setPlayer 互相覆盖
        for (const it of batchItems) addItem(it);
        const matNames = [...new Set(materialDrops.slice(-dropCount).map(m => m.name))].join('、');
        addLog(`🔧 获得 ${dropCount} 件魂导材料：${matNames}`, 'skill');
      }
    }

    // 胜利后回满血
    setCurrentHp(attrs?.hp ?? playerHp);

    // 极北之地探索：小概率掉落冰/水属性灵草
    const exploreArea = battleState?.exploreSource?.areaName;
    if (isExploreBattle && (exploreArea === 'beiji' || exploreArea === 'beiji-ice')) {
      const iceGrass = rollIceGrassDrop(0.12);
      if (iceGrass) {
        dropItems.push(iceGrass);
        collectExploreItem(iceGrass);
        addLog(`🍃 获得灵草：${iceGrass.name}`, 'skill');
      }
    }


      setRewards({
        exp: expGain,
        coins: coinGain,
        items: [...dropItems, ...materialDrops],
        ring: droppedRing,
        ringSoulIndex: droppedRingSoulIndex,
        soulBones: boneDrops,
        beastName: enemy.name,
        beastYears: enemy.years,
        beastQuality: enemy.qualityColor,
      });
       // 🔴 修复：根据实际掉落情况决定胜利阶段，避免无魂环/无魂灵时卡在ring-select导致软锁
       if (isSpiritTower) {
         setVictoryStep('spirit-select');
       } else if (droppedRing) {
         setVictoryStep('ring-select');
       } else {
         setVictoryStep('summary');
       }
      // 非探索战：胜利时立即把魂环加入待吸收列表，确保持久化（防止玩家未点收起就刷新/大退导致魂环丢失）
      // 探索战：胜利时也立即加入 exploration.collectedRings（已持久化到 EXPLORE_SAVE_KEY），防止刷新后丢失
      // 「销毁」操作会从 collectedRings 中移除对应魂环；「收起」只是确认，不重复添加
      if (droppedRing) {
        if (isExploreBattle) {
          collectExploreRing(droppedRing, droppedRingSoulIndex as 0 | 1);
        } else {
          const pending: IPendingSoulRing = {
            ...droppedRing,
            soulIndex: droppedRingSoulIndex,
            expiresAt: Date.now() + 3 * 60 * 1000, // 3分钟后消失
          };
          addPendingRing(pending);
        }
      }
     // 战斗胜利奖励发放后立即存档（绕过 200ms 节流），防止玩家战斗完立刻大退丢奖励
     saveGame();
    };

  // 监听敌方血量变化检测胜利（battleEndedRef 锁死只触发一次）
  useEffect(() => {
    if (enemyHp <= 0 && !battleEndedRef.current && phase !== 'victory' && phase !== 'defeat' && phase !== 'flee') {
      handleVictory();
    }
  }, [enemyHp, phase]); // 依赖最简，避免 handleVictory 重建触发重复执行

    // 收起魂环（ref 锁防双击）
  const ringCollectedRef = useRef(false);
  // 魂灵收集/放弃锁（与魂环锁独立，避免互斥）
  const spiritCollectedRef = useRef(false);
    const handleCollectRing = () => {
      if (!rewards.ring || ringCollectedRef.current) return;
      ringCollectedRef.current = true;
       // 无论是否探索战，魂环都已在胜利时存入对应列表（pending 或 exploration.collectedRings）
       // 这里仅做 UI 确认和提示
       if (isExploreBattle) {
         toast.success('魂环已收入魂环列表，探索结束后开始3分钟倒计时');
       } else {
         toast.success('魂环已收入魂环列表，请在3分钟内吸收或销毁');
       }
       // 🔴 混沌无极武魂：魂环收取后弹出吞噬选项（仅普通猎魂/探索战且有明确魂兽年限）
       const canDevour = (player?.martialSoul.name === '混沌无极' || (player?.isTwinSoul && player?.secondSoul?.name === '混沌无极')) && rewards.beastYears > 0 && rewards.beastName;
       if (canDevour) {
         setDevourDialog({ open: true, phase: 'confirm' });
       } else {
         setVictoryStep('summary');
       }
     };

     // 销毁魂环
     const handleDiscardRing = () => {
       if (ringCollectedRef.current) return;
       ringCollectedRef.current = true;
       if (rewards.ring) {
         if (isExploreBattle) {
           // 探索战：魂环已在胜利时加入 exploration.collectedRings
           // 销毁需要从列表中移除
           removeExploreRing(rewards.ring.id);
           toast.info('已放弃该魂环');
         } else {
           // 非探索战：魂环已在 pendingSoulRings 中，直接移除
           discardPendingRing(rewards.ring.id);
           toast.info('魂环已销毁');
         }
       } else {
         toast.info('魂环已销毁');
       }
       // 🔴 混沌无极武魂：魂环销毁后也弹出吞噬选项（吞魂兽本体加属性，与魂环无关）
       const canDevour = (player?.martialSoul.name === '混沌无极' || (player?.isTwinSoul && player?.secondSoul?.name === '混沌无极')) && rewards.beastYears > 0 && rewards.beastName;
       if (canDevour) {
         setDevourDialog({ open: true, phase: 'confirm' });
       } else {
         setVictoryStep('summary');
       }
     };

  // 收入魂灵（传灵塔胜利）
  const handleCollectSpirit = () => {
    if (spiritCollectedRef.current) return;
    spiritCollectedRef.current = true;
    const meta = (battleState?.meta ?? {}) as BattleMeta;
    if (meta.spiritId) {
      const pending = {
        id: `pending-spirit-${Date.now()}`,
        spiritId: String(meta.spiritId),
        name: String(meta.spiritName || ''),
        attribute: String(meta.spiritAttribute || '金'),
        description: String(meta.spiritDesc || ''),
        feature: String(meta.spiritFeature || ''),
        iconChar: String(meta.spiritIconChar || '灵'),
        expiresAt: Date.now() + 7 * 60 * 1000,
      };
      addPendingSpirit(pending);
      toast.success(`魂灵「${pending.name}」已收入待选择列表，7分钟内可契约`);
    }
    setVictoryStep('summary');
  };

  // 放弃魂灵
  const handleDiscardSpirit = () => {
    if (spiritCollectedRef.current) return;
    spiritCollectedRef.current = true;
    toast.info('已放弃该魂灵');
    setVictoryStep('summary');
  };

  // ============================================================
  // 渲染
  // ============================================================
  return (
    <div className="fixed inset-0 w-full h-[100dvh] text-foreground overflow-hidden flex flex-col">
      {/* 战斗场景背景图 */}
       <div
         className="absolute inset-0 -z-10"
         style={{
           backgroundImage: 'url(https://aka.doubaocdn.com/s/LX0R6GARKC)',
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           backgroundRepeat: 'no-repeat',
         }}
       />
       {/* 深色不透明遮罩：保证所有元素清晰可见，符合玄幻暗金风格 */}
       <div
         className="absolute inset-0 -z-10 bg-background/95"
         style={{
           background: 'linear-gradient(180deg, hsl(248 35% 12%) 0%, hsl(248 32% 10%) 50%, hsl(248 38% 8%) 100%)',
         }}
       />
      {/* 顶部栏 */}
       <header className="relative z-10 flex items-center gap-2 md:gap-3 border-b border-cyan-500/20 bg-card px-3 md:px-6 py-1.5 md:py-2.5 text-foreground shadow-md">
        {!isExploreBattle ? (
             <button
              onClick={() => endBattle()}
               className="p-1.5 rounded-lg bg-card border border-cyan-500/30 hover:bg-cyan-800/50 transition-colors text-cyan-200"
              aria-label="返回"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={handleFlee}
            disabled={phase !== 'playerTurn'}
            className="p-1.5 rounded-lg bg-card/50 border border-border/40 hover:bg-card transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="逃跑"
            title="逃跑"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-sm md:text-base font-bold">战斗中</h1>
         <span className="ml-auto text-xs md:text-sm text-cyan-400">
           {battleType === 'challenge' ? '挑战' :
             battleType === 'encounter' ? '遭遇战' :
               battleType === 'arena' ? '竞技场' :
                 battleType === 'shrek-exam' ? '考核' :
                   battleType === 'mountain-dungeon' ? '副本战斗' :
                     battleType === 'demon' ? '心魔战' :
                    battleType === 'sea-god' ? '海神阁挑战' : battleType === 'spirit-tower' ? '传灵塔' : '猎魂战斗'}
        </span>
      </header>

         {battleType==='fierce-beast'&&__FBProfiles[enemy.id]&&<div role="status" data-fierce-effects style={{whiteSpace:'pre-wrap',fontSize:12,padding:'6px 12px',color:'#b8edff',background:'#10233a'}}>{__fbStatus(__fbRef.current||battleState?.meta?.fierceEffects)||'凶兽技能机制已启用：'+enemy.name}</div>}
         {battleState?.meta?.shadow&&<div role="status" className="px-3 py-2 text-purple-300">轮回领域已展开：全属性 +{battleState.meta.shadow.lifeIndex*10}%，魂技伤害 +{battleState.meta.shadow.lifeIndex}%</div>}
         {/* 战斗主区域 - flex-1 占满剩余空间 */}
         <div className="flex-1 flex flex-col px-2 md:px-8 py-2 md:py-6 gap-2 md:gap-8 relative overflow-hidden min-h-0 w-full max-w-6xl mx-auto">
            {/* 上半：敌方 + 我方（手机端敌方左我方右，桌面端我方左敌方右） */}
            <div className="flex flex-row md:flex-row-reverse items-start md:items-stretch justify-between gap-2 md:gap-8 shrink-0">
             {/* 敌方区域 */}
             <div className="flex-1 min-w-0 max-w-[48%] md:max-w-none md:flex-none md:w-72">
               <EnemyArea
                 enemy={enemy}
                 enemyHp={enemyHp}
                 enemyMaxHp={enemyMaxHp}
                 enemyHpPercent={enemyHpPercent}
                 phase={phase}
                 damagePopups={damagePopups}
                 formatYearsLabel={formatYearsLabel}
                 formatNumber={formatNumber}
               />
             </div>
             {/* 我方区域 */}
             <div className="flex-1 min-w-0 max-w-[48%] md:max-w-none md:flex-none md:w-72">
               <PlayerArea
                 playerName={playerName}
                 playerTitle={playerTitle}
                 playerLevel={playerLevel}
                 playerQuality={playerQuality}
                 playerSoulRings={playerSoulRings}
                 isDeity={!!player?.divineTrial?.inherited}
                 ringColor={player?.divineTrial?.divineSoulRing?.color ?? '#fcd34d'}
                 anyTrueBody={anyTrueBody}
                 activeTrueBodyIndex={activeTrueBodyIndex}
                 phase={phase}
                 playerHpPercent={playerHpPercent}
                 playerDisplayHp={playerDisplayHp}
                 maxHp={attrs?.hp ?? 0}
                 soulPowerPercent={soulPowerPercent}
                 currentSoulPower={currentSoulPower}
                 maxSoulPower={attrs?.maxSoulPower ?? 0}
                 battleSpirits={battleSpirits}
                 damagePopups={damagePopups}
                 trueBodyTurns={trueBodyTurns}
                 secondTrueBodyTurns={secondTrueBodyTurns}
                 tempBuffs={tempBuffs}
                 showHp={!!(attrs && attrs.hp > 0)}
               />
             </div>
           </div>

           {/* 战斗日志 - flex-1 占剩余空间，内部滚动 */}
           <div
             ref={logRef}
             className="w-full flex-1 min-h-[60px] overflow-y-auto rounded-lg md:rounded-xl border border-cyan-500/30 bg-card px-2 md:px-5 py-1.5 md:py-4 text-[10px] md:text-sm space-y-0.5 md:space-y-1.5 text-cyan-200"
           >
             <BattleLog logs={logs} />
           </div>
         </div>

       {/* 胜利-魂环选择阶段：全屏模态弹窗，必须点击按钮才关闭 */}
       {phase === 'victory' && victoryStep === 'ring-select' && rewards.ring && (
         <div className="absolute inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 m-0 ring-select-overlay">
           <div
              className="w-full max-w-sm rounded-2xl border-2 shadow-xl overflow-hidden ring-select-modal bg-card/95 text-foreground backdrop-blur-md"
             style={{
              backgroundColor: `${RING_DISPLAY_COLOR[rewards.ring.color as keyof typeof RING_DISPLAY_COLOR]}15`,
              borderColor: `${RING_DISPLAY_COLOR[rewards.ring.color as keyof typeof RING_DISPLAY_COLOR]}60`,
              boxShadow: `0 0 40px ${RING_DISPLAY_COLOR[rewards.ring.color as keyof typeof RING_DISPLAY_COLOR]}40`,
             }}
           >
               <div className="bg-gradient-to-b from-sky-100/80 to-transparent p-4 text-center border-b border-cyan-500">
                <div className="text-lg font-black text-cyan-400">
                ✨ 获得魂环！
              </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  击败 {rewards.beastName || rewards.ring.soulBeastName}
                </div>
                {playerMartialSoul?.element && (
                  <div className="text-[10px] text-cyan-400/80 mt-1">
                    你的武魂属性：{playerMartialSoul.element}
                  </div>
                )}
            </div>
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {/* 魂环外观+名称 */}
              <div className="flex items-center gap-3">
                <div className="shrink-0 w-16 h-16 flex items-center justify-center">
                  <SoulRing color={rewards.ring.color} years={rewards.ring.years} beastAttribute={rewards.ring.beastAttribute} size={64} animate />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold" style={{ color: RING_DISPLAY_COLOR[rewards.ring.color as keyof typeof RING_DISPLAY_COLOR] }}>
                    {rewards.ring.qualityLabel}魂环
                  </div>
                   <div className="text-sm text-foreground truncate">
                    {rewards.ring.soulBeastName}
                  </div>
                  {rewards.ring.years && (
                    <div className="text-xs text-muted-foreground">
                      {rewards.ring.years.toLocaleString()} 年
                    </div>
                  )}
                </div>
              </div>
              {/* 魂环属性（未吸收不显示魂技） */}
               <div className="rounded-lg p-2.5 bg-sky-50/80 border border-cyan-500/70">
                  <div className="text-xs font-semibold text-cyan-300 mb-1.5">魂环属性</div>
                 <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">年限</span>
                      <span className="font-medium">{rewards.ring.years?.toLocaleString() || '—'} 年</span>
                    </div>
                    {rewards.ring.beastAttribute && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">属性</span>
                        <span className="font-medium">{rewards.ring.beastAttribute}</span>
                      </div>
                    )}
                    {rewards.ring.beastType && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">系别</span>
                        <span className="font-medium">
                          {rewards.ring.beastType === 'qiang' ? '强攻系' : rewards.ring.beastType === 'min' ? '敏攻系' : rewards.ring.beastType === 'kong' ? '控制系' : rewards.ring.beastType === 'fu' ? '辅助系' : '防御系'}
                        </span>
                      </div>
                    )}
                    <div className="pt-1.5 mt-1 border-t border-cyan-500/30 flex items-center justify-between">
                      <span className="text-[10px] text-cyan-400">预计伤害百分比</span>
                      <span className="text-lg font-bold text-primary tabular-nums">
                        {rewards.ring.skillDamagePct && rewards.ring.skillDamagePct > 0
                          ? `${(rewards.ring.skillDamagePct * 100).toFixed(1)}%`
                          : '—'}
                      </span>
                    </div>
                    <div className="text-[9px] text-cyan-400/70 leading-relaxed">
                      吸收后根据武魂属性契合度重算，属性共鸣可再+5%
                    </div>
                  </div>
               </div>
               {/* 属性加成 */}
                <div className="rounded-lg p-2.5 bg-sky-50/80 border border-cyan-500/70">
                  <div className="text-xs font-semibold text-cyan-300 mb-2">吸收后属性加成（数值）</div>
                 <div className="grid grid-cols-4 gap-1 text-center text-xs">
                    <div>
                      <div className="text-rose-600 font-semibold">+{Math.round(rewards.ring.attackBonus ?? 0)}</div>
                      <div className="text-[9px] text-cyan-400">攻击</div>
                    </div>
                    <div>
                      <div className="text-blue-600 font-semibold">+{Math.round(rewards.ring.defenseBonus ?? 0)}</div>
                      <div className="text-[9px] text-cyan-400">防御</div>
                    </div>
                    <div>
                      <div className="text-emerald-600 font-semibold">+{Math.round(rewards.ring.speedBonus ?? 0)}</div>
                      <div className="text-[9px] text-cyan-400">速度</div>
                    </div>
                    <div>
                      <div className="text-cyan-400 font-semibold">+{Math.round(rewards.ring.spiritBonus ?? 0)}</div>
                      <div className="text-[9px] text-cyan-400">精神</div>
                    </div>
                 </div>
                 <div className="grid grid-cols-3 gap-1 text-center text-xs mt-2">
                    <div>
                      <div className="text-cyan-300 font-semibold">+{Math.round(rewards.ring.hpBonus ?? 0)}</div>
                      <div className="text-[9px] text-cyan-400">气血</div>
                    </div>
                    <div>
                      <div className="text-orange-600 font-semibold">+{(rewards.ring.critRateBonus ?? 0).toFixed(1)}%</div>
                      <div className="text-[9px] text-cyan-400">暴击</div>
                    </div>
                    <div>
                      <div className="text-pink-600 font-semibold">+{(rewards.ring.critDmgBonus ?? 0).toFixed(0)}%</div>
                      <div className="text-[9px] text-cyan-400">爆伤</div>
                    </div>
                 </div>
                   <div className="mt-2 pt-2 border-t border-cyan-500/30 text-center">
                     <div className="text-[11px] text-cyan-400">魂技伤害百分比</div>
                     <div className="text-lg font-bold text-primary tabular-nums">
                       {rewards.ring.skillDamagePct && rewards.ring.skillDamagePct > 0
                         ? `${(rewards.ring.skillDamagePct * 100).toFixed(1)}%`
                         : '—'}
                     </div>
                     <div className="text-[9px] text-cyan-400">吸收后根据武魂属性契合度重算</div>
                  </div>
               </div>
              {/* 同时掉落魂骨 */}
              {rewards.soulBones.length > 0 && (
                <div className="rounded-lg p-2.5 bg-cyan-500/10 border border-cyan-500/30 space-y-1">
                  {rewards.soulBones.map((bone) => (
                    <div key={bone.id} className="text-xs text-cyan-200">
                      💀 同时掉落魂骨：{bone.name}（已放入背包）
                    </div>
                  ))}
                </div>
              )}
              {/* 操作按钮 */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleCollectRing}
                 className="py-2.5 rounded-lg bg-cyan-900/30 text-cyan-200 border border-cyan-500/40 text-sm font-medium hover:bg-cyan-800/50 transition-colors active:scale-95 flex items-center justify-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  收起魂环
                </button>
                <button
                  onClick={handleDiscardRing}
                  className="py-2.5 rounded-lg bg-red-900/30 text-red-400 border border-red-500/30 text-sm font-medium hover:bg-red-800/40 transition-colors active:scale-95 flex items-center justify-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  销毁魂环
                </button>
              </div>
               <div className="text-[10px] text-muted-foreground text-center pt-1">
                 请选择后再继续，弹窗不会自动消失
               </div>
               {rewards.soulBones.length > 0 && (
                 <div className="text-[10px] text-cyan-400/70 text-center">
                   💀 魂骨已进入背包，销毁魂环不影响魂骨
                 </div>
               )}
             </div>
           </div>
         </div>
        )}

       {/* 胜利-魂灵选择阶段：传灵塔战斗胜利后弹出 */}
       {phase === 'victory' && victoryStep === 'spirit-select' && (
         <div className="absolute inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 m-0 ring-select-overlay">
           <div
              className="w-full max-w-sm rounded-2xl border-2 shadow-xl overflow-hidden ring-select-modal bg-card/95 text-foreground backdrop-blur-md"
             style={{
              backgroundColor: 'rgba(124,58,237,0.12)',
              borderColor: 'rgba(168,85,247,0.55)',
              boxShadow: '0 0 40px rgba(168,85,247,0.35)',
             }}
           >
               <div className="bg-gradient-to-b from-violet-500/20 to-transparent p-4 text-center border-b border-violet-500/50">
                <div className="text-lg font-black text-violet-300">
                  ✨ 获得魂灵！
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  击败 {(battleState?.meta as BattleMeta)?.spiritName || '魂兽'}
                </div>
              </div>
             <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
               {/* 魂灵图标+名称 */}
               <div className="flex items-center gap-3">
                 <div className="shrink-0 w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-black border-2"
                      style={{
                        borderColor: '#a855f7',
                        backgroundColor: 'rgba(168,85,247,0.12)',
                        color: '#c4b5fd',
                        boxShadow: 'inset 0 0 12px rgba(168,85,247,0.25)',
                      }}>
                   {(battleState?.meta as BattleMeta)?.spiritIconChar || '灵'}
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="text-base font-bold text-violet-200">
                     魂灵·{(battleState?.meta as BattleMeta)?.spiritName || '未知'}
                   </div>
                   <div className="text-xs text-violet-300/80">
                     {(battleState?.meta as BattleMeta)?.spiritAttribute || '金'}属性
                   </div>
                 </div>
               </div>
               {/* 魂灵介绍 */}
                <div className="rounded-lg p-2.5 bg-violet-500/10 border border-violet-500/40">
                  <div className="text-xs font-semibold text-violet-300 mb-1">魂灵介绍</div>
                 <p className="text-xs text-foreground/90 leading-relaxed">
                   {(battleState?.meta as BattleMeta)?.spiritDesc || '神秘的魂灵伙伴。'}
                 </p>
               </div>
                {/* 魂灵特性 */}
                 <div className="rounded-lg p-2.5 bg-violet-500/10 border border-violet-500/40">
                  <div className="text-xs font-semibold text-violet-300 mb-1">特性</div>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {(battleState?.meta as BattleMeta)?.spiritFeature || '—'}
                  </p>
                </div>
               <div className="text-[10px] text-violet-300/60 text-center">
                 收入后可在魂灵功能中选择契约，7分钟时限
               </div>
               {/* 操作按钮 */}
               <div className="grid grid-cols-2 gap-3 pt-1">
                 <button
                   onClick={handleCollectSpirit}
                   className="py-2.5 rounded-lg bg-violet-900/40 text-violet-200 border border-violet-500/40 text-sm font-medium hover:bg-violet-800/50 transition-colors active:scale-95 flex items-center justify-center gap-1"
                 >
                   <Plus className="h-4 w-4" />
                   收入魂灵
                 </button>
                 <button
                   onClick={handleDiscardSpirit}
                   className="py-2.5 rounded-lg bg-red-900/30 text-red-400 border border-red-500/30 text-sm font-medium hover:bg-red-800/40 transition-colors active:scale-95 flex items-center justify-center gap-1"
                 >
                   <Trash2 className="h-4 w-4" />
                   放弃
                 </button>
               </div>
              </div>
           </div>
         </div>
        )}

        {/* 🔴 吞噬茶武魂·吞噬魂兽弹窗 */}
        {devourDialog.open && (
          <div className="absolute inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 ring-select-overlay">
            <div className="w-full max-w-sm rounded-2xl border-2 shadow-xl overflow-hidden ring-select-modal bg-card/95 text-foreground backdrop-blur-md mt-20"
                 style={{ borderColor: '#a855f7', boxShadow: '0 0 40px rgba(168, 85, 247, 0.35)' }}>
              <div className="bg-gradient-to-b from-purple-500/20 to-transparent p-4 text-center border-b border-purple-500/40">
                <div className="text-lg font-black text-purple-300">
                  {devourDialog.phase === 'confirm' ? '🌀 是否吞噬该魂兽？' : '✨ 吞噬成功！'}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  击败 {rewards.beastName} · {rewards.beastYears?.toLocaleString()} 年
                </div>
              </div>
              <div className="p-5 space-y-4">
                {devourDialog.phase === 'confirm' ? (
                  <>
                    <div className="text-center text-sm text-foreground/90 leading-relaxed">
                      吞噬该魂兽将随机永久增加一项五维属性。<br/>
                      <span className="text-purple-300 text-xs">（吞噬次数越多，属性越强）</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        onClick={() => {
                           const res = devourBeast(rewards.beastYears, rewards.beastName);
                           if (res.success && res.attrLabel && res.value) {
                             if (res.isBacklash) {
                               setDevourDialog({ open: true, phase: 'backlash', attrLabel: res.attrLabel, value: res.value, backlashValue: res.backlashValue });
                             } else {
                               setDevourDialog({ open: true, phase: 'result', attrLabel: res.attrLabel, value: res.value });
                             }
                           } else {
                             setDevourDialog({ open: false, phase: 'confirm' });
                             setVictoryStep('summary');
                           }
                        }}
                        className="py-2.5 rounded-lg bg-purple-900/50 text-purple-200 border border-purple-500/50 text-sm font-semibold hover:bg-purple-800/60 transition-colors active:scale-95 flex items-center justify-center gap-1"
                      >
                        🌀 吞噬
                      </button>
                      <button
                        onClick={() => {
                          setDevourDialog({ open: false, phase: 'confirm' });
                          setVictoryStep('summary');
                        }}
                        className="py-2.5 rounded-lg bg-card/60 text-muted-foreground border border-border/60 text-sm font-medium hover:bg-card/80 hover:text-foreground transition-colors active:scale-95 flex items-center justify-center gap-1"
                      >
                        放弃
                      </button>
                    </div>
                  </>
                ) : devourDialog.phase === 'backlash' ? (
                  <>
                    <div className="text-center space-y-3 py-2">
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                        className="text-5xl"
                      >
                        💀
                      </motion.div>
                      <div className="text-sm text-red-400 font-bold tracking-widest">⚠️ 吞噬反噬 ⚠️</div>
                      <div className="pt-2">
                        <motion.div
                          initial={{ y: -10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.4 }}
                          className="text-4xl font-black text-red-400 tabular-nums drop-shadow-lg"
                          style={{ textShadow: '0 0 20px rgba(248,113,113,0.6)' }}
                        >
                          -{formatNumber(devourDialog.backlashValue || 0)}
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4, duration: 0.4 }}
                          className="text-base font-bold text-foreground mt-1"
                        >
                          {devourDialog.attrLabel} 降低
                        </motion.div>
                      </div>
                      <div className="text-[11px] text-red-400/80 max-w-[280px] mx-auto">
                        吞噬失控，{devourDialog.attrLabel}永久下降，下次小心！
                       </div>
                     </div>
                    <button
                      onClick={() => {
                        setDevourDialog({ open: false, phase: 'confirm' });
                        setVictoryStep('summary');
                      }}
                      className="w-full py-2.5 rounded-lg bg-red-900/40 text-red-300 border border-red-500/40 text-sm font-semibold hover:bg-red-800/50 transition-colors active:scale-95"
                    >
                      确定
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-center space-y-2 py-3">
                      <div className="text-xs text-muted-foreground">获得属性</div>
                      <div className="text-3xl font-black text-purple-300 tabular-nums">
                        +{formatNumber(devourDialog.value || 0)}
                      </div>
                      <div className="text-base font-bold text-foreground">{devourDialog.attrLabel}</div>
                      <div className="text-[11px] text-purple-300/80 mt-2">已永久加入角色属性</div>
                    </div>
                    <button
                      onClick={() => {
                        setDevourDialog({ open: false, phase: 'confirm' });
                        setVictoryStep('summary');
                      }}
                      className="w-full py-2.5 rounded-lg bg-purple-900/50 text-purple-200 border border-purple-500/50 text-sm font-semibold hover:bg-purple-800/60 transition-colors active:scale-95"
                    >
                      确定
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 🔴 三茶转化特殊魂灵弹窗 */}
        {convertSpiritDialog.open && (
          <div className="absolute inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 ring-select-overlay">
            <div className="w-full max-w-sm rounded-2xl border-2 shadow-xl overflow-hidden ring-select-modal bg-card/95 text-foreground backdrop-blur-md mt-16"
                 style={{ borderColor: '#fbbf24', boxShadow: '0 0 40px rgba(251, 191, 36, 0.3)' }}>
              <div className="bg-gradient-to-b from-amber-500/15 to-transparent p-4 text-center border-b border-amber-500/40">
                <div className="text-lg font-black text-amber-300">
                  {convertSpiritDialog.done ? '🌟 魂灵转化成功！' : '🌟 是否转化为魂灵？'}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {convertSpiritDialog.name} · 特殊魂灵
                </div>
              </div>
              <div className="p-5 space-y-4">
                {!convertSpiritDialog.done ? (
                  <>
                    <div className="text-center text-sm text-foreground/90 leading-relaxed">
                      再次击败 {convertSpiritDialog.name}，可将其转化为你的特殊魂灵。<br/>
                      <span className="text-amber-300 text-xs">（特殊魂灵不占用魂灵上限，固定属性，无法升级）</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        onClick={() => {
                          if (!convertSpiritDialog.spiritId) return;
                          const res = convertSpecialSpirit(
                            convertSpiritDialog.spiritId,
                            convertSpiritDialog.name || '',
                            convertSpiritDialog.attribute || '',
                            convertSpiritDialog.sourceId || '',
                            convertSpiritDialog.hp || 0,
                            convertSpiritDialog.attack || 0,
                            convertSpiritDialog.defense || 0,
                            convertSpiritDialog.speed || 0,
                            convertSpiritDialog.spirit || 0,
                            convertSpiritDialog.skillName || '',
                            convertSpiritDialog.skillDesc || '',
                            convertSpiritDialog.instantKillChance || 0,
                            convertSpiritDialog.iconChar || '魂',
                          );
                          if (res.success) {
                            setConvertSpiritDialog(prev => ({ ...prev, done: true }));
                          } else {
                            toast.error(res.reason || '转化失败');
                            setConvertSpiritDialog({ open: false });
                          }
                        }}
                        className="py-2.5 rounded-lg bg-amber-900/40 text-amber-200 border border-amber-500/50 text-sm font-semibold hover:bg-amber-800/50 transition-colors active:scale-95"
                      >
                        🌙 转化为魂灵
                      </button>
                      <button
                        onClick={() => {
                          setConvertSpiritDialog({ open: false });
                        }}
                        className="py-2.5 rounded-lg bg-card/60 text-muted-foreground border border-border/60 text-sm font-medium hover:bg-card/80 hover:text-foreground transition-colors active:scale-95"
                      >
                        放弃
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center space-y-2 py-2">
                      <div className="text-xl font-bold text-amber-300">
                        {convertSpiritDialog.name}
                      </div>
                      <div className="text-xs text-muted-foreground">已成为你的特殊魂灵</div>
                      <div className="text-[11px] text-amber-300/80 mt-1">
                        技能：{convertSpiritDialog.skillName}
                      </div>
                    </div>
                    <button
                      onClick={() => setConvertSpiritDialog({ open: false })}
                      className="w-full py-2.5 rounded-lg bg-amber-900/40 text-amber-200 border border-amber-500/50 text-sm font-semibold hover:bg-amber-800/50 transition-colors active:scale-95"
                    >
                      确定
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 🔴 混沌茶强配弹窗 */}
        {hundunForceDialog.open && (
          <div className="absolute inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 ring-select-overlay">
            <div className="w-full max-w-sm rounded-2xl border-2 shadow-2xl overflow-hidden ring-select-modal bg-card/95 text-foreground backdrop-blur-md mt-12"
                 style={{ borderColor: '#e879f9', boxShadow: '0 0 50px rgba(232, 121, 249, 0.35)' }}>
              <div className="bg-gradient-to-b from-fuchsia-500/20 to-transparent p-4 text-center border-b border-fuchsia-500/40">
                <div className="text-lg font-black text-fuchsia-300">
                  {hundunForceDialog.phase === 'confirm' ? '💫 是否强配混沌茶？' : hundunForceDialog.phase === 'story' ? '🌙 混沌茶屈服' : '✨ 已结为夫妻'}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  至高神级·混沌茶
                </div>
              </div>
              <div className="p-5 space-y-4">
                {hundunForceDialog.phase === 'confirm' && (
                  <>
                    <div className="text-sm text-foreground/90 leading-relaxed text-center">
                      你已获得混沌神剑。<br/>
                      是否强行娶混沌茶为妻？<br/>
                      <span className="text-fuchsia-300 text-xs">（突破夫妻唯一限制，可成为第二任妻子）</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        onClick={() => {
                          const res = forceMarryHundunCha();
                          if (res.success) {
                            setHundunForceDialog({ open: true, phase: 'story' });
                          } else {
                            toast.error(res.reason || '强配失败');
                            setHundunForceDialog({ open: false, phase: 'confirm' });
                          }
                        }}
                        className="py-2.5 rounded-lg bg-fuchsia-900/50 text-fuchsia-200 border border-fuchsia-500/50 text-sm font-semibold hover:bg-fuchsia-800/60 transition-colors active:scale-95"
                      >
                        💍 强配
                      </button>
                      <button
                        onClick={() => setHundunForceDialog({ open: false, phase: 'confirm' })}
                        className="py-2.5 rounded-lg bg-card/60 text-muted-foreground border border-border/60 text-sm font-medium hover:bg-card/80 hover:text-foreground transition-colors active:scale-95"
                      >
                        放弃
                      </button>
                    </div>
                  </>
                )}
                {hundunForceDialog.phase === 'story' && (
                  <>
                    <div className="text-sm text-foreground/90 leading-relaxed text-center py-2">
                      你打败了混沌茶，强行配了她，她想过反抗，却无济于事，最终屈服，任你处置。
                    </div>
                    <button
                      onClick={() => setHundunForceDialog({ open: true, phase: 'done' })}
                      className="w-full py-2.5 rounded-lg bg-fuchsia-900/50 text-fuchsia-200 border border-fuchsia-500/50 text-sm font-semibold hover:bg-fuchsia-800/60 transition-colors active:scale-95"
                    >
                      关闭
                    </button>
                  </>
                )}
                {hundunForceDialog.phase === 'done' && (
                  <>
                    <div className="text-center space-y-2 py-2">
                      <div className="text-xl font-bold text-fuchsia-300">混沌茶</div>
                      <div className="text-xs text-muted-foreground">已成为你的妻子</div>
                      <div className="text-[11px] text-fuchsia-300/80 mt-1">
                        全属性 +10%（被动生效，可叠加）
                      </div>
                    </div>
                    <button
                      onClick={() => setHundunForceDialog({ open: false, phase: 'confirm' })}
                      className="w-full py-2.5 rounded-lg bg-fuchsia-900/50 text-fuchsia-200 border border-fuchsia-500/50 text-sm font-semibold hover:bg-fuchsia-800/60 transition-colors active:scale-95"
                    >
                      确定
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 底部操作区 - flex-shrink-0 防挤压，始终可见 */}
        <div className="relative z-10 flex-shrink-0 border-t border-cyan-500/20 bg-card px-2 md:px-8 pt-2 md:pt-3 pb-[max(10px,env(safe-area-inset-bottom))] text-foreground shadow-lg">
         {/* 胜利 / 失败 / 逃跑 结算界面 */}
         {(phase === 'victory' || phase === 'defeat' || phase === 'flee') && (
           <div className="flex flex-col">
              {/* 结算内容区 - 可滚动，不包含返回按钮 */}
              <div className="text-center max-h-[35vh] overflow-y-auto px-1 mb-3">
              {phase === 'victory' && victoryStep === 'summary' && (
                <>
                    <div className="text-xl font-black text-cyan-400 mb-1">
                    {battleType === 'arena' ? '🏆 竞技场胜利！' : battleType === 'sea-god' ? '⚔️ 海神阁挑战成功！' : '🎉 战斗胜利！'}
                  </div>
                  {rewards.beastName && (
                    <div className="text-sm text-foreground/80 mb-2">
                      击败了 <span className="text-cyan-300 font-semibold">{rewards.beastName}</span>
                    </div>
                  )}
                  {liehunRef.current?.eligible && <div className="rounded-xl border border-purple-500/25 bg-card/60 p-3 text-xs" data-liehun-reward>碎念汲取：玩家直接伤害 {formatNumber(liehunRef.current.damage)}，永久精神力 +{formatNumber(Math.floor(liehunRef.current.damage/1e16))}</div>}
                  {(rewards.exp > 0 || rewards.coins > 0) && (
                    <div className="flex items-center justify-center gap-4 text-sm mb-3">
                      {rewards.exp > 0 && (
                        <div className="flex items-center gap-1">
                           <span className="text-cyan-400">+{formatNumber(rewards.exp)}</span>
                          <span className="text-muted-foreground text-xs">修为</span>
                        </div>
                      )}
                      {rewards.coins > 0 && (
                        <div className="flex items-center gap-1">
                          <Coins className="h-4 w-4 text-yellow-400" />
                           <span className="text-yellow-300">+{formatNumber(rewards.coins)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {rewards.items.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      <div className="text-xs font-semibold text-cyan-400">🎁 获得物品</div>
                      {(() => {
                        // 按名称+品质合并显示数量
                        const grouped: Record<string, { item: IItem; count: number }> = {};
                        for (const it of rewards.items) {
                          const key = `${it.name}-${it.materialQuality || it.quality}`;
                          if (grouped[key]) {
                            grouped[key].count += it.quantity ?? 1;
                          } else {
                            grouped[key] = { item: it, count: it.quantity ?? 1 };
                          }
                        }
                         return Object.values(grouped).map(({ item, count }) => {
                             const mq = item.materialQuality as keyof typeof MATERIAL_QUALITY_INFO | undefined;
                             const displayColor = mq ? MATERIAL_QUALITY_INFO[mq]?.color || item.qualityColor : item.qualityColor;
                             const displayLabel = mq ? MATERIAL_QUALITY_INFO[mq]?.label || '' : '';
                             return (
                               <div
                                 key={item.id}
                                 className="flex items-center gap-2 rounded-lg p-2 border"
                                 style={{
                                   backgroundColor: `${displayColor || '#94a3b8'}12`,
                                   borderColor: `${displayColor || '#94a3b8'}50`,
                                 }}
                               >
                                 <div
                                   className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center text-base font-bold border-2"
                                   style={{
                                     borderColor: displayColor || '#94a3b8',
                                     color: displayColor || '#94a3b8',
                                   }}
                                 >
                                   {item.iconChar || '材'}
                                 </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-cyan-200 truncate">{item.name}</div>
                                    <div className="text-[10px]" style={{ color: displayColor }}>
                                      {displayLabel} · x{count}
                                    </div>
                                    {/* 物品属性加成简要提示 */}
                                    {item.attributes && (
                                      <div className="text-[10px] text-green-400 mt-0.5 truncate">
                                        {formatItemAttrBonus(item.attributes)}
                                      </div>
                                    )}
                                  </div>
                               </div>
                             );
                           });
                      })()}
                    </div>
                  )}
                 {rewards.soulBones.length > 0 && (
                    <div className="space-y-1.5 mb-1">
                      {rewards.soulBones.map((bone) => (
                        <div
                          key={bone.id}
                          className="rounded-lg p-2 text-left border"
                          style={{
                            backgroundColor: `${QUALITY_COLOR[bone.quality as keyof typeof QUALITY_COLOR]}15`,
                            borderColor: `${QUALITY_COLOR[bone.quality as keyof typeof QUALITY_COLOR]}50`,
                          }}
                        >
                          <div className="text-xs font-bold" style={{ color: QUALITY_COLOR[bone.quality as keyof typeof QUALITY_COLOR] }}>
                            💀 获得魂骨！
                          </div>
                          <div className="text-xs text-cyan-200">{bone.name}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">已放入背包</div>
                        </div>
                      ))}
                    </div>
                  )}
               </>
             )}
             {phase === 'defeat' && (
                <>
                  <div className="text-xl font-black text-red-400 mb-2">战斗失败</div>
                  <p className="text-xs text-muted-foreground">气血已自动恢复，再接再厉！</p>
                </>
              )}
              {phase === 'flee' && (
                <>
                   <div className="text-lg font-bold text-gray-400 mb-1">成功逃脱</div>
                </>
              )}
           </div>
              {/* 返回按钮固定在底部，始终可见，不随内容滚动 */}
              <div className="flex-shrink-0 pt-2 border-t border-border/40">
                {phase === 'victory' && victoryStep === 'summary' && (
                  <>
                    <button
                      onClick={() => {
                        // 手动返回：青睐检测已在 victoryStep === 'summary' 的 useEffect 中执行
                        endBattle();
                      }}
                      className="w-full py-2.5 rounded-lg bg-cyan-900/30 text-cyan-200 border border-cyan-500/40 text-sm font-semibold hover:bg-cyan-800/50 transition-colors active:scale-95"
                    >
                      确定，返回
                    </button>
                  </>
                )}
                {phase === 'defeat' && (
                  <>
                    <button
                      onClick={() => endBattle()}
                      className="w-full py-2.5 rounded-lg bg-red-900/30 text-red-300 border border-red-500/40 text-sm font-semibold hover:bg-red-800/40 transition-colors active:scale-95"
                    >
                      确定，返回
                    </button>
                    <div className="text-[10px] text-muted-foreground text-center mt-1.5">即将自动返回...</div>
                  </>
                )}
                {phase === 'flee' && (
                  <>
                    <button
                      onClick={() => endBattle()}
                      className="w-full py-2.5 rounded-lg bg-card/60 text-muted-foreground border border-border/50 text-sm font-semibold hover:bg-card/80 hover:text-foreground transition-colors active:scale-95"
                    >
                      确定，返回
                    </button>
                    <div className="text-[10px] text-muted-foreground text-center mt-1.5">即将自动返回...</div>
                  </>
                )}
              </div>
           </div>
         )}

        {/* 进行中（intro/playerTurn/enemyTurn）的操作面板 - 始终渲染 */}
        {(phase === 'playerTurn' || phase === 'enemyTurn') && (
          <div className="space-y-2 md:space-y-3 max-w-4xl mx-auto w-full">
            {/* 双生武魂魂技切换Tab */}
            {isTwinSoul && (
              <div className="flex gap-1 mb-1">
                <button
                  onClick={() => setActiveSoulSkillTab(0)}
                  className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all border ${
                    activeSoulSkillTab === 0
                      ? 'bg-cyan-600/30 text-cyan-300 border-cyan-500/60'
                      : 'bg-transparent text-muted-foreground border-border/50 hover:bg-accent/30'
                  }`}
                >
                  一武 · {playerMartialSoul?.name || ''}
                </button>
                <button
                  onClick={() => setActiveSoulSkillTab(1)}
                  className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all border ${
                    activeSoulSkillTab === 1
                      ? 'bg-fuchsia-600/30 text-fuchsia-300 border-fuchsia-500/60'
                      : 'bg-transparent text-muted-foreground border-border/50 hover:bg-accent/30'
                  }`}
                >
                  二武 · {playerSecondSoul?.name || ''}
                </button>
              </div>
            )}

            {/* 第一武魂魂技（单武魂时直接显示，双生时按Tab显示） */}
            {(!isTwinSoul || activeSoulSkillTab === 0) && (
            <div>
              <div className="text-[10px] md:text-xs text-cyan-400/80 px-1 mb-1 md:mb-2 flex items-center gap-1 font-bold">
                  <span className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-cyan-400" />
                  第一武魂魂技 · {playerMartialSoul?.name || ''}
                  {skillBanTurns > 0 && (
                    <span className="ml-auto text-red-400 flex items-center gap-1">
                      <span>🔒</span>魂技封禁中（{skillBanTurns} 回合）
                    </span>
                  )}
                </div>
                <div className={`grid gap-1 md:gap-2 w-full ${hasDivineSkill ? 'grid-cols-5 sm:grid-cols-5 md:grid-cols-10' : 'grid-cols-5 sm:grid-cols-7 md:grid-cols-9'}`}>
                 {RING_ORDER.map((order, i) => {
                    const ring = playerSoulRings[i];
                    const color = ring ? RING_DISPLAY_COLOR[ring.color as keyof typeof RING_DISPLAY_COLOR] : undefined;
                    const isBlack = ring?.color === 'black';
                    // 🔴 修复：魂技名去掉「第X魂技·」前缀，避免与UI上的「第X魂技 · 」标签重复
                    const pureSkillName = ring?.skillName?.replace(/^第\d+魂技·/, '') || '';
                    const spCost = (i + 1) * 60;
                    let totalCost = spCost;
                     if (anyTrueBody) totalCost = Math.round(totalCost * 4);
                        if (domainActive) totalCost = Math.round(totalCost * 2);
                        if (secondDomainActive) totalCost = Math.round(totalCost * 2);
                     const spEnough = currentSoulPower >= totalCost;
                      const isTrueBodySlot = i === 6; // 主修第7魂技=武魂真身
                      const isDisabled = !ring || phase !== 'playerTurn' || !spEnough || isTrueBodySlot || skillBanTurns > 0;
                      const tipText = ring
                        ? isTrueBodySlot
                          ? `第${order}魂技 · 武魂真身（点击下方真身按钮开关）`
                          : skillBanTurns > 0
                            ? `魂技被封禁（还剩 ${skillBanTurns} 回合）`
                            : spEnough
                                ? `第${order}魂技 · ${pureSkillName}（消耗 ${totalCost} 魂力）`
                              : `魂力不足（需要 ${totalCost}）`
                        : `第${order}魂环（未获得）`;
                      return (
                        <button
                          key={`pri-${i}`}
                          onClick={() => ring && phase === 'playerTurn' && spEnough && !isTrueBodySlot && handleSkill(i, 0)}
                          disabled={isDisabled}
                          title={tipText}
                            className={`relative w-full h-9 md:h-12 rounded-lg md:rounded-xl border flex flex-col items-center justify-center transition-all text-[9px] md:text-xs leading-tight ${isBlack ? 'border-[3px]' : 'border-2'} ${
                             ring && phase === 'playerTurn' && spEnough
                               ? 'active:scale-95 cursor-pointer'
                               : 'opacity-50 cursor-not-allowed'
                          }`}
                          style={{
                            borderStyle: ring ? 'solid' : 'dashed',
                            borderColor: isBlack ? '#9ca3af' : (color ? `${color}` : 'var(--border)'),
                            backgroundColor: color ? `${color}18` : 'transparent',
                            boxShadow: isBlack ? `inset 0 0 6px rgba(255,255,255,0.25)` : (color ? `inset 0 0 4px ${color}40` : 'none'),
                          }}
                        >
                          {ring ? (
                            <>
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                                <SoulRing color={ring.color} years={ring.years} beastAttribute={ring.beastAttribute} size={28} animate={false} />
                              </div>
                              <div
                                className="w-full h-0.5 rounded-full mb-0.5"
                              style={{ backgroundColor: isBlack ? '#e5e7eb' : color, boxShadow: `0 0 4px ${isBlack ? '#d1d5db' : color}` }}
                            />
                                 <span className="truncate w-full text-center px-0.5 md:px-1 font-bold text-[10px] md:text-xs text-white drop-shadow">
                                   {isTrueBodySlot ? '武魂真身' : pureSkillName}
                                 </span>
                                <span className="text-[8px] md:text-[10px] font-bold text-white/90 mt-0.5 md:mt-1 tabular-nums drop-shadow">{order}魂 · {totalCost}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground/60 text-[9px]">{order}魂</span>
                        )}
                      </button>
                    );
                  })}
                   {/* 神技按钮：放在魂技区末尾 */}
                   {hasDivineSkill && artifactInfo && (
                     <button
                       onClick={handleDivineSkill}
                       disabled={phase !== 'playerTurn' || divineSkillCooldown > 0 || currentSoulPower < DIVINE_SKILL_COST}
                       title={divineSkillCooldown > 0 ? `神技冷却中（还剩 ${divineSkillCooldown} 回合）` : `神技 · ${artifactInfo.trial.divineSkillName}（消耗 ${DIVINE_SKILL_COST} 魂力）`}
                       className={`relative w-full h-9 md:h-12 rounded-lg md:rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all text-[9px] md:text-xs leading-tight ${
                         phase === 'playerTurn' && divineSkillCooldown === 0 && currentSoulPower >= DIVINE_SKILL_COST
                           ? 'active:scale-95 cursor-pointer'
                           : 'opacity-60 cursor-not-allowed'
                       }`}
                       style={{
                         borderStyle: 'solid',
                         borderColor: artifactInfo.trial.color,
                         background: `linear-gradient(135deg, ${artifactInfo.trial.color}33 0%, ${artifactInfo.trial.color}11 100%)`,
                         boxShadow: `0 0 10px ${artifactInfo.trial.color}66, inset 0 0 6px ${artifactInfo.trial.color}33`,
                       }}
                     >
                       <Zap className="w-3.5 h-3.5 md:w-4 md:h-4" style={{ color: artifactInfo.trial.color, filter: `drop-shadow(0 0 3px ${artifactInfo.trial.color})` }} />
                       <span className="text-[9px] md:text-[10px] font-bold text-white/90 drop-shadow mt-0.5 truncate w-full text-center px-0.5">
                         {divineSkillCooldown > 0 ? `冷却${divineSkillCooldown}回` : artifactInfo.trial.divineSkillName}
                       </span>
                       <span className="text-[8px] font-bold text-white/70 drop-shadow">神技 · {DIVINE_SKILL_COST}</span>
                     </button>
                   )}
                 </div>
            </div>
            )}

            {/* 第二武魂魂技（双生武魂时按Tab显示；显示全部9个槽位，有魂环显示魂技，无则显示空槽） */}
            {isTwinSoul && activeSoulSkillTab === 1 && (
              <div>
                 <div className="text-[10px] md:text-xs text-cyan-300/80 px-1 mb-1 md:mb-2 flex items-center gap-1 font-bold">
                   <span className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-cyan-400" />
                   第二武魂魂技 · {playerSecondSoul?.name || ''}
                 </div>
                  <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 gap-1 md:gap-2 w-full">
                   {RING_ORDER.map((order, i) => {
                     const ring = secondSoulRings[i];
                      const color = ring ? RING_DISPLAY_COLOR[ring.color as keyof typeof RING_DISPLAY_COLOR] : undefined;
                      const isBlack = ring?.color === 'black';
                      // 🔴 修复：魂技名去掉「第X魂技·」前缀，避免与UI上的「第X魂技 · 」标签重复
                      const pureSkillName = ring?.skillName?.replace(/^第\d+魂技·/, '') || '';
                       const spCost = (i + 1) * 60;
                       let totalCost = spCost;
                       if (anyTrueBody) totalCost = Math.round(totalCost * 4);
                        if (domainActive) totalCost = Math.round(totalCost * 2);
                        if (secondDomainActive) totalCost = Math.round(totalCost * 2);
                       const spEnough = currentSoulPower >= totalCost;
                       const isTrueBodySlot = i === 6;
                       const isDisabled = !ring || phase !== 'playerTurn' || !spEnough || isTrueBodySlot || skillBanTurns > 0;
                       const tipText = ring
                         ? isTrueBodySlot
                           ? `第${order}魂技 · 第二武魂真身（点击下方真身按钮开关）`
                           : skillBanTurns > 0
                             ? `魂技被封禁（还剩 ${skillBanTurns} 回合）`
                             : spEnough
                               ? `第${order}魂技 · ${pureSkillName}（消耗 ${totalCost} 魂力）`
                               : `魂力不足（需要 ${totalCost}）`
                         : `第${order}魂环（未获得）`;
                        return (
                          <button
                            key={`sec-${i}`}
                            onClick={() => ring && !isTrueBodySlot && phase === 'playerTurn' && spEnough && handleSkill(i, 1)}
                            disabled={isDisabled}
                           title={tipText}
                           className={`relative w-full h-9 md:h-12 rounded-lg md:rounded-xl border flex flex-col items-center justify-center transition-all text-[9px] md:text-[11px] leading-tight ${isBlack ? 'border-[3px]' : 'border-2'} ${
                              ring && phase === 'playerTurn' && spEnough
                                ? 'active:scale-95 cursor-pointer'
                                : 'opacity-50 cursor-not-allowed'
                           }`}
                           style={{
                             borderStyle: ring ? 'solid' : 'dashed',
                             borderColor: isBlack ? '#9ca3af' : (color ? `${color}` : 'var(--border)'),
                             backgroundColor: color ? `${color}18` : 'transparent',
                             boxShadow: isBlack ? `inset 0 0 6px rgba(255,255,255,0.25)` : (color ? `inset 0 0 4px ${color}40` : 'none'),
                           }}
                         >
                           {ring ? (
                             <>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                                  <SoulRing color={ring.color} years={ring.years} beastAttribute={ring.beastAttribute} size={28} animate={false} simpleMode />
                                </div>
                               <div
                                 className="w-full h-0.5 rounded-full mb-0.5"
                                style={{ backgroundColor: isBlack ? '#e5e7eb' : color, boxShadow: `0 0 4px ${isBlack ? '#d1d5db' : color}` }}
                              />
                               <span className="truncate w-full text-center px-0.5 md:px-1 font-bold text-[10px] md:text-xs text-white drop-shadow">
                                  {isTrueBodySlot ? '第二武魂真身' : pureSkillName}
                               </span>
                               <span className="text-[8px] md:text-[10px] font-bold text-white/90 mt-0.5 md:mt-1 tabular-nums drop-shadow">{order}魂 · {totalCost}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground/60 text-[9px]">{order}魂</span>
                          )}
                        </button>
                     );
                   })}
                 </div>
              </div>
            )}

            {/* 武魂真身按钮：双生对称2列，单生1列居中 */}
            {(playerSoulRings.length >= 7 || (isTwinSoul && secondSoulRings.length >= 7)) && (
               <div className={`grid gap-2 md:gap-3 mx-auto ${isTwinSoul && secondSoulRings.length >= 7 ? 'grid-cols-2 w-full max-w-md' : 'grid-cols-1 w-full max-w-[200px]'}`}>
              {playerSoulRings.length >= 7 && (
                <button
                   onClick={() => handleToggleTrueBody(0)}
                   disabled={phase !== 'playerTurn' || (trueBodyTurns === 0 && trueBodyCooldown > 0) || (trueBodyTurns === 0 && currentSoulPower < getTrueBodyCost())}
                   className={`h-8 md:h-10 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold flex items-center justify-center gap-0.5 md:gap-1 transition-all border
                    ${trueBodyTurns > 0
                      ? 'bg-gradient-to-r from-cyan-600 to-cyan-400 text-white border-cyan-300 shadow-md shadow-cyan-500/30 animate-pulse'
                      : 'bg-gradient-to-r from-cyan-100 to-yellow-100 text-cyan-200 border-cyan-300/50 hover:from-cyan-200 hover:to-yellow-200'}
                    ${phase !== 'playerTurn' || (trueBodyTurns === 0 && (trueBodyCooldown > 0 || currentSoulPower < getTrueBodyCost())) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span>🌟</span>
                  {trueBodyTurns > 0
                    ? `关一武真身（${trueBodyTurns}回）`
                    : trueBodyCooldown > 0
                      ? `一武冷却${trueBodyCooldown}回`
                      : '开一武魂真身'}
                </button>
              )}
              {isTwinSoul && secondSoulRings.length >= 7 && (
                <button
                   onClick={() => handleToggleTrueBody(1)}
                   disabled={phase !== 'playerTurn' || (secondTrueBodyTurns === 0 && secondTrueBodyCooldown > 0) || (secondTrueBodyTurns === 0 && currentSoulPower < getTrueBodyCost())}
                   className={`h-8 md:h-10 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold flex items-center justify-center gap-0.5 md:gap-1 transition-all border
                    ${secondTrueBodyTurns > 0
                      ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white border-cyan-300 shadow-md shadow-cyan-500/30 animate-pulse'
                      : 'bg-gradient-to-r from-cyan-600/20 to-fuchsia-600/20 text-cyan-200 border-cyan-500/50 hover:from-cyan-600/30 hover:to-fuchsia-600/30'}
                     ${phase !== 'playerTurn' || (secondTrueBodyTurns === 0 && (secondTrueBodyCooldown > 0 || currentSoulPower < getTrueBodyCost())) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span>🌟</span>
                  {secondTrueBodyTurns > 0
                    ? `关二武真身（${secondTrueBodyTurns}回）`
                    : secondTrueBodyCooldown > 0
                      ? `二武冷却${secondTrueBodyCooldown}回`
                      : '开二武魂真身'}
                </button>
              )}
            </div>
            )}

            {/* 🔴 v22.0 自动战斗控制条 */}
            <div className="flex items-center justify-between gap-2 w-full mb-1">
              <button
                onClick={() => setAutoBattle(v => !v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                  ${autoBattle
                    ? 'bg-emerald-500/80 text-white border-emerald-400 shadow-md shadow-emerald-500/30'
                    : 'bg-muted/50 text-muted-foreground border-border/60 hover:bg-muted'}`}
              >
                {autoBattle ? '⏸ 自动战斗中' : '▶ 自动战斗'}
              </button>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">倍速</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => (
                    <button
                      key={s}
                      onClick={() => setBattleSpeed(s)}
                      className={`w-5 h-5 text-[10px] rounded transition-all
                        ${battleSpeed === s
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'bg-muted/40 text-muted-foreground hover:bg-muted'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {dragonProgress(player).equipped && armorTier(player)>=3 && <div className="mb-2 rounded-xl border border-cyan-500/30 p-3 bg-cyan-950/30" data-armor-domain><div className="text-xs text-cyan-300 mb-2">{armorDomainRef.current.turns?'斗铠领域·'+ARMOR_DOMAIN_NAMES[armorDomainRef.current.style]+'：剩余 '+armorDomainRef.current.turns+' 次行动':ARMOR_DOMAIN_EFFECTS[dragonProgress(player).style]}</div><button className="w-full rounded-lg p-3 border border-cyan-500/40 text-cyan-200 disabled:opacity-40" disabled={phase!=='playerTurn'||armorDomainRef.current.used||domainActive||secondDomainActive||currentSoulPower<Math.ceil(attrs.maxSoulPower*.15)} onClick={()=>{
 if(phase!=='playerTurn'||actionLockRef.current||battleEndedRef.current||!__fbSkillAllowed())return;
 const r=startArmorDomain(player,armorDomainRef.current,currentSoulPower,attrs.maxSoulPower,domainActive||secondDomainActive);if(r.reason){toast.info(r.reason);return;}
 actionLockRef.current=true;setCurrentSoulPower(v=>Math.max(0,v-r.cost));__armorCommit(r.state);addLog('展开斗铠领域·'+ARMOR_DOMAIN_NAMES[r.state.style]+'，持续后续3次己方行动，本次不追加普攻。','skill');scheduleEnemyAction(600);
 }}>斗铠领域 · {armorDomainRef.current.used?'本场已使用':'魂力 '+Math.ceil(attrs.maxSoulPower*.15)}</button></div>}
            {dragonProgress(player).equipped && armorTier(player)>=2 && <button className="w-full mb-2 p-3 rounded-lg border border-cyan-500/30 text-cyan-200 bg-cyan-950/30 disabled:opacity-40" disabled={phase!=='playerTurn'||!!(battleState?.meta as any)?.armorUsed||currentSoulPower<Math.ceil(attrs.maxSoulPower*.1)} onClick={()=>{
                if(phase!=='playerTurn'||actionLockRef.current||!__fbSkillAllowed()||(battleState?.meta as any)?.armorUsed)return;
                const cost=Math.ceil(attrs.maxSoulPower*.1);if(currentSoulPower<cost)return;
                actionLockRef.current=true;setCurrentSoulPower(v=>Math.max(0,v-cost));
                setPlayerHp(v=>Math.min(attrs.hp,v+Math.floor(attrs.hp*.03)));
                setBattleState(prev=>prev?({...prev,meta:{...prev.meta,armorUsed:true}} as any):prev);
                addLog('斗铠振奋：恢复最大气血3%，本次行动结束。','skill');scheduleEnemyAction(600);
              }}>斗铠振奋 · 每场一次 · 魂力 {Math.ceil(attrs.maxSoulPower*.1)}</button>}
            {/* 操作按钮行：固定4列对称布局 — 普攻 / 领域 / 二领域 / 逃跑 */}
            <div className="grid grid-cols-4 gap-2 md:gap-3 w-full">
               <ActionButton
                 icon={Sword}
                 label={artifactInfo ? artifactInfo.artifact.name : '普通攻击'}
                 onClick={handleAttack}
                 color={artifactInfo ? '' : 'from-red-500 to-orange-500'}
                 style={artifactInfo ? {
                   background: `linear-gradient(135deg, ${artifactInfo.trial.color} 0%, ${artifactInfo.trial.color}dd 100%)`,
                   boxShadow: `0 2px 10px ${artifactInfo.trial.color}66`,
                 } : undefined}
                 disabled={phase !== 'playerTurn'}
               />

               {/* 领域按钮 */}
               {hasDomain ? (
                 <button
                   onClick={handleToggleDomain}
                   disabled={phase !== 'playerTurn' || domainAnimating}
                   className={`relative h-12 md:h-14 rounded-lg md:rounded-xl font-bold text-[11px] md:text-xs transition-all active:scale-[0.97] overflow-hidden ${domainActive ? 'ring-2' : ''} ${phase !== 'playerTurn' || domainAnimating ? 'opacity-50 cursor-not-allowed' : ''}`}
                   style={{
                     background: domainActive
                       ? `linear-gradient(135deg, ${domainColor?.primary || '#fbbf24'} 0%, ${domainColor?.secondary || '#f59e0b'} 100%)`
                       : `linear-gradient(135deg, ${domainColor?.primary || '#fbbf24'}20, ${domainColor?.secondary || '#f59e0b'}15)`,
                     borderColor: domainColor?.primary || '#fbbf24',
                     color: domainActive ? '#fff' : (domainColor?.primary || '#fbbf24'),
                     borderWidth: '2px',
                     borderStyle: 'solid',
                     textShadow: domainActive ? '0 1px 2px rgba(0,0,0,0.4)' : 'none',
                     boxShadow: domainActive ? `0 0 16px ${domainColor?.glow || '#fbbf24'}80` : 'none',
                   }}
                 >
                   <div className="flex flex-col items-center justify-center gap-0.5">
                     <Sparkles className="w-3.5 h-3.5" />
                     <span className="text-[10px] md:text-xs font-medium">{domainActive ? '关领域' : '开领域'}</span>
                   </div>
                 </button>
               ) : (
                 <div className="h-12 md:h-14 rounded-lg md:rounded-xl border-2 border-dashed border-border/40 flex flex-col items-center justify-center text-muted-foreground/40">
                   <Sparkles className="w-3.5 h-3.5 opacity-40" />
                   <span className="text-[10px] md:text-xs opacity-50">暂无领域</span>
                 </div>
               )}

               {/* 二领域按钮 */}
               {hasSecondDomain ? (
                 <button
                   onClick={handleToggleSecondDomain}
                   disabled={phase !== 'playerTurn' || secondDomainAnimating}
                   className={`relative h-12 md:h-14 rounded-lg md:rounded-xl font-bold text-[11px] md:text-xs transition-all active:scale-[0.97] overflow-hidden ${secondDomainActive ? 'ring-2' : ''} ${phase !== 'playerTurn' || secondDomainAnimating ? 'opacity-50 cursor-not-allowed' : ''}`}
                   style={{
                     background: secondDomainActive
                       ? `linear-gradient(135deg, ${secondDomainColor?.primary || '#60a5fa'} 0%, ${secondDomainColor?.secondary || '#3b82f6'} 100%)`
                       : `linear-gradient(135deg, ${secondDomainColor?.primary || '#60a5fa'}20, ${secondDomainColor?.secondary || '#3b82f6'}15)`,
                     borderColor: secondDomainColor?.primary || '#60a5fa',
                     color: secondDomainActive ? '#fff' : (secondDomainColor?.primary || '#60a5fa'),
                     borderWidth: '2px',
                     borderStyle: 'solid',
                     textShadow: secondDomainActive ? '0 1px 2px rgba(0,0,0,0.4)' : 'none',
                     boxShadow: secondDomainActive ? `0 0 16px ${secondDomainColor?.glow || '#60a5fa'}80` : 'none',
                   }}
                 >
                   <div className="flex flex-col items-center justify-center gap-0.5">
                     <Sparkles className="w-3.5 h-3.5" />
                     <span className="text-[10px] md:text-xs font-medium">{secondDomainActive ? '关二领域' : '开二领域'}</span>
                   </div>
                 </button>
               ) : (
                 <div className="h-12 md:h-14 rounded-lg md:rounded-xl border-2 border-dashed border-border/40 flex flex-col items-center justify-center text-muted-foreground/40">
                   <Sparkles className="w-3.5 h-3.5 opacity-40" />
                   <span className="text-[10px] md:text-xs opacity-50">暂无二领域</span>
                 </div>
               )}

               <ActionButton
                 icon={Heart}
                 label="逃跑"
                 onClick={handleFlee}
                 color="from-gray-500 to-slate-600"
                 disabled={phase !== 'playerTurn'}
               />
             </div>

            {/* 回合状态提示 */}
            <div className="text-center text-[10px] md:text-xs mt-0.5 md:mt-1">
              {phase === 'playerTurn' && <span className="text-cyan-300/80">你的回合 — 选择行动</span>}
              {phase === 'enemyTurn' && (
                <span className="inline-flex items-center gap-1.5 text-red-300/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  敌方行动中...
                </span>
              )}
            </div>
          </div>
        )}

      {/* 领域开启全屏动画 */}
      <AnimatePresence>
        {domainAnimating && domainColor && player?.domain && (
          <motion.div
            key="domain-animation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${domainColor.glow} 0%, ${domainColor.secondary}cc 40%, rgba(0,0,0,0.85) 80%)`,
            }}
          >
             {/* 外层扩散光环 */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1.1], opacity: [0, 0.8, 0.6] }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute rounded-full will-change-transform"
              style={{
                width: 'min(90vw, 600px)',
                height: 'min(90vw, 600px)',
                background: `radial-gradient(circle, transparent 40%, ${domainColor.primary}66 60%, transparent 80%)`,
                boxShadow: `0 0 120px ${domainColor.glow}, inset 0 0 80px ${domainColor.glow}`,
                border: `2px solid ${domainColor.primary}`,
              }}
            />
            {/* 中层光环 */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 0.9, 0.8], opacity: [0, 1, 0.8] }}
              transition={{ duration: 0.7, delay: 0.08, ease: 'easeOut' }}
              className="absolute rounded-full will-change-transform"
              style={{
                width: 'min(70vw, 460px)',
                height: 'min(70vw, 460px)',
                border: `3px solid ${domainColor.primary}`,
                boxShadow: `0 0 60px ${domainColor.glow}, inset 0 0 40px ${domainColor.primary}55`,
              }}
            />
            {/* 内层快速旋转光环（使用CSS动画，减少JS开销） */}
            <div
              className="absolute rounded-full domain-inner-ring will-change-transform"
              style={{
                width: 'min(55vw, 360px)',
                height: 'min(55vw, 360px)',
                border: `2px dashed ${domainColor.primary}`,
                animation: 'domain-spin 2.5s linear infinite',
                opacity: 0.8,
              }}
            />
            {/* 中央文字 */}
            <div className="relative z-10 text-center px-6">
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                className="text-xs md:text-sm tracking-[0.5em] mb-2"
                style={{ color: domainColor.primary, textShadow: `0 0 20px ${domainColor.glow}` }}
              >
                领 域 展 开
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl md:text-6xl font-bold"
                style={{
                  color: '#fff',
                  textShadow: `0 0 30px ${domainColor.primary}, 0 0 60px ${domainColor.glow}, 0 4px 20px rgba(0,0,0,0.8)`,
                  fontFamily: "'Noto Serif SC', 'Songti SC', serif",
                  letterSpacing: '0.1em',
                }}
              >
                {player.domain?.name || '领域'}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
                className="mx-auto mt-4 h-px w-32 md:w-48"
                style={{
                  background: `linear-gradient(90deg, transparent, ${domainColor.primary}, transparent)`,
                  boxShadow: `0 0 10px ${domainColor.glow}`,
                }}
              />
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="mt-3 text-sm md:text-base text-white/80"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
              >
                {player.name}
              </motion.div>
            </div>
            {/* 粒子光点（减少数量以优化性能） */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], y: [-10, -100, -180], scale: [0, 1, 0.5] }}
                transition={{
                  duration: 0.8,
                  delay: 0.08 + i * 0.06,
                  ease: 'easeOut',
                }}
                className="absolute rounded-full will-change-transform"
                style={{
                  width: 4 + (i % 3) * 2,
                  height: 4 + (i % 3) * 2,
                  left: `${20 + (i * 8) % 60}%`,
                  top: '60%',
                  background: domainColor.primary,
                  boxShadow: `0 0 8px ${domainColor.primary}`,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 第二领域开启全屏动画 */}
      <AnimatePresence>
        {secondDomainAnimating && secondDomainColor && player?.secondDomain && (
          <motion.div
            key="second-domain-animation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${secondDomainColor.glow} 0%, ${secondDomainColor.secondary}cc 40%, rgba(0,0,0,0.85) 80%)`,
            }}
          >
              {/* 外层扩散光环（居中，与第一领域通过反向旋转+光效区分） */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1.1], opacity: [0, 0.8, 0.6] }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
               className="absolute rounded-full will-change-transform"
              style={{
                width: 'min(90vw, 600px)',
                height: 'min(90vw, 600px)',
                background: `radial-gradient(circle, transparent 40%, ${secondDomainColor.primary}66 60%, transparent 80%)`,
                boxShadow: `0 0 120px ${secondDomainColor.glow}, inset 0 0 80px ${secondDomainColor.glow}`,
                border: `2px solid ${secondDomainColor.primary}`,
              }}
            />
            {/* 中层光环（居中，反向扩散节奏区分第一领域） */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 0.9, 0.8], opacity: [0, 1, 0.8] }}
              transition={{ duration: 0.7, delay: 0.08, ease: 'easeOut' }}
               className="absolute rounded-full will-change-transform"
              style={{
                width: 'min(70vw, 460px)',
                height: 'min(70vw, 460px)',
                border: `3px solid ${secondDomainColor.primary}`,
                boxShadow: `0 0 60px ${secondDomainColor.glow}, inset 0 0 40px ${secondDomainColor.primary}55`,
              }}
            />
            {/* 内层反向旋转光环（与第一领域方向相反，视觉区分） */}
            <div
              className="absolute rounded-full domain-inner-ring will-change-transform"
              style={{
                width: 'min(55vw, 360px)',
                height: 'min(55vw, 360px)',
                border: `2px dashed ${secondDomainColor.primary}`,
                animation: 'domain-spin 3s linear infinite reverse',
                opacity: 0.8,
              }}
            />
            {/* 中央文字 */}
             <div className="relative z-10 text-center px-6">
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                className="text-xs md:text-sm tracking-[0.5em] mb-2"
                style={{ color: secondDomainColor.primary, textShadow: `0 0 20px ${secondDomainColor.glow}` }}
              >
                第 二 领 域
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="text-3xl md:text-5xl font-bold"
                style={{
                  color: '#fff',
                  textShadow: `0 0 30px ${secondDomainColor.primary}, 0 0 60px ${secondDomainColor.glow}, 0 4px 20px rgba(0,0,0,0.8)`,
                  fontFamily: "'Noto Serif SC', 'Songti SC', serif",
                  letterSpacing: '0.1em',
                }}
              >
                {player.secondDomain?.name || '第二领域'}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
                className="mx-auto mt-4 h-px w-32 md:w-48"
                style={{
                  background: `linear-gradient(90deg, transparent, ${secondDomainColor.primary}, transparent)`,
                  boxShadow: `0 0 10px ${secondDomainColor.glow}`,
                }}
              />
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="mt-3 text-sm md:text-base text-white/80"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
              >
                {player.name}
              </motion.div>
            </div>
            {/* 粒子光点（与第一领域方向相反，从另一侧升起） */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={`sec-${i}`}
                initial={{ opacity: 0, y: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], y: [-10, -100, -180], scale: [0, 1, 0.5] }}
                transition={{
                  duration: 0.8,
                  delay: 0.08 + i * 0.06,
                  ease: 'easeOut',
                }}
                className="absolute rounded-full will-change-transform"
                style={{
                  width: 4 + (i % 3) * 2,
                  height: 4 + (i % 3) * 2,
                  right: `${20 + (i * 8) % 60}%`,
                  top: '60%',
                  background: secondDomainColor.primary,
                  boxShadow: `0 0 8px ${secondDomainColor.primary}`,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      </div>

    </div>
  );
});

// ============================================================
// 操作按钮组件
// ============================================================
interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  color?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  color,
  style,
  disabled,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-0.5 md:gap-1 py-1.5 md:py-2.5 rounded-lg md:rounded-xl font-medium text-white transition-transform active:scale-[0.97] ${
        disabled
          ? 'opacity-40 cursor-not-allowed bg-muted'
          : color
            ? `bg-gradient-to-br ${color} shadow-md hover:brightness-110`
            : 'shadow-md hover:brightness-110'
      }`}
      style={{
        minHeight: '48px',
        boxShadow: disabled ? 'none' : undefined,
        ...style,
      }}
    >
      <Icon className="h-4 md:h-5 w-4 md:w-5" />
      <span className="text-[10px] md:text-sm font-medium max-w-full truncate px-1 leading-tight text-center w-full">{label}</span>
    </button>
  );
}

// 格式化物品属性加成简要描述（用于奖励弹窗等场景快速预览）
function formatItemAttrBonus(attrs: NonNullable<IItem['attributes']>): string {
  const parts: string[] = [];
  if (attrs.allAttr) parts.push(`全属性+${attrs.allAttr}%`);
  if (attrs.attack) parts.push(`攻击+${attrs.attack}`);
  if (attrs.defense) parts.push(`防御+${attrs.defense}`);
  if (attrs.speed) parts.push(`速度+${attrs.speed}`);
  if (attrs.spirit) parts.push(`精神+${attrs.spirit}`);
  if (attrs.hp) parts.push(`气血+${attrs.hp}`);
  if (attrs.critRate) parts.push(`暴击+${attrs.critRate}%`);
  if (attrs.critDmg) parts.push(`爆伤+${attrs.critDmg}%`);
  return parts.slice(0, 3).join(' · ');
}
