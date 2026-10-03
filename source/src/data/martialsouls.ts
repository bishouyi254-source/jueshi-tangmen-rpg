import {GOLD_KING_BASE_SKILLS} from '../lib/goldKing';
// EXPORTS: IMartialSoul, MOCK_MARTIAL_SOULS, generateSoulSkills, getSoulDepartment, getSoulElement, getCultivationAttr, CULTIVATION_ATTR_LABEL, evolveMartialSoul
export interface IMartialSoul {
  id: string
  name: string
  quality: 'epic' | 'legendary' | 'divine' | 'superDivine' | 'supremeDivine'; // 至高神级为最高
  type: string
  description: string
  /** 极致属性，如 '极致之冰'、'极致之精神' 等；没有则为 null */
  extremeAttribute?: string
  /** 武魂主属性，如 '冰属性'、'火属性' 等，用于属性克制计算 */
  element?: string
  /** 修炼属性，决定魂技伤害计算使用哪个属性值 */
  cultivationAttr: 'strength' | 'spirit' | 'agility' | 'defense' | 'support'
  /** 初始五维属性（武魂自带基础值） */
  baseStats: {
    attack: number
    defense: number
    speed: number
    spirit: number
    hp: number
  }
  /** 9个魂技（第一魂技…第九魂技），按系别+武魂名自动生成 */
  soulSkills: string[]
  customSoulSkills?: string[]
}

// === 魂技生成 v12.0：按属性 + 系别 + 器/兽武魂 三维度生成 ===
// 第7魂技恒为「武魂真身」，generateSoulSkills 返回的数组中索引6位留空占位

/** 各属性的核心动词语汇（每个属性9个，对应第1~9魂技，不含第7位） */
const ELEMENT_VERBS: Record<string, string[]> = {
  '冰属性': ['冰刺', '寒冰', '冰霜', '冰封', '冰刃', '冰晶', '极寒', '冰狱', '绝对零度'],
  '火属性': ['火球', '烈焰', '火墙', '火雨', '爆裂', '炎爆', '赤焰', '焚天', '红莲业火'],
  '雷属性': ['雷击', '雷网', '雷球', '雷暴', '瞬雷', '雷霆', '紫电', '雷劫', '九天神雷'],
  '水属性': ['水弹', '水幕', '水龙卷', '海潮', '水流', '水牢', '碧水', '沧海', '万川归海'],
  '金属性': ['金锋', '金刃', '金光', '金盾', '金芒', '剑阵', '锋锐', '神兵', '万剑归宗'],
  '木属性': ['藤蔓', '藤鞭', '荆棘', '花毒', '缠绕', '树根', '生机', '森林', '万象森罗'],
  '土属性': ['土墙', '岩石', '地刺', '石牢', '震地', '山崩', '厚土', '山岳', '大地之力'],
  '风属性': ['风刃', '风斩', '疾风', '风暴', '龙卷', '风翔', '狂风', '天风', '万风朝宗'],
  '光明属性': ['光弹', '光刃', '净化', '圣光', '神圣', '光芒', '圣辉', '天光', '神圣审判'],
  '黑暗属性': ['暗影', '黑刺', '噬魂', '幽冥', '腐蚀', '寂灭', '深渊', '冥河', '永恒黑暗'],
  '光属性': ['光弹', '光刃', '净化', '圣光', '神圣', '光芒', '圣辉', '天光', '神圣审判'],
  '暗属性': ['暗影', '黑刺', '噬魂', '幽冥', '腐蚀', '寂灭', '深渊', '冥河', '永恒黑暗'],
  '空间属性': ['空间斩', '空间刃', '瞬移', '空间裂隙', '空间折叠', '空间坍塌', '空间之狱', '空间风暴', '万象空间'],
  '时间属性': ['时间减缓', '时间加速', '时间停止', '时间回溯', '时间扭曲', '时间长河', '时间之狱', '永恒时光', '时间审判'],
  '精神属性': ['精神冲击', '精神探查', '精神眩晕', '精神针刺', '灵魂震摄', '幻境', '精神域', '灵魂剥夺', '神识之剑'],
  '混沌属性': ['混沌拳', '混沌气', '混沌光', '混沌漩涡', '混沌爆', '混沌域', '混沌劫', '混沌神', '混沌归一'],
  '全属性': ['元力弹', '元素刃', '元素环', '元素爆', '万象归一', '六芒阵', '元素域', '神元', '众神之殇'],
}

const DEFAULT_ELEMENT_VERBS = ['冲击', '破击', '光刃', '震荡', '爆发', '降临', '奥义', '神技', '终极技']

/** 器武魂后缀（冷兵器感） */
const WEAPON_SUFFIXES = ['式', '斩', '击', '爆', '震', '域', '诀', '劫', '奥义']
/** 兽武魂后缀（兽性爆发感） */
const BEAST_SUFFIXES = ['撕', '吼', '冲击', '破灭', '狂暴', '真身力', '怒', '变', '神威']

/** 系别修饰词（用于魂技描述气质，不直接改名） */
const DEPT_ADJECTIVE: Record<string, string> = {
  '强攻系': '', // 强攻系直接用属性动词名
  '敏攻系': '瞬',
  '控制系': '缚',
  '辅助系': '佑',
  '防御系': '御',
}

/** 判断是否器武魂 */
function isWeaponSoul(type: string, name: string): boolean {
  if (type.includes('器武魂')) return true
  const weaponKeywords = ['剑', '刀', '枪', '棍', '棒', '斧', '锤', '矛', '弓', '扇', '琴', '鼎', '钟', '塔', '书', '玉', '如意', '杖', '刃', '盘', '镜', '印']
  for (const kw of weaponKeywords) if (name.includes(kw)) return true
  return false
}

/** 获取武魂主属性的短名（冰属性→冰） */
function getElementShortName(element: string): string {
  return element.replace('属性', '').replace('极致之', '')
}

export function getSoulDepartment(type: string): string {
  const depts = ['强攻系', '敏攻系', '控制系', '辅助系', '防御系']
  for (const d of depts) {
    if (type.includes(d)) return d
  }
  return '强攻系'
}

