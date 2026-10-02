import {useState} from 'react';
import {TRIALS} from '@/lib/dragonLegend';

// Reward and entry costs stay sourced from the same trial definitions as combat.
export default function AscensionTower({player,hasSpirit,inBattle,onEnter}:{player:any;hasSpirit:boolean;inBattle:boolean;onEnter:(tier:number)=>void}){
 const [selected,setSelected]=useState(0);
 const fmt=(n:number)=>n.toLocaleString();
 const anchors=[{x:285,y:790},{x:310,y:505},{x:300,y:205}];
 const asset=((window as any).__BASENAME__||'').replace(/\/$/,'')+'/assets/ascension-tower-outline-v1.png';
 return <div className="ascension-tower" data-ascension-tower>
  <style>{styles}</style>
  <div className="ascension-tower-heading"><span>升灵台 · 塔层试炼</span><small>由下至上 · 初级 / 中级 / 高级</small></div>
  <div className="ascension-tower-map" aria-label="初级至高级升灵台塔层示意图">
   <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
    <image href={asset} x="0" y="0" width="540" height="1000" preserveAspectRatio="xMidYMid meet"/>
    {anchors.map((p,i)=><g key={i} className={'tower-connector tier-'+i+(selected===i?' selected':'')} data-tower-connector={i}>
     <path d={`M ${p.x} ${p.y} H 470 L 545 ${[825,505,185][i]} H 570`} fill="none"/>
     <circle cx={p.x} cy={p.y} r="8"/><circle cx={p.x} cy={p.y} r="17" fill="none" opacity=".35"/>
    </g>)}
   </svg>
   {TRIALS.map((t,i)=>{const locked=player.level<t.level||!hasSpirit;return <article key={t.name} className={'tower-stage tier-'+i+(selected===i?' selected':'')} style={{top:[82.5,50.5,18.5][i]+'%'}} data-tower-tier={i} onMouseEnter={()=>setSelected(i)} onFocus={()=>setSelected(i)}>
    <div className="tower-stage-title"><h3>{t.name}</h3><span>{['下层','中层','上层'][i]}</span></div>
    <div className="tower-stage-access">{t.level}级解锁 <span className={locked?'locked':''}>{locked?'未解锁':'可挑战'}</span></div>
    <div className="tower-stage-reward">+{fmt(t.reward)} <small>灵力</small></div>
    <div className="tower-stage-cost">体力 {t.stamina} · 魂币 {fmt(t.coins)}</div>
    <button className="dragon-primary" disabled={locked||inBattle} onClick={()=>onEnter(i)}>挑战{t.name}</button>
   </article>})}
  </div>
  {!hasSpirit&&<p className="dragon-hint">先契约一个普通魂灵，即可在达到对应等级后进入试炼。</p>}
 </div>;
}
const styles=`
.ascension-tower{border:1px solid rgba(100,150,165,.22);border-radius:14px;padding:18px 14px;background:radial-gradient(ellipse at 27% 45%,rgba(8,145,178,.09),transparent 65%),rgba(15,23,42,.4);overflow:hidden}
.ascension-tower-heading{display:flex;justify-content:space-between;gap:12px;align-items:center;color:#a5f3fc;font-size:13px}.ascension-tower-heading small{font-size:11px;color:#94a3b8}
.ascension-tower-map{position:relative;height:610px;max-width:800px;margin:8px auto 0}.ascension-tower-map>svg{width:100%;height:100%;display:block}
.tower-connector{stroke:#22d3ee;stroke-width:1.2;fill:#083344;opacity:.5}.tower-connector path{vector-effect:non-scaling-stroke}.tower-connector.tier-1{stroke:#a78bfa}.tower-connector.tier-2{stroke:#d9a843}.tower-connector.selected{opacity:1;stroke-width:1.8;filter:drop-shadow(0 0 3px currentColor)}
.tower-stage{position:absolute;right:0;width:43%;transform:translateY(-50%);padding:13px;border-radius:10px;border:1px solid rgba(34,211,238,.25);background:rgba(6,20,32,.95)}
.tower-stage.tier-1{border-color:rgba(167,139,250,.3)}.tower-stage.tier-2{border-color:rgba(217,168,67,.35)}.tower-stage.selected{box-shadow:0 0 16px rgba(34,211,238,.09)}
.tower-stage-title{display:flex;justify-content:space-between;align-items:center;gap:5px}.tower-stage-title span{font-size:10px;color:#67e8f9;white-space:nowrap}.tier-1 .tower-stage-title span{color:#c4b5fd}.tier-2 .tower-stage-title span{color:#fcd34d}
.tower-stage-access{display:flex;justify-content:space-between;gap:5px;font-size:11px;color:#94a3b8;margin-top:5px}.tower-stage-access span{color:#6ee7b7}.tower-stage-access .locked{color:#64748b}
.tower-stage-reward{font-size:22px;color:#fcd34d;margin-top:8px}.tower-stage-reward small{font-size:11px}.tower-stage-cost{font-size:11px;color:#94a3b8;margin:4px 0 10px}.tower-stage .dragon-primary{font-size:12px}
@media(max-width:640px){.ascension-tower{padding:12px 8px}.ascension-tower-heading{display:block}.ascension-tower-heading small{display:block;margin-top:4px}.ascension-tower-map{height:600px}.tower-stage{width:43%;padding:9px 7px}.dragon-ui .tower-stage h3{font-size:12px}.tower-stage-title{display:block}.tower-stage-title span{font-size:9px}.tower-stage-access{font-size:10px;flex-wrap:wrap}.tower-stage-reward{font-size:19px;margin-top:5px}.tower-stage-cost{font-size:10px;line-height:1.6}.tower-stage .dragon-primary{font-size:11px;padding:7px 3px;min-height:38px}}
`;
