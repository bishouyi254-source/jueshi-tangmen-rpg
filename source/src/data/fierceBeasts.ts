// EXPORTS: FierceBeast, FIERCE_BEASTS_STAR_LAKE, FIERCE_BEASTS_FROZEN, calcFierceBeastStats

/** 凶兽定义 */
export interface FierceBeast {
  id: string;
  name: string;
  title: string; // 封号/称号
  iconChar: string; // 头像图标字（体现凶兽特色）
  years: number; // 年限
  rank: number; // 十大凶兽排名
  quality: 'legendary'; // 凶兽统一为传说品质
  area: 'star-lake' | 'frozen-domain'; // 所在区域
  position: string; // 方位
  martialSoul: string; // 本体名称
  element: string; // 属性
  description: string;
  // 战斗属性
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  spirit: number;
  /** 9个魂环颜色 */
  ringColors: Array<'yellow' | 'purple' | 'black' | 'red' | 'gold'>;
  /** 魂技名称（9个） */
  soulSkills: string[];
  /** 战斗掉落物品池（按概率抽取，可多种同时掉落或不掉落） */
  drops: Array<{
    itemId: string;
    chance: number; // 概率 0-1
    amount?: number; // 数量，默认1
  }>;
  /** 化形为人后的外观描述（仅可化形的凶兽有） */
  humanForm?: {
    gender: '男' | '女';
    appearance: string; // 详细外观描述
    personality: string; // 性格描述
    /** 另一性别的化形版本（结为情侣选择性别的时候使用） */
    altAppearance?: string;
    altPersonality?: string;
  };
  /** 背景描述的女性版（默认 description 为原著性别，femaleDesc 提供另一性别版本） */
  femaleDescription?: string;
  /** 背景描述的男性版 */
  maleDescription?: string;
}