export function generateSoulSkills(soul: Omit<IMartialSoul, 'id' | 'soulSkills' | 'cultivationAttr'>): string[] {
  if(soul.name==='金龙王')return [...GOLD_KING_BASE_SKILLS];
  if(soul.customSoulSkills?.length===9)return [...soul.customSoulSkills];
  const customSkills={"曜金龙戟":["第1魂技·龙锋刺","第2魂技·曜金破阵","第3魂技·龙鳞斩","第4魂技·金戟裂空","第5魂技·百刃归锋","第6魂技·龙吟贯日","武魂真身","第8魂技·万锋镇天","第9魂技·曜金龙皇破"],"霜魄灵瞳":["第1魂技·霜瞳凝念","第2魂技·灵魄束缚","第3魂技·镜雪迷阵","第4魂技·寒念冲击","第5魂技·碎魄凝光","第6魂技·霜心灵域","武魂真身","第8魂技·万念归寂","第9魂技·霜魄神识之剑"],"虚空天隼":["第1魂技·隼影突袭","第2魂技·裂空双翼","第3魂技·虚空掠爪","第4魂技·流隙疾冲","第5魂技·千影锋羽","第6魂技·天隼空痕","武魂真身","第8魂技·万羽破界","第9魂技·虚空天隼神化"],"镇岳玄龟":["第1魂技·玄甲壁","第2魂技·镇岳盾","第3魂技·磐山墙","第4魂技·厚土玄甲","第5魂技·山岳屏障","第6魂技·玄龟圣盾","武魂真身","第8魂技·镇岳金身","第9魂技·万古玄龟盾"],"星露琉璃莲":["第1魂技·星露光矢","第2魂技·琉璃祝福","第3魂技·莲华冲击","第4魂技·星露庇护","第5魂技·青莲审判","第6魂技·琉璃神恩","武魂真身","第8魂技·星露绽放","第9魂技·琉璃莲华神罚"]}[soul.name];if(customSkills)return [...customSkills];
  const element = (soul.element && soul.element !== '无属性') ? soul.element : getSoulElement(soul.name)
  const dept = getSoulDepartment(soul.type)
  const isWeapon = isWeaponSoul(soul.type, soul.name)
  
  // 获取属性动词列表
  const verbs = ELEMENT_VERBS[element] || DEFAULT_ELEMENT_VERBS
  const elemShort = getElementShortName(element)
  const deptAdj = DEPT_ADJECTIVE[dept] || ''
  const suffixes = isWeapon ? WEAPON_SUFFIXES : BEAST_SUFFIXES

  // 提取武魂关键字
  let key = soul.name
  if (soul.name.includes('之')) key = soul.name.split('之')[0]
  if (key.length < 2) key = soul.name

  /**
   * 命名规则：
   * - 器武魂：第X魂技·武魂名+属性动词+后缀（如「昊天锤·泰坦之锤」→ 第1魂技·泰坦冰刺式）
   * - 兽武魂：第X魂技·属性+武魂关键词+后缀（如「冰碧帝皇蝎」→ 第1魂技·冰帝利爪）
   * - 辅助系：「佑」+ 属性词 + 后缀（更柔和）
   * - 第7魂技永远是「武魂真身」，此处占位为 null，由吸收逻辑赋值
   */
  const skills: string[] = []
  for (let i = 0; i < 9; i++) {
    if (i === 6) {
      // 第7魂技：武魂真身（占位，战斗/吸收逻辑会统一赋值）
      skills.push('武魂真身')
      continue
    }
    const verb = verbs[i] || `第${i + 1}式`
    const suffix = suffixes[i] || ''
    
    if (dept === '辅助系') {
      // 辅助系魂技命名（攻击/辅助交替，第1/3/5/9为攻击，第2/4/6/8为辅助）
      const attackNames = ['光矢', '圣光冲击', '光之审判', '圣耀之箭', '神罚之光', '星辰爆裂', '神圣之怒', '天启', '创世神罚']
      const healNames = ['祝福', '治愈', '灵光', '庇护', '圣谕', '神恩', '群体加持', '生命绽放', '万物复苏']
      // 奇位（索引0/2/4/8即第1/3/5/9魂技）为攻击魂技，偶位（索引1/3/5/7即第2/4/6/8魂技）为辅助魂技
      const isAttackSlot = i % 2 === 0; // 0/2/4/6/8 → 第1/3/5/7/9
      if (i === 6) {
        // 第7魂技：武魂真身（已在上面处理，这里不会走到）
        skills.push('武魂真身')
      } else if (isAttackSlot) {
        skills.push(`第${i + 1}魂技·${elemShort}${attackNames[i] || verb}`)
      } else {
        skills.push(`第${i + 1}魂技·${elemShort}${healNames[i] || verb}`)
      }
    } else if (dept === '防御系') {
      const defNames = ['壁', '盾', '墙', '甲', '屏障', '圣盾', '不动明王', '不灭金身', '万古之盾']
      skills.push(`第${i + 1}魂技·${elemShort}${defNames[i] || verb}`)
    } else if (dept === '控制系') {
      const ctrlNames = ['缠绕', '束缚', '迷阵', '冰封', '噬魂', '领域', '天罗地网', '万魂朝宗', '寂灭之境']
      // 控制系优先保留属性特征
      skills.push(`第${i + 1}魂技·${verb}·${ctrlNames[i] || suffix}`)
    } else if (isWeapon) {
      // 器武魂：关键字 + 属性动词 + 后缀
      skills.push(`第${i + 1}魂技·${key}${verb}${suffix}`)
    } else {
      // 兽武魂：属性形容词 + 武魂关键字 + 后缀/动作
      const beastActions = ['爪', '尾', '咆哮', '冲击', '爆裂', '虚影', '真身', '怒吼', '神化']
      const act = beastActions[i] || suffix
      skills.push(`第${i + 1}魂技·${elemShort}帝·${key}${act}`)
    }
  }
  return skills
}
const superDivineSouls: Omit<IMartialSoul, 'id' | 'soulSkills' | 'cultivationAttr'>[] = [
  {
    name: '天诛剑', quality: 'superDivine', type: '器武魂·强攻系',
    extremeAttribute: '极致之金',
    element: '金属性',
    description: '作者的佩剑，天生寂灭，诛天灭地，天诛！',
    baseStats: { attack: 95, defense: 50, speed: 80, spirit: 85, hp: 90 },
  },
  {
    name: '造化玉蝶', quality: 'superDivine', type: '器武魂·辅助系',
    description: '造化初开时的至宝玉蝶，掌控造化之力，万法归宗，能化万物、纳万法、愈万伤',
    extremeAttribute: '极致之光',
    element: '光属性',
    baseStats: { attack: 40, defense: 50, speed: 75, spirit: 98, hp: 70 },
  },
  {
    name: '孤竹', quality: 'superDivine', type: '器武魂·强攻系',
    description: '开天辟地时的第一株灵竹，竹影婆娑可纳天地万象，空间之力俱全，被誉为万物之始',
    extremeAttribute: '极致之木',
    element: '木属性',
    baseStats: { attack: 92, defense: 55, speed: 78, spirit: 90, hp: 85 },
  },
  {
    name: '如意金箍棒', quality: 'superDivine', type: '器武魂·强攻系',
    description: '上古至宝，定海神针，可大可小随心变化，重一万三千五百斤，一棒之下乾坤倒转，空间之力俱全',
    extremeAttribute: '极致之光',
    element: '光属性',
    baseStats: { attack: 98, defense: 55, speed: 75, spirit: 88, hp: 92 },
  },
  {
    name: '魔刀千刃', quality: 'superDivine', type: '器武魂·强攻系',
    description: '魔界至强魔刀，千刃齐发，一刀之下山河破碎，空间之力汇聚于刀锋，号称万刃之祖',
    extremeAttribute: '极致之暗',
    element: '暗属性',
    baseStats: { attack: 100, defense: 45, speed: 82, spirit: 80, hp: 88 },
  },
]

// === 至高神级（1%）两仪神剑——阴阳茶赐予的无上武魂 ===
const supremeDivineSouls: Omit<IMartialSoul, 'id' | 'soulSkills' | 'cultivationAttr'>[] = [
  {
    name: '金龙王', quality: 'supremeDivine', type: '兽武魂·强攻系',
    description: '本游戏改编的金龙王武魂：气血魂技随魂环解锁；十二封印将第一至第四魂技进化为龙皇禁法，十六封印将第五、第六、第八、第九魂技进化。血脉可培养爪部、身体、龙核和血龙变。第七、第九初始魂技为游戏原创。',
    extremeAttribute: '极致之金', element:'金属性',
    baseStats:{attack:125,defense:95,speed:90,spirit:85,hp:140},
    customSoulSkills:[...GOLD_KING_BASE_SKILLS],
  },
  {
    name: '两仪神剑', quality: 'supremeDivine', type: '器武魂·强攻系',
    description: '阴阳茶赐予的至高神级武魂，一剑两仪，阴阳轮转，化生万物。极致之金，锋锐无双。拥有者每突破一个大境界永久获得10%攻击力加成，首次击败阴阳茶可使所有魂环年限+100万年。',
    extremeAttribute: '极致之金',
    element: '金属性',
    baseStats: { attack: 120, defense: 80, speed: 95, spirit: 100, hp: 120 },
  },
  {
    name: '混沌无极', quality: 'supremeDivine', type: '兽武魂·强攻系',
    description: '混沌之灵所化的至高神级武魂，通体幽黑如墨，拥有吞噬万物化为己用的神秘力量。据说拥有该武魂的人，运气会变得非常好。每次击败魂兽后可选择吞噬，随机永久增加一项五维属性。',
    extremeAttribute: '极致之暗',
    element: '暗属性',
    baseStats: { attack: 115, defense: 75, speed: 90, spirit: 110, hp: 130 },
  },
  {
    name: '裂魂神戟', quality: 'supremeDivine', type: '器武魂·强攻系',
    description: '由破碎神魂凝聚而成的至高神级长戟，戟身流转银白神念光纹，既是兵刃，又可直接斩碎意识。极致之暗蕴含神念之力，特殊天赋【碎念汲取】：精神力×3转化为额外攻击力。胜利后每1京玩家直接攻击实际扣血增加1点永久精神力；魂灵、反伤、持续伤害、升灵台与轮回之影不计入，转世重置。',
    extremeAttribute: '极致之暗',
    element: '暗属性',
    baseStats: { attack: 115, defense: 72, speed: 88, spirit: 175, hp: 115 },
    customSoulSkills: [
      '第1魂技·念刺斩',
      '第2魂技·神念突刺',
      '第3魂技·裂魂震荡',
      '第4魂技·千念绞杀',
      '第5魂技·识海穿刺',
      '第6魂技·寂念领域',
      '武魂真身·裂魂神戟',
      '第8魂技·万魂崩灭',
      '第9魂技·神魂一斩',
    ],
  },
]

