import {useRef,useState,useEffect} from 'react';
import {useGame} from '@/lib/gameStore';
import {ABYSS_CHAPTERS,ABYSS_NODES,abyssProgress,abyssRequirements,abyssEnemy,abyssReward,abyssAction,type AbyssMode} from '@/lib/abyssFrontier';
import {dragonStyles} from './DragonLegendPanel';
import {toast} from 'sonner';

export default function AbyssFrontierPanel({onBack}:{onBack:()=>void}){
 const {player,inBattle,setPlayer,startBattle}=useGame(),gate=useRef(false);
 const [mode,setMode]=useState<AbyssMode>(()=>abyssProgress(player).lastMode);
 useEffect(()=>{if(!inBattle)gate.current=false;},[inBattle]);
 if(!player)return null;const d=abyssProgress(player);
 function act(a:any){if(inBattle)return;const now=Date.now(),result=abyssAction(player,a,now);if(result.reason)return toast.error(result.reason);setPlayer(p=>abyssAction(p,a,now).player);toast.success(result.message);}
 function enter(node:string){
  if(inBattle||gate.current)return;gate.current=true;
  const id=crypto.randomUUID(),now=Date.now(),action={type:'enter',id,node,mode},result=abyssAction(player,action,now);
  if(result.reason){gate.current=false;return toast.error(result.reason);}
  const first=!d.cleared.includes(mode+':'+node),reward=abyssReward(node,mode,first);
  setPlayer(p=>abyssAction(p,action,now).player);
  startBattle({battleType:'challenge',locationId:'abyss-frontier',enemy:abyssEnemy(node,mode),meta:{abyss:{id,node,mode,first,reward}}} as any);
 }
 return <section className="dragon-ui" data-abyss-frontier>
 <style>{dragonStyles}</style>
 <div className="dragon-summary"><button className="dragon-quiet" onClick={onBack}>← 返回地图</button><span className="dragon-pill">军功 {d.merit.toLocaleString()} · 结晶 {d.crystals.toLocaleString()}</span></div>
 <div className="dragon-card"><div className="dragon-card-head"><div className="dragon-emblem">渊</div><div><h3>血神军团 · 深渊前线</h3><p className="dragon-muted">三章九关，逐关推进；已通关的关卡可以重复挑战。</p></div></div>
 <label className="dragon-field">挑战难度<select aria-label="深渊难度" value={mode} onChange={e=>setMode(e.target.value as AbyssMode)}><option value="standard">封号难度 · 99级</option><option value="divine">神位难度 · 100级并继承神位</option></select></label>
 <p className="dragon-hint">敌人数值随章节与难度固定，不随你的装备变化。胜利直接入账；失败、逃跑不退还入场消耗。不掉魂环或魂骨。</p></div>
 {d.trial&&!d.trial.claimed&&<div className="dragon-warning">存在未结束的深渊挑战<button className="dragon-secondary" onClick={()=>act({type:'leave',id:d.trial.id})}>放弃未结束的深渊挑战</button></div>}
 {ABYSS_CHAPTERS.map((c,i)=><div className="dragon-card" key={c.name}><div className="dragon-section-title"><span>第{i+1}章 · {c.name}</span><span className="dragon-muted">{ABYSS_NODES.filter(n=>n.chapter===i&&d.cleared.includes(mode+':'+n.id)).length}/3</span></div><p className="dragon-muted">{c.desc}</p><div className="dragon-grid forge" style={{marginTop:12}}>{ABYSS_NODES.filter(n=>n.chapter===i).map(n=>{
  const r=abyssRequirements(player,n.id,mode),cleared=d.cleared.includes(mode+':'+n.id),reward=abyssReward(n.id,mode,!cleared);
  return <div className="dragon-card" key={n.id}><div className="dragon-section-title"><span>{n.name}</span><span className="dragon-badge">{['普通','精英','首领'][n.rank]}</span></div><p className="dragon-muted">机制：{n.mechanic}</p><p className="dragon-hint">军功 +{reward.merit}{reward.crystals?' · 结晶 +'+reward.crystals:''}</p>{!cleared&&<p className="dragon-hint">首通：矿石 +{reward.ore}{reward.soulforged?' · 魂锻沉银 +1':''}</p>}<p className="dragon-hint">体力 {r.stamina} · 魂币 {r.coins.toLocaleString()}</p><button className="dragon-primary" disabled={!!r.reason||inBattle||!!d.trial&&!d.trial.claimed} onClick={()=>enter(n.id)} aria-label={'挑战'+n.name}>{r.reason||'挑战'+n.name}</button>{cleared&&<p className="dragon-green">已通关 · 可重复挑战</p>}</div>;
 })}</div></div>)}
 <div className="dragon-card"><div className="dragon-section-title">军功兑换</div><div className="dragon-grid forge"><button className="dragon-secondary" disabled={d.merit<40||inBattle} onClick={()=>act({type:'exchange',material:'ore'})}>40军功 → 沉银矿石 ×10</button><button className="dragon-secondary" disabled={d.merit<200||inBattle} onClick={()=>act({type:'exchange',material:'soulforged'})}>200军功 → 魂锻沉银 ×1</button></div><p className="dragon-hint">首领重复胜利仍获得1枚深渊结晶，用于神锻。转世保留通关记录，军功与结晶重置；首通奖励不重复发放。</p></div>
 </section>;
}