// ============================================
// 星斗大森林·生命之湖 十大凶兽（按原著排名）
// ============================================
export const FIERCE_BEASTS_STAR_LAKE: FierceBeast[] = [
  {
    id: 'di-tian',
    name: '帝天',
    title: '金眼黑龙王',
    iconChar: '龙',
    years: 890000,
    rank: 1,
    quality: 'legendary',
    area: 'star-lake',
    position: '中央',
    martialSoul: '金眼黑龙',
    element: '暗属性',
    description: '十大凶兽之首，八十九万年修为的金眼黑龙王，星斗大森林的真正主宰。本体乃龙神分身之一，继承了龙神的黑暗与力量属性，是黑龙一族的始祖。曾经历过龙神陨落的远古大战，身负重伤后隐匿于星斗大森林核心区域，守护着龙神的传承与生命之湖。平日里威严沉默，不轻易出手，但任何胆敢侵犯星斗的敌人都会感受到他那令人窒息的龙威。对帝天而言，守护星斗大森林是刻入龙魂的使命，而非职责。',
    humanForm: {
      gender: '男',
      appearance: '身形挺拔如苍松，身着暗金长袍，墨发以金冠束起，一双暗金色竖瞳深邃如海，鼻梁高挺，面容冷峻威严，周身散发着淡淡的龙威，举手投足间有帝王之气。',
      personality: '高傲威严，心思深沉，对星斗大森林有极强的守护欲，行事霸道却不失原则，面对认可之人会显露出罕见的温柔。',
    },
    hp: 35000000000, // v2.0 凶兽血量（89万年帝天）
    attack: 52500, // v2.0 凶兽攻击

    defense: 14000, // v2.0 凶兽防御
    speed: 4813, // ×1.1
    spirit: 9625,
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'red'],
    soulSkills: [
      '黑龙爪', '龙威震慑', '黑龙护体', '暗龙之怒', '龙息吐息',
      '黑暗龙域', '武魂真身·金眼黑龙', '龙神之威', '黑龙吞天',
    ],
    drops: [
      { itemId: 'spirit-grass-dark', chance: 0.25 },
      { itemId: 'attribute-grass-attack', chance: 0.20 },
      { itemId: 'attribute-grass-hp', chance: 0.15 },
      { itemId: 'immortal-qi-rong-tong-tian-ju', chance: 0.05 },
      { itemId: 'water-of-life', chance: 0.03 },
    ],
  },
  {
    id: 'xie-di',
    name: '邪帝',
    title: '邪眼暴君主宰',
    iconChar: '眼',
    years: 790000,
    rank: 2,
    quality: 'legendary',
    area: 'star-lake',
    position: '东侧',
    martialSoul: '邪眼暴君',
    element: '精神属性',
    description: '十大凶兽第二位，七十九万年的邪眼暴君主宰，星斗大森林东侧的统治者。本体是一只体型庞大的邪眼暴君，拥有恐怖的精神力，其灵魂攻击就连同级凶兽也难以抵挡。性格桀骜不驯，以玩弄人心为乐，却在漫长的岁月中逐渐对人性产生了复杂的好奇。作为精神属性的极致存在，邪帝的精神领域足以让封号斗罗陷入幻境而不自知，据说他的第三只眼能直接撕裂灵魂。',
    humanForm: {
      gender: '男',
      appearance: '身形修长偏瘦，一袭紫色长袍，苍白皮肤近乎透明，额心处有一枚竖着的紫色邪眼纹理，双目深紫如宝石，长发银紫相间垂至腰际，十指修长，整个人透着诡异的魅惑感。',
      personality: '桀骜不驯，精神力控制欲极强，喜欢玩弄人心，嘴上不饶人但内心有自己的底线，对认定的人有偏执的保护欲。',
    },
    hp: 16240000000, // v2.0 凶兽血量（78万年邪帝）
    attack: 34335, // v2.0 凶兽攻击

    defense: 10360, // v2.0 凶兽防御
    speed: 5968, // ×1.1
    spirit: 13475,
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'red'],
    soulSkills: [
      '精神冲击', '邪眼凝视', '灵魂撕裂', '精神风暴', '幻魔之眼',
      '暴君之怒', '武魂真身·邪眼暴君', '精神湮灭', '邪眼主宰',
    ],
    drops: [
      { itemId: 'spirit-grass-spirit', chance: 0.30 },
      { itemId: 'attribute-grass-spirit', chance: 0.20 },
      { itemId: 'immortal-wang-chuan-qiu-shui-lu', chance: 0.06 },
    ],
  },
  {
    id: 'bi-ji',
    name: '碧姬',
    title: '翡翠天鹅',
    iconChar: '翠',
    years: 580000,
    rank: 3,
    quality: 'legendary',
    area: 'star-lake',
    position: '治愈区',
    martialSoul: '翡翠天鹅',
    element: '生命属性',
    description: '十大凶兽第三位，五十八万年修为的翡翠天鹅，星斗大森林的治愈者与生命使者。本体是一只通体翠绿的天鹅，羽翼扇动间洒落生命之光，所过之处万物复苏。作为星斗的治愈者，碧姬拥有最纯粹的生命属性之力，能够将濒死的生灵从死亡线上拉回。她温柔善良，对所有生灵一视同仁，哪怕是曾伤害过森林的人类，在她眼中也只是迷途的孩子。',
    humanForm: {
      gender: '女',
      appearance: '碧绿长发如瀑布垂落，发间点缀着细碎的翡翠色羽毛，双眸是温润的翠绿色，肌肤白皙透着淡淡的生命光泽，身着翠绿色长裙，裙摆如天鹅羽翼般展开，气质温婉如水，笑容治愈人心。',
      personality: '温柔善良，悲天悯人，是星斗的治愈者，对所有生灵都抱有善意，但触碰到她的底线时会展现出惊人的坚韧。',
    },
    hp: 3237500000, // v2.0 凶兽血量（55万年万妖王）
    attack: 14070, // v2.0 凶兽攻击

    defense: 5495, // v2.0 凶兽防御
    speed: 6545, // ×1.1
    spirit: 7700,
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'red'],
    soulSkills: [
      '翠羽回春', '翡翠护体', '生命祝福', '圣光治愈', '天鹅之舞',
      '生命领域', '武魂真身·翡翠天鹅', '万物复苏', '生命赞歌',
    ],
    drops: [
      { itemId: 'spirit-grass-life', chance: 0.25 },
      { itemId: 'attribute-grass-hp', chance: 0.20 },
      { itemId: 'immortal-shui-xian-yu-ji-gu', chance: 0.05 },
    ],
  },
  {
    id: 'wan-yao-wang',
    name: '万妖王',
    title: '妖眼魔树',
    iconChar: '藤',
    years: 530000,
    rank: 4,
    quality: 'legendary',
    area: 'star-lake',
    position: '森林区',
    martialSoul: '妖眼魔树',
    element: '毒属性',
    description: '十大凶兽第四位，五十三万年修为的妖眼魔树，星斗大森林深处的绝对霸主。本体是一株扎根于地底的参天魔树，树干上生有一只巨大的妖异竖眼，能够释放出蕴含剧毒的精神波动。万妖王精通用毒与幻术，性格阴险狡诈，善于在暗处布局，森林中无数魂兽与人类都曾在他的幻境中迷失自我。然而他对自己认定的同伴却极为护短，是典型的「对外阴狠、对内宠溺」的性格。',
    humanForm: {
      gender: '男',
      appearance: '身形高挑，深绿色长发用树枝般的发冠束起，一双妖异的竖瞳呈墨绿色，左眼角下有一颗毒痣，身着深绿与暗紫相间的长袍，袖口绣有妖异藤蔓纹路，指尖泛着淡淡的紫光，笑容邪魅。',
      personality: '阴险狡诈，善于用毒和幻术，喜欢试探人心，看似温和实则城府极深，但对自己认可的同伴极为护短。',
    },
    hp: 2205000000, // v2.0 凶兽血量（47万年熊君）
    attack: 11375, // v2.0 凶兽攻击

    defense: 4725, // v2.0 凶兽防御
    speed: 3657, // ×1.1
    spirit: 8400,
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'red'],
    soulSkills: [
      '毒藤缠绕', '妖眼幻术', '剧毒之触', '万藤穿心', '精神毒雾',
      '妖王领域', '武魂真身·妖眼魔树', '万毒噬心', '妖眼灭世',
    ],
    drops: [
      { itemId: 'spirit-grass-poison', chance: 0.25 },
      { itemId: 'attribute-grass-spirit', chance: 0.15 },
      { itemId: 'immortal-xue-se-tian-e-wen', chance: 0.04 },
    ],
  },
  {
    id: 'xiong-jun',
    name: '熊君',
    title: '暗金恐爪熊',
    iconChar: '爪',
    years: 470000,
    rank: 5,
    quality: 'legendary',
    area: 'star-lake',
    position: '山区',
    martialSoul: '暗金恐爪熊',
    element: '力量属性',
    description: '十大凶兽第五位，四十七万年修为的暗金恐爪熊，星斗山区的霸主。熊君的肉身强横程度在十大凶兽中首屈一指，一双暗金色的巨爪足以撕裂山岳，就连同为凶兽的存在也不愿与他正面硬撼。性格暴躁直率，说话从不绕弯子，信奉「力量就是一切」的准则。然而这样一个暴脾气的主儿，却对星斗的伙伴们极为讲义气，每次森林遭遇危机都是他冲锋在前，用厚实的熊躯挡下最猛烈的攻击。',
    humanForm: {
      gender: '男',
      appearance: '身材壮硕如山，肌肉贲张，暗金色短发根根竖立，双目是凶悍的棕金色，面部线条刚毅如刀削，身着暗金色劲装，双手骨节粗大，指尖有暗金色的爪痕纹路，整个人散发着狂暴的力量气息。',
      personality: '暴躁直率，崇尚力量，说话不绕弯子，是典型的武夫性格，但极为重义气，对兄弟可以两肋插刀。',
    },
    hp: 1391250000, // v2.0 凶兽血量（39万年赤王）
    attack: 8820, // v2.0 凶兽攻击

    defense: 3955, // v2.0 凶兽防御
    speed: 3273, // ×1.1
    spirit: 3850,
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'red'],
    soulSkills: [
      '恐爪撕裂', '暗金咆哮', '熊王护体', '巨力拍击', '破山一击',
      '金刚之身', '武魂真身·暗金恐爪熊', '暗金恐爪', '熊君临世',
    ],
    drops: [
      { itemId: 'spirit-grass-strength', chance: 0.25 },
      { itemId: 'attribute-grass-attack', chance: 0.20 },
      { itemId: 'attribute-grass-defense', chance: 0.15 },
      { itemId: 'immortal-qi-rong-tong-tian-ju', chance: 0.04 },
    ],
  },
  {
    id: 'chi-wang',
    name: '赤王',
    title: '三头赤魔獒',
    iconChar: '獒',
    years: 300000,
    rank: 6,
    quality: 'legendary',
    area: 'star-lake',
    position: '火焰区',
    martialSoul: '三头赤魔獒',
    element: '火属性',
    description: '十大凶兽第六位，三十万年修为的三头赤魔獒，星斗火焰区的绝对王者。本体是一头生有三颗头颅的赤红色巨獒，三颗头颅分别掌控爆炎、魔火与赤炎三种火焰之力，同时嘶吼时大地都会为之震颤。赤王性格暴烈如火，骄傲且不服输，战斗起来不要命，是出了名的「拼命三郎」。但他的脾气来得快去得也快，前一秒还在咆哮，后一秒可能就因为一件小事哈哈大笑，性情如火般直率纯粹。',
    humanForm: {
      gender: '男',
      appearance: '赤红色短发如火焰燃烧，三双赤红色眼瞳并排排列在前额（化形后收敛为一双赤色竖瞳），面容桀骜，身着赤红与黑色相间的战袍，身形挺拔，周身有淡淡的赤焰缭绕，笑起来有几分邪气。',
      personality: '暴烈如火，性格骄傲，不服输，战斗起来不要命，对朋友却很讲义气，脾气来得快去得也快。',
    },
    hp: 378000000, // v2.0 凶兽血量（30万年冰帝）
    attack: 4270, // v2.0 凶兽攻击

    defense: 2380, // v2.0 凶兽防御
    speed: 5198, // ×1.1
    spirit: 4550,
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'red'],
    soulSkills: [
      '赤焰撕咬', '三火焰', '魔獒护体', '烈焰冲击', '赤焰领域',
      '赤炎爆裂', '武魂真身·三头赤魔獒', '焚天烈焰', '三头齐鸣',
    ],
    drops: [
      { itemId: 'spirit-grass-fire', chance: 0.25 },
      { itemId: 'attribute-grass-attack', chance: 0.15 },
      { itemId: 'immortal-lie-huo-xing-jiao-shu', chance: 0.03 },
      { itemId: 'immortal-ji-guan-feng-huang-kui', chance: 0.03 },
    ],
  },
  {
    id: 'zi-ji',
    name: '紫姬',
    title: '地狱魔龙王',
    iconChar: '魔',
    years: 280000,
    rank: 7,
    quality: 'legendary',
    area: 'star-lake',
    position: '暗影区',
    martialSoul: '地狱魔龙',
    element: '暗属性',
    description: '十大凶兽第七位，二十八万年修为的地狱魔龙王，星斗暗影区的主人，也是十大凶兽中少有的女性霸主。本体是一条紫黑色的魔龙，擅长隐匿于黑暗之中，在猎物最松懈的瞬间发动致命一击。紫姬妖媚狡黠，喜欢捉弄人，表面上风情万种轻浮不羁，实则心思缜密得可怕。她对黑暗力量的操控已经达到了艺术般的境界，据说在她的领域内，连光都会被吞噬。',
    humanForm: {
      gender: '女',
      appearance: '一袭深紫色露背长裙，紫黑色长发如瀑垂至脚踝，紫色竖瞳带着魅惑的笑意，身材妖娆，肤色冷白，背后有一对半透明的暗色龙翼可收可放，指尖泛着暗紫色的暗影能量，举手投足间风情万种。',
      personality: '妖媚狡黠，善于隐匿和偷袭，喜欢捉弄人，表面轻浮实则心思缜密，对真正在意的人会展现出柔软的一面。',
    },
    hp: 323750000, // v2.0 凶兽血量（28万年紫姬）
    attack: 3920, // v2.0 凶兽攻击

    defense: 2240, // v2.0 凶兽防御
    speed: 5583, // ×1.1
    spirit: 5250,
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'red'],
    soulSkills: [
      '魔龙爪', '地狱冥火', '魔龙之威', '黑暗吞噬', '魔龙吐息',
      '地狱领域', '武魂真身·地狱魔龙', '魔光灭世', '地狱降临',
    ],
    drops: [
      { itemId: 'spirit-grass-dark', chance: 0.25 },
      { itemId: 'attribute-grass-spirit', chance: 0.10 },
      { itemId: 'immortal-xiang-si-duan-chang-hong', chance: 0.03 },
    ],
  },
  {
    id: 'gui-di',
    name: '鬼帝',
    title: '亡灵寂灭者',
    iconChar: '亡',
    years: 250000,
    rank: 8,
    quality: 'legendary',
    area: 'star-lake',
    position: '亡灵区',
    martialSoul: '亡灵寂灭',
    element: '暗属性',
    description: '十大凶兽第八位，二十五万年修为的亡灵寂灭者，星斗亡灵区的神秘存在。没有人知道鬼帝是何时诞生的，只知道他掌控着亡灵与寂灭之力，能够召唤无尽的亡灵大军。他沉默寡言，性格阴冷，周身总是萦绕着淡淡的灰色死亡雾气，与生者天然疏离。然而在漫长的死亡岁月中，鬼帝却对「生」产生了独特的理解——正因为深知死亡的冰冷，才更明白生命的可贵。对自己认定的人，他会以亡灵之力誓死守护。',
    humanForm: {
      gender: '男',
      appearance: '身形瘦削如骷髅，苍白的皮肤下隐现青色血管，银灰色长发散乱披在肩上，双眼是空洞的灰白色，身着宽大的黑色亡灵长袍，袍角绣有骷髅纹路，周身萦绕着淡淡的灰色死亡雾气，声音低沉沙哑。',
      personality: '沉默寡言，性格阴冷，与生者天然疏离，但内心深处对生命有独特的理解，一旦认定某人便会以亡灵之力誓死守护。',
    },
    hp: 257250000, // v2.0 凶兽血量（25万年）
    attack: 3465, // v2.0 凶兽攻击

    defense: 2030, // v2.0 凶兽防御
    speed: 4428, // ×1.1
    spirit: 6825,
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'red'],
    soulSkills: [
      '亡灵召唤', '寂灭之光', '骸骨护盾', '死亡凝视', '亡灵大军',
      '寂灭领域', '武魂真身·亡灵寂灭者', '生死轮转', '万魂寂灭',
    ],
    drops: [
      { itemId: 'spirit-grass-dark', chance: 0.20 },
      { itemId: 'attribute-grass-spirit', chance: 0.15 },
      { itemId: 'immortal-xue-se-tian-e-wen', chance: 0.03 },
    ],
  },
  {
    id: 'tao-tie',
    name: '饕餮',
    title: '贪食之神',
    iconChar: '贪',
    years: 220000,
    rank: 9,
    quality: 'legendary',
    area: 'star-lake',
    position: '深潭区',
    martialSoul: '饕餮',
    element: '力量属性',
    description: '十大凶兽第九位，二十二万年修为的饕餮巨兽，常年盘踞在星斗深潭之底。传说饕餮的胃中自成一界，能够吞噬万物而不会撑爆。化形后是个圆滚滚的胖子，看起来人畜无害，实际上却是个实打实的狠角色——为了吃的可以拼命。饕餮性格开朗随和，整天笑眯眯的，是十大凶兽里人缘最好的一个，同时也是最精明的一个，毕竟能在弱肉强食的森林里活得这么滋润，光靠贪吃可是不够的。',
    humanForm: {
      gender: '男',
      appearance: '身材圆滚滚的胖子形象，面容却出奇的清秀，一头棕黄色短发，眼睛总是笑眯眯的像两个月牙，身着宽松的金棕色长袍，腰间挂着各种零食袋子，看起来人畜无害，但嘴角偶尔闪过的寒光暗示着他的恐怖。',
      personality: '贪吃成性，性格开朗，看起来大大咧咧实则精明得很，对食物有无穷的执念，为了吃的可以拼命，但对朋友非常大方。',
    },
    hp: 204750000, // v2.0 凶兽血量（22万年）
    attack: 3045, // v2.0 凶兽攻击

    defense: 1855, // v2.0 凶兽防御
    speed: 2888, // ×1.1
    spirit: 2975,
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'red'],
    soulSkills: [
      '饕餮噬咬', '吞噬万物', '饕餮之躯', '吞天巨口', '胃液消融',
      '饕餮领域', '武魂真身·饕餮', '一口吞尽', '饕餮降世',
    ],
    drops: [
      { itemId: 'spirit-grass-strength', chance: 0.20 },
      { itemId: 'attribute-grass-hp', chance: 0.20 },
      { itemId: 'immortal-long-zhi-ye', chance: 0.03 },
    ],
  },
  {
    id: 'qing-jiao',
    name: '青蛟王',
    title: '青金蛟',
    iconChar: '雷',
    years: 200000,
    rank: 10,
    quality: 'legendary',
    area: 'star-lake',
    position: '湖西区',
    martialSoul: '青金蛟',
    element: '雷属性',
    description: '十大凶兽第十位，二十万年修为的青金蛟王，星斗大森林湖西区的霸主。本体是一条青金色的巨蛟，血脉中流淌着稀薄的龙族血脉，掌控着雷霆之力。青蛟王性情桀骜，性如烈火，最讨厌拐弯抹角和虚与委蛇，说话做事直来直去，是个典型的爽利汉子。他一直以「化龙」为目标，日夜苦修，希望有朝一日能够褪去蛟身，化身为真正的金龙。虽然距离目标还很遥远，但他从不气馁——毕竟蛟成龙，本就是逆天而行。',
    humanForm: {
      gender: '男',
      appearance: '身形修长矫健，青金色长发高高束成马尾，一双琥珀色的眼眸锐利如电，皮肤是健康的古铜色，身着青色劲装，肩臂处有金色蛟鳞纹路，周身偶尔有细小的青色电弧跳跃，气质干练飒爽。',
      personality: '桀骜不驯，性如烈火，速度极快，讨厌拐弯抹角，说话直来直去，对认可的人极为豪爽。',
    },
    hp: 175000000, // v2.0 凶兽血量（20万年）
    attack: 2800, // v2.0 凶兽攻击

    defense: 1750, // v2.0 凶兽防御
    speed: 6930, // ×1.1
    spirit: 4550,
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'red'],
    soulSkills: [
      '蛟尾横扫', '雷霆一击', '青蛟护体', '雷电缠绕', '雷霆咆哮',
      '雷暴领域', '武魂真身·青金蛟', '万雷齐发', '青蛟化龙',
    ],
    drops: [
      { itemId: 'spirit-grass-thunder', chance: 0.20 },
      { itemId: 'attribute-grass-speed', chance: 0.15 },
      { itemId: 'immortal-ba-ban-xian-lan', chance: 0.03 },
    ],
  },
];

