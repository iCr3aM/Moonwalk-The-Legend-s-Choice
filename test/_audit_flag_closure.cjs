// flag/timeline「写-读闭合」审计（任务C）
// 规则：任何在事件/模板函数（cond/text/options/onEnter/effects，经真实加载对象的函数源码扫描）中被「读」的
//   state.flags.X / state.timeline.X，必须存在对应的「写」来源（运行时代理记录 + events/engine/planner 源静态扫描
//   + planner 动态键前缀白名单）；读了没人写 = 死门控（内容不可达）= FAIL。
// 反向「写了没人读」仅 WARN（信息型，不判失败）。
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
MJ.ui = {
  showEvent: function () {}, showEraCard: function (c, s, cb) { cb(); }, showEnding: function () {},
  toastEgg: function () {}, toastTrivia: function () {}, showModal: function () {}
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
var fs = require('fs');
var path = require('path');

// ---------- 读侧：扫描真实加载对象的函数源码 ----------
function scanReads(fnSrc, bag) {
  if (typeof fnSrc !== 'string') return;
  var m;
  var re1 = /flags\.([A-Za-z_$][\w$]*)/g;
  while ((m = re1.exec(fnSrc))) bag.flags[m[1]] = true;
  var re2 = /flags\[\s*(['"])([^'"]+)\1\s*\]/g;
  while ((m = re2.exec(fnSrc))) bag.flags[m[2]] = true;
  var re3 = /timeline\.([A-Za-z_$][\w$]*)/g;
  while ((m = re3.exec(fnSrc))) bag.timeline[m[1]] = true;
  var re4 = /timeline\[\s*(['"])([^'"]+)\1\s*\]/g;
  while ((m = re4.exec(fnSrc))) bag.timeline[m[2]] = true;
}
var reads = { flags: {}, timeline: {}, where: {} };
function addRead(kind, key, where) {
  reads[kind][key] = true;
  if (!reads.where[kind + '|' + key]) reads.where[kind + '|' + key] = [];
  if (reads.where[kind + '|' + key].length < 3 && reads.where[kind + '|' + key].indexOf(where) < 0) reads.where[kind + '|' + key].push(where);
}
Object.keys(MJ.EVENTS).forEach(function (id) {
  var ev = MJ.EVENTS[id];
  ['cond', 'onEnter', 'text', 'options', 'effects'].forEach(function (f) {
    if (typeof ev[f] === 'function') {
      var src = ev[f].toString();
      var bag = { flags: {}, timeline: {} };
      scanReads(src, bag);
      Object.keys(bag.flags).forEach(function (k) { addRead('flags', k, id + '.' + f); });
      Object.keys(bag.timeline).forEach(function (k) { addRead('timeline', k, id + '.' + f); });
    }
  });
});
// 配置模板 cond（尾声/独白扩写/命运回响/手记）
var cfgTplLists = [
  ['epilogueTailTemplates', (MJ.config.epilogueTailTemplates || [])],
  ['monologueExtTemplates', (MJ.config.monologueExtTemplates || [])],
  ['echoTemplates', (MJ.config.echoTemplates || [])]
];
cfgTplLists.forEach(function (pair) {
  pair[1].forEach(function (t, i) {
    if (t && typeof t.cond === 'function') {
      var bag = { flags: {}, timeline: {} };
      scanReads(t.cond.toString(), bag);
      Object.keys(bag.flags).forEach(function (k) { addRead('flags', k, pair[0] + '[' + i + ']'); });
      Object.keys(bag.timeline).forEach(function (k) { addRead('timeline', k, pair[0] + '[' + i + ']'); });
    }
  });
});
// engine.js 内的读取（resolveEnding / resolveAltEnding 等）：扫引擎源码中的 flags/timeline 引用
var engineSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'engine.js'), 'utf8');
(function () {
  var bag = { flags: {}, timeline: {} };
  scanReads(engineSrc, bag);
  // engine.js 内别名读取：var tl = state.timeline; tl['1975'] …
  var m;
  var reTlAlias = /\btl\[\s*(['"])([^'"]+)\1\s*\]/g;
  while ((m = reTlAlias.exec(engineSrc))) bag.timeline[m[2]] = true;
  var reFAlias = /\bf\.([A-Za-z_$][\w$]*)/g;
  while ((m = reFAlias.exec(engineSrc))) bag.flags[m[1]] = true;
  Object.keys(bag.flags).forEach(function (k) { addRead('flags', k, 'engine.js'); });
  Object.keys(bag.timeline).forEach(function (k) { addRead('timeline', k, 'engine.js'); });
})();
// config.js 内的读取（成就 check / 命运回响 / 手记 cond 等）
(function () {
  var cfgSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'config.js'), 'utf8');
  var bag = { flags: {}, timeline: {} };
  scanReads(cfgSrc, bag);
  Object.keys(bag.flags).forEach(function (k) { addRead('flags', k, 'config.js'); });
  Object.keys(bag.timeline).forEach(function (k) { addRead('timeline', k, 'config.js'); });
})();

// ---------- 写侧 A：运行时代理记录（真实引擎驱动 1500 局） ----------
var runtimeWrites = { flags: {}, timeline: {} };
function runOnce(seed) {
  var rng = mulberry32(seed);
  Math.random = rng;
  MJ.engine.start();
  resolvedEndingId = null;
  var st = MJ.engine.state;
  st.flags = new Proxy(st.flags, {
    set: function (t, k, v) { runtimeWrites.flags[k] = true; t[k] = v; return true; },
    deleteProperty: function (t, k) { runtimeWrites.flags[k] = true; delete t[k]; return true; }
  });
  st.timeline = new Proxy(st.timeline, {
    set: function (t, k, v) { runtimeWrites.timeline[k] = true; t[k] = v; return true; }
  });
  var guard = 0;
  while (guard++ < 4000) {
    if (resolvedEndingId) break;
    var ev = MJ.engine.current;
    if (!ev) break;
    var opts = MJ.engine.optionsOf(ev);
    if (!opts || !opts.length) { MJ.engine.proceed(); continue; }
    MJ.engine.choose(Math.floor(rng() * opts.length) % opts.length);
  }
  // 结局后状态若仍存活，续记写入（部分 flag 在结尾链路写入）
  return resolvedEndingId;
}
var N = Number(process.argv[2] || 1500);
for (var i = 0; i < N; i++) runOnce(510000 + i);

// ---------- 写侧 B：源码静态扫描（events/engine/planner 中选项 flags:{}/timeline:{}/直接赋值） ----------
var staticWrites = { flags: {}, timeline: {} };
['events', 'engine', 'planner'].forEach(function (name) {
  var src = fs.readFileSync(path.join(__dirname, '..', 'js', name + '.js'), 'utf8');
  var m;
  // 选项级 flags: { a: true, b: 1 }
  var reFlagsObj = /flags:\s*\{([^{}]*)\}/g;
  while ((m = reFlagsObj.exec(src))) {
    var reKey = /([A-Za-z_$][\w$]*)\s*:/g, k;
    while ((k = reKey.exec(m[1]))) staticWrites.flags[k[1]] = true;
  }
  // 直接赋值 state.flags.X = / flags[fk] = / state.flags['x'] =
  var reDirect = /flags\.([A-Za-z_$][\w$]*)\s*=/g;
  while ((m = reDirect.exec(src))) staticWrites.flags[m[1]] = true;
  var reBracket = /flags\[\s*(['"])([^'"]+)\1\s*\]\s*=/g;
  while ((m = reBracket.exec(src))) staticWrites.flags[m[2]] = true;
  // timeline 写入：timeline: { '1979': 'x' } 与 state.timeline['k'] =
  var reTlObj = /timeline:\s*\{([^{}]*)\}/g;
  while ((m = reTlObj.exec(src))) {
    var reTk = /(['"])([^'"]+)\1\s*:/g, tk;
    while ((tk = reTk.exec(m[1]))) staticWrites.timeline[tk[2]] = true;
  }
  var reTlDirect = /timeline\.([A-Za-z_$][\w$]*)\s*=/g;
  while ((m = reTlDirect.exec(src))) staticWrites.timeline[m[1]] = true;
  var reTlBracket = /timeline\[\s*(['"])([^'"]+)\1\s*\]\s*=/g;
  while ((m = reTlBracket.exec(src))) staticWrites.timeline[m[2]] = true;
});

// planner 动态键前缀白名单（grammy_<key>/grammyCats_<key>/_gresolved_<key> 运行期拼接）
var DYNAMIC_PREFIXES = ['grammy_', 'grammyCats_', '_gresolved_', 'cp_'];
function isWritten(kind, key) {
  if (staticWrites[kind][key] || runtimeWrites[kind][key]) return true;
  for (var i = 0; i < DYNAMIC_PREFIXES.length; i++) {
    if (key.indexOf(DYNAMIC_PREFIXES[i]) === 0) return true;
  }
  return false;
}

// ---------- 闭合判定 ----------
var deadReads = [];
Object.keys(reads.flags).forEach(function (k) {
  if (!isWritten('flags', k)) deadReads.push('flags.' + k + '  读取于: ' + reads.where['flags|' + k].join(', '));
});
Object.keys(reads.timeline).forEach(function (k) {
  if (!isWritten('timeline', k)) deadReads.push('timeline.' + k + '  读取于: ' + reads.where['timeline|' + k].join(', '));
});
// 反向信息项：写了从未读（仅提示）
var unusedWrites = [];
Object.keys(staticWrites.flags).forEach(function (k) { if (!reads.flags[k]) unusedWrites.push('flags.' + k); });
Object.keys(staticWrites.timeline).forEach(function (k) { if (!reads.timeline[k]) unusedWrites.push('timeline.' + k); });

console.log('=== flag/timeline 写-读闭合审计 ===');
console.log('运行局数=' + N + '；读侧：flags ' + Object.keys(reads.flags).length + ' 个 / timeline ' + Object.keys(reads.timeline).length + ' 个键');
console.log('写侧：静态 flags ' + Object.keys(staticWrites.flags).length + ' / timeline ' + Object.keys(staticWrites.timeline).length +
  '；运行时新增 flags ' + Object.keys(runtimeWrites.flags).length + ' / timeline ' + Object.keys(runtimeWrites.timeline).length);
if (deadReads.length) {
  console.error('FAIL 死门控（读而无写，内容不可达）' + deadReads.length + ' 项：');
  deadReads.forEach(function (d) { console.error('  ✗ ' + d); });
  process.exit(1);
}
console.log('WARN 写而未读（信息型，不影响通过）' + unusedWrites.length + ' 项：' + unusedWrites.slice(0, 20).join(', ') + (unusedWrites.length > 20 ? ' …' : ''));
console.log('PASS flag/timeline 写-读闭合：全部读取键均有写入来源，无死门控');
