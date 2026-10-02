import {useState,useRef,useEffect} from 'react';
import {TRIALS} from '@/lib/dragonLegend';

// Reward and entry costs stay sourced from the same trial definitions as combat.
export default function AscensionTower({player,hasSpirit,inBattle,onEnter}:{player:any;hasSpirit:boolean;inBattle:boolean;onEnter:(tier:number)=>void}){
 const [selected,setSelected]=useState(0),[imageReady,setImageReady]=useState(false),[imageFailed,setImageFailed]=useState(false),[retry,setRetry]=useState(0);
 const asset=((window as any).__BASENAME__||'').replace(/\/$/,'')+'/assets/ascension-tower-outline-v1.png?v=16c538e1'+(retry?'&retry='+retry:'');
 const fmt=(n:number)=>n.toLocaleString();
 const mapRef=useRef<HTMLDivElement>(null),[size,setSize]=useState({width:800,height:570});
 useEffect(()=>{const el=mapRef.current;if(!el)return;const measure=()=>{const {width,height}=el.getBoundingClientRect();if(width&&height)setSize({width,height});};measure();const observer=new ResizeObserver(measure);observer.observe(el);return()=>observer.disconnect();},[]);
 const scale=Math.min(size.width*.75/1024,size.height*.96/1536),tx=size.width*.235-512*scale,ty=(size.height-1536*scale)/2;
 const anchors=[{x:550,y:1270},{x:550,y:770},{x:550,y:245}],rows=[.825,.505,.185];
 return <div className="ascension-tower" data-ascension-tower>
  <style>{styles}</style>
  <div className="ascension-tower-heading"><span>升灵台 · 塔层试炼</span><small>由下至上 · 初级 / 中级 / 高级</small></div>
  <div ref={mapRef} className="ascension-tower-map" aria-label="初级至高级升灵台塔层示意图">
   <img className="tower-original-image" src={asset} alt="升灵台塔形轮廓" decoding="async" draggable={false} style={{left:tx,top:ty,width:1024*scale,height:1536*scale,visibility:imageReady?'visible':'hidden'}} onLoad={async e=>{try{await e.currentTarget.decode();setImageReady(true);setImageFailed(false);}catch{setImageFailed(true);}}} onError={()=>{setImageReady(false);setImageFailed(true);}}/>
   {!imageReady&&<div className="tower-image-state">{imageFailed?<><span>塔图加载失败</span><button className="dragon-quiet" onClick={()=>{setImageFailed(false);setRetry(n=>n+1);}}>重新加载</button></>:<span>塔图加载中…</span>}</div>}
   <svg viewBox={`0 0 ${size.width} ${size.height}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true" data-tower-connections>
    {anchors.map((p,i)=>{const x=tx+p.x*scale,y=ty+p.y*scale,endY=size.height*rows[i];return <g key={i} className={'tower-connector tier-'+i+(selected===i?' selected':'')} data-tower-connector={i}>
     <path d={`M ${x} ${y} H ${size.width*.455} L ${size.width*.50} ${endY} H ${size.width*.51}`} fill="none"/>
     <circle cx={x} cy={y} r="3"/><circle cx={x} cy={y} r="6" fill="none" opacity=".35"/>
    </g>;})}
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
.ascension-tower-map{position:relative;height:570px;max-width:800px;margin:8px auto 0}.ascension-tower-map>svg{width:100%;height:100%;display:block}
.tower-original-image{position:absolute;display:block;object-fit:contain;pointer-events:none;user-select:none}.tower-image-state{position:absolute;left:0;top:45%;width:47%;text-align:center;font-size:11px;color:#94a3b8;display:flex;flex-direction:column;gap:8px}.ascension-tower-map>svg{position:absolute;inset:0;pointer-events:none}.tower-connector{stroke:#22d3ee;stroke-width:1.2;fill:#083344;opacity:.5}.tower-connector path{vector-effect:non-scaling-stroke}.tower-connector.tier-1{stroke:#a78bfa}.tower-connector.tier-2{stroke:#d9a843}.tower-connector.selected{opacity:1;stroke-width:1.8;filter:drop-shadow(0 0 3px currentColor)}
.tower-stage{position:absolute;right:0;width:49%;transform:translateY(-50%);padding:13px;border-radius:10px;border:1px solid rgba(34,211,238,.25);background:rgba(6,20,32,.95)}
.tower-stage.tier-1{border-color:rgba(167,139,250,.3)}.tower-stage.tier-2{border-color:rgba(217,168,67,.35)}.tower-stage.selected{box-shadow:0 0 16px rgba(34,211,238,.09)}
.tower-stage-title{display:flex;justify-content:space-between;align-items:center;gap:5px}.tower-stage-title span{font-size:10px;color:#67e8f9;white-space:nowrap}.tier-1 .tower-stage-title span{color:#c4b5fd}.tier-2 .tower-stage-title span{color:#fcd34d}
.tower-stage-access{display:flex;justify-content:space-between;gap:5px;font-size:11px;color:#94a3b8;margin-top:5px}.tower-stage-access span{color:#6ee7b7}.tower-stage-access .locked{color:#64748b}
.tower-stage-reward{font-size:22px;color:#fcd34d;margin-top:8px}.tower-stage-reward small{font-size:11px}.tower-stage-cost{font-size:11px;color:#94a3b8;margin:4px 0 10px}.tower-stage .dragon-primary{font-size:12px}
@media(max-width:640px){.ascension-tower{padding:12px 8px;margin-bottom:calc(64px + env(safe-area-inset-bottom,0px))}.ascension-tower-heading{display:block}.ascension-tower-heading small{display:block;margin-top:4px}.ascension-tower-map{height:540px}.tower-stage{width:49%;padding:9px 7px}.dragon-ui .tower-stage h3{font-size:12px}.tower-stage-title{display:flex}.tower-stage-title span{font-size:9px}.tower-stage-access{font-size:10px;flex-wrap:wrap}.tower-stage-reward{font-size:19px;margin-top:5px}.tower-stage-cost{font-size:10px;line-height:1.6}.tower-stage .dragon-primary{font-size:11px;padding:7px 3px;min-height:38px}}
`;
