import {armorBonuses,armorBonusBreakdown,dragonProgress} from '@/lib/dragonLegend';
import {formatNumber} from '@/lib/utils';
export default function ArmorContribution({player,attributes}:{player:any;attributes:any}){
 const d=dragonProgress(player),bonus=armorBonuses(player),b=armorBonusBreakdown(player);
 if(!d.parts.some(x=>x>0))return null;
 const labels={attack:'攻击',defense:'防御',speed:'速度',spirit:'精神',hp:'气血'};
 return <div className="mt-3 pt-3 border-t border-cyan-500/20" data-armor-contribution>
 <div className="flex justify-between mb-2 text-xs"><h4 className="font-semibold text-amber-300">斗铠属性贡献</h4><span className="text-cyan-300">{d.equipped?'已装备 · 生效中':'未装备 · 当前加成为零'}</span></div>
 <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">{Object.keys(bonus).map(k=>{
 // Armor is the final five-stat multiplier in calcAttributes; reverse that multiplier.
 const amount=Math.round(attributes[k]-attributes[k]/(1+bonus[k]));
 return <div key={k} className="rounded-lg border border-cyan-500/20 p-2 text-xs"><span className="text-cyan-400">{labels[k]}</span><strong className="block text-cyan-200">+{formatNumber(amount)}</strong><span className="text-cyan-400">+{(bonus[k]*100).toFixed(1)}%</span></div>})}</div>
 <p className="text-[10px] text-cyan-400 mt-2">装备后构成：部件五维 +{(b.parts*100).toFixed(1)}%；套装方向{labels[b.directionKey]} +{(b.direction*100).toFixed(1)}%；属性契合{labels[b.resonanceKey]} +{(b.resonance*100).toFixed(1)}%。数值为当前面板中斗铠贡献的约值，包含取整。</p>
 </div>;
}
