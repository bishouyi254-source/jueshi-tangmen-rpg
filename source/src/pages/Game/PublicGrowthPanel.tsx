import {useState} from 'react';
import type {IReincarnationOrb} from '@/lib/gameStore';
import {sanitizePublicGrowth} from '@/lib/publicGrowth';
import {ARMOR_PARTS} from '@/lib/dragonLegend';
import {GOLD_EVOLUTIONS} from '@/lib/goldKing';
import {SILVER_BODY} from '@/lib/silverKing';
import {TWIN_STAGES} from '@/lib/twinDragon';
import {combatPower} from '@/lib/leaderboard';
import {formatNumber} from '@/lib/utils';

export function PublicLoadout({orb}:{orb:IReincarnationOrb}) {
 const groups=[{name:'主修魂环',items:(orb.soulRings||[]).map((x,i)=>({label:`第${i+1}魂环`,x}))},...(orb.isTwinSoul?[{name:'次修魂环',items:(orb.secondSoulRings||[]).map((x,i)=>({label:`第${i+1}魂环`,x}))}]:[]),{name:'魂骨详情',items:Object.entries(orb.soulBones||{}).filter(([,x])=>x).map(([label,x])=>({label,x}))},{name:'装备详情',items:Object.entries(orb.equipment||{}).filter(([,x])=>x).map(([label,x])=>({label,x}))}];
 const labels:Record<string,string>={head:'头部',torso:'躯干',leftArm:'左臂',rightArm:'右臂',leftLeg:'左腿',rightLeg:'右腿',external:'外附',weapon:'武器',armor:'防具',accessory:'饰品',attack:'攻击',defense:'防御',speed:'速度',spirit:'精神',hp:'气血',critRate:'暴击率',critDmg:'暴伤',soulPower:'魂力',allAttr:'全属性'};
 const g=sanitizePublicGrowth(orb.publicGrowth),domain=[orb.domainName,g?.gold.unlocked&&g.gold.seals>=6?'金龙镇狱领域':null,g?.silver.unlocked&&Object.values(g.silver.elements).filter(x=>x>0).length>=3?'银龙元素领域':null].filter(Boolean);
 return <div className="space-y-3" aria-label="魂环魂骨与装备详情">{groups.map(group=><section key={group.name} className="rounded-lg border border-border/40 bg-black/20 p-3"><h4 className="text-sm text-cyan-200 font-semibold mb-2">{group.name}</h4>{group.items.length?group.items.map(({label,x}:any,i)=><details key={i} className="text-xs border-t border-border/20 py-2"><summary className="cursor-pointer text-foreground">{labels[label]||label} · {x.name||x.skillName||'未命名'}{(x.years||x.year)?` · ${formatNumber(x.years||x.year)}年`:''}</summary><div className="mt-2 space-y-1 text-muted-foreground">{x.skillName&&<p>魂技：{x.skillName}</p>}{(x.skillDesc||x.skillDescription||x.description)&&<p>{x.skillDesc||x.skillDescription||x.description}</p>}{(x.element||x.beastAttribute)&&<p>属性：{x.element||x.beastAttribute}</p>}{x.skillDamagePct!=null&&<p>魂技伤害：{formatNumber(x.skillDamagePct*100)}%</p>}{Object.entries(x.attributes||{}).map(([k,v])=><p key={k}>{labels[k]||k}：{formatNumber(Number(v))}</p>)}</div></details>):<p className="text-xs text-muted-foreground">此世尚未装备</p>}</section>)}<p className="text-xs text-muted-foreground">此世可展开领域：{[...new Set(domain)].join('、')||'尚未解锁'}</p></div>;
}

