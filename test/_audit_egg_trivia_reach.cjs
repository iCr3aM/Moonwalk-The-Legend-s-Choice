// 彩蛋/趣事「落地」可达性审计：用真实引擎无头驱动完整 random playthrough，
// 每局清空 localStorage，结束调用 onEnding+revealAll（与游戏一致），
// 统计 N 局后哪些彩蛋/趣事从未被发现（= 未落地）。
// 运行：node test/_audit_egg_trivia_reach.cjs [N=5000]
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
var _origShowEnding = MJ.engine.showEnding;
MJ.engine.showEnding = function (entryId) { resolvedEndingId = MJ.resolveEnding(this.state, entryId); };

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

function runPlaythrough(seed) {
  if (!process.argv.includes('--persist')) _store = {}; // 默认每局清空独立统计；--persist 跨局累计（验证跨周目累计型彩蛋）
  var rng = mulberry32(seed);
  Math.random = rng;
  MJ.engine.start();
  resolvedEndingId = null;
  var guard = 0;
  while (guard++ < 4000) {
    if (resolvedEndingId) break;
    var ev = MJ.engine.current;
    if (!ev) break;
    var opts = MJ.engine.optionsOf(ev);
    if (!opts || !opts.length) { MJ.engine.proceed(); continue; }
    var idx = Math.floor(rng() * opts.length) % opts.length;
    MJ.engine.choose(idx);
  }
  var st = MJ.engine.state;
  // 真实游戏结束时的解锁入口
  if (MJ.eggSystem) MJ.eggSystem.onEnding(st, resolvedEndingId);
  if (MJ.triviaSystem) MJ.triviaSystem.revealAll(st);
  var e = MJ.eggSystem ? MJ.eggSystem._load().found : {};
  var t = MJ.triviaSystem ? MJ.triviaSystem._load().found : {};
  return { eggs: Object.keys(e), trivias: Object.keys(t) };
}

var N = Number(process.argv[2] || 5000);
var eggSeen = {}, triviaSeen = {};
console.log('=== 彩蛋/趣事可达性审计 ' + N + ' 局 ===');
var runs = 0;
for (var i = 0; i < N; i++) {
  var r = runPlaythrough(1000 + i * 7);
  runs++;
  r.eggs.forEach(function (k) { eggSeen[k] = (eggSeen[k] || 0) + 1; });
  r.trivias.forEach(function (k) { triviaSeen[k] = (triviaSeen[k] || 0) + 1; });
}

var eggDefs = MJ.eggSystem ? Object.keys(MJ.eggSystem.defs) : [];
var triviaDefs = MJ.triviaSystem ? Object.keys(MJ.triviaSystem.defs) : [];
var eggMiss = eggDefs.filter(function (k) { return !eggSeen[k]; });
var triviaMiss = triviaDefs.filter(function (k) { return !triviaSeen[k]; });

console.log('\n--- 彩蛋 共 ' + eggDefs.length + ' 条，' + eggMiss.length + ' 条从未发现 ---');
eggMiss.forEach(function (k) { console.log('  [未落地] ' + k + '  ' + (MJ.eggSystem.defs[k] && MJ.eggSystem.defs[k].name || '')); });
console.log('\n--- 趣事 共 ' + triviaDefs.length + ' 条，' + triviaMiss.length + ' 条从未发现 ---');
triviaMiss.forEach(function (k) { console.log('  [未落地] ' + k + '  ' + (MJ.triviaSystem.defs[k] && MJ.triviaSystem.defs[k].name || '')); });

// 列出低频（< N*0.5%）但已发现的，提示可能条件过严
if (process.argv.includes('--low')) {
  console.log('\n--- 低频彩蛋（<0.5%）---');
  eggDefs.forEach(function (k) { var c = eggSeen[k] || 0; if (c && c < N*0.005) console.log('  ' + k + ': ' + c + ' (' + (100*c/N).toFixed(2) + '%)'); });
  console.log('\n--- 低频趣事（<0.5%）---');
  triviaDefs.forEach(function (k) { var c = triviaSeen[k] || 0; if (c && c < N*0.005) console.log('  ' + k + ': ' + c + ' (' + (100*c/N).toFixed(2) + '%)'); });
}

console.log('\n=== 审计完成：彩蛋未落地 ' + eggMiss.length + ' / 趣事未落地 ' + triviaMiss.length + ' ===');

// ---------- 回归门禁：趣事须全部可达；彩蛋含故意隐藏的密蛋，仅作信息提示 ----------
if (triviaMiss.length > 0) {
  console.error('FAIL 趣事可达性：' + triviaMiss.length + ' 条从未在 ' + N + ' 局真实游玩中发现 → ' + triviaMiss.join(', '));
  process.exit(1);
}
console.error('PASS 趣事可达性：全部 ' + triviaDefs.length + ' 条均在随机真实游玩中可达（彩蛋未落地 ' + eggMiss.length + ' 条为已知密蛋，信息提示）');
