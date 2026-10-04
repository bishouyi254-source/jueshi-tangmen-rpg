import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useGame, rollTwinSouls, rollTwinSoulPower, QUALITY_LABEL, QUALITY_COLOR, getExtremeInfo, calcAttributes } from '@/lib/gameStore';
import { logger } from '@lark-apaas/client-toolkit-lite';
import type { IMartialSoul } from '@/data/martialsouls';
import { toast } from 'sonner';
import SoulRing from '@/components/SoulRing';
import StarryBackground from '@/components/StarryBackground';
import LoadingScreen from '@/components/LoadingScreen';
import { CloudAccountPanel } from '@/components/CloudAccount';
import { Image } from '@/components/ui/image';

type Step = 'titleScreen' | 'nameInput' | 'awakening' | 'soulResult' | 'powerAwakening' | 'powerResult';

 export default function StartPage() {
    const { loading, player, createPlayer, hasSave, loadSave } = useGame();
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('titleScreen');
    const [showIntroLoading, setShowIntroLoading] = useState(true); // 首次进入显示加载界面
    const [name, setName] = useState('');
    const [showCloud,setShowCloud]=useState(false);
  const [soul, setSoul] = useState<IMartialSoul | null>(null);
  const [secondSoul, setSecondSoul] = useState<IMartialSoul | null>(null);
  const [isTwinSoul, setIsTwinSoul] = useState(false);
  const [direction, setDirection] = useState('强攻系');
  // 主修/次修选择：0=主修, 1=次修；primaryIndex表示哪个是主修（0或1）
  // null=未选
  const [primaryIndex, setPrimaryIndex] = useState<0 | 1 | null>(null);
   const [soulPower, setSoulPower] = useState(0);
     const [displayPower, setDisplayPower] = useState(0);
     
     // 定时器引用：组件卸载时清理，防止动画卡死
     const awakenTimerRef = useRef<number | null>(null);
     const powerIntervalRef = useRef<number | null>(null);
     const powerTimeoutRef = useRef<number | null>(null);
     const rerollTimerRef = useRef<number | null>(null);
     // 觉醒超时保护：5秒内动画未完成自动跳过到结果页
     const awakenTimeoutRef = useRef<number | null>(null);
     
     // 清理所有定时器
     const clearAllTimers = useCallback(() => {
       if (awakenTimerRef.current) { clearTimeout(awakenTimerRef.current); awakenTimerRef.current = null; }
       if (powerIntervalRef.current) { clearInterval(powerIntervalRef.current); powerIntervalRef.current = null; }
       if (powerTimeoutRef.current) { clearTimeout(powerTimeoutRef.current); powerTimeoutRef.current = null; }
       if (rerollTimerRef.current) { clearTimeout(rerollTimerRef.current); rerollTimerRef.current = null; }
       if (awakenTimeoutRef.current) { clearTimeout(awakenTimeoutRef.current); awakenTimeoutRef.current = null; }
     }, []);
     
     // 组件卸载时清理所有定时器
     useEffect(() => {
       return () => clearAllTimers();
     }, [clearAllTimers]);

    // 有玩家数据时直接进游戏
    useEffect(() => {
      if (player) {
        navigate('/game', { replace: true });
      }
    }, [player, navigate]);

    // 初始化：loading 结束后展示标题画面，有存档显示"继续游戏"，无存档显示"进入游戏"
    // 不再自动加载存档，需玩家点击按钮进入
    useEffect(() => {
      if (loading) return;
      // 停留在标题画面，等待玩家点击进入
    }, [loading, hasSave, loadSave]);

    // 点击进入世界：有存档→加载存档进游戏，无存档→进入武魂觉醒流程
    const handleEnterWorld = useCallback(() => {
      if (hasSave) {
        try {
          loadSave();
          // player 变化后由另一个 effect 接管跳转
        } catch (err) {
          toast.error('存档加载失败');
          logger.error('loadSave failed:', String(err));
        }
      } else {
        setStep('nameInput');
      }
    }, [hasSave, loadSave]);

  // 觉醒武魂（点击魂球触发）
  const awakenSoul = useCallback(() => {
    if (!name.trim()) {
      toast('请输入角色名字');
      return;
    }
    const { primary, secondary, isTwin } = rollTwinSouls();
    setSoul(primary);
    setSecondSoul(secondary);
    setIsTwinSoul(isTwin);
    setPrimaryIndex(isTwin ? null : 0); // 单生武魂默认主武魂0
    setStep('awakening');
    // 0.3秒快速闪现
    if (awakenTimerRef.current) clearTimeout(awakenTimerRef.current);
    awakenTimerRef.current = window.setTimeout(() => {
      awakenTimerRef.current = null;
      if (awakenTimeoutRef.current) { clearTimeout(awakenTimeoutRef.current); awakenTimeoutRef.current = null; }
      setStep('soulResult');
    }, 300);
    // 超时保护：5秒后强制跳到结果页，防止动画卡死
    if (awakenTimeoutRef.current) clearTimeout(awakenTimeoutRef.current);
    awakenTimeoutRef.current = window.setTimeout(() => {
      awakenTimeoutRef.current = null;
      logger.warn('觉醒动画超时，自动跳过到结果页');
      if (awakenTimerRef.current) { clearTimeout(awakenTimerRef.current); awakenTimerRef.current = null; }
      setStep('soulResult');
    }, 5000);
  }, [name]);

  // 选择主修武魂
  const handleSelectPrimary = useCallback((index: 0 | 1) => {
    if (!isTwinSoul) return;
    setPrimaryIndex((prev) => {
      if (prev === index) {
        // 取消选择：如果取消的是主修，次修自动转主修
        // 这里简化：再点一次取消主修，变成未选状态
        return null;
      }
      return index;
    });
  }, [isTwinSoul]);

  // 先天魂力觉醒
  const awakenPower = useCallback(() => {
    if (!soul) return;
    // 双生武魂必须先选主修
    if (isTwinSoul && primaryIndex === null) {
      toast('请先选择主修武魂和次修武魂');
      return;
    }
    const primarySoul = primaryIndex === 1 && secondSoul ? secondSoul : soul;
    const secondarySoul = primaryIndex === 0 ? secondSoul : (primaryIndex === 1 ? soul : null);
    const power = rollTwinSoulPower(primarySoul, secondarySoul);
    setSoulPower(power);
    setDisplayPower(0);
    setStep('powerAwakening');

    // 数字跳动动画
    let cur = 0;
    const duration = power >= 10
      ? 200  // 满魂力短动画
      : 500;
    const totalFrames = 20;
    const intervalMs = duration / totalFrames;

    // 清理之前的定时器
    if (powerIntervalRef.current) { clearInterval(powerIntervalRef.current); powerIntervalRef.current = null; }
    if (powerTimeoutRef.current) { clearTimeout(powerTimeoutRef.current); powerTimeoutRef.current = null; }
    if (awakenTimeoutRef.current) { clearTimeout(awakenTimeoutRef.current); awakenTimeoutRef.current = null; }

    const finishPower = () => {
      if (powerIntervalRef.current) { clearInterval(powerIntervalRef.current); powerIntervalRef.current = null; }
      if (awakenTimeoutRef.current) { clearTimeout(awakenTimeoutRef.current); awakenTimeoutRef.current = null; }
      setDisplayPower(power);
      setStep('powerResult');
    };

    powerIntervalRef.current = window.setInterval(() => {
      cur = Math.min(cur + 1, power);
      setDisplayPower(cur);
      if (cur >= power) {
        if (powerIntervalRef.current) { clearInterval(powerIntervalRef.current); powerIntervalRef.current = null; }
        powerTimeoutRef.current = window.setTimeout(finishPower, 400);
      }
    }, intervalMs);

    // 超时保护：5秒后强制完成，防止卡死
    awakenTimeoutRef.current = window.setTimeout(() => {
      awakenTimeoutRef.current = null;
      logger.warn('魂力觉醒动画超时，强制完成');
      finishPower();
    }, 5000);
  }, [soul, isTwinSoul, primaryIndex, secondSoul]);

  const enterGame = useCallback(() => {
    if (!soul) return;
    // 确定主修/次修
    const primarySoul = primaryIndex === 1 && secondSoul ? secondSoul : soul;
    const secondarySoul = primaryIndex === 0 ? secondSoul : (primaryIndex === 1 ? soul : null);
    try {
      createPlayer(name.trim(), direction, primarySoul, soulPower, isTwinSoul ? secondarySoul : null);
      navigate('/game', { replace: true });
    } catch (err) {
      toast.error('进入游戏失败，请重试');
      logger.error('enterGame failed:', String(err));
    }
  }, [name, soul, secondSoul, soulPower, createPlayer, navigate, isTwinSoul, primaryIndex]);

  if (loading || showIntroLoading) {
    return <LoadingScreen onEnter={() => setShowIntroLoading(false)} hasSave={hasSave} />;
  }

  const qualityColor = (q: string) => {
    const c = QUALITY_COLOR[q];
    return (c as string) || '#fde68a';
  };

  const qualityGlow = (q: string) => {
    const c = qualityColor(q);
    return `${c}99`;
  };

  return (
    <div className="relative min-h-screen overflow-y-auto text-foreground">
      {/* 标题画面背景：手机端双人竖版，电脑端横版 */}
      {step === 'titleScreen' && (
        <>
          <div className="md:hidden absolute inset-0 z-0">
            <Image
              src="https://aka.doubaocdn.com/s/rjxbTYddYN"
              alt="斗罗大陆"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />
          </div>
          <div className="hidden md:block absolute inset-0 z-0">
            <Image
              src="https://aka.doubaocdn.com/s/lx5gLTcMH7"
              alt="斗罗大陆"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/60" />
          </div>
        </>
      )}
      {step !== 'titleScreen' && <StarryBackground />}

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <AnimatePresence mode="wait">

          {/* 标题画面 */}
          {step === 'titleScreen' && (
            <motion.div
              key="title-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full flex flex-col items-center justify-between text-center"
              style={{ minHeight: 'calc(100vh - 4rem)' }}
            >
              {/* 顶部标题 */}
              <div className="pt-8 md:pt-12 text-center">
                <h1 className="text-4xl md:text-6xl font-bold tracking-wider mb-1 bg-gradient-to-b from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-lg">
                  斗罗大陆
                </h1>
                <h2 className="text-xl md:text-2xl font-semibold mb-1 text-amber-100/90 tracking-[0.3em]">
                  绝世唐门
                </h2>
                <p className="text-sm text-amber-100/70 mb-2 tracking-wide">
                  创作者·白山茶
                </p>
                <p className="text-xs text-amber-100/50 tracking-widest">
                  SOUL LAND II
                </p>
              </div>

              {/* 底部按钮 */}
              {showCloud && <div className="fixed inset-0 z-50 bg-black/80 overflow-y-auto p-4"><div className="max-w-md mx-auto py-6"><button className="mb-3 text-cyan-200" onClick={()=>setShowCloud(false)}>返回游戏首页</button><CloudAccountPanel /></div></div>}
              <div className="pb-12 md:pb-16 flex flex-col items-center">
                <button className="text-sm text-cyan-200 mb-4" onClick={()=>setShowCloud(!showCloud)}>账号登录 / 云存档</button>
                <button
                  onClick={handleEnterWorld}
                  className="group relative px-12 py-3 rounded-full bg-amber-950/20 backdrop-blur-sm border border-amber-400/40 hover:bg-amber-950/30 hover:border-amber-400/60 text-amber-100 font-semibold text-lg shadow-lg shadow-black/20 transition-all hover:scale-105 active:scale-95"
                >
                  <span className="flex items-center gap-2">
                    {hasSave ? '继续游戏' : '进入世界'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                {hasSave && (
                  <p className="mt-3 text-xs text-amber-100/50">检测到存档，点击继续你的冒险</p>
                )}
              </div>
            </motion.div>
          )}

          {/* 输入名字 + 魂球觉醒 */}
          {step === 'nameInput' && (
            <motion.div
              key="name-input"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-md text-center"
            >
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-300 to-cyan-200 bg-clip-text text-transparent">
                武魂觉醒
              </h2>

              {/* 名字输入 */}
              <div className="mb-6">
                <label className="block text-sm text-muted-foreground mb-2">角色姓名</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入角色姓名"
                  maxLength={12}
                  className="w-full px-4 py-3 rounded-xl border border-border/60 bg-card/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition-all text-center text-lg"
                />
              </div>

              {/* 魂球（点击觉醒） */}
              <div className="relative h-56 flex items-center justify-center mb-8">
                <motion.button
                  onClick={awakenSoul}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative w-40 h-40 rounded-full outline-none focus-visible:ring-4 focus-visible:ring-cyan-500/40"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), rgba(251,191,36,0.3) 30%, rgba(168,85,247,0.2) 60%, rgba(15,23,42,0.8) 100%)',
                    boxShadow: '0 0 60px rgba(251,191,36,0.3), inset 0 0 40px rgba(251,191,36,0.2), inset 0 0 80px rgba(168,85,247,0.15)',
                    border: '2px solid rgba(251,191,36,0.4)',
                  }}
                >
                  {/* 内部光芒 */}
                  <motion.div
                    className="absolute inset-4 rounded-full"
                    animate={{ scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      background: 'radial-gradient(circle, rgba(255,255,255,0.5), rgba(251,191,36,0.2) 50%, transparent 70%)',
                    }}
                  />
                  {/* 外圈旋转光环 */}
                  <motion.div
                    className="absolute inset-[-8px] rounded-full border-2 border-cyan-400/30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    style={{
                      boxShadow: '0 0 20px rgba(251,191,36,0.2)',
                      clipPath: 'polygon(50% 0, 55% 5%, 50% 10%, 45% 5%)',
                    }}
                  />
                  <span className="relative z-10 text-sm font-bold text-cyan-100/90">
                    点击觉醒
                  </span>
                </motion.button>
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                点击上方魂球，觉醒你的专属武魂
              </p>

            </motion.div>
          )}

          {/* 觉醒动画（0.3秒闪现） */}
          {step === 'awakening' && soul && (
            <motion.div
              key="awakening"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md flex flex-col items-center justify-center min-h-[60vh]"
            >
              <QuickAwakeningFlash quality={soul.quality} />
            </motion.div>
          )}

          {/* 武魂结果 */}
          {step === 'soulResult' && soul && (
            <motion.div
              key="soul-result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-md text-center"
            >
              <div className="text-xs text-muted-foreground mb-2">
                {isTwinSoul ? '觉醒成功！罕见的双生武魂！' : '觉醒成功！'}
              </div>

              {isTwinSoul ? (
                <div className="mb-6">
                  <div className="text-sm text-cyan-300 font-bold mb-4">选择你的主修武魂</div>
                  <div className="flex gap-3 justify-center items-stretch">
                    {[soul, secondSoul].map((s, idx) => {
                      if (!s) return null;
                      const isPrimary = primaryIndex === idx;
                      const isSecondary = primaryIndex !== null && primaryIndex !== idx;
                      return (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleSelectPrimary(idx as 0 | 1)}
                          className={`relative flex-1 max-w-[150px] p-3 rounded-xl border-2 transition-all ${
                            isPrimary
                              ? 'bg-gradient-to-b from-cyan-500/20 to-cyan-600/10'
                              : isSecondary
                                ? 'bg-gradient-to-b from-cyan-500/15 to-cyan-600/10'
                                : 'bg-card/30 hover:bg-card/50'
                          }`}
                          style={{
                            borderColor: isPrimary
                              ? '#fbbf24'
                              : isSecondary
                                ? '#a855f7'
                                : `${qualityColor(s.quality)}50`,
                            boxShadow: isPrimary
                              ? `0 0 24px ${qualityGlow(s.quality)}60`
                              : isSecondary
                                ? `0 0 16px #a855f740`
                                : 'none',
                          }}
                        >
                          {/* 主修/次修标签 */}
                          {isPrimary && (
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500 text-white whitespace-nowrap z-10">
                              主修武魂
                            </div>
                          )}
                          {isSecondary && (
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500 text-white whitespace-nowrap z-10">
                              次修武魂
                            </div>
                          )}
                          <div
                            className="text-xs font-bold mb-1"
                            style={{
                              color: qualityColor(s.quality),
                              ...(s.quality === 'superDivine' ? {
                                background: 'linear-gradient(135deg, #fcd34d, #f87171, #c084fc, #60a5fa)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                              } : {}),
                            }}
                          >
                            {QUALITY_LABEL[s.quality]}
                          </div>
                          <div
                            className="text-lg font-black mb-1 leading-tight"
                            style={{
                              color: qualityColor(s.quality),
                              textShadow: `0 0 12px ${qualityGlow(s.quality)}`,
                            }}
                          >
                            {s.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground mb-1">{s.type}</div>
                          {/* 初始属性 */}
                          {s.baseStats && (
                            <div className="grid grid-cols-5 gap-0.5 mt-1">
                              {['attack', 'defense', 'speed', 'spirit', 'hp'].map((k) => (
                                <div key={k} className="text-center">
                                  <div className="text-[10px] font-bold tabular-nums" style={{ color: k === 'attack' ? '#f87171' : k === 'defense' ? '#60a5fa' : k === 'speed' ? '#34d399' : k === 'spirit' ? '#a78bfa' : '#fb923c' }}>
                                    {Math.round((s.baseStats as any)[k])}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3">
                    点击选择主修武魂，再次点击取消选择；主修武魂决定修炼方向与境界
                  </p>
                </div>
              ) : (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="mb-6"
                >
                  {/* 品质标签 */}
                  <div
                    className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3"
                    style={{
                      background: soul.quality === 'superDivine'
                        ? 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(239,68,68,0.2), rgba(168,85,247,0.2))'
                        : `${qualityColor(soul.quality)}20`,
                      color: qualityColor(soul.quality),
                      border: `1px solid ${qualityColor(soul.quality)}50`,
                      boxShadow: `0 0 20px ${qualityGlow(soul.quality)}40`,
                    }}
                  >
                    {QUALITY_LABEL[soul.quality]}品质
                  </div>

                  {/* 武魂名 */}
                  <h2
                    className="text-4xl font-black mb-2"
                    style={{
                      color: qualityColor(soul.quality),
                      textShadow: `0 0 30px ${qualityGlow(soul.quality)}`,
                      ...(soul.quality === 'superDivine' ? {
                        background: 'linear-gradient(135deg, #fcd34d, #f87171, #c084fc, #60a5fa)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        color: 'transparent',
                      } : {}),
                    }}
                  >
                    {soul.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">{soul.type} · {soul.element || '无属性'}</p>
                  <p className="text-xs text-muted-foreground/70 mt-2 max-w-xs mx-auto">
                    {soul.description}
                  </p>

                  {/* 极致属性标识 */}
                  {soul.extremeAttribute && (
                    <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap">
                      {soul.extremeAttribute.split('·').map((attr) => {
                        const info = getExtremeInfo(attr);
                        return (
                          <span
                            key={attr}
                            className="px-2 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-cyan-500/20 to-red-500/20 border border-cyan-500/40 text-cyan-300"
                            title={info.desc}
                          >
                            {info.icon} {attr}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* 初始五维属性 */}
                  {soul.baseStats && (
                    <div className="mt-4 grid grid-cols-5 gap-1.5 px-2">
                      {[
                        { key: 'attack', label: '攻击', color: '#f87171' },
                        { key: 'defense', label: '防御', color: '#60a5fa' },
                        { key: 'speed', label: '速度', color: '#34d399' },
                        { key: 'spirit', label: '精神', color: '#a78bfa' },
                        { key: 'hp', label: '气血', color: '#fb923c' },
                      ].map((stat) => (
                        <div key={stat.key} className="text-center">
                          <div className="text-sm font-bold tabular-nums" style={{ color: stat.color }}>
                            {Math.round((soul.baseStats as any)[stat.key])}
                          </div>
                          <div className="text-[9px] text-muted-foreground">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-[10px] text-muted-foreground mt-1.5">初始五维属性</div>
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={awakenPower}
                disabled={isTwinSoul && primaryIndex === null}
                className={`w-full py-3.5 rounded-xl font-bold text-lg shadow-lg border ${
                  isTwinSoul && primaryIndex === null
                    ? 'bg-muted/50 text-muted-foreground cursor-not-allowed border-border/50'
                    : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-600 text-white shadow-blue-500/30 border-blue-400/30'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  {isTwinSoul && primaryIndex === null ? '请先选择主修武魂' : '觉醒先天魂力'}
                  <ArrowRight className="h-5 w-5" />
                </span>
              </motion.button>

              <button
                onClick={() => {
                  const { primary, secondary, isTwin } = rollTwinSouls();
                  setSoul(primary);
                  setSecondSoul(secondary);
                  setIsTwinSoul(isTwin);
                  setPrimaryIndex(isTwin ? null : 0);
                  setStep('awakening');
                  if (rerollTimerRef.current) clearTimeout(rerollTimerRef.current);
                  rerollTimerRef.current = window.setTimeout(() => {
                    rerollTimerRef.current = null;
                    setStep('soulResult');
                  }, 300);
                }}
                className="w-full mt-2 py-2.5 rounded-xl border border-border/60 bg-card/40 text-sm text-muted-foreground hover:text-foreground hover:border-cyan-500/40 transition-all"
              >
                🔄 重新觉醒武魂
              </button>
            </motion.div>
          )}

          {/* 魂力觉醒动画 */}
          {step === 'powerAwakening' && (
            <motion.div
              key="power-awaken"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md flex flex-col items-center justify-center min-h-[60vh]"
            >
              <PowerAwakeningAnimation value={displayPower} />
              <p className="mt-4 text-sm text-muted-foreground animate-pulse">
                魂力汇聚中...
              </p>
            </motion.div>
          )}

          {/* 魂力结果 */}
          {step === 'powerResult' && (
            <motion.div
              key="power-result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md text-center"
            >
              <div className="text-xs text-muted-foreground mb-2">魂力觉醒完成</div>
              <div className="mb-6">
                <div
                  className="text-7xl font-black mb-2"
                  style={{
                    color: soulPower >= 10 ? '#fcd34d' : soulPower >= 8 ? '#f59e0b' : soulPower >= 6 ? '#a855f7' : '#60a5fa',
                    textShadow: `0 0 40px ${soulPower >= 10 ? 'rgba(252,211,77,0.7)' : soulPower >= 8 ? 'rgba(245,158,11,0.5)' : soulPower >= 6 ? 'rgba(168,85,247,0.5)' : 'rgba(96,165,250,0.4)'}`,
                  }}
                >
                  {soulPower}
                </div>
                <div className="text-xl font-bold text-foreground">
                  先天魂力 {soulPower} 级
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  初始等级：{soulPower} 级（{getRealmByLevel(soulPower)}）
                </div>
                {soulPower >= 10 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-3 inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-bold"
                  >
                    ⭐ 先天满魂力！绝世天才
                  </motion.div>
                )}

                {/* 最终五维属性（先天魂力加成后） */}
                {soul && soul.baseStats && (
                  <div className="mt-4 mx-auto max-w-sm">
                    <div className="text-[11px] text-muted-foreground mb-2">最终初始五维（含先天魂力加成）</div>
                    <div className="grid grid-cols-5 gap-2">
                      {(() => {
                        const fakePlayer: any = {
                          martialSoul: soul,
                          soulPower,
                          level: soulPower,
                          soulRings: [],
                          equipment: {},
                          soulBones: {},
                        };
                        const attrs = calcAttributes(fakePlayer);
                        return [
                          { key: 'attack', label: '攻击', val: attrs.attack, color: '#f87171' },
                          { key: 'defense', label: '防御', val: attrs.defense, color: '#60a5fa' },
                          { key: 'speed', label: '速度', val: attrs.speed, color: '#34d399' },
                          { key: 'spirit', label: '精神', val: attrs.spirit, color: '#a78bfa' },
                          { key: 'hp', label: '气血', val: attrs.hp, color: '#fb923c' },
                        ].map((stat) => (
                          <div key={stat.key} className="text-center">
                            <div className="text-base font-bold tabular-nums" style={{ color: stat.color }}>
                              {stat.val}
                            </div>
                            <div className="text-[9px] text-muted-foreground">{stat.label}</div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={enterGame}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-600 text-cyan-950 font-bold text-lg shadow-lg shadow-cyan-500/30"
              >
                <span className="flex items-center justify-center gap-2">
                  进入斗罗大陆
                  <ArrowRight className="h-5 w-5" />
                </span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// 快速闪现觉醒动画（0.3秒）
function QuickAwakeningFlash({ quality }: { quality: string }) {
  const isSuper = quality === 'superDivine';
  const isDivine = quality === 'divine';
  const isLegendary = quality === 'legendary';
  const isEpic = quality === 'epic';

  const mainColor = isSuper ? '#ef4444' : isDivine ? '#ef4444' : isLegendary ? '#f59e0b' : '#a855f7';
  const secondColor = isSuper ? '#fcd34d' : isDivine ? '#fcd34d' : isLegendary ? '#a855f7' : '#3b82f6';

  return (
    <div className="relative w-56 h-56 flex items-center justify-center">
      {/* 全屏闪光 */}
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 4, opacity: [0, 1, 0.5] }}
        transition={{ duration: 0.3, times: [0, 0.5, 1] }}
        style={{
          background: isSuper
            ? 'radial-gradient(circle, rgba(252,211,77,0.8) 0%, rgba(239,68,68,0.6) 40%, rgba(168,85,247,0.3) 70%, transparent 100%)'
            : `radial-gradient(circle, ${mainColor}99 0%, ${secondColor}55 50%, transparent 100%)`,
          filter: 'blur(10px)',
        }}
      />

      {/* 核心光球 */}
      <motion.div
        className="absolute w-24 h-24 rounded-full"
        initial={{ scale: 0.3, opacity: 0.5 }}
        animate={{ scale: [0.3, 1.5, 1.2], opacity: [0.5, 1, 0.9] }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          background: isSuper
            ? 'conic-gradient(from 0deg, #fcd34d, #f87171, #c084fc, #60a5fa, #fcd34d)'
            : `radial-gradient(circle, white 0%, ${mainColor} 50%, transparent 100%)`,
          boxShadow: `0 0 80px ${mainColor}`,
        }}
      />

      {/* 光环爆发 */}
      <motion.div
        className="absolute w-20 h-5 border-2 rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 3, 2.5], opacity: [0, 1, 0.6] }}
        transition={{ duration: 0.3 }}
        style={{
          borderColor: mainColor,
          boxShadow: `0 0 30px ${mainColor}`,
        }}
      />
    </div>
  );
}

// 魂力觉醒动画
function PowerAwakeningAnimation({ value }: { value: number }) {
  const isFull = value >= 10;
  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {/* 外圈光环 */}
      <motion.div
        className="absolute w-40 h-10 border-2 rounded-full"
        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
        transition={{ rotate: { duration: 4, repeat: Infinity, ease: 'linear' }, scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }}
        style={{
          borderColor: isFull ? 'rgba(252,211,77,0.6)' : 'rgba(96,165,250,0.5)',
          boxShadow: isFull ? '0 0 30px rgba(252,211,77,0.4)' : '0 0 30px rgba(96,165,250,0.4)',
        }}
      />

      {/* 光球 */}
      <motion.div
        className="absolute w-24 h-24 rounded-full"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: isFull
            ? 'radial-gradient(circle, #fef3c7 0%, #fcd34d 40%, #f59e0b 70%, #92400e 100%)'
            : 'radial-gradient(circle, #bfdbfe 0%, #60a5fa 50%, #4f46e5 100%)',
          boxShadow: isFull
            ? '0 0 60px rgba(252,211,77,0.7), inset 0 0 30px rgba(255,255,255,0.5)'
            : '0 0 50px rgba(96,165,250,0.6), inset 0 0 30px rgba(255,255,255,0.3)',
        }}
      />

      {/* 数字 */}
      <motion.div
        key={value}
        initial={{ scale: 1.5, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 text-6xl font-black"
        style={{
          color: isFull ? '#78350f' : 'white',
          textShadow: isFull
            ? '0 0 20px rgba(255,255,255,0.9), 0 0 40px rgba(252,211,77,0.8)'
            : '0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(96,165,250,0.8)',
        }}
      >
        {value}
      </motion.div>

      {/* 上升粒子 */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: -60, opacity: [0, 1, 0] }}
          transition={{ duration: 2, delay: i * 0.15, repeat: Infinity, ease: 'easeOut' }}
          style={{
            left: `${20 + Math.random() * 60}%`,
            backgroundColor: isFull ? '#fcd34d' : '#93c5fd',
            boxShadow: isFull ? '0 0 6px rgba(252,211,77,0.8)' : '0 0 6px rgba(147,197,253,0.8)',
          }}
        />
      ))}
    </div>
  );
}

// 境界速查（用于初始等级提示）
function getRealmByLevel(level: number): string {
  if (level >= 90) return '封号斗罗';
  if (level >= 80) return '魂斗罗';
  if (level >= 70) return '魂圣';
  if (level >= 60) return '魂帝';
  if (level >= 50) return '魂王';
  if (level >= 40) return '魂宗';
  if (level >= 30) return '魂尊';
  if (level >= 20) return '大魂师';
  if (level >= 10) return '魂师';
  return '魂士';
}
