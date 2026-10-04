import {useState} from 'react';
import {bloodlineProgress,sealRequirements} from '@/lib/dragonBloodline';
export default function GoldSealProgress({player}:{player:any}){
 const b=bloodlineProgress(player),next=sealRequirements(player),[selected,setSelected]=useState(Math.min(18,b.seals+1));
 const r=sealRequirements({...player,dragonBloodline:{...player.dragonBloodline,seals:selected-1}});
 const rewards:Record<number,string>={3:'黄金龙爪可用',6:'黄金龙体可用；镇狱领域解锁',12:'黄金龙吼可用；领域强化；第一至第四魂技替换为龙皇禁法',16:'第五、第六、第八、第九魂技替换为龙皇禁法；第七保持金龙王真身（游戏原创）',18:'金龙霸体可用；镇狱领域达到第三档'};
 return <div data-seal-progress><progress aria-label="封印解开进度" max={18} value={b.seals} style={{width:'100%',accentColor:'#d9a843'}}/><div className="growth-seals" aria-label="十八道封印预览">{Array.from({length:18},(_,i)=>i+1).map(n=><button key={n} type="button" aria-pressed={selected===n} data-state={n<=b.seals?'unlocked':n===next.next&&!next.reason?'ready':'locked'} onClick={()=>setSelected(n)} aria-label={'预览第'+n+'道封印'}>{n} · {n<=b.seals?'已解':n===next.next&&!next.reason?'可挑战':'锁定'}</button>)}</div><div className="growth-seal-preview" aria-live="polite"><h4>第{selected}道封印 · {selected<=b.seals?'已解开':selected===next.next?'下一道':'尚未轮到'}</h4><p className="dragon-hint">要求：{r.level}级{selected>6?' · 继承神位':''} · 先解开前{selected-1}道</p><p className="dragon-hint">胜利消耗：精华 {r.essence} · 龙髓 {r.marrow} · 龙核 {r.core}</p><p className="dragon-hint">本层收益：永久攻击 +1%、气血 +1.5%{rewards[selected]?'；'+rewards[selected]:''}</p><p className="dragon-muted">累计收益：攻击 +{selected}%、气血 +{(selected*1.5).toFixed(1)}%。技能位置仍需对应魂环；失败不消耗材料。</p></div></div>;
}
