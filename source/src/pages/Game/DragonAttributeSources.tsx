import {dragonAttributeSources} from '@/lib/gameStore';
import {goldDomainDescription} from '@/lib/goldDominance';
import {silverDomain} from '@/lib/silverKing';
const labels:any={attack:'攻击',defense:'防御',speed:'速度',spirit:'精神',hp:'气血',mana:'魂力上限'};
const pct=(n:number)=>(n*100).toFixed(2).replace(/\.?0+$/,'')+'%';
const bonuses=(obj:any,mult=false)=>Object.entries(labels).filter(([k])=>Number.isFinite(obj?.[k])&&obj[k]>(mult?1:0)).map(([k,label])=>label+' +'+pct(mult?obj[k]-1:obj[k])).join(' · ')||'当前无额外加成';
export default function DragonAttributeSources({player}:{player:any}){
 const s=dragonAttributeSources(player);if(!s)return null;const d=silverDomain(player);
 return <details data-dragon-attribute-sources className="rounded-xl border border-cyan-500/30 bg-card/60 p-3 text-xs text-cyan-100 mb-3">
  <summary className="cursor-pointer font-semibold text-cyan-300">属性来源 · 金银龙王</summary>
  <div className="space-y-3 pt-3 break-words">
   <p className="text-muted-foreground">以下展示各阶段系数；不同阶段按结算顺序相乘，不能直接相加成最终属性。角色面板还包含等级、装备、神位等其他来源。</p>
   {s.souls.map((x:any)=><div key={x.secondary?'secondary':'main'} className="border-t border-border/40 pt-2">
    <p className="font-semibold">{x.secondary?'次修':'主修'} · {x.soul.name}</p>
    <p>{x.soul.extremeAttribute||x.soul.element||'无属性'}</p>
    <p className="text-muted-foreground">武魂原始五维：{Object.entries(labels).filter(([k])=>k!=='mana').map(([k,label])=>label+' '+(x.soul.baseStats?.[k]||0)).join(' · ')}</p>
    <p>极致能力：{bonuses(x.extreme,true)}</p>
    {x.soul.extremeAttribute==='全属性'&&!x.secondary&&<p>全属性附带：暴击率 +8% · 爆伤 +15%</p>}
    <p>共鸣：魂环 {x.resonance.hasRingMatch?'已匹配 +5%':'未匹配'} · 魂骨 {x.resonance.hasBoneMatch?'已匹配 +5%':'未匹配'}；常驻五维 +{pct(x.resonance.bonusPct)}</p>
    <p className="text-muted-foreground">魂环与魂骨各最多计算一次。力量、速度、防御不作为元素；时间与空间分别判定。</p>
   </div>)}
   <div className="border-t border-border/40 pt-2"><p className="font-semibold">常驻成长</p><p>血脉与成长：{bonuses(s.blood)}</p><p>斗铠：{bonuses(s.armor)}</p><p>攻击魂技成长：金龙 +{pct(s.skill.gold)} · 银龙 +{pct(s.skill.silver)}</p></div>
   <div className="border-t border-border/40 pt-2"><p className="font-semibold">战斗临时效果</p>{s.souls.some((x:any)=>x.soul.name==='金龙王')&&<p>金龙镇狱领域：{goldDomainDescription(player)}</p>}{s.souls.some((x:any)=>x.soul.name==='银龙王')&&<p>银龙元素领域：{d?'入战展开3次行动；银龙攻击魂技伤害 +'+pct(d.damage)+'，魂力消耗 -'+pct(d.cost):'掌控至少3种元素后解锁'}。七元素是成长路线，全属性是武魂匹配范围。</p>}<p className="text-muted-foreground">金银龙王领域、战斗真身和魂技增益在战斗内生效，不提前加入常驻面板。金银领域可共存，各自结束；直接伤害增幅在同一阶段相加一次。</p></div>
   <div className="border-t border-border/40 pt-2"><p className="font-semibold">魂环保存系数</p><p className="text-muted-foreground">魂环伤害系数保留吸收或成长时的契合度；战斗不再次乘契合度。共鸣提升常驻五维，详情页不会再额外增加5%伤害。</p></div>
  </div>
 </details>;
}
