// Shared cultivation inventory; rewards never increase combat stats directly.
export type DragonMaterials={essence:number;marrow:number;core:number};
const nat=(v:any)=>Number.isFinite(v)?Math.max(0,Math.floor(v)):0;
export const MATERIAL_NAMES={essence:'龙魂精华',marrow:'龙髓',core:'龙核'};
export function kingCultivation(p:any){const souls=[p?.martialSoul?.name,p?.isTwinSoul===true?p?.secondSoul?.name:null];return {gold:souls.includes('金龙王'),silver:souls.includes('银龙王')};}
export function materialText(r:DragonMaterials){return Object.entries(r).filter(([,n])=>n>0).map(([k,n])=>MATERIAL_NAMES[k]+' +'+n).join(' · ')||'无额外材料';}
export function materialLedger(p:any){return Array.isArray(p?.dragonRewards)?[...new Set(p.dragonRewards.filter((id:any)=>typeof id==='string'&&id.length<120))] as string[]:[];}
export function materialClaimed(p:any,kind:string,id:string){return materialLedger(p).includes(kind+':'+id);}
export function addMaterials(p:any,r:DragonMaterials,kind:string,id:string){if(materialClaimed(p,kind,id))return p;const b=p?.dragonBloodline||{};return {...p,dragonBloodline:{...b,essence:nat(b.essence)+r.essence,marrow:nat(b.marrow)+r.marrow,core:nat(b.core)+r.core},dragonRewards:[...materialLedger(p),kind+':'+id]};}
export function ascensionMaterials(p:any,tier:number):DragonMaterials{const k=kingCultivation(p);return k.gold||k.silver?[{essence:5,marrow:1,core:0},{essence:15,marrow:3,core:0},{essence:40,marrow:8,core:1}][tier]||{essence:0,marrow:0,core:0}:{essence:0,marrow:0,core:0};}
export function cultivationLabel(p:any){const k=kingCultivation(p);return k.gold&&k.silver?'气血淬炼＋元素培养（共享一份材料）':k.gold?'气血淬炼':k.silver?'元素培养':'普通魂灵培养';}
