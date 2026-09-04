/* events.js — 事件数据（数据驱动，对齐 GDD v0.6 第六章 6.4 节点目录）
 * 事件对象字段：
 *   id, year, title, kind: 'choice'|'auto'|'ending'
 *   cond(s)        可选：门控条件；false 时跳到 fallback
 *   fallback       可选：cond 失败时的跳转 id
 *   text(s)        返回展示文本（支持按状态分支，见 narr 辅助）
 *   options        选项数组；可为函数 s => [...]（用于按状态切换选项）
 *                  每项：{ label, hint, effects, flags, next }
 *   effects        属性/元路线/金钱变化：{ health, reputation, wealth, family, art, stress,
 *                                          phil, mogul, recluse, artPath, money }
 *                  money 走 Economy（万元），不污染 0–100 属性
 *   flags          写入的标志
 *   next           自动事件的跳转 / 变体事件的 __RETURN__
 * 变体事件：追加 variant:true, window:[y1,y2], weight(0-100)
 *
 * narr(base, s, branches)：根据当前状态追加情境段落，实现「同一事件随属性/前序选择呈现不同叙述」。
 */
window.MJ = window.MJ || {};
(function () {
  'use strict';

  // 情境叙述辅助：base 为基础文案，branches 为 [{cond:fn(s), text:'段落'}]，命中第一条即追加。
  function narr(base, s, branches) {
    if (!branches) return base;
    for (var i = 0; i < branches.length; i++) {
      try { if (branches[i].cond(s)) return base + '\n' + branches[i].text; } catch (e) {}
    }
    return base;
  }

  var E = {};
  var T = function (k, v, fb) { return (MJ.t ? MJ.t(k, v, fb) : (fb != null ? fb : k)); };
  MJ.localizeEvent = function (ev, s) {
    s = s || (MJ.engine && MJ.engine.state) || {};
    var id = ev.id;
    var opts = (typeof ev.options === 'function') ? ev.options(s) : (ev.options || []);
    var locOpts = opts.map(function (o, i) {
      var no = {}; for (var k in o) { if (o.hasOwnProperty(k)) no[k] = o[k]; }
      no.label = T('event.' + id + '.opt' + i + '.label', null, o.label);
      if (o.hint != null) no.hint = T('event.' + id + '.opt' + i + '.hint', null, o.hint);
      if (o.epilogue != null) no.epilogue = T('event.' + id + '.opt' + i + '.epilogue', null, o.epilogue);
      return no;
    });
    return {
      id: id, year: ev.year, kind: ev.kind, key: ev.key,
      title: T('event.' + id + '.title', null, ev.title),
      text: (typeof ev.text === 'function') ? ev.text(s) : (ev.text != null ? T('event.' + id + '.text', null, ev.text) : ''),
      options: locOpts
    };
  };


  E.start = {
    id: 'start', year: 1958, title: T('event.start.title', null, '诞生'), kind: 'auto',
    text: function () { return T('event.start.ret0.text', null, '1958 年 8 月 29 日，印第安纳州盖瑞市。炼钢厂的红光彻夜不熄，七口之家的屋檐下，啼哭声划破工业城的喧嚣。\n没人知道，这个在廉价摇篮里挥舞小手的孩子，日后会让全世界的节拍为之停顿。'); },
    effects: { family: 5 }, next: '1_0'
  };

  E['1_0'] = {
    id: '1_0', year: 1964, title: T('event.1_0.title', null, '加入 Jackson 5'), kind: 'choice',
    text: function (s) {
      return narr(T('event.1_0.text', null, '兄长们琢磨出一个名为“Jackson 5”的组合，只缺一把最亮的声音。排练室的镜子前，他们把话筒递到你手里——舞台的灯，第一次为你而亮。'), s, [
        { cond: function (s) { return (s.attributes.family || 0) >= 68; }, text: T('event.1_0.branch0.text', null, '家人的掌声比台下更暖，你忽然有点舍不得这份安稳。') },
        { cond: function (s) { return (s.attributes.family || 0) <= 52; }, text: T('event.1_0.branch1.text', null, '身后的目光带着期许与重量，你明白这一步踏出去就难再回头。') }
      ]);
    },
    options: [
      { label: T('event.1_0.opt0.label', null, 'A：把整颗心交给舞台'), hint: T('event.1_0.opt0.hint', null, '艺术精进，手足羁绊更深，但童年的重量提前压上肩头（艺术+10，家庭+5，压力+5）'), effects: { art: 10, family: 5, stress: 5 }, next: '1_1' },
      { label: T('event.1_0.opt1.label', null, 'B：退到哥哥们身后'), hint: T('event.1_0.opt1.hint', null, '守着家人的温暖，成名的心跳慢了半拍（家庭+10）'), effects: { family: 10 }, next: '1_1' },
      { label: T('event.1_0.opt2.label', null, 'C：躲开童星的光环'), hint: T('event.1_0.opt2.hint', null, '短暂喘息，却也疏远了手足（压力-5，家庭-5）'), effects: { stress: -5, family: -5 }, next: '1_1' }
    ]
  };

  E['1_1'] = {
    id: '1_1', year: 1965, title: T('event.1_1.title', null, '年少显露才华'), kind: 'choice',
    text: function (s) {
      return narr(T('event.1_1.text', null, '父亲信奉“铁腕出天才”，夜里的琴房总回荡着节拍器的催促。天赋与苛责一同降临，你想逃，却又舍不得镜子前那个会发光的自己。'), s, [
        { cond: function (s) { return (s.attributes.family || 0) <= 50; }, text: T('event.1_1.branch0.text', null, '家里的气氛因你的倔强而发紧，琴房门外是长久的沉默。') },
        { cond: function (s) { return (s.attributes.stress || 0) >= 40; }, text: T('event.1_1.branch1.text', null, '紧绷的日程像秒针，一下下敲着你还稚嫩的肩膀。') }
      ]);
    },
    options: [
      { label: T('event.1_1.opt0.label', null, 'A：在鞭策中拼命练习'), hint: T('event.1_1.opt0.hint', null, '技艺突飞猛进，却割裂了父子温情，紧绷感与日俱增（艺术+15，家庭-10，压力+15）'), effects: { art: 15, family: -10, stress: 15 }, next: '1_2' },
      { label: T('event.1_1.opt1.label', null, 'B：找到自己的节奏'), hint: T('event.1_1.opt1.hint', null, '稳步成长，家与心都还安稳（艺术+5，家庭+5，压力+5）'), effects: { art: 5, family: 5, stress: 5 }, next: '1_2' },
      { label: T('event.1_1.opt2.label', null, 'C：推开那扇琴房门'), hint: T('event.1_1.opt2.hint', null, '反抗换来了片刻轻松，也换来冷战（家庭-5，压力-10）'), effects: { family: -5, stress: -10 }, next: '1_2' }
    ]
  };

  E['1_2'] = {
    id: '1_2', year: 1968, title: T('event.1_2.title', null, '签约 Steeltown'), kind: 'choice',
    text: function (s) {
      return narr(T('event.1_2.text', null, '一家名不见经传的 Steeltown 唱片递来合同，纸页还带着油墨味。这是通往更大世界的船票，还是过早绑定的枷锁？'), s, [
        { cond: function (s) { return (s.attributes.art || 0) >= 45; }, text: T('event.1_2.branch0.text', null, '你已能听出自己声音里的不同，那份底气让递来的合同更亮眼。') },
        { cond: function (s) { return (s.attributes.stress || 0) >= 40; }, text: T('event.1_2.branch1.text', null, '连签约的笔墨都带着催促的意味，你忽然很想喘口气。') }
      ]);
    },
    options: [
      { label: T('event.1_2.opt0.label', null, 'A：抓住这张船票'), hint: T('event.1_2.opt0.hint', null, '曝光与口碑齐升，聚光灯更烫了（艺术+10，声誉+10，压力+10）'), effects: { art: 10, reputation: 10, stress: 10 }, next: '1_2b' },
      { label: T('event.1_2.opt1.label', null, 'B：再观望一阵'), hint: T('event.1_2.opt1.hint', null, '稳守本心，亲情是避风港（艺术+5，家庭+5）'), effects: { art: 5, family: 5 }, next: '1_2b' }
    ]
  };

  E['1_2b'] = {
    id: '1_2b', year: 1969, title: T('event.1_2b.title', null, 'Ed Sullivan 秀'), kind: 'choice',
    text: function (s) {
      return narr(T('event.1_2b.text', null, '全国直播的《Ed Sullivan 秀》——上亿双耳朵在这一夜同时竖起。幕布后，你攥紧了话筒，等待命运的第一个注脚。'), s, [
        { cond: function (s) { return (s.attributes.reputation || 0) >= 65; }, text: T('event.1_2b.branch0.text', null, '此前的好评像底气，让你握话筒的手更稳了些。') },
        { cond: function (s) { return (s.attributes.stress || 0) >= 40; }, text: T('event.1_2b.branch1.text', null, '台下的喧嚣让你手心冒汗，这一晚比想象中更难熬。') }
      ]);
    },
    options: [
      { label: T('event.1_2b.opt0.label', null, 'A：用一记惊艳镇住全场'), hint: T('event.1_2b.opt0.hint', null, '一夜成名，少年锋芒刺痛了整个时代（声誉+15，艺术+5，压力+10）'), effects: { reputation: 15, art: 5, stress: 10 }, next: '1_3' },
      { label: T('event.1_2b.opt1.label', null, 'B：稳稳唱完这首歌'), hint: T('event.1_2b.opt1.hint', null, '得体亮相，留下好感（声誉+8）'), effects: { reputation: 8 }, next: '1_3' },
      { label: T('event.1_2b.opt2.label', null, 'C：紧张到漏了拍'), hint: T('event.1_2b.opt2.hint', null, '青涩的瑕疵被镜头放大（声誉-5，压力+5）'), effects: { reputation: -5, stress: 5 }, next: '1_3' }
    ]
  };

  E['1_3'] = {
    id: '1_3', year: 1969, title: T('event.1_3.title', null, 'Motown 与 Diana Ross'), kind: 'choice',
    text: function (s) {
      return narr(T('event.1_3.text', null, 'Motown 向你招手，Diana Ross 亲手为你引路。大舞台在洛杉矶的那头招手——代价，是与盖瑞的家人隔着整片大陆。'), s, [
        { cond: function (s) { return (s.attributes.family || 0) >= 68; }, text: T('event.1_3.branch0.text', null, '你回头望了望身后的兄弟，离开盖瑞像拔掉一根根细线。') },
        { cond: function (s) { return (s.attributes.reputation || 0) >= 65; }, text: T('event.1_3.branch1.text', null, '名声在你耳边低语：更大的世界，正在等你。') }
      ]);
    },
    options: [
      { label: T('event.1_3.opt0.label', null, 'A：跟着 Diana 奔赴洛杉矶'), hint: T('event.1_3.opt0.hint', null, '声名鹊起、进账可观，但乡愁与疏离渐生（声誉+15，财富+10，家庭-5，压力+15）'), effects: { reputation: 15, wealth: 10, family: -5, stress: 15 }, next: '1_4' },
      { label: T('event.1_3.opt1.label', null, 'B：留在盖瑞，过平凡一生'), hint: T('event.1_3.opt1.hint', null, '放下巨星梦，走向「平凡人生」结局'), effects: {}, next: 'END_PLAIN' },
      { label: T('event.1_3.opt2.label', null, 'C：留在盖瑞，但守着本地的舞台'), hint: T('event.1_3.opt2.hint', null, '亲情安稳，前程另谋（家庭+5，艺术+5）'), effects: { family: 5, art: 5 }, next: '1_4' }
    ]
  };

  E['1_4'] = {
    id: '1_4', year: 1970, title: T('event.1_4.title', null, '四首单曲登顶'), kind: 'auto',
    text: function (s) {
      return narr(T('event.1_4.text', null, '连续四首单曲霸占排行榜冠军，电台里全是你的名字。少年巨星的光芒无可阻挡，连影子都被镁光灯拉长。'), s, [
        { cond: function (s) { return (s.attributes.reputation || 0) >= 80; }, text: T('event.1_4.branch0.text', null, '少年巨星的头衔越来越重，连微笑都被要求完美。') },
        { cond: function (s) { return (s.attributes.stress || 0) >= 45; }, text: T('event.1_4.branch1.text', null, '连轴转的行程让笑容里掺了疲惫，你学会在镜头前藏起倦意。') }
      ]);
    },
    effects: { reputation: 15, wealth: 15, art: 10, stress: 10 }, next: '1_5'
  };

  E['1_5'] = {
    id: '1_5', year: 1971, title: T('event.1_5.title', null, '是否单飞'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.1_5.text', null, '经纪公司递来一份个人合约。单飞意味着挣脱兄弟的影子、握住自己的方向盘，也意味着庆功宴上少了几张熟悉的面孔。'), s, [
        { cond: function (s) { return (s.attributes.family || 0) >= 70; }, text: T('event.1_5.branch0.text', null, '你望向兄弟们，单飞的决定像一把悄悄抽走的椅子。') },
        { cond: function (s) { return (s.attributes.stress || 0) >= 45; }, text: T('event.1_5.branch1.text', null, '被催着做选择的紧迫感，让你格外怀念小时候无忧的合唱。') }
      ]);
    },
    options: [
      { label: T('event.1_5.opt0.label', null, 'A：迈出单飞那一步'), hint: T('event.1_5.opt0.hint', null, '艺术与财富飞跃，兄弟情谊却出现裂痕（艺术+20，财富+15，家庭-15，压力+15）'), effects: { art: 20, wealth: 15, family: -15, stress: 15, rel: { brothers: -15 } }, flags: { isSolo: true }, epilogue: T('event.1_5.opt0.epilogue', null, '麦克风交到你一个人手里，身后的和声忽然空了一块。'), next: '1_6' },
      { label: T('event.1_5.opt1.label', null, 'B：守在 Jackson 5 里'), hint: T('event.1_5.opt1.hint', null, '亲情稳固，安稳生长（家庭+20，艺术+5，财富+5）'), effects: { family: 20, art: 5, wealth: 5, rel: { brothers: 15 } }, flags: { isSolo: false }, epilogue: T('event.1_5.opt1.epilogue', null, '你望了望兄弟，决定把\"我们\"继续写下去。'), next: '2_1' },
      { label: T('event.1_5.opt2.label', null, 'C：半只脚踏出门槛'), hint: T('event.1_5.opt2.hint', null, '兼顾两头，温吞却周全（艺术+10，家庭+10，财富+5）'), effects: { art: 10, family: 10, wealth: 5, rel: { brothers: 8 } }, flags: { isSolo: false }, epilogue: T('event.1_5.opt2.epilogue', null, '你一只脚迈向聚光灯，另一只脚还留在兄弟们的影子里。'), next: '2_1' }
    ]
  };

  E['1_6'] = {
    id: '1_6', year: 1972, title: T('event.1_6.title', null, '早期个人专辑'), kind: 'choice',
    cond: function (s) { return s.flags.isSolo === true; }, fallback: '2_1',
    text: function (s) {
      return narr(T('event.1_6.text', null, '录音室的红灯亮起，你第一次完全为自己的声音做主。母带里藏着的，是“迈克尔·杰克逊”四个字真正独立的宣言。'), s, [
        { cond: function (s) { return (s.attributes.art || 0) >= 60; }, text: T('event.1_6.branch0.text', null, '录音室里你第一次确信：这把声音，只属于你自己。') },
        { cond: function (s) { return (s.attributes.wealth || 0) >= 35; }, text: T('event.1_6.branch1.text', null, '进账的数字让人安心，你开始盘算属于自己的下一步。') }
      ]);
    },
    options: [
      { label: T('event.1_6.opt0.label', null, 'A：反复打磨到完美'), hint: T('event.1_6.opt0.hint', null, '奠定个人风格，钱包与亲情各付代价（艺术+15，财富+10，家庭-5）'), effects: { art: 15, wealth: 10, family: -5 }, flags: { soloAlbum1972: true }, next: '2_1' },
      { label: T('event.1_6.opt1.label', null, 'B：轻松录完交差'), hint: T('event.1_6.opt1.hint', null, '留更多时间给家人（家庭+5，艺术+5）'), effects: { family: 5, art: 5 }, flags: { soloAlbum1972: false }, next: '2_1' }
    ]
  };

  E['1_7'] = {
    id: '1_7', year: 1972, title: T('event.1_7.title', null, '《Ben》奥斯卡提名'), kind: 'choice',
    text: function (s) {
      return narr(T('event.1_7.text', null, '为电影《Ben》演唱的主题曲意外入围奥斯卡。一只银幕上的小老鼠，竟替你叩响了学院的大门。'), s, [
        { cond: function (s) { return (s.attributes.reputation || 0) >= 70; }, text: T('event.1_7.branch0.text', null, '提名像一枚勋章，钉在你越来越响亮的名字上。') },
        { cond: function (s) { return (s.attributes.family || 0) >= 70; }, text: T('event.1_7.branch1.text', null, '你想起家里的弟弟妹妹，银幕上的小老鼠竟让你有点想家。') }
      ]);
    },
    options: [
      { label: T('event.1_7.opt0.label', null, 'A：盛装出席颁奖礼'), hint: T('event.1_7.opt0.hint', null, '体面亮相，聚光灯再添热度（声誉+5，压力+5）'), effects: { reputation: 5, stress: 5 }, next: '2_1' },
      { label: T('event.1_7.opt1.label', null, 'B：闷头泡在录音室'), hint: T('event.1_7.opt1.hint', null, '把荣誉换作下一段旋律（艺术+5）'), effects: { art: 5 }, next: '2_1' },
      { label: T('event.1_7.opt2.label', null, 'C：借话题度营销'), hint: T('event.1_7.opt2.hint', null, '借势涨粉，也暖了人心（声誉+5，家庭+5）'), effects: { reputation: 5, family: 5 }, next: '2_1' }
    ]
  };

  E['1_8'] = {
    id: '1_8', year: 1976, title: T('event.1_8.title', null, '转投 CBS'), kind: 'choice',
    text: function (s) {
      return narr(T('event.1_8.text', null, '组合转投 CBS，改名“The Jacksons”，旧招牌翻作新序章。路怎么走，每个人心里都打着算盘。'), s, [
        { cond: function (s) { return (s.attributes.family || 0) <= 50; }, text: T('event.1_8.branch0.text', null, '与父亲的裂痕还在隐隐作痛，新合约更像一场逃离。') },
        { cond: function (s) { return (s.attributes.reputation || 0) >= 70; }, text: T('event.1_8.branch1.text', null, '名气的惯性推着你往前，团体的船调转了新航向。') }
      ]);
    },
    options: [
      { label: T('event.1_8.opt0.label', null, 'A：拥抱团体的新起点'), hint: T('event.1_8.opt0.hint', null, '家和万事兴（家庭+10，艺术+5）'), effects: { family: 10, art: 5 }, next: '2_1' },
      { label: T('event.1_8.opt1.label', null, 'B：借船出海推自己'), hint: T('event.1_8.opt1.hint', null, '个人声量悄悄上涨（艺术+10，声誉+5）'), effects: { art: 10, reputation: 5 }, next: '2_1' },
      { label: T('event.1_8.opt2.label', null, 'C：和父亲彻底决裂'), hint: T('event.1_8.opt2.hint', null, '挣脱桎梏，也失了来处（家庭-15，压力+10）'), effects: { family: -15, stress: 10 }, next: '2_1' }
    ]
  };

  E['2_1'] = {
    id: '2_1', year: 1978, title: T('event.2_1.title', null, '《新绿野仙踪》'), kind: 'choice',
    text: function (s) {
      if (s.flags.isSolo) {
        return narr(T('event.2_1.text', null, '电影《新绿野仙踪》的片场，你遇见了昆西·琼斯——那个日后与你心跳同频的黄金搭档。'), s, [
          { cond: function (s) { return (s.attributes.art || 0) >= 70; }, text: T('event.2_1.branch0.text', null, '与昆西的同频让你胆子更大，你开始相信没有自己做不到的舞台。') }
        ]);
      }
      return narr(T('event.2_1.text1', null, '兄弟组合参演电影《新绿野仙踪》，家族事业又往前挪了一格。'), s, [
        { cond: function (s) { return (s.attributes.family || 0) >= 75; }, text: T('event.2_1.branch1.text', null, '兄弟并肩的踏实感，是任何独唱都给不了的。') }
      ]);
    },
    options: function (s) {
      if (s.flags.isSolo) {
        return [
          { label: T('event.2_1.opt0.label', null, 'A：倾尽所有去演'), hint: T('event.2_1.opt0.hint', null, '舞台感与口碑双收（艺术+15，声誉+10）'), effects: { art: 15, reputation: 10, rel: { quincy: 10 } }, next: '2_2' },
          { label: T('event.2_1.opt1.label', null, 'B：把重心留给家人'), hint: T('event.2_1.opt1.hint', null, '温暖的角落自有分量（家庭+10）'), effects: { family: 10 }, next: '2_2' },
          { label: T('event.2_1.opt2.label', null, 'C：临时退演护隐私'), hint: T('event.2_1.opt2.hint', null, '避开窥探，留住宁静（家庭+5，压力-5）'), effects: { family: 5, stress: -5 }, next: '2_2' }
        ];
      }
      return [
        { label: T('event.2_1.opt3.label', null, 'A：全心参演'), hint: T('event.2_1.opt3.hint', null, '家族事业更上层楼（艺术+10，家庭+5）'), effects: { art: 10, family: 5 }, next: '2_2' },
        { label: T('event.2_1.opt4.label', null, 'B：低调搭把手'), hint: T('event.2_1.opt4.hint', null, '安稳陪跑（艺术+5，家庭+10）'), effects: { art: 5, family: 10 }, next: '2_2' },
        { label: T('event.2_1.opt5.label', null, 'C：专注组合本身'), hint: T('event.2_1.opt5.hint', null, '兄弟同心（家庭+15）'), effects: { family: 15 }, next: '2_2' }
      ];
    }
  };

  E['2_2'] = {
    id: '2_2', year: 1978, title: T('event.2_2.title', null, '鼻部整形'), kind: 'choice',
    text: function (s) {
      return narr(T('event.2_2.text', null, '镜子里那张脸，被无数镜头反复丈量。你开始怀疑，是不是该按世界的期待，重新雕琢它。'), s, [
        { cond: function (s) { return (s.attributes.reputation || 0) <= 40; }, text: T('event.2_2.branch0.text', null, '外界的闲言像细针，你更想躲进手术室，把不完美的自己修一修。') },
        { cond: function (s) { return (s.attributes.health || 0) <= 50; }, text: T('event.2_2.branch1.text', null, '身体发出的信号你假装没看见，镜中的焦虑却越来越重。') },
        { cond: function (s) { return (s.attributes.art || 0) >= 80; }, text: T('event.2_2.branch2.text', null, '你对着镜子反复揣摩每一个角度，像在雕琢一件即将展出的作品。') },
        { cond: function (s) { return (s.meta.recluse || 0) >= 1; }, text: T('event.2_2.branch3.text', null, '你越来越想藏起这张脸，连镜中的自己都显得陌生。') }
      ]);
    },
    options: [
      { label: T('event.2_2.opt0.label', null, 'A：走进手术室的门'), hint: T('event.2_2.opt0.hint', null, '外形焦虑稍解，外界闲话却起（声誉-5）'), effects: { reputation: -5 }, next: '2_3' },
      { label: T('event.2_2.opt1.label', null, 'B：把健康摆第一'), hint: T('event.2_2.opt1.hint', null, '接纳自己，身心轻盈（健康+10）'), effects: { health: 10 }, next: '2_3' },
      { label: T('event.2_2.opt2.label', null, 'C：一次次动刀'), hint: T('event.2_2.opt2.hint', null, '沉溺改造，身心俱损（声誉-10，健康-5，压力+5）'), effects: { reputation: -10, health: -5, stress: 5 }, next: '2_3' }
    ]
  };

  // —— §17.14 创作企划器：2_3 改为「企划」choice（写 cp_* 画像）——
  E['2_3'] = {
    id: '2_3', year: 1979, title: T('event.2_3.title', null, '《Off The Wall》'), kind: 'choice',
    text: function (s) {
      if (s.flags.isSolo) {
        return narr(T('event.2_3.text', null, '《Off The Wall》横空出世，迪斯科的霓虹里，你站上 solo 生涯的第一座高峰，整个世界开始跟着你的步点摇摆。'), s, [
          { cond: function (s) { return (s.attributes.wealth || 0) >= 50; }, text: T('event.2_3.branch0.text', null, '账户与口碑一同膨胀，你第一次尝到“自由”与“价钱”挂钩的滋味。') }
        ]);
      }
      return T('event.2_3.ret0.text', null, '组合专辑反响不俗，你在团体的和声里稳步成长，掌声虽不独属于你，却也踏实。');
    },
    options: [
      { label: T('event.2_3.opt0.label', null, 'A：概念史诗化，孤注一掷'), hint: T('event.2_3.opt0.hint', null, '艺术与野心拉满（艺术+30，财富+30，声誉+25，压力+10；企划·视野/创新极高）'), effects: function (s) { return s.flags.isSolo ? { art: 30, wealth: 30, reputation: 25, stress: 10 } : { art: 10, wealth: 10, reputation: 5 }; }, flags: { cp_vision: 90, cp_innovation: 85, cp_craft: 70 }, next: '2_4' },
      { label: T('event.2_3.opt1.label', null, 'B：商业稳赢，精准定位'), hint: T('event.2_3.opt1.hint', null, '制作精良、人脉加成（艺术+30，财富+30，声誉+25，压力+10；企划·制作/合作偏高）'), effects: function (s) { return s.flags.isSolo ? { art: 30, wealth: 30, reputation: 25, stress: 10 } : { art: 10, wealth: 10, reputation: 5 }; }, flags: { cp_craft: 85, cp_collab: 80, cp_vision: 65 }, next: '2_4' },
      { label: T('event.2_3.opt2.label', null, 'C：极简实验，以小搏大'), hint: T('event.2_3.opt2.hint', null, '创新拉满、制作克制（艺术+30，财富+30，声誉+25，压力+10；企划·创新极高/制作偏低）'), effects: function (s) { return s.flags.isSolo ? { art: 30, wealth: 30, reputation: 25, stress: 10 } : { art: 10, wealth: 10, reputation: 5 }; }, flags: { cp_innovation: 95, cp_craft: 45, cp_vision: 75 }, next: '2_4' }
    ]
  };

  E['2_4'] = {
    id: '2_4', year: 1979, title: T('event.2_4.title', null, '与 Epic 深度合作'), kind: 'choice', key: true,
    cond: function (s) { return s.flags.isSolo === true; }, fallback: '3_1',
    text: function (s) {
      return narr(T('event.2_4.text', null, '厂牌伸出橄榄枝，邀你更深地绑定。合约的字里行间，藏着创作主导权与自由之间的权衡。'), s, [
        { cond: function (s) { return (s.attributes.wealth || 0) >= 50; }, text: T('event.2_4.branch0.text', null, '腰包渐鼓让你在谈判桌前更有底气，主导权显得触手可及。') },
        { cond: function (s) { return (s.attributes.stress || 0) >= 45; }, text: T('event.2_4.branch1.text', null, '越深的绑定意味着越少的自由，你隐约嗅到代价。') }
      ]);
    },
    options: [
      { label: T('event.2_4.opt0.label', null, 'A：深度绑定 Epic'), hint: T('event.2_4.opt0.hint', null, '话语权与收益齐涨（声誉+10，财富+15）'), effects: { reputation: 10, wealth: 15, rel: { quincy: 12 } }, flags: { epicDeep: true }, next: '2_5' },
      { label: T('event.2_4.opt1.label', null, 'B：保持安全距离'), hint: T('event.2_4.opt1.hint', null, '留白给生活，压力随之退潮（家庭+5，压力-10）'), effects: { family: 5, stress: -10 }, flags: { epicDeep: false }, next: '2_5' },
      { label: T('event.2_4.opt2.label', null, 'C：自创厂牌单干'), hint: T('event.2_4.opt2.hint', null, '野心勃勃，却也烧钱劳神（艺术+10，财富-10，压力+5）'), effects: { art: 10, wealth: -10, stress: 5 }, next: '2_5' }
    ]
  };

  E['2_5'] = {
    id: '2_5', year: 1980, title: T('event.2_5.title', null, '格莱美表演'), kind: 'choice',
    text: function (s) {
      return narr(T('event.2_5.text', null, '格莱美的舞台灯光亮起，这是乐坛最高规格的考场。聚光灯下，每一个转音都被放大检阅。'), s, [
        { cond: function (s) { return (s.attributes.reputation || 0) >= 75; }, text: T('event.2_5.branch0.text', null, '台下的同行都在看你，这一晚的成色关乎你在乐坛的座次。') },
        { cond: function (s) { return (s.attributes.stress || 0) >= 45; }, text: T('event.2_5.branch1.text', null, '聚光灯下的独唱像一场考试，你怕一个走音就前功尽弃。') }
      ]);
    },
    options: [
      { label: T('event.2_5.opt0.label', null, 'A：炫一场技巧独唱'), hint: T('event.2_5.opt0.hint', null, '技惊四座，紧绷感同在（艺术+10，声誉+5，压力+5）'), effects: { art: 10, reputation: 5, stress: 5 }, next: '2_6' },
      { label: T('event.2_5.opt1.label', null, 'B：稳妥完成演出'), hint: T('event.2_5.opt1.hint', null, '得体收官（声誉+5）'), effects: { reputation: 5 }, next: '2_6' },
      { label: T('event.2_5.opt2.label', null, 'C：婉拒独唱安排'), hint: T('event.2_5.opt2.hint', null, '低调退后半步（声誉-3，家庭+3）'), effects: { reputation: -3, family: 3 }, next: '2_6' }
    ]
  };

  // ---------- 主线偏薄章节拓展（g5：GDD §17.3） ----------
  // —— §17.14 格莱美揭晓：2_6 进入即结算 otw（见 planner.resolveGrammy）——
  E['2_6'] = {
    id: '2_6', year: 1981, title: T('event.2_6.title', null, '格莱美加冕之夜'), kind: 'choice', key: true,
    onEnter: function (s) { if (MJ.planner) MJ.planner.resolveGrammy(s, 'otw'); },
    text: function (s) {
      return narr(T('event.2_6.text', null, '格莱美的信封被拆开，你的名字第一次以“最佳”的身份被念出。台下的昆西笑着鼓掌——这段黄金搭档，开始被世人记住。'), s, [
        { cond: function (s) { return (s.attributes.art || 0) >= 80; }, text: T('event.2_6.branch0.text', null, '你握着奖杯，忽然明白，舞台之外还有人懂你的野心。') }
      ]);
    },
    options: [
      { label: T('event.2_6.opt0.label', null, 'A：与昆西举杯共庆'), hint: T('event.2_6.opt0.hint', null, '情谊与声名同酿（艺术+10，声誉+5，昆西好感+10）'), effects: { art: 10, reputation: 5, rel: { quincy: 10 } }, next: '3_1' },
      { label: T('event.2_6.opt1.label', null, 'B：把奖杯献给家人'), hint: T('event.2_6.opt1.hint', null, '荣耀归家（家庭+8，声誉+3）'), effects: { family: 8, reputation: 3 }, next: '3_1' },
      { label: T('event.2_6.opt2.label', null, 'C：趁热规划下一张专辑'), hint: T('event.2_6.opt2.hint', null, '趁热打铁（艺术+12，压力+5）'), effects: { art: 12, stress: 5 }, next: '3_1' }
    ]
  };

  // —— §17.14 创作企划器：3_1 改为「企划」choice，选项写 cp_* 画像（不同维度=不同 flag，天然叠加）——
  E['3_1'] = {
    id: '3_1', year: 1982, title: T('event.3_1.title', null, '《Thriller》'), kind: 'choice',
    text: function (s) {
      if (s.flags.isSolo) {
        return narr(T('event.3_1.text', null, '《Thriller》的企划案摊在桌上。你要如何定义这张将定义时代的专辑？'), s, [
          { cond: function (s) { return (s.attributes.art || 0) >= 85; }, text: T('event.3_1.branch0.text', null, '你隐约感到，这张专辑会把自己钉进历史的某一页。') },
          { cond: function (s) { return (s.meta.mogul || 0) >= 1; }, text: T('event.3_1.branch1.text', null, '商人的直觉在耳边低语：这张唱片，不只是艺术，更是资产。') }
        ]);
      }
      return T('event.3_1.ret0.text', null, '你在团体中参与了这张里程碑专辑的创作，历史的页码里，有你写下的一行。');
    },
    options: [
      { label: T('event.3_1.opt0.label', null, 'A：概念史诗化，孤注一掷'), hint: T('event.3_1.opt0.hint', null, '艺术与野心拉满，预算承压（艺术+30，财富+30，声誉+25，压力+10；企划·视野/创新极高）'), effects: function (s) { return s.flags.isSolo ? { art: 30, wealth: 30, reputation: 25, stress: 10 } : { art: 10, wealth: 10, reputation: 5 }; }, flags: { cp_vision: 90, cp_innovation: 85, cp_craft: 70 }, next: '3_1b' },
      { label: T('event.3_1.opt1.label', null, 'B：商业稳赢，精准定位'), hint: T('event.3_1.opt1.hint', null, '制作精良、人脉加成，野心稍收（艺术+30，财富+30，声誉+25，压力+10；企划·制作/合作偏高）'), effects: function (s) { return s.flags.isSolo ? { art: 30, wealth: 30, reputation: 25, stress: 10 } : { art: 10, wealth: 10, reputation: 5 }; }, flags: { cp_craft: 85, cp_collab: 80, cp_vision: 65 }, next: '3_1b' },
      { label: T('event.3_1.opt2.label', null, 'C：极简实验，以小搏大'), hint: T('event.3_1.opt2.hint', null, '创新拉满、制作克制，赌一把（艺术+30，财富+30，声誉+25，压力+10；企划·创新极高/制作偏低）'), effects: function (s) { return s.flags.isSolo ? { art: 30, wealth: 30, reputation: 25, stress: 10 } : { art: 10, wealth: 10, reputation: 5 }; }, flags: { cp_innovation: 95, cp_craft: 45, cp_vision: 75 }, next: '3_1b' }
    ]
  };

  E['3_1b'] = {
    id: '3_1b', year: 1983, title: T('event.3_1b.title', null, 'Motown 25 月球漫步'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.3_1b.text', null, 'Motown 25 周年直播现场，灯光暗下又骤亮。你决定，把那段藏在袜子里的舞步，献给全世界。'), s, [
        { cond: function (s) { return (s.attributes.art || 0) >= 80; }, text: T('event.3_1b.branch0.text', null, '长久的苦练在这一刻有了出口，脚下的滑步像是早已注定。') },
        { cond: function (s) { return (s.attributes.stress || 0) >= 45; }, text: T('event.3_1b.branch1.text', null, '直播的倒计时逼得心跳失序，你强迫自己把注意力钉在节拍上。') }
      ]);
    },
    options: [
      { label: T('event.3_1b.opt0.label', null, 'A：完美演绎月球漫步'), hint: T('event.3_1b.opt0.hint', null, '一个滑步，滑进了时代记忆（艺术+15，声誉+15，压力+5）'), effects: { art: 15, reputation: 15, stress: 5, rel: { fans: 15 } }, next: '3_1c' },
      { label: T('event.3_1b.opt1.label', null, 'B：保守地完成演出'), hint: T('event.3_1b.opt1.hint', null, '稳扎稳打，松弛自在（声誉+5，压力-5）'), effects: { reputation: 5, stress: -5 }, next: '3_1c' },
      { label: T('event.3_1b.opt2.label', null, 'C：临时换曲避锋芒'), hint: T('event.3_1b.opt2.hint', null, '藏锋守拙，小有所得（艺术+5，声誉+3）'), effects: { art: 5, reputation: 3 }, next: '3_1c' }
    ]
  };

  E['3_1c'] = {
    id: '3_1c', year: 1983, title: T('event.3_1c.title', null, '《Thriller》MV'), kind: 'choice',
    text: function (s) {
      return narr(T('event.3_1c.text', null, '你盘算着为《Thriller》拍一支前所未有的长版音乐录影带——僵尸、巷弄、电影质感，流行乐的边界将被重写。'), s, [
        { cond: function (s) { return (s.attributes.wealth || 0) <= 30; }, text: T('event.3_1c.branch0.text', null, '预算的红线让你在“烧钱”与“克制”之间反复掂量。') },
        { cond: function (s) { return (s.attributes.reputation || 0) >= 80; }, text: T('event.3_1c.branch1.text', null, '你已有底气把 MV 当电影拍，世人会为你的野心买单。') }
      ]);
    },
    options: [
      { label: T('event.3_1c.opt0.label', null, 'A：斥巨资打造长版'), hint: T('event.3_1c.opt0.hint', null, '视觉封神，钱包出血（艺术+10，财富-10，声誉+10）'), effects: { art: 10, wealth: -10, reputation: 10 }, next: '3_2' },
      { label: T('event.3_1c.opt1.label', null, 'B：走传统宣传路线'), hint: T('event.3_1c.opt1.hint', null, '稳妥触达听众（声誉+5）'), effects: { reputation: 5 }, next: '3_2' },
      { label: T('event.3_1c.opt2.label', null, 'C：恐怖元素过界惹议'), hint: T('event.3_1c.opt2.hint', null, '话题拉满，口碑一进一出（压力+5）'), effects: { reputation: 5, stress: 5, reputation: -5 }, next: '3_2' }
    ]
  };

  E['3_2'] = {
    id: '3_2', year: 1984, title: T('event.3_2.title', null, '百事广告'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.3_2.text', null, '百事可乐的合约铺开红毯，片场的聚光灯比演唱会还刺眼。谁也没料到，那一簇火苗会改写此后的人生。'), s, [
        { cond: function (s) { return (s.attributes.stress || 0) >= 45; }, text: T('event.3_2.branch0.text', null, '连广告片场都透着紧绷，你比谁都清楚，风光背后总有代价。') }
      ]);
    },
    options: [
      { label: T('event.3_2.opt0.label', null, 'A：接拍并意外烧伤'), hint: T('event.3_2.opt0.hint', null, '进账与名气兼得，却埋下伤痛伏笔（触发烧伤线）（财富+20，声誉+5）'), effects: { wealth: 20, reputation: 5, rel: { fans: 5 } }, flags: { isPepsiBurned: true }, epilogue: T('event.3_2.opt0.epilogue', null, '片场的火苗舔过皮肤，那一刻的惊呼，成了此后多年都挥不去的回音。'), next: '3_2b' },
      { label: T('event.3_2.opt1.label', null, 'B：安全优先拒拍'), hint: T('event.3_2.opt1.hint', null, '护住身体，丢了广告费（健康+10，财富-20）'), effects: { health: 10, wealth: -20 }, flags: { isPepsiBurned: false }, epilogue: T('event.3_2.opt1.epilogue', null, '你绕开了那簇火，却也错过了一次让名字更深入人心的机会。'), next: '3_2b' },
      { label: T('event.3_2.opt2.label', null, 'C：议价安全拍摄'), hint: T('event.3_2.opt2.hint', null, '皆大欢喜的折中（财富+5，健康+5）'), effects: { wealth: 5, health: 5 }, flags: { isPepsiBurned: false }, epilogue: T('event.3_2.opt2.epilogue', null, '你在安全与曝光间找到了平衡点，片场圆满收工。'), next: '3_2b' },
      { label: T('event.3_2.opt3.label', null, 'D：若那簇火没烧到你（架空想象）'), hint: T('event.3_2.opt3.hint', null, '改写此后数十年的伏笔（健康+8，压力-5）'), effects: { health: 8, stress: -5 }, flags: { isPepsiBurned: false }, epilogue: T('event.3_2.opt3.epilogue', null, '你闭上眼，想象片场那一捧火苗没有舔到皮肤——有些痛，本可以不开始。'), next: '3_2b' }
    ]
  };

  // —— §17.14 巡演自定义：Victory 巡演选项写入 cp_stagecraft（舞台呈现），联动 3_3 格莱美结算 ——
  E['3_2b'] = {
    id: '3_2b', year: 1984, title: T('event.3_2b.title', null, 'Victory 巡演'), kind: 'choice',
    text: function (s) {
      return narr(T('event.3_2b.text', null, 'Victory 巡演启程，这是与兄弟们久违的同台。后台的喧闹里，血缘的回声格外清晰。'), s, [
        { cond: function (s) { return (s.attributes.family || 0) >= 75; }, text: T('event.3_2b.branch0.text', null, '与兄弟同台让你想起最初的那个组合，血缘的回声格外清晰。') },
        { cond: function (s) { return (s.attributes.wealth || 0) >= 60; }, text: T('event.3_2b.branch1.text', null, '巡演的票房数字亮眼，但你也尝到被行程绑架的滋味。') }
      ]);
    },
    options: [
      { label: T('event.3_2b.opt0.label', null, 'A：全心投入家族巡演'), hint: T('event.3_2b.opt0.hint', null, '亲情与票房双丰收（家庭+15，财富+15，压力+10）'), effects: { family: 15, wealth: 15, stress: 10 }, flags: { cp_stagecraft: 80 }, next: '3_3' },
      { label: T('event.3_2b.opt1.label', null, 'B：敷衍走完流程'), hint: T('event.3_2b.opt1.hint', null, '例行公事（家庭+5，财富+5）'), effects: { family: 5, wealth: 5 }, flags: { cp_stagecraft: 45 }, next: '3_3' },
      { label: T('event.3_2b.opt2.label', null, 'C：借台推个人光芒'), hint: T('event.3_2b.opt2.hint', null, '锋芒外露，兄弟微凉（艺术+10，声誉+5，家庭-5）'), effects: { art: 10, reputation: 5, family: -5 }, flags: { cp_stagecraft: 70 }, next: '3_3' }
    ]
  };

  // —— §17.14 格莱美揭晓：onEnter 在展示前结算（见 planner.resolveGrammy），text 按座数分档叙事 ——
  E['3_3'] = {
    id: '3_3', year: 1984, title: T('event.3_3.title', null, '格莱美之夜'), kind: 'auto',
    onEnter: function (s) { if (MJ.planner) MJ.planner.resolveGrammy(s, 'thriller'); },
    text: function (s) {
      if (!s.flags.isSolo) return T('event.3_3.ret0.text', null, '荣誉之夜，组合与你共享掌声，奖杯的反光里映着几张并肩的笑脸。');
      var w = s.flags.grammy_thriller || 0;
      if (w >= 6) return T('event.3_3.sweep.text', null, '凭《Thriller》一夜独揽 ' + w + ' 座格莱美，史无前例的加冕。领奖台的光，几乎要把人灼伤。');
      if (w >= 3) return T('event.3_3.multi.text', null, '《Thriller》为你赢得 ' + w + ' 座格莱美，乐坛的座次就此改写。');
      if (w >= 1) return T('event.3_3.minor.text', null, '格莱美之夜，你捧回 ' + w + ' 座奖杯——不算横扫，却已登堂入室。');
      return T('event.3_3.none.text', null, '提名名单上有你的名字，但最终铩羽而归。闪光灯外的那一瞬，你听见了沉默。');
    },
    next: '3_4'
  };

  E['3_4'] = {
    id: '3_4', year: 1985, title: T('event.3_4.title', null, '烧伤治疗'), kind: 'choice',
    cond: function (s) { return s.flags.isPepsiBurned === true; }, fallback: '3_5',
    text: function (s) {
      return narr(T('event.3_4.text', null, '片场的灼伤仍在作痛，止痛药物顺着静脉，悄悄成了你离不开的拐杖。'), s, [
        { cond: function (s) { return (s.attributes.health || 0) <= 45; }, text: T('event.3_4.branch0.text', null, '身体已经记不清健康的滋味，药物成了唯一肯陪在你身边的东西。') }
      ]);
    },
    options: [
      { label: T('event.3_4.opt0.label', null, 'A：依赖药物止痛'), hint: T('event.3_4.opt0.hint', null, '痛楚暂退，却走上依赖之途（触发依赖）（健康+10，压力-10）'), effects: { health: 10, stress: -10 }, flags: { painkillerDependent: true }, next: '3_5' },
      { label: T('event.3_4.opt1.label', null, 'B：硬扛着治疗'), hint: T('event.3_4.opt1.hint', null, '清醒却煎熬（健康+5，压力+15）'), effects: { health: 5, stress: 15 }, flags: { painkillerDependent: false }, next: '3_5' },
      { label: T('event.3_4.opt2.label', null, 'C：全面康复疗养'), hint: T('event.3_4.opt2.hint', null, '慢养回元气，破费不少（健康+15，财富-10，压力-5）'), effects: { health: 15, wealth: -10, stress: -5 }, flags: { painkillerDependent: false }, next: '3_5' }
    ]
  };

  E['3_5'] = {
    id: '3_5', year: 1985, title: T('event.3_5.title', null, 'We Are The World'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.3_5.text', null, '群星在录音棚里排成一列，为远方的非洲唱一首《We Are The World》。那一刻，流行乐第一次觉得自己能改变点什么。'), s, [
        { cond: function (s) { return (s.attributes.reputation || 0) >= 80; }, text: T('event.3_5.branch0.text', null, '名气让你的一句倡议就能掀起风浪，公益因此格外有力。') },
        { cond: function (s) { return (s.attributes.wealth || 0) >= 60; }, text: T('event.3_5.branch1.text', null, '你大可以只写一张支票，但那一刻你更想亲口唱出那份心意。') },
        { cond: function (s) { return (s.meta.phil || 0) >= 1; }, text: T('event.3_5.branch2.text', null, '早已习惯把聚光灯让给更需要的人，这一晚你唱得格外轻。') },
        { cond: function (s) { return (s.meta.recluse || 0) >= 1; }, text: T('event.3_5.branch3.text', null, '人群让你局促，可面对苦难，你又舍不得退到镜头之外。') }
      ]);
    },
    options: [
      { label: T('event.3_5.opt0.label', null, 'A：倾情义唱'), hint: T('event.3_5.opt0.hint', null, '善名远扬，爱心+1（声誉+15，家庭+5，慈善+1）'), effects: { reputation: 15, family: 5, phil: 1, rel: { fans: 8 } }, flags: { weAreTheWorld: true }, next: '3_6' },
      { label: T('event.3_5.opt1.label', null, 'B：婉拒这份邀约'), hint: T('event.3_5.opt1.hint', null, '退回自己的旋律里（艺术+5）'), effects: { art: 5 }, next: '3_6' },
      { label: T('event.3_5.opt2.label', null, 'C：独自捐出巨款'), hint: T('event.3_5.opt2.hint', null, '不露面也行善，爱心+1（声誉+10，财富-15，慈善+1）'), effects: { reputation: 10, wealth: -15, phil: 1 }, next: '3_6' }
    ]
  };

  E['3_6'] = {
    id: '3_6', year: 1985, title: T('event.3_6.title', null, '收购 ATV 版权'), kind: 'choice', key: true,
    cond: function (s) { return s.flags.isSolo === true; }, fallback: '4_0',
    text: function (s) {
      return narr(T('event.3_6.text', null, '机会来了：买下包含披头士作品的 ATV 版权目录。这不只是生意，更是把音乐版图纳入掌心的野心。'), s, [
        { cond: function (s) { return (s.attributes.wealth || 0) >= 60; }, text: T('event.3_6.branch0.text', null, '手头的宽裕让你有底气把这张版权网整个揽下。') },
        { cond: function (s) { return (s.meta.mogul || 0) >= 1; }, text: T('event.3_6.branch1.text', null, '商人的直觉已经在你心里生根，这桩买卖看起来理所当然。') }
      ]);
    },
    options: [
      { label: T('event.3_6.opt0.label', null, 'A：全资收购'), hint: T('event.3_6.opt0.hint', null, '落下商业帝国的基石（商业+1）（声誉+10，资金 -2250 万）'), effects: { wealth: -15, reputation: 10, mogul: 1 }, flags: { atvBought: true }, next: '4_0' },
      { label: T('event.3_6.opt1.label', null, 'B：暂不收购'), hint: T('event.3_6.opt1.hint', null, '按兵不动，现金充裕（财富+5）'), effects: { wealth: 5 }, flags: { atvBought: false }, next: '4_0' },
      { label: T('event.3_6.opt2.label', null, 'C：联合财团分期吃下'), hint: T('event.3_6.opt2.hint', null, '以小博大，商业嗅觉+1（商业+1）（财富-5，声誉+5）'), effects: { wealth: -5, reputation: 5, mogul: 1 }, next: '4_0' }
    ]
  };

  E['4_0'] = {
    id: '4_0', year: 1986, title: T('event.4_0.title', null, '《Captain EO》'), kind: 'choice',
    text: function (s) {
      return narr(T('event.4_0.text', null, '迪士尼递来一纸合约，邀你主演 3D 短片《Captain EO》。科幻与歌舞的跨界，是一次冒险，也是一次玩具箱里的童心。'), s, [
        { cond: function (s) { return (s.attributes.art || 0) >= 80; }, text: T('event.4_0.branch0.text', null, '你恨不得把每个镜头都变成自己的画布。') },
        { cond: function (s) { return (s.attributes.wealth || 0) >= 60; }, text: T('event.4_0.branch1.text', null, '片酬的数字你已不太在意，好玩才最重要。') }
      ]);
    },
    options: [
      { label: T('event.4_0.opt0.label', null, 'A：接下这趟星际任务'), hint: T('event.4_0.opt0.hint', null, '银幕形象再添一笔（艺术+10，声誉+5）'), effects: { art: 10, reputation: 5 }, flags: { captainEO: true }, next: '4_1' },
      { label: T('event.4_0.opt1.label', null, 'B：专心做音乐'), hint: T('event.4_0.opt1.hint', null, '回归老本行（艺术+5）'), effects: { art: 5 }, next: '4_1' },
      { label: T('event.4_0.opt2.label', null, 'C：开出天价片酬'), hint: T('event.4_0.opt2.hint', null, '腰包鼓了，风评略凉（财富+10，声誉-3）'), effects: { wealth: 10, reputation: -3 }, next: '4_1' }
    ]
  };

  E['4_1'] = {
    id: '4_1', year: 1987, title: T('event.4_1.title', null, '梦幻庄园'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.4_1.text', null, '你在加州买下一座庄园，取名“Neverland”——一个属于童真、旋转木马与欢笑的乌托邦。'), s, [
        { cond: function (s) { return (s.attributes.family || 0) >= 70; }, text: T('event.4_1.branch0.text', null, '你想象着孩子们的笑声填满庄园，那画面比任何舞台都动人。') },
        { cond: function (s) { return (s.attributes.wealth || 0) <= 30; }, text: T('event.4_1.branch1.text', null, '账上的余额让你在签字时犹豫了一瞬——这座乌托邦不便宜。') }
      ]);
    },
    options: [
      { label: T('event.4_1.opt0.label', null, 'A：对公众敞开大门'), hint: T('event.4_1.opt0.hint', null, '孩子们的乐园，钱包的窟窿（家庭+20，财富-30）'), effects: { family: 20, wealth: -30 }, flags: { neverlandType: 'public' }, next: '4_2' },
      { label: T('event.4_1.opt1.label', null, 'B：圈起私人天地'), hint: T('event.4_1.opt1.hint', null, '留一方静土（财富-20，家庭+5，隐士+1）'), effects: { wealth: -20, family: 5, recluse: 1 }, flags: { neverlandType: 'private' }, next: '4_2' },
      { label: T('event.4_1.opt2.label', null, 'C：干脆不购置'), hint: T('event.4_1.opt2.hint', null, '无牵无挂，现金在手（财富+10）'), effects: { wealth: 10 }, flags: { neverlandType: 'none' }, next: '4_2' }
    ]
  };

  // —— §17.14 创作企划器：4_2 改为「企划」choice（写 cp_* 画像）——
  E['4_2'] = {
    id: '4_2', year: 1987, title: T('event.4_2.title', null, '《Bad》'), kind: 'choice',
    text: function (s) {
      if (s.flags.isSolo) {
        return narr(T('event.4_2.text', null, '《Bad》与空前规模的全球巡演接踵而至，体育场的人海为你起伏，巅峰的风景既壮美也孤独。'), s, [
          { cond: function (s) { return (s.attributes.stress || 0) >= 55; }, text: T('event.4_2.branch0.text', null, '空前的巡演规模背后，是空前的疲惫，你在掌声里偷偷数着还能撑多久。') }
        ]);
      }
      return T('event.4_2.ret0.text', null, '组合新专辑延续热度，和声里的你，仍在稳步向前。');
    },
    options: [
      { label: T('event.4_2.opt0.label', null, 'A：概念史诗化，孤注一掷'), hint: T('event.4_2.opt0.hint', null, '艺术与野心拉满（艺术+30，财富+30，声誉+25，压力+10；企划·视野/创新极高）'), effects: function (s) { return s.flags.isSolo ? { art: 30, wealth: 30, reputation: 25, stress: 10 } : { art: 10, wealth: 10, reputation: 5 }; }, flags: { cp_vision: 90, cp_innovation: 85, cp_craft: 70 }, next: '4_2a' },
      { label: T('event.4_2.opt1.label', null, 'B：商业稳赢，精准定位'), hint: T('event.4_2.opt1.hint', null, '制作精良、人脉加成（艺术+30，财富+30，声誉+25，压力+10；企划·制作/合作偏高）'), effects: function (s) { return s.flags.isSolo ? { art: 30, wealth: 30, reputation: 25, stress: 10 } : { art: 10, wealth: 10, reputation: 5 }; }, flags: { cp_craft: 85, cp_collab: 80, cp_vision: 65 }, next: '4_2a' },
      { label: T('event.4_2.opt2.label', null, 'C：极简实验，以小搏大'), hint: T('event.4_2.opt2.hint', null, '创新拉满、制作克制（艺术+30，财富+30，声誉+25，压力+10；企划·创新极高/制作偏低）'), effects: function (s) { return s.flags.isSolo ? { art: 30, wealth: 30, reputation: 25, stress: 10 } : { art: 10, wealth: 10, reputation: 5 }; }, flags: { cp_innovation: 95, cp_craft: 45, cp_vision: 75 }, next: '4_2a' }
    ]
  };

  E['4_2a'] = {
    id: '4_2a', year: 1988, title: T('event.4_2a.title', null, '《Bad》世界巡演'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.4_2a.text', null, '《Bad》世界巡演横跨四大洲、逾百场，是你单飞后第一次全球 solo 远征。体育场的人海为你起伏，也把孤独放大成回声。'), s, [
        { cond: function (s) { return (s.attributes.stress || 0) >= 55; }, text: T('event.4_2a.branch0.text', null, '空前的巡演规模背后，是空前的疲惫，你在掌声里偷偷数着还能撑多久。') },
        { cond: function (s) { return (s.attributes.art || 0) >= 80; }, text: T('event.4_2a.branch1.text', null, '每一场落幕，你都更确信：舞台，是你与世界对话的唯一语言。') }
      ]);
    },
    options: [
      { label: T('event.4_2a.opt0.label', null, 'A：倾尽所有燃爆现场'), hint: T('event.4_2a.opt0.hint', null, '传奇加身，身心透支（声誉+12，财富+20，压力+15；巡演·舞台呈现极高）'), effects: { reputation: 12, wealth: 20, stress: 15 }, flags: { cp_stagecraft: 80 }, next: '4_2a_g' },
      { label: T('event.4_2a.opt1.label', null, 'B：张弛有度保身体'), hint: T('event.4_2a.opt1.hint', null, '稳扎稳打（声誉+6，财富+10，压力+5；巡演·舞台呈现偏低）'), effects: { reputation: 6, wealth: 10, stress: 5 }, flags: { cp_stagecraft: 45 }, next: '4_2a_g' },
      { label: T('event.4_2a.opt2.label', null, 'C：借巡演做慈善场'), hint: T('event.4_2a.opt2.hint', null, '把光分给更需要的人，爱心+1（声誉+8，慈善+1；巡演·舞台呈现偏高）'), effects: { reputation: 8, phil: 1 }, flags: { cp_stagecraft: 70 }, next: '4_2a_g' }
    ]
  };
  E['4_2b'] = {
    id: '4_2b', year: 1988, title: T('event.4_2b.title', null, '《Moonwalker》'), kind: 'choice',
    text: function (s) {
      return narr(T('event.4_2b.text', null, '你筹备电影《Moonwalker》与那支标志性的《Smooth Criminal》。大银幕，是你又一块想要征服的画布。'), s, [
        { cond: function (s) { return (s.attributes.reputation || 0) >= 80; }, text: T('event.4_2b.branch0.text', null, '你确信大银幕会接住你所有的野心。') },
        { cond: function (s) { return (s.attributes.stress || 0) >= 50; }, text: T('event.4_2b.branch1.text', null, '又一部作品的重量压上来，你学会在透支与完美间走钢丝。') }
      ]);
    },
    options: [
      { label: T('event.4_2b.opt0.label', null, 'A：电影化地呈现'), hint: T('event.4_2b.opt0.hint', null, '视听盛宴，口碑与疲惫齐来（艺术+12，声誉+8，压力+5）'), effects: { art: 12, reputation: 8, stress: 5 }, flags: { moonwalker: true }, next: '4_3' },
      { label: T('event.4_2b.opt1.label', null, 'B：只发单曲'), hint: T('event.4_2b.opt1.hint', null, '收束野心（艺术+8）'), effects: { art: 8 }, next: '4_3' },
      { label: T('event.4_2b.opt2.label', null, 'C：邀童星搭档惹议'), hint: T('event.4_2b.opt2.hint', null, '话题升温，闲言也起（声誉+5，压力+5）'), effects: { reputation: 5, stress: 5 }, next: '4_3' }
    ]
  };

  E['4_3'] = {
    id: '4_3', year: 1988, title: T('event.4_3.title', null, '自传《月球漫步》'), kind: 'auto',
    text: function (s) {
      return narr(T('event.4_3.text', null, '自传《月球漫步》出版，你第一次亲手掀开帷幕，把那个被万花筒扭曲的自己，原原本本讲给世人听。'), s, [
        { cond: function (s) { return (s.attributes.reputation || 0) <= 45; }, text: T('event.4_3.branch0.text', null, '你比谁都渴望被理解，自传是你递给世界的那封长信。') },
        { cond: function (s) { return (s.attributes.reputation || 0) >= 80; }, text: T('event.4_3.branch1.text', null, '功成名就后再回望，笔下的自己竟也有了几分陌生。') }
      ]);
    },
    effects: { reputation: 10, wealth: 5 }, next: '5_1'
  };

  E['4_4'] = {
    id: '4_4', year: 1989, title: T('event.4_4.title', null, '后《Bad》时代'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.4_4.text', null, '《Bad》的余温还在，世界已经把你看作流行乐的代名词。站在 1989 的十字路口，你要想想，接下来的名字该写向哪里。'), s, [
        { cond: function (s) { return (s.meta.mogul || 0) >= 1; }, text: T('event.4_4.branch0.text', null, '商人的直觉告诉你，名气之外还有更大的版图可画。') }
      ]);
    },
    options: [
      { label: T('event.4_4.opt0.label', null, 'A：乘势扩展商业版图'), hint: T('event.4_4.opt0.hint', null, '把名气换成版图（财富+15，声誉+5，商业巨擘+1）'), effects: { wealth: 15, reputation: 5, mogul: 1 }, next: '5_1' },
      { label: T('event.4_4.opt1.label', null, 'B：沉淀回归家庭'), hint: T('event.4_4.opt1.hint', null, '名利之外有归处（家庭+10，压力-5）'), effects: { family: 10, stress: -5 }, next: '5_1' },
      { label: T('event.4_4.opt2.label', null, 'C：筹备更先锋的作品'), hint: T('event.4_4.opt2.hint', null, '向未知突围（艺术+12，压力+5）'), effects: { art: 12, stress: 5 }, next: '5_1' }
    ]
  };

  // —— §17.14 创作企划器：5_1 改为「企划」choice（写 cp_* 画像）——
  E['5_1'] = {
    id: '5_1', year: 1991, title: T('event.5_1.title', null, '《Dangerous》'), kind: 'choice',
    text: function (s) {
      if (s.flags.isSolo) {
        return narr(T('event.5_1.text', null, '《Dangerous》延续着商业与艺术的双高峰，新的节拍里，你仍是那个定义潮流的人。'), s, [
          { cond: function (s) { return (s.attributes.art || 0) >= 85; }, text: T('event.5_1.branch0.text', null, '你已站在属于自己的山巅，却也好奇下一座峰在哪里。') }
        ]);
      }
      return T('event.5_1.ret0.text', null, '组合新专辑稳步前行，和声依旧稳当。');
    },
    options: [
      { label: T('event.5_1.opt0.label', null, 'A：概念史诗化，孤注一掷'), hint: T('event.5_1.opt0.hint', null, '艺术与野心拉满（艺术+30，财富+30，声誉+25，压力+10；企划·视野/创新极高）'), effects: function (s) { return s.flags.isSolo ? { art: 30, wealth: 30, reputation: 25, stress: 10 } : { art: 10, wealth: 10, reputation: 5 }; }, flags: { cp_vision: 90, cp_innovation: 85, cp_craft: 70 }, next: '5_1b' },
      { label: T('event.5_1.opt1.label', null, 'B：商业稳赢，精准定位'), hint: T('event.5_1.opt1.hint', null, '制作精良、人脉加成（艺术+30，财富+30，声誉+25，压力+10；企划·制作/合作偏高）'), effects: function (s) { return s.flags.isSolo ? { art: 30, wealth: 30, reputation: 25, stress: 10 } : { art: 10, wealth: 10, reputation: 5 }; }, flags: { cp_craft: 85, cp_collab: 80, cp_vision: 65 }, next: '5_1b' },
      { label: T('event.5_1.opt2.label', null, 'C：极简实验，以小搏大'), hint: T('event.5_1.opt2.hint', null, '创新拉满、制作克制（艺术+30，财富+30，声誉+25，压力+10；企划·创新极高/制作偏低）'), effects: function (s) { return s.flags.isSolo ? { art: 30, wealth: 30, reputation: 25, stress: 10 } : { art: 10, wealth: 10, reputation: 5 }; }, flags: { cp_innovation: 95, cp_craft: 45, cp_vision: 75 }, next: '5_1b' }
    ]
  };

  E['5_1b'] = {
    id: '5_1b', year: 1991, title: T('event.5_1b.title', null, '《Black or White》'), kind: 'choice',
    text: function (s) {
      return narr(T('event.5_1b.text', null, '新单曲《Black or White》的 MV 引发热议，种族与身份的隐喻，被你揉进了一段变脸的魔法里。'), s, [
        { cond: function (s) { return (s.attributes.reputation || 0) >= 80; }, text: T('event.5_1b.branch0.text', null, '你的一举一动都被放大解读，连一段 MV 都能掀起风暴。') },
        { cond: function (s) { return (s.attributes.stress || 0) >= 50; }, text: T('event.5_1b.branch1.text', null, '争议像潮水，你不确定自己是弄潮儿还是被卷走的人。') }
      ]);
    },
    options: [
      { label: T('event.5_1b.opt0.label', null, 'A：用挑衅的意象表达'), hint: T('event.5_1b.opt0.hint', null, '锋芒毕露，议论四起（声誉+5，压力+5）'), effects: { reputation: 5, stress: 5 }, next: '5_2' },
      { label: T('event.5_1b.opt1.label', null, 'B：温和地呈现'), hint: T('event.5_1b.opt1.hint', null, '四平八稳（声誉+5）'), effects: { reputation: 5 }, next: '5_2' },
      { label: T('event.5_1b.opt2.label', null, 'C：末段动作引争议'), hint: T('event.5_1b.opt2.hint', null, '过界惹议，口碑小损（声誉-5，压力+5）'), effects: { reputation: -5, stress: 5 }, next: '5_2' }
    ]
  };

  // —— §17.14 巡演自定义：5_2 由 auto 改 choice，选项写 cp_stagecraft（舞台呈现）——
  E['5_2'] = {
    id: '5_2', year: 1992, title: T('event.5_2.title', null, '危险之旅巡演'), kind: 'choice',
    text: function (s) {
      return narr(T('event.5_2.text', null, '“危险之旅”全球巡演拉开帷幕，城市的名字在行程表上连成一条发光的线，连轴转的疲惫也跟着发光。'), s, [
        { cond: function (s) { return (s.attributes.wealth || 0) >= 70; }, text: T('event.5_2.branch0.text', null, '巡演的进账令人眩目，但连轴转的行程也在悄悄收利息。') },
        { cond: function (s) { return (s.attributes.stress || 0) >= 55; }, text: T('event.5_2.branch1.text', null, '城市的名字在行程表上连成发光的线，也连成越来越长的疲惫。') }
      ]);
    },
    options: [
      { label: T('event.5_2.opt0.label', null, 'A：倾尽所有燃爆现场'), hint: T('event.5_2.opt0.hint', null, '传奇加身，身心透支（声誉+12，财富+25，压力+20；巡演·舞台呈现极高）'), effects: { reputation: 12, wealth: 25, stress: 20 }, flags: { cp_stagecraft: 80 }, next: '5_2g' },
      { label: T('event.5_2.opt1.label', null, 'B：张弛有度保身体'), hint: T('event.5_2.opt1.hint', null, '稳扎稳打（声誉+6，财富+15，压力+10；巡演·舞台呈现偏低）'), effects: { reputation: 6, wealth: 15, stress: 10 }, flags: { cp_stagecraft: 45 }, next: '5_2g' },
      { label: T('event.5_2.opt2.label', null, 'C：巡演结合公益'), hint: T('event.5_2.opt2.hint', null, '善名远播，爱心+1（声誉+8，慈善+1；巡演·舞台呈现偏高）'), effects: { reputation: 8, phil: 1 }, flags: { cp_stagecraft: 70 }, next: '5_2g' }
    ]
  };

  E['5_2b'] = {
    id: '5_2b', year: 1992, title: T('event.5_2b.title', null, 'Heal the World 基金会'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.5_2b.text', null, '你创立 Heal the World 基金会，想把舞台上的爱，分一点给那些够不着灯光的孩子。'), s, [
        { cond: function (s) { return (s.meta.phil || 0) >= 1; }, text: T('event.5_2b.branch0.text', null, '公益的火苗已经点燃，这一次你只是往里添了更多柴。') },
        { cond: function (s) { return (s.attributes.reputation || 0) >= 80; }, text: T('event.5_2b.branch1.text', null, '善名与你互为背书，世界愿意相信你的善意。') }
      ]);
    },
    options: [
      { label: T('event.5_2b.opt0.label', null, 'A：全身心投入'), hint: T('event.5_2b.opt0.hint', null, '善名与牵挂同增，爱心+1（声誉+15，家庭+5，压力+5，慈善+1）'), effects: { reputation: 15, family: 5, stress: 5, phil: 1, rel: { fans: 12 } }, flags: { healWorld: true }, next: '5_2c' },
      { label: T('event.5_2b.opt1.label', null, 'B：仅挂名参与'), hint: T('event.5_2b.opt1.hint', null, '轻描淡写（声誉+5）'), effects: { reputation: 5 }, next: '5_2c' },
      { label: T('event.5_2b.opt2.label', null, 'C：高调营销慈善'), hint: T('event.5_2b.opt2.hint', null, '流量与爱心齐涨，爱心+1（声誉+10，压力+5，慈善+1）'), effects: { reputation: 10, stress: 5, phil: 1 }, next: '5_2c' }
    ]
  };

  E['5_2c'] = {
    id: '5_2c', year: 1993, title: T('event.5_2c.title', null, '超级碗中场秀'), kind: 'choice',
    text: function (s) {
      return narr(T('event.5_2c.text', null, '超级碗中场秀，上亿双眼睛在同一秒望向你。这是体育与流行乐交会的顶点。'), s, [
        { cond: function (s) { return (s.attributes.family || 0) >= 70; }, text: T('event.5_2c.branch0.text', null, '你特意为孩子们留出合唱的位置，那一刻台下比台上更暖。') },
        { cond: function (s) { return (s.attributes.reputation || 0) >= 80; }, text: T('event.5_2c.branch1.text', null, '上亿双眼睛里，你看见自己已成为某种全民记忆。') }
      ]);
    },
    options: [
      { label: T('event.5_2c.opt0.label', null, 'A：奉上一场盛典'), hint: T('event.5_2c.opt0.hint', null, '惊艳全国，艺术与声名齐飞（艺术+10，声誉+15）'), effects: { art: 10, reputation: 15, rel: { fans: 15 } }, next: '5_2d' },
      { label: T('event.5_2c.opt1.label', null, 'B：低调呈现'), hint: T('event.5_2c.opt1.hint', null, '稳妥收场（声誉+5）'), effects: { reputation: 5 }, next: '5_2d' },
      { label: T('event.5_2c.opt2.label', null, 'C：邀请童声合唱团'), hint: T('event.5_2c.opt2.hint', null, '纯真共鸣，暖意融融（声誉+10，家庭+5）'), effects: { reputation: 10, family: 5, rel: { fans: 8 } }, next: '5_2d' }
    ]
  };

  E['5_2d'] = {
    id: '5_2d', year: 1993, title: T('event.5_2d.title', null, 'Oprah 访谈'), kind: 'choice',
    text: function (s) {
      return narr(T('event.5_2d.text', null, 'Oprah 的访谈席对面，坐着九千万名观众。这是一个把伤口摊开、也可能被误解的赌注。'), s, [
        { cond: function (s) { return (s.attributes.reputation || 0) <= 50; }, text: T('event.5_2d.branch0.text', null, '你愈发觉得，世人只看得到他们想看的那个你。') },
        { cond: function (s) { return (s.attributes.stress || 0) >= 50; }, text: T('event.5_2d.branch1.text', null, '把伤口摊开的勇气，是用成倍的紧绷换来的。') }
      ]);
    },
    options: [
      { label: T('event.5_2d.opt0.label', null, 'A：坦诚聊白癜风与童年'), hint: T('event.5_2d.opt0.hint', null, '卸下伪装换来理解，却也透支（声誉+20，压力+10）'), effects: { reputation: 20, stress: 10, media: 6 }, flags: { oprahOpen: true }, next: '5_3' },
      { label: T('event.5_2d.opt1.label', null, 'B：绕开敏感话题'), hint: T('event.5_2d.opt1.hint', null, '体面，却隔了一层（声誉+5，压力+5）'), effects: { reputation: 5, stress: 5, media: 2 }, next: '5_3' },
      { label: T('event.5_2d.opt2.label', null, 'C：拒访守住神秘'), hint: T('event.5_2d.opt2.hint', null, '退入孤独，隐士之心+1（声誉-8，压力-5，隐士+1）'), effects: { reputation: -8, stress: -5, recluse: 1, media: -4 }, next: '5_3' }
    ]
  };

  E['5_3'] = {
    id: '5_3', year: 1993, title: T('event.5_3.title', null, '1993 年民事指控'), kind: 'choice', key: true,
    cond: function (s) { return s.flags.isSolo === true && s.flags.neverlandType !== 'none'; }, fallback: '5_5',
    text: function (s) {
      if (s.flags.isSolo === true && s.flags.neverlandType !== 'none') {
        var t = T('event.5_3.text', null, '1993 年，一名少年家属对你提出民事指控，警方的搜查令敲开了庄园的门。舆论的镜头，第一次对准了你最不想被看见的角落。');
        if ((s.attributes.reputation || 0) <= 50) t += T('event.5_3.branch0.text', null, '\n本就蒙尘的名声，经不起再一场风暴。');
        return t + T('event.5_3.ask.text', null, '\n你将如何应对？');
      }
      return T('event.5_3.ret0.text', null, '你未购置庄园且始终与兄弟并肩，相关民事指控未曾发生。');
    },
    options: [
      { label: T('event.5_3.opt0.label', null, 'A：达成庭外和解'), hint: T('event.5_3.opt0.hint', null, '支付和解费用，声誉重创，压力陡增（声誉-35，压力+20，净资产 -2300 万）'), effects: { reputation: -35, stress: 20, media: -15 }, moneyEffect: -2300, flags: { settlement1993: true }, next: '5_4' },
      { label: T('event.5_3.opt1.label', null, 'B：应诉到底'), hint: T('event.5_3.opt1.hint', null, '硬刚法庭，心力交瘁（压力+30）'), effects: { stress: 30, media: -6 }, flags: { settlement1993: false }, next: '5_4' },
      { label: T('event.5_3.opt2.label', null, 'C：配合调查'), hint: T('event.5_3.opt2.hint', null, '清白与否交给程序，声誉仍受伤（声誉-10，压力+25）'), effects: { reputation: -10, stress: 25, media: -4 }, flags: { settlement1993: false }, next: '5_4' }
    ]
  };

  E['5_4'] = {
    id: '5_4', year: 1993, title: T('event.5_4.title', null, '药物依赖公开'), kind: 'auto', key: true,
    cond: function (s) { return s.flags.isPepsiBurned === true && s.flags.painkillerDependent === true; }, fallback: '5_5',
    text: function (s) {
      return narr(T('event.5_4.text', null, '长年倚赖的止痛药物，终于被外界的目光揪了出来。依赖，从私密的伤口变成了公开的注脚。'), s, [
        { cond: function (s) { return (s.attributes.health || 0) <= 45; }, text: T('event.5_4.branch0.text', null, '身体早已发出过太多次警告，这一次，连警告都显得无力。') }
      ]);
    },
    effects: { reputation: -15, health: -10, stress: 20, media: -8 }, next: '5_5'
  };

  E['5_5'] = {
    id: '5_5', year: 1994, title: T('event.5_5.title', null, '与 Lisa Marie 结婚'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.5_5.text', null, '你与 Lisa Marie Presley 携手步入婚姻，两段孤独的星轨，在镜头前短暂交叠。'), s, [
        { cond: function (s) { return (s.attributes.reputation || 0) >= 80; }, text: T('event.5_5.branch0.text', null, '两道星轨的交叠被镜头津津乐道，你分不清是爱还是表演。') },
        { cond: function (s) { return (s.attributes.family || 0) <= 50; }, text: T('event.5_5.branch1.text', null, '你渴望有个家，却又害怕婚姻再次变成展柜里的标本。') }
      ]);
    },
    options: [
      { label: T('event.5_5.opt0.label', null, 'A：用心经营这段婚姻'), hint: T('event.5_5.opt0.hint', null, '家有了温度，名气也添暖意（家庭+15，声誉+10）'), effects: { family: 15, reputation: 10, rel: { lisa: 15 } }, flags: { marriedLisa: true }, next: '6_1' },
      { label: T('event.5_5.opt1.label', null, 'B：保持距离'), hint: T('event.5_5.opt1.hint', null, '貌合神离（家庭-5）'), effects: { family: -5, rel: { lisa: -5 } }, flags: { marriedLisa: false }, next: '6_1' },
      { label: T('event.5_5.opt2.label', null, 'C：办一场世纪婚礼'), hint: T('event.5_5.opt2.hint', null, '举世瞩目，破费又劳神（声誉+5，财富-10，压力+5）'), effects: { reputation: 5, wealth: -10, stress: 5, rel: { lisa: 5 } }, flags: { marriedLisa: false }, next: '6_1' }
    ]
  };

  // —— §17.14 创作企划器：6_1 改为「企划」choice（写 cp_* 画像）——
  E['6_1'] = {
    id: '6_1', year: 1995, title: T('event.6_1.title', null, '《HIStory》'), kind: 'choice',
    text: function (s) {
      if (s.flags.isSolo) {
        return narr(T('event.6_1.text', null, '双碟专辑《HIStory》问世，一半回望来路，一半叫板未来。封面上那个镀金身影，是你给时代的一记回响。'), s, [
          { cond: function (s) { return (s.attributes.wealth || 0) >= 70; }, text: T('event.6_1.branch0.text', null, '财富与名望的雪球越滚越大，回望来路你竟有些恍惚。') }
        ]);
      }
      return T('event.6_1.ret0.text', null, '组合新作延续旅程，和声里依旧有你。');
    },
    options: [
      { label: T('event.6_1.opt0.label', null, 'A：概念史诗化，孤注一掷'), hint: T('event.6_1.opt0.hint', null, '艺术与野心拉满（艺术+30，财富+30，声誉+25，压力+10；企划·视野/创新极高）'), effects: function (s) { return s.flags.isSolo ? { art: 30, wealth: 30, reputation: 25, stress: 10 } : { art: 10, wealth: 10, reputation: 5 }; }, flags: { cp_vision: 90, cp_innovation: 85, cp_craft: 70 }, next: '6_1b' },
      { label: T('event.6_1.opt1.label', null, 'B：商业稳赢，精准定位'), hint: T('event.6_1.opt1.hint', null, '制作精良、人脉加成（艺术+30，财富+30，声誉+25，压力+10；企划·制作/合作偏高）'), effects: function (s) { return s.flags.isSolo ? { art: 30, wealth: 30, reputation: 25, stress: 10 } : { art: 10, wealth: 10, reputation: 5 }; }, flags: { cp_craft: 85, cp_collab: 80, cp_vision: 65 }, next: '6_1b' },
      { label: T('event.6_1.opt2.label', null, 'C：极简实验，以小搏大'), hint: T('event.6_1.opt2.hint', null, '创新拉满、制作克制（艺术+30，财富+30，声誉+25，压力+10；企划·创新极高/制作偏低）'), effects: function (s) { return s.flags.isSolo ? { art: 30, wealth: 30, reputation: 25, stress: 10 } : { art: 10, wealth: 10, reputation: 5 }; }, flags: { cp_innovation: 95, cp_craft: 45, cp_vision: 75 }, next: '6_1b' }
    ]
  };

  E['6_1b'] = {
    id: '6_1b', year: 1995, title: T('event.6_1b.title', null, '索尼合并'), kind: 'choice', key: true,
    cond: function (s) { return s.flags.isSolo === true && s.flags.epicDeep === true; }, fallback: '6_1c',
    text: function (s) {
      return narr(T('event.6_1b.text', null, '你可将 ATV 版权与索尼合并，把零散的版图拼成一张王座。这是商业棋局里最凶险也最诱人的一步。'), s, [
        { cond: function (s) { return (s.meta.mogul || 0) >= 1; }, text: T('event.6_1b.branch0.text', null, '你早已是半个生意人，这步棋走得理直气壮。') },
        { cond: function (s) { return (s.attributes.wealth || 0) >= 70; }, text: T('event.6_1b.branch1.text', null, '雄厚的底子让你有资本把版图拼得更大。') }
      ]);
    },
    options: [
      { label: T('event.6_1b.opt0.label', null, 'A：合并 Sony/ATV'), hint: T('event.6_1b.opt0.hint', null, '版权帝国落成，商业+1（财富+50，声誉+10）'), effects: { wealth: 50, reputation: 10, mogul: 1 }, flags: { sonyMerge: true }, next: '6_1c' },
      { label: T('event.6_1b.opt1.label', null, 'B：暂不合并'), hint: T('event.6_1b.opt1.hint', null, '留一丝自由，家更暖（财富-10，家庭+5）'), effects: { wealth: -10, family: 5 }, flags: { sonyMerge: false }, next: '6_1c' },
      { label: T('event.6_1b.opt2.label', null, 'C：反手收购更多目录'), hint: T('event.6_1b.opt2.hint', null, '版图再扩，商业+2（财富-20，声誉+5）'), effects: { wealth: -20, reputation: 5, mogul: 2 }, next: '6_1c' }
    ]
  };

  E['6_1c'] = {
    id: '6_1c', year: 1995, title: T('event.6_1c.title', null, '《Scream》与 Janet'), kind: 'choice',
    text: function (s) {
      return narr(T('event.6_1c.text', null, '你与妹妹 Janet 联手《Scream》，把兄妹的私密情绪，砸进了一支烧钱如流水的 MV 里。'), s, [
        { cond: function (s) { return (s.attributes.family || 0) >= 70; }, text: T('event.6_1c.branch0.text', null, '和 Janet 并肩让你想起，血缘原是最稳的舞台。') },
        { cond: function (s) { return (s.attributes.stress || 0) >= 55; }, text: T('event.6_1c.branch1.text', null, '烧钱的 MV 背后是烧钱的心力，你笑着，也累着。') }
      ]);
    },
    options: [
      { label: T('event.6_1c.opt0.label', null, 'A：斥巨资拍摄'), hint: T('event.6_1c.opt0.hint', null, '视听炸裂，身心俱疲（艺术+12，声誉+8，压力+10）'), effects: { art: 12, reputation: 8, stress: 10 }, flags: { scream: true }, next: '6_1d' },
      { label: T('event.6_1c.opt1.label', null, 'B：简化制作'), hint: T('event.6_1c.opt1.hint', null, '收着劲儿来（艺术+6）'), effects: { art: 6 }, next: '6_1d' },
      { label: T('event.6_1c.opt2.label', null, 'C：借妹妹的资源'), hint: T('event.6_1c.opt2.hint', null, '亲情与艺术双赢（家庭+5，艺术+8）'), effects: { family: 5, art: 8 }, next: '6_1d' }
    ]
  };

  E['6_1d'] = {
    id: '6_1d', year: 1996, title: T('event.6_1d.title', null, '《They Don’t Care About Us》'), kind: 'choice',
    text: function (s) {
      return narr(T('event.6_1d.text', null, '单曲掀起争议，歌词的锋芒被人反复掂量。你要在坚持与妥协之间，替这句话找个出口。'), s, [
        { cond: function (s) { return (s.attributes.reputation || 0) <= 50; }, text: T('event.6_1d.branch0.text', null, '你越来越习惯在争议里守住自己想说的话。') },
        { cond: function (s) { return (s.attributes.art || 0) >= 85; }, text: T('event.6_1d.branch1.text', null, '艺术的执拗让你不愿为平息议论而删改一字。') }
      ]);
    },
    options: [
      { label: T('event.6_1d.opt0.label', null, 'A：坚持原词不改'), hint: T('event.6_1d.opt0.hint', null, '风骨凛然，争议缠身（声誉-5，艺术+8，压力+5）'), effects: { reputation: -5, art: 8, stress: 5 }, next: '6_1e' },
      { label: T('event.6_1d.opt1.label', null, 'B：稍作修改平息'), hint: T('event.6_1d.opt1.hint', null, '息事宁人（声誉+3）'), effects: { reputation: 3 }, next: '6_1e' },
      { label: T('event.6_1d.opt2.label', null, 'C：转向《Earth Song》环保'), hint: T('event.6_1d.opt2.hint', null, '把怒火化作大地之诗，爱心+1（声誉+10，慈善+1）'), effects: { reputation: 10, phil: 1 }, flags: { earthSong: true }, next: '6_1e' }
    ]
  };

  E['6_1e'] = {
    id: '6_1e', year: 1996, title: T('event.6_1e.title', null, 'HIStory 世界巡演'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.6_1e.text', null, '《HIStory》世界巡演启程，巨型雕像与万人合唱，把你的名字写进一座座城市的夜空。这也是你单飞后规模最浩大的远征。'), s, [
        { cond: function (s) { return (s.attributes.reputation || 0) <= 50; }, text: T('event.6_1e.branch0.text', null, '舆论的噪音没能盖过现场的合唱，你忽然觉得，舞台比法庭更懂你。') },
        { cond: function (s) { return (s.meta.phil || 0) >= 1; }, text: T('event.6_1e.branch1.text', null, '你在巡演沿途探望病童，把聚光灯外的温柔也带去了。') }
      ]);
    },
    options: [
      { label: T('event.6_1e.opt0.label', null, 'A：全力呈现视听盛宴'), hint: T('event.6_1e.opt0.hint', null, '王者归来，盛况空前（声誉+12，财富+20，压力+15；巡演·舞台呈现极高）'), effects: { reputation: 12, wealth: 20, stress: 15 }, flags: { cp_stagecraft: 80 }, next: '6_1e_g' },
      { label: T('event.6_1e.opt1.label', null, 'B：精简场次护身体'), hint: T('event.6_1e.opt1.hint', null, '量力而行（声誉+6，财富+10，压力+5；巡演·舞台呈现偏低）'), effects: { reputation: 6, wealth: 10, stress: 5 }, flags: { cp_stagecraft: 45 }, next: '6_1e_g' },
      { label: T('event.6_1e.opt2.label', null, 'C：巡演结合公益'), hint: T('event.6_1e.opt2.hint', null, '善名远播，爱心+1（声誉+8，慈善+1；巡演·舞台呈现偏高）'), effects: { reputation: 8, phil: 1 }, flags: { cp_stagecraft: 70 }, next: '6_1e_g' }
    ]
  };
  E['6_2'] = {
    id: '6_2', year: 1996, title: T('event.6_2.title', null, '与黛比·罗结婚'), kind: 'choice',
    text: function (s) {
      return narr(T('event.6_2.text', null, '你与黛比·罗结婚，组建起属于自己的小家。镁光灯外，第一次有了寻常人家的灶火。'), s, [
        { cond: function (s) { return s.flags.marriedLisa === true; }, text: T('event.6_2.branch0.text', null, '你想起 Lisa Marie，上一段婚姻的余温还没散尽，却又走进了新的承诺。') },
        { cond: function (s) { return (s.attributes.family || 0) <= 50; }, text: T('event.6_2.branch1.text', null, '你渴望有个真正的家，却总在亲密关系前犹豫。') }
      ]);
    },
    options: [
      { label: T('event.6_2.opt0.label', null, 'A：全心经营家庭'), hint: T('event.6_2.opt0.hint', null, '家成了最稳的锚（家庭+20）'), effects: { family: 20, rel: { debbie: 15 } }, flags: { marriedDebbie: true }, next: '6_2b' },
      { label: T('event.6_2.opt1.label', null, 'B：保持疏离'), hint: T('event.6_2.opt1.hint', null, '有名无实的冷淡（家庭-10）'), effects: { family: -10, rel: { debbie: -10 } }, flags: { marriedDebbie: false }, next: '6_2b' },
      { label: T('event.6_2.opt2.label', null, 'C：规划代孕子女'), hint: T('event.6_2.opt2.hint', null, '为新生命铺路，账目出血（家庭+5，财富-10）'), effects: { family: 5, wealth: -10, rel: { debbie: 3, kids: 3 } }, flags: { surrogacy: true }, next: '6_2b' }
    ]
  };

  E['6_2b'] = {
    id: '6_2b', year: 1997, title: T('event.6_2b.title', null, '启动《Invincible》'), kind: 'choice',
    cond: function (s) { return s.flags.isSolo === true; }, fallback: '6_2c',
    text: function (s) {
      return narr(T('event.6_2b.text', null, '你着手筹备《Invincible》，与厂牌的拉锯也暗暗升温。创作的火焰很旺，背后的绳索也在收紧。'), s, [
        { cond: function (s) { return (s.attributes.stress || 0) >= 55; }, text: T('event.6_2b.branch0.text', null, '与厂牌的拉锯加上创作的重压，你几乎要在录音室里窒息。') },
        { cond: function (s) { return (s.attributes.wealth || 0) >= 70; }, text: T('event.6_2b.branch1.text', null, '不差钱的底气，让你在制作上敢想敢烧。') }
      ]);
    },
    options: [
      { label: T('event.6_2b.opt0.label', null, 'A：全力投入制作'), hint: T('event.6_2b.opt0.hint', null, '艺术封顶，身心透支（艺术+15，压力+30）'), effects: { art: 15, stress: 30 }, flags: { invincibleStarted: true }, next: '6_2c' },
      { label: T('event.6_2b.opt1.label', null, 'B：适度投入'), hint: T('event.6_2b.opt1.hint', null, '张弛有度，现金回血（财富+10，压力-10）'), effects: { wealth: 10, stress: -10 }, flags: { invincibleStarted: false }, next: '6_2c' },
      { label: T('event.6_2b.opt2.label', null, 'C：半独立制作'), hint: T('event.6_2b.opt2.hint', null, '在夹缝里守住自我（艺术+8，压力+10）'), effects: { art: 8, stress: 10 }, next: '6_2c' }
    ]
  };

  E['6_2c'] = {
    id: '6_2c', year: 1997, title: T('event.6_2c.title', null, '《Blood on the Dance Floor》'), kind: 'choice',
    text: function (s) {
      return narr(T('event.6_2c.text', null, '你发行混音专辑《Blood on the Dance Floor》，把夜店的节拍，重新缝进自己的名字里。'), s, [
        { cond: function (s) { return (s.attributes.wealth || 0) >= 70; }, text: T('event.6_2c.branch0.text', null, '进账的数字让混音实验更无后顾之忧。') },
        { cond: function (s) { return (s.attributes.art || 0) >= 85; }, text: T('event.6_2c.branch1.text', null, '你对声音有了近乎偏执的讲究。') }
      ]);
    },
    options: [
      { label: T('event.6_2c.opt0.label', null, 'A：正式发行'), hint: T('event.6_2c.opt0.hint', null, '舞池回响，进账可观（艺术+8，财富+10）'), effects: { art: 8, wealth: 10 }, flags: { bloodDance: true }, next: '6_2d' },
      { label: T('event.6_2c.opt1.label', null, 'B：搁置计划'), hint: T('event.6_2c.opt1.hint', null, '留白待后（艺术+3）'), effects: { art: 3 }, next: '6_2d' },
      { label: T('event.6_2c.opt2.label', null, 'C：大胆混音实验'), hint: T('event.6_2c.opt2.hint', null, '先锋尝鲜，小有声望（艺术+5，声誉+3）'), effects: { art: 5, reputation: 3 }, next: '6_2d' }
    ]
  };

  E['6_2d'] = {
    id: '6_2d', year: 1997, title: T('event.6_2d.title', null, '《Ghosts》短片'), kind: 'choice',
    cond: function (s) { return s.flags.isSolo === true; }, fallback: '6_2e',
    text: function (s) {
      return narr(T('event.6_2d.text', null, '你亲自执导长篇短片《Ghosts》，把心里那些不被理解的怪诞，一股脑搬上银幕。'), s, [
        { cond: function (s) { return (s.attributes.art || 0) >= 85; }, text: T('event.6_2d.branch0.text', null, '大银幕成了你最私密的日记本，怪诞之下全是真心。') },
        { cond: function (s) { return (s.meta.recluse || 0) >= 1; }, text: T('event.6_2d.branch1.text', null, '你越来越多躲进自己的世界，短片里的角色倒比你本人更敢说话。') }
      ]);
    },
    options: [
      { label: T('event.6_2d.opt0.label', null, 'A：拍成震撼长片'), hint: T('event.6_2d.opt0.hint', null, '艺术宣泄，艺术家之心+1（艺术+10，声誉+5，压力+10）'), effects: { art: 10, reputation: 5, stress: 10, artPath: 1 }, flags: { ghosts: true }, next: '6_2e' },
      { label: T('event.6_2d.opt1.label', null, 'B：干脆放弃'), hint: T('event.6_2d.opt1.hint', null, '收起表达欲（艺术+3）'), effects: { art: 3 }, next: '6_2e' }
    ]
  };

  E['6_2e'] = {
    id: '6_2e', year: 1999, title: T('event.6_2e.title', null, '慈善演唱会'), kind: 'choice',
    text: function (s) {
      return narr(T('event.6_2e.text', null, '你在德国与韩国办起“Michael Jackson & Friends”慈善演唱会，把舞台让给更需要被听见的人。'), s, [
        { cond: function (s) { return (s.meta.phil || 0) >= 1; }, text: T('event.6_2e.branch0.text', null, '慈善对你已不是一时兴起，而是习惯。') },
        { cond: function (s) { return (s.attributes.reputation || 0) >= 80; }, text: T('event.6_2e.branch1.text', null, '你的名字本身就是募款时最响的那声锣。') }
      ]);
    },
    options: [
      { label: T('event.6_2e.opt0.label', null, 'A：全力投入'), hint: T('event.6_2e.opt0.hint', null, '善名广传，爱心+1（声誉+10，家庭+5，财富-10，慈善+1）'), effects: { reputation: 10, family: 5, wealth: -10, phil: 1 }, flags: { charity99: true }, next: '6_3' },
      { label: T('event.6_2e.opt1.label', null, 'B：小额参与'), hint: T('event.6_2e.opt1.hint', null, '意思到了（声誉+3）'), effects: { reputation: 3 }, next: '6_3' },
      { label: T('event.6_2e.opt2.label', null, 'C：联手政要募款'), hint: T('event.6_2e.opt2.hint', null, '资源撬动善意，爱心+1（声誉+8，慈善+1）'), effects: { reputation: 8, phil: 1 }, next: '6_3' }
    ]
  };

  E['6_3'] = {
    id: '6_3', year: 1999, title: T('event.6_3.title', null, '与黛比离婚'), kind: 'auto',
    cond: function (s) { return s.flags.marriedDebbie === true; }, fallback: '6_3b',
    text: function (s) {
      return narr(T('event.6_3.text', null, '你与黛比·罗的婚姻，在聚光灯的炙烤下走到了尽头。曾经的小家，悄然散了温度。'), s, [
        { cond: function (s) { return (s.attributes.family || 0) <= 50; }, text: T('event.6_3.branch0.text', null, '本就稀薄的家庭温度，又降了一度。') }
      ]);
    },
    effects: { family: -10 }, next: '6_3a'
  };

  E['6_3a'] = {
    id: '6_3a', year: 2001, title: T('event.6_3a.title', null, '9·11 与三十周年'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.6_3a.text', null, '出道三十周年的演唱会遇上 9·11 的阴霾。你在哀伤的国土上登台，为受难者献唱，把个人的加冕，唱成了众人的疗愈。'), s, [
        { cond: function (s) { return (s.meta.phil || 0) >= 1; }, text: T('event.6_3a.branch0.text', null, '你比谁都清楚，此刻歌声该献给谁。') },
        { cond: function (s) { return (s.attributes.reputation || 0) >= 70; }, text: T('event.6_3a.branch1.text', null, '聚光灯重新有了温度，世人记得你站在废墟旁的那个夜晚。') }
      ]);
    },
    options: [
      { label: T('event.6_3a.opt0.label', null, 'A：投身公益义演'), hint: T('event.6_3a.opt0.hint', null, '用歌声疗愈国殇，爱心+1（声誉+12，慈善+1，压力+5）'), effects: { reputation: 12, phil: 1, stress: 5 }, next: '6_3b' },
      { label: T('event.6_3a.opt1.label', null, 'B：低调完成周年庆典'), hint: T('event.6_3a.opt1.hint', null, '专注音乐本身（声誉+6，艺术+5）'), effects: { reputation: 6, art: 5 }, next: '6_3b' },
      { label: T('event.6_3a.opt2.label', null, 'C：借势推《Number Ones》'), hint: T('event.6_3a.opt2.hint', null, '经典汇编再掀热度（声誉+8，财富+10）'), effects: { reputation: 8, wealth: 10 }, next: '6_3b' }
    ]
  };
  E['6_3b'] = {
    id: '6_3b', year: 2001, title: T('event.6_3b.title', null, '《Invincible》与 30 周年'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.6_3b.text', null, '新专辑《Invincible》与出道 30 周年演唱会接踵而至。三十年的加冕，也是一次与时光的对望。'), s, [
        { cond: function (s) { return (s.attributes.art || 0) >= 85; }, text: T('event.6_3b.branch0.text', null, '三十年的功力都在这台纪念里，你唱给时光，也唱给自己。') },
        { cond: function (s) { return (s.attributes.family || 0) >= 70; }, text: T('event.6_3b.branch1.text', null, '你特意为后辈留了位置，传承比加冕更让你动容。') }
      ]);
    },
    options: [
      { label: T('event.6_3b.opt0.label', null, 'A：办一场盛大纪念'), hint: T('event.6_3b.opt0.hint', null, '荣耀加身，劳顿难免（艺术+12，声誉+10，压力+10；企划·视野/创新极高）'), effects: { art: 12, reputation: 10, stress: 10 }, flags: { anniv2001: true, cp_vision: 90, cp_innovation: 75, cp_craft: 70 }, next: '6_3b_g' },
      { label: T('event.6_3b.opt1.label', null, 'B：低调处理'), hint: T('event.6_3b.opt1.hint', null, '不张扬地过（声誉+3；企划·制作/合作偏低）'), effects: { reputation: 3 }, flags: { cp_craft: 60, cp_collab: 55 }, next: '6_3b_g' },
      { label: T('event.6_3b.opt2.label', null, 'C：提携后辈'), hint: T('event.6_3b.opt2.hint', null, '薪火相传，暖意融融（艺术+8，家庭+5；企划·合作极高）'), effects: { art: 8, family: 5 }, flags: { collab: true, cp_collab: 85, cp_craft: 65 }, next: '6_3b_g' }
    ]
  };

  E['6_4'] = {
    id: '6_4', year: 2003, title: T('event.6_4.title', null, '第二次刑事指控'), kind: 'choice', key: true,
    cond: function (s) { return s.flags.isSolo === true && s.flags.neverlandType !== 'none'; }, fallback: '7_1',
    text: function (s) {
      if (s.flags.isSolo === true && s.flags.neverlandType !== 'none') {
        var extra = s.flags.settlement1993 ? T('event.6_4.extra.text', null, ' 由于 1993 年已达成庭外和解，这次指控受到更多公众关注。') : '';
        var t = T('event.6_4.text', null, '2002 年，你再次面临刑事指控。庄园的围墙之外，媒体的探照灯昼夜不息。') + extra;
        if ((s.attributes.reputation || 0) <= 50) t += T('event.6_4.branch0.text', null, '\n名声早已千疮百孔，这一击你不知还能不能接住。');
        return t + T('event.6_4.ask.text', null, '\n这一次，你站在了更汹涌的漩涡中央。');
      }
      return T('event.6_4.ret0.text', null, '你未购置庄园或始终在兄弟保护下，相关刑事指控未曾出现。');
    },
    options: [
      { label: T('event.6_4.opt0.label', null, 'A：应诉到底'), hint: T('event.6_4.opt0.hint', null, '支付 1000 万辩护，心力耗尽，终获无罪裁定（压力+30）'), effects: { stress: 30 }, moneyEffect: -1000, flags: { secondCharge: true, secondVerdict: 'not_guilty' }, epilogue: T('event.6_4.opt0.epilogue', null, '法庭的灯亮了又灭，你挺直脊背走进去，把命运交给了十二个陌生人。'), next: '6_4d' },
      { label: T('event.6_4.opt1.label', null, 'B：达成和解'), hint: T('event.6_4.opt1.hint', null, '砸下 2000 万买断纠纷，声名重创（声誉-30）'), effects: { reputation: -30 }, moneyEffect: -2000, flags: { secondCharge: true, secondVerdict: 'settled' }, epilogue: T('event.6_4.opt1.epilogue', null, '支票签下的瞬间，纠纷平息了，可你心里的那块石头，并没真的落地。'), next: '7_1' },
      { label: T('event.6_4.opt2.label', null, 'C：透明地坚持'), hint: T('event.6_4.opt2.hint', null, '把清白交给时间，压力如山（压力+20）'), effects: { stress: 20 }, flags: { secondCharge: true }, epilogue: T('event.6_4.opt2.epilogue', null, '你选择把一切摊在阳光下，任由时间慢慢给出答案。'), next: '6_4d' }
    ]
  };

  E['6_4b'] = {
    id: '6_4b', year: 2002, title: T('event.6_4b.title', null, 'Blanket 出生'), kind: 'choice',
    text: function (s) {
      return narr(T('event.6_4b.text', null, '你的第三个孩子 Blanket 降生，襁褓里的呼吸，是这喧嚣人间里最安静的奇迹。'), s, [
        { cond: function (s) { return (s.attributes.family || 0) >= 70; }, text: T('event.6_4b.branch0.text', null, '你把孩子抱在怀里，忽然觉得所有喧嚣都值得。') },
        { cond: function (s) { return (s.meta.recluse || 0) >= 1; }, text: T('event.6_4b.branch1.text', null, '你下意识把他藏得更紧，不想让镜头分走半点天真。') }
      ]);
    },
    options: [
      { label: T('event.6_4b.opt0.label', null, 'A：全心陪伴他长大'), hint: T('event.6_4b.opt0.hint', null, '父爱沉淀，亦添劳碌（家庭+15，压力+5）'), effects: { family: 15, stress: 5, rel: { kids: 18 }, media: -2 }, flags: { blanketBorn: true }, next: '6_4c' },
      { label: T('event.6_4b.opt1.label', null, 'B：暂缓公众曝光'), hint: T('event.6_4b.opt1.hint', null, '把私密留给自己（家庭+5）'), effects: { family: 5, rel: { kids: 8 }, media: 2 }, next: '6_4c' },
      { label: T('event.6_4b.opt2.label', null, 'C：高调展示家庭'), hint: T('event.6_4b.opt2.hint', null, '秀恩爱涨粉，隐士之心-1（声誉+5，家庭+10）'), effects: { reputation: 5, family: 10, recluse: -1 }, next: '6_4c' }
    ]
  };

  E['6_4c'] = {
    id: '6_4c', year: 2002, title: T('event.6_4c.title', null, '柏林坠婴'), kind: 'choice',
    text: function (s) {
      return narr(T('event.6_4c.text', null, '在柏林的阳台上，你曾把孩子探出窗外的画面，被镜头永远定格。那一刻的温柔，被全世界误读。'), s, [
        { cond: function (s) { return (s.attributes.reputation || 0) <= 50; }, text: T('event.6_4c.branch0.text', null, '本就摇摇欲坠的口碑，被这一帧画面又推远了些。') }
      ]);
    },
    options: [
      { label: T('event.6_4c.opt0.label', null, 'A：公开致歉'), hint: T('event.6_4c.opt0.hint', null, '主动担责，口碑受挫（声誉-15，压力+10）'), effects: { reputation: -15, stress: 10 }, flags: { babyDangle: true }, next: '6_4' },
      { label: T('event.6_4c.opt1.label', null, 'B：保持沉默'), hint: T('event.6_4c.opt1.hint', null, '任流言发酵（声誉-5，压力+5）'), effects: { reputation: -5, stress: 5 }, next: '6_4' },
      { label: T('event.6_4c.opt2.label', null, 'C：反诉媒体'), hint: T('event.6_4c.opt2.hint', null, '以攻代守，退意渐生（隐士+1）（声誉-3，压力+5）'), effects: { reputation: -3, stress: 5, recluse: 1 }, next: '6_4' }
    ]
  };

  E['6_4d'] = {
    id: '6_4d', year: 2003, title: T('event.6_4d.title', null, 'Bashir 纪录片'), kind: 'choice',
    text: function (s) {
      return narr(T('event.6_4d.text', null, 'Bashir 的纪录片播出，把你私生活的褶皱，摊在了亿万观众眼前。真实的你，与镜头里的你，开始错位。'), s, [
        { cond: function (s) { return (s.meta.recluse || 0) >= 1; }, text: T('event.6_4d.branch0.text', null, '你早已厌倦被围观，镜头里的你离真实的你越来越远。') },
        { cond: function (s) { return (s.attributes.reputation || 0) <= 50; }, text: T('event.6_4d.branch1.text', null, '名声的裂缝让纪录片的每句旁白都像审判。') }
      ]);
    },
    options: [
      { label: T('event.6_4d.opt0.label', null, 'A：坦然面对镜头'), hint: T('event.6_4d.opt0.hint', null, '直面争议，身心承压（声誉-12，压力+10）'), effects: { reputation: -12, stress: 10 }, flags: { bashirDoc: true }, next: '6_4e' },
      { label: T('event.6_4d.opt1.label', null, 'B：拒拍保持距离'), hint: T('event.6_4d.opt1.hint', null, '退后半步，隐士之心+1（压力+5）'), effects: { stress: 5, recluse: 1 }, next: '6_4e' },
      { label: T('event.6_4d.opt2.label', null, 'C：起诉记者'), hint: T('event.6_4d.opt2.hint', null, '以法律回击，耗时耗神（声誉+3，压力+15）'), effects: { reputation: 3, stress: 15 }, next: '6_4e' }
    ]
  };

  E['6_4e'] = {
    id: '6_4e', year: 2003, title: T('event.6_4e.title', null, '2003 年逮捕程序'), kind: 'choice',
    cond: function (s) { return s.flags.secondCharge === true; }, fallback: '6_5',
    text: function (s) {
      return narr(T('event.6_4e.text', null, '围绕那桩刑事指控，你经历了逮捕与保释的程序。手铐的金属凉意，比任何舞台都真实。'), s, [
        { cond: function (s) { return (s.attributes.stress || 0) >= 55; }, text: T('event.6_4e.branch0.text', null, '程序的漫长像钝刀，一下下磨着所剩无几的耐心。') }
      ]);
    },
    options: [
      { label: T('event.6_4e.opt0.label', null, 'A：配合保释流程'), hint: T('event.6_4e.opt0.hint', null, '依法而行，声誉微损（压力+20，声誉-12）'), effects: { stress: 20, reputation: -12 }, next: '6_5' },
      { label: T('event.6_4e.opt1.label', null, 'B：隐居避世'), hint: T('event.6_4e.opt1.hint', null, '躲进静默，隐士之心+1（压力-5）'), effects: { stress: -5, recluse: 1 }, next: '6_5' },
      { label: T('event.6_4e.opt2.label', null, 'C：公开回应'), hint: T('event.6_4e.opt2.hint', null, '自证清白，心力交瘁（声誉-3，压力+10）'), effects: { reputation: -3, stress: 10 }, next: '6_5' }
    ]
  };

  E['6_5'] = {
    id: '6_5', year: 2005, title: T('event.6_5.title', null, '2005 年庭审结果'), kind: 'auto',
    cond: function (s) { return s.flags.secondCharge === true; }, fallback: '7_0',
    text: function (s) {
      if (s.flags.secondVerdict === 'not_guilty') return T('event.6_5.ret0.text', null, '2005 年，所有指控均被裁定不成立。法庭的钟声落下，你走出大门时，声誉缓缓回温。');
      if (s.flags.secondVerdict === 'settled') return T('event.6_5.ret1.text', null, '庭外和解落槌，纠纷虽快速了结，公众心里的问号却没被抹去。');
      return T('event.6_5.ret2.text', null, '漫长的庭审终于暂告段落，尘埃里，你独自站着。');
    },
    effects: function (s) {
      if (s.flags.secondVerdict === 'not_guilty') return { reputation: 10, stress: -20 };
      if (s.flags.secondVerdict === 'settled') return { reputation: -30 };
      return {};
    },
    next: '7_0'
  };

  E['7_0'] = {
    id: '7_0', year: 2008, title: T('event.7_0.title', null, '《Thriller 25》'), kind: 'choice', key: true,
    cond: function (s) { return s.flags.isSolo === true; }, fallback: '7_1',
    text: function (s) {
      return narr(T('event.7_0.text', null, '《Thriller 25》周年纪念专辑面世，格莱美的聚光灯再次为你亮起。二十五年过去，那张封面依旧在发光。'), s, [
        { cond: function (s) { return (s.attributes.art || 0) >= 85; }, text: T('event.7_0.branch0.text', null, '二十五年过去，你仍是那个不肯将就的匠人。') },
        { cond: function (s) { return (s.meta.recluse || 0) >= 1; }, text: T('event.7_0.branch1.text', null, '你越来越不爱抛头露面，这次亮相更像给老歌迷的礼物。') }
      ]);
    },
    options: [
      { label: T('event.7_0.opt0.label', null, 'A：盛大回归'), hint: T('event.7_0.opt0.hint', null, '王者归来，艺术家之心+1（艺术+10，声誉+10）'), effects: { art: 10, reputation: 10, artPath: 1, rel: { fans: 8 } }, flags: { thriller25: true, comebackSeen: true }, next: '7_1' },
      { label: T('event.7_0.opt1.label', null, 'B：释出混音'), hint: T('event.7_0.opt1.hint', null, '温故而知新（艺术+5，声誉+5）'), effects: { art: 5, reputation: 5 }, next: '7_1' },
      { label: T('event.7_0.opt2.label', null, 'C：婉拒亮相'), hint: T('event.7_0.opt2.hint', null, '退居幕后，隐士之心+1（声誉-3）'), effects: { reputation: -3, recluse: 1 }, next: '7_1' }
    ]
  };

  E['7_1'] = {
    id: '7_1', year: 2008, title: T('event.7_1.title', null, '债务危机'), kind: 'choice', key: true,
    cond: function (s) { return s.flags.neverlandType !== 'none'; }, fallback: '7_2',
    text: function (s) {
      return narr(T('event.7_1.text', null, '梦幻庄园像个吞金的无底洞，债务危机逼上门来。Colony Capital 递来一根浮木——条件是让你松手些许。'), s, [
        { cond: function (s) { return (s.attributes.wealth || 0) <= 30; }, text: T('event.7_1.branch0.text', null, '账上的窘迫让“吞金庄园”四个字格外刺眼。') },
        { cond: function (s) { return (s.attributes.family || 0) >= 70; }, text: T('event.7_1.branch1.text', null, '想到家人也要为债务买单，你心里的天平更沉了。') }
      ]);
    },
    options: [
      { label: T('event.7_1.opt0.label', null, 'A：转让部分权益'), hint: T('event.7_1.opt0.hint', null, '引入注资断尾求生，家更冷但避债（家庭-15，净资产 +2 亿）'), effects: { family: -15 }, moneyEffect: 20000, flags: { debtCrisis: true }, next: '7_2' },
      { label: T('event.7_1.opt1.label', null, 'B：死撑不卖'), hint: T('event.7_1.opt1.hint', null, '硬扛到底，濒临窒息（压力+10，净资产 -6 亿，可能负债）'), effects: { stress: 10 }, moneyEffect: -60000, flags: { debtCrisis: false }, next: '7_2' },
      { label: T('event.7_1.opt2.label', null, 'C：引入注资'), hint: T('event.7_1.opt2.hint', null, '外人入局，压力稍缓（压力-5，净资产 +8000 万）'), effects: { stress: -5 }, moneyEffect: 8000, next: '7_2' }
    ]
  };

  E['7_2'] = {
    id: '7_2', year: 2009, title: T('event.7_2.title', null, 'This Is It'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.7_2.text', null, '你宣布《This Is It》系列演唱会，像要和岁月再赌一把。伦敦的舞台已经搭好，聚光灯在等你归来。'), s, [
        { cond: function (s) { return (s.attributes.health || 0) <= 45; }, text: T('event.7_2.branch0.text', null, '医生的叮嘱还悬在耳边，你却仍在盘算能撑几场。') },
        { cond: function (s) { return (s.attributes.stress || 0) >= 55; }, text: T('event.7_2.branch1.text', null, '身体的红绿灯已经亮起，你假装没看见。') },
        { cond: function (s) { return (s.meta.artPath || 0) >= 1; }, text: T('event.7_2.branch2.text', null, '舞台是你的朝圣之地，哪怕最后一次，你也想在那束光里站直。') },
        { cond: function (s) { return (s.meta.mogul || 0) >= 1; }, text: T('event.7_2.branch3.text', null, '这一战关乎的不只是名声，还有你亲手垒起的那座商业版图。') }
      ]);
    },
    options: function (s) {
      if (s.flags.isSolo) {
        return [
          { label: T('event.7_2.opt0.label', null, 'A：咬牙撑满 50 场'), hint: T('event.7_2.opt0.hint', null, '财富暴涨，身体濒临极限（财富+100，压力+40，净资产 +1.5 亿）'), effects: { wealth: 100, stress: 40 }, flags: { thisItHeld: true, thisItFull: true }, epilogue: T('event.7_2.opt0.epilogue', null, '伦敦的舞台已经搭好，你心里那团火，压过了对身体的所有警告。'), next: '7_3' },
          { label: T('event.7_2.opt1.label', null, 'B：忍痛取消'), hint: T('event.7_2.opt1.hint', null, '保住健康，声誉微损（健康+20，声誉-10）'), effects: { health: 20, reputation: -10 }, flags: { thisItHeld: false }, epilogue: T('event.7_2.opt1.epilogue', null, '你按下暂停键，把命留给了自己，哪怕掌声因此远了。'), next: '7_3' },
          { label: T('event.7_2.opt2.label', null, 'C：缩减到 20 场'), hint: T('event.7_2.opt2.hint', null, '折中之选，张弛有度（财富+40，压力+20，健康+10，净资产 +6000 万）'), effects: { wealth: 40, stress: 20, health: 10 }, flags: { thisItHeld: true, thisItReduced: true }, epilogue: T('event.7_2.opt2.epilogue', null, '你折中地数着场次，想既不负舞台，也不负这副身子。'), next: '7_3' },
          { label: T('event.7_2.opt3.label', null, 'D：续写人生（假设未离世）'), hint: T('event.7_2.opt3.hint', null, '若 2009 没有成为终点，把这段传奇接着写下去（进入续章）'), effects: { health: 5 }, flags: { survived2009: true }, epilogue: T('event.7_2.opt3.epilogue', null, '你深吸一口气——这一次，故事不在这里落幕。'), next: '8_0' }
        ];
      }
      return [
        { label: T('event.7_2.opt4.label', null, 'A：20 场团体巡演'), hint: T('event.7_2.opt4.hint', null, '兄弟同台，稳健收官（财富+40，压力+20，健康+5，净资产 +6000 万）'), effects: { wealth: 40, stress: 20, health: 5 }, flags: { thisItHeld: true, thisItFull: false }, epilogue: T('event.7_2.opt4.epilogue', null, '兄弟同台的巡演敲定，久违的合唱里，你找回了一点年轻的底气。'), next: '7_3' },
        { label: T('event.7_2.opt5.label', null, 'B：取消退休巡演'), hint: T('event.7_2.opt5.hint', null, '安心养身，进账略损（健康+20，净资产 -4500 万）'), effects: { health: 20, wealth: -30 }, flags: { thisItHeld: false }, epilogue: T('event.7_2.opt5.epilogue', null, '你选择先顾身体，把这场迟来的团聚，留给了更稳妥的将来。'), next: '7_3' },
        { label: T('event.7_2.opt6.label', null, 'D：续写人生（假设未离世）'), hint: T('event.7_2.opt6.hint', null, '若 2009 没有成为终点，把这段传奇接着写下去（进入续章）'), effects: { health: 5 }, flags: { survived2009: true }, epilogue: T('event.7_2.opt6.epilogue', null, '你深吸一口气——这一次，故事不在这里落幕。'), next: '8_0' }
      ];
    }
  };

  // ---------- 续章：假设 2009 未离世（2010–2026） ----------
  E['8_0'] = {
    id: '8_0', year: 2010, title: T('event.8_0.title', null, '续章 · 新的十年'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.8_0.text', null, '2009 年的夏天，你撑过了那场关乎性命的排练。聚光灯没有熄灭——它只是换了个方向。'), s, [
        { cond: function (s) { return (s.attributes.health || 0) <= 50; }, text: T('event.8_0.branch0.text', null, '身体仍需小心养护，但你终于学会了与时钟讲和。') },
        { cond: function (s) { return (s.meta.artPath || 0) >= 1; }, text: T('event.8_0.branch1.text', null, '舞台仍在召唤，而这一次，你只想为自己而跳。') }
      ]);
    },
    options: [
      { label: T('event.8_0.opt0.label', null, 'A：把《This Is It》做成长期驻演'), hint: T('event.8_0.opt0.hint', null, '稳稳收成，家底更厚（财富+30，声誉+5）'), effects: { wealth: 30, reputation: 5 }, next: '8_1' },
      { label: T('event.8_0.opt1.label', null, 'B：退居幕后专注创作'), hint: T('event.8_0.opt1.hint', null, '蓄力沉淀（艺术+10，压力-5）'), effects: { art: 10, stress: -5 }, next: '8_1' },
      { label: T('event.8_0.opt2.label', null, 'C：一边巡演一边写歌'), hint: T('event.8_0.opt2.hint', null, '两条腿走路（艺术+8，财富+15）'), effects: { art: 8, wealth: 15 }, next: '8_1' }
    ]
  };
  E['8_1'] = {
    id: '8_1', year: 2011, title: T('event.8_1.title', null, '数字单曲时代'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.8_1.text', null, '录音师迈克尔·普林斯记得，大约在筹备《This Is It》的日子里，你下定决心：不再按老办法发专辑，而是每隔几个月放出一首数字单曲，日后再把它们汇编成一张唱片。“我不再发专辑了，我们打算每隔几个月发一首单曲。”你对他说。'), s, [
        { cond: function (s) { return (s.attributes.art || 0) >= 75; }, text: T('event.8_1.branch0.text', null, '每一首单曲，你都当成一封写给时代的短信。') }
      ]);
    },
    options: [
      { label: T('event.8_1.opt0.label', null, 'A：采纳“数字单曲 + 汇编专辑”'), hint: T('event.8_1.opt0.hint', null, '先锋之举，声誉与艺术双升（艺术+12，声誉+10）'), effects: { art: 12, reputation: 10 }, flags: { digitalSingles: true }, next: '8_1b' },
      { label: T('event.8_1.opt1.label', null, 'B：坚持传统专辑模式'), hint: T('event.8_1.opt1.hint', null, '稳妥但守成（艺术+6，声誉+4）'), effects: { art: 6, reputation: 4 }, next: '8_1b' },
      { label: T('event.8_1.opt2.label', null, 'C：两者兼顾'), hint: T('event.8_1.opt2.hint', null, '折中路线（艺术+8，声誉+6，财富+5）'), effects: { art: 8, reputation: 6, wealth: 5 }, flags: { digitalSingles: true }, next: '8_1b' }
    ]
  };
  E['8_2'] = {
    id: '8_2', year: 2014, title: T('event.8_2.title', null, '汇编专辑'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.8_2.text', null, '那些年积攒的数字单曲，终于被你挑挑拣拣，汇编成一张全新的录音室专辑，像把散落的星斗收进一只匣子。'), s, [
        { cond: function (s) { return s.flags.digitalSingles === true; }, text: T('event.8_2.branch0.text', null, '你兑现了当年的承诺——单曲，真的汇成了专辑。') }
      ]);
    },
    options: [
      { label: T('event.8_2.opt0.label', null, 'A：精挑细选重磅发行'), hint: T('event.8_2.opt0.hint', null, '口碑爆棚（艺术+12，声誉+12）'), effects: { art: 12, reputation: 12 }, next: '8_2b' },
      { label: T('event.8_2.opt1.label', null, 'B：原样打包图省事'), hint: T('event.8_2.opt1.hint', null, '量足但平庸（艺术+4，声誉+4）'), effects: { art: 4, reputation: 4 }, next: '8_2b' },
      { label: T('event.8_2.opt2.label', null, 'C：加入未公开遗珠'), hint: T('event.8_2.opt2.hint', null, '惊喜彩蛋（艺术+8，声誉+8，财富+5）'), effects: { art: 8, reputation: 8, wealth: 5 }, next: '8_2b' }
    ]
  };
  E['8_3'] = {
    id: '8_3', year: 2016, title: T('event.8_3.title', null, '版权版图兑现'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.8_3.text', null, '你早年布下的版权版图迎来关键时刻：索尼提出收购你持有的 Sony/ATV 半数股权，开出的价码以亿美元计。'), s, [
        { cond: function (s) { return (s.meta.mogul || 0) >= 1; }, text: T('event.8_3.branch0.text', null, '当年那笔 Catalog 投资，如今结出了最沉的果。') }
      ]);
    },
    options: [
      { label: T('event.8_3.opt0.label', null, 'A：套现离场'), hint: T('event.8_3.opt0.hint', null, '落袋为安，身家暴涨（净资产 +7.5 亿）'), effects: { wealth: 50 }, moneyEffect: 75000, flags: { sonySold: true }, next: '8_3b' },
      { label: T('event.8_3.opt1.label', null, 'B：保留部分权益'), hint: T('event.8_3.opt1.hint', null, '留得青山（财富+15，声誉+3）'), effects: { wealth: 15, reputation: 3 }, next: '8_3b' }
    ]
  };
  E['8_4'] = {
    id: '8_4', year: 2020, title: T('event.8_4.title', null, '遗产与善意'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.8_4.text', null, '新的一代在耳机里认识你。如何安放这份仍在生长的遗产，成了新的选择题。'), s, [
        { cond: function (s) { return (s.meta.phil || 0) >= 1; }, text: T('event.8_4.branch0.text', null, '你早就把“善意”写进了人生底色。') }
      ]);
    },
    options: [
      { label: T('event.8_4.opt0.label', null, 'A：扩建公益基金会'), hint: T('event.8_4.opt0.hint', null, '善名远播，爱心+1（声誉+10，家庭+3，慈善+1）'), effects: { reputation: 10, family: 3, phil: 1 }, next: '8_4b' },
      { label: T('event.8_4.opt1.label', null, 'B：守护家族与版权'), hint: T('event.8_4.opt1.hint', null, '稳妥传承（家庭+10，财富+10）'), effects: { family: 10, wealth: 10 }, next: '8_4b' },
      { label: T('event.8_4.opt2.label', null, 'C：半退半隐享清闲'), hint: T('event.8_4.opt2.hint', null, '把日子还给自己（压力-10，隐士+1）'), effects: { stress: -10, recluse: 1 }, next: '8_4b' }
    ]
  };
  E['8_5'] = {
    id: '8_5', year: 2026, title: T('event.8_5.title', null, '传记电影《Michael》'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.8_5.text', null, '传记电影《Michael》提上日程：导演 Antoine Fuqua，Lionsgate 发行，定档 2026 年 4 月 24 日（IMAX 同步）。银幕上的你，原定由你侄子 Jaafar Jackson 饰演——镜头要重走那些被千万次传颂的瞬间。而这一次，你有机会亲手决定，谁来讲这个故事。'), s, [
        { cond: function (s) { return (s.attributes.reputation || 0) >= 70; }, text: T('event.8_5.branch0.text', null, '世人仍记得你的名字，这部电影，是给时代的回信。') }
      ]);
    },
    options: [
      { label: T('event.8_5.opt0.label', null, 'A：由侄子 Jaafar Jackson 饰演（贴合真实历史）'), hint: T('event.8_5.opt0.hint', null, '亲人演绎，你亲自授权（声誉+12，艺术+5）'), effects: { reputation: 12, art: 5 }, flags: { biopic2026: true }, next: '8_7' },
      { label: T('event.8_5.opt1.label', null, 'B：亲自出演银幕上的自己（架空续章）'), hint: T('event.8_5.opt1.hint', null, '传奇由传奇自己演绎（声誉+18，艺术+10，压力+5）'), effects: { reputation: 18, art: 10, stress: 5 }, flags: { biopicMJStar: true }, next: '8_7' },
      { label: T('event.8_5.opt2.label', null, 'C：低调回避，把故事交给后人'), hint: T('event.8_5.opt2.hint', null, '留白也是一种回答（声誉+3）'), effects: { reputation: 3 }, next: '8_7' }
    ]
  };
  E['8_6'] = {
    id: '8_6', year: 2026, title: T('event.8_6.title', null, '命运裁决 · 续'), kind: 'ending',
    text: function (s) {
      var dom = MJ.dominantMeta(s.meta);
      var base = '2010 年之后的岁月里，聚光灯没有在 2009 年熄灭。回望这一生，从盖瑞的廉价摇篮到横跨半个世纪的舞台，你的每一个选择，都写就了独一份的传奇。';
      if (dom === 'artPath') base += '\n你留给世界的，是永远跳不完的舞步与听不腻的旋律——艺术，是你唯一不愿妥协的信仰。';
      else if (dom === 'phil') base += '\n你留给世界的，不只是一首首歌，还有无数双因为你的善意而重新亮起来的眼睛。';
      else if (dom === 'mogul') base += '\n你留给世界的，是一张张写满名字的版权契约——流行乐的王座，你用商人的手腕也坐过。';
      else if (dom === 'recluse') base += '\n你留给世界的，是一个越来越模糊的剪影——你终于学会，把最真实的自己藏进静默里。';
      if (s.flags.biopicMJStar) base += '\n银幕之上，是你亲自重走自己的人生——这世上唯一能演活迈克尔·杰克逊的，终究只有迈克尔·杰克逊自己。';
      base += '\n谢幕之后，故事由听者续写。';
      return base;
    },
    next: null
  };

  // ---------- 续章拓展节点（g4：GDD §17.2 假设 2009 未离世） ----------
  E['8_1b'] = {
    id: '8_1b', year: 2014, title: T('event.8_1b.title', null, '全息归来'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.8_1b.text', null, '2014 年的 Billboard 颁奖礼，一束光里站起“你”——以全息影像重返舞台，与台下的真实观众隔空合唱。科技让传奇在离世之外，另有一种复活。'), s, [
        { cond: function (s) { return (s.attributes.art || 0) >= 80; }, text: T('event.8_1b.branch0.text', null, '当熟悉的舞步由光影重现，你忽然分不清台上是幻影，还是那个从未离开的自己。') }
      ]);
    },
    options: [
      { label: T('event.8_1b.opt0.label', null, 'A：拥抱这场科技奇观'), hint: T('event.8_1b.opt0.hint', null, '艺术与科技惊艳世人（艺术+10，声誉+8，artPath+1）'), effects: { art: 10, reputation: 8, artPath: 1 }, next: '8_2' },
      { label: T('event.8_1b.opt1.label', null, 'B：低调收录为纪念'), hint: T('event.8_1b.opt1.hint', null, '把这一刻留给怀念的人（声誉+5，家庭+3）'), effects: { reputation: 5, family: 3 }, next: '8_2' },
      { label: T('event.8_1b.opt2.label', null, 'C：婉拒全息噱头'), hint: T('event.8_1b.opt2.hint', null, '守住本真的边界（艺术+5，隐士+1）'), effects: { art: 5, recluse: 1 }, next: '8_2' }
    ]
  };
  E['8_2b'] = {
    id: '8_2b', year: 2014, title: T('event.8_2b.title', null, '遗作《Xscape》'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.8_2b.text', null, '继你亲订的汇编之后，又一批早年未公开的小样被整理成《Xscape》问世。它们不是你亲手排定，却也成了与世人最后的对话。'), s, [
        { cond: function (s) { return s.flags.digitalSingles === true; }, text: T('event.8_2b.branch0.text', null, '你曾规划“单曲汇成专辑”，而这张遗珠，倒像命运替你补上的尾声。') }
      ]);
    },
    options: [
      { label: T('event.8_2b.opt0.label', null, 'A：亲自参与编曲打磨'), hint: T('event.8_2b.opt0.hint', null, '亲手打磨最后的礼物（艺术+10，声誉+8）'), effects: { art: 10, reputation: 8 }, flags: { xscapeCurated: true }, next: '8_3' },
      { label: T('event.8_2b.opt1.label', null, 'B：交予团队打理'), hint: T('event.8_2b.opt1.hint', null, '省心却也稳妥（声誉+5，财富+5）'), effects: { reputation: 5, wealth: 5 }, next: '8_3' },
      { label: T('event.8_2b.opt2.label', null, 'C：封存不予发行'), hint: T('event.8_2b.opt2.hint', null, '把私密留给自己（隐士+1，家庭+3）'), effects: { recluse: 1, family: 3 }, next: '8_3' }
    ]
  };
  E['8_3b'] = {
    id: '8_3b', year: 2017, title: T('event.8_3b.title', null, '遗产税争议'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.8_3b.text', null, '遗产管理委员会与税务机关就资产估值对簿公堂，诉讼从 2013 年一路拉到 2017 年。账面上的数字，成了另一场没有观众的拉锯。'), s, [
        { cond: function (s) { return (s.meta.mogul || 0) >= 1; }, text: T('event.8_3b.branch0.text', null, '你早把版图织得够大，这回合的估值博弈，不过是商海的余波。') }
      ]);
    },
    options: [
      { label: T('event.8_3b.opt0.label', null, 'A：委托专业团队抗辩'), hint: T('event.8_3b.opt0.hint', null, '花钱买专业，口碑微稳（财富-10，声誉+3）'), effects: { wealth: -10, reputation: 3 }, next: '8_5b' },
      { label: T('event.8_3b.opt1.label', null, 'B：公开财务透明化'), hint: T('event.8_3b.opt1.hint', null, '以透明换信任（声誉+5，媒体+6）'), effects: { reputation: 5, media: 6 }, next: '8_5b' },
      { label: T('event.8_3b.opt2.label', null, 'C：庭外和解息事'), hint: T('event.8_3b.opt2.hint', null, '破财消灾，心力交瘁（财富-15，压力+5）'), effects: { wealth: -15, stress: 5 }, next: '8_5b' }
    ]
  };
  E['8_5b'] = {
    id: '8_5b', year: 2019, title: T('event.8_5b.title', null, '舆论风波'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.8_5b.text', null, '一部回溯你人生的纪录片引发新一轮公共讨论，镜头之外，议论像潮水一样涨落。如何回应，又一次交到你手上。'), s, [
        { cond: function (s) { return (s.meta.recluse || 0) >= 1; }, text: T('event.8_5b.branch0.text', null, '你早已习惯退到镜头之外，这回的喧哗，更像隔着玻璃的雨。') }
      ]);
    },
    options: [
      { label: T('event.8_5b.opt0.label', null, 'A：保持沉默'), hint: T('event.8_5b.opt0.hint', null, '把回应咽回心里（隐士+1，孤独+3）'), effects: { recluse: 1, loneliness: 3 }, next: '8_4' },
      { label: T('event.8_5b.opt1.label', null, 'B：发表公开声明'), hint: T('event.8_5b.opt1.hint', null, '以正视听，徒增疲惫（声誉+3，压力+5，媒体+5）'), effects: { reputation: 3, stress: 5, media: 5 }, next: '8_4' },
      { label: T('event.8_5b.opt2.label', null, 'C：用慈善行动回应'), hint: T('event.8_5b.opt2.hint', null, '让善意替你说话（慈善+1，声誉+5，家庭+3）'), effects: { phil: 1, reputation: 5, family: 3 }, next: '8_4' }
    ]
  };
  E['8_4b'] = {
    id: '8_4b', year: 2022, title: T('event.8_4b.title', null, '《MJ the Musical》'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.8_4b.text', null, '百老汇的聚光灯下，一部以你为名号的音乐剧拉开帷幕。舞台上的“你”替你谢幕，而台下的掌声，仍为你而响。'), s, [
        { cond: function (s) { return (s.attributes.art || 0) >= 80; }, text: T('event.8_4b.branch0.text', null, '你看着台上那个演绎自己的人，忽然觉得传奇也可以被重新讲述。') }
      ]);
    },
    options: [
      { label: T('event.8_4b.opt0.label', null, 'A：亲临首演站台'), hint: T('event.8_4b.opt0.hint', null, '为传奇添一笔温度（声誉+10，艺术+5）'), effects: { reputation: 10, art: 5 }, next: '8_4c' },
      { label: T('event.8_4b.opt1.label', null, 'B：低调遥致祝贺'), hint: T('event.8_4b.opt1.hint', null, '退后半步，留白给舞台（声誉+5，隐士+1）'), effects: { reputation: 5, recluse: 1 }, next: '8_4c' },
      { label: T('event.8_4b.opt2.label', null, 'C：投资并深度参与'), hint: T('event.8_4b.opt2.hint', null, '商与艺兼得（财富-5，艺术+8，商业巨擘+1）'), effects: { wealth: -5, art: 8, mogul: 1 }, flags: { mjMusical: true }, next: '8_4c' }
    ]
  };
  E['8_4c'] = {
    id: '8_4c', year: 2023, title: T('event.8_4c.title', null, '《Thriller 40》周年'), kind: 'choice', key: true,
    text: function (s) {
      return narr(T('event.8_4c.text', null, '《Thriller》迎来四十岁生日，一场横跨两年的纪念企划把老歌重新推上榜单。一代人的青春，被同一段节拍唤醒。'), s, [
        { cond: function (s) { return (s.attributes.family || 0) >= 70; }, text: T('event.8_4c.branch0.text', null, '你想起录制它时那群并肩的人，怀旧里多了一层暖意。') }
      ]);
    },
    options: [
      { label: T('event.8_4c.opt0.label', null, 'A：办盛大纪念演出'), hint: T('event.8_4c.opt0.hint', null, '与一代人共舞（声誉+10，艺术+5）'), effects: { reputation: 10, art: 5 }, next: '8_5' },
      { label: T('event.8_4c.opt1.label', null, 'B：出珍藏版合辑'), hint: T('event.8_4c.opt1.hint', null, '情怀变现（声誉+6，财富+5）'), effects: { reputation: 6, wealth: 5 }, next: '8_5' },
      { label: T('event.8_4c.opt2.label', null, 'C：与家人共度纪念'), hint: T('event.8_4c.opt2.hint', null, '把这一刻留给至亲（家庭+8，声誉+3）'), effects: { family: 8, reputation: 3 }, next: '8_5' }
    ]
  };
  E['8_7'] = {
    id: '8_7', year: 2026, title: T('event.8_7.title', null, '留给后人的话'), kind: 'auto',
    text: function (s) {
      return narr(T('event.8_7.text', null, '走到这一程，你停下手，想给后来者留几句话。'), s, [
        { cond: function (s) { return MJ.dominantMeta(s.meta) === 'artPath'; }, text: T('event.8_7.branch0.text', null, '\n“别怕把整颗心交给一支舞、一首歌——那才是你真正活过的证据。”') },
        { cond: function (s) { return MJ.dominantMeta(s.meta) === 'phil'; }, text: T('event.8_7.branch1.text', null, '\n“若你手中有一点光，就分给暗处的人，这比任何奖杯都长久。”') },
        { cond: function (s) { return MJ.dominantMeta(s.meta) === 'mogul'; }, text: T('event.8_7.branch2.text', null, '\n“把热爱变成能握在手中的版图，也是一种写传奇的方式。”') },
        { cond: function (s) { return MJ.dominantMeta(s.meta) === 'recluse'; }, text: T('event.8_7.branch3.text', null, '\n“偶尔躲起来，听见自己的心跳，也挺好。”') },
        { cond: function (s) { return MJ.dominantMeta(s.meta) !== 'artPath' && MJ.dominantMeta(s.meta) !== 'phil' && MJ.dominantMeta(s.meta) !== 'mogul' && MJ.dominantMeta(s.meta) !== 'recluse'; }, text: T('event.8_7.branch4.text', null, '\n“无论走到哪，记得为何而唱。”') }
      ]);
    },
    next: '8_6'
  };

  E['7_3'] = {
    id: '7_3', year: 2009, title: T('event.7_3.title', null, '命运裁决'), kind: 'ending',
    text: function (s) {
      var dom = MJ.dominantMeta(s.meta);
      var base = '2009 年 6 月 25 日，聚光灯骤然熄灭。回望这一生，从盖瑞的廉价摇篮到全世界的舞台，你的每一个选择，都写就了独一份的传奇。';
      if (dom === 'artPath') base += '\n你留给世界的，是永远跳不完的舞步与听不腻的旋律——艺术，是你唯一不愿妥协的信仰。';
      else if (dom === 'phil') base += '\n你留给世界的，不只是一首首歌，还有无数双因为你的善意而重新亮起来的眼睛。';
      else if (dom === 'mogul') base += '\n你留给世界的，是一张张写满名字的版权契约——流行乐的王座，你用商人的手腕也坐过。';
      else if (dom === 'recluse') base += '\n你留给世界的，是一个越来越模糊的剪影——你终于学会，把最真实的自己藏进静默里。';
      base += '\n谢幕之后，故事由听者续写。';
      return base;
    },
    next: null
  };

  // ---------- 变体事件（GDD 5.6 可能性系统） ----------
  // 由引擎在章节切换时按概率插入，保证重复游玩性。
  E.V_OFFER = {
    id: 'V_OFFER', variant: true, window: [1985, 1990], weight: 50,
    title: T('event.V_OFFER.title', null, '神秘代言邀约'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_OFFER.text', null, '某品牌捧着天价合约找上门，条件是把你塞进高密度曝光的人潮里。名利与喘息，再次二选一。'), s, [
        { cond: function (s) { return (s.attributes.stress || 0) >= 50; }, text: T('event.V_OFFER.branch0.text', null, '你盯着合约，想起自己已经多久没好好睡过一觉。') }
      ]);
    },
    options: [
      { label: T('event.V_OFFER.opt0.label', null, 'A：接下这笔代言'), hint: T('event.V_OFFER.opt0.hint', null, '腰包鼓了，口碑微动（财富+15，声誉+5）'), effects: { wealth: 15, reputation: 5 }, next: '__RETURN__' },
      { label: T('event.V_OFFER.opt1.label', null, 'B：婉拒，退回创作'), hint: T('event.V_OFFER.opt1.hint', null, '守住本心（艺术+3）'), effects: { art: 3 }, next: '__RETURN__' }
    ]
  };
  E.V_SCARE = {
    id: 'V_SCARE', variant: true, window: [1970, 2009], weight: 30,
    title: T('event.V_SCARE.title', null, '健康惊吓'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_SCARE.text', null, '一次突如其来的晕眩让你当众软倒，身体的警报器，终于刺耳地响了起来。'), s, [
        { cond: function (s) { return (s.attributes.health || 0) <= 45; }, text: T('event.V_SCARE.branch0.text', null, '你早该听见的警告，此刻像迟到的钟声，沉甸甸地落下来。') }
      ]);
    },
    options: [
      { label: T('event.V_SCARE.opt0.label', null, 'A：立刻放下一切休养'), hint: T('event.V_SCARE.opt0.hint', null, '回血也回神（健康+8，压力-5）'), effects: { health: 8, stress: -5 }, next: '__RETURN__' },
      { label: T('event.V_SCARE.opt1.label', null, 'B：咬牙撑住日程'), hint: T('event.V_SCARE.opt1.hint', null, '硬扛到底，代价是更深的透支（压力+8）'), effects: { stress: 8 }, next: '__RETURN__' }
    ]
  };
  E.V_PAPARAZZI = {
    id: 'V_PAPARAZZI', variant: true, window: [1990, 2005], weight: 40,
    title: T('event.V_PAPARAZZI.title', null, '狗仔围堵'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_PAPARAZZI.text', null, '狗仔与私生饭的镜头，像影子一样贴着你。私生活的最后一寸缝隙，也被闪光灯填满。'), s, [
        { cond: function (s) { return (s.meta.recluse || 0) >= 1; }, text: T('event.V_PAPARAZZI.branch0.text', null, '你越来越想把自己藏起来，可镜头比你还执拗。') }
      ]);
    },
    options: [
      { label: T('event.V_PAPARAZZI.opt0.label', null, 'A：礼貌地侧身避开'), hint: T('event.V_PAPARAZZI.opt0.hint', null, '体面退场，闲言渐起（声誉+3，压力+5）'), effects: { reputation: 3, stress: 5, media: -2 }, next: '__RETURN__' },
      { label: T('event.V_PAPARAZZI.opt1.label', null, 'B：强硬回击'), hint: T('event.V_PAPARAZZI.opt1.hint', null, '怒火外露，口碑受损（声誉-3，压力+8）'), effects: { reputation: -3, stress: 8, media: -6 }, next: '__RETURN__' }
    ]
  };
  E.V_RUMOR = {
    id: 'V_RUMOR', variant: true, window: [1993, 2003], weight: 35,
    title: T('event.V_RUMOR.title', null, '媒体谣言'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_RUMOR.text', null, '一波没影的谣言在八卦版面上发酵，真伪难辨，却已先声夺人。'), s, [
        { cond: function (s) { return (s.attributes.reputation || 0) <= 50; }, text: T('event.V_RUMOR.branch0.text', null, '本就摇摇欲坠的口碑，经不起再一场无中生有。') }
      ]);
    },
    options: [
      { label: T('event.V_RUMOR.opt0.label', null, 'A：冷处理不理会'), hint: T('event.V_RUMOR.opt0.hint', null, '任其自生自灭，口碑微损（声誉-3）'), effects: { reputation: -3, media: -4 }, next: '__RETURN__' },
      { label: T('event.V_RUMOR.opt1.label', null, 'B：主动出面澄清'), hint: T('event.V_RUMOR.opt1.hint', null, '以正视听，徒增疲惫（声誉+3，压力+5）'), effects: { reputation: 3, stress: 5, media: 4 }, next: '__RETURN__' }
    ]
  };
  E.V_COLLAB = {
    id: 'V_COLLAB', variant: true, window: [1995, 2005], weight: 35,
    title: T('event.V_COLLAB.title', null, '后辈求合作'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_COLLAB.text', null, '当红的后辈揣着 demo 登门，眼里有你当年的光。他想与你，合唱一首跨越代际的歌。'), s, [
        { cond: function (s) { return (s.attributes.family || 0) >= 70; }, text: T('event.V_COLLAB.branch0.text', null, '你看着他，像看见当年那个也想被世界听见的自己。') }
      ]);
    },
    options: [
      { label: T('event.V_COLLAB.opt0.label', null, 'A：欣然同台'), hint: T('event.V_COLLAB.opt0.hint', null, '薪火相传，暖意融融（艺术+8，家庭+5）'), effects: { art: 8, family: 5 }, next: '__RETURN__' },
      { label: T('event.V_COLLAB.opt1.label', null, 'B：婉拒好意'), hint: T('event.V_COLLAB.opt1.hint', null, '留白给自己（艺术+3）'), effects: { art: 3 }, next: '__RETURN__' }
    ]
  };
  E.V_ASIA = {
    id: 'V_ASIA', variant: true, window: [1991, 2005], weight: 35,
    title: T('event.V_ASIA.title', null, '亚洲巡演邀约'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_ASIA.text', null, '亚洲几座城市的邀约像雪片飞来，票房的数字令人心动，可连轴转的行程也让人发怵。'), s, [
        { cond: function (s) { return (s.attributes.stress || 0) >= 50; }, text: T('event.V_ASIA.branch0.text', null, '你数了数日历上密密麻麻的红色标记，咽了口唾沫。') }
      ]);
    },
    options: [
      { label: T('event.V_ASIA.opt0.label', null, 'A：接下这片新大陆'), hint: T('event.V_ASIA.opt0.hint', null, '进账可观，身心俱疲（财富+20，压力+10）'), effects: { wealth: 20, stress: 10 }, next: '__RETURN__' },
      { label: T('event.V_ASIA.opt1.label', null, 'B：婉拒，留守录音室'), hint: T('event.V_ASIA.opt1.hint', null, '潜心打磨（艺术+8）'), effects: { art: 8 }, next: '__RETURN__' }
    ]
  };
  E.V_CHARITY = {
    id: 'V_CHARITY', variant: true, window: [1993, 2005], weight: 30,
    cond: function (s) { return s.flags.healWorld === true; },
    title: T('event.V_CHARITY.title', null, '全球儿童慈善义演'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_CHARITY.text', null, '依托你亲手创立的公益基金会，主办方提议办一场跨国的儿童慈善义演。聚光灯，这一次为远方而亮。'), s, [
        { cond: function (s) { return (s.meta.phil || 0) >= 2; }, text: T('event.V_CHARITY.branch0.text', null, '公益早已成了你生命里的第二份事业，你几乎不假思索就点了头。') }
      ]);
    },
    options: [
      { label: T('event.V_CHARITY.opt0.label', null, 'A：倾尽全力筹办'), hint: T('event.V_CHARITY.opt0.hint', null, '善名广传，爱心+1（声誉+12，家庭+5，压力+8，慈善+1）'), effects: { reputation: 12, family: 5, stress: 8, phil: 1 }, next: '__RETURN__' },
      { label: T('event.V_CHARITY.opt1.label', null, 'B：仅名义站台'), hint: T('event.V_CHARITY.opt1.hint', null, '举手之劳（声誉+5）'), effects: { reputation: 5 }, next: '__RETURN__' }
    ]
  };

  // ----- 新增变体题材库（③ 扩充） -----
  E.V_PRESS = {
    id: 'V_PRESS', variant: true, window: [1988, 2005], weight: 35,
    title: T('event.V_PRESS.title', null, '深度专访邀约'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_PRESS.text', null, '一档极具分量的访谈节目递来邀约，主持人想聊聊“真实的你”。镜头之后，是又一场关于坦诚的赌注。'), s, [
        { cond: function (s) { return (s.attributes.reputation || 0) <= 50; }, text: T('event.V_PRESS.branch0.text', null, '你太清楚，话一旦出口，就会变成别人嘴里的另一种故事。') }
      ]);
    },
    options: [
      { label: T('event.V_PRESS.opt0.label', null, 'A：坦诚分享心路'), hint: T('event.V_PRESS.opt0.hint', null, '卸下伪装，声誉上升（声誉+8，压力+5）'), effects: { reputation: 8, stress: 5 }, next: '__RETURN__' },
      { label: T('event.V_PRESS.opt1.label', null, 'B：保持神秘'), hint: T('event.V_PRESS.opt1.hint', null, '守住边界，退意微生（隐士+1，压力-3）'), effects: { recluse: 1, stress: -3 }, next: '__RETURN__' }
    ]
  };
  E.V_BACKSTAGE = {
    id: 'V_BACKSTAGE', variant: true, window: [1982, 2005], weight: 30,
    title: T('event.V_BACKSTAGE.title', null, '巡演后台崩溃'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_BACKSTAGE.text', null, '一场巡演的间隙，你在空荡的后台摘下耳返，忽然不想再面对下一座城市的万人欢呼。'), s, [
        { cond: function (s) { return (s.attributes.stress || 0) >= 55; }, text: T('event.V_BACKSTAGE.branch0.text', null, '紧绷的弦已经绷到极限，你怕自己会在台上垮掉。') }
      ]);
    },
    options: [
      { label: T('event.V_BACKSTAGE.opt0.label', null, 'A：独自消化情绪'), hint: T('event.V_BACKSTAGE.opt0.hint', null, '内敛但孤独（压力+5，隐士+1）'), effects: { stress: 5, recluse: 1 }, next: '__RETURN__' },
      { label: T('event.V_BACKSTAGE.opt1.label', null, 'B：向团队倾诉'), hint: T('event.V_BACKSTAGE.opt1.hint', null, '释放压力，关系更近（压力-8，家庭+3）'), effects: { stress: -8, family: 3 }, next: '__RETURN__' }
    ]
  };
  E.V_FAMILY = {
    id: 'V_FAMILY', variant: true, window: [1985, 2005], weight: 30,
    cond: function (s) { return !!s.flags.marriedDebbie || !!s.flags.marriedLisa || !!s.flags.blanketBorn; },
    title: T('event.V_FAMILY.title', null, '家庭温馨时刻'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_FAMILY.text', null, '难得的一段空闲，孩子的小手拽着你的衣角，要你讲一个睡前故事。镁光灯之外，时间慢了下来。'), s, [
        { cond: function (s) { return (s.attributes.family || 0) >= 70; }, text: T('event.V_FAMILY.branch0.text', null, '你忽然明白，这间屋子里暖暖的喧闹，比任何奖杯都珍贵。') }
      ]);
    },
    options: [
      { label: T('event.V_FAMILY.opt0.label', null, 'A：全心陪伴家人'), hint: T('event.V_FAMILY.opt0.hint', null, '亲情升温，暂离喧嚣（家庭+8，压力-5）'), effects: { family: 8, stress: -5 }, next: '__RETURN__' },
      { label: T('event.V_FAMILY.opt1.label', null, 'B：匆匆赶回工作'), hint: T('event.V_FAMILY.opt1.hint', null, '事业优先，亲情微凉（财富+5，家庭-3）'), effects: { wealth: 5, family: -3 }, next: '__RETURN__' }
    ]
  };
  E.V_BLOCK = {
    id: 'V_BLOCK', variant: true, window: [1982, 2005], weight: 30,
    title: T('event.V_BLOCK.title', null, '创作瓶颈'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_BLOCK.text', null, '录音室里，你对着一段怎么也写不顺的副歌发呆。灵感的井，似乎一夜之间干涸了。'), s, [
        { cond: function (s) { return (s.attributes.art || 0) >= 80; }, text: T('event.V_BLOCK.branch0.text', null, '越高的期许越像枷锁，你听见心里那个完美主义者在催促。') }
      ]);
    },
    options: [
      { label: T('event.V_BLOCK.opt0.label', null, 'A：闭关苦磨'), hint: T('event.V_BLOCK.opt0.hint', null, '淬炼出佳作（艺术+10，压力+5）'), effects: { art: 10, stress: 5 }, next: '__RETURN__' },
      { label: T('event.V_BLOCK.opt1.label', null, 'B：暂且搁笔'), hint: T('event.V_BLOCK.opt1.hint', null, '留白养神（压力-5，艺术+3）'), effects: { stress: -5, art: 3 }, next: '__RETURN__' }
    ]
  };
  E.V_FANMAIL = {
    id: 'V_FANMAIL', variant: true, window: [1983, 2005], weight: 35,
    title: T('event.V_FANMAIL.title', null, '一封粉丝来信'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_FANMAIL.text', null, '助理抱来一摞信件，其中一封来自重病中的孩子，说你的歌是她黑夜里的光。'), s, [
        { cond: function (s) { return (s.meta.phil || 0) >= 1; }, text: T('event.V_FANMAIL.branch0.text', null, '你想起自己基金会里那些相似的眼睛，鼻头忽然一酸。') }
      ]);
    },
    options: [
      { label: T('event.V_FANMAIL.opt0.label', null, 'A：亲笔回信鼓励'), hint: T('event.V_FANMAIL.opt0.hint', null, '善意回馈，暖意融融（家庭+3，声誉+3）'), effects: { family: 3, reputation: 3 }, next: '__RETURN__' },
      { label: T('event.V_FANMAIL.opt1.label', null, 'B：交由团队处理'), hint: T('event.V_FANMAIL.opt1.hint', null, '体面但疏离（声誉+1）'), effects: { reputation: 1 }, next: '__RETURN__' }
    ]
  };
  E.V_HONOR = {
    id: 'V_HONOR', variant: true, window: [1990, 2009], weight: 30,
    title: T('event.V_HONOR.title', null, '终身荣誉加冕'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_HONOR.text', null, '某权威机构要将一座终身成就奖颁给你。聚光灯再次亮起，只是这一次，镜头里多了几分致敬的郑重。'), s, [
        { cond: function (s) { return (s.attributes.reputation || 0) >= 80; }, text: T('event.V_HONOR.branch0.text', null, '你已是符号般的存在，这座奖更像是对一个时代的盖章。') }
      ]);
    },
    options: [
      { label: T('event.V_HONOR.opt0.label', null, 'A：盛装出席领奖'), hint: T('event.V_HONOR.opt0.hint', null, '风光加冕（声誉+10，压力+3）'), effects: { reputation: 10, stress: 3 }, next: '__RETURN__' },
      { label: T('event.V_HONOR.opt1.label', null, 'B：缺席托人代领'), hint: T('event.V_HONOR.opt1.hint', null, '低调避世（隐士+1，压力-3）'), effects: { recluse: 1, stress: -3 }, next: '__RETURN__' }
    ]
  };
  E.V_DEAL = {
    id: 'V_DEAL', variant: true, window: [1985, 2005], weight: 30,
    cond: function (s) { return s.flags.isSolo === true; },
    title: T('event.V_DEAL.title', null, '商业谈判桌'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_DEAL.text', null, '又一桩生意摆在面前：代言、版权或是合资。谈判桌对面的人，眼里算的是数字，你心里盘的是版图。'), s, [
        { cond: function (s) { return (s.meta.mogul || 0) >= 1; }, text: T('event.V_DEAL.branch0.text', null, '商人的直觉让你一眼看穿对方的底牌，你几乎要笑出声。') }
      ]);
    },
    options: [
      { label: T('event.V_DEAL.opt0.label', null, 'A：强势压价'), hint: T('event.V_DEAL.opt0.hint', null, '商业嗅觉+1，树敌隐忧（商业+1，声誉-2）'), effects: { mogul: 1, reputation: -2 }, next: '__RETURN__' },
      { label: T('event.V_DEAL.opt1.label', null, 'B：让利求合作'), hint: T('event.V_DEAL.opt1.hint', null, '广结善缘（声誉+5，财富-3）'), effects: { reputation: 5, wealth: -3 }, next: '__RETURN__' }
    ]
  };
  E.V_NOSTALGIA = {
    id: 'V_NOSTALGIA', variant: true, window: [1990, 2009], weight: 25,
    title: T('event.V_NOSTALGIA.title', null, '旧友重逢'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_NOSTALGIA.text', null, '一张泛黄的照片把你拉回盖瑞的旧屋。那位儿时玩伴偶然重逢，聊起初雪、蝉鸣和再也回不去的夏天。'), s, [
        { cond: function (s) { return (s.attributes.family || 0) >= 70; }, text: T('event.V_NOSTALGIA.branch0.text', null, '你忽然很想念，那个还没被全世界认识的自己。') }
      ]);
    },
    options: [
      { label: T('event.V_NOSTALGIA.opt0.label', null, 'A：感怀往昔'), hint: T('event.V_NOSTALGIA.opt0.hint', null, '温柔怀旧（家庭+5，压力-3）'), effects: { family: 5, stress: -3 }, next: '__RETURN__' },
      { label: T('event.V_NOSTALGIA.opt1.label', null, 'B：向前看'), hint: T('event.V_NOSTALGIA.opt1.hint', null, '聚焦当下（艺术+3）'), effects: { art: 3 }, next: '__RETURN__' }
    ]
  };
  E.V_LEGAL = {
    id: 'V_LEGAL', variant: true, window: [1993, 2005], weight: 25,
    cond: function (s) { return s.flags.neverlandType !== 'none'; },
    title: T('event.V_LEGAL.title', null, '法律风声'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_LEGAL.text', null, '律师在电话那头压低声音：又有风声在律师函与八卦版之间游走。你分不清哪边更锋利。'), s, [
        { cond: function (s) { return (s.attributes.reputation || 0) <= 50; }, text: T('event.V_LEGAL.branch0.text', null, '你早已学会，在风声里走路，把脊背挺直。') }
      ]);
    },
    options: [
      { label: T('event.V_LEGAL.opt0.label', null, 'A：不予置评'), hint: T('event.V_LEGAL.opt0.hint', null, '冷处理（压力+3，隐士+1）'), effects: { stress: 3, recluse: 1, media: -3 }, next: '__RETURN__' },
      { label: T('event.V_LEGAL.opt1.label', null, 'B：主动公关'), hint: T('event.V_LEGAL.opt1.hint', null, '以正视听（声誉+3，压力+5）'), effects: { reputation: 3, stress: 5, media: 4 }, next: '__RETURN__' }
    ]
  };

  // ----- 更细年份窗口的新变体题材（年代化纹理） -----
  E.V_CHILDHOOD = {
    id: 'V_CHILDHOOD', variant: true, window: [1965, 1976], weight: 35,
    title: T('event.V_CHILDHOOD.title', null, '童星日程'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_CHILDHOOD.text', null, '排练表从清晨排到深夜，同龄的孩子在街上奔跑，你却在镜前一遍遍校正舞步。'), s, [
        { cond: function (s) { return (s.attributes.stress || 0) >= 40; }, text: T('event.V_CHILDHOOD.branch0.text', null, '你数着窗外的星星，盼着哪天能像他们一样，只是个孩子。') }
      ]);
    },
    options: [
      { label: T('event.V_CHILDHOOD.opt0.label', null, 'A：咬牙加练'), hint: T('event.V_CHILDHOOD.opt0.hint', null, '技艺精进，身心俱疲（艺术+8，压力+5）'), effects: { art: 8, stress: 5 }, epilogue: T('event.V_CHILDHOOD.opt0.epilogue', null, '你把童年摁进了节拍里，镜中的舞步越来越稳，眼底的疲惫也越来越深。'), next: '__RETURN__' },
      { label: T('event.V_CHILDHOOD.opt1.label', null, 'B：偷得浮生'), hint: T('event.V_CHILDHOOD.opt1.hint', null, '短暂喘息（压力-5，家庭+3）'), effects: { stress: -5, family: 3 }, epilogue: T('event.V_CHILDHOOD.opt1.epilogue', null, '你溜去巷口看了一回弹珠，那点偷来的快乐，比任何掌声都真实。'), next: '__RETURN__' }
    ]
  };
  E.V_DISCO = {
    id: 'V_DISCO', variant: true, window: [1978, 1982], weight: 30,
    title: T('event.V_DISCO.title', null, '迪斯科浪潮'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_DISCO.text', null, '街头的霓虹随迪斯科的鼓点晃动，整个时代都在扭动。你站在潮流的门口，犹豫要不要推门。'), s, [
        { cond: function (s) { return (s.attributes.art || 0) >= 60; }, text: T('event.V_DISCO.branch0.text', null, '你听见身体里那股想跟着跳的冲动，它比你以为的更诚实。') }
      ]);
    },
    options: [
      { label: T('event.V_DISCO.opt0.label', null, 'A：拥抱潮流'), hint: T('event.V_DISCO.opt0.hint', null, '时代同步，声名+（艺术+8，声誉+5）'), effects: { art: 8, reputation: 5 }, epilogue: T('event.V_DISCO.opt0.epilogue', null, '你让身体跟上时代的鼓点，新的旋律在血液里发芽。'), next: '__RETURN__' },
      { label: T('event.V_DISCO.opt1.label', null, 'B：冷眼旁观'), hint: T('event.V_DISCO.opt1.hint', null, '守住自我（艺术+3）'), effects: { art: 3 }, epilogue: T('event.V_DISCO.opt1.epilogue', null, '你站在舞池边缘，悄悄记下了这阵风，却没让自己被卷走。'), next: '__RETURN__' }
    ]
  };
  E.V_FAME_WINDOW = {
    id: 'V_FAME_WINDOW', variant: true, window: [1982, 1985], weight: 30,
    title: T('event.V_FAME_WINDOW.title', null, '巅峰眩晕'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_FAME_WINDOW.text', null, '《Thriller》的余温未散，世界把你架到了一个前所未有的高度。风很烈，也容易让人忘记脚下的地。'), s, [
        { cond: function (s) { return (s.attributes.stress || 0) >= 45; }, text: T('event.V_FAME_WINDOW.branch0.text', null, '你开始分不清，台下欢呼的是音乐，还是那个被神话了的名字。') }
      ]);
    },
    options: [
      { label: T('event.V_FAME_WINDOW.opt0.label', null, 'A：享受荣光'), hint: T('event.V_FAME_WINDOW.opt0.hint', null, '声名更响，暗生虚浮（声誉+8，压力+5）'), effects: { reputation: 8, stress: 5 }, epilogue: T('event.V_FAME_WINDOW.opt0.epilogue', null, '你在掌声里多停了一秒，那点眩晕，后来成了最难戒的甜。'), next: '__RETURN__' },
      { label: T('event.V_FAME_WINDOW.opt1.label', null, 'B：如履薄冰'), hint: T('event.V_FAME_WINDOW.opt1.hint', null, '清醒自律（压力-5，艺术+3）'), effects: { stress: -5, art: 3 }, epilogue: T('event.V_FAME_WINDOW.opt1.epilogue', null, '你把奖杯摆正，提醒自己：明天还要对着空白的五线谱。'), next: '__RETURN__' }
    ]
  };
  E.V_TABLOID = {
    id: 'V_TABLOID', variant: true, window: [1986, 1990], weight: 35,
    title: T('event.V_TABLOID.title', null, '小报初袭'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_TABLOID.text', null, '八卦小报第一次把镜头对准你私生活的褶皱，标题比事实更大更红。'), s, [
        { cond: function (s) { return (s.attributes.reputation || 0) <= 50; }, text: T('event.V_TABLOID.branch0.text', null, '你忽然明白，被写进报纸，和被写进歌里，是两种完全不同的滋味。') }
      ]);
    },
    options: [
      { label: T('event.V_TABLOID.opt0.label', null, 'A：正面回应'), hint: T('event.V_TABLOID.opt0.hint', null, '以正视听（声誉+3，压力+5）'), effects: { reputation: 3, stress: 5, media: -3 }, epilogue: T('event.V_TABLOID.opt0.epilogue', null, '你站出来把话说清，镜头却只截取了你最紧绷的那一秒。'), next: '__RETURN__' },
      { label: T('event.V_TABLOID.opt1.label', null, 'B：沉默以对'), hint: T('event.V_TABLOID.opt1.hint', null, '退入静默，隐士之心+1（压力+3，隐士+1）'), effects: { stress: 3, recluse: 1, media: -2 }, epilogue: T('event.V_TABLOID.opt1.epilogue', null, '你把窗帘拉紧了些，任由外界的猜测在门外喧嚣。'), next: '__RETURN__' }
    ]
  };
  E.V_BUBBLES = {
    id: 'V_BUBBLES', variant: true, window: [1985, 1990], weight: 25,
    title: T('event.V_BUBBLES.title', null, '童心宠物'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_BUBBLES.text', null, '庄园里多了一只会陪你玩耍的宠物猩猩，童真的笑第一次这么近。'), s, [
        { cond: function (s) { return (s.attributes.family || 0) >= 70; }, text: T('event.V_BUBBLES.branch0.text', null, '你想起小时候那个也想要个玩伴的自己。') }
      ]);
    },
    options: [
      { label: T('event.V_BUBBLES.opt0.label', null, 'A：童心未泯'), hint: T('event.V_BUBBLES.opt0.hint', null, '暖意融融（家庭+5）'), effects: { family: 5 }, epilogue: T('event.V_BUBBLES.opt0.epilogue', null, '你在草地上和它滚作一团，那一刻，你只是个爱玩的大孩子。'), next: '__RETURN__' },
      { label: T('event.V_BUBBLES.opt1.label', null, 'B：担心舆论'), hint: T('event.V_BUBBLES.opt1.hint', null, '束手束脚（声誉-3，压力+3）'), effects: { reputation: -3, stress: 3 }, epilogue: T('event.V_BUBBLES.opt1.epilogue', null, '你怕镜头把这当成又一个怪谈，只好把那份快乐悄悄收了起来。'), next: '__RETURN__' }
    ]
  };
  E.V_INTERNET = {
    id: 'V_INTERNET', variant: true, window: [1998, 2005], weight: 30,
    title: T('event.V_INTERNET.title', null, '网络谣言'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_INTERNET.text', null, '互联网初兴，未经核实的传言以光速蔓延，你成了屏幕上人人可判的被告。'), s, [
        { cond: function (s) { return (s.attributes.reputation || 0) <= 50; }, text: T('event.V_INTERNET.branch0.text', null, '你发现，辟谣的速度，永远追不上谣言繁殖的速度。') }
      ]);
    },
    options: [
      { label: T('event.V_INTERNET.opt0.label', null, 'A：冷处理'), hint: T('event.V_INTERNET.opt0.hint', null, '任其沉底（声誉-3，压力+3）'), effects: { reputation: -3, stress: 3, media: -3 }, epilogue: T('event.V_INTERNET.opt0.epilogue', null, '你关掉屏幕，假装那些字句伤不到你，可夜里的辗转出卖了你。'), next: '__RETURN__' },
      { label: T('event.V_INTERNET.opt1.label', null, 'B：亲自辟谣'), hint: T('event.V_INTERNET.opt1.hint', null, '以正视听（声誉+5，压力+5）'), effects: { reputation: 5, stress: 5, media: 5 }, flags: { internetSavvy: true }, epilogue: T('event.V_INTERNET.opt1.epilogue', null, '你敲下一段郑重其事的回应，寄望真相能跑赢偏见。'), next: '__RETURN__' }
    ]
  };
  E.V_COMEBACK = {
    id: 'V_COMEBACK', variant: true, window: [2006, 2009], weight: 35,
    title: T('event.V_COMEBACK.title', null, '复出筹备'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_COMEBACK.text', null, '《This Is It》的鼓点在前方敲响，复出的帷幕正在拉开。久违的舞台，既让人热血，也让人忐忑。'), s, [
        { cond: function (s) { return (s.attributes.health || 0) <= 45; }, text: T('event.V_COMEBACK.branch0.text', null, '你摸了摸隐隐作痛的关节，不知道这副身子还能不能接住当年的自己。') }
      ]);
    },
    options: [
      { label: T('event.V_COMEBACK.opt0.label', null, 'A：满腔热忱'), hint: T('event.V_COMEBACK.opt0.hint', null, '重燃舞台魂（艺术+8，压力+5）'), effects: { art: 8, stress: 5 }, epilogue: T('event.V_COMEBACK.opt0.epilogue', null, '你对着镜子压了压腿，久违的亢奋，像年轻时在后台那样涌了上来。'), next: '__RETURN__' },
      { label: T('event.V_COMEBACK.opt1.label', null, 'B：忧心健康'), hint: T('event.V_COMEBACK.opt1.hint', null, '谨慎以待（健康-5，压力+5）'), effects: { health: -5, stress: 5 }, epilogue: T('event.V_COMEBACK.opt1.epilogue', null, '体检单上的红字让你犹豫，可你又不甘心就此向舞台告别。'), next: '__RETURN__' }
    ]
  };
  E.V_DOCTOR = {
    id: 'V_DOCTOR', variant: true, window: [2007, 2009], weight: 30,
    cond: function (s) { return s.flags.isSolo === true; },
    title: T('event.V_DOCTOR.title', null, '私人医生'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_DOCTOR.text', null, '一位随行的私人医生出现在你身边，处方笺上的字，成了你最难拒绝的安慰。'), s, [
        { cond: function (s) { return (s.attributes.health || 0) <= 45; }, text: T('event.V_DOCTOR.branch0.text', null, '疼痛需要一个出口，而他就站在离你最近的地方。') }
      ]);
    },
    options: [
      { label: T('event.V_DOCTOR.opt0.label', null, 'A：倚赖处方'), hint: T('event.V_DOCTOR.opt0.hint', null, '痛楚暂退，暗藏隐忧（健康+8，压力-5）'), effects: { health: 8, stress: -5 }, epilogue: T('event.V_DOCTOR.opt0.epilogue', null, '针尖落处，世界软了下来；只是你没察觉，自己正一点点交出了清醒的缰绳。'), next: '__RETURN__' },
      { label: T('event.V_DOCTOR.opt1.label', null, 'B：保持清醒'), hint: T('event.V_DOCTOR.opt1.hint', null, '克制自律（健康+3，压力+3）'), effects: { health: 3, stress: 3 }, epilogue: T('event.V_DOCTOR.opt1.epilogue', null, '你把处方推了回去，宁愿忍着疼，也想把方向盘握在自己手里。'), next: '__RETURN__' }
    ]
  };

  // ----- 补充变体：让四条元路线都有变体代表（artPath 此前缺位） -----
  E.V_SONGWRITE = {
    id: 'V_SONGWRITE', variant: true, window: [1983, 2005], weight: 30,
    title: T('event.V_SONGWRITE.title', null, '深夜创作'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_SONGWRITE.text', null, '又一宿未眠，你在钢琴前反复推敲一段旋律。天快亮时，那个让你心跳的动机终于浮现。'), s, [
        { cond: function (s) { return (s.attributes.art || 0) >= 80; }, text: T('event.V_SONGWRITE.branch0.text', null, '完美主义的耳朵不肯放过任何一个音符，你又把自己逼到了墙角。') }
      ]);
    },
    options: [
      { label: T('event.V_SONGWRITE.opt0.label', null, 'A：顺手记下灵感'), hint: T('event.V_SONGWRITE.opt0.hint', null, '灵感入册，匠心+1（艺术+5，artPath+1）'), effects: { art: 5, artPath: 1 }, next: '__RETURN__' },
      { label: T('event.V_SONGWRITE.opt1.label', null, 'B：推翻重来'), hint: T('event.V_SONGWRITE.opt1.hint', null, '精益求精（艺术+8，压力+5）'), effects: { art: 8, stress: 5 }, next: '__RETURN__' }
    ]
  };
  E.V_BUSINESS_EMPIRE = {
    id: 'V_BUSINESS_EMPIRE', variant: true, window: [1985, 2005], weight: 30,
    cond: function (s) { return s.flags.isSolo === true; },
    title: T('event.V_BUSINESS_EMPIRE.title', null, '版图扩张'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_BUSINESS_EMPIRE.text', null, '你面前摊着一份版图不小的商业计划：主题乐园、唱片厂牌、版权矩阵。野心在账本上铺开。'), s, [
        { cond: function (s) { return (s.meta.mogul || 0) >= 1; }, text: T('event.V_BUSINESS_EMPIRE.branch0.text', null, '生意场上的嗅觉越来越灵，你几乎能闻到每一笔交易里的气味。') }
      ]);
    },
    options: [
      { label: T('event.V_BUSINESS_EMPIRE.opt0.label', null, 'A：大举收购'), hint: T('event.V_BUSINESS_EMPIRE.opt0.hint', null, '商业帝国+1，树大招风（mogul+1，声誉-2）'), effects: { mogul: 1, reputation: -2 }, next: '__RETURN__' },
      { label: T('event.V_BUSINESS_EMPIRE.opt1.label', null, 'B：稳扎稳打'), hint: T('event.V_BUSINESS_EMPIRE.opt1.hint', null, '步步为营（mogul+1，财富+8）'), effects: { mogul: 1, wealth: 8 }, next: '__RETURN__' }
    ]
  };
  E.V_GLOBAL_AID = {
    id: 'V_GLOBAL_AID', variant: true, window: [1993, 2008], weight: 30,
    cond: function (s) { return s.flags.healWorld === true; },
    title: T('event.V_GLOBAL_AID.title', null, '跨国援助'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_GLOBAL_AID.text', null, '依托你设立的公益基金会，一场面向战乱与疫病地区儿童的跨国援助被提上日程。聚光灯，这一次为远方而亮。'), s, [
        { cond: function (s) { return (s.meta.phil || 0) >= 2; }, text: T('event.V_GLOBAL_AID.branch0.text', null, '公益早已成了你生命里甩不掉的牵挂，你几乎不假思索就点了头。') }
      ]);
    },
    options: [
      { label: T('event.V_GLOBAL_AID.opt0.label', null, 'A：倾力投入'), hint: T('event.V_GLOBAL_AID.opt0.hint', null, '善名广传，仁爱+1（声誉+10，家庭+5，压力+8，慈善+1）'), effects: { reputation: 10, family: 5, stress: 8, phil: 1 }, next: '__RETURN__' },
      { label: T('event.V_GLOBAL_AID.opt1.label', null, 'B：量力而行'), hint: T('event.V_GLOBAL_AID.opt1.hint', null, '克尽绵薄（声誉+5，慈善+1）'), effects: { reputation: 5, phil: 1 }, next: '__RETURN__' }
    ]
  };
  E.V_SANCTUARY = {
    id: 'V_SANCTUARY', variant: true, window: [1990, 2009], weight: 30,
    title: T('event.V_SANCTUARY.title', null, '世外桃源'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_SANCTUARY.text', null, '你越来越想躲开所有镜头，去一个连名字都没人认识的地方。庄园深处，安静得能听见自己的心跳。'), s, [
        { cond: function (s) { return (s.meta.recluse || 0) >= 1; }, text: T('event.V_SANCTUARY.branch0.text', null, '你发现自己竟开始享受这份与世隔绝，连门铃都成了多余的声响。') }
      ]);
    },
    options: [
      { label: T('event.V_SANCTUARY.opt0.label', null, 'A：彻底隐居'), hint: T('event.V_SANCTUARY.opt0.hint', null, '退入静默（隐士+2，压力-5）'), effects: { recluse: 2, stress: -5 }, next: '__RETURN__' },
      { label: T('event.V_SANCTUARY.opt1.label', null, 'B：偶尔露面'), hint: T('event.V_SANCTUARY.opt1.hint', null, '张弛有度（隐士+1，声誉+3）'), effects: { recluse: 1, reputation: 3 }, next: '__RETURN__' }
    ]
  };

  // ----- 隐藏彩蛋：东方之约（被搁置的 chinaVisit，低概率+高门槛，纯文化中性彩蛋） -----
  E.V_CHINA = {
    id: 'V_CHINA', variant: true, window: [1993, 2005], weight: 6,
    cond: function (s) { return (s.attributes.reputation || 0) >= 80 && ((s.meta.phil || 0) >= 2 || (s.meta.artPath || 0) >= 2); },
    title: T('event.V_CHINA.title', null, '东方之约'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_CHINA.text', null, '一封来自东方的邀约跨海而来：希望你在长江与长城之间，办一场跨越文化的音乐会。两种古老与现代交汇的想象力，让你心动。'), s, [
        { cond: function (s) { return (s.meta.phil || 0) >= 1; }, text: T('event.V_CHINA.branch0.text', null, '你想起 Heal the World 的初衷——音乐本就不该有国界。') }
      ]);
    },
    options: [
      { label: T('event.V_CHINA.opt0.label', null, 'A：赴约东方'), hint: T('event.V_CHINA.opt0.hint', null, '跨越山海的共鸣（艺术+8，声誉+8，慈善+1）'), effects: { art: 8, reputation: 8, phil: 1 }, flags: { chinaVisit: true }, next: '__RETURN__' },
      { label: T('event.V_CHINA.opt1.label', null, 'B：婉拒，专注当下'), hint: T('event.V_CHINA.opt1.hint', null, '留白给自己（艺术+3）'), effects: { art: 3 }, next: '__RETURN__' }
    ]
  };

  // ----- 隐藏/条件变体：稀有门控事件（GDD §5.7 隐藏/条件事件） -----
  E.V_INVINCIBLE_CLASH = {
    id: 'V_INVINCIBLE_CLASH', variant: true, window: [2001, 2003], weight: 35,
    cond: function (s) { return s.flags.invincibleStarted === true; },
    title: T('event.V_INVINCIBLE_CLASH.title', null, '与厂牌的拉锯'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_INVINCIBLE_CLASH.text', null, '《Invincible》的销量没能追上你的野心，厂牌方的脸色也冷了下来。合同里的字句，忽然成了勒紧喉咙的绳。'), s, [
        { cond: function (s) { return (s.meta.mogul || 0) >= 1; }, text: T('event.V_INVINCIBLE_CLASH.branch0.text', null, '生意人的直觉告诉你，这场博弈拼的不只是音乐，更是筹码。') }
      ]);
    },
    options: [
      { label: T('event.V_INVINCIBLE_CLASH.opt0.label', null, 'A：正面硬刚争取权益'), hint: T('event.V_INVINCIBLE_CLASH.opt0.hint', null, '保住创作尊严，商途生波（商业+1，声誉-3，压力+8）'), effects: { mogul: 1, reputation: -3, stress: 8 }, next: '__RETURN__' },
      { label: T('event.V_INVINCIBLE_CLASH.opt1.label', null, 'B：忍让保全关系'), hint: T('event.V_INVINCIBLE_CLASH.opt1.hint', null, '以退为进（压力+5，声誉+3）'), effects: { stress: 5, reputation: 3 }, next: '__RETURN__' }
    ]
  };
  E.V_MOONWALK_TRIBUTE = {
    id: 'V_MOONWALK_TRIBUTE', variant: true, window: [1984, 2009], weight: 25,
    cond: function (s) { return (s.attributes.art || 0) >= 80; },
    title: T('event.V_MOONWALK_TRIBUTE.title', null, '传奇舞步的回响'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_MOONWALK_TRIBUTE.text', null, '街头的少年们模仿着你那记滑步，一段段粗糙却真诚的录像在网上疯传。你的舞，成了别人青春里的注脚。'), s, [
        { cond: function (s) { return (s.meta.recluse || 0) >= 1; }, text: T('event.V_MOONWALK_TRIBUTE.branch0.text', null, '你隔着屏幕看着那些模仿者，竟有点想藏起自己，又有点暖。') }
      ]);
    },
    options: [
      { label: T('event.V_MOONWALK_TRIBUTE.opt0.label', null, 'A：欣慰于传承'), hint: T('event.V_MOONWALK_TRIBUTE.opt0.hint', null, '艺术火种延续（艺术+5，声誉+5）'), effects: { art: 5, reputation: 5 }, next: '__RETURN__' },
      { label: T('event.V_MOONWALK_TRIBUTE.opt1.label', null, 'B：低调不回应'), hint: T('event.V_MOONWALK_TRIBUTE.opt1.hint', null, '退入静默，隐士之心+1（隐士+1，压力-3）'), effects: { recluse: 1, stress: -3 }, next: '__RETURN__' }
    ]
  };

  // ----- 隐藏/条件变体（续）：更多稀有门控叙事 -----
  E.V_DANGEROUS_ERA = {
    id: 'V_DANGEROUS_ERA', variant: true, window: [1991, 1993], weight: 28,
    cond: function (s) { return (s.attributes.art || 0) >= 80; },
    title: T('event.V_DANGEROUS_ERA.title', null, '《Dangerous》视听革命'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_DANGEROUS_ERA.text', null, '你把自己关进剪辑室，想把音乐录影带拍成一部部微型电影。当白衣在镜头里定格，流行乐的视觉语言被你重新改写。'), s, [
        { cond: function (s) { return (s.meta.recluse || 0) >= 1; }, text: T('event.V_DANGEROUS_ERA.branch0.text', null, '镜头外的你其实更愿意独处，可一旦开机，你又成了那个燃烧全场的自己。') }
      ]);
    },
    options: [
      { label: T('event.V_DANGEROUS_ERA.opt0.label', null, 'A：把每支 MV 当电影拍'), hint: T('event.V_DANGEROUS_ERA.opt0.hint', null, '视听标杆立起（艺术+6，声誉+5）'), effects: { art: 6, reputation: 5 }, next: '__RETURN__' },
      { label: T('event.V_DANGEROUS_ERA.opt1.label', null, 'B：押注前卫特效'), hint: T('event.V_DANGEROUS_ERA.opt1.hint', null, '科技感拉满，话题与疲惫齐来（艺术+5，声誉+3，压力+5）'), effects: { art: 5, reputation: 3, stress: 5 }, next: '__RETURN__' }
    ]
  };
  E.V_HISTORY_MOMENT = {
    id: 'V_HISTORY_MOMENT', variant: true, window: [1995, 1997], weight: 26,
    cond: function (s) { return (s.attributes.reputation || 0) >= 80; },
    title: T('event.V_HISTORY_MOMENT.title', null, '《HIStory》与世纪宣言'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_HISTORY_MOMENT.text', null, '你用一张双碟专辑向整个时代喊话，封面上的你如雕像般俯视众生。盛名至此，既是一种加冕，也是一座高台。'), s, [
        { cond: function (s) { return (s.meta.mogul || 0) >= 1; }, text: T('event.V_HISTORY_MOMENT.branch0.text', null, '你清楚这张唱片背后的版权与版图，远比旋律本身更值钱。') },
        { cond: function (s) { return (s.meta.recluse || 0) >= 1; }, text: T('event.V_HISTORY_MOMENT.branch1.text', null, '台前的 monument 越宏伟，台后的你越想缩回那道缝里。') }
      ]);
    },
    options: [
      { label: T('event.V_HISTORY_MOMENT.opt0.label', null, 'A：把宣言唱给世界'), hint: T('event.V_HISTORY_MOMENT.opt0.hint', null, '声望再攀高峰（声誉+7，艺术+4）'), effects: { reputation: 7, art: 4 }, next: '__RETURN__' },
      { label: T('event.V_HISTORY_MOMENT.opt1.label', null, 'B：以版权巩固版图'), hint: T('event.V_HISTORY_MOMENT.opt1.hint', null, '商业嗅觉变现（商业+1，财富+5）'), effects: { mogul: 1, wealth: 5 }, next: '__RETURN__' },
      { label: T('event.V_HISTORY_MOMENT.opt2.label', null, 'C：低调收束锋芒'), hint: T('event.V_HISTORY_MOMENT.opt2.hint', null, '退后半步，留一份清静（隐士+1，压力-3）'), effects: { recluse: 1, stress: -3 }, next: '__RETURN__' }
    ]
  };
  E.V_SECRET_WEDDING = {
    id: 'V_SECRET_WEDDING', variant: true, window: [1994, 1996], weight: 22,
    cond: function (s) { return s.flags.marriedLisa === true; },
    title: T('event.V_SECRET_WEDDING.title', null, '世纪婚礼的幕后'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_SECRET_WEDDING.text', null, '全世界都在围观这场世纪婚礼，闪光灯比舞台还亮。可只有你们知道，红毯尽头牵着的手，到底是爱情，还是又一场被写好的剧本。'), s, [
        { cond: function (s) { return (s.attributes.family || 0) >= 70; }, text: T('event.V_SECRET_WEDDING.branch0.text', null, '你多希望镜头外的家人，能真心为这一刻鼓掌。') }
      ]);
    },
    options: [
      { label: T('event.V_SECRET_WEDDING.opt0.label', null, 'A：把这场婚姻当真'), hint: T('event.V_SECRET_WEDDING.opt0.hint', null, '真心经营，家庭升温（家庭+8，声誉+3）'), effects: { family: 8, reputation: 3 }, next: '__RETURN__' },
      { label: T('event.V_SECRET_WEDDING.opt1.label', null, 'B：视作公众剧本'), hint: T('event.V_SECRET_WEDDING.opt1.hint', null, '清醒地演下去，心却更远（声誉+5，家庭-3，压力+3）'), effects: { reputation: 5, family: -3, stress: 3 }, next: '__RETURN__' }
    ]
  };

  // ----- 体验深化 M6：童年闪回（孤独轴驱动，高孤独时触发） -----
  E.V_FLASHBACK = {
    id: 'V_FLASHBACK', variant: true, window: [1985, 2008], weight: 40,
    cond: function (s) { return (s.attributes.loneliness || 0) >= 35; },
    title: T('event.V_FLASHBACK.title', null, '盖瑞的回声'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_FLASHBACK.text', null, '深夜，盖瑞旧屋的煤油灯在梦里晃。父亲的节拍器、哥哥们的笑声，和那双再也回不去的小鞋，忽然全涌上来。'), s, [
        { cond: function (s) { return (s.attributes.family || 0) >= 70; }, text: T('event.V_FLASHBACK.branch0.text', null, '你抱着孩子，忽然很想给童年的自己一个拥抱。') }
      ]);
    },
    options: [
      { label: T('event.V_FLASHBACK.opt0.label', null, 'A：把思念写进歌里'), hint: T('event.V_FLASHBACK.opt0.hint', null, '温柔沉淀（艺术+5，孤独-8）'), effects: { art: 5, loneliness: -8 }, next: '__RETURN__' },
      { label: T('event.V_FLASHBACK.opt1.label', null, 'B：独自消化'), hint: T('event.V_FLASHBACK.opt1.hint', null, '内敛，却更孤（孤独+5，压力+3）'), effects: { loneliness: 5, stress: 3 }, next: '__RETURN__' }
    ]
  };

  // ---------- 续章专属变体池（g4：GDD §17.2，窗口 [2010,2026]） ----------
  E.V_POST_TRIBUTE = {
    id: 'V_POST_TRIBUTE', variant: true, window: [2010, 2026], weight: 35,
    title: T('event.V_POST_TRIBUTE.title', null, '年轻一代的翻唱致敬'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_POST_TRIBUTE.text', null, '社交平台上，一群少年翻唱你的歌走红。那些旋律被新一代重新哼起，像一封迟到却温热的手写信。'), s, [
        { cond: function (s) { return (s.attributes.reputation || 0) >= 75; }, text: T('event.V_POST_TRIBUTE.branch0.text', null, '你看着屏幕里那张年轻的面孔，像看见当年同样渴望被世界听见的自己。') }
      ]);
    },
    options: [
      { label: T('event.V_POST_TRIBUTE.opt0.label', null, 'A：欣然聆听并鼓励'), hint: T('event.V_POST_TRIBUTE.opt0.hint', null, '薪火暖意（艺术+5，家庭+3）'), effects: { art: 5, family: 3 }, next: '__RETURN__' },
      { label: T('event.V_POST_TRIBUTE.opt1.label', null, 'B：低调致谢'), hint: T('event.V_POST_TRIBUTE.opt1.hint', null, '把舞台留给后来人（声誉+3）'), effects: { reputation: 3 }, next: '__RETURN__' }
    ]
  };
  E.V_POST_HOLO = {
    id: 'V_POST_HOLO', variant: true, window: [2014, 2026], weight: 30,
    cond: function (s) { return (s.attributes.art || 0) >= 80; },
    title: T('event.V_POST_HOLO.title', null, 'AI 与全息巡演之争'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_POST_HOLO.text', null, '技术公司提议用 AI 与全息影像办一场“永不落幕”的巡演。关于“真实的你”该由谁定义的争论，再次被点燃。'), s, [
        { cond: function (s) { return (s.meta.mogul || 0) >= 1; }, text: T('event.V_POST_HOLO.branch0.text', null, '你早已把名字变成一门生意，这回的争议，倒像给版图添了注脚。') }
      ]);
    },
    options: [
      { label: T('event.V_POST_HOLO.opt0.label', null, 'A：拥抱新技术授权'), hint: T('event.V_POST_HOLO.opt0.hint', null, '先驱姿态（艺术+5，声誉+5，媒体+4）'), effects: { art: 5, reputation: 5, media: 4 }, next: '__RETURN__' },
      { label: T('event.V_POST_HOLO.opt1.label', null, 'B：审慎保留态度'), hint: T('event.V_POST_HOLO.opt1.hint', null, '守住边界（声誉+3，隐士+1）'), effects: { reputation: 3, recluse: 1 }, next: '__RETURN__' }
    ]
  };
  E.V_POST_FAMILY = {
    id: 'V_POST_FAMILY', variant: true, window: [2013, 2026], weight: 25,
    cond: function (s) { return s.flags.sonySold === true || (s.meta.mogul || 0) >= 1; },
    title: T('event.V_POST_FAMILY.title', null, '家族内部的版权分歧'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_POST_FAMILY.text', null, '围绕遗产与版权的处置，家族内部出现了不同的声音。血缘与利益，再一次需要你从中调停。'), s, [
        { cond: function (s) { return s.flags.sonySold === true; }, text: T('event.V_POST_FAMILY.branch0.text', null, '索尼收购后，权益的盘子更大，家人的盘算也更多。') }
      ]);
    },
    options: [
      { label: T('event.V_POST_FAMILY.opt0.label', null, 'A：以情分化解分歧'), hint: T('event.V_POST_FAMILY.opt0.hint', null, '亲情为先（家庭+5，声誉+3）'), effects: { family: 5, reputation: 3 }, next: '__RETURN__' },
      { label: T('event.V_POST_FAMILY.opt1.label', null, 'B：交由专业团队处理'), hint: T('event.V_POST_FAMILY.opt1.hint', null, '专业但疏远（财富-5，压力+5）'), effects: { wealth: -5, stress: 5 }, next: '__RETURN__' }
    ]
  };

  // ----- 隐藏彩蛋变体（GDD §17.9：系统化 Easter Eggs，选项写入 egg_* 标志触发图鉴） -----
  E.V_EGG_MOTOWN = {
    id: 'V_EGG_MOTOWN', variant: true, window: [1969, 1976], weight: 28,
    title: T('event.V_EGG_MOTOWN.title', null, '老友重聚'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_EGG_MOTOWN.text', null, '一通越洋电话，把 Motown 年代的老伙计们又唤到了一起。几把不再年轻的声音凑近麦克风，青春在合唱里复活了一瞬。'), s, [
        { cond: function (s) { return (s.attributes.art || 0) >= 60; }, text: T('event.V_EGG_MOTOWN.branch0.text', null, '你忽然觉得，那些年的和声，从没真的散过。') }
      ]);
    },
    options: [
      { label: T('event.V_EGG_MOTOWN.opt0.label', null, 'A：与他们同唱一曲'), hint: T('event.V_EGG_MOTOWN.opt0.hint', null, '把青春唱回来（艺术+5，家庭+5）'), effects: { art: 5, family: 5 }, flags: { egg_motown: true }, next: '__RETURN__' },
      { label: T('event.V_EGG_MOTOWN.opt1.label', null, 'B：遥寄祝福'), hint: T('event.V_EGG_MOTOWN.opt1.hint', null, '把怀念留在心里（声誉+3）'), effects: { reputation: 3 }, next: '__RETURN__' }
    ]
  };
  E.V_EGG_DISCO = {
    id: 'V_EGG_DISCO', variant: true, window: [1978, 1982], weight: 28,
    title: T('event.V_EGG_DISCO.title', null, '迪斯科致敬'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_EGG_DISCO.text', null, '街头的霓虹随迪斯科鼓点晃动。你站在潮流门口，忽然很想对那个年代的前辈们，郑重地鞠一躬。'), s, [
        { cond: function (s) { return (s.attributes.art || 0) >= 60; }, text: T('event.V_EGG_DISCO.branch0.text', null, '你听见身体里那股想跟着跳的冲动，比以为的更诚实。') }
      ]);
    },
    options: [
      { label: T('event.V_EGG_DISCO.opt0.label', null, 'A：对着霓虹扭一扭肩'), hint: T('event.V_EGG_DISCO.opt0.hint', null, '向前辈致意（艺术+5，声誉+3）'), effects: { art: 5, reputation: 3 }, flags: { egg_disco: true }, next: '__RETURN__' },
      { label: T('event.V_EGG_DISCO.opt1.label', null, 'B：安静旁观'), hint: T('event.V_EGG_DISCO.opt1.hint', null, '把这一阵风记进歌里（艺术+3）'), effects: { art: 3 }, next: '__RETURN__' }
    ]
  };
  E.V_EGG_WATW = {
    id: 'V_EGG_WATW', variant: true, window: [1985, 1986], weight: 55,
    cond: function (s) { return s.flags.weAreTheWorld === true; },
    title: T('event.V_EGG_WATW.title', null, '同一个和弦'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_EGG_WATW.text', null, '录音棚里，你在《We Are The World》的合唱段落按下了一个特别的和弦——一个只有你自己听得出温度的处理。'), s, [
        { cond: function (s) { return (s.meta.phil || 0) >= 1; }, text: T('event.V_EGG_WATW.branch0.text', null, '你想起写这首歌的初衷：音乐本就不该有国界。') }
      ]);
    },
    options: [
      { label: T('event.V_EGG_WATW.opt0.label', null, 'A：保留这个私密的和弦'), hint: T('event.V_EGG_WATW.opt0.hint', null, '把温柔藏进歌里（艺术+5，慈善+1）'), effects: { art: 5, phil: 1 }, flags: { egg_watw: true }, epilogue: T('event.V_EGG_WATW.opt0.epilogue', null, '多年后，仍有人声称在那段合唱里听出了一层别处没有的温柔——那是你留给世界的暗号。'), next: '__RETURN__' },
      { label: T('event.V_EGG_WATW.opt1.label', null, 'B：改用常规编配'), hint: T('event.V_EGG_WATW.opt1.hint', null, '稳妥收尾（声誉+3）'), effects: { reputation: 3 }, next: '__RETURN__' }
    ]
  };

  // ----- 生平补全事件（GDD §17.8 A：忠于 MJ 真实年表，窗口化变体自然插入主线） -----
  E.V_BIO_WIZ = {
    id: 'V_BIO_WIZ', variant: true, window: [1977, 1979], weight: 45,
    title: T('event.V_BIO_WIZ.title', null, '《新绿野仙踪》'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_BIO_WIZ.text', null, '一部童话音乐电影，让你与昆西·琼斯并肩工作。镜头外的他，正悄悄打量这个安静到发光的孩子。'), s, [
        { cond: function (s) { return (s.attributes.art || 0) >= 60; }, text: T('event.V_BIO_WIZ.branch0.text', null, '你隐约觉得，这次相遇会改写之后的一切。') }
      ]);
    },
    options: [
      { label: T('event.V_BIO_WIZ.opt0.label', null, 'A：全力打磨角色'), hint: T('event.V_BIO_WIZ.opt0.hint', null, '把舞台交给电影（艺术+6，声誉+4）'), effects: { art: 6, reputation: 4 }, next: '__RETURN__' },
      { label: T('event.V_BIO_WIZ.opt1.label', null, 'B：当作过渡，静待机会'), hint: T('event.V_BIO_WIZ.opt1.hint', null, '稳步积累（艺术+3）'), effects: { art: 3 }, next: '__RETURN__' }
    ]
  };
  E.V_BIO_MOTOWN25 = {
    id: 'V_BIO_MOTOWN25', variant: true, window: [1983, 1983], weight: 50,
    title: T('event.V_BIO_MOTOWN25.title', null, 'Motown 25 后台'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_BIO_MOTOWN25.text', null, '纪念演出前夜，你决定在串烧里加一段谁也没见过的滑行。后台有人笑你疯了。'), s, [
        { cond: function (s) { return (s.attributes.art || 0) >= 60; }, text: T('event.V_BIO_MOTOWN25.branch0.text', null, '你知道，明晚那一步，会成为一个时代的注脚。') }
      ]);
    },
    options: [
      { label: T('event.V_BIO_MOTOWN25.opt0.label', null, 'A：坚持那段滑行'), hint: T('event.V_BIO_MOTOWN25.opt0.hint', null, '定义瞬间的勇气（艺术+7，声誉+5）'), effects: { art: 7, reputation: 5 }, next: '__RETURN__' },
      { label: T('event.V_BIO_MOTOWN25.opt1.label', null, 'B：保守演出'), hint: T('event.V_BIO_MOTOWN25.opt1.hint', null, '稳稳收场（声誉+3）'), effects: { reputation: 3 }, next: '__RETURN__' }
    ]
  };
  E.V_BIO_GRAMMY84 = {
    id: 'V_BIO_GRAMMY84', variant: true, window: [1984, 1984], weight: 45,
    title: T('event.V_BIO_GRAMMY84.title', null, '格莱美之夜'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_BIO_GRAMMY84.text', null, '《Thriller》在这一夜横扫奖项。聚光灯太亮，你却想起小时候在盖瑞，连一盏像样的台灯都没有。'), s, [
        { cond: function (s) { return (s.attributes.health || 0) <= 60; }, text: T('event.V_BIO_GRAMMY84.branch0.text', null, '荣耀越大，失眠越久。') }
      ]);
    },
    options: [
      { label: T('event.V_BIO_GRAMMY84.opt0.label', null, 'A：享受巅峰'), hint: T('event.V_BIO_GRAMMY84.opt0.hint', null, '把这一夜记进骨头里（声誉+7，艺术+4）'), effects: { reputation: 7, art: 4 }, next: '__RETURN__' },
      { label: T('event.V_BIO_GRAMMY84.opt1.label', null, 'B：低调致谢'), hint: T('event.V_BIO_GRAMMY84.opt1.hint', null, '把奖杯留给团队（声誉+4，家庭+3）'), effects: { reputation: 4, family: 3 }, next: '__RETURN__' }
    ]
  };
  E.V_BIO_BADTOUR = {
    id: 'V_BIO_BADTOUR', variant: true, window: [1988, 1988], weight: 45,
    title: T('event.V_BIO_BADTOUR.title', null, '《Bad》世界巡演'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_BIO_BADTOUR.text', null, '单飞后的首次全球远征。每一座城市的灯牌都写着一个名字，你第一次感到，孤独也可以被万人共享。'), s, [
        { cond: function (s) { return (s.attributes.stress || 0) >= 50; }, text: T('event.V_BIO_BADTOUR.branch0.text', null, '连轴转的日程，让镜中的人越来越陌生。') }
      ]);
    },
    options: [
      { label: T('event.V_BIO_BADTOUR.opt0.label', null, 'A：加场，把声音送到更远'), hint: T('event.V_BIO_BADTOUR.opt0.hint', null, '商业与影响力的双增（财富+30，声誉+5，压力+8）'), effects: { wealth: 30, reputation: 5, stress: 8 }, next: '__RETURN__' },
      { label: T('event.V_BIO_BADTOUR.opt1.label', null, 'B：留白，给身体喘息'), hint: T('event.V_BIO_BADTOUR.opt1.hint', null, '健康优先（健康+5，财富+15）'), effects: { health: 5, wealth: 15 }, next: '__RETURN__' }
    ]
  };
  E.V_BIO_HISTORYTOUR = {
    id: 'V_BIO_HISTORYTOUR', variant: true, window: [1996, 1997], weight: 45,
    title: T('event.V_BIO_HISTORYTOUR.title', null, 'HIStory 世界巡演'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_BIO_HISTORYTOUR.text', null, '当时 solo 艺人规模最大的巡演。巨型雕像被立在世界各地的广场，你站在自己脚下，第一次觉得自己像一座符号。'), s, [
        { cond: function (s) { return (s.attributes.reputation || 0) >= 70; }, text: T('event.V_BIO_HISTORYTOUR.branch0.text', null, '符号越大，真实的你越难被看见。') }
      ]);
    },
    options: [
      { label: T('event.V_BIO_HISTORYTOUR.opt0.label', null, 'A：把巡演做成史诗'), hint: T('event.V_BIO_HISTORYTOUR.opt0.hint', null, '传奇再升级（声誉+6，财富+35，压力+8）'), effects: { reputation: 6, wealth: 35, stress: 8 }, next: '__RETURN__' },
      { label: T('event.V_BIO_HISTORYTOUR.opt1.label', null, 'B：在喧嚣里留一处安静'), hint: T('event.V_BIO_HISTORYTOUR.opt1.hint', null, '守住内心（家庭+4，健康+3）'), effects: { family: 4, health: 3 }, next: '__RETURN__' }
    ]
  };
  E.V_BIO_911 = {
    id: 'V_BIO_911', variant: true, window: [2001, 2001], weight: 55,
    title: T('event.V_BIO_911.title', null, '废墟旁的歌声'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_BIO_911.text', null, '那一年秋天，城市还冒着烟。你站在临时搭起的台子上，想把一点温度递给惊慌的人。'), s, [
        { cond: function (s) { return (s.meta.phil || 0) >= 1; }, text: T('event.V_BIO_911.branch0.text', null, '你比谁都清楚，音乐是能在废墟上长出东西的。') }
      ]);
    },
    options: [
      { label: T('event.V_BIO_911.opt0.label', null, 'A：为陌生人唱一首'), hint: T('event.V_BIO_911.opt0.hint', null, '把善意唱出去（慈善+2，声誉+6，家庭+3）'), effects: { phil: 2, reputation: 6, family: 3 }, next: '__RETURN__' },
      { label: T('event.V_BIO_911.opt1.label', null, 'B：默默捐款，不露面'), hint: T('event.V_BIO_911.opt1.hint', null, '安静行善（慈善+1，财富-10）'), effects: { phil: 1, wealth: -10 }, next: '__RETURN__' }
    ]
  };
  E.V_BIO_FREDDIE = {
    id: 'V_BIO_FREDDIE', variant: true, window: [1995, 1995], weight: 40,
    title: T('event.V_BIO_FREDDIE.title', null, '未完成的合唱'), kind: 'choice',
    text: function (s) {
      return narr(T('event.V_BIO_FREDDIE.text', null, '一段与已故挚友留下的合唱素材，被重新发现。你对着空荡的录音棚，把那句和声补完。'), s, [
        { cond: function (s) { return (s.attributes.art || 0) >= 65; }, text: T('event.V_BIO_FREDDIE.branch0.text', null, '有些声音，跨越了时间还在等你。') }
      ]);
    },
    options: [
      { label: T('event.V_BIO_FREDDIE.opt0.label', null, 'A：以致敬之名发布'), hint: T('event.V_BIO_FREDDIE.opt0.hint', null, '让思念有了出口（艺术+5，声誉+5，慈善+1）'), effects: { art: 5, reputation: 5, phil: 1 }, next: '__RETURN__' },
      { label: T('event.V_BIO_FREDDIE.opt1.label', null, 'B：收进抽屉留作纪念'), hint: T('event.V_BIO_FREDDIE.opt1.hint', null, '把私心留给自己（艺术+2）'), effects: { art: 2 }, next: '__RETURN__' }
    ]
  };

  // ---------- §17.14 格莱美揭晓节点（企划器+巡演 → 涌现结算，见 planner.resolveGrammy） ----------
  // 由各自 era 的巡演/专辑节点后进入，onEnter 在展示前结算，text 按座数分档叙事。
  E['4_2a_g'] = {
    id: '4_2a_g', year: 1988, title: T('event.4_2a_g.title', null, '格莱美之夜'), kind: 'auto',
    onEnter: function (s) { if (MJ.planner) MJ.planner.resolveGrammy(s, 'bad'); },
    text: function (s) {
      if (!s.flags.isSolo) return T('event.3_3.ret0.text', null, '荣誉之夜，组合与你共享掌声，奖杯的反光里映着几张并肩的笑脸。');
      var w = s.flags.grammy_bad || 0;
      if (w >= 6) return T('event.4_2a_g.sweep.text', null, '凭《Bad》一夜独揽 ' + w + ' 座格莱美，那个靠《Thriller》登顶的人，又一次把天花板推高。');
      if (w >= 3) return T('event.4_2a_g.multi.text', null, '《Bad》为你赢得 ' + w + ' 座格莱美，单飞后的你，依旧是乐坛的标尺。');
      if (w >= 1) return T('event.4_2a_g.minor.text', null, '格莱美之夜，你捧回 ' + w + ' 座奖杯——不算横扫，却已登堂入室。');
      return T('event.4_2a_g.none.text', null, '提名名单上有你的名字，但最终铩羽而归。闪光灯外的那一瞬，你听见了沉默。');
    },
    next: '4_2b'
  };
  E['5_2g'] = {
    id: '5_2g', year: 1992, title: T('event.5_2g.title', null, '格莱美之夜'), kind: 'auto',
    onEnter: function (s) { if (MJ.planner) MJ.planner.resolveGrammy(s, 'dangerous'); },
    text: function (s) {
      if (!s.flags.isSolo) return T('event.3_3.ret0.text', null, '荣誉之夜，组合与你共享掌声，奖杯的反光里映着几张并肩的笑脸。');
      var w = s.flags.grammy_dangerous || 0;
      if (w >= 6) return T('event.5_2g.sweep.text', null, '凭《Dangerous》再揽 ' + w + ' 座格莱美，你用更先锋的节拍，续写着统治。');
      if (w >= 3) return T('event.5_2g.multi.text', null, '《Dangerous》为你赢得 ' + w + ' 座格莱美，潮流的舵，还在你手里。');
      if (w >= 1) return T('event.5_2g.minor.text', null, '格莱美之夜，你捧回 ' + w + ' 座奖杯——不算横扫，却已登堂入室。');
      return T('event.5_2g.none.text', null, '提名名单上有你的名字，但最终铩羽而归。闪光灯外的那一瞬，你听见了沉默。');
    },
    next: '5_2b'
  };
  E['6_1e_g'] = {
    id: '6_1e_g', year: 1996, title: T('event.6_1e_g.title', null, '格莱美之夜'), kind: 'auto',
    onEnter: function (s) { if (MJ.planner) MJ.planner.resolveGrammy(s, 'history'); },
    text: function (s) {
      if (!s.flags.isSolo) return T('event.3_3.ret0.text', null, '荣誉之夜，组合与你共享掌声，奖杯的反光里映着几张并肩的笑脸。');
      var w = s.flags.grammy_history || 0;
      if (w >= 6) return T('event.6_1e_g.sweep.text', null, '凭《HIStory》拿下 ' + w + ' 座格莱美，镀金的你，成了时代本身的一个注脚。');
      if (w >= 3) return T('event.6_1e_g.multi.text', null, '《HIStory》为你赢得 ' + w + ' 座格莱美，传奇的回声仍在继续。');
      if (w >= 1) return T('event.6_1e_g.minor.text', null, '格莱美之夜，你捧回 ' + w + ' 座奖杯——不算横扫，却已登堂入室。');
      return T('event.6_1e_g.none.text', null, '提名名单上有你的名字，但最终铩羽而归。闪光灯外的那一瞬，你听见了沉默。');
    },
    next: '6_2'
  };
  E['6_3b_g'] = {
    id: '6_3b_g', year: 2002, title: T('event.6_3b_g.title', null, '格莱美之夜'), kind: 'auto',
    onEnter: function (s) { if (MJ.planner) MJ.planner.resolveGrammy(s, 'invincible'); },
    text: function (s) {
      if (!s.flags.isSolo) return T('event.3_3.ret0.text', null, '荣誉之夜，组合与你共享掌声，奖杯的反光里映着几张并肩的笑脸。');
      var w = s.flags.grammy_invincible || 0;
      if (w >= 6) return T('event.6_3b_g.sweep.text', null, '凭《Invincible》斩获 ' + w + ' 座格莱美，在流水的榜单里，你仍是那个不肯将就的名字。');
      if (w >= 3) return T('event.6_3b_g.multi.text', null, '《Invincible》为你赢得 ' + w + ' 座格莱美，迟暮的王者，仍有余威。');
      if (w >= 1) return T('event.6_3b_g.minor.text', null, '格莱美之夜，你捧回 ' + w + ' 座奖杯——不算横扫，却已登堂入室。');
      return T('event.6_3b_g.none.text', null, '提名名单上有你的名字，但最终铩羽而归。闪光灯外的那一瞬，你听见了沉默。');
    },
    next: '6_4b'
  };

  MJ.EVENTS = E;
})();