// ============================================
// 极北之地·极寒冰域 凶兽（冰/水属性）
// ============================================
export const FIERCE_BEASTS_FROZEN: FierceBeast[] = [
  {
    id: 'xue-di',
    name: '雪帝',
    title: '冰天雪女',
    iconChar: '雪',
    years: 700000,
    rank: 1,
    quality: 'legendary',
    area: 'frozen-domain',
    position: '冰峰之巅',
    martialSoul: '冰天雪女',
    element: '冰属性',
    description: '极北之地的绝对主宰，七十万年修为的冰天雪女，极北三大天王之首。她并非魂兽，而是由极北之地亿万年的天地寒气凝聚所化的生灵，天生便是极寒之力的化身。雪帝高贵清冷，性格骄傲，身为极北主宰有着极强的尊严感，从不向任何人低头。她的冰属性被称为「极致之冰」，冻天冻地，一念之间便能将千里疆域化为冰雪世界。外冷内热的她，对极北的子民有着深厚的守护之心，面对亲近之人时，会显露出与其身份不符的娇憨。',
    humanForm: {
      gender: '女',
      appearance: '身着雪白长裙的绝美少女，看上去只有十七八岁，肌肤胜雪，一头冰蓝色长发垂至地面，发间凝结着细碎的冰晶，双眸是清澈的冰蓝色，眉心有一枚雪花状的冰纹，周身散发着淡淡的寒气，赤足行走于冰雪之上，气质高洁清冷如九天玄女。',
      personality: '高贵清冷，性格骄傲，身为极北主宰有极强的尊严感，外冷内热，对极北的子民有深厚的守护之心，面对亲近之人会显露出少有的娇憨。',
    },
    hp: 8137500000, // v2.0 凶兽血量（70万年雪帝）
    attack: 23415, // v2.0 凶兽攻击

    defense: 7910, // v2.0 凶兽防御
    speed: 6160, // ×1.1
    spirit: 9625,
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'red'],
    soulSkills: [
      '雪舞极冰', '寒冰封冻', '雪女护体', '暴风雪', '绝对零度',
      '极寒领域', '武魂真身·冰天雪女', '雪帝三绝', '冰雪降临',
    ],
    drops: [
      { itemId: 'spirit-grass-ice', chance: 0.30 },
      { itemId: 'attribute-grass-defense', chance: 0.15 },
      { itemId: 'polar-ice-jade', chance: 0.10 },
      { itemId: 'immortal-ba-jiao-xuan-bing-cao', chance: 0.06 },
    ],
  },
  {
    id: 'bing-di',
    name: '冰帝',
    title: '冰碧帝皇蝎',
    iconChar: '蝎',
    years: 400000,
    rank: 2,
    quality: 'legendary',
    area: 'frozen-domain',
    position: '冰窟深处',
    martialSoul: '冰碧帝皇蝎',
    element: '冰属性',
    description: '极北三大天王之二，四十万年修为的冰碧帝皇蝎，极北冰窟深处的霸主。本体是一只通体翠绿的帝皇蝎，尾钩上蕴含着极致之冰的恐怖力量，被尾钩刺中的猎物会在瞬间被冻成冰雕。冰帝性格傲娇霸道，嘴上不饶人，典型的刀子嘴豆腐心，自尊心极强，尤其讨厌被人说「矮」——毕竟化形后只有一米五六的身高一直是她心中的一根刺。但她内心其实比谁都在意身边的人，只是表达关心的方式总是别扭又笨拙。',
    humanForm: {
      gender: '女',
      appearance: '小个子少女，身高约一米五六，娇小可爱的面容却总是一副傲娇表情，翠绿色的双马尾活泼地翘着，发梢有冰蝎尾钩状的装饰，碧绿的眼眸大而明亮，身着翠绿与冰蓝相间的短裙，身后有一条小小的冰碧蝎尾巴时不时晃来晃去，皮肤白皙透着淡淡的翡翠色光晕。',
      personality: '傲娇霸道，嘴上不饶人，典型的刀子嘴豆腐心，自尊心极强，尤其讨厌被人说矮，但内心其实很在意身边的人，别扭地表达关心。',
    },
    hp: 812000000, // v2.0 凶兽血量（冰碧蝎）
    attack: 6545, // v2.0 凶兽攻击

    defense: 3185, // v2.0 凶兽防御
    speed: 5005, // ×1.1
    spirit: 6125,
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'red'],
    soulSkills: [
      '冰蝎尾钩', '翡翠冰刃', '帝皇护体', '冰爆术', '永冻之域',
      '帝皇之威', '武魂真身·冰碧帝皇蝎', '冰碧之光', '帝皇寒极',
    ],
    drops: [
      { itemId: 'spirit-grass-ice', chance: 0.28 },
      { itemId: 'attribute-grass-attack', chance: 0.15 },
      { itemId: 'polar-ice-jade', chance: 0.08 },
    ],
  },
  {
    id: 'xiao-bai',
    name: '小白',
    title: '魔魂大白鲨',
    iconChar: '鲨',
    years: 300000,
    rank: 3,
    quality: 'legendary',
    area: 'frozen-domain',
    position: '冰封海域',
    martialSoul: '魔魂大白鲨',
    element: '水属性',
    description: '极北冰海的霸主，三十万年修为的魔魂大白鲨之王，极北三大天王位列第三。本体是一头银白色的巨鲨，在冰海中拥有无与伦比的速度与力量。化形后是个身高腿长的爽朗御姐，性格大大咧咧，像男孩子一样直率仗义，战斗力极强，是个标准的行动派。小白对朋友极为护短，谁要是敢动她的人，她能追着对方从极北追到星斗。在极北冰海，她就是当之无愧的大姐大。',
    humanForm: {
      gender: '女',
      appearance: '身高腿长的御姐型美女，银白色长发如海浪般卷曲，冰蓝色的双眸明亮而锐利，皮肤是健康的小麦色，身着银白色的紧身战裙勾勒出完美曲线，脚踝处有淡淡的鱼鳞纹路，笑容爽朗大方，有着海洋般的活力。',
      personality: '爽朗直率，男孩子气，说话大大咧咧，战斗力极强，是个行动派，对朋友极为护短，有大姐大气质。',
    },
    hp: 378000000, // v2.0 凶兽血量（冰天雪女）
    attack: 4270, // v2.0 凶兽攻击

    defense: 2380, // v2.0 凶兽防御
    speed: 5390, // ×1.1
    spirit: 3850,
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'red'],
    soulSkills: [
      '鲨齿撕咬', '寒冰吐息', '魔鲨之躯', '海啸冰浪', '深海寒冰',
      '鲨歌领域', '武魂真身·魔魂大白鲨', '冰封万里', '魔鲨吞天',
    ],
    drops: [
      { itemId: 'spirit-grass-water', chance: 0.25 },
      { itemId: 'attribute-grass-hp', chance: 0.15 },
      { itemId: 'polar-ice-jade', chance: 0.06 },
    ],
  },
  {
    id: 'bing-feng-wang',
    name: '冰凰',
    title: '冰凰王',
    iconChar: '凰',
    years: 350000,
    rank: 4,
    quality: 'legendary',
    area: 'frozen-domain',
    position: '冰崖之巅',
    martialSoul: '冰凰',
    element: '冰属性',
    description: '极北冰原的飞禽霸主，三十五万年修为的冰凰，常年栖息于极北最高的冰崖之巅。本体是一只冰蓝色的凤凰，羽翼舒展时遮天蔽日，振翅间便能掀起漫天风雪。冰凰性格高傲优雅，有着飞禽王者的尊贵与骄傲，从不轻易降落凡尘，也不轻易表露情绪。她表达感情的方式含蓄而深沉——对认可的人，她不会说什么漂亮话，只是会在你看不见的地方，默默地为你遮挡风雪。在极北的传说中，冰凰的羽毛能够治愈一切伤痛。',
    humanForm: {
      gender: '女',
      appearance: '高贵冷艳的御姐，冰凰色（浅蓝泛金）的长发盘成优雅的飞仙髻，插着一根冰晶凤凰发簪，丹凤眼微微上挑，眼神高傲，身着冰蓝色广袖长裙，裙裾绣有金色凤凰纹路，身后有一对半透明的冰凰羽翼可收可放，气质高贵典雅，有凤栖梧桐之姿。',
      personality: '高傲优雅，自尊心极强，有着飞禽王者的尊贵，不轻易表露情绪，对认可的人会默默守护，表达感情的方式含蓄而深沉。',
    },
    hp: 553000000, // v2.0 凶兽血量（极冰之主）
    attack: 5285, // v2.0 凶兽攻击

    defense: 2765, // v2.0 凶兽防御
    speed: 8278, // ×1.1
    spirit: 5425,
    ringColors: ['yellow', 'yellow', 'purple', 'purple', 'black', 'black', 'black', 'black', 'red'],
    soulSkills: [
      '冰凰俯冲', '凤舞冰天', '冰晶凰羽', '涅槃冰封', '寒焰之翼',
      '冰凰领域', '武魂真身·冰凰', '九天冷凰', '万载寒冰',
    ],
    drops: [
      { itemId: 'spirit-grass-ice', chance: 0.25 },
      { itemId: 'attribute-grass-speed', chance: 0.15 },
      { itemId: 'polar-ice-jade', chance: 0.05 },
      { itemId: 'immortal-ba-ban-xian-lan', chance: 0.04 },
    ],
  },
];

