import {useEffect,useRef,useState} from 'react';
import {useGame} from '@/lib/gameStore';
import {MATERIAL_NAMES,materialText,ascensionMaterials,cultivationLabel} from '@/lib/dragonMaterials';
import DragonValleyPanel from './DragonValleyPanel';
import DragonLegendPanel,{dragonStyles} from './DragonLegendPanel';
const remembered:Record<string,any>={};
export function useCultivationView<T>(key:string,initial:T){const [value,setValue]=useState<T>(()=>remembered[key]??initial);return [value,(v:T)=>{remembered[key]=v;setValue(v);}] as const;}
export function MaterialSources({player,cost}:{player:any;cost?:{essence:number;marrow:number;core:number}}){
 const bag=player?.dragonBloodline||{};
 function open(target:string){window.dispatchEvent(new CustomEvent('dragon-material-source',{detail:target}));}
 return <div data-material-sources className="dragon-card" style={{marginTop:12,fontSize:12}}><h3>培养材料 · 获取途径</h3>{cost&&Object.entries(MATERIAL_NAMES).map(([k,name])=><p key={k} className="dragon-hint">{name}：{bag[k]||0} / {cost[k]}{(bag[k]||0)<cost[k]?' · 缺少 '+(cost[k]-(bag[k]||0)):' · 已备齐'}</p>)}<p className="dragon-hint">龙谷斥候产出基础材料，守卫提高龙髓收益，领主必得龙核。升灵台提供{cultivationLabel(player)}材料；双生共享一份，不重复领取。</p><div style={{display:'flex',gap:8,marginTop:8}}><button className="dragon-secondary" onClick={()=>open('valley')}>前往龙谷</button><button className="dragon-secondary" onClick={()=>open('ascension')}>前往升灵台</button></div><p className="dragon-hint">材料用于封印、真身、元素与共鸣升级，到账不会自动增加属性。培养用材料不增加霸血或战斗感悟点数。</p></div>;
}
export function AscensionCultivationRewards({player}:{player:any}){return <div className="dragon-card" data-cultivation-rewards><h3>升灵台 · {cultivationLabel(player)}</h3>{['初级','中级','高级'].map((n,i)=><p className="dragon-hint" key={n}>{n}胜利：{materialText(ascensionMaterials(player,i))}</p>)}<p className="dragon-hint">所有角色保留灵力奖励；仅持有金龙王或有效银龙王武魂时获得额外培养材料。双生角色只发一份，失败与逃跑无胜利奖励，不返还入场消耗。</p></div>;}
export function MaterialSourceDrawer(){
 const {inBattle}=useGame(),[target,setTarget]=useState(''),ref=useRef<HTMLDivElement>(null),returnFocus=useRef<HTMLElement|null>(null);
 function close(){setTarget('');returnFocus.current?.focus();}
 useEffect(()=>{const open=(e:Event)=>{if(inBattle)return;const next=(e as CustomEvent).detail;if(!['valley','ascension'].includes(next))return;returnFocus.current=document.activeElement as HTMLElement;setTarget(next);};window.addEventListener('dragon-material-source',open);return()=>window.removeEventListener('dragon-material-source',open);},[inBattle]);
 useEffect(()=>{if(target&&!inBattle)ref.current?.focus();},[target,inBattle]);
 if(!target||inBattle)return null;
 return <div style={{position:'fixed',inset:0,zIndex:70,background:'rgba(2,6,23,.94)',padding:'12px',overflow:'auto'}} role="dialog" aria-modal="true" aria-label="培养材料来源" tabIndex={-1} ref={ref} onKeyDown={e=>{if(e.key==='Escape')close();if(e.key==='Tab'){const nodes=ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],select,input,[tabindex="0"]');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===ref.current)){e.preventDefault();first.focus();}}}}><style>{dragonStyles}</style><div className="dragon-ui"><button className="dragon-secondary" style={{marginBottom:12}} onClick={close}>← 返回培养页面（保留原分页）</button>{target==='valley'?<DragonValleyPanel onBack={close}/>:<DragonLegendPanel mode="ascension"/>}</div></div>;
}
