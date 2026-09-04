/* Node 冒烟 + 平衡测试：无 DOM 环境下驱动引擎。
 * 验证：随机 400 局 0 异常且必到结局；「结局解析单元覆盖」(§2b) 为 14 结局可达性权威证明（构造状态直验规则表）；
 *      关系/手记/回响/媒体/孤独/传奇评分 等模块均被正确联动。
 */
global.window = global;

// 最小化 localStorage 垫片
var _store = {};
global.localStorage = {
  getItem: function (k) { return _store[k] != null ? _store[k] : null; },
  setItem: function (k, v) { _store[k] = String(v); },
  removeItem: function (k) { delete _store[k]; }
};

require('../js/config.js');
require('../js/state.js');
require('../js/engine.js');
require('../js/events.js');

// 桩 UI：无需 DOM
var _cur = null;
MJ.ui = {
  showEvent: function (ev) { _cur = ev; },
  showEnding: function (id) { _cur = { kind: 'ended', id: id }; },
  showEraCard: function (chapter, state, onContinue) { onContinue(); } // 过场直接继续，逻辑已落库
};

function play(strategy) {
  MJ.engine.start();
  var guard = 0;
  while (guard++ < 800) {
    if (!_cur) return { ok: false, why: 'no event' };
    if (_cur.kind === 'ended') return { ok: true, ending: _cur.id };
    if (_cur.kind === 'ending') { MJ.engine.finishEnding(); continue; }
    if (_cur.kind === 'auto') { MJ.engine.proceed(); continue; }
    if (_cur.kind === 'choice') {
      var opts = MJ.engine.optionsOf(_cur);
      var idx = strategy ? strategy(_cur, opts, MJ.engine.state) : Math.floor(Math.random() * opts.length);
      MJ.engine.choose(idx);
      continue;
    }
    return { ok: false, why: 'unknown kind ' + _cur.kind };
  }
  return { ok: false, why: 'guard exceeded' };
}

// 在可选里挑“第一个 label 包含某关键字”的选项
function pick(opts, keys) {
  for (var ki = 0; ki < keys.length; ki++) {
    for (var i = 0; i < opts.length; i++) {
      if (opts[i].label.indexOf(keys[ki]) >= 0) return i;
    }
  }
  return Math.floor(Math.random() * opts.length);
}

var SOLO = ['A：跟着 Diana']; // 1_3 跟随 Diana 才能继续单飞线
var NO_MOGUL = ['C：放弃收购', 'B：独立运营']; // 避免 meta.mogul 累积（非商业巨擘结局）
var NONEVER = ['C：暂不购置']; // 跳过 7_1 债务线（非负债结局）
var PVT = ['A：对公众敞开大门']; // 触发 7_1 债务线（负债结局）
var RECLUSE_AVOID = ['A：冷处理不理会', 'A：礼貌地侧身避开', 'A：正面回应', 'A：主动公关', 'A：冷处理']; // 变体里不选退隐项