// ============================================
// 工具函数
// ============================================
export function getFierceBeastById(id: string): FierceBeast | undefined {
  return [...FIERCE_BEASTS_STAR_LAKE, ...FIERCE_BEASTS_FROZEN].find((b) => b.id === id);
}

/** 格式化年限为"X万年" */
export function formatFierceYears(years: number): string {
  const wan = years / 10000;
  return `${wan.toFixed(0)}万年`;
}

/**
 * 根据目标性别获取凶兽的描述与化形版本。
 * - 目标性别与原始性别一致 → 返还原版；
 * - 提供 alt* 字段 → 用定制版；
 * - 否则走通用性别词汇替换。
 */
export function getGenderedBeast(b: FierceBeast, targetGender: 'male' | 'female'): {
  description: string;
  appearance: string;
  personality: string;
} {
  const originalIsMale = b.humanForm?.gender === '男';
  const targetIsMale = targetGender === 'male';

  // 描述：有 maleDescription / femaleDescription 时优先用对应版本
  let description = b.description;
  if (!originalIsMale && targetIsMale && b.maleDescription) {
    description = b.maleDescription;
  } else if (originalIsMale && !targetIsMale && b.femaleDescription) {
    description = b.femaleDescription;
  } else if (originalIsMale !== targetIsMale) {
    description = genderedText(b.description, targetGender);
  }

  // 化形版：humanForm 不存在时返回空串（不显示）
  if (!b.humanForm) {
    return { description, appearance: '', personality: '' };
  }
  const altApp = b.humanForm.altAppearance;
  const altPer = b.humanForm.altPersonality;
  if (originalIsMale !== targetIsMale && (altApp || altPer)) {
    return {
      description,
      appearance: altApp ?? genderedText(b.humanForm.appearance, targetGender),
      personality: altPer ?? genderedText(b.humanForm.personality, targetGender),
    };
  }
  if (originalIsMale !== targetIsMale) {
    return {
      description,
      appearance: genderedText(b.humanForm.appearance, targetGender),
      personality: genderedText(b.humanForm.personality, targetGender),
    };
  }
  return {
    description,
    appearance: b.humanForm.appearance,
    personality: b.humanForm.personality,
  };
}

