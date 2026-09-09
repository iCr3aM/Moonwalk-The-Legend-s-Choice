// 引擎不变量 fuzz 审计（抓「不可预见」类 bug：NaN/越界/非法状态/序列化丢字段/effects 未知键）
// 三层防线：
//   1) 静态：全事件 effects 键合法性 —— 键必须 ∈ attributes(8) ∪ meta(6) ∪ {money,rel,timeline}；
//      rel 子键 ∈ relationsDefs；未知键会被 changeAttr 静默丢弃（拼写错误 = 无声失效）
//   2) 动态：fuzz 局每步断言不变量 —— attributes 0..100 且非 NaN、meta 非负整数、
//      relations ±100、era∈[-1,5]、flags 值类型合法、netWorth 有限、stats 非负；
//      结束时 serialize→hydrate→serialize round-trip 深比较（抓存档丢字段）
//   3) 极端状态矩阵：全 0 / 全 100 / 巨额负债 / flags 风暴等，直调
//      resolveEnding/evaluate/checkFlags/revealAll —— 不抛异常且结局 id 合法
// 运行：node test/_audit_invariants.cjs [fuzz 局数=600]
global.window = global;
var _store = {};
global.localStorage = {
  getItem: function (k) { return _store[k] != null ? _store[k] : null; },
  setItem: function (k, v) { _store[k] = String(v); },
  removeItem: function (k) { delete _store[k]; }
};
global.MJ = global.MJ || {};
var MJ = global.MJ;
MJ.t = function (k, v, fb) { return fb != null ? fb : k; };
require('../js/config.js');
require('../js/state.js');
require('../js/events.js');
require('../js/planner.js');
require('../js/engine.js');
require('../js/collaborators.js');
MJ.localizeEvent = function (ev, state) {
  var st = state || (MJ.engine && MJ.engine.state) || {};
  var copy = Object.assign({}, ev);
  if (typeof copy.options === 'function') copy.options = copy.options(st);
  if (typeof copy.text === 'function') copy.text = copy.text(st);
  return copy;
};
MJ.ui = {
  showEvent: function () {},
  showEraCard: function (c, s, cb) { cb(); },
  showEnding: function () {},
  toastEgg: function () {},
  toastTrivia: function () {},
  showModal: function () {}
};
var resolvedEndingId = null;
MJ.engine.showEnding = function (entryId) { resolvedEndingId = MJ.resolveEnding(this.state, entryId); };

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

var ATTR_KEYS = Object.keys(MJ.config.initialAttributes);
var META_KEYS = Object.keys(MJ.config.initialMeta);
var REL_KEYS = MJ.config.relationsDefs.map(function (r) { return r.key; });
var EFFECT_KEYS = { money: 1, rel: 1, timeline: 1 };
ATTR_KEYS.concat(META_KEYS).forEach(function (k) { EFFECT_KEYS[k] = 1; });

var problems = [];
var _seen = {};
function report(kind, detail) {
  var key = kind + '|' + detail.split(' run')[0];
  if (_seen[key]) { problems[_seen[key] - 1].count++; return; }
  _seen[key] = problems.length + 1;
  problems.push({ kind: kind, detail: detail, count: 1 });
}