// === 神级（30%）===
const divineSouls: Omit<IMartialSoul, 'id' | 'soulSkills' | 'cultivationAttr'>[] = [
  {
    name: '六翼天使', quality: 'divine', type: '兽武魂·强攻系',
    description: '极致之光，天使神位传承武魂，神圣光辉普照万物',
    extremeAttribute: '极致之光',
    element: '光属性',
    baseStats: { attack: 85, defense: 70, speed: 75, spirit: 80, hp: 85 },
  },
  {
    name: '光明龙神蝶', quality: 'divine', type: '兽武魂·强攻系',
    description: '极致之光，龙神之力与光明女神蝶的完美融合，蝶翼一展龙神降世，光明之力冠绝天下',
    extremeAttribute: '极致之光',
    element: '光属性',
    baseStats: { attack: 90, defense: 55, speed: 92, spirit: 85, hp: 75 },
  },
  {
    name: '修罗之剑', quality: 'divine', type: '器武魂·强攻系',
    description: '修罗神位传承武魂，杀伐之剑，一剑出而万物寂',
    extremeAttribute: '极致之暗',
    element: '暗属性',
    baseStats: { attack: 95, defense: 45, speed: 80, spirit: 75, hp: 70 },
  },
  {
    name: '轮回之眼', quality: 'divine', type: '本体武魂·控制系',
    description: '极致之空间，掌控轮回之力，洞察生死奥秘，精神力至高',
    extremeAttribute: '极致之空间',
    element: '空间属性',
    baseStats: { attack: 55, defense: 45, speed: 60, spirit: 100, hp: 55 },
  },
  {
    name: '耀阳圣龙', quality: 'divine', type: '兽武魂·强攻系',
    description: '极致之光，罗三炮觉醒圣龙血脉后的究极形态，耀阳之光普照天地，一吼之下万魔退散',
    extremeAttribute: '极致之光',
    element: '光属性',
    baseStats: { attack: 92, defense: 75, speed: 78, spirit: 88, hp: 95 },
  },
  {
    name: '白银龙枪', quality: 'divine', type: '器武魂·强攻系',
    description: '银龙王传承武魂，极致之水与生命之力的化身',
    extremeAttribute: '极致之水',
    element: '水属性',
    baseStats: { attack: 80, defense: 65, speed: 75, spirit: 75, hp: 85 },
  },
  {
    name: '黄金龙枪', quality: 'divine', type: '器武魂·强攻系',
    description: '金龙王传承武魂，极致之金与毁灭之息的具现',
    extremeAttribute: '极致之金',
    element: '金属性',
    baseStats: { attack: 95, defense: 60, speed: 70, spirit: 55, hp: 95 },
  },
  {
    name: '命运之盘', quality: 'divine', type: '器武魂·控制系',
    description: '掌控时空秩序的至高神器，一盤定乾坤，流转命运长河，执掌时间与空间双法则',
    extremeAttribute: '极致之时间',
    element: '时间属性',
    baseStats: { attack: 55, defense: 60, speed: 85, spirit: 95, hp: 70 },
  },
  {
    name: '鸿蒙金乌', quality: 'divine', type: '兽武魂·强攻系',
    description: '太古洪荒的太阳神鸟，三足金乌浴火而生，一翼遮天焚尽八荒，号称万火之祖',
    extremeAttribute: '极致之火',
    element: '火属性',
    baseStats: { attack: 98, defense: 45, speed: 92, spirit: 80, hp: 80 },
  },
  {
    name: '奶龙', quality: 'divine', type: '兽武魂·强攻系',
    description: '空间之力的化身，可穿梭虚空、撕裂空间，以混沌为源，能兼容天下万属性，看似呆萌实则威力无穷',
    extremeAttribute: '极致之空间',
    element: '空间属性',
    baseStats: { attack: 90, defense: 55, speed: 95, spirit: 85, hp: 80 },
  },
]

