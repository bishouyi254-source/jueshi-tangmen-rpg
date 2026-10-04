import {goldSeals,goldEvolutions,goldSkill} from './goldKing';
import {silverRanks,silverSkill} from './silverKing';
import {goldRewardEligibility} from './goldDominance';
export const TWIN_STAGES=[
 {name:'双龙初鸣',level:60,points:100,essence:100,marrow:0,core:0,seals:6},
 {name:'气血交融',level:99,points:300,essence:200,marrow:20,core:2,seals:6},
 {name:'金银同调',level:139,points:700,essence:400,marrow:40,core:4,seals:12},
 {name:'双域合奏',level:159,points:1300,essence:600,marrow:60,core:6,seals:16},
 {name:'双龙归一',level:169,points:2000,essence:800,marrow:80,core:8,seals:18},
] as const;
const nat=(v:any)=>Number.isFinite(v)?Math.max(0,Math.floor(v)):0;
export function hasTwinDragon(p:any){return p?.isTwinSoul===true&&['金龙王','银龙王'].every(n=>[p?.martialSoul?.name,p?.secondSoul?.name].includes(n));}
export function readTwin(v:any){return {version:1,points:Math.min(2000,nat(v?.points)),stage:Math.min(5,nat(v?.stage)),claimed:Array.isArray(v?.claimed)?[...new Set(v.claimed.filter((id:any)=>typeof id==='string'&&id.length<100))].slice(-2000):[]};}
export function twinConditions(p:any,stage:number){
 const r=TWIN_STAGES[stage-1];if(!r)return ['无效阶段'];const g=goldEvolutions(p),s=silverRanks(p);
 const checks=[{ok:hasTwinDragon(p),label:'有效双生金龙王＋银龙王'},{ok:p?.level>=r.level,label:r.level+'级'},{ok:stage<3||!!p?.divineTrial?.inherited,label:stage<3?'无需神位':'继承神位'},{ok:goldSeals(p)>=r.seals,label:'金龙解开'+r.seals+'道封印'}];
 if(stage>1)checks.push({ok:Object.values(g).every(x=>x>=(stage===2?2:stage===3?3:4)),label:'金龙四路线均达'+(stage===2?2:stage===3?3:4)+'阶'});
 checks.push({ok:stage===1?Object.values(s.elements).filter(x=>x>=1).length>=3:Object.values(s.elements).every(x=>x>=(stage===2?2:stage===5?4:3)),label:stage===1?'至少3元素达到1阶':'七元素均达'+(stage===2?2:stage===5?4:3)+'阶'});
 if(stage>1)checks.push({ok:Object.values(s.body).every(x=>x>=(stage===2?2:stage===5?4:3)),label:'银龙四路线均达'+(stage===2?2:stage===5?4:3)+'阶'});
 return checks;
}
export function twinActiveStage(p:any){const v=readTwin(p?.twinResonance);let active=0;for(let i=1;i<=v.stage;i++){if(v.points<TWIN_STAGES[i-1].points||twinConditions(p,i).some((c:any)=>!c.ok))break;active=i;}return active;}
export function twinBonuses(p:any){const stage=twinActiveStage(p);return {stage,hp:stage*.01,defense:stage*.01,attack:Math.max(0,stage-1)*.01,spirit:Math.max(0,stage-1)*.01,damage:stage*.01};}
export function twinRate(p:any,g:any,s:any){const rate=twinBonuses(p).damage;return Math.min(.1,rate+(g?.turns>0&&s?.turns>0?rate:0));}
export function twinUpgrade(p:any,expected:number){const v=readTwin(p?.twinResonance),next=v.stage+1,r=TWIN_STAGES[next-1],fail=(reason:string)=>({player:p,reason});if(v.stage!==expected)return fail('进度已变化，请重新查看');if(!r)return fail('已达最高阶段');if(p?.dragonValley?.trial||p?.dragonValley?.exploration||p?.dragonLegend?.trial&&!p.dragonLegend.trial.claimed)return fail('请先结束龙谷探索或试炼');const missing=twinConditions(p,next).filter((x:any)=>!x.ok).map((x:any)=>x.label);if(missing.length)return fail('未满足：'+missing.join('、'));if(v.points<r.points)return fail('共鸣值不足');const b=p.dragonBloodline||{};if((b.essence||0)<r.essence||(b.marrow||0)<r.marrow||(b.core||0)<r.core)return fail('龙谷材料不足');return {reason:'',player:{...p,twinResonance:{...v,stage:next},dragonBloodline:{...b,essence:b.essence-r.essence,marrow:b.marrow-r.marrow,core:b.core-r.core}}};}
export function extendTwinDomain(p:any,b:any){return b?{...b,turns:b.turns>0&&twinActiveStage(p)>=4?4:b.turns}:b;}
export function createTwinBattle(p:any,config:any,id:string){if(!hasTwinDragon(p)||p.level<60)return;return {version:1,id,reward:goldRewardEligibility(p,config).reward,settled:false,used:false,cooldowns:{}};}
export function readTwinBattle(v:any){if(v?.version!==1||typeof v.id!=='string'||!v.id||v.id.length>=100)return;return {version:1,id:v.id,reward:[1,3,10].includes(v.reward)?v.reward:0,settled:v.settled===true,used:v.used===true,cooldowns:Object.fromEntries(['strike','guard'].map(k=>[k,nat(v.cooldowns?.[k])]))};}
export function settleTwin(p:any,b:any,phase:string){if(!hasTwinDragon(p)||p.level<60||phase!=='victory'||!b?.reward)return p;const v=readTwin(p.twinResonance);if(v.points>=2000||v.claimed.includes(b.id))return p;return {...p,twinResonance:{...v,points:Math.min(2000,v.points+b.reward),claimed:[...v.claimed,b.id]}};}
export const TWIN_SKILLS=[{id:'strike',name:'金银合击',stage:3,cost:.12,cooldown:4,desc:'伤害1.20/1.30/1.40×D，不继承魂技附带效果'}, {id:'guard',name:'双龙护体',stage:4,cost:.10,cooldown:6,desc:'4%/5%护盾持续2次敌方行动；10%/12%直接减伤持续1次敌方行动'}, {id:'break',name:'双龙归一·破界',stage:5,cost:.20,cooldown:0,desc:'双领域有效时伤害1.60×D，每场一次；释放后直接易伤10%，持续1次敌方行动'}] as const;
export function twinSkillReady(p:any,b:any,id:string,turn:number,mana:number,maxMana:number,g:any,s:any){const skill=TWIN_SKILLS.find(x=>x.id===id),stage=twinActiveStage(p),cost=Math.ceil(maxMana*(skill?.cost||0));const reason=!b||!skill?'无效联动技能':stage<skill.stage?'共鸣阶段不足':id==='break'&&b.used?'本场已使用破界':id==='break'&&!(g?.turns>0&&s?.turns>0)?'需要双领域同时有效':(b.cooldowns?.[id]||0)>turn?'联动技能冷却中':mana<cost?'魂力不足':'';return {skill,stage,cost,reason};}
export function twinBaseDamage(p:any,attack:number,spirit:number,defense:number){const values=['金龙王','银龙王'].map(name=>{const index=p?.martialSoul?.name===name?0:1,rings=index?p?.secondSoulRings:p?.soulRings;const hits=(rings||[]).slice(0,6).map((ring:any,i:number)=>{const skill=name==='金龙王'?goldSkill(p,i,index):silverSkill(p,i,index);return skill?.skillType==='attack'?Math.max(1,(name==='金龙王'?attack:spirit)*(1+(ring.skillDamagePct>0?ring.skillDamagePct:1.5))*500/(Math.max(0,defense)+500)):0;});return Math.max(0,...hits);});return values.every(x=>x>0)?(values[0]+values[1])/2:0;}
