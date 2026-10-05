import {formatNumber as powerText} from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { Trophy, RefreshCw, ChevronLeft, User, Crown, Medal } from 'lucide-react';
import { useGame, getRealmDisplay } from '@/lib/gameStore';
import { combatPower, ownProfile, publicLeaderboardAPI } from '@/lib/leaderboard';
import type { PublicProfile, RankEntry, LeaderboardAPI } from '@/lib/leaderboard';
import ReincarnationHistoryPanel from './ReincarnationHistoryPanel';
import { useCloud } from '@/components/CloudAccount';
export function LeaderboardView({ self, api, onBack }: {self: PublicProfile; api: LeaderboardAPI | null; onBack: () => void}) {
  const [entries,setEntries] = useState<RankEntry[]>([]), [myRank,setMyRank] = useState<RankEntry|null>(null);
  const [selected,setSelected] = useState<PublicProfile|null>(null), [mode,setMode] = useState<'current'|'history'>('current');
  const [busy,setBusy] = useState(false), [error,setError] = useState(''), [updated,setUpdated] = useState(0);
  const [seconds,setSeconds] = useState(300); const alive = useRef(true), locked = useRef(false), request = useRef(0);
  const [consent,setConsent] = useState(false), [notice,setNotice] = useState('');
  const [rankTab,setRankTab]=useState<'all'|'top'|'mine'>('all');
  async function publish() {
    if(!api?.publish || !consent || locked.current)return;
    let success=false;
    locked.current=true;setBusy(true);setError('');
    try {await api.publish(self,true);success=true;if(alive.current)setNotice('公开档案已更新');}
    catch(e:any){if(alive.current)setError(e.message || '公开档案更新失败');}
    finally{locked.current=false;if(alive.current)setBusy(false);}
    if(alive.current && success)await refresh();
  }
  async function refresh() {
    if (!api || locked.current) return;
    const id = ++request.current; locked.current=true;setBusy(true);setError('');
    try { const r = await api.list(); if(alive.current && id===request.current){setEntries(r.entries.slice(0,100));setMyRank(r.self);setUpdated(r.updatedAt);setSeconds(300);} }
    catch(e:any){if(alive.current && id===request.current)setError(e.message || '排行榜读取失败，请稍后重试');}
    finally { locked.current=false;if(alive.current)setBusy(false); }
  }
  useEffect(()=>{alive.current=true;refresh();const timer=setInterval(()=>setSeconds(s=>Math.max(0,s-1)),1000);return()=>{alive.current=false;request.current++;clearInterval(timer);};},[api]);
  useEffect(()=>{if(seconds===0 && api && !busy){refresh();setSeconds(300);}},[seconds,api,busy]);
  async function open(id:string) {
    if(!api || locked.current)return; const ticket=++request.current;locked.current=true;setBusy(true);setError('');
    try { const p=await api.profile(id);if(alive.current && ticket===request.current){setSelected(p);setMode('current');} }
    catch(e:any){if(alive.current && ticket===request.current)setError(e.message || '人物详情读取失败');}
    finally{locked.current=false;if(alive.current)setBusy(false);}
  }
  if(selected)return <div className="space-y-4">
    <button className="flex items-center gap-1 text-sm text-cyan-300" onClick={()=>setSelected(null)}><ChevronLeft size={16}/>返回排行榜</button>
    <h2 className="font-bold text-lg">{selected.current.name} · 人物档案</h2>
    <p className="text-xs text-muted-foreground">{selected.publicId==='local-self'?'当前设备预览':'公开资料快照'} · {new Date(selected.updatedAt).toLocaleString()}</p>
    <div className="flex gap-2">{(['current','history'] as const).map(m=><button key={m} className={'px-4 py-2 rounded-xl border text-sm '+(mode===m?'border-cyan-400/50 bg-cyan-900/30 text-cyan-200':'border-border/40 bg-card/40 text-muted-foreground')} onClick={()=>setMode(m)}>{m==='current'?'当前角色':`历代轮回（${selected.history.length}世）`}</button>)}</div>
    <ReincarnationHistoryPanel key={selected.publicId+mode} onClose={()=>setSelected(null)} externalOrbs={mode==='current'?[selected.current]:selected.history} readOnly currentView={mode==='current'} title={mode==='current'?'当前角色详情':'历代轮回'}/>
  </div>;
  const shown=rankTab==='top'?entries.slice(0,3):rankTab==='mine'?(myRank?[myRank]:[]):entries;
  const minePower=powerText(combatPower(self.current.attributes));
  const souls=[self.current.martialSoul?.name,self.current.isTwinSoul?self.current.secondSoul?.name:null].filter(Boolean).join(' · ');
  const medal=(rank:number)=>rank===1?<Crown size={21}/>:rank<=3?<Medal size={21}/>:<span>{rank}</span>;
  return <section className="rank-view" aria-label="战力排行榜">
    <style>{`
      .rank-view{max-width:1080px;margin:0 auto;color:var(--foreground);font-size:14px}
      .rank-head{display:flex;align-items:center;gap:10px;padding:14px 12px;border-bottom:1px solid rgba(148,163,184,.14)}
      .rank-head h2{font-size:18px;font-weight:700;margin:0;display:flex;align-items:center;gap:8px}
      .rank-head h2 svg{color:#fbbf24}.rank-back{color:#94a3b8}.rank-refresh{margin-left:auto;display:flex;align-items:center;gap:8px;font-size:11px;color:#94a3b8}.rank-refresh button{padding:6px;color:#67e8f9}.rank-refresh button:disabled{opacity:.4}
      .rank-tabs{display:flex;gap:7px;padding:9px 12px;border-bottom:1px solid rgba(148,163,184,.12);align-items:center}.rank-tabs button{font-size:12px;color:#94a3b8;padding:6px 11px;border:1px solid transparent;border-radius:8px}.rank-tabs button[aria-selected=true]{color:#fcd34d;border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.12)}.rank-tabs small{margin-left:auto;font-size:11px;color:#64748b}
      .rank-self{width:100%;padding:11px 12px;display:flex;align-items:center;gap:9px;text-align:left;background:linear-gradient(90deg,rgba(234,179,8,.1),rgba(15,23,42,.15));border-bottom:1px solid rgba(234,179,8,.15)}.rank-self-icon{color:#facc15;flex-shrink:0}.rank-self-main{min-width:0;flex:1}.rank-self-name{font-weight:600;display:flex;align-items:center;gap:7px;flex-wrap:wrap}.rank-self-name small{font-size:11px;font-weight:400;color:#94a3b8}.rank-self-souls{font-size:11px;color:#6ee7b7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:3px}.rank-self-end{color:#67e8f9;text-align:right;font-size:12px;flex-shrink:0}.rank-self-end small{display:block;color:#eab308;font-size:10px;margin-top:3px}
      .rank-podium{margin:12px 0;padding:12px;border:1px solid rgba(168,85,247,.15);border-radius:12px;background:linear-gradient(110deg,rgba(88,28,135,.16),rgba(15,23,42,.3),rgba(161,98,7,.08))}.rank-podium-head{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:11px;margin-bottom:10px;color:#c4b5fd}.rank-podium-head strong{display:flex;align-items:center;gap:5px}.rank-podium-head span{color:#94a3b8;font-size:10px}.rank-podium-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.rank-podium-card{border:1px solid rgba(148,163,184,.14);border-radius:10px;background:rgba(15,23,42,.38);padding:12px 6px;text-align:center;min-width:0}.rank-podium-card .rank-medal{margin:0 auto 6px}.rank-podium-name{font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rank-podium-card small{display:block;font-size:10px;color:#94a3b8;margin:3px 0}.rank-podium-power{font-size:15px;font-weight:700;font-variant-numeric:tabular-nums}.rank-podium-note{text-align:center;font-size:10px;color:#94a3b8;margin-top:9px}
      .rank-list{display:flex;flex-direction:column;gap:6px}.rank-row{width:100%;display:flex;align-items:center;gap:11px;padding:11px 14px;border:1px solid rgba(148,163,184,.14);border-radius:12px;text-align:left;background:rgba(15,23,42,.42);min-height:61px}.rank-medal{display:flex;align-items:center;justify-content:center;width:29px;flex-shrink:0;color:#94a3b8;font-size:14px;font-weight:600}.rank-row-main{flex:1;min-width:0}.rank-row-name{display:flex;align-items:center;gap:7px;font-size:14px;font-weight:500}.rank-row-name>span:first-child{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.rank-me{font-size:10px;color:#67e8f9;border:1px solid rgba(34,211,238,.25);border-radius:4px;padding:0 4px}.rank-row-info{font-size:11px;color:#94a3b8;margin-top:4px}.rank-row-info span{color:#6ee7b7}.rank-row-power{font-weight:700;font-size:15px;font-variant-numeric:tabular-nums;white-space:nowrap;flex-shrink:0}.rank-open{color:#64748b;flex-shrink:0}
      [data-rank="1"]{border-color:rgba(245,158,11,.38);background:rgba(113,63,18,.25)}[data-rank="1"] .rank-medal,[data-rank="1"] .rank-row-power,[data-rank="1"] .rank-podium-power{color:#facc15}[data-rank="2"]{border-color:rgba(148,163,184,.3);background:rgba(71,85,105,.2)}[data-rank="2"] .rank-medal,[data-rank="2"] .rank-row-power,[data-rank="2"] .rank-podium-power{color:#cbd5e1}[data-rank="3"]{border-color:rgba(217,119,6,.3);background:rgba(120,53,15,.18)}[data-rank="3"] .rank-medal,[data-rank="3"] .rank-row-power,[data-rank="3"] .rank-podium-power{color:#fb923c}
      .rank-row:not(:disabled):hover,.rank-podium-card:not(:disabled):hover{filter:brightness(1.2);border-color:rgba(34,211,238,.4)}.rank-view button:disabled{cursor:default;opacity:.6}.rank-view button:focus-visible,.rank-publish summary:focus-visible{outline:2px solid #22d3ee;outline-offset:2px}.rank-hint{padding:18px 12px;text-align:center;color:#94a3b8;font-size:12px}.rank-alert{padding:10px 12px;color:#fcd34d;font-size:12px;border:1px solid rgba(245,158,11,.25);border-radius:8px;margin:8px 0}.rank-publish{margin-top:14px;padding:11px 12px;border:1px solid rgba(148,163,184,.16);border-radius:10px;font-size:12px;color:#94a3b8}.rank-publish summary{cursor:pointer;color:#67e8f9}.rank-publish label{display:flex;align-items:flex-start;gap:8px;margin-top:12px;font-size:11px}.rank-publish button{color:#67e8f9;padding:9px 0}.rank-foot{text-align:center;color:#64748b;font-size:10px;padding:14px 0}
      @media(max-width:520px){.rank-head{padding:10px 2px;gap:6px}.rank-head h2{font-size:16px}.rank-refresh{gap:3px}.rank-tabs{padding:8px 0;gap:3px}.rank-tabs button{padding:6px 9px}.rank-tabs small{display:none}.rank-self{padding:10px 6px}.rank-self-end{font-size:11px}.rank-podium{padding:10px 8px}.rank-podium-grid{gap:5px}.rank-podium-head span{display:none}.rank-podium-card{padding:10px 4px}.rank-podium-power{font-size:13px}.rank-row{gap:8px;padding:10px 9px;min-height:58px}.rank-row-name{font-size:13px}.rank-row-power{font-size:13px}.rank-row-info{font-size:10px}.rank-open{display:none}}
    `}</style>
    <header className="rank-head"><button className="rank-back" onClick={onBack} aria-label="返回"><ChevronLeft size={19}/></button><h2><Trophy size={20}/>战力排行榜</h2><div className="rank-refresh"><span>{api?`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} 后更新`:'尚未连接'}</span><button aria-label="刷新排行榜" title="刷新排行榜" disabled={!api||busy} onClick={refresh}><RefreshCw size={15}/></button></div></header>
    <div className="rank-tabs" role="tablist" aria-label="排行榜范围">{([{key:'all',name:'总榜'},{key:'top',name:'前三名'},{key:'mine',name:'我的排名'}] as const).map(t=><button key={t.key} role="tab" aria-selected={rankTab===t.key} onClick={()=>setRankTab(t.key)}>{t.name}</button>)}<small>点击玩家查看人物与轮回</small></div>
    <button className="rank-self" disabled={busy} aria-label="查看我的人物档案" onClick={()=>{setSelected(self);setMode('current');}}><User size={18} className="rank-self-icon"/><div className="rank-self-main"><div className="rank-self-name">{self.current.name}<small>Lv.{self.current.level} · 第{self.current.index}世</small></div><div className="rank-self-souls">{souls}</div></div><div className="rank-self-end">战力 {minePower}<small>{api?(myRank?`第 ${myRank.rank} 名`:'尚未上榜'):'本机角色预览'}</small></div></button>
    {entries.length>0 && <section className="rank-podium" aria-label="当前榜单前三"><div className="rank-podium-head"><strong><Crown size={14}/>巅峰前三 · 当前战力榜</strong><span>{updated?`更新于 ${new Date(updated).toLocaleTimeString()}`:''}</span></div><div className="rank-podium-grid">{entries.slice(0,3).map(row=><button key={row.publicId} className="rank-podium-card" data-rank={row.rank} disabled={busy} aria-label={`查看第${row.rank}名${row.name}的档案`} onClick={()=>open(row.publicId)}><div className="rank-medal">{medal(row.rank)}</div><div className="rank-podium-name">{row.name}</div><small>Lv.{row.level} · 第{row.rank}名</small><div className="rank-podium-power">{powerText(row.power)}</div></button>)}</div><p className="rank-podium-note">战力以最近公开档案为准 · 点击查看当前角色与历代轮回</p></section>}
    {!api && <p className="rank-hint">登录游戏账号后可查看真实玩家排行。当前角色仍可点击预览。</p>}
    {error && <p role="alert" className="rank-alert">{error}</p>}
    {busy && <p role="status" className="rank-hint">正在读取…</p>}
    <div className="rank-list" role="tabpanel">{shown.map(row=><button key={row.publicId} disabled={busy} onClick={()=>open(row.publicId)} className="rank-row" data-rank={row.rank} aria-label={`第${row.rank}名 ${row.name} 查看人物档案`}><div className="rank-medal">{medal(row.rank)}</div><div className="rank-row-main"><div className="rank-row-name"><span>{row.name}</span>{myRank?.publicId===row.publicId&&<small className="rank-me">我</small>}</div><p className="rank-row-info">Lv.{row.level} · <span>查看角色与历代轮回</span></p></div><span className="rank-row-power">{powerText(row.power)}</span><ChevronLeft size={14} className="rank-open" style={{transform:'rotate(180deg)'}}/></button>)}</div>
    {api&&!busy&&!error&&!shown.length&&<p className="rank-hint">{rankTab==='mine'?'尚未上榜，公开人物档案后可参与排名':'尚无公开上榜玩家'}</p>}
    {api?.publish && <details className="rank-publish"><summary>上榜与更新我的公开档案</summary><label><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>同意公开角色名、属性、武魂、装备、背包与历代轮回资料，供其他登录玩家查看</label><button disabled={!consent||busy} onClick={publish}>更新我的上榜档案</button>{notice&&<p role="status">{notice}</p>}</details>}
    <p className="rank-foot">前100名 · 每5分钟更新 · 战力以最近公开快照为准</p>
  </section>;
}
export default function LeaderboardPanel({onBack}:{onBack:()=>void}) {
  const cloud=useCloud();
  const {player,attributes,getReincarnationOrbs}=useGame();
  if(!player || !attributes)return null;
  const self=ownProfile(player,attributes,getReincarnationOrbs(),getRealmDisplay(player.level,player.soulRings.length,player.title,player.easterRealmStage,player.divineTrial));
  return <LeaderboardView key={cloud?.session?.user.id||'offline'} self={self} api={cloud?cloud.leaderboard:publicLeaderboardAPI()} onBack={onBack}/>;
}
