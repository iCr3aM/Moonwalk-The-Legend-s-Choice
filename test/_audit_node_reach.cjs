// 节点可达性审计：用真实引擎无头驱动完整 random playthrough，
// 统计 N 局后每个事件节点（含变体）的出现率，自动标出"数值/属性门槛"节点。
// 运行：node test/_audit_node_reach.cjs [N=5000] [--low]
// 说明：随机游玩探索有限，低频 ≠ 不可达；本脚本为信息性（exit 0），供平衡调参参考。
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

var resolvedEndingId = null;
MJ.engine.showEnding = function (entryId) { resolvedEndingId = MJ.resolveEnding(this.state, entryId); };

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

var nodeSeen = {};   // 总出现次数
var nodeRuns = {};   // 出现的局数

function runPlaythrough(seed) {
  _store = {};
  var rng = mulberry32(seed);
  Math.random = rng;
  MJ.engine.start();
  resolvedEndingId = null;
  var guard = 0;
  var seenThisRun = {};
  while (guard++ < 4000) {
    if (resolvedEndingId) break;
    var ev = MJ.engine.current;
    if (!ev) break;
    nodeSeen[ev.id] = (nodeSeen[ev.id] || 0) + 1;
    seenThisRun[ev.id] = true;
    var opts = MJ.engine.optionsOf(ev);
    if (!opts || !opts.length) { MJ.engine.proceed(); continue; }
    var idx = Math.floor(rng() * opts.length) % opts.length;
    MJ.engine.choose(idx);
  }
  for (var id in seenThisRun) { if (seenThisRun.hasOwnProperty(id)) nodeRuns[id] = (nodeRuns[id] || 0) + 1; }
}

var N = Number(process.argv[2] || 5000);
var low = process.argv.includes('--low');
console.log('=== 节点可达性审计 ' + N + ' 局 ===');
for (var i = 0; i < N; i++) runPlaythrough(1000 + i * 7);

var allIds = Object.keys(MJ.EVENTS);
var never = allIds.filter(function (k) { return !nodeRuns[k]; });
var lowFreq = allIds.filter(function (k) { var c = nodeRuns[k] || 0; return c > 0 && c < N * 0.01; });

// 自动识别"数值/属性门槛"节点（cond 引用 attributes/meta/rel，而非 s.flags）
var attrGated = [];
allIds.forEach(function (k) {
  var ev = MJ.EVENTS[k];
  if (ev && typeof ev.cond === 'function') {
    var src = ev.cond.toString();
    if (/s\.attributes\.|s\.meta\.|s\.rel\b/.test(src)) attrGated.push(k);
  }
});

console.log('\n节点总数 ' + allIds.length + '；从未出现 ' + never.length + '；低频(<1%) ' + lowFreq.length);
console.log('\n--- 数值/属性门槛节点（随机游玩下天然偏低，需特定养成路线）---');
attrGated.forEach(function (k) {
  var c = nodeRuns[k] || 0;
  var cond = MJ.EVENTS[k].cond.toString().replace(/\s+/g, ' ').slice(0, 96);
  console.log('  ' + k + ': ' + c + '/' + N + ' = ' + (100 * c / N).toFixed(2) + '%  | cond: ' + cond);
});

console.log('\n--- 从未出现的节点（0%，可能需特定路线或变体窗口）---');
never.forEach(function (k) { console.log('  [0%] ' + k + '  ' + (MJ.EVENTS[k] && MJ.EVENTS[k].title || '')); });

if (low) {
  console.log('\n--- 低频节点 <1% ---');
  lowFreq.forEach(function (k) { var c = nodeRuns[k] || 0; console.log('  ' + k + ': ' + (100 * c / N).toFixed(3) + '%'); });
}
console.log('\n=== 审计完成（信息性，exit 0）===');
