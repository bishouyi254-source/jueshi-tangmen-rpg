import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createClient, type Session } from '@supabase/supabase-js';
import { useGame, type IExplorationState } from '@/lib/gameStore';
import { cloudService, type CloudPayload, type CloudSlot } from '@/lib/cloudSave';
import { supabaseConfig } from '@/lib/supabaseConfig';
import { loginUsername, registerUsername } from '@/lib/usernameAuth';
async function timedFetch(input:RequestInfo|URL,init?:RequestInit){
 const controller=new AbortController(),abort=()=>controller.abort();
 init?.signal?.addEventListener('abort',abort,{once:true});if(init?.signal?.aborted)controller.abort();
 const timer=setTimeout(abort,20000);
 try{return await fetch(input,{...init,signal:controller.signal});}
 finally{clearTimeout(timer);init?.signal?.removeEventListener('abort',abort);}
}
const client=supabaseConfig.url && supabaseConfig.publishableKey ? createClient(supabaseConfig.url,supabaseConfig.publishableKey,{global:{fetch:timedFetch}}):null;
const service=client?cloudService(client):null;
interface Pending {slot:number;revision:number;operation:string;payload:CloudPayload;}
const CloudContext=createContext<any>(null);
const pendingKey=(uid:string)=>'rpg_cloud_pending_'+uid;
export const useCloud=()=>useContext(CloudContext);
export function CloudAccountProvider({children}:{children:ReactNode}) {
 const game=useGame(); const [session,setSession]=useState<Session|null>(null);
 const [slots,setSlots]=useState<CloudSlot[]>([]),[status,setStatus]=useState('尚未登录'),[busy,setBusy]=useState(false);
 const [binding,setBinding]=useState<{slot:number;revision:number}|null>(null);
 const [pending,setPending]=useState<Pending|null>(null);
 const gen=useRef(0),uid=useRef<string|null>(null),lock=useRef(false),lastCode=useRef(''),latest=useRef(game),bindRef=useRef(binding);
 latest.current=game;bindRef.current=binding;
 useEffect(()=>{
  if(!client)return;
  const update=(s:Session|null)=>{
   if(uid.current!==(s?.user.id||null)) {
    uid.current=s?.user.id||null;gen.current++;setSlots([]);setBinding(null);lastCode.current='';
    let p=null;try{if(s)p=JSON.parse(localStorage.getItem(pendingKey(s.user.id))||'null');}catch{}
    setPending(p);setStatus(s?'已登录 · 请选择上传本机存档或读取云存档':'尚未登录');
   }
   setSession(s);
  };
  let eventSeen=false;
  const {data}=client.auth.onAuthStateChange((_event,s)=>{eventSeen=true;update(s);});
  let active=true;client.auth.getSession().then(({data})=>{if(active&&!eventSeen)update(data.session);});
  return()=>{active=false;data.subscription.unsubscribe();};
 },[]);
 useEffect(()=>{(window as any).__RPG_LEADERBOARD_API__=session && service?service.leaderboard:null;return()=>{(window as any).__RPG_LEADERBOARD_API__=null;};},[session]);
 async function refresh() {
  if(!service || !uid.current || lock.current)return;
  const version=gen.current;lock.current=true;setBusy(true);
  try {const result=await service.list();if(version===gen.current)setSlots(result);}
  catch(e){if(version===gen.current)setStatus(String((e as Error).message));}
  finally{lock.current=false;setBusy(false);}
 }
 useEffect(()=>{if(session)void refresh();},[session?.user.id]);
 function payload():CloudPayload {
  const g=latest.current;if(g.inBattle)throw new Error('请先结束战斗，再操作云存档');
  if(!g.player)throw new Error('请先进入本机角色，再上传存档');
  const code=g.exportSave();if(!code)throw new Error('没有可上传的角色存档');
  return {format:1,saveCode:code,exploration:g.exploration,summary:{name:g.player.name,level:g.player.level}};
 }
 async function send(p:Pending) {
  if(!service || !uid.current || lock.current)return;
  const owner=uid.current,version=gen.current;lock.current=true;setBusy(true);
  try {
   localStorage.setItem(pendingKey(owner),JSON.stringify(p));setPending(p);setStatus('正在同步…');
   const result=await service.write(p.slot,p.revision,p.operation,p.payload);
   if(version!==gen.current)return;
   localStorage.removeItem(pendingKey(owner));setPending(null);
   const ack=(result as CloudSlot & {ackRevision?:number}).ackRevision ?? result.revision;
   // A retry acknowledged after another device updated must not rebind and overwrite that device.
   if(ack!==result.revision){setBinding(null);setStatus('上传已被确认，但云端已有较新版本，请重新读取');}
   else {setBinding({slot:p.slot,revision:result.revision});lastCode.current=JSON.stringify(p.payload);setStatus('已同步 · '+new Date(result.updated_at).toLocaleString());}
   setSlots(old=>[...old.filter(s=>s.slot!==p.slot),result].sort((a,b)=>a.slot-b.slot));
  }catch(e){if(version===gen.current){setBinding(null);setStatus('未同步：'+(e as Error).message+'；本机存档已保留，可重试原请求');}}
  finally{lock.current=false;setBusy(false);}
 }
 async function upload(slot:number) {
  if(pending)throw new Error('有待确认的上传，请先重试原请求');
  await send({slot,revision:slots.find(s=>s.slot===slot)?.revision||0,operation:crypto.randomUUID(),payload:payload()});
 }
 async function restore(s:CloudSlot,oldPayload?:CloudPayload) {
  if(lock.current || latest.current.inBattle)throw new Error('请先结束战斗或等待同步完成');
  setBinding(null);bindRef.current=null;
  const g=latest.current,p=oldPayload||s.payload;
  if(g.player){const backup=g.exportSave();if(!backup)throw new Error('本机备份失败，已取消读取');localStorage.setItem('rpg_before_cloud_restore_'+session?.user.id,JSON.stringify({saveCode:backup,exploration:g.exploration,time:Date.now()}));}
  const result=g.importSave(p.saveCode);if(!result.success)throw new Error(result.reason);
  g.setExploration(p.exploration as IExplorationState|null);
  setStatus(oldPayload?'历史存档已复制到本机；需要手动上传才能替换云端':'云端存档已复制到本机；点击上传可启用自动同步');
 }
 function recoverLocal(){
  if(lock.current || latest.current.inBattle)throw new Error('请先结束战斗或等待同步完成');
  const raw=localStorage.getItem('rpg_before_cloud_restore_'+session?.user.id);if(!raw)throw new Error('尚无读取云存档前的本机备份');
  const b=JSON.parse(raw);setBinding(null);const result=latest.current.importSave(b.saveCode);if(!result.success)throw new Error(result.reason);
  latest.current.setExploration(b.exploration);setStatus('读取云存档前的本机备份已恢复，自动同步暂停');
 }
 useEffect(()=>{
  const timer=setInterval(()=>{
   if(!uid.current || !bindRef.current || lock.current || pending || latest.current.inBattle || !latest.current.player)return;
   try{const p=payload();if(JSON.stringify(p)!==lastCode.current)void send({slot:bindRef.current.slot,revision:bindRef.current.revision,operation:crypto.randomUUID(),payload:p});}
   catch(e){setStatus((e as Error).message);}
  },30000);
  return()=>clearInterval(timer);
 },[pending]);
 function cancelPending(){if(uid.current)localStorage.removeItem(pendingKey(uid.current));setPending(null);setBinding(null);setStatus('待上传请求已取消，本机存档保留，请刷新云存档后重新选择');}
 return <CloudContext.Provider value={{client,session,slots,status,busy,binding,pending,refresh,upload,restore,recoverLocal,retry:()=>pending && send(pending),cancelPending,leaderboard:session&&service?service.leaderboard:null,stop:()=>setBinding(null)}}>{children}</CloudContext.Provider>;
}

