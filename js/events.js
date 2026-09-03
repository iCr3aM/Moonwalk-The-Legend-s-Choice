/* events.js — 事件数据（数据驱动，对齐 GDD v0.6 第六章 6.4 节点目录）
 * 事件对象字段：
 *   id, year, title, kind: 'choice'|'auto'|'ending'
 *   cond(s)        可选：门控条件；false 时跳到 fallback
 *   fallback       可选：cond 失败时的跳转 id
 *   text(s)        返回展示文本（支持按状态分支）
 *   options        选项数组；可为函数 s => [...]（用于按状态切换选项）
 *                  每项：{ label, hint, effects, flags, next }
 *   effects        属性/元路线/金钱变化：{ health, reputation, wealth, family, art, stress,
 *                                          phil, mogul, recluse, artPath, money }
 *                  money 走 Economy（万元），不污染 0–100 属性
 *   flags          写入的标志
 *   next           自动事件的跳转 / 变体事件的 __RETURN__
 * 变体事件：追加 variant:true, window:[y1,y2], weight(0-100)
 */
window.MJ = window.MJ || {};
(function () {
  'use strict';

  var E = {};

  E.start = {
    id: 'start', year: 1958, title: '诞生', kind: 'auto',
    text: function () { return '1958 年 8 月 29 日，你出生于印第安纳州盖瑞市，是家中第 7 个孩子。\n在工厂城市的喧嚣里，音乐将成为你一生的注脚。'; },
    effects: { family: 5 }, next: '1_0'
  };

  E['1_0'] = {
    id: '1_0', year: 1964, title: '加入 Jackson 5', kind: 'choice',
    text: function () { return '兄长们组建的“Jackson 5”需要你。舞台灯光第一次为你亮起。'; },
    options: [
      { label: 'A：全力投入舞台', hint: '艺术+10，家庭+5，压力+5', effects: { art: 10, family: 5, stress: 5 }, next: '1_1' },
      { label: 'B：守在后方', hint: '家庭+10', effects: { family: 10 }, next: '1_1' },
      { label: 'C：逃避童星压力', hint: '压力-5，家庭-5', effects: { stress: -5, family: -5 }, next: '1_1' }
    ]
  };

  E['1_1'] = {
    id: '1_1', year: 1963, title: '五岁显露才华', kind: 'choice',
    text: function () { return '父亲以严苛的方式训练你。天赋与压力一同降临。'; },
    options: [
      { label: 'A：全力训练', hint: '艺术+15，家庭-10，压力+15', effects: { art: 15, family: -10, stress: 15 }, next: '1_2' },
      { label: 'B：适度练习', hint: '艺术+5，家庭+5，压力+5', effects: { art: 5, family: 5, stress: 5 }, next: '1_2' },
      { label: 'C：抗拒严苛训练', hint: '家庭-5，压力-10', effects: { family: -5, stress: -10 }, next: '1_2' }
    ]
  };

  E['1_2'] = {
    id: '1_2', year: 1968, title: '签约 Steeltown', kind: 'choice',
    text: function () { return '一家小唱片公司向你抛出橄榄枝。'; },
    options: [
      { label: 'A：抓住机会', hint: '艺术+10，声誉+10，压力+10', effects: { art: 10, reputation: 10, stress: 10 }, next: '1_2b' },
      { label: 'B：谨慎观望', hint: '艺术+5，家庭+5', effects: { art: 5, family: 5 }, next: '1_2b' }
    ]
  };

  E['1_2b'] = {
    id: '1_2b', year: 1969, title: 'Ed Sullivan 秀', kind: 'choice',
    text: function () { return '全国直播的舞台。这一刻，将决定外界对你的第一印象。'; },
    options: [
      { label: 'A：惊艳全国', hint: '声誉+15，艺术+5，压力+10', effects: { reputation: 15, art: 5, stress: 10 }, next: '1_3' },
      { label: 'B：平稳表现', hint: '声誉+8', effects: { reputation: 8 }, next: '1_3' },
      { label: 'C：紧张失误', hint: '声誉-5，压力+5', effects: { reputation: -5, stress: 5 }, next: '1_3' }
    ]
  };

  E['1_3'] = {
    id: '1_3', year: 1969, title: 'Motown 与 Diana Ross', kind: 'choice',
    text: function () { return 'Motown 向你招手，Diana Ross 亲自引荐。更大的舞台在召唤——但代价是与家人分离。'; },
    options: [
      { label: 'A：迁往洛杉矶追梦', hint: '声誉+15，财富+10，家庭-5，压力+15', effects: { reputation: 15, wealth: 10, family: -5, stress: 15 }, next: '1_4' },
      { label: 'B：留在盖瑞，平凡一生', hint: '走向「平凡人生」结局', effects: {}, next: 'END_PLAIN' }
    ]
  };

  E['1_4'] = {
    id: '1_4', year: 1970, title: '四首单曲登顶', kind: 'auto',
    text: function () { return '连续四首单曲登上排行榜冠军，少年巨星的光芒无可阻挡。'; },
    effects: { reputation: 15, wealth: 15, art: 10, stress: 10 }, next: '1_5'
  };

  E['1_5'] = {
    id: '1_5', year: 1971, title: '是否单飞', kind: 'choice',
    text: function () { return '经纪公司建议你开启个人事业。单飞意味着自由，也意味着与兄弟渐行渐远。'; },
    options: [
      { label: 'A：单飞', hint: '艺术+20，财富+15，家庭-15，压力+15', effects: { art: 20, wealth: 15, family: -15, stress: 15 }, flags: { isSolo: true }, next: '1_6' },
      { label: 'B：留在兄弟组合', hint: '家庭+20，艺术+5，财富+5', effects: { family: 20, art: 5, wealth: 5 }, flags: { isSolo: false }, next: '2_1' },
      { label: 'C：半单飞兼顾', hint: '艺术+10，家庭+10，财富+5', effects: { art: 10, family: 10, wealth: 5 }, flags: { isSolo: false }, next: '2_1' }
    ]
  };

  E['1_6'] = {
    id: '1_6', year: 1972, title: '早期个人专辑', kind: 'choice',
    cond: function (s) { return s.flags.isSolo === true; }, fallback: '2_1',
    text: function () { return '你着手录制个人专辑，探索属于自己的声音。'; },
    options: [
      { label: 'A：全力打磨', hint: '艺术+15，财富+10，家庭-5', effects: { art: 15, wealth: 10, family: -5 }, flags: { soloAlbum1972: true }, next: '2_1' },
      { label: 'B：轻松对待', hint: '家庭+5，艺术+5', effects: { family: 5, art: 5 }, flags: { soloAlbum1972: false }, next: '2_1' }
    ]
  };

  E['1_7'] = {
    id: '1_7', year: 1972, title: '《Ben》奥斯卡提名', kind: 'choice',
    text: function () { return '为电影《Ben》演唱的主题曲获得奥斯卡提名。'; },
    options: [
      { label: 'A：出席颁奖礼', hint: '声誉+5，压力+5', effects: { reputation: 5, stress: 5 }, next: '2_1' },
      { label: 'B：专注录音室', hint: '艺术+5', effects: { art: 5 }, next: '2_1' },
      { label: 'C：携宠物鼠营销', hint: '声誉+5，家庭+5', effects: { reputation: 5, family: 5 }, next: '2_1' }
    ]
  };

  E['1_8'] = {
    id: '1_8', year: 1976, title: '转投 CBS', kind: 'choice',
    text: function () { return '组合转投 CBS 并更名“The Jacksons”，一段新的旅程开启。'; },
    options: [
      { label: 'A：拥抱团体新起点', hint: '家庭+10，艺术+5', effects: { family: 10, art: 5 }, next: '2_1' },
      { label: 'B：借机推个人', hint: '艺术+10，声誉+5', effects: { art: 10, reputation: 5 }, next: '2_1' },
      { label: 'C：与父亲决裂', hint: '家庭-15，压力+10', effects: { family: -15, stress: 10 }, next: '2_1' }
    ]
  };

  E['2_1'] = {
    id: '2_1', year: 1978, title: '《新绿野仙踪》', kind: 'choice',
    text: function (s) { return s.flags.isSolo ? '你参演《新绿野仙踪》，结识昆西·琼斯——未来的黄金搭档。' : '兄弟组合参演电影《新绿野仙踪》，家族事业更进一步。'; },
    options: function (s) {
      if (s.flags.isSolo) {
        return [
          { label: 'A：倾情演出', hint: '艺术+15，声誉+10', effects: { art: 15, reputation: 10 }, next: '2_2' },
          { label: 'B：以家庭为重', hint: '家庭+10', effects: { family: 10 }, next: '2_2' },
          { label: 'C：临时退演保隐私', hint: '家庭+5，压力-5', effects: { family: 5, stress: -5 }, next: '2_2' }
        ];
      }
      return [
        { label: 'A：全心参演', hint: '艺术+10，家庭+5', effects: { art: 10, family: 5 }, next: '2_2' },
        { label: 'B：低调配合', hint: '艺术+5，家庭+10', effects: { art: 5, family: 10 }, next: '2_2' },
        { label: 'C：专注组合', hint: '家庭+15', effects: { family: 15 }, next: '2_2' }
      ];
    }
  };

  E['2_2'] = {
    id: '2_2', year: 1978, title: '鼻部整形', kind: 'choice',
    text: function () { return '你开始关注自己的外貌，并考虑第一次整形手术。'; },
    options: [
      { label: 'A：接受手术', hint: '声誉-5', effects: { reputation: -5 }, next: '2_3' },
      { label: 'B：以健康为重', hint: '健康+10', effects: { health: 10 }, next: '2_3' },
      { label: 'C：多次整形', hint: '声誉-10，健康-5，压力+5', effects: { reputation: -10, health: -5, stress: 5 }, next: '2_3' }
    ]
  };

  E['2_3'] = {
    id: '2_3', year: 1979, title: '《Off The Wall》', kind: 'auto',
    text: function (s) { return s.flags.isSolo ? '《Off The Wall》横空出世，你站上 solo 事业的第一个高峰。' : '组合专辑反响不俗，你在团体中稳步成长。'; },
    effects: function (s) { return s.flags.isSolo ? { art: 20, wealth: 20, reputation: 15 } : { art: 10, wealth: 10, reputation: 5 }; },
    next: '2_4'
  };

  E['2_4'] = {
    id: '2_4', year: 1979, title: '与 Epic 深度合作', kind: 'choice',
    cond: function (s) { return s.flags.isSolo === true; }, fallback: '3_1',
    text: function () { return '厂牌邀你深化合作，掌握更多创作主导权。'; },
    options: [
      { label: 'A：深度绑定', hint: '声誉+10，财富+15', effects: { reputation: 10, wealth: 15 }, flags: { epicDeep: true }, next: '3_1' },
      { label: 'B：保持距离', hint: '家庭+5，压力-10', effects: { family: 5, stress: -10 }, flags: { epicDeep: false }, next: '3_1' },
      { label: 'C：自创厂牌', hint: '艺术+10，财富-10，压力+5', effects: { art: 10, wealth: -10, stress: 5 }, next: '3_1' }
    ]
  };

  E['2_5'] = {
    id: '2_5', year: 1980, title: '格莱美表演', kind: 'choice',
    text: function () { return '格莱美舞台向你敞开。'; },
    options: [
      { label: 'A：炫技独唱', hint: '艺术+10，声誉+5，压力+5', effects: { art: 10, reputation: 5, stress: 5 }, next: '3_1' },
      { label: 'B：稳妥出演', hint: '声誉+5', effects: { reputation: 5 }, next: '3_1' },
      { label: 'C：拒绝独唱', hint: '声誉-3，家庭+3', effects: { reputation: -3, family: 3 }, next: '3_1' }
    ]
  };

  E['3_1'] = {
    id: '3_1', year: 1982, title: '《Thriller》', kind: 'auto',
    text: function (s) { return s.flags.isSolo ? '《Thriller》发行，它将成为史上最畅销的专辑。' : '你在团体中参与这张里程碑专辑的创作。'; },
    effects: function (s) { return s.flags.isSolo ? { art: 30, wealth: 30, reputation: 25, stress: 10 } : { art: 10, wealth: 10, reputation: 5 }; },
    next: '3_1b'
  };

  E['3_1b'] = {
    id: '3_1b', year: 1983, title: 'Motown 25 月球漫步', kind: 'choice',
    text: function () { return '在 Motown 25 周年现场，你准备了一段惊世舞步。'; },
    options: [
      { label: 'A：完美演绎月球漫步', hint: '艺术+15，声誉+15，压力+5', effects: { art: 15, reputation: 15, stress: 5 }, next: '3_1c' },
      { label: 'B：保守演出', hint: '声誉+5，压力-5', effects: { reputation: 5, stress: -5 }, next: '3_1c' },
      { label: 'C：临时改曲避锋芒', hint: '艺术+5，声誉+3', effects: { art: 5, reputation: 3 }, next: '3_1c' }
    ]
  };

  E['3_1c'] = {
    id: '3_1c', year: 1983, title: '《Thriller》MV', kind: 'choice',
    text: function () { return '你计划为《Thriller》拍摄一支开创性的音乐录影带。'; },
    options: [
      { label: 'A：斥资打造长版', hint: '艺术+10，财富-10，声誉+10', effects: { art: 10, wealth: -10, reputation: 10 }, next: '3_2' },
      { label: 'B：传统宣传', hint: '声誉+5', effects: { reputation: 5 }, next: '3_2' },
      { label: 'C：恐怖元素过界引争议', hint: '声誉+5，压力+5，声誉-5', effects: { reputation: 5, stress: 5, reputation: -5 }, next: '3_2' }
    ]
  };

  E['3_2'] = {
    id: '3_2', year: 1984, title: '百事广告', kind: 'choice',
    text: function () { return '百事可乐邀你拍摄广告，片场却发生意外。'; },
    options: [
      { label: 'A：接拍并受伤', hint: '财富+20，声誉+5（触发烧伤线）', effects: { wealth: 20, reputation: 5 }, flags: { isPepsiBurned: true }, next: '3_2b' },
      { label: 'B：安全优先拒拍', hint: '健康+10，财富-20', effects: { health: 10, wealth: -20 }, flags: { isPepsiBurned: false }, next: '3_2b' },
      { label: 'C：议价安全拍摄', hint: '财富+5，健康+5', effects: { wealth: 5, health: 5 }, flags: { isPepsiBurned: false }, next: '3_2b' }
    ]
  };

  E['3_2b'] = {
    id: '3_2b', year: 1984, title: 'Victory 巡演', kind: 'choice',
    text: function () { return '与兄弟们开启 Victory 巡演，这是一次家族 reunion。'; },
    options: [
      { label: 'A：全心投入', hint: '家庭+15，财富+15，压力+10', effects: { family: 15, wealth: 15, stress: 10 }, next: '3_3' },
      { label: 'B：敷衍了事', hint: '家庭+5，财富+5', effects: { family: 5, wealth: 5 }, next: '3_3' },
      { label: 'C：借台推个人', hint: '艺术+10，声誉+5，家庭-5', effects: { art: 10, reputation: 5, family: -5 }, next: '3_3' }
    ]
  };

  E['3_3'] = {
    id: '3_3', year: 1984, title: '格莱美八项', kind: 'auto',
    text: function (s) { return s.flags.isSolo ? '凭《Thriller》独得八项格莱美，史无前例。' : '组合与你共享荣誉之夜。'; },
    effects: function (s) { return s.flags.isSolo ? { art: 20, reputation: 20 } : { art: 8, reputation: 8 }; },
    next: '3_4'
  };

  E['3_4'] = {
    id: '3_4', year: 1985, title: '烧伤治疗', kind: 'choice',
    cond: function (s) { return s.flags.isPepsiBurned === true; }, fallback: '3_5',
    text: function () { return '片场烧伤仍需治疗，止痛药物开始进入你的生活。'; },
    options: [
      { label: 'A：依赖药物止痛', hint: '健康+10，压力-10（触发依赖）', effects: { health: 10, stress: -10 }, flags: { painkillerDependent: true }, next: '3_5' },
      { label: 'B：硬扛治疗', hint: '健康+5，压力+15', effects: { health: 5, stress: 15 }, flags: { painkillerDependent: false }, next: '3_5' },
      { label: 'C：全面康复疗养', hint: '健康+15，财富-10，压力-5', effects: { health: 15, wealth: -10, stress: -5 }, flags: { painkillerDependent: false }, next: '3_5' }
    ]
  };

  E['3_5'] = {
    id: '3_5', year: 1985, title: 'We Are The World', kind: 'choice',
    text: function () { return '群星集结录制《We Are The World》，为非洲募款。'; },
    options: [
      { label: 'A：积极义唱', hint: '声誉+15，家庭+5，慈善+1', effects: { reputation: 15, family: 5, phil: 1 }, flags: { weAreTheWorld: true }, next: '3_6' },
      { label: 'B：婉拒', hint: '艺术+5', effects: { art: 5 }, next: '3_6' },
      { label: 'C：独自捐巨款', hint: '声誉+10，财富-15，慈善+1', effects: { reputation: 10, wealth: -15, phil: 1 }, next: '3_6' }
    ]
  };

  E['3_6'] = {
    id: '3_6', year: 1985, title: '收购 ATV 版权', kind: 'choice',
    cond: function (s) { return s.flags.isSolo === true; }, fallback: '4_0',
    text: function () { return '你有机会买下包含披头士作品的 ATV 版权目录。'; },
    options: [
      { label: 'A：全资收购', hint: '财富-15，声誉+10，商业+1（金钱-4750万）', effects: { wealth: -15, reputation: 10, mogul: 1 }, flags: { atvBought: true }, moneyEffect: -4750, next: '4_0' },
      { label: 'B：暂不收购', hint: '财富+5', effects: { wealth: 5 }, flags: { atvBought: false }, next: '4_0' },
      { label: 'C：联合财团分期', hint: '财富-5，声誉+5，商业+1', effects: { wealth: -5, reputation: 5, mogul: 1 }, next: '4_0' }
    ]
  };

  E['4_0'] = {
    id: '4_0', year: 1986, title: '《Captain EO》', kind: 'choice',
    text: function () { return '迪士尼邀你主演 3D 短片《Captain EO》。'; },
    options: [
      { label: 'A：接拍', hint: '艺术+10，声誉+5', effects: { art: 10, reputation: 5 }, flags: { captainEO: true }, next: '4_1' },
      { label: 'B：专注音乐', hint: '艺术+5', effects: { art: 5 }, next: '4_1' },
      { label: 'C：索要天价片酬', hint: '财富+10，声誉-3', effects: { wealth: 10, reputation: -3 }, next: '4_1' }
    ]
  };

  E['4_1'] = {
    id: '4_1', year: 1987, title: '梦幻庄园', kind: 'choice',
    text: function () { return '你购入加州庄园“Neverland”，一个属于童真的乌托邦。'; },
    options: [
      { label: 'A：对公众开放', hint: '家庭+20，财富-30', effects: { family: 20, wealth: -30 }, flags: { neverlandType: 'public' }, next: '4_2' },
      { label: 'B：私人所有', hint: '财富-20，家庭+5', effects: { wealth: -20, family: 5 }, flags: { neverlandType: 'private' }, next: '4_2' },
      { label: 'C：不购置', hint: '财富+10', effects: { wealth: 10 }, flags: { neverlandType: 'none' }, next: '4_2' }
    ]
  };

  E['4_2'] = {
    id: '4_2', year: 1987, title: '《Bad》', kind: 'auto',
    text: function (s) { return s.flags.isSolo ? '《Bad》与空前规模的巡演接踵而至。' : '组合新专辑延续热度。'; },
    effects: function (s) { return s.flags.isSolo ? { art: 15, wealth: 20, reputation: 10, stress: 15 } : { art: 10, wealth: 15, reputation: 5, stress: 10 }; },
    next: '4_2b'
  };

  E['4_2b'] = {
    id: '4_2b', year: 1988, title: '《Moonwalker》', kind: 'choice',
    text: function () { return '你筹备电影《Moonwalker》与经典曲《Smooth Criminal》。'; },
    options: [
      { label: 'A：电影化呈现', hint: '艺术+12，声誉+8，压力+5', effects: { art: 12, reputation: 8, stress: 5 }, flags: { moonwalker: true }, next: '4_3' },
      { label: 'B：仅出单曲', hint: '艺术+8', effects: { art: 8 }, next: '4_3' },
      { label: 'C：与童星搭档引议论', hint: '声誉+5，压力+5', effects: { reputation: 5, stress: 5 }, next: '4_3' }
    ]
  };

  E['4_3'] = {
    id: '4_3', year: 1988, title: '自传《月球漫步》', kind: 'auto',
    text: function () { return '你出版自传《月球漫步》，向公众讲述自己的故事。'; },
    effects: { reputation: 10, wealth: 5 }, next: '5_1'
  };

  E['5_1'] = {
    id: '5_1', year: 1991, title: '《Dangerous》', kind: 'auto',
    text: function (s) { return s.flags.isSolo ? '《Dangerous》延续商业与艺术的巅峰。' : '组合新专辑稳步前行。'; },
    effects: function (s) { return s.flags.isSolo ? { art: 15, wealth: 15, reputation: 5 } : { art: 8, wealth: 10, reputation: 3 }; },
    next: '5_1b'
  };

  E['5_1b'] = {
    id: '5_1b', year: 1991, title: '《Black or White》', kind: 'choice',
    text: function () { return '新单曲《Black or White》MV 引发讨论。'; },
    options: [
      { label: 'A：挑衅意象', hint: '声誉+5，压力+5', effects: { reputation: 5, stress: 5 }, next: '5_2' },
      { label: 'B：温和表达', hint: '声誉+5', effects: { reputation: 5 }, next: '5_2' },
      { label: 'C：末段争议动作', hint: '声誉-5，压力+5', effects: { reputation: -5, stress: 5 }, next: '5_2' }
    ]
  };

  E['5_2'] = {
    id: '5_2', year: 1992, title: '危险之旅巡演', kind: 'auto',
    text: function () { return '“危险之旅”全球巡演拉开帷幕，规模空前。'; },
    effects: { wealth: 25, stress: 20 }, next: '5_2b'
  };

  E['5_2b'] = {
    id: '5_2b', year: 1992, title: 'Heal the World 基金会', kind: 'choice',
    text: function () { return '你创立 Heal the World 基金会，投身公益。'; },
    options: [
      { label: 'A：全心投入', hint: '声誉+15，家庭+5，压力+5，慈善+1', effects: { reputation: 15, family: 5, stress: 5, phil: 1 }, flags: { healWorld: true }, next: '5_2c' },
      { label: 'B：名义参与', hint: '声誉+5', effects: { reputation: 5 }, next: '5_2c' },
      { label: 'C：高调营销慈善', hint: '声誉+10，压力+5，慈善+1', effects: { reputation: 10, stress: 5, phil: 1 }, next: '5_2c' }
    ]
  };

  E['5_2c'] = {
    id: '5_2c', year: 1993, title: '超级碗中场秀', kind: 'choice',
    text: function () { return '你在超级碗的中场秀上面对上亿观众。'; },
    options: [
      { label: 'A：盛大演出', hint: '艺术+10，声誉+15', effects: { art: 10, reputation: 15 }, next: '5_2d' },
      { label: 'B：低调呈现', hint: '声誉+5', effects: { reputation: 5 }, next: '5_2d' },
      { label: 'C：邀请童合唱团', hint: '声誉+10，家庭+5', effects: { reputation: 10, family: 5 }, next: '5_2d' }
    ]
  };

  E['5_2d'] = {
    id: '5_2d', year: 1993, title: 'Oprah 访谈', kind: 'choice',
    text: function () { return 'Oprah 邀你做一场面向九千万观众的访谈。'; },
    options: [
      { label: 'A：坦诚谈白癜风与童年', hint: '声誉+20，压力+10', effects: { reputation: 20, stress: 10 }, flags: { oprahOpen: true }, next: '5_3' },
      { label: 'B：回避敏感话题', hint: '声誉+5，压力+5', effects: { reputation: 5, stress: 5 }, next: '5_3' },
      { label: 'C：拒访保持神秘', hint: '声誉-3，压力-5，隐士+1', effects: { reputation: -3, stress: -5, recluse: 1 }, next: '5_3' }
    ]
  };

  E['5_3'] = {
    id: '5_3', year: 1993, title: '1993 年民事指控', kind: 'choice',
    cond: function (s) { return s.flags.isSolo === true && s.flags.neverlandType !== 'none'; }, fallback: '5_5',
    text: function (s) {
      if (s.flags.isSolo === true && s.flags.neverlandType !== 'none') {
        return '1993 年，一名少年家属对你提出民事指控。警方搜查了你的住所。\n你将如何应对？';
      }
      return '你未购置庄园且始终与兄弟并肩，相关民事指控未曾发生。';
    },
    options: [
      { label: 'A：达成庭外和解', hint: '金钱-2300万，声誉-20，压力+20', effects: { reputation: -20, stress: 20 }, moneyEffect: -2300, flags: { settlement1993: true }, next: '5_4' },
      { label: 'B：应诉到底', hint: '压力+30', effects: { stress: 30 }, flags: { settlement1993: false }, next: '5_4' },
      { label: 'C：配合调查', hint: '声誉-10，压力+25', effects: { reputation: -10, stress: 25 }, flags: { settlement1993: false }, next: '5_4' }
    ]
  };

  E['5_4'] = {
    id: '5_4', year: 1993, title: '药物依赖公开', kind: 'auto',
    cond: function (s) { return s.flags.isPepsiBurned === true && s.flags.painkillerDependent === true; }, fallback: '5_5',
    text: function () { return '长期的止痛药物使用被外界关注，依赖问题逐渐公开。'; },
    effects: { reputation: -15, health: -10, stress: 20 }, next: '5_5'
  };

  E['5_5'] = {
    id: '5_5', year: 1994, title: '与 Lisa Marie 结婚', kind: 'choice',
    text: function () { return '你与 Lisa Marie Presley 步入婚姻。'; },
    options: [
      { label: 'A：全心经营', hint: '家庭+15，声誉+10', effects: { family: 15, reputation: 10 }, flags: { marriedLisa: true }, next: '6_1' },
      { label: 'B：保持距离', hint: '家庭-5', effects: { family: -5 }, flags: { marriedLisa: false }, next: '6_1' },
      { label: 'C：高调世纪婚礼', hint: '声誉+5，财富-10，压力+5', effects: { reputation: 5, wealth: -10, stress: 5 }, next: '6_1' }
    ]
  };

  E['6_1'] = {
    id: '6_1', year: 1995, title: '《HIStory》', kind: 'auto',
    text: function (s) { return s.flags.isSolo ? '双碟专辑《HIStory》问世，回望也向前。' : '组合新作延续旅程。'; },
    effects: function (s) { return s.flags.isSolo ? { art: 10, wealth: 15, reputation: 5 } : { art: 6, wealth: 10, reputation: 3 }; },
    next: '6_1b'
  };

  E['6_1b'] = {
    id: '6_1b', year: 1995, title: '索尼合并', kind: 'choice',
    cond: function (s) { return s.flags.isSolo === true && s.flags.epicDeep === true; }, fallback: '6_1c',
    text: function () { return '你可将 ATV 版权与索尼合并，构建版权版图。'; },
    options: [
      { label: 'A：合并 Sony/ATV', hint: '财富+50，声誉+10，商业+1', effects: { wealth: 50, reputation: 10, mogul: 1 }, flags: { sonyMerge: true }, next: '6_1c' },
      { label: 'B：不合并', hint: '财富-10，家庭+5', effects: { wealth: -10, family: 5 }, flags: { sonyMerge: false }, next: '6_1c' },
      { label: 'C：反收购更多目录', hint: '财富-20，声誉+5，商业+2', effects: { wealth: -20, reputation: 5, mogul: 2 }, next: '6_1c' }
    ]
  };

  E['6_1c'] = {
    id: '6_1c', year: 1995, title: '《Scream》与 Janet', kind: 'choice',
    text: function () { return '你与妹妹 Janet 合作《Scream》，打造昂贵 MV。'; },
    options: [
      { label: 'A：斥巨资拍摄', hint: '艺术+12，声誉+8，压力+10', effects: { art: 12, reputation: 8, stress: 10 }, flags: { scream: true }, next: '6_1d' },
      { label: 'B：简化制作', hint: '艺术+6', effects: { art: 6 }, next: '6_1d' },
      { label: 'C：借势妹妹资源', hint: '家庭+5，艺术+8', effects: { family: 5, art: 8 }, next: '6_1d' }
    ]
  };

  E['6_1d'] = {
    id: '6_1d', year: 1996, title: '《They Don’t Care About Us》', kind: 'choice',
    text: function () { return '单曲引发争议，你面临歌词取舍。'; },
    options: [
      { label: 'A：坚持原词', hint: '声誉-5，艺术+8，压力+5', effects: { reputation: -5, art: 8, stress: 5 }, next: '6_2' },
      { label: 'B：修改平息', hint: '声誉+3', effects: { reputation: 3 }, next: '6_2' },
      { label: 'C：转向《Earth Song》环保', hint: '声誉+10，慈善+1', effects: { reputation: 10, phil: 1 }, flags: { earthSong: true }, next: '6_2' }
    ]
  };

  E['6_2'] = {
    id: '6_2', year: 1996, title: '与黛比·罗结婚', kind: 'choice',
    text: function () { return '你与黛比·罗结婚，组建家庭。'; },
    options: [
      { label: 'A：全心家庭', hint: '家庭+20', effects: { family: 20 }, flags: { marriedDebbie: true }, next: '6_2b' },
      { label: 'B：保持疏离', hint: '家庭-10', effects: { family: -10 }, flags: { marriedDebbie: false }, next: '6_2b' },
      { label: 'C：代孕规划子女', hint: '家庭+5，财富-10', effects: { family: 5, wealth: -10 }, flags: { surrogacy: true }, next: '6_2b' }
    ]
  };

  E['6_2b'] = {
    id: '6_2b', year: 1997, title: '启动《Invincible》', kind: 'choice',
    cond: function (s) { return s.flags.isSolo === true; }, fallback: '6_2c',
    text: function () { return '你筹备新专辑《Invincible》，与厂牌的张力渐起。'; },
    options: [
      { label: 'A：全力制作', hint: '艺术+15，压力+30', effects: { art: 15, stress: 30 }, flags: { invincibleStarted: true }, next: '6_2c' },
      { label: 'B：适度投入', hint: '财富+10，压力-10', effects: { wealth: 10, stress: -10 }, flags: { invincibleStarted: false }, next: '6_2c' },
      { label: 'C：半独立制作', hint: '艺术+8，压力+10', effects: { art: 8, stress: 10 }, next: '6_2c' }
    ]
  };

  E['6_2c'] = {
    id: '6_2c', year: 1997, title: '《Blood on the Dance Floor》', kind: 'choice',
    text: function () { return '你发行混音专辑《Blood on the Dance Floor》。'; },
    options: [
      { label: 'A：正式发行', hint: '艺术+8，财富+10', effects: { art: 8, wealth: 10 }, flags: { bloodDance: true }, next: '6_2d' },
      { label: 'B：搁置', hint: '艺术+3', effects: { art: 3 }, next: '6_2d' },
      { label: 'C：混音实验', hint: '艺术+5，声誉+3', effects: { art: 5, reputation: 3 }, next: '6_2d' }
    ]
  };

  E['6_2d'] = {
    id: '6_2d', year: 1997, title: '《Ghosts》短片', kind: 'choice',
    cond: function (s) { return s.flags.isSolo === true; }, fallback: '6_2e',
    text: function () { return '你执导长篇短片《Ghosts》，释放艺术表达。'; },
    options: [
      { label: 'A：长片呈现', hint: '艺术+10，声誉+5，压力+10，艺术家+1', effects: { art: 10, reputation: 5, stress: 10, artPath: 1 }, flags: { ghosts: true }, next: '6_2e' },
      { label: 'B：放弃', hint: '艺术+3', effects: { art: 3 }, next: '6_2e' }
    ]
  };

  E['6_2e'] = {
    id: '6_2e', year: 1999, title: '慈善演唱会', kind: 'choice',
    text: function () { return '你在德国与韩国举办“Michael Jackson & Friends”慈善演唱会。'; },
    options: [
      { label: 'A：全力投入', hint: '声誉+10，家庭+5，财富-10，慈善+1', effects: { reputation: 10, family: 5, wealth: -10, phil: 1 }, flags: { charity99: true }, next: '6_3' },
      { label: 'B：小额参与', hint: '声誉+3', effects: { reputation: 3 }, next: '6_3' },
      { label: 'C：联手政要募款', hint: '声誉+8，慈善+1', effects: { reputation: 8, phil: 1 }, next: '6_3' }
    ]
  };

  E['6_3'] = {
    id: '6_3', year: 1999, title: '与黛比离婚', kind: 'auto',
    cond: function (s) { return s.flags.marriedDebbie === true; }, fallback: '6_3b',
    text: function () { return '你与黛比·罗的婚姻走到尽头。'; },
    effects: { family: -10 }, next: '6_3b'
  };

  E['6_3b'] = {
    id: '6_3b', year: 2001, title: '《Invincible》与 30 周年', kind: 'choice',
    text: function () { return '新专辑《Invincible》与出道 30 周年演唱会接踵而至。'; },
    options: [
      { label: 'A：盛大纪念', hint: '艺术+12，声誉+10，压力+10', effects: { art: 12, reputation: 10, stress: 10 }, flags: { anniv2001: true }, next: '6_4' },
      { label: 'B：低调处理', hint: '声誉+3', effects: { reputation: 3 }, next: '6_4' },
      { label: 'C：提携后辈', hint: '艺术+8，家庭+5', effects: { art: 8, family: 5 }, flags: { collab: true }, next: '6_4' }
    ]
  };

  E['6_4'] = {
    id: '6_4', year: 2002, title: '第二次刑事指控', kind: 'choice',
    cond: function (s) { return s.flags.isSolo === true && s.flags.neverlandType !== 'none'; }, fallback: '7_1',
    text: function (s) {
      if (s.flags.isSolo === true && s.flags.neverlandType !== 'none') {
        var extra = s.flags.settlement1993 ? ' 由于 1993 年已达成庭外和解，这次指控受到更多公众关注。' : '';
        return '2002 年，你再次面临刑事指控。' + extra + '\n你将如何应对？';
      }
      return '你未购置庄园或始终在兄弟保护下，相关刑事指控未曾出现。';
    },
    options: [
      { label: 'A：应诉到底', hint: '金钱-1000万，压力+30，最终裁定无罪', effects: { stress: 30 }, moneyEffect: -1000, flags: { secondCharge: true, secondVerdict: 'not_guilty' }, next: '6_5' },
      { label: 'B：达成和解', hint: '金钱-2000万，声誉-30', effects: { reputation: -30 }, moneyEffect: -2000, flags: { secondCharge: true, secondVerdict: 'settled' }, next: '7_1' },
      { label: 'C：透明坚持', hint: '压力+20', effects: { stress: 20 }, flags: { secondCharge: true }, next: '6_5' }
    ]
  };

  E['6_4b'] = {
    id: '6_4b', year: 2002, title: 'Blanket 出生', kind: 'choice',
    text: function () { return '你的第三个孩子 Blanket 出生。'; },
    options: [
      { label: 'A：全心陪伴', hint: '家庭+15，压力+5', effects: { family: 15, stress: 5 }, flags: { blanketBorn: true }, next: '6_4c' },
      { label: 'B：暂缓公众曝光', hint: '家庭+5', effects: { family: 5 }, next: '6_4c' },
      { label: 'C：高调展示家庭', hint: '声誉+5，家庭+10，隐士-1', effects: { reputation: 5, family: 10, recluse: -1 }, next: '6_4c' }
    ]
  };

  E['6_4c'] = {
    id: '6_4c', year: 2002, title: '柏林坠婴', kind: 'choice',
    text: function () { return '在柏林阳台，你曾将孩子探出窗外的画面被媒体捕捉。'; },
    options: [
      { label: 'A：公开致歉', hint: '声誉-10，压力+10', effects: { reputation: -10, stress: 10 }, flags: { babyDangle: true }, next: '6_4d' },
      { label: 'B：保持沉默', hint: '声誉-5，压力+5', effects: { reputation: -5, stress: 5 }, next: '6_4d' },
      { label: 'C：反诉媒体', hint: '声誉-3，压力+5，隐士+1', effects: { reputation: -3, stress: 5, recluse: 1 }, next: '6_4d' }
    ]
  };

  E['6_4d'] = {
    id: '6_4d', year: 2003, title: 'Bashir 纪录片', kind: 'choice',
    text: function () { return 'Bashir 的纪录片播出，将你的私人生活推上风口浪尖。'; },
    options: [
      { label: 'A：坦然面对', hint: '声誉-5，压力+10', effects: { reputation: -5, stress: 10 }, flags: { bashirDoc: true }, next: '6_4e' },
      { label: 'B：拒拍保持距离', hint: '压力+5，隐士+1', effects: { stress: 5, recluse: 1 }, next: '6_4e' },
      { label: 'C：起诉记者', hint: '声誉+3，压力+15', effects: { reputation: 3, stress: 15 }, next: '6_4e' }
    ]
  };

  E['6_4e'] = {
    id: '6_4e', year: 2003, title: '2003 年逮捕程序', kind: 'choice',
    cond: function (s) { return s.flags.secondCharge === true; }, fallback: '6_5',
    text: function () { return '围绕刑事指控，你经历了逮捕与保释程序。'; },
    options: [
      { label: 'A：配合保释', hint: '压力+20，声誉-5', effects: { stress: 20, reputation: -5 }, next: '6_5' },
      { label: 'B：隐居避世', hint: '压力-5，隐士+1', effects: { stress: -5, recluse: 1 }, next: '6_5' },
      { label: 'C：公开回应', hint: '声誉-3，压力+10', effects: { reputation: -3, stress: 10 }, next: '6_5' }
    ]
  };

  E['6_5'] = {
    id: '6_5', year: 2005, title: '2005 年庭审结果', kind: 'auto',
    cond: function (s) { return s.flags.secondCharge === true; }, fallback: '7_0',
    text: function (s) {
      if (s.flags.secondVerdict === 'not_guilty') return '2005 年，所有指控均被裁定不成立。你的声誉回升。';
      if (s.flags.secondVerdict === 'settled') return '达成庭外和解，虽快速解决，但公众形象受损。';
      return '经过庭审，事件暂告段落。';
    },
    effects: function (s) {
      if (s.flags.secondVerdict === 'not_guilty') return { reputation: 10, stress: -20 };
      if (s.flags.secondVerdict === 'settled') return { reputation: -30 };
      return {};
    },
    next: '7_0'
  };

  E['7_0'] = {
    id: '7_0', year: 2008, title: '《Thriller 25》', kind: 'choice',
    cond: function (s) { return s.flags.isSolo === true; }, fallback: '7_1',
    text: function () { return '《Thriller 25》周年纪念专辑与格莱美亮相。'; },
    options: [
      { label: 'A：盛大回归', hint: '艺术+10，声誉+10，艺术家+1', effects: { art: 10, reputation: 10, artPath: 1 }, flags: { thriller25: true }, next: '7_1' },
      { label: 'B：释出混音', hint: '艺术+5，声誉+5', effects: { art: 5, reputation: 5 }, next: '7_1' },
      { label: 'C：婉拒亮相', hint: '声誉-3，隐士+1', effects: { reputation: -3, recluse: 1 }, next: '7_1' }
    ]
  };

  E['7_1'] = {
    id: '7_1', year: 2006, title: '债务危机', kind: 'choice',
    cond: function (s) { return s.flags.neverlandType !== 'none'; }, fallback: '7_2',
    text: function () { return '梦幻庄园的巨额开销引发债务危机，Colony Capital 伸出援手。'; },
    options: [
      { label: 'A：转让部分权益', hint: '财富-50，家庭-15', effects: { wealth: -50, family: -15 }, flags: { debtCrisis: true }, next: '7_2' },
      { label: 'B：保留但硬撑', hint: '财富-100，压力+10', effects: { wealth: -100, stress: 10 }, flags: { debtCrisis: false }, next: '7_2' },
      { label: 'C：引入注资', hint: '财富-20，压力-5', effects: { wealth: -20, stress: -5 }, next: '7_2' }
    ]
  };

  E['7_2'] = {
    id: '7_2', year: 2009, title: 'This Is It', kind: 'choice',
    text: function (s) { return '你宣布《This Is It》系列演唱会，为回归而战。'; },
    options: function (s) {
      if (s.flags.isSolo) {
        return [
          { label: 'A：50 场 full', hint: '财富+100，压力+40（标记 full/held）', effects: { wealth: 100, stress: 40 }, flags: { thisItHeld: true, thisItFull: true }, next: '7_3' },
          { label: 'B：取消演唱会', hint: '健康+20，声誉-10（标记 取消）', effects: { health: 20, reputation: -10 }, flags: { thisItHeld: false }, next: '7_3' },
          { label: 'C：缩减 20 场', hint: '财富+40，压力+20，健康+10（标记 reduced/held）', effects: { wealth: 40, stress: 20, health: 10 }, flags: { thisItHeld: true, thisItReduced: true }, next: '7_3' }
        ];
      }
      return [
        { label: 'A：20 场团体', hint: '财富+40，压力+20，健康+5', effects: { wealth: 40, stress: 20, health: 5 }, flags: { thisItHeld: true, thisItFull: false }, next: '7_3' },
        { label: 'B：取消退休巡演', hint: '健康+20，财富-30', effects: { health: 20, wealth: -30 }, flags: { thisItHeld: false }, next: '7_3' }
      ];
    }
  };

  E['7_3'] = {
    id: '7_3', year: 2009, title: '命运裁决', kind: 'ending',
    text: function () { return '2009 年 6 月 25 日，聚光灯熄灭。回望一生，你的每一个选择，写就了独一无二的传奇。'; },
    next: null
  };

  // ---------- 变体事件（GDD 5.6 可能性系统） ----------
  // 由引擎在章节切换时按概率插入，保证重复游玩性。
  E.V_OFFER = {
    id: 'V_OFFER', variant: true, window: [1985, 1990], weight: 50,
    title: '神秘代言邀约', kind: 'choice',
    text: function () { return '某品牌开出天价代言邀约，条件是高强度的曝光。'; },
    options: [
      { label: 'A：接受代言', hint: '财富+，声誉±', effects: { wealth: 15, reputation: 5 }, next: '__RETURN__' },
      { label: 'B：婉拒', hint: '艺术+3', effects: { art: 3 }, next: '__RETURN__' }
    ]
  };
  E.V_SCARE = {
    id: 'V_SCARE', variant: true, window: [1970, 2009], weight: 30,
    title: '健康惊吓', kind: 'choice',
    text: function () { return '一次突发的不适让你短暂晕倒，身体发出警告。'; },
    options: [
      { label: 'A：立即休养', hint: '健康+，压力-', effects: { health: 8, stress: -5 }, next: '__RETURN__' },
      { label: 'B：咬牙坚持', hint: '压力+', effects: { stress: 8 }, next: '__RETURN__' }
    ]
  };
  E.V_PAPARAZZI = {
    id: 'V_PAPARAZZI', variant: true, window: [1990, 2005], weight: 40,
    title: '狗仔围堵', kind: 'choice',
    text: function () { return '狗仔与私生饭的围堵让你的私生活无处遁形。'; },
    options: [
      { label: 'A：礼貌回避', hint: '声誉+，压力+', effects: { reputation: 3, stress: 5 }, next: '__RETURN__' },
      { label: 'B：强硬回击', hint: '声誉-，压力+', effects: { reputation: -3, stress: 8 }, next: '__RETURN__' }
    ]
  };
  E.V_RUMOR = {
    id: 'V_RUMOR', variant: true, window: [1993, 2003], weight: 35,
    title: '媒体谣言', kind: 'choice',
    text: function () { return '一波未经证实的谣言在媒体上发酵。'; },
    options: [
      { label: 'A：冷处理', hint: '声誉-', effects: { reputation: -3 }, next: '__RETURN__' },
      { label: 'B：主动澄清', hint: '声誉+，压力+', effects: { reputation: 3, stress: 5 }, next: '__RETURN__' }
    ]
  };
  E.V_COLLAB = {
    id: 'V_COLLAB', variant: true, window: [1995, 2005], weight: 35,
    title: '后辈求合作', kind: 'choice',
    text: function () { return '当红后辈歌手登门，希望与你合作一曲。'; },
    options: [
      { label: 'A：欣然合作', hint: '艺术+，家庭+', effects: { art: 8, family: 5 }, next: '__RETURN__' },
      { label: 'B：婉拒', hint: '艺术+3', effects: { art: 3 }, next: '__RETURN__' }
    ]
  };

  E.V_ASIA = {
    id: 'V_ASIA', variant: true, window: [1987, 2009], weight: 35,
    title: '亚洲巡演邀约', kind: 'choice',
    text: function () { return '亚洲多座城市抛出巡演邀约，市场潜力巨大，但排期紧凑。'; },
    options: [
      { label: 'A：接下亚洲巡演', hint: '财富+，压力+', effects: { wealth: 20, stress: 10 }, next: '__RETURN__' },
      { label: 'B：婉拒，专注录音室', hint: '艺术+', effects: { art: 8 }, next: '__RETURN__' }
    ]
  };

  E.V_CHARITY = {
    id: 'V_CHARITY', variant: true, window: [1993, 2005], weight: 30,
    cond: function (s) { return s.flags.healWorld === true; },
    title: '全球儿童慈善义演', kind: 'choice',
    text: function () { return '基于你创立的公益基金会，主办方提议举办一场跨国的儿童慈善义演。'; },
    options: [
      { label: 'A：全力筹办', hint: '声誉+，家庭+，压力+，慈善+1', effects: { reputation: 12, family: 5, stress: 8, phil: 1 }, next: '__RETURN__' },
      { label: 'B：仅名义支持', hint: '声誉+', effects: { reputation: 5 }, next: '__RETURN__' }
    ]
  };

  MJ.EVENTS = E;
})();
