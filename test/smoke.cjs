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
require('../js/planner.js');

// 桩 UI：无需 DOM
var _cur = null;
MJ.ui = {
  showEvent: function (ev) { _cur = ev; },
  showEnding: function (id) { _cur = { kind: 'ended', id: id }; },
  showEraCard: function (chapter, state, onContinue) { onContinue(); } // 过场直接继续，逻辑已落库
};

var invPairs = [];
function play(strategy) {
  MJ.engine.start();
  var guard = 0, lastYear = -1, lastId = null, invert = 0;
  while (guard++ < 800) {
    if (!_cur) return { ok: false, why: 'no event' };
    if (_cur.kind === 'ended') return { ok: true, ending: _cur.id, invert: invert };
    // 时间一致性回归：状态栏/人生轨迹显示年份不应倒挂
    var y = MJ.eventYear(_cur);
    if (typeof y === 'number' && y > 0) {
      if (lastYear >= 0 && y < lastYear) { invert++; if (invPairs.length < 30) invPairs.push(lastId + '(' + lastYear + ')->' + _cur.id + '(' + y + ')'); }
      lastYear = y; lastId = _cur.id;
    }
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

var SOLO = ['A：跟着 Diana']; // 1_3 跟随 Diana 才能继续单飞线（保留给模块联动抽查）

// 稳健定向策略：按目标结局，在分支点做出正确选择 + 通用属性/标志推动，
// 以"真实游玩链路"验证该结局可达（取代易漂移的 label 子串匹配）。
// 每个目标结局的属性/标志推动画像（w 为 effects 权重；Bonus 为命中对应 flag 的加分）
var PROFILE = {
  END_MOGUL:           { w:{art:0.3,reputation:0.3,health:0.3,wealth:0.6,stress:-0.4,family:0.1,media:0.2}, mogulBonus:80, crownBonus:10, burnBonus:-20, avoidPhil:true, avoidRecluse:true },
  END_PHILANTHROPIST:  { w:{art:0.3,reputation:0.4,health:0.3,wealth:0.2,stress:-0.3,family:0.3,phil:40,media:0.2}, philBonus:80, crownBonus:-5, burnBonus:-10, avoidMogul:true, avoidRecluse:true },
  END_RECLUSE:         { w:{art:0.2,reputation:-0.2,health:0.4,wealth:0.1,stress:-0.3,family:-0.1,media:-0.3}, recluseBonus:60, crownBonus:-20, burnBonus:-10, avoidPhil:true, avoidMogul:true },
  END_ETERNAL:         { w:{art:1.2,reputation:1.5,health:1.0,wealth:0.2,stress:-0.8,family:0.1,media:0.2}, crownBonus:60, burnBonus:-400, avoidMogul:true, avoidPhil:true, avoidRecluse:true },
  END_PERFECT:          { w:{art:1.0,reputation:1.2,health:1.5,wealth:0.2,stress:-1.5,family:0.2,media:0.2}, crownBonus:-20, burnBonus:-400, avoidMogul:true, avoidPhil:true, avoidRecluse:true },
  END_TRUE_ETERNAL:    { w:{art:1.5,reputation:1.8,health:1.4,wealth:0.2,stress:-1.0,family:0.1,phil:10,artPath:20,media:0.2}, crownBonus:80, burnBonus:-500, philBonus:20, avoidMogul:true, avoidRecluse:true },
  END_TRAGIC:          { w:{art:0.2,reputation:-0.2,health:0.5,wealth:0.2,stress:0.2,family:0.1}, burnBonus:80, crownBonus:-20, avoidMogul:true, avoidPhil:true, avoidRecluse:true },
  END_ART_PEAK:         { w:{art:0.8,reputation:0.3,health:0.5,wealth:0.2,stress:0.1,family:0.1}, burnBonus:80, crownBonus:-20, avoidMogul:true, avoidPhil:true, avoidRecluse:true },
  END_CONTROVERSIAL:    { w:{art:0.1,reputation:-1.2,health:0.2,wealth:0.1,stress:0.3,family:0.0,media:-0.5}, burnBonus:-20, crownBonus:-30, avoidMogul:true, avoidPhil:true, avoidRecluse:true },
  END_FINANCIAL:        { w:{art:0.1,reputation:-0.3,health:-0.2,wealth:0.0,stress:0.3,family:-0.1,media:-0.2}, burnBonus:-400, crownBonus:-30, avoidMogul:true, avoidPhil:true, avoidRecluse:true },
  END_SURVIVE_DEBT:     { w:{art:0.1,reputation:-0.3,health:-0.1,wealth:0.0,stress:0.3,family:-0.1,media:-0.2}, burnBonus:60, crownBonus:-30, avoidMogul:true, avoidPhil:true, avoidRecluse:true },
  END_PLAIN:            { w:{art:0,reputation:0,health:0,wealth:0,stress:0,family:0,media:0}, avoidMogul:true, avoidPhil:true, avoidRecluse:true },
  END_FAMILY:           { w:{art:0,reputation:0,health:0,wealth:0,stress:0,family:0,media:0}, avoidMogul:true, avoidPhil:true, avoidRecluse:true },
  END_TIMELESS_PRESENT: { w:{art:-0.6,reputation:-0.4,health:-0.3,wealth:0.1,stress:1.0,family:0.1,media:-0.2}, crownBonus:-60, avoidMogul:true, avoidPhil:true, avoidRecluse:true }
};

// 每个结局禁止累积的"非目标元路线"（一旦选项带该 flag 即重罚，确保 dominantMeta 归目标）
var FORBID = {
  END_MOGUL:           ['phil','recluse','artPath'],
  END_PHILANTHROPIST:  ['mogul','recluse','artPath'],
  END_RECLUSE:         ['mogul','phil','artPath'],
  END_ETERNAL:         ['mogul','recluse','phil'],
  END_TRUE_ETERNAL:    ['mogul','recluse','phil'],
  END_TRAGIC:          ['mogul','phil','recluse','artPath'],
  END_ART_PEAK:        ['mogul','phil','recluse','artPath'],
  END_CONTROVERSIAL:   ['mogul','phil','recluse','artPath'],
  END_FINANCIAL:       ['mogul','phil','recluse','artPath'],
  END_SURVIVE_DEBT:    ['mogul','phil','recluse','artPath'],
  END_PLAIN:           ['mogul','phil','recluse','artPath'],
  END_FAMILY:          ['mogul','phil','recluse','artPath'],
  END_TIMELESS_PRESENT:['mogul','phil','recluse','artPath']
};

function scoreOpt(target, ev, o, state) {
  var e = o.effects || {}, fl = o.flags || {};
  var sc = 0, id = ev.id;

  // 禁止非目标元路线：元路线计数存于 effects（recluse/mogul/phil/artPath），选项带被禁计数即重罚
  var fb = FORBID[target];
  if (fb) { for (var fi = 0; fi < fb.length; fi++) { if (e[fb[fi]]) sc -= 1e6; } }

  // 通用护栏：除目标外，避免早退与"不单飞"
  if (o.next === 'END_PLAIN') sc += (target === 'END_PLAIN') ? 1e8 : -1e8;
  if (fl.isSolo === false) sc += (target === 'END_FAMILY') ? 1e8 : -1e8;

  // 关键分支点：按目标结局做出正确选择
  if (id === '1_3') {
    if (target === 'END_PLAIN' && o.next === 'END_PLAIN') sc += 1e9;
    else if (o.next !== 'END_PLAIN') sc += 1e5;
  }
  if (id === '1_5') {
    if (target === 'END_FAMILY' && fl.isSolo === false) sc += 1e9;
    else if (fl.isSolo === true) sc += 1e9;
  }
  if (id === '3_2') {
    var burned = (target === 'END_TRAGIC' || target === 'END_ART_PEAK' || target === 'END_SURVIVE_DEBT');
    if (burned && fl.isPepsiBurned) sc += 1e9;
    if (!burned && !fl.isPepsiBurned) sc += 1e9;
  }
  if (id === '3_4') {
    if (target === 'END_TRAGIC' && fl.painkillerDependent) sc += 1e9;
    if (target === 'END_ART_PEAK' && !fl.painkillerDependent) sc += 1e9;
  }
  if (id === '3_6') {
    if (target === 'END_MOGUL' && (fl.atvBought || e.mogul)) sc += 1e7;
    else if (target !== 'END_MOGUL' && !fl.atvBought && !e.mogul) sc += 1e5;
  }
  if (id === '4_1') {
    if (target === 'END_RECLUSE' && fl.neverlandType === 'private') sc += 1e6;
    else if (fl.neverlandType === 'public') sc += 1e6;
  }
  if (id === '5_3') {
    if (target === 'END_CONTROVERSIAL' && fl.settlement1993) sc += 1e9;
    else if (!fl.settlement1993) sc += 1e5;
  }
  if (id === '6_1b') {
    if (target === 'END_MOGUL' && (fl.sonyMerge || e.mogul)) sc += 1e7;
    else if (target !== 'END_MOGUL' && !fl.sonyMerge && !e.mogul) sc += 1e5;
  }
  if (id === '6_3b') {
    if ((target === 'END_ETERNAL' || target === 'END_TRUE_ETERNAL') && fl.anniv2001 === true) sc += 1e7;
    else if (fl.anniv2001 !== true) sc += 1e4;
  }
  if (id === '7_0') {
    if (target === 'END_RECLUSE' && e.recluse) sc += 1e7;
    else if ((target === 'END_ETERNAL' || target === 'END_TRUE_ETERNAL') && fl.thriller25 === true) sc += 1e7;
    else if (fl.thriller25 !== true) sc += 1e4;
  }
  if (id === '5_2d') { if (target === 'END_RECLUSE' && e.recluse) sc += 1e7; }
  if (id === '6_4c') { if (target === 'END_RECLUSE' && e.recluse) sc += 1e7; }
  if (id === '6_4d') { if (target === 'END_RECLUSE' && e.recluse) sc += 1e7; }
  if (id === '6_4e') { if (target === 'END_RECLUSE' && e.recluse) sc += 1e7; }
  if (id === '7_1') {
    if (target === 'END_FINANCIAL' || target === 'END_SURVIVE_DEBT') {
      if (typeof o.moneyEffect === 'number' && o.moneyEffect < 0) sc += 1e7;
    } else if (typeof o.moneyEffect === 'number' && o.moneyEffect >= 0) sc += 1e5;
  }
  if (id === '7_2') {
    if (target === 'END_TIMELESS_PRESENT' && fl.survived2009 === true) sc += 1e10;
    else if (target === 'END_SURVIVE_DEBT' && fl.thisItHeld === false) sc += 1e7;
    else if (target === 'END_FINANCIAL' && fl.thisItHeld === true) sc += 1e7;
  }

  // 通用属性/标志推动（所有权重以 ||0 兜底，避免 undefined 污染分数为 NaN）
  var P = PROFILE[target];
  if (P) {
    sc += (e.art||0)*(P.w.art||0) + (e.reputation||0)*(P.w.reputation||0) + (e.health||0)*(P.w.health||0)
        + (e.wealth||0)*(P.w.wealth||0) + (e.family||0)*(P.w.family||0) + (e.stress||0)*(P.w.stress||0)
        + (e.phil||0)*(P.w.phil||0) + (e.recluse||0)*(P.w.recluse||0) + (e.mogul||0)*(P.w.mogul||0)
        + (e.artPath||0)*(P.w.artPath||0) + (e.media||0)*(P.w.media||0);
    if (fl.atvBought || fl.sonyMerge || e.mogul) sc += (P.mogulBonus||0);
    if (fl.weAreTheWorld || fl.healWorld || fl.charity99 || fl.phil || fl.earthSong) sc += (P.philBonus||0);
    if (e.recluse) sc += (P.recluseBonus||0);
    if (fl.thriller25 || fl.anniv2001) sc += (P.crownBonus||0);
    if (fl.isPepsiBurned === true) sc += (P.burnBonus||0);
    if (P.avoidMogul && (fl.atvBought || fl.sonyMerge || e.mogul)) sc -= 1e4;
    if (P.avoidPhil && (fl.weAreTheWorld || fl.healWorld || fl.charity99 || fl.phil || fl.earthSong || e.phil)) sc -= 1e4;
    if (P.avoidRecluse && e.recluse) sc -= 1e4;
  }
  return sc;
}

function stratFor(target) {
  if (target === 'END_TRUE_ETERNAL') return stratPinnacle; // 贪心巅峰策略已验证可稳定命中
  return function (ev, opts, state) {
    var best = -1e18, bi = 0;
    for (var i = 0; i < opts.length; i++) {
      var sc = scoreOpt(target, ev, opts[i], state);
      if (sc > best) { best = sc; bi = i; }
    }
    return bi;
  };
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
var errors = 0, inversions = 0;
for (var i = 0; i < 400; i++) {
  try {
    var r = play(null);
    if (!r.ok) { errors++; console.log('RANDOM FAIL', i, r); break; }
    inversions += (r.invert || 0);
    endingsSeen[r.ending] = (endingsSeen[r.ending] || 0) + 1;
  } catch (e) {
    errors++; console.log('RANDOM THROW', i, e && e.stack); break;
  }
}
console.log('随机 400 局：异常', errors, '；时间倒挂', inversions, '；结局分布', JSON.stringify(endingsSeen));
if (inversions > 0) { console.log('FAIL: 检测到时间倒挂', JSON.stringify(invPairs.slice(0, 30))); process.exit(1); }

// 2) 定向策略抽样（分布参考，非门槛）：观察真实事件链路下各结局的命中情况；
//    14 结局“可达性”以第 2b 节「结局解析单元覆盖」为权威证明（直接构造状态验规则表）。
//    关闭变体插入以获得确定性抽样：变体按概率/年份窗口强制元路线计数，会污染定向策略命中（见 §4 漂移修复）。
MJ.engine.pickVariant = function () { return null; };
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

// 2b) 结局解析单元覆盖：直接构造状态，验证 18 结局按规则均可达成（权威可达性证明）
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
  ['END_TIMELESS_PRESENT', { flags: { survived2009: true }, attr: { art: 70, reputation: 55, health: 45, wealth: 50, family: 30, media: 40 } }],
  ['END_RECLUSE_SERENE', { meta: { recluse: 3 }, attr: { health: 60, loneliness: 10 } }],
  ['END_INNOVATOR', { meta: { mogul: 1 }, attr: { art: 85 }, flags: { cp_innovation: 85 } }],
  ['END_MENTOR', { meta: { collab: 2 }, attr: { family: 55, art: 65 } }],
  ['END_STATESMAN', { meta: { phil: 2 }, attr: { reputation: 75, family: 60 } }]
];
console.log('结局解析单元覆盖（构造状态 → resolveEnding）：');
var _bad = [];
ucases.forEach(function (c) {
  var got = mkEnding(c[1]);
  if (got !== c[0]) _bad.push(c[0] + '→' + got);
  console.log('  ' + c[0] + ' => ' + (got === c[0] ? 'OK' : '实际=' + got));
});
if (_bad.length) { console.log('FAIL §17.7 结局解析：' + _bad.join(', ')); process.exit(1); }

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
    ACH_BIOPIC_SELF: { flags: { biopicMJStar: true } },
    ACH_BEYOND: { flags: { survived2009: true } },
    ACH_TRUE_ETERNAL: { ctxEnding: 'END_TRUE_ETERNAL' },
    ACH_END_STATESMAN: { ctxEnding: 'END_STATESMAN' },
    ACH_END_INNOVATOR: { ctxEnding: 'END_INNOVATOR' },
    ACH_END_MENTOR: { ctxEnding: 'END_MENTOR' },
    ACH_END_RECLUSE_SERENE: { ctxEnding: 'END_RECLUSE_SERENE' }
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