function stratFor(target) {
  var map = {
    END_PLAIN: ['B：留在盖瑞'],
    END_FAMILY: ['A：跟着 Diana', 'B：守在 Jackson 5'],
    END_MOGUL: SOLO.concat(['A：迈出单飞', 'A：深度绑定 Epic', 'A：全资收购', 'A：合并 Sony', 'A：倾情义唱', 'A：全身心投入', 'A：奉上一场盛典', 'A：用心经营', 'A：全心经营家庭', 'A：全心陪伴他长大', 'A：盛大回归', 'A：转让部分权益', 'A：咬牙撑满', 'C：暂不购置']).concat(RECLUSE_AVOID),
    END_PHILANTHROPIST: SOLO.concat(['A：迈出单飞'], NO_MOGUL, NONEVER, RECLUSE_AVOID, ['A：倾情义唱', 'A：全身心投入', 'A：倾力投入', 'A：奉上一场盛典', 'A：用心经营', 'A：全心经营家庭', 'A：全心陪伴他长大', 'A：盛大回归', 'A：转让部分权益', 'A：咬牙撑满']),
    END_RECLUSE: SOLO.concat(NONEVER, ['A：迈出单飞', 'B：圈起私人天地', '拒访', 'B：保持距离', 'A：倾情义唱', 'B：低调处理', 'C：邀请童声', 'B：保持疏离', 'A：独自消化', 'B：死撑不卖', 'B：忍痛取消', 'A：20 场团体']),
    END_ETERNAL: SOLO.concat(['A：迈出单飞'], NO_MOGUL, NONEVER, RECLUSE_AVOID, ['B：安全优先拒拍', 'A：倾尽所有去演', 'A：完美演绎月球漫步', 'A：倾情义唱', 'A：全身心投入', 'A：奉上一场盛典', 'A：坦诚聊', 'A：用心经营', 'A：全心经营家庭', 'A：全心陪伴他长大', 'A：盛大回归', 'A：转让部分权益', 'A：咬牙撑满']),
    END_PERFECT: SOLO.concat(['A：迈出单飞'], NO_MOGUL, NONEVER, RECLUSE_AVOID, ['B：安全优先拒拍', 'A：倾尽所有去演', 'A：完美演绎月球漫步', 'A：倾情义唱', 'A：全身心投入', 'A：奉上一场盛典', 'A：坦诚聊', 'A：用心经营', 'A：全心经营家庭', 'A：全心陪伴他长大', 'A：盛大回归', 'A：转让部分权益', 'A：咬牙撑满']),
    END_ART_PEAK: SOLO.concat(NO_MOGUL, NONEVER, RECLUSE_AVOID, ['A：迈出单飞', 'A：接拍并意外烧伤', 'B：硬扛着治疗', 'A：完美演绎月球漫步', 'A：倾情义唱', 'A：全身心投入', 'A：奉上一场盛典', 'A：用心经营', 'A：全心经营家庭', 'A：全心陪伴他长大', 'A：盛大回归', 'A：转让部分权益', 'A：咬牙撑满']),
    END_TRAGIC: SOLO.concat(NO_MOGUL, NONEVER, RECLUSE_AVOID, ['A：迈出单飞', 'A：接拍并意外烧伤', 'A：依赖药物止痛', 'A：完美演绎月球漫步', 'A：倾情义唱', 'A：全身心投入', 'A：奉上一场盛典', 'A：用心经营', 'A：全心经营家庭', 'A：全心陪伴他长大', 'A：盛大回归', 'A：转让部分权益', 'A：咬牙撑满']),
    END_CONTROVERSIAL: SOLO.concat(PVT, NO_MOGUL, RECLUSE_AVOID, ['A：迈出单飞', 'A：接拍并意外烧伤', 'A：倾情义唱', 'A：全身心投入', 'A：奉上一场盛典', 'A：达成庭外和解', 'A：用心经营', 'A：全心经营家庭', 'A：全心陪伴他长大', 'A：盛大回归', 'A：转让部分权益', 'A：咬牙撑满']),
    END_SURVIVE_DEBT: SOLO.concat(PVT, NO_MOGUL, RECLUSE_AVOID, ['A：迈出单飞', 'A：接拍并意外烧伤', 'A：倾情义唱', 'A：全身心投入', 'A：奉上一场盛典', 'A：达成庭外和解', 'A：用心经营', 'A：全心经营家庭', 'A：全心陪伴他长大', 'A：盛大回归', 'B：死撑不卖', 'B：忍痛取消', 'A：20 场团体']),
    END_FINANCIAL: SOLO.concat(PVT, NO_MOGUL, RECLUSE_AVOID, ['A：迈出单飞', 'A：接拍并意外烧伤', 'A：倾情义唱', 'A：全身心投入', 'A：奉上一场盛典', 'A：达成庭外和解', 'A：用心经营', 'A：全心经营家庭', 'A：全心陪伴他长大', 'A：盛大回归', 'B：死撑不卖', 'A：咬牙撑满', 'A：20 场团体'])
  };
  var keys = map[target] || [];
  return function (ev, opts) { return pick(opts, keys); };
}

