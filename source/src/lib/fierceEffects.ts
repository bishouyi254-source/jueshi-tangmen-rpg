import {VALLEY_NODES} from './dragonBloodline';
import {ABYSS_NODES} from './abyssFrontier';
// BEGIN FIERCE EFFECTS ENGINE v1
// Pure battle rules. State is JSON serializable; no storage or React access.
var __FBProfiles = {
  "di-tian": {
    "id": "di-tian",
    "name": "帝天",
    "skills": [
      "黑龙爪",
      "龙威震慑",
      "黑龙护体",
      "暗龙之怒",
      "龙息吐息",
      "黑暗龙域",
      "武魂真身·金眼黑龙",
      "龙神之威",
      "黑龙吞天"
    ],
    "attr": "attack",
    "immortal": false,
    "rules": {
      "2": {
        "target": [
          {
            "id": "stun",
            "type": "stun",
            "label": "眩晕",
            "value": 0,
            "turns": 1,
            "chance": 0.25,
            "negative": true
          }
        ]
      },
      "3": {
        "nonDamage": true,
        "self": [
          {
            "id": "reduction",
            "type": "reduction",
            "label": "减伤",
            "value": 0.2,
            "turns": 2,
            "negative": false
          }
        ]
      },
      "9": {
        "lifesteal": 0.2
      }
    }
  },
  "xie-di": {
    "id": "xie-di",
    "name": "邪帝",
    "skills": [
      "精神冲击",
      "邪眼凝视",
      "灵魂撕裂",
      "精神风暴",
      "幻魔之眼",
      "暴君之怒",
      "武魂真身·邪眼暴君",
      "精神湮灭",
      "邪眼主宰"
    ],
    "attr": "spirit",
    "immortal": false,
    "rules": {
      "2": {
        "target": [
          {
            "id": "silence",
            "type": "silence",
            "label": "沉默",
            "value": 0,
            "turns": 1,
            "chance": 0.3,
            "negative": true
          }
        ]
      },
      "3": {
        "target": [
          {
            "id": "vulnerable",
            "type": "vulnerable",
            "label": "易伤",
            "value": 0.15,
            "turns": 2,
            "negative": true
          }
        ]
      },
      "8": {
        "manaDrain": 0.1
      }
    }
  },
  "bi-ji": {
    "id": "bi-ji",
    "name": "碧姬",
    "skills": [
      "翠羽回春",
      "翡翠护体",
      "生命祝福",
      "圣光治愈",
      "天鹅之舞",
      "生命领域",
      "武魂真身·翡翠天鹅",
      "万物复苏",
      "生命赞歌"
    ],
    "attr": "spirit",
    "immortal": false,
    "rules": {
      "2": {
        "nonDamage": true,
        "shield": 0.03
      },
      "4": {
        "nonDamage": true,
        "heal": 0.02
      },
      "8": {
        "nonDamage": true,
        "cleanse": true,
        "self": [
          {
            "id": "regen",
            "type": "hot",
            "label": "持续治疗",
            "value": 0.01,
            "turns": 2,
            "negative": false
          }
        ]
      }
    }
  },
  "wan-yao-wang": {
    "id": "wan-yao-wang",
    "name": "万妖王",
    "skills": [
      "毒藤缠绕",
      "妖眼幻术",
      "剧毒之触",
      "万藤穿心",
      "精神毒雾",
      "妖王领域",
      "武魂真身·妖眼魔树",
      "万毒噬心",
      "妖眼灭世"
    ],
    "attr": "spirit",
    "immortal": false,
    "rules": {
      "1": {
        "target": [
          {
            "id": "slow",
            "type": "slow",
            "label": "减速",
            "value": 0.2,
            "turns": 2,
            "negative": true
          }
        ]
      },
      "3": {
        "target": [
          {
            "id": "poison",
            "type": "dot",
            "label": "中毒",
            "value": 0,
            "turns": 3,
            "negative": true,
            "scale": 0.5
          }
        ]
      },
      "8": {
        "target": [
          {
            "id": "antiHeal",
            "type": "antiHeal",
            "label": "禁疗",
            "value": 0.5,
            "turns": 2,
            "negative": true
          }
        ]
      }
    }
  },
  "xiong-jun": {
    "id": "xiong-jun",
    "name": "熊君",
    "skills": [
      "恐爪撕裂",
      "暗金咆哮",
      "熊王护体",
      "巨力拍击",
      "破山一击",
      "金刚之身",
      "武魂真身·暗金恐爪熊",
      "暗金恐爪",
      "熊君临世"
    ],
    "attr": "attack",
    "immortal": false,
    "rules": {
      "1": {
        "target": [
          {
            "id": "armorDown",
            "type": "armorDown",
            "label": "破甲",
            "value": 0.2,
            "turns": 2,
            "negative": true
          }
        ]
      },
      "6": {
        "nonDamage": true,
        "self": [
          {
            "id": "reduction",
            "type": "reduction",
            "label": "减伤",
            "value": 0.15,
            "turns": 2,
            "negative": false
          },
          {
            "id": "reflect",
            "type": "reflect",
            "label": "反伤",
            "value": 0.2,
            "turns": 2,
            "negative": false
          }
        ]
      },
      "8": {
        "penetration": 0.3
      }
    }
  },
  "chi-wang": {
    "id": "chi-wang",
    "name": "赤王",
    "skills": [
      "赤焰撕咬",
      "三火焰",
      "魔獒护体",
      "烈焰冲击",
      "赤焰领域",
      "赤炎爆裂",
      "武魂真身·三头赤魔獒",
      "焚天烈焰",
      "三头齐鸣"
    ],
    "attr": "attack",
    "immortal": false,
    "rules": {
      "2": {
        "parts": 3
      },
      "8": {
        "target": [
          {
            "id": "burn",
            "type": "dot",
            "label": "灼烧",
            "value": 0,
            "turns": 3,
            "negative": true,
            "scale": 0.5
          }
        ]
      },
      "9": {
        "nonDamage": true,
        "self": [
          {
            "id": "attackUp",
            "type": "attackUp",
            "label": "攻击增益",
            "value": 0.2,
            "turns": 2,
            "negative": false
          }
        ]
      }
    }
  },
  "zi-ji": {
    "id": "zi-ji",
    "name": "紫姬",
    "skills": [
      "魔龙爪",
      "地狱冥火",
      "魔龙之威",
      "黑暗吞噬",
      "魔龙吐息",
      "地狱领域",
      "武魂真身·地狱魔龙",
      "魔光灭世",
      "地狱降临"
    ],
    "attr": "attack",
    "immortal": false,
    "rules": {
      "2": {
        "target": [
          {
            "id": "burn",
            "type": "dot",
            "label": "灼烧",
            "value": 0,
            "turns": 2,
            "negative": true,
            "scale": 0.5
          },
          {
            "id": "antiHeal",
            "type": "antiHeal",
            "label": "禁疗",
            "value": 0.3,
            "turns": 2,
            "negative": true
          }
        ]
      },
      "4": {
        "lifesteal": 0.25
      },
      "8": {
        "execute": 0.25
      }
    }
  },
  "gui-di": {
    "id": "gui-di",
    "name": "鬼帝",
    "skills": [
      "亡灵召唤",
      "寂灭之光",
      "骸骨护盾",
      "死亡凝视",
      "亡灵大军",
      "寂灭领域",
      "武魂真身·亡灵寂灭者",
      "生死轮转",
      "万魂寂灭"
    ],
    "attr": "attack",
    "immortal": true,
    "rules": {
      "2": {
        "target": [
          {
            "id": "decay",
            "type": "dot",
            "label": "寂灭侵蚀",
            "value": 0,
            "turns": 3,
            "negative": true,
            "scale": 0.5
          }
        ]
      },
      "4": {
        "target": [
          {
            "id": "silence",
            "type": "silence",
            "label": "沉默",
            "value": 0,
            "turns": 1,
            "chance": 0.25,
            "negative": true
          }
        ]
      },
      "8": {
        "nonDamage": true,
        "shield": 0.03
      }
    }
  },
  "tao-tie": {
    "id": "tao-tie",
    "name": "饕餮",
    "skills": [
      "饕餮噬咬",
      "吞噬万物",
      "饕餮之躯",
      "吞天巨口",
      "胃液消融",
      "饕餮领域",
      "武魂真身·饕餮",
      "一口吞尽",
      "饕餮降世"
    ],
    "attr": "attack",
    "immortal": false,
    "rules": {
      "2": {
        "lifesteal": 0.25
      },
      "3": {
        "nonDamage": true,
        "shield": 0.03
      },
      "8": {
        "manaDrain": 0.1,
        "manaSteal": true
      }
    }
  },
  "qing-jiao": {
    "id": "qing-jiao",
    "name": "青蛟王",
    "skills": [
      "蛟尾横扫",
      "雷霆一击",
      "青蛟护体",
      "雷电缠绕",
      "雷霆咆哮",
      "雷暴领域",
      "武魂真身·青金蛟",
      "万雷齐发",
      "青蛟化龙"
    ],
    "attr": "attack",
    "immortal": false,
    "rules": {
      "2": {
        "target": [
          {
            "id": "stun",
            "type": "stun",
            "label": "眩晕",
            "value": 0,
            "turns": 1,
            "chance": 0.25,
            "negative": true
          }
        ]
      },
      "4": {
        "target": [
          {
            "id": "slow",
            "type": "slow",
            "label": "减速",
            "value": 0.2,
            "turns": 2,
            "negative": true
          }
        ]
      },
      "8": {
        "chase": 0.3
      }
    }
  },
  "xue-di": {
    "id": "xue-di",
    "name": "雪帝",
    "skills": [
      "雪舞极冰",
      "寒冰封冻",
      "雪女护体",
      "暴风雪",
      "绝对零度",
      "极寒领域",
      "武魂真身·冰天雪女",
      "雪帝三绝",
      "冰雪降临"
    ],
    "attr": "attack",
    "immortal": false,
    "rules": {
      "2": {
        "target": [
          {
            "id": "freeze",
            "type": "freeze",
            "label": "冻结",
            "value": 0,
            "turns": 1,
            "chance": 0.35,
            "negative": true
          }
        ]
      },
      "3": {
        "nonDamage": true,
        "shield": 0.03
      },
      "4": {
        "target": [
          {
            "id": "slow",
            "type": "slow",
            "label": "减速",
            "value": 0.25,
            "turns": 2,
            "negative": true
          }
        ]
      }
    }
  },
  "bing-di": {
    "id": "bing-di",
    "name": "冰帝",
    "skills": [
      "冰蝎尾钩",
      "翡翠冰刃",
      "帝皇护体",
      "冰爆术",
      "永冻之域",
      "帝皇之威",
      "武魂真身·冰碧帝皇蝎",
      "冰碧之光",
      "帝皇寒极"
    ],
    "attr": "attack",
    "immortal": false,
    "rules": {
      "1": {
        "target": [
          {
            "id": "freeze",
            "type": "freeze",
            "label": "冻结",
            "value": 0,
            "turns": 1,
            "chance": 0.25,
            "negative": true
          }
        ]
      },
      "2": {
        "penetration": 0.25
      },
      "3": {
        "nonDamage": true,
        "self": [
          {
            "id": "reflect",
            "type": "reflect",
            "label": "反伤",
            "value": 0.2,
            "turns": 2,
            "negative": false
          }
        ]
      }
    }
  },
  "xiao-bai": {
    "id": "xiao-bai",
    "name": "小白",
    "skills": [
      "鲨齿撕咬",
      "寒冰吐息",
      "魔鲨之躯",
      "海啸冰浪",
      "深海寒冰",
      "鲨歌领域",
      "武魂真身·魔魂大白鲨",
      "冰封万里",
      "魔鲨吞天"
    ],
    "attr": "attack",
    "immortal": false,
    "rules": {
      "1": {
        "target": [
          {
            "id": "bleed",
            "type": "dot",
            "label": "流血",
            "value": 0,
            "turns": 3,
            "negative": true,
            "scale": 0.5
          }
        ]
      },
      "4": {
        "parts": 2
      },
      "9": {
        "execute": 0.2
      }
    }
  },
  "bing-feng-wang": {
    "id": "bing-feng-wang",
    "name": "冰凰",
    "skills": [
      "冰凰俯冲",
      "凤舞冰天",
      "冰晶凰羽",
      "涅槃冰封",
      "寒焰之翼",
      "冰凰领域",
      "武魂真身·冰凰",
      "九天冷凰",
      "万载寒冰"
    ],
    "attr": "attack",
    "immortal": false,
    "rules": {
      "2": {
        "target": [
          {
            "id": "freeze",
            "type": "freeze",
            "label": "冻结",
            "value": 0,
            "turns": 1,
            "chance": 0.3,
            "negative": true
          }
        ]
      },
      "3": {
        "nonDamage": true,
        "self": [
          {
            "id": "reduction",
            "type": "reduction",
            "label": "减伤",
            "value": 0.2,
            "turns": 2,
            "negative": false
          }
        ]
      },
      "4": {
        "nonDamage": true,
        "self": [
          {
            "id": "regen",
            "type": "hot",
            "label": "持续治疗",
            "value": 0.01,
            "turns": 2,
            "negative": false
          }
        ]
      }
    }
  }
};
function __fbClone(s) { return JSON.parse(JSON.stringify(s)); }
function __fbFinite(n, fallback=0) { return Number.isFinite(n)?n:fallback; }
function __fbCreate(beastId, enemy, player, spirits=[]) {
  function actor(a) { return {name:a.name||'',hp:Math.max(0,a.hp),maxHp:Math.max(1,a.maxHp||a.hp),mana:Math.max(0,a.mana||0),maxMana:Math.max(0,a.maxMana||a.mana||0),stats:{attack:a.attack||0,defense:a.defense||0,speed:a.speed||0,spirit:a.spirit||0},effects:{},shield:0,action:0,immortalUsed:false}; }
  const actors={enemy:actor(enemy),player:actor(player)};
  for(const a of spirits) actors['spirit:'+a.id]=actor(a);
  return {version:1,beastId,actors,cooldowns:{},actions:0};
}
function __fbValue(a,type) { return Math.max(0,...Object.values(a.effects).filter(e=>e.type===type).map(e=>e.value||0)); }
function __fbAdd(s,key,e,logs=[]) {
  const a=s.actors[key];if(!a||a.hp<=0)return;
  const old=a.effects[e.id];
  a.effects[e.id]={...e,value:Math.max(e.value||0,old?.value||0),turns:Math.max(1,e.turns||1),born:a.action};
  logs.push(`${a.name} 获得【${e.label}】（${e.turns||1}次行动）。`);
}
function __fbHeal(s,key,amount,logs=[],label='治疗') {
  const a=s.actors[key];if(!a||a.hp<=0)return 0;
  const n=Math.min(a.maxHp-a.hp,Math.max(0,Math.round(amount*(1-Math.min(1,__fbValue(a,'antiHeal'))))));
  a.hp+=n;if(n>0)logs.push(`${a.name} ${label}恢复 ${n} 点气血。`);return n;
}
function __fbShield(s,key,pct,logs=[]) {
  const a=s.actors[key];if(!a||a.hp<=0)return;
  a.shield=Math.min(Math.floor(a.maxHp*.06),Math.max(a.shield,Math.floor(a.maxHp*pct)));
  logs.push(`${a.name} 获得护盾，当前 ${a.shield} 点。`);
}
function __fbDamage(s,target,amount,options={},logs=[]) {
  const a=s.actors[target],attacker=s.actors[options.attacker||'player'];
  if(!a||a.hp<=0||amount<=0)return {lost:0,absorbed:0,reflected:0};
  let damage=Math.max(0,Math.round(amount)),twinIncrement=0;
  if(options.direct!==false&&!options.raw)damage=Math.round(damage*(1-Math.min(.9,__fbValue(a,'goldDirectReduction'))));
  if(options.direct!==false&&!options.raw&&attacker){
    const gold=__fbValue(attacker,'directDamageUp'),silver=options.silverSkill?__fbValue(attacker,'silverSkillUp'):0,before=damage,link=Math.min(.1,Math.max(0,options.twinRate||0));
    damage=Math.round(damage*(1+gold+silver+link));twinIncrement=damage-Math.round(before*(1+gold+silver));
    if(gold||silver||link)logs.push(`领域增幅：直接伤害 +${Math.round(gold*100)}%、银龙魂技 +${Math.round(silver*100)}%，金银共鸣 +${Math.round(link*100)}%，同阶段合计 +${Math.round((gold+silver+link)*100)}%；${before} → ${damage}（护盾前）。`);
  }
  if(!options.raw){const vulnerable=Math.max(__fbValue(a,'vulnerable'),options.direct!==false?__fbValue(a,'goldDirectVulnerable'):0);damage=Math.round(damage*(1+vulnerable)*(1-Math.min(.9,__fbValue(a,'reduction'))));twinIncrement=Math.round(twinIncrement*(1+vulnerable)*(1-Math.min(.9,__fbValue(a,'reduction'))));}
  if(Number.isFinite(options.cap))damage=Math.min(damage,Math.max(0,options.cap));
  if(options.direct!==false&&!options.raw&&attacker?.effects?.goldCounter&&attacker.goldCounterCharge>0&&attacker.hp>0){damage+=Math.min(Math.round(damage*.5),attacker.goldCounterCharge);attacker.goldCounterCharge=0;logs.push('金龙霸体：承受来力转为反击。');}
  const absorbed=Math.min(a.shield,damage);a.shield-=absorbed;a.twinShieldAmount=Math.max(0,(a.twinShieldAmount||0)-absorbed);damage-=absorbed;
  const before=a.hp;let lost=Math.min(before,damage);a.hp=before-lost;
  if(a.hp===0&&target==='enemy'&&__FBProfiles[s.beastId]?.immortal&&!a.immortalUsed){a.hp=1;a.immortalUsed=true;lost=before-1;logs.push('鬼帝触发【生死轮转】：本场唯一一次免死，保留1点气血。');}
  if(options.direct!==false&&!options.raw&&a.hp>0&&__fbValue(a,'goldCounter')>0)a.goldCounterCharge=Math.min(Math.floor(a.maxHp*.08),(a.goldCounterCharge||0)+Math.round(lost*.5));
  if(twinIncrement>0){const benefit=Math.max(0,lost-Math.min(before,Math.max(0,damage-twinIncrement)));logs.push('金银共鸣：本次实际扣血增量 '+benefit+'（含护盾、减伤与过量伤害限制）。');}
  let reflected=0;
  // The defender must survive the hit; lethal hits never retaliate.
  if(options.direct!==false&&a.hp>0&&attacker?.hp>0){
    reflected=Math.min(Math.round(lost*__fbValue(a,'reflect')),Math.floor(attacker.maxHp*.08),attacker.hp);
    if(reflected>0){__fbDamage(s,options.attacker||'player',reflected,{direct:false,raw:true},logs);logs.push(`${a.name} 反伤 ${reflected} 点气血。`);}
  }
  return {lost,absorbed,reflected};
}
function __fbBegin(s,key,logs=[]) {
  const a=s.actors[key];if(!a||a.hp<=0)return {skip:true,dead:true};
  if(key==='enemy'){const p=s.actors.player;if(p&&Number.isFinite(p.twinShieldTurns)){if(p.twinShieldTurns<=0){p.shield=Math.max(0,p.shield-(p.twinShieldAmount||0));p.twinShieldAmount=0;delete p.twinShieldTurns;}else p.twinShieldTurns--; }for(const id of ['goldDominion','twinGuard','twinRisk']){const e=s.actors.player?.effects?.[id];if(e){if(e.turns<=0)delete s.actors.player.effects[id];else e.turns--;}}}
  a.action++;
  const values=Object.values(a.effects),strongestDot=values.filter(e=>e.type==='dot').sort((a,b)=>b.value-a.value)[0],strongestHot=values.filter(e=>e.type==='hot').sort((a,b)=>b.value-a.value)[0];
  for(const e of values){
    if(e.type==='dot'&&e!==strongestDot||e.type==='hot'&&e!==strongestHot)continue;
    if(e.type==='dot'&&a.hp>0){const cap=Math.floor(a.maxHp*.03),n=Math.min(Math.round(e.value),cap);const hit=__fbDamage(s,key,n,{direct:false,cap},logs);logs.push(`${a.name} 【${e.label}】损失 ${hit.lost} 点气血${hit.absorbed?`，护盾吸收${hit.absorbed}`:''}。`);}
    if(e.type==='hot')__fbHeal(s,key,a.maxHp*e.value,logs,'持续治疗');
  }
  const controlled=Object.values(a.effects).find(e=>e.type==='freeze'||e.type==='stun');
  if(controlled&&a.hp>0)logs.push(`${a.name} 受到【${controlled.label}】，跳过本次行动。`);
  return {skip:a.hp<=0||!!controlled,dead:a.hp<=0};
}
function __fbExpireTwinShield(s) {const p=s?.actors?.player;if(p&&p.twinShieldTurns===0){p.shield=Math.max(0,p.shield-(p.twinShieldAmount||0));p.twinShieldAmount=0;delete p.twinShieldTurns;}}
function __fbFinish(s,key,deferShieldExpiration=false) {
  if(key==='enemy'&&!deferShieldExpiration)__fbExpireTwinShield(s);
  const a=s.actors[key];if(!a)return;
  

  if(!a.effects.goldCounter)a.goldCounterCharge=0;
  for(const [id,e] of Object.entries(a.effects))if(!e.manual&&e.type!=='goldDirectReduction'&&e.id!=='twinRisk'&&e.born<a.action&&--e.turns<=0)delete a.effects[id];
}
function __fbDirect(s,target,damage,options={}) {
  const next=__fbClone(s),logs=[],result=__fbDamage(next,target,damage,options,logs);
  return {next,logs,...result};
}
function __fbDefense(s,key,originalDef,penetration=0) {
  const a=s.actors[key];return Math.max(0,originalDef*(1+(a?__fbValue(a,'defenseUp'):0))*(1-Math.min(.9,a?__fbValue(a,'armorDown'):0))*(1-Math.min(1,penetration)));
}
function __fbSpeed(s,key,base) { return Math.max(1,base*(1-Math.min(.9,__fbValue(s.actors[key],'slow')))); }
function __fbEnemyAction(state,context={},rng=Math.random) {
  const s=__fbClone(state),logs=[],a=s.actors.enemy,profile=__FBProfiles[s.beastId];
  if(!profile||!a||a.hp<=0)return {next:s,logs,damage:0,nonDamage:true,skillName:'',target:'player'};
  const start=__fbBegin(s,'enemy',logs);
  if(start.skip){__fbFinish(s,'enemy');return {next:s,logs,damage:0,nonDamage:true,skillName:'无法行动',target:'player'};}
  for(const key of Object.keys(s.cooldowns))s.cooldowns[key]=Math.max(0,s.cooldowns[key]-1);
  const available=profile.skills.map((name,i)=>({name,slot:i+1})).filter(x=>!s.cooldowns[x.slot]&&a.mana>=x.slot*60);
  const useSkill=available.length>0&&rng()<.75;
  const choice=useSkill?available[Math.min(available.length-1,Math.floor(rng()*available.length))]:{name:'普通攻击',slot:0};
  const rule=profile.rules[choice.slot]||{},target=context.target||'player',t=s.actors[target];
  if(!t||t.hp<=0){__fbFinish(s,'enemy');return {next:s,logs,damage:0,nonDamage:true,skillName:choice.name,target};}
  if(useSkill){s.cooldowns[choice.slot]=rule.nonDamage?3:2;a.mana-=choice.slot*60;}
  const attr=a.stats[profile.attr||'attack']*(1+__fbValue(a,'attackUp'))*(1-Math.min(.9,__fbValue(a,'attackDown')));
  let damage=0,totalLost=0,isCrit=false;
  if(!rule.nonDamage){
    const def=__fbDefense(s,target,context.defense??t.stats.defense,rule.penetration||0);
    const variance=.9+rng()*.2;isCrit=rng()<Math.min(.15,.05+a.stats.attack/5000);
    damage=Math.max(1,Math.round(attr*(useSkill?3:1)*500/(def+500)*variance*(isCrit?1.5:1)));
    if(rule.execute&&t.hp/t.maxHp<.3)damage=Math.round(damage*(1+rule.execute));
    damage=Math.max(1,Math.round(damage*Math.min(1,Math.max(0,context.directDamageMultiplier??1))));
    const parts=rule.parts||1;
    // Split an unchanged damage budget, so rounding never increases total damage.
    for(let i=0;i<parts&&a.hp>0&&t.hp>0;i++){
      const part=Math.floor(damage/parts)+(i<damage%parts?1:0);
      const hit=__fbDamage(s,target,part,{attacker:'enemy',direct:true},logs);totalLost+=hit.lost;
      logs.push(`${a.name} ${choice.name}${parts>1?`（第${i+1}段）`:''}造成 ${hit.lost} 点气血伤害${hit.absorbed?`，护盾吸收${hit.absorbed}`:''}。`);
    }
    if(rule.chase&&a.hp>0&&t.hp>0&&rng()<rule.chase){const hit=__fbDamage(s,target,Math.round(damage*.3),{attacker:'enemy',direct:true},logs);totalLost+=hit.lost;logs.push(`${a.name} 追击造成 ${hit.lost} 点伤害。`);}
    if(rule.lifesteal&&a.hp>0)__fbHeal(s,'enemy',Math.min(totalLost*rule.lifesteal,a.maxHp*.03),logs,'吸血');
  }else logs.push(`${a.name} 使用「${choice.name}」，本次不追加攻击。`);
  if(a.hp>0){
    if(rule.heal)__fbHeal(s,'enemy',a.maxHp*rule.heal,logs);
    if(rule.shield)__fbShield(s,'enemy',rule.shield,logs);
    if(rule.cleanse){for(const [key,e] of Object.entries(a.effects))if(e.negative)delete a.effects[key];logs.push(`${a.name} 净化自身负面状态。`);}
    for(const effect of rule.self||[])__fbAdd(s,'enemy',effect,logs);
    if(t.hp>0){
      for(const effect of rule.target||[])if(!effect.chance||rng()<effect.chance)__fbAdd(s,target,{...effect,value:effect.type==='dot'?attr*(effect.scale||.5):effect.value},logs);
      if(rule.manaDrain){const n=Math.min(t.mana,Math.floor(t.mana*rule.manaDrain));t.mana-=n;if(rule.manaSteal)a.mana=Math.min(a.maxMana,a.mana+n);logs.push(`${t.name} 被削减 ${n} 点魂力。`);}
    }
  }
  __fbFinish(s,'enemy');s.actions++;
  return {next:s,logs,damage:totalLost,nonDamage:!!rule.nonDamage,skillName:choice.name,slot:choice.slot,target,isCrit};
}
function __fbStatus(s) {
  if(!s)return '';
  return Object.values(s.actors).filter(a=>a.hp>0).map(a=>{
    const effects=Object.values(a.effects).map(e=>`${e.type==='freeze'?'❄️':e.type==='reflect'?'↩️':e.type==='hot'?'💚':e.type==='dot'?'☠️':'◆'}${e.label}(${e.turns})`);
    if(a.shield>0)effects.unshift(`🛡️护盾 ${a.shield}`);
    return effects.length?`${a.name}：${effects.join(' · ')}`:'';
  }).filter(Boolean).join('\n');
}
// END FIERCE EFFECTS ENGINE

for(const n of ABYSS_NODES)__FBProfiles[n.id]={id:n.id,name:n.name,skills:['深渊侵袭','暗潮秘术','深渊威压'],attr:n.attr,immortal:false,rules:n.rules};
for(const n of VALLEY_NODES)__FBProfiles[n.id]={id:n.id,name:n.name,skills:['龙魂侵袭','遗迹秘术','龙威'],attr:n.attr,immortal:false,rules:n.rules};
export {__fbExpireTwinShield,__fbAdd,__fbShield,__FBProfiles,__fbClone,__fbCreate,__fbHeal,__fbDefense,__fbDirect,__fbBegin,__fbFinish,__fbEnemyAction,__fbSpeed,__fbStatus};