// === 传说级（40%）===
const legendarySouls: Omit<IMartialSoul, 'id' | 'soulSkills' | 'cultivationAttr'>[] = [
  {
    name: '光明女神蝶', quality: 'legendary', type: '兽武魂·强攻系',
    description: '极致之光属性，美丽而强大，蝶翼一展光芒万丈',
    element: '光属性',
    baseStats: { attack: 80, defense: 55, speed: 90, spirit: 85, hp: 70 },
  },
  {
    name: '邪眸白虎', quality: 'legendary', type: '兽武魂·强攻系',
    description: '白虎武魂的变异形态，邪眸一开震慑乾坤',
    element: '金属性',
    baseStats: { attack: 85, defense: 65, speed: 70, spirit: 60, hp: 90 },
  },
  {
    name: '柔骨兔', quality: 'legendary', type: '兽武魂·敏攻系',
    description: '身形灵巧变幻万千，近身搏杀天下无双',
    element: '暗属性',
    baseStats: { attack: 75, defense: 45, speed: 90, spirit: 65, hp: 60 },
  },
  {
    name: '幽冥灵猫', quality: 'legendary', type: '兽武魂·敏攻系',
    description: '敏攻系顶级兽武魂，幽冥之中取敌首级',
    element: '暗属性',
    baseStats: { attack: 70, defense: 40, speed: 95, spirit: 60, hp: 55 },
  },
  {
    name: '邪火凤凰', quality: 'legendary', type: '兽武魂·强攻系',
    description: '凤凰武魂的邪化形态，火焰毁灭一切',
    element: '火属性',
    baseStats: { attack: 90, defense: 50, speed: 70, spirit: 65, hp: 75 },
  },
  {
    name: '蓝电霸王龙', quality: 'legendary', type: '兽武魂·强攻系',
    description: '上三宗传承武魂，雷霆霸主，威震大陆',
    element: '火属性',
    baseStats: { attack: 85, defense: 65, speed: 65, spirit: 60, hp: 90 },
  },
  {
    name: '碧磷蛇皇', quality: 'legendary', type: '兽武魂·控制系',
    description: '毒武魂的巅峰，碧磷蛇皇之毒举世无双',
    element: '木属性',
    baseStats: { attack: 65, defense: 50, speed: 65, spirit: 80, hp: 60 },
  },
  {
    name: '骨龙', quality: 'legendary', type: '兽武魂·敏攻系',
    description: '龙族亡灵武魂，空间之力与物理攻击兼具',
    element: '暗属性',
    baseStats: { attack: 80, defense: 55, speed: 85, spirit: 60, hp: 65 },
  },
  {
    name: '死亡蛛皇', quality: 'legendary', type: '兽武魂·控制系',
    description: '双生武魂之一，死亡蛛网笼罩一切',
    element: '暗属性',
    baseStats: { attack: 70, defense: 55, speed: 60, spirit: 85, hp: 65 },
  },
  {
    name: '噬魂蛛皇', quality: 'legendary', type: '兽武魂·控制系',
    description: '双生武魂之一，噬魂之毒侵蚀神魂',
    element: '暗属性',
    baseStats: { attack: 65, defense: 50, speed: 55, spirit: 90, hp: 60 },
  },
  {
    name: '三头赤魔獒', quality: 'legendary', type: '兽武魂·强攻系',
    description: '赤魔龙獒，三头齐出威震八方',
    element: '火属性',
    baseStats: { attack: 85, defense: 60, speed: 65, spirit: 55, hp: 85 },
  },
  {
    name: '玄龟', quality: 'legendary', type: '兽武魂·防御系',
    description: '玄武武魂的分支，防御极强，如玄铁龟甲',
    element: '水属性',
    baseStats: { attack: 50, defense: 95, speed: 35, spirit: 55, hp: 95 },
  },
  {
    name: '魔魂大白鲨', quality: 'legendary', type: '兽武魂·强攻系',
    description: '海魂师顶级武魂，魔魂之力与水之掌控',
    element: '水属性',
    baseStats: { attack: 80, defense: 60, speed: 75, spirit: 60, hp: 85 },
  },
  {
    name: '邪魔虎鲸', quality: 'legendary', type: '兽武魂·强攻系',
    description: '海中霸主，邪魔虎鲸王的力量传承',
    element: '暗属性',
    baseStats: { attack: 85, defense: 60, speed: 70, spirit: 55, hp: 85 },
  },
  {
    name: '昊天锤', quality: 'legendary', type: '器武魂·强攻系',
    description: '昊天锤，天下第一器武魂，锤法惊天',
    element: '金属性',
    baseStats: { attack: 95, defense: 60, speed: 50, spirit: 55, hp: 95 },
  },
  {
    name: '七宝琉璃塔', quality: 'legendary', type: '器武魂·辅助系',
    description: '天下第一辅助武魂，七宝转出有琉璃',
    element: '光属性',
    baseStats: { attack: 30, defense: 40, speed: 45, spirit: 95, hp: 75 },
  },
  {
    name: '七杀剑', quality: 'legendary', type: '器武魂·强攻系',
    description: '七杀剑出，一剑封喉，剑道至强之武魂',
    element: '金属性',
    baseStats: { attack: 90, defense: 50, speed: 75, spirit: 65, hp: 70 },
  },
  {
    name: '香肠', quality: 'legendary', type: '器武魂·辅助系',
    description: '食物系武魂，各种香肠带来不同增幅效果',
    element: '火属性',
    baseStats: { attack: 25, defense: 45, speed: 40, spirit: 85, hp: 85 },
  },
  {
    name: '九凤来仪萧', quality: 'legendary', type: '器武魂·控制系',
    description: '音波控制武魂，凤鸣九霄，声震四野',
    element: '精神属性',
    baseStats: { attack: 55, defense: 50, speed: 60, spirit: 85, hp: 60 },
  },
  {
    name: '盘龙棍', quality: 'legendary', type: '器武魂·强攻系',
    description: '棍武魂的巅峰，盘龙一出风云变色',
    element: '金属性',
    baseStats: { attack: 85, defense: 55, speed: 65, spirit: 60, hp: 85 },
  },
  {
    name: '冰晶刹弓', quality: 'legendary', type: '器武魂·强攻系',
    description: '极致之冰器武魂，弓身由万古寒冰凝结，一箭出而万物冰封',
    element: '冰属性',
    baseStats: { attack: 92, defense: 45, speed: 70, spirit: 70, hp: 75 },
  },
  {
    name: '冰碧帝皇蝎', quality: 'legendary', type: '兽武魂·强攻系',
    description: '极致之冰属性，冰碧帝皇蝎的至寒之力',
    element: '冰属性',
    baseStats: { attack: 85, defense: 60, speed: 70, spirit: 70, hp: 75 },
  },
  {
    name: '饕餮神牛', quality: 'legendary', type: '兽武魂·强攻系',
    description: '饕餮之力，吞噬万物，越吃越强，极致之土属性兽武魂',
    element: '土属性',
    baseStats: { attack: 85, defense: 70, speed: 45, spirit: 50, hp: 95 },
  },
  {
    name: '光明圣龙', quality: 'legendary', type: '兽武魂·强攻系',
    description: '光明属性的龙族武魂，神圣光明',
    element: '光属性',
    baseStats: { attack: 85, defense: 70, speed: 70, spirit: 75, hp: 85 },
  },
  {
    name: '黑暗圣龙', quality: 'legendary', type: '兽武魂·强攻系',
    description: '黑暗属性的龙族武魂，黑暗吞噬',
    element: '暗属性',
    baseStats: { attack: 85, defense: 65, speed: 70, spirit: 70, hp: 80 },
  },
  {
    name: '三足金蟾', quality: 'legendary', type: '兽武魂·辅助系',
    description: '稀有辅助兽武魂，三足金蟾吐宝纳财',
    element: '木属性',
    baseStats: { attack: 40, defense: 55, speed: 40, spirit: 80, hp: 80 },
  },
  {
    name: '朱晴冰蟾', quality: 'legendary', type: '兽武魂·控制系',
    description: '冰毒双属性武魂，冰蟾之毒寒冷刺骨',
    element: '冰属性',
    baseStats: { attack: 60, defense: 50, speed: 65, spirit: 80, hp: 60 },
  },
  {
    name: '三生镇魂鼎', quality: 'legendary', type: '器武魂·控制系',
    description: '攻守兼备，一鼎镇压山河，镇魂摄魄',
    element: '土属性',
    baseStats: { attack: 60, defense: 80, speed: 45, spirit: 80, hp: 90 },
  },
  {
    name: '灵眸', quality: 'legendary', type: '本体武魂·控制系',
    description: '传说级本体武魂，灵眸一开洞察万物。经历天梦冰蚕献祭奇遇后可蜕变为超神级极致之精神。',
    element: '精神属性',
    baseStats: { attack: 45, defense: 40, speed: 55, spirit: 100, hp: 50 },
  },
  {
    name: '擎天枪', quality: 'legendary', type: '器武魂·强攻系',
    description: '一柱擎天，枪出如龙，力压万钧',
    element: '金属性',
    baseStats: { attack: 90, defense: 55, speed: 70, spirit: 60, hp: 80 },
  },
  {
    name: '星尘剑', quality: 'legendary', type: '器武魂·强攻系',
    description: '星辰之力凝于剑身，一剑挥出星河流转',
    element: '空间属性',
    baseStats: { attack: 85, defense: 45, speed: 80, spirit: 70, hp: 65 },
  },
  {
    name: '欢愉面具', quality: 'legendary', type: '器武魂·控制系',
    description: '神秘的面具武魂，可操纵情绪与精神，一戴上面具便令人沉浸幻境无法自拔，精神力极强',
    element: '精神属性',
    baseStats: { attack: 50, defense: 45, speed: 65, spirit: 95, hp: 55 },
  },
  {
    name: '寒汐凝霜琴', quality: 'legendary', type: '器武魂·控制系',
    description: '上古冰琴，琴弦一动寒汐降世，凝霜千里，音波与冰力交织，控场能力登峰造极',
    element: '冰属性',
    baseStats: { attack: 60, defense: 50, speed: 60, spirit: 92, hp: 60 },
  },
  // ===== 传说级武魂（新增26个，无极致属性，仅元素属性）=====
  {
    name: '冰天雪女', quality: 'legendary', type: '兽武魂·控制系',
    description: '极北三大天王之首，极寒之力的化身，雪女一出天地皆白',
    element: '冰属性',
    baseStats: { attack: 70, defense: 55, speed: 75, spirit: 95, hp: 65 },
  },
  {
    name: '青龙', quality: 'legendary', type: '兽武魂·强攻系',
    description: '四大神兽之一，执掌东方，水之力',
    element: '水属性',
    baseStats: { attack: 88, defense: 70, speed: 80, spirit: 75, hp: 90 },
  },
  {
    name: '虚无吞炎', quality: 'legendary', type: '兽武魂·强攻系',
    description: '异火榜之上的存在，虚无吞炎吞噬一切火焰',
    element: '火属性',
    baseStats: { attack: 95, defense: 50, speed: 75, spirit: 70, hp: 75 },
  },
  {
    name: '玄武', quality: 'legendary', type: '兽武魂·防御系',
    description: '四大神兽之一，执掌北方，水与防御之力',
    element: '水属性',
    baseStats: { attack: 55, defense: 98, speed: 40, spirit: 70, hp: 100 },
  },
  {
    name: '紫霄神雷', quality: 'legendary', type: '器武魂·强攻系',
    description: '九天神雷之紫霄，雷霆之主，一击出而万雷齐发',
    element: '火属性',
    baseStats: { attack: 92, defense: 50, speed: 90, spirit: 70, hp: 70 },
  },
  {
    name: '十首火凤凰', quality: 'legendary', type: '兽武魂·强攻系',
    description: '凤凰中的至强存在，十首齐出焚尽苍穹',
    element: '火属性',
    baseStats: { attack: 95, defense: 55, speed: 75, spirit: 65, hp: 80 },
  },
  {
    name: '金眼黑龙', quality: 'legendary', type: '兽武魂·强攻系',
    description: '黑龙一族至强血脉，金瞳洞察，黑暗吞噬',
    element: '暗属性',
    baseStats: { attack: 92, defense: 65, speed: 70, spirit: 70, hp: 90 },
  },
  {
    name: '生命之树', quality: 'legendary', type: '器武魂·辅助系',
    description: '生命本源的化身，世界树之种，生机无限',
    element: '木属性',
    baseStats: { attack: 40, defense: 70, speed: 45, spirit: 95, hp: 100 },
  },
  {
    name: '青莲地心火', quality: 'legendary', type: '兽武魂·强攻系',
    description: '异火榜前列，青莲地心之火，燎原万里',
    element: '火属性',
    baseStats: { attack: 90, defense: 55, speed: 70, spirit: 70, hp: 75 },
  },
  {
    name: '破魔刀', quality: 'legendary', type: '器武魂·强攻系',
    description: '破魔之刃，斩断魔法与邪祟，金之锋锐',
    element: '金属性',
    baseStats: { attack: 95, defense: 50, speed: 75, spirit: 65, hp: 75 },
  },
  {
    name: '红尘魔龙', quality: 'legendary', type: '兽武魂·强攻系',
    description: '红尘历练而成的魔龙，暗之力，堕落与救赎',
    element: '暗属性',
    baseStats: { attack: 90, defense: 60, speed: 75, spirit: 70, hp: 85 },
  },
  {
    name: '浴火凤凰', quality: 'legendary', type: '兽武魂·强攻系',
    description: '浴火重生的凤凰，涅槃一次强一分',
    element: '火属性',
    baseStats: { attack: 88, defense: 55, speed: 85, spirit: 70, hp: 75 },
  },
  {
    name: '冰神', quality: 'legendary', type: '本体武魂·控制系',
    description: '冰雪之神的传承，寒封万古',
    element: '冰属性',
    baseStats: { attack: 72, defense: 55, speed: 75, spirit: 95, hp: 65 },
  },
  {
    name: '苍海棍', quality: 'legendary', type: '器武魂·强攻系',
    description: '苍茫大海之力凝于一棍，汹涌澎湃',
    element: '水属性',
    baseStats: { attack: 90, defense: 60, speed: 65, spirit: 65, hp: 85 },
  },
  {
    name: '赤炎饕餮牛', quality: 'legendary', type: '兽武魂·强攻系',
    description: '饕餮之力与神火相融，吞噬万物越吃越强',
    element: '火属性',
    baseStats: { attack: 90, defense: 75, speed: 50, spirit: 55, hp: 100 },
  },
  {
    name: '疾风枪', quality: 'legendary', type: '器武魂·敏攻系',
    description: '疾风之枪，枪出如风，一击必杀',
    element: '木属性',
    baseStats: { attack: 82, defense: 45, speed: 98, spirit: 60, hp: 60 },
  },
  {
    name: '沧澜剑', quality: 'legendary', type: '器武魂·强攻系',
    description: '沧澜万里之水凝于一剑，柔中带刚',
    element: '水属性',
    baseStats: { attack: 90, defense: 55, speed: 80, spirit: 70, hp: 70 },
  },
  {
    name: '卡冥狮', quality: 'legendary', type: '兽武魂·强攻系',
    description: '大地之力与幽冥狮王融合，稳如磐石',
    element: '土属性',
    baseStats: { attack: 85, defense: 80, speed: 55, spirit: 60, hp: 95 },
  },
  {
    name: '黄金龙', quality: 'legendary', type: '兽武魂·强攻系',
    description: '金龙一族至强血脉，黄金之火焚尽一切',
    element: '火属性',
    baseStats: { attack: 93, defense: 65, speed: 75, spirit: 60, hp: 90 },
  },
  {
    name: '冥王黑龙', quality: 'legendary', type: '兽武魂·强攻系',
    description: '冥王座下黑龙，冥界的守护者，黑暗与死亡',
    element: '暗属性',
    baseStats: { attack: 90, defense: 60, speed: 70, spirit: 75, hp: 85 },
  },
  {
    name: '天罡无极剑', quality: 'legendary', type: '器武魂·强攻系',
    description: '天罡正气与无极剑道，一剑光寒',
    element: '光属性',
    baseStats: { attack: 92, defense: 55, speed: 80, spirit: 75, hp: 75 },
  },
  {
    name: '日冕圣龙', quality: 'legendary', type: '兽武魂·强攻系',
    description: '日冕级别的黑暗圣龙，吞噬光明',
    element: '暗属性',
    baseStats: { attack: 90, defense: 70, speed: 70, spirit: 70, hp: 90 },
  },
  {
    name: '蓝冰莲花', quality: 'legendary', type: '器武魂·控制系',
    description: '冰与水之力，蓝莲绽放，冰封千里',
    element: '水属性',
    baseStats: { attack: 70, defense: 60, speed: 65, spirit: 90, hp: 70 },
  },
  {
    name: '烈阳弓', quality: 'legendary', type: '器武魂·敏攻系',
    description: '烈阳之力凝于弓弦，一箭出如烈日当空',
    element: '火属性',
    baseStats: { attack: 88, defense: 45, speed: 90, spirit: 65, hp: 60 },
  },
  // ===== 新增12个传说级武魂 =====
  {
    name: '醒神茶盏', quality: 'legendary', type: '器武魂·辅助系',
    description: '水属性，一盏醒神清茶，清心明目，提神醒脑，精神力倍增',
    element: '水属性',
    baseStats: { attack: 35, defense: 60, speed: 60, spirit: 90, hp: 65 },
  },
  {
    name: '斩魄刀', quality: 'legendary', type: '器武魂·控制系',
    description: '精神属性器武魂，斩魄刀出，始解与卍解皆可操控敌人心神',
    element: '暗属性',
    baseStats: { attack: 65, defense: 50, speed: 70, spirit: 90, hp: 55 },
  },
  {
    name: '凯溟龙戟', quality: 'legendary', type: '器武魂·强攻系',
    description: '黑暗属性，溟海之龙的力量凝于长戟，一戟出而幽冥开',
    element: '暗属性',
    baseStats: { attack: 90, defense: 65, speed: 60, spirit: 55, hp: 90 },
  },
  {
    name: '亡灵序曲·死者苏生', quality: 'legendary', type: '器武魂·强攻系',
    description: '黑暗属性，亡灵之音唤醒亡者之力，奏者一奏响彻九幽',
    element: '暗属性',
    baseStats: { attack: 85, defense: 55, speed: 60, spirit: 70, hp: 75 },
  },
  {
    name: '玄铁重剑', quality: 'legendary', type: '器武魂·强攻系',
    description: '金属性，重剑无锋大巧不工，玄铁之重一剑压万法',
    element: '金属性',
    baseStats: { attack: 92, defense: 80, speed: 35, spirit: 45, hp: 85 },
  },
  {
    name: '堕天使', quality: 'legendary', type: '兽武魂·强攻系',
    description: '黑暗属性兽武魂，堕天使之翼展开，天堂堕落的毁灭之力',
    element: '暗属性',
    baseStats: { attack: 90, defense: 55, speed: 85, spirit: 70, hp: 70 },
  },
  {
    name: '冰极霜灭龙', quality: 'legendary', type: '兽武魂·强攻系',
    description: '水属性龙族武魂，霜灭之力冻结天地万物',
    element: '水属性',
    baseStats: { attack: 90, defense: 65, speed: 70, spirit: 65, hp: 80 },
  },
  {
    name: '绝望光环', quality: 'legendary', type: '器武魂·控制系',
    description: '精神属性，绝望光环笼罩一切，精神力至高至强',
    element: '精神属性',
    baseStats: { attack: 45, defense: 40, speed: 65, spirit: 100, hp: 50 },
  },
  {
    name: '终焉之龙', quality: 'legendary', type: '兽武魂·强攻系',
    description: '黑暗属性龙武魂的顶点，终焉之力毁灭一切',
    element: '暗属性',
    baseStats: { attack: 95, defense: 75, speed: 70, spirit: 65, hp: 95 },
  },
  {
    name: '黄金叶', quality: 'legendary', type: '器武魂·强攻系',
    description: '金属性，黄金之叶锋利如刃，片片皆可杀人于无形',
    element: '金属性',
    baseStats: { attack: 70, defense: 50, speed: 90, spirit: 70, hp: 60 },
  },
  {
    name: '提丰', quality: 'legendary', type: '兽武魂·强攻系',
    description: '火属性，百龙之祖提丰的力量传承，火焰与毁灭的化身',
    element: '火属性',
    baseStats: { attack: 92, defense: 55, speed: 70, spirit: 60, hp: 80 },
  },
  {
    name: '影戮剑', quality: 'legendary', type: '器武魂·强攻系',
    description: '黑暗属性，影中杀戮之剑，一剑出鞘无影无踪',
    element: '暗属性',
    baseStats: { attack: 90, defense: 45, speed: 88, spirit: 70, hp: 60 },
  },
  {
    name: '雷霆夔牛', quality: 'legendary', type: '兽武魂·强攻系',
    description: '火属性，上古夔牛一吼雷鸣千里，雷霆万钧震慑八荒',
    element: '火属性',
    baseStats: { attack: 92, defense: 65, speed: 70, spirit: 70, hp: 90 },
  },
  {
    name: '斩龙刀', quality: 'legendary', type: '器武魂·强攻系',
    description: '光明属性，斩龙之刃出鞘万邪退散，一刀斩尽天下恶龙',
    element: '光属性',
    baseStats: { attack: 95, defense: 50, speed: 78, spirit: 80, hp: 65 },
  },
  {
    name: '星穹灵鹿', quality: 'legendary', type: '兽武魂·控制系',
    description: '光明属性，身如星辰凝聚的灵鹿，鹿角间流转星穹之力，一瞥一眸皆可摄人心魂',
    element: '光属性',
    baseStats: { attack: 45, defense: 48, speed: 72, spirit: 95, hp: 60 },
  },
  {
    name: '太虚古龙', quality: 'legendary', type: '兽武魂·强攻系',
    description: '掌控空间之力的上古龙族，穿梭太虚撕裂乾坤，龙威所至万法退散，一爪可裂虚空',
    element: '空间属性',
    baseStats: { attack: 80, defense: 60, speed: 85, spirit: 92, hp: 70 },
  },
  {
    name: '镇魂碑', quality: 'legendary', type: '器武魂·控制系',
    description: '镇压万千阴魂的上古神碑，碑出则万魂俯首，镇魂、封印、镇压三绝冠绝天下',
    element: '土属性',
    baseStats: { attack: 42, defense: 65, speed: 55, spirit: 97, hp: 75 },
  },
  {
    name: '春秋蝉', quality: 'legendary', type: '兽武魂·控制系',
    description: '传说中掌控时间的奇异武魂，蝉鸣一声春去秋来，可逆转光阴、操控时序，兼具辅助加持与控制时滞之能',
    element: '时间属性',
    baseStats: { attack: 38, defense: 55, speed: 68, spirit: 95, hp: 65 },
  },
]