export function CloudAccountPanel() {
 const c=useCloud();const [password,setPassword]=useState(''),[username,setUsername]=useState(''),[newPassword,setNewPassword]=useState('');
 const [message,setMessage]=useState(''),[working,setWorking]=useState(false),[showHistory,setShowHistory]=useState<number|null>(null);
 if(!c)return null;
 const cls='w-full rounded-xl border border-border/40 bg-card/40 p-3 text-sm';
 async function action(fn:()=>Promise<any>){if(working)return;setWorking(true);setMessage('');try{await fn();}catch(e){setMessage((e as Error).message);}finally{setWorking(false);}}
 const disabled=working||c.busy;
 return <section className="rounded-2xl border border-cyan-500/30 bg-card/40 p-4 space-y-3">
  <h3 className="font-semibold text-cyan-200">账号与云存档</h3>
  {!c.client?<p className="text-sm text-muted-foreground">Supabase 接入配置尚未部署。本机自动存档可继续使用。</p>:<>
  {!c.session?<>
   <input className={cls} autoComplete="username" aria-label="用户名" placeholder="用户名（3–24个汉字、字母、数字等）" maxLength={24} value={username} onChange={e=>setUsername(e.target.value)}/>
   <input className={cls} type="password" autoComplete="current-password" aria-label="密码" placeholder="密码（至少8位）" value={password} onChange={e=>setPassword(e.target.value)}/>
   <div className="flex flex-wrap gap-3 text-sm text-cyan-300">
    <button disabled={disabled} onClick={()=>action(async()=>{await loginUsername(c.client,username,password);setPassword('');})}>登录</button>
    <button disabled={disabled} onClick={()=>action(async()=>{await registerUsername(c.client,username,password);setPassword('');setMessage('注册成功，已登录');})}>注册</button>
   </div>
   <p className="text-xs text-muted-foreground">只需用户名和密码，无需邮箱或验证码。用户名不区分英文字母大小写，注册后作为固定登录名。请妥善保存密码，暂不支持忘记密码找回。</p>
  </>:<>
   <p className="text-sm">{c.session.user.user_metadata?.display_name||'已登录玩家'}</p>
   <div className="flex gap-3 text-sm text-cyan-300"><button disabled={disabled} onClick={()=>action(c.refresh)}>刷新云存档</button><button disabled={disabled} onClick={()=>action(async()=>{c.stop();const {error}=await c.client.auth.signOut();if(error)throw error;})}>退出账号</button></div>
   <div className="space-y-2"><input className={cls} type="password" autoComplete="current-password" aria-label="当前密码" placeholder="修改密码：先输入当前密码" value={password} onChange={e=>setPassword(e.target.value)}/><div className="flex gap-2"><input className={cls} type="password" autoComplete="new-password" aria-label="新密码" placeholder="新密码（至少8位）" value={newPassword} onChange={e=>setNewPassword(e.target.value)}/><button disabled={disabled} className="shrink-0 text-sm text-cyan-300" onClick={()=>action(async()=>{if(newPassword.length<8)throw new Error('新密码至少8位');const email=c.session.user.email;if(!email)throw new Error('账号信息不完整');const {error:check}=await c.client.auth.signInWithPassword({email,password});if(check)throw new Error('当前密码错误或暂时无法验证，请重试');const {error}=await c.client.auth.updateUser({password:newPassword});if(error)throw new Error('密码更新失败，请稍后重试');setPassword('');setNewPassword('');setMessage('密码已更新');})}>修改密码</button></div></div>
   {[1,2,3].map(slot=>{const s=c.slots.find((x:CloudSlot)=>x.slot===slot);return <div key={slot} className={cls+' space-y-2'}><p>存档位 {slot} · {s?`${s.payload.summary.name} Lv.${s.payload.summary.level} · 版本${s.revision}`:'空'}</p>{s&&<p className="text-xs text-muted-foreground">{new Date(s.updated_at).toLocaleString()}</p>}<div className="flex flex-wrap gap-3 text-cyan-300"><button disabled={disabled||!!c.pending} onClick={()=>{if(!s||confirm('将本机角色复制到这个云存档位？已有云存档会保留历史版本。'))void action(()=>c.upload(slot));}}>上传本机存档</button>{s&&<><button disabled={disabled||!!c.pending} onClick={()=>{if(confirm('读取云端存档到本机？本机角色会先备份，云端不会被覆盖。'))void action(()=>c.restore(s));}}>读取到本机</button><button onClick={()=>setShowHistory(showHistory===slot?null:slot)}>历史版本（{s.history.length}）</button></>}</div>{showHistory===slot&&s?.history.map((h:any)=><button key={h.revision} disabled={disabled||!!c.pending} className="block text-xs text-cyan-300" onClick={()=>{if(confirm('复制这个历史版本到本机？'))void action(()=>c.restore(s,h.payload));}}>版本{h.revision} · {new Date(h.updated_at).toLocaleString()} · {h.payload.summary.name}</button>)}</div>;})}
   {c.pending&&<div className="flex flex-wrap gap-3 text-sm text-amber-300"><button disabled={disabled} onClick={()=>action(c.retry)}>重试待确认上传（不会强制覆盖较新版本）</button><button disabled={disabled} onClick={()=>{if(confirm('取消待上传请求？本机角色与云端存档均保留。'))c.cancelPending();}}>取消待上传请求</button></div>}
   {c.binding&&<button className="text-xs text-cyan-300" onClick={c.stop}>暂停自动同步</button>}
   <button disabled={disabled||!!c.pending} className="text-xs text-cyan-300" onClick={()=>{if(confirm('恢复上次读取云存档前的本机备份？当前云存档不会改变。'))void action(c.recoverLocal);}}>恢复读取前的本机备份</button>
  </>}
  <p role="status" className="text-xs text-muted-foreground">{c.status}</p>
  <p className="text-xs text-muted-foreground">登录不会自动覆盖本机进度。手动上传成功后每30秒检查变化；战斗中暂停上传。读取云存档后请手动上传，才会继续自动同步。</p>
  </>}
  {message&&<p role="alert" className="text-sm text-amber-300">{message}</p>}
 </section>;
}
