import {STAMINA_CAP} from './growthBatch3';
import {dragonProgress} from './dragonLegend';

export const ABYSS_CHAPTERS=[
 {name:'裂隙哨站',desc:'守住入口，抵御侵蚀与沉默。'},
 {name:'黑潮堡垒',desc:'突破护盾，阻止敌人吸血恢复。'},
 {name:'深渊核心',desc:'应对禁疗与净化，击败深渊统领。'},
];
export const ABYSS_NODES=[
 {id:'abyss-scout',name:'裂隙斥候',mechanic:'侵蚀',chapter:0,rank:0,attr:'attack',rules:{1:{target:[{id:'erosion',type:'dot',label:'侵蚀',scale:.5,turns:3,negative:true}]}}},
 {id:'abyss-silencer',name:'噤声使徒',mechanic:'沉默',chapter:0,rank:1,attr:'spirit',rules:{2:{target:[{id:'silence',type:'silence',label:'沉默',turns:1,chance:.3,negative:true}]}}},
 {id:'abyss-gatekeeper',name:'裂隙守门者',mechanic:'护盾／侵蚀',chapter:0,rank:2,attr:'attack',rules:{2:{nonDamage:true,shield:.04},3:{target:[{id:'erosion',type:'dot',label:'侵蚀',scale:.6,turns:3,negative:true}]}}},
 {id:'abyss-armored',name:'黑潮甲卫',mechanic:'护盾／减伤',chapter:1,rank:0,attr:'defense',rules:{2:{nonDamage:true,shield:.04},3:{nonDamage:true,self:[{id:'reduction',type:'reduction',label:'减伤',value:.15,turns:2}]}}},
 {id:'abyss-vampire',name:'噬血猎手',mechanic:'吸血',chapter:1,rank:1,attr:'attack',rules:{1:{lifesteal:.2},3:{lifesteal:.3}}},
 {id:'abyss-tide-lord',name:'黑潮领主',mechanic:'吸血／沉默',chapter:1,rank:2,attr:'spirit',rules:{1:{lifesteal:.2},2:{target:[{id:'silence',type:'silence',label:'沉默',turns:1,chance:.3,negative:true}]},3:{nonDamage:true,shield:.05}}},
 {id:'abyss-corruptor',name:'腐蚀织者',mechanic:'侵蚀／禁疗',chapter:2,rank:0,attr:'spirit',rules:{1:{target:[{id:'erosion',type:'dot',label:'侵蚀',scale:.7,turns:3,negative:true}]},2:{target:[{id:'antiHeal',type:'antiHeal',label:'禁疗',value:.5,turns:2,negative:true}]}}},
 {id:'abyss-purifier',name:'深渊祭司',mechanic:'净化／治疗',chapter:2,rank:1,attr:'spirit',rules:{2:{nonDamage:true,heal:.02,cleanse:true},3:{nonDamage:true,shield:.05}}},
 {id:'abyss-commander',name:'深渊统领',mechanic:'禁疗／护盾／吸血',chapter:2,rank:2,attr:'attack',rules:{1:{lifesteal:.2},2:{nonDamage:true,shield:.06},3:{target:[{id:'antiHeal',type:'antiHeal',label:'禁疗',value:.5,turns:2,negative:true}]}}},
] as const;
export type AbyssMode='standard'|'divine';
export type AbyssProgress={version:1;merit:number;crystals:number;lastMode:AbyssMode;cleared:string[];trial:null|{id:string;node:string;mode:AbyssMode;claimed:boolean}};
const nat=(x:any)=>Number.isFinite(x)?Math.max(0,Math.floor(x)):0;
const key=(mode:string,node:string)=>mode+':'+node;
export function abyssProgress(p:any):AbyssProgress{
 const d=p?.abyssFrontier||{},valid=new Set(ABYSS_NODES.flatMap(n=>['standard','divine'].map(m=>key(m,n.id))));
 const t=d.trial,n=ABYSS_NODES.find(n=>n.id===t?.node);
 return {version:1,merit:nat(d.merit),crystals:nat(d.crystals),lastMode:d.lastMode==='divine'?'divine':'standard',cleared:[...new Set((Array.isArray(d.cleared)?d.cleared:[]).filter(k=>valid.has(k)))],trial:t&&n&&['standard','divine'].includes(t.mode)&&typeof t.id==='string'?{id:t.id,node:t.node,mode:t.mode,claimed:t.claimed===true}:null};
}
export function abyssRequirements(p:any,nodeId:string,mode:AbyssMode){
 const node=ABYSS_NODES.find(n=>n.id===nodeId),d=abyssProgress(p);
 if(!node||!['standard','divine'].includes(mode))return {reason:'无效深渊关卡',stamina:0,coins:0};
 const index=ABYSS_NODES.indexOf(node),level=mode==='divine'?100:99;
 const reason=p.level<level?'需要'+level+'级':mode==='divine'&&!p.divineTrial?.inherited?'神位难度需要完成神位继承':index>0&&!d.cleared.includes(key(mode,ABYSS_NODES[index-1].id))?'请先通关前一关':'';
 return {reason,stamina:[80,120,200][node.rank]*(mode==='divine'?2:1),coins:[1000,3000,8000][node.rank]*(node.chapter+1)*(mode==='divine'?2:1)};
}
export function abyssReward(nodeId:string,mode:AbyssMode,first:boolean){
 const n=ABYSS_NODES.find(n=>n.id===nodeId);if(!n)return {merit:0,crystals:0,ore:0,soulforged:0};
 const factor=(n.chapter+1)*(mode==='divine'?3:1);
 return {merit:[20,40,100][n.rank]*factor,crystals:n.rank===2?(first?3:1):0,ore:first?10*(n.chapter+1):0,soulforged:first&&n.rank===2?1:0};
}
export function abyssAction(p:any,a:any,now=Date.now()){
 const fail=(reason:string)=>({player:p,reason,message:''});if(!p)return fail('请先进入角色');
 const d=abyssProgress(p),dragon=dragonProgress(p);let stamina=p.stamina,coins=p.soulCoins,message='';
 if(a.type==='enter'){
  if(d.trial&&!d.trial.claimed)return fail('请先结束当前深渊挑战');
  if(typeof a.id!=='string'||!a.id)return fail('无效战斗记录');
  const r=abyssRequirements(p,a.node,a.mode);if(r.reason)return fail(r.reason);
  stamina=Math.min(STAMINA_CAP,nat(p.stamina)+Math.max(0,Math.floor((now-(p.staminaUpdatedAt||now))/1000))*100);
  if(stamina<r.stamina)return fail('体力不足');if(coins<r.coins)return fail('魂币不足');
  stamina-=r.stamina;coins-=r.coins;d.lastMode=a.mode;d.trial={id:a.id,node:a.node,mode:a.mode,claimed:false};message='进入深渊前线';
 }else if(a.type==='win'){
  const t=d.trial;if(!t||t.id!==a.id||t.claimed)return fail('该深渊战斗已结算或不存在');
  const k=key(t.mode,t.node),first=!d.cleared.includes(k),r=abyssReward(t.node,t.mode,first);
  d.merit+=r.merit;d.crystals+=r.crystals;dragon.ore+=r.ore;dragon.soulforged+=r.soulforged;
  if(first)d.cleared.push(k);d.trial={...t,claimed:true};
  message=`深渊胜利：军功 +${r.merit}${r.crystals?'，深渊结晶 +'+r.crystals:''}${first?'；首次通关：矿石 +'+r.ore+(r.soulforged?'、魂锻沉银 +1':''):''}`;
 }else if(a.type==='leave'){
  if(d.trial?.id!==a.id)return fail('当前挑战已结束');d.trial=null;message='深渊挑战已结束';
 }else if(a.type==='exchange'){
  if(d.trial&&!d.trial.claimed)return fail('挑战中不能兑换');
  const cost=a.material==='ore'?40:a.material==='soulforged'?200:0;if(!cost)return fail('无效兑换');
  if(d.merit<cost)return fail('军功不足');d.merit-=cost;if(a.material==='ore')dragon.ore+=10;else dragon.soulforged++;
  message=a.material==='ore'?'兑换沉银矿石 ×10':'兑换魂锻沉银 ×1';
 }else return fail('未知操作');
 return {player:{...p,stamina,soulCoins:coins,staminaUpdatedAt:a.type==='enter'?now:p.staminaUpdatedAt,dragonLegend:dragon,abyssFrontier:d},message,reason:''};
}
export function reincarnateAbyss(p:any):AbyssProgress{return {...abyssProgress(null),cleared:abyssProgress(p).cleared};}
export function abyssEnemy(nodeId:string,mode:AbyssMode){
 const n=ABYSS_NODES.find(n=>n.id===nodeId);if(!n)throw Error('无效深渊敌人');
 const scale=[1,3,9][n.chapter]*[1,1.8,3][n.rank],god=mode==='divine';
 return {id:n.id,name:n.name,years:0,qualityColor:'#c4b5fd',qualityLabel:['普通','精英','首领'][n.rank],hp:Math.round((god?2e15:2e8)*scale),attack:Math.round((god?2e10:2e5)*scale),defense:Math.round((god?2e7:2e5)*scale),speed:Math.round((god?2e5:8000)*scale),spirit:Math.round((god?3e10:3e5)*scale),element:'暗属性',skillName:n.mechanic,skillDesc:n.mechanic+'；普攻25%／魂技75%（魂力及冷却允许时）'};
}
