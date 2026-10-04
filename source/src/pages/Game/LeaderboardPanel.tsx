import { useEffect, useRef, useState } from 'react';
import { Trophy, RefreshCw, ChevronLeft, User } from 'lucide-react';
import { useGame, getRealmDisplay } from '@/lib/gameStore';
import { combatPower, ownProfile, powerText, publicLeaderboardAPI } from '@/lib/leaderboard';
import type { PublicProfile, RankEntry, LeaderboardAPI } from '@/lib/leaderboard';
import ReincarnationHistoryPanel from './ReincarnationHistoryPanel';
import { useCloud } from '@/components/CloudAccount';
export function LeaderboardView({ self, api, onBack }: {self: PublicProfile; api: LeaderboardAPI | null; onBack: () => void}) {
  const [entries,setEntries] = useState<RankEntry[]>([]), [myRank,setMyRank] = useState<RankEntry|null>(null);
  const [selected,setSelected] = useState<PublicProfile|null>(null), [mode,setMode] = useState<'current'|'history'>('current');
  const [busy,setBusy] = useState(false), [error,setError] = useState(''), [updated,setUpdated] = useState(0);
  const [seconds,setSeconds] = useState(300); const alive = useRef(true), locked = useRef(false), request = useRef(0);
  const [consent,setConsent] = useState(false), [notice,setNotice] = useState('');
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
  return <div className="space-y-4">
    <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Trophy className="text-amber-300" size={22}/><h2 className="text-lg font-bold">战力排行榜</h2></div><button onClick={onBack} aria-label="返回" className="text-muted-foreground"><ChevronLeft/></button></div>
    <button disabled={busy} className="w-full text-left rounded-2xl border border-cyan-500/30 bg-card/50 p-4 disabled:opacity-60" onClick={()=>{setSelected(self);setMode('current');}}><div className="flex items-center justify-between"><span className="font-semibold">{self.current.name} <span className="text-xs text-muted-foreground">Lv. {self.current.level}</span></span><span className="text-amber-300 font-bold">{powerText(combatPower(self.current.attributes))}</span></div><p className="text-xs text-cyan-300 mt-2">{api?(myRank?`第 ${myRank.rank} 名`:'待上榜'):'本机角色预览 · 尚未上榜'} · 点击查看当前角色与历代轮回</p></button>
    {!api && <div className="rounded-xl border border-border/40 bg-card/40 p-4 text-sm text-muted-foreground">请在设置中登录 Supabase 账号，连接后可读取真实玩家排名。</div>}
    {api?.publish && <div className="rounded-xl border border-border/40 bg-card/40 p-3 space-y-2"><label className="flex items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>同意公开角色名、属性、武魂、装备、背包与历代轮回资料，供其他登录玩家查看</label><button className="text-sm text-cyan-300 disabled:opacity-50" disabled={!consent || busy} onClick={publish}>更新我的上榜档案</button>{notice && <p role="status" className="text-xs text-cyan-300">{notice}</p>}</div>}
    {api && <div className="flex justify-between items-center text-xs text-muted-foreground"><span>{updated?`更新于 ${new Date(updated).toLocaleTimeString()} · ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} 后刷新`:'正在读取排行榜'}</span><button className="flex items-center gap-1 text-cyan-300 disabled:opacity-50" disabled={busy} onClick={refresh}><RefreshCw size={14}/>刷新</button></div>}
    {error && <p role="alert" className="text-sm text-amber-300">{error}</p>}
    {busy && <p role="status" className="text-xs text-muted-foreground">正在读取…</p>}
    <div className="space-y-2">{entries.map(row=><button key={row.publicId} disabled={busy} onClick={()=>open(row.publicId)} className={'w-full flex gap-3 items-center text-left p-3 rounded-xl border bg-card/40 disabled:opacity-60 '+(row.rank<=3?'border-amber-500/30':'border-border/40')}><span className={'w-7 text-center font-bold '+(row.rank<=3?'text-amber-300':'text-muted-foreground')}>{row.rank}</span><div className="flex-1 min-w-0"><div className="truncate font-medium text-sm">{row.name}{myRank?.publicId===row.publicId?'（我）':''}</div><p className="text-xs text-muted-foreground">Lv. {row.level} · 查看人物档案</p></div><span className="text-amber-300 text-sm tabular-nums">{powerText(row.power)}</span><User size={14} className="text-cyan-300"/></button>)}</div>
    {api && !busy && !error && !entries.length && <p className="text-center text-sm text-muted-foreground py-8">尚无公开上榜玩家</p>}
    <p className="text-xs text-muted-foreground text-center">前100名 · 每5分钟更新 · 战力以最近公开快照为准</p>
  </div>;
}
export default function LeaderboardPanel({onBack}:{onBack:()=>void}) {
  const cloud=useCloud();
  const {player,attributes,getReincarnationOrbs}=useGame();
  if(!player || !attributes)return null;
  const self=ownProfile(player,attributes,getReincarnationOrbs(),getRealmDisplay(player.level,player.soulRings.length,player.title,player.easterRealmStage,player.divineTrial));
  return <LeaderboardView key={cloud?.session?.user.id||'offline'} self={self} api={cloud?cloud.leaderboard:publicLeaderboardAPI()} onBack={onBack}/>;
}