/** 通用性别词汇替换（男↔女） */
function genderedText(text: string, target: 'male' | 'female'): string {
  let t = text;
  if (target === 'female') {
    t = t.replace(/少年/g, '少女');
    t = t.replace(/男子/g, '女子');
    t = t.replace(/公子/g, '姑娘');
    t = t.replace(/他/g, '她');
    t = t.replace(/他的/g, '她的');
    t = t.replace(/男人/g, '女人');
    t = t.replace(/哥哥/g, '姐姐');
    t = t.replace(/弟弟/g, '妹妹');
    t = t.replace(/儿子/g, '女儿');
    t = t.replace(/父子/g, '母女');
    t = t.replace(/兄弟/g, '姐妹');
    t = t.replace(/英俊/g, '清丽');
    t = t.replace(/俊朗/g, '秀美');
    t = t.replace(/俊逸/g, '清丽脱俗');
    t = t.replace(/健硕/g, '窈窕');
    t = t.replace(/魁梧/g, '纤秀');
    t = t.replace(/挺拔/g, '亭亭玉立');
    t = t.replace(/阳刚/g, '柔美');
    t = t.replace(/英气/g, '灵气');
    t = t.replace(/霸气/g, '傲骨');
    t = t.replace(/长袍/g, '长裙');
    t = t.replace(/长衫/g, '长裙');
    t = t.replace(/短发/g, '长发');
    t = t.replace(/束发/g, '挽发');
    t = t.replace(/男儿/g, '女儿');
    t = t.replace(/王者/g, '女王');
    t = t.replace(/帝王/g, '女帝');
    t = t.replace(/少主/g, '少宫主');
    t = t.replace(/少年郎/g, '少女妆');
  } else {
    t = t.replace(/少女/g, '少年');
    t = t.replace(/女子/g, '男子');
    t = t.replace(/姑娘/g, '公子');
    t = t.replace(/她/g, '他');
    t = t.replace(/她的/g, '他的');
    t = t.replace(/女人/g, '男人');
    t = t.replace(/姐姐/g, '哥哥');
    t = t.replace(/妹妹/g, '弟弟');
    t = t.replace(/女儿/g, '儿子');
    t = t.replace(/母女/g, '父子');
    t = t.replace(/姐妹/g, '兄弟');
    t = t.replace(/清丽/g, '俊朗');
    t = t.replace(/秀美/g, '俊逸');
    t = t.replace(/窈窕/g, '健硕');
    t = t.replace(/纤秀/g, '魁梧');
    t = t.replace(/亭亭玉立/g, '挺拔');
    t = t.replace(/柔美/g, '阳刚');
    t = t.replace(/灵气/g, '英气');
    t = t.replace(/长裙/g, '长袍');
    t = t.replace(/长发/g, '短发');
    t = t.replace(/挽发/g, '束发');
    t = t.replace(/娇俏/g, '俊朗');
    t = t.replace(/娇羞/g, '腼腆');
    t = t.replace(/柔弱/g, '刚强');
    t = t.replace(/温柔/g, '温润');
    t = t.replace(/妩媚/g, '英挺');
    t = t.replace(/女王/g, '王者');
    t = t.replace(/女帝/g, '帝王');
  }
  return t;
}