// === 史诗级（29%）===
const epicSouls: Omit<IMartialSoul, 'id' | 'soulSkills' | 'cultivationAttr'>[] = [
  {
    name: '海之矛', quality: 'epic', type: '器武魂·强攻系',
    description: '海魂师强力器武魂，矛尖凝海之力量',
    element: '水属性',
    baseStats: { attack: 70, defense: 45, speed: 55, spirit: 50, hp: 65 },
  },
  {
    name: '蓝银草', quality: 'epic', type: '植物系·控制系',
    description: '看似普通却潜力无穷的植物系武魂',
    element: '木属性',
    baseStats: { attack: 40, defense: 45, speed: 40, spirit: 70, hp: 55 },
  },
  {
    name: '蛇矛', quality: 'epic', type: '器武魂·敏攻系',
    description: '灵活刁钻的器武魂，如毒蛇出洞',
    element: '木属性',
    baseStats: { attack: 65, defense: 35, speed: 80, spirit: 55, hp: 50 },
  },
  {
    name: '追魂剑', quality: 'epic', type: '器武魂·敏攻系',
    description: '迅捷无比的剑武魂，追魂夺命',
    element: '金属性',
    baseStats: { attack: 70, defense: 35, speed: 80, spirit: 55, hp: 50 },
  },
  {
    name: '震天斧', quality: 'epic', type: '器武魂·强攻系',
    description: '威力巨大的斧头武魂，一斧震天地',
    element: '土属性',
    baseStats: { attack: 80, defense: 50, speed: 40, spirit: 40, hp: 80 },
  },
  {
    name: '龙纹棍', quality: 'epic', type: '器武魂·强攻系',
    description: '龙纹缠棍，棍法如龙',
    element: '金属性',
    baseStats: { attack: 75, defense: 50, speed: 50, spirit: 45, hp: 75 },
  },
  {
    name: '摄魂铃', quality: 'epic', type: '器武魂·控制系',
    description: '铃声摄魂，控制敌方心神',
    element: '精神属性',
    baseStats: { attack: 40, defense: 40, speed: 50, spirit: 80, hp: 50 },
  },
  {
    name: '大力金刚熊', quality: 'epic', type: '兽武魂·强攻系',
    description: '力量型兽武魂，金刚之力无坚不摧',
    element: '土属性',
    baseStats: { attack: 75, defense: 65, speed: 35, spirit: 35, hp: 85 },
  },
  {
    name: '猫鹰', quality: 'epic', type: '兽武魂·敏攻系',
    description: '猫与鹰的结合，速度与锐利兼具',
    element: '木属性',
    baseStats: { attack: 65, defense: 40, speed: 80, spirit: 55, hp: 50 },
  },
  {
    name: '大力猩猩', quality: 'epic', type: '兽武魂·强攻系',
    description: '力大无穷的猩猩武魂，蛮力惊人',
    element: '土属性',
    baseStats: { attack: 75, defense: 60, speed: 35, spirit: 35, hp: 85 },
  },
  {
    name: '板甲巨犀', quality: 'epic', type: '兽武魂·防御系',
    description: '厚重如板甲的犀角武魂，防御极强',
    element: '土属性',
    baseStats: { attack: 50, defense: 85, speed: 30, spirit: 35, hp: 90 },
  },
  {
    name: '尖尾雨燕', quality: 'epic', type: '兽武魂·敏攻系',
    description: '极速飞行兽武魂，雨燕疾影快如闪电',
    element: '木属性',
    baseStats: { attack: 55, defense: 30, speed: 90, spirit: 50, hp: 45 },
  },
  {
    name: '罗三炮', quality: 'epic', type: '兽武魂·强攻系',
    description: '变异光明圣龙武魂，体型如猪、吼声似犬，放屁攻击威力惊人，天生被封印无法突破三十级，但若集齐光属性魂环可唤醒沉睡的圣龙血脉',
    element: '光属性',
    baseStats: { attack: 60, defense: 45, speed: 40, spirit: 65, hp: 70 },
  },
]

