import { useState, useEffect } from 'react';
import { useGame } from '@/lib/gameStore';
import { toast } from 'sonner';
export default function SweepSettings() {
  const { player, setSweepFilters } = useGame();
  const [ring, setRing] = useState('0'), [bone, setBone] = useState('0');
  useEffect(() => { setRing(String(player?.sweepAutoDestroyRingYears || 0)); setBone(String(player?.sweepAutoSellBoneYears || 0)); }, [player?.sweepAutoDestroyRingYears, player?.sweepAutoSellBoneYears]);
  function save() {
    if (![ring,bone].every(x => /^\d+$/.test(x) && Number.isSafeInteger(Number(x)))) { toast.error('请输入有效的非负整数年限'); return; }
    setSweepFilters(Number(ring), Number(bone)); toast.success('扫荡筛选已保存');
  }
  return <details className="rounded-xl border border-cyan-500/25 bg-card/60 p-3" data-sweep-settings>
    <summary className="text-sm text-cyan-300 cursor-pointer">扫荡掉落筛选</summary>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
      <label className="text-xs text-muted-foreground">魂环最低保留年限<input aria-label="魂环最低保留年限" type="text" inputMode="numeric" value={ring} onChange={e=>setRing(e.target.value)} className="mt-1 w-full rounded-lg border border-cyan-500/25 bg-background px-3 py-2 text-foreground" /></label>
      <label className="text-xs text-muted-foreground">魂骨最低保留年限<input aria-label="魂骨最低保留年限" type="text" inputMode="numeric" value={bone} onChange={e=>setBone(e.target.value)} className="mt-1 w-full rounded-lg border border-cyan-500/25 bg-background px-3 py-2 text-foreground" /></label>
    </div><p className="text-xs text-muted-foreground mt-2">0 表示关闭。仅处理本次扫荡掉落：低于下限的魂环销毁，可出售魂骨出售；等于下限保留。</p>
    <button onClick={save} className="mt-3 rounded-lg border border-cyan-500/30 bg-cyan-500/15 px-4 py-2 text-sm text-cyan-200">保存筛选</button>
  </details>;
}
