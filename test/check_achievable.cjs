/* 可达性探针：用"贪心精工/艺术"策略跑 N 局，报告即便最优玩法仍为 0% 的成就。
 * 用于区分「真·不可达成 bug」与「随机稀少 / 跨周目设计」。
 */
global.window = global;
var _store = {};
global.localStorage = { getItem: function (k) { return _store[k] != null ? _store[k] : null; }, setItem: function (k, v) { _store[k] = String(v); }, removeItem: function (k) { delete _store[k]; } };
require('../js/config.js'); require('../js/state.js'); require('../js/engine.js'); require('../js/events.js'); require('../js/planner.js');
MJ.saveSystem.save = function () {};
var _cur = null;
MJ.ui = { showEvent: function (ev) { _cur = ev; }, showEnding: function (id) { _cur = { kind: 'ended', id: id }; }, showEraCard: function (c, s, cb) { cb(); } };

function greedy(ev, opts, state) {
  var best = -1, bi = 0;
  opts.forEach(function (o, idx) {
    var score = 0;
    if (o.flags) for (var k in o.flags) if (k.indexOf('cp_') === 0) score += o.flags[k];
    if (o.effects) { var e = (typeof o.effects === 'function') ? o.effects(state) : o.effects; score += (e.art || 0) * 1.5 + (e.reputation || 0) + (e.family || 0) * 0.4; }
    if (score > best) { best = score; bi = idx; }
  });
  return bi;
}
function play() {
  MJ.engine.start();
  var g = 0;
  while (g++ < 2000) {
    if (!_cur) return null;
    if (_cur.kind === 'ended') return _cur.id;
    if (_cur.kind === 'ending') { MJ.engine.finishEnding(); continue; }
    if (_cur.kind === 'auto') { MJ.engine.proceed(); continue; }
    if (_cur.kind === 'choice') { MJ.engine.choose(greedy(_cur, MJ.engine.optionsOf(_cur), MJ.engine.state)); continue; }
    return null;
  }
  return null;
}
var N = 1500, achs = MJ.config.achievements, hit = {};
achs.forEach(function (a) { hit[a.id] = 0; });
var endings = {};
for (var t = 0; t < N; t++) {
  var e = play(); if (!e) { console.error('PLAY FAIL', t); process.exit(1); }
  endings[e] = (endings[e] || 0) + 1;
  var s = MJ.engine.state;
  achs.forEach(function (a) { try { if (a.check(s, { ending: e })) hit[a.id]++; } catch (_) {} });
}
console.log('贪心策略 N=' + N + ' 仍为 0% 的成就（排除已知的跨周目项）：');
achs.forEach(function (a) {
  if (hit[a.id] === 0) {
    var note = { ACH_ALL_ENDINGS: '跨周目(解锁全部结局)', ACH_EGG_HUNTER: '跨周目(集齐彩蛋)', ACH_SMOOTH: '跨周目(月球漫步≥2次)' }[a.id] || '';
    console.log('  ' + a.id + ' [' + a.rarity + ']  ' + (note ? '(' + note + ')' : '⚠ 需排查'));
  }
});
console.log('--- 贪心下仍触发(>0)的代表项 ---');
['ACH_GRAMMY_SWEEP', 'ACH_GRAMMY_LEGEND', 'ACH_CHARITY_CONCERT', 'ACH_CATALOG_KING', 'ACH_DANCE_GOD', 'ACH_BALANCED', 'ACH_MEDIA_DARLING', 'ACH_TRUE_ETERNAL', 'ACH_BROTHERLY', 'ACH_LONELY_KING'].forEach(function (id) {
  console.log('  ' + id + ': ' + hit[id] + '/' + N);
});
