// 全局一致性 / 可达性审计：用真实 engine 无头驱动完整 playthrough，
// 验证「玩家真实游玩」中：①结局与最终状态不自相矛盾（如 6500 万却财务崩溃）；
// ②18 结局 + 全部成就在随机真实游玩中可达；③模块静态自洽（悬空 next、重复 flag）。
// 运行：node test/_audit_playthrough.cjs
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

// 无头桩（与真实 ui 行为一致，但屏蔽 DOM / 变体随机由我们可控）
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
// 变体开启（真实游玩包含变体注入）；Math.random 由种子驱动以保证可复现

// 捕获真实结局解析（与游戏 showEnding 完全一致）
var resolvedEndingId = null;
var _origShowEnding = MJ.engine.showEnding;
MJ.engine.showEnding = function (entryId) {
  resolvedEndingId = MJ.resolveEnding(this.state, entryId);
};

// 可复现 RNG
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ---------- 单局真实游玩 ----------
function runPlaythrough(seed) {
  var rng = mulberry32(seed);
  Math.random = rng; // 让变体注入也可复现
  MJ.engine.start();
  resolvedEndingId = null;
  var path = [];
  var guard = 0;
  while (guard++ < 4000) {
    if (resolvedEndingId) break;
    var ev = MJ.engine.current;
    if (!ev) break;
    var opts = MJ.engine.optionsOf(ev);
    if (!opts || !opts.length) { MJ.engine.proceed(); continue; }
    var idx = Math.floor(rng() * opts.length) % opts.length;
    path.push(ev.id + (ev.variant ? '(V)' : ''));
    MJ.engine.choose(idx);
  }
  var st = MJ.engine.state;
  return {
    ending: resolvedEndingId,
    netWorth: st.netWorth,
    wealth: st.attributes.wealth,
    debt: st.debt,
    attributes: Object.assign({}, st.attributes),
    meta: Object.assign({}, st.meta),
    flags: Object.assign({}, st.flags),
    path: path
  };
}

// ---------- 语义一致性检查 ----------
function contradictions(r) {
  var probs = [];
  var nw = r.netWorth, w = r.wealth;
  // 真正有害的矛盾：负债类结局（财务崩溃/保命负债）在玩家净资产已转正、财富属性很高时触发
  if (r.ending === 'END_FINANCIAL' || r.ending === 'END_SURVIVE_DEBT') {
    if (nw >= 0) probs.push('结局=' + r.ending + ' 但净资产=' + nw + '(≥0，财富=' + w + ')，叙事"失去一切/负债"与面板真实财富矛盾');
  }
  return probs;
}

// ---------- 1) 定向复现：短暂负债后挣回 → 仍进财务崩溃 ----------
console.log('=== 定向复现：曾负债后资产转正，仍判财务崩溃？ ===');
(function () {
  var st = new MJ.GameState();
  st.flags.thisItHeld = true;       // 玩家举办了 This Is It（held）
  st.applyMoney(-500);              // 某刻短暂跌负 → debt 置位
  st.applyMoney(20000);             // 之后挣回 +2 亿
  var e = MJ.resolveEnding(st, 'FAKE');
  console.log('  debt=' + st.debt + '  netWorth=' + st.netWorth + '(万)  wealth=' + st.attributes.wealth +
    '  → 解析结局=' + e + (e === 'END_FINANCIAL' ? '  ❌ 矛盾（资产为正却财务崩溃）' : ''));
})();

// ---------- 2) 随机真实游玩：结局分布 + 矛盾统计 + 成就可达 ----------
var N = Number(process.argv[2] || 5000);
var endingCount = {};
var achReach = {};
var contraRuns = [];
var debtStickyRuns = 0;
var minNW = {}, maxNW = {};
(MJ.config.achievements || []).forEach(function (a) { achReach[a.id] = 0; });

console.log('\n=== 随机真实游玩 ' + N + ' 局（关闭变体，隔离主线）===');
for (var i = 0; i < N; i++) {
  var r = runPlaythrough(1000 + i * 7);
  if (!r.ending) { continue; }
  endingCount[r.ending] = (endingCount[r.ending] || 0) + 1;
  if (minNW[r.ending] == null || r.netWorth < minNW[r.ending]) minNW[r.ending] = r.netWorth;
  if (maxNW[r.ending] == null || r.netWorth > maxNW[r.ending]) maxNW[r.ending] = r.netWorth;
  var probs = contradictions(r);
  if (probs.length) {
    contraRuns.push({ seed: 1000 + i * 7, ending: r.ending, netWorth: r.netWorth, wealth: r.wealth, debt: r.debt, probs: probs, path: r.path.join('→') });
  }
  if (r.debt === true && r.netWorth >= 0) debtStickyRuns++;
  var st = MJ.engine.state; // 用真实 state（含 stats.variants/events）评估成就
  (MJ.config.achievements || []).forEach(function (a) {
    try { if (a.check(st, { ending: r.ending })) achReach[a.id]++; } catch (e) {}
  });
}

