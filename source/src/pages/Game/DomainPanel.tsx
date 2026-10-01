import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Lock, ChevronLeft } from 'lucide-react';
import { useGame, rollDomains, rollRandomDomain, getDomainBonusTier, calcDomainBonus, DOMAIN_COLORS, type IDomain } from '@/lib/gameStore';
import DomainSelectDialog from '@/components/DomainSelectDialog';

interface DomainPanelProps {
  onBack: () => void;
}

export default function DomainPanel({ onBack }: DomainPanelProps) {
  const { player, setDomain, setSecondDomain } = useGame();
  const [showSelect, setShowSelect] = useState(false);
  const [selectForSecond, setSelectForSecond] = useState(false);
  const [rolledDomains, setRolledDomains] = useState<IDomain[]>([]);
  const [isRandomMode, setIsRandomMode] = useState(false);

  // 随机属性模式下的当前领域（仅在 isRandomMode 为 true 时有效）
  const currentRandomDomain = isRandomMode ? rolledDomains[0] : null;

  if (!player) return null;

  const hasDomain = !!player.domain;
  const hasSecondDomain = !!player.secondDomain;
  const isTwin = player.isTwinSoul && player.secondSoul;
  const canUnlock = player.level >= 70 && player.soulRings.length >= 7;
  // 双生武魂第二领域解锁条件：玩家达到70级 + 第一武魂有7个魂环（第一领域已可觉醒）
  // 规定：双生武魂玩家达到70级可以领悟两个领域，第一/第二武魂各对应一个
  const canUnlockSecond = isTwin && player.level >= 70 && player.soulRings.length >= 7;
  const tier = getDomainBonusTier(player.level);
  const tierName = tier >= 4 ? '极限斗罗' : tier === 3 ? '封号斗罗' : tier === 2 ? '魂斗罗' : tier === 1 ? '魂圣' : '未解锁';

  const handleStartSelect = (forSecond = false, random = false) => {
    if (forSecond) {
      if (!canUnlockSecond) return;
      const domains = random
        ? [rollRandomDomain()]
        : rollDomains(player.direction, player.secondSoul!);
      setRolledDomains(domains);
      setSelectForSecond(true);
    } else {
      if (!canUnlock) return;
      const domains = random
        ? [rollRandomDomain()]
        : rollDomains(player.direction, player.martialSoul);
      setRolledDomains(domains);
      setSelectForSecond(false);
    }
    setIsRandomMode(random);
    setShowSelect(true);
  };

  const handleReroll = () => {
    const newDomain = rollRandomDomain();
    setRolledDomains([newDomain]);
  };

  const handleChoose = (domain: IDomain) => {
    if (selectForSecond) {
      setSecondDomain(domain);
    } else {
      setDomain(domain);
    }
    setShowSelect(false);
  };

  const bonus = hasDomain ? calcDomainBonus(player.domain!, player.level) : null;
  const domainAttr = hasDomain ? player.domain!.cultivationAttr : null;
  // 安全兜底：如果领域属性不在颜色映射中，默认用混沌属性颜色
  const domainColor = domainAttr
    ? (DOMAIN_COLORS[domainAttr as keyof typeof DOMAIN_COLORS] || DOMAIN_COLORS.chaos)
    : null;

  // 第二领域信息
  const secondBonus = hasSecondDomain ? calcDomainBonus(player.secondDomain!, player.level) : null;
  const secondDomainAttr = hasSecondDomain ? player.secondDomain!.cultivationAttr : null;
  const secondDomainColor = secondDomainAttr
    ? (DOMAIN_COLORS[secondDomainAttr as keyof typeof DOMAIN_COLORS] || DOMAIN_COLORS.chaos)
    : null;

  const formatBonus = (val?: number) => {
    if (!val) return null;
    const pct = Math.round(val * 100);
    return `+${pct}%`;
  };

  return (
    <div className="p-3 md:p-5 pb-4 space-y-4 md:space-y-6">
      {/* 顶部返回 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-cyan-400 hover:bg-cyan-500/10 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg md:text-xl font-bold">领域</h2>
        </div>
      </div>

      {/* 未解锁 */}
      {!canUnlock && !hasDomain && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border/40 bg-gradient-to-br from-card/40 to-card/20 p-6 text-center"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 border border-cyan-500/20">
            <Lock className="h-7 w-7 text-muted-foreground/60" />
          </div>
          <div className="text-base font-bold mb-2">领域尚未解锁</div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>达到 <span className="text-cyan-400">70级（魂圣）</span></div>
            <div>并吸收 <span className="text-cyan-400">第七魂环</span></div>
            <div className="mt-2 pt-2 border-t border-border/30 text-xs">
              当前：{player.level}级 · {player.soulRings.length}个魂环
            </div>
          </div>
        </motion.div>
      )}

      {/* 已解锁但未选择领域 */}
      {canUnlock && !hasDomain && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-cyan-500/40 bg-gradient-to-br from-cyan-500/15 to-purple-500/10 p-5 text-center"
        >
          <div className="text-3xl mb-3">✨</div>
          <div className="text-base font-bold mb-1 text-cyan-200">领域觉醒</div>
          <div className="text-sm text-cyan-300/80 mb-4">
            你已达到魂圣境界，可觉醒属于自己的领域！
          </div>
           <div className="space-y-2">
            <button
              onClick={() => handleStartSelect(false, false)}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-400 text-cyan-950 font-bold text-sm shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 active:scale-[0.98] transition-all"
            >
              武魂觉醒（五选一）
            </button>
            <button
              onClick={() => handleStartSelect(false, true)}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-violet-600/90 to-fuchsia-600/90 text-white font-bold text-sm shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 active:scale-[0.98] transition-all border border-violet-400/40"
            >
              随机属性觉醒
            </button>
           </div>
          {isTwin && !hasSecondDomain && canUnlockSecond && (
             <div className="space-y-2">
              <button
                onClick={() => handleStartSelect(true, false)}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-bold text-sm shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 active:scale-[0.98] transition-all"
              >
                武魂觉醒（五选一）
              </button>
              <button
                onClick={() => handleStartSelect(true, true)}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-fuchsia-600/90 to-pink-600/90 text-white font-bold text-sm shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50 active:scale-[0.98] transition-all border border-fuchsia-400/40"
              >
                随机属性觉醒
              </button>
             </div>
          )}
        </motion.div>
      )}

      {/* 已有领域 */}
      {hasDomain && player.domain && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* 领域名称卡 */}
          <div
             className="relative rounded-xl border p-5 overflow-hidden"
             style={{
               borderColor: domainColor?.primary || '#c026d3',
               background: `linear-gradient(135deg, ${domainColor?.glow || 'rgba(192,38,211,0.1)'}, transparent)`,
             }}
           >
             <div className="relative z-10">
               <div className="text-xs text-muted-foreground mb-1">我的领域</div>
               <div className="text-2xl font-black font-serif" style={{
                 color: domainColor?.primary || '#e879f9',
                 textShadow: `0 0 20px ${domainColor?.glow || 'rgba(192,38,211,0.5)'}`,
               }}>
                 {player.domain.name}
               </div>
               <div className="text-xs text-muted-foreground mt-2 leading-relaxed">
                 {player.domain.description}
               </div>
             </div>
             {/* 装饰光环 */}
             <div
               className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-30 blur-2xl"
               style={{
                 background: domainColor?.primary || '#c026d3',
               }}
             />
           </div>

          {/* 等级阶段 */}
          <div className="rounded-xl border border-border/50 bg-card/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">领域境界</span>
              <span className="text-sm text-cyan-400 font-bold">{tierName}</span>
            </div>
            <div className="flex gap-1">
              {['魂圣', '魂斗罗', '封号斗罗', '极限斗罗'].map((name, i) => (
                <div key={i} className="flex-1 text-center">
                  <div
                    className={`w-full h-2 rounded-full ${i < tier ? '' : 'bg-border/60'}`}
                     style={{
                       background: i < tier
                         ? `linear-gradient(90deg, ${domainColor?.secondary || '#9333ea'}, ${domainColor?.primary || '#c084fc'})`
                         : undefined,
                     }}
                  />
                  <div className="text-[10px] text-muted-foreground mt-1">{name}</div>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-muted-foreground mt-2">
              每突破一个大境界，领域属性加成提升 50%
            </div>
          </div>

          {/* 属性加成 */}
          <div className="rounded-xl border border-border/50 bg-card/40 p-4">
            <div className="text-sm font-medium mb-3">当前加成</div>
            <div className="grid grid-cols-2 gap-2">
              {bonus?.allAttr !== undefined && bonus.allAttr > 0 && (
                <BonusItem label="全属性" value={formatBonus(bonus.allAttr)!} />
              )}
              {bonus?.attack !== undefined && bonus.attack > 0 && (
                <BonusItem label="攻击" value={formatBonus(bonus.attack)!} />
              )}
              {bonus?.defense !== undefined && bonus.defense > 0 && (
                <BonusItem label="防御" value={formatBonus(bonus.defense)!} />
              )}
              {bonus?.speed !== undefined && bonus.speed > 0 && (
                <BonusItem label="速度" value={formatBonus(bonus.speed)!} />
              )}
              {bonus?.spirit !== undefined && bonus.spirit > 0 && (
                <BonusItem label="精神" value={formatBonus(bonus.spirit)!} />
              )}
              {bonus?.hp !== undefined && bonus.hp > 0 && (
                <BonusItem label="气血" value={formatBonus(bonus.hp)!} />
              )}
              {bonus?.critRate !== undefined && bonus.critRate > 0 && (
                <BonusItem label="暴击率" value={formatBonus(bonus.critRate)!} />
              )}
              {bonus?.critDmg !== undefined && bonus.critDmg > 0 && (
                <BonusItem label="爆伤" value={formatBonus(bonus.critDmg)!} />
              )}
              {bonus?.skillDmg !== undefined && bonus.skillDmg > 0 && (
                <BonusItem label="魂技伤害" value={formatBonus(bonus.skillDmg)!} />
              )}
            </div>
          </div>

          {/* 说明 */}
           <div className="text-[10px] text-muted-foreground/60 text-center pt-1">
              战斗中可开启领域，获得更强的属性加成与保护罩特效
            </div>
          </motion.div>
        )}

       {/* 双生武魂已有第二领域 → 展示第二领域信息卡 */}
       {hasSecondDomain && player.secondDomain && (
         <motion.div
           initial={{ opacity: 0, y: 8 }}
           animate={{ opacity: 1, y: 0 }}
           className="space-y-3"
         >
           {/* 第二领域名称卡 */}
           <div
              className="relative rounded-xl border p-5 overflow-hidden"
              style={{
                borderColor: secondDomainColor?.primary || '#a855f7',
                background: `linear-gradient(135deg, ${secondDomainColor?.glow || 'rgba(168,85,247,0.1)'}, transparent)`,
              }}>
             <div className="relative z-10">
               <div className="text-xs text-muted-foreground mb-1">第二领域 · {player.secondSoul?.name}</div>
               <div className="text-2xl font-black font-serif" style={{
                 color: secondDomainColor?.primary || '#c084fc',
                 textShadow: `0 0 20px ${secondDomainColor?.glow || 'rgba(168,85,247,0.5)'}`,
               }}>
                 {player.secondDomain.name}
               </div>
               <div className="text-xs text-muted-foreground mt-2 leading-relaxed">
                 {player.secondDomain.description}
               </div>
             </div>
             {/* 装饰光环 */}
             <div
               className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-30 blur-2xl"
               style={{
                 background: secondDomainColor?.primary || '#a855f7',
               }}
             />
           </div>

           {/* 第二领域属性加成 */}
           <div className="rounded-xl border border-border/50 bg-card/40 p-4">
             <div className="text-sm font-medium mb-3">第二领域加成</div>
             <div className="grid grid-cols-2 gap-2">
               {secondBonus?.allAttr !== undefined && secondBonus.allAttr > 0 && (
                 <BonusItem label="全属性" value={formatBonus(secondBonus.allAttr)!} />
               )}
               {secondBonus?.attack !== undefined && secondBonus.attack > 0 && (
                 <BonusItem label="攻击" value={formatBonus(secondBonus.attack)!} />
               )}
               {secondBonus?.defense !== undefined && secondBonus.defense > 0 && (
                 <BonusItem label="防御" value={formatBonus(secondBonus.defense)!} />
               )}
               {secondBonus?.speed !== undefined && secondBonus.speed > 0 && (
                 <BonusItem label="速度" value={formatBonus(secondBonus.speed)!} />
               )}
               {secondBonus?.spirit !== undefined && secondBonus.spirit > 0 && (
                 <BonusItem label="精神" value={formatBonus(secondBonus.spirit)!} />
               )}
               {secondBonus?.hp !== undefined && secondBonus.hp > 0 && (
                 <BonusItem label="气血" value={formatBonus(secondBonus.hp)!} />
               )}
               {secondBonus?.critRate !== undefined && secondBonus.critRate > 0 && (
                 <BonusItem label="暴击率" value={formatBonus(secondBonus.critRate)!} />
               )}
               {secondBonus?.critDmg !== undefined && secondBonus.critDmg > 0 && (
                 <BonusItem label="爆伤" value={formatBonus(secondBonus.critDmg)!} />
               )}
               {secondBonus?.skillDmg !== undefined && secondBonus.skillDmg > 0 && (
                 <BonusItem label="魂技伤害" value={formatBonus(secondBonus.skillDmg)!} />
               )}
             </div>
           </div>

           <div className="text-[10px] text-muted-foreground/60 text-center">
             战斗中可同时开启两个领域，加成叠加生效
           </div>
         </motion.div>
       )}

       {/* 双武魂：已有第一领域，但第二领域未觉醒 → 显示第二领域觉醒入口 */}
      {hasDomain && isTwin && !hasSecondDomain && canUnlockSecond && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-violet-500/40 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 p-5 text-center"
        >
          <div className="text-3xl mb-3">💫</div>
          <div className="text-base font-bold mb-1 text-violet-200">第二领域觉醒</div>
           <div className="text-xs text-cyan-300/80 mb-3">
             你的第二武魂【{player.secondSoul?.name}】已达到魂圣境界，可觉醒第二个领域！
           </div>
           <div className="space-y-2">
            <button
              onClick={() => handleStartSelect(true, false)}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-bold text-sm shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 active:scale-[0.98] transition-all"
            >
              武魂觉醒（五选一）
            </button>
            <button
              onClick={() => handleStartSelect(true, true)}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-fuchsia-600/90 to-pink-600/90 text-white font-bold text-sm shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50 active:scale-[0.98] transition-all border border-fuchsia-400/40"
            >
              随机属性觉醒
            </button>
           </div>
        </motion.div>
      )}

      {/* 选择领域弹窗 */}
      <AnimatePresence>
        {showSelect && (
           <DomainSelectDialog
             domains={rolledDomains}
             randomMode={isRandomMode}
             onReroll={isRandomMode ? handleReroll : undefined}
             onChoose={handleChoose}
             onClose={() => setShowSelect(false)}
           />
        )}
      </AnimatePresence>
    </div>
  );
}

function BonusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-foreground">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs text-emerald-400 font-medium">{value}</span>
    </div>
  );
}