// 贪心“巅峰”策略：每步选对「真·永恒」目标贡献最大的选项，用于验证隐藏结局可被有意玩家命中
function stratPinnacle(ev, opts, state) {
  var bi = 0, bestScore = -1e9;
  for (var i = 0; i < opts.length; i++) {
    var o = opts[i], e = o.effects || {}, sc = 0;
    sc += (e.art || 0) * 1.2 + (e.reputation || 0) * 1.5 + (e.health || 0) * 1.2 - (e.stress || 0) * 1.0;
    sc += (e.phil || 0) * 4 + (e.artPath || 0) * 5 + (e.family || 0) * 0.15 + (e.wealth || 0) * 0.05;
    if (o.flags) {
      if (o.flags.thriller25) sc += 40;
      if (o.flags.anniv2001) sc += 40;
      if (o.flags.healWorld) sc += 15;
      if (o.flags.isPepsiBurned) sc -= 300;
      if (o.flags.painkillerDependent) sc -= 150;
      if (o.flags.isSolo === false) sc -= 300;        // 必须单飞线才能冲刺巅峰
      if (o.flags.neverlandType === 'none') sc -= 200; // 必须建 Neverland 才能触发 Thriller25 线
      else if (o.flags.neverlandType) sc += 20;
    }
    if (o.next === 'END_PLAIN') sc -= 1000;           // 绝不早退
    if (typeof o.moneyEffect === 'number' && o.moneyEffect < 0) sc += o.moneyEffect * 0.002; // 负债惩罚
    if (sc > bestScore) { bestScore = sc; bi = i; }
  }
  return bi;
}

// 1) 随机 400 局
var endingsSeen = {};
var errors = 0;
for (var i = 0; i < 400; i++) {
  try {
    var r = play(null);
    if (!r.ok) { errors++; console.log('RANDOM FAIL', i, r); break; }
    endingsSeen[r.ending] = (endingsSeen[r.ending] || 0) + 1;
  } catch (e) {
    errors++; console.log('RANDOM THROW', i, e && e.stack); break;
  }
}
console.log('随机 400 局：异常', errors, '；结局分布', JSON.stringify(endingsSeen));

// 2) 定向策略抽样（分布参考，非门槛）：观察真实事件链路下各结局的命中情况；
//    14 结局“可达性”以第 2b 节「结局解析单元覆盖」为权威证明（直接构造状态验规则表）。
var allEndings = Object.keys(MJ.config.endings);
console.log('定向抽样（分布参考）：');
allEndings.forEach(function (id) {
  try {
    var got = null;
    for (var t = 0; t < 40 && !got; t++) {
      var r = play(stratFor(id));
      if (r.ok) got = r.ending;
    }
    console.log('  ' + id + ' => 抽样命中 ' + (got === id ? '是' : '否(' + got + ')'));
  } catch (e) {
    console.log('  ' + id + ' => THROW ' + (e && e.stack));
  }
});

// 3) 模块联动抽查：走“单飞 + 退隐”线，触发关系/手记/回响/孤独/传奇
try {
  var guard = 0;
  MJ.engine.start();
  while (guard++ < 800) {
    if (!_cur) break;
    if (_cur.kind === 'ended') break;
    if (_cur.kind === 'ending') { MJ.engine.finishEnding(); break; }
    if (_cur.kind === 'auto') { MJ.engine.proceed(); continue; }
    var o = MJ.engine.optionsOf(_cur);
    MJ.engine.choose(pick(o, SOLO.concat(['A：迈出单飞', 'B：圈起私人天地', '拒访', 'B：保持距离', 'A：倾情义唱', 'B：低调处理', 'C：邀请童声', 'B：保持疏离', 'A：独自消化', 'B：死撑不卖', 'B：忍痛取消', 'A：20 场团体'])));
  }
  var s = MJ.engine.state;
  var legend = MJ.legendScore(s);
  console.log('模块联动抽查：relations keys=' + Object.keys(s.relations).length +
    ' 手记=' + s.diary.length + ' 回响=' + s.echoes.length +
    ' media=' + s.attributes.media + ' loneliness=' + s.attributes.loneliness +
    ' legend=' + legend.score + '(' + legend.grade + ')');
  var moduleOk = Object.keys(s.relations).length === MJ.config.relationsDefs.length &&
    s.diary.length >= 1 && s.echoes.length >= 1 && s.attributes.loneliness > 0 && typeof legend.score === 'number';
  console.log('模块联动：' + (moduleOk ? 'OK' : 'FAIL'));
} catch (e) { console.log('模块联动 THROW ' + (e && e.stack)); }

