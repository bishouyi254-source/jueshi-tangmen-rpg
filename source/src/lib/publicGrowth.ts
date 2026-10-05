import {dragonProgress,armorTier} from './dragonLegend';
import {hasGoldKing,goldSeals,goldEvolutions} from './goldKing';
import {readGoldBlood} from './goldDominance';
import {hasSilverKing,silverRanks} from './silverKing';
import {hasTwinDragon,readTwin,twinActiveStage} from './twinDragon';

const nat=(v:unknown,max:number)=>typeof v==='number'&&Number.isFinite(v)?Math.min(max,Math.max(0,Math.floor(v))):0;
const ranks=(raw:any,keys:string[])=>Object.fromEntries(keys.map(k=>[k,nat(raw?.[k],4)]));
export interface PublicGrowth {
 version:1;
 armor:{parts:number[];tier:number;equipped:boolean;style:string;name:string};
 gold:{unlocked:boolean;seals:number;evolutions:Record<string,number>;points:number};
 silver:{unlocked:boolean;elements:Record<string,number>;body:Record<string,number>;points:number};
 twin:{unlocked:boolean;stage:number;activeStage:number;points:number};
}
// Strict display-only summary: no resources, claim receipts, battle state or account data.
export function sanitizePublicGrowth(v:any):PublicGrowth|undefined {
 if(v?.version!==1)return undefined;
 const parts=Array.from({length:11},(_,i)=>nat(v.armor?.parts?.[i],4));
 return {version:1,armor:{parts,tier:Math.min(...parts),equipped:v.armor?.equipped===true,style:['attack','defense','control','support'].includes(v.armor?.style)?v.armor.style:'attack',name:typeof v.armor?.name==='string'?[...v.armor.name].slice(0,4).join(''):''},
 gold:{unlocked:v.gold?.unlocked===true,seals:nat(v.gold?.seals,18),evolutions:ranks(v.gold?.evolutions,['claw','body','core','state']),points:nat(v.gold?.points,2000)},
 silver:{unlocked:v.silver?.unlocked===true,elements:ranks(v.silver?.elements,['火','水','土','风','光','暗','空间']),body:ranks(v.silver?.body,['body','spirit','heart','space']),points:nat(v.silver?.points,2000)},
 twin:{unlocked:v.twin?.unlocked===true,stage:nat(v.twin?.stage,5),activeStage:Math.min(nat(v.twin?.stage,5),nat(v.twin?.activeStage,5)),points:nat(v.twin?.points,2000)}};
}
export function publicGrowth(p:any):PublicGrowth {
 const a=dragonProgress(p),s=silverRanks(p),t=readTwin(p?.twinResonance);
 return sanitizePublicGrowth({version:1,armor:{parts:a.parts,tier:armorTier(p),equipped:a.equipped,style:a.style,name:a.name},
 gold:{unlocked:hasGoldKing(p),seals:goldSeals(p),evolutions:goldEvolutions(p),points:readGoldBlood(p?.goldBlood).points},
 silver:{unlocked:hasSilverKing(p),elements:s.elements,body:s.body,points:s.insight.points},
 twin:{unlocked:hasTwinDragon(p),stage:t.stage,activeStage:twinActiveStage(p),points:t.points}})!;
}
