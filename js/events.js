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
    text: function () { return '1958 年 8 月 29 日，印第安纳州盖瑞市。炼钢厂的红光彻夜不熄，七口之家的屋檐下，啼哭声划破工业城的喧嚣。\n没人知道，这个在廉价摇篮里挥舞小手的孩子，日后会让全世界的节拍为之停顿。'; },
    effects: { family: 5 }, next: '1_0'
  };

  E['1_0'] = {
    id: '1_0', year: 1964, title: '加入 Jackson 5', kind: 'choice',
    text: function () { return '兄长们琢磨出一个名为“Jackson 5”的组合，只缺一把最亮的声音。排练室的镜子前，他们把话筒递到你手里——舞台的灯，第一次为你而亮。'; },
    options: [
      { label: 'A：把整颗心交给舞台', hint: '艺术精进，手足羁绊更深，但童年的重量提前压上肩头（艺术+10，家庭+5，压力+5）', effects: { art: 10, family: 5, stress: 5 }, next: '1_1' },
      { label: 'B：退到哥哥们身后', hint: '守着家人的温暖，成名的心跳慢了半拍（家庭+10）', effects: { family: 10 }, next: '1_1' },
      { label: 'C：躲开童星的光环', hint: '短暂喘息，却也疏远了手足（压力-5，家庭-5）', effects: { stress: -5, family: -5 }, next: '1_1' }
    ]
  };

  E['1_1'] = {
    id: '1_1', year: 1963, title: '五岁显露才华', kind: 'choice',
    text: function () { return '父亲信奉“铁腕出天才”，夜里的琴房总回荡着节拍器的催促。天赋与苛责一同降临，你想逃，却又舍不得镜子前那个会发光的自己。'; },
    options: [
      { label: 'A：在鞭策中拼命练习', hint: '技艺突飞猛进，却割裂了父子温情，紧绷感与日俱增（艺术+15，家庭-10，压力+15）', effects: { art: 15, family: -10, stress: 15 }, next: '1_2' },
      { label: 'B：找到自己的节奏', hint: '稳步成长，家与心都还安稳（艺术+5，家庭+5，压力+5）', effects: { art: 5, family: 5, stress: 5 }, next: '1_2' },
      { label: 'C：推开那扇琴房门', hint: '反抗换来了片刻轻松，也换来冷战（家庭-5，压力-10）', effects: { family: -5, stress: -10 }, next: '1_2' }
    ]
  };

  E['1_2'] = {
    id: '1_2', year: 1968, title: '签约 Steeltown', kind: 'choice',
    text: function () { return '一家名不见经传的 Steeltown 唱片递来合同，纸页还带着油墨味。这是通往更大世界的船票，还是过早绑定的枷锁？'; },
    options: [
      { label: 'A：抓住这张船票', hint: '曝光与口碑齐升，聚光灯更烫了（艺术+10，声誉+10，压力+10）', effects: { art: 10, reputation: 10, stress: 10 }, next: '1_2b' },
      { label: 'B：再观望一阵', hint: '稳守本心，亲情是避风港（艺术+5，家庭+5）', effects: { art: 5, family: 5 }, next: '1_2b' }
    ]
  };

  E['1_2b'] = {
    id: '1_2b', year: 1969, title: 'Ed Sullivan 秀', kind: 'choice',
    text: function () { return '全国直播的《Ed Sullivan 秀》——上亿双耳朵在这一夜同时竖起。幕布后，你攥紧了话筒，等待命运的第一个注脚。'; },
    options: [
      { label: 'A：用一记惊艳镇住全场', hint: '一夜成名，少年锋芒刺痛了整个时代（声誉+15，艺术+5，压力+10）', effects: { reputation: 15, art: 5, stress: 10 }, next: '1_3' },
      { label: 'B：稳稳唱完这首歌', hint: '得体亮相，留下好感（声誉+8）', effects: { reputation: 8 }, next: '1_3' },
      { label: 'C：紧张到漏了拍', hint: '青涩的瑕疵被镜头放大（声誉-5，压力+5）', effects: { reputation: -5, stress: 5 }, next: '1_3' }
    ]
  };

  E['1_3'] = {
    id: '1_3', year: 1969, title: 'Motown 与 Diana Ross', kind: 'choice',
    text: function () { return 'Motown 向你招手，Diana Ross 亲手为你引路。大舞台在洛杉矶的那头招手——代价，是与盖瑞的家人隔着整片大陆。'; },
    options: [
      { label: 'A：跟着 Diana 奔赴洛杉矶', hint: '声名鹊起、进账可观，但乡愁与疏离渐生（声誉+15，财富+10，家庭-5，压力+15）', effects: { reputation: 15, wealth: 10, family: -5, stress: 15 }, next: '1_4' },
      { label: 'B：留在盖瑞，过平凡一生', hint: '放下巨星梦，走向「平凡人生」结局', effects: {}, next: 'END_PLAIN' }
    ]
  };

  E['1_4'] = {
    id: '1_4', year: 1970, title: '四首单曲登顶', kind: 'auto',
    text: function () { return '连续四首单曲霸占排行榜冠军，电台里全是你的名字。少年巨星的光芒无可阻挡，连影子都被镁光灯拉长。'; },
    effects: { reputation: 15, wealth: 15, art: 10, stress: 10 }, next: '1_5'
  };

  E['1_5'] = {
    id: '1_5', year: 1971, title: '是否单飞', kind: 'choice',
    text: function () { return '经纪公司递来一份个人合约。单飞意味着挣脱兄弟的影子、握住自己的方向盘，也意味着庆功宴上少了几张熟悉的面孔。'; },
    options: [
      { label: 'A：迈出单飞那一步', hint: '艺术与财富飞跃，兄弟情谊却出现裂痕（艺术+20，财富+15，家庭-15，压力+15）', effects: { art: 20, wealth: 15, family: -15, stress: 15 }, flags: { isSolo: true }, next: '1_6' },
      { label: 'B：守在 Jackson 5 里', hint: '亲情稳固，安稳生长（家庭+20，艺术+5，财富+5）', effects: { family: 20, art: 5, wealth: 5 }, flags: { isSolo: false }, next: '2_1' },
      { label: 'C：半只脚踏出门槛', hint: '兼顾两头，温吞却周全（艺术+10，家庭+10，财富+5）', effects: { art: 10, family: 10, wealth: 5 }, flags: { isSolo: false }, next: '2_1' }
    ]
  };

  E['1_6'] = {
    id: '1_6', year: 1972, title: '早期个人专辑', kind: 'choice',
    cond: function (s) { return s.flags.isSolo === true; }, fallback: '2_1',
    text: function () { return '录音室的红灯亮起，你第一次完全为自己的声音做主。母带里藏着的，是“迈克尔·杰克逊”四个字真正独立的宣言。'; },
    options: [
      { label: 'A：反复打磨到完美', hint: '奠定个人风格，钱包与亲情各付代价（艺术+15，财富+10，家庭-5）', effects: { art: 15, wealth: 10, family: -5 }, flags: { soloAlbum1972: true }, next: '2_1' },
      { label: 'B：轻松录完交差', hint: '留更多时间给家人（家庭+5，艺术+5）', effects: { family: 5, art: 5 }, flags: { soloAlbum1972: false }, next: '2_1' }
    ]
  };

  E['1_7'] = {
    id: '1_7', year: 1972, title: '《Ben》奥斯卡提名', kind: 'choice',
    text: function () { return '为电影《Ben》演唱的主题曲意外入围奥斯卡。一只银幕上的小老鼠，竟替你叩响了学院的大门。'; },
    options: [
      { label: 'A：盛装出席颁奖礼', hint: '体面亮相，聚光灯再添热度（声誉+5，压力+5）', effects: { reputation: 5, stress: 5 }, next: '2_1' },
      { label: 'B：闷头泡在录音室', hint: '把荣誉换作下一段旋律（艺术+5）', effects: { art: 5 }, next: '2_1' },
      { label: 'C：借话题度营销', hint: '借势涨粉，也暖了人心（声誉+5，家庭+5）', effects: { reputation: 5, family: 5 }, next: '2_1' }
    ]
  };

  E['1_8'] = {
    id: '1_8', year: 1976, title: '转投 CBS', kind: 'choice',
    text: function () { return '组合转投 CBS，改名“The Jacksons”，旧招牌翻作新序章。路怎么走，每个人心里都打着算盘。'; },
    options: [
      { label: 'A：拥抱团体的新起点', hint: '家和万事兴（家庭+10，艺术+5）', effects: { family: 10, art: 5 }, next: '2_1' },
      { label: 'B：借船出海推自己', hint: '个人声量悄悄上涨（艺术+10，声誉+5）', effects: { art: 10, reputation: 5 }, next: '2_1' },
      { label: 'C：和父亲彻底决裂', hint: '挣脱桎梏，也失了来处（家庭-15，压力+10）', effects: { family: -15, stress: 10 }, next: '2_1' }
    ]
  };

  E['2_1'] = {
    id: '2_1', year: 1978, title: '《新绿野仙踪》', kind: 'choice',
    text: function (s) { return s.flags.isSolo ? '电影《新绿野仙踪》的片场，你遇见了昆西·琼斯——那个日后与你心跳同频的黄金搭档。' : '兄弟组合参演电影《新绿野仙踪》，家族事业又往前挪了一格。'; },
    options: function (s) {
      if (s.flags.isSolo) {
        return [
          { label: 'A：倾尽所有去演', hint: '舞台感与口碑双收（艺术+15，声誉+10）', effects: { art: 15, reputation: 10 }, next: '2_2' },
          { label: 'B：把重心留给家人', hint: '温暖的角落自有分量（家庭+10）', effects: { family: 10 }, next: '2_2' },
          { label: 'C：临时退演护隐私', hint: '避开窥探，留住宁静（家庭+5，压力-5）', effects: { family: 5, stress: -5 }, next: '2_2' }
        ];
      }
      return [
        { label: 'A：全心参演', hint: '家族事业更上层楼（艺术+10，家庭+5）', effects: { art: 10, family: 5 }, next: '2_2' },
        { label: 'B：低调搭把手', hint: '安稳陪跑（艺术+5，家庭+10）', effects: { art: 5, family: 10 }, next: '2_2' },
        { label: 'C：专注组合本身', hint: '兄弟同心（家庭+15）', effects: { family: 15 }, next: '2_2' }
      ];
    }
  };

  E['2_2'] = {
    id: '2_2', year: 1978, title: '鼻部整形', kind: 'choice',
    text: function () { return '镜子里那张脸，被无数镜头反复丈量。你开始怀疑，是不是该按世界的期待，重新雕琢它。'; },
    options: [
      { label: 'A：走进手术室的门', hint: '外形焦虑稍解，外界闲话却起（声誉-5）', effects: { reputation: -5 }, next: '2_3' },
      { label: 'B：把健康摆第一', hint: '接纳自己，身心轻盈（健康+10）', effects: { health: 10 }, next: '2_3' },
      { label: 'C：一次次动刀', hint: '沉溺改造，身心俱损（声誉-10，健康-5，压力+5）', effects: { reputation: -10, health: -5, stress: 5 }, next: '2_3' }
    ]
  };

  E['2_3'] = {
    id: '2_3', year: 1979, title: '《Off The Wall》', kind: 'auto',
    text: function (s) { return s.flags.isSolo ? '《Off The Wall》横空出世，迪斯科的霓虹里，你站上 solo 生涯的第一座高峰，整个世界开始跟着你的步点摇摆。' : '组合专辑反响不俗，你在团体的和声里稳步成长，掌声虽不独属于你，却也踏实。'; },
    effects: function (s) { return s.flags.isSolo ? { art: 20, wealth: 20, reputation: 15 } : { art: 10, wealth: 10, reputation: 5 }; },
    next: '2_4'
  };

  E['2_4'] = {
    id: '2_4', year: 1979, title: '与 Epic 深度合作', kind: 'choice',
    cond: function (s) { return s.flags.isSolo === true; }, fallback: '3_1',
    text: function () { return '厂牌伸出橄榄枝，邀你更深地绑定。合约的字里行间，藏着创作主导权与自由之间的权衡。'; },
    options: [
      { label: 'A：深度绑定 Epic', hint: '话语权与收益齐涨（声誉+10，财富+15）', effects: { reputation: 10, wealth: 15 }, flags: { epicDeep: true }, next: '3_1' },
      { label: 'B：保持安全距离', hint: '留白给生活，压力随之退潮（家庭+5，压力-10）', effects: { family: 5, stress: -10 }, flags: { epicDeep: false }, next: '3_1' },
      { label: 'C：自创厂牌单干', hint: '野心勃勃，却也烧钱劳神（艺术+10，财富-10，压力+5）', effects: { art: 10, wealth: -10, stress: 5 }, next: '3_1' }
    ]
  };

  E['2_5'] = {
    id: '2_5', year: 1980, title: '格莱美表演', kind: 'choice',
    text: function () { return '格莱美的舞台灯光亮起，这是乐坛最高规格的考场。聚光灯下，每一个转音都被放大检阅。'; },
    options: [
      { label: 'A：炫一场技巧独唱', hint: '技惊四座，紧绷感同在（艺术+10，声誉+5，压力+5）', effects: { art: 10, reputation: 5, stress: 5 }, next: '3_1' },
      { label: 'B：稳妥完成演出', hint: '得体收官（声誉+5）', effects: { reputation: 5 }, next: '3_1' },
      { label: 'C：婉拒独唱安排', hint: '低调退后半步（声誉-3，家庭+3）', effects: { reputation: -3, family: 3 }, next: '3_1' }
    ]
  };

  E['3_1'] = {
    id: '3_1', year: 1982, title: '《Thriller》', kind: 'auto',
    text: function (s) { return s.flags.isSolo ? '《Thriller》发行。它后来会成为史上最畅销的专辑，而此刻，你还不知道自己正把流行音乐的天花板推高了一寸。' : '你在团体中参与了这张里程碑专辑的创作，历史的页码里，有你写下的一行。'; },
    effects: function (s) { return s.flags.isSolo ? { art: 30, wealth: 30, reputation: 25, stress: 10 } : { art: 10, wealth: 10, reputation: 5 }; },
    next: '3_1b'
  };

  E['3_1b'] = {
    id: '3_1b', year: 1983, title: 'Motown 25 月球漫步', kind: 'choice',
    text: function () { return 'Motown 25 周年直播现场，灯光暗下又骤亮。你决定，把那段藏在袜子里的舞步，献给全世界。'; },
    options: [
      { label: 'A：完美演绎月球漫步', hint: '一个滑步，滑进了时代记忆（艺术+15，声誉+15，压力+5）', effects: { art: 15, reputation: 15, stress: 5 }, next: '3_1c' },
      { label: 'B：保守地完成演出', hint: '稳扎稳打，松弛自在（声誉+5，压力-5）', effects: { reputation: 5, stress: -5 }, next: '3_1c' },
      { label: 'C：临时换曲避锋芒', hint: '藏锋守拙，小有所得（艺术+5，声誉+3）', effects: { art: 5, reputation: 3 }, next: '3_1c' }
    ]
  };

  E['3_1c'] = {
    id: '3_1c', year: 1983, title: '《Thriller》MV', kind: 'choice',
    text: function () { return '你盘算着为《Thriller》拍一支前所未有的长版音乐录影带——僵尸、巷弄、电影质感，流行乐的边界将被重写。'; },
    options: [
      { label: 'A：斥巨资打造长版', hint: '视觉封神，钱包出血（艺术+10，财富-10，声誉+10）', effects: { art: 10, wealth: -10, reputation: 10 }, next: '3_2' },
      { label: 'B：走传统宣传路线', hint: '稳妥触达听众（声誉+5）', effects: { reputation: 5 }, next: '3_2' },
      { label: 'C：恐怖元素过界惹议', hint: '话题拉满，口碑一进一出（压力+5）', effects: { reputation: 5, stress: 5, reputation: -5 }, next: '3_2' }
    ]
  };

  E['3_2'] = {
    id: '3_2', year: 1984, title: '百事广告', kind: 'choice',
    text: function () { return '百事可乐的合约铺开红毯，片场的聚光灯比演唱会还刺眼。谁也没料到，那一簇火苗会改写此后的人生。'; },
    options: [
      { label: 'A：接拍并意外烧伤', hint: '进账与名气兼得，却埋下伤痛伏笔（触发烧伤线）（财富+20，声誉+5）', effects: { wealth: 20, reputation: 5 }, flags: { isPepsiBurned: true }, next: '3_2b' },
      { label: 'B：安全优先拒拍', hint: '护住身体，丢了广告费（健康+10，财富-20）', effects: { health: 10, wealth: -20 }, flags: { isPepsiBurned: false }, next: '3_2b' },
      { label: 'C：议价安全拍摄', hint: '皆大欢喜的折中（财富+5，健康+5）', effects: { wealth: 5, health: 5 }, flags: { isPepsiBurned: false }, next: '3_2b' }
    ]
  };

  E['3_2b'] = {
    id: '3_2b', year: 1984, title: 'Victory 巡演', kind: 'choice',
    text: function () { return 'Victory 巡演启程，这是与兄弟们久违的同台。后台的喧闹里，血缘的回声格外清晰。'; },
    options: [
      { label: 'A：全心投入家族巡演', hint: '亲情与票房双丰收（家庭+15，财富+15，压力+10）', effects: { family: 15, wealth: 15, stress: 10 }, next: '3_3' },
      { label: 'B：敷衍走完流程', hint: '例行公事（家庭+5，财富+5）', effects: { family: 5, wealth: 5 }, next: '3_3' },
      { label: 'C：借台推个人光芒', hint: '锋芒外露，兄弟微凉（艺术+10，声誉+5，家庭-5）', effects: { art: 10, reputation: 5, family: -5 }, next: '3_3' }
    ]
  };

  E['3_3'] = {
    id: '3_3', year: 1984, title: '格莱美八项', kind: 'auto',
    text: function (s) { return s.flags.isSolo ? '凭《Thriller》一夜独揽八座格莱美，史无前例的加冕。领奖台的光，几乎要把人灼伤。' : '荣誉之夜，组合与你共享掌声，奖杯的反光里映着几张并肩的笑脸。'; },
    effects: function (s) { return s.flags.isSolo ? { art: 20, reputation: 20 } : { art: 8, reputation: 8 }; },
    next: '3_4'
  };

  E['3_4'] = {
    id: '3_4', year: 1985, title: '烧伤治疗', kind: 'choice',
    cond: function (s) { return s.flags.isPepsiBurned === true; }, fallback: '3_5',
    text: function () { return '片场的灼伤仍在作痛，止痛药物顺着静脉，悄悄成了你离不开的拐杖。'; },
    options: [
      { label: 'A：依赖药物止痛', hint: '痛楚暂退，却走上依赖之途（触发依赖）（健康+10，压力-10）', effects: { health: 10, stress: -10 }, flags: { painkillerDependent: true }, next: '3_5' },
      { label: 'B：硬扛着治疗', hint: '清醒却煎熬（健康+5，压力+15）', effects: { health: 5, stress: 15 }, flags: { painkillerDependent: false }, next: '3_5' },
      { label: 'C：全面康复疗养', hint: '慢养回元气，破费不少（健康+15，财富-10，压力-5）', effects: { health: 15, wealth: -10, stress: -5 }, flags: { painkillerDependent: false }, next: '3_5' }
    ]
  };

  E['3_5'] = {
    id: '3_5', year: 1985, title: 'We Are The World', kind: 'choice',
    text: function () { return '群星在录音棚里排成一列，为远方的非洲唱一首《We Are The World》。那一刻，流行乐第一次觉得自己能改变点什么。'; },
    options: [
      { label: 'A：倾情义唱', hint: '善名远扬，爱心+1（声誉+15，家庭+5，慈善+1）', effects: { reputation: 15, family: 5, phil: 1 }, flags: { weAreTheWorld: true }, next: '3_6' },
      { label: 'B：婉拒这份邀约', hint: '退回自己的旋律里（艺术+5）', effects: { art: 5 }, next: '3_6' },
      { label: 'C：独自捐出巨款', hint: '不露面也行善，爱心+1（声誉+10，财富-15，慈善+1）', effects: { reputation: 10, wealth: -15, phil: 1 }, next: '3_6' }
    ]
  };

  E['3_6'] = {
    id: '3_6', year: 1985, title: '收购 ATV 版权', kind: 'choice',
    cond: function (s) { return s.flags.isSolo === true; }, fallback: '4_0',
    text: function () { return '机会来了：买下包含披头士作品的 ATV 版权目录。这不只是生意，更是把音乐版图纳入掌心的野心。'; },
    options: [
      { label: 'A：全资收购', hint: '豪掷 4750 万，落下商业帝国的基石（商业+1）（财富-15，声誉+10）', effects: { wealth: -15, reputation: 10, mogul: 1 }, flags: { atvBought: true }, moneyEffect: -4750, next: '4_0' },
      { label: 'B：暂不收购', hint: '按兵不动，现金充裕（财富+5）', effects: { wealth: 5 }, flags: { atvBought: false }, next: '4_0' },
      { label: 'C：联合财团分期吃下', hint: '以小博大，商业嗅觉+1（商业+1）（财富-5，声誉+5）', effects: { wealth: -5, reputation: 5, mogul: 1 }, next: '4_0' }
    ]
  };

  E['4_0'] = {
    id: '4_0', year: 1986, title: '《Captain EO》', kind: 'choice',
    text: function () { return '迪士尼递来一纸合约，邀你主演 3D 短片《Captain EO》。科幻与歌舞的跨界，是一次冒险，也是一次玩具箱里的童心。'; },
    options: [
      { label: 'A：接下这趟星际任务', hint: '银幕形象再添一笔（艺术+10，声誉+5）', effects: { art: 10, reputation: 5 }, flags: { captainEO: true }, next: '4_1' },
      { label: 'B：专心做音乐', hint: '回归老本行（艺术+5）', effects: { art: 5 }, next: '4_1' },
      { label: 'C：开出天价片酬', hint: '腰包鼓了，风评略凉（财富+10，声誉-3）', effects: { wealth: 10, reputation: -3 }, next: '4_1' }
    ]
  };

  E['4_1'] = {
    id: '4_1', year: 1987, title: '梦幻庄园', kind: 'choice',
    text: function () { return '你在加州买下一座庄园，取名“Neverland”——一个属于童真、旋转木马与欢笑的乌托邦。'; },
    options: [
      { label: 'A：对公众敞开大门', hint: '孩子们的乐园，钱包的窟窿（家庭+20，财富-30）', effects: { family: 20, wealth: -30 }, flags: { neverlandType: 'public' }, next: '4_2' },
      { label: 'B：圈起私人天地', hint: '留一方静土（财富-20，家庭+5）', effects: { wealth: -20, family: 5 }, flags: { neverlandType: 'private' }, next: '4_2' },
      { label: 'C：干脆不购置', hint: '无牵无挂，现金在手（财富+10）', effects: { wealth: 10 }, flags: { neverlandType: 'none' }, next: '4_2' }
    ]
  };

  E['4_2'] = {
    id: '4_2', year: 1987, title: '《Bad》', kind: 'auto',
    text: function (s) { return s.flags.isSolo ? '《Bad》与空前规模的全球巡演接踵而至，体育场的人海为你起伏，巅峰的风景既壮美也孤独。' : '组合新专辑延续热度，和声里的你，仍在稳步向前。'; },
    effects: function (s) { return s.flags.isSolo ? { art: 15, wealth: 20, reputation: 10, stress: 15 } : { art: 10, wealth: 15, reputation: 5, stress: 10 }; },
    next: '4_2b'
  };

  E['4_2b'] = {
    id: '4_2b', year: 1988, title: '《Moonwalker》', kind: 'choice',
    text: function () { return '你筹备电影《Moonwalker》与那支标志性的《Smooth Criminal》。大银幕，是你又一块想要征服的画布。'; },
    options: [
      { label: 'A：电影化地呈现', hint: '视听盛宴，口碑与疲惫齐来（艺术+12，声誉+8，压力+5）', effects: { art: 12, reputation: 8, stress: 5 }, flags: { moonwalker: true }, next: '4_3' },
      { label: 'B：只发单曲', hint: '收束野心（艺术+8）', effects: { art: 8 }, next: '4_3' },
      { label: 'C：邀童星搭档惹议', hint: '话题升温，闲言也起（声誉+5，压力+5）', effects: { reputation: 5, stress: 5 }, next: '4_3' }
    ]
  };

  E['4_3'] = {
    id: '4_3', year: 1988, title: '自传《月球漫步》', kind: 'auto',
    text: function () { return '自传《月球漫步》出版，你第一次亲手掀开帷幕，把那个被万花筒扭曲的自己，原原本本讲给世人听。'; },
    effects: { reputation: 10, wealth: 5 }, next: '5_1'
  };

  E['5_1'] = {
    id: '5_1', year: 1991, title: '《Dangerous》', kind: 'auto',
    text: function (s) { return s.flags.isSolo ? '《Dangerous》延续着商业与艺术的双高峰，新的节拍里，你仍是那个定义潮流的人。' : '组合新专辑稳步前行，和声依旧稳当。'; },
    effects: function (s) { return s.flags.isSolo ? { art: 15, wealth: 15, reputation: 5 } : { art: 8, wealth: 10, reputation: 3 }; },
    next: '5_1b'
  };

  E['5_1b'] = {
    id: '5_1b', year: 1991, title: '《Black or White》', kind: 'choice',
    text: function () { return '新单曲《Black or White》的 MV 引发热议，种族与身份的隐喻，被你揉进了一段变脸的魔法里。'; },
    options: [
      { label: 'A：用挑衅的意象表达', hint: '锋芒毕露，议论四起（声誉+5，压力+5）', effects: { reputation: 5, stress: 5 }, next: '5_2' },
      { label: 'B：温和地呈现', hint: '四平八稳（声誉+5）', effects: { reputation: 5 }, next: '5_2' },
      { label: 'C：末段动作引争议', hint: '过界惹议，口碑小损（声誉-5，压力+5）', effects: { reputation: -5, stress: 5 }, next: '5_2' }
    ]
  };

  E['5_2'] = {
    id: '5_2', year: 1992, title: '危险之旅巡演', kind: 'auto',
    text: function () { return '“危险之旅”全球巡演拉开帷幕，城市的名字在行程表上连成一条发光的线，连轴转的疲惫也跟着发光。'; },
    effects: { wealth: 25, stress: 20 }, next: '5_2b'
  };

  E['5_2b'] = {
    id: '5_2b', year: 1992, title: 'Heal the World 基金会', kind: 'choice',
    text: function () { return '你创立 Heal the World 基金会，想把舞台上的爱，分一点给那些够不着灯光的孩子。'; },
    options: [
      { label: 'A：全身心投入', hint: '善名与牵挂同增，爱心+1（声誉+15，家庭+5，压力+5，慈善+1）', effects: { reputation: 15, family: 5, stress: 5, phil: 1 }, flags: { healWorld: true }, next: '5_2c' },
      { label: 'B：仅挂名参与', hint: '轻描淡写（声誉+5）', effects: { reputation: 5 }, next: '5_2c' },
      { label: 'C：高调营销慈善', hint: '流量与爱心齐涨，爱心+1（声誉+10，压力+5，慈善+1）', effects: { reputation: 10, stress: 5, phil: 1 }, next: '5_2c' }
    ]
  };

  E['5_2c'] = {
    id: '5_2c', year: 1993, title: '超级碗中场秀', kind: 'choice',
    text: function () { return '超级碗中场秀，上亿双眼睛在同一秒望向你。这是体育与流行乐交会的顶点。'; },
    options: [
      { label: 'A：奉上一场盛典', hint: '惊艳全国，艺术与声名齐飞（艺术+10，声誉+15）', effects: { art: 10, reputation: 15 }, next: '5_2d' },
      { label: 'B：低调呈现', hint: '稳妥收场（声誉+5）', effects: { reputation: 5 }, next: '5_2d' },
      { label: 'C：邀请童声合唱团', hint: '纯真共鸣，暖意融融（声誉+10，家庭+5）', effects: { reputation: 10, family: 5 }, next: '5_2d' }
    ]
  };

  E['5_2d'] = {
    id: '5_2d', year: 1993, title: 'Oprah 访谈', kind: 'choice',
    text: function () { return 'Oprah 的访谈席对面，坐着九千万名观众。这是一个把伤口摊开、也可能被误解的赌注。'; },
    options: [
      { label: 'A：坦诚聊白癜风与童年', hint: '卸下伪装换来理解，却也透支（声誉+20，压力+10）', effects: { reputation: 20, stress: 10 }, flags: { oprahOpen: true }, next: '5_3' },
      { label: 'B：绕开敏感话题', hint: '体面，却隔了一层（声誉+5，压力+5）', effects: { reputation: 5, stress: 5 }, next: '5_3' },
      { label: 'C：拒访守住神秘', hint: '退入孤独，隐士之心+1（声誉-3，压力-5，隐士+1）', effects: { reputation: -3, stress: -5, recluse: 1 }, next: '5_3' }
    ]
  };

  E['5_3'] = {
    id: '5_3', year: 1993, title: '1993 年民事指控', kind: 'choice',
    cond: function (s) { return s.flags.isSolo === true && s.flags.neverlandType !== 'none'; }, fallback: '5_5',
    text: function (s) {
      if (s.flags.isSolo === true && s.flags.neverlandType !== 'none') {
        return '1993 年，一名少年家属对你提出民事指控，警方的搜查令敲开了庄园的门。舆论的镜头，第一次对准了你最不想被看见的角落。\n你将如何应对？';
      }
      return '你未购置庄园且始终与兄弟并肩，相关民事指控未曾发生。';
    },
    options: [
      { label: 'A：达成庭外和解', hint: '支付 2300 万，声誉重创，压力陡增（声誉-20，压力+20）', effects: { reputation: -20, stress: 20 }, moneyEffect: -2300, flags: { settlement1993: true }, next: '5_4' },
      { label: 'B：应诉到底', hint: '硬刚法庭，心力交瘁（压力+30）', effects: { stress: 30 }, flags: { settlement1993: false }, next: '5_4' },
      { label: 'C：配合调查', hint: '清白与否交给程序，声誉仍受伤（声誉-10，压力+25）', effects: { reputation: -10, stress: 25 }, flags: { settlement1993: false }, next: '5_4' }
    ]
  };

  E['5_4'] = {
    id: '5_4', year: 1993, title: '药物依赖公开', kind: 'auto',
    cond: function (s) { return s.flags.isPepsiBurned === true && s.flags.painkillerDependent === true; }, fallback: '5_5',
    text: function () { return '长年倚赖的止痛药物，终于被外界的目光揪了出来。依赖，从私密的伤口变成了公开的注脚。'; },
    effects: { reputation: -15, health: -10, stress: 20 }, next: '5_5'
  };

  E['5_5'] = {
    id: '5_5', year: 1994, title: '与 Lisa Marie 结婚', kind: 'choice',
    text: function () { return '你与 Lisa Marie Presley 携手步入婚姻，两段孤独的星轨，在镜头前短暂交叠。'; },
    options: [
      { label: 'A：用心经营这段婚姻', hint: '家有了温度，名气也添暖意（家庭+15，声誉+10）', effects: { family: 15, reputation: 10 }, flags: { marriedLisa: true }, next: '6_1' },
      { label: 'B：保持距离', hint: '貌合神离（家庭-5）', effects: { family: -5 }, flags: { marriedLisa: false }, next: '6_1' },
      { label: 'C：办一场世纪婚礼', hint: '举世瞩目，破费又劳神（声誉+5，财富-10，压力+5）', effects: { reputation: 5, wealth: -10, stress: 5 }, flags: { marriedLisa: false }, next: '6_1' }
    ]
  };

  E['6_1'] = {
    id: '6_1', year: 1995, title: '《HIStory》', kind: 'auto',
    text: function (s) { return s.flags.isSolo ? '双碟专辑《HIStory》问世，一半回望来路，一半叫板未来。封面上那个镀金身影，是你给时代的一记回响。' : '组合新作延续旅程，和声里依旧有你。'; },
    effects: function (s) { return s.flags.isSolo ? { art: 10, wealth: 15, reputation: 5 } : { art: 6, wealth: 10, reputation: 3 }; },
    next: '6_1b'
  };

  E['6_1b'] = {
    id: '6_1b', year: 1995, title: '索尼合并', kind: 'choice',
    cond: function (s) { return s.flags.isSolo === true && s.flags.epicDeep === true; }, fallback: '6_1c',
    text: function () { return '你可将 ATV 版权与索尼合并，把零散的版图拼成一张王座。这是商业棋局里最凶险也最诱人的一步。'; },
    options: [
      { label: 'A：合并 Sony/ATV', hint: '版权帝国落成，商业+1（财富+50，声誉+10）', effects: { wealth: 50, reputation: 10, mogul: 1 }, flags: { sonyMerge: true }, next: '6_1c' },
      { label: 'B：暂不合并', hint: '留一丝自由，家更暖（财富-10，家庭+5）', effects: { wealth: -10, family: 5 }, flags: { sonyMerge: false }, next: '6_1c' },
      { label: 'C：反手收购更多目录', hint: '版图再扩，商业+2（财富-20，声誉+5）', effects: { wealth: -20, reputation: 5, mogul: 2 }, next: '6_1c' }
    ]
  };

  E['6_1c'] = {
    id: '6_1c', year: 1995, title: '《Scream》与 Janet', kind: 'choice',
    text: function () { return '你与妹妹 Janet 联手《Scream》，把兄妹的私密情绪，砸进了一支烧钱如流水的 MV 里。'; },
    options: [
      { label: 'A：斥巨资拍摄', hint: '视听炸裂，身心俱疲（艺术+12，声誉+8，压力+10）', effects: { art: 12, reputation: 8, stress: 10 }, flags: { scream: true }, next: '6_1d' },
      { label: 'B：简化制作', hint: '收着劲儿来（艺术+6）', effects: { art: 6 }, next: '6_1d' },
      { label: 'C：借妹妹的资源', hint: '亲情与艺术双赢（家庭+5，艺术+8）', effects: { family: 5, art: 8 }, next: '6_1d' }
    ]
  };

  E['6_1d'] = {
    id: '6_1d', year: 1996, title: '《They Don’t Care About Us》', kind: 'choice',
    text: function () { return '单曲掀起争议，歌词的锋芒被人反复掂量。你要在坚持与妥协之间，替这句话找个出口。'; },
    options: [
      { label: 'A：坚持原词不改', hint: '风骨凛然，争议缠身（声誉-5，艺术+8，压力+5）', effects: { reputation: -5, art: 8, stress: 5 }, next: '6_2' },
      { label: 'B：稍作修改平息', hint: '息事宁人（声誉+3）', effects: { reputation: 3 }, next: '6_2' },
      { label: 'C：转向《Earth Song》环保', hint: '把怒火化作大地之诗，爱心+1（声誉+10，慈善+1）', effects: { reputation: 10, phil: 1 }, flags: { earthSong: true }, next: '6_2' }
    ]
  };

  E['6_2'] = {
    id: '6_2', year: 1996, title: '与黛比·罗结婚', kind: 'choice',
    text: function () { return '你与黛比·罗结婚，组建起属于自己的小家。镁光灯外，第一次有了寻常人家的灶火。'; },
    options: [
      { label: 'A：全心经营家庭', hint: '家成了最稳的锚（家庭+20）', effects: { family: 20 }, flags: { marriedDebbie: true }, next: '6_2b' },
      { label: 'B：保持疏离', hint: '有名无实的冷淡（家庭-10）', effects: { family: -10 }, flags: { marriedDebbie: false }, next: '6_2b' },
      { label: 'C：规划代孕子女', hint: '为新生命铺路，账目出血（家庭+5，财富-10）', effects: { family: 5, wealth: -10 }, flags: { surrogacy: true }, next: '6_2b' }
    ]
  };

  E['6_2b'] = {
    id: '6_2b', year: 1997, title: '启动《Invincible》', kind: 'choice',
    cond: function (s) { return s.flags.isSolo === true; }, fallback: '6_2c',
    text: function () { return '你着手筹备《Invincible》，与厂牌的拉锯也暗暗升温。创作的火焰很旺，背后的绳索也在收紧。'; },
    options: [
      { label: 'A：全力投入制作', hint: '艺术封顶，身心透支（艺术+15，压力+30）', effects: { art: 15, stress: 30 }, flags: { invincibleStarted: true }, next: '6_2c' },
      { label: 'B：适度投入', hint: '张弛有度，现金回血（财富+10，压力-10）', effects: { wealth: 10, stress: -10 }, flags: { invincibleStarted: false }, next: '6_2c' },
      { label: 'C：半独立制作', hint: '在夹缝里守住自我（艺术+8，压力+10）', effects: { art: 8, stress: 10 }, next: '6_2c' }
    ]
  };

  E['6_2c'] = {
    id: '6_2c', year: 1997, title: '《Blood on the Dance Floor》', kind: 'choice',
    text: function () { return '你发行混音专辑《Blood on the Dance Floor》，把夜店的节拍，重新缝进自己的名字里。'; },
    options: [
      { label: 'A：正式发行', hint: '舞池回响，进账可观（艺术+8，财富+10）', effects: { art: 8, wealth: 10 }, flags: { bloodDance: true }, next: '6_2d' },
      { label: 'B：搁置计划', hint: '留白待后（艺术+3）', effects: { art: 3 }, next: '6_2d' },
      { label: 'C：大胆混音实验', hint: '先锋尝鲜，小有声望（艺术+5，声誉+3）', effects: { art: 5, reputation: 3 }, next: '6_2d' }
    ]
  };

  E['6_2d'] = {
    id: '6_2d', year: 1997, title: '《Ghosts》短片', kind: 'choice',
    cond: function (s) { return s.flags.isSolo === true; }, fallback: '6_2e',
    text: function () { return '你亲自执导长篇短片《Ghosts》，把心里那些不被理解的怪诞，一股脑搬上银幕。'; },
    options: [
      { label: 'A：拍成震撼长片', hint: '艺术宣泄，艺术家之心+1（艺术+10，声誉+5，压力+10）', effects: { art: 10, reputation: 5, stress: 10, artPath: 1 }, flags: { ghosts: true }, next: '6_2e' },
      { label: 'B：干脆放弃', hint: '收起表达欲（艺术+3）', effects: { art: 3 }, next: '6_2e' }
    ]
  };

  E['6_2e'] = {
    id: '6_2e', year: 1999, title: '慈善演唱会', kind: 'choice',
    text: function () { return '你在德国与韩国办起“Michael Jackson & Friends”慈善演唱会，把舞台让给更需要被听见的人。'; },
    options: [
      { label: 'A：全力投入', hint: '善名广传，爱心+1（声誉+10，家庭+5，财富-10，慈善+1）', effects: { reputation: 10, family: 5, wealth: -10, phil: 1 }, flags: { charity99: true }, next: '6_3' },
      { label: 'B：小额参与', hint: '意思到了（声誉+3）', effects: { reputation: 3 }, next: '6_3' },
      { label: 'C：联手政要募款', hint: '资源撬动善意，爱心+1（声誉+8，慈善+1）', effects: { reputation: 8, phil: 1 }, next: '6_3' }
    ]
  };

  E['6_3'] = {
    id: '6_3', year: 1999, title: '与黛比离婚', kind: 'auto',
    cond: function (s) { return s.flags.marriedDebbie === true; }, fallback: '6_3b',
    text: function () { return '你与黛比·罗的婚姻，在聚光灯的炙烤下走到了尽头。曾经的小家，悄然散了温度。'; },
    effects: { family: -10 }, next: '6_3b'
  };

  E['6_3b'] = {
    id: '6_3b', year: 2001, title: '《Invincible》与 30 周年', kind: 'choice',
    text: function () { return '新专辑《Invincible》与出道 30 周年演唱会接踵而至。三十年的加冕，也是一次与时光的对望。'; },
    options: [
      { label: 'A：办一场盛大纪念', hint: '荣耀加身，劳顿难免（艺术+12，声誉+10，压力+10）', effects: { art: 12, reputation: 10, stress: 10 }, flags: { anniv2001: true }, next: '6_4' },
      { label: 'B：低调处理', hint: '不张扬地过（声誉+3）', effects: { reputation: 3 }, next: '6_4' },
      { label: 'C：提携后辈', hint: '薪火相传，暖意融融（艺术+8，家庭+5）', effects: { art: 8, family: 5 }, flags: { collab: true }, next: '6_4' }
    ]
  };

  E['6_4'] = {
    id: '6_4', year: 2002, title: '第二次刑事指控', kind: 'choice',
    cond: function (s) { return s.flags.isSolo === true && s.flags.neverlandType !== 'none'; }, fallback: '7_1',
    text: function (s) {
      if (s.flags.isSolo === true && s.flags.neverlandType !== 'none') {
        var extra = s.flags.settlement1993 ? ' 由于 1993 年已达成庭外和解，这次指控受到更多公众关注。' : '';
        return '2002 年，你再次面临刑事指控。庄园的围墙之外，媒体的探照灯昼夜不息。' + extra + '\n这一次，你站在了更汹涌的漩涡中央。';
      }
      return '你未购置庄园或始终在兄弟保护下，相关刑事指控未曾出现。';
    },
    options: [
      { label: 'A：应诉到底', hint: '支付 1000 万辩护，心力耗尽，终获无罪裁定（压力+30）', effects: { stress: 30 }, moneyEffect: -1000, flags: { secondCharge: true, secondVerdict: 'not_guilty' }, next: '6_5' },
      { label: 'B：达成和解', hint: '砸下 2000 万买断纠纷，声名重创（声誉-30）', effects: { reputation: -30 }, moneyEffect: -2000, flags: { secondCharge: true, secondVerdict: 'settled' }, next: '7_1' },
      { label: 'C：透明地坚持', hint: '把清白交给时间，压力如山（压力+20）', effects: { stress: 20 }, flags: { secondCharge: true }, next: '6_5' }
    ]
  };

  E['6_4b'] = {
    id: '6_4b', year: 2002, title: 'Blanket 出生', kind: 'choice',
    text: function () { return '你的第三个孩子 Blanket 降生，襁褓里的呼吸，是这喧嚣人间里最安静的奇迹。'; },
    options: [
      { label: 'A：全心陪伴他长大', hint: '父爱沉淀，亦添劳碌（家庭+15，压力+5）', effects: { family: 15, stress: 5 }, flags: { blanketBorn: true }, next: '6_4c' },
      { label: 'B：暂缓公众曝光', hint: '把私密留给自己（家庭+5）', effects: { family: 5 }, next: '6_4c' },
      { label: 'C：高调展示家庭', hint: '秀恩爱涨粉，隐士之心-1（声誉+5，家庭+10）', effects: { reputation: 5, family: 10, recluse: -1 }, next: '6_4c' }
    ]
  };

  E['6_4c'] = {
    id: '6_4c', year: 2002, title: '柏林坠婴', kind: 'choice',
    text: function () { return '在柏林的阳台上，你曾把孩子探出窗外的画面，被镜头永远定格。那一刻的温柔，被全世界误读。'; },
    options: [
      { label: 'A：公开致歉', hint: '主动担责，口碑受挫（声誉-10，压力+10）', effects: { reputation: -10, stress: 10 }, flags: { babyDangle: true }, next: '6_4d' },
      { label: 'B：保持沉默', hint: '任流言发酵（声誉-5，压力+5）', effects: { reputation: -5, stress: 5 }, next: '6_4d' },
      { label: 'C：反诉媒体', hint: '以攻代守，退意渐生（隐士+1）（声誉-3，压力+5）', effects: { reputation: -3, stress: 5, recluse: 1 }, next: '6_4d' }
    ]
  };

  E['6_4d'] = {
    id: '6_4d', year: 2003, title: 'Bashir 纪录片', kind: 'choice',
    text: function () { return 'Bashir 的纪录片播出，把你私生活的褶皱，摊在了亿万观众眼前。真实的你，与镜头里的你，开始错位。'; },
    options: [
      { label: 'A：坦然面对镜头', hint: '直面争议，身心承压（声誉-5，压力+10）', effects: { reputation: -5, stress: 10 }, flags: { bashirDoc: true }, next: '6_4e' },
      { label: 'B：拒拍保持距离', hint: '退后半步，隐士之心+1（压力+5）', effects: { stress: 5, recluse: 1 }, next: '6_4e' },
      { label: 'C：起诉记者', hint: '以法律回击，耗时耗神（声誉+3，压力+15）', effects: { reputation: 3, stress: 15 }, next: '6_4e' }
    ]
  };

  E['6_4e'] = {
    id: '6_4e', year: 2003, title: '2003 年逮捕程序', kind: 'choice',
    cond: function (s) { return s.flags.secondCharge === true; }, fallback: '6_5',
    text: function () { return '围绕那桩刑事指控，你经历了逮捕与保释的程序。手铐的金属凉意，比任何舞台都真实。'; },
    options: [
      { label: 'A：配合保释流程', hint: '依法而行，声誉微损（压力+20，声誉-5）', effects: { stress: 20, reputation: -5 }, next: '6_5' },
      { label: 'B：隐居避世', hint: '躲进静默，隐士之心+1（压力-5）', effects: { stress: -5, recluse: 1 }, next: '6_5' },
      { label: 'C：公开回应', hint: '自证清白，心力交瘁（声誉-3，压力+10）', effects: { reputation: -3, stress: 10 }, next: '6_5' }
    ]
  };

  E['6_5'] = {
    id: '6_5', year: 2005, title: '2005 年庭审结果', kind: 'auto',
    cond: function (s) { return s.flags.secondCharge === true; }, fallback: '7_0',
    text: function (s) {
      if (s.flags.secondVerdict === 'not_guilty') return '2005 年，所有指控均被裁定不成立。法庭的钟声落下，你走出大门时，声誉缓缓回温。';
      if (s.flags.secondVerdict === 'settled') return '庭外和解落槌，纠纷虽快速了结，公众心里的问号却没被抹去。';
      return '漫长的庭审终于暂告段落，尘埃里，你独自站着。';
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
    text: function () { return '《Thriller 25》周年纪念专辑面世，格莱美的聚光灯再次为你亮起。二十五年过去，那张封面依旧在发光。'; },
    options: [
      { label: 'A：盛大回归', hint: '王者归来，艺术家之心+1（艺术+10，声誉+10）', effects: { art: 10, reputation: 10, artPath: 1 }, flags: { thriller25: true }, next: '7_1' },
      { label: 'B：释出混音', hint: '温故而知新（艺术+5，声誉+5）', effects: { art: 5, reputation: 5 }, next: '7_1' },
      { label: 'C：婉拒亮相', hint: '退居幕后，隐士之心+1（声誉-3）', effects: { reputation: -3, recluse: 1 }, next: '7_1' }
    ]
  };

  E['7_1'] = {
    id: '7_1', year: 2006, title: '债务危机', kind: 'choice',
    cond: function (s) { return s.flags.neverlandType !== 'none'; }, fallback: '7_2',
    text: function () { return '梦幻庄园像个吞金的无底洞，债务危机逼上门来。Colony Capital 递来一根浮木——条件是让你松手些许。'; },
    options: [
      { label: 'A：转让部分权益', hint: '断尾求生，家也更冷（财富-50，家庭-15）', effects: { wealth: -50, family: -15 }, flags: { debtCrisis: true }, next: '7_2' },
      { label: 'B：死撑不卖', hint: '硬扛到底，濒临窒息（财富-100，压力+10）', effects: { wealth: -100, stress: 10 }, flags: { debtCrisis: false }, next: '7_2' },
      { label: 'C：引入注资', hint: '外人入局，压力稍缓（财富-20，压力-5）', effects: { wealth: -20, stress: -5 }, next: '7_2' }
    ]
  };

  E['7_2'] = {
    id: '7_2', year: 2009, title: 'This Is It', kind: 'choice',
    text: function (s) { return '你宣布《This Is It》系列演唱会，像要和岁月再赌一把。伦敦的舞台已经搭好，聚光灯在等你归来。'; },
    options: function (s) {
      if (s.flags.isSolo) {
        return [
          { label: 'A：咬牙撑满 50 场', hint: '财富暴涨，身体濒临极限（财富+100，压力+40）', effects: { wealth: 100, stress: 40 }, flags: { thisItHeld: true, thisItFull: true }, next: '7_3' },
          { label: 'B：忍痛取消', hint: '保住健康，声誉微损（健康+20，声誉-10）', effects: { health: 20, reputation: -10 }, flags: { thisItHeld: false }, next: '7_3' },
          { label: 'C：缩减到 20 场', hint: '折中之选，张弛有度（财富+40，压力+20，健康+10）', effects: { wealth: 40, stress: 20, health: 10 }, flags: { thisItHeld: true, thisItReduced: true }, next: '7_3' }
        ];
      }
      return [
        { label: 'A：20 场团体巡演', hint: '兄弟同台，稳健收官（财富+40，压力+20，健康+5）', effects: { wealth: 40, stress: 20, health: 5 }, flags: { thisItHeld: true, thisItFull: false }, next: '7_3' },
        { label: 'B：取消退休巡演', hint: '安心养身，进账略损（健康+20，财富-30）', effects: { health: 20, wealth: -30 }, flags: { thisItHeld: false }, next: '7_3' }
      ];
    }
  };

  E['7_3'] = {
    id: '7_3', year: 2009, title: '命运裁决', kind: 'ending',
    text: function () { return '2009 年 6 月 25 日，聚光灯骤然熄灭。回望这一生，从盖瑞的廉价摇篮到全世界的舞台，你的每一个选择，都写就了独一份的传奇。谢幕之后，故事由听者续写。'; },
    next: null
  };

  // ---------- 变体事件（GDD 5.6 可能性系统） ----------
  // 由引擎在章节切换时按概率插入，保证重复游玩性。
  E.V_OFFER = {
    id: 'V_OFFER', variant: true, window: [1985, 1990], weight: 50,
    title: '神秘代言邀约', kind: 'choice',
    text: function () { return '某品牌捧着天价合约找上门，条件是把你塞进高密度曝光的人潮里。名利与喘息，再次二选一。'; },
    options: [
      { label: 'A：接下这笔代言', hint: '腰包鼓了，口碑微动（财富+15，声誉+5）', effects: { wealth: 15, reputation: 5 }, next: '__RETURN__' },
      { label: 'B：婉拒，退回创作', hint: '守住本心（艺术+3）', effects: { art: 3 }, next: '__RETURN__' }
    ]
  };
  E.V_SCARE = {
    id: 'V_SCARE', variant: true, window: [1970, 2009], weight: 30,
    title: '健康惊吓', kind: 'choice',
    text: function () { return '一次突如其来的晕眩让你当众软倒，身体的警报器，终于刺耳地响了起来。'; },
    options: [
      { label: 'A：立刻放下一切休养', hint: '回血也回神（健康+8，压力-5）', effects: { health: 8, stress: -5 }, next: '__RETURN__' },
      { label: 'B：咬牙撑住日程', hint: '硬扛到底，代价是更深的透支（压力+8）', effects: { stress: 8 }, next: '__RETURN__' }
    ]
  };
  E.V_PAPARAZZI = {
    id: 'V_PAPARAZZI', variant: true, window: [1990, 2005], weight: 40,
    title: '狗仔围堵', kind: 'choice',
    text: function () { return '狗仔与私生饭的镜头，像影子一样贴着你。私生活的最后一寸缝隙，也被闪光灯填满。'; },
    options: [
      { label: 'A：礼貌地侧身避开', hint: '体面退场，闲言渐起（声誉+3，压力+5）', effects: { reputation: 3, stress: 5 }, next: '__RETURN__' },
      { label: 'B：强硬回击', hint: '怒火外露，口碑受损（声誉-3，压力+8）', effects: { reputation: -3, stress: 8 }, next: '__RETURN__' }
    ]
  };
  E.V_RUMOR = {
    id: 'V_RUMOR', variant: true, window: [1993, 2003], weight: 35,
    title: '媒体谣言', kind: 'choice',
    text: function () { return '一波没影的谣言在八卦版面上发酵，真伪难辨，却已先声夺人。'; },
    options: [
      { label: 'A：冷处理不理会', hint: '任其自生自灭，口碑微损（声誉-3）', effects: { reputation: -3 }, next: '__RETURN__' },
      { label: 'B：主动出面澄清', hint: '以正视听，徒增疲惫（声誉+3，压力+5）', effects: { reputation: 3, stress: 5 }, next: '__RETURN__' }
    ]
  };
  E.V_COLLAB = {
    id: 'V_COLLAB', variant: true, window: [1995, 2005], weight: 35,
    title: '后辈求合作', kind: 'choice',
    text: function () { return '当红的后辈揣着 demo 登门，眼里有你当年的光。他想与你，合唱一首跨越代际的歌。'; },
    options: [
      { label: 'A：欣然同台', hint: '薪火相传，暖意融融（艺术+8，家庭+5）', effects: { art: 8, family: 5 }, next: '__RETURN__' },
      { label: 'B：婉拒好意', hint: '留白给自己（艺术+3）', effects: { art: 3 }, next: '__RETURN__' }
    ]
  };

  E.V_ASIA = {
    id: 'V_ASIA', variant: true, window: [1987, 2009], weight: 35,
    title: '亚洲巡演邀约', kind: 'choice',
    text: function () { return '亚洲几座城市的邀约像雪片飞来，票房的数字令人心动，可连轴转的行程也让人发怵。'; },
    options: [
      { label: 'A：接下这片新大陆', hint: '进账可观，身心俱疲（财富+20，压力+10）', effects: { wealth: 20, stress: 10 }, next: '__RETURN__' },
      { label: 'B：婉拒，留守录音室', hint: '潜心打磨（艺术+8）', effects: { art: 8 }, next: '__RETURN__' }
    ]
  };

  E.V_CHARITY = {
    id: 'V_CHARITY', variant: true, window: [1993, 2005], weight: 30,
    cond: function (s) { return s.flags.healWorld === true; },
    title: '全球儿童慈善义演', kind: 'choice',
    text: function () { return '依托你亲手创立的公益基金会，主办方提议办一场跨国的儿童慈善义演。聚光灯，这一次为远方而亮。'; },
    options: [
      { label: 'A：倾尽全力筹办', hint: '善名广传，爱心+1（声誉+12，家庭+5，压力+8，慈善+1）', effects: { reputation: 12, family: 5, stress: 8, phil: 1 }, next: '__RETURN__' },
      { label: 'B：仅名义站台', hint: '举手之劳（声誉+5）', effects: { reputation: 5 }, next: '__RETURN__' }
    ]
  };

  MJ.EVENTS = E;
})();