console.log('\n--- 结局分布（随机主线游玩）---');
Object.keys(endingCount).sort(function (a, b) { return endingCount[b] - endingCount[a]; }).forEach(function (k) {
  console.log('  ' + k + ': ' + endingCount[k] + '  (netWorth 区间 ' + (minNW[k] != null ? minNW[k] : '?') + '~' + (maxNW[k] != null ? maxNW[k] : '?') + ')');
});
var allEndings = Object.keys(MJ.config.endings);
var missing = allEndings.filter(function (e) { return !endingCount[e]; });
console.log('  18 结局中未在随机游玩出现: ' + (missing.length ? missing.join(', ') : '无'));

console.log('\n--- 矛盾局统计 ---');
console.log('  资产转正却仍带 debt 粘性标志的局数: ' + debtStickyRuns + ' / ' + N);
console.log('  结局与财富矛盾的局数: ' + contraRuns.length);
contraRuns.slice(0, 5).forEach(function (c) {
  console.log('  [例] seed=' + c.seed + ' 结局=' + c.ending + ' netWorth=' + c.netWorth + ' wealth=' + c.wealth + ' debt=' + c.debt);
  console.log('      路径: ' + c.path);
});

console.log('\n--- 成就可达性（随机主线游玩命中次数 / ' + N + '）---');
var achMiss = [];
(MJ.config.achievements || []).forEach(function (a) {
  if (achReach[a.id] === 0) achMiss.push(a.id);
  console.log('  ' + a.id + ': ' + achReach[a.id]);
});
console.log('  随机主线 0 命中的成就: ' + (achMiss.length ? achMiss.join(', ') : '无'));

// ---------- 3) 静态自洽：悬空 next 链接 ----------
console.log('\n=== 静态检查：悬空 next 链接 ===');
var E = MJ.EVENTS;
var dangling = [];
Object.keys(E).forEach(function (id) {
  var ev = E[id];
  var targets = [];
  if (ev.next && typeof ev.next === 'string') targets.push(ev.next);
  if (ev.fallback && typeof ev.fallback === 'string') targets.push(ev.fallback);
  if (ev.options) {
    var opts = (typeof ev.options === 'function') ? ev.options({ attributes: {}, flags: {}, meta: {} }) : ev.options;
    (opts || []).forEach(function (o) {
      if (o.next && typeof o.next === 'string') targets.push(o.next);
    });
  }
  targets.forEach(function (t) {
    if (t === '__RETURN__') return;
    if (t.indexOf('END_') === 0) return; // END_* 是合法结局入口（advance→showEnding），非事件节点
    if (!E[t]) dangling.push(id + ' → ' + t);
  });
});
if (dangling.length) console.log('  ❌ 悬空链接:\n    ' + dangling.join('\n    '));
else console.log('  ✓ 无悬空 next 链接');

// ---------- 4) 静态自洽：重复 one-shot flag 频率（潜在打架） ----------
console.log('\n=== 静态检查：flag 写入频次（>1 次写入需人工核对是否打架）===');
var flagWriters = {};
Object.keys(E).forEach(function (id) {
  var ev = E[id];
  function scanFlags(fl) { if (!fl) return; Object.keys(fl).forEach(function (k) { (flagWriters[k] = flagWriters[k] || []).push(id); }); }
  scanFlags(ev.flags);
  if (ev.options) {
    var opts = (typeof ev.options === 'function') ? ev.options({ attributes: {}, flags: {}, meta: {} }) : ev.options;
    (opts || []).forEach(function (o) { scanFlags(o.flags); });
  }
});
var multi = Object.keys(flagWriters).filter(function (k) { return flagWriters[k].length > 1; });
if (multi.length) multi.forEach(function (k) { console.log('  ' + k + ': ' + flagWriters[k].join(', ')); });
else console.log('  ✓ 无被多处写入的 flag');

console.log('\nAUDIT_DONE');

// ---------- 回归门禁：矛盾局 / 悬空链接 / 粘性 debt 即 fail（稀有结局/成就未在随机主线条现属正常，不计入） ----------
var auditFailed = (contraRuns.length > 0) || (dangling.length > 0) || (debtStickyRuns > 0);
if (auditFailed) {
  console.error('FAIL 可达性/自洽审计：矛盾局=' + contraRuns.length + ' 悬空链接=' + dangling.length + ' 粘性debt=' + debtStickyRuns);
  process.exit(1);
}
console.error('PASS 可达性/自洽审计：矛盾局=0 悬空链接=0 粘性debt=0');