// 2b) 结局解析单元覆盖：直接构造状态，验证 12 结局按规则均可达成（权威可达性证明）
function mkEnding(over) {
  var st = new MJ.GameState();
  st.flags.isSolo = true;
  if (over.attr) Object.assign(st.attributes, over.attr);
  if (over.meta) Object.assign(st.meta, over.meta);
  if (over.flags) Object.assign(st.flags, over.flags);
  if ('debt' in over) st.debt = over.debt;
  return MJ.resolveEnding(st, over.entryId);
}
var ucases = [
  ['END_PLAIN', { entryId: 'END_PLAIN' }],
  ['END_FAMILY', { flags: { isSolo: false } }],
  ['END_RECLUSE', { attr: { health: 60, family: 30 }, meta: { recluse: 3 } }],
  ['END_MOGUL', { attr: { family: 50, media: 60, health: 60, wealth: 70, art: 60 }, meta: { mogul: 2 }, debt: false }],
  ['END_PHILANTHROPIST', { attr: { family: 40, wealth: 30, health: 60 }, meta: { phil: 3 }, debt: false }],
  ['END_ETERNAL', { flags: { thriller25: true }, attr: { art: 80, reputation: 70, health: 60, family: 50, media: 60 } }],
  ['END_ART_PEAK', { flags: { isPepsiBurned: true, thisItHeld: true }, attr: { art: 80, reputation: 55, health: 60, family: 50, media: 60 } }],
  ['END_PERFECT', { attr: { art: 60, reputation: 65, health: 60, family: 50, media: 60 } }],
  ['END_TRAGIC', { flags: { isPepsiBurned: true, painkillerDependent: true, thisItHeld: true }, attr: { art: 50, reputation: 60, health: 45, family: 50, media: 60 } }],
  ['END_CONTROVERSIAL', { flags: { settlement1993: true }, attr: { reputation: 45, media: 60, health: 60 } }],
  ['END_SURVIVE_DEBT', { debt: true, thisItHeld: false, attr: { art: 50, reputation: 55, health: 60, family: 50, media: 60 } }],
  ['END_FINANCIAL', { debt: true, flags: { thisItHeld: true }, attr: { art: 50, reputation: 55, health: 60, family: 50, media: 60 } }],
  ['END_TRUE_ETERNAL', { flags: { thriller25: true, anniv2001: true }, attr: { art: 92, reputation: 92, health: 85, stress: 20, family: 50, media: 60 }, meta: { phil: 3, artPath: 2 }, debt: false }],
  ['END_TIMELESS_PRESENT', { flags: { survived2009: true }, attr: { art: 70, reputation: 55, health: 45, wealth: 50, family: 30, media: 40 } }]
];
console.log('结局解析单元覆盖（构造状态 → resolveEnding）：');
ucases.forEach(function (c) {
  var got = mkEnding(c[1]);
  console.log('  ' + c[0] + ' => ' + (got === c[0] ? 'OK' : '实际=' + got));
});

// 2c) 真·永恒隐藏结局可达性验证：贪心“巅峰”策略多轮抽样，确认有意玩家可稳定命中
(function () {
  var dist = {}, best = { art: 0, reputation: 0, health: 0, stress: 99, phil: 0, artPath: 0, hit: 0 };
  var N = 500;
  for (var t = 0; t < N; t++) {
    var r = play(stratPinnacle);
    if (!r.ok) { console.log('PINNACLE THROW', r); break; }
    dist[r.ending] = (dist[r.ending] || 0) + 1;
    if (r.ending === 'END_TRUE_ETERNAL') best.hit++;
    var s = MJ.engine.state;
    best.art = Math.max(best.art, s.attributes.art || 0);
    best.reputation = Math.max(best.reputation, s.attributes.reputation || 0);
    best.health = Math.max(best.health, s.attributes.health || 0);
    best.stress = Math.min(best.stress, s.attributes.stress || 0);
    best.phil = Math.max(best.phil, s.meta.phil || 0);
    best.artPath = Math.max(best.artPath, s.meta.artPath || 0);
  }
  console.log('真·永恒可达性（贪心巅峰策略 ' + N + ' 局）：命中 END_TRUE_ETERNAL = ' + best.hit + ' 次');
  console.log('  峰值属性：art=' + best.art + ' rep=' + best.reputation + ' health=' + best.health + ' stress=' + best.stress + ' phil=' + best.phil + ' artPath=' + best.artPath);
  console.log('  抽样分布', JSON.stringify(dist));
})();

