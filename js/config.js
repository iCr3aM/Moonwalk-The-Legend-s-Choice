/* config.js — 全局配置：初始属性、标志、元路线、结局定义
 * 严格对齐 GDD v0.6：属性 0–100、隐藏元路线计数、12 种结局。
 */
window.MJ = window.MJ || {};
(function () {
  'use strict';

  var C = {};

  // 六维属性初值（GDD 5.2）
  C.initialAttributes = {
    health: 70,
    reputation: 50,
    wealth: 13,
    family: 60,
    art: 30,
    stress: 20
  };

  // 财富属性（0–100）由净资产推导：wealth = clamp(round(netWorth / wealthScale), 0, 100)
  // wealthScale = 150（万 / 财富点）。真实 MJ 在 80–90 年代净资产已达数亿至十数亿美元，
  // 故净资产以“万”为单位时可达数万，使「财富」与「显示的净资产」始终一致且符合史实量级。
  C.wealthScale = 150;

  // 净资产初值（单位：万）。走 Economy 子系统，与财富属性联动（不再各自为政）。
  C.initialNetWorth = 2000;

  // 标志（flag）初值：多数在游玩中写入；此处仅占位
  C.initialFlags = {};

  // 元路线隐藏计数（非负整数）
  C.initialMeta = { phil: 0, mogul: 0, recluse: 0, artPath: 0 };

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
    stress: '压力'
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
    }
  };

  // 成就系统（GDD §17：慈善家/巡演王/法律斗士/隐士 等；复用图鉴式 localStorage 持久化）
  // check(state, ctx) 中 ctx = { ending?: 结局id }；返回 true 即解锁。
  C.achievements = [
    { id: 'ACH_PHIL', name: '慈善家', icon: '🕊️', desc: '以善意照亮世界，把公益走成了第二份事业。',
      check: function (s) { return (s.meta.phil || 0) >= 3; } },
    { id: 'ACH_RECLUSE', name: '隐士', icon: '🏔️', desc: '一次次退向静默，把喧嚣关在门外。',
      check: function (s) { return (s.meta.recluse || 0) >= 3; } },
    { id: 'ACH_LEGAL', name: '法律斗士', icon: '⚖️', desc: '风波数度加身，却始终挺直脊背、不卑不亢。',
      check: function (s) { return (s.flags.settlement1993 || s.flags.secondCharge || s.flags.secondVerdict) && (s.attributes.reputation || 0) >= 55; } },
    { id: 'ACH_MOGUL', name: '商业巨擘', icon: '💼', desc: '用远见构筑起属于自己的音乐与版权帝国。',
      check: function (s) { return (s.meta.mogul || 0) >= 2 && !s.debt; } },
    { id: 'ACH_ARTIST', name: '艺术宗师', icon: '🎵', desc: '把一生淬炼成旋律，登临艺术之巅。',
      check: function (s) { return (s.meta.artPath || 0) >= 2 && (s.attributes.art || 0) >= 75; } },
    { id: 'ACH_TOUR', name: '舞台之王', icon: '🌟', desc: '在无数舞台上点燃世界，掌声即是王冠。',
      check: function (s) { return (s.attributes.art || 0) >= 75 && (s.attributes.reputation || 0) >= 75; } },
    { id: 'ACH_ETERNAL', name: '永恒符号', icon: '👑', desc: '艺术与声誉不朽，成为时代的文化图腾。',
      check: function (s, ctx) { return ctx && ctx.ending === 'END_ETERNAL'; } },
    { id: 'ACH_SURVIVOR', name: '绝境求生', icon: '💪', desc: '在债务的阴影里，仍把命握在自己手里。',
      check: function (s, ctx) { return s.debt === true && (ctx && ctx.ending === 'END_SURVIVE_DEBT' || (s.attributes.health || 0) >= 30); } }
  ];

  MJ.config = C;
})();
