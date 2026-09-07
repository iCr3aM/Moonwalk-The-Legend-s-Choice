// 概率平衡 / 可达性校准（信息型 + 部分硬门禁）：
//   用固定种子 RNG 跑 N 局随机游戏（变体开启），统计：
//   1) 每个变体的实际触发率（triggers/N），用于校准 weight；
//   2) 主线年份的"变体密度"，抓「变体荒漠」（某年无任何变体覆盖）；
//   3) 结局分布（信息）。
//   硬门禁：宽窗口(>=2 年)且覆盖主线年、却在 N 局中 0 触发的变体 → FAIL（实际不可达）。
//   用法：node test/check_balance_reach.cjs  （建议接入 npm test）
global.window = global;
var _store = {};
global.localStorage = { getItem: function (k) { return _store[k] != null ? _store[k] : null; }, setItem: function (k, v) { _store[k] = String(v); }, removeItem: function (k) { delete _store[k]; } };
require('../js/config.js'); require('../js/state.js'); require('../js/i18n.js'); require('../js/i18n_events_en.js'); require('../js/engine.js'); require('../js/events.js'); require('../js/planner.js');
var MJ = global.MJ;

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rng = mulberry32(0x9E3779B9);
Math.random = rng; // 固定引擎内部变体选择 RNG，消除可达性门禁的随机抖动（V_MJFRIENDS 等宽窗口低触发率变体偶发 0 触发）

var _cur = null;
MJ.ui = {
  showEvent: function (ev) { _cur = ev; },
  showEnding: function (id) { _cur = { kind: 'ended', id: id }; },
  showEraCard: function (c, s, onContinue) { onContinue(); }
};
var triggers = {};
var _orig = MJ.engine.pickVariant;
MJ.engine.pickVariant = function (year) { var vid = _orig.call(MJ.engine, year); if (vid) triggers[vid] = (triggers[vid] || 0) + 1; return vid; };
var _origF = MJ.engine._findForcedVariant;
MJ.engine._findForcedVariant = function (year) { var vid = _origF.call(MJ.engine, year); if (vid) triggers[vid] = (triggers[vid] || 0) + 1; return vid; };

function play() {
  MJ.engine.start();
  var g = 0;
  while (g++ < 2000) {
    if (!_cur) return { ok: false, why: 'noev' };
    if (_cur.kind === 'ended') return { ok: true, ending: _cur.id };
    if (_cur.kind === 'ending') { MJ.engine.finishEnding(); continue; }
    if (_cur.kind === 'auto') { MJ.engine.proceed(); continue; }
    if (_cur.kind === 'choice') { var os = MJ.engine.optionsOf(_cur); MJ.engine.choose(Math.floor(rng() * os.length)); continue; }
    return { ok: false, why: _cur.kind };
  }
  return { ok: false, why: 'guard' };
}

var N = 5000;
var endings = {}, errs = 0;
for (var i = 0; i < N; i++) {
  try {
    var r = play();
    if (!r.ok) { errs++; console.log('PLAY FAIL', i, r); break; }
    endings[r.ending] = (endings[r.ending] || 0) + 1;
  } catch (e) { errs++; console.log('THROW', i, e && e.stack); break; }
}

var all = Object.keys(MJ.EVENTS).map(function (k) { return MJ.EVENTS[k]; }).filter(function (e) { return e && e.variant; });
var mainlineYears = {};
Object.keys(MJ.EVENTS).forEach(function (k) { var e = MJ.EVENTS[k]; if (e && !e.variant && typeof e.year === 'number') mainlineYears[e.year] = true; });
var years = Object.keys(mainlineYears).map(Number);
var minY = Math.min.apply(null, years), maxY = Math.max.apply(null, years);

function coversMainline(v) { if (!v.window) return false; for (var y = v.window[0]; y <= v.window[1]; y++) if (mainlineYears[y]) return true; return false; }

// 年份密度
var density = {}; for (var y = minY; y <= maxY; y++) density[y] = 0;
all.forEach(function (v) { if (!v.window) return; for (var y = v.window[0]; y <= v.window[1]; y++) if (density[y] != null) density[y]++; });
var emptyYears = []; for (var y = minY; y <= maxY; y++) if (density[y] === 0) emptyYears.push(y);
var maxDens = 0; for (var y = minY; y <= maxY; y++) if (density[y] > maxDens) maxDens = density[y];

// 变体触发表（按触发次数降序）
var rows = all.map(function (v) { return { id: v.id, win: v.window, w: v.weight, t: triggers[v.id] || 0 }; });
rows.sort(function (a, b) { return b.t - a.t; });
console.log('变体触发率（N=' + N + '）：');
rows.forEach(function (r) {
  var flag = (r.t === 0 && coversMainline({ window: r.win })) ? '  <== 0 触发(需确认)' : '';
  console.log('  ' + r.id + '  w=' + r.w + '  win=[' + r.win + ']  触发=' + r.t + '  率=' + (r.t / N * 100).toFixed(2) + '%' + flag);
});

var interiorEmpty = emptyYears.filter(function (y) { return y >= minY; });
console.log('\n年份变体密度：' + minY + '~' + maxY + '；峰值=' + maxDens + '；' + (interiorEmpty.length ? ('主线区间内荒漠年份(0 覆盖)=' + interiorEmpty.join(',')) : '主线区间内无荒漠年份（开场 ' + emptyYears.join(',') + ' 为脚本化序章，无变体属正常）'));
console.log('结局分布（' + Object.keys(endings).length + '/18 出现）：' + JSON.stringify(endings));

var fail = 0;
if (errs) { console.log('FAIL 随机对局异常 ' + errs + ' 次'); fail = 1; }
rows.forEach(function (r) {
  var span = r.win[1] - r.win[0] + 1;
  if (r.t === 0 && coversMainline({ window: r.win }) && span >= 2) { console.log('FAIL 变体实际不可达(宽窗口仍 0 触发): ' + r.id + ' ' + JSON.stringify(r.win)); fail = 1; }
});
// 阶段 4 回归门禁：7 个 alt（假设线）结局必须在真实游玩中至少现身一次；
// 防止「可达性门禁仅测直接求值、未测真实写入」类回归（如 STAY_MOTOWN=0）。
for (var eid in MJ.config.endings) {
  if (!MJ.config.endings.hasOwnProperty(eid) || eid.indexOf('END_ALT_') !== 0) continue;
  if ((endings[eid] || 0) === 0) { console.log('FAIL 架空(alt)结局在真实游玩中 0 现身：' + eid); fail = 1; }
}
if (interiorEmpty.length) console.log('WARN 存在变体荒漠年份：' + interiorEmpty.join(','));

console.log('\n概率平衡/可达性校准：' + (fail ? 'FAIL' : 'PASS（信息型报告，详见上）'));
process.exit(fail ? 1 : 0);
