// EXPORTS: ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, IAchievement, IAchievementCategory, AchievementCategory

export type AchievementCategory =
  | 'level'        // 成长进阶
  | 'soulRing'     // 武魂魂环
  | 'soulBone'     // 魂骨
  | 'battle'       // 战斗狩猎
  | 'divine'       // 神位传承
  | 'martialSoul'  // 特殊武魂
  | 'companion'    // 伴侣羁绊
  | 'collect'      // 收集探索
  | 'special';     // 特殊成就

export interface IAchievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string; // emoji 图标
  checkType:
    | 'level'           // 等级 ≥ target
    | 'ringCount'       // 魂环数量 ≥ target
    | 'ringQuality'     // 最高魂环品质索引 ≥ target
    | 'boneCount'       // 魂骨数量 ≥ target
    | 'boneQuality'     // 最高魂骨品质 ≥ target
    | 'beastKills'      // 累计击败魂兽 ≥ target
    | 'fierceBeast'     // 击败凶兽 ≥ target
    | 'beastKillsMaxQuality' // 击败过的魂兽最高品质索引 ≥ target
    | 'divineInherit'   // 继承指定神位
    | 'divineTier'      // 继承某一级别神位
    | 'soulQuality'     // 武魂品质索引 ≥ target
    | 'twinSoul'        // 双生武魂九环全满
    | 'twinSoulAwake'   // 是否觉醒双生武魂
    | 'reincarnation'   // 转世次数 ≥ target
    | 'academy'         // 史莱克学院等级 ≥ target
    | 'artifact'        // 是否获得神器
    | 'domain'          // 是否获得领域
    | 'soulSpirit'      // 魂灵数量 ≥ target
    | 'soulSpiritQuality' // 魂灵最高品质索引 ≥ target
    | 'craftGuide'      // 是否自制魂导器
    | 'herb'            // 服用仙草种类 ≥ target
    | 'lifeWater'       // 是否服用生命之水
    | 'arenaWin'        // 竞技场胜场 ≥ target
    | 'arenaStreak'     // 竞技场连胜 ≥ target
    | 'seaGod'          // 海神阁击败数 ≥ target
    | 'hundredLevel'    // 是否百级成神
    | 'companionCount'  // 伴侣数量 ≥ target
    | 'lover'           // 是否结为情侣
    | 'spouse'          // 是否结为夫妻
    | 'teaCityCount'    // 结识茶城人物数量 ≥ target
    | 'allTeaCity'      // 结识全部茶城人物
    | 'divineArmor'     // 是否有神装
    | 'godRealmBoss'    // 击败神界指定BOSS
    | 'godRealmKills'   // 击败神界BOSS次数 ≥ target
    | 'liangyiEye'      // 进入冰火两仪眼次数 ≥ target
    | 'supremeSoul'     // 是否觉醒至高神级武魂
    | 'luosanpaoEvolve' // 罗三炮是否进化
    | 'qibaoEvolve'     // 七宝琉璃塔是否进化
    | 'divineInheritCount' // 继承神位数量 ≥ target
    | 'boneFullSet'     // 七块魂骨全满
    | 'boneMillion'     // 是否获得百万年魂骨
    | 'soulSpiritGod'   // 是否有神级魂灵
    | 'reincarnation99' // 转世99次
    | 'tianmeng'        // 是否接受天梦冰蚕
    | 'divineSoulRing'; // 是否获得神赐魂环
  target: number | string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
}

export interface IAchievementCategory {
  key: AchievementCategory;
  name: string;
  icon: string;
}

export const ACHIEVEMENT_CATEGORIES: IAchievementCategory[] = [
  { key: 'level', name: '成长进阶', icon: '⚡' },
  { key: 'soulRing', name: '武魂魂环', icon: '💫' },
  { key: 'soulBone', name: '魂骨', icon: '🦴' },
  { key: 'battle', name: '战斗狩猎', icon: '⚔️' },
  { key: 'divine', name: '神位传承', icon: '👑' },
  { key: 'martialSoul', name: '特殊武魂', icon: '🌟' },
  { key: 'companion', name: '伴侣羁绊', icon: '💕' },
  { key: 'collect', name: '收集探索', icon: '📜' },
  { key: 'special', name: '特殊成就', icon: '🏆' },
];

