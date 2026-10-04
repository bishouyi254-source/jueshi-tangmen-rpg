import {useEffect,useRef,useState} from 'react';
import {toast} from 'sonner';
import {growthBenefit,growthRank} from '@/lib/bloodlinePreview';
import {silverUpgrade} from '@/lib/silverKing';
import {valleyAction} from '@/lib/dragonBloodline';
// A submitted upgrade targets one specific rank; queued repeats cannot buy the next rank.
export function useGrowthUpgrade(player:any,setPlayer:any,inBattle:boolean){
 const lock=useRef(false),[pending,setPending]=useState<any>(null);
 useEffect(()=>{if(!pending||player===pending.before)return;const rank=growthRank(player,pending.king,pending.kind,pending.id,true);if(rank===pending.rank+1)toast.success(pending.label+'进化至第'+rank+'阶');else toast.error('进化未完成，请检查当前武魂、条件与材料');lock.current=false;setPending(null);},[player,pending]);
 function upgrade(king:'gold'|'silver',kind:string,id:string,label:string){
  if(lock.current||inBattle)return;const rank=growthRank(player,king,kind,id,true);
  const apply=(p:any)=>king==='gold'?valleyAction(p,{type:'evolve',track:id,expectedRank:rank}):silverUpgrade(p,kind as any,id,rank);
  const preview=apply(player);if(preview.reason)return toast.error(preview.reason);
  lock.current=true;setPending({before:player,king,kind,id,rank,label});setPlayer((p:any)=>apply(p).player);
 }
 return {upgrade,busy:!!pending};
}
export function GrowthPreview({player,king,kind,id}:{player:any;king:'gold'|'silver';kind:string;id:string}){
 const stored=growthRank(player,king,kind,id,true),rank=growthRank(player,king,kind,id);
 return <div data-growth-preview={king+'-'+id}><p className="dragon-hint">已培养 {stored}/4阶 · 当前生效 {rank}/4阶</p><p className="dragon-hint">当前：{growthBenefit(king,kind,id,rank)}</p>{stored<4?<p className="dragon-hint">升级后：{growthBenefit(king,kind,id,stored+1)}</p>:<p className="dragon-muted">已达最高阶，无需继续消耗材料。</p>}{stored!==rank&&<p className="dragon-warning">培养记录仍在；满足当前等级、神位或封印要求后才能完整生效。</p>}</div>;
}
export const growthStyles=`[data-growth-preview]{padding:10px 12px;margin:10px 0;border:1px solid #23465a;border-radius:8px;background:#08141f88}[data-growth-preview] p{margin:4px 0}.growth-seals{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;margin:12px 0}.growth-seals button{padding:8px 2px;min-height:44px;color:#94a3b8;background:#08141f;border:1px solid #23465a;border-radius:6px;font:inherit;font-size:12px}.growth-seals button[data-state=unlocked]{color:#fcd34d;border-color:#967e40}.growth-seals button[data-state=ready]{color:#67e8f9;border-color:#67e8f9}.growth-seals button[aria-pressed=true]{outline:2px solid #67e8f9}.growth-seal-preview{border:1px solid #23465a;padding:12px;border-radius:8px}.gold-forbidden-node strong,.silver-node strong{white-space:normal!important;overflow-wrap:anywhere;line-height:1.25}.gold-forbidden-node,.silver-node{max-width:24%;min-width:0}.dragon-ui progress{max-width:100%}@media(max-width:400px){.growth-seals{grid-template-columns:repeat(6,minmax(0,1fr))}.silver-node,.gold-forbidden-node{font-size:10px!important}}`;