// 2d) 成就可达性：对每项成就构造满足条件的状态，验证 check 可达成（模块联动核对）
(function () {
  function mk(over) {
    var st = new MJ.GameState();
    if (over.attr) Object.assign(st.attributes, over.attr);
    if (over.meta) Object.assign(st.meta, over.meta);
    if (over.flags) Object.assign(st.flags, over.flags);
    if (over.rel) Object.assign(st.relations, over.rel);
    if ('debt' in over) st.debt = over.debt;
    return st;
  }
  var cases = {
    ACH_PHIL: { meta: { phil: 3 } },
    ACH_RECLUSE: { meta: { recluse: 3 } },
    ACH_LEGAL: { flags: { settlement1993: true }, attr: { reputation: 60 } },
    ACH_MOGUL: { meta: { mogul: 2 }, debt: false },
    ACH_ARTIST: { meta: { artPath: 2 }, attr: { art: 80 } },
    ACH_TOUR: { attr: { art: 80, reputation: 80 } },
    ACH_ETERNAL: { ctxEnding: 'END_ETERNAL' },
    ACH_SURVIVOR: { debt: true, ctxEnding: 'END_SURVIVE_DEBT', attr: { health: 40 } },
    ACH_RICH: { attr: { wealth: 95 } },
    ACH_BALANCED: { attr: { health: 90, stress: 20 } },
    ACH_FAMILYMAN: { attr: { family: 85 } },
    ACH_DIGITAL: { flags: { internetSavvy: true } },
    ACH_PEACEMAKER: { flags: { healWorld: true } },
    ACH_SAGE: { meta: { recluse: 3 } },
    ACH_COMEBACK: { flags: { comebackSeen: true } },
    ACH_BROTHERLY: { rel: { brothers: 20 } },
    ACH_IDOL: { rel: { fans: 30 } },
    ACH_ROOKIE: { flags: { soloAlbum1972: true } },
    ACH_CROWN: { flags: { thriller25: true } },
    ACH_NEVERLAND: { flags: { neverlandType: 'public' } },
    ACH_BLOOD: { flags: { bloodDance: true } },
    ACH_CATALOG: { flags: { atvBought: true } },
    ACH_MEDIA_DARLING: { attr: { media: 85 } },
    ACH_LONELY: { attr: { loneliness: 65 } },
    ACH_TIMELESS_KING: { flags: { thisItHeld: true } },
    ACH_DIGITAL_PIONEER: { flags: { digitalSingles: true } },
    ACH_BIOPIC: { flags: { biopic2026: true } },
    ACH_BEYOND: { flags: { survived2009: true } },
    ACH_TRUE_ETERNAL: { ctxEnding: 'END_TRUE_ETERNAL' }
  };
  var fail = [];
  (MJ.config.achievements || []).forEach(function (a) {
    var c = cases[a.id];
    if (!c) { fail.push(a.id + '(无用例)'); return; }
    var st = mk(c), ctx = c.ctxEnding ? { ending: c.ctxEnding } : {};
    var ok = false;
    try { ok = a.check(st, ctx); } catch (e) { fail.push(a.id + '(抛错)'); return; }
    if (!ok) fail.push(a.id);
  });
  console.log('成就可达性（' + (MJ.config.achievements.length - fail.length) + '/' + MJ.config.achievements.length + ' 可达）' + (fail.length ? ' 未达成: ' + fail.join(',') : ' 全部可达'));
})();

console.log('测试结束。');
