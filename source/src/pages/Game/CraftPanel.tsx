import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Hammer, Check, ChevronRight, Diamond, Sparkles, Package } from 'lucide-react';
import { useGame } from '@/lib/gameStore';
import type { IItem } from '@/data/items';
import { CRAFT_FIXED_STATS, CRAFT_MATERIAL_REQ, CORE_GEMS, MATERIAL_QUALITY_INFO, getMaterialsByTier } from '@/data/items';
import type { SoulGuideType } from '@/data/items';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CraftPanelProps {
  onBack: () => void;
}

type CraftStep = 'type' | 'level' | 'core' | 'name' | 'materials' | 'result';

const FIXED_ATTR_KEYS: Array<{ key: keyof (typeof CRAFT_FIXED_STATS)[number]; label: string; isPercent: boolean }> = [
  { key: 'attack', label: '攻击', isPercent: false },
  { key: 'defense', label: '防御', isPercent: false },
  { key: 'speed', label: '速度', isPercent: false },
  { key: 'spirit', label: '精神', isPercent: false },
  { key: 'hp', label: '气血', isPercent: false },
  { key: 'critRate', label: '暴击率', isPercent: true },
  { key: 'critDmg', label: '爆伤', isPercent: true },
  { key: 'allAttr', label: '全属性', isPercent: true },
  { key: 'soulPower', label: '魂力', isPercent: false },
];

const CRAFT_TYPES: Array<{ value: SoulGuideType; label: string; desc: string; icon: string }> = [
  { value: 'melee', label: '近战魂导器', desc: '擅长近身搏杀，攻击力出众', icon: '⚔' },
  { value: 'defense', label: '防御魂导器', desc: '坚不可摧，防御力与气血出众', icon: '🛡' },
  { value: 'ranged', label: '远程魂导器', desc: '远程精准打击，攻击与速度出众', icon: '🏹' },
  { value: 'support', label: '辅助魂导器', desc: '精神与气血双修，辅助能力强', icon: '✨' },
  { value: 'flying', label: '飞行魂导器', desc: '翱翔九天，速度与精神出众', icon: '🪶' },
];

