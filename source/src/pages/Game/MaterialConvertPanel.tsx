import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRightLeft, Minus, Plus, AlertCircle } from 'lucide-react';
import { useGame } from '@/lib/gameStore';
import { MATERIAL_ITEMS, MATERIAL_QUALITY_INFO, type IItem } from '@/data/items';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MaterialConvertPanelProps {
  onBack: () => void;
}

export default function MaterialConvertPanel({ onBack }: MaterialConvertPanelProps) {
  const { player, materialConvert } = useGame();

  // 全部9级材料均开放，1级即可使用材料转换功能
  const maxTier = 9;

  // 玩家拥有的材料列表（从背包中筛选）
  const playerMaterials = useMemo(() => {
    if (!player) return [];
    return player.inventory.filter(i => i.type === 'material' && i.materialTier);
  }, [player]);

  // 全部可转换材料（共9级）
  const allAvailableMaterials = useMemo(() => {
    return MATERIAL_ITEMS.filter(m => m.materialTier);
  }, []);

  // 状态：当前选中的等级（用于筛选列表）
  const [fromTier, setFromTier] = useState<number>(1);
  const [toTier, setToTier] = useState<number>(1);
  const [fromQuality, setFromQuality] = useState<string>('common');
  const [toQuality, setToQuality] = useState<string>('common');

  // 选中的源材料和目标材料（名称）
  const [selectedFromId, setSelectedFromId] = useState<string | null>(null);
  const [selectedToId, setSelectedToId] = useState<string | null>(null);
  const [fromQty, setFromQty] = useState<number>(1);

  // 根据等级和品质筛选列表
  const fromList = useMemo(() => {
    return playerMaterials.filter(m => m.materialTier === fromTier && m.materialQuality === fromQuality);
  }, [playerMaterials, fromTier, fromQuality]);

  const toList = useMemo(() => {
    return allAvailableMaterials.filter(m => m.materialTier === toTier && m.materialQuality === toQuality);
  }, [allAvailableMaterials, toTier, toQuality]);

  // 选中源材料时自动重置数量为 1
  const handleSelectFrom = (id: string) => {
    setSelectedFromId(id);
    setFromQty(1);
  };

  // 选中的模板材料（源/目标）
  const selectedFrom = useMemo(
    () => fromList.find(m => m.id === selectedFromId) ?? null,
    [selectedFromId, fromList]
  );
  const selectedTo = useMemo(
    () => toList.find(m => m.id === selectedToId) ?? null,
    [selectedToId, toList]
  );

  // 源材料当前拥有数量（按名称+品质匹配，同名不同品质不合并）
   const fromHaveQty = useMemo(() => {
     if (!selectedFrom || !player) return 0;
     const item = player.inventory.find(i => i.name === selectedFrom.name && i.type === 'material' && i.materialQuality === selectedFrom.materialQuality);
     return item?.quantity ?? 0;
   }, [selectedFrom, player]);

  // 计算转换比例和可获得数量
  const conversionInfo = useMemo(() => {
    if (!selectedFrom || !selectedTo) return { ratio: '0', gotQty: 0, desc: '' };

    const fromItem = selectedFrom;
    const toItem = selectedTo;

    const fromT = fromItem.materialTier ?? 1;
    const toT = toItem.materialTier ?? 1;
    const fromQ = fromItem.materialQuality ?? 'common';
    const toQ = toItem.materialQuality ?? 'common';

    // 等级差比例
    let tierRatio = 1;
    if (fromT > toT) tierRatio = Math.pow(2, fromT - toT);
    else if (fromT < toT) tierRatio = 1 / Math.pow(3, toT - fromT);

    // 品质差比例
    const qualityRank: Record<string, number> = { common: 1, fine: 2, rare: 3 };
    const fq = qualityRank[fromQ] ?? 1;
    const tq = qualityRank[toQ] ?? 1;
    let qualityRatio = 1;
    if (fq > tq) qualityRatio = Math.pow(2, fq - tq);
    else if (fq < tq) qualityRatio = 1 / Math.pow(2, tq - fq);

    // 同级互换损耗（仅同级且同品质时才叠加；同级不同品质时 qualityRatio 已体现品质差）
    let sameTierPenalty = 1;
    if (fromT === toT && fromQ === toQ) sameTierPenalty = 1 / 2;

    const totalRatio = tierRatio * qualityRatio * sameTierPenalty;
    const gotQty = Math.floor(fromQty * totalRatio);

    // 比例文字描述
    let desc = '';
    if (fromT === toT && fromQ === toQ) {
      desc = '同级同品质互换 2:1';
    } else {
      const parts: string[] = [];
      if (fromT > toT) parts.push(`高${fromT - toT}级转低级 1:${Math.pow(2, fromT - toT)}`);
      else if (fromT < toT) parts.push(`低${toT - fromT}级转高级 ${Math.pow(3, toT - fromT)}:1`);
      if (fq > tq) parts.push(`高品质转低品质 1:${Math.pow(2, fq - tq)}`);
      else if (fq < tq) parts.push(`低品质转高品质 ${Math.pow(2, tq - fq)}:1`);
      if (fromT === toT && fromQ === toQ) parts.push('同级互换 2:1（损耗）');
      desc = parts.join(' + ');
    }

    // 比例显示为分数
    let ratioStr = '';
    if (totalRatio >= 1) {
      ratioStr = `1:${totalRatio.toFixed(totalRatio % 1 === 0 ? 0 : 1)}`;
    } else {
      const inv = 1 / totalRatio;
      ratioStr = `${inv.toFixed(inv % 1 === 0 ? 0 : 1)}:1`;
    }

    return { ratio: ratioStr, gotQty, desc };
  }, [selectedFrom, selectedTo, fromQty]);

  const handleConvert = () => {
    if (!selectedFrom || !selectedTo) {
      toast.error('请选择源材料和目标材料');
      return;
    }
    if (fromQty <= 0) {
      toast.error('请输入有效的转换数量');
      return;
    }
    if (fromQty > fromHaveQty) {
      toast.error('材料数量不足');
      return;
    }
    if (conversionInfo.gotQty < 1) {
      toast.error('数量太少，无法转换（至少获得1个）');
      return;
    }

    const result = materialConvert({
      fromName: selectedFrom.name,
      fromQty,
      toName: selectedTo.name,
      fromQuality: selectedFrom.materialQuality,
      toQuality: selectedTo.materialQuality,
    });

    if (result.success) {
      toast.success(`转换成功！获得 ${selectedTo.name} × ${result.gotQty}`);
    } else {
      toast.error(result.reason ?? '转换失败');
    }
  };

  const qualityLabel = (q: string) => {
    const map: Record<string, string> = { common: '普通', fine: '精良', rare: '稀有' };
    return map[q] ?? q;
  };

  const qualityColor = (q: string) => {
    const map: Record<string, string> = {
      common: '#94a3b8',
      fine: '#3b82f6',
      rare: '#a855f7',
    };
    return map[q] ?? '#94a3b8';
  };

  return (
    <div className="p-3 md:p-5 pb-4 space-y-4 md:space-y-6">
      {/* 顶部返回 */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2 text-cyan-400">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg md:text-xl font-bold">材料转换</h2>
        </div>
      </div>

      {/* 转换说明提示 */}
      <div className="text-[11px] text-cyan-300/80 px-1 flex items-center gap-1.5">
        <AlertCircle className="h-3.5 w-3.5" />
        支持 1~9 级材料转换，玩家任意等级均可使用
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 左侧：源材料 */}
        <div className="space-y-2">
          <div className="text-sm font-semibold text-cyan-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            放入材料
            {selectedFrom && fromHaveQty > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">拥有 {fromHaveQty} 个</span>
            )}
          </div>

          {/* 等级筛选 */}
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: maxTier }, (_, i) => i + 1).map(tier => (
              <button
                key={tier}
                onClick={() => { setFromTier(tier); setSelectedFromId(null); }}
                className={`px-2 py-0.5 text-[11px] rounded-md border transition-all ${
                  fromTier === tier
                    ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                    : 'bg-card/40 border-border/40 text-muted-foreground hover:border-cyan-500/30'
                }`}
              >
                {tier}级
              </button>
            ))}
          </div>

          {/* 品质筛选 */}
          <div className="flex gap-1 flex-wrap">
            {['common', 'fine', 'rare'].map(q => (
              <button
                key={q}
                onClick={() => { setFromQuality(q); setSelectedFromId(null); }}
                className={`px-2 py-0.5 text-[11px] rounded-md border transition-all ${
                  fromQuality === q
                    ? 'bg-card/60 border-cyan-400/50'
                    : 'bg-card/30 border-border/30 text-muted-foreground hover:border-cyan-500/30'
                }`}
                style={{ color: fromQuality === q ? qualityColor(q) : undefined }}
              >
                {qualityLabel(q)}
              </button>
            ))}
          </div>

          {/* 材料列表 */}
          <div className="max-h-56 overflow-y-auto grid grid-cols-1 gap-1.5 pr-1">
            {fromList.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-6">
                背包中没有该等级/品质的材料
              </div>
            ) : (
              fromList.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSelectFrom(m.id)}
                  className={`w-full p-2 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                    selectedFromId === m.id
                      ? 'border-emerald-400/60 bg-emerald-500/10'
                      : 'border-border/40 bg-card/40 hover:border-emerald-500/30'
                  }`}
                >
                  <div
                    className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold border"
                    style={{
                      borderColor: MATERIAL_QUALITY_INFO[m.materialQuality ?? 'common']?.color,
                      background: `${MATERIAL_QUALITY_INFO[m.materialQuality ?? 'common']?.color}15`,
                      color: qualityColor(m.materialQuality ?? 'common'),
                    }}
                  >
                    {m.iconChar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{m.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {m.materialTier}级 · {qualityLabel(m.materialQuality ?? 'common')} · 拥有 {m.quantity ?? 1}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* 数量选择 */}
          {selectedFrom && fromHaveQty > 0 && (
            <div className="flex items-center justify-center gap-3 py-2">
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7"
                onClick={() => setFromQty(Math.max(1, fromQty - 1))}
                disabled={fromQty <= 1}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <div className="text-center min-w-[60px]">
                <div className="text-lg font-bold">{fromQty}</div>
                <div className="text-[9px] text-muted-foreground">/ {fromHaveQty}</div>
              </div>
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7"
                onClick={() => setFromQty(Math.min(fromHaveQty, fromQty + 1))}
                disabled={fromQty >= fromHaveQty}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* 右侧：目标材料 */}
        <div className="space-y-2">
          <div className="text-sm font-semibold text-cyan-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            兑换材料
            {selectedTo && (
              <span className="ml-auto text-xs text-amber-400/80">
                获得 {conversionInfo.gotQty} 个
              </span>
            )}
          </div>

          {/* 等级筛选 */}
          <div className="flex gap-1 flex-wrap">
           {Array.from({ length: maxTier }, (_, i) => i + 1).map(tier => (
              <button
                key={tier}
                onClick={() => { setToTier(tier); setSelectedToId(null); }}
                className={`px-2 py-0.5 text-[11px] rounded-md border transition-all ${
                  toTier === tier
                    ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                    : 'bg-card/40 border-border/40 text-muted-foreground hover:border-amber-500/30'
                }`}
              >
                {tier}级
              </button>
            ))}
          </div>

          {/* 品质筛选 */}
          <div className="flex gap-1 flex-wrap">
            {['common', 'fine', 'rare'].map(q => (
              <button
                key={q}
                onClick={() => { setToQuality(q); setSelectedToId(null); }}
                className={`px-2 py-0.5 text-[11px] rounded-md border transition-all ${
                  toQuality === q
                    ? 'bg-card/60 border-amber-400/50'
                    : 'bg-card/30 border-border/30 text-muted-foreground hover:border-amber-500/30'
                }`}
                style={{ color: toQuality === q ? qualityColor(q) : undefined }}
              >
                {qualityLabel(q)}
              </button>
            ))}
          </div>

          {/* 材料列表 */}
          <div className="max-h-56 overflow-y-auto grid grid-cols-1 gap-1.5 pr-1">
            {toList.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-6">
                该等级/品质无可用材料
              </div>
            ) : (
              toList.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedToId(m.id)}
                  className={`w-full p-2 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                    selectedToId === m.id
                      ? 'border-amber-400/60 bg-amber-500/10'
                      : 'border-border/40 bg-card/40 hover:border-amber-500/30'
                  }`}
                >
                  <div
                    className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold border"
                    style={{
                      borderColor: MATERIAL_QUALITY_INFO[m.materialQuality ?? 'common']?.color,
                      background: `${MATERIAL_QUALITY_INFO[m.materialQuality ?? 'common']?.color}15`,
                      color: qualityColor(m.materialQuality ?? 'common'),
                    }}
                  >
                    {m.iconChar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{m.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {m.materialTier}级 · {qualityLabel(m.materialQuality ?? 'common')}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 中间：转换比例 */}
      {selectedFrom && selectedTo && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl border border-border/50 bg-gradient-to-br from-card/60 to-card/30"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">放入</div>
              <div className="text-xl font-bold text-emerald-400">{fromQty}</div>
            </div>
            <div className="flex flex-col items-center">
              <ArrowRightLeft className="h-5 w-5 text-cyan-400" />
              <div className="text-[10px] text-cyan-300 mt-0.5">{conversionInfo.ratio}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">获得</div>
              <div className="text-xl font-bold text-amber-400">{conversionInfo.gotQty}</div>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground text-center mt-2">
            {conversionInfo.desc}
          </div>
        </motion.div>
      )}

      {/* 确认按钮 */}
      <Button
        className="w-full h-11 text-base"
        onClick={handleConvert}
        disabled={!selectedFrom || !selectedTo || fromQty <= 0 || conversionInfo.gotQty < 1 || fromQty > fromHaveQty}
      >
        确认转换
      </Button>

      {/* 规则说明 */}
      <div className="pt-2 border-t border-border/30 space-y-1.5">
        <div className="text-xs font-semibold text-cyan-200">转换规则</div>
        <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
          <li>高级材料转低级：每差1级，1个高级 = 2个低级</li>
          <li>低级材料转高级：每差1级，3个低级 = 1个高级</li>
          <li>同等级不同材料互换：2个换1个（有损耗）</li>
          <li>高品质转低品质：每差1档，1个 = 2个</li>
          <li>低品质转高品质：每差1档，2个 = 1个</li>
          <li>等级差和品质差叠加计算（相乘）</li>
        </ul>
      </div>
    </div>
  );
}