// === 武魂属性推导 ===
// 【显式映射表】元素限定为9种：金、木、水、火、土、光、暗、时间、空间
// 此表为权威来源，优先级高于关键词自动推导
const SOUL_ELEMENT_MAP: Record<string, string> = {
  // 超神级
  '天诛剑': '金属性',
  '造化玉蝶': '光属性',
  '孤竹': '木属性',
  '如意金箍棒': '光属性',
  '魔刀千刃': '暗属性',
  // 神级
  '六翼天使': '光属性',
  '光明女神蝶': '光属性',
  '光明龙神蝶': '光属性',
  '修罗之剑': '暗属性',
  '轮回之眼': '空间属性',
  '白银龙枪': '水属性',
  '金龙王': '金属性',
  '黄金龙枪': '金属性',
  '命运之盘': '时间属性',
  '鸿蒙金乌': '火属性',
  '奶龙': '空间属性',
  // 传说级
  '邪眸白虎': '金属性',
  '柔骨兔': '木属性',
  '幽冥灵猫': '木属性',
  '邪火凤凰': '火属性',
  '蓝电霸王龙': '火属性',
  '碧磷蛇皇': '木属性',
  '骨龙': '暗属性',
  '死亡蛛皇': '暗属性',
  '噬魂蛛皇': '木属性',
  '三头赤魔獒': '火属性',
  '玄龟': '水属性',
  '魔魂大白鲨': '水属性',
  '邪魔虎鲸': '水属性',
  '昊天锤': '土属性',
  '七宝琉璃塔': '光属性',
  '香肠': '光属性',
  '九凤来仪萧': '木属性',
  '盘龙棍': '土属性',
  '冰晶刹弓': '冰属性',
  '冰碧帝皇蝎': '冰属性',
  '饕餮神牛': '火属性',
  '光明圣龙': '光属性',
  '黑暗圣龙': '暗属性',
  '两仪神剑': '金属性',
  '罗三炮': '光属性',
  '耀阳圣龙': '光属性',
  '冰天雪女': '冰属性',
  '三足金蟾': '金属性',
  '朱晴冰蟾': '冰属性',
  '三生镇魂鼎': '土属性',
  '灵眸': '精神属性',
  '擎天枪': '金属性',
  '星尘剑': '光属性',
  // 传说级（26个新增系列）
  '青龙': '水属性',
  '虚无吞炎': '火属性',
  '玄武': '水属性',
  '紫霄神雷': '火属性',
  '十首火凤凰': '火属性',
  '金眼黑龙': '暗属性',
  '生命之树': '木属性',
  '青莲地心火': '火属性',
  '破魔刀': '金属性',
  '红尘魔龙': '暗属性',
  '浴火凤凰': '火属性',
  '冰神': '冰属性',
  '苍海棍': '水属性',
  '疾风枪': '木属性',
  '沧澜剑': '水属性',
  '卡冥狮': '土属性',
  '黄金龙': '火属性',
  '冥王黑龙': '暗属性',
  '天罡无极剑': '光属性',
  '日冕圣龙': '暗属性',
  '七杀剑': '金属性',
  '蓝冰莲花': '冰属性',
  '烈阳弓': '火属性',
  // 新增18个传说级武魂
  '瑞幸咖啡': '水属性',
  '春秋蝉': '时间属性',
  '斩魄刀': '空间属性',
  '凯溟龙戟': '暗属性',
  '亡灵序曲·死者苏生': '暗属性',
  '玄铁重剑': '金属性',
  '堕天使': '暗属性',
  '冰极霜灭龙': '冰属性',
  '绝望光环': '空间属性',
  '终焉之龙': '暗属性',
  '黄金叶': '金属性',
  '提丰': '火属性',
  '影戮剑': '暗属性',
  '雷霆夔牛': '火属性',
  '斩龙刀': '光属性',
  '星穹灵鹿': '光属性',
  '太虚古龙': '空间属性',
  '镇魂碑': '土属性',
  '欢愉面具': '暗属性',
  '寒汐凝霜琴': '冰属性',
  // 史诗级
  '海之矛': '水属性',
  '蓝银草': '木属性',
  '蛇矛': '木属性',
  '追魂剑': '金属性',
  '震天斧': '土属性',
  '龙纹棍': '土属性',
  '摄魂铃': '空间属性',
  '大力金刚熊': '土属性',
  '猫鹰': '木属性',
  '大力猩猩': '土属性',
  '板甲巨犀': '土属性',
  '尖尾雨燕': '木属性',
}

