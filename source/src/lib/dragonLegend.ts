// Dragon Legend progression. All resource changes are one pure transaction.
export const ARMOR_PARTS = ['头箍','胸铠','左肩铠','右肩铠','左手甲','右手甲','护腰战裙','左大腿铠','右大腿铠','左战靴','右战靴'];
export const TRIALS = [
  {name:'初级升灵台',level:60,stamina:60,coins:1000,reward:100,scale:.65},
  {name:'中级升灵台',level:75,stamina:120,coins:5000,reward:400,scale:1},
  {name:'高级升灵台',level:90,stamina:240,coins:20000,reward:1200,scale:1.6},
];
export const EVOLUTIONS = [
  {name:'百年',years:100,cost:100}, {name:'千年',years:1000,cost:500},
  {name:'万年',years:10000,cost:2000}, {name:'十万年',years:100000,cost:8000},
  {name:'百万年',years:1000000,cost:30000},
];
export type DragonProgress = {version:1;lingli:number;forgeExp:number;ore:number;thousand:number;spiritual:number;parts:number[];equipped:boolean;style:string;name:string;trial:null|{id:string;tier:number;claimed:boolean}};
export function dragonProgress(p:any):DragonProgress {
  const d=p?.dragonLegend||{};const n=(x:any)=>Number.isFinite(x)?Math.max(0,Math.floor(x)):0;
  return {version:1,lingli:n(d.lingli),forgeExp:n(d.forgeExp),ore:n(d.ore),thousand:n(d.thousand),spiritual:n(d.spiritual),parts:ARMOR_PARTS.map((_,i)=>Math.min(2,n(d.parts?.[i]))),equipped:d.equipped===true,style:['attack','defense','control','support'].includes(d.style)?d.style:'attack',name:typeof d.name==='string'?d.name.slice(0,2):'',trial:d.trial&&typeof d.trial.id==='string'&&TRIALS[d.trial.tier]?{...d.trial,claimed:!!d.trial.claimed}:null};
}
export function armorTier(p:any){return Math.min(...dragonProgress(p).parts);}
export function spiritEvolution(s:any){return Math.min(5,Math.max(0,Math.floor(Number(s?.evolutionStage)||0)));}
export function evolutionMultiplier(s:any){return 1+spiritEvolution(s)*.1;}
export function armorBonuses(p:any){
  const d=dragonProgress(p),b={attack:0,defense:0,speed:0,spirit:0,hp:0};if(!d.equipped)return b;
  const points=d.parts.reduce((a,b)=>a+b,0);if(!points)return b;
  const base=points*.003;for(const k of Object.keys(b))b[k]=base;
  const tier=armorTier(p);if(tier){const map={attack:'attack',defense:'defense',control:'spirit',support:'hp'};b[map[d.style]]+=tier*.05;if(tier===2){const attr=String(p.martialSoul?.element||p.martialSoul?.extremeAttribute||'');const key=/精神|光|暗/.test(attr)?'spirit':/风/.test(attr)?'speed':/土|水|冰/.test(attr)?'defense':/木|生命/.test(attr)?'hp':'attack';b[key]+=.03;}}
  return b;
}
export function dragonAction(p:any,a:any,now=Date.now()):{player:any;reason?:string;message?:string} {
  const fail=(reason:string)=>({player:p,reason});if(!p)return fail('请先进入角色');
  const d=dragonProgress(p);let coins=p.soulCoins||0;const stamina=Math.min(6000,(p.stamina||0)+Math.max(0,Math.floor((now-(p.staminaUpdatedAt||now))/1000))*100);let energy=stamina;
  const spend=(c:number,e=0)=>{if(coins<c)return '魂币不足';if(energy<e)return '体力不足';coins-=c;energy-=e;return '';};
  let spirits=p.soulSpirits||[],message='操作成功';
  switch(a.type){
    case 'mine': {if(p.level<10)return fail('10级解锁采矿');const error=spend(200,20);if(error)return fail(error);d.ore+=5;message='采集沉银矿石 ×5';break;}
    case 'forge': {if(p.level<10)return fail('10级解锁锻造');const tier=a.tier;if(tier!==1&&tier!==2)return fail('无效锻造等级');if(tier===2&&d.forgeExp<100)return fail('锻造经验达到100后解锁灵锻');if(d.ore<(tier===1?5:10))return fail('沉银矿石不足');const error=spend(tier===1?500:2000);if(error)return fail(error);d.ore-=tier===1?5:10;if(tier===1)d.thousand++;else d.spiritual++;d.forgeExp+=tier===1?10:25;message=tier===1?'千锻成功，经验+10':'灵锻成功，经验+25';break;}
    case 'craft': {const i=a.part;if(!Number.isInteger(i)||i<0||i>=11)return fail('无效部件');const tier=d.parts[i]+1;if(tier>2)return fail('该部件已达二字');if(p.level<(tier===1?50:60)||(p.soulRings||[]).length<(tier===1?5:6))return fail(tier===1?'需要50级和主修5环':'需要60级和主修6环');const key=tier===1?'thousand':'spiritual';if(d[key]<2)return fail(tier===1?'需要千锻沉银 ×2':'需要灵锻沉银 ×2');const error=spend(tier===1?3000:10000);if(error)return fail(error);d[key]-=2;d.parts[i]=tier;message=`${ARMOR_PARTS[i]}${tier===1?'制作':'晋升'}成功`;break;}
    case 'equip': {if(!d.parts.some(x=>x>0))return fail('请先制作斗铠');d.equipped=!d.equipped;message=d.equipped?'斗铠已装备':'斗铠已卸下';break;}
    case 'configure': {if(!['attack','defense','control','support'].includes(a.style))return fail('无效套装方向');const tier=armorTier(p);if(tier<1)return fail('凑齐一字套装后才能命名');const name=String(a.name||'').trim();if([...name].length!==tier)return fail(`斗铠名称需要${tier}个字`);d.style=a.style;d.name=name;message='斗铠命名与方向已保存';break;}
    case 'evolve': {const i=spirits.findIndex(s=>s.spiritId===a.id);if(i<0)return fail('请选择已契约的普通魂灵');const s=spirits[i],stage=spiritEvolution(s);if(stage>=5)return fail('已达百万年进化上限');const target=EVOLUTIONS[stage];if(d.lingli<target.cost)return fail(`需要灵力 ${target.cost}`);d.lingli-=target.cost;spirits=spirits.map((x,j)=>j===i?{...x,evolutionStage:stage+1,evolutionYears:target.years}:x);message=`${s.name}进化为${target.name}魂灵，战斗属性额外+${(stage+1)*10}%`;break;}
    case 'enter': {const t=TRIALS[a.tier];if(!t||p.level<t.level)return fail('未达到试炼解锁等级');if(!spirits.length)return fail('请先契约一个普通魂灵');if(d.trial&&!d.trial.claimed)return fail('请先结束当前升灵台试炼');if(typeof a.id!=='string'||!a.id)return fail('无效试炼');const error=spend(t.coins,t.stamina);if(error)return fail(error);d.trial={id:a.id,tier:a.tier,claimed:false};message='进入升灵台';break;}
    case 'win': {if(!d.trial||d.trial.id!==a.id||d.trial.claimed)return fail('该试炼已结算或不存在');d.lingli+=TRIALS[d.trial.tier].reward;d.trial.claimed=true;message=`试炼成功，灵力 +${TRIALS[d.trial.tier].reward}`;break;}
    case 'leave': {if(d.trial?.id===a.id)d.trial=null;break;}
    default:return fail('未知操作');
  }
  return {player:{...p,soulCoins:coins,stamina:energy,staminaUpdatedAt:now,soulSpirits:spirits,dragonLegend:d},message};
}
export function reincarnateDragon(p:any){return {...dragonProgress(null),forgeExp:dragonProgress(p).forgeExp};}