export const ACHIEVEMENTS: IAchievement[] = [
  // ==================== 成长进阶 ====================
  { id: 'lv_10', name: '突破·魂师', description: '突破 10 级，正式成为魂师', category: 'level', icon: '🔥', checkType: 'level', target: 10, rarity: 'common' },
  { id: 'lv_20', name: '突破·大魂师', description: '突破 20 级，成为大魂师', category: 'level', icon: '💨', checkType: 'level', target: 20, rarity: 'common' },
  { id: 'lv_30', name: '突破·魂尊', description: '突破 30 级，成为魂尊', category: 'level', icon: '🌊', checkType: 'level', target: 30, rarity: 'rare' },
  { id: 'lv_40', name: '突破·魂宗', description: '突破 40 级，成为魂宗', category: 'level', icon: '🗡️', checkType: 'level', target: 40, rarity: 'rare' },
  { id: 'lv_50', name: '突破·魂王', description: '突破 50 级，成为魂王', category: 'level', icon: '👑', checkType: 'level', target: 50, rarity: 'epic' },
  { id: 'lv_60', name: '突破·魂帝', description: '突破 60 级，成为魂帝', category: 'level', icon: '⚡', checkType: 'level', target: 60, rarity: 'epic' },
  { id: 'lv_70', name: '突破·魂圣', description: '突破 70 级，成为魂圣', category: 'level', icon: '🌟', checkType: 'level', target: 70, rarity: 'epic' },
  { id: 'lv_80', name: '突破·魂斗罗', description: '突破 80 级，成为魂斗罗', category: 'level', icon: '🛡️', checkType: 'level', target: 80, rarity: 'legendary' },
  { id: 'lv_90', name: '突破·封号斗罗', description: '突破 90 级，成为封号斗罗', category: 'level', icon: '🏆', checkType: 'level', target: 90, rarity: 'legendary' },
  { id: 'lv_95', name: '超级斗罗', description: '达到 95 级超级斗罗境界', category: 'level', icon: '💎', checkType: 'level', target: 95, rarity: 'legendary' },
  { id: 'lv_99', name: '极限斗罗', description: '达到 99 级，登顶人类巅峰', category: 'level', icon: '👑', checkType: 'level', target: 99, rarity: 'mythic' },
  { id: 'lv_100', name: '百级成神', description: '突破百级，传承神位', category: 'level', icon: '🌞', checkType: 'hundredLevel', target: 1, rarity: 'mythic' },

  // ==================== 武魂魂环 ====================
  { id: 'ring_1', name: '第一魂环', description: '吸收第一个魂环', category: 'soulRing', icon: '⚪', checkType: 'ringCount', target: 1, rarity: 'common' },
  { id: 'ring_2', name: '双魂环身', description: '吸收第二个魂环', category: 'soulRing', icon: '⚪', checkType: 'ringCount', target: 2, rarity: 'common' },
  { id: 'ring_3', name: '三魂环尊', description: '吸收第三个魂环', category: 'soulRing', icon: '🟡', checkType: 'ringCount', target: 3, rarity: 'rare' },
  { id: 'ring_5', name: '五魂环宗', description: '吸收第五个魂环', category: 'soulRing', icon: '🟣', checkType: 'ringCount', target: 5, rarity: 'epic' },
  { id: 'ring_7', name: '七魂环圣', description: '吸收第七个魂环', category: 'soulRing', icon: '⚫', checkType: 'ringCount', target: 7, rarity: 'epic' },
  { id: 'ring_9', name: '九环封号', description: '吸收第九个魂环，成就封号斗罗', category: 'soulRing', icon: '🔴', checkType: 'ringCount', target: 9, rarity: 'legendary' },
  { id: 'ring_black', name: '万年之威', description: '吸收一枚万年魂环', category: 'soulRing', icon: '🖤', checkType: 'ringQuality', target: 4, rarity: 'epic' },
  { id: 'ring_red', name: '十万年魂环', description: '吸收一枚十万年魂环', category: 'soulRing', icon: '❤️', checkType: 'ringQuality', target: 5, rarity: 'legendary' },
  { id: 'ring_million', name: '百万年神迹', description: '吸收一枚百万年魂环', category: 'soulRing', icon: '💠', checkType: 'ringQuality', target: 6, rarity: 'mythic' },
  { id: 'ring_gold', name: '神赐之环', description: '获得一枚神赐魂环', category: 'soulRing', icon: '🏅', checkType: 'divineSoulRing', target: 1, rarity: 'mythic' },
  { id: 'ring_twin_full', name: '双生武魂·九环同辉', description: '双生武魂双双九环全满', category: 'soulRing', icon: '🌌', checkType: 'twinSoul', target: 1, rarity: 'mythic' },
  { id: 'soul_super_god', name: '超神级武魂', description: '觉醒超神级品质武魂', category: 'soulRing', icon: '🌞', checkType: 'soulQuality', target: 7, rarity: 'legendary' },
  { id: 'soul_supreme', name: '至高神级武魂', description: '觉醒至高神级品质武魂', category: 'soulRing', icon: '⭐', checkType: 'supremeSoul', target: 1, rarity: 'mythic' },
  { id: 'soul_twin', name: '双生武魂', description: '觉醒双生武魂', category: 'soulRing', icon: '⚡', checkType: 'twinSoulAwake', target: 1, rarity: 'legendary' },

  // ==================== 魂骨 ====================
  { id: 'bone_1', name: '初得魂骨', description: '获得第一块魂骨', category: 'soulBone', icon: '🦴', checkType: 'boneCount', target: 1, rarity: 'rare' },
  { id: 'bone_3', name: '三骨初成', description: '同时装备三块魂骨', category: 'soulBone', icon: '💀', checkType: 'boneCount', target: 3, rarity: 'rare' },
  { id: 'bone_6', name: '六骨附体', description: '同时装备六块魂骨', category: 'soulBone', icon: '💀', checkType: 'boneCount', target: 6, rarity: 'epic' },
  { id: 'bone_full', name: '七骨通神', description: '七块魂骨全部装备', category: 'soulBone', icon: '🏅', checkType: 'boneFullSet', target: 1, rarity: 'legendary' },
  { id: 'bone_black', name: '万年魂骨', description: '获得一块万年魂骨', category: 'soulBone', icon: '🖤', checkType: 'boneQuality', target: 4, rarity: 'epic' },
  { id: 'bone_100k', name: '十万年魂骨', description: '获得一块十万年魂骨', category: 'soulBone', icon: '🔴', checkType: 'boneQuality', target: 5, rarity: 'legendary' },
  { id: 'bone_million', name: '百万年魂骨', description: '获得一块百万年魂骨', category: 'soulBone', icon: '💠', checkType: 'boneQuality', target: 6, rarity: 'mythic' },
  { id: 'bone_god_armor', name: '神装降临', description: '成功融合成神装', category: 'soulBone', icon: '🛡️', checkType: 'divineArmor', target: 1, rarity: 'mythic' },

  // ==================== 战斗狩猎 ====================
  { id: 'kill_first', name: '初战告捷', description: '首次击败一只魂兽', category: 'battle', icon: '⚔️', checkType: 'beastKills', target: 1, rarity: 'common' },
  { id: 'kill_10', name: '猎魂新手', description: '累计击败 10 只魂兽', category: 'battle', icon: '🗡️', checkType: 'beastKills', target: 10, rarity: 'common' },
  { id: 'kill_50', name: '初级猎魂者', description: '累计击败 50 只魂兽', category: 'battle', icon: '🗡️', checkType: 'beastKills', target: 50, rarity: 'rare' },
  { id: 'kill_100', name: '百人斩', description: '累计击败 100 只魂兽', category: 'battle', icon: '🗡️', checkType: 'beastKills', target: 100, rarity: 'rare' },
  { id: 'kill_500', name: '猎魂达人', description: '累计击败 500 只魂兽', category: 'battle', icon: '⚔️', checkType: 'beastKills', target: 500, rarity: 'epic' },
  { id: 'kill_1000', name: '千人斩', description: '累计击败 1000 只魂兽', category: 'battle', icon: '⚔️', checkType: 'beastKills', target: 1000, rarity: 'epic' },
  { id: 'kill_10k', name: '万魂屠夫', description: '累计击败 10000 只魂兽', category: 'battle', icon: '💀', checkType: 'beastKills', target: 10000, rarity: 'legendary' },
  { id: 'kill_100k_b', name: '十万年猎手', description: '击败一只十万年魂兽', category: 'battle', icon: '🐲', checkType: 'beastKillsMaxQuality', target: 5, rarity: 'legendary' },
  { id: 'kill_million', name: '百万年屠夫', description: '击败一只百万年魂兽', category: 'battle', icon: '🐉', checkType: 'beastKillsMaxQuality', target: 6, rarity: 'mythic' },
  { id: 'kill_fierce', name: '凶兽终结者', description: '击败十大凶兽之一', category: 'battle', icon: '👹', checkType: 'fierceBeast', target: 1, rarity: 'legendary' },
  { id: 'arena_first', name: '竞技场首胜', description: '在斗魂竞技场获得首场胜利', category: 'battle', icon: '🏆', checkType: 'arenaWin', target: 1, rarity: 'common' },
  { id: 'arena_10w', name: '十连胜', description: '竞技场连胜 10 场', category: 'battle', icon: '🔥', checkType: 'arenaStreak', target: 10, rarity: 'epic' },
  { id: 'arena_100w', name: '百连胜·战魂', description: '竞技场连胜 100 场', category: 'battle', icon: '🔥', checkType: 'arenaStreak', target: 100, rarity: 'mythic' },
  { id: 'sea_god_win', name: '海神阁挑战', description: '在海神阁挑战赛中获胜', category: 'battle', icon: '🌊', checkType: 'seaGod', target: 1, rarity: 'legendary' },
  { id: 'sea_god_all', name: '海神阁主', description: '击败所有海神阁守卫', category: 'battle', icon: '🌊', checkType: 'seaGod', target: 10, rarity: 'mythic' },

  // ==================== 神位传承 ====================
  { id: 'tier_second', name: '二级神祇', description: '传承二级神神位', category: 'divine', icon: '✨', checkType: 'divineTier', target: 4, rarity: 'rare' },
  { id: 'tier_first', name: '一级神祇', description: '传承一级神神位', category: 'divine', icon: '⭐', checkType: 'divineTier', target: 3, rarity: 'epic' },
  { id: 'tier_king', name: '神王之位', description: '传承神王神位', category: 'divine', icon: '🪙', checkType: 'divineTier', target: 2, rarity: 'legendary' },
  { id: 'tier_supreme', name: '至高神尊', description: '传承至高神位', category: 'divine', icon: '👑', checkType: 'divineTier', target: 1, rarity: 'mythic' },
  { id: 'divine_chuangshi', name: '至高·创世神', description: '传承至高神·创世神之位', category: 'divine', icon: '🌌', checkType: 'divineInherit', target: 'deity-creation', rarity: 'mythic' },
  { id: 'divine_long', name: '至高·龙神', description: '传承至高神·龙神之位', category: 'divine', icon: '🐉', checkType: 'divineInherit', target: 'deity-dragon-god', rarity: 'mythic' },
  { id: 'divine_pangu', name: '至高·盘古', description: '传承至高神·盘古之位', category: 'divine', icon: '🪓', checkType: 'divineInherit', target: 'deity-pangu', rarity: 'mythic' },
  { id: 'divine_tea', name: '至高·茶之神', description: '传承至高神·茶之神之位', category: 'divine', icon: '🍵', checkType: 'divineInherit', target: 'deity-tea', rarity: 'mythic' },
  { id: 'divine_shishi', name: '至高·弑神', description: '传承至高神·弑神之位', category: 'divine', icon: '🗡️', checkType: 'divineInherit', target: 'deity-godslayer', rarity: 'mythic' },
  { id: 'divine_mingyun', name: '至高·命运之神', description: '传承至高神·命运之神之位', category: 'divine', icon: '🔮', checkType: 'divineInherit', target: 'deity-fate', rarity: 'mythic' },
  { id: 'divine_wuji', name: '至高·无极之神', description: '传承至高神·无极之神之位', category: 'divine', icon: '☯️', checkType: 'divineInherit', target: 'deity-wuji', rarity: 'mythic' },
  { id: 'divine_youyu', name: '至高·忧郁之神', description: '传承至高神·忧郁之神之位', category: 'divine', icon: '🌧️', checkType: 'divineInherit', target: 'deity-melancholy', rarity: 'mythic' },
  { id: 'divine_huimie', name: '神王·毁灭之神', description: '传承神王·毁灭之神之位', category: 'divine', icon: '💥', checkType: 'divineInherit', target: 'deity-destruction', rarity: 'legendary' },
  { id: 'divine_shengming', name: '神王·生命之神', description: '传承神王·生命之神之位', category: 'divine', icon: '🌿', checkType: 'divineInherit', target: 'deity-life', rarity: 'legendary' },
  { id: 'divine_xiuluo', name: '神王·修罗之神', description: '传承神王·修罗之神之位', category: 'divine', icon: '⚔️', checkType: 'divineInherit', target: 'deity-asura', rarity: 'legendary' },
  { id: 'divine_shanliang', name: '神王·善良之神', description: '传承神王·善良之神之位', category: 'divine', icon: '💖', checkType: 'divineInherit', target: 'deity-kindness', rarity: 'legendary' },
  { id: 'divine_xiee', name: '神王·邪恶之神', description: '传承神王·邪恶之神之位', category: 'divine', icon: '😈', checkType: 'divineInherit', target: 'deity-evil', rarity: 'legendary' },
  { id: 'divine_hai', name: '一级神·海神', description: '传承一级神·海神之位', category: 'divine', icon: '🌊', checkType: 'divineInherit', target: 'deity-sea', rarity: 'epic' },
  { id: 'divine_angel', name: '一级神·天使之神', description: '传承一级神·天使之神之位', category: 'divine', icon: '👼', checkType: 'divineInherit', target: 'deity-angel', rarity: 'epic' },
  { id: 'divine_qingxu', name: '一级神·情绪之神', description: '传承一级神·情绪之神之位', category: 'divine', icon: '💫', checkType: 'divineInherit', target: 'deity-emotion', rarity: 'epic' },
  { id: 'divine_bing', name: '一级神·冰神', description: '传承一级神·冰神之位', category: 'divine', icon: '❄️', checkType: 'divineInherit', target: 'deity-ice', rarity: 'epic' },
  { id: 'divine_lei', name: '一级神·雷神', description: '传承一级神·雷神之位', category: 'divine', icon: '⚡', checkType: 'divineInherit', target: 'deity-thunder', rarity: 'epic' },
  { id: 'divine_shi', name: '二级神·食神', description: '传承二级神·食神之位', category: 'divine', icon: '🍜', checkType: 'divineInherit', target: 'deity-food', rarity: 'rare' },
  { id: 'divine_die', name: '二级神·蝶神', description: '传承二级神·蝶神之位', category: 'divine', icon: '🦋', checkType: 'divineInherit', target: 'deity-butterfly', rarity: 'rare' },
  { id: 'divine_sudu', name: '二级神·速度之神', description: '传承二级神·速度之神之位', category: 'divine', icon: '💨', checkType: 'divineInherit', target: 'deity-speed', rarity: 'rare' },
  { id: 'divine_zhan', name: '二级神·战神', description: '传承二级神·战神之位', category: 'divine', icon: '⚔️', checkType: 'divineInherit', target: 'deity-war', rarity: 'rare' },
  { id: 'divine_inherit_5', name: '众神之主', description: '累计传承 5 个神位', category: 'divine', icon: '👑', checkType: 'divineInheritCount', target: 5, rarity: 'mythic' },

  // ==================== 特殊武魂 ====================
  { id: 'soul_liangyi', name: '两仪神剑', description: '觉醒至高武魂·两仪神剑', category: 'martialSoul', icon: '⚔️', checkType: 'supremeSoul', target: 1, rarity: 'mythic' },
  { id: 'soul_luosanpao', name: '罗三炮觉醒', description: '觉醒变异武魂·罗三炮', category: 'martialSoul', icon: '🐲', checkType: 'luosanpaoEvolve', target: 0, rarity: 'rare' },
  { id: 'soul_yaoyang', name: '耀阳圣龙', description: '罗三炮进化为耀阳圣龙', category: 'martialSoul', icon: '🌞', checkType: 'luosanpaoEvolve', target: 1, rarity: 'legendary' },
  { id: 'soul_jiubao', name: '九宝玲珑', description: '七宝琉璃塔进化为九宝玲珑塔', category: 'martialSoul', icon: '🏛️', checkType: 'qibaoEvolve', target: 1, rarity: 'legendary' },
  { id: 'soul_tianmeng', name: '天梦奇缘', description: '接受天梦冰蚕献祭', category: 'martialSoul', icon: '💎', checkType: 'tianmeng', target: 1, rarity: 'legendary' },

  // ==================== 伴侣羁绊 ====================
  { id: 'cp_first', name: '初遇知己', description: '结识第一位伴侣', category: 'companion', icon: '💝', checkType: 'companionCount', target: 1, rarity: 'common' },
  { id: 'cp_3', name: '红颜知己', description: '结识 3 位伴侣', category: 'companion', icon: '💖', checkType: 'companionCount', target: 3, rarity: 'rare' },
  { id: 'cp_5', name: '群芳环绕', description: '结识 5 位伴侣', category: 'companion', icon: '💗', checkType: 'companionCount', target: 5, rarity: 'epic' },
  { id: 'cp_lover', name: '情窦初开', description: '与伴侣结为情侣', category: 'companion', icon: '💕', checkType: 'lover', target: 1, rarity: 'rare' },
  { id: 'cp_spouse', name: '执子之手', description: '与伴侣结为夫妻', category: 'companion', icon: '💍', checkType: 'spouse', target: 1, rarity: 'epic' },
  { id: 'tea_first', name: '茶城初遇', description: '结识第一位茶城人物', category: 'companion', icon: '🍵', checkType: 'teaCityCount', target: 1, rarity: 'rare' },
  { id: 'tea_all', name: '茶城全知', description: '结识所有茶城人物', category: 'companion', icon: '🏯', checkType: 'allTeaCity', target: 1, rarity: 'legendary' },
  { id: 'tea_yinyangcha', name: '鸿蒙两仪', description: '与阴阳茶结为伴侣', category: 'companion', icon: '☯️', checkType: 'teaCityCount', target: 5, rarity: 'legendary' },

  // ==================== 收集探索 ====================
  { id: 'herb_first', name: '仙草之缘', description: '服用第一株仙草', category: 'collect', icon: '🌿', checkType: 'herb', target: 1, rarity: 'rare' },
  { id: 'herb_3', name: '药圃初学', description: '服用 3 种不同仙草', category: 'collect', icon: '🌱', checkType: 'herb', target: 3, rarity: 'epic' },
  { id: 'herb_all', name: '百草通玄', description: '收集所有仙草种类', category: 'collect', icon: '🌳', checkType: 'herb', target: 12, rarity: 'legendary' },
  { id: 'life_water', name: '生命之水', description: '饮用生命之湖的生命之水', category: 'collect', icon: '💧', checkType: 'lifeWater', target: 1, rarity: 'epic' },
  { id: 'liangyi_enter', name: '冰火两仪', description: '首次进入冰火两仪眼', category: 'collect', icon: '🔥', checkType: 'liangyiEye', target: 1, rarity: 'rare' },
  { id: 'liangyi_10', name: '两仪常客', description: '进入冰火两仪眼 10 次', category: 'collect', icon: '☯️', checkType: 'liangyiEye', target: 10, rarity: 'epic' },
  { id: 'spirit_first', name: '魂灵之约', description: '契约第一只魂灵', category: 'collect', icon: '👻', checkType: 'soulSpirit', target: 1, rarity: 'rare' },
  { id: 'spirit_3', name: '三灵护主', description: '契约 3 只魂灵', category: 'collect', icon: '👻', checkType: 'soulSpirit', target: 3, rarity: 'epic' },
  { id: 'spirit_god', name: '神级魂灵', description: '拥有一只神级魂灵', category: 'collect', icon: '🌟', checkType: 'soulSpiritQuality', target: 6, rarity: 'legendary' },
  { id: 'craft_first', name: '魂导匠人', description: '自制第一枚魂导器', category: 'collect', icon: '🔧', checkType: 'craftGuide', target: 1, rarity: 'rare' },
  { id: 'artifact_first', name: '神器持有者', description: '获得专属神器', category: 'collect', icon: '⚔️', checkType: 'artifact', target: 1, rarity: 'legendary' },
  { id: 'domain_first', name: '领域觉醒', description: '觉醒专属领域', category: 'collect', icon: '🌀', checkType: 'domain', target: 1, rarity: 'epic' },
  { id: 'academy_outer', name: '加入史莱克', description: '加入史莱克学院外院', category: 'collect', icon: '🏫', checkType: 'academy', target: 1, rarity: 'common' },
  { id: 'academy_inner', name: '内院弟子', description: '进入史莱克内院', category: 'collect', icon: '🏛️', checkType: 'academy', target: 2, rarity: 'rare' },
  { id: 'academy_sea', name: '入海神阁', description: '进入海神阁', category: 'collect', icon: '🌊', checkType: 'academy', target: 3, rarity: 'legendary' },

  // ==================== 特殊成就 ====================
  { id: 'reinc_1', name: '转世重生', description: '完成第一次转世', category: 'special', icon: '🔄', checkType: 'reincarnation', target: 1, rarity: 'epic' },
  { id: 'reinc_10', name: '十世轮回', description: '累计转世十次', category: 'special', icon: '🌌', checkType: 'reincarnation', target: 10, rarity: 'legendary' },
  { id: 'reinc_50', name: '百世轮回·半', description: '累计转世五十次', category: 'special', icon: '🌌', checkType: 'reincarnation', target: 50, rarity: 'mythic' },
  { id: 'reinc_99', name: '九九归一', description: '累计转世九十九次', category: 'special', icon: '♾️', checkType: 'reincarnation99', target: 1, rarity: 'mythic' },
  { id: 'godrealm_first', name: '初入神界', description: '首次击败一位神界神祇', category: 'special', icon: '☁️', checkType: 'godRealmKills', target: 1, rarity: 'epic' },
  { id: 'godrealm_all_godking', name: '神王征服者', description: '击败全部五大神王', category: 'special', icon: '👑', checkType: 'godRealmKills', target: 6, rarity: 'mythic' },
  { id: 'godrealm_all', name: '诸神黄昏', description: '击败所有神界神祇', category: 'special', icon: '💫', checkType: 'godRealmKills', target: 13, rarity: 'mythic' },
  // 至高神域
  { id: 'godrealm_baishanchai', name: '弑神·白山茶', description: '击败至高神·白山茶', category: 'special', icon: '🍵', checkType: 'godRealmBoss', target: 'boss-baishanchai', rarity: 'mythic' },
  // 五大神王
  { id: 'godrealm_destruction', name: '破灭之力', description: '击败毁灭之神', category: 'special', icon: '💀', checkType: 'godRealmBoss', target: 'boss-destruction', rarity: 'legendary' },
  { id: 'godrealm_life', name: '生命本源', description: '击败生命女神', category: 'special', icon: '🌿', checkType: 'godRealmBoss', target: 'boss-life', rarity: 'legendary' },
  { id: 'godrealm_evil', name: '邪不胜正', description: '击败邪恶之神', category: 'special', icon: '😈', checkType: 'godRealmBoss', target: 'boss-evil', rarity: 'legendary' },
  { id: 'godrealm_kind', name: '善念永存', description: '击败善良之神', category: 'special', icon: '😇', checkType: 'godRealmBoss', target: 'boss-kind', rarity: 'legendary' },
  { id: 'godrealm_asura', name: '修罗神威', description: '击败修罗神', category: 'special', icon: '⚔️', checkType: 'godRealmBoss', target: 'boss-asura', rarity: 'legendary' },
  // 神级领域
  { id: 'godrealm_tangsan', name: '海神陨落', description: '击败海神·唐三', category: 'special', icon: '🔱', checkType: 'godRealmBoss', target: 'boss-tangsan', rarity: 'epic' },
  { id: 'godrealm_xiaowu', name: '柔骨断魂', description: '击败柔骨斗罗·小舞', category: 'special', icon: '🐰', checkType: 'godRealmBoss', target: 'boss-xiaowu', rarity: 'epic' },
  { id: 'godrealm_ningrong', name: '七彩琉璃', description: '击败九彩斗罗·宁荣荣', category: 'special', icon: '💎', checkType: 'godRealmBoss', target: 'boss-ningrong', rarity: 'epic' },
  { id: 'godrealm_zhuzhu', name: '幽冥灵猫', description: '击败灵猫斗罗·朱竹清', category: 'special', icon: '🐱', checkType: 'godRealmBoss', target: 'boss-zhuzhu', rarity: 'epic' },
  { id: 'godrealm_oscar', name: '食神传承', description: '击败食神斗罗·奥斯卡', category: 'special', icon: '🍳', checkType: 'godRealmBoss', target: 'boss-oscar', rarity: 'epic' },
  { id: 'godrealm_mahongjun', name: '凤凰涅槃', description: '击败凤凰斗罗·马红俊', category: 'special', icon: '🔥', checkType: 'godRealmBoss', target: 'boss-mahongjun', rarity: 'epic' },
  { id: 'godrealm_daimobai', name: '白虎啸天', description: '击败白虎斗罗·戴沐白', category: 'special', icon: '🐯', checkType: 'godRealmBoss', target: 'boss-daimobai', rarity: 'epic' },
];
