// Non-element extremes improve stats, but never become an element through name inference.
const STAT_ONLY=/^(?:极致之)?(?:力量|速度|敏捷|防御|辅助)(?:属性)?$/;
export const ALL_ELEMENTS=['金','木','水','火','雷','土','冰','光','暗','时间','空间','精神'];
export function elementSet(value:any,normalize:(v:string)=>string){
 const out=new Set<string>();
 for(const part of String(value||'').split(/[·/、,，+|]/)){
  const text=part.trim();if(!text||['无','无属性','空'].includes(text)||STAT_ONLY.test(text))continue;
  if(['全属性','全能属性','全元素属性'].includes(text)){out.add('*');continue;}
  if(['七元素','七元素掌控'].includes(text)){for(const e of ['火','水','土','风','光','暗','空间'])out.add(e+'属性');continue;}
  const e=normalize(text);if(e&&e!=='无属性')out.add(e);
 }
 return out;
}
export function resonance(element:any,rings:any[],bones:any[],options:any,normalize:(v:string)=>string,infer:(v:string)=>string){
 let elements=elementSet(options?.extremeAttribute,normalize);if(!elements.size)elements=elementSet(element,normalize);
 const match=(attr:any,name:any)=>{if(elements.has('风属性')&&/^风(?:属性|系)?$/.test(String(attr||'')))return true;const targets=elementSet(attr==null||attr===''?infer(name||''):attr,normalize);return [...targets].some(t=>elements.size>0&&(elements.has('*')||t==='*'||elements.has(t)));};
 const hasRingMatch=(rings||[]).some(r=>match(r.beastAttribute,r.soulBeastName)),hasBoneMatch=(bones||[]).some(b=>match(b.beastAttribute,b.name));
 return {bonusPct:(hasRingMatch?.05:0)+(hasBoneMatch?.05:0),hasRingMatch,hasBoneMatch,isAllAttr:elements.has('*')};
}
// Keep the existing main/secondary multipliers; display and calculation share this result.
export function extremeMultipliers(extreme:string,secondary=false){
 const m={attack:1,defense:1,speed:1,spirit:1,hp:1};if(!extreme)return m;
 if(extreme==='全属性'){for(const k of Object.keys(m))m[k]=secondary?1.075:1.15;return m;}
 if(extreme.includes('力量'))m.attack*=secondary?1.1:1.2;
 if(extreme.includes('防御'))m.defense*=secondary?1.1:1.2;
 for(const k of ['速度','敏捷'])if(extreme.includes(k))m.speed*=secondary?1.12:1.25;
 for(const k of ['精神','灵魂','轮回'])if(extreme.includes(k))m.spirit*=secondary?1.12:1.25;
 const rows:any[]=[['冰',{defense:.05}],['火',{attack:.05}],['雷',{attack:.05,speed:.03}],['雷霆',{attack:.05,speed:.03}],['光明',{spirit:.05,hp:.03}],['黑暗',{attack:.05}],['暗',{attack:.05}],['毒',{spirit:.05,attack:.03}],['水',{defense:.05,hp:.03}],['木',{hp:.08,defense:.03}],['土',{defense:.05,hp:.05}],['金',{attack:.05,defense:.03}],['风',{speed:.05,attack:.03}],['空间',{speed:.05,spirit:.03}],['时间',{spirit:.05,speed:.03}],['时空',{spirit:.05,speed:.05}],['混沌',{}],['杀',{attack:.05}],['剑',{attack:.05}],['刃',{attack:.05}]];
 const row=rows.find(([k])=>extreme.includes(k));if(row){if(!secondary)for(const [k,v] of Object.entries(row[1]))m[k]*=1+Number(v);m.attack*=secondary?1.075:1.15;}
 return m;
}