// ---------- 1) 静态：effects 键合法性 ----------
function checkEffectsObj(eff, where) {
  if (!eff || typeof eff !== 'object') return;
  for (var k in eff) {
    if (!eff.hasOwnProperty(k)) continue;
    if (!EFFECT_KEYS[k]) { report('effects-unknown-key', where + ' 键「' + k + '」不在 attributes/meta/rel/timeline/money 中（changeAttr 会静默丢弃）'); continue; }
    if (k === 'rel') {
      for (var rk in eff[k]) {
        if (REL_KEYS.indexOf(rk) < 0) report('effects-unknown-rel', where + ' rel 子键「' + rk + '」不在 relationsDefs');
      }
    }
  }
}
Object.keys(MJ.EVENTS).forEach(function (id) {
  var ev = MJ.EVENTS[id];
  if (!ev) return;
  var where = 'event ' + id;
  // 函数型 effects 用「全满足」基础 state 采样一次
  var probe = new MJ.GameState();
  ATTR_KEYS.forEach(function (k) { probe.attributes[k] = 50; });
  META_KEYS.forEach(function (k) { probe.meta[k] = 2; });
  REL_KEYS.forEach(function (k) { probe.relations[k] = 20; });
  probe.flags.isSolo = true;
  if (typeof ev.effects === 'function') checkEffectsObj(ev.effects(probe), where + '.effects()');
  else checkEffectsObj(ev.effects, where + '.effects');
  var opts = typeof ev.options === 'function' ? ev.options(probe) : ev.options;
  (opts || []).forEach(function (o, i) {
    if (typeof o.effects === 'function') checkEffectsObj(o.effects(probe), where + '.opt' + i + '.effects()');
    else checkEffectsObj(o.effects, where + '.opt' + i + '.effects');
  });
});

// ---------- 2) 动态：不变量 fuzz + round-trip ----------
function isFiniteNum(v) { return typeof v === 'number' && isFinite(v); }
function isJsonSafe(v, depth) {
  if (depth > 6) return false;
  if (v === null) return true;
  var t = typeof v;
  if (t === 'boolean' || t === 'string') return true;
  if (t === 'number') return isFinite(v);
  if (Array.isArray(v)) return v.every(function (x) { return isJsonSafe(x, depth + 1); });
  if (t === 'object') {
    for (var k in v) {
      if (!v.hasOwnProperty(k)) continue;
      if (typeof v[k] === 'function' || v[k] === undefined) return false;
      if (!isJsonSafe(v[k], depth + 1)) return false;
    }
    return true;
  }
  return false;
}
function checkInvariants(st, step, runId) {
  for (var k in st.attributes) {
    var v = st.attributes[k];
    if (!isFiniteNum(v)) report('attr-non-number', 'run' + runId + ' step' + step + ' attributes.' + k + '=' + JSON.stringify(v));
    else if (v < 0 || v > 100) report('attr-out-of-range', 'run' + runId + ' step' + step + ' attributes.' + k + '=' + v);
  }
  for (var mk in st.meta) {
    var mv = st.meta[mk];
    if (!isFiniteNum(mv)) report('meta-non-number', 'run' + runId + ' step' + step + ' meta.' + mk + '=' + JSON.stringify(mv));
    else if (mv < 0 || Math.floor(mv) !== mv) report('meta-invalid', 'run' + runId + ' step' + step + ' meta.' + mk + '=' + mv);
  }
  for (var rk in st.relations) {
    var rv = st.relations[rk];
    if (!isFiniteNum(rv) || rv < -100 || rv > 100) report('rel-out-of-range', 'run' + runId + ' step' + step + ' relations.' + rk + '=' + JSON.stringify(rv));
  }
  if (!isFiniteNum(st.era) || st.era < -1 || st.era > 5) report('era-invalid', 'run' + runId + ' step' + step + ' era=' + JSON.stringify(st.era));
  if (!isFiniteNum(st.netWorth)) report('netWorth-non-number', 'run' + runId + ' step' + step + ' netWorth=' + JSON.stringify(st.netWorth));
  if (typeof st.debt !== 'boolean') report('debt-non-bool', 'run' + runId + ' step' + step + ' debt=' + JSON.stringify(st.debt));
  if (st.debt !== (st.netWorth < 0)) report('debt-inconsistent', 'run' + runId + ' step' + step + ' debt=' + st.debt + ' netWorth=' + st.netWorth);
  for (var fk in st.flags) {
    // flags 是「持久化状态袋」：标量之外也允许结构化数据（如 planner 的 grammyCats_* 类别清单），
    // 但必须 JSON 可安全序列化（存档走 JSON）——函数/undefined/NaN/循环引用会静默破坏存档
    if (!isJsonSafe(st.flags[fk], 0)) report('flag-unserializable', 'run' + runId + ' step' + step + ' flags.' + fk + ' 含不可安全序列化值');
  }
  if (!st.history || typeof st.history.length !== 'number') report('history-invalid', 'run' + runId + ' step' + step);
  var s = st.stats || {};
  ['variants', 'keyChoices', 'events'].forEach(function (sk) {
    if (!isFiniteNum(s[sk]) || s[sk] < 0) report('stats-invalid', 'run' + runId + ' step' + step + ' stats.' + sk + '=' + JSON.stringify(s[sk]));
  });
}
function normObj(o) {
  if (Array.isArray(o)) return o.map(normObj);
  if (o && typeof o === 'object') {
    var out = {};
    Object.keys(o).sort().forEach(function (k) { if (o[k] !== undefined) out[k] = normObj(o[k]); });
    return out;
  }
  return o;
}
function checkRoundTrip(st, runId) {
  var s1 = JSON.parse(JSON.stringify(st.serialize()));
  var h = new MJ.GameState();
  h.hydrate(JSON.parse(JSON.stringify(s1)));
  var s2 = JSON.parse(JSON.stringify(h.serialize()));
  delete s1.currentId; delete s2.currentId;
  delete s1.returnId; delete s2.returnId;
  if (JSON.stringify(normObj(s1)) !== JSON.stringify(normObj(s2))) {
    var diffKeys = [];
    var ka = Object.keys(normObj(s1)), kb = Object.keys(normObj(s2));
    ka.concat(kb).forEach(function (k) {
      if (JSON.stringify(normObj(s1[k])) !== JSON.stringify(normObj(s2[k]))) diffKeys.push(k);
    });
    report('roundtrip-diff', 'run' + runId + ' 字段差异: ' + diffKeys.join(','));
  }
}

