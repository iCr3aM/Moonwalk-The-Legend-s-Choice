/* config.js — 全局配置：初始属性、标志、元路线、结局定义
 * 严格对齐 GDD v0.6：属性 0–100、隐藏元路线计数、12 种结局。
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
  C.initialMeta = { phil: 0, mogul: 0, recluse: 0, artPath: 0 };

  // 稀有度排序（图鉴/成就按 普通→传奇 自上而下排列）
  C.rarityRank = { common: 0, rare: 1, epic: 2, legendary: 3 };
  // 结局稀有度（普通在最上、传奇在最下）
  C.endingRarity = {
    END_PLAIN: 'common', END_FAMILY: 'common', END_RECLUSE: 'rare', END_MOGUL: 'rare',
    END_PHILANTHROPIST: 'rare', END_TRAGIC: 'common', END_ART_PEAK: 'epic', END_FINANCIAL: 'common',
    END_CONTROVERSIAL: 'rare', END_SURVIVE_DEBT: 'rare', END_PERFECT: 'epic', END_ETERNAL: 'legendary',
    END_TRUE_ETERNAL: 'legendary', END_TIMELESS_PRESENT: 'legendary'
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

  // 12 种结局（GDD 7.1）；monologue 为结局专属长文独白（收尾独白），保持中性、不杜撰虚假史实。
  C.endings = {
    END_PLAIN: {
      name: '平凡人生', icon: '🌱', tone: '平静、遗憾', summary: '留在盖瑞，度过普通而平静的一生。',
      monologue: '你没有走上那条被镁光灯铺满的路。盖瑞的夕阳照常落下，孩子们在巷口追逐，你成了他们之中最普通的一个。\n也许你错过了世界的掌声，但你也没错过属于自己的那碗热汤。有些人注定要照亮万人，而有些人，把光留给了身边的人。'
    },
    END_FAMILY: {
      name: '家庭幸福', icon: '👨‍👩‍👧‍👦', tone: '温暖、满足', summary: '未单飞，与兄弟共度一生。',
      monologue: '你始终站在兄弟们的身侧，把“我们”看得比“我”更重。Jackson 5 的和声里，有你最安稳的童年，也有你最完整的自己。\n当喧嚣退去，围坐餐桌的笑声，是你这辈子最得意的作品。'
    },
    END_RECLUSE: {
      name: '隐居隐士', icon: '🏔️', tone: '疏离、释然', summary: '渐离聚光灯，寻得内心平静。',
      monologue: '你一点点退到了聚光灯照不到的角落。高墙里的静默，比任何舞台都让你安心。\n外界仍在揣测你的去向，而你终于不必再为别人的目光而活。孤独未必是惩罚，有时它是你给自己的最后一份体面。'
    },
    END_MOGUL: {
      name: '商业巨擘', icon: '💼', tone: '冷峻、雄厚', summary: '构筑音乐帝国与版权版图。',
      monologue: '你不再只是唱歌的人，你成了拥有旋律的人。一纸纸版权合约在手里叠成帝国，流行乐的王座之下，是你用算盘与野心铺出的地基。\n世人或羡或妒，但没人能否认——你重新定义了“艺人”这个词的重量。'
    },
    END_PHILANTHROPIST: {
      name: '慈善圣人', icon: '🕊️', tone: '仁爱、光辉', summary: '以善意定义传奇。',
      monologue: '你把舞台上的光，分给了那些够不着灯光的孩子。Heal the World 不只是一首歌的标题，更成了你真正活过的证据。\n当奖杯蒙尘，那些因为你的善意而重新亮起来的眼睛，才是你最想被记住的样子。'
    },
    END_TRAGIC: {
      name: '历史悲剧', icon: '💔', tone: '悲伤、宿命', summary: '烧伤、依赖与 2009 离世交织的宿命。',
      monologue: '灼伤、药物，与那场永远停在 2009 年的夏天——你的故事被太多人写过，却少有人真正读懂。\n聚光灯有多亮，身后的影子就有多长。历史会记得你的旋律，也会记得你没能躲过的那些暗箭。'
    },
    END_ART_PEAK: {
      name: '艺术巅峰', icon: '🎵', tone: '辉煌、悲壮', summary: '克服依赖，以最高艺术谢幕。',
      monologue: '你挣脱了药物的锁链，把最后的气力都交给了舞台。当幕布升起，全世界都看见了那个依旧完美的你。\n艺术没有辜负你，你也没有辜负艺术——这是你给自己，也是给时代，最骄傲的谢幕。'
    },
    END_FINANCIAL: {
      name: '财务崩溃', icon: '🏚️', tone: '挫败、警示', summary: '债务压垮，失去一切。',
      monologue: '庄园的账单像雪片一样落下来，曾经触手可及的繁华，原来都标着价签。\n你学着在一无所有里重新站立，才明白金钱从不是枷锁，对金钱的执念才是。跌得够重，反而听见了自己真正的心跳。'
    },
    END_CONTROVERSIAL: {
      name: '争议缠身', icon: '⚖️', tone: '压抑、疲惫', summary: '多次庭外和解，声誉承压。',
      monologue: '一次次的庭外和解，像补丁一样缝在名声上，却怎么也遮不住底下的裂痕。\n你学会在议论声里走路，把委屈咽进歌词里。不是所有真相都来得及说清，但你至少，始终没有低下唱歌的头。'
    },
    END_SURVIVE_DEBT: {
      name: '生存但负债', icon: '💪', tone: '坚韧、无奈', summary: '取消巡演保命但负债。',
      monologue: '你取消了那场本可封神的巡演，把命留给了自己。账单还在，质疑也还在，但你站在镜子前，第一次觉得呼吸是自己的。\n活下来，有时比完美落幕更需要勇气。'
    },
    END_PERFECT: {
      name: '完美传奇', icon: '🌟', tone: '圆满、传奇', summary: '避开创伤，健康荣誉安享晚年。',
      monologue: '你避开了那些足以击垮人的暗礁，把健康、声誉与热爱都捧到了最后。没有彻骨的痛，却也不缺耀眼的光。\n世人羡慕你的圆满，只有你知道，这份“完美”里藏着多少次的清醒与克制。'
    },
    END_ETERNAL: {
      name: '永恒符号', icon: '👑', tone: '崇敬、不朽', summary: '艺术与声誉登峰，成为文化图腾。',
      monologue: '艺术登峰，声誉不朽，你成了超越个人的文化图腾。后来的人提起“流行之王”，想到的不再是一个名字，而是一种可能。\n你谢幕了，但那双缀着水钻的手套，永远停在时间里，闪光。'
    },
    END_TRUE_ETERNAL: {
      name: '真·永恒符号', icon: '✨', tone: '不朽、至臻', hidden: true,
      summary: '艺术、声誉、健康与善意在巅峰交汇，你成了超越时间的传奇本身。',
      monologue: '当艺术、声誉、健康与善意同时抵达巅峰，你不再只是某个人，而是一种被时间反复确认的光。\n后来者的耳机里仍有你的节拍，孩子们的合唱里仍有你的和声——你超越了谢幕，成了永恒本身。'
    },
    END_TIMELESS_PRESENT: {
      name: '在场的不朽', icon: '♾️', tone: '在场、超越时间',
      summary: '你没在 2009 年停下；聚光灯之外，人生还有另一番写法。',
      monologue: '你没有在 2009 年的夏天谢幕。此后的岁月里，你仍会在录音室里哼出新旋律，仍会在某个深夜为孩子们盖上被子。\n世人谈起你，不再用过去式——因为在场的人，本就不必被写成传奇的注脚。你活成了自己的续集。'
    }
  };

  // 成就系统（GDD §17：慈善家/巡演王/法律斗士/隐士 等；复用图鉴式 localStorage 持久化）
  // check(state, ctx) 中 ctx = { ending?: 结局id }；返回 true 即解锁。
  C.achievements = [
    // —— 普通 common ——
    { id: 'ACH_ROOKIE', name: '初露锋芒', icon: '🌱', rarity: 'common', desc: '首张个人专辑面世，少年开始有了自己的名字。',
      check: function (s) { return s.flags.soloAlbum1972 === true; } },
    { id: 'ACH_BROTHERLY', name: '兄弟同心', icon: '👬', rarity: 'common', desc: '纵使单飞，也始终把兄弟放在心上。',
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
      check: function (s) { return s.flags.survived2009 === true; } }
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
      { cond: function (s) { return (s.attributes.art || 0) >= 50; }, text: '哥哥说我天生属于舞台。我偷偷把洗发水瓶当麦克风，对着镜子练了整晚的舞步。' },
      { text: '盖瑞的夜晚总带着炼钢厂的铁锈味。我常在床上数着哥哥们的呼吸，想：外面的世界，会不会也有人为我的歌声停下脚步？' }
    ],
    1: [
      { cond: function (s) { return s.flags.isSolo === true; }, text: '离开兄弟的那天，我既兴奋又空。方向盘握在自己手里，可庆功宴上少了几张熟悉的脸。' },
      { cond: function (s) { return s.flags.isSolo === false; }, text: '我选择留在兄弟身边。有人笑我错失了独舞的聚光灯，可血缘的合唱，是谁也偷不走的。' },
      { text: '二十岁像一张没写完的乐谱。我急于证明自己不只是"那个小男孩"。' }
    ],
    2: [
      { cond: function (s) { return (s.attributes.art || 0) >= 75; }, text: '当《Thriller》的黑胶转起来，我听见全世界屏住了呼吸。这一刻，我确信音乐能打败孤独。' },
      { cond: function (s) { return (s.attributes.stress || 0) >= 55; }, text: '名声像涨潮，我忙着不被冲走。偶尔想起盖瑞，才想起自己为什么开始唱。' },
      { text: '镁光灯很暖，也很烫。我在世界之巅学着想：接下来，要留下什么？' }
    ],
    3: [
      { cond: function (s) { return (s.meta.phil || 0) >= 2; }, text: '我建起乐园、办起基金会，只想把光分一点给够不着灯的孩子。' },
      { cond: function (s) { return (s.meta.recluse || 0) >= 1; }, text: '我一点点退向高墙里。外界的议论越响，我越想安静。' },
      { text: '掌声和流言同时涌来。我在法庭与舞台之间，学着不让任何人替我写结局。' }
    ],
    4: [
      { cond: function (s) { return s.debt === true; }, text: '账单像雪片。我告诉自己：活下来，有时比完美落幕更需要勇气。' },
      { cond: function (s) { return (s.attributes.health || 0) >= 60 && (s.attributes.reputation || 0) >= 60; }, text: '镜前的舞步慢了，可那双手套还在闪光。这一程，我不亏欠舞台。' },
      { text: '2009 年的夏天，很多事要落幕了。我合上谱子，听见最初的那个盖瑞孩子在鼓掌。' }
    ]
  };

  // M4 命运回响 / 因果回调模板：按 flag 生成跨章因果回响（引擎收集所有命中项，去重）
  C.echoTemplates = [
    { cond: function (s) { return s.flags.isSolo === true; }, text: '命运回响：当年迈出单飞那一步，让你与兄弟渐行渐远，却也握住了自己的方向盘。' },
    { cond: function (s) { return s.flags.isPepsiBurned === true; }, text: '命运回响：84 年百事舞台的那场火，至今仍在肩头留着隐约的疤。' },
    { cond: function (s) { return s.flags.painkillerDependent === true; }, text: '命运回响：从那场烧伤的镇痛起，药物悄悄成了你离不开的拐杖。' },
    { cond: function (s) { return s.flags.marriedLisa === true || s.flags.marriedDebbie === true; }, text: '命运回响：你曾向镜头前的人交付过真心，婚姻的余温是暖，也是软肋。' },
    { cond: function (s) { return s.flags.blanketBorn === true || s.flags.surrogacy === true; }, text: '命运回响：孩子降生的啼哭，是这喧嚣人间里你最想守护的安静。' },
    { cond: function (s) { return (s.meta.phil || 0) >= 3; }, text: '命运回响：早年种下的善，如今长成了 Heal the World 的森林。' },
    { cond: function (s) { return (s.meta.recluse || 0) >= 2; }, text: '命运回响：你一次次退回静默，喧嚣终于关在了门外。' }
  ];

  // M1 关系相关成就（ACH_BROTHERLY / ACH_IDOL）已并入上方 C.achievements 数组。

  MJ.config = C;
})();
