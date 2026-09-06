/* config.js — 全局配置：初始属性、标志、元路线、结局定义
 * 严格对齐 GDD v0.6：属性 0–100、隐藏元路线计数、18 种结局（含续章）。
 */
window.MJ = window.MJ || {};
(function () {
  'use strict';

  var C = {};

  // 六维属性初值（GDD 5.2）；media(媒体关系)、loneliness(孤独) 为体验深化轴（§17.1 M5/M6），与声誉/压力相互独立
  C.initialAttributes = {
    health: 70,
    reputation: 50,
    wealth: 13,
    family: 60,
    art: 30,
    stress: 20,
    media: 60,
    loneliness: 0
  };

  // 财富属性（0–100）由净资产推导：wealth = clamp(round(netWorth / wealthScale), 0, 100)
  // wealthScale = 150（万 / 财富点）。现实参照：MJ 出身盖瑞工人家庭，1958 年出生时净资产≈0；
  // 职业生涯（70s–00s）积累后峰值净资产约数亿至十余亿美元（本作以“万”为单位时可达数万）。
  C.wealthScale = 150;

  // 净资产初值（单位：万）。MJ 1958 年出生时一贫如洗，故初值取 0；财富随人生选择逐步积累。
  // 走 Economy 子系统，与财富属性联动（不再各自为政）。
  C.initialNetWorth = 0;

  // 标志（flag）初值：多数在游玩中写入；此处仅占位
  C.initialFlags = {};

  // 元路线隐藏计数（非负整数）
  C.initialMeta = { phil: 0, mogul: 0, recluse: 0, artPath: 0, grammyWins: 0, collab: 0 };

  // 稀有度排序（图鉴/成就按 普通→传奇 自上而下排列）
  C.rarityRank = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
  // 成就「实际可达性」：均匀随机 5000 局实测的 check 命中率（1.0=每局必得）。
  // 用于成就图鉴按真实可达性排序（而非手写稀有度档位）。重算：node test/compute_ach_reach.cjs 5000
  C.achievementReach = {
    ACH_ROOKIE: 0.1094, ACH_BROTHERLY: 0, ACH_IDOL: 0.1634, ACH_CROWN: 0.2424,
    ACH_NEVERLAND: 0.4446, ACH_BLOOD: 0.2246, ACH_CATALOG: 0.089, ACH_DIGITAL: 0.0228,
    ACH_PEACEMAKER: 0.23, ACH_SAGE: 0.4468, ACH_RECLUSE: 0.4468, ACH_LEGAL: 0.1344,
    ACH_PHIL: 0.6134, ACH_FAMILYMAN: 0.7246, ACH_SURVIVOR: 0.1578, ACH_BALANCED: 0.0146,
    ACH_MEDIA_DARLING: 0.0192, ACH_LONELY: 0.198, ACH_HOLOGRAM: 0.1984, ACH_MUSICAL: 0.1984,
    ACH_MOGUL: 0.1808, ACH_ARTIST: 0.0724, ACH_TOUR: 0.6328, ACH_RICH: 0.5364,
    ACH_COMEBACK: 0.0318, ACH_TIMELESS_KING: 0.2696, ACH_DIGITAL_PIONEER: 0.1352,
    ACH_ETERNAL: 0.003, ACH_TRUE_ETERNAL: 0, ACH_BIOPIC: 0.0618, ACH_BIOPIC_SELF: 0.0684,
    ACH_BEYOND: 0.1984, ACH_END_STATESMAN: 0.0228, ACH_END_INNOVATOR: 0.039,
    ACH_END_MENTOR: 0.0018, ACH_END_RECLUSE_SERENE: 0.004, ACH_GRAMMY_SWEEP: 0,
    ACH_GRAMMY_LEGEND: 0.0974, ACH_DREAMER: 0.0788, ACH_PETERPAN: 0.1928, ACH_GREATWALL: 0.07,
    ACH_THISISIT: 0.0636, ACH_DANCE_GOD: 0.006, ACH_PHIL_3: 0.6134, ACH_CHARITY_CONCERT: 0,
    ACH_CATALOG_KING: 0.0092, ACH_SMOOTH: 0.9972, ACH_PEACE_3: 0.581, ACH_LONELY_KING: 0,
    ACH_FAMILY_WARM: 0.386, ACH_COMEBACK_2: 0.0318, ACH_EGG_HUNTER: 0, ACH_VARIANT_20: 0.2548,
    ACH_ALL_ENDINGS: 0, ACH_SPEEDRUN: 0.3236, ACH_PACIFIST: 0.859,
    // —— Phase 2 内容扩充（可达性由 compute_ach_reach N=5000 实测）——
    ACH_TOY_DRUM: 0.2644, ACH_FIRST_LIGHT: 0.7652, ACH_PEACE_AMBASSADOR: 0.5986,
    ACH_ELDEST_BOND: 0.2358, ACH_RECLUSE_PEACE: 0.255, ACH_STAGE_LEGEND: 0.0148,
    ACH_COMEBACK_KING: 0.0374, ACH_DIGITAL_ERA: 0.138, ACH_LEGACY_2026: 0.1412, ACH_WHOLE_LIFE: 0.116
  };
  // 结局稀有度（普通在最上、传奇在最下）。按用户反馈进一步下调：偏向"设计可达性/可达成感"
  // （配合图鉴「如何达成」配方，让玩家觉得稀有结局也能 pursuit），而非纯随机命中率。
  //   common 常规走向 | rare 需特定路线投入 | epic 高数值组合 | legendary 宿命/隐藏终极。
  C.endingRarity = {
    END_PLAIN: 'common', END_FAMILY: 'common', END_MOGUL: 'common',
    END_PHILANTHROPIST: 'common', END_CONTROVERSIAL: 'common', END_TIMELESS_PRESENT: 'common',
    END_INNOVATOR: 'rare', END_RECLUSE: 'rare', END_RECLUSE_SERENE: 'rare', END_MENTOR: 'rare',
    END_ETERNAL: 'rare', END_SURVIVE_DEBT: 'rare', END_FINANCIAL: 'rare',
    END_PERFECT: 'epic', END_STATESMAN: 'epic', END_ART_PEAK: 'epic',
    END_TRAGIC: 'legendary', END_TRUE_ETERNAL: 'legendary'
  };

  // 元路线破平次序：艺术 > 慈善 > 商业 > 隐士（GDD 7.2 注释）
  C.metaOrder = ['artPath', 'phil', 'mogul', 'recluse'];
  C.metaDefs = {
    artPath: { name: '艺术家', icon: '🎵' },
    phil: { name: '慈善家', icon: '🕊️' },
    mogul: { name: '商业巨擘', icon: '💼' },
    recluse: { name: '隐士', icon: '🏔️' }
  };

  // 属性中文名（UI 展示）
  C.attrNames = {
    health: '健康',
    reputation: '声誉',
    wealth: '财富',
    family: '家庭',
    art: '艺术',
    stress: '压力',
    media: '媒体',
    loneliness: '孤独'
  };

  // 18 种结局（含续章，GDD 7.1 扩展）；monologue 为结局专属长文独白（收尾独白），保持中性、不杜撰虚假史实。
  C.endings = {
    END_PLAIN: {
      name: '平凡人生', icon: '🌱', tone: '平静、遗憾', year: 1969, summary: '留在盖瑞，度过普通而平静的一生。',
      hint: '在 1_5 选择留在盖瑞、早早退出聚光灯，走最普通的人生路线。',
      monologue: '你没有走上那条被镁光灯铺满的路。盖瑞的夕阳照常落下，孩子们在巷口追逐，你成了他们之中最普通的一个。\n也许你错过了世界的掌声，但你也没错过属于自己的那碗热汤。有些人注定要照亮万人，而有些人，把光留给了身边的人。'
    },
    END_FAMILY: {
      name: '家庭幸福', icon: '👨‍👩‍👧‍👦', tone: '温暖、满足', year: 1969, summary: '未单飞，与兄弟共度一生。',
      hint: '在所有「单飞」抉择里都选留在 Jackson 5、与兄弟同行（始终不单飞）。',
      monologue: '你始终站在兄弟们的身侧，把“我们”看得比“我”更重。Jackson 5 的和声里，有你最安稳的童年，也有你最完整的自己。\n当喧嚣退去，围坐餐桌的笑声，是你这辈子最得意的作品。'
    },
    END_RECLUSE: {
      name: '隐居隐士', icon: '🏔️', tone: '疏离、释然', year: 1989, summary: '渐离聚光灯，寻得内心平静。',
      hint: '多走「隐士」路线（远离喧嚣的选项），让隐士成为主导元路线；晚年可稍显孤寂或健康偏低。',
      monologue: '你一点点退到了聚光灯照不到的角落。高墙里的静默，比任何舞台都让你安心。\n外界仍在揣测你的去向，而你终于不必再为别人的目光而活。孤独未必是惩罚，有时它是你给自己的最后一份体面。'
    },
    END_MOGUL: {
      name: '商业巨擘', icon: '💼', tone: '冷峻、雄厚', year: 1985, summary: '构筑音乐帝国与版权版图。',
      hint: '多走商业路线（ATV/Sony 版权、地产、投资），并把净资产保持为正、不留债务。',
      monologue: '你不再只是唱歌的人，你成了拥有旋律的人。一纸纸版权合约在手里叠成帝国，流行乐的王座之下，是你用算盘与野心铺出的地基。\n世人或羡或妒，但没人能否认——你重新定义了“艺人”这个词的重量。'
    },
    END_PHILANTHROPIST: {
      name: '慈善圣人', icon: '🕊️', tone: '仁爱、光辉', year: 1992, summary: '以善意定义传奇。',
      hint: '反复选择公益/慈善选项，把「慈善家」元路线堆到 3 级。',
      monologue: '你把舞台上的光，分给了那些够不着灯光的孩子。Heal the World 不只是一首歌的标题，更成了你真正活过的证据。\n当奖杯蒙尘，那些因为你的善意而重新亮起来的眼睛，才是你最想被记住的样子。'
    },
    END_TRAGIC: {
      name: '历史悲剧', icon: '💔', tone: '悲伤、宿命', year: 2009, summary: '烧伤、依赖与 2009 离世交织的宿命。',
      hint: '经历百事烧伤后选择依赖药物、仍坚持 This Is It，并让健康跌至谷底。',
      monologue: '灼伤、药物，与那场永远停在 2009 年的夏天——你的故事被太多人写过，却少有人真正读懂。\n聚光灯有多亮，身后的影子就有多长。历史会记得你的旋律，也会记得你没能躲过的那些暗箭。'
    },
    END_ART_PEAK: {
      name: '艺术巅峰', icon: '🎵', tone: '辉煌、悲壮', year: 2009, summary: '克服依赖，以最高艺术谢幕。',
      hint: '百事烧伤后保持清醒（不依赖药物）、坚持 This Is It 巡演，以最高艺术谢幕。',
      monologue: '你挣脱了药物的锁链，把最后的气力都交给了舞台。当幕布升起，全世界都看见了那个依旧完美的你。\n艺术没有辜负你，你也没有辜负艺术——这是你给自己，也是给时代，最骄傲的谢幕。'
    },
    END_FINANCIAL: {
      name: '财务崩溃', icon: '🏚️', tone: '挫败、警示', year: 2005, summary: '债务压垮，失去一切。',
      hint: '激进消费/投资导致债务，且未能在终局前清偿，被债务压垮。',
      monologue: '庄园的账单像雪片一样落下来，曾经触手可及的繁华，原来都标着价签。\n你学着在一无所有里重新站立，才明白金钱从不是枷锁，对金钱的执念才是。跌得够重，反而听见了自己真正的心跳。'
    },
    END_CONTROVERSIAL: {
      name: '争议缠身', icon: '⚖️', tone: '压抑、疲惫', year: 1994, summary: '多次庭外和解，声誉承压。',
      hint: '1993 选「庭外和解」或 2005 经历指控，并避免把声誉/媒体刷满（留点污点）。',
      monologue: '一次次的庭外和解，像补丁一样缝在名声上，却怎么也遮不住底下的裂痕。\n你学会在议论声里走路，把委屈咽进歌词里。不是所有真相都来得及说清，但你至少，始终没有低下唱歌的头。'
    },
    END_SURVIVE_DEBT: {
      name: '生存但负债', icon: '💪', tone: '坚韧、无奈', year: 2009, summary: '取消巡演保命但负债。',
      hint: '负债后选择取消 This Is It 巡演保命（而非硬撑到底）。',
      monologue: '你取消了那场本可封神的巡演，把命留给了自己。账单还在，质疑也还在，但你站在镜子前，第一次觉得呼吸是自己的。\n活下来，有时比完美落幕更需要勇气。'
    },
    END_PERFECT: {
      name: '完美传奇', icon: '🌟', tone: '圆满、传奇', year: 2009, summary: '避开创伤，健康荣誉安享晚年。',
      hint: '避开百事烧伤与债务，把健康、声誉都维持在高水位到终局。',
      monologue: '你避开了那些足以击垮人的暗礁，把健康、声誉与热爱都捧到了最后。没有彻骨的痛，却也不缺耀眼的光。\n世人羡慕你的圆满，只有你知道，这份“完美”里藏着多少次的清醒与克制。'
    },
    END_ETERNAL: {
      name: '永恒符号', icon: '👑', tone: '崇敬、不朽', year: 2009, summary: '艺术与声誉登峰，成为文化图腾。',
      hint: '把艺术(≥60)、声誉(≥56)、健康(≥42)推到高位，全程不被烧伤，并触发《Thriller 25》加冕或 30 周年纪念（拿到双标志之一）。',
      monologue: '艺术登峰，声誉不朽，你成了超越个人的文化图腾。后来的人提起“流行之王”，想到的不再是一个名字，而是一种可能。\n你谢幕了，但那双缀着水钻的手套，永远停在时间里，闪光。'
    },
    END_TRUE_ETERNAL: {
      name: '真·永恒符号', icon: '✨', tone: '不朽、至臻', year: 2009, hidden: true,
      summary: '艺术、声誉、健康与善意在巅峰交汇，你成了超越时间的传奇本身。',
      hint: '极致路线：艺术/声誉≥85、健康≥75、慈善家≥3、艺术家≥2，并同时拿到 Thriller25 与 30 周年双加冕、全程不烧伤不负债。',
      monologue: '当艺术、声誉、健康与善意同时抵达巅峰，你不再只是某个人，而是一种被时间反复确认的光。\n后来者的耳机里仍有你的节拍，孩子们的合唱里仍有你的和声——你超越了谢幕，成了永恒本身。'
    },
    END_TIMELESS_PRESENT: {
      name: '在场的不朽', icon: '♾️', tone: '在场、超越时间', year: 2019,
      summary: '你没在 2009 年停下；聚光灯之外，人生还有另一番写法。',
      hint: '在 2009 终局选择「续写人生」，进入 2019+ 续章线。',
      monologue: '你没有在 2009 年的夏天谢幕。此后的岁月里，你仍会在录音室里哼出新旋律，仍会在某个深夜为孩子们盖上被子。\n世人谈起你，不再用过去式——因为在场的人，本就不必被写成传奇的注脚。你活成了自己的续集。'
    },
    END_STATESMAN: {
      name: '文化大使', icon: '🤝', tone: '温和、受敬重', year: 2001,
      summary: '以善意与声望行走于世，你成了不同族群之间的一座桥。',
      hint: '兼顾慈善（≥2 级）与高声誉(≥58)、和睦家庭(≥45)，且不负债。',
      monologue: '你周游世界，手里捧的不是王冠，而是张开的手。\n在猜疑曾经伫立的地方，你留下了一段人人能跟着哼唱的旋律。\n大使是被任命的，而你，是被每一双学会聆听的耳朵选中的。'
    },
    END_INNOVATOR: {
      name: '音乐技术先驱', icon: '🚀', tone: '先锋、冷火', year: 1995,
      summary: '你不止写歌，更把声音推向了未知的边境。',
      hint: '走商业+艺术创新线：元路线「商业巨擘」≥2、财富够、艺术高时押注创新/科技选项。',
      monologue: '你从来不只写歌——你把声音的未来，拽进了现在。\n录音棚、舞台、机器，都成了你手里的乐器。\n后世记得的不只是你唱了什么，还有你敢让那个音符飞多远。'
    },
    END_MENTOR: {
      name: '提携后辈', icon: '🌟', tone: '温厚、薪火相传', year: 2000,
      summary: '你伸手拉过无数后来者，把光分给了更年轻的眼睛。',
      hint: '在慈善、家庭(≥40)与艺术(≥44)兼顾的同时，多选择提携/帮助后辈的选项。',
      monologue: '你知道，攀登最孤独时，是没有人伸手的那一段；于是你成了那只手。\n更年轻的眼睛，因你侧身让出位置而学会了发光。\n真正的传奇，不是站得最高的人，而是别人能站在他肩上的人。'
    },
    END_RECLUSE_SERENE: {
      name: '平和隐士', icon: '🏔️', tone: '安宁、自在', year: 2000,
      summary: '你退场却不枯萎，在静默里修成了一处安宁。',
      hint: '隐士路线为主，但注意健康≥50、保持家庭/媒体不低迷，孤独度<55。',
      monologue: '你从聚光灯下退开，这一次却没有苦涩。\n高墙围住的不是牢笼，而是一座花园。\n孤独，曾是你的影子，如今成了同伴——而这一次，寂静听来像休息。'
    }
  };

  // 成就系统（GDD §17：慈善家/巡演王/法律斗士/隐士 等；复用图鉴式 localStorage 持久化）
  // check(state, ctx) 中 ctx = { ending?: 结局id }；返回 true 即解锁。
  C.achievements = [
    // —— 普通 common ——
    { id: 'ACH_ROOKIE', name: '初露锋芒', icon: '🌱', rarity: 'common', desc: '首张个人专辑面世，少年开始有了自己的名字。',
      check: function (s) { return s.flags.soloAlbum1972 === true; } },
    { id: 'ACH_BROTHERLY', name: '兄弟同心', icon: '👬', rarity: 'uncommon', desc: '纵使单飞，也始终把兄弟放在心上。',
      check: function (s) { return (s.relations && s.relations.brothers || 0) >= 20; } },
    { id: 'ACH_IDOL', name: '万众倾心', icon: '🌟', rarity: 'common', desc: '让一代人的青春里，都住着你的旋律。',
      check: function (s) { return (s.relations && s.relations.fans || 0) >= 30; } },
    // —— 稀有 rare ——
    { id: 'ACH_CROWN', name: '加冕时刻', icon: '👑', rarity: 'rare', desc: '《Thriller 25》或 30 周年，让经典再度加冕。',
      check: function (s) { return s.flags.thriller25 === true || s.flags.anniv2001 === true; } },
    { id: 'ACH_NEVERLAND', name: '梦幻庄园主', icon: '🏰', rarity: 'rare', desc: '你为童心筑起一座名为 Neverland 的城堡。',
      check: function (s) { return s.flags.neverlandType && s.flags.neverlandType !== 'none'; } },
    { id: 'ACH_BLOOD', name: '血色舞步', icon: '🩸', rarity: 'rare', desc: '《Blood on the Dance Floor》让你在舞池里再封神。',
      check: function (s) { return s.flags.bloodDance === true; } },
    { id: 'ACH_CATALOG', name: '版权巨擘', icon: '📜', rarity: 'rare', desc: 'ATV 或 Sony/ATV，你把旋律变成了版图。',
      check: function (s) { return s.flags.atvBought === true || s.flags.sonyMerge === true; } },
    { id: 'ACH_DIGITAL', name: '数字公民', icon: '📡', rarity: 'rare', desc: '在互联网的浪潮里，你是弄潮儿也是掌舵人。',
      check: function (s) { return s.flags.internetSavvy === true; } },
    { id: 'ACH_PEACEMAKER', name: '和平使者', icon: '🕊️', rarity: 'rare', desc: '你让《Heal the World》不只是一首歌，而是一个承诺。',
      check: function (s) { return s.flags.healWorld === true; } },
    { id: 'ACH_SAGE', name: '隐世智者', icon: '🌙', rarity: 'rare', desc: '三度走进静默，你终于听见了自己。',
      check: function (s) { return (s.meta.recluse || 0) >= 3; } },
    { id: 'ACH_RECLUSE', name: '隐士', icon: '🏔️', rarity: 'rare', desc: '一次次退向静默，把喧嚣关在门外。',
      check: function (s) { return (s.meta.recluse || 0) >= 3; } },
    { id: 'ACH_LEGAL', name: '法律斗士', icon: '⚖️', rarity: 'rare', desc: '风波数度加身，却始终挺直脊背、不卑不亢。',
      check: function (s) { return (s.flags.settlement1993 || s.flags.secondCharge || s.flags.secondVerdict) && (s.attributes.reputation || 0) >= 55; } },
    { id: 'ACH_PHIL', name: '慈善家', icon: '💗', rarity: 'rare', desc: '以善意照亮世界，把公益走成了第二份事业。',
      check: function (s) { return (s.meta.phil || 0) >= 3; } },
    { id: 'ACH_FAMILYMAN', name: '情系家庭', icon: '🏡', rarity: 'rare', desc: '无论舞台多大，心里总为家人留着一盏灯。',
      check: function (s) { return (s.attributes.family || 0) >= 80; } },
    { id: 'ACH_SURVIVOR', name: '绝境求生', icon: '💪', rarity: 'rare', desc: '在债务的阴影里，仍把命握在自己手里。',
      check: function (s, ctx) { return s.debt === true && (ctx && ctx.ending === 'END_SURVIVE_DEBT' || (s.attributes.health || 0) >= 30); } },
    { id: 'ACH_BALANCED', name: '身心康泰', icon: '🍃', rarity: 'rare', desc: '在名利场里也守住了一张安静的睡眠。',
      check: function (s) { return (s.attributes.health || 0) >= 85 && (s.attributes.stress || 0) <= 30; } },
    { id: 'ACH_MEDIA_DARLING', name: '媒体宠儿', icon: '🎤', rarity: 'rare', desc: '镜头追着你转，你却始终游刃有余。',
      check: function (s) { return (s.attributes.media || 0) >= 80; } },
    { id: 'ACH_LONELY', name: '孤独王座', icon: '🌑', rarity: 'rare', desc: '站得越高，越听见自己的回声。',
      check: function (s) { return (s.attributes.loneliness || 0) >= 60; } },
    { id: 'ACH_HOLOGRAM', name: '光影重逢', icon: '🌟', rarity: 'rare', desc: '2014 年 Billboard 颁奖礼，你以全息之姿重返舞台——科技让传奇在离世之外，另有一种复活。',
      check: function (s) { return s.flags.hologramSeen === true; } },
    { id: 'ACH_MUSICAL', name: '百老汇的回响', icon: '🎭', rarity: 'rare', desc: '以你为名的音乐剧在百老汇拉开帷幕，舞台上的“你”替你谢幕，掌声仍为你而响。',
      check: function (s) { return s.flags.mjMusical === true; } },
    // —— 史诗 epic ——
    { id: 'ACH_MOGUL', name: '商业巨擘', icon: '💼', rarity: 'epic', desc: '用远见构筑起属于自己的音乐与版权帝国。',
      check: function (s) { return (s.meta.mogul || 0) >= 2 && !s.debt; } },
    { id: 'ACH_ARTIST', name: '艺术宗师', icon: '🎵', rarity: 'epic', desc: '把一生淬炼成旋律，登临艺术之巅。',
      check: function (s) { return (s.meta.artPath || 0) >= 2 && (s.attributes.art || 0) >= 75; } },
    { id: 'ACH_TOUR', name: '舞台之王', icon: '👑', rarity: 'epic', desc: '在无数舞台上点燃世界，掌声即是王冠。',
      check: function (s) { return (s.attributes.art || 0) >= 75 && (s.attributes.reputation || 0) >= 75; } },
    { id: 'ACH_RICH', name: '商业巨富', icon: '💰', rarity: 'epic', desc: '把旋律酿成了泼天的财富，数字本身已成传奇。',
      check: function (s) { return (s.attributes.wealth || 0) >= 90; } },
    { id: 'ACH_COMEBACK', name: '浴火重生', icon: '🔥', rarity: 'epic', desc: '聚光灯熄灭过，你又亲手把它点亮。',
      check: function (s) { return s.flags.comebackSeen === true; } },
    { id: 'ACH_TIMELESS_KING', name: '跨越时代', icon: '⏳', rarity: 'epic', desc: '《This Is It》的聚光灯下，你仍是那个不肯将就的匠人。',
      check: function (s) { return s.flags.thisItHeld === true; } },
    { id: 'ACH_DIGITAL_PIONEER', name: '数字先锋', icon: '🛰️', rarity: 'epic', desc: '你先于时代，把单曲汇成了唱片。',
      check: function (s) { return s.flags.digitalSingles === true; } },
    // —— 传奇 legendary ——
    { id: 'ACH_ETERNAL', name: '永恒符号', icon: '👑', rarity: 'legendary', desc: '艺术与声誉不朽，成为时代的文化图腾。',
      check: function (s, ctx) { return ctx && ctx.ending === 'END_ETERNAL'; } },
    { id: 'ACH_TRUE_ETERNAL', name: '真·永恒', icon: '✨', rarity: 'legendary', desc: '艺术、声誉、健康与善意于巅峰交汇，你超越了时间本身。',
      check: function (s, ctx) { return ctx && ctx.ending === 'END_TRUE_ETERNAL'; } },
    { id: 'ACH_BIOPIC', name: '银幕化身', icon: '🎬', rarity: 'legendary', desc: '2026 年，银幕上的你由亲人亲手演绎，传奇有了另一副面孔。',
      check: function (s) { return s.flags.biopic2026 === true; } },
    { id: 'ACH_BIOPIC_SELF', name: '银幕真我', icon: '🎞️', rarity: 'legendary', desc: '续章之中，你亲自走上银幕出演《Michael》——这世上唯一能演活你的，只有你自己。',
      check: function (s) { return s.flags.biopicMJStar === true; } },
    { id: 'ACH_BEYOND', name: '超越时间的在场', icon: '♾️', rarity: 'legendary', desc: '你没在 2009 年停下——人生，还有续集。',
      check: function (s) { return s.flags.survived2009 === true; } },
    // —— §17.7 更多结局候选（18 结局）专属成就 ——
    { id: 'ACH_END_STATESMAN', name: '文化大使', icon: '🤝', rarity: 'rare', desc: '以善意与声望行走于世，你成了不同族群之间的一座桥。',
      check: function (s, ctx) { return ctx && ctx.ending === 'END_STATESMAN'; } },
    { id: 'ACH_END_INNOVATOR', name: '音乐技术先驱', icon: '🚀', rarity: 'epic', desc: '你不止写歌，更把声音推向了未知的边境。',
      check: function (s, ctx) { return ctx && ctx.ending === 'END_INNOVATOR'; } },
    { id: 'ACH_END_MENTOR', name: '提携后辈', icon: '🌟', rarity: 'rare', desc: '你伸手拉过无数后来者，把光分给了更年轻的眼睛。',
      check: function (s, ctx) { return ctx && ctx.ending === 'END_MENTOR'; } },
    { id: 'ACH_END_RECLUSE_SERENE', name: '平和隐士', icon: '🏔️', rarity: 'rare', desc: '你退场却不枯萎，在静默里修成了一处安宁。',
      check: function (s, ctx) { return ctx && ctx.ending === 'END_RECLUSE_SERENE'; } },
    // —— §17.14 格莱美涌现联动验证成就（对齐 GDD §17.14.7）——
    { id: 'ACH_GRAMMY_SWEEP', name: '格莱美大满贯', icon: '🏆', rarity: 'epic', desc: '从《Off The Wall》到《Invincible》，你让每一座奖杯都写上了自己的名字。',
      check: function (s) { return ['otw', 'thriller', 'bad', 'dangerous', 'history', 'invincible'].every(function (k) { return (s.flags['grammy_' + k] || 0) >= 1; }); } },
    { id: 'ACH_GRAMMY_LEGEND', name: '格莱美传奇', icon: '🎖️', rarity: 'legendary', desc: '格莱美史上的奇观：你把自己活成了纪录本身。',
      check: function (s) { return (s.meta.grammyWins || 0) >= 18 || ['otw', 'thriller', 'bad', 'dangerous', 'history', 'invincible'].some(function (k) { return (s.flags['grammy_' + k] || 0) >= 6; }); } },
    // —— §17.13.3 未竟梦想成就（对齐 GDD §17.13.3）——
    { id: 'ACH_DREAMER', name: '造梦者', icon: '🌠', rarity: 'epic', desc: '你替那个男孩，把清单上没划掉的项，一一点亮了。',
      check: function (s) { return ['peterpan', 'greatwall', 'filmstudio', 'childhosp', 'thisisit', 'musical', 'space'].filter(function (k) { return s.flags['dream_' + k] === true; }).length >= 3; } },
    { id: 'ACH_PETERPAN', name: '彼得潘之约', icon: '🪶', rarity: 'rare', desc: '你买下版权、恳求角色，把那个不愿长大的男孩留在了银幕上。',
      check: function (s) { return s.flags.dream_peterpan === true; } },
    { id: 'ACH_GREATWALL', name: '长城之唱', icon: '🧱', rarity: 'rare', desc: '你在想象里，把演唱会开上了万里长城。',
      check: function (s) { return s.flags.dream_greatwall === true; } },
    { id: 'ACH_THISISIT', name: '未竟之演', icon: '🎬', rarity: 'epic', desc: '2009 年的伦敦 O2，你终于站上了那五十场的首夜。',
      check: function (s) { return s.flags.dream_thisisit === true; } },

    // —— §17.12 更多成就（候选清单落地）——
    { id: 'ACH_DANCE_GOD', name: '舞王', icon: '🕺', rarity: 'rare', desc: '单局内累计 ≥3 次月球漫步/完美演绎类选项。',
      check: function (s) { return (s.meta.artPath || 0) >= 3; } },
    { id: 'ACH_PHIL_3', name: '慈善三重奏', icon: '🤲', rarity: 'rare', desc: '单局内 爱心 累计 ≥3。',
      check: function (s) { return (s.meta.phil || 0) >= 3; } },
    { id: 'ACH_CHARITY_CONCERT', name: '义演行者', icon: '🎗️', rarity: 'rare', desc: '单局内触发 ≥2 次慈善/义演事件。',
      check: function (s) { return (s.flags.charityConcert || 0) >= 2; } },
    { id: 'ACH_CATALOG_KING', name: '版权之王', icon: '👑', rarity: 'epic', desc: '同时持有 ATV + Sony/ATV 半数 + 自创厂牌。',
      check: function (s) { return s.flags.atvBought === true && s.flags.sonyMerge === true && (s.meta.mogul || 0) >= 2; } },
    { id: 'ACH_SMOOTH', name: '完美月球漫步', icon: '🌠', rarity: 'rare', desc: '跨周目在 3_1b 选“完美演绎” ≥2 次。',
      check: function () { try { return MJ.eggSystem && MJ.eggSystem._load && MJ.eggSystem._load().moonwalkPerfect >= 2; } catch (e) { return false; } } },
    { id: 'ACH_PEACE_3', name: '和平使者', icon: '🕊️', rarity: 'rare', desc: '爱心 ≥3 且 声誉 ≥70。',
      check: function (s) { return (s.meta.phil || 0) >= 3 && (s.attributes.reputation || 0) >= 70; } },
    { id: 'ACH_LONELY_KING', name: '孤独的王', icon: '🥀', rarity: 'rare', desc: '孤独感 ≥50 且 声誉 ≥80。',
      check: function (s) { return (s.attributes.loneliness || 0) >= 50 && (s.attributes.reputation || 0) >= 80; } },
    { id: 'ACH_FAMILY_WARM', name: '暖心家长', icon: '🏡', rarity: 'rare', desc: '家庭 ≥80 且 与子女和解。',
      check: function (s) { return (s.attributes.family || 0) >= 80 && (s.flags.blanketBorn || s.flags.surrogacy || s.flags.kidsReconciled); } },
    { id: 'ACH_COMEBACK_2', name: '王者归来', icon: '🔥', rarity: 'epic', desc: '经历健康危机后 艺术 ≥85。',
      check: function (s) { return s.flags.comebackSeen === true && (s.attributes.art || 0) >= 85; } },
    { id: 'ACH_EGG_HUNTER', name: '彩蛋猎人', icon: '🥚', rarity: 'epic', desc: '解锁 ≥8 个彩蛋。',
      check: function () { try { return MJ.eggSystem && MJ.eggSystem.count && MJ.eggSystem.count() >= 8; } catch (e) { return false; } } },
    { id: 'ACH_VARIANT_20', name: '变体收藏家', icon: '🎲', rarity: 'epic', desc: '单局内触发 ≥20 次变体事件。',
      check: function (s) { return (s.stats.variants || 0) >= 20; } },
    { id: 'ACH_ALL_ENDINGS', name: '人生百态', icon: '🗺️', rarity: 'legendary', desc: '解锁全部 18 个结局。',
      check: function () { try { var g = MJ.saveSystem.getGallery ? MJ.saveSystem.getGallery() : {}; return Object.keys(g).length >= Object.keys(MJ.config.endings).length; } catch (e) { return false; } } },
    { id: 'ACH_SPEEDRUN', name: '速通人生', icon: '⚡', rarity: 'rare', desc: '以极简路径（极少节点）抵达任一结局。',
      check: function (s) { return (s.stats.events || 99) <= 24; } },
    { id: 'ACH_PACIFIST', name: '清白之躯', icon: '⚖️', rarity: 'rare', desc: '整局未卷入任何法律争议。',
      check: function (s) { return !s.flags.settlement1993 && !s.flags.secondCharge && !s.flags.secondVerdict && !s.flags.legalTrouble; } },

    // —— §17.16 童年补完 / 与兄长和解 专属成就（消除内容孤儿）——
    { id: 'ACH_GARY', name: '盖瑞的孩子', icon: '🏠', rarity: 'common', desc: '盖瑞市杰克逊街的小屋，九个孩子的笑声里，藏着一个巨星的起点。',
      check: function (s) { return s.flags.garyRoots === true; } },
    { id: 'ACH_APOLLO', name: '阿波罗加冕', icon: '🏅', rarity: 'rare', desc: '哈莱姆的阿波罗剧院，业余之夜的聚光灯下，你与兄弟们捧起了冠军。',
      check: function (s) { return s.flags.apolloChampion === true; } },
    { id: 'ACH_MOTOWN', name: '摩城之门', icon: '💫', rarity: 'rare', desc: '从 Steeltown 到 Motown，你推开了一扇通往世界的大门。',
      check: function (s) { return s.flags.motownAudition === true; } },
    { id: 'ACH_REUNITE', name: '破镜重圆', icon: '🪞', rarity: 'rare', desc: '三十周年舞台，你与兄长们把半生的隔阂留在了台下——不完整的合声，终于补全。',
      check: function (s) { return s.flags.brothersReunited === true; } },

    // —— Phase 2 内容扩充 ——
    { id: 'ACH_TOY_DRUM', name: '第一面鼓', icon: '🥁', rarity: 'common', desc: '盖瑞巷口那只旧玩具鼓，是你与世界合奏的第一件乐器。',
      check: function (s) { return s.flags.toyDrum === true; } },
    { id: 'ACH_FIRST_LIGHT', name: '初绽光芒', icon: '✨', rarity: 'rare', desc: '当艺术与声名同时抵达某个高度，你成了别人眼里的"那个迈克尔"。',
      check: function (s) { return (s.attributes.art || 0) >= 70 && (s.attributes.reputation || 0) >= 60; } },
    { id: 'ACH_PEACE_AMBASSADOR', name: '和平大使', icon: '🕊️', rarity: 'epic', desc: '你远赴远方，为一群孩子把歌声变成和平的请柬。',
      check: function (s) { return (s.meta.phil || 0) >= 3 && (s.attributes.reputation || 0) >= 65; } },
    { id: 'ACH_ELDEST_BOND', name: '长兄之绊', icon: '👬', rarity: 'rare', desc: '纵有分歧，你与兄长们的羁绊始终厚过任何流言。',
      check: function (s) { return (s.relations && s.relations.brothers || 0) >= 25; } },
    { id: 'ACH_RECLUSE_PEACE', name: '静好隐士', icon: '🌿', rarity: 'rare', desc: '你退向静默，却未被孤独吞没——安静里自有安宁。',
      check: function (s) { return (s.meta.recluse || 0) >= 2 && (s.attributes.loneliness || 0) < 40; } },
    { id: 'ACH_STAGE_LEGEND', name: '舞台传说', icon: '🎇', rarity: 'legendary', desc: '烧伤之后仍戒药登台——你把疼痛跳成了传奇。',
      check: function (s, ctx) { return ctx && ctx.ending === 'END_ART_PEAK'; } },
    { id: 'ACH_COMEBACK_KING', name: '王者再临', icon: '🔥', rarity: 'epic', desc: '经历健康危机后，你以更高的艺术完成逆袭。',
      check: function (s) { return s.flags.comebackSeen === true && (s.attributes.art || 0) >= 80; } },
    { id: 'ACH_DIGITAL_ERA', name: '数字先锋', icon: '📡', rarity: 'rare', desc: '你先于时代，把单曲汇成了唱片。',
      check: function (s) { return s.flags.digitalSingles === true; } },
    { id: 'ACH_LEGACY_2026', name: '2026 的回响', icon: '🎬', rarity: 'rare', desc: '传记电影里，你的传奇换了一种方式继续被讲述。',
      check: function (s) { return s.flags.biopic2026 === true || s.flags.biopicMJStar === true; } },
    { id: 'ACH_WHOLE_LIFE', name: '圆满人生', icon: '🍀', rarity: 'epic', desc: '声名、健康与从容在你身上同时落地——这一生，不亏欠自己。',
      check: function (s) { return (s.attributes.health || 0) >= 70 && (s.attributes.reputation || 0) >= 70 && (s.attributes.stress || 0) <= 40; } }
  ];

  // ---------- 体验深化（§17.1 高优先模块 M1–M4） ----------
  // M3 章节（时代切片 / 过场）：按年份把人生切为五章
  C.chapters = [
    { id: 0, start: 1958, end: 1969, title: '第一章 · 盖瑞的摇篮', sub: '1958 – 1969　工业城的童音', flavor: '炼钢厂的红光里，七口之家挤在窄屋。节拍，从廉价的摇篮边开始。' },
    { id: 1, start: 1970, end: 1981, title: '第二章 · 单飞与抉择', sub: '1970 – 1981　从组合到 Solo', flavor: '麦克风交到你一个人手里，身后的和声空了一块——也亮了一块。' },
    { id: 2, start: 1982, end: 1990, title: '第三章 · 巅峰时代', sub: '1982 – 1990　Thriller 与世界', flavor: '黑胶转动的声音，盖过了全世界的呼吸。你成了流行本身。' },
    { id: 3, start: 1991, end: 1999, title: '第四章 · 风暴与善意', sub: '1991 – 1999　争议、慈善与高墙', flavor: '掌声与议论同时涌来。你在高墙内建起乐园，也在法庭间走过暗廊。' },
    { id: 4, start: 2000, end: 2009, title: '第五章 · 谢幕与告别', sub: '2000 – 2009　晚景、官司与 This Is It', flavor: '镜前的舞步慢了，但那双缀着水钻的手套，仍在时间里闪光。' },
    { id: 5, start: 2010, end: 2026, title: '第六章 · 续写的传奇', sub: '2010 – 2026　假设未竟的人生', flavor: '如果 2009 年的那场排练没有成为终点，聚光灯之外，人生还有另一番写法。' }
  ];

  // M1 关系/羁绊系统：具名 NPC 好感（-100..100，初值 0）
  C.relationsDefs = [
    { key: 'brothers', name: '兄长与兄弟', icon: '👬' },
    { key: 'quincy', name: '昆西·琼斯', icon: '🎼' },
    { key: 'lisa', name: 'Lisa Marie', icon: '💍' },
    { key: 'debbie', name: '黛比·罗', icon: '💑' },
    { key: 'kids', name: '孩子们', icon: '🧒' },
    { key: 'fans', name: '歌迷', icon: '🌟' }
  ];
  C.initialRelations = {};
  C.relationsDefs.forEach(function (r) { C.initialRelations[r.key] = 0; });

  // M2 内心独白 / 手记模板：按章节 + 元路线/flag 生成第一人称独白（取首个命中 cond，无 cond 为兜底）
  C.diaryTemplates = {
    0: [
      { key: 'diary.0.0', cond: function (s) { return (s.attributes.art || 0) >= 50; }, text: '哥哥说我天生属于舞台。我偷偷把洗发水瓶当麦克风，对着镜子练了整晚的舞步。' },
      { key: 'diary.0.1', text: '盖瑞的夜晚总带着炼钢厂的铁锈味。我常在床上数着哥哥们的呼吸，想：外面的世界，会不会也有人为我的歌声停下脚步？' }
    ],
    1: [
      { key: 'diary.1.0', cond: function (s) { return s.flags.isSolo === true; }, text: '离开兄弟的那天，我既兴奋又空。方向盘握在自己手里，可庆功宴上少了几张熟悉的脸。' },
      { key: 'diary.1.1', cond: function (s) { return s.flags.isSolo === false; }, text: '我选择留在兄弟身边。有人笑我错失了独舞的聚光灯，可血缘的合唱，是谁也偷不走的。' },
      { key: 'diary.1.2', text: '二十岁像一张没写完的乐谱。我急于证明自己不只是"那个小男孩"。' }
    ],
    2: [
      { key: 'diary.2.0', cond: function (s) { return (s.attributes.art || 0) >= 75; }, text: '当《Thriller》的黑胶转起来，我听见全世界屏住了呼吸。这一刻，我确信音乐能打败孤独。' },
      { key: 'diary.2.1', cond: function (s) { return (s.attributes.stress || 0) >= 55; }, text: '名声像涨潮，我忙着不被冲走。偶尔想起盖瑞，才想起自己为什么开始唱。' },
      { key: 'diary.2.2', text: '镁光灯很暖，也很烫。我在世界之巅学着想：接下来，要留下什么？' }
    ],
    3: [
      { key: 'diary.3.0', cond: function (s) { return (s.meta.phil || 0) >= 2; }, text: '我建起乐园、办起基金会，只想把光分一点给够不着灯的孩子。' },
      { key: 'diary.3.1', cond: function (s) { return (s.meta.recluse || 0) >= 1; }, text: '我一点点退向高墙里。外界的议论越响，我越想安静。' },
      { key: 'diary.3.2', text: '掌声和流言同时涌来。我在法庭与舞台之间，学着不让任何人替我写结局。' }
    ],
    4: [
      { key: 'diary.4.0', cond: function (s) { return s.debt === true; }, text: '账单像雪片。我告诉自己：活下来，有时比完美落幕更需要勇气。' },
      { key: 'diary.4.1', cond: function (s) { return (s.attributes.health || 0) >= 60 && (s.attributes.reputation || 0) >= 60; }, text: '镜前的舞步慢了，可那双手套还在闪光。这一程，我不亏欠舞台。' },
      { key: 'diary.4.2', text: '2009 年的夏天，很多事要落幕了。我合上谱子，听见最初的那个盖瑞孩子在鼓掌。' }
    ]
  };

  // M4 命运回响 / 因果回调模板：按 flag 生成跨章因果回响（引擎收集所有命中项，去重）
  C.echoTemplates = [
    { key: 'echo.0', cond: function (s) { return s.flags.isSolo === true; }, text: '命运回响：当年迈出单飞那一步，让你与兄弟渐行渐远，却也握住了自己的方向盘。' },
    { key: 'echo.1', cond: function (s) { return s.flags.isPepsiBurned === true; }, text: '命运回响：84 年百事舞台的那场火，至今仍在肩头留着隐约的疤。' },
    { key: 'echo.2', cond: function (s) { return s.flags.painkillerDependent === true; }, text: '命运回响：从那场烧伤的镇痛起，药物悄悄成了你离不开的拐杖。' },
    { key: 'echo.3', cond: function (s) { return s.flags.marriedLisa === true || s.flags.marriedDebbie === true; }, text: '命运回响：你曾向镜头前的人交付过真心，婚姻的余温是暖，也是软肋。' },
    { key: 'echo.4', cond: function (s) { return s.flags.blanketBorn === true || s.flags.surrogacy === true; }, text: '命运回响：孩子降生的啼哭，是这喧嚣人间里你最想守护的安静。' },
    { key: 'echo.5', cond: function (s) { return (s.meta.phil || 0) >= 3; }, text: '命运回响：早年种下的善，如今长成了 Heal the World 的森林。' },
    { key: 'echo.6', cond: function (s) { return (s.meta.recluse || 0) >= 2; }, text: '命运回响：你一次次退回静默，喧嚣终于关在了门外。' }
  ];

  // M2 扩展：假如…（想象）微片段模板（GDD §17.11），按主导元路线程序化生成，全部标注"想象"
  C.vignetteTemplates = {
    artist: [
      { key: 'vignette.artist.0', zh: '若当晚你没登台，是否会一个人看回放看到天亮？' },
      { key: 'vignette.artist.1', zh: '若你从没学过那套舞步，镜子里的男孩会不会更自由？' }
    ],
    phil: [
      { key: 'vignette.phil.0', zh: '若你建的不是庄园而是学校，孩子们会不会在操场上跳起你的舞？' },
      { key: 'vignette.phil.1', zh: '若你把每一分版税都换成疫苗，世界会不会少一些哭声？' }
    ],
    mogul: [
      { key: 'vignette.mogul.0', zh: '若你买下的不是唱片公司而是整座电台，全世界的清晨会不会都放你的歌？' }
    ],
    recluse: [
      { key: 'vignette.recluse.0', zh: '若你关掉所有聚光灯，听见的第一种声音是什么？' },
      { key: 'vignette.recluse.1', zh: '若你把自己藏进一张旧唱片，谁会第一个把唱针放上去？' }
    ],
    default: [
      { key: 'vignette.default.0', zh: '若时光肯倒流一秒，你最想回到哪一个舞台？' }
    ]
  };

  // M1 关系相关成就（ACH_BROTHERLY / ACH_IDOL）已并入上方 C.achievements 数组。

  MJ.config = C;
})();