export default function CraftPanel({ onBack }: CraftPanelProps) {
  const { player, craftSoulGuide } = useGame();
  const [step, setStep] = useState<CraftStep>('type');
  const [craftType, setCraftType] = useState<SoulGuideType>('melee');
  const [craftLevel, setCraftLevel] = useState(1);
  const [coreGemId, setCoreGemId] = useState<string | null>(null);
  const [craftName, setCraftName] = useState('');
  const [selectedMatNames, setSelectedMatNames] = useState<string[]>([]);
  const [crafting, setCrafting] = useState(false);
  const [craftResult, setCraftResult] = useState<{ item: IItem } | null>(null);

  const maxCraftLevel = useMemo(() => {
    // v10.0 解除等级限制：1级即可制作所有等级魂导器（最高9级）
    return 9;
  }, []);

  const fixedStats = CRAFT_FIXED_STATS[craftLevel] ?? CRAFT_FIXED_STATS[1];

  // 背包中对应等级的材料
  const availableMaterials = useMemo(() => {
    if (!player) return [];
    return player.inventory.filter((i) => i.type === 'material' && i.materialTier === craftLevel);
  }, [player, craftLevel]);

  // 材料需求：基础数 + 核心刻画额外2个
  const requiredMaterials = useMemo(() => {
    const base = CRAFT_MATERIAL_REQ[craftLevel] ?? 3;
    const coreExtra = coreGemId ? 2 : 0;
    return base + coreExtra;
  }, [craftLevel, coreGemId]);

  // 材料需求清单：核心刻画材料（必须） + 基础材料（任意该 tier 材料补足）
  const materialRequirements = useMemo(() => {
    const reqs: {
      name: string;
      iconChar: string;
      qualityColor: string;
      qualityLabel: string;
      needed: number;
      owned: number;
      isCore?: boolean;
    }[] = [];
    const inventory = player?.inventory ?? [];
    const tierMats = inventory.filter((i) => i.type === 'material' && i.materialTier === craftLevel);

    const tierColors: Record<number, string> = {
      1: '#94a3b8', 2: '#4ade80', 3: '#60a5fa', 4: '#a78bfa',
      5: '#fb923c', 6: '#f87171', 7: '#f472b6', 8: '#facc15', 9: '#d4a843',
    };
    const qualityRank: Record<string, number> = { common: 0, fine: 1, rare: 2 };

    // 合并同名（不同品阶）材料，累加数量，取品质最高的展示
    const mergeByName = (list: IItem[]) => {
      const map = new Map<string, {
        name: string;
        iconChar: string;
        qualityColor: string;
        qualityLabel: string;
        totalQty: number;
      }>();
      for (const m of list) {
        const existing = map.get(m.name);
        const qInfo = MATERIAL_QUALITY_INFO[m.materialQuality || 'common'];
        const mRank = qualityRank[m.materialQuality || 'common'] ?? 0;
        if (!existing) {
          map.set(m.name, {
            name: m.name,
            iconChar: m.iconChar,
            qualityColor: m.qualityColor,
            qualityLabel: qInfo?.label || '普通',
            totalQty: m.quantity ?? 0,
          });
        } else {
          existing.totalQty += m.quantity ?? 0;
          const exRank = qualityRank[
            existing.qualityLabel === '普通'
              ? 'common'
              : existing.qualityLabel === '精良'
                ? 'fine'
                : 'rare'
          ] ?? 0;
          if (mRank > exRank) {
            existing.qualityColor = m.qualityColor;
            existing.qualityLabel = qInfo?.label || '普通';
            existing.iconChar = m.iconChar;
          }
        }
      }
      return Array.from(map.values());
    };

    // 核心刻画材料（必须是 core 属性材料）
    if (coreGemId) {
      const coreMats = tierMats.filter((m) => m.materialAttr === 'core');
      const totalQty = coreMats.reduce((s, m) => s + (m.quantity ?? 0), 0);
      const coreMerged = mergeByName(coreMats);
      if (coreMerged.length > 0) {
        const best = coreMerged[0];
        reqs.push({
          name: best.name,
          iconChar: best.iconChar,
          qualityColor: best.qualityColor,
          qualityLabel: best.qualityLabel,
          needed: 2,
          owned: totalQty,
          isCore: true,
        });
      } else {
        const coreMat = getMaterialsByTier(craftLevel).find((m) => m.materialAttr === 'core');
        reqs.push({
          name: coreMat?.name || `${craftLevel}级魂导核心`,
          iconChar: coreMat?.iconChar || '核',
          qualityColor: tierColors[craftLevel] || '#94a3b8',
          qualityLabel: '普通',
          needed: 2,
          owned: 0,
          isCore: true,
        });
      }
    }

    // 基础材料需求（可以是任意非 core 材料，优先从背包已有材料展示）
    const baseNeeded = CRAFT_MATERIAL_REQ[craftLevel] ?? 3;
    const nonCoreMats = tierMats.filter((m) => m.materialAttr !== 'core');
    const nonCoreMerged = mergeByName(nonCoreMats);

    let remaining = baseNeeded;
    for (const mat of nonCoreMerged) {
      if (remaining <= 0) break;
      const take = Math.min(mat.totalQty, remaining);
      if (take <= 0) continue;
      reqs.push({
        name: mat.name,
        iconChar: mat.iconChar,
        qualityColor: mat.qualityColor,
        qualityLabel: mat.qualityLabel,
        needed: take,
        owned: mat.totalQty,
      });
      remaining -= take;
    }

    // 背包材料不足时的占位
    if (remaining > 0) {
      const universalDef = getMaterialsByTier(craftLevel).find((m) => m.materialAttr === 'universal');
      reqs.push({
        name: universalDef?.name || `${craftLevel}级通用材料`,
        iconChar: universalDef?.iconChar || '通',
        qualityColor: tierColors[craftLevel] || '#94a3b8',
        qualityLabel: '普通',
        needed: remaining,
        owned: 0,
      });
    }

    return reqs;
  }, [craftLevel, coreGemId, player?.inventory]);

  const totalSelectedMats = selectedMatNames.length;
  const matsEnough = totalSelectedMats >= requiredMaterials;

  const toggleMaterial = (name: string, totalQty: number) => {
    setSelectedMatNames((prev) => {
      const current = prev.filter((n) => n === name).length;
      if (current >= totalQty) return prev;
      return [...prev, name];
    });
  };

  const decrementMaterial = (name: string) => {
    setSelectedMatNames((prev) => {
      const idx = prev.lastIndexOf(name);
      if (idx === -1) return prev;
      const copy = [...prev];
      copy.splice(idx, 1);
      return copy;
    });
  };

  const goNext = () => {
    const order: CraftStep[] = ['type', 'level', 'core', 'name', 'materials', 'result'];
    const idx = order.indexOf(step);
    if (idx < order.length - 1) setStep(order[idx + 1]);
  };

  const goPrev = () => {
    const order: CraftStep[] = ['type', 'level', 'core', 'name', 'materials', 'result'];
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
  };

  const handleCraft = async () => {
    setCrafting(true);
    try {
      const res = craftSoulGuide({
        type: craftType,
        level: craftLevel,
        materialNames: selectedMatNames,
        coreGemId,
        name: craftName,
      });
      if (res.success && res.item) {
        toast.success(`成功打造【${craftName}】！`);
        setCraftResult({ item: res.item });
        setStep('result');
      } else {
        toast.error(res.reason || '制作失败');
      }
    } catch (e) {
      toast.error('制作出错');
    } finally {
      setCrafting(false);
    }
  };

  if (!player) return null;

  const stepLabels: Record<CraftStep, string> = {
    type: '选择类型',
    level: '选择等级',
    core: '核心刻画',
    name: '魂导器命名',
    materials: '选择材料',
    result: '制作结果',
  };

  const allSteps: CraftStep[] = ['type', 'level', 'core', 'name', 'materials'];

  return (
    <div className="p-3 md:p-5 pb-4 space-y-4 md:space-y-6">
      {/* 顶部 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-sky-100/60 transition-colors border border-cyan-500/30 text-cyan-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <Hammer className="h-5 w-5 text-cyan-400" />
        <h2
          className="text-lg md:text-xl font-bold"
          style={{ fontFamily: "'Noto Serif SC', serif" }}
        >
          自制魂导器
        </h2>
      </div>

      {/* 步骤指示（结果页不显示） */}
      {step !== 'result' && (
        <div className="flex items-center justify-between px-1">
          {allSteps.map((s, i) => {
            const curIdx = allSteps.indexOf(step);
            const done = i < curIdx;
            const active = i === curIdx;
            return (
              <div key={s} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all border ${
                    done
                      ? 'bg-cyan-800/50 border-cyan-500/40 text-cyan-300'
                      : active
                        ? 'bg-cyan-800/60 border-cyan-400 text-cyan-200 ring-2 ring-cyan-400/40'
                        : 'bg-muted/30 border-border/50 text-muted-foreground'
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={`text-[9px] ${active ? 'text-cyan-300' : 'text-muted-foreground'}`}>
                  {stepLabels[s]}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 步骤内容 */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* 第一步：选择类型 */}
            {step === 'type' && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">选择要制作的魂导器类型</p>
                <div className="grid grid-cols-1 gap-3">
                  {CRAFT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => {
                        setCraftType(t.value);
                        goNext();
                      }}
                      className={`relative overflow-hidden p-4 rounded-xl border text-left transition-all bg-card/40 backdrop-blur-sm ${
                        craftType === t.value
                          ? 'border-cyan-400/60 ring-1 ring-cyan-400/40 shadow-[0_0_20px_rgba(212_168_67_0.15)]'
                          : 'border-cyan-500/20 hover:border-cyan-500/40 active:scale-[0.98]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-black/40 border border-cyan-500/30 flex items-center justify-center text-2xl">
                          {t.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-base text-cyan-100">{t.label}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-cyan-400/70" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 第二步：选择等级 */}
            {step === 'level' && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  选择魂导器等级（共 9 级，等级越高属性越强）
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((lv) => {
                    const locked = false;
                    const active = lv === craftLevel;
                    return (
                      <button
                        key={lv}
                        onClick={() => {
                          if (!locked) setCraftLevel(lv);
                        }}
                        disabled={locked}
                        className={`relative p-3 rounded-xl border text-center transition-all bg-card/40 backdrop-blur-sm ${
                          locked
                            ? 'border-border/20 opacity-40 cursor-not-allowed'
                            : active
                              ? 'border-cyan-400/60 ring-2 ring-cyan-400/40 shadow-[0_0_15px_rgba(212_168_67_0.2)]'
                              : 'border-cyan-500/20 hover:border-cyan-500/40 active:scale-[0.97]'
                        }`}
                      >
                        <div className="text-xl font-bold text-cyan-200">{lv}</div>
                        <div className="text-[10px] text-muted-foreground">级魂导器</div>
                      </button>
                    );
                  })}
                </div>

                {/* 固定属性预览 */}
                <div className="rounded-lg bg-sky-50/70 border border-cyan-500/30 p-3 text-xs space-y-1.5 text-foreground">
                  <div className="text-cyan-200 font-semibold mb-1.5">固定属性加成</div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {FIXED_ATTR_KEYS.map((attr) => {
                      const val = fixedStats[attr.key];
                      return (
                        <div key={attr.key} className="flex justify-between">
                          <span className="text-muted-foreground">{attr.label}</span>
                          <span className="text-cyan-300 font-medium">
                            +{attr.isPercent ? `${val ?? 0}%` : (val ?? 0).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-lg bg-card/40 border border-border/40 p-3 text-xs space-y-1.5 text-foreground">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">基础材料数</span>
                    <span className="text-cyan-300 font-medium">
                      {CRAFT_MATERIAL_REQ[craftLevel] ?? 3} 个
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">制作成功率</span>
                    <span className="text-green-400 font-medium">100%（必定成功）</span>
                  </div>
                </div>
              </div>
            )}

            {/* 第三步：魂导核心刻画 */}
            {step === 'core' && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">选择一颗魂导核心宝石（可选）</p>
                  <p className="text-[11px] text-cyan-400/70 mt-1">
                    刻画核心将赋予魂导器特殊属性，额外消耗 2 个魂导核心材料
                  </p>
                </div>

                {/* 宝石展示 */}
                <div className="grid grid-cols-3 gap-3">
                  {CORE_GEMS.map((gem) => {
                    const selected = coreGemId === gem.id;
                    return (
                      <button
                        key={gem.id}
                        onClick={() => setCoreGemId(selected ? null : gem.id)}
                        className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                          selected
                            ? 'bg-cyan-500/10 border-cyan-400/60 shadow-[0_0_20px_rgba(212_168_67_0.2)]'
                            : 'bg-card/40 border-cyan-500/20 hover:border-cyan-500/40 active:scale-[0.97]'
                        }`}
                      >
                        <motion.div
                          className="relative"
                          animate={selected ? { scale: [1, 1.05, 1] } : {}}
                          transition={
                            selected ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}
                          }
                        >
                          <Diamond
                            className="w-10 h-10"
                            style={{
                              color: gem.color,
                              filter: `drop-shadow(0 0 8px ${gem.glowColor})`,
                            }}
                          />
                          {selected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 text-cyan-950" />
                            </div>
                          )}
                        </motion.div>
                        <div className="text-[11px] font-medium" style={{ color: gem.color }}>
                          {gem.name}
                        </div>
                        <div className="text-[9px] text-muted-foreground text-center leading-tight">
                          {gem.effectDesc}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-lg bg-sky-50/70 border border-cyan-500/30 p-3 text-xs space-y-1.5 text-foreground">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">核心刻画</span>
                    <span className="text-cyan-300 font-medium">
                      {coreGemId ? CORE_GEMS.find((g) => g.id === coreGemId)?.name : '未刻画'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">额外材料</span>
                    <span className="text-cyan-300 font-medium">
                      {coreGemId ? '+2 个魂导核心' : '无'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 第四步：命名 */}
            {step === 'name' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">为你的魂导器取一个名字（不超过5个字）</p>
                <div className="space-y-2">
                  <Input
                    value={craftName}
                    onChange={(e) => setCraftName(e.target.value.slice(0, 5))}
                    placeholder="输入魂导器名称"
                    maxLength={5}
                    className="text-center text-lg font-bold h-14 bg-card/40 border-cyan-500/30 focus:border-cyan-400"
                  />
                  <div className="text-right text-xs text-muted-foreground">{craftName.length}/5</div>
                </div>

                <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-b from-cyan-500/5 to-transparent p-5">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-3">预览</div>
                    <div
                      className="w-20 h-20 mx-auto rounded-xl flex items-center justify-center text-3xl font-bold border-2"
                      style={{
                        borderColor: '#d4a843',
                        color: '#d4a843',
                        background: 'rgba(0,0,0,0.4)',
                        boxShadow: '0 0 20px rgba(34,211,238,0.2)',
                      }}
                    >
                      {craftName.slice(0, 1) || '?'}
                    </div>
                    <div className="mt-3 font-bold text-cyan-200">{craftName || '魂导器名称'}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {CRAFT_TYPES.find((t) => t.value === craftType)?.label} · {craftLevel}级
                    </div>
                    {coreGemId && (
                      <div
                        className="text-[11px] mt-1"
                        style={{ color: CORE_GEMS.find((g) => g.id === coreGemId)?.color }}
                      >
                        {CORE_GEMS.find((g) => g.id === coreGemId)?.effect}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 第五步：选择材料 */}
            {step === 'materials' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    选择 {craftLevel} 级魂导材料（需要 {requiredMaterials} 个）
                  </p>
                  <span className={`text-xs font-medium ${matsEnough ? 'text-cyan-300' : 'text-red-500'}`}>
                    已选 {totalSelectedMats}/{requiredMaterials}
                  </span>
                </div>

                {/* 材料需求清单（点击选择/取消选择） */}
                <div className="rounded-xl border border-cyan-500/25 bg-card/50 p-3 space-y-2">
                  <div className="text-xs font-semibold text-cyan-200 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="w-1 h-3 bg-cyan-400 rounded-full" />
                      所需材料清单（点击选择）
                    </div>
                    <span className={`text-[11px] font-medium ${matsEnough ? 'text-cyan-300' : 'text-red-500'}`}>
                      已选 {totalSelectedMats}/{requiredMaterials}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {materialRequirements.map((m, i) => {
                      const selectedCount = selectedMatNames.filter((n) => n === m.name).length;
                      const owned = m.owned;
                      return (
                        <button
                          key={`${m.name}-${i}`}
                          onClick={() => {
                            if (
                              selectedCount < m.needed &&
                              selectedCount < owned &&
                              totalSelectedMats < requiredMaterials
                            ) {
                              toggleMaterial(m.name, owned);
                            } else if (
                              selectedCount > 0 &&
                              (selectedCount >= m.needed ||
                                selectedCount >= owned ||
                                totalSelectedMats >= requiredMaterials)
                            ) {
                              decrementMaterial(m.name);
                            }
                          }}
                          disabled={owned <= 0 && selectedCount === 0}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                            selectedCount > 0
                              ? 'border-cyan-400/70 bg-cyan-500/15 ring-1 ring-cyan-400/30'
                              : owned > 0
                                ? 'border-cyan-500/20 bg-card/40 hover:border-cyan-500/40 active:scale-[0.99]'
                                : 'border-red-500/20 bg-red-500/5 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div
                            className="w-10 h-10 shrink-0 rounded-md flex items-center justify-center text-base font-bold border"
                            style={{
                              borderColor: `${m.qualityColor}66`,
                              color: m.qualityColor,
                              backgroundColor: `${m.qualityColor}12`,
                            }}
                          >
                            {m.iconChar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">
                              {m.name}
                              {m.isCore && (
                                <span className="ml-1 text-[10px] text-purple-400">（核心）</span>
                              )}
                            </div>
                            <div className="text-[11px] mb-0.5">
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                style={{
                                  backgroundColor: `${m.qualityColor}20`,
                                  color: m.qualityColor,
                                }}
                              >
                                {m.qualityLabel}
                              </span>
                            </div>
                            <div
                              className={`text-xs font-semibold ${
                                owned >= m.needed ? 'text-green-400' : 'text-red-400'
                              }`}
                            >
                              拥有 {owned} / 需求 {m.needed}
                              {owned >= m.needed ? ' · 充足' : ' · 不足'}
                            </div>
                          </div>
                          {selectedCount > 0 && (
                            <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center shrink-0">
                              <span className="text-[11px] font-bold text-cyan-950">
                                {selectedCount}
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {availableMaterials.length === 0 && (
                    <div className="pt-2 text-center text-muted-foreground text-xs border-t border-cyan-500/10">
                      背包中没有 {craftLevel} 级材料
                      <div className="mt-1 text-muted-foreground/60">前往日月山脉获取材料</div>
                    </div>
                  )}

                  {/* 背包中所有该等级材料一览 */}
                  {availableMaterials.length > 0 && (
                    <div className="pt-4 border-t border-cyan-500/10">
                      <div className="text-xs text-cyan-300/70 mb-2 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5" />
                        背包中 {craftLevel} 级材料 (
                        {availableMaterials.reduce((s, m) => s + (m.quantity ?? 0), 0)} 个)
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {availableMaterials.map((mat) => {
                          const qInfo = MATERIAL_QUALITY_INFO[mat.materialQuality || 'common'];
                          return (
                            <div
                              key={mat.id}
                              className="flex items-center gap-2 p-1.5 rounded-md bg-card/30 border border-cyan-500/10"
                            >
                              <div
                                className="w-7 h-7 shrink-0 rounded flex items-center justify-center text-xs font-bold border"
                                style={{
                                  borderColor: `${mat.qualityColor}66`,
                                  color: mat.qualityColor,
                                  backgroundColor: `${mat.qualityColor}15`,
                                }}
                              >
                                {mat.iconChar}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] text-foreground truncate">{mat.name}</div>
                                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <span style={{ color: qInfo?.color }}>{qInfo?.label}</span>
                                  <span>· ×{mat.quantity ?? 1}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-sky-50/70 border border-cyan-500/30 p-3 text-xs space-y-1.5 text-foreground">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">魂导器类型</span>
                    <span className="text-cyan-200">
                      {CRAFT_TYPES.find((t) => t.value === craftType)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">等级</span>
                    <span className="text-cyan-200">{craftLevel} 级</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">核心刻画</span>
                    <span className="text-cyan-200">
                      {coreGemId ? CORE_GEMS.find((g) => g.id === coreGemId)?.name : '无'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-cyan-500/20">
                    <span className="text-cyan-200 font-medium">所需材料</span>
                    <span className="text-cyan-300 font-medium">{requiredMaterials} 个</span>
                  </div>
                </div>

                <Button
                  onClick={handleCraft}
                  disabled={crafting || !matsEnough || !craftName.trim()}
                  className="w-full h-12 bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-600 text-cyan-950 font-bold border border-cyan-400/50 shadow-[0_0_20px_rgba(212_168_67_0.25)] hover:shadow-[0_0_30px_rgba(212_168_67_0.4)]"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {crafting ? '打造中...' : '开始打造'}
                </Button>
              </div>
            )}

            {/* 制作结果 */}
            {step === 'result' && craftResult && (
              <div className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="text-center space-y-4"
                >
                  <div
                    className="text-lg font-bold text-cyan-200"
                    style={{ fontFamily: "'Noto Serif SC', serif" }}
                  >
                    ✦ 打造成功 ✦
                  </div>

                  <div
                    className="w-24 h-24 mx-auto rounded-xl flex items-center justify-center text-4xl font-bold border-2"
                    style={{
                      borderColor: craftResult.item.qualityColor,
                      color: craftResult.item.qualityColor,
                      background: 'rgba(0,0,0,0.4)',
                      boxShadow: `0 0 40px ${craftResult.item.qualityColor}40`,
                    }}
                  >
                    {craftResult.item.iconChar}
                  </div>

                  <div>
                    <div className="text-xl font-bold text-cyan-200">{craftResult.item.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {CRAFT_TYPES.find((t) => t.value === craftType)?.label} · {craftLevel}级
                    </div>
                  </div>

                  <div className="rounded-lg bg-sky-50/70 border border-cyan-500/30 p-4 text-sm space-y-2 text-foreground">
                    <div className="text-xs text-muted-foreground mb-2">属性加成</div>
                    {FIXED_ATTR_KEYS.map((attr) => {
                      const val = craftResult.item.attributes?.[attr.key] ?? 0;
                      if (val <= 0) return null;
                      return (
                        <div key={attr.key} className="flex justify-between">
                          <span className="text-muted-foreground">{attr.label}</span>
                          <span
                            className={
                              attr.isPercent
                                ? 'text-cyan-300 font-medium'
                                : 'text-purple-400 font-medium'
                            }
                          >
                            +{attr.isPercent ? `${val}%` : val.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                    {craftResult.item.specialEffect && (
                      <div className="pt-2 mt-2 border-t border-cyan-500/20">
                        <div className="text-xs text-muted-foreground mb-1">特殊属性</div>
                        <div
                          className="font-medium text-sm"
                          style={{ color: craftResult.item.specialEffect.color }}
                        >
                          {craftResult.item.specialEffect.name} ·{' '}
                          {craftResult.item.specialEffect.desc}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-muted-foreground">已收入背包</div>
                </motion.div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={onBack} className="flex-1 border-cyan-500/30">
                    返回
                  </Button>
                  <Button
                    onClick={() => {
                      setStep('type');
                      setCraftResult(null);
                      setCoreGemId(null);
                      setCraftName('');
                      setSelectedMatNames([]);
                    }}
                    className="flex-1 bg-cyan-800/50 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-700/60"
                  >
                    继续打造
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 底部操作按钮 */}
      {step !== 'type' && step !== 'materials' && step !== 'result' && (
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={goPrev}
            className="flex-1 border-cyan-500/40 text-cyan-300 hover:bg-cyan-800/50"
          >
            上一步
          </Button>
          <Button
            onClick={goNext}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-cyan-500 text-cyan-950 font-medium border border-cyan-400/30"
            disabled={step === 'name' && !craftName.trim()}
          >
            下一步
          </Button>
        </div>
      )}
    </div>
  );
}