// 关键词兜底规则（仅显式映射未覆盖时使用，新增武魂时不必改此表）
// 元素共10种：金、木、水、火、土、冰、光、暗、时间、空间
const ELEMENT_RULES: Array<{ keywords: string[]; element: string }> = [
  { keywords: ['冰', '雪', '霜', '寒'], element: '冰属性' },
  { keywords: ['火', '凤凰', '赤', '炎', '雷', '霆'], element: '火属性' },
  { keywords: ['光', '明', '天使', '圣龙', '圣', '星尘'], element: '光属性' },
  { keywords: ['暗', '黑暗', '幽冥', '死亡', '噬魂', '邪魔', '骨龙', '修罗', '魔', '堕'], element: '暗属性' },
  { keywords: ['水', '海', '鲨', '鲸', '河', '沧'], element: '水属性' },
  { keywords: ['金', '黄金', '龙枪', '玄铁', '斩龙'], element: '金属性' },
  { keywords: ['土', '玄龟', '牛', '熊', '犀', '鼎', '石', '镇魂'], element: '土属性' },
  { keywords: ['木', '植物', '草', '树', '藤', '蓝银', '蛇皇', '蛛皇', '碧磷', '蟾', '风', '燕', '猫', '鹰', '疾'], element: '木属性' },
  { keywords: ['时间', '春秋', '蝉'], element: '时间属性' },
  { keywords: ['空间', '太虚', '古龙', '虚空', '精神', '灵眸', '眼', '摄魂', '轮回'], element: '空间属性' },
  { keywords: ['剑', '枪', '棍', '斧', '矛', '刃', '刀'], element: '金属性' },
]

export function getSoulElement(soulName: string): string {
  // 优先查显式映射表（权威）
  if (SOUL_ELEMENT_MAP[soulName]) return SOUL_ELEMENT_MAP[soulName]
  // 兜底：关键词匹配
  for (const rule of ELEMENT_RULES) {
    if (rule.keywords.some((k) => soulName.includes(k))) {
      return rule.element
    }
  }
  return '无属性'
}

// === 武魂修炼属性推导 ===
// 根据武魂系别决定修炼属性，对应魂技伤害计算公式的属性来源
// 强攻→strength(攻击)、敏攻→agility(速度)、控制/辅助→spirit(精神)、防御→defense(防御)
export function getCultivationAttr(soul: Omit<IMartialSoul, 'id' | 'soulSkills' | 'cultivationAttr'>): IMartialSoul['cultivationAttr'] {
  const dept = getSoulDepartment(soul.type)
  if (dept === '强攻系') return 'strength'
  if (dept === '控制系') return 'spirit'
  if (dept === '敏攻系') return 'agility'
  if (dept === '防御系') return 'defense'
  if (dept === '辅助系') return 'support'
  return 'strength'
}

export const CULTIVATION_ATTR_LABEL: Record<IMartialSoul['cultivationAttr'], string> = {
  strength: '强攻',
  spirit: '控制/精神',
  agility: '敏攻',
  defense: '防御',
  support: '辅助',
}

/**
 * 仙草武魂进化函数
 * effect 类型：
 * - evolve-ice：冰属性武魂进化为极致之冰
 * - evolve-fire：火属性武魂进化为极致之火
 * - evolve-tulip：七宝琉璃塔 → 九宝琉璃塔（辅助系）
 */
