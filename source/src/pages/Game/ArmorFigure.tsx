import {useState} from 'react';
import {ARMOR_PARTS,armorCraftRequirements,armorBonuses,dragonProgress} from '@/lib/dragonLegend';

// Left/right names follow the character, who faces the viewer.
const points = [
 {x:378,y:88,side:'left',row:70},
 {x:373,y:257,side:'left',row:330},
 {x:460,y:203,side:'right',row:190},
 {x:324,y:196,side:'left',row:210},
 {x:528,y:176,side:'right',row:70},
 {x:250,y:382,side:'left',row:450},
 {x:378,y:322,side:'right',row:320},
 {x:423,y:442,side:'right',row:460},
 {x:333,y:437,side:'left',row:570},
 {x:468,y:678,side:'right',row:650},
 {x:287,y:666,side:'left',row:690},
];
export default function ArmorFigure({player,onCraft}:{player:any;onCraft:(part:number)=>void}){
 const [selected,setSelected]=useState(1),d=dragonProgress(player),parts=d.parts,level=parts[selected]||0,req=armorCraftRequirements(player,selected);const nextParts=parts.map((x,i)=>i===selected?Math.min(4,x+1):x);const before=armorBonuses({...player,dragonLegend:{...d,equipped:true}}),after=armorBonuses({...player,dragonLegend:{...d,parts:nextParts,equipped:true}});
 return <div className="armor-figure-layout">
 <div><div className="armor-figure-heading"><span>斗铠部位</span><span>{parts.filter(x=>x>0).length}/11 已制作</span></div>
 <div className="armor-figure" aria-label="斗铠人物部位示意图">
 <svg viewBox="0 0 760 780" aria-hidden="true">
 <ellipse cx="380" cy="728" rx="180" ry="24" fill="none" stroke="currentColor" opacity=".15"/>
 <path d="M380 22V755 M180 380H580" stroke="currentColor" strokeDasharray="3 12" opacity=".08"/>
 <image href="assets/armor-outline-v1.png" x="150" y="30" width="460" height="711" opacity=".78"/>
 {points.map((p,i)=>{const left=p.side==='left',edge=left?152:608,bend=left?177:583,color=selected===i?'#fcd34d':parts[i]>=3?'#fcd34d':parts[i]===2?'#c4b5fd':parts[i]===1?'#22d3ee':'#526578';return <g key={i} stroke={color} fill="none"><path d={`M${edge} ${p.row} H${bend} L${p.x} ${p.y}`} strokeWidth={selected===i?2:1} opacity={selected===i?1:.7}/><circle cx={p.x} cy={p.y} r={selected===i?7:4} fill={color} fillOpacity=".25"/><circle cx={p.x} cy={p.y} r="2" fill={color}/></g>})}
 </svg>
 {points.map((p,i)=><button key={i} className={'armor-slot '+p.side+(parts[i]>=3?' tier-three':parts[i]===2?' tier-two':parts[i]===1?' made':'')+(selected===i?' selected':'')} style={{top:(p.row/780*100)+'%'}} aria-label={ARMOR_PARTS[i]+'，'+['未制作','一字','二字','三字','四字'][parts[i]||0]} aria-pressed={selected===i} onClick={()=>setSelected(i)}><span>{ARMOR_PARTS[i]}</span><small>{['未制作','一字','二字','三字','四字'][parts[i]||0]}</small></button>)}
 </div><div className="armor-legend"><span>灰色 · 未制作</span><span>青色 · 一字</span><span>紫色 · 二字</span><span>金色 · 三／四字</span></div><p className="dragon-hint">点击部位查看详情。左右以人物自身为准。</p></div>
 <div className="armor-detail" aria-live="polite"><div className="dragon-section-title">{ARMOR_PARTS[selected]}<span className="dragon-badge">{['未制作','一字','二字','三字','四字'][level]}</span></div><p className="dragon-muted">{d.equipped?'斗铠已装备，已制作部件正在生效。':'斗铠未装备，下列数值为装备后的预览。'}</p><div className="dragon-row"><span>部件五维加成</span><b className="dragon-gold">+{(level*.3).toFixed(1)}%{level<4?' → +'+((level+1)*.3).toFixed(1)+'%':''}</b></div>{level<4?<><div className="armor-compare"><span>制作／晋升后整套加成</span>{Object.keys(before).map(k=><div className="dragon-row" key={k}><span>{({attack:'攻击',defense:'防御',speed:'速度',spirit:'精神',hp:'气血'})[k]}</span><b>+{(before[k]*100).toFixed(1)}% → +{(after[k]*100).toFixed(1)}%</b></div>)}</div><div className="dragon-row"><span>{req.material}</span><b className={req.missingMaterial?'dragon-red':'dragon-green'}>{req.owned}/2{req.missingMaterial?' · 缺'+req.missingMaterial:''}</b></div><div className="dragon-row"><span>魂币</span><b className={req.missingCoins?'dragon-red':'dragon-green'}>{req.coins.toLocaleString()}{req.missingCoins?' · 缺'+req.missingCoins.toLocaleString(): ' · 已足够'}</b></div><p className="dragon-hint">需要{req.level}级、主修{req.rings}环{req.missingLevel?'；还差'+req.missingLevel+'级':''}{req.missingRings?'；还差'+req.missingRings+'环':''}</p><button className="dragon-primary" disabled={!req.ready} onClick={()=>onCraft(selected)}>{req.ready?(level?'晋升所选部件至'+(level===1?'二字':level===2?'三字':'四字'):'制作所选部件'):'条件不足'}</button></>:<p className="dragon-green">已达四字部件上限</p>}</div>
 </div>;
}