function runTraversal(seed) {
  var rng = mulberry32(seed);
  Math.random = rng;
  MJ.engine.start();
  resolvedEndingId = null;
  var guard = 0, step = 0, runId = seed;
  while (guard++ < 4000) {
    if (resolvedEndingId) break;
    var ev = MJ.engine.current;
    if (!ev) break;
    checkInvariants(MJ.engine.state, step++, runId);
    var opts = MJ.engine.optionsOf(ev);
    if (!opts || !opts.length) { MJ.engine.proceed(); continue; }
    MJ.engine.choose(Math.floor(rng() * opts.length) % opts.length);
  }
  checkInvariants(MJ.engine.state, 'end', runId);
  if (MJ.engine.state && resolvedEndingId) checkRoundTrip(MJ.engine.state, runId);
}

// ---------- 3) 极端状态矩阵 ----------
function extremeMatrix() {
  function base() { return new MJ.GameState(); }
  function fill(st, attrV, metaV) {
    ATTR_KEYS.forEach(function (k) { st.attributes[k] = attrV; });
    META_KEYS.forEach(function (k) { st.meta[k] = metaV; });
    REL_KEYS.forEach(function (k) { st.relations[k] = 20; });
    st.era = 2;
    return st;
  }
  var storm = {};
  ['isSolo', 'thriller25', 'anniv2001', 'survived2009', 'healWorld', 'ghosts', 'bubbles', 'altPeace', 'altQuietRetiree',
   'settlement1993', 'secondCharge', 'debtCrisis', 'thisItHeld', 'thisItFull', 'oprhaOpen', 'rumorStarted',
   'princeBorn', 'parisBorn', 'blanketBorn', 'marriedLisa', 'marriedDebbie', 'surrogacy', 'neverlandType',
   'garyRoots', 'apolloChampion', 'captainEO', 'moonwalker', 'superBowl', 'dream_peterpan', 'dream_childhosp',
   'cp_vision', 'cp_innovation', 'cp_craft', 'cp_collab', 'cp_budget'].forEach(function (f) { storm[f] = true; });
  storm.neverlandType = 'public';
  storm.secondVerdict = 'not_guilty';
  storm.cascioSuit = 'litigate';
  storm.thisItFull = true;
  storm.cp_budget = 'aggressive';
  storm.cp_vision = 90; storm.cp_innovation = 85; storm.cp_craft = 70; storm.cp_collab = 70;

  var cases = [
    { name: 'all-zero', st: fill(base(), 0, 0) },
    { name: 'all-max', st: fill(base(), 100, 9) },
    { name: 'debt-crush', st: (function () { var s = fill(base(), 50, 1); s.applyMoney(-9000000); return s; })() },
    { name: 'wealth-peak', st: (function () { var s = fill(base(), 50, 9); s.applyMoney(9000000); return s; })() },
    { name: 'loneliness-max', st: (function () { var s = fill(base(), 50, 1); s.attributes.loneliness = 100; return s; })() },
    { name: 'flags-storm', st: (function () { var s = fill(base(), 60, 3); for (var f in storm) s.flags[f] = storm[f]; return s; })() },
    { name: 'era-boundary-neg', st: (function () { var s = fill(base(), 50, 1); s.era = -1; return s; })() },
    { name: 'era-boundary-5', st: (function () { var s = fill(base(), 50, 1); s.era = 5; return s; })() }
  ];
  cases.forEach(function (c) {
    var st = c.st;
    try {
      var eid = MJ.resolveEnding(st);
      if (!MJ.config.endings[eid]) report('extreme-invalid-ending', c.name + ' -> ' + eid);
      if (!isFiniteNum(st.netWorth)) report('extreme-netWorth', c.name);
      MJ.achievementSystem.evaluate(st, { ending: eid });
      MJ.eggSystem.checkFlags(st);
      MJ.eggSystem.revealAll(st);
      MJ.triviaSystem.checkFlags(st);
      MJ.triviaSystem.revealAll(st);
      if (MJ.planner && MJ.planner.resolveGrammy) { try { MJ.planner.resolveGrammy(st, 'thriller'); } catch (e) { report('extreme-grammy-throw', c.name + ' ' + e.message); } }
      var s1 = JSON.parse(JSON.stringify(st.serialize()));
      var h = new MJ.GameState(); h.hydrate(JSON.parse(JSON.stringify(s1)));
      var s2 = JSON.parse(JSON.stringify(h.serialize()));
      delete s1.currentId; delete s2.currentId; delete s1.returnId; delete s2.returnId;
      if (JSON.stringify(normObj(s1)) !== JSON.stringify(normObj(s2))) {
        var diffKeys = [];
        var ka = Object.keys(normObj(s1)), kb = Object.keys(normObj(s2));
        ka.concat(kb).forEach(function (k) { if (JSON.stringify(normObj(s1[k])) !== JSON.stringify(normObj(s2[k]))) diffKeys.push(k); });
        report('extreme-roundtrip-diff', c.name + ' 字段差异: ' + diffKeys.join(','));
      }
    } catch (e) {
      report('extreme-throw', c.name + ' ' + (e && e.message));
    }
  });
}

// ---------- 执行 ----------
var N = Number(process.argv[2] || 600);
for (var i = 0; i < N; i++) runTraversal(630000 + i);
extremeMatrix();

console.log('=== 引擎不变量 fuzz 审计 ===');
console.log('fuzz 局数=' + N + '（每步不变量断言 + round-trip）；极端状态矩阵=8；静态 effects 扫描=全事件');
if (problems.length) {
  console.log('问题类别 ' + problems.length + ' 种：');
  problems.slice(0, 40).forEach(function (p) { console.log('  ✗ [' + p.kind + '] ×' + p.count + '  ' + p.detail); });
  if (problems.length > 40) console.log('  ... 其余 ' + (problems.length - 40) + ' 类略');
  console.error('FAIL 不变量审计：发现 ' + problems.length + ' 类异常');
  process.exit(1);
}
console.log('PASS 引擎不变量审计：属性/元路线/关系/era/flags/netWorth 全部合法，序列化 round-trip 无字段丢失，极端状态矩阵无异常');
