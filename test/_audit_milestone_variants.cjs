// P3 里程碑变体可达性审计：用真实引擎无头驱动 random playthrough，
// 统计 N 局中 V_CHILD_PRINCE / V_CHILD_PARIS / V_MJFRIENDS 是否出现。
// 修复前（pickVariant 随机 + Ch6 每章上限饱和）触发率仅 ~0.1%；
// 改 force + 注入级 cond（绕过 cap 必现）后应稳定出现。
// 运行：node test/_audit_milestone_variants.cjs [N=5000]
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

MJ.localizeEvent = function (ev, state) {
  var st = state || (MJ.engine && MJ.engine.state) || {};
  var copy = Object.assign({}, ev);
  if (typeof copy.options === 'function') copy.options = copy.options(st);
  if (typeof copy.text === 'function') copy.text = copy.text(st);
  return copy;
};
MJ.ui = { showEvent: function(){}, showEraCard: function(c,s,cb){cb();}, showEnding: function(){}, toastEgg: function(){}, toastTrivia: function(){}, showModal: function(){} };

var MILESTONES = ['V_CHILD_PRINCE', 'V_CHILD_PARIS', 'V_MJFRIENDS'];

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

function runPlaythrough(seed) {
  _store = {}; // 每局清空独立统计
  var rng = mulberry32(seed);
  Math.random = rng;
  MJ.engine.start();
  var resolvedEndingId = null;
  var _origShowEnding = MJ.engine.showEnding;
  MJ.engine.showEnding = function (entryId) { resolvedEndingId = MJ.resolveEnding(this.state, entryId); };
  var seen = {};
  var guard = 0;
  while (guard++ < 4000) {
    if (resolvedEndingId) break;
    var ev = MJ.engine.current;
    if (!ev) break;
    if (MILESTONES.indexOf(ev.id) >= 0) seen[ev.id] = true;
    var opts = MJ.engine.optionsOf(ev);
    if (!opts || !opts.length) { MJ.engine.proceed(); continue; }
    var idx = Math.floor(rng() * opts.length) % opts.length;
    MJ.engine.choose(idx);
  }
  return seen;
}

var N = Number(process.argv[2] || 5000);
var seenCount = { V_CHILD_PRINCE: 0, V_CHILD_PARIS: 0, V_MJFRIENDS: 0 };
console.log('=== P3 里程碑变体可达性审计 ' + N + ' 局 ===');
for (var i = 0; i < N; i++) {
  var s = runPlaythrough(1000 + i * 7);
  MILESTONES.forEach(function (k) { if (s[k]) seenCount[k]++; });
}

MILESTONES.forEach(function (k) {
  var r = seenCount[k] / N;
  console.log('  ' + k + ': ' + seenCount[k] + ' / ' + N + ' = ' + (100 * r).toFixed(2) + '%');
});

// 门禁：修复后每变体应显著可见（远高于修复前 ~0.1%）。阈值取 1%（保守，实际应达两位数百分比）。
var fail = MILESTONES.filter(function (k) { return seenCount[k] / N < 0.01; });
if (fail.length) {
  console.error('FAIL P3 里程碑变体可达性：' + fail.join(', ') + ' 触发率 < 1%（修复未达预期）');
  process.exit(1);
}
console.error('PASS P3 里程碑变体可达性：三变体均稳定出现（详见上方比率，均远高于修复前 ~0.1%）');