export function evolveMartialSoul(
  soul: IMartialSoul,
  effect: 'evolve-ice' | 'evolve-fire' | 'evolve-tulip' | 'all-attr-pct' | 'evolve-shenglong'
): IMartialSoul {
  // 已经是超神级/神级且有极致属性的，不再进化
  if (soul.extremeAttribute && soul.quality === 'superDivine') return soul;

  const newSoul = { ...soul };

  if (effect === 'evolve-ice') {
    // 冰属性武魂 → 极致之冰
    const element = soul.element || getSoulElement(soul.name);
    if (element === '冰属性') {
      newSoul.extremeAttribute = '极致之冰';
      newSoul.element = '冰属性';
      // 属性提升20%
      if (newSoul.baseStats) {
        newSoul.baseStats = {
          attack: Math.floor(newSoul.baseStats.attack * 1.2),
          defense: Math.floor(newSoul.baseStats.defense * 1.2),
          speed: Math.floor(newSoul.baseStats.speed * 1.2),
          spirit: Math.floor(newSoul.baseStats.spirit * 1.2),
          hp: Math.floor(newSoul.baseStats.hp * 1.2),
        };
      }
      newSoul.quality = upgradeQuality(newSoul.quality);
    }
  }

  if (effect === 'evolve-fire') {
    // 火属性武魂 → 极致之火
    const element = soul.element || getSoulElement(soul.name);
    if (element === '火属性') {
      newSoul.extremeAttribute = '极致之火';
      newSoul.element = '火属性';
      if (newSoul.baseStats) {
        newSoul.baseStats = {
          attack: Math.floor(newSoul.baseStats.attack * 1.2),
          defense: Math.floor(newSoul.baseStats.defense * 1.2),
          speed: Math.floor(newSoul.baseStats.speed * 1.2),
          spirit: Math.floor(newSoul.baseStats.spirit * 1.2),
          hp: Math.floor(newSoul.baseStats.hp * 1.2),
        };
      }
      newSoul.quality = upgradeQuality(newSoul.quality);
    }
  }

  if (effect === 'evolve-tulip') {
    // 七宝琉璃塔 → 九宝玲珑塔（神级辅助）
    if (soul.name === '七宝琉璃塔') {
      newSoul.name = '九宝玲珑塔';
      newSoul.description = '绮罗郁金香催生的神级辅助武魂，九宝玲珑，辉映天地，辅助能力突破七宝桎梏，可达封号斗罗境界。';
      if (newSoul.baseStats) {
        newSoul.baseStats = {
          attack: Math.floor(newSoul.baseStats.attack * 1.3),
          defense: Math.floor(newSoul.baseStats.defense * 1.3),
          speed: Math.floor(newSoul.baseStats.speed * 1.3),
          spirit: Math.floor(newSoul.baseStats.spirit * 1.5),
          hp: Math.floor(newSoul.baseStats.hp * 1.3),
        };
      }
      newSoul.quality = upgradeQuality(newSoul.quality);
    }
  }

  if (effect === 'evolve-shenglong') {
    // 罗三炮 → 耀阳圣龙（圣龙耀阳草 / 全光魂环90级进化）
    if (soul.name === '罗三炮') {
      newSoul.name = '耀阳圣龙';
      newSoul.description = '极致之光，罗三炮觉醒圣龙血脉后的究极形态，耀阳之光普照天地，一吼之下万魔退散。';
      newSoul.extremeAttribute = '极致之光';
      newSoul.element = '光属性';
      newSoul.quality = 'divine';
      newSoul.type = '兽武魂·强攻系';
      if (newSoul.baseStats) {
        newSoul.baseStats = {
          attack: Math.floor(newSoul.baseStats.attack * 2.0),
          defense: Math.floor(newSoul.baseStats.defense * 2.0),
          speed: Math.floor(newSoul.baseStats.speed * 2.2),
          spirit: Math.floor(newSoul.baseStats.spirit * 1.8),
          hp: Math.floor(newSoul.baseStats.hp * 1.8),
        };
      }
    }
  }

  // 重新计算修炼属性
  newSoul.cultivationAttr = getCultivationAttr(newSoul);
  newSoul.soulSkills = generateSoulSkills(newSoul);

  return newSoul;
}

function upgradeQuality(q: IMartialSoul['quality']): IMartialSoul['quality'] {
  if (q === 'epic') return 'legendary';
  if (q === 'legendary') return 'divine';
  if (q === 'divine') return 'superDivine';
  return q; // superDivine 已是最高
}

function withId(arr: Omit<IMartialSoul, 'id' | 'soulSkills' | 'cultivationAttr'>[]): IMartialSoul[] {
  return arr.map((s, i) => {
    const soulSkills = generateSoulSkills(s)
    const element = s.element ?? getSoulElement(s.name)
    const cultivationAttr = getCultivationAttr(s)
    return { ...s, id: `soul-${i}-${s.name}`, soulSkills, element, cultivationAttr } as IMartialSoul
  })
}

export const MOCK_MARTIAL_SOULS: IMartialSoul[] = [
  ...withId(superDivineSouls),
  ...withId(supremeDivineSouls),
  ...withId(divineSouls),
  ...withId(legendarySouls),
  ...withId(epicSouls),
]

MOCK_MARTIAL_SOULS.push(...[{"id":"custom-yaojin-longji","name":"曜金龙戟","quality":"superDivine","type":"器武魂·强攻系","element":"金属性","extremeAttribute":"极致之金","description":"龙纹曜金凝成的战戟，适合以攻击力为核心的正面作战。极致之金沿用现有极致属性规则，魂技效果沿用强攻系规则。","baseStats":{"attack":105,"defense":58,"speed":76,"spirit":72,"hp":94},"soulSkills":["第1魂技·龙锋刺","第2魂技·曜金破阵","第3魂技·龙鳞斩","第4魂技·金戟裂空","第5魂技·百刃归锋","第6魂技·龙吟贯日","武魂真身","第8魂技·万锋镇天","第9魂技·曜金龙皇破"]},{"id":"custom-shuangpo-lingtong","name":"霜魄灵瞳","quality":"superDivine","type":"本体武魂·控制系","element":"精神属性","extremeAttribute":"极致之精神","description":"眼瞳如霜晶，专注精神属性与控制系魂技。技能名称带有霜雪意象，魂环元素仍明确为精神属性，不额外添加未实现的冻结机制。","baseStats":{"attack":60,"defense":60,"speed":78,"spirit":118,"hp":88},"soulSkills":["第1魂技·霜瞳凝念","第2魂技·灵魄束缚","第3魂技·镜雪迷阵","第4魂技·寒念冲击","第5魂技·碎魄凝光","第6魂技·霜心灵域","武魂真身","第8魂技·万念归寂","第9魂技·霜魄神识之剑"]},{"id":"custom-xukong-tiansun","name":"虚空天隼","quality":"superDivine","type":"兽武魂·敏攻系","element":"空间属性","extremeAttribute":"极致之速度","description":"穿梭虚空的天隼，使用速度作为敏攻魂技的修炼方向。空间为元素属性，极致之速度沿用既有被动规则。","baseStats":{"attack":84,"defense":50,"speed":118,"spirit":76,"hp":82},"soulSkills":["第1魂技·隼影突袭","第2魂技·裂空双翼","第3魂技·虚空掠爪","第4魂技·流隙疾冲","第5魂技·千影锋羽","第6魂技·天隼空痕","武魂真身","第8魂技·万羽破界","第9魂技·虚空天隼神化"]},{"id":"custom-zhenyue-xuangui","name":"镇岳玄龟","quality":"superDivine","type":"兽武魂·防御系","element":"土属性","extremeAttribute":"极致之防御","description":"背负山岳纹甲的玄龟，以防御和气血为主要方向。防御系魂技与极致之防御沿用现有规则，不额外添加反伤或无敌机制。","baseStats":{"attack":62,"defense":112,"speed":48,"spirit":66,"hp":126},"soulSkills":["第1魂技·玄甲壁","第2魂技·镇岳盾","第3魂技·磐山墙","第4魂技·厚土玄甲","第5魂技·山岳屏障","第6魂技·玄龟圣盾","武魂真身","第8魂技·镇岳金身","第9魂技·万古玄龟盾"]},{"id":"custom-xinglu-liulilian","name":"星露琉璃莲","quality":"superDivine","type":"植物武魂·辅助系","element":"木属性","extremeAttribute":"极致之木","description":"承接星露的琉璃莲，以精神和生命方向辅助作战。奇数攻击魂技与偶数辅助魂技沿用现有辅助系规则；不额外承诺复活或队伍群体治疗。","baseStats":{"attack":48,"defense":70,"speed":72,"spirit":108,"hp":116},"soulSkills":["第1魂技·星露光矢","第2魂技·琉璃祝福","第3魂技·莲华冲击","第4魂技·星露庇护","第5魂技·青莲审判","第6魂技·琉璃神恩","武魂真身","第8魂技·星露绽放","第9魂技·琉璃莲华神罚"]}] as any);