export function CharacterComparison({other,mine}:{other:IReincarnationOrb;mine:IReincarnationOrb}) {
 const rows=[['等级',other.level,mine.level],['战力',combatPower(other.attributes),combatPower(mine.attributes)],...(['attack','defense','speed','spirit','hp','maxSoulPower'] as const).map((k,i)=>[['攻击','防御','速度','精神','气血','魂力上限'][i],other.attributes[k]||0,mine.attributes[k]||0])];
 return <section className="rounded-xl border border-cyan-500/20 bg-card/40 p-3 space-y-3" aria-label="与我对比"><p className="text-xs text-muted-foreground">对方公开今生快照与我的今生属性对比，差值＝对方－我。</p><div className="overflow-x-auto"><table className="w-full text-xs text-right"><thead><tr className="text-muted-foreground"><th className="text-left py-2">项目</th><th>对方</th><th>我</th><th>差值</th></tr></thead><tbody>{rows.map(([label,a,b])=>{const delta=Number(a)-Number(b);return <tr key={String(label)} className="border-t border-border/30"><th className="text-left py-2 font-normal">{label}</th><td>{formatNumber(Number(a))}</td><td>{formatNumber(Number(b))}</td><td className={delta>0?'text-amber-300':delta<0?'text-cyan-300':'text-muted-foreground'}>{delta>0?'+':delta<0?'−':''}{formatNumber(Math.abs(delta))}</td></tr>;})}</tbody></table></div></section>;
}
export default function PublicGrowthPanel({current,history}:{current:IReincarnationOrb;history:IReincarnationOrb[]}) {
 const [life,setLife]=useState('current');
 const orb=life==='current'?current:history.find(o=>String(o.index)===life);
 const g=sanitizePublicGrowth(orb?.publicGrowth);
 const box='rounded-xl border border-border/40 bg-card/40 p-3 space-y-2';
 return <div className="space-y-3"><label className="flex items-center gap-2 text-xs text-muted-foreground">查看哪一世<select aria-label="成长系统所属世数" className="min-w-0 flex-1 rounded-lg border border-border/40 bg-card p-2 text-foreground" value={life} onChange={e=>setLife(e.target.value)}><option value="current">今生 · 第{current.index}世</option>{[...history].sort((a,b)=>b.index-a.index).map(o=><option key={o.index} value={String(o.index)}>第{o.index}世 · {o.name}</option>)}</select></label>
 <p className="text-xs text-muted-foreground">只读成长快照 · {life==='current'?'今生':`第${orb?.index}世`}，未记录的进度不会借用今生数据。</p>
 {!g?<p className={box+' text-sm text-muted-foreground'}>此世未记录成长系统快照。</p>:<>
 <section className={box}><h3 className="font-semibold text-cyan-200">锻造斗铠</h3><p className="text-xs">{g.armor.tier?['','一字','二字','三字','四字'][g.armor.tier]+'斗铠':'尚未完成整套斗铠'}{g.armor.name?' · '+g.armor.name:''} · {g.armor.equipped?'已装备':'未装备'}</p><div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">{ARMOR_PARTS.map((p,i)=><p key={p}>{p}：{g.armor.parts[i]}/4阶</p>)}</div></section>
 <section className={box}><h3 className="font-semibold text-amber-300">金龙王血脉</h3>{!g.gold.unlocked?<p className="text-xs text-muted-foreground">未解锁 · 此世未持有有效金龙王武魂</p>:<><p className="text-xs">十八道封印 {g.gold.seals}/18 · 霸血成长 {g.gold.points}/2000</p><div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">{GOLD_EVOLUTIONS.map(e=><p key={e.id}>{e.name}：{g.gold.evolutions[e.id]}/4阶</p>)}</div></>}</section>
 <section className={box}><h3 className="font-semibold text-indigo-200">银龙王血脉</h3>{!g.silver.unlocked?<p className="text-xs text-muted-foreground">未解锁 · 此世未持有有效银龙王武魂</p>:<><p className="text-xs">元素感悟 {g.silver.points}/2000</p><div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">{Object.entries(g.silver.elements).map(([e,n])=><p key={e}>{e}：{n}/4阶</p>)}</div><div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">{SILVER_BODY.map(e=><p key={e.id}>{e.name}：{g.silver.body[e.id]}/4阶</p>)}</div></>}</section>
 <section className={box}><h3 className="font-semibold text-cyan-200">金银共鸣</h3>{!g.twin.unlocked?<p className="text-xs text-muted-foreground">未解锁 · 需要有效双生金龙王与银龙王</p>:<><p className="text-xs">共鸣值 {g.twin.points}/2000 · 已成长 {g.twin.stage}/5阶段</p><p className="text-xs text-muted-foreground">当前生效：{g.twin.activeStage?TWIN_STAGES[g.twin.activeStage-1].name:'尚未满足生效条件'}{g.twin.stage>g.twin.activeStage?'（已成长阶段尚未全部生效）':''}</p></>}</section>
 </>}
 </div>;
}
